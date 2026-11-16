// Teacher Tour 2.0 lesson engine: the three support profiles for one activity, and the timed lesson built from it.
// Pure functions over the real activity record (content/g<band>/<Domain>.json), so every sentence of the lesson comes
// from that activity's own prompt, frames, word bank, success criteria, hint and teacher notes. Nothing is invented.
import { MINUTES, PROFILES, bandName, domainName, resourceRoute, studentUrl } from "./model.js";

/**
 * Per-skill wording. Speaking and Writing make language, so the lesson models an answer and then revises it.
 * Listening and Reading are answer-choice tasks: students choose, get guidance, and choose again, so the lesson
 * models what to listen or look for and never a finished answer.
 */
const KINDS = {
  listening: { doing: "listen, then choose an answer", watch: "watch", gear: " and check the speakers", cue: "listen for", again: "Listen again", source: "the audio" },
  speaking: { doing: "speak and record", watch: "listen to", gear: " and check the microphone and speakers", cue: "", again: "", source: "" },
  reading: { doing: "read, then choose an answer", watch: "watch", gear: "", cue: "look for", again: "Read again", source: "the text" },
  writing: { doing: "write", watch: "read", gear: "", cue: "", again: "", source: "" },
};

const lowerFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const stripEnd = (s) => String(s || "").replace(/[.\s]+$/, "");
/** Ends a sentence with one terminal mark (keeps a question mark or exclamation point). */
const end = (s) => {
  const t = String(s || "").trim();
  return t && !/[.!?]$/.test(t) ? `${t}.` : t;
};
const list = (a) => (Array.isArray(a) ? a.filter(Boolean) : []);
const nice = (a) =>
  a.length < 3 ? a.join(" and ") : `${a.slice(0, -1).join(", ")}, and ${a[a.length - 1]}`;
const firstSentence = (s) =>
  (String(s || "").match(/^.*?[.!?](?=\s|$)/)?.[0] || String(s || "")).trim();

// "Describing …" skills become "I can describe …". Anything that is not a plain verb phrase falls back to "practice".
const GERUND = { describing: "describe", using: "use", comparing: "compare", retelling: "retell", saying: "say", asking: "ask", reading: "read", giving: "give", stating: "state", explaining: "explain", recommending: "recommend", delivering: "deliver", arguing: "argue", summarizing: "summarize", acknowledging: "acknowledge", narrating: "narrate", presenting: "present", justifying: "justify", evaluating: "evaluate", writing: "write", sequencing: "sequence", developing: "develop" };

/** The student-facing "I can" target for an activity, with its own key words when it has them. */
export function defaultTarget(act) {
  let skill = stripEnd(act.skill || act.title);
  const first = skill.split(" ")[0];
  const verb = GERUND[first.toLowerCase()];
  if (verb) skill = verb + skill.slice(first.length);
  const plain = verb || !/(ing|ly|:)$/i.test(first);
  const terms = list(act.vocabulary).map((v) => v[0]).slice(0, 2);
  return `I can ${plain ? lowerFirst(skill) : `practice ${lowerFirst(skill)}`}${terms.length ? ` using the words ${nice(terms)}` : ""}.`;
}

/** True for an answer-choice record (Listening, Reading): it has things to listen or look for, not a model answer. */
export const isReceptive = (act) => act?.type === "multipleChoice";
/** What a Listening or Reading activity tells students to listen or look for. */
export const lookFor = (act) => list(act?.listenFor || act?.readFor);

/** The model answer a student at `level` hears: the activity's own model, or its support line. */
export function modelFor(act, level) {
  const m = act.models?.[level] || act.model || "";
  if (m) return typeof m === "string" ? m : "";
  return stripEnd(String(act.support || "").replace(/^Model:\s*/i, ""));
}

/* ── support profiles ── */

