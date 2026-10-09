/**
 * Tomorrow's Groups — page controller.
 *
 * Reads the same TEACHER_KEY-gated telemetry Groups from Evidence reads, the
 * pacing baseline for "which lesson is next", and the shared misconception
 * taxonomy + small-group variant index; placement is the pure module in
 * tomorrow-groups.mjs. Nothing is written back or persisted.
 */
import { isoDay, nextPacedLesson, planTomorrow } from "./tomorrow-groups.mjs";

const LS_KEY = "neft.teacher.key"; // shared with the other teacher tools

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const state = { taxonomy: {}, variants: {}, days: [], next: null, demo: false };

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

function setStatus(msg, isError) {
  const s = $("#status");
  s.textContent = msg || "";
  s.className = `status${isError ? " error" : ""}`;
}

async function loadReference() {
  if (state.days.length) return;
  const [tax, vars, pacing] = await Promise.all([
    fetch("/data/misconception-taxonomy.json").then((r) => r.json()),
    fetch("/data/small-group-variants.json").then((r) => r.json()),
    fetch("/data/pacing-baseline-2026-27.json").then((r) => r.json()),
  ]);
  state.taxonomy = tax.taxonomy || {};
  state.variants = vars.bases || {};
  state.days = Array.isArray(pacing.days) ? pacing.days : [];
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

function chosenLesson() {
  const typed = $("#ctl-lesson").value.trim();
  if (/^\d{1,2}-\d{1,2}$/.test(typed)) return typed;
  return state.next?.id || "";
}

function showNext() {
  const n = state.next;
  const title = (id) => state.variants[id]?.title || "";
  $("#next-lesson").textContent = n
    ? `Next paced lesson: ${n.id}${title(n.id) ? ` · ${title(n.id)}` : ""} on ${n.date}.`
    : "No lesson is paced after today — type a lesson below.";
  if (n && !$("#ctl-lesson").value) $("#ctl-lesson").placeholder = n.id;
}

const GROUP_META = {
  catchup: { title: "Catch-Up", why: "Entrenched error or under 50% correct" },
  group1: {
    title: "Small Group 1",
    why: "A named misconception to fix at the table",
  },
  group2: { title: "Small Group 2", why: "Mostly there — push to explain why" },
};

function percent(a) {
  return a == null ? "" : `${Math.round(a * 100)}% correct`;
}

function groupCard(g) {
  const meta = GROUP_META[g.key];
  const card = el("li", "group");
  const h = el("h3", null, `${meta.title} (${g.students.length})`);
  h.append(el("small", null, meta.why));
  card.append(h);

  if (g.drivers.length) {
    const say = el("div", "say");
    say.append(el("strong", null, "Driving misconception"));
    say.append(
      document.createTextNode(
        g.drivers.map((d) => `${d.label} (${d.students})`).join(" · "),
      ),
    );
    if (g.drivers[0].watchFor)
      say.append(el("p", null, `Watch for: ${g.drivers[0].watchFor}`));
    card.append(say);
  }

  const roster = el("ul", "tg-roster");
  for (const s of g.students) {
    const li = el("li", null, s.student);
    const detail = [
      s.misconception
        ? `${s.misconception.label} ×${s.misconception.hits}`
        : "",
      percent(s.accuracy),
    ]
      .filter(Boolean)
      .join(" · ");
    if (detail) li.append(el("span", null, detail));
    roster.append(li);
  }
  if (!g.students.length)
    roster.append(el("li", null, "Nobody needs this group tomorrow."));
  card.append(roster);

  const link = g.link || g.fallback;
  if (link) {
    const a = el(
      "a",
      "run",
      `Open ${link.id}${g.link ? "" : " (no catch-up for this lesson)"}`,
    );
    a.href = link.url;
    card.append(a);
  } else {
    card.append(
      el(
        "p",
        "no-run",
        "No small-group lesson exists for this one — run a teacher-led table.",
      ),
    );
  }
  return card;
}

function render(plan) {
  const body = $("#plan-body");
  body.replaceChildren();
  if (state.demo)
    body.append(
      el(
        "p",
        "demo-note",
        "Example data — the shape of the plan, not your class.",
      ),
    );

  const stats = el("div", "eg-stats");
  const stat = (n, label) => {
    const s = el("div", "stat");
    s.append(el("b", null, String(n)), el("span", null, label));
    return s;
  };
  stats.append(
    stat(plan.lessonId, "lesson"),
    stat(plan.stats.pulled, "students to pull"),
    stat(plan.wholeGroup.length, "whole group"),
  );
  body.append(stats);

  if (!plan.stats.studentsSeen) {
    body.append(
      el(
        "p",
        "empty",
        "No lesson evidence in this window yet. Groups appear once students work a lesson.",
      ),
    );
    return;
  }
  const cols = el("ul", "tg-columns");
  for (const k of ["group1", "group2", "catchup"])
    cols.append(groupCard(plan.groups[k]));
  body.append(cols);

  if (plan.wholeGroup.length) {
    body.append(
      el("h2", "section-h", `Whole group (${plan.wholeGroup.length})`),
    );
    const list = el("ul", "ontrack");
    for (const r of plan.wholeGroup) list.append(el("li", null, r.student));
    body.append(list);
  }
}

function options(lessonId) {
  return {
    lessonId,
    section: $("#ctl-section").value.trim(),
    windowDays: Number($("#ctl-days").value) || 7,
    taxonomy: state.taxonomy,
    variants: state.variants,
  };
}

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
    const lessonId = chosenLesson();
    if (!lessonId) {
      setStatus("Type a lesson id like 4-1.", true);
      return;
    }
    const events = await loadEvents();
    const plan = planTomorrow(events, options(lessonId));
    render(plan);
    setStatus(
      `${events.length} events read · ${plan.stats.studentsSeen} students with evidence in the last ${plan.window.days} days.`,
    );
    $("#plan").focus();
  } catch (err) {
    const msg = String(err.message || err);
    if (msg === "key-rejected") {
      setStatus("That teacher key was rejected. Enter it again.", true);
      $("#gate").hidden = false;
    } else if (msg === "not-configured") {
      setStatus(
        "The progress backend is not configured on this deployment. “Show me an example” still works.",
        true,
      );
    } else {
      setStatus(`Could not load evidence (${msg}).`, true);
    }
  }
}

