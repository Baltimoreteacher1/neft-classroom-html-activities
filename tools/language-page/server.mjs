// Local server for browser gates: serves the SOURCE tree and the real /api/bcpss Pages Function handlers
// in-process (memory backend, never production data). Writes land in process memory only.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import * as apiFamilyGuide from "../../functions/api/bcpss/family-guide/[unitId].js";
import * as apiInsights from "../../functions/api/bcpss/insights.js";
import * as apiPathways from "../../functions/api/bcpss/pathways.js";
import * as apiTelemetry from "../../functions/api/bcpss/telemetry.js";
import * as apiLessons from "../../functions/api/bcpss/units/[unitId]/lessons.js";
import * as apiUnit from "../../functions/api/bcpss/units/[unitId].js";
import * as apiUnits from "../../functions/api/bcpss/units.js";
import * as apiFlags from "../../functions/api/flags.js";
import * as apiReviewSummary from "../../functions/api/review/summary.js";
import { newEnv } from "../review-test-kit.mjs";

const ROOT = path.resolve(new URL("../../", import.meta.url).pathname);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

// The real review summary handler over an in-memory database (nothing reviewed in it), so pages that ask for badge
// states get a genuine 200 instead of a 404 console error. Never a deployed database.
let reviewEnv = null;
const memoryReviewEnv = () => (reviewEnv ||= newEnv().env);

function route(pathname) {
  if (pathname === "/api/review/summary")
    return { mod: apiReviewSummary, params: {}, env: memoryReviewEnv() };
  const fg = pathname.match(/^\/api\/bcpss\/family-guide\/([^/]+)$/);
  if (fg) return { mod: apiFamilyGuide, params: { unitId: decodeURIComponent(fg[1]) } };
  const m = pathname.match(/^\/api\/bcpss\/units\/([^/]+)(\/lessons)?$/);
  if (m) return { mod: m[2] ? apiLessons : apiUnit, params: { unitId: decodeURIComponent(m[1]) } };
  const exact = {
    "/api/bcpss/units": apiUnits,
    "/api/bcpss/insights": apiInsights,
    "/api/bcpss/pathways": apiPathways,
    "/api/bcpss/telemetry": apiTelemetry,
  };
  return exact[pathname] ? { mod: exact[pathname], params: {} } : null;
}

export function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        if (url.pathname.startsWith("/api/")) {
          const r = route(url.pathname);
          if (!r) return void res.writeHead(404).end("no route");
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const body = Buffer.concat(chunks);
          const webRes = await r.mod.onRequest({
            request: new Request(url.href, {
              method: req.method,
              headers: req.headers,
              body: body.length ? body : undefined,
            }),
            env: r.env ?? {},
            params: r.params,
            waitUntil() {},
          });
          const headers = Object.fromEntries(webRes.headers);
          res.writeHead(webRes.status, headers);
          return void res.end(Buffer.from(await webRes.arrayBuffer()));
        }
        let rel = decodeURIComponent(url.pathname);
        if (rel.startsWith("/family/bcpss/") && !path.extname(rel))
          rel = "/family/bcpss/index.html";
        else if (rel.endsWith("/")) rel += "index.html";
        else if (!path.extname(rel) && fs.existsSync(path.join(ROOT, rel, "index.html")))
          rel = path.join(rel, "index.html");
        let abs = path.resolve(ROOT, rel.replace(/^\/+/, ""));
        const pub = path.resolve(ROOT, "public", rel.replace(/^\/+/, ""));
        if (
          (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) &&
          fs.existsSync(pub) &&
          !fs.statSync(pub).isDirectory()
        )
          abs = pub;
        if (!abs.startsWith(ROOT) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory())
          return void res.writeHead(404).end("Not found");
        res.writeHead(200, {
          "Content-Type": MIME[path.extname(abs)] || "application/octet-stream",
        });
        fs.createReadStream(abs).pipe(res);
      } catch (err) {
        res.writeHead(500).end(String(err?.stack || err));
      }
    });
    server.listen(0, "127.0.0.1", () =>
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` }),
    );
  });
}
