// Graphic organizers. Each is its own layout (not one worksheet skin) and varies by age band.
import { B, BLOCK_GAP_MM, estLines, fillLines, keyPages, labelRows, lineMmOf, organizerPages, page, supportBlocks, top, topMm, wordsOf } from "./kit.js";

const checkMm = (ctx, n) => 10 + n * (lineMmOf(ctx.style.bodyPt) + 2) + BLOCK_GAP_MM;
const linesMm = (ctx, n) => n * ctx.style.lineMm + 8 + BLOCK_GAP_MM;
const topicOf = (ctx) => ctx.topic || ctx.title || "";
const heading = (ctx, base) => (topicOf(ctx) ? `${base}: ${topicOf(ctx)}` : base);
const tpl = (extra) => ({ bands: ["k-2", "3-5", "6-8"], needs: null, options: [], ...extra });

const frayer = tpl({
  id: "frayer",
  family: "Graphic organizers",
  label: "Frayer model",
  blurb: "A four-part word study sheet, one page per word. K-2 becomes a picture-first word page.",
  needs: "entries",
  keyed: true,
  notes: {
    purpose: "Deep word study: definition, characteristics, examples and non-examples for one word.",
    prep: ["Print one page per student per word, or give each pair a different word."],
    use: ["Model one quadrant aloud, then release.", "Have partners compare examples and non-examples; the non-example is where the learning is."],
  },
  build(ctx) {
    const list = ctx.entries.slice(0, 8);
    if (!list.length && !topicOf(ctx)) ctx.need("entries", "The Frayer model needs a word. Pick a vocabulary set, or type a topic word.");
    const subjects = list.length ? list : [{ word: topicOf(ctx), visual: null }];
    const h = fillLines(ctx, topMm(ctx) + 36, 2, 3, 9);
    const L = ctx.k2 ? ["Draw it", "Tell about it", "It is...", "It is not..."] : ["Definition", "Characteristics", "Examples", "Non-examples"];
    const pages = subjects.map((e) => {
      const pic = ctx.pic(e.visual);
      return page([
        ...top(ctx, ctx.k2 ? "Word page" : "Frayer model", ctx.k2 ? "Draw it. Tell about it." : "Fill in each box about the center word."),
        B.table({
          cols: [1, 1],
          rows: [
            [{ t: L[0], kind: "label" }, { t: L[1], kind: "label" }],
            [{ t: "", h }, { t: "", h }],
            [{ t: ctx.bilingual && e.es ? `${e.word} / ${e.es.word}` : e.word, kind: "center", span: 2, visual: pic, visualMm: 26, h: 2 }],
            [{ t: L[2], kind: "label" }, { t: L[3], kind: "label" }],
            [{ t: "", h }, { t: "", h }],
          ],
        }),
      ]);
    });
    // The center word is printed on the student page, so the key leads with the model answers, not the word.
    const key = list.length
      ? keyPages(
          ctx,
          "Frayer model",
          list.map((e, i) => [{ t: `${i + 1}. ${e.word}`, kind: "label" }, { t: e.def ? `Definition: ${e.def}` : "Definition: answers will vary." }, { t: [e.context && `Example: ${e.context}`, e.nonExample && `Non-example: ${e.nonExample}`].filter(Boolean).join("  ") }]),
          [],
          { head: ["Word", "Definition", "Examples"], cols: [1.4, 2.4, 3] },
        )
      : null;
    return { pages, key };
  },
});

const causeEffect = tpl({
  id: "cause-effect",
  family: "Graphic organizers",
  label: "Cause and effect",
  blurb: "Cause, arrow, effect rows. Two rows with drawing for K-2, a longer chain with a because-sentence for grades 6-8.",
  notes: {
    purpose: "Show students how one event leads to another and how to say so in a sentence.",
    prep: ["One copy per student or per pair."],
    use: ["Model the because-sentence aloud using the first row.", "Students swap sheets and check that each effect really follows from its cause."],
  },
  build(ctx) {
    const rows = ctx.k2 ? 2 : ctx.band === "3-5" ? 3 : 4;
    const head = ctx.k2 ? ["Why did it happen?", "", "What happened?"] : ["Cause", "", "Effect"];
    // Row height comes from the space the supports actually leave, so richer support levels never push past the page.
    const pages = ctx.eachTier((tier) =>
      organizerPages(ctx, {
        before: top(ctx, heading(ctx, "Cause and effect"), ctx.k2 ? "Draw or write the cause. Draw or write the effect." : "Write each cause and the effect it leads to."),
        makeTable: (h) => B.table({ cols: [4, 0.7, 4], head, rows: Array.from({ length: rows }, () => [{ t: "", h }, { t: "→", kind: "arrow" }, { t: "", h }]) }),
        support: supportBlocks(ctx, tier, { bankWords: wordsOf(ctx), klu: "Explain" }),
        fixedMm: topMm(ctx) + BLOCK_GAP_MM + 8,
        rows,
        min: 2,
        max: 8,
      }),
    );
    return { pages };
  },
});

