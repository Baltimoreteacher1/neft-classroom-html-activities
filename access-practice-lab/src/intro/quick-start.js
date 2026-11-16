// Teacher Quick Start (/start/quick-start): the permanent "I want to…" reference for after the Teacher Tour. One short
// card per everyday task with a verified page to open (tour/quickref.js is the single list), printable on one page.
// It is a reference, not a tour step.
import { html, icon } from "../util.js";
import { ROUTES } from "./data.js";
import { teacherBand } from "./shell.js";
import { labHref } from "./ui.js";
import { MORE_RESOURCES, QUICK_TASKS } from "./tour/quickref.js";

export async function render() {
  return {
    title: "Teacher Quick Start",
    html: html`<article class="in-page qs-page" aria-labelledby="introTitle">
      ${teacherBand({
        active: "quickstart",
        eyebrow: "For teachers · Quick Start",
        title: "Teacher Quick Start",
        lead: "Everything you do after the tour, one tap away. Print it and keep it by your desk.",
      })}
      <section class="qs-body ts-lift" aria-label="I want to">
        <h2>I want to…</h2>
        <ul class="qs-list">
          ${QUICK_TASKS.map(
            (q) => html`<li class="qs-item">
              <h3><span class="in-ic" aria-hidden="true">${icon(q.icon)}</span>${q.want}</h3>
              <p>${q.text}</p>
              <p class="qs-links">${q.links.map((l) => html`<a class="btn small" href="${labHref(l.route)}">${l.label}${icon("arrow-right")}</a>`)}</p>
            </li>`,
          )}
        </ul>
        <h2>More teaching resources</h2>
        <ul class="qs-more">${MORE_RESOURCES.map((l) => html`<li><a href="${labHref(l.route)}">${l.label}</a></li>`)}</ul>
        <p class="no-print"><button type="button" class="btn" data-qs-print>${icon("print")}Print this page</button> <a class="btn btn-primary" href="${labHref(ROUTES.tour)}">${icon("flag")}Take the Teacher Tour</a></p>
      </section>
    </article>`,
  };
}

export const onClick = (e) => {
  if (!e.target.closest?.("[data-qs-print]")) return false;
  window.print();
  return true;
};
