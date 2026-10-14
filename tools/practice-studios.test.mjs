// Generated practice studios for Units 2-9 (/math/practice-studio/<lesson>/).
//
// Every question, answer and hint in a studio is copied from the lesson's own config, so the risks are
// (1) a stale page after a config edit, (2) a mapping slip that points a studio at another item's answer,
// and (3) an item the studio cannot actually grade. This re-reads each config independently of the
// generator's own mapping code and compares it with the JSON the page ships.

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LIMITS, outputs, STUDIO_UNITS } from "../scripts/generate-practice-studios.mjs";
import { listLessonDirs, loadLessonConfig, REPO_ROOT } from "./lib/curriculum-source.mjs";

const { files, report } = outputs();

/* ---- every generated file is current on disk ---------------------------------------------------- */
for (const [rel, content] of files) {
  const path = join(REPO_ROOT, rel);
  assert.ok(existsSync(path), `${rel} is missing; run: node scripts/generate-practice-studios.mjs`);
  assert.equal(
    readFileSync(path, "utf8"),
    content,
    `${rel} is stale; run: node scripts/generate-practice-studios.mjs`,
  );
}

const ids = listLessonDirs({ filter: /^\d+-\d+$/ }).filter((id) =>
  STUDIO_UNITS.includes(Number(id.split("-")[0])),
);
assert.equal(report.length, ids.length, "every core lesson in Units 2-9 has a studio");
assert.ok(ids.length >= 60, `expected 60+ lessons, found ${ids.length}`);
assert.ok(!STUDIO_UNITS.includes(4), "Unit 4 keeps its hand-built studios");

const hub = readFileSync(join(REPO_ROOT, "curriculum/units/index.html"), "utf8");
const norm = (s) => String(s).replace(/\s+/g, " ").trim().toLowerCase();
let items = 0;
const storageKeys = new Set();

for (const id of ids) {
  const html = readFileSync(join(REPO_ROOT, `math/practice-studio/${id}/index.html`), "utf8");
  const data = JSON.parse(
    html.match(/id="studio-data">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, "<"),
  );
  const cfg = loadLessonConfig(id);
  const tag = `[${id}]`;
  assert.equal(data.lesson, id);
  assert.ok(!storageKeys.has(data.storageKey), `${tag} reuses storage key ${data.storageKey}`);
  storageKeys.add(data.storageKey);
  assert.equal(data.sections.length, 5, `${tag} has five sections`);
  assert.ok(
    html.includes(`<!-- practice-studio:${id} -->`) ||
      hub.includes(
        `<!-- practice-studio:${id} --><a class="res" href="/math/practice-studio/${id}/">HTML practice</a>`,
      ),
    `${tag} is linked from the unit browser`,
  );
  assert.ok(
    hub.includes(
      `<!-- practice-studio:${id} --><a class="res" href="/math/practice-studio/${id}/">HTML practice</a><!-- /practice-studio -->`,
    ),
    `${tag} hub link`,
  );

  // The item id names its source: w warm-up, a/o/x/p practice tier, c connect check, e exit ticket, then the
  // 1-based position in that authored list. Look it up here independently of the generator.
  const lists = {
    w: cfg.warmup?.questions || [],
    a: cfg.practice?.approaching || [],
    o: cfg.practice?.onLevel || [],
    x: cfg.practice?.extending || [],
    p: cfg.practice?.optional || [],
    c: Array.isArray(cfg.connect?.check)
      ? cfg.connect.check
      : cfg.connect?.check
        ? [cfg.connect.check]
        : [],
    e: cfg.reflect?.exitTicket ? [cfg.reflect.exitTicket] : [],
  };
  const sourceOf = (id) => lists[id[0]]?.[Number(id.slice(1)) - 1];

  const seen = new Set();
  data.sections.forEach((section, si) => {
    assert.ok(
      section.items.length >= 2 && section.items.length <= LIMITS[si + 1],
      `${tag} section ${si + 1} item count ${section.items.length}`,
    );
    for (const it of section.items) {
      items++;
      assert.ok(!seen.has(it.id), `${tag} duplicate item id ${it.id}`);
      seen.add(it.id);
      const src = sourceOf(it.id);
      assert.ok(src, `${tag} ${it.id}: no such authored item`);
      const authoredText = src.stem || src.prompt || src.title || src.label;
      if (authoredText)
        assert.equal(
          norm(it.q ?? it.t ?? it.p),
          norm(authoredText),
          `${tag} ${it.id}: text differs from the lesson`,
        );
      else
        assert.ok(
          ["Fill in the table", "Find the mistake"].includes(it.t),
          `${tag} ${it.id}: invented caption`,
        );
      if (it.k === "mc") {
        const right = src.correctIndex ?? src.answer;
        assert.equal(it.a, right, `${tag} ${it.id}: correct choice differs from the lesson`);
        assert.equal(
          norm(it.c[it.a]),
          norm(src.choices[right]),
          `${tag} ${it.id}: the right choice text differs`,
        );
        assert.deepEqual(it.c, src.choices.map(String), `${tag} ${it.id}: choices differ`);
        assert.equal(
          new Set(it.c.map(norm)).size,
          it.c.length,
          `${tag} ${it.id}: duplicate choices`,
        );
      } else if (it.k === "err") {
        assert.equal(it.e, src.errorStep, `${tag} ${it.id}: error step differs`);
        assert.ok(it.e >= 0 && it.e < it.s.length, `${tag} ${it.id}: error step out of range`);
        assert.equal(it.s.length, src.workedExample.length);
      } else if (it.k === "tbl") {
        assert.deepEqual(
          it.cells.map((c) => [c.r, c.c, c.a]),
          src.editableCells.map((c) => [c.row, c.col, String(c.answer)]),
          `${tag} ${it.id}: table answers differ`,
        );
        for (const c of it.cells)
          assert.equal(it.rows[c.r][c.c], "", `${tag} ${it.id}: an answer cell is pre-filled`);
      } else if (it.k === "wr") {
        assert.ok(it.min >= 1 && it.x, `${tag} ${it.id}: written item needs a length and a model`);
      } else assert.fail(`${tag} ${it.id}: unknown kind ${it.k}`);
    }
  });
}

/* ---- nothing the studio cannot grade is offered ------------------------------------------------- */
for (const r of report) assert.ok(r.total >= 10, `${r.id}: only ${r.total} items`);
const kinds = JSON.stringify(report.map((r) => r.left));
assert.ok(
  !/"multiple-choice \(answer index/.test(kinds),
  "an authored MC item has an out-of-range answer index",
);

console.log(
  `practice-studios: ${ids.length} lessons, ${items} items re-checked against their lesson configs; every file current`,
);
