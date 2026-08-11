/**
 * Groups from Evidence — page controller.
 *
 * Reads the TEACHER_KEY-gated telemetry the site already records, clusters it
 * with the pure module in grouping.mjs, and renders a plan a teacher can carry
 * to the table. No new backend: /api/progress/telemetry, the misconception
 * taxonomy and the small-group variant index all already exist.
 *
 * Everything happens in this browser — nothing is written back, and the plan
 * is never persisted anywhere.
 */
import { buildPlan } from "./grouping.mjs";

const LS_KEY = "neft.teacher.key"; // shared with the other teacher tools

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const state = { taxonomy: {}, variants: {}, demo: false };

// ---- key gate -------------------------------------------------------------
function getKey() {
  try {
    return localStorage.getItem(LS_KEY) || "";
  } catch {
    return "";
  }
}
function setKey(v) {
  try {
    localStorage.setItem(LS_KEY, v);
  } catch {
    /* private mode — the key just will not persist */
  }
}

$("#gate-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("#gate-key").value.trim();
  if (!v) return;
  setKey(v);
  $("#gate").hidden = true;
  build();
});

function setStatus(msg, isError) {
  const s = $("#status");
  s.textContent = msg || "";
  s.className = `status${isError ? " error" : ""}`;
}

// ---- data -----------------------------------------------------------------
async function loadReference() {
  if (Object.keys(state.taxonomy).length) return;
  const [tax, vars] = await Promise.all([
    fetch("/data/misconception-taxonomy.json").then((r) => r.json()),
    fetch("/data/small-group-variants.json").then((r) => r.json()),
  ]);
  state.taxonomy = tax.taxonomy || {};
  state.variants = vars.bases || {};
}

async function loadEvents() {
  const res = await fetch("/api/progress/telemetry?limit=5000", {
    headers: { "x-teacher-key": getKey() },
  });
  if (res.status === 401) throw new Error("key-rejected");
  if (res.status === 503) throw new Error("not-configured");
  if (!res.ok) throw new Error(`http-${res.status}`);
  const body = await res.json();
  return Array.isArray(body.events) ? body.events : [];
}

// ---- render ---------------------------------------------------------------
const TREND_TEXT = {
  clearing: (t) => `Clearing · ${t.prior} → ${t.current} this week`,
  growing: (t) => `Growing · ${t.prior} → ${t.current} this week`,
  holding: (t) => `Holding · ${t.current} both weeks`,
  new: (t) => `New this week · ${t.current}`,
};

function groupCard(g) {
  const card = el("li", `group is-${g.trend.direction}`);

  const h = el("h3");
  h.append(document.createTextNode(g.label + (g.part ? ` · Part ${g.part.index} of ${g.part.of}` : "")));
  if (g.labelEs && g.labelEs !== g.label) h.append(el("span", "es", g.labelEs));
  card.append(h);

  const trend = el("p", `trend is-${g.trend.direction}`, TREND_TEXT[g.trend.direction](g.trend));
  card.append(trend);

  const roster = el("ul", "roster");
  for (const s of g.students) roster.append(el("li", null, s));
  card.append(roster);

  if (g.watchFor) {
    const say = el("div", "say");
    say.append(el("strong", null, "Watch for"));
    say.append(document.createTextNode(g.watchFor));
    card.append(say);
  }
  if (g.student) {
    const say = el("div", "say");
    say.append(el("strong", null, "Say it like this"));
    say.append(document.createTextNode(g.student));
    card.append(say);
  }

  if (g.lesson) {
    const a = el("a", "run", `Run ${g.lesson.title} · ${g.lesson.variant}`);
    a.href = g.lesson.url;
    card.append(a);
  } else {
    card.append(
      el(
        "p",
        "no-run",
        "No small-group lesson exists for this one yet — run it as a teacher-led table.",
      ),
    );
  }
  return card;
}

