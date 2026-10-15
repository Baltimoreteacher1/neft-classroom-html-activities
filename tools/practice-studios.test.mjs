// Practice Studio v2: Practice + Challenge for every core lesson in Units 2-9 (/math/practice-studio/<lesson>/ and /challenge/).
//
// Every question, answer and hint in a studio is the lesson's own (config.json) or authored in data/practice-studio/<id>.json
// and validated against docs/specs/practice-studio-v2.md. So the risks are (1) a stale page after a source edit, (2) a mapping
// slip that points a studio at another item's answer, (3) a generated or hands-on item whose key disagrees with its own check,
// and (4) a page that references a script that is not there. This re-reads each source independently of the generator.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { outputs, STUDIO_UNITS } from "../scripts/generate-practice-studios.mjs";
import { listLessonDirs, loadLessonConfig, REPO_ROOT } from "./lib/curriculum-source.mjs";
import { loadStudio } from "./lib/studio-vm.mjs";

const { files, report } = outputs();
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

/* ---- every generated file is current on disk ----------------------------------------------------- */
for (const [rel, content] of files) {
  const path = join(REPO_ROOT, rel);
  assert.ok(existsSync(path), `${rel} is missing; run: node scripts/generate-practice-studios.mjs`);
  // not assert.equal: a failing string diff of two whole pages takes minutes to print
  assert.ok(
    readFileSync(path, "utf8") === content,
    `${rel} is stale; run: node scripts/generate-practice-studios.mjs`,
  );
}

const ids = listLessonDirs({ filter: /^\d+-\d+$/ }).filter((id) =>
  STUDIO_UNITS.includes(Number(id.split("-")[0])),
);
assert.equal(report.length, ids.length, "every core lesson in Units 2-9 has a studio");
assert.ok(ids.length >= 60, `expected 60+ lessons, found ${ids.length}`);
assert.ok(!STUDIO_UNITS.includes(4), "Unit 4 keeps its hand-built studios");

const worlds = JSON.parse(read("data/practice-studio/worlds.json"));
const ordered = [...ids].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
ordered.forEach((id, i) => {
  assert.ok(worlds.worlds[worlds.lessons[id]], `${id} has a world`);
  if (i >= 1)
    assert.notEqual(
      worlds.lessons[id],
      worlds.lessons[ordered[i - 1]],
      `${id} repeats the previous lesson's world`,
    );
  if (i >= 2)
    assert.notEqual(
      worlds.lessons[id],
      worlds.lessons[ordered[i - 2]],
      `${id} repeats a world from two lessons back`,
    );
});
const css = read("assets/studio-worlds.css");
for (const w of Object.keys(worlds.worlds)) {
  assert.ok(css.includes(`body[data-world="${w}"] {`), `worlds css has the ${w} daylight palette`);
  assert.ok(
    css.includes(`body[data-world="${w}"][data-theme="dark"] {`),
    `worlds css has the ${w} night palette`,
  );
}

const ctx = loadStudio({ gen: true, act: true });
const hub = read("curriculum/units/index.html");
const norm = (s) => String(s).replace(/\s+/g, " ").trim().toLowerCase();
const storageKeys = new Set();
let items = 0;
let generated = 0;

const pageData = (rel) => {
  const html = read(rel);
  const m = html.match(/id="studio-data">([\s\S]*?)<\/script>/);
  assert.ok(m, `${rel} ships its data`);
  return { html, data: JSON.parse(m[1].replace(/\\u003c/g, "<")) };
};

