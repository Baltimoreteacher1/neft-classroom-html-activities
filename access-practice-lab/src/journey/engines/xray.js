// Reading X-Ray Vision: the `read` engine (second half of the UNDERSTAND step). Pure logic, no DOM.
//
// A learner investigates a claim in a short passage: pick the claim, select evidence, connect it, explain
// why it supports the claim, then repeat on a NEW passage with no supports. Feedback depends on what the
// learner actually selected (valid / weak = on topic but not support / irrelevant). It never names an
// unselected valid sentence: it reports only how many more are needed.
//
// Every learner-facing string is a bilingual pair [en, es]. Quoted words come from the learner's own picks.
// Contract: access-practice-lab/JOURNEY.md, "ReadTask".
import { CONNECTORS, VAGUE } from "../../lang/lexicon.js";
import { contentStems, findPhrase, isStop, stem, tokenize, wordCount } from "../../lang/text.js";

export const STAGES = ["main", "transfer"];
export const LAYERS = ["meaning", "discourse", "sentence", "word"];
const MIN_WORDS = 8;
const GENERIC = new Set(
  ["evidence", "show", "claim", "true", "support", "reason", "because", ...Object.keys(VAGUE)].map(stem),
);

// ---------- views over a task ----------

/** The passage, claim, answer sets, refs and layers for one stage. Transfer has no refs, layers or frame. */
export function stageView(task, stageKey = "main") {
  const c = task.challenge || {};
  const terms = c.explainTerms || [];
  if (stageKey === "transfer") {
    const t = c.transfer || {};
    const passage = t.passage || [];
    const claimOptions = t.claimOptions?.length
      ? t.claimOptions
      : passage.filter((s) => s.role === "claim" || s.id === t.claim).map((s) => s.id);
    return {
      stage: "transfer",
      passage,
      claim: t.claim,
      valid: t.valid || [],
      weak: t.weak || [],
      minValid: t.minValid || 1,
      claimOptions,
      refs: [],
      layers: {},
      frame: c.explainFrame,
      terms,
    };
  }
  return {
    stage: "main",
    passage: task.passage || [],
    claim: c.claim,
    valid: c.valid || [],
    weak: c.weak || [],
    minValid: c.minValid || 1,
    claimOptions: task.claimOptions || [c.claim],
    refs: task.refs || [],
    layers: task.layers || {},
    frame: c.explainFrame,
    terms,
  };
}

const sentence = (v, id) => v.passage.find((s) => s.id === id);
const textOf = (v, id) => sentence(v, id)?.text || "";
const inOrder = (v, ids) => v.passage.map((s) => s.id).filter((id) => ids.includes(id));

/** Short quoted snippet of a learner-chosen sentence. */
export function snippet(text, n = 7) {
  const w = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const s = w
    .slice(0, n)
    .join(" ")
    .replace(/[,.;:!?]+$/, "");
  return `“${s}${w.length > n ? "…" : ""}”`;
}
const quoteList = (v, ids) => ids.map((id) => snippet(textOf(v, id))).join(", ");
const pair = (en, es) => [en, es];
const join = (parts) => pair(parts.map((p) => p[0]).join(" "), parts.map((p) => p[1]).join(" "));

// ---------- state ----------

/** Fresh state for one stage. A stage with a single possible claim starts with that claim chosen. */
export function init(task, stage = "main") {
  const v = stageView(task, stage);
  return {
    stage,
    claim: v.claimOptions.length === 1 ? v.claimOptions[0] : null,
    selected: [],
    link: null,
    explanation: "",
    explained: false,
    explainTries: 0,
    attempts: 0,
    claimTries: 0,
    hints: 0,
    refsTraced: {},
    layer: null,
    misses: { weak: [], irrelevant: [] },
  };
}

/**
 * Choose the claim to investigate. Only ids in claimOptions count as claims. A claim the passage builds no case
 * for gets a gentle redirect, not a failure. Returns { state, kind: "chosen"|"redirect"|"not-claim"|"locked", message }.
 */
