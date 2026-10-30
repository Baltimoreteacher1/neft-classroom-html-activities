// Family home: language, three ways to start, three steps, four skills, a recommended session,
// how to help, and a progress preview. One dominant action; everything else is quieter.
import { bandRows, loadEsGuide, loadFamilyHelp, loadRoad, loadShared } from "../content.js";
import { langSwitchHTML } from "../i18n.js";
import { allRecords } from "../store.js";
import { ART, BASE, DOMAIN_META, bandLabel, html, icon, testingWindowPhase, todayISO } from "../util.js";
import { weeklyChallenge } from "./engage.js";
import { challengeHTML } from "./progress.js";
import { sessionMinutes, sessionOptions, playlistHref, typicalMinutes } from "./plan.js";
import { getFamily } from "./state.js";
import { summarize } from "./summary.js";
import { SKILLS, crumbs, gradeSwitch, longDate, skillArt, skillIcon, skillName, subnavHTML } from "./ui.js";
import { award, getEngagement, saveEngagement, weekKey } from "../engagement.js";

const tipIcon = (name) => icon(name === "microphone" ? "record" : name || "info");
const promptReadHTML = (I, en, es) => html`<div class="fam-prompt-audio">${!I.spanish ? html`<button type="button" class="ghost small" data-say="${en}">${I.L("hub.quest.listen.en")}</button>` : ""}${I.spanish || I.bilingual ? html`<button type="button" class="ghost small" data-say-es="${es}">${I.L("hub.quest.listen.es")}</button>` : ""}</div>`;

function skillCards(I, rows, options, band) {
  return html`<ul class="fam-skill-cards">
    ${SKILLS.map((d) => {
      const plan = options.oneSkill[d];
      const href = plan.length ? playlistHref(plan, `${DOMAIN_META[d].name} practice`, band) : `${BASE}/${d}/A?grades=${band}`;
      return html`<li class="d-${d.toLowerCase()}">
        <img src="${skillArt(d)}" alt="" width="480" height="360" loading="lazy" decoding="async" />
        <div>
          <h3>${skillName(I, d)}</h3>
          <p>${I.L(`hub.skill.${d}`)}</p>
          <p class="fine">${I.L("hub.skill.time", { min: typicalMinutes(rows, d) })}</p>
          <a class="btn btn-room" href="${href}">${I.L("hub.skill.start")}<span class="visually-hidden"> ${skillName(I, d)}</span>${icon("arrow-right")}</a>
        </div>
      </li>`;
    })}
  </ul>`;
}

function progressPreview(I, summary, band) {
  if (!summary.hasWork) return html`<p>${I.L("hub.progress.empty")}</p>`;
  return html`<ul class="fam-mini-stats">
      <li><strong>${summary.completed}</strong><span>${I.L("prog.counts.completed")}</span></li>
      <li><strong>${summary.dayCount}</strong><span>${I.L("prog.days")}</span></li>
      ${SKILLS.map((d) => html`<li class="d-${d.toLowerCase()}"><strong>${summary.byDomain[d].completed}</strong><span>${skillName(I, d)}</span></li>`)}
    </ul>
    <a href="${BASE}/family/progress?grades=${band}">${I.L("hub.progress.link")} ${icon("arrow-right")}</a>`;
}

