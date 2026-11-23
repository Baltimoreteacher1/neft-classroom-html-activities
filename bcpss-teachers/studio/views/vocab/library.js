// #/vocab: curriculum-connected collections, filterable by grade band, subject, standard, unit and language function,
// with search by word (English or Spanish) across every collection. A filter value with no results is never offered.
import { h } from "../../core/dom.js";
import { favoriteButton } from "../../core/actions.js";
import { gradeLabel, plural, subjectChip } from "../../core/ui.js";
import { FACETS, FACET_LABEL, buildIndex, facetCounts, filterCollections, hasActiveFilters, parseState, searchEntries, serializeState } from "../../core/vocab-search.js";
import { visualFigure } from "./visual.js";
import { chip } from "./ui.js";
import { collectionHref } from "./source.js";

const CHIP_FACETS = ["band", "subject", "klu"];

function thumbs(collection) {
  const specs = collection.entries.filter((e) => e.visual).slice(0, 3);
  const row = h("div", { class: "st-v-thumbs", "aria-hidden": "true" });
  for (const e of specs) row.append(visualFigure(e.visual, { cls: "st-v-thumb" }));
  return row;
}

function collectionCard(c, shell) {
  const words = c.entries.slice(0, 5).map((e) => e.word);
  const more = c.entries.length - words.length;
  return h(
    "article",
    { class: "st-v-lib-card", "aria-labelledby": `st-v-c-${c.id}` },
    thumbs(c),
    h("h3", { id: `st-v-c-${c.id}` }, h("a", { href: collectionHref(c.id) }, c.title)),
    h("p", { class: "st-v-meta" }, c.grade ? chip(gradeLabel(c.grade)) : null, subjectChip(c.subject), chip(plural(c.entries.length, "word"))),
    h("p", { class: "st-v-words" }, words.join(", "), more > 0 ? ` and ${more} more` : ""),
    (c.standards || []).length ? h("p", { class: "st-v-codes" }, c.standards.map((s) => h("code", { class: "st-v-code" }, s))) : null,
    h(
      "p",
      { class: "st-v-row" },
      h("a", { class: "st-v-btn st-v-primary", href: collectionHref(c.id) }, "Open", h("span", { class: "st-v-sr" }, ` ${c.title}`)),
      h("a", { class: "st-v-btn", href: collectionHref(c.id, "wall") }, "Word wall", h("span", { class: "st-v-sr" }, ` for ${c.title}`)),
      h("a", { class: "st-v-btn", href: collectionHref(c.id, "explore") }, "Explore", h("span", { class: "st-v-sr" }, ` ${c.title}`)),
      favoriteButton({ kind: "vocab", id: c.id, title: c.title, grade: c.grade, subject: c.subject }, shell),
    ),
  );
}

function wordHits(hits, byId) {
  if (!hits.length) return null;
  return h(
    "section",
    { class: "st-v-hits", "aria-labelledby": "st-v-hits-h" },
    h("h2", { id: "st-v-hits-h" }, `Words that match (${hits.length})`),
    h(
      "ul",
      { class: "st-v-hit-list" },
      hits.slice(0, 24).map((x) =>
        h(
          "li",
          {},
          h("a", { href: collectionHref(x.cid, "", { entry: x.eid }) }, x.word),
          x.kind === "spanish" ? h("span", { lang: "es", class: "st-v-hit-es" }, ` (${x.es})`) : x.es ? h("span", { lang: "es", class: "st-v-hit-es" }, ` / ${x.es}`) : null,
          h("span", { class: "st-v-hit-where" }, ` in ${byId.get(x.cid)?.title || x.cid}`),
          x.kind === "spanish" ? chip("Spanish match") : x.kind === "definition" ? chip("In a definition") : null,
        ),
      ),
    ),
  );
}

