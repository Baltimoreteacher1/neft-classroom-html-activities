// Family progress: what was practiced, kept apart from how it went. Counts come from saved results;
// nothing is graded here, and completion is never presented as mastery.
import { bandRows, loadEsGuide, loadRoad } from "../content.js";
import { allRecords, getStudentName } from "../store.js";
import { loadLedger } from "../lang/ledger.js";
import { BASE, DOMAIN_META, html, icon, todayISO } from "../util.js";
import { nextRecognition, recognition, weeklyChallenge } from "./engage.js";
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


const domainVars = (d) => ({ en: d.toLowerCase(), es: spanishDomain(d) });
const recogLine = (I, r) => (r.domain ? I.L(`recog.${r.kind}`, { domain: domainVars(r.domain) }) : I.L(`recog.${r.kind}`));

export function challengeHTML(I, challenge, band) {
  if (!challenge) return html`<p>${I.L("chal.none")}</p>`;
  const finished = challenge.total > 0 && challenge.done >= challenge.total;
  const href = `${BASE}/play?${new URLSearchParams({ ids: challenge.ids.join(","), t: `Road to ACCESS · Week ${challenge.n}`, grades: band })}`;
  return html`<p class="fam-chal-week"><strong>${I.L("chal.week", { n: challenge.n })} · <span lang="en">${challenge.theme}</span></strong></p>
    ${challenge.prompt ? html`<p class="fam-chal-prompt"><span class="fine">${I.L("chal.prompt")}</span><br />${I.TO(challenge.prompt)}</p>` : ""}
    <p class="fine" aria-live="polite">${finished ? I.L("chal.done") : I.L("chal.progress", { done: challenge.done, total: challenge.total })}</p>
    ${challenge.total ? html`<a class="btn ${finished ? "" : "btn-primary"} no-print" href="${href}">${I.L("chal.try")}${icon("arrow-right")}</a>` : ""}
    <p class="fine">${I.L("chal.note")}</p>`;
}

function recognitionHTML(I, summary) {
  const earned = recognition(summary);
  const next = nextRecognition(summary);
  const what = next ? I.pair(`recog.${next.kind}`, next.domain ? { domain: domainVars(next.domain) } : {}) : null;
  return html`${earned.length
      ? html`<ul class="fam-recog">${earned.map((r) => html`<li><span class="fam-tile">${icon(r.domain ? DOMAIN_META[r.domain].icon : "star")}</span><span>${recogLine(I, r)}</span></li>`)}</ul>`
      : html`<p>${I.L("recog.none")}</p>`}
    ${what ? html`<p class="fine">${I.L("recog.next", { what })}</p>` : ""}
    <p class="fine">${I.L("recog.note")}</p>`;
}

