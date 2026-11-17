// "Part of a pathway" banner: any view a pathway stage opens can show it with pathwayBannerHTML(ctx).
// The stage link carries ?pw=<run key>&st=<stage id>; the banner reads the learner's own pathway store to say
// "Step 3 of 6 · goal: Explain an idea using evidence · Back to my pathway". It renders nothing when the page was
// not opened from a pathway, and it never marks anything done: completion comes from the feature's own record.
import { i18nFor } from "../i18n.js";
import { html, icon } from "../util.js";
import { loadRuns } from "./progress.js";

/** The pathway context of the current page: { run, n, total, stage } or null. */
export function pathwayContext(search = typeof location === "undefined" ? "" : location.search, read) {
  const q = new URLSearchParams(search || "");
  const key = q.get("pw");
  if (!key) return null;
  const run = loadRuns(read).runs[key];
  if (!run?.stages?.length) return null;
  const at = run.stages.findIndex((s) => s.id === q.get("st"));
  if (at < 0) return null;
  return { run, n: at + 1, total: run.stages.length, stage: run.stages[at] };
}

/** The banner markup ("" when this page is not a pathway stage). */
export function pathwayBannerHTML(ctx, search) {
  const at = pathwayContext(search);
  if (!at) return "";
  const I = i18nFor(ctx);
  const goal = at.run.title || ["", ""];
  return html`<aside class="pw-banner" aria-label="${I.S("Part of my pathway", "Parte de mi ruta")}">
    <p class="pw-banner-text">
      ${icon("road")}
      <strong>${I.T(`Step ${at.n} of ${at.total}`, `Paso ${at.n} de ${at.total}`)}</strong>
      <span>${I.T(`Goal: ${goal[0]}`, `Meta: ${goal[1]}`)}</span>
    </p>
    ${at.run.back ? html`<a class="btn small pw-banner-back" href="${at.run.back}">${I.T("Back to my pathway", "Volver a mi ruta")}</a>` : ""}
  </aside>`;
}
