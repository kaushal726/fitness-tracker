/* A short fingerprint of a record's contents (cyrb53, 53 bits), so "has this changed since it was last saved to the cloud"
 * can be answered without keeping a second copy of every record on the phone.
 */
const SEED = 0;
const MIX_A = 2654435761;
const MIX_B = 1597334677;
const MIX_C = 2246822507;
const MIX_D = 3266489909;
const HIGH_BITS = 2097151;
const HIGH_SCALE = 4294967296;

export function fingerprint(text: string): string {
  let h1 = 0xdeadbeef ^ SEED;
  let h2 = 0x41c6ce57 ^ SEED;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, MIX_A);
    h2 = Math.imul(h2 ^ code, MIX_B);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), MIX_C) ^ Math.imul(h2 ^ (h2 >>> 13), MIX_D);
  h2 = Math.imul(h2 ^ (h2 >>> 16), MIX_C) ^ Math.imul(h1 ^ (h1 >>> 13), MIX_D);
  return (HIGH_SCALE * (HIGH_BITS & h2) + (h1 >>> 0)).toString(36);
}
