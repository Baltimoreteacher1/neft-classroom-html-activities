// The student app's single door to saved data. It reads and writes the SAME records the full lab
// (lab.html, app.js) uses, so progress, mastery, the mistake notebook, learner slots and backups stay one
// record whichever screen a learner used: progress `ewl-fluency-progress-v1`, tutor `ewl-fluency-tutor-v2`,
// last place `ewl-fluency-last-v1`, grade `ewl-fluency-settings-v1:grade`, all per learner via profileKey.
import { ALL_SKILLS, GRADES } from "../problem-bank.js";
import { profileKey } from "../family/fm2/profile-key.js";
import {
  emptyTutor,
  evidence,
  recordAnswer,
  rememberMistake,
  sanitizeTutor,
} from "../tutor-engine.js";
import { validLastVisit } from "../skill-path.js";

const PROGRESS = "ewl-fluency-progress-v1";
const TUTOR = "ewl-fluency-tutor-v2";
const LAST = "ewl-fluency-last-v1";
const GRADE = "ewl-fluency-settings-v1:grade";
const PROFILES = "ewl-fluency-profiles-v1";
const TAB_PROFILE = "ewl-fluency-tab-profile";
export const PROFILE_NAMES = ["Orbit", "River", "Comet", "Forest", "Ocean", "Sunrise"];

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

// Same rule as school-tools.js profiles(): the tab's learner wins, then the device's last choice.
export function activeProfile() {
  const stored = read(PROFILES, {});
  const ids = (Array.isArray(stored.ids) ? stored.ids : [0]).filter(
    (id) => Number.isInteger(id) && id >= 0 && id < PROFILE_NAMES.length,
  );
  if (!ids.length) ids.push(0);
  let tab = null;
  try {
    const raw = sessionStorage.getItem(TAB_PROFILE);
    tab = raw == null ? null : Number(raw);
  } catch {
    /* a tab without sessionStorage follows the device */
  }
  return {
    ids,
    active: ids.includes(tab) ? tab : ids.includes(stored.active) ? stored.active : ids[0],
  };
}

// Same rule as school-tools.js selectProfile(): the device remembers the choice and this tab is pinned to it.
export function selectLearner(id) {
  if (!Number.isInteger(id) || id < 0 || id >= PROFILE_NAMES.length) return false;
  const data = activeProfile();
  if (!data.ids.includes(id)) data.ids.push(id);
  write(PROFILES, { ids: data.ids, active: id });
  try {
    sessionStorage.setItem(TAB_PROFILE, String(id));
  } catch {
    /* the tab then follows the device's last choice */
  }
  return true;
}

const key = (base) => profileKey(base, activeProfile().active);

export const savedGrade = () => {
  const grade = read(key(GRADE), null);
  return GRADES.some((entry) => entry.grade === grade) ? grade : null;
};
export const saveGrade = (grade) => write(key(GRADE), grade);
export const lastVisit = () => validLastVisit(read(key(LAST), null));
export const saveLastVisit = (grade, skillId, stage) =>
  write(key(LAST), { grade, skillId, stage, at: Date.now() });

export const loadTutor = () => sanitizeTutor(read(key(TUTOR), emptyTutor()));
const loadProgress = () => {
  const value = read(key(PROGRESS), {});
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
};

export const skillEvidence = (skill) => evidence(loadTutor(), skill);

// One answered practice problem. `independent` is false whenever any help was opened before the answer, so
// supported work never counts toward "Remembered independently" (tutor-engine evidence()).
export function recordPractice(skill, item, { correct, independent, firstTry, raw, level = 1 }) {
  const tutor = loadTutor();
  if (firstTry)
    recordAnswer(tutor, skill, { correct, independent, level, viewedExample: !independent });
  if (!correct) rememberMistake(tutor, skill, item, raw);
  write(key(TUTOR), tutor);
  if (!firstTry) return;
  const progress = loadProgress();
  const id = `${skill.grade}:${skill.id}`;
  const record = {
    attempts: 0,
    correct: 0,
    completedSets: 0,
    bestStreak: 0,
    streakBest: 0,
    guidedProblems: 0,
    guidedCorrect: 0,
    guidedSets: 0,
    lastPracticed: null,
    ...(progress[id] || {}),
  };
  if (independent) {
    record.attempts += 1;
    if (correct) record.correct += 1;
  } else {
    record.guidedProblems += 1;
    if (correct) record.guidedCorrect += 1;
  }
  record.lastPracticed = new Date().toISOString();
  progress[id] = record;
  write(key(PROGRESS), progress);
}

// Student-facing progress: what I practiced, what I am improving, what to try next. No scores.
export function progressSummary(grade) {
  const tutor = loadTutor();
  const rows = ALL_SKILLS.filter((skill) => skill.grade === grade).map((skill) => ({
    skill,
    ev: evidence(tutor, skill),
  }));
  const practiced = rows.filter((row) => row.ev.recent.length);
  return {
    practiced,
    remembered: practiced.filter((row) => row.ev.secure),
    improving: practiced.filter((row) => !row.ev.secure),
    refresh: practiced.filter((row) => row.ev.secure && row.ev.due),
    openMistakes: tutor.mistakes.filter(
      (entry) => !entry.resolvedAt && entry.key.startsWith(`${grade}:`),
    ).length,
  };
}

// Library filters: "learn" = not practised yet, "practice" = practised but not yet remembered on my own,
// "review" = remembered and due for a refresh (the tutor's spaced-review ladder decides "due").
export function skillStates(grade) {
  const tutor = loadTutor();
  const states = {};
  for (const skill of ALL_SKILLS.filter((s) => s.grade === grade)) {
    const ev = evidence(tutor, skill);
    states[skill.id] = !ev.recent.length
      ? "learn"
      : ev.secure
        ? ev.due
          ? "review"
          : "secure"
        : "practice";
  }
  return states;
}
