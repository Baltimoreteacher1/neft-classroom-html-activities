// One feature flag as a page sees it: GET /api/flags (booleans only), falling back to the committed registry default
// when the endpoint is unreachable, so a feature never flips because the network did.
import { isEnabled } from "./index.js";

export async function pageFlag(key, fetchImpl = (...a) => fetch(...a)) {
  try {
    const res = await fetchImpl("/api/flags", { headers: { Accept: "application/json" } });
    if (res.ok) {
      const body = await res.json();
      if (typeof body?.flags?.[key] === "boolean") return body.flags[key];
    }
  } catch {
    /* offline: use the registry default below */
  }
  return isEnabled(key, { env: "production", trustedIds: false });
}
