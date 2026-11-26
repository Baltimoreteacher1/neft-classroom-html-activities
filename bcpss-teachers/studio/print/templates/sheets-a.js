// Subject sheets: reading response, math explanation, science journal, source analysis, picture-supported text.
import { B, chunk, estLines, keyPages, label, labelRows, lineMmOf, page, supportBlocks, top, wordsOf } from "./kit.js";

// ---- Layout helpers shared with sheets-b.js: estimate block heights in mm, pick sizes that fit, and paginate. ----
const PT = 0.3528;
const SLACK = 6;
const textMm = (ctx, text, wMm, pt, bold = false) => estLines(text, wMm, pt * (bold ? 1.1 : 1.04)) * lineMmOf(pt);
const ratioOf = (spec) => (spec?.w || 480) / (spec?.h || 320);

function cellMm(ctx, c, wMm, head) {
  const pt = ctx.style.bodyPt;
  const inner = Math.max(8, wMm - 6.2);
  const bold = head || c.kind === "label" || c.kind === "center";
  const text = c.t ? textMm(ctx, c.t, inner, pt, bold) : 0;
  const pic = c.visual ? (c.visualMm || 28) / ratioOf(c.visual) + 1 : 0;
  return Math.max(c.h ? c.h * ctx.style.lineMm : 0, text + pic + 4.9);
}

/** Estimated height in mm of one block, including its 4mm bottom margin. Errs high so a page never overflows. */
export function blockMm(ctx, b) {
  const pt = ctx.style.bodyPt;
  const lh = lineMmOf(pt);
  const W = ctx.bodyW;
  const line = ctx.style.lineMm;
  const M = 4;
  switch (b.type) {
    case "namebar": return pt * 1.5 * PT + M;
    case "title": return textMm(ctx, b.text, W, ctx.style.headPt, true) * 0.86 + 5 + (b.sub ? textMm(ctx, b.sub, W, pt * 1.05) : 0) + M;
    case "h": return textMm(ctx, b.text, W, pt * 1.2, true) + 2 + M;
    case "p": {
      if (b.tone === "direction") return textMm(ctx, b.text, W - 9, pt, true) + 3.2 + M;
      if (b.tone === "lead") return textMm(ctx, b.text, W, pt * 1.2) * 1.02 + M;
      if (b.tone === "quiet") return textMm(ctx, b.text, W, ctx.style.smallPt) + M;
      return textMm(ctx, b.text, W, pt) + M;
    }
    case "list": return b.items.reduce((a, t) => a + textMm(ctx, t, W - (b.bare ? 2 : 9), pt) + 1.2, M);
    case "check": return b.items.reduce((a, t) => a + Math.max(6.4, textMm(ctx, t, W - 10, pt)) + 2, M);
    case "lines": return (b.label ? textMm(ctx, b.label, W, pt, true) + 1 : 0) + b.n * line + M;
    case "box": return b.n * line + M;
    case "frames": return (b.label ? lh + 1 : 0) + b.items.reduce((a, t) => a + textMm(ctx, t, W, pt, true) + line + 1.5, 0) + M;
    case "bank": {
      const used = b.words.reduce((a, w) => a + w.length * pt * 0.55 * PT + 8, 0) + b.label.length * pt * 0.6 * PT + 8;
      const rows = Math.ceil(used / (W - 7));
      return rows * (lh + 1.6) + (rows - 1) * 2 + 7.4 + M;
    }
    case "visual": return b.wMm / ratioOf(b.spec) + (b.caption ? lh + 1 : 0) + M;
    case "table": {
      const total = b.cols.reduce((a, c) => a + c, 0);
      const rowMm = (r, head) => Math.max(b.rowLines * line, ...r.map((c, i) => cellMm(ctx, c, (b.cols[i] / total) * W, head)));
      return (b.head ? rowMm(b.head, true) : 0) + b.rows.reduce((a, r) => a + rowMm(r, false), 0) + M;
    }
    case "spacer": return b.mm + M;
    default: return 20 + M;
  }
}
export const sumMm = (ctx, blocks) => blocks.filter(Boolean).reduce((a, b) => a + blockMm(ctx, b), 0);
/** Millimetres a page body can hold. */
export const limitMm = (ctx) => ctx.bodyH - 3 - SLACK;

