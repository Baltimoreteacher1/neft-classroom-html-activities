// BCPSS Writing Lab — shell: load the unit, overview, level switch, the TWR path stepper and printables.
// URL: /bcpss-teachers/writing-lab/?unit=<unitId>&level=<l1_2|l3_4|l5_6>&step=<key>
import { LEVELS, gradeBand, reducedMotion, stopSpeaking } from "../language-studio/studio-core.js";
import { LEVEL_INFO, announce, byLevel, flush, h, isDone, loadState, wl } from "./wl-core.js";
import { stepBBS, stepExpand, stepNotes } from "./wl-steps-a.js";
import { stepAppositives, stepFragments, stepSubordinate } from "./wl-steps-b.js";
import { stepDraft, stepMPO, stepPlan, stepRevise } from "./wl-steps-c.js";

const STEPS = [
  {
    key: "notes",
    title: "Read & Take Notes",
    strategy: "Note-taking",
    why: "Notes in key words help you remember ideas and write them in your own words.",
    run: stepNotes,
  },
  {
    key: "bbs",
    title: "Because · But · So",
    strategy: "Sentence power",
    why: "Three small words push you to explain reasons, problems and results.",
    run: stepBBS,
  },
  {
    key: "expand",
    title: "Stretch a Sentence",
    strategy: "Sentence expansion",
    why: "Question words turn a short sentence into a clear, detailed one.",
    run: stepExpand,
  },
  {
    key: "frag",
    title: "Sentence or Fragment?",
    strategy: "Complete sentences",
    why: "Every sentence needs a who or what and an action.",
    run: stepFragments,
  },
  {
    key: "appos",
    title: "Add an Appositive",
    strategy: "Appositives",
    why: "An appositive packs extra information about a noun into one sentence.",
    run: stepAppositives,
  },
  {
    key: "sub",
    title: "Start With a Clue Word",
    strategy: "Subordinating conjunctions",
    why: "Clue words like when and although show how ideas connect.",
    run: stepSubordinate,
  },
  {
    key: "plan",
    title: "Plan Your Paragraph",
    strategy: "Single-paragraph outline",
    why: "A plan in key words keeps your paragraph on topic.",
    run: stepPlan,
  },
  {
    key: "draft",
    title: "Write Your Draft",
    strategy: "Drafting",
    why: "Turn each note into a sentence and connect them with transitions.",
    run: stepDraft,
  },
  {
    key: "revise",
    title: "Revise & Publish",
    strategy: "Revising",
    why: "Good writers reread, check and improve before they share.",
    run: stepRevise,
  },
  {
    key: "mpo",
    title: "Go Further: Essay Plan",
    strategy: "Multi-paragraph outline",
    why: "Grow your paragraph into a short essay with a thesis and body paragraphs.",
    run: stepMPO,
    optional: true,
  },
];
const GENRE = { explain: "Explain", argue: "Argue", inform: "Inform", narrate: "Narrate" };

const main = document.getElementById("wlMain");
const levelHost = document.getElementById("wlLevel");
const params = () => new URLSearchParams(location.search);

function steps() {
  return STEPS.filter((s) => s.key !== "mpo" || wl.w.mpo);
}
function url(step) {
  const p = new URLSearchParams();
  p.set("unit", wl.unitId);
  p.set("level", wl.level);
  if (step) p.set("step", step);
  return `${location.pathname}?${p}`;
}
function go(step) {
  flush();
  stopSpeaking();
  history.pushState(null, "", url(step));
  render();
  window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
}
wl.rerender = () => render();

function renderLevels() {
  levelHost.replaceChildren(
    ...LEVELS.map((l) =>
      h(
        "button",
        {
          type: "button",
          "aria-pressed": String(l === wl.level),
          title: `${LEVEL_INFO[l].name}: ${LEVEL_INFO[l].wida}`,
          "aria-label": `${LEVEL_INFO[l].name} (${LEVEL_INFO[l].wida})`,
          onclick: () => {
            if (l === wl.level) return;
            wl.level = l;
            wl.state.level = l;
            flush();
            history.replaceState(null, "", url(params().get("step")));
            renderLevels();
            announce(`${LEVEL_INFO[l].name} level selected.`);
            render();
          },
        },
        LEVEL_INFO[l].name,
      ),
    ),
  );
}

