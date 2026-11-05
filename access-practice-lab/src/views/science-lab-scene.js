// Science Investigation Lab: the shared scene library. Render-only: every function returns markup built from the
// case data and the learner's saved choices. No DOM, no storage, no clock, no randomness, no external assets.
//
// ── API (part 2 of the visual build reuses these) ────────────────────────────────────────────────────────────────
//   sceneFamily(caseDef)                                  -> family object; chosen from caseDef.id: "ice-cover",
//                                                            "ice-cover-transfer" (cocoa), "soil-sprout",
//                                                            "soil-sprout-transfer" (lettuce), else "bench".
//   hotspotsOf(caseDef)                                   -> [{ id, x, y, label, notice, wonder }] (x/y in % of hero)
//   phenomenonSceneHTML(I, caseDef, { uid, hotspots, look }) -> <figure class="slx-figure">: the hero picture,
//                                                            optional hotspot buttons (data-slx-look="<id>"), and a
//                                                            visible text equivalent.
//   setupSceneHTML(I, caseDef, { changed, held, trials, uid }) -> <figure data-sl-preview>: the apparatus preview of a
//                                                            plan; the changed variable differs across columns, held
//                                                            variables are identical and listed as "kept the same",
//                                                            trials are repeated units.
//   unitSVG(I, caseDef, conds, { mode, ratio, uid, title, desc }) -> one test unit as an accessible SVG string.
//   runFrameHTML(I, caseDef, row, { state, uid })         -> the time-lapse art for one dataset row. state "ready"
//                                                            (start frame), "play" (CSS time-lapse; reduced motion
//                                                            shows the start and end frames side by side), "done"
//                                                            (end frame).
//   barChartHTML(I, caseDef, rows, { values, highlight, uid })  (science-lab-scene-chart.js, re-exported here)
//                                                         -> <figure class="slx-chart">: an SVG bar chart (one bar per
//                                                            row; `values` overrides the drawn heights by row id,
//                                                            missing = not drawn yet), `highlight` row ids drawn as
//                                                            selected, and a `.sl-alt` text version with every value.
//   runDuration(caseDef, row)                            -> CSS duration of that row's time-lapse ("2.40s")
//   trialOf(caseDef, row)                                 -> 1 for the first run of a set of conditions, 2 for a repeat
//   focusValues(caseDef), resultOrder(caseDef, rows)      -> the focus variable's values; its values ordered by the
//                                                            average measured value of the given rows (largest first).
//   varIconSVG(caseDef, varId, valueId), measureIconSVG(caseDef) -> small decorative object drawings.
//   STAGE_ICONS                                           -> sprite icon name per stage (for the visual trail).
import { esc, raw } from "../util.js";
import { BENCH, LETTUCE, SOIL } from "./science-lab-scene-soil.js";
import { COCOA, ICE } from "./science-lab-scene-ice.js";
import { condText, maxOf, svgDeco, svgImg, valueLabel, valueOf } from "./science-lab-scene-kit.js";

export { barChartHTML, barNote, chartAxisMax, snapValue } from "./science-lab-scene-chart.js";
export { condText, valueLabel, valueOf };

const FAMILIES = { [ICE.id]: ICE, [COCOA.id]: COCOA, [SOIL.id]: SOIL, [LETTUCE.id]: LETTUCE };
export const sceneFamily = (caseDef) => FAMILIES[caseDef?.id] || BENCH;
export const hotspotsOf = (caseDef) => sceneFamily(caseDef).hotspots;

export const STAGE_ICONS = {
  notice: "search",
  question: "help",
  hypothesis: "bulb",
  plan: "list",
  collect: "grid",
  represent: "growth",
  claim: "flag",
  evidence: "evidence",
  reasoning: "conversation",
  revise: "retry",
  present: "speaking",
  reflect: "bookmark",
  transfer: "launch",
};

const both = (I, o) => (o ? I.S(o.en, o.es) : "");

