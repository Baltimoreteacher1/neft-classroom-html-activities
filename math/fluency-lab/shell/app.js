// Math Fluency Lab — student app. Three destinations (Learn & Practice, Choose a Skill, My Progress) and
// one "More" drawer for everything else. Links meant for the full lab (assignments, teacher, games, writing,
// tools, daily mix, checkup) are forwarded to lab.html unchanged, so no shared link breaks.
import { GRADES, getSkill } from "../problem-bank.js";
import { topicsFor } from "../skill-path.js";
import {
  PROFILE_NAMES,
  activeProfile,
  lastVisit,
  loadTutor,
  progressSummary,
  saveGrade,
  savedGrade,
  selectLearner,
  skillMeters,
  skillStates,
} from "./store.js";
import { meterMini } from "./meter.js";
import { recommendedNext } from "./recommend.js";
import { blurbOf as blurbFor, recStripHtml, titleOf as titleFor } from "./rec-view.js";
import { loadAwards } from "./practice-cheer.js";
import { applyPrefs, prefs, readAloudOn, setPref, setReadAloud } from "./prefs.js";
import { keepLegible, setPanLabel } from "./legible.js";
import { mountSkill, stageFromParam } from "./skill.js";
import {
  esc,
  gradeName,
  gradeShort,
  lang,
  named,
  setLanguage,
  toggleLang,
  tr,
} from "./words.js";

const params = new URLSearchParams(location.search);
const hash = new URLSearchParams(location.hash.slice(1));
const LAB_VIEWS = [
  "teacher",
  "games",
  "write",
  "path",
  "notebook",
  "models",
  "practice",
  "progress",
];
const forwardToLab =
  LAB_VIEWS.includes(params.get("view")) ||
  ["daily", "mission", "checkup", "realworld"].includes(params.get("start")) ||
  params.get("stage") === "play" ||
  ["assignment", "factplan", "videos", "board"].some((k) => hash.has(k)) ||
  params.has("diagnostics") ||
  params.has("publisher-demo") ||
  params.has("tour") ||
  params.has("profile");
if (forwardToLab) location.replace(`lab.html${location.search}${location.hash}`);

const app = document.getElementById("app");
setPanLabel(() => tr("Picture: scroll sideways to see all of it"));
keepLegible(app);
const liveRegion = document.getElementById("live");
const live = (text) => {
  liveRegion.textContent = "";
  setTimeout(() => (liveRegion.textContent = text), 30);
};
// What a student reads about a skill: the authored title when there is one, else the bank title in the interface
// language; the one-line description is the skill's big idea (bilingual), else the bank rule.
const titleOf = (s) => titleFor({ ...s, grade: s.grade ?? grade });
const blurbOf = (s) => blurbFor({ ...s, grade: s.grade ?? grade });
const parseGrade = (raw) => (raw === "K" || raw === "k" ? 0 : raw === null ? null : Number(raw));
let grade = (() => {
  const g = parseGrade(params.get("grade"));
  return GRADES.some((e) => e.grade === g) ? g : savedGrade();
})();
// A shared link may name its language (`lang=es`); it applies to this visit without changing the saved choice.
if (["en", "es"].includes(params.get("lang"))) setLanguage(params.get("lang"), { persist: false });
applyPrefs();

function setGrade(g) {
  grade = g;
  saveGrade(g);
  document.documentElement.dataset.band = g <= 2 ? "k2" : g <= 5 ? "35" : "68";
}
if (grade !== null) setGrade(grade);

function nav(active) {
  const items = [
    ["home", "Learn & Practice"],
    ["library", "Choose a Skill"],
    ["progress", "My Progress"],
  ];
  document.getElementById("nav").innerHTML = items
    .map(
      ([id, label]) =>
        `<a href="#" class="nav-link" data-go="${id}" ${active === id ? 'aria-current="page"' : ""}>${esc(tr(label))}</a>`,
    )
    .join("");
  document.getElementById("brand-name").textContent = tr("Math Fluency Lab");
  document.getElementById("more-btn").textContent = tr("More");
  document.getElementById("lang-btn").textContent = lang() === "es" ? "English" : "Español";
}

