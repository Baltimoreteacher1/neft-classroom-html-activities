// Family Tour state: one small object saved on this device. It holds choices only (language, stage, focus, grade
// band, minutes, the chosen activity id, the three-row tracker). It never holds a name, a recording or a typed answer.
// Another device never sees it: nothing here is sent anywhere.
export const KEY = "languagePage:familyTour:v1";
export const STAGES = ["welcome", "explore", "practice", "help", "plan", "kit"];
export const BANDS = ["3-5", "6-8"];
export const FOCUS = ["speaking", "writing", "both"];
export const MINUTES = [5, 10, 15];

const blankRow = () => ({ date: "", activity: "", status: "", practiced: "", next: "" });

export const defaults = () => ({
  v: 1,
  lang: "",
  mode: "tour", // "tour" while onboarding, "home" once the family has a kit
  stage: "welcome",
  done: [],
  focus: "",
  band: "",
  minutes: 10,
  pick: "",
  strategies: [],
  seen: [],
  tracker: [blankRow(), blankRow(), blankRow()],
  savedAt: "",
});

let memory = null;

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
};

/** Keep only values the tour understands, so an old or edited save can never break a screen. */
export function clean(raw) {
  const d = defaults();
  if (!raw || typeof raw !== "object") return d;
  const s = { ...d };
  if (typeof raw.lang === "string" && /^[a-z]{2}$/.test(raw.lang)) s.lang = raw.lang;
  if (raw.mode === "home" || raw.mode === "tour") s.mode = raw.mode;
  if (STAGES.includes(raw.stage)) s.stage = raw.stage;
  if (Array.isArray(raw.done)) s.done = raw.done.filter((x) => STAGES.includes(x));
  if (FOCUS.includes(raw.focus)) s.focus = raw.focus;
  if (BANDS.includes(raw.band)) s.band = raw.band;
  if (MINUTES.includes(raw.minutes)) s.minutes = raw.minutes;
  if (typeof raw.pick === "string" && raw.pick.length < 80) s.pick = raw.pick;
  if (Array.isArray(raw.strategies)) s.strategies = raw.strategies.filter((x) => ["unsure", "mistake", "frustrated"].includes(x));
  if (Array.isArray(raw.seen)) s.seen = raw.seen.filter((x) => ["speaking", "writing"].includes(x));
  if (Array.isArray(raw.tracker))
    s.tracker = d.tracker.map((blank, i) => {
      const row = raw.tracker[i] || {};
      const text = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");
      return {
        date: /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? row.date : "",
        activity: text(row.activity, 80),
        status: ["completed", "attempted"].includes(row.status) ? row.status : "",
        practiced: text(row.practiced, 160),
        next: text(row.next, 160),
      };
    });
  if (typeof raw.savedAt === "string") s.savedAt = raw.savedAt.slice(0, 40);
  return s;
}

export function load() {
  if (!memory) memory = clean(read());
  return memory;
}

/** Merge a change, save it, return the new state. A blocked or full storage keeps working in memory. */
export function save(patch = {}) {
  memory = clean({ ...load(), ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* private mode or full storage: the tour still runs; Save & Exit says the plan will not be kept */
  }
  return memory;
}

export function storageWorks() {
  try {
    localStorage.setItem(`${KEY}:probe`, "1");
    localStorage.removeItem(`${KEY}:probe`);
    return true;
  } catch {
    return false;
  }
}

/** Start over: everything except the language the family chose. */
export function startOver() {
  const lang = load().lang;
  memory = { ...defaults(), lang };
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {}
  return memory;
}

export const hasProgress = (s) => s.mode === "tour" && (s.stage !== "welcome" || s.done.length > 0 || Boolean(s.focus));
