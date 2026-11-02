#!/usr/bin/env node
/**
 * Writes the two Unit 4 Test Practice pages from data/unit4-test-practice.mjs:
 *   curriculum/unit-4-test-practice/index.html
 *   curriculum/unit-4-test-practice-challenge/index.html
 * Both load assets/u4-test-practice.{css,js}. `--check` fails when a page on disk is stale.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PAGES, STRANDS, TOOLBOX } from "../data/unit4-test-practice.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://eduwonderlab.com";
const UNIT_URL = "/curriculum/units/?u=4#unit-4";
const ASSET_V = "20261029";

const esc = (/** @type {string} */ s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** @param {"practice"|"challenge"} kind */
function page(kind) {
  const p = PAGES[kind];
  const other = PAGES[kind === "practice" ? "challenge" : "practice"];
  const challenge = kind === "challenge";
  const description = challenge
    ? "Challenge practice for the Grade 6 Unit 4 Test on percents: tape diagrams, percents over 100% and under 1%, equivalent values, finding the whole, combining parts, benchmark estimates, and two-step claims. New numbers, hints, English and Spanish."
    : "Practice for the Grade 6 Unit 4 Test on percents: tape diagrams, fractions, decimals and percents, percent of a number, finding the whole, combining parts, benchmark estimates, and claim questions. New numbers, hints, English and Spanish.";
  const links = [
    `<a href="${other.slug === "unit-4-test-practice" ? "/curriculum/unit-4-test-practice/" : "/curriculum/unit-4-test-practice-challenge/"}">${challenge ? "Practice version" : "Challenge version"} · ${challenge ? "Versión de práctica" : "Versión de desafío"}</a>`,
    `<a href="${UNIT_URL}">Unit 4 · Unidad 4</a>`,
    `<a href="/curriculum/unit-4-test-review/">Family Test Review</a>`,
    `<a href="/curriculum/unit-4-adventure-review/">The Hundred Lanterns</a>`,
  ].join(" · ");
  const config = {
    key: challenge ? "challenge" : "practice",
    title: p.title,
    pitch: p.pitch,
    strands: STRANDS,
    toolbox: TOOLBOX,
    items: p.items,
    links,
  };
  const json = JSON.stringify(config).replace(/</g, "\\u003c");
  const title = `${p.title.en} | Grade 6 Percents`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="theme-color" content="#15487f" />
    <link rel="canonical" href="${SITE}/curriculum/${p.slug}/" />
    <link href="/assets/fonts/outfit-hanken-grotesk-56e206.css" rel="stylesheet" />
    <link href="/assets/fonts/fraunces-hanken-grotesk-e8a3b5.css" rel="stylesheet" />
    <link rel="stylesheet" href="/assets/u4-test-practice.css?v=${ASSET_V}" />
  </head>
  <body class="lang-en${challenge ? " tp-challenge" : ""}">
    <a class="skip-link" href="#tp-root">Skip to practice / Ir a la práctica</a>
    <header class="tp-top">
      <div class="tp-top-in">
        <div>
          <h1><span class="l-en">${esc(p.title.en)}</span><span class="l-es" lang="es">${esc(p.title.es)}</span></h1>
          <small><span class="l-en">${esc(p.sub.en)}</span><span class="l-es" lang="es">${esc(p.sub.es)}</span></small>
        </div>
        <div class="tp-tools" role="group" aria-label="Page options">
          <button type="button" class="tp-btn" data-lang="en" aria-pressed="true">English</button>
          <button type="button" class="tp-btn" data-lang="es" aria-pressed="false">Español</button>
          <button type="button" class="tp-btn" data-lang="both" aria-pressed="false">EN + ES</button>
          <button type="button" class="tp-btn" data-zoom aria-label="Change text size / Cambiar tamaño de texto">A+</button>
          <button type="button" class="tp-btn" data-print>🖨️ Print</button>
        </div>
      </div>
    </header>
    <main class="tp-wrap" id="tp-root"><noscript>This practice needs JavaScript. / Esta práctica necesita JavaScript.</noscript></main>
    <script type="application/json" id="tp-config">${json}</script>
    <script src="/assets/u4-test-practice.js?v=${ASSET_V}" defer></script>
  </body>
</html>
`;
}

const OUT = {
  practice: "curriculum/unit-4-test-practice/index.html",
  challenge: "curriculum/unit-4-test-practice-challenge/index.html",
};

const check = process.argv.includes("--check");
let stale = 0;
for (const kind of /** @type {const} */ (["practice", "challenge"])) {
  const file = join(ROOT, OUT[kind]);
  const html = page(kind);
  if (check) {
    if (!existsSync(file) || readFileSync(file, "utf8") !== html) {
      console.error(`stale: ${OUT[kind]}`);
      stale += 1;
    }
  } else {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    console.log(`wrote ${OUT[kind]}`);
  }
}
if (stale) process.exit(1);
