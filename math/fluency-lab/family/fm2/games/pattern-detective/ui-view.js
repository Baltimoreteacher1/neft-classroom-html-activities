// Pattern Detective screen: pure functions that turn the round and the learner's work-in-progress into markup.
// Everything the learner reads comes from copy.js in the chosen language, so a language switch only re-renders.
// @fm2 FM-013 FM-038 FM-039 FM-021 FM-037
import { figureSvg, graphSvg, hundredChartSvg, machineSvg, symbolSvg } from "../../art/patterns.js";
import { escapeHtml, tx, L } from "../../lang.js";
import { UI } from "./copy.js";
import { quantity } from "./copy-prompts.js";
import { evidenceRows } from "./logic.js";
import { renderRule } from "./ui-rule.js";

const e = escapeHtml;
const t = (key, lang, vars) => tx(UI[key], lang, vars);
const sym = (id, lang) => L(UI.symbols[id], lang);
const num = (value) => (typeof value === "string" ? 0 : value.n / value.d);

export function headers(round, lang) {
  const tag = (side) =>
    `${L(round.names[side], lang)}${round.showVars ? ` (${side === "in" ? round.vars : "y"})` : ""}`;
  return { inName: tag("in"), outName: tag("out") };
}

function probesBlock(round, state, lang, locked) {
  const left = round.probes - state.rows.length;
  const dots = Array.from({ length: round.probes }, (_, i) => (i < left ? "●" : "○")).join(" ");
  const readout = readoutText(round, state.readout, lang);
  const note = state.note
    ? `<p class="pd-note" role="status">${e(noteText(state.note, lang))}</p>`
    : "";
  let control = "";
  if (round.form !== "cycle") {
    const { inName } = headers(round, lang);
    const machines =
      round.machines.length > 1
        ? `<div class="pd-pick" role="group" aria-label="${e(t("machine", lang))}">${round.machines
            .map(
              (m, i) =>
                `<button type="button" class="fm2-btn pd-chip" data-act="machine" data-m="${i}" data-key="machine-${i}" aria-pressed="${state.probeMachine === i}" ${locked ? "disabled" : ""}>${e(t(i ? "machineB" : "machineA", lang))}</button>`,
            )
            .join("")}</div>`
        : "";
    control = `${machines}<div class="pd-probe-row"><label class="pd-label" for="pd-x">${e(t("tryLabel", lang, { name: inName }))}</label>
      <input id="pd-x" class="pd-input" type="text" inputmode="numeric" autocomplete="off" data-key="x" value="${e(state.xText)}" ${locked ? "disabled" : ""}>
      <button type="button" class="fm2-btn fm2-btn-primary" data-act="probe" data-key="probe" ${locked ? "disabled" : ""}>${e(t("probeBtn", lang))}</button></div>`;
  }
  return `<div class="pd-probes"><p class="pd-left" data-pd-left><strong>${e(t("probesLeft", lang, { left, total: round.probes }))}</strong> <span aria-hidden="true" class="pd-dots">${dots}</span></p>${control}<p class="pd-readout" data-pd-readout>${e(readout)}</p>${note}</div>`;
}

function readoutText(round, readout, lang) {
  if (!readout) return "";
  if (readout.kind === "cell")
    return t("readoutCell", lang, { n: readout.x, name: sym(readout.y, lang) });
  if (readout.kind === "already") return t("already", lang, { x: readout.x, y: readout.y });
  if (readout.kind === "gave")
    return t("gotBack", lang, {
      name: L(round.names.in, lang).toLowerCase(),
      x: readout.x,
      y: readout.y,
    });
  return "";
}

function noteText(note, lang) {
  if (note.key === "outOfRange") return t("outOfRange", lang, note.vars);
  return t(note.key, lang, note.vars);
}

