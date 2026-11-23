// ui.js — the Skyline Runner's DOM outside the canvas: the control panel (touch buttons, Go to next gate, Auto-walk,
// Grapple Save, a "where am I?" description), the chapter picker, the fall and level cards, and the canvas' text
// alternative. Everything the canvas shows can be read, and every movement can be made, from here.
import { html, raw, toHtml } from "../../util.js";
import { STR, fmt } from "./strings.js";
import { THEMES, themeOf } from "./art-bg.js";
import { CHAPTER_COUNT, levelId } from "./levels.js";

export function makeText(I) {
  const S = (k, v) => fmt(I.S(...STR[k]), v);
  const T = (k, v) => (v ? I.T(fmt(STR[k][0], v), fmt(STR[k][1], v)) : I.T(...STR[k]));
  const chapterName = (n, plain = true) => (plain ? I.S(...themeOf(n).name) : I.T(...themeOf(n).name));
  return { S, T, chapterName };
}

const ARROW = {
  left: '<path d="M14 5 7 12l7 7"/>',
  right: '<path d="m10 5 7 7-7 7"/>',
  jump: '<path d="M12 19V6M6 12l6-6 6 6"/>',
};
const svg = (n) => raw(`<svg class="ax-od-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ARROW[n]}</svg>`);

/** The control panel under the canvas. Hold buttons carry data-act (InputManager.bindButtons); the rest carry data-od. */
export function panelHTML(t, { auto = false, walking = false, grapples = 0 } = {}) {
  const hold = (act) => html`<button type="button" class="ax-od-hold ax-od-hold-${act}" data-act="${act}" aria-label="${t.S(act)}">${svg(act)}<span>${t.T(act)}</span></button>`;
  return toHtml(html`<div class="ax-od-panel" role="group" aria-label="${t.S("controls")}">
    <div class="ax-od-pad">${hold("left")}${hold("right")}${hold("jump")}</div>
    <div class="ax-od-tools">
      <button type="button" class="ax-btn ax-btn-primary ax-od-go" data-od="go" aria-pressed="${walking}"><span data-lab="go" ${walking ? "hidden" : ""}>${t.T("go")}</span><span data-lab="stop" ${walking ? "" : "hidden"}>${t.T("stop")}</span> <span class="ax-kbd">N</span></button>
      <button type="button" class="ax-btn" data-od="auto" aria-pressed="${auto}">${t.T("auto")} <span class="ax-kbd">T</span></button>
      <button type="button" class="ax-btn" data-od="grapple" ${grapples ? "" : "hidden"}>${t.T("grapple")} ×<b data-od-grapples>${grapples}</b> <span class="ax-kbd">G</span></button>
      <button type="button" class="ax-btn" data-od="where">${t.T("whereAmI")}</button>
      <button type="button" class="ax-btn ax-btn-quiet" data-od="end"><span data-lab="end">${t.T("endRun")}</span><span data-lab="confirm" hidden>${t.T("endConfirm")}</span></button>
    </div>
    <p class="ax-od-where" data-od-where role="status"></p>
    <p class="ax-fine ax-od-keys">${t.T("keys")}</p>
  </div>`);
}

export function pickerHTML(t, { recommended, done, auto, looks, look }) {
  const chap = (n) => {
    const fin = done.has(levelId(n, 3));
    return html`<button type="button" class="ax-od-chap ax-od-chap-${n}${n === recommended ? " is-rec" : ""}" data-od-pick="${n}">
      <span class="ax-od-chap-name">${t.chapterName(n, false)}</span>
      <span class="ax-od-chap-meta">${t.T("levels3")}${fin ? html` · <b>${t.T("finished")}</b>` : n === recommended ? html` · <b>${t.T("recommended")}</b>` : ""}</span>
      <span class="ax-od-chap-go">${t.T("begin")}</span></button>`;
  };
  const opts = looks.map((id) => html`<option value="${id}" ${id === look ? "selected" : ""}>${t.S(`look_${id}`)}</option>`);
  return toHtml(html`<div class="ax-od-card ax-od-pick" role="region" aria-labelledby="ax-od-pick-t">
    <h2 id="ax-od-pick-t" tabindex="-1">${t.T("pickTitle")}</h2>
    <p>${t.T("pickHelp")}</p>
    <div class="ax-od-chaps">${Array.from({ length: CHAPTER_COUNT }, (_, i) => chap(i + 1))}</div>
    <label class="ax-od-opt"><input type="checkbox" data-od-auto ${auto ? "checked" : ""}> <span>${t.T("autoLabel")}</span></label>
    <p class="ax-fine">${t.T("autoHelp")}</p>
    ${looks.length > 1 ? html`<label class="ax-od-opt">${t.T("lookLabel")} <select data-od-look>${opts}</select></label>` : ""}
  </div>`);
}

/** A small card over the canvas. `actions`: [{ od, label, primary }]. */
export function cardHTML(t, { id, title, lines = [], actions = [] }) {
  return toHtml(html`<div class="ax-od-card" role="alertdialog" aria-labelledby="ax-od-${id}-t" aria-describedby="ax-od-${id}-d">
    <h2 id="ax-od-${id}-t" tabindex="-1">${title}</h2>
    <div id="ax-od-${id}-d">${lines.map((l) => html`<p>${l}</p>`)}</div>
    <div class="ax-od-actions">${actions.map((a) => html`<button type="button" class="ax-btn ${a.primary ? "ax-btn-primary" : ""}" data-od="${a.od}">${a.label}</button>`)}</div>
  </div>`);
}

/** The route and surroundings in words: the canvas' text alternative and the "Where am I?" button. */
export function describeWorld(t, st, { auto = false } = {}) {
  const parts = [t.S(st.airborne ? "descAir" : "descIsland", { i: st.index, n: st.count })];
  if (st.gap > 0) {
    parts.push(t.S("descGap", { g: st.gap }));
    if (st.rise > 0) parts.push(t.S("descUp", { r: st.rise }));
    if (st.rise < 0) parts.push(t.S("descDown", { r: -st.rise }));
  } else parts.push(t.S("descFlat"));
  if (st.mover) parts.push(t.S("descMover"));
  parts.push(t.S("descShards", { n: st.shardsLeft }));
  parts.push(t.S(st.gatesLeft ? "descGate" : "descExit"));
  if (st.checkpoint) parts.push(t.S("aCheck"));
  if (auto) parts.push(t.S("descAuto"));
  return parts.join(" ");
}

export const chapterNames = () => Object.values(THEMES).map((x) => x.name);
