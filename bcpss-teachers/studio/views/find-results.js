// Find: the results half. Seed units (K-8 core subjects), refine filters, and grouped or ranked studio materials.
import { favoriteButton } from "../core/actions.js";
import { KIND_LABELS } from "../core/catalog.js";
import { h } from "../core/dom.js";
import { facetCounts, searchItems } from "../core/search.js";
import { emptyState, gradeLabel, plural, resultCard } from "../core/ui.js";
import { DOMAINS, ENGINES, GRADE_LABEL, KLUS, SUBJECT_PROFILE } from "../data/taxonomy.js";

const KIND_PLURAL = { lesson: "Lessons", vocab: "Vocabulary", wida: "WIDA practice", activity: "Activities", project: "Projects" };
export const KIND_ORDER = ["lesson", "vocab", "wida", "activity", "project"];
export const PAGE = 24;
export const PATHWAY_LABEL = "Standards-aligned pathway (not a district-verified unit sequence)";
const ENGINE_LABEL = Object.fromEntries(ENGINES.map((e) => [e.id, e.label]));

const REFINE = [
  { key: "kind", label: "Type", name: (v) => KIND_LABELS[v] || v, order: KIND_ORDER },
  { key: "klu", label: "Key language use", name: (v) => v, order: KLUS },
  { key: "domain", label: "Language domain", name: (v) => v, order: DOMAINS },
  { key: "engine", label: "Activity type", name: (v) => ENGINE_LABEL[v] || v },
];

export function refineGroups(items, st, onPick) {
  const counts = facetCounts(items, st.q, filtersOf(st));
  const groups = [];
  for (const g of REFINE) {
    const present = Object.entries(counts[g.key] || {});
    // A value with no results is never offered; a group that offers no real choice is omitted.
    if (present.length < 2 && !st[g.key]) continue;
    const order = g.order || present.map(([v]) => v).sort();
    const values = order.filter((v) => counts[g.key][v] > 0 || st[g.key] === v);
    groups.push(
      h(
        "fieldset",
        { class: "st-refine" },
        h("legend", {}, g.label),
        h(
          "ul",
          { class: "st-pills" },
          values.map((v) => {
            const on = st[g.key] === v;
            const btn = h("button", { class: "st-pick", type: "button", "aria-pressed": String(on) }, `${g.name(v)} (${counts[g.key][v] ?? 0})`);
            btn.addEventListener("click", () => onPick(g.key, on ? "" : v));
            return h("li", {}, btn);
          }),
        ),
      ),
    );
  }
  return groups;
}

export const filtersOf = (st) => ({ grade: st.grade, subject: st.subject, kind: st.kind, klu: st.klu, domain: st.domain, engine: st.engine });

function unitCard(u, shell) {
  const ref = { kind: "unit", id: u.id, title: `Unit ${u.unit_number}: ${u.unit_title}`, grade: u.grade };
  const link = h("a", { class: "st-card-link", href: `#/unit/${encodeURIComponent(u.id)}` }, ref.title);
  link.addEventListener("click", () => shell.library.addRecent(ref));
  return h(
    "li",
    {},
    h(
      "article",
      { class: "st-card st-result" },
      h("h3", { class: "st-card-title" }, link),
      h(
        "p",
        { class: "st-meta" },
        u.curriculum_name ? h("span", { class: "st-chip" }, u.curriculum_name) : null,
        u.primary_klu ? h("span", { class: "st-chip st-chip-plain" }, `Key language use: ${u.primary_klu}`) : null,
        u.activity_count ? h("span", { class: "st-chip st-chip-plain" }, plural(u.activity_count, "activity", "activities")) : null,
      ),
      u.unit_summary ? h("p", { class: "st-lo" }, u.unit_summary) : null,
      (u.core_standards || []).length ? h("p", { class: "st-standards" }, u.core_standards.slice(0, 4).map((s) => h("code", {}, s))) : null,
      favoriteButton(ref, shell),
    ),
  );
}

