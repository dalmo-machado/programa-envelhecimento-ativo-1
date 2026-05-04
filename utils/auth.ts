/**
 * Password hashing utility using the Web Crypto API (SHA-256).
 * Available in all modern browsers — no external dependencies required.
 *
 * Security note: SHA-256 without salt is acceptable for this closed
 * clinical research tool. For a public-facing application, use bcrypt
 * with per-user salts via a proper backend.
 */

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}
