// Deeper tools: advanced statistics and prediction, explained in four plain lines each (what we found, what it means,
// what to try, how sure to be). A card grid opens one tool at a time. The maths lives in lab-stats.js and lab-model.js;
// this file only draws it. Data stays on this device and every result is exploratory: it describes this class and
// never says why a score moved.
import { adjacentYearPairs } from "./analysis.js";
import { h, table } from "./dom.js";
import { classSummary } from "./interpret.js";
import {
  cohortRows,
  compareModel,
  groupsModel,
  nameOf,
  projectionModel,
  speedModel,
  togetherModel,
  unusualModel,
} from "./lab-model.js";
import { ASSESSMENTS, DOMAINS } from "./rules.js";
import { emptyState, heading } from "./view-common.js";

const cohortKey = (g) => `${g.type}|${g.year}|${g.levelVersion}`;
const cohortText = (g) =>
  `${g.type.replaceAll("_", " ")} · ${g.year} · ${g.records.length} students`;
const pct = (v) => `${Math.max(0, Math.min(100, ((v - 1) / 5) * 100)).toFixed(1)}%`;

const TOOLS = [
  {
    id: "groups",
    title: "Groups that look alike",
    ask: "Which students could I teach together?",
    needs: "cohort",
  },
  {
    id: "together",
    title: "Skills that move together",
    ask: "If one skill is strong, is another?",
    needs: "cohort",
  },
  {
    id: "unusual",
    title: "Unusual profiles",
    ask: "Who has one skill far from the rest?",
    needs: "cohort",
  },
  {
    id: "speed",
    title: "Faster or slower growth",
    ask: "Who grew faster or slower than the class?",
    needs: "pair",
  },
  {
    id: "project",
    title: "Next-year projection",
    ask: "Where might each student land next year?",
    needs: "students",
  },
  {
    id: "compare",
    title: "Did this group grow more?",
    ask: "Did the students I supported grow more?",
    needs: "pair",
  },
];

const field = (id, label, choices, current, onChange) =>
  h(
    "label",
    { class: "pi-field pi-analysis-field", for: id },
    h("span", {}, label),
    h(
      "select",
      { id, on: { change: (e) => onChange(e.target.value) } },
      ...choices.map(([v, text]) => h("option", { value: v, selected: v === current }, text)),
    ),
  );

/** The four plain lines every tool ends in. */
function answer(m, details) {
  if (!m.ok)
    return h(
      "section",
      { class: "pi-card pi-lab-answer is-wait", "aria-live": "polite" },
      h("h3", {}, "Not enough data for this yet"),
      h("p", {}, m.why),
      h(
        "p",
        { class: "fine" },
        "Try the Sample class from the top bar to see how this tool works.",
      ),
    );
  const line = (label, text) =>
    h(
      "div",
      { class: "pi-lab-line" },
      h("span", { class: "pi-lab-label" }, label),
      h("p", {}, text),
    );
  return h(
    "section",
    { class: "pi-card pi-lab-answer", "aria-live": "polite" },
    h("h3", { class: "pi-lab-headline" }, m.headline),
    line("What this means", m.plain),
    line("What to try", m.act),
    line("How sure to be", m.sure),
    details
      ? h(
          "details",
          { class: "pi-details" },
          h("summary", {}, "How this works, in plain words"),
          ...[].concat(details).map((t) => h("p", {}, t)),
        )
      : null,
  );
}