/** District units block for K-8 ELA / Math / Science / Social Studies. Fails softly with a retry. */
export function unitsBlock(st, shell, isCurrent) {
  const box = h("section", { class: "st-step", "aria-labelledby": "st-units-h" }, h("h2", { id: "st-units-h" }, `BCPSS units: ${gradeLabel(st.grade)} ${SUBJECT_PROFILE[st.subject].short}`));
  box.append(h("p", { class: "st-loading", role: "status" }, "Loading units"));
  const fill = async () => {
    try {
      const all = await shell.catalog.seedUnits(st.grade, st.subject);
      if (!isCurrent()) return;
      const words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
      const units = all.filter((u) => words.every((w) => `${u.unit_title} ${u.unit_summary} ${(u.core_standards || []).join(" ")}`.toLowerCase().includes(w)));
      box.querySelector(".st-loading, .st-notice, .st-results, .st-empty")?.remove();
      box.append(
        units.length
          ? h("ul", { class: "st-results" }, units.map((u) => unitCard(u, shell)))
          : emptyState({ title: "No district units match that search", body: "Clear the search to see all units, or look at the studio materials below." }),
      );
    } catch {
      if (!isCurrent()) return;
      const retry = h("button", { class: "st-btn", type: "button" }, "Try again");
      retry.addEventListener("click", () => {
        box.querySelector(".st-notice")?.remove();
        box.append(h("p", { class: "st-loading", role: "status" }, "Loading units"));
        fill();
      });
      box.querySelector(".st-loading")?.remove();
      box.append(h("div", { class: "st-notice", role: "alert" }, "The district unit list did not load. ", retry));
    }
  };
  fill();
  return box;
}

function cards(list, shell, level) {
  return h(
    "ul",
    { class: "st-results" },
    list.map((item) =>
      h("li", {}, resultCard(item, { level, favorite: favoriteButton({ kind: item.kind, id: item.id, title: item.title, grade: item.grade, subject: item.subject }, shell), onOpen: (i) => shell.library.addRecent({ kind: i.kind, id: i.id, title: i.title, grade: i.grade, subject: i.subject }) })),
    ),
  );
}

/** Ranked list when searching, grouped by kind when browsing. Returns the node and the match count. */
export function materialsBlock(items, st, shell, more) {
  const list = searchItems(items, st.q, filtersOf(st));
  const node = h("div", {});
  if (!list.length) return { node, count: 0 };
  const shown = list.slice(0, st.shown);
  if (st.q) node.append(cards(shown, shell, 3));
  else {
    for (const kind of KIND_ORDER) {
      const group = shown.filter((i) => i.kind === kind);
      if (!group.length) continue;
      node.append(h("h3", { class: "st-group" }, KIND_PLURAL[kind]), cards(group, shell, 4));
    }
  }
  if (list.length > shown.length) {
    const btn = h("button", { class: "st-btn", type: "button" }, `Show ${Math.min(PAGE, list.length - shown.length)} more`);
    btn.addEventListener("click", more);
    node.append(h("p", { class: "st-row" }, btn));
  }
  return { node, count: list.length };
}

/** A zero-result page that says what to try instead. */
export function noResults(items, st, actions) {
  const buttons = [];
  if (st.q || st.kind || st.klu || st.domain || st.engine) {
    const clear = h("button", { class: "st-btn", type: "button" }, "Clear search and filters");
    clear.addEventListener("click", () => actions.clearRefine());
    buttons.push(clear);
  }
  const bySubject = facetCounts(items, st.q, { grade: st.grade }).subject;
  for (const [id, n] of Object.entries(bySubject)) {
    if (id === st.subject || !n) continue;
    const b = h("button", { class: "st-pick", type: "button", "data-subject": id }, `${SUBJECT_PROFILE[id]?.short || id} (${n})`);
    b.addEventListener("click", () => actions.setSubject(id));
    buttons.push(b);
  }
  const where = [st.grade && GRADE_LABEL[st.grade], st.subject && SUBJECT_PROFILE[st.subject].label].filter(Boolean).join(", ");
  return emptyState({
    title: st.q ? `Nothing matches "${st.q}"${where ? ` for ${where}` : ""}` : `No studio materials for ${where || "this choice"} yet`,
    body: "Try a shorter search, a standard code such as 3.NF.A.1, or a subject that has materials for this grade.",
    actions: buttons,
  });
}

