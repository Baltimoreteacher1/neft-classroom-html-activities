// The pure half of document fitting: how tall each block of the printed sheet is, and which page it lands on.
// No DOM and no browser, so it runs in Node from the paper model. It is an ESTIMATE; fitDocument prefers a real
// measurement (measurePages) and uses this only when none is given, and for the page-by-page block lists.
//
//   estimateLayout(activity, options) -> { pages, heightIn, pageIn, perPage:[{ page, usedIn, blocks:[…] }] }
//   pageThumbnails(activity, options)  -> { pages, perPage, heightIn }   (what the Fit panel labels each preview with)

import { plainMath } from "../core/math.js";
import { normalizeActivity } from "../core/schema.js";
import { writingLines } from "../print/paper-model.js";
import { tr } from "../print/strings.js";
import { levelOptions } from "./fit-levels.js";
import { expandAnimation } from "./animations.js";

const PT = 1 / 72;
const textLen = (s) => plainMath(String(s ?? "")).length;

/** Lines a text needs at `pt` in a column `widthIn` wide (average glyph about half an em). */
function lines(text, widthIn, pt, glyph = 0.52) {
  const per = Math.max(4, Math.floor((widthIn * 72) / (pt * glyph)));
  return String(text ?? "")
    .split(/\n+/)
    .reduce((n, para) => n + Math.max(1, Math.ceil(textLen(para) / per)), 0);
}

function metrics(o, widthIn) {
  const pt = o.bodyPt;
  const small = Math.max(11, 11.5 * Math.min(1, pt / 13));
  return {
    pt,
    widthIn,
    line: pt * o.lineHeight * PT,
    smallLine: (o.large ? 14.5 : small) * o.lineHeight * PT,
    smallPt: o.large ? 14.5 : small,
    k: o.k,
    ws: o.wsScale,
    rule: o.ruleIn,
    bubble: 15 * Math.max(1, pt / 13) * PT,
  };
}

const howKey = (q) =>
  q.format === "blank"
    ? q.bank
      ? "bank"
      : "blank"
    : q.format === "short"
      ? q.kind === "explain"
        ? "explain"
        : "write"
      : q.format;

function optionsHeight(m, texts, o, roomIn) {
  const gap = 7 * m.k * PT;
  const perCol = o.grid ? 2 : 1;
  const w = (roomIn - (m.bubble + 18 * PT + 10 * PT)) / perCol;
  const hs = texts.map((t) => Math.max(m.bubble, lines(t, w, m.pt) * m.line) + gap);
  if (perCol === 1) return hs.reduce((a, b) => a + b, 0);
  let sum = 0;
  for (let i = 0; i < hs.length; i += 2) sum += Math.max(hs[i], hs[i + 1] ?? 0);
  return sum;
}

