/**
 * Reversible URL query obfuscation for LocalTube search.
 *
 * ⚠️ This is OBFUSCATION, not security. It keeps raw search terms out of the
 * visible URL bar and browser history, but the transform is public and
 * reversible by anyone — never rely on it to hide anything sensitive.
 *
 * Scheme: UTF-8 bytes → light XOR mask → Base64URL (no padding).
 * Isomorphic: uses only TextEncoder/TextDecoder + btoa/atob, all of which are
 * globally available in the browser, Node 18+, and the edge runtime.
 */

// Public, non-secret mask. Its only job is to make the output not trivially
// base64-decodable at a glance. Changing it invalidates old links.
const MASK = [0x4c, 0x54, 0x75, 0x62, 0x65]; // "LTube"

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(hash: string): Uint8Array {
  let b64 = hash.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** Plain text → URL-safe obfuscated token. */
export function encodeQuery(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const masked = bytes.map((b, i) => b ^ MASK[i % MASK.length]);
  return toBase64Url(masked);
}

/**
 * Obfuscated token → plain text. Returns null for empty, malformed, or
 * corrupted input so callers can fall back to a clean state.
 */
export function decodeQuery(hash: string | null | undefined): string | null {
  if (!hash) return null;
  try {
    const masked = fromBase64Url(hash);
    const bytes = masked.map((b, i) => b ^ MASK[i % MASK.length]);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return text.length ? text : null;
  } catch {
    return null;
  }
}