function route(view, opts = {}) {
  window.scrollTo(0, 0);
  if (view === "skill") {
    nav("home");
    mountSkill(app, opts.skill, { stage: opts.stage, go: route, live });
    document.title = `${titleOf(opts.skill)} · ${tr("Math Fluency Lab")}`;
    return;
  }
  history.replaceState(
    null,
    "",
    view === "home"
      ? grade === null
        ? location.pathname
        : `?grade=${grade}`
      : `?view=${view}${grade === null ? "" : `&grade=${grade}`}`,
  );
  nav(view === "library" ? "library" : view === "progress" ? "progress" : "home");
  ({ home, library, progress })[view]();
  document.title = `${tr("Math Fluency Lab")} · EduWonderLab`;
  app.querySelector("h1")?.focus({ preventScroll: true });
}

const openSkill = (s, stage = "see") =>
  route("skill", { skill: { ...s, grade: s.grade ?? grade }, stage });

function gradePicker(compact = false) {
  return `<div class="grade-grid${compact ? " is-compact" : ""}" role="group" aria-label="${esc(tr("Choose your grade"))}">${GRADES.map(
    (g) =>
      `<button type="button" class="grade-btn" data-grade="${g.grade}" aria-pressed="${g.grade === grade}"><span class="grade-num">${gradeShort(g.grade)}</span><span class="grade-label">${esc(gradeName(g.grade))}</span></button>`,
  ).join("")}</div>`;
}

function home() {
  const last = lastVisit();
  if (grade === null) {
    app.innerHTML = `<section class="hero"><h1 tabindex="-1">${esc(tr("What would you like to practice today?"))}</h1>
      <p class="hero-sub">${esc(tr("Choose your grade"))}</p>${gradePicker()}</section>`;
    return bindGrades(() => route("home"));
  }
  const topics = topicsFor(grade);
  const resume = last && last.grade === grade ? last : null;
  // The last skill was in another grade (a sibling's turn, or a review in an earlier grade): one quiet link back.
  const elsewhere = last && last.grade !== grade && last.skill ? last : null;
  const start = resume?.skill || topics[0]?.skills[0];
  const summary = progressSummary(grade);
  const meters = keyed(skillMeters(grade));
  const recs = recommendedNext(loadTutor(), grade, {
    exclude: [`${grade}:${start.id}`],
    limit: 2,
  });
  app.innerHTML = `<section class="hero">
      <div class="hero-buddy" data-buddy aria-hidden="true"></div>
      <p class="eyebrow">${esc(gradeName(grade))} · <button type="button" class="btn-link" data-change>${esc(tr("Change grade"))}</button></p>
      <h1 tabindex="-1">${esc(tr("What would you like to practice today?"))}</h1>
      <article class="feature">
        <p class="feature-kicker">${esc(resume ? tr("Continue learning") : tr("Start here"))}</p>
        <h2 class="feature-title">${esc(titleOf({ ...start, grade }))}</h2>
        <p class="feature-text">${esc(blurbOf({ ...start, grade }))}</p>
        ${meters[`${grade}:${start.id}`] && meters[`${grade}:${start.id}`].stage !== "new" ? meterMini(meters[`${grade}:${start.id}`]) : ""}
        <div class="actions"><button type="button" class="btn btn-primary btn-lg" data-start>${esc(resume ? tr("Continue learning") : tr("Start this skill"))}</button>
        <button type="button" class="btn btn-secondary" data-go="library">${esc(resume ? tr("Choose another skill") : tr("Choose a different skill"))}</button></div>
      </article>
      ${recStripHtml(recs, { meters })}
      ${elsewhere ? `<p class="quiet-progress">${esc(tr("Continue where you left off"))}: <a href="?grade=${elsewhere.grade}&skill=${esc(elsewhere.skillId)}${elsewhere.stage && elsewhere.stage !== "learn" ? `&stage=${esc(elsewhere.stage)}` : ""}">${esc(titleOf({ ...elsewhere.skill, grade: elsewhere.grade }))} · ${esc(gradeName(elsewhere.grade))}</a></p>` : ""}
      ${summary.practiced.length ? `<p class="quiet-progress"><a href="#" data-go="progress">${esc(tr("My Progress"))}</a> · ${summary.remembered.length} ${esc(tr("Remembered on my own").toLowerCase())} · ${summary.improving.length} ${esc(tr("What I am getting stronger at").toLowerCase())}</p>` : ""}
    </section>`;
  app
    .querySelector("[data-start]")
    .addEventListener("click", () =>
      openSkill({ ...start, grade }, resume ? stageFromParam(resume.stage) : "see"),
    );
  app.querySelector("[data-change]").addEventListener("click", () => {
    grade = null;
    route("home");
  });
  // The buddy is decoration with a word of encouragement: it loads after the screen is drawn, into a box of fixed
  // size, so it never delays or shifts the first action.
  const spot = app.querySelector("[data-buddy]");
  loadAwards()
    .then((m) => {
      if (spot.isConnected) {
        spot.innerHTML = m.buddyHtml(m.buddyLook(), "home", resume ? 1 : 0, "buddy-home");
        spot.removeAttribute("aria-hidden");
      }
    })
    .catch(() => {});
}
// skillMeters() is keyed by skill id; the recommendation strip and home use "grade:id".
const keyed = (byId) => Object.fromEntries(Object.entries(byId).map(([id, m]) => [`${grade}:${id}`, m]));