function groupsView(ws, cohort) {
  const m = groupsModel(cohortRows(cohort), cohort.records.length);
  const cards = m.ok
    ? m.groups.map((g, i) =>
        h(
          "article",
          { class: "pi-card pi-lab-group", "aria-labelledby": `piLabG${i}` },
          h("h4", { id: `piLabG${i}` }, `Group ${i + 1} · ${g.size} students`),
          h("p", { class: "pi-lab-sub" }, g.label),
          h(
            "ul",
            { class: "pi-lab-bars", "aria-label": "Middle level in each skill" },
            DOMAINS.map((d, j) =>
              h(
                "li",
                {},
                h("span", {}, d),
                h(
                  "span",
                  { class: "pi-lab-track" },
                  h("span", { class: "pi-lab-fill", style: `width:${pct(g.means[j])}` }),
                ),
                h("strong", {}, g.means[j].toFixed(1)),
              ),
            ),
          ),
          h(
            "p",
            {},
            h("strong", {}, "Focus: "),
            g.even ? `all four skills, starting with ${g.focus}` : g.focus,
          ),
          h("p", { class: "fine" }, g.students.join(", ")),
        ),
      )
    : [];
  return [
    answer(m, [
      "We looked at each student's four skill levels and found the split into 2 to 4 groups where students in a group look most alike, and groups look most different from each other.",
      "Behind the scenes: k-means clustering with seeded starts; the number of groups is the one with the best silhouette score (how clearly apart the groups are).",
    ]),
    h("div", { class: "pi-lab-groups" }, cards),
  ];
}

function togetherView(ws, cohort) {
  const m = togetherModel(cohortRows(cohort));
  const shade = (p) =>
    !p.clear ? "is-0" : Math.abs(p.rho) >= 0.7 ? "is-3" : Math.abs(p.rho) >= 0.4 ? "is-2" : "is-1";
  const cell = (a, b) => {
    if (a === b) return h("span", { class: "pi-lab-cell is-diag" }, "—");
    const p = m.pairs.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    return h("span", { class: `pi-lab-cell ${shade(p)}` }, p.rho == null ? "?" : p.rho.toFixed(2));
  };
  return [
    answer(m, [
      "For each pair of skills we ask: when one student ranks higher than another in the first skill, do they usually rank higher in the second too? 1.00 means always, 0 means no link, and negative means the opposite.",
      "Behind the scenes: Spearman rank correlation with a 95% bootstrap range (students resampled 1,000 times). A shaded square means the range stays on one side of zero.",
    ]),
    m.ok
      ? h(
          "section",
          { class: "pi-card" },
          h("h3", {}, "Skill-by-skill connection"),
          table(
            "Connection between each pair of skills",
            ["Skill", ...DOMAINS], DOMAINS.map((a) => [a, ...DOMAINS.map((b) => cell(a, b))]),
            { className: "pi-table pi-lab-matrix" },
          ),
          h(
            "ul",
            { class: "pi-lab-list" },
            m.pairs.map((p) =>
              h(
                "li",
                {},
                h("strong", {}, `${p.a} and ${p.b}`),
                `: ${p.words}`,
                p.rho == null
                  ? ""
                  : h(
                      "span",
                      { class: "fine" },
                      ` (${p.rho.toFixed(2)}, could be ${p.lo.toFixed(2)} to ${p.hi.toFixed(2)})`,
                    ),
              ),
            ),
          ),
        )
      : null,
  ];
}

function unusualView(ws, cohort) {
  const m = unusualModel(cohortRows(cohort));
  return [
    answer(m, [
      "For each student we find the middle of their own four skills, then see how far each skill sits from it. We compare that gap with how big gaps usually are in your class, so only truly odd ones stand out.",
      "Behind the scenes: robust z-scores (median and median absolute deviation) on within-student gaps; a flag needs a gap of at least 1 level and about 2 typical spreads.",
    ]),
    m.ok && m.flags.length
      ? h(
          "section",
          { class: "pi-card" },
          h("h3", {}, "Worth a second look"),
          table(
            "Students with one skill far from their others",
            ["Student", "Skill", "What we saw"],
            m.flags.map((f) => [f.name, f.domain, f.words]),
          ),
        )
      : null,
  ];
}

function speedView(ws, pair, domain) {
  const m = speedModel(pair, domain);
  const max = m.ok ? Math.max(1, ...m.rows.map((r) => Math.abs(r.change))) : 1;
  const bar = (r) =>
    h(
      "span",
      { class: `pi-lab-diverge ${r.change < 0 ? "is-down" : "is-up"}`, "aria-hidden": "true" },
      h("span", { style: `width:${(Math.abs(r.change) / max) * 50}%` }),
    );
  return [
    answer(m, [
      "For each student we take this year's level minus last year's. 'Usual' is the middle change in your class. Students far above or below the middle, compared with how much the class normally varies, are called faster or slower.",
      "Behind the scenes: robust z-scores on matched year-to-year changes within one assessment and level scale.",
    ]),
    m.ok
      ? h(
          "section",
          { class: "pi-card" },
          h("h3", {}, `${domain} change, ${pair.from} to ${pair.to}`),
          table(
            `${domain} change for each student`,
            ["Student", "Change", "", "Compared with the class"],
            m.rows.map((r) => [
              r.name,
              `${r.change > 0 ? "+" : ""}${r.change.toFixed(1)}`,
              bar(r),
              r.band,
            ]),
          ),
        )
      : null,
  ];
}