/** Continuation head for pages after the first: name bar, title and "Page N" (or `sub`). */
export const more = (ctx, title, sub) => (i) => top(ctx, title, "", sub || `Page ${i + 1}`);

/** Cartesian product of option lists, the first list varying slowest: [[a1,b1],[a1,b2],...]. */
const grid = (...lists) => lists.reduce((acc, l) => acc.flatMap((p) => l.map((v) => [...p, v])), [[]]);
/** First level (best first) whose `build(...level)` blocks fit under `head` on one page; the last level if none does. */
export function fit(ctx, head, build, ...lists) {
  const levels = grid(...lists);
  const hit = levels.find((lv) => sumMm(ctx, [...head, ...build(...lv)]) <= limitMm(ctx)) || levels[levels.length - 1];
  return build(...hit);
}

function splitTable(ctx, b, room) {
  const total = b.cols.reduce((a, c) => a + c, 0);
  const rowMm = (r) => Math.max(b.rowLines * ctx.style.lineMm, ...r.map((c, i) => cellMm(ctx, c, (b.cols[i] / total) * ctx.bodyW, false)));
  const headMm = b.head ? Math.max(...b.head.map((c, i) => cellMm(ctx, c, (b.cols[i] / total) * ctx.bodyW, true))) : 0;
  let used = headMm;
  let n = 0;
  while (n < b.rows.length && used + rowMm(b.rows[n]) <= room - 4) used += rowMm(b.rows[n++]);
  return n >= 1 && n < b.rows.length ? [{ ...b, rows: b.rows.slice(0, n) }, { ...b, rows: b.rows.slice(n) }] : null;
}

/**
 * Greedy pagination. `head` opens page 1, `cont(i)` opens later pages. A block that does not fit starts a new page
 * (tables split between rows), so content is never cut off even when the size estimate is tight.
 */
export function pack(ctx, head, blocks, cont = () => head) {
  const pages = [];
  let cur = [...head];
  let used = sumMm(ctx, cur);
  let fresh = true;
  const queue = blocks.filter(Boolean);
  while (queue.length) {
    const b = queue.shift();
    const h = blockMm(ctx, b);
    if (used + h > limitMm(ctx) && !fresh) {
      const parts = b.type === "table" ? splitTable(ctx, b, limitMm(ctx) - used) : null;
      if (parts) {
        cur.push(parts[0]);
        queue.unshift(parts[1]);
      } else queue.unshift(b);
      pages.push(page(cur));
      cur = [...cont(pages.length)];
      used = sumMm(ctx, cur);
      fresh = true;
      continue;
    }
    cur.push(b);
    used += h;
    fresh = false;
  }
  if (!fresh) pages.push(page(cur));
  return pages;
}

/**
 * Pages of repeated units (problems, cases) with `head` on every page. Tries the most units per page first and, for each,
 * the roomiest work area that fits: levels are [rows, extra] lists, best first. `build(item, number, rows, extra)` returns blocks.
 */
export function unitPages(ctx, head, items, perMax, build, rows, extras = [0]) {
  for (let per = perMax; per >= 1; per--) {
    const groups = chunk(items, per);
    for (const [x, r] of grid(extras, rows)) {
      const made = groups.map((g, gi) => g.flatMap((it, i) => build(it, gi * per + i + 1, r, x)));
      const fits = (bl) => sumMm(ctx, [...head, ...bl]) <= limitMm(ctx);
      if (!made.every(fits)) continue;
      // Each page then takes the roomiest work area it can hold, so short items do not leave the bottom of the page empty.
      return groups.map((g, gi) => {
        for (const rr of rows) {
          const bl = g.flatMap((it, i) => build(it, gi * per + i + 1, rr, x));
          if (fits(bl)) return page([...head, ...bl]);
        }
        return page([...head, ...made[gi]]);
      });
    }
  }
  return chunk(items, 1).flatMap((g, gi) => pack(ctx, head, build(g[0], gi + 1, rows[rows.length - 1], extras[extras.length - 1]), () => head));
}