function bindGrades(after) {
  app.querySelectorAll("[data-grade]").forEach((b) =>
    b.addEventListener("click", () => {
      setGrade(Number(b.dataset.grade));
      after();
    }),
  );
}

// Everyday words → topic ids, so "times tables" or "negative numbers" find the right skills.
const SYNONYMS = {
  times: "multiplication",
  multiply: "multiplication",
  multiplication: "multiplication",
  tables: "multiplication",
  divide: "division",
  division: "division",
  share: "division",
  add: "add-subtract",
  plus: "add-subtract",
  subtract: "add-subtract",
  minus: "add-subtract",
  take: "add-subtract",
  fraction: "fractions",
  fractions: "fractions",
  half: "fractions",
  decimal: "decimals",
  decimals: "decimals",
  ratio: "ratios-percents",
  ratios: "ratios-percents",
  rate: "ratios-percents",
  percent: "ratios-percents",
  proportion: "ratios-percents",
  negative: "integers-rational",
  integer: "integers-rational",
  integers: "integers-rational",
  equation: "expressions-equations",
  equations: "expressions-equations",
  expression: "expressions-equations",
  variable: "expressions-equations",
  inequality: "expressions-equations",
  graph: "functions",
  slope: "functions",
  function: "functions",
  line: "functions",
  area: "measurement-geometry",
  volume: "measurement-geometry",
  shape: "measurement-geometry",
  angle: "measurement-geometry",
  time: "measurement-geometry",
  clock: "measurement-geometry",
  money: "money",
  coins: "money",
  data: "data",
  mean: "data",
  median: "data",
  chart: "data",
  count: "counting",
  counting: "counting",
  place: "place-value",
  tens: "place-value",
  exponent: "exponents-roots",
  square: "exponents-roots",
  factor: "factors-multiples",
  multiple: "factors-multiples",
  prime: "factors-multiples",
};

// A few meaningful filters, never more: everything, new to me, still practising, due for a refresh.
const FILTERS = [
  ["all", "All skills"],
  ["learn", "Learn new"],
  ["practice", "Keep practicing"],
  ["review", "Review"],
];
let filter = "all";