export function chooseClaim(task, state, id) {
  const v = stageView(task, state.stage);
  if (state.link)
    return {
      state,
      kind: "locked",
      message: pair(
        "The claim is already connected to its evidence.",
        "La afirmación ya está conectada con su evidencia.",
      ),
    };
  if (!v.claimOptions.includes(id))
    return {
      state,
      kind: "not-claim",
      message: pair(
        "That sentence is not a claim. A claim says what the writer wants you to believe. Look for a sentence that makes a statement the rest of the passage could prove.",
        "Esa oración no es una afirmación. Una afirmación dice lo que el autor quiere que creas. Busca una oración que haga una declaración que el resto del texto pueda probar.",
      ),
    };
  if (id !== v.claim)
    return {
      state: { ...state, claimTries: state.claimTries + 1 },
      kind: "redirect",
      message: pair(
        `${snippet(textOf(v, id))} is a claim, but this passage does not build a case for it. Investigate a different claim instead?`,
        `${snippet(textOf(v, id))} es una afirmación, pero este texto no construye un argumento para ella. ¿Investigas otra afirmación?`,
      ),
    };
  return {
    state: { ...state, claim: id, selected: state.selected.filter((x) => x !== id) },
    kind: "chosen",
    message: pair(
      "Good. Now look for sentences that give a reason to believe this claim.",
      "Bien. Ahora busca oraciones que den una razón para creer esta afirmación.",
    ),
  };
}

/** Select or unselect a sentence as evidence. The claim itself is never evidence; a linked selection is locked. */
export function toggleEvidence(state, id) {
  if (state.link || !state.claim || id === state.claim) return state;
  const selected = state.selected.includes(id)
    ? state.selected.filter((x) => x !== id)
    : [...state.selected, id];
  return { ...state, selected };
}

// ---------- evidence ----------

const WEAK_NOTES = {
  background: pair(
    "it sets the scene (who, when or where) but does not show why the claim is true.",
    "sitúa la escena (quién, cuándo o dónde), pero no muestra por qué la afirmación es verdadera.",
  ),
  detail: pair(
    "it adds a detail, but the detail does not tell you whether the claim is true.",
    "añade un detalle, pero ese detalle no te dice si la afirmación es verdadera.",
  ),
  default: pair(
    "it is on the same topic, but it does not show the claim is true.",
    "es del mismo tema, pero no muestra que la afirmación sea verdadera.",
  ),
};
const NOTE_VALID = pair(
  "it gives a reason to believe the claim.",
  "da una razón para creer la afirmación.",
);
const NOTE_OTHER_CLAIM = pair(
  "it is a different claim, not support for this one.",
  "es otra afirmación, no apoyo para esta.",
);
const NOTE_IRRELEVANT = pair(
  "it is about something else, not this claim.",
  "trata de otra cosa, no de esta afirmación.",
);

function classify(v, id) {
  const role = sentence(v, id)?.role;
  if (v.valid.includes(id))
    return { id, cls: "valid", snippet: snippet(textOf(v, id)), note: NOTE_VALID };
  if (v.weak.includes(id))
    return {
      id,
      cls: "weak",
      snippet: snippet(textOf(v, id)),
      note: WEAK_NOTES[role] || WEAK_NOTES.default,
    };
  return {
    id,
    cls: "irrelevant",
    snippet: snippet(textOf(v, id)),
    note: role === "claim" ? NOTE_OTHER_CLAIM : NOTE_IRRELEVANT,
  };
}

