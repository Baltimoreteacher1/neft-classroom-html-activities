/* Family Math Expedition — page chrome and the names, titles and openers of the five stops.
 * Spanish addresses the family as "ustedes" (adult and child together), matching the other family pages. */
import { p } from "./core.js";

export const COPY = {
  brand: p("Math Fluency Lab", "Laboratorio de fluidez matemática"),
  brandBack: p("Back to the Math Fluency Lab", "Volver al Laboratorio de fluidez matemática"),
  title: p("Family Math Expedition", "Expedición matemática en familia"),
  kicker: p("A guided trip for the whole family", "Un viaje guiado para toda la familia"),
  lead: p(
    "Five short stops show you how the Math Fluency Lab works, how to help your child think without giving the answer, and how to start a routine tonight. About 12 minutes.",
    "Cinco paradas cortas les muestran cómo funciona el Laboratorio de fluidez matemática, cómo ayudar a su hijo o hija a pensar sin dar la respuesta, y cómo empezar una rutina esta noche. Unos 12 minutos.",
  ),
  noAccount: p(
    "No account. Your place is saved on this device only.",
    "Sin cuenta. Su avance se guarda solo en este dispositivo.",
  ),
  langLabel: p("Language", "Idioma"),
  start: p("Start the expedition", "Empezar la expedición"),
  resume: p("Resume where we stopped", "Continuar donde nos quedamos"),
  restart: p("Start over", "Empezar de nuevo"),
  skip: p("Skip to the map", "Ir directo al mapa"),
  gradeFirst: p("Choose your child's grade first.", "Primero elijan el grado de su hijo o hija."),
  stopOf: (n, t) => p(`Stop ${n} of ${t}`, `Parada ${n} de ${t}`),
  next: p("Next stop", "Siguiente parada"),
  back: p("Back", "Atrás"),
  skipStop: p("Skip this stop", "Saltar esta parada"),
  mapTitle: p("Your expedition map", "Su mapa de la expedición"),
  mapLead: p("Open any stop, in any order.", "Abran cualquier parada, en el orden que quieran."),
  open: p("Open this stop", "Abrir esta parada"),
  done: p("Done", "Hecho"),
  help: p("Help and map", "Ayuda y mapa"),
  helpTitle: p("Need help? Go anywhere.", "¿Necesitan ayuda? Vayan a donde quieran."),
  helpTour: p("Show me how inside the Lab", "Muéstrennos cómo dentro del Laboratorio"),
  helpTonight: p("Family Math Tonight", "Matemáticas en familia esta noche"),
  helpClose: p("Close", "Cerrar"),
  listen: p("Listen", "Escuchar"),
  stopListen: p("Stop listening", "Dejar de escuchar"),
  startQ: p("Start over from the beginning?", "¿Empezar de nuevo desde el principio?"),
  startQd: p(
    "This clears your grade and your place on this page. Practice you did in the Lab stays saved.",
    "Esto borra su grado y su avance en esta página. La práctica que hicieron en el Laboratorio se conserva.",
  ),
  yesStart: p("Yes, start over", "Sí, empezar de nuevo"),
  keep: p("Keep my place", "Conservar mi avance"),
  fresh: p("Fresh start.", "Comienzo nuevo."),
  saveFail: p(
    "This browser will not save your place. You can still finish the expedition.",
    "Este navegador no guardará su avance. Aun así pueden terminar la expedición.",
  ),
  loading: p("Getting the practice ready…", "Preparando la práctica…"),
  loadFail: p(
    "The practice list did not load. Check your connection and try again.",
    "La lista de práctica no cargó. Revisen su conexión e inténtenlo de nuevo.",
  ),
  retry: p("Try again", "Intentar de nuevo"),
  foot: p(
    "A family guide to the EduWonderLab Math Fluency Lab. No names or emails are collected here.",
    "Una guía familiar del Laboratorio de fluidez matemática de EduWonderLab. Aquí no se recopilan nombres ni correos.",
  ),
  gradeWord: p("Grade", "Grado"),
};

export const STOPS = [
  {
    id: "welcome",
    name: p("Welcome", "Bienvenida"),
    title: p("Welcome to Math Adventure", "Bienvenidos a la aventura matemática"),
    lead: p(
      "Meet your guide, pick a grade and see where the trail goes.",
      "Conozcan a su guía, elijan un grado y vean adónde lleva el camino.",
    ),
  },
  {
    id: "discover",
    name: p("Discover", "Descubrir"),
    title: p("Discover how math works", "Descubran cómo funcionan las matemáticas"),
    lead: p(
      "Move real models with your hands, then solve one challenge and explain why.",
      "Muevan modelos reales con las manos, luego resuelvan un reto y expliquen por qué.",
    ),
  },
  {
    id: "together",
    name: p("Learn together", "Aprender juntos"),
    title: p("Learn together", "Aprendan juntos"),
    lead: p(
      "Practice helping. Choose what to say and see how your child might answer.",
      "Practiquen cómo ayudar. Elijan qué decir y vean cómo podría responder su hijo o hija.",
    ),
  },
  {
    id: "explore",
    name: p("Explore the Lab", "Explorar el Laboratorio"),
    title: p("Explore the Math Fluency Lab", "Exploren el Laboratorio de fluidez matemática"),
    lead: p(
      "Every tool below is real. Each one opens the page it describes.",
      "Cada herramienta de abajo es real. Cada una abre la página que describe.",
    ),
  },
  {
    id: "night",
    name: p("First Math Night", "Primera noche de matemáticas"),
    title: p("Your first Family Math Night", "Su primera noche de matemáticas en familia"),
    lead: p(
      "Pick a skill and a routine. Get a plan, then start practicing right now.",
      "Elijan una habilidad y una rutina. Reciban un plan y empiecen a practicar ahora mismo.",
    ),
  },
];
