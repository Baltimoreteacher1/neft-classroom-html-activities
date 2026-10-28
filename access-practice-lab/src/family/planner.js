// Practice planner: pick a time, then a kind of session. Also keeps the original activity finder
// (skill / time / support filters) so existing /family?skill=…&minutes=… teacher links still work.
import { bandRows } from "../content.js";
import { BASE, DOMAIN_META, TIERS, copyText, html, icon } from "../util.js";
import { MINUTES, familyPatch, getFamily } from "./state.js";
import { playlistHref, sessionMinutes, sessionOptions } from "./plan.js";
import { SKILLS, crumbs, gradeSwitch, skillIcon, skillName, subnavHTML } from "./ui.js";

const query = () => new URLSearchParams(location.search);

function sessionCard(I, { key, title, plan, band, basis, emptyKey, d }) {
  const body = plan.length
    ? html`<p class="fine">${I.L("plan.size", { n: plan.length, min: sessionMinutes(plan) })}${basis ? html` · ${I.L(basis)}` : ""}</p>
        <a class="btn btn-primary" href="${playlistHref(plan, I.LS(key), band)}">${I.L("plan.start")}${icon("arrow-right")}<span class="visually-hidden"> ${title}</span></a>`
    : html`<p class="fine">${I.L(emptyKey || "plan.none")}</p>`;
  return html`<li class="fam-session ${d ? `d-${d.toLowerCase()}` : ""}"><span class="fam-tile">${d ? skillIcon(d) : icon("star")}</span><div><h3>${title}</h3>${body}</div></li>`;
}

function finder(I, rows, band, ctx) {
  const q = query();
  const skill = SKILLS.includes(q.get("skill")) ? q.get("skill") : "All";
  const minutes = [0, 10, 15, 20].includes(Number(q.get("minutes"))) ? Number(q.get("minutes")) : 0;
  const level = ["A", "B", "C"].includes(q.get("level")) ? q.get("level") : "All";
  const matches = rows.filter((r) => (skill === "All" || r.domain === skill) && (!minutes || Number(r.minutes) <= minutes) && (level === "All" || r.level === level));
  const href = (patch) => {
    const next = new URLSearchParams({ grades: band });
    const v = { skill, minutes, level, ...patch };
    if (v.skill !== "All") next.set("skill", v.skill);
    if (v.minutes) next.set("minutes", String(v.minutes));
    if (v.level !== "All") next.set("level", v.level);
    return `${BASE}/family/practice?${next}#finder`;
  };
  const group = (label, items, current, labelOf, key) =>
    html`<div><strong>${label}</strong>${items.map((v) => html`<a href="${href({ [key]: v })}" aria-current="${String(current) === String(v)}">${labelOf(v)}</a>`)}</div>`;
  const shareHref = `${location.origin}${BASE}/family?${new URLSearchParams({ grades: band, ...(skill !== "All" ? { skill } : {}), ...(minutes ? { minutes } : {}), ...(level !== "All" ? { level } : {}) })}`;
  return html`<section class="fam-finder" id="finder" aria-labelledby="finderTitle" tabindex="-1">
    <div class="fam-finder-head"><h2 id="finderTitle">${I.L("plan.finder.heading")}</h2><span>${I.L("plan.finder.matches", { n: matches.length })}</span></div>
    <div class="fam-filter-groups">
      ${group(I.L("plan.filter.skill"), ["All", ...SKILLS], skill, (v) => (v === "All" ? I.L("plan.filter.any") : skillName(I, v)), "skill")}
      ${group(I.L("plan.filter.time"), [0, 10, 15, 20], minutes, (v) => (v ? I.L("plan.filter.upTo", { n: v }) : I.L("plan.filter.any")), "minutes")}
      ${group(I.L("plan.filter.support"), ["All", "A", "B", "C"], level, (v) => (v === "All" ? I.L("plan.filter.any") : I.L(`plan.support.${v}`)), "level")}
    </div>
    <ul class="fam-activity-cards">
      ${matches.slice(0, 12).map((row) => html`<li><span class="fam-activity-mark">${skillIcon(row.domain)}</span><div><small>${skillName(I, row.domain)} · ${I.L("common.minutes", { n: row.minutes })} · ${TIERS[row.level]?.name || row.level}</small><strong lang="en">${row.title}</strong></div><a href="${BASE}/${row.domain}/${row.level}/${row.id}?grades=${band}">${I.L("plan.start")} →</a></li>`)}
    </ul>
    <p class="fine"><button type="button" class="ghost small" data-family-copy="${shareHref}">${icon("copy")} ${I.S("Copy this list as a link for a teacher", "Copiar esta lista como enlace para un docente")}</button> <span class="fam-copy-status" role="status" aria-live="polite"></span></p>
  </section>`;
}

