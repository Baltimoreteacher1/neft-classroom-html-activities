/* Small shared UI pieces: buttons and links with bilingual labels, the stop header and the previous/next bar. */
import { icon, scene } from "./art.js";
import { COPY, STOPS } from "./copy.js";
import { h } from "./core.js";
import { supported } from "./tts.js";

/** A button (or a link when `href` is given) with a bilingual label and an optional icon. */
export function btn(K, pair, { href, onClick, cls = "", ico, rel, data } = {}) {
  const el = href
    ? h("a", { class: `btn ${cls}`.trim(), href, rel })
    : h("button", { type: "button", class: `btn ${cls}`.trim(), data });
  if (ico) el.append(icon(ico, "btn-ico"));
  el.append(K.bi("span", pair, "btn-label"));
  if (onClick) el.addEventListener("click", onClick);
  return el;
}

export const section = (K, title, ...kids) =>
  h("section", { class: "block" }, title ? K.bi("h2", title, "block-title") : null, ...kids);

/** The illustrated header of a stop: scene, number, title, one-line lead and the Listen button. */
export function stopHeader(ctx, i) {
  const { K } = ctx;
  const stop = STOPS[i];
  const head = h("header", { class: `stop-head stop-head-${stop.id}` });
  head.append(scene(stop.id));
  const text = h("div", { class: "stop-head-text" });
  text.append(h("p", { class: "stop-kicker" }, K.plain(COPY.stopOf(i + 1, STOPS.length))));
  const title = K.bi("h1", stop.title, "stop-title");
  title.id = "stop-title";
  title.tabIndex = -1;
  title.dataset.narrate = "";
  const lead = K.bi("p", stop.lead, "stop-lead");
  lead.dataset.narrate = "";
  text.append(title, lead);
  if (supported()) {
    const on = ctx.isListening();
    const b = h(
      "button",
      { type: "button", class: "listen", "aria-pressed": String(on) },
      K.plain(on ? COPY.stopListen : COPY.listen),
    );
    b.prepend(icon("speaker", "btn-ico"));
    b.addEventListener("click", () => ctx.toggleListen());
    text.append(b);
  }
  head.append(text);
  return head;
}

/** Back / skip / next at the foot of a stop. */
export function stopNav(ctx, i, { nextPair = COPY.next, canNext = true } = {}) {
  const { K } = ctx;
  const nav = h("nav", {
    class: "stop-nav",
    "aria-label": K.plain(COPY.stopOf(i + 1, STOPS.length)),
  });
  const left = h("div", { class: "stop-nav-left" });
  if (i > 0)
    left.append(btn(K, COPY.back, { cls: "btn-quiet", ico: "back", onClick: () => ctx.go(i - 1) }));
  left.append(
    btn(
      K,
      i < STOPS.length - 1 ? COPY.skipStop : COPY.mapTitle,
      { cls: "btn-quiet", onClick: () => (i < STOPS.length - 1 ? ctx.go(i + 1) : ctx.toMap()) },
    ),
  );
  const right = h("div", { class: "stop-nav-right" });
  if (i < STOPS.length - 1) {
    const next = btn(K, nextPair, {
      cls: `btn-primary${canNext ? "" : " is-soft"}`,
      ico: "arrow",
      onClick: () => ctx.finish(i),
    });
    right.append(next);
  }
  nav.append(left, right);
  return nav;
}

export const card = (cls, ...kids) => h("div", { class: `card ${cls || ""}`.trim() }, ...kids);
