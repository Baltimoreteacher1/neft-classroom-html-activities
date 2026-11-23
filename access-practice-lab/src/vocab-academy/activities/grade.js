// gradeItem(item, response, opts?) — pure grading for every response mode. opts = { I } for bilingual feedback.
//   choice  response: index            steps  response: [index, …]          typed  response: string
//   order   response: [text, …]        build  response: [tile, …]            sort   response: { itemIdx: catIdx }
//   match   response: { leftIdx: rightIdx }   write response: string          speak  response: { text, recorded, checked:[idx] }
import { countWords, norm } from "./core.js";
import { analyzeWriting } from "./writing.js";

const M = (opts) => (en, es) => (opts?.I ? opts.I.S(en, es) : en);
const empty = (m, text) => ({ ok: false, empty: true, feedback: [{ ok: null, text: m(text[0], text[1]) }] });

function distance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
const partial = (right, total) => ({ right, total });

export function gradeItem(it, response, opts = {}) {
  const m = M(opts);
  switch (it.mode) {
    case "choice": {
      if (response == null || response === "") return empty(m, ["Choose an answer first.", "Elige una respuesta primero."]);
      return { ok: Number(response) === it.answer, feedback: [] };
    }
    case "steps": {
      const r = Array.isArray(response) ? response : [];
      if (r.length < it.steps.length || r.some((x) => x == null)) return empty(m, ["Answer both parts first.", "Responde las dos partes primero."]);
      const right = it.steps.filter((s, i) => Number(r[i]) === s.answer).length;
      return { ok: right === it.steps.length, partial: partial(right, it.steps.length), stepOk: it.steps.map((s, i) => Number(r[i]) === s.answer), feedback: [] };
    }
    case "typed": {
      const said = norm(response);
      if (!said) return empty(m, ["Type or choose a word first.", "Escribe o elige una palabra primero."]);
      const want = it.answer.map(norm);
      if (want.includes(said)) return { ok: true, feedback: [] };
      if (said.length >= 6 && want.some((w) => distance(said, w) === 1))
        return { ok: true, spelling: true, feedback: [{ ok: null, text: m(`Right word. Check the spelling: “${it.answer[0]}”.`, `Es la palabra. Revisa la ortografía: “${it.answer[0]}”.`) }] };
      if ((it.near || []).map(norm).includes(said)) return { ok: false, feedback: [{ ok: null, text: m("That is the right word family. Read the sentence again: which form fits?", "Es la familia correcta. Lee la oración otra vez: ¿qué forma encaja?") }] };
      return { ok: false, feedback: [] };
    }
    case "order":
    case "build": {
      const r = Array.isArray(response) ? response : [];
      if (!r.length) return empty(m, it.mode === "build" ? ["Tap some parts to build the word first.", "Toca algunas partes para construir la palabra primero."] : ["Move the words into an order first.", "Ordena las palabras primero."]);
      const right = it.answer.filter((a, i) => r[i] === a).length;
      return { ok: r.length === it.answer.length && right === it.answer.length, partial: partial(right, it.answer.length), feedback: [] };
    }
    case "sort": {
      const r = response || {};
      if (it.items.some((_, i) => r[i] == null)) return empty(m, ["Put every word in a group first.", "Pon cada palabra en un grupo primero."]);
      const right = it.items.filter((x, i) => Number(r[i]) === x.a).length;
      return { ok: right === it.items.length, partial: partial(right, it.items.length), rowOk: it.items.map((x, i) => Number(r[i]) === x.a), feedback: [] };
    }
    case "match": {
      const r = response || {};
      if (it.items.some((_, i) => r[i] == null)) return empty(m, ["Match every word first.", "Une cada palabra primero."]);
      const right = it.items.filter((_, i) => Number(r[i]) === it.answer[i]).length;
      return { ok: right === it.items.length, partial: partial(right, it.items.length), rowOk: it.items.map((_, i) => Number(r[i]) === it.answer[i]), feedback: [] };
    }
    case "write": {
      const text = String(response || "").trim();
      if (!text) return empty(m, ["Write something first.", "Escribe algo primero."]);
      const a = analyzeWriting(text, it.spec, m);
      return { ok: a.ok, review: true, words: a.words, perWord: a.perWord, feedback: a.checks.map((x) => ({ ok: x.ok, text: x.text })) };
    }
    case "speak": {
      const r = response || {};
      const checked = (r.checked || []).length;
      const gave = Boolean(r.recorded || r.said) || countWords(r.text) >= (it.minWords ?? 3);
      const feedback = [];
      if (!it.partner) feedback.push({ ok: gave, text: gave ? m("You gave a response.", "Diste una respuesta.") : m("Record yourself, or type a short answer.", "Graba tu voz o escribe una respuesta corta.") });
      feedback.push({ ok: checked >= it.minChecks, text: checked >= it.minChecks ? m(`You checked off ${checked} of ${it.checklist.length}.`, `Marcaste ${checked} de ${it.checklist.length}.`) : m(`Tick at least ${it.minChecks} things you did.`, `Marca al menos ${it.minChecks} cosas que hiciste.`) });
      return { ok: (it.partner || gave) && checked >= it.minChecks, review: true, selfReported: true, feedback };
    }
    default:
      throw new Error(`gradeItem: unknown mode "${it.mode}"`);
  }
}
