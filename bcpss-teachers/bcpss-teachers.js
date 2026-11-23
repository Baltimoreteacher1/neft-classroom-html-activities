// BCPSS K–8 Curriculum & Language Bridge — Progressive 3-Step Workspace
import { renderQrSvg } from "./qr-svg.js";

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
const SUBJECTS = ["ELA", "Math", "Science", "Social Studies"];
const WIDA_TIERS = [
  { key: "1_2", label: "Levels 1–2", short: "Entering / Emerging" },
  { key: "3_4", label: "Levels 3–4", short: "Developing / Expanding" },
  { key: "5_6", label: "Levels 5–6", short: "Bridging / Reaching" },
];
const VALID_TABS = ["connections", "activities", "family", "deconstruct"];
const FAMILY_LANGS = [
  { code: "en", label: "English", rtl: false },
  { code: "es", label: "Español", rtl: false },
  { code: "ar", label: "العربية", rtl: true },
  { code: "fr", label: "Français / Kreyòl", rtl: false },
];

const SAMPLE_PASSAGES = {
  math: "A bakery uses 3 cups of flour for every 2 batches of rolls. If the baker needs to make 15 batches of rolls for a school event, determine how many cups of flour are required. Explain your reasoning using an equivalent ratio or unit rate.",
  science: "Students observed that a cup of cold water placed in a warm room formed droplets on the outside surface after ten minutes. Construct a scientific explanation describing how thermal energy transfer caused water vapor in the air to condense.",
};

const state = {
  grade: "6",
  subject: "Math",
  unitId: "",
  wida: "3_4",
  tab: "connections",
  units: [],
  detail: null,
  planMode: false,
  pinnedPlan: null,
  deconstructResult: null,
  familyLang: "en",
};

// Anonymous, FERPA-safe telemetry (zero PII; fire-and-forget)
function trackTelemetry(unitId, widaTier, eventType) {
  if (!unitId || !eventType) return;
  try {
    fetch("/api/bcpss/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit_id: unitId,
        wida_tier: widaTier || state.wida || "3_4",
        event_type: eventType,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Swallow network/environment errors silently
  }
}

const $ = (sel) => document.querySelector(sel);

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function safeParseJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function announce(msg) {
  const el = $("#liveAnnouncer");
  if (!el) return;
  el.textContent = "";
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
}

function curriculumFor(grade, subject) {
  const isK3 = ["K", "1", "2", "3"].includes(String(grade));
  const is45 = ["4", "5"].includes(String(grade));
  if (subject === "ELA") return isK3 ? "Wit & Wisdom + Fundations" : "Wit & Wisdom";
  if (subject === "Math") return "Reveal Math";
  if (subject === "Science") return isK3 || is45 ? "SABES" : "IQWST";
  if (subject === "Social Studies") return isK3 ? "Studies Weekly" : "BCPSS Social Studies";
  return "BCPSS Curriculum";
}

function gradeLabel(grade) {
  return String(grade) === "K" ? "Kindergarten (K)" : `Grade ${grade}`;
}

function kluClass(klu) {
  const k = String(klu || "").toLowerCase();
  if (k.includes("argue")) return "bh-klu-argue";
  if (k.includes("inform")) return "bh-klu-inform";
  if (k.includes("narrate")) return "bh-klu-narrate";
  return "bh-klu-explain";
}

function widaLabel(tier) {
  return WIDA_TIERS.find((t) => t.key === tier)?.label || "Levels 3–4";
}

function resolveLabRoute(route) {
  const raw = String(route || "/sentences").trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/access-practice-lab/")) return raw;
  if (raw.startsWith("/")) return `/access-practice-lab${raw}`;
  return `/access-practice-lab/${raw}`;
}

function extractScaffoldForTier(scaffoldsRaw, tierKey) {
  const parsed = safeParseJson(scaffoldsRaw, {}) || {};
  const tierObj =
    parsed[`level_${tierKey}`] ||
    parsed[tierKey] ||
    parsed[`levels_${tierKey}`] ||
    parsed[`L${tierKey}`] ||
    {};
  const frames = Array.isArray(tierObj.frames)
    ? tierObj.frames
    : Array.isArray(tierObj.sentence_frames)
      ? tierObj.sentence_frames
      : Array.isArray(tierObj)
        ? tierObj
        : [];
  const wordBank = Array.isArray(tierObj.word_bank)
    ? tierObj.word_bank
    : Array.isArray(tierObj.wordBank)
      ? tierObj.wordBank
      : Array.isArray(parsed.word_bank)
        ? parsed.word_bank
        : [];
  const teacherMove =
    tierObj.teacher_move ||
    tierObj.teacherMove ||
    tierObj.move ||
    parsed.teacher_move ||
    "Model the target frame aloud once, then have partners rehearse orally before writing.";
  return { frames, wordBank, teacherMove };
}

function normalizeVocab(raw) {
  const parsed = safeParseJson(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (typeof item === "string") return { word: item, tier: "Tier 2", hint: "" };
      if (!item || typeof item !== "object") return null;
      return {
        word: item.word || item.term || "",
        tier: item.tier ? (String(item.tier).toLowerCase().startsWith("tier") ? String(item.tier) : `Tier ${item.tier}`) : "Tier 2",
        hint: item.cognate_hint || item.cognate || item.es_cognate || item.definition || item.note || "",
      };
    })
    .filter((v) => v && v.word);
}

function normalizeL1Watchouts(raw) {
  const parsed = safeParseJson(raw, {});
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => ({
        language: item.language || item.l1 || "Home Language",
        note: item.note || item.watchout || item.guidance || "",
      }))
      .filter((i) => i.note);
  }
  if (parsed && typeof parsed === "object") {
    const labelMap = {
      spanish: "Spanish",
      es: "Spanish",
      arabic: "Arabic",
      ar: "Arabic",
      french_creole: "French / Haitian Creole",
      french: "French / Haitian Creole",
      haitian_creole: "French / Haitian Creole",
      fr_ht: "French / Haitian Creole",
    };
    return Object.entries(parsed)
      .filter(([, v]) => Boolean(v))
      .map(([k, v]) => ({
        language: labelMap[k.toLowerCase()] || k,
        note: typeof v === "string" ? v : v.note || v.tip || JSON.stringify(v),
      }));
  }
  if (typeof raw === "string" && raw.trim()) {
    return [{ language: "Multilingual Learners", note: raw.trim() }];
  }
  return [];
}

function syncUrl() {
  if (state.planMode) return;
  const url = new URL(window.location.href);
  url.pathname = "/bcpss-teachers";
  url.searchParams.set("grade", state.grade);
  url.searchParams.set("subject", state.subject);
  if (state.unitId) url.searchParams.set("unitId", state.unitId);
  else url.searchParams.delete("unitId");
  url.searchParams.set("wida", state.wida);
  url.searchParams.set("tab", state.tab);
  history.replaceState(null, "", url.pathname + url.search);
}

