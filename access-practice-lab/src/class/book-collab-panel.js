// Teacher controls for Book Studio collaboration, mounted inside the class dashboard (roster-panel.js):
// turn writing together on or off for the class, see every shared book and who is in it (and who is in it right now),
// set a book read-only, change a learner to view-only or back, remove a learner from a book, or delete a shared copy.
// Server: functions/_lib/class-platform/books.js (every action is authorized there, not here).
import { request } from "../../../shared/class-platform/client.js";
import { el, errorText } from "./dom.js";

const POLL_MS = 20_000;

export function teacherBooks({
  code,
  passcode,
  siteKey = () => "",
  fetchImpl = (...a) => fetch(...a),
}) {
  const headers = () => ({
    ...(siteKey() ? { "x-teacher-key": siteKey() } : {}),
    ...(passcode ? { "x-class-teacher": passcode } : {}),
  });
  const post = (path, body) =>
    request(fetchImpl, `books/${path}`, {
      method: "POST",
      headers: headers(),
      body: { code, ...body },
    });
  return {
    list: () => request(fetchImpl, `books/class?code=${code}`, { headers: headers() }),
    space: (enabled) => post("space", { enabled }),
    lock: (bookId, locked) => post("lock", { bookId, locked }),
    member: (bookId, studentId, change) => post("member", { bookId, studentId, ...change }),
    unshare: (bookId) => post("unshare", { bookId }),
  };
}

