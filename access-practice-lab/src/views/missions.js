// Academic Mission Engine: story-driven, cross-domain interactive missions.
// Integrates Listening -> Reading -> Speaking -> Writing around a shared authentic challenge.
import { crumbsHTML, listenPlayerHTML, recorderHTML } from "../components.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { isRecording, takesFor } from "../recorder.js";
import { analyzeLanguage } from "../coach.js";
import { getPrefs, setPrefs } from "../store.js";
import { BASE, announce, html, raw, safeJson, storage } from "../util.js";

const MISSIONS_KEY = "accessPracticeLab:v1:missions";

export function loadMissionData() {
  return safeJson(storage.get(MISSIONS_KEY), {}) || {};
}

export function saveMissionData(data) {
  storage.set(MISSIONS_KEY, JSON.stringify(data));
}

export const MISSIONS = [
  {
    id: "watershed-mystery",
    title: "The Urban Watershed Mystery",
    subtitle: "Environmental Science Investigation",
    band: "Both",
    role: "Junior Hydrologist",
    icon: "💧",
    theme: "#1f766f",
    summary: "Fish populations in Riverdale Creek dropped sharply after spring storms. Investigate the runoff sources, analyze water chemistry data, speak to the City Council, and write an evidence-based remediation plan.",
    keyUses: ["Explain", "Argue"],
    phases: [
      {
        num: 1,
        skill: "Listening",
        title: "Field Briefing: Chief Engineer Dr. Vance",
        instructions: "Listen to the dispatch from Dr. Vance. Take notes on the three locations tested along the river.",
        audioText: "This is Dr. Vance with the Riverdale Water Authority. Yesterday's storm caused severe runoff. At Station 1 near the forest, dissolved oxygen levels remained healthy at 8 parts per million. However, downstream at Station 2 near the industrial park, oxygen plunged to 2 parts per million. At Station 3 near the community park, sediment was unusually heavy. We need your team to determine whether fertilizer runoff, industrial waste, or soil erosion is the primary factor.",
        notesPrompt: "What were the oxygen levels at Station 1 versus Station 2?",
        checkQuestion: {
          q: "Why was Station 2 considered the most critical concern?",
          options: [
            "It had the clearest water in the creek.",
            "Dissolved oxygen plunged to an unsafe level of 2 parts per million.",
            "Water temperature dropped below freezing."
          ],
          answer: 1
        }
      },
      {
        num: 2,
        skill: "Reading",
        title: "Dossier: Water Quality & Topography Report",
        instructions: "Read the water test log and watershed elevation data to identify the pollution source.",
        passageTitle: "Riverdale Watershed Soil and Runoff Report",
        passage: [
          "Urban runoff occurs when precipitation flows over impervious surfaces such as asphalt, roofs, and compacted soil instead of soaking into the ground. As runoff accelerates, it transports contaminants directly into municipal waterways without natural filtration.",
          "According to the Environmental Protection Agency (EPA), dissolved oxygen levels below 4 parts per million are hazardous to aquatic life. Elevated nitrates from lawn fertilizers cause algae blooms. When algae decompose, bacteria consume excessive oxygen, creating hypoxic dead zones.",
          "Chemical analysis of Station 2 revealed high nitrate concentrations alongside synthetic surfactant residues. This indicates that runoff originated from both commercial vehicle wash facilities and adjacent suburban lawns."
        ],
        checkQuestion: {
          q: "What process causes bacteria to consume excessive oxygen in the water?",
          options: [
            "Rain freezing into ice crystals.",
            "The decomposition of algae fueled by high nitrate runoff.",
            "Fish swimming too quickly through rapids."
          ],
          answer: 1
        }
      },
      {
        num: 3,
        skill: "Speaking",
        title: "Oral Briefing: City Council Emergency Session",
        instructions: "Record your 45-60 second verbal briefing to the Riverdale City Council. State your claim, cite water data from Station 1 and 2, and explain the cause.",
        starterStems: [
          "Members of the council, our investigation demonstrates that...",
          "According to the water quality data, oxygen levels at Station 2 dropped to...",
          "This occurred because fertilizer and commercial runoff caused..."
        ],
        modelAudio: "Members of the city council, our scientific investigation reveals that the sudden fish mortality in Riverdale Creek was caused by hypoxic runoff. While Station 1 registered 8 parts per million of dissolved oxygen, Station 2 dropped to 2 parts per million due to nitrate runoff from upstream lawns. I recommend constructing bioswales immediately to filter storm runoff before it reaches the creek."
      },
      {
        num: 4,
        skill: "Writing",
        title: "Remediation Action Plan & Recommendation",
        instructions: "Draft a formal recommendation (minimum 3 sentences). State your claim, explain the biological cause with evidence, and propose an urban design solution (e.g., bioswales, retention ponds, or permeable pavers).",
        wordBank: ["dissolved oxygen", "runoff", "impervious", "decomposition", "consequently", "bioswales", "remediation"],
        placeholder: "To restore Riverdale Creek, the city must construct vegetative bioswales because..."
      }
    ]
  },
  {
    id: "newsroom-debate",
    title: "School Newsroom: The Cafeteria Debate",
    subtitle: "Civic Journalism & Policy Analysis",
    band: "Both",
    role: "Investigative Reporter",
    icon: "📰",
    theme: "#8e4b10",
    summary: "Our middle school generates 120 pounds of uneaten food waste daily, while students petition for fresher lunch choices. Interview the head chef, analyze cost logs, record a radio broadcast, and publish a balanced editorial.",
    keyUses: ["Argue", "Inform"],
    phases: [
      {
        num: 1,
        skill: "Listening",
        title: "Audio Interview: Chef Martinez & Student President Mia",
        instructions: "Listen to the contrasting viewpoints regarding school meal ingredients and budget constraints.",
        audioText: "Chef Martinez explains: 'We want to serve locally sourced organic produce, but our federal reimbursement is only four dollars per tray. When we served fresh kale salad last Tuesday, seventy percent ended up in the compost bins.' Mia counters: 'Students want fresh food, but they need agency in menu planning. When students helped design the stir-fry bowl bar, participation rose forty percent and food waste dropped to under five pounds.'",
        notesPrompt: "What happened when students had a choice in building their own stir-fry bowls?",
        checkQuestion: {
          q: "What is Chef Martinez's primary budget challenge?",
          options: [
            "The school has no kitchen stoves.",
            "Federal meal reimbursement is limited to about four dollars per tray.",
            "Local farms refuse to deliver vegetables."
          ],
          answer: 1
        }
      },
      {
        num: 2,
        skill: "Reading",
        title: "Policy Memo: District Nutritional Standards vs. Waste Data",
        instructions: "Read the district dietary report and compost audit figures.",
        passageTitle: "Lincoln Middle School Cafeteria Waste Audit",
        passage: [
          "The National School Lunch Program mandates specific vegetable sub-categories weekly, including dark green, red/orange, and legume varieties. While nutritionally sound, pre-packaged vegetable portions suffer high rejection rates when served without culinary customization.",
          "According to the Lincoln Green Team audit, pre-plated broccoli accounted for 42 pounds of daily waste, whereas self-serve salad stations experienced only 8 pounds of waste. Self-service models allow students to select portion sizes matching their appetites.",
          "Economically, transitioning to a batch-cooked build-your-own model reduces disposal hauling fees by eighteen percent, offsetting the slightly higher initial cost of fresh local ingredients."
        ],
        checkQuestion: {
          q: "What evidence shows that self-service options reduce waste?",
          options: [
            "Students ate lunch thirty minutes earlier.",
            "Self-serve salad stations generated only 8 pounds of waste compared to 42 pounds for pre-plated broccoli.",
            "The cafeteria closed the kitchen on Fridays."
          ],
          answer: 1
        }
      },
      {
        num: 3,
        skill: "Speaking",
        title: "Live News Broadcast: The Midday Report",
        instructions: "Record your 45-second news segment summarizing both Chef Martinez's budget reality and Mia's customizable lunch solution.",
        starterStems: [
          "Good afternoon Lincoln Middle School. Today in investigative news...",
          "While nutritional guidelines require healthy vegetables, our audit discovered that...",
          "Student leaders argue that customizable options like salad bars can..."
        ],
        modelAudio: "Good afternoon, this is Lincoln News. Today we investigate our school's 120-pound food waste dilemma. While Chef Martinez faces strict four-dollar budget caps, student president Mia proved that customized food bars decrease waste dramatically. Our audit revealed that self-serve bars generated only 8 pounds of waste compared to 42 pounds for pre-packaged trays. Implementing student-designed menus can satisfy nutritional standards while conserving district funds."
      },
      {
        num: 4,
        skill: "Writing",
        title: "Editorial Opinion: Solution for the School Board",
        instructions: "Write a 3-5 sentence editorial argument proposing a sustainable cafeteria policy. Address both nutrition guidelines and budget efficiency.",
        wordBank: ["nutritional", "reimbursement", "customization", "waste audit", "furthermore", "consequently", "sustainable"],
        placeholder: "The school board should transition from pre-plated meals to customizable food stations because..."
      }
    ]
  },
  {
    id: "space-colony",
    title: "Space Colony Ecosystem Architect",
    subtitle: "Bio-Regenerative Life Support Mission",
    band: "Both",
    role: "Astro-Biologist",
    icon: "🚀",
    theme: "#3b28cc",
    summary: "On Lunar Habitat Base Artemis, carbon dioxide levels are rising unexpectedly in Biodome 3. Listen to telemetry dispatches, analyze plant transpiration rates, brief the crew, and write engineering remediation orders.",
    keyUses: ["Explain", "Inform"],
    phases: [
      {
        num: 1,
        skill: "Listening",
        title: "Audio Comms: Base Commander Chen",
        instructions: "Listen to the emergency dispatch from Commander Chen regarding atmospheric telemetry.",
        audioText: "Artemis Habitat Control to Science Officer. At oh-six-hundred, sensor array B reported carbon dioxide concentrations climbing past one thousand parts per million in Biodome 3. The hydroponic wheat crops appear healthy, but oxygen production dropped twenty-three percent overnight. LED lighting spectra remain nominal. We suspect either an LED photosynthetic wavelength shift or a root rhizosphere bacterial overgrowth consuming oxygen.",
        notesPrompt: "What happened to oxygen production overnight in Biodome 3?",
        checkQuestion: {
          q: "What anomalous reading triggered the emergency alert?",
          options: [
            "Water tanks froze solid.",
            "Carbon dioxide climbed above 1000 ppm and oxygen output dropped 23 percent.",
            "The hydroponic lighting system turned off completely."
          ],
          answer: 1
        }
      },
      {
        num: 2,
        skill: "Reading",
        title: "Technical Spec: Photosynthesis & Transpiration Logs",
        instructions: "Read the bio-regenerative system logs to discover why plant gas exchange stalled.",
        passageTitle: "Artemis Hydroponic Chamber 3 Diagnostics",
        passage: [
          "In closed-loop bio-regenerative life support systems (CELSS), crops such as dwarf wheat and spirulina algae recycle carbon dioxide into breathable oxygen via photosynthesis: 6CO2 + 6H2O + light energy yields C6H12O6 + 6O2.",
          "Plant gas exchange is regulated by microscopic pores called stomata. Stomatal aperture depends on relative humidity and air circulation velocity. When chamber dehumidifiers fail, ambient humidity exceeds 92 percent, causing stomata to close to prevent cellular edema.",
          "Chamber diagnostics reveal that moisture condensation clogged air circulation duct 4B. As a result, stagnant humid air accumulated around the wheat canopy, halting transpiration and preventing the stomata from absorbing ambient carbon dioxide."
        ],
        checkQuestion: {
          q: "Why did the wheat plants close their stomata and stop absorbing carbon dioxide?",
          options: [
            "The ambient temperature fell below zero degrees.",
            "Excessive humidity and stagnant air accumulated due to a blocked circulation duct.",
            "Astronauts harvested the wheat too early."
          ],
          answer: 1
        }
      },
      {
        num: 3,
        skill: "Speaking",
        title: "Crew Transmission: Technical Explanation",
        instructions: "Record your 45-second technical briefing to Commander Chen explaining the relationship between duct 4B, humidity, and stomatal closure.",
        starterStems: [
          "Commander Chen, the diagnostic analysis of Biodome 3 indicates that...",
          "Photosynthesis halted not because of lighting, but because...",
          "When relative humidity exceeded 92 percent, the plant stomata closed, resulting in..."
        ],
        modelAudio: "Commander Chen, our diagnostic findings show that Biodome 3 is experiencing stomatal closure caused by excessive humidity. A condensation blockage in air circulation duct 4B caused humidity to rise past 92 percent. Consequently, the wheat plants closed their stomatal pores to prevent edema, preventing carbon dioxide absorption and halting oxygen generation. Clearing duct 4B will restore gas exchange immediately."
      },
      {
        num: 4,
        skill: "Writing",
        title: "Engineering Remediation Directive",
        instructions: "Write a 3-5 sentence official engineering directive explaining the root cause and ordering specific maintenance actions.",
        wordBank: ["photosynthesis", "transpiration", "stomata", "humidity", "consequently", "circulation", "equilibrium"],
        placeholder: "To restore life support equilibrium in Biodome 3, engineering personnel must..."
      }
    ]
  }
];

