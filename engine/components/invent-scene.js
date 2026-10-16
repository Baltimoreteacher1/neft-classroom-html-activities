// invent-scene.js — the "try your own way first" scene for invent-first.js.
//
// A student reads one estimating problem and shows their thinking on a double
// number line: marks (a percent, and optionally the amount they say goes with
// it), an optional easier number for the whole, and an estimate. Every number is
// theirs: the scene never fills one in, never says which is right, and never
// prints the exact answer. When they ask, it shows which of the lesson's methods
// their moves resemble (invent-first.js decides, and may say "unsure") beside
// the lesson's own words for that method, with a question to talk over.
//
// Optional by construction. There is no timer, no score and no gate; "Skip"
// shows the lesson's ways without an attempt; the only thing kept is the
// numbers they typed, in this browser, behind try/catch.
//
//   renderInventFirst(host, { lesson, config? }) -> Promise<{ destroy }>

import { stackContent } from "../core/i18n.js";
import { classifyStrategy, normalizeMoves, validateConfig } from "../core/invent-first.js";

const STYLE_ID = "invent-scene-styles";
const CSS = `
.ifx{color-scheme:light;display:grid;grid-template-columns:minmax(0,1fr);gap:14px;font-family:var(--font-body,"Hanken Grotesk",system-ui,sans-serif);color:var(--ink,#12355b)}
.ifx *{box-sizing:border-box}
.ifx-kicker{margin:0;font:700 .75rem/1 var(--font-ui,system-ui,sans-serif);letter-spacing:.1em;text-transform:uppercase;color:var(--muted,#54677c)}
.ifx h3{margin:0;font:800 1.2rem/1.2 var(--font-display,"Outfit",system-ui,sans-serif)}
.ifx p{margin:0;line-height:1.5}
.ifx-note{color:var(--muted,#54677c);font-size:.92rem;max-width:62ch}
.ifx-problem{padding:12px 14px;border-left:4px solid var(--teal,#2a9d8f);background:#f4faf8;border-radius:0 12px 12px 0;font-size:1.02rem}
.ifx-line{width:100%;max-width:640px;height:auto;display:block;background:#fbfdff;border:1px solid var(--line,#d7e2ed);border-radius:12px}
.ifx-row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}
.ifx-field{display:grid;gap:4px;font-size:.82rem;font-weight:700}
.ifx-field input{width:8.5rem;min-height:44px;padding:8px 10px;font:inherit;font-size:1.05rem;font-weight:600;color:inherit;border:2px solid var(--line,#cbd5e1);border-radius:10px;background:#fff}
.ifx input:focus-visible,.ifx button:focus-visible{outline:3px solid var(--accent,#1d4ed8);outline-offset:2px}
.ifx button{min-height:44px;padding:8px 16px;font:inherit;font-weight:700;border-radius:999px;border:2px solid var(--accent,#1d4ed8);background:#fff;color:var(--accent,#1d4ed8);cursor:pointer}
.ifx button.ifx-main{background:var(--accent,#1d4ed8);color:#fff}
.ifx button.ifx-quiet{border-color:var(--line,#cbd5e1);color:var(--muted,#54677c)}
.ifx-marks{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.ifx-marks li{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:4px 4px 4px 12px;border:1px solid var(--line,#d7e2ed);border-radius:10px;font-weight:600}
.ifx-marks button{margin-left:auto;min-width:44px}
.ifx-msg{min-height:1.4em;font-size:.92rem;color:var(--coral,#a33a1d)}
.ifx-compare{display:grid;gap:12px;padding:14px;border:1px solid var(--line,#d7e2ed);border-radius:14px;background:#fffdf5}
.ifx-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px}
.ifx-card{padding:12px 14px;border:1px solid var(--line,#d7e2ed);border-radius:12px;background:#fff}
.ifx-card h4{margin:0 0 6px;font:700 .8rem/1.2 var(--font-ui,system-ui,sans-serif);letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#54677c)}
.ifx-card strong{display:block;font-size:1.02rem;margin-bottom:6px}
.ifx-card blockquote{margin:6px 0 0;padding-left:10px;border-left:3px solid var(--line,#cbd5e1);font-size:.93rem}
.ifx-ask{font-weight:700}
`;

const bi = (en, es) => stackContent(en, es);
const esc = (v) =>
  String(v).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const fmt = (n) => String(Math.round(n * 100) / 100);
const keyFor = (lesson) => `nt-invent-first:v1:${lesson}`;

let sceneSeq = 0;

/** The student's moves as they were last kept in this browser, cleaned. */
function loadSaved(lesson) {
  try {
    const raw = JSON.parse(localStorage.getItem(keyFor(lesson)) || "null");
    return raw ? { ...normalizeMoves(raw), compared: raw.compared === true } : null;
  } catch {
    return null;
  }
}

