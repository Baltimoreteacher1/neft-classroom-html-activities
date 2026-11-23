// Task and project sheets: error analysis, partner project, research guide, choice board, exit tickets, quick check.
import { B, chunk, keyPages, label, labelRows, page, supportBlocks, top, topMm, wordsOf } from "./kit.js";
import { fit, more, pack, unitPages } from "./sheets-a.js";

const tpl = (extra) => ({ bands: ["k-2", "3-5", "6-8"], needs: null, options: [], family: "Tasks and projects", ...extra });
const topicOf = (ctx) => ctx.topic || ctx.title || "";
const heading = (ctx, base) => (topicOf(ctx) ? `${base}: ${topicOf(ctx)}` : base);
const list = (items) => B.list(items.map((c, k) => `${"ABCD"[k]}. ${c}`), false, true);

function errorCases(ctx) {
  const out = [];
  for (const it of ctx.items) {
    if (it.choices.length < 2) continue;
    const wrong = it.choices.find((c) => c !== it.answer);
    if (wrong) out.push({ claim: `A student answered "${wrong}" to this question: ${it.prompt}`, answer: `The correct answer is ${it.answer}.`, why: it.explain, kind: "answer" });
  }
  for (const m of ctx.lesson?.teacherNotes?.misconceptions || []) {
    const text = typeof m === "string" ? m : m?.text || m?.misconception;
    if (text) out.push({ claim: `A student says: "${text}"`, answer: "The statement is not correct.", why: ctx.lesson?.answerKey?.notes || "Look for a student explanation that names the misconception and gives the correct reasoning with the lesson's vocabulary.", kind: "claim" });
  }
  return out;
}

const errorAnalysis = tpl({
  id: "error-analysis",
  label: "Error analysis activity",
  blurb: "Students decide whether a student's answer or statement is correct, find the mistake and fix it. Built from the lesson's own questions and misconceptions.",
  needs: "items",
  keyed: true,
  notes: {
    purpose: "Analyzing a plausible error builds precision and shows the misconception behind it, without exposing a particular student.",
    prep: ["One sheet per student or pair."],
    use: ["Students decide first, then explain the error and the fix to a partner.", "Debrief on why the wrong answer is tempting."],
  },
  build(ctx) {
    const cases = errorCases(ctx).slice(0, 6);
    if (!cases.length) ctx.need("items", "Error analysis needs a lesson with multiple-choice questions or listed misconceptions.");
    const head = top(ctx, heading(ctx, "Find the error"), "Read what the student did. Decide if it is correct. Find the mistake and fix it.");
    const pages = ctx.eachTier((tier) =>
      unitPages(ctx, head, cases, ctx.k2 ? 1 : 2, (c, n, rows) => [B.p(`${n}. ${c.claim}`, "lead"), B.check(["It is correct.", "It has a mistake."]), B.box(rows, "The mistake and the fix"), ...supportBlocks(ctx, tier, { bankWords: wordsOf(ctx), klu: "Explain" }).slice(-1)], [7, 6, 5, 4, 3, 2]),
    );
    return { pages, key: keyPages(ctx, "find the error", cases.map((c, i) => [String(i + 1), c.answer, c.why])) };
  },
});

const ROLES2 = ["Reader", "Recorder"];
const ROLES = ["Reader (reads the directions)", "Recorder (writes our ideas)", "Speaker (shares with the class)", "Checker (checks the criteria)"];
const partnerProject = tpl({
  id: "partner-project",
  family: "Tasks and projects",
  label: "Partner project sheet",
  blurb: "Roles, plan, success checklist and a reflection page for two to four students working together.",
  notes: {
    purpose: "A planning-and-reflection frame for a short collaborative task.",
    prep: ["Write the project task in the first box before copying, or use the lesson's collaboration task."],
    use: ["Partners agree on roles before starting.", "Use the checklist for self-assessment, and the reflection to talk about how the partnership went."],
  },
  build(ctx) {
    const task = ctx.opts.task || ctx.lesson?.collaborate?.task || ctx.lesson?.threeWays?.apply?.task || "";
    const roles = (ctx.lesson?.collaborate?.roles?.length ? ctx.lesson.collaborate.roles : ctx.k2 ? ROLES2 : ROLES).slice(0, 4);
    const crit = ctx.lesson?.threeWays?.apply?.successCriteria?.length ? ctx.lesson.threeWays.apply.successCriteria : ["We answered the question or finished the task.", "We used key vocabulary words.", "Everyone shared ideas and listened."];
    const t = heading(ctx, "Partner project");
    const head = top(ctx, t, "Plan together before you begin.");
    const planBlocks = fit(ctx, head, (n) => [task ? B.p(task, "lead") : B.lines(2, "Our task"), B.table({ cols: [1.2, 1.8, 1.8], head: ["Role", "Partner name", "What I will do"], rows: roles.map((r) => [{ t: r, kind: "label" }, { t: "", h: 1.5 }, { t: "" }]) }), B.box(n, "Our plan (steps, materials, drawing)"), B.h("We are done when...", 3), B.check(crit)], [10, 8, 6, 5, 4, 3]);
    const plan = pack(ctx, head, planBlocks, more(ctx, t));
    // The plan is the same at every level; only the reflection page changes, so there is one plan page and one reflection per level.
    const reflect = ctx.eachTier((tier) => {
      const rhead = top(ctx, "Project reflection", "Think about the work and about working together.");
      const blocks = fit(ctx, rhead, (n) => [B.box(n, "Our finished work (draw, list or paste)"), B.frames(ctx.k2 ? ["Our best part was ______.", "Next time we will ______."] : ["One thing that went well was ______ because ______.", "Next time we will ______."], "Talk and write"), ...supportBlocks(ctx, tier, { bankWords: wordsOf(ctx), klu: "Explain" }).slice(0, 1)], [8, 6, 5, 4, 3]);
      return pack(ctx, rhead, blocks, more(ctx, "Project reflection"));
    });
    return { pages: [...plan, ...reflect] };
  },
});

