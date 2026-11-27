/* Talking to the sync Worker. Nothing here knows about the app's data: it sends and receives records. */
import { SYNC_API_URL } from "./config.ts";
import type { Outgoing } from "./plan.ts";
import type { RecordKind, RecordData } from "./records.ts";
import type { Session, SyncUser } from "./session.ts";

/** The cloud no longer accepts the token: the person has to sign in again. */
export class SignedOut extends Error {}
/** The cloud could not be reached, or answered with something unexpected. */
export class Unreachable extends Error {}

export interface Incoming {
  kind: RecordKind;
  id: string;
  data: RecordData | null;
  updatedAt: number;
  seq: number;
}

export interface SyncReply {
  cursor: number;
  more: boolean;
  changes: Incoming[];
}

interface SignInReply {
  token: string;
  user: SyncUser;
}

async function call<T>(path: string, body: unknown, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${SYNC_API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Unreachable();
  }
  if (response.status === 401) throw new SignedOut();
  if (!response.ok) throw new Unreachable();
  try {
    return (await response.json()) as T;
  } catch {
    throw new Unreachable();
  }
}

export const signInWithGoogle = (idToken: string): Promise<Session> => call<SignInReply>("/auth/google", { idToken });
export const signInForDevelopment = (email: string): Promise<Session> => call<SignInReply>("/auth/dev", { email });
export const refreshToken = async (session: Session): Promise<Session> => ({ ...session, token: (await call<{ token: string }>("/auth/refresh", {}, session.token)).token });

export function pushAndPull(session: Session, cursor: number, changes: Outgoing[]): Promise<SyncReply> {
  return call<SyncReply>("/sync", { cursor, changes }, session.token);
}