const termLine = (v) => `${v[0]}: ${v[1]}`;
const receptiveItems = (act, id) => {
  const frames = list(act.frames);
  const vocab = list(act.vocabulary);
  if (id === "starting")
    return [
      { id: "vocab", label: "Vocabulary with meanings", value: vocab.slice(0, 5).map(termLine) },
      { id: "frames", label: "Sentence frames", value: frames },
      { id: "model", label: "A guided question to try first", value: [act.support].filter(Boolean) },
    ];
  if (id === "growing")
    return [
      { id: "vocab", label: "Vocabulary words only", value: vocab.slice(0, 5).map((v) => v[0]) },
      { id: "frames", label: "One sentence starter", value: frames.slice(0, 1) },
      { id: "hint", label: "A hint when stuck", value: [act.hint].filter(Boolean) },
    ];
  return [
    { id: "criteria", label: "A look-for list to self-check", value: lookFor(act) },
    { id: "extension", label: "An extension to elaborate", value: [act.extension].filter(Boolean) },
  ];
};
const supportItems = (act, id) => {
  if (isReceptive(act)) return receptiveItems(act, id);
  const frames = list(act.frames);
  const bank = list(act.wordBank);
  const vocab = list(act.vocabulary);
  const crit = list(act.successCriteria);
  if (id === "starting")
    return [
      { id: "vocab", label: "Vocabulary with meanings", value: vocab.slice(0, 5).map(termLine) },
      { id: "frames", label: "Sentence frames", value: frames },
      { id: "bank", label: "Word bank", value: bank },
      {
        id: "model",
        label: "A model to hear or read first",
        value: [modelFor(act, "A")].filter(Boolean),
      },
    ];
  if (id === "growing")
    return [
      { id: "vocab", label: "Vocabulary words only", value: vocab.slice(0, 5).map((v) => v[0]) },
      { id: "frames", label: "One sentence starter", value: frames.slice(0, 1) },
      { id: "bank", label: "Word bank", value: bank },
      { id: "hint", label: "A hint when stuck", value: [act.hint].filter(Boolean) },
    ];
  return [
    { id: "criteria", label: "Success criteria to self-check", value: crit },
    { id: "extension", label: "An extension to elaborate", value: [act.extension].filter(Boolean) },
    {
      id: "model",
      label: "A model to compare with after trying",
      value: [modelFor(act, "C")].filter(Boolean),
    },
  ];
};

const BLURB = {
  starting: "Most help: meanings, sentence frames, a word bank and a model before students begin.",
  growing: "Some help: key words and a starter, with a hint ready when a student is stuck.",
  expanding: "Least help: students work from the success criteria, then compare with a model.",
};

const RECEPTIVE_EXPANDING = "Least help: students work from a look-for list, then check themselves.";

/** What the three profiles look like for one activity. The learning goal is the same in all three. */
export function profilesFor(act, target = defaultTarget(act)) {
  const t = act.teacher || {};
  const expect = { starting: t.lower, growing: t.onLevel, expanding: t.challenge };
  return PROFILES.map((p) => ({
    ...p,
    goal: target,
    blurb: isReceptive(act) && p.id === "expanding" ? RECEPTIVE_EXPANDING : BLURB[p.id],
    items: supportItems(act, p.id).filter((i) => i.value.length),
    expect: expect[p.id] || "",
  }));
}

/** Added / Changed / Removed / Unchanged between two profiles, by support id and content. */
export function diffProfiles(from, to) {
  if (!from)
    return {
      added: to.items.map((i) => i.label),
      changed: [],
      removed: [],
      unchanged: ["Learning goal"],
    };
  const was = new Map(from.items.map((i) => [i.id, i]));
  const now = new Map(to.items.map((i) => [i.id, i]));
  const out = { added: [], changed: [], removed: [], unchanged: ["Learning goal"] };
  for (const [id, i] of now) {
    if (!was.has(id)) out.added.push(i.label);
    else if (JSON.stringify(was.get(id).value) !== JSON.stringify(i.value))
      out.changed.push(i.label);
    else out.unchanged.push(i.label);
  }
  for (const [id, i] of was) if (!now.has(id)) out.removed.push(i.label);
  return out;
}

/* ── the timed lesson ── */

/** Minutes for each block. Every row sums to its lesson length (tools/access-tour2.test.mjs checks all four). */
export const TIMING = {
  5: { launch: 1, model: 0, practice: 2, feedback: 1, close: 1 },
  10: { launch: 1, model: 2, practice: 4, feedback: 2, close: 1 },
  15: { launch: 2, model: 2, practice: 6, feedback: 3, close: 2 },
  20: { launch: 2, model: 3, practice: 8, feedback: 5, close: 2 },
};

