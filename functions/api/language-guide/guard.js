/* =============================================================================
 * Mr. Neft's AI guide: cost caps and the anonymous question log. Not a route (no onRequest export); imported by
 * functions/api/language-guide.js (POST) and functions/api/language-guide/questions.js (GET, teacher key).
 * -----------------------------------------------------------------------------
 * CAPS. The shared handler's per-isolate limiter only bounds one client on one isolate. These two caps bound the
 * model bill across isolates with the Workers Cache API (caches.default), so no Cloudflare resource is added. Counters
 * live under a synthetic https://lp-guide.internal/ URL that is never fetched. The Cache API is per data center and
 * not atomic, so the caps are a budget guard, not an exact quota; with no Cache API (local dev, tests without a fake)
 * nothing is capped beyond the per-isolate limiter.
 *
 * LOG (Joel, 2026-11-11, data/product-decisions.json "language-guide-question-log"). Each typed question is kept in
 * the existing PLAN_DOCS KV namespace for 90 days as { question, page, step, grades, lang, answered, at }, with
 * anything that looks like a name, an email address or a phone number replaced first. No IP, no history, no answer
 * text. Without the binding nothing is stored.
 * ============================================================================= */

import {
  GUIDE_RULES,
  guideContext,
  QUICK,
} from "../../../access-practice-lab/src/intro/guide-knowledge.js";
import { FAQ } from "../../../access-practice-lab/src/intro/site-guide-more.js";
import { clientIp, json } from "../../_lib/http.js";

/** At most this many typed questions per person (IP address) per clock hour. A class of teachers on one school
 * network shares an address, so it is set well above what one person asks in a tour. */
export const PER_IP_HOURLY_CAP = 40;
/** At most this many typed questions per UTC day across the whole site, so a loop or a scraper cannot run up the
 * model bill. Each question sends the grounded guide text (about 9,000 characters) to the model. */
export const GLOBAL_DAILY_CAP = 1500;
/** How long a logged question is kept. */
export const LOG_TTL_SECONDS = 90 * 24 * 60 * 60;
export const LOG_PREFIX = "lp-guide-q:";

const COUNTER_ORIGIN = "https://lp-guide.internal";

