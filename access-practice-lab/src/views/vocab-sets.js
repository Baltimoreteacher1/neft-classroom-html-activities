// Vocabulary Sets (/vocab-sets): a teacher pastes or types a word list (word | meaning | example | translation),
// saves it on this device, and practices it as flashcards, match, finish-the-sentence, a quiz, or big cards for the
// class. A set can be shared as a link (the whole set rides in the link, so students need no account) or as a file,
// and printed as cards, a review sheet and an answer key. Sets stay on this device; nothing is sent anywhere.
// Rules and tests: src/vocab-sets/model.js, tools/vocab-sets.test.mjs. Practice modes: src/vocab-sets/practice.js.
import { activeTeacherClasses, syncVocabSets } from "../class/library-sync.js";
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { printSheet } from "../print-sheet.js";
import {
  BANDS,
  LIMITS,
  cleanSet,
  clozeRounds,
  decodeShare,
  encodeShare,
  itemsToText,
  matchRound,
  mulberry32,
  newId,
  parseWordList,
} from "../vocab-sets/model.js";
import {
  MODES,
  MODE_INFO,
  practiceClick,
  practiceHTML,
  practiceKey,
  resetRun,
} from "../vocab-sets/practice.js";
import { deleteSet, duplicateSet, getSet, readSets, saveSet } from "../vocab-sets/store.js";
import { BASE, announce, html, safeJson } from "../util.js";

const edit = {
  key: "",
  id: "",
  title: "",
  band: "all",
  text: "",
  errors: [],
  status: "",
  confirmDelete: "",
  imported: "",
};
const BAND_TEXT = {
  all: ["All grades", "Todos los grados"],
  "3-5": ["Grades 3–5", "Grados 3–5"],
  "6-8": ["Grades 6–8", "Grados 6–8"],
};
const ERROR_TEXT = {
  term_missing: ["has no word", "no tiene palabra"],
  too_long: ["is too long", "es demasiado larga"],
  duplicate: ["repeats an earlier word", "repite una palabra anterior"],
  too_many: [
    `is past the ${LIMITS.items}-word limit`,
    `pasa el límite de ${LIMITS.items} palabras`,
  ],
};
const seedOf = (text) => [...text].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7);

/** The set this page is about: a saved one by id, or a shared one carried in the link fragment. */
function resolve(route) {
  if (route.id === "play") {
    const encoded = location.hash.startsWith("#s=") ? location.hash.slice(3) : "";
    const set = decodeShare(encoded);
    return set
      ? {
          set: { ...set, id: `shared-${seedOf(encoded).toString(36)}` },
          shared: true,
          hash: `#s=${encoded}`,
        }
      : { set: null, shared: true, hash: "" };
  }
  return { set: getSet(route.id), shared: false, hash: "" };
}

const gradesQ = (ctx) => `?grades=${ctx.band}`;
const hrefFor = (ctx, path, hash = "") =>
  `${BASE}/vocab-sets${path ? `/${path}` : ""}${gradesQ(ctx)}${hash}`;

function loadEditor(route, ctx) {
  const key = `${route.id}:${route.sub}`;
  if (edit.key === key) return;
  const existing = route.id === "new" ? null : getSet(route.id);
  Object.assign(edit, {
    key,
    id: existing?.id || newId(),
    title: existing?.title || "",
    band: existing?.band || "all",
    text: existing ? itemsToText(existing.items) : "",
    errors: [],
    status: "",
    confirmDelete: "",
  });
}

