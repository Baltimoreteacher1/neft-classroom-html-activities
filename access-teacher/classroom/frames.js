// Language Support Card (access-teacher/language-card/): authored sentence frames for ANY lesson, by language use and
// support level. Pure data and pure functions, no DOM, no network: a classroom teacher types the topic and the lesson's
// own key words, picks how students will use language, and prints one card with three levels of support.
//
// Uses follow the WIDA Key Language Uses (Narrate, Inform, Explain, Argue) plus Compare, the move content classes ask
// for most. Levels are SUPPORT levels (more support, some support, on my own), never proficiency labels or scores.
// Frames are original. `{topic}` is replaced by the teacher's topic; `___` stays a blank for the student.

export const USES = Object.freeze([
  {
    id: "inform",
    name: ["Inform", "Informar"],
    task: ["Tell facts about {topic}.", "Da datos sobre {topic}."],
  },
  {
    id: "explain",
    name: ["Explain", "Explicar"],
    task: ["Explain how or why it happens.", "Explica cómo o por qué pasa."],
  },
  {
    id: "argue",
    name: ["Argue", "Argumentar"],
    task: ["Make a claim and back it up with evidence.", "Di tu opinión y apóyala con evidencia."],
  },
  {
    id: "compare",
    name: ["Compare", "Comparar"],
    task: ["Tell how two things are alike and different.", "Di en qué se parecen y en qué son diferentes."],
  },
  {
    id: "narrate",
    name: ["Narrate", "Narrar"],
    task: ["Tell what happened, in order.", "Cuenta lo que pasó, en orden."],
  },
]);

export const LEVELS = Object.freeze([
  { id: "more", name: ["More support", "Más apoyo"] },
  { id: "some", name: ["Some support", "Algo de apoyo"] },
  { id: "own", name: ["On my own", "Por mi cuenta"] },
]);

export const BANDS = Object.freeze([
  { id: "k2", name: ["Grades K–2", "Grados K–2"] },
  { id: "38", name: ["Grades 3–8", "Grados 3–8"] },
]);

/** FRAMES[use][band][level] = three frames; WORDS[use][level] = connecting words for that level. */
export const FRAMES = Object.freeze({
  inform: {
    k2: {
      more: ["This is a ___.", "It has ___.", "It can ___."],
      some: ["In {topic}, there is ___.", "A ___ is ___.", "I learned that ___."],
      own: ["One fact about {topic} is ___.", "___ is important because ___.", "Another fact is ___."],
    },
    38: {
      more: ["One thing about {topic} is ___.", "It has ___ and ___.", "One example is ___."],
      some: [
        "One part of {topic} is ___, which ___.",
        "There are ___ main parts: ___, ___ and ___.",
        "For example, ___.",
      ],
      own: [
        "{topic} can be described as ___.",
        "One key feature is ___, which ___.",
        "According to ___, ___.",
      ],
    },
  },
  explain: {
    k2: {
      more: ["First, ___.", "Then, ___.", "It happens because ___."],
      some: ["___ happens because ___.", "When ___, then ___.", "This makes ___."],
      own: ["___ happens when ___.", "This causes ___.", "So, ___."],
    },
    38: {
      more: ["First, ___. Next, ___.", "___ happens because ___.", "This makes ___."],
      some: [
        "When ___, ___ happens because ___.",
        "This causes ___, so ___.",
        "The reason ___ is that ___.",
      ],
      own: [
        "___ occurs because ___; as a result, ___.",
        "The process begins when ___ and ends when ___.",
        "This matters because ___.",
      ],
    },
  },
  argue: {
    k2: {
      more: ["I think ___.", "I like ___ because ___.", "I know because ___."],
      some: ["I think ___ because ___.", "One reason is ___.", "I agree with ___ because ___."],
      own: ["I believe ___ because ___.", "My evidence is ___.", "Some people think ___, but ___."],
    },
    38: {
      more: ["I think ___ because ___.", "One reason is ___.", "I see this in ___."],
      some: [
        "I claim that ___ because ___.",
        "The evidence that shows this is ___.",
        "This proves my claim because ___.",
      ],
      own: [
        "I argue that ___. The strongest evidence is ___.",
        "This evidence matters because ___.",
        "Some may say ___; however, ___.",
      ],
    },
  },
  compare: {
    k2: {
      more: ["A ___ is ___.", "A ___ is ___ too.", "A ___ is big. A ___ is small."],
      some: ["___ and ___ are the same because ___.", "___ is different from ___ because ___.", "Both ___."],
      own: ["___ and ___ both ___.", "___ ___, but ___ ___.", "The biggest difference is ___."],
    },
    38: {
      more: ["___ and ___ are both ___.", "___ is ___, but ___ is ___.", "They are different because ___."],
      some: [
        "___ and ___ are similar because they both ___.",
        "___ is different from ___ because ___.",
        "One similarity is ___. One difference is ___.",
      ],
      own: [
        "While ___ ___, ___ ___.",
        "Both ___ and ___ ___; however, only ___ ___.",
        "The most important difference is ___ because ___.",
      ],
    },
  },
  narrate: {
    k2: {
      more: ["First, ___.", "Next, ___.", "Last, ___."],
      some: ["At the beginning, ___.", "Then, ___ so ___.", "At the end, ___."],
      own: ["One day, ___.", "Suddenly, ___.", "In the end, ___ because ___."],
    },
    38: {
      more: ["First, ___.", "Then, ___.", "Finally, ___."],
      some: [
        "At the beginning of ___, ___.",
        "After ___, ___ decided to ___.",
        "In the end, ___ because ___.",
      ],
      own: [
        "It started when ___.",
        "Meanwhile, ___, which led to ___.",
        "By the end, ___ had ___ because ___.",
      ],
    },
  },
});

