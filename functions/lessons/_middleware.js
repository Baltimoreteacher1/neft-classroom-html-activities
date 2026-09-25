// Allow the local homework photobooth to request camera access. The browser
// still asks permission; all other routes retain the site's default policy.
export async function onRequest({ request, next }) {
  const response = await next();
  const pathname = new URL(request.url).pathname;
  if (
    !response.ok ||
    !/^\/lessons\/\d{1,2}-[a-z0-9-]+\/homework(?:\.html)?\/?$/.test(pathname) ||
    !response.headers.get("Content-Type")?.includes("text/html")
  )
    return response;

  const headers = new Headers(response.headers);
  const policy =
    headers.get("Permissions-Policy") || "microphone=(self), geolocation=(), payment=(), usb=()";
  const directives = policy
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && !/^camera\s*=/i.test(part));
  headers.set("Permissions-Policy", ["camera=(self)", ...directives].join(", "));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
