// The Language Upgrade Lab item and checker the tour demonstrates, on the projector and on audience phones.
// checkUpgrade is the lab's own rule (access-practice-lab/src/lang/scaffold-check.js); ITEM is the lab's
// "lu68-argue-phones" item (access-practice-lab/src/content/scaffold-items.js). tools/tour-live.test.mjs fails
// if either copy drifts from its source.

export const ITEM = {
  informal: "Phones in class are bad.",
  avoid: ["bad"],
  precision: ["distract", "distraction", "attention", "focus", "notifications", "harmful", "learning", "concentration"],
  connectors: ["because", "so", "which", "since", "as a result", "although", "however", "when", "after"],
  minAdded: 6,
  hint: "How exactly do phones affect students? Name the effect precisely.",
};

const escapeRe = (w) => String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasPhrase = (text, phrase) =>
  new RegExp(`(^|[^a-z'])${escapeRe(phrase.toLowerCase())}($|[^a-z'])`).test(String(text).toLowerCase());
const startsWord = (text, stem) =>
  new RegExp(`(^|[^a-z])${escapeRe(stem.toLowerCase())}`).test(String(text).toLowerCase());
const countWords = (text) => (String(text).match(/[A-Za-z0-9°']+/g) || []).length;
const FILLER = new Set(
  "a an the and or but so very really just quite too also then than that this these those it its he she they them we you i me my our your his her their is are was were be been am do does did to of in on at as by for with from up out about into it's thing things stuff".split(
    " ",
  ),
);
const contentWords = (text) => (String(text).toLowerCase().match(/[a-z0-9°']+/g) || []).filter((w) => !FILLER.has(w));

export function checkUpgrade(item, revised = "") {
  const text = String(revised).trim();
  const words = countWords(text);
  const base = countWords(item.informal);
  const norm = (x) => x.toLowerCase().replace(/\W+/g, " ").trim();
  const changed = norm(text) !== norm(item.informal);
  const avoidLeft = item.avoid.filter((w) => hasPhrase(text, w));
  const precisionUsed = item.precision.filter((w) => startsWord(text, w));
  const connectorsUsed = item.connectors.filter((w) => hasPhrase(text, w));
  const oldWords = new Set(contentWords(item.informal));
  const newWords = [...new Set(contentWords(text))].filter(
    (w) => !oldWords.has(w) && !item.connectors.includes(w) && !item.avoid.includes(w),
  );
  const need = Math.max(2, Math.ceil(item.minAdded / 2));
  const joined = connectorsUsed.some((c) => {
    const at = text.toLowerCase().search(new RegExp(`(^|[^a-z])${escapeRe(c)}($|[^a-z])`));
    const after = contentWords(text.slice(at + c.length + 1)).length;
    const before = contentWords(text.slice(0, Math.max(0, at))).length;
    return after >= 2 && (before >= 2 || /^(although|however|when|after|since)$/.test(c));
  });
  const checks = {
    detail: changed && words >= base + item.minAdded && newWords.length >= need,
    precision: changed && precisionUsed.length > 0 && avoidLeft.length === 0,
    connector: changed && joined,
  };
  const messages = [];
  if (!changed)
    messages.push(
      `Your revision is the same as the original. Change it so it says exactly what you mean. ${item.hint}`,
    );
  else {
    if (!checks.detail)
      messages.push(
        newWords.length < need
          ? "Add new information: what exactly, where, when, or how much? Repeating words does not add detail."
          : "Add one more detail: what exactly, where, when, or how much?",
      );
    if (avoidLeft.length) messages.push(`"${avoidLeft[0]}" is a general word. ${item.hint}`);
    else if (!precisionUsed.length) messages.push(`Name it exactly. ${item.hint}`);
    if (!checks.connector)
      messages.push(
        connectorsUsed.length
          ? `Put an idea on each side of "${connectorsUsed[0]}" so it joins two ideas, not just sits in the sentence.`
          : "Join two ideas with a connector such as because, so or which.",
      );
  }
  return {
    ok: Object.values(checks).every(Boolean),
    checks,
    messages: messages.length ? messages : ["You added new information, used a precise word and connected two ideas."],
  };
}

/** The three checks as the "dpc" bit string the room stores (detail, precision, connector). */
export const resultBits = (checks) => ["detail", "precision", "connector"].map((k) => (checks[k] ? "1" : "0")).join("");
