// EduWonderLab Language Reality View (/access-practice-lab/reality)
// "Live the Story. Use the Language."
// Flagship 7.0 immersive communication simulation + Creative Studios (Story Builder,
// Collaborative Communication Missions, Student Game Authoring, and Teacher Mission Builder).

import { bandSwitchHTML, crumbsHTML, domainGlyph, recorderHTML } from "../components.js";
import { award } from "../engagement.js";
import { i18nFor } from "../i18n.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import {
  FLAGSHIP_WORLDS,
  evaluateClarification,
  evaluateCommunication,
  loadRealityState,
  matchAdventureInterest,
  saveRealityState,
  validateCustomMission,
} from "../reality-engine.js";
import { canSpeak, speak } from "../speech.js";
import { ART, BASE, TIERS, announce, bandLabel, html, icon, raw, wordCount } from "../util.js";

const IGN = raw("data-nsr-ignore");

// Transient UI state for active tab / studio forms
let activeTab = "worlds"; // "worlds" | "story-builder" | "collab" | "game-maker" | "teacher-builder"
let builderDraft = {
  title: "Green Roof Cooling Proposal",
  worldId: "future-city",
  band: "6-8",
  klu: "Argue",
  eldStandard: "ELD-SS.6-8.Argue",
  characterName: "Councilor Chen",
  audioScript:
    "Summer rooftop temperatures on the library reach 115 degrees Fahrenheit. Installing a vegetated green roof reduces roof heat by 32 degrees and captures 70 percent of rainwater.",
  readingClue:
    "Engineering Table: Vegetated green roof lowers cooling costs by 28% and retains 70% of storm runoff.",
  communicatePrompt:
    "Argue why the City Council should fund the library green roof using temperature and runoff evidence.",
  keywords: "green roof, 32, 70, because, cooling",
  consequenceFull:
    "CONSEQUENCE UNLOCKED: The City Council approves the Library Green Roof! Cooling costs drop by 28% and students gain a rooftop botany lab.",
};
let builderFeedback = null;

function resolveMission(state, world, band) {
  const customForWorld = (state.customMissions || []).filter(
    (m) => m.worldId === world.id && (!m.band || m.band === band),
  );
  const pool = [...(world.missions[band] || world.missions["6-8"] || []), ...customForWorld];
  return pool.find((m) => m.id === state.activeMissionId) || pool[0];
}

function aiCoachInsight(mission, mProg, tier, I) {
  const { T } = I;
  const draft = (mProg.responseDraft || "").trim();
  if (!mProg.heardAudio && !mProg.pinnedClues?.length) {
    return T(
      `Step 1 Coach: Start by listening to ${mission.audioCharacter}'s briefing or pinning a relevant clue from ${mission.readingTitle[0]}. Notice the signal words before planning your response.`,
      `Entrenador Paso 1: Empieza escuchando el informe de ${mission.audioCharacter} o fijando una pista relevante de ${mission.readingTitle[1]}. Observa las palabras señal antes de planificar tu respuesta.`,
    );
  }
  if (!mProg.clarifyUnlocked) {
    return T(
      `Step 2 Coach: Ask ${mission.audioCharacter} a clarification question using a question word (who, where, why, how) and a key noun from the clue to unlock hidden details.`,
      `Entrenador Paso 2: Hazle a ${mission.audioCharacter} una pregunta de aclaración usando una palabra interrogativa (quién, dónde, por qué, cómo) y un sustantivo clave para desbloquear detalles.`,
    );
  }
  if (!draft) {
    return T(
      `Step 3 Coach (${TIERS[tier]?.name || tier} Support): Choose a sentence frame or word bank chip below to connect your claim, source evidence, and reasoning.`,
      `Entrenador Paso 3 (Apoyo ${TIERS[tier]?.es || tier}): Elige un marco de oración o palabra del banco abajo para conectar tu idea, la evidencia y el razonamiento.`,
    );
  }
  const ev = evaluateCommunication(draft, mission);
  const missing = ev.concepts.filter((c) => !c.met);
  if (missing.length > 0) {
    return T(
      `Coach Observation (${ev.words} words): You included ${ev.metCount} of ${ev.total} communicative moves. To unlock the full consequence, add ${missing[0].label[0]}.`,
      `Observación del entrenador (${ev.words} palabras): Incluiste ${ev.metCount} de ${ev.total} recursos comunicativos. Para desbloquear la consecuencia completa, agrega ${missing[0].label[1]}.`,
    );
  }
  return T(
    `Coach Observation (${ev.words} words): Your communication includes all required evidence and connectors! Submit it to see how the world responds, or try the Fresh Apply step.`,
    `Observación del entrenador (${ev.words} palabras): ¡Tu comunicación incluye toda la evidencia y los conectores necesarios! Envíala para ver cómo responde el mundo.`,
  );
}

