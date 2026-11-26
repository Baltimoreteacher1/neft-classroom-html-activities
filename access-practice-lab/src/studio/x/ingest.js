// Source material workspace: read what a teacher pasted or uploaded (add source -> review what was found -> choose what
// to make). Pure, deterministic, offline: no network, no model, no logging of content. Nothing leaves the device.
//
// ingestText(text, { filename?, type?, bytes?, hints? }) -> { ok, blocks[], suggestions[], review[], provenance }
//   blocks       extracted items in source order. Each has `id`, `type`, `confidence` ("high" | "review") and `lines`
//                [first, last] (1-based line numbers of the text that was read).
//   review       things the teacher must look at, each with a plain {en, es} reason. Anything ambiguous (answer unmarked
//                or marked twice, a choice list with a missing letter, uneven table rows, a blank without an answer) is
//                reported here and is NEVER guessed: no answer, definition or distractor is ever made up.
//   suggestions  what the structure supports, each with the existing kind/template (and transform) it would use.
//   provenance   { name, type, bytes, lines }: facts about the source, never its content.
//
// It reuses core/parse.js parseContent for vocabulary, steps, categories, passages and arithmetic problems (answers
// computed with exact arithmetic) and adds the line-aware pieces parseContent does not have.

import { parseContent } from "../core/parse.js";
import { parseNumber } from "../core/math.js";
import { pair } from "../core/differentiate-util.js";
import { MAX_CHARS } from "./ingest-limits.js";
import { NO_TEXT, R } from "./ingest-reasons.js";
import { suggestions } from "./ingest-suggest.js";

export { buildActivityFromIngest } from "./ingest-build.js";

export { MAX_CHARS };
const BATCH = 11000; // parseContent reads at most 12000 characters per call
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

const OPTION = /^\s*[*✓✔]?\s*\(?([A-Ha-h])[).:]\s+(.+)$/;
const NUMBERED = /^\s*(?:q(?:uestion)?\s*)?(\d{1,2})[).:]\s+(.+)$/i;
const ANSWER = /^\s*(?:answer|ans|key|correct|respuesta|clave)\s*[:=]\s*(.+)$/i;
const BULLET = /^\s*[-*•]\s+\S/;
const MARK_START = /^\s*[*✓✔]/;
const MARK_END = /[*✓✔]\s*$/;
const KEY_HEAD = /^\s*(?:answer\s*key|answers|answer\s*sheet|clave de respuestas)\s*:?\s*$/i;
const KEY_ENTRY = /(\d{1,2})\s*[).:\-–]\s*\(?([A-Ha-h])\)?(?![A-Za-z])/g;
const WRITE =
  /^\s*(?:\d{1,2}[).]\s*)?(?:write|explain|describe|discuss|tell|compose|summarize|respond|compare)\b/i;
const STEPS_HEAD = /\b(?:steps?|order|sequence|procedure|directions|how to)\b/i;
const VOCAB_HEAD =
  /^(?:term|terms|word|words|vocabulary|vocab|definition|definitions|meaning|meanings|palabra|significado)$/i;
const PAIR = /^(.{1,60}?)\s*(?:\t+|\s[-–—]\s|:\s|=\s)\s*(.{1,200})$/;
const STRONG_SEP = /\t|\s[-–—]\s|:\s|=\s|\|/;

const fail = (error) => ({ ok: false, error });
const cleanName = (n) =>
  String(n ?? "")
    .replace(/^.*[\\/]/, "")
    .replace(CONTROL, "")
    .trim()
    .slice(0, 120);
const wc = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const joined = (L) => L.map((l) => l.t.trim()).join(" ");

function toLines(src) {
  return src
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((t, i) => ({ n: i + 1, t: t.replace(/[  ]+$/, "") }));
}

/** An answer key section at the end ("Answer Key" then "1. b  2. c"): { body, key: Map(number -> letter) }. */
function splitKey(lines, S) {
  const at = lines.findIndex((l) => KEY_HEAD.test(l.t));
  if (at < 0) return { body: lines, key: new Map() };
  const key = new Map();
  for (const l of lines.slice(at + 1))
    for (const m of l.t.matchAll(KEY_ENTRY)) key.set(Number(m[1]), m[2].toLowerCase());
  if (!key.size) S.flag(R.keyUnread, "key-unread", [lines[at].n, lines.at(-1).n]);
  return { body: lines.slice(0, at), key };
}

