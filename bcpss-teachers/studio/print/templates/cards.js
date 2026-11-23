// Cut-apart and station families: vocabulary cards, illustrated mats, sort/match, task cards, discussion cards, gallery walk.
import { shuffle } from "../../core/dom.js";
import { B, BLOCK_GAP_MM, ROW_PAD_MM, cardGrid, chunk, estLines, label, lineMmOf, organizerPages, page, supportBlocks, supportMm, tierLabel, top, topMm, wordsOf, keyPages, TIER_SUPPORT, framesFor } from "./kit.js";

const ratio = (spec) => (spec?.w || 480) / (spec?.h || 320);
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

function vocabCard(ctx, e, g, per) {
  const pt = ctx.style.bodyPt;
  const headScale = ctx.k2 ? 1.9 : per <= 6 ? 1.4 : 1.1;
  let h = g.ch - 9 - lineMmOf(pt * headScale) - 2;
  const card = { head: e.word, headSize: ctx.k2 ? "xl" : per <= 6 ? "l" : "m" };
  const spec = ctx.pic(e.visual);
  const textW = g.cw - 8;
  const need = (t) => estLines(t, textW, pt) * lineMmOf(pt) + 2;
  const texts = [];
  if (ctx.k2) {
    const short = [e.def, e.context].find((t) => t && words(t) <= 12);
    if (short) texts.push(short);
  } else {
    if (e.def) texts.push(e.def);
    if (e.context && per <= 6) texts.push(e.context);
    if (e.sentence && per <= 4) texts.push(e.sentence);
  }
  const es = ctx.bilingual && e.es ? `${e.es.word}${e.es.def && !ctx.k2 ? `: ${e.es.def}` : ""}` : "";
  if (es) texts.push(es);
  if (ctx.k2 && e.pron) texts.push(`Say it: ${e.pron}`);
  // Keep the text that fits, always the first (definition) before extras.
  const kept = [];
  let used = 0;
  const reserveMin = spec ? 24 : 0;
  for (const t of texts) {
    const hh = need(t);
    if (h - used - hh >= reserveMin || (kept.length === 0 && !spec)) {
      kept.push(t);
      used += hh;
    }
  }
  h -= used;
  if (spec) {
    const maxH = Math.min(h - 1, ctx.k2 ? 70 : 52);
    const wMm = Math.max(18, Math.min(textW, maxH * ratio(spec)));
    card.visual = spec;
    card.visualMm = Math.floor(wMm);
  } else if (ctx.k2 && ctx.vis === "full") {
    card.drawMm = Math.max(18, Math.min(Math.floor(h - 2), 40));
  }
  card.body = kept[0] || "";
  card.foot = kept.slice(1).join("  |  ");
  return card;
}

const vocabCards = {
  id: "vocab-cards",
  family: "Vocabulary",
  label: "Visual vocabulary cards (cut-apart)",
  blurb: "Cut-apart cards: picture, word and meaning. K-2 is picture-first with a drawing space; grades 6-8 add an example sentence.",
  bands: ["k-2", "3-5", "6-8"],
  needs: "entries",
  options: [{ id: "perPage", label: "Cards per page", choices: [{ v: "4", label: "4 per page" }, { v: "6", label: "6 per page" }, { v: "8", label: "8 per page" }], default: { "k-2": "4", "3-5": "6", "6-8": "8" } }],
  notes: {
    purpose: "A word-wall and partner-practice card set. Each card carries the picture, the word and a student-friendly meaning.",
    prep: ["Print single-sided on cardstock.", "Cut on the dashed lines.", "Laminate if the set will be reused."],
    use: ["Partner match: one student reads the picture, the other says the word.", "Sort the cards by part of speech or by how well you know the word.", "Students add an example on the back."],
  },
  build(ctx) {
    ctx.need("entries");
    const per = Number(ctx.opts.perPage) || { "k-2": 4, "3-5": 6, "6-8": 8 }[ctx.band];
    const g = cardGrid(ctx, per);
    const cards = ctx.entries.map((e) => vocabCard(ctx, e, g, per));
    return { pages: chunk(cards, per).map((set) => page([B.p("Cut on the dashed lines.", "quiet"), B.cards({ cols: g.cols, rows: g.rows, hMm: g.ch, items: set })])) };
  },
};

