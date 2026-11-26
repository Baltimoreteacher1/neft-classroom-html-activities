// Vocabulary Academy — Reading Library (/vocabulary-academy/read) and Interactive Reader (/vocabulary-academy/read/<id>).
// Every lesson has its own passage (Reading 1, g<G>-u<NN>-p1) and may also have an original companion reading (Reading 2,
// g<G>-u<NN>-r1). Progress is kept in progress.reading[<readingId>] and word-meaning/context answers feed recordResult().
import { esc, html, raw } from "../../util.js";
import { SHIPPED_GRADES, bandOfGrade } from "../contract.js";
import {
  getGradeOverview,
  getReading,
  getUnit,
  groupLessons,
  lessonHref,
  normGrade,
  vaHref,
} from "../data.js";
import { recordResult } from "../model.js";
import { noteAcademyResult } from "../lens.js";
import {
  filterRows,
  genresOf,
  groupRows,
  lessonRows,
  normalizeReading,
  parseReadingId,
  readingLabel,
  siblingId,
} from "../reading/ids.js";
import { cleanReadingState } from "../reading/marks.js";
import { mountReader } from "../reading/player.js";
import { crumbs, gradeName, gradeNameS, notPublishedPanel, rootCrumb } from "../ui.js";

const GENRE_ES = {
  narrative: "Narración",
  informational: "Informativo",
  dialogue: "Diálogo",
  argument: "Argumento",
  science: "Ciencias",
  history: "Historia",
  biography: "Biografía",
  description: "Descripción",
  poem: "Poema",
};

let active = null; // { kind:"reader", mount } | { kind:"library", state }

function closeActive() {
  if (active?.kind === "reader") active.player?.destroy?.();
  active = null;
}

function genreLabel(I, genre) {
  if (!genre) return "";
  const en = genre[0].toUpperCase() + genre.slice(1);
  return I.T(en, GENRE_ES[genre] || en);
}

function genreLabelS(I, genre) {
  if (!genre) return "";
  const en = genre[0].toUpperCase() + genre.slice(1);
  return I.S(en, GENRE_ES[genre] || en);
}

async function loadLibraryGrade(grade) {
  const overview = await getGradeOverview(grade);
  const units = groupLessons(overview?.units || []);
  const published = (overview?.units || []).filter((u) => u.published);
  const passages = {};
  const companions = {};
  await Promise.all(
    published.map(async (row) => {
      const [u, comp] = await Promise.all([getUnit(row.id), getReading(grade, row.n)]);
      if (u?.passage?.paras?.length) {
        passages[row.id] = {
          title: u.passage.title || row.title,
          genre: u.passage.genre || "informational",
          words: (u.words || []).map((w) => w.hw),
        };
      }
      if (comp?.reading?.paras?.length) {
        companions[row.id] = {
          title: comp.reading.title || row.title,
          genre: comp.reading.genre || "informational",
          words: (u?.words || []).map((w) => w.hw),
        };
      }
    }),
  );
  return { rows: lessonRows({ grade, units, passages, companions }) };
}

function libraryListHTML(I, rows, { genre, query, onlyUnfinished, done }) {
  const shown = filterRows(rows, { genre, query, done, onlyUnfinished });
  const groups = groupRows(shown);
  if (!groups.length) {
    return html`<section class="va-panel va-empty">
      <h2>${I.T("No readings match these filters", "Ninguna lectura coincide con estos filtros")}</h2>
      <p>${I.T("Try clearing the search box or showing all genres.", "Prueba borrar la búsqueda o mostrar todos los géneros.")}</p>
    </section>`;
  }
  return html`${groups.map((g) =>
    g.units.map(
      (unit) => html`<section class="var-lib-unit" aria-labelledby="varLibU${unit.u}">
        <h2 id="varLibU${unit.u}" class="var-lib-uh">${I.T("Unit", "Unidad")} ${unit.u}</h2>
        <ul class="var-lib-grid">
          ${unit.rows.map((row) =>
            row.readings.map((r) => {
              const isDone = Boolean(done[r.id]);
              return html`<li class="var-lib-card ${isDone ? "is-done" : ""}">
                <a class="var-lib-link" href="${vaHref("read", r.id)}">
                  <span class="var-lib-kicker">
                    ${I.T("Lesson", "Lección")} ${row.n} · ${I.T(...r.label)}
                    ${r.genre ? html` · ${genreLabel(I, r.genre)}` : ""}
                  </span>
                  <strong class="var-lib-title" lang="en">${r.title}</strong>
                  <span class="var-lib-lesson">${row.lessonTitle}</span>
                  <span class="var-lib-status">
                    ${isDone
                      ? html`<span class="var-lib-badge is-done">✓ ${I.T("Read", "Leída")}</span>`
                      : html`<span class="var-lib-badge">${I.T("Open reading", "Abrir lectura")}</span>`}
                  </span>
                </a>
              </li>`;
            }),
          )}
        </ul>
      </section>`,
    ),
  )}`;
}

