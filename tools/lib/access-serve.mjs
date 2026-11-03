// Static server for the ACCESS ecosystem, shared by the foundation, engine and browser checks.
// Serves the source tree the way Pages serves dist/: clean URLs resolve to index.html, the Practice Lab's
// deep links fall back to its app shell, and /access-practice-lab/sw.js is served so the worker can register.
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./access-lab-content.mjs";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};

export function serveAccess({ port = 0 } = {}) {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    // Vite's public/ directory is served at the site root in production (fonts live in /assets/fonts).
    const pub = join(REPO_ROOT, "public", p);
    if (!existsSync(file) && existsSync(pub) && statSync(pub).isFile()) file = pub;
    if (!existsSync(file) || statSync(file).isDirectory()) {
      const dirIndex = join(REPO_ROOT, p, "index.html");
      if (existsSync(dirIndex)) file = dirIndex;
      else if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
        file = join(REPO_ROOT, "access-practice-lab/index.html");
      else {
        res.writeHead(404);
        return res.end();
      }
    }
    res.writeHead(200, {
      "content-type": TYPES[extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) =>
    server.listen(port, "127.0.0.1", () =>
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` }),
    ),
  );
}
