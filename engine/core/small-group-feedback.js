// Small-group feedback loop: Attempt → Diagnose → Explain → Revise → New attempt.
//
// Pure helpers behind the practice card. `diagnoseAnswer` names the SPECIFIC move a
// wrong numeric answer most likely came from, without ever stating the answer;
// `hintLadder` stages the hints; `supportLevel` separates independent success from
// success after help, which is what the evidence summary reports.
// Node-tested in small-group-feedback.test.mjs.

const num = (s) => {
  const t = String(s ?? "")
    .replace(/[,$%\s]/g, "")
    .replace(/−/g, "-");
  if (/^-?\d+(?:\.\d+)?$/.test(t)) return Number(t);
  const frac = t.match(/^(-?\d+)\/(\d+)$/);
  return frac ? Number(frac[1]) / Number(frac[2]) : null;
};

const numbersIn = (text) =>
  (
    String(text || "")
      .replace(/(\d),(\d{3})(?!\d)/g, "$1$2")
      .replace(/−/g, "-")
      .match(/-?\d+(?:\.\d+)?/g) || []
  ).map(Number);

const same = (a, b) => a !== null && b !== null && Math.abs(a - b) < 1e-6;

const DIAGNOSES = {
  reversed: [
    "Check the order. A ratio names the first quantity first.",
    "Revisa el orden. Una razón nombra primero la primera cantidad.",
  ],
  sign: [
    "Check the sign. Is the answer above or below zero?",
    "Revisa el signo. ¿La respuesta está arriba o abajo del cero?",
  ],
  magnitude: [
    "The digits are right but the size is off. Check where the decimal point or place value belongs.",
    "Los dígitos están bien, pero el tamaño no. Revisa el punto decimal o el valor posicional.",
  ],
  sum: [
    "That is the total of the numbers in the problem. Does the question ask you to add?",
    "Eso es el total de los números del problema. ¿La pregunta pide sumar?",
  ],
  difference: [
    "That is how far apart two numbers are. Does the question ask for a difference?",
    "Eso es la distancia entre dos números. ¿La pregunta pide una diferencia?",
  ],
  product: [
    "That multiplies numbers from the problem. Check what the question wants to find.",
    "Eso multiplica números del problema. Revisa qué quiere hallar la pregunta.",
  ],
  quotient: [
    "That divides numbers from the problem. Check whether to divide or to scale up.",
    "Eso divide números del problema. Revisa si debes dividir o escalar.",
  ],
  given: [
    "That number is already in the problem. What is the question asking you to find?",
    "Ese número ya está en el problema. ¿Qué te pide hallar la pregunta?",
  ],
  close: ["Very close. Recheck your last step.", "Muy cerca. Revisa tu último paso."],
};

/**
 * @param {{problem?: string, answer?: string}} item
 * @param {string} response what the student typed
 * @returns {{code: string, en: string, es: string} | null} null when nothing specific is known
 */
