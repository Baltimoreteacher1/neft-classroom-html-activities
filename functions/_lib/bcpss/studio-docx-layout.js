// Language Studio Word renderer: container blocks (band, hero, callout, table, cardGrid, columns) built from shaded, bordered Word tables.
// Child blocks are rendered through ctx.blocks (set by studio-docx-blocks.js) so this module never imports the dispatcher.

import { wCell, wGap, wParagraph, wRun, wTbl } from "./docx-kit.js";
import { TOKENS } from "./studio-doc.js";
import {
  CUT,
  cellBody,
  FONT,
  GLYPH,
  halfPts,
  hex,
  INK,
  innerW,
  MUTED,
  plain,
  RULE,
  runsXml,
  sub,
  textRuns,
  tint,
  tone,
  WASH,
  wrap,
} from "./studio-docx-runs.js";
import { fitWidths, table } from "./studio-docx-table.js";

const NB = "\u00A0";
const NONE = { top: "nil", left: "nil", bottom: "nil", right: "nil" };
const ZERO = { top: 0, bottom: 0, left: 0, right: 0 };
const exact = (twips) => ({ val: twips, rule: "exact" });
const symbolFont = (icon) =>
  ["star", "check", "scissors"].includes(icon) ? FONT.symbol : FONT.emoji;

// ---- activity band ------------------------------------------------------------------------------------
function band(x, ctx) {
  const p = tone(x.domain);
  const w = innerW(ctx);
  const widths = [820, w - 820 - 2300, 2300];
  const white = { color: "FFFFFF" };
  const badge = wParagraph(
    wRun(`${NB}${x.number}${NB}`, { font: FONT.head, size: 40, color: p.ink, shade: "FFFFFF" }),
    { align: "center", spaceBefore: 0, spaceAfter: 0 },
  );
  const iconName = TOKENS.domains[x.domain]?.icon || "star";
  const icon = wRun(`${GLYPH[iconName]}  `, { font: symbolFont(iconName), size: 20, ...white });
  const title = [
    wParagraph(
      icon + wRun(String(x.domain), { bold: true, caps: true, spacing: 28, size: 16, ...white }),
      {
        spaceBefore: 0,
        spaceAfter: 20,
        keepNext: true,
      },
    ),
    wParagraph(textRuns(x.title, { font: FONT.head, size: 42, ...white }), {
      spaceBefore: 0,
      spaceAfter: 0,
      keepNext: true,
      line: { val: 250, rule: "auto" },
    }),
  ];
  const pill = (text) =>
    wParagraph(
      wRun(`${NB}${NB}${text}${NB}${NB}`, {
        bold: true,
        size: 17,
        shade: tint(p.ink, 0.22),
        ...white,
      }),
      {
        align: "right",
        spaceBefore: 0,
        spaceAfter: 60,
        keepNext: true,
      },
    );
  const edge = { sz: 24, color: p.mid };
  const base = {
    fill: p.ink,
    vAlign: "center",
    borders: { top: "nil", left: "nil", right: "nil", bottom: edge },
  };
  const cells = [
    wCell(badge, {
      ...base,
      widthDxa: widths[0],
      margins: { top: 130, bottom: 130, left: 140, right: 40 },
    }),
    wCell(title, {
      ...base,
      widthDxa: widths[1],
      margins: { top: 130, bottom: 130, left: 120, right: 100 },
    }),
    wCell([pill(`${x.minutes} min`), pill(String(x.grouping))], {
      ...base,
      widthDxa: widths[2],
      margins: { top: 130, bottom: 70, left: 60, right: 220 },
    }),
  ];
  return `${wrap(ctx, [{ cells }], widths)}${wGap(200)}`;
}

