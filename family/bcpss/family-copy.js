// Every word a family reads on the Family Bridge pages, in English and Spanish (the two home languages
// this site supports). One place, so the two languages cannot drift apart.

export const LANGS = {
  en: {
    skip: "Skip to family guide",
    footer: "No login required. Talking about school ideas in your home language builds stronger English and deeper learning.",
    kickerPrefix: "What We Are Learning",
    questionsHeading: "Talk Together at Home",
    wordsHeading: "Words to Practice",
    tip: "Tip: Ask these questions in the language your family feels most comfortable speaking.",
    tryHeading: "Try It Together (10 minutes)",
    steps: [
      { title: "Say it", text: "Ask your child to finish this sentence out loud. Any language is fine to start." },
      { title: "Show it", text: "Draw or point to something from this unit, then explain it in one or two sentences." },
      { title: "Find it", text: "Look for the words below in books, signs, packages or on screens at home." },
    ],
    inEnglish: "In English",
    practiceHeading: "Practice Online",
    practiceNote: "Opens a short activity for your child. No login needed.",
    labs: {
      words: { name: "Word Lab", text: "Hear, say and match this unit's words." },
      speak: { name: "Speaking Practice", text: "Say ideas out loud and hear them back." },
      sentences: { name: "Sentence Builder", text: "Build clear sentences with the unit's words." },
      prep: { name: "ACCESS Prep", text: "Short practice for the yearly English language test (ACCESS)." },
    },
    print: "Print the fridge sheet",
    copy: "Copy link",
    copied: "Link copied",
    prev: "Previous unit",
    next: "Next unit",
    another: "Choose another unit",
    scanToOpen: "Scan to open this guide",
    dirTitle: "Find Your Child's Family Guide",
    dirIntro: "Pick your child's grade and subject. Each guide has questions to talk about, words to practice and short activities.",
    gradeStep: "1. Grade",
    subjectStep: "2. Subject",
    unitsStep: "3. Unit",
    chooseGrade: "Choose a grade to begin.",
    chooseSubject: "Now choose a subject.",
    loadingUnits: "Loading units…",
    noUnits: "No units found.",
    unitWord: "Unit",
    open: "Open guide",
    noUnit: "We could not find that unit.",
    kinder: "Kindergarten",
    gradeWord: "Grade",
    subjects: { ELA: "Reading & Writing (ELA)", Math: "Math", Science: "Science", "Social Studies": "Social Studies" },
  },
  es: {
    skip: "Saltar a la guía familiar",
    footer: "No se necesita iniciar sesión. Hablar de las ideas de la escuela en el idioma del hogar fortalece el inglés y el aprendizaje.",
    kickerPrefix: "Lo que estamos aprendiendo",
    questionsHeading: "Preguntas para conversar en casa",
    wordsHeading: "Palabras para practicar",
    tip: "Consejo: Hagan estas preguntas en el idioma en que su familia se sienta más cómoda.",
    tryHeading: "Para hacer juntos (10 minutos)",
    steps: [
      { title: "Decirlo", text: "Pídanle a su hijo/a que termine esta oración en voz alta. Para empezar, sirve cualquier idioma." },
      { title: "Mostrarlo", text: "Dibujar o señalar algo de esta unidad y explicarlo en una o dos oraciones." },
      { title: "Encontrarlo", text: "Buscar las palabras de abajo en libros, letreros, paquetes o pantallas de la casa." },
    ],
    inEnglish: "En inglés",
    practiceHeading: "Practicar en línea",
    practiceNote: "Abre una actividad corta para su hijo/a. No se necesita iniciar sesión.",
    labs: {
      words: { name: "Laboratorio de palabras", text: "Escuchar, decir y relacionar las palabras de la unidad." },
      speak: { name: "Práctica de conversación", text: "Decir ideas en voz alta y escucharlas." },
      sentences: { name: "Constructor de oraciones", text: "Armar oraciones claras con las palabras de la unidad." },
      prep: { name: "Preparación ACCESS", text: "Práctica breve para el examen anual de inglés (ACCESS)." },
    },
    print: "Imprimir la hoja para el refrigerador",
    copy: "Copiar enlace",
    copied: "Enlace copiado",
    prev: "Unidad anterior",
    next: "Unidad siguiente",
    another: "Elegir otra unidad",
    scanToOpen: "Escanee para abrir esta guía",
    dirTitle: "Encuentre la guía familiar de su hijo/a",
    dirIntro: "Elijan el grado y la materia de su hijo/a. Cada guía tiene preguntas para conversar, palabras para practicar y actividades cortas.",
    gradeStep: "1. Grado",
    subjectStep: "2. Materia",
    unitsStep: "3. Unidad",
    chooseGrade: "Elijan un grado para empezar.",
    chooseSubject: "Ahora elijan una materia.",
    loadingUnits: "Cargando unidades…",
    noUnits: "No se encontraron unidades.",
    unitWord: "Unidad",
    open: "Abrir guía",
    noUnit: "No pudimos encontrar esa unidad.",
    kinder: "Kínder",
    gradeWord: "Grado",
    subjects: { ELA: "Lectura y escritura (ELA)", Math: "Matemáticas", Science: "Ciencias", "Social Studies": "Estudios sociales" },
  },
};

export const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
export const SUBJECTS = ["ELA", "Math", "Science", "Social Studies"];

export const gradeText = (t, grade) => (grade === "K" ? t.kinder : `${t.gradeWord} ${grade}`);

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
