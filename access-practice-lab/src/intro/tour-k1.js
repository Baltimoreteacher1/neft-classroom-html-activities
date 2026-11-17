// The K–1 Teacher Tour (/start/tour-k1, also /start/tour?grades=K|1): its own tour for Kindergarten and Grade 1,
// built around the early activities as they really work. Nine steps, each with Mr. Neft's scripted line, what the
// step is, the directions a teacher follows, a "Try it" that opens the real activity inside the page (a sandboxed
// preview frame, as the Grades 3–8 tour does) and more real activities for the chosen grade. Words and activity
// records live in tour-k1-data.js; the quick-reference PDF in tour-k1-quickref.js.
//
// The step is in the address (?stop=, like the exploration), so Back, a reload and a shared link land on it; the
// grade (?grades=K|1) and the furthest step are saved on this device (intro key "tourK1"), so opening the tour again
// resumes where the teacher stopped. English and Spanish through the lab's i18n. Nothing is sent anywhere.
import { i18nFor, langMode, langSwitchHTML } from "../i18n.js";
import { BASE, announce, html, icon, raw } from "../util.js";
import { savePick } from "./band.js";
import { FAMILY_HANDOUT_K2 } from "./family-k2-data.js";
import { guideArtSVG } from "./guide-art.js";
import { withReturn } from "./return-bar.js";
import { progressHTML, stepRailHTML, teacherBand } from "./shell.js";
import { clearIntro, loadIntro, updateIntro } from "./state.js";
import {
  K1_ACTIVITIES,
  K1_COPY,
  K1_LINKS,
  K1_PICKS,
  K1_ROUTE,
  K1_STEPS,
  K1_STORE_KEY,
  SKILL_STEP,
  k1PickFrom,
  normalizeK1,
  pickNames,
  stepMore,
  stepTry,
} from "./tour-k1-data.js";

const LAST = K1_STEPS.length - 1;
let openKey = ""; // the activity open in the preview frame, by K1_ACTIVITIES key
let openStep = -1;
let confirmRestart = false;

export const k1Href = (n, pick) => `${BASE}${K1_ROUTE}?stop=${n + 1}&grades=${pick}`;
const saved = () => normalizeK1(loadIntro()[K1_STORE_KEY]);
const save = (patch) =>
  updateIntro(K1_STORE_KEY, (x) => normalizeK1({ ...normalizeK1(x), ...patch }));
const keyOf = (rec) => Object.keys(K1_ACTIVITIES).find((k) => K1_ACTIVITIES[k] === rec) || "";

/** Which step to show: ?stop= first, then a Start-page skill (?skill=), then where this device stopped. */
function stepOf(route, s) {
  const asked = Number.parseInt(route.stop, 10);
  if (Number.isFinite(asked)) return Math.min(LAST, Math.max(0, asked - 1));
  const bySkill = K1_STEPS.findIndex((x) => x.id === SKILL_STEP[route.skill]);
  return bySkill >= 0 ? bySkill : s.step;
}

const title = (I, a) =>
  typeof a.title === "string"
    ? html`<span lang="en">${a.title}</span>`
    : I.T(a.title.en, a.title.es);

function pickerHTML(I, pick) {
  return html`<div class="k1t-picker" role="group" aria-labelledby="k1tPickLabel">
    <span class="k1t-picker-label" id="k1tPickLabel"
      >${I.T(K1_COPY.pickLabel.en, K1_COPY.pickLabel.es)}</span
    >
    ${K1_PICKS.map(
      (id) =>
        html`<button
          type="button"
          class="btn k1t-pick"
          data-k1t-pick="${id}"
          aria-pressed="${String(id === pick)}"
        >
          ${I.T(pickNames[id].en, pickNames[id].es)}
        </button>`,
    )}
  </div>`;
}

