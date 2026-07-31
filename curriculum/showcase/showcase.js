/* =============================================================================
 * Student Work Gallery — /curriculum/showcase/
 * -----------------------------------------------------------------------------
 * Vanilla ES module. No build step, no npm, no CDN.
 *
 * Reads:
 *   /data/student-showcase.json        committed curriculum exemplars (seed)
 *   /api/showcase                      live TEACHER-APPROVED student work
 *   /data/curriculum-nervous-system.json  standard labels, fullText, assets[]
 *
 * Safety rules this file keeps (see functions/api/showcase.js for the full
 * consent and moderation model):
 *   - Only items with state "approved" are ever rendered in the public gallery.
 *   - Every string from the network is written with textContent. innerHTML is
 *     never used with data. Charts are built with createElementNS from numbers.
 *   - Display names fail closed: unless the consent mode explicitly says
 *     firstNameInitial AND the stored value is "First L." shaped, the byline is
 *     the anonymous label.
 *   - Links are same-origin paths only; anything else is dropped.
 *   - The teacher moderation view (?moderate=1) renders no student data at all
 *     until the stored teacher key is accepted by the API.
 * ========================================================================== */

const SEED_URL = "/data/student-showcase.json";
const NS_URL = "/data/curriculum-nervous-system.json";
const API_URL = "/api/showcase";
const TEACHER_KEY_LS = "neft.teacher.key";
const ANON_LABEL = "A Grade 6 mathematician";
const SVG_NS = "http://www.w3.org/2000/svg";
const MAX_POINT_ROWS = 12;

const state = {
  groupBy: "standard",
  filter: "",
  items: [],
  nodes: new Map(),
  domains: {},
  queueState: "pending",
};

/* -------------------------------------------------------------------- dom */

function el(tag, className, textContent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textContent !== undefined && textContent !== null) node.textContent = String(textContent);
  return node;
}

function svgEl(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const key of Object.keys(attrs || {})) node.setAttribute(key, String(attrs[key]));
  return node;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------- normalise */

function str(value) {
  return typeof value === "string" ? value : "";
}

// Same-origin paths only — mirrors cleanLinkPath() on the server.
function safePath(value) {
  const raw = str(value).trim();
  if (!raw) return "";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "";
  if (raw.includes("..") || raw.includes(":") || raw.includes("\\")) return "";
  return raw;
}

