/* Keeps the phone and the cloud account the same. It sends what changed here, takes in what changed elsewhere, and remembers what
 * both sides agreed on last (the "base"), so only differences travel. The cloud is the place the data is safe; the phone keeps a copy
 * so the app is instant and works without internet.
 */
import { useSyncExternalStore } from "react";
import { clearSyncMeta, getSyncMeta, setSyncMeta } from "../data/db.ts";
import { applyRemote, getState, getSyncData, resetAll, subscribeStore } from "../data/store.ts";
import { pushAndPull, refreshToken, SignedOut, type Incoming } from "./api.ts";
import { syncConfigured } from "./config.ts";
import { fingerprintOf, planSync, type Base, type Outgoing } from "./plan.ts";
import { recordKey, toRecords } from "./records.ts";
import { getSession, setSession, type Session } from "./session.ts";

/** At most this many records go in one request (the cloud's own limit). */
const BATCH_SIZE = 500;
/** After a change, wait for more before saving, so a burst of taps is one request. */
const SAVE_AFTER_MS = 1500;
/** While the app is open, look for changes made on another device this often. */
const POLL_MS = 60_000;

interface Meta {
  owner: string;
  ownerEmail: string;
  cursor: number;
  base: Base;
  lastSyncedAt: number | null;
}

export type Blocked = { kind: "mismatch"; ownerEmail: string } | { kind: "failed" } | null;

export interface SyncStatus {
  /** What the phone remembers about its link has been read. */
  metaLoaded: boolean;
  /** This phone's data already belongs to the signed-in account. */
  linked: boolean;
  /** The phone and the account have agreed at least once since the app opened. */
  firstSyncDone: boolean;
  syncing: boolean;
  /** The last try could not reach the cloud. */
  offline: boolean;
  lastSyncedAt: number | null;
  /** Records waiting to be saved to the account. */
  pending: number;
  blocked: Blocked;
}

const INITIAL: SyncStatus = { metaLoaded: false, linked: false, firstSyncDone: false, syncing: false, offline: false, lastSyncedAt: null, pending: 0, blocked: null };

let status: SyncStatus = INITIAL;
let meta: Meta | null = null;
const listeners = new Set<() => void>();

function setStatus(patch: Partial<SyncStatus>): void {
  status = { ...status, ...patch };
  listeners.forEach((l) => l());
}

export const getSyncStatus = (): SyncStatus => status;

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => void listeners.delete(l);
  }, getSyncStatus);
}

/** Which screen the app shows: its own, or one of the steps before it. */
export type Gate = "open" | "loading" | "signin" | "mismatch" | "retry";

export function gateFor({ configured, session, syncStatus, localOnly = false }: { configured: boolean; session: Session | null; syncStatus: SyncStatus; localOnly?: boolean }): Gate {
  if (!configured) return "open";
  // Someone who chose to keep their data on the phone is not asked again; signed in, the account is used.
  if (!session) return localOnly ? "open" : "signin";
  if (!syncStatus.metaLoaded) return "loading";
  if (syncStatus.blocked?.kind === "mismatch") return "mismatch";
  // A phone that already holds this account's data opens at once, offline or not; a new one has to hear from the cloud first.
  if (syncStatus.linked || syncStatus.firstSyncDone) return "open";
  return syncStatus.blocked?.kind === "failed" ? "retry" : "loading";
}

async function loadMeta(): Promise<void> {
  meta = (await getSyncMeta<Meta>()) ?? null;
  const session = getSession();
  setStatus({ metaLoaded: true, linked: !!meta && meta.owner === session?.user.id, lastSyncedAt: meta?.lastSyncedAt ?? null });
}

async function saveMeta(next: Meta): Promise<void> {
  meta = next;
  await setSyncMeta(next);
}

/** What is waiting to be saved to the account: how many records differ from what it last held. */
function pendingCount(): number {
  return planSync(toRecords(getSyncData(getState())), meta?.base ?? {}, Date.now(), true).changes.length;
}

const asIncoming = (changes: Incoming[]) => changes.map(({ kind, id, data }) => ({ kind, id, data }));

let running: Promise<void> | null = null;
let again = false;

/** One round with the cloud. Overlapping calls are folded into one more round after it. */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = round().finally(() => {
    running = null;
    if (again) {
      again = false;
      void syncNow();
    }
  });
  return running;
}

