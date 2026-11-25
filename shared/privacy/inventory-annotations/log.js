// Log annotations: what the shared API wrapper writes to the Cloudflare Workers log. The logger
// (functions/_lib/security/log.js) only emits allowlisted keys with token-shaped values, so free text,
// query strings and full stacks never reach the log.

// @data field=api-request-log store=log purpose="One structured line per API request and per handler error: event, request id, route pattern (params replaced by :name), method, status, duration, backend, error class and first stack frame. No query string, no body, no free text." retention="Cloudflare Workers log retention (set in the Cloudflare account, not in this repo)" delete="not deletable from this repo" source=functions/_lib/http.js match="logError"

export {};