function bodyHeight(m, q, o, a) {
  const W = m.widthIn;
  const rooms = a.options.workspace === "roomy";
  const optText = (l) => l.map((x) => x.text ?? x);
  switch (q.format) {
    case "choice":
    case "multi":
      return optionsHeight(m, optText(q.options), o, W);
    case "match": {
      const half = (W - 26 * PT) / 2;
      const side = (txts, extra) =>
        txts.reduce(
          (s, t) => s + Math.max(m.line, lines(t, half - extra, m.pt) * m.line) + 9 * PT,
          0,
        );
      return Math.max(
        side(
          q.pairs.map((p) => p.left),
          0.9,
        ),
        side(
          q.pairs.map((p) => p.right),
          0.4,
        ),
      );
    }
    case "sort": {
      const chipsW = q.items.reduce(
        (s, i) => s + textLen(i.text) * m.pt * 0.55 * PT + 30 * PT + 8 * PT,
        0,
      );
      const chipRows = Math.max(1, Math.ceil(chipsW / W));
      const chipH = chipRows * (m.line + 8 * PT + 6 * PT) + 9 * PT;
      const perCol = Math.max(
        1,
        ...q.categories.map((c) => q.items.filter((i) => i.category === c.id).length),
      );
      const rows = Math.min(8, perCol + 1);
      return chipH + (m.line + 12 * PT) + rows * 0.4;
    }
    case "order": {
      const items = optionsHeight(m, optText(q.items), { ...o, grid: false }, W - 0.4);
      const slotW = 0.55 + 0.3 + 18 * PT;
      const rows = Math.ceil((q.items.length * slotW) / W);
      return items + rows * (m.line + 6 * PT) + 4 * PT;
    }
    case "blank": {
      const marks = (q.text.match(/\[\[/g) || []).length;
      const len = textLen(q.text.replace(/\[\[[^\]]*\]\]/g, ""));
      const textW = len * m.pt * 0.52 * PT + marks * 1.35;
      const n = Math.max(1, Math.ceil(textW / W));
      const bank = q.bank
        ? ((marks * 70 * PT * 1.4) / W + 1) * (m.line + 8 * PT) + 14 * PT + 10 * PT + m.smallLine
        : 0;
      return bank + n * (m.pt * 2.1 * PT);
    }
    case "number":
      return 1.05 * m.ws * (rooms ? 1.81 : 1) + 9 * PT + m.line * 1.05 + 7 * m.k * PT;
    case "short":
      return writingLines(q, a.options.workspace) * m.rule + 4 * PT;
    case "identify":
      return (
        lines(q.text.replace(/\[\[|\]\]|\|[^\]]*/g, ""), W - 0.4, m.pt * 1.04) *
          (m.pt * 1.04 * 1.9 * PT) +
        22 * PT
      );
    case "hotspot": {
      const opts = optionsHeight(
        m,
        q.regions.map((r) => r.label),
        { ...o, grid: false },
        W - 3.7,
      );
      return Math.max(q.image?.src ? 2.45 : 2.2, opts) + m.line + 7 * PT;
    }
    case "numberline":
      return (Math.min(7, W) * 92) / 672 + 2 * PT;
    case "plot": {
      const span = Math.max(1, Math.ceil(q.max ?? 5) - Math.floor(q.min ?? -5));
      const cell = Math.min(36, 340 / span);
      const size = cell * span + 68;
      return (size / (size + 14)) * (Math.round((size + 14) * 0.75) / 72) + 2 * PT;
    }
    case "build": {
      const cardsW = q.words.reduce(
        (s, w) => s + textLen(w) * m.pt * 0.55 * PT + 26 * PT + 9 * PT,
        0,
      );
      const rows = Math.max(1, Math.ceil(cardsW / W));
      return rows * (m.line + 12 * PT + 9 * PT) + 9 * PT + m.line + 7 * PT + 2 * m.rule + 4 * PT;
    }
    case "error": {
      const steps = q.steps.reduce(
        (s, st) =>
          s + Math.max(m.line, lines(st.text, W - 0.9 - 0.3, m.pt) * m.line) + 10 * PT + 6 * PT,
        0,
      );
      return steps + m.line + 7 * PT + optionsHeight(m, optText(q.fixOptions), o, W);
    }
    case "fillTable": {
      const head = m.line + 10 * PT + 3 * PT;
      const rowsH = q.rows.reduce((s, r) => {
        const blank = r.some((c) => c && typeof c === "object");
        const txt = Math.max(
          1,
          ...r.map((c) => (c && typeof c === "object" ? 1 : lines(c, W / r.length - 0.25, m.pt))),
        );
        return (
          s + Math.max(blank ? (rooms ? 0.72 : 0.5) * m.ws : 0.4, txt * m.line + 10 * PT) + 2 * PT
        );
      }, 0);
      return head + rowsH + 6 * PT;
    }
    default:
      return optionsHeight(m, optText(q.options || []), o, W);
  }
}