function displayNameOf(item) {
  const mode = str(item.displayMode) || str(item.display_mode);
  const name = str(item.displayName) || str(item.display_name);
  if (mode === "firstNameInitial" && /^[A-Za-z][A-Za-z'-]{0,19} [A-Z]\.$/.test(name)) return name;
  return ANON_LABEL;
}

function normalizeItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const caption = str(raw.caption).trim();
  const standard = str(raw.standard).trim();
  if (!caption || !standard) return null;
  return {
    id: str(raw.id) || `${standard}-${caption.slice(0, 24)}`,
    standard,
    caption,
    explanation: str(raw.explanation).trim(),
    linkPath: safePath(raw.linkPath || raw.link_path),
    data: raw.data && typeof raw.data === "object" ? raw.data : null,
    displayMode: str(raw.displayMode) || str(raw.display_mode) || "anonymous",
    displayName: str(raw.displayName) || str(raw.display_name),
    state: str(raw.state) || "approved",
    source: raw.source === "curriculum-exemplar" ? "curriculum-exemplar" : "student-submission",
    createdAt: str(raw.createdAt) || str(raw.created_at),
    approvedAt: str(raw.approvedAt) || str(raw.approved_at),
  };
}

/* ------------------------------------------------------------------ data */

async function getJson(url, options) {
  try {
    const res = await fetch(url, options || {});
    // Parse the body even on 4xx/5xx: the API reports why a submission was
    // rejected in `error`, and the student needs to be told which field to fix.
    let body = null;
    try {
      body = await res.json();
    } catch (_e) {
      body = null;
    }
    return { ok: res.ok, status: res.status, body };
  } catch (_e) {
    return { ok: false, status: 0, body: null };
  }
}

async function loadNervousSystem() {
  const res = await getJson(NS_URL);
  const body = res.body;
  if (!body || !Array.isArray(body.nodes)) return;
  state.domains = body.domains && typeof body.domains === "object" ? body.domains : {};
  for (const node of body.nodes) {
    if (node && typeof node.id === "string") state.nodes.set(node.id, node);
  }
}

async function loadItems() {
  const [seed, live] = await Promise.all([getJson(SEED_URL), getJson(API_URL)]);

  const merged = new Map();
  const push = (raw) => {
    const item = normalizeItem(raw);
    if (!item) return;
    if (item.state !== "approved") return; // public gallery: approved only
    if (!merged.has(item.id)) merged.set(item.id, item);
  };

  // Live student work first so it wins any id collision with the seed.
  if (live.body && Array.isArray(live.body.items)) live.body.items.forEach(push);
  if (seed.body && Array.isArray(seed.body.items)) seed.body.items.forEach(push);

  state.items = Array.from(merged.values());
}

/* ---------------------------------------------------------------- charts */

function cleanPoints(data, limit) {
  const points = Array.isArray(data && data.points) ? data.points.slice(0, limit || 12) : [];
  const out = [];
  for (const p of points) {
    if (!p || typeof p !== "object") continue;
    const value = Number(p.value);
    if (!Number.isFinite(value)) continue;
    out.push({ label: str(p.label).slice(0, 24), value });
  }
  return out;
}

function chartFrame(points, kindLabel, data) {
  const W = 360;
  const H = 186;
  const pad = { l: 10, r: 10, t: 18, b: 30 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;
  const values = points.map((p) => p.value);
  const top = Math.max(0, ...values);
  const bottom = Math.min(0, ...values);
  const span = top - bottom || 1;
  const zeroY = pad.t + ((top - 0) / span) * plotH;
  const yFor = (v) => pad.t + ((top - v) / span) * plotH;
  const svg = svgEl("svg", {
    class: "chart",
    viewBox: `0 0 ${W} ${H}`,
    // Explicit width/height keep the intrinsic ratio so `height: auto` in the
    // stylesheet resolves everywhere, not just in viewBox-aware engines.
    width: W,
    height: H,
    role: "img",
    "aria-label": `${str(data.title) || kindLabel}: ${points
      .map((p) => `${p.label} ${p.value}${str(data.unit) ? " " + str(data.unit) : ""}`)
      .join(", ")}`,
    focusable: "false",
  });
  svg.appendChild(
    svgEl("line", { class: "chart-axis", x1: pad.l, y1: zeroY, x2: W - pad.r, y2: zeroY }),
  );
  return { svg, W, H, pad, plotW, plotH, zeroY, yFor, span, top };
}

function addLabel(svg, cls, x, y, value) {
  const node = svgEl("text", { class: cls, x, y, "text-anchor": "middle" });
  node.textContent = String(value);
  svg.appendChild(node);
}

function buildChart(data) {
  if (!data || typeof data !== "object") return null;
  const points = cleanPoints(data, 12);
  if (points.length < 2) return null;
  const kind = ["bar", "line", "dot"].includes(data.kind) ? data.kind : "bar";
  const f = chartFrame(points, kind === "dot" ? "Dot plot" : "Chart", data);
  const slot = f.plotW / points.length;

  if (kind === "line") {
    const coords = points.map((p, i) => ({
      x: f.pad.l + slot * i + slot / 2,
      y: f.yFor(p.value),
      p,
    }));
    f.svg.appendChild(
      svgEl("polyline", {
        class: "chart-line",
        points: coords.map((c) => `${c.x},${c.y}`).join(" "),
      }),
    );
    coords.forEach((c) => {
      f.svg.appendChild(svgEl("circle", { class: "chart-dot", cx: c.x, cy: c.y, r: 3.5 }));
      addLabel(f.svg, "chart-value", c.x, c.y - 7, c.p.value);
      addLabel(f.svg, "chart-label", c.x, f.H - 9, c.p.label);
    });
  } else if (kind === "dot") {
    // Dot plot: one dot per observation, stacked above its value on the line.
    points.forEach((p, i) => {
      const cx = f.pad.l + slot * i + slot / 2;
      const count = Math.max(0, Math.min(20, Math.round(p.value)));
      for (let d = 0; d < count; d += 1) {
        f.svg.appendChild(
          svgEl("circle", {
            class: "chart-dot",
            cx,
            cy: f.zeroY - 7 - d * Math.min(9, (f.plotH - 12) / Math.max(1, count)),
            r: 3.2,
          }),
        );
      }
      addLabel(f.svg, "chart-label", cx, f.H - 9, p.label);
    });
  } else {
    const barW = Math.max(8, Math.min(44, slot * 0.62));
    points.forEach((p, i) => {
      const cx = f.pad.l + slot * i + slot / 2;
      const y = f.yFor(Math.max(p.value, 0));
      const h = Math.max(1, (Math.abs(p.value) / f.span) * f.plotH);
      f.svg.appendChild(
        svgEl("rect", {
          class: p.value < 0 ? "chart-bar-neg" : "chart-bar",
          x: cx - barW / 2,
          y: p.value < 0 ? f.zeroY : y,
          width: barW,
          height: h,
          rx: 3,
        }),
      );
      addLabel(f.svg, "chart-value", cx, p.value < 0 ? f.zeroY + h + 10 : y - 4, p.value);
      addLabel(f.svg, "chart-label", cx, f.H - 9, p.label);
    });
  }
  return f.svg;
}

/* ----------------------------------------------------------------- cards */

function lessonLinksFor(standardId) {
  const node = state.nodes.get(standardId);
  if (!node || !Array.isArray(node.assets)) return [];
  return node.assets
    .filter((a) => a && a.category === "Lesson" && safePath(a.path))
    .slice(0, 4)
    .map((a) => ({ title: str(a.title) || str(a.path), path: safePath(a.path) }));
}

function standardHeading(standardId) {
  const node = state.nodes.get(standardId);
  if (!node) return standardId;
  const short = str(node.shortLabel) || str(node.label) || "";
  return short ? `${standardId} — ${short}` : standardId;
}

function buildCard(item, opts) {
  const options = opts || {};
  const card = el("li", "card");
  card.appendChild(el("h3", null, item.caption));

  if (item.data && str(item.data.title)) card.appendChild(el("p", "chart-title", item.data.title));
  const chart = buildChart(item.data);
  if (chart) {
    card.appendChild(chart);
    const axis = [str(item.data.xLabel), str(item.data.yLabel)].filter(Boolean).join(" vs. ");
    if (axis) card.appendChild(el("p", "chart-caption", axis));
  }

  if (item.explanation) card.appendChild(el("p", "explanation", item.explanation));

  const meta = el("div", "meta");
  if (item.source === "curriculum-exemplar") {
    meta.appendChild(el("span", "badge example", "Example entry"));
    meta.appendChild(el("span", null, "Written by the teacher to show what belongs here"));
  } else {
    meta.appendChild(el("span", "badge", "Student work"));
    meta.appendChild(el("span", null, displayNameOf(item)));
  }
  card.appendChild(meta);

  const actions = el("div", "card-actions");
  if (options.showStandard !== false) {
    const chip = el("span", "chip", standardHeading(item.standard));
    actions.appendChild(chip);
  }
  if (item.linkPath) {
    const link = el("a", null, "See the full piece of work");
    link.href = item.linkPath;
    actions.appendChild(link);
  }
  for (const lesson of lessonLinksFor(item.standard).slice(0, 1)) {
    const link = el("a", null, `Lesson that teaches it: ${lesson.title}`);
    link.href = lesson.path;
    actions.appendChild(link);
  }
  if (actions.childNodes.length) card.appendChild(actions);
  return card;
}

/* ---------------------------------------------------------------- groups */

function groupKeyFor(item) {
  const node = state.nodes.get(item.standard);
  if (state.groupBy === "domain") {
    const domain = node ? str(node.domain) : "";
    return domain || "OTHER";
  }
  if (state.groupBy === "unit") {
    const units = node && Array.isArray(node.units) ? node.units : [];
    return units.length ? `unit-${units[0]}` : "unit-none";
  }
  return item.standard;
}

function groupLabelFor(key) {
  if (state.groupBy === "domain") return state.domains[key] || key;
  if (state.groupBy === "unit") {
    if (key === "unit-none") return "Not yet placed in a unit";
    return `Unit ${key.replace("unit-", "")}`;
  }
  return standardHeading(key);
}

function groupSortValue(key) {
  if (state.groupBy === "unit") {
    const n = Number(key.replace("unit-", ""));
    return Number.isFinite(n) ? n : 999;
  }
  return 0;
}

function buildGroups() {
  const buckets = new Map();
  for (const item of state.items) {
    const key = groupKeyFor(item);
    if (state.filter && key !== state.filter) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(item);
  }
  return Array.from(buckets.entries()).sort((a, b) => {
    const sa = groupSortValue(a[0]);
    const sb = groupSortValue(b[0]);
    if (sa !== sb) return sa - sb;
    return groupLabelFor(a[0]).localeCompare(groupLabelFor(b[0]), "en", { numeric: true });
  });
}

function renderGroups() {
  const results = $("results");
  const countLine = $("count-line");
  clear(results);

  const groups = buildGroups();
  const shown = groups.reduce((n, g) => n + g[1].length, 0);
  countLine.textContent = shown
    ? `${shown} ${shown === 1 ? "piece" : "pieces"} of work across ${groups.length} ${
        groups.length === 1 ? "group" : "groups"
      }.`
    : "No work here yet.";

  if (!groups.length) {
    const empty = el("div", "empty");
    empty.appendChild(
      el("p", null, "No approved work for this selection yet. Yours could be the first."),
    );
    const link = el("a", null, "Send your work to your teacher");
    link.href = "#submit";
    empty.appendChild(link);
    results.appendChild(empty);
    return;
  }

  for (const [key, items] of groups) {
    const section = el("section", "group");
    const head = el("div", "group-head");
    head.appendChild(el("h2", null, groupLabelFor(key)));

    if (state.groupBy === "standard") {
      const node = state.nodes.get(key);
      if (node && str(node.fullText)) head.appendChild(el("p", "standard-text", node.fullText));
      const lessons = lessonLinksFor(key);
      if (lessons.length) {
        const list = el("ul", "teaches");
        for (const lesson of lessons) {
          const li = el("li");
          const a = el("a", null, lesson.title);
          a.href = lesson.path;
          li.appendChild(a);
          list.appendChild(li);
        }
        head.appendChild(list);
      }
    }
    section.appendChild(head);

    const cards = el("ul", "cards");
    for (const item of items) {
      cards.appendChild(buildCard(item, { showStandard: state.groupBy !== "standard" }));
    }
    section.appendChild(cards);
    results.appendChild(section);
  }
}

function renderFilterOptions() {
  const select = $("filter-select");
  const keys = new Map();
  for (const item of state.items) {
    const key = groupKeyFor(item);
    keys.set(key, (keys.get(key) || 0) + 1);
  }
  const entries = Array.from(keys.keys()).sort((a, b) => {
    const sa = groupSortValue(a);
    const sb = groupSortValue(b);
    if (sa !== sb) return sa - sb;
    return groupLabelFor(a).localeCompare(groupLabelFor(b), "en", { numeric: true });
  });

  clear(select);
  const all = el("option", null, "Everything");
  all.value = "";
  select.appendChild(all);
  for (const key of entries) {
    const opt = el("option", null, `${groupLabelFor(key)} (${keys.get(key)})`);
    opt.value = key;
    select.appendChild(opt);
  }
  select.value = keys.has(state.filter) ? state.filter : "";
  state.filter = select.value;
}

/* ------------------------------------------------------------ submit form */

function populateStandardSelect(select) {
  clear(select);
  const placeholder = el("option", null, "Choose a standard…");
  placeholder.value = "";
  select.appendChild(placeholder);

  const byDomain = new Map();
  for (const node of state.nodes.values()) {
    const domain = str(node.domain) || "OTHER";
    if (!byDomain.has(domain)) byDomain.set(domain, []);
    byDomain.get(domain).push(node);
  }
  for (const domain of Array.from(byDomain.keys()).sort()) {
    const group = document.createElement("optgroup");
    group.label = state.domains[domain] || domain;
    const nodes = byDomain
      .get(domain)
      .sort((a, b) => str(a.id).localeCompare(str(b.id), "en", { numeric: true }));
    for (const node of nodes) {
      const short = str(node.shortLabel) || str(node.label) || "";
      const opt = el("option", null, short ? `${node.id} — ${short}` : node.id);
      opt.value = node.id;
      group.appendChild(opt);
    }
    select.appendChild(group);
  }
}

function addPointRow() {
  const host = $("datapoints");
  if (host.childElementCount >= MAX_POINT_ROWS) return;
  const index = host.childElementCount + 1;
  const row = el("div", "datapoint-row");

  const labelField = el("div", "field");
  const labelId = `f-point-label-${index}`;
  const labelLabel = el("label", null, `Label ${index}`);
  labelLabel.setAttribute("for", labelId);
  const labelInput = el("input");
  labelInput.type = "text";
  labelInput.id = labelId;
  labelInput.maxLength = 24;
  labelInput.dataset.role = "point-label";
  labelField.appendChild(labelLabel);
  labelField.appendChild(labelInput);

  const valueField = el("div", "field");
  const valueId = `f-point-value-${index}`;
  const valueLabel = el("label", null, `Value ${index}`);
  valueLabel.setAttribute("for", valueId);
  const valueInput = el("input");
  valueInput.type = "number";
  valueInput.id = valueId;
  valueInput.step = "any";
  valueInput.dataset.role = "point-value";
  valueField.appendChild(valueLabel);
  valueField.appendChild(valueInput);

  row.appendChild(labelField);
  row.appendChild(valueField);
  host.appendChild(row);
}

function collectChartData() {
  const rows = Array.from($("datapoints").querySelectorAll(".datapoint-row"));
  const points = [];
  for (const row of rows) {
    const label = row.querySelector('[data-role="point-label"]').value.trim();
    const rawValue = row.querySelector('[data-role="point-value"]').value.trim();
    if (!label || rawValue === "") continue;
    const value = Number(rawValue);
    if (!Number.isFinite(value)) continue;
    points.push({ label: label.slice(0, 24), value });
  }
  if (points.length < 2) return null;
  return { kind: "bar", title: $("f-chart-title").value.trim().slice(0, 60), points };
}

function setStatus(node, message, kind) {
  node.textContent = message;
  node.className = `status ${kind || ""}`.trim();
  node.hidden = !message;
}

const SUBMIT_ERRORS = {
  "unknown-standard": "Pick a standard from the list.",
  "caption-too-short": "Write at least a few words in the one-sentence field.",
  "no-links": "Links and email addresses are not allowed in the text. Take them out and try again.",
  "bad-link-path": "The link must be a path on this site that starts with a slash.",
  "bad-data": "Something is wrong with the numbers. Check each value is a number.",
  "rate-limited": "The queue is full right now. Try again in a few minutes.",
  "backend-not-configured":
    "Submissions are not switched on for this site yet. Ask your teacher to hand the work in directly.",
  "bad-json": "Something went wrong sending that. Try again.",
};

async function onSubmit(event) {
  event.preventDefault();
  const status = $("submit-status");
  const button = $("submit-btn");
  const standard = $("f-standard").value;
  const caption = $("f-caption").value.trim();

  if (!standard) return setStatus(status, "Choose which standard your work explains.", "err");
  if (caption.length < 4) return setStatus(status, "Write one sentence about your work.", "err");

  const displayEl = document.querySelector('input[name="display"]:checked');
  const displayMode =
    displayEl && displayEl.value === "firstNameInitial" ? "firstNameInitial" : "anonymous";

  const payload = {
    standard,
    caption,
    explanation: $("f-explanation").value.trim(),
    linkPath: $("f-link").value.trim(),
    data: collectChartData(),
    displayMode,
    firstName: displayMode === "firstNameInitial" ? $("f-firstname").value.trim() : "",
    lastInitial: displayMode === "firstNameInitial" ? $("f-lastinitial").value.trim() : "",
    consentGrantedBy: "student-submission",
  };

  button.disabled = true;
  setStatus(status, "Sending…", "");
  const res = await getJson(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  button.disabled = false;

  if (res.ok && res.body && res.body.ok) {
    const named = res.body.displayMode === "firstNameInitial";
    setStatus(
      status,
      `Sent. A teacher reads this before anyone else sees it. Your work will appear ${
        named ? "with your first name and last initial" : "anonymously"
      } if it is approved.`,
      "ok",
    );
    $("submit-form").reset();
    $("name-fields").hidden = true;
    return;
  }
  const code = (res.body && res.body.error) || "";
  setStatus(
    status,
    SUBMIT_ERRORS[code] || "That did not send. Check your work and try again.",
    "err",
  );
}

/* ------------------------------------------------------------ moderation */

function teacherKey() {
  try {
    return localStorage.getItem(TEACHER_KEY_LS) || "";
  } catch (_e) {
    return "";
  }
}

function storeTeacherKey(value) {
  try {
    if (value) localStorage.setItem(TEACHER_KEY_LS, value);
    else localStorage.removeItem(TEACHER_KEY_LS);
  } catch (_e) {
    /* private browsing: moderation just stays locked */
  }
}

async function moderationFetch(path, options) {
  const key = teacherKey();
  if (!key) return { ok: false, status: 401, body: null };
  const opts = Object.assign({}, options);
  opts.headers = Object.assign({ "x-teacher-key": key }, opts.headers || {});
  return getJson(path, opts);
}

async function patchItem(id, nextState) {
  const res = await moderationFetch(API_URL, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, state: nextState }),
  });
  return res.ok && res.body && res.body.ok;
}

