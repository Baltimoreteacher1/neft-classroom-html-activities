// Early learners' home (/early?grades=K|1|2-3) and its pages:
//   /early            the band home: Pepita, the audio-first switch, practice by skill, games and family time
//   /early/<page>     a page module from src/early/pages.js (story time, phonics, picture words, family)
// It is also what "/" renders while a K–3 band is chosen (src/main.js), so the lab's home link, the band switch
// and shared ?grades= links all land here.
import { audioFirstOn, BAND_INFO, EARLY_BANDS } from "../bands.js";
import { bandSwitchHTML } from "../components.js";
import { bandDomains } from "../content.js";
import { guideSVG } from "../early/scenes.js";
import { i18nFor } from "../i18n.js";
import { loadRecord } from "../store.js";
import { BASE, announce, html, icon, raw } from "../util.js";

const DOMAIN_ES = {
  Listening: "Escuchar",
  Reading: "Leer",
  Speaking: "Hablar",
  Writing: "Escribir",
};
const DOMAIN_SAY = {
  Listening: [
    "Listen to a short story, then tap a picture.",
    "Escucha un cuento corto y toca un dibujo.",
  ],
  Reading: [
    "Read along. Tap any sentence to hear it.",
    "Lee conmigo. Toca una oración para escucharla.",
  ],
  Speaking: ["Hear a friend, then say it your way.", "Escucha a un amigo y dilo a tu manera."],
  Writing: ["Print a page and write with a pencil.", "Imprime una página y escribe con lápiz."],
};
const LEVEL_NAME = {
  A: ["Starting", "Comenzando"],
  B: ["Growing", "Creciendo"],
  C: ["Expanding", "Ampliando"],
};

let page = null; // the page module while /early/<page> is open

async function pageModule(id) {
  if (!id) return null;
  const pages = await import("../early/pages.js");
  return pages.PAGES[id] || null;
}

function skillCards(band, domains, I) {
  return Object.entries(domains)
    .filter(([d]) => DOMAIN_ES[d])
    .map(([domain, d]) => {
      const levels = Object.entries(d.levels || {});
      return html`<li class="early-skill d-${domain.toLowerCase()}">
        <h3>${icon(domain.toLowerCase())} ${I.T(domain, DOMAIN_ES[domain])}</h3>
        <p>${I.T(...DOMAIN_SAY[domain])}</p>
        <ul class="early-levels">
          ${levels.map(([lk, L]) => {
            const ids = L.activities.map((row) => row[0]);
            const rec = loadRecord(band, domain, lk);
            const done = ids.filter((id) => rec.complete.includes(id)).length;
            const next = ids.find((id) => !rec.complete.includes(id)) || ids[0];
            return html`<li>
              <a
                class="btn early-big"
                href="${BASE}/${domain}/${lk}/${next}?grades=${BAND_INFO[band].picker}"
              >
                <span>${I.T(LEVEL_NAME[lk]?.[0] || lk, LEVEL_NAME[lk]?.[1] || lk)}</span>
                <span class="early-count"
                  >${I.T(`${done} of ${ids.length} done`, `${done} de ${ids.length} hechas`)}</span
                ></a
              >
            </li>`;
          })}
        </ul>
        <a class="early-all" href="${BASE}/${domain}/A?grades=${BAND_INFO[band].picker}"
          >${I.T("See every activity", "Ver todas las actividades")}</a
        >
      </li>`;
    });
}

/** Extra pages for a band: [{ id, title, es, blurb, blurbEs, icon }] in the order the home lists them. */
export function extrasFor(band) {
  const list = [];
  if (band === "K")
    list.push({
      id: "story",
      icon: "reading",
      title: "Story Time: Our Neighborhood Garden",
      es: "Hora del cuento: Nuestro huerto del vecindario",
      blurb:
        "A grown-up reads the picture story aloud and asks the questions. Not a computer test.",
      blurbEs:
        "Un adulto lee el cuento ilustrado en voz alta y hace las preguntas. No es un examen en computadora.",
    });
  list.push(
    {
      id: "phonics",
      icon: "sparkle",
      title: "Sound Builder game",
      es: "Juego Construye con sonidos",
      blurb: "Hear the sounds, then build the word with tiles.",
      blurbEs: "Escucha los sonidos y forma la palabra con fichas.",
    },
    {
      id: "words",
      icon: "words",
      title: "Picture word cards",
      es: "Tarjetas de palabras con dibujos",
      blurb: "Tap a picture to hear the word. Spanish word optional.",
      blurbEs: "Toca un dibujo para escuchar la palabra. La palabra en español es opcional.",
    },
    {
      id: "family",
      icon: "families",
      title: "Family time",
      es: "Tiempo en familia",
      blurb: "Short talk-and-play activities for home.",
      blurbEs: "Actividades cortas para hablar y jugar en casa.",
    },
  );
  return list;
}

