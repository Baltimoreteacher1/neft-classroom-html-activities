// Language Studio print: the printable version of each activity kind (student page, or answer-filled with answerKey:true).
// printable(activity, ctx) -> { blocks, extra: [Block[]] }  `extra` are follow-on pages (e.g. the partner-puzzle record sheet).

import { connectorMeaning as sharedMeaning } from "../../../shared/bcpss/connector-meanings.js";
import { B, b, frameRuns, HIGHLIGHT_ORDER, hl, i, shuffled, t } from "./studio-doc.js";

// TWR connector meanings: one shared table with the player (shared/bcpss/connector-meanings.js).
export const connectorMeaning = (c) => sharedMeaning(c, "print");

const CAT_TONES = ["Reading", "Speaking", "Vocabulary"];

// Splits text into runs, highlighting exact-substring targets (answer key for read_annotate).
export function markRuns(text, marks, show) {
  if (!show) return [t(text)];
  const hits = [];
  marks.forEach((m, mi) => {
    for (const target of m.targets) {
      const at = text.indexOf(target);
      if (at >= 0)
        hits.push({
          at,
          end: at + target.length,
          tone: HIGHLIGHT_ORDER[mi % HIGHLIGHT_ORDER.length],
        });
    }
  });
  hits.sort((x, y) => x.at - y.at);
  const out = [];
  let pos = 0;
  for (const h of hits) {
    if (h.at < pos) continue;
    if (h.at > pos) out.push(t(text.slice(pos, h.at)));
    out.push(hl(text.slice(h.at, h.end), h.tone));
    pos = h.end;
  }
  if (pos < text.length) out.push(t(text.slice(pos)));
  return out;
}

function clozeRuns(text, answers, key) {
  const out = [];
  String(text)
    .split(/(\{\d+\})/)
    .forEach((part) => {
      const m = part.match(/^\{(\d+)\}$/);
      if (m) out.push({ blank: Number(m[1]), fill: key ? answers[Number(m[1]) - 1] : "" });
      else if (part) out.push(t(part));
    });
  return out;
}

// Multiple-choice block list: question + bubble options. Two columns when there are many items.
function mcItems(items, ctx, { tone, prefix = "", wrongLabel = "", twoCol = 4 } = {}) {
  const cards = items.map((it, k) => {
    const q = it.q ?? it.wrong;
    const head = wrongLabel
      ? B.callout("Speaking", [B.para([b(`${k + 1}. `), t(q)])], {
          label: wrongLabel,
          icon: "pencil",
        })
      : B.para([b(`${k + 1}. `), t(`${prefix}${q}`)]);
    const notes = ctx.answerKey
      ? it.options.map((_, n) => (n === it.answer ? it.why : ""))
      : undefined;
    return [
      head,
      B.checklist(it.options, {
        style: "bubble",
        tone,
        mark: ctx.answerKey ? it.answer : undefined,
        notes,
      }),
      B.spacer(4),
    ];
  });
  if (cards.length < twoCol) return cards.flat();
  const half = Math.ceil(cards.length / 2);
  return [B.columns([cards.slice(0, half).flat(), cards.slice(half).flat()], { widths: [48, 48] })];
}

