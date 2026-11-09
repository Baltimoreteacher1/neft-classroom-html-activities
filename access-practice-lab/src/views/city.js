// Language City (/city): an explorable illustrated map. Learners walk into buildings, meet a character and finish missions
// that chain real language tasks: read a sign, listen, respond, ask, fix a misunderstanding, say it. Untimed, no score.
//
//   /city                         the map, with each building's progress on it
//   /city/<building>              the character and the building's missions
//   /city/<building>/<mission>    one mission, step by step
//   /city/progress                city map progress: independent and supported runs, kept apart
//   /city/teacher                 teacher-facing notes and this device's evidence
import { crumbsHTML, setComponentsI18n } from "../components.js";
import { BUILDINGS, MISSIONS, buildingOf, missionOf, missionsAt } from "../content/city.js";
import { i18nFor } from "../i18n.js";
import { missionStatus, nextMission, runsOf, totalsFor } from "../lang/city.js";
import { BASE, html, icon, raw } from "../util.js";
import { cityMapSVG, facadeThumbSVG, interiorSVG, portraitSVG } from "./city-art.js";
import { guideHTML } from "./city-guide.js";
import { cityHref, missionPage, onMissionClick, onMissionInput } from "./city-mission.js";
import { cityState, resetUi, saveCity } from "./city-state.js";
import { LEARNER_LOOKS, characterSVG } from "./scenario-art.js";
import { bandFor, speakBtn, studioHero } from "./studio-kit.js";

const P = (I, pair) => I.T(pair.en, pair.es);
const PS = (I, pair) => I.S(pair.en, pair.es);
const STATUS_TEXT = {
  independent: ["Finished on my own", "Terminada por mi cuenta"],
  supported: ["Finished with support", "Terminada con apoyo"],
  new: ["Not started", "Sin empezar"],
};
const statusChip = (I, status) =>
  html`<span class="city-chip is-${status}"
    >${status === "independent" ? icon("check") : ""}${I.T(STATUS_TEXT[status][0], STATUS_TEXT[status][1])}</span
  >`;

const cityCrumbs = (I, band, here, mid = null) =>
  crumbsHTML(
    [
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
      [I.S("Language City", "Ciudad del lenguaje"), here || mid ? cityHref("", band) : null],
      ...(mid ? [[PS(I, mid), null]] : here ? [[here, null]] : []),
    ],
    { i18n: I },
  );

function pinStatus(I, st, building) {
  const t = totalsFor(st.prog, missionsAt(building.id));
  return I.S(
    `${t.independent} of ${t.total} finished on my own, ${t.supported} with support`,
    `${t.independent} de ${t.total} terminadas por mi cuenta, ${t.supported} con apoyo`,
  );
}

function mapHTML(ctx, I, st) {
  const band = bandFor(ctx.band);
  return html`<nav
    class="city-map"
    aria-label="${I.S("City map: choose a building", "Mapa de la ciudad: elige un edificio")}"
  >
    <div class="city-map-art">${raw(cityMapSVG())}</div>
    <ol class="city-pins">
      ${BUILDINGS.map(
        (b, i) =>
          html`<li style="left:${b.at[0]}%;top:${b.at[1]}%">
            <a class="city-pin" href="${cityHref(b.id, band)}"
              ><span class="city-pin-n" aria-hidden="true">${i + 1}</span
              ><span class="city-pin-name">${PS(I, b.name)}</span
              ><span class="city-dots" aria-hidden="true"
                >${missionsAt(b.id).map((m) => html`<i class="city-dot is-${missionStatus(st.prog, m.id)}"></i>`)}</span
              ><span class="visually-hidden">. ${pinStatus(I, st, b)}</span></a
            >
          </li>`,
      )}
    </ol>
  </nav>`;
}

