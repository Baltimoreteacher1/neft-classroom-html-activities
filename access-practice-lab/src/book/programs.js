// Book Studio grade-band programs: the one place that says how Book Studio speaks to grades 3–5 and to grades 6–8.
// Each program carries the bookshelf hero copy, the featured templates, the five-stage author's process (with a
// sentence frame for each stage), four author's-craft mini-lessons with a mentor sentence, and the standards the
// studio practises (CCSS Writing + WIDA ELD Standard 2 key language uses). Pure data: Node-testable, no DOM.
// Bands without their own program (K, 1, 2-3) use the 3–5 program, the gentlest one written.

/** WIDA ELD Standards Framework (2020) key language uses, with the colour each one wears on template cards. */
export const KEY_USES = Object.freeze({
  Narrate: { tone: "narrate", en: "Narrate", es: "Narrar" },
  Inform: { tone: "inform", en: "Inform", es: "Informar" },
  Explain: { tone: "explain", en: "Explain", es: "Explicar" },
  Argue: { tone: "argue", en: "Argue", es: "Argumentar" },
});

const STAGE_ICONS = ["lightbulb", "text", "wand", "check", "book"];

const P35 = {
  band: "3-5",
  name: { en: "Young Authors Studio", es: "Estudio de jóvenes autores" },
  grades: { en: "Grades 3–5", es: "Grados 3–5" },
  eyebrow: {
    en: "Plan · write · draw · record · publish",
    es: "Planea · escribe · dibuja · graba · publica",
  },
  lead: {
    en: "Make a real book with your words, your pictures and your voice. Every book has steps to follow, sentence starters when you need them, and a reader waiting at the end.",
    es: "Haz un libro de verdad con tus palabras, tus dibujos y tu voz. Cada libro tiene pasos para seguir, inicios de oración cuando los necesites y un lector esperando al final.",
  },
  featured: [
    "personal-narrative",
    "comic-conversation",
    "vocabulary-picture-book",
    "how-to",
    "my-community",
    "family-stories",
  ],
  stages: [
    {
      en: "Plan",
      es: "Planea",
      do: {
        en: "Pick a topic you know a lot about. Draw or list your ideas.",
        es: "Elige un tema que conoces bien. Dibuja o haz una lista de tus ideas.",
      },
      frame: { en: "My book is about ___.", es: "Mi libro trata de ___." },
    },
    {
      en: "Draft",
      es: "Escribe",
      do: {
        en: "Write one idea on each page. Don't worry about spelling yet.",
        es: "Escribe una idea en cada página. No te preocupes por la ortografía todavía.",
      },
      frame: { en: "First, ___. Next, ___.", es: "Primero, ___. Después, ___." },
    },
    {
      en: "Revise",
      es: "Mejora",
      do: {
        en: "Read it aloud. Add a detail, a feeling or a better word.",
        es: "Léelo en voz alta. Agrega un detalle, un sentimiento o una palabra mejor.",
      },
      frame: { en: "I can add ___ to show ___.", es: "Puedo agregar ___ para mostrar ___." },
    },
    {
      en: "Edit",
      es: "Corrige",
      do: {
        en: "Check capitals, end marks and spelling, one page at a time.",
        es: "Revisa mayúsculas, puntos y ortografía, una página a la vez.",
      },
      frame: { en: "I fixed ___ on page ___.", es: "Corregí ___ en la página ___." },
    },
    {
      en: "Publish",
      es: "Publica",
      do: {
        en: "Add a cover, record your voice and share it with a reader.",
        es: "Agrega una portada, graba tu voz y compártelo con un lector.",
      },
      frame: { en: "I hope my reader learns ___.", es: "Espero que mi lector aprenda ___." },
    },
  ],
  craft: [
    {
      en: "Hook your reader",
      es: "Atrapa a tu lector",
      tip: {
        en: "Start with a sound, a question or someone talking.",
        es: "Empieza con un sonido, una pregunta o alguien hablando.",
      },
      mentor: {
        en: "“Crash!” The whole tower of blocks fell down.",
        es: "“¡Pum!” Toda la torre de bloques se cayó.",
      },
    },
    {
      en: "Show the feeling",
      es: "Muestra el sentimiento",
      tip: {
        en: "Tell what a body does instead of only naming the feeling.",
        es: "Cuenta lo que hace el cuerpo en lugar de solo nombrar el sentimiento.",
      },
      mentor: {
        en: "My hands shook and my heart went thump, thump.",
        es: "Me temblaban las manos y el corazón me hacía pum, pum.",
      },
    },
    {
      en: "Use order words",
      es: "Usa palabras de orden",
      tip: {
        en: "First, next, then and finally walk your reader through the book.",
        es: "Primero, después, luego y por último guían a tu lector por el libro.",
      },
      mentor: {
        en: "First, we mixed the flour. Then we waited for the dough to grow.",
        es: "Primero, mezclamos la harina. Luego esperamos a que la masa creciera.",
      },
    },
    {
      en: "Pick a strong verb",
      es: "Elige un verbo fuerte",
      tip: {
        en: "Trade “went” or “said” for a word that paints a picture.",
        es: "Cambia “fue” o “dijo” por una palabra que pinte una imagen.",
      },
      mentor: {
        en: "My little brother raced across the park and shouted my name.",
        es: "Mi hermanito corrió por el parque y gritó mi nombre.",
      },
    },
  ],
  standards: {
    ccss: {
      en: "CCSS Writing W.3–5.1–3 (opinion, informative, narrative) · W.3–5.4–6 (production, revision, publishing with technology)",
      es: "CCSS Escritura W.3–5.1–3 (opinión, informativo, narrativo) · W.3–5.4–6 (producción, revisión, publicación con tecnología)",
    },
    wida: {
      en: "WIDA ELD Standard 2, Language for Language Arts, grades 4–5 cluster: Narrate, Inform, Explain, Argue",
      es: "WIDA ELD Estándar 2, lenguaje para Artes del lenguaje, grupo de grados 4–5: narrar, informar, explicar, argumentar",
    },
  },
};

