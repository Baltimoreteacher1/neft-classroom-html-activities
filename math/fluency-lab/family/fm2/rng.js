// Seeded randomness for reproducible rounds: the same (session seed, round index) always rebuilds the same round,
// which is what makes resume and seeded property tests possible. @fm2 FM-061 FM-065 FM-026
export function makeRng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a over the string form of the parts: stable across sessions and platforms.
export function seedFrom(...parts) {
  let hash = 0x811c9dc5;
  for (const char of parts.join("|")) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export const int = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;
export const pick = (rng, items) => items[int(rng, 0, items.length - 1)];
export const chance = (rng, p) => rng() < p;

export function shuffle(rng, items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = int(rng, 0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const sample = (rng, items, count) => shuffle(rng, items).slice(0, count);
