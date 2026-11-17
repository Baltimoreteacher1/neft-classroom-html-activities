// The kit's buttons, shared by the last tour screen and the returning-family home: start, download, print, copy, save.
// The tour's finish screen draws its own Start button above them, so it asks for the others only (`start: false`).
import { t } from "./i18n.js";
import { esc, icon } from "./util.js";

export function actionsHTML(k, { saved = false, storage = true, start = true } = {}) {
  return `<div class="kit-actions">
    ${start ? `<a class="btn-primary btn-big" href="${esc(k.first.url)}" data-launch>${esc(t("kit.start"))}</a>` : ""}
    <div class="secondary">
      <button type="button" class="btn-quiet" data-act="choose-another">${esc(t("kit.chooseAnother"))}</button>
      <button type="button" class="btn-quiet" data-act="copy-link">${esc(t("kit.copy"))}</button>
      <a class="btn-quiet" href="/access-practice-lab/family">${esc(t("kit.returnFamilyHome"))}</a>
      <button type="button" class="btn-quiet" data-act="download">${esc(t("kit.download"))}</button>
      <button type="button" class="btn-quiet" data-act="print-card">${esc(t("kit.print"))}</button>
      <button type="button" class="btn-quiet" data-act="save-plan">${esc(t("kit.save"))}</button>
    </div>
    <p class="fine status" id="action-status" role="status" aria-live="polite">${saved ? esc(t(storage ? "kit.saved" : "kit.saveFailed")) : ""}</p>
    <p class="fine">${esc(t("kit.local"))}</p>
    <p class="fine"><strong>${esc(t("kit.laterTitle"))}</strong> ${esc(t("kit.later"))}</p>
  </div>`;
}

export const withIcon = icon;
