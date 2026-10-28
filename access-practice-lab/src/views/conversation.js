// Conversation Simulator: realistic multi-turn academic dialogue with peers and teachers.
// Promotes academic clarification, argumentation, evidence presentation, and oral rehearsal.
import { crumbsHTML, recorderHTML } from "../components.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { isRecording } from "../recorder.js";
import { ART, BASE, announce, html, icon, raw, safeJson, storage } from "../util.js";

const CONV_KEY = "accessPracticeLab:v1:conversation";

export const SCENARIOS = [
  {
    id: "ecosystem-debate",
    title: "Ecosystem Stability: Wolves of Yellowstone",
    grade: "6-8",
    topic: "Trophic Cascades & Apex Predators",
    speakers: {
      partner: "Mateo (Lab Partner)",
      teacher: "Ms. Rivera (Science Teacher)"
    },
    turns: [
      {
        speaker: "Mateo",
        speech: "Look at the population chart from 1995 to 2010. When wolves were reintroduced, elk numbers dropped, but willow trees along riverbanks grew five times taller. I think the wolves helped the trees directly.",
        studentGoal: "Clarify Mateo's thinking by explaining the indirect connection (trophic cascade).",
        options: [
          {
            text: "I agree with your observation that willows grew, but the connection is indirect. Wolves preyed on elk, which prevented elk from overgrazing the young willow shoots.",
            academicQuality: "High",
            feedback: "Excellent! You used 'indirect' and explained the causal mechanism between wolves, elk, and willows."
          },
          {
            text: "No, wolves don't eat plants, so they have nothing to do with willows.",
            academicQuality: "Needs Expansion",
            feedback: "Try using academic language to explain *how* reducing the herbivore population allowed vegetation to recover."
          },
          {
            text: "The wolves just scared the elk away from the river so the beavers could build dams.",
            academicQuality: "Developing",
            feedback: "Good connection to beavers, but clarify why elk grazing behavior changed."
          }
        ]
      },
      {
        speaker: "Mateo",
        speech: "Oh, that makes sense! So wolves changing elk behavior caused a chain reaction. But what evidence shows that songbirds and beavers also returned to the river?",
        studentGoal: "Cite evidence linking tree growth to habitat creation for other species.",
        options: [
          {
            text: "According to the ecological survey, taller willows provided nesting canopies for migratory birds, and beavers utilized the mature wood to construct dams, creating wetlands.",
            academicQuality: "High",
            feedback: "Superb academic precision! You cited the ecological survey and used terms like 'canopies' and 'wetlands'."
          },
          {
            text: "Lots of animals came back because the river looked prettier.",
            academicQuality: "Needs Expansion",
            feedback: "Replace informal phrasing ('looked prettier') with academic terms like 'habitat restoration' and 'canopy cover'."
          }
        ]
      },
      {
        speaker: "Ms. Rivera",
        speech: "Great collaborative discussion, team. To summarize your scientific findings, how would you define a trophic cascade in your own words for our field report?",
        studentGoal: "State a scientific definition connecting predators to lower trophic levels.",
        options: [
          {
            text: "A trophic cascade is an ecological process triggered by adding or removing top predators, which reciprocally alters food chains and plant community structures throughout the ecosystem.",
            academicQuality: "High",
            feedback: "Publisher-grade definition! Accurate ecological terms: 'trophic cascade', 'reciprocally alters', 'plant community structures'."
          },
          {
            text: "It is when big animals eat medium animals and small animals get happier.",
            academicQuality: "Needs Expansion",
            feedback: "Use scientific vocabulary: 'apex predators', 'herbivores', 'primary producers', and 'equilibrium'."
          }
        ]
      }
    ]
  },
  {
    id: "historical-perspectives",
    title: "Jamestown Artifacts: Analyzing Primary Evidence",
    grade: "6-8",
    topic: "Colonial Archaeology & Survival",
    speakers: {
      partner: "Sofia (Research Partner)",
      teacher: "Mr. Adams (History Teacher)"
    },
    turns: [
      {
        speaker: "Sofia",
        speech: "Look at the excavated pottery shards and copper trade beads from the 1607 fort layer. Does this evidence show that the English settlers were primarily preparing for farming or trading?",
        studentGoal: "Analyze the trade beads as evidence of diplomatic and economic exchange.",
        options: [
          {
            text: "The presence of copper beads indicates that colonists prioritized trading with the Powhatan Confederacy for essential corn rather than manufacturing agricultural tools immediately.",
            academicQuality: "High",
            feedback: "Outstanding historical reasoning! You evaluated the trade beads and linked them to food diplomacy."
          },
          {
            text: "They just brought shiny beads because they wanted jewelry to wear.",
            academicQuality: "Needs Expansion",
            feedback: "Consider the economic and diplomatic purpose of copper in Powhatan society."
          }
        ]
      },
      {
        speaker: "Sofia",
        speech: "That explains why Captain John Smith spent so much time negotiating along the river. But what does the lack of fishing hooks and agricultural hoes in that early layer tell us about their first winter?",
        studentGoal: "Draw an inference regarding their lack of preparation for self-sufficient food production.",
        options: [
          {
            text: "The absence of basic subsistence tools suggests that gentlemen settlers were unprepared for manual agrarian labor, contributing to the severe food shortages during the Starving Time.",
            academicQuality: "High",
            feedback: "Rich vocabulary ('subsistence tools', 'agrarian labor', 'Starving Time') and sound historical inference."
          },
          {
            text: "They lost their fishing equipment in the ocean on the way over.",
            academicQuality: "Needs Expansion",
            feedback: "Analyze their social background and expectations rather than accidental loss."
          }
        ]
      }
    ]
  }
];

