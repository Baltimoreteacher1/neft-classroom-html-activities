// BCPSS K–8 Curriculum & Language Bridge — Progressive 3-Step Workspace
import { anonTokenHeaders } from "../shared/anon-token/anon-token.js";
import { INTERNAL_TRAFFIC_FLAG } from "../shared/bcpss-telemetry-schema.js";
import { renderCreationStudio } from "./creation-studio.js";
import { keepView } from "./keep-view.js";
import { renderOverview } from "./overview-tab.js";
import { renderStudioTab } from "./studio-tab.js";
import { renderVocabReader } from "./vocab-reader.js";
import { renderQrSvg } from "./qr-svg.js";
import { renderVisualVocabStudio } from "./vocab-studio.js";

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
const SUBJECTS = ["ELA", "Math", "Science", "Social Studies"];
const KLU_FILTERS = ["All", "Narrate", "Inform", "Explain", "Argue"];
const COMFORT_STORAGE_KEY = "bcpssTeachers:v1:comfort";
const WIDA_TIERS = [
  { key: "1_2", label: "Levels 1–2", short: "Entering / Emerging" },
  { key: "3_4", label: "Levels 3–4", short: "Developing / Expanding" },
  { key: "5_6", label: "Levels 5–6", short: "Bridging / Reaching" },
];
const VALID_TABS = ["studio", "overview", "vocab", "reading", "create", "family"];
const DEFAULT_TAB = "studio";
// Old bookmarks and shared links: map retired tab names onto the v2 tabs.
const TAB_ALIASES = {
  connections: "overview",
  understand: "overview",
  activities: "studio",
  printables: "studio",
  esol: "studio",
  labs: "studio",
  vocabulary: "vocab",
  creator: "create",
  deconstruct: "family",
  evidence: "family",
};
const PUBLIC_SITE_ORIGIN = "https://thelanguagepage.com";

const SAMPLE_PASSAGES = {
  math: "A bakery uses 3 cups of flour for every 2 batches of rolls. If the baker needs to make 15 batches of rolls for a school event, determine how many cups of flour are required. Explain your reasoning using an equivalent ratio or unit rate.",
  science: "Students observed that a cup of cold water placed in a warm room formed droplets on the outside surface after ten minutes. Construct a scientific explanation describing how thermal energy transfer caused water vapor in the air to condense.",
};

const state = {
  // Blank until the teacher chooses: the hub never assumes a grade or content area.
  grade: "",
  subject: "",
  unitId: "",
  wida: "3_4",
  tab: DEFAULT_TAB,
  units: [],
  unitSearch: "",
  kluFilter: "All",
  detail: null,
  planMode: false,
  pinnedPlan: null,
  deconstructResult: null,
  familySubview: "bridge", // bridge | deconstruct | evidence
  selectorCollapsed: false,
  projectionMode: false,
  comfort: {
    largeText: false,
    highContrast: false,
    roomySpacing: false,
  },
};

// Anonymous, FERPA-safe telemetry (zero PII; fire-and-forget)
function isInternalDevice() {
  try {
    return localStorage.getItem(INTERNAL_TRAFFIC_FLAG) === "1";
  } catch {
    return false;
  }
}