async function renderLibrary(va) {
  const { I, progress, route } = va;
  const qGrade = normGrade(route?.q?.grade || "");
  const grade =
    qGrade && SHIPPED_GRADES.includes(qGrade)
      ? qGrade
      : progress.grade && SHIPPED_GRADES.includes(progress.grade)
        ? progress.grade
        : "4";
  const { rows } = await loadLibraryGrade(grade);
  const genres = genresOf(rows);
  const done = Object.fromEntries(
    Object.entries(progress.reading || {})
      .filter(([, v]) => v?.done)
      .map(([k]) => [k, true]),
  );
  const totalCount = rows.reduce((n, r) => n + r.readings.length, 0);
  const doneCount = rows.reduce(
    (n, r) => n + r.readings.filter((x) => done[x.id]).length,
    0,
  );
  const state = { grade, rows, genres, done, genre: "", query: "", onlyUnfinished: false };
  active = { kind: "library", state, va };

  const title = I.S("Reading Library", "Biblioteca de lecturas");
  return {
    title,
    html: html`${crumbs(I, [rootCrumb(I), [title, ""]])}
      <header class="var-lib-head">
        <div>
          <p class="va-kicker">${I.T("Vocabulary Academy", "Academia de Vocabulario")}</p>
          <h1>${I.T("Reading Library", "Biblioteca de lecturas")}</h1>
          <p class="var-lib-lead">
            ${I.T(
              "Read every lesson's words inside a real passage. Tap any word for its card, listen aloud, find context clues, and mark sentences as you read.",
              "Lee las palabras de cada lección dentro de una lectura real. Toca cualquier palabra para ver su tarjeta, escucha en voz alta, busca pistas de contexto y marca oraciones mientras lees.",
            )}
          </p>
        </div>
        <p class="var-lib-count">
          <strong>${doneCount} / ${totalCount}</strong>
          <span>${I.T("readings finished", "lecturas terminadas")}</span>
        </p>
      </header>

      <nav class="var-lib-grades" aria-label="${I.S("Choose a grade", "Elige un grado")}">
        ${SHIPPED_GRADES.map(
          (g) => html`<a
            class="btn va-btn var-lib-gbtn ${g === grade ? "is-current" : ""}"
            href="${vaHref("read")}?grade=${encodeURIComponent(g)}"
            aria-current="${g === grade ? "page" : "false"}"
          >
            ${gradeName(I, g)}
            <span class="visually-hidden">${gradeNameS(I, g)}</span>
          </a>`,
        )}
      </nav>

      <div class="var-lib-filters" role="region" aria-label="${I.S("Filter readings", "Filtrar lecturas")}">
        <label class="var-lib-field">
          <span>${I.T("Search", "Buscar")}</span>
          <input
            type="search"
            class="var-lib-input"
            data-var-lib-q
            placeholder="${I.S("Title, lesson, or word", "Título, lección o palabra")}"
            value=""
          />
        </label>
        <label class="var-lib-field">
          <span>${I.T("Genre", "Género")}</span>
          <select class="var-lib-select" data-var-lib-genre>
            <option value="">${I.S("All genres", "Todos los géneros")}</option>
            ${genres.map((g) => html`<option value="${g}">${genreLabelS(I, g)}</option>`)}
          </select>
        </label>
        <label class="var-lib-check">
          <input type="checkbox" data-var-lib-unfinished />
          <span>${I.T("Not read yet", "Sin leer todavía")}</span>
        </label>
      </div>

      <div data-var-lib-list>
        ${libraryListHTML(I, rows, state)}
      </div>`,
  };
}

