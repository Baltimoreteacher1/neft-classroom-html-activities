// Teacher Hub: learning insights from practice on THIS device. Per-skill mastery (independent first-try success on different items
// across different days), a suggested next step with its evidence, language-function strengths, completion and revision patterns,
// common misconception tags, and what is missing. Everything is a suggestion a teacher can override. Thresholds are the teacher's.
import { h } from "/access-practice-lab/src/acc/engine/dom.js";
import { I18nEngine } from "/access-practice-lab/src/acc/i18n/I18nEngine.js";
import { DEFAULT_THRESHOLDS, nextStep, normalizeThresholds, skillStatus, THRESHOLD_KEY } from "/access-practice-lab/src/acc/adapt/mastery.js";
import { completionPatterns, DOMAINS, functionStrengths, MIN_EVIDENCE, misconceptionCounts, revisionPatterns } from "/access-practice-lab/src/acc/analytics/evidence.js";
import { openStorage } from "/access-practice-lab/src/acc/storage/access-db.js";

const STATUS_TEXT = { secure: "Secure", building: "Building", "needs-support": "Needs support", "not-started": "Not started" };
const FADE_TEXT = { fade: "Supports can fade", "try-independent": "Offer one task on their own", "return-supports": "Keep supports available", keep: "Keep current support" };