function renderStoryBuilder(state, band, I) {
  const { T, S } = I;
  const sb = state.storyBuilder || {
    setting: "School Science Greenhouse",
    character: "Leo & Maya",
    problem: "The automatic misting timer stopped before the weekend.",
    sequence1: "At first, Leo noticed the fern leaves curling in the dry air.",
    sequence2: "However, the water tank was still full, so Maya inspected the timer relay.",
    resolution: "Finally, they reset the solar timer and explained the checklist to the garden club.",
    published: false,
  };
  return html`<section class="panel reality-substudio" aria-labelledby="storyBuilderTitle" data-content>
    <div class="learn-wb-head">
      <div>
        <p class="eyebrow">${icon("writing")} ${T("Innovation 11 · WIDA Key Language Use: Narrate", "Innovación 11 · Uso clave del lenguaje WIDA: Narrar")}</p>
        <h2 id="storyBuilderTitle">${T("Interactive Visual Story Builder", "Constructor interactivo de historias visuales")}</h2>
        <p class="fine">${T(
          "Select characters and settings, sequence events with transitions, revise your narration, and publish to your portfolio.",
          "Selecciona personajes y escenarios, ordena eventos con transiciones, revisa tu narración y publícala en tu portafolio.",
        )}</p>
      </div>
    </div>
    <div class="learn-steps-grid">
      <div class="learn-step-card">
        <h3>${icon("sparkle")} ${T("1. Story Setting & Characters", "1. Escenario y personajes de la historia")}</h3>
        <label class="field">
          <span>${T("Setting", "Escenario")}</span>
          <select data-sb-field="setting" ${IGN}>
            ${[
              "School Science Greenhouse",
              "Neighborhood Makerspace & Library",
              "Coastal Tidepool Research Dock",
              "Future City Solar Plaza",
            ].map((s) => html`<option value="${s}" ${sb.setting === s ? raw("selected") : ""}>${s}</option>`)}
          </select>
        </label>
        <label class="field">
          <span>${T("Characters", "Personajes")}</span>
          <select data-sb-field="character" ${IGN}>
            ${[
              "Leo & Maya (Student Investigators)",
              "Nia & Kofi (Field Reporters)",
              "Sofia & Mateo (Engineering Partners)",
            ].map((c) => html`<option value="${c}" ${sb.character === c ? raw("selected") : ""}>${c}</option>`)}
          </select>
        </label>
        <label class="field">
          <span>${T("Problem / Turning Point", "Problema o momento clave")}</span>
          <input type="text" data-sb-field="problem" value="${sb.problem}" ${IGN} />
        </label>
      </div>
      <div class="learn-step-card">
        <h3>${icon("list")} ${T("2. Sequence Events & Transitions", "2. Ordena eventos y transiciones")}</h3>
        <label class="field">
          <span>${T("Beginning (At first / Initially)", "Inicio (At first / Initially)")}</span>
          <input type="text" data-sb-field="sequence1" value="${sb.sequence1}" ${IGN} />
        </label>
        <label class="field">
          <span>${T("Turning Point (However / Suddenly / Meanwhile)", "Momento clave (However / Suddenly / Meanwhile)")}</span>
          <input type="text" data-sb-field="sequence2" value="${sb.sequence2}" ${IGN} />
        </label>
        <label class="field">
          <span>${T("Resolution (Finally / Consequently)", "Resolución (Finally / Consequently)")}</span>
          <input type="text" data-sb-field="resolution" value="${sb.resolution}" ${IGN} />
        </label>
      </div>
    </div>
    <div class="learn-stimulus-box">
      <div class="learn-stimulus-head">
        <strong>${icon("reading")} ${T("Live Illustrated Story Preview", "Vista previa de la historia ilustrada")} · ${sb.setting}</strong>
        ${canSpeak() ? html`<button type="button" class="btn small" data-reality-say="${`${sb.sequence1} ${sb.sequence2} ${sb.resolution}`}">${icon("volume")} ${T("Listen to story", "Escuchar historia")}</button>` : ""}
      </div>
      <p lang="en"><strong>${sb.character}</strong> · <em>${sb.problem}</em></p>
      <blockquote class="learn-quote" lang="en">${sb.sequence1} ${sb.sequence2} ${sb.resolution}</blockquote>
      <div class="row-actions">
        <button type="button" class="btn btn-primary" data-sb-publish>
          ${icon("check")} ${T("Publish Story to My Portfolio", "Publicar historia en mi portafolio")}
        </button>
      </div>
      ${sb.published ? html`<p class="feedback is-ok" role="status">${icon("check")} ${T("Story saved to your local Language Portfolio and Evidence Ledger!", "¡Historia guardada en tu Portafolio de lenguaje y registro de evidencia!")}</p>` : ""}
    </div>
  </section>`;
}

function renderCollabStudio(state, band, I) {
  const { T } = I;
  const col = state.collab || {
    partnerClaim:
      "Partner A (Mateo's Dispatch): Our solar water pump stopped at noon, even though the battery meter showed 90% charge.",
    myClue:
      "Partner B (Your Wiring Diagram): The intake filter screen at Creek Bed B is clogged with autumn leaves, blocking water flow.",
    jointSynthesis: "",
    completed: false,
  };
  return html`<section class="panel reality-substudio" aria-labelledby="collabTitle" data-content>
    <div class="learn-wb-head">
      <div>
        <p class="eyebrow">${icon("families")} ${T("Innovation 12 · Asynchronous Collaborative Communication", "Innovación 12 · Comunicación colaborativa asíncrona")}</p>
        <h2 id="collabTitle">${T("Information-Gap Partner Mission", "Misión en pareja de brecha de información")}</h2>
        <p class="fine">${T(
          "Combine your partner's audio/text dispatch with your exclusive diagram clue to co-construct a complete explanation. Works asynchronously without requiring a live network connection.",
          "Combina el mensaje de tu compañero con tu pista exclusiva del diagrama para construir juntos una explicación completa.",
        )}</p>
      </div>
    </div>
    <div class="learn-steps-grid">
      <div class="learn-step-card">
        <h3>${icon("listening")} ${T("Partner A's Observation", "Observación del Compañero A")}</h3>
        <p lang="en">${col.partnerClaim}</p>
        ${canSpeak() ? html`<button type="button" class="btn small" data-reality-say="${col.partnerClaim}">${icon("play")} ${T("Hear partner dispatch", "Escuchar al compañero")}</button>` : ""}
      </div>
      <div class="learn-step-card">
        <h3>${icon("search")} ${T("Your Exclusive Diagram Clue (Partner B)", "Tu pista exclusiva del diagrama (Compañero B)")}</h3>
        <p lang="en">${col.myClue}</p>
      </div>
    </div>
    <div class="learn-step-card">
      <h3>${icon("writing")} ${T("Joint Collaborative Explanation", "Explicación colaborativa conjunta")}</h3>
      <p class="fine">${T(
        "Combine both clues: explain why the pump stopped despite having 90% battery and what the team should clean.",
        "Combina ambas pistas: explica por qué se detuvo la bomba a pesar de tener 90% de batería y qué debe limpiar el equipo.",
      )}</p>
      <div class="learn-chip-row">
        <button type="button" class="cat-chip" data-collab-insert="Although the battery had 90% charge, the pump stopped because the intake filter was clogged with leaves.">
          ${icon("writing")} ${T("Insert combined starter", "Insertar comienzo combinado")}
        </button>
      </div>
      <label class="field">
        <span class="visually-hidden">${T("Collaborative synthesis", "Síntesis colaborativa")}</span>
        <textarea id="collabInput" rows="3" data-collab-draft ${IGN}>${col.jointSynthesis}</textarea>
      </label>
      <div class="row-actions">
        <button type="button" class="btn btn-primary" data-collab-submit>
          ${icon("check")} ${T("Verify Partner Synthesis", "Verificar síntesis en pareja")}
        </button>
      </div>
      ${col.completed ? html`<p class="feedback is-ok" role="status">${icon("check")} ${T("Collaborative mission verified! You combined Partner A's battery observation with Partner B's filter clue.", "¡Misión colaborativa verificada! Combinaste la observación de batería con la pista del filtro.")}</p>` : ""}
    </div>
  </section>`;
}