function buildingCard(ctx, I, st, b, i) {
  const band = bandFor(ctx.band);
  return html`<a class="card task-card city-card" href="${cityHref(b.id, band)}">
    ${raw(facadeThumbSVG(b.id))}
    <strong class="task-title">${i + 1}. ${P(I, b.name)}</strong>
    <span class="task-desc">${P(I, b.blurb)}</span>
    <span class="fine">${b.npc.name}, ${P(I, b.npc.role)}</span>
    <span class="city-chips-row"
      >${missionsAt(b.id).map((m) => statusChip(I, missionStatus(st.prog, m.id)))}</span
    >
  </a>`;
}

function hubHTML(ctx, I, st) {
  const band = bandFor(ctx.band);
  const t = totalsFor(st.prog, MISSIONS);
  const next = nextMission(st.prog, MISSIONS);
  const nextB = next ? buildingOf(next.place) : null;
  return html`${cityCrumbs(I, band, null)}
    ${studioHero({
      I,
      ico: "worlds",
      cls: "d-speaking",
      kicker: I.T(
        `Grades ${band.replace("-", "–")} · reading, listening, speaking`,
        `Grados ${band.replace("-", "–")} · lectura, comprensión auditiva y expresión oral`,
      ),
      title: I.T("Language City", "Ciudad del lenguaje"),
      lead: I.T(
        `Walk into a building, meet someone who works there and finish a mission. You read a sign, listen, answer, ask a question and fix a misunderstanding. ${MISSIONS.length} missions in ${BUILDINGS.length} places. No clock and no score.`,
        `Entra a un edificio, conoce a alguien que trabaja allí y termina una misión. Lees un letrero, escuchas, respondes, haces una pregunta y arreglas una confusión. ${MISSIONS.length} misiones en ${BUILDINGS.length} lugares. Sin reloj y sin puntaje.`,
      ),
      art: raw(["cafe", "library", "clinic"].map(facadeThumbSVG).join("")),
    })}
    <section class="panel" aria-labelledby="ct-me-h">
      <h2 id="ct-me-h">${I.T("Choose your character", "Elige tu personaje")}</h2>
      <div
        class="scn-looks"
        role="radiogroup"
        aria-label="${I.S("Your character", "Tu personaje")}"
      >
        ${LEARNER_LOOKS.map((l, i) => html`<button type="button" class="scn-look ${i === st.look ? "is-on" : ""}" data-ct-look="${i}" role="radio" aria-checked="${String(i === st.look)}" aria-label="${I.S(`Character ${i + 1}`, `Personaje ${i + 1}`)}"><svg viewBox="-40 -100 80 130" width="54" height="86" aria-hidden="true" focusable="false">${raw(characterSVG(l, "happy", 0, 20, 1))}</svg></button>`)}
      </div>
    </section>
    <section class="panel" aria-labelledby="ct-map-h">
      <h2 id="ct-map-h">${I.T("City map", "Mapa de la ciudad")}</h2>
      <p class="fine">
        ${I.T("Choose a building. The dots show your missions there: a filled dot is finished on your own, a ring is finished with support.", "Elige un edificio. Los puntos muestran tus misiones allí: un punto lleno es una misión terminada por tu cuenta y un anillo es terminada con apoyo.")}
      </p>
      ${mapHTML(ctx, I, st)}
    </section>
    <section class="panel city-next" aria-labelledby="ct-next-h">
      <h2 id="ct-next-h">${I.T("Where to next", "A dónde ir ahora")}</h2>
      <p>
        ${I.T(`${t.independent} of ${t.total} missions finished on my own · ${t.supported} finished with support · ${t.left} not started.`, `${t.independent} de ${t.total} misiones terminadas por mi cuenta · ${t.supported} terminadas con apoyo · ${t.left} sin empezar.`)}
      </p>
      <div class="wl-actions">
        ${next ? html`<a class="btn btn-primary" href="${cityHref(`${next.place}/${next.id}`, band)}">${icon("flag")} ${I.T(`Go to ${nextB.name.en}: ${next.title.en}`, `Ir a ${nextB.name.es}: ${next.title.es}`)}</a>` : html`<span class="fine">${I.T("Every mission is finished on your own. Play any of them again.", "Todas las misiones están terminadas por tu cuenta. Juega cualquiera otra vez.")}</span>`}
        <a class="btn" href="${cityHref("progress", band)}"
          >${I.T("My city progress", "Mi progreso en la ciudad")}</a
        >
      </div>
    </section>
    <section class="task-group" aria-labelledby="ct-list-h">
      <h2 id="ct-list-h">${I.T("All the buildings", "Todos los edificios")}</h2>
      <div class="task-grid">${BUILDINGS.map((b, i) => buildingCard(ctx, I, st, b, i))}</div>
    </section>
    <p class="disclaimer">
      ${I.T("Practice on this device. The lab checks your words, never your accent. Nothing here is a WIDA or ACCESS score or level.", "Práctica en este dispositivo. El laboratorio revisa tus palabras, nunca tu acento. Nada aquí es un puntaje ni un nivel de WIDA ni de ACCESS.")}
    </p>`;
}

