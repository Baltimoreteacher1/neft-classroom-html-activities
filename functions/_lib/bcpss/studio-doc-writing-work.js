// Language Studio print: WRITING LAB — "My finished work". The student's own answers from the Lab (see writing-work.js)
// laid out as one document through the same document model as every other part, so HTML/PDF and Word share it.
// Prompts come from detail.writing (never from the browser); only what the student wrote is printed.

import { B, b, gradeLabel, i, LEVEL_LABEL, newDoc, section, subjectTone, t } from "./studio-doc.js";
import { CONJ, GENRE, LEVEL_NAME, RUBRIC } from "./studio-doc-writing.js";

const ASK = {
  who: "Who?",
  what: "What?",
  when: "When?",
  where: "Where?",
  why: "Why?",
  how: "How?",
};
const RATING = ["Starting", "Getting there", "Got it"];

const text = (v) => (typeof v === "string" ? v.trim() : "");
const cap = (s) => (s ? `${s[0].toUpperCase()}${s.slice(1)}` : s);
/** Paragraph blocks, one per line the student typed. */
const paras = (v, extra) =>
  text(v)
    .split(/\n+/)
    .filter(Boolean)
    .map((p) => B.para([t(p)], extra));

function notesRows(w, work) {
  return w.notes.flatMap((n, k) => {
    const ans = text(work.notes?.[`t${k}`]) || text(work.notes?.[`p${k}`]);
    return ans ? [[{ runs: [b(`${k + 1}. `), t(n.sentence)] }, { runs: [t(ans)] }]] : [];
  });
}

function bbsRows(w, work, level) {
  const sec = work.bbs || {};
  return w.bbs.flatMap((x, k) => {
    const done = [];
    for (const [c] of CONJ) {
      if (level === "l1_2") {
        if (sec[`m${k}`]?.[c]) done.push(`${x.kernel} ${c} ${x[c]}`);
      } else if (text(sec[`${k}${c}`])) {
        done.push(
          level === "l5_6" ? text(sec[`${k}${c}`]) : `${x.kernel} ${c} ${text(sec[`${k}${c}`])}`,
        );
      }
    }
    return done.length
      ? [[{ runs: [b(`${k + 1}. ${x.kernel} …`)] }, { blocks: done.map((d) => B.para([t(d)])) }]]
      : [];
  });
}

function expandRows(w, work) {
  const sec = work.expand || {};
  return w.expand.flatMap((e, k) => {
    const parts = Object.keys(e.parts)
      .filter((q) => text(sec[`${k}${q}`]))
      .map((q) => B.para([b(`${ASK[q] || q} `), t(text(sec[`${k}${q}`]))], { size: "sm" }));
    const sentence = text(sec[`s${k}`]);
    if (!sentence && !parts.length) return [];
    return [
      [
        { runs: [b(`${k + 1}. `), t(e.kernel)] },
        { blocks: [...(sentence ? [B.para([t(sentence)])] : []), ...parts] },
      ],
    ];
  });
}

function fragRows(w, work) {
  const sec = work.frag || {};
  return w.fragments.flatMap((f, k) => {
    const pick = text(sec[`a${k}`]);
    const fix = text(sec[`f${k}`]);
    if (!pick && !fix) return [];
    const label = pick === "S" ? "Sentence" : pick === "F" ? "Fragment" : "";
    return [
      [
        { runs: [b(`${k + 1}. `), t(f.text)] },
        { blocks: [...(label ? [B.para([b(label)], { size: "sm" })] : []), ...paras(fix)] },
      ],
    ];
  });
}

function apposRows(w, work, level) {
  const sec = work.appos || {};
  return w.appositives.flatMap((a, k) => {
    const picked = text(sec[`p${k}`]);
    const own = text(sec[`o${k}`]);
    const lines = [
      ...(picked ? [a.sentence.replace("___", picked)] : []),
      ...(own ? [level === "l5_6" ? own : `${a.noun}, ${own}`] : []),
    ];
    return lines.length
      ? [
          [
            { runs: [b(`${k + 1}. `), t(a.sentence.replace("___", "…"))] },
            { blocks: lines.map((l) => B.para([t(l)])) },
          ],
        ]
      : [];
  });
}

function subRows(w, work, level) {
  const sec = work.sub || {};
  return w.subordinate.flatMap((s, k) => {
    const typed = text(sec[`t${k}`]);
    if (!typed) return [];
    const whole = level === "l5_6" ? typed : `${cap(s.conjunction)} ${typed}, ${s.stem}.`;
    return [[{ runs: [b(`${k + 1}. ${cap(s.conjunction)} …, ${s.stem}.`)] }, { runs: [t(whole)] }]];
  });
}

function practiceBlocks(w, work, level) {
  const groups = [
    ["Read & take notes", ["Sentence", "My note"], notesRows(w, work)],
    ["Because · But · So", ["Start", "My sentences"], bbsRows(w, work, level)],
    ["Stretch a sentence", ["Kernel", "My longer sentence"], expandRows(w, work)],
    ["Sentence or fragment?", ["Item", "My answer"], fragRows(w, work)],
    ["Add an appositive", ["Sentence", "My sentence"], apposRows(w, work, level)],
    ["Start with a clue word", ["Starter", "My sentence"], subRows(w, work, level)],
  ];
  return groups
    .filter(([, , rows]) => rows.length)
    .flatMap(([title, headers, rows]) => [
      B.heading(title, 2, { icon: "pencil", tone: "Writing" }),
      B.table(rows, { headers, widths: [42, 58], compact: true, tone: "Writing" }),
    ]);
}

