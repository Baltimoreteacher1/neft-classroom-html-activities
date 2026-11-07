// Story Time for Kindergarten (/early/story?grades=K): "Our Neighborhood Garden", an original EduWonderLab picture
// story that a grown-up reads aloud and talks about with one child (Family mode) or a whole class on a projector
// (Class mode). ACCESS for Kindergarten is a one-on-one test given by an adult; this page copies that shape, not its
// content: big pictures, a short page of story, and spoken questions. It is not a computer test: nothing is scored,
// nothing is timed, and the grown-up's "We talked about it" tick is only a bookmark on this device.
import { storage } from "../util.js";
import { BASE, html, icon, raw } from "../util.js";
import { sceneSVG } from "./scenes.js";
import { speak, stop as stopSpeech } from "../speech.js";

const KEY = "accessPracticeLab:v1:early-story";

/** The story, page by page: [english, spanish] text, the question the grown-up asks, and what to listen for. */
export const STORY = {
  title: ["Our Neighborhood Garden", "Nuestro huerto del vecindario"],
  pages: [
    {
      scene: "garden-walk",
      text: [
        "On Saturday, Mia and Grandpa walk down Pine Street to the community garden. Grandpa carries a basket. Mia carries a watering can.",
        "El sábado, Mia y su abuelo caminan por la calle Pine hacia el huerto comunitario. El abuelo lleva una canasta. Mia lleva una regadera.",
      ],
      ask: ["What is Mia carrying? Point to it.", "¿Qué lleva Mia? Señálalo."],
      listen: [
        "Pointing to the watering can, or saying water, can or watering can.",
        "Que señale la regadera o diga agua, regadera o watering can.",
      ],
    },
    {
      scene: "seed-plant",
      text: [
        "At the garden, they dig a little hole. Mia drops in three seeds. Pat, pat, pat. She covers them with dirt.",
        "En el huerto, cavan un hoyito. Mia pone tres semillas. Pum, pum, pum. Las tapa con tierra.",
      ],
      ask: [
        "How many seeds did Mia put in the hole? Show me with your fingers.",
        "¿Cuántas semillas puso Mia en el hoyo? Muéstramelo con los dedos.",
      ],
      listen: ["Three fingers, or the word three.", "Tres dedos o la palabra three o tres."],
    },
    {
      scene: "park-rain",
      text: [
        "That night, rain falls on the garden. Drip, drop, drip. The seeds get a big drink.",
        "Esa noche, la lluvia cae sobre el huerto. Plic, ploc, plic. Las semillas toman mucha agua.",
      ],
      ask: ["What is the weather? How do you know?", "¿Cómo está el tiempo? ¿Cómo lo sabes?"],
      listen: [
        "Rain or raining, and a reason such as the umbrella or the drops.",
        "Lluvia o llueve, y una razón como el paraguas o las gotas.",
      ],
    },
    {
      scene: "seed-sprout",
      text: [
        "One week later, Mia sees tiny green sprouts. Look, Grandpa! They are growing!",
        "Una semana después, Mia ve brotes verdes y pequeñitos. ¡Mira, abuelo! ¡Están creciendo!",
      ],
      ask: [
        "What did Mia see? How do you think she feels?",
        "¿Qué vio Mia? ¿Cómo crees que se siente?",
      ],
      listen: [
        "Sprouts, plants or green, and a feeling word such as happy or excited.",
        "Brotes, plantas o verde, y una palabra de sentimiento como feliz o emocionada.",
      ],
    },
    {
      scene: "seed-flower",
      text: [
        "In summer, the plants are tall. There are yellow flowers and red tomatoes. Mia picks the ripe ones and puts them in the basket.",
        "En verano, las plantas están altas. Hay flores amarillas y tomates rojos. Mia recoge los maduros y los pone en la canasta.",
      ],
      ask: ["What colors do you see? What did Mia pick?", "¿Qué colores ves? ¿Qué recogió Mia?"],
      listen: [
        "Color words (yellow, red, green) and tomatoes.",
        "Palabras de colores (amarillo, rojo, verde) y tomates.",
      ],
    },
    {
      scene: "garden-share",
      text: [
        "There are too many tomatoes for one family! Mia and Grandpa put them on a table for the neighbors. Everyone shares.",
        "¡Hay demasiados tomates para una sola familia! Mia y su abuelo los ponen en una mesa para los vecinos. Todos comparten.",
      ],
      ask: [
        "What would you share with a neighbor or a friend?",
        "¿Qué compartirías con un vecino o un amigo?",
      ],
      listen: [
        "Any answer the child can say: a word, a short sentence, or pointing.",
        "Cualquier respuesta que el niño pueda decir: una palabra, una oración corta o señalar.",
      ],
    },
  ],
  retell: {
    ask: [
      "Now you tell the story. What happened first? What happened next? What happened at the end?",
      "Ahora cuéntame tú el cuento. ¿Qué pasó primero? ¿Qué pasó después? ¿Qué pasó al final?",
    ],
    scenes: ["seed-plant", "park-rain", "seed-sprout", "garden-share"],
    listen: [
      "Any order words (first, next, then, last) and at least two story events. Help with the pictures if needed.",
      "Palabras de orden (primero, después, luego, al final) y al menos dos sucesos del cuento. Ayude con los dibujos si hace falta.",
    ],
  },
};