function updateSubjectLabels() {
  const select = $("#subjectSelect");
  if (!select) return;
  for (const opt of select.options) {
    const subj = opt.value;
    opt.textContent = `${subj} (${curriculumFor(state.grade, subj)})`;
  }
  const badge = $("#curriculumBadge");
  if (badge) {
    badge.textContent = `${curriculumFor(state.grade, state.subject)} · ${gradeLabel(state.grade)}`;
  }
}

async function copyToClipboard(text, btn, doneLabel = "Copied!") {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = doneLabel;
      setTimeout(() => {
        btn.textContent = prev;
      }, 1500);
    }
    announce("Copied to clipboard.");
    return true;
  } catch {
    announce("Could not copy automatically. Please copy the text manually.");
    return false;
  }
}

// ── Data Fetching ───────────────────────────────────────────────────────────

async function fetchJson(url, options) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...(options?.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}

async function loadUnits(preferredUnitId = "") {
  const strip = $("#unitStrip");
  strip.innerHTML = `<div class="bh-loading" role="status">Loading ${esc(gradeLabel(state.grade))} ${esc(state.subject)} units…</div>`;
  try {
    const data = await fetchJson(
      `/api/bcpss/units?grade=${encodeURIComponent(state.grade)}&subject=${encodeURIComponent(state.subject)}`,
    );
    state.units = Array.isArray(data.units) ? data.units : [];
    renderUnitStrip();
    if (!state.units.length) {
      state.unitId = "";
      state.detail = null;
      syncUrl();
      renderEmptyWorkspace();
      return;
    }
    const targetId =
      preferredUnitId && state.units.some((u) => u.id === preferredUnitId)
        ? preferredUnitId
        : state.units[0].id;
    await selectUnit(targetId);
  } catch (err) {
    strip.innerHTML = `<div class="bh-error" role="alert">Unable to load BCPSS units: ${esc(err.message)}</div>`;
  }
}

async function selectUnit(unitId, { skipFetchIfLoaded = false } = {}) {
  state.unitId = unitId;
  renderUnitStrip();
  syncUrl();
  if (skipFetchIfLoaded && state.detail?.unit?.id === unitId) {
    renderWorkspace();
    return;
  }
  $("#panel-connections").innerHTML = `<div class="bh-loading" role="status">Loading unit language bridge…</div>`;
  $("#panel-activities").innerHTML = `<div class="bh-loading" role="status">Loading ready-to-use activities…</div>`;
  try {
    const detail = await fetchJson(`/api/bcpss/units/${encodeURIComponent(unitId)}`);
    state.detail = detail;
    renderWorkspace();
  } catch (err) {
    const errHtml = `<div class="bh-error" role="alert">Unable to load unit details: ${esc(err.message)}</div>`;
    $("#panel-connections").innerHTML = errHtml;
    $("#panel-activities").innerHTML = errHtml;
  }
}

async function loadSharedPlan(planId) {
  state.planMode = true;
  const banner = $("#pinnedPlanBanner");
  banner.hidden = false;
  banner.innerHTML = `<div class="bh-loading" role="status">Loading shared co-teacher plan…</div>`;
  try {
    const data = await fetchJson(`/api/bcpss/plans/${encodeURIComponent(planId)}`);
    const plan = data.plan;
    const detail = data.detail;
    state.pinnedPlan = plan;
    state.detail = detail;
    if (detail?.unit) {
      state.grade = String(detail.unit.grade);
      state.subject = detail.unit.subject;
      state.unitId = detail.unit.id;
    }
    if (plan?.wida_tier && WIDA_TIERS.some((t) => t.key === plan.wida_tier)) {
      state.wida = plan.wida_tier;
    }
    $("#gradeSelect").value = state.grade;
    updateSubjectLabels();
    $("#subjectSelect").value = state.subject;
    renderPinnedPlanBanner();
    renderWorkspace();

    // Also load the sibling unit list for the strip without overwriting the loaded detail
    const unitsData = await fetchJson(
      `/api/bcpss/units?grade=${encodeURIComponent(state.grade)}&subject=${encodeURIComponent(state.subject)}`,
    );
    state.units = Array.isArray(unitsData.units) ? unitsData.units : [];
    renderUnitStrip();
  } catch (err) {
    banner.innerHTML = `<div class="bh-error" role="alert">Could not load shared plan: ${esc(err.message)}. <a href="/bcpss-teachers">Open all BCPSS units</a></div>`;
    state.planMode = false;
    await loadUnits();
  }
}

// ── Rendering ───────────────────────────────────────────────────────────────

