// Print markup for the Activity Guide: a first page "How to use these activities" with the one QR code, then one
// activity per page. Built from activity-guide-model.js, the same model as the Word file.
import { html, icon, toHtml } from "../../access-practice-lab/src/util.js";

const ic = (name) => html`<span class="ig-ic" aria-hidden="true">${icon(name)}</span>`;
const list = (items) => html`<ul>${items.map((i) => html`<li>${i}</li>`)}</ul>`;

function cover(m) {
  const h = m.howTo;
  return html`<article class="ig-sheet ag-page ag-cover" aria-labelledby="ag-h1">
    <header class="ig-run"><p class="ig-runtitle">${m.title}</p><p class="ig-pg">Six activities</p></header>
    <h1 id="ag-h1" class="ag-title">${m.title}</h1>
    <section class="ag-how" aria-labelledby="ag-how-h">
      <h2 id="ag-how-h">${h.heading}</h2>
      <p class="ag-lead">${h.lead}</p>
      <ol class="ag-points">
        ${h.points.map(([head, text], i) => html`<li><span class="ig-n" aria-hidden="true">${i + 1}</span><p><strong>${head}.</strong> ${text}</p></li>`)}
      </ol>
    </section>
    <section class="ag-startrow" aria-labelledby="ag-start-h">
      <div>
        <h2 id="ag-start-h">${ic("flag")}${h.start.text}</h2>
        <p><a href="${h.start.url}">${h.start.short}</a></p>
        <p>The start page links to the tour, the exploration, the featured lesson, these guides and the Site Guide.</p>
      </div>
      <figure class="ig-qr"><img src="/access-practice-lab/guides/qr-start.svg" width="110" height="110" alt="${h.qrAlt}"></figure>
    </section>
    <section aria-labelledby="ag-in-h">
      <h2 id="ag-in-h">In this guide</h2>
      <ol class="ag-toc">
        ${m.cards.map(
          (c, i) =>
            html`<li><span>${ic(c.icon)}<a href="${c.link.url}">${c.name}</a> <span class="ag-kind">${c.kind} · ${c.group.toLowerCase()} · ${c.time}</span></span><span class="ag-pageno">page ${i + 2}</span></li>`,
        )}
      </ol>
    </section>
  </article>`;
}

function cardPage(c, i, total) {
  const t = c.teach;
  return html`<article class="ig-sheet ag-page" aria-labelledby="ag-c-${c.id}">
    <header class="ig-run"><p class="ig-runtitle">${c.kind} · ${c.group}</p><p class="ig-pg">Activity ${i + 1} of ${total}</p></header>
    <h2 id="ag-c-${c.id}" class="ag-name">${ic(c.icon)}${c.name} <span class="ag-chip">${c.kind}</span></h2>
    <p class="ag-meta"><strong>Where:</strong> ${c.where} · <strong>Time:</strong> ${c.time} · <strong>Link:</strong> <a href="${c.link.url}">${c.link.short}</a></p>
    <p><strong>What it is.</strong> ${c.does}</p>
    ${c.why ? html`<section aria-labelledby="ag-w-${c.id}"><h3 id="ag-w-${c.id}">Why it works</h3><p>${c.why}</p></section>` : ""}
    <p><strong>How to open it.</strong> ${c.open}</p>
    <section aria-labelledby="ag-s-${c.id}">
      <h3 id="ag-s-${c.id}">How students use it</h3>
      <ol class="ag-steps">${c.steps.map((s, n) => html`<li><span class="ig-n" aria-hidden="true">${n + 1}</span><p>${s}</p></li>`)}</ol>
    </section>
    <section aria-labelledby="ag-f-${c.id}">
      <h3 id="ag-f-${c.id}">Feedback students get</h3>
      <p>${c.feedback}</p>
    </section>
    <div class="ag-cols">
      <section aria-labelledby="ag-b-${c.id}">
        <h3 id="ag-b-${c.id}">Built-in help <span class="ag-sub">(part of the activity)</span></h3>
        ${list(c.builtIn)}
      </section>
      <section aria-labelledby="ag-m-${c.id}">
        <h3 id="ag-m-${c.id}">Teaching moves <span class="ag-sub">(what you add)</span></h3>
        ${list(c.moves.length ? c.moves : ["Use the before, during and after ideas below."])}
      </section>
    </div>
    ${c.limits ? html`<p class="ag-limits"><strong>Good to know.</strong> ${c.limits}</p>` : ""}
    <section aria-labelledby="ag-t-${c.id}">
      <h3 id="ag-t-${c.id}">Teach it</h3>
      <dl class="ag-teach">
        <div><dt>Before</dt><dd>${t.before}</dd></div>
        <div><dt>During</dt><dd>${t.during}</dd></div>
        <div><dt>After</dt><dd>${t.after}</dd></div>
      </dl>
    </section>
    <section aria-labelledby="ag-x-${c.id}">
      <h3 id="ag-x-${c.id}">If something goes wrong</h3>
      <dl class="ag-stuck">${c.stuck.map((s) => html`<div><dt>${s.problem}</dt><dd>${s.fix}</dd></div>`)}</dl>
    </section>
  </article>`;
}

export function activityGuideBody(model) {
  const body = html`${cover(model)}${model.cards.map((c, i) => cardPage(c, i, model.cards.length))}`;
  return `<div class="ig ag">${toHtml(body)}</div>`;
}
