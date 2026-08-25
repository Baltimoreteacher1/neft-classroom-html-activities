#!/usr/bin/env node
/**
 * audit-copy-panel-provenance.mjs — READ-ONLY forensic audit of the notebook
 * copy panels shipped in 82951ef0b.
 *
 * It answers one question per string: does this word exist in the lesson it is
 * printed on? Every classification below is a comparison between two strings
 * taken from the SAME lesson's config. Nothing is inferred from a title.
 *
 * Writes docs/copy-panel-provenance.md.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");

export const lessonIds = () =>
  readdirSync(LESSONS)
    .filter((d) => /^\d+-\d+$/.test(d))
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au - bu || al - bl;
    });

export const readConfig = (id) =>
  JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));

/** Every string in the config EXCEPT the notebook block — the panel may not be
 *  its own evidence. This is the same self-evidence trap validate:interactive-
 *  alignment documents. */
export function lessonCorpus(config) {
  const clone = JSON.parse(JSON.stringify(config));
  delete clone.notebook;
  const out = [];
  (function walk(v) {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  })(clone);
  return out.join("\n");
}

/** Corpus WITHOUT the vocabulary block, for judging whether a term is actually
 *  used by the lesson rather than merely defined by it. */
export function corpusWithoutVocabulary(config) {
  const clone = JSON.parse(JSON.stringify(config));
  delete clone.notebook;
  delete clone.vocabulary;
  const out = [];
  (function walk(v) {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  })(clone);
  return out.join("\n");
}

export const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9'\/×÷+=.\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const words = (s) => norm(s).split(" ").filter(Boolean);
const stem = (w) => (w.length > 6 ? w.slice(0, 6) : w);

/** Numbers a string ASSERTS. Bare integers and decimals; fractions counted as
 *  their two parts as well as the literal. */
export function numbersIn(s) {
  const out = new Set();
  for (const m of String(s || "").matchAll(/\d+(?:\.\d+)?/g)) {
    let v = m[0];
    if (v.includes(".")) v = String(Number(v));
    out.add(v);
  }
  return out;
}

export function classifyTerm(term, config, allVocab) {
  const vocab = config.vocabulary || [];
  const t = norm(term);
  const exact = vocab.find((v) => norm(v.term) === t);
  if (exact) return { klass: "verbatim", source: exact };
  const stemmed = vocab.find(
    (v) => words(v.term).map(stem).join(" ") === words(term).map(stem).join(" "),
  );
  if (stemmed) return { klass: "reworded", source: stemmed };
  const inProse = norm(lessonCorpus(config)).includes(t);
  if (inProse) return { klass: "in-lesson-prose-not-vocabulary", source: null };
  const owner = allVocab.get(t);
  if (owner) return { klass: "belongs-to-other-lesson", source: null, owner };
  return { klass: "no-source-in-lesson", source: null };
}

/** A definition is DERIVED if (nearly) every content word it uses also appears
 *  in the lesson's own definition of that term. New content words mean new prose. */
export function classifyMeaning(meaning, sourceDef) {
  if (!sourceDef) return { klass: "no-source-definition", novel: words(meaning) };
  const src = new Set(words(sourceDef).map(stem));
  const STOP = new Set(
    "a an the to of in on for and or is are be that this it its you your with as at by from into can do does not what when which who how than then so if all any each every one two more most own use uses used using".split(
      " ",
    ),
  );
  const novel = words(meaning)
    .map(stem)
    .filter((w) => !src.has(w) && !STOP.has(w) && w.length > 2);
  if (novel.length === 0) return { klass: "verbatim-or-shortened", novel: [] };
  if (novel.length <= 2) return { klass: "reworded", novel };
  return { klass: "new-prose", novel };
}

export function classifyRule(rule, config) {
  const corpus = norm(lessonCorpus(config));
  if (!rule) return { klass: "absent", novel: [] };
  if (corpus.includes(norm(rule))) return { klass: "verbatim-in-lesson", novel: [] };
  const STOP = new Set(
    "a an the to of in on for and or is are be that this it by from into = x".split(" "),
  );
  const novel = words(rule)
    .map(stem)
    .filter((w) => !STOP.has(w) && w.length > 2)
    .filter((w) => !corpus.includes(w));
  if (novel.length === 0) return { klass: "stated-in-lesson-different-wording", novel: [] };
  return { klass: "no-source-in-lesson", novel };
}

export function classifyExample(example, config) {
  if (!example) return { klass: "absent", invented: [] };
  const corpus = lessonCorpus(config);
  const corpusNums = numbersIn(corpus);
  const invented = [...numbersIn(example)].filter((n) => !corpusNums.has(n));
  if (invented.length === 0) return { klass: "numbers-from-lesson", invented: [] };
  return { klass: "numbers-chosen-not-from-lesson", invented };
}

/** Which OTHER lesson's corpus contains the mathematics this rule names?
 *  A rule whose distinctive words are absent here and present, together, in
 *  exactly one other lesson did not fail to be written — it was filed on the
 *  wrong lesson. */
export function ruleOwners(rule, selfId, corpora) {
  const STOP = new Set(
    "a an the to of in on for and or is are be that this it by from into all each per next total value step size".split(
      " ",
    ),
  );
  const key = norm(rule)
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^[0-9.]+$/.test(w));
  if (key.length === 0) return [];
  const scored = [];
  for (const [id, corpus] of corpora) {
    if (id === selfId) continue;
    const hits = key.filter((w) => corpus.includes(w.length > 6 ? w.slice(0, 6) : w)).length;
    scored.push({ id, score: hits / key.length });
  }
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score < 0.9) return [];
  // Only lessons tied with the best are named. A rule that scores equally well
  // against thirty lessons is generic English, not a misfiling.
  const tied = scored.filter((s) => s.score === best.score);
  if (tied.length > 3) return [];
  return tied.map((s) => s.id);
}

