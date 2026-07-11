#!/usr/bin/env node
/* Inject a consistent top bar (back-to-unit · game title · All games) into the
 * Phaser unit games at math/unit-N/games/*.html, giving them the same page
 * chrome as the DOM lesson-band games without touching gameplay.
 *
 * - Adds <link rel="stylesheet" href="/assets/game-topbar.css"> before </head>
 * - Inserts <header class="nt-game-topbar"> right after <body ...>
 * - Idempotent: skips a file that already carries the bar.
 *
 * Overlay bar (position:fixed) — never resizes the Phaser canvas.
 * Run: node tools/inject-game-topbar.js
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CSS_HREF = "/assets/game-topbar.css";
const MARKER = 'class="nt-game-topbar"';

const FILES = [
  "math/unit-1/games/unit1-factor-frenzy.html",
  "math/unit-2/games/unit2-fraction-foundry.html",
  "math/unit-2/games/unit2-fraction-kitchen.html",
  "math/unit-3/games/unit3-ratio-rally.html",
  "math/unit-4/games/unit4-discount-dash.html",
  "math/unit-5/games/unit5-area-architect.html",
  "math/unit-6/games/unit6-expression-engine.html",
  "math/unit-7/games/unit9-coordinate-quest.html",
  "math/unit-8/games/unit7-equation-escape.html",
  "math/unit-9/games/unit9-variable-velocity.html",
  "math/unit-10/games/unit10-volume-vault.html",
];

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function gameTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  if (!m) return "Math Game";
  // Drop a trailing " | Unit N" / " | Neft Teacher" segment; keep any em-dash subtitle.
  return m[1].replace(/\s*\|\s*[^|]*$/, "").trim();
}

function unitNum(file) {
  const m = file.match(/unit-(\d+)\//);
  return m ? m[1] : "?";
}

function header(file, html) {
  const n = unitNum(file);
  const title = esc(gameTitle(html));
  return (
    `\n    <!-- nt-game-topbar-injected:begin (tools/inject-game-topbar.js) -->` +
    `\n    <header class="nt-game-topbar" role="banner">` +
    `<span class="ngt-title">${title}</span>` +
    `</header>` +
    `\n    <!-- nt-game-topbar-injected:end -->`
  );
}

let changed = 0;
const results = [];
for (const rel of FILES) {
  const abs = join(ROOT, rel);
  let html = readFileSync(abs, "utf8");
  if (html.includes(MARKER)) {
    results.push(`skip (already present): ${rel}`);
    continue;
  }

  // 1) stylesheet link before </head>
  const headClose = html.indexOf("</head>");
  if (headClose < 0) throw new Error(`no </head> in ${rel}`);
  const link = `    <link rel="stylesheet" href="${CSS_HREF}" />\n  `;
  html = html.slice(0, headClose) + link + html.slice(headClose);

  // 2) header right after the <body ...> open tag
  const bodyOpen = html.match(/<body[^>]*>/i);
  if (!bodyOpen) throw new Error(`no <body> in ${rel}`);
  const at = bodyOpen.index + bodyOpen[0].length;
  html = html.slice(0, at) + header(rel, html) + html.slice(at);

  writeFileSync(abs, html);
  results.push(`OK  ${rel}  (Unit ${unitNum(rel)} · "${gameTitle(html)}")`);
  changed++;
}

console.log(results.join("\n"));
console.log(`\nDone. ${changed}/${FILES.length} files updated.`);
