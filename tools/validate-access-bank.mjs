#!/usr/bin/env node
/**
 * Publisher-grade content validator for the ACCESS assessment bank (access-practice-lab/content/bank/*.json).
 * Deterministic checks only: it proves a set is complete, consistent and answerable. It does not prove the content is
 * accurate or well written; that needs human review, which no item here claims to have had.
 *   node tools/validate-access-bank.mjs                 validate every set, print a summary, exit 1 on any error
 *   node tools/validate-access-bank.mjs --file <path>   validate one set (used while authoring)
 * Checks: engine schema, WIDA metadata (codes come from the shared catalog), grade-cluster fit, stimulus completeness and
 * size, domain completeness (audio script and turns, speaking and writing configuration, rubric reference), answer keys,
 * answer-position balance, answer-length cues, a wrong-answer note and misconception tag for every distractor, three support
 * tiers that do not hand over the answer, duplicate and near-duplicate items, listening tasks that need little reading,
 * unsupported scoring claims, accessibility fields, and ids unique across the whole bank.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateMeta } from "../access-practice-lab/src/acc/content/item-meta.js";
import { validateSet } from "../access-practice-lab/src/acc/engine/schema.js";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
export const BANK_DIR =
  process.env.ACCESS_BANK_DIR || join(REPO_ROOT, "access-practice-lab/content/bank");
const words = (t) =>
  String(t || "")
    .toLowerCase()
    .match(/[\p{L}\p{N}']+/gu) || [];
const wc = (t) => words(t).length;
const SCORE_CLAIM =
  /\b(your (?:wida|access) (?:score|level)|proficiency level|scale score|you (?:are|will be) (?:level|at level|proficient)|predicts? your)\b/i;
const TIMER = /\b(hurry|countdown|beat the clock|race against|time is running)\b/i;

export function loadBank(dir = BANK_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort()
    .map((f) => ({ file: f, set: JSON.parse(readFileSync(join(dir, f), "utf8")) }));
}

const shingles = (text, k = 3) => {
  const w = words(text);
  const out = new Set();
  for (let i = 0; i + k <= w.length; i++) out.add(w.slice(i, i + k).join(" "));
  return out;
};
const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
};
const itemText = (item) =>
  [
    item.stem,
    ...(item.options || []).map((o) => o.text),
    item.ordering?.items?.map((i) => i.text).join(" "),
    item.dropdown?.template,
    item.matching?.left?.map((l) => l.text).join(" "),
    item.dragDrop?.tokens?.map((t) => t.text).join(" "),
  ]
    .filter(Boolean)
    .join(" ");

/** Per-set checks. Returns { errors, warnings }. */
export function checkSet(set, file) {
  const errors = [];
  const warnings = [];
  const E = (m) => errors.push(`${file}: ${m}`);
  const base = validateSet(set);
  for (const e of base.errors) E(e);
  if (!["Listening", "Reading", "Speaking", "Writing"].includes(set.domain))
    E("set.domain required");
  if (!set.bank || set.bank.version !== 1) E("set.bank.version must be 1");
  if (set.bank?.provenance?.source !== "original") E("set.bank.provenance.source must be original");
  if (set.bank?.reviewStatus === "human-reviewed")
    E("set.bank.reviewStatus may not claim human review");
  if (!Number.isFinite(set.minutes) || set.minutes < 5) E("set.minutes required");
  const items = set.items || [];
  if (items.length < 5 || items.length > 12) E(`a set holds 5 to 12 items (has ${items.length})`);
  for (const item of items) {
    if (item.domain !== set.domain)
      E(`${item.id}: domain ${item.domain} does not match the set (${set.domain})`);
    errors.push(...validateMeta(item, set).map((m) => `${file}: ${m}`));
    const stim = set.stimuli?.find((s) => s.id === item.stimulus);
    const m = item.meta || {};
    // stimulus completeness by domain
    if (set.domain === "Reading" && stim && !["passage", "table", "image"].includes(stim.kind))
      E(`${item.id}: a Reading item needs a passage, table or image stimulus`);
    if (set.domain === "Listening") {
      if (stim?.kind !== "audio") E(`${item.id}: a Listening item needs an audio stimulus`);
      else {
        if (stim.maxPlays !== 2) E(`${stim.id}: maxPlays must be 2`);
        if (stim.transcript !== true)
          E(`${stim.id}: transcript must be true (learning-mode transcript)`);
        const spoken = stim.turns?.length
          ? stim.turns.map((t) => `${t.speaker}: ${t.text}`).join(" ")
          : stim.script;
        if (stim.script !== spoken && stim.turns?.length)
          E(
            `${stim.id}: script must equal the joined turns exactly (the spoken text and the transcript are one source)`,
          );
        if (wc(spoken) < 45)
          E(`${stim.id}: a listening text needs at least 45 words (has ${wc(spoken)})`);
        if (wc(spoken) > 260)
          E(
            `${stim.id}: a listening text over 260 words is too long to hold in two plays (${wc(spoken)})`,
          );
        // listening should not be a reading test: little text on screen
        const onScreen = wc(item.stem) + (item.options || []).reduce((n, o) => n + wc(o.text), 0);
        if (item.type === "listening-response" && onScreen > 75)
          E(`${item.id}: too much to read for a listening item (${onScreen} words; max 75)`);
        if (
          item.type !== "listening-response" &&
          !["ordering", "matching", "drag-drop", "dropdown", "multiple-select"].includes(item.type)
        )
          E(
            `${item.id}: a Listening item is a listening-response, ordering, matching, drag-drop, dropdown or multiple-select`,
          );
      }
    }
    if (set.domain === "Speaking") {
      if (item.type !== "speaking-response")
        E(`${item.id}: a Speaking item is a speaking-response`);
      const s = item.speaking || {};
      if (!(s.prepSeconds >= 30 && s.prepSeconds <= 45))
        E(`${item.id}: speaking.prepSeconds must be 30 to 45`);
      if (!(s.recordSeconds >= 30 && s.recordSeconds <= 120))
        E(`${item.id}: speaking.recordSeconds must be 30 to 120`);
      if (!Array.isArray(s.checklist) || s.checklist.length < 3)
        E(`${item.id}: speaking.checklist needs 3 or more self-check lines`);
      if (!Array.isArray(s.exemplar) || s.exemplar.length < 3)
        E(
          `${item.id}: speaking.exemplar needs 3 or more characteristics of a strong response (teacher guidance)`,
        );
    }
    if (set.domain === "Writing") {
      if (item.type !== "constructed-response")
        E(`${item.id}: a Writing item is a constructed-response`);
      const c = item.constructed || {};
      if (!Array.isArray(c.checklist) || c.checklist.length < 3)
        E(`${item.id}: constructed.checklist needs 3 or more lines`);
      if (!Array.isArray(c.exemplar) || c.exemplar.length < 3)
        E(
          `${item.id}: constructed.exemplar needs 3 or more characteristics of a strong response (teacher guidance)`,
        );
      if (!(c.minWords >= 20)) E(`${item.id}: constructed.minWords must be at least 20`);
    }
    // stimulus size by grade for reading passages
    if (stim?.kind === "passage") {
      const n = stim.paragraphs.join(" ").split(/\s+/).length;
      const [lo, hi] = set.grade === "3-5" ? [70, 330] : [120, 480];
      if (n < lo || n > hi)
        E(`${stim.id}: a ${set.grade} passage is ${lo} to ${hi} words (has ${n})`);
    }
    // objective-answer hygiene
    if (["multiple-choice", "listening-response"].includes(item.type)) {
      const correct = item.options.find((o) => o.id === item.answer);
      const lens = item.options.map((o) => wc(o.text));
      const others = item.options.filter((o) => o.id !== item.answer).map((o) => wc(o.text));
      if (correct && wc(correct.text) > Math.max(...others) * 1.6 + 3)
        warnings.push(
          `${file}: ${item.id}: the correct choice is much longer than the others (length cue)`,
        );
      if (/\b(all|none) of the above\b/i.test(JSON.stringify(item.options)))
        E(`${item.id}: no "all/none of the above"`);
      if (Math.max(...lens) > 40) E(`${item.id}: a choice over 40 words`);
    }
    // supports must not give the answer away
    const ans = [];
    if (item.options)
      for (const o of item.options) if ([].concat(item.answer).includes(o.id)) ans.push(o.text);
    for (const a of ans) {
      const key = a.toLowerCase();
      if (
        key.length > 12 &&
        [item.support?.clue, item.support?.frame].some((t) =>
          String(t || "")
            .toLowerCase()
            .includes(key),
        )
      )
        E(`${item.id}: a clue or frame states the correct choice word for word`);
    }
    if (item.support?.model) {
      const sim = jaccard(shingles(item.support.model), shingles(itemText(item)));
      if (sim > 0.25)
        E(
          `${item.id}: the mentor model is too close to the task itself (overlap ${sim.toFixed(2)}); it must be a parallel example on a different topic`,
        );
      if (!/mentor example|parallel example|for example|example/i.test(item.support.model))
        E(`${item.id}: support.model should be labelled as an example`);
    }
    // student-visible claims
    const visible = JSON.stringify([
      item.stem,
      item.options,
      item.explanation,
      item.support,
      item.distractors,
    ]);
    if (SCORE_CLAIM.test(visible))
      E(`${item.id}: unsupported scoring or level claim in student-visible text`);
    if (TIMER.test(visible)) E(`${item.id}: timer or speed language`);
    if (m.facts && !Array.isArray(m.facts)) E(`${item.id}: meta.facts must be a list`);
  }
  // answer positions
  const pos = items
    .filter((i) => ["multiple-choice", "listening-response"].includes(i.type))
    .map((i) => i.options.findIndex((o) => o.id === i.answer));
  if (pos.length >= 4) {
    const counts = [0, 1, 2, 3].map((p) => pos.filter((x) => x === p).length);
    if (Math.max(...counts) / pos.length > 0.5)
      E(`correct answers sit at one position too often (${counts.join("/")})`);
  }
  // stimulus accessibility
  for (const s of set.stimuli || []) {
    if (s.kind === "image" && !(s.alt && s.alt.length > 15))
      E(`${s.id}: image needs descriptive alt text`);
    if (s.kind === "table" && !s.caption) E(`${s.id}: table needs a caption`);
    if (s.kind === "image" && s.src && !existsSync(join(REPO_ROOT, s.src.replace(/^\//, ""))))
      E(`${s.id}: image file missing (${s.src})`);
    if (!items.some((i) => i.stimulus === s.id)) E(`${s.id}: stimulus used by no item`);
  }
  return { errors, warnings };
}

/** Whole-bank checks: unique ids and near-duplicate items. */
export function checkBank(sets) {
  const errors = [];
  const warnings = [];
  const ids = new Map();
  const setIds = new Set();
  const all = [];
  for (const { file, set } of sets) {
    if (setIds.has(set.id)) errors.push(`${file}: duplicate set id ${set.id}`);
    setIds.add(set.id);
    for (const item of set.items || []) {
      if (ids.has(item.id))
        errors.push(`${file}: item id ${item.id} already used in ${ids.get(item.id)}`);
      ids.set(item.id, file);
      // A speaking or writing task IS its prompt, so the prompt text counts when comparing tasks.
      const stim = ["Speaking", "Writing"].includes(item.domain)
        ? set.stimuli?.find((x) => x.id === item.stimulus)
        : null;
      const promptText = stim
        ? [(stim.paragraphs || []).join(" "), (stim.rows || []).flat().join(" ")].join(" ")
        : "";
      all.push({ file, item, sh: shingles(`${itemText(item)} ${promptText}`), grade: set.grade });
    }
  }
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++) {
      if (all[i].item.domain !== all[j].item.domain) continue;
      const s = jaccard(all[i].sh, all[j].sh);
      if (s >= 0.6)
        errors.push(
          `near-duplicate items ${all[i].item.id} and ${all[j].item.id} (similarity ${s.toFixed(2)})`,
        );
      else if (s >= 0.45)
        warnings.push(`similar items ${all[i].item.id} and ${all[j].item.id} (${s.toFixed(2)})`);
    }
  // near-identical stimuli
  const stims = [];
  for (const { file, set } of sets)
    for (const s of set.stimuli || [])
      stims.push({
        file,
        id: s.id,
        sh: shingles(
          (s.paragraphs || []).join(" ") +
            (s.script || "") +
            (s.turns || []).map((t) => t.text).join(" "),
          4,
        ),
      });
  for (let i = 0; i < stims.length; i++)
    for (let j = i + 1; j < stims.length; j++)
      if (stims[i].sh.size > 8 && jaccard(stims[i].sh, stims[j].sh) >= 0.5)
        errors.push(`near-duplicate stimuli ${stims[i].id} and ${stims[j].id}`);
  return { errors, warnings, itemCount: all.length };
}

export function summarize(sets) {
  const by = {};
  const bump = (k) => (by[k] = (by[k] || 0) + 1);
  for (const { set } of sets)
    for (const item of set.items || []) {
      bump(`grade ${set.grade}`);
      bump(`domain ${item.domain}`);
      bump(`${set.grade} ${item.domain}`);
      bump(`klu ${item.klu}`);
      bump(`context ${item.context}`);
      bump(item.meta?.wida?.explicit ? "wida explicit" : "wida supplementary");
    }
  return by;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fileArg = process.argv.indexOf("--file");
  const sets =
    fileArg > 0
      ? [
          {
            file: process.argv[fileArg + 1].split("/").pop(),
            set: JSON.parse(readFileSync(process.argv[fileArg + 1], "utf8")),
          },
        ]
      : loadBank();
  let errors = [];
  let warnings = [];
  for (const { file, set } of sets) {
    const r = checkSet(set, file);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
  if (fileArg < 0) {
    const r = checkBank(sets);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
  for (const w of warnings.slice(0, 30)) console.warn(`warn  ${w}`);
  for (const e of errors.slice(0, 80)) console.error(`ERROR ${e}`);
  const s = summarize(sets);
  console.log(
    `access-bank: ${sets.length} set(s), ${Object.entries(s)
      .filter(([k]) => k.startsWith("grade"))
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")}; ${errors.length} error(s), ${warnings.length} warning(s)`,
  );
  process.exit(errors.length ? 1 : 0);
}
