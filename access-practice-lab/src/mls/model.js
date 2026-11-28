// Math Literacy Studio: the shared content model. buildResource(skill, type, opts) turns one skill (inventory record merged with its
// authored content) into a Resource made of blocks. Every export format renders from the same Resource, which is why a teacher can
// change format without starting over and why answers, objectives, terms and scaffolds never drift between formats.
// Deterministic: the same skill, type and options always build the same Resource (seeded generators, no clock, no random).
import { choicesOf, makeRng } from "./kit.js";
import { generate } from "./families.js";
import { BANDS, INDEPENDENCE, PRESETS, SPANISH_NOTE, bandOf, fadingPath, framesFor, sentenceSteps, textLevelOf, wordBank } from "./lang.js";
import { renderVisual } from "./visuals.js";

// ---------------------------------------------------------------------------------------------------------------- catalog
const CATALOG = new Map();
/** Register merged skills so prerequisite lookups work. */
export const registerSkills = (list) => {
  for (const s of list) CATALOG.set(s.id, s);
};
export const getSkill = (id) => CATALOG.get(id);

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// ---------------------------------------------------------------------------------------------------------------- options
/** Normalise options. Math level, language band, visuals, writing support, independence and count are INDEPENDENT dials; `support` only sets their defaults. */
export function normalizeOpts(o = {}, skill = {}) {
  const preset = PRESETS[o.support] || PRESETS.standard;
  const band = bandOf(o.band ?? preset.band);
  return {
    support: PRESETS[o.support] ? o.support : "standard",
    math: clamp(Number(o.math ?? preset.math), 1, 3),
    band,
    visuals: o.visuals ?? preset.visuals,
    writing: o.writing ?? preset.writing,
    independence: INDEPENDENCE.some((x) => x.id === o.independence) ? o.independence : preset.independence,
    count: clamp(Number(o.count ?? preset.count), 1, 20),
    ctx: o.ctx || skill.contexts?.[0] || "store",
    seed: Number.isFinite(Number(o.seed)) ? Number(o.seed) : 1,
    key: o.key !== false,
    pseed: o.pseed || {},
    hide: o.hide || [],
    title: o.title || "",
    directions: o.directions || "",
    reading: o.reading ?? band === "1-2",
    variant: o.variant || "",
  };
}

// ---------------------------------------------------------------------------------------------------------------- helpers
const P = (text, style) => (style ? { t: "p", text, style } : { t: "p", text });
const note = (text) => P(text, "note");
const dir = (text) => P(text, "directions");
const teacher = (text) => P(text, "teacher");
const sec = (heading, ...blocks) => ({ heading, blocks: blocks.flat().filter(Boolean) });
const nameLine = () => P("Name: ______________________   Date: ______________");
function vis(spec, alt) {
  if (!spec) return null;
  let a = alt;
  try {
    a = a || renderVisual(spec).alt;
  } catch {
    a = a || "A picture";
  }
  return { t: "visual", spec, alt: a };
}
const lines = (prompt, n = 3) => ({ t: "lines", prompt, n });
const list = (items, ordered = false) => ({ t: "list", items, ordered });
const table = (headers, rows, caption) => ({ t: "table", headers, rows, caption });
const cardsOf = (items, cols = 2) => ({ t: "cards", items, cols });
const check = (items) => ({ t: "check", items });

const workspaceFor = (grade, size = 3) => (grade <= 2 ? { kind: "box", size } : grade <= 5 ? { kind: "lines", size } : { kind: "box", size: size + 1 });
const unitOf = (p) => (p.answer.unit ? ` ${p.answer.unit}` : "");
const ansText = (p) => (p.answer.text.includes(unitOf(p).trim()) || !p.answer.unit ? p.answer.text : `${p.answer.text}${unitOf(p)}`);

