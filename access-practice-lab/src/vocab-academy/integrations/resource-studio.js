// Vocabulary Academy · Resource Studio side: turn one unit into a teacher's printable resource.
//
// "Resource Studio" in this product is the Lesson Builder (src/views/lesson-builder.js, src/lesson-builder/*): the
// lab's one-click generator of lesson plans, student sheets, vocabulary grids and lesson packs. (The page titled
// "Teacher Lesson Resource Studio" lives on eduwonderlab.com for Grade 6 math and is not served on The Language Page.)
// This module does not author anything of its own: it feeds the Lesson Builder's lesson model
// (`phase.words`, `phase.teacher`, the glossary its pack export takes) and renders printable sheets through the same
// print path (`printSheet`). Worksheet and review packet are the Print area's pages (/print/<G>/<N>/workbook|review)
// and are linked, not rebuilt.
//
// Pure: no DOM, no storage. Teacher-only content (answer keys) is returned apart in `key`, never inside the student
// sheet markup, and is printed only on the teacher's explicit "with answers" request.
import { html } from "../../util.js";
import { LESSONS } from "../contract.js";
import { vaHref } from "../data.js";
import { allForms, boldWords } from "../print/shared.js";

const clean = (v, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const wordsOf = (unit) => (Array.isArray(unit?.words) ? unit.words : []);
const forms = (unit) => allForms(wordsOf(unit));

/** The six things a teacher can make from a unit. `via: "print"` kinds are the Print area's existing pages. */
export const RESOURCE_KINDS = Object.freeze([
  { id: "worksheet", label: ["Worksheet", "Hoja de trabajo"], via: "print", printKind: "workbook" },
  { id: "exit", label: ["Exit ticket", "Boleto de salida"] },
  { id: "reading", label: ["Reading activity", "Actividad de lectura"] },
  { id: "writing", label: ["Writing task", "Tarea de escritura"] },
  {
    id: "review",
    label: ["Review packet", "Paquete de repaso"],
    via: "print",
    printKind: "review",
  },
  { id: "differentiated", label: ["Differentiated practice", "Práctica diferenciada"] },
]);

/** The unit's printable page for a `via: "print"` kind (the Print area renders it). */
export const printHref = (unit, printKind) => vaHref("print", unit.grade, unit.n, printKind);

const withBlanks = (word, which = 1) => {
  const c = which === 2 ? word.cloze2 : word.cloze;
  return c?.s?.includes("___") && c?.f ? { s: c.s, f: c.f, id: word.id } : null;
};
const clozeItems = (unit, which, max) =>
  wordsOf(unit)
    .map((w) => withBlanks(w, which))
    .filter(Boolean)
    .slice(0, max);

/**
 * One sheet: `{ title, lead, sections: [{ heading, kind: "list"|"bank"|"lines"|"text", items }], key: [string] }`.
 * `tier` ("A" more support, "B" some support, "C" less support) only changes `differentiated`.
 * Returns null when the unit cannot support the kind (no passage, no cloze data): callers say so instead of printing
 * a thin sheet.
 */
export function resourceSheet(kind, unit, { tier = "B" } = {}) {
  const words = wordsOf(unit);
  if (!words.length) return null;
  const title = `${clean(unit.title, 120)} · ${
    {
      exit: "Exit ticket",
      reading: "Reading activity",
      writing: "Writing task",
      differentiated: "Practice",
    }[kind] || kind
  }`;
  const bank = words.map((w) => w.hw);
  const base = { title, unit: unit.id, key: [] };
  if (kind === "exit") {
    const items = clozeItems(unit, 1, 3);
    if (items.length < 2) return null;
    const target = words.find((w) => w.frame) || words[0];
    return {
      ...base,
      lead: "Fill in each blank with a word from the box. Then write one sentence.",
      sections: [
        { heading: "Word box", kind: "bank", items: items.map((i) => i.f) },
        { heading: "1. Which word fits?", kind: "list", items: items.map((i) => i.s) },
        {
          heading: `2. Write a sentence with “${target.hw}”.`,
          kind: "lines",
          items: [clean(target.frame, 200)],
        },
      ],
      key: items.map((i, n) => `${n + 1}. ${i.f}`),
    };
  }
  if (kind === "reading") {
    const passage = unit.passage;
    const paras = (Array.isArray(passage?.paras) ? passage.paras : [])
      .map((p) => clean(p, 2000))
      .filter(Boolean);
    const qs = (Array.isArray(passage?.qs) ? passage.qs : []).slice(0, 4);
    if (!paras.length || !qs.length) return null;
    const letters = "ABCD";
    return {
      ...base,
      title: `${clean(passage.title, 120) || title} · Reading activity`,
      lead: "Read the passage. Circle each word from the box when you see it. Then answer the questions.",
      sections: [
        { heading: "Word box", kind: "bank", items: bank },
        { heading: "Passage", kind: "text", items: paras },
        {
          heading: "Questions",
          kind: "list",
          items: qs.map((q) => ({
            q: clean(q.q, 300),
            choices: (q.choices || []).map((c, i) => `${letters[i]}. ${clean(c, 200)}`),
          })),
        },
      ],
      key: qs.map((q, n) => `${n + 1}. ${letters[q.a] ?? "?"}`),
    };
  }
  if (kind === "writing") {
    const w = passage_write(unit);
    if (!w) return null;
    return {
      ...base,
      lead: "Plan out loud first. Then write. Use at least two words from the box.",
      sections: [
        { heading: "Word box", kind: "bank", items: bank },
        { heading: "Your task", kind: "text", items: [w.prompt] },
        ...(w.frame ? [{ heading: "Sentence starter", kind: "text", items: [w.frame] }] : []),
        { heading: "Write here", kind: "lines", items: ["", "", "", "", ""] },
        {
          heading: "Check yourself",
          kind: "list",
          items: [
            "I used at least two words from the box.",
            "My sentences make sense together.",
            "I read my writing aloud.",
          ],
        },
      ],
    };
  }
  if (kind === "differentiated") return differentiated(unit, base, tier, bank);
  return null;
}

const passage_write = (unit) => {
  const p = unit.passage?.write;
  if (clean(p?.prompt)) return { prompt: clean(p.prompt, 400), frame: clean(p.frame, 300) };
  const e = clean(unit.produce?.explain, 400);
  return e ? { prompt: e, frame: "" } : null;
};

function differentiated(unit, base, tier, bank) {
  const words = wordsOf(unit);
  const label = {
    A: "Practice A · most help",
    B: "Practice B · some help",
    C: "Practice C · less help",
  }[tier];
  if (!label) return null;
  const head = { ...base, title: `${clean(unit.title, 120)} · ${label}` };
  if (tier === "A") {
    return {
      ...head,
      lead: "Match each word to its meaning. Say each word aloud. Then finish the sentence.",
      sections: [
        {
          heading: "Words",
          kind: "list",
          items: words.map((w) => `${(w.visual?.glyphs || []).join(" ")} ${w.hw}`.trim()),
        },
        {
          heading: "Meanings (write the letter next to each word)",
          kind: "list",
          items: shuffledDefs(unit).map(([letter, def]) => `${letter}. ${def}`),
        },
        {
          heading: "Finish the sentence",
          kind: "lines",
          items: [clean(words.find((w) => w.frame)?.frame, 200)],
        },
      ],
      key: words.map(
        (w, n) =>
          `${n + 1}. ${shuffledDefs(unit).find(([, d]) => d === clean(w.def, 300))?.[0] ?? "?"}`,
      ),
    };
  }
  const items = clozeItems(unit, tier === "B" ? 1 : 2, 6);
  if (items.length < 3) return null;
  const sections = [
    ...(tier === "B" ? [{ heading: "Word box", kind: "bank", items: items.map((i) => i.f) }] : []),
    { heading: "Fill in the blank", kind: "list", items: items.map((i) => i.s) },
  ];
  if (tier === "C") {
    const prompts = (Array.isArray(unit.produce?.sentences) ? unit.produce.sentences : [])
      .slice(0, 2)
      .map((s) => clean(s, 300));
    const combine = (Array.isArray(unit.produce?.combine) ? unit.produce.combine : [])[0]?.given;
    sections.push({
      heading: "Write original sentences",
      kind: "lines",
      items: prompts.length ? prompts : [""],
    });
    if (Array.isArray(combine) && combine.length)
      sections.push({
        heading: "Combine these into one sentence",
        kind: "text",
        items: combine.map((s) => clean(s, 200)),
      });
  } else
    sections.push({
      heading: "Use a word from the box in your own sentence",
      kind: "lines",
      items: [""],
    });
  return {
    ...head,
    lead:
      tier === "B"
        ? "Use the word box if you need it."
        : "Choose the best word for each blank. No word box.",
    sections,
    key: items.map((i, n) => `${n + 1}. ${i.f}`),
  };
}

/** Definitions in a fixed, unit-seeded order that is not the word order (so matching is a real task). */
function shuffledDefs(unit) {
  const defs = wordsOf(unit).map((w) => clean(w.def, 300));
  const rotated = defs.map((_, i) => defs[(i * 3 + 1) % defs.length]);
  const order = new Set(rotated).size === defs.length ? rotated : [...defs].reverse();
  return order.map((d, i) => ["ABCDEFGHIJ"[i], d]);
}

const renderItem = (it) =>
  typeof it === "string"
    ? it
    : html`${it.q}<br />${(it.choices || []).map((c) => html`<span class="va-int-choice">${c}</span>`)}`;

/** Printable markup for `printSheet`. `withKey` appends the teacher key on its own page. */
export function resourceHTML(sheet, { unit = null, withKey = false } = {}) {
  const marked = (text) => (unit ? boldWords(text, forms(unit)) : text);
  return html`<article class="lb-print va-int-sheet" lang="en">
    <h1>${sheet.title}</h1>
    <p>${sheet.lead}</p>
    ${sheet.sections.map(
      (s) =>
        html`<section class="va-int-sec va-int-${s.kind}">
          <h2>${s.heading}</h2>
          ${
            s.kind === "bank"
              ? html`<p class="va-int-bank">${s.items.map((w) => html`<span>${w}</span>`)}</p>`
              : s.kind === "lines"
                ? html`${s.items.filter(Boolean).map((t) => html`<p>${t}</p>`)}
                    <div class="va-int-writing"></div>`
                : s.kind === "text"
                  ? s.items.map((t) => html`<p>${marked(t)}</p>`)
                  : html`<ol>
                      ${s.items.map((t) => html`<li>${renderItem(t)}</li>`)}
                    </ol>`
          }
        </section>`,
    )}
    ${
      withKey && sheet.key.length
        ? html`<section class="va-int-key lb-print-day">
            <h2>Teacher key</h2>
            <p>${sheet.key.join("   ")}</p>
          </section>`
        : ""
    }
    <p class="va-int-foot">
      Vocabulary Academy · practice for vocabulary growth, not a WIDA or ACCESS score.
    </p>
  </article>`;
}

// ── Lesson Builder model (public fields only) ───────────────────────────────────────────────

/**
 * Put the unit's words into a Lesson Builder lesson's vocabulary phase (the same fields the builder, its print page
 * and its pack export already read). Returns { ok, words } or { ok: false, reason }.
 */
export function applyUnitVocabulary(lesson, unit) {
  const phase = lesson?.phases?.find((p) => p.key === "vocabulary");
  if (!phase) return { ok: false, reason: "no-vocabulary-phase" };
  const words = wordsOf(unit)
    .map((w) => clean(w.hw, 60))
    .filter(Boolean)
    .slice(0, 8); // the builder's saved-lesson validator keeps at most eight
  if (!words.length) return { ok: false, reason: "no-words" };
  phase.words = words;
  phase.teacher = `Preview the lesson words: ${words.join(", ")}. Say each one, use it in a sentence, and have students repeat it. Meanings, pictures and Spanish glosses are on the Vocabulary Academy word cards (${clean(unit.title, 80)}).`;
  phase.student = `Say each word with your partner: ${words.join(", ")}.`;
  phase.edited = true;
  return { ok: true, words };
}

/** The pack export's glossary shape (`{ terms: [{ term, es, emoji }] }`) for a unit's words. */
export const glossaryFromUnit = (unit) => ({
  terms: wordsOf(unit).map((w) => ({
    term: clean(w.hw, 60),
    es: clean(w.es?.gloss, 80),
    emoji: clean(w.visual?.glyphs?.[0], 8),
  })),
});

/** The unit's entries first, so its Spanish and picture win over a same-spelled general glossary entry. */
export function mergeGlossary(base, extra) {
  const seen = new Set((extra?.terms || []).map((t) => String(t.term).toLowerCase()));
  return {
    ...(base || {}),
    terms: [
      ...(extra?.terms || []),
      ...(base?.terms || []).filter((t) => !seen.has(String(t.term).toLowerCase())),
    ],
  };
}

export const lessonLetterLabel = (letter) => LESSONS.find((l) => l.id === letter) || null;