function editorHTML(I, ctx) {
  const T = I.S;
  const bandOptions = BANDS.map(
    (b) =>
      html`<option value="${b}" ${edit.band === b ? "selected" : ""}>
        ${T(...BAND_TEXT[b])}
      </option>`,
  );
  const errorList = edit.errors.length
    ? html`<div class="vs-errors" role="alert">
        <p>
          <strong
            >${T("Fix these lines, or save without them.", "Corrige estas líneas o guarda sin ellas.")}</strong
          >
        </p>
        <ul>
          ${edit.errors.map((e) => html`<li>${T(`Line ${e.line}`, `Línea ${e.line}`)} ${T(...ERROR_TEXT[e.key])}</li>`)}
        </ul>
        <button type="button" class="btn ghost" data-vsa="save-anyway">
          ${T("Save without those lines", "Guardar sin esas líneas")}
        </button>
      </div>`
    : "";
  return html`<section class="panel vs-panel" aria-labelledby="vsEditHead">
    <h1 id="vsEditHead">
      ${edit.key.startsWith("new") ? T("New vocabulary set", "Nuevo conjunto de vocabulario") : T("Edit vocabulary set", "Editar conjunto de vocabulario")}
    </h1>
    <label class="vs-field"
      ><span>${T("Set title", "Título del conjunto")}</span
      ><input type="text" data-vs-field="title" value="${edit.title}" maxlength="${LIMITS.title}"
    /></label>
    <label class="vs-field"
      ><span>${T("Grades", "Grados")}</span
      ><select data-vs-field="band">
        ${bandOptions}
      </select></label
    >
    <label class="vs-field"
      ><span>${T("Words, one per line", "Palabras, una por línea")}</span>
      <textarea data-vs-field="text" rows="10" spellcheck="false" aria-describedby="vsFormat">
${edit.text}</textarea>
    </label>
    <p class="fine" id="vsFormat">
      ${T(
        "Format: word | meaning | example sentence | translation. Only the word is required. You can paste rows from a spreadsheet.",
        "Formato: palabra | significado | oración de ejemplo | traducción. Solo la palabra es obligatoria. Puedes pegar filas de una hoja de cálculo.",
      )}
    </p>
    ${errorList}
    <div class="vs-row">
      <button type="button" class="btn" data-vsa="save">
        ${T("Save set", "Guardar conjunto")}
      </button>
      <a
        class="btn ghost"
        href="${edit.key.startsWith("new") ? hrefFor(ctx, "") : hrefFor(ctx, edit.id)}"
        >${T("Cancel", "Cancelar")}</a
      >
    </div>
    <p class="vs-msg" role="status" id="vsStatus" tabindex="-1">${edit.status}</p>
  </section>`;
}

function listHTML(I, ctx) {
  const T = I.S;
  const sets = readSets();
  const classes = activeTeacherClasses();
  const imported = edit.imported ? html`<p class="vs-msg" role="status">${edit.imported}</p>` : "";
  return html`<section class="panel vs-panel" aria-labelledby="vsHead">
      <h1 id="vsHead">${T("Vocabulary sets", "Conjuntos de vocabulario")}</h1>
      <p>
        ${T("Make your own word lists, practice them in four ways, share them with a link, and print cards.", "Crea tus propias listas de palabras, practícalas de cuatro maneras, compártelas con un enlace e imprime tarjetas.")}
      </p>
      <div class="vs-row">
        <a class="btn" href="${hrefFor(ctx, "new")}">${T("New set", "Nuevo conjunto")}</a>
        <label class="btn ghost vs-file"
          >${T("Import a file", "Importar un archivo")}<input
            type="file"
            accept="application/json,.json"
            data-vs-import
            class="sr-only"
        /></label>
        ${
          classes.length
            ? html`<button type="button" class="btn ghost" data-vs-sync="${classes[0].code}">
                ${T(`Sync with ${classes[0].title || classes[0].code}`, `Sincronizar con ${classes[0].title || classes[0].code}`)}
              </button>`
            : ""
        }
      </div>
      ${imported}
    </section>
    <section class="panel vs-panel" aria-labelledby="vsMine">
      <h2 id="vsMine">${T("My sets", "Mis conjuntos")}</h2>
      ${
        sets.length
          ? html`<ul class="vs-sets">
              ${sets.map(
                (s) =>
                  html`<li>
                    <div>
                      <strong>${s.title}</strong
                      ><span class="fine"
                        >${T(`${s.items.length} words`, `${s.items.length} palabras`)} ·
                        ${T(...BAND_TEXT[s.band])}</span
                      >
                    </div>
                    <a class="btn small" href="${hrefFor(ctx, s.id)}">${T("Open", "Abrir")}</a>
                  </li>`,
              )}
            </ul>`
          : html`<p>
              ${T("No sets yet. Start with New set.", "Todavía no hay conjuntos. Empieza con Nuevo conjunto.")}
            </p>`
      }
    </section>`;
}

