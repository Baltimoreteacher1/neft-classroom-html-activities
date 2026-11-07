// My portfolio and showcase (/portfolio): my best work, my words and my growth, collected from across the lab.
//   /portfolio                the learner's own view (showcase, recordings, reflections, vocabulary garden, timeline)
//   /portfolio?view=family    a family-share view in plain words: no scores, no levels, no shields, no counts to compare
// Printing either view gives a language portfolio page (print styles in experience.css). Everything is read from work
// already saved on this device (src/experience-data.js, src/lang/portfolio.js); the lab sends nothing anywhere.
// It reuses Passport rather than copying it: the shield board (views/shields.js), the paper passport menu
// (paper-passport.js) and the Passport page itself for backup, recordings and the export code.
import { crumbsHTML } from "../components.js";
import { loadExperience } from "../experience-data.js";
import { i18nFor } from "../i18n.js";
import { BADGES, evaluate } from "../lang/collection.js";
import { collect } from "../lang/portfolio.js";
import { paperPassportMenu } from "../paper-passport.js";
import { bandLabel, formatDate, html, icon, todayISO } from "../util.js";
import { getStudentName } from "../store.js";
import { evidenceFrom, recordNewBadges } from "./collection.js";
import { shieldsHTML } from "./shields.js";

const BASE = "/access-practice-lab";
const SOURCE = {
  writing: ["Writing Studio", "Estudio de escritura"],
  world: ["Language World", "Mundo del lenguaje"],
  warmup: ["Daily warm-up", "Calentamiento diario"],
};
const STAGE = { 1: ["seed", "semilla"], 2: ["sprout", "brote"], 3: ["bloom", "flor"] };
const day = (t) =>
  t ? formatDate(String(t).slice(0, 10), { month: "short", day: "numeric", year: "numeric" }) : "";

const plant = (stage) =>
  stage === 3
    ? html`<svg viewBox="0 0 40 44" class="pf-plant" aria-hidden="true" focusable="false">
        <path d="M20 42V22" stroke="#3b7a3b" stroke-width="3" stroke-linecap="round" />
        <circle cx="20" cy="14" r="6" fill="#f2c15b" stroke="#1d2b58" stroke-width="2" />
        <g fill="#dba3b9" stroke="#1d2b58" stroke-width="2">
          <circle cx="20" cy="5" r="4" />
          <circle cx="29" cy="12" r="4" />
          <circle cx="26" cy="21" r="4" />
          <circle cx="14" cy="21" r="4" />
          <circle cx="11" cy="12" r="4" />
        </g>
      </svg>`
    : stage === 2
      ? html`<svg viewBox="0 0 40 44" class="pf-plant" aria-hidden="true" focusable="false">
          <path d="M20 42V20" stroke="#3b7a3b" stroke-width="3" stroke-linecap="round" />
          <path
            d="M20 26c-10 0-12-8-12-12 8 0 12 4 12 12Zm0-4c8 0 12-4 12-10-8 0-12 4-12 10Z"
            fill="#7fbf63"
            stroke="#1d2b58"
            stroke-width="2"
            stroke-linejoin="round"
          />
        </svg>`
      : html`<svg viewBox="0 0 40 44" class="pf-plant" aria-hidden="true" focusable="false">
          <path
            d="M6 42c2-10 10-14 14-14s12 4 14 14Z"
            fill="#9a4a26"
            stroke="#1d2b58"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <ellipse cx="20" cy="30" rx="4" ry="5" fill="#f5d6a8" stroke="#1d2b58" stroke-width="2" />
        </svg>`;

function empty(I, text, href, label) {
  return html`<p class="pf-empty">${text} ${href ? html`<a href="${href}">${label}</a>` : ""}</p>`;
}