// Scenario ids that the learner finished in this visit (shown as a summary, never stored as a result).
const finished = new Set();

const loadSaved = () => safeJson(storage.get(CONV_KEY), {}) || {};
const scenarioOf = (id) => SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
const LETTERS = "ABCDEFGH";
let I = makeI18n("en");
// Display names for the feedback quality labels in SCENARIOS (the data keeps the English value).
const QUALITY_ES = { High: "Alta", "Needs Expansion": "Necesita ampliarse", Developing: "En desarrollo" };
const quality = (q) => I.T(q, QUALITY_ES[q]);

/** The speaker's role comes from the scenario's own roster, e.g. "Mateo (Lab Partner)". */
function roleOf(scenario, speaker) {
  const entry = Object.entries(scenario.speakers).find(([, name]) => name.startsWith(speaker));
  const role = entry?.[1].match(/\(([^)]+)\)/)?.[1] || "";
  return { role, isTeacher: entry?.[0] === "teacher" };
}
const initial = (speaker) => speaker.replace(/^(Ms|Mr|Mrs|Dr)\.?\s+/i, "").charAt(0).toUpperCase();

function scenarioNav(scenario, band) {
  return html`<nav class="cv-scenarios" aria-label="${I.S("Choose a conversation scenario", "Elige una conversación")}">
    ${SCENARIOS.map(
      (s) =>
        html`<a class="cv-scn" href="${BASE}/conversation/${s.id}?grades=${band}" ${s.id === scenario.id ? raw('aria-current="page"') : ""}
          ><strong>${s.title}</strong><span>${s.topic}</span></a
        >`,
    )}
  </nav>`;
}

function turnTrack(scenario, turnIdx) {
  return html`<div class="cv-progress">
    <p class="cv-progress-label">${I.T(`Turn ${turnIdx + 1} of ${scenario.turns.length}`, `Turno ${turnIdx + 1} de ${scenario.turns.length}`)}</p>
    <ol class="cv-turns" aria-hidden="true">
      ${scenario.turns.map((_, i) => html`<li class="${i < turnIdx ? "is-done" : ""} ${i === turnIdx ? "is-here" : ""}"></li>`)}
    </ol>
  </div>`;
}

