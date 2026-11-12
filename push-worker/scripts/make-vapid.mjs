// Makes a VAPID key pair for push. Writes the private key, as a JWK, to the file given (never prints it) and prints
// only the public key, which goes in wrangler.toml and src/app/pushConfig.ts.
//   node scripts/make-vapid.mjs /path/outside/the/repo/vapid-private.json
import { writeFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const out = process.argv[2];
if (!out) {
  console.error("Give a path for the private key file, outside the repo.");
  process.exit(1);
}
const { publicKey, privateKey } = await webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const raw = new Uint8Array(await webcrypto.subtle.exportKey("raw", publicKey));
writeFileSync(out, JSON.stringify(await webcrypto.subtle.exportKey("jwk", privateKey)), { mode: 0o600 });
console.log(Buffer.from(raw).toString("base64url"));