function coachHTML(I, step) {
  return html`<section class="nb k1t-coach" aria-label="Mr. Neft">
    <div class="nb-face" aria-hidden="true">${raw(guideArtSVG())}</div>
    <div class="nb-main">
      <p class="nb-name">
        <strong>Mr. Neft</strong><span>${I.T(K1_COPY.coachRole.en, K1_COPY.coachRole.es)}</span>
      </p>
      <p class="nb-say">${I.T(step.neft.en, step.neft.es)}</p>
    </div>
  </section>`;
}

/** A preview frame of the real page. Preview mode (window.name) keeps answers out of this device's progress. */
function frameHTML(I, a) {
  const src = `${BASE}${a.route}&frame=1`;
  return html`<div class="k1t-frame">
    <iframe
      class="k1t-iframe"
      name="lp-tour-preview"
      title="${I.S(`Live activity: ${typeof a.title === "string" ? a.title : a.title.en}`, `Actividad en vivo: ${typeof a.title === "string" ? a.title : a.title.es}`)}"
      src="${src}"
      allow="microphone; autoplay"
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-popups allow-popups-to-escape-sandbox"
    ></iframe>
    <p class="fine">${I.T(K1_COPY.frameNote.en, K1_COPY.frameNote.es)}</p>
  </div>`;
}

/** One activity: its name, Try it (opens the frame in place) and Open the activity (the full page, with a way back). */
function activityHTML(I, a, { primary = false } = {}) {
  const key = keyOf(a);
  const open = openKey === key;
  return html`<li class="k1t-act${primary ? " is-primary" : ""}" data-k1t-act="${key}">
    <p class="k1t-act-name">
      <span class="in-ic" aria-hidden="true"
        >${icon(a.kind === "page" ? "sparkle" : a.domain.toLowerCase())}</span
      ><strong>${title(I, a)}</strong
      >${a.kind === "activity" ? html`<span class="fine">${a.domain} · ${a.level}</span>` : ""}
    </p>
    <p class="k1t-act-btns">
      <button
        type="button"
        data-k1t-try="${key}"
        class="btn${primary ? " btn-primary" : ""}"
        aria-expanded="${String(open)}"
      >
        ${icon(open ? "close" : "play")}${open ? I.T(K1_COPY.close.en, K1_COPY.close.es) : I.T(K1_COPY.tryIt.en, K1_COPY.tryIt.es)}<span
          class="visually-hidden"
          >: ${typeof a.title === "string" ? a.title : I.S(a.title.en, a.title.es)}</span
        >
      </button>
      <a class="btn ghost" href="${withReturn(`${BASE}${a.route}`, "tourk1")}"
        >${I.T(K1_COPY.open.en, K1_COPY.open.es)}<span class="visually-hidden"
          >: ${typeof a.title === "string" ? a.title : I.S(a.title.en, a.title.es)}</span
        >${icon("arrow-right")}</a
      >
    </p>
    ${open ? frameHTML(I, a) : ""}
  </li>`;
}

function linksHTML(I, step, pick) {
  const out = (step.links || []).map((id) => {
    const l = K1_LINKS[id];
    return html`<li>
      <a href="${withReturn(`${BASE}${l.route}?grades=${pick}`, "tourk1")}"
        >${I.T(l.label.en, l.label.es)}</a
      >
    </li>`;
  });
  if (step.id === "families") {
    for (const lang of ["en", "es"]) {
      const f = FAMILY_HANDOUT_K2[lang];
      const name = lang === "en" ? "English" : "Español";
      out.push(
        html`<li>
          ${I.T(K1_COPY.handout.en, K1_COPY.handout.es)} (<span lang="${lang}">${name}</span>):
          <a href="${f.pdf}">PDF</a> · <a href="${f.docx}">Word</a>
        </li>`,
      );
    }
  }
  return out.length
    ? html`<ul class="k1t-links">
        ${out}
      </ul>`
    : "";
}

