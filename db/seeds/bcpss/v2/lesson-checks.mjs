// Checks for lesson companions beyond JSON Schema: new-kind payloads, machine-checkable answer keys,
// template leaks, coverage. Shared by tools/validate-bcpss-lessons.mjs and the API tests.

export const MIN_LESSONS = { ELA: 12, Math: 8, Science: 10, "Social Studies": 10 };
const isStr = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const isArr = (v, min, max = Infinity) => Array.isArray(v) && v.length >= min && v.length <= max;
const TONES = ["concept", "connector", "evidence", "precision"];
const LEAK = /\[slot\]|\{[A-Za-z_]\w*\}|\bundefined\b|\bnull\b|\bNaN\b|\s{2,}(?=\S)/;

function mcq(items, add, ctx, min, max) {
  if (!isArr(items, min, max)) return add(`${ctx}: ${min}-${max} items required`);
  items.forEach((it, i) => {
    const opts = it.options;
    if (!(isArr(opts, 3, 3) && Number.isInteger(it.answer) && it.answer >= 0 && it.answer < 3)) return add(`${ctx} item ${i + 1}: 3 options and a valid answer index`);
    const labels = opts.map((o) => (typeof o === "string" ? o : o.label));
    if (new Set(labels.map((l) => String(l).toLowerCase())).size !== 3) add(`${ctx} item ${i + 1}: options must be distinct`);
    if (!isStr(it.why, 12)) add(`${ctx} item ${i + 1}: why (kind feedback) required`);
  });
}

const PAYLOAD = {
  flash_retrieval: (p, add, c) => {
    if (!isArr(p.cards, 3, 6) || !p.cards.every((x) => isStr(x.prompt, 8) && isStr(x.answer))) add(`${c}: 3-6 cards {prompt, answer}`);
  },
  listen_and_show: (p, add, c) => {
    mcq(p.items, add, c, 3, 5);
    for (const it of p.items || []) if (!isStr(it.say, 12)) add(`${c}: each item needs a sentence to say`);
  },
  sentence_xray: (p, add, c) => {
    if (!(isStr(p.text, 20) && isArr(p.chunks, 3, 6))) return add(`${c}: text + 3-6 chunks`);
    if (p.chunks.map((x) => x.text).join(" ").replace(/\s+/g, " ").trim() !== p.text.replace(/\s+/g, " ").trim()) add(`${c}: chunks must join to text exactly`);
    for (const x of p.chunks) if (!(isStr(x.role) && TONES.includes(x.tone))) add(`${c}: chunk "${x.text}" needs role and tone`);
  },
  speak_and_record: (p, add, c) => {
    if (!(isStr(p.prompt, 12) && isStr(p.frame, 8) && isStr(p.model, 12) && isArr(p.checklist, 3, 3))) add(`${c}: prompt, frame, model, checklist(3)`);
  },
  exit_check: (p, add, c) => {
    if (!isStr(p.can_do, 12) || !/^I can /.test(p.can_do)) add(`${c}: can_do must start with "I can"`);
    mcq(p.items, add, c, 2, 3);
  },
  point_and_say: (p, add, c) => {
    if (!isArr(p.items, 3, 5) || !p.items.every((x) => isStr(x.term) && isStr(x.cue, 8) && isStr(x.say, 8))) add(`${c}: 3-5 items {term, cue, say}`);
  },
  tpr_cards: (p, add, c) => {
    if (!isArr(p.items, 3, 6) || !p.items.every((x) => isStr(x.command, 8))) add(`${c}: 3-6 commands`);
  },
  home_language_bridge: (p, add, c) => {
    if (!isArr(p.items, 2, 4) || !p.items.every((x) => isStr(x.term) && isStr(x.es) && isStr(x.note, 6))) add(`${c}: 2-4 items {term, es, note}`);
  },
  cognate_detective: (p, add, c) => {
    if (
      !isArr(p.items, 4, 8) ||
      !p.items.every(
        (x) =>
          isStr(x.term) &&
          isStr(x.es) &&
          ["true", "false_friend", "none"].includes(x.status) &&
          isStr(x.why, 10),
      )
    )
      add(`${c}: 4-8 items {term, es, status: true|false_friend|none, why}`);
  },
  morph_lab: (p, add, c) => {
    if (
      !isArr(p.items, 3, 5) ||
      !p.items.every(
        (x) =>
          isStr(x.word) &&
          isArr(x.parts, 2, 4) &&
          x.parts.every((pt) => isStr(pt)) &&
          x.parts.join("") === x.word &&
          isStr(x.meaning, 6),
      )
    )
      add(`${c}: 3-5 items {word, parts(2-4 joining to word), meaning}`);
  },
  paragraph_builder: (p, add, c) => {
    const KLUS = ["Narrate", "Inform", "Explain", "Argue"];
    if (
      !(
        KLUS.includes(p.klu) &&
        isArr(p.slots, 2, 6) &&
        p.slots.every((s) => isStr(s.label) && isStr(s.frame, 6)) &&
        isArr(p.connectors, 2) &&
        p.connectors.every((cn) => isStr(cn)) &&
        isArr(p.checklist, 2, 6) &&
        p.checklist.every((ck) => isStr(ck, 6)) &&
        isStr(p.model, 20)
      )
    )
      add(`${c}: klu, slots(2-6 {label, frame}), connectors(2+), checklist(2-6), model`);
  },
  mission_escape: (p, add, c) => {
    if (!isArr(p.locks, 5, 7)) return add(`${c}: 5-7 locks required`);
    if (
      !(
        p.certificate &&
        isStr(p.certificate.title, 6) &&
        isStr(p.certificate.badge, 4) &&
        isArr(p.certificate.can_do, 1, 4)
      )
    )
      add(`${c}: certificate {title, badge, can_do(1-4)} required`);
    p.locks.forEach((lk, i) => {
      if (!isStr(lk.title, 4)) add(`${c} lock ${i + 1}: title required`);
      if (!isStr(lk.q, 10)) add(`${c} lock ${i + 1}: q required`);
      mcq([lk], add, `${c} lock ${i + 1}`, 1, 1);
    });
  },
};
const OLD_KEYS = {
  word_sort: ["categories", "items"], match: ["pairs"], cloze: ["text", "answers", "bank"], unscramble: ["items"],
  dictogloss: ["text", "key_words"], info_gap: ["a", "b"], error_analysis: ["items"], sentence_combine: ["items"], quiz: ["items"],
  talk_cards: ["cards", "moves"], write_scaffold: ["prompt", "model"], sequence: ["steps"], clue_game: ["cards"], read_annotate: ["text", "questions"],
};

