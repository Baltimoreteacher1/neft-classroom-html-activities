// Word Study — HTML for each tool panel. Pure: (state, data, I) → html``. The view owns state and events.
import { html, raw } from "../../util.js";
import {
  derivationsForGrade, displayForm, familiesForGrade, familyWords, gradeRank, kitsForGrade, partMeaning, partMinRank, surfaceOf,
} from "./model.js";

export const TOOLS = [
  { id: "build", from: "K", to: "8", en: "Build a Word", es: "Construye una palabra", dEn: "Tap word parts to build real words and see how the meaning is built.", dEs: "Toca partes de palabras para construir palabras reales y ver cómo se forma el significado." },
  { id: "apart", from: "1", to: "8", en: "Take It Apart", es: "Desarma la palabra", dEn: "Find the parts inside a word, or type a word to check.", dEs: "Encuentra las partes dentro de una palabra o escribe una palabra para revisarla." },
  { id: "predict", from: "2", to: "8", en: "Predict the Meaning", es: "Predice el significado", dEn: "Use the parts to work out what a word means.", dEs: "Usa las partes para deducir qué significa una palabra." },
  { id: "families", from: "3", to: "8", en: "Word Families", es: "Familias de palabras", dEn: "Words that share a root or base, and the look-alikes that do not.", dEs: "Palabras que comparten una raíz o base, y las parecidas que no la comparten." },
  { id: "studio", from: "K", to: "3", en: "Compound & Inflection Studio", es: "Taller de palabras compuestas y terminaciones", dEn: "Two words make one. Add -s, -ed, -ing, -er and -est the right way.", dEs: "Dos palabras forman una. Agrega -s, -ed, -ing, -er y -est de la manera correcta." },
  { id: "shifts", from: "3", to: "8", en: "Meaning Shifts", es: "Cambios de significado", dEn: "Look-alikes that are not word parts, and words where the parts only give a hint.", dEs: "Palabras parecidas que no son partes de palabras y palabras donde las partes solo dan una pista." },
  { id: "origins", from: "4", to: "8", en: "Origins", es: "Orígenes", dEn: "Where word parts come from: Latin, Greek and Old English.", dEs: "De dónde vienen las partes de palabras: latín, griego e inglés antiguo." },
];
export const toolAvailable = (tool, grade) => gradeRank(grade) >= gradeRank(tool.from) && gradeRank(grade) <= gradeRank(tool.to);
const TYPE_LABEL = { prefix: ["prefix", "prefijo"], suffix: ["suffix", "sufijo"], root: ["root", "raíz"], base: ["base word", "palabra base"] };
const typeName = (I, t) => I.S(...(TYPE_LABEL[t] || TYPE_LABEL.base));
const MARK = {
  right: raw('<svg class="ws-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12.5 4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'),
  miss: raw('<svg class="ws-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 22 12 12 21 2 12z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 8v5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="16" r="1.4" fill="currentColor"/></svg>'),
};

/** One chip for a segment: the letters as spelled, the part's name, and what it means. */
export const segmentChips = (I, segs) =>
  html`<ol class="ws-segs">
    ${segs.map(
      (s) => html`<li class="ws-seg" data-type="${s.type}">
        <span class="ws-seg-text">${s.text}</span>
        <span class="ws-seg-type">${typeName(I, s.type)}</span>
        <span class="ws-seg-mean">${s.meaning ? `“${s.meaning}”` : I.T("a word you know", "una palabra que conoces")}</span>
        ${s.origin ? html`<span class="ws-seg-origin">${I.T("from", "de")} ${s.origin}</span>` : ""}
      </li>`,
    )}
  </ol>`;

const hearButton = (I, word) =>
  html`<button type="button" class="btn ws-btn ws-hear" data-ws="hear" data-word="${word}" aria-label="${I.S(`Hear the word ${word}`, `Escuchar la palabra ${word}`)}">
    <svg viewBox="0 0 24 24" class="ws-ico" aria-hidden="true" focusable="false"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    <span>${I.T("Hear it", "Escúchala")}</span></button>`;

