/**
 * pdf-text-sizes.mjs: the smallest TYPE SIZE a PDF actually shows, in points, read from its content streams.
 *
 * `pdftotext -bbox` reports glyph boxes, not sizes, and a box is not a size. This inflates each Flate stream,
 * walks the graphics operators (q Q cm BT Tf Tm Td TD T* Tj TJ ' ") and multiplies, for every shown string,
 *   Tf size x text-matrix scale x current-transform scale.
 * That is exact for what Skia/Chromium and LibreOffice write. Fonts used with no shown glyphs are ignored.
 */
import { inflateSync } from "node:zlib";

const NUM = /^-?\d*\.?\d+(?:e-?\d+)?$/i;

function* streams(buffer) {
  const text = buffer.toString("latin1");
  const re = /stream\r?\n/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const start = m.index + m[0].length;
    const end = text.indexOf("endstream", start);
    if (end < 0) break;
    try {
      yield inflateSync(buffer.subarray(start, end)).toString("latin1");
    } catch {
      // not a Flate stream (image, font program): nothing to read
    }
  }
}

const scaleOf = ([a, b, c, d]) => Math.sqrt(Math.abs(a * d - b * c)) || Math.hypot(a, b);
const mul = (m, n) => [
  m[0] * n[0] + m[1] * n[2],
  m[0] * n[1] + m[1] * n[3],
  m[2] * n[0] + m[3] * n[2],
  m[2] * n[1] + m[3] * n[3],
];

/** Tokens of a content stream, skipping string bodies so "(Tf)" is never read as an operator. */
function tokens(src) {
  const out = [];
  const re = /\((?:\\.|[^\\()])*\)|<[0-9a-fA-F\s]*>|\[|\]|\/[^\s/[\]()<>]+|[^\s/[\]()<>]+/g;
  for (let m = re.exec(src); m; m = re.exec(src)) out.push(m[0]);
  return out;
}

/** `[{ size, glyphs }]` for every distinct effective size (points, 2 dp) with shown glyphs. */
export function textSizes(buffer) {
  const sizes = new Map();
  for (const stream of streams(buffer)) {
    if (!/\bBT\b/.test(stream)) continue;
    let ctm = [1, 0, 0, 1];
    const stack = [];
    let tm = [1, 0, 0, 1];
    let fontSize = 0;
    let operands = [];
    for (const tok of tokens(stream)) {
      if (
        NUM.test(tok) ||
        tok[0] === "(" ||
        tok[0] === "<" ||
        tok === "[" ||
        tok === "]" ||
        tok[0] === "/"
      ) {
        operands.push(tok);
        continue;
      }
      const nums = operands.filter((o) => NUM.test(o)).map(Number);
      if (tok === "q") stack.push([...ctm]);
      else if (tok === "Q") ctm = stack.pop() ?? ctm;
      else if (tok === "cm" && nums.length >= 6) ctm = mul(nums.slice(0, 4), ctm);
      else if (tok === "BT") tm = [1, 0, 0, 1];
      else if (tok === "Tm" && nums.length >= 6) tm = nums.slice(0, 4);
      else if (tok === "Tf") fontSize = nums.at(-1) ?? fontSize;
      else if (tok === "Tj" || tok === "TJ" || tok === "'" || tok === '"') {
        const shown = operands.join("");
        const glyphs =
          (shown.match(/<([0-9a-fA-F\s]*)>/g) ?? []).reduce(
            (n, h) => n + h.replace(/[<>\s]/g, "").length / 4,
            0,
          ) + (shown.match(/\((?:\\.|[^\\()])*\)/g) ?? []).reduce((n, s) => n + s.length - 2, 0);
        if (glyphs > 0) {
          const size = Math.round(fontSize * scaleOf(tm) * scaleOf(ctm) * 100) / 100;
          sizes.set(size, (sizes.get(size) ?? 0) + glyphs);
        }
      }
      operands = [];
    }
  }
  return [...sizes].map(([size, glyphs]) => ({ size, glyphs })).sort((a, b) => a.size - b.size);
}

/** The smallest size with shown text, or null when the PDF shows none. */
export const minTextSize = (buffer) => textSizes(buffer)[0]?.size ?? null;
