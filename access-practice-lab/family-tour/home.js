// The returning-family home: one next step, a short session, the saved plan, a compact way to pick another activity,
// and help. It is not a dashboard: no scores, no charts, no grades.
import { actionsHTML } from "./actions.js";
import { kitData, routine } from "./kit-data.js";
import { cardHTML, kitHTML } from "./kit.js";
import { byId, activityUrl } from "./picks.js";
import { getLang, t } from "./i18n.js";
import { esc, icon } from "./util.js";
import * as plan from "./steps/plan.js";

export const view = { open: "", session: 0, checked: [] };

const toggleBtn = (id, label, open) =>
  `<button type="button" class="home-tile ${open ? "is-on" : ""}" data-act="home-open" data-v="${id}" aria-expanded="${open}" aria-controls="home-${id}"><span>${esc(label)}</span><span aria-hidden="true">${open ? "−" : "+"}</span></button>`;

function sessionHTML(pick, state) {
  const steps = routine(pick, state.minutes);
  const done = view.checked.length;
  return `<ol class="session">${steps
    .map(
      (r, i) => `<li class="${view.checked.includes(i) ? "is-done" : ""}">
        <label><input type="checkbox" data-act="session-check" data-v="${i}" ${view.checked.includes(i) ? "checked" : ""}>
        <span><strong>${esc(t("kit.min", { n: r.mins }))} · ${esc(r.title)}</strong><br>${esc(r.text)}</span></label></li>`,
    )
    .join("")}</ol>
    <a class="btn-primary" href="${esc(activityUrl(pick))}" data-launch>${esc(t("kit.start"))}</a>
    ${done === steps.length ? `<p class="fine" role="status">${esc(t("home.sessionDone"))}</p>` : ""}`;
}

export function render({ state, picks }) {
  const pick = byId(picks, state.pick);
  if (!pick) return { html: `<p>${esc(t("home.noPlan"))}</p><button type="button" class="btn-primary" data-act="retake">${esc(t("home.tourAgain"))}</button>` };
  const k = kitData(state, pick);
  const open = view.open;
  const skill = getLang() === "es" ? pick.skillEs : pick.skill;
  const body = {
    session: sessionHTML(pick, state),
    plan: `${kitHTML(k)}${actionsHTML(k, { saved: false })}`,
    find: plan.render({ state, picks, compact: true }).html,
    help: `<div class="help3">${k.help.map((h) => `<div><strong>${esc(h.title)}</strong><p>${esc(h.text)}</p></div>`).join("")}</div>
      <ul class="say">${k.say.map((s) => `<li>${esc(s.home)}</li>`).join("")}</ul>`,
  };
  return {
    html: `<section class="next-card" aria-labelledby="next-h">
        <p class="tag">${esc(t("home.next"))}</p>
        <h2 id="next-h" lang="en">${esc(pick.title)}</h2>
        <p>${esc(t("plan.practices"))} ${esc(skill)} · ${esc(t("kit.about", { n: pick.minutes }))}</p>
        <a class="btn-primary btn-big" href="${esc(activityUrl(pick))}" data-launch>${esc(t("home.continue"))}</a>
      </section>
      <div class="home-tiles">
        ${[
          ["session", t("home.together")],
          ["plan", t("home.plan")],
          ["find", t("home.find")],
          ["help", t("home.help")],
        ]
          .map(([id, label]) => `${toggleBtn(id, label, open === id)}<div class="home-panel" id="home-${id}" ${open === id ? "" : "hidden"}>${open === id ? body[id] : ""}</div>`)
          .join("")}
      </div>
      <p class="again"><button type="button" class="btn-quiet" data-act="retake">${esc(t("home.tourAgain"))}</button></p>
      <div class="print-host" id="print-card-host">${cardHTML(k)}</div>`,
  };
}

export const iconOf = icon;
