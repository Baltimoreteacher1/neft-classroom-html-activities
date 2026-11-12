#!/usr/bin/env node
/**
 * build-lesson-novels.mjs
 * ------------------------------------------------------------------
 * Builds the one-lesson Axiom City graphic novels ("lesson books"): one short illustrated book per lesson, covering
 * only that lesson's objective. The shell (cover, HUD, modals, engine, styles) is taken from the illustrated
 * Power Ring episode; the story, gates, badges and teacher guide come from
 *   graphic-novels/axiom-city/_engine/lessons/<id>/content.js
 * and the art from _engine/art/l<id>/panels.json (see ../graphic-novels/axiom-city/README.md, "Comic art pipeline").
 *
 * After building, write the art and the shared layer into the books:
 *   node tools/inject-gn-art.mjs && node tools/inject-gn-layer.mjs
 *
 * Usage:  node tools/build-lesson-novels.mjs [6-3 6-4 ...]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AC = join(ROOT, "graphic-novels", "axiom-city");
const SHELL = join(AC, "episodes", "axiom-city-u6-e2-the-power-ring.html");

/* One entry per lesson book. `lesson` is the lesson id the book teaches (its config's graphicNovel points here). */
export const LESSON_BOOKS = [
  {
    lesson: "6-3",
    file: "axiom-city-l6-3-the-power-dial.html",
    title: "The Power Dial",
    coverTitle: "THE POWER<br><em>DIAL</em>",
    topic: "EXPONENTS",
    label: "LESSON 6-3",
    gradeLine: "GRADE 6 · LESSON 6-3",
    pageTitle: "Exponents: Base, Exponent and Powers",
    covers: "reading, writing and evaluating powers with whole-number exponents",
    coverAlt:
      "Cover of Axiom City Lesson 6-3, The Power Dial. Andre, Mateo and Layla stand at the bottom of a lantern-lit stone vault, smiling up at a giant glowing stone dial, while VEX, a small teal robot with one golden eye, floats above them.",
  },
  {
    lesson: "6-4",
    file: "axiom-city-l6-4-the-order-lock.html",
    title: "The Order Lock",
    coverTitle: "THE ORDER<br><em>LOCK</em>",
    topic: "ORDER OF OPERATIONS",
    label: "LESSON 6-4",
    gradeLine: "GRADE 6 · LESSON 6-4",
    pageTitle: "Write and Evaluate Expressions with Exponents",
    covers:
      "writing numerical expressions from situations and evaluating them with the order of operations",
    coverAlt:
      "Cover of Axiom City Lesson 6-4, The Order Lock. Keiko, Andre and Layla stand at the bottom of a lantern-lit stone vault, smiling up at a huge round brass combination lock with three gold dials, while VEX, a small teal robot with one golden eye, floats above them.",
  },
];

/** Replace exactly one match, or fail: a shell that drifted must not produce a half-rewritten book. */
function swap(html, re, to, what) {
  const hits = html.match(new RegExp(re.source, re.flags.replace("g", "") + "g"));
  if (!hits || hits.length !== 1)
    throw new Error(`shell has ${hits ? hits.length : 0} match(es) for ${what}, expected 1`);
  return html.replace(re, () => to);
}

const CONTENT_START = /\/\* =+\n\s+===== CONTENT START[^\n]*\n\s+=+ \*\/\n/;
const CONTENT_END = /\/\* =+\n\s+===== CONTENT END/;

export function buildBook(spec, shell, content) {
  let h = shell;
  const t = spec.title;
  h = swap(
    h,
    /<title>[\s\S]*?<\/title>/,
    `<title>Axiom City ${spec.label.replace("LESSON ", "Lesson ")} — ${t} | Interactive Graphic Novel | ${spec.pageTitle}</title>`,
    "title",
  );
  h = swap(
    h,
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="Interactive Grade 6 math graphic novel for ${spec.label.replace("LESSON ", "lesson ")}: ${spec.covers}. Free-read, gates coach but never block. EduWonderLab.">`,
    "meta description",
  );
  h = swap(
    h,
    /aria-label="Cover of Axiom City[^"]*"/,
    `aria-label="${spec.coverAlt}"`,
    "cover label",
  );
  h = swap(h, /<h1>[\s\S]*?<\/h1>/, `<h1>${spec.coverTitle}</h1>`, "cover h1");
  h = swap(
    h,
    /<span class="vol">[\s\S]*?<\/span>/,
    `<span class="vol">${spec.label} · ${spec.topic}</span>`,
    "cover vol",
  );
  h = swap(
    h,
    /<div id="coverBottom">[\s\S]*?<\/div>/,
    `<div id="coverBottom"><span>AN INTERACTIVE<br>GRAPHIC NOVEL</span><span>${spec.gradeLine}<br>EDUWONDERLAB</span></div>`,
    "cover bottom",
  );
  h = swap(
    h,
    /<div class="brand">AXIOM CITY<small>[\s\S]*?<\/small><\/div>/,
    `<div class="brand">AXIOM CITY<small>${spec.label.replace("LESSON ", "L")} · ${t.toUpperCase()}</small></div>`,
    "hud brand",
  );
  h = swap(
    h,
    /<h2 id="tmTitle">[\s\S]*?<\/h2>/,
    `<h2 id="tmTitle">Teacher Guide — ${spec.label.replace("LESSON ", "Lesson ")}</h2>`,
    "teacher title",
  );
  const a = h.match(CONTENT_START);
  const b = h.match(CONTENT_END);
  if (!a || !b || b.index < a.index) throw new Error("shell has no CONTENT START/END markers");
  return `${h.slice(0, a.index + a[0].length)}${content.trimEnd()}\n${h.slice(b.index)}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const only = process.argv.slice(2);
  const targets = only.length ? LESSON_BOOKS.filter((s) => only.includes(s.lesson)) : LESSON_BOOKS;
  const shell = readFileSync(SHELL, "utf8");
  for (const spec of targets) {
    const content = readFileSync(join(AC, "_engine/lessons", spec.lesson, "content.js"), "utf8");
    const out = join(AC, "episodes", spec.file);
    writeFileSync(out, buildBook(spec, shell, content));
    console.log(`✓ ${spec.file} (lesson ${spec.lesson})`);
  }
}
