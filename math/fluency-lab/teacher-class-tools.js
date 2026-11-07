// fl-teacher: the "Class tools" tab of the teacher studio. Each tool makes a link, a code or a printout; nothing is
// sent anywhere and nothing about a learner is stored here.
// - Fact plan for one learner (moby/fact-plan.js): operations and session length, shared as a link.
// Every other tool is its own module, mounted into its own slot below; the Copy buttons share one handler here.
import { t } from "./i18n.js";
import { PLAN_COUNTS, PLAN_OPS, factPlanUrl } from "./moby/fact-plan.js";
import { SYMBOL } from "./moby/fact-keys.js";
import { esc } from "./reports-export.js";
import { localQrMarkup } from "./school-tools.js";
import { mountPrintTool } from "./teacher-tool-print.js";
import { mountVideoTool } from "./teacher-tool-videos.js";
import { mountWarmupTool } from "./teacher-tool-warmups.js";

const OP_NAMES = () => ({
  add: t("Addition"),
  sub: t("Subtraction"),
  mul: t("Multiplication"),
  div: t("Division"),
});

function factPlanHtml(draft) {
  const names = OP_NAMES();
  const href = factPlanUrl(draft);
  const qr = href ? localQrMarkup(href, { label: t("Fact plan QR code"), size: 150 }) : null;
  return `<section class="t4-section" aria-labelledby="tt-plan-title"><h3 id="tt-plan-title">${esc(t("Fact plan for one learner"))}</h3>
    <p class="t4-hint">${esc(t("Choose the facts and how many problems a session has. Send the link to one learner; opening it saves the plan for the learner using that device. Their saved progress is not changed."))}</p>
    <form class="t4-form" data-tt-plan novalidate><fieldset class="t4-skills"><legend>${esc(t("Facts to practise"))}</legend>${PLAN_OPS.map((op) => `<label class="t4-check"><input type="checkbox" name="op" value="${op}" ${draft.ops.includes(op) ? "checked" : ""}><span>${esc(names[op])} (${SYMBOL[op]})</span></label>`).join("")}</fieldset>
      <label>${esc(t("Problems in a session"))}<select name="count">${PLAN_COUNTS.map((n) => `<option ${n === draft.count ? "selected" : ""}>${n}</option>`).join("")}</select></label></form>
    ${href ? `<label>${esc(t("Link for the learner"))}<span class="t4-copy"><input id="tt-plan-link" readonly value="${esc(href)}"><button type="button" class="fl-btn fl-btn--ghost" data-tt-copy="tt-plan-link">${esc(t("Copy"))}</button></span></label>${qr ? `<div class="fluency-local-qr">${qr}</div>` : ""}` : `<p class="t4-hint">${esc(t("Choose at least one kind of fact."))}</p>`}</section>`;
}

function mountFactPlan(host, { announce }) {
  const state = { plan: { ops: ["mul", "div"], count: 10 } };
  const render = () => {
    host.innerHTML = factPlanHtml(state.plan);
  };
  host.addEventListener("change", (event) => {
    const form = event.target.closest("[data-tt-plan]");
    if (!form) return;
    const data = new FormData(form);
    state.plan = { ops: data.getAll("op").map(String), count: Number(data.get("count")) || 10 };
    render();
    host
      .querySelector(
        `[name=${event.target.name}]${event.target.value ? `[value="${event.target.value}"]` : ""}`,
      )
      ?.focus();
  });
  render();
  return { refresh: render };
}

const TOOLS = [mountFactPlan, mountWarmupTool, mountPrintTool, mountVideoTool];

export function mountClassTools(host, ctx = {}) {
  host.innerHTML = TOOLS.map((_, index) => `<div data-tt-slot="${index}"></div>`).join("");
  const mounted = TOOLS.map((mount, index) => mount(host.querySelector(`[data-tt-slot="${index}"]`), ctx));
  host.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-tt-copy]");
    if (!button) return;
    const input = host.querySelector(`#${button.dataset.ttCopy}`);
    try {
      await navigator.clipboard.writeText(input.value);
      ctx.announce?.(t("Copied."));
    } catch {
      input.select();
      ctx.announce?.(t("Select the text and copy it."));
    }
  });
  return { refresh: () => mounted.forEach((tool) => tool?.refresh?.()) };
}
