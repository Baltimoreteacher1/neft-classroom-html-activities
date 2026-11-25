// #/week : "My Week" planner. Teacher picks a unit, group counts, block length and days; the plan comes from
// /api/bcpss/week-plan (stateless: the URL holds every choice, so Copy link regenerates the same plan).
import { h } from "../../core/dom.js";
import { parseParams, shareHash } from "../../../../shared/planner/params.js";
import { ensureCss, getCatalog } from "../lens-ui.js";
import { buildForm } from "./form.js";
import { apiUrl } from "./model.js";
import { renderPlan } from "./plan-view.js";

const SHEET = new URL("./week.css", import.meta.url).href;

function ensureWeekCss() {
  ensureCss();
  if (document.querySelector("link[data-st-wk-css]")) return;
  document.head.append(h("link", { rel: "stylesheet", href: SHEET, "data-st-wk-css": "1" }));
}

async function fetchPlan(params) {
  const res = await fetch(apiUrl(params), { headers: { Accept: "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) throw new Error(body.error || `The planner answered ${res.status}.`);
  return body.plan;
}

export async function render({ root, params, shell }) {
  ensureWeekCss();
  const catalog = await getCatalog(shell);
  const parsed = params.unit ? parseParams((k) => params[k]) : null;
  const out = h("div", { class: "st-wk-out", "aria-live": "polite" });
  let token = 0;

  async function show(next) {
    const mine = ++token;
    out.replaceChildren(h("p", { class: "st-loading", role: "status" }, "Building your week"));
    try {
      const plan = await fetchPlan(next);
      if (mine === token) renderPlan(out, plan);
    } catch (err) {
      if (mine === token) out.replaceChildren(h("p", { class: "st-error", role: "alert" }, `${err.message} Check the choices above and try again.`));
    }
  }

  const form = buildForm({
    catalog,
    initial: parsed?.ok ? parsed.params : {},
    onSubmit(next) {
      const hash = shareHash(next);
      if (location.hash === hash) show(next);
      else location.hash = hash; // the router re-renders this view with the new choices
    },
  });
  if (parsed && !parsed.ok) form.errorsEl.textContent = parsed.errors.join(" ");

  root.replaceChildren(
    h(
      "section",
      { class: "st-wk" },
      h("h1", {}, "My Week"),
      h("p", { class: "st-hint" }, "Fit a unit into the minutes you have. The plan lists everything it dropped, and why. Paper and pencil only."),
      form.el,
      out,
    ),
  );
  if (parsed?.ok) show(parsed.params);
}
