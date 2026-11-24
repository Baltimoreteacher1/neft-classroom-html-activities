import { crumbsHTML, setComponentsI18n } from "../components.js";
import { BASE, html, icon, raw } from "../util.js";
import { i18nFor } from "../i18n.js";
import { MODULES, ORDER } from "../lingua/registry.js";
import { CHANGE_EVENT, attemptsOf, masteryOf, state, stopSpeaking } from "../lingua/core.js";

const href = (id = "") => `${BASE}/lingua${id ? `/${id}` : ""}`;
let active = null;

const card = (I, id) => {
  const m = MODULES[id].meta;
  const tried = attemptsOf(id);
  return html`<a
    class="lg-card"
    href="${href(id)}"
    style="--lg-accent:${m.accent}"
    ${active === id ? raw('aria-current="page"') : ""}
  >
    <span class="lg-card-icon" aria-hidden="true">${icon(m.icon)}</span>
    <h3>${m.title}</h3>
    <p>${m.blurb}</p>
    <span class="lg-card-foot"
      ><span class="lg-pill">${m.skill}</span><span class="lg-pill">${m.level}</span
      ><span class="lg-pill">${m.time}</span></span
    >
    <span class="lg-meter" aria-hidden="true"
      ><i data-lg-bar="${id}" style="width:${masteryOf(id)}%"></i
    ></span>
    <small data-lg-label="${id}" data-lg-correct="${I.S("correct", "correctas")}"
      >${tried ? `${masteryOf(id)}% ${I.S("correct", "correctas")}` : I.S("New", "Nuevo")}</small
    >
  </a>`;
};

export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  const routeId = ctx.route?.id;
  const id = MODULES[routeId] ? routeId : "";
  active = id;
  const meta = id ? MODULES[id].meta : null;
  const stat = (key, value, label) =>
    html`<div class="lg-stat">
      <span class="lg-stat-value" data-lg-stat="${key}">${value}</span
      ><span class="lg-stat-label">${label}</span>
    </div>`;

  return {
    title: meta
      ? `${meta.title} · ${I.S("Everyday English", "Inglés cotidiano")}`
      : I.S("Everyday English Studio", "Estudio de inglés cotidiano"),
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], meta ? [I.S("Everyday English", "Inglés cotidiano"), href()] : [I.S("Everyday English", "Inglés cotidiano"), null], ...(meta ? [[meta.title, null]] : [])])}
      <div class="lg-studio">
        ${meta ? "" : html`<header class="lg-hero">
          <p class="lg-kicker">
            ${icon("conversation")}
            ${I.T("Everyday English · nine short tasks", "Inglés cotidiano · nueve tareas cortas")}
          </p>
          <h1 tabindex="-1">
            ${I.T("Nine small tasks. One bigger voice.", "Nueve tareas pequeñas. Una voz más grande.")}
          </h1>
          <p class="lg-lede">
            ${I.T("Practice the English you use at home, at work, at the doctor and on the bus: words, listening, speaking, reading, writing and grammar. Every answer comes with the reason behind it.", "Practica el inglés que usas en casa, en el trabajo, con el médico y en el autobús: palabras, escucha, conversación, lectura, escritura y gramática. Cada respuesta incluye la razón.")}
          </p>
          <div class="lg-stats">
            ${stat("xp", state.xp.toLocaleString(), I.S("practice points", "puntos de práctica"))}
            ${stat("streak", state.streak, I.S("day streak", "días seguidos"))}
            ${stat("sessions", state.sessions, I.S("rounds finished", "rondas terminadas"))}
          </div>
        </header>`}

        <section
          class="lg-workspace"
          aria-label="${I.S("Activity workspace", "Espacio de trabajo")}"
        >
          <div class="lg-workspace-top">
            <span
              class="lg-card-icon"
              aria-hidden="true"
              style="--lg-accent:${meta?.accent || "var(--lg-brand)"}"
              >${icon(meta?.icon || "sparkle")}</span
            >
            <div>
              ${meta ? html`<h1 id="lg-title" tabindex="-1">${meta.title}</h1>` : html`<h2 id="lg-title">${I.T("Ready when you are", "Listo cuando tú lo estés")}</h2>`}
              <p class="lg-sub">
                ${meta ? `${meta.skill} · ${meta.level} · ${meta.time}` : I.T("Choose an activity below. It opens right here.", "Elige una actividad abajo. Se abre aquí mismo.")}
              </p>
            </div>
            ${meta ? html`<a class="btn small" href="${href()}">${I.T("All activities", "Todas las actividades")}</a>` : ""}
          </div>
          <div class="lg-workspace-body">
            ${
              meta
                ? ""
                : html`<div class="lg-empty">
                    <h3>${I.T("Start with one small thing.", "Empieza con algo pequeño.")}</h3>
                    <p>
                      ${I.T("Each activity takes 4–8 minutes and ends with feedback you can use. Progress is saved on this device only.", "Cada actividad toma de 4 a 8 minutos y termina con comentarios útiles. El progreso se guarda solo en este dispositivo.")}
                    </p>
                  </div>`
            }
            <div data-lg-mount></div>
          </div>
        </section>

        <section aria-labelledby="lg-shelf">
          <h2 id="lg-shelf">
            ${I.T("Pick by what you want to practice", "Elige según lo que quieras practicar")}
          </h2>
          <div class="lg-grid">${ORDER.map((key) => card(I, key))}</div>
          <p class="lg-note">
            <b
              >${I.T("How the difficulty tags work.", "Cómo funcionan las etiquetas de dificultad.")}</b
            >
            ${I.T("Starter: shops, travel, appointments. Building: work, housing, health, forms. Stretch: tone, conditionals, negotiation. The tags describe the practice material, not you.", "Starter: tiendas, viajes, citas. Building: trabajo, vivienda, salud, formularios. Stretch: tono, condicionales, negociación. Las etiquetas describen el material de práctica, no a ti.")}
          </p>
          <p class="lg-note">
            ${icon("save")}
            ${I.T("Points, streaks and review cards stay on this device. Practice feedback only: this is not a test and gives no proficiency level.", "Los puntos, las rachas y las tarjetas de repaso se quedan en este dispositivo. Solo comentarios de práctica: no es un examen y no da un nivel de dominio.")}
          </p>
        </section>
      </div>`,
  };
}

const sync = (root) => () => {
  const set = (sel, value) =>
    root.querySelectorAll(sel).forEach((n) => {
      n.textContent = value;
    });
  set('[data-lg-stat="xp"]', state.xp.toLocaleString());
  set('[data-lg-stat="streak"]', String(state.streak));
  set('[data-lg-stat="sessions"]', String(state.sessions));
  root.querySelectorAll("[data-lg-bar]").forEach((bar) => {
    bar.style.width = `${masteryOf(bar.dataset.lgBar)}%`;
  });
  root.querySelectorAll("[data-lg-label]").forEach((n) => {
    const key = n.dataset.lgLabel;
    if (attemptsOf(key)) n.textContent = `${masteryOf(key)}% ${n.dataset.lgCorrect || "correct"}`;
  });
};

let teardown = null;

export function mount(root) {
  unmount();
  const onChange = sync(root);
  document.addEventListener(CHANGE_EVENT, onChange);
  const host = root.querySelector("[data-lg-mount]");
  const instance = active && host ? MODULES[active].mount(host) : null;
  teardown = () => {
    document.removeEventListener(CHANGE_EVENT, onChange);
    instance?.destroy?.();
    stopSpeaking();
  };
}

export function unmount() {
  teardown?.();
  teardown = null;
}
