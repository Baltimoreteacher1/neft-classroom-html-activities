// Writing feedback in a fixed order: what is working, one next step, and why it helps. No score, no level.
// It only reports what a simple check can see, and says so (LIMIT). A teacher's reading always comes first.
import { splitSentences } from "./ask.js";

export const LIMIT = {
  en: "This checks only simple things I can see: capital letters, end marks, key words and sentence length. It cannot tell if your ideas are good or if your grammar is right. Your teacher can.",
  es: "Esto revisa solo cosas simples que puedo ver: mayúsculas, signos finales, palabras clave y largo de las oraciones. No puede saber si tus ideas son buenas ni si tu gramática es correcta. Tu maestro sí puede.",
};

export function writingFeedback(text, { keyWords = [], minSentences = 2 } = {}) {
  const t = String(text || "").trim();
  const out = { working: [], next: [], why: [], limit: LIMIT, empty: !t };
  if (!t) return out;
  const sents = splitSentences(t);
  const lower = t.toLowerCase();
  const used = keyWords.filter((w) => new RegExp(`\\b${String(w).toLowerCase()}`).test(lower));
  const capsOk = sents.every((s) => /^[A-Z"“]/.test(s));
  const endsOk = /[.!?]["”]?$/.test(t);
  if (sents.length >= minSentences) out.working.push({ en: `You wrote ${sents.length} sentences.`, es: `Escribiste ${sents.length} oraciones.` });
  if (used.length) out.working.push({ en: `You used key words: ${used.join(", ")}.`, es: `Usaste palabras clave: ${used.join(", ")}.` });
  if (capsOk && sents.length) out.working.push({ en: "Every sentence starts with a capital letter.", es: "Cada oración empieza con mayúscula." });
  // One next step only, the most useful one first.
  if (!endsOk) out.next.push({ en: "End your last sentence with a . ? or !", es: "Termina tu última oración con . ? o !" }), out.why.push({ en: "An end mark tells the reader where the idea stops.", es: "El signo final le dice al lector dónde termina la idea." });
  else if (!capsOk) out.next.push({ en: "Start each sentence with a capital letter.", es: "Empieza cada oración con mayúscula." }), out.why.push({ en: "Capital letters show where a new sentence begins.", es: "Las mayúsculas muestran dónde empieza una oración nueva." });
  else if (keyWords.length && used.length < Math.min(2, keyWords.length)) out.next.push({ en: `Try using one more key word: ${keyWords.filter((w) => !used.includes(w)).slice(0, 2).join(" or ")}.`, es: `Intenta usar una palabra clave más: ${keyWords.filter((w) => !used.includes(w)).slice(0, 2).join(" o ")}.` }), out.why.push({ en: "Key words make your writing clear and show what you learned.", es: "Las palabras clave aclaran tu escritura y muestran lo que aprendiste." });
  else if (sents.length < minSentences) out.next.push({ en: "Add one more sentence. Say why, where or how.", es: "Agrega una oración más. Di por qué, dónde o cómo." }), out.why.push({ en: "More detail helps the reader picture your idea.", es: "Más detalle ayuda al lector a imaginar tu idea." });
  else out.next.push({ en: "Read it aloud once, then show your teacher.", es: "Léelo en voz alta una vez y muéstraselo a tu maestro." }), out.why.push({ en: "Reading aloud helps you hear what to fix.", es: "Leer en voz alta te ayuda a oír qué corregir." });
  return out;
}
