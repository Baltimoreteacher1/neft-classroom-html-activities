// ACCESS Probability Center: teacher-defined targets (planning goals, stored on this device and kept
// separate from official criteria), a target attainment matrix, and the recorded exit criterion.
import { parseLevel } from "../../access-practice-lab/src/lang/official-scores.js";
import { meetsCriterion, policyFor } from "../../access-practice-lab/src/predict/policy.js";
import { fmt1, h, pct, table, tip } from "./dom.js";
import { SERIES_KEYS, seriesFor } from "./forecast.js";
import { chip, emptyState, heading } from "./view-common.js";

function targetsForm(ws) {
  const msg = h("p", { class: "fine", role: "status" });
  const inputs = SERIES_KEYS.map((k) =>
    h(
      "div",
      { class: "pi-field pi-field-sm" },
      h("label", { for: `pi-t-${k}` }, k === "Overall" ? "Overall (reported)" : k),
      h("input", {
        id: `pi-t-${k}`,
        type: "text",
        inputmode: "decimal",
        value: ws.state.targets[k] ?? "",
        placeholder: "e.g. 4.0",
        "data-target": k,
        autocomplete: "off",
      }),
    ),
  );
  const form = h(
    "form",
    {
      class: "pi-form",
      "aria-labelledby": "piTargetsTitle",
      on: {
        submit: (e) => {
          e.preventDefault();
          const next = {};
          const errors = [];
          for (const k of SERIES_KEYS) {
            const raw = form.querySelector(`[data-target="${k}"]`).value.trim();
            if (!raw) continue;
            const v = parseLevel(raw);
            if (v === null) errors.push(`${k}: enter a level from 1.0 to 6.0 with one decimal.`);
            else next[k] = v;
          }
          if (errors.length) {
            msg.textContent = errors.join(" ");
            return;
          }
          ws.state.targets = next;
          ws.save();
          ws.rerender();
          ws.announce("Teacher targets saved on this device.");
        },
      },
    },
    h("h3", { id: "piTargetsTitle" }, "Teacher targets"),
    h(
      "p",
      { class: "fine" },
      "Your own planning goals per domain. They are not official exit criteria and not passing scores.",
    ),
    h("div", { class: "pi-row" }, inputs),
    h("button", { type: "submit", class: "btn btn-primary" }, "Save targets"),
    msg,
  );
  return form;
}

function matrix(ws) {
  const keys = SERIES_KEYS.filter((k) => ws.state.targets[k] != null);
  if (!keys.length)
    return h(
      "p",
      { class: "pi-note" },
      "Set at least one teacher target to see the attainment matrix.",
    );
  const rows = ws.students.map((s) => [
    s.name,
    ...keys.map((k) => {
      const f = ws.forecast(s, k, ws.state.targets[k]);
      return f.numbers
        ? pct(f.numbers.probabilityAtLeastTarget)
        : f.status === "experimental"
          ? "not validated"
          : "insufficient data";
    }),
  ]);
  return table(
    "Chance of reaching each teacher target next year (validated models only)",
    ["Student", ...keys.map((k) => `${k} ≥ ${ws.state.targets[k].toFixed(1)}`)],
    rows,
  );
}

function exitCard(ws) {
  const policy = policyFor({ jurisdiction: "Maryland" });
  const rows = ws.students.map((s) => {
    const last = seriesFor(s, "Overall").at(-1);
    const f = ws.forecast(s, "Overall", policy.threshold);
    return [
      s.name,
      last ? `${fmt1(last.level)} (${last.year})` : "none",
      last ? (meetsCriterion(policy, last.level) ? "At or above" : "Below") : "—",
      f.numbers ? pct(f.numbers.probabilityAtLeastTarget) : f.plain,
      chip(f.status),
    ];
  });
  return h(
    "article",
    { class: "pi-card pi-exit", "aria-labelledby": "piExitTitle" },
    h(
      "h3",
      { id: "piExitTitle" },
      "Recorded state exit criterion",
      tip(
        "Exit criterion",
        "The level a state uses on the official score report to consider a student for exit from English learner services. Your district may add steps.",
      ),
    ),
    h(
      "dl",
      { class: "pi-dl" },
      h("dt", {}, "Jurisdiction"),
      h("dd", {}, `${policy.jurisdiction} — ${policy.assessment}`),
      h("dt", {}, "Criterion"),
      h("dd", {}, `${policy.measure} ${policy.operator} ${policy.threshold}`),
      h("dt", {}, "How it is calculated"),
      h("dd", {}, policy.calculation),
      h("dt", {}, "Source"),
      h(
        "dd",
        {},
        h(
          "a",
          { href: policy.source, rel: "noopener", target: "_blank" },
          "MSDE English Language Proficiency Assessment page",
        ),
      ),
      h("dt", {}, "Verification"),
      h(
        "dd",
        {},
        `Checked ${policy.verifiedOn} (${policy.verifiedBy}). Registry version ${policy.id}.`,
      ),
      h("dt", {}, "Effective from"),
      h("dd", {}, `${policy.effectiveFrom}. ${policy.effectiveFromNote}`),
    ),
    h(
      "details",
      { class: "pi-details" },
      h("summary", {}, "Exceptions and open questions"),
      h(
        "ul",
        {},
        [...policy.exceptions, ...policy.openQuestions].map((x) => h("li", {}, x)),
      ),
    ),
    table(
      "Latest reported overall level against the recorded criterion, and the chance of reaching it next year",
      [
        "Student",
        "Latest reported overall",
        "Against criterion",
        "Chance next year",
        "Forecast status",
      ],
      rows,
    ),
    h(
      "p",
      { class: "fine" },
      "A chance is shown only when a model for the reported overall level passed validation for the year being forecast. Otherwise the reason is given instead.",
    ),
  );
}

export function renderProbability(ws) {
  if (!ws.students.length)
    return h("div", {}, heading(2, "ACCESS Probability Center"), targetsForm(ws), emptyState(ws));
  return h(
    "div",
    {},
    heading(
      2,
      "ACCESS Probability Center",
      tip(
        "Probability",
        "How often a validated model expects a student like this to reach the level, based on held-out testing. 70% means about 7 in 10 similar students.",
      ),
    ),
    h(
      "p",
      { class: "lead" },
      "Chances are computed only by models that passed held-out validation. Teacher targets and the state criterion are kept separate.",
    ),
    targetsForm(ws),
    h("h3", {}, "Target attainment matrix"),
    matrix(ws),
    exitCard(ws),
  );
}
