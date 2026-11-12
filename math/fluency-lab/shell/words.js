// Interface wording for the student app, English and Spanish side by side. Mathematics shown in problems is
// generated with its own Spanish (question-es.js, engine captions); this table covers the app's own words.
import { getLang, setLang } from "../i18n.js";
import { TITLES_ES } from "./titles-es.js";

const ES = {
  "Math Fluency Lab": "Laboratorio de Fluidez Matemática",
  "What would you like to practice today?": "¿Qué te gustaría practicar hoy?",
  "Choose your grade": "Elige tu grado",
  Kindergarten: "Kínder",
  Grade: "Grado",
  "Start here": "Empieza aquí",
  "Start this skill": "Empezar esta destreza",
  "Choose a different skill": "Elegir otra destreza",
  "Continue learning": "Seguir aprendiendo",
  "Choose another skill": "Elegir otra destreza",
  "Change grade": "Cambiar de grado",
  "Learn & Practice": "Aprender y practicar",
  "Choose a Skill": "Elegir destreza",
  "My Progress": "Mi progreso",
  More: "Más",
  "Search skills": "Buscar destrezas",
  "Try “fractions”, “ratio”, “times tables”":
    "Prueba «fracciones», «razón», «tablas de multiplicar»",
  "No skills match that search in this grade.":
    "Ninguna destreza de este grado coincide con la búsqueda.",
  Start: "Empezar",
  "See it": "Míralo",
  "Try it": "Pruébalo",
  "Practice it": "Practícalo",
  "Understand it": "Entiéndelo",
  Next: "Siguiente",
  Back: "Atrás",
  "Skip to practice": "Ir a la práctica",
  "I see it — let me try": "Ya lo veo: déjame probar",
  "Go to practice": "Ir a la práctica",
  "Check answer": "Comprobar",
  "Your answer": "Tu respuesta",
  "Help me understand": "Ayúdame a entender",
  "More help": "Más ayuda",
  "Another way": "Otra manera",
  "Next problem": "Siguiente problema",
  "Try it again": "Inténtalo otra vez",
  "Show the solution": "Mostrar la solución",
  "Correct.": "Correcto.",
  "Not yet.": "Todavía no.",
  "You solved it with help. Try one on your own to show what you know.":
    "Lo resolviste con ayuda. Haz uno tú solo para mostrar lo que sabes.",
  "Solved on your own.": "Lo resolviste por tu cuenta.",
  "Here is the solution. A fresh problem of the same kind is next.":
    "Aquí está la solución. Sigue un problema nuevo del mismo tipo.",
  Leave: "Salir",
  "Problem {n}": "Problema {n}",
  "on your own": "por tu cuenta",
  "with help": "con ayuda",
  Hint: "Pista",
  "Picture it": "Imagínalo",
  "Step by step": "Paso a paso",
  "Watch out": "Cuidado",
  "The big idea": "La gran idea",
  "Worked example": "Ejemplo resuelto",
  "Your turn, together": "Tu turno, juntos",
  "What I practiced": "Lo que practiqué",
  "What I am getting stronger at": "En qué me estoy fortaleciendo",
  "What I can try next": "Lo que puedo probar ahora",
  "Remembered on my own": "Lo recuerdo por mi cuenta",
  "Nothing practiced yet in this grade. Pick a skill to begin.":
    "Todavía no has practicado en este grado. Elige una destreza para empezar.",
  "Time for a quick refresh": "Hora de un repaso rápido",
  "Mistakes to fix": "Errores para corregir",
  "Open the mistake notebook": "Abrir el cuaderno de errores",
  "For students": "Para estudiantes",
  "For teachers": "Para maestros",
  "For families": "Para familias",
  "Explore more": "Explorar más",
  Settings: "Ajustes",
  Close: "Cerrar",
  Español: "Español",
  English: "English",
  "Larger text": "Texto más grande",
  "Reading font": "Letra para leer",
  "Read aloud": "Leer en voz alta",
  Learner: "Estudiante",
  "Build it": "Constrúyelo",
  "Watch the idea": "Mira la idea",
  Play: "Reproducir",
  "Step {n} of {total}": "Paso {n} de {total}",
  Steps: "Pasos",
  "Say it in Spanish": "Dilo en español",
  "Sentence frame": "Marco de oración",
  "Explain your thinking": "Explica tu razonamiento",
  "Practice a mix": "Practicar una mezcla",
  "All skills": "Todas las destrezas",
  Recommended: "Recomendado",
  Learn: "Aprender",
  Practice: "Practicar",
  Review: "Repasar",
  Show: "Mostrar",
  "in English": "en inglés",
  "Compare your answer with the picture of this problem, then try once more.":
    "Compara tu respuesta con el dibujo de este problema y vuelve a intentarlo.",
  "Continue where you left off": "Sigue donde te quedaste",
  "Learn new": "Aprender algo nuevo",
  "Keep practicing": "Seguir practicando",
  "No skills match that search and filter.":
    "Ninguna destreza coincide con esa búsqueda y ese filtro.",
  new: "nuevo",
  "Game Room": "Sala de juegos",
  "Ratio Studio": "Estudio de razones",
  "Math Reality": "Matemáticas en la vida real",
  "Math tools and models": "Herramientas y modelos de matemáticas",
  "Math Writing Studio": "Estudio de escritura matemática",
  "Daily mix": "Mezcla del día",
  "Family Math Expedition": "Expedición matemática en familia",
  "Progress report and printing": "Informe de progreso e impresión",
  "Teacher studio: assignments, class reports, print packets":
    "Estudio del maestro: tareas, informes de la clase, paquetes para imprimir",
  "Starting-point checkup": "Prueba de punto de partida",
  "Full lab (all features)": "Laboratorio completo (todas las funciones)",
  "Reduce motion": "Reducir el movimiento",
  "Learner on this device": "Estudiante en este dispositivo",
  "Each learner keeps their own grade and progress on this device.":
    "Cada estudiante guarda su propio grado y progreso en este dispositivo.",
  "Back up or restore progress": "Guardar o recuperar una copia del progreso",
  On: "Activado",
  Off: "Desactivado",
  Listen: "Escuchar",
  "New context": "Situación nueva",
  Challenge: "Desafío",
  "Warm-up size": "Números más pequeños",
  "This skill builds on": "Esta destreza se apoya en",
  "A short review there can help.": "Un repaso corto allí puede ayudar.",
  "Words to know": "Palabras que debes saber",
  "similar word": "palabra parecida",
  "A similar problem, worked out": "Un problema parecido, resuelto",
  "a table": "una tabla",
  "a number line": "una recta numérica",
  "another picture": "otro dibujo",
  skills: "destrezas",
};

export const lang = () => getLang();
export function tr(text, vars = null) {
  const base = lang() === "es" && ES[text] ? ES[text] : text;
  return vars
    ? base.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m))
    : base;
}
export const pickL = (value) =>
  value && typeof value === "object"
    ? lang() === "es"
      ? value.es || value.en
      : value.en
    : (value ?? "");
export const setLanguage = (next, options) => setLang(next, options);
export function toggleLang() {
  setLang(lang() === "es" ? "en" : "es");
}
export const gradeName = (grade) => (grade === 0 ? tr("Kindergarten") : `${tr("Grade")} ${grade}`);
export const gradeShort = (grade) => (grade === 0 ? "K" : String(grade));
export const esc = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
export const missingSpanish = (texts) => texts.filter((text) => !ES[text]);

// A skill title or strand name in the interface language (titles-es.js); English is the fallback, never blank.
export const named = (english) => (lang() === "es" && TITLES_ES[english]) || english;