export function auditLesson(id, allVocab, corpora) {
  const config = readConfig(id);
  const cps = (config.notebook && config.notebook.checkpoints) || [];
  const box1 = cps.find((c) => c.box === 1);
  const box2 = cps.find((c) => c.box === 2);
  const result = {
    id,
    title: config.title || "",
    terms: [],
    rule: null,
    meaning2: null,
    example: null,
  };
  const usedCorpus = norm(corpusWithoutVocabulary(config));

  for (const item of (box1 && box1.copyPanel && box1.copyPanel.items) || []) {
    const c = classifyTerm(item.term, config, allVocab);
    const m = classifyMeaning(item.meaning, c.source && c.source.definition);
    result.terms.push({
      term: item.term,
      meaning: item.meaning,
      termClass: c.klass,
      owner: c.owner || null,
      meaningClass: m.klass,
      novel: m.novel,
      usedInLesson: usedCorpus.includes(norm(item.term)),
    });
  }
  if (box2 && box2.copyPanel) {
    result.rule = { text: box2.copyPanel.rule || "", ...classifyRule(box2.copyPanel.rule, config) };
    if (result.rule.klass === "no-source-in-lesson" && corpora) {
      const owners = ruleOwners(box2.copyPanel.rule, id, corpora);
      if (owners.length > 0) {
        result.rule.klass = "belongs-to-other-lesson";
        result.rule.owners = owners;
      }
    }
    result.meaning2 = box2.copyPanel.meaning || "";
    result.example = {
      text: box2.copyPanel.example || "",
      ...classifyExample(box2.copyPanel.example, config),
    };
  }
  result.declaredVocabCount = (config.vocabulary || []).length;
  return result;
}

export function buildVocabIndex(ids) {
  const map = new Map();
  for (const id of ids) {
    for (const v of readConfig(id).vocabulary || []) {
      const k = norm(v.term);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(id);
    }
  }
  const owners = new Map();
  for (const [k, list] of map) owners.set(k, list);
  return owners;
}

function main() {
  const ids = lessonIds();
  const allVocab = buildVocabIndex(ids);
  const corpora = new Map(ids.map((id) => [id, norm(lessonCorpus(readConfig(id)))]));
  const rows = ids.map((id) => auditLesson(id, allVocab, corpora));

  const tally = {};
  const bump = (k) => (tally[k] = (tally[k] || 0) + 1);
  for (const r of rows) {
    for (const t of r.terms) {
      bump(`term:${t.termClass}`);
      bump(`definition:${t.meaningClass}`);
      if (!t.usedInLesson) bump("term:defined-but-never-used-in-lesson");
    }
    if (r.rule) bump(`rule:${r.rule.klass}`);
    if (r.example) bump(`example:${r.example.klass}`);
  }

  const lines = [];
  lines.push("# Copy-panel provenance audit");
  lines.push("");
  lines.push(
    "Read-only forensic audit of the notebook copy panels shipped in `82951ef0b` and live on production from 2026-08-18 14:14 until `c549d8437` suppressed them.",
  );
  lines.push("");
  lines.push(
    "Every classification below compares two strings from the **same lesson's** `config.json`. The panel is never its own evidence: the corpus each panel is checked against is the lesson config with the `notebook` block removed.",
  );
  lines.push("");
  lines.push("## Totals");
  lines.push("");
  lines.push("| Classification | Count |");
  lines.push("| --- | ---: |");
  for (const k of Object.keys(tally).sort()) lines.push(`| ${k} | ${tally[k]} |`);
  lines.push("");
  lines.push("## Per lesson");
  lines.push("");
  for (const r of rows) {
    lines.push(`### ${r.id} — ${r.title}`);
    lines.push("");
    lines.push(`Declared vocabulary entries: ${r.declaredVocabCount}`);
    lines.push("");
    lines.push("| Term | Term provenance | Definition provenance | Used elsewhere in lesson |");
    lines.push("| --- | --- | --- | --- |");
    for (const t of r.terms) {
      const owner = t.owner ? ` (declared by ${t.owner.join(", ")})` : "";
      const novel = t.novel && t.novel.length ? ` — new words: ${t.novel.join(", ")}` : "";
      lines.push(
        `| ${t.term} | ${t.termClass}${owner} | ${t.meaningClass}${novel} | ${t.usedInLesson ? "yes" : "**no**"} |`,
      );
    }
    lines.push("");
    if (r.rule) {
      const owners = r.rule.owners
        ? ` — the mathematics this names belongs to ${r.rule.owners.join(", ")}`
        : "";
      lines.push(
        `- **Rule:** \`${r.rule.text}\` → **${r.rule.klass}**${owners}${r.rule.novel.length ? ` (words absent from the lesson: ${r.rule.novel.join(", ")})` : ""}`,
      );
      lines.push(`- **Meaning:** ${r.meaning2}`);
      lines.push(
        `- **Example:** \`${r.example.text}\` → **${r.example.klass}**${r.example.invented.length ? ` (numbers absent from the lesson: ${r.example.invented.join(", ")})` : ""}`,
      );
    } else {
      lines.push("- No box 2 copy panel.");
    }
    lines.push("");
  }

  writeFileSync(join(ROOT, "docs", "copy-panel-provenance.md"), lines.join("\n"));
  console.log("Totals:");
  for (const k of Object.keys(tally).sort()) console.log(`  ${String(tally[k]).padStart(4)}  ${k}`);
  console.log("\nWrote docs/copy-panel-provenance.md");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
