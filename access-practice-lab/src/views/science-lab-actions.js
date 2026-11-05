// Science Investigation Lab: what the hands-on scene parts do when the learner uses them.
// Everything is saved inside the stage's own record with patchStage; scenes that change while the learner works
// (the plan preview, the bar chart) are redrawn in place so focus stays where it is.
import { dataRows, patchStage, recOf } from "./science-lab-model.js";
import { planPreviewHTML } from "./science-lab-plan.js";
import { toHtml } from "../util.js";
import { barChartHTML, barNote, snapValue } from "./science-lab-scene.js";
import { mirrorReason } from "./science-lab-argue.js";
import { diffHTML } from "./science-lab-share.js";
import { chipText, predictionOrder } from "./science-lab-steps.js";
import { workOf, csOf } from "./science-lab-model.js";

const say = (text) => {
  const live = document.getElementById("slMsg");
  if (live) live.textContent = text;
};
const focusEl = (selector) => document.querySelector(selector)?.focus();

// ── clicks ───────────────────────────────────────────────────────────────────
function lookAt(ctx, t, id) {
  const rec = recOf(t, "notice");
  patchStage(t, "notice", { look: rec.look === id ? "" : id });
  return ctx.rerender().then(() => focusEl(`[data-slx-look="${id}"]`));
}

function chip(ctx, I, t, value, add) {
  const [k, h] = value.split(":");
  const chips = recOf(t, "notice").chips || [];
  const next = add
    ? [...chips.filter((c) => !(c.h === h && c.k === k)), { h, k }]
    : chips.filter((c) => !(c.h === h && c.k === k));
  patchStage(t, "notice", { chips: next });
  const words = chipText(I, t.caseDef, { h, k });
  say(
    add
      ? I.S(`Added: ${words}`, `Agregado: ${words}`)
      : I.S(`Removed: ${words}`, `Quitado: ${words}`),
  );
  return ctx
    .rerender()
    .then(() =>
      add
        ? focusEl(`[data-slx-unchip="${value}"]`) || focusEl("[data-slx-obs]")
        : focusEl(`#slf-notice-${k === "w" ? "wonder" : "notice"}`),
    );
}

function pickCard(ctx, I, t, id) {
  const rec = recOf(t, "question");
  patchStage(t, "question", { pick: rec.pick === id ? "" : id });
  say(I.S("Now tap the box where this card goes.", "Ahora toca la caja donde va esta tarjeta."));
  return ctx.rerender().then(() => focusEl(`[data-slx-pick="${id}"]`));
}

function fillSlot(ctx, I, t, slot) {
  const rec = recOf(t, "question");
  const slots = { ...(rec.slots || {}) };
  if (rec.pick) {
    for (const k of Object.keys(slots)) if (slots[k] === rec.pick) delete slots[k];
    slots[slot] = rec.pick;
  } else if (slots[slot]) delete slots[slot];
  else say(I.S("Tap a card first.", "Primero toca una tarjeta."));
  patchStage(t, "question", { slots, pick: "" });
  return ctx.rerender().then(() => focusEl(`[data-slx-slot="${slot}"]`));
}

function move(ctx, I, t, value) {
  const [id, dir] = value.split(":");
  const order = [...predictionOrder(t.caseDef, recOf(t, "hypothesis"))];
  const i = order.indexOf(id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= order.length) return Promise.resolve();
  [order[i], order[j]] = [order[j], order[i]];
  patchStage(t, "hypothesis", { order });
  say(I.S(`Moved to number ${j + 1}.`, `Movido al número ${j + 1}.`));
  const edge = (dir === "up" && j === 0) || (dir === "down" && j === order.length - 1);
  const other = dir === "up" ? "down" : "up";
  return ctx.rerender().then(() => focusEl(`[data-slx-move="${id}:${edge ? other : dir}"]`));
}

/** A tapped bar: "claim:<rowId>" picks it for the comparison (the last two stay); "evid:<stage>:<key>:<rowId>"
 * toggles it as evidence, the same saved list the table's checkboxes change. */