export async function render(ctx, I) {
  const band = ctx.band;
  const [rows, help, shared, es, road] = await Promise.all([bandRows(band), loadFamilyHelp(), loadShared().catch(() => ({})), loadEsGuide(), loadRoad()]);
  const family = getFamily(ctx.prefs);
  const engage = getEngagement(ctx.prefs);
  const questDone = engage.questWeek === weekKey() && engage.questDone;
  const encouragement = {
    proud: I.S("I’m proud of the way you kept trying.", "Me enorgullece que hayas seguido intentando."),
    keepgoing: I.S("Your ideas are worth sharing. Keep going.", "Tus ideas merecen ser compartidas. Sigue adelante."),
    strategy: I.S("I noticed you used a helpful strategy today.", "Noté que usaste una estrategia útil hoy."),
  }[engage.encouragement];
  const options = sessionOptions({ rows, band, minutes: family.minutes, tiers: ctx.prefs.tiers });
  const summary = summarize(allRecords().filter((r) => r.band === band), new Map(rows.map((r) => [r.id, r])), es);
  const reco = options.recommended;
  const challenge = weeklyChallenge(road?.[band], allRecords(), todayISO());
  const continuePlan = options.continue.length ? options.continue : options.history ? reco : [];
  const win = shared.testWindow;
  const phase = testingWindowPhase(win);
  const date = (iso) => longDate(I, iso);
  const setupHref = `${BASE}/family/start?grades=${band}`;
  return {
    title: I.S("Families", "Familias"),
    html: html`${crumbs(I)}
      <section class="prog-hero fam-hero d-writing is-tint" aria-labelledby="famTitle">
        <div class="prog-hero-copy">
          <p class="eyebrow">${icon("families")} ${I.L("hub.eyebrow")}</p>
          <h1 id="famTitle" tabindex="-1">${I.L("hub.title")}</h1>
          <p class="lead">${I.L("hub.lead")}</p>
          <div class="fam-lang">
            <p class="fam-lang-label" id="famLangLabel">${I.L("hub.lang.heading")}</p>
            ${langSwitchHTML(I.mode, { large: true, idPrefix: "hub" })}
            <p class="fine">${I.L("hub.lang.note")}</p>
          </div>
          <div class="fam-cta">
            <button type="button" class="btn btn-primary btn-big" data-fam-who="together">${I.L("hub.cta.together")}${icon("arrow-right")}</button>
            <button type="button" class="btn btn-big" data-fam-who="independent">${I.L("hub.cta.independent")}</button>
            ${continuePlan.length ? html`<a class="btn btn-big" href="${playlistHref(continuePlan, "Continue",  band)}">${I.L("hub.cta.continue")}</a>` : ""}
            <a class="btn btn-big" href="${BASE}/family/trip?grades=${band}">${I.L("trip.cta")}</a>
            <a class="fam-how" href="#famSteps">${I.L("hub.cta.how")}</a>
          </div>
          ${phase ? html`<aside class="fam-window"><span class="fam-window-ico">${icon("calendar")}</span><div><span class="window-kicker">${I.L("hub.window.label")}</span><strong>${date(win.start)} – ${date(win.end)}</strong><span>${I.L("hub.window.note")}</span></div></aside>` : ""}
        </div>
        <div class="prog-hero-art"><img src="${ART}/family-home.svg" alt="" width="420" height="300" /></div>
      </section>
      ${subnavHTML(I, "", band)}

      ${encouragement ? html`<section class="fam-encouragement panel" aria-label="${I.L("hub.encourage.heading")}"><p class="eyebrow">${I.L("hub.encourage.heading")}</p><p lang="${I.spanish ? "es" : "en"}">“${encouragement}”</p><a href="${BASE}/?grades=${band}">${I.L("hub.encourage.child")}</a></section>` : ""}

      <section class="fam-quest panel" aria-labelledby="famQuestTitle"><p class="eyebrow">${I.L("hub.quest.eyebrow")}</p><h2 id="famQuestTitle">${I.L("hub.quest.title")}</h2><p>${I.L("hub.quest.lead")}</p>
        <h3>${I.L("chal.heading")}</h3>${challengeHTML(I, challenge, band)}
        <div class="fam-quest-roles"><article><h3>${I.L("hub.quest.adult")}</h3><p>${I.L("hub.quest.adult.prompt")}</p>${promptReadHTML(I, "What detail helped you choose that answer?", "¿Qué detalle te ayudó a elegir esa respuesta?")}</article><article><h3>${I.L("hub.quest.child")}</h3><p>${I.L("hub.quest.child.prompt")}</p>${promptReadHTML(I, "Point to a clue and explain how it helped.", "Señala una pista y explica cómo te ayudó.")}</article></div><p class="fine">${I.L("hub.quest.independent")}</p><div class="fam-cta">${questDone ? html`<p class="goal-done" role="status">${I.L("hub.quest.done")}</p><button type="button" class="btn" data-print>${I.L("hub.quest.print")}</button>` : html`<button type="button" class="btn btn-primary" data-family-quest>${I.L("hub.quest.complete")}</button><button type="button" class="btn" data-independent-quest>${I.L("hub.quest.independent.complete")}</button>`}<a class="btn" href="${continuePlan.length ? playlistHref(continuePlan, I.LS("plan.recommended"), band) : `${BASE}/family/practice?grades=${band}`}" data-quest-independent>${I.L("hub.quest.independent.action")}</a></div></section>

      <details class="fam-family-settings" data-family-settings><summary>${I.L("hub.settings.more")}</summary><section class="fam-encourage-settings" aria-labelledby="famEncourageTitle"><h2 id="famEncourageTitle">${I.L("hub.encourage.choose")}</h2><p>${I.L("hub.encourage.note")}</p><label class="field"><span>${I.L("hub.encourage.choose")}</span><select data-family-encouragement><option value="">${I.L("hub.encourage.none")}</option><option value="proud" ${engage.encouragement === "proud" ? "selected" : ""}>${I.L("hub.encourage.proud")}</option><option value="keepgoing" ${engage.encouragement === "keepgoing" ? "selected" : ""}>${I.L("hub.encourage.keepgoing")}</option><option value="strategy" ${engage.encouragement === "strategy" ? "selected" : ""}>${I.L("hub.encourage.strategy")}</option></select></label></section>

      <section class="fam-reminders" aria-labelledby="famReminderTitle"><h2 id="famReminderTitle">${I.L("hub.reminder.title")}</h2><p>${I.L("hub.reminder.explain")}</p><fieldset><legend>${I.L("hub.reminder.days")}</legend>${[1,2,3,4,5,6,0].map((d) => html`<label><input type="checkbox" data-reminder-day="${d}" ${engage.reminder.days.includes(d) ? "checked" : ""} /> ${I.L(`hub.reminder.day.${d}`)}</label>`)}</fieldset><label class="field"><span>${I.L("hub.reminder.time")}</span><input type="time" min="${engage.reminder.quiet ? "07:00" : "00:00"}" max="${engage.reminder.quiet ? "21:00" : "23:59"}" value="${engage.reminder.time}" data-reminder-time /></label><label class="check-row"><input type="checkbox" data-reminder-quiet ${engage.reminder.quiet ? "checked" : ""} /> ${I.L("hub.reminder.quiet")}</label><div class="fam-cta"><button type="button" class="btn btn-primary" data-reminder-enable>${engage.reminder.enabled ? I.L("hub.reminder.enabled") : I.L("hub.reminder.enable")}</button><button type="button" class="btn" data-reminder-off>${I.L("hub.reminder.off")}</button></div><p class="fine" data-reminder-status role="status">${I.L("hub.reminder.tabonly")}</p></section></details>

      <section class="fam-steps-intro" id="famSteps" aria-labelledby="famStepsTitle" tabindex="-1">
        <h2 id="famStepsTitle">${I.L("hub.steps.heading")}</h2>
        <ol class="fam-three">
          ${(help?.steps || []).map((step, n) => html`<li><span class="fam-num" aria-hidden="true">${n + 1}</span><div><h3>${I.TO(step.title)}</h3><p>${I.TO(step.text)}</p></div></li>`)}
        </ol>
        <p class="fam-grade-line">${gradeSwitch(band, ctx.bands)}</p>
      </section>

      <section class="fam-skills" aria-labelledby="famSkillsTitle">
        <div class="section-head"><h2 id="famSkillsTitle">${I.L("hub.skills.heading")}</h2><p class="fine">${I.L("hub.skills.lead")} · ${bandLabel(band)}</p></div>
        ${skillCards(I, rows, options, band)}
      </section>

      <section class="fam-reco panel" aria-labelledby="famRecoTitle">
        <h2 id="famRecoTitle">${I.L("hub.reco.heading")}</h2>
        ${reco.length
          ? html`<p class="fam-basis ${options.history ? "is-history" : "is-start"}">${I.L(options.history ? "hub.reco.basis.history" : "hub.reco.basis.start")}</p>
            <ol class="plan-preview">
              ${reco.map((r) => html`<li><span class="plan-dot d-${r.domain.toLowerCase()}">${skillIcon(r.domain)}</span><span><span lang="en">${r.title}</span><span class="fine">${skillName(I, r.domain)} · ${I.L("common.minutes", { n: sessionMinutes([r]) })}</span></span></li>`)}
            </ol>
            <a class="btn btn-primary btn-big" href="${playlistHref(reco, I.LS("plan.recommended"), band)}">${I.L("hub.reco.start")} — ${I.L("hub.reco.size", { n: reco.length, min: sessionMinutes(reco) })}${icon("arrow-right")}</a>
            <a class="fam-alt" href="${BASE}/family/practice?grades=${band}">${I.L("plan.title")}</a>`
          : html`<p>${I.L("hub.reco.empty")}</p>`}
      </section>

      <section class="fam-tips" aria-labelledby="famTipsTitle">
        <h2 id="famTipsTitle">${I.L("hub.tips.heading")}</h2>
        <ul class="fam-tip-grid">
          ${(help?.tips || []).map((tip) => html`<li><span class="fam-tile">${tipIcon(tip.icon)}</span><div><h3>${I.TO(tip.title)}</h3><p>${I.TO(tip.body)}</p></div></li>`)}
        </ul>
      </section>

      <section class="fam-preview panel" aria-labelledby="famPrevTitle">
        <h2 id="famPrevTitle">${I.L("hub.progress.heading")}</h2>
        ${progressPreview(I, summary, band)}
      </section>

      <section class="fam-more" aria-labelledby="famMoreTitle">
        <h2 id="famMoreTitle">${I.L("hub.more.heading")}</h2>
        <ul class="fam-links">
          <li><a href="${BASE}/family/help?grades=${band}">${icon("help")} ${I.L("hub.more.help")}</a></li>
          <li><a href="${BASE}/family/save?grades=${band}">${icon("save")} ${I.L("hub.more.save")}</a></li>
          <li><a href="${BASE}/flashcards?grades=${band}">${icon("words")} ${I.L("hub.more.cards")}</a></li>
          <li><a href="${setupHref}">${icon("settings")} ${I.L("hub.more.setup")}</a></li>
          <li><a href="${BASE}/family/practice?grades=${band}#finder">${icon("library")} ${I.L("hub.more.choose")}</a></li>
        </ul>
        <p class="fine">${I.L("hub.disclaimer")}</p>
      </section>`,
  };
}

