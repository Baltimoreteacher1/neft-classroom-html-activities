// Language Studio Word renderer: leaf blocks (paragraph, heading, lines, chips, checklist, boxRow, matchColumns, rule, spacer, footerNote)
// and the block dispatcher. Container blocks (band, hero, callout, table, cardGrid, columns) live in studio-docx-layout.js.
//
// Render context: { w, ind, base, early, fam, dense, align, tight, last, tone, blocks }
//   w     = usable width in twips between the indents      ind   = left+right indent in twips (cards pad their text)
//   base  = body text size in points                       tight = compact paragraph spacing inside cells and cards

import { wCell, wGap, wParagraph, wRun, wTbl } from "./docx-kit.js";
import { LAYOUT } from "./studio-docx-layout.js";
import {
  CUT,
  FONT,
  GLYPH,
  HAND,
  halfPts,
  INK,
  MUTED,
  RULE,
  runsXml,
  textRuns,
  tone,
  WRITE_LINE,
} from "./studio-docx-runs.js";

const NB = "\u00A0";
const none = { top: "nil", left: "nil", bottom: "nil", right: "nil" };
const line = (twips) => ({ val: twips, rule: "auto" });

export const pad = (ctx) => ({ indentLeft: ctx.ind || 0, indentRight: ctx.ind || 0 });
const lineFor = (ctx) => line(ctx.card ? 290 : ctx.early ? 330 : ctx.fam ? 290 : 331);
const gapAfter = (ctx, normal = 140) => (ctx.fam ? 24 : ctx.card ? 50 : ctx.tight ? 80 : normal);

const PARA_SIZE = {
  lg: (c) => Math.max(13.5, c.base),
  md: (c) => (c.early ? 14 : 12.5),
  sm: (c) => (c.early ? 11.5 : 9.5),
  xl: () => 34,
  xl2: () => 24,
  xxl: () => 50,
  bingo: () => 17,
  poster: () => 29,
  fam: () => 8.9,
};
const HEAD_SIZES = new Set(["xl2", "xxl", "bingo", "poster"]);

const centered = (x, ctx) => x.align === "center" || ctx.align === "center";

function paragraph(x, ctx) {
  const size = PARA_SIZE[x.size]?.(ctx) ?? (x.mission ? (ctx.early ? 16 : 13) : ctx.base);
  const head = HEAD_SIZES.has(x.size);
  const tinted = x.size === "xxl" || (x.size === "xl2" && ctx.align === "center");
  const opts = {
    ...pad(ctx),
    align: centered(x, ctx) ? "center" : undefined,
    spaceBefore: 0,
    spaceAfter: ctx.last ? 0 : gapAfter(ctx, x.mission ? 200 : 140),
    line: x.size === "poster" ? line(396) : x.size === "fam" ? line(290) : lineFor(ctx),
  };
  if (x.mission) {
    const m = tone(ctx.tone).mid;
    opts.borders = { left: { sz: 40, space: 8, color: m } };
    opts.indentLeft += 180;
  }
  return wParagraph(
    runsXml(x.runs, {
      size,
      font: head ? FONT.head : undefined,
      bold: x.mission,
      color: x.size === "sm" ? MUTED : tinted && ctx.cardTone ? tone(ctx.cardTone).ink : INK,
    }),
    opts,
  );
}

const HEAD = {
  1: (c) => (c.dense ? 22 : 25),
  2: (c) => (c.fam ? 13.5 : c.dense ? 14 : 17),
  3: () => 13,
};
const HEAD_GAP = {
  1: [0, 160],
  2: [240, 120],
  3: [180, 80],
};

function heading(x, ctx) {
  const size = HEAD[x.level](ctx);
  const [before, after] = ctx.fam ? [160, 80] : HEAD_GAP[x.level];
  const p = x.tone ? tone(x.tone) : null;
  const color = x.level === 2 && p ? p.ink : INK;
  const icon = x.icon
    ? wRun(`${NB}${GLYPH[x.icon] || GLYPH.star}${NB}`, {
        font: ["star", "check", "scissors"].includes(x.icon) ? FONT.symbol : FONT.emoji,
        size: halfPts(size * 0.8),
        color: p ? p.ink : INK,
        shade: p ? p.bg : undefined,
      }) + wRun("  ", { size: halfPts(size) })
    : "";
  return wParagraph(`${icon}${textRuns(x.text, { font: FONT.head, size: halfPts(size), color })}`, {
    style: `Heading${x.level}`,
    keepNext: true,
    spaceBefore: ctx.fam ? Math.round(before / 2) : before,
    spaceAfter: after,
    line: line(ctx.fam ? 260 : 250),
    ...pad(ctx),
  });
}

