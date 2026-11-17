// Family FAQ on the Family Hub (/family-start). Short, bilingual answers that describe what the site really does:
//   - no account: nothing to sign up for (src/family/state.js never asks for a name, birthday or email);
//   - work saves in this browser on this device (src/store.js, localStorage with a session fallback in util.js);
//     a private window forgets it on close; the Save & Continue Later page (src/family/save.js) gives a backup code;
//   - speaking uses the browser's microphone permission (src/recorder.js); recordings stay on the device
//     (src/audio-store.js) and the device check lives at /tools;
//   - practice is never a score or a test prediction.
// The full searchable help center stays at /family/help (content/family-help.json).
import { BASE, html, icon } from "../util.js";

const P = (en, es) => [en, es];

/** Each answer is one or two short paragraphs; `links` are [route, [en, es]] pairs inside the lab. */
export const FAMILY_FAQ = Object.freeze([
  {
    id: "start",
    q: P("Where do we start?", "¿Por dónde empezamos?"),
    a: [
      P(
        "Choose your child's grade at the top of this page. Then press Start for a short activity. Five minutes is a good first try.",
        "Elija el grado de su hijo o hija arriba en esta página. Luego presione Empezar para una actividad corta. Cinco minutos es un buen comienzo.",
      ),
      P(
        "If you want to see the whole site first, take the Family Tour. It is short and you can stop at any time.",
        "Si primero quiere ver todo el sitio, haga el recorrido familiar. Es corto y puede detenerlo cuando quiera.",
      ),
    ],
  },
  {
    id: "account",
    q: P("Does my child need an account?", "¿Mi hijo o hija necesita una cuenta?"),
    a: [
      P(
        "No. There is no account, sign-up or password. You do not need to give an email address.",
        "No. No hay cuenta, registro ni contraseña. No necesita dar un correo electrónico.",
      ),
      P(
        "If a teacher shares a class code, your child can join that class. You do not need a code to practice at home.",
        "Si un docente comparte un código de clase, su hijo o hija puede unirse a esa clase. No necesita un código para practicar en casa.",
      ),
    ],
  },
  {
    id: "save",
    q: P("How do we save work?", "¿Cómo guardamos el trabajo?"),
    a: [
      P(
        "Work saves by itself in this web browser on this device. It does not move to another phone or computer on its own.",
        "El trabajo se guarda solo en este navegador, en este dispositivo. No pasa solo a otro teléfono o computadora.",
      ),
      P(
        "In a private or incognito window, the work is erased when the window closes. Clearing browser data also erases it. To keep it safe, or to continue on another device, copy a backup code on the Save & Continue Later page.",
        "En una ventana privada o de incógnito, el trabajo se borra al cerrar la ventana. Borrar los datos del navegador también lo borra. Para guardarlo de forma segura, o para continuar en otro dispositivo, copie un código de respaldo en la página Guardar y continuar después.",
      ),
    ],
    links: [["family/save", P("Save & Continue Later", "Guardar y continuar después")]],
  },
  {
    id: "microphone",
    q: P("What if the microphone does not work?", "¿Qué hacemos si el micrófono no funciona?"),
    a: [
      P(
        "Speaking activities have a Record button. When the browser asks, choose Allow. If you chose Block by mistake, open the browser's settings for this site, allow the microphone, and reload the page.",
        "Las actividades para hablar tienen un botón Record (Grabar). Cuando el navegador pregunte, elija Permitir. Si eligió Bloquear por error, abra la configuración del navegador para este sitio, permita el micrófono y vuelva a cargar la página.",
      ),
      P(
        "Still not working? Your child can say the answer out loud to you instead. Recording is optional. Recordings stay on this device and are never uploaded.",
        "¿Sigue sin funcionar? Su hijo o hija puede decirle la respuesta en voz alta a usted. Grabar es opcional. Las grabaciones se quedan en este dispositivo y nunca se suben a internet.",
      ),
    ],
    links: [["tools", P("Check the microphone and sound", "Revisar el micrófono y el sonido")]],
  },
  {
    id: "phone",
    q: P("Can we practice on a phone?", "¿Podemos practicar en un teléfono?"),
    a: [
      P(
        "Yes. Open the site in the phone's web browser. There is nothing to install. Work saved on the phone stays on the phone.",
        "Sí. Abra el sitio en el navegador del teléfono. No hay que instalar nada. El trabajo guardado en el teléfono se queda en el teléfono.",
      ),
      P(
        "Writing activities are easier with a bigger screen or a keyboard, but they work on a phone too.",
        "Las actividades de escritura son más fáciles con una pantalla más grande o un teclado, pero también funcionan en un teléfono.",
      ),
    ],
  },
  {
    id: "choose",
    q: P("How do we choose an activity?", "¿Cómo escogemos una actividad?"),
    a: [
      P(
        "Start with a 5-minute activity. It mixes listening, speaking, reading and writing, and it starts with work your child has not done yet.",
        "Empiece con una actividad de 5 minutos. Mezcla escuchar, hablar, leer y escribir, y empieza con lo que su hijo o hija todavía no ha hecho.",
      ),
      P(
        "If the teacher asked for one skill, choose that skill. For a relaxed day, play a game, read a story or talk together.",
        "Si el docente pidió una destreza, elija esa destreza. Para un día tranquilo, jueguen, lean un cuento o conversen juntos.",
      ),
    ],
  },
  {
    id: "meaning",
    q: P("What does this practice tell us?", "¿Qué nos dice esta práctica?"),
    a: [
      P(
        "It shows what your child practiced and what to try next. It is practice, not a test score, and it does not predict a test result.",
        "Muestra lo que su hijo o hija practicó y qué probar después. Es práctica, no un puntaje de examen, y no predice el resultado de un examen.",
      ),
      P(
        "For school results, ask your child's teacher.",
        "Para los resultados de la escuela, pregunte al docente de su hijo o hija.",
      ),
    ],
    links: [["family/progress", P("See what we practiced", "Ver lo que practicamos")]],
  },
]);

/** The FAQ section. `pick` is the chosen grade (may be empty); links carry it so the next page keeps the grade. */
export function familyFaqHTML(I, pick = "") {
  const q = pick ? `?grades=${pick}` : "";
  return html`<section class="fs-help" id="fsHelp" aria-labelledby="fsHelpTitle">
    <h2 id="fsHelpTitle" tabindex="-1">
      ${icon("help")} ${I.T("Get help: family questions", "Ayuda: preguntas de las familias")}
    </h2>
    <ul class="fam-help-cards fs-faq">
      ${FAMILY_FAQ.map(
        (f) =>
          html`<li>
            <details id="fsFaq-${f.id}">
              <summary><strong>${I.T(f.q[0], f.q[1])}</strong></summary>
              <div class="fs-faq-a">
                ${f.a.map((p) => html`<p>${I.T(p[0], p[1])}</p>`)}
                ${(f.links || []).map(
                  ([route, label]) =>
                    html`<p>
                      <a href="${BASE}/${route}${q}"
                        >${I.T(label[0], label[1])} ${icon("arrow-right")}</a
                      >
                    </p>`,
                )}
              </div>
            </details>
          </li>`,
      )}
    </ul>
    <p class="fine fs-help-more">
      <a href="${BASE}/family/help${q}"
        >${I.T("More help for families", "Más ayuda para las familias")}</a
      >
      ·
      <a href="${BASE}/site-guide${q}">${I.T("Site Guide", "Guía del sitio")}</a>
    </p>
  </section>`;
}
