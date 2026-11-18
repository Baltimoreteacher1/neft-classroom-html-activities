// One interactive word-problem card, shared by the Word problems page (word-problems.mjs) and the
// "Real-world check" cards inside the practice studio steps (word-problems-inline.mjs).
// Kinds: num (type a number), mc (choose), build (tap tiles to assemble an expression, equation or
// answer), table (fill the missing cells). Every kind has a 3-hint ladder, feedback on a miss and the
// worked explanation once it is right.
import { parseAnswer, sameValue } from "./word-problems-answer.mjs";

export const esc = (/** @type {any} */ s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
export const bi = (/** @type {string} */ en, /** @type {string | undefined} */ es) =>
  `<span class="t-en">${esc(en)}</span>${es ? `<span class="t-es" lang="es">${esc(es)}</span>` : ""}`;

/** "4n + 6" and "4n+6" compare equal; so do "×" and "x" spacing differences. */
const norm = (/** @type {string} */ s) =>
  String(s).replace(/\s+/g, "").replace(/−/g, "-").toLowerCase();
export const buildKey = (/** @type {string[]} */ seq) => norm(seq.join(""));

/** A built answer as plain arithmetic over single-letter variables: { expr } for an expression, or { op, d } for an
 * equation or inequality, where d = left − right and op is "=", "<" or "<=" (">" and ">=" flip d). Null when it is
 * not plain arithmetic (ratios, words, mixed numbers). Implicit products (8d, 6(3 + 4)) become explicit. */
function parseBuild(/** @type {string} */ text) {
  // a mixed number ("1 1/2") would read as a product once spaces go, so leave those to the exact match
  if (/\d\s+\d+\/\d/.test(String(text))) return null;
  let t = String(text)
    // a fraction tile ("1/2") is one number; "÷" is the division sign, so "3 ÷ 1/2" stays 3 ÷ (1/2)
    .replace(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g, "($1/$2)")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/\s+/g, "");
  if (!t || !/^[0-9a-z+\-*/().<>=^]+$/.test(t) || /[a-z]{2}/.test(t)) return null;
  t = t.replace(/([0-9a-z)])(?=[a-z(])/g, "$1*").replace(/\^/g, "**");
  const parts = t.split(/(<=|>=|<|>|=)/);
  if (parts.length === 1) return { expr: t };
  if (parts.length !== 3 || !parts[0] || !parts[2]) return null;
  const [l, op, r] = parts;
  if (op === ">" || op === ">=") return { op: op === ">" ? "<" : "<=", d: `(${r})-(${l})` };
  return { op, d: `(${l})-(${r})` };
}

const numbersOf = (/** @type {string} */ s) => (String(s).match(/\d+(\.\d+)?/g) || []).sort().join(",");
const near = (/** @type {number} */ x, /** @type {number} */ y) => Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y));

/** True when two built answers mean the same thing. Expressions: equal at many values of their variables (and, for
 * plain arithmetic, the same value from the same numbers). Equations and inequalities: the same relation, with one
 * side-difference a constant multiple of the other (positive for an inequality). */
export function sameBuild(/** @type {string} */ a, /** @type {string} */ b) {
  if (norm(a) === norm(b)) return true;
  const pa = parseBuild(a);
  const pb = parseBuild(b);
  if (!pa || !pb || !!pa.op !== !!pb.op || pa.op !== pb.op) return false;
  const ea = pa.op ? pa.d : pa.expr;
  const eb = pb.op ? pb.d : pb.expr;
  const vars = [...new Set(`${ea}${eb}`.match(/[a-z]/g) || [])];
  if (!vars.length && numbersOf(a) !== numbersOf(b)) return false;
  let fa;
  let fb;
  try {
    fa = Function(...vars, `"use strict";return (${ea});`);
    fb = Function(...vars, `"use strict";return (${eb});`);
  } catch {
    return false;
  }
  const points = vars.length ? 16 : 1;
  /** @type {number | null} */
  let k = null;
  for (let n = 0; n < points; n++) {
    // independent, irregular values per variable so a two-variable relation is really tested
    const args = vars.map((_, v) => ((n * 7 + v * 13) % 17) - 6 + (v + 1) * 0.37);
    const va = fa(...args);
    const vb = fb(...args);
    if (typeof va !== "number" || typeof vb !== "number" || !Number.isFinite(va) || !Number.isFinite(vb)) return false;
    if (!pa.op) {
      if (!near(va, vb)) return false;
      continue;
    }
    if (!vars.length) {
      // a statement about numbers only: both must be the same true (or false) statement
      const truth = (/** @type {number} */ d) => (pa.op === "=" ? near(d, 0) : pa.op === "<" ? d < 0 : d <= 0);
      return truth(va) === truth(vb);
    }
    if (near(va, 0) || near(vb, 0)) {
      if (!(near(va, 0) && near(vb, 0))) return false;
      continue;
    }
    const ratio = vb / va;
    if (k === null) k = ratio;
    else if (!near(k, ratio)) return false;
  }
  return !pa.op || (k !== null && (pa.op === "=" ? k !== 0 : k > 0));
}