const exportHref = (part, format) =>
  `/api/bcpss/export/${encodeURIComponent(wl.unitId)}?format=${format}&part=${part}&wida=${wl.level.slice(1)}`;
function printables() {
  const row = (label, sub, part) =>
    h(
      "li",
      { class: "wl-res" },
      h("div", null, h("strong", null, label), h("span", null, sub)),
      h(
        "div",
        { class: "wl-res__btns" },
        h(
          "a",
          {
            class: "st-btn st-btn--sm",
            href: exportHref(part, "pdf"),
            target: "_blank",
            rel: "noopener",
          },
          "PDF",
        ),
        h("a", { class: "st-btn st-btn--sm", href: exportHref(part, "docx") }, "Word"),
        h(
          "a",
          {
            class: "st-btn st-btn--ghost st-btn--sm",
            href: exportHref(part, "html"),
            target: "_blank",
            rel: "noopener",
          },
          "Web page",
        ),
      ),
    );
  return h(
    "section",
    { class: "wl-card wl-resources", "aria-labelledby": "wlRes" },
    h("h2", { id: "wlRes" }, "Print or download"),
    h(
      "ul",
      { class: "wl-res__list" },
      row(
        "Student writing packet",
        `${LEVEL_INFO[wl.level].name} level · every step on paper`,
        "writing",
      ),
      row("Teacher guide & answer key", "All three levels, models, answers, rubric", "writing-key"),
    ),
  );
}

function overview() {
  const w = wl.w;
  const list = steps();
  const next = list.find((s) => !isDone(s.key) && !s.optional) || list[0];
  return h(
    "div",
    { class: "wl-home" },
    h(
      "section",
      { class: "wl-hero" },
      h(
        "p",
        { class: "wl-eyebrow" },
        `${GENRE[w.genre]} writing · ${wl.unit.subject} · Grade ${wl.unit.grade}`,
      ),
      h("h1", null, w.title),
      h("p", { class: "wl-hero__unit" }, wl.unit.unit_title),
      h(
        "div",
        { class: "wl-prompt" },
        h("span", { class: "wl-prompt__k" }, `Your task · ${LEVEL_INFO[wl.level].name}`),
        h("p", null, byLevel(w.prompt)),
      ),
      h(
        "button",
        { type: "button", class: "st-btn st-btn--primary st-btn--lg", onclick: () => go(next.key) },
        isDone("notes") ? `Continue: ${next.title} →` : "Start writing →",
      ),
    ),
    h(
      "section",
      { class: "wl-card", "aria-labelledby": "wlLessons" },
      h("h2", { id: "wlLessons" }, "Lessons this writing uses"),
      h(
        "ol",
        { class: "wl-lessons" },
        ...w.lessons.map((l) =>
          h("li", null, h("span", { class: "wl-lessons__id" }, l.id), l.title),
        ),
      ),
    ),
    h(
      "section",
      { class: "wl-card", "aria-labelledby": "wlPath" },
      h("h2", { id: "wlPath" }, "Your writing path"),
      h(
        "ol",
        { class: "wl-path" },
        ...list.map((s, i) =>
          h(
            "li",
            { class: isDone(s.key) ? "is-done" : "" },
            h(
              "button",
              { type: "button", class: "wl-path__btn", onclick: () => go(s.key) },
              h(
                "span",
                { class: "wl-path__n", "aria-hidden": "true" },
                isDone(s.key) ? "✓" : String(i + 1),
              ),
              h(
                "span",
                { class: "wl-path__t" },
                h("b", null, s.title),
                h("span", null, s.optional ? `${s.strategy} · optional` : s.strategy),
              ),
              h("span", { class: "st-sr" }, isDone(s.key) ? " (visited)" : ""),
            ),
          ),
        ),
      ),
    ),
    printables(),
    h(
      "details",
      { class: "wl-card wl-teacher" },
      h("summary", null, "Teacher tip"),
      h("p", null, w.tip),
    ),
  );
}