function strip(round, state, lang, locked) {
  const shown = new Map(evidenceRows(round, state.rows).map((row) => [row.x, row]));
  const left = round.probes - state.rows.length;
  const seeds = new Set(round.seed.map((row) => row.x));
  const cells = [];
  for (let x = round.dom.lo; x <= round.dom.hi; x += 1) {
    const row = shown.get(x);
    if (row) {
      const name = sym(row.y, lang);
      const label = t(seeds.has(x) ? "cellFree" : "cellShown", lang, { n: x, name });
      cells.push(
        `<li class="pd-cell" data-state="shown"><span class="fm2-sr">${e(label)}</span><span aria-hidden="true" class="pd-cellnum">${x}</span>${symbolSvg(row.y, 40)}<span aria-hidden="true" class="pd-cellname">${e(name)}</span></li>`,
      );
    } else {
      const off = left <= 0 || locked;
      const label = off ? t("cellLocked", lang, { n: x }) : t("cellHidden", lang, { n: x });
      cells.push(
        `<li class="pd-cell" data-state="hidden"><button type="button" class="pd-cellbtn" data-act="cell" data-x="${x}" data-key="cell-${x}" aria-label="${e(label)}" ${off ? "disabled" : ""}><span aria-hidden="true" class="pd-cellnum">${x}</span><span aria-hidden="true" class="pd-q">?</span></button></li>`,
      );
    }
  }
  return `<ol class="pd-strip" aria-label="${e(t("strip", lang))}">${cells.join("")}</ol>`;
}

function terms(round, state, lang) {
  const shown = new Map(evidenceRows(round, state.rows).map((row) => [row.x, row]));
  const items = [];
  for (let x = round.dom.lo; x <= round.dom.hi; x += 1) {
    const row = shown.get(x);
    items.push(
      `<li class="pd-term" data-state="${row ? "shown" : "hidden"}"><span class="pd-cellnum">${x}</span><span class="pd-termval">${row ? e(row.yText) : "?"}</span></li>`,
    );
  }
  return `<ol class="pd-terms" aria-label="${e(L(round.names.out, lang))}">${items.join("")}<li class="pd-term pd-farterm" data-state="far"><span class="pd-cellnum">${round.far}</span><span class="pd-termval">?</span></li></ol>`;
}

function figures(round, state, lang) {
  const rows = evidenceRows(round, state.rows).sort((p, q) => p.x - q.x);
  if (!rows.length) return `<p class="pd-empty">${e(t("figEmpty", lang))}</p>`;
  return `<ul class="pd-figs">${rows
    .map((row) => {
      const y = row.yText;
      const label = t("figureAlt", lang, { n: row.x, y });
      return `<li class="pd-fig">${figureSvg({ a: round.fig.a, b: round.fig.b, n: row.x, name: label })}<span>${e(`${L(round.names.in, lang)} ${row.x}: ${y}`)}</span></li>`;
    })
    .join("")}</ul>`;
}

function art(round, state, lang, locked) {
  if (round.form === "cycle") return strip(round, state, lang, locked);
  if (round.show === "terms") return terms(round, state, lang);
  if (round.show === "figure") return figures(round, state, lang);
  if (round.show === "chart") {
    const shown = new Set(evidenceRows(round, state.rows).map((row) => num(row.y)));
    return `<div class="pd-chart"><p class="pd-eyebrow">${e(t("chartTitle", lang))}</p>${hundredChartSvg({ shown, name: t("chartTitle", lang) })}</div>`;
  }
  const last = state.readout?.kind === "gave" ? { x: state.readout.x, y: state.readout.y } : null;
  const { inName, outName } = headers(round, lang);
  return `<div class="pd-machine">${machineSvg({ inText: round.showVars ? round.vars : L(round.names.in, lang), outText: round.showVars ? "y" : L(round.names.out, lang), last, name: `${inName} → ${outName}` })}</div>`;
}