/** Paragraphs by blank lines; a numbered line right after a choice or answer line starts a new question. */
function groupsOf(lines, headings) {
  const out = [];
  let cur = [];
  const flush = () => {
    if (cur.length) out.push({ lines: cur });
    cur = [];
  };
  for (const l of lines) {
    if (!l.t.trim()) flush();
    else if (headings?.has(l.n)) {
      flush();
      out.push({ lines: [l], heading: headings.get(l.n) });
    } else {
      const prev = cur.at(-1);
      if (prev && NUMBERED.test(l.t) && (OPTION.test(prev.t) || ANSWER.test(prev.t))) flush();
      cur.push(l);
    }
  }
  flush();
  return out;
}

/** Collects items and review entries; ids are assigned once everything is in source order. */
function collector() {
  const S = { items: [], review: [], claimed: new Set(), key: new Map() };
  S.claim = (a, b) => {
    for (let n = a; n <= b; n++) S.claimed.add(n);
  };
  S.add = (item, lines) => {
    item.lines = lines;
    S.claim(lines[0], lines[1]);
    S.items.push(item);
    return item;
  };
  S.flag = (reason, code, lines, item = null) => S.review.push({ reason, code, lines, item });
  return S;
}

// ── choice questions ────────────────────────────────────────────────────────

/** The letter an Answer line names: a letter, or the exact text of one choice. "" if neither, "multi" if several. */
function answerLetter(raw, opts) {
  const v = raw.trim();
  if (/^\(?[A-Ha-h]\)?\s*(?:,|;|&|\/|\band\b|\by\b)\s*\(?[A-Ha-h]\b/i.test(v)) return "multi";
  const m = v.match(/^\(?([A-Ha-h])\)?(?:[\s).:,-]|$)/);
  if (m && opts.some((o) => o.letter === m[1].toLowerCase())) return m[1].toLowerCase();
  const same = opts.find((o) => o.text.trim().toLowerCase() === v.toLowerCase());
  return same ? same.letter : "";
}

function resolveAnswerFor(opts, ansRaw, keyed) {
  const marked = opts.filter((o) => o.mark);
  if (marked.length > 1) return { problem: ["two-marks", R.twoMarks] };
  const fromAns = ansRaw == null ? undefined : answerLetter(ansRaw, opts);
  if (fromAns === "multi") return { problem: ["multi-answer", R.multi] };
  if (marked[0] && fromAns && fromAns !== marked[0].letter)
    return { problem: ["answer-conflict", R.conflict] };
  if (marked[0]) return { letter: marked[0].letter, source: "mark" };
  if (fromAns) return { letter: fromAns, source: "answer-line" };
  if (ansRaw != null) return { problem: ["bad-answer-line", R.badAnswer] };
  if (keyed) {
    if (opts.some((o) => o.letter === keyed)) return { letter: keyed, source: "key" };
    return { problem: ["key-mismatch", R.keyMiss] };
  }
  return { problem: ["unmarked", R.unmarked] };
}

