// Language Studio print: classroom kits built from the same studio content.
// parts: cards (vocabulary flashcards), bingo, wall (word-wall strips), poster (mentor-sentence anchor chart),
// strips (sentence frames by level), talk (conversation + talk-move cards).

import {
  B,
  b,
  DOMAINS,
  frameRuns,
  hashSeed,
  i,
  LEVEL_LABEL,
  newDoc,
  paginateCards,
  section,
  shuffled,
  t,
} from "./studio-doc.js";
import { mentorRuns } from "./studio-doc-book.js";

const LEVEL_TONE = { l1_2: "Vocabulary", l3_4: "Reading", l5_6: "Game" };
const tone = (k) => DOMAINS[k % DOMAINS.length];

function termIcon(v) {
  return v.icon ? { t: v.icon } : { icon: "abc", size: 30 };
}

// ---- vocabulary flashcards: 8 per Letter page, back pages mirrored for duplex printing ----------
function cardsSections(detail) {
  const vocab = detail.studio.vocab;
  const front = vocab.map((v, k) => ({
    tone: tone(k),
    center: true,
    blocks: [
      B.para([termIcon(v)], { size: "xl", align: "center" }),
      B.para([{ t: v.term, b: true }], { size: "xl2", align: "center" }),
      B.para([i(v.pos)], { size: "sm", align: "center" }),
    ],
  }));
  const back = vocab.map((v, k) => ({
    tone: tone(k),
    blocks: [
      B.para(
        [
          { t: v.term, b: true },
          { t: `  ${v.pos}`, i: true, small: true },
        ],
        { size: "sm" },
      ),
      B.para([t(v.def)], { size: "md" }),
      B.para([i(v.example)], { size: "sm" }),
      ...(v.es ? [B.para([{ t: "Español: ", b: true }, t(v.es)])] : []),
    ],
  }));
  const grid = { cols: 2, rows: 4 };
  const fp = paginateCards(front, grid);
  const bp = paginateCards(back, { ...grid, mirror: true });
  const out = [];
  fp.forEach((cardsF, n) => {
    out.push(
      section([
        B.cardGrid(cardsF, { cols: 2, rowH: 2.34 }),
        B.footerNote("Print double-sided (flip on long edge), then cut on the dashed lines."),
      ]),
    );
    out.push(section([B.cardGrid(bp[n], { cols: 2, rowH: 2.34 }), B.footerNote("Back of cards")]));
  });
  return out;
}

// ---- bingo ---------------------------------------------------------------------------------------
function boardWords(terms, board) {
  if (terms.length <= 8) return shuffled(terms, `bingo:${board}`).map((m) => m.v);
  return shuffled(terms, `bingo:${board}`)
    .map((m) => m.v)
    .slice(0, 8);
}

export function bingoBoards(terms, count = 6) {
  const boards = [];
  const seen = new Set();
  let salt = 0;
  while (boards.length < count && salt < 200) {
    const words = boardWords(terms, `${boards.length}:${salt++}`);
    const sig = words.join("|");
    if (seen.has(sig)) continue;
    seen.add(sig);
    boards.push(words);
  }
  return boards;
}

function bingoSections(detail) {
  const vocab = detail.studio.vocab;
  const byTerm = new Map(vocab.map((v) => [v.term, v]));
  const boards = bingoBoards(vocab.map((v) => v.term));
  const boardBlocks = boards.map((words, n) => {
    const cells = [...words.slice(0, 4), null, ...words.slice(4)].map((w, k) => {
      if (w === null)
        return {
          tone: "Game",
          center: true,
          vc: true,
          blocks: [
            B.para([{ icon: "star", size: 26 }], { align: "center" }),
            B.para([b("FREE")], { size: "bingo" }),
          ],
        };
      const v = byTerm.get(w);
      return {
        tone: tone(k),
        center: true,
        vc: true,
        blocks: [
          ...(v?.icon ? [B.para([{ t: v.icon }], { size: "lg", align: "center" })] : []),
          B.para([b(w)], { size: "bingo" }),
        ],
      };
    });
    return [
      B.heading(`Word Bingo · Board ${n + 1}`, 2, { icon: "game", tone: "Game" }),
      B.cardGrid(cells, { cols: 3, rowH: 1.22, cut: false }),
    ];
  });
  const out = [];
  for (let n = 0; n < boardBlocks.length; n += 2) {
    out.push(
      section(
        [
          ...boardBlocks[n],
          B.rule({ icon: "scissors", label: "Cut here" }),
          ...(boardBlocks[n + 1] || []),
        ],
        { tone: "Game" },
      ),
    );
  }
  const clue = new Map();
  for (const a of detail.studio.activities)
    if (a.kind === "clue_game") for (const c of a.payload.cards) clue.set(c.term, c.clues[1]);
  const rows = vocab.map((v, k) => [
    { t: String(k + 1), bold: true, align: "center" },
    clue.get(v.term) || v.def,
    { t: v.term, bold: true, tone: "Game" },
    { blocks: [B.boxRow(1, { size: "sm" })], align: "center" },
  ]);
  out.push(
    section(
      [
        B.heading("Call sheet", 1, { icon: "speech", tone: "Game" }),
        B.para([
          t(
            "Read a clue out loud. Players find the word on their board and cover it. First to cover a row shouts BINGO!",
          ),
        ]),
        B.table(rows, {
          headers: ["#", "Clue to read", "Word", "Called"],
          widths: [7, 58, 25, 10],
          zebra: true,
          tone: "Game",
        }),
      ],
      { tone: "Game" },
    ),
  );
  return out;
}