const vocabMat = {
  id: "vocab-mat",
  family: "Vocabulary",
  label: "Illustrated vocabulary mat",
  blurb: "A page for each few words: picture, say-it line, meaning and a place for the student's own sentence or drawing.",
  bands: ["k-2", "3-5", "6-8"],
  needs: "entries",
  options: [],
  notes: {
    purpose: "A reference-and-practice mat students keep in a folder or notebook while they learn the words.",
    prep: ["Print one copy per student.", "Hole-punch for a vocabulary folder."],
    use: ["Introduce each word with the picture before reading the meaning.", "Students say the word, then write or draw their own use of it."],
  },
  build(ctx) {
    ctx.need("entries");
    const pt = ctx.style.bodyPt;
    const head = ctx.k2 ? ["See it", "Say it", "Draw it or use it"] : ctx.band === "3-5" ? ["Word", "What it means", "My sentence"] : ["Word", "Picture", "Meaning", "Example", "My own sentence"];
    const cols = ctx.k2 ? [1.3, 1.3, 1.7] : ctx.band === "3-5" ? [1.4, 1.8, 2] : [1.1, 1.2, 1.6, 1.6, 1.8];
    const colW = cols.map((c) => (c / cols.reduce((a, x) => a + x, 0)) * ctx.bodyW - 5);
    const picBase = ctx.k2 ? 50 : ctx.band === "3-5" ? 34 : 38;
    const textMm = (t, ci) => (t ? estLines(t, colW[ci], pt) * lineMmOf(pt) : 0);
    const minRow = ctx.k2 ? 40 : 30;
    const avail = ctx.bodyH - topMm(ctx) - 2 * BLOCK_GAP_MM - (lineMmOf(pt) + ROW_PAD_MM + 2) - 5;
    const maxPer = ctx.k2 ? 3 : 4;
    // Row content, estimated height and the picture size that fits it.
    const plan = ctx.entries.map((e) => {
      const spec = ctx.pic(e.visual);
      const word = e.word + (ctx.bilingual && e.es ? `  /  ${e.es.word}` : "");
      const meaning = ctx.k2 ? "" : `${e.def}${ctx.bilingual && e.es?.def ? `\n${e.es.def}` : ""}`;
      const example = [e.context, e.nonExample && `Not: ${e.nonExample}`].filter(Boolean).join("  ");
      const picCol = ctx.k2 ? 0 : ctx.band === "3-5" ? 0 : 1;
      const picH = spec ? Math.min(picBase, colW[picCol]) / ratio(spec) : 0;
      const need = ctx.k2 ? picH : ctx.band === "3-5" ? Math.max(picH + lineMmOf(pt) * estLines(word, colW[0], pt), textMm(meaning, 1)) : Math.max(textMm(word, 0), picH, textMm(meaning, 2), textMm(example, 3));
      return { e, spec, word, meaning, example, rowMm: Math.max(minRow, Math.ceil(need + 3)) };
    });
    const sets = [];
    let cur = [];
    let used = 0;
    for (const r of plan) {
      const h = r.rowMm + ROW_PAD_MM;
      if (cur.length && (cur.length >= maxPer || used + h > avail)) {
        sets.push(cur);
        cur = [];
        used = 0;
      }
      cur.push(r);
      used += h;
    }
    if (cur.length) sets.push(cur);
    const pages = sets.map((set, pi) => {
      const slack = Math.max(0, Math.floor((avail - set.reduce((a, r) => a + r.rowMm + ROW_PAD_MM, 0)) / set.length));
      const rows = set.map((r) => {
        const rowMm = r.rowMm + Math.min(slack, 30);
        const h = Math.max(1, (rowMm - 3) / ctx.style.lineMm);
        const visualMm = (base) => (r.spec ? Math.floor(Math.min(base, (rowMm - 3) * ratio(r.spec))) : 0);
        const wordCell = { t: r.word, kind: "label" };
        if (ctx.k2) return [{ t: "", visual: r.spec, visualMm: visualMm(picBase), h }, wordCell, { t: "" }];
        if (ctx.band === "3-5") return [{ ...wordCell, visual: r.spec, visualMm: visualMm(picBase), h }, { t: r.meaning }, { t: "" }];
        return [wordCell, { t: "", visual: r.spec, visualMm: visualMm(picBase), h }, { t: r.meaning }, { t: r.example }, { t: "" }];
      });
      return page([...top(ctx, ctx.title ? `${ctx.title}: word mat` : "Word mat", ctx.k2 ? "Look. Say the word. Draw or tell about it." : "Read each word and its picture. Then write your own sentence.", `Mat ${pi + 1}`), B.table({ cols, head, rows })]);
    });
    return { pages };
  },
};

