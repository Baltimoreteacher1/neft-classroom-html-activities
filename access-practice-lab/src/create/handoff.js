// Project Studio · hand a built resource to the Activity Studio: save it as a new teacher draft on this device (the
// Studio's own draft store, src/studio/drafts.js) and open the editor on it. The platform original is never touched.
import { BASE } from "../util.js";
import { normalizeActivity } from "../studio/core/schema.js";
import { getLocal, newActivityId, saveLocal } from "../studio/drafts.js";

/** Save a built activity as a teacher draft on this device and open it in the Activity Studio editor. */
export function openInStudio(activity, go = (path) => location.assign(path)) {
  const a = normalizeActivity({ ...activity, id: newActivityId(), rev: 0 });
  if (!saveLocal(a, null) || !getLocal(a.id)) return false;
  for (const d of document.querySelectorAll("dialog.cr-dialog")) d.close();
  go(`${BASE}/activity-studio/${a.id}`);
  return true;
}