export function onClick(e, ctx) {
  const S = (en, es) => ctx.prefs.lang === "es" ? es : ctx.prefs.lang === "bi" ? `${en} / ${es}` : en;
  if (e.target.closest("[data-family-quest], [data-independent-quest]")) {
    saveEngagement(ctx, { questWeek: weekKey(), questDone: true });
    award(ctx, `family-quest:${weekKey()}`, 2, "Family quest participation");
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-reminder-enable]")) {
    const status = document.querySelector("[data-reminder-status]");
    if (!("Notification" in window)) { if (status) status.textContent = S("Notifications are not supported in this browser. The family planner remains available.", "Este navegador no admite notificaciones. El plan familiar sigue disponible."); return true; }
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        saveEngagement(ctx, { reminder: { ...getEngagement(ctx.prefs).reminder, enabled: true } });
        scheduleReminder(ctx);
        ctx.rerender();
      } else if (status) status.textContent = S("Permission was not granted. Reminders are off; the planner still works.", "No se concedió el permiso. Los recordatorios están apagados; el plan sigue funcionando.");
    });
    return true;
  }
  if (e.target.closest("[data-reminder-off]")) { saveEngagement(ctx, { reminder: { ...getEngagement(ctx.prefs).reminder, enabled: false } }); ctx.rerender(); return true; }
  if (e.target.closest("[data-print]")) { window.print(); return true; }
  const who = e.target.closest("[data-fam-who]");
  if (!who) return false;
  const family = getFamily(ctx.prefs);
  ctx.setPrefs({ family: { ...family, who: who.dataset.famWho } });
  ctx.navigate(`${BASE}/family/${family.done || family.skipped ? "practice" : "start"}?grades=${ctx.band}`);
  return true;
}

