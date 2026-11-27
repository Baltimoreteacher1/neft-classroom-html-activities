// The `animation` block: an explanation played as a few calm still frames. x/animations.js expands the block's preset
// and values into frames (a figure and a plain caption each); this file only plays them. Nothing moves on its own:
// the student presses Play, Pause, Step or Replay, and a played animation stops at the last frame (no loop).
// Frames change with a CSS cross-fade (animation.css); `prefers-reduced-motion` and Calm mode remove the fade AND
// the Play button, leaving step-by-step. Every frame's words are also a plain numbered list under the figure.
// The SVG is parsed as XML and imported, never assigned with innerHTML, and anything that is not plain drawing
// (script, foreignObject, event attributes) is refused.

import { expandAnimation } from "../x/animations.js";
import { h, nid, rt } from "./util.js";

const ANIM_PACE_MS = 3500;
const ANIM_SVG_MIME = "image/svg+xml";
const ANIM_UNSAFE = /^(script|foreignobject|iframe|object|embed|a)$/i;

/** An SVG element for generated markup, or null when it does not parse or holds anything but drawing. */
function animSvg(markup) {
  const doc = new DOMParser().parseFromString(markup, ANIM_SVG_MIME);
  const root = doc.documentElement;
  if (!root || root.localName !== "svg" || doc.querySelector("parsererror")) return null;
  const unsafe = [root, ...root.querySelectorAll("*")].some(
    (el) =>
      ANIM_UNSAFE.test(el.localName) ||
      [...el.attributes].some((a) => /^on/i.test(a.name) || /^(href|xlink:href)$/i.test(a.name)),
  );
  return unsafe ? null : document.importNode(root, true);
}

const animSize = (markup) => {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(markup);
  return m ? [Number(m[1]), Number(m[2])] : [480, 300];
};

/** A caption {en, es} as nodes for the current language ("bi" shows both). */
function animWords(caption, lang) {
  if (lang === "en") return [caption.en];
  if (lang === "es") return [h("span", { lang: "es" }, caption.es)];
  return [caption.en, " ", h("span", { class: "sp-es", lang: "es" }, caption.es)];
}

/** The teacher's explanation, in the student's language; a missing Spanish half falls back to the English text. */
function animExplanation(b, lang) {
  const { en = "", es = "" } = b.explanation ?? {};
  if (lang === "bi" && en && es && en !== es)
    return [rt("p", "sp-anim-explain", en), rt("p", "sp-anim-explain sp-es", es, { lang: "es" })];
  const text = lang === "es" ? es || en : en || es;
  const attrs = lang === "es" && !es ? { lang: "en" } : lang === "en" && !en ? { lang: "es" } : undefined;
  return text ? [rt("p", "sp-anim-explain", text, attrs)] : [];
}

/** Registered in blocks.js. */
export function animationBlock(b, ctx) {
  const lang = ctx.lang === "es" ? "es" : "en";
  const made = expandAnimation(b, { lang, suffix: b.id });
  const art = made.ok ? made.frames.map((f) => animSvg(f.svg)) : [];
  if (!made.ok || art.some((a) => !a))
    return h("p", { class: "sp-note-small", role: "note" }, ctx.msg("animMissing"));
  const frames = made.frames.map((f, i) => ({ ...f, art: art[i] }));
  for (const f of frames) {
    f.art.removeAttribute("width");
    f.art.removeAttribute("height");
  }
  const sizes = made.frames.map((f) => animSize(f.svg));
  const last = frames.length - 1;
  let at = 0;
  let timer = 0;
  let playing = false;

  const titleId = nid("anim");
  const stage = h("div", { class: "sp-anim-art", role: "group", "aria-label": made.alt });
  stage.style.aspectRatio = `${Math.max(...sizes.map((s) => s[0]))} / ${Math.max(...sizes.map((s) => s[1]))}`;
  const caption = h("p", { class: "sp-anim-caption", role: "status", "aria-live": "polite", "aria-atomic": "true" });
  const count = h("span", { class: "sp-anim-count" });
  const btn = (key, cls, onclick) => {
    const b2 = h("button", { type: "button", class: `sp-btn sp-anim-btn ${cls}` }, ctx.msg(key));
    b2.addEventListener("click", onclick);
    return b2;
  };
  const replay = btn("animReplay", "", () => {
    stop();
    show(0);
    if (motionOk()) play();
  });
  const back = btn("animBack", "", () => step(-1));
  const toggle = btn("animPlay", "sp-btn-primary sp-anim-motion", () => (playing ? pause() : play()));
  const next = btn("animNext", "", () => step(1));
  const controls = h(
    "div",
    { class: "sp-anim-controls", role: "group", "aria-label": ctx.t("animControls") },
    replay,
    back,
    toggle,
    next,
    count,
  );

  const motionOk = () =>
    !(ctx.state?.calm || ctx.root?.classList.contains("sp-calm")) &&
    !globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function show(i, fade = false) {
    at = Math.min(Math.max(i, 0), last);
    const f = frames[at];
    stage.replaceChildren(f.art);
    if (fade && motionOk()) {
      f.art.classList.add("is-new");
      f.art.getBoundingClientRect(); // commit the start state so the CSS transition runs
      f.art.classList.remove("is-new");
    }
    caption.replaceChildren(...animWords(f.caption, ctx.lang));
    count.replaceChildren(ctx.msg("animStep", { n: at + 1, total: frames.length }));
    const held = [back, next].find((b2) => b2 === document.activeElement);
    back.disabled = at === 0;
    next.disabled = at === last;
    if (held?.disabled) replay.focus(); // a button that just switched off must not strand keyboard focus
    sync();
  }
  function sync() {
    toggle.replaceChildren(ctx.msg(playing ? "animPause" : "animPlay"));
  }
  function stop() {
    clearTimeout(timer);
    timer = 0;
    playing = false;
  }
  function tick() {
    timer = 0;
    if (!playing || !root.isConnected || !motionOk()) {
      stop();
      sync();
      return;
    }
    show(at + 1, true);
    if (at < last) timer = setTimeout(tick, ANIM_PACE_MS);
    else stop();
    sync();
  }
  function play() {
    if (!motionOk()) return;
    if (at === last) show(0);
    playing = true;
    sync();
    timer = setTimeout(tick, ANIM_PACE_MS);
  }
  function pause() {
    stop();
    sync();
  }
  function step(d) {
    stop();
    show(at + d, true);
  }

  const list = h(
    "ol",
    { class: "sp-anim-list" },
    frames.map((f) => h("li", null, animWords(f.caption, ctx.lang))),
  );
  const listBody = [list];
  if (made.table) {
    const t = h("table", { class: "sp-table" });
    t.append(
      h("thead", null, h("tr", null, ...made.table.headers.map((x) => h("th", { scope: "col" }, x)))),
      h("tbody", null, ...made.table.rows.map((r) => h("tr", null, ...r.map((c) => h("td", null, c))))),
    );
    listBody.push(h("div", { class: "sp-table-wrap", tabindex: "0", role: "region", "aria-label": made.title }, t));
  }
  const root = h(
    "section",
    { class: "sp-anim", "aria-labelledby": titleId },
    rt("h3", "sp-anim-title", made.title, { id: titleId }),
    animExplanation(b, ctx.lang),
    stage,
    caption,
    controls,
    h("details", { class: "sp-anim-steps" }, h("summary", null, ctx.msg("animSteps")), ...listBody),
  );
  show(0);
  return root;
}