function shareBlock(I, set) {
  const T = I.S;
  const shared = encodeShare(set);
  if (!shared.ok)
    return html`<p class="vs-msg">
      ${T("This set is too big for a link. Use Export file instead.", "Este conjunto es demasiado grande para un enlace. Usa Exportar archivo.")}
    </p>`;
  const link = `${location.origin}${BASE}/vocab-sets/play#s=${shared.encoded}`;
  return html`<label class="vs-field"
      ><span>${T("Student link", "Enlace para estudiantes")}</span
      ><input type="text" readonly value="${link}" data-vs-link
    /></label>
    <div class="vs-row">
      <button type="button" class="btn ghost" data-vsa="copy-link">
        ${T("Copy link", "Copiar enlace")}</button
      ><a class="btn ghost" href="${BASE}/vocab-sets/play${gradesQuery()}#s=${shared.encoded}"
        >${T("Preview as a student", "Ver como estudiante")}</a
      >
    </div>`;
}
const gradesQuery = () => location.search || "";

function homeHTML(I, ctx, set) {
  const T = I.S;
  const modes = MODES.map(
    (m) =>
      html`<li>
        <a class="vs-mode" href="${hrefFor(ctx, `${set.id}/${m}`)}"
          ><strong>${T(MODE_INFO[m].en, MODE_INFO[m].es)}</strong
          ><span>${T(MODE_INFO[m].textEn, MODE_INFO[m].textEs)}</span></a
        >
      </li>`,
  );
  const confirm =
    edit.confirmDelete === set.id
      ? html`<p class="vs-msg" role="alert">
          ${T("Delete this set from this device? This cannot be undone.", "¿Borrar este conjunto de este dispositivo? No se puede deshacer.")}
          <button type="button" class="btn" data-vsa="delete-yes">${T("Delete", "Borrar")}</button>
          <button type="button" class="btn ghost" data-vsa="delete-no">
            ${T("Keep it", "Conservarlo")}
          </button>
        </p>`
      : "";
  return html`<section class="panel vs-panel" aria-labelledby="vsSetHead">
      <h1 id="vsSetHead">${set.title}</h1>
      <p class="fine">
        ${T(`${set.items.length} words`, `${set.items.length} palabras`)} ·
        ${T(...BAND_TEXT[set.band])}
      </p>
      <ul class="vs-modes">
        ${modes}
      </ul>
    </section>
    <section class="panel vs-panel" aria-labelledby="vsTeach">
      <h2 id="vsTeach">${T("Share and print", "Compartir e imprimir")}</h2>
      ${shareBlock(I, set)}
      <div class="vs-row">
        <button type="button" class="btn ghost" data-vsa="print-cards">
          ${T("Print word cards", "Imprimir tarjetas")}
        </button>
        <button type="button" class="btn ghost" data-vsa="print-review">
          ${T("Print review sheet", "Imprimir hoja de repaso")}
        </button>
        <button type="button" class="btn ghost" data-vsa="print-key">
          ${T("Print answer key", "Imprimir clave de respuestas")}
        </button>
        <button type="button" class="btn ghost" data-vsa="export">
          ${T("Export file", "Exportar archivo")}
        </button>
      </div>
      <p class="vs-msg" role="status" id="vsStatus" tabindex="-1">${edit.status}</p>
    </section>
    <section class="panel vs-panel">
      <div class="vs-row">
        <a class="btn" href="${hrefFor(ctx, `${set.id}/edit`)}"
          >${T("Edit set", "Editar conjunto")}</a
        >
        <button type="button" class="btn ghost" data-vsa="duplicate">
          ${T("Duplicate", "Duplicar")}
        </button>
        <button type="button" class="btn ghost" data-vsa="delete">${T("Delete", "Borrar")}</button>
      </div>
      ${confirm}
    </section>`;
}

