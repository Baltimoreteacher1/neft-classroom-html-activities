// Listening partners (/pairs): for learners in a class only. A learner records a short take (up to 60 seconds) for a
// Speaking Studio task and shares it with their partner ONLY. The partner listens, answers one listener question and
// taps one kind reaction (a fixed list; no comments). The speaker sees the answer and checks whether the message
// landed. The teacher sees every take and can remove any of them; takes expire after 14 days.
// Server: functions/_lib/class-platform/pairs.js. Rules: shared/class-platform/social.js.
import {
  checkText,
  LISTENER_QUESTIONS,
  MAX_TAKE_SECONDS,
  QUESTION_FOR_TYPE,
  REACTIONS,
  SCENE_LIMITS,
} from "../../../shared/class-platform/social.js";
import { crumbsHTML } from "../components.js";
import { loadSpeakingTasks } from "../content.js";
import { el, errorText, toBase64 } from "../class/dom.js";
import { loadLink } from "../class/link.js";
import { studentSocial } from "../class/social-api.js";
import { socialErrorText } from "../class/scene-model.js";
import { lazyAudio } from "../class/scene-player.js";
import { i18nFor } from "../i18n.js";
import {
  canRecord,
  clear as clearTakes,
  start as startRecording,
  stop as stopRecording,
} from "../recorder.js";
import { BASE, html } from "../util.js";

const REC_KEY = "class-pairs";
const POLL_MS = 30_000;
let cleanup = null;

