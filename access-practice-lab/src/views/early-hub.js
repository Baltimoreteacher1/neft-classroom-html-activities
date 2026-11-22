// Early learners' home (/early?grades=K|1|2-3) and its pages:
//   /early            the band home: Pepita, audio-first switch, Wonder Garden progress, Audience lenses,
//                     Play & Explore studios, Cross-Curricular Wonder Worlds, practice by skill, and family time
//   /early/<page>     a page module from src/early/pages.js
// It is also what "/" renders while a K–3 band is chosen (src/main.js), so the lab's home link, the band switch
// and shared ?grades= links all land here.
import { audioFirstOn, BAND_INFO, EARLY_BANDS } from "../bands.js";
import { bandSwitchHTML } from "../components.js";
import { bandDomains } from "../content.js";
import { DISCOVER_WORLDS } from "../content/early.js";
import { guideSVG } from "../early/scenes.js";
import { i18nFor } from "../i18n.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { loadRecord } from "../store.js";
import { BASE, announce, html, icon, raw, storage } from "../util.js";
import { jumpInHTML } from "../quick-start.js";
import { resourceHubStripHTML } from "../platform/views/resourceHub.js";

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
let lens = "kids"; // "kids" | "families" | "teachers"

async function pageModule(id) {
  if (!id) return null;
  const pages = await import("../early/pages.js");
  return pages.PAGES[id] || null;
}

function readJson(key) {
  try {
    return JSON.parse(storage.get(key) || "{}") || {};
  } catch {
    return {};
  }
}

function gardenProgress(band) {
  const ph = readJson("accessPracticeLab:v1:early-phonics");
  const plants = Object.entries(ph)
    .filter(([k]) => k === band || k.startsWith(`${band}:`))
    .reduce((n, [, v]) => n + (Array.isArray(v?.done) ? v.done.length : 0), 0);
  const words = (readJson("accessPracticeLab:v1:early-words").said || []).length;
  const sight = (readJson("accessPracticeLab:v1:early-sight")[band] || []).length;
  const ry = readJson("accessPracticeLab:v1:early-rhyme");
  const rhymes =
    Object.values(ry.rhymes || {}).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : 0), 0) +
    (Array.isArray(ry.syllables) ? ry.syllables.length : 0);
  const worlds = (readJson("accessPracticeLab:v1:early-discover").done || []).length;
  return { plants, words, sight, rhymes, worlds };
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

