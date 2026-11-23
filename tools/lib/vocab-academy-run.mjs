// Vocabulary Academy — the validation run: corpus in, issues + stats out (pure apart from loadCorpus).
// The CLI (tools/validate-vocab-academy.mjs), the editorial sampler and the tests all call this, so
// "what counts as a defect" lives in exactly one place.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PLAN, SHIPPED_GRADES } from "../../access-practice-lab/src/vocab-academy/contract.js";
import { buildIndex, indexText } from "../build-vocab-academy-index.mjs";
import { loadReadability } from "./vocab-academy-lexical.mjs";
import { checkUnit } from "./vocab-academy-schema.mjs";
import {
  checkCorpus,
  checkGrade,
  gradeIdx,
  loadCorpus,
  morphForms,
  VA_DIR,
} from "./vocab-academy-scope.mjs";

const MORPH_TYPES = ["prefix", "suffix", "root", "base"];

/** Shape checks for content/vocab-academy/morphology.json (owned by the Word Study agent). */
export function checkMorphology(m) {
  const iss = [];
  const E = (code, loc, msg) => iss.push({ sev: "ERROR", code, file: m.file, loc, msg });
  if (m.parseError) {
    E("json-parse", "", `morphology.json does not parse: ${m.parseError}`);
    return iss;
  }
  const d = m.data;
  if (!d || d.schema !== 1 || !Array.isArray(d.parts) || !d.parts.length) {
    E("morph-dataset", "", "morphology.json needs schema 1 and a non-empty parts array");
    return iss;
  }
  const ids = new Set();
  for (const p of d.parts) {
    const at = `part ${p?.id ?? "?"}`;
    if (typeof p?.id !== "string" || !p.id) E("morph-dataset", at, "part has no id");
    else if (ids.has(p.id)) E("morph-dataset", at, `duplicate part id "${p.id}"`);
    else ids.add(p.id);
    if (typeof p?.form !== "string" || !p.form.trim()) E("morph-dataset", at, "part has no form");
    if (!MORPH_TYPES.includes(p?.type))
      E("morph-dataset", at, `part type "${p?.type}" is not one of ${MORPH_TYPES.join(" ")}`);
    if (typeof p?.meaning !== "string" || !p.meaning.trim())
      E("morph-dataset", at, "part has no meaning");
    if (p?.origin_certain === false && !String(p?.notes ?? "").trim())
      E("morph-dataset", at, "origin_certain is false but notes does not say what is doubtful");
  }
  const seen = new Set();
  for (const dv of d.derivations ?? []) {
    const at = `derivation ${dv?.word ?? "?"}`;
    if (typeof dv?.word !== "string" || !dv.word) E("morph-dataset", at, "derivation has no word");
    else if (seen.has(`${dv.word}/${dv.pos}`))
      E("morph-dataset", at, `duplicate derivation "${dv.word}/${dv.pos}"`);
    else seen.add(`${dv.word}/${dv.pos}`);
    if (!Array.isArray(dv?.parts) || !dv.parts.length)
      E("morph-dataset", at, "derivation has no parts");
    else
      for (const x of dv.parts)
        if (typeof x !== "string" || (!x.startsWith("base:") && !ids.has(x)))
          E("morph-dataset", at, `part "${x}" is neither a known part id nor "base:<word>"`);
  }
  return iss;
}

/** Counts used by the validator summary and the editorial report. */
export function corpusStats(corpus) {
  const per = {};
  const total = { grades: 0, units: 0, words: 0, passages: 0, questions: 0, constructed: 0 };
  for (const g of SHIPPED_GRADES) {
    per[g] = {
      planUnits: PLAN[g].units,
      planWords: PLAN[g].units * PLAN[g].words,
      scopeUnits: 0,
      scopeWords: 0,
      units: 0,
      words: 0,
      passages: 0,
      questions: 0,
      constructed: 0,
    };
    const gr = corpus.grades.get(g)?.data;
    for (const u of gr?.units ?? []) {
      per[g].scopeUnits++;
      per[g].scopeWords += (u?.words ?? []).length;
    }
  }
  for (const u of corpus.units) {
    const p = per[u.g];
    if (!p || !u.data) continue;
    p.units++;
    p.words += (u.data.words ?? []).length;
    if (u.data.passage) p.passages++;
    p.questions += (u.data.passage?.qs ?? []).length;
    p.constructed += (u.data.check?.constructed ?? []).length;
  }
  for (const g of SHIPPED_GRADES) {
    for (const k of ["units", "words", "passages", "questions", "constructed"])
      total[k] += per[g][k];
    if (per[g].scopeUnits) total.grades++;
  }
  return { per, total };
}

