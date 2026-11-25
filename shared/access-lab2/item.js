// ACCESS Practice Lab 2.0 item model and validator.
//
// An item is original classroom practice inspired by the four ACCESS domains. It never reproduces or claims parity
// with official content. Shape:
//   { id, domain, band, gradeBand, kluTags[], standardTags[],
//     task: { type, stimulus: { id, kind, text, cluster? }, prompt },
//     response: { mode, constraints },
//     scoring: { type: key|rubric|selfcheck, key?, rubric? },
//     supports: { audio, images: [{ id, alt }], glossary: [{ term, definition }], ttsAllowed },
//     provenance, reviewState, reviewers[], exercises[] }
// provenance and reviewState reuse the content-schema v2 vocabulary (origins, review states, human reviewers).
//
// validateItem(item) returns string[] of problems ([] means valid). It is synchronous, so contentHash may be null
// (unsealed) or a 64-hex hash; the async hash match belongs to the content-schema block validator.
import { ORIGINS, REVIEW_STATES, REVIEWER_ROLES } from "../content-schema/v2.mjs";
import {
  allStrings,
  BANDS,
  DOMAINS,
  FRAME_LEVEL_BY_BAND,
  GRADE_BANDS,
  isObj,
  isStr,
  KLUS,
  RESPONSE_MODES,
  SCORING_TYPES,
  STANDARDS,
  STIMULUS_KINDS,
  TASK_TYPES,
} from "./constants.js";

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;
const HASH = /^[0-9a-f]{64}$/;
const OBJECTIVE_MODES = ["select", "multi", "drag", "order"];

// Paper and pencil only: no manipulative wording anywhere in an item.
const MANIPULATIVE_RE =
  /\b(manipulatives?|cubes?|counters?|tiles?|base[- ]ten blocks?|pattern blocks?|linking blocks?|unifix|abacus|beads?)\b/i;
// An item must not claim to match or mimic official content.
const PARITY_RE =
  /\b(official (wida|access)|(same|identical|equivalent) (as|to) (the )?(real |official |actual )?(wida |access)|just like (the )?(real|actual|official)|mimics?|matches the (real|official)|wida (score|level)|proficiency level \d)\b/i;
// Labels a student must never see inside item text.
const LABEL_RE = /\b(esol|ell|iep|placement)\b/i;

const uniq = (list) => new Set(list).size === list.length;
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

function checkTags(item, add) {
  if (
    !Array.isArray(item.kluTags) ||
    item.kluTags.length === 0 ||
    !item.kluTags.every((k) => KLUS.includes(k))
  )
    add(`kluTags must be one or more of ${KLUS.join(", ")}`);
  if (
    !Array.isArray(item.standardTags) ||
    item.standardTags.length === 0 ||
    !item.standardTags.every((s) => STANDARDS.includes(s))
  )
    add(`standardTags must be one or more of ${STANDARDS.join(", ")}`);
}

function checkSupports(item, add) {
  const s = item.supports;
  if (!isObj(s)) return add("supports required");
  if (typeof s.audio !== "boolean") add("supports.audio must be true or false");
  if (typeof s.ttsAllowed !== "boolean") add("supports.ttsAllowed must be true or false");
  if (!Array.isArray(s.images)) add("supports.images must be an array");
  else
    s.images.forEach((img, i) => {
      if (!isObj(img) || !isStr(img.id)) add(`supports.images[${i}] needs an id`);
      else if (!isStr(img.alt)) add(`supports.images[${i}] needs alt text`);
    });
  if (!Array.isArray(s.glossary)) add("supports.glossary must be an array");
  else
    s.glossary.forEach((g, i) => {
      if (!isObj(g) || !isStr(g.term) || !isStr(g.definition))
        add(`supports.glossary[${i}] needs term and definition`);
    });
}

