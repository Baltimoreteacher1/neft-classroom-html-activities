// G-01 vocab-card-content, G-02 vocab-visual-fit, G-03 morphology-honesty, G-04 cognate-claims.
// Each gate returns { errors, info }. Each `controls` entry must produce errors (a gate that cannot
// fail is not a gate): the runner fails if a control passes.
import { JSDOM } from "jsdom";
import {
  RATIO_TAPE_TERMS,
  renderConceptVisual,
  VISUAL_SPECS,
} from "../../bcpss-teachers/vocab-visuals.js";
import { WORD_PARTS } from "../../bcpss-teachers/vocab-word-parts.js";
import {
  classifyCognate,
  lcsSimilarity,
  TRUE_COGNATE_KINDS,
} from "../../functions/_lib/bcpss/esol-pack.js";
import { buildGradePathway } from "../../functions/_lib/bcpss/pathways.js";
import { clone, GRADES, vocabOf } from "./dataset.mjs";
import { renderCards } from "./render.mjs";

const TEMPLATE_PHRASES = [
  "names a precise relationship, quantity, or representation",
  "describes an observable mechanism, variable, or system interaction",
  "helps analyze historical events, perspectives, or civic systems",
  "helps readers analyze text structure, author craft",
  "Guessing a number without labeling units",
  "Stating a personal opinion without connecting",
  "Describing an event from only one viewpoint",
  "Using the word as a vague label",
  "Example in Context",
];
const BAND_FOR = { K: "k2", 1: "k2", 2: "k2" };
const bandOf = (grade) => BAND_FOR[grade] || (["3", "4", "5"].includes(grade) ? "35" : "68");

// ── G-01 ──────────────────────────────────────────────────────────────────────
/** Pure check of rendered cards against authored vocab; also used by the negative controls. */
export function checkCards(cards, vocab, band, unitId) {
  const errors = [];
  if (cards.length !== vocab.length)
    errors.push(`${unitId}: ${cards.length} cards for ${vocab.length} terms`);
  vocab.forEach((v, i) => {
    const c = cards[i];
    if (!c) return;
    const id = `${unitId}/${v.term}`;
    if (!v.example || !v.nonexample || !v.cue)
      errors.push(`${id}: authored example/nonexample/cue missing`);
    if ((c.rows.Example || "") !== (v.example || ""))
      errors.push(`${id}: Example row is not the authored example`);
    if (/\[[^\]]+\]/.test(c.rows.Example || ""))
      errors.push(`${id}: Example row contains a bracket frame`);
    if (band === "k2") {
      if ("Non-Example" in c.rows) errors.push(`${id}: Non-Example shown in K-2`);
    } else if ((c.rows["Non-Example"] || "") !== (v.nonexample || "")) {
      errors.push(`${id}: Non-Example row is not the authored non-example`);
    }
    const body = c.html.replace(/<[^>]+>/g, " ");
    for (const t of TEMPLATE_PHRASES)
      if (body.includes(t)) errors.push(`${id}: template text "${t}" rendered`);
  });
  return errors;
}

export const g01 = {
  id: "G-01",
  name: "vocab-card-content",
  async run({ data }) {
    const errors = [];
    let cardsChecked = 0;
    for (const d of data.units) {
      const vocab = vocabOf(d);
      for (const band of new Set([bandOf(d.unit.grade), "68"])) {
        const cards = await renderCards(d, band);
        cardsChecked += cards.length;
        errors.push(...checkCards(cards, vocab, band, d.unit.id));
      }
    }
    if (cardsChecked < 1530) errors.push(`only ${cardsChecked} cards checked (floor 1530)`);
    return { errors, info: { cardsChecked } };
  },
  async controls({ data }) {
    const d = data.units.find((u) => u.unit.id === "g6-math-u1");
    const vocab = vocabOf(d);
    const good = await renderCards(d, "68");
    const stripped = clone(vocab);
    stripped[0].example = "";
    const templateCard = clone(good);
    templateCard[0].rows.Example =
      'Using "cubic unit" in Area: I decomposed the [polygon / net] into [shapes] because [reason].';
    templateCard[0].html += " names a precise relationship, quantity, or representation ";
    return [
      { name: "stripped authored example", errors: checkCards(good, stripped, "68", "fixture") },
      {
        name: "renderer outputs template + bracket frame",
        errors: checkCards(templateCard, vocab, "68", "fixture"),
      },
    ];
  },
};

