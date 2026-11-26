/**
 * Rule editor view for the expressions missions. Students compose a scoring or pricing rule from
 * tiles (never free text, never eval), run it on inputs they choose, compare two rules for
 * equivalence (exact ax + b check AND the test bench), and watch distribution regroup algebra tiles.
 * Every number the editor derives that equals a still-hidden Test answer prints as "?".
 * Pure logic lives in rule-engine.mjs; the hidden-answer rule in answer-guard.mjs.
 */
import { hiddenAnswers, isHidden } from "./answer-guard.mjs";
import { createHistory } from "./history.mjs";
import { esc, INK, MUTED, ORANGE, PEACH, TEAL, LIME } from "./models-kit.mjs";
import { eq, frac as fracOf, parse, show } from "./exact.mjs";
import {
  MAX_INPUTS,
  MAX_TILES,
  cleanRules,
  compare,
  evaluate,
  formText,
  inputValue,
  missionTiles,
  numberTile,
  parseRule,
  ruleText,
  tileModel,
} from "./rule-engine.mjs";

const L = {
  title: ["Rule editor", "Editor de reglas"],
  intro: [
    "Build a rule from tiles. A number right before x or ( multiplies it. Click a tile (or use the arrow keys) to move the cursor; new tiles go in after it. With a tile focused you can also type x + - * ( ) or ^ for a square.",
    "Construye una regla con fichas. Un número justo antes de x o de ( lo multiplica. Haz clic en una ficha (o usa las flechas) para mover el cursor; las fichas nuevas entran después. Con una ficha seleccionada también puedes escribir x + - * ( ) o ^ para un cuadrado.",
  ],
  ruleA: ["Rule A", "Regla A"],
  ruleB: ["Rule B", "Regla B"],
  editing: ["Rule you are editing", "Regla que editas"],
  start: ["Start of rule", "Inicio de la regla"],
  number: [
    "Number tile (whole, decimal or fraction)",
    "Ficha de número (entero, decimal o fracción)",
  ],
  addNum: ["Add number", "Agregar número"],
  tiles: ["Tiles", "Fichas"],
  del: ["Delete tile", "Borrar ficha"],
  clear: ["Clear rule", "Borrar regla"],
  mission: ["Start from the mission rule", "Empezar con la regla de la misión"],
  copy: ["Copy A into B", "Copiar A en B"],
  undo: ["Undo rule edit", "Deshacer"],
  redo: ["Redo rule edit", "Rehacer"],
  simplified: ["Simplified (ax + b)", "Simplificada (ax + b)"],
  bench: ["Test bench", "Banco de pruebas"],
  benchIntro: [
    "Choose inputs. Both rules run on each one.",
    "Elige entradas. Las dos reglas se prueban con cada una.",
  ],
  input: ["Input x", "Entrada x"],
  addInput: ["Add input", "Agregar entrada"],
  remove: ["Remove", "Quitar"],
  same: ["Same output?", "¿Misma salida?"],
  equiv: ["Equivalent?", "¿Equivalentes?"],
  tilesH: ["Algebra tiles", "Fichas de álgebra"],
  grouped: ["1. As built", "1. Como la armaste"],
  distributed: ["2. Distribute", "2. Distribuir"],
  combined: ["3. Combine like terms", "3. Combinar términos semejantes"],
  hiddenNote: [
    "? = this number is one of your Test answers. Check it in Test first.",
    "? = este número es una de tus respuestas de Probar. Compruébalo primero en Probar.",
  ],
  yes: ["yes", "sí"],
  no: ["no", "no"],
  full: ["A rule holds at most 40 tiles.", "Una regla tiene como máximo 40 fichas."],
  badNum: [
    "Type a whole number, decimal or fraction like 3, 2.5 or 1/2.",
    "Escribe un entero, un decimal o una fracción como 3, 2.5 o 1/2.",
  ],
  badInput: [
    "Type an input like 4, −2, 1.5 or 1/3 (at most 8 inputs).",
    "Escribe una entrada como 4, −2, 1.5 o 1/3 (máximo 8 entradas).",
  ],
};
const ERR = {
  empty: ["Add tiles to start a rule.", "Agrega fichas para empezar una regla."],
  "lead-plus": ["A rule cannot start with +.", "Una regla no puede empezar con +."],
  dangling: [
    "An operation at the end needs a term after it.",
    "Una operación al final necesita un término después.",
  ],
  "double-op": [
    "Two operations are next to each other. Put a number, x or ( between them.",
    "Hay dos operaciones juntas. Pon un número, x o ( entre ellas.",
  ],
  "x-times-x": [
    "x times x is x², which this editor does not use. Keep one x per term.",
    "x por x es x², que este editor no usa. Deja una x por término.",
  ],
  "empty-group": ["The parentheses are empty.", "Los paréntesis están vacíos."],
  unclosed: ["A ( is never closed. Add ).", "Un ( nunca se cierra. Agrega )."],
  "extra-close": ["A ) has no matching (.", "Un ) no tiene su ( correspondiente."],
  "square-first": [
    "² squares the number or group just before it. Put one there first.",
    "² eleva al cuadrado el número o grupo justo antes. Pon uno primero.",
  ],
  "square-x": [
    "Squaring x makes a curved rule. Square a number (like the bonus d) instead.",
    "Elevar x al cuadrado hace una regla curva. Eleva un número (como el bono d).",
  ],
  "two-numbers": [
    "Two numbers side by side read like one number. Put × between them.",
    "Dos números juntos parecen un solo número. Pon × entre ellos.",
  ],
};
const OPS = [
  ["x", "x"],
  ["+", "+"],
  ["-", "−"],
  ["*", "×"],
  ["(", "("],
  [")", ")"],
  ["^2", "²"],
];
const KEYMAP = { x: "x", X: "x", "+": "+", "-": "-", "*": "*", "(": "(", ")": ")", "^": "^2" };
const label = (t) => (t === "-" ? "−" : t === "*" ? "×" : t === "^2" ? "²" : t);