function checkTask(item, add) {
  const t = item.task;
  if (!isObj(t)) return add("task required");
  const spec = TASK_TYPES[item.domain]?.[t.type];
  if (!spec)
    add(
      `task.type "${t.type}" is not a ${item.domain} task type (${Object.keys(TASK_TYPES[item.domain] || {}).join(", ")})`,
    );
  if (!isStr(t.prompt)) add("task.prompt required");
  const st = t.stimulus;
  if (!isObj(st)) return add("task.stimulus required");
  if (!isStr(st.id) || !ID_RE.test(st.id))
    add("task.stimulus.id required (lowercase letters, digits, hyphens)");
  if (!STIMULUS_KINDS.includes(st.kind))
    add(`task.stimulus.kind must be one of ${STIMULUS_KINDS.join(", ")}`);
  if (st.kind !== "none" && st.kind !== "image" && !isStr(st.text))
    add("task.stimulus.text required (passage, transcript or prompt text)");
  const images = item.supports?.images ?? [];
  if ((st.kind === "image" || t.type === "describe-a-picture") && images.length === 0)
    add("picture tasks need supports.images with alt text");
  if (item.domain === "Listening") {
    if (st.kind !== "audio")
      add("Listening items need an audio stimulus (its text is the transcript)");
    if (item.supports?.audio !== true) add("Listening items need supports.audio true");
  }
  if (item.domain === "Reading" && !["text", "image"].includes(st.kind))
    add("Reading items need a text or image stimulus");
  return spec;
}

const optionIds = (list) => (Array.isArray(list) ? list.map((o) => o?.id) : []);

function checkConstraints(item, add) {
  const { mode, constraints: c } = item.response;
  if (!isObj(c)) return add("response.constraints required");
  if (mode === "select" || mode === "multi") {
    if (!Array.isArray(c.options) || c.options.length < 2)
      return add("response.constraints.options needs at least two options");
    if (!c.options.every((o) => isObj(o) && isStr(o.id) && isStr(o.text)))
      add("every option needs id and text");
    if (!uniq(optionIds(c.options))) add("option ids must be unique");
    if (!uniq(c.options.map((o) => String(o?.text).trim().toLowerCase())))
      add("two options have the same text");
  } else if (mode === "drag") {
    if (!Array.isArray(c.items) || c.items.length < 2) add("drag needs response.constraints.items");
    if (!Array.isArray(c.bins) || c.bins.length < 2) add("drag needs response.constraints.bins");
  } else if (mode === "order") {
    if (!Array.isArray(c.items) || c.items.length < 3)
      add("order needs at least three response.constraints.items");
  } else if (mode === "record") {
    // Recordings never leave the device.
    if (c.storage !== "device")
      add(
        'record responses must set constraints.storage to "device" (recordings never leave the device)',
      );
    if (
      c.maxTakes !== undefined &&
      !(Number.isInteger(c.maxTakes) && c.maxTakes >= 1 && c.maxTakes <= 5)
    )
      add("constraints.maxTakes must be 1 to 5");
    if ("maxSeconds" in c) add("no recording timers: constraints.maxSeconds is not allowed");
  } else if (mode === "type") {
    if (item.task?.type === "paragraph-with-frames") {
      const allowed = FRAME_LEVEL_BY_BAND[item.band] ?? [];
      if (!allowed.includes(c.frameLevel))
        add(
          `frames fade by band: a ${item.band} paragraph item uses frameLevel ${allowed.join(" or ")}`,
        );
      if (c.frameLevel !== "none" && !(Array.isArray(c.frames) && c.frames.length > 0))
        add("frameLevel other than none needs constraints.frames");
    }
  }
}

function checkKey(item, add) {
  const { mode, constraints: c = {} } = item.response;
  const key = item.scoring.key;
  if (mode === "select") {
    if (!optionIds(c.options).includes(key)) add("scoring.key must be an option id");
  } else if (mode === "multi") {
    const ids = optionIds(c.options);
    if (!Array.isArray(key) || key.length < 2 || !key.every((k) => ids.includes(k)) || !uniq(key))
      add("multi key must list two or more option ids");
  } else if (mode === "drag") {
    const itemIds = optionIds(c.items);
    const binIds = optionIds(c.bins);
    if (
      !isObj(key) ||
      !sameSet(Object.keys(key), itemIds) ||
      !Object.values(key).every((b) => binIds.includes(b))
    )
      add("drag key must map every item id to a bin id");
  } else if (mode === "order") {
    const ids = optionIds(c.items);
    if (!Array.isArray(key) || !sameSet(key, ids) || !uniq(key))
      add("order key must list every item id exactly once");
  }
}

function checkScoring(item, spec, add) {
  const sc = item.scoring;
  if (!isObj(sc) || !SCORING_TYPES.includes(sc.type))
    return add(`scoring.type must be one of ${SCORING_TYPES.join(", ")}`);
  if (spec && !spec.scoring.includes(sc.type))
    add(`${item.task?.type} items use ${spec.scoring.join(" or ")} scoring, not ${sc.type}`);
  if (sc.type === "key") {
    if (!OBJECTIVE_MODES.includes(item.response?.mode))
      add("key scoring needs select, multi, drag or order response");
    else checkKey(item, add);
  } else {
    const r = sc.rubric;
    if (!Array.isArray(r) || r.length < 3)
      add("rubric and selfcheck scoring need at least three criteria in scoring.rubric");
    else {
      if (!r.every((x) => isObj(x) && isStr(x.id) && isStr(x.label)))
        add("every rubric criterion needs id and label");
      if (!uniq(optionIds(r))) add("rubric criterion ids must be unique");
    }
  }
}