function library() {
  if (grade === null) {
    app.innerHTML = `<section class="hero"><h1 tabindex="-1">${esc(tr("Choose a Skill"))}</h1>${gradePicker()}</section>`;
    return bindGrades(() => route("library"));
  }
  const topics = topicsFor(grade);
  const states = skillStates(grade);
  const meters = skillMeters(grade);
  const all = topics.flatMap((t) => t.skills);
  const inState = (id, s) => id === "all" || states[s.id] === id;
  const counts = Object.fromEntries(FILTERS.map(([id]) => [id, all.filter((s) => inState(id, s)).length]));
  if (!counts[filter]) filter = "all";
  const inFilter = (s) => inState(filter, s);
  app.innerHTML = `<section class="library">
      <div class="library-head"><h1 tabindex="-1">${esc(tr("Choose a Skill"))}</h1>${gradePicker(true)}</div>
      <label class="search"><span class="sr-only">${esc(tr("Search skills"))}</span>
        <input type="search" data-search placeholder="${esc(tr("Try “fractions”, “ratio”, “times tables”"))}" aria-label="${esc(tr("Search skills"))}"/></label>
      <div class="filters" role="group" aria-label="${esc(tr("Show"))}">${FILTERS.map(
        ([id, label]) =>
          `<button type="button" class="chip" data-filter="${id}" aria-pressed="${id === filter}" ${id !== "all" && !counts[id] ? "disabled" : ""}>${esc(tr(label))} <span class="chip-count">${counts[id]}</span></button>`,
      ).join("")}</div>
      <div data-results></div></section>`;
  const results = app.querySelector("[data-results]");
  let query = "";
  const draw = () => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = (topic, s) =>
      inFilter(s) &&
      (!words.length ||
        words.every(
          (w) =>
            `${s.title} ${titleOf(s)} ${blurbOf(s)} ${s.learn?.rule || ""} ${topic.name} ${named(topic.name)}`
              .toLowerCase()
              .includes(w) ||
            SYNONYMS[w] === topic.id ||
            SYNONYMS[w.replace(/e?s$/, "")] === topic.id,
        ));
    const html = topics
      .map((topic) => ({ topic, skills: topic.skills.filter((s) => matches(topic, s)) }))
      .filter((g) => g.skills.length)
      .map(
        ({ topic, skills }) =>
          `<section class="strand"><h2>${esc(named(topic.name))}</h2><div class="cards">${skills
            .map(
              (
                s,
              ) => `<article class="card"><h3>${esc(titleOf(s))}</h3><p>${esc(blurbOf(s))}</p>${meters[s.id] && meters[s.id].stage !== "new" ? meterMini(meters[s.id]) : ""}
          <button type="button" class="btn btn-secondary" data-skill="${esc(s.id)}" aria-label="${esc(`${tr("Start")}: ${titleOf(s)}`)}">${esc(tr("Start"))}</button></article>`,
            )
            .join("")}</div></section>`,
      )
      .join("");
    results.innerHTML =
      html ||
      `<p class="empty">${esc(tr(filter === "all" ? "No skills match that search in this grade." : "No skills match that search and filter."))}</p>`;
    results
      .querySelectorAll("[data-skill]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          openSkill({ ...getSkill(grade, b.dataset.skill), grade }),
        ),
      );
  };
  app.querySelector("[data-search]").addEventListener("input", (e) => {
    query = e.target.value;
    draw();
  });
  app.querySelectorAll("[data-filter]").forEach((b) =>
    b.addEventListener("click", () => {
      filter = b.dataset.filter;
      app
        .querySelectorAll("[data-filter]")
        .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
      live(`${tr(b.textContent.replace(/\d+$/, "").trim())}`);
    }),
  );
  bindGrades(() => route("library"));
  draw();
}

function progress() {
  if (grade === null) return route("library");
  const s = progressSummary(grade);
  const meters = skillMeters(grade);
  const list = (rows) =>
    `<ul class="plist">${rows.map(({ skill }) => `<li><a href="?grade=${grade}&skill=${esc(skill.id)}&stage=practice">${esc(titleOf(skill))}</a> ${meterMini(meters[skill.id])}</li>`).join("")}</ul>`;
  const next = topicsFor(grade)
    .flatMap((t) => t.skills)
    .find((sk) => !s.practiced.some((r) => r.skill.id === sk.id));
  app.innerHTML = `<section class="progress"><p class="eyebrow">${esc(gradeName(grade))}</p><h1 tabindex="-1">${esc(tr("My Progress"))}</h1>
    ${s.practiced.length ? "" : `<p class="lead">${esc(tr("Nothing practiced yet in this grade. Pick a skill to begin."))}</p>`}
    ${s.remembered.length ? `<div class="panel"><h2>${esc(tr("Remembered on my own"))}</h2>${list(s.remembered)}</div>` : ""}
    ${s.improving.length ? `<div class="panel"><h2>${esc(tr("What I am getting stronger at"))}</h2>${list(s.improving)}</div>` : ""}
    <div class="panel"><h2>${esc(tr("What I can try next"))}</h2><ul class="plist">
      ${s.refresh
        .slice(0, 2)
        .map(
          ({ skill }) =>
            `<li><a href="?grade=${grade}&skill=${esc(skill.id)}&stage=practice">${esc(tr("Time for a quick refresh"))}: ${esc(titleOf(skill))}</a></li>`,
        )
        .join("")}
      ${next ? `<li><a href="?grade=${grade}&skill=${esc(next.id)}">${esc(titleOf(next))}</a></li>` : ""}
      ${s.openMistakes ? `<li><a href="lab.html?grade=${grade}&view=notebook">${esc(tr("Mistakes to fix"))}: ${s.openMistakes}</a></li>` : ""}
    </ul></div></section>`;
}

