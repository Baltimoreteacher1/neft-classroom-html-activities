// Compact, dependency-free ISO/IEC 18004 QR Code (Versions 1–6, EC Level L, Byte Mode) -> inline SVG.

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const factor = EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Uint8Array(ecCount);
  for (const b of data) {
    const factor = b ^ res[0];
    res.copyWithin(0, 1);
    res[ecCount - 1] = 0;
    if (factor !== 0) {
      for (let i = 0; i < ecCount; i++) {
        res[i] ^= gfMul(gen[i + 1], factor);
      }
    }
  }
  return res;
}

// Versions 1..6 at EC Level L: [size, dataCodewords, ecCodewordsPerBlock, numBlocks, alignmentCenters]
const VERSIONS_L = [
  null,
  { size: 21, dataCw: 19, ecCw: 7, blocks: 1, align: [] },
  { size: 25, dataCw: 34, ecCw: 10, blocks: 1, align: [6, 18] },
  { size: 29, dataCw: 55, ecCw: 15, blocks: 1, align: [6, 22] },
  { size: 33, dataCw: 80, ecCw: 20, blocks: 1, align: [6, 26] },
  { size: 37, dataCw: 108, ecCw: 26, blocks: 1, align: [6, 30] },
  { size: 41, dataCw: 136, ecCw: 18, blocks: 2, align: [6, 34] },
];

// Format info for EC Level L (01) + Mask 0 (000) -> 01000 -> BCH(15,5) XOR 101010000010010 = 0x77c4
const FORMAT_BITS_L_M0 = 0x77c4;

function encodeCodewords(text) {
  const bytes = new TextEncoder().encode(text);
  // Byte mode header: 4 bits mode (0100) + 8 bits length (versions 1-9) = 12 bits -> needs ceil((12 + 8*len)/8) = len + 2 bytes
  let ver = 0;
  for (let v = 1; v < VERSIONS_L.length; v++) {
    if (bytes.length + 2 <= VERSIONS_L[v].dataCw) {
      ver = v;
      break;
    }
  }
  if (!ver) {
    // Truncate gracefully if an unexpectedly huge URL is passed
    ver = VERSIONS_L.length - 1;
  }
  const spec = VERSIONS_L[ver];
  const maxBytes = spec.dataCw - 2;
  const payload = bytes.slice(0, maxBytes);

  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(payload.length, 8);
  for (const b of payload) pushBits(b, 8);

  const totalDataBits = spec.dataCw * 8;
  // Terminator (up to 4 zeros)
  for (let i = 0; i < 4 && bits.length < totalDataBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataCw = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    dataCw.push(b);
  }
  const pads = [0xec, 0x11];
  let padIdx = 0;
  while (dataCw.length < spec.dataCw) {
    dataCw.push(pads[padIdx++ % 2]);
  }

  // Split into blocks & compute RS ECC
  const blockLen = Math.floor(spec.dataCw / spec.blocks);
  const dataBlocks = [];
  const ecBlocks = [];
  for (let b = 0; b < spec.blocks; b++) {
    const slice = dataCw.slice(b * blockLen, (b + 1) * blockLen);
    dataBlocks.push(slice);
    ecBlocks.push(Array.from(rsRemainder(slice, spec.ecCw)));
  }

  const allCw = [];
  for (let i = 0; i < blockLen; i++) {
    for (let b = 0; b < spec.blocks; b++) allCw.push(dataBlocks[b][i]);
  }
  for (let i = 0; i < spec.ecCw; i++) {
    for (let b = 0; b < spec.blocks; b++) allCw.push(ecBlocks[b][i]);
  }
  return { ver, spec, allCw };
}

export function buildQrMatrix(text) {
  const { ver, spec, allCw } = encodeCodewords(text);
  const n = spec.size;
  const grid = Array.from({ length: n }, () => new Int8Array(n)); // 0=unset, 1=light, 2=dark
  const isFunc = Array.from({ length: n }, () => new Uint8Array(n));

  const setMod = (r, c, dark, fn = true) => {
    if (r < 0 || c < 0 || r >= n || c >= n) return;
    grid[r][c] = dark ? 2 : 1;
    if (fn) isFunc[r][c] = 1;
  };

  // Finder patterns + separators
  const placeFinder = (row, col) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setMod(row + r, col + c, inOuter && (onBorder || inCore), true);
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, n - 7);
  placeFinder(n - 7, 0);

  // Timing patterns
  for (let i = 8; i < n - 8; i++) {
    setMod(6, i, i % 2 === 0, true);
    setMod(i, 6, i % 2 === 0, true);
  }

  // Alignment patterns (V2–V6)
  for (const r0 of spec.align) {
    for (const c0 of spec.align) {
      if ((r0 === 6 && c0 === 6) || (r0 === 6 && c0 === n - 7) || (r0 === n - 7 && c0 === 6)) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const dist = Math.max(Math.abs(r), Math.abs(c));
          setMod(r0 + r, c0 + c, dist === 2 || dist === 0, true);
        }
      }
    }
  }

  // Reserve format info areas + dark module
  for (let i = 0; i <= 8; i++) {
    if (!isFunc[8][i]) setMod(8, i, false, true);
    if (!isFunc[i][8]) setMod(i, 8, false, true);
  }
  for (let i = n - 8; i < n; i++) {
    if (!isFunc[8][i]) setMod(8, i, false, true);
    if (!isFunc[i][8]) setMod(i, 8, false, true);
  }
  setMod(4 * ver + 9, 8, true, true); // Dark module

  // Place data bits in zigzag columns with Mask 0 ((r + c) % 2 === 0)
  const bitStream = [];
  for (const cw of allCw) {
    for (let i = 7; i >= 0; i--) bitStream.push((cw >> i) & 1);
  }
  let bitIdx = 0;
  let upward = true;
  for (let col = n - 1; col >= 1; col -= 2) {
    if (col === 6) col--;
    for (let step = 0; step < n; step++) {
      const r = upward ? n - 1 - step : step;
      for (let dx = 0; dx < 2; dx++) {
        const c = col - dx;
        if (isFunc[r][c]) continue;
        const bit = bitIdx < bitStream.length ? bitStream[bitIdx++] : 0;
        const masked = ((r + c) & 1) === 0 ? bit ^ 1 : bit;
        setMod(r, c, masked === 1, false);
      }
    }
    upward = !upward;
  }

  // Write Format Information (EC L, Mask 0)
  const fmtBit = (i) => ((FORMAT_BITS_L_M0 >> i) & 1) === 1;
  // Around top-left finder
  const tlCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = tlCoords[i];
    grid[r][c] = fmtBit(14 - i) ? 2 : 1;
  }
  // Split across bottom-left and top-right finders
  for (let i = 0; i < 7; i++) {
    grid[n - 1 - i][8] = fmtBit(14 - i) ? 2 : 1;
  }
  for (let i = 0; i < 8; i++) {
    grid[8][n - 8 + i] = fmtBit(7 - i) ? 2 : 1;
  }

  return grid;
}

export function renderQrSvg(text, { sizePx = 168, label = "QR code for family link" } = {}) {
  const grid = buildQrMatrix(text);
  const n = grid.length;
  const quiet = 4;
  const total = n + quiet * 2;
  const rects = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === 2) {
        rects.push(`M${c + quiet},${r + quiet}h1v1h-1z`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${sizePx}" height="${sizePx}" role="img" aria-label="${label.replace(/"/g, "&quot;")}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#ffffff"/><path d="${rects.join("")}" fill="#161614"/></svg>`;
}
