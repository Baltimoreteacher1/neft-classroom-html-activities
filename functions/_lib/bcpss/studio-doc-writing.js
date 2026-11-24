// Language Studio print: WRITING LAB (The Writing Revolution sentence-to-paragraph path).
//   part "writing"     → student packet for one WIDA band (?wida=1_2|3_4|5_6); answerKey fills every line.
//   part "writing-key" → teacher guide: all three bands, models, answers, rubric.
// Source: detail.writing (contract: db/seeds/bcpss/v2/writing-schema.mjs). Same document model as every other part,
// so HTML/PDF (studio-print-html.js) and Word (studio-docx.js) render it with no layout logic of their own.

import {
  B,
  b,
  frameRuns,
  gradeLabel,
  i,
  LEVEL_LABEL,
  newDoc,
  section,
  shuffled,
  subjectTone,
  t,
} from "./studio-doc.js";

export const LEVEL_NAME = { l1_2: "Starter", l3_4: "Core", l5_6: "Stretch" };
export const GENRE = { explain: "Explain", argue: "Argue", inform: "Inform", narrate: "Narrate" };
const SYMBOLS = [
  "→ leads to",
  "= means",
  "+ more / and",
  "− less",
  "b/c because",
  "w/ with",
  "ex. example",
  "@ at",
];
export const CONJ = [
  ["because", "gives a reason", "Vocabulary"],
  ["but", "shows a change", "Game"],
  ["so", "tells a result", "Reading"],
];
export const RUBRIC = [
  [
    "Ideas",
    "I wrote my main idea.",
    "I explained my idea with details from the unit.",
    "I explained with strong, exact details and unit words.",
  ],
  [
    "Sentences",
    "I wrote complete sentences.",
    "I used because, but, or so and transitions.",
    "I used an appositive or a clue-word start, and my sentences flow.",
  ],
  [
    "Words",
    "I used some unit words.",
    "I used unit words correctly.",
    "I used precise unit words to make my meaning clear.",
  ],
];
const TWR_CHECKS = [
  "My topic sentence tells what the paragraph is about.",
  "Each detail supports the topic sentence.",
  "I used transition words to connect ideas.",
  "I used at least one because, but, or so sentence.",
  "My concluding sentence sums up my idea in new words.",
];

const lessonOf = (w, id) => w.lessons.find((l) => l.id === id)?.title || "";
const fromLesson = (w, id) =>
  id ? { t: `  From lesson: ${lessonOf(w, id)}`, i: true, small: true } : t("");
const fill = (ctx, v) => (ctx.answerKey ? { fill: [v] } : {});
const draftLines = { l1_2: 7, l3_4: 13, l5_6: 17 };
// K-2 pages print larger type, so the same page holds fewer lines.
const draftLinesEarly = { l1_2: 6, l3_4: 9, l5_6: 11 };

function cover(detail, ctx) {
  const u = detail.unit;
  const w = detail.writing;
  return {
    layout: "portrait",
    bleed: true,
    blocks: [
      B.hero({
        tone: subjectTone(u.subject),
        kicker: `Writing Lab · ${u.unit_title}`,
        title: w.title,
        subtitle: w.prompt[ctx.level],
        chips: [
          gradeLabel(u),
          u.subject,
          `${GENRE[w.genre]} writing`,
          `${LEVEL_NAME[ctx.level]} · ${LEVEL_LABEL[ctx.level]}`,
        ],
        nameDate: true,
      }),
    ],
  };
}