const load = () => {
  try {
    return JSON.parse(storage.get(KEY) || "{}") || {};
  } catch {
    return {};
  }
};
const save = (s) => storage.set(KEY, JSON.stringify(s));

let page = 0;
let classMode = false;

const pagesTotal = () => STORY.pages.length + 1;

function controls(I) {
  return html`<nav class="early-story-nav" aria-label="${I.S("Story pages", "Páginas del cuento")}">
    <button
      type="button"
      class="btn early-big"
      data-story-go="${page - 1}"
      ${page === 0 ? raw("disabled") : ""}
    >
      ${icon("arrow-left")} ${I.T("Back", "Atrás")}
    </button>
    <span class="early-story-count"
      >${I.T(`Page ${page + 1} of ${pagesTotal()}`, `Página ${page + 1} de ${pagesTotal()}`)}</span
    >
    <button
      type="button"
      class="btn btn-primary early-big"
      data-story-go="${page + 1}"
      ${page >= pagesTotal() - 1 ? raw("disabled") : ""}
    >
      ${I.T("Next page", "Página siguiente")} ${icon("arrow-right")}
    </button>
  </nav>`;
}

function adultBox(ask, listen, I, saved) {
  const done = Boolean(saved.talked?.[page]);
  return html`<section class="early-adult" aria-labelledby="storyAskTitle">
    <h2 id="storyAskTitle">${icon("conversation")} ${I.T("Grown-up: ask", "Adulto: pregunte")}</h2>
    <p class="early-ask">
      <span lang="en">${ask[0]}</span
      >${I.spanish || I.bilingual ? html`<br /><span lang="es">${ask[1]}</span>` : ""}
    </p>
    <p class="early-actions">
      <button type="button" class="btn early-big" data-story-say="ask">
        ${icon("volume")} ${I.T("Read the question aloud", "Leer la pregunta en voz alta")}
      </button>
      <button type="button" class="btn early-big" data-story-talked aria-pressed="${done}">
        ${icon("check")}
        ${done ? I.T("We talked about it", "Ya lo conversamos") : I.T("Mark: we talked about it", "Marcar: ya lo conversamos")}
      </button>
    </p>
    <details class="early-listen" ${classMode ? "" : raw("open")}>
      <summary>${I.T("What to listen for", "Qué escuchar")}</summary>
      <p>${I.T(listen[0], listen[1])}</p>
      <p class="fine">
        ${I.T("Any answer is welcome. Repeat the child's words back in a full sentence; do not correct or score.", "Toda respuesta es bienvenida. Repita las palabras del niño en una oración completa; no corrija ni califique.")}
      </p>
    </details>
  </section>`;
}

