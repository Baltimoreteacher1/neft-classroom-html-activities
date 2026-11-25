/**
 * Egress probe harness (gate G-31 foundation).
 *
 *   const handle = await probe(page, { allowedOrigins: [origin], canaries: [makeCanary("recording")] });
 *   ... drive the flow, typing/recording canary.value as "student content" ...
 *   handle.assertClean();   // throws EgressViolation listing every finding
 *
 * Observes every request of every page in the context (fetch, XHR, beacon, images, scripts, forms,
 * service-worker requests) plus WebSocket URLs and sent frames. `block: true` also aborts any
 * violating request so a faulty flow cannot reach the network while it is being probed.
 * Never point this at production: use a local server or a preview of the source tree.
 */
import { analyzeRequest, originOf } from "./analyze.mjs";

export class EgressViolation extends Error {
  constructor(findings) {
    const lines = findings.map(
      (f) =>
        `${f.kind}${f.where ? `(${f.where})` : ""}${f.canary ? ` [${f.canary}]` : ""} ${f.method} ${f.url}`,
    );
    super(`egress violation: ${findings.length} finding(s)\n${lines.join("\n")}`);
    this.name = "EgressViolation";
    this.findings = findings;
  }
}

export async function probe(
  page,
  { allowedOrigins, canaries = [], allowCanaryTo = [], block = false } = {},
) {
  if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) {
    throw new Error("probe: allowedOrigins is required (e.g. [new URL(url).origin])");
  }
  for (const o of allowedOrigins) {
    if (originOf(o) !== o)
      throw new Error(`probe: "${o}" is not a bare origin like http://127.0.0.1:4173`);
  }
  const config = { allowedOrigins, canaries, allowCanaryTo };
  const context = page.context();
  const requests = [];
  const findings = [];

  const record = (req, extra = {}) => {
    const found = analyzeRequest(req, config);
    requests.push({
      url: req.url,
      method: req.method ?? "GET",
      origin: originOf(req.url),
      flagged: found.length > 0,
      ...extra,
    });
    findings.push(...found);
    return found;
  };
  const onRequest = (request) =>
    record({
      url: request.url(),
      method: request.method(),
      postData: request.postDataBuffer(),
      headers: request.headers(),
    });
  const onSocket = (ws) => {
    record({ url: ws.url(), method: "WS" }, { websocket: true });
    ws.on("framesent", (frame) =>
      record(
        { url: ws.url(), method: "WS", postData: frame.payload },
        { websocket: true, frame: true },
      ),
    );
  };
  const blocker = (route) => {
    const request = route.request();
    const bad = analyzeRequest(
      {
        url: request.url(),
        method: request.method(),
        postData: request.postDataBuffer(),
        headers: request.headers(),
      },
      config,
    );
    return bad.length ? route.abort("blockedbyclient") : route.fallback();
  };

  context.on("request", onRequest);
  page.on("websocket", onSocket);
  if (block) await context.route("**/*", blocker);

  return {
    requests,
    findings,
    /** Distinct origins contacted, sorted. */
    origins: () => [...new Set(requests.map((r) => r.origin).filter(Boolean))].sort(),
    report: () => ({
      requests: requests.length,
      origins: [...new Set(requests.map((r) => r.origin).filter(Boolean))].sort(),
      findings: [...findings],
    }),
    assertClean() {
      if (findings.length) throw new EgressViolation(findings);
    },
    async stop() {
      context.off("request", onRequest);
      page.off("websocket", onSocket);
      if (block) await context.unroute("**/*", blocker);
    },
  };
}
