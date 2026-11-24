// Language Studio Word renderer: the table block (header row, zebra, tone cells, column widths that never break a word).

import { wCell, wGap, wParagraph, wRun } from "./docx-kit.js";
import {
  cellBody,
  innerW,
  plain,
  RULE,
  runsXml,
  sub,
  tone,
  WASH,
  wrap,
} from "./studio-docx-runs.js";

const tableSize = (ctx) => (ctx.fam ? 8.5 : ctx.early ? ctx.base : ctx.base * 0.95);

// Column widths from the model's percentages, never narrower than the longest word in the column (a Word table does not overflow, it breaks words).
export function fitWidths(pcts, total, mins = []) {
  const sum = pcts.reduce((a, b) => a + b, 0) || 1;
  const out = pcts.map((v) => Math.floor((v / sum) * total));
  const need = out.map((w, k) => Math.max(0, (mins[k] || 0) - w));
  const short = need.reduce((a, b) => a + b, 0);
  if (short > 0) {
    const slack = out.map((w, k) => Math.max(0, w - (mins[k] || 0)));
    const room = slack.reduce((a, b) => a + b, 0) || 1;
    const take = Math.min(short, room);
    out.forEach((w, k) => {
      out[k] = need[k] ? w + need[k] : w - Math.round((slack[k] / room) * take);
    });
  }
  out[out.length - 1] += total - out.reduce((a, b) => a + b, 0);
  return out;
}

const cellText = (c) =>
  c === null || c === undefined
    ? ""
    : typeof c !== "object"
      ? String(c)
      : plain(c.runs || [{ t: c.t ?? c.text ?? "" }]);

function minWidths(x, size, margin) {
  const cols = (x.headers || x.rows[0] || []).length;
  return Array.from({ length: cols }, (_, k) => {
    const word = (t) =>
      Math.max(
        0,
        ...String(t)
          .split(/\s+/)
          .map((w) => w.length),
      );
    const body = Math.max(0, ...x.rows.map((r) => word(cellText(r[k]))));
    const head = x.headers ? word(cellText(x.headers[k])) * 1.25 : 0;
    return Math.round(Math.max(body * 0.54, head * 0.5) * size * 20) + 2 * margin + 40;
  });
}

function tableCell(cell, width, opts) {
  const { size, margins, border, tctx, zebra } = opts;
  const o = cell === null || cell === undefined ? "" : cell;
  const isObj = typeof o === "object";
  const fillTone = isObj && o.tone ? tone(o.tone) : null;
  const align = isObj && o.align === "center" ? "center" : undefined;
  let body;
  if (isObj && o.blocks)
    body = cellBody(o.blocks, sub(tctx, width - margins.left - margins.right, { align }));
  else {
    const runs = isObj ? o.runs || [{ t: o.t ?? o.text ?? "" }] : [String(o)];
    body = wParagraph(runsXml(runs, { size, bold: isObj && o.bold }), {
      align,
      spaceBefore: 0,
      spaceAfter: 0,
      line: { val: tctx.fam ? 252 : 288, rule: "auto" },
    });
  }
  return wCell(body, {
    widthDxa: width,
    fill: fillTone ? fillTone.bg : zebra ? WASH : undefined,
    margins,
    vAlign: "top",
    borders: fillTone ? { ...border, bottom: { sz: 20, color: fillTone.mid } } : border,
  });
}

export function table(x, ctx) {
  const total = innerW(ctx);
  const p = tone(x.tone);
  const size = tableSize(ctx);
  const v = ctx.fam ? 50 : x.compact ? 100 : 140;
  const h = ctx.fam ? 120 : x.compact ? 110 : 180;
  const widths = fitWidths(
    x.widths || (x.rows[0] || x.headers || []).map(() => 1),
    total,
    minWidths(x, size, h),
  );
  const margins = { top: v, bottom: v, left: h, right: h };
  const rule = { sz: 8, color: RULE };
  const border = x.sheet
    ? { top: rule, left: rule, bottom: rule, right: rule }
    : { top: "nil", left: "nil", right: "nil", bottom: rule };
  const tctx = { ...ctx, base: size };
  const rows = [];
  if (x.headers)
    rows.push({
      header: true,
      cells: x.headers.map((hd, k) =>
        wCell(
          wParagraph(
            wRun(typeof hd === "string" ? hd : (hd.t ?? ""), {
              bold: true,
              caps: true,
              spacing: 12,
              size: ctx.fam ? 16 : 18,
              color: "FFFFFF",
            }),
            { spaceBefore: 0, spaceAfter: 0 },
          ),
          {
            widthDxa: widths[k],
            fill: p.ink,
            vAlign: "center",
            margins: { top: ctx.fam ? 80 : 120, bottom: ctx.fam ? 80 : 120, left: h, right: h },
            borders: { top: "nil", left: "nil", right: "nil", bottom: "nil" },
          },
        ),
      ),
    });
  x.rows.forEach((r, ri) => {
    rows.push({
      height: x.sheet ? 800 : undefined,
      cells: r.map((c, k) =>
        tableCell(c, widths[k], { size, margins, border, tctx, zebra: x.zebra && ri % 2 === 1 }),
      ),
    });
  });
  return `${wrap(ctx, rows, widths)}${wGap(ctx.fam ? 80 : 220)}`;
}