function stepView(step) {
  const list = steps();
  const i = list.findIndex((s) => s.key === step.key);
  const prev = list[i - 1];
  const nxt = list[i + 1];
  const body = h("div", { class: "wl-step__body" });
  step.run(body);
  return h(
    "div",
    { class: "wl-stepwrap" },
    h(
      "nav",
      { class: "wl-rail", "aria-label": "Writing path" },
      h(
        "a",
        { class: "wl-rail__home", href: url(null), onclick: (e) => (e.preventDefault(), go(null)) },
        "Overview",
      ),
      h(
        "ol",
        null,
        ...list.map((s, k) =>
          h(
            "li",
            null,
            h(
              "a",
              {
                href: url(s.key),
                class: `wl-rail__a${s.key === step.key ? " is-current" : ""}${isDone(s.key) ? " is-done" : ""}`,
                "aria-current": s.key === step.key ? "step" : null,
                onclick: (e) => (e.preventDefault(), go(s.key)),
              },
              h("span", { class: "wl-rail__n", "aria-hidden": "true" }, String(k + 1)),
              s.title,
            ),
          ),
        ),
      ),
    ),
    h(
      "article",
      { class: "wl-step" },
      h(
        "header",
        { class: "wl-step__head" },
        h("p", { class: "wl-eyebrow" }, `Step ${i + 1} of ${list.length} · ${step.strategy}`),
        h("h1", { tabindex: "-1", id: "wlStepTitle" }, step.title),
        h("p", { class: "wl-step__why" }, step.why),
        h(
          "div",
          {
            class: "wl-progress",
            role: "progressbar",
            "aria-valuemin": "0",
            "aria-valuemax": String(list.length),
            "aria-valuenow": String(i + 1),
            "aria-label": "Path progress",
          },
          h("span", { style: `width:${Math.round(((i + 1) / list.length) * 100)}%` }),
        ),
      ),
      body,
      h(
        "footer",
        { class: "wl-step__nav" },
        prev
          ? h(
              "button",
              { type: "button", class: "st-btn", onclick: () => go(prev.key) },
              `← ${prev.title}`,
            )
          : h("button", { type: "button", class: "st-btn", onclick: () => go(null) }, "← Overview"),
        nxt
          ? h(
              "button",
              { type: "button", class: "st-btn st-btn--primary", onclick: () => go(nxt.key) },
              `Next: ${nxt.title} →`,
            )
          : h(
              "button",
              { type: "button", class: "st-btn st-btn--primary", onclick: () => go(null) },
              "Finish →",
            ),
      ),
    ),
  );
}

function render() {
  const key = params().get("step");
  const step = steps().find((s) => s.key === key);
  main.replaceChildren(step ? stepView(step) : overview());
  document.title = `${step ? `${step.title} · ` : ""}${wl.w.title} · Writing Lab`;
  if (step) document.getElementById("wlStepTitle")?.focus({ preventScroll: true });
}

function fail(msg) {
  main.replaceChildren(
    h(
      "div",
      { class: "wl-card wl-error" },
      h("h1", null, "Writing Lab"),
      h("p", null, msg),
      h(
        "a",
        { class: "st-btn st-btn--primary", href: "/bcpss-teachers/" },
        "Back to BCPSS Teachers",
      ),
    ),
  );
}

async function boot() {
  const id = String(params().get("unit") || "").trim();
  if (!/^[a-z0-9-]{3,40}$/.test(id))
    return fail("Choose a unit from BCPSS Teachers to open its Writing Lab.");
  wl.unitId = id;
  let detail = null;
  try {
    const res = await fetch(`/api/bcpss/units/${encodeURIComponent(id)}`, {
      headers: { accept: "application/json" },
    });
    if (res.ok) detail = await res.json();
  } catch {
    detail = null;
  }
  if (!detail?.writing)
    return fail("This unit's Writing Lab could not load. Check your connection and try again.");
  wl.unit = detail.unit;
  wl.studio = detail.studio || null;
  wl.w = detail.writing;
  wl.state = loadState();
  const lv = params().get("level");
  wl.level = LEVELS.includes(lv) ? lv : LEVELS.includes(wl.state.level) ? wl.state.level : "l3_4";
  document.documentElement.dataset.band = gradeBand(wl.unit.grade);
  const back = document.getElementById("wlStudio");
  if (back)
    back.href = `/bcpss-teachers/language-studio/?unit=${encodeURIComponent(id)}&level=${wl.level}`;
  renderLevels();
  render();
}
window.addEventListener("popstate", () => wl.w && render());
boot();
