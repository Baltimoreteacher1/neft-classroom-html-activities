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

const tipIcon = (name) => icon(name === "microphone" ? "record" : name || "info");

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
  const options = sessionOptions({ rows, band, minutes: family.minutes, tiers: ctx.prefs.tiers });
  const everyBandRows = (await Promise.all(ctx.bands.map((b) => bandRows(b)))).flat();
  const summary = summarize(allRecords(), new Map(everyBandRows.map((r) => [r.id, r])), es);
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
            <a class="fam-how" href="#famSteps">${I.L("hub.cta.how")}</a>
          </div>
          ${phase ? html`<aside class="fam-window"><span class="fam-window-ico">${icon("calendar")}</span><div><span class="window-kicker">${I.L("hub.window.label")}</span><strong>${date(win.start)} – ${date(win.end)}</strong><span>${I.L("hub.window.note")}</span></div></aside>` : ""}
        </div>
        <div class="prog-hero-art"><img src="${ART}/family-home.svg" alt="" width="420" height="300" /></div>
      </section>
      ${subnavHTML(I, "", band)}

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

      <section class="fam-chal panel" aria-labelledby="famChalTitle">
        <h2 id="famChalTitle">${I.L("chal.heading")}</h2>
        ${challengeHTML(I, challenge, band)}
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
          <li><a href="${setupHref}">${icon("settings")} ${I.L("hub.more.setup")}</a></li>
          <li><a href="${BASE}/family/practice?grades=${band}#finder">${icon("library")} ${I.L("hub.more.choose")}</a></li>
        </ul>
        <p class="fine">${I.L("hub.disclaimer")}</p>
      </section>`,
  };
}

export function onClick(e, ctx) {
  const who = e.target.closest("[data-fam-who]");
  if (!who) return false;
  const family = getFamily(ctx.prefs);
  ctx.setPrefs({ family: { ...family, who: who.dataset.famWho } });
  ctx.navigate(`${BASE}/family/${family.done || family.skipped ? "practice" : "start"}?grades=${ctx.band}`);
  return true;
}
