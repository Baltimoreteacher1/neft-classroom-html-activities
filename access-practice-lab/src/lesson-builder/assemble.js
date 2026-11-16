// Lesson Builder assembly: settings + real activity rows (content.js bandRows) → an editable lesson. Pure, no DOM.
//
// Assembly rules (deterministic: the same settings and rows always give the same lesson):
//   1. Settings are normalized first (normalizeSettings). Unknown or missing values fall back to safe defaults, so a
//      hand-edited or truncated share link still builds a lesson.
//   2. The duration picks a phase plan (rules.js PLANS). Shorter lessons drop phases; they never squeeze them.
//   3. Phases are filled in plan order. A phase that takes an activity draws from rows of the chosen band only,
//      in the phase's domains intersected with the teacher's domains (falling back to the teacher's domains when the
//      intersection is empty), never Model-Test items, never an activity two support levels away from the profile,
//      and never an activity already used by an earlier phase.
//   4. Candidates are ranked by rules.js WEIGHTS (topic keywords, language function, support level, fits the phase
//      minutes). Ties keep content/index.json teaching order. A "short" phase (formative check) keeps only
//      activities that fit its minutes when any do.
//   5. "Feedback and second attempt" reopens the activity of the task phase (or guided practice in a lesson without
//      one). The family extension links to Practice Together, never a classroom activity.
//   6. Every phase carries teacher directions, student-facing text, sentence frames for the function and support
//      profile, and the function's word bank (4 words for profile A, 5 for B, 6 for C).
// A share link carries only these settings and the ordered phase keys with their activity ids (encodeShare). It
// never carries edited text, names, responses or progress.
import {
  BAND_VOICE,
  BUILDER_BANDS,
  BUILDER_DOMAINS,
  DURATIONS,
  FIT_SLACK,
  FUNCTION_KEYS,
  FUNCTIONS,
  HOOKS,
  PHASE_KEYS,
  PHASES,
  PLANS,
  SUPPORT_KEYS,
  SUPPORT_PROFILES,
  WEIGHTS,
} from "./rules.js";

export const DEFAULT_SETTINGS = Object.freeze({
  band: "6-8",
  domains: ["Reading", "Speaking"],
  fn: "explain",
  topic: "",
  support: "B",
  minutes: 30,
});
const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const LEVELS = "ABC";
const MAX_TOPIC = 60;

