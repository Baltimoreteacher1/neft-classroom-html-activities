// Scaffold Studio support-metadata schema, version 1. Pure data rules, no DOM, no dependency.
//
// A support set describes the supports for ONE text or activity: key words with glosses, sentence chunking, frames,
// home-language layers and audio references. Every support must say why it exists (`purpose`) and which can-do
// descriptors it serves (`canDo`), so a teacher can see the instructional reason and a reviewer can check it.
//
// `widaTargets` is a planning aid chosen by an author or teacher. It is never inferred from a student's work and never
// shown to students (docs/language-world-audit.md section 6).

export const SCHEMA_VERSION = 1;
export const BANDS = Object.freeze(["3-5", "6-8"]);
export const DOMAINS = Object.freeze(["Listening", "Reading", "Speaking", "Writing"]);
export const LANGS = Object.freeze(["es", "ar", "ht"]); // Spanish, Arabic, Haitian Creole
export const SUPPORT_TYPES = Object.freeze(["word", "chunk", "frame", "briefing", "rehearsal"]);

/** Review pipeline, lowest to highest. Only `approved` content may reach students in a production build. */
export const REVIEW_STATUS = Object.freeze(["draft", "native-reviewed", "wida-reviewed", "approved"]);
export const reviewRank = (s) => REVIEW_STATUS.indexOf(s);
/** Lab content that existed before Scaffold Studio and has never been through review. Carried, labelled, never "approved". */
export const LEGACY = "legacy-unreviewed";

/** How a piece of audio was made. `tts` is an explicit fallback and is flagged in the manifest. */
export const AUDIO_SOURCES = Object.freeze(["human", "tts"]);

const isStr = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const bilingual = (v) => isObj(v) && isStr(v.en);

/** `canDo` ids look like "R.3.interpret" or "S.2.explain": domain letter, WIDA-style level or "x", verb. Authors verify them. */
export const CAN_DO_ID = /^[LRSW]\.(?:[1-6]|x)\.[a-z]+(?:-[a-z]+)*$/;

function checkReview(r, path, errors) {
  if (!isObj(r)) return errors.push(`${path}.review is required`);
  if (![...REVIEW_STATUS, LEGACY].includes(r.status)) errors.push(`${path}.review.status must be one of ${[...REVIEW_STATUS, LEGACY].join(", ")}`);
  if (typeof r.machineDrafted !== "boolean") errors.push(`${path}.review.machineDrafted must be true or false`);
  if (r.machineDrafted && r.status === "approved" && !isStr(r.reviewedBy))
    errors.push(`${path}.review: machine-drafted content marked approved needs reviewedBy`);
}

