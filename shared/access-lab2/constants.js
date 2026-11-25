// ACCESS Practice Lab 2.0: shared vocabulary for items, builders, the diagnostic and the Road plan.
// Plain browser-safe ESM. Original practice inspired by the four ACCESS domains; nothing here is official,
// and no band here is a WIDA proficiency level. Bands are practice bands used only on the teacher side.

export const DOMAINS = Object.freeze(["Listening", "Reading", "Speaking", "Writing"]);

/** Practice bands, easiest first. Teacher-side only; students never see these words. */
export const BANDS = Object.freeze(["early", "building", "strong"]);
export const BAND_RANK = Object.freeze({ early: 0, building: 1, strong: 2 });

/** Grade bands the lab ships (youngest first). */
export const GRADE_BANDS = Object.freeze(["K", "1", "2-3", "3-5", "6-8"]);

/** Key Language Uses (instructional focus tags) and ELD standard codes, by code and short name only. */
export const KLUS = Object.freeze(["Narrate", "Inform", "Explain", "Argue"]);
export const STANDARDS = Object.freeze(["ELD-SI", "ELD-LA", "ELD-MA", "ELD-SC", "ELD-SS"]);

export const RESPONSE_MODES = Object.freeze(["select", "multi", "drag", "order", "record", "type"]);
export const SCORING_TYPES = Object.freeze(["key", "rubric", "selfcheck"]);
export const STIMULUS_KINDS = Object.freeze(["text", "audio", "image", "none"]);

const OBJECTIVE_MODES = ["select", "multi", "drag", "order"];

/**
 * Task types per domain with the response modes and scoring types each allows.
 * `key` scoring needs an objective mode; speaking and writing are self-check (student) or rubric (teacher).
 */
export const TASK_TYPES = Object.freeze({
  Listening: {
    "listen-and-choose": { modes: ["select", "multi"], scoring: ["key"] },
    "listen-and-sort": { modes: ["drag"], scoring: ["key"] },
    "listen-and-order": { modes: ["order"], scoring: ["key"] },
    dictogloss: { modes: ["type"], scoring: ["selfcheck", "rubric"] },
    "follow-directions-on-paper": { modes: ["select", "multi"], scoring: ["selfcheck"] },
  },
  Speaking: {
    "describe-a-picture": { modes: ["record"], scoring: ["selfcheck", "rubric"] },
    retell: { modes: ["record"], scoring: ["selfcheck", "rubric"] },
    "explain-a-process": { modes: ["record"], scoring: ["selfcheck", "rubric"] },
    "give-an-opinion": { modes: ["record"], scoring: ["selfcheck", "rubric"] },
  },
  Reading: {
    "short-passage": { modes: OBJECTIVE_MODES, scoring: ["key"] },
    "vocabulary-in-context": { modes: OBJECTIVE_MODES, scoring: ["key"] },
    inference: { modes: OBJECTIVE_MODES, scoring: ["key"] },
    "text-features": { modes: OBJECTIVE_MODES, scoring: ["key"] },
  },
  Writing: {
    "sentence-level": { modes: ["type"], scoring: ["selfcheck", "rubric"] },
    "paragraph-with-frames": { modes: ["type"], scoring: ["selfcheck", "rubric"] },
    "revise-and-edit": { modes: ["select", "type"], scoring: ["key", "selfcheck", "rubric"] },
  },
});

/** Sentence-frame support fades as the practice band rises. */
export const FRAME_LEVEL_BY_BAND = Object.freeze({
  early: ["full"],
  building: ["partial"],
  strong: ["starter", "none"],
});

/** Practice test lengths and how many items each domain gets (each row sums to the length). */
export const LENGTHS = Object.freeze({ mini: 10, standard: 30, long: 60 });
export const DOMAIN_SHARES = Object.freeze({
  mini: { Listening: 3, Reading: 3, Speaking: 2, Writing: 2 },
  standard: { Listening: 8, Reading: 8, Speaking: 7, Writing: 7 },
  long: { Listening: 15, Reading: 15, Speaking: 15, Writing: 15 },
});

export const VIEWERS = Object.freeze(["student", "teacher"]);

/** Classroom aliases look like "Star 7". Real names never enter this module. */
export const ALIAS_RE = /^[A-Z][a-z]+ \d{1,3}$/;
export function assertAlias(alias) {
  if (typeof alias !== "string" || !ALIAS_RE.test(alias)) {
    throw new Error('alias must be a classroom alias such as "Star 7" (never a real name)');
  }
  return alias;
}

export const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
export const isStr = (v) => typeof v === "string" && v.trim().length > 0;

/** Every string value inside a value, depth first. */
export function allStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) allStrings(v, out);
  else if (isObj(value)) for (const v of Object.values(value)) allStrings(v, out);
  return out;
}

/** Words a student must never see on a practice screen: profile, band, program and placement labels. */
export const STUDENT_LABEL_RE =
  /\b(band|bands|level|levels|early|building|strong|beginner|intermediate|advanced|proficien\w*|placement|program|esol|ell|iep|tier|score|scored)\b/i;