const tpl = (extra) => ({ bands: ["k-2", "3-5", "6-8"], needs: null, options: [], family: "Subject sheets", ...extra });
const topicOf = (ctx) => ctx.topic || ctx.title || "";
const heading = (ctx, base) => (topicOf(ctx) ? `${base}: ${topicOf(ctx)}` : base);

const readingResponse = tpl({
  id: "reading-response",
  subjects: ["ela", "esol", "social-studies", "science"],
  label: "Reading response sheet",
  blurb: "Predict, retell, cite evidence and respond. K-2 is draw-and-tell; grades 6-8 ask for a quote and an explanation.",
  notes: {
    purpose: "A repeatable response routine for any text. The reading task is the same at every support level.",
    prep: ["One sheet per student per text."],
    use: ["Students fill in the text title, then respond. Model the evidence row with a short passage first.", "Partners compare evidence before writing the response."],
  },
  build(ctx) {
    const pages = ctx.eachTier((tier) => {
      const sup = supportBlocks(ctx, tier, { bankWords: wordsOf(ctx), klu: ctx.k2 ? "Narrate" : "Argue" });
      if (ctx.k2) {
        const head = top(ctx, "My reading", "Draw your favorite part. Then write or say one sentence.");
        const blocks = fit(ctx, head, (n) => [B.lines(1, "Title of the book or story"), B.box(n, "My drawing"), B.lines(2, "My sentence"), ...sup], [10, 9, 8, 7, 6, 5, 4]);
        return pack(ctx, head, blocks, more(ctx, "My reading"));
      }
      const t = heading(ctx, "Reading response");
      const head = top(ctx, t, "Read the text. Then answer each part.");
      const ev = ctx.band === "6-8" ? ["Evidence from the text (quote or paraphrase)", "What this evidence shows"] : ["What the text says", "What I think it means"];
      const blocks = fit(ctx, head, (h) => [B.lines(1, "Title and author"), B.table({ cols: [3, 3], head: ev, rows: [0, 1, 2].map(() => [{ t: "", h }, { t: "", h }]) }), B.lines(2, ctx.band === "6-8" ? "My response (claim, evidence, explanation)" : "My response"), ...sup], [6, 5, 4, 3, 2]);
      return pack(ctx, head, blocks, more(ctx, t));
    });
    return { pages };
  },
});

const mathExplain = tpl({
  id: "math-explain",
  subjects: ["math"],
  label: "Math explanation sheet",
  blurb: "Problems with a grid work area and explain-your-thinking frames by support level. The answer key is a separate page.",
  needs: "items",
  keyed: true,
  notes: {
    purpose: "Students solve and then explain, because the explanation is where the language and the mathematics meet.",
    prep: ["One sheet per student. Choose a support level for each group."],
    use: ["Solve first, then say the explanation to a partner, then write it.", "Use the key page to check the answer, and read the explanations for method, not only the number."],
  },
  build(ctx) {
    ctx.need("items");
    const set = ctx.items.slice(0, ctx.k2 ? 4 : 6);
    const head = top(ctx, heading(ctx, "Solve and explain"), "Solve each problem. Then explain your thinking in words.");
    const pages = ctx.eachTier((tier) =>
      unitPages(ctx, head, set, ctx.k2 ? 1 : 2, (it, n, rows, vw) => {
        const pic = ctx.pic(it.visual, "support");
        return [
          B.p(`${n}. ${it.prompt}`, "lead"),
          it.choices.length ? B.list(it.choices.map((c, k) => `${"ABCD"[k]}. ${c}`), false, true) : null,
          pic ? B.visual(pic, { wMm: vw }) : null,
          B.box(rows, ctx.k2 ? "Show it with pictures or numbers" : "Show your work", { grid: true }),
          B.lines(1, label(ctx, "answer", "Answer")),
          ...supportBlocks(ctx, tier, { bankWords: wordsOf(ctx), klu: "Explain" }).slice(-1),
        ];
      }, [11, 10, 9, 8, 6, 5, 4, 3, 2], [70, 48, 32]),
    );
    const key = keyPages(ctx, "solve and explain", set.map((it, i) => [String(i + 1), it.answer, it.explain]));
    return { pages, key };
  },
});

