// Word Architect — a Word Study Lab tool (/vocabulary-academy/word-study/architect). Build a word from a prefix, a
// root and a suffix; the meaning, part of speech and Spanish update as the structure changes. Then fit the word into a
// grammar slot, use it in a sentence (ungraded) and work out an unfamiliar word from its parts.
// Content: architect-data.js. Pure logic: architect-model.js. Progress: one localStorage key (ARCH_KEY).
import { html, raw, safeJson, storage } from "../../util.js";
import { AFFIXES, FRAMES, POS, ROOTS, SLOT_ADJ, SLOT_NOUN, VERB_CUE } from "./architect-data.js";
import { ARCH_KEY, classify, normalizeProgress, pieces, posList, rootById, spellingRule } from "./architect-model.js";

const A = {
  progress: null,
  root: "",
  p: "",
  s: "",
  snap: "", // which slot just changed, for the snap animation
  prev: null, // the last real word built, to show how the part of speech shifted
  slot: null, // { word, tried: { noun|verb|adjective: "right"|"miss" } }
  drafts: {},
  savedNote: "",
  tf: { root: "", missed: [], solved: false },
};

function load() {
  if (A.progress) return A.progress;
  let stored = null;
  try {
    stored = safeJson(storage.get(ARCH_KEY), null);
  } catch {
    stored = null;
  }
  A.progress = normalizeProgress(stored);
  A.root ||= A.progress.root;
  return A.progress;
}
function save() {
  try {
    A.progress.root = A.root;
    storage.set(ARCH_KEY, JSON.stringify(A.progress));
  } catch {
    // storage blocked or full: the page keeps working for this visit
  }
}
/** Add a word to a saved list. True when it was not there before. */
const remember = (bucket, rootId, word) => {
  const list = A.progress[bucket][rootId] || [];
  if (list.includes(word)) return false;
  A.progress[bucket][rootId] = [...list, word];
  return true;
};

