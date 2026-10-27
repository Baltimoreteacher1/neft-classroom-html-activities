// Family Math Duel: HTML for each part of the table, built from the round and the controller's state. Pure string
// builders (no events, no timers): the controller re-renders from state, so a language switch keeps all the work.
// @fm2 FM-016 FM-027 FM-038 FM-039 FM-021
import { backCard, cardArt, scorePips } from "../../art/cards.js";
import { escapeHtml, L } from "../../lang.js";
import { say, UI, ui } from "./copy.js";
import { layoutParts, slotKinds } from "./templates.js";

const esc = escapeHtml;
const KIND_KEY = { num: "kindNum", exp: "kindExp", op: "kindOp" };

export const namesFor = (mode, lang) =>
  mode === "together"
    ? [ui("learner", lang), ui("caregiver", lang)]
    : [ui("you", lang), ui("orbit", lang)];

export function cardText(card, lang) {
  if (card.kind === "op") return ui("cardOp", lang, { text: L(UI.opNames[card.op], lang) });
  return ui(card.kind === "exp" ? "cardExp" : "cardNum", lang, { text: card.text });
}

function cardFace(card, round) {
  return cardArt({ ...card, pips: round.pips, small: card.v && card.v.d === 1 ? card.v.n : null });
}

// ---- scoreboard ------------------------------------------------------------------------------------------------------
export function scoreboard(S, D, lang) {
  const chips = [0, 1].map((seat) => {
    const turn = D.active === seat && !S.locked && D.phase === "draft";
    const note = turn ? say("turnOf", lang, seat, D.mode, { name: D.names[seat] }) : "";
    return `<div class="fd-seat" data-seat="${seat}" ${turn ? 'aria-current="true"' : ""} data-active="${turn}">
      <span class="fd-name">${esc(D.names[seat])}</span>
      <span class="fd-score">${esc(ui("points", lang, { n: D.points[seat] }))}</span>
      ${scorePips(D.points[seat])}
      <span class="fd-turn">${esc(note)}</span></div>`;
  });
  return `<div class="fd-scores" role="group" aria-label="${esc(ui("scores", lang))}">${chips.join("")}</div>`;
}

export function goalCard(S, D, lang, round, mode) {
  const rule = ui(round.variant === "private" ? "privateRule" : "openRule", lang);
  const fairCard = round.cards[round.fair.card];
  const fairBlock =
    mode === "together"
      ? `<label class="fd-fair"><input type="checkbox" data-fair ${S.fair ? "checked" : ""} ${D.fairLocked ? "disabled" : ""}> <span>${esc(ui("fairLabel", lang))}</span></label>
      <p class="fd-note">${esc(S.fair ? ui("fairOn", lang, { card: fairCard.text }) : ui("fairNote", lang))}</p>`
      : "";
  return `<section class="fd-goal" aria-label="${esc(ui("goal", lang))}"><h3>${esc(ui("goal", lang))}</h3>
    <p class="fd-goal-text">${esc(D.goalText)}</p><p class="fd-note">${esc(rule)}</p>${fairBlock}</section>`;
}

// ---- cards on the table or in a hand ----------------------------------------------------------------------------------
export function tableCards(S, D, lang, round) {
  const seat = D.active;
  const private_ = round.variant === "private";
  const ids = private_ ? round.deal[seat] : round.pool;
  const title = private_ ? ui("hand", lang, { name: D.names[seat] }) : ui("table", lang);
  const items = ids.map((id) => {
    const card = round.cards[id];
    const holder = D.state.usedBy.findIndex((set) => set.has(id));
    const taken = private_ ? D.state.usedBy[seat].has(id) : holder >= 0;
    const held = S.held === id;
    const base = cardText(card, lang);
    const label = held
      ? ui("cardHeld", lang, { card: base })
      : taken
        ? ui("cardTaken", lang, { card: base, name: D.names[private_ ? seat : holder] })
        : base;
    return `<button type="button" class="fd-card" data-card="${id}" data-nav data-fk="card-${id}" data-kind="${card.kind}" ${taken ? 'data-taken="true"' : ""} aria-pressed="${held}" aria-label="${esc(label)}" ${S.locked ? "disabled" : ""}>${cardFace(card, round)}${taken ? `<span class="fd-tag">${esc(D.names[private_ ? seat : holder])}</span>` : ""}</button>`;
  });
  return `<section class="fd-table" aria-label="${esc(title)}"><h3>${esc(title)}</h3><div class="fd-cards" role="group" aria-label="${esc(title)}" data-group="cards">${items.join("")}</div></section>`;
}

