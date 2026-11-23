// Pure logic for Vocabulary Quest: item generation, answer checking, stage progression, Leitner revisit queue and the
// device-history box computation. No DOM, no storage: importable by the browser engine and by Node tests.
// Schema: engines/vocab-quest.schema.md

export const STAGE_KINDS = ["see", "use-in-context", "retrieve", "apply", "revisit"];
export const DEFAULT_KINDS = {
  see: ["picture-word"],
  "use-in-context": ["cloze"],
  retrieve: ["type-word"],
  apply: ["say-write"],
};
export const INTERVAL_DAYS = [0, 1, 2, 4, 8, 16];
export const DEFAULT_FRAMES = {
  ee: ["{word} means ___.", "I can use {word} when I ___."],
  dev: ["I can use {word} to ___ because ___."],
  exp: ["When I ___, I use {word} because ___."],
  br: [],
};

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const wholeWordRe = (word) => new RegExp(`(^|[^A-Za-z])${esc(word)}(?![A-Za-z])`, "i");
export const hasWord = (text, word) => wholeWordRe(word).test(String(text || ""));
export const wordCount = (s) =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
export const normalizeWord = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z']/g, "");

/** Replace the first whole-word occurrence of `word` with "___". null when absent. */
export function blank(sentence, word) {
  const m = wholeWordRe(word).exec(sentence || "");
  if (!m) return null;
  const start = m.index + m[1].length;
  return `${sentence.slice(0, start)}___${sentence.slice(start + word.length)}`;
}
/** Mask every occurrence of the word (used where a model sentence must not name the word). */
export const maskWord = (text, word) =>
  String(text).replace(new RegExp(`(^|[^A-Za-z])${esc(word)}(?![A-Za-z])`, "gi"), "$1___");

/** Parts with hyphens removed, only when they spell the word exactly; otherwise null. */
export function partsOf(entry) {
  const parts = entry?.morphology?.parts;
  if (!parts?.length) return null;
  const clean = parts.map((p) => String(p.part).replace(/-/g, "").toLowerCase());
  return clean.join("") === String(entry.word).toLowerCase()
    ? parts.map((p, i) => ({ text: clean[i], shown: p.part, meaning: p.meaning }))
    : null;
}

const pick = (list, seed, shuffle) => shuffle(list, seed);

function choicesFrom(entries, entry, n, seed, shuffle, field = "word") {
  const others = entries.filter((e) => e.id !== entry.id && e[field] !== entry[field]);
  const chosen = pick(others, `${seed}:d`, shuffle).slice(0, n - 1);
  const all = pick([entry, ...chosen], `${seed}:c`, shuffle);
  return { list: all.map((e) => e[field]), answer: all.findIndex((e) => e.id === entry.id) };
}

function hintsFor(kind, entry) {
  const def = entry.def;
  if (kind === "picture-word")
    return [
      "Look closely at the picture. What is happening in it, and what idea does it show?",
      "Say each word's meaning to yourself. Which meaning fits what the picture shows?",
      `The picture shows something described like this: ${def}`,
    ];
  if (kind === "meaning")
    return [
      "Say the word aloud. Where have you heard or read it before?",
      `Read it in a sentence: ${maskWord(entry.context, entry.word)} Which meaning fits?`,
      entry.everyday
        ? `An everyday example: ${maskWord(entry.everyday, entry.word)}`
        : "Think of a time when you needed this idea.",
    ];
  if (kind === "cloze")
    return [
      "Read the whole sentence slowly. What is the missing word doing in the sentence?",
      "Try each choice in the blank and read it aloud. Which one makes sense?",
      `The missing word means: ${def}`,
    ];
  if (kind === "type-word")
    return [
      `The word has ${entry.word.length} letters.`,
      `It starts with "${entry.word[0].toUpperCase()}".`,
      `It fits in this sentence: ${blank(entry.context, entry.word) || def}`,
    ];
  if (kind === "word-parts")
    return [
      "Each part has its own meaning. Read the meanings in the tray.",
      "Say the meanings in order. Do they match the idea in the definition?",
      `Put the parts together so they make a word that means: ${def}`,
    ];
  return [
    "Start with a frame to get your sentence going.",
    `A model sentence: ${entry.academicSentence}`,
    "Say your sentence to a partner first, then write it.",
  ];
}

