#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { liveLessonShadows } from "../scripts/lib/live-lesson-shadows.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("a redirect whose source is a live lesson folder is a shadow", () => {
  const hits = liveLessonShadows(
    [
      { source: "/lessons/7-1", destination: "/lessons/8-1/", status: 301 },
      { source: "/gone-lesson", destination: "/lessons/1-1/", status: 301 },
    ],
    (id) => id === "7-1",
  );
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, "7-1");
  assert.equal(hits[0].destId, "8-1");
});

test("a redirect to a missing folder is not a live-lesson shadow", () => {
  const hits = liveLessonShadows(
    [{ source: "/lessons/old-id", destination: "/lessons/1-1/", status: 301 }],
    () => false,
  );
  assert.deepEqual(hits, []);
});

test("routes.json does not 301 any live lesson to a different lesson", () => {
  const routes = JSON.parse(readFileSync(join(ROOT, "data/routes.json"), "utf8"));
  const hits = liveLessonShadows(routes.redirects, (id) =>
    existsSync(join(ROOT, "lessons", id, "config.json")),
  );
  assert.deepEqual(
    hits,
    [],
    hits
      .map((h) => `${h.source} → ${h.destination} but lessons/${h.id}/config.json exists`)
      .join("\n"),
  );
});