export const WORDS = Object.freeze({
  inform: {
    more: ["is", "has", "can"],
    some: ["also", "for example", "such as"],
    own: ["in addition", "for instance", "according to"],
  },
  explain: {
    more: ["first", "then", "because"],
    some: ["when", "so", "this causes"],
    own: ["as a result", "therefore", "which leads to"],
  },
  argue: {
    more: ["I think", "because", "I know"],
    some: ["one reason", "evidence", "I agree / disagree"],
    own: ["I claim", "this shows", "however"],
  },
  compare: {
    more: ["same", "different", "both"],
    some: ["alike", "but", "similar"],
    own: ["while", "however", "in contrast"],
  },
  narrate: {
    more: ["first", "next", "last"],
    some: ["then", "after that", "at the end"],
    own: ["suddenly", "meanwhile", "eventually"],
  },
});

/** Partner talk for each use: what Partner A asks and how Partner B answers. Same routine at every level. */
export const TALK = Object.freeze({
  inform: { ask: "What is one fact about {topic}?", answer: "One fact is ___. I know because ___." },
  explain: { ask: "How does it happen?", answer: "First ___. Then ___ because ___." },
  argue: { ask: "What do you think, and why?", answer: "I think ___ because ___. Do you agree?" },
  compare: { ask: "How are they alike? How are they different?", answer: "They are alike because ___. They are different because ___." },
  narrate: { ask: "What happened first, next and last?", answer: "First ___. Next ___. Last ___." },
});

export const MAX_WORDS = 10;

/** Clean the teacher's key-word list: trimmed, unique (case-insensitive), at most MAX_WORDS, each at most 40 chars. */
export function cleanWords(text = "") {
  const seen = new Set();
  const out = [];
  for (const raw of String(text).split(/[,;\n]/)) {
    const w = raw.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!w || seen.has(w.toLowerCase())) continue;
    seen.add(w.toLowerCase());
    out.push(w);
    if (out.length === MAX_WORDS) break;
  }
  return out;
}

const fill = (s, topic) => s.replaceAll("{topic}", topic || "the topic");
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Everything one card shows. `levels` picks which support levels print (default all three, in order).
 * Returns null for an unknown use or band.
 */
