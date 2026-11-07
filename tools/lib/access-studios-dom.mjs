// JSDOM harness for the publishing studios (Word Lab, Real-Life Scenarios, Newsroom): browser globals, a render ctx and
// helpers to click and type the way main.js would deliver events. Import before any view module.
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body><main id=app></main></body></html>", {
  url: "https://thelanguagepage.com/access-practice-lab/",
});
for (const k of [
  "window",
  "document",
  "location",
  "localStorage",
  "sessionStorage",
  "navigator",
  "HTMLElement",
  "Node",
  "CSS",
  "MutationObserver",
  "Event",
  "Blob",
]) {
  Object.defineProperty(globalThis, k, {
    value: dom.window[k],
    configurable: true,
    writable: true,
  });
}
export const win = dom.window;
export const resetStorage = () => dom.window.localStorage.clear();
export const { toHtml } = await import("../../access-practice-lab/src/util.js");

export function makeCtx(view, { lang = "en", band = "6-8", id = "", sub = "", tab = "" } = {}) {
  const ctx = {
    band,
    prefs: { lang, rate: 0.9 },
    route: { view, id, sub, tab },
    rendered: 0,
    rerender() {
      ctx.rendered += 1;
    },
  };
  return ctx;
}
/** Renders a view into #app and returns { out, root, text }. */
export async function mount(mod, ctx) {
  const out = await mod.render(ctx);
  const root = document.getElementById("app");
  root.innerHTML = toHtml(out.html);
  mod.mount?.(root, ctx);
  return { out, root, text: root.textContent };
}
/** A click event on the first element matching `sel`, handed to the view's onClick. */
export function click(mod, ctx, root, sel) {
  const el = typeof sel === "string" ? root.querySelector(sel) : sel;
  if (!el) throw new Error(`no element for ${sel}`);
  const e = new dom.window.Event("click", { bubbles: true });
  Object.defineProperty(e, "target", { value: el });
  return mod.onClick(e, ctx);
}
export function type(mod, ctx, root, sel, value, kind = "onChange") {
  const el = root.querySelector(sel);
  if (!el) throw new Error(`no element for ${sel}`);
  el.value = value;
  const e = new dom.window.Event(kind === "onInput" ? "input" : "change", { bubbles: true });
  Object.defineProperty(e, "target", { value: el });
  return mod[kind]?.(e, ctx);
}
export const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
export const COUNTDOWN =
  /\b(countdown|hurry|time is up|beat the clock|words per minute|seconds left)\b/i;
