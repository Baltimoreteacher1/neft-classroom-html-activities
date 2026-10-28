/**
 * The Case File card that opens the Learn stop.
 *
 * Nothing here invents lesson content. The scene is the lesson's own worked
 * example (`launch.conceptIntro.iDo`), "your case" is the sentence the page
 * already prints as "What we're learning tonight", and the evidence cards are
 * the lesson's first three vocabulary terms with their plain definitions.
 * A lesson may add a hunch, a price-tag picture and a build-up lab in
 * `data/family-case-file/<id>.json`; the gate `tools/homework-case-file.test.mjs`
 * checks that file's arithmetic.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const EXTRAS_DIR = join(ROOT, "data", "family-case-file");

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es || en)}</span>`;

export function loadExtras(lessonId) {
  const file = join(EXTRAS_DIR, `${lessonId}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
}

/** The build-up lab's numbers, derived so a data file can never state a wrong answer. */
export function buildUpFacts({ part, pct }) {
  const blocks = pct / 10;
  const per = part / blocks;
  return { blocks, per, whole: per * 10, steps: 10 - blocks };
}

export function validateExtras(x) {
  const errors = [];
  if (x.buildUp) {
    const { part, pct } = x.buildUp;
    if (!(Number.isInteger(pct) && pct > 0 && pct < 100 && pct % 10 === 0))
      errors.push("buildUp.pct must be a multiple of 10 between 10 and 90");
    else if (!Number.isInteger(part / (pct / 10)))
      errors.push("buildUp.part must split into equal 10% blocks");
  }
  if (x.hunch) {
    const right = (x.hunch.options || []).filter((o) => o.right);
    if (right.length !== 1) errors.push("hunch needs exactly one right option");
    for (const o of x.hunch.options || [])
      if (!o.en || !o.es || !o.say?.en || !o.say?.es)
        errors.push(`hunch option ${o.id} lacks a language`);
  }
  return errors;
}

const stem = (w) => w.toLowerCase().replace(/s$/, "");
const words = (t) =>
  String(t)
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w.length > 3)
    .map(stem);

/** Up to three clue terms that teach something the title does not already say.
 *  A multi-word term whose words all appear in the title or in a term already
 *  chosen (or the reverse) is the same idea twice. One-word terms such as
 *  "part" and "whole" are real clues and are never dropped for that reason. */
export function pickEvidence(vocab, titleEn) {
  const sameIdea = (a, b) => {
    const x = words(a);
    const y = words(b);
    const inside = (p, q) => p.length >= 2 && p.every((w) => q.includes(w));
    return inside(x, y) || inside(y, x);
  };
  const chosen = [];
  for (const v of vocab || []) {
    if (!v.term || !v.definition) continue;
    if (
      v.term === titleEn ||
      sameIdea(v.term, titleEn) ||
      chosen.some((c) => sameIdea(v.term, c.term))
    )
      continue;
    chosen.push(v);
    if (chosen.length === 3) break;
  }
  return chosen;
}

function tagSvg(tag) {
  return `<svg class="cf-tag" viewBox="0 0 340 130" role="img" aria-label="${esc(tag.en)}">
    <path d="M20 20 h210 l40 45 l-40 45 h-210 a10 10 0 0 1 -10 -10 v-70 a10 10 0 0 1 10 -10z" fill="#fffaf0" stroke="#f2c15b" stroke-width="4"/>
    <circle cx="250" cy="65" r="8" fill="#12355b"/>
    <text x="120" y="68" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="46" fill="#12355b">${esc(tag.big)}</text>
    <text x="120" y="98" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="17" fill="#8a5a00">${esc(tag.en)}</text>
  </svg>`;
}

function hunchHtml(h) {
  return `<div class="cf-q" data-cf-hunch>
    <p>${bi(h.q.en, h.q.es)}</p>
    <div class="cf-row">${h.options
      .map(
        (o) =>
          `<button class="cf-btn alt" type="button" data-cf-pick="${esc(o.id)}" data-right="${o.right ? 1 : 0}">${bi(o.en, o.es)}</button>`,
      )
      .join("")}</div>
    ${h.options
      .map(
        (o) =>
          `<div class="cf-fb${o.right ? "" : " no"}" role="status" data-cf-say="${esc(o.id)}" hidden>${bi(o.say.en, o.say.es)}</div>`,
      )
      .join("")}
  </div>`;
}