// ── G-02 ──────────────────────────────────────────────────────────────────────
export function checkVisual(term, subject, svgHtml) {
  const errors = [];
  if (!svgHtml) return errors;
  const doc = new JSDOM(svgHtml, { contentType: "image/svg+xml" }).window.document;
  const svg = doc.documentElement;
  const key = term.toLowerCase();
  const type = svg.getAttribute("data-visual-type");
  const spec = VISUAL_SPECS[key];
  if (!spec) errors.push(`${term}: diagram drawn with no declared spec`);
  if (!type) errors.push(`${term}: diagram has no data-visual-type (not spec-driven)`);
  if (spec && type !== spec.type) errors.push(`${term}: type ${type} != spec ${spec.type}`);
  if (svg.getAttribute("data-visual-term")?.toLowerCase() !== key)
    errors.push(`${term}: data-visual-term mismatch`);
  const title = svg.querySelector("title")?.textContent || "";
  if (!title.toLowerCase().startsWith(key))
    errors.push(`${term}: <title> does not start with the term: "${title}"`);
  if (type === "ratio-tape" && !RATIO_TAPE_TERMS.includes(key))
    errors.push(`${term}: ratio tape on a non-ratio term`);
  if (/TAPE MODEL|Equal-sized parts show how quantities relate/.test(svgHtml))
    errors.push(`${term}: old generic diagram text`);
  if (String(subject).toLowerCase() !== "math")
    errors.push(`${term}: diagram in a ${subject} unit`);
  return errors;
}