function renderStudentGameMaker(state, band, I) {
  const { T } = I;
  const gm = state.studentGame || {
    title: "Watershed Vocabulary Challenge",
    targetWord: "permeable",
    clue: "A surface that allows water to soak through into the soil instead of flooding the street.",
    distractor: "A solid concrete wall that blocks all water.",
    tested: false,
    pickedCorrect: null,
  };
  return html`<section class="panel reality-substudio" aria-labelledby="gameMakerTitle" data-content>
    <div class="learn-wb-head">
      <div>
        <p class="eyebrow">${icon("sparkle")} ${T("Innovation 13 · Student-Created Language Games", "Innovación 13 · Juegos de lenguaje creados por estudiantes")}</p>
        <h2 id="gameMakerTitle">${T("Student Game Authoring Studio", "Estudio de creación de juegos para estudiantes")}</h2>
        <p class="fine">${T(
          "Design your own vocabulary or clue mystery card, validate that it is solvable, and play-test it right on screen.",
          "Diseña tu propio desafío de vocabulario o pistas, valida que tenga solución y pruébalo en pantalla.",
        )}</p>
      </div>
    </div>
    <div class="learn-steps-grid">
      <div class="learn-step-card">
        <h3>${icon("writing")} ${T("1. Author Your Game Challenge", "1. Crea tu desafío de juego")}</h3>
        <label class="field">
          <span>${T("Game Title", "Título del juego")}</span>
          <input type="text" data-gm-field="title" value="${gm.title}" ${IGN} />
        </label>
        <label class="field">
          <span>${T("Target Academic Word", "Palabra académica meta")}</span>
          <input type="text" data-gm-field="targetWord" value="${gm.targetWord}" ${IGN} />
        </label>
        <label class="field">
          <span>${T("Correct Context Clue / Definition", "Pista de contexto o definición correcta")}</span>
          <input type="text" data-gm-field="clue" value="${gm.clue}" ${IGN} />
        </label>
        <label class="field">
          <span>${T("Distractor Choice (Wrong Meaning)", "Opción distractora (significado incorrecto)")}</span>
          <input type="text" data-gm-field="distractor" value="${gm.distractor}" ${IGN} />
        </label>
      </div>
      <div class="learn-step-card">
        <h3>${icon("sparkle")} ${T("2. Live Play-Test Console", "2. Consola de prueba en vivo")}</h3>
        <p><strong>${gm.title}</strong> · ${T("Which definition matches", "Qué definición corresponde a")} <mark lang="en">${gm.targetWord}</mark>?</p>
        <div class="learn-options">
          <button type="button" class="learn-opt-btn ${gm.pickedCorrect === true ? "is-correct" : ""}" data-gm-play="correct">
            <span class="learn-opt-indicator">${icon(gm.pickedCorrect === true ? "check" : "chevron-right")}</span>
            <span lang="en">${gm.clue}</span>
          </button>
          <button type="button" class="learn-opt-btn ${gm.pickedCorrect === false ? "is-try" : ""}" data-gm-play="wrong">
            <span class="learn-opt-indicator">${icon(gm.pickedCorrect === false ? "retry" : "chevron-right")}</span>
            <span lang="en">${gm.distractor}</span>
          </button>
        </div>
        ${gm.tested ? html`<p class="feedback ${gm.pickedCorrect ? "is-ok" : "is-hint"}" role="status">${gm.pickedCorrect ? T("Play-test passed! Your student-created game card is validated and saved on this device.", "¡Prueba superada! Tu tarjeta de juego creada por el estudiante está validada y guardada.") : T("Distractor tested! Click the correct clue above to verify the win state.", "¡Distractor probado! Haz clic en la pista correcta arriba para verificar la victoria.")}</p>` : ""}
      </div>
    </div>
  </section>`;
}

