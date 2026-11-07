// Teacher Hub: language evidence from practice done in THIS browser, shown as a Domain x Key Language Use x Academic
// Context matrix with text alternatives, recommendations that cite their evidence, and a printable learning brief.
// Scope is stated on screen: one device, no roster, no school system. Several students can be combined by importing
// the files they export; nothing is uploaded anywhere.
import { h } from "/access-practice-lab/src/acc/engine/dom.js";
import { bandOptions } from "/access-practice-lab/src/bands.js";
import { buildMatrix, CONTEXTS, DOMAINS, KLUS, learningBrief, MIN_EVIDENCE, recommend, rollup } from "/access-practice-lab/src/acc/analytics/evidence.js";
import { I18nEngine, localeFor, storedMode } from "/access-practice-lab/src/acc/i18n/I18nEngine.js";
import { openStorage } from "/access-practice-lab/src/acc/storage/access-db.js";
import { evidenceChain, mapItem } from "/access-practice-lab/src/acc/wida/framework.js";

const fmtDate = (t) => (t ? new Date(t).toLocaleDateString(localeFor(storedMode()) === "es" ? "es-US" : undefined, { year: "numeric", month: "short", day: "numeric" }) : "none");
const cellText = (c) => (c.state === "no-evidence" ? "No evidence" : c.state === "not-enough" ? `Not enough yet (${c.attempted})` : `${c.independentPct === null ? "Review only" : `${c.independentPct}% on own`} · n=${c.attempted}${c.needsReview ? ` · ${c.needsReview} to review` : ""}`);
const cellClass = (c) => (c.state !== "shown" || c.independentPct === null ? `is-${c.state === "shown" ? "review" : c.state}` : c.independentPct >= 70 ? "is-strong" : c.independentPct >= 50 ? "is-mid" : "is-low");