export function mountBookCollabPanel(
  box,
  { S = (en) => en, code, passcode, siteKey, fetchImpl, live } = {},
) {
  const api = teacherBooks({ code, passcode, siteKey, fetchImpl });
  const say = (msg) => live && (live.textContent = msg);
  const body = el("div");
  box.replaceChildren(
    el(
      "section",
      { class: "cls-card bk-collab-teacher" },
      el("h4", {}, S("Books written together", "Libros escritos en grupo")),
      el(
        "p",
        { class: "fine" },
        S(
          "Learners in this class can share a Book Studio book and invite classmates by a book code. Only learners of this class can join. Recordings and videos stay on the learner's device; pictures are shared as small copies. Shared books are deleted 30 days after anyone last opened them.",
          "Los estudiantes de esta clase pueden compartir un libro de Book Studio e invitar a compañeros con un código. Solo pueden unirse estudiantes de esta clase. Las grabaciones y videos se quedan en el dispositivo del estudiante; las imágenes se comparten en copias pequeñas. Los libros compartidos se borran 30 días después de la última vez que alguien los abrió.",
        ),
      ),
      body,
    ),
  );
  let pending = null; // a book whose delete the teacher is confirming in the page

  const act = async (promise, done) => {
    const res = await promise;
    say(
      res.ok
        ? done
        : res.httpStatus === 503
          ? S(
              "Collaboration is not available on this site right now.",
              "La colaboración no está disponible en este sitio ahora.",
            )
          : errorText(S, res.error),
    );
    draw();
  };

  async function draw() {
    const res = await api.list();
    if (!res.ok) {
      body.replaceChildren(
        el(
          "p",
          {},
          res.httpStatus === 503
            ? S(
                "Collaboration is not available on this site right now.",
                "La colaboración no está disponible en este sitio ahora.",
              )
            : errorText(S, res.error),
        ),
      );
      return;
    }
    const toggle = el(
      "button",
      {
        type: "button",
        class: res.enabled ? "btn" : "btn btn-primary",
        "aria-pressed": String(res.enabled),
        "data-collab-space": "",
        onclick: () =>
          act(
            api.space(!res.enabled),
            res.enabled
              ? S(
                  "Writing together is off for this class.",
                  "Escribir juntos está desactivado para esta clase.",
                )
              : S(
                  "Writing together is on for this class.",
                  "Escribir juntos está activado para esta clase.",
                ),
          ),
      },
      res.enabled
        ? S("Turn off writing together", "Desactivar escribir juntos")
        : S("Turn on writing together", "Activar escribir juntos"),
    );
    const state = el(
      "p",
      {},
      res.enabled
        ? S(
            "Writing together is ON for this class.",
            "Escribir juntos está ACTIVADO para esta clase.",
          )
        : S(
            "Writing together is OFF: learners cannot open, join or change shared books.",
            "Escribir juntos está DESACTIVADO: los estudiantes no pueden abrir, unirse ni cambiar libros compartidos.",
          ),
    );
    const books = res.books.map((b) => {
      const people = el(
        "ul",
        { class: "cls-list" },
        b.members.map((m) =>
          el(
            "li",
            {},
            el("strong", {}, m.alias),
            ` · ${m.role === "owner" ? S("owner", "dueño") : m.role === "viewer" ? S("view only", "solo ver") : S("editor", "editor")} · ${S(`${m.edits} changes`, `${m.edits} cambios`)}${m.here ? ` · ${S("in the book now", "en el libro ahora")}` : ""} `,
            m.role === "owner"
              ? null
              : el(
                  "button",
                  {
                    type: "button",
                    class: "btn small",
                    onclick: () =>
                      act(
                        api.member(b.bookId, m.studentId, {
                          role: m.role === "viewer" ? "editor" : "viewer",
                        }),
                        S("Role changed.", "Rol cambiado."),
                      ),
                  },
                  m.role === "viewer"
                    ? S(`Let ${m.alias} edit`, `Dejar editar a ${m.alias}`)
                    : S(`Make ${m.alias} view only`, `${m.alias}: solo ver`),
                ),
            m.role === "owner"
              ? null
              : el(
                  "button",
                  {
                    type: "button",
                    class: "btn small ghost",
                    onclick: () =>
                      act(
                        api.member(b.bookId, m.studentId, { remove: true }),
                        S(`${m.alias} was removed from the book.`, `${m.alias} salió del libro.`),
                      ),
                  },
                  S(`Remove ${m.alias}`, `Quitar a ${m.alias}`),
                ),
          ),
        ),
      );
      return el(
        "li",
        { class: "bk-collab-tbook", "data-collab-book": b.bookId },
        el(
          "p",
          {},
          el("strong", {}, b.title),
          ` · ${S("by", "de")} ${b.ownerAlias} · ${S("code", "código")} ${b.bookCode} · ${b.pages} ${S("pages", "páginas")}${b.locked ? ` · ${S("READ-ONLY", "SOLO LECTURA")}` : ""}`,
        ),
        people,
        el(
          "div",
          { class: "row-actions" },
          el(
            "button",
            {
              type: "button",
              class: "btn small",
              "aria-pressed": String(b.locked),
              "data-collab-lock": b.bookId,
              onclick: () =>
                act(
                  api.lock(b.bookId, !b.locked),
                  b.locked
                    ? S(
                        "Learners can edit this book again.",
                        "Los estudiantes pueden editar este libro otra vez.",
                      )
                    : S(
                        "This book is read-only for everyone.",
                        "Este libro es de solo lectura para todos.",
                      ),
                ),
            },
            b.locked ? S("Allow editing", "Permitir editar") : S("Make read-only", "Solo lectura"),
          ),
          pending === b.bookId
            ? el(
                "span",
                { class: "bk-confirm", role: "group" },
                S(
                  "Delete the shared copy? Learners keep the copy on their own devices.",
                  "¿Borrar la copia compartida? Los estudiantes conservan la copia en sus dispositivos.",
                ),
                el(
                  "button",
                  {
                    type: "button",
                    class: "btn small danger",
                    onclick: () => (
                      (pending = null),
                      act(
                        api.unshare(b.bookId),
                        S("Shared copy deleted.", "Copia compartida borrada."),
                      )
                    ),
                  },
                  S("Delete", "Borrar"),
                ),
                el(
                  "button",
                  {
                    type: "button",
                    class: "btn small ghost",
                    onclick: () => ((pending = null), draw()),
                  },
                  S("Keep", "Conservar"),
                ),
              )
            : el(
                "button",
                {
                  type: "button",
                  class: "btn small ghost",
                  onclick: () => ((pending = b.bookId), draw()),
                },
                S("Delete shared copy…", "Borrar copia compartida…"),
              ),
        ),
      );
    });
    body.replaceChildren(
      state,
      el("div", { class: "row-actions" }, toggle),
      books.length
        ? el("ul", { class: "cls-list bk-collab-tbooks" }, books)
        : el(
            "p",
            { class: "fine" },
            S("No shared books yet.", "Todavía no hay libros compartidos."),
          ),
    );
  }

  draw();
  const timer = setInterval(() => !document.hidden && !pending && draw(), POLL_MS);
  return { unmount: () => clearInterval(timer), refresh: draw };
}