function notesPage(w, ctx) {
  const rows = w.notes.map((n, k) => [
    { runs: [b(`${k + 1}. `), t(n.sentence)] },
    { blocks: [B.lines(1, fill(ctx, n.note))] },
  ]);
  return section(
    [
      B.band({
        number: 1,
        domain: "Reading",
        title: "Read & Take Notes",
        minutes: 12,
        grouping: "Solo",
      }),
      B.para(
        [
          t(
            "Read the text. Then turn each sentence into a note: key words, symbols and abbreviations, never a full sentence.",
          ),
        ],
        { mission: true },
      ),
      B.callout(
        "Reading",
        [B.para([b(w.source.title)], { size: "lg" }), B.para([t(w.source.text)])],
        { label: `From lesson: ${lessonOf(w, w.source.lesson)}`, icon: "book" },
      ),
      B.chips(SYMBOLS, { label: "Note symbols", tone: "Writing" }),
      B.table(rows, { headers: ["Sentence", "My note"], widths: [58, 42], tone: "Reading" }),
    ],
    { tone: "Reading" },
  );
}

function bbsAndExpandPage(w, ctx) {
  const blocks = [
    B.band({
      number: 2,
      domain: "Writing",
      title: "Because · But · So",
      minutes: 10,
      grouping: "Solo",
    }),
    B.para(
      [
        t(
          ctx.level === "l1_2"
            ? "Draw a line from each word to the ending that fits. Because gives a reason. But shows a change. So tells a result."
            : "Finish each sentence three ways. Because gives a reason. But shows a change. So tells a result.",
        ),
      ],
      { mission: true },
    ),
  ];
  const exp = [];
  // K-2 paper practice: two items per session (the interactive Lab and the teacher guide keep all of them).
  (ctx.early ? w.bbs.slice(0, 2) : w.bbs).forEach((x, k) => {
    const head = B.para([b(`${k + 1}. ${x.kernel} …`), fromLesson(w, x.lesson)]);
    if (ctx.level === "l1_2") {
      // Starter: draw a line from each word to its ending, then copy one whole sentence.
      const order = shuffled(
        CONJ.map(([c]) => c),
        x.kernel,
      ).map((o) => o.v);
      (k < 2 ? blocks : exp).push(
        head,
        B.matchColumns({
          leftLabel: "Word",
          rightLabel: "Ending",
          left: CONJ.map(([c]) => c),
          right: order.map((c) => x[c]),
          ...(ctx.answerKey ? { answers: CONJ.map(([c]) => order.indexOf(c)) } : {}),
        }),
        ...(ctx.early
          ? []
          : [
              B.lines(1, {
                label: "Write one whole sentence",
                ...fill(ctx, `${x.kernel} because ${x.because}`),
              }),
            ]),
      );
      return;
    }
    const rows = CONJ.map(([c, , tone]) => [
      { runs: [b(c)], tone },
      { blocks: [B.lines(1, fill(ctx, `${x.kernel} ${c} ${x[c]}`))] },
    ]);
    (ctx.early && k >= 2 ? exp : blocks).push(
      head,
      B.table(rows, { widths: [16, 84], compact: true }),
    );
  });
  if (ctx.early && ctx.level === "l1_2")
    blocks.push(
      B.lines(1, {
        label: "Pick one. Write the whole sentence.",
        ...fill(ctx, `${w.bbs[0].kernel} because ${w.bbs[0].because}`),
      }),
    );
  exp.push(
    B.band({
      number: 3,
      domain: "Writing",
      title: "Stretch a Sentence",
      minutes: 10,
      grouping: "Solo",
    }),
  );
  w.expand.forEach((e, k) => {
    // K-2 print uses large type: two question words per kernel (the usual K-2 expansion) keep the page whole.
    const keys = Object.keys(e.parts).slice(0, ctx.early ? 2 : 6);
    exp.push(
      B.para([b(`${k + 1}. Kernel: ${e.kernel}`), fromLesson(w, e.lesson)]),
      B.table(
        keys.map((q) => [
          { runs: [b(`${q[0].toUpperCase()}${q.slice(1)}?`)], tone: "Writing" },
          ctx.level === "l1_2" || ctx.answerKey
            ? { runs: [i(e.parts[q])] }
            : { blocks: [B.lines(1)] },
        ]),
        { widths: [20, 80], compact: true },
      ),
      B.lines(2, { label: "My expanded sentence", ...fill(ctx, e.model) }),
    );
  });
  return [section(blocks, { tone: "Writing" }), section(exp, { tone: "Writing" })];
}

