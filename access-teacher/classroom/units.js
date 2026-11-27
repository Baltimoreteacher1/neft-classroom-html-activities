// Classroom Teacher Unit Finder (access-teacher/classroom/units.js):
// Pick Grade (K–8) + Subject (ELA, Math, Science, Social Studies) -> choose a Unit -> launch activities for that unit.
// Backed by the existing K–8 curriculum API (/api/bcpss/units and /api/bcpss/units/:unitId) with zero duplicate data.

export const GRADES = Object.freeze(["K", "1", "2", "3", "4", "5", "6", "7", "8"]);
export const SUBJECTS = Object.freeze(["ELA", "Math", "Science", "Social Studies"]);

const STORAGE_KEY = "accessTeacher:v1:unitFinder";

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

export const gradeLabel = (g) => (g === "K" ? "Kindergarten" : `Grade ${g}`);
export const gradeShort = (g) => (g === "K" ? "K" : `G${g}`);

export function unitStudioUrl(unitId, activityOrder = null) {
  const params = new URLSearchParams({ unit: String(unitId || "") });
  if (activityOrder !== null && activityOrder !== undefined && Number(activityOrder) > 0) {
    params.set("a", String(Number(activityOrder)));
  }
  return `/bcpss-teachers/language-studio/?${params}`;
}

export function unitWorkspaceUrl(unitId) {
  return `/bcpss-teachers/?unit=${encodeURIComponent(String(unitId || ""))}`;
}

export function writingLabUrl(unitId) {
  return `/bcpss-teachers/writing-lab/?unit=${encodeURIComponent(String(unitId || ""))}`;
}

export function domainSlug(domain) {
  const d = String(domain || "").toLowerCase();
  if (d.includes("listen")) return "listening";
  if (d.includes("read")) return "reading";
  if (d.includes("speak")) return "speaking";
  if (d.includes("writ")) return "writing";
  if (d.includes("vocab")) return "vocab";
  if (d.includes("game")) return "game";
  return "general";
}

export function normalizeActivities(detail) {
  const raw = Array.isArray(detail?.activities) ? detail.activities : [];
  return [...raw]
    .sort((a, b) => (Number(a.activity_order) || 0) - (Number(b.activity_order) || 0))
    .map((a, idx) => ({
      id: a.id || `${detail?.unit?.id || "u"}-${idx + 1}`,
      order: Number(a.activity_order) || idx + 1,
      title: a.title || `Activity ${idx + 1}`,
      domain: a.domain || "Activity",
      grouping: a.grouping || "",
      duration: Number(a.duration_minutes) || 0,
      prompt: a.student_prompt || a.mission || "",
      href: unitStudioUrl(detail?.unit?.id || a.unit_id, Number(a.activity_order) || idx + 1),
    }));
}

export function extractUnitKeyWords(detail, max = 8) {
  const terms = [];
  const seen = new Set();
  const add = (val) => {
    const clean = String(val || "").trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key) || terms.length >= max) return;
    seen.add(key);
    terms.push(clean);
  };
  for (const conn of detail?.connections || []) {
    const vocab = conn?.tier2_tier3_vocab;
    if (Array.isArray(vocab)) {
      for (const item of vocab) add(typeof item === "string" ? item : item?.term || item?.word);
    } else if (vocab && typeof vocab === "object") {
      for (const list of Object.values(vocab)) {
        if (Array.isArray(list)) {
          for (const item of list) add(typeof item === "string" ? item : item?.term || item?.word);
        }
      }
    }
  }
  return terms;
}

function readSaved() {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

function writeSaved(patch) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSaved(), ...patch }));
  } catch {}
}

