// Shared interface plumbing for the Fraction Kitchen widgets: a tiny state -> html renderer with event delegation,
// undo history, focus that survives re-rendering, language switching and keyboard steppers. @fm2 FM-040 FM-021
import { escapeHtml, L, tx } from "../../lang.js";
import { UI } from "./ui-copy.js";

export const u = (key, lang, vars) => tx(UI[key], lang, vars);
export const esc = escapeHtml;

// A labelled +/- stepper. The value is a spinbutton, so arrow keys work when it is focused (see mountWidget).
export function stepper({ fk, label, value, text, min, max, step = "", big = false, attrs = "", visibleLabel = false, lang }) {
  const dec = value <= min;
  const inc = value >= max;
  const btn = (dir, glyph, name, off, extra = "") =>
    `<button type="button" class="fm2-btn fk-step-btn" data-act="${step}" data-dir="${dir}" data-v="${dir.includes("down") ? -1 : 1}" ${extra} ${attrs} data-fk="${fk}-${dir}" aria-label="${esc(name)}" ${off ? "disabled" : ""}>${glyph}</button>`;
  const caption = visibleLabel ? `<span class="fk-step-label" aria-hidden="true">${esc(label)}</span>` : "";
  return `<div class="fk-stepper${visibleLabel ? " fk-stepper-labelled" : ""}" role="group" aria-label="${esc(label)}">${caption}
    ${big ? btn("bigdown", u("bigDownText", lang), u("stepBigDown", lang), dec, 'data-big="1"') : ""}
    ${btn("down", "−", u("stepDown", lang, { name: label }), dec)}
    <div class="fk-spin" role="spinbutton" tabindex="0" data-fk="${fk}" aria-label="${esc(label)}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${value}" aria-valuetext="${esc(text)}">${esc(text)}</div>
    ${btn("up", "+", u("stepUp", lang, { name: label }), inc)}
    ${big ? btn("bigup", u("bigUpText", lang), u("stepBigUp", lang), inc, 'data-big="1"') : ""}
  </div>`;
}

export const button = ({
  act,
  label,
  fk,
  v = "",
  i = "",
  cls = "",
  pressed = null,
  disabled = false,
  aria = "",
}) =>
  `<button type="button" class="fm2-btn ${cls}" data-act="${act}" ${v !== "" ? `data-v="${esc(v)}"` : ""} ${i !== "" ? `data-i="${i}"` : ""} data-fk="${fk}" ${pressed === null ? "" : `aria-pressed="${pressed}"`} ${aria ? `aria-label="${esc(aria)}"` : ""} ${disabled ? "disabled" : ""}>${label}</button>`;

// widget: { init(round), view({state, round, lang, locked}) -> html, act(state, name, data, round) -> {state, say?, quiet?} | null,
//           response(state, round) }. `say` is {en, es} (announced) and `quiet` skips undo history.
export function mountWidget(root, ctx, widget) {
  let lang = ctx.lang;
  let state = widget.init(ctx.round);
  const history = [];
  root.innerHTML = '<div class="fk"></div>';
  const host = root.firstElementChild;
  const locked = () => ctx.locked?.() ?? false;

  function render() {
    const active = document.activeElement;
    const key = active && host.contains(active) ? active.dataset.fk : null;
    host.innerHTML = widget.view({
      state,
      round: ctx.round,
      lang,
      locked: locked(),
      canUndo: history.length > 0,
    });
    for (const tools of host.querySelectorAll(".fk-tools")) tools.toggleAttribute("inert", locked());
    if (key) {
      const target = host.querySelector(`[data-fk="${CSS.escape(key)}"]`);
      const fallback = target?.closest(".fk-stepper")?.querySelector(".fk-spin");
      (target && !target.disabled ? target : fallback)?.focus({ preventScroll: true });
    }
  }

  function apply(name, data) {
    if (name === "undo") {
      const previous = history.pop();
      if (previous) state = JSON.parse(previous);
      render();
      ctx.announce(L(UI.undone, lang));
      return;
    }
    if (name === "submit") {
      ctx.submit(widget.response(state, ctx.round));
      render();
      return;
    }
    const result = widget.act(state, name, data, ctx.round);
    if (!result) return;
    if (!result.quiet) history.push(JSON.stringify(state));
    state = result.state;
    render();
    if (result.say) ctx.announce(L(result.say, lang));
  }

  const onClick = (event) => {
    const el = event.target.closest("[data-act]");
    if (!el || !host.contains(el) || el.disabled || locked()) return;
    apply(el.dataset.act, { ...el.dataset });
  };
  const onKey = (event) => {
    const spin = event.target.closest?.(".fk-spin");
    if (!spin || !host.contains(spin) || locked()) return;
    const group = spin.closest(".fk-stepper");
    const dir = {
      ArrowUp: "up",
      ArrowRight: "up",
      ArrowDown: "down",
      ArrowLeft: "down",
      PageUp: "bigup",
      PageDown: "bigdown",
    }[event.key];
    const target = dir && group.querySelector(`[data-dir="${dir}"]`);
    if (!target) return;
    event.preventDefault();
    if (!target.disabled) target.click();
  };
  host.addEventListener("click", onClick);
  host.addEventListener("keydown", onKey);
  render();
  return {
    destroy() {
      host.removeEventListener("click", onClick);
      host.removeEventListener("keydown", onKey);
      root.innerHTML = "";
    },
    setLang(next) {
      lang = next;
      render();
    },
  };
}
