// Overview: the first useful picture, with no settings. One student: overall gauge, four domain tiles (level,
// level name, change since the last comparable result, trend line), strength / focus / next step, composites
// and practice activity. The whole class: headline numbers, a students x domains heatmap, the level
// distribution per domain and weekly practice. Assessment versions are never pooled.
import {
  activityColumns,
  DOMAIN_COLORS,
  gauge,
  heatmap,
  sparkline,
  stackedLevels,
} from "./charts2.js";
import { fmt1, h, table } from "./dom.js";
import {
  classSummary,
  comparableSteps,
  domainProfile,
  levelName,
  nextAction,
} from "./interpret.js";
import { qualityReport } from "./quality.js";
import { recordsOf } from "./records.js";
import {
  ASSESSMENTS,
  COMPOSITE_INFO,
  COMPOSITES,
  DOMAINS,
  LEVEL_WORDS,
  levelComparable,
  SCALE_WORDS,
} from "./rules.js";
import { usageSummary, weeklyActivity } from "./usage.js";
import {
  assessmentLabel,
  emptyState,
  explain,
  scoreChip,
  studentPicker,
  subnav,
} from "./view-common.js";

const levelText = (sc) => (sc.level == null ? "—" : `${fmt1(sc.level)} ${levelName(sc.level)}`);
const scaleText = (sc) =>
  sc.scale != null
    ? String(sc.scale)
    : sc.calculatedScale != null
      ? `${sc.calculatedScale} (calculated)`
      : "—";

export function scoreTable(rec) {
  return table(
    `Scores: ${assessmentLabel(rec, ASSESSMENTS)}`,
    ["Score", "Proficiency level", "Scale score", "Status"],
    [
      ...DOMAINS.map((d) => [d, rec.domains[d]]),
      ...COMPOSITES.map((c) => [`${COMPOSITE_INFO[c].label} (composite)`, rec.composites[c]]),
    ].map(([label, sc]) => [
      label,
      levelText(sc),
      scaleText(sc),
      scoreChip(sc.status === "missing" && sc.calculatedScale != null ? "calculated" : sc.status),
    ]),
  );
}

/** Comparable series (same family, scale and cut-score version as the latest result) for one score key. */
function comparableSeries(recs, rec, key) {
  return recs
    .filter((r) => levelComparable(r, rec))
    .map((r) => ({
      label: r.academicYear,
      value: key === "Overall" ? r.composites.Overall.level : r.domains[key].level,
    }));
}

function domainTile(recs, rec, d, change) {
  const sc = rec.domains[d];
  const series = comparableSeries(recs, rec, d);
  const pct = sc.level == null ? 0 : ((sc.level - 1) / 5) * 100;
  const arrow =
    change == null
      ? null
      : change > 0
        ? ["up", `▲ +${change.toFixed(1)}`]
        : change < 0
          ? ["down", `▼ ${change.toFixed(1)}`]
          : ["same", "= no change"];
  return h(
    "article",
    { class: "pi-dtile", "data-domain": d, style: `--dc:${DOMAIN_COLORS[d]}` },
    h("h3", { class: "pi-dtile-name" }, d),
    sc.status === "not-assessed"
      ? h("p", { class: "pi-dtile-lv" }, "Not assessed")
      : h(
          "p",
          { class: "pi-dtile-lv" },
          h("strong", {}, sc.level == null ? "—" : sc.level.toFixed(1)),
          " ",
          h("span", {}, levelName(sc.level)),
        ),
    h("div", { class: "pi-meter", role: "presentation" }, h("span", { style: `width:${pct}%` })),
    h(
      "div",
      { class: "pi-dtile-foot" },
      arrow
        ? h("span", { class: `pi-delta is-${arrow[0]}` }, arrow[1])
        : h("span", { class: "pi-delta" }, series.length > 1 ? "" : "First result"),
      series.length > 1
        ? sparkline({ points: series, color: DOMAIN_COLORS[d], label: `${d} trend` })
        : null,
    ),
  );
}

