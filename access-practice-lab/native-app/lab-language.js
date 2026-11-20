// The lab's own language setting, read and written the way the lab itself does it, so there is exactly one language key.
// Read: prefs.lang in `accessPracticeLab:v1:prefs` ("en" | "es" | "bi", src/store.js, src/acc/i18n/I18nEngine.js).
// Write: a click on a [data-lang-mode] control. main.js handles that click for the header and page switches
// (ctx.setPrefs({ lang, langChosen: true }), announcement, re-render, I18nEngine follows), and the search palette does
// the same (src/search-palette.js). Only if the lab never applies it do we write the same prefs object ourselves and reload.
export const PREFS_KEY = "accessPracticeLab:v1:prefs";
export const MODES = ["en", "es", "bi"];

export function readMode(storage = globalThis.localStorage) {
  try {
    const mode = JSON.parse(storage.getItem(PREFS_KEY) || "{}")?.lang;
    return MODES.includes(mode) ? mode : "en";
  } catch {
    return "en";
  }
}

/** Same merge as store.js setPrefs: keep every other pref, set lang and langChosen. */
export function writeMode(mode, storage = globalThis.localStorage) {
  let prefs = {};
  try {
    prefs = JSON.parse(storage.getItem(PREFS_KEY) || "{}") || {};
  } catch {}
  storage.setItem(PREFS_KEY, JSON.stringify({ ...prefs, lang: mode, langChosen: true }));
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Switches the lab language. Resolves to the mode now stored. `force` clicks even when the mode already matches (it
 * is what sets langChosen); `fallback: false` never writes the prefs object, it only asks the lab. */
export async function setMode(
  mode,
  { doc = document, storage = globalThis.localStorage, force = false, fallback = true } = {},
) {
  if (!MODES.includes(mode)) return readMode(storage);
  if (!force && readMode(storage) === mode) return mode;
  const control = doc.createElement("button");
  control.type = "button";
  control.hidden = true;
  control.setAttribute("data-lang-mode", mode);
  doc.body.append(control);
  control.click();
  control.remove();
  for (let i = 0; i < 10 && readMode(storage) !== mode; i++) await wait(80);
  if (fallback && readMode(storage) !== mode) {
    writeMode(mode, storage);
    globalThis.location?.reload();
  }
  return readMode(storage);
}

/** True once somebody picked a language in the lab (the first-visit banner, the header switch or this app's sheet). */
export function langChosen(storage = globalThis.localStorage) {
  try {
    return Boolean(JSON.parse(storage.getItem(PREFS_KEY) || "{}")?.langChosen);
  } catch {
    return false;
  }
}

const isSpanishPhone = (nav) => /^es(-|_|$)/i.test(String(nav?.language || ""));

/**
 * First launch on a Spanish-language phone: the lab opens in Spanish, through the same control the family would tap.
 * Never overrides a choice already made, never writes prefs itself, and gives up quietly if the lab never shows its
 * language control (a plain page that is not the lab). Resolves to "switched" | "skipped" | "no-lab".
 */
export async function followPhoneLanguage({
  nav = globalThis.navigator,
  doc = document,
  storage = globalThis.localStorage,
  waitMs = 8000,
} = {}) {
  if (!isSpanishPhone(nav) || langChosen(storage)) return "skipped";
  for (let waited = 0; !doc.querySelector("[data-lang-mode]"); waited += 100) {
    if (waited >= waitMs) return "no-lab";
    await wait(100);
  }
  if (langChosen(storage)) return "skipped"; // the family tapped something while the lab was starting
  await setMode("es", { doc, storage, force: true, fallback: false });
  return "switched";
}