export async function render(ctx) {
  const r = ctx.route;
  const missionId = r.id || r.missionId || "watershed-mystery";
  const mission = MISSIONS.find((m) => m.id === missionId) || MISSIONS[0];
  const progress = loadMissionData();
  const mState = progress[mission.id] || { phase: 1, notes: {}, answers: {}, writing: {} };
  const currentPhaseIndex = Math.min(Math.max(1, mState.phase || 1), 4) - 1;
  const phase = mission.phases[currentPhaseIndex];

  const breadcrumbs = [
    ["Lab", `${BASE}/?grades=${ctx.band}`],
    ["Academic Missions", `${BASE}/missions?grades=${ctx.band}`],
    [mission.title, null],
  ];

  return {
    title: mission.title,
    html: html`${crumbsHTML(breadcrumbs)}
      <section class="room-hero mission-hero" style="--room:${mission.theme}">
        <div>
          <span class="badge" style="background:${mission.theme}; color:white">${mission.role}</span>
          <h1 tabindex="-1">${mission.icon} ${mission.title}</h1>
          <p class="lead">${mission.summary}</p>
        </div>
      </section>

      <div class="mission-nav" role="tablist" aria-label="Mission Phases">
        ${mission.phases.map((p, idx) => {
          const isDone = (mState.phase || 1) > p.num;
          const isCur = (mState.phase || 1) === p.num;
          return html`<button
            type="button"
            class="mission-step-btn ${isCur ? "is-active" : ""} ${isDone ? "is-done" : ""}"
            data-mission-goto="${p.num}"
            aria-selected="${isCur}"
          >
            <span class="step-num">${isDone ? "✓" : p.num}</span>
            <span class="step-label">${p.skill}: ${p.title.split(":")[0]}</span>
          </button>`;
        })}
      </div>

      <article class="panel mission-body">
        <header class="mission-phase-head">
          <span class="eyebrow">Phase ${phase.num} of 4 · ${phase.skill} Domain</span>
          <h2>${phase.title}</h2>
          <p class="instructions">${phase.instructions}</p>
        </header>

        ${
          phase.skill === "Listening"
            ? html`<div class="mission-listening">
                ${listenPlayerHTML(`mission-${mission.id}-1`, [phase.audioText], { rate: ctx.prefs.rate })}
                <div class="mission-check-box">
                  <h3>Check your comprehension</h3>
                  <p><strong>${phase.checkQuestion.q}</strong></p>
                  <div class="choice-group">
                    ${phase.checkQuestion.options.map((opt, oIdx) => {
                      const chosen = mState.answers?.[phase.num] === oIdx;
                      return html`<label class="choice-option ${chosen ? "selected" : ""}">
                        <input
                          type="radio"
                          name="mission-q1"
                          value="${oIdx}"
                          data-mission-ans="${oIdx}"
                          ${chosen ? raw("checked") : ""}
                        />
                        <span>${opt}</span>
                      </label>`;
                    })}
                  </div>
                </div>
              </div>`
            : ""
        }

        ${
          phase.skill === "Reading"
            ? html`<div class="mission-reading">
                <article class="passage">
                  <h3>${phase.passageTitle}</h3>
                  ${phase.passage.map((p) => html`<p>${p}</p>`)}
                </article>
                <div class="mission-check-box">
                  <h3>Evidence Check</h3>
                  <p><strong>${phase.checkQuestion.q}</strong></p>
                  <div class="choice-group">
                    ${phase.checkQuestion.options.map((opt, oIdx) => {
                      const chosen = mState.answers?.[phase.num] === oIdx;
                      return html`<label class="choice-option ${chosen ? "selected" : ""}">
                        <input
                          type="radio"
                          name="mission-q2"
                          value="${oIdx}"
                          data-mission-ans="${oIdx}"
                          ${chosen ? raw("checked") : ""}
                        />
                        <span>${opt}</span>
                      </label>`;
                    })}
                  </div>
                </div>
              </div>`
            : ""
        }

        ${
          phase.skill === "Speaking"
            ? html`<div class="mission-speaking">
                <div class="card">
                  <h3>Sentence Stems for Your Briefing</h3>
                  <ul>${phase.starterStems.map((s) => html`<li><em>${s}</em></li>`)}</ul>
                  <div class="row-actions">
                    <button type="button" class="btn ghost small" data-say="${phase.modelAudio}">
                      🔊 Listen to Model Briefing
                    </button>
                  </div>
                </div>
                ${recorderHTML(`mission-${mission.id}-spk`, { recording: isRecording(`mission-${mission.id}-spk`) })}
              </div>`
            : ""
        }

        ${
          phase.skill === "Writing"
            ? html`<div class="mission-writing">
                <div class="word-bank-box">
                  <strong>Academic Word Bank:</strong>
                  <div class="chips">
                    ${phase.wordBank.map((w) => html`<span class="chip">${w}</span>`)}
                  </div>
                </div>
                <label for="mission-write-input" class="label-heading">Your Official Action Report</label>
                <textarea
                  id="mission-write-input"
                  class="writing-textarea"
                  rows="6"
                  placeholder="${phase.placeholder}"
                  data-mission-write
                >${mState.writing?.[mission.id] || ""}</textarea>
                <div id="mission-coach-feedback" class="coach-feedback-box" role="status"></div>
                <div class="row-actions">
                  <button type="button" class="btn btn-secondary" data-mission-check-writing>
                    🤖 Check with AI Language Coach
                  </button>
                </div>
              </div>`
            : ""
        }

        <footer class="mission-actions">
          ${phase.num > 1 ? html`<button type="button" class="btn" data-mission-prev>← Previous Phase</button>` : ""}
          <button type="button" class="btn btn-primary" data-mission-next>
            ${phase.num === 4 ? "Complete Mission & Earn Badge ⭐" : "Continue to Next Phase →"}
          </button>
        </footer>
      </article>`,
  };
}

