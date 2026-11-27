/* Builds the reply from what the database returned: pure, so the pagination rules can be tested alone. */
import { MAX_REPLY_CHANGES } from "../constants.ts";
import { recordKeyOf, type OutgoingChange, type SyncReply } from "./types.ts";

export interface ReplyInput {
  /** The request's cursor. */
  requestCursor: number;
  /** The user's seq after this request's writes. */
  seqAfter: number;
  /** Records with seq > cursor that this request did not write, in seq order. */
  newerOnServer: readonly OutgoingChange[];
  /** Records of this request that lost to a newer (or equal) server version. */
  losers: readonly OutgoingChange[];
}

export function buildReply({ requestCursor, seqAfter, newerOnServer, losers }: ReplyInput): SyncReply {
  const bySeq = new Map<string, OutgoingChange>();
  for (const change of [...newerOnServer, ...losers]) bySeq.set(recordKeyOf(change), change);
  const merged = [...bySeq.values()].sort((a, b) => a.seq - b.seq);
  if (merged.length <= MAX_REPLY_CHANGES) return { cursor: seqAfter, more: false, changes: merged };
  const page = merged.slice(0, MAX_REPLY_CHANGES);
  return { cursor: Math.max(requestCursor, page[page.length - 1].seq), more: true, changes: page };
}