const P68 = {
  band: "6-8",
  name: { en: "Writers' Workshop", es: "Taller de escritores" },
  grades: { en: "Grades 6–8", es: "Grados 6–8" },
  eyebrow: {
    en: "Research · draft · design · revise · publish",
    es: "Investiga · escribe · diseña · revisa · publica",
  },
  lead: {
    en: "Publish work that sounds like you and holds up to a real audience: arguments built on evidence, investigations with data, stories with voice. Plan it, draft it, revise it, then put it out into the world.",
    es: "Publica un trabajo con tu propia voz que convenza a un público real: argumentos con evidencia, investigaciones con datos, cuentos con voz. Planéalo, escríbelo, revísalo y compártelo con el mundo.",
  },
  featured: [
    "evidence-argument",
    "science-investigation",
    "informational-report",
    "mystery-story",
    "biography",
    "compare-contrast",
  ],
  stages: [
    {
      en: "Plan",
      es: "Planea",
      do: {
        en: "Name your purpose and audience. Gather evidence or map the plot.",
        es: "Define tu propósito y tu público. Reúne evidencia o traza la trama.",
      },
      frame: { en: "My purpose is to ___ so that ___.", es: "Mi propósito es ___ para que ___." },
    },
    {
      en: "Draft",
      es: "Escribe",
      do: {
        en: "Get the whole piece down. Each page does one job.",
        es: "Escribe todo el texto. Cada página cumple una función.",
      },
      frame: { en: "This page shows ___ because ___.", es: "Esta página muestra ___ porque ___." },
    },
    {
      en: "Revise",
      es: "Revisa",
      do: {
        en: "Strengthen reasons, cut what doesn't help, and connect ideas with transitions.",
        es: "Fortalece tus razones, quita lo que no ayuda y conecta ideas con transiciones.",
      },
      frame: {
        en: "To make my claim stronger, I added ___.",
        es: "Para reforzar mi afirmación, agregué ___.",
      },
    },
    {
      en: "Edit",
      es: "Corrige",
      do: {
        en: "Check sentence boundaries, verb tense and how you cite sources.",
        es: "Revisa el límite de las oraciones, los tiempos verbales y cómo citas tus fuentes.",
      },
      frame: {
        en: "I changed ___ to ___ for accuracy.",
        es: "Cambié ___ por ___ para ser preciso.",
      },
    },
    {
      en: "Publish",
      es: "Publica",
      do: {
        en: "Design the layout, narrate key pages and share it for feedback.",
        es: "Diseña el formato, narra las páginas clave y compártelo para recibir comentarios.",
      },
      frame: {
        en: "The most important idea for my audience is ___.",
        es: "La idea más importante para mi público es ___.",
      },
    },
  ],
  craft: [
    {
      en: "Choose a lead",
      es: "Elige un comienzo",
      tip: {
        en: "Open with a surprising fact, a scene or a question your audience cares about.",
        es: "Empieza con un dato sorprendente, una escena o una pregunta que le importe a tu público.",
      },
      mentor: {
        en: "Every day, our school throws away enough food to feed forty people.",
        es: "Cada día, nuestra escuela tira suficiente comida para alimentar a cuarenta personas.",
      },
    },
    {
      en: "Cite your evidence",
      es: "Cita tu evidencia",
      tip: {
        en: "Name the source, give the fact, then explain why it matters.",
        es: "Nombra la fuente, da el dato y luego explica por qué importa.",
      },
      mentor: {
        en: "According to our cafeteria survey, 62% of students skip the vegetables, which shows the menu needs to change.",
        es: "Según nuestra encuesta de la cafetería, el 62 % de los estudiantes no come las verduras, lo que muestra que el menú debe cambiar.",
      },
    },
    {
      en: "Answer the other side",
      es: "Responde al otro lado",
      tip: {
        en: "Name a counterclaim fairly, then show why your reasons still win.",
        es: "Presenta el contraargumento con justicia y muestra por qué tus razones siguen ganando.",
      },
      mentor: {
        en: "Some people say longer recess wastes class time; however, studies show students focus better afterward.",
        es: "Algunos dicen que un recreo más largo quita tiempo de clase; sin embargo, los estudios muestran que los estudiantes se concentran mejor después.",
      },
    },
    {
      en: "Control the pace",
      es: "Controla el ritmo",
      tip: {
        en: "Slow down the key moment with dialogue and detail; summarize the rest.",
        es: "Haz más lento el momento clave con diálogo y detalles; resume lo demás.",
      },
      mentor: {
        en: "“Don't open it,” Maya whispered. The lid creaked. Nobody breathed.",
        es: "“No lo abras”, susurró Maya. La tapa crujió. Nadie respiraba.",
      },
    },
  ],
  standards: {
    ccss: {
      en: "CCSS Writing W.6–8.1–3 (argument, informative/explanatory, narrative) · W.6–8.4–6 (production, revision, publishing with technology) · W.6–8.8 (gather and cite sources)",
      es: "CCSS Escritura W.6–8.1–3 (argumentativo, informativo/explicativo, narrativo) · W.6–8.4–6 (producción, revisión, publicación con tecnología) · W.6–8.8 (reunir y citar fuentes)",
    },
    wida: {
      en: "WIDA ELD Standard 2, Language for Language Arts, grades 6–8 cluster: Narrate, Inform, Explain, Argue",
      es: "WIDA ELD Estándar 2, lenguaje para Artes del lenguaje, grupo de grados 6–8: narrar, informar, explicar, argumentar",
    },
  },
};

export const PROGRAMS = Object.freeze({ "3-5": P35, "6-8": P68 });
export const STAGE_ICON = STAGE_ICONS;

/** The program for a band (K, 1 and 2-3 use the 3–5 program). */
export const programFor = (band) => PROGRAMS[band] || P35;
