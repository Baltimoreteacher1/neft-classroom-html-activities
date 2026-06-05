// functions/_middleware.js — shared class-password gate for Cloudflare Pages.
//
// Protects every page behind one shared password using HTTP Basic Auth.
// The password is NOT stored in this (public) repo — it is read from the
// Cloudflare environment variable SITE_PASSWORD. If that variable is not
// set, the site stays fully open, so deploying this file changes nothing
// until you switch it on in the Cloudflare dashboard.
//
// Turn the password ON:
//   Cloudflare dashboard -> Workers & Pages -> your Pages project
//   -> Settings -> Variables and Secrets -> add a variable for Production:
//      Name = SITE_PASSWORD   Value = <the class password you choose>
//   then redeploy (Deployments -> Retry deployment, or push a commit).
//
// Turn it OFF again: delete the SITE_PASSWORD variable and redeploy.
//
// Students sign in with ANY username (their name is fine) plus the shared
// password. This is a casual gate to keep the public out, not strong
// security — anyone who has the password can get in.

export async function onRequest(context) {
  const { request, env, next } = context;
  const password = env.SITE_PASSWORD;

  // No password configured -> leave the site open (no behavior change).
  if (!password) return next();

  // Never gate the API endpoints or lesson config JSON files — they have their own auth
  // or are fetched by external automation (like Google Apps Script slide generator).
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.endsWith('/config.json')) return next();

  const header = request.headers.get('Authorization') || '';
  const [scheme, encoded] = header.split(' ');

  if (scheme === 'Basic' && encoded) {
    const decoded = atob(encoded);
    const supplied = decoded.slice(decoded.indexOf(':') + 1);
    if (supplied === password) return next(); // correct password -> allow
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="EduWonderLab", charset="UTF-8"',
    },
  });
}
