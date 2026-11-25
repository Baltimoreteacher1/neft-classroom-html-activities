// Mixed-band class packets: paper-only print kits per unit, built from shared/packets/content.js specs.
//   kit-cards   vocabulary cards: word, picture-free definition, Spanish gloss (marked draft unless reviewed), cognate note
//   kit-frames  sentence-frame strips by band (strips carry only the opaque variant code)
//   kit-exit    exit-ticket sheet (two tickets) with the rubric row
//   kit-family  bilingual one-page family sheet
// Each kit is one flowing section with no page break, tight spacing, paper and pencil only, and no pictures.

import {
  cardsSpec,
  DRAFT_TRANSLATION,
  exitSpec,
  familySpec,
  isEarly,
  stripsSpec,
} from "../../../shared/packets/content.js";
import { frameAsSet, stackHeightIn } from "../../../shared/packets/fit.js";
import { B, b, frameRuns, i, newDoc, section, t } from "./studio-doc.js";

const gaps = (text) => frameRuns(String(text).replace(/___/g, "[…]"));
const TONES = ["neutral", "Listening"];

function wrapKit(unit, blocks, { kind, label, bodyClass = "" }) {
  const doc = newDoc({ unit }, { level: null }, [section(blocks, { pageBreakBefore: false })], {
    titleSuffix: ` · ${label}`,
    bodyClass,
  });
  doc.partLabel = label;
  doc.packet = { kind, code: null };
  return doc;
}

// Type sizes of the Studio sheet (studio-print-css.js): body 11pt, K-2 14pt; .p-lg 13.5pt; .p-sm 9.5pt, K-2 11.5pt.
const sizes = (unit) =>
  isEarly(unit) ? { body: 14, lh: 1.5, sm: 11.5 } : { body: 11, lh: 1.38, sm: 9.5 };
const CARD_PAD_IN = (34 + 6) / 72; // card padding, colour bar and a safety margin
const SAFETY_IN = 0.06;

const draftTag = { t: ` (${DRAFT_TRANSLATION})`, i: true, small: true };

function cardRowIn(unit, specs) {
  const z = sizes(unit);
  const width = 7.4 / 2 - 26 / 72;
  const tall = specs.map((c) => {
    const es = c.es
      ? [
          {
            text: `Español: ${c.es}${c.esDraft ? ` (${DRAFT_TRANSLATION})` : ""}`,
            pt: z.sm,
            lh: z.lh,
          },
        ]
      : [];
    const note = c.note ? [{ text: c.note, pt: z.sm, lh: z.lh }] : [];
    return stackHeightIn(
      [
        { text: `${c.term}  ${c.pos}`, pt: 13.5, lh: 1.5 },
        { text: c.def, pt: z.body, lh: z.lh },
        ...es,
        ...note,
      ],
      width,
    );
  });
  return Math.ceil((Math.max(...tall) + CARD_PAD_IN + SAFETY_IN) * 20) / 20;
}

export function buildCardsKit(unit, studio, opts = {}) {
  const specs = cardsSpec(studio, opts);
  const cards = specs.map((c, k) => ({
    tone: TONES[k % TONES.length],
    blocks: [
      B.para(
        [
          { t: c.term, b: true },
          { t: `  ${c.pos}`, i: true, small: true },
        ],
        { size: "lg" },
      ),
      B.para([t(c.def)]),
      ...(c.es
        ? [B.para([b("Español: "), t(c.es), ...(c.esDraft ? [draftTag] : [])], { size: "sm" })]
        : []),
      ...(c.note ? [B.para([i(c.note)], { size: "sm" })] : []),
    ],
  }));
  return wrapKit(
    unit,
    [
      B.heading("Vocabulary cards", 1, { icon: "abc", tone: "neutral" }),
      B.cardGrid(cards, { cols: 2, rowH: cardRowIn(unit, specs) }),
      B.footerNote("Cut on the dashed lines."),
    ],
    { kind: "kit-cards", label: "Vocabulary cards" },
  );
}

function stripRowIn(unit, s) {
  const z = sizes(unit);
  const width = (7.4 - 35 / 72) * 0.92;
  const tall = s.groups.flatMap((g) =>
    g.frames.map((f) =>
      stackHeightIn([{ text: frameAsSet(f, z.body), pt: z.body, lh: z.lh }], width),
    ),
  );
  // write-in blanks are inline-blocks and add a little to every line, hence the larger allowance
  return Math.ceil((Math.max(...tall) + 22 / 72 + 0.12) * 20) / 20;
}

