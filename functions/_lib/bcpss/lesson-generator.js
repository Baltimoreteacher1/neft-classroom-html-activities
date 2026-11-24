// Draft lesson companions (8-12 per unit) generated from a unit's authored Language Studio content.
// Pure and deterministic: same unit + studio -> same lessons. Hand-authored lessons (source "authored")
// override these through functions/_lib/bcpss/lessons.js.

import * as B from "./lesson-builders.js";

const SUBJ = { ELA: "ELA", Math: "Math", Science: "Science", "Social Studies": "SocialStudies" };
const SLUG = { ELA: "ela", Math: "math", Science: "sci", "Social Studies": "ss" };
const q = (t) => `“${t}”`;
const lc1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const band = (g) =>
  ["K", "1", "2"].includes(String(g)) ? "K-2" : ["3", "4", "5"].includes(String(g)) ? "3-5" : "6-8";

// Language functions, in teaching order. `interact` names the unit activity whose payload is sliced for step 4.
const SESSIONS = {
  meet: {
    title: (a, b) => `Meet ${q(a)} and ${q(b)}`,
    fn: "define key words and use them in a sentence",
    forms: ["present tense", "noun phrases"],
    interact: "talk_cards",
    mode: "Interpretive",
  },
  say: {
    title: (a) => `Say it with ${q(a)}`,
    fn: "use key words in complete spoken sentences",
    forms: ["subject + verb sentences", "key unit words"],
    interact: "talk_cards",
    mode: "Expressive",
  },
  notice: {
    title: () => "Notice how the sentence works",
    fn: "name the job of each part of a sentence",
    forms: ["sentence chunks", "joining words"],
    interact: "sentence_combine",
    mode: "Interpretive",
  },
  connect: {
    title: (a) => `Join ideas around ${q(a)}`,
    fn: "join two ideas with a connector",
    forms: ["connectors: because, so, and", "compound sentences"],
    interact: "sentence_combine",
    mode: "Expressive",
  },
  fix: {
    title: () => "Find and fix the mistake",
    fn: "find and correct language errors in a sentence",
    forms: ["word choice", "sentence structure"],
    interact: "error_analysis",
    mode: "Interpretive",
  },
  sort: {
    title: (a) => `Sort and explain with ${q(a)}`,
    fn: "group words and explain why they belong together",
    forms: ["comparing and contrasting", "category words"],
    interact: "word_sort",
    mode: "Expressive",
  },
  info: {
    title: () => "Ask and answer to find the facts",
    fn: "ask and answer questions to share information",
    forms: ["question forms", "answer frames"],
    interact: "info_gap",
    mode: "Expressive",
  },
  read: {
    title: () => "Read like a detective",
    fn: "find language evidence in a short text",
    forms: ["text evidence", "reference words"],
    interact: "read_annotate",
    mode: "Interpretive",
  },
  retell: {
    title: () => "Listen and retell",
    fn: "retell key ideas in order",
    forms: ["signal words", "past or present tense"],
    interact: "dictogloss",
    mode: "Interpretive",
  },
  order: {
    title: (a) => `Put the ideas in order with ${q(a)}`,
    fn: "sequence ideas with signal words",
    forms: ["first, next, then, finally"],
    interact: "unscramble",
    mode: "Expressive",
  },
  proof: {
    title: (a) => `Give a reason for ${q(a)}`,
    fn: "support an idea with a reason or evidence",
    forms: ["claim + because + evidence"],
    interact: "talk_cards",
    mode: "Expressive",
  },
  show: {
    title: () => "Show what you know",
    fn: "explain the unit's big idea in your own words",
    forms: ["connected sentences", "precise vocabulary"],
    interact: "talk_cards",
    mode: "Expressive",
  },
};
const PLAN = {
  ELA: [
    "meet",
    "say",
    "notice",
    "connect",
    "fix",
    "sort",
    "info",
    "read",
    "retell",
    "order",
    "proof",
    "show",
  ],
  Math: ["meet", "say", "notice", "connect", "fix", "info", "proof", "show"],
  Science: ["meet", "say", "notice", "sort", "connect", "fix", "retell", "info", "proof", "show"],
  "Social Studies": [
    "meet",
    "say",
    "notice",
    "sort",
    "connect",
    "fix",
    "retell",
    "info",
    "proof",
    "show",
  ],
};
const PROMPTS = {
  meet: (a) => `Tell a partner what ${q(a)} means and give one example.`,
  say: (a) => `Say a sentence about this unit that uses ${q(a)}.`,
  notice: () => "Say the mentor sentence, then say a new sentence with the same parts.",
  connect: (a) => `Say two ideas about ${q(a)} and join them with a connector.`,
  fix: (a) => `Say a sentence with ${q(a)}, then fix one word to make it clearer.`,
  sort: (a) => `Explain why ${q(a)} belongs in one group and not the other.`,
  info: (a) => `Ask your partner a question about ${q(a)}, then answer theirs.`,
  read: (a) => `Tell a partner which sentence in the text shows ${q(a)}.`,
  retell: (a) => `Retell the story in order and use ${q(a)} at least once.`,
  order: (a) => `Say what happens first, next, and last. Use ${q(a)} in one step.`,
  proof: (a) => `Say your idea about ${q(a)} and give a reason that proves it.`,
  show: (a) => `Explain this unit's big question in your own words, using ${q(a)}.`,
};
const FIXED_MIN = { warm_up: 4, input: 5, notice: 5, interact: 6, produce: 5, check: 3 };