function optionHTML(opt, oIdx, chosen) {
  const picked = chosen === oIdx;
  const strong = opt.academicQuality === "High";
  return html`<div class="cv-opt">
    <label class="choice ${picked ? "is-on" : ""}">
      <input type="radio" name="conv-opt" value="${oIdx}" data-conv-select="${oIdx}" ${picked ? raw("checked") : ""} />
      <span class="choice-letter">${LETTERS[oIdx]}</span>
      <span>${opt.text}</span>
    </label>
    <button type="button" class="ghost small" data-say="${opt.text}">${icon("volume")} ${I.T("Rehearse aloud", "Ensayar en voz alta")}</button>
    ${
      picked
        ? html`<div class="feedback ${strong ? "is-right" : "is-hint"}" role="status">
            <p class="fb-title">${icon(strong ? "check" : "bulb")} ${quality(opt.academicQuality)}</p>
            <p>${opt.feedback}</p>
            <p class="fine">${I.T("Feedback on this sample response. It is practice language, not a score.", "Comentarios sobre esta respuesta de ejemplo. Es lenguaje de práctica, no un puntaje.")}</p>
          </div>`
        : ""
    }
  </div>`;
}

function summaryHTML(scenario, saved, band) {
  const others = SCENARIOS.filter((s) => s.id !== scenario.id);
  return html`<section class="cv-done panel" aria-labelledby="cvDoneTitle">
    <p class="eyebrow">${icon("check")} ${I.T("Discussion finished", "Conversación terminada")}</p>
    <h2 id="cvDoneTitle" tabindex="-1">${I.T(`You rehearsed ${scenario.turns.length} turns of this conversation`, `Ensayaste ${scenario.turns.length} turnos de esta conversación`)}</h2>
    <p class="lead">${I.T("Review the responses you rehearsed. Say your favourite one aloud to a partner, then try the scenario again with a different choice.", "Repasa las respuestas que ensayaste. Di en voz alta tu favorita a un compañero y luego prueba la situación otra vez con otra opción.")}</p>
    <ol class="cv-recap">
      ${scenario.turns.map((turn, i) => {
        const opt = turn.options[saved[scenario.id]?.choices?.[i]];
        return html`<li>
          <p class="cv-recap-q"><strong>${turn.speaker}:</strong> ${turn.speech}</p>
          ${opt ? html`<p class="cv-recap-a"><span class="lx-pill">${quality(opt.academicQuality)}</span> ${opt.text}</p>` : html`<p class="fine">${I.T("No response chosen for this turn.", "No elegiste ninguna respuesta en este turno.")}</p>`}
        </li>`;
      })}
    </ol>
    <div class="row-actions">
      <button type="button" class="btn btn-primary btn-domain" data-conv-restart>${icon("retry")} ${I.T("Start this conversation again", "Empezar esta conversación otra vez")}</button>
      ${others.map((o) => html`<a class="btn" href="${BASE}/conversation/${o.id}?grades=${band}">${I.T("Try:", "Prueba:")} ${o.title}</a>`)}
    </div>
  </section>`;
}