/** n distinct Problems for a resource. `tag` separates problem sets inside one resource; `pseed["tag:n"]` regenerates one problem. */
export function genProblems(skill, op, n, { level = op.math, ctx = op.ctx, tag = 0, prefer } = {}) {
  const out = [];
  const seen = new Set();
  const base = op.seed * 1009 + tag * 97;
  for (let i = 0; out.length < n && i < n * 12 + 12; i++) {
    const idx = out.length + 1;
    const seed = op.pseed[`${tag}:${idx}`] ?? base + i;
    const p = generate(skill.familyId, skill.params, { seed, level, ctx });
    const k = JSON.stringify(p.spec);
    if (seen.has(k)) continue;
    if (prefer && !prefer(p) && i < n * 6) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

/** One Problem as a `problem` block, with the key entry. Scaffolds follow the independence dial. */
function problemBlocks(skill, op, p, n, { choices = false, frames, tag = 0, idx = n } = {}) {
  const tl = textLevelOf(op.band);
  const stem = p.stem[tl];
  const b = {
    t: "problem",
    n,
    ask: p.ask[tl],
    stem: stem || undefined,
    expr: p.expr || undefined,
    visual: p.visual || undefined,
    workspace: workspaceFor(skill.grade, 3),
    answer: p.answer.value,
    explain: p.work.join(" "),
    hint: p.hints.conceptual,
    tag,
    idx,
  };
  if (choices) {
    const cs = choicesOf(p, op.seed + n + tag);
    b.choices = cs.map((c) => c.text);
    b.correct = cs.findIndex((c) => c.correct);
    b.workspace = { kind: "none", size: 0 };
  }
  if (frames?.length) b.frames = frames;
  const blocks = [b];
  if (op.independence === "guided" && !choices) blocks.push(note(`Start here: ${p.work[0]}`));
  return { blocks, key: { ref: `Problem ${n}`, answer: ansText(p), work: p.work } };
}

/** The practice section: worked example / hints / frames / nothing, by the independence dial. */
function practice(skill, op, n, { heading = "Practice", tag = 0, choices = false, level = op.math, ctx = op.ctx } = {}) {
  const probs = genProblems(skill, op, n, { level, ctx, tag });
  const key = [];
  const blocks = [];
  const fr = op.writing === "none" || op.independence === "independent" || op.independence === "transfer" ? [] : framesFor(skill, op.band, 1);
  const hidden = new Set(op.hide.map(Number));
  let num = 0;
  probs.forEach((p, i) => {
    if (hidden.has(i + 1)) return;
    num += 1;
    if (op.independence === "model" && i === 0) {
      blocks.push(
        note("Worked example: read how each step is done."),
        { t: "problem", n: 0, ask: p.ask[textLevelOf(op.band)], stem: p.stem[textLevelOf(op.band)] || undefined, expr: p.expr || undefined, visual: p.visual || undefined, workspace: { kind: "none", size: 0 } },
        list(p.work, true),
        dir("Now you try. Do the same kind of thinking."),
      );
      key.push({ ref: "Worked example", answer: ansText(p), work: p.work });
      num -= 1;
      return;
    }
    const pb = problemBlocks(skill, op, p, num, { choices, frames: i === 0 ? fr : [], tag, idx: i + 1 });
    blocks.push(...pb.blocks);
    key.push(pb.key);
  });
  return { section: sec(heading, blocks), key, problems: probs };
}

function header(skill, op, extra = []) {
  return sec("Learning target", nameLine(), note(`I can: ${skill.studentObjective.replace(/^I can /, "")}`), ...extra);
}
const termsWithVisual = (skill) => (skill.vocab || []).filter((v) => v.visual);
function pictureReference(skill, op) {
  if (op.visuals !== "more") return null;
  const items = termsWithVisual(skill).map((v) => ({ front: v.term, back: v.def, visual: v.visual }));
  return items.length ? sec("Picture reference", cardsOf(items, 3)) : null;
}
function bankSection(skill, op) {
  const w = wordBank(skill, op.band);
  return w.length ? sec("Word bank", { t: "wordbank", words: w }) : null;
}
function explainSection(skill, op, prompt = "Explain your thinking") {
  const fr = op.writing === "none" ? [] : framesFor(skill, op.band, op.writing === "starter" ? 1 : 3);
  return sec(prompt, fr.length ? { t: "frames", level: op.band, items: fr } : null, lines("Write your explanation. Use a math word from the word bank or the page.", op.band === "5-6" ? 5 : 4));
}
function successCheck(skill) {
  return sec("Check yourself", check(skill.successCriteria.map((s) => `I can ${s.replace(/^I (can )?/, "")}`)));
}

// ---------------------------------------------------------------------------------------------------------------- builders
const B = {};

B.worksheet = (skill, op) => {
  const forced = op.variant === "guided" ? "guided" : op.variant === "independent" ? "independent" : null;
  const o = forced ? { ...op, independence: forced } : op;
  const pr = practice(skill, o, o.count);
  return {
    title: `${skill.title}: practice`,
    subtitle: forced === "guided" ? "Guided practice" : forced === "independent" ? "Independent practice" : "Practice worksheet",
    minutes: 15 + Math.round(o.count * 1.5),
    roles: forced === "guided" ? ["guided-practice", "worksheet"] : forced === "independent" ? ["independent-practice", "worksheet"] : ["worksheet", "independent-practice", "guided-practice", "interactive-activity"],
    sections: [header(skill, o), bankSection(skill, o), pictureReference(skill, o), pr.section, explainSection(skill, o), successCheck(skill)].filter(Boolean),
    key: pr.key,
    notes: [`Mathematics level ${o.math} of 3 (on grade). Language support: ${BANDS[o.band].short.toLowerCase()}. Independence: ${o.independence}.`],
  };
};

B.notebook = (skill, op) => {
  const first = genProblems(skill, op, 1, { tag: 1 })[0];
  const tryIt = practice(skill, { ...op, independence: "independent" }, 3, { heading: "Try it", tag: 2 });
  const terms = skill.vocab.slice(0, 3);
  return {
    title: `${skill.title}: notebook page`,
    subtitle: "Student notebook page",
    minutes: 20,
    roles: ["concept-explainer"],
    sections: [
      header(skill, op),
      sec("Notice and wonder", dir(skill.discourse.noticeWonder.prompt), lines("I notice...", 2), lines("I wonder...", 2)),
      sec("Words I need", table(["Word", "Draw it or show it", "My own sentence"], terms.map((t) => [t.term, "", ""]))),
      sec("Worked example", { t: "problem", n: 0, ask: first.ask[textLevelOf(op.band)], stem: first.stem[textLevelOf(op.band)] || undefined, expr: first.expr || undefined, visual: first.visual || undefined, workspace: { kind: "none", size: 0 } }, list(first.work, true)),
      tryIt.section,
      explainSection(skill, op, "Explain in your own words"),
    ],
    key: [{ ref: "Worked example", answer: ansText(first), work: first.work }, ...tryIt.key],
    notes: ["Students copy the worked example into their notebook, then try the three problems alone."],
  };
};

B["guided-notes"] = (skill, op) => {
  const first = genProblems(skill, op, 1, { tag: 1 })[0];
  const t0 = skill.vocab[0].term;
  const big = skill.bigIdea.includes(t0) ? skill.bigIdea.replace(t0, "__________") : `${skill.bigIdea}`;
  const tryIt = practice(skill, { ...op, independence: "guided" }, 2, { heading: "Try it", tag: 2 });
  return {
    title: `${skill.title}: guided notes`,
    subtitle: "Guided notes",
    minutes: 20,
    roles: ["concept-explainer"],
    sections: [
      header(skill, op),
      sec("The big idea", P(big), skill.bigIdea.includes(t0) ? note(`Fill in the blank with a word from this list: ${skill.vocab.map((v) => v.term).join(", ")}.`) : null),
      sec("Words to know", table(["Word", "What it means (fill in)"], skill.vocab.map((v) => [v.term, op.band === "1-2" ? v.def : "______________________________"]))),
      sec("Watch and write", { t: "problem", n: 0, ask: first.ask[textLevelOf(op.band)], stem: first.stem[textLevelOf(op.band)] || undefined, expr: first.expr || undefined, visual: first.visual || undefined, workspace: { kind: "none", size: 0 } }, list(first.work.map((_, i) => `Step ${i + 1}: ______________________________`), false)),
      tryIt.section,
    ],
    key: [{ ref: "Big idea blank", answer: t0, work: [skill.bigIdea] }, { ref: "Words to know", answer: skill.vocab.map((v) => `${v.term}: ${v.def}`).join(" | "), work: [] }, { ref: "Watch and write", answer: ansText(first), work: first.work }, ...tryIt.key],
    notes: ["The teacher models the worked example aloud while students write each step."],
  };
};

B["vocab-cards"] = (skill, op) => ({
  title: `${skill.title}: vocabulary cards`,
  subtitle: "Visual vocabulary cards",
  minutes: 15,
  roles: ["vocab-cards"],
  sections: [
    sec("Cut out and use", dir("Cut the cards. Read the word, look at the picture, then read the meaning. Use the cards to match, sort and say sentences.")),
    sec(
      "Cards",
      cardsOf(
        skill.vocab.map((v) => ({
          front: v.term,
          back: [`Meaning: ${v.def}`, `Example: ${v.example}`, `Not an example: ${v.nonExample}`, `Sentence: ${v.sentence}`, v.cognateEs ? `In Spanish: ${v.cognateEs}` : null, v.everyday ? `Everyday meaning: ${v.everyday}` : null].filter(Boolean).join("\n"),
          visual: v.visual || undefined,
        })),
        2,
      ),
    ),
    sec("My own card", cardsOf([{ front: "Word: ____________", back: "Draw it:\n\nMy sentence: ______________" }], 2)),
  ],
  key: skill.vocab.map((v) => ({ ref: v.term, answer: v.def, work: [] })),
  notes: ["Print on card stock, or show the cards on screen. The picture is part of the meaning: ask students to explain what the picture shows."],
});

B["task-cards"] = (skill, op) => {
  const tl = textLevelOf(op.band);
  const ext = op.variant === "extension";
  const n = ext ? 4 : 8;
  const level = ext ? 3 : op.math;
  const probs = genProblems(skill, op, n, { level, tag: 3 });
  return {
    title: `${skill.title}: ${ext ? "extension tasks" : "task cards"}`,
    subtitle: ext ? "Extension activity" : "Task cards",
    minutes: ext ? 25 : 20,
    roles: ext ? ["extension-activity"] : ["guided-practice"],
    sections: [
      sec("How to use these cards", dir("Take a card. Solve it. Write your answer and a sentence that explains it on the record sheet.")),
      sec("Cards", cardsOf(probs.map((p, i) => ({ front: `${i + 1}. ${p.stem[tl] ? `${p.stem[tl]} ` : ""}${p.ask[tl]}${p.expr ? `\n${p.expr}` : ""}`, visual: p.visual || undefined })), 2)),
      ext ? sec("Think deeper", P(skill.extension.task), lines("Explain your reasoning.", 4), P(skill.extension.reasoning), lines("My argument:", 5)) : null,
      sec("Record sheet", table(["Card", "My answer", "How I know"], probs.map((_, i) => [String(i + 1), "", ""]))),
    ].filter(Boolean),
    key: probs.map((p, i) => ({ ref: `Card ${i + 1}`, answer: ansText(p), work: p.work })),
    notes: ext ? [`Extension prompt: ${skill.extension.reasoning}`] : [],
  };
};

B["reading-passage"] = (skill, op) => {
  const r = skill.reading;
  const text = op.reading ? r.simple : r.text;
  const tl = textLevelOf(op.band);
  void tl;
  return {
    title: `${skill.title}: ${r.title}`,
    subtitle: "Mathematical reading passage",
    minutes: 20,
    roles: ["reading-passage"],
    sections: [
      header(skill, op),
      bankSection(skill, op),
      sec("Read", dir("Read the passage. Then read it again and underline each number. Circle what each number measures."), P(text, "quote")),
      sec("Think about it", { t: "list", items: r.questions.map((q) => q.q), ordered: true }, lines("Write your answers.", 6)),
      explainSection(skill, op, "Say it in your own words"),
    ].filter(Boolean),
    key: r.questions.map((q, i) => ({ ref: `Question ${i + 1} (${q.kind})`, answer: q.a, work: [] })),
    notes: [op.reading ? "This is the simplified version. It has the same mathematics and the same numbers as the standard version." : "The simplified version of this passage has the same numbers; choose it with the reading-support control.", "Read aloud once for everyone, then let students read in pairs. Device read-aloud (speech synthesis) is available in the interactive version; there is no recorded human narration."],
  };
};

B["discussion-cards"] = (skill, op) => {
  const d = skill.discourse;
  const stems = framesFor({ ...skill, keyLanguageUses: ["Explain", "Argue"] }, op.band, 3);
  const items = [
    { front: "Notice and wonder", back: d.noticeWonder.prompt },
    { front: "Which one doesn't belong?", back: `${d.wdntb.items.join("   |   ")}\nPick one. Say why it does not belong.` },
    { front: "Always, sometimes or never?", back: `${d.asn[0].claim}\nSort it, then defend it.` },
    { front: "Always, sometimes or never?", back: `${d.asn[1].claim}\nSort it, then defend it.` },
    { front: "Would you rather?", back: `${d.wyr.q}\nA: ${d.wyr.a}\nB: ${d.wyr.b}\nExplain your choice.` },
    { front: "Compare two strategies", back: `A: ${d.compare.a}\nB: ${d.compare.b}\n${d.compare.prompt}` },
    { front: "Find and fix the mistake", back: `${skill.misconceptions.find((m) => m.errorCase)?.errorCase.story}\n${skill.misconceptions.find((m) => m.errorCase)?.errorCase.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\nWhere does it go wrong? Fix it.` },
    { front: "Defend your reasoning", back: `${d.debate.claim}\nOne side says: ${d.debate.forEvidence}\nAnother side says: ${d.debate.againstEvidence}\nWhat do you think? Use evidence.` },
    { front: "Restate your partner's explanation", back: "Listen to your partner. Then say what they said in your own words. Ask: Did I get it right?" },
  ];
  const key = [
    { ref: "Which one doesn't belong?", answer: `${d.wdntb.items[d.wdntb.odd]}: ${d.wdntb.why}`, work: [] },
    ...d.asn.map((a, i) => ({ ref: `Always, sometimes or never? ${i + 1}`, answer: `${a.verdict}: ${a.why}`, work: [] })),
  ];
  return {
    title: `${skill.title}: math talk cards`,
    subtitle: "Discussion cards",
    minutes: 15,
    roles: ["discussion-prompts"],
    sections: [sec("How to use these cards", dir("Take turns. One partner talks, one listens. Then switch."), stems.length ? { t: "frames", level: op.band, items: stems } : null), sec("Cards", cardsOf(items, 2))].filter(Boolean),
    key,
    notes: ["Keep the mathematical demand the same for every group: change the sentence frames, not the question. Several cards have more than one defensible answer."],
  };
};

B.organizer = (skill, op) => {
  const v = op.variant || "frayer";
  if (v === "anatomy") {
    const p = genProblems(skill, op, 1, { tag: 4, prefer: (x) => !!x.structure })[0];
    const tl = textLevelOf(op.band);
    const s = p.structure;
    const parts = [
      ["What is happening?", s?.happening],
      ["What do I know?", s ? s.known.map((k) => `${k.label}: ${k.value}`).join("; ") : "List every quantity and what it measures."],
      ["What do I need to find out?", s?.unknown],
      ["How are the quantities related?", s?.relationship],
      ["What model or equation fits?", s?.model],
      ["What would a reasonable answer look like?", s?.reasonable],
    ];
    return {
      title: `${skill.title}: word problem anatomy`,
      subtitle: "Graphic organizer",
      minutes: 15,
      roles: ["wp-model"],
      sections: [header(skill, op), sec("The problem", { t: "problem", n: 1, ask: p.ask[tl], stem: p.stem[tl] || undefined, expr: p.expr || undefined, visual: p.visual || undefined, workspace: { kind: "none", size: 0 }, answer: p.answer.value, explain: p.work.join(" "), hint: p.hints.conceptual }), sec_table("Take the problem apart", ["Question to ask", "What I find"], parts.map(([q]) => [q, ""])), sec("Solve and explain", { t: "problem", n: 2, ask: "Solve the problem.", workspace: workspaceFor(skill.grade, 3) }, explainSection(skill, op).blocks)],
      key: [{ ref: "Anatomy", answer: parts.map(([q, a]) => `${q} ${a || "(student answers vary)"}`).join(" | "), work: p.work }],
      notes: ["No cue words: students decide the structure from what is happening, never from a single word."],
    };
  }
  if (v === "compare") {
    const c = skill.discourse.compare;
    return { title: `${skill.title}: compare strategies`, subtitle: "Graphic organizer", minutes: 15, roles: ["collaborative-activity"], sections: [header(skill, op), sec("Two strategies", table(["Strategy A", "Strategy B"], [[c.a, c.b], ["Steps:", "Steps:"], ["", ""]])), sec("Decide", P(c.prompt), lines("My answer:", 4))], key: [{ ref: "Compare", answer: c.prompt, work: [] }], notes: ["One of the strategies may be flawed. Ask students to use the mathematics, not a preference, to decide."] };
  }
  if (v === "prereqs") {
    const pre = (skill.prereq || []).map((id) => getSkill(id)).filter(Boolean);
    return { title: `${skill.title}: skills to check first`, subtitle: "Prerequisite skills", minutes: 10, roles: ["prerequisites"], sections: [sec("Before this skill", dir("Check each skill. If a skill is not sure yet, practice it first."), check(pre.map((s) => `Grade ${s.grade}: ${s.title}`)))], key: pre.map((s) => ({ ref: `Grade ${s.grade}`, answer: s.title, work: [] })), notes: ["Prerequisite literacy demands can be reviewed without repeating the earlier grade's whole unit."] };
  }
  const t = skill.vocab[0];
  return { title: `${skill.title}: Frayer model`, subtitle: "Graphic organizer", minutes: 10, roles: ["vocab-practice"], sections: [header(skill, op), sec(`Word: ${t.term}`, table(["Meaning", "Important facts"], [["", ""]]), table(["Examples", "Not examples"], [["", ""]]), P("My picture or sentence:"), lines("", 2))], key: [{ ref: t.term, answer: t.def, work: [`Example: ${t.example}`, `Not an example: ${t.nonExample}`] }], notes: [] };
};
function sec_table(heading, headers, rows) {
  return sec(heading, table(headers, rows));
}

B["exit-ticket"] = (skill, op) => {
  const mc = genProblems(skill, op, 1, { tag: 5 })[0];
  const open = genProblems(skill, op, 1, { tag: 6, level: op.math })[0];
  const a = problemBlocks(skill, { ...op, independence: "independent" }, mc, 1, { choices: true, tag: 5, idx: 1 });
  const b = problemBlocks(skill, { ...op, independence: "independent" }, open, 2, { tag: 6, idx: 1 });
  return {
    title: `${skill.title}: exit ticket`,
    subtitle: "Exit ticket",
    minutes: 5,
    roles: ["exit-ticket"],
    sections: [header(skill, op), sec("Question 1", a.blocks), sec("Question 2", b.blocks), explainSection(skill, op, "Question 3: explain"), sec("How sure am I?", check(["I can do this alone.", "I can do this with a hint.", "I need to practice this more."]))],
    key: [a.key, b.key, { ref: "Question 3", answer: "Look for a complete sentence that names the relationship or strategy and gives a reason.", work: [`Model: ${skill.sentence.because}`] }],
    notes: ["Sort the tickets by what the student could do alone, not by a score. Question 3 shows reasoning; judge the mathematics first and the language second."],
  };
};

B["mini-assessment"] = (skill, op) => {
  const probs = genProblems(skill, { ...op, independence: "independent" }, 3, { tag: 7 });
  const tl = textLevelOf(op.band);
  const items = probs.map((p, i) => problemBlocks(skill, { ...op, independence: "independent" }, p, i + 1, { choices: i === 0, tag: 7, idx: i + 1 }));
  const r = skill.reading;
  const claim = skill.discourse.asn[0];
  const t = skill.vocab[0];
  const cloze = t.sentence.replace(new RegExp(t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "__________");
  const rubric = table(
    ["What we look at", "What it shows", "If not yet, try next"],
    [
      ["Accuracy and procedure (Questions 1-3)", "Can the student carry out the mathematics?", "Targeted practice on the same skill, with feedback"],
      ["Conceptual understanding (Question 2)", "Does the student know why it works?", "Use a model or diagram; compare two representations"],
      ["Mathematical reading (Question 4)", "Can the student find and use the quantities?", "Word Problem Anatomy; reread with the simplified passage"],
      ["Vocabulary application (Question 5)", "Does the student use the term precisely?", "Vocabulary cards; match term, picture and example"],
      ["Representation (Question 6)", "Can the student show the idea in a picture or model?", "Representation Translator"],
      ["Explanation and reasoning (Questions 7-8)", "Can the student justify with evidence?", "Sentence Studio (because, but, so); partner talk"],
    ],
  );
  const key = [
    ...items.map((x) => x.key),
    { ref: "Question 4", answer: `${r.questions[0].a} / ${r.questions[1].a}`, work: [] },
    { ref: "Question 5", answer: t.term, work: [] },
    { ref: "Question 6", answer: "Accept any accurate model that shows the quantities and their relationship.", work: [] },
    { ref: "Question 7", answer: "A claim, a reason that uses the mathematics, and at least one number or term from the problem.", work: [skill.sentence.because] },
    { ref: "Question 8", answer: `${claim.verdict}: ${claim.why}`, work: [] },
  ];
  return {
    title: `${skill.title}: mini-assessment`,
    subtitle: "Formative assessment",
    minutes: 25,
    roles: ["formative-assessment"],
    sections: [
      header(skill, op),
      sec("Questions 1 to 3: do the mathematics", items.flatMap((x) => x.blocks)),
      sec("Question 4: read", P(r.simple, "quote"), { t: "list", items: [r.questions[0].q, r.questions[1].q], ordered: false }, lines("Write your answers.", 3)),
      sec("Question 5: use a word", P(cloze), { t: "wordbank", words: skill.vocab.map((v) => v.term) }),
      sec("Question 6: show it", dir("Draw a picture, table or model for the first problem."), { t: "problem", n: 6, ask: `Show: ${probs[0].stem[tl] ? `${probs[0].stem[tl]} ` : ""}${probs[0].ask[tl]}`, workspace: { kind: "box", size: 4 } }),
      explainSection(skill, op, "Question 7: explain"),
      sec("Question 8: always, sometimes or never", P(claim.claim), list(["Always", "Sometimes", "Never"]), lines("Tell why.", 3)),
      sec("What the teacher looks at", rubric, note("Mathematics and language are looked at separately: do not lower a mathematics judgment because of English grammar.")),
    ],
    key,
    notes: ["Feedback loop: say what the student showed, what to improve, one next step, then give a new problem of the same type after a revision.", "These dimensions are not a score and not a standardized or WIDA measure."],
  };
};

B["intervention-packet"] = (skill, op) => {
  const pre = (skill.prereq || []).map((id) => getSkill(id)).filter(Boolean)[0];
  const model = practice(skill, { ...op, independence: "model", math: 1 }, 3, { heading: "Part 3: learn it step by step", tag: 8, level: 1 });
  const follow = practice(skill, { ...op, independence: "partial" }, 3, { heading: "Part 4: try it with less help", tag: 9 });
  const preProbs = pre ? practice(pre, normalizeOpts({ ...op, independence: "guided", math: 1 }, pre), 3, { heading: `Part 2: a skill to check first (Grade ${pre.grade}: ${pre.title})`, tag: 10, level: 1 }) : null;
  const d = skill.diagnostic;
  return {
    title: `${skill.title}: intervention packet`,
    subtitle: "Intervention packet",
    minutes: 20,
    roles: ["intervention-activity"],
    sections: [header(skill, op), sec("Part 1: show what you know", dir(d.prompt), { t: "problem", n: 0, ask: "Show your thinking here.", workspace: { kind: "box", size: 5 } }), preProbs?.section, model.section, follow.section, explainSection(skill, op, "Part 5: explain what you learned")].filter(Boolean),
    key: [...(preProbs?.key || []), ...model.key, ...follow.key],
    notes: [`Part 1 look-fors: ${d.lookFor.join("; ")}.`, `Telling language from mathematics: ${d.language}`, "This packet is a teaching tool. It does not diagnose a student; it shows what to teach next."],
  };
};

B["family-practice"] = (skill, op) => {
  const f = skill.family;
  const o = { ...op, math: 1, independence: "guided", band: "3-4" };
  const pr = practice(skill, o, 4, { heading: "Practice together", tag: 11, level: 1 });
  return {
    title: `${skill.title}: family practice`,
    subtitle: "Family practice",
    minutes: 15,
    roles: ["family-practice"],
    sections: [
      sec("What your child is learning", P(f.en.learning)),
      sec("Say this together", P(f.en.say, "quote")),
      sec("Ask this at home", P(f.en.ask)),
      sec("Try this activity", P(f.en.activity)),
      sec("Words to know", table(["Word", "Meaning"], skill.vocab.slice(0, 4).map((v) => [v.term, v.def]))),
      pr.section,
      sec("En español: lo que su hijo o hija está aprendiendo", P(f.es.learning), note(SPANISH_NOTE)),
      sec("Digan esto juntos", P(f.es.say, "quote")),
      sec("Pregunten en casa", P(f.es.ask)),
      sec("Prueben esta actividad", P(f.es.activity)),
    ],
    key: pr.key,
    notes: [SPANISH_NOTE, "The practice problems are written in English; the explanation and the conversation starters are in English and Spanish."],
  };
};

B.poster = (skill, op) => {
  if (op.variant === "targets") {
    return { title: `${skill.title}: our targets`, subtitle: "Classroom poster", minutes: 5, roles: ["student-objective", "language-objective", "success-criteria"], sections: [sec("We are learning", P(skill.studentObjective)), sec("We will say and write", P(skill.languageObjective)), sec("We know we have it when", list(skill.successCriteria))], key: [], notes: ["Post with the words large enough to read from the back of the room."] };
  }
  return { title: `${skill.title}: word wall`, subtitle: "Classroom poster", minutes: 5, roles: ["vocab-cards"], sections: [sec("Math words", cardsOf(skill.vocab.map((v) => ({ front: v.term, back: v.def, visual: v.visual || undefined })), 2))], key: [], notes: ["Print one page per term for a wall display."] };
};

B["game-sheet"] = (skill, op) => {
  const tl = textLevelOf(op.band);
  const probs = genProblems(skill, op, 6, { tag: 12 });
  const qs = probs.map((p, i) => ({ front: `Question ${i + 1}\n${p.stem[tl] ? `${p.stem[tl]} ` : ""}${p.ask[tl]}${p.expr ? `\n${p.expr}` : ""}`, visual: p.visual || undefined }));
  const rng = makeRng(`${skill.id}:${op.seed}:game`);
  const as = rng.shuffle(probs.map((p, i) => ({ i, text: ansText(p) })));
  return {
    title: `${skill.title}: match and explain`,
    subtitle: "Mathematical game",
    minutes: 20,
    roles: ["game-practice"],
    sections: [
      sec("How to play", list(["Cut the cards. Put the question cards in one pile and the answer cards face up.", "Take a question card. Solve it. Find the answer card you think matches.", "Tell your partner why. Your partner agrees or asks a question.", "If you both agree, keep the pair. If not, solve it together.", "The winner is the pair that explains the most pairs well, not the fastest pair."]), note("No timer. Reasons count more than speed.")),
      sec("Question cards", cardsOf(qs, 2)),
      sec("Answer cards", cardsOf(as.map((a) => ({ front: a.text })), 3)),
      sec("Explain a pair", { t: "frames", level: op.band, items: framesFor(skill, op.band, 2) }, lines("We matched ___ with ___ because...", 3)),
    ],
    key: probs.map((p, i) => ({ ref: `Question ${i + 1}`, answer: ansText(p), work: p.work })),
    notes: ["Rewarding explanation keeps speed from deciding the game."],
  };
};

B["collab-activity"] = (skill, op) => {
  const pr = practice(skill, { ...op, independence: "partial" }, 3, { heading: "Group task", tag: 13 });
  return {
    title: `${skill.title}: group investigation`,
    subtitle: "Collaborative activity",
    minutes: 25,
    roles: ["collaborative-activity"],
    sections: [
      sec("Roles", table(["Role", "Job"], [["Reader", "Reads the problem aloud and asks what is known"], ["Recorder", "Writes what the group decides"], ["Speaker", "Explains the group's answer to the class"], ["Checker", "Asks: Does it make sense? Is there another way?"]])),
      pr.section,
      sec("Agree or disagree", P(skill.discourse.asn[0].claim), { t: "frames", level: op.band, items: framesFor({ ...skill, keyLanguageUses: ["Argue"] }, op.band, 3) }, lines("Our group's decision and reason:", 4)),
      sec("Group summary", lines("We learned that...", 3)),
    ],
    key: [...pr.key, { ref: "Agree or disagree", answer: `${skill.discourse.asn[0].verdict}: ${skill.discourse.asn[0].why}`, work: [] }],
    notes: ["Rotate roles each time. Every student must be able to explain the group's answer."],
  };
};

B["speaking-task"] = (skill, op) => {
  const p = genProblems(skill, op, 1, { tag: 14 })[0];
  const tl = textLevelOf(op.band);
  const stem = framesFor({ ...skill, keyLanguageUses: ["Explain"] }, op.band, 3);
  const c = skill.discourse.compare;
  return {
    title: `${skill.title}: speaking task`,
    subtitle: "Structured speaking activity",
    minutes: 15,
    roles: ["speaking-activity"],
    sections: [
      header(skill, op),
      sec("Rehearse", dir(op.band === "1-2" ? "Say it softly to yourself first. Point to the picture. Then say it to your partner." : "Tell the sentence in your head, then say it to your partner.")),
      sec("Partner A explains", { t: "problem", n: 1, ask: p.ask[tl], stem: p.stem[tl] || undefined, expr: p.expr || undefined, visual: p.visual || undefined, workspace: { kind: "none", size: 0 }, answer: p.answer.value, explain: p.work.join(" "), hint: p.hints.conceptual }, { t: "frames", level: op.band, items: stem }),
      sec("Partner B restates", P("Say what your partner said in your own words. Then ask one question."), { t: "frames", level: op.band, items: ["I heard you say ___.", "Did you mean ___?", "Why did you ___?"] }),
      sec("Compare two ways", P(`A: ${c.a}`), P(`B: ${c.b}`), P(c.prompt)),
      sec("Self-check", check(["I used a math word.", "I said the quantities with their names.", "I gave a reason."])),
    ],
    key: [{ ref: "Partner A", answer: ansText(p), work: p.work }],
    notes: ["Listen for the mathematics first. Do not correct pronunciation or grammar while a student explains; note vocabulary to teach later."],
  };
};

B["listening-task"] = (skill, op) => {
  const l = skill.listening;
  const items = l.tasks.map((t, i) => ({ t: "problem", n: i + 1, ask: t.q, choices: t.options, correct: t.answer, workspace: { kind: "none", size: 0 }, answer: t.options[t.answer], explain: t.why }));
  return {
    title: `${skill.title}: listening task`,
    subtitle: "Listening comprehension activity",
    minutes: 15,
    roles: ["listening-activity"],
    sections: [
      header(skill, op),
      sec("Listen", dir("Listen. The teacher reads the script aloud, or the device reads it aloud. Listen for each quantity and what it measures. You may listen again."), note("Audio is the device's built-in speech voice, not a recording of a person.")),
      sec("Answer", items),
      sec("Say it back", lines("Tell what you heard in your own words.", 3)),
      sec("Transcript (accessible alternative)", P(l.script, "quote")),
    ],
    key: l.tasks.map((t, i) => ({ ref: `Question ${i + 1} (${t.type})`, answer: t.options[t.answer], work: [t.why] })),
    notes: ["Read the script at a natural pace once for everyone. The transcript is always available to students who need to read it; cut the transcript section if you want a listening-only version."],
  };
};

B["writing-task"] = (skill, op) => {
  const steps = sentenceSteps(skill, op.band);
  const older = skill.grade >= 6;
  return {
    title: `${skill.title}: writing task`,
    subtitle: "Mathematical writing activity",
    minutes: 20,
    roles: ["writing-activity"],
    sections: [
      header(skill, op),
      bankSection(skill, op),
      sec("Start with a true sentence", P(skill.sentence.base, "quote")),
      ...steps.map((s) => sec(`Write a "${s.kind}" sentence`, dir(s.prompt), s.frame ? { t: "frames", level: op.band, items: [s.frame] } : null, lines("", 2))),
      older ? sec("Build a paragraph", table(["Part", "What to write"], [["Claim", ""], ["Evidence from the mathematics", ""], ["Reasoning: why the evidence proves the claim", ""]]), lines("Now write your paragraph.", 6)) : null,
      sec("Revise", check(["I used a math word from the list.", "My reason uses numbers or a model.", "I read it aloud and it makes sense."])),
    ].filter(Boolean),
    key: [{ ref: "Because", answer: steps[0].model, work: [] }, { ref: "But", answer: steps[1].model, work: [] }, { ref: "So", answer: steps[2].model, work: [] }],
    notes: ["Check the mathematics in the sentence first; then the use of the connective and the term. Do not mark English grammar as mathematical error. Sentence expansion follows the because, but, so routine; it is not endorsed by or affiliated with any program."],
  };
};

B["error-analysis"] = (skill, op) => {
  const cases = skill.misconceptions.filter((m) => m.errorCase).slice(0, op.variant === "single" ? 1 : 2);
  const extra = genProblems(skill, { ...op, independence: "independent" }, 1, { tag: 15 })[0];
  const tl = textLevelOf(op.band);
  const blocks = cases.flatMap((m, i) => [
    sec(`Case ${i + 1}: ${m.errorCase.story}`, list(m.errorCase.steps.map((s, k) => `Step ${k + 1}: ${s}`)), dir("Circle the first step that is not correct."), lines("First incorrect step: ____", 1), dir("Explain the mistake."), { t: "frames", level: op.band, items: ["The mistake is ___ because ___.", "The first step that goes wrong is Step ___."] }, lines("", 3), dir("Fix it. Write a correct solution."), lines("", 3)),
  ]);
  return {
    title: `${skill.title}: error detective`,
    subtitle: "Error-analysis task",
    minutes: 20,
    roles: ["error-analysis"],
    sections: [header(skill, op), ...blocks, sec("Try the corrected thinking on a new problem", { t: "problem", n: 1, ask: extra.ask[tl], stem: extra.stem[tl] || undefined, expr: extra.expr || undefined, visual: extra.visual || undefined, workspace: workspaceFor(skill.grade, 3), answer: extra.answer.value, explain: extra.work.join(" "), hint: extra.hints.conceptual })],
    key: [...cases.map((m, i) => ({ ref: `Case ${i + 1}`, answer: `First incorrect step: Step ${m.errorCase.firstWrong + 1}`, work: [m.errorCase.explain] })), { ref: "New problem", answer: ansText(extra), work: extra.work }],
    notes: ["The solutions belong to fictional students. Kinds of mistake to tell apart: " + cases.map((m) => `${m.belief} (${m.root})`).join("; ") + ".", "Conceptual and procedural errors need different teaching moves; reading and language errors need access, not more of the same practice."],
  };
};

B["word-problems"] = (skill, op) => {
  const pr = practice(skill, op, Math.min(op.count, 6), { heading: "Solve", tag: 16 });
  return {
    title: `${skill.title}: word problems`,
    subtitle: "Word-problem practice",
    minutes: 25,
    roles: ["wp-practice"],
    sections: [header(skill, op), bankSection(skill, op), sec("Read it, picture it, plan it", list(["Read the problem twice. What is happening?", "Underline the numbers. What does each one measure?", "Draw a picture or a model.", "Write what you need to find.", "Solve. Then check: does your answer make sense?"], true)), pr.section, explainSection(skill, op)].filter(Boolean),
    key: pr.key,
    notes: ["Students decide the operation from the structure of the situation, not from a cue word. The same wording can call for different operations in different problems."],
  };
};

B["vocab-practice"] = (skill, op) => {
  const rng = makeRng(`${skill.id}:${op.seed}:vp`);
  const defs = rng.shuffle(skill.vocab.map((v, i) => ({ i, def: v.def })));
  const letters = "ABCDEFGH";
  const mm = skill.vocab.filter((v) => v.everyday || v.kind === "multiple-meaning" || v.kind === "academic" || v.kind === "comparison");
  const cloze = skill.vocab.filter((v) => v.kind !== "symbol").map((v) => v.sentence.replace(new RegExp(v.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "__________"));
  const onlyMM = op.variant === "multiple-meaning";
  const mmSection = sec(
    "Everyday meaning and math meaning",
    dir("Some words have an everyday meaning and a math meaning. Read both. Then use the word in a math sentence."),
    table(["Word", "Everyday meaning", "Math meaning", "My math sentence"], (mm.length ? mm : skill.vocab.slice(0, 2)).map((v) => [v.term, v.everyday || `In everyday language: not the same as ${v.term} in math.`, v.def, ""])),
  );
  return {
    title: `${skill.title}: vocabulary practice`,
    subtitle: onlyMM ? "Multiple-meaning word activity" : "Vocabulary practice",
    minutes: 20,
    roles: onlyMM ? ["multiple-meaning"] : ["vocab-practice", "multiple-meaning"],
    sections: onlyMM
      ? [header(skill, op), mmSection]
      : [
          header(skill, op),
          sec("Match the word and the meaning", table(["Word", "Meaning (write the letter)"], skill.vocab.map((v) => [v.term, ""])), list(defs.map((d, k) => `${letters[k]}. ${d.def}`))),
          sec("Use the word", { t: "wordbank", words: skill.vocab.map((v) => v.term) }, list(cloze, true)),
          mmSection,
          sec("Word parts and Spanish connections", table(["Word", "Word parts", "In Spanish"], skill.vocab.map((v) => [v.term, v.morphology || "", v.cognateEs || ""]))),
          sec("My own example", lines("Choose one word. Write your own example and a sentence.", 3)),
        ],
    key: [
      ...skill.vocab.map((v) => ({ ref: v.term, answer: letters[defs.findIndex((d) => d.i === skill.vocab.indexOf(v))], work: [v.def] })),
      ...skill.vocab.filter((v) => v.kind !== "symbol").map((v, i) => ({ ref: `Use the word ${i + 1}`, answer: v.term, work: [v.sentence] })),
    ],
    notes: ["Compare the everyday and the mathematical meaning out loud before writing."],
  };
};

B["lesson-guide"] = (skill, op) => {
  const pre = (skill.prereq || []).map((id) => getSkill(id)).filter(Boolean);
  const std = skill.standards;
  const seq = sequenceSteps(skill, "lesson");
  return {
    title: `${skill.title}: teacher guide`,
    subtitle: `Grade ${skill.grade} teacher instructional guide`,
    minutes: 50,
    roles: ["teacher-guide", "prerequisites"],
    sections: [
      sec("Overview", table(["Item", "Detail"], [["Objective", skill.objective], ["Student-friendly target", skill.studentObjective], ["Language objective", skill.languageObjective], ["Big idea", skill.bigIdea], ["Standards (informational)", `${std.codes.join(", ")} (${std.framework}, ${std.version})`]]), note(std.note)),
      sec("Success criteria", list(skill.successCriteria)),
      sec("Skills to check first", pre.length ? list(pre.map((s) => `Grade ${s.grade}: ${s.title}`)) : P("No prerequisite skills are listed in this program; this skill builds on prior everyday experience.")),
      sec("Vocabulary to teach", table(["Term", "Meaning", "Watch for", "Spanish cognate"], skill.vocab.map((v) => [v.term, v.def, v.everyday ? `Everyday: ${v.everyday}` : v.nonExample, v.cognateEs || ""]))),
      sec("Language demands", table(["Area", "What students need"], [["Vocabulary", skill.languageDemands.vocabulary.join("; ")], ["Sentences", skill.languageDemands.syntax.join("; ")], ["Discourse", skill.languageDemands.discourse.join("; ")], ["Listening", skill.domains.listening], ["Speaking", skill.domains.speaking], ["Reading", skill.domains.reading], ["Writing", skill.domains.writing]])),
      sec("Common misconceptions and what to do", table(["What a student may think", "Type", "Why", "Teaching move"], skill.misconceptions.map((m) => [m.belief, m.root, m.why, m.fix]))),
      sec("Language support by band (the mathematics stays the same)", table(["Band", "What the page gives"], Object.values(BANDS).map((b) => [b.label.en, b.gives.join("; ")]))),
      sec("Scaffold fading", table(["Stage", "Teacher", "Student"], fadingPath(skill).map((f) => [f.step, f.teacher, f.student]))),
      sec("A full lesson", table(["Minutes", "Step", "What happens"], seq.map((s) => [String(s.minutes), s.title, s.what]))),
      sec("Check and respond", P(skill.diagnostic.prompt), list(skill.diagnostic.lookFor), note(skill.diagnostic.language)),
      sec("Extension", P(skill.extension.task), P(skill.extension.reasoning)),
      sec("Provenance", P("All text, problems and pictures in this program are original to the studio. Standards alignments are informational CCSS-M 2010 codes; the studio is not endorsed by CCSSO or NGA. WIDA-informed supports describe instructional ideas, not a measurement of any student. Spanish family text has not yet had a native-speaker review.")),
    ],
    key: [],
    notes: [],
  };
};

B["lesson-sequence"] = (skill, op) => {
  const id = op.variant || "lesson";
  const steps = sequenceSteps(skill, id);
  const total = steps.reduce((a, s) => a + s.minutes, 0);
  return {
    title: `${skill.title}: ${SEQ_LABEL[id] || id}`,
    subtitle: `${SEQ_LABEL[id] || id} (${total} minutes)`,
    minutes: total,
    roles: ["teacher-guide"],
    sections: [sec("Plan", table(["Minutes", "Step", "What happens", "Open this"], steps.map((s) => [String(s.minutes), s.title, s.what, s.open]))), sec("Language support", list(fadingPath(skill).map((f) => `${f.step}: ${f.teacher}`)))],
    key: [],
    notes: ["Take any step on its own; you do not need to follow the whole sequence."],
  };
};

// ---------------------------------------------------------------------------------------------------------------- sequences
const SEQ_LABEL = { warmup5: "five-minute warm-up", routine10: "ten-minute literacy routine", smallgroup15: "fifteen-minute small group", intervention20: "twenty-minute intervention", lesson: "full lesson", multiday: "multiday sequence", weekly: "weekly literacy collection" };
/** Timed steps for a sequence. `open` names the resource type to open for that step. */
export function sequenceSteps(skill, id) {
  const t0 = skill.vocab[0]?.term || "the key word";
  const S = (minutes, title, what, open) => ({ minutes, title, what, open });
  const lib = {
    warmup5: [S(3, "Notice and wonder", skill.discourse.noticeWonder.prompt, "Discussion cards"), S(2, "One problem, one sentence", "Solve one problem together and say it in a full sentence.", "Task cards")],
    routine10: [S(3, "Vocabulary", `Show the card for ${t0}. Say it, point to the picture, use it in a sentence.`, "Vocabulary cards"), S(4, "Read", "Read the short passage. Underline each number and what it measures.", "Reading passage"), S(3, "Say it or write it", "Write one because sentence about the passage.", "Writing task")],
    smallgroup15: [S(3, "Words", "Review the key terms with pictures.", "Vocabulary cards"), S(4, "Model", "Think aloud through a worked example.", "Worksheet (guided)"), S(5, "Guided practice", "Students try with the first step shown.", "Worksheet (guided)"), S(3, "Explain", "Each student explains one answer with a frame.", "Speaking task")],
    intervention20: [S(4, "Show what you know", skill.diagnostic.prompt, "Intervention packet"), S(6, "Prerequisite check", "Review the skill this one builds on.", "Intervention packet"), S(6, "Learn it step by step", "Worked example, then with less help.", "Intervention packet"), S(4, "Check and revise", "Exit ticket, feedback, then a new problem.", "Exit ticket")],
    lesson: [S(4, "Activate prior knowledge", "Ask what students already know. Use the prerequisite check if needed.", "Skills to check first"), S(5, "Vocabulary", "Introduce or revisit the words with pictures and examples.", "Vocabulary cards"), S(4, "Notice and wonder", skill.discourse.noticeWonder.prompt, "Discussion cards"), S(6, "Model the concept", "Teacher think-aloud with a manipulative or picture.", "Guided notes"), S(5, "Read and interpret a situation", "Read the passage or problem; name what is happening, known and unknown.", "Reading passage"), S(4, "Build a representation", "Draw or build a model of the situation.", "Word problem anatomy"), S(6, "Practice with guidance", "Partner work with the first step shown.", "Worksheet (guided)"), S(5, "Discuss reasoning", "Compare two strategies; agree or disagree with evidence.", "Discussion cards"), S(5, "Apply independently", "Independent practice with scaffolds fading.", "Worksheet (independent)"), S(3, "Formative assessment", "Exit ticket or mini-assessment.", "Exit ticket"), S(2, "Targeted feedback", "Say what was shown, what to improve and one next step.", "Teacher guide"), S(3, "Revise and try a new problem", "Students revise one answer, then solve a new problem of the same type.", "Mini-assessment")],
    multiday: [S(50, "Day 1: words, noticing and modeling", "Vocabulary, notice and wonder, worked example.", "Guided notes"), S(50, "Day 2: reading and representing", "Reading passage, anatomy of a word problem, representations, guided practice.", "Reading passage"), S(50, "Day 3: reasoning and showing what you know", "Discussion, independent practice, mini-assessment, feedback and revision.", "Mini-assessment")],
    weekly: [S(20, "Monday: vocabulary", "Cards, matching and everyday versus math meaning.", "Vocabulary practice"), S(20, "Tuesday: reading", "Passage with annotation.", "Reading passage"), S(20, "Wednesday: talking", "Math talk cards and the speaking task.", "Discussion cards"), S(20, "Thursday: writing", "Because, but, so and an explanation.", "Writing task"), S(20, "Friday: show what you know", "Exit ticket or mini-assessment, then revise.", "Mini-assessment")],
  };
  return lib[id] || lib.lesson;
}

// ---------------------------------------------------------------------------------------------------------------- finish
export const RESOURCE_TYPES = Object.keys(B);

/** Build a Resource. Throws on an unknown type. */
export function buildResource(skill, type, opts = {}) {
  const build = B[type];
  if (!build) throw new Error(`unknown resource type: ${type}`);
  const op = normalizeOpts(opts, skill);
  const r = build(skill, op);
  const sections = r.sections.filter(Boolean);
  if (op.directions) sections.unshift(sec("Directions from your teacher", dir(op.directions)));
  return {
    id: `${skill.id}:${type}${op.variant ? `.${op.variant}` : ""}:${op.seed}`,
    skillId: skill.id,
    grade: skill.grade,
    type,
    title: op.title || r.title,
    subtitle: r.subtitle,
    meta: {
      minutes: r.minutes,
      support: op.support,
      mathLevel: op.math,
      langBand: op.band,
      independence: op.independence,
      roles: r.roles,
      standards: skill.standards.codes,
      standardsNote: `${skill.standards.framework}, ${skill.standards.version}. Informational alignment; not endorsed.`,
      objective: skill.studentObjective,
      seed: op.seed,
      family: skill.familyId,
      ctx: op.ctx,
    },
    sections,
    key: r.key || [],
    notes: r.notes || [],
  };
}

/** Everything that differs between two Resources, in teacher language (for the side-by-side compare). */
export function diffResources(a, b) {
  const out = [];
  const label = { support: "Support preset", mathLevel: "Mathematics level", langBand: "Language support", independence: "Independence", seed: "Problem set" };
  for (const k of Object.keys(label)) if (a.meta[k] !== b.meta[k]) out.push(`${label[k]}: ${a.meta[k]} to ${b.meta[k]}`);
  const flat = (r) => r.sections.flatMap((s) => s.blocks);
  const fa = flat(a);
  const fb = flat(b);
  const count = (bs, t) => bs.filter((x) => x.t === t).length;
  for (const t of ["problem", "frames", "wordbank", "visual", "lines", "check"]) if (count(fa, t) !== count(fb, t)) out.push(`${cap(t)} blocks: ${count(fa, t)} to ${count(fb, t)}`);
  const pa = fa.filter((x) => x.t === "problem");
  const pb = fb.filter((x) => x.t === "problem");
  pa.forEach((p, i) => {
    const q = pb[i];
    if (q && (p.ask !== q.ask || p.stem !== q.stem)) out.push(`Problem ${p.n || i + 1}: wording changed`);
  });
  return out;
}

/** Apply a teacher's edits to a built Resource without rebuilding it: edit directions, rename, change a problem's wording or answer key. */
export function applyEdits(resource, edits = {}) {
  const r = JSON.parse(JSON.stringify(resource));
  if (edits.title) r.title = edits.title;
  if (edits.problems) {
    for (const s of r.sections)
      for (const b of s.blocks)
        if (b.t === "problem" && edits.problems[`${b.tag}:${b.idx}`]) {
          const e = edits.problems[`${b.tag}:${b.idx}`];
          if (e.ask != null) b.ask = e.ask;
          if (e.stem != null) b.stem = e.stem;
          if (e.answer != null) {
            b.answer = e.answer;
            const k = r.key.find((x) => x.ref === `Problem ${b.n}`);
            if (k) k.answer = e.answer;
          }
        }
  }
  if (edits.directions) for (const s of r.sections) for (const b of s.blocks) if (b.t === "p" && b.style === "directions") b.text = edits.directions;
  return r;
}

/**
 * Several Resources as one packet (a ready-made collection, a weekly collection or a saved collection). Sections keep their order, a page
 * break separates the documents, and the answer keys are joined under each document's title.
 */
export function packetResource(resources, title, subtitle = "Resource packet") {
  const first = resources[0];
  const sections = [];
  const key = [];
  const notes = [];
  resources.forEach((r, i) => {
    if (i) sections.push({ heading: r.title, blocks: [{ t: "pagebreak" }, { t: "p", text: r.subtitle || "", style: "note" }] });
    else sections.push({ heading: r.title, blocks: [{ t: "p", text: r.subtitle || "", style: "note" }] });
    for (const s of r.sections) sections.push(s);
    for (const k of r.key) key.push({ ...k, ref: `${r.title}: ${k.ref}` });
    for (const n of r.notes) notes.push(`${r.title}: ${n}`);
  });
  return {
    id: `packet:${resources.map((r) => r.id).join("+")}`,
    skillId: first?.skillId || "",
    grade: first?.grade || 0,
    type: "packet",
    title,
    subtitle,
    meta: { ...(first?.meta || {}), minutes: resources.reduce((a, r) => a + (r.meta?.minutes || 0), 0), roles: [...new Set(resources.flatMap((r) => r.meta?.roles || []))] },
    sections,
    key,
    notes,
  };
}
