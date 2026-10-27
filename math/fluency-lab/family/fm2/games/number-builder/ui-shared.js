// Shared interface pieces for the three Number Builder workspaces: the rules list, the check / keep flow for
// "make two different builds", the kept-builds panel, and locking when a round ends. @fm2 FM-007 FM-038 FM-039
import { escapeHtml } from "../../lang.js";
import { t } from "./copy.js";
import { recipe } from "./copy-recipe.js";
import { ruleText, waysText } from "./copy-text.js";
import { evaluate, liveRules } from "./logic.js";

export const esc = escapeHtml;

// The rules list: each rule says whether it is met right now, in words and a symbol (never colour alone).
export function rulesHtml(round, build, kept, lang) {
  const items = liveRules(round, build).map(
    ({ c, ok, have }) =>
      `<li class="nb-rule" data-met="${ok}"><span class="nb-rule-mark" aria-hidden="true">${ok ? "✓" : "○"}</span><span>${esc(ruleText(round, c, lang))}.</span> <span class="nb-rule-state">${esc(ok ? t("ruleMet", lang) : t("ruleOpen", lang))}, ${esc(t("have", lang, { n: have }))}</span></li>`,
  );
  if (round.ways === 2)
    items.unshift(
      `<li class="nb-rule" data-met="${kept.length === 2}"><span class="nb-rule-mark" aria-hidden="true">○</span><span>${esc(waysText(lang))}.</span> <span class="nb-rule-state">${esc(`${kept.length} / 2`)}</span></li>`,
    );
  return items.length
    ? `<h3 class="nb-h">${esc(t("rules", lang))}</h3><ul class="nb-rule-list">${items.join("")}</ul>`
    : "";
}

export function keptHtml(round, kept, lang) {
  if (!kept.length) return "";
  const rows = kept
    .map(
      (b, i) =>
        `<li><strong>${esc(t("keptTitle", lang, { n: i + 1 }))}:</strong> <span>${esc(recipe(round, b, lang))}</span> <button type="button" class="fm2-btn nb-edit" data-edit="${i}">${esc(t("change", lang, { n: i + 1 }))}</button></li>`,
    )
    .join("");
  return `<h3 class="nb-h">${esc(t("buildsHeading", lang))}</h3><ol class="nb-kept-list">${rows}</ol>`;
}

// `api` supplies the workspace: build() -> current build, load(build), blank() -> empty build, refresh().
export function createFlow(ctx, api) {
  const round = ctx.round;
  let kept = [];
  const labelFor = (lang) =>
    round.ways === 1
      ? t("check", lang)
      : kept.length === 0
        ? t("keep", lang, { n: 1 })
        : t("checkBoth", lang);
  return {
    get kept() {
      return kept;
    },
    label: labelFor,
    press(lang) {
      if (ctx.locked()) return;
      const current = api.build();
      if (round.ways === 1) {
        ctx.submit({ builds: [current] });
      } else if (kept.length === 0) {
        if (evaluate(round, current).ok) {
          kept = [current];
          api.load(api.blank());
          api.refresh();
          ctx.announce(t("kept", lang, { n: 1 }));
        } else ctx.submit({ builds: [current] });
      } else {
        ctx.submit({ builds: [kept[0], current] });
      }
    },
    edit(index) {
      if (ctx.locked() || !kept[index]) return;
      api.load(kept[index]);
      kept = [];
      api.refresh();
    },
  };
}

// Disable every control once the shell says the round is over; the shell's own button then takes focus.
export function lockWhenDone(root, ctx) {
  const shell = root.closest("[data-fm2-shell]") || root;
  const sync = () => {
    const done = ctx.locked();
    root.querySelectorAll("button").forEach((b) => {
      if (done) b.setAttribute("disabled", "");
      else b.removeAttribute("disabled");
    });
    root.classList.toggle("nb-done", done);
  };
  shell.addEventListener("click", sync);
  return { sync, destroy: () => shell.removeEventListener("click", sync) };
}

export function restoreFocus(root, selector) {
  if (!selector) return;
  const target = root.querySelector(selector);
  if (target) target.focus({ preventScroll: true });
}

export const focusKey = (root) => {
  const active = document.activeElement;
  if (!active || !root.contains(active)) return null;
  for (const attr of [
    "data-add",
    "data-sub",
    "data-slot",
    "data-tile",
    "data-up",
    "data-down",
    "data-exp",
    "data-act",
    "data-edit",
  ]) {
    if (active.hasAttribute(attr)) return `[${attr}="${active.getAttribute(attr)}"]`;
  }
  return null;
};

export const actionsHtml = (lang, flow) =>
  `<div class="nb-actions"><button type="button" class="fm2-btn" data-act="undo">${esc(t("undo", lang))}</button><button type="button" class="fm2-btn" data-act="clear">${esc(t("clear", lang))}</button><button type="button" class="fm2-btn fm2-btn-primary" data-act="check">${esc(flow.label(lang))}</button></div>`;
