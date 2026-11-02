/**
 * qr-code.mjs: a small, correct QR encoder for the take-home sheet (byte mode, error correction L, versions 1-5,
 * all eight masks scored, penalty rules N1-N4). Output is a module matrix and a single-path vector SVG.
 *
 * Why not `engine/core/qr-mini.js`: its masks and format bits were never checked against a decoder; its output
 * does not decode (verified with CoreImage's QR detector, 2026-10-28). This one is verified the same way in
 * `scripts/lib/qr-code.test.mjs` by an independent read path and, on a Mac, by CoreImage across every lesson URL.
 */

// version -> { data codewords, ec codewords }, all single-block at level L
const VERSIONS = [
  null,
  { data: 19, ec: 7 },
  { data: 34, ec: 10 },
  { data: 55, ec: 15 },
  { data: 80, ec: 20 },
  { data: 108, ec: 26 },
];
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30]];
export const MAX_BYTES = VERSIONS[5].data - 2;

const EXP = new Array(512);
const LOG = new Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const gmul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function rsRemainder(data, ecLen) {
  let gen = [1];
  for (let i = 0; i < ecLen; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= gmul(gen[j], EXP[i]);
    }
    gen = next;
  }
  const rem = new Array(ecLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem.shift();
    rem.push(0);
    for (let i = 0; i < ecLen; i++) rem[i] ^= gmul(gen[i + 1], factor);
  }
  return rem;
}

function codewords(text, version) {
  const bytes = [...Buffer.from(text, "utf8")];
  const { data, ec } = VERSIONS[version];
  const bits = [];
  const put = (value, count) => {
    for (let i = count - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };
  put(0b0100, 4);
  put(bytes.length, 8);
  for (const b of bytes) put(b, 8);
  put(0, Math.min(4, data * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const out = [];
  for (let i = 0; i < bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  for (let pad = 0xec; out.length < data; pad ^= 0xec ^ 0x11) out.push(pad);
  return [...out, ...rsRemainder(out, ec)];
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function formatBits(mask) {
  const data = (0b01 << 3) | mask; // level L = 01
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

function blank(size) {
  return {
    m: Array.from({ length: size }, () => new Array(size).fill(false)),
    fn: Array.from({ length: size }, () => new Array(size).fill(false)),
  };
}

function drawFunctionPatterns(g, version) {
  const size = g.m.length;
  const set = (r, c, dark) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    g.m[r][c] = dark;
    g.fn[r][c] = true;
  };
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [r0, c0] of [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ]) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const d = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
        set(r0 + dr, c0 + dc, d !== 2 && d !== 4);
      }
    }
  }
  const pos = ALIGN[version];
  for (const r of pos) {
    for (const c of pos) {
      if ((r === 6 && c === 6) || (r === 6 && c === pos.at(-1)) || (r === pos.at(-1) && c === 6))
        continue;
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++)
          set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }
  }
  setFormat(g, 0);
  set(size - 8, 8, true);
}

function setFormat(g, mask) {
  const size = g.m.length;
  const bits = formatBits(mask);
  const bit = (i) => ((bits >> i) & 1) === 1;
  const set = (r, c, v) => {
    g.m[r][c] = v;
    g.fn[r][c] = true;
  };
  for (let i = 0; i <= 5; i++) set(i, 8, bit(i));
  set(7, 8, bit(6));
  set(8, 8, bit(7));
  set(8, 7, bit(8));
  for (let i = 9; i < 15; i++) set(8, 14 - i, bit(i));
  for (let i = 0; i < 8; i++) set(8, size - 1 - i, bit(i));
  for (let i = 8; i < 15; i++) set(size - 15 + i, 8, bit(i));
  set(size - 8, 8, true);
}

function placeData(g, words) {
  const size = g.m.length;
  const bits = words.flatMap((w) => Array.from({ length: 8 }, (_, i) => (w >> (7 - i)) & 1));
  let k = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const r = ((right + 1) & 2) === 0 ? size - 1 - v : v;
        if (!g.fn[r][c] && k < bits.length) g.m[r][c] = bits[k++] === 1;
      }
    }
  }
}

function penalty(m) {
  const n = m.length;
  let score = 0;
  const runs = (line) => {
    let s = 0;
    let run = 1;
    for (let i = 1; i <= line.length; i++) {
      if (i < line.length && line[i] === line[i - 1]) run++;
      else {
        if (run >= 5) s += run - 2;
        run = 1;
      }
    }
    const str = line.map((x) => (x ? "1" : "0")).join("");
    for (const pat of ["10111010000", "00001011101"]) {
      for (let i = str.indexOf(pat); i !== -1; i = str.indexOf(pat, i + 1)) s += 40;
    }
    return s;
  };
  for (let i = 0; i < n; i++) {
    score += runs(m[i]);
    score += runs(m.map((row) => row[i]));
  }
  for (let r = 0; r < n - 1; r++)
    for (let c = 0; c < n - 1; c++)
      if (m[r][c] === m[r][c + 1] && m[r][c] === m[r + 1][c] && m[r][c] === m[r + 1][c + 1])
        score += 3;
  const dark = m.flat().filter(Boolean).length;
  score += Math.floor(Math.abs((dark * 20) / (n * n) - 10)) * 10;
  return score;
}

/** Module matrix (true = dark, no quiet zone) for `text`. Throws when it does not fit version 5. */
export function qrModules(text) {
  const need = Buffer.byteLength(text, "utf8");
  const version = [1, 2, 3, 4, 5].find((v) => need <= VERSIONS[v].data - 2);
  if (!version) throw new Error(`qr-code: ${need} bytes does not fit (max ${MAX_BYTES})`);
  const size = 17 + 4 * version;
  const base = blank(size);
  drawFunctionPatterns(base, version);
  placeData(base, codewords(text, version));
  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const g = { m: base.m.map((r) => r.slice()), fn: base.fn };
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) if (!g.fn[r][c] && MASKS[mask](r, c)) g.m[r][c] = !g.m[r][c];
    setFormat(g, mask);
    const score = penalty(g.m);
    if (!best || score < best.score) best = { score, m: g.m };
  }
  return best.m;
}

/** A vector QR: one path, four-module quiet zone, `px` CSS pixels square. Black on white only (scanner-safe). */
export function qrSvg(text, { px = 96, label = "" } = {}) {
  const m = qrModules(text);
  const n = m.length;
  const q = 4;
  let d = "";
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!m[r][c]) {
        c++;
        continue;
      }
      let w = 1;
      while (c + w < n && m[r][c + w]) w++;
      d += `M${c + q} ${r + q}h${w}v1h-${w}z`;
      c += w;
    }
  }
  const total = n + 2 * q;
  const aria = label
    ? ` role="img" aria-label="${label.replace(/"/g, "&quot;")}"`
    : ' aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${px}" height="${px}" shape-rendering="crispEdges"${aria}><rect width="${total}" height="${total}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
