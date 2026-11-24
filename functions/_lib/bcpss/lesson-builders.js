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

const FALSE_FRIEND_RE = /false friend|careful|do not confuse|not the same|means .* not/i;
const COGNATE_RE = /cognate|true cognates|same root|share a (latin )?root/i;

export function cognateStatusOf(v) {
  const note = String(v.es_note || "");
  if (FALSE_FRIEND_RE.test(note)) return "false_friend";
  if (COGNATE_RE.test(note) && !/\bnot a cognate\b|\bno exact cognate\b/i.test(note)) return "true";
  return "none";
}

export function cognateDetective(items, title) {
  return {
    kind: "cognate_detective",
    domain: "Vocabulary",
    title,
    mission:
      "Say each English and Spanish word pair, then sort them into true cognate, false friend, or no look-alike.",
    grouping: "Partners",
    minutes: 4,
    tip: "Say each pair aloud first, and let students decide before you show the answer.",
    support: SUPPORT(
      "Say both words and listen for the same sounds.",
      "Sort the pairs and read the reason for each answer.",
      "Sort the pairs, then use two of the English words in a sentence.",
    ),
    payload: { items },
  };
}

const MORPH_PREFIXES = [
  "non",
  "un",
  "re",
  "dis",
  "pre",
  "sub",
  "inter",
  "trans",
  "super",
  "anti",
  "de",
  "in",
  "im",
  "bi",
  "tri",
  "multi",
  "over",
  "under",
  "mis",
  "out",
  "up",
  "down",
  "fore",
  "mid",
  "auto",
  "bio",
  "geo",
  "micro",
  "tele",
  "photo",
  "hydro",
  "therm",
  "equi",
  "per",
  "dia",
  "con",
  "com",
  "ex",
  "pro",
];
const MORPH_SUFFIXES = [
  "ation",
  "ition",
  "tion",
  "sion",
  "ment",
  "ness",
  "less",
  "ful",
  "able",
  "ible",
  "tive",
  "sive",
  "ive",
  "ous",
  "ious",
  "eous",
  "ical",
  "ial",
  "al",
  "ic",
  "er",
  "or",
  "ist",
  "ism",
  "ity",
  "ty",
  "ly",
  "age",
  "ent",
  "ant",
  "ure",
  "ed",
  "ing",
  "es",
  "s",
];

export function splitMorphWord(word, baseTerm = "", family = []) {
  if (/[ -]/.test(word)) return null;
  const lower = word.toLowerCase();
  const stems = new Set(
    [baseTerm, ...family].filter((w) => !/[ -]/.test(w)).map((w) => w.toLowerCase()),
  );
  for (const stem of stems) {
    if (stem === lower || stem.length < 3) continue;
    const idx = lower.indexOf(stem);
    if (idx >= 0) {
      const pre = word.slice(0, idx);
      const mid = word.slice(idx, idx + stem.length);
      const suf = word.slice(idx + stem.length);
      if (
        (pre.length === 0 || MORPH_PREFIXES.includes(pre.toLowerCase())) &&
        (suf.length === 0 || MORPH_SUFFIXES.includes(suf.toLowerCase()))
      ) {
        const parts = [pre, mid, suf].filter(Boolean);
        if (parts.length >= 2 && parts.length <= 4 && parts.join("") === word) return parts;
      }
    }
  }
  let rem = word;
  let pre = "";
  for (const p of MORPH_PREFIXES) {
    if (rem.toLowerCase().startsWith(p) && rem.length - p.length >= 3) {
      pre = rem.slice(0, p.length);
      rem = rem.slice(p.length);
      break;
    }
  }
  let suf = "";
  for (const s of MORPH_SUFFIXES) {
    if (rem.toLowerCase().endsWith(s) && rem.length - s.length >= 3) {
      suf = rem.slice(rem.length - s.length);
      rem = rem.slice(0, rem.length - s.length);
      break;
    }
  }
  const parts = [pre, rem, suf].filter(Boolean);
  return parts.length >= 2 && parts.length <= 4 && parts.join("") === word ? parts : null;
}