function studentOverview(ws) {
  const st = ws.student();
  const recs = recordsOf(st);
  const rec = recs.at(-1);
  if (!rec)
    return h(
      "div",
      { class: "pi-stack" },
      studentPicker(ws),
      h(
        "p",
        { class: "pi-note" },
        `No assessment results are on file for ${st.name}. Use Import scores to add them.`,
      ),
    );
  const prof = domainProfile(rec);
  const q = qualityReport([st], { today: ws.today }).findings;
  const prev = comparableSteps(st)
    .filter((x) => x.to.assessmentId === rec.assessmentId)
    .at(-1);
  const change = (k) =>
    prev?.levelsComparable ? (prev.rows.find((r) => r.key === k)?.levelChange ?? null) : null;
  const use = usageSummary(st.entries || []);
  const overall = rec.composites.Overall.level;
  return h(
    "div",
    { class: "pi-stack" },
    studentPicker(ws),
    h(
      "section",
      { class: "pi-hero-card", "aria-label": `${st.name} summary` },
      h(
        "div",
        { class: "pi-hero-id" },
        h("h2", {}, st.name),
        h(
          "p",
          { class: "pi-hero-meta" },
          `${assessmentLabel(rec, ASSESSMENTS)}${rec.grade != null ? ` · Grade ${rec.grade}` : ""}`,
        ),
        h(
          "p",
          { class: "fine" },
          `${SCALE_WORDS[rec.scaleVersion]} · ${LEVEL_WORDS[rec.levelVersion]}`,
        ),
        h(
          "div",
          { class: "pi-badges" },
          rec.sourceVerified
            ? h("span", { class: "pi-chip is-new" }, "Checked against report")
            : h("span", { class: "pi-chip is-conflict" }, "Not yet checked"),
          q.length
            ? h(
                "span",
                { class: "pi-chip is-insufficient" },
                `${q.length} data note${q.length === 1 ? "" : "s"}`,
              )
            : null,
        ),
      ),
      h(
        "div",
        { class: "pi-hero-gauge", "data-kpi": "overall" },
        gauge({ level: overall, name: levelName(overall), label: "Overall" }),
        h(
          "p",
          { class: "fine" },
          overall == null
            ? "Overall not reported; never averaged from domains."
            : "Overall, as reported",
        ),
      ),
    ),
    h(
      "div",
      { class: "pi-dtiles" },
      DOMAINS.map((d) => domainTile(recs, rec, d, change(d))),
    ),
    h(
      "div",
      { class: "pi-insights" },
      h(
        "article",
        { class: "pi-insight is-strength" },
        h("h3", {}, "Strength"),
        h("p", { class: "pi-insight-big", "data-kpi": "latest" }, prof.strength || "—"),
        h(
          "p",
          {},
          prof.strength
            ? "Highest reported domain in this result."
            : "Not enough domains to compare.",
        ),
      ),
      h(
        "article",
        { class: "pi-insight is-focus" },
        h("h3", {}, "Focus next"),
        h("p", { class: "pi-insight-big" }, prof.need || "—"),
        h("p", {}, prof.need ? "Confirm with classroom work before regrouping." : ""),
      ),
      h(
        "article",
        { class: "pi-insight is-next" },
        h("h3", {}, "Next step"),
        h("p", {}, nextAction(st, rec, prof)),
        h(
          "button",
          { type: "button", class: "btn small", on: { click: () => ws.go("planner") } },
          "Open the planner",
        ),
      ),
    ),
    h(
      "div",
      { class: "pi-composites" },
      COMPOSITES.map((c) => {
        const sc = rec.composites[c];
        return h(
          "div",
          { class: "pi-comp", "data-composite": c },
          h("span", { class: "pi-comp-name" }, COMPOSITE_INFO[c].label),
          h(
            "strong",
            {},
            sc.level != null
              ? sc.level.toFixed(1)
              : sc.calculatedScale != null
                ? `${sc.calculatedScale}*`
                : "—",
          ),
          h(
            "span",
            { class: "fine" },
            sc.level != null
              ? levelName(sc.level)
              : sc.calculatedScale != null
                ? "scale, calculated"
                : "not reported",
          ),
        );
      }),
    ),
    use.total
      ? h(
          "section",
          { class: "pi-card", "aria-labelledby": "piUseT" },
          h(
            "h3",
            { id: "piUseT" },
            `Practice on The Language Page: ${use.total} activities over ${use.weeks} weeks`,
          ),
          activityColumns({
            title: `${st.name}: practice per week`,
            weeks: weeklyActivity(st.entries),
            domains: DOMAINS,
          }),
          h(
            "p",
            { class: "fine" },
            `${use.even ? "Practice is spread evenly across the four domains." : `Most practiced: ${use.most}. Least: ${use.least}.`} ${Math.round((use.independentShare || 0) * 100)}% done on their own. Practice is shown beside the scores, never turned into a level.`,
          ),
        )
      : null,
    explain({
      summary: prof.text,
      uncertain:
        "One test is one sample of language on one day. Small differences between domains can come from measurement error.",
      evidence: scoreTable(rec),
      how: h(
        "p",
        {},
        "Strength and focus compare the four reported domain levels of this one result. Changes compare only with an earlier result on the same assessment, scale and cut-score version. * A composite scale score calculated from the domain scale scores with WIDA's published weights; composite levels are never calculated.",
      ),
    }),
  );
}

