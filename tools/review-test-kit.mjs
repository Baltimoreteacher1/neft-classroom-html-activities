// Shared test kit for the review tools: a database with every migration applied, and a caller that drives a
// Pages Function's onRequest the way Cloudflare does. Reuses the privacy tools' D1 fake.
import { d1, freshDb } from "./privacy-d1-fake.mjs";

export const KEY = "review-test-key";
export const human = (name = "Pat Reviewer", role = "pedagogy") => ({ name, role, actor: "human" });

let ipCounter = 0;
export function newEnv() {
  const sqlite = freshDb();
  return { sqlite, env: { DB: d1(sqlite), TEACHER_KEY: KEY } };
}

/** Call onRequest. Each call uses its own client address unless `ip` is given, so the per-IP limiter never interferes. */
export async function call(
  onRequest,
  env,
  { method = "GET", path = "/api/review/x", body, key = KEY, params = {}, ip } = {},
) {
  const headers = {
    "CF-Connecting-IP": ip || `10.1.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`,
  };
  if (key) headers["x-teacher-key"] = key;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const request = new Request(`https://test.local${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const res = await onRequest({ request, env, params });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON (CSV) */
  }
  return { status: res.status, json, text, headers: res.headers };
}

export const count = (sqlite, table) =>
  Number(sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n);
