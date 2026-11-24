// Builds the "ESOL Power Pack" for one BCPSS unit: a research-grounded 5-day language week of
// routines generated from the unit's own title, summary, vocabulary, sentence frame and WIDA
// Key Language Use. Pure and deterministic (same unit → same pack), so it works identically on
// the Neon backend and the seed fallback, with no database migration.

import {
  COGNATE_RULES,
  DOUBLE_DUTY_DEFAULTS,
  DOUBLE_DUTY_WORDS,
  FALSE_FRIENDS,
  KLU_NOUN,
  LADDER_BY_KLU,
  NEWCOMER_MENU,
  OBJECTIVE_VERB,
  PASSPORT_ICAN,
  SUBJECT_ROUTINES,
  TIER_PERFORMANCE,
} from "./esol-content.js";
import { buildDoctor } from "./esol-doctor.js";

export const ESOL_PACK_VERSION = 1;
const TIERS = ["1_2", "3_4", "5_6"];
const TIER_TERM_COUNT = { "1_2": 1, "3_4": 2, "5_6": 3 };

const hash = (s) => {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
};
const lcFirst = (s) =>
  /^[A-Z](?![A-Z0-9])/.test(s) && !/^I\b/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
const stripEnd = (s) =>
  String(s || "")
    .trim()
    .replace(/[.!?]+$/, "");
const fold = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