function classOverview(ws) {
  const sum = classSummary(ws.students);
  const g = sum.groups[0];
  const allEntries = ws.students.flatMap((st) => st.entries || []);
  const use = usageSummary(allEntries);
  const keys = [...DOMAINS, "Overall"];
  return h(
    "div",
    { class: "pi-stack" },
    h(
      "div",
      { class: "pi-kpis" },
      h(
        "div",
        { class: "pi-kpi" },
        h("span", { class: "pi-kpi-label" }, "Students"),
        h("strong", { class: "pi-kpi-value" }, String(sum.total)),
      ),
      h(
        "div",
        { class: "pi-kpi" },
        h("span", { class: "pi-kpi-label" }, "With scores"),
        h("strong", { class: "pi-kpi-value" }, String(sum.total - sum.missing)),
        h("span", { class: "pi-kpi-note" }, sum.missing ? `${sum.missing} missing` : "everyone"),
      ),
      h(
        "div",
        { class: "pi-kpi" },
        h("span", { class: "pi-kpi-label" }, "Two comparable years"),
        h("strong", { class: "pi-kpi-value" }, String(sum.multi)),
        h("span", { class: "pi-kpi-note" }, "growth can be described"),
      ),
      h(
        "div",
        { class: "pi-kpi" },
        h("span", { class: "pi-kpi-label" }, "Practice activities"),
        h("strong", { class: "pi-kpi-value" }, String(use.total)),
        h(
          "span",
          { class: "pi-kpi-note" },
          use.total ? `${Math.round((use.independentShare || 0) * 100)}% on their own` : "none yet",
        ),
      ),
    ),
    ...sum.groups.map((grp) =>
      h(
        "section",
        { class: "pi-card", "aria-label": `${ASSESSMENTS[grp.type].short} ${grp.year}` },
        h(
          "h3",
          {},
          `${ASSESSMENTS[grp.type].short} ${grp.year}: ${grp.records.length} student${grp.records.length === 1 ? "" : "s"}`,
        ),
        h(
          "p",
          { class: "fine" },
          `${grp.words}. Shown on its own; never averaged with other versions or years.`,
        ),
        h(
          "div",
          { class: "pi-scroll" },
          heatmap({
            title: `Levels by student, ${ASSESSMENTS[grp.type].short} ${grp.year}`,
            keys,
            rows: grp.records.map(({ student, record }) => ({
              name: student.name,
              cells: keys.map((k) => ({
                key: k,
                level: k === "Overall" ? record.composites.Overall.level : record.domains[k].level,
              })),
            })),
          }),
        ),
        grp.records.length > 2
          ? stackedLevels({
              title: `How many students are at each level, ${ASSESSMENTS[grp.type].short} ${grp.year}`,
              rows: keys.map((k) => {
                const counts = [0, 0, 0, 0, 0, 0];
                for (const { record } of grp.records) {
                  const lv =
                    k === "Overall" ? record.composites.Overall.level : record.domains[k].level;
                  if (lv != null) counts[Math.min(5, Math.floor(lv) - 1)]++;
                }
                return { key: k, counts };
              }),
            })
          : null,
      ),
    ),
    use.total
      ? h(
          "section",
          { class: "pi-card", "aria-labelledby": "piClassUseT" },
          h("h3", { id: "piClassUseT" }, "Class practice per week"),
          activityColumns({
            title: "Class practice activities per week",
            weeks: weeklyActivity(allEntries),
            domains: DOMAINS,
          }),
        )
      : null,
    explain({
      summary: g
        ? `Darker cells are higher levels. Read across a row for one student’s profile, down a column for a domain across the class.`
        : "No results yet.",
      act: "Open Classroom Insights for temporary groups, or the Instructional Planner to act on one student.",
    }),
  );
}

export function renderOverview(ws) {
  if (!ws.students.length) return emptyState(ws);
  const view = ws.sub.overview || "student";
  return h(
    "div",
    {},
    subnav(
      ws,
      "overview",
      [
        ["student", "One student"],
        ["class", "Whole class"],
      ],
      view,
    ),
    view === "class" ? classOverview(ws) : studentOverview(ws),
  );
}