function sentencePage(w, ctx) {
  const blocks = [
    B.band({
      number: 4,
      domain: "Game",
      title: "Sentence or Fragment?",
      minutes: 8,
      grouping: "Partners",
    }),
    B.para(
      [
        t(
          "A sentence has a who or what and an action, and makes sense alone. Circle S or F. Fix every fragment.",
        ),
      ],
      { mission: true },
    ),
  ];
  w.fragments.forEach((f, k) => {
    blocks.push(
      B.checklist([[b(`${k + 1}. `), t(f.text)]], { style: "dot", tone: "Game" }),
      B.checklist(["S  Sentence", "F  Fragment"], {
        style: "bubble",
        ...(ctx.answerKey ? { mark: f.is_sentence ? 0 : 1 } : {}),
      }),
      ...(f.is_sentence ? [] : [B.lines(1, { label: "Fix it", ...fill(ctx, f.fix) })]),
    );
  });
  const page2 = [];
  page2.push(
    B.band({
      number: 5,
      domain: "Vocabulary",
      title: "Add an Appositive",
      minutes: 8,
      grouping: "Solo",
    }),
    B.para(
      [
        t(
          "An appositive renames a noun. It sits right after the noun, between commas. Choose the best one, then write the sentence.",
        ),
      ],
      { mission: true },
    ),
  );
  w.appositives.forEach((a, k) => {
    page2.push(
      B.para([
        b(`${k + 1}. `),
        ...frameRuns(a.sentence.replace("___", "[appositive]")),
        fromLesson(w, a.lesson),
      ]),
      B.checklist(a.options, {
        style: "bubble",
        letters: true,
        ...(ctx.answerKey ? { mark: a.answer } : {}),
      }),
      B.lines(1, fill(ctx, a.model)),
    );
  });
  blocks.push(
    B.band({
      number: 6,
      domain: "Speaking",
      title: "Start With a Clue Word",
      minutes: 8,
      grouping: "Solo",
    }),
    B.para([t("Start with the clue word, add a comma, then finish with the main idea.")], {
      mission: true,
    }),
  );
  w.subordinate.forEach((s, k) => {
    const cap = `${s.conjunction[0].toUpperCase()}${s.conjunction.slice(1)}`;
    blocks.push(
      B.para([
        b(`${k + 1}. ${cap} `),
        { gap: "clue part" },
        t(`, ${s.stem}.`),
        fromLesson(w, s.lesson),
      ]),
      B.lines(ctx.level === "l5_6" ? 2 : 1, fill(ctx, s.model)),
    );
  });
  return [section(blocks, { tone: "Game" }), section(page2, { tone: "Vocabulary" })];
}

