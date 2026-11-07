// Family time (/early/family): short talk-and-play activities for Kindergarten to Grade 2 at home, in English and
// Spanish. Nothing to buy or print; each one uses things most homes have. The grown-up can do them in the home
// language: talk in any language builds the ideas the English words attach to.
import { BAND_INFO } from "../bands.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { BASE, html, icon } from "../util.js";

/** { id, title, minutes, need, steps, talk } each as [english, spanish]. */
export const FAMILY_ACTIVITIES = [
  {
    id: "i-spy-colors",
    title: ["I Spy Colors", "Veo, veo colores"],
    minutes: 5,
    need: ["Nothing. Any room works.", "Nada. Sirve cualquier cuarto."],
    steps: [
      "Say: I spy something red. Your child looks and points.",
      "Your child names it in English or Spanish. Then switch: your child spies, you guess.",
    ],
    stepsEs: [
      "Diga: Veo, veo algo rojo. Su hijo busca y señala.",
      "Su hijo lo nombra en inglés o en español. Luego cambien: su hijo ve, usted adivina.",
    ],
    talk: ["I spy something ___.", "Veo, veo algo ___."],
  },
  {
    id: "first-sound-hunt",
    title: ["First-Sound Hunt", "Cacería del primer sonido"],
    minutes: 5,
    need: ["Things in the kitchen.", "Cosas de la cocina."],
    steps: [
      "Say a sound, like mmm. Find something that starts with it (milk!).",
      "Take turns. Stretch the first sound so it is easy to hear.",
    ],
    stepsEs: [
      "Diga un sonido, como mmm. Busquen algo que empiece así (¡milk, leche!).",
      "Túrnense. Alarguen el primer sonido para que se oiga bien.",
    ],
    talk: ["Milk starts with mmm.", "Milk empieza con mmm."],
  },
  {
    id: "neighborhood-walk",
    title: ["Neighborhood Word Walk", "Paseo de palabras por el vecindario"],
    minutes: 10,
    need: ["A short walk outside.", "Un paseo corto afuera."],
    steps: [
      "On a walk, name three things you see: a tree, a bus, a dog.",
      "At home, your child tells someone what you saw: first, next, last.",
    ],
    stepsEs: [
      "En un paseo, nombren tres cosas que ven: un árbol, un autobús, un perro.",
      "En casa, su hijo le cuenta a alguien lo que vieron: primero, después, al final.",
    ],
    talk: ["First we saw ___. Next we saw ___.", "Primero vimos ___. Después vimos ___."],
  },
  {
    id: "toy-retell",
    title: ["Retell with Toys", "Cuenta otra vez con juguetes"],
    minutes: 10,
    need: [
      "Two or three toys or spoons as characters.",
      "Dos o tres juguetes o cucharas como personajes.",
    ],
    steps: [
      "Read or tell a short story together.",
      "Your child acts it out with the toys and tells what happens.",
    ],
    stepsEs: [
      "Lean o cuenten un cuento corto juntos.",
      "Su hijo lo actúa con los juguetes y cuenta lo que pasa.",
    ],
    talk: ["At the beginning, ___. At the end, ___.", "Al principio, ___. Al final, ___."],
  },
  {
    id: "simon-says-places",
    title: ["Simon Says: Where?", "Simón dice: ¿dónde?"],
    minutes: 5,
    need: ["A pillow or a cup.", "Una almohada o un vaso."],
    steps: [
      "Say: Simon says put the cup on the pillow. Then under, next to, behind.",
      "Let your child give the directions to you.",
    ],
    stepsEs: [
      "Diga: Simón dice pon el vaso sobre la almohada. Luego debajo, al lado, detrás.",
      "Deje que su hijo le dé las instrucciones a usted.",
    ],
    talk: ["Put it ___ the pillow.", "Ponlo ___ la almohada."],
  },
  {
    id: "laundry-sort",
    title: ["Sort the Socks", "Ordenen los calcetines"],
    minutes: 5,
    need: ["Clean socks or shoes.", "Calcetines o zapatos limpios."],
    steps: [
      "Sort them by color or size. Count each pile.",
      "Ask: Which pile has more? How do you know?",
    ],
    stepsEs: [
      "Ordénenlos por color o tamaño. Cuenten cada montón.",
      "Pregunte: ¿Qué montón tiene más? ¿Cómo lo sabes?",
    ],
    talk: ["This pile has more because ___.", "Este montón tiene más porque ___."],
  },
  {
    id: "grocery-helper",
    title: ["Grocery List Helper", "Ayudante de la lista del mercado"],
    minutes: 10,
    need: ["Paper and a pencil.", "Papel y lápiz."],
    steps: [
      "Your child draws three foods you need and you write the words together.",
      "At the store, your child finds each one and checks it off.",
    ],
    stepsEs: [
      "Su hijo dibuja tres comidas que necesitan y ustedes escriben las palabras juntos.",
      "En la tienda, su hijo encuentra cada una y la marca.",
    ],
    talk: ["We need ___.", "Necesitamos ___."],
  },
  {
    id: "picture-talk",
    title: ["Bedtime Picture Talk", "Plática de dibujos a la hora de dormir"],
    minutes: 5,
    need: ["Any picture book or a family photo.", "Cualquier libro ilustrado o una foto familiar."],
    steps: [
      "Look at one picture. Ask: What do you see? What is happening?",
      "Add one word to what your child says: a dog, a big brown dog.",
    ],
    stepsEs: [
      "Miren un dibujo. Pregunte: ¿Qué ves? ¿Qué está pasando?",
      "Agregue una palabra a lo que dice su hijo: un perro, un perro grande y café.",
    ],
    talk: ["I see ___. It is ___.", "Veo ___. Es ___."],
  },
];

