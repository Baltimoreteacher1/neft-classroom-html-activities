/* Cloudflare Pages Function.
 * Serves public configuration parameters (like Google Client ID) to the client.
 *
 * Uses the shared handler so this endpoint gets the method allow-list, the
 * JSON error envelope and the catch-all that every /api route should have.
 * It previously had none: any throw surfaced as Cloudflare's HTML 500 page to
 * a caller that asked for JSON.
 */
import { handler } from "../_lib/http.js";

export const onRequest = handler({
  methods: ["GET"],
  handle: ({ env }) => ({ googleClientId: env.GOOGLE_CLIENT_ID || "" }),
});