function table(round, state, lang) {
  const rows = evidenceRows(round, state.rows);
  const { inName, outName } = headers(round, lang);
  const two = round.machines.length > 1;
  const seeds = new Set(round.seed.map((row) => `${row.m}:${row.x}`));
  const body = rows.length
    ? rows
        .map(
          (row) =>
            `<tr>${two ? `<td>${e(t(row.m ? "machineB" : "machineA", lang))}</td>` : ""}<td>${row.x}</td><td>${e(row.yText)}${seeds.has(`${row.m}:${row.x}`) ? ` <span class="pd-free">${e(t("freeClue", lang))}</span>` : ""}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="${two ? 3 : 2}" class="pd-empty">${e(t("noClues", lang))}</td></tr>`;
  return `<table class="pd-table"><caption>${e(t("tableTitle", lang))}</caption><thead><tr>${two ? `<th scope="col">${e(t("machine", lang))}</th>` : ""}<th scope="col">${e(inName)}</th><th scope="col">${e(outName)}</th></tr></thead><tbody>${body}</tbody></table>`;
}

function graph(round, state, lang) {
  const rows = evidenceRows(round, state.rows);
  const { inName, outName } = headers(round, lang);
  if (round.form === "two") {
    const byX = new Map();
    for (const row of rows) byX.set(row.x, { ...byX.get(row.x), [row.m]: num(row.y) });
    const pairs = [...byX.entries()]
      .filter(([, v]) => v[0] !== undefined && v[1] !== undefined)
      .sort((p, q) => p[0] - q[0]);
    const list = pairs.length
      ? `<p class="pd-pairs"><strong>${e(t("pairsTitle", lang))}</strong> ${pairs.map(([, v]) => `(${v[0]}, ${v[1]})`).join("  ")}</p>`
      : "";
    const svg = graphSvg({
      points: pairs.map(([, v]) => ({ x: v[0], y: v[1], m: 0 })),
      xName: t("machineA", lang),
      yName: t("machineB", lang),
      name: t("graphTitle", lang),
    });
    return `<div class="pd-graph">${svg}${list}</div>`;
  }
  const points = rows.map((row) => ({ x: row.x, y: num(row.y), m: row.m }));
  return `<div class="pd-graph">${graphSvg({ points, xName: inName, yName: outName, name: t("graphTitle", lang) })}</div>`;
}

function prediction(round, state, lang, locked) {
  if (round.form === "cycle") {
    const buttons = round.alpha
      .map(
        (id) =>
          `<button type="button" class="fm2-btn pd-pal" data-act="far-sym" data-id="${id}" data-key="far-${id}" aria-pressed="${state.farSym === id}" ${locked ? "disabled" : ""}>${symbolSvg(id, 32)}<span>${e(sym(id, lang))}</span></button>`,
      )
      .join("");
    return `<fieldset class="pd-set"><legend>${e(t("predictCell", lang, { far: round.far }))}</legend><div class="pd-palette">${buttons}</div></fieldset>`;
  }
  const label =
    round.form === "two"
      ? t("predictTwo", lang, { far: round.far })
      : t("predictNum", lang, {
          in: quantity(round, "in", lang),
          out: quantity(round, "out", lang),
          far: round.far,
        });
  return `<div class="pd-set"><label class="pd-label" for="pd-far">${e(label)}</label><input id="pd-far" class="pd-input pd-wide" type="text" inputmode="decimal" autocomplete="off" data-key="far" value="${e(state.farText)}" ${locked ? "disabled" : ""}></div>`;
}

function question(round, state, lang, locked) {
  if (!round.cls) return "";
  const cls = round.cls;
  const label = (id) => {
    if (cls.id === "dep") return L(id === "in" ? round.names.in : round.names.out, lang);
    if (cls.id === "times") return tx(UI.clsOpt.times, lang, { n: id });
    return L(UI.clsOpt[id], lang);
  };
  const buttons = cls.options
    .map(
      (id) =>
        `<button type="button" class="fm2-btn pd-pal" data-act="cls" data-id="${id}" data-key="cls-${id}" aria-pressed="${state.cls === id}" ${locked ? "disabled" : ""}>${e(label(id))}</button>`,
    )
    .join("");
  return `<fieldset class="pd-set"><legend>${e(L(UI.clsQ[cls.id], lang))}</legend><div class="pd-palette">${buttons}</div></fieldset>`;
}

export function view(round, state, lang, locked) {
  const graphBlock =
    round.show === "graph" || round.form === "two" ? graph(round, state, lang) : "";
  const evidence =
    round.form === "cycle"
      ? ""
      : `<section class="pd-card pd-evidence">${table(round, state, lang)}${graphBlock}</section>`;
  const lab = `<section class="pd-card pd-lab">${art(round, state, lang, locked)}${probesBlock(round, state, lang, locked)}</section>`;
  const say = `<section class="pd-card pd-say"><h3 class="pd-h">${e(t(round.form === "cycle" ? "coreTitle" : "ruleTitle", lang))}</h3>${renderRule(round, state, lang, locked)}${question(round, state, lang, locked)}${prediction(round, state, lang, locked)}</section>`;
  const status = state.done ? `<p class="pd-solved" role="status">${e(t("solved", lang))}</p>` : "";
  const check = `<div class="pd-actions"><button type="button" class="fm2-btn fm2-btn-primary" data-act="check" data-key="check" ${locked ? "disabled" : ""}>${e(t("check", lang))}</button>${state.checkNote ? `<p class="pd-note" role="status">${e(t(state.checkNote, lang))}</p>` : ""}${status}</div>`;
  return `<div class="pd" data-form="${round.form}"><div class="pd-col pd-left-col">${lab}${evidence}</div><div class="pd-col pd-right-col">${say}${check}</div></div>`;
}