const COMPARE = {
  ee: ["______ and ______ are the same.", "______ is different."],
  dev: ["Both ______ and ______ have ______.", "______ is different because ______."],
  exp: ["Both ______ and ______ ______, but ______ ______ while ______ ______."],
  br: ["Although ______ and ______ share ______, they differ in that ______."],
};
const compare = tpl({
  id: "compare-contrast",
  family: "Graphic organizers",
  label: "Compare and contrast",
  blurb: "A Venn-style three-column organizer with comparison frames by support level.",
  notes: {
    purpose: "Organize similarities and differences before writing or discussing a comparison.",
    prep: ["Choose the two things to compare and write them in the heading boxes, or use the first two vocabulary words."],
    use: ["Fill the middle column first (what is the same), then the sides.", "Turn the finished organizer into a sentence using a comparison frame."],
  },
  build(ctx) {
    const [a, b] = [ctx.entries[0]?.word || "", ctx.entries[1]?.word || ""];
    const h = fillLines(ctx, topMm(ctx) + 70, 1, 6, 16);
    const head = ctx.k2 ? [a || "Thing 1", "Same", b || "Thing 2"] : [a ? `${a} only` : "Only (first topic)", "Both", b ? `${b} only` : "Only (second topic)"];
    const pages = ctx.eachTier((tier) => [
      page([
        ...top(ctx, heading(ctx, "Compare and contrast"), ctx.k2 ? "Draw or write what is the same and different." : "Write what is different on the sides and what is the same in the middle."),
        B.table({ cols: [1, 1, 1], head, rows: [[{ t: "", h }, { t: "", h }, { t: "", h }]] }),
        B.frames(tier === "br" ? COMPARE.br : COMPARE[tier] || COMPARE.dev, "Say it in a sentence"),
      ]),
    ]);
    return { pages };
  },
});

const CER_LABELS = {
  math: ["Claim (my answer)", "Evidence (my work)", "Reasoning (why it works)"],
  science: ["Claim", "Evidence (data and observations)", "Reasoning (the science idea)"],
  "social-studies": ["Claim", "Evidence (from the source)", "Reasoning (how it proves my claim)"],
  ela: ["Claim", "Text evidence", "Explanation"],
};
function questionOf(ctx) {
  const L = ctx.lesson;
  return ctx.opts.question || L?.threeWays?.apply?.task || L?.collaborate?.task || ctx.items[0]?.prompt || "";
}
const cer = tpl({
  id: "cer",
  family: "Graphic organizers",
  label: "Claim, evidence, reasoning (CER)",
  blurb: "A CER organizer with subject-specific labels and a self-check. K-2 uses I think / because / I know because.",
  keyed: true,
  notes: {
    purpose: "Teach students to answer a question with a claim backed by evidence and linked by reasoning.",
    prep: ["Write or choose the question; it appears at the top of the page.", "Print a set for each support level you selected."],
    use: ["Color-code claim, evidence and reasoning in a model answer first.", "Use the self-check before students hand it in."],
  },
  build(ctx) {
    const q = questionOf(ctx);
    const labels = ctx.k2 ? ["I think...", "Because I saw / counted / read...", "I know because..."] : CER_LABELS[ctx.subject] || ["Claim", "Evidence", "Reasoning"];
    const check = ctx.k2 ? ["My idea answers the question.", "I drew or wrote one thing I saw."] : ["My claim answers the question.", "My evidence is specific and accurate.", "My reasoning connects the evidence to the claim."];
    const qMm = q ? estLines(q, ctx.bodyW, ctx.style.bodyPt) * lineMmOf(ctx.style.bodyPt) + 6 + BLOCK_GAP_MM : linesMm(ctx, 2);
    const pages = ctx.eachTier((tier) =>
      organizerPages(ctx, {
        before: [...top(ctx, heading(ctx, ctx.k2 ? "My thinking" : "Claim, evidence, reasoning"), "Answer the question. Use all three parts."), q ? B.p(q, "lead") : B.lines(2, "Question")],
        makeTable: (h) => B.table({ cols: [1, 3.2], rows: labelRows(labels, h) }),
        after: [B.check(check)],
        support: supportBlocks(ctx, tier, { bankWords: wordsOf(ctx), klu: "Argue" }),
        fixedMm: topMm(ctx) + qMm + checkMm(ctx, check.length) + BLOCK_GAP_MM,
        rows: 3,
        min: 2,
        max: 9,
      }),
    );
    const key = [page([B.title("Answer key: CER", "What a strong response includes"), B.table({ cols: [1.4, 4], head: ["Part", "Look for"], rows: [[labels[0], "A direct answer to the question, stated in one sentence."], [labels[1], "Specific, accurate details taken from the lesson, data or text."], [labels[2], ctx.lesson?.answerKey?.notes || "A sentence that explains why the evidence supports the claim, using the lesson's key words."]] })])];
    return { pages, key };
  },
});