/** What a successful word looks like, anywhere in the lab. */
export function wordCard(I, a, { extra = "" } = {}) {
  return html`<article class="ws-card" aria-label="${a.word}">
    <header class="ws-card-head">
      <h3 class="ws-word">${a.word}</h3>
      ${a.pos ? html`<span class="ws-pos">${a.pos}</span>` : ""}
      ${hearButton(I, a.word)}
    </header>
    ${segmentChips(I, a.segments)}
    ${a.gloss ? html`<p class="ws-gloss"><strong>${I.T("Meaning:", "Significado:")}</strong> ${a.gloss}</p>` : ""}
    ${a.spell ? html`<p class="ws-spell"><strong>${I.T("Spelling:", "Ortografía:")}</strong> ${a.spell}</p>` : ""}
    ${a.transparent === false ? html`<p class="ws-note">${I.T("The parts give a hint, but the meaning is not just the parts added together.", "Las partes dan una pista, pero el significado no es solo la suma de las partes.")}${a.note ? html` ${a.note}` : ""}</p>` : ""}
    ${extra}
  </article>`;
}

// ── quiz widget ───────────────────────────────────────────────────────────────────────────────────────────────────
export function quizHTML(I, S, { prompt, hearWord = true }) {
  const it = S.item;
  if (!it) return html`<p class="ws-empty">${I.T("There are no more questions for this grade right now. Try another tool.", "No hay más preguntas para este grado por ahora. Prueba otra herramienta.")}</p>`;
  const solved = S.state === "solved";
  const gaveUp = S.state === "shown";
  return html`<section class="ws-quiz" aria-labelledby="wsPrompt">
    <p class="ws-prompt" id="wsPrompt">${prompt}</p>
    <p class="ws-stem"><strong>${it.stem}</strong> ${hearWord && it.word ? hearButton(I, it.word) : ""}</p>
    <ul class="ws-choices">
      ${it.choices.map((c) => {
        const miss = S.missed.includes(c.id);
        const right = (solved || gaveUp) && c.id === it.answer;
        const state = right ? "right" : miss ? "miss" : "";
        return html`<li><button type="button" class="btn ws-choice" data-ws="choose" data-id="${c.id}" data-state="${state}" ${miss || solved || gaveUp ? raw("aria-disabled=\"true\"") : ""} ${right ? raw("aria-current=\"true\"") : ""}>
          ${right ? MARK.right : miss ? MARK.miss : ""}<span class="ws-choice-text">${c.text}</span>
          ${right ? html`<span class="ws-choice-state">${I.T("Right answer", "Respuesta correcta")}</span>` : ""}${miss ? html`<span class="ws-choice-state">${I.T("Not this one", "Esta no")}</span>` : ""}</button></li>`;
      })}
    </ul>
    <div class="ws-feedback" role="status" aria-live="polite">${feedbackHTML(I, S)}</div>
    <p class="ws-actions">
      ${!solved && !gaveUp ? html`<button type="button" class="btn ws-btn" data-ws="hint">${I.T("Give me a hint", "Dame una pista")}</button>` : ""}
      ${!solved && !gaveUp && S.missed.length >= 2 ? html`<button type="button" class="btn ws-btn" data-ws="show">${I.T("Show me the answer", "Muéstrame la respuesta")}</button>` : ""}
      ${solved || gaveUp ? html`<button type="button" class="btn btn-primary ws-btn" data-ws="next">${I.T("Next one", "Siguiente")}</button>` : ""}
    </p>
  </section>`;
}
function feedbackHTML(I, S) {
  const it = S.item;
  if (!it) return "";
  if (S.state === "solved")
    return html`<p class="ws-fb ws-fb-right">${MARK.right}<span><strong>${I.T("Yes.", "Sí.")}</strong> ${it.explain}</span></p>`;
  if (S.state === "shown") return html`<p class="ws-fb ws-fb-info"><span>${it.explain}</span></p>`;
  return html`${S.missed.length ? html`<p class="ws-fb ws-fb-miss">${MARK.miss}<span>${I.T("Not yet. Look at the parts again and try another choice. There is no penalty for trying.", "Todavía no. Mira las partes otra vez y prueba otra opción. No hay penalización por intentar.")}</span></p>` : ""}${S.hintShown ? html`<p class="ws-fb ws-fb-info"><span><strong>${I.T("Hint:", "Pista:")}</strong> ${it.hint}</span></p>` : ""}`;
}