async function round(): Promise<void> {
  const session = getSession();
  if (!syncConfigured() || !session || !status.metaLoaded || !getState().ready) return;
  if (meta && meta.owner !== session.user.id) {
    setStatus({ blocked: { kind: "mismatch", ownerEmail: meta.ownerEmail } });
    return;
  }
  setStatus({ syncing: true });
  try {
    const linked = meta !== null;
    const base: Base = meta?.base ?? {};
    const plan = planSync(toRecords(getSyncData(getState())), base, Date.now(), linked);
    const queue: Outgoing[] = [...plan.changes];
    const incoming: Incoming[] = [];
    let cursor = meta?.cursor ?? 0;

    do {
      let reply = await pushAndPull(session, cursor, queue.splice(0, BATCH_SIZE));
      incoming.push(...reply.changes);
      cursor = reply.cursor;
      while (reply.more) {
        reply = await pushAndPull(session, cursor, []);
        incoming.push(...reply.changes);
        cursor = reply.cursor;
      }
    } while (queue.length > 0);

    applyRemote(asIncoming(incoming));
    // What came from the cloud is what the cloud holds, so it is not sent back; what was sent is what it holds now.
    const nextBase = { ...plan.nextBase };
    for (const change of incoming) {
      const key = recordKey(change.kind, change.id);
      if (change.data) nextBase[key] = fingerprintOf(change);
      else delete nextBase[key];
    }
    const lastSyncedAt = Date.now();
    await saveMeta({ owner: session.user.id, ownerEmail: session.user.email, cursor, base: nextBase, lastSyncedAt });
    setStatus({ syncing: false, offline: false, linked: true, firstSyncDone: true, lastSyncedAt, pending: pendingCount(), blocked: null });
  } catch (error) {
    if (error instanceof SignedOut) {
      setSession(null);
      setStatus({ syncing: false });
      return;
    }
    setStatus({ syncing: false, offline: true, pending: pendingCount(), blocked: status.firstSyncDone || status.linked ? status.blocked : { kind: "failed" } });
  }
}

/** The person signed in on this phone: reads the link, and starts saving. */
export async function startSync(): Promise<void> {
  const session = getSession();
  if (!session) return;
  await loadMeta();
  if (meta && meta.owner !== session.user.id) {
    setStatus({ blocked: { kind: "mismatch", ownerEmail: meta.ownerEmail } });
    return;
  }
  void refreshToken(session).then((fresh) => setSession(fresh)).catch((error: unknown) => {
    if (error instanceof SignedOut) setSession(null);
  });
  await syncNow();
}

/** The phone holds another account's data: erase it here (it is safe in that account) and carry on with this one. */
export async function eraseForMismatch(): Promise<void> {
  resetAll();
  await clearSyncMeta();
  meta = null;
  setStatus({ blocked: null, linked: false, firstSyncDone: false, pending: 0 });
  await syncNow();
}

/**
 * Signing out takes the data off the phone, so it first checks that the account has everything. Returns false, and changes nothing,
 * when something could not be saved.
 */
export async function signOutSafely(): Promise<boolean> {
  await syncNow();
  if (pendingCount() > 0 || status.offline) return false;
  setSession(null);
  resetAll();
  await clearSyncMeta();
  meta = null;
  status = { ...INITIAL, metaLoaded: true };
  listeners.forEach((l) => l());
  return true;
}

/** Retries after the first attempt on a new phone failed. */
export function retryFirstSync(): Promise<void> {
  setStatus({ blocked: null });
  return syncNow();
}

let started = false;

/** Called once when the app opens. Saves a moment after each change, when the phone is back online, and on a timer while it is open. */
export function watchChanges(): void {
  if (started) return;
  started = true;
  let timer: number | undefined;
  subscribeStore(() => {
    if (!getSession() || !getState().ready || !status.metaLoaded) return;
    const pending = pendingCount();
    if (pending !== status.pending) setStatus({ pending });
    if (pending === 0) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void syncNow(), SAVE_AFTER_MS);
  });
  window.addEventListener("online", () => void syncNow());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void syncNow();
  });
  window.setInterval(() => {
    if (document.visibilityState === "visible") void syncNow();
  }, POLL_MS);
}