function labHtml(b) {
  const f = buildUpFacts(b);
  const money = (n) => `${b.sym || ""}${n}`;
  return `<div class="cf-lab" data-cf-lab='${esc(JSON.stringify({ ...b, ...f }))}'>
    <h3>${bi("The lab: build up to the whole", "El laboratorio: construyan hasta el total")}</h3>
    <p class="cf-msg" data-cf-msg>${bi(
      `Split ${money(b.part)} into ${f.blocks} equal blocks, then add the next 10% until you reach 100%.`,
      `Dividan ${money(b.part)} en ${f.blocks} bloques iguales y luego agreguen el siguiente 10% hasta llegar al 100%.`,
    )}</p>
    <svg class="cf-line" viewBox="0 0 350 208" role="img" aria-label="Double number line. Top: percent. Bottom: amounts." data-cf-svg></svg>
    <div class="cf-row">
      <button class="cf-btn" type="button" data-cf-split>${bi(`1 · Split ${money(b.part)} into ${f.blocks} blocks`, `1 · Dividan ${money(b.part)} en ${f.blocks} bloques`)}</button>
      <button class="cf-btn" type="button" data-cf-grow disabled>${bi("2 · Add the next 10%", "2 · Agreguen el siguiente 10%")}</button>
    </div>
  </div>`;
}

/**
 * @param {object} p
 * @param {string} p.lessonId
 * @param {{en:string, es:string}} p.title
 * @param {{en:string, es:string}} p.tonight   the "What we're learning tonight" sentence
 * @param {{en:string, es:string}|null} p.scene the worked example's first line
 * @param {Array<{term, termEs, definition, definitionEs}>} p.vocab plain definitions
 */
export function renderCaseFile({ lessonId, title, tonight, scene, vocab }) {
  const extras = loadExtras(lessonId);
  const errors = extras ? validateExtras(extras) : [];
  if (errors.length)
    throw new Error(`data/family-case-file/${lessonId}.json: ${errors.join("; ")}`);
  const evidence = pickEvidence(vocab, title.en);
  const evidenceHtml = evidence
    .map(
      (v, i) => `<button class="cf-ev-card" type="button" aria-expanded="false" data-cf-ev>
        <b>${bi(`Clue ${i + 1}`, `Pista ${i + 1}`)}</b>
        <span class="cf-ev-term">${bi(v.term, v.termEs || v.term)}</span>
        <span class="cf-ev-def" hidden>${bi(v.definition, v.definitionEs || v.definition)}</span>
      </button>`,
    )
    .join("");
  return `<section class="cf" id="hw_case" aria-labelledby="hw_case_title" data-no-print>
    <div class="cf-head"><span class="cf-kicker">${bi(`Case file · Lesson ${lessonId.replace(/-part2$/, "")}`, `Expediente · Lección ${lessonId.replace(/-part2$/, "")}`)}</span></div>
    <div class="cf-grid">
      <div class="cf-left">
        <h2 id="hw_case_title">${bi(title.en, title.es)}</h2>
        ${scene ? `<p class="cf-scene"><b>${bi("The example:", "El ejemplo:")}</b> ${bi(scene.en, scene.es)}</p>` : ""}
        <p class="cf-case"><b>${bi("Your case:", "Su caso:")}</b> ${bi(tonight.en, tonight.es)}</p>
        ${extras?.tag ? tagSvg(extras.tag) : ""}
      </div>
      <div class="cf-right">
        ${extras?.hunch ? hunchHtml(extras.hunch) : ""}
        ${evidenceHtml ? `<div class="cf-ev" aria-label="Evidence board"><p class="cf-ev-hint">${bi("Tap a clue to read what it means.", "Toquen una pista para leer qué significa.")}</p>${evidenceHtml}</div>` : ""}
      </div>
    </div>
    ${extras?.buildUp ? labHtml(extras.buildUp) : ""}
  </section>`;
}

/* ── Styles ────────────────────────────────────────────────────────────── */

