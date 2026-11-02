export const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SIGNATURE = 0xad;
const LIMITS = { unit: 10, lesson: 31, tier: 3, misconception: 7, streak: 1 };
const checksum = (value) => {
  let x = 0x2b;
  for (let i = 0; i < 3; i++) x = ((x * 17) ^ ((value >>> (i * 7)) & 0x7f)) & 0x3f;
  return x;
};
const pack = (p) => ((((p.unit - 1) & 7) << 11) | ((p.lesson & 31) << 6) | ((p.tier & 3) << 4) | ((p.misconception & 7) << 1) | (p.streak ? 1 : 0));
function encode(payload) {
  for (const key of Object.keys(LIMITS)) if (!Number.isInteger(Number(payload[key])) || Number(payload[key]) < (key === "unit" ? 1 : 0) || Number(payload[key]) > LIMITS[key]) throw new RangeError(`Invalid ${key}`);
  const core = pack(payload);
  // Three unit bits hold the within-block code; the version marker carries
  // extension bits for the canonical ten-unit curriculum.
  const marker = (SIGNATURE << 2) | ((Number(payload.unit) - 1) >>> 3);
  const bits = ((marker << 20) | (core << 6) | checksum(core)) >>> 0;
  return Array.from({ length: 6 }, (_, i) => ALPHABET[(bits >>> (25 - i * 5)) & 31]).join("");
}
function decode(seedString) {
  const seed = String(seedString || "").trim().toUpperCase();
  if (seed.length !== 6 || [...seed].some((c) => !ALPHABET.includes(c))) throw new Error("Enter a six-character seed using A–Z and 2–9 (without I, O, 0, or 1).");
  let bits = 0;
  for (const char of seed) bits = (bits * 32 + ALPHABET.indexOf(char)) >>> 0;
  const marker = bits >>> 20;
  const core = (bits >>> 6) & 0x3fff;
  if ((marker >>> 2) !== SIGNATURE || (bits & 0x3f) !== checksum(core)) throw new Error("That seed has an invalid checksum or version.");
  const unit = (((marker & 3) << 3) | ((core >>> 11) & 7)) + 1;
  return { unit, lesson: (core >>> 6) & 31, tier: (core >>> 4) & 3, misconception: (core >>> 1) & 7, streak: Boolean(core & 1) };
}
export const SeedEngine = Object.freeze({ encode, decode, alphabet: ALPHABET });