for (const id of ids) {
  const cfg = loadLessonConfig(id);
  for (const mode of ["practice", "challenge"]) {
    const rel = `math/practice-studio/${id}/${mode === "practice" ? "" : "challenge/"}index.html`;
    const tag = `[${id} ${mode}]`;
    const { html, data } = pageData(rel);
    assert.equal(data.v, 2);
    assert.equal(data.lesson, id);
    assert.equal(data.mode, mode);
    assert.ok(!storageKeys.has(data.storageKey), `${tag} reuses storage key ${data.storageKey}`);
    storageKeys.add(data.storageKey);
    assert.equal(data.sections.length, 5, `${tag} has five sections`);
    assert.ok(html.includes(`data-world="${worlds.lessons[id]}"`), `${tag} carries its world`);
    assert.ok(html.includes(`data-mode="${mode}"`), `${tag} carries its mode`);
    assert.ok(!html.includes("studio-items.js"), `${tag} still loads the retired runtime`);
    // every script and stylesheet the page loads exists
    for (const [, url] of html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)\?v=[0-9a-f]{10}"/g))
      assert.ok(existsSync(join(REPO_ROOT, url.slice(1))), `${tag} loads missing file ${url}`);
    const seen = new Set();
    for (const sec of data.sections) {
      assert.ok(sec.items.length >= 2, `${tag} section "${sec.name}" is too thin`);
      for (const it of sec.items) {
        assert.ok(it.id, `${tag} item without an id`);
        assert.ok(!seen.has(it.id), `${tag} duplicate item id ${it.id}`);
        seen.add(it.id);
        items++;
        if (it.k === "gen") {
          generated++;
          assert.ok(ctx.StudioGen.has(it.g), `${tag} uses unknown generator ${it.g}`);
          for (const seed of [1, 2, 3, 4, 5])
            assert.equal(
              ctx.StudioGen.verify(ctx.StudioGen.make(it.g, it.level, seed)),
              true,
              `${tag} ${it.g} L${it.level} seed ${seed} fails its own check`,
            );
        } else if (it.k === "act") {
          generated++;
          assert.ok(ctx.StudioAct.has(it.kind), `${tag} uses unknown activity ${it.kind}`);
          for (const seed of [1, 2, 3]) {
            const spec = ctx.StudioAct.make(it.kind, it.level, seed, it.p);
            const def = ctx.StudioAct.registry[it.kind];
            assert.equal(
              def.grade(spec, def.solution(spec)).ok,
              true,
              `${tag} ${it.kind} L${it.level} seed ${seed}: solution not accepted`,
            );
          }
        } else if (it.k === "mc") {
          assert.ok(
            Number.isInteger(it.a) && it.a >= 0 && it.a < it.c.length,
            `${tag} ${it.id}: answer index out of range`,
          );
          assert.equal(
            new Set(it.c.map(norm)).size,
            it.c.length,
            `${tag} ${it.id}: duplicate choices`,
          );
        }
      }
    }
    assert.ok(
      hub.includes(`<!-- practice-studio:${id} -->`),
      `${tag} is linked from the unit browser`,
    );
  }
  assert.ok(
    hub.includes(
      `<!-- practice-studio:${id} --><a class="res" href="/math/lesson-path/${id}/">Lesson path (one page)</a><a class="res" href="/math/practice-studio/${id}/">HTML practice</a><a class="res" href="/math/practice-studio/${id}/challenge/">HTML practice (Challenge)</a><!-- /practice-studio -->`,
    ),
    `[${id}] both studio links are on its row`,
  );

  /* answers are the lesson's own: re-derive each converted config multiple-choice item and find it on the page */
  const { data } = pageData(`math/practice-studio/${id}/index.html`);
  const onPage = new Map();
  const keyOf = (stem, choices) => `${norm(stem)}|${choices.map(norm).sort().join("~")}`;
  for (const sec of data.sections)
    for (const it of sec.items) if (it.k === "mc") onPage.set(keyOf(it.q, it.c), it);
  const connect = Array.isArray(cfg.connect?.check)
    ? cfg.connect.check
    : cfg.connect?.check
      ? [cfg.connect.check]
      : [];
  const pools = [
    cfg.practice?.approaching,
    cfg.practice?.onLevel,
    connect,
    cfg.reflect?.exitTicket ? [cfg.reflect.exitTicket] : [],
  ];
  for (const pool of pools)
    for (const q of pool || []) {
      if ((q.type || "multiple-choice") !== "multiple-choice") continue;
      const hit = onPage.get(keyOf(q.stem, q.choices));
      if (!hit) continue; // too long for its section, or needs a figure — fine
      const a = q.correctIndex ?? q.answer;
      assert.equal(
        norm(hit.c[hit.a]),
        norm(q.choices[a]),
        `[${id}] "${q.stem.slice(0, 50)}": the page's answer is not the lesson's`,
      );
    }
}

assert.ok(items > 2000, `expected 2,000+ items across the studios, found ${items}`);
assert.ok(generated > 800, `expected 800+ generated/hands-on slots, found ${generated}`);
console.log(
  `Practice studios: ${ids.length} lessons x 2 versions, ${items} items (${generated} fresh or hands-on slots).`,
);