function questionHeight(m, q, o, a) {
  const W = m.widthIn;
  const prompt = lines(q.prompt, W - 2.4 * m.pt * PT, m.pt, 0.55) * m.line + 6 * PT;
  const img = q.image?.src && q.format !== "hotspot" ? 1.6 + 8 * PT : 0;
  const frame =
    a.supports.frames && q.frame
      ? lines(`Sentence starter: ${q.frame}`, W - 0.2, m.pt) * m.line + 8 * PT
      : 0;
  const how = lines(tr("en", `how.${howKey(q)}`), W, m.smallPt) * m.smallLine + 7 * PT;
  return prompt + img + frame + how + bodyHeight(m, q, o, a) + 18 * m.k * PT - 0.1;
}

function textBlockHeight(m, b, role) {
  const W = m.widthIn;
  const paras = String(b.text ?? "")
    .split(/\n{2,}/)
    .filter(Boolean);
  const body = paras.reduce(
    (s, p) => s + lines(p, W - (role === "passage" ? 0.4 : 0.3), m.pt) * m.line + 7 * m.k * PT,
    0,
  );
  return body;
}

function blockHeight(m, b, o, a) {
  const W = m.widthIn;
  const block = 12 * m.k * PT;
  const block2 = 14 * m.k * PT;
  switch (b.type) {
    case "question":
      return questionHeight(m, b, o, a);
    case "text":
      if (b.role === "heading")
        return Math.max(15, 15 * (m.pt / 13)) * 1.2 * PT + 18 * m.k * PT + 6 * PT + 4.5 * PT;
      if (b.role === "directions")
        return (
          20 * PT +
          2.6 * PT +
          15 * 1.2 * PT +
          3 * PT +
          textBlockHeight(m, b, "directions") -
          7 * m.k * PT +
          block
        );
      return textBlockHeight(m, b, "body");
    case "passage":
      return (
        20.4 * PT +
        (b.title ? 15 * 1.2 * PT + 14 * m.k * PT + 6 * PT : 0) +
        textBlockHeight(m, b, "passage") * ((o.lineHeight + 0.15) / o.lineHeight) -
        7 * m.k * PT +
        block2
      );
    case "vocab": {
      const cols =
        2 +
        (b.items.some((i) => i.example) ? 1 : 0) +
        (a.supports.spanish ? 1 : 0) +
        (a.supports.visuals ? 1 : 0);
      const rows = b.items.reduce(
        (s, i) =>
          s +
          Math.max(
            a.supports.visuals ? 0.9 : 0,
            Math.max(
              lines(i.def, W / cols - 0.25, m.pt * 0.92),
              lines(i.example, W / cols - 0.25, m.pt * 0.92),
            ) *
              m.line *
              0.92,
          ) +
          10 * PT +
          2 * PT,
        0,
      );
      return 15 * 1.2 * PT + 6 * PT + m.line + 13 * PT + rows + block2;
    }
    case "image":
      return 1.6 + (b.caption ? m.smallLine + 3 * PT : 0) + block2;
    case "math":
      return m.pt * 1.31 * o.lineHeight * PT + 10 * PT + block2 + (b.caption ? m.smallLine : 0);
    case "table": {
      const rows = b.rows.reduce(
        (s, r) =>
          s +
          Math.max(
            0.4,
            Math.max(...r.map((c) => lines(c, W / Math.max(1, r.length) - 0.25, m.pt))) * m.line +
              10 * PT,
          ),
        0,
      );
      return (
        (b.caption ? m.smallLine + 4 * PT : 0) +
        (b.headers.length ? m.line + 13 * PT : 0) +
        rows +
        block2
      );
    }
    case "organizer": {
      const cell = (min) => Math.max(min * m.ws, m.line + 13 * PT) + 3 * PT;
      const kind = b.kind;
      if (kind === "cause-effect")
        return Math.max(1, b.prompts.length || 2) * (cell(0.9) + 8 * PT) + block2;
      if (kind === "sequence")
        return Math.max(4, b.prompts.length) * (cell(0.8) + 12 * PT) + block2;
      if (kind === "web")
        return (
          0.6 +
          10 * PT +
          Math.ceil(Math.max(4, b.prompts.length - 1) / 2) * (cell(1) + 8 * PT) +
          block2
        );
      if (kind === "claim-evidence")
        return (
          cell(0.9) +
          8 * PT +
          Math.ceil(Math.max(3, b.prompts.length - 1) / 3) * (cell(1.3) + 8 * PT) +
          block2
        );
      return cell(a.options.workspace === "roomy" ? 2 : 1.3) + block2;
    }
    case "audio":
      return m.line + 14 * PT + 2.6 * PT + block;
    // Figures print at most 4in (diagram) or 3in per frame (filmstrip); both estimates lean tall so a fit is never
    // promised on a count that is too small. The panel's browser measurement is the final word.
    case "diagram":
      return 3.2 + m.line + 8 * PT + block2;
    case "animation": {
      const frames = expandAnimation(b, { lang: "en" });
      const n = frames.ok ? frames.frames.length : 2;
      return Math.max(1, n) * (2.4 + m.line + 10 * PT) + block2;
    }
    default:
      return 0;
  }
}

