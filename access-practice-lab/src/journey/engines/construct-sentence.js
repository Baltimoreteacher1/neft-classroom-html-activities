// Language Construction Engine, sentence modules: expand and combine.
// Pure logic, no DOM. The engine never compares a learner's sentence with one stored answer: it tests the
// relation a sentence builds (a connector doing the job, the base idea kept, new content words, kept terms)
// and every observation points at a span of the learner's own text. Contract: access-practice-lab/JOURNEY.md.
import { analyzeResponse } from "../../lang/analyze.js";
import { CONNECTORS } from "../../lang/lexicon.js";
import { diffWords, sentences, tokenize } from "../../lang/text.js";
import { EXTRA, T, STRUCTURE_LABEL, clausesAround, findConnectors, hasContent, isContent, norm, relationship, sameStem, spanOf, termHits } from "./construct-links.js";

export { compareConnectors, meaningChange, swapPreview, findConnectors, relationship } from "./construct-links.js";

// ── expand ───────────────────────────────────────────────────────────────────
const HOW_NOT = new Set([
  "only",
  "family",
  "early",
  "apply",
  "supply",
  "reply",
  "belly",
  "rely",
  "italy",
  "july",
]);

/** Label every learner token "same" or "add" against the base sentence (diffWords on normalised words). */
function alignAdded(base, toks) {
  const ops = diffWords(
    tokenize(base)
      .map((t) => t.lower)
      .join(" "),
    toks.map((t) => t.lower).join(" "),
  );
  const labels = [];
  for (const op of ops) {
    if (op.op === "del") continue;
    for (let i = 0; i < op.text.split(" ").length; i++) labels.push(op.op);
  }
  return labels;
}

function baseCheck(base, toks) {
  const stems = [
    ...new Set(
      tokenize(base)
        .filter(isContent)
        .map((t) => norm(t.lower)),
    ),
  ];
  const learner = toks.map((t) => ({ n: norm(t.lower), t }));
  const kept = stems.filter((b) => learner.some((l) => sameStem(b, l.n)));
  const need = stems.length <= 1 ? stems.length : Math.ceil(stems.length * 0.6);
  const evidence = learner
    .filter((l) => stems.some((b) => sameStem(b, l.n)))
    .map((l) => spanOf(l.t));
  return {
    met: kept.length >= need && kept.length > 0,
    kept,
    missing: stems.filter((b) => !kept.includes(b)),
    evidence,
    stems,
  };
}

const needTag = (n) =>
  n.tag || (n.test?.connectorJob ? "cause" : n.id === "how" ? "how" : "detail");

function evalNeed(n, ctx) {
  const { text, toks, labels, rel } = ctx;
  const test = n.test || {};
  const base = { id: n.id, label: n.label, tag: needTag(n) };
  const isNew = (span) => labels[toks.findIndex((t) => t.start >= span.start)] === "add";
  if (test.connectorJob) {
    const hits = findConnectors(text, test.connectorJob);
    if (!hits.length)
      return {
        ...base,
        met: false,
        evidence: [],
        hint: T(
          "Which small word tells your reader WHY? Add it, then say the reason.",
          "¿Qué palabrita le dice al lector POR QUÉ? Agrégala y luego di la razón.",
        ),
      };
    if (test.connectorJob === "cause") {
      const rels = hits.map((h) => relationship(text, h));
      const r = rels.find((x) => x.complete) || rels[0];
      const ev = [{ start: r.connector.start, end: r.connector.end, text: r.connector.text }];
      if (!hasContent(r.cause))
        return {
          ...base,
          met: false,
          evidence: ev,
          hint: T(
            "Your linking word needs a reason. What made it happen?",
            "Tu palabra de enlace necesita una razón. ¿Qué lo hizo pasar?",
          ),
        };
      if (!hasContent(r.effect))
        return {
          ...base,
          met: false,
          evidence: ev,
          hint: T("Say what happened because of that reason.", "Di qué pasó por esa razón."),
        };
      return { ...base, met: true, evidence: ev };
    }
    return {
      ...base,
      met: true,
      evidence: hits.slice(0, 1).map(({ start, end, text: t }) => ({ start, end, text: t })),
    };
  }
  if (test.terms) {
    const ev = test.terms.flatMap((term) => termHits(text, toks, term)).filter(isNew);
    const sorted = ev
      .sort((a, b) => a.start - b.start)
      .filter((s, i, a) => i === 0 || s.start >= a[i - 1].end);
    return {
      ...base,
      met: sorted.length > 0,
      evidence: sorted.slice(0, 3),
      hint: T(
        `Not yet: “${n.label}”. Which words in your sentence do that?`,
        `Todavía no: “${n.label}”. ¿Qué palabras de tu oración lo hacen?`,
      ),
    };
  }
  const need = Number(test.minNew);
  const ev = ctx.newWords.map((w) => ({ start: w.start, end: w.end, text: w.text }));
  return {
    ...base,
    met: ev.length >= need,
    evidence: ev,
    hint: T(
      `Add ${need} or more new words that tell more about the idea.`,
      `Agrega ${need} palabras nuevas o más que cuenten más sobre la idea.`,
    ),
  };
}

