// "Common questions" at the top of the Site Guide (/site-guide). Short answers that describe what the app really
// does: no accounts (src/store.js keeps progress on this device), Move my progress (/move) for another device, the
// Help and device check (/tools) for the microphone, and the micDeniedMessage fallback (continue without recording).
import { BASE, html } from "../util.js";

export const FAQ = Object.freeze([
  {
    id: "account",
    q: { en: "Do I need an account?", es: "¿Necesito una cuenta?" },
    a: {
      en: "No. You can practice without signing up: open a page and start. If your teacher gives you a class code, you can join the class with a nickname (not your full name).",
      es: "No. Puedes practicar sin registrarte: abre una página y empieza. Si tu docente te da un código de clase, puedes unirte a la clase con un apodo (no tu nombre completo).",
    },
  },
  {
    id: "saving",
    q: { en: "Where is my work saved?", es: "¿Dónde se guarda mi trabajo?" },
    a: {
      en: "On this device, in this browser. Come back on the same device and browser and your work is still there. Clearing the browser’s data erases it. If you joined a class, you can sign back in to your class on another computer.",
      es: "En este dispositivo, en este navegador. Si vuelves en el mismo dispositivo y navegador, tu trabajo sigue ahí. Si borras los datos del navegador, se borra. Si te uniste a una clase, puedes volver a entrar a tu clase en otra computadora.",
    },
    link: {
      href: "move",
      en: "Move my progress to another device",
      es: "Mover mi progreso a otro dispositivo",
    },
  },
  {
    id: "phone",
    q: { en: "Does it work on a phone?", es: "¿Funciona en un teléfono?" },
    a: {
      en: "Yes: phones, tablets, Chromebooks and computers. Speaking practice uses the microphone, and Read aloud in the top bar reads the page to you.",
      es: "Sí: teléfonos, tabletas, Chromebooks y computadoras. La práctica oral usa el micrófono, y Leer en voz alta en la barra superior te lee la página.",
    },
  },
  {
    id: "microphone",
    q: {
      en: "The microphone does not work. What can I do?",
      es: "El micrófono no funciona. ¿Qué hago?",
    },
    a: {
      en: "Allow the microphone when the browser asks, or turn it on in the browser’s site settings, then try the device check. No microphone? Practice aloud with a partner. You can continue without recording.",
      es: "Permite el micrófono cuando el navegador lo pida, o actívalo en la configuración del sitio del navegador, y luego prueba la revisión del dispositivo. ¿No hay micrófono? Practica en voz alta con un compañero. Puedes continuar sin grabar.",
    },
    link: { href: "tools", en: "Help and device check", es: "Ayuda y revisión del dispositivo" },
  },
]);

/** The block itself. `band` keeps the grade on the two lab links. */
export function faqHTML(I, band = "") {
  const q = band ? `?grades=${band}` : "";
  return html`<section class="sg-faq" aria-labelledby="sgFaqTitle">
    <h2 id="sgFaqTitle">${I.T("Common questions", "Preguntas frecuentes")}</h2>
    <dl class="sg-faq-list">
      ${FAQ.map(
        (f) =>
          html`<div class="sg-faq-item" id="faq-${f.id}">
            <dt>${I.TO(f.q)}</dt>
            <dd>
              ${I.TO(f.a)}
              ${f.link ? html` <a href="${BASE}/${f.link.href}${q}">${I.T(f.link.en, f.link.es)}</a>` : ""}
            </dd>
          </div>`,
      )}
    </dl>
  </section>`;
}
