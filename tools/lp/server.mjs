#!/usr/bin/env node
// Local server for the front layer that behaves like thelanguagepage.com: the same routing decision
// (functions/_lib/lp-front.js frontRoute) and the same security headers, serving files from the source tree.
//   node tools/lp/server.mjs [--port 4810]          or import { startServer } for tests.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { frontHeaders, frontRoute, isFrontPath } from "../../functions/_lib/lp-front.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};
// Where a URL prefix lives in the source tree (public/ is copied to the dist root by Vite).
const MOUNTS = [
  ["/lp/", "lp/"],
  ["/assets/fonts/", "public/assets/fonts/"],
  ["/assets/", "assets/"],
  ["/shared/", "shared/"],
  ["/access-practice-lab/pictures/", "access-practice-lab/pictures/"],
  // Negative-control fixtures for tools/lp/check.mjs. Local server only; production never serves this path.
  ["/__fixtures/", "tools/lp/fixtures/"],
];

function resolveFile(urlPath) {
  for (const [prefix, dir] of MOUNTS) {
    if (!urlPath.startsWith(prefix)) continue;
    let rel = urlPath.slice(prefix.length);
    if (rel === "" || rel.endsWith("/")) rel += "index.html";
    const abs = path.join(ROOT, dir, decodeURIComponent(rel));
    if (!abs.startsWith(path.join(ROOT, dir))) return null;
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  }
  return null;
}

export function startServer({ port = 4810 } = {}) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const route = isFrontPath(url.pathname) ? frontRoute(url.pathname) : { kind: "asset" };
    if (route.kind === "redirect") {
      res.writeHead(route.status, { Location: `${route.location}${url.search}` });
      return res.end();
    }
    if (route.kind === "missing") {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("not a front-layer page (production sends this to eduwonderlab.com)");
    }
    const filePath = route.kind === "page" ? resolveFile(route.asset) : resolveFile(url.pathname);
    if (!filePath) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("not found");
    }
    const headers = new Headers({
      "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream",
    });
    const final = route.kind === "page" ? frontHeaders(url.pathname, headers) : headers;
    if (route.kind === "sw") final.set("Service-Worker-Allowed", "/");
    // Plain-http localhost: upgrading subresources to https would break every request.
    if (final.has("content-security-policy"))
      final.set(
        "content-security-policy",
        final.get("content-security-policy").replace("; upgrade-insecure-requests", ""),
      );
    const out = {};
    for (const [k, v] of final) out[k] = v;
    res.writeHead(200, out);
    res.end(req.method === "HEAD" ? undefined : fs.readFileSync(filePath));
  });
  return new Promise((resolve) =>
    server.listen(port, "127.0.0.1", () => resolve({ server, base: `http://localhost:${port}` })),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(
    process.argv.includes("--port") ? process.argv[process.argv.indexOf("--port") + 1] : 4810,
  );
  const { base } = await startServer({ port });
  console.log(`lp server: ${base}`);
}
