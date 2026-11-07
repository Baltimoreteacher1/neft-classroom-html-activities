// My class (/class): join a class by code or QR link, see assignments, hear a teacher's voice notes, and send a
// practice recording to the teacher. The class copy of progress is opt-in and merges into this device (class/link.js);
// the lab works exactly as before for a learner who never joins.
import { classInfo, joinClass } from "../../../shared/class-platform/client.js";
import { normalizeCode } from "../../../shared/class-platform/contract.js";
import { crumbsHTML } from "../components.js";
import { api, languageSummary, leaveClass, loadLink, saveLink, setAssignments, startSync } from "../class/link.js";
import { assignmentBandText } from "../class/assign.js";
import { el, errorText, statusText } from "../class/dom.js";
import { i18nFor } from "../i18n.js";
import { BASE, html } from "../util.js";
import { loadVoiceNotes } from "../class/voice.js";

let cleanup = null;

export function render(ctx) {
  const I = i18nFor(ctx);
  return {
    title: I.S("My class", "Mi clase"),
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], [I.S("My class", "Mi clase"), null]])}
      <section class="cls-page" aria-labelledby="clsTitle">
        <header class="cls-head">
          <h1 id="clsTitle" tabindex="-1">${I.T("My class", "Mi clase")}</h1>
          <p>${I.T("Join your teacher's class to keep your practice on every device, see what your teacher assigned, and hear voice notes about your speaking. It is optional: the lab works without it.", "Únete a la clase de tu maestro o maestra para tener tu práctica en todos tus dispositivos, ver las tareas asignadas y escuchar notas de voz sobre tu expresión oral. Es opcional: el laboratorio funciona sin esto.")}</p>
        </header>
        <div id="clsRoot" data-nsr-ignore></div>
        <p class="fine">${I.T("Practice is practice. It is not a test and does not estimate an ACCESS result. Your teacher sees counts of what you practiced, never your recordings unless you send one.", "La práctica es práctica. No es una prueba ni estima un resultado de ACCESS. Tu maestro o maestra ve cuántas cosas practicaste, y nunca tus grabaciones a menos que tú envíes una.")}</p>
      </section>`,
  };
}

export function unmount() {
  cleanup?.();
  cleanup = null;
}

export function mount(root, ctx) {
  unmount();
  const I = i18nFor(ctx);
  const S = I.S;
  const host = root.querySelector("#clsRoot");
  if (!host) return;
  let status = null;
  let info = null;
  let notes = [];
  let timer = null;
  let shownKey = ""; // the student key, shown until the learner says they wrote it down
  const live = (msg) => {
    const node = host.querySelector("[data-cls-live]");
    if (node) node.textContent = msg;
  };

  const assignmentIds = () => (info?.assignments || []).map((a) => a.id);
  const setInfo = (next) => {
    info = next;
    setAssignments(next?.assignments);
  };
  const sync = () =>
    startSync({
      onStatus: (s) => {
        status = s;
        live(statusText(S, s));
        const node = host.querySelector("[data-cls-sync]");
        if (node) node.textContent = statusText(S, s);
      },
      onMerged: () => draw(),
    });

  async function refresh() {
    const link = loadLink();
    if (!link) return;
    const [i, n] = await Promise.all([classInfo(link.code), loadVoiceNotes(link)]);
    if (i.ok) setInfo(i);
    notes = n;
    draw();
  }

  function joinForm(prefill) {
    const code = el("input", { id: "clsCode", name: "code", autocomplete: "off", autocapitalize: "characters", maxlength: "12", value: prefill, required: true });
    const alias = el("input", { id: "clsAlias", name: "alias", autocomplete: "off", maxlength: "20", required: true });
    const key = el("input", { id: "clsKey", name: "key", autocomplete: "off", autocapitalize: "characters", maxlength: "12" });
    const error = el("p", { class: "cls-error", role: "alert", "data-cls-error": true });
    const form = el(
      "form",
      { class: "cls-card cls-join", novalidate: true },
      el("h2", {}, S("Join a class", "Unirse a una clase")),
      el("label", { for: "clsCode" }, S("Class code (6 letters and numbers)", "Código de clase (6 letras y números)")),
      code,
      el("label", { for: "clsAlias" }, S("Your nickname (not your full name)", "Tu apodo (no tu nombre completo)")),
      alias,
      el("label", { for: "clsKey" }, S("Student key (only if you joined before on another device)", "Clave de estudiante (solo si ya te uniste antes en otro dispositivo)")),
      key,
      error,
      el("button", { type: "submit", class: "btn btn-primary" }, S("Join class", "Unirse a la clase")),
    );
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";
      const res = await joinClass({ code: code.value, alias: alias.value, studentKey: key.value || undefined });
      if (!res.ok) {
        error.textContent = errorText(S, res.error);
        return;
      }
      const meta = await classInfo(code.value);
      saveLink({ code: normalizeCode(code.value), studentId: res.studentId, studentKey: res.studentKey, alias: res.alias, title: meta.title || "" });
      setInfo(meta.ok ? meta : null);
      sync().pull();
      shownKey = key.value ? "" : res.studentKey;
      draw();
      refresh();
    });
    return form;
  }

  function assignmentCards() {
    const list = info?.assignments || [];
    const done = new Set(languageSummary({ assignmentIds: assignmentIds() }).assignmentsDone);
    return el(
      "section",
      { class: "cls-card", "aria-labelledby": "clsAssignH" },
      el("h2", { id: "clsAssignH" }, S("Assigned practice", "Práctica asignada")),
      list.length
        ? el(
            "ul",
            { class: "cls-list" },
            list.map((a) =>
              el(
                "li",
                {},
                el("a", { href: a.path }, a.title || a.id),
                el("span", { class: "fine" }, ` · ${assignmentBandText(S, a.path)}`),
                a.due ? el("span", { class: "fine" }, ` · ${S("due", "para el")} ${a.due}`) : null,
                el("span", { class: done.has(a.id) ? "cls-done" : "cls-todo" }, ` ${done.has(a.id) ? S("Done", "Hecho") : S("To do", "Por hacer")}`),
              ),
            ),
          )
        : el("p", {}, S("Nothing assigned yet.", "Todavía no hay tareas asignadas.")),
    );
  }

  function notesCard(link) {
    const audioNotes = notes.filter((n) => n.kind === "note");
    const card = el("section", { class: "cls-card", "aria-labelledby": "clsNotesH" }, el("h2", { id: "clsNotesH" }, S("My teacher's voice notes", "Notas de voz de mi maestro o maestra")));
    if (!audioNotes.length) {
      card.append(el("p", {}, S("No voice notes yet. Open a Speaking task, record, and press \"Send to my teacher\" to get one.", "Todavía no hay notas de voz. Abre una tarea de Hablar, graba y presiona \"Enviar a mi maestro\" para recibir una.")));
      return card;
    }
    for (const note of audioNotes) {
      const player = el("audio", { controls: true, preload: "none", "aria-label": note.label || S("Voice note", "Nota de voz") });
      let loaded = false;
      player.addEventListener("play", async () => {
        if (!loaded) {
          loaded = true;
          const blob = await api.audioBlob(link, note.audioId);
          if (!blob) return;
          player.src = URL.createObjectURL(blob);
          player.play().catch(() => {});
        }
        if (!note.heard) {
          note.heard = true;
          api.audioHeard(link, note.audioId);
        }
      });
      card.append(el("div", { class: "cls-note" }, el("strong", {}, note.label || S("Note from your teacher", "Nota de tu maestro o maestra")), note.heard ? el("span", { class: "fine" }, ` · ${S("heard", "escuchada")}`) : el("span", { class: "cls-new" }, ` · ${S("new", "nueva")}`), el("br"), player));
    }
    return card;
  }

  function draw() {
    const link = loadLink();
    host.replaceChildren();
    host.append(el("p", { class: "visually-hidden", role: "status", "aria-live": "polite", "data-cls-live": true }));
    if (!link) {
      host.append(joinForm(normalizeCode(new URLSearchParams(location.search).get("class") || "")));
      return;
    }
    if (shownKey)
      host.append(
        el("section", { class: "cls-card cls-key", role: "alert" }, el("h2", {}, S("Write down your student key", "Anota tu clave de estudiante")), el("p", { class: "cls-keybig" }, shownKey), el("p", {}, S("You will not see it again. You need it to rejoin from another device. Your teacher can reset it.", "No la volverás a ver. La necesitas para volver a entrar desde otro dispositivo. Tu maestro o maestra puede restablecerla.")), el("button", { type: "button", class: "btn", onclick: () => { shownKey = ""; draw(); } }, S("I wrote it down", "Ya la anoté"))),
      );
    host.append(
      el(
        "section",
        { class: "cls-card" },
        el("h2", {}, link.title || S("Your class", "Tu clase")),
        el("p", {}, `${S("Nickname", "Apodo")}: ${link.alias} · ${S("Class code", "Código de clase")}: ${link.code}`),
        el("p", { "data-cls-sync": true }, statusText(S, status)),
        el("div", { class: "row-actions" },
          el("button", { type: "button", class: "btn", onclick: () => sync().push().then(() => sync().pull()) }, S("Sync now", "Sincronizar ahora")),
          el("a", { class: "btn", href: `${BASE}/class/quiz` }, S("Join the live quiz", "Unirse al cuestionario en vivo")),
          el("button", { type: "button", class: "btn ghost", onclick: () => { if (confirm(S("Leave this class on this device? Your practice stays here.", "¿Salir de esta clase en este dispositivo? Tu práctica se queda aquí."))) { leaveClass(); setInfo(null); draw(); } } }, S("Leave class", "Salir de la clase")),
        ),
      ),
      assignmentCards(),
      notesCard(link),
    );
  }

  draw();
  if (loadLink()) {
    sync().pull();
    refresh();
    timer = setInterval(refresh, 30_000);
  }
  cleanup = () => clearInterval(timer);
}
