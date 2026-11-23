// A Resource Remix draft (core/remix.js) as a printable document. The teacher's own words are carried over exactly.
// Definitions appear only for cards the teacher confirmed; nothing is added that the draft does not hold.
import { TIERS } from "../../data/taxonomy.js";
import { B, finalize, page, section } from "../../print/ir.js";

const TIER_LABEL = Object.fromEntries(TIERS.map((t) => [t.id, t.label]));

const top = (title, direction) => [
  B.namebar(["Name", "Date"]),
  B.title(title),
  direction ? B.p(direction, "direction") : null,
];

function vocabCards(d) {
  const cards = d.cards.filter((c) => c.confirmed && c.def.trim());
  if (!cards.length)
    return { error: "Confirm at least one definition in Remix before making vocabulary cards." };
  const items = cards.map((c) => ({
    head: c.word,
    headSize: "l",
    body: c.def,
    visual: c.visual || null,
    foot: c.contextSentence ? `In the text: ${c.contextSentence}` : "",
    lines: c.visual ? 0 : 1,
  }));
  const pages = [];
  for (let i = 0; i < items.length; i += 6)
    pages.push(
      page([
        B.p("Cut on the dashed lines.", "quiet"),
        B.cards({ cols: 2, rows: 3, hMm: 78, items: items.slice(i, i + 6) }),
      ]),
    );
  return { title: "Vocabulary cards", pages };
}

function evidence(d) {
  const used = d.evidence.filter((e) => e.use && e.supports);
  const claims = d.claims.filter((c) => c.text.trim());
  if (!claims.length || !used.length)
    return { error: "Add a claim and match at least one sentence to it in Remix first." };
  const rows = claims.map((c) => [
    { t: c.text, kind: "label" },
    {
      t:
        used
          .filter((e) => e.supports === c.id)
          .map((e) => `"${e.text}"`)
          .join("\n") || "",
      h: 4,
    },
    { t: "", h: 4 },
  ]);
  return {
    title: d.question || "Text to evidence",
    pages: [
      page([
        ...top(
          d.question || "Text to evidence",
          "Read the evidence. Say how it supports each claim.",
        ),
        B.table({
          cols: [2, 3, 3],
          head: ["Claim", "Evidence from the text", "My reasoning"],
          rows,
        }),
      ]),
    ],
  };
}

function exitTicket(d) {
  if (!d.prompt.trim()) return { error: "Write the task in Remix before making an exit ticket." };
  const frames = Object.entries(d.frames).map(([t, f]) => B.frames([f], TIER_LABEL[t]));
  return {
    title: "Exit ticket",
    pages: [
      page([
        ...top("Exit ticket", d.objective),
        B.p(d.prompt, "lead"),
        d.itemText ? B.p(d.itemText) : null,
        B.box(6, "My answer"),
        ...frames,
        B.h("I know I can if", 3),
        B.check(d.criteria),
      ]),
    ],
  };
}

function discussion(d) {
  const frames = Object.entries(d.frames).map(([t, f]) => B.frames(f, TIER_LABEL[t]));
  return {
    title: "Academic discussion",
    pages: [
      page([
        ...top("Academic discussion", d.structure),
        B.p(d.question, "lead"),
        B.h("Roles", 3),
        B.list(d.roles),
        d.listenFor.length ? B.bank(d.listenFor, "Listen for") : null,
        B.h("Sentence frames", 3),
        ...frames,
      ]),
    ],
  };
}

function languageObjective(d) {
  return {
    title: "Language objective ideas",
    pages: [
      page([
        B.title("Language objective ideas", d.klu ? `Closest WIDA Key Language Use: ${d.klu}` : ""),
        B.p(d.source, "lead"),
        B.list(d.suggestions),
        d.note ? B.p(d.note, "quiet") : null,
      ]),
    ],
  };
}

const BUILDERS = {
  "vocab-cards": vocabCards,
  evidence,
  "exit-ticket": exitTicket,
  discussion,
  "language-objective": languageObjective,
};

/** { doc } or { error } for a remix draft. `grade` and `subject` are the teacher's choices. */
export function remixDocument(
  draft,
  { grade = "6", subject = "interdisciplinary", band = "6-8" } = {},
) {
  const build = BUILDERS[draft?.type];
  if (!build) return { error: "That draft is not one the Resource Studio can print." };
  const r = build(draft);
  if (r.error) return r;
  const notes = [
    B.title("Teacher notes", r.title),
    B.p(
      "This resource was made from text and objectives you supplied. You are responsible for having the right to use them.",
    ),
    B.p("Teacher review recommended before classroom use."),
  ];
  const doc = {
    v: 1,
    template: `remix-${draft.type}`,
    title: r.title,
    format: { size: "letter", orientation: "portrait" },
    meta: {
      band,
      grade,
      subject,
      tiers: ["ee", "dev", "exp", "br"],
      vis: "full",
      lang: "en",
      standards: [],
      lessonId: null,
      vocabId: null,
      shortTitle: r.title,
      sourceLine:
        "Teacher review recommended. Source: Teacher-supplied text, remixed in the Resource Studio.",
      review: "authored",
    },
    sections: [section("student", r.pages), section("notes", [page(notes)])],
    seq: 0,
  };
  return { doc: finalize(doc) };
}
