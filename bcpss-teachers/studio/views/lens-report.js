// Language Lens report: turns the report from core/lens.js into readable sections. Every statement is an automated
// estimate; there are no scores. Spanish words come only from the studio's own vocabulary collections.
import { h } from "../core/dom.js";
import { CONCEPT_NOTE, splitSentences } from "../core/lens.js";
import { findEntry } from "../core/remix.js";
import { chip, section } from "./lens-ui.js";

const STRUCTURE_LABEL = {
  subordination: "Clauses joined with words such as because, when or if",
  conditionals: "If ... then sentences",
  passive: "Passive voice, where who did the action is hidden",
  nominalization: "Verbs turned into nouns, such as evaporate becoming evaporation",
  comparatives: "Comparing words, such as bigger, more or most",
  longNounPhrases: "Long noun phrases packed with details",
  multiClause: "Sentences with several clauses",
};

const FLAG_LABEL = {
  "long-sentence": "Long sentence",
  "pronoun-chain": "Many pronouns",
  negation: "Two negatives",
  idiom: "Idiom",
  "phrasal-verb": "Phrasal verb",
  polysemy: "Word with more than one meaning",
  "math-phrase": "Math phrase",
};

const MEANING_TYPES = ["polysemy", "idiom", "phrasal-verb", "math-phrase"];
const LOAD_WORDS = { lighter: "lighter", moderate: "moderate", heavier: "heavier" };
const plain = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function emptyNote(text) {
  return h("p", { class: "st-ll-muted" }, text);
}

function stat(label, value) {
  return h("div", { class: "st-lt-stat" }, h("dt", {}, label), h("dd", {}, String(value)));
}

function summary(a) {
  const { stats, languageLoad: load } = a;
  const grade = a.grade ? ` for grade ${a.grade}` : "";
  return section(
    "At a glance",
    h(
      "dl",
      { class: "st-lt-stats" },
      stat("Words", stats.words),
      stat("Sentences", stats.sentences),
      stat("Average sentence", `${stats.avgSentenceWords} words`),
      stat("Longest sentence", `${stats.longestSentenceWords} words`),
    ),
    h(
      "p",
      {},
      h("strong", {}, `The language load looks ${LOAD_WORDS[load.level] || load.level}${grade}. `),
      "This is an automated estimate from the points below. Your own judgement of your students comes first.",
    ),
    h(
      "ul",
      { class: "st-ll-list" },
      load.drivers.map((d) => h("li", {}, d)),
    ),
    h("p", { class: "st-ll-muted" }, CONCEPT_NOTE),
  );
}

function flagsBySentence(a) {
  const map = new Map();
  for (const b of a.barriers) {
    if (!FLAG_LABEL[b.type]) continue;
    const set = map.get(b.sentence) || new Map();
    set.set(b.type, FLAG_LABEL[b.type]);
    map.set(b.sentence, set);
  }
  return map;
}

function sentenceList(a, text) {
  const sentences = splitSentences(text);
  const flags = flagsBySentence(a);
  const list = h(
    "ol",
    { class: "st-lt-sentences" },
    sentences.map((s) => {
      const f = [...(flags.get(s.text)?.values() || [])];
      return h(
        "li",
        { class: f.length ? "st-lt-flagged" : "" },
        h("span", {}, s.text),
        f.length
          ? h(
              "span",
              { class: "st-lt-flags" },
              f.map((x) => chip(x)),
            )
          : null,
      );
    }),
  );
  const note = h(
    "p",
    { class: "st-ll-muted" },
    "Labels mark sentences worth a second look. A label is a prompt to check, not a problem.",
  );
  const details = h(
    "details",
    { class: "st-lt-details", open: sentences.length <= 14 ? "" : null },
    h("summary", {}, `Read the text sentence by sentence (${sentences.length})`),
    note,
    list,
  );
  return section("Where the language gets dense", details);
}

function vocabGroup(title, hint, items, slots) {
  const body = items.length
    ? h(
        "ul",
        { class: "st-lt-words" },
        items.map((v) => {
          const es = h("span", { class: "st-lt-es" });
          slots.push({ el: es, words: [v.word, ...(v.forms || [])] });
          return h(
            "li",
            {},
            h("strong", {}, v.word),
            h(
              "span",
              { class: "st-ll-muted" },
              v.count ? ` used ${v.count} ${v.count === 1 ? "time" : "times"}` : "",
            ),
            v.example ? h("q", { class: "st-lt-example" }, v.example) : null,
            es,
          );
        }),
      )
    : emptyNote("None found.");
  return h(
    "div",
    { class: "st-lt-group" },
    h("h3", {}, title),
    h("p", { class: "st-ll-muted" }, hint),
    body,
  );
}

function vocabulary(a, slots) {
  const v = a.vocabulary;
  return section(
    "Vocabulary by tier",
    vocabGroup(
      "Tier 3: subject words",
      "Specific to this subject. Teach these on purpose, with a picture or model.",
      v.technical,
      slots,
    ),
    vocabGroup(
      "Tier 2: academic words",
      "Used across subjects, such as explain, compare or justify. Students meet them in directions and questions.",
      v.academic,
      slots,
    ),
    vocabGroup(
      "Words to check",
      "Longer words the lists do not cover. Decide whether your students already know them.",
      v.candidates,
      slots,
    ),
    h(
      "p",
      { class: "st-ll-muted" },
      "Tier 1 words, the everyday ones, are not listed. The lists are limited, so a word that is missing may still need teaching.",
    ),
    h("div", { class: "st-lt-cognate-note", id: "st-lt-cognates" }),
  );
}

