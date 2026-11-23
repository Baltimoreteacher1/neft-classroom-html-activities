// Vocabulary Academy — custom unit builder (/vocabulary-academy/teacher/custom[?edit=<cu id>]). Teacher-only: index.js refuses
// the route on a non-teacher device and render() checks again. The screens are teacher/custom-screens.js and the events
// teacher/custom-events.js; validation, building and storage are teacher/custom.js (progress.custom through Core's store).
import { html } from "../../util.js";
import { vaHref } from "../data.js";
import { crumbs, rootCrumb } from "../ui.js";
import { CHANGES, CLICKS, INPUTS, customChange, customClick } from "../educator/custom-events.js";
import { customScreen, openForEdit } from "../educator/custom-screens.js";

export async function render(ctx, va) {
  const { I } = va;
  if (!va.teacher)
    return {
      title: I.S("For teachers", "Para docentes"),
      html: html`<section class="va-panel va-empty"><h1>${I.T("This page is for teachers", "Esta página es para docentes")}</h1></section>`,
    };
  openForEdit(va.route.q?.edit);
  return {
    title: I.S("Custom lesson builder", "Creador de lecciones personalizadas"),
    html: html`${crumbs(I, [rootCrumb(I), [I.S("Teacher dashboard", "Panel docente"), vaHref("teacher")], [I.S("Custom lesson builder", "Creador de lecciones"), ""]])}
      <header class="va-hero vat-hero"><div><p class="eyebrow">${I.T("For teachers", "Para docentes")}</p>
        <h1 id="vaTitle" tabindex="-1">${I.T("Custom lesson builder", "Creador de lecciones personalizadas")}</h1></div></header>
      ${await customScreen(I)}`,
  };
}

const actOf = (e) => e.target.closest?.("[data-vc]")?.dataset.vc || "";
export function onClick(e, ctx, va) {
  if (!CLICKS.has(actOf(e))) return false;
  customClick(e, ctx, va);
  return true;
}
export function onChange(e, ctx, va) {
  if (!CHANGES.has(actOf(e))) return false;
  customChange(e, ctx, va);
  return true;
}
export const onInput = (e, ctx, va) => (INPUTS.has(actOf(e)) ? onChange(e, ctx, va) : false);
