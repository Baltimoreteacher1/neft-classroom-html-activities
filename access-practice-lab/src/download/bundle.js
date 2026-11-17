// One .zip of a room's activities, one student .docx each, built in the browser with the site's one ZIP writer
// (assets/lib/zip-store.js). Pure (no DOM): it yields to the event loop between files so the page can show
// progress and honour Cancel, and it runs unchanged in Node tests.
import { zipStore } from "../../../assets/lib/zip-store.js";
import { toDocx } from "./docx.js";
import { activityDocument } from "./model.js";

export class Cancelled extends Error {
  constructor() {
    super("cancelled");
    this.name = "Cancelled";
  }
}

const yieldNow = () => new Promise((r) => setTimeout(r, 0));

/**
 * activities: the room's records in teaching order. optsFor(a) → activityDocument options (band, domain, level,
 * lang, url). onProgress(done, total) after each file; cancelled() → true stops with a Cancelled error.
 * Returns { bytes, names } (names in zip order: "01-<slug>.docx", …).
 */
export async function roomZip(
  activities,
  optsFor,
  { onProgress = () => {}, cancelled = () => false } = {},
) {
  const files = {};
  const width = String(activities.length).length < 2 ? 2 : String(activities.length).length;
  let i = 0;
  for (const a of activities) {
    if (cancelled()) throw new Cancelled();
    const doc = activityDocument(a, optsFor(a));
    files[`${String(++i).padStart(width, "0")}-${doc.slug}.docx`] = toDocx(doc);
    onProgress(i, activities.length);
    await yieldNow();
  }
  if (cancelled()) throw new Cancelled();
  return { bytes: zipStore(files), names: Object.keys(files) };
}
