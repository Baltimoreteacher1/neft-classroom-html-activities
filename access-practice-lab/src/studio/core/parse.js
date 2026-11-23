// "Add My Content": understand what a teacher pasted or typed. Deterministic, offline, no model.
//
// parseContent(text) finds, in this order of confidence: multiple-choice questions with a marked answer, arithmetic
// problems, vocabulary lines (term - meaning), categorized lists, a sequence of steps, and reading passages. It
// returns what it found plus plain-language `notes` about anything it could not use, so nothing is silently dropped
// and nothing is guessed. Math answers are computed with exact arithmetic, never trusted from the text alone.

import { evalExpr, ratToString } from "./math.js";
import { clip } from "./schema.js";

const lines = (text) =>
  String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/g, ""));

const OPTION = /^\s*[*✓✔]?\s*\(?([A-Ha-h])[).:]\s+(.+)$/;
const NUMBERED = /^\s*(?:q(?:uestion)?\s*)?(\d{1,2})[).:]\s+(.+)$/i;
const ANSWER_LINE = /^\s*(?:answer|ans|key|correct)\s*[:=]\s*(.+)$/i;
const MARKED = /^\s*[*✓✔]\s*|\s*[*✓✔]\s*$/;
const STEP_WORDS =
  /^\s*(?:step\s*\d+\s*[:.-]|first\b|next\b|then\b|after that\b|finally\b|last\b|second\b|third\b)/i;

const stripMarks = (s) => s.replace(MARKED, "").trim();

/** Split into paragraphs separated by blank lines. */
function paragraphs(text) {
  const out = [];
  let cur = [];
  for (const l of lines(text)) {
    if (!l.trim()) {
      if (cur.length) out.push(cur);
      cur = [];
    } else cur.push(l);
  }
  if (cur.length) out.push(cur);
  return out;
}

/** A question block with lettered options, e.g. "1. Which is prime?\n a) 4\n *b) 7\n c) 9". */
function parseChoice(group) {
  const first = group[0].match(NUMBERED);
  const prompt = (first ? first[2] : group[0]).trim();
  const opts = [];
  let answerLetter = "";
  for (const l of group.slice(1)) {
    const a = l.match(ANSWER_LINE);
    if (a) {
      answerLetter = a[1]
        .trim()
        .replace(/[^A-Za-z]/g, "")
        .slice(0, 1)
        .toLowerCase();
      continue;
    }
    const m = l.match(OPTION);
    if (m) {
      const marked = MARKED.test(m[2]) || /^\s*[*✓✔]/.test(l);
      const text = stripMarks(m[2]);
      opts.push({ letter: m[1].toLowerCase(), text, marked });
    } else if (opts.length) opts[opts.length - 1].text += ` ${l.trim()}`;
    else return null;
  }
  if (opts.length < 2) return null;
  const marked = opts.find((o) => o.marked);
  const keyed = marked || opts.find((o) => o.letter === answerLetter);
  return {
    type: "question",
    format: "choice",
    prompt,
    options: opts.map((o, i) => ({ id: `o${i + 1}`, text: o.text })),
    answer: keyed ? `o${opts.indexOf(keyed) + 1}` : "",
    needsAnswer: !keyed,
  };
}

/** "3/4 + 1/2 = ?", "Solve: 12 ÷ 4", "6 × 7 =". The answer is computed here, not copied. */
function parseProblem(line) {
  const m = line.match(/^\s*(?:\d{1,2}[).]\s+)?(?:solve|compute|calculate|find|evaluate|simplify)?\s*:?\s*([-+*/÷×^().\d\s{}]+?)\s*(?:=\s*\??\s*|\?)?\s*$/i);
  if (!m) return null;
  const expr = m[1].trim();
  if (!/\d/.test(expr) || !/[-+*/÷×^]/.test(expr.replace(/^-/, ""))) return null;
  const value = evalExpr(expr);
  if (!value) return null;
  const fractional = /\d\s*\/\s*\d/.test(expr);
  const shown = expr.replace(/(\d+)\s*\/\s*(\d+)/g, "{$1/$2}").replace(/\*/g, "×");
  return { type: "question", format: "number", prompt: `Solve: ${shown}`, expr, answer: ratToString(value, fractional ? "auto" : "decimal"), accept: [], unit: "" };
}

/** term - meaning, term: meaning, term = meaning, term<TAB>meaning, "term, meaning". Optional: term | es | meaning. */
function parseVocabLine(line) {
  const clean = line.replace(/^\s*(?:[-*•]|\d{1,2}[).])\s+/, "").trim();
  if (!clean || clean.length > 240) return null;
  const pipe = clean.split("|").map((s) => s.trim());
  if (pipe.length === 3 && pipe.every(Boolean)) return { term: pipe[0], es: pipe[1], def: pipe[2] };
  const m = clean.match(/^([^:=\t–—-]{1,48}?)\s*(?:\t+|\s[-–—]\s|:\s|=\s|,\s)\s*(.{3,})$/);
  if (!m) return null;
  const term = m[1].trim();
  const def = m[2].trim();
  if (term.split(/\s+/).length > 4 || def.split(/\s+/).length < 2 || /[.?!]$/.test(term))
    return null;
  return { term, def, es: "" };
}

