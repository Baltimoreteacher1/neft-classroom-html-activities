// Wonder Worlds (/early/discover): cross-curricular K–2 studio weaving Listening, Reading,
// Speaking, and Writing into Science, Math, Community (Social Studies), and Arts & Music.
import { BAND_INFO } from "../bands.js";
import { DISCOVER_WORLDS } from "../content/early.js";
import { sceneSVG } from "./scenes.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { BASE, announce, html, icon, raw, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:early-discover";

const load = () => {
  try {
    return JSON.parse(storage.get(KEY) || "{}") || {};
  } catch {
    return {};
  }
};
const save = (s) => storage.set(KEY, JSON.stringify(s));

let st = {
  worldId: DISCOVER_WORLDS[0].id,
  missionIdx: 0,
  choiceState: "idle", // "idle" | "right" | "again"
};

export function render(ctx, I) {
  const info = BAND_INFO[ctx.band] || {};
  const world = DISCOVER_WORLDS.find((w) => w.id === st.worldId) || DISCOVER_WORLDS[0];
  const mission = world.missions[st.missionIdx % world.missions.length];
  const saved = load();
  const doneSet = new Set(saved.done || []);
  const lang = I.mode === "es" ? "es" : "en";

  return {
    title: I.S("Wonder Worlds: Subjects", "Mundos de asombro: Materias"),
    html: html`<article class="early-discover" aria-labelledby="discoverTitle">
      <header class="early-head">
        <p class="eyebrow">
          ${I.T("Language across subjects", "Lenguaje en todas las materias")} ·
          ${I.T(info.label || "", info.labelEs || "")}
        </p>
        <h1 id="discoverTitle" tabindex="-1">
          ${I.T("Wonder Worlds: Science, Math, Community & Arts", "Mundos de asombro: Ciencias, Matemáticas, Comunidad y Arte")}
        </h1>
        <p>
          ${I.T(
            "Listen, read, speak, and draw across your favorite school subjects. Every topic builds real words for class!",
            "Escucha, lee, habla y dibuja en tus materias favoritas de la escuela. ¡Cada tema construye palabras reales para la clase!",
          )}
        </p>
        <p class="early-switch">
          <a class="btn small" href="${BASE}/early?grades=${info.picker || ctx.band}"
            >${I.T("My practice home", "Mi página de práctica")}</a
          >
        </p>
        <div class="early-world-tabs" role="group" aria-label="${I.S("Subjects", "Materias")}">
          ${DISCOVER_WORLDS.map(
            (w) => html`<button
              type="button"
              class="btn early-big ${w.id === world.id ? "btn-primary" : ""}"
              data-dw-world="${w.id}"
              aria-pressed="${w.id === world.id}"
            >
              ${icon(w.icon)}
              <span>${I.T(w.title[0], w.title[1])}</span>
            </button>`,
          )}
        </div>
      </header>

      <section class="early-ph-board early-world-card is-${world.color}">
        <div class="early-world-missions">
          ${world.missions.map(
            (m, i) => html`<button
              type="button"
              class="btn small"
              data-dw-mission="${i}"
              aria-pressed="${i === st.missionIdx % world.missions.length}"
            >
              ${doneSet.has(m.id) ? icon("check") : ""}
              ${I.T(m.title[0], m.title[1])}
            </button>`,
          )}
        </div>

        <h2 class="early-world-mtitle">${I.T(mission.title[0], mission.title[1])}</h2>

        <div class="early-world-split">
          <div class="early-story-art">${raw(sceneSVG(mission.scene, lang))}</div>
          <div class="early-world-steps">
            <div class="early-world-step">
              <h3>${icon("listening")} ${I.T("1. Listen & Read", "1. Escucha y lee")}</h3>
              <p class="early-story-text" lang="en">${mission.listenEn}</p>
              ${I.spanish || I.bilingual ? html`<p class="fine" lang="es">${mission.listenEs}</p>` : ""}
              <p>
                <button type="button" class="btn btn-primary early-big" data-dw-hear>
                  ${icon("volume")} ${I.T("Hear this", "Escuchar esto")}
                </button>
              </p>
            </div>

            <div class="early-world-step">
              <h3>${icon("reading")} ${I.T("2. Show What You Know", "2. Muestra lo que sabes")}</h3>
              <p><strong>${I.T(mission.question[0], mission.question[1])}</strong></p>
              <div class="early-world-choices" role="group">
                ${mission.choices.map(
                  (c) => html`<button
                    type="button"
                    class="early-pick early-world-choice"
                    data-dw-pick="${c.right ? "1" : "0"}"
                  >
                    <span class="early-emoji" aria-hidden="true">${c.pic}</span>
                    <span>${I.T(c.label[0], c.label[1])}</span>
                  </button>`,
                )}
              </div>
              ${st.choiceState === "right"
                ? html`<div class="early-feedback is-right" role="status">
                    <p><strong>${I.T("Great thinking!", "¡Excelente idea!")}</strong></p>
                  </div>`
                : st.choiceState === "again"
                  ? html`<div class="early-feedback is-again" role="status">
                      <p>${I.T("Listen again and try another picture!", "Escucha otra vez y prueba otro dibujo.")}</p>
                    </div>`
                  : ""}
            </div>

            <div class="early-world-step">
              <h3>${icon("speaking")} ${I.T("3. Say It Out Loud", "3. Dilo en voz alta")}</h3>
              <p>${I.T(mission.speakPrompt[0], mission.speakPrompt[1])}</p>
            </div>

            <div class="early-world-step">
              <h3>${icon("writing")} ${I.T("4. Draw & Write on Paper", "4. Dibuja y escribe en papel")}</h3>
              <p>${I.T(mission.writeTask[0], mission.writeTask[1])}</p>
            </div>
          </div>
        </div>
      </section>

      <p class="fine early-honest">
        ${I.T(
          `${doneSet.size} of ${DISCOVER_WORLDS.reduce((n, w) => n + w.missions.length, 0)} Wonder World explorations completed on this device.`,
          `${doneSet.size} de ${DISCOVER_WORLDS.reduce((n, w) => n + w.missions.length, 0)} exploraciones completadas en este dispositivo.`,
        )}
      </p>
    </article>`,
  };
}