export async function mountInsightsPanel(root, doc = document) {
  const store = await openStorage();
  const state = { learner: "all", th: normalizeThresholds(await store.settings.get(THRESHOLD_KEY, DEFAULT_THRESHOLDS)), rows: [], bank: [] };
  try {
    const index = await (await fetch("/access-practice-lab/content/bank/index.json")).json();
    state.bank = index.sets.flatMap((s) => s.items.map((i) => ({ ...i, setId: s.id, grade: s.grade, domain: s.domain })));
  } catch {}

  const thresholdForm = () => {
    const f = h(doc, "form", { class: "acc-filters", "aria-label": "Mastery thresholds" });
    const num = (key, label, min, max) => {
      const input = h(doc, "input", { type: "number", id: `th-${key}`, class: "acc-input", min: String(min), max: String(max), value: String(state.th[key]) });
      input.addEventListener("change", async () => {
        state.th = normalizeThresholds({ ...state.th, [key]: input.value });
        await store.settings.set(THRESHOLD_KEY, state.th);
        draw();
      });
      return h(doc, "label", { class: "acc-field", for: `th-${key}` }, h(doc, "span", { text: label }), input);
    };
    f.append(num("minItems", "Different items needed", 2, 10), num("minDays", "Different days needed", 1, 7), num("strongPct", "Independent right needed (%)", 50, 100), num("lowPct", "Below this means needs support (%)", 10, 90));
    return f;
  };

  function draw() {
    const rows = state.rows.filter((r) => state.learner === "all" || r.learner === state.learner);
    const learners = [...new Set(state.rows.map((r) => r.learner))];
    const sel = h(doc, "select", { id: "inLearner", class: "acc-select" }, h(doc, "option", { value: "all", text: "All students on this device" }), ...learners.map((l) => h(doc, "option", { value: l, text: l })));
    sel.value = state.learner;
    sel.addEventListener("change", () => ((state.learner = sel.value), draw()));
    if (!rows.length) {
      root.replaceChildren(h(doc, "div", { class: "acc-state is-empty" }, h(doc, "p", { text: "No practice evidence on this device yet, so there is nothing to suggest." })));
      return;
    }
    const by = new Map();
    for (const r of rows) (by.get(`${r.domain}|${r.klu}|${r.context || "Social and Instructional"}`) || by.set(`${r.domain}|${r.klu}|${r.context || "Social and Instructional"}`, []).get(`${r.domain}|${r.klu}|${r.context || "Social and Instructional"}`)).push(r);
    const skills = [...by.entries()].map(([k, rs]) => ({ k, ...skillStatus(rs, state.th) })).sort((a, b) => a.k.localeCompare(b.k));
    const step = nextStep(rows, state.bank, state.th);
    const funcs = functionStrengths(rows).filter((f) => f.enough);
    const comp = completionPatterns(rows);
    const rev = revisionPatterns(rows);
    const miscs = misconceptionCounts(rows).slice(0, 5);
    const missing = DOMAINS.filter((d) => !rows.some((r) => r.domain === d));
    const nextUi = h(doc, "div", { class: "acc-nextstep", "data-kind": step.kind },
      h(doc, "h3", { text: "Suggested next step" }),
      h(doc, "p", { text: step.kind === "explore" ? step.reason : `${step.kind === "reteach" ? "Re-teach, then practice" : "Practice"}: ${step.reason}` }),
      step.fade ? h(doc, "p", { class: "acc-hint", text: `${FADE_TEXT[step.fade.advice]}. ${step.fade.reason}` }) : null,
      step.items.length ? h(doc, "a", { class: "acc-btn primary", "data-act": "practice-next", href: `/access-practice-lab/assess/custom?mode=formative&title=${encodeURIComponent("Next step practice")}&ids=${step.items.map((i) => `${i.setId}:${i.itemId}`).join(",")}`, text: `Open ${step.items.length} suggested ${step.items.length === 1 ? "question" : "questions"} in Learning mode` }) : null,
      h(doc, "p", { class: "acc-hint", text: "A suggestion from practice evidence on this device. Use your own judgment." }));
    root.replaceChildren(
      h(doc, "div", { class: "acc-filters" }, h(doc, "label", { class: "acc-field", for: "inLearner" }, h(doc, "span", { text: "Student" }), sel)),
      nextUi,
      h(doc, "h3", { text: "Skill progress" }),
      h(doc, "table", { class: "acc-table", id: "inSkills" }, h(doc, "caption", { text: "A skill is secure after independent first-try success on different items on different days. Supported success does not count." }),
        h(doc, "thead", {}, h(doc, "tr", {}, ...["Skill (domain · key language use · context)", "Status", "Independent items", "Days"].map((t) => h(doc, "th", { scope: "col", text: t })))),
        h(doc, "tbody", {}, ...skills.map((s) => h(doc, "tr", { "data-status": s.status }, h(doc, "th", { scope: "row", text: s.k.replaceAll("|", " · ") }), h(doc, "td", { text: STATUS_TEXT[s.status] }), h(doc, "td", { text: String(s.items) }), h(doc, "td", { text: String(s.days) }))))),
      h(doc, "details", {}, h(doc, "summary", { text: "Mastery thresholds (yours to change)" }), thresholdForm()),
      h(doc, "h3", { text: "Language functions" }),
      funcs.length ? h(doc, "ul", { class: "acc-recs", id: "inFuncs" }, ...funcs.map((f) => h(doc, "li", {}, h(doc, "strong", { text: `${f.fn}: ` }), `${f.independentPct}% right on the first try without support (${f.objective} items)`))) : h(doc, "p", { class: "acc-hint", text: `A language function is reported after at least ${MIN_EVIDENCE} objective items.` }),
      h(doc, "h3", { text: "Patterns" }),
      h(doc, "ul", { class: "acc-recs", id: "inPatterns" },
        h(doc, "li", { text: rev.enough ? `Revision in Learning mode: ${rev.revised} items revised, ${rev.recovered} ended correct (${rev.recoveredPct}%).` : "Not enough revisions in Learning mode yet to describe a pattern." }),
        ...Object.entries(comp).filter(([, d]) => d.unansweredPct !== null && d.unanswered).map(([dom, d]) => h(doc, "li", { text: `${dom}: ${d.unanswered} of ${d.total} responses left unanswered. This may reflect time or effort rather than skill.` }))),
      h(doc, "h3", { text: "Common first-choice misunderstandings" }),
      miscs.length ? h(doc, "ul", { class: "acc-recs", id: "inMiscs", "data-i18n-skip": "" }, ...miscs.map((m) => h(doc, "li", { text: `${m.tag} (${m.n})` }))) : h(doc, "p", { class: "acc-hint", text: "No tagged wrong first choices yet." }),
      h(doc, "h3", { text: "Missing data" }),
      h(doc, "p", { id: "inMissing", text: missing.length ? `No evidence yet in: ${missing.join(", ")}.` : "Every domain has some evidence." }),
      h(doc, "p", { class: "acc-hint", text: "Practice evidence from this device only. Not a WIDA or ACCESS score and not a proficiency level." }));
  }

  state.rows = await store.progress.list();
  draw();
  new I18nEngine({ root: root.closest("section") || root }).start();
}