function stepHTML(I, step, n, pick) {
  const main = stepTry(step, pick);
  const more = stepMore(step, pick);
  return html`<section class="in-panel k1t-step" aria-labelledby="k1tStep">
    <h2 id="k1tStep">${I.T(step.title.en, step.title.es)}</h2>
    <p>${I.T(step.what.en, step.what.es)}</p>
    <h3>${I.T(K1_COPY.directions.en, K1_COPY.directions.es)}</h3>
    <ol class="k1t-do">
      ${step.directions.map((d) => html`<li>${I.T(d.en, d.es)}</li>`)}
    </ol>
    <ul class="k1t-acts">
      ${activityHTML(I, main, { primary: true })}
    </ul>
    ${
      more.length
        ? html`<h3>${I.T(K1_COPY.more.en, K1_COPY.more.es)}</h3>
            <ul class="k1t-acts">
              ${more.map((a) => activityHTML(I, a))}
            </ul>`
        : ""
    }
    ${linksHTML(I, step, pick)}
    ${
      n === LAST
        ? html`<h3>${I.T(K1_COPY.quickref.en, K1_COPY.quickref.es)}</h3>
            <p class="k1t-act-btns">
              <button type="button" class="btn btn-primary" data-k1t-pdf>
                ${icon("save")}${I.T(K1_COPY.quickrefPdf.en, K1_COPY.quickrefPdf.es)}
              </button>
              <button type="button" class="btn" data-k1t-print>
                ${icon("print")}${I.T(K1_COPY.print.en, K1_COPY.print.es)}
              </button>
            </p>
            <p class="fine" role="status" data-k1t-note></p>`
        : ""
    }
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const route = ctx.route || {};
  let s = saved();
  const pick = k1PickFrom(route.grades, s.pick);
  const n = stepOf(route, s);
  const resumed = !route.stop && !route.skill && s.step > 0 && n === s.step;
  if (openStep !== n) {
    openKey = "";
    openStep = n;
  }
  s = save({ pick, step: n, furthest: Math.max(s.furthest, n), done: s.done || n === LAST });
  const step = K1_STEPS[n];
  const t = (v) => I.T(v.en, v.es);
  const stepOfText = (v) => v.replace("{n}", n + 1).replace("{total}", K1_STEPS.length);
  return {
    title: I.S(K1_COPY.title.en, K1_COPY.title.es),
    html: html`<article
      class="in-page k1t"
      aria-labelledby="introTitle"
      data-k1t-root
      data-k1t-step="${step.id}"
      data-k1t-grade="${pick}"
    >
      ${teacherBand({
        active: "tour",
        eyebrow: t(K1_COPY.eyebrow),
        title: html`${t(K1_COPY.title)} · ${t(pickNames[pick])}`,
        lead: t(K1_COPY.lead),
        meta: progressHTML(
          n,
          K1_STEPS.length,
          I.T(stepOfText(K1_COPY.stepOf.en), stepOfText(K1_COPY.stepOf.es)),
        ),
      })}
      <div class="k1t-tools">
        ${pickerHTML(I, pick)} ${langSwitchHTML(langMode(ctx.prefs), { idPrefix: "k1tLang" })}
      </div>
      ${
        resumed
          ? html`<p class="in-note k1t-resumed" role="status">
              ${icon("check")}${t(K1_COPY.resumed)}
            </p>`
          : ""
      }
      <div class="ts-layout">
        ${stepRailHTML({
          label: I.S(K1_COPY.rail.en, K1_COPY.rail.es),
          steps: K1_STEPS.map((x) => ({ name: t(x.name) })),
          current: n,
          hrefFor: (i) => k1Href(i, pick),
          doneFor: (_x, i) => i < s.furthest || (s.done && i <= LAST),
        })}
        <div class="ts-main">
          ${coachHTML(I, step)} ${stepHTML(I, step, n, pick)}
          <nav
            class="in-nav ts-actions"
            aria-label="${I.S("Tour controls", "Controles del recorrido")}"
          >
            ${n > 0 ? html`<a class="btn" href="${k1Href(n - 1, pick)}">${icon("arrow-left")}${t(K1_COPY.back)}</a>` : html`<span></span>`}
            <a class="btn ghost" href="${BASE}/start?grades=${pick}">${t(K1_COPY.exit)}</a>
            ${
              n < LAST
                ? html`<a class="btn btn-primary" data-k1t-next href="${k1Href(n + 1, pick)}"
                    >${t(K1_COPY.next)}: ${t(K1_STEPS[n + 1].name)}${icon("arrow-right")}</a
                  >`
                : html`<a class="btn btn-primary" href="${BASE}/start?grades=${pick}"
                    >${t(K1_COPY.done)}${icon("check")}</a
                  >`
            }
          </nav>
          <footer class="in-foot">
            <p class="fine">${t(K1_COPY.saved)}</p>
            <p class="fine"><a href="${BASE}${K1_LINKS.tour38.route}">${t(K1_COPY.older)}</a></p>
            ${
              confirmRestart
                ? html`<p class="fine" role="alert">
                    <button type="button" class="btn small" data-k1t-restart="yes">
                      ${t(K1_COPY.restart)}
                    </button>
                    <button type="button" class="btn ghost small" data-k1t-restart="no">
                      ${I.T("Keep my place", "Conservar mi lugar")}
                    </button>
                  </p>`
                : html`<p>
                    <button type="button" class="btn ghost small" data-k1t-restart="ask">
                      ${t(K1_COPY.restart)}
                    </button>
                  </p>`
            }
          </footer>
        </div>
      </div>
    </article>`,
  };
}

function download(bytes, name) {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function onClick(e, ctx) {
  const el = (sel) => e.target.closest?.(sel);
  const I = i18nFor(ctx);
  const pickBtn = el("[data-k1t-pick]");
  if (pickBtn) {
    const id = pickBtn.dataset.k1tPick;
    if (!K1_PICKS.includes(id)) return true;
    save({ pick: id });
    savePick(id); // the Start page and the Site Guide follow the same grade
    openKey = "";
    const url = new URL(location.href);
    url.searchParams.set("grades", id);
    history.replaceState({}, "", url.pathname + url.search + url.hash);
    ctx.rerender();
    announce(I.S(`Showing ${pickNames[id].en}.`, `Mostrando ${pickNames[id].es}.`));
    return true;
  }
  const tryBtn = el("[data-k1t-try]");
  if (tryBtn) {
    const key = tryBtn.dataset.k1tTry;
    openKey = openKey === key || !K1_ACTIVITIES[key] ? "" : key;
    ctx.rerender();
    return true;
  }
  const restart = el("[data-k1t-restart]");
  if (restart) {
    const mode = restart.dataset.k1tRestart;
    confirmRestart = mode === "ask";
    if (mode === "yes") {
      const pick = saved().pick;
      clearIntro(K1_STORE_KEY);
      save({ pick });
      openKey = "";
      ctx.navigate(k1Href(0, pick), { replace: true });
    } else ctx.rerender();
    return true;
  }
  if (el("[data-k1t-pdf]")) {
    const pick = saved().pick;
    const lang = langMode(ctx.prefs) === "es" ? "es" : "en";
    import("./tour-k1-quickref.js").then(({ k1QuickrefPdf }) => {
      download(
        k1QuickrefPdf(pick, lang),
        `k1-tour-quick-reference-${pick.toLowerCase()}${lang === "es" ? "-es" : ""}.pdf`,
      );
      const note = document.querySelector("[data-k1t-note]");
      if (note) note.textContent = I.S(K1_COPY.pdfDone.en, K1_COPY.pdfDone.es);
    });
    return true;
  }
  if (el("[data-k1t-print]")) {
    window.print();
    return true;
  }
  return false;
}

export const unmount = () => {
  openKey = "";
  openStep = -1;
  confirmRestart = false;
};
