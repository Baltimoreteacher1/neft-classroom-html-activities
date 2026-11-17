// Experience Builder, "Suggest improvements" (People section). Two sources of suggestions, shown the same way, each
// with Accept / Dismiss:
//   - built in (always, no network): source sentences no evidence, answer or meaning uses yet, offered as answer
//     lines for a character;
//   - optional model help, teacher only: POST /api/experience-compile with the instructor's source text (<= 6,000
//     characters), the builder settings and each character's id, name and role. Nothing about learners is sent. The
//     server validates every item (suggest-rules.js) and the editor checks the reply again with the same rules.
// Accept turns a suggestion into ONE editor operation (topic.add with its text), so undo and live validation work
// exactly as for a hand edit. Nothing changes until the instructor presses Accept.
import { isStop, tokenize } from "../lang/text.js";
import { html } from "../util.js";
import { overlap } from "./extract.js";
import { SUGGEST_LIMITS, acceptLine, acceptSuggestions, sourceSentences } from "./suggest-rules.js";
import { sourcedTexts } from "./validate.js";

export const SUGGEST_API = "/api/experience-compile";

const sourceOf = (def) => String(def?.source?.text || "");
const idsOf = (def) => (def?.characters || []).map((c) => c.id);
const keywordsOf = (text, n = 4) =>
  [
    ...new Set(
      tokenize(text)
        .map((t) => t.lower)
        .filter((w) => w.length > 3 && !isStop(w) && !/^\d/.test(w)),
    ),
  ].slice(0, n);

/** Indexes of the source sentences some evidence, answer, clarification or meaning already uses. */
function usedSentences(def, sentences) {
  const used = new Set();
  const texts = sourcedTexts(def);
  for (const t of texts) for (const i of t.from || []) used.add(i);
  sentences.forEach((s, i) => {
    if (
      !used.has(i) &&
      texts.some((t) => t.text && overlap(t.text, [s]) >= 0.8 && overlap(s, [t.text]) >= 0.8)
    )
      used.add(i);
  });
  return used;
}

/** Deterministic suggestions (no model, no network): unused source sentences as answer lines, round-robin. */
export function builtInSuggestions(def) {
  const source = sourceOf(def);
  const sentences = sourceSentences(source);
  const ids = idsOf(def);
  if (!ids.length) return [];
  const used = usedSentences(def, sentences);
  const ctx = { source, sentences, ids: new Set(ids) };
  const out = [];
  sentences.forEach((text, i) => {
    if (out.length >= SUGGEST_LIMITS.items || used.has(i)) return;
    const n = tokenize(text).length;
    if (n < 6 || n > SUGGEST_LIMITS.words) return;
    const line = acceptLine({ character: ids[out.length % ids.length], text }, ctx);
    if (line) out.push({ ...line, kind: "line", origin: "built-in", from: [i] });
  });
  return out.map((s, n) => ({ ...s, id: `b${n}` }));
}

/** The request body: the source text, the settings and each character's id, name and role. Nothing else. */
export function suggestBody(def, settings = {}, code = "") {
  return {
    source: sourceOf(def).slice(0, SUGGEST_LIMITS.source),
    settings: {
      band: settings.band,
      subject: settings.subject,
      keyUse: settings.keyUse,
      topic: settings.topic || "",
    },
    def: {
      characters: (def.characters || []).map((c) => ({
        id: c.id,
        name: c.name,
        role: Array.isArray(c.role) ? c.role[0] : "",
      })),
    },
    ...(code ? { code } : {}),
  };
}

/**
 * Ask the server for model suggestions.
 * @returns {Promise<{ ok: true, items } | { ok: false, reason: "offline" | "unauthorized" | "limited" | "failed" }>}
 */
export async function requestSuggestions(
  def,
  settings,
  { fetchImpl = (...a) => fetch(...a), key = "", klass = null } = {},
) {
  const headers = {
    "content-type": "application/json",
    ...(key ? { "x-teacher-key": key } : {}),
    ...(klass?.passcode ? { "x-class-teacher": klass.passcode } : {}),
  };
  let res;
  let data;
  try {
    res = await fetchImpl(SUGGEST_API, {
      method: "POST",
      headers,
      body: JSON.stringify(suggestBody(def, settings, klass?.code)),
    });
    data = await res.json().catch(() => null);
  } catch {
    return { ok: false, reason: "offline" };
  }
  if (res.status === 401) return { ok: false, reason: "unauthorized" };
  if (res.status === 429) return { ok: false, reason: "limited" };
  if (!res.ok || !data?.ok)
    return { ok: false, reason: data?.offline || res.status >= 500 ? "offline" : "failed" };
  // The server already checked every item; check again here with the same rules against the FULL source.
  const kept = acceptSuggestions(data, { source: sourceOf(def), characterIds: idsOf(def) });
  if (!kept) return { ok: false, reason: "failed" };
  return {
    ok: true,
    items: [
      ...kept.questions.map((q, n) => ({ ...q, kind: "question", origin: "ai", id: `q${n}` })),
      ...kept.lines.map((l, n) => ({ ...l, kind: "line", origin: "ai", id: `l${n}` })),
    ],
  };
}

/** The source sentence that best answers a question (by content-word overlap), with its index; null when none. */
export function bestSentence(def, text) {
  const sentences = sourceSentences(sourceOf(def));
  let best = null;
  sentences.forEach((s, i) => {
    // How much of the question the sentence covers, then how much of the sentence is about the question.
    const score = overlap(text, [s]) + overlap(s, [text]) / 2;
    if (score > 0 && (!best || score > best.score)) best = { text: s, from: [i], score };
  });
  return best;
}

