// Lesson Companion print: print twins + answer-key blocks for every activity kind a lesson can carry.
// The 14 unit kinds reuse studio-doc-activities.js (student page) and studio-doc-key.js (key); the 11 lesson
// kinds are rendered here. Everything is derived from the payload: nothing in an answer key is hand-typed.
//   printActivity(activity, ctx) -> { blocks, extra }   ctx = { level, early:false, answerKey:false }
//   keyBlocks(activity)          -> Block[]

import { B, b, frameRuns, i, shuffled, t } from "./studio-doc.js";
import { printable } from "./studio-doc-activities.js";
import { KEY } from "./studio-doc-key.js";

const TONES = ["Speaking", "Listening", "Reading", "Writing"];
const letter = (n) => String.fromCharCode(65 + n);
const num = (k) => ({ t: String(k + 1), bold: true, align: "center" });
const BOX = "☐";

// An icon is a single emoji (printed) or an id from the digital icon folder (not printable, so skipped).
const glyph = (icon) => (icon && /[^\x00-\x7F]/.test(icon) ? icon : "");
const gapped = (text) => frameRuns(String(text ?? "").replace(/___/g, "[…]"));
const tickCell = () => ({ blocks: [B.boxRow(1, { size: "sm" })], align: "center" });

export const CHUNK_TONE_LABEL = {
  concept: "big idea",
  connector: "joining word",
  evidence: "proof",
  precision: "exact words",
};

// Callout cards laid out in two balanced columns. Auto height, so long text never clips (unlike cut-out grids).
function cardColumns(cards) {
  if (cards.length < 2) return cards;
  const left = cards.filter((_, k) => k % 2 === 0);
  const right = cards.filter((_, k) => k % 2 === 1);
  return [B.columns([left, right], { widths: [48, 48] })];
}

function mcRows(items) {
  return items.map((it, k) => [
    num(k),
    { runs: [b(`${letter(it.answer)}. `), t(it.options[it.answer])] },
    { runs: [i(it.why)] },
  ]);
}

const mcTable = (items, tone) =>
  B.table(mcRows(items), {
    headers: ["#", "Answer", "Why"],
    widths: [6, 38, 56],
    compact: true,
    tone,
  });

// Same shuffle for the student page and the key, so "correct order: C, A, B" always matches the printed chips.
const xrayMix = (a) => shuffled(a.payload.chunks, `${a.title}:xray`);
const xrayOrder = (a) => {
  const mixed = xrayMix(a);
  return a.payload.chunks.map((_, j) => letter(mixed.findIndex((m) => m.idx === j)));
};

// Multiple choice with bubbles; two columns from 3 items so a whole check fits one page.
function mcBlocks(items, tone) {
  const cards = items.map((it, k) => [
    B.para([b(`${k + 1}. `), t(it.q)]),
    B.checklist(it.options, { style: "bubble", tone }),
    B.spacer(4),
  ]);
  if (cards.length < 3) return cards.flat();
  const half = Math.ceil(cards.length / 2);
  return [B.columns([cards.slice(0, half).flat(), cards.slice(half).flat()], { widths: [48, 48] })];
}

