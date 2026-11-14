// Passport culture cards: one short, original card about each country on the "My journey" trip (src/journey.js).
// Every country has four cards (a greeting, a place, a food, a tradition), written for grades 3-8 in English and
// Spanish. A card opens after every third stop of a 12-stop route (stops 3, 6, 9 and 12), so finishing a route opens
// all four and every stretch of practice ends with something new. Short routes scale the same way (see cardUnlocks).
// Each card ends with an "Ask someone at home" prompt so families add their own stories and words.
// Facts are general and widely documented; cards describe what many people do, never what "all" people are like.

/** @typedef {{ kind: "greeting"|"place"|"food"|"tradition", title: [string, string], text: [string, string], ask: [string, string] }} CultureCard */

export const CARD_KINDS = ["greeting", "place", "food", "tradition"];
export const KIND_LABEL = {
  greeting: ["Greeting", "Saludo"],
  place: ["Place", "Lugar"],
  food: ["Food", "Comida"],
  tradition: ["Tradition", "Tradición"],
};

const card = (kind, title, text, ask) => ({ kind, title, text, ask });

/** Keyed by the English country name used in COUNTRIES. Order matches CARD_KINDS. */
export const PASSPORT_CARDS = {
  Japan: [
    card(
      "greeting",
      ["Konnichiwa", "Konnichiwa"],
      [
        "In Japanese, “konnichiwa” is a friendly hello during the day. Many people also bow a little when they greet someone.",
        "En japonés, “konnichiwa” es un saludo amable durante el día. Muchas personas también hacen una pequeña reverencia al saludar.",
      ],
      [
        "Ask someone at home: How do you greet an older person where you grew up?",
        "Pregunta a alguien en casa: ¿Cómo se saluda a una persona mayor en el lugar donde creciste?",
      ],
    ),
    card(
      "place",
      ["Mount Fuji", "El monte Fuji"],
      [
        "Mount Fuji is the tallest mountain in Japan. It is a volcano, and its snowy top can be seen from far away on a clear day.",
        "El monte Fuji es la montaña más alta de Japón. Es un volcán, y su cima con nieve se ve desde lejos en un día despejado.",
      ],
      [
        "Ask someone at home: What is a mountain, river or beach you remember?",
        "Pregunta a alguien en casa: ¿Qué montaña, río o playa recuerdas?",
      ],
    ),
    card(
      "food",
      ["Onigiri", "Onigiri"],
      [
        "Onigiri are rice balls, often wrapped in a strip of seaweed. People pack them for lunch, school trips and picnics.",
        "Los onigiri son bolitas de arroz, a menudo envueltas en una tira de alga. La gente los lleva para el almuerzo, las excursiones y los pícnics.",
      ],
      [
        "Ask someone at home: What food do we pack for a trip?",
        "Pregunta a alguien en casa: ¿Qué comida llevamos cuando salimos de viaje?",
      ],
    ),
    card(
      "tradition",
      ["Shoes off at the door", "Zapatos fuera en la puerta"],
      [
        "In many homes in Japan, people take off their shoes at the entrance and put on slippers to keep the floors clean.",
        "En muchas casas de Japón, la gente se quita los zapatos en la entrada y se pone pantuflas para mantener limpio el piso.",
      ],
      [
        "Ask someone at home: What is one rule our family has for guests?",
        "Pregunta a alguien en casa: ¿Qué regla tiene nuestra familia para las visitas?",
      ],
    ),
  ],
  Kenya: [
    card(
      "greeting",
      ["Jambo", "Jambo"],
      [
        "Swahili and English are both official languages of Kenya. “Jambo” and “Habari?” are common ways to say hello in Swahili.",
        "El suajili y el inglés son idiomas oficiales de Kenia. “Jambo” y “Habari?” son maneras comunes de saludar en suajili.",
      ],
      [
        "Ask someone at home: How many languages do people in our family speak?",
        "Pregunta a alguien en casa: ¿Cuántos idiomas hablan las personas de nuestra familia?",
      ],
    ),
    card(
      "place",
      ["The Great Rift Valley", "El Gran Valle del Rift"],
      [
        "The Great Rift Valley is a long, wide valley that crosses Kenya. It has lakes, volcanoes and grasslands where many animals live.",
        "El Gran Valle del Rift es un valle largo y ancho que cruza Kenia. Tiene lagos, volcanes y praderas donde viven muchos animales.",
      ],
      [
        "Ask someone at home: What animals lived near the place you grew up?",
        "Pregunta a alguien en casa: ¿Qué animales vivían cerca del lugar donde creciste?",
      ],
    ),
    card(
      "food",
      ["Ugali", "Ugali"],
      [
        "Ugali is a thick, soft dish made from cornmeal and water. It is often eaten by hand with cooked greens called sukuma wiki.",
        "El ugali es un plato espeso y suave hecho con harina de maíz y agua. A menudo se come con la mano junto con verduras cocidas llamadas sukuma wiki.",
      ],
      [
        "Ask someone at home: What is a food we make with corn or flour?",
        "Pregunta a alguien en casa: ¿Qué comida hacemos con maíz o harina?",
      ],
    ),
    card(
      "tradition",
      ["Harambee", "Harambee"],
      [
        "“Harambee” means “let us all pull together.” People use the word when a community works together to help someone or build something.",
        "“Harambee” significa “jalemos todos juntos”. La gente usa la palabra cuando una comunidad trabaja unida para ayudar a alguien o construir algo.",
      ],
      [
        "Ask someone at home: When did people work together to help our family or neighbors?",
        "Pregunta a alguien en casa: ¿Cuándo trabajó la gente unida para ayudar a nuestra familia o a los vecinos?",
      ],
    ),
  ],
  Brazil: [
    card(
      "greeting",
      ["Oi! Tudo bem?", "Oi! Tudo bem?"],
      [
        "People in Brazil speak Portuguese. “Oi! Tudo bem?” means “Hi! Is everything good?” Friends often answer, “Tudo bem!”",
        "En Brasil se habla portugués. “Oi! Tudo bem?” significa “¡Hola! ¿Todo bien?”. Los amigos a menudo responden: “¡Tudo bem!”.",
      ],
      [
        "Ask someone at home: What do we say when we ask how someone is?",
        "Pregunta a alguien en casa: ¿Qué decimos cuando preguntamos cómo está alguien?",
      ],
    ),
    card(
      "place",
      ["The Amazon rainforest", "La selva amazónica"],
      [
        "Most of the Amazon rainforest is in Brazil. It is the largest tropical rainforest in the world and is home to thousands of kinds of plants and animals.",
        "La mayor parte de la selva amazónica está en Brasil. Es la selva tropical más grande del mundo y es el hogar de miles de tipos de plantas y animales.",
      ],
      [
        "Ask someone at home: What is the most beautiful place in nature you have seen?",
        "Pregunta a alguien en casa: ¿Cuál es el lugar de la naturaleza más bonito que has visto?",
      ],
    ),
    card(
      "food",
      ["Pão de queijo", "Pão de queijo"],
      [
        "Pão de queijo is a small, warm cheese bread. It is chewy inside because it is made with cassava flour.",
        "El pão de queijo es un pancito de queso, pequeño y calentito. Por dentro es elástico porque se hace con harina de yuca.",
      ],
      [
        "Ask someone at home: What bread or snack do you like with breakfast?",
        "Pregunta a alguien en casa: ¿Qué pan o merienda te gusta con el desayuno?",
      ],
    ),
    card(
      "tradition",
      ["Carnival", "El Carnaval"],
      [
        "Carnival is a big celebration before Lent, with music, dancing and parades. Samba schools practice for months to perform.",
        "El Carnaval es una gran celebración antes de la Cuaresma, con música, baile y desfiles. Las escuelas de samba practican durante meses para presentarse.",
      ],
      [
        "Ask someone at home: What celebration in our family has music or dancing?",
        "Pregunta a alguien en casa: ¿Qué celebración de nuestra familia tiene música o baile?",
      ],
    ),
  ],
  Mexico: [
    card(
      "greeting",
      ["¡Buenos días!", "¡Buenos días!"],
      [
        "Spanish is the most spoken language in Mexico, and many people also speak Indigenous languages such as Nahuatl and Maya. “¡Buenos días!” means “Good morning!”",
        "El español es el idioma más hablado en México, y muchas personas también hablan lenguas indígenas como el náhuatl y el maya. “¡Buenos días!” es un saludo para la mañana.",
      ],
      [
        "Ask someone at home: Do you know a word from another language that we use every day?",
        "Pregunta a alguien en casa: ¿Conoces una palabra de otro idioma que usamos todos los días?",
      ],
    ),
    card(
      "place",
      ["Chichén Itzá", "Chichén Itzá"],
      [
        "Chichén Itzá is an ancient Maya city on the Yucatán Peninsula. Its tall stone pyramid, El Castillo, has stairs on all four sides.",
        "Chichén Itzá es una antigua ciudad maya en la península de Yucatán. Su alta pirámide de piedra, El Castillo, tiene escaleras en sus cuatro lados.",
      ],
      [
        "Ask someone at home: What old building or place do you remember from when you were young?",
        "Pregunta a alguien en casa: ¿Qué edificio o lugar antiguo recuerdas de cuando eras joven?",
      ],
    ),
    card(
      "food",
      ["Tortillas", "Las tortillas"],
      [
        "People in Mexico have grown corn for thousands of years. Corn tortillas are part of many meals, from tacos to enchiladas.",
        "En México se cultiva maíz desde hace miles de años. Las tortillas de maíz forman parte de muchas comidas, desde los tacos hasta las enchiladas.",
      ],
      [
        "Ask someone at home: What food do we eat with almost every meal?",
        "Pregunta a alguien en casa: ¿Qué comida comemos con casi todas las comidas?",
      ],
    ),
    card(
      "tradition",
      ["Día de Muertos", "Día de Muertos"],
      [
        "On November 1 and 2, many families honor loved ones who have died. They make an ofrenda with photos, marigold flowers and favorite foods.",
        "El 1 y el 2 de noviembre, muchas familias honran a sus seres queridos que han fallecido. Preparan una ofrenda con fotos, flores de cempasúchil y comidas favoritas.",
      ],
      [
        "Ask someone at home: How do we remember people in our family who came before us?",
        "Pregunta a alguien en casa: ¿Cómo recordamos a las personas de nuestra familia que vinieron antes que nosotros?",
      ],
    ),
  ],
  Italy: [
    card(
      "greeting",
      ["Ciao", "Ciao"],
      [
        "In Italian, “ciao” means both hello and goodbye between friends. “Buongiorno” is a polite “good morning.”",
        "En italiano, “ciao” significa hola y adiós entre amigos. “Buongiorno” es un “buenos días” cortés.",
      ],
      [
        "Ask someone at home: Is there a word we use for both hello and goodbye?",
        "Pregunta a alguien en casa: ¿Tenemos una palabra que sirva para hola y para adiós?",
      ],
    ),
    card(
      "place",
      ["The Colosseum", "El Coliseo"],
      [
        "The Colosseum in Rome is almost 2,000 years old. It was a huge stone arena where thousands of people came to watch events.",
        "El Coliseo de Roma tiene casi 2,000 años. Era una enorme arena de piedra a la que miles de personas iban a ver espectáculos.",
      ],
      [
        "Ask someone at home: Where did people gather to watch games or shows when you were young?",
        "Pregunta a alguien en casa: ¿Dónde se reunía la gente a ver partidos o espectáculos cuando eras joven?",
      ],
    ),
    card(
      "food",
      ["Pasta shapes", "Las formas de la pasta"],
      [
        "Italy has hundreds of pasta shapes, like long spaghetti, tube-shaped penne and bow-shaped farfalle. Different shapes go with different sauces.",
        "Italia tiene cientos de formas de pasta, como los espaguetis largos, los penne en forma de tubo y las farfalle en forma de moño. Cada forma va con distintas salsas.",
      ],
      [
        "Ask someone at home: What dish do you know how to cook that you learned from someone else?",
        "Pregunta a alguien en casa: ¿Qué plato sabes cocinar que aprendiste de otra persona?",
      ],
    ),
    card(
      "tradition",
      ["La passeggiata", "La passeggiata"],
      [
        "In many Italian towns, people take an evening walk called the passeggiata. Families and friends stroll, talk and greet their neighbors.",
        "En muchos pueblos de Italia, la gente da un paseo por la tarde llamado passeggiata. Familias y amigos caminan, conversan y saludan a sus vecinos.",
      ],
      [
        "Ask someone at home: What do we like to do together in the evening?",
        "Pregunta a alguien en casa: ¿Qué nos gusta hacer juntos por la tarde o la noche?",
      ],
    ),
  ],
  India: [
    card(
      "greeting",
      ["Namaste", "Namaste"],
      [
        "“Namaste” is a greeting said with palms pressed together. India has many languages; Hindi and English are used widely.",
        "“Namaste” es un saludo que se dice con las palmas de las manos juntas. India tiene muchos idiomas; el hindi y el inglés se usan mucho.",
      ],
      [
        "Ask someone at home: Is there a greeting we do with our hands?",
        "Pregunta a alguien en casa: ¿Hay algún saludo que hacemos con las manos?",
      ],
    ),
    card(
      "place",
      ["The Taj Mahal", "El Taj Mahal"],
      [
        "The Taj Mahal in the city of Agra is a white marble building finished in the 1600s. It was built in memory of an emperor’s wife.",
        "El Taj Mahal, en la ciudad de Agra, es un edificio de mármol blanco terminado en el siglo XVII. Se construyó en memoria de la esposa de un emperador.",
      ],
      [
        "Ask someone at home: What is a special building in the place you are from?",
        "Pregunta a alguien en casa: ¿Qué edificio especial hay en el lugar de donde vienes?",
      ],
    ),
    card(
      "food",
      ["Dal and roti", "Dal y roti"],
      [
        "Food changes from region to region in India. Many meals include dal, a lentil dish, with rice or roti, a round flatbread.",
        "La comida cambia de una región a otra en India. Muchas comidas incluyen dal, un plato de lentejas, con arroz o roti, un pan plano y redondo.",
      ],
      [
        "Ask someone at home: What beans or lentils do we cook, and how?",
        "Pregunta a alguien en casa: ¿Qué frijoles o lentejas cocinamos, y cómo?",
      ],
    ),
    card(
      "tradition",
      ["Diwali", "Diwali"],
      [
        "Diwali is a festival of lights celebrated by many families in India and around the world. People light small clay lamps called diyas.",
        "Diwali es un festival de las luces que celebran muchas familias en India y en todo el mundo. La gente enciende pequeñas lámparas de barro llamadas diyas.",
      ],
      [
        "Ask someone at home: What holiday do we celebrate with lights or candles?",
        "Pregunta a alguien en casa: ¿Qué fiesta celebramos con luces o velas?",
      ],
    ),
  ],
  Egypt: [
    card(
      "greeting",
      ["Ahlan", "Ahlan"],
      [
        "Arabic is the main language of Egypt. “Ahlan” means hello, and “Ahlan wa sahlan” is a warm way to say “welcome.”",
        "El árabe es el idioma principal de Egipto. “Ahlan” significa hola, y “Ahlan wa sahlan” es una manera cálida de decir “bienvenido”.",
      ],
      [
        "Ask someone at home: How do we welcome a guest into our home?",
        "Pregunta a alguien en casa: ¿Cómo damos la bienvenida a una visita en nuestra casa?",
      ],
    ),
    card(
      "place",
      ["The Pyramids of Giza", "Las pirámides de Guiza"],
      [
        "The Pyramids of Giza are more than 4,500 years old. They stand near the Nile, the long river that runs through Egypt.",
        "Las pirámides de Guiza tienen más de 4,500 años. Están cerca del Nilo, el largo río que atraviesa Egipto.",
      ],
      [
        "Ask someone at home: Is there a river near the place you grew up? What was it like?",
        "Pregunta a alguien en casa: ¿Había un río cerca del lugar donde creciste? ¿Cómo era?",
      ],
    ),
    card(
      "food",
      ["Koshari", "Koshari"],
      [
        "Koshari is a popular dish of rice, lentils and pasta topped with tomato sauce and crispy onions. It is sold at busy street shops.",
        "El koshari es un plato popular de arroz, lentejas y pasta con salsa de tomate y cebolla crujiente. Se vende en tiendas callejeras muy concurridas.",
      ],
      [
        "Ask someone at home: What food do people buy on the street where you are from?",
        "Pregunta a alguien en casa: ¿Qué comida compra la gente en la calle en el lugar de donde vienes?",
      ],
    ),
    card(
      "tradition",
      ["Sham el-Nessim", "Sham el-Nessim"],
      [
        "Sham el-Nessim is a spring holiday that is thousands of years old. Families go outside for picnics in parks and by the river, and children color eggs.",
        "Sham el-Nessim es una fiesta de primavera con miles de años de historia. Las familias salen de pícnic a los parques y a la orilla del río, y los niños pintan huevos.",
      ],
      [
        "Ask someone at home: How do we celebrate when the weather gets warm?",
        "Pregunta a alguien en casa: ¿Cómo celebramos cuando empieza a hacer calor?",
      ],
    ),
  ],
  Peru: [
    card(
      "greeting",
      ["¡Hola!", "¡Hola!"],
      [
        "Spanish is the most spoken language in Peru, and millions of people also speak Quechua, a language of the Andes mountains.",
        "El español es el idioma más hablado en Perú, y millones de personas también hablan quechua, un idioma de la cordillera de los Andes.",
      ],
      [
        "Ask someone at home: What languages did your grandparents speak?",
        "Pregunta a alguien en casa: ¿Qué idiomas hablaban tus abuelos?",
      ],
    ),
    card(
      "place",
      ["Machu Picchu", "Machu Picchu"],
      [
        "Machu Picchu is a stone city built by the Inca high in the Andes in the 1400s. Its walls fit together without mortar.",
        "Machu Picchu es una ciudad de piedra que construyeron los incas en lo alto de los Andes en el siglo XV. Sus muros encajan sin mezcla.",
      ],
      [
        "Ask someone at home: What is the highest place you have ever been?",
        "Pregunta a alguien en casa: ¿Cuál es el lugar más alto donde has estado?",
      ],
    ),
    card(
      "food",
      ["Potatoes", "Las papas"],
      [
        "Potatoes were first grown in the Andes. Farmers in Peru grow thousands of kinds, in many colors, shapes and sizes.",
        "Las papas se cultivaron por primera vez en los Andes. Los agricultores de Perú cultivan miles de variedades, de muchos colores, formas y tamaños.",
      ],
      [
        "Ask someone at home: What is your favorite way to cook potatoes?",
        "Pregunta a alguien en casa: ¿Cuál es tu manera favorita de cocinar papas?",
      ],
    ),
    card(
      "tradition",
      ["Inti Raymi", "El Inti Raymi"],
      [
        "Inti Raymi is a festival of the sun held in Cusco every June. People in colorful clothing act out an Inca ceremony with music and dance.",
        "El Inti Raymi es una fiesta del sol que se celebra en Cusco cada junio. Personas con ropa de colores representan una ceremonia inca con música y danza.",
      ],
      [
        "Ask someone at home: What festival from where you grew up do you miss?",
        "Pregunta a alguien en casa: ¿Qué fiesta del lugar donde creciste extrañas?",
      ],
    ),
  ],
  Australia: [
    card(
      "greeting",
      ["G’day", "G’day"],
      [
        "“G’day” is a short, friendly way to say “good day” in Australia. Many Aboriginal languages are also spoken across the country.",
        "“G’day” es una manera corta y amistosa de decir “buen día” en Australia. En todo el país también se hablan muchas lenguas aborígenes.",
      ],
      [
        "Ask someone at home: What is a short, friendly way we say hello?",
        "Pregunta a alguien en casa: ¿Cuál es una manera corta y amistosa de saludar?",
      ],
    ),
    card(
      "place",
      ["The Great Barrier Reef", "La Gran Barrera de Coral"],
      [
        "The Great Barrier Reef is the largest coral reef system in the world. It is so big that it can be seen from space.",
        "La Gran Barrera de Coral es el sistema de arrecifes de coral más grande del mundo. Es tan grande que se puede ver desde el espacio.",
      ],
      [
        "Ask someone at home: Have you ever seen the ocean? What do you remember?",
        "Pregunta a alguien en casa: ¿Alguna vez has visto el mar? ¿Qué recuerdas?",
      ],
    ),
    card(
      "food",
      ["Damper", "El damper"],
      [
        "Damper is a simple bread made from flour and water and baked in the coals of a campfire. Many families make it on camping trips.",
        "El damper es un pan sencillo hecho con harina y agua que se hornea en las brasas de una fogata. Muchas familias lo preparan cuando van de campamento.",
      ],
      [
        "Ask someone at home: What food do we cook outside or over a fire?",
        "Pregunta a alguien en casa: ¿Qué comida cocinamos afuera o sobre el fuego?",
      ],
    ),
    card(
      "tradition",
      ["NAIDOC Week", "La Semana NAIDOC"],
      [
        "Aboriginal and Torres Strait Islander peoples have cultures that go back more than 60,000 years. Every July, NAIDOC Week celebrates their history and achievements.",
        "Los pueblos aborígenes y de las islas del Estrecho de Torres tienen culturas de más de 60,000 años. Cada julio, la Semana NAIDOC celebra su historia y sus logros.",
      ],
      [
        "Ask someone at home: What is a story about our family’s history?",
        "Pregunta a alguien en casa: ¿Qué historia hay sobre el pasado de nuestra familia?",
      ],
    ),
  ],
  Canada: [
    card(
      "greeting",
      ["Hello! Bonjour!", "Hello! Bonjour!"],
      [
        "Canada has two official languages, English and French. Many signs and packages show both, so “hello” and “bonjour” appear side by side.",
        "Canadá tiene dos idiomas oficiales, el inglés y el francés. Muchos letreros y paquetes muestran los dos, así que “hello” y “bonjour” aparecen juntos.",
      ],
      [
        "Ask someone at home: Where do we see two languages on the same sign or label?",
        "Pregunta a alguien en casa: ¿Dónde vemos dos idiomas en el mismo letrero o etiqueta?",
      ],
    ),
    card(
      "place",
      ["The Rocky Mountains", "Las Montañas Rocosas"],
      [
        "The Rocky Mountains stretch across western Canada. Parks like Banff have bright blue lakes, glaciers and wildlife such as elk and bears.",
        "Las Montañas Rocosas se extienden por el oeste de Canadá. Parques como Banff tienen lagos de un azul intenso, glaciares y animales como alces y osos.",
      ],
      [
        "Ask someone at home: What park or outdoor place do you like to visit?",
        "Pregunta a alguien en casa: ¿Qué parque o lugar al aire libre te gusta visitar?",
      ],
    ),
    card(
      "food",
      ["Maple syrup", "El jarabe de arce"],
      [
        "Maple syrup comes from the sap of maple trees. In early spring, the sap is collected and boiled until it turns into sweet syrup.",
        "El jarabe de arce sale de la savia de los árboles de arce. A principios de la primavera, la savia se recoge y se hierve hasta que se convierte en un jarabe dulce.",
      ],
      [
        "Ask someone at home: What sweet treat do we make or buy for special days?",
        "Pregunta a alguien en casa: ¿Qué dulce hacemos o compramos para los días especiales?",
      ],
    ),
    card(
      "tradition",
      ["Winter on the ice", "El invierno sobre el hielo"],
      [
        "Canadian winters are long and cold. Many towns flood outdoor rinks, and kids play hockey and skate on frozen ponds.",
        "Los inviernos en Canadá son largos y fríos. Muchos pueblos llenan pistas al aire libre con agua para que se congele, y los niños juegan hockey y patinan en estanques congelados.",
      ],
      [
        "Ask someone at home: What games did you play outside when you were a kid?",
        "Pregunta a alguien en casa: ¿Qué juegos jugabas afuera cuando eras niño o niña?",
      ],
    ),
  ],
  Morocco: [
    card(
      "greeting",
      ["As-salamu alaykum", "As-salamu alaykum"],
      [
        "Arabic and Amazigh (Tamazight) are official languages of Morocco. “As-salamu alaykum” means “peace be with you” and is a common greeting.",
        "El árabe y el amazig (tamazight) son idiomas oficiales de Marruecos. “As-salamu alaykum” significa “la paz sea contigo” y es un saludo común.",
      ],
      [
        "Ask someone at home: What does our greeting mean word by word?",
        "Pregunta a alguien en casa: ¿Qué significa nuestro saludo palabra por palabra?",
      ],
    ),
    card(
      "place",
      ["The Atlas Mountains", "Las montañas del Atlas"],
      [
        "The Atlas Mountains cross Morocco between the coast and the Sahara Desert. In winter, some of the high peaks are covered in snow.",
        "Las montañas del Atlas cruzan Marruecos entre la costa y el desierto del Sahara. En invierno, algunos picos altos se cubren de nieve.",
      ],
      [
        "Ask someone at home: What was the weather like where you grew up?",
        "Pregunta a alguien en casa: ¿Cómo era el clima donde creciste?",
      ],
    ),
    card(
      "food",
      ["Couscous", "El cuscús"],
      [
        "Couscous is made of tiny grains of steamed semolina, often served with vegetables. Many families share it from one large plate, often on Fridays.",
        "El cuscús está hecho de granitos de sémola cocidos al vapor y suele servirse con verduras. Muchas familias lo comparten en un plato grande, a menudo los viernes.",
      ],
      [
        "Ask someone at home: Is there a meal we share from one big dish?",
        "Pregunta a alguien en casa: ¿Hay alguna comida que compartimos de un plato grande?",
      ],
    ),
    card(
      "tradition",
      ["Mint tea for guests", "Té de menta para las visitas"],
      [
        "Offering sweet mint tea is a sign of welcome in Morocco. The tea is poured from high above the glass to make a little foam.",
        "Ofrecer té de menta dulce es una señal de bienvenida en Marruecos. El té se sirve desde lo alto del vaso para que haga un poco de espuma.",
      ],
      [
        "Ask someone at home: What drink or food do we offer when someone visits?",
        "Pregunta a alguien en casa: ¿Qué bebida o comida ofrecemos cuando alguien nos visita?",
      ],
    ),
  ],
  China: [
    card(
      "greeting",
      ["Nǐ hǎo", "Nǐ hǎo"],
      [
        "“Nǐ hǎo” means hello in Mandarin Chinese. Mandarin is a tonal language: the same sound can mean different things when the voice goes up or down.",
        "“Nǐ hǎo” significa hola en chino mandarín. El mandarín es un idioma tonal: el mismo sonido puede significar cosas distintas si la voz sube o baja.",
      ],
      [
        "Ask someone at home: Is there a word in our language that changes meaning when you say it differently?",
        "Pregunta a alguien en casa: ¿Hay una palabra en nuestro idioma que cambia de significado si la dices de otra manera?",
      ],
    ),
    card(
      "place",
      ["The Great Wall", "La Gran Muralla"],
      [
        "The Great Wall of China is made of many walls built over hundreds of years. Together they stretch for thousands of miles across hills and deserts.",
        "La Gran Muralla China está formada por muchas murallas construidas durante cientos de años. Juntas se extienden por miles de kilómetros sobre colinas y desiertos.",
      ],
      [
        "Ask someone at home: What is the longest trip you have ever taken?",
        "Pregunta a alguien en casa: ¿Cuál es el viaje más largo que has hecho?",
      ],
    ),
    card(
      "food",
      ["Dumplings", "Los dumplings"],
      [
        "Dumplings called jiaozi are pockets of dough filled with meat or vegetables. Families often fold them together at Lunar New Year.",
        "Los dumplings llamados jiaozi son bolsitas de masa rellenas de carne o verduras. Las familias a menudo los preparan juntas en el Año Nuevo Lunar.",
      ],
      [
        "Ask someone at home: What food do we make together as a family?",
        "Pregunta a alguien en casa: ¿Qué comida preparamos juntos en familia?",
      ],
    ),
    card(
      "tradition",
      ["Red envelopes", "Los sobres rojos"],
      [
        "At Lunar New Year, adults give children red envelopes with a little money inside. Red is a color for good luck.",
        "En el Año Nuevo Lunar, los adultos les dan a los niños sobres rojos con un poco de dinero adentro. El rojo es un color de buena suerte.",
      ],
      [
        "Ask someone at home: What color or object means good luck to our family?",
        "Pregunta a alguien en casa: ¿Qué color u objeto significa buena suerte para nuestra familia?",
      ],
    ),
  ],
};

/**
 * How many cards a route has opened. Four cards spread over the route's stops: with 12 stops they open at
 * 3, 6, 9 and 12 finished stops; a shorter route opens them in the same proportion (the last always at the end).
 * @param {number} stopsDone finished stops
 * @param {number} stops stops on the route (1-12)
 */
export function cardUnlocks(stopsDone, stops) {
  const total = Math.max(0, Math.floor(Number(stops) || 0));
  const done = Math.max(0, Math.min(total, Math.floor(Number(stopsDone) || 0)));
  if (!total) return 0;
  return CARD_KINDS.filter((_, k) => done >= Math.ceil(((k + 1) * total) / CARD_KINDS.length))
    .length;
}

/** The stop (1-based) at which card `k` opens on a route with `stops` stops. */
export const cardStop = (k, stops) => Math.ceil(((k + 1) * stops) / CARD_KINDS.length);

/** The cards a route has opened, in order. */
export const unlockedCards = (country, stopsDone, stops) =>
  (PASSPORT_CARDS[country] || []).slice(0, cardUnlocks(stopsDone, stops));
