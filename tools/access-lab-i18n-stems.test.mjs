// Strict bilingual rule: ES and EN+ES translate directions, chrome, hints and summaries, NEVER the English
// text being practiced or assessed. Renders the first screen of every game (both bands) in en, es and bi and
// checks that every English answer choice / clue / sentence / target word on screen stays on screen in ES.
// Also checks every game renders without throwing in all three language modes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { rng, SUP } from "../access-practice-lab/src/games/engine.js";
import { GAMES } from "../access-practice-lab/src/games/registry.js";
import { makeI18n } from "../access-practice-lab/src/i18n.js";

const root = new URL("../access-practice-lab/", import.meta.url).pathname;
const str = (x) => (typeof x === "string" ? x : String(x[Object.getOwnPropertySymbols(x)[0]]));
const esc = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
// Keys that hold target English: what the learner chooses between, reads for a clue, or orders into a sentence.
// (Vocabulary word cards print the English and the Spanish side by side with lang attributes, so they are not listed.)
const STEM_KEYS = new Set([
  "choices",
  "options",
  "clue",
  "sentences",
  "lines",
  "replies",
  "pieces",
]);
const stems = (node, key, out = []) => {
  if (Array.isArray(node)) node.forEach((v) => stems(v, key, out));
  else if (node && typeof node === "object") {
    if (typeof node.en === "string" && typeof node.es === "string") {
      if (STEM_KEYS.has(key) && node.en !== node.es && node.en.length > 3)
        out.push({ key, en: node.en });
      return out;
    }
    for (const [k, v] of Object.entries(node)) stems(v, k, out);
  }
  return out;
};

const renderer = async (g, band) => {
  const content = JSON.parse(readFileSync(`${root}content/games/${g.id}.json`, "utf8"));
  const mod = (await import(`${root}src/games/${g.module}.js`)).default;
  return (mode) => {
    const env = {
      ctx: { prefs: {}, route: {} },
      I: makeI18n(mode),
      band,
      def: g,
      sup: SUP.A,
      support: "A",
      len: "full",
      qa: false,
      params: {},
      content: content.bands?.[band] || {},
      contentAll: content,
      rng: rng(7),
      count: (full) => full,
      use() {},
      report() {},
    };
    return { html: str(mod.view(mod.init(env), env)), content: content.bands?.[band] || {} };
  };
};

for (const g of GAMES) {
  test(`${g.id}: renders in en / es / bi and keeps English stems in ES and EN+ES`, async () => {
    for (const band of Object.keys(g.obj)) {
      const render = await renderer(g, band);
      const en = render("en");
      const es = render("es").html;
      const bi = render("bi").html;
      for (const s of stems(en.content, "$")) {
        if (!en.html.includes(esc(s.en))) continue; // not on the first screen
        assert.ok(
          es.includes(esc(s.en)),
          `${g.id}/${band}: "${s.en.slice(0, 60)}" (${s.key}) is translated in ES mode`,
        );
        assert.ok(
          bi.includes(esc(s.en)),
          `${g.id}/${band}: "${s.en.slice(0, 60)}" (${s.key}) is missing in EN+ES mode`,
        );
      }
    }
  });
}