function meanings(a) {
  const items = a.barriers.filter((b) => MEANING_TYPES.includes(b.type));
  const body = items.length
    ? h(
        "ul",
        { class: "st-lt-barriers" },
        items.map((b) =>
          h(
            "li",
            {},
            chip(FLAG_LABEL[b.type]),
            h("strong", {}, ` ${b.text}`),
            b.count > 1 ? h("span", { class: "st-ll-muted" }, ` (${b.count} times)`) : null,
            h("p", {}, b.detail),
            b.likely === "check"
              ? h(
                  "p",
                  { class: "st-ll-muted" },
                  "Check which meaning your students will think of first.",
                )
              : null,
            b.sentence ? h("q", { class: "st-lt-example" }, b.sentence) : null,
          ),
        ),
      )
    : emptyNote(
        "No words with more than one meaning, idioms, phrasal verbs or math phrases were found in the lists this tool knows.",
      );
  return section("Words with more than one meaning, idioms and phrases", body);
}

function structures(a) {
  const rows = Object.keys(STRUCTURE_LABEL).filter((k) => (a.structures[k]?.count || 0) > 0);
  const body = rows.length
    ? h(
        "ul",
        { class: "st-lt-barriers" },
        rows.map((k) =>
          h(
            "li",
            {},
            h("strong", {}, STRUCTURE_LABEL[k]),
            h(
              "span",
              { class: "st-ll-muted" },
              ` found ${a.structures[k].count} ${a.structures[k].count === 1 ? "time" : "times"}`,
            ),
            h("q", { class: "st-lt-example" }, a.structures[k].examples[0]),
          ),
        ),
      )
    : emptyNote("No complex sentence structures were detected.");
  return section("Sentence structures to unpack", body);
}

function demands(a) {
  const fn = a.functions.length
    ? h(
        "ul",
        { class: "st-ll-list" },
        a.functions
          .slice(0, 5)
          .map((f) =>
            h(
              "li",
              {},
              h("strong", {}, f.label),
              h("span", { class: "st-ll-muted" }, ` (cue words: ${f.cues.join(", ")})`),
            ),
          ),
      )
    : emptyNote("No clear language task was detected, such as explain, compare or justify.");
  return section(
    "What students will do with language",
    fn,
    a.discourse.length
      ? h(
          "div",
          {},
          h("h3", {}, "Talk and writing patterns"),
          h(
            "ul",
            { class: "st-ll-list" },
            a.discourse.map((d) =>
              h("li", {}, `${d.text.charAt(0).toUpperCase()}${d.text.slice(1)}. ${d.because}`),
            ),
          ),
        )
      : null,
    a.oral.length
      ? h(
          "div",
          {},
          h("h3", {}, "Say it before writing it"),
          h(
            "ul",
            { class: "st-ll-list" },
            a.oral.slice(0, 5).map((o) => h("li", {}, o.text)),
          ),
        )
      : null,
    a.visuals.length
      ? h(
          "div",
          {},
          h("h3", {}, "Pictures and models that would help"),
          h(
            "ul",
            { class: "st-ll-list" },
            a.visuals.slice(0, 6).map((v) => h("li", {}, `${v.advice} for "${v.term}"`)),
          ),
        )
      : null,
  );
}

/** The report as { el, slots }. slots are the empty Spanish placeholders fillCollections() completes. */
export function renderReport(a, text) {
  const slots = [];
  const el = h(
    "div",
    { class: "st-lt-report" },
    summary(a),
    sentenceList(a, text),
    vocabulary(a, slots),
    meanings(a),
    structures(a),
    demands(a),
  );
  return { el, slots };
}

const similar = (en, es) => {
  const a = plain(en);
  const b = plain(es);
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i >= 4;
};

/** Fill the Spanish placeholders from studio collections. Cognates are flagged only for a similar spelling, never claimed. */
export function fillCollections(slots, collections, host) {
  let found = 0;
  for (const slot of slots) {
    let hit = null;
    for (const w of slot.words) {
      hit = findEntry(collections, w)?.entry || null;
      if (hit?.es?.word) break;
      hit = null;
    }
    if (!hit) continue;
    found += 1;
    slot.el.replaceChildren(
      ...[
        h("span", { class: "st-lt-es-word" }, `Spanish in the studio: ${hit.es.word}`),
        hit.es.verified === true
          ? chip("Verified", { tone: "ok" })
          : chip("Needs review", { tone: "review" }),
        similar(hit.word, hit.es.word) ? chip("Similar spelling, possible cognate") : null,
      ].filter(Boolean),
    );
  }
  host.replaceChildren(
    found
      ? h(
          "p",
          { class: "st-ll-muted" },
          `Spanish words appear only where the studio's vocabulary collections hold them (${found} here). A word with no Spanish listed may still have a cognate, so this is not a complete list.`,
        )
      : h(
          "p",
          { class: "st-ll-muted" },
          "None of these words are in the studio's vocabulary collections yet, so no Spanish or cognate information is shown. That does not mean they have no cognate.",
        ),
  );
}

/** The studio collection that covers the most detected words, or null. */
export function bestCollection(a, collections, grade = "") {
  const words = new Set(
    [...a.vocabulary.technical, ...a.vocabulary.academic].flatMap((v) =>
      [v.word, ...(v.forms || [])].map((x) => x.toLowerCase()),
    ),
  );
  let best = null;
  for (const c of collections) {
    const n = (c.entries || []).filter((e) => words.has(String(e.word).toLowerCase())).length;
    if (!n) continue;
    const gradeBonus = grade && String(c.grade) === String(grade) ? 0.5 : 0;
    if (!best || n + gradeBonus > best.n + best.bonus)
      best = { collection: c, n, bonus: gradeBonus };
  }
  return best ? { collection: best.collection, matched: best.n } : null;
}
