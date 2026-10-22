import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import vm from "node:vm";
import { GUIDE_STEPS, workspaceHtml } from "../scripts/lib/family-workspace.mjs";
import { lessonPath, listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";

const component = (() => {
  const sandbox = {};
  vm.runInNewContext(
    readFileSync(join(REPO_ROOT, "assets/workspace/problem-workspace.js"), "utf8"),
    sandbox,
  );
  return sandbox.NTWorkspace;
})();
const homeworkPages = listLessonDirs()
  .map((id) => lessonPath(id, "homework.html"))
  .filter((path) => existsSync(path));

/** The problem sections of a page, each as its own markup string. */
const sections = (html) => html.split('<section class="problem-section').slice(1);

test("every homework problem carries one lean workspace shell with a notes box", () => {
  assert.ok(
    homeworkPages.length >= 160,
    `expected every homework page, found ${homeworkPages.length}`,
  );
  let problems = 0;
  for (const path of homeworkPages) {
    for (const section of sections(readFileSync(path, "utf8"))) {
      problems++;
      const where = `${path} ${section.slice(0, 60)}`;
      assert.equal(section.match(/<details class="hw-workspace-toggle fw"/g)?.length, 1, where);
      assert.equal(
        section.match(/class="custom-textarea hw-work-input fw-notes"/g)?.length,
        1,
        where,
      );
      assert.match(
        section,
        /data-fw-lazy/,
        `${where}: the shell is lean, the page script builds the tools`,
      );
      assert.ok(!section.includes("data-draw-"), `${where}: the old drawing frame is gone`);
    }
  }
  assert.ok(problems > 2000, `expected the whole practice set, found ${problems} problems`);
});

test("workspace keys are unique within a homework page so saved work never crosses problems", () => {
  for (const path of homeworkPages) {
    const keys = [
      ...readFileSync(path, "utf8").matchAll(
        /<details class="[^"]*\bfw\b[^"]*" data-fw="([^"]+)"/g,
      ),
    ].map((m) => m[1]);
    assert.equal(new Set(keys).size, keys.length, path);
  }
});

test("the family word-problems page gives every problem a workspace with its kind's tip", () => {
  const html = readFileSync(lessonPath("4-4", "family", "word-problems", "index.html"), "utf8");
  const cards = html.split('<section class="problem-section card wp-card').slice(1);
  assert.ok(cards.length >= 9);
  for (const card of cards) {
    assert.equal(card.match(/<details class="fw"/g)?.length, 1);
    assert.match(card, /data-fw-persist/);
    assert.match(card, /data-fw-tip-en="[^"]{20,}"/, "every kind of problem has its guidance line");
    assert.match(card, /data-fw-stamp="percent"/, "unit 4 offers the 100 grid");
  }
});

test("guidance steps are the same five in both languages and hold no digits", () => {
  for (const step of GUIDE_STEPS) {
    for (const lang of ["en", "es"]) {
      assert.ok(step.name[lang] && step.ask[lang] && step.starter[lang]);
      assert.ok(
        !/\d/.test(step.ask[lang] + step.starter[lang].replace("Step 1", "").replace("Paso 1", "")),
      );
    }
  }
});

test("the full markup carries the five guide steps and the toolbar; the lean shell carries neither", () => {
  const base = { key: "k", notesId: "n", caption: { en: "c", es: "c" } };
  const full = component.html(base);
  assert.equal(full.match(/data-fw-add /g)?.length, GUIDE_STEPS.length);
  assert.match(full, /class="fw-tools"/);
  const lean = workspaceHtml(base);
  assert.doesNotMatch(lean, /data-fw-add|fw-tools|fw-guide/);
  assert.match(component.html({ ...base, dialect: "studio" }), /class="es-text"/);
});

test("a workspace with a model shows the model page, one without opens on the grid", () => {
  const base = { key: "k", notesId: "n", caption: { en: "c", es: "c" } };
  assert.match(workspaceHtml({ ...base, model: "<svg></svg>" }), /data-fw-bg="model"/);
  assert.match(workspaceHtml(base), /data-fw-bg="grid"/);
  assert.doesNotMatch(workspaceHtml(base), /class="fw-model"/);
});

test("the student word-problems page gives every problem a workspace in the studio dialect", () => {
  const html = readFileSync(lessonPath("4-4", "word-problems", "index.html"), "utf8");
  const cards = html.split('<article class="stage-card wp-card').slice(1);
  assert.ok(cards.length >= 9);
  for (const card of cards) {
    assert.equal(card.match(/<details class="fw"/g)?.length, 1);
    assert.match(card, /data-fw-dialect="studio"/);
    assert.match(card, /data-fw-persist/);
  }
});

test("every generated Practice Studio page loads the workspace, and the runtime draws it for written kinds", () => {
  const studios = join(REPO_ROOT, "math/practice-studio");
  const pages = readdirSync(studios).flatMap((id) => [
    join(studios, id, "index.html"),
    join(studios, id, "challenge", "index.html"),
  ]);
  let checked = 0;
  for (const page of pages) {
    let html;
    try {
      html = readFileSync(page, "utf8");
    } catch {
      continue;
    }
    if (!html.includes('id="studio-data"')) continue;
    checked++;
    assert.match(html, /problem-workspace\.css/, page);
    assert.match(html, /problem-workspace\.js/, page);
  }
  assert.ok(checked >= 134, `expected 67 lessons x 2 studios, found ${checked}`);
  const runtime = readFileSync(join(REPO_ROOT, "assets/studio/runtime.js"), "utf8");
  assert.match(runtime, /WORKSPACE_KINDS = new Set\(\["mc", "num", "err", "tbl", "wr"\]\)/);
  assert.match(
    runtime,
    /NTWorkspace\?\.forget\(id\)/,
    "a re-rolled problem starts with an empty workspace",
  );
});
