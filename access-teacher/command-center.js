// Teacher Command Center (access-teacher/command-center.js)
// Organizes the Teacher Hub around the six core teaching workflows:
//   1. Plan a Lesson       (5-stage guided pathway composer: Introduce -> Explore -> Practice -> Apply -> Review)
//   2. Support a Student   (WIDA-sensitive scaffold differentiation workspace)
//   3. Assign Practice     (Unified student & Family Companion sharing workflow)
//   4. Analyze Progress    (Observed evidence summary + WIDA Data Studio & Review Queue launcher)
//   5. My Resources        (Real saved pathways, Book Studio projects, custom experiences, recent resources)
//   6. Create Something    (Intention-driven launcher for Book Studio, Experience Builder, Whole-Class, Lesson Builder)
// Reuses existing content, registries, and assignment infrastructure without duplicating engines.

import { loadIndex } from "/access-practice-lab/src/content.js";
import {
  LESSON_STAGES,
  SCAFFOLD_CATALOG,
  SUPPORT_TIERS,
  buildResourceRegistry,
  composeLessonPathway,
  discoverResources,
  recommendDifferentiation,
  whatNextRecommendations,
} from "/access-practice-lab/src/resource-intelligence.js";
import { DESTINATIONS } from "/access-practice-lab/src/sitemap.js";
import { allRecords } from "/access-practice-lab/src/store.js";
import { loadLedger } from "/access-practice-lab/src/lang/ledger.js";
import {
  BASE,
  announce,
  copyText,
  html,
  icon,
  raw,
  safeJson,
  storage,
  toHtml,
} from "/access-practice-lab/src/util.js";
import {
  HUB_TOUR_STEPS,
  assembleStarterKit,
  loadHubTourState,
  renderHubTourHTML,
  saveHubTourState,
} from "/access-teacher/hub-tour.js";

export const SAVED_PATHWAYS_KEY = "accessTeacher:v1:savedPathways";

export const COMMAND_ACTIONS = Object.freeze([
  {
    id: "plan",
    icon: "road",
    title: "Plan a Lesson",
    lead: "Build a short lesson from ready activities.",
  },
  {
    id: "support",
    icon: "writing",
    title: "Support a Student",
    lead: "Add help for one student. The goal stays the same.",
  },
  {
    id: "assign",
    icon: "launch",
    title: "Assign Practice",
    lead: "Get a link for students or families.",
  },
  {
    id: "analyze",
    icon: "growth",
    title: "Analyze Progress",
    lead: "See what students did and what to teach next.",
  },
  {
    id: "resources",
    icon: "bookmark",
    title: "My Resources",
    lead: "Open what you saved.",
  },
  {
    id: "create",
    icon: "sparkle",
    title: "Create Something",
    lead: "Make a book or an activity from your own text.",
  },
]);

export function readSavedPathways() {
  const list = safeJson(storage.get(SAVED_PATHWAYS_KEY), []);
  return Array.isArray(list) ? list.filter((p) => p && typeof p.id === "string") : [];
}

export function savePathwayRecord(pathway, title = "") {
  const list = readSavedPathways();
  const id = `pw-${Date.now().toString(36)}`;
  const entry = {
    id,
    title: title.trim() || `${pathway.domain} Pathway · Grades ${pathway.band}`,
    band: pathway.band,
    domain: pathway.domain,
    support: pathway.support,
    minutes: pathway.totalMinutes,
    playlistUrl: pathway.playlistUrl,
    stages: pathway.stages.map((s) => ({
      stageId: s.stageId,
      stageName: s.stageName[0],
      resourceId: s.resource?.id || "",
      resourceTitle: s.resource?.title || "",
      url: s.resource ? s.resource.urlFor(pathway.band) : "",
      minutes: s.minutes,
    })),
    savedAt: new Date().toISOString(),
  };
  const next = [entry, ...list.filter((x) => x.title !== entry.title)].slice(0, 20);
  const ok = storage.set(SAVED_PATHWAYS_KEY, JSON.stringify(next));
  return { ok, entry, list: next };
}

export function deleteSavedPathway(id) {
  const next = readSavedPathways().filter((p) => p.id !== id);
  storage.set(SAVED_PATHWAYS_KEY, JSON.stringify(next));
  return next;
}