const MARK = {
  right: raw(
    '<svg class="wa-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12.5 4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ),
  miss: raw(
    '<svg class="wa-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 22 12 12 21 2 12z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 8v5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="16" r="1.4" fill="currentColor"/></svg>',
  ),
  find: raw(
    '<svg class="wa-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="m15 15 5.5 5.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  ),
  hear: raw(
    '<svg viewBox="0 0 24 24" class="wa-ico" aria-hidden="true" focusable="false"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  ),
};
const posName = (I, pos) => I.T(POS[pos].en, POS[pos].es);
const KIND = {
  prefix: ["prefix", "prefijo"],
  root: ["root", "raíz"],
  suffix: ["suffix", "sufijo"],
};
const hear = (I, word) =>
  html`<button
    type="button"
    class="btn wa-btn wa-hear"
    data-ws="hear"
    data-word="${word}"
    aria-label="${I.S(`Hear the word ${word}`, `Escuchar la palabra ${word}`)}"
  >
    ${MARK.hear}<span>${I.T("Hear it", "Escúchala")}</span>
  </button>`;

// ── pieces of the page ────────────────────────────────────────────────────────────────────────────────────────────
function rootPicker(I, prog) {
  return html`<div
    class="wa-roots"
    role="group"
    aria-label="${I.S("Choose a root", "Elige una raíz")}"
  >
    ${ROOTS.map((r) => {
      const n = (prog.built[r.id] || []).length;
      return html`<button
        type="button"
        class="btn wa-root"
        data-ws="arch-root"
        data-id="${r.id}"
        aria-pressed="${r.id === A.root}"
      >
        <span class="wa-root-form">${r.form}</span
        ><span class="wa-root-mean">${I.TARGET(`“${r.mean.en}”`, `“${r.mean.es}”`)}</span>
        <span class="wa-root-count"
          >${I.T(`${n} of ${r.words.length} built`, `${n} de ${r.words.length} construidas`)}</span
        >
      </button>`;
    })}
  </div>`;
}
function tray(I, root, kind) {
  const ids = kind === "prefix" ? root.prefixes : root.suffixes;
  const current = kind === "prefix" ? A.p : A.s;
  const label =
    kind === "prefix"
      ? I.T("Prefixes go in front", "Los prefijos van delante")
      : I.T("Suffixes go at the end", "Los sufijos van al final");
  return html`<div
    class="wa-tray"
    data-kind="${kind}"
    role="group"
    aria-labelledby="waTray-${kind}"
  >
    <p class="wa-tray-h" id="waTray-${kind}">${label}</p>
    <div class="wa-tray-tiles">
      ${ids.map((id) => {
        const a = AFFIXES[id];
        const on = current === id;
        return html`<button
          type="button"
          class="btn wa-tile"
          data-type="${kind}"
          data-ws="arch-tile"
          data-kind="${kind}"
          data-id="${id}"
          aria-pressed="${on}"
          aria-label="${on ? I.S(`${a.form}, ${a.mean.en}. In the word. Press to take it off.`, `${a.form}, ${a.mean.es}. En la palabra. Presiona para quitarlo.`) : I.S(`${a.form}, ${a.mean.en}. Press to add it.`, `${a.form}, ${a.mean.es}. Presiona para agregarlo.`)}"
        >
          <span class="wa-tile-form">${a.form}</span
          ><span class="wa-tile-mean">${I.TARGET(a.mean.en, a.mean.es)}</span>
          ${a.makes ? html`<span class="wa-tile-makes">${I.T(`makes ${POS[a.makes].a}`, `forma un ${POS[a.makes].es}`)}</span>` : ""}
          ${on ? html`<span class="wa-tile-on" aria-hidden="true">${I.T("in the word", "en la palabra")}</span>` : ""}
        </button>`;
      })}
    </div>
  </div>`;
}
function assembled(I, root) {
  const parts = pieces(root, A.p, A.s);
  const segMean = (x) => (x.kind === "root" ? root.mean : AFFIXES[x.id].mean);
  return html`<div class="wa-build" aria-hidden="true">
      <p class="wa-word" style="--len:${Math.max(6, parts.reduce((n, x) => n + x.text.length, 0))}">
        ${parts.map((x, i) => html`${i ? html`<span class="wa-join"></span>` : ""}<span class="wa-seg ${A.snap === x.kind ? "is-new" : ""}" data-type="${x.kind}"><span class="wa-seg-text">${x.text}</span><span class="wa-seg-mean">${segMean(x).en}${I.mode !== "en" ? html`<span class="wa-seg-es" lang="es">${segMean(x).es}</span>` : ""}</span></span>`)}
      </p>
    </div>
    <p class="visually-hidden">
      ${I.T("Your word:", "Tu palabra:")} ${parts.map((x) => x.text).join(" + ")}
    </p>
    <p class="wa-bench-actions">
      ${A.p ? html`<button type="button" class="btn wa-btn" data-ws="arch-off" data-kind="prefix">${I.T(`Take off ${AFFIXES[A.p].form}`, `Quitar ${AFFIXES[A.p].form}`)}</button>` : ""}
      ${A.s ? html`<button type="button" class="btn wa-btn" data-ws="arch-off" data-kind="suffix">${I.T(`Take off ${AFFIXES[A.s].form}`, `Quitar ${AFFIXES[A.s].form}`)}</button>` : ""}
    </p>`;
}

function shiftLine(I, entry) {
  const prev = A.prev;
  if (!prev || prev.word === entry.word || prev.root !== A.root) return "";
  const suf = AFFIXES[entry.s];
  const changed = prev.pos !== entry.pos;
  const why =
    changed && suf?.makes === entry.pos
      ? I.T(
          ` The suffix ${suf.form} made it ${POS[entry.pos].a}.`,
          ` El sufijo ${suf.form} la convirtió en ${POS[entry.pos].es}.`,
        )
      : "";
  return html`<p class="wa-shift" data-changed="${changed}">
    <span class="wa-shift-from"
      ><strong>${prev.word}</strong> <em>${posName(I, prev.pos)}</em></span
    >
    <span class="wa-shift-arrow" aria-hidden="true">→</span
    ><span class="visually-hidden">${I.T("became", "se convirtió en")}</span>
    <span class="wa-shift-to"
      ><strong>${entry.word}</strong> <em>${posName(I, entry.pos)}</em></span
    >
    <span class="wa-shift-why"
      >${changed ? I.T("The part of speech changed.", "Cambió la categoría gramatical.") : I.T("Same part of speech, new meaning.", "Misma categoría gramatical, nuevo significado.")}${why}</span
    >
  </p>`;
}
function entryCard(I, root, entry) {
  const parts = pieces(root, entry.p, entry.s);
  return html`<article class="wa-entry" aria-labelledby="waHead">
    <header class="wa-entry-head">
      <h3 class="wa-headword" id="waHead" lang="en">
        ${parts.map((x, i) => html`${i ? html`<span class="wa-dot" aria-hidden="true">|</span>` : ""}<span data-type="${x.kind}">${x.text}</span>`)}<span
          class="visually-hidden"
        >
          (${entry.word})</span
        >
      </h3>
      <span class="wa-pos"
        >${posName(I, entry.pos)}${entry.also ? html`<span class="wa-pos-also">${I.T(` · also ${entry.also.map((p) => POS[p].a).join(", ")}`, ` · también ${entry.also.map((p) => POS[p].es).join(", ")}`)}</span>` : ""}</span
      >
      ${hear(I, entry.word)}
    </header>
    ${shiftLine(I, entry)}
    <dl class="wa-defs">
      <div>
        <dt>${I.T("Meaning", "Significado")}</dt>
        <dd class="wa-def">${I.TARGET(entry.def.en, entry.def.es)}</dd>
      </div>
      <div>
        <dt>${I.T("Built from", "Formada con")}</dt>
        <dd>${I.TARGET(entry.how.en, entry.how.es)}</dd>
      </div>
      <div>
        <dt>${I.T("Example", "Ejemplo")}</dt>
        <dd class="wa-ex">${I.TARGET(entry.ex.en, entry.ex.es)}</dd>
      </div>
      ${spellingRule(root, entry.p) ? html`<div><dt>${I.T("Spelling", "Ortografía")}</dt><dd>${I.T(spellingRule(root, entry.p).note.en, spellingRule(root, entry.p).note.es)}</dd></div>` : ""}
      <div class="wa-es-row">
        <dt>${I.T("In Spanish", "En español")}</dt>
        <dd>
          <span lang="es" class="wa-es-word">${entry.es.word}</span>
          <span class="wa-cog" data-cognate="${entry.es.cognate}"
            >${entry.es.cognate ? I.T("Cognate: looks and means almost the same", "Cognado: se parece y significa casi lo mismo") : I.T("Not a cognate", "No es un cognado")}</span
          >
          ${entry.es.note ? html`<span class="wa-es-note">${I.T(entry.es.note.en, entry.es.note.es)}</span>` : ""}
        </dd>
      </div>
    </dl>
  </article>`;
}
function result(I, root) {
  const r = classify(root, A.p, A.s);
  const plus = pieces(root, A.p, A.s)
    .map((x) => x.text)
    .join(" + ");
  if (r.kind === "word") return entryCard(I, root, r.entry);
  if (r.kind === "nonword")
    return html`<article class="wa-note" data-kind="nonword">
      <p class="wa-note-h">
        ${MARK.find}<strong>${I.T("A discovery:", "Un descubrimiento:")}</strong>
        <span lang="en">${plus}</span>
        ${I.T("is not an English word.", "no es una palabra en inglés.")}
      </p>
      <p>${I.T(r.entry.why.en, r.entry.why.es)}</p>
      <p class="wa-note-quiet">
        ${I.T("Finding out what is not a word is part of how word parts work. Try another part.", "Descubrir lo que no es una palabra es parte de cómo funcionan las partes. Prueba otra parte.")}
      </p>
    </article>`;
  if (r.kind === "rare")
    return html`<article class="wa-note" data-kind="rare">
      <p class="wa-note-h">
        ${MARK.find}<strong lang="en">${r.word}</strong>
        ${I.T("is a rare word.", "es una palabra poco común.")}
      </p>
      <p>${I.T(r.entry.why.en, r.entry.why.es)}</p>
    </article>`;
  if (r.kind === "root")
    return html`<article class="wa-note" data-kind="root">
      <p class="wa-note-h">
        <strong lang="en">${root.form}</strong> <span>${I.T("is a root", "es una raíz")}</span>
      </p>
      <p>${I.T(r.entry.why.en, r.entry.why.es)}</p>
    </article>`;
  return html`<article class="wa-note" data-kind="unlisted">
    <p>
      ${I.T("I do not have this combination in my list, so I will not guess.", "No tengo esta combinación en mi lista, así que no voy a adivinar.")}
    </p>
  </article>`;
}

function slotsSection(I, root, entry) {
  const tried = A.slot?.word === entry.word ? A.slot.tried : {};
  const rows = [
    { pos: "verb", frame: root.verbSlot, cue: VERB_CUE },
    { pos: "noun", frame: SLOT_NOUN, cue: SLOT_NOUN.cue },
    { pos: "adjective", frame: SLOT_ADJ, cue: SLOT_ADJ.cue },
  ];
  const fits = posList(entry);
  const show = (frame, word) => {
    const [a, b] = frame.en.split("___");
    return html`<span lang="en"
      >${a}<span class="wa-blank">${word || raw("&#8203;")}</span>${b}</span
    >`;
  };
  return html`<section class="wa-slots" aria-labelledby="waSlotsH">
    <h3 id="waSlotsH">${I.T("Where does it fit?", "¿Dónde encaja?")}</h3>
    <p class="wa-lead">
      ${I.T(`Each sentence has a slot that only takes one part of speech. Put “${entry.word}” where it fits.`, `Cada oración tiene un espacio que solo acepta una categoría gramatical. Pon “${entry.word}” donde encaje.`)}
    </p>
    <ol class="wa-slot-list">
      ${rows.map((row) => {
        const state = tried[row.pos] || "";
        return html`<li class="wa-slot" data-state="${state}">
          <p class="wa-slot-sent">${show(row.frame, state === "right" ? entry.word : "")}</p>
          <p class="wa-slot-tag">
            ${I.T(`Slot for ${POS[row.pos].a}`, `Espacio para un ${POS[row.pos].es}`)}
          </p>
          ${state === "" ? html`<button type="button" class="btn wa-btn" data-ws="arch-slot" data-pos="${row.pos}">${I.T(`Put “${entry.word}” here`, `Poner “${entry.word}” aquí`)}</button>` : ""}
          ${
            state === "right"
              ? html`<p class="wa-fb" tabindex="-1" data-tone="right">
                  ${MARK.right}<span
                    ><strong>${I.T("It fits.", "Encaja.")}</strong>
                    ${I.T(`${entry.word} is ${POS[row.pos].a}. ${row.cue.en}`, `${entry.word} es un ${POS[row.pos].es}. ${row.cue.es}`)}</span
                  >
                </p>`
              : ""
          }
          ${
            state === "miss"
              ? html`<p class="wa-fb" tabindex="-1" data-tone="miss">
                  ${MARK.miss}<span
                    ><strong>${I.T("Not this slot.", "Este espacio no.")}</strong>
                    ${I.T(`${row.cue.en} ${entry.word} is ${fits.map((p) => POS[p].a).join(" or ")}.`, `${row.cue.es} ${entry.word} es un ${fits.map((p) => POS[p].es).join(" o ")}.`)}</span
                  >
                </p>`
              : ""
          }
        </li>`;
      })}
    </ol>
  </section>`;
}

function frameSection(I, entry) {
  const f = FRAMES[entry.pos];
  const starter = f.en.replace("___", entry.word);
  const saved = A.progress.sentences[entry.word] || "";
  const value = A.drafts[entry.word] ?? (saved || `${starter} `);
  return html`<section class="wa-use" aria-labelledby="waUseH">
    <h3 id="waUseH">${I.T("Use your word", "Usa tu palabra")}</h3>
    <p class="wa-lead">
      ${I.T("Finish the sentence in your own words. This is not graded.", "Termina la oración con tus propias palabras. Esto no se califica.")}
    </p>
    <label class="wa-use-label" for="waDraft"
      >${I.T("Sentence starter:", "Inicio de la oración:")}
      <span lang="en">${starter} …</span
      >${I.spanish || I.bilingual ? html` <span lang="es" class="wa-use-es">(${f.es.replace("___", entry.es.word.split(",")[0])} …)</span>` : ""}</label
    >
    <textarea
      id="waDraft"
      class="wa-draft"
      rows="3"
      maxlength="400"
      lang="en"
      data-ws="arch-draft"
      data-word="${entry.word}"
    >
${value}</textarea>
    <p class="wa-actions">
      <button
        type="button"
        class="btn btn-primary wa-btn"
        data-ws="arch-save"
        data-word="${entry.word}"
      >
        ${I.T("Save my sentence", "Guardar mi oración")}
      </button>
      <span class="wa-saved" role="status"
        >${A.savedNote === entry.word ? I.T("Saved on this device.", "Guardada en este dispositivo.") : ""}</span
      >
    </p>
  </section>`;
}

function transferSection(I, root) {
  const t = root.transfer;
  if (A.tf.root !== root.id)
    A.tf = { root: root.id, missed: [], solved: Boolean(A.progress.transfer[root.id]) };
  const solved = A.tf.solved;
  return html`<section class="wa-transfer" aria-labelledby="waTfH">
    <h3 id="waTfH">${I.T("Meaning from parts", "Significado a partir de las partes")}</h3>
    <p class="wa-lead">
      ${I.T("Here is a word you may not know. Use its parts to work out what it means.", "Esta es una palabra que quizás no conoces. Usa sus partes para descubrir qué significa.")}
    </p>
    <p class="wa-tf-word" lang="en"><strong>${t.word}</strong> ${hear(I, t.word)}</p>
    <ol class="wa-tf-parts">
      ${t.parts.map((p) => html`<li data-type="${p.type}"><span class="wa-tf-form" lang="en">${p.form}</span><span class="wa-tf-kind">${I.T(KIND[p.type][0], KIND[p.type][1])}</span><span class="wa-tf-mean">${I.TARGET(p.mean.en, p.mean.es)}</span></li>`)}
    </ol>
    <ul class="wa-tf-choices">
      ${t.choices.map((c) => {
        const miss = A.tf.missed.includes(c.id);
        const right = solved && c.id === t.answer;
        const dead = miss || solved;
        return html`<li>
          <button
            type="button"
            class="btn wa-choice"
            data-ws="arch-choose"
            data-id="${c.id}"
            data-state="${right ? "right" : miss ? "miss" : ""}"
            ${dead ? raw('aria-disabled="true"') : ""}
          >
            ${right ? MARK.right : miss ? MARK.miss : ""}<span>${I.TARGET(c.en, c.es)}</span>${right ? html`<span class="wa-choice-state">${I.T("Right", "Correcto")}</span>` : miss ? html`<span class="wa-choice-state">${I.T("Not this one", "Esta no")}</span>` : ""}
          </button>
        </li>`;
      })}
    </ul>
    <div class="wa-tf-fb">
      ${
        solved
          ? html`<p class="wa-fb" tabindex="-1" data-tone="right">
              ${MARK.right}<span
                ><strong>${I.T("Yes.", "Sí.")}</strong>
                ${I.T(`The parts add up: ${t.parts.map((p) => `${p.form} (${p.mean.en})`).join(" + ")}. In Spanish: ${t.es}.`, `Las partes se suman: ${t.parts.map((p) => `${p.form} (${p.mean.es})`).join(" + ")}. En español: ${t.es}.`)}</span
              >
            </p>`
          : A.tf.missed.length
            ? html`<p class="wa-fb" tabindex="-1" data-tone="miss">
                ${MARK.miss}<span
                  >${I.T("Not yet. Read the meaning of each part again, then try another choice. There is no penalty for trying.", "Todavía no. Lee otra vez el significado de cada parte y prueba otra opción. No hay penalización por intentar.")}</span
                >
              </p>`
            : ""
      }
    </div>
  </section>`;
}

function blueprint(I, root) {
  const built = A.progress.built[root.id] || [];
  const found = A.progress.found[root.id] || [];
  return html`<section class="wa-blueprint" aria-labelledby="waBpH">
    <h3 id="waBpH">
      ${I.T(`Words built with ${root.form}`, `Palabras construidas con ${root.form}`)}:
      <span class="wa-num">${built.length} / ${root.words.length}</span>
    </h3>
    <ul class="wa-bp-list">
      ${root.words.map((e) => {
        const has = built.includes(e.word);
        return html`<li data-built="${has}" lang="en">
          ${has ? e.word : html`<span class="wa-bp-blank">${"_".repeat(Math.min(e.word.length, 8))}</span><span class="visually-hidden">${I.T("not built yet", "aún no construida")}</span>`}
          <span class="wa-bp-pos">${posName(I, e.pos)}</span>
        </li>`;
      })}
    </ul>
    ${found.length ? html`<p class="wa-bp-found">${I.T("Discoveries (not words):", "Descubrimientos (no son palabras):")} <span lang="en">${found.join(", ")}</span></p>` : ""}
  </section>`;
}

/** The whole tool panel. */
export function architectPanel(I) {
  const prog = load();
  const root = rootById(A.root) || ROOTS[0];
  A.root = root.id;
  const r = classify(root, A.p, A.s);
  const html_ = html`<div class="wa" data-wa-root>
    <p class="ws-lead">
      ${I.T("Pick a root. Add a prefix in front or a suffix at the end, and watch the meaning and the part of speech change.", "Elige una raíz. Agrega un prefijo delante o un sufijo al final y mira cómo cambian el significado y la categoría gramatical.")}
    </p>
    ${rootPicker(I, prog)}
    <div class="wa-bench">
      ${tray(I, root, "prefix")}
      <div class="wa-stage">${assembled(I, root)}</div>
      ${tray(I, root, "suffix")}
    </div>
    <div class="wa-result" data-kind="${r.kind}">${result(I, root)}</div>
    ${r.kind === "word" ? slotsSection(I, root, r.entry) : ""}
    ${r.kind === "word" ? frameSection(I, r.entry) : ""} ${blueprint(I, root)}
    ${transferSection(I, root)}
  </div>`;
  A.snap = "";
  return html_;
}

/** Spoken summary of the current build, for the polite live region. */
function summary(I, root) {
  const r = classify(root, A.p, A.s);
  if (r.kind === "word")
    return I.S(
      `${r.word}: ${POS[r.entry.pos].en}. ${r.entry.def.en}.`,
      `${r.word}: ${POS[r.entry.pos].es}. ${r.entry.def.es}.`,
    );
  if (r.kind === "nonword")
    return I.S(
      `${r.word} is not an English word. ${r.entry.why.en}`,
      `${r.word} no es una palabra en inglés. ${r.entry.why.es}`,
    );
  if (r.kind === "rare")
    return I.S(
      `${r.word} is a rare word. ${r.entry.why.en}`,
      `${r.word} es una palabra poco común. ${r.entry.why.es}`,
    );
  if (r.kind === "root") return I.S(r.entry.why.en, r.entry.why.es);
  return "";
}
function afterBuild(root) {
  const r = classify(root, A.p, A.s);
  const first = r.kind === "word" ? remember("built", root.id, r.word) : false;
  if (r.kind === "nonword") remember("found", root.id, r.word);
  save();
  return { ...r, first };
}
function noteWord(root) {
  const r = classify(root, A.p, A.s);
  if (r.kind === "word") A.prev = { word: r.word, pos: r.entry.pos, root: root.id };
}

/**
 * Handle one Word Architect action. Returns { focus?, say?, recordWord?, ok? } for the host view, which repaints.
 * `el` is the clicked element (data-ws="arch-*").
 */
export function architectAction(I, act, el, host) {
  load();
  const root = rootById(A.root) || ROOTS[0];
  const draft = host?.querySelector?.("#waDraft");
  if (draft) A.drafts[draft.dataset.word] = draft.value;
  switch (act) {
    case "arch-root": {
      noteWord(root);
      A.root = el.dataset.id;
      A.p = "";
      A.s = "";
      A.prev = null;
      A.snap = "root";
      A.savedNote = "";
      save();
      const next = rootById(A.root);
      afterBuild(next);
      return {
        focus: `.wa-root[data-id="${A.root}"]`,
        say:
          I.S(`Root ${next.form}: ${next.mean.en}.`, `Raíz ${next.form}: ${next.mean.es}.`) +
          " " +
          summary(I, next),
      };
    }
    case "arch-tile":
    case "arch-off": {
      noteWord(root);
      const kind = el.dataset.kind;
      const id = act === "arch-off" ? "" : el.dataset.id;
      if (kind === "prefix") A.p = A.p === id ? "" : id;
      else A.s = A.s === id ? "" : id;
      A.snap = (kind === "prefix" ? A.p : A.s) ? kind : "root";
      A.savedNote = "";
      const r = afterBuild(root);
      const focus =
        act === "arch-off"
          ? `.wa-tile[data-kind="${kind}"]`
          : `.wa-tile[data-id="${el.dataset.id}"][data-kind="${kind}"]`;
      return { focus, say: summary(I, root), recordWord: r.first ? r.word : "" };
    }
    case "arch-slot": {
      const r = classify(root, A.p, A.s);
      if (r.kind !== "word") return {};
      if (A.slot?.word !== r.word) A.slot = { word: r.word, tried: {} };
      const pos = el.dataset.pos;
      const ok = posList(r.entry).includes(pos);
      A.slot.tried[pos] = ok ? "right" : "miss";
      return {
        focus: `.wa-slot:nth-child(${["verb", "noun", "adjective"].indexOf(pos) + 1}) .wa-fb`,
        say: ok
          ? I.S(
              `It fits. ${r.word} is ${POS[pos].a}.`,
              `Encaja. ${r.word} es un ${POS[pos].es}.`,
            )
          : I.S(
              `Not this slot. This slot needs ${POS[pos].a}.`,
              `Este espacio no. Este espacio necesita un ${POS[pos].es}.`,
            ),
      };
    }
    case "arch-save": {
      const word = el.dataset.word;
      const text = String(A.drafts[word] ?? "")
        .trim()
        .slice(0, 400);
      if (text) A.progress.sentences[word] = text;
      A.savedNote = word;
      save();
      return {
        focus: "#waDraft",
        say: I.S("Saved on this device.", "Guardada en este dispositivo."),
      };
    }
    case "arch-choose": {
      const t = root.transfer;
      const id = el.dataset.id;
      if (A.tf.solved || A.tf.missed.includes(id)) return {};
      if (id === t.answer) {
        A.tf.solved = true;
        A.progress.transfer[root.id] = true;
        save();
        return {
          focus: ".wa-tf-fb .wa-fb",
          say: I.S("Yes. That is right.", "Sí. Es correcto."),
          recordWord: t.word,
          ok: A.tf.missed.length === 0,
        };
      }
      A.tf.missed.push(id);
      return {
        focus: `.wa-choice[data-id="${id}"]`,
        say: I.S("Not yet. Try another choice.", "Todavía no. Prueba otra opción."),
      };
    }
    default:
      return {};
  }
}
/** Keep typed text across repaints (language switch, other clicks). */
export function architectInput(el) {
  if (el?.dataset?.ws === "arch-draft") A.drafts[el.dataset.word] = el.value;
}
