// Markup for /curriculum/learning-labs/. Everything here works without JavaScript;
// shared/catalog.mjs layers on search, filters, progress, and "this week in class".
import { esc } from "../../curriculum/learning-labs/shared/model.mjs";

const modelLabels = {
  array: "Seating array",
  data: "Data display",
  decimal: "Decimal receipt",
  division: "Division model",
  ratio: "Ratio mixer",
  rate: "Unit-price comparison",
  conversion: "Unit conversion",
  growth: "Table and graph",
  percent: "Hundred grid",
  area: "Area model",
  solid: "Nets and volume",
  fraction: "Fraction strips",
  power: "Powers and order",
  expression: "Area-model expressions",
  factors: "Factor lists",
  line: "Number line",
  coordinates: "Coordinate plane",
  balance: "Balance scale",
  inequality: "Inequality line",
};

const steps = [
  ["Mission", "See the challenge"],
  ["Learn", "Step through an example"],
  ["Investigate", "Change the model and notice"],
  ["Practice", "Pick Support, Core, or Stretch"],
  ["Create", "Design something of your own"],
  ["Games", "Play to finish the lab"],
];

const lessonNumber = (id) => id.replace("-", ".");
const lessonLabel = (ids) =>
  `${ids.length > 1 ? "Lessons" : "Lesson"} ${ids.map(lessonNumber).join(" & ")}`;

function card(l) {
  const model = modelLabels[l.model] || l.model;
  const search = [l.title, ...l.lessons.map(lessonNumber), ...l.lessonTitles, model, l.finale]
    .join(" ")
    .toLowerCase();
  return `<article class="lab-card" style="--accent:${l.accent}" data-lab="${l.id}" data-unit="${l.unit}" data-lessons="${l.lessons.join(" ")}" data-model="${esc(l.model)}" data-search="${esc(search)}"><div class="card-top"><span class="lab-card-icon" aria-hidden="true">${l.icon}</span><p class="lesson-label">${lessonLabel(l.lessons)}</p></div><h3><a class="card-link" href="${l.href}">${esc(l.title)}</a></h3><p class="card-mission">${esc(l.mission)}</p><ul class="card-lessons" aria-label="Connected lessons">${l.lessons.map((id, n) => `<li><a href="/lessons/${id}/">${lessonNumber(id)} ${esc(l.lessonTitles[n])}</a></li>`).join("")}</ul><p class="card-tags"><span class="lesson-chip quiet-chip">${esc(model)}</span><span class="lesson-chip quiet-chip">Game: ${esc(l.finale)}</span></p><div class="card-foot"><span class="card-progress" data-progress>Not started</span><span class="card-cta" aria-hidden="true">Start lab</span></div></article>`;
}

function unitSection(name, number, labs) {
  return `<details class="catalog-unit" id="unit-${number}" data-unit="${number}" open><summary><h2><span class="unit-number">Unit ${number}</span> <span class="unit-name">${esc(name)}</span><span class="unit-count"><span class="visually-hidden">, </span>${labs.length} ${labs.length === 1 ? "lab" : "labs"}</span><span class="unit-progress" data-unit-progress></span></h2></summary><div class="catalog-grid">${labs.map(card).join("")}</div></details>`;
}

export function catalogBody({ catalog, unitNames, lessonCount, version }) {
  const models = [...new Set(catalog.map((l) => l.model))]
    .map((m) => [m, modelLabels[m] || m])
    .sort((a, b) => a[1].localeCompare(b[1]));
  return `<a class="skip-link" href="#catalog">Skip to labs</a><header class="catalog-header" id="top"><nav class="crumbs" aria-label="Breadcrumb"><a href="/curriculum/">Curriculum</a><a href="/curriculum/units/">Units and lessons</a></nav><p class="labs-kicker">Grade 6 math</p><h1>Learning labs</h1><p class="labs-lead">Hands-on math missions. Play with a live model, practice at your level, build something of your own, and finish with a game.</p><p class="catalog-meta">${catalog.length} labs for all ${lessonCount} lessons · Your work saves on this device</p><section class="labs-spotlight" id="labs-spotlight" aria-labelledby="spotlight-title" hidden><h2 id="spotlight-title">Pick up here</h2><div class="spotlight-groups"></div></section><section class="lab-steps" aria-labelledby="steps-title"><h2 id="steps-title">Every lab has six parts</h2><ol>${steps.map(([title, detail]) => `<li><strong>${title}</strong><span>${detail}</span></li>`).join("")}</ol><p class="steps-note">Start anywhere. Stuck? Switch to Support, open a hint, or reread a worked example. Use <strong>Download work</strong> to keep a copy.</p></section><form class="catalog-finder" role="search" data-finder hidden><div class="finder-field finder-search"><label for="lab-search">Search labs</label><input id="lab-search" name="q" type="search" placeholder="Try 3.4, histogram, or percent" autocomplete="off"></div><div class="finder-field"><label for="lab-model">Model</label><select id="lab-model" name="model"><option value="">All models</option>${models.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join("")}</select></div><div class="finder-field"><label for="lab-status">Show</label><select id="lab-status" name="status"><option value="">All labs</option><option value="new">Not started</option><option value="started">In progress</option><option value="done">Finished</option></select></div><button type="reset" class="quiet finder-clear">Clear</button><p class="finder-status" role="status"></p></form></header><nav class="unit-bar" aria-label="Jump to unit"><div class="unit-bar-inner"><ul class="unit-nav">${unitNames.map((_n, i) => `<li><a href="#unit-${i + 1}">Unit ${i + 1}</a></li>`).join("")}</ul><a class="to-top" href="#top" aria-label="Back to top">↑ Top</a></div></nav><main id="catalog"><div class="unit-tools" data-unit-tools hidden><button type="button" class="quiet" data-units="open">Open all units</button><button type="button" class="quiet" data-units="close">Close all units</button></div>${unitNames
    .map((name, i) =>
      unitSection(
        name,
        i + 1,
        catalog.filter((l) => l.unit === i + 1),
      ),
    )
    .join(
      "",
    )}</main><footer>EduWonderLab · Grade 6 mathematics · <a href="/curriculum/">Return to curriculum</a></footer><script src="/assets/pacing-unit-dates.generated.js" defer></script><script type="module" src="/curriculum/learning-labs/shared/catalog.mjs?v=${version}"></script>`;
}
