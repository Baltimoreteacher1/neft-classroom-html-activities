// Publisher demo: pure evidence logic (no DOM). One learner's journey becomes an honest summary:
// what was done independently vs with support, where the first attempt missed, and one next
// instructional step. Nothing here is a score, level or placement.
import { analyzeResponse } from "../lang/analyze.js";

export const DOMAINS = ["listen", "read", "speak", "write"];
export const DOMAIN_NAME = { listen: "Listening", read: "Reading", speak: "Speaking", write: "Writing" };
export const STORE_KEY = "access.publisherDemo.v1";

export const freshState = () => ({
  v: 1,
  mode: "supported",
  listen: { plays: 0, notes: {}, order: null, answers: {}, results: {}, support: false },
  read: { answers: {}, pinned: "", results: {}, support: false },
  speak: { measures: [], transcripts: ["", ""], checks: {}, support: false },
  write: { draft1: "", draft2: "", reflection: "", gotFeedback: false, support: false },
});

export const normalize = (raw) => {
  const base = freshState();
  if (!raw || raw.v !== 1) return base;
  return { ...base, ...raw, listen: { ...base.listen, ...raw.listen }, read: { ...base.read, ...raw.read }, speak: { ...base.speak, ...raw.speak }, write: { ...base.write, ...raw.write } };
};

/** Fixed starting order for an ordering task; never the answer. */
export const defaultOrder = (task) => task.items.map((i) => i.id).reverse();

const sameList = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]);

/** Is this answer right for this task? Evidence tasks accept any pinned sentence containing a cue. */
export function isCorrect(task, answer) {
  if (answer === undefined || answer === null || answer === "") return false;
  if (task.type === "order") return sameList(answer, task.answer);
  if (task.type === "evidence") return task.acceptContains.some((c) => String(answer).toLowerCase().includes(c.toLowerCase()));
  return answer === task.answer;
}

/** Keep the FIRST attempt separate from the latest, and remember whether it was independent. */
export function recordResult(results, task, ok, stage) {
  const prev = results[task.id];
  results[task.id] = { firstOk: prev ? prev.firstOk : ok, ok, attempts: (prev?.attempts || 0) + 1, stage: prev?.stage || stage };
  return results[task.id];
}

/** A domain's stage is independent only if every attempt was made with no support opened. */
export const stageOf = (domainState) => (domainState.support ? "supported" : "independent");

const NEXT_FOR = {
  order: { domain: "listen", skill: "Following the order of a spoken explanation", student: "Listen again and tick each signal word you hear: first, second, third, finally.", teacher: "Mini-lesson: sequence signal words in a 60-second spoken explanation; students number the steps while listening." },
  infer: { domain: "listen", skill: "Hearing a cause and its result", student: "Listen for so and because. Say each cause and result out loud.", teacher: "Mini-lesson: cause-and-effect listening with a two-column note (cause | result)." },
  inference: { domain: "listen", skill: "Inferring a speaker's purpose", student: "After listening, finish: The speaker wants us to understand that ___.", teacher: "Mini-lesson: paraphrase a sentence that uses contrast (not … but …)." },
  vocab: { domain: "read", skill: "Using context to learn a word", student: "Find the sentence around a new word and underline the clue.", teacher: "Mini-lesson: context-clue hunt with three science words." },
  evidence: { domain: "read", skill: "Finding evidence for a cause", student: "Pin the sentence that names a cause and its effect.", teacher: "Mini-lesson: highlight cause sentences in one paragraph and tell a partner why." },
  data: { domain: "read", skill: "Comparing rows in a table", student: "Say the two numbers you compare before you subtract.", teacher: "Mini-lesson: read a table aloud: row, column, comparison sentence." },
  synthesis: { domain: "read", skill: "Connecting two texts", student: "Find the sentence in the opinion that points to the data text.", teacher: "Mini-lesson: link an opinion to a source using According to ___." },
};

/** One next instructional step, chosen from the weakest first-attempt evidence. Returns null until there is evidence. */
export function nextStep(state, journey) {
  const missed = [];
  for (const [domain, key] of [["listen", "listening"], ["read", "reading"]])
    for (const t of journey[key].tasks) {
      const r = state[domain].results[t.id];
      if (r && !r.firstOk) missed.push({ id: t.id, ...NEXT_FOR[t.id], stage: r.stage });
    }
  const sp = state.speak;
  const checked = journey.speaking.checks.filter((c) => sp.checks[c.id]).length;
  const wr = state.write;
  const text = wr.draft2 || wr.draft1;
  const moves = text ? analyzeResponse(text, writingOptions(journey, "supported")).nextMoves : [];
  const speakingNeed = sp.measures.length && checked < 2
    ? { domain: "speak", skill: "Linking ideas when speaking", student: "Say your explanation again with because, so, first and finally.", teacher: "Mini-lesson: oral cause-and-effect with sentence frames, partner retell.", stage: stageOf(sp) }
    : null;
  const writingNeed = moves[0]
    ? { domain: "write", skill: moves[0].title, student: moves[0].ask, teacher: `Mini-lesson on this move: ${moves[0].title}. Reason from the response: ${moves[0].why}`, stage: stageOf(wr) }
    : null;
  const pick = missed[0] || speakingNeed || writingNeed;
  if (!pick) return null;
  return { ...pick, because: missed[0] ? "Missed on the first try in this journey." : speakingNeed ? "Self-check shows fewer than two of three speaking moves." : "Found in the learner's own writing." };
}

export const writingOptions = (journey, stage) => ({
  keyUse: journey.writing.keyUse,
  modality: "writing",
  stage,
  sourceText: [...journey.reading.passage, ...journey.reading.table.rows.map((r) => r.join(" "))],
  sourceTerms: journey.writing.sourceTerms,
  wordBank: stage === "independent" ? [] : journey.writing.wordBank,
  expected: journey.writing.expected,
});

/** Counts for the portfolio: independent vs supported, first-attempt correct, and productive evidence present. */
export function summarize(state, journey) {
  const count = (domain, key) => {
    const tasks = journey[key].tasks;
    const done = tasks.filter((t) => state[domain].results[t.id]);
    return { stage: stageOf(state[domain]), total: tasks.length, done: done.length, firstCorrect: done.filter((t) => state[domain].results[t.id].firstOk).length };
  };
  return {
    listen: count("listen", "listening"),
    read: count("read", "reading"),
    speak: { stage: stageOf(state.speak), takes: state.speak.measures.length, checks: journey.speaking.checks.filter((c) => state.speak.checks[c.id]).length, transcripts: state.speak.transcripts.filter(Boolean).length },
    write: { stage: stageOf(state.write), drafts: [state.write.draft1, state.write.draft2].filter(Boolean).length, reflected: Boolean(state.write.reflection.trim()) },
  };
}

/** Group synthetic demo learners by shared need for small-group planning. */
export function groupByNeed(learners) {
  const groups = new Map();
  for (const l of learners) groups.set(l.need, [...(groups.get(l.need) || []), l.alias]);
  return [...groups].map(([need, aliases]) => ({ need, aliases })).sort((a, b) => b.aliases.length - a.aliases.length);
}