/** Tag each new word (cause / how / detail) and group runs of one tag into chips: [{ text, start, end, tag }]. */
function addedChunks(text, toks, labels, needs, rel, newSet) {
  const tags = toks.map(() => null);
  const inSpan = (t, s) => s && t.start >= s.start && t.end <= s.end;
  toks.forEach((t, i) => {
    if (labels[i] !== "add") return;
    const stop = !isContent(t);
    const conn = rel && inSpan(t, rel.connector);
    const need = needs.find((n) => n.tag !== "cause" && n.evidence.some((e) => inSpan(t, e)));
    if (conn) tags[i] = "cause";
    else if (need) tags[i] = need.tag;
    else if (!stop && rel && inSpan(t, rel.cause)) tags[i] = "cause";
    else if (!stop && /ly$/.test(t.lower) && t.lower.length > 4 && !HOW_NOT.has(t.lower))
      tags[i] = "how";
    else if (!stop && newSet.has(norm(t.lower))) tags[i] = "detail";
  });
  // stop words take the tag of their neighbours inside one run of added words
  for (let i = 0; i < toks.length; i++) {
    if (labels[i] !== "add" || tags[i]) continue;
    let l = i - 1;
    while (l >= 0 && labels[l] === "add" && !tags[l]) l--;
    let r = i + 1;
    while (r < toks.length && labels[r] === "add" && !tags[r]) r++;
    const left = l >= 0 && labels[l] === "add" ? tags[l] : null;
    const right = r < toks.length && labels[r] === "add" ? tags[r] : null;
    tags[i] = left && right && left === right ? left : right || left || "detail";
  }
  const out = [];
  toks.forEach((t, i) => {
    if (!tags[i]) return;
    const last = out[out.length - 1];
    if (last && last.tag === tags[i] && last.lastIndex === i - 1) {
      last.end = t.end;
      last.lastIndex = i;
    } else out.push({ tag: tags[i], start: t.start, end: t.end, lastIndex: i });
  });
  return out.map(({ tag, start, end }) => ({ tag, start, end, text: text.slice(start, end) }));
}

/** Evaluate a learner's expanded sentence against an expand task (use resolveTask for the transfer item). */
export function evaluateExpand(task, input) {
  const text = String(typeof input === "string" ? input : input?.text || "");
  const toks = tokenize(text);
  const labels = alignAdded(task.base, toks);
  const baseKept = baseCheck(task.base, toks);
  const baseStems = new Set(baseKept.stems);
  const seen = new Set();
  const newWords = toks.filter((t, i) => {
    const n = norm(t.lower);
    if (
      labels[i] !== "add" ||
      !isContent(t) ||
      [...baseStems].some((b) => sameStem(b, n)) ||
      seen.has(n)
    )
      return false;
    seen.add(n);
    return true;
  });
  const causeHits = findConnectors(text, "cause");
  const rels = causeHits.map((h) => relationship(text, h));
  const rel = rels.find((r) => r.complete) || rels[0] || null;
  const ctx = { text, toks, labels, rel, newWords };
  const needs = task.needs.map((n) => evalNeed(n, ctx));
  const added = addedChunks(
    text,
    toks,
    labels,
    needs,
    rel,
    new Set(newWords.map((t) => norm(t.lower))),
  );
  const unmet = needs.filter((n) => !n.met);
  const accepted = baseKept.met && unmet.length === 0 && toks.length > 0;
  const nextMove = !toks.length
    ? T(
        "Write your sentence in the tray, or tap details to build it.",
        "Escribe tu oración en la bandeja o toca detalles para armarla.",
      )
    : !baseKept.met
      ? T(
          `Keep the idea “${task.base}” inside your sentence.`,
          `Mantén la idea “${task.base}” dentro de tu oración.`,
        )
      : unmet[0]?.hint || null;
  return {
    module: "expand",
    accepted,
    text,
    baseKept: { met: baseKept.met, evidence: baseKept.evidence, missing: baseKept.missing },
    needs,
    added,
    newWords: newWords.map(spanOf),
    relationship: rel,
    connector: rel ? { word: rel.connector.word, structure: rel.structure } : null,
    summary: accepted
      ? {
          tone: "right",
          t: T(
            "You kept the idea and met every goal.",
            "Mantuviste la idea y cumpliste cada meta.",
          ),
        }
      : {
          tone: "hint",
          t: T(
            `${needs.length - unmet.length} of ${needs.length} goals met so far.`,
            `${needs.length - unmet.length} de ${needs.length} metas cumplidas por ahora.`,
          ),
        },
    nextMove,
  };
}


