/**
 * The family paper system (assets/family-paper.css) is the one look shared by the
 * family hub, the lesson guide, the homework pages and the practice library.
 * Pins: unit hues stay in step with the hub, text-safe inks stay readable, and
 * every surface really loads the tokens (a page that silently dropped them would
 * fall back to the old per-lesson palettes).
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { lessonPath } from "./lib/curriculum-source.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const readLesson = (id, ...segments) => readFileSync(lessonPath(id, ...segments), "utf8");
const paperCss = read("assets/family-paper.css");

const units = Object.fromEntries(
  [...paperCss.matchAll(/\[data-unit="(\d+)"\]\s*\{([^}]*)\}/g)].map(([, n, body]) => [
    n,
    Object.fromEntries(
      [...body.matchAll(/--fp-unit(-ink|-tint)?:\s*(#[0-9a-f]{6})/gi)].map((m) => [
        m[1] ?? "",
        m[2],
      ]),
    ),
  ]),
);

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test("every unit 1-10 has a hue, a text-safe ink and a tint", () => {
  for (let n = 1; n <= 10; n++) {
    const u = units[n];
    assert.ok(u?.[""] && u["-ink"] && u["-tint"], `unit ${n} is missing a token`);
  }
});

test("unit hues match the hub, except Unit 4 which never uses purple", () => {
  const hub = read("assets/curriculum-system.css");
  for (let n = 1; n <= 10; n++) {
    const hubHue = new RegExp(`--unit-${n}:\\s*(#[0-9a-f]{6})`, "i").exec(hub)?.[1];
    assert.ok(hubHue, `hub lost --unit-${n}`);
    if (n === 4) {
      assert.notEqual(
        units[4][""].toLowerCase(),
        hubHue.toLowerCase(),
        "Unit 4 keeps its own non-purple hue",
      );
      continue;
    }
    assert.equal(
      units[n][""].toLowerCase(),
      hubHue.toLowerCase(),
      `unit ${n} drifted from the hub`,
    );
  }
});

test("the unit ink clears 7:1 on paper and white text on it clears 4.5:1", () => {
  for (let n = 1; n <= 10; n++) {
    const ink = units[n]["-ink"];
    assert.ok(contrast(ink, "#fffdf8") >= 7, `unit ${n} ink fails on paper`);
    assert.ok(contrast(ink, "#ffffff") >= 4.5, `unit ${n} ink fails under white text`);
  }
  assert.ok(contrast("#566175", "#fffdf8") >= 4.5, "muted text fails on paper");
  assert.ok(contrast("#6b4a00", "#fff4cf") >= 4.5, "note ink fails on the note highlight");
});

test("no purple anywhere in the paper tokens", () => {
  assert.doesNotMatch(paperCss, /#7c3aed|#5b21b6|#ede9fe|#312e81|#4c3d7e|#7653b7|#f0eafd|#7a5aa6/i);
});

test("every family surface loads the tokens and the unit hue", () => {
  const guide = readLesson("4-3", "family", "index.html");
  assert.match(guide, /<html lang="en" data-unit="4">/);
  assert.match(guide, /--fp-paper:\s*#fffdf8/);
  const homework = readLesson("4-4", "homework.html");
  assert.match(homework, /<html lang="en" data-unit="4">/);
  for (const sheet of ["tokens", "family", "body"])
    assert.match(homework, new RegExp(`/assets/design/family/${sheet}\\.css\\?v=[0-9a-f]+`));
  assert.ok(
    read("assets/design/family/tokens.css").includes("--unit-4-accent"),
    "the design tokens carry the per-unit hue",
  );
  for (const page of [
    "curriculum/family-connections/index.html",
    "curriculum/practice-workbooks/index.html",
  ]) {
    const html = read(page);
    assert.match(html, /\/assets\/family-paper\.css/, `${page} loads the paper tokens`);
    assert.match(
      html,
      /<body[^>]*class="[^"]*\bfp-surface\b/,
      `${page} opts into the paper surface`,
    );
    assert.ok(
      html.indexOf("/assets/family-paper.css") < html.indexOf("/assets/curriculum-system.css"),
      `${page}: the paper file loads first so high-contrast rules still win`,
    );
  }
});

test("lessons do not carry their own palettes any more", () => {
  const generator = read("scripts/generate-homework-html.mjs");
  assert.doesNotMatch(generator, /body\[data-family-style="(arcade|case-file|unlock)"\]/);
});