export function buildFramesKit(unit, studio, codes) {
  const s = stripsSpec(unit, studio, codes);
  const strips = s.groups.flatMap((g, gi) =>
    g.frames.map((f) => ({
      tone: TONES[gi % TONES.length],
      vc: true,
      blocks: [
        B.columns(
          [[B.para(frameRuns(f))], [B.para([{ t: g.code, small: true }], { align: "center" })]],
          {
            widths: [92, 6],
            mid: true,
          },
        ),
      ],
    })),
  );
  return wrapKit(
    unit,
    [
      B.heading("Sentence frame strips", 1, { icon: "pencil", tone: "Listening" }),
      B.cardGrid(strips, { cols: 1, rowH: stripRowIn(unit, s), bar: "left" }),
      B.chips(s.connectors, { label: "Connecting words", tone: "neutral" }),
      B.footerNote(
        "Cut on the dashed lines. The code on each strip matches the teacher cover sheet.",
      ),
    ],
    { kind: "kit-frames", label: "Sentence frame strips" },
  );
}

function ticket(s) {
  return [
    B.heading("Exit ticket", 3, { icon: "speech", tone: "neutral" }),
    B.lines(1, { label: "Name" }),
    B.para([b(s.prompt)]),
    B.para([{ t: "Start with: ", b: true, small: true }, ...gaps(s.frame)], { size: "sm" }),
    B.lines(s.lines),
    B.table([s.rubric.map((r) => r.text)], {
      headers: s.rubric.map((r) => r.label),
      widths: [34, 33, 33],
      compact: true,
      tone: "neutral",
    }),
  ];
}

// Inches one exit ticket takes: fixed furniture (heading, name line, writing lines, rubric header) plus the wrapped text.
function ticketIn(s) {
  const fixed = (30 + 40 + s.lines * 21 + 24 + 20) / 72;
  const text = stackHeightIn(
    [
      { text: s.prompt, pt: 11.5, lh: 1.38 },
      { text: `Start with: ${frameAsSet(s.frame, 9.5)}`, pt: 9.5, lh: 1.38 },
    ],
    7.4,
  );
  const rubric = Math.max(
    ...s.rubric.map((r) =>
      stackHeightIn([{ text: r.text, pt: 10.5, lh: 1.38 }], 2.2, { gapPt: 10 }),
    ),
  );
  return fixed + text + rubric;
}
const PAGE_BODY_IN = 9.6;

export function buildExitKit(unit, studio) {
  const s = exitSpec(unit, studio);
  const two = !isEarly(unit) && 2 * ticketIn(s) + 0.4 <= PAGE_BODY_IN;
  return wrapKit(
    unit,
    // Two tickets to cut apart when they fit one sheet; K-2 writes larger and a long prompt needs the room, so those get one.
    two ? [...ticket(s), B.rule({ icon: "scissors", label: "Cut here" }), ...ticket(s)] : ticket(s),
    { kind: "kit-exit", label: "Exit tickets" },
  );
}

const bi = (en, es) => B.columns([en, es], { widths: [49, 49], rule: true });

export function buildFamilyKit(unit, studio, family, opts = {}) {
  const f = familySpec(unit, studio, family, opts);
  const rows = f.words.map((w) => [
    { runs: [b(w.term), t("  /  "), b(w.es || w.term)] },
    w.def,
    w.defEs,
  ]);
  const blocks = [
    B.heading(`Family sheet · Hoja para la familia`, 1),
    B.para([i(`${f.title} · ${f.subtitle}`)], { size: "sm" }),
    bi(
      [B.callout("neutral", [B.para([t(f.summary.en)])], { plain: true })],
      [B.callout("Listening", [B.para([t(f.summary.es)])], { plain: true })],
    ),
    B.table(
      f.talk.map((x, k) => [{ t: String(k + 1), bold: true, align: "center" }, x.en, x.es]),
      {
        headers: ["#", "Ask in any language", "Pregunten en cualquier idioma"],
        widths: [5, 47, 48],
        compact: true,
        tone: "Listening",
      },
    ),
    B.table(rows, {
      headers: ["Word · Palabra", "What it means", "Qué significa"],
      widths: [22, 39, 39],
      compact: true,
      tone: "neutral",
    }),
    bi(
      [B.para([b("Use your home language. "), t(f.homeLanguage.en)])],
      [B.para([b("Usen su idioma en casa. "), t(f.homeLanguage.es)])],
    ),
    ...(f.esDraft
      ? [
          B.footerNote(
            `Texto en español: ${DRAFT_TRANSLATION}, aún sin revisar. Spanish text: ${DRAFT_TRANSLATION}, not yet reviewed.`,
          ),
        ]
      : []),
  ];
  return wrapKit(unit, blocks, { kind: "kit-family", label: "Family sheet", bodyClass: "fam" });
}