function modelFor(kind, entry) {
  const parts = partsOf(entry);
  if (kind === "word-parts")
    return `Read the part meanings in order: ${parts?.map((p) => `"${p.meaning}"`).join(", then ")}. The word puts those ideas together.`;
  if (kind === "say-write") return `A model sentence: ${entry.academicSentence}`;
  if (kind === "type-word")
    return `Meaning: ${entry.def} A sentence with the word hidden: ${maskWord(entry.academicSentence, entry.word)}`;
  return `A closer look. The idea is: ${entry.def}${entry.everyday ? ` For example: ${maskWord(entry.everyday, entry.word)}` : ""}`;
}

/** Build one generated item. Returns null when the kind cannot be built for this entry. */
export function makeItem(kind, entry, ctx) {
  const { entries, stageId, seed, shuffle, frames } = ctx;
  const id = `${stageId}.${kind}.${entry.id}`;
  const base = {
    id,
    kind,
    entryId: entry.id,
    stageId,
    hints: hintsFor(kind, entry),
    model: modelFor(kind, entry),
    why: entry.academicSentence,
  };
  const s = `${seed}:${id}`;
  if (kind === "picture-word") {
    if (!entry.visual) return makeItem("meaning", entry, ctx);
    const c = choicesFrom(entries, entry, 4, s, shuffle);
    return {
      ...base,
      prompt: "Which word goes with this picture?",
      visual: entry.visual,
      choices: c.list,
      answer: c.answer,
      study: stageId && ctx.study,
    };
  }
  if (kind === "meaning") {
    const c = choicesFrom(entries, entry, 3, s, shuffle, "def");
    return {
      ...base,
      kind: "meaning",
      id: `${stageId}.meaning.${entry.id}`,
      prompt: `What does "${entry.word}" mean?`,
      choices: c.list,
      answer: c.answer,
      study: ctx.study,
    };
  }
  if (kind === "cloze") {
    const sentence = blank(entry.context, entry.word);
    if (!sentence) return null;
    const c = choicesFrom(entries, entry, 4, s, shuffle);
    return {
      ...base,
      prompt: "Choose the word that completes the sentence.",
      sentence,
      choices: c.list,
      answer: c.answer,
    };
  }
  if (kind === "type-word")
    return {
      ...base,
      prompt: "Which word matches this meaning? Type it.",
      definition: entry.def,
      visual: entry.visual,
      target: entry.word,
      bank: entries.map((e) => e.word),
    };
  if (kind === "word-parts") {
    const parts = partsOf(entry);
    if (!parts) return null;
    const decoys = pick(
      entries.filter((e) => e.id !== entry.id && partsOf(e)),
      `${s}:p`,
      shuffle,
    )
      .flatMap((e) => partsOf(e))
      .filter((p) => !parts.some((q) => q.text === p.text))
      .slice(0, 2);
    return {
      ...base,
      prompt: "Build the word that matches this meaning. Tap the parts in order.",
      definition: entry.def,
      target: entry.word.toLowerCase(),
      parts: pick([...parts, ...decoys], `${s}:t`, shuffle),
      count: parts.length,
    };
  }
  if (kind === "say-write") {
    if (!entry.practice?.speakWrite) return null;
    return {
      ...base,
      prompt: entry.practice.speakWrite,
      target: entry.word,
      model: modelFor(kind, entry),
      frames: Object.fromEntries(
        Object.entries(frames).map(([t, list]) => [
          t,
          list.map((f) => f.replaceAll("{word}", entry.word)),
        ]),
      ),
    };
  }
  return null;
}