export function render(ctx) {
  const I = i18nFor(ctx);
  return {
    title: I.S("Listening partners", "Parejas para escuchar"),
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
        [I.S("My class", "Mi clase"), `${BASE}/class`],
        [I.S("Listening partners", "Parejas para escuchar"), null],
      ])}
      <section class="cls-page" aria-labelledby="prTitle">
        <header class="cls-head">
          <h1 id="prTitle" tabindex="-1">${I.T("Listening partners", "Parejas para escuchar")}</h1>
          <p>
            ${I.T("Record a short answer to a speaking task and share it with your partner. Your partner listens, answers one question about it and sends a kind reaction. Then you see if your message was clear.", "Graba una respuesta corta a una tarea de hablar y compártela con tu pareja. Tu pareja escucha, responde una pregunta y te envía una reacción amable. Luego ves si tu mensaje fue claro.")}
          </p>
        </header>
        <div id="prRoot" data-nsr-ignore></div>
        <p class="fine">
          ${I.T("Only your partner and your teacher can hear what you share. Recordings are deleted after 14 days. This is practice, not a test and not a score.", "Solo tu pareja y tu maestro o maestra pueden escuchar lo que compartes. Las grabaciones se borran después de 14 días. Es práctica, no es una prueba ni un puntaje.")}
        </p>
      </section>`,
  };
}

export function unmount() {
  cleanup?.();
  cleanup = null;
}

const errorFor = (S, code) => socialErrorText(S, code) || errorText(S, code);

export function mount(root, ctx) {
  unmount();
  const S = i18nFor(ctx).S;
  const host = root.querySelector("#prRoot");
  if (!host) return;
  const link = loadLink();
  if (!link) {
    host.append(
      el(
        "section",
        { class: "cls-card" },
        el(
          "p",
          {},
          S(
            "Listening partners are for learners in a class. Join your teacher's class first.",
            "Las parejas para escuchar son para estudiantes de una clase. Primero únete a la clase de tu maestro o maestra.",
          ),
        ),
        el(
          "a",
          { class: "btn btn-primary", href: `${BASE}/class` },
          S("Join my class", "Unirme a mi clase"),
        ),
      ),
    );
    return;
  }
  const api = studentSocial(link);
  const live = el("p", { class: "visually-hidden", role: "status", "aria-live": "polite" });
  const say = (msg) => (live.textContent = msg);
  const Q = (id) => S(...(LISTENER_QUESTIONS[id] || LISTENER_QUESTIONS["main-idea"]));
  const R = (id) => S(...(REACTIONS[id] || ["", ""]));
  let state = null;
  let tasks = [];
  let take = null; // { blob, seconds } of the newest recording, not yet shared
  let recording = false;
  let timer = null;
  const drafts = new Map(); // takeId -> { answer, reaction }

  async function refresh() {
    const res = await api.pairsState();
    if (!res.ok) {
      say(errorFor(S, res.error));
      if (!state)
        host.replaceChildren(
          live,
          el("p", { class: "cls-error", role: "alert" }, errorFor(S, res.error)),
        );
      return;
    }
    state = res;
    draw();
  }

  function partnerCard() {
    const names = (state.partners || []).map((p) => p.alias).join(", ");
    const text = !state.enabled
      ? S(
          "Your teacher has not turned on listening partners yet. Check back later.",
          "Tu maestro o maestra todavía no activó las parejas para escuchar. Vuelve más tarde.",
        )
      : names
        ? S(`Your listening partner: ${names}`, `Tu pareja para escuchar: ${names}`)
        : S(
            "You do not have a partner yet. Your teacher sets the pairs.",
            "Todavía no tienes pareja. Tu maestro o maestra forma las parejas.",
          );
    return el(
      "section",
      { class: "cls-card" },
      el("h2", {}, link.title || S("Your class", "Tu clase")),
      el("p", {}, text),
    );
  }

  function recordCard() {
    const card = el(
      "section",
      { class: "cls-card", "aria-labelledby": "prRecH" },
      el("h2", { id: "prRecH" }, S("Record and share", "Grabar y compartir")),
    );
    if (!canRecord()) {
      card.append(
        el(
          "p",
          {},
          S(
            "This browser cannot record. Try another browser or device.",
            "Este navegador no puede grabar. Prueba otro navegador o dispositivo.",
          ),
        ),
      );
      return card;
    }
    const taskSel = el(
      "select",
      { id: "prTask" },
      tasks.map((t) => el("option", { value: t.id }, t.title)),
    );
    const qSel = el(
      "select",
      { id: "prQ" },
      Object.keys(LISTENER_QUESTIONS).map((id) => el("option", { value: id }, Q(id))),
    );
    const syncQuestion = () => {
      const t = tasks.find((x) => x.id === taskSel.value);
      qSel.value = QUESTION_FOR_TYPE[t?.taskType] || "main-idea";
    };
    taskSel.addEventListener("change", syncQuestion);
    syncQuestion();
    const prompt = el("p", { class: "fine", lang: "en" });
    const showPrompt = () =>
      (prompt.textContent = tasks.find((x) => x.id === taskSel.value)?.prompt || "");
    taskSel.addEventListener("change", showPrompt);
    showPrompt();
    const preview = el("div");
    const recBtn = el(
      "button",
      { type: "button", class: "btn", "aria-pressed": String(recording) },
      recording
        ? S("Stop recording", "Detener la grabación")
        : S("Record (up to 60 seconds)", "Grabar (hasta 60 segundos)"),
    );
    const shareBtn = el(
      "button",
      { type: "button", class: "btn btn-primary", disabled: !take },
      S("Share with my partner", "Compartir con mi pareja"),
    );
    recBtn.addEventListener("click", async () => {
      if (recording) return stopRecording();
      try {
        recording = true;
        recBtn.textContent = S("Stop recording", "Detener la grabación");
        recBtn.setAttribute("aria-pressed", "true");
        say(S("Recording.", "Grabando."));
        await startRecording(REC_KEY, {
          maxSeconds: MAX_TAKE_SECONDS,
          onStop: (list, { limited }) => {
            recording = false;
            const last = list.at(-1);
            take = last
              ? {
                  blob: last.blob,
                  seconds: Math.min(MAX_TAKE_SECONDS, Math.max(1, last.seconds)),
                  url: last.url,
                }
              : null;
            say(
              limited
                ? S(
                    "Stopped at 60 seconds. Listen, then share.",
                    "Se detuvo a los 60 segundos. Escucha y luego comparte.",
                  )
                : S(
                    "Recording ready. Listen, then share.",
                    "Grabación lista. Escucha y luego comparte.",
                  ),
            );
            draw();
          },
        });
      } catch {
        recording = false;
        say(S("The microphone is not available.", "El micrófono no está disponible."));
        draw();
      }
    });
    if (take)
      preview.append(
        el("audio", {
          controls: true,
          src: take.url,
          "aria-label": S("Your recording", "Tu grabación"),
        }),
      );
    shareBtn.addEventListener("click", async () => {
      const t = tasks.find((x) => x.id === taskSel.value);
      if (!take || !t) return;
      shareBtn.disabled = true;
      const res = await api.shareTake({
        taskId: t.id,
        taskTitle: t.title,
        questionId: qSel.value,
        seconds: take.seconds,
        mime: take.blob.type || "audio/webm",
        data: await toBase64(take.blob),
      });
      say(
        res.ok
          ? S("Shared with your partner.", "Compartida con tu pareja.")
          : errorFor(S, res.error),
      );
      if (res.ok) {
        take = null;
        clearTakes(REC_KEY);
        refresh();
      } else shareBtn.disabled = false;
    });
    card.append(
      el("label", { for: "prTask" }, S("Speaking task", "Tarea de hablar")),
      taskSel,
      prompt,
      el(
        "label",
        { for: "prQ" },
        S("The question your partner will answer", "La pregunta que responderá tu pareja"),
      ),
      qSel,
      el("div", { class: "row-actions" }, recBtn, shareBtn),
      preview,
    );
    return card;
  }

  function inboxCard() {
    const card = el(
      "section",
      { class: "cls-card", "aria-labelledby": "prInH" },
      el("h2", { id: "prInH" }, S("Listen to my partner", "Escuchar a mi pareja")),
    );
    const items = state.inbox || [];
    if (!items.length)
      card.append(
        el("p", {}, S("Nothing to listen to yet.", "Todavía no hay nada para escuchar.")),
      );
    for (const t of items) {
      const d = drafts.get(t.takeId) || {
        answer: t.myReply?.answer || "",
        reaction: t.myReply?.reaction || "",
      };
      drafts.set(t.takeId, d);
      const id = `prA-${t.takeId}`;
      const answer = el("input", {
        id,
        maxlength: String(SCENE_LIMITS.answer),
        autocomplete: "off",
        value: d.answer,
      });
      answer.addEventListener("input", () => (d.answer = answer.value));
      const err = el("p", { class: "cls-error", role: "alert" });
      const reactions = el(
        "div",
        {
          class: "row-actions",
          role: "group",
          "aria-label": S("Choose one kind reaction", "Elige una reacción amable"),
        },
        Object.keys(REACTIONS).map((r) => {
          const b = el(
            "button",
            { type: "button", class: "btn small", "aria-pressed": String(d.reaction === r) },
            R(r),
          );
          b.addEventListener("click", () => {
            d.reaction = r;
            for (const x of reactions.children) x.setAttribute("aria-pressed", String(x === b));
          });
          return b;
        }),
      );
      const send = el(
        "button",
        { type: "button", class: "btn btn-primary" },
        t.myReply
          ? S("Update my answer", "Actualizar mi respuesta")
          : S("Send my answer", "Enviar mi respuesta"),
      );
      send.addEventListener("click", async () => {
        err.textContent = "";
        const checked = checkText(d.answer, SCENE_LIMITS.answer);
        if (!checked.ok) return void (err.textContent = errorFor(S, checked.error));
        if (!d.reaction) return void (err.textContent = errorFor(S, "invalid-reaction"));
        const res = await api.reply(t.takeId, checked.text, d.reaction);
        if (!res.ok) return void (err.textContent = errorFor(S, res.error));
        say(S("Sent to your partner.", "Enviado a tu pareja."));
        drafts.delete(t.takeId);
        refresh();
      });
      card.append(
        el(
          "div",
          { class: "cls-note" },
          el("h3", {}, `${t.alias} · ${t.taskTitle}`),
          lazyAudio(S(`Recording from ${t.alias}`, `Grabación de ${t.alias}`), () =>
            api.takeBlob(t.takeId),
          ),
          el("label", { for: id }, Q(t.questionId)),
          answer,
          el("p", { class: "fine" }, S("Then tap one reaction:", "Luego toca una reacción:")),
          reactions,
          err,
          send,
          t.myReply
            ? el(
                "p",
                { class: "fine" },
                S(
                  "You answered. Your partner can see it.",
                  "Ya respondiste. Tu pareja lo puede ver.",
                ),
              )
            : null,
        ),
      );
    }
    return card;
  }

  function mineCard() {
    const card = el(
      "section",
      { class: "cls-card", "aria-labelledby": "prMineH" },
      el("h2", { id: "prMineH" }, S("Did my message land?", "¿Se entendió mi mensaje?")),
    );
    const items = state.takes || [];
    if (!items.length)
      card.append(
        el(
          "p",
          {},
          S("You have not shared a recording yet.", "Todavía no compartiste una grabación."),
        ),
      );
    for (const t of items) {
      const box = el(
        "div",
        { class: "cls-note" },
        el("h3", {}, t.taskTitle),
        lazyAudio(S("Your recording", "Tu grabación"), () => api.takeBlob(t.takeId)),
        el("p", {}, `${S("Question", "Pregunta")}: ${Q(t.questionId)}`),
      );
      if (!t.replies.length)
        box.append(
          el(
            "p",
            { class: "fine" },
            S("Waiting for your partner to listen.", "Esperando a que tu pareja escuche."),
          ),
        );
      for (const r of t.replies) {
        const mark = (landed) => async () => {
          const res = await api.landed(t.takeId, r.studentId, landed);
          say(res.ok ? S("Saved.", "Guardado.") : errorFor(S, res.error));
          if (res.ok) refresh();
        };
        box.append(
          el(
            "div",
            {},
            el("p", {}, el("strong", {}, `${r.alias}: `), `“${r.answer}”`),
            el("p", {}, el("span", { class: "wl-chip" }, R(r.reaction))),
            el("p", { class: "fine" }, S("Is that what you meant?", "¿Es lo que quisiste decir?")),
            el(
              "div",
              { class: "row-actions" },
              el(
                "button",
                {
                  type: "button",
                  class: "btn small",
                  "aria-pressed": String(r.landed === true),
                  onclick: mark(true),
                },
                S("Yes, it landed", "Sí, se entendió"),
              ),
              el(
                "button",
                {
                  type: "button",
                  class: "btn small",
                  "aria-pressed": String(r.landed === false),
                  onclick: mark(false),
                },
                S("Not quite: I will say it again", "No del todo: lo diré otra vez"),
              ),
            ),
          ),
        );
      }
      box.append(
        el(
          "button",
          {
            type: "button",
            class: "btn small ghost",
            onclick: async () => {
              if (
                !confirm(
                  S(
                    "Delete this recording for you and your partner?",
                    "¿Borrar esta grabación para ti y tu pareja?",
                  ),
                )
              )
                return;
              const res = await api.deleteTake(t.takeId);
              say(res.ok ? S("Deleted.", "Borrada.") : errorFor(S, res.error));
              refresh();
            },
          },
          S("Delete", "Borrar"),
        ),
      );
      card.append(box);
    }
    return card;
  }

  function draw() {
    if (!state) return;
    // Keep focus on redraw: only redraw cards whose inputs are not being typed in.
    if (host.contains(document.activeElement) && document.activeElement?.tagName === "INPUT")
      return;
    const paired = state.enabled && state.partners?.length;
    host.replaceChildren(
      live,
      partnerCard(),
      ...(paired ? [recordCard(), inboxCard(), mineCard()] : []),
    );
  }

  host.append(live);
  loadSpeakingTasks()
    .then((d) => {
      tasks = (d?.tasks || []).filter((t) => !t.band || t.band === ctx.band || ctx.band === "all");
      if (!tasks.length) tasks = d?.tasks || [];
      draw();
    })
    .catch(() => {});
  refresh();
  timer = setInterval(() => !document.hidden && !recording && refresh(), POLL_MS);
  cleanup = () => {
    clearInterval(timer);
    stopRecording();
  };
}
