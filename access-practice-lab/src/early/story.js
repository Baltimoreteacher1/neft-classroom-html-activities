// Story Time Library (/early/story): original EduWonderLab picture stories for K–2 that a grown-up reads aloud
// and talks about with one child (Family mode) or a whole class on a projector (Class mode).
// Includes three complete picture books across Science, School Community, and Winter Math/Nature.
// Not a computer test: nothing is scored or timed, and "We talked about it" is only a bookmark on this device.
import { BAND_INFO } from "../bands.js";
import { storage } from "../util.js";
import { BASE, html, icon, raw } from "../util.js";
import { sceneSVG } from "./scenes.js";
import { speak, stop as stopSpeech } from "../speech.js";

const KEY = "accessPracticeLab:v1:early-story";

/** Book 1: Our Neighborhood Garden (preserved as STORY export for compatibility). */
export const STORY = {
  id: "garden",
  tag: ["Science & Community", "Ciencias y comunidad"],
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

/** Full Story Time Library: 3 original K–2 picture books. */
export const STORIES = [
  STORY,
  {
    id: "rainy-school",
    tag: ["School & Friendship", "Escuela y amistad"],
    title: ["A Rainy Day at School", "Un día lluvioso en la escuela"],
    pages: [
      {
        scene: "bus-stop",
        text: [
          "In the morning, Leo waits at the bus stop. Gray clouds cover the sky. He holds his yellow umbrella tight.",
          "Por la mañana, Leo espera en la parada del autobús. Nubes grises cubren el cielo. Sostiene fuerte su paraguas amarillo.",
        ],
        ask: ["Where is Leo going? What is he holding?", "¿A dónde va Leo? ¿Qué sostiene?"],
        listen: ["To school / the bus, and an umbrella.", "A la escuela / el autobús, y un paraguas."],
      },
      {
        scene: "classroom",
        text: [
          "Inside the classroom, it is warm and bright. The teacher shows colorful shapes and counting blocks on the rug.",
          "Dentro del salón hace calor y hay luz. La maestra muestra figuras de colores y bloques para contar en la alfombra.",
        ],
        ask: ["What can you see in the classroom?", "¿Qué puedes ver en el salón?"],
        listen: ["Teacher, table, shapes, colors, or books.", "Maestra, mesa, figuras, colores o libros."],
      },
      {
        scene: "library",
        text: [
          "Next, the class visits the school library. Leo picks a big book about frogs and rain.",
          "Después, la clase visita la biblioteca de la escuela. Leo elige un libro grande sobre ranas y lluvia.",
        ],
        ask: ["What kind of book would you pick at the library?", "¿Qué tipo de libro elegirías tú en la biblioteca?"],
        listen: ["Any topic the child likes: animals, trucks, space, stories.", "Cualquier tema que le guste al niño."],
      },
      {
        scene: "lunch-share",
        text: [
          "At lunch, a new student sits beside Leo. Leo smiles and shares half of his sweet apple slices.",
          "En el almuerzo, un estudiante nuevo se sienta junto a Leo. Leo sonríe y comparte la mitad de sus rebanadas de manzana.",
        ],
        ask: ["How did Leo help his new friend feel welcome?", "¿Cómo ayudó Leo a su nuevo amigo a sentirse bienvenido?"],
        listen: ["He smiled, sat with him, or shared his apple.", "Sonrió, se sentó con él o compartió su manzana."],
      },
      {
        scene: "new-friend",
        text: [
          "By afternoon, the rain stops! Leo and his new friend walk out to play together.",
          "¡Por la tarde deja de llover! Leo y su nuevo amigo salen a jugar juntos.",
        ],
        ask: ["What do you like to play with a friend?", "¿A qué te gusta jugar con un amigo?"],
        listen: ["Any play word: tag, swings, draw, blocks, soccer.", "Cualquier juego: columpios, dibujar, bloques, fútbol."],
      },
    ],
    retell: {
      ask: [
        "Tell Leo's school day! What happened in the morning, at lunch, and at the end?",
        "¡Cuenta el día escolar de Leo! ¿Qué pasó en la mañana, en el almuerzo y al final?",
      ],
      scenes: ["bus-stop", "classroom", "library", "new-friend"],
      listen: [
        "Morning, school/library, sharing lunch, making a friend.",
        "Mañana, escuela/biblioteca, compartir almuerzo, hacer un amigo.",
      ],
    },
  },
  {
    id: "lost-mittens",
    tag: ["Winter Science & Math", "Invierno, ciencias y matemáticas"],
    title: ["The Lost Mitten", "El guante perdido"],
    pages: [
      {
        scene: "snow-day",
        text: [
          "Snow falls softly on Saturday morning. Sofia puts on two red mittens and boots to explore the park.",
          "Cae nieve suave el sábado por la mañana. Sofía se pone dos guantes rojos y botas para explorar el parque.",
        ],
        ask: ["How many mittens does Sofia put on? Why does she need them?", "¿Cuántos guantes se pone Sofía? ¿Por qué los necesita?"],
        listen: ["Two mittens, to keep her hands warm in the snow.", "Dos guantes, para mantener sus manos calientes en la nieve."],
      },
      {
        scene: "lost-mitten",
        text: [
          "Oh no! One red mitten fell in the white snow! Sofia only has one mitten left.",
          "¡Oh, no! ¡Un guante rojo cayó en la nieve blanca! A Sofía solo le queda un guante.",
        ],
        ask: ["If she had 2 mittens and lost 1, how many does she have now?", "Si tenía 2 guantes y perdió 1, ¿cuántos tiene ahora?"],
        listen: ["One mitten left.", "Le queda un guante."],
      },
      {
        scene: "pond-life",
        text: [
          "Sofia looks near the quiet pond. She sees bird tracks in the snow, but no red mitten.",
          "Sofía busca cerca del estanque tranquilo. Ve huellas de pájaros en la nieve, pero no ve el guante rojo.",
        ],
        ask: ["What tracks did Sofia see in the snow?", "¿Qué huellas vio Sofía en la nieve?"],
        listen: ["Bird tracks or animal tracks.", "Huellas de pájaros o de animales."],
      },
      {
        scene: "kitchen-help",
        text: [
          "Back home, Grandma hangs the found mitten by the warm kitchen stove and pours warm cocoa.",
          "De vuelta en casa, la abuela cuelga el guante encontrado cerca de la estufa calientita y sirve chocolate caliente.",
        ],
        ask: ["How does warm cocoa feel after playing in the snow?", "¿Cómo se siente el chocolate caliente después de jugar en la nieve?"],
        listen: ["Warm, cozy, sweet, good, happy.", "Calientito, rico, dulce, feliz."],
      },
    ],
    retell: {
      ask: [
        "Tell the story of Sofia's mitten from beginning to end!",
        "¡Cuenta la historia del guante de Sofía de principio a fin!",
      ],
      scenes: ["snow-day", "lost-mitten", "pond-life", "kitchen-help"],
      listen: [
        "Put on two mittens, lost one, looked outside, warmed up at home.",
        "Se puso dos guantes, perdió uno, buscó afuera, se calentó en casa.",
      ],
    },
  },
];

const load = () => {
  try {
    return JSON.parse(storage.get(KEY) || "{}") || {};
  } catch {
    return {};
  }
};
const save = (s) => storage.set(KEY, JSON.stringify(s));

let storyIdx = 0;
let page = 0;
let classMode = false;

const activeStory = () => STORIES[storyIdx] || STORY;
const pagesTotal = () => activeStory().pages.length + 1;
const talkKey = (s, p) => (s.id === "garden" ? String(p) : `${s.id}:${p}`);

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

function adultBox(ask, listen, I, saved, story) {
  const done = Boolean(saved.talked?.[talkKey(story, page)]);
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
        ${done
          ? I.T("We talked about it", "Ya lo conversamos")
          : I.T("Mark: we talked about it", "Marcar: ya lo conversamos")}
      </button>
    </p>
    <details class="early-listen" ${classMode ? "" : raw("open")}>
      <summary>${I.T("What to listen for", "Qué escuchar")}</summary>
      <p>${I.T(listen[0], listen[1])}</p>
      <p class="fine">
        ${I.T(
          "Any answer is welcome. Repeat the child's words back in a full sentence; do not correct or score.",
          "Toda respuesta es bienvenida. Repita las palabras del niño en una oración completa; no corrija ni califique.",
        )}
      </p>
    </details>
  </section>`;
}

export function render(ctx, I) {
  const saved = load();
  const story = activeStory();
  const info = BAND_INFO[ctx.band] || {};
  page = Math.min(Math.max(0, page), pagesTotal() - 1);
  const lang = I.mode === "es" ? "es" : "en";
  const isRetell = page === story.pages.length;
  const p = story.pages[page];
  return {
    title: I.S(story.title[0], story.title[1]),
    html: html`<article
      class="early-story ${classMode ? "is-class" : ""}"
      aria-labelledby="storyTitle"
    >
      <header class="early-head">
        <p class="eyebrow">
          ${I.T(info.label || "Kindergarten", info.labelEs || "Kínder")} ·
          ${I.T("Story Time Library", "Biblioteca Hora del cuento")} ·
          ${I.T(story.tag[0], story.tag[1])}
        </p>
        <h1 id="storyTitle" tabindex="-1">${I.T(story.title[0], story.title[1])}</h1>
        <p class="early-switch">
          <a class="btn small" href="${BASE}/early?grades=${info.picker || ctx.band}"
            >${I.T("My practice home", "Mi página de práctica")}</a
          >
          <button type="button" class="btn small" data-story-mode aria-pressed="${classMode}">
            ${classMode
              ? I.T("Class mode (projector): on", "Modo clase (proyector): activado")
              : I.T("Class mode (projector): off", "Modo clase (proyector): desactivado")}
          </button>
        </p>
        <div class="early-decks" role="group" aria-label="${I.S("Story books", "Libros de cuentos")}">
          ${STORIES.map(
            (s, i) => html`<button
              type="button"
              class="btn small"
              data-story-book="${i}"
              aria-pressed="${i === storyIdx}"
            >
              ${I.T(s.title[0], s.title[1])}
            </button>`,
          )}
        </div>
        <p class="fine">
          ${I.T(
            "A grown-up reads each page aloud (or taps Read the page), then asks the question. This is a shared story, not a test: nothing is scored or timed.",
            "Un adulto lee cada página en voz alta (o toca Leer la página) y luego hace la pregunta. Es un cuento compartido, no un examen: nada se califica ni se cronometra.",
          )}
        </p>
      </header>
      ${isRetell
        ? html`<section
            class="early-story-page"
            aria-label="${I.S("Retell the story", "Volver a contar el cuento")}"
          >
            <h2>${I.T("Retell the story", "Vuelve a contar el cuento")}</h2>
            <ol class="early-retell">
              ${story.retell.scenes.map(
                (s) => html`<li><figure class="early-scene">${raw(sceneSVG(s, lang))}</figure></li>`,
              )}
            </ol>
            ${adultBox(story.retell.ask, story.retell.listen, I, saved, story)}
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
              ${I.spanish || I.bilingual
                ? html`<button type="button" class="btn early-big" data-story-say="text-es">
                    ${icon("volume")} Leer en español
                  </button>`
                : ""}
            </p>
            ${adultBox(p.ask, p.listen, I, saved, story)}
          </section>`}
      ${controls(I)}
    </article>`,
  };
}

export function onClick(e, ctx) {
  const t = e.target;
  const story = activeStory();
  const bookBtn = t.closest("[data-story-book]");
  if (bookBtn) {
    stopSpeech();
    storyIdx = Number(bookBtn.dataset.storyBook) || 0;
    page = 0;
    ctx.rerender();
    return true;
  }
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
    const isRetell = page === story.pages.length;
    const p = isRetell ? story.retell : story.pages[page];
    const rate = ctx.prefs.rate || 0.85;
    const kind = say.dataset.storySay;
    if (kind === "text") speak(p.text[0], { rate, persona: "guide" });
    else if (kind === "text-es") speak(p.text[1], { lang: "es-US", rate });
    else if (ctx.prefs.lang === "es") speak(p.ask[1], { lang: "es-US", rate });
    else speak(p.ask[0], { rate, persona: "guide" });
    return true;
  }
  if (t.closest("[data-story-talked]")) {
    const s = load();
    const k = talkKey(story, page);
    s.talked = { ...(s.talked || {}), [k]: !s.talked?.[k] };
    save(s);
    ctx.rerender();
    return true;
  }
  return false;
}

export function unmount() {
  stopSpeech();
}