// ── Build a Word ──────────────────────────────────────────────────────────────────────────────────────────────────
export function buildPanel(I, S, idx) {
  const kits = S.kits;
  if (!kits.length) return html`<p class="ws-empty">${I.T("There are no word kits for this grade yet.", "Todavía no hay kits de palabras para este grado.")}</p>`;
  const roots = kits.filter((k) => k.anchor.startsWith("root."));
  const bases = kits.filter((k) => k.anchor.startsWith("base:"));
  const label = (k) => {
    const n = k.derivs.length;
    const word = k.anchor.startsWith("base:") ? k.anchor.slice(5) : `${displayForm(idx, k.anchor)} (${partMeaning(idx, k.anchor)})`;
    return `${word} · ${n}`;
  };
  const opt = (k) => html`<option value="${k.anchor}" ${k.anchor === S.anchor ? raw("selected") : ""}>${label(k)}</option>`;
  const kit = S.kit;
  const used = new Set(S.placed);
  const builtHere = kit ? kit.derivs.filter((d) => S.built.has(d.word)).length : 0;
  return html`<div class="ws-build">
    <p class="ws-lead">${I.T("Pick a base or root, then tap parts to put them in the workbench in order. Press Check to see whether your word is a real word.", "Elige una base o una raíz y toca partes para ponerlas en la mesa de trabajo en orden. Presiona Revisar para ver si tu palabra es real.")}</p>
    <p class="ws-field"><label for="wsKit">${I.T("Start with", "Empieza con")}</label>
      <select id="wsKit" class="ws-select" data-ws="kit">
        ${roots.length ? html`<optgroup label="${I.S("Roots", "Raíces")}">${roots.map(opt)}</optgroup>` : ""}
        ${bases.length ? html`<optgroup label="${I.S("Base words", "Palabras base")}">${bases.map(opt)}</optgroup>` : ""}
      </select></p>
    ${kit ? html`<p class="ws-count" role="status" aria-live="polite">${I.T(`Real words you have built with this kit: ${builtHere} of ${kit.derivs.length}`, `Palabras reales que has construido con este kit: ${builtHere} de ${kit.derivs.length}`)}</p>
    <div class="ws-tiles" role="group" aria-label="${I.S("Word parts", "Partes de palabras")}">
      ${kit.tiles.map((id) => {
        const base = id.startsWith("base:");
        const p = base ? null : idx.partById.get(id);
        const type = p ? p.type : "base";
        const pressed = used.has(id);
        return html`<button type="button" class="btn ws-tile" data-type="${type}" data-ws="tile" data-id="${id}" aria-pressed="${pressed}" ${pressed ? raw("aria-disabled=\"true\"") : ""}>
          <span class="ws-tile-kind">${typeName(I, type)}</span><span class="ws-tile-form">${displayForm(idx, id)}</span><span class="ws-tile-mean">${base ? "" : p.meaning}</span></button>`;
      })}
    </div>
    <div class="ws-bench" aria-label="${I.S("Your workbench", "Tu mesa de trabajo")}">
      <p class="ws-bench-label" id="wsBenchLabel">${I.T("Workbench", "Mesa de trabajo")}</p>
      ${S.placed.length ? html`<ol class="ws-placed" aria-labelledby="wsBenchLabel">${S.placed.map((id, i) => html`<li><button type="button" class="btn ws-placed-btn" data-type="${id.startsWith("base:") ? "base" : idx.partById.get(id).type}" data-ws="unplace" data-i="${i}" aria-label="${I.S(`Take ${displayForm(idx, id)} off the workbench`, `Quitar ${displayForm(idx, id)} de la mesa`)}">${displayForm(idx, id)}<span class="ws-x" aria-hidden="true">×</span></button></li>`)}</ol>` : html`<p class="ws-bench-empty">${I.T("Tap a part above to begin.", "Toca una parte arriba para empezar.")}</p>`}
    </div>
    <p class="ws-actions">
      <button type="button" class="btn btn-primary ws-btn" data-ws="check" ${S.placed.length < 2 ? raw("aria-disabled=\"true\"") : ""}>${I.T("Check my word", "Revisar mi palabra")}</button>
      <button type="button" class="btn ws-btn" data-ws="undo" ${S.placed.length ? "" : raw("aria-disabled=\"true\"")}>${I.T("Take the last part off", "Quitar la última parte")}</button>
      <button type="button" class="btn ws-btn" data-ws="clear" ${S.placed.length ? "" : raw("aria-disabled=\"true\"")}>${I.T("Clear", "Limpiar")}</button>
    </p>
    <div class="ws-result" role="status" aria-live="polite">${buildResult(I, S, idx)}</div>` : ""}
  </div>`;
}
function buildResult(I, S, idx) {
  const r = S.result;
  if (!r) return "";
  if (r.reason === "short") return html`<p class="ws-fb ws-fb-info"><span>${I.T("Put at least two parts on the workbench first.", "Primero pon al menos dos partes en la mesa de trabajo.")}</span></p>`;
  if (r.ok) {
    const d = r.derivation;
    const segs = d.parts.map((id, i) => ({ id, text: surfaceOf(idx, d)[i], type: id.startsWith("base:") ? "base" : idx.partById.get(id).type, meaning: partMeaning(idx, id), origin: "" }));
    return html`<p class="ws-fb ws-fb-right">${MARK.right}<span><strong>${I.T("That is a real word.", "Esa es una palabra real.")}</strong></span></p>
      ${wordCard(I, { word: d.word, pos: d.pos, segments: segs, gloss: d.gloss, spell: d.spell, transparent: d.transparent !== false, note: d.note })}`;
  }
  const near = r.nearby ? html` ${I.T("A nearby real word:", "Una palabra real cercana:")} <strong>${r.nearby.word}</strong> (${r.nearby.parts.map((id) => displayForm(idx, id)).join(" + ")}).` : "";
  if (r.reason === "order")
    return html`<p class="ws-fb ws-fb-info">${MARK.miss}<span>${I.T("These parts can make a real word, but not in this order. Think about where a prefix and a suffix go.", "Estas partes pueden formar una palabra real, pero no en este orden. Piensa en dónde van un prefijo y un sufijo.")}</span></p>`;
  return html`<p class="ws-fb ws-fb-info">${MARK.miss}<span>${I.T("That combination is not in my word list, so I cannot call it a word. It might still be a word I do not know about. Try a different mix.", "Esa combinación no está en mi lista de palabras, así que no puedo decir que sea una palabra. Aun así podría ser una palabra que no conozco. Prueba otra mezcla.")}${near}</span></p>`;
}

