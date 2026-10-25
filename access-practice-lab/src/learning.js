// Task-specific teaching guidance. These helpers never estimate proficiency.
export function wordBank(activity) {
  const seen = new Set();
  return [...(activity.wordBank || []), ...(activity.vocabulary || []).map((v) => v[0])]
    .filter((word) => {
      const key = String(word).normalize('NFKC').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function purposeOf(activity) {
  const text = [activity.skill, activity.prompt, ...(activity.wida || [])].join(' ').toLowerCase();
  if (/claim|argument|opinion|argue|persuad|counterclaim|\bcer\b/.test(text)) return 'argue';
  if (/narrat|retell|story|sequence|in order/.test(text)) return 'narrate';
  if (/explain|cause|experiment|why|reasoning/.test(text)) return 'explain';
  return 'inform';
}

const GUIDANCE = {
  inform: ['Name the person, object, or idea you are describing.', 'Add a specific action, fact, or detail from the task.'],
  narrate: ['Tell the important events in an order the reader can follow.', 'Add a detail that helps the reader understand what happened.'],
  explain: ['Describe what happened or how something works.', 'Explain why, using a detail or result from the task.'],
  argue: ['State your claim or choice clearly.', 'Support it with a reason and specific evidence from the task.'],
};

export function taskCriteria(activity) {
  return activity.successCriteria?.length ? activity.successCriteria : GUIDANCE[purposeOf(activity)];
}

export function strategyFor(domain) {
  return {
    Listening: 'Listen for the main message first. Then listen again for the detail the question asks about.',
    Reading: 'Read the question, then find the part of the text that helps you answer. Check your choice against it.',
    Speaking: 'Plan your main idea. Say it aloud, add one useful detail, and listen to your explanation.',
    Writing: 'Say your idea first. Write it, then reread it with the question beside you.',
  }[domain] || 'Read the directions, try one step, then check your work.';
}

export const EVIDENCE_LABELS = {
  independent: 'Correct without opened help',
  supported: 'Correct after help or a retry',
  attempted: 'Answer attempted · revisit',
  draft: 'Draft changed · review needed',
  writing: 'Written response · self-reviewed',
  revised: 'Writing revised · improvement described',
  speaking: 'Speaking practiced · self-reported',
  recorded: 'Speaking practiced · recording made in this tab',
  worksheet: 'Paper practice · self-reported',
};

export function evidenceLabel(result) {
  return EVIDENCE_LABELS[result?.evidence] || 'Earlier practice · support use not recorded';
}

export function estimateMinutes(rows) {
  return rows.reduce((sum, row) => sum + (Number(row.minutes) || ({constructed: 6, worksheet: 8}[row.type] || 3)), 0);
}

// ── Listening Strategy Laboratory ─────────────────────────────────────────────
// Learn-with-help only. Everything here is deterministic and runs on the device: it reads the
// activity's own authored text and the learner's selected answer, never audio, and never estimates
// proficiency. A diagnosis is offered only when authored distractor metadata or a clear rule on the
// heard script supports it; otherwise these helpers return null and the page says nothing extra.

export const LISTENING_PURPOSES = {
  stance: {
    label: "Speaker stance",
    text: "Listen for what each speaker thinks or wants, and the reason they give.",
  },
  sequence: {
    label: "Sequence and transitions",
    text: "Listen for order words such as first, next, then and finally, and the action that comes with each.",
  },
  quantity: {
    label: "Quantitative detail",
    text: "Listen for numbers, amounts and units, and for what each number describes.",
  },
  gist: {
    label: "Gist",
    text: "Listen for what the speaker is mostly talking about from beginning to end.",
  },
};

const PURPOSE_RULES = [
  ["stance", /opinion|claim|argu|stance|point of view|persuad|propos|counterclaim|agree|position/],
  ["sequence", /sequenc|in order|multi-step|\bsteps?\b|procedure|process|transition/],
  ["quantity", /number|quantit|amount|measure|decimal|\bdata\b|how many|how much/],
  ["gist", /main idea|gist|mostly about|summar|\btopic\b/],
];

/**
 * What to listen for, before the audio plays. An authored `listenPurpose` (a kind key, or
 * `{kind, text}`) wins; otherwise the kind comes from the item's own skill and function tags.
 * `focus` is the authored `listenFor` list. Returns null when there is nothing authored to show.
 */
export function listeningPurpose(activity = {}) {
  const focus = (Array.isArray(activity.listenFor) ? activity.listenFor : []).filter(Boolean);
  const authored = activity.listenPurpose;
  const authoredKind = typeof authored === "string" ? authored : authored?.kind;
  let kind = LISTENING_PURPOSES[authoredKind] ? authoredKind : null;
  if (!kind) {
    const tags = [activity.skill, ...(activity.wida || [])].join(" ").toLowerCase();
    kind = PURPOSE_RULES.find(([, re]) => re.test(tags))?.[0] || null;
  }
  if (!kind && !focus.length) return null;
  const base = kind ? LISTENING_PURPOSES[kind] : null;
  return {
    kind,
    label: base?.label || "",
    text: (typeof authored === "object" && authored?.text) || base?.text || "",
    focus,
  };
}

const TITLE_ABBR = /\b(Dr|Mr|Mrs|Ms|St|Prof)\.\s/g;
const TURN_START = /^((?:Dr|Mr|Mrs|Ms|Prof)\.\s)?[A-Z][\p{L}'’-]*(?:\s[A-Z][\p{L}'’-]*)?(?:,[^:.?!]{1,40})?:\s/u;

/**
 * The heard script as replayable parts: speaker turns when the script is a dialogue
 * ("Name: …" at two or more sentence starts), otherwise sentences. Text is the authored script.
 */
export function listeningSegments(script) {
  const text = (Array.isArray(script) ? script : [script])
    .map((s) => String(s ?? "").trim())
    .filter(Boolean)
    .join(" ");
  if (!text) return [];
  const sentences = text
    .replace(TITLE_ABBR, "$1\u0000 ")
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.replace(/\u0000/g, ".").trim())
    .filter(Boolean);
  const turnStarts = sentences.filter((s) => TURN_START.test(s)).length;
  if (turnStarts >= 2) {
    const turns = [];
    for (const s of sentences) {
      if (TURN_START.test(s) || !turns.length) turns.push([s]);
      else turns[turns.length - 1].push(s);
    }
    return turns.map((t, index) => ({ index, kind: "turn", text: t.join(" ") }));
  }
  return sentences.map((s, index) => ({ index, kind: "sentence", text: s }));
}

/** Discourse signal words a learner can tag in the transcript. Longest phrases first. */
export const SIGNAL_WORDS = [
  "on the other hand", "in contrast", "as a result", "for example", "for instance", "in addition",
  "rather than", "instead of", "however", "therefore", "although", "because", "instead", "actually",
  "finally", "first", "second", "third", "next", "then", "after", "before", "later", "last",
  "meanwhile", "also", "but", "so", "not", "never", "unless", "until",
];
const SIGNAL_RE = new RegExp(`\\b(${SIGNAL_WORDS.map((w) => w.replace(/ /g, "\\s+")).join("|")})\\b`, "gi");

/** Split a segment into plain text and signal-word parts, preserving the authored text exactly. */
export function signalParts(text) {
  const src = String(text ?? "");
  const parts = [];
  let at = 0;
  for (const m of src.matchAll(SIGNAL_RE)) {
    if (m.index > at) parts.push({ text: src.slice(at, m.index), signal: false });
    parts.push({ text: m[0], signal: true });
    at = m.index + m[0].length;
  }
  if (at < src.length) parts.push({ text: src.slice(at), signal: false });
  return parts;
}

const STOP = new Set(
  ("the a an and or but to of in on at for with from by is are was were be been being it its this that these those " +
    "he she they we you i me my our your their his her them us will would can could should may might must do does did " +
    "has have had not no so as if then than there here what when where who whom why how which about into onto out up " +
    "down all also just very more most some any each other such only own same too now get got go goes going say says " +
    "said listen choose answer best because after before first next finally last").split(" "),
);
const NEGATION = /\b(not|never|no|none|nobody|nothing|without|cannot|can't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|won't|shouldn't|couldn't)\b/i;
const NEGATION_WORD = new RegExp(NEGATION.source, "gi");
const CORRECTION = /\b(actually|instead|rather than|i mean|on second thought|correction|changed|no longer)\b/i;
const REPLACED = /\b(?:instead of|rather than)\s+((?:the|a|an|our|my|your)\s+)?([\p{L}\p{N}'’-]+(?:\s+[\p{L}\p{N}'’-]+)?)/giu;
const SEQUENCE = /\b(first|second|third|next|then|after|before|finally|last|later)\b/i;