function selectionMessage(v, status, valid, weak, irrelevant, missingCount) {
  if (status === "none")
    return pair(
      "Select the sentences that give evidence for the claim, then press Check.",
      "Selecciona las oraciones que dan evidencia para la afirmación y luego pulsa Revisar.",
    );
  const parts = [];
  if (valid.length) {
    const q = quoteList(v, valid);
    parts.push(
      pair(
        `${q} ${valid.length === 1 ? "backs" : "back"} up the claim.`,
        `${q} ${valid.length === 1 ? "respalda" : "respaldan"} la afirmación.`,
      ),
    );
  }
  if (weak.length) {
    const q = quoteList(v, weak);
    parts.push(
      pair(
        `${q} ${weak.length === 1 ? "is" : "are"} on the same topic, but a sentence can be about the same thing and still not be evidence.`,
        `${q} ${weak.length === 1 ? "es" : "son"} del mismo tema, pero una oración puede tratar de lo mismo y aun así no ser evidencia.`,
      ),
    );
  }
  if (irrelevant.length) {
    const q = quoteList(v, irrelevant);
    parts.push(
      pair(
        `${q} ${irrelevant.length === 1 ? "is" : "are"} not about this claim.`,
        `${q} ${irrelevant.length === 1 ? "no trata" : "no tratan"} de esta afirmación.`,
      ),
    );
  }
  const extras = weak.length + irrelevant.length;
  if (status === "sufficient")
    parts.push(
      pair(
        "That is enough strong evidence. Connect it to the claim.",
        "Es evidencia fuerte suficiente. Conéctala con la afirmación.",
      ),
    );
  else if (extras)
    parts.push(
      pair(
        `Unselect the sentence${extras > 1 ? "s" : ""} marked with a warning. Ask of each one: does it make the claim easier to believe?`,
        `Quita ${extras > 1 ? "las oraciones marcadas" : "la oración marcada"} con una advertencia. Pregúntate de cada una: ¿hace más fácil creer la afirmación?`,
      ),
    );
  else if (missingCount)
    parts.push(
      pair(
        `You need ${missingCount} more. Look for a fact, a number or a reason that connects to the claim.`,
        `Te ${missingCount === 1 ? "falta 1 más" : `faltan ${missingCount} más`}. Busca un dato, un número o una razón que se conecte con la afirmación.`,
      ),
    );
  return join(parts);
}

/**
 * Classify the learner's selection. status: sufficient (enough valid, nothing off-target) | partial | insufficient | none.
 * valid / weak / irrelevant list SELECTED ids only. missingCount is a number: unselected valid sentences are never named.
 */
export function evaluateSelection(task, state, stageKey = state.stage) {
  const v = stageView(task, stageKey);
  const items = inOrder(v, state.selected).map((id) => classify(v, id));
  const ids = (cls) => items.filter((i) => i.cls === cls).map((i) => i.id);
  const valid = ids("valid");
  const weak = ids("weak");
  const irrelevant = ids("irrelevant");
  const missingCount = Math.max(0, v.minValid - valid.length);
  let status = "none";
  if (items.length)
    status =
      valid.length >= v.minValid && !weak.length && !irrelevant.length
        ? "sufficient"
        : valid.length
          ? "partial"
          : "insufficient";
  return {
    stage: v.stage,
    status,
    valid,
    weak,
    irrelevant,
    missingCount,
    minValid: v.minValid,
    items,
    message: selectionMessage(v, status, valid, weak, irrelevant, missingCount),
  };
}

/** Press "Check": evaluates, counts the attempt and remembers which off-target sentences were tried. */
export function checkEvidence(task, state) {
  const result = evaluateSelection(task, state);
  if (!state.selected.length || state.link) return { state, result };
  const merge = (a, b) => [...new Set([...a, ...b])];
  return {
    state: {
      ...state,
      attempts: state.attempts + 1,
      misses: {
        weak: merge(state.misses.weak, result.weak),
        irrelevant: merge(state.misses.irrelevant, result.irrelevant),
      },
    },
    result,
  };
}