export function morphItemsFor(studio, focus, seq) {
  const ordered = [...focus, ...rotate(studio.vocab, seq)];
  const items = [];
  for (const v of ordered) {
    for (const w of [v.term, ...(v.family || [])]) {
      const parts = splitMorphWord(w, v.term, v.family || []);
      if (parts && !items.some((x) => x.word.toLowerCase() === w.toLowerCase())) {
        items.push({ word: w, parts, meaning: stripEnd(lc1(v.def)) });
      }
      if (items.length >= 4) return items;
    }
  }
  return items;
}

export function morphLab(items, title) {
  return {
    kind: "morph_lab",
    domain: "Vocabulary",
    title,
    mission: `Build ${items.length} words from their parts, starting with ${q(items[0].word)}, and read what each word means.`,
    grouping: "Partners",
    minutes: 6,
    tip: "Ask students which part carries the core meaning and which part changes the ending or adds a prefix.",
    support: SUPPORT(
      "Say each word part out loud before you place it in order.",
      "Build each word, then tell a partner what the parts mean together.",
      "Build each word, then write one more word that shares the same prefix or ending.",
    ),
    payload: { items },
  };
}

export function paragraphBuilder({ klu, slots, connectors, checklist, model }, title) {
  return {
    kind: "paragraph_builder",
    domain: "Writing",
    title,
    mission: `Fill each part of the ${klu} organizer, join your ideas with ${q(connectors[0])} and ${q(connectors[1])}, and check your paragraph.`,
    grouping: "Solo",
    minutes: 5,
    klu,
    tip: "Have students read their joined paragraph aloud to a partner before checking the boxes.",
    support: SUPPORT(
      "Use the frame starter in each box and finish it with words from today's lesson.",
      "Fill all parts and connect two ideas with a joining word.",
      "Write complete sentences in each box and add a specific example or reason.",
    ),
    payload: { klu, slots, connectors, checklist, model },
  };
}

export function escapeLocksFor(studio, seq) {
  const letters = ["A", "B", "C"];
  const vocab = rotate(studio.vocab, seq);
  const locks = [];
  for (let i = 0; i < Math.min(6, vocab.length); i++) {
    const v = vocab[i];
    const wrong = pick(
      studio.vocab.filter((o) => o.term !== v.term),
      `esc:${seq}:${i}:${v.term}`,
      2,
    ).map((o) => o.term);
    const options = pick([v.term, ...wrong], `escpos:${seq}:${i}`, 3);
    const answer = options.indexOf(v.term);
    const gap = i % 2 === 1 ? blank(v.example, v.term) : null;
    locks.push({
      title: `Lock ${i + 1}: ${v.term}`,
      q: gap
        ? `Which word unlocks the sentence? ${gap}`
        : `Which word means: ${stripEnd(lc1(v.def))}?`,
      options,
      answer,
      why: `${q(v.term)} means ${stripEnd(lc1(v.def))}.`,
      code: `${letters[answer]}${i + 1}`,
    });
  }
  return locks;
}

export function missionEscape({ locks, certificate }, title) {
  return {
    kind: "mission_escape",
    domain: "Game",
    title,
    mission: `Solve all ${locks.length} unit locks, starting with ${q(locks[0].title)}, to unlock your ${certificate.badge} certificate.`,
    grouping: "Partners",
    minutes: 8,
    tip: "Partners solve each lock together and read the reason aloud before moving to the next lock; print the certificate at the end.",
    support: SUPPORT(
      "Listen to each lock clue with the audio button and use the Hint button if you need to narrow the choices.",
      "Read each lock clue, explain why your choice fits, and record the vault code.",
      "Unlock all locks on the first try, then explain how each word helps answer the unit's big question.",
    ),
    payload: { locks, certificate },
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
