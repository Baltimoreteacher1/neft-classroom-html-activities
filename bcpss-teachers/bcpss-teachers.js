// BCPSS K–8 Curriculum & Language Bridge — Progressive 3-Step Workspace
import { renderInteractiveStudio } from "./interactive-labs.js";
import { renderQrSvg } from "./qr-svg.js";

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
const SUBJECTS = ["ELA", "Math", "Science", "Social Studies"];
const KLU_FILTERS = ["All", "Narrate", "Inform", "Explain", "Argue"];
const COMFORT_STORAGE_KEY = "bcpssTeachers:v1:comfort";
const PUBLIC_SITE_ORIGIN = "https://thelanguagepage.com";
const WIDA_TIERS = [
  { key: "1_2", label: "Levels 1–2", short: "Entering / Emerging" },
  { key: "3_4", label: "Levels 3–4", short: "Developing / Expanding" },
  { key: "5_6", label: "Levels 5–6", short: "Bridging / Reaching" },
];
const VALID_TABS = ["connections", "studio", "activities", "family", "deconstruct"];
const FAMILY_LANGS = [
  { code: "en", label: "English", rtl: false },
  { code: "es", label: "Español", rtl: false },
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
  unitSearch: "",
  kluFilter: "All",
  detail: null,
  planMode: false,
  pinnedPlan: null,
  deconstructResult: null,
  familyLang: "en",
  projectionMode: false,
  diveSelectedChunk: 0,
  diveRevealAll: false,
  previewActivityIdx: -1,
  comfort: {
    largeText: false,
    highContrast: false,
    roomySpacing: false,
  },
};

let lastPreviewTrigger = null;

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

function buildActivityUrl(unitId, activityId, wida, mode = "student", { absolute = false } = {}) {
  const path = `/bcpss-teachers/activity/?unit=${encodeURIComponent(unitId)}&activity=${encodeURIComponent(activityId)}&wida=${encodeURIComponent(wida || "3_4")}&mode=${encodeURIComponent(mode)}`;
  return absolute ? `${PUBLIC_SITE_ORIGIN}${path}` : path;
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

function isExcludedNonSpanishL1(label) {
  const lower = String(label || "").toLowerCase();
  return (
    lower.includes("arabic") ||
    lower === "ar" ||
    lower.includes("french") ||
    lower.includes("creole") ||
    lower.includes("kreyol") ||
    lower.includes("kreyòl") ||
    lower === "fr" ||
    lower === "fr_ht"
  );
}

function normalizeL1Watchouts(raw) {
  const parsed = safeParseJson(raw, {});
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => {
        if (typeof item === "string" && item.trim()) {
          return {
            language: "Spanish–English Bridge",
            frictionPoint: "",
            quickFix: "",
            note: item.trim(),
          };
        }
        if (!item || typeof item !== "object") return null;
        const language = String(
          item.l1_group || item.language || item.l1 || "Spanish–English Bridge",
        ).trim();
        if (isExcludedNonSpanishL1(language)) return null;
        const frictionPoint = String(item.friction_point || "").trim();
        const quickFix = String(item.quick_fix || "").trim();
        const note = String(item.watchout || item.note || item.guidance || "").trim();
        return { language, frictionPoint, quickFix, note };
      })
      .filter((i) => i && (i.frictionPoint || i.quickFix || i.note));
  }
  if (parsed && typeof parsed === "object") {
    const labelMap = {
      spanish: "Spanish (Español)",
      es: "Spanish (Español)",
      english: "Spanish–English Bridge",
      spanish_english: "Spanish–English Bridge",
    };
    return Object.entries(parsed)
      .filter(([k, v]) => Boolean(v) && !isExcludedNonSpanishL1(k))
      .map(([k, v]) => {
        const language = labelMap[k.toLowerCase()] || k;
        if (v && typeof v === "object") {
          const resolvedLang = String(v.l1_group || language).trim();
          if (isExcludedNonSpanishL1(resolvedLang)) return null;
          return {
            language: resolvedLang,
            frictionPoint: String(v.friction_point || "").trim(),
            quickFix: String(v.quick_fix || "").trim(),
            note: String(v.watchout || v.note || v.tip || "").trim(),
          };
        }
        return {
          language,
          frictionPoint: "",
          quickFix: "",
          note: typeof v === "string" ? v.trim() : "",
        };
      })
      .filter((i) => i && (i.frictionPoint || i.quickFix || i.note));
  }
  if (typeof raw === "string" && raw.trim()) {
    return [
      {
        language: "Spanish–English Bridge",
        frictionPoint: "",
        quickFix: "",
        note: raw.trim(),
      },
    ];
  }
  return [];
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

function normalizeColorToken(token) {
  const t = String(token || "").toLowerCase().trim();
  if (t === "connector" || t === "concept" || t === "evidence" || t === "precision") return t;
  if (t.includes("connect") || t.includes("link") || t.includes("transition")) return "connector";
  if (t.includes("evid") || t.includes("reason") || t.includes("proof")) return "evidence";
  if (t.includes("precis") || t.includes("quant") || t.includes("detail")) return "precision";
  return "concept";
}

function normalizeLanguageDive(conn) {
  const raw = safeParseJson(conn?.mentor_sentence_unpacking, null);
  if (!raw || typeof raw !== "object") return null;
  const mentorSentence = String(raw.mentor_sentence || "").trim();
  const chunks = Array.isArray(raw.chunks)
    ? raw.chunks
        .map((c) => {
          if (!c || typeof c !== "object") return null;
          const text = String(c.text || "").trim();
          if (!text) return null;
          return {
            text,
            role: String(c.role || "Syntactic Chunk").trim(),
            color_token: normalizeColorToken(c.color_token),
            student_question: String(c.student_question || "").trim(),
          };
        })
        .filter(Boolean)
    : [];
  if (!mentorSentence && !chunks.length) return null;
  return {
    mentor_sentence: mentorSentence || chunks.map((c) => c.text).join(" "),
    chunks,
  };
}