/** Build the visible claim <- evidence relationship. Only a sufficient selection links; otherwise state is unchanged. */
export function buildLink(task, state, now = Date.now()) {
  const v = stageView(task, state.stage);
  if (state.link || evaluateSelection(task, state).status !== "sufficient") return state;
  const evidence = inOrder(v, state.selected);
  const labels = Object.fromEntries(
    evidence.map((id) => [id, sentence(v, id)?.role === "reason" ? "reason" : "evidence"]),
  );
  return { ...state, link: { claim: state.claim, evidence, labels, at: now } };
}

// ---------- explanation ----------

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
const frameParts = (frame) =>
  String(frame || "")
    .split(/_{2,}|…/)
    .map(norm)
    .filter(Boolean);

function reasoningHits(text, terms) {
  const tokens = tokenize(text);
  const hits = [];
  for (const term of [...terms, ...CONNECTORS.cause]) {
    const words = tokenize(term);
    if (words.length > 1) {
      const m = findPhrase(text, term)[0];
      if (m) hits.push(m.text);
    } else {
      const t = tokens.find((x) => stem(x.lower) === stem(term));
      if (t) hits.push(t.text);
    }
  }
  return [...new Set(hits.map((h) => h.toLowerCase()))];
}

function usesFrame(text, frame) {
  const parts = frameParts(frame);
  const n = ` ${norm(text)} `;
  if (!parts.length || n.includes("___")) return false;
  if (n.includes(` ${parts[0]} `)) return true;
  return parts.slice(1).some((p) => p.split(" ").length >= 2 && n.includes(` ${p} `));
}

/** Words in the learner's text that come from the evidence they chose, beyond the claim's and the frame's own words. */
function evidenceMatches(text, v, evidenceIds) {
  const claimStems = new Set(contentStems(textOf(v, v.claim)));
  const skip = new Set([...GENERIC, ...contentStems(v.frame || ""), ...v.terms.map(stem)]);
  const own = new Set();
  for (const id of evidenceIds)
    for (const s of contentStems(textOf(v, id))) if (!skip.has(s)) own.add(s);
  const strict = new Set([...own].filter((s) => !claimStems.has(s)));
  const pool = strict.size ? strict : own;
  const seen = new Set();
  const out = [];
  for (const t of tokenize(text)) {
    const s = stem(t.lower);
    if (!isStop(t.lower) && pool.has(s) && !seen.has(s)) {
      seen.add(s);
      out.push(t.text);
    }
  }
  return out;
}

const q = (list) => list.map((w) => `“${w}”`).join(", ");

function explainFeedback(status, text, hits, matched) {
  const quote = snippet(text, 9);
  switch (status) {
    case "empty":
      return {
        message: pair("Nothing written yet.", "Todavía no has escrito nada."),
        next: pair(
          "Write one or two sentences: what the evidence shows, and why that makes the claim believable.",
          "Escribe una o dos oraciones: qué muestra la evidencia y por qué hace creíble la afirmación.",
        ),
      };
    case "blank":
      return {
        message: pair(
          `${quote} still has a blank (___) in it.`,
          `${quote} todavía tiene un espacio en blanco (___).`,
        ),
        next: pair(
          "Replace the blank with your own words from the passage.",
          "Reemplaza el espacio en blanco con tus propias palabras del texto.",
        ),
      };
    case "off-topic":
      return {
        message: pair(
          `You wrote ${quote}. It does not yet connect a detail from your evidence to the claim.`,
          `Escribiste ${quote}. Todavía no conecta un detalle de tu evidencia con la afirmación.`,
        ),
        next: pair(
          "Name one fact from the evidence you chose, then say why it matters using “because” or “so”.",
          "Nombra un dato de la evidencia que elegiste y di por qué importa con “because” o “so”.",
        ),
      };
    case "no-reason":
      return {
        message: pair(
          `You mentioned ${q(matched.slice(0, 3))} from the evidence. That is a real detail, but it is not yet linked to the claim.`,
          `Mencionaste ${q(matched.slice(0, 3))} de la evidencia. Es un detalle real, pero todavía no está unido a la afirmación.`,
        ),
        next: pair(
          "Connect it to the claim with a reason word such as “because” or “so”.",
          "Únelo con la afirmación usando una palabra de razón como “because” o “so”.",
        ),
      };
    case "no-detail":
      return {
        message: pair(
          `You used ${q(hits.slice(0, 2))} to give a reason. Good start.`,
          `Usaste ${q(hits.slice(0, 2))} para dar una razón. Buen comienzo.`,
        ),
        next: pair(
          "Now name a detail from the evidence you chose: a number, a thing or an event.",
          "Ahora nombra un detalle de la evidencia que elegiste: un número, una cosa o un suceso.",
        ),
      };
    case "short":
      return {
        message: pair(
          `${quote} has the right pieces but is very short.`,
          `${quote} tiene las piezas correctas, pero es muy corta.`,
        ),
        next: pair(
          "Add what the detail shows about the claim, in a few more words.",
          "Añade qué muestra el detalle sobre la afirmación, en unas palabras más.",
        ),
      };
    default:
      return {
        message: pair(
          `You connected ${q(matched.slice(0, 2))} to the claim with ${q(hits.slice(0, 1))}. That is evidence plus reasoning.`,
          `Conectaste ${q(matched.slice(0, 2))} con la afirmación usando ${q(hits.slice(0, 1))}. Eso es evidencia más razonamiento.`,
        ),
        next: null,
      };
  }
}

