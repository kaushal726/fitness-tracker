/** Limits and fixed values from CONTRACT.md. Defined once, imported everywhere. */

export const DAY_MS = 86_400_000;
export const MINUTE_MS = 60_000;

export const SESSION_DAYS = 60;
export const MIN_SESSION_SECRET_BYTES = 32;

export const MAX_CHANGES_PER_REQUEST = 500;
export const MAX_REPLY_CHANGES = 1_000;
export const MAX_ID_LENGTH = 200;
export const MAX_DATA_BYTES = 20_000;
export const MAX_CLOCK_SKEW_MS = 5 * MINUTE_MS;

/** Largest accepted request body: the 500 changes of at most 20,000 bytes each, plus their envelopes. */
export const MAX_BODY_BYTES = 11_000_000;
/** D1 rejects a bound value over 2 MB, so a bulk write is split into statements with at most this much data each. */
export const MAX_STATEMENT_PAYLOAD_BYTES = 1_000_000;

export const MAX_EMAIL_LENGTH = 254;
export const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
export const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
export const DEV_USER_PREFIX = "dev:";
export const CORS_MAX_AGE_SECONDS = 86_400;