const PRINT = {
  flash_retrieval(a) {
    const cards = a.payload.cards.map((c, k) =>
      B.callout(
        TONES[k % 4],
        [
          B.para([t(`${glyph(c.icon)} `.trimStart()), b(c.prompt)], { size: "lg" }),
          B.lines(1, { label: "My answer" }),
          B.para([t(`${BOX} I knew it     ${BOX} Not yet`)]),
        ],
        { label: `Card ${k + 1}`, icon: "bulb" },
      ),
    );
    return {
      blocks: [
        ...cardColumns(cards),
        B.footerNote(
          "Say your answer, then check it with a partner or the answer key. “Not yet” just means this card comes back again.",
        ),
      ],
    };
  },

  listen_and_show(a) {
    const cards = a.payload.items.map((it, k) => [
      B.para(
        [
          b(`${k + 1}.  `),
          { icon: "ear", size: 20 },
          t("  Listen. Fill in the circle for what you heard."),
        ],
        {
          size: "lg",
        },
      ),
      B.checklist(
        it.options.map((o) => [t(`${glyph(o.icon)} `.trimStart()), b(o.label)]),
        { style: "bubble", tone: "Listening" },
      ),
      B.spacer(6),
    ]);
    const body =
      cards.length >= 4
        ? [
            B.columns(
              [
                cards.slice(0, Math.ceil(cards.length / 2)).flat(),
                cards.slice(Math.ceil(cards.length / 2)).flat(),
              ],
              { widths: [48, 48] },
            ),
          ]
        : cards.flat();
    return {
      blocks: [
        ...body,
        B.footerNote(
          "Your teacher reads each sentence aloud twice. The script is in the answer key.",
        ),
      ],
    };
  },

  sentence_xray(a) {
    const p = a.payload;
    const mixed = xrayMix(a);
    const jobs = shuffled([...new Set(p.chunks.map((c) => c.role))], `${a.title}:jobs`).map(
      (m) => m.v,
    );
    return {
      blocks: [
        B.chips(
          mixed.map((m, n) => ({ text: `${letter(n)}   ${m.v.text}`, tone: "Reading" })),
          { label: "Cut out the chunks. Build the sentence.", cut: true },
        ),
        B.lines(2, { label: "My sentence" }),
        B.heading("What job does each chunk do?", 3),
        B.chips(jobs, { label: "Jobs", tone: "Reading" }),
        B.table(
          mixed.map((m, n) => [{ t: letter(n), bold: true, align: "center" }, m.v.text, ""]),
          {
            headers: ["", "Chunk", "Its job"],
            widths: [8, 52, 40],
            compact: true,
            tone: "Reading",
            sheet: true,
          },
        ),
        B.para([b("Think: "), t(p.ask)]),
        B.lines(1),
      ],
    };
  },

  speak_and_record(a, ctx) {
    const p = a.payload;
    return {
      blocks: [
        B.callout("Speaking", [B.para([b(p.prompt)], { size: "lg" })], {
          label: "Say it",
          icon: "speech",
        }),
        B.callout("neutral", [B.para(gapped(p.frame), { size: "lg" })], {
          label: "Sentence frame",
          plain: true,
        }),
        B.lines(ctx.level === "l1_2" ? 2 : 3, { label: "My notes (words or pictures)" }),
        B.heading("Partner check", 3),
        B.checklist(p.checklist, { tone: "Speaking" }),
      ],
    };
  },

  exit_check(a) {
    const p = a.payload;
    return {
      blocks: [
        ...mcBlocks(p.items, a.domain),
        B.heading("How well can I do it?", 3),
        B.para([b("I can: "), t(p.can_do)], { size: "lg" }),
        B.table([[tickCell(), tickCell(), tickCell()]], {
          headers: ["With help", "By myself", "And I can teach it"],
          widths: [33, 33, 34],
          tone: "Vocabulary",
        }),
      ],
    };
  },

  point_and_say(a) {
    const cards = a.payload.items.map((it, k) =>
      B.callout(
        TONES[k % 4],
        [
          B.columns(
            [
              [
                B.para([glyph(it.icon) ? t(glyph(it.icon)) : { icon: "star", size: 44 }], {
                  size: "xxl",
                }),
              ],
              [
                B.para([b(it.term)], { size: "xl2" }),
                ...(it.es ? [B.para([i(it.es)], { size: "lg" })] : []),
              ],
            ],
            { widths: [30, 66] },
          ),
          B.para([t(it.cue)], { size: "sm" }),
          B.para([t(`${BOX} I pointed     ${BOX} I said it`)]),
        ],
        { label: `Word ${k + 1}`, icon: "speech" },
      ),
    );
    return {
      blocks: [
        ...cardColumns(cards),
        B.footerNote(
          "No reading needed. Look at the picture, point, then say the word with your partner.",
        ),
      ],
    };
  },

  tpr_cards(a) {
    const cards = a.payload.items.map((it, k) => ({
      tone: TONES[k % 4],
      center: true,
      blocks: [
        B.para([glyph(it.icon) ? t(glyph(it.icon)) : { icon: "star", size: 40 }], {
          size: "xl2",
          align: "center",
        }),
        B.para([b(it.command)], { size: "lg", align: "center" }),
      ],
    }));
    return {
      blocks: [
        B.cardGrid(cards, { cols: 2, rowH: 1.5 }),
        B.footerNote("Cut out the cards. Listen to the command, then do the action."),
      ],
    };
  },

  home_language_bridge(a) {
    return {
      blocks: [
        B.table(
          a.payload.items.map((it) => [
            { runs: [b(it.term)] },
            { runs: [i(it.es || "")] },
            "",
            { t: `${BOX} yes    ${BOX} no` },
          ]),
          {
            headers: ["English", "Español", "My home language", "Sound alike?"],
            widths: [24, 24, 32, 20],
            tone: "Vocabulary",
            sheet: true,
          },
        ),
        B.footerNote(
          "Say each word in English and in your home language. Write your word, or draw a picture.",
        ),
      ],
    };
  },

  cognate_detective(a) {
    return {
      blocks: [
        B.callout(
          "Reading",
          [
            B.para([b("True cognate: "), t("looks alike and means the same.")]),
            B.para([b("False friend: "), t("looks alike but means something different.")]),
            B.para([b("No look-alike: "), t("the two words look different.")]),
          ],
          { label: "Detective guide", icon: "book" },
        ),
        B.table(
          a.payload.items.map((it) => [
            { runs: [b(it.term), t("   /   "), t(it.es)] },
            tickCell(),
            tickCell(),
            tickCell(),
          ]),
          {
            headers: ["English / Español", "True cognate", "False friend", "No look-alike"],
            widths: [37, 21, 21, 21],
            tone: "Reading",
          },
        ),
      ],
    };
  },

  morph_lab(a) {
    const blocks = [];
    a.payload.items.forEach((it, k) => {
      blocks.push(
        B.chips(
          shuffled(it.parts, `${a.title}:${k}`).map((m) => m.v),
          {
            label: `${k + 1}. Cut out the parts and build the word`,
            cut: true,
            tone: "Vocabulary",
          },
        ),
        B.columns([[B.lines(1, { label: "My word" })], [B.lines(1, { label: "What it means" })]], {
          widths: [40, 56],
        }),
      );
    });
    return { blocks };
  },

  paragraph_builder(a, ctx) {
    const p = a.payload;
    const tones = ["Reading", "Vocabulary", "Writing", "Game", "Speaking"];
    return {
      blocks: [
        B.callout(
          "Writing",
          [B.para([b(`${p.klu} paragraph.`), t(" Fill each box, then write it all together.")])],
          {
            label: "Your goal",
            icon: "pencil",
          },
        ),
        ...p.slots.map((s, k) =>
          B.callout(
            tones[k % 5],
            [B.para(gapped(s.frame), { size: "sm" }), B.lines(p.slots.length >= 3 ? 1 : 2)],
            {
              label: `${k + 1}. ${s.label}`,
            },
          ),
        ),
        B.chips(p.connectors, { label: "Joining words", tone: "Game" }),
        B.heading("Put it together", 3),
        B.lines(ctx.level === "l1_2" ? 3 : p.slots.length >= 3 ? 4 : 5),
        B.columns(
          [
            [B.checklist(p.checklist.slice(0, 2), { tone: "Writing" })],
            [B.checklist(p.checklist.slice(2), { tone: "Writing" })],
          ],
          { widths: [48, 48] },
        ),
      ],
    };
  },

  mission_escape(a) {
    const p = a.payload;
    const cert = p.certificate;
    const lockBlocks = mcBlocks(
      p.locks.map((lk) => ({
        q: `${lk.title}: ${lk.q}`,
        options: lk.options.map((o) => (typeof o === "string" ? o : o.label)),
      })),
      "Game",
    );
    const certBlock = [
      B.hero({
        compact: true,
        tone: "Game",
        kicker: `Printable certificate · ${cert.badge}`,
        title: cert.title,
        subtitle: "Awarded for unlocking every unit language lock.",
      }),
      B.callout(
        "Game",
        [
          B.para([b("Presented to:  "), t("________________________________________")], {
            size: "lg",
          }),
          B.para([b("Badge earned:  "), t(cert.badge)]),
          B.heading("What I can do now", 3),
          B.checklist(cert.can_do, { style: "box", tone: "Game" }),
          B.para([
            b("Date:  "),
            t("____________________      "),
            b("Teacher:  "),
            t("__________________________"),
          ]),
        ],
        { label: "Certificate of Achievement", icon: "star" },
      ),
    ];
    return {
      blocks: [
        B.callout(
          "Game",
          [
            B.para([
              b("Unit Finale: "),
              t(
                `Solve all ${p.locks.length} locks from the unit lessons to earn your ${cert.badge} certificate.`,
              ),
            ]),
          ],
          { label: "Escape Mission", icon: "game" },
        ),
        ...lockBlocks,
      ],
      extra: [certBlock],
    };
  },
};

