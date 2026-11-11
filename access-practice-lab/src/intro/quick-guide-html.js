// The two printed pages of the Quick Guide as markup. The on-screen page and the PDF both call guideSheets() with the
// same model, so what you see is what prints. The caller decides how a link is written (`href`): the page uses lab
// paths (page 1 activity links carry the "Back to the Quick Guide" bar), the PDF uses the public https URLs.
import { html, icon, raw } from "../util.js";

const pathIcon = (name) => html`<span class="ig-ic" aria-hidden="true">${icon(name)}</span>`;

/** A link plus its readable fallback URL, e.g. for paper. */
const linkWithUrl = (l, href) =>
  html`<a href="${href}">${l.text}</a><span class="ig-url">${l.short}</span>`;

const box = (id, checked) =>
  html`<input
    type="checkbox"
    class="ig-tick"
    id="ig-c-${id}"
    data-ig-check="${id}"
    ${checked ? raw(" checked") : ""}
  />`;

function activityRow(a, state, href, domain = null) {
  return html`<tr>
    <td>${domain ? html`<p class="ig-domain">${pathIcon(domain.icon)}${domain.name}</p>` : ""}<div class="ig-act">
      <label class="ig-label" for="ig-c-${a.id}"
        >${box(a.id, state.checks[a.id])}<span class="visually-hidden">I tried: </span></label
      >
      <span class="ig-actname"
        ><a href="${href(a.link.route, "activity")}">${a.name}</a>
        <span class="ig-url">${a.link.shown || a.link.route}</span></span
      >
    </div></td>
    <td data-label="What to try">${a.tryNow}</td>
    <td data-label="One classroom use">${a.classroomUse}</td>
  </tr>`;
}

function pathwayRows(p, state, href, compact) {
  if (compact)
    return html`<tbody class="ig-${p.id}">
      ${activityRow(p.activities[0], state, href, p)}
    </tbody>`;
  return html`<tbody class="ig-${p.id}">
    <tr class="ig-grouprow">
      <th scope="rowgroup" colspan="3">${pathIcon(p.icon)}${p.name} <span class="ig-blurb">${p.blurb}</span></th>
    </tr>
    ${p.activities.map((a) => activityRow(a, state, href))}
  </tbody>`;
}

function activitiesTable(pathways, state, href) {
  // One activity per domain: the domain name sits in the activity cell instead of a row of its own.
  const compact = pathways.every((p) => p.activities.length === 1);
  return html`<table class="ig-table${compact ? " ig-compact" : ""}">
    <thead>
      <tr><th scope="col">Activity</th><th scope="col">What to try</th><th scope="col">One classroom use</th></tr>
    </thead>
    ${pathways.map((p) => pathwayRows(p, state, href, compact))}
  </table>`;
}

function planning(pl, state) {
  const field = (id, label) =>
    html`<div class="ig-field">
      <label for="ig-p-${id}">${label}</label>
      <textarea id="ig-p-${id}" data-ig-plan="${id}" rows="1" autocomplete="off">
${state.plan[id] || ""}</textarea>
    </div>`;
  return html`<section class="ig-planning" aria-labelledby="ig-plan-h">
    <h3 id="ig-plan-h">${pathIcon("writing")}${pl.heading}</h3>
    <div class="ig-fields">${pl.prompts.map((p) => field(p.id, p.label))}</div>
    <div class="ig-field ig-frame">
      <label for="ig-p-frame">${pl.frameLabel}: <span class="ig-framebox">${pl.frame}</span></label>
      <textarea id="ig-p-frame" data-ig-plan="frame" rows="1" autocomplete="off">
${state.plan.frame || ""}</textarea>
    </div>
  </section>`;
}

function page1(m, state, href, qr) {
  const p = m.page1;
  return html`<article class="ig-sheet ig-p1" aria-labelledby="ig-h-p1">
    <header class="ig-run">
      <h1>${m.siteName} ${m.title}</h1>
      <p class="ig-pg">Page 1 of 2</p>
    </header>
    <h2 id="ig-h-p1" class="ig-title">${p.heading}</h2>
    <section class="ig-startrow" aria-labelledby="ig-start-h">
      <div class="ig-starttext">
        <h3 id="ig-start-h">${pathIcon("flag")}Start here</h3>
        <p>${p.startHere}</p>
        <p class="ig-startlink">
          ${p.start.text} ${linkWithUrl(p.start.link, href(p.start.link.route, "start"))}
        </p>
        <p class="ig-more">
          ${p.start.more.text}
          ${p.start.more.links.map((l, i) => html`${i ? " · " : ""}<a href="${href(l.route, "file")}">${l.text}</a> <span class="ig-route">${l.route}</span>`)}
        </p>
      </div>
      <figure class="ig-qr">
        <img src="${qr.start}" width="96" height="96" alt="${p.start.qrAlt}" />
        
      </figure>
    </section>
    <section class="ig-seqwrap" aria-labelledby="ig-seq-h">
      <h3 id="ig-seq-h">${pathIcon("clock")}The 20 minutes</h3>
      <ol class="ig-seq">
        ${p.sequence.map(
          (s) =>
            html`<li>
              <span class="ig-range">${s.range}</span
              ><span><strong>${s.name}.</strong> ${s.detail}</span>
            </li>`,
        )}
      </ol>
    </section>
    <p class="ig-addrnote">${p.addressNote}</p>
    ${activitiesTable(p.pathways, state, href)} ${planning(p.planning, state)}
  </article>`;
}

