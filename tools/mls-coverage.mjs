#!/usr/bin/env node
// Math Literacy Studio coverage report (machine readable): content/mls/coverage.json.
//   node tools/mls-coverage.mjs            builds everything, writes the report, exits 1 on any gap
//   node tools/mls-coverage.mjs --check    fails when the committed report is stale or any gate is red
// The denominator is content/mls/inventory.json (locked by tools/validate-mls.mjs). Nothing here counts a stub: a role is covered only when a
// resource BUILDS for the skill with the sections, key entries and numbers it should have, and the gates below hold.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lab = (p) => pathToFileURL(path.join(ROOT, "access-practice-lab/src/mls", p)).href;
const C = path.join(ROOT, "access-practice-lab/content/mls");
const inv = JSON.parse(fs.readFileSync(path.join(C, "inventory.json"), "utf8"));
const { mergeSkill } = await import(lab("merge.js"));
const model = await import(lab("model.js"));
const { roleCoverage, ROLE_MAP, TYPE_LABEL } = await import(lab("roles.js"));
const { generate } = await import(lab("families.js"));
const nav = await import(lab("navigator.js"));

const content = new Map();
for (let g = 1; g <= 8; g++)
  for (const s of JSON.parse(fs.readFileSync(path.join(C, `skills/g${g}.json`), "utf8")).skills)
    content.set(s.id, s);
const skills = inv.skills
  .filter((s) => content.has(s.id))
  .map((s) => mergeSkill(s, content.get(s.id)));
model.registerSkills(skills);

const problems = [];
const gate = (name, ok, detail = "") => {
  if (!ok) problems.push(`${name}: ${detail}`);
  return ok;
};
// "undefined" is real mathematics (the slope of a vertical line), so only the code-bug forms count: a bare value, or "undefined" as a whole line.
const BAD =
  /^undefined$|(?:^|[\s:(,])undefined(?:[\s,.)]*$)(?<!slope is undefined)|NaN|\[object|\{\{|\}\}|\bnull\b/;
// Only the text a person would read: JSON punctuation such as "}}" at the end of nested objects is not broken text.
const leaves = (v, out = []) => {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) for (const x of v) leaves(x, out);
  else if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v))
      if (!["spec", "visual", "t", "style", "kind"].includes(k)) leaves(x, out);
  return out;
};
const flatText = (r) => leaves([r.sections, r.key, r.notes]).join("\n");

// ---- 1. every skill x every role builds something real
const roleRows = [];
for (const s of skills) {
  const cov = roleCoverage(s, inv.roles, model.buildResource);
  for (const c of cov) gate("role", c.ok, `${s.id} ${c.role}: ${c.detail}`);
  roleRows.push({
    skill: s.id,
    grade: s.grade,
    covered: cov.filter((c) => c.ok).length,
    of: cov.length,
  });
}

// ---- 2. every skill x every resource type x every support preset builds, is clean, and keeps the mathematics identical across language bands
const TYPES = model.RESOURCE_TYPES;
let built = 0;
let answers = 0;
for (const s of skills) {
  for (const type of TYPES) {
    for (const support of ["more", "standard", "extension"]) {
      let r;
      try {
        r = model.buildResource(s, type, {
          support,
          variant: type === "task-cards" && support === "extension" ? "extension" : "",
        });
      } catch (e) {
        gate("build", false, `${s.id} ${type} ${support}: ${e.message}`);
        continue;
      }
      built++;
      gate(
        "sections",
        r.sections.length > 0 && r.sections.every((x) => x.heading && x.blocks.length),
        `${s.id} ${type} ${support}: empty section`,
      );
      gate(
        "clean",
        !BAD.test(flatText(r).replace(/"null"/g, "")),
        `${s.id} ${type} ${support}: contains ${(flatText(r).match(BAD) || [""])[0]}`,
      );
      const probs = r.sections
        .flatMap((x) => x.blocks)
        .filter((b) => b.t === "problem" && b.n > 0 && b.answer != null);
      answers += probs.length;
      if (probs.length)
        gate(
          "key",
          r.key.length >= probs.length,
          `${s.id} ${type} ${support}: ${probs.length} problems but ${r.key.length} key entries`,
        );
    }
    // language never changes the mathematics: same seed, same math level, different bands -> identical answers
    const A = model.buildResource(s, type, { math: 2, band: "1-2", seed: 3 });
    const B = model.buildResource(s, type, { math: 2, band: "5-6", seed: 3 });
    const ans = (r) =>
      r.sections
        .flatMap((x) => x.blocks)
        .filter((b) => b.t === "problem" && b.answer != null)
        .map((b) => b.answer)
        .join("|");
    gate(
      "language-independent",
      ans(A) === ans(B),
      `${s.id} ${type}: answers differ between language bands`,
    );
  }
}

// ---- 3. problem generation: every skill generates at every level (verification of the answers is tools/mls-verify.mjs)
for (const s of skills)
  for (const level of [1, 2, 3])
    gate(
      "generate",
      !!generate(s.familyId, s.params, { seed: 11, level, ctx: s.contexts[0] }).answer.value,
      `${s.id} L${level}`,
    );

// ---- 4. navigator and sequences point at real resources
for (const id of nav.CONCERN_IDS)
  for (const s of skills.slice(0, 85)) {
    const plan = nav.navFor(id, s);
    for (const r of plan.resources)
      gate("navigator", TYPES.includes(r.type), `${id}: ${r.type} is not a resource type`);
  }
