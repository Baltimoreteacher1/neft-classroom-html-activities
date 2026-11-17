// Experience compiler: the pipeline (docs/part2-integration-map.md "Compiled experiences").
//   compileExperience({ source, settings }) → { def, report, extract, plan }
// EXTRACT → DESIGN → GENERATE → VALIDATE, each a pure function in its own module. Deterministic by default: the same
// source and settings always give the same experience (only the id is random), with no model and no network.
import { designExperience } from "./design.js";
import { cleanSource, extractSource } from "./extract.js";
import { generateMission } from "./generate.js";
import { validateExperience } from "./validate.js";

export const ID_RE = /^x[a-z0-9]{8,12}$/;
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** A local experience key ("x" + 10 characters). The mission id inside the definition is the same with a dash. */
export function newExperienceId(random = Math.random) {
  let out = "x";
  for (let i = 0; i < 10; i++) out += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return out;
}
export const missionIdFor = (key) => `x-${String(key).slice(1)}`;

const PROBLEMS = {
  "too-short": [
    "The text is too short to build an experience from. Paste at least a few paragraphs (about 150 words or more).",
    "El texto es demasiado corto para crear una experiencia. Pega al menos unos párrafos (unas 150 palabras o más).",
  ],
  "too-few-facts": [
    "The compiler found too few factual statements in this text. Informational text with facts, causes and details works best.",
    "El compilador encontró muy pocos datos en este texto. Funciona mejor un texto informativo con datos, causas y detalles.",
  ],
};

/**
 * @param {{ source: { title?: string, text: string, kind?: "text"|"md"|"html" }, settings: object, id?: string }} input
 * @param {{ art?: string[], looks?: string[] }} [assets] art keys of the sim art module, when the caller has them
 * @returns {{ ok: boolean, def: object | null, report: object, extract: object, plan: object | null, key: string }}
 */
export function compileExperience({ source = {}, settings = {}, id } = {}, assets = {}) {
  const key = ID_RE.test(id || "") ? id : newExperienceId();
  const text = cleanSource(source.text, source.kind || "text");
  const extract = extractSource(text, { title: source.title });
  if (!extract.ok) {
    const problem = PROBLEMS[extract.error] || PROBLEMS["too-short"];
    return {
      ok: false,
      key,
      def: null,
      plan: null,
      extract,
      report: {
        ok: false,
        errors: [{ code: extract.error, where: "source", text: problem }],
        warnings: [],
        trace: {},
        branches: [],
        stats: {},
      },
    };
  }
  const plan = designExperience(extract, settings);
  const def = generateMission({
    extract,
    plan,
    settings,
    id: missionIdFor(key),
    source: { title: source.title },
  });
  const report = validateExperience(def, assets);
  return { ok: report.ok, key, def, report, extract, plan };
}

/**
 * What a learner downloads: the definition without the compiler's notes, and without the instructor's raw source
 * text unless "show source" was ticked. (The engine needs no source to play.)
 */
export function studentCopy(
  def,
  { showSource = Boolean(def?.compiled?.settings?.showSource) } = {},
) {
  const { compiled, source, ...rest } = JSON.parse(JSON.stringify(def));
  return { ...rest, ...(showSource && source ? { source } : {}) };
}