function steps(list) {
  return html`<ol class="ig-steps">
    ${list.map(
      (s) =>
        html`<li>
          <span class="ig-n" aria-hidden="true">${s.n}</span>
          <p>
            <strong>${s.name}</strong>
            <span class="ig-min">${s.minutes} ${s.minutes === 1 ? "minute" : "minutes"}.</span>
            ${s.direction}
          </p>
        </li>`,
    )}
  </ol>`;
}

function supports(list) {
  return html`<div class="ig-supports">
    ${list.map(
      (s) =>
        html`<section class="ig-sup" aria-label="${s.name}">
          <h4>${s.name}</h4>
          <ul>
            ${s.items.map((i) => html`<li>${i}</li>`)}
          </ul>
        </section>`,
    )}
  </div>`;
}

function page2(m, href, qr) {
  const p = m.page2;
  const l = p.links;
  return html`<article class="ig-sheet ig-p2" aria-labelledby="ig-h-p2">
    <header class="ig-run">
      <p class="ig-runtitle">${m.siteName} ${m.title}</p>
      <p class="ig-pg">Page 2 of 2</p>
    </header>
    <h2 id="ig-h-p2" class="ig-title">${p.heading}</h2>
    <section class="ig-lessonhead" aria-label="Objective, prompt and links">
      <p><strong>${p.topic}, ${p.minutes} minutes.</strong> ${p.objective}</p>
      <p class="ig-prompt">
        <strong>Say to students:</strong> “${p.prompt}” <strong>Frame:</strong> ${p.frame}
      </p>
      <ul class="ig-linkrow">
        <li>${linkWithUrl({ text: l.lesson.label, short: l.lesson.route }, href(l.lesson.route, "lesson"))}</li>
        <li>${linkWithUrl({ text: l.activity.label, short: l.activity.route }, href(l.activity.route, "activity"))}</li>
        <li>${linkWithUrl({ text: l.siteGuide.text, short: l.siteGuide.route }, href(l.siteGuide.route, "siteguide"))}</li>
      </ul>
      <p class="ig-addrnote">${m.page1.addressNote}</p>
    </section>
    ${steps(p.steps)}
    <section class="ig-samples" aria-labelledby="ig-sample-h">
      <h3 id="ig-sample-h">${pathIcon("writing")}Sample learner work</h3>
      <div class="ig-cols">
        <div>
          <h4>${p.sample.firstLabel}</h4>
          <p class="ig-quote">${p.sample.first}</p>
        </div>
        <div>
          <h4>${p.sample.improvedLabel}</h4>
          <p class="ig-quote">${p.sample.improved}</p>
        </div>
      </div>
      <p class="ig-sampnote">${p.sample.note}</p>
    </section>
    <dl class="ig-facts">
      <div>
        <dt>One feedback cue</dt>
        <dd>${p.cue}</dd>
      </div>
      <div>
        <dt>Quick check</dt>
        <dd>${p.check}</dd>
      </div>
      <div>
        <dt>Follow-up</dt>
        <dd>${p.followUp}</dd>
      </div>
    </dl>
    <section aria-labelledby="ig-sup-h">
      <h3 id="ig-sup-h">${pathIcon("info")}Three support choices <span class="ig-blurb">${p.fade}</span></h3>
      ${supports(p.supports)}
    </section>
    <footer class="ig-foot">
      <p>${p.fadeDetail} ${p.homeLanguage}</p>
    </footer>
  </article>`;
}

/**
 * @param {object} model buildGuideModel()
 * @param {{href?: (route: string, kind: string) => string, qr: {start: string}, state?: object}} opts
 */
export function guideSheets(model, { href, qr, state = {} }) {
  const s = { checks: state.checks || {}, plan: state.plan || {} };
  return html`${page1(model, s, href, qr)}${page2(model, href, qr)}`;
}