const scienceJournal = tpl({
  id: "science-journal",
  subjects: ["science", "health-pe"],
  label: "Science investigation journal",
  blurb: "Question, prediction, procedure, data table, observations and conclusion across two pages. K-2 is wonder, see, learn.",
  notes: {
    purpose: "A complete investigation record. Students plan, observe, record data and explain with evidence.",
    prep: ["One two-page journal per student or per lab pair.", "Write the investigation question in the first box."],
    use: ["Have students predict before they test, and revise the prediction after.", "The conclusion uses claim, evidence and reasoning."],
  },
  build(ctx) {
    const q = ctx.opts.question || ctx.lesson?.launch?.prompts?.[0] || "";
    const t = heading(ctx, "Investigation journal");
    if (ctx.k2) {
      const head = top(ctx, heading(ctx, "My science page"), "Look closely. Draw what you see.");
      const blocks = fit(ctx, head, (n) => [B.lines(1, "I wonder..."), B.box(n, "I see (draw it)"), B.lines(2, "I learned...")], [12, 10, 8, 6, 4]);
      return { pages: pack(ctx, head, blocks, more(ctx, "My science page")) };
    }
    const pages = ctx.eachTier((tier) => {
      const head1 = top(ctx, t, "Plan the investigation before you start.", "Page 1");
      const head2 = top(ctx, t, "Record what happens. Be exact.", "Page 2");
      const plan = [q ? B.p(q, "lead") : B.lines(2, "Investigation question"), B.lines(2, "My prediction (I think ... because ...)"), B.lines(2, "Materials"), B.lines(4, "Procedure (what I will do, in order)"), ...supportBlocks(ctx, tier, { bankWords: wordsOf(ctx), klu: "Explain" }).slice(0, 1)];
      const record = fit(ctx, head2, (h, n) => [B.table({ cols: [2, 1.4, 1.4, 1.4], head: ["Trial or condition", "Measurement 1", "Measurement 2", "Notes"], rows: [0, 1, 2, 3].map(() => [{ t: "", h }, { t: "" }, { t: "" }, { t: "" }]) }), B.box(n, "Observations (draw and label)"), B.table({ cols: [1, 3.2], rows: labelRows(["Claim", "Evidence", "Reasoning"], h) })], [2, 1.5, 1], [10, 8, 6, 5]);
      return [...pack(ctx, head1, plan, more(ctx, t, "Page 1 (continued)")), ...pack(ctx, head2, record, more(ctx, t, "Page 2 (continued)"))];
    });
    return { pages };
  },
});