/** Extra pages for a band: [{ id, title, es, blurb, blurbEs, icon, tag, tagEs }] in the order the home lists them. */
export function extrasFor(band) {
  const list = [];
  if (band === "K")
    list.push({
      id: "story",
      icon: "reading",
      tag: "3 Picture Books",
      tagEs: "3 Libros ilustrados",
      title: "Story Time Library",
      es: "Biblioteca Hora del cuento",
      blurb:
        "Three read-aloud picture books with spoken questions and retell cards. Not a computer test.",
      blurbEs:
        "Tres libros ilustrados para leer en voz alta con preguntas y tarjetas para volver a contar. No es un examen.",
    });
  list.push(
    {
      id: "discover",
      icon: "worlds",
      tag: "Science · Math · Arts",
      tagEs: "Ciencias · Mate · Arte",
      title: "Wonder Worlds: Subjects",
      es: "Mundos de asombro: Materias",
      blurb:
        "Listen, read, speak, and draw across Science, Math, Community, and Arts & Music.",
      blurbEs:
        "Escucha, lee, habla y dibuja en Ciencias, Matemáticas, Comunidad y Arte y Música.",
    },
    {
      id: "phonics",
      icon: "sparkle",
      tag: "Phonics Game",
      tagEs: "Juego de fonética",
      title: "Sound Builder game",
      es: "Juego Construye con sonidos",
      blurb: "Hear the sounds, build the word with tiles, and grow three themed gardens.",
      blurbEs: "Escucha los sonidos, forma la palabra con fichas y haz crecer tres huertos.",
    },
    {
      id: "rhyme",
      icon: "listening",
      tag: "Rhymes & Beats",
      tagEs: "Rimas y ritmo",
      title: "Rhyme & Rhythm Pond",
      es: "Estanque de rimas y ritmo",
      blurb: "Match rhyming pictures to hop the frog, or clap the syllables in a word.",
      blurbEs: "Empareja dibujos que riman para hacer saltar a la rana, o aplaude las sílabas.",
    },
    {
      id: "words",
      icon: "words",
      tag: "80 Picture Cards",
      tagEs: "80 Tarjetas",
      title: "Picture word cards",
      es: "Tarjetas de palabras con dibujos",
      blurb: "Tap a picture to hear the word, or play Listen & Find. Spanish word optional.",
      blurbEs: "Toca un dibujo para escuchar la palabra, o juega Escucha y busca. Español opcional.",
    },
    {
      id: "sight-words",
      icon: "star",
      tag: "High-Frequency",
      tagEs: "Uso frecuente",
      title: "Sight Word Treasures",
      es: "Tesoros de palabras",
      blurb: "Hear sight words in real sentences and play Treasure Hunt to collect stars.",
      blurbEs: "Escucha palabras frecuentes en oraciones reales y juega Búsqueda del tesoro.",
    },
    {
      id: "sentences",
      icon: "writing",
      tag: "Build & Print",
      tagEs: "Crea e imprime",
      title: "Sentence & Story Maker",
      es: "Creador de oraciones e historias",
      blurb: "Tap picture tiles to build a sentence, hear Pepita read it, and print a writing sheet.",
      blurbEs: "Toca fichas con dibujos para formar una oración, escúchala e imprime tu hoja.",
    },
  );
  if (band !== "K")
    list.push({
      id: "phonics-path",
      href: "science-of-reading/path",
      icon: "reading",
      tag: "Structured Phonics",
      tagEs: "Fonética guiada",
      title: "Phonics Path: Levels 1 to 3",
      es: "Ruta de fonética: niveles 1 a 3",
      blurb: "Short lessons that teach one sound pattern at a time: build, sort, spell and read.",
      blurbEs:
        "Lecciones cortas que enseñan un patrón de sonidos a la vez: construye, clasifica, deletrea y lee.",
    });
  list.push(
    {
      id: "twr",
      href: "twr",
      icon: "writing",
      tag: "Sentence Craft",
      tagEs: "Oraciones",
      title: "TWR: Say and write sentences",
      es: "TWR: di y escribe oraciones",
      blurb: "Short activities that build a strong sentence, one skill at a time. Pepita reads every word.",
      blurbEs: "Actividades cortas que construyen una oración fuerte, una destreza a la vez. Pepita lee cada palabra.",
    },
    {
      id: "choice-boards",
      href: "choice-boards",
      icon: "grid",
      tag: "3-in-a-Row",
      tagEs: "3 en línea",
      title: "Choice Boards",
      es: "Tableros de opciones",
      blurb: "Pick three squares in a row: listen, talk, draw and make, with a grown-up.",
      blurbEs: "Elige tres casillas en línea: escucha, habla, dibuja y crea, con un adulto.",
    },
    {
      id: "talk-table",
      href: "talk-table",
      icon: "conversation",
      tag: "Daily Prompt",
      tagEs: "Pregunta diaria",
      title: "Talk Table",
      es: "Mesa de conversación",
      blurb: "One question a night in English and Spanish to talk about together.",
      blurbEs: "Una pregunta cada noche en inglés y español para conversar juntos.",
    },
    {
      id: "family",
      icon: "families",
      tag: "No Screen Needed",
      tagEs: "Sin pantalla",
      title: "Family time",
      es: "Tiempo en familia",
      blurb: "12 short talk-and-play activities for home in English and Spanish.",
      blurbEs: "12 actividades cortas para hablar y jugar en casa en inglés y español.",
    },
  );
  return list;
}

