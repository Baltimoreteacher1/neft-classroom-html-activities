// Class Insight codes (functions/_lib/pfa/insight-code.js): every result survives encode -> decode,
// and a code that was mistyped, truncated or tampered with is REFUSED, never misread as another
// student's result. Also holds the append-only tag list against the misconception taxonomy.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { TAG_LIST, encodeInsight, decodeInsight, CODE_RE } = await import(
  pathToFileURL(join(ROOT, "functions/_lib/pfa/insight-code.js")).href
);
const taxonomy = JSON.parse(
  readFileSync(join(ROOT, "data/misconception-taxonomy.json"), "utf8"),
).taxonomy;

// Tag list: every taxonomy tag present, no duplicates, fits in 6 bits.
for (const k of Object.keys(taxonomy))
  assert.ok(TAG_LIST.includes(k), `taxonomy tag ${k} missing from TAG_LIST (append it at the END)`);
assert.equal(new Set(TAG_LIST).size, TAG_LIST.length, "TAG_LIST has a duplicate");
assert.ok(TAG_LIST.length <= 64, "TAG_LIST outgrew 6 bits");

// Round trip over seeded random results.
let seed = 12345;
const rnd = (n) => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed % n;
};
let n = 0;
for (let i = 0; i < 5000; i++) {
  const total = 1 + rnd(16);
  const r = {
    lessonId: `${1 + rnd(10)}-${1 + rnd(15)}`,
    score: rnd(total + 1),
    total,
    conf: rnd(5) || null,
    revisit: [...new Set(Array.from({ length: rnd(5) }, () => 1 + rnd(total)))].sort(
      (a, b) => a - b,
    ),
    tags: [...new Set(Array.from({ length: rnd(4) }, () => TAG_LIST[rnd(TAG_LIST.length)]))],
    review: rnd(3),
  };
  const code = encodeInsight(r);
  assert.match(code, /^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/);
  const d = decodeInsight(code);
  assert.ok(d.ok, `round trip failed for ${JSON.stringify(r)}: ${d.error}`);
  assert.deepEqual(
    {
      lessonId: d.lessonId,
      score: d.score,
      total: d.total,
      conf: d.conf,
      revisit: d.revisit,
      tags: d.tags,
      review: d.review,
    },
    r,
  );
  // Lower case and Crockford look-alikes (O for 0, I/L for 1) still decode.
  assert.ok(decodeInsight(code.toLowerCase()).ok);
  n++;
}

// Every single-character substitution must be refused (CRC-8 catches all of them).
const base = encodeInsight({
  lessonId: "6-6",
  score: 7,
  total: 10,
  conf: 3,
  revisit: [2, 9],
  tags: ["sign-dropped"],
  review: 1,
});
const ALPH = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
let refused = 0;
let tried = 0;
for (let i = 0; i < base.length; i++) {
  if (base[i] === "-") continue;
  for (const ch of ALPH) {
    if (ch === base[i]) continue;
    tried++;
    if (!decodeInsight(base.slice(0, i) + ch + base.slice(i + 1)).ok) refused++;
  }
}
assert.equal(
  refused,
  tried,
  `${tried - refused} single-character typos decoded as a different result`,
);
// Two adjacent characters swapped: refused.
const sw = base.replace(/^(.)(.)/, "$2$1");
if (sw !== base) assert.equal(decodeInsight(sw).ok, false, "a swapped pair decoded");
// Truncated and junk input: refused, with a reason.
assert.equal(decodeInsight(base.slice(0, -1)).ok, false);
assert.equal(decodeInsight("HELLO-WORLD-12345").ok, false);
assert.equal(decodeInsight("").ok, false);
// The paste regex finds codes inside a teacher's spreadsheet text.
const pasted = `Ana, ${base}\nBen  ${encodeInsight({ lessonId: "3-3", score: 2, total: 9 })} (late)`;
assert.equal([...pasted.matchAll(CODE_RE)].length, 2);
// A code carries no name: encoding ignores any extra field.
assert.equal(
  encodeInsight({ lessonId: "6-6", score: 7, total: 10, name: "Ana" }),
  encodeInsight({ lessonId: "6-6", score: 7, total: 10 }),
);

console.log(
  `PASS insight-code: ${n} results round-tripped; ${tried}/${tried} single-character typos refused; tag list covers ${Object.keys(taxonomy).length} taxonomy tags`,
);