export const g02 = {
  id: "G-02",
  name: "vocab-visual-fit",
  async run({ data }) {
    const errors = [];
    let drawn = 0;
    for (const d of data.units) {
      for (const v of vocabOf(d)) {
        const svg = renderConceptVisual(v.term, d.unit.subject);
        if (svg) drawn += 1;
        errors.push(...checkVisual(v.term, d.unit.subject, svg).map((e) => `${d.unit.id}: ${e}`));
      }
    }
    for (const term of Object.keys(VISUAL_SPECS)) {
      const svg = renderConceptVisual(term, "Math");
      if (!svg) errors.push(`${term}: spec has no renderer output`);
      if (/#(?:[0-9a-f]{2}){0,1}(?:5b21b6|7c3aed|a78bfa|6d28d9)/i.test(svg))
        errors.push(`${term}: purple fill`);
    }
    if (drawn < 20)
      errors.push(
        `only ${drawn} diagrams drawn across the fleet (floor 20); is the spec table intact?`,
      );
    return { errors, info: { diagramsDrawn: drawn, specs: Object.keys(VISUAL_SPECS).length } };
  },
  async controls() {
    const oldTape =
      '<svg xmlns="http://www.w3.org/2000/svg"><title>Math ratio tape diagram for cubic unit</title><text>TAPE MODEL · cubic unit</text><text>3 : 2</text></svg>';
    const ratioOnCube = renderConceptVisual("ratio", "Math").replace(
      'data-visual-term="ratio"',
      'data-visual-term="cubic unit"',
    );
    return [
      {
        name: "old index-selected ratio tape on 'cubic unit'",
        errors: checkVisual("cubic unit", "Math", oldTape),
      },
      {
        name: "ratio tape relabelled onto 'cubic unit'",
        errors: checkVisual("cubic unit", "Math", ratioOnCube),
      },
      {
        name: "diagram in a Science unit",
        errors: checkVisual("area", "Science", renderConceptVisual("area", "Math")),
      },
    ];
  },
};

// ── G-03 ──────────────────────────────────────────────────────────────────────
export function checkMorphology(cards, vocab, unitId) {
  const errors = [];
  vocab.forEach((v, i) => {
    const c = cards[i];
    if (!c) return;
    const id = `${unitId}/${v.term}`;
    const html = c.html.replace(/<[^>]+>/g, " ");
    if (/Root word:|\(\d+ letters\)/.test(html)) errors.push(`${id}: letter-count morphology`);
    if (/Phrase: "/.test(html)) errors.push(`${id}: phrase split rendered as morphology`);
    const family = (v.family || []).filter((f) => f.toLowerCase() !== v.term.toLowerCase());
    const shown = c.rows["Word family"];
    if (family.length ? shown !== family.join(", ") : shown !== undefined)
      errors.push(`${id}: Word family row != data`);
    const parts = c.rows["Word parts"];
    const expected = WORD_PARTS[v.term.toLowerCase()];
    if (expected ? parts !== expected : parts !== undefined)
      errors.push(`${id}: Word parts row != reviewed table`);
  });
  return errors;
}

export const g03 = {
  id: "G-03",
  name: "morphology-honesty",
  async run({ data }) {
    const errors = [];
    let withParts = 0;
    for (const d of data.units) {
      const cards = await renderCards(d, "68");
      withParts += cards.filter((c) => c.rows["Word parts"]).length;
      errors.push(...checkMorphology(cards, vocabOf(d), d.unit.id));
    }
    return { errors, info: { cardsWithWordParts: withParts } };
  },
  async controls({ data }) {
    const d = data.units.find((u) => u.unit.id === "g6-math-u2");
    const vocab = vocabOf(d);
    const cards = clone(await renderCards(d, "68")).map((c) => ({ ...c }));
    cards[0] = { ...cards[0], html: `${cards[0].html} Root word: ratio (5 letters)` };
    return [
      { name: "letter-count morphology row", errors: checkMorphology(cards, vocab, "fixture") },
    ];
  },
};

// ── G-04 ──────────────────────────────────────────────────────────────────────
const statsFromCognates = (details) => {
  let trueCognates = 0;
  let translationOnly = 0;
  let total = 0;
  for (const d of details) {
    for (const c of d.esol_pack.cognates) {
      total += 1;
      if (!c.cognate_es) continue;
      if (TRUE_COGNATE_KINDS.includes(c.kind)) trueCognates += 1;
      else translationOnly += 1;
    }
  }
  return { total, trueCognates, translationOnly };
};

export function checkCognateClaims(details, pathway, grade) {
  const errors = [];
  const want = statsFromCognates(details);
  const s = pathway.stats;
  if (s.terms !== want.total) errors.push(`${grade}: stats.terms ${s.terms} != ${want.total}`);
  if (s.true_cognates !== want.trueCognates)
    errors.push(`${grade}: true_cognates ${s.true_cognates} != recomputed ${want.trueCognates}`);
  if (s.translation_only !== want.translationOnly)
    errors.push(`${grade}: translation_only ${s.translation_only} != ${want.translationOnly}`);
  if (s.true_cognates + s.translation_only !== s.with_spanish)
    errors.push(`${grade}: cognate split does not add up to with_spanish`);
  return errors;
}

export const g04 = {
  id: "G-04",
  name: "cognate-claims",
  async run({ data }) {
    const errors = [];
    const borderline = [];
    for (const grade of GRADES) {
      const details = data.units.filter((u) => u.unit.grade === grade);
      const pathway = buildGradePathway(grade);
      errors.push(...checkCognateClaims(details, pathway, grade));
      for (const d of details)
        for (const c of d.esol_pack.cognates) {
          const re = classifyCognate(c.term, c.cognate_es).kind;
          if (re !== c.kind)
            errors.push(`${d.unit.id}/${c.term}: API kind ${c.kind} != classifier ${re}`);
          const sim = lcsSimilarity(c.term, c.cognate_es || "");
          if (c.kind === "bridge" && sim >= 0.55)
            borderline.push({
              unit: d.unit.id,
              term: c.term,
              es: c.cognate_es,
              sim: +sim.toFixed(2),
            });
        }
    }
    // Rendered wording: the headline must name the metric it shows.
    const { renderYearMap } = await import("../../bcpss-teachers/pathways/pathways-views.js");
    const html = renderYearMap({ ...buildGradePathway("6"), lanes: [] }, {});
    if (!/have a Spanish cognate/.test(html) || !/translation only/.test(html))
      errors.push("Year map wording does not separate cognates from translations");
    if (/words have a Spanish cognate<\/li>/.test(html))
      errors.push("Year map headline lacks the translation-only qualifier");
    return {
      errors,
      info: { borderlineBridgeForReview: borderline.length, borderline: borderline.slice(0, 40) },
    };
  },
  async controls({ data }) {
    const details = data.units.filter((u) => u.unit.grade === "6");
    const pathway = buildGradePathway("6");
    const mutated = clone(details);
    const bridge = mutated[0].esol_pack.cognates.find((c) => c.kind === "bridge");
    bridge.kind = "identical";
    const wrongStat = clone(pathway);
    wrongStat.stats.true_cognates = wrongStat.stats.terms;
    return [
      {
        name: "one cognate kind flipped bridge->identical",
        errors: checkCognateClaims(mutated, pathway, "6"),
      },
      {
        name: "headline claims every word is a cognate",
        errors: checkCognateClaims(details, wrongStat, "6"),
      },
    ];
  },
};