export function createRuleEditor({ project, getState, save, announce, values }) {
  let host = null;
  let cursor = null;
  let step = 0;
  const lang = () => (getState().lang === "es" ? 1 : 0);
  const t = (key) => L[key][lang()];
  const data = () => {
    const s = getState();
    s.workbench.rules ||= cleanRules(null);
    return s.workbench.rules;
  };
  const history = createHistory(data());
  const which = () => data().view;
  const tiles = () => data()[which()];
  const pos = () => Math.min(cursor ?? tiles().length, tiles().length);

  function commit(next, message, tag = null) {
    getState().workbench.rules = next;
    history.record(next, tag);
    save();
    render();
    if (message) announce(message);
  }
  const edit = (fn, message, tag) => {
    const next = structuredClone(data());
    fn(next);
    commit(next, message, tag);
  };

  function insert(tile) {
    if (tiles().length >= MAX_TILES) return announce(t("full"));
    const at = pos();
    const message = `${lang() ? "Ficha" : "Tile"} ${label(tile)}: ${ruleText([...tiles().slice(0, at), tile, ...tiles().slice(at)])}`;
    cursor = at + 1;
    edit((d) => d[d.view].splice(at, 0, tile), message);
    focusTile(cursor);
  }
  function removeAt(at) {
    if (at < 1 || at > tiles().length) return;
    const gone = tiles()[at - 1];
    cursor = at - 1;
    edit(
      (d) => d[d.view].splice(at - 1, 1),
      `${lang() ? "Ficha borrada" : "Removed tile"} ${label(gone)}.`,
    );
    focusTile(cursor);
  }
  const focusTile = (k) => host?.querySelector(`[data-re-tile="${k}"]`)?.focus({ preventScroll: true });

  /* ------------------------------------------------------------ hidden-answer formatting */
  let masked = false;
  function fmtFor() {
    const hidden = hiddenAnswers(project, getState());
    return (v) => {
      if (isHidden(hidden, v)) {
        masked = true;
        return "?";
      }
      return show(v).replace("-", "−");
    };
  }

  /* -------------------------------------------------------------------- markup */
  function stripMarkup() {
    const list = tiles();
    const p = pos();
    const parsed = list.length ? parseRule(list) : null;
    const bad = parsed && !parsed.ok ? parsed.at : -1;
    const tile = (k) => {
      const tk = list[k - 1];
      const kind = tk === "x" ? "re-x" : /^\d/.test(tk) ? "re-n" : "re-op";
      const aria = `${lang() ? "Ficha" : "Tile"} ${k}: ${label(tk)}${k === p ? (lang() ? ", cursor después" : ", cursor after") : ""}`;
      return `<button type="button" class="re-tile ${kind}${k === p ? " is-cursor" : ""}${k - 1 === bad ? " is-bad" : ""}" data-re-tile="${k}" aria-label="${esc(aria)}">${esc(label(tk))}</button>`;
    };
    const first = `<button type="button" class="re-tile re-start${p === 0 ? " is-cursor" : ""}" data-re-tile="0" aria-label="${esc(t("start") + (p === 0 ? (lang() ? ", cursor aquí" : ", cursor here") : ""))}">▸</button>`;
    return first + list.map((_, i) => tile(i + 1)).join("");
  }

  function benchMarkup(pa, pb, fmt) {
    const d = data();
    const rows = d.inputs
      .map((s) => {
        const x = parse(s);
        const ya = pa?.ok ? fmt(evaluate(pa.form, x)) : "—";
        const yb = pb?.ok ? fmt(evaluate(pb.form, x)) : "—";
        const same =
          pa?.ok && pb?.ok ? (eq(evaluate(pa.form, x), evaluate(pb.form, x)) ? t("yes") : t("no")) : "—";
        return `<tr><th scope="row">${esc(s.replace("-", "−"))}</th><td>${ya}</td><td>${yb}</td><td>${same}</td><td><button type="button" class="secondary small" data-re-unput="${esc(s)}" aria-label="${esc(`${t("remove")} x = ${s}`)}">${t("remove")}</button></td></tr>`;
      })
      .join("");
    return `<table class="re-table"><caption class="sr-only">${t("bench")}</caption><thead><tr><th scope="col">x</th><th scope="col">${t("ruleA")}</th><th scope="col">${t("ruleB")}</th><th scope="col">${t("same")}</th><th scope="col"><span class="sr-only">${t("remove")}</span></th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function equivMarkup(pa, pb, fmt) {
    if (!pa?.ok || !pb?.ok)
      return `<p class="muted">${lang() ? "Termina las dos reglas para compararlas." : "Finish both rules to compare them."}</p>`;
    const c = compare(pa.form, pb.form, data().inputs);
    const es = lang();
    const agreeList = c.rows
      .filter((r) => r.same)
      .map((r) => show(r.x).replace("-", "−"))
      .join(", ");
    let body;
    if (c.equivalent)
      body = es
        ? `<strong>Sí, equivalentes.</strong> Las dos se simplifican a ${formText(pa.form, fmt)}. El mismo coeficiente y la misma constante dan la misma salida para TODA entrada, no solo las que probaste.`
        : `<strong>Yes, equivalent.</strong> Both simplify to ${formText(pa.form, fmt)}. The same coefficient and the same constant give the same output for EVERY input, not just the ones you tested.`;
    else if (c.agreeAt === "never")
      body = es
        ? "<strong>No son equivalentes.</strong> Tienen el mismo coeficiente de x pero constantes distintas, así que sus salidas siempre difieren por la misma cantidad: ninguna entrada las iguala."
        : "<strong>Not equivalent.</strong> They have the same coefficient of x but different constants, so their outputs always differ by the same amount: no input makes them agree.";
    else
      body = es
        ? `<strong>No son equivalentes.</strong> Los coeficientes de x son distintos. Dan la misma salida en exactamente una entrada, x = ${fmt(c.agreeAt)}, y salidas distintas en todas las demás.`
        : `<strong>Not equivalent.</strong> The coefficients of x differ. They give the same output at exactly one input, x = ${fmt(c.agreeAt)}, and different outputs everywhere else.`;
    if (c.misleading)
      body += es
        ? ` <span class="re-warn">Cuidado: tu banco de pruebas las muestra iguales en x = ${agreeList}. Una prueba que coincide no demuestra equivalencia; compara las formas simplificadas.</span>`
        : ` <span class="re-warn">Watch out: your test bench shows them agreeing at x = ${agreeList}. One matching test does not prove equivalence; compare the simplified forms.</span>`;
    return `<p>${body}</p>`;
  }

  /* ---------------------------------------------------------------- tile drawing */
  function tilesSVG(model, fmt) {
    const chunks = [];
    const neg = (r) => r.sign < 0;
    const signLabel = (r) => (neg(r) ? "− " : "");
    if (step === 2) {
      chunks.push({
        x: Math.abs(model.xTotal),
        units: 0,
        neg: model.xTotal < 0,
        label: `${fmt(absFrac(model.xTotal))} x`,
      });
      chunks.push({
        x: 0,
        units: Math.abs(model.unitTotal),
        neg: model.unitTotal < 0,
        label: fmt(absFrac(model.unitTotal)),
      });
    } else
      for (const r of model.rows) {
        if (r.kind === "group" && step === 0)
          for (let k = 0; k < r.copies; k++)
            chunks.push({
              x: r.x,
              units: r.units,
              neg: neg(r),
              box: true,
              label:
                k === 0
                  ? `${signLabel(r)}${r.copies} × (${r.x === 1 ? "" : r.x}x + ${r.units})`
                  : "",
            });
        else if (r.kind === "group") {
          chunks.push({
            x: r.copies * r.x,
            units: 0,
            neg: neg(r),
            label: `${signLabel(r)}${fmt(frac(r.copies * r.x))}x`,
            hot: true,
          });
          chunks.push({
            x: 0,
            units: r.copies * r.units,
            neg: neg(r),
            label: `${signLabel(r)}${fmt(frac(r.copies * r.units))}`,
            hot: true,
          });
        } else if (r.kind === "square")
          chunks.push({
            square: r.base,
            neg: neg(r),
            label: `${signLabel(r)}${r.base}² = ${fmt(r.value)}`,
          });
        else
          chunks.push({
            x: r.kind === "x" ? r.count : 0,
            units: r.kind === "unit" ? r.count : 0,
            neg: neg(r),
            label: `${signLabel(r)}${r.count}${r.kind === "x" ? "x" : ""}`,
          });
      }
    const W = 640,
      U = 16,
      G = 4;
    let x = 8,
      y = 8,
      rowH = 0,
      body = "";
    for (const c of chunks) {
      const unitCols = Math.min(10, c.units || 0);
      const unitRows = Math.ceil((c.units || 0) / 10);
      const w = c.square
        ? c.square * U
        : c.x * (U + G) + (unitCols ? unitCols * (U + G) : 0) + (c.box ? 8 : 0);
      const h =
        Math.max(c.square ? c.square * U : 0, c.x ? 48 : 0, unitRows * (U + G)) + (c.box ? 8 : 0);
      if (x + w > W - 8 && x > 8) {
        x = 8;
        y += rowH + 30;
        rowH = 0;
      }
      const stroke = c.neg ? ORANGE : TEAL;
      const dash = c.neg ? ' stroke-dasharray="4 3"' : "";
      let cx = x + (c.box ? 4 : 0);
      const cy = y + (c.box ? 4 : 0);
      if (c.box)
        body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="none" stroke="${MUTED}" stroke-width="1.5"/>`;
      if (c.square) {
        for (let r = 0; r < c.square; r++)
          for (let k = 0; k < c.square; k++)
            body += `<rect x="${cx + k * U}" y="${cy + r * U}" width="${U}" height="${U}" fill="${LIME}" stroke="${stroke}"${dash}/>`;
      } else {
        for (let k = 0; k < c.x; k++) {
          body += `<rect x="${cx}" y="${cy}" width="${U}" height="48" rx="2" fill="${c.hot ? PEACH : "#fff"}" stroke="${stroke}" stroke-width="2"${dash}/><text x="${cx + U / 2}" y="${cy + 29}" font-size="11" text-anchor="middle" fill="${INK}">${c.neg ? "−x" : "x"}</text>`;
          cx += U + G;
        }
        for (let k = 0; k < (c.units || 0); k++)
          body += `<rect x="${cx + (k % 10) * (U + G)}" y="${cy + Math.floor(k / 10) * (U + G)}" width="${U}" height="${U}" rx="2" fill="${c.hot ? PEACH : LIME}" stroke="${stroke}" stroke-width="1.5"${dash}/>${c.neg ? `<text x="${cx + (k % 10) * (U + G) + U / 2}" y="${cy + Math.floor(k / 10) * (U + G) + 12}" font-size="11" text-anchor="middle" fill="${INK}">−</text>` : ""}`;
      }
      if (c.label)
        body += `<text x="${x}" y="${y + h + 16}" font-size="13" font-weight="700" fill="${INK}">${esc(c.label)}</text>`;
      x += w + 18;
      rowH = Math.max(rowH, h);
    }
    const H = y + rowH + 30;
    const desc = `${[t("grouped"), t("distributed"), t("combined")][step]}: ${chunks
      .map((c) => c.label)
      .filter(Boolean)
      .join(", ")}`;
    return `<svg class="re-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(desc)}"><rect width="${W}" height="${H}" fill="#fff"/>${body}</svg>`;
  }
  const frac = (n) => fracOf(BigInt(n));
  const absFrac = (n) => frac(Math.abs(n));

  function render() {
    if (!host) return;
    masked = false;
    const fmt = fmtFor();
    const d = data();
    const pa = d.a.length ? parseRule(d.a) : null;
    const pb = d.b.length ? parseRule(d.b) : null;
    const cur = which() === "a" ? pa : pb;
    const active = document.activeElement;
    const focusKey =
      active && host.contains(active)
        ? active.dataset.reTile !== undefined
          ? `[data-re-tile="${active.dataset.reTile}"]`
          : active.id
            ? `#${active.id}`
            : null
        : null;
    host.querySelector("#re-strip").innerHTML = stripMarkup();
    for (const b of host.querySelectorAll("[data-re-view]"))
      b.setAttribute("aria-pressed", String(b.dataset.reView === which()));
    host.querySelector("#re-text").textContent = tiles().length ? ruleText(tiles()) : "";
    host.querySelector("#re-parse").innerHTML = cur
      ? cur.ok
        ? `<span class="re-ok">✓</span> ${t("simplified")}: <strong>${formText(cur.form, fmt)}</strong>`
        : `<span class="re-bad" aria-hidden="true">!</span> ${esc(ERR[cur.error][lang()])}`
      : esc(ERR.empty[lang()]);
    host.querySelector("#re-bench").innerHTML = benchMarkup(pa, pb, fmt);
    host.querySelector("#re-equiv").innerHTML = equivMarkup(pa, pb, fmt);
    const model = tileModel(cur);
    for (const b of host.querySelectorAll("[data-re-step]"))
      b.setAttribute("aria-pressed", String(Number(b.dataset.reStep) === step));
    host.querySelector("#re-tiles").innerHTML = model.drawable
      ? tilesSVG(model, fmt)
      : `<p class="muted">${
          model.reason === "parse"
            ? lang()
              ? "Las fichas aparecen cuando la regla está completa."
              : "Tiles appear when the rule is complete."
            : lang()
              ? "Las fichas se dibujan para reglas con números enteros (hasta 12 grupos y 120 fichas). Tu regla se sigue comprobando exactamente."
              : "Tiles are drawn for whole-number rules (up to 12 groups and 120 tiles). Your rule is still checked exactly."
        }</p>`;
    host.querySelector("#re-hidden").hidden = !masked;
    const undo = host.querySelector('[data-re="undo"]'),
      redo = host.querySelector('[data-re="redo"]');
    undo.disabled = !history.canUndo();
    redo.disabled = !history.canRedo();
    if (focusKey) host.querySelector(focusKey)?.focus({ preventScroll: true });
  }

  function html() {
    const ops = OPS.map(
      ([k, sym]) =>
        `<button type="button" class="re-tile re-op re-pal" data-re-op="${esc(k)}" aria-label="${esc(`${lang() ? "Agregar" : "Add"} ${k === "^2" ? (lang() ? "cuadrado" : "square") : sym}`)}">${sym}</button>`,
    ).join("");
    return `<section class="card re" id="re" aria-labelledby="re-h"><h3 id="re-h">${t("title")}</h3><p>${t("intro")}</p>
<div class="re-row" role="group" aria-label="${t("editing")}"><button type="button" class="secondary small" data-re-view="a" aria-pressed="true">${t("ruleA")}</button><button type="button" class="secondary small" data-re-view="b" aria-pressed="false">${t("ruleB")}</button></div>
<div id="re-strip" class="re-strip" role="group" aria-label="${t("tiles")}"></div><p id="re-text" class="re-text" aria-hidden="true"></p><p id="re-parse" class="re-parse" aria-live="polite"></p>
<div class="re-row" role="group" aria-label="${t("tiles")}">${ops}</div>
<form class="re-row" data-re-form="num" novalidate><label for="re-num">${t("number")}</label><input id="re-num" inputmode="decimal" maxlength="8" autocomplete="off"><button type="submit" class="secondary small">${t("addNum")}</button></form>
<div class="re-row"><button type="button" class="secondary small" data-re="del">${t("del")}</button><button type="button" class="secondary small" data-re="clear">${t("clear")}</button><button type="button" class="secondary small" data-re="mission">${t("mission")}</button><button type="button" class="secondary small" data-re="copy">${t("copy")}</button><button type="button" class="secondary small" data-re="undo">${t("undo")}</button><button type="button" class="secondary small" data-re="redo">${t("redo")}</button></div>
<p id="fd-status" class="notice" role="status"></p>
<h4>${t("bench")}</h4><p class="muted">${t("benchIntro")}</p><form class="re-row" data-re-form="input" novalidate><label for="re-input">${t("input")}</label><input id="re-input" inputmode="decimal" maxlength="8" autocomplete="off"><button type="submit" class="secondary small">${t("addInput")}</button></form><div id="re-bench" class="re-scroll"></div>
<h4>${t("equiv")}</h4><div id="re-equiv" aria-live="polite"></div>
<h4>${t("tilesH")}</h4><div class="re-row" role="group" aria-label="${t("tilesH")}"><button type="button" class="secondary small" data-re-step="0">${t("grouped")}</button><button type="button" class="secondary small" data-re-step="1">${t("distributed")}</button><button type="button" class="secondary small" data-re-step="2">${t("combined")}</button></div><div id="re-tiles" class="re-stage"></div>
<p id="re-hidden" class="muted" hidden>${t("hiddenNote")}</p></section>`;
  }

  /* ---------------------------------------------------------------- interaction */
  function act(name) {
    const es = lang();
    if (name === "undo" || name === "redo") {
      const next = name === "undo" ? history.undo() : history.redo();
      if (!next) return;
      getState().workbench.rules = cleanRules(next);
      cursor = null;
      save();
      render();
      return announce(
        name === "undo"
          ? es
            ? "Se deshizo el cambio de la regla."
            : "Undid the rule change."
          : es
            ? "Se rehízo el cambio."
            : "Redid the rule change.",
      );
    }
    if (name === "del") return removeAt(pos());
    if (name === "clear") {
      cursor = 0;
      return edit((d) => (d[d.view] = []), es ? "Regla borrada." : "Rule cleared.");
    }
    if (name === "mission") {
      const v = values();
      if (!v)
        return announce(
          es ? "Corrige los números del diseño primero." : "Fix the design numbers first.",
        );
      cursor = null;
      return edit(
        (d) => (d[d.view] = missionTiles(v)),
        `${es ? "Regla de la misión" : "Mission rule"}: ${ruleText(missionTiles(v))}`,
      );
    }
    if (name === "copy") {
      cursor = null;
      return edit(
        (d) => {
          d.b = [...d.a];
          d.view = "b";
        },
        es
          ? "Regla A copiada en B. Ahora editas B."
          : "Copied Rule A into B. You are now editing B.",
      );
    }
  }
  function onClick(event) {
    const tileEl = event.target.closest("[data-re-tile]");
    if (tileEl) {
      cursor = Number(tileEl.dataset.reTile);
      render();
      return focusTile(cursor);
    }
    const op = event.target.closest("[data-re-op]");
    if (op) return insert(op.dataset.reOp);
    const view = event.target.closest("[data-re-view]");
    if (view) {
      cursor = null;
      return edit(
        (d) => (d.view = view.dataset.reView),
        `${view.dataset.reView === "a" ? t("ruleA") : t("ruleB")}.`,
      );
    }
    const st = event.target.closest("[data-re-step]");
    if (st) {
      step = Number(st.dataset.reStep);
      render();
      return announce([t("grouped"), t("distributed"), t("combined")][step]);
    }
    const un = event.target.closest("[data-re-unput]");
    if (un)
      return edit(
        (d) => (d.inputs = d.inputs.filter((s) => s !== un.dataset.reUnput)),
        `${t("remove")}: x = ${un.dataset.reUnput}`,
      );
    const b = event.target.closest("[data-re]");
    if (b) act(b.dataset.re);
  }
  function onSubmit(event) {
    const form = event.target.closest("[data-re-form]");
    if (!form) return;
    event.preventDefault();
    if (form.dataset.reForm === "num") {
      const input = host.querySelector("#re-num");
      const v = numberTile(input.value);
      if (!v) return announce(t("badNum"));
      input.value = "";
      return insert(v);
    }
    const input = host.querySelector("#re-input");
    const v = inputValue(input.value.replace("−", "-"));
    if (!v || data().inputs.length >= MAX_INPUTS) return announce(t("badInput"));
    input.value = "";
    if (data().inputs.includes(v)) return announce(`x = ${v}`);
    edit((d) => d.inputs.push(v), `${t("addInput")}: x = ${v}`);
  }
  function onKey(event) {
    const tileEl = event.target.closest?.("[data-re-tile]");
    if (!tileEl) return;
    const k = Number(tileEl.dataset.reTile);
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      cursor = Math.max(0, Math.min(tiles().length, k + (event.key === "ArrowLeft" ? -1 : 1)));
      render();
      return focusTile(cursor);
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      cursor = event.key === "Home" ? 0 : tiles().length;
      render();
      return focusTile(cursor);
    }
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      cursor = k;
      return removeAt(k);
    }
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      cursor = k;
      const input = host.querySelector("#re-num");
      input.value = event.key;
      return input.focus();
    }
    if (KEYMAP[event.key]) {
      event.preventDefault();
      cursor = k;
      insert(KEYMAP[event.key]);
    }
  }

  return {
    html,
    render,
    attach(section) {
      host = section.querySelector("#re");
      if (!host) return;
      host.addEventListener("click", onClick);
      host.addEventListener("submit", onSubmit);
      host.addEventListener("keydown", onKey);
      render();
    },
    detach() {
      host = null;
    },
    restored(next) {
      getState().workbench.rules = cleanRules(next);
      history.record(getState().workbench.rules, null);
      cursor = null;
      render();
    },
  };
}
