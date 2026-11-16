// Teacher Tour 2.0 model: the steps, the saved state, the resource registry and the Resource Finder's ranking.
// Pure data and pure functions (no DOM), so tools/access-tour2.test.mjs runs them in Node against the real
// content/index.json. Nothing here names an activity: the registry is built from the index, so a new activity is
// discoverable by the finder as soon as it ships in content/index.json.
import { MAX_BYTES } from "../../../../shared/qr/qr-code.mjs";
import { SITE } from "../data.js";

export const BANDS = [
  { id: "3-5", short: "3–5", name: "Grades 3–5" },
  { id: "6-8", short: "6–8", name: "Grades 6–8" },
];
// `produce` skills ask students to make language (the activity's constructed item); the others ask them to
// understand it and choose an answer (the activity's multiple-choice item), so they have no model answer to hear.
export const DOMAINS = [
  { id: "listening", name: "Listening", verb: "listen", produce: false, item: "multipleChoice" },
  { id: "speaking", name: "Speaking", verb: "say", produce: true, item: "constructed" },
  { id: "reading", name: "Reading", verb: "read", produce: false, item: "multipleChoice" },
  { id: "writing", name: "Writing", verb: "write", produce: true, item: "constructed" },
];
export const domainOf = (id) => DOMAINS.find((d) => d.id === id) || null;
export const LEVELS = { A: "Starting support", B: "Building support", C: "Stretching support" };

/** The seven internal states of the one workspace. Only the first five are "the tour"; Build and Kit follow. */
export const STEPS = [
  {
    id: "welcome",
    n: 1,
    name: "Welcome",
    title: "Welcome! Here’s How The Language Page Works",
    cta: "Continue",
  },
  {
    id: "experience",
    n: 2,
    name: "Experience",
    title: "Try an Activity Just Like a Student",
    cta: "Continue",
  },
  {
    id: "support",
    n: 3,
    name: "Support",
    title: "One Activity. Different Language Supports.",
    cta: "Continue",
  },
  {
    id: "implement",
    n: 4,
    name: "Implement",
    title: "Find an Activity You Can Use Tomorrow",
    cta: "Continue",
  },
  {
    id: "prepare",
    n: 5,
    name: "Prepare",
    title: "See How It Fits Into Your Lesson",
    cta: "Build My First Lesson",
  },
  {
    id: "studio",
    n: 6,
    name: "Build",
    title: "Classroom Launch Studio",
    cta: "Create My Lesson Kit",
  },
  { id: "kit", n: 7, name: "Kit", title: "My First Lesson with The Language Page", cta: "" },
];
export const STEP_IDS = STEPS.map((s) => s.id);
export const TOUR_STEPS = 5;

export const PURPOSES = [
  { id: "warmup", name: "Warm-up", detail: "A short start to the lesson." },
  { id: "guided", name: "Guided practice", detail: "Students try it with you nearby." },
  { id: "independent", name: "Independent practice", detail: "Students work on their own." },
  { id: "check", name: "Quick formative check", detail: "See what students can do now." },
];
export const PROFILES = [
  { id: "starting", name: "Starting", level: "A" },
  { id: "growing", name: "Growing", level: "B" },
  { id: "expanding", name: "Expanding", level: "C" },
];
export const APPROACHES = [...PROFILES, { id: "mixed", name: "Mixed Supports" }];
export const MINUTES = [5, 10, 15, 20];

export const STORE_KEY = "tour2";

export const freshState = () => ({
  v: 1,
  step: "welcome",
  furthest: 0,
  focus: "", // a skill id from DOMAINS, or "all"
  band: "6-8",
  tab: "speaking", // Step 2 and Step 3 task
  profile: "starting",
  finder: { domain: "", purpose: "warmup" },
  pick: null, // { band, domain, level, id }
  lesson: { minutes: 10, approach: "mixed", edits: {} },
  studioScreen: 1,
  kit: null,
  startedAt: 0,
  updatedAt: 0,
});

const isBand = (b) => BANDS.some((x) => x.id === b);
const isDomain = (d) => DOMAINS.some((x) => x.id === d);