export async function render(ctx, I) {
  const band = ctx.band;
  const family = getFamily(ctx.prefs);
  const rows = await bandRows(band);
  const options = sessionOptions({ rows, band, minutes: family.minutes, tiers: ctx.prefs.tiers });
  const basis = options.history ? "plan.basis.history" : "plan.basis.start";
  const cards = [
    sessionCard(I, { key: "plan.recommended", title: I.L("plan.recommended"), plan: options.recommended, band, basis }),
    ...SKILLS.map((d) => sessionCard(I, { key: `hub.skill.name.${d}`, title: `${I.LS("plan.oneSkill")}: ${I.LS(`hub.skill.name.${d}`)}`, plan: options.oneSkill[d], band, basis, d })),
    sessionCard(I, { key: "plan.allFour", title: I.L("plan.allFour"), plan: options.allFour, band, basis }),
    sessionCard(I, { key: "plan.continue", title: I.L("plan.continue"), plan: options.continue, band, emptyKey: "plan.none.reason.continue" }),
    sessionCard(I, { key: "plan.review", title: I.L("plan.review"), plan: options.review, band, emptyKey: "plan.none.reason.review" }),
  ];
  return {
    title: I.LS("plan.title"),
    html: html`${crumbs(I, I.L("plan.title"))}
      <section class="fam-plan panel" aria-labelledby="famPlanTitle">
        <h1 id="famPlanTitle" tabindex="-1">${I.L("plan.title")}</h1>
        <p class="lead">${I.L("plan.lead")}</p>
        <div class="fam-plan-controls">
          <div role="group" aria-labelledby="famTimeLabel">
            <p id="famTimeLabel" class="fam-lang-label">${I.L("plan.time.label")}</p>
            <div class="fam-choice-row">
              ${MINUTES.map((m) => html`<button type="button" class="band-btn" data-fam-minutes-set="${m}" aria-pressed="${family.minutes === m}">${I.L(`setup.time.${m}`)}</button>`)}
              <button type="button" class="band-btn" data-fam-minutes-set="0" aria-pressed="${family.minutes === 0}">${I.L("plan.time.own")}</button>
            </div>
          </div>
          <div>${gradeSwitch(band, ctx.bands)}</div>
        </div>
        <p class="fine">${I.L("plan.estimate")} ${I.L(basis)}.</p>
        <ul class="fam-sessions">${cards}</ul>
      </section>
      ${finder(I, rows, band, ctx)}
      ${subnavHTML(I, "practice", band)}`,
  };
}

export function onClick(e, ctx) {
  const m = e.target.closest("[data-fam-minutes-set]");
  if (m) {
    ctx.setPrefs(familyPatch(ctx.prefs, { minutes: Number(m.dataset.famMinutesSet) }));
    ctx.rerender();
    return true;
  }
  const copy = e.target.closest("[data-family-copy]");
  if (!copy) return false;
  const status = copy.parentElement.querySelector(".fam-copy-status");
  copyText(copy.dataset.familyCopy).then((ok) => {
    if (status) status.textContent = ok ? document.documentElement.lang === "es" ? "Enlace copiado." : "Link copied." : document.documentElement.lang === "es" ? "No se pudo copiar." : "Copy was unavailable.";
  });
  return true;
}
