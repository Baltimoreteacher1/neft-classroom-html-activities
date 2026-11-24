// BCPSS Family Guide (EN/ES) — g7-sci-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 7 Science unit on energy. Vocabulary order matches ../units/g7-sci-u4.mjs.

export default {
  summary: {
    en: "Your child is learning that energy changes form but is never used up. A sled at the top of a hill stores energy, moving down it turns that energy into motion, and friction turns motion into warmth. It matters on playgrounds, in toys, and in every ride on a bike or skateboard. Your child will trace where the energy goes.",
    es: "Su hijo o hija está aprendiendo que la energía cambia de forma, pero nunca se gasta del todo. Un trineo en lo alto de una colina guarda energía, al bajar esa energía se convierte en movimiento y la fricción convierte el movimiento en calor. Importa en los parques, en los juguetes y en cada paseo en bicicleta o patineta. Su hijo o hija seguirá el rastro de adónde va la energía.",
  },
  goals: {
    en: [
      "I can tell kinetic, potential, and thermal energy apart.",
      "I can trace how energy changes form in a system.",
      "I can explain why energy is not lost when something stops.",
    ],
    es: [
      "Puedo distinguir la energía cinética, la potencial y la térmica.",
      "Puedo seguir cómo cambia de forma la energía en un sistema.",
      "Puedo explicar por qué la energía no se pierde cuando algo se detiene.",
    ],
  },
  vocab: [
    { term: "kinetic energy", def_es: "la energía que tiene un objeto porque se está moviendo", example_es: "Un patinador en movimiento tiene energía cinética." },
    { term: "potential energy", def_es: "energía guardada que tiene un objeto por su posición, como su altura", example_es: "El trineo en lo alto de la colina tiene energía potencial." },
    { term: "elastic potential energy", def_es: "energía guardada en algo estirado o apretado, como una liga", example_es: "Una liga estirada guarda energía potencial elástica." },
    { term: "thermal energy", def_es: "la energía de las partículas diminutas que se mueven dentro de un material; hace que se sienta caliente", example_es: "Al frotar las manos, el movimiento se convierte en energía térmica." },
    { term: "friction", def_es: "una fuerza que se opone a que dos superficies que se tocan se deslicen", example_es: "La fricción de los frenos detiene la bicicleta." },
    { term: "transformation", def_es: "un cambio de una forma a otra; se parece a la palabra en inglés", example_es: "Hubo una transformación de energía potencial a energía cinética." },
    { term: "transfer", def_es: "pasar energía de un objeto a otro", example_es: "La pelota transfirió energía a los bolos al chocar." },
    { term: "conservation of energy", def_es: "la regla de que la energía nunca se crea ni se destruye, así que el total se queda igual", example_es: "Por la conservación de la energía, la energía que parece perderse se convierte en calor." },
    { term: "system", def_es: "un grupo de objetos que interactúan y que se estudian como una sola unidad", example_es: "El sistema incluye el trineo, la colina y el aire." },
    { term: "speed", def_es: "qué tan rápido se mueve algo; la distancia que recorre en cierto tiempo", example_es: "La rapidez de la bicicleta es de diez millas por hora." },
  ],
  talk: [
    { en: "Where was something moving fast today? Where did its energy come from?", es: "¿Dónde viste algo moverse rápido hoy? ¿De dónde vino su energía?" },
    { en: "What happens to a rolling ball after it stops? Where did its energy go?", es: "¿Qué le pasa a una pelota que rueda cuando se detiene? ¿Adónde se fue su energía?" },
    { en: "Where have you felt something get warm from rubbing or sliding?", es: "¿Dónde has sentido que algo se calienta al frotarlo o deslizarlo?" },
    { en: "Can energy be used up? What is your evidence?", es: "¿Se puede gastar la energía del todo? ¿Cuál es tu evidencia?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Rolling Ramp", es: "La rampa que rueda" },
      minutes: 15,
      materials: { en: "A flat board or thick cardboard, a stack of books, a toy car or ball, a ruler", es: "Una tabla plana o cartón grueso, una pila de libros, un carrito o una pelota y una regla" },
      steps: {
        en: [
          "Make a ramp with the board on one book. Roll the car and measure how far it goes past the bottom.",
          "Add a second book. Predict first: will it go farther? Roll again and measure.",
          "Ask: where does the car have the most potential energy? Where does it have the most kinetic energy?",
          "Ask: when the car stops, where did its energy go? Feel the floor and the wheels.",
        ],
        es: [
          "Hagan una rampa con la tabla sobre un libro. Rueden el carrito y midan hasta dónde llega después del final.",
          "Agreguen un segundo libro. Primero predigan: ¿llegará más lejos? Rueden otra vez y midan.",
          "Pregunten: ¿dónde tiene el carrito más energía potencial? ¿Dónde tiene más energía cinética?",
          "Pregunten: cuando el carrito se detiene, ¿adónde se fue su energía? Toquen el piso y las ruedas.",
        ],
      },
    },
    {
      title: { en: "Rub Your Hands", es: "Frotar las manos" },
      minutes: 5,
      materials: { en: "Your hands, a table, a coin", es: "Las manos, una mesa y una moneda" },
      steps: {
        en: [
          "Rub your hands together fast for ten seconds. What do you feel?",
          "Slide a coin hard back and forth on the table for ten seconds, then touch it.",
          "Ask: where did the motion go? What kind of energy do you feel now?",
          "Say it together: friction changes motion energy into thermal energy.",
        ],
        es: [
          "Froten las manos rápido durante diez segundos. ¿Qué sienten?",
          "Deslicen una moneda con fuerza de un lado a otro sobre la mesa durante diez segundos y luego tóquenla.",
          "Pregunten: ¿adónde fue el movimiento? ¿Qué clase de energía sienten ahora?",
          "Díganlo juntos: la fricción cambia la energía del movimiento en energía térmica.",
        ],
      },
    },
    {
      title: { en: "Rubber Band Launch", es: "Lanzar con una liga" },
      minutes: 10,
      materials: { en: "A rubber band, a small ball of paper, a ruler; point away from faces", es: "Una liga, una bolita de papel y una regla; apunten lejos de las caras" },
      steps: {
        en: [
          "Stretch the rubber band a little and let the paper ball fly. Measure the distance.",
          "Stretch it twice as far and launch again. Predict first.",
          "Ask: where was the energy stored before you let go? Where did it go after?",
          "Name each form: elastic potential, kinetic, thermal when the ball lands and stops.",
        ],
        es: [
          "Estiren un poco la liga y dejen volar la bolita de papel. Midan la distancia.",
          "Estírenla el doble y lancen otra vez. Primero predigan.",
          "Pregunten: ¿dónde estaba guardada la energía antes de soltar? ¿Adónde fue después?",
          "Nombren cada forma: potencial elástica, cinética y térmica cuando la bolita cae y se detiene.",
        ],
      },
    },
    {
      title: { en: "Playground Energy Walk", es: "Paseo de energía en el parque" },
      minutes: 15,
      materials: { en: "A playground, a park, or photos on a phone; paper and pencil", es: "Un parque o patio de juegos, o fotos en un teléfono; papel y lápiz" },
      steps: {
        en: [
          "Look at a swing, a slide, a seesaw, or a bike. Where is it highest? Where is it fastest?",
          "Draw the swing and mark where it has the most potential energy and the most kinetic energy.",
          "Ask why the swing slowly stops if no one pushes. Where does the energy go?",
          "Ask your child to explain it using the words transformation and transfer.",
        ],
        es: [
          "Miren un columpio, un tobogán, un balancín o una bicicleta. ¿Dónde está más alto? ¿Dónde va más rápido?",
          "Dibujen el columpio y marquen dónde tiene más energía potencial y más energía cinética.",
          "Pregunten por qué el columpio se detiene poco a poco si nadie lo empuja. ¿Adónde va la energía?",
          "Pidan a su hijo o hija que lo explique con las palabras transformación y transferencia.",
        ],
      },
    },
  ],
  say_it: [
    { en: "The [sled] at the top has [potential] energy because of its height.", es: "El [trineo] de arriba tiene energía [potencial] por su altura." },
    { en: "Energy changes form from [potential] to [kinetic].", es: "La energía cambia de forma, de [potencial] a [cinética]." },
    { en: "Friction turns the motion into [thermal] energy, so the total ___.", es: "La fricción convierte el movimiento en energía [térmica], entonces el total ___." },
    { en: "The energy was not lost; it was [transferred] to the ___.", es: "La energía no se perdió; se [transfirió] a ___." },
  ],
  help: {
    en: [
      "You do not need to know physics. Ask, \"Where did the energy go?\" and listen.",
      "Predict first, then test. Say, \"What do you think will happen?\"",
      "Keep tests safe: no aiming rubber bands at faces, and an adult handles anything hot.",
      "Say \"how do you know?\" in any language.",
    ],
    es: [
      "No necesitan saber física. Pregunten \"¿adónde se fue la energía?\" y escuchen.",
      "Primero predecir y luego probar. Digan \"¿qué crees que pasará?\"",
      "Mantengan las pruebas seguras: nada de apuntar ligas a las caras y un adulto maneja cualquier cosa caliente.",
      "Digan \"¿cómo lo sabes?\" en cualquier idioma.",
    ],
  },
  home_language: {
    en: "Talk about a swing or a bike ride in Spanish first: \"subir, bajar, rápido, lento, calor.\" Then match the English words. Energy, kinetic, potential, friction, and transformation are close to Spanish (energía, cinética, potencial, fricción, transformación), so your child already knows many of them.",
    es: "Hablen primero en español de un columpio o un paseo en bicicleta: \"subir, bajar, rápido, lento, calor\". Después busquen las palabras en inglés. Energy, kinetic, potential, friction y transformation se parecen al español (energía, cinética, potencial, fricción, transformación), así que su hijo o hija ya conoce muchas.",
  },
  celebrate: {
    en: "You will know it is working when your child watches something slow to a stop and explains, in any language, where the energy went.",
    es: "Sabrán que está funcionando cuando su hijo o hija vea cómo algo se detiene poco a poco y explique, en el idioma que quiera, adónde se fue la energía.",
  },
};
