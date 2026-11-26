// Project Studio · the cheap pre-check main.js runs on every render before it may download any authoring code.
// It errs toward "no": a device that has never been set to Teacher (and has no site teacher key in this tab) skips the
// import entirely. The authoritative decision is isTeacherMode() inside launcher.js, which also refuses a device that
// is linked to a class as a student. The key name mirrors vocab-academy/store.js (the lab's teacher-mode reader).
import { AUDIENCE_KEY, audienceRecord } from "../audience.js";
import { storage } from "../util.js";

const SITE_KEY = "accessPracticeLabClass:v1:site-key";

export function mayTeach() {
  try {
    if (audienceRecord(storage.get(AUDIENCE_KEY)).audience === "teacher") return true;
  } catch {
    // unreadable: fall through
  }
  try {
    return Boolean(globalThis.sessionStorage?.getItem(SITE_KEY));
  } catch {
    return false;
  }
}