const tokens = (text) => String(text ?? "").normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+(?:[.'’][\p{L}\p{N}]+)*/gu) || [];
function stem(word) {
  let w = word.replace(/['’]s$/, "");
  if (w.length > 5 && /(ing|ed)$/.test(w)) w = w.replace(/(ing|ed)$/, "");
  else if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) w = w.slice(0, -1);
  return w;
}
/** Content words of a text as stem → first surface form. */
function contentWords(text) {
  const out = new Map();
  for (const surface of String(text ?? "").normalize("NFKC").match(/[\p{L}\p{N}]+(?:[.'’][\p{L}\p{N}]+)*/gu) || []) {
    const t = surface.toLowerCase();
    if (STOP.has(t) || (t.length < 3 && !/\d/.test(t))) continue;
    const s = stem(t);
    if (!out.has(s)) out.set(s, surface);
  }
  return out;
}
const overlap = (a, b) => [...a.keys()].filter((k) => b.has(k));

function bestSegment(segments, text) {
  const words = contentWords(text);
  let best = null;
  let score = 0;
  for (const seg of segments) {
    const n = overlap(words, contentWords(seg.text)).length;
    if (n > score) [best, score] = [seg.index, n];
  }
  return best;
}

/** Messages for authored `distractor` tags on listening options (mission tags are accepted too). */
export const LISTENING_TRAPS = {
  "late-correction": "That was true earlier in the recording, but the speaker corrects or changes it later.",
  "missed-negation": "A small word such as not or never changes the meaning of what the speaker said.",
  "missed-sequence": "You heard that action, but it happens at a different time. Listen for the order word.",
  "familiar-word": "That choice repeats a word you heard, but it does not answer the question.",
  "detail-trap": "That detail is in the recording, but it is not what the question asks about.",
  opposite: "That is the opposite of what the speaker said. Listen for the direction of the idea.",
  partial: "That is only part of what the speaker said. Listen for the rest.",
  "true-not-asked": "That might be true, but it does not answer this question. Check the question word.",
  unsupported: "The speaker did not say that. Listen for the part that supports an answer.",
  overgeneralized: "That goes further than the speaker did. Listen for words like all, always or never.",
};

const quote = (w) => `“${w}”`;
const askedQuestion = (activity) => (/\?\s*$/.test(String(activity.prompt || "")) ? ` The question asks: ${activity.prompt}` : "");

function pickedOptions(activity, answer) {
  const options = activity.options || [];
  if (activity.type === "multipleChoice") {
    if (answer == null || answer === activity.answer) return null;
    const picked = options.find((o) => o.id === answer);
    const right = options.filter((o) => o.id === activity.answer);
    return picked && right.length ? { picked, right } : null;
  }
  if (activity.type === "multiSelect") {
    const keys = new Set(activity.answers || []);
    const picked = options.find((o) => (answer || []).includes(o.id) && !keys.has(o.id));
    const right = options.filter((o) => keys.has(o.id));
    return picked && right.length ? { picked, right } : null;
  }
  return null;
}

/**
 * Diagnose the likely listening trap behind a wrong answer. Returns
 * `{ trap, message, segment, word? }` or null. `segment` is the index of the part to replay.
 * Order: authored distractor tag → a replaced/corrected detail → a missed negation →
 * a missed sequence word → a familiar heard word that does not answer the question.
 */
export function diagnoseListening(activity = {}, answer) {
  const segments = listeningSegments(activity.script);
  if (!segments.length) return null;

  if (activity.type === "order") {
    const key = activity.answer || [];
    const given = Array.isArray(answer) ? answer : [];
    const at = key.findIndex((id, i) => given[i] !== id);
    if (at < 0 || !given.length || !segments.some((s) => SEQUENCE.test(s.text))) return null;
    const item = (activity.items || []).find((it) => it.id === key[at]);
    const segment = item ? bestSegment(segments, item.text) : null;
    if (segment == null) return null;
    return {
      trap: "missed-sequence",
      segment,
      message: "One step is in a different place than the speaker said. Replay this part and listen for the order word (first, next, then, finally) that comes with the action.",
    };
  }

  const pick = pickedOptions(activity, answer);
  if (!pick) return null;
  const { picked, right } = pick;
  const pickedWords = contentWords(picked.text);
  const rightWords = contentWords(right.map((o) => o.text).join(" "));
  const segWords = segments.map((s) => contentWords(s.text));

  const tag = picked.distractor || picked.trap;
  if (tag && LISTENING_TRAPS[tag]) {
    const segment = bestSegment(segments, picked.text) ?? bestSegment(segments, right.map((o) => o.text).join(" ")) ?? 0;
    return { trap: tag, segment, message: LISTENING_TRAPS[tag] };
  }

  // A detail the speaker replaced: "… the gym instead of the field."
  for (const seg of segments) {
    for (const m of seg.text.matchAll(REPLACED)) {
      const replaced = contentWords(m[2]);
      const hit = overlap(replaced, pickedWords).find((k) => !rightWords.has(k));
      if (hit)
        return {
          trap: "late-correction",
          segment: seg.index,
          word: replaced.get(hit),
          message: `You chose ${quote(replaced.get(hit))}, but the speaker said ${quote(m[0].trim())}. The plan changed, so ${quote(replaced.get(hit))} is the old information.`,
        };
    }
  }

  // Words heard only before a correction, when the right answer comes from the correction onward.
  const fix = segments.findIndex((s, i) => i > 0 && CORRECTION.test(s.text));
  if (fix > 0) {
    const heard = overlap(pickedWords, new Map(segWords.flatMap((w) => [...w])));
    const before = heard.filter((k) => segWords.slice(0, fix).some((w) => w.has(k)));
    const after = heard.filter((k) => segWords.slice(fix).some((w) => w.has(k)));
    const rightLater = overlap(rightWords, new Map(segWords.slice(fix).flatMap((w) => [...w]))).length > 0;
    if (before.length && !after.length && rightLater)
      return {
        trap: "late-correction",
        segment: fix,
        word: pickedWords.get(before[0]),
        message: `You heard ${quote(pickedWords.get(before[0]))} near the start, but later the speaker corrects or changes the information. Replay the part where it changes.`,
      };
  }

  // A negation the choice ignores: the choice repeats words that come right after "not"/"never".
  if (!NEGATION.test(picked.text)) {
    for (const seg of segments) {
      const words = tokens(seg.text);
      for (const m of seg.text.matchAll(NEGATION_WORD)) {
        const lead = tokens(seg.text.slice(0, m.index)).length;
        const windowWords = contentWords(words.slice(lead + 1, lead + 5).join(" "));
        const hit = overlap(pickedWords, windowWords).find((k) => !rightWords.has(k));
        if (hit && bestSegment(segments, picked.text) === seg.index)
          return {
            trap: "missed-negation",
            segment: seg.index,
            word: m[0],
            message: `The speaker said ${quote(m[0])} before ${quote(windowWords.get(hit))}. A small word like not or never flips the meaning. Replay that part and listen for it.`,
          };
      }
    }
  }

  // A sequence question answered with a step from a different time.
  if (SEQUENCE.test(String(activity.prompt || "")) || /sequenc|order|steps?\b/i.test(String(activity.skill || ""))) {
    const pickedSeg = bestSegment(segments, picked.text);
    const rightSeg = bestSegment(segments, right.map((o) => o.text).join(" "));
    if (pickedSeg != null && rightSeg != null && pickedSeg !== rightSeg && SEQUENCE.test(segments[rightSeg].text + segments[pickedSeg].text))
      return {
        trap: "missed-sequence",
        segment: rightSeg,
        message: "You heard that action, but it happens at a different time. Replay this part and listen for the order word.",
      };
  }

  // A familiar word: the choice repeats a heard word, but that word is not part of the right answer.
  const promptWords = contentWords(activity.prompt);
  const familiar = [...pickedWords.keys()].find(
    (k) => !rightWords.has(k) && !promptWords.has(k) && segWords.some((w) => w.has(k)),
  );
  if (familiar) {
    const segment = segWords.findIndex((w) => w.has(familiar));
    return {
      trap: "familiar-word",
      segment,
      word: pickedWords.get(familiar),
      message: `You heard ${quote(pickedWords.get(familiar))} in the recording, but hearing a familiar word does not make a choice correct.${askedQuestion(activity)}`,
    };
  }
  return null;
}

// Learn-with-help note-taking scratchpad: one small record per activity, on this device only. It uses
// its own key prefix so it is never folded into a progress code, and every read tolerates corrupt data.
export const LISTEN_NOTE_FIELDS = [
  ["main", "Main idea"],
  ["details", "Key details"],
  ["signals", "Signal words"],
];
const NOTES_PREFIX = "accessPracticeLab:listenNotes:v1:";
const NOTE_MAX = 2000;
export const listenNotesKey = (id) => `${NOTES_PREFIX}${id}`;
const emptyNotes = () => Object.fromEntries(LISTEN_NOTE_FIELDS.map(([k]) => [k, ""]));

export function loadListenNotes(store, id) {
  const notes = emptyNotes();
  let parsed = null;
  try {
    const raw = store?.get(listenNotesKey(id));
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }
  if (parsed && typeof parsed === "object")
    for (const [k] of LISTEN_NOTE_FIELDS) if (typeof parsed[k] === "string") notes[k] = parsed[k].slice(0, NOTE_MAX);
  return notes;
}

export function saveListenNotes(store, id, notes = {}) {
  const clean = emptyNotes();
  for (const [k] of LISTEN_NOTE_FIELDS) clean[k] = String(notes[k] ?? "").slice(0, NOTE_MAX);
  try {
    if (Object.values(clean).every((v) => !v.trim())) store?.remove(listenNotesKey(id));
    else store?.set(listenNotesKey(id), JSON.stringify(clean));
  } catch {
    /* storage unavailable: the notes stay on screen for this visit */
  }
  return clean;
}

export function clearListenNotes(store, id) {
  try {
    store?.remove(listenNotesKey(id));
  } catch {
    /* nothing to clear */
  }
  return emptyNotes();
}