/** The one editor operation that applies a suggestion. */
export function suggestionOp(def, item) {
  if (item.kind === "question") {
    const answer = bestSentence(def, `${item.ask} ${item.keywords.join(" ")}`);
    return {
      type: "topic.add",
      character: item.character,
      ask: item.ask,
      keywords: item.keywords,
      ...(answer ? { answer: answer.text, from: answer.from } : {}),
    };
  }
  const from = item.from || bestSentence(def, item.text)?.from;
  return {
    type: "topic.add",
    character: item.character,
    answer: item.text,
    keywords: keywordsOf(item.text),
    ...(from ? { from } : {}),
  };
}

const MODE_NOTE = {
  ai: [
    "Suggestions from the AI helper, checked against your text.",
    "Sugerencias del asistente de IA, revisadas contra su texto.",
  ],
  "built-in": ["Built-in suggestions only.", "Solo sugerencias integradas."],
};
const REASON = {
  offline: [
    "The AI helper is not available right now, so these are the builder's own suggestions.",
    "El asistente de IA no está disponible ahora; estas son las sugerencias propias del creador.",
  ],
  unauthorized: [
    "AI suggestions need the site key or a class on this device (Assign step). These are the builder's own suggestions.",
    "Las sugerencias de IA necesitan la clave del sitio o una clase en este dispositivo (paso Asignar). Estas son las sugerencias propias del creador.",
  ],
  limited: [
    "The AI helper has been asked too often for now. These are the builder's own suggestions.",
    "Se le ha pedido demasiado al asistente de IA por ahora. Estas son las sugerencias propias del creador.",
  ],
  failed: [
    "The AI helper's reply could not be used. These are the builder's own suggestions.",
    "No se pudo usar la respuesta del asistente de IA. Estas son las sugerencias propias del creador.",
  ],
};
export const suggestNote = (mode) => MODE_NOTE[mode] || MODE_NOTE["built-in"];

function itemHTML(I, def, item) {
  const who = def.characters.find((c) => c.id === item.character)?.name || item.character;
  return html`<li
    class="xb-suggest-item"
    data-xb-suggestion="${item.id}"
    data-xb-kind="${item.kind}"
  >
    <p class="fine">
      ${item.kind === "question" ? I.S(`A question learners could ask ${who}`, `Una pregunta que los estudiantes podrían hacerle a ${who}`) : I.S(`A line ${who} could say (from your text)`, `Algo que ${who} podría decir (de su texto)`)}
      · ${item.origin === "ai" ? I.S("AI helper", "Asistente de IA") : I.S("Built in", "Integrada")}
    </p>
    <p class="xb-suggest-text">${item.kind === "question" ? item.ask : item.text}</p>
    ${item.kind === "question" ? html`<p class="fine">${I.S("Words that lead to it", "Palabras que llevan a ella")}: ${item.keywords.join(", ")}</p>` : ""}
    <div class="row-actions">
      <button
        type="button"
        class="btn small"
        data-xb-act="suggest-accept"
        data-xb-arg="${JSON.stringify({ id: item.id })}"
      >
        ${I.S("Accept", "Aceptar")}
      </button>
      <button
        type="button"
        class="btn small ghost"
        data-xb-act="suggest-dismiss"
        data-xb-arg="${JSON.stringify({ id: item.id })}"
      >
        ${I.S("Dismiss", "Descartar")}
      </button>
    </div>
  </li>`;
}

/** The panel: the button, the status line and the open suggestions. `state` is ui.suggest. */
export function suggestHTML(I, def, state) {
  const s = state || {};
  return html`<section class="xb-suggest" aria-labelledby="xbSuggestH" data-xb-suggest>
    <h3 id="xbSuggestH">${I.T("Suggest improvements", "Sugerir mejoras")}</h3>
    <p class="fine">
      ${I.T("Ideas for more questions and answers, made only from your text. The AI helper (if available) receives your text, these settings and the characters' names, never anything about learners, and nothing is kept. Nothing changes until you press Accept.", "Ideas para más preguntas y respuestas, hechas solo con su texto. El asistente de IA (si está disponible) recibe su texto, estos ajustes y los nombres de los personajes, nunca nada sobre los estudiantes, y no se guarda nada. Nada cambia hasta que usted presione Aceptar.")}
    </p>
    <div class="row-actions">
      <button type="button" class="btn small" data-xb-act="suggest" ${s.busy ? "disabled" : ""}>
        ${s.busy ? I.T("Looking…", "Buscando…") : I.T("Suggest improvements", "Sugerir mejoras")}
      </button>
    </div>
    ${s.mode ? html`<p class="xb-status is-ok" role="status" data-xb-suggest-mode="${s.mode}">${I.S(...suggestNote(s.mode))}</p>` : ""}
    ${s.reason && REASON[s.reason] ? html`<p class="fine" data-xb-suggest-reason="${s.reason}">${I.S(...REASON[s.reason])}</p>` : ""}
    ${
      s.mode && !(s.items || []).length
        ? html`<p class="fine" data-xb-suggest-empty>
            ${I.T("No more suggestions right now.", "No hay más sugerencias por ahora.")}
          </p>`
        : ""
    }
    ${
      (s.items || []).length
        ? html`<ul class="xb-suggest-list">
            ${s.items.map((item) => itemHTML(I, def, item))}
          </ul>`
        : ""
    }
  </section>`;
}