function demoEvents() {
  const day = 86400000;
  const now = Date.now();
  const at = (d) => new Date(now - d * day).toISOString();
  const mis = (studentName, tag, d) => ({
    studentName,
    section: "3",
    type: "misconception",
    props: { tag },
    at: at(d),
  });
  const ph = (studentName, correct, total) => ({
    studentName,
    section: "3",
    type: "phase_complete",
    props: { correct, total },
    at: at(1),
  });
  return [
    mis("Ana R.", "ratio-inverted", 1),
    mis("Ana R.", "ratio-inverted", 2),
    mis("Ana R.", "ratio-inverted", 3),
    mis("Ben T.", "ratio-inverted", 1),
    mis("Cam L.", "fraction-added-denominators", 2),
    ph("Dee M.", 3, 5),
    ph("Eli P.", 1, 5),
    ph("Fay K.", 5, 5),
  ];
}

async function demo() {
  state.demo = true;
  setStatus("Showing example data.");
  try {
    await loadReference();
  } catch {
    /* labels fall back to raw tag ids */
  }
  render(
    planTomorrow(demoEvents(), {
      ...options(chosenLesson() || "4-1"),
      section: "",
    }),
  );
  $("#plan").focus();
}

$("#gate-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("#gate-key").value.trim();
  if (!v) return;
  setKey(v);
  $("#gate").hidden = true;
  build();
});
$("#btn-build").addEventListener("click", build);
$("#btn-demo").addEventListener("click", demo);
$("#btn-print").addEventListener("click", () => window.print());

if (!getKey()) $("#gate").hidden = false;
loadReference()
  .then(() => {
    state.next = nextPacedLesson(state.days, isoDay(Date.now()));
    showNext();
  })
  .catch(() => {
    $("#next-lesson").textContent =
      "Could not read the pacing plan — type a lesson below.";
  });
