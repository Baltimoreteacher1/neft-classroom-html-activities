// My Activities: everything a teacher made, on this device and in their classes, in one list. Search, filter by
// status, grade and subject, and the four things you do with an activity: edit, preview, share, copy.
// No folders. Deleting asks first and, for a published activity, also takes the student page down.

import { safeJson } from "../util.js";
import { SUBJECT_LABELS } from "./core/curriculum.js";
import { SCHEMA_ID, normalizeActivity } from "./core/schema.js";
import {
  deleteLocal,
  duplicateActivity,
  knownClasses,
  listLocal,
  saveLocal,
  studioApi,
} from "./drafts.js";
import { button, clear, field, h, openDialog, say, select, textInput } from "./editor/ui.js";

const KIND = {
  interactive: ["Interactive", "Interactiva"],
  worksheet: ["Worksheet", "Hoja de trabajo"],
  game: ["Game", "Juego"],
  check: ["Quick check", "Revisión rápida"],
};
const STATE = {
  published: ["Published", "Publicada"],
  draft: ["Draft", "Borrador"],
  unpublished: ["Unpublished", "Retirada"],
};

/** Local drafts merged with each remembered class's list. */
export async function loadItems(fetchImpl) {
  const byId = new Map();
  for (const l of listLocal())
    byId.set(l.id, {
      id: l.id,
      activity: l.activity,
      updatedAt: l.updatedAt,
      code: l.link?.code || "",
      state: l.link?.state || "draft",
      publishedRev: l.link?.publishedRev,
      local: true,
    });
  await Promise.all(
    knownClasses()
      .filter((c) => c.passcode || false)
      .map(async (c) => {
        const res = await studioApi({ code: c.code, passcode: c.passcode, fetchImpl })
          .list()
          .catch(() => null);
        for (const it of res?.ok ? res.items || [] : []) {
          const prev = byId.get(it.id);
          byId.set(it.id, {
            ...(prev || {}),
            id: it.id,
            code: c.code,
            state: it.state,
            rev: it.rev,
            publishedRev: it.publishedRev,
            updatedAt: Math.max(prev?.updatedAt || 0, it.updatedAt || 0),
            activity: prev?.activity || null,
            summary: it,
            local: Boolean(prev),
          });
        }
      }),
  );
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function mountLibrary(root, { S, goTo, onOpen, onNew, onPreview, onShare, fetchImpl }) {
  const state = { items: [], q: "", status: "all", grade: "", subject: "" };
  const list = h("div.st-lib-list");
  const empty = h(
    "div.st-empty",
    h("h2", S("Nothing here yet", "Aún no hay nada aquí")),
    h(
      "p",
      S("Make your first activity in three steps.", "Haga su primera actividad en tres pasos."),
    ),
    button(S("Create an activity", "Crear una actividad"), onNew, "primary"),
  );
  const meta = (it) => it.activity || it.summary || {};
  const gradeOf = (it) => it.activity?.context?.grade || it.summary?.grade || "";
  const subjOf = (it) => it.activity?.context?.subject || it.summary?.subject || "";

  function visible() {
    const q = state.q.trim().toLowerCase();
    return state.items.filter((it) => {
      const m = meta(it);
      if (state.status === "draft" && it.state === "published") return false;
      if (state.status === "published" && it.state !== "published") return false;
      if (state.grade && gradeOf(it) !== state.grade) return false;
      if (state.subject && subjOf(it) !== state.subject) return false;
      return !q || [m.title, subjOf(it), m.context?.unitTitle].join(" ").toLowerCase().includes(q);
    });
  }

  function card(it) {
    const m = meta(it);
    const updated = new Date(it.updatedAt || Date.now()).toLocaleDateString();
    const updatedState =
      it.state === "published" && it.rev && it.publishedRev && it.rev > it.publishedRev;
    return h(
      "article.st-lib-card",
      { "data-kind": m.kind },
      h(
        "div.st-lib-top",
        h("span.st-pill", S(...(KIND[m.kind] || ["Activity", "Actividad"]))),
        h(
          "span.st-pill.state",
          { "data-state": it.state },
          updatedState
            ? S("Published · has changes", "Publicada · con cambios")
            : S(...(STATE[it.state] || STATE.draft)),
        ),
      ),
      h("h3", m.title || S("Untitled", "Sin título")),
      h(
        "p.st-lib-ctx",
        [
          gradeOf(it) && S(`Grade ${gradeOf(it)}`, `Grado ${gradeOf(it)}`),
          subjOf(it),
          m.context?.unitTitle,
        ]
          .filter(Boolean)
          .join(" · ") || S("No grade or subject yet", "Aún sin grado ni materia"),
      ),
      h("p.st-lib-date", S(`Updated ${updated}`, `Actualizada ${updated}`)),
      h(
        "div.st-lib-actions",
        button(S("Edit", "Editar"), () => onOpen(it.id), "primary small"),
        button(S("Preview", "Vista previa"), () => onPreview(it.id), "small"),
        button(S("Share", "Compartir"), () => onShare(it.id), "small"),
        button(S("Duplicate", "Duplicar"), () => duplicate(it), "small ghost"),
        button(S("Delete", "Eliminar"), () => remove(it), "small ghost"),
      ),
    );
  }

  async function duplicate(it) {
    const base = it.activity || (await fetchRemote(it));
    if (!base)
      return say(S("That activity could not be opened.", "No se pudo abrir esa actividad."));
    const copy = duplicateActivity(base, S("Copy of", "Copia de"));
    saveLocal(copy, null);
    say(S("Copied. Your original is unchanged.", "Copiado. Su original no cambió."));
    await refresh();
  }
  async function fetchRemote(it) {
    const c = knownClasses().find((x) => x.code === it.code);
    if (!c) return null;
    const res = await studioApi({ code: c.code, passcode: c.passcode, fetchImpl })
      .get(it.id)
      .catch(() => null);
    return res?.ok ? normalizeActivity(res.activity) : null;
  }
  function remove(it) {
    openDialog(S("Delete this activity?", "¿Eliminar esta actividad?"), (body, close) => {
      body.append(
        h(
          "p",
          S(
            "It will be removed from this device. If it is published, students will no longer be able to open it.",
            "Se quitará de este dispositivo. Si está publicada, los estudiantes ya no podrán abrirla.",
          ),
        ),
        h(
          "div.st-add-row",
          button(
            S("Delete", "Eliminar"),
            async () => {
              const c = knownClasses().find((x) => x.code === it.code);
              if (c)
                await studioApi({ code: c.code, passcode: c.passcode, fetchImpl })
                  .remove(it.id)
                  .catch(() => null);
              deleteLocal(it.id);
              close();
              say(S("Deleted.", "Eliminada."));
              refresh();
            },
            "primary",
          ),
          button(S("Keep it", "Conservarla"), close),
        ),
      );
    });
  }

  function draw() {
    const items = visible();
    clear(list);
    if (!state.items.length) list.append(empty);
    else if (!items.length)
      list.append(
        h(
          "p.st-empty",
          S(
            "Nothing matches. Clear the search or filters.",
            "Nada coincide. Borre la búsqueda o los filtros.",
          ),
        ),
      );
    else for (const it of items) list.append(card(it));
  }
  async function refresh() {
    state.items = await loadItems(fetchImpl);
    draw();
  }

  function backup() {
    const data = JSON.stringify({
      kind: "lp-activities/1",
      items: listLocal().map((l) => l.activity),
    });
    const a = h("a", {
      href: URL.createObjectURL(new Blob([data], { type: "application/json" })),
      download: "my-activities.json",
    });
    document.body.append(a);
    a.click();
    a.remove();
  }
  async function restore(file) {
    const data = safeJson(await file.text(), null);
    const items = (
      data?.kind === "lp-activities/1" ? data.items : data?.schema === SCHEMA_ID ? [data] : []
    ).slice(0, 60);
    let n = 0;
    for (const raw of items) {
      const a = normalizeActivity(raw);
      saveLocal({ ...a, id: a.id.match(/^s[a-f0-9]{10}$/) ? a.id : duplicateActivity(a).id });
      n++;
    }
    say(
      n
        ? S(`${n} activities restored.`, `${n} actividades restauradas.`)
        : S("That file has no activities in it.", "Ese archivo no contiene actividades."),
    );
    refresh();
  }

  const subjects = [...new Set(Object.keys(SUBJECT_LABELS))];
  const filters = h(
    "div.st-lib-filters",
    field(
      S("Search", "Buscar"),
      textInput("", (v) => ((state.q = v), draw()), {
        type: "search",
        placeholder: S("Title, subject or unit", "Título, materia o unidad"),
      }),
    ),
    field(
      S("Show", "Mostrar"),
      select(
        [
          ["all", S("Everything", "Todo")],
          ["draft", S("Drafts", "Borradores")],
          ["published", S("Published", "Publicadas")],
        ],
        "all",
        (v) => ((state.status = v), draw()),
      ),
    ),
    field(
      S("Grade", "Grado"),
      select(
        [
          ["", S("All", "Todos")],
          ...["K", "1", "2", "3", "4", "5", "6", "7", "8"].map((g) => [g, g]),
        ],
        "",
        (v) => ((state.grade = v), draw()),
      ),
    ),
    field(
      S("Subject", "Materia"),
      select(
        [["", S("All", "Todas")], ...subjects.map((s) => [s, S(...SUBJECT_LABELS[s])])],
        "",
        (v) => ((state.subject = v), draw()),
      ),
    ),
  );
  const restoreInput = h("input", {
    type: "file",
    accept: "application/json",
    hidden: true,
    onchange: (e) => e.target.files?.[0] && restore(e.target.files[0]),
  });
  clear(root).append(
    h(
      "section.st-library",
      h(
        "div.st-lib-head",
        h("h1", { tabindex: "-1" }, S("My activities", "Mis actividades")),
        button(S("Create an activity", "Crear una actividad"), onNew, "primary"),
      ),
      filters,
      list,
      h(
        "div.st-lib-foot",
        button(S("Back up my activities", "Respaldar mis actividades"), backup, "ghost small"),
        button(
          S("Restore from a backup", "Restaurar desde un respaldo"),
          () => restoreInput.click(),
          "ghost small",
        ),
        restoreInput,
        h(
          "p.st-hint",
          S(
            "Activities are saved on this device. Save them to a class to open them anywhere.",
            "Las actividades se guardan en este dispositivo. Guárdelas en una clase para abrirlas en cualquier lugar.",
          ),
        ),
      ),
    ),
  );
  refresh();
  return { refresh };
}