const profileById = (profiles, id) => profiles.find((p) => p.id === id);

function supportSummary(profiles, approach) {
  const one = (p) => `${p.name}: ${[...p.items.map((i) => i.label.toLowerCase())].join(", ")}.`;
  if (approach === "mixed")
    return {
      lead: "Students open the supports they need; start each student on the profile that fits today.",
      lines: profiles.map(one),
    };
  const p = profileById(profiles, approach) || profiles[0];
  return {
    lead: `${p.name} supports for the whole class.`,
    lines: [one(p), ...(p.expect ? [`Expect: ${end(p.expect)}`] : [])],
  };
}

function startLevel(approach) {
  return PROFILES.find((p) => p.id === approach)?.level || "B";
}

/**
 * The lesson for one resource. `res` is the registry row, `act` the full activity record.
 * `edits` carries only what the teacher typed (target, launch); everything else is regenerated, so changing the
 * length, the supports or the activity always updates the lesson.
 */
export function buildLesson({ res, act, minutes, approach, edits = {} }) {
  const mins = MINUTES.includes(Number(minutes)) ? Number(minutes) : 10;
  const T = TIMING[mins];
  const K = KINDS[res.domain];
  const receptive = isReceptive(act);
  const speaking = res.domain === "speaking";
  const verb = speaking ? "say" : "write";
  const target = edits.target?.trim() || defaultTarget(act);
  const url = studentUrl(res);
  const profiles = profilesFor(act, target);
  const level = startLevel(approach);
  const model = receptive ? "" : modelFor(act, level);
  const frames = list(act.frames);
  const bank = list(act.wordBank);
  const look = lookFor(act).map((x) => String(x).replace(/[.!?\s]+$/, ""));
  const look0 = look[0] || "the key words in the prompt";
  // Speaking and Writing are judged against the activity's success criteria; Listening and Reading against what
  // students could point to or name from the audio or text.
  const crit = receptive
    ? [
        "Chooses an answer and can say which clue led to it",
        ...(look.length ? look.slice(0, 3).map((x) => `Can point to or name ${x}`) : ["Uses the hint or word help to try again"]),
      ]
    : list(act.successCriteria);
  const vocab = list(act.vocabulary);
  const expected = list(act.sayFor || act.writeFor);
  const prompt = end(act.prompt);
  const directions = end(act.directions);
  const hint = end(act.hint);
  const praise = end(String(act.correct || "").split(/(?<=[.!?])\s+/).slice(0, 2).join(" "));
  const unmet = receptive ? `Look again for ${look0}` : crit[1] || crit[0] || "";
  const sup = supportSummary(profiles, approach);
  const where = `${res.title} (${bandName(res.band)}, ${domainName(res.domain)}, ${res.support})`;
  const teacherLine = edits.launch?.trim();
  const retry = receptive
    ? `${K.again} for ${look0} and choose once more. Press the check button again.`
    : speaking
      ? `Say it again with one change: ${lowerFirst(stripEnd(unmet))}.`
      : `Revise one sentence: ${lowerFirst(stripEnd(unmet))}.`;

  const launch = [
    teacherLine || `Write the target on the board and read it with students: “${target}”`,
    `Show the task and read the prompt aloud: “${prompt}”`,
    ...(T.model
      ? []
      : receptive
        ? [`Tell students what to ${K.cue}: “${look0}”`]
        : [`Model one sentence aloud: “${firstSentence(model || frames[0] || "")}”`]),
  ];
  const modelSteps = !T.model
    ? []
    : receptive
      ? [
          `Think aloud without giving the answer: “I will ${K.cue} ${look0}.”`,
          ...(frames[0] ? [`Read a frame together: “${frames[0]}”`] : []),
          ...(T.model >= 3
            ? [`Students tell a partner what they will ${K.cue} before they choose.`]
            : []),
        ]
      : [
          `Say or show this model: “${model || frames.join(" ")}”`,
          `Think aloud: “I will use ${frames[0] ? `‘${frames[0]}’` : "the prompt"} so I can ${lowerFirst(stripEnd(unmet || "answer the task"))}.”`,
          ...(T.model >= 3
            ? [`Students echo the model with a partner, then ${verb} their own first sentence.`]
            : []),
        ];
  const activityMin = parseInt(act.time, 10) || res.minutes;
  const practice = [
    `Students open ${res.title} (link on the Student Activity Card) and follow the directions on screen: “${directions}”`,
    activityMin > T.practice
      ? `The activity takes about ${activityMin} minutes. At ${T.practice} minutes, call time: a first attempt is enough for the feedback step.`
      : `The activity takes about ${activityMin} minutes, so students can finish and start a second try.`,
    receptive
      ? mins >= 15
        ? "Circulate and watch at least four students; note which clue each one used."
        : "Circulate and watch two or three students; note which clue each one used."
      : mins >= 15
        ? `Circulate and ${K.watch} at least four students; note one strength and one next step for each.`
        : `Circulate and ${K.watch} two or three students.`,
    ...(mins >= 20 && speaking
      ? [
          "Before students record, pairs rehearse aloud once so the first recording is not the first try.",
        ]
      : []),
    ...(mins >= 20 && res.domain === "writing"
      ? ["Before students write, pairs say their first sentence aloud to a partner."]
      : []),
    ...(mins >= 20 && receptive
      ? [`Before students begin, pairs predict one word they expect to find in ${K.source}.`]
      : []),
  ];
  const feedback = [
    `Start with what worked: “${praise || "You answered the prompt."}”`,
    `Name one next step${receptive ? "" : " from the criteria"}: “${end(unmet)}” ${hint ? `Point students to the hint: ${hint}` : ""}`.trim(),
    receptive
      ? `Students ${K.again.toLowerCase()} and choose once more, then use the check button again.`
      : speaking
        ? "Students say it again with the one change, or record a second take."
        : "Students revise one sentence and use “Check my work” again.",
    ...(mins >= 15 && act.extension ? [`Early finishers: ${end(act.extension)}`] : []),
  ];
  const closeText = receptive
    ? mins >= 15
      ? `Partner share: tell your partner the word or sentence that proved your answer. Exit question: “Which clue helped you most, and why?”`
      : `Quick share: tell a partner the one word that helped you. Exit question: “Which clue proved your answer?”`
    : speaking
      ? mins >= 15
        ? `Partner share: say your best sentence again. Exit question: “Which word or frame helped you most, and why?”`
        : `Quick share: say your best sentence to a partner. Exit question: “Which word helped you most?”`
      : mins >= 15
        ? `Exit ticket: underline the sentence you revised and finish: “I made it clearer by ___ because ___.”`
        : `Exit ticket: underline the sentence you revised. Write the one word that made it clearer.`;

  const blocks = [
    { id: "launch", name: "Teacher launch", minutes: T.launch, steps: launch },
    ...(T.model ? [{ id: "model", name: "Model", minutes: T.model, steps: modelSteps }] : []),
    { id: "practice", name: "Student practice", minutes: T.practice, steps: practice },
    { id: "feedback", name: "Feedback and revision", minutes: T.feedback, steps: feedback },
    { id: "close", name: "Closing", minutes: T.close, steps: [closeText] },
  ];
  const modeling = receptive ? frames[0] || "" : firstSentence(model) || frames[0] || "";
  return {
    title: "My First Lesson with The Language Page",
    resource: { ...res, url, route: resourceRoute(res), where },
    gradeLabel: bandName(res.band),
    domainLabel: domainName(res.domain),
    minutes: mins,
    approach,
    target,
    profiles,
    prep: [
      `Open the student link once on your device${K.gear}: ${url}`,
      "Print the Student Activity Card or display the Classroom Projection View.",
      `Decide which support profile each student starts with (${approach === "mixed" ? "Starting, Growing or Expanding" : `${profileById(profiles, approach).name} for everyone`}).`,
      act.teacher?.noTech ? `No devices? ${end(act.teacher.noTech)}` : "",
    ].filter(Boolean),
    blocks,
    talkMoves: [
      `Launch: “Today we are learning to ${lowerFirst(stripEnd(act.skill || act.title))}.${vocab.length ? ` Listen for the words ${nice(vocab.slice(0, 3).map((v) => v[0]))}.` : ""}”`,
      `Feedback: “${praise || "You answered the prompt."} Next, ${lowerFirst(stripEnd(unmet))}.”`,
    ],
    differentiation: sup,
    evidence: crit,
    evidenceNote: act.teacher?.onLevel
      ? `On-level look-for: ${end(act.teacher.onLevel)}`
      : "",
    feedback: { praise, next: unmet, hint, revise: retry },
    closing: closeText,
    checkAct: receptive
      ? "Watch which answers students choose and which clue each one can name. Use the look-fors as your checklist."
      : "Look at the work students produced. Use the success criteria as your checklist.",
    // The Prepare step's Model card: a heard or read model for Speaking and Writing, a look-for cue for the others.
    modelMove: receptive
      ? {
          act: `Think aloud about the first clue you ${K.cue}. Do not say the answer.`,
          say: `“I will ${K.cue} ${look0}.”`,
          note: frames[0] ? `Read a frame together: ${frames[0]}` : "",
        }
      : {
          act: "Say or show a model, then think aloud about how you used a frame.",
          say: `“${modelFor(act, res.level) || frames.join(" ")}”`,
          note: frames[0] ? `Think aloud with: ${frames[0]}` : "",
        },
    student: {
      title: res.title,
      doing: K.doing,
      directions,
      prompt,
      url,
      expected: receptive
        ? look.length
          ? `${K.cue[0].toUpperCase()}${K.cue.slice(1)}: ${nice(look)}.`
          : ""
        : expected.length
          ? `Your answer should include: ${nice(expected)}.`
          : "",
      optional: end(act.support),
      picture: act.picture?.src ? { src: act.picture.src, alt: act.picture.alt || "" } : null,
    },
    projection: {
      target,
      directions,
      prompt,
      frames: approach === "expanding" ? [] : approach === "growing" ? frames.slice(0, 1) : frames,
      picture: act.picture?.src ? { src: act.picture.src, alt: act.picture.alt || "" } : null,
      url,
    },
    supportCard: {
      vocab: vocab.map((v) => ({ term: v[0], def: v[1] })),
      frames,
      bank,
      modeling: modeling
        ? receptive
          ? `Read the frame together, then let students use it: “${modeling}”`
          : `Say it, then have students echo it: “${modeling}”`
        : "",
      evidence: crit,
      feedbackExample: `“${praise || "You answered the prompt."}” Next step: “${end(unmet)}”`,
      revisionPrompt: retry,
    },
  };
}