export function render(ctx, I) {
  const info = BAND_INFO[ctx.band] || {};
  return {
    title: I.S("Family time", "Tiempo en familia"),
    html: html`<article class="early-family" aria-labelledby="famTitle">
      <header class="early-head">
        <p class="eyebrow">
          ${I.T("Kindergarten to Grade 2 · at home", "Kínder a 2.º grado · en casa")}
        </p>
        <h1 id="famTitle" tabindex="-1">
          ${I.T("Family time: talk and play", "Tiempo en familia: hablar y jugar")}
        </h1>
        <p class="lead">
          ${I.T("Five to ten minutes, no screen needed. You can talk in English, Spanish or both: every language you share helps your child learn.", "De cinco a diez minutos, sin pantalla. Pueden hablar en inglés, en español o en los dos: cada idioma que comparten ayuda a su hijo a aprender.")}
        </p>
        <p class="early-switch">
          <a class="btn small" href="${BASE}/early?grades=${info.picker || ctx.band}"
            >${I.T("Practice home", "Página de práctica")}</a
          >
          <button type="button" class="btn small" data-fam-print>
            ${icon("print")} ${I.T("Print these activities", "Imprimir estas actividades")}
          </button>
        </p>
      </header>
      <ul class="early-fam-list">
        ${FAMILY_ACTIVITIES.map(
          (a) =>
            html`<li class="early-fam" id="fam-${a.id}">
              <h2>
                ${I.T(a.title[0], a.title[1])}
                <span class="fine">${I.T(`${a.minutes} min`, `${a.minutes} min`)}</span>
              </h2>
              <p><strong>${I.T("You need:", "Necesitan:")}</strong> ${I.T(a.need[0], a.need[1])}</p>
              <ol>
                ${a.steps.map((s, i) => html`<li>${I.T(s, a.stepsEs[i])}</li>`)}
              </ol>
              <p class="early-frame">
                <button
                  type="button"
                  class="early-hear"
                  data-fam-say="${a.talk[0]}"
                  aria-label="${I.S("Hear the talk starter", "Escuchar la frase para hablar")}"
                >
                  ${icon("volume")}
                </button>
                <span lang="en">${a.talk[0]}</span
                >${I.spanish || I.bilingual ? html` · <span lang="es">${a.talk[1]}</span>` : ""}
              </p>
            </li>`,
        )}
      </ul>
    </article>`,
  };
}

export function onClick(e, ctx) {
  const say = e.target.closest("[data-fam-say]");
  if (say) {
    speak(say.dataset.famSay, { rate: ctx.prefs.rate || 0.85 });
    return true;
  }
  if (e.target.closest("[data-fam-print]")) {
    window.print();
    return true;
  }
  return false;
}
export const unmount = () => stopSpeech();
