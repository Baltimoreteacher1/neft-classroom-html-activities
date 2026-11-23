// Word wall rendering: grid tiles and the one-word-at-a-time gallery. Stateless; wall.js owns the state.
import { h } from "../../core/dom.js";
import { altBlock, visualSvg } from "./visual.js";
import { spanishFor } from "./model.js";
import { chip, reviewBadge, speakButton } from "./ui.js";

const stageHint = (wall, id) => {
  const s = wall.stage(id);
  if (s >= wall.max) return "Press to hide the definition.";
  return wall.mode === "image" && s === 0 ? "Press to show the word." : "Press to show the definition.";
};

/** Accessible name of a tile: the picture until the word is revealed, then the word. */
const tileLabel = (wall, e) => `${wall.showWord(e.id) ? e.word : e.visual ? `Picture: ${e.visual.alt}` : "Hidden word"}. ${stageHint(wall, e.id)}`;

function pictureArea(e, big = false) {
  if (!e.visual) return h("div", { class: "st-v-tile-nopic" }, h("span", {}, e.noVisualReason ? "Word without a picture" : ""));
  return h("div", { class: `st-v-tile-art${big ? " st-v-tile-art-big" : ""}`, html: visualSvg(e.visual) });
}

function textArea(e, ctx, { big = false } = {}) {
  const { wall, lang, student } = ctx;
  const es = lang === "bi" ? spanishFor(e, { student }) : null;
  const box = h("div", { class: `st-v-tile-text${big ? " st-v-tile-text-big" : ""}` });
  if (wall.showWord(e.id)) {
    box.append(h(big ? "h2" : "h3", { class: "st-v-tile-word" }, e.word));
    if (es) box.append(h("p", { class: "st-v-tile-es", lang: "es" }, es.word, ctx.student ? null : es.verified === true ? null : reviewBadge()));
    if (big && e.pron) box.append(h("p", { class: "st-v-pron-guide" }, e.pron));
  }
  if (wall.showDefinition(e.id)) {
    box.append(h("p", { class: "st-v-tile-def" }, e.def));
    if (es?.def) box.append(h("p", { class: "st-v-tile-es-def", lang: "es" }, es.def));
    if (big) box.append(h("p", { class: "st-v-tile-ctx" }, e.context));
  }
  return box;
}

function tile(e, ctx) {
  const { wall } = ctx;
  const main = h(
    "button",
    { class: "st-v-tile-main", type: "button", "data-eid": e.id, "aria-pressed": String(wall.stage(e.id) > 0), "aria-label": tileLabel(wall, e) },
    pictureArea(e),
    textArea(e, ctx),
  );
  main.addEventListener("click", () => ctx.onReveal(e.id));
  const art = h("article", { class: `st-v-tile${ctx.readingId === e.id ? " st-v-reading" : ""}`, "data-eid": e.id });
  art.append(main);
  const foot = h("div", { class: "st-v-tile-foot" });
  if (wall.showWord(e.id)) foot.append(speakButton(e.word, { label: `Hear ${e.word}`, cls: "st-v-say" }));
  art.append(foot);
  if (e.visual) art.append(altBlock(e.visual, ctx.showAlt));
  return art;
}

export function renderGrid(stage, entries, ctx) {
  stage.className = "st-v-stage st-v-grid-view";
  stage.replaceChildren(h("div", { class: "st-v-tiles", role: "group", "aria-label": "Word wall" }, entries.map((e) => tile(e, ctx))));
}

export function renderGallery(stage, entries, ctx) {
  stage.className = "st-v-stage st-v-gallery-view";
  const { wall } = ctx;
  const e = entries.find((x) => x.id === wall.current) || entries[0];
  if (!e) return stage.replaceChildren(h("p", {}, "No words match these filters."));
  const pos = entries.indexOf(e);
  const main = h(
    "div",
    { class: "st-v-gal-main", tabindex: "0", "data-eid": e.id, role: "group", "aria-label": `Word ${pos + 1} of ${entries.length}. Press space to reveal.` },
    pictureArea(e, true),
    textArea(e, ctx, { big: true }),
  );
  const reveal = h("button", { class: "st-v-btn st-v-primary st-v-reveal", type: "button" }, wall.stage(e.id) >= wall.max ? "Hide" : wall.mode === "image" && wall.stage(e.id) === 0 ? "Show the word" : "Show the definition");
  reveal.addEventListener("click", () => ctx.onReveal(e.id));
  const nav = h(
    "div",
    { class: "st-v-gal-nav" },
    h("button", { class: "st-v-btn st-v-prev", type: "button", onclick: () => ctx.onMove(-1) }, "Previous"),
    h("span", { class: "st-v-gal-count", "aria-hidden": "true" }, `${pos + 1} of ${entries.length}`),
    reveal,
    wall.showWord(e.id) ? speakButton(e.word, { label: `Hear ${e.word}`, cls: "st-v-say" }) : null,
    h("button", { class: "st-v-btn st-v-next", type: "button", onclick: () => ctx.onMove(1) }, "Next"),
  );
  const strip = h(
    "div",
    { class: "st-v-strip", role: "group", "aria-label": "Jump to a word" },
    entries.map((x, i) => {
      const b = h("button", { class: "st-v-strip-btn", type: "button", "aria-current": x.id === e.id ? "true" : null, "aria-label": wall.showWord(x.id) ? x.word : `Word ${i + 1}`, "data-eid": x.id }, x.visual ? h("span", { html: visualSvg(x.visual), "aria-hidden": "true" }) : String(i + 1));
      b.addEventListener("click", () => ctx.onJump(i));
      return b;
    }),
  );
  stage.replaceChildren(h("div", { class: "st-v-gallery" }, main, e.visual ? altBlock(e.visual, ctx.showAlt) : null, nav, strip));
  stage.querySelector(".st-v-gal-main")?.setAttribute("data-stage", String(wall.stage(e.id)));
  return e;
}

export const metaChips = (e) => [e.tier ? chip(`Tier ${e.tier}`) : null, e.pos ? chip(e.pos) : null];