function renderPinnedPlanBanner() {
  const banner = $("#pinnedPlanBanner");
  const plan = state.pinnedPlan;
  if (!plan) {
    banner.hidden = true;
    return;
  }
  const created = plan.created_at ? new Date(plan.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
  banner.hidden = false;
  banner.innerHTML = `
    <div class="bh-pinned-head">
      <span class="bh-pinned-badge">Shared Co-Teacher Plan · ${esc(widaLabel(plan.wida_tier))}</span>
      <span class="bh-muted">${created ? `Saved ${esc(created)}` : ""}</span>
    </div>
    <p class="bh-pinned-note">${esc(plan.teacher_note || "Shared unit language plan for co-planning.")}</p>
    <div class="bh-pinned-meta">
      <span>Pre-selected: <strong>${esc(gradeLabel(state.grade))} · ${esc(state.subject)}</strong></span>
      <a href="/bcpss-teachers">Browse all BCPSS units</a>
    </div>
  `;
}

function renderUnitStrip() {
  const strip = $("#unitStrip");
  const countEl = $("#unitsCount");
  if (countEl) {
    countEl.textContent = state.units.length
      ? `${state.units.length} unit${state.units.length === 1 ? "" : "s"} available`
      : "0 units";
  }
  if (!state.units.length) {
    strip.innerHTML = `<div class="bh-empty">No units found for ${esc(gradeLabel(state.grade))} ${esc(state.subject)}.</div>`;
    return;
  }
  strip.innerHTML = state.units
    .map((u) => {
      const active = u.id === state.unitId;
      return `
        <button
          type="button"
          class="bh-unit-card"
          data-unit-id="${esc(u.id)}"
          aria-pressed="${active ? "true" : "false"}"
        >
          <div class="bh-unit-top">
            <span class="bh-unit-num">Unit ${esc(u.unit_number)}</span>
            ${u.primary_klu ? `<span class="bh-klu-pill ${kluClass(u.primary_klu)}">${esc(u.primary_klu)}</span>` : ""}
          </div>
          <div class="bh-unit-title">${esc(u.unit_title)}</div>
          <div class="bh-unit-curric">${esc(u.curriculum_name || curriculumFor(u.grade, u.subject))}</div>
        </button>
      `;
    })
    .join("");
}

function renderEmptyWorkspace() {
  $("#workspaceTitle").textContent = "No unit selected";
  $("#workspaceMeta").textContent = "";
  const headerActions = $("#workspaceHeaderActions");
  if (headerActions) {
    headerActions.hidden = true;
    headerActions.innerHTML = "";
  }
  $("#printKitBtn").disabled = true;
  $("#sharePlanBtn").disabled = true;
  $("#panel-connections").innerHTML = `<div class="bh-empty">Choose a grade and content area above to load a unit.</div>`;
  $("#panel-activities").innerHTML = `<div class="bh-empty">Choose a grade and content area above to view classroom activities.</div>`;
  $("#panel-family").innerHTML = `<div class="bh-empty">Choose a grade and content area above to view the family bridge card.</div>`;
}

function renderWorkspace() {
  const detail = state.detail;
  if (!detail?.unit) {
    renderEmptyWorkspace();
    return;
  }
  const u = detail.unit;
  $("#workspaceTitle").textContent = `Unit ${u.unit_number}: ${u.unit_title}`;
  const standards = u.core_standards ? ` · Standards: ${u.core_standards}` : "";
  $("#workspaceMeta").textContent = `${gradeLabel(u.grade)} · ${u.curriculum_name || curriculumFor(u.grade, u.subject)}${standards}`;
  const headerActions = $("#workspaceHeaderActions");
  if (headerActions) {
    if (u.external_content_lab_url) {
      headerActions.hidden = false;
      headerActions.innerHTML = `
        <a
          class="bh-btn bh-btn-secondary bh-btn-sm"
          href="${esc(u.external_content_lab_url)}"
          target="_blank"
          rel="noopener"
          data-external-lab-launch
        >
          Open Matching Math Lab (EduWonderLab) ↗
        </a>
      `;
    } else {
      headerActions.hidden = true;
      headerActions.innerHTML = "";
    }
  }
  $("#printKitBtn").disabled = false;
  $("#sharePlanBtn").disabled = false;

  renderConnectionsTab();
  renderActivitiesTab();
  renderFamilyTab();
  renderPrintKit();
}

function renderConnectionsTab() {
  const panel = $("#panel-connections");
  const detail = state.detail;
  const conn = detail?.connections?.[0];
  if (!conn) {
    panel.innerHTML = `<div class="bh-empty">No WIDA language bridge connections recorded for this unit yet.</div>`;
    return;
  }
  const bp = conn.blueprint || {};
  const scaffold = extractScaffoldForTier(bp.scaffolds_json, state.wida);
  const vocab = normalizeVocab(conn.tier2_tier3_vocab);
  const l1List = normalizeL1Watchouts(conn.l1_watchouts);
  const transfers = Array.isArray(detail.cross_subject_transfers) ? detail.cross_subject_transfers : [];

  panel.innerHTML = `
    <div class="bh-conn-grid">
      <article class="bh-blueprint-card">
        <div class="bh-blueprint-top">
          <div>
            <span class="bh-klu-pill ${kluClass(bp.wida_klu)}">WIDA Key Language Use: ${esc(bp.wida_klu || "Explain")}</span>
            <h3>${esc(bp.move_name || "Academic Language Move")}</h3>
            ${bp.syntax_pattern ? `<p class="bh-syntax-pattern"><strong>Syntax Pattern:</strong> ${esc(bp.syntax_pattern)}</p>` : ""}
          </div>
          <div class="bh-wida-toggle" role="group" aria-label="WIDA Proficiency Level">
            ${WIDA_TIERS.map(
              (t) => `
                <button
                  type="button"
                  class="bh-wida-btn"
                  data-wida-tier="${t.key}"
                  aria-pressed="${state.wida === t.key ? "true" : "false"}"
                >
                  ${esc(t.label)}
                </button>
              `,
            ).join("")}
          </div>
        </div>

        <div class="bh-scaffold-box">
          <div>
            <h4>Sentence Frames (${esc(widaLabel(state.wida))})</h4>
            ${
              scaffold.frames.length
                ? `<ul class="bh-frame-list">${scaffold.frames.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`
                : `<p class="bh-muted">Use the unit example frame below to scaffold student responses.</p>`
            }
          </div>
          <div>
            <h4>Target Word Bank</h4>
            <div class="bh-wordbank-chips">
              ${
                scaffold.wordBank.length
                  ? scaffold.wordBank.map((w) => `<span class="bh-word-chip">${esc(w)}</span>`).join("")
                  : `<span class="bh-muted">See Tier 2/3 Vocabulary below</span>`
              }
            </div>
            <h4>High-Leverage Teacher Move</h4>
            <p class="bh-teacher-move">${esc(scaffold.teacherMove)}</p>
          </div>
        </div>

        ${
          conn.unit_example_frame
            ? `<div class="bh-unit-example">
                <strong>Unit Example Frame:</strong> ${esc(conn.unit_example_frame)}
                ${conn.cross_subject_bridge_note ? `<p class="bh-bridge-note">${esc(conn.cross_subject_bridge_note)}</p>` : ""}
              </div>`
            : ""
        }
      </article>

      <div class="bh-two-col">
        <section class="bh-subpanel" aria-label="Tier 2 and Tier 3 Vocabulary">
          <h4>Tier 2 &amp; Tier 3 Vocabulary + Cognates</h4>
          ${
            vocab.length
              ? `<div class="bh-vocab-grid">
                  ${vocab
                    .map(
                      (v) => `
                        <div class="bh-vocab-card" data-vocab-word="${esc(v.word)}" tabindex="0" role="button" aria-label="Copy vocabulary term ${esc(v.word)}">
                          <div class="bh-vocab-head">
                            <span class="bh-vocab-word">${esc(v.word)}</span>
                            <span class="bh-tier-badge">${esc(v.tier)}</span>
                          </div>
                          ${v.hint ? `<p class="bh-vocab-hint">${esc(v.hint)}</p>` : ""}
                        </div>
                      `,
                    )
                    .join("")}
                </div>`
              : `<p class="bh-muted">No vocabulary entries listed for this unit.</p>`
          }
        </section>

        <section class="bh-subpanel" aria-label="Home Language L1 Watchouts">
          <h4>L1 Watchouts (Spanish · Arabic · French/Haitian Creole)</h4>
          ${
            l1List.length
              ? `<div class="bh-l1-list">
                  ${l1List
                    .map(
                      (item) => `
                        <div class="bh-l1-item">
                          <strong>${esc(item.language)}</strong>
                          <p>${esc(item.note)}</p>
                        </div>
                      `,
                    )
                    .join("")}
                </div>`
              : `<p class="bh-muted">No L1 watchouts recorded for this unit.</p>`
          }
        </section>
      </div>

      ${
        transfers.length
          ? `<section class="bh-transfers" aria-label="Cross-subject language transfer">
              <h4>See How This Move Transfers</h4>
              <p class="bh-transfers-lead">
                Students practice this same <strong>${esc(bp.move_name || "language move")}</strong> across other ${esc(gradeLabel(detail.unit.grade))} BCPSS subjects. Click any card to jump directly to that unit:
              </p>
              <div class="bh-transfer-strip">
                ${transfers
                  .map(
                    (tr) => `
                      <button
                        type="button"
                        class="bh-transfer-card"
                        data-transfer-unit="${esc(tr.unit_id)}"
                        data-transfer-grade="${esc(tr.grade)}"
                        data-transfer-subject="${esc(tr.subject)}"
                      >
                        <span class="bh-transfer-tag">${esc(tr.subject)} · ${esc(tr.curriculum_name || curriculumFor(tr.grade, tr.subject))} · Unit ${esc(tr.unit_number)}</span>
                        <span class="bh-transfer-title">${esc(tr.unit_title)}</span>
                        ${tr.unit_example_frame ? `<span class="bh-transfer-frame">“${esc(tr.unit_example_frame)}”</span>` : ""}
                      </button>
                    `,
                  )
                  .join("")}
              </div>
            </section>`
          : ""
      }
    </div>
  `;
}

function renderActivitiesTab() {
  const panel = $("#panel-activities");
  const detail = state.detail;
  const unit = detail?.unit;
  const conn = detail?.connections?.[0] || null;
  const activities = Array.isArray(detail?.activities) ? detail.activities : [];
  const exitTicket = safeParseJson(conn?.language_exit_ticket_json, null);

  if (!unit) {
    panel.innerHTML = `<div class="bh-empty">Choose a unit above to view classroom activities.</div>`;
    return;
  }

  const activitiesHtml = activities.length
    ? `
      <div class="bh-activities-toolbar">
        <p><strong>${activities.length}-Step Pre-Teaching Sequence</strong> · Aligned to WIDA ${esc(widaLabel(state.wida))} frames</p>
        <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-copy-playlist>
          Copy Full 3-Day Pre-Teaching Playlist
        </button>
      </div>
      <div class="bh-activities-grid">
        ${activities
          .map((act, idx) => {
            const labBase = resolveLabRoute(act.target_lab_route);
            const studentUrl = `${labBase}?bcpssUnit=${encodeURIComponent(unit.id)}&activity=${encodeURIComponent(act.id)}&wida=${encodeURIComponent(state.wida)}`;
            return `
              <article class="bh-activity-card">
                <div class="bh-activity-badges">
                  <span class="bh-badge-type">${esc(act.activity_type || "Classroom Move")}</span>
                  <span class="bh-badge-prep">${esc(act.prep_time_minutes ?? 5)} min prep</span>
                </div>
                <h3>${esc(act.title)}</h3>
                <div class="bh-activity-block">
                  <strong>Teacher Instructions</strong>
                  <p style="margin:0">${esc(act.teacher_instructions)}</p>
                </div>
                <div class="bh-activity-block">
                  <strong>Student Prompt</strong>
                  <div class="bh-student-prompt-box">${esc(act.student_prompt)}</div>
                </div>
                <div class="bh-activity-actions">
                  <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-copy-activity="${idx}">
                    Copy for Slides / LMS
                  </button>
                  <a class="bh-btn bh-btn-primary bh-btn-sm" href="${esc(studentUrl)}" data-lab-launch>
                    Launch Student View →
                  </a>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `
    : `<div class="bh-empty">Classroom activities for this unit are scheduled in the next release. Use the Language Connections tab to view WIDA frames, vocabulary, and cross-subject bridges.</div>`;

  const exitTicketHtml =
    exitTicket && (exitTicket.prompt || exitTicket.quick_rubric)
      ? `
        <details class="bh-exit-ticket">
          <summary>
            <span>3-Minute Language Exit Ticket &amp; Quick Rubric</span>
            <span class="bh-muted">Expand</span>
          </summary>
          <div class="bh-exit-ticket-body">
            ${
              exitTicket.prompt
                ? `<div class="bh-activity-block">
                    <strong>Exit Ticket Prompt</strong>
                    <div class="bh-student-prompt-box">${esc(exitTicket.prompt)}</div>
                  </div>`
                : ""
            }
            ${
              Array.isArray(exitTicket.look_fors) && exitTicket.look_fors.length
                ? `<div class="bh-activity-block">
                    <strong>Language Look-Fors</strong>
                    <ul class="bh-frame-list">${exitTicket.look_fors.map((lf) => `<li>${esc(lf)}</li>`).join("")}</ul>
                  </div>`
                : ""
            }
            ${
              exitTicket.quick_rubric
                ? `<div class="bh-activity-block">
                    <strong>Quick Formative Rubric</strong>
                    <div class="bh-rubric-grid">
                      <div class="bh-rubric-col is-emerging">
                        <strong>Emerging</strong>
                        <p style="margin:0">${esc(exitTicket.quick_rubric.emerging || "")}</p>
                      </div>
                      <div class="bh-rubric-col is-developing">
                        <strong>Developing</strong>
                        <p style="margin:0">${esc(exitTicket.quick_rubric.developing || "")}</p>
                      </div>
                      <div class="bh-rubric-col is-proficient">
                        <strong>Proficient</strong>
                        <p style="margin:0">${esc(exitTicket.quick_rubric.proficient || "")}</p>
                      </div>
                    </div>
                  </div>`
                : ""
            }
            <div>
              <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-copy-exit-ticket>
                Copy Exit Ticket
              </button>
            </div>
          </div>
        </details>
      `
      : "";

  panel.innerHTML = `${activitiesHtml}${exitTicketHtml}`;
}

function normalizeFamilyBridge(detail, langCode) {
  const unit = detail?.unit || {};
  const conn = detail?.connections?.[0] || {};
  const bridge = safeParseJson(unit.family_bridge_json || detail?.family_bridge || detail?.family, {}) || {};
  const entry = bridge[langCode] || bridge.en || {};
  const vocab = normalizeVocab(conn.tier2_tier3_vocab);
  const questions = Array.isArray(entry.dinner_questions)
    ? entry.dinner_questions
    : Array.isArray(entry.questions)
      ? entry.questions
      : Array.isArray(entry.conversation_starters)
        ? entry.conversation_starters
        : [
            `Ask your child to explain one new idea from Unit ${unit.unit_number} (${unit.unit_title}) in their own words.`,
            `Invite your child to share a real-life example using one of this week's key vocabulary words.`,
          ];
  const keyWords = Array.isArray(entry.key_words)
    ? entry.key_words
    : Array.isArray(entry.vocabulary)
      ? entry.vocabulary
      : vocab.map((v) => ({ word: v.word, translation: v.hint }));
  return {
    title: entry.title || `Unit ${unit.unit_number}: ${unit.unit_title}`,
    summary: entry.summary || unit.unit_summary || "Families can strengthen school learning by talking about unit ideas at home in any language.",
    questions,
    keyWords,
  };
}

function renderFamilyTab() {
  const panel = $("#panel-family");
  const detail = state.detail;
  const unit = detail?.unit;
  if (!unit) {
    panel.innerHTML = `<div class="bh-empty">Choose a unit above to preview the bilingual family card.</div>`;
    return;
  }
  const langMeta = FAMILY_LANGS.find((l) => l.code === state.familyLang) || FAMILY_LANGS[0];
  const card = normalizeFamilyBridge(detail, langMeta.code);
  const familyUrl = `https://thelanguagepage.com/family/bcpss/${encodeURIComponent(unit.id)}`;
  const localFamilyHref = `/family/bcpss/${encodeURIComponent(unit.id)}?lang=${encodeURIComponent(langMeta.code)}`;
  const qrSvg = renderQrSvg(familyUrl, { sizePx: 168, label: `QR code for ${familyUrl}` });

  panel.innerHTML = `
    <div class="bh-family-layout">
      <div class="bh-family-preview">
        <div class="bh-family-lang-bar" role="group" aria-label="Preview home language">
          ${FAMILY_LANGS.map(
            (l) => `
              <button
                type="button"
                class="bh-lang-pill"
                data-family-lang="${l.code}"
                aria-pressed="${langMeta.code === l.code ? "true" : "false"}"
              >
                ${esc(l.label)}
              </button>
            `,
          ).join("")}
        </div>

        <article class="bh-family-card-body" lang="${esc(langMeta.code)}" dir="${langMeta.rtl ? "rtl" : "ltr"}">
          <div>
            <span class="bh-klu-pill bh-klu-inform">${esc(gradeLabel(unit.grade))} · ${esc(unit.curriculum_name || curriculumFor(unit.grade, unit.subject))}</span>
            <h3 style="margin-top:0.45rem">${esc(card.title)}</h3>
            <p style="margin:0.4rem 0 0;color:var(--ink-2)">${esc(card.summary)}</p>
          </div>

          <div>
            <h4 style="margin:0 0 0.4rem;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.04em;color:var(--sage-900)">
              Dinner-Table Conversation Questions
            </h4>
            <ul class="bh-family-questions">
              ${card.questions.map((q) => `<li>${esc(q)}</li>`).join("")}
            </ul>
          </div>

          ${
            card.keyWords.length
              ? `<div>
                  <h4 style="margin:0 0 0.4rem;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.04em;color:var(--sage-900)">
                    Key Unit Words
                  </h4>
                  <div class="bh-wordbank-chips" style="margin-bottom:0">
                    ${card.keyWords
                      .map((w) => {
                        const label = typeof w === "string" ? w : w.translation ? `${w.word} — ${w.translation}` : w.word;
                        return `<span class="bh-word-chip">${esc(label)}</span>`;
                      })
                      .join("")}
                  </div>
                </div>`
              : ""
          }
        </article>
      </div>

      <aside class="bh-family-share-card" aria-label="Share with families">
        <h4 style="margin:0;font:600 1.1rem/1.2 var(--font-display)">Scan or Share Home Card</h4>
        <div class="bh-qr-frame">${qrSvg}</div>
        <p class="bh-family-url">${esc(familyUrl)}</p>
        <div class="bh-family-share-actions">
          <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-copy-family-link="${esc(familyUrl)}">
            Copy Family Link
          </button>
          <a class="bh-btn bh-btn-secondary bh-btn-sm" href="${esc(localFamilyHref)}" target="_blank" rel="noopener">
            Open Family Page ↗
          </a>
        </div>
      </aside>
    </div>
  `;
}

function renderPrintKit() {
  const kit = $("#printKit");
  const detail = state.detail;
  if (!kit || !detail?.unit) return;
  const u = detail.unit;
  const conn = detail.connections?.[0] || {};
  const bp = conn.blueprint || {};
  const scaffold = extractScaffoldForTier(bp.scaffolds_json, state.wida);
  const vocab = normalizeVocab(conn.tier2_tier3_vocab);
  const transfers = Array.isArray(detail.cross_subject_transfers) ? detail.cross_subject_transfers : [];

  const stripHtml = `
    <div class="pk-strip">
      <div class="pk-strip-top">
        <span>Unit ${esc(u.unit_number)}: ${esc(u.unit_title)} (${esc(u.curriculum_name || curriculumFor(u.grade, u.subject))})</span>
        <span>WIDA ${esc(widaLabel(state.wida))}</span>
      </div>
      <ul class="pk-strip-frames">
        ${
          scaffold.frames.length
            ? scaffold.frames.map((f) => `<li>${esc(f)}</li>`).join("")
            : `<li>${esc(conn.unit_example_frame || "")}</li>`
        }
      </ul>
      <p class="pk-strip-bank">
        <strong>Word Bank:</strong> ${esc(scaffold.wordBank.length ? scaffold.wordBank.join(" · ") : vocab.map((v) => v.word).join(" · "))}
      </p>
    </div>
  `;

  kit.innerHTML = `
    <section class="pk-page-1">
      <div class="pk-header">
        <p class="pk-kicker">BCPSS Classroom Anchor Chart · ${esc(gradeLabel(u.grade))} · ${esc(u.curriculum_name || curriculumFor(u.grade, u.subject))}</p>
        <h1 class="pk-title">Unit ${esc(u.unit_number)}: ${esc(u.unit_title)}</h1>
        <p class="pk-meta">
          <strong>WIDA Key Language Use:</strong> ${esc(bp.wida_klu || u.primary_klu || "Explain")}
          ${u.core_standards ? ` · <strong>Standards:</strong> ${esc(u.core_standards)}` : ""}
        </p>
      </div>

      <div class="pk-box">
        <h3>Target Language Move &amp; Syntactic Pattern</h3>
        <p style="margin:0"><strong>${esc(bp.move_name || "")}</strong>${bp.syntax_pattern ? ` — ${esc(bp.syntax_pattern)}` : ""}</p>
        ${conn.unit_example_frame ? `<p class="pk-frame-big">“${esc(conn.unit_example_frame)}”</p>` : ""}
      </div>

      <div class="pk-box">
        <h3>Tier 2 &amp; Tier 3 Vocabulary with Cognate Hints</h3>
        <table class="pk-table">
          <thead>
            <tr>
              <th>Term</th>
              <th>Tier</th>
              <th>Cognate / Student Hint</th>
            </tr>
          </thead>
          <tbody>
            ${
              vocab.length
                ? vocab
                    .map(
                      (v) => `
                        <tr>
                          <td><strong>${esc(v.word)}</strong></td>
                          <td>${esc(v.tier)}</td>
                          <td>${esc(v.hint || "—")}</td>
                        </tr>
                      `,
                    )
                    .join("")
                : `<tr><td colspan="3">See unit word bank.</td></tr>`
            }
          </tbody>
        </table>
      </div>

      <div class="pk-box">
        <h3>Cross-Subject Transfer Bridge</h3>
        <p style="margin:0 0 4pt">${esc(conn.cross_subject_bridge_note || "Reinforce this same syntactic move across ELA, Math, Science, and Social Studies.")}</p>
        ${
          transfers.length
            ? `<p style="margin:0;font-size:9.5pt"><strong>Connected Units:</strong> ${transfers
                .map((t) => `${esc(t.subject)} Unit ${esc(t.unit_number)} (${esc(t.unit_title)})`)
                .join(" · ")}</p>`
            : ""
        }
      </div>
    </section>

    <section class="pk-page-2">
      <p class="pk-page-2-head">Cuttable Student Desk Strips — Cut Along Dashed Lines (${esc(widaLabel(state.wida))})</p>
      ${stripHtml}
      ${stripHtml}
      ${stripHtml}
      ${stripHtml}
    </section>
  `;
}

// ── Tab Switching ───────────────────────────────────────────────────────────

function setActiveTab(tabName, { focusTab = false } = {}) {
  if (!VALID_TABS.includes(tabName)) tabName = "connections";
  state.tab = tabName;
  for (const name of VALID_TABS) {
    const btn = $(`#tab-${name}`);
    const panel = $(`#panel-${name}`);
    const isSelected = name === tabName;
    if (btn) {
      btn.setAttribute("aria-selected", isSelected ? "true" : "false");
      btn.tabIndex = isSelected ? 0 : -1;
      if (focusTab && isSelected) btn.focus();
    }
    if (panel) {
      panel.hidden = !isSelected;
    }
  }
  syncUrl();
}

// ── Deconstruct a Passage ───────────────────────────────────────────────────

function renderDeconstructResults(data) {
  const box = $("#deconstructResults");
  const bp = data.matched_blueprint || {};
  const segments = Array.isArray(data.segments) ? data.segments : [];
  const cognates = Array.isArray(data.cognate_anchors) ? data.cognate_anchors : [];
  const traps = Array.isArray(data.syntax_traps) ? data.syntax_traps : [];
  const diff = data.differentiated_frames || {};
  const scorePct = typeof data.similarity_score === "number" ? `${Math.round(data.similarity_score * 100)}% match` : "";

  const annotatedHtml = segments
    .map((seg) => {
      if (seg.kind === "cognate") {
        const title = [seg.label, seg.note].filter(Boolean).join(" — ");
        return `<mark class="bh-mark-cognate" title="${esc(title)}">${esc(seg.text)}</mark>`;
      }
      if (seg.kind === "trap") {
        const title = [seg.label, seg.note].filter(Boolean).join(" — ");
        return `<mark class="bh-mark-trap" title="${esc(title)}">${esc(seg.text)}</mark>`;
      }
      return esc(seg.text);
    })
    .join("");

  const tiers = [
    { key: "level_1_2", label: "WIDA Levels 1–2", items: diff.level_1_2 || [] },
    { key: "level_3_4", label: "WIDA Levels 3–4", items: diff.level_3_4 || [] },
    { key: "level_5_6", label: "WIDA Levels 5–6", items: diff.level_5_6 || [] },
  ];

  box.innerHTML = `
    <div class="bh-result-banner">
      <div>
        <span class="bh-klu-pill ${kluClass(bp.wida_klu)}">Matched WIDA Blueprint: ${esc(bp.wida_klu || "Academic Language")}</span>
        <strong style="margin-left:0.5rem">${esc(bp.move_name || bp.id || "Matched Move")}</strong>
      </div>
      ${scorePct ? `<span class="bh-muted">${esc(scorePct)}</span>` : ""}
    </div>

    <div>
      <div class="bh-legend">
        <span class="bh-legend-item"><span class="bh-swatch bh-swatch-cognate" aria-hidden="true"></span> L1 Cognate Anchors (${cognates.length})</span>
        <span class="bh-legend-item"><span class="bh-swatch bh-swatch-trap" aria-hidden="true"></span> Academic Syntax Traps (${traps.length})</span>
      </div>
      <div class="bh-annotated-passage">${annotatedHtml || esc($("#passageInput").value)}</div>
    </div>

    <div class="bh-two-col">
      <section class="bh-subpanel">
        <h4>L1 Cognate Anchors</h4>
        ${
          cognates.length
            ? `<div class="bh-vocab-grid">
                ${cognates
                  .map(
                    (c) => `
                      <div class="bh-vocab-card">
                        <div class="bh-vocab-head">
                          <span class="bh-vocab-word">${esc(c.word)}</span>
                          <span class="bh-tier-badge">${esc(c.bridge || "Cognate")}</span>
                        </div>
                        ${c.note ? `<p class="bh-vocab-hint">${esc(c.note)}</p>` : ""}
                      </div>
                    `,
                  )
                  .join("")}
              </div>`
            : `<p class="bh-muted">No direct cognate anchors detected in this excerpt.</p>`
        }
      </section>

      <section class="bh-subpanel">
        <h4>Academic Syntax Traps</h4>
        ${
          traps.length
            ? `<div class="bh-l1-list">
                ${traps
                  .map(
                    (t) => `
                      <div class="bh-l1-item">
                        <strong>${esc(t.phrase)} ${t.category ? `· ${esc(t.category)}` : ""}</strong>
                        <p>${esc(t.quick_fix || "Unpack this clause aloud with students before independent work.")}</p>
                      </div>
                    `,
                  )
                  .join("")}
              </div>`
            : `<p class="bh-muted">No major syntax traps flagged in this excerpt.</p>`
        }
      </section>
    </div>

    <div>
      <h4 style="margin:0 0 0.65rem;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.04em;color:var(--ocean-900)">
        Differentiated Sentence Frames
      </h4>
      <div class="bh-tier-frames-grid">
        ${tiers
          .map(
            (tier) => `
              <article class="bh-tier-card">
                <h4>${esc(tier.label)}</h4>
                <ul>
                  ${
                    tier.items.length
                      ? tier.items.map((line) => `<li>${esc(line)}</li>`).join("")
                      : `<li>No frames returned for this tier.</li>`
                  }
                </ul>
                <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-copy-tier="${tier.key}">
                  Copy ${esc(tier.label)}
                </button>
              </article>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

// ── Event Binding ───────────────────────────────────────────────────────────

function bindEvents() {
  $("#gradeSelect").addEventListener("change", (e) => {
    state.planMode = false;
    state.pinnedPlan = null;
    $("#pinnedPlanBanner").hidden = true;
    state.grade = e.target.value;
    updateSubjectLabels();
    loadUnits();
  });

  $("#subjectSelect").addEventListener("change", (e) => {
    state.planMode = false;
    state.pinnedPlan = null;
    $("#pinnedPlanBanner").hidden = true;
    state.subject = e.target.value;
    updateSubjectLabels();
    loadUnits();
  });

  $("#unitStrip").addEventListener("click", (e) => {
    const card = e.target.closest("[data-unit-id]");
    if (!card) return;
    const id = card.dataset.unitId;
    if (!id || id === state.unitId) return;
    state.planMode = false;
    selectUnit(id);
  });

  // Tablist clicks + Arrow key navigation
  const tablist = $(".bh-tabs");
  tablist.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (!tab) return;
    setActiveTab(tab.dataset.tab);
  });
  tablist.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const idx = VALID_TABS.indexOf(state.tab);
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % VALID_TABS.length;
    if (e.key === "ArrowLeft") next = (idx - 1 + VALID_TABS.length) % VALID_TABS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = VALID_TABS.length - 1;
    setActiveTab(VALID_TABS[next], { focusTab: true });
  });

  // Connections panel delegation (WIDA toggle + Vocab lookup + Cross-subject transfer cards)
  $("#panel-connections").addEventListener("click", async (e) => {
    const widaBtn = e.target.closest("[data-wida-tier]");
    if (widaBtn) {
      const next = widaBtn.dataset.widaTier;
      if (next && next !== state.wida) {
        state.wida = next;
        syncUrl();
        renderConnectionsTab();
        renderActivitiesTab();
        renderPrintKit();
        trackTelemetry(state.unitId, state.wida, "scaffold_toggle");
        announce(`Switched to WIDA ${widaLabel(state.wida)} scaffolds.`);
      }
      return;
    }

    const vocabCard = e.target.closest("[data-vocab-word]");
    if (vocabCard) {
      const word = vocabCard.dataset.vocabWord;
      trackTelemetry(state.unitId, state.wida, "vocab_lookup");
      copyToClipboard(word);
      return;
    }

    const transferBtn = e.target.closest("[data-transfer-unit]");
    if (transferBtn) {
      const targetUnit = transferBtn.dataset.transferUnit;
      const targetGrade = transferBtn.dataset.transferGrade || state.grade;
      const targetSubject = transferBtn.dataset.transferSubject || state.subject;
      state.planMode = false;
      state.pinnedPlan = null;
      $("#pinnedPlanBanner").hidden = true;
      state.grade = String(targetGrade);
      state.subject = targetSubject;
      $("#gradeSelect").value = state.grade;
      updateSubjectLabels();
      $("#subjectSelect").value = state.subject;
      await loadUnits(targetUnit);
      $("#workspaceSection").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
  });

  // External Math Lab launch telemetry
  $("#workspaceHeaderActions")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-external-lab-launch]")) {
      trackTelemetry(state.unitId, state.wida, "lab_launch");
    }
  });

  // Activities panel delegation (Copy for Slides / LMS, Full 3-Day Playlist, Exit Ticket, Launch Student View)
  $("#panel-activities").addEventListener("click", (e) => {
    if (e.target.closest("[data-lab-launch]")) {
      trackTelemetry(state.unitId, state.wida, "lab_launch");
      return;
    }

    const playlistBtn = e.target.closest("[data-copy-playlist]");
    if (playlistBtn && state.detail?.unit) {
      const u = state.detail.unit;
      const conn = state.detail.connections?.[0] || {};
      const scaffold = extractScaffoldForTier(conn.blueprint?.scaffolds_json, state.wida);
      const acts = Array.isArray(state.detail.activities) ? state.detail.activities : [];
      const lines = [
        `BCPSS 3-Day Pre-Teaching Playlist — ${gradeLabel(u.grade)} ${u.curriculum_name || curriculumFor(u.grade, u.subject)}`,
        `Unit ${u.unit_number}: ${u.unit_title} · WIDA ${widaLabel(state.wida)}`,
        "",
        "Target Sentence Frames:",
        ...(scaffold.frames.length ? scaffold.frames.map((f) => `• ${f}`) : [conn.unit_example_frame || ""]),
        "",
        ...acts.flatMap((a, i) => [
          `--- Day ${i + 1}: ${a.title} (${a.activity_type || "Activity"} · ${a.prep_time_minutes ?? 5} min prep) ---`,
          `Teacher Instructions: ${a.teacher_instructions}`,
          `Student Prompt: ${a.student_prompt}`,
          "",
        ]),
      ];
      trackTelemetry(state.unitId, state.wida, "activity_copy");
      copyToClipboard(lines.join("\n"), playlistBtn, "Playlist Copied!");
      return;
    }

    const exitBtn = e.target.closest("[data-copy-exit-ticket]");
    if (exitBtn && state.detail?.unit) {
      const u = state.detail.unit;
      const exitTicket = safeParseJson(state.detail.connections?.[0]?.language_exit_ticket_json, null);
      if (!exitTicket) return;
      const lines = [
        `3-Minute Language Exit Ticket — Unit ${u.unit_number}: ${u.unit_title}`,
        "",
        `Prompt:\n${exitTicket.prompt || ""}`,
        "",
        ...(Array.isArray(exitTicket.look_fors) && exitTicket.look_fors.length
          ? ["Look-Fors:", ...exitTicket.look_fors.map((lf) => `• ${lf}`), ""]
          : []),
        ...(exitTicket.quick_rubric
          ? [
              "Quick Rubric:",
              `• Emerging: ${exitTicket.quick_rubric.emerging || ""}`,
              `• Developing: ${exitTicket.quick_rubric.developing || ""}`,
              `• Proficient: ${exitTicket.quick_rubric.proficient || ""}`,
            ]
          : []),
      ];
      trackTelemetry(state.unitId, state.wida, "activity_copy");
      copyToClipboard(lines.join("\n"), exitBtn, "Exit Ticket Copied!");
      return;
    }

    const copyBtn = e.target.closest("[data-copy-activity]");
    if (!copyBtn || !state.detail) return;
    const act = state.detail.activities?.[Number(copyBtn.dataset.copyActivity)];
    if (!act) return;
    const u = state.detail.unit;
    const text = [
      `BCPSS ${gradeLabel(u.grade)} ${u.curriculum_name || curriculumFor(u.grade, u.subject)} — Unit ${u.unit_number}: ${u.unit_title}`,
      `Activity: ${act.title} (${act.activity_type} · ${act.prep_time_minutes ?? 5} min prep)`,
      "",
      `Teacher Instructions:\n${act.teacher_instructions}`,
      "",
      `Student Prompt:\n${act.student_prompt}`,
    ].join("\n");
    trackTelemetry(state.unitId, state.wida, "activity_copy");
    copyToClipboard(text, copyBtn, "Copied!");
  });

  // Family Bridge panel delegation (Language preview toggle + Copy Family Link)
  $("#panel-family").addEventListener("click", (e) => {
    const langBtn = e.target.closest("[data-family-lang]");
    if (langBtn) {
      const code = langBtn.dataset.familyLang;
      if (code && code !== state.familyLang) {
        state.familyLang = code;
        renderFamilyTab();
        announce(`Switched family preview to ${FAMILY_LANGS.find((l) => l.code === code)?.label || code}.`);
      }
      return;
    }
    const copyLinkBtn = e.target.closest("[data-copy-family-link]");
    if (copyLinkBtn) {
      copyToClipboard(copyLinkBtn.dataset.copyFamilyLink || "", copyLinkBtn, "Link Copied!");
    }
  });

  // Deconstruct a Passage
  const passageInput = $("#passageInput");
  const charCounter = $("#charCounter");
  const updateCounter = () => {
    charCounter.textContent = `${passageInput.value.length.toLocaleString()} / 1,500`;
  };
  passageInput.addEventListener("input", updateCounter);

  $("#sampleMathBtn").addEventListener("click", () => {
    passageInput.value = SAMPLE_PASSAGES.math;
    updateCounter();
    passageInput.focus();
  });
  $("#sampleScienceBtn").addEventListener("click", () => {
    passageInput.value = SAMPLE_PASSAGES.science;
    updateCounter();
    passageInput.focus();
  });

  $("#deconstructForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const passage = passageInput.value.trim();
    const l1 = $("#l1Select").value;
    if (!passage) return;
    const btn = $("#deconstructSubmitBtn");
    const results = $("#deconstructResults");
    btn.disabled = true;
    btn.textContent = "Analyzing…";
    results.innerHTML = `<div class="bh-loading" role="status">Analyzing passage for ${esc(l1)} cognates, syntax traps, and WIDA frames…</div>`;
    try {
      const data = await fetchJson("/api/bcpss/deconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passage, l1 }),
      });
      state.deconstructResult = data;
      renderDeconstructResults(data);
      announce("Passage analysis complete.");
    } catch (err) {
      results.innerHTML = `<div class="bh-error" role="alert">Could not analyze passage: ${esc(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Analyze Passage";
    }
  });

  $("#deconstructResults").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy-tier]");
    if (!btn || !state.deconstructResult?.differentiated_frames) return;
    const tierKey = btn.dataset.copyTier;
    const frames = state.deconstructResult.differentiated_frames[tierKey] || [];
    if (!frames.length) return;
    copyToClipboard(frames.map((f) => `• ${f}`).join("\n"), btn, "Copied!");
  });

  // Print Classroom Kit
  $("#printKitBtn").addEventListener("click", () => {
    renderPrintKit();
    window.print();
  });

  // Share with Co-Teacher Modal
  const dialog = $("#shareDialog");
  const openShare = () => {
    if (!state.detail?.unit) return;
    const u = state.detail.unit;
    $("#shareContextSummary").textContent = `${gradeLabel(u.grade)} · ${u.curriculum_name || curriculumFor(u.grade, u.subject)} · Unit ${u.unit_number}: ${u.unit_title} · ${widaLabel(state.wida)}`;
    $("#shareResultBox").hidden = true;
    $("#shareStatusMsg").textContent = "";
    $("#teacherNoteInput").value = "";
    dialog.showModal();
    $("#teacherNoteInput").focus();
  };
  $("#sharePlanBtn").addEventListener("click", openShare);
  $("#closeShareDialogBtn").addEventListener("click", () => dialog.close());
  $("#cancelShareBtn").addEventListener("click", () => dialog.close());

  $("#saveSharePlanBtn").addEventListener("click", async () => {
    if (!state.detail?.unit) return;
    const saveBtn = $("#saveSharePlanBtn");
    const statusMsg = $("#shareStatusMsg");
    const note = $("#teacherNoteInput").value.trim();
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
    try {
      const created = await fetchJson("/api/bcpss/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit_id: state.detail.unit.id,
          wida_tier: state.wida,
          teacher_note: note,
        }),
      });
      const fullUrl = new URL(created.url || `/bcpss-teachers/plan/${created.id}`, window.location.origin).href;
      $("#shareUrlOutput").value = fullUrl;
      $("#shareResultBox").hidden = false;
      const copied = await copyToClipboard(fullUrl);
      statusMsg.textContent = copied ? "Plan saved and link copied to clipboard." : "Plan saved. Copy the link above to share.";
    } catch (err) {
      $("#shareResultBox").hidden = false;
      statusMsg.textContent = `Could not save plan: ${err.message}`;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save & Copy Link";
    }
  });

  $("#copyShareUrlBtn").addEventListener("click", (e) => {
    const val = $("#shareUrlOutput").value;
    if (val) copyToClipboard(val, e.currentTarget, "Copied!");
  });
}

// ── Boot ────────────────────────────────────────────────────────────────────

async function init() {
  bindEvents();

  // Check if URL is /bcpss-teachers/plan/{id}
  const planMatch = window.location.pathname.match(/^\/bcpss-teachers\/plan\/([^/]+)\/?$/);
  if (planMatch) {
    setActiveTab("connections");
    await loadSharedPlan(decodeURIComponent(planMatch[1]));
    return;
  }

  // Otherwise hydrate from URL query params with defaults
  const q = new URLSearchParams(window.location.search);
  const qGrade = q.get("grade");
  const qSubject = q.get("subject");
  const qUnitId = q.get("unitId") || "";
  const qWida = q.get("wida");
  const qTab = q.get("tab");

  if (qGrade && GRADES.includes(qGrade)) state.grade = qGrade;
  if (qSubject && SUBJECTS.includes(qSubject)) state.subject = qSubject;
  if (qWida && WIDA_TIERS.some((t) => t.key === qWida)) state.wida = qWida;
  if (qTab && VALID_TABS.includes(qTab)) state.tab = qTab;

  $("#gradeSelect").value = state.grade;
  updateSubjectLabels();
  $("#subjectSelect").value = state.subject;
  setActiveTab(state.tab);

  await loadUnits(qUnitId);
}

init();
