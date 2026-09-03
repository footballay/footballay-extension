const HOUR = 60 * 60 * 1_000;
const RESTORE_TTL_MS = 6 * HOUR;

export function isRestoreExpired(updatedAt: number): boolean {
  const age = Date.now() - updatedAt;
  return age < 0 || age > RESTORE_TTL_MS;
}
