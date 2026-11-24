// Activity builders for generated BCPSS lesson companions. Every activity is assembled from the unit's
// own authored studio content (vocab, mentor sentence, frames, activity payloads, exit ticket); nothing is
// written from the unit title. Deterministic: same unit -> same lessons.

const hash = (s) => {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
};
export const pick = (list, seed, n = 1) =>
  [...list]
    .map((item, i) => ({ item, k: hash(`${seed}:${i}`) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, n)
    .map((x) => x.item);
const rotate = (list, by) =>
  list.length ? list.slice(by % list.length).concat(list.slice(0, by % list.length)) : list;
const q = (t) => `“${t}”`;
const stripEnd = (s) =>
  String(s || "")
    .trim()
    .replace(/[.!?]+$/, "");
const lc1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const blank = (sentence, term) => {
  const re = new RegExp(
    `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:s|es|d|ed|ing)?\\b`,
    "i",
  );
  return re.test(sentence) ? sentence.replace(re, "_____") : null;
};

const SUPPORT = (l1, l2, l3) => ({ l1_2: l1, l3_4: l2, l5_6: l3 });

// ── Mentor sentence chunking (only splits at safe boundaries) ────────────────
const BOUNDARY =
  /\s+(?=(?:because|so|since|but|and|that|which|to|across|with|from|for|after|before|when|while)\b)/i;
const CONNECTORS = new Set([
  "because",
  "so",
  "since",
  "but",
  "and",
  "after",
  "before",
  "when",
  "while",
]);

export function chunkSentence(text) {
  const parts = stripEnd(text)
    .split(BOUNDARY)
    .map((p) => p.trim())
    .filter(Boolean);
  const merged = [];
  for (const p of parts) {
    if (merged.length && p.split(/\s+/).length < 2) merged[merged.length - 1] += ` ${p}`;
    else merged.push(p);
  }
  if (merged.length < 3) return null;
  const out = merged.slice(0, 6).map((p, i, all) => {
    const first = p.split(/\s+/)[0].toLowerCase();
    if (CONNECTORS.has(first)) return { text: p, role: "Joins the next idea", tone: "connector" };
    if (i === 0) return { text: p, role: "Who or what", tone: "concept" };
    if (i === 1) return { text: p, role: "What happens", tone: "precision" };
    return { text: p, role: i === all.length - 1 ? "More detail" : "The detail", tone: "evidence" };
  });
  out[out.length - 1].text += text.trim().match(/[.!?]$/)?.[0] || ".";
  const joined = out.map((c) => c.text).join(" ");
  return joined.replace(/\s+/g, " ") === text.replace(/\s+/g, " ").trim() ? out : null;
}

export function mentorFor(studio, focus, seq) {
  const cands = [];
  if (seq === 1 && studio.mentor) return { text: studio.mentor.text, chunks: studio.mentor.chunks };
  for (const v of focus) cands.push(v.example);
  cands.push(studio.exit_ticket?.model, ...studio.vocab.map((v) => v.example));
  for (const c of cands.filter(Boolean)) {
    const chunks = chunkSentence(c);
    if (chunks) return { text: c, chunks };
  }
  return { text: studio.mentor.text, chunks: studio.mentor.chunks };
}

// ── Activity builders ────────────────────────────────────────────────────────
export function flashRetrieval(cards, title) {
  return {
    kind: "flash_retrieval",
    domain: "Vocabulary",
    title,
    mission: `Read each question, say your answer out loud, then flip the card to check ${cards.length} words.`,
    grouping: "Partners",
    minutes: 4,
    tip: "Partners quiz each other; wrong answers are just 'not yet' and go back in the pile.",
    support: SUPPORT(
      "Point to the picture or icon and say the word with your partner.",
      "Answer in a full sentence, then flip the card to check.",
      "Answer without looking, then add one example of your own.",
    ),
    payload: { cards },
  };
}

export function listenAndShow(items, title, firstTerm) {
  return {
    kind: "listen_and_show",
    domain: "Listening",
    title,
    mission: `Listen to each sentence, then tap the word it is about. Start with the one about ${q(firstTerm)}.`,
    grouping: "Solo",
    minutes: 5,
    tip: "Play each sentence twice; read it aloud slowly for the first listen if the audio is not available.",
    support: SUPPORT(
      "Listen once, tap, then listen again with the words showing.",
      "Listen, tap, and say the sentence back to a partner.",
      "Tap first, then explain which clue word helped you choose.",
    ),
    payload: { items },
  };
}

export function sentenceXray(mentor, title, ask) {
  return {
    kind: "sentence_xray",
    domain: "Reading",
    title,
    mission:
      "Look inside the sentence: every chunk has a job, so drag the chunks back into the right order.",
    grouping: "Whole Class",
    minutes: 5,
    tip: "Say each chunk's job out loud before students rebuild; have them point to the joining word.",
    support: SUPPORT(
      "Tap each colored chunk and listen to it.",
      "Rebuild the sentence, then name the job of each chunk.",
      "Rebuild it, then write a new sentence with the same chunks and different content.",
    ),
    payload: { text: mentor.text, chunks: mentor.chunks, ask },
  };
}

export function speakAndRecord({ prompt, frame, model, checklist }, title) {
  return {
    kind: "speak_and_record",
    domain: "Speaking",
    title,
    mission: "Say your answer out loud, record it, listen back, and check it against the list.",
    grouping: "Solo",
    minutes: 5,
    tip: "Recordings stay on the student's device; ask a partner to listen for one item from the checklist.",
    support: SUPPORT(
      "Say one sentence with the frame and the word bank.",
      "Say two connected sentences and use one joining word.",
      "Say three sentences and include a reason or evidence.",
    ),
    payload: { prompt, frame, model, checklist },
  };
}

export function exitCheck(items, canDo, title) {
  return {
    kind: "exit_check",
    domain: "Vocabulary",
    title,
    mission: "Answer the questions, then tell us how confident you feel about today's goal.",
    grouping: "Solo",
    minutes: 3,
    tip: "Collect the can-do ratings; students who choose 'with help' meet you at the next small-group time.",
    support: SUPPORT(
      "Listen to each question with the audio button, then tap an answer.",
      "Read each question, tap an answer, and read the reason.",
      "Answer, then fix any mistake before you rate yourself.",
    ),
    payload: { can_do: canDo, items },
  };
}

export function pointAndSay(items, title) {
  return {
    kind: "point_and_say",
    domain: "Vocabulary",
    title,
    mission: `Look at each picture clue, point to it, and say the word with the audio. You will meet ${items.length} words.`,
    grouping: "Partners",
    minutes: 5,
    tip: "No reading is needed: show the cue, say the word, and let the student repeat it.",
    support: SUPPORT(
      "Point and say one word at a time.",
      "Point, say the word, and say the whole sentence.",
      "Say the word and change the sentence to use your own idea.",
    ),
    payload: { items },
  };
}

export function tprCards(items, title) {
  return {
    kind: "tpr_cards",
    domain: "Listening",
    title,
    mission: "Listen to each command and show it with your body or an object.",
    grouping: "Whole Class",
    minutes: 4,
    tip: "Model each action first, then give the command without modeling.",
    support: SUPPORT(
      "Copy the action with a partner.",
      "Do the action on your own.",
      "Give the command to a partner.",
    ),
    payload: { items },
  };
}

export function homeLanguageBridge(items, title) {
  return {
    kind: "home_language_bridge",
    domain: "Vocabulary",
    title,
    mission:
      "Say each word in English and in your home language, then tell a partner how the two words are alike.",
    grouping: "Partners",
    minutes: 4,
    tip: "Invite students to add words in any language; Spanish glosses are teacher-reviewed drafts.",
    support: SUPPORT(
      "Say both words with your partner.",
      "Say both words and one way they are alike or different.",
      "Explain how the two words work in a sentence in each language.",
    ),
    payload: { items },
  };
}

// ── Payload slicing from authored unit activities ────────────────────────────
export const activityOf = (studio, kind) => studio.activities.find((a) => a.kind === kind) || null;

export function sliceTalk(studio, seq) {
  const a = activityOf(studio, "talk_cards");
  if (!a) return null;
  const cards = rotate(a.payload.cards, seq).slice(0, 3);
  return { ...a, minutes: 6, payload: { ...a.payload, cards } };
}

export function sliceItems(studio, kind, seq, n = 2) {
  const a = activityOf(studio, kind);
  if (!a?.payload?.items) return null;
  return {
    ...a,
    minutes: 6,
    payload: { ...a.payload, items: rotate(a.payload.items, seq).slice(0, n) },
  };
}

export function exitItems(focus, studio, seq) {
  const others = studio.vocab.filter((v) => !focus.some((f) => f.term === v.term));
  const items = [];
  const t1 = focus[0];
  const wrong = (t, k) =>
    pick(
      others.filter((o) => o.term !== t.term),
      `${seq}:${k}:${t.term}`,
      2,
    ).map((o) => o.term);
  const place = (right, wr, seed) => {
    const options = pick([right, ...wr], `pos:${seed}`, 3);
    return { options, answer: options.indexOf(right) };
  };
  items.push({
    q: `Which word means: ${stripEnd(lc1(t1.def))}?`,
    ...place(t1.term, wrong(t1, "d"), `${seq}d`),
    why: `${q(t1.term)} means ${stripEnd(lc1(t1.def))}.`,
  });
  for (const v of focus.slice(0, 2)) {
    const gap = blank(v.example, v.term);
    if (!gap) continue;
    items.push({
      q: `Which word finishes the sentence? ${gap}`,
      ...place(v.term, wrong(v, "g"), `${seq}g${v.term}`),
      why: `${q(v.term)} fits because it means ${stripEnd(lc1(v.def))}.`,
    });
  }
  return items.slice(0, 3);
}