async function renderOneReading(va, id) {
  const { I, progress } = va;
  const parsed = parseReadingId(id);
  const libCrumb = [I.S("Reading Library", "Biblioteca de lecturas"), vaHref("read")];
  if (!parsed) {
    return {
      title: I.S("Reading not found", "Lectura no encontrada"),
      html: html`${crumbs(I, [rootCrumb(I), libCrumb, [I.S("Not found", "No encontrada"), ""]])}
        ${notPublishedPanel(I, {
          title: I.T("We could not find that reading", "No encontramos esa lectura"),
          text: I.T(
            "Open the Reading Library to pick a passage from any grade.",
            "Abre la Biblioteca de lecturas para elegir un texto de cualquier grado.",
          ),
          href: vaHref("read"),
          label: I.T("Open Reading Library", "Abrir Biblioteca de lecturas"),
        })}`,
    };
  }
  const [unit, comp] = await Promise.all([
    getUnit(parsed.unitId),
    getReading(parsed.grade, parsed.n),
  ]);
  const rawReading = parsed.kind === "companion" ? comp?.reading : unit?.passage;
  if (!unit || !rawReading?.paras?.length) {
    return {
      title: I.S("Reading not ready yet", "Lectura todavía no lista"),
      html: html`${crumbs(I, [rootCrumb(I), libCrumb, [I.S("Coming soon", "Próximamente"), ""]])}
        ${notPublishedPanel(I, {
          title: I.T("This reading is not published yet", "Esta lectura todavía no está publicada"),
          text: I.T(
            "Pick another passage from the Reading Library or return to the lesson.",
            "Elige otra lectura en la Biblioteca de lecturas o vuelve a la lección.",
          ),
          href: vaHref("read") + `?grade=${encodeURIComponent(parsed.grade)}`,
          label: I.T("Back to Reading Library", "Volver a la Biblioteca de lecturas"),
        })}`,
    };
  }

  const reading = normalizeReading(rawReading, { unit, kind: parsed.kind });
  const sib = siblingId(parsed.id);
  const hasSibling =
    parsed.kind === "passage"
      ? Boolean(comp?.reading?.paras?.length)
      : Boolean(unit?.passage?.paras?.length);
  const band = bandOfGrade(parsed.grade);
  const state = cleanReadingState(progress.reading?.[parsed.id]);
  const links = {
    library: `${vaHref("read")}?grade=${encodeURIComponent(parsed.grade)}`,
    lesson: lessonHref(parsed.grade, parsed.n),
    sibling: hasSibling && sib ? vaHref("read", sib) : "",
  };
  active = {
    kind: "reader",
    opts: {
      reading,
      words: unit.words || [],
      I,
      sup: va.supports("reading"),
      band,
      early: band === "early",
      state,
      label: readingLabel(parsed.kind),
      links,
      onChange: (next) => {
        progress.reading ||= {};
        progress.reading[parsed.id] = cleanReadingState(next);
        va.save();
      },
      onRecord: (plan) => {
        for (const item of plan || []) {
          const sup = va.supports("reading")?.readAloud ? ["readAloud"] : [];
          recordResult(progress, { wordId: item.wordId, dim: item.dim, ok: item.ok, sup, type: "reading" });
          noteAcademyResult({ wordId: item.wordId, ok: item.ok, sup });
        }
        va.save();
      },
    },
    player: null,
  };

  return {
    title: `${reading.title} · ${I.S("Reading Library", "Biblioteca de lecturas")}`,
    html: html`${crumbs(I, [
      rootCrumb(I),
      [I.S("Reading Library", "Biblioteca de lecturas"), `${vaHref("read")}?grade=${encodeURIComponent(parsed.grade)}`],
      [reading.title, ""],
    ])}
    <div data-var-mount></div>`,
  };
}

export async function render(ctx, va) {
  closeActive();
  const id = va.params?.readingId || "";
  return id ? renderOneReading(va, id) : renderLibrary(va);
}

export function mount(root) {
  if (!active) return;
  if (active.kind === "reader") {
    const host = root.querySelector("[data-var-mount]");
    if (host) active.player = mountReader(host, active.opts);
    return;
  }
  if (active.kind === "library") {
    const list = root.querySelector("[data-var-lib-list]");
    const repaint = () => {
      if (!list) return;
      list.innerHTML = String(libraryListHTML(active.va.I, active.state.rows, active.state));
    };
    const qInput = root.querySelector("[data-var-lib-q]");
    const gSel = root.querySelector("[data-var-lib-genre]");
    const uChk = root.querySelector("[data-var-lib-unfinished]");
    qInput?.addEventListener("input", () => {
      active.state.query = qInput.value;
      repaint();
    });
    gSel?.addEventListener("change", () => {
      active.state.genre = gSel.value;
      repaint();
    });
    uChk?.addEventListener("change", () => {
      active.state.onlyUnfinished = Boolean(uChk.checked);
      repaint();
    });
  }
}

export function unmount() {
  closeActive();
}

export const onClick = () => false;
export const onChange = () => false;
export const onInput = () => false;
export const onKey = () => false;
