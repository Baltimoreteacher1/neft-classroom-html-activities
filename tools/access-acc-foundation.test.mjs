#!/usr/bin/env node
/**
 * Phase 1 contract for the ACCESS enterprise layer: one token set, one route registry, one disclaimer,
 * no unrelated EduWonderLab apps loaded into ACCESS pages. Pure file checks plus WCAG contrast arithmetic.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { CHROME } from "../access-practice-lab/src/acc/copy.js";
import { ACC_ROUTES, trail } from "../access-practice-lab/src/acc/routes.js";
import { crumbsHTML, ecoBarHTML, footerHTML } from "../access-practice-lab/src/acc/shell.js";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

const read = (p) => readFileSync(join(REPO_ROOT, p), "utf8");
const CSS = read("access-practice-lab/acc.css");
const token = (name) => CSS.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1].toLowerCase();

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test("the core --acc-* palette is exactly the published contract", () => {
  const contract = {
    "acc-slate": "#0f172a",
    "acc-canvas": "#f8fafc",
    "acc-border": "#cbd5e1",
    "acc-focus": "#1d63ed",
    "acc-success": "#15803d",
    "acc-error": "#dc2626",
    "acc-highlight-yellow": "#fef08a",
    "acc-highlight-blue": "#bae6fd",
    "acc-highlight-green": "#bbf7d0",
  };
  for (const [name, value] of Object.entries(contract))
    assert.equal(token(name), value, `--${name}`);
});

test("text, focus and feedback colours meet WCAG AA on the surfaces they sit on", () => {
  const pairs = [
    ["acc-slate", "acc-canvas", 4.5],
    ["acc-text-muted", "acc-surface", 4.5],
    ["acc-text-subtle", "acc-canvas", 4.5],
    ["acc-text-subtle", "acc-surface", 4.5],
    ["acc-focus", "acc-surface", 3],
    ["acc-focus", "acc-canvas", 3],
    ["acc-control-border", "acc-surface", 3],
    ["acc-success", "acc-surface", 4.5],
    ["acc-error", "acc-surface", 4.5],
    ["acc-link", "acc-surface", 4.5],
    ["acc-warn", "acc-warn-soft", 4.5],
    ["acc-on-primary", "acc-primary", 4.5],
    ["acc-slate", "acc-highlight-yellow", 7],
    ["acc-slate", "acc-highlight-blue", 7],
    ["acc-slate", "acc-highlight-green", 7],
    ["acc-d-listening", "acc-surface", 4.5],
    ["acc-d-reading", "acc-surface", 4.5],
    ["acc-d-speaking", "acc-surface", 4.5],
    ["acc-d-writing", "acc-surface", 4.5],
    ["acc-error-ink", "acc-error-soft", 4.5],
    ["acc-success", "acc-success-soft", 4.5],
  ];
  const failures = [];
  for (const [fg, bg, min] of pairs) {
    const a = token(fg);
    const b = token(bg);
    assert.ok(a && b, `token missing: ${fg} or ${bg}`);
    const r = ratio(a, b);
    if (r < min) failures.push(`${fg} on ${bg} = ${r.toFixed(2)} (needs ${min})`);
  }
  assert.deepEqual(failures, []);
});

test("targets are 48px, focus is visible, motion is reduced on request", () => {
  assert.match(CSS, /--acc-target:\s*3rem/);
  assert.match(CSS, /:focus-visible\s*\{[^}]*var\(--acc-focus\)/);
  assert.match(CSS, /prefers-reduced-motion:\s*reduce/);
});

test("the ecosystem ships English and Spanish only", () => {
  assert.deepEqual(Object.keys(CHROME).sort(), ["en", "es"]);
  assert.ok(!/:lang\((ar|vi|ht)\)/.test(CSS), "no Arabic, Vietnamese or Haitian Creole styles");
});

test("every registered ACCESS route resolves to a page and trails end at the lab", () => {
  for (const r of ACC_ROUTES) {
    const dir = r.path.replace(/^\//, "").replace(/\/$/, "");
    const app = r.path.startsWith("/access-practice-lab/");
    assert.ok(app || existsSync(join(REPO_ROOT, dir, "index.html")), `${r.path} has no index.html`);
    assert.equal(trail(r.id)[0].id, "lab", `${r.id} trail does not start at the lab`);
  }
  assert.equal(new Set(ACC_ROUTES.map((r) => r.id)).size, ACC_ROUTES.length);
  assert.equal(new Set(ACC_ROUTES.map((r) => r.path)).size, ACC_ROUTES.length);
});

test("standalone ACCESS pages load tokens and the shell, and carry a section", () => {
  const pages = {
    "access-teacher/index.html": "teacher",
    "access-family-tour/index.html": "tour",
    "access-family-expedition/index.html": "adventure",
    "access-expedition/index.html": "expedition",
  };
  for (const [file, section] of Object.entries(pages)) {
    const html = read(file);
    assert.match(html, /\/access-practice-lab\/acc\.css/, `${file} loads acc.css`);
    assert.match(html, /\/access-practice-lab\/src\/acc\/shell\.js/, `${file} loads the shell`);
    assert.match(html, new RegExp(`<body[^>]*data-acc-section="${section}"`), `${file} section`);
  }
  assert.match(read("access-practice-lab/index.html"), /acc\.css\?v=[0-9a-f]{12}/);
});

test("ACCESS pages do not load Math Workbench or formula pop-up scripts", () => {
  for (const f of [
    "access-practice-lab/index.html",
    "access-practice-lab/app-shell",
    "access-teacher/index.html",
    "access-family-tour/index.html",
    "access-family-expedition/index.html",
    "access-expedition/index.html",
  ])
    assert.ok(
      !/math-workbench-launcher|formula-popup/.test(read(f)),
      `${f} still loads a math tool`,
    );
  const injector = read("tools/inject-math-workbench.js");
  for (const dir of [
    "access-practice-lab",
    "access-teacher",
    "access-expedition",
    "access-family-expedition",
    "access-family-tour",
  ])
    assert.ok(injector.includes(`"${dir}"`), `inject-math-workbench must skip ${dir}`);
});

test("shell markup is accessible and states the practice-material disclaimer", () => {
  assert.match(ecoBarHTML("teacher"), /aria-label="ACCESS sections"/);
  assert.match(ecoBarHTML("teacher"), /aria-current="page"[^>]*>Teacher Hub/);
  assert.match(
    crumbsHTML("tour"),
    /Practice Lab[\s\S]*Family Corner[\s\S]*aria-current="page">Family Expedition/,
  );
  for (const lang of ["en", "es"]) {
    const foot = footerHTML(lang);
    assert.match(
      foot,
      lang === "en"
        ? /not an official WIDA or DRC assessment/
        : /No es una evaluación oficial de WIDA ni de DRC/,
    );
    assert.ok(
      !/certif|FERPA|endorsed by (?!WIDA)/i.test(
        CHROME[lang].disclaimer.replace(/respaldado por|not affiliated with or endorsed by/g, ""),
      ),
      "no certification or compliance claims",
    );
  }
  assert.match(read("access-practice-lab/src/nav.js"), /CHROME\.en\.disclaimer/);
});