/** Reads whatever was saved and returns a complete, valid state (unknown or damaged fields fall back to defaults). */
export function normalizeState(raw) {
  const base = freshState();
  if (!raw || typeof raw !== "object" || raw.v !== 1) return base;
  const s = { ...base, ...raw };
  if (!STEP_IDS.includes(s.step)) s.step = "welcome";
  s.furthest = Math.max(0, Math.min(STEP_IDS.length - 1, Number(s.furthest) || 0));
  if (s.focus === "both") s.focus = "all"; // saved before Listening and Reading joined the tour
  if (s.focus !== "all" && s.focus !== "" && !isDomain(s.focus)) s.focus = "";
  if (!isBand(s.band)) s.band = base.band;
  if (!isDomain(s.tab)) s.tab = "speaking";
  if (!PROFILES.some((p) => p.id === s.profile)) s.profile = "starting";
  s.finder = { ...base.finder, ...(raw.finder || {}) };
  if (!PURPOSES.some((p) => p.id === s.finder.purpose)) s.finder.purpose = "warmup";
  if (s.finder.domain && !isDomain(s.finder.domain)) s.finder.domain = "";
  const p = raw.pick;
  s.pick =
    p && isBand(p.band) && isDomain(p.domain) && LEVELS[p.level] && typeof p.id === "string"
      ? { band: p.band, domain: p.domain, level: p.level, id: p.id }
      : null;
  s.lesson = { ...base.lesson, ...(raw.lesson || {}) };
  s.lesson.edits = s.lesson.edits && typeof s.lesson.edits === "object" ? s.lesson.edits : {};
  if (!MINUTES.includes(Number(s.lesson.minutes))) s.lesson.minutes = 10;
  s.lesson.minutes = Number(s.lesson.minutes);
  if (!APPROACHES.some((a) => a.id === s.lesson.approach)) s.lesson.approach = "mixed";
  s.studioScreen = [1, 2, 3].includes(s.studioScreen) ? s.studioScreen : 1;
  if (s.step === "kit" && !s.pick) s.step = "implement";
  if (s.step === "studio" && !s.pick) s.step = "implement";
  return s;
}

/** A step is finished once the teacher has moved past it. */
export const isUnfinished = (s) => s.furthest > 0 && s.step !== "kit";

/** The domain the teacher said they care about; "all" starts with speaking, as "both" always did. */
export const focusDomain = (s) => (isDomain(s.focus) ? s.focus : "speaking");

/* ── resource registry ── */

const cap = (d) => d[0].toUpperCase() + d.slice(1);

/**
 * Every Listening, Speaking, Reading and Writing activity of the tour's item type for Grades 3–5 and 6–8 in
 * content/index.json, as plain rows. Speaking and Writing use `constructed` (the student produces language);
 * Listening and Reading use `multipleChoice` (one answer with a check and guidance).
 */
export function buildRegistry(index) {
  const rows = [];
  for (const band of BANDS) {
    for (const d of DOMAINS) {
      const levels = index?.bands?.[band.id]?.domains?.[cap(d.id)]?.levels || {};
      for (const [level, lv] of Object.entries(levels)) {
        if (!LEVELS[level] || !lv?.tier) continue;
        for (const [id, title, type, focus, minutes] of lv.activities || []) {
          if (type !== d.item) continue;
          const row = {
            key: `${band.id}/${d.id}/${level}/${id}`,
            id,
            title,
            focus: focus || "",
            minutes: Number(minutes) || 5,
            band: band.id,
            domain: d.id,
            level,
            support: lv.tier.name,
          };
          // A link longer than the site's QR encoder holds could not be shown as a code, so it is never offered.
          if (new TextEncoder().encode(studentUrl(row)).length <= MAX_BYTES) rows.push(row);
        }
      }
    }
  }
  return rows;
}

export const pickOf = (r) => ({ band: r.band, domain: r.domain, level: r.level, id: r.id });
export const sameResource = (a, b) =>
  !!a && !!b && a.band === b.band && a.domain === b.domain && a.level === b.level && a.id === b.id;
export const findRow = (rows, pick) =>
  pick ? rows.find((r) => sameResource(r, pick)) || null : null;

/** The lab route for a resource (the same shape the lab's own room pages use) in the right grades. */
export function resourceRoute(r, extra = {}) {
  const q = new URLSearchParams({ grades: r.band, ...extra });
  return `/${cap(r.domain)}/${r.level}/${r.id}?${q}`;
}
/** The link a student opens: the real activity on the public host. Contains no teacher or learner data. */
export const studentUrl = (r) => `${SITE.host}${SITE.base}${resourceRoute(r)}`;