export function renderLibrary({ root, params, shell, collections, failed }) {
  const index = buildIndex(collections);
  const byId = new Map(collections.map((c) => [c.id, c]));
  const initial = parseState(new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([k]) => ["q", ...FACETS].includes(k)))).toString());
  const state = { ...initial };

  const input = h("input", { id: "st-v-q", type: "search", name: "q", value: state.q, autocomplete: "off", placeholder: "Try ratio, larva or razón" });
  const form = h("form", { class: "st-v-search", role: "search", "aria-label": "Search vocabulary words" }, h("label", { for: "st-v-q" }, "Search words in English or Spanish"), h("div", { class: "st-v-search-row" }, input, h("button", { class: "st-v-btn st-v-primary", type: "submit" }, "Search")));
  const filters = h("div", { class: "st-v-filters", role: "group", "aria-label": "Filter collections" });
  const status = h("p", { class: "st-v-status", role: "status", "aria-live": "polite" });
  const results = h("div", { class: "st-v-results" });

  const update = (focusKey) => {
    shell.replaceHash(`#/vocab${serializeState(state)}`);
    const facets = facetCounts(collections, index, state);
    const list = filterCollections(collections, index, state);
    const hits = state.q ? searchEntries(index, state.q, { scope: new Set(list.map((c) => c.id)) }) : [];

    filters.replaceChildren();
    for (const f of FACETS) {
      const opts = facets[f];
      if (!opts.length) continue;
      const group = h("div", { class: "st-v-facet", "data-facet": f });
      if (CHIP_FACETS.includes(f)) {
        group.append(h("h2", { class: "st-v-facet-h", id: `st-v-f-${f}` }, FACET_LABEL[f]));
        const row = h("div", { class: "st-v-chiprow", role: "group", "aria-labelledby": `st-v-f-${f}` });
        for (const o of opts) {
          const b = h("button", { class: "st-v-fchip", type: "button", "aria-pressed": String(o.selected), "data-facet": f, "data-value": o.value }, `${o.label} `, h("span", { class: "st-v-count" }, `(${o.count})`));
          b.addEventListener("click", () => {
            state[f] = o.selected ? "" : o.value;
            update(`${f}:${o.value}`);
          });
          row.append(b);
        }
        group.append(row);
      } else {
        const sel = h("select", { class: "st-v-select", id: `st-v-sel-${f}`, "data-facet": f }, h("option", { value: "" }, "Any"));
        for (const o of opts) sel.append(h("option", { value: o.value, selected: o.selected }, `${o.label} (${o.count})`));
        sel.addEventListener("change", () => {
          state[f] = sel.value;
          update(`sel:${f}`);
        });
        group.append(h("label", { for: sel.id, class: "st-v-facet-h" }, FACET_LABEL[f]), sel);
      }
      filters.append(group);
    }
    if (hasActiveFilters(state)) {
      const clear = h("button", { class: "st-v-btn st-v-quiet", type: "button", "data-clear": "" }, "Clear all filters");
      clear.addEventListener("click", () => {
        for (const k of ["q", ...FACETS]) state[k] = "";
        input.value = "";
        update("clear");
        input.focus();
      });
      filters.append(h("div", { class: "st-v-facet" }, clear));
    }

    results.replaceChildren();
    if (!list.length) {
      results.append(
        h("div", { class: "st-v-empty" }, h("h2", {}, "No collections match"), h("p", {}, state.q ? `Nothing matches "${state.q}" with these filters. Check the spelling, or clear a filter.` : "Nothing matches these filters. Clear a filter to see more."), h("p", {}, h("button", { class: "st-v-btn st-v-primary", type: "button", onclick: () => { for (const k of ["q", ...FACETS]) state[k] = ""; input.value = ""; update("clear"); } }, "Clear all filters"))),
      );
    } else {
      results.append(wordHits(hits, byId), h("div", { class: "st-v-lib-grid" }, list.map((c) => collectionCard(c, shell))));
    }
    status.textContent = `${plural(list.length, "collection")}${state.q ? `, ${plural(hits.length, "matching word")}` : ""}.`;

    if (focusKey) {
      const [a, b] = focusKey.split(":");
      const target = a === "sel" ? filters.querySelector(`#st-v-sel-${b}`) : a === "clear" ? null : filters.querySelector(`[data-facet="${a}"][data-value="${CSS.escape(b)}"]`);
      target?.focus();
    }
  };

  let timer;
  input.addEventListener("input", () => {
    state.q = input.value.trim();
    clearTimeout(timer);
    timer = setTimeout(() => update(), 180);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    state.q = input.value.trim();
    clearTimeout(timer);
    update();
  });

  root.replaceChildren(
    h(
      "div",
      { class: "st-v-page" },
      h("header", { class: "st-v-head" }, h("h1", {}, "Visual Vocabulary Studio"), h("p", { class: "st-v-lead" }, "Picture-first word collections tied to the standards. Open a collection, project a word wall, or explore how the words work.")),
      failed.length ? h("p", { class: "st-v-warn", role: "status" }, `${plural(failed.length, "collection")} could not be loaded. The rest are shown.`) : null,
      form,
      filters,
      status,
      results,
    ),
  );
  update();
  return () => clearTimeout(timer);
}
