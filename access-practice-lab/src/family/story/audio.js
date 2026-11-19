// Read a whole Family Language Story aloud with the lab's own speech (src/speech.js): one voice per language, English
// first then Spanish in bilingual mode. Shared by the family page and the teacher's preview, so both sound the same.
import { spanishVoiceStatus, speak } from "../../speech.js";
import { readAloud } from "./model.js";

/**
 * @param {object} story  a normalized story
 * @param {object} I      makeI18n(...) for the language shown
 * @param {{rate?: number, onNoSpanishVoice?: () => void}} opts
 * @returns {Promise<boolean>} true when everything was read
 */
export async function listenStory(story, I, { rate, onNoSpanishVoice } = {}) {
  const langs = I.bilingual ? ["en", "es"] : [I.spanish ? "es" : "en"];
  for (const lang of langs) {
    if (lang === "es" && spanishVoiceStatus() === "none") {
      onNoSpanishVoice?.();
      continue;
    }
    // One call per run of the same voice: the quote is always English, so a Spanish page switches voice for it.
    const segs = readAloud(story, [lang]);
    for (let i = 0; i < segs.length; ) {
      let j = i;
      while (j < segs.length && segs[j].lang === segs[i].lang) j++;
      const done = await speak(
        segs.slice(i, j).map((x) => x.text),
        { lang: segs[i].lang === "es" ? "es-US" : "en-US", rate },
      );
      if (!done) return false;
      i = j;
    }
  }
  return true;
}