function seededOrder(list, seed) {
  return [...list]
    .map((item, i) => ({ item, k: hash(`${seed}:${i}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.item);
}

function normalizeVocab(raw) {
  return (Array.isArray(raw) ? raw : [])
    .map((v) => ({
      term: String(v.term || "").trim(),
      def: stripEnd(v.kid_def || v.student_friendly_def || ""),
      cognate: String(v.cognate_es || "").trim() || null,
      tier: Number(v.tier) || 2,
    }))
    .filter((v) => v.term);
}

// ── Cognate Detective ─────────────────────────────────────────────────────────

function ruleMatch(en, es) {
  for (const rule of COGNATE_RULES) {
    if (rule.verbOnly) {
      if (
        es === `${en}ar` ||
        es === `${en}r` ||
        (en.endsWith("e") && es === `${en.slice(0, -1)}ar`)
      )
        return rule;
      continue;
    }
    const ruleEs = fold(rule.es);
    if (!en.endsWith(rule.en) || !es.endsWith(ruleEs)) continue;
    const a = en.slice(0, en.length - rule.en.length);
    const b = es.slice(0, es.length - ruleEs.length);
    if (a.length >= 2 && b.length >= 2 && a.slice(0, 3) === b.slice(0, 3)) return rule;
  }
  return null;
}

function classifyCognate(term, cognate) {
  if (!cognate)
    return {
      kind: "no-cognate",
      tip: "No look-alike. Build the meaning with a picture, gesture and your home language.",
    };
  const enWords = fold(term)
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  const esWords = cognate.split("/").flatMap((p) => fold(p).split(/\s+/));
  let best = null;
  let hits = 0;
  for (const en of enWords) {
    let hit = null;
    for (const es of esWords) {
      if (en === es)
        hit = {
          kind: "identical",
          tip: "Spelled the same in both languages. Check the pronunciation.",
        };
      else if (ruleMatch(en, es)) hit = { kind: "pattern", tip: ruleMatch(en, es).tip };
      else if (en.slice(0, 4) === es.slice(0, 4) && en.length > 4)
        hit ||= {
          kind: "lookalike",
          tip: "The first letters match. Say both aloud and listen for the same root.",
        };
    }
    if (hit) {
      hits += 1;
      best ||= hit;
    }
  }
  if (!best)
    return {
      kind: "bridge",
      tip: "Same meaning, different word. Link them with a picture and say both words together.",
    };
  return hits < enWords.length
    ? { ...best, kind: "partial", tip: `${best.tip} Only part of the phrase matches.` }
    : best;
}

function pronunciationNote(term) {
  const w = fold(term).split(/\s+/)[0];
  if (/^s[bcdfgklmnpqrtvwz]/.test(w))
    return `Start “${term}” with a strong /s/ and no “e” before it (say “${w}”, not “e${w}”).`;
  if (/^h/.test(w)) return `The English “h” is pronounced: breathe out as you start “${term}.”`;
  return null;
}

function buildCognates(vocab) {
  return vocab.map((v) => {
    const c = classifyCognate(v.term, v.cognate);
    const ff = FALSE_FRIENDS[fold(v.term)] || null;
    return {
      term: v.term,
      def: v.def,
      cognate_es: v.cognate,
      kind: c.kind,
      tip: c.tip,
      false_friend: ff,
      pronunciation: pronunciationNote(v.term),
    };
  });
}

// ── Double-duty words ─────────────────────────────────────────────────────────

function buildDoubleDuty(unit, vocab) {
  const text = fold(
    [unit.unit_title, unit.unit_summary, ...vocab.flatMap((v) => [v.term, v.def])].join(" "),
  );
  const tokens = new Set(text.split(/[^a-z]+/).map((w) => w.replace(/(es|s)$/, "")));
  const find = (word) => DOUBLE_DUTY_WORDS.find((d) => d.word === word);
  const found = DOUBLE_DUTY_WORDS.filter(
    (d) => tokens.has(d.word) || tokens.has(d.word.replace(/(es|s)$/, "")),
  );
  const chosen = [...found];
  for (const w of DOUBLE_DUTY_DEFAULTS[unit.subject] || []) {
    if (chosen.length >= 3) break;
    const entry = find(w);
    if (entry && !chosen.includes(entry)) chosen.push(entry);
  }
  return chosen.slice(0, 3).map((d) => ({
    word: d.word,
    in_unit: found.includes(d),
    senses: d.senses.map(([ctx, def]) => ({ ctx, def })),
  }));
}

// ── Dictogloss ────────────────────────────────────────────────────────────────

function buildDictogloss(unit, vocab, grade) {
  const early = ["K", "1", "2"].includes(String(grade));
  const sentences = [];
  if (early) {
    for (const v of vocab.slice(0, 4))
      sentences.push(`The word “${v.term}” means ${lcFirst(v.def)}.`);
  } else {
    const summary = stripEnd(unit.unit_summary).replace(/^Students\s+/, "We ");
    sentences.push(`${summary}.`);
    const words = vocab.slice(0, 3).map((v) => `“${v.term}”`);
    if (words.length > 1)
      sentences.push(`Our key words are ${words.slice(0, -1).join(", ")} and ${words.at(-1)}.`);
    else if (words.length) sentences.push(`Our key word is ${words[0]}.`);
  }
  const text = sentences.join(" ");
  return {
    text,
    sentences,
    key_words: vocab.slice(0, 4).map((v) => v.term),
    word_count: text.split(/\s+/).length,
    steps: [
      "Listen 1 (normal speed) — pencils down. Students only listen.",
      "Listen 2 (normal speed) — students jot key words, numbers and verbs.",
      "Pair rebuild — partners combine notes and rebuild the text in their own words.",
      "Group rebuild — pairs merge into fours and write one best version.",
      "Compare — read the original aloud. Students check grammar, key words and meaning, then revise.",
    ],
    tier_notes: {
      "1_2":
        "Provide the key-word bank and a picture for each term; accept drawn, labeled or one-sentence rebuilds.",
      "3_4": "Students rebuild in full sentences; provide connectors on the board.",
      "5_6":
        "Students must keep the sentence structure and reorder clauses without changing meaning.",
    },
  };
}

// ── Info-gap jigsaw ───────────────────────────────────────────────────────────

function buildInfoGap(vocab, frame) {
  const card = (items) => items.map((v) => ({ term: v.term, def: v.def, cognate: v.cognate }));
  const a = vocab.filter((_, i) => i % 2 === 0);
  const b = vocab.filter((_, i) => i % 2 === 1);
  return {
    card_a: { knows: card(a), needs: b.map((v) => v.term) },
    card_b: { knows: card(b), needs: a.map((v) => v.term) },
    question_stems: [
      "What does “___” mean?",
      "How do you say “___” in your language?",
      "Can you say it another way?",
      "Can you give an example from our unit?",
    ],
    task: `Together, write one sentence that uses every term from both cards. Use: ${frame}`,
    rules: [
      "Do not show your card. Say it, draw it or act it.",
      "Ask at least two questions each.",
      "Check your partner’s answer by repeating it back.",
    ],
  };
}

// ── Sentence Ladder ───────────────────────────────────────────────────────────

function buildLadder(klu, unit, vocab, scaffolds) {
  const rungs = LADDER_BY_KLU[klu] || LADDER_BY_KLU.Explain;
  const gate = { "1_2": 2, "3_4": 3, "5_6": 4 };
  return {
    kernel: `We are using the word “${vocab[0]?.term || "explore"}” today.`,
    unit_terms: vocab.map((v) => v.term),
    tiers: Object.fromEntries(
      TIERS.map((t) => [
        t,
        {
          rungs: rungs.slice(0, gate[t]),
          frames: scaffolds?.[`level_${t}`]?.sentence_frames || [],
          word_bank: scaffolds?.[`level_${t}`]?.word_bank || [],
        },
      ]),
    ),
  };
}

// ── Talk Line ─────────────────────────────────────────────────────────────────

const SUBJECT_CLAIM = {
  Math: () => "Explaining your steps is as important as getting the answer.",
  Science: () => "You need evidence before you can explain a phenomenon.",
  "Social Studies": () =>
    "It is important to hear more than one perspective on a historical event.",
  ELA: () => "The author’s exact words matter more than the pictures.",
};

function buildTalkLine(unit, vocab) {
  return {
    statements: [
      `The most important word in this unit is “${vocab[0]?.term || "evidence"}.”`,
      (SUBJECT_CLAIM[unit.subject] || SUBJECT_CLAIM.ELA)(),
      "A word from my home language can help me understand this unit.",
    ],
    corners: ["Strongly agree", "Agree", "Disagree", "Strongly disagree"],
    stems: {
      "1_2": {
        agree: "I agree because ___.",
        disagree: "I disagree because ___.",
        unsure: "I am not sure.",
      },
      "3_4": {
        agree: "I agree with ___ because ___.",
        disagree: "I see it differently because ___.",
        unsure: "I partly agree, but ___.",
      },
      "5_6": {
        agree: "I concur that ___, given that ___.",
        disagree: "While I understand ___, I would argue ___.",
        unsure: "The evidence is mixed: on one hand ___, on the other ___.",
      },
    },
  };
}

// ── Spiral retrieval ──────────────────────────────────────────────────────────

function spiralPool(unit, catalog) {
  const units = catalog?.units || [];
  const conns = new Map((catalog?.connections || []).map((c) => [c.unit_id, c]));
  const order = (g) => (g === "K" ? 0 : Number(g));
  const same = units
    .filter(
      (u) =>
        u.subject === unit.subject &&
        String(u.grade) === String(unit.grade) &&
        u.unit_number < unit.unit_number,
    )
    .sort((a, b) => b.unit_number - a.unit_number);
  const prevGrade = units
    .filter(
      (u) => u.subject === unit.subject && order(String(u.grade)) === order(String(unit.grade)) - 1,
    )
    .sort((a, b) => b.unit_number - a.unit_number);
  const bridge = units.filter(
    (u) =>
      String(u.grade) === String(unit.grade) &&
      u.subject !== unit.subject &&
      u.unit_number === unit.unit_number,
  );
  const ordered = [
    ...same.slice(0, 2),
    ...prevGrade.slice(0, 1),
    ...bridge,
    ...prevGrade.slice(1, 2),
  ];
  const out = [];
  for (const u of ordered) {
    for (const v of normalizeVocab(conns.get(u.id)?.tier2_tier3_vocab)) {
      if (v.def) out.push({ ...v, from: u.unit_title, from_id: u.id });
    }
  }
  return out;
}

function buildRetrieval(unit, vocab, catalog, scaffolds) {
  const past = spiralPool(unit, catalog).slice(0, 3);
  const now = vocab
    .filter((v) => v.def)
    .slice(0, 2)
    .map((v) => ({ ...v, from: unit.unit_title, from_id: unit.id }));
  const all = [...past, ...now];
  const bankTerms = scaffolds?.level_3_4?.word_bank || [];
  return all.slice(0, 5).map((item, i) => {
    const distractors = seededOrder(
      [...all.map((x) => x.term), ...bankTerms].filter(
        (w, idx, arr) =>
          fold(w) !== fold(item.term) && arr.findIndex((z) => fold(z) === fold(w)) === idx,
      ),
      `${unit.id}:${i}`,
    ).slice(0, 3);
    const options = seededOrder([item.term, ...distractors], `${unit.id}:opt:${i}`);
    return {
      prompt: item.def,
      answer: item.term,
      options,
      answer_index: options.indexOf(item.term),
      from: item.from,
      spiral: past.includes(item),
    };
  });
}

// ── Assemble ──────────────────────────────────────────────────────────────────

function buildObjectives(unit, klu, vocab, scaffolds, conn) {
  const verb = OBJECTIVE_VERB[klu] || OBJECTIVE_VERB.Explain;
  const title = stripEnd(unit.unit_title);
  const language = {};
  const look_fors = {};
  for (const t of TIERS) {
    const frame = scaffolds?.[`level_${t}`]?.sentence_frames?.[0] || conn.unit_example_frame;
    const terms = vocab
      .slice(0, TIER_TERM_COUNT[t])
      .map((v) => `“${v.term}”`)
      .join(", ");
    language[t] =
      `Students will ${verb} this unit ${TIER_PERFORMANCE[t].mode}, using the frame “${frame}” and the unit term${TIER_TERM_COUNT[t] > 1 ? "s" : ""} ${terms}.`;
    look_fors[t] = TIER_PERFORMANCE[t].look;
  }
  return {
    content: unit.essential_question
      ? `Students will build understanding of “${title}” by answering: ${unit.essential_question}`
      : `Students will build understanding of “${title}.”`,
    language,
    look_fors,
    standards: unit.core_standards || [],
  };
}

function buildRoutines(unit, klu, vocab, frame) {
  const catalog = SUBJECT_ROUTINES[unit.subject] || SUBJECT_ROUTINES.ELA;
  const fit = catalog.filter((r) => r.klus.includes(klu));
  const picked = (fit.length >= 2 ? fit : catalog).slice(0, 2);
  const vars = {
    t1: vocab[0]?.term || "the key word",
    t2: vocab[1]?.term || vocab[0]?.term || "the key word",
    frame,
    title: stripEnd(unit.unit_title),
  };
  return picked.map((r) => ({
    id: r.id,
    name: r.name,
    source: r.source,
    steps: r.steps.map((s) => fill(s, vars)),
  }));
}

const WEEK = (hasRoutine) => [
  {
    day: 1,
    title: "Notice & Activate",
    minutes: 15,
    focus: "Notice word parts, cognates and double-duty words; retrieve earlier vocabulary.",
    sections: ["cognates", "doubleduty", "retrieval"],
  },
  {
    day: 2,
    title: "Listen & Capture",
    minutes: 20,
    focus: "Comprehensible input and pushed output through dictogloss; study the mentor sentence.",
    sections: ["dictogloss"],
  },
  {
    day: 3,
    title: "Practice & Negotiate",
    minutes: 20,
    focus: "Meaningful interaction in an information gap; notice and fix common transfer errors.",
    sections: ["infogap", "doctor"],
  },
  {
    day: 4,
    title: "Stretch & Debate",
    minutes: 25,
    focus: "Stretch sentences, take a position, and use a subject-area language routine.",
    sections: hasRoutine ? ["ladder", "talkline", "routines"] : ["ladder", "talkline"],
  },
  {
    day: 5,
    title: "Show & Share",
    minutes: 20,
    focus:
      "Self-assess language growth, build a home-language glossary, send the family mission home.",
    sections: ["passport", "glossary", "family"],
  },
];

export function buildEsolPack({ unit, connection, catalog, studio } = {}) {
  if (!unit || !connection) return null;
  const klu = connection.wida_klu || "Explain";
  const vocab = normalizeVocab(connection.tier2_tier3_vocab);
  const scaffolds =
    typeof connection.scaffolds_json === "string"
      ? JSON.parse(connection.scaffolds_json)
      : connection.scaffolds_json || {};
  const frame = connection.unit_example_frame || "In this unit, ___ shows that ___ because ___.";
  const title = stripEnd(unit.unit_title);
  const vars = {
    t1: vocab[0]?.term || "the key word",
    t2: vocab[1]?.term || vocab[0]?.term || "the key word",
    title,
    noun: KLU_NOUN[klu] || "main idea",
  };
  const routines = buildRoutines(unit, klu, vocab, frame);
  const cog = vocab[0]?.cognate;
  const t2 = vocab[1] || vocab[0];

  return {
    version: ESOL_PACK_VERSION,
    unit_id: unit.id,
    klu,
    objectives: buildObjectives(unit, klu, vocab, scaffolds, connection),
    week_plan: WEEK(routines.length > 0),
    cognates: buildCognates(vocab),
    double_duty: buildDoubleDuty(unit, vocab),
    dictogloss: buildDictogloss(unit, vocab, unit.grade),
    info_gap: buildInfoGap(vocab, frame),
    doctor: buildDoctor(unit, vocab, studio),
    ladder: buildLadder(klu, unit, vocab, scaffolds),
    talk_line: buildTalkLine(unit, vocab),
    routines,
    retrieval: buildRetrieval(unit, vocab, catalog, scaffolds),
    passport: Object.fromEntries(
      TIERS.map((t) => [
        t,
        Object.fromEntries(Object.entries(PASSPORT_ICAN[t]).map(([d, s]) => [d, fill(s, vars)])),
      ]),
    ),
    newcomer: NEWCOMER_MENU.map(([label, text]) => ({ label, text: fill(text, vars) })),
    family: {
      en: [
        {
          day: "Day 1 · Word Swap",
          text: `Teach someone at home the word “${vars.t1}.” Then ask them how to say it in your home language.`,
        },
        {
          day: "Day 2 · Tell It Your Way",
          text: `Explain the word “${vars.t1}” and one idea from class to a family member in any language you like. Ask them one question about it.`,
        },
        {
          day: "Day 3 · Show It",
          text: `Find or draw something at home that shows “${t2?.term || vars.t1}.” Bring it or a photo of it to class.`,
        },
      ],
      es: [
        {
          day: "Día 1 · Intercambio de palabras",
          text: `Enséñale a alguien en casa la palabra en inglés “${vars.t1}”${cog ? ` (${cog})` : ""}. Luego pídele que te diga cómo se dice en el idioma de su familia.`,
        },
        {
          day: "Día 2 · Cuéntalo a tu manera",
          text: `Explica la palabra “${vars.t1}” y una idea de la clase a un familiar en el idioma que prefieras. Hazle una pregunta sobre el tema.`,
        },
        {
          day: "Día 3 · Muéstralo",
          text: `Busca o dibuja algo en casa que muestre “${t2?.term || vars.t1}.” Tráelo o trae una foto a la clase.`,
        },
      ],
    },
  };
}