function planBlocks(w, work, level) {
  const s = work.spo || {};
  const details = [
    ...(Array.isArray(s.picked) ? s.picked : []),
    ...text(s.own)
      .split("\n")
      .map((x) => x.trim()),
  ]
    .filter(Boolean)
    .map((d) => [{ runs: [b("–")], align: "center" }, { runs: [t(d)] }]);
  if (!text(s.ts) && !details.length && !text(s.cs)) return [];
  const frame = (label, v) => [{ runs: [b(label)], tone: "Reading" }, { blocks: paras(v) }];
  return [
    B.heading("My plan", 2, { icon: "pencil", tone: "Writing" }),
    B.callout("Writing", [B.para([i(w.prompt[level])], { size: "sm" })], {
      label: "Task",
      icon: "pencil",
    }),
    B.table(
      [
        ...(text(s.ts) ? [frame("T.S.", s.ts)] : []),
        ...details,
        ...(text(s.cs) ? [frame("C.S.", s.cs)] : []),
      ],
      { headers: ["", "Single-paragraph outline"], widths: [10, 90], tone: "Writing" },
    ),
  ];
}

function essayBlocks(w, work) {
  const m = work.mpo || {};
  const bodies = (w.mpo?.paragraphs || []).flatMap((_, k) =>
    text(m[`p${k}`])
      ? [B.callout("neutral", paras(m[`p${k}`]), { label: `Body paragraph ${k + 1}`, plain: true })]
      : [],
  );
  if (!text(m.thesis) && !bodies.length && !text(m.conclusion)) return [];
  return [
    B.heading("My essay plan", 2, { icon: "star", tone: "Reading" }),
    ...(text(m.thesis) ? [B.para([b("Thesis: ")]), ...paras(m.thesis)] : []),
    ...bodies,
    ...(text(m.conclusion) ? [B.para([b("Conclusion: ")]), ...paras(m.conclusion)] : []),
  ];
}

function checkBlocks(work) {
  const done = Array.isArray(work.revise?.done) ? work.revise.done : [];
  const rating = RUBRIC.map(([k], n) => ({
    k,
    n,
    v: Number(work.revise?.[["ideas", "sentences", "words"][n]]),
  }));
  const rated = rating.filter((r) => r.v >= 1 && r.v <= 3);
  if (!done.length && !rated.length) return [];
  return [
    B.heading("My self-check", 2, { icon: "star", tone: "Listening" }),
    ...(done.length
      ? [
          B.checklist(
            done.map((d) => `${d}`),
            { style: "box", tone: "Listening" },
          ),
        ]
      : []),
    ...(rated.length
      ? [
          B.table(
            rated.map((r) => [{ runs: [b(r.k)], tone: "Reading" }, { runs: [t(RATING[r.v - 1])] }]),
            {
              headers: ["", "How I rated my writing"],
              widths: [30, 70],
              compact: true,
              tone: "Reading",
            },
          ),
        ]
      : []),
  ];
}

export function buildWritingWork(detail, opts) {
  const w = detail?.writing;
  if (!w) throw new Error("writing lab not authored for this unit");
  const work = opts.work || {};
  const level = opts.level;
  const u = detail.unit;
  const name = text(work.pub?.name);
  const draft = paras(work.draft?.text, { size: "lg" });
  // "writing-published": the finished piece alone, laid out like the Lab's published page (wl-coach-ui.js
  // publishedPiece): kicker, title, byline, the paragraph, then unit, length and the task in small type.
  if (opts.published) {
    const words = text(work.draft?.text).split(/\s+/).filter(Boolean).length;
    const piece = [
      B.hero({
        tone: subjectTone(u.subject),
        kicker: `${GENRE[w.genre]} writing · ${u.subject} · ${gradeLabel(u)}`,
        title: w.title,
        subtitle: name ? `by ${name}` : "",
        chips: [],
        nameDate: !name,
      }),
      ...(draft.length ? draft : [B.lines(10, { label: "Write your paragraph" })]),
      B.para([i(`${u.unit_title} · ${words} words · ${LEVEL_NAME[level]} level`)], { size: "sm" }),
      B.para([b("Task: "), t(w.prompt[level])], { size: "sm" }),
    ];
    return newDoc(detail, opts, [section(piece, { tone: "Writing" })], {
      titleSuffix: " · Published",
    });
  }
  const blocks = [
    B.hero({
      tone: subjectTone(u.subject),
      kicker: `Writing Lab · ${u.unit_title}`,
      title: w.title,
      subtitle: w.prompt[level],
      chips: [
        gradeLabel(u),
        u.subject,
        `${GENRE[w.genre]} writing`,
        `${LEVEL_NAME[level]} · ${LEVEL_LABEL[level]}`,
      ],
      nameDate: !name,
    }),
    ...(name ? [B.para([b("Name: "), t(name)])] : []),
    B.heading("My paragraph", 1, { icon: "pencil", tone: "Writing" }),
    ...(draft.length ? draft : [B.lines(8, { label: "Write your paragraph" })]),
  ];
  const extras = [
    ...planBlocks(w, work, level),
    ...practiceBlocks(w, work, level),
    ...essayBlocks(w, work),
    ...checkBlocks(work),
  ];
  const sections = [section(blocks, { tone: "Writing" })];
  if (extras.length) sections.push(section(extras, { tone: "Writing" }));
  return newDoc(detail, opts, sections, { titleSuffix: " · My Writing" });
}
