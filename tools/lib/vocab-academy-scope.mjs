// Vocabulary Academy — corpus loading, grade.json (scope) checks, and corpus-wide checks
// (ids, review resolution, scope match, duplicate sentences, passage overlap, completeness).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
  CATS,
  GRADES,
  PLAN,
  POS,
  SHIPPED_GRADES,
  STRANDS,
  TIERS,
  unitId,
  wordIdOf,
} from "../../access-practice-lab/src/vocab-academy/contract.js";
import { normSentence, tokensOf } from "./vocab-academy-lexical.mjs";

export const VA_DIR = "access-practice-lab/content/vocab-academy";
export const BAND_OF = (g) =>
  ["K", "1", "2"].includes(g)
    ? "K-2"
    : ["3", "4", "5"].includes(g)
      ? "3-5"
      : ["6", "7", "8"].includes(g)
        ? "6-8"
        : "9-12";
export const gradeIdx = (g) => GRADES.indexOf(g);
const str = (v) => typeof v === "string" && v.trim() !== "";
const HWPOS = /^([a-z][a-z' -]*)\/([a-z]+)$/;

/** Read every grade.json and unit file under `dir` (directories starting "_" are fixtures and ignored). */
export function loadCorpus(root, dir = VA_DIR) {
  const base = join(root, dir);
  const out = { base, grades: new Map(), units: [], strays: [], morphology: null };
  if (!existsSync(base)) return out;
  const rel = (f) => relative(root, f);
  const read = (file) => {
    try {
      return { data: JSON.parse(readFileSync(file, "utf8")) };
    } catch (e) {
      return { parseError: e.message };
    }
  };
  for (const ent of readdirSync(base, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (ent.name.startsWith("_") || ent.name.startsWith(".")) continue;
    const full = join(base, ent.name);
    if (!ent.isDirectory()) {
      if (ent.name === "morphology.json") out.morphology = { file: rel(full), ...read(full) };
      else if (ent.name !== "index.json") out.strays.push(rel(full));
      continue;
    }
    const m = /^g(K|\d{1,2})$/.exec(ent.name);
    if (!m || !GRADES.includes(m[1])) {
      out.strays.push(rel(full));
      continue;
    }
    const g = m[1];
    for (const f of readdirSync(full).sort()) {
      if (f.startsWith("_") || f.startsWith(".")) continue;
      const file = join(full, f);
      if (f === "grade.json") out.grades.set(g, { file: rel(file), g, ...read(file) });
      else if (/^u\d{2}\.json$/.test(f))
        out.units.push({ file: rel(file), g, nn: Number(f.slice(1, 3)), ...read(file) });
      else out.strays.push(rel(file));
    }
  }
  out.units.sort((a, b) => gradeIdx(a.g) - gradeIdx(b.g) || a.nn - b.nn);
  return out;
}

/** Part forms in morphology.json, normalised (hyphens stripped), or null when the dataset does not exist yet. */
export function morphForms(corpus) {
  const parts = corpus.morphology?.data?.parts;
  if (!Array.isArray(parts)) return null;
  const set = new Set();
  for (const p of parts)
    if (p && typeof p.form === "string") set.add(p.form.toLowerCase().replace(/-/g, ""));
  return set;
}

/** Issues for one grade.json. */
export function checkGrade(g, data, file) {
  const iss = [];
  const err = (code, loc, msg) =>
    iss.push({ sev: "ERROR", code, file, loc: `grade ${g} ${loc}`.trim(), msg });
  const warn = (code, loc, msg) =>
    iss.push({ sev: "WARN", code, file, loc: `grade ${g} ${loc}`.trim(), msg });
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    err("grade-schema", "", "grade.json is not a JSON object");
    return iss;
  }
  const plan = PLAN[g];
  if (data.schema !== 1) err("grade-schema", "schema", `schema must be 1 (got ${data.schema})`);
  if (data.grade !== g)
    err("grade-schema", "grade", `grade is "${data.grade}" but the folder is g${g}`);
  if (data.band !== BAND_OF(g))
    err("grade-schema", "band", `band should be "${BAND_OF(g)}" (got "${data.band}")`);
  for (const k of ["focus", "selection"])
    if (!str(data[k])) err("grade-schema", k, `${k} is missing or empty`);
  const units = Array.isArray(data.units) ? data.units : [];
  if (!Array.isArray(data.arc) || !data.arc.length || !data.arc.every(str))
    err("grade-arc", "arc", "arc must be a non-empty array of strings");
  else if (data.arc.length !== units.length)
    err(
      "grade-arc",
      "arc",
      `arc has ${data.arc.length} entries but there are ${units.length} units`,
    );
  if (units.length !== plan.units)
    err("grade-count", "units", `${units.length} units; the plan for grade ${g} is ${plan.units}`);
  const seenHw = new Map();
  units.forEach((u, i) => {
    const at = `unit ${u?.id ?? i + 1}`;
    if (u?.n !== i + 1 || u?.id !== unitId(g, i + 1))
      err(
        "grade-ids",
        at,
        `expected n=${i + 1} id="${unitId(g, i + 1)}" (ids must be sequential); got n=${u?.n} id="${u?.id}"`,
      );
    for (const k of ["title", "theme", "why", "morphFocus"])
      if (!str(u?.[k])) err("grade-schema", at, `${k} is missing or empty`);
    if (!STRANDS.includes(u?.strand))
      err("grade-enum", at, `strand "${u?.strand}" is not one of ${STRANDS.join(" ")}`);
    const ws = Array.isArray(u?.words) ? u.words : [];
    if (ws.length !== plan.words)
      err(
        "grade-count",
        at,
        `${ws.length} words; the plan for grade ${g} is ${plan.words} per unit`,
      );
    ws.forEach((w, j) => {
      const wat = `${at} word ${j + 1} "${w?.hw}"`;
      if (!str(w?.hw) || !/^[a-z][a-z' -]*$/.test(w.hw))
        err("grade-schema", wat, "hw must be lowercase letters");
      if (!POS.includes(w?.pos))
        err("grade-enum", wat, `pos "${w?.pos}" is not one of ${POS.join(" ")}`);
      if (!TIERS.includes(w?.tier))
        err("grade-enum", wat, `tier "${w?.tier}" is not one of ${TIERS.join(" ")}`);
      if (!Array.isArray(w?.cats) || w.cats.some((c) => !CATS.includes(c)))
        err("grade-enum", wat, `cats must be drawn from ${CATS.join(" ")}`);
      const key = `${w?.hw}/${w?.pos}`;
      if (seenHw.has(key))
        err(
          "grade-dup",
          wat,
          `"${key}" is a target twice in grade ${g} (also in ${seenHw.get(key)})`,
        );
      else seenHw.set(key, at);
    });
    if (!Array.isArray(u?.reviewFrom) || !u.reviewFrom.every((r) => typeof r === "string"))
      err("grade-review", at, "reviewFrom must be an array of strings");
    else {
      for (const r of u.reviewFrom)
        if (!HWPOS.test(r))
          err("grade-review", at, `reviewFrom entry "${r}" must look like "headword/pos"`);
      if (i > 0 && !u.reviewFrom.length)
        err("grade-review", at, "units after the first must revisit 2-4 earlier headwords");
      else if (i > 0 && (u.reviewFrom.length < 2 || u.reviewFrom.length > 4))
        warn(
          "grade-review",
          at,
          `${u.reviewFrom.length} reviewFrom entries; the spec asks for 2-4`,
        );
    }
  });
  return iss;
}

/** scope map "hw/pos" -> [{ g, n, unitId, file }] across every loaded grade.json. */
export function scopeMap(corpus) {
  const map = new Map();
  for (const [g, gr] of corpus.grades) {
    for (const u of gr.data?.units ?? []) {
      for (const w of u?.words ?? []) {
        const k = `${w?.hw}/${w?.pos}`;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push({ g, n: u.n, unitId: u.id, file: gr.file });
      }
    }
  }
  return map;
}

const shingles = (text, k = 5) => {
  const t = tokensOf(text);
  const out = new Set();
  for (let i = 0; i + k <= t.length; i++) out.add(t.slice(i, i + k).join(" "));
  return out;
};
export function shingleSimilarity(a, b) {
  const A = shingles(a);
  const B = shingles(b);
  if (!A.size || !B.size) return 0;
  let i = 0;
  for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i);
}

/**
 * Corpus-wide checks.
 * @param {{file:string,g:string,nn?:number,data:object,info?:{sentences:{text:string,loc:string}[]}}[]} units  parsed unit files
 * @param {Map<string,{file:string,data:object}>} grades  parsed grade.json files
 * @param {{ complete?: boolean, onlyGrade?: string|null }} [opts]
 */
export function checkCorpus(units, grades, opts = {}) {
  const iss = [];
  const push = (sev, code, file, loc, msg) => iss.push({ sev, code, file, loc, msg });
  const E = (...a) => push("ERROR", ...a);
  const W = (...a) => push("WARN", ...a);
  const corpusLike = { grades };
  const scope = scopeMap(corpusLike);

  // scope: a headword+pos is a target exactly once in the whole corpus
  for (const [k, hits] of scope) {
    if (hits.length > 1)
      E(
        "scope-dup",
        hits[1].file,
        `grade ${hits[1].g} ${hits[1].unitId}`,
        `"${k}" is a target in ${hits.map((h) => h.unitId).join(" and ")}; a headword+pos is a target once (revisits go in reviewFrom)`,
      );
  }
  // scope reviewFrom resolves to an earlier unit or grade
  for (const [g, gr] of grades) {
    for (const u of gr.data?.units ?? []) {
      for (const r of u?.reviewFrom ?? []) {
        const hits = scope.get(r);
        const loc = `grade ${g} ${u.id}`;
        if (!hits) {
          const earlierMissing =
            !opts.complete && SHIPPED_GRADES.slice(0, gradeIdx(g)).some((x) => !grades.has(x));
          (earlierMissing ? W : E)(
            "grade-review",
            gr.file,
            loc,
            `reviewFrom "${r}" is not a target of any ${earlierMissing ? "loaded " : ""}grade.json${earlierMissing ? " (an earlier grade has no grade.json yet)" : ""}`,
          );
          continue;
        }
        const h = hits[0];
        if (gradeIdx(h.g) > gradeIdx(g) || (h.g === g && h.n >= u.n))
          E(
            "grade-review",
            gr.file,
            loc,
            `reviewFrom "${r}" is taught in ${h.unitId}, which is not earlier than ${u.id}`,
          );
      }
    }
  }

  // unit files
  const idOwner = new Map();
  const hwOwner = new Map();
  const wordUnit = new Map(); // id -> { g, n }
  for (const u of units) {
    const d = u.data;
    if (!d) continue;
    for (const w of d.words ?? []) {
      if (!w?.id) continue;
      const loc = `unit ${d.id} word "${w.hw}" (${w.id})`;
      if (idOwner.has(w.id))
        E("dup-word-id", u.file, loc, `word id ${w.id} is also used by ${idOwner.get(w.id)}`);
      else idOwner.set(w.id, `${d.id} "${w.hw}"`);
      const k = `${w.hw}/${w.pos}`;
      if (hwOwner.has(k))
        E("dup-headword", u.file, loc, `headword+pos "${k}" is also a target in ${hwOwner.get(k)}`);
      else hwOwner.set(k, d.id);
      wordUnit.set(w.id, { g: u.g, n: d.n, unit: d.id });
    }
  }
  // scope match + grade exists
  for (const u of units) {
    const d = u.data;
    if (!d) continue;
    const gr = grades.get(u.g);
    if (d.grade !== u.g || d.n !== u.nn || d.id !== unitId(u.g, u.nn))
      E(
        "unit-location",
        u.file,
        `unit ${d.id}`,
        `file is for grade ${u.g} unit ${u.nn} (${unitId(u.g, u.nn)}) but the record says grade ${d.grade} n=${d.n} id=${d.id}`,
      );
    if (!gr) {
      E("grade-exists", u.file, `unit ${d.id}`, `grade ${u.g} has no grade.json`);
      continue;
    }
    const su = (gr.data?.units ?? []).find((x) => x?.n === u.nn);
    if (!su) {
      E("scope-match", u.file, `unit ${d.id}`, `grade.json has no scope entry for unit ${u.nn}`);
      continue;
    }
    const a = (d.words ?? []).map((w) => `${w?.hw}/${w?.pos}`);
    const b = (su.words ?? []).map((w) => `${w?.hw}/${w?.pos}`);
    if (a.length !== b.length || a.some((x, i) => x !== b[i]))
      E(
        "scope-match",
        u.file,
        `unit ${d.id}`,
        `words differ from the grade.json scope (same hw/pos/order required). unit: [${a.join(", ")}] scope: [${b.join(", ")}]`,
      );
    if (d.strand !== su.strand)
      E(
        "scope-match",
        u.file,
        `unit ${d.id}`,
        `strand "${d.strand}" differs from scope "${su.strand}"`,
      );
    for (const k of ["title", "theme"])
      if (d[k] !== su[k])
        W("scope-match", u.file, `unit ${d.id}`, `${k} "${d[k]}" differs from scope "${su[k]}"`);
    (d.words ?? []).forEach((w, i) => {
      const sw = su.words?.[i];
      if (sw && sw.hw === w?.hw && sw.tier !== w.tier)
        W(
          "scope-match",
          u.file,
          `unit ${d.id} word "${w.hw}"`,
          `tier "${w.tier}" differs from scope "${sw.tier}"`,
        );
    });
  }
  // review resolution
  for (const u of units) {
    const d = u.data;
    if (!d || !Array.isArray(d.review)) continue;
    for (const r of d.review) {
      const loc = `unit ${d.id} review`;
      const hit = wordUnit.get(r);
      let target = hit && { g: hit.g, n: hit.n, unit: hit.unit };
      if (!target) {
        for (const [k, hits] of scope)
          if (wordIdOf(...k.split("/")) === r)
            target = { g: hits[0].g, n: hits[0].n, unit: hits[0].unitId, fromScope: true };
      }
      if (!target) {
        const earlierMissing =
          !opts.complete && SHIPPED_GRADES.slice(0, gradeIdx(u.g)).some((x) => !grades.has(x));
        (earlierMissing ? W : E)(
          "review-resolve",
          u.file,
          loc,
          `review id "${r}" does not resolve to any word${earlierMissing ? " (an earlier grade has no grade.json yet)" : ""}`,
        );
      } else if (gradeIdx(target.g) > gradeIdx(u.g) || (target.g === u.g && target.n >= d.n))
        E(
          "review-forward",
          u.file,
          loc,
          `review id "${r}" is taught in ${target.unit}, which is not earlier than ${d.id}`,
        );
    }
  }
  // ids that must be unique corpus-wide: units, passages, questions, constructed responses
  const owner = { unit: new Map(), passage: new Map(), q: new Map(), c: new Map() };
  const claim = (kind, id, u, loc) => {
    if (typeof id !== "string") return;
    const m = owner[kind];
    if (m.has(id))
      E(
        "dup-id",
        u.file,
        loc,
        `${kind === "q" ? "question" : kind === "c" ? "constructed-response" : kind} id "${id}" is also used in ${m.get(id)}`,
      );
    else m.set(id, u.file);
  };
  for (const u of units) {
    const d = u.data;
    if (!d) continue;
    claim("unit", d.id, u, `unit ${d.id}`);
    claim("passage", d.passage?.id, u, `unit ${d.id} passage`);
    for (const q of d.passage?.qs ?? []) claim("q", q?.id, u, `unit ${d.id} question`);
    for (const c of d.check?.constructed ?? []) claim("c", c?.id, u, `unit ${d.id} check`);
  }
  // answer-position balance across each grade: a key that favours one slot is learnable
  for (const g of GRADES) {
    const keys = [];
    for (const u of units)
      if (u.g === g)
        for (const q of u.data?.passage?.qs ?? [])
          if (Number.isInteger(q?.a) && Array.isArray(q.choices) && q.choices.length === 4)
            keys.push(q.a);
    if (keys.length >= 24) {
      const top = [0, 1, 2, 3].map((k) => keys.filter((x) => x === k).length);
      const worst = Math.max(...top);
      if (worst / keys.length > 0.4)
        W(
          "answer-balance",
          `${VA_DIR}/g${g}`,
          `grade ${g}`,
          `${worst} of ${keys.length} four-choice passage answers (${((worst / keys.length) * 100).toFixed(0)}%) sit in choice ${top.indexOf(worst) + 1}; spread the correct position`,
        );
    }
  }
  // duplicate sentences across the corpus
  const sentOwner = new Map();
  for (const u of units) {
    for (const s of u.info?.sentences ?? []) {
      const k = normSentence(s.text);
      if (k.split(" ").length < 4) continue;
      const prev = sentOwner.get(k);
      if (prev && prev.unit !== u.data?.id)
        E("dup-sentence", u.file, s.loc, `sentence also appears in ${prev.loc}: "${s.text}"`);
      else if (!prev) sentOwner.set(k, { unit: u.data?.id, loc: s.loc });
    }
  }
  // passage overlap
  const ps = units
    .filter((u) => Array.isArray(u.data?.passage?.paras))
    .map((u) => ({
      u,
      text: u.data.passage.paras.join(" "),
      sh: shingles(u.data.passage.paras.join(" ")),
    }));
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      const A = ps[i].sh;
      const B = ps[j].sh;
      if (!A.size || !B.size) continue;
      let n = 0;
      for (const x of A) if (B.has(x)) n++;
      const sim = n / (A.size + B.size - n);
      if (sim > 0.5)
        E(
          "passage-overlap",
          ps[j].u.file,
          `unit ${ps[j].u.data.id} passage`,
          `passage is ${(sim * 100).toFixed(0)}% the same (5-word shingles) as ${ps[i].u.data.id}; no duplicated passages across units or grades`,
        );
    }
  }

  // grades outside this release (SPEC §11): nothing for 9-12 may exist
  for (const g of GRADES) {
    if (SHIPPED_GRADES.includes(g)) continue;
    const files = [
      ...(grades.has(g) ? [grades.get(g).file] : []),
      ...units.filter((u) => u.g === g).map((u) => u.file),
    ];
    for (const f of files)
      (opts.complete ? E : W)(
        "grade-out-of-scope",
        f,
        `grade ${g}`,
        `grade ${g} is not part of this release (K-8 only; SPEC §11)`,
      );
  }

  // completeness (--complete)
  if (opts.complete) {
    for (const g of SHIPPED_GRADES) {
      if (opts.onlyGrade && opts.onlyGrade !== g) continue;
      const plan = PLAN[g];
      const gr = grades.get(g);
      if (!gr) {
        E("grade-exists", `${VA_DIR}/g${g}/grade.json`, `grade ${g}`, "grade.json does not exist");
        continue;
      }
      const have = new Map(units.filter((u) => u.g === g).map((u) => [u.nn, u]));
      const scoped = gr.data?.units ?? [];
      for (let n = 1; n <= plan.units; n++) {
        if (!have.has(n))
          E(
            "unit-missing",
            `${VA_DIR}/g${g}/u${String(n).padStart(2, "0")}.json`,
            `grade ${g} unit ${n}`,
            `required unit file does not exist (plan: ${plan.units} units${scoped[n - 1] ? `, "${scoped[n - 1].title}"` : ""})`,
          );
        else if ((have.get(n).data?.words ?? []).length !== plan.words)
          E(
            "unit-words",
            have.get(n).file,
            `unit ${unitId(g, n)}`,
            `${have.get(n).data?.words?.length ?? 0} words; the plan for grade ${g} is ${plan.words}`,
          );
      }
      for (const u of units)
        if (u.g === g && u.nn > plan.units)
          E(
            "unit-missing",
            u.file,
            `unit ${u.data?.id}`,
            `unit ${u.nn} is beyond the ${plan.units}-unit plan for grade ${g}`,
          );
    }
  }
  return iss;
}
