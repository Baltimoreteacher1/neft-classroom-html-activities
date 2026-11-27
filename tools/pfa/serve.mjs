#!/usr/bin/env node
// Local server for the PFA pages: serves the source tree like Pages does (path, path.html,
// path/index.html) and renders PFA routes through the same functions/_lib/pfa/render.js the Pages
// Functions call. Teacher gating is not emulated (that is functions/_middleware.js, held by
// validate:auth-contract); the browser gate checks the answer-key path IS a teacher surface.
//
//   node tools/pfa/serve.mjs [port]      (default 4777)
// Also importable: startServer(port) -> { url, close }.

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function startServer(port = 4777) {
  const { routePfa } = await import(pathToFileURL(join(ROOT, "functions/_lib/pfa/render.js")).href);
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const pfa = routePfa(decodeURIComponent(url.pathname));
    if (pfa) {
      res.writeHead(pfa.status, { "content-type": pfa.type });
      return res.end(pfa.body);
    }
    let p = decodeURIComponent(url.pathname);
    const candidates = [p, `${p}.html`, join(p, "index.html")];
    if (p.startsWith("/assets/fonts/")) candidates.unshift(`/public${p}`);
    for (const c of candidates) {
      const abs = join(ROOT, c);
      if (abs.startsWith(ROOT) && existsSync(abs) && statSync(abs).isFile()) {
        res.writeHead(200, { "content-type": TYPES[extname(abs)] || "application/octet-stream" });
        return createReadStream(abs).pipe(res);
      }
    }
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) };
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const s = await startServer(Number(process.argv[2]) || 4777);
  console.log(`PFA server on ${s.url}`);
}
