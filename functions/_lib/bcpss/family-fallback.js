// Bilingual (EN/ES) at-home content for units whose family block is not authored yet, so the Family
// Guide is never empty. Built only from the unit's own words (studio vocab or seed vocab) and the
// seed family card. Authored guides (db/seeds/bcpss/v2/family/<unitId>.mjs) replace all of this.

const pair = (en, es) => ({ en, es });
const list = (words) => words.filter(Boolean);

/** Joins up to three words with commas: "inherited, trait, variation". */
const sample = (words) => words.slice(0, 3).join(", ");

export function fallbackFamily({ words, cognates, frame }) {
  const w1 = words[0] || "";
  const names = sample(words);
  const talk = [
    pair(
      "What is one new word from this unit? What does it mean?",
      "¿Cuál es una palabra nueva de esta unidad? ¿Qué significa?",
    ),
    pair("How do you know? Can you show me?", "¿Cómo lo sabes? ¿Me lo puedes mostrar?"),
    pair(
      "Can you teach me one thing you learned this week?",
      "¿Me puedes enseñar algo que aprendiste esta semana?",
    ),
    pair("What was tricky, and what helped you?", "¿Qué fue difícil y qué te ayudó?"),
  ];
  const tryAtHome = [
    {
      title: pair("Teach me", "Enséñame"),
      minutes: 5,
      materials: pair("Nothing. Just a few minutes.", "Nada. Solo unos minutos."),
      steps: {
        en: [
          `Ask your child to teach you one word from this unit${w1 ? `, like "${w1}"` : ""}.`,
          "Listen first. Ask: what does it mean? Can you give an example?",
          "Say it back in your own words, in any language, and ask if you got it right.",
        ],
        es: [
          `Pidan a su hijo o hija que les enseñe una palabra de esta unidad${w1 ? `, como "${w1}"` : ""}.`,
          "Escuchen primero. Pregunten: ¿qué significa? ¿Puedes darme un ejemplo?",
          "Repítanlo con sus propias palabras, en el idioma que quieran, y pregunten si lo dijeron bien.",
        ],
      },
    },
    {
      title: pair("Word hunt", "Cacería de palabras"),
      minutes: 10,
      materials: pair("Paper and pencil", "Papel y lápiz"),
      steps: {
        en: [
          `Pick two words${names ? ` from this list: ${names}` : ""}. Write them on paper.`,
          "Look around home, the street, or the store for something that connects to each word.",
          "Say the idea in your home language first, then try it in English.",
        ],
        es: [
          `Elijan dos palabras${names ? ` de esta lista: ${names}` : ""}. Escríbanlas en un papel.`,
          "Busquen en la casa, la calle o la tienda algo que se conecte con cada palabra.",
          "Digan la idea primero en el idioma del hogar y luego intenten en inglés.",
        ],
      },
    },
    {
      title: pair("Draw it, say it", "Dibujarlo y decirlo"),
      minutes: 10,
      materials: pair("Paper and a pencil or marker", "Papel y un lápiz o marcador"),
      steps: {
        en: [
          "Ask your child to draw one idea from this unit.",
          "Label the drawing with the unit words, in English and in your home language.",
          "Ask your child to explain the drawing in two sentences. Use the word because.",
        ],
        es: [
          "Pidan a su hijo o hija que dibuje una idea de esta unidad.",
          "Rotulen el dibujo con las palabras de la unidad, en inglés y en el idioma del hogar.",
          "Pidan que explique el dibujo en dos oraciones. Usen la palabra porque.",
        ],
      },
    },
  ];
  const sayIt = [
    ...(frame ? [{ en: frame, es: null }] : []),
    pair(
      "One new word is [word]. It means [meaning].",
      "Una palabra nueva es [palabra]. Significa [significado].",
    ),
    pair("I learned that [idea] because [reason].", "Aprendí que [idea] porque [razón]."),
  ];
  const cog = list(cognates).slice(0, 3);
  return {
    talk,
    try_at_home: tryAtHome,
    say_it: sayIt,
    help: {
      en: [
        "Ask questions and listen. You do not need to know the answer; your child can teach you.",
        'Say "show me" and "how do you know?" in any language.',
        "Let mistakes be part of the plan. Ask what they would try next.",
      ],
      es: [
        "Hagan preguntas y escuchen. No necesitan saber la respuesta; su hijo o hija puede enseñarles.",
        'Digan "muéstrame" y "¿cómo lo sabes?" en cualquier idioma.',
        "Dejen que los errores sean parte del plan. Pregunten qué probaría después.",
      ],
    },
    home_language: cog.length
      ? pair(
          `Talk about the unit in your home language first. Some words sound alike in Spanish and English, like ${cog.join(", ")}. Spotting them builds confidence.`,
          `Conversen primero sobre la unidad en el idioma del hogar. Algunas palabras suenan parecido en español e inglés, como ${cog.join(", ")}. Notarlas da confianza.`,
        )
      : pair(
          "Talk about the unit in your home language first, then find the English words together. Knowing an idea in one language helps in the other.",
          "Conversen primero sobre la unidad en el idioma del hogar y luego busquen juntos las palabras en inglés. Entender una idea en un idioma ayuda en el otro.",
        ),
    celebrate: pair(
      "You will know it is working when your child can explain one idea from this unit, in any language, and say why.",
      "Sabrán que está funcionando cuando su hijo o hija pueda explicar una idea de esta unidad, en el idioma que quiera, y decir por qué.",
    ),
  };
}