export function onClick(e, ctx, I) {
  const t = e.target;
  const rate = ctx.prefs.rate || 0.85;
  const world = DISCOVER_WORLDS.find((w) => w.id === st.worldId) || DISCOVER_WORLDS[0];
  const mission = world.missions[st.missionIdx % world.missions.length];

  const wBtn = t.closest("[data-dw-world]");
  if (wBtn) {
    st.worldId = wBtn.dataset.dwWorld;
    st.missionIdx = 0;
    st.choiceState = "idle";
    ctx.rerender();
    return true;
  }
  const mBtn = t.closest("[data-dw-mission]");
  if (mBtn) {
    st.missionIdx = Number(mBtn.dataset.dwMission) || 0;
    st.choiceState = "idle";
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-dw-hear]")) {
    const lines = I.mode === "es" ? [mission.listenEs, mission.listenEn] : [mission.listenEn];
    speak(lines, { lang: I.mode === "es" ? "es-US" : "en-US", rate, persona: "guide" });
    return true;
  }
  const pickBtn = t.closest("[data-dw-pick]");
  if (pickBtn) {
    if (pickBtn.dataset.dwPick === "1") {
      st.choiceState = "right";
      const s = load();
      const done = new Set(s.done || []);
      done.add(mission.id);
      save({ ...s, done: [...done] });
      speak(I.S("Great thinking!", "¡Excelente idea!"), { rate });
      announce(I.S("Great thinking!", "¡Excelente idea!"));
    } else {
      st.choiceState = "again";
      speak(mission.question[0], { rate });
      announce(I.S("Try again.", "Inténtalo otra vez."));
    }
    ctx.rerender();
    return true;
  }
  return false;
}

export const unmount = () => stopSpeech();