// ---- word wall (landscape strips) -----------------------------------------------------------------
function wallSections(detail) {
  const vocab = detail.studio.vocab;
  const strips = vocab.map((v, k) => ({
    tone: tone(k),
    vc: true,
    blocks: [
      B.columns(
        [
          [B.para([termIcon(v)], { size: "xl", align: "center" })],
          [
            B.para([{ t: v.term, b: true }], { size: "xxl" }),
            B.para([i(v.pos), t("  ·  "), t(v.def)], { size: "sm" }),
          ],
          [
            ...(v.es
              ? [
                  B.para([{ t: "Español", i: true, small: true }], { size: "sm" }),
                  B.para([{ t: v.es, b: true }], { size: "xl2" }),
                ]
              : []),
          ],
        ],
        { widths: [12, 58, 28], mid: true },
      ),
    ],
  }));
  const pages = [];
  for (let n = 0; n < strips.length; n += 3)
    pages.push(
      section([B.cardGrid(strips.slice(n, n + 3), { cols: 1, rowH: 2.32 })], {
        layout: "landscape",
      }),
    );
  return pages;
}

// ---- poster (landscape) ---------------------------------------------------------------------------
function posterSections(detail) {
  const s = detail.studio;
  const m = s.mentor;
  const legend = m.chunks.map((c, k) => ({
    tone: c.tone,
    blocks: [
      B.para([{ badge: k + 1 }, { t: `  ${c.role}`, b: true }], { size: "lg" }),
      B.para([i(c.ask)], { size: "md" }),
    ],
  }));
  return [
    section(
      [
        B.heading("A sentence to steal", 1, { icon: "pencil", tone: "Writing" }),
        B.para(mentorRuns(m, { numbered: true }), { size: "poster" }),
        B.cardGrid(legend, { cols: m.chunks.length, rowH: 1.55, cut: false }),
        B.callout("Reading", [B.para([t(m.gist)], { size: "lg" })], {
          label: "What it means",
          icon: "book",
        }),
        B.chips(s.connectors, { label: "Connecting words", tone: "Game" }),
      ],
      { layout: "landscape", tone: "Writing" },
    ),
  ];
}

// ---- sentence strips ------------------------------------------------------------------------------
function stripsSections(detail) {
  const s = detail.studio;
  const blocks = [B.heading("Sentence strips", 1, { icon: "pencil", tone: "Writing" })];
  for (const level of ["l1_2", "l3_4", "l5_6"]) {
    blocks.push(B.heading(LEVEL_LABEL[level], 3, { tone: LEVEL_TONE[level] }));
    blocks.push(
      B.cardGrid(
        s.frames[level].map((f) => ({
          tone: LEVEL_TONE[level],
          blocks: [B.para(frameRuns(f), { size: "md" })],
        })),
        { cols: 1, rowH: 0.7, bar: "left" },
      ),
    );
  }
  blocks.push(
    B.chips(s.connectors, { label: "Cut out the connecting words", cut: true, tone: "Game" }),
  );
  return [section(blocks, { tone: "Writing" })];
}

// ---- talk cards -----------------------------------------------------------------------------------
function talkSections(detail, opts) {
  const a = detail.studio.activities.find((x) => x.kind === "talk_cards");
  if (!a) throw new Error("this unit has no talk_cards activity");
  const p = a.payload;
  const label = (text) => B.para([{ t: text, b: true }], { size: "sm" });
  const cards = [
    {
      tone: "Speaking",
      center: true,
      blocks: [
        label("Partner A"),
        B.para([b(p.roles.a)], { size: "xl2", align: "center" }),
        B.para([i("Take turns. Switch roles after each card.")], { size: "sm", align: "center" }),
      ],
    },
    {
      tone: "Listening",
      center: true,
      blocks: [
        label("Partner B"),
        B.para([b(p.roles.b)], { size: "xl2", align: "center" }),
        B.para([i("Listen, then push your partner's thinking.")], { size: "sm", align: "center" }),
      ],
    },
    ...p.cards.map((c, k) => ({
      tone: tone(k + 2),
      blocks: [
        label(`Talk card ${k + 1}`),
        B.para([b(c.prompt)], { size: "lg" }),
        B.para([i("Start: "), t(c.starter)], { size: "sm" }),
        B.para([i("Then ask: "), t(c.follow_up)], { size: "sm" }),
      ],
    })),
    ...p.moves.map((m) => ({
      tone: "Game",
      blocks: [
        label("Talk move"),
        B.para([b(m.label)], { size: "xl2" }),
        B.para([t(m.stem)], { size: "md" }),
      ],
    })),
  ];
  return paginateCards(cards, { cols: 2, rows: 4 }).map((page) =>
    section([
      B.cardGrid(page, { cols: 2, rowH: 2.34 }),
      B.footerNote(`${opts.part} · cut on the dashed lines`),
    ]),
  );
}

export function buildKit(detail, opts) {
  const makers = {
    cards: cardsSections,
    bingo: bingoSections,
    wall: wallSections,
    poster: posterSections,
    strips: stripsSections,
    talk: talkSections,
  };
  const make = makers[opts.part];
  if (!make) throw new Error(`unknown kit part "${opts.part}"`);
  const sections = make(detail, opts);
  sections[0].pageBreakBefore = false;
  return newDoc(detail, opts, sections, { titleSuffix: ` · ${opts.part}` });
}