export async function mountEvidencePanel(root, doc = document) {
  const store = await openStorage();
  const state = { learner: "all", grade: "all", mode: "all", rows: [], aliases: {} };

  async function load() {
    state.rows = await store.progress.list();
    const aliases = {};
    for (const l of new Set(state.rows.map((r) => r.learner))) aliases[l] = await store.settings.get(`alias.${l}`, null);
    state.aliases = aliases;
  }
  const label = (l) => state.aliases[l] || l;
  const filtered = () => state.rows.filter((r) => (state.learner === "all" || r.learner === state.learner) && (state.grade === "all" || r.grade === state.grade) && (state.mode === "all" || r.mode === state.mode));

  function controls() {
    const learners = [...new Set(state.rows.map((r) => r.learner))];
    const select = (id, labelText, options, key) => {
      const sel = h(doc, "select", { id, class: "acc-select" }, ...options.map(([v, t]) => h(doc, "option", { value: v, text: t })));
      sel.value = state[key];
      sel.addEventListener("change", () => ((state[key] = sel.value), draw()));
      return h(doc, "label", { class: "acc-field", for: id }, h(doc, "span", { text: labelText }), sel);
    };
    const bar = h(doc, "div", { class: "acc-filters" }, select("evLearner", "Student", [["all", "All students on this device"], ...learners.map((l) => [l, label(l)])], "learner"), select("evGrade", "Grade band", [["all", "All grade bands"], ...bandOptions()], "grade"), select("evMode", "Mode", [["all", "Both"], ["summative", "Test simulation"], ["formative", "Learning mode"]], "mode"));
    if (state.learner !== "all") {
      const input = h(doc, "input", { type: "text", id: "evAlias", class: "acc-input", maxlength: "24", value: state.aliases[state.learner] || "", placeholder: "Initials or class alias" });
      input.addEventListener("change", async () => {
        await store.settings.set(`alias.${state.learner}`, input.value.trim().slice(0, 24));
        await load();
        draw();
      });
      bar.append(h(doc, "label", { class: "acc-field", for: "evAlias" }, h(doc, "span", { text: "Alias for this student (kept on this device; do not use full names)" }), input));
    }
    return bar;
  }

  function matrixTable(rows) {
    const cells = buildMatrix(rows);
    const head = h(doc, "tr", {}, h(doc, "th", { scope: "col", text: "Domain · Key Language Use" }), ...CONTEXTS.map((c) => h(doc, "th", { scope: "col", text: c })));
    const body = [];
    for (const d of DOMAINS) for (const k of KLUS) body.push(h(doc, "tr", {}, h(doc, "th", { scope: "row", text: `${d} · ${k}` }), ...CONTEXTS.map((c) => { const cell = cells[`${d}|${k}|${c}`]; return h(doc, "td", { class: `acc-heat ${cellClass(cell)}`, "data-state": cell.state }, h(doc, "span", { text: cellText(cell) })); })));
    return { cells, table: h(doc, "table", { class: "acc-table acc-matrix", tabindex: "0" }, h(doc, "caption", { text: "Practice evidence by domain, key language use and academic context. A percentage appears only after at least three items." }), h(doc, "thead", {}, head), h(doc, "tbody", {}, ...body)) };
  }

  function summaryText(cells) {
    const dom = rollup(cells, "domain");
    return DOMAINS.map((d) => { const s = dom[d]; return !s?.attempted ? `${d}: no evidence` : s.independentPct === null ? `${d}: ${s.attempted} responses, ${s.needsReview} awaiting teacher review` : `${d}: ${s.independentPct}% right on the first try without support (${s.objective} items), supports used on ${s.scaffoldPct ?? "?"}% of responses`; }).join(". ") + ".";
  }

  function draw() {
    const rows = filtered();
    const { cells, table } = matrixTable(rows);
    const recs = recommend(cells, rows);
    const brief = learningBrief(rows, { learnerLabel: state.learner === "all" ? "All students (combined)" : label(state.learner) });
    const sittings = new Set(rows.map((r) => r.sessionId)).size;
    const alignHost = h(doc, "div", { class: "acc-align-host" });
    root.replaceChildren(
      h(doc, "div", { class: "acc-state is-info", role: "note" }, h(doc, "p", { text: "This view shows practice done in this browser only. It is not a class roster and is not connected to a school system. To combine students, each student exports their practice data and you import the files here." }), h(doc, "p", { "data-early-note": "", text: "Kindergarten to grade 3 practice is audio-first lab activities, not assessment-engine sets, so it appears in the share-code student dashboard and in Passport check-ins instead." })),
      h(doc, "div", { class: "acc-actions no-print" }, importControl(), h(doc, "button", { type: "button", class: "acc-btn", "data-act": "print-brief", disabled: !rows.length, text: "Print learning brief" })),
      controls(),
      rows.length ? h(doc, "p", { class: "acc-hint", text: `${rows.length} item responses from ${sittings} ${sittings === 1 ? "sitting" : "sittings"}. Fewer than ${MIN_EVIDENCE} items in a cell is shown as “not enough yet”, never as a percentage.` }) : h(doc, "div", { class: "acc-state is-empty" }, h(doc, "p", { text: "No practice evidence on this device yet. Students practice in the Assessment simulator; their results appear here after they submit a sitting." }), h(doc, "p", { text: "Evidence that was practiced on another device appears here after you import that student’s exported file." })),
      h(doc, "p", { class: "acc-visually-hidden", text: summaryText(cells) }),
      table,
      h(doc, "h3", { text: "Next teaching moves" }),
      recs.length ? h(doc, "ul", { class: "acc-recs" }, ...recs.map((r) => h(doc, "li", { "data-type": r.type }, h(doc, "strong", { text: r.type.replace(/-/g, " ") + ": " }), r.text))) : h(doc, "p", { class: "acc-hint", text: "Recommendations appear when there is enough evidence to support them." }),
      alignHost,
      briefSheet(brief),
    );
    alignmentSection(rows).then((d) => alignHost.replaceChildren(d));
    root.querySelector("[data-act=print-brief]").addEventListener("click", () => {
      doc.body.classList.add("acc-printing-brief");
      doc.defaultView.print();
      setTimeout(() => doc.body.classList.remove("acc-printing-brief"), 500);
    });
  }

  /** Task -> evidence chain for each practiced item, so a teacher can inspect exactly how a task maps to the WIDA framework. */
  async function alignmentSection(rows) {
    const setIds = [...new Set(rows.map((r) => r.setId))];
    const items = {};
    for (const id of setIds) {
      try {
        const set = await (await fetch(`/access-practice-lab/content/assess/${encodeURIComponent(id)}.json`)).json();
        for (const it of set.items) items[it.id] = it;
      } catch {}
    }
    const latest = new Map();
    for (const r of [...rows].sort((a, b) => a.t - b.t)) latest.set(`${r.itemId}`, r);
    const list = [...latest.values()];
    const details = h(doc, "details", { class: "acc-align" }, h(doc, "summary", { text: "How these tasks map to the WIDA framework" }));
    details.append(h(doc, "p", { class: "acc-hint", text: "Each task is shown with the framework entries it is practice for. “Explicit” means the framework represents that combination of standard and Key Language Use; “supplementary” means it is useful practice the framework does not list for that combination. Item-level Language Expectation wording is not reproduced here. Source: wida.wisc.edu/teach/standards/eld" }));
    if (!list.length) return details.append(h(doc, "p", { text: "No tasks yet." })), details;
    const body = list.map((r) => {
      const m = mapItem(r, r.grade);
      const chain = evidenceChain(r, items[r.itemId] || {});
      return h(doc, "tr", {}, h(doc, "th", { scope: "row", "data-i18n-skip": "", text: items[r.itemId]?.stem || r.itemId }), h(doc, "td", { text: `${r.domain} · ${r.klu}` }), h(doc, "td", { text: r.context || "" }), h(doc, "td", { text: m.explicit ? "Explicit" : "Supplementary" }), h(doc, "td", { "data-i18n-skip": "", text: m.ids.join(", ") || "none" }), h(doc, "td", { text: chain[5][1] }));
    });
    details.append(h(doc, "table", { class: "acc-table" }, h(doc, "caption", { class: "acc-visually-hidden", text: "Task alignment to the WIDA framework" }), h(doc, "thead", {}, h(doc, "tr", {}, ...["Task", "Domain · Key Language Use", "Context", "Framework combination", "Expectation family", "Observed evidence"].map((c) => h(doc, "th", { scope: "col", text: c })))), h(doc, "tbody", {}, ...body)));
    return details;
  }

  function importControl() {
    const input = h(doc, "input", { type: "file", accept: "application/json,.json", multiple: true, id: "evImport", class: "acc-visually-hidden", "aria-label": "Import exported practice files" });
    const msg = h(doc, "span", { class: "acc-hint", role: "status", "aria-live": "polite" });
    input.addEventListener("change", async () => {
      let added = 0;
      let kept = 0;
      for (const f of input.files) {
        try {
          const r = await store.importAll(JSON.parse(await f.text()));
          added += r.added;
          kept += r.conflicts;
        } catch {
          msg.textContent = `${f.name} could not be read.`;
        }
      }
      await load();
      draw();
      root.querySelector(".acc-actions")?.append(h(doc, "span", { class: "acc-hint", role: "status", text: `Imported ${added} items${kept ? `; ${kept} were already here and were kept as they are` : ""}.` }));
    });
    return h(doc, "span", {}, h(doc, "label", { for: "evImport", class: "acc-btn", text: "Import student files" }), input, msg);
  }

  function briefSheet(b) {
    const li = (t) => h(doc, "li", { text: t });
    const dom = (d) => `${d.domain}: ${d.independentPct}% right on the first try without support (${d.objective} items)`;
    return h(doc, "section", { class: "acc-brief", "aria-label": "Student learning brief (print)" },
      h(doc, "h2", { text: `Language practice summary: ${b.learnerLabel}` }),
      h(doc, "p", { class: "acc-hint", text: `Evidence dates: ${fmtDate(b.firstEvidence)} to ${fmtDate(b.lastEvidence)} · ${b.sittings} ${b.sittings === 1 ? "sitting" : "sittings"} · printed ${fmtDate(b.generatedAt)}` }),
      h(doc, "p", { class: "acc-brief-flag", text: "Practice evidence from the ACCESS Practice Lab. This is not a WIDA or ACCESS score report, not a proficiency level, and not an IEP or 504 document." }),
      h(doc, "h3", { text: "Strengths" }), b.strengths.length ? h(doc, "ul", {}, ...b.strengths.map((s) => li(dom(s)))) : h(doc, "p", { text: "No domain has enough evidence to name a strength yet." }),
      h(doc, "h3", { text: "Priorities" }), b.priorities.length ? h(doc, "ul", {}, ...b.priorities.map((s) => li(dom(s)))) : h(doc, "p", { text: "No domain shows a clear priority yet." }),
      h(doc, "h3", { text: "Suggested next activities" }), b.recommendations.length ? h(doc, "ul", {}, ...b.recommendations.map((r) => li(r.text))) : h(doc, "p", { text: "Assign more practice to build enough evidence." }),
      h(doc, "h3", { text: "Growth" }), h(doc, "p", { text: b.trend.enough ? `Independent accuracy across ${b.trend.points.length} sittings: ${b.trend.points.map((p) => `${p.pct}%`).join(" → ")} (${b.trend.direction}).` : "Not enough sittings to describe growth (at least three are needed)." }),
      h(doc, "h3", { text: "Limits of this evidence" }), h(doc, "ul", {}, ...b.limitations.map(li)),
    );
  }

  await load();
  draw();
  new I18nEngine({ root: root.closest("section") || root }).start();
  return { refresh: async () => (await load(), draw()) };
}