export function diagnoseAnswer(item, response) {
  const answerText = String(item?.answer ?? "").replace(/−/g, "-");
  const want = num(answerText.match(/-?\$?\d[\d,]*(?:\.\d+)?(?:\/\d+)?/)?.[0]);
  const raw = String(response ?? "")
    .replace(/−/g, "-")
    .trim();
  if (want === null || !raw) return null;

  // "2:5" for an answer of 5:2 — a swapped ratio is its own misconception.
  const ratio = (s) => String(s).match(/^(\d+(?:\.\d+)?)\s*(?::|to)\s*(\d+(?:\.\d+)?)$/i);
  const given = ratio(raw);
  const right = ratio(answerText.split(/[ .]/)[0]);
  if (
    given &&
    right &&
    same(Number(given[1]), Number(right[2])) &&
    same(Number(given[2]), Number(right[1]))
  )
    return { code: "reversed", en: DIAGNOSES.reversed[0], es: DIAGNOSES.reversed[1] };

  const got = num(raw.match(/-?\$?\d[\d,]*(?:\.\d+)?(?:\/\d+)?/)?.[0]);
  if (got === null || same(got, want)) return null;
  const pick = (code) => ({ code, en: DIAGNOSES[code][0], es: DIAGNOSES[code][1] });

  if (same(got, -want)) return pick("sign");
  const digitsOf = (n) =>
    String(Math.abs(n))
      .replace(/[.\-]|e.*/g, "")
      .replace(/^0+|0+$/g, "");
  if (digitsOf(got) && digitsOf(got) === digitsOf(want)) return pick("magnitude");

  const nums = numbersIn(item?.problem);
  if (nums.length >= 2) {
    const sum = nums.reduce((a, b) => a + b, 0);
    if (same(got, sum)) return pick("sum");
    for (let i = 0; i < nums.length; i++)
      for (let j = 0; j < nums.length; j++) {
        if (i === j) continue;
        if (i < j && same(got, nums[i] + nums[j])) return pick("sum");
        if (i < j && same(got, nums[i] * nums[j])) return pick("product");
        if (same(got, Math.abs(nums[i] - nums[j]))) return pick("difference");
        if (nums[j] !== 0 && same(got, nums[i] / nums[j])) return pick("quotient");
      }
  }
  if (nums.some((n) => same(n, got))) return pick("given");
  if (Math.abs(got - want) <= 1) return pick("close");
  return null;
}

/**
 * Three stages, each a bigger nudge: the authored hint, the first move of the worked
 * solution, then the worked steps themselves. The last stage is a marker the card
 * renders by opening its own solution; it never carries text of its own.
 */
export function hintLadder(item) {
  const stages = [];
  if (item?.hint) stages.push({ level: 1, en: item.hint, es: item.hintEs || "" });
  const first = item?.steps?.[0];
  const move = first?.do || first?.ask;
  if (move)
    stages.push({
      level: 2,
      en: `Start here: ${move}`,
      es: first?.doEs || first?.askEs ? `Empieza aquí: ${first.doEs || first.askEs}` : "",
    });
  if (item?.steps?.length) stages.push({ level: 3, steps: true, en: "", es: "" });
  return stages;
}

/** independent = right first try, no help; coached = right after a miss or a hint; shown = steps opened. */
export function supportLevel({ misses = 0, hints = 0, stepsShown = false } = {}) {
  if (stepsShown) return "shown";
  return misses || hints ? "coached" : "independent";
}

/**
 * Evidence summary from the per-card records the practice cards write to the store.
 * Counts only graded cards (Together, Your Turn, Prove It) — never the optional challenge.
 * @param {(key: string) => unknown} read store getter
 * @param {string[]} keys card keys, e.g. ["po-0", "pc-1"]
 */
export function summarizeEvidence(read, keys) {
  const out = { total: keys.length, independent: 0, coached: 0, shown: 0, open: 0, tags: {} };
  for (const key of keys) {
    const done = read(`${key}-done`);
    if (!done) {
      out.open++;
      continue;
    }
    const sup = read(`${key}-sup`);
    if (done === "shown" || sup === "shown") out.shown++;
    else if (sup === "coached") out.coached++;
    else out.independent++;
    const tag = read(`${key}-dx`);
    if (tag) out.tags[tag] = (out.tags[tag] || 0) + 1;
  }
  return out;
}

/** Plain-language names for the diagnosis codes, for the evidence page. */
export const DX_LABEL = {
  reversed: ["Swapped the order of the ratio", "Cambió el orden de la razón"],
  sign: ["Sign error", "Error de signo"],
  magnitude: ["Place-value or decimal slip", "Error de valor posicional o decimal"],
  sum: ["Added when the problem asks for something else", "Sumó cuando se pedía otra cosa"],
  difference: [
    "Subtracted when the problem asks for something else",
    "Restó cuando se pedía otra cosa",
  ],
  product: [
    "Multiplied when the problem asks for something else",
    "Multiplicó cuando se pedía otra cosa",
  ],
  quotient: [
    "Divided when the problem asks for something else",
    "Dividió cuando se pedía otra cosa",
  ],
  given: ["Answered with a number from the problem", "Respondió con un número del problema"],
  close: ["Near miss in the last step", "Casi correcto en el último paso"],
};
