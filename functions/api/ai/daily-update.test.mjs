#!/usr/bin/env node
/**
 * daily-update.js spends OPENAI_API_KEY on an unauthenticated POST. The
 * shared handler in functions/_lib/http.js is the floor: rate limit, body cap,
 * and never echo provider or exception text to the caller.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "daily-update.js"),
  "utf8",
);

assert.match(src, /from ["'][^"']*_lib\/http\.js["']/, "must use the shared handler");
assert.match(src, /rateLimit\s*:/, "must declare a per-IP rate limit");
assert.match(src, /maxBodyBytes\s*:/, "must cap the request body");
assert.doesNotMatch(src, /err\.message/, "must not echo exception messages");
assert.doesNotMatch(src, /data\.error\?\.message/, "must not echo OpenAI error text");
assert.doesNotMatch(src, /onRequestPost/, "must export onRequest via handler(), not a bare POST");

console.log("daily-update: shared handler, rate limit, body cap, no error echo.");
