// /privacy: what the lab keeps, where, and how to delete it, in plain English and Spanish. Written from what the code
// does (PLATFORM.md "Privacy and retention", docs/class-platform.md, src/reset.js, src/class/*). Practices, not legal
// advice. The site-level about/privacy.html is not served on the lab host, so the lab answers this itself.
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { BASE, html, icon } from "../util.js";

/** One section: a heading and a list of [en, es] points. Shared with the accessibility page. */
export const trustSectionHTML = (I, id, title, points) =>
  html`<section class="panel trust-section" aria-labelledby="${id}">
    <h2 id="${id}">${I.T(...title)}</h2>
    <ul>
      ${points.map((p) => html`<li>${I.T(...p)}</li>`)}
    </ul>
  </section>`;

export const PRIVACY_SECTIONS = [
  {
    id: "privShort",
    title: ["The short version", "En pocas palabras"],
    points: [
      [
        "No accounts, no passwords and no email addresses. Nobody needs a real name to practice.",
        "Sin cuentas, sin contraseñas y sin correos electrónicos. Nadie necesita su nombre real para practicar.",
      ],
      [
        "Your practice saves on this device. It stays here unless you choose to join a class or make a save code.",
        "Tu práctica se guarda en este dispositivo. Se queda aquí, a menos que elijas unirte a una clase o crear un código para guardar.",
      ],
      [
        "No ads. No third-party analytics or trackers. Nothing is sold.",
        "Sin anuncios. Sin análisis ni rastreadores de terceros. Nada se vende.",
      ],
    ],
  },
  {
    id: "privDevice",
    title: ["What stays on this device", "Lo que se queda en este dispositivo"],
    points: [
      [
        "Your choices: language, grade, text size and reading comfort.",
        "Tus opciones: idioma, grado, tamaño del texto y comodidad de lectura.",
      ],
      [
        "Your practice: answers, finished activities, drafts, missions, your Passport and your learning record.",
        "Tu práctica: respuestas, actividades terminadas, borradores, misiones, tu Pasaporte y tu registro de aprendizaje.",
      ],
      [
        "The browser keeps these under names that start with “accessPracticeLab”, plus an on-device database for practice tests (ACCESS_Lab_DB).",
        "El navegador los guarda con nombres que empiezan con “accessPracticeLab”, además de una base de datos en el dispositivo para las pruebas de práctica (ACCESS_Lab_DB).",
      ],
      [
        "On a shared device, export your work from Passport before someone else uses the lab.",
        "En un dispositivo compartido, exporta tu trabajo desde el Pasaporte antes de que otra persona use el laboratorio.",
      ],
    ],
  },
  {
    id: "privAudio",
    title: ["Your voice and recordings", "Tu voz y tus grabaciones"],
    points: [
      [
        "The microphone turns on only when you press record.",
        "El micrófono se enciende solo cuando presionas grabar.",
      ],
      [
        "A recording disappears when the page closes or reloads, unless you press “Keep for my teacher”. Kept recordings stay on this device for up to 30 days (the newest 12), and you can delete them sooner.",
        "Una grabación desaparece al cerrar o recargar la página, a menos que presiones “Guardar para mi docente”. Las grabaciones guardadas se quedan en este dispositivo hasta 30 días (las 12 más recientes), y puedes borrarlas antes.",
      ],
      [
        "Some speaking tasks can turn your voice into words with the browser’s speech recognition. The lab asks for on-device recognition first; some browsers use their own speech service. You can always type instead.",
        "Algunas tareas orales pueden convertir tu voz en palabras con el reconocimiento de voz del navegador. El laboratorio pide primero el reconocimiento en el dispositivo; algunos navegadores usan su propio servicio de voz. Siempre puedes escribir en su lugar.",
      ],
      [
        "“Listen” and “Read this page” use the voices already on your device.",
        "“Escuchar” y “Leer esta página” usan las voces que ya tiene tu dispositivo.",
      ],
    ],
  },
  {
    id: "privClass",
    title: ["Only if you join a class", "Solo si te unes a una clase"],
    points: [
      [
        "You join with your teacher’s class code and an alias: a nickname, never an email or a full name.",
        "Te unes con el código de clase de tu docente y un alias: un apodo, nunca un correo ni tu nombre completo.",
      ],
      [
        "Then your practice progress and a short summary are copied to this site’s own class database (Cloudflare D1) so your teacher can see your work.",
        "Entonces tu progreso de práctica y un resumen corto se copian en la base de datos de clases de este sitio (Cloudflare D1) para que tu docente vea tu trabajo.",
      ],
      [
        "A recording goes to your teacher only when you choose to send it. Your teacher can answer with a voice note. Sent recordings and voice notes are deleted after 30 days.",
        "Una grabación llega a tu docente solo cuando eliges enviarla. Tu docente puede responder con una nota de voz. Las grabaciones enviadas y las notas de voz se borran después de 30 días.",
      ],
      [
        "A writing “second look” sends only your draft, and only when you press its button.",
        "La “segunda mirada” a tu escritura envía solo tu borrador, y solo cuando presionas su botón.",
      ],
      [
        "A class that is not used for 120 days is deleted with everything in it.",
        "Una clase que no se usa durante 120 días se borra con todo lo que contiene.",
      ],
    ],
  },
  {
    id: "privPromises",
    title: ["Our practices for student data", "Nuestras prácticas con los datos de estudiantes"],
    points: [
      [
        "Children’s privacy (COPPA): no accounts and no personal information required; an alias is enough.",
        "Privacidad infantil (COPPA): sin cuentas y sin información personal obligatoria; basta con un alias.",
      ],
      [
        "School records (FERPA): class data is used only for instruction and is shown only to the student and their teacher.",
        "Registros escolares (FERPA): los datos de clase se usan solo para enseñar y solo los ven el estudiante y su docente.",
      ],
      [
        "Maryland Student Data Privacy Act: no selling of student data, no targeted advertising, no profiles for anything other than school, and data is deleted when asked.",
        "Ley de Privacidad de Datos Estudiantiles de Maryland: no se venden datos de estudiantes, no hay publicidad dirigida, no se crean perfiles para nada que no sea la escuela y los datos se borran cuando se pide.",
      ],
      [
        "These describe how the lab works. They are not legal advice.",
        "Esto describe cómo funciona el laboratorio. No es asesoría legal.",
      ],
    ],
  },
  {
    id: "privDelete",
    title: ["How to delete your data", "Cómo borrar tus datos"],
    points: [
      [
        "On this device: press “Start everything fresh” at the bottom of any lab page. It clears all lab work, kept recordings and choices here.",
        "En este dispositivo: presiona “Empezar todo de nuevo” al final de cualquier página del laboratorio. Borra todo el trabajo del laboratorio, las grabaciones guardadas y las opciones de aquí.",
      ],
      [
        "Kept recordings and postcards also have their own Delete buttons in Passport.",
        "Las grabaciones y postales guardadas también tienen su propio botón Eliminar en el Pasaporte.",
      ],
      [
        "In a class: “Leave class” on the My class page unlinks this device. To remove what the class already has, ask your teacher: a teacher can remove one student or delete the whole class.",
        "En una clase: “Salir de la clase” en la página Mi clase desconecta este dispositivo. Para borrar lo que la clase ya tiene, pídeselo a tu docente: puede quitar a un estudiante o borrar toda la clase.",
      ],
    ],
  },
];