const sequence = tpl({
  id: "sequence",
  family: "Graphic organizers",
  label: "Sequence of events or steps",
  blurb: "First-next-then-last boxes with sequence words. More steps and a why-it-matters column in grades 6-8.",
  notes: {
    purpose: "Order the steps of a process or the events of a story with signal words.",
    prep: ["One copy per student."],
    use: ["Read the sequence words aloud together.", "Students retell the sequence to a partner using each word."],
  },
  build(ctx) {
    const steps = ctx.k2 ? ["First", "Next", "Then", "Last"] : ctx.band === "3-5" ? ["First", "Next", "Then", "After that", "Finally"] : ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Step 6"];
    const wide = ctx.band === "6-8";
    const bank = ["first", "next", "then", "after that", "finally"];
    const pages = ctx.eachTier((tier) =>
      organizerPages(ctx, {
        before: top(ctx, heading(ctx, "Sequence"), ctx.k2 ? "Draw or write what happens in order." : "Write each step in order. Use sequence words."),
        makeTable: (h) => B.table({ cols: wide ? [0.9, 3, 2] : [1, 4], head: wide ? ["Step", "What happens", "Why it matters"] : null, rows: wide ? steps.map((x) => [{ t: x, kind: "label" }, { t: "", h }, { t: "", h }]) : labelRows(steps, h) }),
        support: ctx.k2 ? [] : supportBlocks(ctx, tier, { bankWords: bank, klu: "Narrate" }),
        fixedMm: topMm(ctx) + BLOCK_GAP_MM + (wide ? 12 : 0),
        rows: steps.length,
        max: 8,
      }),
    );
    return { pages };
  },
});

const mainIdea = tpl({
  id: "main-idea",
  family: "Graphic organizers",
  label: "Main idea and details",
  blurb: "A main-idea box over three detail boxes, with a summary line.",
  notes: {
    purpose: "Separate the main idea from supporting details and then summarize.",
    prep: ["One copy per student with the reading they will use."],
    use: ["Model finding a detail that supports the main idea, then a detail that does not.", "Have students summarize in one sentence."],
  },
  build(ctx) {
    const summaryLines = ctx.k2 ? 1 : 2;
    const pages = ctx.eachTier((tier) =>
      organizerPages(ctx, {
        before: top(ctx, heading(ctx, "Main idea and details"), ctx.k2 ? "What is it mostly about? Draw three details." : "Write the main idea. Then write three details that support it."),
        makeTable: (h) => B.table({ cols: [1, 1, 1], rows: [[{ t: ctx.k2 ? "The big idea" : "Main idea", kind: "label", span: 3 }], [{ t: "", span: 3, h }], [{ t: "Detail 1", kind: "label" }, { t: "Detail 2", kind: "label" }, { t: "Detail 3", kind: "label" }], [{ t: "", h: h + 1 }, { t: "", h: h + 1 }, { t: "", h: h + 1 }]] }),
        after: [B.lines(summaryLines, "Summary")],
        support: ctx.k2 ? [] : supportBlocks(ctx, tier, { bankWords: wordsOf(ctx), klu: "Inform" }),
        fixedMm: topMm(ctx) + BLOCK_GAP_MM + 2 * (lineMmOf(ctx.style.bodyPt) + 5) + linesMm(ctx, summaryLines) + 8,
        rows: 2,
        min: 3,
        max: 8,
      }),
    );
    return { pages };
  },
});

