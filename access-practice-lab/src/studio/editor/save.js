// Autosave. Every change is written to this device a moment after the teacher pauses, a recoverable earlier version
// is kept after a longer pause, and (when this activity is saved to a class) the class copy is updated with a
// revision check, so two devices can never silently overwrite each other.
//
// Status is one plain sentence the editor shows next to the title.

import { pushRevision, saveLocal, studioApi } from "../drafts.js";
import { debounce } from "./ui.js";

const LOCAL_MS = 700;
const CLASS_MS = 2500;
const REVISION_MS = 8000;

/**
 * @param {object} opts { store, getLink: () => ({code, passcode}|null), onStatus(state), setLink(link) }
 * state: { phase: "saved"|"saving"|"unsaved"|"class"|"conflict"|"error", detail?: string }
 */
export function createSaver({ store, getLink, setLink, onStatus, fetchImpl }) {
  let dirty = false;
  let inFlight = false;
  const status = (phase, detail = "") => onStatus({ phase, detail });

  const saveHere = () => {
    const a = store.get();
    const ok = saveLocal(a, getLink()?.code ? { code: getLink().code } : undefined);
    dirty = false;
    status(ok ? "saved" : "error", ok ? "" : "storage");
    scheduleClass();
  };
  const localLater = debounce(saveHere, LOCAL_MS);
  const revisionLater = debounce(() => pushRevision(store.get()), REVISION_MS);

  async function saveToClass() {
    const link = getLink();
    if (!link?.code || inFlight) return;
    inFlight = true;
    status("saving");
    const a = store.get();
    try {
      const api = studioApi({ code: link.code, passcode: link.passcode, fetchImpl });
      const res = await api.save(a, a.rev);
      if (res.ok) {
        store.adoptRev(res.rev);
        setLink?.({ ...link, rev: res.rev, state: res.state, publishedRev: res.publishedRev });
        status("class");
      } else if (res.error === "conflict" || res.httpStatus === 409)
        status("conflict", JSON.stringify(res.current || {}));
      else if (res.httpStatus === 401) status("error", "unauthorized");
      else status("error", res.error || "failed");
    } catch {
      status("error", "offline");
    } finally {
      inFlight = false;
    }
  }
  const classLater = debounce(saveToClass, CLASS_MS);
  function scheduleClass() {
    if (getLink()?.code) classLater();
  }

  store.subscribe((_a, reason) => {
    if (reason === "rev") return;
    dirty = true;
    status("saving");
    localLater();
    revisionLater();
  });

  return {
    /** Write everything now (before leaving the page or sharing). */
    async flush() {
      localLater.cancel();
      saveHere();
      classLater.cancel();
      await saveToClass();
    },
    isDirty: () => dirty,
    saveToClass,
    destroy() {
      localLater.cancel();
      classLater.cancel();
      revisionLater.cancel();
    },
  };
}