// ── Take It Apart ─────────────────────────────────────────────────────────────────────────────────────────────────
export function apartPanel(I, S, idx) {
  return html`<div class="ws-apart">
    ${quizHTML(I, S, { prompt: I.T("Which parts make this word?", "¿Qué partes forman esta palabra?") })}
    <section class="ws-try" aria-labelledby="wsTryH">
      <h3 id="wsTryH">${I.T("Try any word", "Prueba cualquier palabra")}</h3>
      <p class="ws-lead">${I.T("Type a word. I only take apart words I have checked, and I will say so when I am not sure.", "Escribe una palabra. Solo desarmo palabras que he revisado y te diré cuando no estoy seguro.")}</p>
      <p class="ws-field"><label for="wsWord">${I.T("Word", "Palabra")}</label>
        <input id="wsWord" class="ws-input" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="30" data-ws="word" value="${S.typed}">
        <button type="button" class="btn btn-primary ws-btn" data-ws="analyze">${I.T("Take it apart", "Desarmar")}</button></p>
      <div class="ws-result" role="status" aria-live="polite">${analysisHTML(I, S.analysis)}</div>
    </section>
  </div>`;
}
export function analysisHTML(I, a) {
  if (!a) return "";
  if (a.known) return wordCard(I, a);
  if (a.kind === "false-friend")
    return html`<article class="ws-card ws-card-warn"><h3 class="ws-word">${a.falseFriend.word}</h3>
      <p class="ws-fb ws-fb-info">${MARK.miss}<span><strong>${I.T("Careful: a look-alike.", "Cuidado: una palabra parecida.")}</strong> ${a.falseFriend.word} looks like ${a.falseFriend.lookalike.join(" + ")}, but it is not made of those parts. ${a.falseFriend.truth}</span></p></article>`;
  if (a.reason === "not-a-word") return html`<p class="ws-fb ws-fb-info"><span>${I.T("Type one word using letters only.", "Escribe una sola palabra usando solo letras.")}</span></p>`;
  return html`<p class="ws-fb ws-fb-info">${MARK.miss}<span>${I.T(`I am not sure about “${a.word}”. I only take apart words I have checked, and I would rather say so than guess. A dictionary or your teacher can help.`, `No estoy seguro de “${a.word}”. Solo desarmo palabras que he revisado y prefiero decirlo antes que adivinar. Un diccionario o tu docente pueden ayudarte.`)}</span></p>`;
}