function turnHTML(scenario, turn, turnIdx, chosen) {
  const { role, isTeacher } = roleOf(scenario, turn.speaker);
  const key = `conv-${scenario.id}-${turnIdx}`;
  const last = turnIdx === scenario.turns.length - 1;
  return html`<div class="cv-dialogue">
      <div class="cv-msg ${isTeacher ? "is-teacher" : ""}">
        <span class="cv-avatar" aria-hidden="true">${initial(turn.speaker)}</span>
        <div class="cv-bubble">
          <p class="cv-who"><strong>${turn.speaker}</strong>${role ? html`<span>${role}</span>` : ""}</p>
          <p class="cv-speech">${turn.speech}</p>
          <button type="button" class="btn ghost small" data-say="${turn.speech}">${icon("volume")} ${I.T(`Hear ${turn.speaker} speak`, `Escuchar a ${turn.speaker}`)}</button>
        </div>
      </div>

      <section class="cv-reply panel" aria-labelledby="cvGoal">
        <p class="eyebrow">${I.T("Your speaking and argument goal", "Tu meta para hablar y argumentar")}</p>
        <h2 id="cvGoal">${turn.studentGoal}</h2>
        <p class="fine">${I.T("Choose a response to rehearse. Each one shows feedback after you pick it.", "Elige una respuesta para ensayar. Cada una muestra comentarios después de elegirla.")}</p>
        <div class="choices cv-options">${turn.options.map((opt, i) => optionHTML(opt, i, chosen))}</div>

        <div class="card cv-record">
          <h3>${icon("record")} ${I.T("Optional oral rehearsal", "Ensayo oral opcional")}</h3>
          <p class="fine">${I.T("Record yourself speaking your response aloud before moving to the next conversation turn.", "Grábate diciendo tu respuesta en voz alta antes de pasar al siguiente turno de la conversación.")}</p>
          ${recorderHTML(key, { recording: isRecording(key) })}
        </div>

        <div class="row-actions cv-nav">
          ${turnIdx > 0 ? html`<button type="button" class="btn" data-conv-prev>${icon("arrow-left")} ${I.T("Previous turn", "Turno anterior")}</button>` : ""}
          <button type="button" class="btn btn-primary btn-domain" data-conv-next>
            ${last ? html`${I.T("Finish discussion and review", "Terminar la conversación y repasar")} ${icon("check")}` : html`${I.T("Next dialogue turn", "Siguiente turno")} ${icon("arrow-right")}`}
          </button>
        </div>
      </section>
    </div>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  const scenario = scenarioOf(ctx.route.scenarioId || "ecosystem-debate");
  const saved = loadSaved();
  const turnIdx = Math.min(Math.max(0, saved[scenario.id]?.turn || 0), scenario.turns.length - 1);
  const turn = scenario.turns[turnIdx];
  const done = finished.has(scenario.id);

  return {
    title: I.S("Academic Conversation Simulator", "Simulador de conversación académica"),
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], [I.S("Conversation Simulator", "Simulador de conversación"), null]])}
      <div class="cv d-speaking">
        <section class="lx-hero">
          <div>
            <p class="eyebrow">${icon("conversation")} ${I.T("Dialogue rehearsal · WIDA Key Language Uses", "Ensayo de diálogo · Usos clave del lenguaje de WIDA")}</p>
            <h1 tabindex="-1">${scenario.title}</h1>
            <p class="lead">${I.T("Practice realistic academic discussions with peers and teachers. Rehearse claims, clarification, and argumentation.", "Practica conversaciones académicas realistas con compañeros y maestros. Ensaya afirmaciones, aclaraciones y argumentos.")}</p>
          </div>
          <div class="lx-hero-art"><img src="${ART}/domain-speaking.svg" alt="" width="480" height="360" /></div>
        </section>
        ${scenarioNav(scenario, ctx.band)}
        ${done ? summaryHTML(scenario, saved, ctx.band) : html`${turnTrack(scenario, turnIdx)}${turnHTML(scenario, turn, turnIdx, saved[scenario.id]?.choices?.[turnIdx])}`}
      </div>`,
  };
}

export function onConversationEvent(t, ctx) {
  const L = i18nFor(ctx);
  const sId = scenarioOf(ctx.route.scenarioId || "ecosystem-debate").id;
  const saved = loadSaved();
  saved[sId] = saved[sId] || { turn: 0, choices: {} };
  const save = () => storage.set(CONV_KEY, JSON.stringify(saved));

  const select = t.closest("[data-conv-select]");
  if (select) {
    saved[sId].choices[saved[sId].turn || 0] = Number(select.dataset.convSelect);
    save();
    announce(L.S("Response selected.", "Respuesta elegida."));
    return true;
  }

  if (t.closest("[data-conv-next]")) {
    const scenario = scenarioOf(sId);
    const cur = saved[sId].turn || 0;
    if (cur < scenario.turns.length - 1) {
      saved[sId].turn = cur + 1;
      save();
      announce(L.S(`Continuing to turn ${cur + 2}`, `Pasando al turno ${cur + 2}`));
    } else {
      finished.add(sId);
      announce(L.S("Discussion finished. Your recap is shown below.", "Conversación terminada. Tu repaso aparece abajo."));
    }
    window.scrollTo({ top: 0 });
    return true;
  }

  if (t.closest("[data-conv-prev]")) {
    const cur = saved[sId].turn || 0;
    if (cur > 0) {
      saved[sId].turn = cur - 1;
      save();
    }
    return true;
  }

  if (t.closest("[data-conv-restart]")) {
    saved[sId].turn = 0;
    save();
    finished.delete(sId);
    window.scrollTo({ top: 0 });
    return true;
  }

  return false;
}

export function unmount() {
  finished.clear();
}