/** All items for a stage: generated per kind for every entry, then authored items (override by id). */
export function buildStageItems(
  activity,
  entriesById,
  stage,
  { seed = "q", shuffle, frames } = {},
) {
  const entries = [...entriesById.values()];
  const ids = stage.entryIds || [];
  const kinds = stage.kinds || DEFAULT_KINDS[stage.kind] || [];
  const ctx = {
    entries,
    stageId: stage.id,
    seed,
    shuffle,
    frames: frames || activity.frames || DEFAULT_FRAMES,
    study: stage.kind === "see",
  };
  const out = [];
  for (const k of kinds)
    for (const id of ids) {
      const entry = entriesById.get(id);
      const item = entry && makeItem(k, entry, ctx);
      if (item) out.push(item);
    }
  for (const a of stage.items || []) {
    const entry = entriesById.get(a.entryId);
    if (!entry) continue;
    const item = {
      stageId: stage.id,
      hints: hintsFor(a.kind === "cloze" ? "cloze" : "meaning", entry),
      model: modelFor("cloze", entry),
      why: a.why || entry.academicSentence,
      ...a,
      id: a.id || `${stage.id}.${a.kind}.${a.entryId}`,
    };
    if (a.kind === "cloze" && a.sentence) {
      const c = a.choices
        ? { list: shuffle(a.choices, `${seed}:${item.id}`), answer: 0 }
        : choicesFrom(entries, entry, 4, `${seed}:${item.id}`, shuffle);
      item.choices = c.list;
      item.answer = c.list.findIndex((w) => w === entry.word);
      item.prompt = item.prompt || "Choose the word that completes the sentence.";
    }
    const at = out.findIndex((x) => x.id === item.id);
    if (at >= 0) out[at] = item;
    else out.push(item);
  }
  return out;
}

// ---------------------------------------------------------------- checking
export function isClean(r) {
  return !!r && r.ok === true && r.tries === 1 && r.hints === 0;
}

/** Check a response. resp: choice index | typed text | string[] of parts | {text, meaningCheck}. */
export function checkItem(item, resp) {
  if (item.choices) {
    if (!Number.isInteger(resp)) return { complete: false, message: "Choose an answer first." };
    return { complete: true, ok: resp === item.answer, pick: resp };
  }
  if (item.kind === "type-word") {
    const t = normalizeWord(resp);
    if (!t) return { complete: false, message: "Type a word first." };
    return { complete: true, ok: t === normalizeWord(item.target), pick: t };
  }
  if (item.kind === "word-parts") {
    if (!Array.isArray(resp) || resp.length < item.count)
      return { complete: false, message: `Tap ${item.count} parts to build the word.` };
    const built = resp.join("");
    return { complete: true, ok: built === item.target, pick: built };
  }
  if (item.kind === "say-write") {
    const text = String(resp?.text || "").trim();
    if (!text) return { complete: false, message: "Write your sentence first." };
    if (!hasWord(text, item.target))
      return {
        complete: true,
        ok: false,
        tag: "word-not-used",
        message: `Use the word "${item.target}" in your sentence.`,
      };
    if (wordCount(text) < 5)
      return {
        complete: true,
        ok: false,
        tag: "sentence-too-short",
        message: "Write a full sentence of at least 5 words.",
      };
    if (!resp.meaningCheck)
      return {
        complete: true,
        ok: false,
        tag: "meaning-not-confirmed",
        message: "Read your sentence again. Tick the box if it shows what the word means.",
      };
    return { complete: true, ok: true };
  }
  return { complete: false, message: "Unknown item." };
}

/** Item handed to createItemLoop. Authored misconceptions keyed by pick index work natively. */
export const loopItemFor = (item) => ({
  id: item.id,
  hints: item.hints,
  model: item.model,
  right: item.why,
  misconceptions: item.misconceptions || [],
});

// ---------------------------------------------------------------- stage progression
export function stageResult(results, passMark = 0.67) {
  const list = Object.values(results);
  const done = list.filter((r) => r.demonstrated).length;
  const ratio = list.length ? done / list.length : 1;
  return {
    ratio,
    demonstrated: done,
    total: list.length,
    passed: ratio >= passMark,
    retry: Object.entries(results)
      .filter(([, r]) => !r.demonstrated)
      .map(([id]) => id),
  };
}

/** May stage n+1 open? Stage must be finished and either passed or already replayed once. */
export const unlocks = (res, replayed) => res.passed || replayed;

// ---------------------------------------------------------------- history and Leitner
export const entryOfId = (id) => String(id).split(".").pop();

