#!/usr/bin/env node
/**
 * Blood on the River — contact sheet + coverage audit for generated scene art.
 *
 * Builds an HTML contact sheet (art/contact-sheet.html) that lays each generated image
 * next to its scene title, setting, characters PRESENT, and characters ABSENT — the exact
 * fields the generation-rules.md checklist is audited against. Open it in a browser to run
 * the per-image visual audit (right moment / right cast / no absent cast / period accuracy /
 * classroom-appropriate / clean image).
 *
 * Also prints a coverage report: which of the 243 scenes have a .webp yet, and which don't.
 *
 * Usage:  node contact-sheet.mjs [--chapter N]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ART = join(HERE, "botr");
const chArg = (() => { const i = process.argv.indexOf("--chapter"); return i > -1 ? parseInt(process.argv[i + 1], 10) : null; })();

const scenes = (() => { const j = JSON.parse(readFileSync(join(HERE, "scene-prompts.json"), "utf8")); return Array.isArray(j) ? j : j.scenes; })()
  .filter((s) => !chArg || Number(s.chapter) === chArg);

const base = (s) => `ch${String(s.chapter).padStart(2, "0")}-scene-${s.scene}`;
const have = (s) => existsSync(join(ART, `${base(s)}.webp`)) || existsSync(join(ART, `${base(s)}.jpg`));

const present = scenes.filter(have);
const missing = scenes.filter((s) => !have(s));

const esc = (t) => String(t || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const card = (s) => {
  const src = existsSync(join(ART, `${base(s)}.webp`)) ? `botr/${base(s)}.webp` : `botr/${base(s)}.jpg`;
  const absent = (s.charactersAbsent || []);
  return `<figure class="c">
    ${have(s) ? `<img src="${src}" alt="${esc(s.title)}" loading="lazy">` : `<div class="missing">no image yet</div>`}
    <figcaption>
      <b>Ch ${s.chapter} · Scene ${s.scene}</b> — ${esc(s.title)}
      <div class="set">${esc(s.setting)}</div>
      <div class="cast"><b>Present:</b> ${esc((s.charactersPresent || []).join(", ") || "—")}</div>
      ${absent.length ? `<div class="absent"><b>MUST be absent:</b> ${esc(absent.join(", "))}</div>` : ""}
    </figcaption>
  </figure>`;
};

const html = `<!doctype html><meta charset="utf-8"><title>BoTR contact sheet${chArg ? ` — Ch ${chArg}` : ""}</title>
<style>
 body{font:14px/1.4 system-ui;margin:24px;background:#f7f4ec;color:#21313f}
 h1{font-size:20px} .meta{margin:4px 0 18px;color:#555}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
 .c{margin:0;background:#fff;border:1px solid #d7e2ed;border-radius:10px;overflow:hidden}
 .c img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}
 .missing{aspect-ratio:1/1;display:grid;place-items:center;background:#fce6de;color:#d9795d;font-weight:700}
 figcaption{padding:10px;font-size:12.5px}
 .set{color:#555;margin:4px 0;font-style:italic}
 .cast{margin-top:4px} .absent{margin-top:4px;color:#b03a2e;font-weight:600}
</style>
<h1>Blood on the River — scene art contact sheet${chArg ? ` (Chapter ${chArg})` : ""}</h1>
<div class="meta">${present.length}/${scenes.length} generated · audit each against generation-rules.md (right moment · right cast · <b>no absent cast</b> · period-accurate · classroom-appropriate · clean).</div>
<div class="grid">${scenes.map(card).join("\n")}</div>`;

const out = join(HERE, chArg ? `contact-sheet-ch${chArg}.html` : "contact-sheet.html");
writeFileSync(out, html);
console.log(`Contact sheet: ${out}`);
console.log(`Coverage: ${present.length}/${scenes.length} have art; ${missing.length} missing.`);
if (missing.length && missing.length <= 30) console.log("Missing:", missing.map(base).join(", "));
