// A printable achievement certificate built from this device's saved progress. Nothing is sent anywhere.
import { TRAILS, loadTrail } from "./fact-trail.js";
import { earnedIds, loadRewards, rankFor, summarize } from "./rewards.js";
import { achievementText } from "./achievements-4.js";
import { certificateFrame } from "./illustrations.js";
import { getLang, t } from "./i18n.js";

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

// A certificate for one earned recognition (see achievements-4.js). The name is printed only when the learner typed one.
export function certificateData(item, { name = "", now = Date.now() } = {}) {
  const words = achievementText(item);
  return {
    heading: t("Certificate of Achievement"),
    to: String(name || "").trim().slice(0, 40) || t("A Math Fluency Lab learner"),
    title: words.title,
    detail: words.detail,
    basis: t("Earned from practice done on this device."),
    date: new Date(now).toLocaleDateString(getLang() === "es" ? "es" : "en", { year: "numeric", month: "long", day: "numeric" }),
  };
}

// The frame fills the landscape page: unless the artwork sets its own aspect ratio, let it stretch to the certificate.
const stretch = (svg) => (/preserveAspectRatio=/.test(svg) ? svg : svg.replace("<svg", '<svg preserveAspectRatio="none"'));

export function achievementCertificateHtml(item, options = {}) {
  const data = certificateData(item, options);
  return `<article class="certificate cert-4" aria-label="${esc(data.heading)}">
    <span class="cert-frame">${stretch(certificateFrame({ decorative: true, idPrefix: "cert4" }))}</span>
    <div class="cert-body">
    <p class="cert-kicker">${t("Math Fluency Lab")}</p>
    <h1>${esc(data.heading)}</h1>
    <p class="cert-line">${t("Awarded to")}</p>
    <p class="cert-name">${esc(data.to)}</p>
    <p class="cert-line">${t("for")}</p>
    <p class="cert-rank">${esc(data.title)}</p>
    <p class="cert-line">${esc(data.detail)}</p>
    <p class="cert-line cert-basis">${esc(data.basis)}</p>
    <p class="cert-sign"><span>${esc(data.date)}</span><span>${t("Teacher or family signature")}</span></p>
    </div>
  </article>`;
}
