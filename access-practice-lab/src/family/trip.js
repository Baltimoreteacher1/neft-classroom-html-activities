// Family Trip (/family/trip): one skill, six stops, one 10-minute session per stop, in order.
// Look (talk about it, any language) / Do (the stop's activities) / Say (tell a grown-up one thing).
// The grown-up checks the stop's box in the paper Trip Log. Progress lives on this device only.
import { bandRows } from "../content.js";
import { BASE, html, icon, todayISO } from "../util.js";
import { playlistHref, sessionMinutes } from "./plan.js";
import { TRIP_STOPS, familyPatch, getFamily } from "./state.js";
import { ACCESS_LAB_FLAGS } from "../lang/feature-flags.js";
import { COUNTRIES } from "../journey.js";
import * as postcards from "../postcards.js";
import { nextStopIds, stopProgress, suggestSkill } from "./trip-plan.js";
import { SKILLS, crumbs, skillIcon, skillName, subnavHTML } from "./ui.js";

const requestedSkill = () => {
  const skill = new URLSearchParams(location.search).get("skill");
  return SKILLS.includes(skill) ? skill : null;
};

const routeHTML = (I, finished, current) =>
  html`<ol class="trip-route" aria-label="${I.LS("trip.route", { done: finished, total: TRIP_STOPS })}">
    ${Array.from({ length: TRIP_STOPS }, (_, i) => html`<li class="${i < finished ? "on" : ""} ${i === current ? "now" : ""}"></li>`)}
  </ol>`;

function chooser(I, suggested, requested) {
  const lead = requested ? I.L("trip.teacher") : I.L("trip.why");
  const first = requested || suggested;
  return html`<div class="trip-pick" role="group" aria-labelledby="tripPickLabel">
    <p id="tripPickLabel" class="fam-lang-label">${I.L("trip.pick")}</p>
    <p class="fine">${lead}</p>
    <div class="fam-choice-row">
      ${SKILLS.map((d) => html`<button type="button" class="band-btn" data-trip-begin="${d}" aria-pressed="${d === first}">${skillIcon(d)} ${skillName(I, d)}</button>`)}
    </div>
  </div>`;
}

function stopCard(I, trip, rows, band, progress) {
  const n = trip.stop + 1;
  const plan = trip.ids.map((id) => ({ id }));
  const minutes = sessionMinutes(rows.filter((r) => trip.ids.includes(r.id)));
  const doneNow = progress.finished;
  const promptVariant = (trip.stop % 3) + 1;
  return html`<div class="trip-stop panel" aria-labelledby="tripStopTitle">
    <h2 id="tripStopTitle">${doneNow ? I.L("trip.stop.done", { n }) : I.L("trip.stop", { n, total: TRIP_STOPS })}</h2>
    <ol class="trip-steps">
      <li><strong>${I.L("trip.step.look")}</strong><span>${I.L(`trip.look.${trip.skill}.${promptVariant}`)}</span></li>
      <li><strong>${I.L("trip.step.do")}</strong><span>${I.L("trip.do", { n: progress.total, min: minutes, done: progress.done })}</span></li>
      <li><strong>${I.L("trip.step.say")}</strong><span>${I.L(`trip.say.${trip.skill}.${promptVariant}`)}</span></li>
    </ol>
    ${n === TRIP_STOPS ? html`<p class="fine">${I.L("trip.souvenir")}</p><a class="btn" href="${BASE}/speak?grades=${band}">${I.L("trip.keep")}${icon("arrow-right")}</a>` : ""}
    ${doneNow && ACCESS_LAB_FLAGS.cameraPostcardsEnabled ? postcards.makerHTML(I, { place: COUNTRIES[trip.skill]?.[rows.find((r) => trip.ids.includes(r.id))?.level]?.[0] || "" }) : ""}
    ${doneNow
      ? html`<p class="goal-done" role="status">${I.L("trip.paper")}</p><button type="button" class="btn btn-primary" data-trip-next>${I.L("trip.next")}${icon("arrow-right")}</button>`
      : html`<a class="btn btn-primary" href="${playlistHref(plan, I.LS("trip.title"), band)}">${I.L("trip.start")}${icon("arrow-right")}</a>`}
  </div>`;
}

export async function render(ctx, I) {
  const band = ctx.band;
  const rows = await bandRows(band);
  const { trip } = getFamily(ctx.prefs);
  const requested = requestedSkill();
  const progress = trip ? stopProgress(trip.ids, rows) : { done: 0, total: 0, finished: false };
  const finishedStops = trip ? trip.stop + (progress.finished && trip.stop < TRIP_STOPS ? 1 : 0) : 0;
  let body;
  if (!trip) body = chooser(I, suggestSkill(rows), requested);
  else if (trip.stop >= TRIP_STOPS)
    body = html`<div class="trip-stop panel"><h2>${I.L("trip.finished")}</h2><p>${I.L("trip.finished.text")}</p><button type="button" class="btn btn-primary" data-trip-new>${I.L("trip.new")}</button></div>`;
  else if (!trip.ids.length) body = html`<p class="fine">${I.L("trip.empty")}</p><button type="button" class="btn" data-trip-new>${I.L("trip.new")}</button>`;
  else body = stopCard(I, trip, rows, band, progress);
  return {
    title: I.LS("trip.title"),
    html: html`${crumbs(I, I.L("trip.title"))}
      <section class="fam-trip panel ${trip ? `d-${trip.skill.toLowerCase()}` : ""}" aria-labelledby="tripTitle">
        <p class="eyebrow">${trip ? skillIcon(trip.skill) : icon("road")} ${trip ? skillName(I, trip.skill) : I.L("nav.family.trip")}</p>
        <h1 id="tripTitle" tabindex="-1">${I.L("trip.title")}</h1>
        <p class="lead">${I.L("trip.lead")}</p>
        ${trip ? routeHTML(I, finishedStops, trip.stop) : ""}
        ${body}
        <p class="fine">${I.L("trip.note")}</p>
      </section>
      ${subnavHTML(I, "trip", band)}`,
  };
}

export function unmount() { postcards.unmount(); }

export async function onClick(e, ctx, I) {
  if (ACCESS_LAB_FLAGS.cameraPostcardsEnabled && postcards.onClick(e, I, ctx.rerender)) return true;
  const begin = e.target.closest("[data-trip-begin]");
  const next = e.target.closest("[data-trip-next]");
  const fresh = e.target.closest("[data-trip-new]");
  if (!begin && !next && !fresh) return false;
  if (fresh) {
    ctx.setPrefs(familyPatch(ctx.prefs, { trip: null }));
    ctx.rerender();
    return true;
  }
  const rows = await bandRows(ctx.band);
  const family = getFamily(ctx.prefs);
  const pick = (skill, stop) => {
    const ids = stop >= TRIP_STOPS ? [] : nextStopIds({ rows, band: ctx.band, skill, minutes: family.minutes, tiers: ctx.prefs.tiers });
    ctx.setPrefs(familyPatch(ctx.prefs, { trip: { skill, stop, ids } }));
    ctx.rerender();
  };
  if (begin) pick(begin.dataset.tripBegin, 0);
  else if (family.trip) {
    const week = new Date(`${todayISO()}T00:00:00Z`);
    week.setUTCDate(week.getUTCDate() - ((week.getUTCDay() + 6) % 7));
    const tripWeeks = [...new Set([...family.tripWeeks, week.toISOString().slice(0, 10)])].slice(-30);
    ctx.setPrefs(familyPatch(ctx.prefs, { tripWeeks }));
    pick(family.trip.skill, family.trip.stop + 1);
  }
  return true;
}
