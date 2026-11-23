// One vocabulary entry as a calm card: word, pronunciation, picture, definition and one example by default;
// everything else (use, Spanish, word parts, related words, practice, teacher notes) opens on request.
import { h } from "../../core/dom.js";
import { visualFigure } from "./visual.js";
import { chip, disclosure, field, reviewBadge, speakButton, uid } from "./ui.js";

const section = (title, ...kids) => h("section", { class: "st-v-sec" }, h("h3", { class: "st-v-sec-title" }, title), ...kids);

function useSection(e) {
  const rows = [];
  if (e.academicSentence) rows.push(field("Academic sentence", h("p", {}, e.academicSentence, " ", speakButton(e.academicSentence, { label: `Hear the academic sentence for ${e.word}`, rate: 0.85 }))));
  if (e.everyday) rows.push(field("In everyday language", e.everyday));
  if (e.nonExample) rows.push(field("Not an example", e.nonExample, "st-v-field-non"));
  return rows.length ? section("Use the word", ...rows) : null;
}

function spanishSection(e, student) {
  if (!e.es?.word) return null;
  const head = h("p", { class: "st-v-es-word" }, h("strong", { lang: "es" }, e.es.word), speakButton(e.es.word, { label: `Hear ${e.es.word} in Spanish`, lang: "es-US" }));
  const kids = [head];
  if (e.es.def) kids.push(h("p", { lang: "es" }, e.es.def));
  if (e.es.verified !== true && !student) kids.push(h("p", {}, reviewBadge(), " Teacher review recommended before sharing this translation."));
  return section("Spanish", ...kids);
}

function partsSection(e) {
  const parts = e.morphology?.parts;
  if (!parts?.length) return null;
  return section(
    "Word parts",
    h("ul", { class: "st-v-parts" }, parts.map((p) => h("li", {}, h("strong", {}, p.part), " ", h("span", {}, `means ${p.meaning}`)))),
  );
}

function relatedSection(e, ctx) {
  if (!e.related?.length) return null;
  const byWord = (w) => ctx.collection.entries.find((x) => x.id === w || x.word === w);
  return section(
    "Related words",
    h(
      "ul",
      { class: "st-v-related" },
      e.related.map((r) => {
        const t = byWord(r);
        return h("li", {}, t ? h("button", { class: "st-v-link", type: "button", onclick: () => ctx.focusEntry(t.id) }, t.word) : chip(r));
      }),
    ),
  );
}

function practiceSection(e, student) {
  const p = e.practice;
  if (!p) return null;
  const rows = [];
  if (p.visualPrompt) rows.push(field("Look", p.visualPrompt));
  if (p.speakWrite) rows.push(field("Say it, then write it", p.speakWrite));
  if (p.retrieval && !student) rows.push(field("Retrieval prompt", p.retrieval));
  return rows.length ? section("Practice", ...rows) : null;
}

function teacherSection(e, student) {
  if (student || !e.misconception) return null;
  return section("Watch for", h("p", { class: "st-v-watch" }, e.misconception));
}

export function renderEntryCard(e, ctx) {
  const id = `st-v-e-${e.id}`;
  const panelId = uid("more");
  const more = disclosure({
    label: "Show more",
    openLabel: "Show less",
    panelId,
    open: ctx.expanded.has(e.id),
    aria: (o) => `${o ? "Show less" : "Show more"} about ${e.word}`,
    onToggle: (o) => (o ? ctx.expanded.add(e.id) : ctx.expanded.delete(e.id)),
  });
  more.panel.className = "st-v-more";
  more.panel.append(...[useSection(e), spanishSection(e, ctx.student), partsSection(e), relatedSection(e, ctx), practiceSection(e, ctx.student), teacherSection(e, ctx.student)].filter(Boolean));

  const meta = h("p", { class: "st-v-meta" });
  if (e.tier) meta.append(chip(`Tier ${e.tier}`));
  if (e.klu) meta.append(chip(e.klu));
  for (const d of e.domains || []) meta.append(chip(d));

  const card = h(
    "article",
    { class: "st-v-card", id, "aria-labelledby": `${id}-w`, tabindex: "-1" },
    h(
      "header",
      { class: "st-v-card-head" },
      h("h2", { class: "st-v-word", id: `${id}-w` }, e.word),
      e.pos ? h("span", { class: "st-v-pos" }, e.pos) : null,
      speakButton(e.word, { label: `Hear ${e.word}` }),
    ),
    e.pron ? h("p", { class: "st-v-pron" }, h("span", { class: "st-v-pron-guide" }, e.pron), e.ipa ? h("span", { class: "st-v-ipa", lang: "en-fonipa" }, ` /${e.ipa}/`) : null) : null,
    e.visual ? visualFigure(e.visual, { cls: "st-v-fig-large", showAlt: ctx.showAlt }) : h("p", { class: "st-v-novis" }, `No picture for this word. ${e.noVisualReason}`),
    h("p", { class: "st-v-def" }, e.def),
    h("p", { class: "st-v-ctx" }, h("span", { class: "st-v-ctx-label" }, "Example "), e.context, " ", speakButton(e.context, { label: `Hear the example sentence for ${e.word}`, rate: 0.85 })),
    meta,
    h("div", { class: "st-v-card-foot" }, more.button),
    more.panel,
  );
  card.expand = () => more.set(true);
  return card;
}
