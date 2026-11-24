// Every word a family reads on the Family Guide pages, authored in English and Spanish side by side
// ({ en, es } pairs), so the two languages cannot drift apart. Spanish: adults in "ustedes", child lines in "tú".

const p = (en, es) => ({ en, es });

export const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
export const SUBJECTS = ["ELA", "Math", "Science", "Social Studies"];

export const SUBJECT_NAMES = {
  ELA: p("Reading & Writing", "Lectura y escritura"),
  Math: p("Math", "Matemáticas"),
  Science: p("Science", "Ciencias"),
  "Social Studies": p("Social Studies", "Estudios sociales"),
};

export const SUBJECT_ICONS = { ELA: "📖", Math: "➗", Science: "🔬", "Social Studies": "🗺️" };

export const gradeName = (g) => (g === "K" ? p("Kindergarten", "Kínder") : p(`Grade ${g}`, `Grado ${g}`));

export const KIND_LABELS = {
  match: p("Match the words", "Relacionar palabras"),
  word_sort: p("Sort the words", "Clasificar palabras"),
  clue_game: p("Guess the word", "Adivinar la palabra"),
  cloze: p("Fill the gaps", "Completar espacios"),
  unscramble: p("Build the sentence", "Armar la oración"),
  quiz: p("Quick quiz", "Preguntas rápidas"),
  sequence: p("Put in order", "Poner en orden"),
  talk_cards: p("Talk cards", "Tarjetas para conversar"),
};

