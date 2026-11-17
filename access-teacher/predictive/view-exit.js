// Exit criterion: where each student's latest REPORTED Overall stands against the state criterion recorded in
// src/predict/policy.js (only Maryland is recorded). It is a comparison with a published rule, never a forecast
// and never a decision; districts add their own steps, and the 2026 cut scores may change the criterion.
import { meetsCriterion, POLICIES } from "../../access-practice-lab/src/predict/policy.js";
import { h, table } from "./dom.js";
import { recordsOf } from "./records.js";
import { explain } from "./view-common.js";

export function exitPanel(ws) {
  const policy = POLICIES[0];
  const rows = ws.students
    .map((st) => {
      const rec = recordsOf(st)
        .filter((r) => r.assessmentType === "ACCESS")
        .at(-1);
      const lv = rec?.composites.Overall.level ?? null;
      return { st, rec, lv };
    })
    .filter((r) => r.lv != null)
    .sort((a, b) => b.lv - a.lv);
  const meets = rows.filter((r) => meetsCriterion(policy, r.lv)).length;
  const close = rows.filter((r) => !meetsCriterion(policy, r.lv) && policy.threshold - r.lv <= 0.5).length;
  return h(
    "section",
    { class: "pi-card", "aria-labelledby": "piExitT", "data-exit": "" },
    h("h3", { id: "piExitT" }, `${policy.jurisdiction} exit criterion: Overall ${policy.threshold.toFixed(1)} or higher`),
    h("p", {}, `${meets} student${meets === 1 ? "" : "s"} at or above, ${close} within half a level.`),
    rows.length
      ? h(
          "details",
          { class: "pi-more" },
          h("summary", {}, "See every student"),
          table(
            "Latest reported Overall against the criterion",
            ["Student", "Overall", "Result", "From"],
            rows.map(({ st, rec, lv }) => [
              st.name,
              lv.toFixed(1),
              meetsCriterion(policy, lv) ? "At or above" : `${(policy.threshold - lv).toFixed(1)} below`,
              `${rec.academicYear}${rec.levelVersion === "2026-cuts" ? " (2026 cut scores)" : ""}`,
            ]),
          ),
        )
      : h("p", { class: "fine" }, "No reported ACCESS Overall levels yet."),
    explain({
      summary: "This compares each latest reported Overall with the state’s published criterion. It is not a prediction and not an exit decision; your district’s process decides.",
      uncertain: policy.openQuestions[0],
      how: h("p", {}, `${policy.calculation} Source: `, h("a", { href: policy.source, rel: "noopener", target: "_blank" }, "MSDE"), `. Checked ${policy.verifiedOn}.`),
    }),
  );
}