export function render(ctx, I) {
  const saved = load();
  page = Math.min(Math.max(0, page), pagesTotal() - 1);
  const lang = I.mode === "es" ? "es" : "en";
  const isRetell = page === STORY.pages.length;
  const p = STORY.pages[page];
  return {
    title: I.S(STORY.title[0], STORY.title[1]),
    html: html`<article
      class="early-story ${classMode ? "is-class" : ""}"
      aria-labelledby="storyTitle"
    >
      <header class="early-head">
        <p class="eyebrow">
          ${I.T("Kindergarten · Story Time · read together", "Kínder · Hora del cuento · lean juntos")}
        </p>
        <h1 id="storyTitle" tabindex="-1">${I.T(STORY.title[0], STORY.title[1])}</h1>
        <p class="early-switch">
          <a class="btn small" href="${BASE}/early?grades=K"
            >${I.T("Kindergarten home", "Inicio de kínder")}</a
          >
          <button type="button" class="btn small" data-story-mode aria-pressed="${classMode}">
            ${classMode ? I.T("Class mode (projector): on", "Modo clase (proyector): activado") : I.T("Class mode (projector): off", "Modo clase (proyector): desactivado")}
          </button>
        </p>
        <p class="fine">
          ${I.T("A grown-up reads each page aloud (or taps Read the page), then asks the question. This is a shared story, not a test: nothing is scored or timed.", "Un adulto lee cada página en voz alta (o toca Leer la página) y luego hace la pregunta. Es un cuento compartido, no un examen: nada se califica ni se cronometra.")}
        </p>
      </header>
      ${
        isRetell
          ? html`<section
              class="early-story-page"
              aria-label="${I.S("Retell the story", "Volver a contar el cuento")}"
            >
              <h2>${I.T("Retell the story", "Vuelve a contar el cuento")}</h2>
              <ol class="early-retell">
                ${STORY.retell.scenes.map((s) => html`<li><figure class="early-scene">${raw(sceneSVG(s, lang))}</figure></li>`)}
              </ol>
              ${adultBox(STORY.retell.ask, STORY.retell.listen, I, saved)}
            </section>`
          : html`<section
              class="early-story-page"
              aria-label="${I.S(`Page ${page + 1}`, `Página ${page + 1}`)}"
            >
              <figure class="early-scene">${raw(sceneSVG(p.scene, lang))}</figure>
              <p class="early-story-text" lang="en">${p.text[0]}</p>
              ${I.spanish || I.bilingual ? html`<p class="early-story-text is-es" lang="es">${p.text[1]}</p>` : ""}
              <p class="early-actions">
                <button type="button" class="btn btn-primary early-big" data-story-say="text">
                  ${icon("volume")} ${I.T("Read the page", "Leer la página")}
                </button>
                ${I.spanish || I.bilingual ? html`<button type="button" class="btn early-big" data-story-say="text-es">${icon("volume")} Leer en español</button>` : ""}
              </p>
              ${adultBox(p.ask, p.listen, I, saved)}
            </section>`
      }
      ${controls(I)}
    </article>`,
  };
}

export function onClick(e, ctx, I) {
  const t = e.target;
  const go = t.closest("[data-story-go]");
  if (go) {
    stopSpeech();
    page = Number(go.dataset.storyGo) || 0;
    ctx.rerender();
    document.querySelector("#storyTitle")?.focus();
    return true;
  }
  if (t.closest("[data-story-mode]")) {
    classMode = !classMode;
    ctx.rerender();
    return true;
  }
  const say = t.closest("[data-story-say]");
  if (say) {
    const isRetell = page === STORY.pages.length;
    const p = isRetell ? STORY.retell : STORY.pages[page];
    const rate = ctx.prefs.rate || 0.85;
    const kind = say.dataset.storySay;
    if (kind === "text") speak(p.text[0], { rate, persona: "guide" });
    else if (kind === "text-es") speak(p.text[1], { lang: "es-US", rate });
    else if (I.mode === "es") speak(p.ask[1], { lang: "es-US", rate });
    else speak(p.ask[0], { rate, persona: "guide" });
    return true;
  }
  if (t.closest("[data-story-talked]")) {
    const s = load();
    s.talked = { ...(s.talked || {}), [page]: !s.talked?.[page] };
    save(s);
    ctx.rerender();
    return true;
  }
  return false;
}

export function unmount() {
  stopSpeech();
}