export function render(ctx) {
  const I = i18nFor(ctx);
  const q = `?grades=${ctx.band}`;
  return {
    title: I.S("Privacy", "Privacidad"),
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/${q}`],
        [I.S("Privacy", "Privacidad"), null],
      ])}
      <article class="trust-page" aria-labelledby="privacyTitle">
        <header class="trust-head">
          <p class="eyebrow">${icon("lock")} ${I.T("Privacy", "Privacidad")}</p>
          <h1 id="privacyTitle" tabindex="-1">
            ${I.T("Your privacy in the lab", "Tu privacidad en el laboratorio")}
          </h1>
          <p class="lead">
            ${I.T("What the lab keeps, where it keeps it, and how to delete it.", "Lo que guarda el laboratorio, dónde lo guarda y cómo borrarlo.")}
          </p>
        </header>
        ${PRIVACY_SECTIONS.map((s) => trustSectionHTML(I, s.id, s.title, s.points))}
        <p class="fine">
          <a href="${BASE}/class${q}">${I.T("My class", "Mi clase")}</a> ·
          <a href="${BASE}/passport${q}">${I.T("My Passport", "Mi Pasaporte")}</a> ·
          <a href="${BASE}/accessibility${q}">${I.T("Accessibility", "Accesibilidad")}</a>
        </p>
      </article>`,
  };
}
