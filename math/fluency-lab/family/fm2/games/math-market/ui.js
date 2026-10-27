// The register: mounts one round into the stage. Everything is a real button or input, so the keyboard path is the
// same as the touch path (Enter or Space presses a coin, Backspace takes the last piece back out). In-progress work
// lives in `state`, so a language switch re-renders the labels without losing the tray, cart, choice or typed text.
// @fm2 FM-017 FM-021 FM-040 FM-073
import { pieceSvg } from "../../art/money.js";
import { escapeHtml, L, tx } from "../../lang.js";
import { DENOM_NAMES, UI } from "./copy.js";
import { cartTotal } from "./logic.js";
import { money, sum } from "./money.js";
import { sceneHtml } from "./scene.js";

const esc = escapeHtml;
const AFFIX = { $: ["$", ""], c: ["", "¢"], "%": ["", "%"], "#": ["", ""] };
const SUBMIT = { pay: UI.pay, change: UI.giveChange, cart: UI.checkout, enter: UI.ring, pick: UI.choose, pickEnter: UI.choose };

export function mount(root, ctx) {
  const round = ctx.round;
  let lang = ctx.lang;
  let alive = true;
  const state = { tray: [], cart: [], pick: null, values: {}, marked: new Set(), message: "", done: false };
  const t = (copy, vars) => tx(copy, lang, vars);
  const locked = () => state.done || ctx.locked?.();
  const nameOf = (cents) => L(DENOM_NAMES[cents], lang);

  function screenHtml() {
    if (round.kind === "tray") {
      const total = sum(state.tray);
      const label = round.mode === "pay" ? UI.inTray : UI.change;
      return `<div class="mm-screen"><span class="mm-screen-label">${esc(t(label))}</span><output class="mm-screen-value" data-mm-total>${esc(money(total))}</output></div>`;
    }
    if (round.kind === "pick" || round.kind === "pickEnter") {
      const chosen = state.pick === null ? null : (round.scene.tags || round.scene.plans)[state.pick];
      const label = chosen ? L(chosen.label || chosen.name, lang) : t(UI.nothingYet);
      return `<div class="mm-screen"><span class="mm-screen-label">${esc(t(UI.choice))}</span><output class="mm-screen-value mm-screen-text" data-mm-total>${esc(label)}</output></div>`;
    }
    if (round.kind !== "cart") return "";
    const total = cartTotal(round, state.cart);
    const status = total > round.budget ? ["!", UI.tooMuch, "over"] : total < round.min ? ["•", UI.tooLittle, "low"] : ["✓", UI.fits, "ok"];
    const fill = Math.min(100, Math.floor((total * 100) / round.budget));
    return `<div class="mm-screen"><span class="mm-screen-label">${esc(t(UI.total))}</span><output class="mm-screen-value" data-mm-total>${esc(money(total))}</output>
      <div class="mm-meter" aria-hidden="true"><span class="mm-meter-fill mm-${status[2]}" style="width:${fill}%"></span></div>
      <p class="mm-screen-line"><span aria-hidden="true">${status[0]}</span> ${esc(t(status[1]))} · ${esc(t(UI.budget))} ${esc(money(round.budget))} · ${esc(t(UI.goal))} ${esc(money(round.min))}</p></div>`;
  }

  function trayHtml() {
    const dis = locked() ? "disabled" : "";
    const placed = state.tray.length
      ? state.tray.map((c, i) => `<li><button type="button" class="mm-placed" data-mm-out="${i}" data-mm-key="out-${i}" ${dis}><span class="fm2-sr">${esc(t(UI.removePiece))}: ${esc(nameOf(c))}</span>${pieceSvg(c, { size: 48 })}</button></li>`).join("")
      : `<li class="mm-empty">${esc(t(UI.trayEmpty))}</li>`;
    const keys = round.pool
      .map((c) => `<button type="button" class="mm-key" data-mm-add="${c}" data-mm-key="add-${c}" ${dis}><span class="fm2-sr">${esc(t(UI.addPiece))}: </span>${pieceSvg(c, { size: 60 })}<span class="mm-key-name">${esc(nameOf(c))}</span></button>`)
      .join("");
    return `<ul class="mm-tray" aria-label="${esc(t(round.mode === "pay" ? UI.tray : UI.change))}">${placed}</ul>
      <div class="mm-keys" role="group" aria-label="${esc(t({ en: "Coins and bills", es: "Monedas y billetes" }))}">${keys}</div>
      <div class="mm-row"><button type="button" class="fm2-btn" data-mm-undo data-mm-key="undo" ${dis}>${esc(t(UI.removeLast))}</button><button type="button" class="fm2-btn fm2-btn-quiet" data-mm-clear data-mm-key="clear" ${dis}>${esc(t(UI.clear))}</button></div>`;
  }

  function cartHtml() {
    const dis = locked() ? "disabled" : "";
    const rows = state.cart.length
      ? state.cart.map((i) => `<li><span>${esc(L(round.scene.tags[i].name, lang))} · ${esc(money(round.scene.tags[i].cents))}</span><button type="button" class="fm2-btn fm2-btn-quiet" data-mm-drop="${i}" data-mm-key="drop-${i}" ${dis}>${esc(t(UI.remove))}<span class="fm2-sr">: ${esc(L(round.scene.tags[i].name, lang))}</span></button></li>`).join("")
      : `<li class="mm-empty">${esc(t(UI.cartEmpty))}</li>`;
    return `<ul class="mm-cart" aria-label="${esc(t(UI.cart))}">${rows}</ul>`;
  }

  function fieldsHtml() {
    const dis = locked() ? "disabled" : "";
    return `<div class="mm-fields">${round.fields
      .map((f) => {
        const [pre, post] = AFFIX[f.unit];
        return `<div class="mm-field"><label for="mm-f-${f.key}">${esc(L(f.label, lang))}</label><div class="mm-input">${pre ? `<span class="mm-affix" aria-hidden="true">${pre}</span>` : ""}<input id="mm-f-${f.key}" type="text" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" data-mm-field="${f.key}" data-mm-key="field-${f.key}" value="${esc(state.values[f.key] || "")}" ${dis}>${post ? `<span class="mm-affix" aria-hidden="true">${post}</span>` : ""}</div></div>`;
      })
      .join("")}</div>`;
  }

  function render(focus) {
    const key = focus ?? document.activeElement?.dataset?.mmKey;
    const kind = round.kind;
    const control = kind === "tray" ? trayHtml() : kind === "cart" ? cartHtml() : "";
    const fields = kind === "enter" || kind === "pickEnter" ? fieldsHtml() : "";
    root.innerHTML = `<div class="mm" data-mm data-kind="${kind}">
      <section class="mm-shelf" aria-label="${esc(t(UI.shelf))}">${sceneHtml(round, state, lang)}</section>
      <section class="mm-register" aria-label="${esc(t(UI.register))}">${screenHtml()}${control}${fields}
        <p class="mm-msg" role="status" data-mm-msg>${esc(state.message)}</p>
        <button type="button" class="fm2-btn fm2-btn-primary mm-submit" data-mm-submit data-mm-key="submit" ${locked() ? "disabled" : ""}>${esc(t(SUBMIT[round.mode === "change" ? "change" : round.mode === "pay" ? "pay" : kind]))}</button>
      </section></div>`;
    if (key) root.querySelector(`[data-mm-key="${key}"]`)?.focus({ preventScroll: true });
  }

  function say(text) {
    ctx.announce?.(text);
  }

  function addPiece(cents) {
    state.tray.push(cents);
    state.message = "";
    render(`add-${cents}`);
    say(`${t({ en: "Added", es: "Agregaste" })}: ${nameOf(cents)}. ${t(UI.inTray)}: ${money(sum(state.tray))}.`);
  }

  function removePiece(index) {
    if (index < 0 || index >= state.tray.length) return;
    const [cents] = state.tray.splice(index, 1);
    state.message = "";
    render(state.tray.length ? `out-${Math.min(index, state.tray.length - 1)}` : "undo");
    say(`${t({ en: "Took out", es: "Quitaste" })}: ${nameOf(cents)}. ${t(UI.inTray)}: ${money(sum(state.tray))}.`);
  }

  function toggleCart(index) {
    const at = state.cart.indexOf(index);
    if (at >= 0) state.cart.splice(at, 1);
    else state.cart.push(index);
    state.message = "";
    render(`tag-${index}`);
    const verb = at >= 0 ? t({ en: "Removed", es: "Quitaste" }) : t({ en: "Added", es: "Agregaste" });
    say(`${verb}: ${L(round.scene.tags[index].name, lang)}. ${t(UI.total)}: ${money(cartTotal(round, state.cart))}.`);
  }

  function submit() {
    if (locked()) return;
    const needsPick = round.kind === "pick" || round.kind === "pickEnter";
    if (needsPick && state.pick === null) {
      state.message = t(UI.needPick);
      render("submit");
      return;
    }
    if ((round.kind === "enter" || round.kind === "pickEnter") && round.fields.some((f) => !(state.values[f.key] || "").trim())) {
      state.message = t(UI.needNumber);
      render(round.fields.find((f) => !(state.values[f.key] || "").trim()) && `field-${round.fields.find((f) => !(state.values[f.key] || "").trim()).key}`);
      return;
    }
    const response = { pick: state.pick, tray: [...state.tray], cart: [...state.cart], values: { ...state.values } };
    const result = ctx.submit(response);
    state.message = "";
    if (result.correct) state.done = true;
    render(result.correct ? undefined : "submit");
  }

  function onClick(event) {
    if (!alive || locked()) return;
    const hit = (selector) => event.target.closest(selector);
    const add = hit("[data-mm-add]");
    const out = hit("[data-mm-out]");
    const tag = hit("[data-mm-tag]");
    const mark = hit("[data-mm-mark]");
    const drop = hit("[data-mm-drop]");
    if (add) addPiece(Number(add.dataset.mmAdd));
    else if (out) removePiece(Number(out.dataset.mmOut));
    else if (hit("[data-mm-undo]")) removePiece(state.tray.length - 1);
    else if (hit("[data-mm-clear]")) {
      state.tray = [];
      render("add-" + round.pool[0]);
      say(t(UI.trayEmpty));
    } else if (tag) {
      const index = Number(tag.dataset.mmTag);
      if (round.kind === "cart") toggleCart(index);
      else {
        state.pick = index;
        state.message = "";
        render(`tag-${index}`);
      }
    } else if (mark) {
      const index = Number(mark.dataset.mmMark);
      if (!state.marked.delete(index)) state.marked.add(index);
      render(`mark-${index}`);
      say(`${state.marked.size} / ${round.scene.coins.length} ${t(UI.marked)}.`);
    } else if (drop) toggleCart(Number(drop.dataset.mmDrop));
    else if (hit("[data-mm-submit]")) submit();
  }

  function onInput(event) {
    const field = event.target.closest?.("[data-mm-field]");
    if (field) state.values[field.dataset.mmField] = field.value;
  }

  function onKeydown(event) {
    if (!alive || locked()) return;
    if (event.key === "Enter" && event.target.matches?.("[data-mm-field]")) {
      event.preventDefault();
      submit();
    } else if (event.key === "Backspace" && round.kind === "tray" && !event.target.matches?.("input")) {
      event.preventDefault();
      removePiece(state.tray.length - 1);
    }
  }

  root.addEventListener("click", onClick);
  root.addEventListener("input", onInput);
  root.addEventListener("keydown", onKeydown);
  render();
  // "Show me" ends the round from the shell; when its controls change, lock the register to match (driven by an event).
  const shell = root.closest?.("[data-fm2-shell]");
  const Observer = root.ownerDocument?.defaultView?.MutationObserver;
  const watcher =
    shell && Observer
      ? new Observer(() => {
          if (alive && !state.done && ctx.locked?.()) {
            state.done = true;
            render();
          }
        })
      : null;
  watcher?.observe(shell, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
  return {
    destroy() {
      alive = false;
      watcher?.disconnect();
      root.removeEventListener("click", onClick);
      root.removeEventListener("input", onInput);
      root.removeEventListener("keydown", onKeydown);
      root.innerHTML = "";
    },
    setLang(next) {
      lang = next;
      render();
    },
  };
}
