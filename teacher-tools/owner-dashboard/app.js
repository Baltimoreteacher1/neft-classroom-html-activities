const KEY_STORAGE = "ewl:owner:teacherKey";

const keyForm = document.getElementById("keyForm");
const keyInput = document.getElementById("keyInput");
const clearKeyBtn = document.getElementById("clearKeyBtn");
const daysSelect = document.getElementById("daysSelect");
const refreshBtn = document.getElementById("refreshBtn");
const statusMsg = document.getElementById("statusMsg");
const dashRoot = document.getElementById("dashRoot");

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    node.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

function setStatus(text, isErr = false) {
  statusMsg.textContent = text;
  statusMsg.className = isErr ? "status err" : "status";
}

function renderTable(headers, rows) {
  if (!rows.length) return el("p", { class: "muted" }, "No data recorded yet.");
  return el(
    "table",
    {},
    el("thead", {}, el("tr", {}, ...headers.map(([label, cls]) => el("th", { class: cls || "" }, label)))),
    el(
      "tbody",
      {},
      ...rows.map((cells) =>
        el("tr", {}, ...cells.map(([val, cls]) => el("td", { class: cls || "" }, String(val)))),
      ),
    ),
  );
}

function renderDashboard(data) {
  dashRoot.hidden = false;
  const p = data.platform || {};
  const libCount = Object.values(p.libraryByKind || {}).reduce((a, b) => a + b, 0);
  const assignCount = Object.values(p.assignmentStates || {}).reduce((a, b) => a + b, 0);

  document.getElementById("summaryCards").replaceChildren(
    el("section", { class: "card" },
      el("div", { class: "muted" }, `Page Views (${data.windowDays}d)`),
      el("div", { class: "stat" }, (data.usage?.views || 0).toLocaleString()),
      el("div", { class: "muted" }, `${data.usage?.uniquePages || 0} distinct pages`),
    ),
    el("section", { class: "card" },
      el("div", { class: "muted" }, "Active Classes"),
      el("div", { class: "stat" }, String(p.totalClasses || 0)),
      el("div", { class: "muted" }, `${p.activeClasses7d || 0} active in 7d · ${p.studentSeats || 0} seats`),
    ),
    el("section", { class: "card" },
      el("div", { class: "muted" }, "Teacher Library & Assignments"),
      el("div", { class: "stat" }, String(libCount)),
      el("div", { class: "muted" }, `${assignCount} tracked learner assignments`),
    ),
    el("section", { class: "card" },
      el("div", { class: "muted" }, "Field JS Errors (7d)"),
      el("div", { class: "stat" }, String(data.errors?.total || 0)),
      el("div", { class: "muted" }, `${data.errors?.distinct || 0} distinct messages`),
    ),
  );

  document.getElementById("areaTable").replaceChildren(
    renderTable(
      [["Area", ""], ["Views", "num"]],
      (data.usage?.byArea || []).map((r) => [[r.area, ""], [r.views.toLocaleString(), "num"]]),
    ),
  );

  const vitalRows = Object.entries(data.vitals || {}).map(([metric, counts]) => [
    [metric, ""],
    [counts.good || 0, "num"],
    [counts["needs-improvement"] || 0, "num"],
    [counts.poor || 0, "num"],
  ]);
  document.getElementById("vitalsTable").replaceChildren(
    renderTable([["Metric", ""], ["Good", "num"], ["Needs Work", "num"], ["Poor", "num"]], vitalRows),
  );

  document.getElementById("pagesTable").replaceChildren(
    renderTable(
      [["Path", ""], ["Area", ""], ["Views", "num"]],
      (data.usage?.topPages || []).map((r) => [[r.path, ""], [r.area, ""], [r.views.toLocaleString(), "num"]]),
    ),
  );

  document.getElementById("errorsTable").replaceChildren(
    renderTable(
      [["Path", ""], ["Message", ""], ["Count", "num"], ["Last Day", ""]],
      (data.errors?.top || []).map((r) => [
        [r.path, ""],
        [r.message, ""],
        [r.count, "num"],
        [r.lastDay, ""],
      ]),
    ),
  );
}

async function loadOverview() {
  const key = sessionStorage.getItem(KEY_STORAGE) || "";
  if (!key) {
    dashRoot.hidden = true;
    setStatus("Enter your Teacher API key to load the overview.");
    return;
  }
  setStatus("Loading overview…");
  try {
    const days = Number(daysSelect.value) || 14;
    const res = await fetch(`/api/owner/overview?days=${days}`, {
      headers: { "x-teacher-key": key },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      dashRoot.hidden = true;
      setStatus(
        res.status === 401
          ? "Teacher API key was not accepted (401)."
          : `Could not load overview (${data?.error || res.status}).`,
        true,
      );
      return;
    }
    setStatus(`Updated ${new Date(data.generatedAt).toLocaleTimeString()}.`);
    renderDashboard(data);
  } catch {
    dashRoot.hidden = true;
    setStatus("Network error while loading overview.", true);
  }
}

keyForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = keyInput.value.trim();
  if (val) sessionStorage.setItem(KEY_STORAGE, val);
  keyInput.value = "";
  void loadOverview();
});

clearKeyBtn.addEventListener("click", () => {
  sessionStorage.removeItem(KEY_STORAGE);
  dashRoot.hidden = true;
  setStatus("Key cleared.");
});

daysSelect.addEventListener("change", () => void loadOverview());
refreshBtn.addEventListener("click", () => void loadOverview());

void loadOverview();