export function hiddenHand(S, D, lang, round, seat) {
  const count = round.deal[seat].length;
  return `<section class="fd-table fd-table-hidden"><h3>${esc(ui("hand", lang, { name: D.names[seat] }))}</h3><div class="fd-cards" aria-hidden="true">${Array.from({ length: count }, () => `<span class="fd-card fd-card-back">${backCard()}</span>`).join("")}</div><p class="fd-note">${esc(ui("handHidden", lang, { name: D.names[seat] }))}</p></section>`;
}

// ---- expression boards --------------------------------------------------------------------------------------------------
function slotHtml(S, D, lang, round, seat, slot, interactive) {
  const kinds = slotKinds(round.tpl);
  const total = kinds.length;
  const name = D.names[seat];
  const hide = D.hidden[seat];
  const cardId = D.state.seats[seat][slot];
  const locked = D.lockSlot === slot && seat === 1 && S.fair;
  if (hide) return `<span class="fd-slot fd-slot-back" aria-hidden="true">${backCard()}</span>`;
  if (cardId === null) {
    const kind = ui(KIND_KEY[kinds[slot]], lang);
    const label = ui("slotEmpty", lang, { name, n: slot + 1, total, kind });
    const mark = kinds[slot] === "exp" ? "^" : kinds[slot] === "op" ? "?" : "";
    return interactive
      ? `<button type="button" class="fd-slot" data-slot="${slot}" data-seat="${seat}" data-nav data-fk="slot-${seat}-${slot}" data-kind="${kinds[slot]}" aria-label="${esc(label)}" ${S.locked ? "disabled" : ""}><span aria-hidden="true">${mark}</span></button>`
      : `<span class="fd-slot fd-slot-empty" role="img" aria-label="${esc(label)}"><span aria-hidden="true">${mark}</span></span>`;
  }
  const card = round.cards[cardId];
  const label = ui(locked ? "slotLocked" : "slotFull", lang, {
    name,
    n: slot + 1,
    total,
    card: cardText(card, lang),
  });
  const lock = locked
    ? `<span class="fd-lock" aria-hidden="true">${esc(ui("locked", lang))}</span>`
    : "";
  const takeBack = interactive && !locked;
  return takeBack
    ? `<button type="button" class="fd-slot fd-slot-full" data-slot="${slot}" data-seat="${seat}" data-nav data-fk="slot-${seat}-${slot}" aria-label="${esc(label)}" ${S.locked ? "disabled" : ""}>${cardFace(card, round)}</button>`
    : `<span class="fd-slot fd-slot-full" role="img" aria-label="${esc(label)}">${cardFace(card, round)}${lock}</span>`;
}

export function board(S, D, lang, round, seat) {
  const interactive =
    D.phase === "draft" &&
    D.active === seat &&
    !S.locked &&
    (D.together || seat === 0);
  const parts = layoutParts(round.tpl, lang)
    .map((p) =>
      p.text !== undefined
        ? `<span class="fd-op">${esc(p.text)}</span>`
        : slotHtml(S, D, lang, round, seat, p.slot, interactive),
    )
    .join("");
  const claim = D.claimShown[seat];
  const title = ui("board", lang, { name: D.names[seat] });
  return `<section class="fd-board" data-seat="${seat}" aria-label="${esc(title)}"><h3>${esc(D.names[seat])}</h3>
    <div class="fd-expr" role="group" aria-label="${esc(title)}" data-group="slots-${seat}">${parts}</div>
    ${claim ? `<p class="fd-claim-line">${esc(claim)}</p>` : ""}</section>`;
}

// ---- phase panels ---------------------------------------------------------------------------------------------------------
const field = (
  id,
  labelText,
  helpText,
  value,
  inputmode,
) => `<label for="${id}">${esc(labelText)}</label><p class="fd-note" id="${id}-help">${esc(helpText)}</p>
  <input id="${id}" class="fd-input" type="text" inputmode="${inputmode}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="${id}-help" data-fk="${id}" value="${esc(value)}">`;

