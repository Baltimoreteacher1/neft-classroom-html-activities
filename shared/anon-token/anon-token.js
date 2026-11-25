// Anonymous per-browser token for rate limiting. The server keys write limits by IP + X-Anon-Token
// in the Pages Functions' shared http and security modules, so a class behind one school IP does not
// share a single limit. The token is 16 random bytes from crypto.getRandomValues, hex-encoded, made once
// per browser and kept in localStorage (ewl_anon_token). It is never derived from a name, alias, class
// code or any other student data, and it identifies no one. When storage is blocked the token lives in
// memory for the page session. Clearing site data issues a new token.

export const ANON_TOKEN_HEADER = "X-Anon-Token";
export const ANON_TOKEN_KEY = "ewl_anon_token";
// Same shape the server accepts (ANON_TOKEN_RE in the security schema module); a stored value
// that does not match is replaced, so a tampered key can never produce a malformed header.
const TOKEN_RE = /^[a-f0-9]{32}$/;

let memoryToken = "";

function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The browser's anonymous token: created on first use, then stable. */
export function anonToken() {
  let stored = "";
  try {
    stored = localStorage.getItem(ANON_TOKEN_KEY) || "";
  } catch {
    // Storage blocked: fall back to the in-memory token below.
  }
  if (TOKEN_RE.test(stored)) return stored;
  if (!TOKEN_RE.test(memoryToken)) memoryToken = makeToken();
  try {
    localStorage.setItem(ANON_TOKEN_KEY, memoryToken);
  } catch {
    // Storage blocked or full: the page session keeps using memoryToken.
  }
  return memoryToken;
}

/** Headers to spread into a write request's headers. */
export const anonTokenHeaders = () => ({ [ANON_TOKEN_HEADER]: anonToken() });
