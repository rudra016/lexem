import crypto from "node:crypto";

const KEY_PREFIX = "lxm_";
const RAW_KEY_BYTES = 24;

/**
 * Generate a new API key. Returns:
 *  - raw: the user-visible token, shown once on creation
 *  - hashed: SHA-256 hex digest stored in DB for verification
 *  - prefix: first 12 chars of `raw` for UI display (e.g. `lxm_abc1...`)
 */
export function generateApiKey() {
  const raw = `${KEY_PREFIX}${crypto.randomBytes(RAW_KEY_BYTES).toString("base64url")}`;
  return {
    raw,
    hashed: hashApiKey(raw),
    prefix: raw.slice(0, 12),
  };
}

export function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
