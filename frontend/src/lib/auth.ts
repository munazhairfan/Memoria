// Lightweight JWT expiry check — no dependency, just base64-decodes the
// payload segment and compares `exp` against the current time.
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return true; // no expiry claim, treat as valid
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}