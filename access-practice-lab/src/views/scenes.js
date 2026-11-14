// Class scenes (/scenes): for learners in a class only. A learner writes a short Real-Life Scenario (a setting, who
// they talk to, the situation, what the other person says, 2-3 good replies and 1 not-so-polite reply with a why),
// optionally with one recorded line in their own voice. It goes to the teacher first; only the teacher sees it until
// they approve it. Approved scenes are the class library, played here with the Real-Life Scenarios art and feedback.
// Server: functions/_lib/class-platform/scenes.js. Rules (lengths, no email/phone/link, kind words): social.js.
import {
  MAX_TAKE_SECONDS,
  SCENE_LIMITS,
  validateScene,
} from "../../../shared/class-platform/social.js";
import { crumbsHTML } from "../components.js";
import { el, errorText, toBase64 } from "../class/dom.js";
import { loadLink } from "../class/link.js";
import {
  CHARACTERS,
  PLACE_NAMES,
  PLACES,
  socialErrorText,
} from "../class/scene-model.js";
import { scenePlayerCard } from "../class/scene-player.js";
import { studentSocial } from "../class/social-api.js";
import { i18nFor } from "../i18n.js";
import { QUALITY } from "../lang/scenarios.js";
import {
  canRecord,
  clear as clearTakes,
  start as startRecording,
  stop as stopRecording,
} from "../recorder.js";
import { BASE, html } from "../util.js";

const REC_KEY = "class-scene";
let cleanup = null;