function tapBar(ctx, I, t, value) {
  const parts = value.split(":");
  const id = parts.at(-1);
  const n = dataRows(t.caseDef).findIndex((r) => r.id === id) + 1;
  const tf = parts[1] === "transfer" ? t.caseDef.transfer : null;
  const m = tf ? tf.dataset.rows.findIndex((r) => r.id === id) + 1 : n;
  if (parts[0] === "claim") {
    const list = recOf(t, "claim").compare || [];
    const on = list.includes(id);
    patchStage(t, "claim", { compare: on ? list.filter((x) => x !== id) : [...list, id].slice(-2) });
    say(on ? I.S(`Test ${m} taken out of the comparison.`, `Prueba ${m} quitada de la comparación.`) : I.S(`Test ${m} added to the comparison.`, `Prueba ${m} agregada a la comparación.`));
  } else {
    const [, stage, key] = parts;
    const list = recOf(t, stage)[key] || [];
    const on = list.includes(id);
    patchStage(t, stage, { [key]: on ? list.filter((x) => x !== id) : [...list, id] });
    say(on ? I.S(`Test ${m} is no longer chosen.`, `La prueba ${m} ya no está elegida.`) : I.S(`Test ${m} chosen as evidence.`, `Prueba ${m} elegida como evidencia.`));
  }
  return ctx.rerender().then(() => focusEl(`[data-slx-bar="${value}"]`));
}

/** Returns true when the click belonged to a scene part. `flush` saves typed text first. */
export function sceneClick(el, ctx, I, t, flush) {
  const d = el.dataset;
  if (!(d.slxLook || d.slxChip || d.slxUnchip || d.slxPick || d.slxSlot || d.slxMove || d.slxBar))
    return false;
  flush();
  if (d.slxBar) return (tapBar(ctx, I, t, d.slxBar), true);
  if (d.slxLook) lookAt(ctx, t, d.slxLook);
  else if (d.slxChip) chip(ctx, I, t, d.slxChip, true);
  else if (d.slxUnchip) chip(ctx, I, t, d.slxUnchip, false);
  else if (d.slxPick) pickCard(ctx, I, t, d.slxPick);
  else if (d.slxSlot) fillSlot(ctx, I, t, d.slxSlot);
  else if (d.slxMove) move(ctx, I, t, d.slxMove);
  return true;
}

// ── plan preview ─────────────────────────────────────────────────────────────
export function refreshPlanPreview(I, t, { announce = false } = {}) {
  const box = document.querySelector(".slx-builder-preview");
  if (!box) return;
  const trials = document.getElementById("slf-plan-trials")?.value ?? recOf(t, "plan").trials;
  box.innerHTML = toHtml(planPreviewHTML(I, t, recOf(t, "plan"), trials));
  if (announce) say(box.querySelector(".slx-cap")?.textContent || "");
}

// ── bar chart ────────────────────────────────────────────────────────────────
function chosenRows(t) {
  const picked = recOf(t, "represent").rows || [];
  const ran = recOf(t, "collect").rows || [];
  return dataRows(t.caseDef).filter((r) => picked.includes(r.id) && ran.includes(r.id));
}

function screenValues() {
  const out = {};
  for (const el of document.querySelectorAll("[data-sl-bar]"))
    if (el.value.trim() !== "") out[el.dataset.slBar] = Number(el.value);
  return out;
}

function redrawChart(I, t, values) {
  const wrap = document.querySelector("[data-slx-chart-wrap]");
  if (wrap) wrap.innerHTML = toHtml(barChartHTML(I, t.caseDef, chosenRows(t), { values }));
}

/** While typing: the bar follows the number on screen (nothing is saved until the field changes). */
export function barInput(el, I, t) {
  if (!el.matches?.("[data-sl-bar]")) return false;
  redrawChart(I, t, screenValues());
  return true;
}

/** On change: snap close numbers to the table, save, redraw, and say what the bar shows as a question if it differs. */
export function barChange(el, I, t) {
  if (!el.matches?.("[data-sl-bar]")) return false;
  const rows = chosenRows(t);
  const row = rows.find((r) => r.id === el.dataset.slBar);
  if (!row) return true;
  const bars = { ...(recOf(t, "represent").bars || {}) };
  const v = el.value.trim() === "" ? null : snapValue(t.caseDef, rows, row, el.value);
  if (v === null) delete bars[row.id];
  else bars[row.id] = v;
  el.value = v ?? "";
  patchStage(t, "represent", { bars });
  redrawChart(I, t, screenValues());
  const n = dataRows(t.caseDef).findIndex((r) => r.id === row.id) + 1;
  const note = barNote(I, t.caseDef, row, n, v);
  const out = document.querySelector(`[data-slx-note="${row.id}"]`);
  if (out) {
    out.textContent = note.text;
    out.className = `slx-bar-note is-${note.kind}`;
  }
  say(note.text);
  return true;
}


// ── live mirrors (typing updates a picture; nothing is saved here) ───────────
export function liveMirror(el, I, t) {
  if (el.id === "slf-reasoning-text") mirrorReason(I, el);
  else if (el.id === "slf-revise-after") {
    const box = document.querySelector("[data-slx-diff]");
    const target = recOf(t, "revise").target || "claim";
    if (box) box.innerHTML = toHtml(diffHTML(I, workOf(csOf(t), target).text, el.value));
  }
}
