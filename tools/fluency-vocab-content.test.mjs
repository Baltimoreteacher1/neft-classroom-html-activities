import assert from "node:assert/strict";
import { vocabMarkup } from "../math/fluency-lab/studio/vocab-content.js";
import { VOCAB_BILINGUAL_DB } from "../math/fluency-lab/vocab.js";

const ratio = vocabMarkup("An equivalent ratio compares two quantities.");
assert.match(ratio, /<button type="button" class="vocab-word" data-vocab="ratio"/);
assert.match(vocabMarkup("La razón compara dos cantidades."), /data-vocab="ratio"/);
assert.match(vocabMarkup("A 30 percent model."), /data-vocab="percent"/);
assert.match(vocabMarkup("Find the unit rate."), /data-vocab="unit rate"/);
assert.ok(
  VOCAB_BILINGUAL_DB.ratio.svg.includes("<svg"),
  "ratio vocabulary opens an illustrated definition",
);
assert.ok(
  VOCAB_BILINGUAL_DB.percent.svg.includes("<svg"),
  "percent vocabulary opens an illustrated definition",
);

const escaped = vocabMarkup('<img src=x onerror="alert(1)"> ratio');
assert.doesNotMatch(escaped, /<img\b/i, "student-facing vocabulary text is escaped before linking");
assert.match(escaped, /&lt;img/);

console.log(
  "fluency-vocab-content: bilingual links, illustrated definitions, and HTML escaping passed.",
);