function choiceGroup(g, S) {
  const L = g.lines;
  const span = [L[0].n, L.at(-1).n];
  const first = L.findIndex((l) => OPTION.test(l.t));
  if (first === 0) return S.flag(R.noStem, "no-stem", span);
  let ansRaw = null;
  const opts = [];
  const body = [];
  for (const l of L.slice(first)) {
    const a = l.t.match(ANSWER);
    const o = l.t.match(OPTION);
    if (a) ansRaw = a[1];
    else {
      body.push(l.t);
      if (o)
        opts.push({
          letter: o[1].toLowerCase(),
          text: o[2],
          mark: MARK_START.test(l.t) || MARK_END.test(l.t),
        });
    }
  }
  if (opts.length < 2) return S.flag(R.oneOption, "one-option", span);
  if (opts.some((o, i) => o.letter !== String.fromCharCode(97 + i)))
    return S.flag(R.missingOption, "missing-option", span);
  const q = parseContent([joined(L.slice(0, first)), ...body].join("\n")).questions[0];
  if (!q || q.options.length !== opts.length) return S.flag(R.unreadable, "unreadable", span);
  const num = L[0].t.match(NUMBERED)?.[1];
  const res = resolveAnswerFor(opts, ansRaw, num ? S.key.get(Number(num)) : undefined);
  const idx = res.letter ? opts.findIndex((o) => o.letter === res.letter) : -1;
  const item = S.add(
    {
      type: "question",
      format: "choice",
      number: num ? Number(num) : null,
      prompt: q.prompt,
      options: q.options,
      answer: idx >= 0 ? q.options[idx].id : "",
      answerSource: res.source || "",
      confidence: res.problem ? "review" : "high",
    },
    span,
  );
  if (res.problem) S.flag(res.problem[1], res.problem[0], span, item);
}

// ── tables and word lists written with tabs ─────────────────────────────────

const modal = (counts) => {
  const tally = new Map();
  for (const c of counts) tally.set(c, (tally.get(c) || 0) + 1);
  return [...tally].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
};

function tabGroup(g, S, hints) {
  const rows = g.lines.map((l) => ({ n: l.n, cells: l.t.split("\t").map((c) => c.trim()) }));
  const span = [rows[0].n, rows.at(-1).n];
  const k = modal(rows.map((r) => r.cells.length));
  const odd = rows.filter((r) => r.cells.length !== k);
  const head = rows[0].cells.length === k && rows[0].cells.every((c) => VOCAB_HEAD.test(c));
  const numeric = rows.every((r) => r.cells.every((c) => /^[\d\s.,/%$-]*$/.test(c)));
  const asVocab = k === 2 && !numeric && (head || !hints.tabsAreTables);
  if (!asVocab) {
    const header = rows[0].cells;
    const titled = header.every((c) => c && !/^[\d\s.,/%$-]+$/.test(c));
    const item = S.add(
      {
        type: "table",
        headers: header,
        rows: rows.slice(1).map((r) => r.cells),
        confidence: titled && !odd.length ? "high" : "review",
      },
      span,
    );
    if (odd.length) S.flag(R.uneTable, "uneven-columns", [odd[0].n, odd.at(-1).n], item);
    if (!titled) S.flag(R.header, "header-guess", [rows[0].n, rows[0].n], item);
    return;
  }
  const use = rows.filter((r) => r.cells.length === 2 && !(head && r === rows[0]));
  const items = [];
  for (const r of use) {
    if (!r.cells[0] || !r.cells[1]) S.flag(R.emptyCell, "empty-cell", [r.n, r.n]);
    else items.push({ term: r.cells[0], def: r.cells[1], es: "", line: r.n });
  }
  for (const r of odd) S.flag(R.uneven, "uneven-columns", [r.n, r.n]);
  if (items.length)
    S.add({ type: "vocab", items, confidence: "high" }, [items[0].line, items.at(-1).line]);
}

// ── small structures found per paragraph ────────────────────────────────────

const shortQ = (prompt, number) => ({
  type: "question",
  format: "short",
  kind: /^(?:why|how|explain|describe)\b/i.test(prompt) ? "explain" : "write",
  number,
  prompt,
  confidence: "high",
});

/** "Match ..." paragraph (or one under a Match heading): every pair line is a left/right pair. */
function matchGroup(g, S) {
  const L = g.lines;
  const head = /^\s*match\b/i.test(L[0].t) && (wc(L[0].t) >= 4 || /:$/.test(L[0].t));
  const body = head ? L.slice(1) : L;
  // Under an explicit "Match ..." heading a single word on each side is a pair (parseContent's word-list rule wants
  // a multi-word meaning, which is right for vocabulary but not for synonyms).
  const pairs = [];
  const bad = [];
  for (const l of body) {
    const m = l.t.replace(/^\s*(?:[-*•]|\d{1,2}[).])\s+/, "").match(PAIR);
    if (m) pairs.push({ left: m[1].trim(), right: m[2].trim(), line: l.n });
    else bad.push(l.n);
  }
  if (pairs.length < 2) return false;
  for (const n of bad) S.flag(R.badPair, "bad-pair", [n, n]);
  const key = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const dup =
    new Set(pairs.map((p) => key(p.left))).size !== pairs.length ||
    new Set(pairs.map((p) => key(p.right))).size !== pairs.length;
  const item = S.add({ type: "pairs", pairs, confidence: dup ? "review" : "high" }, [
    L[0].n,
    L.at(-1).n,
  ]);
  if (dup) S.flag(R.dupPair, "dup-pair", item.lines, item);
  return true;
}