// ── Word Families ─────────────────────────────────────────────────────────────────────────────────────────────────
export function familiesPanel(I, S, idx) {
  const fams = S.families;
  if (!fams.length) return html`<p class="ws-empty">${I.T("Word families start in Grade 3. Try Build a Word or Take It Apart for now.", "Las familias de palabras empiezan en 3.er grado. Por ahora prueba Construye una palabra o Desarma la palabra.")}</p>`;
  const fam = fams.find((f) => f.id === S.famId) || fams[0];
  const words = familyWords(idx, fam, S.grade);
  return html`<div class="ws-fams">
    <p class="ws-field"><label for="wsFam">${I.T("Choose a family", "Elige una familia")}</label>
      <select id="wsFam" class="ws-select" data-ws="fam">${fams.map((f) => html`<option value="${f.id}" ${f.id === fam.id ? raw("selected") : ""}>${f.root} — ${f.meaning}</option>`)}</select></p>
    <section class="ws-fam" aria-labelledby="wsFamH"><h3 id="wsFamH">${fam.root} <span class="ws-fam-mean">“${fam.meaning}”</span></h3>
      <ul class="ws-famlist">${words.map((w) => {
        const d = idx.derivByWord.get(w.toLowerCase())[0];
        return html`<li><strong>${w}</strong> <span class="ws-famparts">${surfaceOf(idx, d).join(" + ")}</span> <span class="ws-famgloss">${d.gloss}</span></li>`;
      })}</ul></section>
    ${quizHTML(I, S, { prompt: I.T("Check yourself: does the word belong to the family?", "Compruébalo: ¿la palabra pertenece a la familia?") })}
  </div>`;
}

// ── Predict the Meaning ───────────────────────────────────────────────────────────────────────────────────────────
export function predictPanel(I, S, idx) {
  const it = S.item;
  const parts = it ? html`<p class="ws-parts-line">${it.parts.map((id, i) => html`<span class="ws-part-pill" data-type="${id.startsWith("base:") ? "base" : idx.partById.get(id).type}">${surfaceOf(idx, it.derivation)[i]}</span>`)}</p>` : "";
  return html`<div class="ws-predict">${parts}${quizHTML(I, S, { prompt: I.T("What does this word most likely mean?", "¿Qué significa más probablemente esta palabra?") })}</div>`;
}

