// Content blocks that are not questions: text, passage, vocabulary, image, math, table, organizer, audio.
// Teacher-only note blocks are never rendered.

import { safeImageSrc } from "../core/schema.js";
import { hearButton } from "./hear.js";
import { icon } from "./icons.js";
import { h, nid, paragraphs, plainText, rich, rt } from "./util.js";

/** Passage text cut into short readable parts of about two sentences. */
export function chunksOf(text) {
  const sentences = paragraphs(text).flatMap((p) => p.split(/(?<=[.!?])\s+/));
  const out = [];
  let cur = "";
  for (const s of sentences) {
    cur = cur ? `${cur} ${s}` : s;
    if (cur.length >= 120) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out.length ? out : [""];
}

function textBlock(b, ctx) {
  if (b.role === "heading") return rt("h3", "sp-heading", b.text);
  const box = h("div", { class: `sp-text sp-text-${b.role}` });
  if (b.role === "directions") box.append(h("span", { class: "sp-tag" }, icon("flag", 16), ctx.t("directions")));
  for (const p of paragraphs(b.text)) box.append(rt("p", "", p));
  if (ctx.supports.readAloud) box.append(hearButton(ctx, b.text, ctx.t("hearThis")));
  return box;
}

function passageBlock(b, ctx) {
  const box = h("div", { class: "sp-passage" });
  const title = b.title ? rt("h3", "sp-passage-title", b.title) : null;
  const body = h("div", { class: "sp-passage-body", id: nid("pas") });
  if (title) box.append(title);
  box.append(body);
  const parts = ctx.supports.chunk ? chunksOf(b.text) : null;
  if (!parts || parts.length < 2) {
    for (const p of paragraphs(b.text)) body.append(rt("p", "", p));
  } else {
    let at = 0;
    const status = h("span", { class: "sp-chunk-n", "aria-live": "polite" });
    const back = h("button", { type: "button", class: "sp-btn sp-btn-quiet" }, ctx.L("back"));
    const next = h("button", { type: "button", class: "sp-btn sp-btn-quiet" }, ctx.L("nextPart"));
    const all = h("button", { type: "button", class: "sp-btn sp-btn-quiet" }, ctx.L("showAll"));
    const paint = (showAll) => {
      body.replaceChildren();
      const shown = showAll ? parts : parts.slice(0, at + 1);
      shown.forEach((p, i) => body.append(rt("p", i === at && !showAll ? "sp-chunk-now" : "", p)));
      status.textContent = showAll ? "" : ctx.t("part", { n: at + 1, total: parts.length });
      back.disabled = showAll || at === 0;
      next.disabled = showAll || at === parts.length - 1;
      all.hidden = showAll;
    };
    back.addEventListener("click", () => {
      at = Math.max(0, at - 1);
      paint(false);
    });
    next.addEventListener("click", () => {
      at = Math.min(parts.length - 1, at + 1);
      paint(false);
    });
    all.addEventListener("click", () => paint(true));
    box.append(h("div", { class: "sp-chunk-bar" }, back, status, next, all));
    paint(false);
  }
  if (ctx.supports.readAloud) box.append(hearButton(ctx, b.text, ctx.t("hearThis")));
  return box;
}

function vocabBlock(b, ctx) {
  const list = h("ul", { class: "sp-vocab" });
  for (const v of b.items) {
    const li = h("li", { class: "sp-vocab-item" });
    const head = h("div", { class: "sp-vocab-head" }, rt("strong", "sp-term", v.term));
    if (v.es && ctx.showGloss())
      head.append(
        h("span", { class: "sp-gloss", lang: "es" }, h("span", { class: "sp-sr" }, ctx.t("inSpanish")), v.es),
      );
    li.append(head);
    if (v.def) li.append(rt("p", "sp-def", v.def));
    if (v.example) li.append(rt("p", "sp-example", v.example));
    const src = v.image ? safeImageSrc(v.image.src) : "";
    if (src) li.append(h("img", { src, alt: v.image.decorative ? "" : v.image.alt, class: "sp-vocab-img" }));
    if (ctx.supports.readAloud)
      li.append(hearButton(ctx, `${v.term}. ${v.def}`, ctx.t("hearWord", { word: plainText(v.term) })));
    list.append(li);
  }
  return h("div", { class: "sp-vocab-wrap" }, rt("h3", "sp-heading", ctx.t("words")), list);
}

function imageBlock(b) {
  const src = safeImageSrc(b.src);
  if (!src) return null;
  const fig = h("figure", { class: "sp-figure" }, h("img", { src, alt: b.decorative ? "" : b.alt }));
  if (b.caption) fig.append(rt("figcaption", "", b.caption));
  return fig;
}

function mathBlock(b) {
  const box = h("figure", { class: "sp-mathblock" }, rt("div", "sp-mathline", b.text));
  if (b.caption) box.append(rt("figcaption", "", b.caption));
  return box;
}

function tableBlock(b, ctx) {
  const table = h("table", { class: "sp-table" });
  if (b.caption) table.append(rt("caption", "", b.caption));
  if (b.headers.length)
    table.append(h("thead", null, h("tr", null, ...b.headers.map((x) => rich(h("th", { scope: "col" }), x)))));
  table.append(h("tbody", null, ...b.rows.map((r) => h("tr", null, ...r.map((c) => rich(h("td"), c))))));
  return h("div", { class: "sp-table-wrap", tabindex: "0", role: "region", "aria-label": plainText(b.caption) || ctx.t("table") }, table);
}

const ORGANIZER = {
  kwl: ["organizerKnow", "organizerWant", "organizerLearned"],
  compare: ["organizerSame", "organizerDifferent"],
  "cause-effect": ["organizerCause", "organizerEffect"],
  "claim-evidence": ["organizerClaim", "organizerEvidence", "organizerReasoning"],
  web: [],
  sequence: [],
};

function organizerBlock(b, ctx) {
  const labels =
    b.prompts.length > 0
      ? b.prompts
      : ORGANIZER[b.kind].length
        ? ORGANIZER[b.kind].map((k) => ctx.t(k))
        : ["1", "2", "3", "4"].map((n) => ctx.t("organizerIdea", { n }));
  const grid = h("div", { class: `sp-organizer sp-org-${b.kind}` });
  labels.forEach((label, i) => {
    const id = nid("org");
    grid.append(
      h(
        "div",
        { class: "sp-org-cell" },
        rt("label", "sp-org-label", label, { for: id }),
        h("textarea", { id, rows: "3", class: "sp-input", spellcheck: "true" }),
        b.kind === "sequence" ? h("span", { class: "sp-org-n", "aria-hidden": "true" }, String(i + 1)) : null,
      ),
    );
  });
  return h("div", null, h("p", { class: "sp-note-small" }, ctx.t("organizerNote")), grid);
}

function audioBlock(b, ctx) {
  const box = h("div", { class: "sp-audio" });
  const text = h("p", { class: "sp-audio-text", hidden: true }, b.say);
  const show = h("button", { type: "button", class: "sp-btn sp-btn-quiet", "aria-expanded": "false" }, ctx.L("showText"));
  show.addEventListener("click", () => {
    text.hidden = !text.hidden;
    show.setAttribute("aria-expanded", String(!text.hidden));
  });
  box.append(
    h("strong", null, b.label || ctx.t("listen")),
    hearButton(ctx, b.say, b.label || ctx.t("listen")),
    show,
    text,
  );
  if (!ctx.speaker.available) text.hidden = false;
  return box;
}

const RENDER = {
  text: textBlock,
  passage: passageBlock,
  vocab: vocabBlock,
  image: imageBlock,
  math: mathBlock,
  table: tableBlock,
  organizer: organizerBlock,
  audio: audioBlock,
};

/** One content block as an element, or null (notes and unknown types render nothing). */
export function renderBlock(block, ctx) {
  const fn = RENDER[block.type];
  const body = fn ? fn(block, ctx) : null;
  if (!body) return null;
  const wrap = h("div", { class: `sp-block sp-block-${block.type}`, "data-block-id": block.id }, body);
  return ctx.markEditable(wrap, block);
}

/** A list of content blocks as a fragment. */
export function renderBlocks(blocks, ctx) {
  const frag = document.createDocumentFragment();
  for (const b of blocks) {
    const el = renderBlock(b, ctx);
    if (el) frag.append(el);
  }
  return frag;
}