const word = (v) => v.term;
const capSentence = (s, max = 215) => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 2).replace(/[\s,;:(]+$/, "");
  const openQ = (cut.match(/“/g) || []).length > (cut.match(/”/g) || []).length;
  return `${cut}${openQ ? "”" : ""}….`;
};
const snip = (t, n = 5) =>
  String(t)
    .replace(/[.!?]+$/, "")
    .split(/\s+/)
    .slice(0, n)
    .join(" ");
function buildLesson({ unit, studio, klu, seq, kind, focus, review }) {
  const [t1, t2 = focus[0]] = focus.map(word);
  const sess = SESSIONS[kind];
  const id = `${unit.id}-l${String(seq).padStart(2, "0")}`;
  const mentor = B.mentorFor(studio, focus, seq);
  const eq = studio.essential_question;
  const titleRe = new RegExp(String(unit.unit_title).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const goal = snip(
    [
      studio.can_do.content.replace(/^I can /, ""),
      studio.exit_ticket.prompt,
      studio.mentor.gist,
    ].find((t) => !titleRe.test(t)) || studio.mentor.gist,
    7,
  );
  const frame = studio.frames.l3_4[seq % studio.frames.l3_4.length];
  const plain = studio.connectors.filter((c) => !/[….]/.test(c) && c.split(/\s+/).length <= 2);
  const connector = (plain.length ? plain : studio.connectors)[
    seq % (plain.length || studio.connectors.length)
  ];

  const pool = [...focus, ...review, ...studio.vocab].filter(
    (v, i, a) => a.findIndex((x) => x.term === v.term) === i,
  );
  const cards = pool.slice(0, 4).map((v) => ({
    prompt: `Which word means: ${lc1(v.def).replace(/[.!?]+$/, "")}?`,
    answer: v.term,
    ...(v.icon ? { icon: v.icon } : {}),
  }));
  const warm = B.flashRetrieval(cards, "Word Flip");
  warm.mission = `Say which word fits each clue, starting with ${q(`${snip(cards[0].prompt.replace(/^Which word means: /, ""), 7)}…`)}, then flip to check (${t1}, ${t2}; goal: ${goal}).`;

  const others = studio.vocab.filter((v) => !focus.includes(v));
  const lItems = [...focus, others[seq % others.length]]
    .filter(Boolean)
    .slice(0, 3)
    .map((v, i) => {
      const pool = B.pick(
        studio.vocab.filter((o) => o.term !== v.term),
        `${id}:l${i}`,
        2,
      ).map((o) => ({ label: o.term, ...(o.icon ? { icon: o.icon } : {}) }));
      const right = { label: v.term, ...(v.icon ? { icon: v.icon } : {}) };
      const options = B.pick([right, ...pool], `${id}:o${i}`, 3);
      return {
        say: v.example,
        options,
        answer: options.findIndex((o) => o.label === v.term),
        why: `${q(v.term)} means ${lc1(v.def).replace(/[.!?]+$/, "")}.`,
      };
    });
  const input = B.listenAndShow(lItems, "Listen and Tap", t1);
  input.mission = `Listen to each sentence and tap the word it is about, starting with the one that begins ${q(lItems[0].say.split(/\s+/).slice(0, 8).join(" "))}.`;

  const notice = B.sentenceXray(
    mentor,
    "Sentence X-Ray",
    mentor.chunks[0].ask || "Which chunk starts the idea?",
  );
  notice.mission = `Look inside the sentence that starts ${q(
    mentor.chunks
      .map((c) => c.text)
      .join(" ")
      .split(/\s+/)
      .slice(0, 9)
      .join(" "),
  )}, then drag the chunks back into order.`;

  const morphItems = kind === "notice" ? B.morphItemsFor(studio, focus, seq) : [];
  const base =
    (morphItems.length >= 3 ? B.morphLab(morphItems, "Word Part Lab") : null) ||
    (kind === "talk_cards" ? B.sliceTalk(studio, seq) : null) ||
    (sess.interact === "talk_cards" ? B.sliceTalk(studio, seq) : null) ||
    B.sliceItems(studio, sess.interact, seq, 2) ||
    B.activityOf(studio, sess.interact) ||
    B.sliceTalk(studio, seq);
  const interact = { ...base, minutes: 6 };
  if (interact.kind === "morph_lab")
    interact.mission = capSentence(
      `Build ${morphItems.length} words from their parts, starting with ${q(morphItems[0].word)} (${morphItems[0].parts.join(" + ")}), and explain what each word means (goal: ${goal}).`,
    );
  else if (interact.kind === "talk_cards")
    interact.mission = capSentence(
      `Take turns with the card that asks ${q(interact.payload.cards[0].prompt)}, and push each other's thinking.`,
    );
  else if (interact.kind === "info_gap")
    interact.mission = `Ask your partner questions to find ${q(interact.payload.a.needs[0])}, and answer theirs — no peeking!`;

  const model = kind === "show" || kind === "proof" ? studio.exit_ticket.model : focus[0].example;
  const conn2 =
    (plain.length > 1 ? plain : studio.connectors)[
      (seq + 1) % (plain.length > 1 ? plain.length : studio.connectors.length)
    ] || "so";
  const connPair =
    conn2 === connector
      ? [connector, connector === "because" ? "so" : "because"]
      : [connector, conn2];
  const produce =
    kind === "show"
      ? B.paragraphBuilder(
          {
            klu,
            slots: [
              { label: "Claim or topic", frame: studio.exit_ticket?.frame || frame },
              { label: "Reason or detail", frame: `I know this ${connector} ___.` },
              { label: "Wrap-up", frame: `In summary, ${t1} and ${t2} show that ___.` },
            ],
            connectors: connPair,
            checklist: [
              `I used the words ${q(t1)} and ${q(t2)}.`,
              `I joined ideas with ${q(connPair[0])} or ${q(connPair[1])}.`,
              "My paragraph answers the big question clearly.",
            ],
            model,
          },
          "Build Your Paragraph",
        )
      : B.speakAndRecord(
          {
            prompt: PROMPTS[kind](t1),
            frame,
            model,
            checklist: [
              `I used the word ${q(t1)}.`,
              `I used a joining word such as ${q(connector)}.`,
              "I spoke so my partner could understand me.",
            ],
          },
          "Say It, Hear It",
        );
  produce.mission =
    produce.kind === "paragraph_builder"
      ? capSentence(
          `Fill each part of the ${klu} organizer using ${q(t1)}, ${q(t2)} and ${q(connPair[0])}, then check your paragraph (goal: ${goal}).`,
        )
      : `Answer out loud, record yourself, and listen back to check ${q(t1)} and ${q(connector)} (goal: ${goal}).`;

  const canDo = `I can ${sess.fn} using ${q(t1)} and ${q(t2)}.`;
  const check = B.exitCheck(B.exitItems(focus, studio, seq), canDo, "Show What You Know");
  check.mission = capSentence(
    `Answer the questions that start ${q(`${snip(check.payload.items[0].q, 8)}…`)}, then rate how well you can ${sess.fn} (goal: ${goal}).`,
  );

  const arc = [
    { step: "warm_up", minutes: FIXED_MIN.warm_up, activity: warm },
    { step: "input", minutes: FIXED_MIN.input, activity: input },
    { step: "notice", minutes: FIXED_MIN.notice, activity: notice },
    { step: "interact", minutes: FIXED_MIN.interact, activity: interact },
    { step: "produce", minutes: FIXED_MIN.produce, activity: produce },
    { step: "check", minutes: FIXED_MIN.check, activity: check },
  ];

  const nv = pool.slice(0, 4);
  const pas = B.pointAndSay(
    pool.slice(0, 3).map((v) => ({
      term: v.term,
      icon: v.icon || "🖼️",
      cue: v.cue,
      say: v.example,
      ...(v.es ? { es: v.es } : {}),
    })),
    "Point and Say",
  );
  pas.mission = `Point to the picture clue ${q(`${snip(pas.payload.items[0].cue, 6)}…`)}, say the word, then say its sentence with the audio.`;
  const tpr = B.tprCards(
    nv.slice(0, 4).map((v) => ({
      command: /verb/i.test(v.pos)
        ? `Act it out: ${lc1(v.def).replace(/[.!?]+$/, "")}.`
        : `Point to a picture or object that shows ${q(v.term)}.`,
      icon: v.icon || "👉",
    })),
    "Act It Out",
  );
  tpr.mission = `Listen to the commands, starting with ${q(tpr.payload.items[0].command.replace(/[.!?]+$/, ""))}, and show each one (goal: ${goal}).`;
  const esAll = [...focus, ...review, ...studio.vocab]
    .filter((v) => v.es)
    .filter((v, i, a) => a.findIndex((x) => x.term === v.term) === i);
  const esTerms = esAll.slice(0, 3);
  const bridge = B.homeLanguageBridge(
    esTerms.map((v) => ({ term: v.term, es: v.es, note: v.es_note || `${v.term} = ${v.es}.` })),
    "Home Language Bridge",
  );
  bridge.mission = `Say ${q(esTerms[0].term)} and ${q(esTerms[0].es)}, then use ${q(esTerms[0].term)} the way this sentence does: ${q(`${snip(esTerms[0].example, 9)}…`)}`;
  const cogItems = esAll.slice(0, 4).map((v) => ({
    term: v.term,
    es: v.es,
    status: B.cognateStatusOf(v),
    why: v.es_note || `${q(v.term)} in English is ${q(v.es)} in Spanish.`,
  }));
  const cog =
    seq % 2 === 0 && cogItems.length >= 4
      ? B.cognateDetective(cogItems, "Cognate Detective")
      : null;
  if (cog)
    cog.mission = capSentence(
      `Sort ${cogItems.length} English and Spanish word pairs, starting with ${q(cogItems[0].term)} / ${q(cogItems[0].es)}, into true cognate, false friend, or no look-alike (goal: ${goal}).`,
    );
  const newcomer = cog ? [pas, tpr, bridge, cog] : [pas, tpr, bridge];

  const wk = studio.watchouts[seq % studio.watchouts.length];
  const produceSupport = produce.support;
  const finaleLocks = kind === "show" ? B.escapeLocksFor(studio, seq) : [];
  const finaleCanDo = [studio.can_do?.content, studio.can_do?.language, canDo]
    .filter((s) => s && !titleRe.test(s))
    .slice(0, 3);
  const gradeLabel = String(unit.grade) === "K" ? "Kindergarten" : `Grade ${unit.grade}`;
  const extension =
    kind === "show" && finaleLocks.length >= 5
      ? B.missionEscape(
          {
            locks: finaleLocks,
            certificate: {
              title: `${gradeLabel} ${unit.subject} Language Explorer Certificate`,
              badge: `${unit.subject} ${klu} Explorer`,
              can_do: finaleCanDo.length ? finaleCanDo : [canDo],
            },
          },
          "Unit Finale: Mission Escape",
        )
      : B.activityOf(studio, "write_scaffold")
        ? {
            ...B.activityOf(studio, "write_scaffold"),
            minutes: 8,
            mission: `Write a short answer that uses ${q(t1)} and ${q(connector)}, following the structure (goal: ${goal}).`,
          }
        : null;
  if (extension?.kind === "mission_escape")
    extension.mission = capSentence(
      `Solve all ${finaleLocks.length} unit locks, starting with ${q(finaleLocks[0].title)}, to unlock your ${unit.subject} ${klu} Explorer certificate (goal: ${goal}).`,
    );
  return {
    id,
    unit_id: unit.id,
    version: 1,
    sequence: seq,
    source: "draft_standards_based",
    title: sess.title(t1, t2),
    core_lesson_ref: { label: `Language session ${seq}`, source: "language_pathway" },
    content_objective: `Students will explain what ${q(t1)} and ${q(t2)} mean and use them to talk about this question: ${eq}`,
    language_objective: {
      klu,
      function: sess.fn,
      forms: sess.forms,
      by_level: {
        l1_2: `I can say ${q(t1)} and finish a sentence frame with a word bank.`,
        l3_4: `I can use ${q(t1)} and ${q(t2)} in two connected sentences with a joining word.`,
        l5_6: `I can ${sess.fn} using ${q(t1)} and ${q(t2)} with a reason or evidence.`,
      },
    },
    standards: unit.core_standards || [],
    wida: {
      framework: "2020",
      language_expectation: `${SUBJ[unit.subject]}.${band(unit.grade)}.${klu}.${sess.mode}`,
      pld_targets: ["discourse", "sentence", "word"],
    },
    vocab: [
      ...focus.map((v) => ({ term: v.term, tier: v.tier, new_or_review: "new" })),
      ...review.slice(0, 2).map((v) => ({ term: v.term, tier: v.tier, new_or_review: "review" })),
    ],
    mentor_sentence: mentor,
    arc,
    newcomer_path: newcomer,
    extension,
    exit_check: check,
    teacher_card: {
      minutes: Object.values(FIXED_MIN).reduce((n, m) => n + m, 0),
      materials: ["Sticky notes or whiteboards", "Device with sound for each pair"],
      listen_for: [
        `Students use ${q(t1)} accurately in a sentence.`,
        `Students use a joining word such as ${q(connector)}.`,
        "Students explain their thinking, not only the answer.",
      ],
      watchouts: [wk.issue],
      differentiation: {
        l1_2: produceSupport.l1_2,
        l3_4: produceSupport.l3_4,
        l5_6: produceSupport.l5_6,
        newcomer:
          "Use Point and Say, Act It Out and the Home Language Bridge; accept pointing, drawing and home-language answers.",
      },
    },
    media: { images: [], audio: [] },
    review: { pedagogy: "pending", language_qa: "pending", translation: {} },
  };
}

/** @param {{unit: object, studio: object, klu?: string}} input */
export function generateLessons({ unit, studio, klu = "Explain" }) {
  const vocab = [...studio.vocab].sort((a, b) => b.tier - a.tier);
  return PLAN[unit.subject].map((kind, i) => {
    const seq = i + 1;
    const at = (2 * i) % vocab.length;
    const focus = [vocab[at], vocab[(at + 1) % vocab.length]];
    const seen = vocab.slice(0, at).filter((v) => !focus.includes(v));
    return buildLesson({ unit, studio, klu, seq, kind, focus, review: seen.slice(-2).reverse() });
  });
}