function categories(paras) {
  const out = [];
  for (const g of paras) {
    const head = g[0].match(/^\s*([A-Za-z][^:]{0,40}):\s*(.*)$/);
    if (!head) continue;
    const inline = head[2]
      ? head[2]
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const rest = g
      .slice(1)
      .map((l) => l.replace(/^\s*(?:[-*•]|\d+[).])\s*/, "").trim())
      .filter(Boolean);
    const items = [...inline, ...rest];
    if (items.length >= 2 && items.every((i) => i.split(/\s+/).length <= 5))
      out.push({ label: head[1].trim(), items });
  }
  return out.length >= 2 ? out : [];
}

/**
 * @returns {{ vocab: {term:string,def:string,es:string}[], questions: object[], problems: object[], passage: string,
 *   sequence: string[], categories: {label:string,items:string[]}[], notes: string[], shape: string }}
 */
export function parseContent(text) {
  const src = clip(text, 12000);
  const notes = [];
  const result = {
    vocab: [],
    questions: [],
    problems: [],
    passage: "",
    sequence: [],
    categories: [],
    notes,
    shape: "empty",
  };
  if (!src.trim()) return result;

  const paras = paragraphs(src);
  const used = new Set();

  paras.forEach((g, i) => {
    if (g.length >= 3 && OPTION.test(g[1])) {
      const q = parseChoice(g);
      if (q) {
        result.questions.push(q);
        used.add(i);
        if (q.needsAnswer)
          notes.push(
            `Question "${q.prompt.slice(0, 40)}": mark the correct answer with * before it, or add "Answer: B".`,
          );
      }
    }
  });

  result.categories = categories(paras.filter((_, i) => !used.has(i)));
  if (result.categories.length)
    paras.forEach(
      (g, i) =>
        !used.has(i) &&
        /^\s*[A-Za-z][^:]{0,40}:\s*/.test(g[0]) &&
        g.length >= 1 &&
        result.categories.some((c) => c.label === g[0].split(":")[0].trim()) &&
        used.add(i),
    );

  let rest = paras.filter((_, i) => !used.has(i)).flat();
  if (!result.categories.length) {
    const cat = rest.map((l) => l.match(/^\s*([A-Za-z][^:]{0,40}):\s*(.+)$/)).map((m) => (m ? { label: m[1].trim(), items: m[2].split(/[,;]/).map((x) => x.trim()).filter(Boolean) } : null));
    const good = cat.filter((c) => c && c.items.length >= 2 && c.items.every((i) => i.split(/\s+/).length <= 4));
    if (good.length >= 2 && good.length >= rest.length * 0.6) {
      result.categories = good;
      rest = rest.filter((_, i) => !cat[i] || !good.includes(cat[i]));
    }
  }
  const stepLines = rest.filter((l) => STEP_WORDS.test(l));
  if (stepLines.length >= 3 && stepLines.length >= rest.length * 0.6) {
    result.sequence = stepLines.map((l) => l.replace(/^\s*step\s*\d+\s*[:.-]\s*/i, "").trim());
    rest = rest.filter((l) => !STEP_WORDS.test(l));
  }
  const vocab = [];
  const stray = [];
  for (const l of rest) {
    const p = parseProblem(l);
    if (p) {
      result.problems.push(p);
      continue;
    }
    const v = parseVocabLine(l);
    if (v) vocab.push(v);
    else stray.push(l);
  }
  if (vocab.length >= 2) result.vocab = vocab;
  else stray.unshift(...vocab.map((v) => `${v.term} - ${v.def}`));
  const passage = stray.join(" ").replace(/\s+/g, " ").trim();
  if (passage.split(/\s+/).length >= 25) result.passage = passage;
  else if (passage) notes.push(`Could not use: "${passage.slice(0, 60)}${passage.length > 60 ? "…" : ""}". Put words as "word - meaning", one per line.`);

  const found = [
    result.questions.length && "questions",
    result.problems.length && "problems",
    result.vocab.length && "vocab",
    result.categories.length && "categories",
    result.sequence.length && "sequence",
    result.passage && "passage",
  ].filter(Boolean);
  result.shape = found[0] || "empty";
  if (result.problems.length && result.problems.length < 2 && found.length === 1)
    notes.push("Add a few more problems for a full practice set.");
  return result;
}

/** Sentences of a passage, for cloze and ordering items. */
export function sentencesOf(passage) {
  return (
    String(passage ?? "")
      .replace(/\s+/g, " ")
      .match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)
      ?.map((s) => s.trim())
      .filter((s) => s.split(" ").length >= 3) ?? []
  );
}