/**
 * Check an explanation. It must (1) use a reasoning word from explainTerms / a cause connector OR the explainFrame
 * structure, (2) mention words from a selected valid sentence (the linked evidence, or any valid sentence when no
 * state is given), (3) reach the minimum word count. Returns { ok, status, usedReasoning, usedFrame, hits, matched,
 * words, message, next } with ONE next move.
 */
export function evaluateExplanation(task, text, stageKey = "main", state = null) {
  const v = stageView(task, stageKey);
  const body = String(text || "").trim();
  const words = wordCount(body);
  const evidenceIds = state?.link?.evidence?.length
    ? state.link.evidence
    : state?.selected?.filter((id) => v.valid.includes(id)) || v.valid;
  const hits = reasoningHits(body, v.terms);
  const usedFrame = usesFrame(body, v.frame);
  const matched = evidenceMatches(body, v, evidenceIds);
  const usedReasoning = hits.length > 0 || usedFrame;
  let status = "good";
  if (!words) status = "empty";
  else if (/_{2,}/.test(body)) status = "blank";
  else if (!usedReasoning && !matched.length) status = "off-topic";
  else if (!usedReasoning) status = "no-reason";
  else if (!matched.length) status = "no-detail";
  else if (words < MIN_WORDS) status = "short";
  return {
    ok: status === "good",
    status,
    usedReasoning,
    usedFrame,
    hits,
    matched,
    words,
    minWords: MIN_WORDS,
    ...explainFeedback(status, body, hits, matched),
  };
}

/** Record an explanation attempt. A good one marks the stage explained; `keep` accepts a tried explanation as is. */
export function submitExplanation(task, state, text, { keep = false } = {}) {
  const result = evaluateExplanation(task, text, state.stage, state);
  const tries = state.explainTries + 1;
  const explained = result.ok || (keep && state.explainTries >= 2 && wordCount(text) > 0);
  return {
    state: {
      ...state,
      explanation: String(text || "").trim(),
      explainTries: tries,
      explained: Boolean(state.link) && explained,
    },
    result,
  };
}

// ---------- pronoun reference ----------

const DET =
  /^(?:the|a|an|this|that|these|those|both|each|their|its|his|her|our|some|less|more|enough)$/i;
const VERBISH =
  /(?:ed|ing|ly)$|^(?:is|are|was|were|be|get|gets|got|stay|stays|block|blocks|use|uses|take|takes|produce|produces|grow|grows|make|makes|need|needs|keep|keeps|show|shows|cannot|can|will|would|sit|sits|weaken|received|began|has|have|had|does|do|did)$/i;