function trackTelemetry(unitId, widaTier, eventType) {
  if (!unitId || !eventType) return;
  try {
    fetch("/api/bcpss/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...anonTokenHeaders() },
      body: JSON.stringify({
        unit_id: unitId,
        wida_tier: widaTier || state.wida || "3_4",
        event_type: eventType,
        ...(isInternalDevice() ? { internal: true } : {}),
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
  const el = $("#srAnnouncer") || $("#liveAnnouncer");
  if (!el) return;
  el.textContent = "";
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
}

function applyComfortPrefs() {
  const { largeText, highContrast, roomySpacing } = state.comfort;
  document.documentElement.classList.toggle("is-large-text", Boolean(largeText));
  document.body.classList.toggle("is-large-text", Boolean(largeText));
  document.body.classList.toggle("is-high-contrast", Boolean(highContrast));
  document.body.classList.toggle("is-roomy-spacing", Boolean(roomySpacing));

  const largeBtn = $("#toggleLargeTextBtn");
  const contrastBtn = $("#toggleHighContrastBtn");
  const roomyBtn = $("#toggleRoomySpacingBtn");
  if (largeBtn) largeBtn.setAttribute("aria-pressed", largeText ? "true" : "false");
  if (contrastBtn) contrastBtn.setAttribute("aria-pressed", highContrast ? "true" : "false");
  if (roomyBtn) roomyBtn.setAttribute("aria-pressed", roomySpacing ? "true" : "false");
}

function loadComfortPrefs() {
  try {
    const raw = window.localStorage.getItem(COMFORT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        state.comfort = {
          largeText: Boolean(parsed.largeText),
          highContrast: Boolean(parsed.highContrast),
          roomySpacing: Boolean(parsed.roomySpacing),
        };
      }
    }
  } catch {
    // Ignore storage access errors in restricted browsing modes
  }
  applyComfortPrefs();
}

function saveComfortPrefs() {
  try {
    window.localStorage.setItem(COMFORT_STORAGE_KEY, JSON.stringify(state.comfort));
  } catch {
    // Ignore storage write errors
  }
}

function toggleComfortPref(key) {
  if (!(key in state.comfort)) return;
  state.comfort[key] = !state.comfort[key];
  applyComfortPrefs();
  saveComfortPrefs();
  const labels = {
    largeText: "Larger text",
    highContrast: "High contrast",
    roomySpacing: "Roomy spacing",
  };
  announce(`${labels[key]} ${state.comfort[key] ? "enabled" : "disabled"}.`);
}

function curriculumFor(grade, subject) {
  if (!grade) return "";
  const isK3 = ["K", "1", "2", "3"].includes(String(grade));
  const is45 = ["4", "5"].includes(String(grade));
  if (subject === "ELA") return isK3 ? "Wit & Wisdom + Fundations" : "Wit & Wisdom";
  if (subject === "Math") return "Reveal Math";
  if (subject === "Science") return isK3 || is45 ? "SABES" : "IQWST";
  if (subject === "Social Studies") return isK3 ? "Studies Weekly" : "BCPSS Social Studies";
  return "BCPSS Curriculum";
}

function gradeLabel(grade) {
  if (!grade) return "";
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

function buildExportUrl(unitId, format, wida, extraQuery = "") {
  const base = `/api/bcpss/export/${encodeURIComponent(unitId)}?format=${encodeURIComponent(format)}&wida=${encodeURIComponent(wida || "3_4")}`;
  return extraQuery ? `${base}&${extraQuery}` : base;
}

function parseStandardsList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s || "").trim()).filter(Boolean);
  }
  return String(raw)
    .split(/[,;|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeVocab(raw) {
  const parsed = safeParseJson(raw, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (typeof item === "string") {
        return { word: item, tier: "Tier 2", definition: "", cognate: "", hint: "" };
      }
      if (!item || typeof item !== "object") return null;
      const definition = String(
        item.student_friendly_def || item.kid_def || item.definition || item.note || "",
      ).trim();
      const cognateRaw =
        item.cognate_hint ||
        (item.cognate_es ? `Spanish cognate: ${item.cognate_es}` : "") ||
        item.cognate ||
        item.es_cognate ||
        "";
      const cognate = String(cognateRaw).trim();
      const hint = [definition, cognate].filter(Boolean).join(" · ");
      return {
        word: item.word || item.term || "",
        tier: item.tier
          ? String(item.tier).toLowerCase().startsWith("tier")
            ? String(item.tier)
            : `Tier ${item.tier}`
          : "Tier 2",
        definition,
        cognate,
        hint,
      };
    })
    .filter((v) => v?.word);
}

function normalizePublisherMeta(unit) {
  const raw = safeParseJson(unit?.publisher_meta, null);
  if (raw && typeof raw === "object") {
    return {
      publisher_imprint: String(raw.publisher_imprint || "").trim(),
      grade_band: String(raw.grade_band || "").trim(),
      signature_protocol: String(raw.signature_protocol || "").trim(),
    };
  }
  return {
    publisher_imprint: "",
    grade_band: "",
    signature_protocol: "",
  };
}

function setProjectionMode(enabled) {
  state.projectionMode = Boolean(enabled);
  document.body.classList.toggle("is-projection-mode", state.projectionMode);
  const btn = $("#projectionModeBtn");
  if (btn) {
    btn.setAttribute("aria-pressed", state.projectionMode ? "true" : "false");
    const span = btn.querySelector("span");
    if (span) span.textContent = state.projectionMode ? "Exit Projection Mode" : "Project to Board";
  }
  const bar = $("#projectionExitBar");
  if (bar) {
    bar.hidden = !state.projectionMode;
  }
  announce(
    state.projectionMode
      ? "Classroom Projection Mode enabled. High-contrast smartboard view active."
      : "Exited Classroom Projection Mode.",
  );
}

/** The API returns blueprint fields flat on each connection (no nested `blueprint`). */
function blueprintOf(conn) {
  if (!conn) return {};
  if (conn.blueprint && typeof conn.blueprint === "object" && conn.blueprint.scaffolds_json) return conn.blueprint;
  return {
    ...(conn.blueprint || {}),
    id: conn.blueprint_id,
    wida_klu: conn.wida_klu,
    move_name: conn.move_name,
    syntax_pattern: conn.syntax_pattern,
    scaffolds_json: conn.scaffolds_json,
  };
}

function applyWidaTier(next) {
  if (!next || next === state.wida || !WIDA_TIERS.some((t) => t.key === next)) return;
  state.wida = next;
  syncUrl();
  syncSummaryBar();
  // Panels redraw at once; keep the reader exactly where they were.
  keepView($("#mainContent"), () => {
    renderResourceExportBar();
    renderTabPanels();
  });
  trackTelemetry(state.unitId, state.wida, "scaffold_toggle");
  announce(`Switched to WIDA ${widaLabel(state.wida)} scaffolds.`);
}

function syncSummaryBar() {
  const bar = $("#selectedUnitSummaryBar");
  const textEl = $("#selectedUnitSummaryText");
  const shell = $("#unitSelectorShell");
  const toggleBtn = $("#changeUnitToggleBtn");
  const u = state.detail?.unit;
  if (!bar || !shell) return;

  if (!u) {
    bar.hidden = true;
    shell.classList.remove("is-collapsed");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    return;
  }

  bar.hidden = false;
  const customizeLink = $("#customizeActivityLink");
  if (customizeLink && state.unitId) {
    customizeLink.href = `/access-practice-lab/activity-studio/customize?family=bcpss-unit&ref=${encodeURIComponent(state.unitId)}&band=${encodeURIComponent(state.wida)}`;
  }
  if (textEl) {
    textEl.textContent = `${gradeLabel(u.grade)} · ${u.subject} · Unit ${u.unit_number}: ${u.unit_title}`;
  }
  shell.classList.toggle("is-collapsed", Boolean(state.selectorCollapsed));
  if (toggleBtn) {
    toggleBtn.setAttribute("aria-expanded", state.selectorCollapsed ? "false" : "true");
    toggleBtn.textContent = state.selectorCollapsed ? "Change Unit" : "Hide Unit Picker";
  }
  for (const btn of bar.querySelectorAll("[data-quick-wida]")) {
    btn.setAttribute("aria-pressed", btn.dataset.quickWida === state.wida ? "true" : "false");
  }
}

function syncUrl() {
  if (state.planMode) return;
  const url = new URL(window.location.href);
  url.pathname = "/bcpss-teachers";
  for (const key of ["grade", "subject"]) {
    if (state[key]) url.searchParams.set(key, state[key]);
    else url.searchParams.delete(key);
  }
  if (state.unitId) {
    url.searchParams.set("unit", state.unitId);
    url.searchParams.delete("unitId");
  } else {
    url.searchParams.delete("unit");
    url.searchParams.delete("unitId");
  }
  url.searchParams.set("wida", state.wida);
  url.searchParams.set("tab", state.tab === "family" && state.familySubview === "deconstruct" ? "deconstruct" : state.tab);
  history.replaceState(null, "", url.pathname + url.search);
}

function updateSubjectLabels() {
  const gradeSelect = $("#gradeSelect");
  if (gradeSelect) gradeSelect.value = state.grade;

  const select = $("#subjectSelect");
  if (select) {
    for (const opt of select.options) {
      const subj = opt.value;
      if (!subj) continue;
      const curriculum = curriculumFor(state.grade, subj);
      opt.textContent = curriculum ? `${subj} (${curriculum})` : subj;
    }
    select.value = state.subject;
  }

  for (const btn of document.querySelectorAll("#gradeRibbon [data-grade]")) {
    const isActive = btn.dataset.grade === String(state.grade);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  }

  for (const btn of document.querySelectorAll("#subjectPills [data-subject]")) {
    const subj = btn.dataset.subject;
    const isActive = subj === state.subject;
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    const subEl = btn.querySelector("[data-subject-sub]");
    if (subEl) {
      subEl.textContent = curriculumFor(state.grade, subj) || DEFAULT_SUBJECT_SUB[subj] || "";
    }
  }

  const badge = $("#curriculumBadge");
  if (badge) {
    badge.textContent = hasSelection()
      ? `${curriculumFor(state.grade, state.subject)} · ${gradeLabel(state.grade)}`
      : "Choose a grade and content area";
  }
}

function syncUnitFilterUi() {
  const input = $("#unitSearchInput");
  const clearBtn = $("#unitSearchClearBtn");
  if (input && input.value !== state.unitSearch) {
    input.value = state.unitSearch;
  }
  if (clearBtn) {
    clearBtn.hidden = !state.unitSearch;
  }
  for (const btn of document.querySelectorAll("#kluFilterBar [data-klu-filter]")) {
    btn.setAttribute("aria-pressed", btn.dataset.kluFilter === state.kluFilter ? "true" : "false");
  }
}

function resetUnitFilters() {
  state.unitSearch = "";
  state.kluFilter = "All";
  syncUnitFilterUi();
}

function getFilteredUnits() {
  const query = state.unitSearch.trim().toLowerCase();
  const klu = state.kluFilter;
  return state.units.filter((u) => {
    if (klu && klu !== "All") {
      const unitKlu = String(u.primary_klu || "").toLowerCase();
      if (!unitKlu.includes(klu.toLowerCase())) return false;
    }
    if (!query) return true;
    const standards = parseStandardsList(u.core_standards).join(" ");
    const haystack = [
      `unit ${u.unit_number}`,
      u.unit_title,
      u.unit_summary,
      u.essential_question,
      u.primary_klu,
      u.curriculum_name,
      standards,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
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
  if (!hasSelection()) {
    showSelectionPrompt();
    return;
  }
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

async function selectUnit(unitId, { skipFetchIfLoaded = false, userInitiated = false } = {}) {
  state.unitId = unitId;
  renderUnitStrip();
  syncUrl();
  if (skipFetchIfLoaded && state.detail?.unit?.id === unitId) {
    renderWorkspace();
    if (userInitiated) {
      focusAndAnnounceWorkspace(state.detail.unit);
    }
    return;
  }
  $("#panel-studio").innerHTML = `<div class="bh-loading" role="status">Loading Language Studio…</div>`;
  $("#panel-overview").innerHTML = `<div class="bh-loading" role="status">Loading unit overview…</div>`;
  $("#panel-vocab").innerHTML = `<div class="bh-loading" role="status">Loading Visual Vocabulary Studio…</div>`;
  $("#panel-reading").innerHTML = `<div class="bh-loading" role="status">Loading vocabulary reading…</div>`;
  $("#panel-create").innerHTML = `<div class="bh-loading" role="status">Loading Teacher Creation Studio…</div>`;
  try {
    const detail = await fetchJson(`/api/bcpss/units/${encodeURIComponent(unitId)}`);
    state.detail = detail;
    state.selectorCollapsed = true;
    renderWorkspace();
    if (userInitiated && detail?.unit) {
      focusAndAnnounceWorkspace(detail.unit);
    }
  } catch (err) {
    const errHtml = `<div class="bh-error" role="alert">Unable to load unit details: ${esc(err.message)}</div>`;
    for (const tab of ["studio", "overview", "vocab", "reading", "create"]) {
      $(`#panel-${tab}`).innerHTML = errHtml;
    }
  }
}

/** Open any unit by id (cross-subject transfer): switch grade and subject first when it lives elsewhere. */
async function openUnitById(unitId) {
  if (!unitId) return;
  state.planMode = false;
  state.pinnedPlan = null;
  $("#pinnedPlanBanner").hidden = true;
  if (state.units.some((u) => u.id === unitId)) {
    await selectUnit(unitId, { skipFetchIfLoaded: unitId === state.unitId, userInitiated: true });
    return;
  }
  try {
    const target = await fetchJson(`/api/bcpss/units/${encodeURIComponent(unitId)}`);
    if (!target?.unit) return;
    state.grade = String(target.unit.grade);
    state.subject = target.unit.subject;
    resetUnitFilters();
    updateSubjectLabels();
    await loadUnits(unitId);
    $("#workspaceSection").scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  } catch (err) {
    announce(`Could not open that unit: ${err.message}`);
  }
}

function focusAndAnnounceWorkspace(u) {
  if (!u) return;
  const ws = $("#workspaceSection");
  if (ws) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ws.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  }
  const titleEl = $("#workspaceTitle");
  if (titleEl) {
    titleEl.focus({ preventScroll: true });
  }
  announce(`Loaded ${gradeLabel(u.grade)} ${u.subject} Unit ${u.unit_number}: ${u.unit_title}`);
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

function renderUnitStrip({ announceCount = false } = {}) {
  const strip = $("#unitStrip");
  const countEl = $("#unitsCount");
  const total = state.units.length;
  const filtered = getFilteredUnits();
  const countText = total
    ? `Showing ${filtered.length} of ${total} unit${total === 1 ? "" : "s"}`
    : "0 units";

  if (countEl) {
    countEl.textContent = countText;
  }
  if (announceCount) {
    announce(countText);
  }

  if (!total) {
    strip.innerHTML = `<div class="bh-empty">No units found for ${esc(gradeLabel(state.grade))} ${esc(state.subject)}.</div>`;
    return;
  }
  if (!filtered.length) {
    strip.innerHTML = `
      <div class="bh-empty bh-filter-empty">
        <span>No units match the current search or WIDA KLU filter.</span>
        <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-clear-unit-filters>
          Clear filters
        </button>
      </div>
    `;
    return;
  }

  strip.innerHTML = filtered
    .map((u) => {
      const active = u.id === state.unitId;
      const preview = String(u.essential_question || u.unit_summary || "").trim();
      const actCount = Number(u.activity_count) > 0 ? Number(u.activity_count) : 5;
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
          ${
            preview
              ? `<p class="bh-unit-preview">${esc(preview)}</p>`
              : `<div class="bh-unit-curric">${esc(u.curriculum_name || curriculumFor(u.grade, u.subject))}</div>`
          }
          <div class="bh-unit-footer">
            <span class="bh-unit-footer-count">${actCount} Activities</span>
            <span class="bh-unit-footer-sep" aria-hidden="true">·</span>
            <span class="fmt-pill fmt-pill-html">HTML</span>
            <span class="fmt-pill fmt-pill-pdf">PDF</span>
            <span class="fmt-pill fmt-pill-docx">DOCX</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderResourceExportBar() {
  const bar = $("#resourceExportBar");
  const u = state.detail?.unit;
  if (!bar) return;
  if (!u) {
    bar.hidden = true;
    bar.innerHTML = "";
    return;
  }
  const viewHtmlUrl = buildExportUrl(u.id, "html", state.wida, "part=packet");
  const pdfUrl = buildExportUrl(u.id, "pdf", state.wida, "part=packet");
  const docxUrl = buildExportUrl(u.id, "docx", state.wida, "part=packet");
  const downloadHtmlUrl = buildExportUrl(u.id, "html", state.wida, "part=packet&download=1");

  bar.hidden = false;
  bar.innerHTML = `
    <div class="resource-export-head">
      <div class="resource-export-copy">
        <span class="resource-export-kicker">Complete Unit Resource Pack</span>
        <span class="resource-export-sub">
          Unit ${esc(u.unit_number)} · Tailored to <strong>WIDA ${esc(widaLabel(state.wida))}</strong>
        </span>
      </div>
      <div class="resource-export-badges" aria-hidden="true">
        <span class="fmt-pill fmt-pill-html">HTML</span>
        <span class="fmt-pill fmt-pill-pdf">PDF</span>
        <span class="fmt-pill fmt-pill-docx">DOCX</span>
      </div>
    </div>
    <div class="resource-export-actions">
      <a
        class="bh-btn bh-btn-primary bh-btn-sm"
        href="${esc(viewHtmlUrl)}"
        target="_blank"
        rel="noopener"
        data-export-download="html-view"
      >
        <span>View HTML Packet ↗</span>
      </a>
      <a
        class="bh-btn bh-btn-secondary bh-btn-sm"
        href="${esc(pdfUrl)}"
        download
        data-export-download="pdf"
      >
        <span>Download PDF</span>
      </a>
      <a
        class="bh-btn bh-btn-secondary bh-btn-sm"
        href="${esc(docxUrl)}"
        download
        data-export-download="docx"
      >
        <span>Download Word (.docx)</span>
      </a>
      <a
        class="bh-btn bh-btn-ghost bh-btn-sm"
        href="${esc(downloadHtmlUrl)}"
        download
        data-export-download="html"
      >
        <span>Download HTML</span>
      </a>
      <button
        type="button"
        class="bh-btn bh-btn-ghost bh-btn-sm"
        data-quick-print-kit
      >
        <span>Quick Print Kit</span>
      </button>
    </div>
  `;
}

const hasSelection = () => Boolean(state.grade && state.subject);

// Shown under the subject pills before a grade is chosen (the curriculum name depends on the grade).
const DEFAULT_SUBJECT_SUB = {
  ELA: "Wit & Wisdom",
  Math: "Reveal Math",
  Science: "SABES · IQWST",
  "Social Studies": "Studies Weekly · BCPSS",
};

function selectionAnnouncement() {
  if (hasSelection()) return `Selected ${gradeLabel(state.grade)} ${state.subject}.`;
  return state.grade
    ? `Selected ${gradeLabel(state.grade)}. Now choose a content area.`
    : `Selected ${state.subject}. Now choose a grade.`;
}

/** Nothing is loaded until a grade and a content area are both chosen. */
function showSelectionPrompt() {
  state.units = [];
  state.unitId = "";
  state.detail = null;
  const need = [state.grade ? "" : "a grade", state.subject ? "" : "a content area"].filter(Boolean).join(" and ");
  $("#unitStrip").innerHTML = `<div class="bh-empty">Choose ${need} above to see its units.</div>`;
  const countEl = $("#unitsCount");
  if (countEl) countEl.textContent = "";
  syncUrl();
  renderEmptyWorkspace();
}

function renderEmptyWorkspace() {
  $("#workspaceTitle").textContent = "No unit selected";
  $("#workspaceMeta").textContent = "";
  const mastheadEl = $("#workspacePublisherMasthead");
  if (mastheadEl) {
    mastheadEl.hidden = true;
    mastheadEl.innerHTML = "";
  }
  const summaryEl = $("#workspaceSummary");
  if (summaryEl) {
    summaryEl.hidden = true;
    summaryEl.textContent = "";
  }
  const eqEl = $("#workspaceEssentialQ");
  if (eqEl) {
    eqEl.hidden = true;
    eqEl.innerHTML = "";
  }
  const stdEl = $("#workspaceStandards");
  if (stdEl) {
    stdEl.hidden = true;
    stdEl.innerHTML = "";
  }
  const headerActions = $("#workspaceHeaderActions");
  if (headerActions) {
    headerActions.hidden = true;
  }
  const projBtn = $("#projectionModeBtn");
  if (projBtn) projBtn.disabled = true;
  const extSlot = $("#workspaceExternalLabSlot");
  if (extSlot) extSlot.innerHTML = "";
  renderResourceExportBar();
  $("#printKitBtn").disabled = true;
  $("#sharePlanBtn").disabled = true;
  const emptyPanels = {
    studio: "launch the Language Studio",
    overview: "see the unit overview",
    vocab: "open the Visual Vocabulary Studio",
    reading: "open the vocabulary reading",
    create: "open the Teacher Creation Studio",
  };
  for (const [tab, goal] of Object.entries(emptyPanels)) {
    $(`#panel-${tab}`).innerHTML = `<div class="bh-empty">Choose a grade and content area above to ${goal}.</div>`;
  }
  const bridgeSub = $("#familyBridgeSubview");
  if (bridgeSub) bridgeSub.innerHTML = `<div class="bh-empty">Choose a grade and content area above to view the family bridge card.</div>`;
  const evSub = $("#familyEvidenceSubview");
  if (evSub) evSub.innerHTML = `<div class="bh-empty">Choose a unit above to view formative evidence and next-step recommendations.</div>`;
  syncSummaryBar();
}

function renderWorkspace() {
  const detail = state.detail;
  if (!detail?.unit) {
    renderEmptyWorkspace();
    return;
  }
  const u = detail.unit;
  $("#workspaceTitle").textContent = `Unit ${u.unit_number}: ${u.unit_title}`;
  $("#workspaceMeta").textContent = `${gradeLabel(u.grade)} · ${u.curriculum_name || curriculumFor(u.grade, u.subject)}${u.primary_klu ? ` · WIDA KLU: ${u.primary_klu}` : ""}`;

  const mastheadEl = $("#workspacePublisherMasthead");
  if (mastheadEl) {
    const pub = normalizePublisherMeta(u);
    const imprint = pub.publisher_imprint || u.curriculum_name || curriculumFor(u.grade, u.subject);
    const badges = [
      imprint
        ? `<span class="bh-pub-badge bh-pub-imprint">${esc(imprint)}</span>`
        : "",
      pub.grade_band
        ? `<span class="bh-pub-badge bh-pub-band">${esc(pub.grade_band)}</span>`
        : "",
      pub.signature_protocol
        ? `<span class="bh-pub-badge bh-pub-protocol">Protocol: ${esc(pub.signature_protocol)}</span>`
        : "",
    ].filter(Boolean);
    if (badges.length) {
      mastheadEl.hidden = false;
      mastheadEl.innerHTML = badges.join("");
    } else {
      mastheadEl.hidden = true;
      mastheadEl.innerHTML = "";
    }
  }

  const summaryEl = $("#workspaceSummary");
  if (summaryEl) {
    const summaryText = String(u.unit_summary || "").trim();
    if (summaryText) {
      summaryEl.hidden = false;
      summaryEl.textContent = summaryText;
    } else {
      summaryEl.hidden = true;
      summaryEl.textContent = "";
    }
  }

  const eqEl = $("#workspaceEssentialQ");
  if (eqEl) {
    const eqText = String(u.essential_question || "").trim();
    if (eqText) {
      eqEl.hidden = false;
      eqEl.innerHTML = `
        <span class="bh-eq-label">Essential Question</span>
        <p class="bh-eq-text">${esc(eqText)}</p>
      `;
    } else {
      eqEl.hidden = true;
      eqEl.innerHTML = "";
    }
  }

  const stdEl = $("#workspaceStandards");
  if (stdEl) {
    const standardsList = parseStandardsList(u.core_standards);
    if (standardsList.length) {
      stdEl.hidden = false;
      stdEl.innerHTML = `
        <span class="bh-standards-label">Core Standards</span>
        ${standardsList.map((code) => `<span class="bh-standard-chip">${esc(code)}</span>`).join("")}
      `;
    } else {
      stdEl.hidden = true;
      stdEl.innerHTML = "";
    }
  }

  const headerActions = $("#workspaceHeaderActions");
  const projBtn = $("#projectionModeBtn");
  const extSlot = $("#workspaceExternalLabSlot");
  if (headerActions) {
    headerActions.hidden = false;
  }
  if (projBtn) {
    projBtn.disabled = false;
  }
  if (extSlot) {
    if (u.external_content_lab_url) {
      extSlot.innerHTML = `
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
      extSlot.innerHTML = "";
    }
  }

  renderResourceExportBar();
  syncSummaryBar();
  $("#printKitBtn").disabled = false;
  $("#sharePlanBtn").disabled = false;

  renderTabPanels();
}

function renderTabPanels() {
  const { detail, wida } = state;
  renderStudioTab($("#panel-studio"), { detail, wida });
  renderOverview($("#panel-overview"), { detail, wida });
  renderVocabTab();
  renderReadingTab();
  renderCreateTab();
  renderFamilyTab();
  renderPrintKit();
}

function renderVocabTab() {
  const panel = $("#panel-vocab");
  if (!panel) return;
  const detail = state.detail;
  const unit = detail?.unit || null;
  const conn = detail?.connections?.[0] || null;
  renderVisualVocabStudio(panel, {
    unit,
    connection: conn,
    blueprint: conn?.blueprint || {},
    wida: state.wida,
    provenance: detail?.provenance || null,
    onTelemetry: (eventType) => trackTelemetry(state.unitId, state.wida, eventType),
  });
}

function renderCreateTab() {
  const panel = $("#panel-create");
  if (!panel) return;
  const detail = state.detail;
  const unit = detail?.unit || null;
  const conn = detail?.connections?.[0] || null;
  renderCreationStudio(panel, {
    unit,
    connection: conn,
    blueprint: conn?.blueprint || {},
    wida: state.wida,
    onSharePlan: () => $("#sharePlanBtn")?.click(),
    onTelemetry: (eventType) => trackTelemetry(state.unitId, state.wida, eventType),
  });
}

function renderReadingTab() {
  const conn = state.detail?.connections?.[0];
  const rawVocab = safeParseJson(conn?.tier2_tier3_vocab, []);
  const vocab = (Array.isArray(rawVocab) ? rawVocab : [])
    .map((v) => ({
      term: String(v?.term || v?.word || "").trim(),
      def: String(v?.student_friendly_def || v?.kid_def || "").trim(),
      cognate: String(v?.cognate_es || "").trim(),
    }))
    .filter((v) => v.term);
  renderVocabReader($("#panel-reading"), {
    unit: state.detail?.unit || null,
    reading: state.detail?.reading || null,
    vocab,
    frame: conn?.unit_example_frame || "",
    wida: state.wida,
    onTelemetry: (eventType) => trackTelemetry(state.unitId, state.wida, eventType),
  });
}

function setFamilySubview(subview) {
  const valid = ["bridge", "deconstruct", "evidence"];
  state.familySubview = valid.includes(subview) ? subview : "bridge";
  for (const btn of document.querySelectorAll("[data-family-subview]")) {
    btn.setAttribute("aria-pressed", btn.dataset.familySubview === state.familySubview ? "true" : "false");
  }
  const bridge = $("#familyBridgeSubview");
  const deconstruct = $("#familyDeconstructSubview");
  const evidence = $("#familyEvidenceSubview");
  if (bridge) bridge.hidden = state.familySubview !== "bridge";
  if (deconstruct) deconstruct.hidden = state.familySubview !== "deconstruct";
  if (evidence) evidence.hidden = state.familySubview !== "evidence";
  syncUrl();
}

function renderEvidenceSubview() {
  const box = $("#familyEvidenceSubview");
  if (!box) return;
  const u = state.detail?.unit;
  const conn = state.detail?.connections?.[0] || {};
  const bp = conn.blueprint || {};
  const vocab = normalizeVocab(conn.tier2_tier3_vocab);
  if (!u) {
    box.innerHTML = `<div class="bh-empty">Choose a unit above to review formative evidence look-fors and next steps.</div>`;
    return;
  }
  const klu = bp.wida_klu || u.primary_klu || "Explain";
  box.innerHTML = `
    <div class="bh-evidence-banner" role="note">
      Demonstration Classroom Snapshot — No live student telemetry is connected. Use these formative look-fors during live classroom observation; never substitute them for official WIDA ACCESS scores.
    </div>
    <div class="bh-evidence-grid">
      <article class="bh-evidence-card">
        <span class="bh-flow-tag">Formative Focus · ${esc(klu)}</span>
        <h4 style="margin:0">What to Listen &amp; Look For</h4>
        <p style="margin:0;color:var(--text-secondary)">
          Listen for students pairing <strong>${esc(vocab[0]?.word || u.subject)}</strong> with a clear WIDA ${esc(klu)} connector while explaining ${esc(u.unit_title)}.
        </p>
      </article>
      <article class="bh-evidence-card">
        <span class="bh-flow-tag">Small-Group Re-Teach Move</span>
        <h4 style="margin:0">If Students Drop Reasoning</h4>
        <p style="margin:0;color:var(--text-secondary)">
          Open the <strong>Misconception Detective</strong> lab for 5 minutes, rehearse one frame orally, then have partners revise a single sentence.
        </p>
      </article>
      <article class="bh-evidence-card">
        <span class="bh-flow-tag">Home-School Connection</span>
        <h4 style="margin:0">Reinforce in Home Language</h4>
        <p style="margin:0;color:var(--text-secondary)">
          Share the bilingual EN/ES Family Bridge card so families discuss ${esc(u.unit_title)} concepts in their strongest language.
        </p>
      </article>
    </div>
  `;
}

function renderFamilyTab() {
  const panel = $("#familyBridgeSubview");
  const unit = state.detail?.unit;
  setFamilySubview(state.familySubview);
  renderEvidenceSubview();
  if (!panel) return;
  if (!unit) {
    panel.innerHTML = `<div class="bh-empty">Choose a unit above to open the family guide.</div>`;
    return;
  }
  const guidePath = `/family/bcpss/?unit=${encodeURIComponent(unit.id)}`;
  const familyUrl = `${PUBLIC_SITE_ORIGIN}${guidePath}`;
  const pdfPacketUrl = buildExportUrl(unit.id, "pdf", state.wida, "part=packet");
  const qrSvg = renderQrSvg(familyUrl, { sizePx: 168, label: `QR code for ${familyUrl}` });

  panel.innerHTML = `
    <div class="bh-family-layout">
      <section class="bh-family-guide" aria-labelledby="familyGuideH">
        <span class="bh-klu-pill bh-klu-inform">${esc(gradeLabel(unit.grade))} · ${esc(unit.curriculum_name || curriculumFor(unit.grade, unit.subject))}</span>
        <h3 id="familyGuideH">Family guide for Unit ${esc(unit.unit_number)}: ${esc(unit.unit_title)}</h3>
        <p>Families get the unit words, dinner-table questions, and home-language support in English and Spanish, on one page that works on any phone.</p>
        <a class="bh-btn bh-btn-primary bh-family-guide-cta" href="${esc(guidePath)}" target="_blank" rel="noopener">
          Open the full family guide ↗
        </a>
      </section>

      <aside class="bh-family-share-card" aria-label="Share with families">
        <h4 style="margin:0;font:600 1.1rem/1.2 var(--font-display)">Scan or Share Home Card</h4>
        <div class="bh-qr-frame">${qrSvg}</div>
        <p class="bh-family-url">${esc(familyUrl)}</p>
        <div class="bh-family-share-actions">
          <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-copy-family-link="${esc(familyUrl)}">
            Copy Family Link
          </button>
          <a class="bh-btn bh-btn-ghost bh-btn-sm" href="${esc(pdfPacketUrl)}" download data-export-download="pdf">
            Download Printable Packet (PDF)
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
  const bp = blueprintOf(conn);
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
  let resolved = String(tabName || "").toLowerCase();
  if (resolved === "deconstruct") {
    state.familySubview = "deconstruct";
    resolved = "family";
  } else if (resolved === "evidence") {
    state.familySubview = "evidence";
    resolved = "family";
  } else if (TAB_ALIASES[resolved]) {
    resolved = TAB_ALIASES[resolved];
  }
  if (!VALID_TABS.includes(resolved)) resolved = DEFAULT_TAB;
  state.tab = resolved;
  for (const name of VALID_TABS) {
    const btn = $(`#tab-${name}`);
    const panel = $(`#panel-${name}`);
    const isSelected = name === resolved;
    if (btn) {
      btn.setAttribute("aria-selected", isSelected ? "true" : "false");
      btn.tabIndex = isSelected ? 0 : -1;
      if (focusTab && isSelected) btn.focus();
    }
    if (panel) {
      panel.hidden = !isSelected;
    }
  }
  if (resolved === "family") {
    setFamilySubview(state.familySubview);
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

  const toFrameList = (entry) =>
    Array.isArray(entry) ? entry : Array.isArray(entry?.frames) ? entry.frames : [];
  const tiers = [
    { key: "level_1_2", label: "WIDA Levels 1–2", items: toFrameList(diff.level_1_2) },
    { key: "level_3_4", label: "WIDA Levels 3–4", items: toFrameList(diff.level_3_4) },
    { key: "level_5_6", label: "WIDA Levels 5–6", items: toFrameList(diff.level_5_6) },
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

function moveHorizontalFocus(container, selector, e, onSelect) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
  const items = Array.from(container.querySelectorAll(selector));
  if (!items.length) return;
  const current = e.target.closest(selector);
  const idx = current ? items.indexOf(current) : -1;
  if (idx < 0) return;
  e.preventDefault();
  let next = idx;
  if (e.key === "ArrowRight") next = (idx + 1) % items.length;
  if (e.key === "ArrowLeft") next = (idx - 1 + items.length) % items.length;
  if (e.key === "Home") next = 0;
  if (e.key === "End") next = items.length - 1;
  const target = items[next];
  if (target) {
    target.focus();
    if (typeof onSelect === "function") onSelect(target);
  }
}

function selectGrade(nextGrade) {
  if (!GRADES.includes(String(nextGrade))) return;
  state.planMode = false;
  state.pinnedPlan = null;
  $("#pinnedPlanBanner").hidden = true;
  state.grade = String(nextGrade);
  resetUnitFilters();
  updateSubjectLabels();
  loadUnits();
  announce(selectionAnnouncement());
}

function selectSubject(nextSubject) {
  if (!SUBJECTS.includes(nextSubject)) return;
  state.planMode = false;
  state.pinnedPlan = null;
  $("#pinnedPlanBanner").hidden = true;
  state.subject = nextSubject;
  resetUnitFilters();
  updateSubjectLabels();
  loadUnits();
  announce(selectionAnnouncement());
}

function bindEvents() {
  // Reading Comfort & Display Popover
  $(".bh-comfort-popover")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-comfort]");
    if (!btn) return;
    toggleComfortPref(btn.dataset.comfort);
  });

  // Compact Active Unit Summary Bar: Change Unit toggle + Quick WIDA switcher
  $("#changeUnitToggleBtn")?.addEventListener("click", () => {
    state.selectorCollapsed = !state.selectorCollapsed;
    syncSummaryBar();
    if (!state.selectorCollapsed) {
      $("#gradeRibbon [data-grade]")?.focus();
    }
  });
  $("#selectedUnitSummaryBar")?.addEventListener("click", (e) => {
    const quickWida = e.target.closest("[data-quick-wida]");
    if (quickWida) {
      applyWidaTier(quickWida.dataset.quickWida);
    }
  });

  // Creation Studio Preview Dialog
  const creationDlg = $("#creationPreviewDialog");
  $("#closeCreationPreviewBtn")?.addEventListener("click", () => creationDlg?.close());
  $("#creationPreviewDoneBtn")?.addEventListener("click", () => creationDlg?.close());
  $("#creationPreviewPrintBtn")?.addEventListener("click", () => window.print());
  creationDlg?.addEventListener("click", (e) => {
    if (e.target === creationDlg) creationDlg.close();
  });

  // Step 1: 1-Click Grade Ribbon + Arrow key navigation
  const gradeRibbon = $("#gradeRibbon");
  gradeRibbon?.addEventListener("click", (e) => {
    const pill = e.target.closest("[data-grade]");
    if (!pill || pill.dataset.grade === state.grade) return;
    selectGrade(pill.dataset.grade);
  });
  gradeRibbon?.addEventListener("keydown", (e) => {
    moveHorizontalFocus(gradeRibbon, "[data-grade]", e);
  });

  // Step 2: 1-Click Subject Pill Tabs + Arrow key navigation
  const subjectPills = $("#subjectPills");
  subjectPills?.addEventListener("click", (e) => {
    const pill = e.target.closest("[data-subject]");
    if (!pill || pill.dataset.subject === state.subject) return;
    selectSubject(pill.dataset.subject);
  });
  subjectPills?.addEventListener("keydown", (e) => {
    moveHorizontalFocus(subjectPills, "[data-subject]", e);
  });

  // Hidden backward-compatible selects
  $("#gradeSelect")?.addEventListener("change", (e) => {
    if (e.target.value) selectGrade(e.target.value);
  });
  $("#subjectSelect")?.addEventListener("change", (e) => {
    if (e.target.value) selectSubject(e.target.value);
  });

  // Unit Search & WIDA KLU Filter Strip
  const unitSearchInput = $("#unitSearchInput");
  const unitSearchClearBtn = $("#unitSearchClearBtn");
  unitSearchInput?.addEventListener("input", () => {
    state.unitSearch = unitSearchInput.value;
    if (unitSearchClearBtn) unitSearchClearBtn.hidden = !state.unitSearch;
    renderUnitStrip({ announceCount: true });
  });
  unitSearchClearBtn?.addEventListener("click", () => {
    state.unitSearch = "";
    syncUnitFilterUi();
    renderUnitStrip({ announceCount: true });
    unitSearchInput?.focus();
  });

  const kluFilterBar = $("#kluFilterBar");
  kluFilterBar?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-klu-filter]");
    if (!btn) return;
    const nextKlu = btn.dataset.kluFilter;
    if (!KLU_FILTERS.includes(nextKlu) || nextKlu === state.kluFilter) return;
    state.kluFilter = nextKlu;
    syncUnitFilterUi();
    renderUnitStrip({ announceCount: true });
  });
  kluFilterBar?.addEventListener("keydown", (e) => {
    moveHorizontalFocus(kluFilterBar, "[data-klu-filter]", e);
  });

  // Unit Cards click + Clear filters + ArrowLeft/ArrowRight navigation
  const unitStrip = $("#unitStrip");
  unitStrip.addEventListener("click", (e) => {
    if (e.target.closest("[data-clear-unit-filters]")) {
      resetUnitFilters();
      renderUnitStrip({ announceCount: true });
      $("#unitSearchInput")?.focus();
      return;
    }
    const card = e.target.closest("[data-unit-id]");
    if (!card) return;
    const id = card.dataset.unitId;
    if (!id) return;
    state.planMode = false;
    selectUnit(id, { skipFetchIfLoaded: id === state.unitId, userInitiated: true });
  });
  unitStrip.addEventListener("keydown", (e) => {
    moveHorizontalFocus(unitStrip, ".bh-unit-card", e);
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

  // Overview panel: jump to another tab, or open another unit (cross-subject transfer)
  $("#panel-overview").addEventListener("click", (e) => {
    const tabBtn = e.target.closest("[data-ov-tab]");
    if (tabBtn) {
      setActiveTab(tabBtn.dataset.ovTab, { focusTab: true });
      return;
    }
    const unitBtn = e.target.closest("[data-ov-unit]");
    if (unitBtn) openUnitById(unitBtn.dataset.ovUnit);
  });

  // Classroom Projection Mode toggle + Exit button + Escape key
  $("#projectionModeBtn")?.addEventListener("click", () => {
    setProjectionMode(!state.projectionMode);
    if (state.projectionMode) {
      trackTelemetry(state.unitId, state.wida, "projection_mode");
    }
  });
  $("#exitProjectionBtn")?.addEventListener("click", () => {
    setProjectionMode(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.projectionMode && !$("#shareDialog")?.open) {
      setProjectionMode(false);
    }
  });

  // Resource Export Bar telemetry + Quick Print Kit trigger
  $("#resourceExportBar")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-export-download]")) {
      trackTelemetry(state.unitId, state.wida, "activity_copy");
      return;
    }
    if (e.target.closest("[data-quick-print-kit]")) {
      trackTelemetry(state.unitId, state.wida, "activity_copy");
      renderPrintKit();
      window.print();
    }
  });

  // External Math Lab launch telemetry
  $("#workspaceHeaderActions")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-external-lab-launch]")) {
      trackTelemetry(state.unitId, state.wida, "lab_launch");
    }
  });

  // Family & Evidence panel delegation (Subview tabs + Language preview toggle + Copy Family Link + PDF Download)
  $("#panel-family").addEventListener("click", (e) => {
    const subBtn = e.target.closest("[data-family-subview]");
    if (subBtn) {
      setFamilySubview(subBtn.dataset.familySubview);
      return;
    }
    if (e.target.closest("[data-export-download]")) {
      trackTelemetry(state.unitId, state.wida, "activity_copy");
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
        headers: { "Content-Type": "application/json", ...anonTokenHeaders() },
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
    const rawTier = state.deconstructResult.differentiated_frames[tierKey];
    const frames = Array.isArray(rawTier) ? rawTier : Array.isArray(rawTier?.frames) ? rawTier.frames : [];
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
        headers: { "Content-Type": "application/json", ...anonTokenHeaders() },
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
  loadComfortPrefs();
  bindEvents();

  // Check if URL is /bcpss-teachers/plan/{id}
  const planMatch = window.location.pathname.match(/^\/bcpss-teachers\/plan\/([^/]+)\/?$/);
  if (planMatch) {
    setActiveTab("overview");
    await loadSharedPlan(decodeURIComponent(planMatch[1]));
    return;
  }

  // Otherwise hydrate from URL query params with defaults
  const q = new URLSearchParams(window.location.search);
  const qGrade = q.get("grade");
  const qSubject = q.get("subject");
  const qUnitId = q.get("unit") || q.get("unitId") || "";
  const qWida = q.get("wida");
  const qTab = q.get("tab");

  if (qGrade && GRADES.includes(qGrade)) state.grade = qGrade;
  if (qSubject && SUBJECTS.includes(qSubject)) state.subject = qSubject;
  if (qWida && WIDA_TIERS.some((t) => t.key === qWida)) state.wida = qWida;
  if (qTab) {
    const lowerTab = qTab.toLowerCase();
    if (lowerTab === "deconstruct") {
      state.tab = "family";
      state.familySubview = "deconstruct";
    } else if (lowerTab === "evidence") {
      state.tab = "family";
      state.familySubview = "evidence";
    } else if (TAB_ALIASES[lowerTab]) {
      state.tab = TAB_ALIASES[lowerTab];
    } else if (VALID_TABS.includes(lowerTab)) {
      state.tab = lowerTab;
    }
  }

  // Support direct ?unit=<id> deep links even when grade/subject are omitted
  if (qUnitId && !hasSelection()) {
    try {
      const detail = await fetchJson(`/api/bcpss/units/${encodeURIComponent(qUnitId)}`);
      if (detail?.unit) {
        state.grade = String(detail.unit.grade);
        state.subject = detail.unit.subject;
        state.detail = detail;
      }
    } catch {
      // Fall through to standard selection prompt
    }
  }

  $("#gradeSelect").value = state.grade;
  updateSubjectLabels();
  $("#subjectSelect").value = state.subject;
  setActiveTab(state.tab);

  if (hasSelection()) await loadUnits(qUnitId);
  else showSelectionPrompt();
}

init();