export function checkActivity(a, add, ctx) {
  const c = `${ctx} "${a.title}" [${a.kind}]`;
  if (PAYLOAD[a.kind]) PAYLOAD[a.kind](a.payload || {}, add, c);
  else if (OLD_KEYS[a.kind]) for (const k of OLD_KEYS[a.kind]) if (!(k in (a.payload || {}))) add(`${c}: payload.${k} missing`);
  if (/\b(timer|countdown|beat the clock|seconds left)\b/i.test(`${a.mission} ${a.tip}`)) add(`${c}: no timers`);
}

function* strings(v, path = "") {
  if (typeof v === "string") yield [path, v];
  else if (Array.isArray(v)) for (const [i, x] of v.entries()) yield* strings(x, `${path}[${i}]`);
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) yield* strings(x, path ? `${path}.${k}` : k);
}

export function checkLesson(lesson, unit, add) {
  const ctx = lesson.id;
  const steps = lesson.arc.map((s) => s.step).join(",");
  if (steps !== "warm_up,input,notice,interact,produce,check") add(`${ctx}: arc must run warm_up,input,notice,interact,produce,check`);
  for (const s of lesson.arc) checkActivity(s.activity, add, `${ctx} ${s.step}`);
  for (const a of lesson.newcomer_path) checkActivity(a, add, `${ctx} newcomer`);
  if (lesson.extension) checkActivity(lesson.extension, add, `${ctx} extension`);
  checkActivity(lesson.exit_check, add, `${ctx} exit`);
  if (lesson.exit_check.kind !== "exit_check") add(`${ctx}: exit_check must be kind exit_check`);
  const noReading = new Set(["point_and_say", "tpr_cards", "home_language_bridge", "cognate_detective", "listen_and_show"]);
  if (!lesson.newcomer_path.every((a) => noReading.has(a.kind))) add(`${ctx}: newcomer path may only use no-reading kinds`);
  const m = lesson.mentor_sentence;
  if (m.chunks.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim() !== m.text.replace(/\s+/g, " ").trim()) add(`${ctx}: mentor chunks must join to the sentence`);
  const title = String(unit.unit_title || "").trim();
  const re = title.length >= 14 ? new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;
  for (const [path, s] of strings(lesson)) {
    if (LEAK.test(s)) add(`${ctx}: unresolved token or double space at ${path}`);
    if (re && re.test(s)) add(`${ctx}: unit title pasted into ${path}`);
  }
}

export function checkCoverage(unit, lessons, add) {
  const min = MIN_LESSONS[unit.subject] || 8;
  if (lessons.length < min) add(`${unit.id}: ${lessons.length} lessons, need ${min}`);
  lessons.forEach((l, i) => {
    if (l.sequence !== i + 1) add(`${l.id}: sequence must run 1..n`);
  });
  const dom = (d) => lessons.reduce((n, l) => n + [...l.arc.map((s) => s.activity), ...l.newcomer_path].filter((a) => a.domain === d).length, 0);
  const total = lessons.reduce((n, l) => n + l.arc.length + l.newcomer_path.length, 0);
  if (dom("Listening") / total < 0.2) add(`${unit.id}: Listening is ${Math.round((100 * dom("Listening")) / total)}% of activities, need 20%`);
}