export function mountUnitFinder(host, { fetcher = (...args) => fetch(...args) } = {}) {
  if (!host) return;
  const saved = readSaved();
  const params = new URLSearchParams(location.search);
  const urlGrade = params.get("grade");
  const urlSubject = params.get("subject");
  const urlUnit = params.get("unit") || "";

  const state = {
    grade: GRADES.includes(urlGrade) ? urlGrade : GRADES.includes(saved.grade) ? saved.grade : "6",
    subject: SUBJECTS.includes(urlSubject)
      ? urlSubject
      : SUBJECTS.includes(saved.subject)
        ? saved.subject
        : "ELA",
    units: [],
    unitsLoading: false,
    unitsError: "",
    selectedUnitId: urlUnit || "",
    detail: null,
    detailLoading: false,
    detailError: "",
    domainFilter: "",
    statusNote: "",
  };

  let unitsReqId = 0;
  let detailReqId = 0;

  function syncUrl() {
    try {
      const url = new URL(location.href);
      url.searchParams.set("grade", state.grade);
      url.searchParams.set("subject", state.subject);
      if (state.selectedUnitId) url.searchParams.set("unit", state.selectedUnitId);
      else url.searchParams.delete("unit");
      history.replaceState(history.state, "", url);
    } catch {}
  }

  async function loadUnits({ keepSelected = false } = {}) {
    const req = ++unitsReqId;
    state.unitsLoading = true;
    state.unitsError = "";
    if (!keepSelected) {
      state.selectedUnitId = "";
      state.detail = null;
      state.detailError = "";
      state.domainFilter = "";
    }
    writeSaved({ grade: state.grade, subject: state.subject });
    syncUrl();
    render();

    try {
      const res = await fetcher(
        `/api/bcpss/units?grade=${encodeURIComponent(state.grade)}&subject=${encodeURIComponent(state.subject)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (req !== unitsReqId) return;
      state.units = Array.isArray(data?.units) ? data.units : [];
      state.unitsLoading = false;

      if (state.selectedUnitId && state.units.some((u) => u.id === state.selectedUnitId)) {
        render();
        await loadUnitDetail(state.selectedUnitId, { scroll: false });
      } else {
        state.selectedUnitId = "";
        state.detail = null;
        render();
      }
    } catch {
      if (req !== unitsReqId) return;
      state.unitsLoading = false;
      state.units = [];
      state.unitsError = "Could not load units right now. Check your connection and try again.";
      render();
    }
  }

  async function loadUnitDetail(unitId, { scroll = true } = {}) {
    if (!unitId) return;
    const req = ++detailReqId;
    state.selectedUnitId = unitId;
    state.detailLoading = true;
    state.detailError = "";
    state.domainFilter = "";
    state.statusNote = "";
    syncUrl();
    render();

    try {
      const res = await fetcher(`/api/bcpss/units/${encodeURIComponent(unitId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (req !== detailReqId) return;
      state.detail = data;
      state.detailLoading = false;
      render();
      if (scroll) {
        const panel = host.querySelector("#ufActivitiesPanel");
        panel?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch {
      if (req !== detailReqId) return;
      state.detailLoading = false;
      state.detail = null;
      state.detailError = "Could not load activities for this unit. Try again.";
      render();
    }
  }

  function renderActivitiesPanel() {
    if (!state.selectedUnitId) {
      return `<div class="uf-prompt" id="ufActivitiesPanel">
        <p><strong>Pick any unit above</strong> to open its ready-to-use student activities.</p>
      </div>`;
    }
    if (state.detailLoading) {
      return `<div class="uf-panel" id="ufActivitiesPanel" role="status">
        <p class="fine">Loading unit activities…</p>
      </div>`;
    }
    if (state.detailError) {
      return `<div class="uf-panel" id="ufActivitiesPanel" role="alert">
        <p>${esc(state.detailError)}</p>
        <button type="button" class="btn small" data-uf-retry-detail>Try again</button>
      </div>`;
    }
    const unit = state.detail?.unit;
    if (!unit) return "";
    const allActivities = normalizeActivities(state.detail);
    const domains = [...new Set(allActivities.map((a) => a.domain).filter(Boolean))];
    const shown = state.domainFilter
      ? allActivities.filter((a) => a.domain === state.domainFilter)
      : allActivities;
    const hasWriting = Boolean(state.detail?.writing);

    return `<section class="uf-panel" id="ufActivitiesPanel" aria-labelledby="ufActHeading">
      <div class="uf-panel-head">
        <div>
          <p class="uf-kicker">${esc(gradeLabel(unit.grade))} · ${esc(unit.subject)}${unit.curriculum_name ? ` · ${esc(unit.curriculum_name)}` : ""} · Unit ${esc(unit.unit_number)}</p>
          <h3 id="ufActHeading">${esc(unit.unit_title)}</h3>
          ${unit.essential_question ? `<p class="uf-eq">${esc(unit.essential_question)}</p>` : unit.unit_summary ? `<p class="uf-eq">${esc(unit.unit_summary)}</p>` : ""}
        </div>
        <div class="uf-panel-actions">
          <a class="btn btn-primary" href="${esc(unitStudioUrl(unit.id))}">Launch all unit activities →</a>
          ${hasWriting ? `<a class="btn" href="${esc(writingLabUrl(unit.id))}">Writing Lab</a>` : ""}
          <a class="btn" href="${esc(unitWorkspaceUrl(unit.id))}">Full unit guide &amp; printables</a>
          <button type="button" class="btn" data-uf-fill-kit>Use in Lesson Kit below</button>
        </div>
      </div>

      ${
        domains.length > 1
          ? `<div class="uf-filter-row" role="group" aria-label="Filter unit activities by skill">
              <button type="button" class="uf-chip${state.domainFilter === "" ? " is-on" : ""}" data-uf-domain="" aria-pressed="${String(state.domainFilter === "")}">All (${allActivities.length})</button>
              ${domains
                .map((d) => {
                  const count = allActivities.filter((a) => a.domain === d).length;
                  const on = state.domainFilter === d;
                  return `<button type="button" class="uf-chip${on ? " is-on" : ""}" data-uf-domain="${esc(d)}" aria-pressed="${String(on)}">${esc(d)} (${count})</button>`;
                })
                .join("")}
            </div>`
          : ""
      }

      ${
        shown.length
          ? `<ol class="uf-act-grid" role="list">
              ${shown
                .map(
                  (a) => `<li class="uf-act-card">
                    <div class="uf-act-meta">
                      <span class="uf-badge is-${esc(domainSlug(a.domain))}">${esc(a.domain)}</span>
                      <span class="fine">${a.duration ? `${a.duration} min` : ""}${a.duration && a.grouping ? " · " : ""}${esc(a.grouping)}</span>
                    </div>
                    <h4>${esc(a.title)}</h4>
                    ${a.prompt ? `<p class="uf-act-desc">${esc(a.prompt)}</p>` : ""}
                    <div class="uf-act-links">
                      <a class="btn btn-primary small" href="${esc(a.href)}">Open activity →</a>
                      <button type="button" class="btn small" data-uf-copy="${esc(a.href)}">Copy link</button>
                    </div>
                  </li>`,
                )
                .join("")}
            </ol>`
          : `<p class="fine">No activities match that filter. Pick “All” to see every activity in this unit.</p>`
      }
      ${state.statusNote ? `<p class="fine" role="status" aria-live="polite">${esc(state.statusNote)}</p>` : ""}
    </section>`;
  }

  function render() {
    const curCurriculum = state.units[0]?.curriculum_name || "";
    host.innerHTML = `
      <div class="uf-shell">
        <div class="uf-picker-grid">
          <div class="uf-step-group">
            <span class="uf-step-label" id="ufGradeLabel"><span class="lc-step" aria-hidden="true">1</span> Pick your grade</span>
            <div class="uf-pills" role="group" aria-labelledby="ufGradeLabel">
              ${GRADES.map(
                (g) =>
                  `<button type="button" class="uf-pill${state.grade === g ? " is-on" : ""}" data-uf-grade="${g}" aria-pressed="${String(state.grade === g)}" aria-label="${esc(gradeLabel(g))}">${esc(gradeShort(g))}</button>`,
              ).join("")}
            </div>
          </div>

          <div class="uf-step-group">
            <span class="uf-step-label" id="ufSubjectLabel"><span class="lc-step" aria-hidden="true">2</span> Pick your subject</span>
            <div class="uf-pills" role="group" aria-labelledby="ufSubjectLabel">
              ${SUBJECTS.map(
                (s) =>
                  `<button type="button" class="uf-pill uf-pill-wide${state.subject === s ? " is-on" : ""}" data-uf-subject="${esc(s)}" aria-pressed="${String(state.subject === s)}">${esc(s)}</button>`,
              ).join("")}
            </div>
          </div>
        </div>

        <div class="uf-units-block">
          <div class="uf-units-head">
            <h2 id="ufUnitsTitle"><span class="lc-step" aria-hidden="true">3</span> Select a unit</h2>
            <p class="fine">${esc(gradeLabel(state.grade))} · ${esc(state.subject)}${curCurriculum ? ` (${esc(curCurriculum)})` : ""}${!state.unitsLoading && state.units.length ? ` · ${state.units.length} units` : ""}</p>
          </div>
          ${
            state.unitsLoading
              ? `<p class="fine" role="status">Loading units for ${esc(gradeLabel(state.grade))} ${esc(state.subject)}…</p>`
              : state.unitsError
                ? `<div class="uf-error" role="alert"><p>${esc(state.unitsError)}</p><button type="button" class="btn small" data-uf-retry-units>Try again</button></div>`
                : state.units.length
                  ? `<ul class="uf-unit-grid" role="list">
                      ${state.units
                        .map((u) => {
                          const on = u.id === state.selectedUnitId;
                          return `<li>
                            <button type="button" class="uf-unit-card${on ? " is-on" : ""}" data-uf-unit="${esc(u.id)}" aria-pressed="${String(on)}">
                              <span class="uf-unit-num">Unit ${esc(u.unit_number)}</span>
                              <strong>${esc(u.unit_title)}</strong>
                              ${u.unit_summary ? `<span class="uf-unit-sum">${esc(u.unit_summary)}</span>` : ""}
                              <span class="uf-unit-go">${on ? "Showing activities ↓" : "See activities →"}</span>
                            </button>
                          </li>`;
                        })
                        .join("")}
                    </ul>`
                  : `<p class="fine">No units found for ${esc(gradeLabel(state.grade))} ${esc(state.subject)}.</p>`
          }
        </div>

        ${renderActivitiesPanel()}
      </div>
    `;
  }

  host.addEventListener("click", async (e) => {
    const gradeBtn = e.target.closest("[data-uf-grade]");
    if (gradeBtn) {
      const next = gradeBtn.dataset.ufGrade;
      if (GRADES.includes(next) && next !== state.grade) {
        state.grade = next;
        loadUnits();
      }
      return;
    }
    const subjBtn = e.target.closest("[data-uf-subject]");
    if (subjBtn) {
      const next = subjBtn.dataset.ufSubject;
      if (SUBJECTS.includes(next) && next !== state.subject) {
        state.subject = next;
        loadUnits();
      }
      return;
    }
    const unitBtn = e.target.closest("[data-uf-unit]");
    if (unitBtn) {
      loadUnitDetail(unitBtn.dataset.ufUnit);
      return;
    }
    const domBtn = e.target.closest("[data-uf-domain]");
    if (domBtn) {
      state.domainFilter = domBtn.dataset.ufDomain;
      render();
      return;
    }
    const copyBtn = e.target.closest("[data-uf-copy]");
    if (copyBtn) {
      const abs = new URL(copyBtn.dataset.ufCopy, location.origin).href;
      try {
        await navigator.clipboard.writeText(abs);
        state.statusNote = `Copied student link: ${abs}`;
      } catch {
        state.statusNote = `Copy this link: ${abs}`;
      }
      render();
      return;
    }
    if (e.target.closest("[data-uf-fill-kit]") && state.detail?.unit) {
      const unit = state.detail.unit;
      const words = extractUnitKeyWords(state.detail).join(", ");
      const { CustomEvent: Ev } = document.defaultView || globalThis;
      document.dispatchEvent(
        new Ev("lc:fill-unit", {
          detail: {
            grade: String(unit.grade || state.grade),
            topic: unit.unit_title || "",
            words,
          },
        }),
      );
      document.getElementById("lcForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (e.target.closest("[data-uf-retry-units]")) {
      loadUnits({ keepSelected: true });
      return;
    }
    if (e.target.closest("[data-uf-retry-detail]")) {
      loadUnitDetail(state.selectedUnitId, { scroll: false });
    }
  });

  loadUnits({ keepSelected: Boolean(state.selectedUnitId) });
}

const root = typeof document !== "undefined" ? document.getElementById("unitFinder") : null;
if (root) mountUnitFinder(root);