function studentHomeHTML(I, ctx, set, hash) {
  const T = I.S;
  const modes = MODES.filter((m) => m !== "present").map(
    (m) =>
      html`<li>
        <a class="vs-mode" href="${BASE}/vocab-sets/play/${m}${gradesQuery()}${hash}"
          ><strong>${T(MODE_INFO[m].en, MODE_INFO[m].es)}</strong
          ><span>${T(MODE_INFO[m].textEn, MODE_INFO[m].textEs)}</span></a
        >
      </li>`,
  );
  return html`<section class="panel vs-panel" aria-labelledby="vsSetHead">
    <h1 id="vsSetHead">${set.title}</h1>
    <p class="fine">${T(`${set.items.length} words`, `${set.items.length} palabras`)}</p>
    <ul class="vs-modes">
      ${modes}
    </ul>
  </section>`;
}

const missing = (I, ctx) =>
  html`<section class="panel vs-panel">
    <h1>${I.S("We could not find that set", "No encontramos ese conjunto")}</h1>
    <p>
      ${I.S("It may be on a different device, or the link may be cut off.", "Puede estar en otro dispositivo, o el enlace puede estar incompleto.")}
    </p>
    <a class="btn" href="${hrefFor(ctx, "")}"
      >${I.S("Back to vocabulary sets", "Volver a conjuntos de vocabulario")}</a
    >
  </section>`;