function render(plan) {
  const body = $("#plan-body");
  body.replaceChildren();

  if (state.demo) {
    body.append(
      el(
        "p",
        "demo-note",
        "Example data — this is the shape of the plan, not your class. Press “Build groups” for the real thing.",
      ),
    );
  }

  const stats = el("div", "eg-stats");
  const stat = (n, label) => {
    const s = el("div", "stat");
    s.append(el("b", null, String(n)), el("span", null, label));
    return s;
  };
  stats.append(
    stat(plan.stats.groups, "groups to run"),
    stat(plan.stats.distinctErrors, "distinct errors"),
    stat(plan.stats.studentsGrouped, "students placed"),
    stat(plan.onTrack.length, "on track"),
  );
  body.append(stats);

  if (!plan.groups.length && !plan.soloCheckIns.length) {
    body.append(
      el(
        "p",
        "empty",
        plan.stats.studentsSeen
          ? "No misconceptions recorded in this window — nothing to group. That is a good day."
          : "No lesson evidence in this window yet. Groups appear once students work a lesson.",
      ),
    );
    return;
  }

  if (plan.groups.length) {
    const list = el("ul", "group-list");
    for (const g of plan.groups) list.append(groupCard(g));
    body.append(list);
  }

  if (plan.soloCheckIns.length) {
    body.append(el("h2", "section-h", "One-on-one check-ins"));
    const list = el("ul", "solo-list");
    for (const s of plan.soloCheckIns) {
      const li = el("li");
      li.append(el("b", null, s.student), document.createTextNode(` — ${s.label}`));
      list.append(li);
    }
    body.append(list);
  }

  if (plan.onTrack.length) {
    body.append(el("h2", "section-h", `On track (${plan.onTrack.length})`));
    const list = el("ul", "ontrack");
    for (const n of plan.onTrack) list.append(el("li", null, n));
    body.append(list);
  }
}

function options() {
  return {
    section: $("#ctl-section").value.trim(),
    windowDays: Number($("#ctl-days").value) || 7,
    maxGroup: Number($("#ctl-max").value) || 6,
    taxonomy: state.taxonomy,
    variants: state.variants,
  };
}

// ---- actions --------------------------------------------------------------
async function build() {
  if (!getKey()) {
    $("#gate").hidden = false;
    $("#gate-key").focus();
    return;
  }
  state.demo = false;
  setStatus("Reading lesson evidence…");
  try {
    await loadReference();
    const events = await loadEvents();
    const plan = buildPlan(events, options());
    render(plan);
    setStatus(
      `${events.length} events · ${plan.stats.totalMisses} misconceptions in the last ${plan.window.days} days.`,
    );
    $("#plan").focus();
  } catch (err) {
    const msg = String(err.message || err);
    if (msg === "key-rejected") {
      setStatus("That teacher key was rejected. Enter it again.", true);
      $("#gate").hidden = false;
    } else if (msg === "not-configured") {
      setStatus(
        "The progress backend is not configured on this deployment, so there is no evidence to read yet. “Show me an example” still works.",
        true,
      );
    } else {
      setStatus(`Could not load evidence (${msg}).`, true);
    }
  }
}

// A worked example, so the page explains itself before a single student has
// used a lesson — and so this surface is reviewable without a live database.
function demoEvents() {
  const day = 86400000;
  const now = Date.now();
  const mk = (studentName, tag, daysBack, lessonSlug) => ({
    studentName,
    section: "3",
    lessonSlug,
    type: "misconception",
    props: { tag },
    at: new Date(now - daysBack * day).toISOString(),
  });
  return [
    mk("Ana R.", "ratio-inverted", 1, "3-2"),
    mk("Ben T.", "ratio-inverted", 2, "3-2"),
    mk("Cam L.", "ratio-inverted", 2, "3-2"),
    mk("Dee M.", "ratio-inverted", 3, "3-2"),
    mk("Ana R.", "ratio-inverted", 9, "3-2"),
    mk("Ben T.", "ratio-inverted", 10, "3-2"),
    mk("Cam L.", "ratio-inverted", 11, "3-2"),
    mk("Eli P.", "fraction-added-denominators", 1, "2-3"),
    mk("Fay K.", "fraction-added-denominators", 1, "2-3"),
    mk("Gus H.", "fraction-added-denominators", 2, "2-3"),
    mk("Ivy N.", "geom-triangle-area-no-half", 2, "5-1"),
    { studentName: "Kai W.", section: "3", lessonSlug: "3-2", type: "answer", props: {}, at: new Date(now - day).toISOString() },
    { studentName: "Lia S.", section: "3", lessonSlug: "3-2", type: "answer", props: {}, at: new Date(now - day).toISOString() },
  ];
}

async function demo() {
  state.demo = true;
  setStatus("Showing example data.");
  try {
    await loadReference();
  } catch {
    /* the plan still renders; labels fall back to raw tag ids */
  }
  render(buildPlan(demoEvents(), { ...options(), section: "" }));
  $("#plan").focus();
}

$("#btn-build").addEventListener("click", build);
$("#btn-demo").addEventListener("click", demo);
$("#btn-print").addEventListener("click", () => window.print());

if (!getKey()) $("#gate").hidden = false;
