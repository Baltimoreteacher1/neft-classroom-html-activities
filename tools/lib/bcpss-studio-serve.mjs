// Loopback server for browser checks of the Language Studio: the repo source tree as static files, plus
// GET /api/bcpss/units/<id> answered straight from functions/_lib/bcpss/db.js getUnitDetail (fallback-seed
// backend, no D1, no network). Source is served directly, so the build-time bare specifier `web-vitals` and
// the hashed font paths do not resolve; callers ignore those two known source-tree artefacts.
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { getUnitDetail } from "../../functions/_lib/bcpss/db.js";
import { onRequest as lessonRoute } from "../../functions/api/bcpss/lessons/[lessonId].js";
import { onRequest as unitLessonsRoute } from "../../functions/api/bcpss/units/[unitId]/lessons.js";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
const UNIT_API = /^\/api\/bcpss\/units\/([a-zA-Z0-9_-]{2,80})$/;
const UNIT_LESSONS_API = /^\/api\/bcpss\/units\/([a-zA-Z0-9_-]{2,80})\/lessons$/;
const LESSON_API = /^\/api\/bcpss\/lessons\/([a-z0-9-]{6,40})$/;

/** Start the server on a free loopback port. Resolves { origin, close }. */
export async function startStudioServer(root) {
  const details = new Map();
  const detailFor = async (id) => {
    if (!details.has(id)) details.set(id, (await getUnitDetail({}, id)).detail || null);
    return details.get(id);
  };
  const send = (res, status, type, body) => {
    res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
    res.end(body);
  };
  const server = createServer(async (req, res) => {
    try {
      if (req.method !== "GET") return send(res, 405, "text/plain", "method not allowed");
      const { pathname } = new URL(req.url, "http://127.0.0.1");
      // The lesson endpoints are the real Pages Functions handlers, called directly.
      const viaHandler = async (route, params) => {
        const r = await route({
          request: new Request(`http://127.0.0.1${pathname}`),
          params,
          env: {},
        });
        return send(res, r.status, r.headers.get("content-type") || TYPES[".json"], await r.text());
      };
      const lessons = UNIT_LESSONS_API.exec(pathname);
      if (lessons) return viaHandler(unitLessonsRoute, { unitId: lessons[1] });
      const lesson = LESSON_API.exec(pathname);
      if (lesson) return viaHandler(lessonRoute, { lessonId: lesson[1] });
      const api = UNIT_API.exec(pathname);
      if (api) {
        const detail = await detailFor(api[1]);
        return detail
          ? send(res, 200, TYPES[".json"], JSON.stringify(detail))
          : send(res, 404, "text/plain", "unit not found");
      }
      let file = normalize(join(root, decodeURIComponent(pathname)));
      if (file !== root && !file.startsWith(root + sep))
        return send(res, 403, "text/plain", "forbidden");
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
      return send(
        res,
        200,
        TYPES[extname(file)] || "application/octet-stream",
        await readFile(file),
      );
    } catch {
      return send(res, 404, "text/plain", "not found");
    }
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    detailFor,
    close: () => new Promise((ok) => server.close(ok)),
  };
}