function buildQueueCard(raw) {
  const item = normalizeItem(raw);
  if (!item) return null;
  const card = el("li", "card");
  card.appendChild(el("h3", null, item.caption));
  if (item.explanation) card.appendChild(el("p", "pending-text", item.explanation));

  const meta = el("div", "meta");
  meta.appendChild(el("span", "badge", standardHeading(item.standard)));
  meta.appendChild(el("span", null, `Shown as: ${displayNameOf(item)}`));
  if (item.createdAt) meta.appendChild(el("span", null, `Sent ${item.createdAt.slice(0, 10)}`));
  card.appendChild(meta);

  if (item.linkPath) {
    const linkRow = el("div", "card-actions");
    const a = el("a", null, `Linked work: ${item.linkPath}`);
    a.href = item.linkPath;
    linkRow.appendChild(a);
    card.appendChild(linkRow);
  }
  const chart = buildChart(item.data);
  if (chart) card.appendChild(chart);

  const actions = el("div", "card-actions");
  if (item.state !== "approved") {
    const approve = el("button", "btn btn-primary", "Approve and publish");
    approve.type = "button";
    approve.addEventListener("click", async () => {
      approve.disabled = true;
      const ok = await patchItem(item.id, "approved");
      if (ok) await loadQueue();
      else approve.disabled = false;
    });
    actions.appendChild(approve);
  } else {
    const unpublish = el("button", "btn", "Unpublish (back to pending)");
    unpublish.type = "button";
    unpublish.addEventListener("click", async () => {
      unpublish.disabled = true;
      const ok = await patchItem(item.id, "pending");
      if (ok) await loadQueue();
      else unpublish.disabled = false;
    });
    actions.appendChild(unpublish);
  }
  const remove = el("button", "btn btn-danger", "Remove");
  remove.type = "button";
  remove.addEventListener("click", async () => {
    remove.disabled = true;
    const ok = await patchItem(item.id, "removed");
    if (ok) await loadQueue();
    else remove.disabled = false;
  });
  actions.appendChild(remove);
  card.appendChild(actions);
  return card;
}