// ── the phenomenon ───────────────────────────────────────────────────────────
export function phenomenonSceneHTML(
  I,
  caseDef,
  { uid = "slx-hero", hotspots = false, look = "", caption = true } = {},
) {
  const fam = sceneFamily(caseDef);
  const hero = fam.hero(caseDef);
  const spots = hotspots ? fam.hotspots : [];
  const art = svgImg({
    uid,
    vb: "0 0 640 360",
    title: both(I, hero.title),
    desc: both(I, hero.desc),
    inner: hero.svg,
    cls: "slx-hero-svg",
  });
  const buttons = spots
    .map(
      (h, i) =>
        `<button type="button" class="slx-spot${h.id === look ? " is-on" : ""}" data-slx-look="${h.id}" style="left:${h.x}%;top:${h.y}%" aria-pressed="${h.id === look}" aria-label="${esc(`${I.S("Look closely at", "Mira de cerca")}: ${both(I, h.label)}`)}"><span aria-hidden="true">${i + 1}</span></button>`,
    )
    .join("");
  return raw(
    `<figure class="slx-figure"><div class="slx-stage">${art}${buttons}</div><figcaption class="slx-cap${caption ? "" : " visually-hidden"}">${esc(both(I, hero.desc))}</figcaption></figure>`,
  );
}

// ── one test unit ────────────────────────────────────────────────────────────
export function unitSVG(I, caseDef, conds, { mode = "start", ratio = 1, uid, title, desc = "" }) {
  const fam = sceneFamily(caseDef);
  return svgImg({
    uid,
    vb: fam.vb || "0 0 160 170",
    title,
    desc,
    inner: fam.unit(conds, mode, ratio),
    cls: "slx-unit",
  });
}

export function trialOf(caseDef, row) {
  const rows = caseDef.dataset.rows;
  const same = (a) => caseDef.variables.every((v) => a.conditions[v.id] === row.conditions[v.id]);
  return rows.slice(0, rows.findIndex((r) => r.id === row.id) + 1).filter(same).length;
}

/** The start and end sentences for one row, values included. */
export function runWords(I, caseDef, row) {
  const fam = sceneFamily(caseDef);
  const cond = condText(I, caseDef, row.conditions);
  const unit = both(I, caseDef.dataset.unit);
  return {
    cond,
    start: `${I.S("Start", "Inicio")}: ${both(I, fam.say.start)} (${cond}).`,
    end: `${I.S("End", "Final")}: ${both(I, fam.say.end)}. ${both(I, caseDef.measure.label)}: ${valueOf(caseDef, row)} ${unit}.`,
  };
}

/** How long one row's time-lapse plays: longer results take longer, so the runs can be compared by eye. */
export const runDuration = (caseDef, row) => `${(1.6 + (3.4 * valueOf(caseDef, row)) / maxOf(caseDef)).toFixed(2)}s`;

export function runFrameHTML(I, caseDef, row, { state = "ready", uid = `slx-run-${row.id}` } = {}) {
  const ratio = valueOf(caseDef, row) / maxOf(caseDef);
  const w = runWords(I, caseDef, row);
  const n = caseDef.dataset.rows.findIndex((r) => r.id === row.id) + 1;
  const name = `${I.S("Test", "Prueba")} ${n}`;
  const one = (mode, suffix, title, desc) =>
    unitSVG(I, caseDef, row.conditions, { mode, ratio, uid: `${uid}-${suffix}`, title, desc });
  if (state === "ready")
    return raw(
      `<div class="slx-run-art is-ready">${one("start", "s", `${name}: ${w.cond}`, w.start)}</div>`,
    );
  if (state === "done")
    return raw(
      `<div class="slx-run-art is-done">${one("end", "e", `${name}: ${w.cond}`, w.end)}</div>`,
    );
  return raw(
    `<div class="slx-run-art is-play" style="--slx-dur:${runDuration(caseDef, row)}"><div class="slx-anim">${one("anim", "a", `${I.S("Time-lapse of", "Secuencia de")} ${name}: ${w.cond}`, `${w.start} ${w.end}`)}</div><div class="slx-still"><div class="slx-frame">${one("start", "s", `${name}, ${I.S("start", "inicio")}`, w.start)}<span class="slx-frame-tag">${I.S("Start", "Inicio")}</span></div><span class="slx-arrow" aria-hidden="true">→</span><div class="slx-frame">${one("end", "e", `${name}, ${I.S("end", "final")}`, w.end)}<span class="slx-frame-tag">${I.S("End", "Final")}</span></div></div></div>`,
  );
}

// ── the apparatus preview of a plan ──────────────────────────────────────────
const MAX_COLS = 6;

function combos(caseDef, ids) {
  let out = [{}];
  for (const id of ids) {
    const v = caseDef.variables.find((x) => x.id === id);
    out = out.flatMap((c) => v.values.map((val) => ({ ...c, [id]: val.id })));
  }
  return out.slice(0, MAX_COLS);
}