function checkProvenanceAndReview(item, add) {
  const p = item.provenance;
  if (!isObj(p)) add("provenance required");
  else {
    if (!ORIGINS.includes(p.origin)) add(`provenance.origin must be one of ${ORIGINS.join(", ")}`);
    if (p.origin === "generated" && !isStr(p.generator))
      add("generated items name their generator");
    if (!(p.generator === null || isStr(p.generator)))
      add("provenance.generator must be string or null");
    if (!(p.generatedAt === null || ISO_DATE.test(p.generatedAt || "")))
      add("provenance.generatedAt must be ISO or null");
    if (!Array.isArray(p.sourceRefs)) add("provenance.sourceRefs must be an array");
    if (!Number.isInteger(p.version) || p.version < 1)
      add("provenance.version must be a positive integer");
    if (!(p.supersedes === null || isStr(p.supersedes)))
      add("provenance.supersedes must be string or null");
    if (!(p.contentHash === null || HASH.test(p.contentHash || "")))
      add("provenance.contentHash must be null or 64 hex characters");
  }
  if (!REVIEW_STATES.includes(item.reviewState))
    add(`reviewState must be one of ${REVIEW_STATES.join(", ")}`);
  if (!Array.isArray(item.reviewers)) return add("reviewers must be an array");
  item.reviewers.forEach((r, i) => {
    const bad =
      !isObj(r) ||
      !isStr(r.name) ||
      !REVIEWER_ROLES.includes(r.role) ||
      !ISO_DATE.test(r.date || "") ||
      r.actor !== "human";
    if (bad) add(`reviewers[${i}] must be { name, role, date, actor: "human" }`);
  });
  if (item.reviewState === "reviewed" && item.reviewers.length === 0)
    add("a reviewed item needs a human reviewer (no model can approve)");
}

function checkWording(item, add) {
  for (const text of allStrings({
    task: item.task,
    response: item.response,
    scoring: item.scoring,
    supports: item.supports,
  })) {
    if (MANIPULATIVE_RE.test(text))
      add(`manipulative wording is not allowed (paper and pencil only): "${text.slice(0, 60)}"`);
    if (PARITY_RE.test(text))
      add(`items must not claim parity with official content: "${text.slice(0, 60)}"`);
    if (LABEL_RE.test(text))
      add(`program labels never appear in item text: "${text.slice(0, 60)}"`);
  }
}

/** Structural validation of one item. @returns {string[]} problems; [] means valid. */
export function validateItem(item) {
  const errors = [];
  if (!isObj(item)) return ["item must be an object"];
  const id = isStr(item.id) ? item.id : "?";
  const add = (m) => errors.push(`${id}: ${m}`);
  if (!isStr(item.id) || !ID_RE.test(item.id))
    add("id required (lowercase letters, digits, hyphens)");
  if (!DOMAINS.includes(item.domain))
    return [...errors, `${id}: domain must be one of ${DOMAINS.join(", ")}`];
  if (!BANDS.includes(item.band)) add(`band must be one of ${BANDS.join(", ")}`);
  if (!GRADE_BANDS.includes(item.gradeBand))
    add(`gradeBand must be one of ${GRADE_BANDS.join(", ")}`);
  checkTags(item, add);
  checkSupports(item, add);
  const spec = checkTask(item, add);
  if (!isObj(item.response) || !RESPONSE_MODES.includes(item.response.mode))
    add(`response.mode must be one of ${RESPONSE_MODES.join(", ")}`);
  else {
    if (spec && !spec.modes.includes(item.response.mode))
      add(
        `${item.task.type} items use ${spec.modes.join(" or ")} responses, not ${item.response.mode}`,
      );
    checkConstraints(item, add);
  }
  if (isObj(item.response)) checkScoring(item, spec, add);
  checkProvenanceAndReview(item, add);
  if (!Array.isArray(item.exercises) || item.exercises.length === 0 || !item.exercises.every(isStr))
    add("exercises must list one or more practice skill ids");
  checkWording(item, add);
  return errors;
}

export const isValidItem = (item) => validateItem(item).length === 0;