export async function mountCommandCenter(host) {
  if (!host) return;
  const index = await loadIndex().catch(() => null);
  const registry = buildResourceRegistry({ index, destinations: DESTINATIONS });

  const state = {
    // No task is open on arrival (2026-11-17): the teacher sees six choices, not a lesson builder.
    activeTab: "",
    // Plan a Lesson state
    planBand: "6-8",
    planDomain: "Speaking",
    planSkill: "",
    planSupport: "B",
    planMinutes: 30,
    planNeeds: ["sentence-frames", "audio-directions"],
    planTitle: "",
    pathway: null,
    statusNote: "",
    // Support a Student state
    supBand: "6-8",
    supDomain: "Writing",
    supSupport: "A",
    supSkill: "",
    supNeeds: ["visual-vocabulary", "sentence-frames", "bilingual-glossary"],
    // Assign Practice state
    assignBand: "6-8",
    assignDomain: "Reading",
    assignSupport: "B",
    assignResourceId: "",
    assignNote: "",
  };

  function rebuildPathway() {
    state.pathway = composeLessonPathway(registry, {
      band: state.planBand,
      domain: state.planDomain,
      skill: state.planSkill,
      support: state.planSupport,
      minutes: state.planMinutes,
      needs: state.planNeeds,
    });
  }
  rebuildPathway();

  function refreshPlaylistUrl() {
    if (!state.pathway) return;
    const ids = state.pathway.stages.map((s) => s.resource?.activityId).filter(Boolean);
    const title = state.planTitle.trim() || `${state.planDomain} Lesson Pathway`;
    state.pathway.totalMinutes = state.pathway.stages.reduce((n, s) => n + (s.minutes || 5), 0);
    state.pathway.playlistUrl = ids.length
      ? `${BASE}/play?ids=${ids.join(",")}&t=${encodeURIComponent(title)}&grades=${state.planBand}`
      : `${BASE}/pathways?grades=${state.planBand}`;
  }

  function renderPlanTab() {
    const pw = state.pathway;
    const nextSteps = whatNextRecommendations({
      role: "teacher",
      band: state.planBand,
      domain: state.planDomain,
      trigger: "pathway-created",
    });
    return html`<div class="tc-workspace" id="tcPlan" role="region" aria-labelledby="tc-tab-plan">
      <div class="tc-ws-head">
        <div>
          <h3>Plan a Lesson · Guided Pathway Composer</h3>
          <p class="fine">
            Select your grade band, language domain, and support approach. We assemble a 5-stage
            sequence (Introduce → Explore → Practice → Apply → Review) from verified activities and
            studios that you can reorder, swap, preview, or share.
          </p>
        </div>
        <a class="btn small" href="${BASE}/pathways/build?grades=${state.planBand}">
          ${icon("road")} Open Connected Pathway Builder
        </a>
      </div>

      <div class="tc-controls">
        <label class="field">
          <span>Grade band</span>
          <select data-tc-plan="planBand">
            ${["K", "1", "2-3", "3-5", "6-8"].map(
              (b) => html`<option value="${b}" ${state.planBand === b ? raw("selected") : ""}>Grades ${b}</option>`,
            )}
          </select>
        </label>
        <label class="field">
          <span>Language domain</span>
          <select data-tc-plan="planDomain">
            ${["Listening", "Speaking", "Reading", "Writing"].map(
              (d) => html`<option value="${d}" ${state.planDomain === d ? raw("selected") : ""}>${d}</option>`,
            )}
          </select>
        </label>
        <label class="field">
          <span>WIDA support approach</span>
          <select data-tc-plan="planSupport">
            <option value="A" ${state.planSupport === "A" ? raw("selected") : ""}>Starting support (Tier A)</option>
            <option value="B" ${state.planSupport === "B" ? raw("selected") : ""}>Growing support (Tier B)</option>
            <option value="C" ${state.planSupport === "C" ? raw("selected") : ""}>Expanding support (Tier C)</option>
          </select>
        </label>
        <label class="field">
          <span>Target time</span>
          <select data-tc-plan="planMinutes">
            ${[15, 30, 45].map(
              (m) => html`<option value="${m}" ${state.planMinutes === m ? raw("selected") : ""}>~${m} minutes</option>`,
            )}
          </select>
        </label>
        <label class="field tc-field-wide">
          <span>Instructional focus or topic (optional)</span>
          <input
            type="search"
            data-tc-plan-input="planSkill"
            value="${state.planSkill}"
            placeholder="e.g. evidence, compare, retell, sequence…"
          />
        </label>
      </div>

      <div class="tc-stages-head">
        <h4>Recommended 5-Stage Sequence (${pw.stages.length} stages · ~${pw.totalMinutes} min total)</h4>
        <button type="button" class="btn small" data-tc-act="reset-pathway">Reset sequence</button>
      </div>

      <ol class="tc-stage-list">
        ${pw.stages.map(
          (st, idx) => html`<li class="tc-stage-card" data-stage-idx="${idx}">
            <div class="tc-stage-top">
              <span class="tc-stage-badge">${idx + 1}. ${st.stageName[0]}</span>
              <strong class="tc-stage-title">
                <a href="${st.resource ? st.resource.urlFor(state.planBand) : "#"}" target="_blank" rel="noopener">
                  ${st.resource?.title || "Activity"}
                </a>
              </strong>
              <span class="tc-stage-time">~${st.minutes} min</span>
            </div>
            <p class="fine"><strong>Why selected:</strong> ${st.whySelected[0]}</p>
            <p class="fine"><strong>What students do:</strong> ${st.whatStudentsDo[0]}</p>
            <p class="fine"><strong>Instructional purpose:</strong> ${st.purpose[0]}</p>
            <p class="fine"><strong>Teacher guidance:</strong> ${st.teacherGuidance[0]}</p>
            <p class="fine">
              <strong>Proficiency scaffolds:</strong> ${st.scaffolds.slice(0, 4).join(", ")}
            </p>
            <div class="tc-stage-actions">
              <a class="btn small" href="${st.resource ? st.resource.urlFor(state.planBand) : "#"}" target="_blank" rel="noopener">
                Preview stage ${icon("external")}
              </a>
              ${
                st.alternatives.length
                  ? html`<label class="tc-swap-label">
                      <span class="visually-hidden">Replace stage ${st.stageName[0]}</span>
                      <select data-tc-swap="${idx}" aria-label="Replace ${st.stageName[0]} activity">
                        <option value="">Replace activity…</option>
                        ${st.alternatives.map(
                          (alt) => html`<option value="${alt.id}">${alt.title} (~${alt.minutes}m)</option>`,
                        )}
                      </select>
                    </label>`
                  : ""
              }
              <button type="button" class="ghost small" data-tc-move="${idx}" data-dir="-1" ${idx === 0 ? raw("disabled") : ""} aria-label="Move stage ${idx + 1} up">↑ Up</button>
              <button type="button" class="ghost small" data-tc-move="${idx}" data-dir="1" ${idx === pw.stages.length - 1 ? raw("disabled") : ""} aria-label="Move stage ${idx + 1} down">↓ Down</button>
              ${
                pw.stages.length > 2
                  ? html`<button type="button" class="ghost small" data-tc-remove="${idx}" aria-label="Remove stage ${st.stageName[0]}">Remove</button>`
                  : ""
              }
            </div>
          </li>`,
        )}
      </ol>

      <div class="tc-share-bar">
        <label class="field">
          <span>Pathway title (optional)</span>
          <input
            type="text"
            data-tc-plan-title
            value="${state.planTitle}"
            placeholder="${state.planDomain} Pathway · Grades ${state.planBand}"
          />
        </label>
        <div class="tc-share-btns">
          <a class="btn btn-primary" href="${pw.playlistUrl}" target="_blank" rel="noopener">
            ${icon("play")} Preview Student Experience
          </a>
          <button type="button" class="btn" data-tc-act="copy-pathway">
            ${icon("copy")} Copy Shareable Link
          </button>
          <button type="button" class="btn" data-tc-act="save-pathway">
            ${icon("save")} Save to My Resources
          </button>
        </div>
      </div>
      ${state.statusNote ? html`<p class="tc-status" role="status">${state.statusNote}</p>` : ""}

      <aside class="tc-what-next" aria-label="Suggested next step">
        <strong>What next?</strong>
        ${nextSteps.map(
          (n) => html`<a class="tc-next-link" href="${n.href}"><strong>${n.title[0]}:</strong> ${n.detail[0]} →</a>`,
        )}
      </aside>
    </div>`;
  }

  function renderSupportTab() {
    const plan = recommendDifferentiation({
      band: state.supBand,
      domain: state.supDomain,
      support: state.supSupport,
      skill: state.supSkill,
      observedNeeds: state.supNeeds,
      registry,
    });
    return html`<div class="tc-workspace" id="tcSupport" role="region" aria-labelledby="tc-tab-support">
      <div class="tc-ws-head">
        <div>
          <h3>Support a Student · WIDA Differentiation Workspace</h3>
          <p class="fine">${plan.pedagogicalPrinciple[0]}</p>
        </div>
        <a class="btn small" href="${BASE}/scaffold?grades=${state.supBand}">
          ${icon("writing")} Open Student Language Builders
        </a>
      </div>

      <div class="tc-controls">
        <label class="field">
          <span>Grade band</span>
          <select data-tc-sup="supBand">
            ${["K", "1", "2-3", "3-5", "6-8"].map(
              (b) => html`<option value="${b}" ${state.supBand === b ? raw("selected") : ""}>Grades ${b}</option>`,
            )}
          </select>
        </label>
        <label class="field">
          <span>Language domain</span>
          <select data-tc-sup="supDomain">
            ${["Listening", "Speaking", "Reading", "Writing"].map(
              (d) => html`<option value="${d}" ${state.supDomain === d ? raw("selected") : ""}>${d}</option>`,
            )}
          </select>
        </label>
        <label class="field">
          <span>Support profile (flexible, not a fixed label)</span>
          <select data-tc-sup="supSupport">
            <option value="A" ${state.supSupport === "A" ? raw("selected") : ""}>Starting support (high scaffolding)</option>
            <option value="B" ${state.supSupport === "B" ? raw("selected") : ""}>Growing support (moderate scaffolding)</option>
            <option value="C" ${state.supSupport === "C" ? raw("selected") : ""}>Expanding support (light/fadeable scaffolding)</option>
          </select>
        </label>
        <label class="field tc-field-wide">
          <span>Target skill or topic (optional)</span>
          <input
            type="search"
            data-tc-sup-skill
            value="${state.supSkill}"
            placeholder="e.g. claim, retell, cause and effect…"
          />
        </label>
      </div>

      <p class="tc-wida-banner">
        <strong>${plan.tierName[0]}:</strong> ${plan.widaGuidance[0]}
      </p>

      <fieldset class="tc-scaffold-checks">
        <legend>Toggle supports to include in your instructional plan (adjustable &amp; fadeable):</legend>
        <div class="tc-check-grid">
          ${SCAFFOLD_CATALOG.map(
            (s) => html`<label class="tc-check-item">
              <input
                type="checkbox"
                data-tc-need="${s.id}"
                ${state.supNeeds.includes(s.id) || SUPPORT_TIERS[state.supSupport]?.scaffolds.includes(s.id) ? raw("checked") : ""}
              />
              <span>
                <strong>${s.label[0]}</strong>
                <small>${s.purpose[0]}</small>
                <small class="tc-fade-tip"><em>How to fade:</em> ${s.fadeTip[0]}</small>
              </span>
            </label>`,
          )}
        </div>
      </fieldset>

      <h4>Matching Ready-to-Assign Activities (${plan.tierName[0]})</h4>
      <ul class="tc-rec-grid">
        ${plan.recommendedActivities.map(
          (act) => html`<li class="tc-rec-card">
            <strong><a href="${act.urlFor(state.supBand)}" target="_blank" rel="noopener">${act.title}</a></strong>
            <span class="fine">${act.description}</span>
            <div class="tc-stage-actions">
              <a class="btn small" href="${act.urlFor(state.supBand)}" target="_blank" rel="noopener">Preview ${icon("external")}</a>
              <button type="button" class="btn small" data-tc-copy="${act.urlFor(state.supBand)}">${icon("copy")} Copy student link</button>
            </div>
          </li>`,
        )}
      </ul>
      ${state.statusNote ? html`<p class="tc-status" role="status">${state.statusNote}</p>` : ""}
    </div>`;
  }

  function renderAssignTab() {
    const pool = discoverResources(registry, {
      band: state.assignBand,
      domain: state.assignDomain,
      support: state.assignSupport,
      type: "activity",
      limit: 12,
    }).map((r) => r.item);
    const chosen = pool.find((x) => x.activityId === state.assignResourceId) || pool[0];
    const studentLink = chosen ? chosen.urlFor(state.assignBand) : `${BASE}/${state.assignDomain}/${state.assignSupport}?grades=${state.assignBand}`;
    const familyCompanionLink = chosen
      ? `${BASE}/family?grades=${state.assignBand}&companion=${encodeURIComponent(chosen.activityId)}`
      : `${BASE}/family?grades=${state.assignBand}`;

    return html`<div class="tc-workspace" id="tcAssign" role="region" aria-labelledby="tc-tab-assign">
      <div class="tc-ws-head">
        <div>
          <h3>Assign Practice · Student &amp; Family Companion Links</h3>
          <p class="fine">
            Select an activity, preview the student experience, choose support defaults, and copy a
            direct link for students or a plain-language Family Companion link for caregivers.
          </p>
        </div>
        <div class="tc-stage-actions">
          <a class="btn small" href="#accAssign">Open Multi-Activity Assignment Builder</a>
          <a class="btn small" href="${BASE}/launch-studio?grades=${state.assignBand}">${icon("launch")} Open QR Launch Studio</a>
        </div>
      </div>

      <div class="tc-controls">
        <label class="field">
          <span>1. Grade band</span>
          <select data-tc-assign="assignBand">
            ${["K", "1", "2-3", "3-5", "6-8"].map(
              (b) => html`<option value="${b}" ${state.assignBand === b ? raw("selected") : ""}>Grades ${b}</option>`,
            )}
          </select>
        </label>
        <label class="field">
          <span>2. Language domain</span>
          <select data-tc-assign="assignDomain">
            ${["Listening", "Speaking", "Reading", "Writing"].map(
              (d) => html`<option value="${d}" ${state.assignDomain === d ? raw("selected") : ""}>${d}</option>`,
            )}
          </select>
        </label>
        <label class="field">
          <span>3. Support level</span>
          <select data-tc-assign="assignSupport">
            <option value="A" ${state.assignSupport === "A" ? raw("selected") : ""}>Starting (Tier A)</option>
            <option value="B" ${state.assignSupport === "B" ? raw("selected") : ""}>Growing (Tier B)</option>
            <option value="C" ${state.assignSupport === "C" ? raw("selected") : ""}>Expanding (Tier C)</option>
          </select>
        </label>
        <label class="field tc-field-wide">
          <span>4. Activity to assign</span>
          <select data-tc-assign="assignResourceId">
            ${pool.map(
              (a) =>
                html`<option value="${a.activityId}" ${chosen?.activityId === a.activityId ? raw("selected") : ""}>
                  ${a.title} (${a.objective} · ~${a.minutes} min)
                </option>`,
            )}
          </select>
        </label>
      </div>

      ${
        chosen
          ? html`<div class="tc-assign-card">
              <div class="tc-assign-preview">
                <h4>Selected: ${chosen.title}</h4>
                <p class="fine">${chosen.description}</p>
                <p class="fine">
                  <strong>Completion evidence:</strong> Student responses save on the student's device (and sync to your Live Class review queue when students join your class code in <a href="#liveClass">Live class</a>). Public links never expose student records.
                </p>
              </div>
              <div class="tc-share-btns">
                <a class="btn btn-primary" href="${studentLink}" target="_blank" rel="noopener">
                  ${icon("external")} Preview Student Experience
                </a>
                <button type="button" class="btn" data-tc-copy="${studentLink}">
                  ${icon("copy")} Copy Student Link
                </button>
                <button type="button" class="btn" data-tc-copy="${familyCompanionLink}">
                  ${icon("families")} Copy Family Companion Link
                </button>
                <a class="btn small" href="${familyCompanionLink}" target="_blank" rel="noopener">
                  Preview Family Companion
                </a>
              </div>
            </div>`
          : ""
      }
      ${state.statusNote ? html`<p class="tc-status" role="status">${state.statusNote}</p>` : ""}
    </div>`;
  }

  function renderAnalyzeTab() {
    const ledger = loadLedger();
    const entries = ledger.entries || [];
    const records = allRecords();
    const completedCount = records.reduce((n, r) => n + (r.record?.complete?.length || 0), 0);
    const independentCount = entries.filter((e) => e.stage === "independent").length;
    const supportedCount = entries.filter((e) => e.stage === "supported").length;

    return html`<div class="tc-workspace" id="tcAnalyze" role="region" aria-labelledby="tc-tab-analyze">
      <div class="tc-ws-head">
        <div>
          <h3>Analyze Progress · Observed Evidence &amp; WIDA Data Studio</h3>
          <p class="fine">
            All analysis distinguishes observed performance from estimates. Practice activities record
            first attempts, supported vs. independent work, and revisions—never an invented WIDA score.
          </p>
        </div>
        <div class="tc-stage-actions">
          <a class="btn btn-primary small" href="/access-teacher/predictive/">
            ${icon("growth")} Open WIDA Data Studio
          </a>
          <a class="btn small" href="/access-teacher/predictive/?demo=1">
            Try Data Studio with Sample Class
          </a>
        </div>
      </div>

      <ul class="tc-stat-grid">
        <li class="tc-stat-card">
          <strong>${completedCount}</strong>
          <span>Completed activities on this device</span>
        </li>
        <li class="tc-stat-card">
          <strong>${entries.length}</strong>
          <span>Speaking &amp; writing ledger entries</span>
        </li>
        <li class="tc-stat-card">
          <strong>${independentCount} / ${supportedCount}</strong>
          <span>Independent vs. supported responses</span>
        </li>
      </ul>

      <div class="tc-rec-grid">
        <article class="tc-rec-card">
          <strong>WIDA Data Intelligence Studio</strong>
          <span class="fine">Import official ACCESS or MODEL scores, analyze domain bottlenecks, view longitudinal trajectories, and form instructional groups.</span>
          <a class="btn small" href="/access-teacher/predictive/">Open Data Studio →</a>
        </article>
        <article class="tc-rec-card">
          <strong>Speaking &amp; Writing Review Queue</strong>
          <span class="fine">Read and listen to student submissions, give rubric feedback, and assign targeted follow-up loops.</span>
          <a class="btn small" href="#accReview">Jump to Review Queue →</a>
        </article>
        <article class="tc-rec-card">
          <strong>Class Language Evidence &amp; Heat Map</strong>
          <span class="fine">Inspect Key Language Use coverage (Narrate, Inform, Explain, Argue) and build group playlists.</span>
          <a class="btn small" href="#classEvidencePanel">Jump to Class Evidence →</a>
        </article>
        <article class="tc-rec-card">
          <strong>Learning Insights &amp; Reteaching</strong>
          <span class="fine">Spot repeated error patterns and launch targeted Error Detective or scaffolded practice.</span>
          <a class="btn small" href="#accInsights">Jump to Learning Insights →</a>
        </article>
      </div>
    </div>`;
  }

  function renderResourcesTab() {
    const savedPathways = readSavedPathways();
    const recentIds = safeJson(storage.get("accessPracticeLab:v1:exploreRecent"), []);
    const recentItems = (Array.isArray(recentIds) ? recentIds : [])
      .map((r) => DESTINATIONS.find((d) => d.id === r?.id))
      .filter(Boolean)
      .slice(0, 6);
    const customExps = Object.values(safeJson(storage.get("accessPracticeLab:v1:experiences"), {})?.items || {});
    const classes = safeJson(storage.get("accessPracticeLabClass:v1:teacher-classes"), []);

    return html`<div class="tc-workspace" id="tcResources" role="region" aria-labelledby="tc-tab-resources">
      <div class="tc-ws-head">
        <div>
          <h3>My Resources · Saved Pathways, Books &amp; Class Materials</h3>
          <p class="fine">
            Everything saved in this browser on this device. Reopen a pathway, launch Book Studio, or
            continue editing a custom experience.
          </p>
        </div>
        <a class="btn small" href="#activities">Browse All 896+ Activities</a>
      </div>

      <div class="tc-res-columns">
        <section class="tc-res-box">
          <h4>Saved Lesson Pathways (${savedPathways.length})</h4>
          ${
            savedPathways.length
              ? html`<ul class="tc-res-list">
                  ${savedPathways.map(
                    (p) => html`<li>
                      <div>
                        <strong>${p.title}</strong>
                        <span class="fine">Grades ${p.band} · ${p.domain} · ${p.stages?.length || 5} stages (~${p.minutes}m)</span>
                      </div>
                      <div class="tc-stage-actions">
                        <a class="btn small" href="${p.playlistUrl}" target="_blank" rel="noopener">Open</a>
                        <button type="button" class="btn small" data-tc-copy="${p.playlistUrl}">Copy link</button>
                        <button type="button" class="ghost small" data-tc-del-pw="${p.id}">Remove</button>
                      </div>
                    </li>`,
                  )}
                </ul>`
              : html`<p class="fine">No saved pathways yet. Use <strong>Plan a Lesson</strong> to compose and save your first sequence.</p>`
          }
        </section>

        <section class="tc-res-box">
          <h4>Created Materials &amp; Active Classes</h4>
          <ul class="tc-res-list">
            <li>
              <div>
                <strong>Book Studio Library &amp; Class Templates</strong>
                <span class="fine">26 templates across K–2, 3–5, and 6–8; saved books persist on this device.</span>
              </div>
              <div class="tc-stage-actions">
                <a class="btn small" href="${BASE}/book-studio">Open Book Studio</a>
                <a class="btn small" href="${BASE}/book-studio/templates">Templates</a>
              </div>
            </li>
            <li>
              <div>
                <strong>Experience Builder Projects (${customExps.length})</strong>
                <span class="fine">Turn your own classroom text or .docx into a playable simulation.</span>
              </div>
              <div class="tc-stage-actions">
                <a class="btn small" href="${BASE}/experience-builder">Open Builder</a>
              </div>
            </li>
            <li>
              <div>
                <strong>Saved Live Classes (${Array.isArray(classes) ? classes.length : 0})</strong>
                <span class="fine">Manage class join codes, assignments, and student review queues.</span>
              </div>
              <div class="tc-stage-actions">
                <a class="btn small" href="#liveClass">Open Live Class</a>
              </div>
            </li>
          </ul>
          ${
            recentItems.length
              ? html`<h4>Recently Opened on This Device</h4>
                  <ul class="tc-res-list">
                    ${recentItems.map(
                      (d) => html`<li>
                        <a href="${d.href.startsWith("/") ? d.href : `${BASE}/${d.href}`}">${d.title[0]}</a>
                        <span class="fine">${d.text[0]}</span>
                      </li>`,
                    )}
                  </ul>`
              : ""
          }
        </section>
      </div>
      ${state.statusNote ? html`<p class="tc-status" role="status">${state.statusNote}</p>` : ""}
    </div>`;
  }

  function renderCreateTab() {
    const creations = [
      {
        title: "Create a Story or Class Book",
        tool: "Book Studio",
        desc: "Launch Book Studio with 26 grade-band templates, bilingual word banks, author's craft stages, voice recording, and printable booklet export.",
        href: `${BASE}/book-studio`,
        secondaryHref: `${BASE}/book-studio/templates`,
        secondaryLabel: "Browse 26 Templates",
      },
      {
        title: "Build an Interactive Investigation from Your Text",
        tool: "Experience Builder",
        desc: "Paste a reading passage or upload a .docx file to compile an editable, playable investigation with characters, evidence checks, and writing.",
        href: `${BASE}/experience-builder`,
      },
      {
        title: "Prepare Projector-Ready Language Supports",
        tool: "Whole-Class Studio & Language Builders",
        desc: "Display source cards, toggle Starting/Growing/Expanding scaffolds live on your board, or launch Sentence Architecture and Evidence Builder.",
        href: `${BASE}/classroom`,
        secondaryHref: `${BASE}/scaffold`,
        secondaryLabel: "Open Language Builders",
      },
      {
        title: "Create Guided Practice & Editable Lesson Packets",
        tool: "Lesson Builder & Connected Pathways",
        desc: "Generate a complete lesson plan from any activity with printable student/teacher packets, or build a custom multi-stage pathway.",
        href: `${BASE}/lesson-builder`,
        secondaryHref: `${BASE}/pathways/build`,
        secondaryLabel: "Build Connected Pathway",
      },
      {
        title: "Make a Family-Friendly Activity",
        tool: "Family Companion & Family Trip",
        desc: "Send home a bilingual (English/Spanish) family practice activity with conversation prompts that require no teaching experience.",
        href: "#familyTrip",
        secondaryHref: `${BASE}/family`,
        secondaryLabel: "Preview Family Hub",
      },
    ];

    return html`<div class="tc-workspace" id="tcCreate" role="region" aria-labelledby="tc-tab-create">
      <div class="tc-ws-head">
        <div>
          <h3>Create Something · Intention-Based Creation Hub</h3>
          <p class="fine">
            Choose what you want to make. Every option launches the platform's existing creation
            engines directly.
          </p>
        </div>
      </div>
      <div class="tc-rec-grid">
        ${creations.map(
          (c) => html`<article class="tc-rec-card">
            <span class="tc-stage-badge">${c.tool}</span>
            <strong>${c.title}</strong>
            <span class="fine">${c.desc}</span>
            <div class="tc-stage-actions">
              <a class="btn btn-primary small" href="${c.href}">Launch ${c.tool} →</a>
              ${c.secondaryHref ? html`<a class="btn small" href="${c.secondaryHref}">${c.secondaryLabel}</a>` : ""}
            </div>
          </article>`,
        )}
      </div>
    </div>`;
  }

  function render() {
    const tourState = loadHubTourState();
    const tabMap = {
      plan: renderPlanTab,
      support: renderSupportTab,
      assign: renderAssignTab,
      analyze: renderAnalyzeTab,
      resources: renderResourcesTab,
      create: renderCreateTab,
    };
    const activeFn = tabMap[state.activeTab];

    host.innerHTML = toHtml(html`<div class="tc-shell">
      <div class="tc-head">
        <div>
          <h2 id="tcTitle">What do you need today?</h2>
          <p class="fine">Pick one task. It opens right here.</p>
        </div>
        <div class="tc-head-actions">
          <button
            type="button"
            class="btn btn-primary"
            data-tc-act="toggle-tour"
            aria-expanded="${tourState.open}"
          >
            ${icon("flag")}
            ${tourState.open
              ? "Close Guided Tour"
              : tourState.furthest > 1
                ? `Resume the tour (step ${tourState.step} of ${HUB_TOUR_STEPS.length})`
                : "Take the 3-step tour"}
          </button>
          <a class="btn small" href="${BASE}/start/tour" id="tcStartTour">
            Full-Screen Tour &amp; PDF Kit
          </a>
        </div>
      </div>

      ${tourState.open ? renderHubTourHTML(registry, tourState, state.statusNote) : ""}

      <div class="tc-action-grid" role="group" aria-label="Teaching tasks">
        ${COMMAND_ACTIONS.map(
          (a) => html`<button
            type="button"
            id="tc-tab-${a.id}"
            class="tc-action-card${state.activeTab === a.id ? " is-active" : ""}"
            aria-expanded="${String(state.activeTab === a.id)}"
            aria-controls="tc${a.id[0].toUpperCase() + a.id.slice(1)}"
            data-tc-action="${a.id}"
          >
            <span class="tc-action-ico" aria-hidden="true">${icon(a.icon)}</span>
            <span class="tc-action-body">
              <strong>${a.title}</strong>
              <span>${a.lead}</span>
            </span>
          </button>`,
        )}
      </div>

      ${activeFn ? activeFn() : ""}
      ${COMMAND_ACTIONS.filter((a) => a.id !== state.activeTab).map(
        (a) =>
          html`<div
            id="tc${a.id[0].toUpperCase() + a.id.slice(1)}"
            role="region"
            aria-labelledby="tc-tab-${a.id}"
            hidden
          ></div>`,
      )}
    </div>`);
  }

  host.addEventListener("click", async (e) => {
    const tabBtn = e.target.closest("[data-tc-action]");
    if (tabBtn) {
      // Picking the open task again closes it.
      const picked = tabBtn.dataset.tcAction;
      state.activeTab = state.activeTab === picked ? "" : picked;
      state.statusNote = "";
      render();
      host.querySelector(`[data-tc-action="${picked}"]`)?.focus({ preventScroll: true });
      return;
    }

    const moveBtn = e.target.closest("[data-tc-move]");
    if (moveBtn && state.pathway) {
      const idx = Number(moveBtn.dataset.tcMove);
      const dir = Number(moveBtn.dataset.dir);
      const target = idx + dir;
      if (target >= 0 && target < state.pathway.stages.length) {
        const copy = [...state.pathway.stages];
        const [item] = copy.splice(idx, 1);
        copy.splice(target, 0, item);
        state.pathway.stages = copy;
        refreshPlaylistUrl();
        render();
      }
      return;
    }

    const remBtn = e.target.closest("[data-tc-remove]");
    if (remBtn && state.pathway && state.pathway.stages.length > 2) {
      const idx = Number(remBtn.dataset.tcRemove);
      state.pathway.stages.splice(idx, 1);
      refreshPlaylistUrl();
      render();
      return;
    }

    const copyBtn = e.target.closest("[data-tc-copy]");
    if (copyBtn) {
      const url = new URL(copyBtn.dataset.tcCopy, location.origin).href;
      const ok = await copyText(url);
      state.statusNote = ok ? `Copied link: ${url}` : `Copy link: ${url}`;
      announce(state.statusNote);
      render();
      return;
    }

    const delBtn = e.target.closest("[data-tc-del-pw]");
    if (delBtn) {
      deleteSavedPathway(delBtn.dataset.tcDelPw);
      state.statusNote = "Removed saved pathway from this device.";
      render();
      return;
    }

    const htGoto = e.target.closest("[data-ht-goto]");
    if (htGoto) {
      const step = Number(htGoto.dataset.htGoto) || 1;
      const cur = loadHubTourState();
      saveHubTourState({ open: true, step, furthest: Math.max(cur.furthest, step) });
      state.statusNote = "";
      render();
      host.querySelector("#htStepTitle")?.focus({ preventScroll: true });
      return;
    }

    const htPick = e.target.closest("[data-ht-pick]");
    if (htPick) {
      saveHubTourState({ pickedId: htPick.dataset.htPick });
      state.statusNote = "Activity picked.";
      render();
      return;
    }

    const htScaffold = e.target.closest("[data-ht-scaffold]");
    if (htScaffold) {
      const id = htScaffold.dataset.htScaffold;
      const cur = loadHubTourState();
      const set = new Set(cur.scaffolds);
      set.has(id) ? set.delete(id) : set.add(id);
      saveHubTourState({ scaffolds: [...set] });
      render();
      return;
    }

    const htCopy = e.target.closest("[data-ht-copy]");
    if (htCopy) {
      const url = new URL(htCopy.dataset.htCopy, location.origin).href;
      const ok = await copyText(url);
      state.statusNote = ok ? `Copied link: ${url}` : `Link: ${url}`;
      announce(state.statusNote);
      render();
      return;
    }

    const htAct = e.target.closest("[data-ht-act]");
    if (htAct) {
      const cur = loadHubTourState();
      const act = htAct.dataset.htAct;
      if (act === "next") {
        const nextStep = Math.min(HUB_TOUR_STEPS.length, cur.step + 1);
        saveHubTourState({
          step: nextStep,
          furthest: Math.max(cur.furthest, nextStep),
          completed: nextStep === HUB_TOUR_STEPS.length || cur.completed,
        });
        state.statusNote = "";
      } else if (act === "back") {
        saveHubTourState({ step: Math.max(1, cur.step - 1) });
        state.statusNote = "";
      } else if (act === "close") {
        saveHubTourState({ open: false });
        state.statusNote = "Tour closed. Your place is saved.";
      } else if (act === "save-kit") {
        const kit = assembleStarterKit(registry, cur);
        const { ok, entry } = savePathwayRecord(kit.pathway, `Starter Kit · Grades ${kit.band} ${kit.domain}`);
        state.statusNote = ok
          ? `Saved "${entry.title}" to My Resources!`
          : "Could not save on this device. Copy the student link instead.";
      }
      render();
      host.querySelector("#htStepTitle")?.focus({ preventScroll: true });
      return;
    }

    const actBtn = e.target.closest("[data-tc-act]");
    if (!actBtn) return;
    const act = actBtn.dataset.tcAct;
    if (act === "toggle-tour") {
      const cur = loadHubTourState();
      saveHubTourState({ open: !cur.open });
      state.statusNote = "";
      render();
      if (!cur.open) host.querySelector("#htStepTitle")?.focus({ preventScroll: true });
    } else if (act === "reset-pathway") {
      rebuildPathway();
      state.statusNote = "Sequence reset to recommended defaults.";
      render();
    } else if (act === "copy-pathway" && state.pathway) {
      const url = new URL(state.pathway.playlistUrl, location.origin).href;
      const ok = await copyText(url);
      state.statusNote = ok
        ? `Pathway link copied (${url}). Ready to share with students!`
        : `Shareable link: ${url}`;
      announce(state.statusNote);
      render();
    } else if (act === "save-pathway" && state.pathway) {
      const { ok, entry } = savePathwayRecord(state.pathway, state.planTitle);
      state.statusNote = ok
        ? `Saved "${entry.title}" to My Resources on this device.`
        : "Browser storage is full or unavailable; copy the share link instead.";
      announce(state.statusNote);
      render();
    }
  });

  host.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.tcPlan) {
      const k = t.dataset.tcPlan;
      state[k] = k === "planMinutes" ? Number(t.value) : t.value;
      rebuildPathway();
      render();
      return;
    }
    if (t.dataset.tcSwap !== undefined && state.pathway) {
      const idx = Number(t.dataset.tcSwap);
      const nextItem = registry.find((r) => r.id === t.value);
      if (nextItem && state.pathway.stages[idx]) {
        state.pathway.stages[idx].resource = nextItem;
        state.pathway.stages[idx].minutes = nextItem.minutes || 5;
        state.pathway.stages[idx].whatStudentsDo = [nextItem.description, nextItem.descriptionEs];
        refreshPlaylistUrl();
        state.statusNote = `Replaced stage ${idx + 1} with "${nextItem.title}".`;
        render();
      }
      return;
    }
    if (t.dataset.tcSup) {
      state[t.dataset.tcSup] = t.value;
      render();
      return;
    }
    if (t.dataset.tcNeed) {
      const id = t.dataset.tcNeed;
      const set = new Set(state.supNeeds);
      t.checked ? set.add(id) : set.delete(id);
      state.supNeeds = [...set];
      return;
    }
    if (t.dataset.tcAssign) {
      state[t.dataset.tcAssign] = t.value;
      if (t.dataset.tcAssign !== "assignResourceId") state.assignResourceId = "";
      render();
      return;
    }
    if (t.dataset.htField) {
      saveHubTourState({ [t.dataset.htField]: t.value, pickedId: "", swappedPracticeId: "" });
      render();
      return;
    }
  });

  host.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.tcPlanInput === "planSkill") {
      state.planSkill = t.value;
      rebuildPathway();
      render();
      host.querySelector("[data-tc-plan-input='planSkill']")?.focus();
    } else if (t.hasAttribute("data-tc-plan-title")) {
      state.planTitle = t.value;
      refreshPlaylistUrl();
    } else if (t.hasAttribute("data-tc-sup-skill")) {
      state.supSkill = t.value;
      render();
      host.querySelector("[data-tc-sup-skill]")?.focus();
    }
  });

  render();
}
