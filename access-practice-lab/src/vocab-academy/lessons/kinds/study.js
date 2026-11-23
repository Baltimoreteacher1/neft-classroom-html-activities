// Lesson D: word parts and families. A plain table of the unit's parts (prefix, suffix, root) with examples, then
// questions about the parts. Only parts the unit's own data names are shown; nothing is invented here.
import { html } from "../../../util.js";
import * as itemsKind from "./items.js";

const TYPE = { prefix: ["prefix", "prefijo"], suffix: ["suffix", "sufijo"], root: ["root", "raíz"], base: ["base word", "palabra base"], compound: ["compound", "compuesta"] };

export function htmlOf(S, step) {
  const { I } = S;
  const parts = step.parts || [];
  const fromWords = parts.length ? [] : S.unit.words.filter((w) => (w.morph?.segs || []).length > 1).slice(0, 5);
  return html`<div class="val-study">
    ${parts.length
      ? html`<table class="val-table"><caption>${I.T("Word parts in this lesson", "Partes de palabras en esta lección")}</caption>
          <thead><tr><th scope="col">${I.T("Part", "Parte")}</th><th scope="col">${I.T("Kind", "Tipo")}</th><th scope="col">${I.T("Meaning", "Significado")}</th><th scope="col">${I.T("Words", "Palabras")}</th></tr></thead>
          <tbody>${parts.map((p) => html`<tr><th scope="row" lang="en">${p.p}</th><td>${TYPE[p.type] ? I.T(...TYPE[p.type]) : p.type}</td><td lang="en">${p.m}</td><td lang="en">${(p.ex || []).join(", ")}</td></tr>`)}</tbody></table>`
      : html`<ul class="val-parts">${fromWords.map((w) => html`<li><strong lang="en">${w.hw}</strong> = <span lang="en">${w.morph.segs.map((s) => `${s.s} (${s.m})`).join(" + ")}</span></li>`)}</ul>`}
    ${itemsKind.htmlOf(S, step)}
  </div>`;
}

export const mount = itemsKind.mount;