function planPage(w, ctx) {
  const p = w.spo;
  const notes = shuffled([...p.details.map((d) => d.note), ...p.distractors], `${w.title}-spo`).map(
    (e) => e.v,
  );
  const detailRows = (ctx.level === "l1_2" || ctx.early ? [0, 1, 2] : [0, 1, 2, 3]).map((k) => [
    { runs: [b("–")], align: "center" },
    { blocks: [B.lines(1, ctx.answerKey && p.details[k] ? { fill: [p.details[k].note] } : {})] },
  ]);
  return section(
    [
      B.band({
        number: 7,
        domain: "Writing",
        title: "Plan Your Paragraph",
        minutes: 12,
        grouping: "Solo",
      }),
      B.callout("Writing", [B.para([b(w.prompt[ctx.level])], { size: "lg" })], {
        label: "Your task",
        icon: "pencil",
      }),
      ...(ctx.level !== "l5_6"
        ? []
        : [
            B.callout(
              "neutral",
              p.starters.map((s) => B.para([b(`${s.type}: `), t(s.text)], { size: "sm" })),
              { label: "Topic-sentence starters", icon: "bulb" },
            ),
          ]),
      ...(ctx.level === "l5_6"
        ? []
        : [
            B.chips(notes, {
              label: "Note bank · two notes do not belong: cross them out",
              tone: "neutral",
            }),
          ]),
      B.table(
        [
          [
            { runs: [b("T.S.")], tone: "Reading" },
            {
              blocks: [
                B.para(frameRuns(p.topic[ctx.level]), { size: "sm" }),
                B.lines(ctx.level === "l5_6" && !ctx.early ? 2 : 1),
              ],
            },
          ],
          ...detailRows,
          [
            { runs: [b("C.S.")], tone: "Reading" },
            {
              blocks: [
                B.para(frameRuns(p.conclusion[ctx.level]), { size: "sm" }),
                B.lines(ctx.level === "l5_6" && !ctx.early ? 2 : 1),
              ],
            },
          ],
        ],
        {
          headers: ["", "Single-paragraph outline · key words for details"],
          widths: [10, 90],
          tone: "Writing",
        },
      ),
    ],
    { tone: "Writing" },
  );
}

function draftPage(detail, ctx) {
  const w = detail.writing;
  const words = (detail.studio?.vocab || []).map((v) => v.term);
  return section(
    [
      B.band({
        number: 8,
        domain: "Writing",
        title: "Write Your Draft",
        minutes: 20,
        grouping: "Solo",
      }),
      B.para(
        [t("Turn each note into a full sentence. Connect your sentences with transition words.")],
        { mission: true },
      ),
      B.chips(w.transitions, { label: "Transitions", tone: "Game" }),
      ...(words.length ? [B.chips(words, { label: "Unit words", tone: "Vocabulary" })] : []),
      B.lines(
        (ctx.early ? draftLinesEarly : draftLines)[ctx.level],
        ctx.answerKey ? { fill: [w.model[ctx.level]] } : {},
      ),
    ],
    { tone: "Writing" },
  );
}

function revisePage(w, ctx) {
  const checks = [...w.revise, ...TWR_CHECKS.slice(0, ctx.level === "l1_2" ? 3 : 5)];
  return section(
    [
      B.band({
        number: 9,
        domain: "Listening",
        title: "Revise & Rate",
        minutes: 10,
        grouping: "Partners",
      }),
      B.para(
        [
          t(
            "Read your paragraph aloud to a partner. Check each box when it is true, then fix what is not.",
          ),
        ],
        { mission: true },
      ),
      B.checklist(checks, { style: "box", tone: "Listening" }),
      B.heading("Rate my writing", 2, { icon: "star", tone: "Reading" }),
      B.table(
        RUBRIC.map(([k, ...cells]) => [
          { runs: [b(k)], tone: "Reading" },
          ...cells.map((c) => ({ runs: [t(`☐ ${c}`)] })),
        ]),
        {
          headers: ["", "Starting", "Getting there", "Got it"],
          widths: [16, 28, 28, 28],
          compact: true,
          tone: "Reading",
        },
      ),
    ],
    { tone: "Listening" },
  );
}

function mpoPage(w, ctx) {
  if (!w.mpo) return null;
  const m = w.mpo;
  return section(
    [
      B.band({
        number: 10,
        domain: "Reading",
        title: "Go Further: Essay Plan",
        minutes: 20,
        grouping: "Solo",
      }),
      B.para(
        [
          t(
            "Grow your paragraph into a short essay. Write a thesis, plan each body paragraph in key words, then plan the conclusion.",
          ),
        ],
        { mission: true },
      ),
      B.lines(2, { label: "Thesis", ...fill(ctx, m.thesis) }),
      ...m.paragraphs.map((p, k) =>
        B.callout(
          "neutral",
          [
            B.lines(1, { label: "Topic", ...fill(ctx, p.topic) }),
            B.lines(3, ctx.answerKey ? { fill: p.notes } : {}),
          ],
          { label: `Body paragraph ${k + 1}`, plain: true },
        ),
      ),
      B.lines(2, { label: "Conclusion", ...fill(ctx, m.conclusion) }),
    ],
    { tone: "Reading" },
  );
}

