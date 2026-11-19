// Family Language Story: the story record, its one sanitizer and the composed text a family reads. Pure (no DOM).
//
// A story is what a teacher APPROVED to share, and it is the only thing a share link carries:
//   n  child's first name, typed by the teacher (never copied from a roster; "" = "Your child")
//   l  the language the page opens in: "en" | "es" | "bi"
//   d  skills practiced recently, a subset of "L" "R" "S" "W"
//   w  days practiced this week, 0 to 7
//   c  the celebration sentence id (wording.js CELEBRATE)
//   s  up to three conversation-starter ids (wording.js STARTERS); the first is "tonight's talk"
//   q  ONE verbatim quote from the child's own words (optional), with m = "w" wrote | "s" said
//   t  a short personal note from the teacher (optional), with x = the language it is written in
//   k  the Monday of the week, YYMMDD
// Everything else a family reads is authored text chosen by those ids (wording.js), so the same link reads in English
// and Spanish. No score, level, percent, timer or proficiency label exists anywhere in the model.
import {
  CELEBRATE,
  CELEBRATE_IDS,
  DOMAIN_ORDER,
  DOMAIN_WORD,
  EITHER,
  FINE,
  NOTE_FROM,
  QUOTE_LEAD,
  REPLY,
  STARTERS,
  STARTER_IDS,
  SUBJECT,
  WEEK,
  fill,
} from "./wording.js";

export const LIMITS = Object.freeze({ name: 20, quote: 160, note: 200, starters: 3 });
const LANGS = ["en", "es", "bi"];