const KEYS = {
  flash_retrieval: (p) => [
    B.table(
      p.cards.map((c, k) => [num(k), c.prompt, { t: c.answer, bold: true }]),
      {
        headers: ["#", "Prompt", "Answer"],
        widths: [6, 62, 32],
        compact: true,
        tone: "Vocabulary",
      },
    ),
  ],
  listen_and_show: (p) => [
    B.table(
      p.items.map((it, k) => [
        num(k),
        { runs: [i(it.say)] },
        { runs: [b(`${letter(it.answer)}. `), t(it.options[it.answer].label)] },
        it.why,
      ]),
      {
        headers: ["#", "Read aloud", "Answer", "Why"],
        widths: [5, 34, 21, 40],
        compact: true,
        tone: "Listening",
      },
    ),
  ],
  sentence_xray: (p, a) => {
    const order = xrayOrder(a);
    return [
      B.para([b("Correct order of the chunks: "), t(order.join(" → "))]),
      B.table(
        p.chunks.map((c, k) => [
          num(k),
          { t: c.text },
          { runs: [b(c.role), i(`  (${CHUNK_TONE_LABEL[c.tone] || c.tone})`)] },
        ]),
        { headers: ["#", "Chunk", "Its job"], widths: [6, 56, 38], compact: true, tone: "Reading" },
      ),
      B.para([b("Think: "), t(p.ask)], { size: "sm" }),
    ];
  },
  speak_and_record: (p) => [
    B.para([b("Model: "), t(p.model)]),
    B.checklist(p.checklist, { tone: "Speaking" }),
  ],
  exit_check: (p) => [
    mcTable(p.items, "Vocabulary"),
    B.para([b("Can-do: "), t(p.can_do)], { size: "sm" }),
    B.para(
      [
        t(
          "Students rate themselves: with help, by myself, or and I can teach it. Meet “with help” students in small group.",
        ),
      ],
      { size: "sm" },
    ),
  ],
  point_and_say: (p) => [
    B.table(
      p.items.map((it, k) => [num(k), { t: it.term, bold: true }, it.say, it.es || "", it.cue]),
      {
        headers: ["#", "Word", "Say", "Español", "Picture"],
        widths: [5, 17, 36, 14, 28],
        compact: true,
        tone: "Vocabulary",
      },
    ),
  ],
  tpr_cards: (p) => [
    B.table(
      p.items.map((it, k) => [num(k), it.command]),
      {
        headers: ["#", "Students do the action"],
        widths: [6, 94],
        compact: true,
        tone: "Listening",
      },
    ),
  ],
  home_language_bridge: (p) => [
    B.table(
      p.items.map((it) => [{ t: it.term, bold: true }, it.es || "", { runs: [i(it.note)] }]),
      {
        headers: ["Word", "Español", "Note"],
        widths: [20, 20, 60],
        compact: true,
        tone: "Vocabulary",
      },
    ),
  ],
  cognate_detective: (p) => {
    const LABEL = { true: "True cognate", false_friend: "False friend", none: "No look-alike" };
    return [
      B.table(
        p.items.map((it) => [
          { runs: [b(it.term), t(` / ${it.es}`)] },
          { t: LABEL[it.status] || it.status, bold: true },
          it.why || "",
        ]),
        {
          headers: ["Pair", "Answer", "Why"],
          widths: [30, 22, 48],
          compact: true,
          tone: "Reading",
        },
      ),
    ];
  },
  morph_lab: (p) => [
    B.table(
      p.items.map((it) => [{ t: it.word, bold: true }, it.parts.join(" + "), it.meaning]),
      {
        headers: ["Word", "Parts", "Meaning"],
        widths: [24, 30, 46],
        compact: true,
        tone: "Vocabulary",
      },
    ),
  ],
  paragraph_builder: (p) => [
    B.para([b(`Model ${p.klu} paragraph: `), t(p.model)]),
    B.checklist(p.checklist, { tone: "Writing" }),
  ],
  mission_escape: (p) => [
    B.table(
      p.locks.map((lk, k) => [
        num(k),
        { t: lk.title, bold: true },
        {
          runs: [
            b(`${letter(lk.answer)}. `),
            t(
              typeof lk.options[lk.answer] === "string"
                ? lk.options[lk.answer]
                : lk.options[lk.answer].label,
            ),
          ],
        },
        { runs: [i(lk.why)] },
      ]),
      {
        headers: ["#", "Lock", "Answer", "Why"],
        widths: [5, 23, 30, 42],
        compact: true,
        tone: "Game",
      },
    ),
    B.para(
      [
        b("Vault code: "),
        t(p.locks.map((lk, k) => lk.code || `${letter(lk.answer)}${k + 1}`).join(" - ")),
      ],
      { size: "sm" },
    ),
  ],
};

export const NEW_KINDS = Object.keys(PRINT);

export function printActivity(activity, ctx) {
  const own = PRINT[activity.kind];
  if (own) return { extra: [], ...own(activity, ctx) };
  return printable(activity, ctx);
}

export function keyBlocks(activity) {
  const fn = KEYS[activity.kind] || KEY[activity.kind];
  if (!fn) throw new Error(`lesson-doc: no answer key for kind "${activity.kind}"`);
  return fn(activity.payload, activity);
}
