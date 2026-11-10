// Device storage for MathSense and the hand-off to the Fluency Lab evidence engine. Nothing leaves the browser.
// Evidence goes through tutor-engine's recordAnswer, the same call every other lab skill uses, so a supported
// attempt is stored as supported and the mastery model gives it a quarter of the credit.
import { profileKey } from "../family/fm2/profile-key.js";
import { activeProfile } from "../reality/storage.js";
import { emptyTutor, findSkill, recordAnswer, sanitizeTutor } from "../tutor-engine.js";
import { KEY, emptyRecord, sanitize } from "./progress.js";

const TUTOR_KEY = "ewl-fluency-tutor-v2";

const storageOf = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

export const profileId = () => activeProfile();

export function load(profile = profileId(), storage = storageOf()) {
  try {
    const raw = storage?.getItem(profileKey(KEY, profile));
    return raw ? sanitize(JSON.parse(raw)) : emptyRecord();
  } catch {
    return emptyRecord();
  }
}

// Returns false when the device refuses the write, so the page can say so instead of failing silently.
export function save(record, profile = profileId(), storage = storageOf()) {
  try {
    storage.setItem(profileKey(KEY, profile), JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

// One mission attempt into the learner's evidence record. `independent` comes from progress.withAttempt.
export function recordEvidence(
  { mission, correct, independent, attempt },
  profile = profileId(),
  storage = storageOf(),
  now = Date.now(),
) {
  const skill = findSkill(mission.skill);
  if (!skill || !storage) return false;
  try {
    const key = profileKey(TUTOR_KEY, profile);
    const saved = storage.getItem(key);
    const tutor = sanitizeTutor(saved ? JSON.parse(saved) : emptyTutor());
    recordAnswer(
      tutor,
      skill,
      {
        correct,
        independent,
        level: 1,
        strategyTags: ["visual"],
        sig: `mathsense:${mission.id}:${attempt}`,
      },
      now,
    );
    storage.setItem(key, JSON.stringify(tutor));
    return true;
  } catch {
    return false;
  }
}