/** Noun-like phrases ("the roots", "Bed 1") in a sentence, nearest-to-start first. */
function nounPhrases(text) {
  const toks = tokenize(text);
  const out = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const prev = toks[i - 1];
    if (/^[A-Z]/.test(t.text) && /^\d+$/.test(toks[i + 1]?.text || "")) {
      out.push(`${t.text} ${toks[i + 1].text}`);
      i++;
    } else if (prev && DET.test(prev.text) && !isStop(t.lower) && !VERBISH.test(t.lower)) {
      let j = i;
      const run = [t.text];
      while (
        run.length < 3 &&
        toks[j + 1] &&
        !isStop(toks[j + 1].lower) &&
        !VERBISH.test(toks[j + 1].lower) &&
        !/^\d/.test(toks[j + 1].text)
      )
        run.push(toks[++j].text);
      out.push(`the ${run.join(" ")}`);
      i = j;
    }
  }
  return out;
}

const bare = (s) => norm(s).replace(/^(?:the|a|an) /, "");
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Choices for "what does this phrase mean?": the true referent plus content nouns from nearby sentences. Deterministic. */
export function referenceOptions(task, refIdx) {
  const v = stageView(task, "main");
  const ref = v.refs[refIdx];
  if (!ref) return [];
  const at = v.passage.findIndex((s) => s.id === ref.sentence);
  const near = [at, at - 1, at - 2, at + 1]
    .filter((i) => i >= 0 && i < v.passage.length)
    .map((i) => v.passage[i].text);
  const skip = new Set([bare(ref.means), bare(ref.phrase)]);
  const pool = [];
  for (const t of near)
    for (const p of nounPhrases(t))
      if (!skip.has(bare(p)) && !pool.some((x) => bare(x) === bare(p))) pool.push(p);
  if (pool.length < 2)
    for (const t of near)
      for (const tok of tokenize(t))
        if (
          !isStop(tok.lower) &&
          tok.lower.length > 4 &&
          !VERBISH.test(tok.lower) &&
          !skip.has(tok.lower) &&
          !pool.some((x) => bare(x).includes(tok.lower))
        )
          pool.push(`the ${tok.lower}`);
  const options = [ref.means, ...pool.slice(0, 3)];
  return options.sort((a, b) => hash(`${refIdx}:${a}`) - hash(`${refIdx}:${b}`));
}

/** The learner chose what a pronoun phrase means. Returns { state, ok, message }; wrong picks never reveal the answer. */
export function traceReference(task, state, refIdx, guess) {
  const v = stageView(task, state.stage);
  const ref = v.refs[refIdx];
  if (!ref)
    return {
      state,
      ok: false,
      message: pair("That phrase cannot be traced here.", "Esa frase no se puede rastrear aquí."),
    };
  const prior = state.refsTraced[refIdx] || { ok: false, tries: 0 };
  const ok = bare(guess) === bare(ref.means);
  const entry = { ok: prior.ok || ok, tries: prior.tries + 1, last: String(guess) };
  const state2 = { ...state, refsTraced: { ...state.refsTraced, [refIdx]: entry } };
  const where = snippet(textOf(v, ref.sentence), 9);
  const message = ok
    ? pair(
        `Yes. “${ref.phrase}” points back to ${snippet(ref.means)}. A pronoun saves repeating a noun, so the reader must connect it back.`,
        `Sí. “${ref.phrase}” se refiere a ${snippet(ref.means)}. Un pronombre evita repetir un sustantivo, así que el lector debe conectarlo.`,
      )
    : pair(
        `${snippet(guess)} does not fit. Reread ${where} and ask which noun the rest of the sentence describes.`,
        `${snippet(guess)} no encaja. Vuelve a leer ${where} y pregunta qué sustantivo describe el resto de la oración.`,
      );
  return { state: state2, ok, message };
}

// ---------- X-Ray layers ----------