async function homeHTML(ctx, I) {
  const band = ctx.band;
  const info = BAND_INFO[band];
  const on = audioFirstOn(ctx.prefs, band);
  const domains = await bandDomains(band);
  const extras = extrasFor(band);
  const q = `?grades=${info.picker}`;
  return {
    title: I.S(`${info.label} practice`, `Práctica de ${info.labelEs}`),
    html: html`<section class="early-home" aria-labelledby="earlyTitle">
      <header class="panel early-hero">
        <div class="early-hero-guide">${raw(guideSVG())}</div>
        <div>
          <p class="eyebrow">
            ${I.T("Early learners · Language practice", "Primeros grados · Práctica del lenguaje")}
          </p>
          <h1 id="earlyTitle" tabindex="-1">
            ${I.T(`${info.label}: listen, talk, read and write`, `${info.labelEs}: escucha, habla, lee y escribe`)}
          </h1>
          <p class="lead">
            ${band === "K" ? I.T("Kindergarten practice is done together with a grown-up: a picture story read aloud, talk, songs of sounds and word cards.", "En kínder se practica junto con un adulto: un cuento ilustrado leído en voz alta, conversación, sonidos y tarjetas de palabras.") : I.T("Pepita reads every direction out loud. Tap a picture to answer. Tap the speaker to hear it again.", "Pepita lee cada instrucción en voz alta. Toca un dibujo para responder. Toca la bocina para escucharlo otra vez.")}
          </p>
          ${bandSwitchHTML(band, ctx.bands, { i18n: I })}
          <p class="early-setting">
            <button
              type="button"
              class="btn ${on ? "btn-primary" : ""}"
              data-early-audio
              aria-pressed="${on}"
            >
              ${icon("volume")}
              ${on ? I.T("Audio-first mode: on", "Modo de audio primero: activado") : I.T("Audio-first mode: off", "Modo de audio primero: desactivado")}
            </button>
            <span class="fine"
              >${I.T("Directions are spoken, answers are pictures, and replay is the only help.", "Las instrucciones se dicen en voz alta, las respuestas son dibujos y volver a escuchar es la única ayuda.")}</span
            >
          </p>
        </div>
      </header>
      ${
        extras.length
          ? html`<section class="early-section" aria-labelledby="earlyExtrasTitle">
              <h2 id="earlyExtrasTitle">
                ${I.T("Play and read together", "Jueguen y lean juntos")}
              </h2>
              <ul class="early-extras">
                ${extras.map(
                  (x) =>
                    html`<li>
                      <a class="early-extra" href="${BASE}/early/${x.id}${q}"
                        >${icon(x.icon)}<strong>${I.T(x.title, x.es)}</strong
                        ><span>${I.T(x.blurb, x.blurbEs)}</span></a
                      >
                    </li>`,
                )}
              </ul>
            </section>`
          : ""
      }
      ${
        Object.keys(domains).length
          ? html`<section class="early-section" aria-labelledby="earlySkillsTitle">
              <h2 id="earlySkillsTitle">${I.T("Practice by skill", "Practica por destreza")}</h2>
              <ul class="early-skills">
                ${skillCards(band, domains, I)}
              </ul>
            </section>`
          : ""
      }
      <p class="fine early-honest">
        ${I.T("Practice only. Nothing here is a WIDA score, level or test result. Work stays on this device.", "Solo práctica. Nada aquí es un puntaje, nivel o resultado de WIDA. El trabajo se queda en este dispositivo.")}
      </p>
    </section>`,
  };
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  if (!EARLY_BANDS.includes(ctx.band))
    return {
      title: I.S("Early learners", "Primeros grados"),
      html: html`<section class="panel empty-state">
        <h1 tabindex="-1">${I.T("Choose a grade band", "Elige un grupo de grados")}</h1>
        <p>
          ${I.T("This home is for Kindergarten, Grade 1 and Grades 2–3.", "Esta página es para kínder, 1.º grado y grados 2–3.")}
        </p>
        ${bandSwitchHTML(ctx.band, ctx.bands, { i18n: I })}
      </section>`,
    };
  // /family with a K–3 band opens the K–2 family activities (src/main.js routes it here).
  page = ctx.route.view === "early" ? await pageModule(ctx.route.id) : ctx.route.view === "family" ? await pageModule("family") : null;
  if (page) return page.render(ctx, I);
  return homeHTML(ctx, I);
}

export function onClick(e, ctx) {
  const I = i18nFor(ctx);
  if (e.target.closest("[data-early-audio]")) {
    const on = !audioFirstOn(ctx.prefs, ctx.band);
    ctx.setPrefs({ audioFirst: { ...(ctx.prefs.audioFirst || {}), [ctx.band]: on } });
    announce(
      on
        ? I.S("Audio-first mode is on.", "El modo de audio primero está activado.")
        : I.S("Audio-first mode is off.", "El modo de audio primero está desactivado."),
    );
    ctx.rerender();
    return true;
  }
  return page?.onClick?.(e, ctx, I) ?? false;
}
export const mount = (root, ctx) => page?.mount?.(root, ctx, i18nFor(ctx));
export const unmount = () => page?.unmount?.();
export const onInput = (e, ctx) => page?.onInput?.(e, ctx, i18nFor(ctx));
export const onChange = (e, ctx) => page?.onChange?.(e, ctx, i18nFor(ctx));
