// "How sure are you?" beside a selected-response answer, and what that adds to the evidence.
//
// A rating is optional and made BEFORE the answer is checked, so it is a real prediction, not a
// reaction to feedback. It never changes whether an answer is right. It adds two readings:
//  * a correct answer rated "guessing" is not yet secure, so spaced review brings it back;
//  * a wrong answer rated "sure" is the most useful miss to look at: a belief, not a slip.
// Counts only. There is no score, level or percentage of "calibration" anywhere.

export const SURE = Object.freeze([
  { id: 1, en: "Guessing", es: "Adivinando" },
  { id: 2, en: "I think so", es: "Creo que sí" },
  { id: 3, en: "Sure", es: "Seguro o segura" },
]);
export const MIN_RATED = 5;

/** 1, 2 or 3 — or null for anything else (an unrated answer stays unrated). */
export const normalizeSure = (v) => (v === 1 || v === 2 || v === 3 ? v : null);

/** What a rating adds to one checked answer: a flag and the sentence the learner sees. */
export function sureFlag(ok, sure) {
  const s = normalizeSure(sure);
  if (s === 3 && ok === false)
    return {
      flag: "sure-wrong",
      en: "You were sure, but this one was not right. That makes it worth a second look.",
      es: "Estabas seguro o segura, pero esta no era la respuesta. Vale la pena mirarla otra vez.",
    };
  if (s === 1 && ok === true)
    return {
      flag: "lucky",
      en: "You guessed and it was right. It will come back soon so you can make it your own.",
      es: "Adivinaste y era correcta. Volverá pronto para que la hagas tuya.",
    };
  if (s === 3 && ok === true)
    return {
      flag: "secure",
      en: "You were sure, and you were right.",
      es: "Estabas seguro o segura, y acertaste.",
    };
  return { flag: "", en: "", es: "" };
}

/** Every rated result in the lab's two record shapes: local `{record:{results}}` rows or a share's `{results}` map. */
export function ratedResults(records) {
  const rows = Array.isArray(records) ? records : Object.values(records || {});
  const out = [];
  for (const row of rows) {
    const results = row?.record?.results || row?.results;
    if (!results || typeof results !== "object") continue;
    for (const [id, r] of Object.entries(results)) {
      if (typeof r?.ok !== "boolean" || r.meaningful === false) continue;
      const sure = normalizeSure(r.sure);
      if (sure)
        out.push({ id, ok: r.ok, sure, skill: String(r.skill || ""), date: String(r.date || "") });
    }
  }
  return out;
}

/** The 3 × 2 table of rated answers, plus the items worth a look. Withheld under MIN_RATED answers. */
export function calibration(records) {
  const rated = ratedResults(records);
  const cells = {
    sureRight: 0,
    sureWrong: 0,
    thinkRight: 0,
    thinkWrong: 0,
    guessRight: 0,
    guessWrong: 0,
  };
  const cell = (r) => `${["", "guess", "think", "sure"][r.sure]}${r.ok ? "Right" : "Wrong"}`;
  for (const r of rated) cells[cell(r)] += 1;
  return {
    rated: rated.length,
    enough: rated.length >= MIN_RATED,
    cells,
    sureWrong: rated.filter((r) => r.sure === 3 && !r.ok),
    lucky: rated.filter((r) => r.sure === 1 && r.ok),
  };
}
