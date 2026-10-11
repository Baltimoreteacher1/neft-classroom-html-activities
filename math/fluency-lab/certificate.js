// A printable achievement certificate built from this device's saved progress. Nothing is sent anywhere.
import { TRAILS, loadTrail } from "./fact-trail.js";
import { earnedIds, loadRewards, rankFor, summarize } from "./rewards.js";
import { t } from "./i18n.js";

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function certificateHtml({ grade, name }) {
  const trail = loadTrail();
  const summary = summarize(trail, loadRewards());
  const rank = rankFor(summary);
  const stops = TRAILS[grade].stations;
  const done = stops.filter((entry) => (trail.stations[`${grade}:${entry.id}`]?.stars || 0) >= 2).length;
  const facts = [
    t("{n} trail stops finished", { n: `<b>${t("{a} of {b}", { a: done, b: stops.length })}</b>` }),
    t("{n} trail stars", { n: `<b>${summary.stars}</b>` }),
    t("{n} stickers earned", { n: `<b>${earnedIds(summary).length}</b>` }),
  ];
  return `<article class="certificate" aria-label="${t("Certificate of Achievement")}">
    <p class="cert-kicker">${t("Math Fluency Lab")}</p>
    <h1>${t("Certificate of Achievement")}</h1>
    <p class="cert-line">${t("Awarded to")}</p>
    <p class="cert-name">${esc(name)}</p>
    <p class="cert-rank"><span aria-hidden="true">${rank.icon}</span> ${esc(rank.name)}</p>
    <p class="cert-line">${t("for steady, thoughtful practice in Grade {n} math", { n: grade })}</p>
    <ul class="cert-facts">${facts.map((fact) => `<li>${fact}</li>`).join("")}</ul>
    <p class="cert-sign"><span>${new Date().toLocaleDateString()}</span><span>${t("Teacher or family signature")}</span></p>
  </article>`;
}