export const CASE_FILE_CSS = `
/* ── Case file card and side rail ───────────────────────────────────────── */
.cf { --cf-navy:#12355b; --cf-amber:#f2c15b; --cf-paper:#fffaf0; --cf-teal:#0c6f6b;
  margin: 0 0 20px; border-radius: 20px; background: var(--cf-navy); color: #fff; padding: 18px 16px 20px; box-shadow: 0 6px 20px rgb(18 53 91 / 25%); }
.cf * { box-sizing: border-box; }
.cf-kicker { font-size: 13px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--cf-amber); }
.cf h2 { margin: 6px 0 8px; font-size: 1.6rem; line-height: 1.15; color: #fff; border: 0; background: transparent; padding: 0; box-shadow: none; }
.cf p { margin: 0 0 12px; color: #e8eef6; font-size: 1.05rem; line-height: 1.5; }
.cf p b { color: var(--cf-amber); }
.cf .obj-term { background: rgb(255 255 255 / 16%) !important; color: #fff !important; border-bottom-color: var(--cf-amber) !important; }
.cf .cf-q .obj-term { background: rgb(15 118 110 / 8%) !important; color: #0b5f58 !important; border-bottom-color: #0f766e !important; }
.cf-grid { display: grid; gap: 16px; }
.cf-tag { display: block; width: 100%; max-width: 340px; margin: 6px 0 4px; }
.cf-row { display: flex; gap: 10px; flex-wrap: wrap; }
.cf-btn { min-height: 48px; padding: 0 18px; border-radius: 12px; border: 2px solid var(--cf-teal); background: var(--cf-teal); color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
.cf-btn.alt { background: #fff; color: var(--cf-navy); border-color: #c9d3df; }
.cf-btn.picked { border-color: var(--cf-amber); box-shadow: 0 0 0 2px var(--cf-amber); }
.cf-btn[disabled] { opacity: .5; cursor: default; }
.cf-btn:focus-visible, .cf-ev-card:focus-visible { outline: 3px solid var(--cf-amber); outline-offset: 2px; }
.cf-q { background: var(--cf-paper); color: #1d2733; border-radius: 16px; padding: 14px; }
.cf-q p { color: #1d2733; margin-bottom: 10px; font-weight: 700; }
.cf-fb { margin-top: 10px; padding: 10px 12px; border-radius: 12px; background: #e3f3e8; color: #14361f; font-weight: 600; }
.cf-fb.no { background: #fff3e0; color: #4a2f00; }
.cf-fb[hidden] { display: none; }
.cf-ev { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-top: 12px; }
.cf-ev-hint { grid-column: 1 / -1; margin: 0 0 2px !important; font-size: .9rem !important; color: #c7d3e2 !important; }
.cf-ev-card { text-align: left; border-radius: 12px; padding: 10px 12px; background: rgb(255 255 255 / 10%); border: 2px dashed rgb(255 255 255 / 35%); color: #fff; font: inherit; cursor: pointer; min-height: 64px; }
.cf-ev-card[aria-expanded="true"] { background: var(--cf-paper); color: #1d2733; border: 2px solid var(--cf-amber); }
.cf-ev-card b { display: block; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: var(--cf-amber); }
.cf-ev-card[aria-expanded="true"] b { color: #8a5a00; }
.cf-ev-term { display: block; font-size: 1.05rem; font-weight: 800; margin-top: 2px; }
.cf-ev-def { display: block; font-size: .95rem; margin-top: 6px; font-weight: 500; }
.cf-ev-def[hidden] { display: none; }
.cf-lab { margin-top: 14px; background: var(--cf-paper); color: #1d2733; border-radius: 16px; padding: 14px; }
.cf-lab h3 { margin: 0 0 4px; font-size: 1.1rem; color: #12355b; }
.cf-lab p { color: #1d2733 !important; font-weight: 500; font-size: 1rem; }
.cf-line { display: block; width: 100%; height: auto; margin-bottom: 12px; cursor: zoom-in; }
.cf-b { fill: #fff; stroke: #c9d3df; stroke-width: 2; }
.cf-b.q, .cf-b.on { fill: #e8f1ed; stroke: #0c6f6b; }
.cf-b.new { fill: #fff3e0; stroke: #b5532a; }
.cf-t { font: 800 17px system-ui, sans-serif; fill: #1d2733; text-anchor: middle; }
.cf-t.s { font-size: 14px; font-weight: 600; fill: #566274; }
@media (min-width: 1000px) {
  .cf { padding: 22px 24px 24px; }
  .cf-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 28px; align-items: start; }
  .cf-lab { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); column-gap: 24px; align-items: center; }
  .cf-lab h3, .cf-lab .cf-msg { grid-column: 2; }
  .cf-lab .cf-line { grid-column: 1; grid-row: 1 / span 3; margin: 0; }
  .cf-lab .cf-row { grid-column: 2; }
}
@media (prefers-reduced-motion: no-preference) { .cf-b { transition: fill .25s, stroke .25s; } }
@media print { .cf { display: none !important; } }
`;