export function buildWriting(detail, opts) {
  const w = detail?.writing;
  if (!w) throw new Error("writing lab not authored for this unit");
  const ctx = { ...opts, early: ["K", "1", "2"].includes(String(detail.unit.grade)) };
  const sections = [
    cover(detail, ctx),
    notesPage(w, ctx),
    ...bbsAndExpandPage(w, ctx),
    ...sentencePage(w, ctx),
    planPage(w, ctx),
    draftPage(detail, ctx),
    revisePage(w, ctx),
    mpoPage(w, ctx),
  ].filter(Boolean);
  return newDoc(detail, ctx, sections, {
    titleSuffix: ` · Writing Lab${ctx.answerKey ? " (answer key)" : ""}`,
  });
}

// Teacher guide: how the path works, all three task levels, model paragraphs, and every answer.
export function buildWritingKey(detail, opts) {
  const w = detail?.writing;
  if (!w) throw new Error("writing lab not authored for this unit");
  const levels = ["l1_2", "l3_4", "l5_6"];
  const overview = section(
    [
      B.heading(`${w.title} · Teacher guide`, 1, { icon: "pencil", tone: "Writing" }),
      B.para(
        [
          t(
            `${gradeLabel(detail.unit)} ${detail.unit.subject} · ${detail.unit.unit_title} · ${GENRE[w.genre]} writing`,
          ),
        ],
        { size: "sm" },
      ),
      B.callout("Writing", [B.para([t(w.tip)])], { label: "Teacher tip", icon: "bulb" }),
      B.table(
        w.lessons.map((l) => [{ runs: [b(l.id)], align: "center" }, { runs: [t(l.title)] }]),
        {
          headers: ["", "Lessons the writing draws on"],
          widths: [8, 92],
          compact: true,
          tone: "Reading",
        },
      ),
      B.table(
        [
          [
            { runs: [b("1 Notes")] },
            { runs: [t("Key words, symbols, abbreviations. Never full sentences.")] },
          ],
          [
            { runs: [b("2 Because · But · So")] },
            {
              runs: [
                t(
                  "One kernel, three endings: reason, change, result. Builds explanation and precise thinking.",
                ),
              ],
            },
          ],
          [
            { runs: [b("3 Expansion")] },
            {
              runs: [
                t(
                  "Question words (who, what, when, where, why, how) stretch a kernel into a detailed sentence.",
                ),
              ],
            },
          ],
          [
            { runs: [b("4 Fragments")] },
            { runs: [t("Spot and fix incomplete sentences in unit content.")] },
          ],
          [
            { runs: [b("5 Appositives")] },
            { runs: [t("Rename a noun between commas to pack in content knowledge.")] },
          ],
          [
            { runs: [b("6 Clue words")] },
            { runs: [t("Subordinating conjunctions show time, contrast and cause.")] },
          ],
          [
            { runs: [b("7-9 Outline, draft, revise")] },
            {
              runs: [
                t(
                  "Single-paragraph outline (T.S., notes, C.S.), then draft with transitions, then revise with the checklist.",
                ),
              ],
            },
          ],
        ],
        {
          headers: ["The path", "What students practice"],
          widths: [26, 74],
          compact: true,
          tone: "Writing",
        },
      ),
      B.table(
        levels.map((l) => [
          { runs: [b(LEVEL_NAME[l]), t(` · ${LEVEL_LABEL[l]}`)], tone: "Writing" },
          { runs: [t(w.prompt[l])] },
        ]),
        { headers: ["Level", "Writing task"], widths: [24, 76], tone: "Writing" },
      ),
    ],
    { pageBreakBefore: false },
  );
  const models = section([
    B.heading("Model responses", 1, { icon: "star", tone: "Reading" }),
    ...levels.map((l) =>
      B.callout("Reading", [B.para([t(w.model[l])])], {
        label: `${LEVEL_NAME[l]} · ${LEVEL_LABEL[l]}`,
        icon: "book",
      }),
    ),
    ...(w.mpo
      ? [
          B.callout(
            "neutral",
            [
              B.para([b("Thesis: "), t(w.mpo.thesis)]),
              ...w.mpo.paragraphs.map((p, k) =>
                B.para([b(`¶${k + 1} `), t(`${p.topic} — ${p.notes.join("; ")}`)], { size: "sm" }),
              ),
              B.para([b("Conclusion: "), t(w.mpo.conclusion)]),
            ],
            { label: "Essay plan (grades 5-8)", icon: "pencil" },
          ),
        ]
      : []),
  ]);
  const answers = section([
    B.heading("Answer key", 1, { icon: "abc", tone: "Vocabulary" }),
    B.table(
      w.notes.map((n) => [{ runs: [t(n.sentence)] }, { runs: [b(n.note)] }]),
      { headers: ["Sentence", "Sample note"], widths: [62, 38], compact: true, tone: "Reading" },
    ),
    B.table(
      w.bbs.flatMap((x) =>
        CONJ.map(([c]) => [{ runs: [b(c)] }, { runs: [t(`${x.kernel} ${c} ${x[c]}`)] }]),
      ),
      { headers: ["", "Because · But · So"], widths: [12, 88], compact: true, tone: "Writing" },
    ),
    B.table(
      w.expand.map((e) => [{ runs: [b(e.kernel)] }, { runs: [t(e.model)] }]),
      { headers: ["Kernel", "Expanded"], widths: [26, 74], compact: true, tone: "Writing" },
    ),
    B.table(
      w.fragments.map((f) => [
        { runs: [t(f.text)] },
        { runs: [b(f.is_sentence ? "Sentence" : "Fragment")] },
        { runs: [t(f.fix || "—")] },
      ]),
      { headers: ["Item", "Answer", "Fix"], widths: [38, 16, 46], compact: true, tone: "Game" },
    ),
    B.table(
      w.appositives.map((a) => [{ runs: [t(a.model)] }]),
      { headers: ["Appositives"], compact: true, tone: "Vocabulary" },
    ),
    B.table(
      w.subordinate.map((s) => [{ runs: [b(s.conjunction)] }, { runs: [t(s.model)] }]),
      { headers: ["Clue word", "Model"], widths: [16, 84], compact: true, tone: "Speaking" },
    ),
    B.table(
      [
        ...w.spo.details.map((d) => [{ runs: [t(d.note)] }, { runs: [b("supports")] }]),
        ...w.spo.distractors.map((d) => [{ runs: [t(d)] }, { runs: [b("cross out")] }]),
      ],
      { headers: ["Note bank", ""], widths: [78, 22], compact: true, tone: "Writing" },
    ),
  ]);
  const rubric = section([
    B.heading("Rubric", 1, { icon: "star", tone: "Reading" }),
    B.table(
      RUBRIC.map(([k, ...cells]) => [
        { runs: [b(k)], tone: "Reading" },
        ...cells.map((c) => ({ runs: [t(c)] })),
      ]),
      {
        headers: ["", "1 · Starting", "2 · Getting there", "3 · Got it"],
        widths: [16, 28, 28, 28],
        tone: "Reading",
      },
    ),
    B.checklist(w.revise, {
      style: "box",
      label: "Unit-specific revision checks",
      tone: "Listening",
    }),
  ]);
  return newDoc(detail, { ...opts, answerKey: true }, [overview, models, answers, rubric], {
    titleSuffix: " · Writing Lab Teacher Guide",
    dense: true,
  });
}
