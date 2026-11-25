/**
 * Seeded PRNG for fixtures. ALGORITHM (frozen: changing it changes every fixture):
 *   seed -> uint32 by 32-bit FNV-1a over the UTF-8 bytes of String(seed)
 *   stream: mulberry32 (Tommy Ettinger), one uint32 state, 4 steps per output:
 *     a = (a + 0x6D2B79F5) | 0
 *     t = imul(a ^ (a >>> 15), 1 | a)
 *     t = (t + imul(t ^ (t >>> 7), 61 | t)) ^ t
 *     out = ((t ^ (t >>> 14)) >>> 0) / 4294967296        // float in [0, 1)
 * No Date, no Math.random: the same seed gives the same stream on every machine.
 */

const encoder = new TextEncoder();

/** FNV-1a 32-bit hash of String(seed). */
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
  const rng = {
    next,
    /** Integer in [lo, hi] inclusive. */
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (list) => list[Math.floor(next() * list.length)],
    /** Fisher-Yates on a copy. */
    shuffle(list) {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    /** Independent child stream; the parent stream is not advanced. */
    fork: (label) => createRng(`${seed}/${label}`),
  };
  return rng;
}
