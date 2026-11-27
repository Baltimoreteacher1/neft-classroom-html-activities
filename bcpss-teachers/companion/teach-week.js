// Plan & Respond — teacher planning and response views.
//   This week: the unit's authored five-day language plan, with each section linked to the view or tab that runs it.
//   Exit ticket tally: count responses (no names) into three groups and get a suggested next step. Nothing is saved.

import { doc, FOOT, openPrint, unitLine } from "./companion-print.js";
import { esc, vstate } from "./util.js";

// Section keys in esol_pack.week_plan -> what a teacher calls it, and where it lives.
const SECTIONS = {
  cognates: ["Cognates", { view: "words" }],
  doubleduty: ["Words with two meanings", { view: "words" }],
  retrieval: ["Spiral review", { view: "quick" }],
  dictogloss: ["Dictogloss", { view: "practice" }],
  infogap: ["Information gap", { tab: "studio" }],
  doctor: ["Fix the error", { tab: "studio" }],
  ladder: ["Sentence ladder", { view: "labs" }],
  talkline: ["Four corners", { view: "corners" }],
  routines: ["Language routine", { view: "routine" }],
  passport: ["Language passport", { tab: "studio" }],
  glossary: ["Home-language glossary", { tab: "vocab" }],
  family: ["Family mission", { tab: "family" }],
};
export const sectionInfo = (key) => {
  const [label, to] = SECTIONS[key] || [key, null];
  return { key, label, to };
};

export function weekPlan(detail) {
  return (detail.esol_pack?.week_plan || []).map((d) => ({
    ...d,
    sections: (d.sections || []).map(sectionInfo),
  }));
}

export const week = {
  id: "week",
  render(_st, detail) {
    const days = weekPlan(detail);
    if (!days.length) return `<p class="cp-note">This unit has no week plan yet.</p>`;
    const total = days.reduce((n, d) => n + (d.minutes || 0), 0);
    return `<div class="cp-week">
      <p class="cp-muted">A short language block for each day of the week, about ${total} minutes in all. It sits beside your content lesson.</p>
      <div class="cp-week-grid">${days
        .map(
          (
            d,
          ) => `<div class="cp-card"><p class="cp-eyebrow">Day ${d.day} · ${d.minutes} min</p><h4>${esc(d.title)}</h4><p>${esc(d.focus)}</p>
          <div class="cp-actions">${d.sections
            .map((s) =>
              s.to?.view
                ? `<button type="button" class="cp-btn" data-cp-view="${s.to.view}">${esc(s.label)}</button>`
                : s.to?.tab
                  ? `<button type="button" class="cp-btn" data-cp-tab="${s.to.tab}">${esc(s.label)}</button>`
                  : `<span class="cp-muted">${esc(s.label)}</span>`,
            )
            .join("")}</div></div>`,
        )
        .join("")}</div>
      <button type="button" class="cp-btn cp-btn--solid" data-cp-act="week:print">Print the week</button>
    </div>`;
  },
  act(_st, action, _arg, ctx) {
    if (action === "print") openPrint(weekDoc(ctx.detail), `week-${ctx.detail.unit.id}.html`);
    return false;
  },
};

export function weekDoc(detail) {
  const days = weekPlan(detail)
    .map(
      (d) =>
        `<div class="step"><h3><span>Day ${d.day}: ${esc(d.title)}</span><small>${d.minutes} min</small></h3><p>${esc(d.focus)}</p><p class="small">${d.sections.map((s) => esc(s.label)).join(" · ")}</p></div>`,
    )
    .join("");
  return doc(
    `Week plan - ${detail.unit.unit_title}`,
    `<div class="head"><div><h1>This week's language plan</h1><div class="meta">${unitLine(detail.unit)}</div></div><div class="name">Teacher copy</div></div><p class="q">${esc(detail.studio.essential_question)}</p>${days}`,
    FOOT,
  );
}

// ── Exit ticket tally ───────────────────────────────────────────────────────

const GROUPS = [
  ["got", "Got it", "proficient"],
  ["partly", "Partly", "developing"],
  ["notyet", "Not yet", "emerging"],
];

/** The suggested next step from counts alone. Pure. Never a judgement about a student. */
export function tallyAdvice({ got = 0, partly = 0, notyet = 0 }) {
  const total = got + partly + notyet;
  if (!total)
    return {
      total,
      text: "Tap + as you sort the tickets. Only the counts are kept, and only on this screen.",
      go: null,
    };
  const share = (n) => n / total;
  if (share(notyet) >= 0.3)
    return {
      total,
      text: `${notyet} of ${total} are not there yet. Plan a short small-group reteach. If the idea is the problem, use the content pathway.`,
      go: { view: "reteach", label: "Open the reteach plan" },
    };
  if (share(partly) >= 0.3)
    return {
      total,
      text: `${partly} of ${total} are partly there. The words may be getting in the way. Try the language pathway or fade back to full frames.`,
      go: { view: "build", label: "Open the support sheet" },
    };
  return {
    total,
    text: `Most of the class has it (${got} of ${total}). Move on, and use the spiral warm-up to keep it fresh.`,
    go: { view: "quick", label: "Open the spiral warm-up" },
  };
}

export const tally = {
  id: "tally",
  render(st, detail) {
    const vs = vstate(st, "tally", { got: 0, partly: 0, notyet: 0 });
    const rubric = detail.studio.exit_ticket?.rubric || {};
    const advice = tallyAdvice(vs);
    const bar = advice.total
      ? `<div class="cp-tallybar" role="img" aria-label="${GROUPS.map(([k, l]) => `${l} ${vs[k]}`).join(", ")}">${GROUPS.map(([k, l]) => (vs[k] ? `<span class="cp-tb-${k}" style="flex:${vs[k]}">${esc(l)} ${vs[k]}</span>` : "")).join("")}</div>`
      : "";
    return `<div class="cp-tally">
      <p class="cp-prompt"><b>Exit ticket:</b> ${esc(detail.studio.exit_ticket?.prompt || "")}</p>
      <div class="cp-week-grid">${GROUPS.map(
        ([
          k,
          label,
          rk,
        ]) => `<div class="cp-card"><h4>${label}</h4>${rubric[rk] ? `<p class="cp-muted">Looks like: ${esc(rubric[rk])}</p>` : ""}
          <div class="cp-stepper"><button type="button" class="cp-btn" data-cp-act="tally:dec" data-cp-arg="${k}" aria-label="One fewer: ${label}">−</button><output aria-live="polite">${vs[k]}</output><button type="button" class="cp-btn" data-cp-act="tally:inc" data-cp-arg="${k}" aria-label="One more: ${label}">+</button></div></div>`,
      ).join("")}</div>
      ${bar}
      <p class="cp-note" role="status">${esc(advice.text)}</p>
      <div class="cp-actions">${advice.go ? `<button type="button" class="cp-btn cp-btn--solid" data-cp-view="${advice.go.view}">${esc(advice.go.label)}</button>` : ""}<button type="button" class="cp-btn" data-cp-act="tally:reset">Start over</button></div>
    </div>`;
  },
  act(st, action, arg) {
    const vs = vstate(st, "tally", { got: 0, partly: 0, notyet: 0 });
    if (action === "inc") vs[arg] = Math.min(60, vs[arg] + 1);
    else if (action === "dec") vs[arg] = Math.max(0, vs[arg] - 1);
    else if (action === "reset") Object.assign(vs, { got: 0, partly: 0, notyet: 0 });
    else return false;
    return true;
  },
};