function lines(x, ctx) {
  const fills = x.fill || [];
  const n = Math.max(x.n || 0, fills.length);
  const h = ctx.early ? 540 : 400;
  const w = ctx.w - 2 * (ctx.ind || 0);
  const label = x.label
    ? wParagraph(wRun(x.label, { bold: true, size: 18, color: MUTED }), {
        keepNext: true,
        spaceBefore: 40,
        spaceAfter: 0,
        ...pad(ctx),
      })
    : "";
  const rows = Array.from({ length: n }, (_, k) => ({
    height: h,
    rule: "exact",
    cells: [
      wCell(
        wParagraph(
          fills[k] ? wRun(fills[k], { size: 26, color: HAND, bold: true, italic: true }) : [],
          { spaceBefore: 0, spaceAfter: 0, line: line(300), markSize: 2 },
        ),
        {
          widthDxa: w,
          vAlign: "bottom",
          margins: { top: 0, bottom: 20, left: 40, right: 40 },
          borders: { top: "nil", left: "nil", right: "nil", bottom: { sz: 8, color: WRITE_LINE } },
        },
      ),
    ],
  }));
  return `${label}${wTbl({ widths: [w], rows, indent: ctx.ind || 0 })}${wGap(ctx.card ? 40 : ctx.tight ? 80 : 120)}`;
}

function chipRun(text, ctx, { color, solid, cut }) {
  return wRun(`${NB}${NB}${text}${NB}${NB}`, {
    bold: true,
    size: halfPts(ctx.base * 0.97),
    color: INK,
    shade: solid || color.mid !== tone("neutral").mid ? color.bg : undefined,
    border: { val: cut ? "dashed" : "single", sz: cut ? 8 : 10, color: cut ? CUT : color.mid },
  });
}

function chips(x, ctx) {
  const base = tone(x.tone || "neutral");
  const sep = wRun("   ", { size: halfPts(ctx.base) });
  const runs = x.items
    .map((it) => {
      const o = typeof it === "string" ? { text: it } : it;
      return chipRun(o.text, ctx, {
        color: tone(o.tone || x.tone || "neutral"),
        solid: o.sol,
        cut: x.cut,
      });
    })
    .join(sep);
  const flow = wParagraph(runs, {
    line: { val: ctx.fam ? 320 : 400, rule: "auto" },
    spaceBefore: 0,
    spaceAfter: 0,
    ...pad(ctx),
  });
  if (!x.cut) {
    const label = x.label
      ? wParagraph(
          wRun(x.label, { bold: true, caps: true, spacing: 24, size: 17, color: base.ink }),
          {
            keepNext: true,
            spaceBefore: 0,
            spaceAfter: 60,
            ...pad(ctx),
          },
        )
      : "";
    return `${label}${flow}${wGap(ctx.tight ? 100 : 180)}`;
  }
  const label = x.label
    ? wParagraph(
        wRun(`${GLYPH.scissors}  `, { font: FONT.symbol, size: 20, color: MUTED }) +
          wRun(x.label, { bold: true, caps: true, spacing: 24, size: 17, color: MUTED }),
        { keepNext: true, spaceBefore: 0, spaceAfter: 80 },
      )
    : "";
  const w = ctx.w - 2 * (ctx.ind || 0);
  const dash = { val: "dashed", sz: 10, color: CUT };
  const cell = wCell([label, flow.replace(/<w:ind [^>]*\/>/, "")], {
    widthDxa: w,
    fill: "F6F8FB",
    margins: { top: ctx.fam ? 60 : 140, bottom: ctx.fam ? 60 : 140, left: 180, right: 180 },
    borders: { top: dash, left: dash, bottom: dash, right: dash },
  });
  return `${wTbl({ widths: [w], rows: [{ cells: [cell] }], indent: ctx.ind || 0 })}${wGap(ctx.fam ? 40 : 180)}`;
}