function sampleCard(I, s, { pinned, pinnable }) {
  const src = SOURCE[s.source];
  return html`<article class="pf-sample card">
    <header>
      <h3>${s.title ? html`<span lang="en">${s.title}</span>` : I.T(...src)}</h3>
      <p class="fine">
        ${I.T(...src)} ·
        ${day(s.t)}${s.revised ? html` · ${I.T(`revised (${s.versions} versions)`, `revisado (${s.versions} versiones)`)}` : ""}
      </p>
    </header>
    ${
      s.revised
        ? html`<div class="pf-pair">
            <figure>
              <figcaption class="fine">${I.T("First version", "Primera versión")}</figcaption>
              <p lang="en">${s.first}</p>
            </figure>
            <figure>
              <figcaption class="fine">${I.T("Latest version", "Última versión")}</figcaption>
              <p lang="en">${s.text}</p>
            </figure>
          </div>`
        : html`<p class="pf-text" lang="en">${s.text}</p>`
    }
    ${s.reflection ? html`<p class="fine"><strong>${I.T("What I improved:", "Lo que mejoré:")}</strong> <span lang="en">${s.reflection}</span></p>` : ""}
    ${pinnable ? html`<label class="pf-pin no-print"><input type="checkbox" data-pf-pin="${s.key}" ${pinned ? "checked" : ""} /> <span>${I.T("Keep in my showcase", "Mantener en mi muestra")}</span></label>` : ""}
  </article>`;
}

function gardenHTML(I, garden, family) {
  if (!garden.length)
    return empty(
      I,
      I.T(
        "Words you meet in the daily warm-up, the reading room and word cards grow here.",
        "Las palabras que conoces en el calentamiento diario, la sala de lectura y las tarjetas crecen aquí.",
      ),
      `${BASE}/warmup`,
      I.T("Start today's warm-up", "Empezar el calentamiento de hoy"),
    );
  return html`<ul class="pf-garden">
      ${garden.slice(0, 60).map(
        (g) =>
          html`<li class="pf-word s-${g.stage}">
            ${plant(g.stage)}<span class="pf-word-text"
              ><strong lang="en">${g.word}</strong
              >${g.es ? html`<span lang="es" class="fine">${g.es}</span>` : ""}${family ? "" : html`<span class="fine">${I.T(...STAGE[g.stage])}</span>`}</span
            >
          </li>`,
      )}
    </ul>
    ${family ? "" : html`<p class="fine">${I.T("A seed is a word I met. A sprout is a word I have used more than once. A bloom is a word I have worked with four or more times. Words only grow; they never shrink.", "Una semilla es una palabra que conocí. Un brote es una palabra que usé más de una vez. Una flor es una palabra con la que trabajé cuatro veces o más. Las palabras solo crecen; nunca se encogen.")}</p>`}`;
}

function timelineHTML(I, tl) {
  if (!tl.length)
    return empty(
      I,
      I.T(
        "Your moments appear here as you practice, one week at a time.",
        "Tus momentos aparecen aquí a medida que practicas, semana por semana.",
      ),
      `${BASE}/library`,
      I.T("Find an activity", "Buscar una actividad"),
    );
  return html`<ol class="pf-timeline">
    ${tl.slice(0, 12).map(
      ({ week, items }) =>
        html`<li>
          <h3>${I.T(`Week of ${formatDate(week)}`, `Semana del ${formatDate(week)}`)}</h3>
          <ul>
            ${items.slice(0, 6).map((e) => html`<li class="k-${e.kind}">${I.T(e.en, e.es)}</li>`)}
          </ul>
          ${items.length > 6 ? html`<p class="fine">${I.T(`and ${items.length - 6} more`, `y ${items.length - 6} más`)}</p>` : ""}
        </li>`,
    )}
  </ol>`;
}