const sourceAnalysis = tpl({
  id: "source-analysis",
  subjects: ["social-studies", "ela"],
  label: "Source analysis guide",
  blurb: "Look at the source, ask who made it and why, then infer and question. K-2 is see, think, wonder.",
  notes: {
    purpose: "A guide for reading a primary or secondary source carefully before drawing conclusions.",
    prep: ["Give each student the source, or place a picture of it in the box on the page."],
    use: ["Observe first (what is actually there), then infer, then question.", "Compare two students' sourcing notes to see how author and purpose change the reading."],
  },
  build(ctx) {
    const spec = ctx.pic(ctx.lesson?.launch?.visual, "main");
    const src = (vw) => (spec ? B.visual(spec, { wMm: Math.min(vw, ctx.bodyW - 40), caption: "Source" }) : B.box(Math.max(3, Math.round((vw * 0.6) / ctx.style.lineMm)), "Source (paste or draw it here)"));
    const pages = ctx.eachTier((tier) => {
      if (ctx.k2) {
        const head = top(ctx, "Look and think", "Look at the picture. Tell what you see, think and wonder.");
        const blocks = fit(ctx, head, (vw, h) => [src(vw), B.table({ cols: [1, 3], rows: labelRows(["I see...", "I think...", "I wonder..."], h) })], [110, 80, 60, 45, 32], [3, 2, 1.5]);
        return pack(ctx, head, blocks, more(ctx, "Look and think"));
      }
      const rows = ctx.band === "3-5" ? ["Who made it?", "What is it about?", "When and where?", "Why was it made?"] : ["Sourcing: who made this, when, and for whom?", "Close reading: what does it say or show?", "Context: what was happening at the time?", "Corroboration: how does it compare with another source?"];
      const t = heading(ctx, "Source analysis");
      const head = top(ctx, t, "Study the source. Answer each question with evidence.");
      const blocks = fit(ctx, head, (vw, h) => [src(vw), B.table({ cols: [1.7, 3.2], rows: labelRows(rows, h) }), ...supportBlocks(ctx, tier, { bankWords: wordsOf(ctx), klu: "Argue" })], [110, 80, 60, 45], [3, 2, 1.5]);
      return pack(ctx, head, blocks, more(ctx, t));
    });
    return { pages };
  },
});

function textChunks(ctx) {
  const m = ctx.lesson?.teach?.model;
  const fromModel = Array.isArray(m) ? m.map((x) => (typeof x === "string" ? x : x?.text || "")) : typeof m === "string" ? m.split(/\n{2,}/) : [];
  const parts = fromModel.filter(Boolean).slice(0, 6).map((t, i) => ({ t, visual: ctx.entries[i]?.visual || null }));
  if (parts.length) return parts;
  return ctx.entries.filter((e) => e.context).map((e) => ({ t: e.context, visual: e.visual }));
}

const pictureText = tpl({
  id: "picture-text",
  label: "Picture-supported text",
  blurb: "A short text with a picture beside each part so students can read with meaning. Built from the lesson explanation or the words in context.",
  notes: {
    purpose: "Make a short text accessible by pairing each part with a picture that carries the meaning.",
    prep: ["Print one copy per student."],
    use: ["Read the first part aloud while pointing to the picture.", "Students reread with a partner and mark the key word in each part."],
  },
  build(ctx) {
    const parts = textChunks(ctx);
    if (!parts.length) ctx.need("entries", "A picture-supported text needs a lesson with an explanation, or a vocabulary set with example sentences.");
    const per = ctx.k2 ? 3 : 4;
    const pages = chunk(parts, per).map((set, pi) => {
      const rowH = Math.floor((ctx.bodyH - 60) / per);
      const rows = set.map((p) => {
        const pic = ctx.pic(p.visual);
        const pic2 = pic ? { t: "", visual: pic, visualMm: Math.min(ctx.k2 ? 56 : 42, (rowH - 8) * ((pic.w || 480) / (pic.h || 320))), h: rowH / ctx.style.lineMm } : { t: "", h: rowH / ctx.style.lineMm };
        const text = { t: p.t, kind: "plain" };
        return ctx.k2 || pi % 2 === 0 ? [pic2, text] : [text, pic2];
      });
      return page([...top(ctx, heading(ctx, "Read with the pictures"), ctx.k2 ? "Look at the picture. Read the words. Say it again." : "Read each part. Use the picture to help you. Circle the key word in each part."), B.table({ cols: ctx.k2 ? [1.3, 2.6] : [1.6, 2.6], rows })]);
    });
    pages.push(page([...top(ctx, "Show what you understood", ctx.k2 ? "Draw or write one thing you learned." : "Write two sentences about what you learned."), ctx.k2 ? B.box(8, "My picture") : B.lines(4, ""), B.lines(ctx.k2 ? 2 : 3, "")]));
    return { pages };
  },
});

export const SHEET_A_TEMPLATES = [readingResponse, mathExplain, scienceJournal, sourceAnalysis, pictureText];