const kwl = tpl({
  id: "kwl",
  family: "Graphic organizers",
  label: "KWL chart (KWL and KWHL)",
  blurb: "Know, wonder, learned columns. Choose KWHL to add how I will find out.",
  options: [{ id: "variant", label: "Chart type", choices: [{ v: "kwl", label: "KWL" }, { v: "kwhl", label: "KWHL (adds How)" }], default: "kwl" }],
  notes: {
    purpose: "Activate prior knowledge, set purposes and record learning.",
    prep: ["Print one chart per student; fill the first two columns before the lesson and the last after."],
    use: ["Students write what they know and wonder before the lesson.", "Revisit the wonder column at the end and star the questions that were answered."],
  },
  build(ctx) {
    const four = ctx.opts.variant === "kwhl";
    const heads = ctx.k2 ? ["I know", "I wonder", "I learned"] : four ? ["What I Know", "What I Want to know", "How I will find out", "What I Learned"] : ["What I Know", "What I Wonder", "What I Learned"];
    const h = fillLines(ctx, topMm(ctx) + 24, 1, 8, 24);
    return { pages: [page([...top(ctx, heading(ctx, ctx.k2 ? "Think about it" : "KWL chart"), ctx.k2 ? "Draw or write in each box." : "Fill in the first columns before the lesson and the last one after."), B.table({ cols: heads.map(() => 1), head: heads, rows: [heads.map(() => ({ t: "", h }))] })])] };
  },
});

const GENRES = {
  Narrate: { labels: ["Beginning (who, where)", "Middle (the problem, what happens)", "End (how it is solved)"], title: "Story planner" },
  Inform: { labels: ["Topic sentence", "Fact 1", "Fact 2", "Fact 3", "Closing sentence"], title: "Informational paragraph planner" },
  Explain: { labels: ["Topic sentence", "Because 1", "Because 2", "So... (conclusion)"], title: "Explanation planner" },
  Argue: { labels: ["Claim", "Reason 1 and evidence", "Reason 2 and evidence", "Other side and my response", "Closing"], title: "Argument planner" },
};
const writingOrg = tpl({
  id: "writing-organizer",
  family: "Writing",
  label: "Writing organizer (by genre)",
  blurb: "A planner shaped to the purpose for writing: story, information, explanation or argument.",
  options: [{ id: "genre", label: "Purpose for writing", choices: [{ v: "auto", label: "Match the lesson" }, { v: "Narrate", label: "Tell a story" }, { v: "Inform", label: "Give information" }, { v: "Explain", label: "Explain" }, { v: "Argue", label: "Argue / persuade" }], default: "auto" }],
  notes: {
    purpose: "Plan writing before drafting so that every paragraph has a purpose and enough evidence.",
    prep: ["Print one planner per student and per support level selected."],
    use: ["Students plan with notes and phrases, not full sentences.", "Draft from the planner; the frames at the bottom help with the first sentence of each part."],
  },
  build(ctx) {
    const g = ctx.opts.genre && ctx.opts.genre !== "auto" ? ctx.opts.genre : ctx.klu;
    const spec = GENRES[g] || GENRES.Explain;
    const labels = ctx.k2 ? ["My idea", "Because", "So"] : spec.labels;
    const pages = ctx.eachTier((tier) =>
      organizerPages(ctx, {
        before: top(ctx, heading(ctx, ctx.k2 ? "Plan my writing" : spec.title), "Plan with words and short phrases. You do not need full sentences yet."),
        makeTable: (h) => B.table({ cols: [1.3, 3.5], rows: labelRows(labels, h) }),
        support: supportBlocks(ctx, tier, { bankWords: wordsOf(ctx), klu: g }),
        fixedMm: topMm(ctx) + BLOCK_GAP_MM,
        rows: labels.length,
        max: 7,
      }),
    );
    return { pages };
  },
});

export const ORGANIZER_TEMPLATES = [frayer, causeEffect, compare, cer, sequence, mainIdea, kwl, writingOrg];
