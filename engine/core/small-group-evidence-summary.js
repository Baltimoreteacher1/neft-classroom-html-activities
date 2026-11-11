// End-of-lesson evidence: what the student did INDEPENDENTLY, what took support, which
// mix-ups appeared, and what to practise next. It reads the per-card records the
// practice and investigation cards write (`<key>-done`, `-sup`, `-dx`) through the
// pure summarizeEvidence(); it never reads what the student typed.
//
// Independent and supported success are reported separately on purpose: a score earned
// with hints is not mastery, and the next-step decision rests on independent work only.

import { DX_LABEL, summarizeEvidence } from "./small-group-feedback.js";
import { nextStep } from "./small-group-pathway.js";
import { el, esc, esLane } from "./small-group-ui.js";

export const EVIDENCE_EVENT = "sg:evidence";

const INVESTIGATE_DX = {
  verdict: [
    "Judged the claim differently from the evidence",
    "Juzgó la afirmación distinto a la evidencia",
  ],
  misread: ["Passed over the step with the mistake", "Pasó por alto el paso con el error"],
};

/** Graded card keys present in a studio config. */
export function evidenceKeys(config) {
  const p = config.launch?.practice || {};
  const range = (prefix, list) => (list || []).map((_, i) => `${prefix}-${i}`);
  return [
    ...range("po", p.onMyOwn),
    ...range("pc", p.check),
    ...(p.investigate ? ["ci-0", "ci-1", "ci-2"] : []),
  ];
}

/** Pure view-model, shared by the page and the teacher console. */
export function evidenceModel(read, keys) {
  const s = summarizeEvidence(read, keys);
  const answered = s.total - s.open;
  return {
    ...s,
    answered,
    next: nextStep({ independent: s.independent, total: answered }),
    mixups: Object.entries(s.tags)
      .sort((a, b) => b[1] - a[1])
      .map(([code, n]) => ({
        code,
        n,
        label: (DX_LABEL[code] || INVESTIGATE_DX[code] || [code, code])[esLane() ? 1 : 0],
      })),
  };
}

/** @returns {HTMLElement} a live card that re-renders on every `sg:evidence` event */
export function createEvidenceSummary(config, store) {
  const keys = evidenceKeys(config);
  const root = el("section", "sge");
  root.setAttribute("aria-label", "What you showed today");
  const draw = () => {
    const m = evidenceModel((k) => store?.get(k), keys);
    const bar = (n, cls) =>
      n ? `<span class="sge-seg sge-${cls}" style="flex:${n}" title="${n}"></span>` : "";
    root.innerHTML =
      `<h3 class="sgb-title">What you showed today</h3>` +
      `<div class="sge-bar" role="img" aria-label="${m.independent} on your own, ${m.coached} with help, ${m.shown} with the steps shown, ${m.open} not tried">` +
      `${bar(m.independent, "ind")}${bar(m.coached, "coach")}${bar(m.shown, "shown")}${bar(m.open, "open")}</div>` +
      `<ul class="sge-key">` +
      `<li><b>${m.independent}</b> on your own</li>` +
      `<li><b>${m.coached}</b> with a hint or a second try</li>` +
      `<li><b>${m.shown}</b> after seeing the steps</li>` +
      (m.open ? `<li><b>${m.open}</b> not tried yet</li>` : "") +
      `</ul>` +
      (m.mixups.length
        ? `<p class="sge-sub">Mix-ups to fix</p><ul class="sge-mix">${m.mixups
            .map((x) => `<li>${esc(x.label)}${x.n > 1 ? ` (${x.n})` : ""}</li>`)
            .join("")}</ul>`
        : "") +
      (m.next.student
        ? `<p class="sge-next"><b>${esLane() ? "Practica después" : "Practice next"}:</b> ${esc(esLane() && m.next.studentEs ? m.next.studentEs : m.next.student)}</p>`
        : "");
  };
  document.addEventListener(EVIDENCE_EVENT, draw);
  draw();
  return root;
}

export const EVIDENCE_CSS = `
.sge{margin:16px 0;padding:16px;border:2px solid var(--sg-line);border-radius:var(--sg-radius);background:#fff}
.sge-bar{display:flex;gap:3px;height:16px;margin:8px 0 12px;border-radius:999px;overflow:hidden;background:var(--sg-soft)}
.sge-seg{display:block;min-width:8px}
.sge-ind{background:var(--sg-good)}
.sge-coach{background:var(--sg-accent,#e5a63f)}
.sge-shown{background:#dd8560}
.sge-open{background:var(--sg-line)}
.sge-key,.sge-mix{margin:0 0 10px;padding-left:20px;display:grid;gap:3px}
.sge-sub{margin:8px 0 4px;font-weight:700}
.sge-next{margin:10px 0 0;padding:10px 14px;border-radius:var(--sg-radius-sm);background:var(--sg-soft)}
`;