/** Total minutes of a lesson's blocks (the timing check). */
export const totalMinutes = (lesson) => lesson.blocks.reduce((n, b) => n + b.minutes, 0);

/** The whole lesson as plain text, for pasting into a planning document. */
export function lessonText(lesson, quick = []) {
  const L = [];
  const h = (s) => L.push("", s.toUpperCase(), "");
  L.push(lesson.title, `${lesson.gradeLabel} · ${lesson.domainLabel} · ${lesson.minutes} minutes`);
  L.push(`Activity: ${lesson.resource.where}`, `Student link: ${lesson.student.url}`);
  h("Learning target");
  L.push(lesson.target);
  h("Prepare");
  for (const p of lesson.prep) L.push(`- ${p}`);
  h("Lesson steps");
  for (const b of lesson.blocks) {
    L.push(`${b.name} (${b.minutes} min)`);
    for (const s of b.steps) L.push(`  - ${s}`);
  }
  h("Teacher talk moves");
  for (const t of lesson.talkMoves) L.push(`- ${t}`);
  h("Language supports");
  L.push(lesson.differentiation.lead);
  for (const s of lesson.differentiation.lines) L.push(`- ${s}`);
  h("Evidence of learning");
  for (const c of lesson.evidence) L.push(`[ ] ${c}`);
  if (lesson.evidenceNote) L.push(lesson.evidenceNote);
  h("Feedback and revision");
  L.push(
    `Strength: ${lesson.feedback.praise}`,
    `Next step: ${lesson.feedback.next}`,
    `Revise: ${lesson.feedback.revise}`,
  );
  h("Closing");
  L.push(lesson.closing);
  if (quick.length) {
    h("Your quick guide to The Language Page");
    for (const q of quick) L.push(`- ${q.want}: ${q.url}`);
  }
  return `${L.join("\n")}\n`;
}