export function panel(S, D, lang, round) {
  const t = (key, vars) => esc(ui(key, lang, vars));
  const [n0, n1] = D.names;
  const inputmode = D.numeric ? "numeric" : "text";
  const help = ui("claimHelp", lang);
  if (S.locked && D.phase !== "done") return `<p class="fd-ask">${t("ended")}</p>`;
  switch (D.phase) {
    case "draft": {
      if (round.variant === "private") {
        const seat = D.active;
        const ready = D.state.seats[seat].every((c) => c !== null);
        return `<p class="fd-ask">${t("buildAsk", { name: D.names[seat] })}</p>${ready ? "" : `<p class="fd-note">${t("lockNeed")}</p>`}<div class="fd-actions"><button type="button" class="fm2-btn fm2-btn-primary" data-act="lock" data-fk="lock" ${ready ? "" : "disabled"}>${t("lockIn")}</button><button type="button" class="fm2-btn" data-act="undo" ${D.canUndo ? "" : "disabled"}>${t("undo")}</button></div>`;
      }
      const ask =
        S.held === null
          ? t("pickAsk", { name: D.names[D.active] })
          : t("placeAsk", { name: D.names[D.active], card: cardText(round.cards[S.held], lang) });
      return `<p class="fd-ask">${ask}</p><div class="fd-actions"><button type="button" class="fm2-btn" data-act="undo" ${D.canUndo ? "" : "disabled"}>${t("undo")}</button></div>`;
    }
    case "claim0":
      return `<form class="fd-form" data-form="claim0"><p class="fd-ask">${t("claimAsk", { name: n0 })}</p>${field("fd-in-claim0", ui("claimLabel", lang, { name: n0 }), help, S.input.claim0, inputmode)}<button type="submit" class="fm2-btn fm2-btn-primary">${t("claimBtn")}</button></form>`;
    case "theirs":
      return `<p class="fd-ask">${t("theirsAsk", { name: n1 })}</p><div class="fd-actions"><button type="button" class="fm2-btn" data-act="theirs-yes" data-fk="theirs-yes">${t("theirsYes")}</button><button type="button" class="fm2-btn" data-act="theirs-no">${t("theirsNo")}</button></div>`;
    case "claim1":
      return `<form class="fd-form" data-form="claim1"><p class="fd-ask">${t("claimAsk", { name: n1 })}</p>${field("fd-in-claim1", ui("claimLabel", lang, { name: n1 }), help, S.input.claim1, inputmode)}${S.notice === "unreadable1" ? `<p class="fd-warn" role="alert">${t("badNumber")}</p>` : ""}<button type="submit" class="fm2-btn fm2-btn-primary">${t("claimBtn")}</button></form>`;
    case "call":
      return `<p class="fd-ask">${t("callAsk", { name: n1, value: S.claims[1] })}</p><div class="fd-actions"><button type="button" class="fm2-btn fm2-btn-primary" data-act="agree" data-fk="agree">${t("agree")}</button><button type="button" class="fm2-btn" data-act="challenge" aria-expanded="${S.challengeOpen}">${t("challenge")}</button></div>${S.challengeOpen ? `<form class="fd-form" data-form="counter">${field("fd-in-counter", ui("counterLabel", lang), help, S.input.counter, inputmode)}<button type="submit" class="fm2-btn fm2-btn-primary">${t("counterBtn")}</button></form>` : ""}`;
    case "verdict":
      return `<p class="fd-ask">${t("verdictAsk")}</p><div class="fd-actions"><button type="button" class="fm2-btn" data-verdict="0" data-fk="verdict-0">${esc(say("wins", lang, 0, D.mode, { name: n0 }))}</button><button type="button" class="fm2-btn" data-verdict="1">${t("wins", { name: n1 })}</button><button type="button" class="fm2-btn" data-verdict="2">${t("tie")}</button></div>`;
    default:
      return D.result ? result(D, lang) : "";
  }
}

function result(D, lang) {
  const lines = D.result.map((line) => `<li>${esc(line)}</li>`).join("");
  return `<div class="fd-result" data-testid="duel-result"><h3>${esc(ui("overTitle", lang))}</h3><ul>${lines}</ul></div>`;
}

export function handover(S, D, lang, round) {
  const name = D.names[S.handTo];
  return `<section class="fd-handover" data-testid="handover"><h3>${esc(ui("handTo", lang, { name }))}</h3><p>${esc(ui("handToSub", lang, { name }))}</p>
    <button type="button" class="fm2-btn fm2-btn-primary" data-act="handover-ok" data-fk="handover-ok">${esc(ui("handBtn", lang, { name }))}</button></section>`;
}