export function onMissionEvent(t, ctx) {
  const missionGoto = t.closest("[data-mission-goto]");
  if (missionGoto) {
    const target = Number(missionGoto.dataset.missionGoto);
    const mData = loadMissionData();
    const r = ctx.route;
    const mId = r.id || r.missionId || "watershed-mystery";
    mData[mId] = mData[mId] || { phase: 1, answers: {}, writing: {} };
    mData[mId].phase = target;
    saveMissionData(mData);
    return true;
  }

  const ans = t.closest("[data-mission-ans]");
  if (ans) {
    const val = Number(ans.dataset.missionAns);
    const mData = loadMissionData();
    const r = ctx.route;
    const mId = r.id || r.missionId || "watershed-mystery";
    mData[mId] = mData[mId] || { phase: 1, answers: {}, writing: {} };
    mData[mId].answers[mData[mId].phase || 1] = val;
    saveMissionData(mData);
    announce("Answer recorded.");
    return true;
  }

  const coachBtn = t.closest("[data-mission-check-writing]");
  if (coachBtn) {
    const input = document.getElementById("mission-write-input");
    const val = input ? input.value : "";
    const mData = loadMissionData();
    const r = ctx.route;
    const mId = r.id || r.missionId || "watershed-mystery";
    const mission = MISSIONS.find((m) => m.id === mId) || MISSIONS[0];
    const phase = mission.phases[3];

    const analysis = analyzeLanguage(val, {
      wordBank: phase.wordBank,
      keyUse: mission.keyUses[0]
    });

    const box = document.getElementById("mission-coach-feedback");
    if (box) {
      box.innerHTML = `
        <div class="coach-card">
          <h4>AI Language Coach Analysis</h4>
          <p><strong>Complexity:</strong> ${analysis.complexityRating} (${analysis.words} words, ${analysis.sentenceCount} sentences)</p>
          ${analysis.strengths.length ? `<div class="coach-strengths"><strong>Strengths:</strong><ul>${analysis.strengths.map(s => `<li>${s}</li>`).join("")}</ul></div>` : ""}
          ${analysis.recommendations.length ? `<div class="coach-recs"><strong>Next Step to Expand:</strong><ul>${analysis.recommendations.map(r => `<li><strong>${r.title}:</strong> ${r.prompt} <br><em>Frame: ${r.frame}</em></li>`).join("")}</ul></div>` : ""}
        </div>
      `;
    }
    announce("AI Language Coach evaluation complete.");
    return true;
  }

  const nextBtn = t.closest("[data-mission-next]");
  if (nextBtn) {
    const mData = loadMissionData();
    const r = ctx.route;
    const mId = r.id || r.missionId || "watershed-mystery";
    mData[mId] = mData[mId] || { phase: 1, answers: {}, writing: {} };
    const curP = mData[mId].phase || 1;
    if (curP < 4) {
      mData[mId].phase = curP + 1;
      saveMissionData(mData);
      announce(`Advancing to phase ${curP + 1}`);
    } else {
      mData[mId].completed = true;
      saveMissionData(mData);
      alert("🎉 Mission Accomplished! You completed all four academic language phases and earned the Field Specialist Badge!");
    }
    return true;
  }

  const prevBtn = t.closest("[data-mission-prev]");
  if (prevBtn) {
    const mData = loadMissionData();
    const r = ctx.route;
    const mId = r.id || r.missionId || "watershed-mystery";
    mData[mId] = mData[mId] || { phase: 1, answers: {}, writing: {} };
    const curP = mData[mId].phase || 1;
    if (curP > 1) {
      mData[mId].phase = curP - 1;
      saveMissionData(mData);
    }
    return true;
  }

  return false;
}