function projectView(ws, domain) {
  const m = projectionModel(ws.students, domain);
  const range = (r) =>
    h(
      "span",
      {
        class: "pi-lab-range",
        role: "img",
        "aria-label": `${r.lo.toFixed(1)} to ${r.hi.toFixed(1)}`,
      },
      h("span", {
        class: "pi-lab-span",
        style: `left:${pct(r.lo)};width:calc(${pct(r.hi)} - ${pct(r.lo)})`,
      }),
      h("span", { class: "pi-lab-dot", style: `left:${pct(r.predicted)}` }),
    );
  return [
    answer(m, [
      "We looked at every student in your class who has results in two school years in a row, and drew the straight line that best links last year's level to this year's. We then used that line to project forward.",
      "To set the range honestly we left each student out in turn, predicted them from everyone else, and measured how far off we were. About 8 in 10 students should land inside the range.",
      "Behind the scenes: least-squares line with leave-one-out split-conformal prediction intervals, compared with the 'no change' baseline.",
    ]),
    m.ok && m.rows.length
      ? h(
          "section",
          { class: "pi-card" },
          h("h3", {}, `${domain} projection`),
          table(
            `${domain} projection for next year`,
            ["Student", "Now", "Next year", "Likely range (1 to 6)", ""],
            m.rows.map((r) => [
              r.name,
              r.now.toFixed(1),
              `${r.predicted.toFixed(1)} (${r.year})`,
              `${r.lo.toFixed(1)} to ${r.hi.toFixed(1)}`,
              range(r),
            ]),
          ),
        )
      : null,
  ];
}

function compareView(ws, pair, domain) {
  const names = pair.rows.map(({ student }) => nameOf(student)).sort((a, b) => a.localeCompare(b));
  const picked = (ws.sub.labPick || []).filter((n) => names.includes(n));
  const m = compareModel(pair, domain, picked);
  const toggle = (name) => {
    const set = new Set(picked);
    set.has(name) ? set.delete(name) : set.add(name);
    ws.sub.labPick = [...set];
    ws.sub.labFocus = `piLabPick-${name}`;
    ws.rerender();
  };
  return [
    h(
      "fieldset",
      { class: "pi-card pi-lab-pick" },
      h("legend", {}, "Tick the students you want to check"),
      h(
        "p",
        { class: "fine" },
        "For example, the students who got a new support or a small group this year.",
      ),
      h(
        "div",
        { class: "pi-lab-checks" },
        names.map((n) =>
          h(
            "label",
            { class: "pi-lab-check" },
            h("input", {
              type: "checkbox",
              id: `piLabPick-${n}`,
              checked: picked.includes(n),
              on: { change: () => toggle(n) },
            }),
            h("span", {}, n),
          ),
        ),
      ),
    ),
    picked.length < 2
      ? h(
          "section",
          { class: "pi-card pi-lab-answer is-wait", "aria-live": "polite" },
          h("h3", {}, "Tick at least 2 students to begin"),
          h("p", {}, "Then we compare them with everyone you leave unticked. Leave at least 2 students unticked."),
        )
      : null,
    picked.length < 2 ? null : answer(m, [
      "We compare how much your ticked students changed with how much everyone else changed. Then we shuffle who is 'in the group' thousands of times to see how often a gap this big appears by pure luck.",
      "Behind the scenes: permutation test on the difference in mean change (exact when the class is small enough to list every shuffle), with Cliff's delta as the effect size.",
    ]),
  ];
}