/* ── Behaviour ─────────────────────────────────────────────────────────── */

export const CASE_FILE_JS = `
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function bi(en, es) { return '<span class="lang-en">' + en + '</span><span class="lang-es" lang="es">' + es + '</span>'; }

  /* Evidence cards: tap to read the plain definition. */
  document.addEventListener('click', function (e) {
    var card = e.target.closest('[data-cf-ev]');
    if (!card) return;
    var open = card.getAttribute('aria-expanded') !== 'true';
    card.setAttribute('aria-expanded', open ? 'true' : 'false');
    card.querySelector('.cf-ev-def').hidden = !open;
  });

  /* Hunch: say what a good guess is, never penalise the other pick. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cf-pick]');
    if (!b) return;
    var box = b.closest('[data-cf-hunch]');
    box.querySelectorAll('[data-cf-pick]').forEach(function (x) { x.classList.toggle('picked', x === b); });
    box.querySelectorAll('[data-cf-say]').forEach(function (x) { x.hidden = x.getAttribute('data-cf-say') !== b.getAttribute('data-cf-pick'); });
  });

  /* Build-up lab: split the known part into equal 10% blocks, then add blocks to reach 100%. */
  document.querySelectorAll('[data-cf-lab]').forEach(function (lab) {
    var d = JSON.parse(lab.getAttribute('data-cf-lab'));
    var svg = lab.querySelector('[data-cf-svg]'), msg = lab.querySelector('[data-cf-msg]');
    var split = lab.querySelector('[data-cf-split]'), grow = lab.querySelector('[data-cf-grow]');
    var sym = d.sym || '', known = d.blocks, state = { split: false, grown: 0 };
    function money(n) { return sym + n; }
    function draw() {
      var bw = 68, x0 = 10, rowH = 112, shown = state.split ? known + state.grown : known, g = '';
      for (var i = 0; i < 10; i++) {
        var row = i < 5 ? 0 : 1, x = x0 + (i % 5) * bw, y = 22 + row * rowH, isKnown = i < known;
        var cls = !state.split && isKnown ? 'q' : isKnown ? 'on' : i < shown ? 'new' : '';
        g += '<rect class="cf-b ' + cls + '" x="' + x + '" y="' + y + '" width="' + (bw - 6) + '" height="44" rx="6"/>';
        if (i < shown) {
          var cx = x + (bw - 6) / 2;
          g += '<text class="cf-t s" x="' + cx + '" y="' + (y - 6) + '">' + (i + 1) * 10 + '%</text>';
          g += '<text class="cf-t" x="' + cx + '" y="' + (y + 28) + '">' + (state.split ? money(d.per) : isKnown ? '?' : '') + '</text>';
          if (state.split) g += '<text class="cf-t s" x="' + cx + '" y="' + (y + 64) + '">' + money((i + 1) * d.per) + '</text>';
        }
      }
      if (!state.split) g += '<text class="cf-t" x="' + (x0 + 214) + '" y="' + (22 + rowH + 28) + '">' + d.pct + '% = ' + money(d.part) + '</text>';
      svg.innerHTML = g;
    }
    split.addEventListener('click', function () {
      state.split = true; split.disabled = true; grow.disabled = false;
      msg.innerHTML = bi('Each block is 10%. ' + money(d.part) + ' ÷ ' + known + ' = ' + money(d.per) + ', so 10% is ' + money(d.per) + '. Now add blocks.',
        'Cada bloque es el 10%. ' + money(d.part) + ' ÷ ' + known + ' = ' + money(d.per) + ', así que el 10% es ' + money(d.per) + '. Ahora agreguen bloques.');
      draw();
    });
    grow.addEventListener('click', function () {
      state.grown = Math.min(d.steps, state.grown + 1);
      var p = (known + state.grown) * 10, v = (known + state.grown) * d.per;
      msg.innerHTML = bi(p + '% is ' + money(v) + '.', 'El ' + p + '% es ' + money(v) + '.');
      if (state.grown === d.steps) {
        grow.disabled = true;
        msg.innerHTML = bi('100% is 10 blocks of ' + money(d.per) + '. The whole is ' + money(d.whole) + '. It is bigger than ' + money(d.part) + ', as a sale should make it.',
          'El 100% son 10 bloques de ' + money(d.per) + '. El entero es ' + money(d.whole) + '. Es mayor que ' + money(d.part) + ', como debe ser en una oferta.');
      }
      draw();
    });
    draw();
  });
})();
`;