function answerArea(/** @type {any} */ p, /** @type {string} */ id) {
  if (p.kind === "mc")
    return `<fieldset class="wp-choices"><legend class="sr-only">Choices</legend>${p.c
      .map(
        (/** @type {string} */ c, /** @type {number} */ k) =>
          `<label class="wp-choice"><input type="radio" name="${id}-choice" value="${k}"><span>${bi(c, p.cEs?.[k])}</span></label>`,
      )
      .join("")}</fieldset>`;
  if (p.kind === "build")
    return `<div class="wp-build">
      <p class="wp-build-label">${bi("Your answer (tap tiles to build it):", "Tu respuesta (toca las fichas para armarla):")}</p>
      <div class="wp-build-answer" data-wp-answer role="group" aria-label="Your answer" aria-live="polite"><span class="wp-build-empty">${bi("Tap a tile below", "Toca una ficha abajo")}</span></div>
      <div class="wp-build-tiles" role="group" aria-label="Tiles">${p.tiles
        .map(
          (/** @type {string} */ t, /** @type {number} */ k) =>
            `<button type="button" class="wp-tile" data-wp-tile="${k}">${esc(t)}</button>`,
        )
        .join("")}</div>
      <button type="button" class="wp-btn wp-btn--small" data-wp-clear>${bi("Clear", "Borrar")}</button>
    </div>`;
  if (p.kind === "table")
    return `<div class="wp-table-wrap"><table class="wp-table"><thead><tr>${p.hd
      .map((/** @type {string} */ h, /** @type {number} */ c) => `<th scope="col">${bi(h, p.hdEs?.[c])}</th>`)
      .join("")}</tr></thead><tbody>${p.rows
      .map(
        (/** @type {any[]} */ row, /** @type {number} */ r) =>
          `<tr>${row
            .map((/** @type {any} */ cell, /** @type {number} */ c) =>
              cell && typeof cell === "object"
                ? `<td><input type="text" inputmode="decimal" autocomplete="off" data-wp-cell="${r}-${c}" aria-label="${esc(`${p.hd[c]}, row ${r + 1}`)}"></td>`
                : `<td>${esc(cell)}</td>`,
            )
            .join("")}</tr>`,
      )
      .join("")}</tbody></table></div>`;
  return `<div class="wp-answer"><label for="${id}-input">${bi("Your answer", "Tu respuesta")}</label>
    <div class="wp-answer-row"><input id="${id}-input" class="wp-input" type="text" inputmode="decimal" autocomplete="off" spellcheck="false">${p.unit ? `<span class="wp-unit">${bi(p.unit, p.unitEs)}</span>` : ""}</div></div>`;
}

/**
 * Draw problem `p` into `host`.
 * @param {HTMLElement} host
 * @param {any} p
 * @param {{ id: string, label?: string, labelEs?: string, setup?: string, setupEs?: string, solved?: boolean,
 *   onSolved?: () => void, next?: { en: string, es: string, go: () => void } | null }} o
 */
