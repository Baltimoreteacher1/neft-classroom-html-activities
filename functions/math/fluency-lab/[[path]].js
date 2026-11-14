const SHELL_ROUTES =
  /^\/math\/fluency-lab\/(?:today|skills|progress|grade-(?:k|[1-8])(?:\/[^/.]+)?)\/?$/;

/** Serve the Fluency Lab shell for clean history routes beyond Pages' redirect cutoff. */
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  if ((request.method !== "GET" && request.method !== "HEAD") || !SHELL_ROUTES.test(url.pathname))
    return next();

  if (!env.ASSETS?.fetch) return next();
  const shell = new Request(new URL("/math/fluency-lab/", url), request);
  return env.ASSETS.fetch(shell);
}
