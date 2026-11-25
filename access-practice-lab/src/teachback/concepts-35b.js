// Teach It Back concepts, grades 3-5, part 2: social studies, reading and writing, health. Data only.
const p = (id, en, es, accept, frame) => ({ id, en, es, accept, frame });

export const CONCEPTS_35B = [
  {
    id: "map-scale",
    band: "3-5",
    subject: "social studies",
    visual: "map-scale",
    title: { en: "Reading a map scale", es: "Leer la escala de un mapa" },
    idea: {
      en: "A map is a small drawing of a large place. The map scale tells how a distance on the map matches a real distance. For example, if 1 inch on the map equals 10 miles, then 3 inches on the map means 30 miles in real life.",
      es: "Un mapa es un dibujo pequeño de un lugar grande. La escala del mapa dice cómo una distancia en el mapa se relaciona con una distancia real. Por ejemplo, si 1 pulgada en el mapa equivale a 10 millas, entonces 3 pulgadas en el mapa son 30 millas en la vida real.",
    },
    terms: [
      { w: "scale", es: "escala", gloss: "tells how map distance matches real distance" },
      { w: "distance", es: "distancia", gloss: "how far it is from one place to another" },
      { w: "scale bar", es: "barra de escala", gloss: "a small ruler drawn on a map" },
      { w: "key", es: "leyenda", gloss: "the box that explains the symbols on a map" },
    ],
    points: [
      p("p1", "The scale shows how map distance matches real distance.", "La escala muestra cómo la distancia del mapa se relaciona con la distancia real.", ["scale", "real distance", "real life", "actual", "escala", "distancia real"], "The map scale tells me how far something is in ____ ____."),
      p("p2", "Use a ruler or the scale bar to measure between two places.", "Usa una regla o la barra de escala para medir entre dos lugares.", ["ruler", "measure*", "scale bar", "inches", "centimeter*", "regla", "medir", "mide"], "First I ____ the distance between two places with a ____."),
      p("p3", "Multiply to find the real distance: 3 inches at 10 miles per inch is 30 miles.", "Multiplica para hallar la distancia real: 3 pulgadas a 10 millas por pulgada son 30 millas.", ["multipl*", "times", "each inch", "every inch", "miles", "kilometer*", "per inch", "multiplic*", "millas"], "Then I ____ the inches by the miles in each inch."),
    ],
    audience: { en: "Explain it to a younger student who thinks the town on the map is only 3 inches away.", es: "Explícaselo a un estudiante menor que cree que el pueblo del mapa está a solo 3 pulgadas." },
    modelAnswer: {
      en: "A map scale tells you how far something is in real life compared to the map. To use it, you measure the distance between two places with a ruler or the scale bar. Then you multiply. For example, if one inch on the map is ten miles, and two towns are three inches apart, then they are thirty miles apart in real life.",
    },
  },
  {
    id: "three-branches",
    band: "3-5",
    subject: "social studies",
    visual: "",
    title: { en: "Three branches of government", es: "Los tres poderes del gobierno" },
    idea: {
      en: "The United States government has three branches so that no one person or group has all the power. The legislative branch, Congress, makes the laws. The executive branch, led by the President, carries out the laws. The judicial branch, the courts, decides what the laws mean.",
      es: "El gobierno de Estados Unidos tiene tres poderes para que ninguna persona ni grupo tenga todo el poder. El poder legislativo, el Congreso, hace las leyes. El poder ejecutivo, dirigido por el presidente, hace cumplir las leyes. El poder judicial, los tribunales, decide qué significan las leyes.",
    },
    terms: [
      { w: "legislative", es: "legislativo", gloss: "the branch that makes laws (Congress)" },
      { w: "executive", es: "ejecutivo", gloss: "the branch that carries out laws (the President)" },
      { w: "judicial", es: "judicial", gloss: "the branch that decides what laws mean (the courts)" },
      { w: "checks and balances", es: "controles y equilibrios", gloss: "each branch can limit the power of the others" },
    ],
    points: [
      p("p1", "Congress, the legislative branch, makes the laws.", "El Congreso, el poder legislativo, hace las leyes.", ["congress", "legislative", "legislature", "make laws", "pass laws", "write laws", "congreso", "legislativo"], "The ____ branch, called Congress, ____ the laws."),
      p("p2", "The President, the executive branch, carries out the laws.", "El presidente, el poder ejecutivo, hace cumplir las leyes.", ["president", "executive", "carry out", "enforce*", "presidente", "ejecutivo", "hace cumplir"], "The ____ branch, led by the ____, carries out the laws."),
      p("p3", "The courts, the judicial branch, decide what laws mean, and each branch checks the others.", "Los tribunales, el poder judicial, deciden qué significan las leyes, y cada poder vigila a los otros.", ["court*", "judicial", "judge*", "decide* what", "checks and balances", "balance*", "tribunal*", "jueces"], "The ____ branch, the courts, decides what the laws ____."),
    ],
    audience: { en: "Explain it to a new student who just moved to the United States.", es: "Explícaselo a un estudiante nuevo que acaba de mudarse a Estados Unidos." },
    modelAnswer: {
      en: "The United States has three branches of government so that no one person or group gets all the power. The legislative branch, which is Congress, makes the laws. The executive branch is run by the President, who carries out the laws. The judicial branch, which is the courts, decides what the laws mean. Each branch can check the others, which is called checks and balances.",
    },
  },
  {
    id: "theme-vs-topic",
    band: "3-5",
    subject: "language arts",
    visual: "",
    title: { en: "Theme and topic", es: "Mensaje (theme) y tema (topic)" },
    idea: {
      en: "The topic of a story is what it is about in one or two words, like friendship or bravery. The theme is the message about life that the author wants you to learn from the story. A topic is a word, but a theme is a whole idea, like “True friends help each other when things are hard.”",
      es: "El tema (topic) de un cuento es de qué trata, en una o dos palabras, como la amistad o la valentía. El mensaje (theme) es la idea sobre la vida que el autor quiere que aprendas del cuento. El tema es una palabra, pero el mensaje es una idea completa, como «Los verdaderos amigos se ayudan cuando las cosas son difíciles».",
    },
    terms: [
      { w: "topic", es: "tema", gloss: "what a story is about, in one or two words" },
      { w: "theme", es: "mensaje", gloss: "the message about life that a story teaches" },
      { w: "detail", es: "detalle", gloss: "a small fact, event, or word in the text that gives a clue" },
      { w: "lesson", es: "lección", gloss: "something a character learns or the reader can learn" },
    ],
    points: [
      p("p1", "The topic is what the story is about, in a word or two.", "El tema es de qué trata el cuento, en una o dos palabras.", ["topic*", "one word", "few words", "a word", "tema"], "The topic is what the story is ____, in a ____ or two."),
      p("p2", "The theme is the message or lesson about life the author wants readers to learn.", "El mensaje es la enseñanza sobre la vida que el autor quiere que aprendan los lectores.", ["message", "lesson", "moral", "learn*", "teach*", "mensaje", "lección", "enseñanza", "moraleja"], "The theme is the ____ the author wants me to ____."),
      p("p3", "An example, like friendship as the topic, and details help you find the theme.", "Un ejemplo, como la amistad como tema, y los detalles te ayudan a hallar el mensaje.", ["example", "friendship", "bravery", "detail*", "clue*", "events", "ejemplo", "amistad", "detalle*", "pistas"], "For example, if the topic is ____, the theme might be ____."),
    ],
    audience: { en: "Explain it to a classmate who writes “friendship” when asked for the theme.", es: "Explícaselo a un compañero que escribe «amistad» cuando le piden el mensaje." },
    modelAnswer: {
      en: "The topic and the theme of a story are not the same thing. The topic is what the story is about, in just a word or two, like friendship. The theme is the message or lesson about life that the author wants you to learn. For example, if the topic is friendship, the theme might be that true friends help each other when things get hard. To find the theme, I look at the details and at what the character does and learns.",
    },
  },
  {
    id: "narrator-point-of-view",
    band: "3-5",
    subject: "language arts",
    visual: "",
    title: { en: "Who is telling the story?", es: "¿Quién cuenta el cuento?" },
    idea: {
      en: "The narrator is the voice that tells the story. In first-person point of view, the narrator is a character who says “I” and “we,” so you only know what that character thinks and feels. In third-person point of view, the narrator is outside the story and uses “he,” “she,” and “they.”",
      es: "El narrador es la voz que cuenta el cuento. En la narración en primera persona, el narrador es un personaje que dice «yo» y «nosotros», así que solo sabes lo que ese personaje piensa y siente. En la tercera persona, el narrador está fuera del cuento y habla de los personajes con «él», «ella» y «ellos».",
    },
    terms: [
      { w: "narrator", es: "narrador", gloss: "the voice that tells the story" },
      { w: "point of view", es: "punto de vista", gloss: "who is telling the story and how much they know" },
      { w: "first person", es: "primera persona", gloss: "told by a character who uses I and we" },
      { w: "third person", es: "tercera persona", gloss: "told from outside the story using he, she, and they" },
    ],
    points: [
      p("p1", "The narrator is the voice that tells the story.", "El narrador es la voz que cuenta el cuento.", ["narrator*", "tells the story", "telling the story", "voice", "narrador*", "cuenta"], "The narrator is the ____ that tells the story."),
      p("p2", "In first person, a character says I or we and you only know what that character thinks and feels.", "En primera persona, un personaje dice yo o nosotros y solo sabes lo que ese personaje piensa y siente.", ["first person", "i+character", "says i", "uses i", "uses we", "primera persona", "yo+personaje"], "In first person, the narrator is a ____ who says “____.”"),
      p("p3", "In third person, the narrator is outside the story and says he, she, or they.", "En tercera persona, el narrador está fuera del cuento y dice él, ella o ellos.", ["third person", "outside", "he+she", "she+they", "tercera persona", "fuera"], "In third person, the narrator is ____ the story and says “he,” “she,” or “____.”"),
    ],
    audience: { en: "Explain it to a classmate who is about to write their first story.", es: "Explícaselo a un compañero que está por escribir su primer cuento." },
    modelAnswer: {
      en: "The narrator is the voice that tells the story, and point of view is about who that narrator is. In first person, the narrator is a character in the story who says I and we, so the reader only knows what that character thinks and feels. In third person, the narrator is outside the story and talks about the characters using he, she, and they. Changing the narrator can change what the reader learns.",
    },
  },
  {
    id: "sleep-and-learning",
    band: "3-5",
    subject: "health",
    visual: "",
    title: { en: "Sleep and learning", es: "El sueño y el aprendizaje" },
    idea: {
      en: "Sleep is when your body and brain rest and get ready for the next day. While you sleep, your brain stores what you learned, so you can remember it later. Kids your age usually need about 9 to 12 hours of sleep each night to pay attention and learn well.",
      es: "Dormir es cuando tu cuerpo y tu cerebro descansan y se preparan para el día siguiente. Mientras duermes, tu cerebro guarda lo que aprendiste para que puedas recordarlo después. Los niños de tu edad suelen necesitar de 9 a 12 horas de sueño cada noche para poner atención y aprender bien.",
    },
    terms: [
      { w: "memory", es: "memoria", gloss: "the ability to keep and remember what you learned" },
      { w: "rest", es: "descanso", gloss: "time when your body slows down and recovers" },
      { w: "attention", es: "atención", gloss: "focusing your mind on one thing" },
      { w: "routine", es: "rutina", gloss: "things you do in the same order, like a bedtime routine" },
    ],
    points: [
      p("p1", "While you sleep, your brain stores what you learned, so you remember it.", "Mientras duermes, tu cerebro guarda lo que aprendiste y lo recuerdas.", ["memor*", "remember*", "store*", "brain", "cerebro", "recordar", "memoria"], "While I sleep, my brain ____ what I learned so I can ____ it."),
      p("p2", "Without enough sleep it is hard to pay attention, and you feel tired.", "Sin dormir lo suficiente es difícil poner atención y te sientes cansado.", ["attention", "focus*", "tired", "cranky", "not enough sleep", "too little sleep", "atención", "cansad*", "concentr*"], "If I do not get enough sleep, it is hard to ____ and I feel ____."),
      p("p3", "Kids need about 9 to 12 hours, and a bedtime routine helps.", "Los niños necesitan de 9 a 12 horas, y una rutina para dormir ayuda.", ["hours", "9", "12", "nine", "twelve", "routine", "bedtime", "screen*", "horas", "rutina"], "Kids my age need about ____ hours, and a bedtime ____ helps."),
    ],
    audience: { en: "Explain it to a friend who stays up late the night before a test.", es: "Explícaselo a un amigo que se desvela la noche antes de un examen." },
    modelAnswer: {
      en: "Sleep is very important for learning. While you sleep, your brain stores what you learned during the day, so it is easier to remember later. If you do not get enough sleep, it is hard to pay attention and you can feel tired and cranky at school. Kids my age need about nine to twelve hours every night, and a bedtime routine, like turning off screens early, helps.",
    },
  },
  {
    id: "germs-and-handwashing",
    band: "3-5",
    subject: "health",
    visual: "",
    title: { en: "Germs and washing hands", es: "Gérmenes y lavarse las manos" },
    idea: {
      en: "Germs are tiny living things, too small to see, and some of them can make you sick. They spread when we touch things or each other, cough, or sneeze. Washing your hands with soap and water for about 20 seconds lifts germs off your skin and rinses them down the drain.",
      es: "Los gérmenes son seres vivos diminutos, demasiado pequeños para verlos, y algunos pueden enfermarte. Se esparcen cuando tocamos cosas o a otras personas, o cuando tosemos o estornudamos. Lavarte las manos con agua y jabón durante unos 20 segundos despega los gérmenes de la piel y los arrastra por el desagüe.",
    },
    terms: [
      { w: "germ", es: "germen", gloss: "a tiny living thing that can cause sickness" },
      { w: "spread", es: "esparcirse", gloss: "to move from one person or place to another" },
      { w: "soap", es: "jabón", gloss: "a cleaner that helps lift dirt and germs off skin" },
      { w: "rinse", es: "enjuagar", gloss: "to wash away with clean water" },
    ],
    points: [
      p("p1", "Germs are tiny, too small to see, and some can make you sick.", "Los gérmenes son diminutos, muy pequeños para verlos, y algunos pueden enfermarte.", ["tiny", "too small", "can't see", "cannot see", "sick", "ill", "enferm*", "pequeñ*", "diminuto*"], "Germs are ____ and some of them can make people ____."),
      p("p2", "Germs spread when we touch things, cough, or sneeze.", "Los gérmenes se esparcen cuando tocamos cosas, tosemos o estornudamos.", ["spread*", "touch*", "cough*", "sneez*", "share*", "tocar", "toca*", "tos", "estornud*", "esparce*"], "Germs spread when people ____, cough, or ____."),
      p("p3", "Washing with soap and water for about 20 seconds takes germs off your hands.", "Lavarse con agua y jabón unos 20 segundos quita los gérmenes de tus manos.", ["soap", "20 seconds", "twenty seconds", "scrub*", "wash*", "lather*", "rinse*", "jabón", "lavar*", "lava*"], "I wash my hands with ____ and water for about ____ seconds."),
    ],
    audience: { en: "Explain it to a younger student who says rinsing with water is enough.", es: "Explícaselo a un estudiante menor que dice que basta con enjuagarse con agua." },
    modelAnswer: {
      en: "Germs are tiny living things that are too small to see, and some of them can make people sick. Germs spread when we touch things or other people, or when someone coughs or sneezes. Washing my hands with soap and water for about twenty seconds lifts the germs off my skin so the water can rinse them away. That is why I wash before I eat and after I use the bathroom.",
    },
  },
];
