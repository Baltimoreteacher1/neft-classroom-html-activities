// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/**
 * Bulk resource downloader for the Curriculum Hub.
 *
 * Opens from "⬇️ Download Resources" on /curriculum/, and from the "Download
 * Unit" / "Download Lesson" actions on /curriculum/units/. Packages whatever the
 * teacher picked into ONE .zip, built in the browser.
 *
 * Why the browser and not a Worker: a complete unit is 5–24 MB across ~470
 * resources, and the teacher needs to see it advance ("18 of 43") and to get 42
 * of 43 files when one is missing rather than a 500. Both are natural here and
 * awkward in a single server round-trip; the zip writer is the same module the
 * SCORM endpoints use, so the archives are byte-identical in layout.
 *
 * Inventory comes from data/curriculum-download-manifest.json, which is
 * GENERATED from the curriculum manifest + the units page. Nothing about the
 * curriculum is declared here — add a lesson, regenerate, and it appears.
 *
 * Nothing here weakens the password gate: resources under a teacher surface are
 * marked `teacherOnly` by the generator and are only ever LINKED, never fetched.
 */
import { zipStore } from "/assets/lib/zip-store.js";

const MANIFEST_URL = "/data/curriculum-download-manifest.json";
// The stylesheet is fetched by this module, not by a <link> in the page.
// /curriculum/ is held to a 60-request budget (scripts/perf-curriculum.mjs) and
// is what a student opens first on a school Chromebook, so a teacher-only
// downloader must cost that page nothing until a teacher actually opens it.
// tools/validate-download-manifest.mjs pins this ?v= to the file's content hash.
const STYLES_URL = "/assets/curriculum-download.css?v=cfda810f";
const SELECTION_KEY = "nt-download-selection";
const FETCH_CONCURRENCY = 4;
// A stored zip is assembled in memory before it is handed to the browser, so the
// ceiling is real. 24 MB is the largest complete unit today; this leaves headroom
// for a cross-unit cart while still refusing to try something that would crash
// the tab on a 4 GB Chromebook.
const SIZE_WARN_BYTES = 250 * 1024 * 1024;

/* ------------------------------------------------------------------ state */

let manifest = null;
let manifestPromise = null;
/** zipPath-independent resource identity: type + url is unique per resource. */
const idOf = (res) => `${res.type}|${res.url}`;

/** Selected resource ids, kept for the browser session. */
let selection = loadSelection();
let dialog = null;
let refs = {};
let view = "packages";
let activeUnit = null;
let activePreset = "complete";
let cancelled = false;
let busy = false;

