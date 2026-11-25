// Seeded PRNG so a seed always rebuilds the same practice test. Same algorithm as the fixture library
// (32-bit FNV-1a seed hash, mulberry32 stream); a test pins the two streams together. Kept local because the
// fixture tree is developer-only and is not published with the site.
const encoder = new TextEncoder();

export function hashSeed(seed) {
  let h = 0x811c9dc5;
  for (const byte of encoder.encode(String(seed))) {
    h ^= byte;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function createRng(seed) {
  let a = hashSeed(seed);
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    shuffle(list) {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
}
