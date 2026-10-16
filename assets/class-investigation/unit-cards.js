// Our Class Investigation — the toolbox: what each unit adds.
//
// Five cards, in district pacing order, all drawing on the SAME class data:
//   Unit 3  a ratio of two measurements from one dot, then the rate for 1
//   Unit 4  the percent of the class in a category
//   Unit 7  read an ordered pair off the scatter plot; plot class points yourself
//   Unit 9  does one measurement go up with the other? predict from the dots
//   Unit 2  center, spread and shape of the whole dataset (taught last)
//
// Each tool freezes a snapshot of the data when it opens, so numbers do not shift
// under a student mid-problem; a banner offers the newest data. A card whose data
// cannot feed it says why, in plain words, instead of showing a dead button.

import { h } from "./dom.js";
import { pick, tr } from "./i18n.js";
import { availableHooks, UNIT_HOOKS } from "./templates.js";
import { MIN_DOTS, NEED_KEY } from "./tool-kit.js";
import { toolCoordinates, toolRatio, toolRelationship } from "./tools-pairs.js";
import { toolPercent, toolStatistics } from "./tools-single.js";

const TOOLS = {
  u3: toolRatio,
  u4: toolPercent,
  u7: toolCoordinates,
  u9: toolRelationship,
  u2: toolStatistics,
};

/**
 * @param {object} ctx
 * @param {"en"|"es"} ctx.lang
 * @param {import("./templates.js").Field[]} ctx.fields
 * @param {() => { id: string, v: object, mine: boolean }[]} ctx.entries
 * @param {() => Promise<object|null>} ctx.engine  the existing builders, or null
 */
export function buildToolbox(ctx) {
  const { lang } = ctx;
  const hooks = availableHooks(ctx.fields);
  let openId = null;
  let snapshot = [];
  const state = {};
  const root = h("section", { class: "ci-card", "aria-labelledby": "ci-toolbox-title" });

  function card(hook) {
    const have = ctx.entries().filter((e) => Object.keys(e.v).length).length;
    const usable = hooks[hook.id];
    const enough = have >= MIN_DOTS[hook.id];
    const isOpen = openId === hook.id;
    const body = h("div", { class: "ci-toolbody" });
    const rerenderBody = () => {
      body.replaceChildren(TOOLS[hook.id](ctx, snapshot, (state[hook.id] ??= {}), rerenderBody));
    };
    if (isOpen) {
      rerenderBody();
      const live = ctx.entries().length;
      if (live !== snapshot.length) {
        body.prepend(
          h("button", {
            type: "button",
            class: "ci-btn ci-btn-quiet",
            text: `${tr("refresh", lang)} (${live})`,
            onclick: () => {
              snapshot = ctx.entries();
              render();
            },
          }),
        );
      }
    }
    let action;
    if (!usable) action = h("p", { class: "ci-note", text: tr(NEED_KEY[hook.id], lang) });
    else if (!enough) {
      const need = hook.id === "u2" ? "u2_needMore" : "needMore";
      action = h("p", { class: "ci-note", text: tr(need, lang, { n: MIN_DOTS[hook.id], have }) });
    } else {
      action = h("button", {
        type: "button",
        class: "ci-btn",
        "aria-expanded": String(isOpen),
        "aria-controls": `ci-tool-${hook.id}`,
        text: tr(isOpen ? "closeTool" : "openTool", lang),
        onclick: () => {
          openId = isOpen ? null : hook.id;
          snapshot = ctx.entries();
          render();
          if (openId) root.querySelector(`#ci-tool-${hook.id} :is(button, select, input)`)?.focus();
        },
      });
    }
    return h(
      "article",
      { class: `ci-tool${usable && enough ? "" : " ci-tool-off"}`, id: `ci-tool-${hook.id}` },
      h("p", { class: "ci-unit-tag" }, [
        tr("unitTag", lang, { n: hook.unit }),
        hook.id === "u2" ? ` · ${tr("taughtLast", lang)}` : "",
      ]),
      h("h4", { text: pick(hook.name, lang) }),
      h("p", { text: tr(`tool_${hook.id}_desc`, lang) }),
      action,
      isOpen ? body : null,
    );
  }

  function render() {
    root.replaceChildren(
      h("h3", { id: "ci-toolbox-title", text: tr("toolboxTitle", lang) }),
      h("p", { class: "ci-small", text: tr("toolboxHelp", lang) }),
      h("div", { class: "ci-tools" }, UNIT_HOOKS.map(card)),
    );
  }
  render();

  return {
    el: root,
    /** Data or language changed: redraw the card statuses without losing the open tool. */
    refresh() {
      if (openId) {
        const banner = root.querySelector(`#ci-tool-${openId} .ci-toolbody > button`);
        const live = ctx.entries().length;
        if (!banner && live !== snapshot.length) render();
        return;
      }
      render();
    },
  };
}