/* ── Resource Finder ── */

// How well an activity fits a classroom purpose. Time is the strongest signal; the support level breaks ties
// (starting and building supports suit warm-ups and guided work, stretching support suits independence).
const FIT = {
  warmup: (r) => (r.minutes <= 6 ? 4 : r.minutes <= 8 ? 2 : 0) + (r.level === "C" ? 0 : 1),
  guided: (r) =>
    (r.minutes >= 6 && r.minutes <= 10 ? 3 : 1) + (r.level === "B" ? 2 : r.level === "A" ? 1 : 0),
  independent: (r) => (r.level === "C" ? 4 : 0) + (r.minutes >= 8 ? 2 : 0),
  check: (r) => (r.minutes <= 5 ? 4 : r.minutes <= 7 ? 2 : 0) + (r.level === "B" ? 1 : 0),
};
export const WHY = {
  warmup: "Short enough to open a lesson.",
  guided: "A medium task with supports students can open while you circulate.",
  independent: "Less scaffolding and a longer task for students working alone.",
  check: "Quick to finish, and the response shows what students can do now.",
};

/** Up to three activities for a band, domain and purpose: best fit first, no two with the same skill focus. */
export function recommend(rows, { band, domain, purpose }, limit = 3) {
  const fit = FIT[purpose] || FIT.warmup;
  const ranked = rows
    .filter((r) => r.band === band && r.domain === domain)
    .map((r) => ({ r, score: fit(r) }))
    .sort(
      (a, b) =>
        b.score - a.score || a.r.minutes - b.r.minutes || a.r.title.localeCompare(b.r.title),
    );
  const out = [];
  const seen = new Set();
  for (const { r } of ranked) {
    if (seen.has(r.focus)) continue;
    seen.add(r.focus);
    out.push(r);
    if (out.length === limit) break;
  }
  return out;
}

/** Plain, non-numeric label for the band's tour defaults. */
export const bandName = (id) => BANDS.find((b) => b.id === id)?.name || "";
export const domainName = (id) => DOMAINS.find((d) => d.id === id)?.name || "";

/** What this device remembers about the tour, for the entry points: "start", "continue" (unfinished) or "again" (kit made). */
export function tourStatus(intro) {
  const t = intro?.[STORE_KEY];
  if (!t || t.v !== 1 || !(t.furthest > 0)) return { state: "start", label: "" };
  const done = t.step === "kit" || t.kit;
  const step = STEPS[Math.max(0, Math.min(STEPS.length - 1, t.furthest))];
  return { state: done ? "again" : "continue", label: done ? "Lesson kit ready" : `${step.name}${step.n <= TOUR_STEPS ? `, step ${step.n} of ${TOUR_STEPS}` : ""}` };
}

/** What Mr. Neft, the tour guide, says at the top of each screen, and the question buttons he offers there. */
export const NEFT = {
  gate: { say: "Welcome back! Want to pick up where we stopped?", chips: ["saved", "account", "time"] },
  welcome: { say: "Hi, I’m Mr. Neft, your tour guide. I’ll walk you through the site in five short steps. First, take a look at the kinds of practice.", chips: ["time", "what", "account", "scored"] },
  experience: { say: "Now you’re the student. Try the real activity. I’ll be right here if you have a question.", chips: ["mic", "norecord", "sound", "saved"] },
  support: { say: "This is my favorite part: the goal stays the same and the supports change. Switch between the three and watch what moves.", chips: ["language", "students", "scored"] },
  implement: { say: "Let’s find something you can use tomorrow. Pick your grades, a skill and a purpose, then preview a result.", chips: ["share", "families", "saved"] },
  prepare: { say: "Nice choice. See how it fits into a lesson: six small parts, and the online activity is just one of them.", chips: ["use", "share", "scored"] },
  studio: { say: "Now we build your lesson together. Confirm your choices, generate it, then make it yours.", chips: ["time", "share", "saved"] },
  kit: { say: "Your kit is ready! Download it, print it, or put it on the projector. You can come back any time.", chips: ["share", "families", "saved"] },
};
