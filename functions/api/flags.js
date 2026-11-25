/* Cloudflare Pages Function. GET /api/flags -> { ok, flags: { key: boolean } } for the caller.
 * Booleans only: no owners, descriptions, cohorts or dates leave the server. */
import { flagsForRequest } from "../_lib/flags.js";
import { handler } from "../_lib/http.js";

const ID = /^[A-Za-z0-9_-]{1,64}$/;

function idFrom(params, name) {
  const value = params.get(name);
  return value && ID.test(value) ? value : undefined;
}

export const onRequest = handler({
  methods: ["GET"],
  rateLimit: { max: 60, windowMs: 60_000 },
  async handle({ request, env }) {
    const params = new URL(request.url).searchParams;
    const ids = {
      teacherId: idFrom(params, "teacherId"),
      classId: idFrom(params, "classId"),
      demo: idFrom(params, "demo"),
    };
    return { ok: true, flags: await flagsForRequest(request, env, ids) };
  },
});
