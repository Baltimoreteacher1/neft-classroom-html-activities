// Teacher side of the Language Page class platform (docs/class-platform.md), mounted in two places from this ONE
// module: the Teacher Hub (/access-teacher/, both hosts) and the lab's own /class/teacher view. Local mode is
// untouched: the Hub's browser-local panels keep working whether or not a class is open here.
//
// Auth: creating a class needs the site teacher key (kept for this tab only); each class also has its own passcode,
// remembered on this device, so a projector or phone can reopen one class without the site key.
import { createTeacherClient } from "../../../shared/class-platform/client.js";
import { goalProgress, joinUrl } from "../../../shared/class-platform/contract.js";
import { qrSvg } from "../../../shared/qr/qr-code.mjs";
import { BAND_INFO, CONTENT_BANDS } from "../bands.js";
import { findActivity, loadIndex, loadUnits } from "../content.js";
import { BASE, safeJson } from "../util.js";
import { ASSIGN_DOMAINS, UNITS_ASSIGN, assignableActivities, assignableUnitStops, assignmentBandText, assignmentLabel, toAssignment } from "./assign.js";
import { el, errorText, toBase64 } from "./dom.js";
import { itemsFor, loadQuizKey } from "./quiz-key.js";

const CLASSES_KEY = "accessPracticeLabClass:v1:teacher-classes";
const SITE_KEY = "accessPracticeLabClass:v1:site-key";
const ROSTER_MS = 10_000;
const ROOM_MS = 3000;

const store = {
  read: () => {
    try {
      const list = safeJson(localStorage.getItem(CLASSES_KEY), []);
      return Array.isArray(list) ? list.filter((c) => c && typeof c.code === "string") : [];
    } catch {
      return [];
    }
  },
  write: (list) => {
    try {
      localStorage.setItem(CLASSES_KEY, JSON.stringify(list.slice(0, 12)));
    } catch {}
  },
};
const siteKey = () => {
  try {
    return sessionStorage.getItem(SITE_KEY) || "";
  } catch {
    return "";
  }
};

const seenText = (S, ms, now) => {
  const mins = Math.max(0, Math.round((now - ms) / 60000));
  if (mins < 2) return S("just now", "justo ahora");
  return mins < 120 ? S(`${mins} min ago`, `hace ${mins} min`) : S(`${Math.round(mins / 60)} h ago`, `hace ${Math.round(mins / 60)} h`);
};

