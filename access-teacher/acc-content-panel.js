// Teacher Hub: content library. A live coverage matrix of the assessment bank (grade band x domain x Key Language Use x
// academic context, with practice band), a content alignment explorer with real previews, and links to practice a set.
// Counts come from content/bank/index.json (generated from the set files); nothing is typed. Combinations the WIDA framework
// lists are marked "framework"; the rest are supplementary practice. A framework combination with no items is a gap.
import { h } from "/access-practice-lab/src/acc/engine/dom.js";
import { I18nEngine } from "/access-practice-lab/src/acc/i18n/I18nEngine.js";
import { mapItem } from "/access-practice-lab/src/acc/wida/framework.js";

const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
const KLUS = ["Narrate", "Inform", "Explain", "Argue"];
const CONTEXTS = ["Mathematics", "Science", "Social Studies", "Language Arts", "Social and Instructional"];
const BANDS = ["early", "building", "strong"];
const DEMANDS = ["low", "moderate", "high"];
const PAGE = 24;

export async function mountContentPanel(root, doc = document) {
  let index;
  try {
    index = await (await fetch("/access-practice-lab/content/bank/index.json")).json();
  } catch {
    root.replaceChildren(h(doc, "p", { class: "acc-state is-error", role: "alert", text: "The content library could not be loaded." }));
    return;
  }
  const items = index.sets.flatMap((s) => s.items.map((i) => ({ ...i, setId: s.id, setTitle: s.title, grade: s.grade, domain: s.domain, minutes: s.minutes })));
  const state = { grade: "3-5", band: "all", domain: "all", klu: "all", context: "all", demand: "all", fn: "all", explicitOnly: false, shown: PAGE, open: null };
  const functions = [...new Set(items.flatMap((i) => i.functions))].sort();
  const setCache = new Map();

  const sel = (id, label, options, key) => {
    const s = h(doc, "select", { id, class: "acc-select" }, ...options.map(([v, t]) => h(doc, "option", { value: v, text: t })));
    s.value = state[key];
    s.addEventListener("change", () => {
      state[key] = s.value;
      state.shown = PAGE;
      state.open = null;
      draw();
    });
    return h(doc, "label", { class: "acc-field", for: id }, h(doc, "span", { text: label }), s);
  };
  const all = (t) => [["all", t]];

  function coverage() {
    const rows = items.filter((i) => i.grade === state.grade && (state.band === "all" || i.band === state.band));
    const head = h(doc, "tr", {}, h(doc, "th", { scope: "col", text: "Domain · Key Language Use" }), ...CONTEXTS.map((c) => h(doc, "th", { scope: "col", text: c })));
    const body = [];
    let gaps = 0;
    for (const d of DOMAINS)
      for (const k of KLUS)
        body.push(
          h(doc, "tr", {}, h(doc, "th", { scope: "row", text: `${d} · ${k}` }),
            ...CONTEXTS.map((c) => {
              const here = rows.filter((i) => i.domain === d && i.klu === k && i.context === c);
              const framework = mapItem({ domain: d, klu: k, context: c }, state.grade).explicit;
              const split = BANDS.map((b) => here.filter((i) => i.band === b).length).join("/");
              const gap = framework && !here.length;
              if (gap) gaps += 1;
              const label = here.length ? `${here.length} · ${split}` : framework ? "Gap" : "Not a framework combination";
              return h(doc, "td", { class: `acc-cov ${here.length ? (framework ? "is-framework" : "is-supp") : framework ? "is-gap" : "is-none"}` }, h(doc, "span", { text: label }), here.length ? h(doc, "span", { class: "acc-cov-tag", text: framework ? "framework" : "supplementary" }) : null);
            }),
          ),
        );
    return {
      gaps,
      total: rows.length,
      table: h(doc, "table", { class: "acc-table acc-matrix", tabindex: "0" }, h(doc, "caption", { text: `Grades ${state.grade.replace("-", "–")}: items by domain, key language use and context (count · early/building/strong). “Framework” marks combinations the WIDA framework lists; “supplementary” is useful practice it does not list for that combination.` }), h(doc, "thead", {}, head), h(doc, "tbody", {}, ...body)),
    };
  }

  const matches = () =>
    items.filter((i) => i.grade === state.grade && (state.band === "all" || i.band === state.band) && (state.domain === "all" || i.domain === state.domain) && (state.klu === "all" || i.klu === state.klu) && (state.context === "all" || i.context === state.context) && (state.demand === "all" || i.languageDemand === state.demand) && (state.fn === "all" || i.functions.includes(state.fn)) && (!state.explicitOnly || i.explicit));

  async function getSet(id) {
    if (!setCache.has(id)) setCache.set(id, (await fetch(`/access-practice-lab/content/bank/${encodeURIComponent(id)}.json`)).json());
    return setCache.get(id);
  }

  async function preview(row, host) {
    const set = await getSet(row.setId);
    const item = set.items.find((i) => i.id === row.id);
    const stim = set.stimuli.find((s) => s.id === item.stimulus);
    const box = h(doc, "div", { class: "acc-preview" });
    if (stim) {
      box.append(h(doc, "h4", { "data-i18n-skip": "", text: stim.title || "" }));
      const text = stim.kind === "audio" ? (stim.turns?.length ? stim.turns.map((t) => `${t.speaker}: ${t.text}`) : [stim.script]) : stim.kind === "table" ? [stim.caption, ...stim.rows.map((r) => r.join(" | "))] : stim.paragraphs || [];
      for (const p of text) box.append(h(doc, "p", { "data-i18n-skip": "", text: p }));
    }
    box.append(h(doc, "p", { class: "acc-stem-preview", "data-i18n-skip": "", text: item.stem }));
    const body = item.options ? item.options.map((o) => `${o.id.toUpperCase()}. ${o.text}`) : item.ordering ? item.ordering.items.map((o) => o.text) : item.matching ? [...item.matching.left.map((l) => `• ${l.text}`), ...item.matching.right.map((r) => `→ ${r.text}`)] : item.dragDrop ? [...item.dragDrop.tokens.map((t) => `• ${t.text}`), ...item.dragDrop.zones.map((z) => `[${z.label}]`)] : item.dropdown ? [item.dropdown.template] : [];
    if (body.length) box.append(h(doc, "ul", { "data-i18n-skip": "" }, ...body.map((t) => h(doc, "li", { text: t }))));
    const key = h(doc, "details", { class: "acc-key" }, h(doc, "summary", { text: "Teacher key and scoring guidance" }));
    if (item.options) key.append(h(doc, "p", { "data-i18n-skip": "", text: `Key: ${[].concat(item.answer).map((a) => a.toUpperCase()).join(", ")}. ${item.explanation || ""}` }));
    else if (item.speaking || item.constructed) key.append(h(doc, "p", { text: "Scored by teacher review against the practice rubric. Characteristics of a strong response:" }), h(doc, "ul", { "data-i18n-skip": "" }, ...(item.speaking?.exemplar || item.constructed.exemplar).map((t) => h(doc, "li", { text: t }))));
    else key.append(h(doc, "p", { "data-i18n-skip": "", text: item.explanation || "" }));
    box.append(key);
    host.replaceChildren(box);
  }

  function draw() {
    const cov = coverage();
    const found = matches();
    const framework = items.filter((i) => i.grade === state.grade && i.explicit).length;
    const totalGrade = items.filter((i) => i.grade === state.grade).length;
    const list = found.slice(0, state.shown).map((row) => {
      const host = h(doc, "div", { class: "acc-preview-host" });
      const open = h(doc, "button", { type: "button", class: "acc-btn", "aria-expanded": String(state.open === row.id), text: state.open === row.id ? "Hide preview" : "Preview" });
      open.addEventListener("click", async () => {
        state.open = state.open === row.id ? null : row.id;
        draw();
      });
      if (state.open === row.id) preview(row, host);
      return h(doc, "li", { class: "acc-item-row" },
        h(doc, "p", { class: "acc-item-stem", "data-i18n-skip": "", text: row.stem }),
        h(doc, "p", { class: "acc-hint" }, `${row.domain} · ${row.klu} · ${row.context} · ${row.band} · language demand ${row.languageDemand} · ${row.explicit ? "framework" : "supplementary"}`),
        h(doc, "div", { class: "acc-actions" }, open, h(doc, "a", { class: "acc-btn", href: `/access-practice-lab/assess/${row.setId}?mode=formative`, text: "Practice this set (learning mode)" }), h(doc, "a", { class: "acc-btn", href: `/access-practice-lab/assess/${row.setId}?mode=summative`, text: "Practice this set (test simulation)" })),
        host);
    });
    root.replaceChildren(
      h(doc, "p", { class: "acc-hint", text: `${index.sets.length} practice sets · ${items.length} items · independent practice material; not WIDA or DRC content. Automated checks only: no item has had human review.` }),
      h(doc, "div", { class: "acc-filters" },
        sel("cGrade", "Grade band", [["3-5", "Grades 3–5"], ["6-8", "Grades 6–8"]], "grade"),
        sel("cBand", "Practice band", [...all("All"), ...BANDS.map((b) => [b, b])], "band"),
        sel("cDomain", "Domain", [...all("All"), ...DOMAINS.map((d) => [d, d])], "domain"),
        sel("cKlu", "Key Language Use", [...all("All"), ...KLUS.map((k) => [k, k])], "klu"),
        sel("cContext", "Academic context", [...all("All"), ...CONTEXTS.map((c) => [c, c])], "context"),
        sel("cDemand", "Language demand", [...all("All"), ...DEMANDS.map((d) => [d, d])], "demand"),
        sel("cFn", "Language function", [...all("All"), ...functions.map((f) => [f, f])], "fn")),
      h(doc, "label", { class: "acc-check" }, (() => { const c = h(doc, "input", { type: "checkbox", id: "cExplicit" }); c.checked = state.explicitOnly; c.addEventListener("change", () => { state.explicitOnly = c.checked; state.shown = PAGE; draw(); }); return c; })(), " Only combinations the WIDA framework lists"),
      h(doc, "p", { class: "acc-hint", role: "status", text: `Grades ${state.grade.replace("-", "–")}: ${totalGrade} items, ${framework} in framework-listed combinations. ${cov.gaps} framework combination${cov.gaps === 1 ? "" : "s"} with no items${cov.gaps ? " (marked Gap)" : ""}.` }),
      cov.table,
      h(doc, "h3", { text: `Tasks that match your filters (${found.length})` }),
      found.length ? h(doc, "ul", { class: "acc-item-list" }, ...list) : h(doc, "p", { class: "acc-state is-empty", text: "No tasks match these filters." }),
      found.length > state.shown ? (() => { const b = h(doc, "button", { type: "button", class: "acc-btn", text: `Show ${Math.min(PAGE, found.length - state.shown)} more` }); b.addEventListener("click", () => { state.shown += PAGE; draw(); }); return b; })() : null,
    );
  }
  draw();
  new I18nEngine({ root: root.closest("section") || root }).start();
}