const gradeOfFile = (file) => /\/g(K|\d{1,2})\//.exec(file ?? "")?.[1] ?? null;

/**
 * Run every check over a loaded corpus.
 * @param {ReturnType<typeof loadCorpus>} corpus
 * @param {{ complete?: boolean, onlyGrade?: string|null, fk?: (t:string)=>number, root?: string }} [opts]
 * @returns {{ issues: object[], stats: ReturnType<typeof corpusStats>, fatal: string|null, missingParts: Map<string,number> }}
 */
export function validateCorpus(corpus, opts = {}) {
  const { complete = false, onlyGrade = null, fk, root } = opts;
  const issues = [];
  const add = (sev, code, file, loc, msg) => issues.push({ sev, code, file, loc, msg });
  const stats = corpusStats(corpus);

  // a sweep that measured nothing proves nothing
  const scoped = onlyGrade
    ? [...corpus.grades.keys()].filter((g) => g === onlyGrade)
    : [...corpus.grades.keys()];
  let fatal = null;
  if (onlyGrade && !SHIPPED_GRADES.includes(onlyGrade))
    fatal = `grade "${onlyGrade}" is not a shipped grade (${SHIPPED_GRADES.join(" ")})`;
  else if (!scoped.length)
    fatal = `swept ZERO scope files${onlyGrade ? ` for grade ${onlyGrade}` : ""} (expected access-practice-lab/content/vocab-academy/g<G>/grade.json); a sweep that finds nothing has verified nothing`;
  if (fatal) return { issues, stats, fatal, missingParts: new Map() };

  for (const s of corpus.strays)
    add(
      "WARN",
      "stray-file",
      s,
      "",
      "unexpected file or folder in the content tree (only g<G>/grade.json, g<G>/u<NN>.json, morphology.json and index.json belong here)",
    );

  const forms = morphForms(corpus);
  if (corpus.morphology) issues.push(...checkMorphology(corpus.morphology));

  for (const [g, gr] of corpus.grades) {
    if (gr.parseError)
      add(
        "ERROR",
        "json-parse",
        gr.file,
        `grade ${g}`,
        `grade.json does not parse: ${gr.parseError}`,
      );
    else if (SHIPPED_GRADES.includes(g)) issues.push(...checkGrade(g, gr.data, gr.file));
  }

  const parsed = [];
  const missingParts = new Map();
  for (const u of corpus.units) {
    if (u.parseError) {
      add(
        "ERROR",
        "json-parse",
        u.file,
        `grade ${u.g} unit ${u.nn}`,
        `unit file does not parse: ${u.parseError}`,
      );
      continue;
    }
    if (!SHIPPED_GRADES.includes(u.g)) {
      parsed.push({ ...u, info: { sentences: [] } });
      continue;
    }
    const r = checkUnit(u.data, { morphForms: forms, strictMorph: complete && !!forms, fk });
    for (const i of r.issues) {
      issues.push({ ...i, file: u.file });
      if (i.code === "morph-unknown-part") {
        const part = /"([^"]+)"/.exec(i.msg)?.[1];
        if (part) missingParts.set(part, (missingParts.get(part) ?? 0) + 1);
      }
    }
    parsed.push({ ...u, info: r.info });
  }

  const gradeMap = new Map(
    [...corpus.grades]
      .filter(([, v]) => !v.parseError)
      .map(([g, v]) => [g, { file: v.file, data: v.data }]),
  );
  issues.push(
    ...checkCorpus(
      parsed.filter((u) => u.data),
      gradeMap,
      { complete, onlyGrade },
    ),
  );

  // index freshness: stale = ERROR when finished content is being checked, WARN while units are still being written
  if (root) {
    const idx = join(root, VA_DIR, "index.json");
    const exists = existsSync(idx);
    let stale = !exists;
    if (exists) {
      try {
        stale = readFileSync(idx, "utf8") !== indexText(buildIndex(corpus));
      } catch (e) {
        add(
          "ERROR",
          "index-build",
          `${VA_DIR}/index.json`,
          "",
          `index cannot be built: ${e.message}`,
        );
        stale = false;
      }
    }
    if (stale)
      add(
        complete ? "ERROR" : "WARN",
        "index-stale",
        `${VA_DIR}/index.json`,
        "",
        exists
          ? "index.json is stale; run `npm run build:vocab-academy-index`"
          : "index.json does not exist; run `npm run build:vocab-academy-index`",
      );
  }

  const keep = onlyGrade
    ? issues.filter((i) => {
        const g = gradeOfFile(i.file);
        return g === null || g === onlyGrade;
      })
    : issues;
  return { issues: keep, stats, fatal: null, missingParts };
}

export { gradeIdx, loadCorpus, loadReadability };