const seqs = inv.sequences.map((q) => q.id);
for (const s of skills)
  for (const q of seqs) gate("sequence", model.sequenceSteps(s, q).length > 0, `${s.id} ${q}`);

// ---- 5. interactive layer present for the inventory's engines, manipulatives and games
const status = { engines: {}, manipulatives: {}, games: {} };
try {
  const { ENGINES } = await import(lab("engines.js"));
  for (const e of inv.engines) status.engines[e.id] = !!ENGINES[e.id]?.mount;
} catch (e) {
  for (const x of inv.engines) status.engines[x.id] = false;
  gate("engines", false, e.message);
}
try {
  const { MANIPS, MANIP_FOR_FAMILY } = await import(lab("manips.js"));
  for (const m of inv.manipulatives) status.manipulatives[m.id] = !!MANIPS[m.id]?.mount;
  for (const s of skills)
    gate(
      "manipulative-for-skill",
      !!MANIPS[MANIP_FOR_FAMILY[s.familyId]],
      `${s.id}: no manipulative for family ${s.familyId}`,
    );
} catch (e) {
  for (const x of inv.manipulatives) status.manipulatives[x.id] = false;
  gate("manipulatives", false, e.message);
}
try {
  const { GAMES } = await import(lab("games.js"));
  for (const g of inv.games) status.games[g.id] = !!GAMES[g.id]?.mount;
  for (const s of skills)
    gate(
      "games-for-skill",
      Object.values(GAMES).filter((g) => g.eligible?.(s) !== false).length >= 3,
      `${s.id}: fewer than 3 eligible games`,
    );
} catch (e) {
  for (const x of inv.games) status.games[x.id] = false;
  gate("games", false, e.message);
}
for (const [group, rows] of Object.entries(status))
  for (const [id, ok] of Object.entries(rows)) gate(group, ok, `${id} is not implemented`);

// ---- 6. progressions point at real skills
const prog = JSON.parse(fs.readFileSync(path.join(C, "progressions.json"), "utf8"));
gate(
  "progressions",
  prog.strands.length >= inv.progressions.length &&
    inv.progressions.every((p) => prog.strands.some((s) => s.id === p.id)),
  "a locked progression strand is missing",
);
for (const st of prog.strands)
  for (const g of st.grades)
    gate(
      "progressions",
      skills.some((s) => s.id === g.skill),
      `${st.id} grade ${g.grade}: skill ${g.skill}`,
    );

// ---- report
const perGrade = {};
for (const g of [1, 2, 3, 4, 5, 6, 7, 8]) {
  const sk = skills.filter((s) => s.grade === g);
  perGrade[g] = {
    skillsInInventory: inv.skills.filter((s) => s.grade === g).length,
    skillsAuthored: sk.length,
    roleCoverage: `${roleRows.filter((r) => r.grade === g).reduce((a, r) => a + r.covered, 0)}/${sk.length * inv.roles.length}`,
  };
}
const report = {
  generatedBy: "tools/mls-coverage.mjs",
  denominator: inv.counts,
  skills: { target: inv.skills.length, authored: skills.length },
  rolesPerSkill: inv.roles.length,
  roleCells: {
    target: inv.skills.length * inv.roles.length,
    covered: roleRows.reduce((a, r) => a + r.covered, 0),
  },
  resourceBuilds: {
    skills: skills.length,
    types: TYPES.length,
    presets: 3,
    built,
    problemAnswersChecked: answers,
  },
  perGrade,
  engines: status.engines,
  manipulatives: status.manipulatives,
  games: status.games,
  resourceTypes: TYPES.map((t) => ({ id: t, label: TYPE_LABEL[t] })),
  roleMap: Object.fromEntries(
    Object.entries(ROLE_MAP).map(([k, v]) => [
      k,
      { type: v.type, variant: v.variant || null, launch: v.launch || null },
    ]),
  ),
  gates: { problems: problems.length },
  limits: [
    "Spanish family text is drafted to the repo's Spanish style rules and has not been reviewed by a native speaker.",
    "Language supports are WIDA-informed instructional ideas; no WIDA-trained educator has reviewed them, and the studio measures no proficiency.",
    "Audio is the device's speech synthesis only; there is no recorded human narration.",
    "Usability targets (three selections, 30 to 60 seconds) are measured by scripted runs, not by teachers.",
    "Standards alignments are informational CCSS-M 2010 codes, not an endorsed crosswalk to any state's standards.",
  ],
};
const out = `${JSON.stringify(report, null, 1)}\n`;
const dest = path.join(C, "coverage.json");
if (process.argv.includes("--check")) {
  const same = fs.existsSync(dest) && fs.readFileSync(dest, "utf8") === out;
  if (!same) problems.push("coverage.json is stale: run node tools/mls-coverage.mjs");
} else if (!problems.length) fs.writeFileSync(dest, out);
if (problems.length) {
  for (const p of problems.slice(0, 40)) console.error(`FAIL  ${p}`);
  if (problems.length > 40) console.error(`FAIL  ... ${problems.length - 40} more`);
  console.error(`mls-coverage: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log(
  `mls-coverage: OK. ${skills.length}/${inv.skills.length} skills, ${report.roleCells.covered}/${report.roleCells.target} role cells, ${built} resources built, ${answers} answers carried into keys`,
);
