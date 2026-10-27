// The shelf side of the market: price tags, coin sets, receipts, rate tables and plan cards, drawn from the round's own
// numbers. Pure string builders; ui.js owns state and events. @fm2 FM-059
import { billSvg, coinSvg } from "../../art/money.js";
import { escapeHtml, L, tx } from "../../lang.js";
import { DENOM_NAMES, UI } from "./copy.js";
import { unitName } from "./items.js";
import { cent, money } from "./money.js";

const esc = escapeHtml;

function tagBody(tag, scene, lang) {
  const name = L(tag.name, lang);
  const price = scene.cents ? cent(tag.cents) : money(tag.cents);
  if (tag.total) return { title: L(tag.label, lang), sub: `${tag.qty} ${name} ${tx(UI.forPrice, lang)} ${money(tag.cents)}` };
  if (tag.each) return { title: `${tag.qty} × ${name}`, sub: `${money(tag.cents)} ${tx(UI.each, lang)}` };
  return { title: name, sub: price };
}

const pennyRow = (n) => `<span class="mm-pennies" aria-hidden="true">${Array.from({ length: n }, () => coinSvg(1, { size: 34 })).join("")}</span>`;

function tagsHtml(scene, state, lang, selectable, chosen) {
  const items = scene.tags.map((tag, i) => {
    const { title, sub } = tagBody(tag, scene, lang);
    const on = chosen(i);
    const inner = `<span class="mm-tag-title">${esc(title)}</span><span class="mm-tag-price">${esc(sub)}</span>${scene.pennies ? pennyRow(tag.cents) : ""}${selectable ? `<span class="mm-chip" ${on ? "" : "hidden"}>✓ ${esc(tx(UI.selected, lang))}</span>` : ""}`;
    return `<li>${selectable ? `<button type="button" class="mm-tag${on ? " is-on" : ""}" data-mm-tag="${i}" data-mm-key="tag-${i}" aria-pressed="${on}">${inner}</button>` : `<div class="mm-tag">${inner}</div>`}</li>`;
  });
  return `<ul class="mm-tags">${items.join("")}</ul>`;
}

function coinsHtml(scene, state, lang) {
  const items = scene.coins.map((cents, i) => {
    const on = state.marked.has(i);
    const art = cents >= 100 ? billSvg(cents, { size: 96 }) : coinSvg(cents, { size: 56 });
    return `<li><button type="button" class="mm-piece${on ? " is-on" : ""}" data-mm-mark="${i}" data-mm-key="mark-${i}" aria-pressed="${on}" aria-label="${esc(`${L(DENOM_NAMES[cents], lang)} ${i + 1}: ${tx(UI.mark, lang)}`)}">${art}${on ? '<span class="mm-tick" aria-hidden="true">✓</span>' : ""}</button></li>`;
  });
  return `<p class="mm-note">${esc(tx(UI.tapToCount, lang))}</p><ul class="mm-coins">${items.join("")}</ul>`;
}

function receiptHtml(scene, lang) {
  const rows = scene.lines.map((line) => {
    const value = line.cents !== undefined ? money(line.cents) : L(line.text, lang);
    return `<div class="mm-line"><dt>${esc(L(line.label, lang))}</dt><dd>${esc(value)}</dd></div>`;
  });
  return `<dl class="mm-receipt">${rows.join("")}</dl>`;
}

function tableHtml(scene, lang) {
  const cell = (value, isMoney) => (value === null ? `<td class="mm-unknown"><span aria-hidden="true">?</span><span class="fm2-sr">${esc(tx({ en: "unknown", es: "desconocido" }, lang))}</span></td>` : `<td>${esc(isMoney ? money(value) : String(value))}</td>`);
  const rows = scene.rows.map(([a, b]) => `<tr>${cell(a, false)}${cell(b, true)}</tr>`).join("");
  const head = scene.head.map((c) => `<th scope="col">${esc(L(c, lang))}</th>`).join("");
  return `<table class="mm-table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

function plansHtml(scene, state, lang, selectable) {
  const cards = scene.plans.map((plan, i) => {
    const on = state.pick === i;
    const body = `<span class="mm-tag-title">${esc(L(plan.label, lang))}</span><span class="mm-tag-price">${esc(tx(UI.fee, lang))}: ${esc(money(plan.fee))}</span><span class="mm-tag-price">${esc(money(plan.rate))} ${esc(tx(UI.perOne, lang))} ${esc(unitName(scene.unit, lang))}</span>${selectable ? `<span class="mm-chip" ${on ? "" : "hidden"}>✓ ${esc(tx(UI.selected, lang))}</span>` : ""}`;
    return `<li>${selectable ? `<button type="button" class="mm-tag${on ? " is-on" : ""}" data-mm-tag="${i}" data-mm-key="tag-${i}" aria-pressed="${on}">${body}</button>` : `<div class="mm-tag">${body}</div>`}</li>`;
  });
  return `<ul class="mm-tags">${cards.join("")}</ul>`;
}

export function sceneHtml(round, state, lang) {
  const scene = round.scene;
  const choose = round.kind === "pick" || round.kind === "pickEnter";
  if (round.kind === "cart") return tagsHtml(scene, state, lang, true, (i) => state.cart.includes(i));
  if (scene.type === "tags") return tagsHtml(scene, state, lang, choose, (i) => state.pick === i);
  if (scene.type === "plans") return plansHtml(scene, state, lang, choose);
  if (scene.type === "coins") return coinsHtml(scene, state, lang);
  if (scene.type === "receipt") return receiptHtml(scene, lang);
  if (scene.type === "table") return tableHtml(scene, lang);
  return "";
}
