// The family card: a short, printable "What your child is learning" note. Built only from the model in data.js.
import { esc, h } from "../../core/dom.js";
import { btn, chip, printHtml, section } from "../lens-ui.js";

const LANG = { es: "Spanish" };
const langName = (code) => LANG[code] || code.toUpperCase();

function intro(unit, gradeText, subjectText) {
  return `Your child's class is studying "${unit.unit_title}" in ${gradeText} ${subjectText}. The unit works toward these standards:`;
}

function printable(unit, model, gradeText, subjectText) {
  const std = model.standards.map((s) => `<li><strong>${esc(s.code)}</strong>${s.text ? `: ${esc(s.text)}` : ""}</li>`).join("");
  const notes = model.notes
    .map(
      (n) =>
        `<h2>${esc(langName(n.lang))} note</h2>` +
        (n.objective ? `<p lang="${esc(n.lang)}">${esc(n.objective)}</p>` : "") +
        (n.vocab.length ? `<ul>${n.vocab.map((v) => `<li lang="${esc(n.lang)}">${esc(v.en)}: ${esc(v.es)}</li>`).join("")}</ul>` : "") +
        (n.familyPrompt ? `<p lang="${esc(n.lang)}"><strong>Try at home:</strong> ${esc(n.familyPrompt)}</p>` : ""),
    )
    .join("");
  return `<h1>What your child is learning</h1><p>${esc(intro(unit, gradeText, subjectText))}</p><ul>${std}</ul>${notes}<p><em>Prepared from the district seed list and Studio lesson notes. Teacher review recommended before sharing.</em></p>`;
}

/** `createHandoff` is the hash that opens the Resource Studio for this unit's grade and subject. */
export function familyCard({ unit, model, gradeText, subjectText, createHandoff }) {
  const card = section(
    "Family card: what your child is learning",
    h("p", { class: "st-ll-muted" }, "A short note you can print or send home. It uses only the unit title, the standards the district seed lists, and notes written in the Studio lessons."),
    h("div", { class: "st-un-family", "data-testid": "family-card" }, h("p", {}, intro(unit, gradeText, subjectText)), standardsList(model.standards)),
  );
  const box = card.querySelector(".st-un-family");
  if (model.notes.length) {
    for (const n of model.notes) {
      const unverified = n.vocab.some((v) => !v.verified);
      box.append(
        h(
          "div",
          { class: "st-un-note" },
          h("h3", {}, `${langName(n.lang)} note`, " ", unverified ? chip("needs review", { tone: "review", title: "Some translations are not yet verified by a speaker." }) : null),
          h("p", { class: "st-ll-muted" }, `From the lesson "${n.lessonTitle}".`),
          n.objective ? h("p", { lang: n.lang }, n.objective) : null,
          n.vocab.length
            ? h("ul", { class: "st-ll-list", lang: n.lang }, n.vocab.map((v) => h("li", {}, `${v.en}: ${v.es}`, v.verified ? null : " (needs review)")))
            : null,
          n.familyPrompt ? h("p", { lang: n.lang }, h("strong", {}, "Try at home: "), n.familyPrompt) : null,
        ),
      );
    }
  } else {
    box.append(
      h(
        "div",
        { class: "st-un-note", "data-testid": "family-empty" },
        h("h3", {}, "No family note yet"),
        h("p", {}, "No Studio lesson for this unit has a home-language or family note. You can make one in the Resource Studio."),
        h("a", { class: "st-ll-btn", href: createHandoff }, "Make a family note in Create"),
      ),
    );
  }
  card.append(
    h(
      "div",
      { class: "st-ll-row" },
      btn("Print this card", () => printHtml(printable(unit, model, gradeText, subjectText)), { kind: "primary" }),
      h("a", { class: "st-ll-btn", href: createHandoff }, "Open in Create"),
    ),
    h("p", { class: "st-ll-muted" }, "Teacher review recommended before this goes home."),
  );
  return card;
}

function standardsList(standards) {
  return h(
    "ul",
    { class: "st-ll-list" },
    standards.map((s) => h("li", {}, h("strong", {}, s.code), s.text ? `: ${s.text}` : "")),
  );
}