export async function render(ctx, I) {
  const band = ctx.band;
  const [es, road, ...rowLists] = await Promise.all([loadEsGuide(), loadRoad(), ...ctx.bands.map((b) => bandRows(b))]);
  const bandRowsNow = rowLists[ctx.bands.indexOf(band)] || [];
  const bandRecords = allRecords().filter((r) => r.band === band);
  const summary = summarize(bandRecords, new Map(bandRowsNow.map((r) => [r.id, r])), es);
  const challenge = weeklyChallenge(road?.[band], bandRecords, todayISO());
  const justFinished = new URLSearchParams(location.search).get("done") === "1" && summary.latest;
  const alias = getStudentName();
  const revisions = summary.revised + loadLedger().entries.filter((entry) => entry.band === band && entry.kind === "revision").length;
  summary.revised = revisions;
  const options = sessionOptions({ rows: bandRowsNow, band, minutes: 10, tiers: ctx.prefs.tiers });
  const next = summary.nextDomain
    ? { domain: summary.nextDomain, plan: options.oneSkill[summary.nextDomain] }
    : null;
  const improved = [
    revisions ? I.L("prog.improved.revised", { n: revisions }) : "",
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
          <p class="fine">${I.L("prog.scope", { band: band.replace("-", "–"), alias: alias || I.LS("prog.scope.learner") })}</p>
          <div class="fam-cta no-print">
            <button type="button" class="btn" data-print>${icon("print")} ${I.L("prog.print")}</button>
            <a class="btn" href="${BASE}/family/save?grades=${band}">${icon("save")} ${I.L("prog.save")}</a>
          </div>
          <p class="fine no-print">${I.L("prog.print.note")}</p>
        </div>
        <div class="prog-hero-art"><img src="${skillArt("Reading")}" alt="" width="420" height="300" /></div>
      </section>
      ${justFinished ? html`<section class="panel fam-done" role="status" aria-labelledby="ppDone"><h2 id="ppDone">${icon("check")} ${I.L("session.done.heading")}</h2><p>${I.L("session.done.text")}</p></section>` : ""}
      <div class="fam-prog-grid">
        <section class="panel" aria-labelledby="pp1"><h2 id="pp1">${I.L("prog.practiced.heading")}</h2>${practicedLines(I, summary.latest)}</section>
        <section class="panel" aria-labelledby="pp2"><h2 id="pp2">${I.L("prog.completed.heading")}</h2>
          <ul class="fam-mini-stats">
            <li><strong>${summary.completed}</strong><span>${I.L("prog.counts.completed")}</span></li>
            <li><strong>${summary.independent}</strong><span>${I.L("prog.counts.independent")}</span></li>
            <li><strong>${summary.help}</strong><span>${I.L("prog.counts.help")}</span></li>
            <li><strong>${summary.revised}</strong><span>${I.L("prog.counts.revised")}</span></li>
          </ul>
          <p class="fine">${I.L("prog.days")}: ${summary.dayCount}</p>
          <p class="fine">${I.L("prog.week.summary", { days: summary.weeklyDays, skills: summary.weeklyDomains.length ? summary.weeklyDomains.map((d) => I.LS(`hub.skill.name.${d}`)).join(", ") : I.LS("prog.week.none") })}</p></section>
        <section class="panel" aria-labelledby="pp3"><h2 id="pp3">${I.L("prog.skills.heading")}</h2>${skillBars(I, summary)}<p class="fine">${I.L("prog.skills.caption")}</p></section>
        <section class="panel" aria-labelledby="pp4"><h2 id="pp4">${I.L("prog.improved.heading")}</h2>
          ${improved.length ? html`<ul class="fam-lines">${improved.map((l) => html`<li>${l}</li>`)}</ul>` : html`<p>${I.L("prog.improved.none")}</p>`}</section>
        <section class="panel" aria-labelledby="pp5"><h2 id="pp5">${I.L("prog.next.heading")}</h2>
          ${next
            ? html`<p>${I.L(summary.nextKind === "try" ? "prog.next.try" : "prog.next.balance", { domain: { en: next.domain.toLowerCase(), es: spanishDomain(next.domain) } })}</p>
              <p>${I.L("prog.next.line", { domain: { en: next.domain.toLowerCase(), es: spanishDomain(next.domain) } })}</p>
              ${next.plan.length ? html`<a class="btn btn-primary no-print" href="${playlistHref(next.plan, `${next.domain} practice`, band)}">${I.L("prog.next.go")}${icon("arrow-right")}</a>` : ""}`
            : html`<p>${I.L("prog.empty")}</p><a class="btn btn-primary no-print" href="${BASE}/family/practice?grades=${band}">${I.L("prog.next.go")}${icon("arrow-right")}</a>`}</section>
        <section class="panel" aria-labelledby="pp7"><h2 id="pp7">${I.L("chal.heading")}</h2>${challengeHTML(I, challenge, band)}</section>
        <section class="panel" aria-labelledby="pp8"><h2 id="pp8">${I.L("recog.heading")}</h2>${recognitionHTML(I, summary)}</section>
        <section class="panel fam-measures" aria-labelledby="pp6"><h2 id="pp6">${I.L("prog.measures.heading")}</h2>
          <dl>
            ${["completed", "independent", "help", "revised"].map((m) => html`<div><dt>${I.L(`prog.m.${m}`)}</dt><dd>${I.L(`prog.m.${m}.text`)}</dd></div>`)}
          </dl></section>
      </div>
      <p class="fine">${I.L("prog.disclaimer")}</p>
      ${subnavHTML(I, "progress", band)}`,
  };
}
