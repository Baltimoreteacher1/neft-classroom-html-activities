// Spanish interface strings for the ACCESS enterprise surfaces. Keys are the exact English strings the UI builds.
// Machine-assisted translation, written in plain "tú" Spanish for families and teachers (matching the rest of the lab);
// not yet reviewed by a human translator. Practice content (passages, questions, choices, supports) is never translated.
import { TEACHER_EXACT, TEACHER_PATTERNS } from "./es-teacher.js";
import { P6_EXACT, P6_PATTERNS } from "./es-phase6.js";

export const ES_EXACT = {
  "Mixed practice samples": "Muestras de práctica mixta",
  "Practice library": "Biblioteca de práctica",
  "Original practice sets in listening, reading, speaking and writing for grades 3–5 and 6–8. Speaking sets need a microphone. They are saved for your teacher to review.": "Conjuntos de práctica originales de comprensión auditiva, lectura, expresión oral y escritura para los grados 3–5 y 6–8. Los conjuntos de expresión oral necesitan un micrófono. Se guardan para que tu maestro los revise.",
  "Grade band": "Grados",
  All: "Todos",
  "Grades 3–5": "Grados 3–5",
  "Grades 6–8": "Grados 6–8",
  Domain: "Destreza",
  ...TEACHER_EXACT,
  ...P6_EXACT,
  // chooser and set page
  "Assessment simulator": "Simulador de evaluación",
  "Practice like the real thing, or learn as you go":
    "Practica como en la prueba real, o aprende sobre la marcha",
  "Each set has passages, listening, speaking and writing. Choose":
    "Cada conjunto tiene lecturas, comprensión auditiva, expresión oral y escritura. Elige",
  "Test simulation": "Simulacro de prueba",
  "to practice on your own with no hints. Choose": "para practicar solo, sin pistas. Elige",
  "Learning mode": "Modo de aprendizaje",
  "to get feedback, supports and a fresh try.":
    "para recibir comentarios, apoyos y un nuevo intento.",
  "This is independent practice. It is not an official WIDA or ACCESS assessment and it does not produce an official score or level.":
    "Esta es práctica independiente. No es una evaluación oficial de WIDA ni de ACCESS y no da un puntaje ni un nivel oficial.",
  Breadcrumb: "Ruta de navegación",
  "Practice Lab": "Laboratorio de práctica",
  "Before you begin": "Antes de empezar",
  "You get no hints and no feedback until you finish.":
    "No recibes pistas ni comentarios hasta que termines.",
  "You can go back, mark questions for review, and change answers.":
    "Puedes volver atrás, marcar preguntas para revisar y cambiar tus respuestas.",
  "You submit when you are ready. Nothing is scored by the lab for speaking or writing.":
    "Envías cuando estés listo. El laboratorio no califica la expresión oral ni la escritura.",
  "Check an answer to get feedback.": "Comprueba una respuesta para recibir comentarios.",
  "Open Support 1, 2, then 3 if you need help.": "Abre el Apoyo 1, 2 y luego 3 si necesitas ayuda.",
  "Revise and try again. Your first try on your own is what shows independence.":
    "Corrige e inténtalo de nuevo. Tu primer intento por tu cuenta es lo que muestra independencia.",
  "Tools: highlighter, line reader, text size, and answer cross-out are at the top of every question.":
    "Las herramientas (resaltador, lector de líneas, tamaño del texto y tachar respuestas) están arriba en cada pregunta.",
  Start: "Empezar",
  "Resume where I left off": "Continuar donde lo dejé",
  "Start over": "Empezar de nuevo",
  // head, progress, timer
  "Questions answered": "Preguntas respondidas",
  "Show timer": "Mostrar cronómetro",
  "Hide timer": "Ocultar cronómetro",
  "Timer hidden": "Cronómetro oculto",
  // toolbar
  "Tools: highlighter, line reader, text size, cross-out":
    "Herramientas: resaltador, lector de líneas, tamaño del texto, tachar",
  "Assessment tools": "Herramientas de evaluación",
  Highlighter: "Resaltador",
  Yellow: "Amarillo",
  Blue: "Azul",
  Green: "Verde",
  "Highlight in yellow": "Resaltar en amarillo",
  "Highlight in blue": "Resaltar en azul",
  "Highlight in green": "Resaltar en verde",
  "Remove the highlight on the selected text": "Quitar el resaltado del texto seleccionado",
  "Clear selected": "Quitar selección",
  "Remove all highlights in this passage": "Quitar todos los resaltados de esta lectura",
  "Clear all": "Quitar todo",
  "Line reader": "Lector de líneas",
  "Make the reading window shorter": "Hacer la ventana de lectura más baja",
  Narrower: "Más baja",
  "Make the reading window taller": "Hacer la ventana de lectura más alta",
  Wider: "Más alta",
  Magnifier: "Lupa",
  "Text size 100%": "Tamaño del texto 100 %",
  "Text size 125%": "Tamaño del texto 125 %",
  "Text size 150%": "Tamaño del texto 150 %",
  "Text size 200%": "Tamaño del texto 200 %",
  "Answer tools": "Herramientas de respuesta",
  "Show a cross-out button on each answer choice": "Mostrar un botón para tachar en cada opción",
  Eliminate: "Descartar",
  "Mark for review": "Marcar para revisar",
  "Line reader on. Use the Up and Down arrow keys on the reader to move it.":
    "Lector de líneas activado. Usa las flechas arriba y abajo en el lector para moverlo.",
  "Line reader off.": "Lector de líneas desactivado.",
  "Line reader position": "Posición del lector de líneas",
  "Highlighter off.": "Resaltador desactivado.",
  "Answer eliminator on. Each choice has a cross-out button.":
    "Descarte de respuestas activado. Cada opción tiene un botón para tachar.",
  "Answer eliminator off.": "Descarte de respuestas desactivado.",
  "Keep at least one choice. You can restore a choice to eliminate another.":
    "Deja al menos una opción. Puedes restaurar una opción para descartar otra.",
  "All highlights removed.": "Se quitaron todos los resaltados.",
  "There are no highlights to remove.": "No hay resaltados que quitar.",
  "Highlight removed.": "Resaltado quitado.",
  "No highlight found at the selection.": "No hay resaltado en la selección.",
  "Select highlighted text first, then press Clear selected.":
    "Primero selecciona texto resaltado y luego oprime Quitar selección.",
  "Marked for review.": "Marcada para revisar.",
  "Mark removed.": "Se quitó la marca.",
  "Resize passage and question panels. Use the Left and Right arrow keys.":
    "Cambiar el tamaño de los paneles de la lectura y la pregunta. Usa las flechas izquierda y derecha.",
  // question area
  Question: "Pregunta",
  "Question navigation": "Navegación de preguntas",
  "Passage and materials": "Lectura y materiales",
  "Choose one answer.": "Elige una respuesta.",
  "Choose all the correct answers.": "Elige todas las respuestas correctas.",
  "Choose the best word or phrase for each blank.":
    "Elige la mejor palabra o frase para cada espacio.",
  "Put the lines in order.": "Pon las líneas en orden.",
  "Match each item. Select an item, then select its match.":
    "Une cada elemento. Selecciona un elemento y luego su pareja.",
  "Place each item in the right group. Select an item, then select where it goes.":
    "Coloca cada elemento en el grupo correcto. Selecciona un elemento y luego dónde va.",
  "Write your response.": "Escribe tu respuesta.",
  "Plan, then record your response.": "Planea y luego graba tu respuesta.",
  "Choose…": "Elige…",
  "Cross out": "Tachar",
  Restore: "Restaurar",
  Back: "Atrás",
  Next: "Siguiente",
  "Review all": "Revisar todo",
  "Review answers": "Revisar respuestas",
  Up: "Subir",
  Down: "Bajar",
  "Use the Up and Down buttons (or Alt + Arrow keys on a line) to put the lines in order.":
    "Usa los botones Subir y Bajar (o Alt + flechas sobre una línea) para poner las líneas en orden.",
  "Items to place": "Elementos para colocar",
  "Every item is placed.": "Todos los elementos están colocados.",
  "Undo last placement": "Deshacer la última colocación",
  "Selection cleared.": "Selección borrada.",
  "Select an item first.": "Primero selecciona un elemento.",
  "Last placement undone.": "Se deshizo la última colocación.",
  // formative
  Support: "Apoyo",
  "Support content": "Contenido del apoyo",
  "1. Strategic clue": "1. Pista estratégica",
  "2. Language support": "2. Apoyo del lenguaje",
  "3. Mentor model": "3. Modelo de ejemplo",
  "Strategic clue": "Pista estratégica",
  "Language support": "Apoyo del lenguaje",
  "Mentor model": "Modelo de ejemplo",
  "Check my answer": "Comprobar mi respuesta",
  "Revise and try again": "Corregir e intentar de nuevo",
  "Not yet.": "Todavía no.",
  "Correct on your own.": "Correcto, por tu cuenta.",
  "Correct, with support.": "Correcto, con apoyo.",
  "Correct after revising.": "Correcto después de corregir.",
  "Saved for teacher review.": "Guardado para que lo revise tu maestro.",
  "This response is not scored by the lab. Use the checklist, then revise or move on.":
    "El laboratorio no califica esta respuesta. Usa la lista de verificación y luego corrige o sigue adelante.",
  "Look again at the evidence, open a support, then revise.":
    "Vuelve a mirar la evidencia, abre un apoyo y luego corrige.",
  "That was your last attempt on this question. Move on, and try a similar one later.":
    "Ese fue tu último intento en esta pregunta. Sigue adelante e intenta una parecida más tarde.",
  // review and results
  "Review your answers": "Revisa tus respuestas",
  "Your answers": "Tus respuestas",
  Status: "Estado",
  Mark: "Marca",
  Action: "Acción",
  "Not answered": "Sin responder",
  Answered: "Respondida",
  "Marked for review": "Marcada para revisar",
  "Go to question": "Ir a la pregunta",
  "Keep working": "Seguir trabajando",
  "Submit my answers": "Enviar mis respuestas",
  "Session complete": "Sesión completa",
  "Your answers were submitted. This is practice: it is not an official score.":
    "Tus respuestas se enviaron. Esto es práctica: no es un puntaje oficial.",
  "Nice work. This shows what you did on your own and what you did with support.":
    "Buen trabajo. Esto muestra lo que hiciste por tu cuenta y lo que hiciste con apoyo.",
  "Objective questions right": "Preguntas objetivas correctas",
  "Right on your own": "Correctas por tu cuenta",
  "Right with support or revision": "Correctas con apoyo o corrección",
  "Saved for teacher review": "Guardadas para revisión del maestro",
  "Not answered ": "Sin responder",
  Time: "Tiempo",
  "Question by question": "Pregunta por pregunta",
  Domain: "Destreza",
  Result: "Resultado",
  How: "Cómo",
  "On my own": "Por mi cuenta",
  "With support or revision": "Con apoyo o corrección",
  Reading: "Lectura",
  Listening: "Comprensión auditiva",
  Speaking: "Expresión oral",
  Writing: "Escritura",
  Correct: "Correcta",
  "No answer": "Sin respuesta",
  "Needs teacher review": "Requiere revisión del maestro",
  "Practice results describe practice only. They are not a WIDA or ACCESS score or level.":
    "Los resultados de práctica describen solo la práctica. No son un puntaje ni un nivel de WIDA o ACCESS.",
  "Choose another practice": "Elegir otra práctica",
  "Time is up. Your answers were submitted.": "Se acabó el tiempo. Tus respuestas se enviaron.",
  // listening
  "Playing…": "Reproduciendo…",
  Stop: "Detener",
  "No plays left": "No quedan reproducciones",
  "No plays left.": "No quedan reproducciones.",
  "Finished.": "Terminó.",
  "Stopped.": "Detenido.",
  "That was the last play.": "Esa fue la última reproducción.",
  "Show the transcript": "Mostrar la transcripción",
  "The recording could not play. You did not lose a play. Check your speakers or volume, then try again.":
    "La grabación no se pudo reproducir. No perdiste ninguna reproducción. Revisa las bocinas o el volumen e inténtalo de nuevo.",
  "This browser cannot play the recording. Use a recent Chrome, Edge, Safari or Firefox, or ask your teacher for the printed listening script.":
    "Este navegador no puede reproducir la grabación. Usa una versión reciente de Chrome, Edge, Safari o Firefox, o pide a tu maestro el guion impreso.",
  "Audio playback is not available in this view.":
    "La reproducción de audio no está disponible en esta vista.",
  // speaking
  Microphone: "Micrófono",
  "Microphone level": "Nivel del micrófono",
  "Check my microphone": "Revisar mi micrófono",
  "Check again": "Revisar otra vez",
  "Checking…": "Revisando…",
  "Try again": "Intentar de nuevo",
  "Check your microphone first.": "Primero revisa tu micrófono.",
  "Check your microphone before you start.": "Revisa tu micrófono antes de empezar.",
  "Your browser is asking to use the microphone. Choose Allow.":
    "Tu navegador pide permiso para usar el micrófono. Elige Permitir.",
  "Say a sentence out loud, like “My name is…”. Checking for 3 seconds.":
    "Di una oración en voz alta, como “My name is…”. Revisando durante 3 segundos.",
  "Your microphone is working.": "Tu micrófono funciona.",
  "The microphone is blocked. Allow it in your browser’s site settings, then try again.":
    "El micrófono está bloqueado. Permítelo en la configuración del sitio de tu navegador e inténtalo de nuevo.",
  "No microphone was found. Plug one in or use another device, then try again.":
    "No se encontró un micrófono. Conecta uno o usa otro dispositivo e inténtalo de nuevo.",
  "This browser cannot record audio. Try a recent version of Chrome, Edge, Firefox or Safari.":
    "Este navegador no puede grabar audio. Prueba una versión reciente de Chrome, Edge, Firefox o Safari.",
  "The microphone did not hear you. Check that it is not muted, move closer, and try again.":
    "El micrófono no te escuchó. Revisa que no esté silenciado, acércate e inténtalo de nuevo.",
  "The microphone stopped. Check the device, then check again.":
    "El micrófono se detuvo. Revisa el dispositivo y vuelve a revisar.",
  "Start planning": "Empezar a planear",
  "Start recording": "Empezar a grabar",
  "Start recording now": "Empezar a grabar ahora",
  "Stop recording": "Detener la grabación",
  "Think about what you will say. Recording starts by itself when planning time ends.":
    "Piensa en lo que vas a decir. La grabación empieza sola cuando termina el tiempo de planear.",
  "Recording has started. Start speaking now.": "La grabación empezó. Empieza a hablar ahora.",
  "Getting your recording ready…": "Preparando tu grabación…",
  "Play your recording": "Reproducir tu grabación",
  "Play your saved recording": "Reproducir tu grabación guardada",
  "Use this recording": "Usar esta grabación",
  "Confirm submission": "Confirmar el envío",
  "Submit this recording? You cannot change it after you submit.":
    "¿Enviar esta grabación? No podrás cambiarla después de enviarla.",
  "Yes, submit": "Sí, enviar",
  "Go back": "Volver",
  "Your recording was saved on this device for your teacher.":
    "Tu grabación se guardó en este dispositivo para tu maestro.",
  "Recording is paused while you read the feedback.":
    "La grabación está en pausa mientras lees los comentarios.",
  "Recording is not available in this view yet.":
    "La grabación todavía no está disponible en esta vista.",
  "The audio is not on this device any more, but your teacher review status is kept.":
    "El audio ya no está en este dispositivo, pero se conserva el estado de revisión de tu maestro.",
  "Playback is not available right now.": "La reproducción no está disponible por ahora.",
  "The microphone was interrupted. Your recording was not saved. Check your microphone and begin again.":
    "El micrófono se interrumpió. Tu grabación no se guardó. Revisa el micrófono y empieza de nuevo.",
  "This device is out of storage space. Free some space, then confirm again.":
    "Este dispositivo no tiene espacio. Libera espacio y vuelve a confirmar.",
  "The recording could not be saved on this device.":
    "La grabación no se pudo guardar en este dispositivo.",
  // storage panel and connection
  "Your data on this device": "Tus datos en este dispositivo",
  "Saved in this browser on this device. Nothing is uploaded.":
    "Guardado en este navegador, en este dispositivo. No se sube nada.",
  "This browser is not saving your work (private browsing or blocked storage). It will be lost when you close the page. Export it to keep it.":
    "Este navegador no está guardando tu trabajo (navegación privada o almacenamiento bloqueado). Se perderá al cerrar la página. Expórtalo para conservarlo.",
  "Practice sittings saved": "Sesiones de práctica guardadas",
  "Evidence rows": "Registros de evidencia",
  Recordings: "Grabaciones",
  "Space used on this device": "Espacio usado en este dispositivo",
  "Export my practice data": "Exportar mis datos de práctica",
  "Export with recordings": "Exportar con grabaciones",
  "Import a saved file": "Importar un archivo guardado",
  "Choose an exported practice file": "Elegir un archivo de práctica exportado",
  "Delete my recordings": "Borrar mis grabaciones",
  "Delete all my practice data": "Borrar todos mis datos de práctica",
  "Delete every saved recording on this device? This cannot be undone.":
    "¿Borrar todas las grabaciones guardadas en este dispositivo? No se puede deshacer.",
  "Delete all sittings, evidence and recordings on this device? This cannot be undone.":
    "¿Borrar todas las sesiones, la evidencia y las grabaciones de este dispositivo? No se puede deshacer.",
  "Yes, delete recordings": "Sí, borrar grabaciones",
  "Yes, delete everything": "Sí, borrar todo",
  "Keep it": "Conservarlo",
  "Recordings deleted.": "Grabaciones borradas.",
  "All practice data deleted from this device.":
    "Se borraron todos los datos de práctica de este dispositivo.",
  "Exported your sittings and evidence. Recordings are not included.":
    "Se exportaron tus sesiones y tu evidencia. No se incluyen las grabaciones.",
  "Exported everything, including your recordings. Keep this file private: it contains your voice.":
    "Se exportó todo, incluidas tus grabaciones. Mantén este archivo en privado: contiene tu voz.",
  "That file could not be read. Choose a file exported from the ACCESS Practice Lab.":
    "No se pudo leer ese archivo. Elige un archivo exportado del Laboratorio de práctica ACCESS.",
  "You are offline. You can keep working: answers and recordings are saved on this device.":
    "No tienes conexión. Puedes seguir trabajando: las respuestas y grabaciones se guardan en este dispositivo.",
  "You are back online. Nothing needs to upload: your work is already saved on this device.":
    "Volviste a tener conexión. No hay nada que subir: tu trabajo ya está guardado en este dispositivo.",
};

