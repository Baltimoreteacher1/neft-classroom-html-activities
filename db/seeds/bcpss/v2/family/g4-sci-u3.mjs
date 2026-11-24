// BCPSS Family Guide (EN/ES) — g4-sci-u3. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 4 Science unit on animal structures and senses. Vocabulary order matches ../units/g4-sci-u3.mjs.

export default {
  summary: {
    en: "Your child is learning how an animal's body parts help it sense the world and stay alive. A crab feels, an osprey sees, a cat hears. A receptor picks up a signal, and the brain figures out what it means. It matters on every walk past a squirrel, a gull, or a pet at home. Your child will define a word, say what kind of thing it is, and give a non-example.",
    es: "Su hijo o hija está aprendiendo cómo las partes del cuerpo de un animal le ayudan a percibir el mundo y a seguir vivo. Un cangrejo siente, un águila pescadora ve, un gato oye. Un receptor capta una señal y el cerebro averigua qué significa. Sirve en cada paseo junto a una ardilla, una gaviota o una mascota en casa. Su hijo o hija definirá una palabra, dirá qué tipo de cosa es y dará un ejemplo de lo que no es.",
  },
  goals: {
    en: [
      "I can name body structures and the senses they use.",
      "I can explain how a structure helps an animal survive.",
      "I can define a word, tell what type it is, and give a non-example.",
    ],
    es: [
      "Puedo nombrar estructuras del cuerpo y los sentidos que usan.",
      "Puedo explicar cómo una estructura ayuda a un animal a sobrevivir.",
      "Puedo definir una palabra, decir qué tipo es y dar un ejemplo de lo que no es.",
    ],
  },
  vocab: [
    { term: "structure", def_es: "una parte de una planta o del cuerpo de un animal; en español se dice 'estructura'", example_es: "La antena es una estructura del cangrejo." },
    { term: "function", def_es: "el trabajo que hace una parte; en español se dice 'función'", example_es: "La función de los ojos es ver." },
    { term: "external", def_es: "que está por fuera del cuerpo; en español se dice 'externo'", example_es: "Las orejas del gato son estructuras externas." },
    { term: "internal", def_es: "que está dentro del cuerpo; en español se dice 'interno'", example_es: "El corazón es una estructura interna." },
    { term: "stimulus", def_es: "algo en el ambiente que hace reaccionar a un ser vivo; en español se dice 'estímulo'", example_es: "Un ruido fuerte es un estímulo para el gato." },
    { term: "sense", def_es: "una manera en que el cuerpo recibe información: vista, oído, olfato, gusto o tacto", example_es: "El olfato es el sentido que usa la nariz." },
    { term: "receptor", def_es: "una parte especial del cuerpo que detecta un estímulo; en español se dice 'receptor'", example_es: "El ojo tiene receptores que detectan la luz." },
    { term: "brain", def_es: "el órgano dentro de la cabeza que procesa las señales y le dice al cuerpo qué hacer; en español se dice 'cerebro'", example_es: "El cerebro recibe la señal de la nariz." },
    { term: "response", def_es: "lo que hace un animal después de sentir algo; en español se dice 'respuesta'", example_es: "La respuesta del gato al ruido fue salir corriendo." },
    { term: "survive", def_es: "seguir vivo; en español se dice 'sobrevivir'", example_es: "El olfato ayuda al perro a sobrevivir." },
  ],
  talk: [
    { en: "Which body part senses that? What is its function?", es: "¿Qué parte del cuerpo siente eso? ¿Cuál es su función?" },
    { en: "What was the stimulus? What was the response?", es: "¿Cuál fue el estímulo? ¿Cuál fue la respuesta?" },
    { en: "Is that structure external or internal? How do you know?", es: "¿Esa estructura es externa o interna? ¿Cómo lo sabes?" },
    { en: "How does that part help the animal survive?", es: "¿Cómo ayuda esa parte al animal a sobrevivir?" },
    { en: "What is something that is NOT a receptor?", es: "¿Qué es algo que NO es un receptor?" },
  ],
  try_at_home: [
    {
      title: { en: "Five Senses Walk", es: "Paseo de los cinco sentidos" },
      minutes: 15,
      materials: { en: "A short walk outside or a walk around the house, paper and pencil", es: "Un paseo corto afuera o por la casa, papel y lápiz" },
      steps: {
        en: [
          "Stop and listen. Write 3 things you hear. Which body part sensed them?",
          "Look carefully and write 3 things you see. Touch a safe surface, like bark or a wall.",
          "Smell the air. Ask: what did you notice?",
          "For each sense, say the stimulus and your response.",
        ],
        es: [
          "Deténganse y escuchen. Escriban 3 cosas que oyen. ¿Qué parte del cuerpo las sintió?",
          "Miren con cuidado y escriban 3 cosas que ven. Toquen una superficie segura, como la corteza de un árbol o una pared.",
          "Huelan el aire. Pregunten: ¿qué notaste?",
          "Para cada sentido, digan el estímulo y su respuesta.",
        ],
      },
    },
    {
      title: { en: "Smell Test", es: "La prueba del olfato" },
      minutes: 10,
      materials: { en: "3 or 4 safe smells in cups (cinnamon, orange peel, mint, coffee grounds), a blindfold or closed eyes", es: "3 o 4 olores seguros en vasitos (canela, cáscara de naranja, menta, café molido), una venda o los ojos cerrados" },
      steps: {
        en: [
          "Your child closes their eyes. Hold one cup near their nose.",
          "Ask: what is it? What body part detected it? These are the receptors in the nose.",
          "Ask: what part decides what the smell is? The brain processes the signal.",
          "Switch roles. Say: the nose is a receptor, but it is not the brain.",
        ],
        es: [
          "Su hijo o hija cierra los ojos. Acerquen un vasito a su nariz.",
          "Pregunten: ¿qué es? ¿Qué parte del cuerpo lo detectó? Son los receptores de la nariz.",
          "Pregunten: ¿qué parte decide qué olor es? El cerebro procesa la señal.",
          "Cambien de papel. Digan: la nariz es un receptor, pero no es el cerebro.",
        ],
      },
    },
    {
      title: { en: "Pupil Watch", es: "Observar la pupila" },
      minutes: 5,
      materials: { en: "A mirror, a room where you can dim the lights", es: "Un espejo y un cuarto donde se puedan bajar las luces" },
      steps: {
        en: [
          "Look at your eyes in the mirror in a bright room. Notice the black circle in the middle, the pupil.",
          "Dim the lights for 30 seconds. Look again. What changed?",
          "Turn the lights up. Watch the pupil get smaller. Never shine a bright flashlight in an eye.",
          "Ask: what is the stimulus? What is the response? How does this help the eye?",
        ],
        es: [
          "Miren sus ojos en el espejo en un cuarto con mucha luz. Noten el círculo negro del medio, la pupila.",
          "Bajen las luces durante 30 segundos. Miren otra vez. ¿Qué cambió?",
          "Suban las luces. Vean cómo la pupila se hace más pequeña. Nunca alumbren un ojo con una linterna fuerte.",
          "Pregunten: ¿cuál es el estímulo? ¿Cuál es la respuesta? ¿Cómo le ayuda esto al ojo?",
        ],
      },
    },
    {
      title: { en: "Animal Structure Spotting", es: "Descubrir estructuras de animales" },
      minutes: 15,
      materials: { en: "A park, a yard, or a pet; paper and pencil", es: "Un parque, un patio o una mascota; papel y lápiz" },
      steps: {
        en: [
          "Watch an animal: a squirrel, a gull, a pigeon, a dog, or a cat. Look for its eyes, ears, nose, and whiskers.",
          "Pick one external structure. Ask: what is its function? Which sense does it use?",
          "Say a sentence: the [structure] helps the [animal] [find food or stay safe] because [reason].",
          "Notice how the animal responds when something changes, like a loud sound or a person walking by.",
        ],
        es: [
          "Observen un animal: una ardilla, una gaviota, una paloma, un perro o un gato. Miren sus ojos, orejas, nariz y bigotes.",
          "Elijan una estructura externa. Pregunten: ¿cuál es su función? ¿Qué sentido usa?",
          "Digan una oración: la [estructura] ayuda al [animal] a [encontrar comida o estar a salvo] porque [razón].",
          "Noten cómo responde el animal cuando algo cambia, como un ruido fuerte o una persona que pasa.",
        ],
      },
    },
  ],
  say_it: [
    { en: "A [receptor] is a type of [body part] that [detects a stimulus].", es: "Un [receptor] es un tipo de [parte del cuerpo] que [detecta un estímulo]." },
    { en: "The [structure] helps the [animal] [survive] because [reason].", es: "La [estructura] ayuda al [animal] a [sobrevivir] porque [razón]." },
    { en: "A [receptor] is not a [brain] because [reason].", es: "Un [receptor] no es un [cerebro] porque [razón]." },
    { en: "The [stimulus] was [a loud noise], and the response was [running away].", es: "El [estímulo] fue [un ruido fuerte] y la respuesta fue [salir corriendo]." },
  ],
  help: {
    en: [
      "Ask \"what does that part do?\" and \"how does it help?\" in any language.",
      "Let your child be the animal expert and teach you.",
      "Watch real animals together. A pet or a squirrel is enough.",
      "Only taste food that an adult says is safe. For smell tests, use safe things from the kitchen.",
    ],
    es: [
      "Pregunten \"¿qué hace esa parte?\" y \"¿cómo ayuda?\" en cualquier idioma.",
      "Dejen que su hijo o hija sea el experto en animales y les enseñe.",
      "Observen animales de verdad juntos. Una mascota o una ardilla es suficiente.",
      "Solo prueben alimentos que un adulto diga que son seguros. Para las pruebas de olfato, usen cosas seguras de la cocina.",
    ],
  },
  home_language: {
    en: "Almost every word is a cousin: structure (estructura), function (función), external (externo), internal (interno), stimulus (estímulo), receptor (receptor), response (respuesta). Name the animal parts in Spanish first, then in English.",
    es: "Casi todas las palabras son primas: structure (estructura), function (función), external (externo), internal (interno), stimulus (estímulo), receptor (receptor), response (respuesta). Nombren primero las partes de los animales en español y luego en inglés.",
  },
  celebrate: {
    en: "You will know it is working when your child watches an animal and tells you a structure, its function, and how it helps the animal survive.",
    es: "Sabrán que está funcionando cuando su hijo o hija observe un animal y les diga una estructura, su función y cómo ayuda al animal a sobrevivir.",
  },
};
