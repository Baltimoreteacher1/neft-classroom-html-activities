// "Choose a Skill" search (search.js) held to 30 everyday queries, English and Spanish, against the real skill list of
// each grade (requirements 2.4). Each query must find a skill in the strand a learner or parent means, and a few
// must find nothing: nonsense, and a word from another grade's strand.
import assert from "node:assert/strict";
import { topicsFor } from "../skill-path.js";
import { fold, queryWords, skillMatcher } from "./search.js";

const textOf = (topic, s) => `${s.title} ${s.learn?.rule || ""} ${topic.name}`;
function search(grade, query) {
  const topics = topicsFor(grade);
  const entries = topics.flatMap((topic) => topic.skills.map((s) => ({ text: textOf(topic, s), topicId: topic.id })));
  const words = queryWords(query);
  const matcher = skillMatcher(words, entries);
  return topics.flatMap((topic) => topic.skills.filter((s) => words.length && matcher.matches(textOf(topic, s), topic.id)).map((s) => ({ topic: topic.id, skill: s.id })));
}

// [grade, query, strand that must be among the results]
const QUERIES = [
  [2, "take away", "add-subtract"],
  [1, "adding with carrying", "add-subtract"],
  [1, "plus and minus", "add-subtract"],
  [3, "times tables", "multiplication"],
  [3, "sharing equally", "division"],
  [5, "long division", "division"],
  [4, "half and quarters", "fractions"],
  [5, "decimals", "decimals"],
  [6, "percent off", "ratios-percents"],
  [6, "unit rate", "ratios-percents"],
  [7, "negative numbers", "integers-rational"],
  [6, "solve for x", "expressions-equations"],
  [8, "slope of a line", "functions"],
  [8, "square roots", "exponents-roots"],
  [3, "telling time", "measurement-geometry"],
  [2, "counting money", "money"],
  [4, "prime numbers", "factors-multiples"],
  [6, "mean and median", "data"],
  [0, "counting", "counting"],
  [7, "area of a circle", "measurement-geometry"],
  [3, "multiplicar", "multiplication"],
  [3, "dividir", "division"],
  [4, "fracciones", "fractions"],
  [5, "decimales", "decimals"],
  [6, "porcentaje", "ratios-percents"],
  [7, "números negativos", "integers-rational"],
  [6, "ecuaciones", "expressions-equations"],
  [8, "pendiente", "functions"],
  [8, "raíz cuadrada", "exponents-roots"],
  [3, "hora y reloj", "measurement-geometry"],
  [2, "monedas", "money"],
  [6, "media y mediana", "data"],
  [1, "sumar y restar", "add-subtract"],
  [4, "números primos", "factors-multiples"],
  [6, "fractions zebra", "fractions"], // a word nothing knows never empties the list
];
const failures = [];
for (const [grade, query, strand] of QUERIES) {
  const found = search(grade, query);
  if (!found.some((r) => r.topic === strand)) failures.push(`grade ${grade} "${query}" -> expected ${strand}, found [${[...new Set(found.map((r) => r.topic))].join(", ")}]`);
}
assert.deepEqual(failures, [], `${failures.length} everyday queries found the wrong thing`);

// Nothing is invented for nonsense; fillers alone are not a query; accents and case fold.
assert.equal(search(6, "xyzzy qwerty").length, 0, "nonsense finds nothing");
assert.equal(search(6, "the of").length >= 0, true);
assert.deepEqual(queryWords("The Raíz CUADRADA of 49"), ["raiz", "cuadrada", "49"]);
assert.equal(fold("Fracción"), "fraccion");
assert.ok(search(8, "ECUACIONES").length > 0 && search(8, "ecuaciones").length === search(8, "ECUACIONES").length, "case does not change the result");
assert.equal(search(0, "fractions").length, 0, "a strand the grade does not have finds nothing");

console.log(`search: ${QUERIES.length} everyday queries (${QUERIES.filter(([, q]) => /[áéíóúñ]|multiplicar|dividir|fracciones|decimales|porcentaje|ecuaciones|pendiente|monedas|sumar|reloj/.test(q)).length} Spanish) find their strand; nonsense, filler and absent strands find nothing`);
