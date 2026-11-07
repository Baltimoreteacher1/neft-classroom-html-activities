// Teacher Hub: live class panel. The same module the lab's /class/teacher view mounts (one implementation), so a
// teacher can create a class, assign work, run the live quiz and send voice notes from the Hub on either host.
// The Hub's other panels stay browser-local and work with or without a class. Add ?lang=es or ?lang=bi for Spanish.
import { mountClassPanel } from "/access-practice-lab/src/class/roster-panel.js";
import { makeI18n } from "/access-practice-lab/src/i18n.js";

const MODES = ["en", "es", "bi"];

export function mountLiveClassPanel(root) {
  const lang = new URLSearchParams(location.search).get("lang");
  const I = makeI18n(MODES.includes(lang) ? lang : "en", "en");
  return mountClassPanel(root, { S: I.S });
}
