// Two stepper-driven screens: choosing a square tile (GCF / LCM) and building a rectangle from algebra tiles.
// @fm2 FM-011 FM-058 FM-059 FM-038 FM-039 FM-021
import { tilesSvg, tilingSvg } from "../../art/grids.js";
import { polyMul, polyText } from "./poly.js";
import { clamp, esc, intOf, keepFocus, selectInput, stepperHtml, u } from "./ui-kit.js";

const TILE_STEPS = [
  {
    id: "w1",
    group: "w",
    power: 1,
    label: "wX",
    name: { en: "width x-tiles", es: "fichas de x del ancho" },
  },
  {
    id: "w0",
    group: "w",
    power: 0,
    label: "wOne",
    name: { en: "width 1-tiles", es: "fichas de 1 del ancho" },
  },
  {
    id: "h1",
    group: "h",
    power: 1,
    label: "hX",
    name: { en: "height x-tiles", es: "fichas de x del alto" },
  },
  {
    id: "h0",
    group: "h",
    power: 0,
    label: "hOne",
    name: { en: "height 1-tiles", es: "fichas de 1 del alto" },
  },
];
const MAX_X = 3;
const MAX_ONES = 12;

export function mountTiles(root, ctx) {
  const { round } = ctx;
  const task = round.task;
  const tiling = round.kind === "tiling";
  let lang = ctx.lang;
  const state = { s: 1, w: [0, 0], h: [0, 0] };
  const maxSide = task.mode === "gcf" ? Math.min(task.a, task.b) : task.a * task.b;

  function tilingHtml() {
    const { mode, a, b } = task;
    const s = state.s;
    const [wUnits, hUnits, tw, th] = mode === "gcf" ? [a, b, s, s] : [s, s, a, b];
    const an = Math.floor(wUnits / tw);
    const ar = wUnits % tw;
    const dn = Math.floor(hUnits / th);
    const dr = hUnits % th;
    const info = ar || dr ? u("roTiling", lang, { an, ar, dn, dr }) : u("exact", lang);
    const label = u(mode === "gcf" ? "sideTile" : "sideSquare", lang);
    const caption = mode === "gcf" ? `${s} × ${s}` : `${s} × ${s}`;
    return `<p class="aa-readout">${esc(info)}</p>
      <div class="aa-field aa-modelfig">${tilingSvg({ mode, a, b, s, caption })}</div>
      <div class="aa-controls">${stepperHtml({ id: "s", label, value: s, down: u("lessSide", lang), up: u("moreSide", lang) })}</div>`;
  }

  function tilesHtml() {
    const used = polyMul(state.w, state.h);
    const want = task.target;
    const steppers = TILE_STEPS.map((st) => {
      const name = st.name[lang] ?? st.name.en;
      return stepperHtml({
        id: st.id,
        label: u(st.label, lang),
        value: state[st.group][st.power],
        down: u("fewerOf", lang, { name }),
        up: u("moreOf", lang, { name }),
      });
    }).join("");
    const text = u("roTiles", lang, {
      w: polyText(state.w),
      h: polyText(state.h),
      x2: used[2],
      x: used[1],
      ones: used[0],
    });
    return `<p class="aa-readout">${esc(text)}</p>
      <p class="aa-small aa-pool">${esc(u("pool", lang, { x2: want[2], x: want[1], ones: want[0] }))}</p>
      <div class="aa-field aa-modelfig">${tilesSvg(state.w, state.h, { widthText: polyText(state.w) === "0" ? "" : polyText(state.w), heightText: polyText(state.h) === "0" ? "" : polyText(state.h), caption: `${polyText(state.w)} × ${polyText(state.h)}` })}</div>
      <div class="aa-controls aa-tilesteps">${steppers}</div>`;
  }

  const html =
    () => `<div class="aa-board${ctx.locked() ? " aa-locked" : ""}" data-kind="${round.kind}">${tiling ? tilingHtml() : tilesHtml()}
    <p class="aa-note" role="status"></p>
    <div class="aa-actions"><button type="button" class="fm2-btn" data-act="clear" data-focus="clear">${esc(u("clear", lang))}</button><button type="button" class="fm2-btn fm2-btn-primary" data-act="check" data-focus="check">${esc(u("check", lang))}</button></div></div>`;
  const render = () =>
    keepFocus(root, () => {
      root.innerHTML = html();
    });

  function commit(id, value) {
    if (value === null) return render();
    if (id === "s") {
      state.s = clamp(value, 1, maxSide);
      render();
      return ctx.announce(`${state.s}`);
    }
    const st = TILE_STEPS.find((t) => t.id === id);
    state[st.group][st.power] = clamp(value, 0, st.power ? MAX_X : MAX_ONES);
    render();
    const used = polyMul(state.w, state.h);
    ctx.announce(
      u("roTiles", lang, {
        w: polyText(state.w),
        h: polyText(state.h),
        x2: used[2],
        x: used[1],
        ones: used[0],
      }),
    );
  }

  function current(id) {
    if (id === "s") return state.s;
    const st = TILE_STEPS.find((t) => t.id === id);
    return state[st.group][st.power];
  }

  function onClick(event) {
    const button = event.target.closest("[data-act]");
    if (!button || ctx.locked()) return;
    const { act, id } = button.dataset;
    if (act === "inc" || act === "dec") commit(id, current(id) + (act === "inc" ? 1 : -1));
    else if (act === "clear") {
      Object.assign(state, { s: 1, w: [0, 0], h: [0, 0] });
      render();
      ctx.announce(u("cleared", lang));
    } else if (act === "check")
      ctx.submit(tiling ? { s: state.s } : { w: [...state.w], h: [...state.h] });
  }

  function onChange(event) {
    const input = event.target.closest(".aa-step-input");
    if (input && !ctx.locked()) commit(input.dataset.id, intOf(input.value));
  }

  const listeners = [
    ["click", onClick],
    ["change", onChange],
    ["focusin", selectInput],
  ];
  for (const [name, fn] of listeners) root.addEventListener(name, fn);
  render();
  ctx.onLock?.(render);
  return {
    destroy() {
      for (const [name, fn] of listeners) root.removeEventListener(name, fn);
    },
    setLang(next) {
      lang = next;
      render();
    },
  };
}
