// Teacher Hub: Learning Journey mission guide. Mounts the compact guide (mission list, direct student links, the evidence each
// step records) from the lab's own module, so the hub and the public guide page never drift apart. Nothing here reads or writes
// student progress, and a link names a mission and a step, never a student. Add ?lang=es or ?lang=bi to the hub address for Spanish.
import { makeI18n } from "/access-practice-lab/src/i18n.js";
import { guideHTML, mountGuide } from "/access-practice-lab/src/journey/ui/guide.js";
import { toHtml } from "/access-practice-lab/src/util.js";

const MODES = ["en", "es", "bi"];

export function mountJourneyPanel(root) {
  const lang = new URLSearchParams(location.search).get("lang");
  const I = makeI18n(MODES.includes(lang) ? lang : "en", "en");
  const opts = { band: "6-8", compact: true, hub: true, action: location.pathname };
  root.innerHTML = toHtml(guideHTML(I, opts));
  mountGuide(root, { I, opts, urlState: false });
}
