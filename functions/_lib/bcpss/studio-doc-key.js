// Language Studio print: teacher ANSWER KEY (part "key"). Every answer, model response and the one-line tip per activity,
// then the exit-ticket model and 3-level rubric. Compact cards that flow over 2-4 pages.

import { B, b, HIGHLIGHT_ORDER, i, newDoc, section, shuffled, t } from "./studio-doc.js";
import { connectorMeaning, markRuns } from "./studio-doc-activities.js";
import { EXIT_RUBRIC_LABELS } from "./studio-doc-book.js";

const letter = (n) => String.fromCharCode(65 + n);
const num = (k) => ({ t: String(k + 1), bold: true, align: "center" });

function mcTable(items, tone) {
  return B.table(
    items.map((it, k) => [
      num(k),
      { runs: [b(`${letter(it.answer)}. `), t(it.options[it.answer])] },
      { runs: [i(it.why)] },
    ]),
    { headers: ["#", "Answer", "Why"], widths: [5, 40, 55], compact: true, tone },
  );
}

function clozeFilled(text, answers) {
  return String(text)
    .split(/(\{\d+\})/)
    .map((part) => {
      const m = part.match(/^\{(\d+)\}$/);
      return m ? { t: answers[Number(m[1]) - 1], b: true, hl: "mint" } : t(part);
    });
}

export const KEY = {
  match: (p) => [
    B.table(
      p.pairs.map((x, k) => [num(k), { t: x.l, bold: true }, x.r]),
      {
        headers: ["#", p.left_label, p.right_label],
        widths: [5, 28, 67],
        compact: true,
        tone: "Vocabulary",
      },
    ),
  ],
  word_sort: (p) => [
    B.table(
      [
        p.categories.map((_c, ci) => ({
          runs: [
            t(
              p.items
                .filter((x) => x.cat === ci)
                .map((x) => x.text)
                .join(", "),
            ),
          ],
        })),
      ],
      {
        headers: p.categories.map((c) => c.name),
        widths: p.categories.map(() => 100 / p.categories.length),
        compact: true,
        tone: "Vocabulary",
      },
    ),
  ],
  clue_game: (p) => [
    B.table([[{ runs: [t(p.cards.map((c, k) => `${k + 1}. ${c.term}`).join("   "))] }]], {
      headers: ["Mystery words, in card order"],
      compact: true,
      tone: "Game",
    }),
  ],
  cloze: (p) => [
    B.para(clozeFilled(p.text, p.answers)),
    B.para(
      [i(`Extra words (not used): ${p.bank.filter((w) => !p.answers.includes(w)).join(", ")}`)],
      { size: "sm" },
    ),
  ],
  unscramble: (p, a) => [
    B.table(
      p.items.map((it, k) => {
        const mixed = shuffled(it.parts, `${a.title}:${k}`);
        const order = it.parts.map((_, idx) => letter(mixed.findIndex((m) => m.idx === idx)));
        return [num(k), { t: order.join(" "), bold: true }, it.parts.join(" ")];
      }),
      {
        headers: ["#", "Order", "Correct sentence"],
        widths: [5, 17, 78],
        compact: true,
        tone: "Game",
      },
    ),
  ],
  sequence: (p) => [
    B.table(
      p.steps.map((s, k) => [num(k), s, p.signals[k] || ""]),
      { headers: ["Order", "Step", "Signal"], widths: [8, 72, 20], compact: true, tone: "Writing" },
    ),
  ],
  quiz: (p, a) => [mcTable(p.items, a.domain)],
  error_analysis: (p) => [mcTable(p.items, "Writing")],
  dictogloss: (p) => [
    B.callout("Listening", [B.para([t(p.text)])], { label: "Read-aloud text", icon: "ear" }),
    B.table(
      p.checks.map((c) => [{ t: "✓", align: "center" }, c]),
      {
        headers: ["", "The retelling should include"],
        widths: [5, 95],
        compact: true,
        tone: "Listening",
      },
    ),
  ],
  info_gap: (p) => {
    const all = [...p.a.has, ...p.b.has];
    const val = (k) => all.find((h) => h.k === k)?.v || "";
    return [
      B.table(
        [...p.a.needs, ...p.b.needs].map((k) => [{ t: k, bold: true }, val(k)]),
        { headers: ["Fact", "Answer"], widths: [45, 55], compact: true, tone: "Speaking" },
      ),
    ];
  },
  talk_cards: (p) => [
    B.para(
      [
        i("Answers vary. Listen for the starter, a reason, and a follow-up question. Sample: "),
        t(`${p.cards[0].starter.replace(/___/g, "…")}`),
      ],
      { size: "sm" },
    ),
  ],
  read_annotate: (p) => [
    B.para(markRuns(p.text, p.marks, true), { size: "sm" }),
    B.chips(
      p.marks.map((m, k) => ({ text: m.label, tone: HIGHLIGHT_ORDER[k % 4], sol: true })),
      { label: "Mark key" },
    ),
    mcTable(p.questions, "Reading"),
  ],
  sentence_combine: (p) => [
    B.table(
      p.items.map((it, k) => [
        num(k),
        { t: it.connector, bold: true },
        connectorMeaning(it.connector),
        it.model,
      ]),
      {
        headers: ["#", "Connector", "Meaning", "Model sentence"],
        widths: [5, 13, 24, 58],
        compact: true,
        tone: "Writing",
      },
    ),
    B.para(
      [
        i(
          "Accept any one sentence that uses the connector, keeps every idea, and has a capital letter and end mark.",
        ),
      ],
      { size: "sm" },
    ),
  ],
  write_scaffold: (p) => [B.para([t(p.model)], { size: "sm" })],
};

export function buildKey(detail, opts) {
  const s = detail.studio;
  const cards = s.activities.map((a, k) =>
    B.callout(
      a.domain,
      [...KEY[a.kind](a.payload, a), B.para([b("Tip: "), t(a.tip)], { size: "sm" })],
      { label: `${k + 1} · ${a.title}`, icon: undefined },
    ),
  );
  const e = s.exit_ticket;
  const exit = [
    B.heading("Exit ticket", 2, { icon: "pencil", tone: "Writing" }),
    B.callout(
      "Writing",
      [B.para([b(e.prompt)], { size: "sm" }), B.para([i("Model: "), t(e.model)], { size: "sm" })],
      { label: "Model response" },
    ),
    B.table([Object.keys(EXIT_RUBRIC_LABELS).map((k) => e.rubric[k])], {
      headers: Object.values(EXIT_RUBRIC_LABELS),
      widths: [34, 33, 33],
      tone: "Vocabulary",
      compact: true,
    }),
  ];
  const sections = [
    section([
      B.heading("Answer key", 1, { icon: "check", tone: "Vocabulary" }),
      B.para([i(`${detail.unit.unit_title} · every answer, model response and tip`)], {
        size: "sm",
      }),
      ...cards,
      ...exit,
    ]),
  ];
  sections[0].pageBreakBefore = false;
  return newDoc(detail, opts, sections, { dense: true, titleSuffix: " · Answer key" });
}