const researchGuide = tpl({
  id: "research-guide",
  label: "Research project guide",
  blurb: "Guiding question, sources log, notes and a claim page. K-2 is a find-out sheet.",
  notes: {
    purpose: "A step-by-step guide that keeps a short research project organized from question to claim.",
    prep: ["Choose or write the guiding question; students add their own sub-questions."],
    use: ["Students log each source before taking notes.", "The last page turns notes into a claim supported by evidence."],
  },
  build(ctx) {
    const pages = ctx.eachTier((tier) => {
      if (ctx.k2) {
        const head = top(ctx, heading(ctx, "Find out"), "Ask a question. Find out. Draw and tell.");
        return pack(ctx, head, fit(ctx, head, (n) => [B.lines(2, "My question"), B.box(n, "What I found out (draw)"), B.lines(2, "I learned...")], [12, 10, 8, 6, 4]), more(ctx, "Find out"));
      }
      const srcHead = ctx.band === "6-8" ? ["Source (title, author, date)", "Key information", "How reliable is it, and why?"] : ["Source (title or website)", "What I learned", "Can I trust it? Why?"];
      const t = heading(ctx, "Research guide");
      const head1 = top(ctx, t, "Start with a question. Log every source you use.", "Page 1");
      const logs = fit(ctx, head1, (h) => [B.lines(2, "My guiding question"), B.table({ cols: [1, 1], head: ["Smaller questions I need to answer", "Key words I will search for"], rows: [0, 1, 2].map(() => [{ t: "", h }, { t: "" }]) }), B.table({ cols: [2, 2.4, 2], head: srcHead, rows: [0, 1, 2].map(() => [{ t: "", h }, { t: "" }, { t: "" }]) })], [4, 3, 2, 1.5]);
      const head2 = top(ctx, "Research guide: my claim", "Use your notes to answer the guiding question.", "Page 2");
      const claim = fit(ctx, head2, (h) => [B.table({ cols: [1, 3.2], rows: labelRows(["My claim", "Evidence 1", "Evidence 2", "What I still wonder"], h) }), ...supportBlocks(ctx, tier, { bankWords: wordsOf(ctx), klu: "Argue" })], [6, 5, 4, 3, 2]);
      return [...pack(ctx, head1, logs, more(ctx, t, "Page 1 (continued)")), ...pack(ctx, head2, claim, more(ctx, "Research guide: my claim", "Page 2 (continued)"))];
    });
    return { pages };
  },
});

const MODES = [
  (t) => `Draw a labeled picture that shows ${t}.`,
  (t) => `Teach a partner about ${t}. Use a drawing or an object.`,
  (t) => `Write three sentences about ${t}.`,
  (t) => `Make a question about ${t} and write its answer.`,
  (t) => `Make a comic strip with three boxes about ${t}.`,
  (t) => `Create a quick poster that explains ${t} to a younger student.`,
  (t) => `Act out ${t} with a partner and tell what each part shows.`,
  (t) => `List five things you notice about ${t} and what each one tells you.`,
];
const choiceBoard = tpl({
  id: "choice-board",
  label: "Choice board",
  blurb: "A tic-tac-toe style board of tasks; students choose three in a row. All tasks target the same learning.",
  notes: {
    purpose: "Let students choose how to show the same learning. Every cell has the same rigor; the product differs.",
    prep: ["Print one board per student and review the free-choice cell rules."],
    use: ["Students choose three in a row and mark each finished cell.", "Use one common success criterion for every cell."],
  },
  build(ctx) {
    const t = topicOf(ctx) || "today's topic";
    const n = ctx.k2 ? 4 : 9;
    const own = [];
    for (const it of ctx.items.filter((x) => x.src !== "guided").slice(0, 3)) own.push(`Solve and explain: ${it.prompt}`);
    if (ctx.lesson?.extension?.task) own.push(ctx.lesson.extension.task);
    if (ctx.lesson?.threeWays?.apply?.task) own.push(ctx.lesson.threeWays.apply.task);
    const tasks = [...own, ...MODES.map((m) => m(t))].slice(0, ctx.k2 ? 4 : 8);
    const cells = ctx.k2 ? tasks : [...tasks.slice(0, 4), "Free choice: ask your teacher to approve your own idea.", ...tasks.slice(4)];
    const cols = ctx.k2 ? 2 : 3;
    const h = Math.floor((ctx.bodyH - topMm(ctx) - 24) / cols / ctx.style.lineMm) - 1;
    const rows = chunk(cells.slice(0, n), cols).map((r) => r.map((c, i) => ({ t: c, h, kind: c.startsWith("Free choice") ? "tint" : "plain", align: "center", key: i })));
    return { pages: [page([...top(ctx, heading(ctx, "Choice board"), ctx.k2 ? "Pick two in a row. Do them. Color the box when you finish." : "Choose three in a row. Mark each box when you finish."), B.table({ cols: Array(cols).fill(1), rows, accentHead: false })])] };
  },
});

