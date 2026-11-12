/**
 * The admin access token lives only in this module's memory: never in localStorage,
 * sessionStorage or Redux, so injected scripts and devtools snapshots can't read it.
 * A page reload loses it; the session is restored from the httpOnly cookie instead.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