const sortMatch = {
  id: "sort-match",
  family: "Cut-outs",
  label: "Matching and sorting cut-outs",
  blurb: "A match mat plus cut-apart tiles. K-2 matches pictures to words; grades 3-8 match words to meanings.",
  bands: ["k-2", "3-5", "6-8"],
  needs: "entries",
  options: [],
  keyed: true,
  notes: {
    purpose: "A hands-on matching task that builds the link between a word and its meaning without recopying.",
    prep: ["Print the tile pages and cut the tiles apart.", "Put each set of tiles in an envelope."],
    use: ["Partners lay the tiles out, match each pair and say a sentence about it.", "Students glue the matches onto the mat after you check them."],
  },
  build(ctx) {
    ctx.need("entries");
    const pairs = ctx.entries.filter((e) => (ctx.k2 ? e.visual || e.def : e.def)).slice(0, 12);
    if (pairs.length < 2) ctx.need("entries", "Matching needs at least two words with meanings.");
    const pictured = (e) => ctx.k2 && ctx.pic(e.visual);
    const letter = (i) => String.fromCharCode(65 + i);
    const left = (e, i) => (pictured(e) ? { visual: ctx.pic(e.visual), visualMm: 32 } : { head: e.def || e.word, headSize: "m" });
    const right = (e) => ({ head: ctx.bilingual && e.es ? `${e.word} / ${e.es.word}` : e.word, headSize: ctx.k2 ? "l" : "m" });
    const per = ctx.k2 ? 8 : 6;
    const g = cardGrid(ctx, per);
    // Meaning (or picture) tiles carry a letter; the key names the word and its letter, so the answers never appear on the student pages.
    const tiles = shuffle([...pairs.map((e, i) => ({ ...left(e, i), tag: letter(i) })), ...pairs.map((e) => right(e))], ctx.title || "sort");
    const boxMm = ctx.k2 ? 38 : 26;
    const rowsPer = Math.max(2, Math.min(6, Math.floor((ctx.bodyH - topMm(ctx) - 2 * BLOCK_GAP_MM - 16 - 5) / (boxMm + ROW_PAD_MM))));
    const mat = chunk(pairs, rowsPer).map((set, i) =>
      page([...top(ctx, "Match mat", "Match each tile to its partner. Glue them in the boxes after your teacher checks.", `Mat ${i + 1}`), B.table({ cols: [1, 1], head: [ctx.k2 ? "Picture" : "Meaning", "Word"], rows: set.map(() => [{ t: "", h: boxMm / ctx.style.lineMm }, { t: "", h: boxMm / ctx.style.lineMm }]) })]),
    );
    const tilePages = chunk(tiles, per).map((set) => page([B.p("Cut on the dashed lines.", "quiet"), B.cards({ cols: g.cols, rows: g.rows, hMm: g.ch, items: set })]));
    const key = keyPages(ctx, "matching", pairs.map((e, i) => [{ t: e.word, kind: "label" }, { t: `${pictured(e) ? "Picture" : "Meaning"} tile ${letter(i)}` }]), [], { head: ["Word", "Matches"], cols: [2, 2] });
    return { pages: [...mat, ...tilePages], key };
  },
};

function taskPrompt(it, ctx) {
  const opts = it.choices.length ? `\n${it.choices.map((c, i) => `${"ABCD"[i]}. ${c}`).join("   ")}` : "";
  return `${it.prompt}${opts}`;
}