const exitTicket = tpl({
  id: "exit-ticket",
  label: "Exit tickets (cut-apart)",
  blurb: "Four tickets per page for one question, with an answer key. Students hand in a ticket at the end of the lesson.",
  needs: "items",
  keyed: true,
  family: "Assessment",
  notes: {
    purpose: "A fast check of understanding at the end of the lesson to decide what to do next.",
    prep: ["Print and cut the tickets apart.", "Sort the returned tickets into got it / almost / not yet piles."],
    use: ["Hand out one ticket per student in the last five minutes.", "Use the key to sort, then plan the next day's grouping from what you see."],
  },
  build(ctx) {
    const source = ctx.lesson?.exitTicket?.items?.length ? ctx.items.filter((i) => i.src === "exit") : ctx.items.filter((i) => i.src === "formative");
    const set = (source.length ? source : ctx.items).slice(0, ctx.k2 ? 2 : 3);
    ctx.need("items");
    const per = ctx.k2 ? 2 : 4;
    const g = { cols: ctx.geom.orientation === "landscape" ? 2 : 1, rows: per };
    const hMm = Math.floor((ctx.bodyH - 8) / (ctx.geom.orientation === "landscape" ? per / 2 : per)) - 1;
    const pages = set.map((it) => {
      const base = { tag: "Exit ticket", body: it.prompt, lines: ctx.k2 ? 0 : Math.max(1, Math.min(4, Math.floor((hMm - 50) / ctx.style.lineMm))), headSize: "m" };
      const tk = it.choices.length ? { ...base, body: `${it.prompt}\n${it.choices.map((c, i) => `${"ABCD"[i]}. ${c}`).join("   ")}` } : base;
      return page([B.p("Cut on the dashed lines.", "quiet"), B.cards({ cols: g.cols, rows: g.rows, hMm, items: Array.from({ length: per }, () => ({ ...tk, foot: label(ctx, "name", "Name") + ": ____________________" })) })]);
    });
    return { pages, key: keyPages(ctx, "exit tickets", set.map((it, i) => [String(i + 1), it.answer, it.explain])) };
  },
});

const quickCheck = tpl({
  id: "quick-check",
  family: "Assessment",
  label: "Quick check (short assessment)",
  blurb: "A short, untimed check built from the lesson's questions with a separate answer key. Practice only, no scores or predictions.",
  needs: "items",
  keyed: true,
  notes: {
    purpose: "A short formative check for the teacher's use. It is not a standardized or official assessment item.",
    prep: ["One copy per student. Read the directions aloud for K-2."],
    use: ["Untimed: let students finish. Use the answer key and note which questions most students missed.", "Re-teach from the misses, not from the score."],
  },
  build(ctx) {
    ctx.need("items");
    const set = ctx.items.slice(0, ctx.k2 ? 4 : 6);
    const head = top(ctx, heading(ctx, "Quick check"), ctx.k2 ? "Listen to each question. Circle or write your answer." : "Answer each question. Take the time you need.");
    const pages = ctx.eachTier((tier) =>
      unitPages(ctx, head, set, ctx.k2 ? 2 : 3, (it, n, rows, vw) => {
        const pic = ctx.pic(it.visual, "support");
        return [B.p(`${n}. ${it.prompt}`, "lead"), pic ? B.visual(pic, { wMm: vw }) : null, it.choices.length ? list(it.choices) : B.lines(rows, label(ctx, "answer", "Answer")), B.spacer(2), ...(n === set.length ? supportBlocks(ctx, tier, { bankWords: wordsOf(ctx), klu: "Explain" }).slice(0, 1) : [])];
      }, [3, 2, 1], [56, 40, 28]),
    );
    return { pages, key: keyPages(ctx, "quick check", set.map((it, i) => [String(i + 1), it.answer, it.explain])) };
  },
});

export const SHEET_B_TEMPLATES = [errorAnalysis, partnerProject, researchGuide, choiceBoard, exitTicket, quickCheck];