export function mountProblem(host, p, o) {
  const id = o.id;
  host.innerHTML = `<article class="wp-card" aria-labelledby="${id}-title">
    ${o.label ? `<p class="wp-count">${bi(o.label, o.labelEs)}</p>` : ""}
    <h2 id="${id}-title" class="wp-title" tabindex="-1">${bi(p.title, p.titleEs)}</h2>
    ${o.setup ? `<div class="wp-setup">${bi(o.setup, o.setupEs)}</div>` : ""}
    <p class="wp-q">${bi(p.q, p.qEs)}</p>
    <form class="wp-form" novalidate>
      ${answerArea(p, id)}
      <div class="wp-actions">
        <button type="submit" class="wp-btn wp-btn--primary">${bi("Check", "Revisar")}</button>
        <button type="button" class="wp-btn" data-wp-hint>${bi("Hint 1 of 3", "Pista 1 de 3")}</button>
      </div>
    </form>
    <ol class="wp-hints" aria-live="polite"></ol>
    <div class="wp-feedback" role="status" aria-live="polite"></div>
  </article>`;
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (host.querySelector(s));
  const form = /** @type {HTMLFormElement} */ (q(".wp-form"));
  let hints = 0;
  /** @type {number[]} */
  let built = [];

  const feedback = (/** @type {string} */ cls, /** @type {string} */ html) => {
    const box = q(".wp-feedback");
    box.className = `wp-feedback ${cls}`;
    box.innerHTML = html;
  };
  const hint = () => {
    if (hints >= 3) return;
    const k = hints++;
    q(".wp-hints").insertAdjacentHTML(
      "beforeend",
      `<li><strong>${bi(`Hint ${k + 1}`, `Pista ${k + 1}`)}:</strong> ${bi(p.h[k], p.hEs?.[k])}</li>`,
    );
    const btn = q("[data-wp-hint]");
    if (hints >= 3) btn.hidden = true;
    else btn.innerHTML = bi(`Hint ${hints + 1} of 3`, `Pista ${hints + 1} de 3`);
  };
  const miss = (/** @type {string | undefined} */ f, /** @type {string | undefined} */ fEs) => {
    const more = hints < 3;
    feedback(
      "is-miss",
      `<p><strong>${bi("Not yet.", "Todavía no.")}</strong> ${f ? bi(f, fEs) : bi("Check each step of your work.", "Revisa cada paso de tu trabajo.")}</p><p>${
        more
          ? bi("Take the next hint, then try again.", "Toma la siguiente pista y vuelve a intentarlo.")
          : bi("Use all three hints to set it up, then try again.", "Usa las tres pistas para plantearlo y vuelve a intentarlo.")
      }</p>`,
    );
    if (more && hints === 0) hint();
  };

  const drawBuilt = () => {
    const box = q("[data-wp-answer]");
    box.innerHTML = built.length
      ? built
          .map(
            (k, n) =>
              `<button type="button" class="wp-tile is-placed" data-wp-placed="${n}" aria-label="Remove ${esc(p.tiles[k])}">${esc(p.tiles[k])}</button>`,
          )
          .join("")
      : `<span class="wp-build-empty">${bi("Tap a tile below", "Toca una ficha abajo")}</span>`;
    for (const b of host.querySelectorAll("[data-wp-tile]"))
      /** @type {HTMLButtonElement} */ (b).disabled = built.includes(
        Number(/** @type {HTMLElement} */ (b).dataset.wpTile),
      );
  };
  if (p.kind === "build") {
    host.addEventListener("click", (e) => {
      const t = /** @type {HTMLElement} */ (e.target).closest("[data-wp-tile],[data-wp-placed],[data-wp-clear]");
      if (!t || form.dataset.done) return;
      const el = /** @type {HTMLElement} */ (t);
      if (el.dataset.wpTile !== undefined) built.push(Number(el.dataset.wpTile));
      else if (el.dataset.wpPlaced !== undefined) built.splice(Number(el.dataset.wpPlaced), 1);
      else built = [];
      drawBuilt();
    });
  }

  const solved = (/** @type {boolean} */ restored) => {
    form.dataset.done = "1";
    // record first, so a "next" label that depends on what is left reads the new state
    if (!restored) o.onSolved?.();
    for (const el of host.querySelectorAll("input, .wp-form button, .wp-tile"))
      /** @type {HTMLInputElement} */ (el).disabled = true;
    if (restored) {
      if (p.kind === "num") /** @type {HTMLInputElement} */ (q(".wp-input")).value = p.a;
      if (p.kind === "mc")
        /** @type {HTMLInputElement} */ (host.querySelectorAll(`input[name="${id}-choice"]`)[p.ai]).checked = true;
      if (p.kind === "build") {
        q("[data-wp-answer]").innerHTML = p.a[0]
          .map((/** @type {string} */ t) => `<span class="wp-tile is-placed">${esc(t)}</span>`)
          .join("");
      }
      if (p.kind === "table")
        for (const inp of host.querySelectorAll("[data-wp-cell]")) {
          const [r, c] = /** @type {HTMLElement} */ (inp).dataset.wpCell.split("-").map(Number);
          /** @type {HTMLInputElement} */ (inp).value = p.rows[r][c].a;
        }
    }
    feedback(
      "is-right",
      `<p class="wp-gotit"><span aria-hidden="true">✓</span> ${bi("I got it!", "¡Lo logré!")}</p><p>${bi(p.x, p.xEs)}</p>${
        o.next ? `<button type="button" class="wp-btn wp-btn--primary" data-wp-next>${bi(o.next.en, o.next.es)}</button>` : ""
      }`,
    );
    if (o.next) {
      const nb = q("[data-wp-next]");
      nb.addEventListener("click", o.next.go);
      if (!restored) nb.focus();
    }
  };

  const check = () => {
    if (p.kind === "mc") {
      const picked = /** @type {HTMLInputElement | null} */ (
        host.querySelector(`input[name="${id}-choice"]:checked`)
      );
      if (!picked) return feedback("is-nudge", bi("Choose an answer first.", "Primero elige una respuesta."));
      const k = Number(picked.value);
      return k === p.ai ? solved(false) : miss(p.f?.[k], p.fEs?.[k]);
    }
    if (p.kind === "build") {
      if (!built.length)
        return feedback("is-nudge", bi("Build your answer with the tiles first.", "Primero arma tu respuesta con las fichas."));
      const text = built.map((k) => p.tiles[k]).join(" ");
      // `exact`: the task asks for one form (simplest, no parentheses), so an equivalent rebuild is not enough
      const same = (/** @type {string} */ x) => (p.exact ? buildKey([x]) === buildKey([text]) : sameBuild(x, text));
      if (p.a.some((/** @type {string[]} */ seq) => same(seq.join(" ")))) return solved(false);
      const known = (p.fw || []).find((/** @type {any} */ w) => sameBuild(w.v, text));
      return miss(known?.f, known?.fEs);
    }
    if (p.kind === "table") {
      const inputs = [...host.querySelectorAll("[data-wp-cell]")].map((x) => /** @type {HTMLInputElement} */ (x));
      if (inputs.some((x) => !x.value.trim()))
        return feedback("is-nudge", bi("Fill in every empty cell first.", "Primero completa todas las celdas vacías."));
      let wrong = 0;
      for (const inp of inputs) {
        const [r, c] = /** @type {string} */ (inp.dataset.wpCell).split("-").map(Number);
        const ok = sameValue(parseAnswer(inp.value), parseAnswer(p.rows[r][c].a));
        inp.setAttribute("aria-invalid", String(!ok));
        if (!ok) wrong++;
      }
      if (!wrong) return solved(false);
      return miss(
        `${inputs.length - wrong} of ${inputs.length} cells are right. Check the highlighted ones.`,
        `${inputs.length - wrong} de ${inputs.length} celdas están bien. Revisa las marcadas.`,
      );
    }
    const raw = /** @type {HTMLInputElement} */ (q(".wp-input")).value;
    const v = parseAnswer(raw);
    if (!raw.trim()) return feedback("is-nudge", bi("Type your answer first.", "Primero escribe tu respuesta."));
    if (!Number.isFinite(v))
      return feedback("is-nudge", bi("Type a number, like 18, 2.5 or 3/4.", "Escribe un número, como 18, 2.5 o 3/4."));
    if (sameValue(v, parseAnswer(p.a))) return solved(false);
    const known = (p.fw || []).find((/** @type {any} */ w) => sameValue(v, parseAnswer(w.v)));
    return miss(known?.f, known?.fEs);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    check();
  });
  q("[data-wp-hint]").addEventListener("click", hint);
  if (o.solved) solved(true);
  return { focus: () => q(`#${id}-title`).focus() };
}