function marker(x, k, ctx) {
  const t = tone(x.tone || "neutral");
  const on = x.mark === k;
  const size = halfPts(ctx.base * 1.2);
  if (x.style === "bubble")
    return wRun(x.letters === false ? "○" : String.fromCharCode(0x24b6 + k), {
      font: FONT.symbol,
      size,
      bold: on,
      color: INK,
      shade: on ? t.mid : undefined,
    });
  if (x.style === "dot")
    return wRun("●", { font: FONT.symbol, size: halfPts(ctx.base * 0.7), color: t.mid });
  return wRun(on ? "☑" : "☐", { font: FONT.symbol, size, color: INK });
}

function checklist(x, ctx) {
  const hang = 400;
  return x.items
    .map((it, k) => {
      const body =
        typeof it === "string"
          ? textRuns(it, { size: halfPts(ctx.base), color: INK })
          : runsXml(it, { size: ctx.base });
      const note = x.notes?.[k]
        ? wRun("", { br: true }) +
          wRun(x.notes[k], { italic: true, size: halfPts(ctx.base * 0.85), color: MUTED })
        : "";
      const last = k === x.items.length - 1;
      return wParagraph(`${marker(x, k, ctx)}${wRun("", { tab: true })}${body}${note}`, {
        keepLines: true,
        keepNext: !last,
        tabs: [{ pos: (ctx.ind || 0) + hang }],
        indentLeft: (ctx.ind || 0) + hang,
        indentRight: ctx.ind || 0,
        hanging: hang,
        spaceBefore: 0,
        spaceAfter: last ? (ctx.fam ? 40 : ctx.tight ? 80 : 160) : ctx.fam ? 10 : 40,
        line: lineFor(ctx),
      });
    })
    .join("");
}

