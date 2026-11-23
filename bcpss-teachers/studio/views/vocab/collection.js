// #/vocab/<id>: the collection page. Calm cards that open on request, plus the ways to use the words.
import { h } from "../../core/dom.js";
import { gradeLabel, subjectChip } from "../../core/ui.js";
import { collectionActions } from "./actions.js";
import { renderEntryCard } from "./entry-card.js";
import { printMenu } from "./print.js";
import { ENGINE_VERB, collectionHref, launchableActivities } from "./source.js";
import { chip } from "./ui.js";
import { TIERS } from "../../data/taxonomy.js";

function practicePanel(collection, shell, student) {
  const box = h("section", { class: "st-v-practice", "aria-labelledby": "st-v-practice-h" }, h("h2", { id: "st-v-practice-h" }, "Practice this word list"));
  const row = h("p", { class: "st-v-row" });
  row.append(
    h("a", { class: "st-v-btn", href: collectionHref(collection.id, "wall", { game: 1, student: student ? 1 : "" }) }, "Play the matching game"),
    h("a", { class: "st-v-btn", href: collectionHref(collection.id, "explore", { student: student ? 1 : "" }) }, "Explore the words"),
  );
  const slot = h("div", { class: "st-v-activities" });
  box.append(row, slot);
  if (!student) {
    row.append(
      h("a", { class: "st-v-btn", href: `#/remix?vocab=${encodeURIComponent(collection.id)}` }, "Remix this list"),
      h("a", { class: "st-v-btn", href: `#/create?type=vocab-mat&vocab=${encodeURIComponent(collection.id)}` }, "Make a printable vocabulary mat"),
    );
  }
  launchableActivities(shell, collection).then((acts) => {
    if (!acts.length || student) return;
    const tier = h("select", { id: "st-v-tier", class: "st-v-select" }, TIERS.map((t) => h("option", { value: t.id }, t.short)));
    slot.append(
      h("label", { for: "st-v-tier", class: "st-v-label" }, "Support level for activities"),
      tier,
      h(
        "ul",
        { class: "st-v-act-list" },
        acts.map((a) => h("li", {}, h("button", { class: "st-v-btn st-v-primary", type: "button", onclick: () => shell.openActivity(a.id, { tier: tier.value }) }, `Launch ${ENGINE_VERB[a.engine] || a.engine}: ${a.title}`))),
      ),
    );
  });
  return box;
}

export function render({ root, params, shell, collection, student }) {
  const expanded = new Set();
  const cards = new Map();
  const ctx = {
    collection,
    student,
    expanded,
    showAlt: false,
    focusEntry(id) {
      const card = cards.get(id);
      if (!card) return;
      card.expand();
      card.scrollIntoView({ block: "center", behavior: "auto" });
      card.focus({ preventScroll: true });
    },
  };
  const grid = h("div", { class: "st-v-grid", role: "list" });
  for (const e of collection.entries) {
    const card = renderEntryCard(e, ctx);
    card.setAttribute("role", "listitem");
    cards.set(e.id, card);
    grid.append(card);
  }

  const expandAll = h("button", { class: "st-v-btn", type: "button" }, "Show more on every card");
  let allOpen = false;
  expandAll.addEventListener("click", () => {
    allOpen = !allOpen;
    for (const card of cards.values()) {
      const btn = card.querySelector(".st-v-card-foot button");
      if ((btn.getAttribute("aria-expanded") === "true") !== allOpen) btn.click();
    }
    expandAll.textContent = allOpen ? "Show less on every card" : "Show more on every card";
    shell.announce(allOpen ? "All cards expanded." : "All cards collapsed.");
  });
  const altToggle = h("button", { class: "st-v-btn", type: "button", "aria-pressed": "false" }, "Show picture descriptions");
  altToggle.addEventListener("click", () => {
    ctx.showAlt = altToggle.getAttribute("aria-pressed") !== "true";
    altToggle.setAttribute("aria-pressed", String(ctx.showAlt));
    for (const a of grid.querySelectorAll(".st-v-alt")) a.hidden = !ctx.showAlt;
  });

  const head = h(
    "header",
    { class: "st-v-head" },
    student ? null : h("p", { class: "st-v-crumb" }, h("a", { href: "#/vocab" }, "All vocabulary collections")),
    h("h1", {}, collection.title),
    h("p", { class: "st-v-meta" }, collection.grade ? chip(gradeLabel(collection.grade)) : null, subjectChip(collection.subject), chip(`${collection.entries.length} words`), ...(collection.standards || []).map((s) => h("code", { class: "st-v-code" }, s))),
    student || !collection.curriculum?.note ? null : h("p", { class: "st-v-note" }, collection.curriculum.note),
    student ? null : h("p", { class: "st-v-note" }, "Teacher review recommended before sharing: this collection is original practice, not a district-approved resource."),
  );
  const tools = h(
    "div",
    { class: "st-v-toolbar", role: "group", "aria-label": "Ways to use this collection" },
    h("a", { class: "st-v-btn st-v-primary", href: collectionHref(collection.id, "wall", { student: student ? 1 : "" }) }, "Open the word wall"),
    h("a", { class: "st-v-btn st-v-primary", href: collectionHref(collection.id, "explore", { student: student ? 1 : "" }) }, "Explore the words"),
    expandAll,
    altToggle,
    printMenu(collection, { student }),
  );
  root.replaceChildren(h("div", { class: "st-v-page" }, head, tools, student ? null : collectionActions(collection, shell, "wall"), grid, practicePanel(collection, shell, student)));
  const want = params.entry;
  if (want && cards.has(want)) queueMicrotask(() => ctx.focusEntry(want));
  return () => {};
}