function renderTeacherMissionBuilder(state, band, I) {
  const { T } = I;
  const customList = state.customMissions || [];
  return html`<section class="panel reality-substudio" aria-labelledby="teacherBuilderTitle" data-content>
    <div class="learn-wb-head">
      <div>
        <p class="eyebrow">${icon("teacher")} ${T("Innovation 19 · No-Code Teacher Reality Mission Builder", "Innovación 19 · Constructor docente de misiones sin código")}</p>
        <h2 id="teacherBuilderTitle">${T("Build, Validate, and Preview a Language Reality Mission", "Construye, valida y previsualiza una misión de Realidad Lingüística")}</h2>
        <p class="fine">${T(
          "Configure a WIDA-aligned Reality Mission with original listening, reading evidence, target keywords, and communicative consequences. Saved missions immediately become playable in the selected world.",
          "Configura una misión alineada con WIDA con audio original, evidencia de lectura, palabras clave y consecuencias comunicativas.",
        )}</p>
      </div>
    </div>
    <div class="learn-steps-grid">
      <div class="learn-step-card">
        <h3>${icon("tools")} ${T("1. Standards, World & Source Setup", "1. Configuración de estándares, mundo y fuentes")}</h3>
        <label class="field">
          <span>${T("Mission Title", "Título de la misión")}</span>
          <input type="text" data-tb-field="title" value="${builderDraft.title}" ${IGN} />
        </label>
        <div class="learn-steps-grid">
          <label class="field">
            <span>${T("Target World", "Mundo destino")}</span>
            <select data-tb-field="worldId" ${IGN}>
              ${FLAGSHIP_WORLDS.map((w) => html`<option value="${w.id}" ${builderDraft.worldId === w.id ? raw("selected") : ""}>${w.title[0]}</option>`)}
            </select>
          </label>
          <label class="field">
            <span>${T("Grade Band", "Grupo de grados")}</span>
            <select data-tb-field="band" ${IGN}>
              <option value="3-5" ${builderDraft.band === "3-5" ? raw("selected") : ""}>Grades 3–5</option>
              <option value="6-8" ${builderDraft.band === "6-8" ? raw("selected") : ""}>Grades 6–8</option>
            </select>
          </label>
        </div>
        <div class="learn-steps-grid">
          <label class="field">
            <span>${T("WIDA Key Language Use", "Uso clave del lenguaje WIDA")}</span>
            <select data-tb-field="klu" ${IGN}>
              ${["Narrate", "Inform", "Explain", "Argue"].map((k) => html`<option value="${k}" ${builderDraft.klu === k ? raw("selected") : ""}>${k}</option>`)}
            </select>
          </label>
          <label class="field">
            <span>${T("WIDA ELD Standard", "Estándar WIDA ELD")}</span>
            <input type="text" data-tb-field="eldStandard" value="${builderDraft.eldStandard}" ${IGN} />
          </label>
        </div>
        <label class="field">
          <span>${T("Character Guide Name", "Nombre del personaje guía")}</span>
          <input type="text" data-tb-field="characterName" value="${builderDraft.characterName}" ${IGN} />
        </label>
        <label class="field">
          <span>${T("Listening Audio Script", "Guion de audio de escucha")}</span>
          <textarea rows="2" data-tb-field="audioScript" ${IGN}>${builderDraft.audioScript}</textarea>
        </label>
      </div>
      <div class="learn-step-card">
        <h3>${icon("check")} ${T("2. Evidence, Keywords & Consequence", "2. Evidencia, palabras clave y consecuencia")}</h3>
        <label class="field">
          <span>${T("Reading Evidence Clue", "Pista de evidencia de lectura")}</span>
          <textarea rows="2" data-tb-field="readingClue" ${IGN}>${builderDraft.readingClue}</textarea>
        </label>
        <label class="field">
          <span>${T("Student Communication Prompt", "Consigna de comunicación para el estudiante")}</span>
          <textarea rows="2" data-tb-field="communicatePrompt" ${IGN}>${builderDraft.communicatePrompt}</textarea>
        </label>
        <label class="field">
          <span>${T("Target Evidence Keywords (comma-separated)", "Palabras clave de evidencia (separadas por coma)")}</span>
          <input type="text" data-tb-field="keywords" value="${builderDraft.keywords}" ${IGN} />
        </label>
        <label class="field">
          <span>${T("Unlocked Communicative Consequence", "Consecuencia comunicativa desbloqueada")}</span>
          <textarea rows="2" data-tb-field="consequenceFull" ${IGN}>${builderDraft.consequenceFull}</textarea>
        </label>
        <div class="row-actions">
          <button type="button" class="btn btn-primary" data-tb-save>
            ${icon("check")} ${T("Validate & Save Reality Mission", "Validar y guardar misión")}
          </button>
        </div>
        ${builderFeedback ? html`<p class="feedback ${builderFeedback.ok ? "is-ok" : "is-hint"}" role="status">${builderFeedback.msg}</p>` : ""}
      </div>
    </div>
    ${customList.length ? html`<div class="learn-stimulus-box">
      <strong>${icon("launch")} ${T(`Saved Teacher Reality Missions (${customList.length})`, `Misiones docentes guardadas (${customList.length})`)}</strong>
      <div class="learn-chip-row">
        ${customList.map((m) => html`<button type="button" class="btn small" data-tb-launch="${m.id}" data-tb-world="${m.worldId}">${icon("play")} ${m.title[0]} (${m.band} · ${m.klu})</button>`)}
      </div>
    </div>` : ""}
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const { T, S } = I;
  const band = ctx.band;
  const state = loadRealityState();

  const routeWorldId = ctx.route.id;
  if (routeWorldId && FLAGSHIP_WORLDS.some((w) => w.id === routeWorldId) && state.activeWorldId !== routeWorldId) {
    state.activeWorldId = routeWorldId;
    saveRealityState(state);
  }
  const world = FLAGSHIP_WORLDS.find((w) => w.id === state.activeWorldId) || FLAGSHIP_WORLDS[0];
  const customForWorld = (state.customMissions || []).filter(
    (m) => m.worldId === world.id && (!m.band || m.band === band),
  );
  const missionPool = [...(world.missions[band] || world.missions["6-8"] || []), ...customForWorld];
  const mission = resolveMission(state, world, band);
  const mKey = `${band}:${world.id}:${mission.id}`;
  const mProg = state.progress[mKey] || {
    heardAudio: false,
    pinnedClues: [],
    clarifyQuestion: "",
    clarifyAsked: false,
    clarifyUnlocked: false,
    responseMode: "write",
    responseDraft: "",
    evaluated: null,
    transferDraft: "",
    transferDone: false,
    completed: false,
  };
  const tier = state.supportTier || "B";
  const frames = mission.frames?.[tier] || mission.frames?.B || [];
  const totalCompleted = Object.values(state.progress).filter((p) => p?.completed).length;

  return {
    title: S("Language Reality Engine", "Motor de Realidad Lingüística"),
    html: html`${crumbsHTML([
      [S("My Home", "Mi inicio"), `${BASE}/?grades=${band}`],
      [S("Language Reality", "Realidad Lingüística"), null],
    ])}
    <div class="learn-page reality-page" data-band="${band}">
      <header class="prog-hero reality-hero ${world.colorClass} is-tint">
        <div class="prog-hero-copy">
          <p class="eyebrow">${icon("worlds")} ${T(
            `EduWonderLab Language Reality · ${bandLabel(band)}`,
            `Realidad Lingüística EduWonderLab · Grados ${band.replace("-", "–")}`,
          )}</p>
          <h1 tabindex="-1">${T("Live the Story. Use the Language.", "Vive la historia. Usa el lenguaje.")}</h1>
          <p class="lead">${T(
            "Enter living worlds where what you listen to, read, say, and write changes what characters do next. Ask clarification questions, cite evidence, and unlock real consequences.",
            "Entra en mundos vivos donde lo que escuchas, lees, dices y escribes cambia lo que hacen los personajes. Haz preguntas de aclaración, cita evidencia y desbloquea consecuencias reales.",
          )}</p>
          <div class="learn-hero-bar">
            ${bandSwitchHTML(band, ctx.bands, { i18n: I })}
            <span class="learn-progress-pill" role="status">
              ${icon("check")} ${T(
                `${totalCompleted} Reality mission${totalCompleted === 1 ? "" : "s"} completed on this device`,
                `${totalCompleted} ${totalCompleted === 1 ? "misión completada" : "misiones completadas"} en este dispositivo`,
              )}
            </span>
          </div>
        </div>
        <div class="prog-hero-art">
          <img src="${ART}/${world.art}" alt="" width="380" height="240" />
        </div>
      </header>

      <nav class="learn-chip-row reality-mode-bar" aria-label="${S("Language Reality Studios", "Estudios de Realidad Lingüística")}">
        ${[
          ["worlds", "worlds", T("3 Flagship Worlds", "3 Mundos Principales")],
          ["story-builder", "writing", T("Interactive Story Builder", "Constructor de Historias")],
          ["collab", "families", T("Collaborative Partner Mission", "Misión Colaborativa")],
          ["game-maker", "sparkle", T("Student Game Creator", "Creador de Juegos")],
          ["teacher-builder", "teacher", T("Teacher Mission Builder", "Constructor Docente")],
        ].map(
          ([id, ic, label]) => html`<button
            type="button"
            class="cat-chip ${activeTab === id ? "is-active" : ""}"
            data-reality-tab="${id}"
            aria-pressed="${String(activeTab === id)}"
          >
            ${icon(ic)} ${label}
          </button>`,
        )}
      </nav>

      ${
        activeTab === "story-builder"
          ? renderStoryBuilder(state, band, I)
          : activeTab === "collab"
            ? renderCollabStudio(state, band, I)
            : activeTab === "game-maker"
              ? renderStudentGameMaker(state, band, I)
              : activeTab === "teacher-builder"
                ? renderTeacherMissionBuilder(state, band, I)
                : html`
      <section class="panel reality-personalize" aria-labelledby="personalizeWorldTitle">
        <div class="learn-wb-head">
          <div>
            <p class="eyebrow">${icon("sparkle")} ${T("Personalized World Discovery", "Descubrimiento personalizado de mundos")}</p>
            <h2 id="personalizeWorldTitle">${T("What world would you like to explore today?", "¿Qué mundo te gustaría explorar hoy?")}</h2>
          </div>
        </div>
        <div class="learn-tracks" role="group" aria-label="${S("Choose a Flagship Language World", "Elige un Mundo Principal")}">
          ${FLAGSHIP_WORLDS.map((w) => {
            const isCurrent = w.id === world.id;
            return html`<button
              type="button"
              class="learn-track-tab ${w.colorClass} ${isCurrent ? "is-active" : ""}"
              data-reality-world="${w.id}"
              aria-pressed="${String(isCurrent)}"
            >
              <span class="learn-tab-ico">${icon("worlds")}</span>
              <span class="learn-tab-text">
                <strong>${T(...w.title)}</strong>
                <small>${w.klu} · ${T(...w.tagline)}</small>
              </span>
            </button>`;
          })}
        </div>
        <div class="reality-interest-bar">
          <label class="field">
            <span><strong>${T("Or describe an adventure you want to try:", "O describe una aventura que quieras probar:")}</strong> ${T("(e.g., 'I want to investigate an ocean mystery' or 'I want to interview a soccer coach')", "(p. ej., 'I want to investigate an ocean mystery' o 'I want to interview a soccer coach')")}</span>
            <div class="reality-interest-row">
              <input
                type="text"
                id="realityInterestInput"
                value="${state.interestMatch?.input || ""}"
                placeholder="${S("I want to investigate an ocean mystery...", "Quiero investigar un misterio del océano...")}"
                ${IGN}
              />
              <button type="button" class="btn" data-reality-match>
                ${icon("search")} ${T("Match My Adventure", "Conectar mi aventura")}
              </button>
            </div>
          </label>
          ${
            state.interestMatch
              ? html`<p class="feedback is-ok" role="status">
                  <strong>${icon("check")} ${T(...state.interestMatch.roleTitle)}:</strong> ${T(...state.interestMatch.explanation)}
                </p>`
              : ""
          }
        </div>
      </section>

      <article class="panel learn-workbench reality-console ${world.colorClass}" aria-labelledby="realityMissionTitle" data-content>
        <header class="learn-wb-head">
          <div>
            <p class="eyebrow">${domainGlyph(world.domain)} ${mission.eldStandard} · ${T("Key Language Use:", "Uso clave:")} <strong>${mission.klu}</strong></p>
            <h2 id="realityMissionTitle">${T(...mission.title)}</h2>
            <p class="fine"><strong>${T("Mission Goal:", "Meta de la misión:")}</strong> ${T(...mission.goal)}</p>
          </div>
          <div class="learn-chip-row" role="group" aria-label="${S("Choose mission in this world", "Elige misión en este mundo")}">
            ${missionPool.map(
              (m) => html`<button
                type="button"
                class="cat-chip ${m.id === mission.id ? "is-active" : ""}"
                data-reality-mission="${m.id}"
                aria-pressed="${String(m.id === mission.id)}"
              >
                ${state.progress[`${band}:${world.id}:${m.id}`]?.completed ? icon("check") : icon("flag")} ${T(...m.title)}
              </button>`,
            )}
          </div>
        </header>

        <div class="learn-cycle-steps" aria-label="${S("Mission progression steps", "Pasos de avance de la misión")}">
          <span class="cycle-pill ${mProg.heardAudio ? "is-done" : "is-now"}">1 · ${T("Listen", "Escuchar")}</span>
          <span class="cycle-pill ${(mProg.pinnedClues?.length || 0) > 0 ? "is-done" : "is-now"}">2 · ${T("Read & Pin Evidence", "Leer y fijar evidencia")}</span>
          <span class="cycle-pill ${mProg.clarifyUnlocked ? "is-done" : "is-now"}">3 · ${T("Ask Clarification", "Pedir aclaración")}</span>
          <span class="cycle-pill ${mProg.evaluated?.ok ? "is-done" : "is-now"}">4 · ${T("Communicate & Consequence", "Comunicar y consecuencia")}</span>
          <span class="cycle-pill ${mProg.completed ? "is-done" : ""}">5 · ${T("Apply & Save", "Aplicar y guardar")}</span>
        </div>

        <aside class="learn-stimulus-box reality-coach-banner" aria-label="${S("Contextual AI Language Coach", "Entrenador contextual de lenguaje")}">
          <div class="learn-stimulus-head">
            <strong>${icon("bulb")} ${T("Contextual Language Coach (Grounded in Task Evidence)", "Entrenador contextual de lenguaje (basado en evidencia)")}</strong>
            <div class="learn-chip-row" role="group" aria-label="${S("Instructional support choice", "Elección de apoyo")}">
              ${["A", "B", "C"].map(
                (tKey) => html`<button
                  type="button"
                  class="cat-chip ${tier === tKey ? "is-active" : ""}"
                  data-reality-tier="${tKey}"
                  aria-pressed="${String(tier === tKey)}"
                >
                  ${TIERS[tKey]?.name || tKey}
                </button>`,
              )}
            </div>
          </div>
          <p class="fine" role="status">${aiCoachInsight(mission, mProg, tier, I)}</p>
        </aside>

        <div class="learn-steps-grid">
          <section class="learn-step-card ${mProg.heardAudio ? "is-complete" : ""}" aria-labelledby="realityListenTitle">
            <h3 id="realityListenTitle">${icon("listening")} ${T("1. Listen to Character Dispatch", "1. Escucha el mensaje del personaje")} · ${mission.audioCharacter}</h3>
            <blockquote class="learn-quote" lang="en">${mission.audioScript}</blockquote>
            <div class="row-actions">
              ${
                canSpeak()
                  ? html`<button type="button" class="btn btn-primary small" data-reality-listen="${mission.audioScript}">
                      ${icon("play")} ${T("Play character voice", "Escuchar voz del personaje")}
                    </button>`
                  : ""
              }
              <button type="button" class="btn small" data-reality-mark-heard>
                ${icon("check")} ${mProg.heardAudio ? T("Audio clue noted", "Pista de audio anotada") : T("I listened / read the dispatch", "Escuché / leí el mensaje")}
              </button>
            </div>
          </section>

          <section class="learn-step-card ${(mProg.pinnedClues?.length || 0) > 0 ? "is-complete" : ""}" aria-labelledby="realityReadTitle">
            <h3 id="realityReadTitle">${icon("reading")} ${T("2. Read & Pin Source Evidence", "2. Lee y fija evidencia de la fuente")} · ${T(...mission.readingTitle)}</h3>
            <p class="fine">${T("Click the evidence clue(s) that help solve this mission:", "Haz clic en las pistas de evidencia que ayudan a resolver esta misión:")}</p>
            <div class="learn-options">
              ${mission.readingClues.map((clue) => {
                const pinned = (mProg.pinnedClues || []).includes(clue.id);
                return html`<button
                  type="button"
                  class="learn-opt-btn ${pinned ? (clue.relevant ? "is-correct" : "is-try") : ""}"
                  data-reality-pin="${clue.id}"
                  aria-pressed="${String(pinned)}"
                >
                  <span class="learn-opt-indicator">${icon(pinned ? (clue.relevant ? "pin" : "info") : "chevron-right")}</span>
                  <span>${T(...clue.label)}</span>
                </button>`;
              })}
            </div>
          </section>
        </div>

        <section class="learn-step-card ${mProg.clarifyUnlocked ? "is-complete" : ""}" aria-labelledby="realityClarifyTitle">
          <h3 id="realityClarifyTitle">${icon("speaking")} ${T("3. Ask a Clarification Question", "3. Haz una pregunta de aclaración")}</h3>
          <p class="fine">${T(...mission.clarifyPrompt)}</p>
          <div class="learn-chip-row">
            <button type="button" class="cat-chip" data-reality-clarify-sample="Who took the notebook and where on the rack is it?">
              ${icon("bulb")} ${T("Try sample question", "Probar pregunta de ejemplo")}
            </button>
          </div>
          <div class="reality-clarify-row">
            <label class="field">
              <span class="visually-hidden">${T("Your clarification question", "Tu pregunta de aclaración")}</span>
              <input
                type="text"
                id="realityClarifyInput"
                value="${mProg.clarifyQuestion || ""}"
                placeholder="${S("Type your question for the character...", "Escribe tu pregunta para el personaje...")}"
                ${IGN}
              />
            </label>
            <button type="button" class="btn btn-primary" data-reality-ask>
              ${icon("speaking")} ${T("Ask Character", "Preguntar al personaje")}
            </button>
          </div>
          ${
            mProg.clarifyAsked
              ? html`<div class="feedback ${mProg.clarifyUnlocked ? "is-ok" : "is-hint"}" role="status">
                  <p>${T(...(mProg.clarifyUnlocked ? mission.clarifyUnlock : mission.clarifyFallback))}</p>
                </div>`
              : ""
          }
        </section>

        <section class="learn-step-card ${mProg.evaluated?.ok ? "is-complete" : ""}" aria-labelledby="realityCommunicateTitle">
          <h3 id="realityCommunicateTitle">${icon("writing")} ${T("4. Communicate & Experience Consequences", "4. Comunica y experimenta las consecuencias")}</h3>
          <p>${T(...mission.communicatePrompt)}</p>

          ${
            tier !== "C"
              ? html`<div class="learn-frames-bar">
                  <span class="fine"><strong>${T(`Support Scaffolds (${TIERS[tier]?.name || tier}): Click to insert into your response`, `Apoyos (${TIERS[tier]?.es || tier}): Haz clic para insertar`)}</strong></span>
                  <div class="learn-chip-row">
                    ${frames.map(
                      (f) => html`<button type="button" class="cat-chip" data-reality-insert="${f.replace(/___/g, "")}">
                        ${icon("writing")} ${f}
                      </button>`,
                    )}
                  </div>
                  <div class="learn-chip-row">
                    ${(mission.wordBank || []).map(
                      (w) => html`<button type="button" class="cat-chip is-word" data-reality-insert="${w}">
                        + ${w}
                      </button>`,
                    )}
                  </div>
                </div>`
              : html`<p class="fine">${T("Expanding Support (C): Build your response independently, or switch to Starting/Growing above if you want sentence frames.", "Apoyo Ampliando (C): Construye tu respuesta de forma independiente o cambia a Comenzando/Creciendo arriba si deseas marcos de oración.")}</p>`
          }

          <details class="strategy">
            <summary>${icon("speaking")} ${T("Optional: Rehearse & Record Aloud (Speaking Studio Integration)", "Opcional: Ensayar y grabar en voz alta")}</summary>
            ${recorderHTML(`reality-${mission.id}`, { i18n: I })}
          </details>

          <label class="field">
            <span>${T("Your Spoken Transcript or Written Communication", "Tu transcripción oral o comunicación escrita")}</span>
            <textarea
              id="realityResponseInput"
              rows="4"
              data-reality-draft
              placeholder="${S("Communicate your explanation or argument with evidence...", "Comunica tu explicación o argumento con evidencia...")}"
              ${IGN}
            >${mProg.responseDraft || ""}</textarea>
          </label>

          <div class="row-actions">
            <button type="button" class="btn btn-primary" data-reality-submit>
              ${icon("check")} ${T("Send Communication to World", "Enviar comunicación al mundo")}
            </button>
            ${
              canSpeak()
                ? html`<button type="button" class="btn" data-reality-speak-draft>
                    ${icon("volume")} ${T("Hear my communication aloud", "Escuchar mi comunicación")}
                  </button>`
                : ""
            }
          </div>

          ${
            mProg.evaluated
              ? html`<div class="feedback ${mProg.evaluated.ok ? "is-ok" : "is-hint"}" role="status">
                  <p><strong>${T(...mProg.evaluated.consequenceText)}</strong></p>
                  <ul class="checks">
                    ${mProg.evaluated.concepts.map(
                      (c) => html`<li class="${c.met ? "ok" : ""}">
                        ${icon(c.met ? "check" : "retry")}
                        <span>${T(...c.label)}: <strong>${c.met ? T("Communicated", "Comunicado") : T("Add this detail and revise", "Agrega este detalle y revisa")}</strong></span>
                      </li>`,
                    )}
                  </ul>
                </div>`
              : ""
          }
        </section>

        <section class="learn-step-card ${mProg.completed ? "is-complete" : ""}" aria-labelledby="realityTransferTitle">
          <h3 id="realityTransferTitle">${icon("launch")} ${T("5. Apply & Save to Passport Portfolio", "5. Aplica y guarda en el portafolio del Pasaporte")}</h3>
          <p>${T(...mission.transferPrompt)}</p>
          <label class="field">
            <span class="visually-hidden">${T("Independent transfer response", "Respuesta de aplicación independiente")}</span>
            <textarea
              id="realityTransferInput"
              rows="2"
              data-reality-transfer-draft
              placeholder="${S("Write your fresh transfer sentence here...", "Escribe tu oración de aplicación nueva aquí...")}"
              ${IGN}
            >${mProg.transferDraft || ""}</textarea>
          </label>
          <div class="row-actions">
            <button type="button" class="btn btn-primary" data-reality-complete>
              ${icon("passport")} ${T("Complete Mission & Save Evidence to Passport", "Completar misión y guardar evidencia en el Pasaporte")}
            </button>
            <a class="btn" href="${BASE}/growth?grades=${band}">
              ${icon("growth")} ${T("View My Growth Map", "Ver mi Mapa de Crecimiento")}
            </a>
          </div>
          ${
            mProg.completed
              ? html`<p class="feedback is-ok" role="status">
                  ${icon("check")} ${T(
                    "Mission complete! Your communication evidence has been recorded in your Language Growth Map and Passport.",
                    "¡Misión completada! Tu evidencia de comunicación se guardó en tu Mapa de Crecimiento y Pasaporte.",
                  )}
                </p>`
              : ""
          }
        </section>
      </article>`
      }
    </div>`,
  };
}

export function onInput(e, ctx) {
  const state = loadRealityState();
  const band = ctx.band;
  const world = FLAGSHIP_WORLDS.find((w) => w.id === state.activeWorldId) || FLAGSHIP_WORLDS[0];
  const mission = resolveMission(state, world, band);
  const mKey = `${band}:${world.id}:${mission.id}`;
  const cur = state.progress[mKey] || {};

  if (e.target.matches?.("[data-reality-draft]")) {
    state.progress[mKey] = { ...cur, responseDraft: e.target.value };
    saveRealityState(state);
    return;
  }
  if (e.target.matches?.("[data-reality-transfer-draft]")) {
    state.progress[mKey] = { ...cur, transferDraft: e.target.value };
    saveRealityState(state);
    return;
  }
  if (e.target.matches?.("[data-sb-field]")) {
    const f = e.target.dataset.sbField;
    state.storyBuilder = {
      ...(state.storyBuilder || {}),
      [f]: e.target.value,
    };
    saveRealityState(state);
    return;
  }
  if (e.target.matches?.("[data-collab-draft]")) {
    state.collab = { ...(state.collab || {}), jointSynthesis: e.target.value };
    saveRealityState(state);
    return;
  }
  if (e.target.matches?.("[data-gm-field]")) {
    const f = e.target.dataset.gmField;
    state.studentGame = { ...(state.studentGame || {}), [f]: e.target.value };
    saveRealityState(state);
    return;
  }
  if (e.target.matches?.("[data-tb-field]")) {
    builderDraft = { ...builderDraft, [e.target.dataset.tbField]: e.target.value };
  }
}

export function onChange(e, ctx) {
  onInput(e, ctx);
  if (e.target.matches?.("select[data-sb-field], select[data-tb-field]")) {
    ctx.rerender({ keepFocus: true });
  }
}

export function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const state = loadRealityState();
  const world = FLAGSHIP_WORLDS.find((w) => w.id === state.activeWorldId) || FLAGSHIP_WORLDS[0];
  const mission = resolveMission(state, world, band);
  const mKey = `${band}:${world.id}:${mission.id}`;
  const cur = state.progress[mKey] || {};

  const tabBtn = e.target.closest?.("[data-reality-tab]");
  if (tabBtn) {
    activeTab = tabBtn.dataset.realityTab;
    ctx.rerender();
    return true;
  }

  const worldBtn = e.target.closest?.("[data-reality-world]");
  if (worldBtn) {
    state.activeWorldId = worldBtn.dataset.realityWorld;
    state.activeMissionId = "";
    saveRealityState(state);
    ctx.rerender();
    return true;
  }

  const missionBtn = e.target.closest?.("[data-reality-mission]");
  if (missionBtn) {
    state.activeMissionId = missionBtn.dataset.realityMission;
    saveRealityState(state);
    ctx.rerender();
    return true;
  }

  const tierBtn = e.target.closest?.("[data-reality-tier]");
  if (tierBtn) {
    state.supportTier = tierBtn.dataset.realityTier;
    saveRealityState(state);
    ctx.rerender({ keepFocus: true });
    return true;
  }

  if (e.target.closest?.("[data-reality-match]")) {
    const input = document.getElementById("realityInterestInput")?.value || "";
    const matched = matchAdventureInterest(input || "mystery");
    if (matched) {
      state.interestMatch = matched;
      state.activeWorldId = matched.worldId;
      state.activeMissionId = "";
      saveRealityState(state);
      ctx.rerender();
    }
    return true;
  }

  const sayBtn = e.target.closest?.("[data-reality-say]");
  if (sayBtn) {
    speak(sayBtn.dataset.realitySay, { rate: 0.92 });
    return true;
  }

  const listenBtn = e.target.closest?.("[data-reality-listen]");
  if (listenBtn) {
    speak(listenBtn.dataset.realityListen, { rate: 0.92 });
    state.progress[mKey] = { ...cur, heardAudio: true };
    saveRealityState(state);
    ctx.rerender({ keepFocus: true });
    return true;
  }

  if (e.target.closest?.("[data-reality-mark-heard]")) {
    state.progress[mKey] = { ...cur, heardAudio: true };
    saveRealityState(state);
    ctx.rerender({ keepFocus: true });
    return true;
  }

  const pinBtn = e.target.closest?.("[data-reality-pin]");
  if (pinBtn) {
    const cId = pinBtn.dataset.realityPin;
    const prev = new Set(cur.pinnedClues || []);
    prev.has(cId) ? prev.delete(cId) : prev.add(cId);
    state.progress[mKey] = { ...cur, pinnedClues: [...prev] };
    saveRealityState(state);
    ctx.rerender({ keepFocus: true });
    return true;
  }

  const sampleQ = e.target.closest?.("[data-reality-clarify-sample]");
  if (sampleQ) {
    const q = `Why did ${mission.clarifyKeywords?.[0] || "that"} happen, and where is the ${mission.clarifyKeywords?.[1] || "clue"}?`;
    state.progress[mKey] = { ...cur, clarifyQuestion: q };
    saveRealityState(state);
    ctx.rerender().then(() => document.getElementById("realityClarifyInput")?.focus());
    return true;
  }

  if (e.target.closest?.("[data-reality-ask]")) {
    const qText = document.getElementById("realityClarifyInput")?.value || cur.clarifyQuestion || "";
    const res = evaluateClarification(qText, mission);
    state.progress[mKey] = {
      ...cur,
      clarifyQuestion: qText,
      clarifyAsked: true,
      clarifyUnlocked: cur.clarifyUnlocked || res.ok,
    };
    saveRealityState(state);
    ctx.rerender({ keepFocus: true });
    return true;
  }

  const insertBtn = e.target.closest?.("[data-reality-insert]");
  if (insertBtn) {
    const snippet = insertBtn.dataset.realityInsert;
    const box = document.getElementById("realityResponseInput");
    const prev = (box ? box.value : cur.responseDraft || "").trim();
    const next = prev ? `${prev} ${snippet}` : snippet;
    state.progress[mKey] = { ...cur, responseDraft: next };
    saveRealityState(state);
    ctx.rerender().then(() => document.getElementById("realityResponseInput")?.focus());
    return true;
  }

  if (e.target.closest?.("[data-reality-speak-draft]")) {
    const text = (document.getElementById("realityResponseInput")?.value || cur.responseDraft || "").trim();
    if (text) speak(text, { rate: 0.92 });
    return true;
  }

  if (e.target.closest?.("[data-reality-submit]")) {
    const text = document.getElementById("realityResponseInput")?.value || cur.responseDraft || "";
    const ev = evaluateCommunication(text, mission);
    state.progress[mKey] = {
      ...cur,
      responseDraft: text,
      evaluated: ev,
    };
    saveRealityState(state);
    if (ev.words >= 4) {
      const ledger = loadLedger();
      appendEntry(ledger, {
        src: "mission",
        task: `reality:${world.id}:${mission.id}`,
        band,
        domain: world.domain,
        use: mission.klu,
        kind: cur.evaluated ? "revision" : "first",
        stage: state.supportTier === "C" ? "independent" : "supported",
        supports: { frames: state.supportTier !== "C", bank: state.supportTier !== "C" },
        m: {
          words: ev.words,
          moves: ev.metCount,
          cites: (cur.pinnedClues || []).length ? 1 : 0,
          link: ev.concepts.find((c) => c.id === "connector" || c.id === "discourse")?.met ? 1 : 0,
        },
      });
      saveLedger(ledger);
    }
    ctx.rerender({ keepFocus: true });
    return true;
  }

  if (e.target.closest?.("[data-reality-complete]")) {
    const responseText = document.getElementById("realityResponseInput")?.value || cur.responseDraft || "";
    const transferText = document.getElementById("realityTransferInput")?.value || cur.transferDraft || "";
    const ev = evaluateCommunication(responseText, mission);
    if (!ev.ok && wordCount(responseText) < 6) {
      announce(
        I.S(
          "Complete Step 4 with a clear communication before finishing the mission.",
          "Completa el Paso 4 con una comunicación clara antes de terminar la misión.",
        ),
      );
      state.progress[mKey] = { ...cur, responseDraft: responseText, evaluated: ev };
      saveRealityState(state);
      ctx.rerender({ keepFocus: true });
      return true;
    }
    state.progress[mKey] = {
      ...cur,
      responseDraft: responseText,
      transferDraft: transferText,
      evaluated: ev,
      transferDone: wordCount(transferText) >= 3,
      completed: true,
    };
    saveRealityState(state);
    award(ctx, `reality:${band}:${mission.id}`, 5, "Language Reality Mission");
    const ledger = loadLedger();
    appendEntry(ledger, {
      src: "mission",
      task: `reality:${world.id}:${mission.id}:transfer`,
      band,
      domain: world.domain,
      use: mission.klu,
      kind: "transfer",
      stage: "independent",
      supports: {},
      m: {
        words: wordCount(transferText || responseText),
        moves: ev.metCount,
        cites: 1,
      },
    });
    saveLedger(ledger);
    ctx.rerender({ keepFocus: true });
    return true;
  }

  // Story Builder publish
  if (e.target.closest?.("[data-sb-publish]")) {
    state.storyBuilder = {
      ...(state.storyBuilder || {}),
      published: true,
    };
    saveRealityState(state);
    const ledger = loadLedger();
    appendEntry(ledger, {
      src: "writing",
      task: `story-builder:${band}`,
      band,
      domain: "Writing",
      use: "Narrate",
      kind: "first",
      stage: "independent",
      supports: {},
      m: { words: 28, moves: 3, link: 2 },
    });
    saveLedger(ledger);
    ctx.rerender({ keepFocus: true });
    return true;
  }

  // Collab studio
  const collabIns = e.target.closest?.("[data-collab-insert]");
  if (collabIns) {
    state.collab = { ...(state.collab || {}), jointSynthesis: collabIns.dataset.collabInsert };
    saveRealityState(state);
    ctx.rerender({ keepFocus: true });
    return true;
  }
  if (e.target.closest?.("[data-collab-submit]")) {
    const val = document.getElementById("collabInput")?.value || state.collab?.jointSynthesis || "";
    if (wordCount(val) >= 5) {
      state.collab = { ...(state.collab || {}), jointSynthesis: val, completed: true };
      saveRealityState(state);
      ctx.rerender({ keepFocus: true });
    }
    return true;
  }

  // Student Game Maker play-test
  const gmPlay = e.target.closest?.("[data-gm-play]");
  if (gmPlay) {
    state.studentGame = {
      ...(state.studentGame || {}),
      tested: true,
      pickedCorrect: gmPlay.dataset.gmPlay === "correct",
    };
    saveRealityState(state);
    ctx.rerender({ keepFocus: true });
    return true;
  }

  // Teacher Mission Builder save & launch
  if (e.target.closest?.("[data-tb-save]")) {
    const res = validateCustomMission(builderDraft);
    if (!res.valid) {
      builderFeedback = { ok: false, msg: res.errors.join(" ") };
    } else {
      state.customMissions = [...(state.customMissions || []), res.mission];
      state.activeWorldId = res.mission.worldId;
      state.activeMissionId = res.mission.id;
      saveRealityState(state);
      builderFeedback = {
        ok: true,
        msg: I.T(
          `Saved "${res.mission.title[0]}"! Click its launch button below or switch to 3 Flagship Worlds to play it.`,
          `¡Se guardó "${res.mission.title[0]}"! Haz clic en su botón abajo o cambia a los 3 Mundos Principales para jugarla.`,
        ),
      };
    }
    ctx.rerender({ keepFocus: true });
    return true;
  }

  const tbLaunch = e.target.closest?.("[data-tb-launch]");
  if (tbLaunch) {
    state.activeWorldId = tbLaunch.dataset.tbWorld || "future-city";
    state.activeMissionId = tbLaunch.dataset.tbLaunch;
    saveRealityState(state);
    activeTab = "worlds";
    ctx.rerender();
    return true;
  }

  return false;
}
