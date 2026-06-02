/* Validate every story file against the engine's invariants before building.
   Run: node validate.js  (from _engine/) */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dir = path.join(__dirname, "stories");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".story.js"))
  .sort();

let hardFail = 0;
const rows = [];

for (const f of files) {
  const code = fs.readFileSync(path.join(dir, f), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  const issues = [];
  let S;
  try {
    vm.runInContext(code, sandbox, { filename: f });
    S = sandbox.window.GN_STORY;
  } catch (e) {
    issues.push("PARSE: " + e.message);
  }
  let scored = 0,
    acts = 0,
    misc = 0,
    bonuses = 0;
  if (S) {
    const m = S.meta || {};
    for (const k of [
      "unit",
      "version",
      "level",
      "title",
      "standard",
      "assessment",
      "artBase",
      "home",
    ])
      if (m[k] === undefined || m[k] === "") issues.push("meta missing " + k);
    if (!Array.isArray(S.acts) || !S.acts.length) issues.push("no acts");
    (S.acts || []).forEach((a) => {
      acts++;
      if (!a.id || !a.tab || !a.title)
        issues.push(a.id + ": missing id/tab/title");
      const ids = new Set();
      (a.steps || []).forEach((st) => {
        if (st.type === "beats") {
          if (!Array.isArray(st.beats) || !st.beats.length)
            issues.push(a.id + ": empty beats step");
          (st.beats || []).forEach((b) => {
            if (b.misconception) misc++;
            if (!b.who || !b.en) issues.push(a.id + ": beat missing who/en");
          });
        } else {
          // challenge
          if (st.optional) bonuses++;
          scored++;
          if (ids.has(st.id)) issues.push(a.id + ": dup challenge id " + st.id);
          ids.add(st.id);
          if (!st.ask || !st.ask.en)
            issues.push(a.id + "/" + st.id + ": no ask");
          const ch = st.choices || [];
          if (ch.length < 2) issues.push(a.id + "/" + st.id + ": <2 choices");
          const correct = ch.filter((c) => c.correct === true).length;
          if (correct !== 1)
            issues.push(
              a.id + "/" + st.id + ": " + correct + " correct (need 1)",
            );
          ch.forEach((c) => {
            if (!c.en) issues.push(a.id + "/" + st.id + ": choice missing en");
          });
          if (!st.goodEn || !st.badEn)
            issues.push(a.id + "/" + st.id + ": missing good/bad feedback");
        }
      });
    });
    if (!Array.isArray(S.glossary) || !S.glossary.length)
      issues.push("no glossary");
    const cmp = S.complete || {};
    if (!cmp.art || !cmp.en) issues.push("complete missing art/en");
    if (cmp.master) {
      const mc = cmp.master.choices || [];
      const cc = mc.filter((c) => c.correct === true).length;
      if (cc !== 1) issues.push("master: " + cc + " correct (need 1)");
      if (!cmp.master.promptEn) issues.push("master: no promptEn");
    } else issues.push("no master challenge");
  }
  if (issues.length) hardFail++;
  rows.push({
    file: f,
    unit: S && S.meta ? S.meta.unit : "?",
    ver: S && S.meta ? S.meta.version : "?",
    std: S && S.meta ? S.meta.standard : "?",
    acts,
    scored,
    bonuses,
    misc,
    status: issues.length ? "FAIL" : "ok",
    issues,
  });
}

rows.forEach((r) => {
  console.log(
    `${r.status === "ok" ? "✓" : "✗"} ${r.file.padEnd(16)} U${r.unit} v${r.ver} ${String(r.std).padEnd(8)} acts=${r.acts} scored=${r.scored} bonus=${r.bonuses} misc=${r.misc}` +
      (r.issues.length ? "\n    " + r.issues.join("\n    ") : ""),
  );
});
console.log(
  `\n${rows.length} files · ${rows.filter((r) => r.status === "ok").length} ok · ${hardFail} fail`,
);
process.exit(hardFail ? 1 : 0);