function normalizeLessonArc(conn) {
  const raw = safeParseJson(conn?.lesson_arc, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((step) => {
      if (!step || typeof step !== "object") return null;
      const phase = String(step.phase || "").trim();
      if (!phase) return null;
      return {
        phase,
        minutes: step.minutes != null ? String(step.minutes).trim() : "",
        focus: String(step.focus || "").trim(),
        teacher_move: String(step.teacher_move || "").trim(),
        student_move: String(step.student_move || "").trim(),
      };
    })
    .filter(Boolean);
}

function normalizeMisconception(conn) {
  const raw = safeParseJson(conn?.common_language_misconception, null);
  if (!raw || typeof raw !== "object") return null;
  const misconception_pattern = String(raw.misconception_pattern || "").trim();
  const teacher_redirect = String(raw.teacher_redirect || "").trim();
  if (!misconception_pattern && !teacher_redirect) return null;
  return { misconception_pattern, teacher_redirect };
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

function applyWidaTier(next) {
  if (!next || next === state.wida || !WIDA_TIERS.some((t) => t.key === next)) return;
  state.wida = next;
  syncUrl();
  renderResourceExportBar();
  renderConnectionsTab();
  renderStudioTab();
  renderActivitiesTab();
  if ($("#activityPreviewModal")?.open && state.previewActivityIdx >= 0) {
    renderActivityPreviewModal();
  }
  renderFamilyTab();
  renderPrintKit();
  trackTelemetry(state.unitId, state.wida, "scaffold_toggle");
  announce(`Switched to WIDA ${widaLabel(state.wida)} scaffolds.`);
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
  const gradeSelect = $("#gradeSelect");
  if (gradeSelect) gradeSelect.value = state.grade;

  const select = $("#subjectSelect");
  if (select) {
    for (const opt of select.options) {
      const subj = opt.value;
      opt.textContent = `${subj} (${curriculumFor(state.grade, subj)})`;
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
      subEl.textContent = curriculumFor(state.grade, subj);
    }
  }

  const badge = $("#curriculumBadge");
  if (badge) {
    badge.textContent = `${curriculumFor(state.grade, state.subject)} · ${gradeLabel(state.grade)}`;
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
  state.diveSelectedChunk = 0;
  state.diveRevealAll = false;
  renderUnitStrip();
  syncUrl();
  if (skipFetchIfLoaded && state.detail?.unit?.id === unitId) {
    renderWorkspace();
    if (userInitiated) {
      focusAndAnnounceWorkspace(state.detail.unit);
    }
    return;
  }
  $("#panel-connections").innerHTML = `<div class="bh-loading" role="status">Loading unit language bridge…</div>`;
  $("#panel-studio").innerHTML = `<div class="bh-loading" role="status">Loading interactive language studio…</div>`;
  $("#panel-activities").innerHTML = `<div class="bh-loading" role="status">Loading ready-to-use activities…</div>`;
  try {
    const detail = await fetchJson(`/api/bcpss/units/${encodeURIComponent(unitId)}`);
    state.detail = detail;
    renderWorkspace();
    if (userInitiated && detail?.unit) {
      focusAndAnnounceWorkspace(detail.unit);
    }
  } catch (err) {
    const errHtml = `<div class="bh-error" role="alert">Unable to load unit details: ${esc(err.message)}</div>`;
    $("#panel-connections").innerHTML = errHtml;
    $("#panel-studio").innerHTML = errHtml;
    $("#panel-activities").innerHTML = errHtml;
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
          <div class="bh-unit-footer" aria-label="Includes ${actCount} activities and HTML, PDF, DOCX downloads">
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
  const viewHtmlUrl = buildExportUrl(u.id, "html", state.wida);
  const pdfUrl = buildExportUrl(u.id, "pdf", state.wida);
  const docxUrl = buildExportUrl(u.id, "docx", state.wida);
  const downloadHtmlUrl = buildExportUrl(u.id, "html", state.wida, "download=1");

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
  $("#panel-connections").innerHTML = `<div class="bh-empty">Choose a grade and content area above to load a unit.</div>`;
  $("#panel-studio").innerHTML = `<div class="bh-empty">Choose a grade and content area above to launch the Interactive Language Studio.</div>`;
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
  $("#printKitBtn").disabled = false;
  $("#sharePlanBtn").disabled = false;

  renderConnectionsTab();
  renderStudioTab();
  renderActivitiesTab();
  if ($("#activityPreviewModal")?.open && state.previewActivityIdx >= 0) {
    renderActivityPreviewModal();
  }
  renderFamilyTab();
  renderPrintKit();
}

function renderStudioTab() {
  const panel = $("#panel-studio");
  if (!panel) return;
  const detail = state.detail;
  const unit = detail?.unit || null;
  const conn = detail?.connections?.[0] || null;
  renderInteractiveStudio(panel, {
    unit,
    connection: conn,
    blueprint: conn?.blueprint || {},
    wida: state.wida,
    onTelemetry: (eventType) => trackTelemetry(state.unitId, state.wida, eventType),
    onWidaChange: (nextTier) => applyWidaTier(nextTier),
  });
}

function renderLanguageDiveSection(dive) {
  if (!dive) return "";
  const chunks = dive.chunks || [];
  const selectedIdx =
    chunks.length > 0 ? Math.min(Math.max(0, state.diveSelectedChunk), chunks.length - 1) : -1;
  const activeChunk = selectedIdx >= 0 ? chunks[selectedIdx] : null;

  return `
    <section class="bh-dive-card" aria-label="Interactive Mentor Sentence Language Dive">
      <div class="bh-dive-head">
        <div>
          <span class="bh-dive-kicker">Interactive Language Dive · Mentor Sentence Unpacking</span>
          <h4>Deconstruct the Target Academic Sentence</h4>
        </div>
        <div class="bh-dive-actions">
          <button
            type="button"
            class="bh-btn bh-btn-secondary bh-btn-sm"
            data-dive-read="${esc(dive.mentor_sentence)}"
          >
            🔊 Read Sentence
          </button>
          ${
            chunks.length
              ? `<button
                  type="button"
                  class="bh-btn bh-btn-ghost bh-btn-sm"
                  data-dive-reveal-all
                  aria-pressed="${state.diveRevealAll ? "true" : "false"}"
                >
                  ${state.diveRevealAll ? "Single-Chunk Focus" : "Reveal All Chunks"}
                </button>`
              : ""
          }
        </div>
      </div>

      <div class="bh-dive-legend" aria-label="Syntactic chunk color key">
        <span class="bh-dive-key"><span class="bh-dive-dot is-connector" aria-hidden="true"></span> Connector</span>
        <span class="bh-dive-key"><span class="bh-dive-dot is-concept" aria-hidden="true"></span> Concept</span>
        <span class="bh-dive-key"><span class="bh-dive-dot is-evidence" aria-hidden="true"></span> Evidence</span>
        <span class="bh-dive-key"><span class="bh-dive-dot is-precision" aria-hidden="true"></span> Precision</span>
      </div>

      ${
        chunks.length
          ? `<div class="bh-dive-chunks" role="group" aria-label="Clickable mentor sentence chunks">
              ${chunks
                .map((chunk, idx) => {
                  const isActive = state.diveRevealAll || idx === selectedIdx;
                  return `
                    <button
                      type="button"
                      class="bh-dive-chunk is-${esc(chunk.color_token)}"
                      data-dive-chunk="${idx}"
                      aria-pressed="${isActive ? "true" : "false"}"
                    >
                      <span class="bh-dive-chunk-text">${esc(chunk.text)}</span>
                      <span class="bh-dive-chunk-role">${esc(chunk.role)}</span>
                    </button>
                  `;
                })
                .join("")}
            </div>`
          : `<p class="bh-dive-fallback-sentence">“${esc(dive.mentor_sentence)}”</p>`
      }

      ${
        chunks.length && !state.diveRevealAll && activeChunk
          ? `<div class="bh-dive-inspector is-${esc(activeChunk.color_token)}" aria-live="polite">
              <div class="bh-dive-inspector-top">
                <span class="bh-dive-role-pill is-${esc(activeChunk.color_token)}">${esc(activeChunk.role)}</span>
                <span class="bh-dive-selected-quote">“${esc(activeChunk.text)}”</span>
              </div>
              ${
                activeChunk.student_question
                  ? `<p class="bh-dive-question"><strong>Guiding Student Question:</strong> ${esc(activeChunk.student_question)}</p>`
                  : ""
              }
            </div>`
          : ""
      }

      ${
        chunks.length && state.diveRevealAll
          ? `<div class="bh-dive-all-grid" aria-live="polite">
              ${chunks
                .map(
                  (chunk, idx) => `
                    <article class="bh-dive-all-item is-${esc(chunk.color_token)}">
                      <div class="bh-dive-inspector-top">
                        <span class="bh-dive-role-pill is-${esc(chunk.color_token)}">${idx + 1}. ${esc(chunk.role)}</span>
                      </div>
                      <p class="bh-dive-all-quote">“${esc(chunk.text)}”</p>
                      ${
                        chunk.student_question
                          ? `<p class="bh-dive-question"><strong>Ask Students:</strong> ${esc(chunk.student_question)}</p>`
                          : ""
                      }
                    </article>
                  `,
                )
                .join("")}
            </div>`
          : ""
      }
    </section>
  `;
}

function renderLessonArcSection(lessonArc, misconception) {
  if (!lessonArc.length && !misconception) return "";
  return `
    <section class="bh-arc-section" aria-label="4-Phase Language-Embedded Lesson Arc">
      <div class="bh-arc-head">
        <div>
          <span class="bh-dive-kicker">Publisher Lesson Pacing · Language-Embedded Arc</span>
          <h4>4-Phase Instructional Flow</h4>
        </div>
      </div>

      ${
        lessonArc.length
          ? `<div class="bh-arc-rail">
              ${lessonArc
                .map(
                  (step, idx) => `
                    <article class="bh-arc-step">
                      <div class="bh-arc-step-top">
                        <span class="bh-arc-num">${idx + 1}</span>
                        <strong class="bh-arc-phase">${esc(step.phase)}</strong>
                        ${step.minutes ? `<span class="bh-arc-min">${esc(step.minutes)} min</span>` : ""}
                      </div>
                      ${step.focus ? `<p class="bh-arc-focus">${esc(step.focus)}</p>` : ""}
                      ${
                        step.teacher_move
                          ? `<div class="bh-arc-move">
                              <span class="bh-arc-move-label is-teacher">Teacher Move</span>
                              <p>${esc(step.teacher_move)}</p>
                            </div>`
                          : ""
                      }
                      ${
                        step.student_move
                          ? `<div class="bh-arc-move">
                              <span class="bh-arc-move-label is-student">Student Move</span>
                              <p>${esc(step.student_move)}</p>
                            </div>`
                          : ""
                      }
                    </article>
                  `,
                )
                .join("")}
            </div>`
          : ""
      }

      ${
        misconception
          ? `<div class="bh-misconception-box" role="note" aria-label="Common Language Misconception and Teacher Redirect">
              <div class="bh-misconception-col is-pattern">
                <span class="bh-misconception-tag">Common Language Misconception</span>
                <p>${esc(misconception.misconception_pattern)}</p>
              </div>
              <div class="bh-misconception-col is-redirect">
                <span class="bh-misconception-tag">High-Leverage Teacher Redirect</span>
                <p>${esc(misconception.teacher_redirect)}</p>
              </div>
            </div>`
          : ""
      }
    </section>
  `;
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
  const languageDive = normalizeLanguageDive(conn);
  const lessonArc = normalizeLessonArc(conn);
  const misconception = normalizeMisconception(conn);

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

      ${renderLanguageDiveSection(languageDive)}

      ${renderLessonArcSection(lessonArc, misconception)}

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
                          ${v.definition ? `<p class="bh-vocab-def">${esc(v.definition)}</p>` : ""}
                          ${v.cognate ? `<p class="bh-vocab-cognate">${esc(v.cognate)}</p>` : ""}
                        </div>
                      `,
                    )
                    .join("")}
                </div>`
              : `<p class="bh-muted">No vocabulary entries listed for this unit.</p>`
          }
        </section>

        <section class="bh-subpanel" aria-label="Spanish-English L1 Watchouts">
          <h4>L1 Watchouts (Spanish–English Bridge)</h4>
          ${
            l1List.length
              ? `<div class="bh-l1-list">
                  ${l1List
                    .map((item) => {
                      const hasStructured = Boolean(item.frictionPoint || item.quickFix);
                      return `
                        <div class="bh-l1-item">
                          <strong class="bh-l1-lang">${esc(item.language)}</strong>
                          ${
                            hasStructured
                              ? `<div class="bh-l1-details">
                                  ${
                                    item.frictionPoint
                                      ? `<p class="bh-l1-detail"><span class="bh-l1-tag bh-l1-tag-friction">Friction Point</span> ${esc(item.frictionPoint)}</p>`
                                      : ""
                                  }
                                  ${
                                    item.quickFix
                                      ? `<p class="bh-l1-detail"><span class="bh-l1-tag bh-l1-tag-fix">Quick Fix</span> ${esc(item.quickFix)}</p>`
                                      : ""
                                  }
                                </div>`
                              : `<p>${esc(item.note)}</p>`
                          }
                        </div>
                      `;
                    })
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

function normalizeWorkedExample(raw) {
  const parsed = safeParseJson(raw, raw);
  if (!parsed) return "";
  if (typeof parsed === "string") return parsed.trim();
  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof parsed === "object") {
    const parts = [
      parsed.prompt ? `Prompt: ${parsed.prompt}` : "",
      parsed.model_response || parsed.response || parsed.example || parsed.sample
        ? `Model: ${parsed.model_response || parsed.response || parsed.example || parsed.sample}`
        : "",
      parsed.annotation || parsed.why_it_works || parsed.explanation
        ? `Why it works: ${parsed.annotation || parsed.why_it_works || parsed.explanation}`
        : "",
    ].filter(Boolean);
    return parts.join("\n");
  }
  return "";
}

function normalizeDifferentiatedTargets(raw) {
  const parsed = safeParseJson(raw, null);
  if (!parsed) return [];
  if (Array.isArray(parsed)) {
    return parsed
      .map((item, idx) => {
        if (typeof item === "string" && item.trim()) {
          const tier = WIDA_TIERS[idx] || WIDA_TIERS[1];
          return { key: tier.key, label: `WIDA ${tier.label}`, text: item.trim() };
        }
        if (item && typeof item === "object") {
          const key = String(item.tier || item.key || WIDA_TIERS[idx]?.key || "3_4").replace(/^level_/, "");
          const label = item.label || `WIDA ${widaLabel(key)}`;
          const text = String(item.target || item.text || item.goal || "").trim();
          return text ? { key, label, text } : null;
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof parsed === "object") {
    return WIDA_TIERS.map((tier) => {
      const val =
        parsed[`level_${tier.key}`] ||
        parsed[tier.key] ||
        parsed[`levels_${tier.key}`] ||
        parsed[`L${tier.key}`];
      const text =
        typeof val === "string"
          ? val.trim()
          : val && typeof val === "object"
            ? String(val.target || val.text || val.goal || "").trim()
            : "";
      return text ? { key: tier.key, label: `WIDA ${tier.label} (${tier.short})`, text } : null;
    }).filter(Boolean);
  }
  return [];
}

function normalizeTeacherSteps(raw) {
  const text = String(raw || "").trim();
  if (!text) return [];
  const byLines = text
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:step\s*)?\d+[.):-]\s*/i, "").trim())
    .filter(Boolean);
  if (byLines.length > 1) return byLines;
  const byNumbered = text
    .split(/(?=(?:^|\s)\d+[.)]\s+)/)
    .map((part) => part.replace(/^\s*\d+[.)]\s+/, "").trim())
    .filter(Boolean);
  if (byNumbered.length > 1) return byNumbered;
  return [text];
}

function normalizeActivity(act, idx) {
  const dayLabel = String(act.day_label || `Day ${idx + 1}`).trim();
  const activityType = String(act.activity_type || "Classroom Move").trim();
  const domain = String(act.domain || "").trim();
  const grouping = String(act.grouping || "").trim();
  const durationMinutes =
    act.duration_minutes != null && !Number.isNaN(Number(act.duration_minutes))
      ? Number(act.duration_minutes)
      : null;
  const prepMinutes =
    act.prep_time_minutes != null && !Number.isNaN(Number(act.prep_time_minutes))
      ? Number(act.prep_time_minutes)
      : 5;
  const metaParts = [];
  if (durationMinutes != null) metaParts.push(`${durationMinutes} min`);
  if (grouping) metaParts.push(grouping);
  const metaLabel = metaParts.length ? metaParts.join(" · ") : `${prepMinutes} min prep`;

  const rawMaterials = safeParseJson(act.materials, act.materials);
  const materials = Array.isArray(rawMaterials)
    ? rawMaterials.map((m) => String(m || "").trim()).filter(Boolean).join(", ")
    : String(rawMaterials || "").trim();

  const workedExample = normalizeWorkedExample(act.worked_example);
  const differentiatedTargets = normalizeDifferentiatedTargets(act.differentiated_targets);

  const rawCfu = safeParseJson(act.check_for_understanding, act.check_for_understanding);
  const checkForUnderstanding =
    typeof rawCfu === "string"
      ? rawCfu.trim()
      : rawCfu && typeof rawCfu === "object"
        ? String(rawCfu.prompt || rawCfu.question || rawCfu.criteria || "").trim()
        : "";

  return {
    raw: act,
    id: act.id,
    title: String(act.title || `Day ${idx + 1} Activity`).trim(),
    dayLabel,
    activityType,
    domain,
    grouping,
    durationMinutes,
    prepMinutes,
    metaLabel,
    materials,
    teacherInstructions: String(act.teacher_instructions || "").trim(),
    teacherSteps: normalizeTeacherSteps(act.teacher_instructions),
    studentPrompt: String(act.student_prompt || "").trim(),
    workedExample,
    differentiatedTargets,
    checkForUnderstanding,
  };
}

function formatActivityForSlides(unit, act, idx) {
  const norm = normalizeActivity(act, idx);
  const activeTarget = norm.differentiatedTargets.find((t) => t.key === state.wida);
  const studentLink = buildActivityUrl(unit.id, act.id, state.wida, "student", { absolute: true });
  return [
    `BCPSS ${gradeLabel(unit.grade)} ${unit.curriculum_name || curriculumFor(unit.grade, unit.subject)} — Unit ${unit.unit_number}: ${unit.unit_title}`,
    `${norm.dayLabel}: ${norm.title}`,
    [norm.activityType, norm.domain, norm.metaLabel].filter(Boolean).join(" · "),
    "",
    `Student Prompt:\n${norm.studentPrompt}`,
    ...(norm.workedExample ? ["", `Worked Example:\n${norm.workedExample}`] : []),
    ...(norm.teacherInstructions ? ["", `Teacher Script:\n${norm.teacherInstructions}`] : []),
    ...(norm.materials ? ["", `Materials: ${norm.materials}`] : []),
    ...(activeTarget ? ["", `WIDA ${widaLabel(state.wida)} Target:\n${activeTarget.text}`] : []),
    ...(norm.checkForUnderstanding ? ["", `Check for Understanding:\n${norm.checkForUnderstanding}`] : []),
    "",
    `Student Activity Link: ${studentLink}`,
  ].join("\n");
}

function formatPlaylistForCopy(unit, conn, acts) {
  const scaffold = extractScaffoldForTier(conn?.blueprint?.scaffolds_json, state.wida);
  const count = acts.length || 5;
  return [
    `BCPSS ${count}-Day Pre-Teaching Playlist — ${gradeLabel(unit.grade)} ${unit.curriculum_name || curriculumFor(unit.grade, unit.subject)}`,
    `Unit ${unit.unit_number}: ${unit.unit_title} · WIDA ${widaLabel(state.wida)}`,
    "",
    "Target Sentence Frames:",
    ...(scaffold.frames.length ? scaffold.frames.map((f) => `• ${f}`) : [conn?.unit_example_frame || ""]),
    "",
    ...acts.flatMap((a, i) => {
      const norm = normalizeActivity(a, i);
      const activeTarget = norm.differentiatedTargets.find((t) => t.key === state.wida);
      const studentLink = buildActivityUrl(unit.id, a.id, state.wida, "student", { absolute: true });
      return [
        `--- ${norm.dayLabel}: ${norm.title} (${[norm.activityType, norm.domain, norm.metaLabel].filter(Boolean).join(" · ")}) ---`,
        `Student Prompt: ${norm.studentPrompt}`,
        ...(norm.workedExample ? [`Worked Example: ${norm.workedExample}`] : []),
        ...(norm.teacherInstructions ? [`Teacher Script: ${norm.teacherInstructions}`] : []),
        ...(activeTarget ? [`WIDA ${widaLabel(state.wida)} Target: ${activeTarget.text}`] : []),
        ...(norm.checkForUnderstanding ? [`Check for Understanding: ${norm.checkForUnderstanding}`] : []),
        `Student Activity Link: ${studentLink}`,
        "",
      ];
    }),
  ].join("\n");
}

function renderWidaTargetsHtml(targets) {
  if (!targets.length) return "";
  return `
    <div class="bh-wida-targets-list">
      ${targets
        .map(
          (t) => `
            <div class="bh-wida-target-item ${t.key === state.wida ? "is-active-tier" : ""}">
              <span class="bh-wida-target-tag">${esc(t.label)}${t.key === state.wida ? " · Active" : ""}</span>
              <p style="margin:0">${esc(t.text)}</p>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function openActivityPreview(idx, triggerEl) {
  const modal = $("#activityPreviewModal");
  const unit = state.detail?.unit;
  const act = state.detail?.activities?.[idx];
  if (!modal || !unit || !act) return;

  lastPreviewTrigger = triggerEl || document.activeElement;
  state.previewActivityIdx = idx;
  renderActivityPreviewModal();

  if (!modal.open) {
    modal.showModal();
  }
  $("#closeActivityPreviewBtn")?.focus();
  announce(`Opened quick preview for ${act.title}.`);
}

function renderActivityPreviewModal() {
  const unit = state.detail?.unit;
  const act = state.detail?.activities?.[state.previewActivityIdx];
  if (!unit || !act) return;

  const norm = normalizeActivity(act, state.previewActivityIdx);
  const studentHref = buildActivityUrl(unit.id, act.id, state.wida, "student");
  const teacherHref = buildActivityUrl(unit.id, act.id, state.wida, "teacher");

  const badgesEl = $("#activityPreviewBadges");
  if (badgesEl) {
    badgesEl.innerHTML = `
      <span class="bh-badge-day">${esc(norm.dayLabel)}</span>
      <span class="bh-badge-type">${esc(norm.activityType)}</span>
      ${norm.domain ? `<span class="bh-badge-domain">${esc(norm.domain)}</span>` : ""}
      <span class="bh-badge-meta">${esc(norm.metaLabel)}</span>
    `;
  }

  const titleEl = $("#activityPreviewTitle");
  if (titleEl) titleEl.textContent = norm.title;

  const subtitleEl = $("#activityPreviewSubtitle");
  if (subtitleEl) {
    subtitleEl.textContent = `${gradeLabel(unit.grade)} · ${unit.curriculum_name || curriculumFor(unit.grade, unit.subject)} · Unit ${unit.unit_number} · WIDA ${widaLabel(state.wida)}`;
  }

  const bodyEl = $("#activityPreviewBody");
  if (bodyEl) {
    bodyEl.innerHTML = `
      <section class="bh-preview-section">
        <h3>Student Prompt</h3>
        <div class="bh-student-prompt-box">${esc(norm.studentPrompt)}</div>
      </section>

      ${
        norm.workedExample
          ? `<section class="bh-preview-section">
              <h3>Worked Example</h3>
              <div class="bh-worked-example-box">${esc(norm.workedExample).replace(/\n/g, "<br />")}</div>
            </section>`
          : ""
      }

      ${
        norm.teacherSteps.length
          ? `<section class="bh-preview-section">
              <h3>3-Step Teacher Script</h3>
              ${
                norm.teacherSteps.length > 1
                  ? `<ol class="bh-script-steps">${norm.teacherSteps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`
                  : `<p style="margin:0">${esc(norm.teacherSteps[0])}</p>`
              }
              ${
                norm.materials
                  ? `<p style="margin:0.4rem 0 0;font-size:0.88rem;color:var(--ink-2)"><strong>Materials:</strong> ${esc(norm.materials)}</p>`
                  : ""
              }
              ${
                norm.checkForUnderstanding
                  ? `<p style="margin:0.4rem 0 0;font-size:0.88rem;color:var(--ink-2)"><strong>Check for Understanding:</strong> ${esc(norm.checkForUnderstanding)}</p>`
                  : ""
              }
            </section>`
          : ""
      }

      ${
        norm.differentiatedTargets.length
          ? `<section class="bh-preview-section">
              <h3>Differentiated WIDA Targets</h3>
              ${renderWidaTargetsHtml(norm.differentiatedTargets)}
            </section>`
          : ""
      }
    `;
  }

  const footerEl = $("#activityPreviewFooter");
  if (footerEl) {
    footerEl.innerHTML = `
      <a
        class="bh-btn bh-btn-primary bh-btn-sm"
        href="${esc(studentHref)}"
        target="_blank"
        rel="noopener"
        data-preview-open-student
      >
        Open Student View ↗
      </a>
      <a
        class="bh-btn bh-btn-secondary bh-btn-sm"
        href="${esc(teacherHref)}"
        target="_blank"
        rel="noopener"
        data-preview-open-teacher
      >
        Open Teacher View ↗
      </a>
      <button
        type="button"
        class="bh-btn bh-btn-secondary bh-btn-sm"
        data-preview-copy-link
      >
        Copy Student Link
      </button>
      <button
        type="button"
        class="bh-btn bh-btn-ghost bh-btn-sm"
        data-preview-copy-slides
      >
        Copy for Slides / LMS
      </button>
    `;
  }
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

  const dayCount = activities.length || 5;
  const activitiesHtml = activities.length
    ? `
      <div class="bh-activities-toolbar">
        <p><strong>${dayCount}-Day Pre-Teaching Sequence</strong> · Aligned to WIDA ${esc(widaLabel(state.wida))} frames</p>
        <button type="button" class="bh-btn bh-btn-primary bh-btn-sm" data-copy-playlist>
          Copy Full 5-Day Pre-Teaching Playlist
        </button>
      </div>
      <div class="bh-activities-grid">
        ${activities
          .map((act, idx) => {
            const norm = normalizeActivity(act, idx);
            const studentUrl = buildActivityUrl(unit.id, act.id, state.wida, "student");
            return `
              <article class="bh-activity-card">
                <div class="bh-activity-badges">
                  <span class="bh-badge-day">${esc(norm.dayLabel)}</span>
                  <span class="bh-badge-type">${esc(norm.activityType)}</span>
                  ${norm.domain ? `<span class="bh-badge-domain">${esc(norm.domain)}</span>` : ""}
                  <span class="bh-badge-meta">${esc(norm.metaLabel)}</span>
                </div>
                <h3>${esc(norm.title)}</h3>
                <div class="bh-activity-block">
                  <strong>Student Prompt</strong>
                  <div class="bh-student-prompt-box">${esc(norm.studentPrompt)}</div>
                </div>
                <details class="bh-activity-details">
                  <summary>Teacher Script, Worked Example &amp; WIDA Targets</summary>
                  <div class="bh-activity-details-body">
                    ${
                      norm.teacherSteps.length
                        ? `<div class="bh-activity-block">
                            <strong>Teacher Script</strong>
                            ${
                              norm.teacherSteps.length > 1
                                ? `<ol class="bh-script-steps">${norm.teacherSteps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`
                                : `<p style="margin:0">${esc(norm.teacherSteps[0])}</p>`
                            }
                          </div>`
                        : ""
                    }
                    ${
                      norm.materials
                        ? `<div class="bh-activity-block">
                            <strong>Materials</strong>
                            <p style="margin:0">${esc(norm.materials)}</p>
                          </div>`
                        : ""
                    }
                    ${
                      norm.workedExample
                        ? `<div class="bh-activity-block">
                            <strong>Worked Example</strong>
                            <div class="bh-worked-example-box">${esc(norm.workedExample).replace(/\n/g, "<br />")}</div>
                          </div>`
                        : ""
                    }
                    ${
                      norm.differentiatedTargets.length
                        ? `<div class="bh-activity-block">
                            <strong>Differentiated WIDA Targets</strong>
                            ${renderWidaTargetsHtml(norm.differentiatedTargets)}
                          </div>`
                        : ""
                    }
                    ${
                      norm.checkForUnderstanding
                        ? `<div class="bh-activity-block">
                            <strong>Check for Understanding</strong>
                            <p style="margin:0">${esc(norm.checkForUnderstanding)}</p>
                          </div>`
                        : ""
                    }
                  </div>
                </details>
                <div class="bh-activity-actions">
                  <a
                    class="bh-btn bh-btn-primary bh-btn-sm"
                    href="${esc(studentUrl)}"
                    target="_blank"
                    rel="noopener"
                    data-lab-launch
                  >
                    Open Student Activity ↗
                  </a>
                  <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-preview-activity="${idx}">
                    Quick Preview
                  </button>
                  <button type="button" class="bh-btn bh-btn-secondary bh-btn-sm" data-copy-student-link="${idx}">
                    Copy Student Link
                  </button>
                  <button type="button" class="bh-btn bh-btn-ghost bh-btn-sm" data-copy-activity="${idx}">
                    Copy for Slides / LMS
                  </button>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `
    : `<div class="bh-empty">Classroom activities for this unit are scheduled in the next release. Use the Language Connections tab to view WIDA frames, vocabulary, and cross-subject bridges.</div>`;

  const lookForsRaw = exitTicket?.look_fors || exitTicket?.success_criteria;
  const lookFors = Array.isArray(lookForsRaw)
    ? lookForsRaw.filter(Boolean)
    : typeof lookForsRaw === "string" && lookForsRaw.trim()
      ? [lookForsRaw.trim()]
      : [];

  const exitTicketHtml =
    exitTicket && (exitTicket.prompt || exitTicket.quick_rubric || lookFors.length)
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
              lookFors.length
                ? `<div class="bh-activity-block">
                    <strong>Language Look-Fors</strong>
                    <ul class="bh-frame-list">${lookFors.map((lf) => `<li>${esc(lf)}</li>`).join("")}</ul>
                  </div>`
                : ""
            }
            ${
              exitTicket.quick_rubric
                ? `<div class="bh-activity-block">
                    <strong>Quick Formative Rubric</strong>
                    <div class="bh-rubric-table-wrap">
                      <table class="bh-rubric-table">
                        <thead>
                          <tr>
                            <th scope="col" class="is-emerging">Emerging (L1–2)</th>
                            <th scope="col" class="is-developing">Developing (L3–4)</th>
                            <th scope="col" class="is-proficient">Proficient (L5–6)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td data-label="Emerging (L1–2)">${esc(exitTicket.quick_rubric.emerging || "Uses single words, visuals, or teacher-modeled stems.")}</td>
                            <td data-label="Developing (L3–4)">${esc(exitTicket.quick_rubric.developing || "Connects unit ideas using provided sentence frames and key vocabulary.")}</td>
                            <td data-label="Proficient (L5–6)">${esc(exitTicket.quick_rubric.proficient || "Produces cohesive academic explanations independently with precise unit terms.")}</td>
                          </tr>
                        </tbody>
                      </table>
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
  const pdfPacketUrl = buildExportUrl(unit.id, "pdf", state.wida);
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
          <a class="bh-btn bh-btn-secondary bh-btn-sm" href="${esc(pdfPacketUrl)}" download data-export-download="pdf">
            Download Printable Packet (PDF)
          </a>
          <a class="bh-btn bh-btn-ghost bh-btn-sm" href="${esc(localFamilyHref)}" target="_blank" rel="noopener">
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
  announce(`Selected ${gradeLabel(state.grade)} ${state.subject}.`);
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
  announce(`Selected ${gradeLabel(state.grade)} ${state.subject}.`);
}

function bindEvents() {
  // Reading Comfort & Accessibility Bar
  $(".bh-comfort-controls")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-comfort]");
    if (!btn) return;
    toggleComfortPref(btn.dataset.comfort);
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
    selectGrade(e.target.value);
  });
  $("#subjectSelect")?.addEventListener("change", (e) => {
    selectSubject(e.target.value);
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

  // Connections panel delegation (WIDA toggle + Language Dive + Vocab lookup + Cross-subject transfer cards)
  $("#panel-connections").addEventListener("click", async (e) => {
    const widaBtn = e.target.closest("[data-wida-tier]");
    if (widaBtn) {
      applyWidaTier(widaBtn.dataset.widaTier);
      return;
    }

    const diveChunkBtn = e.target.closest("[data-dive-chunk]");
    if (diveChunkBtn) {
      const idx = Number(diveChunkBtn.dataset.diveChunk);
      if (!Number.isNaN(idx)) {
        state.diveSelectedChunk = idx;
        state.diveRevealAll = false;
        renderConnectionsTab();
      }
      return;
    }

    if (e.target.closest("[data-dive-reveal-all]")) {
      state.diveRevealAll = !state.diveRevealAll;
      renderConnectionsTab();
      return;
    }

    const diveReadBtn = e.target.closest("[data-dive-read]");
    if (diveReadBtn) {
      const sentence = diveReadBtn.dataset.diveRead || "";
      if (sentence && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(sentence);
          utter.lang = "en-US";
          utter.rate = 0.92;
          window.speechSynthesis.speak(utter);
          announce("Reading mentor sentence aloud.");
        } catch {
          announce("Read Aloud is unavailable in this browser.");
        }
      } else {
        announce("Read Aloud is not supported in this browser.");
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
      resetUnitFilters();
      updateSubjectLabels();
      await loadUnits(targetUnit);
      $("#workspaceSection").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
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
    if (
      e.key === "Escape" &&
      state.projectionMode &&
      !$("#shareDialog")?.open &&
      !$("#activityPreviewModal")?.open
    ) {
      setProjectionMode(false);
    }
  });

  $("#panel-connections").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const vocabCard = e.target.closest("[data-vocab-word]");
    if (!vocabCard) return;
    e.preventDefault();
    const word = vocabCard.dataset.vocabWord;
    trackTelemetry(state.unitId, state.wida, "vocab_lookup");
    copyToClipboard(word);
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

  // Activities panel delegation (Quick Preview, Copy Student Link, Copy for Slides / LMS, Full 5-Day Playlist, Exit Ticket, Open Student Activity)
  $("#panel-activities").addEventListener("click", (e) => {
    if (e.target.closest("[data-lab-launch]")) {
      trackTelemetry(state.unitId, state.wida, "lab_launch");
      return;
    }

    const previewBtn = e.target.closest("[data-preview-activity]");
    if (previewBtn && state.detail?.unit) {
      const idx = Number(previewBtn.dataset.previewActivity);
      if (!Number.isNaN(idx)) {
        openActivityPreview(idx, previewBtn);
      }
      return;
    }

    const copyLinkBtn = e.target.closest("[data-copy-student-link]");
    if (copyLinkBtn && state.detail?.unit) {
      const act = state.detail.activities?.[Number(copyLinkBtn.dataset.copyStudentLink)];
      if (!act) return;
      const studentUrl = buildActivityUrl(state.detail.unit.id, act.id, state.wida, "student", {
        absolute: true,
      });
      trackTelemetry(state.unitId, state.wida, "activity_copy");
      copyToClipboard(studentUrl, copyLinkBtn, "Link Copied!");
      return;
    }

    const playlistBtn = e.target.closest("[data-copy-playlist]");
    if (playlistBtn && state.detail?.unit) {
      const u = state.detail.unit;
      const conn = state.detail.connections?.[0] || {};
      const acts = Array.isArray(state.detail.activities) ? state.detail.activities : [];
      const text = formatPlaylistForCopy(u, conn, acts);
      trackTelemetry(state.unitId, state.wida, "activity_copy");
      copyToClipboard(text, playlistBtn, "Playlist Copied!");
      return;
    }

    const exitBtn = e.target.closest("[data-copy-exit-ticket]");
    if (exitBtn && state.detail?.unit) {
      const u = state.detail.unit;
      const exitTicket = safeParseJson(state.detail.connections?.[0]?.language_exit_ticket_json, null);
      if (!exitTicket) return;
      const rawLookFors = exitTicket.look_fors || exitTicket.success_criteria;
      const lookForsList = Array.isArray(rawLookFors)
        ? rawLookFors.filter(Boolean)
        : typeof rawLookFors === "string" && rawLookFors.trim()
          ? [rawLookFors.trim()]
          : [];
      const lines = [
        `3-Minute Language Exit Ticket — Unit ${u.unit_number}: ${u.unit_title}`,
        "",
        `Prompt:\n${exitTicket.prompt || ""}`,
        "",
        ...(lookForsList.length
          ? ["Look-Fors:", ...lookForsList.map((lf) => `• ${lf}`), ""]
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
    if (!copyBtn || !state.detail?.unit) return;
    const idx = Number(copyBtn.dataset.copyActivity);
    const act = state.detail.activities?.[idx];
    if (!act) return;
    const text = formatActivityForSlides(state.detail.unit, act, idx);
    trackTelemetry(state.unitId, state.wida, "activity_copy");
    copyToClipboard(text, copyBtn, "Copied!");
  });

  // Instant Activity Preview Drawer (<dialog id="activityPreviewModal">)
  const previewModal = $("#activityPreviewModal");
  $("#closeActivityPreviewBtn")?.addEventListener("click", () => {
    previewModal?.close();
  });
  previewModal?.addEventListener("click", (e) => {
    if (e.target === previewModal) {
      previewModal.close();
      return;
    }
    if (e.target.closest("[data-preview-open-student]") || e.target.closest("[data-preview-open-teacher]")) {
      trackTelemetry(state.unitId, state.wida, "lab_launch");
      return;
    }
    const copyLinkBtn = e.target.closest("[data-preview-copy-link]");
    if (copyLinkBtn && state.detail?.unit) {
      const act = state.detail.activities?.[state.previewActivityIdx];
      if (!act) return;
      const studentUrl = buildActivityUrl(state.detail.unit.id, act.id, state.wida, "student", {
        absolute: true,
      });
      trackTelemetry(state.unitId, state.wida, "activity_copy");
      copyToClipboard(studentUrl, copyLinkBtn, "Link Copied!");
      return;
    }
    const copySlidesBtn = e.target.closest("[data-preview-copy-slides]");
    if (copySlidesBtn && state.detail?.unit) {
      const idx = state.previewActivityIdx;
      const act = state.detail.activities?.[idx];
      if (!act) return;
      const text = formatActivityForSlides(state.detail.unit, act, idx);
      trackTelemetry(state.unitId, state.wida, "activity_copy");
      copyToClipboard(text, copySlidesBtn, "Copied!");
    }
  });
  previewModal?.addEventListener("close", () => {
    state.previewActivityIdx = -1;
    if (lastPreviewTrigger && document.contains(lastPreviewTrigger)) {
      lastPreviewTrigger.focus();
    }
    lastPreviewTrigger = null;
  });

  // Family Bridge panel delegation (Language preview toggle + Copy Family Link + PDF Download)
  $("#panel-family").addEventListener("click", (e) => {
    if (e.target.closest("[data-export-download]")) {
      trackTelemetry(state.unitId, state.wida, "activity_copy");
      return;
    }
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
  loadComfortPrefs();
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