export async function render(ctx) {
  const I = i18nFor(ctx);
  const T = I.S;
  const route = ctx.route;
  const title = T("Vocabulary sets", "Conjuntos de vocabulario");
  const crumbs = [[T("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`]];
  let body;
  let pageTitle = title;
  const isEdit = route.id === "new" || route.sub === "edit";
  if (!route.id) {
    crumbs.push([title, null]);
    body = listHTML(I, ctx);
  } else if (isEdit) {
    loadEditor(route, ctx);
    crumbs.push([title, hrefFor(ctx, "")], [T("Edit", "Editar"), null]);
    body = editorHTML(I, ctx);
  } else {
    const { set, shared, hash } = resolve(route);
    if (!set) {
      crumbs.push([title, shared ? null : hrefFor(ctx, "")]);
      body = missing(I, ctx);
    } else {
      pageTitle = `${set.title} · ${title}`;
      const base = shared ? `${BASE}/vocab-sets/play` : hrefFor(ctx, set.id);
      const mode =
        MODES.includes(route.sub) && !(shared && route.sub === "present") ? route.sub : "";
      crumbs.push([title, shared ? null : hrefFor(ctx, "")]);
      if (mode) {
        crumbs.push(
          [set.title, shared ? `${BASE}/vocab-sets/play${gradesQuery()}${hash}` : base],
          [T(MODE_INFO[mode].en, MODE_INFO[mode].es), null],
        );
        body = html`<section
          class="panel vs-panel vs-run"
          aria-label="${T(MODE_INFO[mode].en, MODE_INFO[mode].es)}"
        >
          ${practiceHTML(I, set, mode)}
        </section>`;
      } else {
        crumbs.push([set.title, null]);
        resetRun();
        body = shared ? studentHomeHTML(I, ctx, set, hash) : homeHTML(I, ctx, set);
      }
    }
  }
  return {
    title: pageTitle,
    html: html`${crumbsHTML(crumbs)}
      <div class="vs">${body}</div>`,
  };
}

const asSet = (ctx) => resolve(ctx.route).set;

function saveFromEditor(I, ctx, { dropErrors }) {
  const parsed = parseWordList(edit.text);
  edit.errors = dropErrors ? [] : parsed.errors;
  if (!edit.title.trim())
    return (edit.status = I.S("Add a title first.", "Primero agrega un título."));
  if (!parsed.items.length)
    return (edit.status = I.S("Add at least one word.", "Agrega al menos una palabra."));
  if (edit.errors.length) return (edit.status = "");
  const previous = getSet(edit.id);
  const byTerm = new Map((previous?.items || []).map((i) => [i.term.toLowerCase(), i.id]));
  const set = cleanSet({
    id: edit.id,
    title: edit.title,
    band: edit.band,
    items: parsed.items.map((i) => ({ ...i, id: byTerm.get(i.term.toLowerCase()) })),
  });
  const { saved } = saveSet(set);
  edit.status = saved
    ? I.S("Saved on this device.", "Guardado en este dispositivo.")
    : I.S(
        "Could not save: this browser is blocking storage. Export the file to keep your work.",
        "No se pudo guardar: este navegador bloquea el almacenamiento. Exporta el archivo para conservar tu trabajo.",
      );
  return saved ? set : null;
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const sheetHead = (set, I, label) =>
  html`<h1>${set.title}</h1>
    <p class="vs-print-line">${label}</p>`;

function printCards(I, set) {
  printSheet(
    html`${sheetHead(set, I, I.S("Word cards", "Tarjetas de palabras"))}
      <div class="vs-print-cards">
        ${set.items.map((i) => html`<div class="vs-print-card"><strong>${i.term}</strong><span>${i.definition}</span>${i.example ? html`<em>${i.example}</em>` : ""}${i.translation ? html`<span>${i.translation}</span>` : ""}</div>`)}
      </div>`,
  );
}

/** Part A matches words to lettered meanings; Part B finishes sentences. The key prints the same shuffle (seeded by the set id). */
function reviewData(set) {
  const rng = mulberry32(seedOf(set.id));
  const round = matchRound(set.items, rng, 10);
  const { rounds } = clozeRounds(set.items);
  return {
    terms: round.terms,
    defs: round.definitions,
    rounds: rounds.slice(0, 8),
    bank: rounds
      .slice(0, 8)
      .map((r) => r.term)
      .sort(),
  };
}

function printReview(I, set) {
  const T = I.S;
  const { terms, defs, rounds, bank } = reviewData(set);
  printSheet(
    html`${sheetHead(set, I, T("Name: ____________  Date: ____________", "Nombre: ____________  Fecha: ____________"))}
      <h2>
        ${T("Part A. Write the letter of the meaning.", "Parte A. Escribe la letra del significado.")}
      </h2>
      <div class="vs-print-cols">
        <ol>
          ${terms.map((t) => html`<li>____ ${t.text}</li>`)}
        </ol>
        <ol type="A">
          ${defs.map((d) => html`<li>${d.text}</li>`)}
        </ol>
      </div>
      ${
        rounds.length
          ? html`<h2>${T("Part B. Finish each sentence.", "Parte B. Completa cada oración.")}</h2>
              <p class="vs-print-bank">${bank.join("   ·   ")}</p>
              <ol>
                ${rounds.map((r) => html`<li>${r.prompt}</li>`)}
              </ol>`
          : ""
      }`,
  );
}

function printKey(I, set) {
  const T = I.S;
  const { terms, defs, rounds } = reviewData(set);
  const letter = (id) => String.fromCharCode(65 + defs.findIndex((d) => d.id === id));
  printSheet(
    html`${sheetHead(set, I, T("Answer key (teacher)", "Clave de respuestas (docente)"))}
      <h2>${T("Part A", "Parte A")}</h2>
      <ol>
        ${terms.map((t) => html`<li>${t.text}: ${letter(t.id)}</li>`)}
      </ol>
      ${
        rounds.length
          ? html`<h2>${T("Part B", "Parte B")}</h2>
              <ol>
                ${rounds.map((r) => html`<li>${r.answer}</li>`)}
              </ol>`
          : ""
      }`,
  );
}

export async function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const route = ctx.route;
  const isRun = MODES.includes(route.sub) && route.id && route.id !== "new";
  if (isRun) {
    const set = asSet(ctx);
    if (set && practiceClick(e, I, set, route.sub)) {
      await ctx.rerender();
      document.getElementById("vsFocus")?.focus({ preventScroll: true });
      return true;
    }
    return false;
  }
  const syncBtn = e.target.closest("[data-vs-sync]");
  if (syncBtn) {
    const cls = activeTeacherClasses().find((c) => c.code === syncBtn.dataset.vsSync);
    if (cls) {
      edit.imported = I.S("Syncing with class…", "Sincronizando con la clase…");
      await ctx.rerender();
      const res = await syncVocabSets(cls);
      edit.imported = res.ok
        ? I.S(`Synced ${res.count} vocabulary sets with ${cls.title || cls.code}.`, `Se sincronizaron ${res.count} conjuntos con ${cls.title || cls.code}.`)
        : I.S("Could not sync right now. Sets stay saved on this device.", "No se pudo sincronizar ahora. Los conjuntos siguen guardados en este dispositivo.");
      await ctx.rerender();
    }
    return true;
  }
  const t = e.target.closest("[data-vsa]");
  if (!t) return false;
  const act = t.dataset.vsa;
  const set = route.id && route.id !== "new" ? getSet(route.id) : null;
  if (act === "save" || act === "save-anyway") {
    const saved = saveFromEditor(I, ctx, { dropErrors: act === "save-anyway" });
    announce(edit.status || I.S("Check the lines below.", "Revisa las líneas."), { toast: false });
    if (saved) {
      edit.key = "";
      ctx.navigate?.(hrefFor(ctx, saved.id));
      return true;
    }
    await ctx.rerender();
    document.getElementById("vsStatus")?.focus({ preventScroll: true });
    return true;
  }
  if (!set) return false;
  if (act === "copy-link") {
    const link = document.querySelector("[data-vs-link]");
    try {
      await navigator.clipboard.writeText(link.value);
      edit.status = I.S("Link copied.", "Enlace copiado.");
    } catch {
      link.select();
      edit.status = I.S(
        "Press Ctrl+C (or Cmd+C) to copy the link.",
        "Presiona Ctrl+C (o Cmd+C) para copiar el enlace.",
      );
    }
  } else if (act === "export") {
    download(
      `${set.title.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40) || "vocabulary-set"}.json`,
      JSON.stringify({ v: 1, set }, null, 2),
    );
    edit.status = I.S("File downloaded.", "Archivo descargado.");
  } else if (act === "duplicate") {
    const copy = duplicateSet(set.id, I.S("copy", "copia"));
    if (copy?.saved) return void ctx.navigate?.(hrefFor(ctx, copy.set.id));
    edit.status = I.S("Could not save the copy.", "No se pudo guardar la copia.");
  } else if (act === "delete") edit.confirmDelete = set.id;
  else if (act === "delete-no") edit.confirmDelete = "";
  else if (act === "delete-yes") {
    deleteSet(set.id);
    edit.confirmDelete = "";
    ctx.navigate?.(hrefFor(ctx, ""));
    return true;
  } else if (act === "print-cards") return void printCards(I, set);
  else if (act === "print-review") return void printReview(I, set);
  else if (act === "print-key") return void printKey(I, set);
  else return false;
  await ctx.rerender();
  document.getElementById("vsStatus")?.focus({ preventScroll: true });
  return true;
}

export function onInput(e) {
  const t = e.target.closest("[data-vs-field]");
  if (t) edit[t.dataset.vsField] = t.value;
}

export async function onChange(e, ctx) {
  const I = i18nFor(ctx);
  const t = e.target;
  if (t.matches("[data-vs-field='band']")) edit.band = t.value;
  if (!t.matches("[data-vs-import]") || !t.files?.[0]) return;
  const text = await t.files[0].text().catch(() => "");
  const data = safeJson(text, null);
  const set = cleanSet({ ...(data?.set || {}), id: newId() });
  if (!set)
    edit.imported = I.S(
      "That file is not a vocabulary set.",
      "Ese archivo no es un conjunto de vocabulario.",
    );
  else
    edit.imported = saveSet(set).saved
      ? I.S(`Imported "${set.title}".`, `Se importó "${set.title}".`)
      : I.S("Could not save the imported set.", "No se pudo guardar el conjunto importado.");
  await ctx.rerender();
}

export async function onKey(e, ctx) {
  const route = ctx.route;
  if (!MODES.includes(route.sub) || !route.id) return;
  if (e.key === "Enter" && e.target.matches?.("[data-vs-answer]")) {
    e.preventDefault();
    const set = asSet(ctx);
    const check = document.querySelector('[data-vs="check"]');
    if (set && check && practiceClick({ target: check }, i18nFor(ctx), set, route.sub)) {
      await ctx.rerender();
      document.getElementById("vsFocus")?.focus({ preventScroll: true });
    }
    return;
  }
  if (practiceKey(e, route.sub)) {
    e.preventDefault();
    await ctx.rerender();
  }
}
