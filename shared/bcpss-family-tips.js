// Text-message-sized family tips (D3): short, copyable messages in English and Spanish that a teacher sends through
// their OWN channel (text, WhatsApp, ClassDojo, email). The site sends nothing. Every tip is built from the unit's
// authored family block (talk, say_it, try_at_home, celebrate) and quotes it verbatim, so a tip can never say more than
// the authored data does. A tip that does not fit in 160 characters in BOTH languages is dropped, never truncated.
import { screenTask } from "./bcpss-family-plan.js";

export const MAX_TIP_CHARS = 160;
/** Characters as a person counts them (an accented letter or an emoji is one). */
export const tipLength = (text) => [...String(text)].length;
const fits = (en, es) => tipLength(en) <= MAX_TIP_CHARS && tipLength(es) <= MAX_TIP_CHARS;

const FRAME = {
  ask: {
    en: (q) => `Ask tonight: "${q}" Any language is fine.`,
    es: (q) => `Pregunten esta noche: "${q}" Sirve cualquier idioma.`,
  },
  say: {
    en: (s) => `Say it together: "${s}" Fill the blank with your own words.`,
    es: (s) => `Díganlo juntos: "${s}" Llenen el espacio con sus propias palabras.`,
  },
  try: {
    en: (t, min, mat) => `Try this (${min} min): ${t}.${mat ? ` You need: ${mat}.` : ""}`,
    es: (t, min, mat) => `Prueben esto (${min} min): ${t}.${mat ? ` Necesitan: ${mat}.` : ""}`,
  },
};
const trimStop = (text) => String(text).replace(/[.\s]+$/, "");

/**
 * Tips for one unit. `guide` is the family guide (/api/bcpss/family-guide/:unit).
 * @returns {Array<{id:string, kind:"ask"|"say"|"try"|"celebrate", en:string, es:string, source:{en:string[], es:string[]}}>}
 */
export function buildTips(guide) {
  const tips = [];
  const add = (id, kind, en, es, source) => {
    if (fits(en, es)) tips.push({ id, kind, en, es, source });
  };
  (guide?.talk || []).forEach((q, i) => {
    if (q?.en && q?.es)
      add(`ask-${i + 1}`, "ask", FRAME.ask.en(q.en), FRAME.ask.es(q.es), {
        en: [q.en],
        es: [q.es],
      });
  });
  (guide?.say_it || []).forEach((s, i) => {
    if (s?.en && s?.es)
      add(`say-${i + 1}`, "say", FRAME.say.en(s.en), FRAME.say.es(s.es), {
        en: [s.en],
        es: [s.es],
      });
  });
  (guide?.try_at_home || []).forEach((t, i) => {
    if (!screenTask(t).ok) return;
    const min = Number(t.minutes);
    const full = [
      FRAME.try.en(t.title.en, min, trimStop(t.materials.en)),
      FRAME.try.es(t.title.es, min, trimStop(t.materials.es)),
    ];
    const short = [FRAME.try.en(t.title.en, min, ""), FRAME.try.es(t.title.es, min, "")];
    const [en, es] = fits(...full) ? full : short;
    const withMaterials = en === full[0];
    add(`try-${i + 1}`, "try", en, es, {
      en: withMaterials ? [t.title.en, trimStop(t.materials.en)] : [t.title.en],
      es: withMaterials ? [t.title.es, trimStop(t.materials.es)] : [t.title.es],
    });
  });
  const c = guide?.celebrate;
  if (c?.en && c?.es) add("celebrate", "celebrate", c.en, c.es, { en: [c.en], es: [c.es] });
  return tips;
}
