// Runs only inside the app (native-app.js imports this). Mounts the settings sheet, keeps the weekly reminder
// scheduled, and hides nothing of the lab: the lab itself is unchanged.
import { followPhoneLanguage, readMode } from "./lab-language.js";
import { createNative } from "./native.js";
import { mountSettings } from "./sheet.js";
import { normLang } from "./strings.js";

const CSS = "/access-practice-lab/native-app/native-app.css";

function addStyles(doc) {
  if (doc.querySelector(`link[href="${CSS}"]`)) return;
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS;
  doc.head.append(link);
}

async function boot() {
  const native = createNative();
  if (!native.isNative()) return;
  addStyles(document);
  document.documentElement.classList.add("nla-native");
  const sync = () => native.syncReminder(normLang(readMode()));
  mountSettings({ native, onLanguage: sync });
  sync(); // never prompts: it only reschedules when the preference is on and permission is already granted
  native.onResume(sync);
  // A Spanish phone gets the lab in Spanish on first launch; the reminder then follows the new language.
  if ((await followPhoneLanguage()) === "switched") sync();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
