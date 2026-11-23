// Find my lesson: Grade -> Subject -> Curriculum/Unit -> Lesson, plus search with filters over the whole manifest.
import { h } from "../core/dom.js";
import { facetCounts } from "../core/search.js";
import { emptyState, gradeLabel } from "../core/ui.js";
import { DOMAINS, ENGINE_IDS, GRADES, KLUS, SUBJECTS, SUBJECT_IDS, SUBJECT_PROFILE, hasSeedUnits } from "../data/taxonomy.js";
import { KIND_ORDER, PAGE, PATHWAY_LABEL, filtersOf, materialsBlock, noResults, refineGroups, unitsBlock } from "./find-results.js";

const pick = (v, allowed) => (allowed.includes(v) ? v : "");

function readState(params, prefs, shell) {
  if (params.change === "1") shell.prefs.clearContext();
  const p = params.change === "1" ? { grade: null, subject: null } : prefs;
  return {
    q: String(params.q || "").slice(0, 120),
    grade: pick(String(params.grade ?? p.grade ?? "").toUpperCase(), GRADES),
    subject: pick(params.subject ?? p.subject ?? "", SUBJECT_IDS),
    kind: pick(params.kind || "", KIND_ORDER),
    klu: pick(params.klu || "", KLUS),
    domain: pick(params.domain || "", DOMAINS),
    engine: pick(params.engine || "", ENGINE_IDS),
    shown: PAGE,
  };
}

export async function render({ root, params, shell }) {
  const st = readState(params, shell.prefs.getPrefs(), shell);
  let items = [];
  let loadError = null;
  let drawId = 0;
  try {
    items = await shell.catalog.manifest();
  } catch (e) {
    loadError = e;
  }

  const input = h("input", { id: "st-find-q", type: "search", name: "q", value: st.q, placeholder: "Title, standard code, vocabulary word, language objective", autocomplete: "off", enterkeyhint: "search" });
  const form = h("form", { class: "st-searchbar", role: "search", "aria-label": "Search the studio" }, h("label", { class: "st-sr-only", for: "st-find-q" }, "Search lessons, standards, words or language objectives"), input, h("button", { class: "st-btn st-btn-primary", type: "submit" }, "Search"));
  const steps = h("div", {});
  const out = h("div", {});
  const status = h("p", { class: "st-count", role: "status" });
  root.append(h("h1", {}, "Find my lesson"), h("p", { class: "st-lede" }, "Choose a grade and subject to see units and lessons, or search everything. Nothing is chosen for you."), form, steps, status, out);

  let timer;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    set({ q: input.value.trim() });
  });
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => set({ q: input.value.trim() }, { keepFocus: true }), 200);
  });

  function set(patch, { keepFocus = false } = {}) {
    Object.assign(st, { shown: PAGE }, patch);
    if ("grade" in patch || "subject" in patch) shell.prefs.setPrefs({ grade: st.grade || null, subject: st.subject || null });
    shell.replaceHash(buildHash());
    drawSteps();
    drawResults();
    if (!keepFocus && "q" in patch) input.focus();
  }
  const buildHash = () => {
    const q = new URLSearchParams();
    for (const k of ["q", "grade", "subject", "kind", "klu", "domain", "engine"]) if (st[k]) q.set(k, st[k]);
    return `#/find${q.toString() ? `?${q}` : ""}`;
  };

  function pills(values, current, label, onPick) {
    return h(
      "ul",
      { class: "st-pills", "aria-label": label },
      values.map(({ id, text, subject }) => {
        const b = h("button", { class: "st-pick", type: "button", "data-subject": subject, "aria-pressed": String(current === id) }, text);
        b.addEventListener("click", () => onPick(current === id ? "" : id));
        return h("li", {}, b);
      }),
    );
  }

  function subjectChoices() {
    const counts = items.length ? facetCounts(items, "", { grade: st.grade }).subject : {};
    return SUBJECTS.filter((s) => {
      if (s.id === st.subject) return true;
      const seed = st.grade ? hasSeedUnits(st.grade, s.id) : hasSeedUnits("K", s.id);
      return seed || counts[s.id] > 0;
    });
  }

  function drawSteps() {
    steps.replaceChildren(
      h("section", { class: "st-step", "data-state": st.grade ? "done" : "", "aria-labelledby": "st-s1" }, h("h2", { id: "st-s1" }, h("span", { class: "st-step-num", "aria-hidden": "true" }, "1"), "Grade"), pills(GRADES.map((g) => ({ id: g, text: gradeLabel(g) })), st.grade, "Grade", (g) => set({ grade: g }))),
    );
    if (!st.grade && !st.subject) return;
    const prof = SUBJECT_PROFILE[st.subject];
    steps.append(
      h(
        "section",
        { class: "st-step", "data-state": st.subject ? "done" : "", "aria-labelledby": "st-s2" },
        h("h2", { id: "st-s2" }, h("span", { class: "st-step-num", "aria-hidden": "true" }, "2"), "Subject"),
        pills(subjectChoices().map((s) => ({ id: s.id, text: s.label, subject: s.id })), st.subject, "Subject", (s) => set({ subject: s })),
        prof ? h("p", { class: "st-hint" }, `Typical language work in ${prof.short}: ${prof.discourse.slice(0, 3).join(", ")}.`) : null,
      ),
    );
  }

  function drawResults() {
    const my = ++drawId;
    const current = () => my === drawId;
    out.replaceChildren();
    status.textContent = "";
    const intent = st.q || st.grade || st.subject || st.kind;
    if (!intent) {
      out.append(emptyState({ title: "Pick a grade, or search to begin", body: "Try a title, a standard code such as 6.RP.A.3, or a vocabulary word such as ratio." }));
      return;
    }
    if (loadError) {
      const retry = h("button", { class: "st-btn", type: "button" }, "Try again");
      retry.addEventListener("click", async () => {
        try {
          items = await shell.catalog.manifest();
          loadError = null;
          drawSteps();
          drawResults();
        } catch (e) {
          loadError = e;
        }
      });
      out.append(h("div", { class: "st-notice", role: "alert" }, "The studio library did not load. District units may still appear. ", retry));
    }
    const seedCombo = st.grade && st.subject && hasSeedUnits(st.grade, st.subject);
    if (seedCombo) out.append(unitsBlock(st, shell, current));
    const refine = refineGroups(items, st, (k, v) => set({ [k]: v }));
    const { node, count } = materialsBlock(items, st, shell, () => {
      st.shown += PAGE;
      drawResults();
    });
    const where = [st.grade && gradeLabel(st.grade), st.subject && SUBJECT_PROFILE[st.subject].label].filter(Boolean).join(" ");
    const headline = st.grade && st.subject && !seedCombo ? PATHWAY_LABEL : st.q ? "Search results" : where ? `Studio lessons and materials: ${where}` : "Studio materials";
    if (!loadError) {
      out.append(h("section", { class: "st-step", "aria-labelledby": "st-mat" }, h("h2", { id: "st-mat" }, headline), refine, count ? node : noResults(items, st, { clearRefine: () => set({ q: "", kind: "", klu: "", domain: "", engine: "" }), setSubject: (s) => set({ subject: s }) })));
    }
    status.textContent = loadError ? "" : `${count} studio ${count === 1 ? "result" : "results"}.`;
  }

  drawSteps();
  drawResults();
}