function buildingHTML(ctx, I, st, b) {
  const band = bandFor(ctx.band);
  const learner = LEARNER_LOOKS[st.look] || LEARNER_LOOKS[0];
  const list = missionsAt(b.id);
  const art = interiorSVG(b, {
    npc: b.npc,
    learner,
    mood: "happy",
    label: PS(I, {
      en: `${b.name.en}: ${b.npc.name} the ${b.npc.role.en}`,
      es: `${b.name.es}: ${b.npc.name}, ${b.npc.role.es}`,
    }),
  });
  return html`${crumbsHTML(
      [
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Language City", "Ciudad del lenguaje"), cityHref("", band)],
        [PS(I, b.name), null],
      ],
      { i18n: I },
    )}
    <article class="city-building">
      <header class="act-head">
        <h1 tabindex="-1">${P(I, b.name)}</h1>
        <p class="lead">${P(I, b.blurb)}</p>
      </header>
      <div class="city-stage">${raw(art)}</div>
      <div class="scn-bubble is-npc" role="group" aria-label="${b.npc.name}">
        <p class="scn-name">${raw(portraitSVG(b.npc))} ${b.npc.name} · ${P(I, b.npc.role)}</p>
        <p class="scn-say">${b.npc.greet.en}</p>
        <p class="scn-say-es" lang="es">${b.npc.greet.es}</p>
        <div class="wl-actions">${speakBtn(I, b.npc.greet.en)}</div>
      </div>
      <section class="task-group" aria-labelledby="ct-missions-h">
        <h2 id="ct-missions-h">${I.T("Missions here", "Misiones aquí")}</h2>
        <div class="task-grid">
          ${list.map((m) => {
            const rec = st.prog[m.id];
            return html`<a
              class="card task-card city-card"
              href="${cityHref(`${b.id}/${m.id}`, band)}"
            >
              <strong class="task-title">${P(I, m.title)}</strong>
              <span class="task-desc">${P(I, m.goal)}</span>
              ${statusChip(I, missionStatus(st.prog, m.id))}
              <span class="fine"
                >${I.T(`${rec?.indep || 0} on my own · ${rec?.supp || 0} with support`, `${rec?.indep || 0} por mi cuenta · ${rec?.supp || 0} con apoyo`)}</span
              >
            </a>`;
          })}
        </div>
      </section>
      <div class="wl-actions">
        <a class="btn" href="${cityHref("", band)}"
          >${icon("arrow-left")} ${I.T("Back to the city map", "Volver al mapa de la ciudad")}</a
        >
      </div>
    </article>`;
}