const plural = (n, one, many) => (Number(n) === 1 ? one : many);
const stateWord = (s) =>
  ({
    "not answered": "sin responder",
    answered: "respondida",
    "marked for review": "marcada para revisar",
  })[s] || s;
const letter = (s) => s;

// Text with numbers or with authored content inside it. The authored part is carried through untouched.
export const ES_PATTERNS = [
  [/^(\d+) practice sets shown$/, (n) => `${n} conjuntos de práctica mostrados`],
  [/^(Listening|Reading|Speaking|Writing) · Grades (\d)–(\d) · (\d+) questions · about (\d+) minutes$/, (d, a, b, q, m) => `${{ Listening: "Comprensión auditiva", Reading: "Lectura", Speaking: "Expresión oral", Writing: "Escritura" }[d]} · Grados ${a}–${b} · ${q} preguntas · unos ${m} minutos`],
  [/^Grades (\d)–(\d) · (\d+) questions · about (\d+) minutes$/, (a, b, q, m) => `Grados ${a}–${b} · ${q} preguntas · unos ${m} minutos`],
  ...P6_PATTERNS,
  ...TEACHER_PATTERNS,
  [
    /^Question (\d+) of (\d+) · (\d+) answered$/,
    (a, b, c) => `Pregunta ${a} de ${b} · ${c} ${plural(c, "respondida", "respondidas")}`,
  ],
  [/^Question (\d+) of (\d+)\.$/, (a, b) => `Pregunta ${a} de ${b}.`],
  [
    /^Question (\d+), (.+)$/,
    (n, rest) => `Pregunta ${n}, ${rest.split(", ").map(stateWord).join(", ")}`,
  ],
  [/^Go to question (\d+)$/, (n) => `Ir a la pregunta ${n}`],
  [
    /^(Cross out|Restore) choice ([A-F])$/,
    (v, l) => `${v === "Cross out" ? "Tachar" : "Restaurar"} la opción ${letter(l)}`,
  ],
  [
    /^Choice ([A-F]) crossed out\. You can still select it\.$/,
    (l) => `Opción ${l} tachada. Todavía puedes seleccionarla.`,
  ],
  [/^Choice ([A-F]) restored\.$/, (l) => `Opción ${l} restaurada.`],
  [/^Move (up|down): (.+)$/, (d, t) => `${d === "up" ? "Subir" : "Bajar"}: ${t}`],
  [
    /^"(.+)" is now number (\d+) of (\d+)\.$/,
    (t, n, m) => `"${t}" ahora es el número ${n} de ${m}.`,
  ],
  [/^(.+) placed in (.+)\.$/, (t, z) => `${t} colocado en ${z}.`],
  [/^(.+) returned to the list\.$/, (t) => `${t} regresó a la lista.`],
  [
    /^(.+) selected\. Choose where to place it\.$/,
    (t) => `${t} seleccionado. Elige dónde colocarlo.`,
  ],
  [
    /^(.+), empty(?:\. Place (.+) here)?$/,
    (z, t) => `${z}, vacío${t ? `. Colocar ${t} aquí` : ""}`,
  ],
  [
    /^(.+), holds (.+?)(?:\. Place (.+) here)?$/,
    (z, h, t) => `${z}, contiene ${h}${t ? `. Colocar ${t} aquí` : ""}`,
  ],
  [
    /^(.+), placed\. Press to return it to the list\.$/,
    (t) => `${t}, colocado. Oprime para devolverlo a la lista.`,
  ],
  [
    /^(.+) (?:is|are) in this spot\. Select an item first to add another\.$/,
    (t) => `${t} ya está en este lugar. Primero selecciona un elemento para agregar otro.`,
  ],
  [/^Blank (\d+) of (\d+)$/, (a, b) => `Espacio ${a} de ${b}`],
  [/^Open support (\d+) first\.$/, (n) => `Abre primero el apoyo ${n}.`],
  [
    /^(Strategic clue|Language support|Mentor model) opened\.$/,
    (l) =>
      `${{ "Strategic clue": "Pista estratégica", "Language support": "Apoyo del lenguaje", "Mentor model": "Modelo de ejemplo" }[l]} abierto.`,
  ],
  [
    /^Attempt (\d+)\. Your last answer was cleared\.$/,
    (n) => `Intento ${n}. Se borró tu última respuesta.`,
  ],
  [/^(\d+) (minutes?) remaining\.$/, (n) => `Quedan ${n} ${plural(n, "minuto", "minutos")}.`],
  [/^Use the timer \((\d+) minutes\)$/, (n) => `Usar el cronómetro (${n} minutos)`],
  [
    /^(\d+) words? · aim for at least (\d+)(?: · up to (\d+))?$/,
    (n, min, max) =>
      `${n} ${plural(n, "palabra", "palabras")} · intenta escribir al menos ${min}${max ? ` · hasta ${max}` : ""}`,
  ],
  [
    /^(\d+) words?(?: · up to (\d+))?$/,
    (n, max) => `${n} ${plural(n, "palabra", "palabras")}${max ? ` · hasta ${max}` : ""}`,
  ],
  [
    /^(\d+) of (\d+) answered\.(?: Not answered: (.+?)\.)?(?: Marked for review: (.+?)\.)?$/,
    (a, b, na, mk) =>
      `${a} de ${b} respondidas.${na ? ` Sin responder: ${na}.` : ""}${mk ? ` Marcadas para revisar: ${mk}.` : ""}`,
  ],
  [/^Submit with (\d+) unanswered$/, (n) => `Enviar con ${n} sin responder`],
  [/^(\d+) of (\d+)$/, (a, b) => `${a} de ${b}`],
  [/^([\d.]+ [KM]B) of ([\d.]+ [KM]B)$/, (a, b) => `${a} de ${b}`],
  [/^Planning time: (.+)$/, (t) => `Tiempo para planear: ${t}`],
  [/^Recording · (.+) left$/, (t) => `Grabando · quedan ${t}`],
  [/^Your recording · ([\d.]+) seconds?$/, (n) => `Tu grabación · ${n} segundos`],
  [
    /^Recording finished: ([\d.]+) seconds?\. Listen, then choose\.$/,
    (n) => `La grabación terminó: ${n} segundos. Escúchala y elige.`,
  ],
  [
    /^Record again \((\d+) left\)$/,
    (n) => `Grabar otra vez (queda${Number(n) === 1 ? "" : "n"} ${n})`,
  ],
  [
    /^You will have (\d+) seconds to plan, then up to (\d+) seconds to speak\. You may record two times and keep the one you prefer\.$/,
    (p, r) => `Tendrás ${p} segundos para planear y hasta ${r} segundos para hablar. Puedes grabar dos veces y quedarte con la que prefieras.`,
  ],
  [
    /^You will have (\d+) seconds to plan, then up to (\d+) seconds to speak\. You can record one time\.$/,
    (p, r) => `Tendrás ${p} segundos para planear y hasta ${r} segundos para hablar. Puedes grabar una sola vez.`,
  ],
  [
    /^Saved on this device for your teacher · ([\d.]+) seconds?\. The lab does not score speaking\.$/,
    (n) =>
      `Guardada en este dispositivo para tu maestro · ${n} segundos. El laboratorio no califica la expresión oral.`,
  ],
  [/^Plays left: (\d+) of (\d+)$/, (a, b) => `Reproducciones restantes: ${a} de ${b}`],
  [
    /^Play recording \((\d+) plays?\)$/,
    (n) => `Reproducir la grabación (${n} ${plural(n, "reproducción", "reproducciones")})`,
  ],
  [
    /^Play again \((\d+) plays? left\)$/,
    (n) => `Reproducir otra vez (${plural(n, "queda", "quedan")} ${n})`,
  ],
  [
    /^You can listen (\d+) times\. You cannot pause or replay a part\.$/,
    (n) => `Puedes escuchar ${n} veces. No puedes pausar ni repetir una parte.`,
  ],
  [
    /^You can listen (\d+) times\. You can read the transcript to check what you heard\.$/,
    (n) => `Puedes escuchar ${n} veces. Puedes leer la transcripción para comprobar lo que oíste.`,
  ],
  [
    /^Imported (\d+) items?\.(?: (\d+) already here, so they were kept as they are\.)?\s*$/,
    (n, c) =>
      `Se importaron ${n} ${plural(n, "elemento", "elementos")}.${c ? ` ${c} ya estaban aquí, así que se conservaron como están.` : ""}`,
  ],
  [
    /^(\d+) (?:of (\d+) )?parts? (?:are|is) correct\.$/,
    (a, b) => `${a} de ${b} partes son correctas.`,
  ],
  [/^(\d+) of (\d+) parts are correct\.$/, (a, b) => `${a} de ${b} partes son correctas.`],
  [/^Reading window (\d+) pixels tall\.$/, (n) => `Ventana de lectura de ${n} píxeles de alto.`],
  [
    /^(Yellow|Blue|Green) (highlighter on)\. Select text to highlight it\.$/,
    (c) =>
      `Resaltador ${{ Yellow: "amarillo", Blue: "azul", Green: "verde" }[c]} activado. Selecciona texto para resaltarlo.`,
  ],
  [
    /^(Yellow|Blue|Green) highlight added\.$/,
    (c) => `Resaltado ${{ Yellow: "amarillo", Blue: "azul", Green: "verde" }[c]} agregado.`,
  ],
  [/^Text size (\d+) percent\.$/, (n) => `Tamaño del texto ${n} por ciento.`],
];
