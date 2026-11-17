// A local server for Part 2 browser scripts: it serves the source tree the way Pages serves dist/ (deep links in the
// Language Page fall back to its app shell) AND answers /api/class/* by calling the real Pages Function
// (functions/api/class/[[path]].js) against an in-memory SQL engine (node:sqlite), the same way the unit tests do.
// Nothing is stubbed: classes, joins, shares, the review queue and reviews all go through the production handler.
// The same approach as tools/compiler-e2e.mjs (which keeps its own copy).
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { onRequest } from "../../functions/api/class/[[path]].js";
import { REPO_ROOT } from "./access-lab-content.mjs";

/** A D1-shaped binding over node:sqlite (prepare/bind/first/all/run/batch). */
export function d1(sqlite) {
  const make = (sql, params) => ({
    bind: (...next) => make(sql, next),
    first: async () => sqlite.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...params) }),
    run: async () => ({
      success: true,
      meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) },
    }),
  });
  return {
    prepare: (sql) => make(sql, []),
    async batch(statements) {
      const out = [];
      for (const s of statements) out.push(await s.run());
      return out;
    },
  };
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".wav": "audio/wav",
};

/**
 * @param {{teacherKey?: string}} [opts]
 * @returns {Promise<{server: http.Server, origin: string, env: object, teacherKey: string}>}
 */
export async function startPart2Server({ teacherKey = "e2e-teacher-key" } = {}) {
  const env = { DB: d1(new DatabaseSync(":memory:")), TEACHER_KEY: teacherKey };
  async function api(req, res, url) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
    headers.set("CF-Connecting-IP", "10.9.0.1");
    const request = new Request(`http://localhost${url.pathname}${url.search}`, {
      method: req.method,
      headers,
      ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
    });
    const out = await onRequest({
      request,
      env,
      params: { path: url.pathname.replace("/api/class/", "").split("/") },
    });
    res.writeHead(out.status, {
      "content-type": out.headers.get("Content-Type") || "application/json",
    });
    res.end(Buffer.from(await out.arrayBuffer()));
  }
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const p = decodeURIComponent(url.pathname);
    if (p.startsWith("/api/class/"))
      return api(req, res, url).catch((err) => (res.writeHead(500), res.end(String(err))));
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
      file = join(REPO_ROOT, "public", p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
        file = join(REPO_ROOT, "access-practice-lab/index.html");
      else {
        res.writeHead(404);
        return res.end();
      }
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, resolve));
  return { server, origin: `http://localhost:${server.address().port}`, env, teacherKey };
}

/** A mono 16-bit PCM WAV of a tone with a short gap, for Chromium's --use-file-for-fake-audio-capture. */
export function toneWav({ seconds = 4, rate = 16000, hz = 220 } = {}) {
  const n = seconds * rate;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const on = i % rate < rate * 0.8; // speech-like bursts: 0.8 s of tone, 0.2 s of quiet
    const v = on ? Math.sin((2 * Math.PI * hz * i) / rate) * 9000 : 0;
    buf.writeInt16LE(Math.round(v), 44 + i * 2);
  }
  return buf;
}