function loadSelection() {
  try {
    const raw = sessionStorage.getItem(SELECTION_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSelection() {
  try {
    sessionStorage.setItem(SELECTION_KEY, JSON.stringify([...selection]));
  } catch {
    /* private browsing — the selection just does not survive a reload */
  }
}

/* --------------------------------------------------------------- manifest */

function loadManifest() {
  if (manifestPromise) return manifestPromise;
  const cache = window.NTJsonCache;
  manifestPromise = (cache?.json ? cache.json(MANIFEST_URL) : fetchJson(MANIFEST_URL)).then(
    (data) => {
      manifest = decorate(data);
      return manifest;
    },
  );
  return manifestPromise;
}

async function fetchJson(url) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);
  return response.json();
}

/** Re-attach the fields the generator trimmed, and index everything by id. */
function decorate(data) {
  const typeById = new Map(data.types.map((t) => [t.id, t]));
  const byId = new Map();
  const hydrate = (res, unit, lesson) => {
    const meta = typeById.get(res.type) || { label: res.type, group: "extensions", order: 99 };
    res.typeLabel = meta.label;
    res.group = meta.group;
    res.order = meta.order;
    res.label = res.label || meta.label;
    res.unitRef = unit;
    res.lessonRef = lesson || null;
    res.title = lesson ? `${lesson.title} — ${res.label}` : res.label;
    res.id = idOf(res);
    res.searchText = [
      res.label,
      res.typeLabel,
      res.type,
      lesson?.id,
      lesson?.title,
      lesson?.standard,
      lesson?.objective,
      `unit ${unit.unit}`,
      unit.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    byId.set(res.id, res);
  };

  for (const unit of data.units) {
    for (const res of unit.resources) hydrate(res, unit, null);
    for (const lesson of unit.lessons) {
      lesson.unitRef = unit;
      for (const res of lesson.resources) hydrate(res, unit, lesson);
    }
  }
  data.byId = byId;
  data.typeById = typeById;
  data.presetById = new Map(data.presets.map((p) => [p.id, p]));
  return data;
}

const unitResources = (unit) => [...unit.resources, ...unit.lessons.flatMap((l) => l.resources)];

/* ----------------------------------------------------------------- markup */

const esc = (value) =>
  String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtBytes = (n) => {
  if (!n) return "";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
};

function ensureStyles() {
  if (document.querySelector("link[data-ntdl-styles]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = STYLES_URL;
  link.dataset.ntdlStyles = "";
  document.head.appendChild(link);
}

function ensureDialog() {
  if (dialog) return dialog;
  ensureStyles();
  dialog = document.createElement("dialog");
  dialog.className = "ntdl";
  dialog.setAttribute("aria-labelledby", "ntdl-title");
  dialog.innerHTML = `
    <form method="dialog" class="ntdl__closeform">
      <button class="ntdl__close" value="close" aria-label="Close downloader">✕</button>
    </form>
    <header class="ntdl__head">
      <h2 id="ntdl-title" class="ntdl__title">⬇️ Download Resources</h2>
      <p class="ntdl__lede">Package lessons, notes, worksheets and Canvas files into one zip.</p>
      <div class="ntdl__tabs" role="tablist" aria-label="Downloader views">
        <button type="button" class="ntdl__tab" role="tab" data-view="packages" id="ntdl-tab-packages"
                aria-controls="ntdl-panel-packages">Unit packages</button>
        <button type="button" class="ntdl__tab" role="tab" data-view="custom" id="ntdl-tab-custom"
                aria-controls="ntdl-panel-custom">Choose resources</button>
      </div>
    </header>
    <div class="ntdl__body">
      <section class="ntdl__panel" id="ntdl-panel-packages" role="tabpanel" aria-labelledby="ntdl-tab-packages"></section>
      <section class="ntdl__panel" id="ntdl-panel-custom" role="tabpanel" aria-labelledby="ntdl-tab-custom" hidden></section>
    </div>
    <footer class="ntdl__bar">
      <p class="ntdl__count" role="status" aria-live="polite"></p>
      <div class="ntdl__actions">
        <button type="button" class="ntdl__btn ntdl__btn--ghost" data-act="clear">Clear selection</button>
        <button type="button" class="ntdl__btn ntdl__btn--go" data-act="download">Download ZIP</button>
      </div>
    </footer>
    <div class="ntdl__progress" hidden aria-live="polite">
      <p class="ntdl__progress-label"></p>
      <div class="ntdl__meter"><span class="ntdl__meter-fill"></span></div>
      <button type="button" class="ntdl__btn ntdl__btn--ghost" data-act="cancel">Cancel</button>
    </div>`;
  document.body.appendChild(dialog);

  refs = {
    packages: dialog.querySelector("#ntdl-panel-packages"),
    custom: dialog.querySelector("#ntdl-panel-custom"),
    count: dialog.querySelector(".ntdl__count"),
    bar: dialog.querySelector(".ntdl__bar"),
    progress: dialog.querySelector(".ntdl__progress"),
    progressLabel: dialog.querySelector(".ntdl__progress-label"),
    meterFill: dialog.querySelector(".ntdl__meter-fill"),
    tabs: [...dialog.querySelectorAll(".ntdl__tab")],
  };

  dialog.addEventListener("click", onDialogClick);
  dialog.addEventListener("change", onDialogChange);
  dialog.addEventListener("input", onDialogInput);
  dialog.addEventListener("close", () => {
    cancelled = true;
  });
  return dialog;
}

/* ------------------------------------------------------------------ views */

function setView(next) {
  view = next;
  for (const tab of refs.tabs) {
    const on = tab.dataset.view === view;
    tab.setAttribute("aria-selected", String(on));
    tab.classList.toggle("is-on", on);
  }
  refs.packages.hidden = view !== "packages";
  refs.custom.hidden = view !== "custom";
  render();
}

function render() {
  if (view === "packages") renderPackages();
  else renderCustom();
  renderBar();
}

function renderPackages() {
  const unit = manifest.units.find((u) => u.unit === activeUnit) || manifest.units[0];
  activeUnit = unit.unit;
  const preset = manifest.presetById.get(activePreset) || manifest.presets[0];
  const picked = presetResources(unit, preset);

  refs.packages.innerHTML = `
    <label class="ntdl__field">
      <span class="ntdl__field-label">Unit</span>
      <select class="ntdl__select" data-act="unit">
        ${manifest.units
          .map(
            (u) =>
              `<option value="${u.unit}" ${u.unit === unit.unit ? "selected" : ""}>${esc(
                `${u.icon} Unit ${u.unit} — ${u.name}`,
              )}</option>`,
          )
          .join("")}
      </select>
    </label>

    <ul class="ntdl__presets" role="radiogroup" aria-label="Package">
      ${manifest.presets
        .map((p) => {
          const n = presetResources(unit, p).length;
          const on = p.id === preset.id;
          return `<li>
            <button type="button" class="ntdl__preset ${on ? "is-on" : ""}" role="radio"
                    aria-checked="${on}" data-act="preset" data-preset="${esc(p.id)}"
                    ${n ? "" : "disabled"}>
              <span class="ntdl__preset-name">${esc(p.label)}</span>
              <span class="ntdl__preset-desc">${esc(p.description)}</span>
              <span class="ntdl__preset-count">${n} resource${n === 1 ? "" : "s"}</span>
            </button>
          </li>`;
        })
        .join("")}
      <li>
        <button type="button" class="ntdl__preset ntdl__preset--custom" data-act="gocustom">
          <span class="ntdl__preset-name">Custom</span>
          <span class="ntdl__preset-desc">Pick exactly what to include, across any unit.</span>
          <span class="ntdl__preset-count">${selection.size} selected</span>
        </button>
      </li>
    </ul>

    ${summaryMarkup(`${unit.icon} Unit ${unit.unit} — ${unit.name}`, picked)}
  `;
}

/** Resources a preset selects inside one unit. */
function presetResources(unit, preset) {
  const types = new Set(preset.types);
  return unitResources(unit).filter((r) => types.has(r.type));
}

function summaryMarkup(heading, list) {
  if (!list.length) {
    return `<div class="ntdl__summary ntdl__summary--empty"><p>Nothing to package yet.</p></div>`;
  }
  const counts = new Map();
  for (const res of list) counts.set(res.typeLabel, (counts.get(res.typeLabel) || 0) + 1);
  const files = list.filter((r) => r.delivery === "file");
  const links = list.filter((r) => r.delivery === "link");
  const scorm = list.filter((r) => r.delivery === "scorm");
  const bytes = files.reduce((n, r) => n + (r.bytes || 0), 0);

  return `<div class="ntdl__summary">
    <h3 class="ntdl__summary-head">${esc(heading)}</h3>
    <p class="ntdl__summary-total"><strong>${list.length}</strong> resource${
      list.length === 1 ? "" : "s"
    }${bytes ? ` · about ${fmtBytes(bytes)}` : ""}</p>
    <ul class="ntdl__summary-list">
      ${[...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([label, n]) => `<li><span>${n}</span> ${esc(label)}</li>`)
        .join("")}
    </ul>
    <p class="ntdl__summary-note">
      ${files.length} file${files.length === 1 ? "" : "s"} packaged${
        scorm.length ? ` · ${scorm.length} SCORM package${scorm.length === 1 ? "" : "s"} built` : ""
      }${
        links.length
          ? ` · ${links.length} live or Google resource${
              links.length === 1 ? "" : "s"
            } listed as working links in <code>00-START-HERE.html</code>`
          : ""
      }.
    </p>
  </div>`;
}

function renderCustom() {
  const query = refs.custom.querySelector(".ntdl__search")?.value || "";
  const activeGroups = new Set(
    [...refs.custom.querySelectorAll(".ntdl__chip.is-on")].map((c) => c.dataset.group),
  );

  refs.custom.innerHTML = `
    <div class="ntdl__tools">
      <label class="ntdl__field ntdl__field--grow">
        <span class="ntdl__field-label">Search</span>
        <input type="search" class="ntdl__search" data-act="search" value="${esc(query)}"
               placeholder="Lesson 3-4, percent, homework, 6.RP.A.3…" />
      </label>
      <div class="ntdl__chips" role="group" aria-label="Filter by resource type">
        ${manifest.groups
          .map(
            (g) =>
              `<button type="button" class="ntdl__chip ${
                activeGroups.has(g.id) ? "is-on" : ""
              }" data-act="group" data-group="${esc(g.id)}" aria-pressed="${activeGroups.has(
                g.id,
              )}">${esc(g.label)}</button>`,
          )
          .join("")}
      </div>
    </div>
    <div class="ntdl__tree">${unitsMarkup(query.trim().toLowerCase(), activeGroups)}</div>
    ${summaryMarkup("Download cart", selectedResources())}
  `;
  const search = refs.custom.querySelector(".ntdl__search");
  if (search && document.activeElement !== search && query) {
    search.focus();
    search.setSelectionRange(query.length, query.length);
  }
}

function matches(res, query, groups) {
  if (groups.size && !groups.has(res.group)) return false;
  if (!query) return true;
  return res.searchText.includes(query);
}

function unitsMarkup(query, groups) {
  const blocks = [];
  for (const unit of manifest.units) {
    const unitHits = unit.resources.filter((r) => matches(r, query, groups));
    const lessonBlocks = [];
    for (const lesson of unit.lessons) {
      const hits = lesson.resources.filter((r) => matches(r, query, groups));
      if (!hits.length) continue;
      lessonBlocks.push(lessonMarkup(lesson, hits, Boolean(query || groups.size)));
    }
    if (!unitHits.length && !lessonBlocks.length) continue;
    const total = unitHits.length + lessonBlocks.length;
    const chosen = [...unitHits, ...unit.lessons.flatMap((l) => l.resources)].filter((r) =>
      selection.has(r.id),
    ).length;
    blocks.push(`
      <details class="ntdl__unit" ${query || groups.size ? "open" : ""}>
        <summary class="ntdl__unit-sum">
          <span class="ntdl__unit-name">${esc(`${unit.icon} Unit ${unit.unit} — ${unit.name}`)}</span>
          <span class="ntdl__unit-meta">${total} group${total === 1 ? "" : "s"}${
            chosen ? ` · ${chosen} selected` : ""
          }</span>
        </summary>
        <div class="ntdl__unit-body">
          <div class="ntdl__rowacts">
            <button type="button" class="ntdl__mini" data-act="select-unit" data-unit="${unit.unit}">Select unit</button>
            <button type="button" class="ntdl__mini" data-act="deselect-unit" data-unit="${unit.unit}">Clear unit</button>
          </div>
          ${unitHits.length ? resourceListMarkup("Unit resources", unitHits) : ""}
          ${lessonBlocks.join("")}
        </div>
      </details>`);
  }
  return (
    blocks.join("") ||
    `<p class="ntdl__empty">No resources match that search. Try a lesson number like <code>3-4</code>, a standard like <code>6.RP.A.3</code>, or a word from a title.</p>`
  );
}

function lessonMarkup(lesson, hits, expanded) {
  const chosen = lesson.resources.filter((r) => selection.has(r.id)).length;
  return `
    <details class="ntdl__lesson" ${expanded ? "open" : ""}>
      <summary class="ntdl__lesson-sum">
        <span class="ntdl__lesson-name">${esc(lesson.label)}</span>
        <span class="ntdl__lesson-meta">${hits.length} resource${hits.length === 1 ? "" : "s"}${
          chosen ? ` · ${chosen} selected` : ""
        }${lesson.standard ? ` · ${esc(lesson.standard)}` : ""}</span>
      </summary>
      <div class="ntdl__lesson-body">
        <div class="ntdl__rowacts">
          <button type="button" class="ntdl__mini" data-act="select-lesson" data-lesson="${esc(
            lesson.id,
          )}">Select lesson</button>
          <button type="button" class="ntdl__mini" data-act="deselect-lesson" data-lesson="${esc(
            lesson.id,
          )}">Clear lesson</button>
        </div>
        ${resourceListMarkup(null, hits)}
      </div>
    </details>`;
}

function resourceListMarkup(heading, list) {
  return `${heading ? `<p class="ntdl__grouphead">${esc(heading)}</p>` : ""}
  <ul class="ntdl__reslist">
    ${list
      .map((res) => {
        const on = selection.has(res.id);
        const badge =
          res.delivery === "file"
            ? `<span class="ntdl__tag ntdl__tag--file">File${
                res.bytes ? ` · ${fmtBytes(res.bytes)}` : ""
              }</span>`
            : res.delivery === "scorm"
              ? `<span class="ntdl__tag ntdl__tag--scorm">SCORM</span>`
              : `<span class="ntdl__tag ntdl__tag--link">${
                  res.external
                    ? "Google / external"
                    : res.teacherOnly
                      ? "Teacher sign-in"
                      : "Live page"
                } · link</span>`;
        return `<li class="ntdl__res">
          <label class="ntdl__check">
            <input type="checkbox" data-act="pick" data-id="${esc(res.id)}" ${on ? "checked" : ""} />
            <span class="ntdl__res-name">${esc(res.label)}</span>
            ${badge}
          </label>
        </li>`;
      })
      .join("")}
  </ul>`;
}

function selectedResources() {
  if (!manifest) return [];
  const out = [];
  for (const id of selection) {
    const res = manifest.byId.get(id);
    if (res) out.push(res);
  }
  return out.sort(
    (a, b) =>
      a.unit - b.unit || String(a.lesson).localeCompare(String(b.lesson)) || a.order - b.order,
  );
}

function renderBar() {
  const list = view === "packages" ? currentPackageList() : selectedResources();
  const n = list.length;
  refs.count.textContent =
    view === "packages"
      ? `${n} resource${n === 1 ? "" : "s"} in this package`
      : `${n} resource${n === 1 ? "" : "s"} selected`;
  const go = dialog.querySelector('[data-act="download"]');
  go.textContent = view === "packages" ? "Download Unit ZIP" : "Download Selected";
  go.disabled = n === 0 || busy;
  dialog.querySelector('[data-act="clear"]').hidden = view === "packages";
}

function currentPackageList() {
  const unit = manifest.units.find((u) => u.unit === activeUnit);
  const preset = manifest.presetById.get(activePreset);
  return unit && preset ? presetResources(unit, preset) : [];
}

/* ---------------------------------------------------------------- events */

function onDialogClick(event) {
  const target = event.target.closest("[data-act], [data-view]");
  if (!target) return;
  if (target.dataset.view) return setView(target.dataset.view);

  switch (target.dataset.act) {
    case "preset":
      activePreset = target.dataset.preset;
      render();
      break;
    case "gocustom":
      setView("custom");
      break;
    case "select-unit":
    case "deselect-unit": {
      const unit = manifest.units.find((u) => u.unit === Number(target.dataset.unit));
      const on = target.dataset.act === "select-unit";
      for (const res of unitResources(unit)) toggle(res.id, on);
      saveSelection();
      render();
      break;
    }
    case "select-lesson":
    case "deselect-lesson": {
      const on = target.dataset.act === "select-lesson";
      const lesson = manifest.units
        .flatMap((u) => u.lessons)
        .find((l) => l.id === target.dataset.lesson);
      for (const res of lesson.resources) toggle(res.id, on);
      saveSelection();
      render();
      break;
    }
    case "group":
      target.classList.toggle("is-on");
      target.setAttribute("aria-pressed", String(target.classList.contains("is-on")));
      renderCustom();
      renderBar();
      break;
    case "clear":
      selection.clear();
      saveSelection();
      render();
      break;
    case "cancel":
      cancelled = true;
      break;
    case "download":
      startDownload();
      break;
    default:
      break;
  }
}

function onDialogChange(event) {
  const el = event.target;
  if (el.dataset.act === "pick") {
    toggle(el.dataset.id, el.checked);
    saveSelection();
    renderBar();
    // Re-render lazily so the summary and per-lesson counts stay honest without
    // stealing focus from the checkbox the teacher just used.
    const summary = refs.custom.querySelector(".ntdl__summary");
    if (summary) summary.outerHTML = summaryMarkup("Download cart", selectedResources());
  } else if (el.dataset.act === "unit") {
    activeUnit = Number(el.value);
    render();
  }
}

let searchTimer = null;
function onDialogInput(event) {
  if (event.target.dataset.act !== "search") return;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    renderCustom();
    renderBar();
  }, 160);
}

function toggle(id, on) {
  if (on) selection.add(id);
  else selection.delete(id);
}

/* -------------------------------------------------------------- packaging */

function setProgress(label, done, total) {
  refs.progress.hidden = false;
  refs.bar.hidden = true;
  refs.progressLabel.textContent = label;
  const pct = total ? Math.round((done / total) * 100) : 0;
  refs.meterFill.style.width = `${pct}%`;
}

function endProgress() {
  refs.progress.hidden = true;
  refs.bar.hidden = false;
}

async function startDownload() {
  if (busy) return;
  const list = view === "packages" ? currentPackageList() : selectedResources();
  if (!list.length) return;

  const bytes = list.reduce((n, r) => n + (r.bytes || 0), 0);
  if (bytes > SIZE_WARN_BYTES) {
    const ok = window.confirm(
      `This package is about ${fmtBytes(bytes)}. Very large downloads can fail on a Chromebook. Continue?`,
    );
    if (!ok) return;
  }

  busy = true;
  cancelled = false;
  renderBar();

  const unit = view === "packages" ? manifest.units.find((u) => u.unit === activeUnit) : null;
  const preset = view === "packages" ? manifest.presetById.get(activePreset) : null;
  const rootName = packageName(list, unit, preset);

  try {
    const { files, failures } = await collect(list, rootName);
    if (cancelled) return;

    setProgress("Building the zip…", list.length, list.length);
    const startHere = startHerePage({ list, failures, unit, preset });
    files[`${rootName}/00-START-HERE.html`] = startHere;
    for (const [folder, entries] of linksByFolder(list, rootName)) {
      files[`${folder}/LINKS.html`] = linksPage(entries, folder);
    }

    const zip = zipStore(files);
    saveBlob(new Blob([zip], { type: "application/zip" }), `${rootName}.zip`);
    reportResult(list, failures);
  } catch (error) {
    endProgress();
    window.alert(`The download could not be built: ${error?.message || error}`);
  } finally {
    busy = false;
    endProgress();
    renderBar();
  }
}

function packageName(list, unit, preset) {
  const clean = safeName;
  if (unit && preset) {
    return preset.id === "complete"
      ? unit.folder
      : clean(`${unit.folder}_${preset.label}`, unit.folder);
  }
  const units = [...new Set(list.map((r) => r.unit))];
  const lessons = [...new Set(list.map((r) => r.lesson).filter(Boolean))];
  if (units.length === 1 && lessons.length === 1) {
    return clean(`Unit-${units[0]}_Lesson-${lessons[0]}`, "EduWonderLab-Resources");
  }
  if (units.length === 1) {
    const only = manifest.units.find((u) => u.unit === units[0]);
    return clean(`${only.folder}_Selected`, "EduWonderLab-Resources");
  }
  return "EduWonderLab_Selected-Resources";
}

/**
 * Mirror of safeName() in scripts/lib/download-taxonomy.mjs. Only the package's
 * own root folder is named here — every entry inside it was already named by the
 * generator — so the two are checked against each other by
 * tools/download-manifest.test.mjs rather than trusted to stay in step.
 */
function safeName(value, fallback = "resource") {
  const cleaned = String(value == null ? "" : value)
    .replace(/[‐-―]/g, "-")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{27BF}\u{FE00}-\u{FE0F}\u{2B00}-\u{2BFF}]/gu, " ")
    .replace(/[·•]/g, " ")
    .replace(/&/g, " and ")
    .replace(/[<>:"/\\|?* -\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+/, "")
    .slice(0, 80)
    .replace(/[-.\s]+$/, "");
  return cleaned || fallback;
}

/**
 * The path a resource takes inside THIS package. zipPath is unit-relative, so a
 * cross-unit cart prefixes each entry with its unit folder — otherwise two units'
 * "Assessments/" folders would merge and their Pre-Tests would collide.
 */
function entryPath(res, rootName, multiUnit, stripFolder) {
  const prefix = multiUnit ? `${rootName}/${res.unitRef.folder}` : rootName;
  const path = stripFolder ? res.zipPath.replace(`${stripFolder}/`, "") : res.zipPath;
  return `${prefix}/${path}`;
}

/**
 * When every resource belongs to ONE lesson, the package root already names that
 * lesson, so repeating it inside would give Unit-3_Lesson-3-1/Lesson-3-1/… .
 */
function soleLessonFolder(list) {
  const folders = new Set(list.map((r) => r.lessonRef?.folder || ""));
  return folders.size === 1 && !folders.has("") ? [...folders][0] : null;
}

async function collect(list, rootName) {
  const multiUnit = new Set(list.map((r) => r.unit)).size > 1;
  const strip = soleLessonFolder(list);
  const fetchable = list.filter((r) => r.delivery === "file" || r.delivery === "scorm");
  const files = {};
  const failures = [];
  const taken = new Set();
  let done = 0;

  const label = () => `Preparing… ${done} of ${fetchable.length} resources`;

  setProgress(label(), 0, fetchable.length);

  const queue = fetchable.slice();
  const workers = Array.from({ length: Math.min(FETCH_CONCURRENCY, queue.length) }, async () => {
    while (queue.length && !cancelled) {
      const res = queue.shift();
      try {
        const bytes = await fetchResource(res);
        let path = entryPath(res, rootName, multiUnit, strip);
        // zipPaths are unique per generated manifest, but a cross-unit cart and
        // an on-the-fly rename can still collide; a duplicate entry silently
        // overwrites, so make it impossible rather than unlikely.
        if (taken.has(path)) {
          const dot = path.lastIndexOf(".");
          path = `${path.slice(0, dot)}-2${path.slice(dot)}`;
        }
        taken.add(path);
        files[path] = bytes;
      } catch (error) {
        failures.push({ res, message: error?.message || String(error) });
      }
      done++;
      setProgress(label(), done, fetchable.length);
    }
  });
  await Promise.all(workers);
  return { files, failures };
}

// SCORM entries point at /api/scorm, which builds the package on demand; file
// entries point at the static asset. Both are ordinary same-origin GETs.
async function fetchResource(res) {
  const response = await fetch(res.url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  if (!buffer.byteLength) throw new Error("empty file");
  return new Uint8Array(buffer);
}

/** Link-only resources grouped by the folder their LINKS.html belongs in. */
function linksByFolder(list, rootName) {
  const multiUnit = new Set(list.map((r) => r.unit)).size > 1;
  const strip = soleLessonFolder(list);
  const map = new Map();
  for (const res of list) {
    if (res.delivery !== "link") continue;
    const base = multiUnit ? `${rootName}/${res.unitRef.folder}` : rootName;
    const folder =
      res.lessonRef && res.lessonRef.folder !== strip ? `${base}/${res.lessonRef.folder}` : base;
    if (!map.has(folder)) map.set(folder, []);
    map.get(folder).push(res);
  }
  return map;
}

/* ------------------------------------------------------------ HTML output */

const PAGE_CSS = `
  :root { color-scheme: light dark; }
  body { margin:0; padding:2rem 1.25rem 3rem; font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;
         background:#eaf0f7; color:#14223a; }
  main { max-width:56rem; margin:0 auto; background:#fff; border-radius:14px;
         box-shadow:0 2px 16px rgba(21,72,127,.12); padding:1.75rem 1.5rem 2rem; }
  h1 { margin:0 0 .25rem; font-size:1.5rem; color:#15487f; }
  h2 { margin:2rem 0 .5rem; font-size:1.15rem; color:#15487f;
       border-bottom:2px solid #d6e0ec; padding-bottom:.3rem; }
  p.lede { margin:.25rem 0 1.25rem; color:#56627a; }
  ul { list-style:none; margin:0; padding:0; }
  li { padding:.6rem .75rem; border:1px solid #d6e0ec; border-radius:10px; margin-bottom:.5rem; }
  a { color:#205fa6; font-weight:600; }
  a:focus-visible, summary:focus-visible { outline:3px solid #256b5b; outline-offset:2px; }
  .meta { display:block; color:#56627a; font-size:.9rem; font-weight:400; }
  .tag { display:inline-block; font-size:.75rem; font-weight:700; letter-spacing:.02em;
         text-transform:uppercase; padding:.1rem .45rem; border-radius:999px;
         background:#e7eff9; color:#15487f; margin-right:.4rem; }
  .warn { background:#fff6e8; border-color:#e6c489; }
  footer { margin-top:2rem; color:#56627a; font-size:.9rem; }
  @media (prefers-color-scheme: dark) {
    body { background:#101827; color:#e8eef7; }
    main { background:#182333; box-shadow:none; }
    h1,h2 { color:#9dc4f0; } h2 { border-color:#2c3d55; }
    li { border-color:#2c3d55; } a { color:#8fc0f5; }
    .tag { background:#22344b; color:#bfd8f5; } .warn { background:#3a2f1c; border-color:#7a6234; }
  }
`;

function page(title, bodyHtml) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(title)}</title>
<style>${PAGE_CSS}</style>
</head>
<body>
<main>
${bodyHtml}
<footer>EduWonderLab · Neft Teacher — Grade 6 Math. Links open the live site and need internet access.</footer>
</main>
</body>
</html>
`;
}

function linkItem(res) {
  const href = `https://eduwonderlab.com${res.url}`;
  const why = res.external
    ? "Lives in Google Drive — open it there to view, copy or download."
    : res.teacherOnly
      ? "Teacher-only page. Sign in with the class password to open it."
      : "A live, interactive page — it needs the website to run, so it cannot be packaged as a file.";
  return `<li>
    <span class="tag">${esc(res.typeLabel)}</span>
    <a href="${esc(href)}">${esc(res.label)}</a>
    <span class="meta">${res.lessonRef ? `${esc(res.lessonRef.label)} · ` : ""}Unit ${
      res.unit
    } — ${esc(why)}</span>
  </li>`;
}

function linksPage(entries, folder) {
  const where = folder.split("/").pop();
  return page(
    `Links — ${where}`,
    `<h1>Live &amp; Google resources</h1>
     <p class="lede">These ${entries.length} resource${
       entries.length === 1 ? "" : "s"
} could not be saved as files. Each link below opens the real thing.</p>
     <ul>${entries.map(linkItem).join("")}</ul>`,
  );
}

function startHerePage({ list, failures, unit, preset }) {
  const files = list.filter((r) => r.delivery === "file");
  const scorm = list.filter((r) => r.delivery === "scorm");
  const links = list.filter((r) => r.delivery === "link");
  const included = files.length + scorm.length - failures.length;

  const heading = unit ? `${unit.icon} Unit ${unit.unit} — ${unit.name}` : "Selected resources";
  const counts = new Map();
  for (const res of list) counts.set(res.typeLabel, (counts.get(res.typeLabel) || 0) + 1);

  return page(
    `Start here — ${heading}`,
    `<h1>${esc(heading)}</h1>
     <p class="lede">${
       preset ? `${esc(preset.label)} · ` : ""
}${list.length} resource${list.length === 1 ? "" : "s"} requested · ${included} packaged as file${
       included === 1 ? "" : "s"
} · ${links.length} listed as link${links.length === 1 ? "" : "s"}.</p>

     <h2>What is in this folder</h2>
     <ul>${[...counts.entries()]
       .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
       .map(([label, n]) => `<li><strong>${n}</strong> ${esc(label)}</li>`)
       .join("")}</ul>

     ${
       scorm.length
         ? `<h2>Canvas / SCORM</h2>
            <p>The <code>SCORM/</code> folders hold one ready-to-upload SCORM 1.2 package per
            activity. Canvas imports SCORM one package per assignment, so upload them
            individually — do not unzip them first.</p>`
         : ""
}

     ${
       links.length
         ? `<h2>Live &amp; Google resources (${links.length})</h2>
            <p>These run on the website or in Google Drive, so there is no file to save.
            Open them from here — or from the <code>LINKS.html</code> inside each lesson folder.</p>
            <ul>${links.map(linkItem).join("")}</ul>`
         : ""
}

     ${
       failures.length
         ? `<h2>Could not be included (${failures.length})</h2>
            <p>Every one of these was requested. None was skipped silently — open the live
            version instead.</p>
            <ul>${failures
              .map(
                (f) => `<li class="warn">
                  <span class="tag">${esc(f.res.typeLabel)}</span>
                  <a href="https://eduwonderlab.com${esc(f.res.url)}">${esc(f.res.title)}</a>
                  <span class="meta">${esc(f.message)}</span>
                </li>`,
              )
              .join("")}</ul>`
         : `<h2>Nothing was left out</h2>
            <p>Every requested file was packaged.</p>`
}
     <h2>A note on saved web pages</h2>
     <p>Guided notes, worksheets, homework and slide decks are saved as real
     <code>.html</code> files you can print. They were built for the website, so pictures and
     interactive parts still load from <a href="https://eduwonderlab.com/">eduwonderlab.com</a>
     when you are online. PDFs and Word documents work fully offline.</p>`,
  );
}

/* ---------------------------------------------------------------- results */

function reportResult(list, failures) {
  if (!failures.length) return;
  const lines = failures
    .slice(0, 6)
    .map((f) => `• ${f.res.title} (${f.message})`)
    .join("\n");
  window.alert(
    `${list.length - failures.length} of ${list.length} resources added.\n\n` +
      `These could not be included:\n${lines}` +
      (failures.length > 6 ? `\n…and ${failures.length - 6} more.` : "") +
      `\n\n00-START-HERE.html in the zip lists every one with a working link.`,
  );
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* -------------------------------------------------------------------- api */

async function open(options = {}) {
  ensureDialog();
  try {
    await loadManifest();
  } catch (error) {
    window.alert(`The resource list could not be loaded: ${error?.message || error}`);
    return;
  }

  if (options.lesson) {
    const lesson = manifest.units.flatMap((u) => u.lessons).find((l) => l.id === options.lesson);
    if (lesson) {
      // A lesson action opens Custom with that lesson ADDED to the cart — never
      // an instant download (nobody should be surprised by a 20 MB file), and
      // never a replacement (a teacher three lessons into a cart would lose it).
      for (const res of lesson.resources) {
        if (res.delivery !== "scorm") selection.add(res.id);
      }
      saveSelection();
      activeUnit = lesson.unitRef.unit;
      setView("custom");
      if (!dialog.open) dialog.showModal();
      const search = dialog.querySelector(".ntdl__search");
      if (search) {
        search.value = lesson.id;
        renderCustom();
        renderBar();
      }
      return;
    }
  }

  if (options.unit) {
    activeUnit = Number(options.unit);
    activePreset = options.preset || "complete";
    setView("packages");
  } else {
    setView(options.view || "packages");
  }
  if (!dialog.open) dialog.showModal();
}

window.NTCurriculumDownload = { open };

/* -------------------------------------------------------------- launchers */

/**
 * Add "Download Unit" / "Download Lesson" actions to /curriculum/units/.
 *
 * That page ships static `details.unit` markup, but curriculum-hub-search.js
 * reads it, hides it, and re-renders the page as `.unit-card`s with a lesson
 * `<select>` — so anything attached to the static markup is attached to
 * something the teacher never sees. The buttons go on the RENDERED cards, in the
 * existing `.unit-resources-row` and lesson selector, wearing the page's own
 * `unit-resource-btn` class so they look native rather than bolted on.
 *
 * The hub re-renders on search, so this re-attaches on mutation and is a no-op
 * when its buttons are already present.
 */
const LESSON_ID_PATTERNS = [
  [/^Lesson\s+(\d+-\d+)/i, (m) => m[1]],
  [/^(\d+)\.(\d+)\s+Small Group:\s*Group\s*([12])/i, (m) => `${m[1]}-${m[2]}-group${m[3]}`],
  [/^(\d+)\.(\d+)\s+Catch-?Up/i, (m) => `${m[1]}-${m[2]}-catchup`],
];

function lessonIdFromLabel(text) {
  for (const [pattern, build] of LESSON_ID_PATTERNS) {
    const match = pattern.exec(String(text || "").trim());
    if (match) return build(match);
  }
  return null;
}

function makeTrigger(label, ariaLabel, extraClass) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `unit-resource-btn ntdl-trigger hub-teacher-only${extraClass ? ` ${extraClass}` : ""}`;
  button.dataset.ntDownload = "";
  button.textContent = label;
  button.setAttribute("aria-label", ariaLabel);
  return button;
}

function decorateUnitCards() {
  for (const card of document.querySelectorAll(".unit-card[id^='unit-']")) {
    const num = Number(card.id.slice("unit-".length));
    if (!Number.isFinite(num)) continue;

    if (!card.querySelector("[data-nt-download-unit]")) {
      let row = card.querySelector(".unit-resources-row");
      if (!row) {
        row = document.createElement("div");
        row.className = "unit-resources-row";
        card.querySelector(".unit-card-header")?.after(row);
      }
      const button = makeTrigger("⬇️ Download Unit", `Choose a download package for Unit ${num}`);
      button.dataset.ntDownloadUnit = String(num);
      row.appendChild(button);
    }

    const select = card.querySelector(".lesson-select");
    const group = card.querySelector(".selector-group--lesson");
    if (!select || !group || group.querySelector("[data-nt-download-lesson]")) continue;

    const button = makeTrigger(
      "⬇️ Download Lesson",
      "Add this lesson's resources to the download cart",
      "ntdl-trigger--lesson",
    );
    const sync = () => {
      const id = lessonIdFromLabel(select.options[select.selectedIndex]?.textContent);
      // No id means the option is something this downloader has no inventory
      // for; hiding the button beats offering a download that cannot resolve.
      button.hidden = !id;
      if (id) {
        button.dataset.ntDownloadLesson = id;
        button.setAttribute("aria-label", `Add Lesson ${id} resources to the download cart`);
      }
    };
    select.addEventListener("change", sync);
    sync();
    group.appendChild(button);
  }
}

function wireUnitsPage() {
  const hub = document.getElementById("interactive-hub");
  if (!hub) return;
  decorateUnitCards();
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      decorateUnitCards();
    });
  }).observe(hub, { childList: true, subtree: true });
}

function wire() {
  wireUnitsPage();
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-nt-download]");
    if (!trigger) return;
    event.preventDefault();
    open({
      unit: trigger.dataset.ntDownloadUnit,
      lesson: trigger.dataset.ntDownloadLesson,
      view: trigger.dataset.ntDownloadView,
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", wire, { once: true });
} else {
  wire();
}