function boxRow(x, ctx) {
  const sm = x.size === "sm";
  const side = sm ? 400 : 720;
  const gap = sm ? 80 : 120;
  const label = x.label ? 1500 : 0;
  const widths = [];
  const cells = [];
  if (label) {
    widths.push(label);
    cells.push(
      wCell(wParagraph(wRun(x.label, { bold: true, size: halfPts(ctx.base) }), { spaceAfter: 0 }), {
        widthDxa: label,
        vAlign: "center",
        borders: none,
        margins: { top: 0, bottom: 0, left: 0, right: 60 },
      }),
    );
  }
  const border = { sz: 12, color: INK };
  for (let k = 0; k < x.n; k++) {
    if (k) {
      widths.push(gap);
      cells.push(
        wCell(wGap(20), {
          widthDxa: gap,
          borders: none,
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        }),
      );
    }
    widths.push(side);
    const v = x.values?.[k] ?? "";
    cells.push(
      wCell(
        wParagraph(v ? wRun(v, { font: FONT.head, size: sm ? 22 : 30, color: HAND }) : [], {
          align: "center",
          spaceBefore: 0,
          spaceAfter: 0,
          line: line(sm ? 260 : 380),
          markSize: 2,
        }),
        {
          widthDxa: side,
          vAlign: "center",
          borders: { top: border, left: border, bottom: border, right: border },
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      ),
    );
  }
  const center = sm || ctx.align === "center";
  const tbl = wTbl({
    widths,
    rows: [{ cells, height: side, rule: "exact" }],
    jc: center ? "center" : undefined,
    indent: center ? 0 : ctx.ind || 0,
  });
  return `${tbl}${wGap(sm ? 20 : 160)}`;
}

function matchColumns(x, ctx) {
  const pct = [39, 5, 12, 5, 39];
  const inner = ctx.w - 2 * (ctx.ind || 0);
  const widths = pct.map((p) => Math.floor((inner * p) / 100));
  const n = Math.max(x.left.length, x.right.length);
  const letter = (k) => String.fromCharCode(65 + k);
  const dot = (show, text) =>
    wCell(
      wParagraph(
        show
          ? wRun(text || "○", {
              font: FONT.symbol,
              size: 30,
              bold: Boolean(text),
              color: text ? HAND : INK,
            })
          : [],
        {
          align: "center",
          spaceAfter: 0,
          spaceBefore: 0,
        },
      ),
      {
        widthDxa: 0,
        vAlign: "center",
        borders: none,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      },
    );
  const item = (text, badge, w, light) => {
    const b = { sz: 10, color: RULE };
    const bd = tone("neutral");
    return wCell(
      text
        ? wParagraph(
            wRun(`${NB}${badge}${NB}`, {
              bold: true,
              size: 22,
              color: light ? INK : "FFFFFF",
              shade: light ? bd.bg : INK,
              border: light ? { sz: 8, color: tone(ctx.tone).mid } : undefined,
            }) + wRun(`  ${text}`, { size: halfPts(ctx.base) }),
            { spaceBefore: 0, spaceAfter: 0, line: line(300) },
          )
        : wGap(20),
      {
        widthDxa: w,
        vAlign: "center",
        borders: text ? { top: b, left: b, bottom: b, right: b } : none,
        margins: { top: 90, bottom: 90, left: 140, right: 100 },
      },
    );
  };
  const head = (text, w) =>
    wCell(
      wParagraph(
        wRun(text, { bold: true, caps: true, spacing: 24, size: 17, color: tone(ctx.tone).ink }),
        { spaceAfter: 0 },
      ),
      {
        widthDxa: w,
        borders: none,
        margins: { top: 0, bottom: 40, left: 20, right: 0 },
      },
    );
  const blank = (w) =>
    wCell(wGap(20), {
      widthDxa: w,
      borders: none,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  const rows = [
    {
      header: true,
      cells: [
        head(x.leftLabel, widths[0]),
        blank(widths[1]),
        blank(widths[2]),
        blank(widths[3]),
        head(x.rightLabel, widths[4]),
      ],
    },
  ];
  for (let k = 0; k < n; k++) {
    const l = x.left[k];
    const r = x.right[k];
    const ans = x.answers && l ? letter(x.answers[k]) : "";
    const cellDot = (show, text, w) => {
      const c = dot(show, text);
      return c.replace('<w:tcW w:w="0" w:type="dxa"/>', `<w:tcW w:w="${w}" w:type="dxa"/>`);
    };
    rows.push({
      cells: [
        wCell(wGap(20), {
          widthDxa: inner,
          span: 5,
          borders: none,
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        }),
      ],
      height: 90,
      rule: "exact",
    });
    rows.push({
      height: 560,
      cells: [
        item(l, k + 1, widths[0], false),
        cellDot(Boolean(l), ans, widths[1]),
        blank(widths[2]),
        cellDot(Boolean(r), "", widths[3]),
        item(r, letter(k), widths[4], true),
      ],
    });
  }
  return `${wTbl({ widths, rows, indent: ctx.ind || 0 })}${wGap(160)}`;
}

function rule(x, ctx) {
  const w = ctx.w - 2 * (ctx.ind || 0);
  if (x.icon === "scissors")
    return wParagraph(
      wRun(`${GLYPH.scissors}  `, { font: FONT.symbol, size: 24, color: MUTED }) +
        wRun(x.label || "Cut here", {
          bold: true,
          caps: true,
          spacing: 20,
          size: 16,
          color: MUTED,
        }) +
        wRun("  ", { size: 16 }) +
        wRun("", { tab: true, color: MUTED }),
      {
        tabs: [{ val: "right", pos: w, leader: "hyphen" }],
        spaceBefore: 200,
        spaceAfter: 200,
        keepNext: true,
      },
    );
  return wParagraph([], {
    borders: {
      bottom: {
        val: x.dashed ? "dashed" : "single",
        sz: x.dashed ? 10 : 6,
        color: x.dashed ? CUT : RULE,
      },
    },
    spaceBefore: 120,
    spaceAfter: 160,
    markSize: 2,
  });
}

const spacer = (x) => wGap(Math.round((Number(x.h) || 0) * 20));

const footerNote = (x, ctx) =>
  wParagraph(wRun(x.text, { italic: true, size: ctx.early ? 22 : 18, color: MUTED }), {
    spaceBefore: 40,
    spaceAfter: 0,
    ...pad(ctx),
  });

export const RENDER = {
  ...LAYOUT,
  paragraph,
  heading,
  lines,
  chips,
  checklist,
  boxRow,
  matchColumns,
  rule,
  spacer,
  footerNote,
};

/** Renders a block list; the last paragraph of a container drops its trailing space. */
export function blocksXml(list, ctx) {
  const blocks = list || [];
  const sub = { ...ctx, blocks: blocksXml };
  return blocks
    .map((b, k) => {
      const fn = RENDER[b.type];
      if (!fn) throw new Error(`studio-docx: unknown block type "${b.type}"`);
      const last = ctx.tight && k === blocks.length - 1 && b.type === "paragraph";
      return fn(b, last ? { ...sub, last: true } : sub);
    })
    .join("");
}