function lensPanelHTML(band, q, I) {
  if (lens === "families") {
    return html`<section class="panel early-lens-panel" aria-labelledby="lensFamTitle">
      <h2 id="lensFamTitle">${icon("families")} ${I.T("Family Quick-Start (5 minutes a day)", "Guía rápida para familias (5 minutos al día)")}</h2>
      <p>
        ${I.T(
          "You do not need to speak English to help your child succeed. Talking, singing, and asking questions in your home language builds the thinking that English words attach to.",
          "No necesita hablar inglés para ayudar a su hijo a tener éxito. Hablar, cantar y hacer preguntas en su idioma del hogar construye las ideas a las que se unen las palabras en inglés.",
        )}
      </p>
      <div class="early-lens-grid">
        <a class="early-extra" href="${BASE}/early/story${q}">
          ${icon("reading")}
          <strong>${I.T("1. Read & Talk Together", "1. Lean y conversen juntos")}</strong>
          <span>${I.T("Open Story Time Library, tap Read the page, and ask the grown-up question.", "Abra Hora del cuento, toque Leer la página y haga la pregunta para adultos.")}</span>
        </a>
        <a class="early-extra" href="${BASE}/early/family${q}">
          ${icon("families")}
          <strong>${I.T("2. Zero-Prep Home Games", "2. Juegos en casa sin preparación")}</strong>
          <span>${I.T("12 bilingual 5-minute activities for the kitchen, walk, or bedtime.", "12 actividades bilingües de 5 minutos para la cocina, el paseo o antes de dormir.")}</span>
        </a>
        <a class="early-extra" href="${BASE}/family-tour/?grades=${BAND_INFO[band].picker}&lang=${I.spanish ? "es" : "en"}">
          ${icon("road")}
          <strong>${I.T("3. Take the Family Tour", "3. Recorrido familiar")}</strong>
          <span>${I.T("A friendly 2-minute walkthrough of how to use this site at home.", "Un recorrido amigable de 2 minutos sobre cómo usar este sitio en casa.")}</span>
        </a>
      </div>
    </section>`;
  }
  if (lens === "teachers") {
    return html`<section class="panel early-lens-panel" aria-labelledby="lensTeaTitle">
      <h2 id="lensTeaTitle">${icon("teacher")} ${I.T("Teacher Quick-Start & Small-Group Stations", "Guía rápida docente y estaciones en grupos pequeños")}</h2>
      <p>
        ${I.T(
          "Built for K–2 emerging bilinguals: 64px+ touch targets, zero timers, audio-first directions, and content-integrated language practice aligned to WIDA ELD Standards.",
          "Diseñado para estudiantes bilingües emergentes de K–2: botones grandes de 64px+, sin reloj, instrucciones con audio y práctica integrada al currículo.",
        )}
      </p>
      <div class="early-lens-grid">
        <a class="early-extra" href="${BASE}/early/story${q}">
          ${icon("classroom")}
          <strong>${I.T("Whole-Class Projector Story", "Cuento en proyector para toda la clase")}</strong>
          <span>${I.T("Turn on Class mode in Story Time for large-print shared reading and oral retell.", "Active el Modo clase en Hora del cuento para lectura compartida y recuento oral.")}</span>
        </a>
        <a class="early-extra" href="${BASE}/early/discover${q}">
          ${icon("worlds")}
          <strong>${I.T("15-Min Subject Stations", "Estaciones por materia (15 min)")}</strong>
          <span>${I.T("Pair tablets with paper notebooks in Science, Math, Community, and Arts.", "Combine tabletas con cuadernos de papel en Ciencias, Matemáticas, Comunidad y Arte.")}</span>
        </a>
        <a class="early-extra" href="/access-teacher/">
          ${icon("checkin")}
          <strong>${I.T("Open Teacher Hub", "Abrir Centro docente")}</strong>
          <span>${I.T("Create class share links, live quizzes, and review K–2 pathways.", "Cree enlaces para la clase, cuestionarios en vivo y revise rutas de K–2.")}</span>
        </a>
      </div>
    </section>`;
  }
  return "";
}

