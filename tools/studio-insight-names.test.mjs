// "My thinking" map (assets/studio/insight.js): every miss is shown by a readable name.
//   - a tagged miss shows its trap name from misconceptions.json (EN + ES) and the trap's quick fix
//   - an untagged miss shows its WHOLE feedback sentence, never the truncated "signature" fragment it is grouped by
//     (it used to print "Different runners train different miles would the")
//   - a generated ("New numbers") miss shows its trap name from assets/studio-gen/traps.js even though the page carries
//     only the traps its authored items name
//   - the share text uses the same names
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const { traps } = JSON.parse(
  readFileSync(join(REPO_ROOT, "data/practice-studio/misconceptions.json"), "utf8"),
);
const dom = new JSDOM(
  `<!doctype html><body data-features="insight share"><div class="header-actions"></div><button data-open-think>map</button></body>`,
  { runScripts: "outside-only", url: "https://example.test/" },
);
const w = dom.window;
const handlers = {};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
w.StudioRT = {
  util: { esc, es: (s) => (s ? `<span class="es-text" lang="es">${esc(s)}</span>` : "") },
};
w.StudioBus = { on: (ev, fn) => (handlers[ev] = fn) };
w.StudioStore = { passport: { update() {} }, clear() {} };
w.eval(readFileSync(join(REPO_ROOT, "assets/studio/insight.js"), "utf8"));
w.eval(readFileSync(join(REPO_ROOT, "assets/studio-gen/core.js"), "utf8"));
w.eval(readFileSync(join(REPO_ROOT, "assets/studio-gen/traps.js"), "utf8"));
/** what a medianFind item tags an unsorted-list median with, after StudioGen.make() maps it to the taxonomy */
const genTrap = w.StudioGen.trapOf("medianFind", "stat-no-order");
assert.ok(traps[genTrap], `a generator tag maps to a taxonomy id (got "${genTrap}")`);

const trapId = "stat-mean-vs-median";
const state = {
  misses: {},
  missLog: [],
  calib: {},
  stats: { tries: 3, first: 1, best: 1, hints: 0, reps: 0 },
  acts: {},
};
for (const t of [1, 2, 3, 4, 5]) state[`solved${t}`] = {};
w.StudioInsight.init({
  api: {
    state,
    data: {
      lesson: "2-3",
      mode: "practice",
      storageKey: "k",
      traps: {
        [trapId]: {
          n: traps[trapId].name,
          nEs: traps[trapId].nameEs,
          fix: traps[trapId].fix,
          fixEs: traps[trapId].fixEs,
        },
      },
    },
    sections: [{ items: [] }],
    progress() {},
    save() {},
  },
});

const long =
  "Different runners train different miles—would the data vary? Look again at what the question asks for each runner.";
const answer = handlers.answer;
answer({
  ok: false,
  itemId: "a",
  tab: 1,
  tag: trapId,
  say: "That is the mean.",
  sayEs: "Esa es la media.",
});
answer({
  ok: false,
  itemId: "b",
  tab: 1,
  tag: trapId,
  say: "That is the mean.",
  sayEs: "Esa es la media.",
});
answer({
  ok: false,
  itemId: "c",
  tab: 1,
  tag: null,
  say: long,
  sayEs: "Diferentes corredores entrenan distintas millas.",
});
answer({ ok: false, itemId: "d", tab: 1, tag: "legacy-free-text", say: "Old tag." });

w.document.querySelector("[data-open-think]").click();
const items = [...w.document.querySelectorAll(".think-list li")].map((li) => li.textContent);
const shownTop = state.misses[trapId].n >= 2;
assert.ok(shownTop);
// with one pattern at 2+, the map shows only that pattern; reopen with every miss at 2+ to see all three kinds
answer({ ok: false, itemId: "c2", tab: 1, tag: null, say: long });
answer({ ok: false, itemId: "d2", tab: 1, tag: "legacy-free-text", say: "Old tag." });
w.document.querySelector("[data-open-think]").click();
const all = [...w.document.querySelectorAll(".think-list li")].map((li) => li.textContent);
assert.equal(all.length, 3, `three patterns: ${all.join(" | ")}`);
const named = all.find((t) => t.includes(traps[trapId].name));
assert.ok(named, "a tagged miss shows its trap name");
assert.ok(named.includes(traps[trapId].nameEs), "and its Spanish name");
assert.ok(named.includes(traps[trapId].fix), "and the trap's quick fix");
const untagged = all.find((t) => t.includes("Different runners"));
assert.ok(untagged.includes(long), "an untagged miss shows its whole feedback sentence");
assert.ok(!all.some((t) => /would the\s*\d+×/.test(t)), "never a truncated signature fragment");
assert.ok(
  all.some((t) => t.startsWith("Legacy free text")),
  "an authored free-text tag reads as words",
);
assert.ok(items.length >= 1);

// a generated miss (the page carries no name for it) is the most frequent pattern: it leads the map by its trap name
assert.ok(!state.misses[genTrap]);
for (const id of ["g1", "g2", "g3"])
  answer({ ok: false, itemId: id, tab: 1, tag: genTrap, say: "Put them in order first." });
w.document.querySelector("[data-open-think]").click();
const lead = w.document.querySelector(".think-list li")?.textContent || "";
assert.ok(lead.includes(traps[genTrap].name), `a generated miss shows its trap name: ${lead}`);
assert.ok(lead.includes(traps[genTrap].nameEs), "and its Spanish name");
assert.ok(lead.includes(traps[genTrap].fix), "and the trap's quick fix");

const share = w.StudioInsight.shareText();
assert.ok(share.includes(traps[trapId].name), "the share text names the trap");
assert.ok(!/item:|#/.test(share.split("\n")[2]), "the share text carries no signature key");
console.log(
  `studio insight names: trap, generated, untagged and legacy misses read cleanly (${all.length} patterns).`,
);
