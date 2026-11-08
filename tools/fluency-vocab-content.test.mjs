import assert from "node:assert/strict";
import { vocabMarkup } from "../math/fluency-lab/studio/vocab-content.js";
import { VOCAB_BILINGUAL_DB } from "../math/fluency-lab/vocab.js";

const ratio = vocabMarkup("An equivalent ratio compares two quantities.");
assert.match(ratio, /<button type="button" class="vocab-word" data-vocab="equivalent ratio"/);
assert.match(vocabMarkup("La razón compara dos cantidades."), /data-vocab="ratio"/);
assert.match(vocabMarkup("A 30 percent model."), /data-vocab="percent"/);
assert.match(vocabMarkup("Find the unit rate."), /data-vocab="unit rate"/);
assert.match(
  vocabMarkup("Equivalent ratios use the same scale factor."),
  /data-vocab="equivalent ratio"/,
);
assert.match(
  vocabMarkup("Use a ratio table and double number line."),
  /data-vocab="ratio table".*data-vocab="double number line"/,
);
assert.match(
  vocabMarkup("Compare a part-to-part ratio with a part-to-whole ratio."),
  /data-vocab="part-to-part ratio".*data-vocab="part-to-whole ratio"/,
);
for (const key of [
  "equivalent ratio",
  "scale factor",
  "ratio table",
  "double number line",
  "part-to-part ratio",
  "part-to-whole ratio",
  "proportional relationship",
  "equal groups",
]) {
  const entry = VOCAB_BILINGUAL_DB[key];
  assert.ok(
    entry?.enTitle && entry.esTitle && entry.enDef && entry.esDef && entry.example,
    `${key} has bilingual definitions and an example`,
  );
  assert.match(
    entry.svg,
    /<svg[\s\S]*role="img"[\s\S]*aria-label=/,
    `${key} has an accessible illustration`,
  );
}
assert.ok(
  VOCAB_BILINGUAL_DB.ratio.svg.includes("<svg"),
  "ratio vocabulary opens an illustrated definition",
);
assert.ok(
  VOCAB_BILINGUAL_DB.percent.svg.includes("<svg"),
  "percent vocabulary opens an illustrated definition",
);
const geometry = vocabMarkup(
  "Fold the net of a rectangular prism or square pyramid. Find its surface area from every face.",
);
for (const [phrase, id] of [
  ["net", "net"],
  ["rectangular prism", "prism"],
  ["square pyramid", "pyramid"],
  ["surface area", "surface-area"],
  ["face", "face"],
]) {
  assert.match(
    geometry,
    new RegExp(`data-vocab="${id}"[^>]*>${phrase}`),
    `${phrase} opens its illustrated definition`,
  );
  const entry = VOCAB_BILINGUAL_DB[id];
  assert.ok(
    entry?.enTitle && entry.esTitle && entry.enDef && entry.esDef && entry.example,
    `${phrase} has bilingual instructional content`,
  );
  assert.match(
    entry.svg,
    /<svg[^>]*role="img"[^>]*aria-label=/,
    `${phrase} illustration has an accessible name`,
  );
}

const escaped = vocabMarkup('<img src=x onerror="alert(1)"> ratio');
assert.doesNotMatch(escaped, /<img\b/i, "student-facing vocabulary text is escaped before linking");
assert.match(escaped, /&lt;img/);

console.log(
  "fluency-vocab-content: bilingual links, illustrated definitions, and HTML escaping passed.",
);
