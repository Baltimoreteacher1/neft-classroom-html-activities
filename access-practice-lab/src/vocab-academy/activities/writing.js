// Rule-based, transparent checks for free responses. They look for words, length and structure only and say so:
// nothing here judges whether the meaning is right, and every written response is saved for teacher review.
import { countWords, norm, splitSentences } from "./core.js";

const STOP = new Set("this that with from they them their there then than were have been what when where which while about into over after before because would could should these those your some more also just very much many such only each other".split(" "));
const REASON = /\b(because|since|for example|for instance|this shows|that is why|so that|as a result|therefore|for this reason)\b/i;
const CLAIM = /\b(i (believe|think|agree|disagree|argue|feel)|in my opinion|my claim|should|must|ought)\b/i;
const JOIN = /\b(because|so|but|since|although|while|when|after|before|which|that|who|and)\b/i;
const key5 = (w) => w.slice(0, Math.min(5, w.length));
const contentWords = (s) => (norm(s).match(/[a-z][a-z'-]+/g) || []).filter((w) => w.length >= 4 && !STOP.has(w));

/** @returns {{checks:{id:string,ok:boolean|null,required:boolean,text:string}[], ok:boolean, words:number, perWord:Record<string,boolean>}} */
export function analyzeWriting(text, spec = {}, M = (en) => en) {
  const t = String(text || "");
  const n = countWords(t);
  const checks = [];
  const add = (id, ok, required, textOk, textNo) => checks.push({ id, ok: ok ? true : required ? false : null, required, text: ok ? textOk : textNo });
  const perWord = {};
  const targets = spec.targets || [];
  const hit = targets.filter((x) => new RegExp(x.re, "i").test(t));
  for (const x of targets) perWord[x.id] = hit.includes(x);
  const anyLang = Boolean(spec.anyLang);
  const minWords = anyLang ? Math.min(spec.minWords || 3, 3) : spec.minWords || 1;

  add("words", n >= minWords, true, M(`Length: ${n} words.`, `Longitud: ${n} palabras.`), M(`Add a little more: aim for at least ${minWords} words (you have ${n}).`, `Agrega un poco más: busca al menos ${minWords} palabras (tienes ${n}).`));
  if (/___/.test(t)) add("blanks", false, true, "", M("Fill in every blank (___) with your own words.", "Llena cada espacio (___) con tus propias palabras."));
  if (targets.length && !anyLang) {
    const need = Math.min(spec.minTargets ?? targets.length, targets.length);
    if (need >= targets.length && targets.length <= 3) {
      for (const x of targets) add(`use-${x.id}`, perWord[x.id], true, M(`Uses “${x.hw}”.`, `Usa “${x.hw}”.`), spec.hideTarget ? M("Use a more exact word from this lesson.", "Usa una palabra más exacta de esta lección.") : M(`Not yet: use “${x.hw}” (a form such as “${x.hw}ly” or an -ed/-ing ending counts).`, `Todavía no: usa “${x.hw}” (también cuenta otra forma de la palabra).`));
    } else {
      add("targets", hit.length >= need, true, M(`Uses ${hit.length} lesson words: ${hit.map((x) => x.hw).join(", ")}.`, `Usa ${hit.length} palabras de la unidad: ${hit.map((x) => x.hw).join(", ")}.`), M(`Use at least ${need} words from this lesson (you used ${hit.length}).`, `Usa al menos ${need} palabras de esta lección (usaste ${hit.length}).`));
    }
  }
  if (spec.minSentences) {
    const s = splitSentences(t).length;
    add("sentences", s >= spec.minSentences, true, M(`Has ${s} sentences.`, `Tiene ${s} oraciones.`), M(`Write at least ${spec.minSentences} sentences (you have ${s}).`, `Escribe al menos ${spec.minSentences} oraciones (tienes ${s}).`));
  }
  if (spec.reason && !anyLang) add("reason", REASON.test(t), true, M("Gives a reason.", "Da una razón."), M("Add a reason: try “because”, “since”, or “for example”.", "Agrega una razón: prueba con “because”, “since” o “for example”."));
  if (spec.claim && !anyLang) add("claim", CLAIM.test(t), false, M("States a position.", "Expresa una postura."), M("Tip: say your position clearly, for example “I believe …”.", "Consejo: di tu postura con claridad, por ejemplo “I believe …”."));
  if (spec.link) add("link", JOIN.test(t) && /\b(because|so|but)\b/i.test(t), false, M("Bonus: joins two ideas with because, so, or but.", "Extra: une dos ideas con because, so o but."), M("Bonus idea: join two ideas with because, so, or but.", "Idea extra: une dos ideas con because, so o but."));
  if (spec.single) {
    const ends = (t.trim().replace(/[.!?]+["”')]*$/, "").match(/[.!?]\s+[A-Z“"]/g) || []).length;
    add("single", ends === 0, true, M("Written as one sentence.", "Escrito como una oración."), M("Write this as one sentence (join the ideas with a joining word).", "Escríbelo como una sola oración (une las ideas con una palabra de enlace)."));
  }
  if (spec.given && !anyLang) {
    const low = norm(t);
    spec.given.forEach((g, i) => {
      const keys = contentWords(g).map(key5);
      const ok = !keys.length || keys.some((k) => low.includes(k));
      add(`given-${i}`, ok, true, M(`Includes the idea from sentence ${i + 1}.`, `Incluye la idea de la oración ${i + 1}.`), M(`Include the idea from sentence ${i + 1}: “${g}”`, `Incluye la idea de la oración ${i + 1}: “${g}”`));
    });
  }
  if (spec.generic && !anyLang) {
    const gone = !new RegExp(`\\b${spec.generic}\\b`, "i").test(t);
    add("generic", gone, true, M(`Replaced “${spec.generic}”.`, `Reemplazaste “${spec.generic}”.`), M(`Replace “${spec.generic}” with a more exact word.`, `Reemplaza “${spec.generic}” con una palabra más exacta.`));
  }
  if (spec.gain) {
    const gain = n - (spec.baseWords || 0);
    add("gain", gain >= spec.gain, true, M(`Added ${gain} new words.`, `Agregaste ${gain} palabras.`), M(`Add at least ${spec.gain} more words: when, where, or why.`, `Agrega al menos ${spec.gain} palabras más: cuándo, dónde o por qué.`));
  }
  return { checks, ok: checks.filter((c) => c.required).every((c) => c.ok), words: n, perWord };
}
