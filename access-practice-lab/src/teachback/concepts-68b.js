// Teach It Back concepts, grades 6-8, part 2: social studies, reading and writing, health. Data only.
const p = (id, en, es, accept, frame) => ({ id, en, es, accept, frame });

export const CONCEPTS_68B = [
  {
    id: "supply-and-demand",
    band: "6-8",
    subject: "social studies",
    visual: "",
    title: { en: "Supply and demand", es: "Oferta y demanda" },
    idea: {
      en: "Supply is how much of something sellers have to sell, and demand is how much buyers want it at a given price. When demand is high and supply is low, the price tends to go up. When supply is high and demand is low, the price tends to go down. Prices settle near the point where what buyers want matches what sellers offer.",
      es: "La oferta es cuánto de algo tienen los vendedores para vender, y la demanda es cuánto quieren los compradores a un precio dado. Cuando la demanda es alta y la oferta es baja, el precio tiende a subir. Cuando la oferta es alta y la demanda es baja, el precio tiende a bajar. Los precios se acomodan cerca del punto donde lo que quieren los compradores coincide con lo que ofrecen los vendedores.",
    },
    terms: [
      { w: "supply", es: "oferta", gloss: "how much of a product sellers are willing to sell" },
      { w: "demand", es: "demanda", gloss: "how much of a product buyers want and can pay for" },
      { w: "price", es: "precio", gloss: "the amount of money you pay for something" },
      { w: "shortage", es: "escasez", gloss: "when buyers want more than sellers have" },
    ],
    points: [
      p("p1", "Supply is what sellers have to sell; demand is how much buyers want.", "La oferta es lo que los vendedores tienen para vender; la demanda es cuánto quieren los compradores.", ["seller*", "buyer*", "customer*", "want*", "vendedor*", "comprador*", "quieren"], "Supply is how much ____ have to sell, and demand is how much ____ want."),
      p("p2", "When many people want something and there is little of it, the price goes up.", "Cuando muchas personas quieren algo y hay poco, el precio sube.", ["rise*", "go up", "goes up", "increase*", "expensive", "shortage", "raise*", "sube*", "aumenta*", "escasez", "caro*"], "When demand is high and supply is low, the price ____."),
      p("p3", "When there is a lot of something and few want it, the price goes down.", "Cuando hay mucho de algo y pocos lo quieren, el precio baja.", ["fall*", "drop*", "go down", "goes down", "decrease*", "cheaper", "lower", "sale", "bajan", "baja*", "barato*"], "When supply is high and demand is low, the price ____."),
    ],
    audience: { en: "Explain it to a family member who wonders why concert tickets cost so much.", es: "Explícaselo a un familiar que se pregunta por qué cuestan tanto los boletos de un concierto." },
    modelAnswer: {
      en: "Supply and demand explain how prices are set in a market. Supply is the amount that sellers have to sell, and demand is the amount that buyers want. When many people want something but there is not much of it, like a popular toy during the holidays, the price goes up. When there is a lot of something and few people want it, the price drops, which is why stores put extra items on sale.",
    },
  },
  {
    id: "primary-vs-secondary-sources",
    band: "6-8",
    subject: "social studies",
    visual: "",
    title: { en: "Primary and secondary sources", es: "Fuentes primarias y secundarias" },
    idea: {
      en: "A primary source is made by someone who saw or took part in an event at the time it happened, like a diary, a photograph, a letter, or an interview. A secondary source is made later by someone who studied the event, like a textbook, an encyclopedia article, or a documentary. Historians use both: primary sources give firsthand evidence, and secondary sources explain and connect the evidence.",
      es: "Una fuente primaria la crea alguien que vio o participó en un hecho cuando ocurrió, como un diario, una fotografía, una carta o una entrevista. Una fuente secundaria la crea después alguien que estudió el hecho, como un libro de texto, un artículo de enciclopedia o un documental. Los historiadores usan ambas: las fuentes primarias dan evidencia de primera mano y las secundarias explican y conectan la evidencia.",
    },
    terms: [
      { w: "primary source", es: "fuente primaria", gloss: "firsthand evidence made at the time by someone who was there" },
      { w: "secondary source", es: "fuente secundaria", gloss: "a later account made by someone who studied the event" },
      { w: "firsthand", es: "de primera mano", gloss: "coming directly from someone who saw or did it" },
      { w: "evidence", es: "evidencia", gloss: "facts or information that support an idea" },
    ],
    points: [
      p("p1", "A primary source is made at the time by someone who was there, like a diary or photo.", "Una fuente primaria la crea alguien que estuvo allí, como un diario o una foto.", ["primary", "firsthand", "first-hand", "diary", "letter*", "photo*", "was there", "at the time", "eyewitness", "primaria*", "diario", "carta", "fotograf*", "testigo"], "A ____ source is made by someone who was ____ at the time."),
      p("p2", "A secondary source is made later by someone who studied the event, like a textbook.", "Una fuente secundaria la crea después alguien que estudió el hecho, como un libro de texto.", ["secondary", "later", "textbook*", "encyclopedia*", "documentar*", "studied", "secundaria*", "libro de texto", "enciclopedia"], "A ____ source is made ____ by someone who studied the event."),
      p("p3", "Historians use both, and ask who made the source and what point of view it has.", "Los historiadores usan ambas y preguntan quién la hizo y qué punto de vista tiene.", ["both", "bias*", "point of view", "who made", "who wrote", "reliable", "historian*", "ambas", "ambos", "sesgo", "historiador*"], "Historians use ____ kinds, and they ask who made the source and ____."),
    ],
    audience: { en: "Explain it to a classmate who is researching a project about an old event.", es: "Explícaselo a un compañero que investiga un proyecto sobre un hecho histórico." },
    modelAnswer: {
      en: "A primary source is made by someone who was there at the time of an event, like a diary, a letter, or a photograph. A secondary source is created later by someone who studied the event, such as a textbook, an encyclopedia article, or a documentary. Historians use both kinds. Primary sources give firsthand evidence, and secondary sources help explain it, but I should always ask who made the source, when, and why, because every author has a point of view.",
    },
  },
  {
    id: "claim-and-evidence",
    band: "6-8",
    subject: "language arts",
    visual: "",
    title: { en: "Claim, evidence, and reasoning", es: "Afirmación, evidencia y razonamiento" },
    idea: {
      en: "A claim is a statement you want the reader to believe, like “School should start later.” Evidence is the facts, examples, or quotes that support the claim. Reasoning connects the two by explaining why the evidence proves the claim. A strong argument has all three, and the evidence is specific and comes from a reliable source.",
      es: "Una afirmación es lo que quieres que el lector crea, como «La escuela debería empezar más tarde». La evidencia son los datos, ejemplos o citas que apoyan la afirmación. El razonamiento conecta las dos al explicar por qué la evidencia demuestra la afirmación. Un argumento fuerte tiene las tres partes, y la evidencia es específica y viene de una fuente confiable.",
    },
    terms: [
      { w: "claim", es: "afirmación", gloss: "a statement you want others to believe" },
      { w: "evidence", es: "evidencia", gloss: "facts, examples, or quotes that support a claim" },
      { w: "reasoning", es: "razonamiento", gloss: "the explanation that connects the evidence to the claim" },
      { w: "reliable", es: "confiable", gloss: "trustworthy; it can be believed" },
    ],
    points: [
      p("p1", "A claim is the main statement you want the reader to believe.", "Una afirmación es la idea principal que quieres que el lector crea.", ["claim*", "position", "opinion", "argue*", "believe*", "main idea", "statement", "afirmación", "opinión", "postura", "creer"], "A claim is the ____ I want my reader to ____."),
      p("p2", "Evidence is facts, examples, or quotes that support the claim.", "La evidencia son datos, ejemplos o citas que apoyan la afirmación.", ["evidence", "fact*", "quote*", "example*", "data", "statistic*", "support*", "proof", "evidencia", "dato*", "cita*", "apoy*"], "Evidence is ____, quotes, or examples that ____ the claim."),
      p("p3", "Reasoning explains why the evidence proves the claim.", "El razonamiento explica por qué la evidencia demuestra la afirmación.", ["reasoning", "explain* how", "explain* why", "connect*", "because", "shows that", "proves", "razonamiento", "explica*", "conecta*", "porque"], "Reasoning ____ why the evidence ____ the claim."),
    ],
    audience: { en: "Explain it to a classmate who writes an opinion with no proof.", es: "Explícaselo a un compañero que escribe una opinión sin pruebas." },
    modelAnswer: {
      en: "In an argument, the claim is the main statement I want my reader to believe. Evidence is the facts, quotes, or examples from a reliable source that support the claim. Reasoning is the part where I explain why the evidence proves the claim, which connects the two together. A strong argument needs all three, and the evidence should be specific, not just my opinion.",
    },
  },
  {
    id: "tone-vs-mood",
    band: "6-8",
    subject: "language arts",
    visual: "",
    title: { en: "Tone and mood", es: "Tono y ambiente" },
    idea: {
      en: "Tone is the author's attitude toward the subject, shown through word choice, like humorous, serious, or hopeful. Mood is the feeling the reader gets from the text, like calm, tense, or cheerful. The two can be different: an author might use a calm tone to write about something that makes the reader feel scared.",
      es: "El tono es la actitud del autor hacia el tema, que se muestra con la elección de palabras, como humorístico, serio o esperanzado. El ambiente (mood) es el sentimiento que el lector siente al leer el texto, como calma, tensión o alegría. Pueden ser distintos: un autor puede usar un tono tranquilo para escribir sobre algo que le da miedo al lector.",
    },
    terms: [
      { w: "tone", es: "tono", gloss: "the author's attitude toward the subject" },
      { w: "mood", es: "ambiente", gloss: "the feeling a text creates in the reader" },
      { w: "word choice", es: "elección de palabras", gloss: "the specific words an author picks" },
      { w: "connotation", es: "connotación", gloss: "the feeling a word suggests beyond its dictionary meaning" },
    ],
    points: [
      p("p1", "Tone is the author's attitude toward the subject.", "El tono es la actitud del autor hacia el tema.", ["attitude", "author*", "narrator*", "actitud", "autor*"], "Tone is the author's ____ toward the subject."),
      p("p2", "Mood is the feeling the reader gets from the text.", "El ambiente es el sentimiento que el lector siente con el texto.", ["reader*", "audience", "atmosphere", "feeling*", "makes you feel", "lector*", "ambiente", "sentimiento*", "sientes"], "Mood is the ____ the ____ gets from the text."),
      p("p3", "Word choice creates both, and tone and mood can be different.", "La elección de palabras crea ambos, y el tono y el ambiente pueden ser distintos.", ["word choice", "different", "not the same", "diction", "palabras", "distint*", "diferent*"], "Authors create both with their ____ ____, and the two can be ____."),
    ],
    audience: { en: "Explain it to a classmate who uses “tone” and “mood” as if they mean the same thing.", es: "Explícaselo a un compañero que usa «tono» y «ambiente» como si fueran lo mismo." },
    modelAnswer: {
      en: "Tone and mood are related, but they are not the same. Tone is the author's attitude toward the subject, like serious, funny, or hopeful. Mood is the feeling the reader gets while reading, like calm, tense, or excited. Authors create both with their word choice, and they can be different: a writer might use a calm tone about something that still makes the reader feel nervous.",
    },
  },
  {
    id: "nutrition-labels",
    band: "6-8",
    subject: "health",
    visual: "",
    title: { en: "Reading a nutrition label", es: "Leer una etiqueta nutricional" },
    idea: {
      en: "A nutrition facts label tells you what is in one serving of a packaged food. Start with the serving size, because every number on the label is for that amount, and if you eat two servings you get double. Then look at the calories and at nutrients like added sugar, sodium, and fiber, and use the % Daily Value to see if a serving has a little (5% or less) or a lot (20% or more) of a nutrient.",
      es: "La etiqueta de información nutricional te dice qué hay en una porción de un alimento empacado. Empieza por el tamaño de la porción, porque todos los números de la etiqueta son para esa cantidad, y si comes dos porciones obtienes el doble. Luego mira las calorías y nutrientes como el azúcar añadido, el sodio y la fibra, y usa el % del Valor Diario para ver si una porción tiene poco (5 % o menos) o mucho (20 % o más) de un nutriente.",
    },
    terms: [
      { w: "serving size", es: "tamaño de la porción", gloss: "the amount of food that all the numbers on the label describe" },
      { w: "calorie", es: "caloría", gloss: "a unit that measures the energy in food" },
      { w: "% Daily Value", es: "% del Valor Diario", gloss: "how much a serving adds to a whole day's recommended amount" },
      { w: "added sugar", es: "azúcar añadido", gloss: "sugar put into food while it is made" },
    ],
    points: [
      p("p1", "Check the serving size first: the numbers are per serving, so two servings doubles them.", "Revisa primero el tamaño de la porción: los números son por porción, así que dos porciones los duplican.", ["serving*", "porción*", "portion*", "per serving", "double", "multipl*", "package"], "First I check the ____ size, because the numbers are for one ____."),
      p("p2", "Calories measure energy, and I look at nutrients like added sugar, sodium, and fiber.", "Las calorías miden la energía, y miro nutrientes como el azúcar añadido, el sodio y la fibra.", ["calorie*", "energy", "sugar*", "sodium", "fiber", "fat", "nutrient*", "caloría*", "energía", "azúcar*", "sodio", "fibra"], "Calories measure ____, and I also look at ____ like added sugar and sodium."),
      p("p3", "The % Daily Value helps compare foods: 5% or less is low and 20% or more is high.", "El % del Valor Diario ayuda a comparar alimentos: 5 % o menos es poco y 20 % o más es mucho.", ["daily value", "percent*", "5", "20", "low", "high", "compar*", "valor diario", "porcentaje", "poco", "mucho"], "A % Daily Value of ____ or less is low, and ____ or more is high."),
    ],
    audience: { en: "Explain it to a family member who wants to compare two cereals at the store.", es: "Explícaselo a un familiar que quiere comparar dos cereales en la tienda." },
    modelAnswer: {
      en: "A nutrition facts label shows what is in one serving of a food. First I check the serving size, because all the numbers are for that amount, so if I eat two servings I have to double them. Next I look at the calories, which measure energy, and at nutrients like added sugar, sodium, and fiber. The percent daily value helps me compare foods: five percent or less is low and twenty percent or more is high.",
    },
  },
  {
    id: "exercise-and-heart",
    band: "6-8",
    subject: "health",
    visual: "",
    title: { en: "Exercise and your heart", es: "El ejercicio y tu corazón" },
    idea: {
      en: "Your heart is a muscle that pumps blood around your body. Blood carries oxygen to your muscles, and when you exercise your muscles need more oxygen, so your heart beats faster and you breathe harder. Regular exercise makes the heart stronger, so it can pump more blood with each beat and often beats slower when you rest.",
      es: "Tu corazón es un músculo que bombea sangre por todo el cuerpo. La sangre lleva oxígeno a tus músculos, y cuando haces ejercicio tus músculos necesitan más oxígeno, así que tu corazón late más rápido y respiras con más fuerza. El ejercicio regular fortalece el corazón, así que bombea más sangre en cada latido y, en reposo, suele latir más despacio.",
    },
    terms: [
      { w: "heart rate", es: "frecuencia cardíaca", gloss: "how many times your heart beats in one minute" },
      { w: "oxygen", es: "oxígeno", gloss: "a gas in the air that your body needs for energy" },
      { w: "pulse", es: "pulso", gloss: "the beat you can feel in your wrist or neck each time your heart pumps" },
      { w: "endurance", es: "resistencia", gloss: "the ability to stay active for a long time" },
    ],
    points: [
      p("p1", "The heart pumps blood, and the blood carries oxygen to the muscles.", "El corazón bombea sangre, y la sangre lleva oxígeno a los músculos.", ["pump*", "blood", "oxygen", "bombea*", "sangre", "oxígeno", "muscle*"], "The heart ____ blood, and the blood carries ____ to the muscles."),
      p("p2", "During exercise the heart beats faster and you breathe harder because muscles need more oxygen.", "Durante el ejercicio el corazón late más rápido y respiras más fuerte porque los músculos necesitan más oxígeno.", ["faster", "harder", "more oxygen", "breath*", "speed* up", "rápido", "más oxígeno", "respir*", "fast"], "When I exercise, my muscles need more ____, so my heart beats ____."),
      p("p3", "Regular exercise makes the heart stronger, and you can check it with your pulse.", "El ejercicio regular fortalece el corazón, y puedes comprobarlo con tu pulso.", ["stronger", "strength*", "resting", "rest", "regular*", "pulse", "healthier", "fuerte*", "reposo", "pulso", "fortalec*"], "If I exercise regularly, my heart gets ____, and my ____ heart rate can go down."),
    ],
    audience: { en: "Explain it to a friend who says exercise is only about building big muscles.", es: "Explícaselo a un amigo que dice que el ejercicio solo sirve para tener músculos grandes." },
    modelAnswer: {
      en: "The heart is a muscle that pumps blood around the body, and the blood carries oxygen to the muscles. When I exercise, my muscles need more oxygen, so my heart beats faster and I breathe harder. If I exercise regularly, my heart gets stronger, so it pumps more blood with each beat and my resting heart rate can go down. I can check this by feeling my pulse.",
    },
  },
];