/** "Stem ____ / Answer: x" and "Question? / Answer: 7": the teacher's own answer is used, nothing else. */
function stemAnswer(g, S) {
  const L = g.lines;
  if (L.length > 2 || (L.length === 2 && !ANSWER.test(L[1].t))) return false;
  const stem = L[0].t.match(NUMBERED)?.[2] ?? L[0].t.trim();
  const blank = /_{3,}/.test(stem);
  const span = [L[0].n, L.at(-1).n];
  if (L.length === 1) {
    if (!blank) return false;
    S.flag(R.blankNoAnswer, "blank-no-answer", span);
    return true;
  }
  const ans = L[1].t.match(ANSWER)[1].trim();
  const num = L[0].t.match(NUMBERED)?.[1];
  const number = num ? Number(num) : null;
  if (blank && (stem.match(/_{3,}/g) || []).length > 1) {
    S.flag(R.blankMany, "blank-many", span);
    return true;
  }
  if (blank)
    S.add(
      {
        type: "question",
        format: "blank",
        number,
        prompt: "",
        text: stem.replace(/_{3,}/, `[[${ans}]]`),
        confidence: "high",
      },
      span,
    );
  else if (parseNumber(ans))
    S.add(
      {
        type: "question",
        format: "number",
        number,
        prompt: stem,
        answer: ans,
        accept: [],
        unit: "",
        confidence: "high",
      },
      span,
    );
  else S.add({ ...shortQ(stem, number), sample: ans }, span);
  return true;
}

/** Numbered lists: questions ending "?" are written responses; other lists of 3+ are steps (flagged for review). */
function numberedGroup(g, S, headCtx) {
  const L = g.lines;
  if (!L.every((l) => NUMBERED.test(l.t))) return false;
  if (L.every((l) => l.t.trim().endsWith("?"))) {
    for (const l of L) {
      const m = l.t.match(NUMBERED);
      S.add(shortQ(m[2].trim(), Number(m[1])), [l.n, l.n]);
    }
    return true;
  }
  if (L.length < 3 || L.some((l) => l.t.trim().endsWith("?"))) return false;
  if (parseContent(L.map((l) => l.t).join("\n")).problems.length) return false;
  const sure = STEPS_HEAD.test(headCtx);
  const span = [L[0].n, L.at(-1).n];
  const item = S.add(
    {
      type: "sequence",
      steps: L.map((l) => ({ text: l.t.match(NUMBERED)[2].trim(), line: l.n })),
      confidence: sure ? "high" : "review",
    },
    span,
  );
  if (!sure) S.flag(R.steps, "steps-guess", span, item);
  return true;
}

function smallGroup(g, S, headCtx) {
  const L = g.lines;
  const span = [L[0].n, L.at(-1).n];
  if (stemAnswer(g, S) || numberedGroup(g, S, headCtx)) return true;
  if (L.length === 1 && L[0].t.trim().endsWith("?") && wc(L[0].t) >= 3) {
    S.add(shortQ(L[0].t.trim(), null), span);
    return true;
  }
  if (L.length <= 3 && WRITE.test(L[0].t) && wc(joined(L)) <= 60) {
    S.add({ ...shortQ(joined(L).replace(/^\d{1,2}[).]\s*/, ""), null), kind: "write" }, span);
    return true;
  }
  const bullets = L.length >= 2 && L.every((l) => BULLET.test(l.t));
  if (bullets && L.filter((l) => STRONG_SEP.test(l.t)).length < 2) {
    S.add(
      {
        type: "list",
        items: L.map((l) => l.t.replace(/^\s*[-*•]\s+/, "").trim()),
        confidence: "high",
      },
      span,
    );
    return true;
  }
  return false;
}

