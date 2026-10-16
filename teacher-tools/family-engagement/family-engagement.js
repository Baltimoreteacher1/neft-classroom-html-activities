/* =============================================================================
 * Family Engagement card — teacher view of /api/family-engagement
 * -----------------------------------------------------------------------------
 * Renders the weekly aggregate: route opened and chosen, tabs finished,
 * language and device. The API already suppresses small counts; this page only
 * labels them ("<5") and never tries to recover a hidden number. Every value is
 * inserted with textContent.
 * ========================================================================== */

const LS_KEY = "neft.teacher.key"; // the key the Gradebook and Intervention Radar share
const ENDPOINT = "/api/family-engagement";

const ROUTE_LABELS = {
  quick: "Quick practice",
  core: "Learn & practice",
  full: "Family Math Studio",
};
const TAB_LABELS = { learn: "Learn", words: "Words", check: "Check", play: "Play", done: "Done" };
const LANG_LABELS = { en: "English", es: "Spanish" };
const DEVICE_LABELS = { mobile: "Phone", tablet: "Tablet", desktop: "Computer" };

const byId = (id) => document.getElementById(id);
const el = {
  gate: byId("gate"),
  gateMsg: byId("gate-msg"),
  keyForm: byId("key-form"),
  keyInput: /** @type {HTMLInputElement} */ (byId("key-input")),
  app: byId("app"),
  weeks: /** @type {HTMLSelectElement} */ (byId("weeks")),
  status: byId("status"),
  cards: byId("cards"),
  refresh: byId("refresh"),
  signout: byId("signout"),
  k: byId("k"),
};

let key = "";
try {
  key = localStorage.getItem(LS_KEY) || "";
} catch (_e) {
  key = "";
}

function node(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

/** A count for display: a number, or "<5" for a value the API hid. */
function show(value, k) {
  return value === null || value === undefined ? `<${k}` : String(value);
}

function weekLabel(week) {
  const d = new Date(`${week}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return week;
  return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
}

/** One table: a row per week, a column per category. */
function breakdownTable(title, note, weeks, event, dim, labels, k) {
  const section = node("section", "card");
  section.appendChild(node("h3", null, title));
  if (note) section.appendChild(node("p", "note", note));
  const wrap = node("div", "table-wrap");
  const table = node("table");
  table.appendChild(node("caption", "sr-only", `${title} by week`));
  const head = node("tr");
  head.appendChild(Object.assign(node("th", null, "Week"), { scope: "col" }));
  for (const label of Object.values(labels)) {
    head.appendChild(Object.assign(node("th", "num", label), { scope: "col" }));
  }
  head.appendChild(Object.assign(node("th", "num", "Total"), { scope: "col" }));
  const thead = node("thead");
  thead.appendChild(head);
  table.appendChild(thead);
  const body = node("tbody");
  for (const w of [...weeks].reverse()) {
    const cell = w[event] || { total: 0 };
    const tr = node("tr");
    tr.appendChild(Object.assign(node("th", null, weekLabel(w.week)), { scope: "row" }));
    for (const id of Object.keys(labels)) {
      const value = cell[dim] ? cell[dim][id] : cell.total === 0 ? 0 : null;
      tr.appendChild(node("td", "num", show(value, k)));
    }
    tr.appendChild(node("td", "num strong", show(cell.total, k)));
    body.appendChild(tr);
  }
  table.appendChild(body);
  wrap.appendChild(table);
  section.appendChild(wrap);
  return section;
}

function render(data) {
  const k = data.k || 5;
  el.k.textContent = String(k);
  el.cards.textContent = "";
  const weeks = data.weeks || [];
  if (!weeks.length) {
    el.status.textContent =
      "No family activity has been counted yet. Counting starts once the family practice page loads the engagement beacon.";
    return;
  }
  el.status.textContent = `Showing ${weeks.length} week${weeks.length === 1 ? "" : "s"} with activity.`;
  const cards = [
    breakdownTable(
      "Routes families opened",
      "The route showing when a practice page opened.",
      weeks,
      "open",
      "route",
      ROUTE_LABELS,
      k,
    ),
    breakdownTable(
      "Routes families chose",
      "Counted each time a family tapped a route button.",
      weeks,
      "route",
      "route",
      ROUTE_LABELS,
      k,
    ),
    breakdownTable(
      "Tabs completed",
      "A tab counts as completed when a family moves on to a later tab, or reaches Done.",
      weeks,
      "tab",
      "tab",
      TAB_LABELS,
      k,
    ),
    breakdownTable(
      "Language",
      "Language on screen when the practice opened.",
      weeks,
      "open",
      "lang",
      LANG_LABELS,
      k,
    ),
    breakdownTable(
      "Device",
      "Phone, tablet or computer, by screen width.",
      weeks,
      "open",
      "device",
      DEVICE_LABELS,
      k,
    ),
  ];
  for (const card of cards) el.cards.appendChild(card);
}

async function load() {
  if (!key) return;
  el.status.textContent = "Loading…";
  try {
    const res = await fetch(`${ENDPOINT}?weeks=${encodeURIComponent(el.weeks.value)}`, {
      headers: { "x-teacher-key": key },
      cache: "no-store",
    });
    if (res.status === 401) return showGate("That key was not accepted.");
    if (res.status === 503) {
      el.status.textContent =
        "The server is not set up for this yet (teacher key or database not configured).";
      return;
    }
    const data = await res.json();
    if (!data || !data.ok) throw new Error("bad response");
    render(data);
  } catch (_e) {
    el.status.textContent = "Could not load the numbers. Check your connection and try again.";
  }
}

function showApp() {
  el.gate.classList.add("hidden");
  el.app.classList.remove("hidden");
  el.refresh.classList.remove("hidden");
  el.signout.classList.remove("hidden");
}

function showGate(message) {
  el.gate.classList.remove("hidden");
  el.app.classList.add("hidden");
  el.refresh.classList.add("hidden");
  el.signout.classList.add("hidden");
  el.gateMsg.textContent = message || "";
}

el.keyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = el.keyInput.value.trim();
  if (!value) return;
  key = value;
  try {
    localStorage.setItem(LS_KEY, key);
  } catch (_e) {
    /* private mode: the key lives for this page view only */
  }
  showApp();
  load();
});
el.signout.addEventListener("click", () => {
  try {
    localStorage.removeItem(LS_KEY);
  } catch (_e) {
    /* nothing stored to remove */
  }
  key = "";
  showGate("");
});
el.refresh.addEventListener("click", load);
el.weeks.addEventListener("change", load);

if (key) {
  showApp();
  load();
} else {
  showGate("");
}
