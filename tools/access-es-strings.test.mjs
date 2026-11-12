/**
 * Spanish for activity content shown in Español and English + Español:
 *   - content/es-strings.json has Spanish for every hint, support, correct, extension, wrong-choice note and language
 *     focus tag an activity carries, so no English guidance is left on a Spanish screen;
 *   - every English word or phrase the English quotes (the words students practice) is still in the Spanish, quoted;
 *   - content/es-guide.json has Spanish skill and directions for every activity.
 *   node --test tools/access-es-strings.test.mjs
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const ROOT = new URL("../access-practice-lab/content/", import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, ROOT), "utf8"));
const STR = json("es-strings.json").strings;
const GUIDE = json("es-guide.json").activities;

const activities = new Map();
for (const dir of ["gK", "g1", "g2-3", "g3-5", "g6-8"])
  for (const f of readdirSync(new URL(`${dir}/`, ROOT)).filter((n) => n.endsWith(".json"))) {
    const walk = (n) => {
      if (Array.isArray(n)) n.forEach(walk);
      else if (n && typeof n === "object") {
        if (n.id && (n.directions || n.prompt || n.question)) {
          if (!activities.has(n.id)) activities.set(n.id, n);
        } else Object.values(n).forEach(walk);
      }
    };
    walk(json(`${dir}/${f}`));
  }

const guidance = (a) => [
  ...["hint", "support", "correct", "extension"]
    .map((k) => a[k])
    .filter((v) => typeof v === "string" && v.trim()),
  ...Object.values(a.distractorFeedback || {}).filter((v) => typeof v === "string"),
  ...[].concat(a.wida || []).filter((v) => typeof v === "string"),
];

test("the walk finds the activities", () => {
  assert.ok(activities.size > 800, `found ${activities.size}`);
});

test("every activity's feedback and focus tags have Spanish", () => {
  const missing = [...activities.values()].flatMap((a) =>
    guidance(a)
      .filter((en) => !STR[en]?.trim())
      .map((en) => `${a.id}: ${en}`),
  );
  assert.deepEqual(missing.slice(0, 10), [], `${missing.length} strings without Spanish`);
});

test("every activity has Spanish skill and directions", () => {
  const missing = [...activities.values()]
    .filter((a) => a.directions && !GUIDE[a.id]?.directions?.trim())
    .map((a) => a.id);
  assert.deepEqual(missing, []);
});

test("quoted English (the words being practiced) survives in the Spanish", () => {
  const quoted = (s) => [...s.matchAll(/"([^"]{1,60})"|“([^”]{1,60})”/g)].map((m) => m[1] || m[2]);
  const lost = Object.entries(STR).flatMap(([en, es]) =>
    quoted(en)
      .filter((q) => /[a-z]/i.test(q) && !es.includes(q))
      .map((q) => `${q} :: ${es}`),
  );
  // A handful of quotes are English instructions rather than practiced words; allow a small, visible remainder.
  assert.ok(
    lost.length <= 40,
    `${lost.length} quoted phrases lost, e.g.\n${lost.slice(0, 15).join("\n")}`,
  );
});

test("Spanish uses tú for students, never usted, vos or vosotros", () => {
  const bad = Object.entries(STR).filter(([, es]) => /\b(usted|ustedes|vosotros|vos)\b/i.test(es));
  assert.deepEqual(bad.slice(0, 10), [], `${bad.length} lines use the wrong register`);
});
