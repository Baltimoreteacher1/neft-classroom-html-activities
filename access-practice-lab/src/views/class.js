// My class (/class): join a class by code or QR link, see assignments, hear a teacher's voice notes, and send a
// practice recording to the teacher. The class copy of progress is opt-in and merges into this device (class/link.js);
// the lab works exactly as before for a learner who never joins.
import { classInfo } from "../../../shared/class-platform/client.js";
import { crumbsHTML } from "../components.js";
import { feedbackCard, loadMyReviews } from "../class/feedback-card.js";
import { api, languageSummary, leaveClass, loadLink, refreshClassSupport, setAssignments, startSync } from "../class/link.js";
import { assignmentBandText } from "../class/assign.js";
import { el, errorText, statusText } from "../class/dom.js";
import { learnerStatusRow } from "../class/assign-status-ui.js";
import { i18nFor } from "../i18n.js";
import { BASE, html } from "../util.js";
import { loadVoiceNotes } from "../class/voice.js";
import { flushToClass, joinAndLink, joinCodeFromSearch, signOutDevice } from "../class/session.js";

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
  let reviews = [];
  let statuses = new Map(); // assignment id -> this learner's status (src/class/assign-status-ui.js)
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
    const [i, n, r, st] = await Promise.all([classInfo(link.code), loadVoiceNotes(link), loadMyReviews(api, link), api.astatusMine(link), refreshClassSupport(link)]);
    if (i.ok) setInfo(i);
    notes = n;
    reviews = r;
    statuses = new Map((st?.statuses || []).map((x) => [x.assignmentId, x]));
    draw();
  }

  function joinForm(prefill, withKey = false) {
    const fid = (name) => (withKey ? `clsIn${name}` : `cls${name}`);
    const code = el("input", { id: fid("Code"), name: "code", autocomplete: "off", autocapitalize: "characters", maxlength: "12", value: prefill, required: true });
    const alias = el("input", { id: fid("Alias"), name: "alias", autocomplete: "off", maxlength: "20", required: true });
    const key = withKey ? el("input", { id: "clsKey", name: "key", autocomplete: "off", autocapitalize: "characters", maxlength: "12", required: true }) : null;
    const error = el("p", { class: "cls-error", role: "alert", "data-cls-error": true });
    const form = el(
      "form",
      { class: `cls-card ${withKey ? "cls-signin" : "cls-join"}`, novalidate: true },
      el("h2", {}, withKey ? S("Sign back in", "Volver a entrar") : S("Join your class", "Unirse a tu clase")),
      withKey ? el("p", { class: "fine" }, S("Joined before on another computer? Use the same class code, nickname and student key to get your own work back.", "¿Ya te uniste en otra computadora? Usa el mismo código de clase, apodo y clave de estudiante para recuperar tu trabajo.")) : null,
      el("label", { for: fid("Code") }, S("Class code (6 letters and numbers)", "Código de clase (6 letras y números)")),
      code,
      el("label", { for: fid("Alias") }, S("Your nickname (not your full name)", "Tu apodo (no tu nombre completo)")),
      alias,
      key ? el("label", { for: "clsKey" }, S("Student key (8 letters and numbers)", "Clave de estudiante (8 letras y números)")) : null,
      key,
      error,
      el("button", { type: "submit", class: "btn btn-primary" }, withKey ? S("Sign back in", "Volver a entrar") : S("Join class", "Unirse a la clase")),
    );
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.textContent = "";
      if (key && !key.value.trim()) {
        error.textContent = S("Type your student key.", "Escribe tu clave de estudiante.");
        return;
      }
      const res = await joinAndLink({ code: code.value, alias: alias.value, studentKey: key?.value, start: sync });
      if (!res.ok) {
        error.textContent = errorText(S, res.error);
        return;
      }
      setInfo(res.info);
      shownKey = res.newKey;
      draw();
      refresh();
    });
    return form;
  }

  function assignmentCards() {
    const list = info?.assignments || [];
    const link = loadLink();
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
                statuses.has(a.id)
                  ? learnerStatusRow({
                      S,
                      status: statuses.get(a.id),
                      onAct: async (action) => {
                        const res = await api.astatusAct(link, { assignmentId: a.id, action });
                        live(res.ok ? S("Saved.", "Guardado.") : errorText(S, res.error));
                        await refresh();
                      },
                    })
                  : null,
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

  // In-page confirms (no native confirm()): one box under the class card, kept across the 30 s redraws.
  const confirmBox = el("div", { class: "cls-confirm-host" });
  function confirmPanel(title, body, actions) {
    const heading = el("h2", { tabindex: "-1" }, title);
    const close = () => {
      confirmBox.replaceChildren();
      host.querySelector("[data-cls-signout]")?.focus();
    };
    confirmBox.replaceChildren(
      el("section", { class: "cls-card cls-confirm", role: "group", "aria-label": title },
        heading,
        ...body.map((line) => el("p", {}, line)),
        el("p", { role: "status", "data-cls-confirm-status": true }),
        el("div", { class: "row-actions" },
          ...actions.map(([label, run, primary]) => el("button", { type: "button", class: primary ? "btn btn-primary" : "btn", onclick: () => run(close) }, label)),
          el("button", { type: "button", class: "btn ghost", "data-cls-cancel": true, onclick: close }, S("Cancel", "Cancelar")),
        ),
      ),
    );
    heading.focus();
  }
  const confirmStatus = (text) => {
    const node = confirmBox.querySelector("[data-cls-confirm-status]");
    if (node) node.textContent = text;
  };

  async function signOut(force) {
    if (!force) {
      confirmStatus(S("Saving your work to your class…", "Guardando tu trabajo en tu clase…"));
      const { pending } = await flushToClass();
      if (pending) {
        confirmPanel(
          S("Some work has not reached your class yet", "Parte de tu trabajo aún no llegó a tu clase"),
          [S("This computer is offline or the class did not answer. If you sign out now, your newest work on this computer will be lost.", "Esta computadora no tiene conexión o la clase no respondió. Si sales ahora, se perderá tu trabajo más reciente en esta computadora.")],
          [[S("Try again", "Intentar de nuevo"), () => signOut(false), true], [S("Sign out anyway", "Salir de todos modos"), () => signOut(true)]],
        );
        return;
      }
    }
    confirmStatus(S("Signing out…", "Saliendo…"));
    await signOutDevice();
    location.assign(`${BASE}/class`);
  }

  function askSignOut() {
    const link = loadLink();
    if (!link) return;
    confirmPanel(
      S("Sign out on this computer?", "¿Salir en esta computadora?"),
      [
        S("Your work is saved to your class. Signing out removes your class sign-in and your practice from this computer, so the next student starts fresh.", "Tu trabajo está guardado en tu clase. Al salir se quitan tu ingreso a la clase y tu práctica de esta computadora, para que el siguiente estudiante empiece de cero."),
        S(`To sign back in on any computer you need: class code ${link.code}, nickname ${link.alias}, and your student key. Lost the key? Your teacher can reset it.`, `Para volver a entrar en cualquier computadora necesitas: el código de clase ${link.code}, el apodo ${link.alias} y tu clave de estudiante. ¿Perdiste la clave? Tu maestro o maestra puede restablecerla.`),
      ],
      [[S("Sign out and clear this computer", "Salir y borrar esta computadora"), () => signOut(false), true]],
    );
  }

  function askLeave() {
    confirmPanel(
      S("Leave this class on this device?", "¿Salir de esta clase en este dispositivo?"),
      [S("Your practice stays here and the class keeps its copy. Your work stops saving to the class.", "Tu práctica se queda aquí y la clase guarda su copia. Tu trabajo deja de guardarse en la clase.")],
      [[S("Leave class", "Salir de la clase"), (close) => { leaveClass(); setInfo(null); close(); draw(); }, true]],
    );
  }

  function draw() {
    const link = loadLink();
    const keepFocus = confirmBox.contains(document.activeElement) ? document.activeElement : null;
    host.replaceChildren();
    host.append(el("p", { class: "visually-hidden", role: "status", "aria-live": "polite", "data-cls-live": true }));
    if (!link) {
      const params = new URLSearchParams(location.search);
      const prefill = joinCodeFromSearch(location.search);
      const forms = [joinForm(prefill), joinForm(prefill, true)];
      if (params.has("signin")) forms.reverse();
      host.append(...forms);
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
          el("a", { class: "btn", href: `${BASE}/pairs` }, S("Listening partners", "Parejas para escuchar")),
          el("a", { class: "btn", href: `${BASE}/scenes` }, S("Class scenes", "Escenas de la clase")),
          el("button", { type: "button", class: "btn", "data-cls-signout": true, onclick: () => askSignOut() }, S("Switch student / Sign out on this computer", "Cambiar de estudiante / Salir en esta computadora")),
          el("button", { type: "button", class: "btn ghost", "data-cls-leave": true, onclick: () => askLeave() }, S("Leave class", "Salir de la clase")),
        ),
      ),
      confirmBox,
      assignmentCards(),
      notesCard(link),
    );
    const fbSlot = el("div");
    host.append(fbSlot);
    feedbackCard(S, reviews).then((card) => fbSlot.replaceWith(card));
    keepFocus?.focus();
  }

  draw();
  if (loadLink()) {
    sync().pull();
    refresh();
    timer = setInterval(refresh, 30_000);
  }
  cleanup = () => clearInterval(timer);
}