/** Recording sheet that never overflows: rows are split across pages by estimated height; the support blocks follow the last rows, or get a page of their own. */
function recordPages(ctx, items, tier) {
  const lineMm = ctx.style.lineMm;
  const rowMm = 2 * lineMm + 8;
  const headMm = 12;
  const topH = topMm(ctx);
  const support = supportBlocks(ctx, tier, { bankWords: wordsOf(ctx) });
  const supportH = supportMm(ctx, support);
  const cap = Math.max(1, Math.floor((ctx.bodyH - topH - headMm) / rowMm));
  const parts = chunk(items.map((_, i) => i), cap);
  const rowsFor = (idx) => B.table({ cols: [0.7, 2.6, 2.6], head: ["Card", "My answer", "How I know"], rows: idx.map((i) => [{ t: String(i + 1), kind: "label" }, { t: "", h: 2 }, { t: "", h: 2 }]) });
  const direction = "Write the card number and your answer. Explain one answer to a partner.";
  const pagesOut = parts.map((idx, n) => page([...top(ctx, "Task card recording sheet", direction, parts.length > 1 ? `Part ${n + 1} of ${parts.length}` : ""), rowsFor(idx)]));
  const lastUsed = topH + headMm + parts[parts.length - 1].length * rowMm;
  if (lastUsed + supportH <= ctx.bodyH) pagesOut[pagesOut.length - 1].blocks.push(...support);
  else pagesOut.push(page([...top(ctx, "Task card recording sheet", "Use these supports as you explain your answers.", "Supports"), ...support]));
  return pagesOut;
}

const taskCards = {
  id: "task-cards",
  family: "Practice",
  label: "Task cards with answer key",
  blurb: "Numbered cut-apart task cards from the lesson, a student recording sheet, and a separate answer key.",
  bands: ["k-2", "3-5", "6-8"],
  needs: "items",
  keyed: true,
  options: [{ id: "count", label: "Number of cards", choices: [{ v: "6", label: "6 cards" }, { v: "12", label: "12 cards" }, { v: "18", label: "18 cards" }], default: { "k-2": "6", "3-5": "12", "6-8": "12" } }],
  notes: {
    purpose: "Short, self-contained tasks for stations, partner work or early finishers. The task is identical at every support level.",
    prep: ["Print, cut the cards apart and number-check the set.", "Make one recording sheet per student."],
    use: ["Students solve a card, record the answer on the sheet and explain it to a partner.", "Use the answer key page to check; ask students to correct with a different colour."],
  },
  build(ctx) {
    ctx.need("items");
    const n = Number(ctx.opts.count) || { "k-2": 6, "3-5": 12, "6-8": 12 }[ctx.band];
    const items = ctx.items.slice(0, n);
    const per = ctx.k2 ? 4 : 6;
    const g = cardGrid(ctx, per);
    const pt = ctx.style.bodyPt;
    const cards = items.map((it, i) => {
      const spec = ctx.pic(it.visual, "support");
      const text = taskPrompt(it, ctx);
      const textH = estLines(text, g.cw - 12, pt) * lineMmOf(pt);
      const left = g.ch - 18 - textH;
      const c = { num: String(i + 1), body: text, headSize: "m" };
      if (spec && left > 28) {
        c.visual = spec;
        c.visualMm = Math.floor(Math.min(g.cw - 12, (left - 6) * ratio(spec)));
      }
      return c;
    });
    const pages = chunk(cards, per).map((set) => page([B.p("Cut on the dashed lines.", "quiet"), B.cards({ cols: g.cols, rows: g.rows, hMm: g.ch, items: set })]));
    const tier = ctx.tiers[0];
    const record = recordPages(ctx, items, ctx.tiers[0]);
    const key = keyPages(ctx, "task cards", items.map((it, i) => [String(i + 1), it.answer, it.explain]));
    return { pages: [...pages, ...record], key };
  },
};

function discussionPrompts(ctx) {
  const L = ctx.lesson;
  const out = [];
  for (const c of L?.collaborate?.discussionCards || []) if (c.prompt) out.push({ prompt: c.prompt, frame: c.frame });
  if (L?.collaborate?.task) out.push({ prompt: L.collaborate.task });
  if (L?.threeWays?.discuss?.structure) out.push({ prompt: L.threeWays.discuss.structure, frame: L.threeWays.discuss.frames?.[0] });
  for (const e of ctx.entries) if (e.practice?.speakWrite) out.push({ prompt: e.practice.speakWrite });
  if (!out.length) {
    for (const d of ctx.profile.discourse.slice(0, 4)) out.push({ prompt: `Take turns with your partner: ${d} about ${ctx.topic || "today's topic"}.` });
  }
  return out;
}

