// Conversation Simulator: realistic multi-turn academic dialogue with peers and teachers.
// Promotes academic clarification, argumentation, evidence presentation, and oral rehearsal.
import { crumbsHTML, recorderHTML } from "../components.js";
import { speakDialogue, stop as stopSpeech } from "../speech.js";
import { isRecording } from "../recorder.js";
import { BASE, announce, html, raw, safeJson, storage } from "../util.js";

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
        avatar: "👦",
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
        avatar: "👦",
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
        avatar: "👩‍🏫",
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
        avatar: "👧",
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
        avatar: "👧",
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

export async function render(ctx) {
  const r = ctx.route;
  const scenarioId = r.scenarioId || "ecosystem-debate";
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];

  const saved = safeJson(storage.get(CONV_KEY), {}) || {};
  const currentTurnIdx = Math.min(Math.max(0, saved[scenario.id]?.turn || 0), scenario.turns.length - 1);
  const turn = scenario.turns[currentTurnIdx];
  const chosenOpt = saved[scenario.id]?.choices?.[currentTurnIdx];

  const breadcrumbs = [
    ["Lab", `${BASE}/?grades=${ctx.band}`],
    ["Conversation Simulator", null],
  ];

  return {
    title: "Academic Conversation Simulator",
    html: html`${crumbsHTML(breadcrumbs)}
      <section class="room-hero" style="--room:#2a6f97">
        <div>
          <span class="badge" style="background:#2a6f97; color:white">Dialogue Rehearsal · WIDA Key Language Uses</span>
          <h1 tabindex="-1">💬 ${scenario.title}</h1>
          <p class="lead">Practice realistic academic discussions with peers and teachers. Rehearse claims, clarification, and argumentation.</p>
        </div>
      </section>

      <div class="conversation-progress-bar">
        <span>Turn ${currentTurnIdx + 1} of ${scenario.turns.length}</span>
        <div class="progress-track"><div class="progress-fill" style="width:${((currentTurnIdx + 1) / scenario.turns.length) * 100}%"></div></div>
      </div>

      <div class="dialogue-container">
        <div class="dialogue-bubble partner-bubble">
          <span class="avatar" aria-hidden="true">${turn.avatar}</span>
          <div class="bubble-content">
            <strong>${turn.speaker}</strong>
            <p>${turn.speech}</p>
            <button type="button" class="btn ghost small" data-say="${turn.speech}">
              🔊 Hear ${turn.speaker} speak
            </button>
          </div>
        </div>

        <div class="dialogue-prompt-card panel">
          <span class="eyebrow">Your Speaking & Argument Goal</span>
          <h3>${turn.studentGoal}</h3>

          <div class="response-options">
            ${turn.options.map((opt, oIdx) => {
              const isSelected = chosenOpt === oIdx;
              return html`<div class="option-card ${isSelected ? "selected" : ""}">
                <label>
                  <input
                    type="radio"
                    name="conv-opt"
                    value="${oIdx}"
                    data-conv-select="${oIdx}"
                    ${isSelected ? raw("checked") : ""}
                  />
                  <span>${opt.text}</span>
                </label>
                <div class="row-actions">
                  <button type="button" class="btn ghost small" data-say="${opt.text}">
                    🔊 Rehearse aloud
                  </button>
                </div>
                ${isSelected ? html`<div class="opt-feedback ${opt.academicQuality === "High" ? "pass" : "warn"}"><strong>${opt.academicQuality}:</strong> ${opt.feedback}</div>` : ""}
              </div>`;
            })}
          </div>

          <div class="card oral-rehearsal-box">
            <h4>🎙️ Optional Oral Rehearsal</h4>
            <p class="fine">Record yourself speaking your response aloud before moving to the next conversation turn.</p>
            ${recorderHTML(`conv-${scenario.id}-${currentTurnIdx}`, { recording: isRecording(`conv-${scenario.id}-${currentTurnIdx}`) })}
          </div>

          <div class="row-actions">
            ${currentTurnIdx > 0 ? html`<button type="button" class="btn" data-conv-prev>← Previous Turn</button>` : ""}
            <button type="button" class="btn btn-primary" data-conv-next>
              ${currentTurnIdx === scenario.turns.length - 1 ? "Complete Discussion & Review ⭐" : "Next Dialogue Turn →"}
            </button>
          </div>
        </div>
      </div>`,
  };
}

export function onConversationEvent(t, ctx) {
  const select = t.closest("[data-conv-select]");
  if (select) {
    const oIdx = Number(select.dataset.convSelect);
    const saved = safeJson(storage.get(CONV_KEY), {}) || {};
    const r = ctx.route;
    const sId = r.scenarioId || "ecosystem-debate";
    saved[sId] = saved[sId] || { turn: 0, choices: {} };
    saved[sId].choices[saved[sId].turn || 0] = oIdx;
    storage.set(CONV_KEY, JSON.stringify(saved));
    announce("Response selected.");
    return true;
  }

  const nextBtn = t.closest("[data-conv-next]");
  if (nextBtn) {
    const saved = safeJson(storage.get(CONV_KEY), {}) || {};
    const r = ctx.route;
    const sId = r.scenarioId || "ecosystem-debate";
    const scenario = SCENARIOS.find((s) => s.id === sId) || SCENARIOS[0];
    saved[sId] = saved[sId] || { turn: 0, choices: {} };
    const curT = saved[sId].turn || 0;
    if (curT < scenario.turns.length - 1) {
      saved[sId].turn = curT + 1;
      storage.set(CONV_KEY, JSON.stringify(saved));
      announce(`Continuing to turn ${curT + 2}`);
    } else {
      alert("🎉 Academic Discussion Completed! You demonstrated evidence-based argumentation and collaborative discourse.");
    }
    return true;
  }

  const prevBtn = t.closest("[data-conv-prev]");
  if (prevBtn) {
    const saved = safeJson(storage.get(CONV_KEY), {}) || {};
    const r = ctx.route;
    const sId = r.scenarioId || "ecosystem-debate";
    saved[sId] = saved[sId] || { turn: 0, choices: {} };
    const curT = saved[sId].turn || 0;
    if (curT > 0) {
      saved[sId].turn = curT - 1;
      storage.set(CONV_KEY, JSON.stringify(saved));
    }
    return true;
  }

  return false;
}
