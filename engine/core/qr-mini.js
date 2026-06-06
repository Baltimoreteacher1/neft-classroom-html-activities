/**
 * Minimal QR code SVG generator (byte mode, error correction L).
 * No dependencies — suitable for certificate lesson URLs.
 * Based on the public-domain qrcode-generator algorithm (simplified).
 */

/* eslint-disable no-bitwise */

const ECC_L = 1;
const PAD0 = 0xec;
const PAD1 = 0x11;

const EXP_TABLE = new Array(256);
const LOG_TABLE = new Array(256);
for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
for (let i = 8; i < 256; i++)
  EXP_TABLE[i] =
    EXP_TABLE[i - 4] ^
    EXP_TABLE[i - 5] ^
    EXP_TABLE[i - 6] ^
    EXP_TABLE[i - 8];
for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;

function gexp(n) {
  while (n < 0) n += 255;
  while (n >= 256) n -= 255;
  return EXP_TABLE[n];
}

function glog(n) {
  if (n < 1) throw new Error("glog");
  return LOG_TABLE[n];
}

function createPolynomial(num, shift) {
  let offset = 0;
  while (offset < num.length && num[offset] === 0) offset++;
  const res = new Array(num.length - offset + shift);
  for (let i = 0; i < num.length - offset; i++) res[i] = num[i + offset];
  return res;
}

function modPolynomial(num, e) {
  if (num.length - e.length < 0) return num;
  const ratio = glog(num[0]) - glog(e[0]);
  const res = num.slice();
  for (let i = 0; i < e.length; i++) res[i] ^= gexp(glog(e[i]) + ratio);
  return modPolynomial(res, e);
}

function getErrorCorrectPolynomial(ecLength) {
  let e = [1];
  for (let i = 0; i < ecLength; i++) {
    e = createPolynomial(e, 1);
    e[e.length - 1] ^= gexp(i);
  }
  return e;
}

function getBCHTypeInfo(data) {
  let d = data << 10;
  const g = 0b10100110111;
  while (countBits(d) - countBits(g) >= 0) d ^= g << (countBits(d) - countBits(g));
  return ((data << 10) | d) ^ 0b101010000010010;
}

function getBCHTypeNumber(data) {
  let d = data << 12;
  const g = 0b1111100100101;
  while (countBits(d) - countBits(g) >= 0) d ^= g << (countBits(d) - countBits(g));
  return (data << 12) | d;
}

function countBits(n) {
  let c = 0;
  while (n) {
    c++;
    n >>>= 1;
  }
  return c;
}