const SPAN_ALL = new Set([
  "heading",
  "directions",
  "passage",
  "vocab",
  "image",
  "math",
  "table",
  "organizer",
  "audio",
  "header",
  "goal",
]);
const KEEP_NEXT = new Set(["heading"]);
const SPLITS = new Set(["passage", "body", "directions"]);

function headerItems(a, m, o) {
  const W = m.widthIn;
  const h1 = Math.max(19, 23 * (m.pt / 13));
  const title = lines(a.title, W, h1, 0.58) * h1 * 1.2 * PT;
  const c = a.context;
  const meta = c.grade || c.subject || c.unitTitle || c.day ? m.smallLine + 3 * PT : 0;
  const header = title + meta + 12 * PT + m.line + 7 * PT + 3 * PT + 12 * m.k * PT;
  const items = [{ id: "header", type: "header", h: header }];
  if (c.objective)
    items.push({
      id: "goal",
      type: "goal",
      h:
        20 * PT +
        2.6 * PT +
        12.5 * 1.2 * PT +
        3 * PT +
        lines(c.objective, W - 0.3, m.pt) * m.line +
        12 * m.k * PT,
    });
  return items;
}

/** The sheet as a list of block heights, in print order. */
export function sheetItems(activity, options) {
  const a = normalizeActivity(activity);
  const o = options || levelOptions("standard", a);
  const width = 8.5 - 2 * o.marginIn;
  const colW = o.columns === 2 ? (width - 0.3) / 2 : width;
  const mFull = metrics(o, width);
  const mCol = metrics(o, colW);
  const items = headerItems(a, mFull, o);
  let n = 0;
  for (const b of a.blocks) {
    if (b.type === "note") continue;
    const role =
      b.type === "text"
        ? b.role === "heading"
          ? "heading"
          : b.role === "directions"
            ? "directions"
            : "body"
        : b.type;
    const span = o.columns === 2 && SPAN_ALL.has(role);
    const number = b.type === "question" ? ++n : 0;
    const m = o.columns === 2 && !span ? mCol : mFull;
    items.push({ id: b.id, type: b.type, role, number, span, h: blockHeight(m, b, o, a) });
  }
  return items;
}

