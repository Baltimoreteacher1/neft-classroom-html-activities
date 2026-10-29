/**
 * The take-home sheet's QR code must scan. This reads a module matrix back with an independent path (format bits ->
 * mask -> zig-zag codewords -> Reed-Solomon syndromes -> byte-mode text) and requires it to return the text that went
 * in, for every lesson URL and every mask. A decoder is the only honest proof of an encoder: `engine/core/qr-mini.js`
 * "worked" for years and its output does not decode (CoreImage, 2026-10-28).
 * Run on a Mac, `swift` + CoreImage CIDetector was used once over all 166 lesson URLs rendered through resvg: 166/166.
 */
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { interactiveUrl } from "../scripts/lib/lesson-identity.mjs";
import { MAX_BYTES, qrModules, qrSvg } from "../scripts/lib/qr-code.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const VERSION_CAPACITY = { 21: [19, 7], 25: [34, 10], 29: [55, 15], 33: [80, 20], 37: [108, 26] };

const EXP = [];
const LOG = [];
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x = (x << 1) ^ (x & 128 ? 0x11d : 0);
}
const gmul = (a, b) => (a && b ? EXP[(LOG[a] + LOG[b]) % 255] : 0);

const MASK = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function decode(m) {
  const n = m.length;
  const [dataCw, ecCw] = VERSION_CAPACITY[n];
  // format info, first copy (row 8 / column 8 around the top-left finder)
  const fmt = [];
  for (let i = 0; i <= 5; i++) fmt[i] = m[i][8];
  fmt[6] = m[7][8];
  fmt[7] = m[8][8];
  fmt[8] = m[8][7];
  for (let i = 9; i < 15; i++) fmt[i] = m[8][14 - i];
  const bits = fmt.reduce((v, b, i) => v | ((b ? 1 : 0) << i), 0) ^ 0x5412;
  assert.equal(bits >> 13, 0b01, "error correction level must be L");
  const mask = (bits >> 10) & 7;
  // reserved (function) modules
  const fn = Array.from({ length: n }, () => new Array(n).fill(false));
  const mark = (r0, r1, c0, c1) => {
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) if (r >= 0 && c >= 0 && r < n && c < n) fn[r][c] = true;
  };
  mark(0, 8, 0, 8);
  mark(0, 8, n - 8, n - 1);
  mark(n - 8, n - 1, 0, 8);
  for (let i = 0; i < n; i++) fn[6][i] = fn[i][6] = true;
  const pos = { 25: [18], 29: [22], 33: [26], 37: [30] }[n] ?? [];
  for (const r of [6, ...pos])
    for (const c of [6, ...pos])
      if (!((r === 6 && c === 6) || (r === 6 && c === pos.at(-1)) || (r === pos.at(-1) && c === 6)))
        mark(r - 2, r + 2, c - 2, c + 2);
  const out = [];
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < n; v++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const r = ((right + 1) & 2) === 0 ? n - 1 - v : v;
        if (fn[r][c]) continue;
        out.push(m[r][c] !== MASK[mask](r, c));
      }
    }
  }
  const words = [];
  for (let i = 0; i + 8 <= out.length && words.length < dataCw + ecCw; i += 8)
    words.push(out.slice(i, i + 8).reduce((v, b) => (v << 1) | (b ? 1 : 0), 0));
  for (let i = 0; i < ecCw; i++) {
    let s = 0;
    for (const w of words) s = gmul(s, EXP[i]) ^ w;
    assert.equal(s, 0, `Reed-Solomon syndrome ${i} is not zero`);
  }
  const bitsOut = words
    .slice(0, dataCw)
    .flatMap((w) => Array.from({ length: 8 }, (_, i) => (w >> (7 - i)) & 1));
  assert.equal(bitsOut.slice(0, 4).join(""), "0100", "byte mode");
  const len = parseInt(bitsOut.slice(4, 12).join(""), 2);
  const bytes = [];
  for (let i = 0; i < len; i++)
    bytes.push(parseInt(bitsOut.slice(12 + 8 * i, 20 + 8 * i).join(""), 2));
  return Buffer.from(bytes).toString("utf8");
}

const ids = readdirSync(join(REPO_ROOT, "data", "family-homework-notes")).map((f) =>
  f.slice(0, -5),
);
assert.ok(ids.length >= 160, `expected every family lesson, found ${ids.length}`);
for (const id of ids) {
  const url = interactiveUrl(id);
  assert.equal(decode(qrModules(url)), url, `QR for ${id} does not read back`);
}

// the decoder must be able to fail: a flipped data module breaks the syndrome check
const flipped = qrModules(interactiveUrl("4-5")).map((row) => row.slice());
const last = flipped.length - 1;
flipped[last][last] = !flipped[last][last];
assert.throws(() => decode(flipped), /syndrome|byte mode/, "a corrupted QR must not decode");

assert.throws(() => qrModules("x".repeat(MAX_BYTES + 1)), /does not fit/);
assert.match(qrSvg("https://example.com", { px: 80 }), /^<svg [^>]*width="80"/);
console.log(
  `qr-code.test: ${ids.length} lesson URLs encode and read back; corruption is detected.`,
);