function recordingsHTML(I, list) {
  if (!list.length)
    return empty(
      I,
      I.T(
        "Speaking takes from the studios show up here. Recordings stay on this device and you choose what to keep.",
        "Las tomas de hablar de los estudios aparecen aquí. Las grabaciones se quedan en este dispositivo y tú eliges qué guardar.",
      ),
      `${BASE}/speak`,
      I.T("Open the Speaking Studio", "Abrir el Estudio de expresión oral"),
    );
  return html`<ul class="pf-list">
      ${list.slice(0, 12).map((r) => html`<li><strong lang="en">${r.title}</strong> · ${day(r.t)}${r.seconds ? html` · ${I.T(`${r.seconds} seconds`, `${r.seconds} segundos`)}` : ""} · ${r.kept ? I.T("kept on this device", "guardada en este dispositivo") : I.T("not kept", "no guardada")}</li>`)}
    </ul>
    <p class="fine">
      ${I.T("Only the details are listed here. To listen to a kept recording or delete it, open Passport.", "Aquí solo se listan los datos. Para escuchar una grabación guardada o borrarla, abre el Pasaporte.")}
    </p>`;
}

function reflectionsHTML(I, list) {
  if (!list.length)
    return empty(
      I,
      I.T(
        "Add what you read to your reading log, with a note in your own words.",
        "Añade lo que lees a tu registro de lectura, con una nota con tus propias palabras.",
      ),
      `${BASE}/reading-room`,
      I.T("Open the Reading Room", "Abrir la Sala de lectura"),
    );
  return html`<ul class="pf-list">
    ${list.slice(0, 10).map((r) => html`<li><strong lang="en">${r.title}</strong> · ${day(r.t)}${r.minutes ? html` · ${I.T(`${r.minutes} min`, `${r.minutes} min`)}` : ""}${r.note ? html`<br /><span lang="en">${r.note}</span>` : ""}</li>`)}
  </ul>`;
}

function headHTML(I, band, family, name, today) {
  const q = `?grades=${band}`;
  return html`<header class="pf-head">
    <p class="eyebrow">
      ${family ? I.T("To share with my family", "Para compartir con mi familia") : I.T("Only I can see this unless I print it", "Solo yo puedo ver esto si no lo imprimo")}
    </p>
    <h1 id="pfTitle" tabindex="-1">
      ${family ? I.T("My language portfolio", "Mi portafolio de lenguaje") : I.T("My portfolio and showcase", "Mi portafolio y muestra")}
    </h1>
    <p class="pf-who">
      ${I.T("Name:", "Nombre:")} <strong>${name || "________________"}</strong> · ${bandLabel(band)}
      · ${day(today)}
    </p>
    <nav
      class="pf-tabs row-actions no-print"
      aria-label="${I.S("Portfolio views", "Vistas del portafolio")}"
    >
      <a
        class="chip${family ? "" : " is-on"}"
        href="${BASE}/portfolio${q}"
        ${family ? "" : 'aria-current="page"'}
        >${I.T("For me", "Para mí")}</a
      >
      <a
        class="chip${family ? " is-on" : ""}"
        href="${BASE}/portfolio${q}&view=family"
        ${family ? 'aria-current="page"' : ""}
        >${I.T("Share with family", "Compartir con la familia")}</a
      >
      <button type="button" class="btn btn-primary" data-print>
        ${icon("print")} ${I.T("Print or save as PDF", "Imprimir o guardar como PDF")}
      </button>
    </nav>
  </header>`;
}