// ---- hero (cover page + compact title strip) --------------------------------------------------------------
function heroCompact(x, ctx) {
  const p = tone(x.tone);
  const w = innerW(ctx);
  const white = { color: "FFFFFF" };
  const paras = [
    wParagraph(wRun(x.kicker, { bold: true, caps: true, spacing: 30, size: 17, ...white }), {
      spaceAfter: 120,
      spaceBefore: 0,
    }),
    wParagraph(textRuns(x.title, { font: FONT.head, size: ctx.fam ? 42 : 60, ...white }), {
      spaceAfter: x.subtitle ? 120 : 0,
      spaceBefore: 0,
      line: { val: 250, rule: "auto" },
    }),
  ];
  if (x.subtitle)
    paras.push(
      wParagraph(wRun(x.subtitle, { size: 22, ...white }), { spaceAfter: 0, spaceBefore: 0 }),
    );
  const cell = wCell(paras, {
    widthDxa: w,
    fill: p.ink,
    borders: { top: "nil", left: "nil", right: "nil", bottom: { sz: 24, color: p.mid } },
    margins: { top: ctx.fam ? 200 : 400, bottom: ctx.fam ? 180 : 360, left: 520, right: 520 },
  });
  return `${wrap(ctx, [{ cells: [cell] }], [w])}${wGap(ctx.fam ? 120 : 200)}`;
}

function nameDate(w) {
  const edge = { top: "nil", left: "nil", right: "nil", bottom: { sz: 14, color: INK } };
  const part = (label, width) =>
    wCell(
      wParagraph(wRun(label, { font: FONT.head, size: 24, color: INK }), {
        spaceAfter: 0,
        spaceBefore: 0,
      }),
      {
        widthDxa: width,
        vAlign: "bottom",
        borders: edge,
        margins: { top: 0, bottom: 30, left: 0, right: 0 },
      },
    );
  const gap = 520;
  const a = Math.round((w - gap) * 0.62);
  const widths = [a, gap, w - gap - a];
  return `${wTbl({
    widths,
    rows: [
      {
        height: 640,
        rule: "exact",
        cells: [
          part("Name", widths[0]),
          wCell(wGap(20), { widthDxa: gap, borders: NONE, margins: ZERO }),
          part("Date", widths[2]),
        ],
      },
    ],
  })}${wGap(20)}`;
}

function hero(x, ctx) {
  if (x.compact) return heroCompact(x, ctx);
  const p = tone(x.tone);
  const D = TOKENS.domains;
  const white = { color: "FFFFFF" };
  const cols = 12;
  const unit = Math.floor(ctx.w / cols);
  const widths = Array.from({ length: cols }, () => unit);
  const side = 1150;
  const span = (n) => unit * n;
  const noBorder = { borders: NONE, margins: ZERO };
  const topCell = wCell(
    [
      wParagraph(wRun(x.kicker, { bold: true, caps: true, spacing: 40, size: 22, ...white }), {
        spaceBefore: 0,
        spaceAfter: 320,
      }),
      wParagraph(textRuns(x.title, { font: FONT.head, size: 100, ...white }), {
        spaceBefore: 0,
        spaceAfter: 320,
        line: { val: 236, rule: "auto" },
      }),
      wParagraph(wRun(x.subtitle || "", { size: 30, ...white }), {
        spaceBefore: 0,
        spaceAfter: 0,
        indentRight: 2200,
      }),
    ],
    {
      widthDxa: span(cols),
      span: cols,
      fill: p.ink,
      margins: { top: 1500, bottom: 200, left: side, right: side },
      borders: NONE,
    },
  );
  const blockSpans = [3, 1, 2, 1, 2, 3];
  const blockFill = [
    p.ink,
    hex(D.Writing.mid),
    hex(D.Speaking.mid),
    hex(D.Vocabulary.mid),
    hex(D.Listening.mid),
    p.ink,
  ];
  const blocks = blockSpans.map((n, k) =>
    wCell(wGap(20), { widthDxa: span(n), span: n, fill: blockFill[k], ...noBorder }),
  );
  const chips = (x.chips || [])
    .map((c) =>
      wRun(`${NB}${NB}${c}${NB}${NB}`, {
        bold: true,
        size: 22,
        color: p.ink,
        shade: p.bg,
        border: { sz: 10, color: p.mid },
      }),
    )
    .join(wRun("   ", { size: 22 }));
  const inner = ctx.w - 2 * side;
  const botCell = wCell(
    [
      wParagraph(chips, { spaceBefore: 0, spaceAfter: 560, line: { val: 460, rule: "auto" } }),
      x.nameDate ? nameDate(inner) : "",
      wGap(20),
    ],
    {
      widthDxa: span(cols),
      span: cols,
      margins: { top: 900, bottom: 0, left: side, right: side },
      borders: NONE,
    },
  );
  const brand = wCell(
    wParagraph(
      wRun("The Language Page", { bold: true, caps: true, spacing: 30, size: 20, color: MUTED }),
      { spaceAfter: 0, spaceBefore: 0 },
    ),
    {
      widthDxa: span(cols),
      span: cols,
      vAlign: "center",
      margins: { top: 0, bottom: 0, left: side, right: side },
      borders: NONE,
    },
  );
  const stripe = ["Listening", "Speaking", "Reading", "Writing", "Vocabulary", "Game"].map((d) =>
    wCell(wGap(20), { widthDxa: span(2), span: 2, fill: hex(D[d].mid), ...noBorder }),
  );
  const rows = [
    { cells: [topCell], height: 7700, rule: "exact" },
    { cells: blocks, height: 760, rule: "exact" },
    { cells: [botCell], height: 5600, rule: "exact" },
    { cells: [brand], height: 480, rule: "exact" },
    { cells: stripe, height: 317, rule: "exact" },
  ];
  return wTbl({ widths, rows });
}