// ── Compound & Inflection Studio ──────────────────────────────────────────────────────────────────────────────────
export const STUDIO_MODES = [
  { id: "compound", en: "Compound words", es: "Palabras compuestas" },
  { id: "plural", en: "More than one", es: "Más de uno" },
  { id: "past", en: "-ed (past)", es: "-ed (pasado)" },
  { id: "now", en: "-ing (now)", es: "-ing (ahora)" },
  { id: "compare", en: "-er and -est", es: "-er y -est" },
];
export function studioPanel(I, S, idx) {
  const rules = S.mode === "compound" ? [] : idx.data.inflections.filter((r) => r.kind === S.mode);
  return html`<div class="ws-studio">
    <div class="ws-modes" role="group" aria-label="${I.S("What to practice", "Qué practicar")}">${STUDIO_MODES.map((m) => html`<button type="button" class="btn ws-mode" data-ws="mode" data-id="${m.id}" aria-pressed="${m.id === S.mode}">${I.T(m.en, m.es)}</button>`)}</div>
    ${quizHTML(I, S, { prompt: S.mode === "compound" ? I.T("Make or take apart a compound word.", "Forma o separa una palabra compuesta.") : I.T("Choose the correct spelling.", "Elige la ortografía correcta.") })}
    ${rules.length ? html`<details class="ws-rules"><summary>${I.T("The rules", "Las reglas")}</summary><ul>${rules.map((r) => html`<li>${r.rule} <span class="ws-ex">${r.examples.slice(0, 3).map((e) => `${e.base} → ${e.form}`).join(", ")}</span></li>`)}</ul></details>` : ""}
  </div>`;
}

// ── Meaning Shifts ────────────────────────────────────────────────────────────────────────────────────────────────
export function shiftsPanel(I, S, idx) {
  const hints = derivationsForGrade(idx, S.grade).filter((d) => d.transparent === false);
  const shown = hints.slice(0, 12);
  return html`<div class="ws-shifts">
    ${quizHTML(I, S, { prompt: I.T("Is this split made of real word parts?", "¿Esta división está hecha de partes de palabras reales?") })}
    <section class="ws-hints" aria-labelledby="wsHintsH"><h3 id="wsHintsH">${I.T("When the parts only give a hint", "Cuando las partes solo dan una pista")}</h3>
      <p class="ws-lead">${I.T("These words really are built from parts, but the meaning drifted. Use the parts as a clue, then check the meaning.", "Estas palabras sí están formadas por partes, pero el significado cambió. Usa las partes como pista y luego revisa el significado.")}</p>
      <ul class="ws-famlist">${shown.map((d) => html`<li><strong>${d.word}</strong> <span class="ws-famparts">${surfaceOf(idx, d).join(" + ")}</span> <span class="ws-famgloss">${d.gloss}</span></li>`)}</ul></section>
  </div>`;
}

// ── Origins ───────────────────────────────────────────────────────────────────────────────────────────────────────
export function originsPanel(I, S, idx) {
  const sure = idx.parts.filter((p) => p.origin_certain && !p.variantOf && partMinRank(p) <= gradeRank(S.grade));
  const shown = sure.slice(0, 30);
  return html`<div class="ws-origins">
    ${quizHTML(I, S, { prompt: I.T("Which language does this word part come from?", "¿De qué idioma viene esta parte de la palabra?"), hearWord: false })}
    <section class="ws-hints" aria-labelledby="wsOrigH"><h3 id="wsOrigH">${I.T("Origins we are sure about", "Orígenes de los que estamos seguros")}</h3>
      <p class="ws-lead">${I.T("We list an origin only when it is well documented. Some word parts are not shown because their history is less clear.", "Mostramos un origen solo cuando está bien documentado. Algunas partes no aparecen porque su historia es menos clara.")}</p>
      <ul class="ws-famlist">${shown.map((p) => html`<li><strong>${p.form}</strong> <span class="ws-famparts">“${p.meaning}”</span> <span class="ws-famgloss">${p.origin}</span></li>`)}</ul></section>
  </div>`;
}
export const kitsFor = (idx, g) => {
  const k = kitsForGrade(idx, g, gradeRank(g) >= 3 ? 3 : 2);
  return k.length ? k : kitsForGrade(idx, g, 2);
};
export const familiesFor = (idx, g) => familiesForGrade(idx, g).filter((f) => familyWords(idx, f, g).length >= 5);
