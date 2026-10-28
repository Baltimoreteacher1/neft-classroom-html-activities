// Family progress: what was practiced, kept apart from how it went. Counts come from saved results;
// nothing is graded here, and completion is never presented as mastery.
import { bandRows, loadEsGuide } from "../content.js";
import { allRecords } from "../store.js";
import { BASE, html, icon } from "../util.js";
import { playlistHref, sessionOptions } from "./plan.js";
import { summarize } from "./summary.js";
import { SKILLS, crumbs, longDate, skillArt, skillIcon, skillName, subnavHTML } from "./ui.js";

function practicedLines(I, latest) {
  if (!latest) return html`<p>${I.L("prog.empty")}</p>`;
  return html`<p class="fine">${I.L("prog.practiced.today")}</p>
    <ul class="fam-lines">
      ${latest.items.map((item) => {
        const vars = { date: { en: longDate({ spanish: false }, latest.day), es: longDate({ spanish: true }, latest.day) }, domain: { en: item.domain.toLowerCase(), es: spanishDomain(item.domain) } };
        return html`<li>${item.skillEn
          ? I.L("prog.practiced.line", { ...vars, skill: { en: item.skillEn.toLowerCase(), es: (item.skillEs || `“${item.skillEn}”`).replace(/^./, (c) => c.toLowerCase()) } })
          : I.L("prog.practiced.line.general", vars)}</li>`;
      })}
    </ul>`;
}

const SPANISH_DOMAIN = { Listening: "comprensión auditiva", Reading: "lectura", Speaking: "expresión oral", Writing: "escritura" };
const spanishDomain = (d) => SPANISH_DOMAIN[d] || d;

function skillBars(I, summary) {
  const max = Math.max(1, ...SKILLS.map((d) => summary.byDomain[d].completed));
  return html`<ul class="fam-skill-bars">
    ${SKILLS.map((d) => {
      const n = summary.byDomain[d].completed;
      return html`<li class="d-${d.toLowerCase()}"><span class="fam-tile">${skillIcon(d)}</span><div><strong>${skillName(I, d)}</strong>
        <div class="bar" role="img" aria-label="${skillName(I, d)}: ${n}"><i style="width:${Math.round((n / max) * 100)}%"></i></div>
        <span class="fine">${n ? I.L("prog.skills.count", { n }) : I.L("prog.skills.none")}</span></div></li>`;
    })}
  </ul>`;
}

export async function render(ctx, I) {
  const band = ctx.band;
  const [es, ...rowLists] = await Promise.all([loadEsGuide(), ...ctx.bands.map((b) => bandRows(b))]);
  const rows = rowLists.flat();
  const summary = summarize(allRecords(), new Map(rows.map((r) => [r.id, r])), es);
  const bandRowsNow = rowLists[ctx.bands.indexOf(band)] || [];
  const options = sessionOptions({ rows: bandRowsNow, band, minutes: 10, tiers: ctx.prefs.tiers });
  const next = summary.nextDomain
    ? { domain: summary.nextDomain, plan: options.oneSkill[summary.nextDomain] }
    : null;
  const improved = [
    summary.revised ? I.L("prog.improved.revised", { n: summary.revised }) : "",
    summary.help ? I.L("prog.improved.retry", { n: summary.help }) : "",
  ].filter(Boolean);
  return {
    title: I.LS("prog.title"),
    html: html`${crumbs(I, I.L("prog.title"))}
      <section class="prog-hero fam-hero d-reading is-tint" aria-labelledby="famProgTitle">
        <div class="prog-hero-copy">
          <p class="eyebrow">${icon("passport")} ${I.L("hub.eyebrow")}</p>
          <h1 id="famProgTitle" tabindex="-1">${I.L("prog.title")}</h1>
          <p class="lead">${I.L("prog.lead")}</p>
          <div class="fam-cta no-print">
            <button type="button" class="btn" data-print>${icon("print")} ${I.L("prog.print")}</button>
            <a class="btn" href="${BASE}/family/save?grades=${band}">${icon("save")} ${I.L("prog.save")}</a>
          </div>
          <p class="fine no-print">${I.L("prog.print.note")}</p>
        </div>
        <div class="prog-hero-art"><img src="${skillArt("Reading")}" alt="" width="420" height="300" /></div>
      </section>
      <div class="fam-prog-grid">
        <section class="panel" aria-labelledby="pp1"><h2 id="pp1">${I.L("prog.practiced.heading")}</h2>${practicedLines(I, summary.latest)}</section>
        <section class="panel" aria-labelledby="pp2"><h2 id="pp2">${I.L("prog.completed.heading")}</h2>
          <ul class="fam-mini-stats">
            <li><strong>${summary.completed}</strong><span>${I.L("prog.counts.completed")}</span></li>
            <li><strong>${summary.independent}</strong><span>${I.L("prog.counts.independent")}</span></li>
            <li><strong>${summary.help}</strong><span>${I.L("prog.counts.help")}</span></li>
            <li><strong>${summary.revised}</strong><span>${I.L("prog.counts.revised")}</span></li>
          </ul>
          <p class="fine">${I.L("prog.days")}: ${summary.dayCount}</p></section>
        <section class="panel" aria-labelledby="pp3"><h2 id="pp3">${I.L("prog.skills.heading")}</h2>${skillBars(I, summary)}<p class="fine">${I.L("prog.skills.caption")}</p></section>
        <section class="panel" aria-labelledby="pp4"><h2 id="pp4">${I.L("prog.improved.heading")}</h2>
          ${improved.length ? html`<ul class="fam-lines">${improved.map((l) => html`<li>${l}</li>`)}</ul>` : html`<p>${I.L("prog.improved.none")}</p>`}</section>
        <section class="panel" aria-labelledby="pp5"><h2 id="pp5">${I.L("prog.next.heading")}</h2>
          ${next
            ? html`<p>${I.L(summary.nextKind === "try" ? "prog.next.try" : "prog.next.balance", { domain: { en: next.domain.toLowerCase(), es: spanishDomain(next.domain) } })}</p>
              <p>${I.L("prog.next.line", { domain: { en: next.domain.toLowerCase(), es: spanishDomain(next.domain) } })}</p>
              ${next.plan.length ? html`<a class="btn btn-primary no-print" href="${playlistHref(next.plan, `${next.domain} practice`, band)}">${I.L("prog.next.go")}${icon("arrow-right")}</a>` : ""}`
            : html`<p>${I.L("prog.empty")}</p><a class="btn btn-primary no-print" href="${BASE}/family/practice?grades=${band}">${I.L("prog.next.go")}${icon("arrow-right")}</a>`}</section>
        <section class="panel fam-measures" aria-labelledby="pp6"><h2 id="pp6">${I.L("prog.measures.heading")}</h2>
          <dl>
            ${["completed", "independent", "help", "revised"].map((m) => html`<div><dt>${I.L(`prog.m.${m}`)}</dt><dd>${I.L(`prog.m.${m}.text`)}</dd></div>`)}
          </dl></section>
      </div>
      <p class="fine">${I.L("prog.disclaimer")}</p>
      ${subnavHTML(I, "progress", band)}`,
  };
}