/** Fill pages in print order: whole blocks stay together, headings stay with what follows, text may split. */
function paginate(items, pageIn, o) {
  const pages = [{ blocks: [], used: 0 }];
  const cur = () => pages[pages.length - 1];
  const fresh = () => pages.push({ blocks: [], used: 0 });
  const place = (item, h) => {
    cur().blocks.push(item);
    cur().used += h;
  };
  let pending = []; // blocks of a two-column run, waiting for the next full-width block
  const flush = () => {
    if (!pending.length) return;
    const total = pending.reduce((s, i) => s + i.h, 0);
    const tallest = Math.max(...pending.map((i) => i.h));
    const balanced = Math.max(tallest, total / 2 + tallest * 0.25);
    if (cur().used + balanced <= pageIn) {
      cur().blocks.push(...pending);
      cur().used += balanced;
    } else {
      let base = cur().used;
      let used = [0, 0];
      let col = 0;
      for (const i of pending) {
        if (used[col] > 0 && used[col] + i.h > pageIn - base) {
          if (col === 0) col = 1;
          else {
            cur().used = base + Math.max(...used);
            fresh();
            base = 0;
            used = [0, 0];
            col = 0;
          }
        }
        used[col] += i.h;
        cur().blocks.push(i);
      }
      cur().used = base + Math.max(...used);
    }
    pending = [];
  };
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    if (o.columns === 2 && !item.span) {
      pending.push(item);
      continue;
    }
    flush();
    let need = item.h;
    if (KEEP_NEXT.has(item.role) && items[idx + 1]) {
      const next = items[idx + 1];
      need += SPLITS.has(next.role) ? Math.min(next.h, 1) : next.h;
    }
    const left = pageIn - cur().used;
    if (need > left && cur().blocks.length) {
      if (SPLITS.has(item.role) && left > 1.0 && item.h > left) {
        place(item, left);
        fresh();
        place({ ...item, continued: true }, item.h - left);
        continue;
      }
      fresh();
    }
    if (item.h > pageIn) {
      let rest = item.h;
      while (rest > 0) {
        const take = Math.min(rest, Math.max(pageIn - cur().used, 0.5));
        place(rest === item.h ? item : { ...item, continued: true }, take);
        rest -= take;
        if (rest > 0) fresh();
      }
      continue;
    }
    place(item, item.h);
  }
  flush();
  return pages;
}

const LABELS = {
  header: ["Title and name line", "Título y línea de nombre"],
  goal: ["Learning goal", "Meta de aprendizaje"],
  heading: ["Section heading", "Encabezado de sección"],
  directions: ["Directions", "Instrucciones"],
  passage: ["Reading passage", "Texto de lectura"],
  vocab: ["Key words", "Palabras clave"],
  image: ["Picture", "Imagen"],
  math: ["Math display", "Expresión matemática"],
  table: ["Table", "Tabla"],
  organizer: ["Graphic organizer", "Organizador gráfico"],
  audio: ["Listening box", "Cuadro de escucha"],
  body: ["Text", "Texto"],
};

export const blockLabel = (item) =>
  item.number
    ? { en: `Question ${item.number}`, es: `Pregunta ${item.number}` }
    : {
        en: (LABELS[item.role] || LABELS[item.type] || ["Block"])[0],
        es: (LABELS[item.role] || LABELS[item.type] || ["", "Bloque"])[1],
      };

/** Estimated page count, height of one student sheet, and the blocks on each page. */
export function estimateLayout(activity, options) {
  const a = normalizeActivity(activity);
  const o = options || levelOptions("standard", a);
  const items = sheetItems(a, o);
  const heightIn = items.reduce((s, i) => s + i.h, 0);
  if (o.copies) {
    const half = (11 - 2 * o.marginIn - 0.2) / 2;
    return {
      pages: 1,
      heightIn: o.columns === 2 ? paginate(items, 1e9, o)[0].used : heightIn,
      pageIn: half,
      perPage: [{ page: 1, usedIn: Math.min(half, heightIn), blocks: items.map(brief) }],
    };
  }
  const pageIn = 11 - 2 * o.marginIn;
  const pages = paginate(items, pageIn, o);
  return {
    pages: pages.length,
    heightIn,
    pageIn,
    perPage: pages.map((p, i) => ({
      page: i + 1,
      usedIn: Math.min(pageIn, p.used),
      blocks: p.blocks.map(brief),
    })),
  };
}

const brief = (i) => ({
  id: i.id,
  type: i.type,
  label: blockLabel(i),
  continued: Boolean(i.continued),
});

/** Page-by-page block lists for the Fit panel (and for tests): the pure half of the page previews. */
export function pageThumbnails(activity, options) {
  const { pages, perPage, heightIn, pageIn } = estimateLayout(activity, options);
  return { pages, heightIn, pageIn, perPage };
}