/** The calm answer the client turns into the Site Guide fallback. */
export const limitedResponse = () =>
  json({ ok: false, limited: true }, 429, { "Retry-After": "3600" });

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function readCount(cache, url) {
  const hit = await cache.match(new Request(url));
  if (!hit) return 0;
  const n = Number(await hit.text());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function writeCount(cache, url, n, ttlSeconds) {
  return cache.put(
    new Request(url),
    new Response(String(n), {
      headers: { "Cache-Control": `max-age=${Math.max(1, Math.ceil(ttlSeconds))}` },
    }),
  );
}

/**
 * True when this request is over a cap (and then nothing is counted); otherwise both counters go up by one and it
 * answers false. The IP is hashed before it becomes part of a cache key.
 */
export async function overCap(
  request,
  { cache = globalThis.caches?.default, now = new Date() } = {},
) {
  if (!cache) return false;
  try {
    const iso = now.toISOString();
    const hour = iso.slice(0, 13); // YYYY-MM-DDTHH
    const day = iso.slice(0, 10);
    const ip = await sha256Hex(`lp-guide:${clientIp(request)}`);
    const ipUrl = `${COUNTER_ORIGIN}/ip/${ip.slice(0, 32)}/${hour}`;
    const dayUrl = `${COUNTER_ORIGIN}/day/${day}`;
    const [ipCount, dayCount] = await Promise.all([
      readCount(cache, ipUrl),
      readCount(cache, dayUrl),
    ]);
    if (ipCount >= PER_IP_HOURLY_CAP || dayCount >= GLOBAL_DAILY_CAP) return true;
    const ms = now.getTime();
    const toHourEnd = (3_600_000 - (ms % 3_600_000)) / 1000;
    const toDayEnd = (86_400_000 - (ms % 86_400_000)) / 1000;
    await Promise.all([
      writeCount(cache, ipUrl, ipCount + 1, toHourEnd),
      writeCount(cache, dayUrl, dayCount + 1, toDayEnd),
    ]);
    return false;
  } catch {
    // A cache failure must not take the guide down; the per-isolate limiter still applies.
    return false;
  }
}

// ── Personal details out of a question ────────────────────────────────────────────────────────────────────────

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/gu;
// Seven or more digits, with the separators phone numbers are written with.
const PHONE = /\+?\(?\d(?:[\s().-]*\d){6,}/g;
// "named Ana", "my son's name is Ana Lopez", "se llama Ana", "me llamo Ana".
const NAME_CUE =
  /\b(named|called|name is|names are|name's|llamo|llama|llaman|llamada|llamado|nombre es)(\s+)[\p{L}'’-]+(?:\s+\p{Lu}[\p{L}'’-]*)?/giu;
const WORD = /[\p{L}][\p{L}'’-]*/gu;
const CALENDAR =
  "Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December Lunes Martes Miércoles Jueves Viernes Sábado Domingo Enero Febrero Marzo Abril Mayo Junio Julio Agosto Septiembre Octubre Noviembre Diciembre";
const PLACES_AND_TOOLS =
  "English Spanish Español Inglés Mr Mrs Ms Dr OK Google Chrome Chromebook Chromebooks Safari Edge Firefox iPad iPads iPhone Android Windows Mac Canvas Schoology Classroom Zoom Teams YouTube Kindergarten Kinder Kínder Grade Grades Pre-K";

let known = null;
/** Every capitalized word the site's own guide text uses: those are site words, not people. */
function knownWords() {
  if (known) return known;
  const text = [
    GUIDE_RULES,
    ...["K", "1", "2-3", "4-5", "6-8"].map((pick) => guideContext({ pick })),
    ...FAQ.flatMap((f) => [f.q.en, f.q.es, f.a.en, f.a.es]),
    ...Object.values(QUICK).flatMap((q) => q.q),
    CALENDAR,
    PLACES_AND_TOOLS,
  ].join(" ");
  known = new Set(text.match(WORD) || []);
  return known;
}

/**
 * The question with anything that looks like a person's name, an email address or a phone number replaced by
 * [name], [email] or [phone]. Deliberately over-eager: a capitalized word that is not the first word of a sentence,
 * not an acronym and not a word the site's own guide uses is treated as a name.
 */
export function stripPersonal(question) {
  const words = knownWords();
  let q = String(question || "")
    .replace(EMAIL, "[email]")
    .replace(PHONE, "[phone]")
    .replace(NAME_CUE, (_m, cue, gap) => `${cue}${gap}[name]`);
  q = q.replace(WORD, (word, offset, all) => {
    if (!/^\p{Lu}/u.test(word)) return word;
    if (word.length > 1 && word === word.toUpperCase()) return word; // WIDA, ACCESS, ESOL
    if (word === "I") return word;
    const before = all.slice(0, offset).trimEnd();
    if (!before || /[.?!¿¡:"“(]$/.test(before)) return word; // a sentence starts here
    if (before.endsWith("[") || /\[(name|email|phone)$/.test(before)) return word;
    return words.has(word) ? word : "[name]";
  });
  return q.replace(/\[name\](?:\s+\[name\])+/g, "[name]");
}

// ── The log ───────────────────────────────────────────────────────────────────────────────────────────────────

const randomId = () => {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
};

/** The record that is stored, built here so nothing else can slip in. */
export function questionRecord({ question, page, step, grades, lang, answered }, now = new Date()) {
  return {
    question: stripPersonal(question).slice(0, 400),
    page: String(page || ""),
    step: stripPersonal(step || "").slice(0, 60),
    grades: String(grades || ""),
    lang: lang === "es" ? "es" : "en",
    answered: Boolean(answered),
    at: now.toISOString(),
  };
}

/** Store one question (a promise; never throws). No binding, no log. */
export async function logQuestion(env, fields, now = new Date()) {
  const kv = env?.PLAN_DOCS;
  if (!kv?.put) return false;
  try {
    const rec = questionRecord(fields, now);
    const key = `${LOG_PREFIX}${rec.at.slice(0, 10)}:${randomId()}`;
    // The record also rides as list metadata (KV allows 1024 bytes), so the summary needs no per-key read.
    const meta = JSON.stringify(rec).length <= 1000 ? rec : null;
    await kv.put(key, JSON.stringify(rec), {
      expirationTtl: LOG_TTL_SECONDS,
      ...(meta ? { metadata: meta } : {}),
    });
    return true;
  } catch {
    return false;
  }
}

const normalize = (q) =>
  q
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}[\]\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const tally = (map, key) => map.set(key, (map.get(key) || 0) + 1);
const sorted = (map) => Object.fromEntries([...map].sort((a, b) => b[1] - a[1]));

/** Every record logged on the `days` UTC days ending today. */
async function readRecords(kv, days, now) {
  const out = [];
  for (let d = 0; d < days; d++) {
    const day = new Date(now.getTime() - d * 86_400_000).toISOString().slice(0, 10);
    let cursor;
    for (let page = 0; page < 20; page++) {
      const res = await kv.list({ prefix: `${LOG_PREFIX}${day}:`, cursor, limit: 1000 });
      for (const k of res.keys || []) {
        let rec = k.metadata;
        if (!rec) {
          try {
            rec = JSON.parse((await kv.get(k.name)) || "null");
          } catch {
            rec = null;
          }
        }
        if (rec && typeof rec.question === "string") out.push(rec);
      }
      if (res.list_complete || !res.cursor) break;
      cursor = res.cursor;
    }
  }
  return out;
}

/** Counts and the most frequent questions for the last `days` days. */
export async function summarizeQuestions(kv, days, now = new Date()) {
  const recs = await readRecords(kv, days, now);
  const byPage = new Map();
  const byLang = new Map();
  const byGrades = new Map();
  const byDay = new Map();
  const groups = new Map();
  let answered = 0;
  for (const r of recs) {
    if (r.answered) answered++;
    tally(byPage, r.page || "unknown");
    tally(byLang, r.lang || "en");
    tally(byGrades, r.grades || "none");
    tally(byDay, String(r.at || "").slice(0, 10));
    const key = normalize(r.question);
    if (!key) continue;
    const g = groups.get(key) || { question: r.question, count: 0, unanswered: 0, last: "" };
    g.count++;
    if (!r.answered) g.unanswered++;
    if (String(r.at) > g.last) {
      g.last = String(r.at);
      g.question = r.question;
    }
    groups.set(key, g);
  }
  const top = [...groups.values()]
    .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
    .slice(0, 25)
    .map(({ question, count, unanswered }) => ({ question, count, unanswered }));
  return {
    ok: true,
    days,
    total: recs.length,
    answered,
    unanswered: recs.length - answered,
    byPage: sorted(byPage),
    byLang: sorted(byLang),
    byGrades: sorted(byGrades),
    byDay: Object.fromEntries([...byDay].sort()),
    top,
  };
}

/** Constant-time comparison for the teacher key. */
export function sameKey(given, expected) {
  if (typeof given !== "string" || typeof expected !== "string" || !expected) return false;
  let diff = given.length ^ expected.length;
  for (let i = 0; i < expected.length; i++)
    diff |= (given.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
  return diff === 0;
}
