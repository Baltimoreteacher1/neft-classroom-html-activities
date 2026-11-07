// Live class quiz (/class/quiz): the teacher opens a quiz for the class code, every device shows the same bank item,
// and each learner answers once. Untimed accuracy rounds: nothing counts down, nothing is ranked, no points are taken
// away. The server judges each answer, so this page only reports which option was chosen.
import { crumbsHTML } from "../components.js";
import { isEarlyBand } from "../bands.js";
import { findActivity } from "../content.js";
import { api, loadLink } from "../class/link.js";
import { el, errorText } from "../class/dom.js";
import { loadQuizKey } from "../class/quiz-key.js";
import { i18nFor } from "../i18n.js";
import { canSpeak, speak } from "../speech.js";
import { BASE, html } from "../util.js";

const POLL_MS = 3000;
let cleanup = null;

export function render(ctx) {
  const I = i18nFor(ctx);
  return {
    title: I.S("Live class quiz", "Cuestionario de clase en vivo"),
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], [I.S("My class", "Mi clase"), `${BASE}/class`], [I.S("Live quiz", "Cuestionario en vivo"), null]])}
      <section class="cls-page" aria-labelledby="clqTitle">
        <header class="cls-head">
          <h1 id="clqTitle" tabindex="-1">${I.T("Live class quiz", "Cuestionario de clase en vivo")}</h1>
          <p>${I.T("Answer each question when you are ready. There is no timer. Your first answer counts, and your teacher moves the class to the next question.", "Responde cada pregunta cuando estés listo. No hay cronómetro. Cuenta tu primera respuesta y tu maestro o maestra pasa a la clase a la siguiente pregunta.")}</p>
        </header>
        <div id="clqRoot" data-nsr-ignore></div>
      </section>`,
  };
}

export const unmount = () => {
  cleanup?.();
  cleanup = null;
};

export function mount(root, ctx) {
  unmount();
  const S = i18nFor(ctx).S;
  const host = root.querySelector("#clqRoot");
  if (!host) return;
  const link = loadLink();
  if (!link) {
    host.append(el("p", {}, S("Join your class first.", "Primero únete a tu clase."), " ", el("a", { class: "btn", href: `${BASE}/class` }, S("Join a class", "Unirse a una clase"))));
    return;
  }
  let roomId = null;
  let shown = null; // `${roomId}:${item}` currently drawn
  let answered = null; // { key, correct }
  let right = 0;
  let timer = null;
  let key = { items: {} };

  const say = (children) => host.replaceChildren(...[].concat(children));

  async function drawItem(state) {
    const itemId = state.config.itemIds[state.item];
    const meta = key.items[itemId];
    const found = await findActivity(itemId, meta ? { band: meta.band, domain: meta.domain } : {});
    const item = found?.activity;
    const mark = `${state.roomId}:${state.item}`;
    if (!item) return say(el("p", { role: "alert" }, S("This question could not load.", "No se pudo cargar esta pregunta.")));
    const mine = state.mine ? { choice: state.mine.answer } : answered?.key === mark ? { choice: answered.choice } : null;
    const lock = (choice) => (mine ? "disabled" : null);
    const fb = el("div", { class: "cls-feedback", role: "status", "aria-live": "polite" });
    const buttons = item.options.map((o) =>
      el("button", { type: "button", class: `cls-option${mine?.choice === o.id ? " is-chosen" : ""}`, "aria-pressed": mine?.choice === o.id ? "true" : "false", disabled: lock(), "data-opt": o.id }, o.text),
    );
    const showResult = (correct) => {
      fb.replaceChildren(
        el("p", { class: correct ? "cls-right" : "cls-try" }, correct ? S("Right.", "Correcto.") : S("Not this time.", "Esta vez no.")),
        el("p", {}, correct ? item.correct : item.hint),
      );
    };
    if (answered?.key === mark) showResult(answered.correct);
    for (const b of buttons)
      b.addEventListener("click", async () => {
        for (const x of buttons) x.disabled = true;
        const res = await api.roomRespond(link, { roomId: state.roomId, item: state.item, answer: b.dataset.opt });
        if (!res.ok) {
          fb.textContent = res.error === "room-not-live" ? S("Your teacher paused the class. Hold on to your answer.", "Tu maestro o maestra pausó la clase. Guarda tu respuesta.") : errorText(S, res.error);
          for (const x of buttons) x.disabled = false;
          return;
        }
        if (res.recorded) {
          answered = { key: mark, choice: b.dataset.opt, correct: res.correct === true };
          if (res.correct) right += 1;
          b.classList.add("is-chosen");
          showResult(res.correct === true);
        } else fb.textContent = S("Your first answer already counts for this question.", "Tu primera respuesta ya cuenta para esta pregunta.");
      });
    // Audio-first bands (K, 1, 2-3) hear the question and the choices; reading is never required to answer.
    const listen =
      meta && isEarlyBand(meta.band) && canSpeak()
        ? el("button", { type: "button", class: "btn", "data-cls-listen": true, onclick: () => speak([item.prompt, ...item.options.map((o) => o.text)], { lang: "en-US", rate: 0.85 }) }, S("Listen to the question", "Escuchar la pregunta"))
        : null;
    const accuracy = el("p", { class: "fine", "data-cls-progress": true }, S(`${state.answered} of ${state.students} classmates have answered. The class has ${state.classScore ?? 0} right answers so far.`, `${state.answered} de ${state.students} compañeros han respondido. La clase lleva ${state.classScore ?? 0} respuestas correctas.`));
    say(
      el(
        "article",
        { class: "cls-card cls-question" },
        el("p", { class: "fine" }, S(`Question ${state.item + 1} of ${state.config.count}`, `Pregunta ${state.item + 1} de ${state.config.count}`)),
        item.passage ? el("blockquote", { lang: "en" }, item.passageTitle ? el("strong", {}, item.passageTitle, el("br")) : null, item.passage) : null,
        el("h2", { lang: "en" }, item.prompt),
        listen,
        el("div", { class: "cls-options", role: "group", "aria-label": S("Choose one answer", "Elige una respuesta") }, buttons),
        fb,
        accuracy,
        state.reveal && state.wall?.length ? el("ul", { class: "cls-wall", "aria-label": S("Class answers", "Respuestas de la clase") }, state.wall.map((w) => el("li", {}, `${item.options.find((o) => o.id === w.answer)?.text || w.answer}: ${w.count}`))) : null,
      ),
    );
    shown = mark + (state.reveal ? ":r" : "");
  }

  async function tick() {
    const rooms = await api.activeRooms(link);
    if (!rooms.ok) return say(el("p", { role: "alert" }, errorText(S, rooms.error)));
    const quiz = (rooms.rooms || []).find((r) => r.kind === "quiz");
    if (!quiz) {
      roomId = null;
      shown = null;
      return say(el("p", { role: "status" }, S("No quiz is open right now. This page checks again by itself.", "No hay un cuestionario abierto ahora. Esta página vuelve a revisar sola.")));
    }
    roomId = quiz.roomId;
    const state = await api.roomState(link, roomId);
    if (!state.ok) return;
    if (state.status === "lobby") return say(el("p", { role: "status" }, S("You are in. Wait for your teacher to start.", "Ya estás dentro. Espera a que tu maestro o maestra empiece.")));
    if (state.status === "ended") return say(el("p", { role: "status" }, S(`The quiz is over. You got ${right} right on this device. Practice is practice, not a test result.`, `El cuestionario terminó. Acertaste ${right} en este dispositivo. La práctica es práctica, no un resultado de examen.`)));
    const sig = `${state.roomId}:${state.item}${state.reveal ? ":r" : ""}`;
    if (shown !== sig) await drawItem(state);
    else {
      const node = host.querySelector("[data-cls-progress]");
      if (node) node.textContent = S(`${state.answered} of ${state.students} classmates have answered. The class has ${state.classScore ?? 0} right answers so far.`, `${state.answered} de ${state.students} compañeros han respondido. La clase lleva ${state.classScore ?? 0} respuestas correctas.`);
    }
  }

  loadQuizKey().then((k) => {
    key = k;
    tick();
    timer = setInterval(() => {
      if (!document.hidden) tick();
    }, POLL_MS);
  });
  cleanup = () => clearInterval(timer);
}
