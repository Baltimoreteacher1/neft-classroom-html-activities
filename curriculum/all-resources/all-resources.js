/* all-resources.js — behaviour for /curriculum/all-resources/.
 *
 * One directory over two sources of truth, neither copied here:
 *   /data/curriculum-download-manifest.json  every lesson and unit file, link and package
 *   ./tools.json                             every /curriculum/<tool>/ page (generated)
 * Filter state lives in the query string, so a refresh, the back button and a
 * shared link all land on the same view. No inline handlers; listeners only. */

const MANIFEST_URL = "/data/curriculum-download-manifest.json";
const TOOLS_URL = "./tools.json";
const PAGE_SIZE = 100;
const LEADING_PICTOGRAPHS = /^[\p{Extended_Pictographic}️‍\s]+/u;

const state = { view: "materials", q: "", unit: "", group: "", category: "", shown: PAGE_SIZE };
let data = { units: [], groups: [], rows: [], tools: [], categories: [] };

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const plural = (n, one, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/* ---------- data ------------------------------------------------------- */

function formatSize(bytes) {
  if (!bytes) return "";
  return bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatOf(r) {
  if (r.delivery === "scorm") return "SCORM";
  const path = (r.file || r.url).split("?")[0];
  const ext = path.includes(".") ? path.split(".").pop().toLowerCase() : "";
  return ["html", "pdf", "docx", "pptx", "md"].includes(ext) ? ext.toUpperCase() : "Page";
}

/** Flatten unit-level and lesson-level resources into one searchable list. */
export function flatten(manifest) {
  const typeById = new Map(manifest.types.map((t) => [t.id, t]));
  const rows = [];
  const push = (unit, lesson, r) => {
    const type = typeById.get(r.type);
    const name = (r.label || type?.label || r.type).replace(LEADING_PICTOGRAPHS, "");
    const lessonId = lesson?.id ?? "";
    const lessonEn = lesson?.title?.en ?? "";
    const lessonEs = lesson?.title?.es ?? "";
    const row = {
      unit: unit.unit,
      lessonId,
      lessonEn,
      lessonEs,
      variant: lesson && lesson.kind !== "lesson" ? lesson.level || "Catch-up" : "",
      group: type?.group ?? "extensions",
      typeLabel: type?.label ?? r.type,
      name,
      section: r.section || "",
      note: r.note || "",
      url: r.url,
      download: r.delivery === "file" || r.delivery === "scorm",
      format: formatOf(r),
      size: r.delivery === "file" ? formatSize(r.bytes) : "",
      teacherOnly: Boolean(r.teacherOnly),
    };
    row.hay = [
      name,
      row.typeLabel,
      row.section,
      row.note,
      lessonId,
      lessonEn,
      lessonEs,
      row.variant,
      `unit ${unit.unit}`,
    ]
      .join(" ")
      .toLowerCase();
    rows.push(row);
  };
  for (const unit of manifest.units) {
    for (const r of unit.resources ?? []) push(unit, null, r);
    for (const lesson of unit.lessons ?? [])
      for (const r of lesson.resources ?? []) push(unit, lesson, r);
  }
  return rows;
}

/* ---------- filtering -------------------------------------------------- */

const terms = () => state.q.toLowerCase().split(/\s+/).filter(Boolean);

function matchRow(r, ignore = "") {
  if (ignore !== "unit" && state.unit && String(r.unit) !== state.unit) return false;
  if (ignore !== "group" && state.group && r.group !== state.group) return false;
  return terms().every((t) => r.hay.includes(t));
}

function matchTool(t, ignore = "") {
  if (ignore !== "category" && state.category && t.category !== state.category) return false;
  const hay = `${t.title} ${t.description} ${t.url}`.toLowerCase();
  return terms().every((w) => hay.includes(w));
}

function countBy(list, key, test, ignore) {
  const counts = new Map();
  for (const item of list)
    if (test(item, ignore)) counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
  return counts;
}

/* ---------- URL state -------------------------------------------------- */

function readUrl() {
  const p = new URLSearchParams(location.search);
  state.view = p.get("view") === "tools" ? "tools" : "materials";
  state.q = p.get("q") ?? "";
  state.unit = p.get("unit") ?? "";
  state.group = p.get("group") ?? "";
  state.category = p.get("category") ?? "";
  state.shown = PAGE_SIZE;
}

function writeUrl(push = false) {
  const p = new URLSearchParams();
  if (state.view === "tools") p.set("view", "tools");
  for (const k of ["q", "unit", "group", "category"]) if (state[k]) p.set(k, state[k]);
  const query = p.toString();
  const url = `${location.pathname}${query ? `?${query}` : ""}`;
  if (url !== `${location.pathname}${location.search}`)
    history[push ? "pushState" : "replaceState"](null, "", url);
}

/* ---------- rendering -------------------------------------------------- */

function chip(kind, value, label, count, active) {
  const zero = count === 0 && !active;
  return `<button type="button" class="ar-chip" data-kind="${kind}" data-value="${esc(value)}"${
    kind === "unit" && value ? ` data-unit="${esc(value)}"` : ""
  } aria-pressed="${active}"${zero ? ' data-empty="true"' : ""}><span class="ar-chip-label">${esc(label)}</span><span class="ar-count">${count}</span></button>`;
}

function renderFilters() {
  const body = $("ar-filter-body");
  if (state.view === "tools") {
    const counts = countBy(data.tools, "category", matchTool, "category");
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    body.innerHTML = `<fieldset class="ar-facet"><legend>Purpose</legend>${chip("category", "", "All tools", total, !state.category)}${data.categories
      .map((c) => chip("category", c.id, c.label, counts.get(c.id) ?? 0, state.category === c.id))
      .join("")}</fieldset>`;
    return;
  }
  const unitCounts = countBy(data.rows, "unit", matchRow, "unit");
  const groupCounts = countBy(data.rows, "group", matchRow, "group");
  const unitTotal = [...unitCounts.values()].reduce((a, b) => a + b, 0);
  const groupTotal = [...groupCounts.values()].reduce((a, b) => a + b, 0);
  body.innerHTML = `<fieldset class="ar-facet"><legend>Unit</legend>${chip("unit", "", "All units", unitTotal, !state.unit)}${data.units
    .map((u) =>
      chip(
        "unit",
        String(u.unit),
        `${u.unit} · ${u.name}`,
        unitCounts.get(u.unit) ?? 0,
        state.unit === String(u.unit),
      ),
    )
    .join(
      "",
    )}</fieldset><fieldset class="ar-facet"><legend>Type</legend>${chip("group", "", "All types", groupTotal, !state.group)}${data.groups
    .map((g) => chip("group", g.id, g.label, groupCounts.get(g.id) ?? 0, state.group === g.id))
    .join("")}</fieldset>`;
}

function rowHtml(r) {
  const meta = [r.typeLabel !== r.name ? r.typeLabel : "", r.section, r.format, r.size]
    .filter(Boolean)
    .join(" · ");
  const lock = r.teacherOnly
    ? '<span class="ar-badge"><svg class="ar-ico" aria-hidden="true"><use href="#i-lock"/></svg>Teacher</span>'
    : "";
  const verb = r.format === "SCORM" ? "Download SCORM" : "Download";
  return `<li class="ar-row"><svg class="ar-ico ar-ico--type" aria-hidden="true"><use href="#i-${esc(r.group)}"/></svg><div class="ar-main"><a class="ar-name" href="${esc(r.url)}">${esc(r.name)}</a>${lock}<p class="ar-meta">${esc(meta)}</p></div><div class="ar-actions"><a class="ar-btn" href="${esc(r.url)}"><svg class="ar-ico" aria-hidden="true"><use href="#i-open"/></svg>Open<span class="ar-sr"> ${esc(r.name)}</span></a>${
    r.download
      ? `<a class="ar-btn ar-btn--quiet" href="${esc(r.url)}" download><svg class="ar-ico" aria-hidden="true"><use href="#i-download"/></svg>${verb}<span class="ar-sr"> ${esc(r.name)}</span></a>`
      : ""
  }</div></li>`;
}

function lessonHeading(r) {
  const title = r.lessonId
    ? `Lesson ${r.lessonId}${r.lessonEn ? ` · ${r.lessonEn}` : ""}`
    : "Unit resources";
  const variant = r.variant
    ? `<span class="ar-badge ar-badge--variant">${esc(r.variant)}</span>`
    : "";
  const es = r.lessonEs ? `<span class="ar-es" lang="es">${esc(r.lessonEs)}</span>` : "";
  return `<h4 class="ar-lesson">${esc(title)}${variant}${es}</h4>`;
}

function unitOverview() {
  const counts = countBy(data.rows, "unit", () => true);
  return `<ul class="ar-units">${data.units
    .map(
      (u) =>
        `<li data-unit="${u.unit}"><button type="button" class="ar-unit" data-kind="unit" data-value="${u.unit}"><span class="ar-unit-num">Unit ${u.unit}</span><span class="ar-unit-name">${esc(u.name)}</span><span class="ar-unit-count">${plural(counts.get(u.unit) ?? 0, "resource")}</span></button></li>`,
    )
    .join("")}</ul>`;
}

function renderMaterials() {
  const filtered = state.q || state.unit || state.group;
  const matches = data.rows.filter((r) => matchRow(r));
  const visible = matches.slice(0, state.shown);
  let html = "";
  if (!filtered) html += unitOverview();
  else if (!matches.length)
    html += '<p class="ar-empty">Nothing matches. Try fewer words, or clear a filter.</p>';
  else {
    let unit = null;
    let lesson = null;
    html += '<div class="ar-groups">';
    for (const r of visible) {
      const unitName = data.units.find((u) => u.unit === r.unit)?.name ?? "";
      if (r.unit !== unit) {
        if (unit !== null) html += "</ul></section>";
        unit = r.unit;
        lesson = null;
        html += `<section class="ar-unit-block" data-unit="${r.unit}"><h3 class="ar-unit-head">Unit ${r.unit} · ${esc(unitName)}</h3>`;
      }
      const key = `${r.unit}|${r.lessonId}|${r.variant}`;
      if (key !== lesson) {
        if (lesson !== null) html += "</ul>";
        lesson = key;
        html += `${lessonHeading(r)}<ul class="ar-list">`;
      }
      html += rowHtml(r);
    }
    html += "</ul></section></div>";
  }
  $("ar-results").innerHTML = html;
  $("ar-more").hidden = !filtered || visible.length >= matches.length;
  $("ar-status").textContent = filtered
    ? `Showing ${visible.length.toLocaleString("en-US")} of ${plural(matches.length, "resource")}.`
    : `${plural(data.rows.length, "resource")} across ${data.units.length} units. Pick a unit or type to search.`;
}

function renderTools() {
  const matches = data.tools.filter((t) => matchTool(t));
  const catLabel = new Map(data.categories.map((c) => [c.id, c.label]));
  $("ar-results").innerHTML = matches.length
    ? `<ul class="ar-list ar-list--tools">${matches
        .map(
          (t) =>
            `<li class="ar-row"><svg class="ar-ico ar-ico--type" aria-hidden="true"><use href="#i-tool"/></svg><div class="ar-main"><a class="ar-name" href="${esc(t.url)}">${esc(t.title)}</a>${
              t.teacherOnly
                ? '<span class="ar-badge"><svg class="ar-ico" aria-hidden="true"><use href="#i-lock"/></svg>Teacher</span>'
                : ""
            }<p class="ar-meta">${esc(catLabel.get(t.category) ?? t.category)}${t.description ? ` · ${esc(t.description)}` : ""}</p></div><div class="ar-actions"><a class="ar-btn" href="${esc(t.url)}"><svg class="ar-ico" aria-hidden="true"><use href="#i-open"/></svg>Open<span class="ar-sr"> ${esc(t.title)}</span></a></div></li>`,
        )
        .join("")}</ul>`
    : '<p class="ar-empty">No tool matches. Try fewer words, or clear a filter.</p>';
  $("ar-more").hidden = true;
  $("ar-status").textContent =
    `${plural(matches.length, "tool")} and studio${matches.length === 1 ? "" : "s"}.`;
}

function render() {
  for (const b of document.querySelectorAll(".ar-view"))
    b.setAttribute("aria-pressed", String(b.dataset.view === state.view));
  const q = $("ar-q");
  if (q.value !== state.q) q.value = state.q;
  renderFilters();
  if (state.view === "tools") renderTools();
  else renderMaterials();
}

/* ---------- events ----------------------------------------------------- */

function onClick(event) {
  const view = event.target.closest(".ar-view");
  if (view) {
    Object.assign(state, {
      view: view.dataset.view,
      unit: "",
      group: "",
      category: "",
      shown: PAGE_SIZE,
    });
    writeUrl(true);
    return render();
  }
  const pick = event.target.closest("[data-kind]");
  if (pick && !pick.dataset.empty) {
    const { kind, value } = pick.dataset;
    state[kind] = state[kind] === value ? "" : value;
    state.shown = PAGE_SIZE;
    writeUrl(true);
    render();
    return;
  }
  if (event.target.closest("#ar-more")) {
    state.shown += PAGE_SIZE;
    renderMaterials();
  }
}

let typing = 0;
function onInput(event) {
  state.q = event.target.value.trim();
  state.shown = PAGE_SIZE;
  clearTimeout(typing);
  typing = setTimeout(() => {
    writeUrl(false);
    render();
  }, 120);
}

function bind() {
  document.addEventListener("click", onClick);
  $("ar-q").addEventListener("input", onInput);
  addEventListener("popstate", () => {
    readUrl();
    render();
  });
  const mobile = matchMedia("(max-width: 860px)");
  const fold = () => {
    $("ar-filters").open = !mobile.matches;
  };
  fold();
  mobile.addEventListener("change", fold);
}

/* ---------- boot ------------------------------------------------------- */

async function loadJson(url) {
  if (window.NTJsonCache) return window.NTJsonCache.json(url);
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

async function boot() {
  try {
    const [manifest, tools] = await Promise.all([loadJson(MANIFEST_URL), loadJson(TOOLS_URL)]);
    data = {
      units: manifest.units.map((u) => ({ unit: u.unit, name: u.name })),
      groups: manifest.groups,
      rows: flatten(manifest),
      tools: tools.tools,
      categories: tools.categories,
    };
    $("ar-lede").textContent =
      `${plural(data.rows.length, "lesson and unit file")} and ${plural(data.tools.length, "tool")} for Grade 6 math, in one place.`;
    readUrl();
    bind();
    render();
  } catch (error) {
    $("ar-status").textContent =
      "The directory could not load. Open Units & lessons or the curriculum hub to reach every resource.";
    console.error("all-resources:", error);
  }
}

if (typeof document !== "undefined" && document.getElementById("ar-results")) boot();