function getMaskFunc(mask) {
  const fns = [
    (i, j) => (i + j) % 2 === 0,
    (i, j) => i % 2 === 0,
    (i, j) => j % 3 === 0,
    (i, j) => (i + j) % 3 === 0,
    (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
    (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
    (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
    (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0,
  ];
  return fns[mask];
}

const RS_BLOCK_TABLE = {
  1: { L: [[1, 26]] },
  2: { L: [[1, 44]] },
  3: { L: [[1, 70]] },
  4: { L: [[1, 100]] },
  5: { L: [[1, 134]] },
  6: { L: [[2, 86]] },
};

function createData(version, data) {
  const rsBlocks = RS_BLOCK_TABLE[version]?.L || RS_BLOCK_TABLE[4].L;
  const buffer = [];
  const len = data.length;

  buffer.push(0x40); // byte mode
  buffer.push(len);
  for (let i = 0; i < len; i++) buffer.push(data.charCodeAt(i));

  const totalDataCount = rsBlocks.reduce((s, b) => s + b[0] * b[1], 0);
  while (buffer.length < totalDataCount) {
    buffer.push(buffer.length % 2 ? PAD1 : PAD0);
  }

  let offset = 0;
  const dcdata = [];
  const ecdata = [];
  for (const [count, totalCount] of rsBlocks) {
    for (let i = 0; i < count; i++) {
      const dataCount = totalCount - 10;
      const chunk = buffer.slice(offset, offset + dataCount);
      offset += dataCount;
      const rsPoly = getErrorCorrectPolynomial(10);
      let mod = createPolynomial(chunk, 10);
      for (let j = 0; j < chunk.length; j++) {
        mod = modPolynomial(mod, rsPoly);
      }
      const ecChunk = mod.slice(-10);
      dcdata.push(chunk);
      ecdata.push(ecChunk);
    }
  }

  const dataList = [];
  const maxDc = Math.max(...dcdata.map((d) => d.length));
  const maxEc = Math.max(...ecdata.map((d) => d.length));
  for (let i = 0; i < maxDc; i++) {
    for (const d of dcdata) if (i < d.length) dataList.push(d[i]);
  }
  for (let i = 0; i < maxEc; i++) {
    for (const d of ecdata) if (i < d.length) dataList.push(d[i]);
  }
  return dataList;
}

function createMatrix(version, dataList) {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => Array(size).fill(null));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(row, col, val) {
    modules[row][col] = val;
    reserved[row][col] = true;
  }

  // Finder patterns
  for (const [r, c] of [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ]) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const on =
          i === 0 ||
          i === 6 ||
          j === 0 ||
          j === 6 ||
          (i >= 2 && i <= 4 && j >= 2 && j <= 4);
        setModule(r + i, c + j, on);
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) setModule(6, i, i % 2 === 0);
    if (!reserved[i][6]) setModule(i, 6, i % 2 === 0);
  }

  // Dark module
  setModule(size - 8, 8, true);

  // Type info placeholder
  const typeInfo = getBCHTypeInfo(ECC_L);
  for (let i = 0; i < 15; i++) {
    const bit = ((typeInfo >> i) & 1) === 1;
    if (i < 6) setModule(8, i, bit);
    else if (i < 8) setModule(8, i + 1, bit);
    else setModule(14 - i, 8, bit);
    if (i < 8) setModule(size - 1 - i, 8, bit);
    else setModule(8, size - 15 + i, bit);
  }

  const typeNumber = getBCHTypeNumber(version);
  for (let i = 0; i < 18; i++) {
    const bit = ((typeNumber >> i) & 1) === 1;
    const r = Math.floor(i / 3);
    const c = (i % 3) + size - 11;
    setModule(r, c, bit);
    setModule(c, r, bit);
  }

  let bitIndex = 0;
  let direction = -1;
  let row = size - 1;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (;;) {
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        if (!reserved[row][x]) {
          let dark = false;
          if (bitIndex < dataList.length * 8) {
            dark = ((dataList[Math.floor(bitIndex / 8)] >> (7 - (bitIndex % 8))) & 1) === 1;
            bitIndex++;
          }
          modules[row][x] = dark;
        }
      }
      row += direction;
      if (row < 0 || row >= size) {
        row -= direction;
        direction = -direction;
        break;
      }
    }
  }

  // Mask selection — pick lowest penalty (simplified: mask 0)
  const mask = 0;
  const maskFn = getMaskFunc(mask);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && maskFn(r, c)) modules[r][c] = !modules[r][c];
    }
  }

  return modules;
}

function pickVersion(text) {
  const len = text.length + 3;
  if (len <= 26) return 1;
  if (len <= 44) return 2;
  if (len <= 70) return 3;
  if (len <= 100) return 4;
  if (len <= 134) return 5;
  return 6;
}

/** Return QR code as SVG string. */
export function qrSvg(text, { size = 120, margin = 2, fg = "#12355B", bg = "#fff" } = {}) {
  const version = pickVersion(text);
  const dataList = createData(version, text);
  const modules = createMatrix(version, dataList);
  const n = modules.length;
  const cell = (size - margin * 2) / n;

  let paths = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules[r][c]) {
        paths += `<rect x="${margin + c * cell}" y="${margin + r * cell}" width="${cell}" height="${cell}" fill="${fg}"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}"/>${paths}</svg>`;
}

/** Draw QR onto canvas context at x,y. */
export function drawQrOnCanvas(ctx, text, x, y, size = 100) {
  const svg = qrSvg(text, { size });
  const img = new Image();
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, x, y, size, size);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    img.src = url;
  });
}
