/* Cloudflare Pages Function.
 * Serves public configuration parameters (like Google Client ID) to the client.
 */

export async function onRequestGet({ env }) {
  const googleClientId = env.GOOGLE_CLIENT_ID || "";
  return new Response(JSON.stringify({ googleClientId }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
