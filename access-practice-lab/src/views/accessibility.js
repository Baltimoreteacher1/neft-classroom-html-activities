// /accessibility: the lab's accessibility goal, what it offers, what it does not do well yet, and how to report a
// problem, in plain English and Spanish. The lab has no feedback route of its own, so reports go through the teacher;
// no email address is invented here.
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { BASE, html, icon } from "../util.js";
import { trustSectionHTML } from "./privacy.js";

export const ACCESSIBILITY_SECTIONS = [
  {
    id: "a11yGoal",
    title: ["Our goal", "Nuestra meta"],
    points: [
      [
        "The lab aims to meet WCAG 2.2 Level AA, the web’s common accessibility standard, on every page.",
        "El laboratorio busca cumplir WCAG 2.2 nivel AA, el estándar común de accesibilidad en la web, en todas sus páginas.",
      ],
      [
        "Automated accessibility checks (axe) run in the lab’s browser tests, and serious problems block a release.",
        "Las revisiones automáticas de accesibilidad (axe) se ejecutan en las pruebas del laboratorio en el navegador, y los problemas graves detienen una publicación.",
      ],
    ],
  },
  {
    id: "a11yFeatures",
    title: ["What helps", "Lo que ayuda"],
    points: [
      [
        "Everything works with a keyboard, with a visible focus outline and a “Skip to content” link.",
        "Todo funciona con el teclado, con un contorno de foco visible y un enlace “Saltar al contenido”.",
      ],
      [
        "Buttons and links have names for screen readers, and changes are announced.",
        "Los botones y enlaces tienen nombres para lectores de pantalla, y los cambios se anuncian.",
      ],
      [
        "“Read this page” reads the page aloud. Press Escape or Stop to end it. Many activities also have a Listen button.",
        "“Leer esta página” lee la página en voz alta. Presiona Escape o Detener para terminar. Muchas actividades también tienen un botón Escuchar.",
      ],
      [
        "Directions in English, Spanish or both.",
        "Instrucciones en inglés, en español o en ambos.",
      ],
      [
        "Comfort settings: bigger text, more space, calm colors and a high-contrast theme.",
        "Opciones de comodidad: texto más grande, más espacio, colores tranquilos y un tema de alto contraste.",
      ],
      [
        "No timers in daily practice. Only practice tests show a test-style timer, so the format feels familiar.",
        "No hay cronómetros en la práctica diaria. Solo las pruebas de práctica muestran un cronómetro como el de la prueba, para que el formato se sienta familiar.",
      ],
      [
        "Large tap targets, layouts that fit a phone, and less motion when your device asks for it.",
        "Botones grandes, diseños que caben en un teléfono y menos movimiento cuando tu dispositivo lo pide.",
      ],
    ],
  },
  {
    id: "a11yLimits",
    title: ["Known limits", "Límites conocidos"],
    points: [
      [
        "Voices for reading aloud come from your device. Quality, and whether a Spanish voice exists, depend on the device.",
        "Las voces para leer en voz alta vienen de tu dispositivo. La calidad, y si hay una voz en español, dependen del dispositivo.",
      ],
      [
        "Turning speech into words depends on the browser. Typing always works instead.",
        "Convertir la voz en palabras depende del navegador. Escribir siempre funciona en su lugar.",
      ],
      [
        "Recording needs a microphone and your permission.",
        "Grabar necesita un micrófono y tu permiso.",
      ],
      [
        "Not every page has been tested with every screen reader yet.",
        "Todavía no se han probado todas las páginas con todos los lectores de pantalla.",
      ],
    ],
  },
  {
    id: "a11yReport",
    title: ["Report a problem", "Informar un problema"],
    points: [
      [
        "If something is hard to use, tell your teacher which page and what happened. Families can tell the school the same way.",
        "Si algo es difícil de usar, dile a tu docente en qué página y qué pasó. Las familias pueden avisar a la escuela de la misma manera.",
      ],
      [
        "Accessibility problems are treated as bugs and fixed first.",
        "Los problemas de accesibilidad se tratan como errores y se arreglan primero.",
      ],
    ],
  },
];

export function render(ctx) {
  const I = i18nFor(ctx);
  const q = `?grades=${ctx.band}`;
  return {
    title: I.S("Accessibility", "Accesibilidad"),
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/${q}`],
        [I.S("Accessibility", "Accesibilidad"), null],
      ])}
      <article class="trust-page" aria-labelledby="a11yTitle">
        <header class="trust-head">
          <p class="eyebrow">${icon("help")} ${I.T("Accessibility", "Accesibilidad")}</p>
          <h1 id="a11yTitle" tabindex="-1">
            ${I.T("Accessibility in the lab", "Accesibilidad en el laboratorio")}
          </h1>
          <p class="lead">
            ${I.T("Everyone should be able to practice here. This is what the lab does, and what it does not do well yet.", "Todas las personas deberían poder practicar aquí. Esto es lo que hace el laboratorio y lo que todavía no hace bien.")}
          </p>
        </header>
        ${ACCESSIBILITY_SECTIONS.map((s) => trustSectionHTML(I, s.id, s.title, s.points))}
        <p class="fine">
          <a href="${BASE}/tools${q}"
            >${I.T("Help and device check", "Ayuda y revisión del dispositivo")}</a
          >
          ·
          <a href="${BASE}/privacy${q}">${I.T("Privacy", "Privacidad")}</a>
        </p>
      </article>`,
  };
}