// ── everything else goes through parseContent ───────────────────────────────

function locator(lines) {
  const norm = (s) => s.toLowerCase().replace(/\s+/g, " ");
  const N = lines.map((l) => norm(l.t));
  let cur = 0;
  return (needles, advance = true) => {
    const want = needles.map(norm).filter(Boolean);
    for (const from of [cur, 0])
      for (let i = from; i < N.length; i++)
        if (want.every((w) => N[i].includes(w))) {
          if (advance) cur = i + 1;
          return lines[i].n;
        }
    return null;
  };
}

function restBatch(groups, S) {
  const lines = groups.flatMap((g) => g.lines);
  const res = parseContent(groups.map((g) => g.lines.map((l) => l.t).join("\n")).join("\n\n"));
  const at = locator(lines);
  const first = lines[0].n;
  if (res.vocab.length) {
    const items = res.vocab.map((v) => {
      const line = at([v.term, v.def.slice(0, 24)]) ?? first;
      const src = lines.find((l) => l.n === line)?.t ?? "";
      return { term: v.term, def: v.def, es: v.es, line, weak: !STRONG_SEP.test(src) };
    });
    const weak = items.some((v) => v.weak);
    for (const v of items) delete v.weak;
    const item = S.add({ type: "vocab", items, confidence: weak ? "review" : "high" }, [
      items[0].line,
      items.at(-1).line,
    ]);
    if (weak) S.flag(R.comma, "comma-vocab", item.lines, item);
  }
  for (const p of res.problems) {
    const line = at([p.expr]) ?? first;
    const src = lines.find((l) => l.n === line)?.t ?? "";
    const sure = /[=?]|[+×÷*]|\b(?:solve|compute|calculate|find|evaluate|simplify)\b/i.test(src);
    const item = S.add({ ...p, number: null, confidence: sure ? "high" : "review" }, [line, line]);
    if (!sure) S.flag(R.bare, "bare-expression", item.lines, item);
  }
  if (res.sequence.length) {
    const steps = res.sequence.map((t) => ({ text: t, line: at([t]) ?? first }));
    S.add({ type: "sequence", steps, confidence: "high" }, [steps[0].line, steps.at(-1).line]);
  }
  if (res.categories.length) {
    const cats = res.categories.map((c) => ({ ...c, line: at([c.label]) ?? first }));
    const last = Math.max(...cats.map((c) => at([c.items.at(-1)], false) ?? c.line));
    const item = S.add({ type: "categories", categories: cats, confidence: "review" }, [
      cats[0].line,
      last,
    ]);
    S.flag(R.groups, "groups-guess", item.lines, item);
  }
  const left = lines.filter((l) => !S.claimed.has(l.n));
  if (res.passage && left.length)
    S.add({ type: "passage", text: res.passage, confidence: "high" }, [left[0].n, left.at(-1).n]);
  else {
    let run = [];
    const out = () => {
      if (run.length) S.flag(R.stray, "unclassified", [run[0].n, run.at(-1).n]);
      run = [];
    };
    for (const l of left) {
      if (run.length && l.n !== run.at(-1).n + 1) out();
      run.push(l);
    }
    out();
  }
}

// ── entry points ────────────────────────────────────────────────────────────

/** Where the text came from, never what it says. */
function provenanceOf(opts, src, lines) {
  const name = cleanName(opts.filename);
  const type =
    opts.type || (name.includes(".") ? name.split(".").pop().toLowerCase().slice(0, 8) : "pasted");
  return {
    name: name || "pasted text",
    type,
    bytes: Number.isFinite(opts.bytes) ? opts.bytes : new TextEncoder().encode(src).length,
    lines: lines.length,
  };
}