function checkSupport(s, path, errors) {
  if (!isObj(s)) return errors.push(`${path} must be an object`);
  if (!isStr(s.id)) errors.push(`${path}.id is required`);
  if (!SUPPORT_TYPES.includes(s.type)) errors.push(`${path}.type must be one of ${SUPPORT_TYPES.join(", ")}`);
  if (!isStr(s.purpose, 12)) errors.push(`${path}.purpose must state the pedagogical purpose (12+ characters)`);
  if (!Array.isArray(s.canDo) || !s.canDo.length) errors.push(`${path}.canDo needs at least one can-do descriptor id`);
  else for (const id of s.canDo) if (!CAN_DO_ID.test(id)) errors.push(`${path}.canDo "${id}" is not a valid descriptor id`);
  if (s.widaTargets !== undefined && !(Array.isArray(s.widaTargets) && s.widaTargets.every((n) => Number.isInteger(n) && n >= 1 && n <= 6)))
    errors.push(`${path}.widaTargets must be integers 1-6`);
  checkReview(s.review, path, errors);
  if (s.type === "word") {
    if (!isStr(s.term)) errors.push(`${path}.term is required`);
    if (!bilingual(s.definition)) errors.push(`${path}.definition needs at least an English text`);
    if (!isStr(s.example)) errors.push(`${path}.example (an example sentence) is required`);
    if (s.glosses !== undefined) {
      if (!isObj(s.glosses)) errors.push(`${path}.glosses must be an object keyed by language`);
      else
        for (const [lang, g] of Object.entries(s.glosses)) {
          if (!LANGS.includes(lang)) errors.push(`${path}.glosses.${lang} is not a supported language (${LANGS.join(", ")})`);
          else if (!isStr(g.text)) errors.push(`${path}.glosses.${lang}.text is required`);
          else checkReview(g.review, `${path}.glosses.${lang}`, errors);
        }
    }
    if (s.image !== undefined && !(isStr(s.image.src) && isStr(s.image.alt, 4) && isStr(s.image.license)))
      errors.push(`${path}.image needs src, alt text and a recorded license`);
  }
  if (s.type === "chunk") {
    if (!isStr(s.sentence)) errors.push(`${path}.sentence is required`);
    if (!Array.isArray(s.chunks) || s.chunks.length < 2) errors.push(`${path}.chunks needs 2+ parts`);
    else {
      const ROLES = ["who", "did", "where", "when", "how", "why", "what"];
      let joined = "";
      for (const [i, c] of s.chunks.entries()) {
        if (!ROLES.includes(c.role)) errors.push(`${path}.chunks[${i}].role must be one of ${ROLES.join(", ")}`);
        if (!isStr(c.text)) errors.push(`${path}.chunks[${i}].text is required`);
        joined += (joined ? " " : "") + (c.text || "");
      }
      // The chunks must rebuild the sentence exactly, so the overlay can never show words the text does not contain.
      if (isStr(s.sentence) && joined.replace(/\s+/g, " ").trim() !== s.sentence.replace(/\s+/g, " ").trim())
        errors.push(`${path}.chunks must rebuild the sentence word for word`);
    }
    if (!bilingual(s.explain)) errors.push(`${path}.explain needs a plain-language explanation`);
  }
  if (s.type === "frame") {
    if (!Array.isArray(s.steps) || s.steps.length !== 4) errors.push(`${path}.steps needs the four fading versions (full, partial, hint, none)`);
    else
      for (const [i, st] of s.steps.entries())
        if (!isObj(st) || !["full", "partial", "hint", "none"].includes(st.step) || typeof st.text !== "string")
          errors.push(`${path}.steps[${i}] needs step and text`);
  }
  if (s.type === "briefing") {
    if (!bilingual(s.bigIdea)) errors.push(`${path}.bigIdea needs a plain-language big idea`);
    if (!Array.isArray(s.keyWords) || s.keyWords.length !== 4) errors.push(`${path}.keyWords needs exactly 4 word support ids`);
  }
  if (s.audio !== undefined) {
    if (!(isStr(s.audio.src) && AUDIO_SOURCES.includes(s.audio.source))) errors.push(`${path}.audio needs src and source (${AUDIO_SOURCES.join("|")})`);
    else if (s.audio.source === "human" && !isStr(s.audio.recordedBy)) errors.push(`${path}.audio human recordings need recordedBy`);
  }
}

/** Validate one support set. Returns { ok, errors }. */
export function validateSupportSet(set) {
  const errors = [];
  if (!isObj(set)) return { ok: false, errors: ["support set must be an object"] };
  if (set.schemaVersion !== SCHEMA_VERSION) errors.push(`schemaVersion must be ${SCHEMA_VERSION}`);
  if (!isStr(set.id)) errors.push("id is required");
  if (!BANDS.includes(set.band)) errors.push(`band must be one of ${BANDS.join(", ")}`);
  if (!DOMAINS.includes(set.domain)) errors.push(`domain must be one of ${DOMAINS.join(", ")}`);
  if (!isStr(set.unit)) errors.push("unit is required");
  if (!Array.isArray(set.supports) || !set.supports.length) errors.push("supports needs at least one entry");
  else {
    const seen = new Set();
    for (const [i, s] of set.supports.entries()) {
      checkSupport(s, `supports[${i}]`, errors);
      if (s?.id) {
        if (seen.has(s.id)) errors.push(`supports[${i}].id "${s.id}" is repeated`);
        seen.add(s.id);
      }
    }
  }
  return { ok: !errors.length, errors };
}