/** Box per entry from this device's earlier attempts. attempts: [{t, items:[{id,tries,hints,ok}]}] oldest first. */
export function historyBoxes(attempts, entryIds, now = Date.now()) {
  const out = new Map(entryIds.map((id) => [id, { box: 0, lastT: null, due: false }]));
  for (const att of attempts || []) {
    const by = new Map();
    for (const it of att.items || []) {
      const e = entryOfId(it.id);
      if (out.has(e)) by.set(e, [...(by.get(e) || []), it]);
    }
    for (const [e, items] of by) {
      const rec = out.get(e);
      if (items.every(isClean)) rec.box = Math.min(rec.box + 1, 4);
      else if (items.some((i) => !i.ok)) rec.box = 1;
      else rec.box = Math.max(1, rec.box - 1);
      rec.lastT = att.t ? Date.parse(att.t) : null;
    }
  }
  for (const rec of out.values()) {
    rec.due =
      rec.box > 0 &&
      rec.lastT != null &&
      (now - rec.lastT) / 86400000 >= INTERVAL_DAYS[Math.min(rec.box, 5)];
  }
  return out;
}

/** Start queue for the revisit stage. entries ordered: lapsed in session, then lower box, then due on this device. */
export function leitnerStart(entryIds, { lapsed = new Set(), history = new Map() } = {}) {
  const q = entryIds.map((entryId, i) => {
    const h = history.get(entryId) || { box: 0, due: false };
    const box = lapsed.has(entryId) ? 1 : h.box >= 4 ? 3 : h.box >= 1 ? Math.min(h.box, 3) : 2;
    return { entryId, box, lapses: 0, due: !!h.due, lapsed: lapsed.has(entryId), i };
  });
  q.sort(
    (a, b) =>
      Number(b.lapsed) - Number(a.lapsed) ||
      a.box - b.box ||
      Number(b.due) - Number(a.due) ||
      a.i - b.i,
  );
  return q.map(({ entryId, box, lapses }) => ({ entryId, box, lapses }));
}

/** Kind asked at each box: 1 recognise, 2 use in context, 3 retrieve. */
export const kindForBox = (box, entry) =>
  box <= 1
    ? entry.visual
      ? "picture-word"
      : "meaning"
    : box === 2
      ? blank(entry.context, entry.word)
        ? "cloze"
        : "meaning"
      : "type-word";

/** Answer the head of the queue. Returns {queue, retired:{entryId,flagged}|null}. Pure (returns a new queue). */
export function leitnerAnswer(queue, clean) {
  const [head, ...rest] = queue;
  if (!head) return { queue, retired: null };
  let box = head.box;
  let lapses = head.lapses;
  if (clean) box += 1;
  else {
    box = 1;
    lapses += 1;
  }
  if (clean && box > 3)
    return { queue: rest, retired: { entryId: head.entryId, flagged: lapses > 0 } };
  if (!clean && lapses >= 3)
    return { queue: rest, retired: { entryId: head.entryId, flagged: true } };
  const next = { ...head, box, lapses };
  const at = Math.min(rest.length, clean ? 3 : 2);
  return { queue: [...rest.slice(0, at), next, ...rest.slice(at)], retired: null };
}

/** Per-word debrief from merged evidence records. */
export function wordSummary(entryIds, records) {
  return entryIds.map((entryId) => {
    const recs = Object.values(records).filter((r) => entryOfId(r.id) === entryId);
    const secure = recs.length > 0 && recs.every(isClean);
    return {
      entryId,
      secure,
      hints: recs.reduce((n, r) => n + r.hints, 0),
      tries: recs.reduce((n, r) => n + r.tries, 0),
      missed: recs.some((r) => !r.ok),
    };
  });
}

/** Merge a repeat of the same item id (stage replay or revisit repeat): sums effort, keeps the latest result. */
export function mergeRecord(prev, next) {
  if (!prev) return { ...next, tags: [...(next.tags || [])] };
  return {
    id: next.id,
    tries: prev.tries + next.tries,
    hints: prev.hints + next.hints,
    ok: next.ok,
    tags: [...new Set([...(prev.tags || []), ...(next.tags || [])])],
  };
}