/** Resolve a layer's annotations to character offsets inside their sentences. Transfer has no layers. */
export function layerAnnotations(task, layer, stageKey = "main") {
  const v = stageView(task, stageKey);
  const out = [];
  (v.layers[layer] || []).forEach((a, i) => {
    const m = findPhrase(textOf(v, a.s), a.phrase)[0];
    if (m)
      out.push({
        id: `${layer}:${i}`,
        layer,
        s: a.s,
        start: m.start,
        end: m.end,
        text: m.text,
        label: a.label,
        def: a.def || null,
      });
  });
  return out;
}

/** Reference phrases with offsets inside their sentences (main passage only). */
export function referenceRanges(task, stageKey = "main") {
  const v = stageView(task, stageKey);
  return v.refs
    .map((r, idx) => {
      const m = findPhrase(textOf(v, r.sentence), r.phrase)[0];
      return m ? { idx, s: r.sentence, start: m.start, end: m.end, text: m.text } : null;
    })
    .filter(Boolean);
}

/**
 * Turn possibly overlapping ranges into a nesting forest. A range inside another nests; a partial overlap drops the
 * lower-priority range. Each range: { start, end, priority }. Returns [{ range, children }].
 */
export function nestRanges(ranges) {
  const inside = (a, b) => a.start >= b.start && a.end <= b.end;
  const kept = [];
  for (const r of [...ranges].sort(
    (a, b) => (b.priority || 0) - (a.priority || 0) || a.start - b.start,
  )) {
    const clash = kept.some(
      (k) => k.start < r.end && r.start < k.end && !inside(k, r) && !inside(r, k),
    );
    if (!clash) kept.push(r);
  }
  kept.sort((a, b) => a.start - b.start || b.end - a.end || (a.priority || 0) - (b.priority || 0));
  const roots = [];
  const stack = [];
  for (const r of kept) {
    while (stack.length && !inside(r, stack[stack.length - 1].range)) stack.pop();
    const node = { range: r, children: [] };
    (stack.length ? stack[stack.length - 1].children : roots).push(node);
    stack.push(node);
  }
  return roots;
}

// ---------- completion and ledger ----------

/** What counts as finished. A stage is complete when its relationship is built AND explained. */
export function doneCriteria({ main = null, transfer = null } = {}) {
  const mainLinked = Boolean(main?.link);
  const mainExplained = Boolean(main?.explained);
  const transferLinked = Boolean(transfer?.link);
  const transferExplained = Boolean(transfer?.explained);
  return {
    mainLinked,
    mainExplained,
    transferLinked,
    transferExplained,
    mainComplete: mainLinked && mainExplained,
    complete: mainLinked && mainExplained && transferLinked && transferExplained,
  };
}

/** Small JSON for env.done(): counts only. */
export function stageSummary(state) {
  return {
    valid: state.link?.evidence.length || 0,
    weak: state.misses.weak.length,
    irrelevant: state.misses.irrelevant.length,
    attempts: state.attempts,
  };
}

const SUPPORT_FLAGS = { frame: "frames", hint: "hint", xray: "coach" };

/** Partial ledger entry for env.ledger(). Transfer is independent only when no support was opened. */
export function ledgerEntry({
  missionId,
  band,
  klu,
  stageKey,
  state,
  supportsUsed = [],
  independent = false,
}) {
  const transfer = stageKey === "transfer";
  const used = transfer ? [] : supportsUsed;
  const supports = Object.fromEntries(used.map((id) => [SUPPORT_FLAGS[id] || id, true]));
  const s = stageSummary(state);
  return {
    src: "mission",
    task: `${missionId}.understand`,
    band,
    domain: "Reading",
    use: klu,
    stage: used.length ? "supported" : transfer || independent ? "independent" : "guided",
    kind: transfer ? "transfer" : "first",
    supports,
    m: {
      read: {
        valid: s.valid,
        weak: s.weak,
        irrelevant: s.irrelevant,
        attempts: s.attempts,
        explained: state.explained ? 1 : 0,
      },
    },
  };
}