export function buildCard({ use = "explain", band = "38", topic = "", words = "", levels } = {}) {
  const u = USES.find((x) => x.id === use);
  if (!u || !FRAMES[use]?.[band]) return null;
  const t = String(topic).trim().replace(/\s+/g, " ").slice(0, 80);
  const picked = (Array.isArray(levels) && levels.length ? LEVELS.filter((l) => levels.includes(l.id)) : LEVELS).map(
    (l) => ({
      id: l.id,
      name: l.name,
      frames: FRAMES[use][band][l.id].map((f) => capFirst(fill(f, t))),
      connectors: WORDS[use][l.id],
    }),
  );
  return {
    use: u.id,
    useName: u.name,
    task: [fill(u.task[0], t || "today's topic"), fill(u.task[1], t || "el tema de hoy")],
    topic: t,
    band,
    keyWords: cleanWords(words),
    levels: picked,
    talk: { ask: capFirst(fill(TALK[use].ask, t)), answer: TALK[use].answer },
  };
}

/** The card as plain text, for pasting into slides or a document. */
export function cardText(card) {
  const lines = [
    `${card.useName[0]}${card.topic ? `: ${card.topic}` : ""}`,
    card.task[0],
    card.keyWords.length ? `Key words: ${card.keyWords.join(", ")}` : "",
    "",
  ];
  for (const l of card.levels) {
    lines.push(`${l.name[0]} (useful words: ${l.connectors.join(", ")})`);
    for (const f of l.frames) lines.push(`  • ${f}`);
    lines.push("");
  }
  lines.push(`Partner talk — A: ${card.talk.ask}  B: ${card.talk.answer}`);
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim();
}

// ── The rest of the lesson: teaching moves, grades and the student practice link ──────────────────────────────

/** Three moves that help English learners in any lesson, then three for the chosen language use. Authored, original. */
export const MOVES = Object.freeze({
  any: [
    "Pre-teach the key words with a picture and a gesture before the lesson starts.",
    "Give think time: count to ten before anyone answers.",
    "Let students plan in their home language, then share in English.",
  ],
  inform: [
    "Show one labeled picture or diagram and point to each part as you name it.",
    "Say one frame aloud with your own example before students try.",
    "Partners take turns: one fact each until they run out.",
  ],
  explain: [
    "Draw the steps as boxes with arrows; students point while they talk.",
    "Model “because” and “so” with one example from today's lesson.",
    "Ask “why?” a second time to stretch a short answer.",
  ],
  argue: [
    "State a claim yourself, then show where your evidence is in the text.",
    "Offer two positions to choose from before asking an open question.",
    "Take a quick vote, then partners defend their side with one reason.",
  ],
  compare: [
    "Use a T-chart or a Venn diagram and fill in one row together.",
    "Hold two pictures side by side as you model “both” and “but”.",
    "Ask each pair for one way they are alike and one way they differ.",
  ],
  narrate: [
    "Put three picture cards in order; students retell with first, next, last.",
    "Act it out: students move or point as you tell what happened.",
    "Students retell to a partner before they write.",
  ],
});

/** The practice skill that fits each language use best (the student practice link opens it). */
export const SKILL_FOR_USE = Object.freeze({
  inform: "Reading",
  explain: "Speaking",
  argue: "Writing",
  compare: "Writing",
  narrate: "Speaking",
});

export const GRADES = Object.freeze(["K", "1", "2", "3", "4", "5", "6", "7", "8"]);

/** A single grade -> the frames band, the Student Hub pick and the practice content band. */
export function gradeInfo(grade = "6") {
  const g = GRADES.includes(String(grade)) ? String(grade) : "6";
  const n = g === "K" ? 0 : Number(g);
  const pick = n === 0 ? "K" : n === 1 ? "1" : n <= 3 ? "2-3" : n <= 5 ? "4-5" : "6-8";
  const content = { K: "K", 1: "1", "2-3": "2-3", "4-5": "3-5", "6-8": "6-8" }[pick];
  return { grade: g, band: n <= 2 ? "k2" : "38", pick, content, early: n <= 3 };
}

/** Where students practice the lesson's language: the Student Hub for their grade, opened at the matching skill. */
export function studentLink(grade, use) {
  const info = gradeInfo(grade);
  if (info.early) return `/access-practice-lab/early?grades=${info.content}`;
  const skill = SKILL_FOR_USE[use] || "mix";
  return `/access-practice-lab/students?pick=${info.pick}&grades=${info.content}&skill=${skill}`;
}