export function onChange(e, ctx) {
  const state = getEngagement(ctx.prefs);
  if (e.target.matches("[data-family-encouragement]")) { const open = document.querySelector("[data-family-settings]")?.open; saveEngagement(ctx, { encouragement: e.target.value }); ctx.rerender().then(() => { const details = document.querySelector("[data-family-settings]"); if (details) details.open = open; }); return; }
  if (e.target.matches("[data-reminder-day]")) {
    const day = Number(e.target.dataset.reminderDay);
    const days = new Set(state.reminder.days);
    e.target.checked ? days.add(day) : days.delete(day);
    saveEngagement(ctx, { reminder: { ...state.reminder, days: [...days].sort() } });
  }
  if (e.target.matches("[data-reminder-time]")) saveEngagement(ctx, { reminder: { ...state.reminder, time: e.target.value } });
  if (e.target.matches("[data-reminder-quiet]")) saveEngagement(ctx, { reminder: { ...state.reminder, quiet: e.target.checked } });
}

export function mount(_root, ctx) {
  const reminder = getEngagement(ctx.prefs).reminder;
  if (reminder.enabled && "Notification" in window && Notification.permission === "granted") scheduleReminder(ctx);
}

let reminderTimer;
function scheduleReminder(ctx) {
  if (reminderTimer) return;
  reminderTimer = window.setInterval(() => {
    const reminder = getEngagement(ctx.prefs).reminder;
    const now = new Date();
    if (!reminder.enabled || Notification.permission !== "granted" || !reminder.days.includes(now.getDay())) return;
    const selected = reminder.time.split(":").map(Number);
    if (reminder.quiet && (now.getHours() < 7 || now.getHours() >= 21)) return;
    if (now.getHours() !== selected[0] || now.getMinutes() !== selected[1]) return;
    const stamp = `${todayISO(now)}:${reminder.time}`;
    if (sessionStorage.getItem("ewl-family-reminder") === stamp) return;
    sessionStorage.setItem("ewl-family-reminder", stamp);
    const spanish = ctx.prefs.lang === "es";
    new Notification(spanish ? "Práctica familiar de EduWonderLab" : "EduWonderLab family practice", { body: spanish ? "Hay una práctica breve y opcional cuando le venga bien a su familia." : "A short optional practice moment is ready when it works for your family." });
  }, 30000);
}