// The More drawer: everything that is not the student's next step, grouped by who it is for, then settings.
// Every link goes to a page that exists; every setting does something visible on this page.
function more() {
  const g = grade === null ? "" : `grade=${grade}&`;
  const dlg = document.getElementById("more");
  const { ids, active } = activeProfile();
  const p = prefs();
  const link = (href, label) => `<li><a href="${href}">${esc(tr(label))}</a></li>`;
  const toggle = (name, label, on) =>
    `<label class="toggle"><input type="checkbox" data-pref="${name}" ${on ? "checked" : ""}/> <span>${esc(tr(label))}</span></label>`;
  const learnerOptions = PROFILE_NAMES.map(
    (name, id) =>
      `<option value="${id}" ${id === active ? "selected" : ""}>${esc(ids.includes(id) ? name : `${name} (${tr("new")})`)}</option>`,
  ).join("");
  dlg.querySelector("[data-more-body]").innerHTML = `
    <h2 id="more-title">${esc(tr("More"))}</h2>
    <h3>${esc(tr("Explore more"))}</h3><ul class="more-list">
      ${link(`lab.html?${g}view=games`, "Game Room")}${link("ratio-studio/", "Ratio Studio")}
      ${link("reality/", "Math Reality")}${link(`lab.html?${g}view=models`, "Math tools and models")}
      ${link(`lab.html?${g}view=write`, "Math Writing Studio")}${link(`lab.html?${g}start=daily`, "Daily mix")}</ul>
    <h3>${esc(tr("For families"))}</h3><ul class="more-list">
      ${link("family-adventure/", "Family Math Expedition")}${link(`lab.html?${g}view=progress`, "Progress report and printing")}</ul>
    <h3>${esc(tr("For teachers"))}</h3><ul class="more-list">
      ${link(`lab.html?${g}view=teacher`, "Teacher studio: assignments, class reports, print packets")}
      ${link(`lab.html?${g}start=checkup`, "Starting-point checkup")}
      ${link(`lab.html${grade === null ? "" : `?grade=${grade}`}`, "Full lab (all features)")}</ul>
    <h3>${esc(tr("Settings"))}</h3>
    <div class="settings">
      ${toggle("largeText", "Larger text", p.largeText)}
      ${toggle("readingFont", "Reading font", p.readingFont)}
      ${toggle("reduceMotion", "Reduce motion", p.reduceMotion)}
      ${speechSupported() ? toggle("readAloud", "Read aloud", readAloudOn(grade ?? 3)) : ""}
      <label class="field"><span>${esc(tr("Learner on this device"))}</span>
        <select data-learner>${learnerOptions}</select></label>
      <p class="note">${esc(tr("Each learner keeps their own grade and progress on this device."))}</p>
      <ul class="more-list">${link(`lab.html?${g}view=progress`, "Back up or restore progress")}</ul>
    </div>`;
  dlg.querySelectorAll("[data-pref]").forEach((input) =>
    input.addEventListener("change", () => {
      if (input.dataset.pref === "readAloud") setReadAloud(input.checked, grade ?? 3);
      else setPref(input.dataset.pref, input.checked);
      live(`${input.parentElement.textContent.trim()}: ${tr(input.checked ? "On" : "Off")}`);
    }),
  );
  dlg.querySelector("[data-learner]").addEventListener("change", (e) => {
    if (!selectLearner(Number(e.target.value))) return;
    // A learner owns their grade, progress and settings, so the app starts again from their home screen.
    location.assign(location.pathname);
  });
  dlg.showModal();
}
const speechSupported = () => "speechSynthesis" in window;

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-skill-link]");
  if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
    const [g, id] = link.dataset.skillLink.split(":");
    const skill = getSkill(Number(g), id);
    if (skill) {
      event.preventDefault();
      if (Number(g) !== grade) setGrade(Number(g));
      return openSkill({ ...skill, grade: Number(g) });
    }
  }
  const go = event.target.closest("[data-go]");
  if (go) {
    event.preventDefault();
    route(go.dataset.go);
  }
});
document
  .getElementById("brand")
  .addEventListener("click", (e) => (e.preventDefault(), route("home")));
document.getElementById("more-btn").addEventListener("click", more);
// The language button re-draws where the learner is: the skill and step (or the library / progress view) live in the
// address bar, which the views keep current, so it is read again rather than the copy taken when the page loaded.
document.getElementById("lang-btn").addEventListener("click", () => {
  toggleLang();
  boot(new URLSearchParams(location.search));
});

function boot(source = params) {
  if (forwardToLab) return;
  const skill = grade !== null && source.get("skill") ? getSkill(grade, source.get("skill")) : null;
  const view = source.get("view");
  if (skill) {
    const stage =
      source.get("start") === "practice" ? "practice" : stageFromParam(source.get("stage"));
    params.delete("skill");
    return openSkill({ ...skill, grade }, stage);
  }
  route(view === "library" || view === "progress" ? view : "home");
}
boot();