function progressHTML(ctx, I, st) {
  const band = bandFor(ctx.band);
  const t = totalsFor(st.prog, MISSIONS);
  return html`${cityCrumbs(I, band, I.S("My city progress", "Mi progreso en la ciudad"))}
    <header class="act-head">
      <h1 tabindex="-1">${I.T("My city progress", "Mi progreso en la ciudad")}</h1>
      <p class="lead">
        ${I.T("Missions finished on your own and missions finished with support are counted apart, so you can see when you are ready to try one without help.", "Las misiones terminadas por tu cuenta y las terminadas con apoyo se cuentan aparte, para que veas cuándo estás listo para intentar una sin ayuda.")}
      </p>
    </header>
    <section class="panel" aria-labelledby="ct-pt-h">
      <h2 id="ct-pt-h">${I.T("City map", "Mapa de la ciudad")}</h2>
      ${mapHTML(ctx, I, st)}
      <ul class="city-totals">
        <li>
          <b>${t.independent}</b>
          ${I.T(`of ${t.total} finished on my own`, `de ${t.total} terminadas por mi cuenta`)}
        </li>
        <li>
          <b>${t.supported}</b> ${I.T("finished only with support", "terminadas solo con apoyo")}
        </li>
        <li><b>${t.left}</b> ${I.T("not started", "sin empezar")}</li>
      </ul>
    </section>
    ${BUILDINGS.map(
      (b) =>
        html`<section class="panel" aria-labelledby="ct-pb-${b.id}">
          <h2 id="ct-pb-${b.id}"><a href="${cityHref(b.id, band)}">${P(I, b.name)}</a></h2>
          <ul class="city-prog-list">
            ${missionsAt(b.id).map((m) => {
              const rec = st.prog[m.id];
              return html`<li>
                <a href="${cityHref(`${b.id}/${m.id}`, band)}"><b>${P(I, m.title)}</b></a>
                ${statusChip(I, missionStatus(st.prog, m.id))}
                <span class="fine"
                  >${I.T(`${rec?.indep || 0} on my own · ${rec?.supp || 0} with support`, `${rec?.indep || 0} por mi cuenta · ${rec?.supp || 0} con apoyo`)}${runsOf(rec) ? I.T(` · ${rec.firstTry} of ${rec.steps} steps right on the first try`, ` · ${rec.firstTry} de ${rec.steps} pasos bien al primer intento`) : ""}</span
                >
              </li>`;
            })}
          </ul>
        </section>`,
    )}
    <div class="wl-actions">
      <a class="btn" href="${cityHref("", band)}"
        >${icon("arrow-left")} ${I.T("Back to the city map", "Volver al mapa de la ciudad")}</a
      >
    </div>`;
}

/** Every Language City screen sits in one wrapper so its reading text can be held at 16px. */
const page = (body) => html`<div class="city-page">${body}</div>`;

export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  const id = ctx.route.id || "";
  const missionId = ctx.route.missionId || "";
  const st = cityState();
  const title = (en, es) => `${I.S(en, es)} · ${I.S("Language City", "Ciudad del lenguaje")}`;
  if (id === "teacher")
    return { title: title("Teacher notes", "Notas docentes"), html: page(guideHTML(ctx, I, st)) };
  if (id === "progress")
    return {
      title: title("My city progress", "Mi progreso en la ciudad"),
      html: page(progressHTML(ctx, I, st)),
    };
  const building = buildingOf(id);
  if (!building)
    return { title: I.S("Language City", "Ciudad del lenguaje"), html: page(hubHTML(ctx, I, st)) };
  const mission = missionId ? missionOf(id, missionId) : null;
  if (!mission)
    return {
      title: title(building.name.en, building.name.es),
      html: page(buildingHTML(ctx, I, st, building)),
    };
  const next = nextMission(
    st.prog,
    MISSIONS.filter((m) => m.id !== mission.id),
  );
  return {
    title: title(mission.title.en, mission.title.es),
    html: page(missionPage(ctx, I, building, mission, next)),
  };
}

export function onClick(e, ctx) {
  const look = e.target.closest("[data-ct-look]");
  if (look) {
    const st = cityState();
    st.look = Number(look.dataset.ctLook);
    saveCity(st);
    return (ctx.rerender(), true);
  }
  const mission = ctx.route?.missionId ? missionOf(ctx.route.id, ctx.route.missionId) : null;
  if (!mission) return false;
  const st = cityState();
  const next = nextMission(
    st.prog,
    MISSIONS.filter((m) => m.id !== mission.id),
  );
  return onMissionClick(e, ctx, mission, i18nFor(ctx), next);
}
export const onInput = (e) => onMissionInput(e);
export const onChange = (e) => onMissionInput(e);
export const unmount = () => resetUi();