function familyView(I, band, x, p, name, today) {
  const words = p.garden.slice(0, 12);
  const days = new Set([...x.practice, ...Object.keys(x.warmup.days).map((k) => k.split("|")[1])])
    .size;
  return html`<article class="pf-page pf-family" aria-labelledby="pfTitle">
    ${headHTML(I, band, true, name, today)}
    <section class="panel pf-letter">
      <h2>${I.T("Hello, family", "Hola, familia")}</h2>
      <p>
        ${I.T("This is some of the work I am proud of. It is in my own words. This page does not show test scores or levels. It shows what I am learning to do with English.", "Este es parte del trabajo del que me siento orgulloso. Está escrito con mis propias palabras. Esta página no muestra puntajes de pruebas ni niveles. Muestra lo que estoy aprendiendo a hacer con el inglés.")}
      </p>
      ${days ? html`<p>${I.T(`I have practiced English on ${days} ${days === 1 ? "day" : "days"}.`, `He practicado inglés en ${days} ${days === 1 ? "día" : "días"}.`)}</p>` : ""}
    </section>
    <section class="panel" aria-labelledby="pfFamWrite">
      <h2 id="pfFamWrite">${I.T("My writing", "Mi escritura")}</h2>
      ${p.showcase.length ? html`<div class="pf-samples">${p.showcase.map((s) => sampleCard(I, { ...s, revised: false, reflection: s.reflection }, { pinned: false, pinnable: false }))}</div>` : empty(I, I.T("My writing will appear here after I write in the lab.", "Mi escritura aparecerá aquí después de escribir en el laboratorio."))}
    </section>
    <section class="panel" aria-labelledby="pfFamWords">
      <h2 id="pfFamWords">${I.T("Words I know", "Palabras que conozco")}</h2>
      ${
        words.length
          ? html`<ul class="pf-garden is-plain">
              ${words.map(
                (g) =>
                  html`<li class="pf-word">
                    <span class="pf-word-text"
                      ><strong lang="en">${g.word}</strong
                      >${g.es ? html`<span lang="es" class="fine">${g.es}</span>` : ""}</span
                    >
                  </li>`,
              )}
            </ul>`
          : empty(I, I.T("My new words will appear here.", "Mis palabras nuevas aparecerán aquí."))
      }
    </section>
    <section class="panel" aria-labelledby="pfFamAsk">
      <h2 id="pfFamAsk">${I.T("Ask me about it", "Pregúntame")}</h2>
      <ul>
        ${words[0] ? html`<li>${I.T(`Ask me to use the word "${words[0].word}" in a sentence.`, `Pídeme que use la palabra "${words[0].word}" en una oración.`)}</li>` : ""}
        <li>
          ${I.T("Ask me to read my favorite sentence out loud.", "Pídeme que lea en voz alta mi oración favorita.")}
        </li>
        <li>
          ${I.T("Ask me what I found hard, and what helped. You can talk in any language you like.", "Pregúntame qué me resultó difícil y qué me ayudó. Pueden hablar en el idioma que prefieran.")}
        </li>
      </ul>
    </section>
    <p class="fine">
      ${I.T("Practice on this site is not an official WIDA or ACCESS test. Work stays on my device unless I print it.", "La práctica en este sitio no es una prueba oficial de WIDA ni de ACCESS. El trabajo se queda en mi dispositivo a menos que lo imprima.")}
    </p>
  </article>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const family = ctx.route.mode === "family";
  const title = family
    ? I.S("My language portfolio", "Mi portafolio de lenguaje")
    : I.S("My portfolio and showcase", "Mi portafolio y muestra");
  const x = await loadExperience(ctx);
  if (family && !ctx.prefs.portfolio?.sharedAt)
    ctx.setPrefs({
      portfolio: { ...ctx.prefs.portfolio, sharedAt: todayISO() },
    });
  x.prefs = ctx.prefs;
  recordNewBadges(ctx, x, I);
  x.prefs = ctx.prefs;
  const p = collect(x);
  const name = getStudentName();
  const today = todayISO();
  const crumbs = crumbsHTML([
    [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
    [title, null],
  ]);
  if (family) return { title, html: html`${crumbs}${familyView(I, band, x, p, name, today)}` };
  const badges = evaluate(evidenceFrom(x), ctx.prefs.collection).filter((b) => b.earned);
  const pins = new Set(p.pins);
  return {
    title,
    html: html`${crumbs}
      <article class="pf-page" aria-labelledby="pfTitle">
        ${headHTML(I, band, false, name, today)}
        <section class="panel" aria-labelledby="pfShow">
          <h2 id="pfShow">${icon("star")} ${I.T("My showcase", "Mi muestra")}</h2>
          <p class="fine">
            ${I.T("My best writing: pieces I revised first, then my newest. I can keep the ones I choose.", "Mi mejor escritura: primero lo que revisé y luego lo más nuevo. Puedo mantener lo que elija.")}
          </p>
          ${p.showcase.length ? html`<div class="pf-samples">${p.showcase.map((s) => sampleCard(I, s, { pinned: pins.has(s.key), pinnable: true }))}</div>` : empty(I, I.T("Your showcase fills up as you write.", "Tu muestra se llena a medida que escribes."), `${BASE}/write`, I.T("Open the Writing Studio", "Abrir el Estudio de escritura"))}
          ${
            p.samples.length > p.showcase.length
              ? html`<details class="pf-more no-print">
                  <summary>
                    ${I.T(`All my writing (${p.samples.length})`, `Toda mi escritura (${p.samples.length})`)}
                  </summary>
                  <div class="pf-samples">
                    ${p.samples
                      .filter((s) => !p.showcase.includes(s))
                      .slice(0, 20)
                      .map((s) => sampleCard(I, s, { pinned: pins.has(s.key), pinnable: true }))}
                  </div>
                </details>`
              : ""
          }
        </section>
        <section class="panel" aria-labelledby="pfGarden">
          <h2 id="pfGarden">
            ${icon("growth")} ${I.T("My vocabulary garden", "Mi jardín de vocabulario")}
          </h2>
          ${gardenHTML(I, p.garden, false)}
        </section>
        <section class="panel" aria-labelledby="pfSay">
          <h2 id="pfSay">${icon("speaking")} ${I.T("My speaking", "Mi expresión oral")}</h2>
          ${recordingsHTML(I, p.recordings)}
        </section>
        <section class="panel" aria-labelledby="pfRead">
          <h2 id="pfRead">
            ${icon("reading")} ${I.T("My reading reflections", "Mis reflexiones de lectura")}
          </h2>
          ${reflectionsHTML(I, p.reflections)}
        </section>
        <section class="panel" aria-labelledby="pfGrow">
          <h2 id="pfGrow">
            ${icon("road")} ${I.T("My growth timeline", "Mi línea de tiempo de crecimiento")}
          </h2>
          ${timelineHTML(I, p.timeline)}
        </section>
        <section class="panel" aria-labelledby="pfBadges">
          <h2 id="pfBadges">
            ${icon("medal")} ${I.T("In my collection book", "En mi libro de colección")}
          </h2>
          ${badges.length ? html`<p class="pf-chips">${badges.map((b) => html`<span class="sticker">${I.TO(b.name)}</span>`)}</p>` : empty(I, I.T("Your badges show up here.", "Tus insignias aparecen aquí."))}
          <p>
            <a href="${BASE}/collection?grades=${band}"
              >${I.T("Open my collection book", "Abrir mi libro de colección")}</a
            >
            ·
            <a href="${BASE}/passport?grades=${band}"
              >${I.T("Open my Passport", "Abrir mi Pasaporte")}</a
            >
          </p>
        </section>
        <div class="no-print">${shieldsHTML(I, x.ledger.entries, x.records)}</div>
        <section class="panel no-print" aria-labelledby="pfPaper">
          <h2 id="pfPaper">${I.T("Paper passport", "Pasaporte de papel")}</h2>
          <p class="fine">
            ${I.T("Prefer paper? Print the passport booklet, stickers and the family guide.", "¿Prefieres papel? Imprime el librito del pasaporte, las calcomanías y la guía para la familia.")}
          </p>
          ${paperPassportMenu(I)}
        </section>
        <p class="fine">
          ${I.T("This portfolio shows my own work and dates. It is practice. It is not a test result and it does not estimate an ACCESS score or level. It stays on this device unless I print it.", "Este portafolio muestra mi propio trabajo y fechas. Es práctica. No es un resultado de prueba ni estima una puntuación o nivel de ACCESS. Se queda en este dispositivo a menos que lo imprima.")}
        </p>
      </article>`,
  };
}

export function onChange(e, ctx) {
  const box = e.target.closest?.("[data-pf-pin]");
  if (!box) return;
  const key = box.dataset.pfPin;
  const pins = new Set(ctx.prefs.portfolio?.pins || []);
  if (box.checked) pins.add(key);
  else pins.delete(key);
  ctx.setPrefs({ portfolio: { ...ctx.prefs.portfolio, pins: [...pins].slice(-6) } });
  ctx.rerender();
}