async function loadQueue() {
  const status = $("moderation-status");
  const body = $("moderation-body");
  const queue = $("queue");

  if (!teacherKey()) {
    body.hidden = true;
    clear(queue);
    setStatus(status, "Enter your teacher key to open the queue.", "");
    return;
  }

  const res = await moderationFetch(`${API_URL}?state=${encodeURIComponent(state.queueState)}`);
  if (!res.ok) {
    body.hidden = true;
    clear(queue);
    if (res.status === 401) setStatus(status, "That teacher key was not accepted.", "err");
    else if (res.status === 503)
      setStatus(status, "Moderation storage is not configured for this site yet.", "err");
    else setStatus(status, "Could not reach the moderation queue.", "err");
    return;
  }

  const items = (res.body && res.body.items) || [];
  setStatus(
    status,
    state.queueState === "pending"
      ? `${items.length} submission${items.length === 1 ? "" : "s"} waiting for you.`
      : `${items.length} published ${items.length === 1 ? "piece" : "pieces"} of student work.`,
    "ok",
  );
  body.hidden = false;
  clear(queue);
  if (!items.length) {
    const empty = el("li");
    empty.appendChild(
      el(
        "div",
        "empty",
        state.queueState === "pending" ? "The queue is empty." : "Nothing published yet.",
      ),
    );
    queue.appendChild(empty);
    return;
  }
  for (const raw of items) {
    const card = buildQueueCard(raw);
    if (card) queue.appendChild(card);
  }
}

