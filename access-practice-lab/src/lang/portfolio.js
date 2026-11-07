// My Portfolio: pure logic that gathers a learner's own saved work from across the lab into one portfolio.
// It reads what the lab already keeps (writing studio versions, Language World drafts, warm-up sentences, kept
// recording metadata, the reading log, flashcards, the evidence ledger) and never stores a second copy.
// Nothing here is a score, a level or a prediction: counts, dates and the learner's own words only.
//
//   collect({ band, studio, exhibition, warmup, reading, flashcards, ledger, recordings, titles, badges, prefs })
import { dayIndex, monday, tierOf, usesWord } from "./warmup.js";

const day = (t) => String(t || "").slice(0, 10);
const asArray = (v) => (Array.isArray(v) ? v : []);
const wc = (t) =>
  String(t || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
/** Writing samples: one per piece of work, showing its latest version and whether it was revised. */
export function writingSamples({ band, studio, exhibition, warmup, titles = {} }) {
  const out = [];
  for (const [id, w] of Object.entries(studio?.writing || {})) {
    const versions = asArray(w.versions).filter((v) => v?.text?.trim());
    if (!versions.length) continue;
    const last = versions.at(-1);
    out.push({
      key: `w:${id}`,
      source: "writing",
      title: titles.writing?.[id] || id,
      first: versions[0].text,
      text: last.text,
      t: last.t || "",
      revised: versions.length > 1,
      versions: versions.length,
      reflection: String(w.reflection || ""),
    });
  }
  const attempts = asArray(exhibition?.bands?.[band]?.tasks?.write?.attempts);
  attempts.forEach((a, n) => {
    const drafts = asArray(a.drafts).filter((d) => d?.text?.trim());
    if (!drafts.length) return;
    out.push({
      key: `x:${band}:${n}`,
      source: "world",
      title: "",
      first: drafts[0].text,
      text: drafts.at(-1).text,
      t: drafts.at(-1).at || "",
      revised: drafts.length > 1,
      versions: drafts.length,
      reflection: "",
    });
  });
  for (const [k, d] of Object.entries(warmup?.days || {})) {
    const text = d?.q?.text?.trim();
    if (!text || wc(text) < 3) continue;
    out.push({
      key: `q:${k}`,
      source: "warmup",
      title: "",
      first: text,
      text,
      t: d.at || `${k.split("|")[1]}T12:00:00`,
      revised: false,
      versions: 1,
      reflection: "",
      tier: k.split("|")[0],
    });
  }
  return out.sort((a, b) => String(b.t).localeCompare(String(a.t)));
}

/** The showcase: pinned pieces first, then the most revised, then the newest. Never more than `limit`. */
export function showcase(samples, pins = [], limit = 4) {
  const pinned = pins.map((k) => samples.find((s) => s.key === k)).filter(Boolean);
  const rest = samples
    .filter((s) => !pins.includes(s.key))
    .sort((a, b) => b.versions - a.versions || String(b.t).localeCompare(String(a.t)) || 0);
  return [...pinned, ...rest].slice(0, Math.max(limit, pinned.length));
}

/** Kept-recording metadata plus the takes saved in the speaking studio. Audio itself is never read here. */
export function recordingList({ studio, recordings = [], titles = {} }) {
  const kept = new Map(recordings.map((r) => [r.id, r]));
  const out = [];
  for (const [id, s] of Object.entries(studio?.speaking || {}))
    for (const take of asArray(s.takes))
      out.push({
        id: take.id,
        task: id,
        title: titles.speaking?.[id] || id,
        t: take.t || "",
        seconds: Math.round(Number(take.seconds) || 0),
        kept: kept.has(take.id) || take.keptAudio === true,
        reviewed: Boolean(take.selfReview),
      });
  return out.sort((a, b) => String(b.t).localeCompare(String(a.t)));
}

export const reflectionList = (reading) =>
  asArray(reading?.log)
    .filter((r) => r?.note || r?.title)
    .map((r) => ({ title: r.title, note: r.note || "", minutes: r.minutes || null, t: r.t }))
    .sort((a, b) => String(b.t).localeCompare(String(a.t)));

/**
 * The vocabulary garden: every word the learner met, with how many separate times they worked with it.
 * 1 time = a seed, 2-3 = a sprout, 4 or more = a bloom. It counts practice, not mastery, and never goes down.
 * Warm-up words need the tier's word list (`wordLists`: { "K-1": [entry...] }) to be matched with the date.
 */
export function gardenWords({ warmup, wordLists = {}, reading, flashcards }) {
  const map = new Map();
  const touch = (word, es = "", n = 1) => {
    const k = String(word || "")
      .toLowerCase()
      .trim();
    if (!k) return;
    const cur = map.get(k) || { word: k, es: "", n: 0 };
    cur.n += n;
    if (es && !cur.es) cur.es = es;
    map.set(k, cur);
  };
  for (const [key, d] of Object.entries(warmup?.days || {})) {
    const [tier, iso] = key.split("|");
    const list = wordLists[tier];
    const entry = list?.length ? list[dayIndex(iso, tier, list.length)] : null;
    const word = entry?.w;
    if (!word) continue;
    const es = entry.es || "";
    if (d.w) touch(word, es);
    if (d.l?.ok) touch(word, es);
    if (d.q?.text && usesWord(d.q.text, word)) touch(word, es);
    if (d.s?.done) touch(word, es);
  }
  for (const w of asArray(reading?.words)) touch(w.term || w.word, w.es || "");
  for (const deck of Object.values(flashcards || {}))
    for (const [term, s] of Object.entries(deck || {}))
      if (s && typeof s === "object") touch(term, "", Math.min(2, Math.max(0, Number(s.box) || 0)));
  const stage = (n) => (n >= 4 ? 3 : n >= 2 ? 2 : 1);
  return [...map.values()]
    .filter((x) => x.n > 0)
    .map((x) => ({ ...x, stage: stage(x.n) }))
    .sort((a, b) => b.stage - a.stage || a.word.localeCompare(b.word));
}

/** Dated moments, newest week first. Each is something the learner did; none is a grade. */
export function timeline({
  studio,
  warmup,
  reading,
  ledger,
  exhibition,
  band,
  badges = {},
  titles = {},
}) {
  const ev = [];
  const add = (t, kind, en, es) => {
    if (t && /^\d{4}-\d{2}-\d{2}/.test(t)) ev.push({ t, kind, en, es });
  };
  for (const [id, w] of Object.entries(studio?.writing || {})) {
    const v = asArray(w.versions);
    const title = titles.writing?.[id] || id;
    if (v[0]) add(v[0].t, "writing", `Started writing: ${title}`, `Empecé a escribir: ${title}`);
    if (v.length > 1)
      add(v.at(-1).t, "revision", `Revised my writing: ${title}`, `Revisé mi escritura: ${title}`);
  }
  for (const [id, s] of Object.entries(studio?.speaking || {})) {
    const title = titles.speaking?.[id] || id;
    const first = asArray(s.takes)[0];
    if (first)
      add(first.t, "speaking", `Practiced speaking: ${title}`, `Practiqué hablar: ${title}`);
  }
  for (const [id, m] of Object.entries(studio?.missions || {}))
    if (m?.started)
      add(
        m.started,
        "mission",
        `Started a mission: ${titles.missions?.[id] || id}`,
        `Empecé una misión: ${titles.missions?.[id] || id}`,
      );
  for (const r of asArray(reading?.log)) add(r.t, "reading", `Read: ${r.title}`, `Leí: ${r.title}`);
  for (const a of asArray(exhibition?.bands?.[band]?.tasks?.write?.attempts)) {
    const d = asArray(a.drafts);
    if (d[0])
      add(d[0].at, "writing", "Wrote in the Language World", "Escribí en el Mundo del lenguaje");
    if (d.length > 1)
      add(
        d.at(-1).at,
        "revision",
        "Revised my Language World writing",
        "Revisé mi escritura del Mundo del lenguaje",
      );
  }
  const days = Object.entries(warmup?.days || {});
  const byWeek = new Map();
  for (const [k, d] of days) {
    const iso = k.split("|")[1];
    const n = (d?.w ? 1 : 0) + (d?.l?.ok ? 1 : 0) + (d?.q?.text ? 1 : 0) + (d?.s?.done ? 1 : 0);
    if (n) byWeek.set(monday(iso), (byWeek.get(monday(iso)) || 0) + 1);
  }
  for (const [wk, n] of byWeek)
    add(`${wk}T12:00:00`, "warmup", `Warm-ups this week: ${n}`, `Calentamientos esta semana: ${n}`);
  const seen = new Set();
  for (const e of asArray(ledger?.entries)) {
    if (e.band && e.band !== band) continue;
    const k = `${e.src}:${e.stage}`;
    if (e.stage === "independent" && !seen.has(k)) {
      seen.add(k);
      add(e.t, "own", `First time on my own in ${e.src}`, `Primera vez por mi cuenta en ${e.src}`);
    }
    if (e.kind === "revision" && !seen.has("rev")) {
      seen.add("rev");
      add(e.t, "revision", "My first revision", "Mi primera revisión");
    }
  }
  for (const [id, t] of Object.entries(badges))
    add(t, "badge", `New in my collection book: ${id}`, `Nuevo en mi libro de colección: ${id}`);
  const weeks = new Map();
  for (const e of ev.sort((a, b) => b.t.localeCompare(a.t))) {
    const wk = monday(day(e.t));
    if (!weeks.has(wk)) weeks.set(wk, []);
    weeks.get(wk).push(e);
  }
  return [...weeks.entries()].map(([week, items]) => ({ week, items }));
}

/** Everything the portfolio page shows, in one object. */
export function collect(input) {
  const samples = writingSamples(input);
  const pins = asArray(input.prefs?.portfolio?.pins);
  return {
    samples,
    pins,
    showcase: showcase(samples, pins),
    recordings: recordingList(input),
    reflections: reflectionList(input.reading),
    garden: gardenWords(input),
    timeline: timeline(input),
  };
}

/** The tier a band's warm-up words come from (re-exported so the view needs one import). */
export const warmupTier = tierOf;