// ---- callout --------------------------------------------------------------------------------------------
function calloutLabel(x, p) {
  if (!x.label) return "";
  const icon = x.icon
    ? wRun(`${GLYPH[x.icon] || GLYPH.star}  `, { font: symbolFont(x.icon), size: 22, color: p.ink })
    : "";
  return wParagraph(
    icon + wRun(x.label, { bold: true, caps: true, spacing: 24, size: 17, color: p.ink }),
    {
      keepNext: true,
      spaceBefore: 0,
      spaceAfter: x.strip ? 0 : 100,
    },
  );
}

function callout(x, ctx) {
  const p = tone(x.tone);
  const w = innerW(ctx);
  const side = { sz: 8, color: tint(p.mid, 0.45) };
  const bar = { sz: 40, color: p.mid };
  const fill = x.plain ? "FFFFFF" : p.bg;
  const label = calloutLabel(x, p);
  if (x.strip) {
    const lw = Math.min(2500, Math.round(w * 0.27));
    const widths = [lw, w - lw];
    const margins = { top: 120, bottom: 120, left: 200, right: 160 };
    const cells = [
      wCell(label, {
        widthDxa: widths[0],
        fill,
        vAlign: "center",
        margins,
        borders: { top: side, left: bar, bottom: side, right: "nil" },
      }),
      wCell(cellBody(x.blocks, sub(ctx, widths[1] - 360)), {
        widthDxa: widths[1],
        fill,
        vAlign: "center",
        margins: { ...margins, left: 100 },
        borders: { top: side, left: "nil", bottom: side, right: side },
      }),
    ];
    return `${wrap(ctx, [{ cells }], widths)}${wGap(160)}`;
  }
  const margins = { top: ctx.fam ? 60 : 140, bottom: ctx.fam ? 60 : 140, left: 220, right: 200 };
  const body = cellBody(x.blocks, sub(ctx, w - margins.left - margins.right));
  const cell = wCell([label, body], {
    widthDxa: w,
    fill,
    margins,
    borders: { top: side, left: bar, bottom: side, right: side },
  });
  return `${wrap(ctx, [{ cells: [cell] }], [w])}${wGap(ctx.fam ? 50 : 180)}`;
}

// ---- cut-out / soft card grid ---------------------------------------------------------------------------
const CARD_PAD = 260;