// Free text that could identify someone or smuggle a destination: addresses, links, phone numbers, long digit runs.
const CONTACT = /@|https?:|www\.|\.(com|net|org|edu|gov|io)\b|\d{4,}|\d[\d\s().-]{7,}\d/i;
const clean = (s) =>
  String(s ?? "")
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** A first name: letters, marks, spaces, apostrophes, periods and hyphens, up to 20 characters. */
export function cleanName(v) {
  const s = String(v ?? "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIMITS.name);
  return /^\p{L}[\p{L}\p{M} '’.-]*$/u.test(s) ? s : "";
}

/** Free text (a quote or a note): trimmed, capped, and refused whole (never cut) when it carries contact details. */
export function cleanText(v, max) {
  const s = clean(v);
  return s && s.length <= max && !CONTACT.test(s) ? s : "";
}

/** Three starters for the skills a child practiced: matching kind first, then the rest of those skills. */
export function pickStarters({ domains = [], uses = {} } = {}) {
  const ds = domains.filter((d) => DOMAIN_ORDER.includes(d));
  const order = ds.length ? ds : ["S", "L", "R"];
  const pools = order.map((d) => {
    const pool = STARTER_IDS.filter((id) => STARTERS[id].domain === d);
    const want = pool.find((id) => STARTERS[id].use === uses[d]);
    return want ? [want, ...pool.filter((id) => id !== want)] : pool;
  });
  const out = [];
  for (let round = 0; out.length < LIMITS.starters && round < 4; round++)
    for (const pool of pools) {
      const id = pool[round];
      if (id && !out.includes(id) && out.length < LIMITS.starters) out.push(id);
    }
  return out;
}

/** Monday (UTC) of the week holding `now`, as YYMMDD. */
export function weekStamp(now = Date.now()) {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(2, 10).replaceAll("-", "");
}
/** YYMMDD -> "YYYY-MM-DD" (or ""). */
export const weekDate = (k) =>
  /^\d{6}$/.test(k) ? `20${k.slice(0, 2)}-${k.slice(2, 4)}-${k.slice(4)}` : "";

/** The one sanitizer: anything (a decoded link, the teacher's editor) becomes a valid story. Never throws. */
export function normalizeStory(raw = {}) {
  const r = raw && typeof raw === "object" ? raw : {};
  const domains = DOMAIN_ORDER.filter((d) =>
    (Array.isArray(r.d) ? r.d : String(r.d || "").split("")).includes(d),
  );
  const ids = (Array.isArray(r.s) ? r.s : String(r.s || "").split("."))
    .filter((id, i, a) => STARTER_IDS.includes(id) && a.indexOf(id) === i)
    .slice(0, LIMITS.starters);
  const starters = ids.length ? ids : pickStarters({ domains });
  const quote = cleanText(r.q, LIMITS.quote);
  const note = cleanText(r.t, LIMITS.note);
  const days = Math.trunc(Number(r.w));
  return {
    n: cleanName(r.n),
    l: LANGS.includes(r.l) ? r.l : "bi",
    d: domains,
    w: Number.isFinite(days) ? Math.min(7, Math.max(0, days)) : 0,
    c: CELEBRATE_IDS.includes(r.c) ? r.c : "ef",
    s: starters,
    q: quote,
    m: r.m === "s" ? "s" : "w",
    t: note,
    x: r.x === "es" ? "es" : "en",
    k: /^\d{6}$/.test(String(r.k || "")) ? String(r.k) : "",
  };
}

/**
 * What a family reads, as { en, es } pairs (the renderer shows one or both). Authored text is chosen by id; the name,
 * quote and note are the only free words, and they are passed through unchanged.
 */
export function compose(input) {
  const story = normalizeStory(input);
  const name = story.n;
  const subject = name ? { en: name, es: name } : SUBJECT;
  const vars = (lang) => ({ s: subject[lang] });
  const pair = (o) => ({ en: fill(o.en, vars("en")), es: fill(o.es, vars("es")) });
  const days = story.w;
  const dayLine = days === 0 ? WEEK.days.none : days === 1 ? WEEK.days.one : WEEK.days.many;
  return {
    story,
    title: name
      ? { en: `${name}’s Language Story`, es: `La historia de lenguaje de ${name}` }
      : { en: "Your child’s Language Story", es: "La historia de lenguaje de su hijo o hija" },
    week: {
      line: {
        en: fill(dayLine.en, { ...vars("en"), n: days }),
        es: fill(dayLine.es, { ...vars("es"), n: days }),
      },
      lead: WEEK.skills,
      skills: story.d.map((id) => ({ id, ...DOMAIN_WORD[id] })),
      none: WEEK.skillsNone,
    },
    celebrate: {
      id: story.c,
      text: pair(CELEBRATE[story.c]),
      quote: story.q ? { text: story.q, lead: pair(QUOTE_LEAD[story.m]), mode: story.m } : null,
    },
    starters: story.s.map((id) => ({
      id,
      domain: STARTERS[id].domain,
      ask: STARTERS[id].ask,
      frame: STARTERS[id].frame,
    })),
    either: EITHER,
    note: story.t ? { lead: NOTE_FROM, text: story.t, lang: story.x } : null,
    fine: FINE,
  };
}

/** Every authored sentence a story shows, per language (no name, quote or note): what the language tests read. */
export function authoredText(input) {
  const c = compose(input);
  const out = { en: [], es: [] };
  for (const lang of ["en", "es"]) {
    out[lang].push(
      c.title[lang],
      c.week.line[lang],
      c.week.lead[lang],
      ...c.week.skills.map((s) => s[lang]),
      c.celebrate.text[lang],
      ...(c.celebrate.quote ? [c.celebrate.quote.lead[lang]] : []),
      ...c.starters.flatMap((s) => [s.ask[lang], s.frame[lang]]),
      c.either[lang],
      c.fine[lang],
    );
    if (c.note) out[lang].push(c.note.lead[lang]);
  }
  return out;
}

const spoken = (t, lang) => String(t).replace(/_{3,}/g, lang === "es" ? "espacio en blanco" : "blank");

/**
 * Segments to read aloud, `{ lang, text }`, one language after another. The verbatim quote is always read in English:
 * it is the child's own words.
 */
export function readAloud(input, langs = ["en"]) {
  const c = compose(input);
  const out = [];
  for (const lang of langs) {
    const add = (text, as = lang) => text && out.push({ lang: as, text });
    add(c.title[lang]);
    add(c.week.line[lang]);
    add(c.celebrate.text[lang]);
    if (c.celebrate.quote) {
      add(c.celebrate.quote.lead[lang]);
      add(c.celebrate.quote.text, "en");
    }
    add(c.either[lang]);
    for (const s of c.starters) {
      add(spoken(s.ask[lang], lang));
      add(spoken(s.frame[lang], lang));
    }
  }
  return out;
}

/** What one talk sounds like when read aloud in one language. */
export const starterSpeech = (s, lang) => `${spoken(s.ask[lang], lang)} ${spoken(s.frame[lang], lang)}`;

/** The note a family can send back: English first (the teacher reads it), then Spanish. Nothing else is added. */
export function replyMessage(input, { how = "tried", both: bothLangs = false } = {}) {
  const { story } = compose(input);
  const key = ["easy", "hard", "help"].includes(how) ? how : "tried";
  const part = (lang) =>
    [
      REPLY.tried[lang],
      key === "tried" ? "" : REPLY[key][lang],
      bothLangs ? REPLY.both[lang] : "",
      REPLY.thanks[lang],
    ]
      .filter(Boolean)
      .join(" ");
  const from = story.n ? ` (${story.n})` : "";
  return `${part("en")}\n${part("es")}${from}`;
}
