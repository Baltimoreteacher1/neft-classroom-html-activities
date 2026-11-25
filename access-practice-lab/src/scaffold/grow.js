// Grow-a-sentence: start with a short base sentence and add where / when / how / why, watching it grow.
// Pure: the order of the added parts is fixed so the sentence stays readable whichever buttons are pressed first.
export const GROW_PARTS = Object.freeze(["where", "when", "how", "why"]);

const trimEnd = (s) => String(s || "").trim().replace(/[.!?]+$/, "");

/**
 * @param {string} base   a complete short sentence, e.g. "The scientist measured the plant."
 * @param {{where?:string,when?:string,how?:string,why?:string}} parts  words the student chose for each part
 * @returns {{text:string, segments:{part:string,text:string}[]}} segments are the added pieces, so the UI can mark what is new
 */
export function growSentence(base, parts = {}) {
  const core = trimEnd(base);
  const segments = [];
  const add = (part, text) => {
    const t = String(text || "").trim();
    if (t) segments.push({ part, text: t });
  };
  add("how", parts.how);
  add("where", parts.where);
  add("when", parts.when);
  add("why", parts.why);
  // "why" is a clause and takes a comma; the others are phrases and read straight on.
  const phrases = segments.filter((s) => s.part !== "why").map((s) => s.text);
  const why = segments.find((s) => s.part === "why");
  let text = core + (phrases.length ? ` ${phrases.join(" ")}` : "");
  if (why) text += `, ${why.text}`;
  return { text: `${text}.`, segments };
}

export const growProgress = (parts = {}) => GROW_PARTS.filter((p) => String(parts[p] || "").trim()).length;