const PRINTERS = {
  match(a, ctx) {
    const { pairs, left_label: ll, right_label: rl } = a.payload;
    const mixed = shuffled(
      pairs.map((p) => p.r),
      `${a.title}:match`,
    );
    const answers = pairs.map((_, k) => mixed.findIndex((m) => m.idx === k));
    return {
      blocks: [
        B.matchColumns({
          leftLabel: ll,
          rightLabel: rl,
          left: pairs.map((p) => p.l),
          right: mixed.map((m) => m.v),
          answers: ctx.answerKey ? answers : undefined,
        }),
        B.footerNote("Draw a line from each dot to its match."),
      ],
    };
  },

  word_sort(a, ctx) {
    const { categories: cats, items } = a.payload;
    const mixed = shuffled(items, `${a.title}:sort`).map((m) => m.v);
    const per = cats.map((_, c) => items.filter((x) => x.cat === c).map((x) => x.text));
    const rows =
      Math.max(...per.map((p) => p.length), Math.ceil(items.length / cats.length)) +
      (ctx.answerKey ? 0 : 1);
    const body = Array.from({ length: rows }, (_, r) =>
      cats.map((_, c) =>
        ctx.answerKey
          ? {
              runs: [{ t: per[c][r] || "", fill: "x" }],
              tone: per[c][r] ? CAT_TONES[c] : undefined,
            }
          : "",
      ),
    );
    return {
      blocks: [
        B.table(body, {
          headers: cats.map((c) => c.name),
          widths: cats.map(() => 100 / cats.length),
          tone: "Vocabulary",
          sheet: true,
        }),
        B.chips(
          mixed.map((m) => m.text),
          { label: "Cut out the words. Sort them!", cut: true },
        ),
      ],
    };
  },

  clue_game(a, ctx) {
    const cards = a.payload.cards.map((c, k) => ({
      tone: ["Game", "Listening", "Speaking", "Writing"][k % 4],
      blocks: [
        B.para([b(`Mystery word ${k + 1}`)], { size: "sm" }),
        ...c.clues.map((cl, n) => B.para([{ t: `${n + 1}  `, b: true }, t(cl)])),
        B.lines(1, { label: "My guess", fill: ctx.answerKey ? [c.term] : undefined }),
      ],
    }));
    const bank = shuffled(
      a.payload.cards.map((c) => c.term),
      `${a.title}:bank`,
    ).map((m) => m.v);
    return {
      blocks: [
        B.cardGrid(cards, { cols: 2, rowH: ctx.early ? 1.78 : 1.48, cut: false }),
        B.chips(bank, { label: "Word bank", tone: "Game" }),
      ],
    };
  },

  cloze(a, ctx) {
    const p = a.payload;
    return {
      blocks: [
        B.callout(
          "Reading",
          [B.para(clozeRuns(p.text, p.answers, ctx.answerKey), { size: "lg" })],
          { plain: true },
        ),
        B.chips(
          shuffled(p.bank, `${a.title}:bank`).map((m) => m.v),
          { label: "Word bank", tone: "Reading" },
        ),
      ],
    };
  },

  unscramble(a, ctx) {
    // Workbook page: lettered cut-apart chunk strip, an order row (Starter: first letter given; Core: empty boxes),
    // then a write-on sentence strip with capital / end-mark cues. The key fills the order and the sentence.
    const level = ctx.level || "l3_4";
    const blocks = [
      B.para(
        [b("How to build: "), t("Cut apart the chunks. Put them in order. Write the sentence.")],
        { size: "sm" },
      ),
    ];
    a.payload.items.forEach((it, k) => {
      const mixed = shuffled(it.parts, `${a.title}:${k}`);
      const letterOf = (idx) => String.fromCharCode(65 + mixed.findIndex((m) => m.idx === idx));
      const order = it.parts.map((_, idx) => letterOf(idx));
      const sentence = it.parts.join(" ");
      blocks.push(
        B.chips(
          mixed.map((m, n) => `(${String.fromCharCode(65 + n)}) ${m.v}`),
          { label: `Sentence ${k + 1} · cut apart`, cut: true, tone: "Game" },
        ),
      );
      if (ctx.answerKey || level !== "l5_6")
        blocks.push(
          B.boxRow(it.parts.length, {
            label: level === "l1_2" && !ctx.answerKey ? "Order (first one done)" : "Order",
            values: ctx.answerKey ? order : level === "l1_2" ? [order[0]] : [],
            size: "sm",
          }),
        );
      blocks.push(
        B.lines(sentence.length > 70 ? 2 : 1, {
          label: "Aa  Capital letter first … end mark last  . ? !",
          fill: ctx.answerKey ? [sentence] : undefined,
        }),
      );
    });
    return { blocks };
  },

  sequence(a, ctx) {
    const { steps, signals, title } = a.payload;
    const mixed = shuffled(steps, `${a.title}:seq`);
    const rows = mixed.map((m) => [
      {
        blocks: [B.boxRow(1, { values: ctx.answerKey ? [String(m.idx + 1)] : [] })],
        align: "center",
      },
      m.v,
    ]);
    const blocks = [
      B.heading(title, 3),
      B.table(rows, { widths: [12, 88], tone: "Writing", compact: true }),
      B.chips(signals, { label: "Signal words", tone: "Writing" }),
    ];
    if (ctx.level !== "l1_2")
      blocks.push(
        B.lines(3, {
          label: "Now tell it in your own words",
          fill: ctx.answerKey
            ? [steps.map((s, n) => `${signals[n] || ""} ${s}`.trim()).join(" ")]
            : undefined,
        }),
      );
    return { blocks };
  },

  quiz: (a, ctx) => ({ blocks: mcItems(a.payload.items, ctx, { tone: a.domain }) }),
  error_analysis: (a, ctx) => ({
    blocks: mcItems(a.payload.items, ctx, {
      tone: "Speaking",
      wrongLabel: "Oops! Find the mistake",
    }),
  }),

  dictogloss(a, ctx) {
    const p = a.payload;
    const rebuild = ctx.level === "l1_2" ? 3 : 5;
    const blocks = [
      B.callout(
        "Listening",
        [B.para([b("Listen twice. "), t("Write only the key words you hear.")])],
        { label: "Listen", icon: "ear" },
      ),
      B.chips(p.key_words, { label: "Key words to listen for", tone: "Listening" }),
      B.callout("neutral", [B.lines(rebuild)], { label: "My notes", plain: true }),
      B.heading("Rebuild the story", 3),
      B.para(frameRuns(p.frame.replace(/___/g, "[…]")), { size: "sm" }),
      B.lines(rebuild, { fill: ctx.answerKey ? [p.text] : undefined }),
      B.checklist(p.checks, { label: "Check", tone: "Listening" }),
    ];
    if (ctx.answerKey)
      blocks.unshift(
        B.callout("Listening", [B.para([t(p.text)])], { label: "Read-aloud text", icon: "ear" }),
      );
    return { blocks };
  },

  // Listening Lab (derived listen-and-choose / listen-and-sort): a partner or the teacher reads each item aloud,
  // or the student uses the on-screen player. The read-aloud script is in the answer key.
  listen_and_show(a, ctx) {
    const p = a.payload;
    const sort = p.mode === "sort";
    const items = p.items.map((it) => ({
      q: `Listen. ${sort ? "Fill in the circle for the group." : "Fill in the circle for the word."}`,
      options: it.options.map((o) => o.label),
      answer: it.answer,
      why: it.why,
    }));
    const note = a.derived?.notice ? [B.footerNote(a.derived.notice)] : [];
    return {
      blocks: [
        ...mcItems(items, ctx, { tone: "Listening" }),
        B.footerNote(
          "A partner or your teacher reads each one aloud twice. The script is in the answer key.",
        ),
        ...note,
      ],
    };
  },

  info_gap(a, ctx) {
    const p = a.payload;
    const card = (side, tone) =>
      B.callout(
        tone,
        [
          B.table(
            side.has.map((h) => [{ t: h.k, bold: true }, h.v]),
            { headers: ["I know", ""], widths: [50, 50], compact: true, tone },
          ),
          B.para([b("I need to find out:")]),
          B.checklist(side.needs, { style: "box", tone }),
        ],
        { label: `${side.title} · secret card`, icon: "people" },
      );
    const allNeeds = [...p.a.needs, ...p.b.needs];
    const value = (k) => [...p.a.has, ...p.b.has].find((h) => h.k === k)?.v || "";
    const record = [
      B.heading("Detective record", 2),
      B.para([t(p.goal)]),
      B.table(
        allNeeds.map((k) => [
          { t: k, bold: true },
          ctx.answerKey ? { runs: [{ t: value(k), fill: "x" }], tone: "Speaking" } : "",
        ]),
        { headers: ["Fact", "What we found"], widths: [45, 55], sheet: true, tone: "Speaking" },
      ),
      B.columns(
        [
          [
            B.callout(
              "Speaking",
              p.ask_frames.map((f) => B.para(frameRuns(f.replace(/___/g, "[…]")))),
              { label: "Ask", icon: "speech" },
            ),
          ],
          [
            B.callout(
              "Listening",
              p.tell_frames.map((f) => B.para(frameRuns(f.replace(/___/g, "[…]")))),
              { label: "Tell", icon: "ear" },
            ),
          ],
        ],
        { widths: [48, 48] },
      ),
    ];
    return {
      blocks: [
        B.para([i("Cut apart. Keep your card secret. Ask questions to fill in your record.")], {
          size: "sm",
        }),
        card(p.a, "Speaking"),
        B.rule({ icon: "scissors", label: "Cut here" }),
        card(p.b, "Listening"),
      ],
      extra: [record],
    };
  },

  talk_cards(a) {
    const p = a.payload;
    const cards = p.cards.map((c, k) => ({
      tone: ["Speaking", "Listening", "Reading", "Writing"][k % 4],
      blocks: [
        B.para([b(`Card ${k + 1}`)], { size: "sm" }),
        B.para([b(c.prompt)]),
        B.para([i("Start: "), t(c.starter)], { size: "sm" }),
        B.para([i("Then ask: "), t(c.follow_up)], { size: "sm" }),
      ],
    }));
    return {
      blocks: [
        B.chips(
          [
            { text: `Partner A: ${p.roles.a}`, tone: "Speaking" },
            { text: `Partner B: ${p.roles.b}`, tone: "Listening" },
          ],
          { label: "Pick your role" },
        ),
        B.cardGrid(cards, { cols: 2, rowH: ctx_talkRow(p.cards.length) }),
        B.table(
          p.moves.map((m) => [{ t: m.label, bold: true, tone: "Game" }, m.stem]),
          {
            headers: ["Talk move", "Say it like this"],
            widths: [26, 74],
            compact: true,
            tone: "Game",
          },
        ),
      ],
    };
  },

  read_annotate(a, ctx) {
    const p = a.payload;
    const key = p.marks.map((m, k) => ({
      text: `${m.label}: ${m.instruction}`,
      tone: HIGHLIGHT_ORDER[k % 4],
      sol: true,
    }));
    const left = [B.para(markRuns(p.text, p.marks, ctx.answerKey), { size: "lg" })];
    const right = [
      B.callout("neutral", [B.lines(ctx.early ? 3 : 5)], { label: "My notes", plain: true }),
    ];
    return {
      blocks: [
        B.chips(key, { label: "Mark key", tone: "Reading" }),
        B.columns([left, right], { widths: [66, 30] }),
        B.heading("Show what you know", 3),
        ...mcItems(p.questions, ctx, { tone: "Reading", twoCol: 3 }),
      ],
    };
  },

  sentence_combine(a, ctx) {
    // Workbook page: a connector-meaning mini key, then per item the kernel sentence cards, the connector chip with
    // its meaning, and write-on lines. The key pre-writes the model.
    const items = a.payload.items;
    const seen = [...new Set(items.map((it) => it.connector.toLowerCase()))].filter(
      connectorMeaning,
    );
    const blocks = [];
    if (seen.length)
      blocks.push(
        B.table(
          seen.map((c) => [{ t: c, bold: true }, connectorMeaning(c)]),
          {
            headers: ["Connector", "What it tells the reader"],
            widths: [24, 76],
            compact: true,
            tone: "Game",
          },
        ),
      );
    items.forEach((it, k) => {
      const mean = connectorMeaning(it.connector);
      blocks.push(
        B.callout(
          "Writing",
          [
            B.columns(
              [
                it.sentences.map((s, n) => B.para([b(`${n + 1}  `), t(s)])),
                [
                  B.chips([{ text: it.connector, tone: "Game", sol: true }], {
                    label: "Join with",
                  }),
                  ...(mean ? [B.para([i(mean)], { size: "sm" })] : []),
                ],
              ],
              { widths: [66, 30] },
            ),
            B.lines(2, {
              label: "Write one sentence. Capital letter first, end mark last.",
              fill: ctx.answerKey ? [it.model] : undefined,
            }),
          ],
          { label: `Sentence ${k + 1}` },
        ),
      );
    });
    return { blocks };
  },

  write_scaffold(a, ctx) {
    const p = a.payload;
    const tones = ["Reading", "Vocabulary", "Writing", "Game", "Speaking"];
    const lineN = ctx.level === "l1_2" ? 1 : 2;
    const parts = p.structure.map((s, k) =>
      B.callout(
        tones[k % 5],
        [B.para(frameRuns(s.frame.replace(/___/g, "[…]")), { size: "sm" }), B.lines(lineN)],
        { label: s.part },
      ),
    );
    const blocks = [
      B.callout("Writing", [B.para([b(p.prompt)])], { label: "Your challenge", icon: "pencil" }),
      ...parts,
      B.chips(p.word_bank, { label: "Word bank", tone: "Writing" }),
      B.columns(
        [
          [B.checklist(p.checklist.slice(0, 2), { tone: "Writing" })],
          [B.checklist(p.checklist.slice(2), { tone: "Writing" })],
        ],
        { widths: [48, 48] },
      ),
    ];
    if (ctx.answerKey)
      blocks.unshift(
        B.callout("Vocabulary", [B.para([t(p.model)])], { label: "Model response", icon: "star" }),
      );
    return { blocks };
  },
};

function ctx_talkRow(n) {
  return n > 6 ? 1.35 : 1.6;
}

export function printable(activity, ctx) {
  const fn = PRINTERS[activity.kind];
  if (!fn) throw new Error(`studio-print: no printable for kind "${activity.kind}"`);
  const out = fn(activity, ctx);
  return { blocks: out.blocks, extra: out.extra || [] };
}