export const C = {
  skip: p("Skip to the family guide", "Saltar a la guía familiar"),
  brand: p("Family Guide", "Guía familiar"),
  langGroup: p("Language", "Idioma"),
  langEn: p("English", "Inglés"),
  langEs: p("Spanish", "Español"),
  langBoth: p("English and Spanish together", "Inglés y español juntos"),
  footer: p(
    "No login required. Talking about school ideas in your home language builds stronger English and deeper learning.",
    "No se necesita iniciar sesión. Hablar de las ideas de la escuela en el idioma del hogar fortalece el inglés y el aprendizaje.",
  ),
  loading: p("Loading your family guide…", "Cargando su guía familiar…"),
  noUnit: p("We could not find that unit.", "No pudimos encontrar esa unidad."),
  retry: p("Choose another unit", "Elegir otra unidad"),
  onlyEnglish: p("English only", "Solo en inglés"),

  // Hero
  unitWord: p("Unit", "Unidad"),
  startHere: p("Start here", "Empiecen aquí"),
  heroHelp: p("A short guide for your family. Read what you can, in the language you like.", "Una guía corta para su familia. Lean lo que puedan, en el idioma que prefieran."),
  stepOf: p("Step", "Paso"),
  nextUp: p("Next", "Siguiente"),

  // Sections
  learnHead: p("What your child is learning", "Lo que su hijo o hija está aprendiendo"),
  goalsLead: p("By the end, your child will be able to say:", "Al final, su hijo o hija podrá decir:"),
  goalContent: p("Math and ideas goal", "Meta de contenido"),
  goalLanguage: p("Language goal", "Meta de idioma"),
  wordsHead: p("Words to know", "Palabras para conocer"),
  wordsIntro: p(
    "Tap the speaker to hear each word. Words marked Cognate look and sound alike in both languages, so your child may already know them.",
    "Toquen el altavoz para escuchar cada palabra. Las palabras con la etiqueta Cognado se parecen y suenan parecido en los dos idiomas, así que su hijo o hija quizá ya las conoce.",
  ),
  cognate: p("Cognate", "Cognado"),
  meaning: p("Meaning", "Significado"),
  example: p("Example", "Ejemplo"),
  hearEn: p("Hear in English", "Escuchar en inglés"),
  hearEs: p("Hear in Spanish", "Escuchar en español"),
  hear: p("Hear it", "Escucharlo"),
  talkHead: p("Talk about it", "Conversen sobre esto"),
  talkIntro: p(
    "Ask in any language. Your child can answer in the language they think in best. You do not need to know the answer.",
    "Pregunten en cualquier idioma. Su hijo o hija puede responder en el idioma en que piense mejor. No necesitan saber la respuesta.",
  ),
  anyLanguage: p("Ask in any language", "Pregunten en cualquier idioma"),
  tryHead: p("Try at home", "Para probar en casa"),
  tryIntro: p(
    "Pick one to start. No printing and no devices needed. Check the box when you have tried it.",
    "Elijan una para empezar. No hay que imprimir ni usar aparatos. Marquen la casilla cuando la hayan probado.",
  ),
  youNeed: p("You will need:", "Van a necesitar:"),
  triedIt: p("We tried this", "Lo probamos"),
  playHead: p("Play together", "Jueguen juntos"),
  playIntro: p(
    "Short games for your child. Sit beside them and ask: how did you know? There is no timer and no score.",
    "Juegos cortos para su hijo o hija. Siéntense a su lado y pregunten: ¿cómo lo supiste? No hay reloj ni puntaje.",
  ),
  play: p("Play", "Jugar"),
  playEnglish: p("Game in English", "Juego en inglés"),
  labWords: p("Word Lab: hear, say and match the words", "Laboratorio de palabras: escuchar, decir y relacionar"),
  labSpeak: p("Speaking practice: say ideas out loud", "Práctica de conversación: decir ideas en voz alta"),
  sayHead: p("Say it", "Díganlo"),
  sayIntro: p(
    "Your child practices these sentences out loud, filling each blank with their own words. Any language is fine to start.",
    "Su hijo o hija practica estas oraciones en voz alta y llena cada espacio con sus propias palabras. Para empezar, sirve cualquier idioma.",
  ),
  helpHead: p("How to help", "Cómo ayudar"),
  languageHead: p("Language tips", "Consejos de idioma"),
  languageIntro: p("Your home language is a strength. It helps your child learn English.", "El idioma del hogar es una fortaleza. Ayuda a su hijo o hija a aprender inglés."),
  celebrateHead: p("Celebrate", "Celebren"),
  resourcesHead: p("Resources", "Recursos"),
  resourcesIntro: p("Keep this guide on the fridge or send it to a phone.", "Guarden esta guía en el refrigerador o envíenla a un teléfono."),
  printPdf: p("Print the Family Guide (PDF)", "Imprimir la guía familiar (PDF)"),
  wordFile: p("Download for Word (.docx)", "Descargar para Word (.docx)"),
  sendPhone: p("Send to my phone", "Enviar a mi teléfono"),
  share: p("Share this guide", "Compartir esta guía"),
  copy: p("Copy link", "Copiar enlace"),
  copied: p("Link copied", "Enlace copiado"),
  whatsapp: p("Send by WhatsApp", "Enviar por WhatsApp"),
  fallbackNote: p(
    "More hands-on activities for this unit are on the way. These ideas work for any unit.",
    "Pronto habrá más actividades prácticas para esta unidad. Estas ideas sirven para cualquier unidad.",
  ),

  // Navigation
  prev: p("Previous unit", "Unidad anterior"),
  next: p("Next unit", "Unidad siguiente"),
  another: p("Choose another unit", "Elegir otra unidad"),
  navLabel: p("More units", "Más unidades"),
  tried: (n, total) => p(`Tried ${n} of ${total}`, `Probadas ${n} de ${total}`),
  tryDone: p("Wonderful. Every try builds your child's confidence.", "Qué bueno. Cada intento le da más confianza a su hijo o hija."),

  // Chooser
  dirTitle: p("Find your child's Family Guide", "Encuentren la guía familiar de su hijo o hija"),
  dirIntro: p(
    "Three quick taps. Each guide has words, questions, activities and games, in English and Spanish.",
    "Tres toques rápidos. Cada guía tiene palabras, preguntas, actividades y juegos, en inglés y español.",
  ),
  gradeStep: p("Choose a grade", "Elijan un grado"),
  subjectStep: p("Choose a subject", "Elijan una materia"),
  unitsStep: p("Choose a unit", "Elijan una unidad"),
  loadingUnits: p("Loading units…", "Cargando unidades…"),
  noUnits: p("No units found for this choice.", "No se encontraron unidades para esta elección."),
  openGuide: p("Open guide", "Abrir guía"),
};