export function renderLab(ws) {
  if (!ws.students.length) return emptyState(ws);
  const open = TOOLS.find((t) => t.id === ws.sub.lab);
  const cohorts = classSummary(ws.students).groups.filter(
    (g) => ASSESSMENTS[g.type]?.kind === "annual",
  );
  const pairs = adjacentYearPairs(ws.students);
  const head = [
    heading(2, "Deeper tools"),
    h(
      "p",
      { class: "lead" },
      "Advanced statistics and prediction, in plain words. Pick a question. Each answer says what we found, what it means, what to try, and how sure to be.",
    ),
  ];
  if (!open)
    return h(
      "div",
      { class: "pi-stack pi-lab" },
      ...head,
      h(
        "div",
        { class: "pi-lab-grid" },
        TOOLS.map((t) =>
          h(
            "button",
            {
              type: "button",
              class: "pi-lab-card",
              "data-lab": t.id,
              on: { click: () => ((ws.sub.lab = t.id), ws.rerender()) },
            },
            h("strong", {}, t.title),
            h("span", {}, t.ask),
          ),
        ),
      ),
    );

  const back = h(
    "button",
    {
      type: "button",
      class: "btn small",
      on: { click: () => ((ws.sub.lab = null), ws.rerender()) },
    },
    "All tools",
  );
  const intro = h(
    "div",
    { class: "pi-lab-top" },
    back,
    h("h3", { class: "pi-lab-title" }, open.title),
    h("p", { class: "pi-lab-ask" }, open.ask),
  );
  const controls = [];
  let body;
  if (open.needs === "cohort") {
    const choices = cohorts.map((g) => [cohortKey(g), cohortText(g)]);
    const cur = choices.some(([v]) => v === ws.sub.analysisCohort)
      ? ws.sub.analysisCohort
      : choices[0]?.[0];
    const cohort = cohorts.find((g) => cohortKey(g) === cur);
    if (cohort)
      controls.push(
        field(
          "piLabCohort",
          "Group of students",
          choices,
          cur,
          (v) => ((ws.sub.analysisCohort = v), ws.rerender()),
        ),
      );
    body = cohort
      ? { groups: groupsView, together: togetherView, unusual: unusualView }[open.id](ws, cohort)
      : answer({ ok: false, why: "There are no reported annual results yet." });
  } else if (open.needs === "pair") {
    const choices = pairs.map((p) => [
      p.key,
      `${p.type.replaceAll("_", " ")} · ${p.from} to ${p.to} · ${p.rows.length} students`,
    ]);
    const cur = choices.some(([v]) => v === ws.sub.analysisYears)
      ? ws.sub.analysisYears
      : choices[0]?.[0];
    const pair = pairs.find((p) => p.key === cur);
    const domain = DOMAINS.includes(ws.sub.labDomain) ? ws.sub.labDomain : "Reading";
    if (pair) {
      controls.push(
        field(
          "piLabYears",
          "Years",
          choices,
          cur,
          (v) => ((ws.sub.analysisYears = v), ws.rerender()),
        ),
        field(
          "piLabDomain",
          "Skill",
          DOMAINS.map((d) => [d, d]),
          domain,
          (v) => ((ws.sub.labDomain = v), ws.rerender()),
        ),
      );
      body = open.id === "speed" ? speedView(ws, pair, domain) : compareView(ws, pair, domain);
    } else
      body = answer({
        ok: false,
        why: "This tool needs students with results in two school years in a row. None of your students have that yet.",
      });
  } else {
    const domain = DOMAINS.includes(ws.sub.labDomain) ? ws.sub.labDomain : "Reading";
    controls.push(
      field(
        "piLabDomain",
        "Skill",
        DOMAINS.map((d) => [d, d]),
        domain,
        (v) => ((ws.sub.labDomain = v), ws.rerender()),
      ),
    );
    body = projectView(ws, domain);
  }
  queueMicrotask(() => {
    const id = ws.sub.labFocus;
    ws.sub.labFocus = null;
    if (id) document.getElementById(id)?.focus();
  });
  return h(
    "div",
    { class: "pi-stack pi-lab" },
    ...head,
    intro,
    h("div", { class: "pi-analysis-controls" }, controls),
    ...[].concat(body),
  );
}