const discussionCards = {
  id: "discussion-cards",
  family: "Academic talk",
  label: "Academic discussion cards (frames by level)",
  blurb: "Prompt cards with sentence frames matched to the chosen language-support level, plus a talk-moves card set.",
  bands: ["k-2", "3-5", "6-8"],
  needs: null,
  options: [],
  notes: {
    purpose: "Structured partner and small-group talk. The prompt is the same for every level; only the language scaffold changes.",
    prep: ["Print one set per group. Choose several support levels to print a set for each.", "Cut the cards apart."],
    use: ["One student draws a card and reads the prompt; partners use a frame to respond.", "Rotate the card reader. Listen for the frame and for the content words."],
  },
  build(ctx) {
    const prompts = discussionPrompts(ctx).slice(0, 8);
    const per = ctx.k2 ? 4 : 6;
    const g = cardGrid(ctx, per);
    const moves = ["I agree with ______ because ______.", "I disagree because ______.", "Can you say more about ______?", "I would like to add ______.", "Why do you think ______?", "Can you show me where ______?"];
    const pages = ctx.eachTier((tier) => {
      const fr = ctx.frames(tier, 2);
      const cards = prompts.map((p) => ({ tag: ctx.klu, body: p.prompt, frames: tier === "br" ? [] : [p.frame || fr[0], fr[1]].filter(Boolean).slice(0, ctx.k2 ? 1 : 2), foot: tier === "br" ? "Use at least two vocabulary words." : "" }));
      const talk = moves.slice(0, per).map((m) => ({ tag: "Talk move", frames: [m] }));
      return [...chunk(cards, per).map((set) => page([B.p("Cut on the dashed lines.", "quiet"), B.cards({ cols: g.cols, rows: g.rows, hMm: g.ch, items: set })])), page([B.p("Cut on the dashed lines.", "quiet"), B.cards({ cols: g.cols, rows: g.rows, hMm: g.ch, items: talk })])];
    });
    return { pages };
  },
};

const galleryWalk = {
  id: "gallery-walk",
  family: "Academic talk",
  label: "Gallery walk stations",
  blurb: "One station poster per page and a recording sheet. Post the posters around the room; students rotate and respond.",
  bands: ["k-2", "3-5", "6-8"],
  needs: null,
  options: [{ id: "stations", label: "Stations", choices: [{ v: "4", label: "4 stations" }, { v: "6", label: "6 stations" }], default: { "k-2": "4", "3-5": "6", "6-8": "6" } }],
  notes: {
    purpose: "Movement and talk around a set of prompts or models. Students respond in writing or drawing at each station.",
    prep: ["Print the station pages and post them around the room.", "Print one recording sheet per student."],
    use: ["Groups spend a few minutes at each station, then rotate.", "Debrief by asking which station changed your thinking."],
  },
  build(ctx) {
    const n = Number(ctx.opts.stations) || (ctx.k2 ? 4 : 6);
    const src = ctx.items.length ? ctx.items.map((it) => ({ prompt: it.prompt, visual: it.visual, answer: it.answer, explain: it.explain })) : discussionPrompts(ctx).map((p) => ({ prompt: p.prompt }));
    const stations = src.slice(0, n);
    const pages = stations.map((s, i) => {
      const spec = ctx.pic(s.visual || (i === 0 ? ctx.lesson?.launch?.visual : null));
      return page([B.title(`Station ${i + 1}`, ctx.title), B.p(s.prompt, "lead"), spec ? B.visual(spec, { wMm: Math.min(ctx.bodyW - 20, 110) }) : null, B.p(ctx.k2 ? "Draw or tell your idea." : "Write your idea on a sticky note and add it to this station.", "direction")]);
    });
    const rec = organizerPages(ctx, {
      before: top(ctx, "Gallery walk recording sheet", "At each station, write or draw one idea."),
      makeTable: (h) => B.table({ cols: [0.8, 3, 2], head: ["Station", "My idea", "A question I have"], rows: stations.map((_, i) => [{ t: String(i + 1), kind: "label" }, { t: "", h }, { t: "" }]) }),
      support: supportBlocks(ctx, ctx.tiers[0], { bankWords: wordsOf(ctx) }),
      fixedMm: topMm(ctx) + BLOCK_GAP_MM + lineMmOf(ctx.style.bodyPt) + ROW_PAD_MM,
      rows: stations.length,
      min: 1,
      max: 3,
    });
    const withKey = stations.some((s) => s.answer);
    const key = withKey ? keyPages(ctx, "gallery walk", stations.map((s, i) => [String(i + 1), s.answer || "Answers will vary.", s.explain || ""])) : null;
    return { pages: [...pages, ...rec], key };
  },
};

export const CARD_TEMPLATES = [vocabCards, vocabMat, sortMatch, taskCards, discussionCards, galleryWalk];
