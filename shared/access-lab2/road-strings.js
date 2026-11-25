// Road to ACCESS 2.0 strings. English is authored; Spanish is a DRAFT TRANSLATION pending human review and is marked
// as such on every printable output. Wording is kind and neutral: nothing here may shame (wording.js enforces it).
export const ES_STATUS = Object.freeze({
  status: "draft translation",
  label: "Traducción en borrador",
  note: "Traducción en borrador: pendiente de revisión por una persona.",
});

/** Week themes, 1 to 12. `klu` is the Key Language Use a build week centers on (null = a mix). `type` is the week's job. */
export const THEMES = Object.freeze([
  { n: 1, type: "build", klu: "Narrate", en: "Telling stories", es: "Contar historias" },
  { n: 2, type: "build", klu: "Inform", en: "Sharing facts", es: "Compartir datos" },
  {
    n: 3,
    type: "build",
    klu: "Explain",
    en: "Explaining how and why",
    es: "Explicar cómo y por qué",
  },
  { n: 4, type: "build", klu: "Argue", en: "Giving reasons", es: "Dar razones" },
  { n: 5, type: "build", klu: null, en: "Mix it up", es: "Todo junto" },
  { n: 6, type: "mini-test", klu: null, en: "Check-in week", es: "Semana de repaso" },
  {
    n: 7,
    type: "build",
    klu: "Narrate",
    en: "Stories, going deeper",
    es: "Historias, más a fondo",
  },
  { n: 8, type: "build", klu: "Inform", en: "Facts, going deeper", es: "Datos, más a fondo" },
  {
    n: 9,
    type: "build",
    klu: "Explain",
    en: "How and why, going deeper",
    es: "Cómo y por qué, más a fondo",
  },
  { n: 10, type: "build", klu: "Argue", en: "Reasons, going deeper", es: "Razones, más a fondo" },
  { n: 11, type: "final-practice", klu: null, en: "Final practice set", es: "Práctica final" },
  { n: 12, type: "readiness", klu: null, en: "Ready and calm", es: "Listos y tranquilos" },
]);

/** One home tip per week, for the printable family version. */
export const TIPS = Object.freeze([
  {
    en: "Ask your child to tell you about their day in order: first, next, last. Answer in your home language too.",
    es: "Pídale a su hijo que le cuente su día en orden: primero, luego, al final. También puede contestar en su idioma.",
  },
  {
    en: "Pick something in the kitchen. Take turns describing it until the other person guesses what it is.",
    es: "Escojan algo en la cocina. Túrnense para describirlo hasta que el otro adivine qué es.",
  },
  {
    en: "Cook or clean together. Ask: What do we do first? Why? Your child explains each step.",
    es: "Cocinen o limpien juntos. Pregunte: ¿Qué hacemos primero? ¿Por qué? Su hijo explica cada paso.",
  },
  {
    en: "Ask: Which do you like better, and why? Ask for two reasons. Listen first.",
    es: "Pregunte: ¿Cuál te gusta más y por qué? Pida dos razones. Primero escuche.",
  },
  {
    en: "Play a dinner game: one person names a topic and everyone adds a fact, a reason, and a short story.",
    es: "Jueguen durante la cena: una persona dice un tema y todos agregan un dato, una razón y una historia corta.",
  },
  {
    en: "Celebrate your child's effort this week. Ask which activity felt easiest and which one to practice more.",
    es: "Celebre el esfuerzo de su hijo esta semana. Pregunte qué actividad le pareció más fácil y cuál quiere practicar más.",
  },
  {
    en: "Ask your child to retell a favorite story or show with more details than before.",
    es: "Pídale a su hijo que vuelva a contar un cuento o programa favorito con más detalles que antes.",
  },
  {
    en: "Look at a photo or a food package together. Take turns sharing three facts.",
    es: "Miren juntos una foto o un empaque de comida. Túrnense para decir tres datos.",
  },
  {
    en: "During a chore, ask your child to explain how it works and why it matters.",
    es: "Durante una tarea de la casa, pida a su hijo que explique cómo funciona y por qué importa.",
  },
  {
    en: "Pick a family choice, like a weekend plan. Everyone gives a reason.",
    es: "Escojan una decisión familiar, como el plan del fin de semana. Todos dan una razón.",
  },
  {
    en: "Give your child a quiet place to practice. Praise effort. If your child is tired, stop and finish another day.",
    es: "Dé a su hijo un lugar tranquilo para practicar. Elogie el esfuerzo. Si está cansado, pare y termine otro día.",
  },
  {
    en: "Talk about test day together. Practice the calming breaths. Help your child sleep well and eat breakfast.",
    es: "Hablen juntos del día de la prueba. Practiquen las respiraciones calmadas. Ayude a su hijo a dormir bien y desayunar.",
  },
]);

export const MILESTONES = Object.freeze({
  "mini-test": { en: "Check-in practice, no timer", es: "Práctica de repaso, sin cronómetro" },
  "final-practice": { en: "Final practice set, no timer", es: "Práctica final, sin cronómetro" },
  readiness: { en: "Getting ready for test day", es: "Preparación para el día de la prueba" },
});

export const FAMILY_TEXT = Object.freeze({
  title: {
    en: "Road to ACCESS practice: 12 weeks at home",
    es: "Camino de práctica: 12 semanas en casa",
  },
  intro: {
    en: "A little practice most days. Each session is 10 to 20 minutes. There are no timers and no grades. Stop any time and pick up the next day.",
    es: "Un poco de práctica casi todos los días. Cada sesión dura de 10 a 20 minutos. No hay cronómetros ni calificaciones. Pueden parar cuando quieran y seguir al día siguiente.",
  },
  minutes: { en: "minutes a day", es: "minutos al día" },
});

export const REFRESH_NOTE = Object.freeze({
  en: "Here is your refreshed plan. Pick it up with today's session. Every day is a good day to start.",
  es: "Aquí está su plan actualizado. Empiece con la sesión de hoy. Cualquier día es buen día para empezar. (Traducción en borrador)",
});