function initModeration() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("moderate") !== "1") return; // panel stays hidden entirely
  const panel = $("moderation");
  panel.hidden = false;

  $("f-teacher-key").value = teacherKey();
  $("key-save").addEventListener("click", async () => {
    storeTeacherKey($("f-teacher-key").value.trim());
    await loadQueue();
  });
  $("key-clear").addEventListener("click", () => {
    storeTeacherKey("");
    $("f-teacher-key").value = "";
    $("moderation-body").hidden = true;
    clear($("queue"));
    setStatus($("moderation-status"), "Teacher key forgotten on this device.", "");
  });
  for (const button of panel.querySelectorAll("[data-queue]")) {
    button.addEventListener("click", async () => {
      state.queueState = button.getAttribute("data-queue");
      for (const other of panel.querySelectorAll("[data-queue]")) {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      }
      await loadQueue();
    });
  }
  if (teacherKey()) loadQueue();
}

/* ------------------------------------------------------------------ init */

function initToolbar() {
  for (const button of document.querySelectorAll("[data-group]")) {
    button.addEventListener("click", () => {
      state.groupBy = button.getAttribute("data-group");
      state.filter = "";
      for (const other of document.querySelectorAll("[data-group]")) {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      }
      renderFilterOptions();
      renderGroups();
    });
  }
  $("filter-select").addEventListener("change", (event) => {
    state.filter = event.target.value;
    renderGroups();
  });
}

function initSubmitForm() {
  populateStandardSelect($("f-standard"));
  for (let i = 0; i < 3; i += 1) addPointRow();
  $("add-point").addEventListener("click", addPointRow);
  for (const radio of document.querySelectorAll('input[name="display"]')) {
    radio.addEventListener("change", () => {
      $("name-fields").hidden = radio.value !== "firstNameInitial" || !radio.checked;
    });
  }
  $("submit-form").addEventListener("submit", onSubmit);
}

async function main() {
  initToolbar();
  await loadNervousSystem();
  initSubmitForm();
  await loadItems();
  renderFilterOptions();
  renderGroups();
  initModeration();
}

main().catch(() => {
  const countLine = $("count-line");
  if (countLine) countLine.textContent = "The gallery could not load right now. Please refresh.";
});
