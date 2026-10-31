// One import for the tour copy: the two step lists, the one-step help bubbles, and the interface strings.
import { FAMILY_STEPS } from "./tour-steps-family.js";
import { STUDENT_STEPS } from "./tour-steps-student.js";

export const STEPS = { student: STUDENT_STEPS, family: FAMILY_STEPS };
export const EXPEDITION_HREF = "./family-adventure/";

// Help bubbles: a "?" next to a static part of the page opens one step with the same popover.
export const BUBBLES = [
  {
    id: "grade",
    anchor: "#choose-grade",
    host: ".grade-rail-heading",
    en: {
      title: "Your grade",
      body: ["Pick the grade you are working on. Each grade has its own skills and games."],
    },
    es: {
      title: "Tu grado",
      body: [
        "Elige el grado en el que estás trabajando. Cada grado tiene sus propias habilidades y juegos.",
      ],
    },
  },
  {
    id: "areas",
    anchor: "#hub-tabs",
    host: "#hub-tabs",
    en: {
      title: "Areas of the lab",
      body: [
        "Your journey is home. Games, Write, My progress and Fix my mistakes each open their own area. “For teachers” is for adults.",
      ],
    },
    es: {
      title: "Áreas del laboratorio",
      body: [
        "Tu camino es el inicio. Juegos, Escribir, Mi progreso y Corregir mis errores abren cada uno su propia área. “Para docentes” es para los adultos.",
      ],
    },
  },
  {
    id: "intro",
    anchor: ".intro-copy",
    host: ".intro-kicker",
    en: {
      title: "About this page",
      body: [
        "This is your home base. Pick up where you left off, or use “Show me how” to see how things work. Everything is saved on this device only.",
      ],
    },
    es: {
      title: "Sobre esta página",
      body: [
        "Este es tu punto de partida. Sigue donde te quedaste, o usa “Muéstrame cómo” para ver cómo funciona todo. Todo se guarda solo en este dispositivo.",
      ],
    },
  },
];

export const UI = {
  en: {
    student: "Student tour",
    family: "Family tour",
    stepOf: "Step {n} of {total}",
    progressLabel: "Tour progress",
    previous: "Previous",
    next: "Next",
    done: "Done",
    skip: "Skip tour",
    close: "Close and keep my place",
    closeBubble: "Close help",
    gotIt: "Got it",
    pause: "Pause animation",
    play: "Play animation",
    demoLabel: "Demonstration",
    helpLauncher: "Help and tours",
    menuLabel: "Help and tours",
    showStudent: "Show me how (student)",
    showFamily: "Show me how (family)",
    resume: "Resume tour",
    restart: "Restart tour",
    openExpedition: "Open Family Math Expedition",
    closeMenu: "Close menu",
    bubbleLabel: "Help: {topic}",
    offerTitle: "New here?",
    offerBody: "A quick tour shows you where things are. You can skip it any time.",
    offerStudent: "Take a 1-minute tour",
    offerFamily: "Tour for families",
    offerNo: "No thanks",
    offerLabel: "Tour offer",
    announce: "Step {n} of {total}: {title}",
  },
  es: {
    student: "Recorrido para estudiantes",
    family: "Recorrido para familias",
    stepOf: "Paso {n} de {total}",
    progressLabel: "Progreso del recorrido",
    previous: "Anterior",
    next: "Siguiente",
    done: "Listo",
    skip: "Omitir recorrido",
    close: "Cerrar y guardar mi lugar",
    closeBubble: "Cerrar ayuda",
    gotIt: "Entendido",
    pause: "Pausar animación",
    play: "Reproducir animación",
    demoLabel: "Demostración",
    helpLauncher: "Ayuda y recorridos",
    menuLabel: "Ayuda y recorridos",
    showStudent: "Muéstrame cómo (estudiante)",
    showFamily: "Muéstrenme cómo (familia)",
    resume: "Continuar recorrido",
    restart: "Reiniciar recorrido",
    openExpedition: "Abrir la Expedición de Matemáticas en Familia",
    closeMenu: "Cerrar menú",
    bubbleLabel: "Ayuda: {topic}",
    offerTitle: "¿Primera vez por aquí?",
    offerBody:
      "Un recorrido rápido te muestra dónde está cada cosa. Puedes omitirlo cuando quieras.",
    offerStudent: "Haz un recorrido de 1 minuto",
    offerFamily: "Recorrido para familias",
    offerNo: "No, gracias",
    offerLabel: "Oferta de recorrido",
    announce: "Paso {n} de {total}: {title}",
  },
};

export const ui = (lang, key, vars) => {
  const text = (UI[lang] || UI.en)[key] ?? UI.en[key] ?? key;
  return vars
    ? text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match))
    : text;
};
