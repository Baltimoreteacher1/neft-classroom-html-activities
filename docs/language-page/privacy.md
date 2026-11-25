# The Language Page — privacy statement (draft for legal review)

> **GENERATED FILE.** Built by `tools/generate-language-page-privacy-doc.mjs` from the lab's privacy page
> (`access-practice-lab/src/views/privacy.js`) and `data/language-page-third-parties.json`. Edit those, then regenerate.
> **This is a draft for counsel (H-08). It is not legal advice and has not been reviewed.** The page says it describes
> "how the lab works", not what a statute requires.

## Third-party hosts the lab may contact
Checked in a real browser across the site's routes by `tools/validate-language-page-network.mjs`. Cloudflare serves the
site itself (it sees the visit's IP address and browser, as any host does). The list below is every *other* host:

| Host | Purpose | Data sent | Retention |
| --- | --- | --- | --- |
| _none_ | | | |

AI model providers are contacted **by the site's servers**, not by the browser, and only when a person presses a button or
sends a typed question; they are described in "AI helpers" below.

## What the privacy page says (English)

### The short version

- No accounts, no passwords and no email addresses. Nobody needs a real name to practice.
- Your practice saves on this device. It stays here unless you choose to join a class or make a save code.
- No ads. No third-party analytics or trackers. Nothing is sold.

### What stays on this device

- Your choices: language, grade, text size and reading comfort.
- Your practice: answers, finished activities, drafts, missions, your Passport and your learning record.
- The browser keeps these under names that start with “accessPracticeLab”, plus an on-device database for practice tests (ACCESS_Lab_DB).
- On a shared device, export your work from Passport before someone else uses the lab.

### Your voice and recordings

- The microphone turns on only when you press record.
- A recording disappears when the page closes or reloads, unless you press “Keep for my teacher”. Kept recordings stay on this device for up to 30 days (the newest 12), and you can delete them sooner.
- Some speaking tasks can turn your voice into words with the browser’s speech recognition. The lab asks for on-device recognition first; some browsers use their own speech service. You can always type instead.
- “Listen” and “Read this page” use the voices already on your device.

### Only if you join a class

- You join with your teacher’s class code and an alias: a nickname, never an email or a full name.
- Then your practice progress and a short summary are copied to this site’s own class database (Cloudflare D1) so your teacher can see your work.
- A recording goes to your teacher only when you choose to send it. Your teacher can answer with a voice note. Sent recordings and voice notes are deleted after 30 days.
- A writing “second look” sends only your draft, and only when you press its button.
- A class that is not used for 120 days is deleted with everything in it.

### AI helpers: what they get and what they keep

- AI is used in a few places, and each one runs only when a person presses its button or sends a typed question: Mr. Neft (the guide on the teacher and family pages), the writing “second look” in a class, the Book Studio coach, the characters in the simulations, and a few teacher-only tools.
- No AI helper writes your work for you, gives a score or level, or sees your name. The writing “second look” only picks which authored tip to show. The Book Studio coach only asks questions.
- Mr. Neft: your typed question (up to 400 characters) and up to three earlier turns go to an AI model (Google Gemini, or else Anthropic Claude Haiku, or else Cloudflare Workers AI). Please do not type names. We keep the question for 90 days with names, emails and phone numbers replaced, plus the page, grade choice, language and time. We keep no IP address and no answer.
- Writing “second look” and the Book Studio coach: only the words you wrote (up to about 2,000 characters) go to Anthropic Claude Haiku or Cloudflare Workers AI, never to Gemini. Nothing is stored, and no name, picture or recording is sent.
- Simulation characters: only your typed question, with names, emails and phone numbers replaced first, goes to the model, which just picks which authored answer the character gives. If no AI service is available, each helper stops and the lab shows its built-in tips instead.

### Our practices for student data

- Children’s privacy (COPPA): no accounts and no personal information required; an alias is enough.
- School records (FERPA): class data is used only for instruction and is shown only to the student and their teacher.
- Maryland Student Data Privacy Act: no selling of student data, no targeted advertising, no profiles for anything other than school, and data is deleted when asked.
- These describe how the lab works. They are not legal advice.

### How to delete your data

- On this device: press “Start everything fresh” at the bottom of any lab page. It clears all lab work, kept recordings and choices here.
- Kept recordings and postcards also have their own Delete buttons in Passport.
- In a class: “Leave class” on the My class page unlinks this device. To remove what the class already has, ask your teacher: a teacher can remove one student or delete the whole class.

## Lo que dice la página de privacidad (español)

### En pocas palabras

- Sin cuentas, sin contraseñas y sin correos electrónicos. Nadie necesita su nombre real para practicar.
- Tu práctica se guarda en este dispositivo. Se queda aquí, a menos que elijas unirte a una clase o crear un código para guardar.
- Sin anuncios. Sin análisis ni rastreadores de terceros. Nada se vende.

### Lo que se queda en este dispositivo

- Tus opciones: idioma, grado, tamaño del texto y comodidad de lectura.
- Tu práctica: respuestas, actividades terminadas, borradores, misiones, tu Pasaporte y tu registro de aprendizaje.
- El navegador los guarda con nombres que empiezan con “accessPracticeLab”, además de una base de datos en el dispositivo para las pruebas de práctica (ACCESS_Lab_DB).
- En un dispositivo compartido, exporta tu trabajo desde el Pasaporte antes de que otra persona use el laboratorio.

### Tu voz y tus grabaciones

- El micrófono se enciende solo cuando presionas grabar.
- Una grabación desaparece al cerrar o recargar la página, a menos que presiones “Guardar para mi docente”. Las grabaciones guardadas se quedan en este dispositivo hasta 30 días (las 12 más recientes), y puedes borrarlas antes.
- Algunas tareas orales pueden convertir tu voz en palabras con el reconocimiento de voz del navegador. El laboratorio pide primero el reconocimiento en el dispositivo; algunos navegadores usan su propio servicio de voz. Siempre puedes escribir en su lugar.
- “Escuchar” y “Leer esta página” usan las voces que ya tiene tu dispositivo.

### Solo si te unes a una clase

- Te unes con el código de clase de tu docente y un alias: un apodo, nunca un correo ni tu nombre completo.
- Entonces tu progreso de práctica y un resumen corto se copian en la base de datos de clases de este sitio (Cloudflare D1) para que tu docente vea tu trabajo.
- Una grabación llega a tu docente solo cuando eliges enviarla. Tu docente puede responder con una nota de voz. Las grabaciones enviadas y las notas de voz se borran después de 30 días.
- La “segunda mirada” a tu escritura envía solo tu borrador, y solo cuando presionas su botón.
- Una clase que no se usa durante 120 días se borra con todo lo que contiene.

### Ayudantes de IA: lo que reciben y lo que guardan

- La IA se usa en pocos lugares, y cada uno funciona solo cuando una persona presiona su botón o envía una pregunta escrita: el Sr. Neft (la guía de las páginas para docentes y familias), la “segunda mirada” a la escritura en una clase, el entrenador de Book Studio, los personajes de las simulaciones y algunas herramientas solo para docentes.
- Ningún ayudante de IA escribe tu trabajo, da una nota o un nivel, ni ve tu nombre. La “segunda mirada” a la escritura solo elige qué consejo escrito por nosotros mostrar. El entrenador de Book Studio solo hace preguntas.
- Sr. Neft: tu pregunta escrita (hasta 400 caracteres) y hasta tres turnos anteriores van a un modelo de IA (Google Gemini, o si no Anthropic Claude Haiku, o si no Cloudflare Workers AI). Por favor no escribas nombres. Guardamos la pregunta 90 días, con los nombres, correos y teléfonos reemplazados, junto con la página, el grado elegido, el idioma y la hora. No guardamos la dirección IP ni la respuesta.
- “Segunda mirada” a la escritura y entrenador de Book Studio: solo las palabras que escribiste (hasta unos 2,000 caracteres) van a Anthropic Claude Haiku o a Cloudflare Workers AI, nunca a Gemini. No se guarda nada y no se envía ningún nombre, imagen ni grabación.
- Personajes de las simulaciones: solo tu pregunta escrita, con los nombres, correos y teléfonos reemplazados antes, va al modelo, que solo elige qué respuesta escrita por nosotros da el personaje. Si no hay un servicio de IA disponible, cada ayudante se detiene y el laboratorio muestra sus consejos integrados.

### Nuestras prácticas con los datos de estudiantes

- Privacidad infantil (COPPA): sin cuentas y sin información personal obligatoria; basta con un alias.
- Registros escolares (FERPA): los datos de clase se usan solo para enseñar y solo los ven el estudiante y su docente.
- Ley de Privacidad de Datos Estudiantiles de Maryland: no se venden datos de estudiantes, no hay publicidad dirigida, no se crean perfiles para nada que no sea la escuela y los datos se borran cuando se pide.
- Esto describe cómo funciona el laboratorio. No es asesoría legal.

### Cómo borrar tus datos

- En este dispositivo: presiona “Empezar todo de nuevo” al final de cualquier página del laboratorio. Borra todo el trabajo del laboratorio, las grabaciones guardadas y las opciones de aquí.
- Las grabaciones y postales guardadas también tienen su propio botón Eliminar en el Pasaporte.
- En una clase: “Salir de la clase” en la página Mi clase desconecta este dispositivo. Para borrar lo que la clase ya tiene, pídeselo a tu docente: puede quitar a un estudiante o borrar toda la clase.

## Questions for counsel
1. Whether the "Our practices for student data" wording (COPPA, FERPA, Maryland Student Data Privacy Act) is appropriate to publish.
2. Whether Anthropic, Google (Gemini) and Cloudflare are "subprocessors" needing agreements, given the AI helpers send a
   learner's draft (Claude Haiku or Workers AI) or a typed question (Gemini, Claude Haiku or Workers AI) on a button press.
3. The 90-day question log of the Mr. Neft guide (questions with names, emails and phone numbers replaced; no IP address,
   no answer) and the 120-day deletion of unused classes and 30-day deletion of voice notes and shared recordings.
4. The Teacher Hub and WIDA Data Studio are served with no password on thelanguagepage.com (a decision of 2026-11-17).
5. Whether the Spanish text, which is machine-drafted and unreviewed (H-05), may be published as the Spanish privacy notice.