function save(lesson, moves, compared) {
  try {
    localStorage.setItem(keyFor(lesson), JSON.stringify({ ...moves, compared }));
  } catch {
    /* storage blocked: the scene works for this visit, it just is not kept */
  }
}

function forget(lesson) {
  try {
    localStorage.removeItem(keyFor(lesson));
  } catch {
    /* nothing was kept */
  }
}

async function loadConfig(lesson) {
  const response = await fetch(`/data/invent-first/${encodeURIComponent(lesson)}.json`, {
    credentials: "omit",
  });
  if (!response.ok) throw new Error(`invent-first: ${response.status}`);
  return response.json();
}

/** The double number line: percent above, amount below, a tie from each mark to its amount. */
function lineSVG(config, marks) {
  const { percent: target, whole, unit } = config.problem;
  const W = 560;
  const left = 36;
  const right = W - 24;
  const xAt = (fraction) => left + (right - left) * Math.min(1, Math.max(0, fraction));
  const yP = 40;
  const yA = 110;
  const money = (n) => `${unit}${fmt(n)}`;
  let body =
    `<line x1="${left}" y1="${yP}" x2="${right}" y2="${yP}" stroke="#1d4ed8" stroke-width="2.5"/>` +
    `<line x1="${left}" y1="${yA}" x2="${right}" y2="${yA}" stroke="#0d7a76" stroke-width="2.5"/>`;
  for (const p of [0, 25, 50, 75, 100]) {
    body += `<text x="${xAt(p / 100)}" y="${yP - 12}" text-anchor="middle" font-size="11" fill="#54677c">${p}%</text>`;
  }
  body +=
    `<text x="${xAt(0)}" y="${yA + 24}" text-anchor="middle" font-size="11" fill="#54677c">${money(0)}</text>` +
    `<text x="${xAt(1)}" y="${yA + 24}" text-anchor="middle" font-size="11" fill="#54677c">${money(whole)}</text>`;
  // The percent the problem asks about: a hollow flag, so the target is never a mark.
  body += `<path d="M${xAt(target / 100)} ${yP - 2} l-6 -12 h12 z" fill="#fff" stroke="#785000" stroke-width="2"/>`;
  const spoken = [`the problem asks about ${target}%`];
  for (const m of marks) {
    const px = xAt(m.p / 100);
    body += `<line x1="${px}" y1="${yP - 8}" x2="${px}" y2="${yP + 8}" stroke="#12355b" stroke-width="3"/>`;
    body += `<text x="${px}" y="${yP + 24}" text-anchor="middle" font-size="12" font-weight="700" fill="#12355b">${fmt(m.p)}%</text>`;
    if (m.x === null) {
      spoken.push(`${fmt(m.p)}%`);
      continue;
    }
    const ax = xAt(m.x / whole);
    body += `<line x1="${px}" y1="${yP + 8}" x2="${ax}" y2="${yA - 8}" stroke="#9fb3c8" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    body += `<line x1="${ax}" y1="${yA - 8}" x2="${ax}" y2="${yA + 8}" stroke="#12355b" stroke-width="3"/>`;
    body += `<text x="${ax}" y="${yA - 14}" text-anchor="middle" font-size="12" font-weight="700" fill="#12355b">${money(m.x)}</text>`;
    spoken.push(`${fmt(m.p)}% with ${money(m.x)}`);
  }
  return (
    `<svg class="ifx-line" viewBox="0 0 ${W} 138" role="img" ` +
    `aria-label="Double number line, percent above and ${esc(unit)} below. ${esc(spoken.join("; "))}.">` +
    `${body}</svg>`
  );
}

/** "10% → $24, 25% → $60" for the marks that made a signal true. */
function describeMarks(config, marks) {
  const { unit } = config.problem;
  return [...new Set(marks)]
    .sort((a, b) => a.p - b.p)
    .map((m) => (m.x === null ? `${fmt(m.p)}%` : `${fmt(m.p)}% → ${unit}${fmt(m.x)}`))
    .join(", ");
}

/** Fill {marks} and {whole} in a strategy's "what we noticed" line, in one language. */
function noticedLine(config, strategy, result, lang) {
  const marks = strategy.needs.flatMap((need) => result.evidence[need]?.marks || []);
  const whole = result.evidence.compatibleWhole?.whole;
  return strategy.noticed[lang]
    .replace("{marks}", describeMarks(config, marks))
    .replace("{whole}", whole === undefined ? "" : `${config.problem.unit}${fmt(whole)}`);
}

function methodCard(config, methodId) {
  const method = config.methods.find((m) => m.id === methodId);
  return (
    `<div class="ifx-card"><h4>${bi("The lesson's way", "La manera de la lección")}</h4>` +
    `<strong>${bi(method.name.en, method.name.es)}</strong>` +
    `<blockquote>${bi(method.quote.en, method.quote.es)}</blockquote></div>`
  );
}

/** The comparison: the student's way beside the lesson's, then one question. */
export function compareHTML(config, rawMoves, { skipped = false } = {}) {
  const result = skipped
    ? { id: "unsure", also: [], candidates: [], evidence: {} }
    : classifyStrategy(config, rawMoves);
  const both = (fn) => bi(fn("en"), fn("es"));
  if (result.id === "unsure") {
    const picks = result.candidates.length
      ? config.strategies.filter((s) => result.candidates.includes(s.id)).map((s) => s.method)
      : config.methods.map((m) => m.id);
    const message = result.candidates.length ? config.unsure.mixed : config.unsure.none;
    return (
      `<p>${bi(message.en, message.es)}</p>` +
      `<div class="ifx-cards">${[...new Set(picks)].map((id) => methodCard(config, id)).join("")}</div>` +
      `<p class="ifx-ask">${bi(config.unsure.contrast.en, config.unsure.contrast.es)}</p>`
    );
  }
  const strategy = config.strategies.find((s) => s.id === result.id);
  const also = result.also.map((id) => config.strategies.find((s) => s.id === id));
  const think = strategy.thinking ? config.thinking[strategy.thinking] : null;
  const yours =
    `<div class="ifx-card"><h4>${bi("Your way", "Tu manera")}</h4>` +
    `<strong>${bi(strategy.name.en, strategy.name.es)}</strong>` +
    `<p>${both((lang) => noticedLine(config, strategy, result, lang))}</p>` +
    (think ? `<p class="ifx-note">${bi(think.en, think.es)}</p>` : "") +
    (also.length
      ? `<p class="ifx-note">${bi(
          `It also looks like: ${also.map((s) => s.name.en).join(", ")}.`,
          `También se parece a: ${also.map((s) => s.name.es).join(", ")}.`,
        )}</p>`
      : "") +
    `</div>`;
  return (
    `<div class="ifx-cards">${yours}${methodCard(config, strategy.method)}</div>` +
    `<p class="ifx-ask">${bi(strategy.contrast.en, strategy.contrast.es)}</p>`
  );
}

/**
 * @param {HTMLElement} host
 * @param {{lesson: string, config?: object}} cfg `config` is for tests and previews;
 *   a page passes only the lesson and the scene fetches its file.
 */
export async function renderInventFirst(host, cfg) {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  const root = document.createElement("section");
  root.className = "ifx";
  host.appendChild(root);
  const handle = { destroy: () => root.remove() };

  let config;
  try {
    config = cfg.config || (await loadConfig(cfg.lesson));
    const problems = validateConfig(config);
    if (problems.length) throw new Error(problems[0]);
  } catch (error) {
    console.warn("invent-first: could not start", error);
    root.innerHTML = `<p class="ifx-note" role="status">${bi(
      "This activity could not load right now. The lesson works without it.",
      "Esta actividad no se pudo cargar ahora. La lección funciona sin ella.",
    )}</p>`;
    return handle;
  }

  sceneSeq += 1;
  const uid = `ifx${sceneSeq}`;
  const { problem } = config;
  const saved = loadSaved(config.lesson);
  let moves = saved
    ? { marks: saved.marks, whole: saved.whole, estimate: saved.estimate }
    : { marks: [], whole: null, estimate: null };
  let compared = saved?.compared === true;
  let skipped = false;

  root.innerHTML = `
    <p class="ifx-kicker">${bi("Optional · try first", "Opcional · inténtalo primero")}</p>
    <h3 id="${uid}-t">${bi(config.title.en, config.title.es)}</h3>
    <p class="ifx-note">${bi(config.invitation.en, config.invitation.es)}</p>
    <p class="ifx-problem">${bi(problem.context.en, problem.context.es)}</p>
    <div data-fig></div>
    <form class="ifx-row" data-add novalidate>
      <label class="ifx-field">${bi("Percent", "Porcentaje")}<input name="p" inputmode="decimal" autocomplete="off" aria-describedby="${uid}-m"></label>
      <label class="ifx-field">${bi("Amount (optional)", "Cantidad (opcional)")}<input name="x" inputmode="decimal" autocomplete="off" aria-describedby="${uid}-m"></label>
      <button type="submit" class="ifx-main">${bi("Add mark", "Agregar marca")}</button>
    </form>
    <p class="ifx-msg" id="${uid}-m" role="status" aria-live="polite"></p>
    <ul class="ifx-marks" data-marks aria-label="${esc("Your marks / Tus marcas")}"></ul>
    <div class="ifx-row">
      <label class="ifx-field">${bi(`Easier number for ${problem.unit}${problem.whole} (optional)`, `Número más fácil para ${problem.unit}${problem.whole} (opcional)`)}<input name="whole" inputmode="decimal" autocomplete="off"></label>
      <label class="ifx-field">${bi("My estimate", "Mi estimación")}<input name="estimate" inputmode="decimal" autocomplete="off"></label>
    </div>
    <div class="ifx-row">
      <button type="button" class="ifx-main" data-compare>${bi("Compare with the lesson's ways", "Comparar con las maneras de la lección")}</button>
      <button type="button" data-skip>${bi("Skip: show me the lesson's ways", "Saltar: muéstrame las maneras de la lección")}</button>
      <button type="button" class="ifx-quiet" data-reset>${bi("Start over", "Empezar de nuevo")}</button>
    </div>
    <section class="ifx-compare" data-compare-panel tabindex="-1" hidden aria-labelledby="${uid}-c">
      <h3 id="${uid}-c">${bi("Your way, next to the lesson's way", "Tu manera, junto a la manera de la lección")}</h3>
      <div data-compare-body aria-live="polite"></div>
    </section>`;

  const $ = (selector) => root.querySelector(selector);
  const field = (name) => /** @type {HTMLInputElement} */ ($(`[name="${name}"]`));
  const say = (en, es) => {
    $(`#${uid}-m`).innerHTML = en ? bi(en, es) : "";
  };

  const paint = () => {
    $("[data-fig]").innerHTML = lineSVG(config, moves.marks);
    const list = $("[data-marks]");
    list.textContent = "";
    moves.marks.forEach((m, i) => {
      const li = document.createElement("li");
      const label = m.x === null ? `${fmt(m.p)}%` : `${fmt(m.p)}% → ${problem.unit}${fmt(m.x)}`;
      li.innerHTML = `<span>${esc(label)}</span><button type="button" class="ifx-quiet" data-remove="${i}" aria-label="${esc(`Remove mark ${label} / Quitar la marca ${label}`)}">✕</button>`;
      list.appendChild(li);
    });
    const panel = $("[data-compare-panel]");
    panel.hidden = !compared;
    if (compared) $("[data-compare-body]").innerHTML = compareHTML(config, moves, { skipped });
  };
  const keep = () => save(config.lesson, moves, compared);
  const edited = () => {
    // Changing anything puts the comparison away; the student asks again when ready.
    compared = false;
    skipped = false;
    keep();
    paint();
  };

  field("whole").value = moves.whole === null ? "" : String(moves.whole);
  field("estimate").value = moves.estimate === null ? "" : String(moves.estimate);

  $("[data-add]").addEventListener("submit", (event) => {
    event.preventDefault();
    const next = normalizeMoves({ marks: [{ p: field("p").value, x: field("x").value }] }).marks[0];
    if (!next)
      return say("Type a percent first, like 25.", "Escribe primero un porcentaje, como 25.");
    if (moves.marks.length >= 12)
      return say(
        "That is plenty of marks. Remove one to add another.",
        "Ya son muchas marcas. Quita una para agregar otra.",
      );
    moves = { ...moves, marks: [...moves.marks, next] };
    field("p").value = "";
    field("x").value = "";
    say("", "");
    edited();
    field("p").focus();
  });
  $("[data-marks]").addEventListener("click", (event) => {
    const button = /** @type {HTMLElement} */ (event.target).closest("[data-remove]");
    if (!button) return;
    const at = Number(button.getAttribute("data-remove"));
    moves = { ...moves, marks: moves.marks.filter((_, i) => i !== at) };
    edited();
    field("p").focus();
  });
  for (const name of ["whole", "estimate"]) {
    field(name).addEventListener("change", () => {
      const clean = normalizeMoves({ marks: [], [name]: field(name).value });
      moves = { ...moves, [name]: clean[name] };
      field(name).value = moves[name] === null ? "" : String(moves[name]);
      edited();
    });
  }
  const showCompare = () => {
    compared = true;
    keep();
    paint();
    $("[data-compare-panel]").focus();
  };
  $("[data-compare]").addEventListener("click", () => {
    // A typed-but-unsent entry counts: read the boxes before deciding.
    for (const name of ["whole", "estimate"]) field(name).dispatchEvent(new Event("change"));
    compared = true;
    skipped = false;
    showCompare();
  });
  $("[data-skip]").addEventListener("click", () => {
    skipped = true;
    showCompare();
  });
  $("[data-reset]").addEventListener("click", () => {
    moves = { marks: [], whole: null, estimate: null };
    for (const name of ["p", "x", "whole", "estimate"]) field(name).value = "";
    forget(config.lesson);
    edited();
    forget(config.lesson);
  });

  paint();
  return handle;
}

export default renderInventFirst;