export function render(ctx) {
  const I = i18nFor(ctx);
  return {
    title: I.S("Class scenes", "Escenas de la clase"),
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
        [I.S("My class", "Mi clase"), `${BASE}/class`],
        [I.S("Class scenes", "Escenas de la clase"), null],
      ])}
      <section class="cls-page" aria-labelledby="scnTitle">
        <header class="cls-head">
          <h1 id="scnTitle" tabindex="-1">${I.T("Class scenes", "Escenas de la clase")}</h1>
          <p>
            ${I.T("Play real-life conversations your classmates wrote, or write your own. Your teacher reads every scene before the class can play it.", "Juega conversaciones de la vida real que escribieron tus compañeros, o escribe la tuya. Tu maestro o maestra lee cada escena antes de que la clase pueda jugarla.")}
          </p>
        </header>
        <div id="scnRoot" data-nsr-ignore></div>
        <p class="fine">
          ${I.T("Do not write your full name, an email, a phone number or a link. This is practice, not a test and not a score.", "No escribas tu nombre completo, un correo, un número de teléfono ni un enlace. Es práctica, no es una prueba ni un puntaje.")}
        </p>
      </section>`,
  };
}

export function unmount() {
  cleanup?.();
  cleanup = null;
}

const FIELD_IDS = {
  title: "scTitle",
  situation: "scSit",
  lines: "scLine0",
  good: "scGood0",
  rude: "scRude",
  why: "scWhy",
};
const errorFor = (S, code) => socialErrorText(S, code) || errorText(S, code);

export function mount(root, ctx) {
  unmount();
  const S = i18nFor(ctx).S;
  const host = root.querySelector("#scnRoot");
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
            "Class scenes are for learners in a class. Join your teacher's class first.",
            "Las escenas de la clase son para estudiantes de una clase. Primero únete a la clase de tu maestro o maestra.",
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
  let data = { mine: [], library: [] };
  let playing = null; // { item, picked }
  let editing = null; // sceneId being edited, or null for a new scene
  let voice = null; // { blob } newest voice line, not yet sent
  let recording = false;

  async function refresh() {
    const res = await api.scenes();
    if (!res.ok) return void say(errorFor(S, res.error));
    data = res;
    draw();
  }

  const playerCard = () =>
    scenePlayerCard({
      S,
      item: playing.item,
      picked: playing.picked,
      rate: ctx.prefs?.rate,
      loadAudio: () => api.sceneAudio(playing.item.sceneId),
      onPick: (c) => {
        playing.picked = c;
        say(S(...QUALITY[c.q]));
        draw();
      },
      onRetry: () => {
        playing.picked = null;
        draw();
      },
      onBack: () => {
        playing = null;
        draw();
      },
    });

  function libraryCard() {
    const card = el(
      "section",
      { class: "cls-card", "aria-labelledby": "scLibH" },
      el("h2", { id: "scLibH" }, S("Our class library", "La biblioteca de la clase")),
    );
    if (!data.library.length)
      card.append(
        el(
          "p",
          {},
          S(
            "No scenes yet. Write the first one below.",
            "Todavía no hay escenas. Escribe la primera abajo.",
          ),
        ),
      );
    else
      card.append(
        el(
          "ul",
          { class: "cls-list" },
          data.library.map((item) =>
            el(
              "li",
              {},
              el(
                "button",
                {
                  type: "button",
                  class: "btn",
                  onclick: () => {
                    playing = { item, picked: null };
                    draw();
                    host.querySelector("#scPlayH")?.focus();
                  },
                },
                `${S("Play", "Jugar")}: ${item.scene.title}`,
              ),
              el(
                "span",
                { class: "fine" },
                ` · ${S("by", "de")} ${item.alias} · ${S(...PLACE_NAMES[item.scene.place])}`,
              ),
            ),
          ),
        ),
      );
    return card;
  }

  function input(id, label, max, value = "", { area = false, hint = "" } = {}) {
    const box = el(area ? "textarea" : "input", {
      id,
      maxlength: String(max),
      autocomplete: "off",
      ...(area ? { rows: "3" } : {}),
    });
    box.value = value;
    return [
      el("label", { for: id }, label, hint ? el("span", { class: "fine" }, ` ${hint}`) : null),
      box,
    ];
  }

  function formCard() {
    const base = editing ? data.mine.find((m) => m.sceneId === editing)?.scene : null;
    const L = SCENE_LIMITS;
    const err = el("p", { class: "cls-error", role: "alert" });
    const place = el(
      "select",
      { id: "scPlace" },
      PLACES.map((p) => el("option", { value: p }, S(...PLACE_NAMES[p]))),
    );
    const who = el(
      "select",
      { id: "scWho" },
      CHARACTERS.map((c) =>
        el("option", { value: c.id }, `${c.name} · ${S(c.role, c.roleEs || c.role)}`),
      ),
    );
    if (base) {
      place.value = base.place;
      who.value = base.character;
    }
    const lines = [0, 1, 2].map((i) =>
      input(`scLine${i}`, S(`Line ${i + 1}`, `Frase ${i + 1}`), L.line, base?.lines[i] || "", {
        hint: i ? S("(optional)", "(opcional)") : "",
      }),
    );
    const good = [0, 1, 2].map((i) =>
      input(
        `scGood${i}`,
        S(`Good reply ${i + 1}`, `Respuesta buena ${i + 1}`),
        L.reply,
        base?.good[i] || "",
        { hint: i === 2 ? S("(optional)", "(opcional)") : "" },
      ),
    );
    const fields = {
      title: input("scTitle", S("Scene name", "Nombre de la escena"), L.title, base?.title || ""),
      situation: input(
        "scSit",
        S("The situation", "La situación"),
        L.situation,
        base?.situation || "",
        {
          area: true,
          hint: S(`(up to ${L.situation} characters)`, `(hasta ${L.situation} caracteres)`),
        },
      ),
      rude: input(
        "scRude",
        S("A not-so-polite reply", "Una respuesta no tan cortés"),
        L.reply,
        base?.rude.say || "",
      ),
      why: input(
        "scWhy",
        S("Why it is not so polite", "Por qué no es tan cortés"),
        L.why,
        base?.rude.why || "",
      ),
    };
    const voiceBox = el("div");
    const recBtn = el(
      "button",
      { type: "button", class: "btn small", "aria-pressed": String(recording) },
      recording
        ? S("Stop recording", "Detener la grabación")
        : S("Record one line in my voice (optional)", "Grabar una frase con mi voz (opcional)"),
    );
    recBtn.addEventListener("click", async () => {
      if (recording) return stopRecording();
      try {
        recording = true;
        recBtn.textContent = S("Stop recording", "Detener la grabación");
        recBtn.setAttribute("aria-pressed", "true");
        await startRecording(REC_KEY, {
          maxSeconds: MAX_TAKE_SECONDS,
          onStop: (list) => {
            recording = false;
            const last = list.at(-1);
            voice = last ? { blob: last.blob, url: last.url } : null;
            recBtn.textContent = S("Record again", "Grabar otra vez");
            recBtn.setAttribute("aria-pressed", "false");
            voiceBox.replaceChildren(
              voice
                ? el("audio", {
                    controls: true,
                    src: voice.url,
                    "aria-label": S("Your voice line", "Tu frase grabada"),
                  })
                : "",
            );
          },
        });
      } catch {
        recording = false;
        say(S("The microphone is not available.", "El micrófono no está disponible."));
      }
    });
    const value = (pair) => pair[1].value;
    const form = el(
      "form",
      { class: "cls-card", novalidate: true, "aria-labelledby": "scFormH" },
      el(
        "h2",
        { id: "scFormH" },
        editing
          ? S("Fix my scene", "Arreglar mi escena")
          : S("Write a scene", "Escribir una escena"),
      ),
      ...fields.title,
      el("label", { for: "scPlace" }, S("Where is it?", "¿Dónde es?")),
      place,
      el("label", { for: "scWho" }, S("Who do you talk to?", "¿Con quién hablas?")),
      who,
      ...fields.situation,
      el(
        "fieldset",
        {},
        el(
          "legend",
          {},
          S(
            "What the other person says (1 to 3 lines)",
            "Lo que dice la otra persona (de 1 a 3 frases)",
          ),
        ),
        ...lines.flat(),
      ),
      el(
        "fieldset",
        {},
        el("legend", {}, S("Good replies (2 or 3)", "Respuestas buenas (2 o 3)")),
        ...good.flat(),
      ),
      el(
        "fieldset",
        {},
        el("legend", {}, S("One not-so-polite reply", "Una respuesta no tan cortés")),
        ...fields.rude,
        ...fields.why,
      ),
      canRecord() ? el("div", {}, recBtn, voiceBox) : null,
      err,
      el(
        "div",
        { class: "row-actions" },
        el(
          "button",
          { type: "submit", class: "btn btn-primary" },
          S("Send to my teacher", "Enviar a mi maestro o maestra"),
        ),
        editing
          ? el(
              "button",
              {
                type: "button",
                class: "btn ghost",
                onclick: () => {
                  editing = null;
                  draw();
                },
              },
              S("Cancel", "Cancelar"),
            )
          : null,
      ),
    );
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      err.textContent = "";
      const scene = {
        title: value(fields.title),
        place: place.value,
        character: who.value,
        situation: value(fields.situation),
        lines: lines.map(value),
        good: good.map(value),
        rude: { say: value(fields.rude), why: value(fields.why) },
      };
      const checked = validateScene(scene);
      const fail = (code, field) => {
        err.textContent = errorFor(S, code);
        if (field && FIELD_IDS[field]) form.querySelector(`#${FIELD_IDS[field]}`)?.focus();
      };
      if (!checked.ok) return fail(checked.error, checked.field);
      const body = { scene: checked.scene, ...(editing ? { sceneId: editing } : {}) };
      if (voice)
        body.audio = { mime: voice.blob.type || "audio/webm", data: await toBase64(voice.blob) };
      const res = await api.submitScene(body);
      if (!res.ok) return fail(res.error, res.field);
      say(
        S(
          "Sent to your teacher. You will see it in the class library when it is approved.",
          "Enviada a tu maestro o maestra. La verás en la biblioteca de la clase cuando la aprueben.",
        ),
      );
      editing = null;
      voice = null;
      clearTakes(REC_KEY);
      refresh();
    });
    return form;
  }

  function mineCard() {
    const label = {
      pending: S("Waiting for your teacher", "Esperando a tu maestro o maestra"),
      returned: S("Sent back to fix", "Devuelta para arreglar"),
      approved: S("In the class library", "En la biblioteca de la clase"),
    };
    return el(
      "section",
      { class: "cls-card", "aria-labelledby": "scMineH" },
      el("h2", { id: "scMineH" }, S("My scenes", "Mis escenas")),
      data.mine.length
        ? el(
            "ul",
            { class: "cls-list" },
            data.mine.map((m) =>
              el(
                "li",
                {},
                el("strong", {}, m.scene?.title || ""),
                el(
                  "span",
                  { class: m.status === "approved" ? "cls-done" : "cls-todo" },
                  ` · ${label[m.status] || m.status}`,
                ),
                m.status === "returned" && m.note
                  ? el("p", {}, `${S("Your teacher says", "Tu maestro o maestra dice")}: ${m.note}`)
                  : null,
                el(
                  "div",
                  { class: "row-actions" },
                  m.status !== "approved"
                    ? el(
                        "button",
                        {
                          type: "button",
                          class: "btn small",
                          onclick: () => {
                            editing = m.sceneId;
                            draw();
                            host.querySelector("#scFormH")?.scrollIntoView({ block: "start" });
                          },
                        },
                        S("Edit", "Editar"),
                      )
                    : null,
                  el(
                    "button",
                    {
                      type: "button",
                      class: "btn small ghost",
                      onclick: async () => {
                        if (!confirm(S("Delete this scene?", "¿Borrar esta escena?"))) return;
                        const res = await api.deleteScene(m.sceneId);
                        say(res.ok ? S("Deleted.", "Borrada.") : errorFor(S, res.error));
                        refresh();
                      },
                    },
                    S("Delete", "Borrar"),
                  ),
                ),
              ),
            ),
          )
        : el("p", {}, S("You have not written a scene yet.", "Todavía no escribiste una escena.")),
    );
  }

  function draw() {
    if (recording) return;
    host.replaceChildren(
      live,
      ...(playing ? [playerCard()] : [libraryCard(), formCard(), mineCard()]),
    );
  }

  host.append(live);
  refresh();
  cleanup = () => stopRecording();
}
