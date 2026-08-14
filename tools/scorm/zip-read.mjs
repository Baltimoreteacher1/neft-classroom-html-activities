/**
 * zip-read.mjs — read a stored ZIP back out through its central directory.
 *
 * Split out of validate-scorm-fleet.mjs so a test can parse an archive without
 * importing (and therefore RUNNING) the whole fleet gate. Reading packages back
 * through a real parser is the point of both callers: a writer bug that produces
 * self-consistent nonsense is invisible to anything that only inspects the input
 * it was handed.
 */
const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD = 0x06054b50;

function crc32(bytes) {
  let crc = ~0;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

/** Parse a stored-ZIP buffer via its central directory. Throws on corruption. */
export function readZip(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const dec = new TextDecoder();

  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (dv.getUint32(i, true) === SIG_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("no end-of-central-directory record (not a zip)");

  const count = dv.getUint16(eocd + 10, true);
  const cdSize = dv.getUint32(eocd + 12, true);
  const cdOffset = dv.getUint32(eocd + 16, true);
  if (cdOffset + cdSize > buf.length) throw new Error("central directory runs past end of file");

  const entries = [];
  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p, true) !== SIG_CENTRAL)
      throw new Error(`central directory entry ${i} has a bad signature`);
    const crc = dv.getUint32(p + 16, true);
    const size = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOffset = dv.getUint32(p + 42, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nameLen));

    if (dv.getUint32(localOffset, true) !== SIG_LOCAL)
      throw new Error(`entry "${name}": local header signature is wrong`);
    const lNameLen = dv.getUint16(localOffset + 26, true);
    const lExtraLen = dv.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + lNameLen + lExtraLen;
    if (dataStart + size > buf.length)
      throw new Error(`entry "${name}": data runs past end of file`);
    const data = buf.subarray(dataStart, dataStart + size);
    if (crc32(data) !== crc) throw new Error(`entry "${name}": CRC-32 mismatch (corrupt)`);

    entries.push({ name, size, data, text: () => dec.decode(data) });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}
