// Teacher setup for a class (mounted by class/roster-panel.js): printable join cards (one QR for the class, one
// sign-in slip per student with their nickname and, after a reset, their new student key), a roster list with a
// reset-key button per student, and a "Share to Google Classroom" link.
//
// Google Classroom: the site's Google OAuth (functions/api/google/*) belongs to the Noam School planner and holds
// read-only Classroom scopes on a separate app, so it cannot post to a class or read a roster here. Posting and
// roster import would need new OAuth credentials and consent; until then this uses Google's public share page, which
// needs no credentials: the teacher picks the class and posts there. Nothing is sent from this site.
import { el, errorText } from "./dom.js";

/** Google's public "Share to Classroom" URL for the join link (no credentials, no data beyond the link and title). */
export function classroomShareUrl(joinLink, title = "") {
  const url = new URL("https://classroom.google.com/share");
  url.searchParams.set("url", joinLink);
  if (title) url.searchParams.set("title", title);
  return url.toString();
}

export function createJoinCards({ S, api, title, code, url, svg, live }) {
  const keys = new Map(); // studentId -> key from a reset in this tab, printed on that student's slip
  let students = [];
  const rows = el("tbody");
  const slips = el("div", { class: "cls-slips" });
  const classCard = el(
    "div",
    { class: "cls-joincard" },
    el("h5", {}, title || S("Your class", "Tu clase")),
    el("div", { class: "cls-qr" }),
    el(
      "p",
      {},
      `${S("Class code", "Código de clase")}: `,
      el("strong", { class: "cls-keybig" }, code),
    ),
    el("p", { class: "fine" }, url),
    el(
      "p",
      {},
      S(
        "Scan the QR code or type the class code. Use a nickname, not your full name.",
        "Escanea el código QR o escribe el código de clase. Usa un apodo, no tu nombre completo.",
      ),
    ),
  );
  if (svg) classCard.querySelector(".cls-qr").innerHTML = svg;
  const print = () => {
    document.body.classList.add("cls-printing");
    const done = () => document.body.classList.remove("cls-printing");
    window.addEventListener("afterprint", done, { once: true });
    try {
      window.print();
    } finally {
      setTimeout(done, 0);
    }
  };
  const node = el(
    "section",
    { class: "cls-card cls-setup", "aria-labelledby": "ctCardsH" },
    el(
      "h4",
      { id: "ctCardsH" },
      S("Join cards and student keys", "Tarjetas para unirse y claves de estudiante"),
    ),
    el(
      "p",
      { class: "fine" },
      S(
        "Print one class card for the board and a sign-in slip for each student. On a shared computer, a student signs back in with the class code, their nickname and their student key. Reset a key to print a new one.",
        "Imprime una tarjeta de la clase para la pizarra y una tira de ingreso para cada estudiante. En una computadora compartida, el estudiante vuelve a entrar con el código de clase, su apodo y su clave de estudiante. Restablece una clave para imprimir una nueva.",
      ),
    ),
    el(
      "div",
      { class: "row-actions" },
      el(
        "button",
        { type: "button", class: "btn btn-primary", "data-ct-print": true, onclick: print },
        S("Print join cards", "Imprimir tarjetas"),
      ),
      el(
        "a",
        {
          class: "btn",
          href: classroomShareUrl(url, title),
          target: "_blank",
          rel: "noopener noreferrer",
          "data-ct-classroom": true,
        },
        S("Share to Google Classroom", "Compartir en Google Classroom"),
      ),
    ),
    el(
      "p",
      { class: "fine" },
      S(
        "Opens Google Classroom's own share page, where you choose the class and post the join link. Roster import and sign-in with Google are not set up yet.",
        "Abre la página para compartir de Google Classroom, donde eliges la clase y publicas el enlace. La importación de listas y el ingreso con Google aún no están configurados.",
      ),
    ),
    el(
      "table",
      { class: "cls-table" },
      el(
        "thead",
        {},
        el(
          "tr",
          {},
          [S("Nickname", "Apodo"), S("Student key", "Clave de estudiante"), ""].map((h) =>
            el("th", { scope: "col" }, h),
          ),
        ),
      ),
      rows,
    ),
    el("div", { class: "cls-print-area" }, classCard, slips),
  );

  async function reset(student) {
    const res = await api.resetStudent(student.studentId);
    if (!res.ok) {
      live.textContent = errorText(S, res.error);
      return;
    }
    setKey(student.studentId, res.studentKey);
    live.textContent = S(
      `New student key for ${student.alias}: ${res.studentKey}`,
      `Nueva clave de estudiante para ${student.alias}: ${res.studentKey}`,
    );
  }

  function slip(alias, key) {
    return el(
      "div",
      { class: "cls-slip" },
      el("strong", {}, title || S("Your class", "Tu clase")),
      el("p", {}, `${S("Class code", "Código de clase")}: ${code}`),
      el("p", {}, `${S("Nickname", "Apodo")}: ${alias || "________________"}`),
      el("p", {}, `${S("Student key", "Clave de estudiante")}: ${key || "________________"}`),
      el("p", { class: "fine" }, url),
    );
  }

  function draw() {
    rows.replaceChildren(
      ...(students.length
        ? students.map((s) =>
            el(
              "tr",
              {},
              el("th", { scope: "row" }, s.alias),
              el(
                "td",
                { class: keys.has(s.studentId) ? "cls-keybig" : "fine" },
                keys.get(s.studentId) ||
                  S(
                    "Shown once at join. Reset to print a new one.",
                    "Se muestra una vez al unirse. Restablécela para imprimir una nueva.",
                  ),
              ),
              el(
                "td",
                {},
                el(
                  "button",
                  {
                    type: "button",
                    class: "btn small ghost",
                    "data-ct-reset": s.studentId,
                    onclick: () => reset(s),
                  },
                  S("Reset key", "Restablecer clave"),
                ),
              ),
            ),
          )
        : [
            el(
              "tr",
              {},
              el(
                "td",
                { colspan: "3" },
                S(
                  "No students yet. The slips below print blank so students can fill them in.",
                  "Todavía no hay estudiantes. Las tiras de abajo se imprimen en blanco para que los estudiantes las llenen.",
                ),
              ),
            ),
          ]),
    );
    slips.replaceChildren(
      ...(students.length
        ? students.map((s) => slip(s.alias, keys.get(s.studentId)))
        : Array.from({ length: 6 }, () => slip("", ""))),
    );
  }

  function setKey(studentId, key) {
    keys.set(studentId, key);
    draw();
  }

  draw();
  return {
    node,
    setKey,
    update(list) {
      const next = Array.isArray(list) ? list : [];
      const sig = (l) => l.map((x) => `${x.studentId}:${x.alias}`).join("|");
      if (sig(next) === sig(students)) return; // the roster polls; redraw only on change so focus stays put
      students = next;
      draw();
    },
  };
}