async function homeHTML(ctx, I) {
  const band = ctx.band;
  const info = BAND_INFO[band];
  const on = audioFirstOn(ctx.prefs, band);
  const domains = await bandDomains(band);
  const extras = extrasFor(band);
  const q = `?grades=${info.picker}`;
  const jumpIn = await jumpInHTML(ctx, I);
  const prog = gardenProgress(band);

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
            ${band === "K"
              ? I.T(
                  "Kindergarten practice is done together with a grown-up: picture stories read aloud, rhymes, sound games, word cards, and science and math talks.",
                  "En kínder se practica junto con un adulto: cuentos ilustrados en voz alta, rimas, juegos de sonidos, tarjetas de palabras y charlas de ciencias y matemáticas.",
                )
              : I.T(
                  "Pepita reads every direction out loud. Tap a picture to answer, explore Science and Math worlds, or build your own sentences.",
                  "Pepita lee cada instrucción en voz alta. Toca un dibujo para responder, explora mundos de Ciencias y Matemáticas o crea tus propias oraciones.",
                )}
          </p>
          ${bandSwitchHTML(
            band,
            EARLY_BANDS.filter((available) => ctx.bands.includes(available)),
            { i18n: I },
          )}
          <p class="early-setting">
            <button type="button" class="btn btn-primary" data-early-welcome>
              ${icon("volume")} ${I.T("Hear Pepita welcome you", "Escuchar a Pepita")}
            </button>
            <button
              type="button"
              class="btn ${on ? "btn-primary" : ""}"
              data-early-audio
              aria-pressed="${on}"
            >
              ${icon("volume")}
              ${on
                ? I.T("Audio-first mode: on", "Modo de audio primero: activado")
                : I.T("Audio-first mode: off", "Modo de audio primero: desactivado")}
            </button>
            <span class="fine"
              >${I.T(
                "Directions are spoken, answers are pictures, and replay is always free.",
                "Las instrucciones se dicen en voz alta, las respuestas son dibujos y volver a escuchar siempre está disponible.",
              )}</span
            >
          </p>
        </div>
      </header>
      ${resourceHubStripHTML(band, ctx.prefs.tlpPillar || "All")}

      <div class="early-lenses" role="group" aria-label="${I.S("Who is exploring?", "¿Quién está explorando?")}">
        <button
          type="button"
          class="btn small ${lens === "kids" ? "btn-primary" : ""}"
          data-early-lens="kids"
          aria-pressed="${lens === "kids"}"
        >
          ${icon("sparkle")} ${I.T("For Kids: Play & Listen", "Para niños: Jugar y escuchar")}
        </button>
        <button
          type="button"
          class="btn small ${lens === "families" ? "btn-primary" : ""}"
          data-early-lens="families"
          aria-pressed="${lens === "families"}"
        >
          ${icon("families")} ${I.T("For Families: At Home", "Para familias: En casa")}
        </button>
        <button
          type="button"
          class="btn small ${lens === "teachers" ? "btn-primary" : ""}"
          data-early-lens="teachers"
          aria-pressed="${lens === "teachers"}"
        >
          ${icon("teacher")} ${I.T("For Teachers: Class & Stations", "Para docentes: Clase y estaciones")}
        </button>
      </div>

      ${lensPanelHTML(band, q, I)}

      <section class="early-garden-strip" aria-label="${I.S("My Wonder Garden", "Mi huerto de asombro")}">
        <div class="early-garden-stat">
          ${icon("sparkle")}
          <strong>${prog.plants}</strong>
          <span>${I.T("Plants grown", "Plantas crecidas")}</span>
        </div>
        <div class="early-garden-stat">
          ${icon("words")}
          <strong>${prog.words}</strong>
          <span>${I.T("Words spoken", "Palabras dichas")}</span>
        </div>
        <div class="early-garden-stat">
          ${icon("star")}
          <strong>${prog.sight}</strong>
          <span>${I.T("Sight stars", "Estrellas")}</span>
        </div>
        <div class="early-garden-stat">
          ${icon("listening")}
          <strong>${prog.rhymes}</strong>
          <span>${I.T("Rhymes & beats", "Rimas y golpes")}</span>
        </div>
        <div class="early-garden-stat">
          ${icon("worlds")}
          <strong>${prog.worlds}</strong>
          <span>${I.T("Subject worlds", "Mundos")}</span>
        </div>
      </section>

      ${jumpIn}

      ${extras.length
        ? html`<section class="early-section" aria-labelledby="earlyExtrasTitle">
            <h2 id="earlyExtrasTitle">
              ${I.T("Play, read, and discover together", "Jueguen, lean y descubran juntos")}
            </h2>
            <ul class="early-extras">
              ${extras.map(
                (x) =>
                  html`<li>
                    <a class="early-extra" href="${BASE}/${x.href || `early/${x.id}`}${q}">
                      <span class="early-extra-top">
                        ${icon(x.icon)}
                        ${x.tag ? html`<span class="early-tag">${I.T(x.tag, x.tagEs)}</span>` : ""}
                      </span>
                      <strong>${I.T(x.title, x.es)}</strong>
                      <span>${I.T(x.blurb, x.blurbEs)}</span>
                    </a>
                  </li>`,
              )}
            </ul>
          </section>`
        : ""}

      <section class="early-section" aria-labelledby="earlyWorldsTitle">
        <h2 id="earlyWorldsTitle">
          ${I.T("Language across school subjects", "Lenguaje en todas las materias")}
        </h2>
        <p class="fine">
          ${I.T(
            "Connect listening, reading, speaking, and drawing to Science, Math, Community, and Arts.",
            "Conecta escuchar, leer, hablar y dibujar con Ciencias, Matemáticas, Comunidad y Arte.",
          )}
        </p>
        <ul class="early-worlds-row">
          ${DISCOVER_WORLDS.map(
            (w) => html`<li>
              <a class="early-extra early-world-pill is-${w.color}" href="${BASE}/early/discover${q}">
                <span class="early-extra-top">
                  ${icon(w.icon)}
                  <span class="early-emoji" aria-hidden="true">${w.miniIcon}</span>
                </span>
                <strong>${I.T(w.title[0], w.title[1])}</strong>
                <span>${I.T(w.tagline[0], w.tagline[1])}</span>
              </a>
            </li>`,
          )}
        </ul>
      </section>

      ${Object.keys(domains).length
        ? html`<section class="early-section" aria-labelledby="earlySkillsTitle">
            <h2 id="earlySkillsTitle">${I.T("Practice by skill", "Practica por destreza")}</h2>
            <ul class="early-skills">
              ${skillCards(band, domains, I)}
            </ul>
          </section>`
        : ""}
      <p class="fine early-honest">
        ${I.T(
          "Practice only. Nothing here is a WIDA score, level or test result. Work stays on this device.",
          "Solo práctica. Nada aquí es un puntaje, nivel o resultado de WIDA. El trabajo se queda en este dispositivo.",
        )}
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
          ${I.T(
            "This home is for Kindergarten, Grade 1 and Grades 2–3.",
            "Esta página es para kínder, 1.º grado y grados 2–3.",
          )}
        </p>
        ${bandSwitchHTML(
          ctx.band,
          EARLY_BANDS.filter((available) => ctx.bands.includes(available)),
          { i18n: I },
        )}
      </section>`,
    };
  // /family with a K–3 band opens the K–2 family activities (src/main.js routes it here).
  page =
    ctx.route.view === "early"
      ? await pageModule(ctx.route.id)
      : ctx.route.view === "family"
        ? await pageModule("family")
        : null;
  if (page) return page.render(ctx, I);
  return homeHTML(ctx, I);
}

export function onClick(e, ctx) {
  const pillarBtn = e.target.closest?.("[data-tlp-pillar]");
  if (pillarBtn) {
    ctx.setPrefs({ tlpPillar: pillarBtn.dataset.tlpPillar });
    ctx.rerender({ keepFocus: true });
    return true;
  }
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
  const lensBtn = e.target.closest("[data-early-lens]");
  if (lensBtn) {
    lens = lensBtn.dataset.earlyLens || "kids";
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-early-welcome]")) {
    const line =
      I.mode === "es"
        ? "Hola, soy Pepita. Toca cualquier juego o cuento para escuchar, hablar, leer y aprender juntos."
        : "Hi! I am Pepita. Tap any story, game, or subject world below to listen, talk, read, and grow.";
    speak(line, { lang: I.mode === "es" ? "es-US" : "en-US", rate: ctx.prefs.rate || 0.85, persona: "guide" });
    return true;
  }
  return page?.onClick?.(e, ctx, I) ?? false;
}
export const mount = (root, ctx) => page?.mount?.(root, ctx, i18nFor(ctx));
export const unmount = () => {
  stopSpeech();
  page?.unmount?.();
};
export const onInput = (e, ctx) => page?.onInput?.(e, ctx, i18nFor(ctx));
export const onChange = (e, ctx) => page?.onChange?.(e, ctx, i18nFor(ctx));