/** Read pasted or extracted text. @returns {{ok:true, blocks, suggestions, review, provenance} | {ok:false, error}} */
export function ingestText(text, opts = {}) {
  const hints = opts.hints || {};
  let src = String(text ?? "").replace(CONTROL, "");
  const cut = src.length > MAX_CHARS;
  if (cut) src = src.slice(0, MAX_CHARS);
  if (!src.trim()) return fail(NO_TEXT);
  const lines = toLines(src);
  const S = collector();
  if (cut) S.flag(R.truncated, "truncated", [lines.at(-1).n, lines.at(-1).n]);
  const { body, key } = splitKey(lines, S);
  S.key = key;
  let headCtx = "";
  const rest = [];
  for (const g of groupsOf(body, hints.headings)) {
    const text0 = g.lines[0].t.trim();
    if (g.heading) {
      S.add({ type: "heading", text: text0, level: g.heading, confidence: "high" }, [
        g.lines[0].n,
        g.lines[0].n,
      ]);
      headCtx = text0;
      continue;
    }
    const tabbed = g.lines.filter((l) => l.t.includes("\t")).length;
    if (tabbed >= 2 && tabbed >= g.lines.length * 0.6) tabGroup(g, S, hints);
    else if (g.lines.some((l) => OPTION.test(l.t))) choiceGroup(g, S);
    else if ((/^\s*match\b/i.test(text0) || /match/i.test(headCtx)) && matchGroup(g, S)) {
      /* handled */
    } else if (!smallGroup(g, S, headCtx)) rest.push(g);
    if (!g.heading && !/match/i.test(text0)) headCtx = "";
  }
  let batch = [];
  let size = 0;
  for (const g of rest) {
    const n = g.lines.reduce((a, l) => a + l.t.length + 1, 0);
    if (batch.length && size + n > BATCH) {
      restBatch(batch, S);
      batch = [];
      size = 0;
    }
    batch.push(g);
    size += n;
  }
  if (batch.length) restBatch(batch, S);

  const blocks = S.items.sort((a, b) => a.lines[0] - b.lines[0] || a.lines[1] - b.lines[1]);
  blocks.forEach((b, i) => {
    b.id = `ing${i + 1}`;
  });
  const review = S.review
    .sort((a, b) => a.lines[0] - b.lines[0])
    .map((r, i) => ({
      id: `rv${i + 1}`,
      itemId: r.item?.id || "",
      code: r.code,
      lines: r.lines,
      reason: r.reason,
    }));
  return {
    ok: true,
    blocks,
    suggestions: suggestions(blocks),
    review,
    provenance: provenanceOf(opts, src, lines),
  };
}

/**
 * PDF files are not read in this build: there is no PDF library and none may be added, and a scanned PDF would need
 * text recognition. This says so plainly and offers the path that works, instead of pretending to extract anything.
 */
export function ingestPdf() {
  return {
    ok: false,
    code: "pdf-unavailable",
    error: pair(
      "Reading PDF files is not available in this version, so nothing was read from it (this includes scanned PDFs). Open the PDF, select the text, copy it, and paste it into the text box. A Word (.docx) file also works.",
      "La lectura de archivos PDF no está disponible en esta versión, así que no se leyó nada del archivo (incluidos los PDF escaneados). Abre el PDF, selecciona el texto, cópialo y pégalo en el cuadro de texto. Un archivo de Word (.docx) también funciona.",
    ),
  };
}

const ANSWER_CODES = new Set(["unmarked", "two-marks", "answer-conflict", "bad-answer-line", "multi-answer", "key-mismatch"]);

/**
 * The teacher picks the correct choice for a question that had no usable answer. Returns a new result (the input is not
 * changed); an unknown item or letter returns the result untouched. The choice is the teacher's, never inferred.
 */
export function resolveAnswer(result, itemId, letter) {
  const item = result.blocks.find((b) => b.id === itemId && b.format === "choice");
  const at = String(letter ?? "").toLowerCase().charCodeAt(0) - 97;
  if (!item || !(at >= 0 && at < item.options.length)) return result;
  const blocks = result.blocks.map((b) =>
    b === item ? { ...b, answer: item.options[at].id, answerSource: "teacher", confidence: "high" } : b,
  );
  const review = result.review.filter((r) => !(r.itemId === itemId && ANSWER_CODES.has(r.code)));
  return { ...result, blocks, review, suggestions: suggestions(blocks) };
}