export function setupSceneHTML(
  I,
  caseDef,
  { changed = [], held = [], trials = 1, uid = "slx-setup" } = {},
) {
  const vars = caseDef.variables;
  const ch = vars.filter((v) => changed.includes(v.id)).map((v) => v.id);
  const fixed = Object.fromEntries(vars.map((v) => [v.id, v.values[0].id]));
  const reps = Math.max(1, Math.min(3, Number.parseInt(trials, 10) || 1));
  const cols = ch.length ? combos(caseDef, ch) : [{}];
  const label = (c) => ch.map((id) => valueLabel(I, caseDef, id, c[id])).join(", ");
  const colHTML = cols
    .map((c, ci) => {
      const conds = { ...fixed, ...c };
      const cups = Array.from({ length: reps }, (_, r) =>
        unitSVG(I, caseDef, conds, {
          mode: "start",
          ratio: 0.4,
          uid: `${uid}-${ci}-${r}`,
          title: `${condText(I, caseDef, conds)} · ${I.S("trial", "ensayo")} ${r + 1}`,
        }),
      ).join("");
      const tag = ch.length
        ? `<p class="slx-col-tag"><span class="slx-tag-k">${I.S("Changes", "Cambia")}</span> ${esc(label(c))}</p>`
        : `<p class="slx-col-tag">${I.S("Choose what to change", "Elige qué cambiar")}</p>`;
      return `<div class="slx-col">${tag}<div class="slx-cups">${cups}</div></div>`;
    })
    .join("");
  const kept = vars
    .filter((v) => !ch.includes(v.id))
    .map((v) => {
      const isHeld = held.includes(v.id);
      const val = valueLabel(I, caseDef, v.id, fixed[v.id]);
      return `<li class="${isHeld ? "is-held" : "is-open"}"><svg class="slx-mini" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${sceneFamily(caseDef).varIcon(v.id, fixed[v.id])}</svg><span><strong>${esc(I.S(v.label.en, v.label.es))}</strong> · ${isHeld ? `${I.S("kept the same", "se mantiene igual")}: ${esc(val)}` : I.S("not decided yet", "todavía sin decidir")}</span></li>`;
    })
    .join("");
  const many = ch.length > 1;
  const text = ch.length
    ? `${I.S(`Your test has ${cols.length} groups`, `Tu prueba tiene ${cols.length} grupos`)}: ${cols.map(label).join("; ")}. ${I.S(`Each group is repeated ${reps} time${reps > 1 ? "s" : ""}.`, `Cada grupo se repite ${reps} ${reps > 1 ? "veces" : "vez"}.`)}`
    : I.S(
        "Nothing changes yet, so every cup looks the same.",
        "Todavía nada cambia, así que todos los vasos se ven iguales.",
      );
  return raw(
    `<figure class="slx-setup${many ? " is-many" : ""}" data-sl-preview data-slx-cols="${cols.length}" aria-labelledby="${uid}-cap"><p class="slx-setup-head">${I.S("Your test set-up", "Tu montaje de prueba")}</p><div class="slx-cols">${colHTML}</div>${kept ? `<ul class="slx-kept">${kept}</ul>` : ""}${many ? `<p class="slx-warn">${I.S("Two things change from group to group. Could you tell which one made a difference?", "Dos cosas cambian de grupo a grupo. ¿Podrías saber cuál hizo la diferencia?")}</p>` : ""}<figcaption id="${uid}-cap" class="slx-cap">${esc(text)}</figcaption></figure>`,
  );
}

// ── orders and icons ─────────────────────────────────────────────────────────
export const focusValues = (caseDef) =>
  (caseDef.variables.find((v) => v.id === caseDef.focus) || caseDef.variables[0]).values;

export function resultOrder(caseDef, rows) {
  const focus = caseDef.focus || caseDef.variables[0].id;
  const out = focusValues(caseDef)
    .map((val, i) => {
      const mine = rows.filter((r) => r.conditions[focus] === val.id);
      const mean = mine.length
        ? mine.reduce((s, r) => s + valueOf(caseDef, r), 0) / mine.length
        : null;
      return { id: val.id, mean, i };
    })
    .filter((x) => x.mean !== null);
  return out.sort((a, b) => b.mean - a.mean || a.i - b.i);
}

export const varIconSVG = (caseDef, varId, valueId = "") =>
  raw(svgDeco("0 0 64 64", sceneFamily(caseDef).varIcon(varId, valueId), "slx-icon"));
export const measureIconSVG = (caseDef) =>
  raw(svgDeco("0 0 64 64", sceneFamily(caseDef).measureIcon(), "slx-icon"));