function cardCell(c, cw, rowTwips, x, ctx) {
  const p = tone(c.tone);
  const cut = x.cut;
  const hair = { sz: 8, color: RULE };
  const sides = cut ? undefined : { top: hair, left: hair, bottom: hair, right: hair };
  if (c.empty) return wCell(wGap(20), { widthDxa: cw, margins: ZERO, borders: NONE });
  const base = {
    ...ctx,
    tight: true,
    card: true,
    cardTone: c.tone,
    align: c.center ? "center" : undefined,
  };
  const left = x.bar === "left";
  const barPara = left
    ? ""
    : wParagraph([], {
        shading: p.mid,
        spaceBefore: 0,
        spaceAfter: 0,
        line: exact(140),
        markSize: 2,
      });
  const borders = left ? { ...(sides || {}), left: { sz: 72, color: p.mid } } : sides;
  if (c.center || c.vc) {
    const innerCtx = { ...base, w: cw - 2 * CARD_PAD, ind: 0 };
    const w = cw;
    const content = wCell(cellBody(c.blocks, innerCtx), {
      widthDxa: w,
      vAlign: "center",
      margins: { top: 40, bottom: 40, left: CARD_PAD, right: CARD_PAD },
      borders: NONE,
    });
    const nested = wTbl({
      widths: [w],
      rows: [{ cells: [content], height: Math.max(300, rowTwips - 300) }],
    });
    return wCell([barPara, nested, wGap(20)], {
      widthDxa: cw,
      margins: ZERO,
      vAlign: "top",
      borders,
    });
  }
  const pad = left ? 360 : CARD_PAD;
  const body = cellBody(c.blocks, { ...base, w: cw - 2 * pad, ind: 0 }).replace(/^/, "");
  const wrapPad = wTbl({
    widths: [cw],
    rows: [
      {
        height: left ? Math.max(300, rowTwips - 40) : undefined,
        cells: [
          wCell(body, {
            widthDxa: cw,
            vAlign: left ? "center" : "top",
            margins: { top: left ? 100 : 70, bottom: 20, left: pad, right: CARD_PAD },
            borders: NONE,
          }),
        ],
      },
    ],
  });
  return wCell([barPara, wrapPad, wGap(20)], {
    widthDxa: cw,
    margins: ZERO,
    vAlign: "top",
    borders,
  });
}

function cardGrid(x, ctx) {
  const total = innerW(ctx);
  const cols = x.cols;
  const rowsN = Math.ceil(x.cards.length / cols);
  const rowTwips = Math.round((x.rowH || 2.4) * 1440) - (x.cut ? 80 : 0);
  const sp = x.cut ? 0 : 70;
  const cw = Math.floor((total - (cols + 1) * sp) / cols);
  const dash = { val: "dashed", sz: 10, color: CUT };
  const rows = [];
  for (let r = 0; r < rowsN; r++) {
    const cells = [];
    for (let k = 0; k < cols; k++) {
      const c = x.cards[r * cols + k] || { empty: true, blocks: [] };
      cells.push(cardCell(c, cw, rowTwips, x, ctx));
    }
    rows.push({ cells, height: rowTwips });
  }
  const borders = x.cut
    ? { top: dash, left: dash, bottom: dash, right: dash, insideH: dash, insideV: dash }
    : undefined;
  const tbl = wTbl({
    widths: Array.from({ length: cols }, () => cw),
    rows,
    borders,
    spacing: sp,
    indent: ctx.ind || 0,
  });
  return `${tbl}${wGap(x.cut ? 100 : 160)}`;
}

// ---- columns ------------------------------------------------------------------------------------------------
function columns(x, ctx) {
  const total = innerW(ctx);
  const widths = fitWidths(x.widths || x.cols.map(() => 1), total);
  const half = 160;
  const cells = x.cols.map((blocks, k) => {
    const left = k === 0 ? 0 : half;
    const right = k === x.cols.length - 1 ? 0 : half;
    const inner = widths[k] - left - right;
    return wCell(cellBody(blocks, sub(ctx, inner)), {
      widthDxa: widths[k],
      vAlign: x.mid ? "center" : "top",
      margins: { top: 0, bottom: 0, left, right },
      borders: {
        top: "nil",
        bottom: "nil",
        right: "nil",
        left: x.rule && k > 0 ? { sz: 8, color: RULE } : "nil",
      },
    });
  });
  return `${wrap(ctx, [{ cells, cantSplit: false }], widths)}${wGap(ctx.fam ? 60 : 140)}`;
}

export const LAYOUT = { band, hero, callout, table, cardGrid, columns };