/** Validate every setting; anything unknown falls back to the default. */
export function normalizeSettings(raw = {}) {
  const r = raw && typeof raw === "object" ? raw : {};
  const domainsIn = Array.isArray(r.domains) ? r.domains : String(r.domains || "").split(",");
  const domains = BUILDER_DOMAINS.filter((d) => domainsIn.includes(d));
  const minutes = Number(r.minutes);
  return {
    band: BUILDER_BANDS.includes(r.band) ? r.band : DEFAULT_SETTINGS.band,
    domains: domains.length ? domains : [...DEFAULT_SETTINGS.domains],
    fn: FUNCTION_KEYS.includes(r.fn) ? r.fn : DEFAULT_SETTINGS.fn,
    topic: String(r.topic || "")
      .replace(/[^\p{L}\p{N} '-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_TOPIC),
    support: SUPPORT_KEYS.includes(r.support) ? r.support : DEFAULT_SETTINGS.support,
    minutes: DURATIONS.includes(minutes) ? minutes : DEFAULT_SETTINGS.minutes,
  };
}

const keywords = (topic) =>
  [
    ...new Set(
      String(topic)
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u),
    ),
  ]
    .filter((w) => w.length >= 3)
    .slice(0, 5);
const levelGap = (a, b) => Math.abs(LEVELS.indexOf(a) - LEVELS.indexOf(b));

/** Domains a phase may draw from for these settings (rule 3). */
export function phaseDomains(key, settings) {
  const own = PHASES[key]?.domains || BUILDER_DOMAINS;
  const both = own.filter((d) => settings.domains.includes(d));
  return both.length ? both : settings.domains;
}

/** Ranked candidate rows for one phase (rules 3-4). `exclude` is a Set of activity ids already in use. */
export function candidatesFor(rows, settings, key, minutes, exclude = new Set()) {
  const phase = PHASES[key];
  if (!phase || !["best", "short"].includes(phase.pick)) return [];
  const domains = phaseDomains(key, settings);
  const words = keywords(settings.topic);
  const fnRe = FUNCTIONS[settings.fn].match;
  const scored = [];
  rows.forEach((row, order) => {
    if (row.band !== settings.band || !domains.includes(row.domain) || exclude.has(row.id)) return;
    if (!LEVELS.includes(row.level) || levelGap(row.level, settings.support) > 1) return;
    const text = `${row.title} ${row.skill || ""}`.toLowerCase();
    const fits = Number(row.minutes || 0) > 0 && Number(row.minutes) <= minutes + FIT_SLACK;
    let score = words.filter((w) => text.includes(w)).length * WEIGHTS.keyword;
    if (fnRe.test(text)) score += WEIGHTS.fn;
    score += row.level === settings.support ? WEIGHTS.level : WEIGHTS.nearLevel;
    if (fits) score += WEIGHTS.fits;
    scored.push({ row, score, order, fits });
  });
  const pool =
    phase.pick === "short" && scored.some((s) => s.fits) ? scored.filter((s) => s.fits) : scored;
  return pool.sort((a, b) => b.score - a.score || a.order - b.order).map((s) => s.row);
}

const quote = (s) => `"${s}"`;

/** The lesson's student-friendly objectives. */
export function objectivesFor(settings, rows = [], phases = []) {
  const fn = FUNCTIONS[settings.fn];
  const firstId = phases.find((p) => p.activityId)?.activityId;
  const first = rows.find((r) => r.id === firstId);
  const topic =
    settings.topic ||
    (first?.skill ? first.skill.replace(/^[A-Z][a-z]+: /, "").toLowerCase() : "today's topic");
  const doing = settings.domains.map(
    (d) =>
      ({ Listening: "listening", Reading: "reading", Speaking: "speaking", Writing: "writing" })[d],
  );
  const list = doing.length > 1 ? `${doing.slice(0, -1).join(", ")} and ${doing.at(-1)}` : doing[0];
  const words = fn.words.slice(0, 2).map(quote).join(" and ");
  return {
    content: `I can ${fn.verb} ${topic}.`,
    language: `I can ${fn.verb} by ${list}, using words like ${words}.`,
    klu: fn.klu,
  };
}

/** Teacher directions and student-facing text for one phase (rule 6). `row` may be null. */
export function phaseText(key, settings, row) {
  const fn = FUNCTIONS[settings.fn];
  const profile = SUPPORT_PROFILES[settings.support];
  const voice = BAND_VOICE[settings.band] || BAND_VOICE["6-8"];
  const frames = fn.frames[settings.support];
  const words = fn.words.slice(0, 3 + LEVELS.indexOf(settings.support) + 1);
  const title = row ? quote(row.title) : "";
  const missing =
    "No matching activity was found for these choices. Use Swap to pick one, or use your own materials.";
  const t = {
    opening: [
      `Post the objectives and read them aloud. Ask: "${HOOKS[settings.fn]}" ${voice.think}, then partners answer with "${frames[0]}"`,
      `${HOOKS[settings.fn]} ${voice.talk}. Start with: "${frames[0]}"`,
    ],
    vocabulary: [
      `Preview the words: ${words.join(", ")}. Say each one, use it in a sentence, and have students repeat it.${settings.support === "A" ? " Add a gesture or quick sketch for each word." : ""}`,
      `Say each word with your partner: ${words.join(", ")}.`,
    ],
    input: row
      ? [
          `Open ${title} on the board for the whole class. Model it once, pausing to point out language that helps students ${fn.verb}.`,
          `${row.domain === "Listening" ? "Listen" : "Read"} carefully. Notice words like ${words.slice(0, 2).map(quote).join(" and ")}.`,
        ]
      : [missing, `${voice.think} and notice the key words.`],
    guided: row
      ? [
          `Do the first item of ${title} together and think aloud with the frame. Students finish it in learning mode with supports on. ${profile.teacher}`,
          `Work through ${title}. ${profile.student}`,
        ]
      : [missing, profile.student],
    task: row
      ? [
          `Partners or individuals complete ${title}. Circulate and listen for "${frames[0]}" and "${frames[1]}". ${profile.teacher}`,
          `With a partner or on your own, complete ${title}. Use: "${frames[1]}"`,
        ]
      : [missing, `Use: "${frames[1]}"`],
    check: row
      ? [
          `Students try ${title} in independent mode: supports appear only after a first try. Note who uses the frames on their own. This is a quick check, not a grade.`,
          `Try ${title} on your own first. Then check your answer.`,
        ]
      : [missing, "Try it on your own first."],
    feedback: row
      ? [
          `Give each student one strength and one next step using the frame. Students reopen ${title} for a second attempt and improve one answer.`,
          `Read your feedback. Open ${title} again and make one answer stronger.`,
        ]
      : [missing, "Read your feedback and make one answer stronger."],
    exit: [
      `${voice.write}: students answer "${HOOKS[settings.fn]}" on paper or a sticky note. Sort answers into got it / almost / not yet to plan the next lesson.`,
      `${voice.write} to answer: ${HOOKS[settings.fn]} Use: "${frames[frames.length - 1]}"`,
    ],
    family: [
      "Share the Practice Together link so families can try a short activity together at home, in English or Spanish.",
      "At home, show a family member what you learned today. Open Practice Together and try one activity together.",
    ],
  }[key] || ["", ""];
  return { teacher: t[0], student: t[1], frames: [...frames], words };
}

function makePhase(key, minutes, settings, row) {
  const phase = PHASES[key];
  return {
    key,
    minutes,
    activityId: row?.id || null,
    mode: phase.mode || null,
    edited: false,
    ...phaseText(key, settings, row),
  };
}

/** Build the lesson for these settings from real rows (rules 1-6). */
export function assembleLesson(rawSettings, rows = []) {
  const settings = normalizeSettings(rawSettings);
  const used = new Set();
  const byKey = {};
  const phases = PLANS[settings.minutes].map(([key, minutes]) => {
    const phase = PHASES[key];
    let row = null;
    if (phase.pick === "best" || phase.pick === "short") {
      row = candidatesFor(rows, settings, key, minutes, used)[0] || null;
      if (row) used.add(row.id);
    } else if (phase.pick === "repeat") {
      const source = phase.repeatOf.map((k) => byKey[k]).find((p) => p?.activityId);
      row = source ? rows.find((r) => r.id === source.activityId) || null : null;
    }
    const built = makePhase(key, minutes, settings, row);
    byKey[key] = built;
    return built;
  });
  return { settings, objectives: objectivesFor(settings, rows, phases), phases, removed: [] };
}

/** Put a different activity into one phase; regenerated text replaces only text the teacher has not edited. */
export function swapActivity(lesson, index, activityId, rows) {
  const phase = lesson.phases[index];
  const row = rows.find((r) => r.id === activityId && r.band === lesson.settings.band);
  if (!phase || !row) return false;
  const text = phaseText(phase.key, lesson.settings, row);
  phase.activityId = row.id;
  if (!phase.edited) Object.assign(phase, { teacher: text.teacher, student: text.student });
  return true;
}

/** Share-link query: settings and ordered "phase.activityId" entries only. */
export function encodeShare(lesson) {
  const s = normalizeSettings(lesson?.settings);
  const q = new URLSearchParams({
    grades: s.band,
    dom: s.domains.join(","),
    fn: s.fn,
    sup: s.support,
    min: String(s.minutes),
  });
  if (s.topic) q.set("topic", s.topic);
  q.set(
    "seq",
    (lesson?.phases || [])
      .map((p) => (p.activityId ? `${p.key}.${p.activityId}` : p.key))
      .join("~"),
  );
  return q.toString();
}

/** Parse a share query. Invalid values fall back to defaults; invalid sequence entries are dropped. */
export function decodeShare(search = "") {
  const q = new URLSearchParams(search);
  const settings = normalizeSettings({
    band: q.get("grades"),
    domains: q.get("dom") || "",
    fn: q.get("fn"),
    support: q.get("sup"),
    minutes: q.get("min"),
    topic: q.get("topic") || "",
  });
  const has = ["fn", "dom", "sup", "min", "seq"].some((k) => q.has(k));
  if (!q.has("seq")) return { settings, seq: null, has };
  const seen = new Set();
  const seq = [];
  for (const part of String(q.get("seq")).split("~").slice(0, PHASE_KEYS.length)) {
    const [key, id = ""] = part.split(".");
    if (!PHASE_KEYS.includes(key) || seen.has(key) || (id && !ID_RE.test(id))) continue;
    seen.add(key);
    seq.push({ key, activityId: id || null });
  }
  return { settings, seq, has };
}

/** Rebuild a shared lesson: assemble from settings, then apply the shared order, removals and activity choices. */
export function lessonFromShare(search, rows) {
  const { settings, seq } = decodeShare(search);
  const lesson = assembleLesson(settings, rows);
  if (!seq || !seq.length) return lesson;
  const base = new Map(lesson.phases.map((p) => [p.key, p]));
  const phases = [];
  for (const { key, activityId } of seq) {
    const phase = base.get(key);
    if (!phase) continue;
    phases.push(phase);
    if (activityId && activityId !== phase.activityId && PHASES[key].pick !== "family") {
      const idx = phases.length - 1;
      swapActivity({ settings: lesson.settings, phases }, idx, activityId, rows);
    }
  }
  if (!phases.length) return lesson;
  lesson.removed = lesson.phases.filter((p) => !phases.includes(p)).map((p) => p.key);
  lesson.phases = phases;
  return lesson;
}

/** Saved configurations: { name: { lesson, savedAt } }. Invalid entries are dropped on read. */
export function parseSaved(text) {
  let data = {};
  try {
    data = JSON.parse(text || "{}");
  } catch {
    return {};
  }
  const out = {};
  for (const [name, entry] of Object.entries(data && typeof data === "object" ? data : {})) {
    if (!entry?.lesson?.settings || !Array.isArray(entry.lesson.phases)) continue;
    const settings = normalizeSettings(entry.lesson.settings);
    const phases = entry.lesson.phases
      .filter((p) => PHASE_KEYS.includes(p?.key) && (!p.activityId || ID_RE.test(p.activityId)))
      .map((p) => ({
        key: p.key,
        minutes: Math.max(0, Math.min(90, Number(p.minutes) || 0)),
        activityId: p.activityId || null,
        mode: PHASES[p.key].mode || null,
        edited: Boolean(p.edited),
        teacher: String(p.teacher || "").slice(0, 2000),
        student: String(p.student || "").slice(0, 2000),
        frames: Array.isArray(p.frames) ? p.frames.map(String).slice(0, 4) : [],
        words: Array.isArray(p.words) ? p.words.map(String).slice(0, 8) : [],
      }));
    const removed = (entry.lesson.removed || []).filter((k) => PHASE_KEYS.includes(k));
    out[String(name).slice(0, 60)] = {
      savedAt: String(entry.savedAt || ""),
      lesson: {
        settings,
        objectives: {
          ...objectivesFor(settings),
          ...Object.fromEntries(
            ["content", "language"]
              .filter((k) => typeof entry.lesson.objectives?.[k] === "string")
              .map((k) => [k, entry.lesson.objectives[k].slice(0, 400)]),
          ),
        },
        phases,
        removed,
      },
    };
  }
  return out;
}

export const totalMinutes = (lesson) =>
  (lesson?.phases || []).reduce((sum, p) => sum + (Number(p.minutes) || 0), 0);

/** Put a removed phase back at its place in the plan order, with a fresh activity choice (rules 3-5). */
export function restorePhase(lesson, key, rows) {
  if (!lesson.removed.includes(key)) return false;
  const plan = PLANS[lesson.settings.minutes];
  const minutes = plan.find(([k]) => k === key)?.[1] ?? 0;
  const phase = PHASES[key];
  const used = new Set(lesson.phases.map((p) => p.activityId).filter(Boolean));
  let row = null;
  if (phase.pick === "best" || phase.pick === "short") row = candidatesFor(rows, lesson.settings, key, minutes, used)[0] || null;
  else if (phase.pick === "repeat") {
    const source = phase.repeatOf.map((k) => lesson.phases.find((p) => p.key === k)).find((p) => p?.activityId);
    row = source ? rows.find((r) => r.id === source.activityId) || null : null;
  }
  const planOrder = plan.map(([k]) => k);
  const at = lesson.phases.findIndex((p) => planOrder.indexOf(p.key) > planOrder.indexOf(key));
  lesson.phases.splice(at < 0 ? lesson.phases.length : at, 0, makePhase(key, minutes, lesson.settings, row));
  lesson.removed = lesson.removed.filter((k) => k !== key);
  return true;
}
