// G-95 vocab-studio-render-equals-data
// Sweeps all 162 BCPSS units to verify that every practice mode (flashcards, match, cloze,
// cognate detective), Word Family Explorer, and Printable Card Sheet renders strictly real
// authored unit data (zero invented text), tight print layout (0.5in margin, no forced page
// breaks), visible DRAFT_NOTICE provenance, and zero purple palette hues.

import {
  buildClozeItems,
  buildCognateItems,
  buildFlashcards,
  buildMatchItems,
  buildWordFamilyItems,
  COGNATE_CATEGORIES,
  renderPrintableVocabSheet,
  renderVocabPracticePanel,
} from "../../bcpss-teachers/vocab-practice.js";
import { normalizeVocab } from "../../bcpss-teachers/vocab-studio.js";
import { wordPartsFor } from "../../bcpss-teachers/vocab-word-parts.js";
import { DRAFT_NOTICE } from "../../shared/bcpss-provenance.js";
import { clone, vocabOf } from "./dataset.mjs";
import { colorsIn, isPurple } from "./gates-misc.mjs";
import { setupDom } from "./render.mjs";

function l1ListOf(detail) {
  const raw = detail?.connections?.[0]?.l1_watchouts;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") return Object.values(raw);
  return [];
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeEntities(str) {
  return String(str || "")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripTags(html) {
  return decodeEntities(String(html || "").replace(/<[^>]+>/g, " "));
}

/** Pure verification of one unit's practice modes, word family items, and printable card sheet. */
export function checkUnitVocabStudio(
  unit,
  terms,
  l1List,
  outputs,
  { draftNotice = DRAFT_NOTICE, provenanceState = "draft" } = {},
) {
  const errors = [];
  const uid = unit?.id || "unit";
  const byWord = new Map(terms.map((t) => [t.word.toLowerCase(), t]));
  const l1Texts = l1List.map((w) =>
    String(w?.friction_point || w?.watchout || w?.note || "").trim(),
  );

  // 1. Flashcards
  for (const fc of outputs.flashcards || []) {
    const src = byWord.get(String(fc.word || "").toLowerCase());
    if (!src) {
      errors.push(`${uid}: flashcard invented term "${fc.word}"`);
      continue;
    }
    if (fc.definition !== src.definition)
      errors.push(`${uid}/${fc.word}: flashcard definition != authored`);
    if ((fc.cognate || "") !== (src.cognate || ""))
      errors.push(`${uid}/${fc.word}: flashcard cognate != authored`);
    if ((fc.example || "") !== (src.example || ""))
      errors.push(`${uid}/${fc.word}: flashcard example != authored`);
    if ((fc.nonexample || "") !== (src.nonexample || ""))
      errors.push(`${uid}/${fc.word}: flashcard nonexample != authored`);
  }

  // 2. Match
  const pairs = outputs.match?.pairs || [];
  const shuffled = outputs.match?.shuffledDefs || [];
  if (pairs.length !== shuffled.length)
    errors.push(`${uid}: match pairs (${pairs.length}) != shuffledDefs (${shuffled.length})`);
  for (const p of pairs) {
    const src = byWord.get(String(p.word || "").toLowerCase());
    if (!src) {
      errors.push(`${uid}: match invented term "${p.word}"`);
      continue;
    }
    if (p.definition !== src.definition)
      errors.push(`${uid}/${p.word}: match definition != authored`);
  }
  const pairWords = new Set(pairs.map((p) => p.word));
  for (const s of shuffled) {
    if (!pairWords.has(s.word))
      errors.push(`${uid}: match shuffledDefs contains unknown term "${s.word}"`);
  }

  // 3. Context Cloze
  for (const cl of outputs.cloze || []) {
    const src = byWord.get(String(cl.word || "").toLowerCase());
    if (!src) {
      errors.push(`${uid}: cloze invented term "${cl.word}"`);
      continue;
    }
    if (!src.example) {
      errors.push(`${uid}/${cl.word}: cloze generated without authored example`);
      continue;
    }
    if (cl.originalExample !== src.example)
      errors.push(`${uid}/${cl.word}: cloze originalExample != authored example`);
    const re = new RegExp(`\\b${escapeRegExp(src.word)}\\b`, "gi");
    const expectedPrompt = src.example.replace(re, "_____");
    if (!cl.prompt.includes("_____") || cl.prompt !== expectedPrompt)
      errors.push(`${uid}/${cl.word}: cloze prompt does not match blanked authored example`);
    for (const choice of cl.choices || []) {
      if (!byWord.has(String(choice || "").toLowerCase()))
        errors.push(`${uid}/${cl.word}: cloze choice "${choice}" not in unit vocab`);
    }
  }

  // 4. Cognate Detective
  for (const cg of outputs.cognates || []) {
    const src = byWord.get(String(cg.word || "").toLowerCase());
    if (!src) {
      errors.push(`${uid}: cognate detective invented term "${cg.word}"`);
      continue;
    }
    if (!COGNATE_CATEGORIES[cg.category])
      errors.push(`${uid}/${cg.word}: invalid cognate category "${cg.category}"`);
    if ((cg.cognate || "") !== (src.cognate || ""))
      errors.push(`${uid}/${cg.word}: cognate text != authored`);
    if ((cg.falseFriend || "") !== (src.falseFriend || ""))
      errors.push(`${uid}/${cg.word}: falseFriend text != authored`);
    if (cg.evidence) {
      const validEvidence =
        cg.evidence === src.falseFriend ||
        cg.evidence === src.cognate ||
        l1Texts.includes(cg.evidence);
      if (!validEvidence)
        errors.push(`${uid}/${cg.word}: cognate evidence "${cg.evidence}" not in authored data`);
    }
  }

  // 5. Word Family Explorer
  for (const fam of outputs.wordFamilies || []) {
    const src = byWord.get(String(fam.word || "").toLowerCase());
    if (!src) {
      errors.push(`${uid}: word family invented term "${fam.word}"`);
      continue;
    }
    const authoredFam = new Set((src.family || []).map((f) => f.toLowerCase()));
    for (const member of fam.family || []) {
      if (!authoredFam.has(String(member || "").toLowerCase()))
        errors.push(`${uid}/${fam.word}: family member "${member}" not in authored family`);
    }
    const expectedParts = wordPartsFor(src.word);
    if ((fam.wordParts || "") !== expectedParts)
      errors.push(`${uid}/${fam.word}: wordParts != vocab-word-parts table`);
  }

  // 6. Printable Card Sheet
  const html = String(outputs.printHtml || "");
  if (!/@page\s*\{[^}]*margin:\s*0\.5in/i.test(html))
    errors.push(`${uid}: printable sheet missing @page { margin: 0.5in; }`);
  if (/page-break-before:\s*always|break-before:\s*page/i.test(html))
    errors.push(`${uid}: printable sheet contains forced page break`);
  if (provenanceState !== "reviewed" && !html.includes(draftNotice))
    errors.push(`${uid}: printable sheet missing DRAFT_NOTICE provenance`);
  if (/#4a2580/i.test(html))
    errors.push(`${uid}: printable sheet contains forbidden purple #4A2580`);
  for (const c of colorsIn(html)) {
    if (isPurple(c))
      errors.push(
        `${uid}: printable sheet contains purple color ${c.raw} (hue ${Math.round(c.h)})`,
      );
  }
  const renderedTerms = [...html.matchAll(/data-print-term="([^"]+)"/g)].map((m) =>
    decodeEntities(m[1]),
  );
  for (const rt of renderedTerms) {
    if (!byWord.has(rt.toLowerCase()))
      errors.push(`${uid}: printable sheet rendered invented term "${rt}"`);
  }
  const plain = stripTags(html);
  for (const t of terms) {
    if (!plain.includes(t.word))
      errors.push(`${uid}: printable sheet omitted authored term "${t.word}"`);
  }

  return errors;
}

export const gateVocabStudio = {
  id: "G-95",
  name: "vocab-studio-render-equals-data",
  async run({ data }) {
    const errors = [];
    let unitsChecked = 0;
    let unitsWithFlashcards = 0;
    let unitsWithMatch = 0;
    let unitsWithCloze = 0;
    let unitsWithCognates = 0;
    let unitsWithWordFamilies = 0;
    let unitsWithWordParts = 0;

    for (const d of data.units) {
      unitsChecked += 1;
      const terms = normalizeVocab(vocabOf(d));
      const l1List = l1ListOf(d);
      const provState = d.provenance?.state || "draft";

      const flashcards = buildFlashcards(terms);
      const match = buildMatchItems(terms, { seed: d.unit.id });
      const cloze = buildClozeItems(terms, { seed: d.unit.id });
      const cognates = buildCognateItems(terms, l1List);
      const wordFamilies = buildWordFamilyItems(terms);
      const printHtml = renderPrintableVocabSheet(d.unit, terms, {
        wida: "3_4",
        draftNotice: DRAFT_NOTICE,
        provenanceState: provState,
      });

      if (flashcards.length) unitsWithFlashcards += 1;
      if (match.pairs.length) unitsWithMatch += 1;
      if (cloze.length) unitsWithCloze += 1;
      if (cognates.length) unitsWithCognates += 1;
      if (wordFamilies.length) unitsWithWordFamilies += 1;
      if (wordFamilies.some((w) => w.wordParts)) unitsWithWordParts += 1;

      errors.push(
        ...checkUnitVocabStudio(
          d.unit,
          terms,
          l1List,
          { flashcards, match, cloze, cognates, wordFamilies, printHtml },
          { draftNotice: DRAFT_NOTICE, provenanceState: provState },
        ),
      );
    }

    // Coverage floors across the 162 BCPSS units
    if (unitsChecked < 162) errors.push(`only ${unitsChecked} units checked (floor 162)`);
    if (unitsWithFlashcards < 160)
      errors.push(`only ${unitsWithFlashcards} units with flashcards (floor 160)`);
    if (unitsWithMatch < 160) errors.push(`only ${unitsWithMatch} units with match (floor 160)`);
    if (unitsWithCloze < 150) errors.push(`only ${unitsWithCloze} units with cloze (floor 150)`);
    if (unitsWithCognates < 160)
      errors.push(`only ${unitsWithCognates} units with cognates (floor 160)`);
    if (unitsWithWordFamilies < 150)
      errors.push(`only ${unitsWithWordFamilies} units with word families (floor 150)`);
    if (unitsWithWordParts < 50)
      errors.push(`only ${unitsWithWordParts} units with word parts (floor 50)`);

    // Smoke-test DOM mount of all 5 tabs + Print Card Sheet button on a real unit
    const sample = data.units.find((u) => u.unit.id === "g6-math-u1") || data.units[0];
    const window = setupDom();
    const mount = window.document.createElement("div");
    window.document.body.append(mount);
    renderVocabPracticePanel(mount, {
      unit: sample.unit,
      terms: normalizeVocab(vocabOf(sample)),
      l1Watchouts: l1ListOf(sample),
      wida: "3_4",
      provenance: sample.provenance,
    });
    for (const tab of ["flashcard", "match", "cloze", "cognate", "family"]) {
      const btn = mount.querySelector(`[data-vp-tab="${tab}"]`);
      if (!btn) {
        errors.push(`DOM mount missing tab button "${tab}"`);
        continue;
      }
      btn.click();
      if (!mount.querySelector(`[data-vp-view="${tab}"]`))
        errors.push(`DOM mount failed to render view "${tab}"`);
    }
    if (!mount.querySelector("[data-vp-print-sheet]"))
      errors.push("DOM mount missing Print Card Sheet button");
    if (!mount.textContent.includes(DRAFT_NOTICE)) errors.push("DOM mount missing DRAFT_NOTICE");
    mount.remove();

    return {
      errors,
      info: {
        unitsChecked,
        unitsWithFlashcards,
        unitsWithMatch,
        unitsWithCloze,
        unitsWithCognates,
        unitsWithWordFamilies,
        unitsWithWordParts,
      },
    };
  },

  async controls({ data }) {
    const sample = data.units.find((u) => u.unit.id === "g6-math-u1") || data.units[0];
    const terms = normalizeVocab(vocabOf(sample));
    const l1List = l1ListOf(sample);
    const base = {
      flashcards: buildFlashcards(terms),
      match: buildMatchItems(terms, { seed: sample.unit.id }),
      cloze: buildClozeItems(terms, { seed: sample.unit.id }),
      cognates: buildCognateItems(terms, l1List),
      wordFamilies: buildWordFamilyItems(terms),
      printHtml: renderPrintableVocabSheet(sample.unit, terms, {
        wida: "3_4",
        draftNotice: DRAFT_NOTICE,
        provenanceState: "draft",
      }),
    };

    // Control A: inject an invented term + invented cloze sentence not in unit data
    const invented = clone(base);
    invented.flashcards.push({
      word: "zyx-invented-term",
      tier: "Tier 3",
      definition: "An invented definition not in unit data.",
      cognate: "",
      example: "This sentence was invented.",
      nonexample: "",
    });
    if (invented.cloze.length) {
      invented.cloze[0].prompt = "An invented _____ sentence not in unit data.";
    }

    // Control B: strip DRAFT_NOTICE from the printable sheet
    const strippedNotice = clone(base);
    strippedNotice.printHtml = strippedNotice.printHtml.split(DRAFT_NOTICE).join("");

    // Control C: inject forbidden purple + forced page break into printable sheet
    const purpleBreak = clone(base);
    purpleBreak.printHtml = purpleBreak.printHtml.replace(
      "</style>",
      ".bad{color:#4A2580;page-break-before:always;}</style>",
    );

    return [
      {
        name: "invented term and cloze sentence not in unit data",
        errors: checkUnitVocabStudio(sample.unit, terms, l1List, invented, {
          draftNotice: DRAFT_NOTICE,
          provenanceState: "draft",
        }),
      },
      {
        name: "printable sheet with DRAFT_NOTICE stripped",
        errors: checkUnitVocabStudio(sample.unit, terms, l1List, strippedNotice, {
          draftNotice: DRAFT_NOTICE,
          provenanceState: "draft",
        }),
      },
      {
        name: "printable sheet with purple #4A2580 and forced page break",
        errors: checkUnitVocabStudio(sample.unit, terms, l1List, purpleBreak, {
          draftNotice: DRAFT_NOTICE,
          provenanceState: "draft",
        }),
      },
    ];
  },
};