// ── combine ──────────────────────────────────────────────────────────────────
const RELATION_NAME = {
  cause: T("a reason and its result", "una razón y su resultado"),
  contrast: T("a difference", "una diferencia"),
  sequence: T("an order in time", "un orden en el tiempo"),
  addition: T("an added idea", "una idea añadida"),
};
const JOBS = ["cause", "contrast", "sequence", "addition"];

function keepSplit(task) {
  const stems = (s) =>
    new Set(
      tokenize(s)
        .filter(isContent)
        .map((t) => norm(t.lower)),
    );
  const [a, b] = [stems(task.pair[0]), stems(task.pair[1])];
  const has = (set, k) => [...set].some((x) => sameStem(x, norm(k)));
  const keep = task.keep || [];
  return {
    onlyA: keep.filter((k) => has(a, k) && !has(b, k)),
    onlyB: keep.filter((k) => has(b, k) && !has(a, k)),
  };
}
const countTerms = (span, terms) =>
  span ? terms.filter((k) => termHits(span.text, tokenize(span.text), k).length).length : 0;

/** Evaluate a combined sentence. Any structure is accepted when its connector does the relation's job and the keep terms survive. */
export function evaluateCombine(task, input) {
  const text = String(typeof input === "string" ? input : input?.text || "");
  const toks = tokenize(text);
  const sents = sentences(text);
  const keep = task.keep || [];
  const norms = (s) =>
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const copied = norms(text) === norms(task.pair.join(" "));
  const hits = copied ? [] : findConnectors(text, task.relation);
  const hit =
    hits.find((h) => clausesAround(text, h).pos === "transition") && sents.length > 1
      ? hits.find((h) => clausesAround(text, h).pos === "transition")
      : hits[0];
  const rel = hit ? relationship(text, hit) : null;
  const c = hit ? clausesAround(text, hit) : null;
  const wrongJob = hit
    ? null
    : JOBS.filter((j) => j !== task.relation)
        .map((j) => ({ job: j, hit: findConnectors(text, j)[0] }))
        .find((x) => x.hit) || null;
  // region the connector really joins: its own sentence, plus the previous one for a transition
  let region = text;
  if (c) {
    const from =
      c.pos === "transition" && sents[c.sentence - 1]
        ? sents[c.sentence - 1].start
        : (sents[c.sentence]?.start ?? 0);
    region = text.slice(from, sents[c.sentence]?.end ?? text.length);
  }
  const regionToks = tokenize(region);
  const keepHits = keep.map((k) => ({ term: k, hits: termHits(region, regionToks, k) }));
  const keepMissing = keepHits.filter((k) => !k.hits.length).map((k) => k.term);
  const clauses = c && [c.first, c.second];
  const joined =
    Boolean(hit) && (task.relation === "cause" ? rel.complete : clauses.every(hasContent));
  const sideBySide = !hit && sents.length >= 2 && !copied;
  let reversed = false;
  if (task.relation === "cause" && rel?.complete) {
    const { onlyA, onlyB } = keepSplit(task);
    if (onlyA.length && onlyB.length) {
      const [causeTerms, effectTerms] =
        task.roles?.[0] === "effect" ? [onlyB, onlyA] : [onlyA, onlyB];
      const straight = countTerms(rel.cause, causeTerms) + countTerms(rel.effect, effectTerms);
      const swapped = countTerms(rel.cause, effectTerms) + countTerms(rel.effect, causeTerms);
      reversed = swapped > straight;
    }
  }
  const accepted = joined && keepMissing.length === 0 && !reversed;
  const shape =
    analyzeResponse(text, { keyUse: "Explain" }).sentenceStats.shapes.find(
      (s) => !hit || (s.start <= hit.start && s.end >= hit.end),
    ) || null;
  const rname = RELATION_NAME[task.relation] || T("a connection", "una conexión");
  let nextMove = null;
  if (!toks.length)
    nextMove = T(
      "Write one sentence that joins both ideas, or tap the two sentences to start.",
      "Escribe una oración que una las dos ideas o toca las dos oraciones para empezar.",
    );
  else if (copied || sideBySide || (!hit && !wrongJob))
    nextMove = T(
      `Your two ideas still sit side by side. Join them so a reader sees ${rname[0]}.`,
      `Tus dos ideas siguen una al lado de la otra. Únelas para que el lector vea ${rname[1]}.`,
    );
  else if (!hit && wrongJob)
    nextMove = T(
      `That linking word shows ${RELATION_NAME[wrongJob.job][0]}, but these two ideas show ${rname[0]}.`,
      `Esa palabra de enlace muestra ${RELATION_NAME[wrongJob.job][1]}, pero estas dos ideas muestran ${rname[1]}.`,
    );
  else if (!joined)
    nextMove = T(
      "Your linking word needs an idea on each side. What goes before it, and what comes after?",
      "Tu palabra de enlace necesita una idea a cada lado. ¿Qué va antes y qué va después?",
    );
  else if (keepMissing.length)
    nextMove = T(
      `Your sentence dropped “${keepMissing[0]}” from the original ideas. Keep both ideas.`,
      `Tu oración dejó fuera “${keepMissing[0]}” de las ideas originales. Mantén las dos ideas.`,
    );
  else if (reversed)
    nextMove = T(
      "Check which idea causes the other. Which one happens first and makes the other happen?",
      "Revisa qué idea causa la otra. ¿Cuál pasa primero y hace que pase la otra?",
    );
  return {
    module: "combine",
    accepted,
    text,
    connector: hit
      ? { word: hit.word, job: hit.job, span: { start: hit.start, end: hit.end, text: hit.text } }
      : null,
    structure: hit
      ? {
          type: rel.structure,
          label: STRUCTURE_LABEL[rel.structure] || STRUCTURE_LABEL.other,
          shape: shape && {
            type: shape.type,
            complex: shape.complex,
            compound: shape.compound,
            subordinators: shape.subordinators,
          },
        }
      : null,
    relationship: rel,
    kept: keepHits.filter((k) => k.hits.length).map((k) => ({ term: k.term, span: k.hits[0] })),
    keepMissing,
    reversed,
    sideBySide: copied || sideBySide,
    wrongRelation: wrongJob
      ? {
          job: wrongJob.job,
          span: { start: wrongJob.hit.start, end: wrongJob.hit.end, text: wrongJob.hit.text },
        }
      : null,
    summary: accepted
      ? {
          tone: "right",
          t: T(
            "Your sentence joins both ideas and shows the relationship.",
            "Tu oración une las dos ideas y muestra la relación.",
          ),
        }
      : { tone: "hint", t: T("Not joined yet.", "Todavía no están unidas.") },
    nextMove,
  };
}

// ── shelves (supports) ───────────────────────────────────────────────────────
/** The Details shelf, generated from the needs' cues: [{ id, label, tag, cues }]. */
export function detailShelf(task) {
  const alts = (task.altConnectors || []).map((a) => a.word);
  return (task.needs || []).map((n) => ({
    id: n.id,
    label: n.label,
    tag: needTag(n),
    cues: n.test?.connectorJob
      ? alts.length
        ? alts
        : (CONNECTORS[n.test.connectorJob] || []).slice(0, 4)
      : (n.test?.terms || []).filter((t) => /^\p{L}[\p{L} -]*$/u.test(t)).slice(0, 10),
  }));
}
/** Linking words for a combine relation (a support shown only with help). */
export const relationShelf = (task) =>
  [...new Set([...(CONNECTORS[task.relation] || []), ...(EXTRA[task.relation] || [])])]
    .filter((w) => !["so that", "and so", "this means", "which means"].includes(w))
    .slice(0, 8);