export function mountClassPanel(root, { S = (en) => en, fetchImpl = (...a) => fetch(...a), origin = location.origin } = {}) {
  let api = null;
  let current = null;
  const timers = [];
  const stopTimers = () => {
    while (timers.length) clearInterval(timers.pop());
  };
  const live = el("p", { class: "visually-hidden", role: "status", "aria-live": "polite" });

  function entry() {
    stopTimers();
    api = null;
    current = null;
    const saved = store.read();
    const keyInput = el("input", { id: "ctKey", type: "password", autocomplete: "off", value: siteKey() });
    const title = el("input", { id: "ctTitle", maxlength: "40", autocomplete: "off" });
    const code = el("input", { id: "ctCode", maxlength: "12", autocapitalize: "characters", autocomplete: "off" });
    const pass = el("input", { id: "ctPass", type: "password", autocomplete: "off" });
    const err = el("p", { class: "cls-error", role: "alert" });
    const open = (c) => {
      current = c;
      api = createTeacherClient({ fetchImpl, code: c.code, passcode: c.passcode, siteKey });
      dashboard();
    };
    root.replaceChildren(
      live,
      el("h3", {}, S("Language Page classes", "Clases de The Language Page")),
      el("p", { class: "fine" }, S("Live classes keep student practice on every device and let you assign work, run a live quiz and send voice notes. Everything here also works without a class: the browser-only panels below are unchanged.", "Las clases en vivo mantienen la práctica del estudiante en todos sus dispositivos y te permiten asignar tareas, hacer un cuestionario en vivo y enviar notas de voz. Todo esto también funciona sin clase: los paneles de abajo, que solo usan este navegador, no cambian.")),
      saved.length
        ? el("ul", { class: "cls-list" }, saved.map((c) => el("li", {}, el("button", { type: "button", class: "btn", onclick: () => open(c) }, `${S("Open", "Abrir")} ${c.title || c.code} (${c.code})`))))
        : null,
      el(
        "form",
        { class: "cls-card", onsubmit: async (e) => {
          e.preventDefault();
          err.textContent = "";
          if (keyInput.value) sessionStorage.setItem(SITE_KEY, keyInput.value);
          const res = await createTeacherClient({ fetchImpl, siteKey }).create("language", title.value || S("My class", "Mi clase"));
          if (!res.ok) {
            err.textContent = res.httpStatus === 401 ? S("The teacher key was not accepted.", "No se aceptó la clave de maestro.") : errorText(S, res.error);
            return;
          }
          const c = { code: res.code, passcode: res.teacherPasscode, title: title.value || S("My class", "Mi clase") };
          store.write([c, ...store.read().filter((x) => x.code !== c.code)]);
          open(c);
        } },
        el("h4", {}, S("Create a class", "Crear una clase")),
        el("label", { for: "ctTitle" }, S("Class name", "Nombre de la clase")), title,
        el("label", { for: "ctKey" }, S("Teacher key (this tab only)", "Clave de maestro (solo esta pestaña)")), keyInput,
        el("button", { type: "submit", class: "btn btn-primary" }, S("Create class", "Crear clase")),
      ),
      el(
        "form",
        { class: "cls-card", onsubmit: (e) => {
          e.preventDefault();
          const c = { code: code.value.toUpperCase().replace(/[^A-Z2-9]/g, ""), passcode: pass.value, title: "" };
          store.write([c, ...store.read().filter((x) => x.code !== c.code)]);
          open(c);
        } },
        el("h4", {}, S("Open a class with its passcode", "Abrir una clase con su código de acceso")),
        el("label", { for: "ctCode" }, S("Class code", "Código de clase")), code,
        el("label", { for: "ctPass" }, S("Teacher passcode", "Código de acceso del maestro")), pass,
        el("button", { type: "submit", class: "btn" }, S("Open class", "Abrir clase")),
      ),
      err,
    );
  }

  async function dashboard() {
    const url = joinUrl(`${origin}${BASE}/class`, current.code);
    let svg = "";
    try {
      svg = qrSvg(url, { px: 160, label: S("QR code to join the class", "Código QR para unirse a la clase") });
    } catch {}
    const rosterBody = el("tbody");
    const goalLine = el("p", { class: "fine" });
    const assignBox = el("div");
    const quizBox = el("div");
    const notesBox = el("div");
    const header = el(
      "div",
      { class: "cls-card" },
      el("h3", {}, current.title || S("Your class", "Tu clase")),
      el("p", {}, `${S("Class code", "Código de clase")}: `, el("strong", { class: "cls-keybig" }, current.code), ` · ${S("Teacher passcode", "Código de acceso del maestro")}: `, el("strong", {}, current.passcode || "—")),
      el("p", {}, el("a", { href: url }, url)),
      svg ? el("div", { class: "cls-qr", }) : null,
      el("div", { class: "row-actions" },
        el("button", { type: "button", class: "btn", onclick: () => navigator.clipboard?.writeText(url).then(() => (live.textContent = S("Join link copied.", "Enlace copiado."))) }, S("Copy join link", "Copiar enlace")),
        el("button", { type: "button", class: "btn ghost", onclick: entry }, S("Close class view", "Cerrar vista de clase")),
      ),
    );
    if (svg) header.querySelector(".cls-qr").innerHTML = svg;
    root.replaceChildren(
      live,
      header,
      el("section", { class: "cls-card" }, el("h4", {}, S("Students", "Estudiantes")), goalLine,
        el("table", { class: "cls-table" },
          el("thead", {}, el("tr", {}, ["Nickname|Apodo", "Last seen|Visto por última vez", "Evidence this week|Evidencia esta semana", "Days|Días", "Assigned done|Tareas hechas", ""].map((h) => el("th", { scope: "col" }, h ? S(...h.split("|")) : "")))),
          rosterBody)),
      el("section", { class: "cls-card" }, el("h4", {}, S("Assignments", "Tareas")), assignBox),
      el("section", { class: "cls-card" }, el("h4", {}, S("Live class quiz", "Cuestionario de clase en vivo")), quizBox),
      el("section", { class: "cls-card" }, el("h4", {}, S("Recordings and voice notes", "Grabaciones y notas de voz")), notesBox),
      el("section", { class: "cls-card" }, el("button", { type: "button", class: "btn ghost", onclick: async () => {
        const typed = prompt(S("Type the class code to delete this class and everything in it.", "Escribe el código de clase para eliminar esta clase y todo lo que contiene."));
        if (typed && (await api.remove(typed)).ok) { store.write(store.read().filter((c) => c.code !== current.code)); entry(); }
      } }, S("Delete this class", "Eliminar esta clase"))),
    );
    let roster = null;
    const loadRoster = async () => {
      const res = await api.roster();
      if (!res.ok) {
        live.textContent = res.httpStatus === 401 ? S("The passcode or teacher key was not accepted.", "No se aceptó el código de acceso ni la clave de maestro.") : errorText(S, res.error);
        return;
      }
      roster = res;
      const now = Date.now();
      rosterBody.replaceChildren(...(res.students.length ? res.students.map((s) => {
        const sum = s.docs?.language?.summary || {};
        const ids = (res.settings?.assignments || []).map((a) => a.id);
        return el("tr", {}, el("th", { scope: "row" }, s.alias), el("td", {}, seenText(S, s.lastSeen, now)), el("td", {}, String(sum.weekEvidence ?? 0)), el("td", {}, String(sum.weekDays ?? 0)), el("td", {}, ids.length ? `${(sum.assignmentsDone || []).filter((id) => ids.includes(id)).length}/${ids.length}` : "—"),
          el("td", {}, el("button", { type: "button", class: "btn small ghost", onclick: async () => { const r = await api.resetStudent(s.studentId); live.textContent = r.ok ? S(`New student key for ${s.alias}: ${r.studentKey}`, `Nueva clave de estudiante para ${s.alias}: ${r.studentKey}`) : errorText(S, r.error); } }, S("Reset key", "Restablecer clave"))));
      }) : [el("tr", {}, el("td", { colspan: "6" }, S("No students yet. Share the class code, link or QR.", "Todavía no hay estudiantes. Comparte el código, el enlace o el QR.")))]));
      const goal = goalProgress(res.settings?.goal, res.students.map((s) => s.docs?.language?.summary));
      goalLine.textContent = goal ? S(`Class goal: ${goal.value} of ${goal.target} ${goal.label || ""}`, `Meta de la clase: ${goal.value} de ${goal.target} ${goal.label || ""}`) : "";
      drawAssignments();
    };
    async function saveAssignments(list) {
      const res = await api.settings({ assignments: list });
      live.textContent = res.ok ? S("Assignments saved.", "Tareas guardadas.") : errorText(S, res.error);
      if (res.ok) loadRoster();
    }
    async function drawAssignments() {
      const index = await loadIndex();
      const band = el("select", { "aria-label": S("Grade band", "Grupo de grados") }, CONTENT_BANDS.map((b) => el("option", { value: b }, S(BAND_INFO[b].label, BAND_INFO[b].labelEs))));
      band.value = "6-8";
      const domain = el("select", { "aria-label": S("Skill", "Destreza") }, [...ASSIGN_DOMAINS, UNITS_ASSIGN].map((d) => el("option", { value: d }, d === UNITS_ASSIGN ? S("Units", "Unidades") : d)));
      const pick = el("select", { "aria-label": S("Activity", "Actividad") });
      let rows = [];
      const fill = async () => {
        rows = domain.value === UNITS_ASSIGN ? assignableUnitStops((await loadUnits(band.value))?.units, band.value) : assignableActivities(index, band.value, domain.value);
        pick.replaceChildren(...(rows.length ? rows.map((r, n) => el("option", { value: String(n) }, assignmentLabel(S, r))) : [el("option", { value: "" }, S("No activities for that choice", "No hay actividades para esa opción"))]));
      };
      band.onchange = domain.onchange = fill;
      fill();
      const list = roster?.settings?.assignments || [];
      assignBox.replaceChildren(
        list.length ? el("ul", { class: "cls-list" }, list.map((a) => el("li", {}, a.title || a.id, el("span", { class: "fine" }, ` · ${assignmentBandText(S, a.path)} `), el("button", { type: "button", class: "btn small ghost", onclick: () => saveAssignments(list.filter((x) => x.id !== a.id)) }, S("Remove", "Quitar"))))) : el("p", {}, S("Nothing assigned yet.", "Todavía no hay tareas asignadas.")),
        el("div", { class: "row-actions" }, band, domain, pick, el("button", { type: "button", class: "btn", onclick: () => {
          const row = rows[Number(pick.value)];
          if (!row || list.some((a) => a.id === row.id)) return;
          saveAssignments([...list, toAssignment(row)]);
        } }, S("Assign", "Asignar"))),
      );
    }
    loadRoster();
    timers.push(setInterval(() => !document.hidden && loadRoster(), ROSTER_MS));
    drawQuiz(quizBox);
    drawNotes(notesBox);
  }

  async function drawQuiz(box) {
    const key = await loadQuizKey();
    const bands = CONTENT_BANDS.filter((b) => itemsFor(key, { band: b }).length);
    const band = el("select", { "aria-label": S("Grade band", "Grupo de grados") }, bands.map((b) => el("option", { value: b }, S(BAND_INFO[b].label, BAND_INFO[b].labelEs))));
    if (bands.includes("6-8")) band.value = "6-8";
    const domain = el("select", { "aria-label": S("Skill", "Destreza") });
    const fillDomains = () => domain.replaceChildren(...ASSIGN_DOMAINS.filter((d) => itemsFor(key, { band: band.value, domain: d }).length).map((d) => el("option", { value: d }, d)));
    band.onchange = fillDomains;
    fillDomains();
    const count = el("input", { type: "number", min: "1", max: "12", value: "6", "aria-label": S("Questions", "Preguntas") });
    const stage = el("div", { "aria-live": "polite" });
    let roomId = null;
    const control = async (change) => {
      const res = await api.control(roomId, change);
      if (!res.ok) live.textContent = errorText(S, res.error);
      showState();
    };
    async function showState() {
      if (!roomId) return;
      const st = await api.detail(roomId);
      if (!st.ok) return;
      const found = await findActivity(st.config.itemIds[st.item], key.items[st.config.itemIds[st.item]] || {});
      const item = found?.activity;
      stage.replaceChildren(
        el("p", {}, S(`Question ${st.item + 1} of ${st.config.count} · ${st.status}`, `Pregunta ${st.item + 1} de ${st.config.count} · ${st.status}`)),
        item ? el("p", { lang: "en" }, el("strong", {}, item.prompt)) : null,
        el("p", {}, S(`${st.answered} of ${st.students} answered · class right answers: ${st.classScore ?? 0}`, `${st.answered} de ${st.students} respondieron · respuestas correctas de la clase: ${st.classScore ?? 0}`)),
        st.reveal && st.wall?.length ? el("ul", {}, st.wall.map((w) => el("li", {}, `${item?.options?.find((o) => o.id === w.answer)?.text || w.answer}: ${w.count}${w.answer === key.items[st.config.itemIds[st.item]]?.answer ? " (correct)" : ""}`))) : null,
        el("div", { class: "row-actions" },
          el("button", { type: "button", class: "btn", onclick: () => control({ status: "live" }) }, S("Start / resume", "Empezar / continuar")),
          el("button", { type: "button", class: "btn", onclick: () => control({ status: "paused" }) }, S("Pause", "Pausar")),
          el("button", { type: "button", class: "btn", onclick: () => control({ reveal: true }) }, S("Show class answers", "Mostrar respuestas de la clase")),
          el("button", { type: "button", class: "btn", disabled: st.item + 1 >= st.config.count, onclick: () => control({ item: st.item + 1 }) }, S("Next question", "Siguiente pregunta")),
          el("button", { type: "button", class: "btn ghost", onclick: () => control({ status: "ended" }) }, S("End quiz", "Terminar cuestionario")),
        ),
      );
    }
    box.replaceChildren(
      el("p", { class: "fine" }, S("Untimed accuracy rounds from the lab's item bank. Learners answer on their own devices; you move the class forward.", "Rondas de precisión sin tiempo con las preguntas del laboratorio. Los estudiantes responden en sus dispositivos; tú avanzas a la clase.")),
      el("div", { class: "row-actions" }, band, domain, count, el("button", { type: "button", class: "btn btn-primary", onclick: async () => {
        const pool = itemsFor(key, { band: band.value, domain: domain.value });
        if (!pool.length) { live.textContent = S("No quiz questions for that choice.", "No hay preguntas de cuestionario para esa opción."); return; }
        const n = Math.max(1, Math.min(Number(count.value) || 6, pool.length));
        const res = await api.openRoom("quiz", { title: `${domain.value} quiz`, itemIds: pool.slice(0, n).map((p) => p.id) });
        if (!res.ok) { live.textContent = errorText(S, res.error); return; }
        roomId = res.roomId;
        showState();
        timers.push(setInterval(() => !document.hidden && showState(), ROOM_MS));
      } }, S("Open quiz", "Abrir cuestionario"))),
      stage,
    );
  }

  async function drawNotes(box) {
    const res = await api.audioList();
    const items = res.ok ? res.items || [] : [];
    const recordings = items.filter((i) => i.kind === "recording");
    const notesOf = (id) => items.filter((i) => i.parentId === id);
    const player = async (item) => {
      const audio = el("audio", { controls: true, preload: "none", "aria-label": item.label || "audio" });
      audio.addEventListener("play", async () => {
        if (audio.src) return;
        const blob = await api.audioBlob(item.audioId);
        if (blob) { audio.src = URL.createObjectURL(blob); audio.play().catch(() => {}); }
      }, { once: true });
      return audio;
    };
    const rows = await Promise.all(recordings.map(async (r) => {
      let recorder = null;
      let chunks = [];
      const status = el("span", { class: "fine", role: "status" });
      const btn = el("button", { type: "button", class: "btn small" }, S("Record a voice note", "Grabar una nota de voz"));
      btn.addEventListener("click", async () => {
        if (recorder) { recorder.stop(); return; }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          recorder = new MediaRecorder(stream);
          chunks = [];
          recorder.ondataavailable = (e) => chunks.push(e.data);
          recorder.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
            recorder = null;
            btn.textContent = S("Record a voice note", "Grabar una nota de voz");
            const sent = await api.audioNote({ parentId: r.audioId, label: S("Note from your teacher", "Nota de tu maestro o maestra"), mime: blob.type, data: await toBase64(blob) });
            status.textContent = sent.ok ? S("Sent.", "Enviada.") : errorText(S, sent.error);
            if (sent.ok) drawNotes(box);
          };
          recorder.start();
          btn.textContent = S("Stop and send", "Detener y enviar");
        } catch { status.textContent = S("The microphone is not available.", "El micrófono no está disponible."); }
      });
      return el("li", {}, el("strong", {}, `${r.alias || ""} — ${r.label || S("Recording", "Grabación")}`), " ", await player(r), " ", btn, " ", status, notesOf(r.audioId).length ? el("span", { class: "fine" }, ` ${S("Notes sent", "Notas enviadas")}: ${notesOf(r.audioId).length}, ${S("heard", "escuchadas")}: ${notesOf(r.audioId).filter((n) => n.heard).length}`) : null);
    }));
    box.replaceChildren(rows.length ? el("ul", { class: "cls-list" }, rows) : el("p", {}, S("No recordings yet. Learners choose to send one from a Speaking task. Recordings are kept for 30 days.", "Todavía no hay grabaciones. Los estudiantes eligen enviar una desde una tarea de Hablar. Las grabaciones se guardan 30 días.")));
  }

  entry();
  return { unmount: stopTimers };
}
