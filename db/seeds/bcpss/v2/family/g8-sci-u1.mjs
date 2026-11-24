// BCPSS Family Guide (EN/ES) — g8-sci-u1. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 8 Science unit on forces and motion. Vocabulary order matches ../units/g8-sci-u1.mjs.

export default {
  summary: {
    en: "Your child is learning why the same push can make a light object speed up fast and a heavy object barely move. Pushes and pulls, called forces, change how things move, and mass and friction matter too. It explains shopping carts, bike rides, and seat belts. Your child will use Newton's laws to predict how things will move or crash.",
    es: "Su hijo o hija está aprendiendo por qué el mismo empujón puede hacer que un objeto liviano acelere rápido y que uno pesado casi no se mueva. Los empujones y jalones, llamados fuerzas, cambian cómo se mueven las cosas, y la masa y la fricción también importan. Esto explica los carritos del supermercado, los paseos en bicicleta y los cinturones de seguridad. Su hijo o hija usará las leyes de Newton para predecir cómo se moverán las cosas o cómo chocarán.",
  },
  goals: {
    en: [
      "I can tell balanced forces from unbalanced forces.",
      "I can explain how mass changes acceleration for the same push.",
      "I can use action-reaction pairs to explain a collision.",
    ],
    es: [
      "Puedo distinguir las fuerzas equilibradas de las desequilibradas.",
      "Puedo explicar cómo la masa cambia la aceleración con el mismo empujón.",
      "Puedo usar los pares acción-reacción para explicar una colisión.",
    ],
  },
  vocab: [
    { term: "force", def_es: "un empujón o un jalón sobre un objeto; se parece a la palabra fuerza en inglés", example_es: "Una fuerza puede hacer que el carrito se mueva." },
    { term: "net force", def_es: "la suma de todas las fuerzas sobre un objeto, tomando en cuenta sus direcciones", example_es: "Si dos personas empujan el carrito en sentidos contrarios con la misma fuerza, la fuerza neta es cero." },
    { term: "balanced forces", def_es: "fuerzas que se cancelan entre sí, así que el total es cero", example_es: "Con fuerzas equilibradas, el libro sobre la mesa se queda quieto." },
    { term: "acceleration", def_es: "un cambio en la rapidez o en la dirección de un objeto a lo largo del tiempo", example_es: "La bicicleta tiene aceleración cuando pedaleas más fuerte." },
    { term: "inertia", def_es: "la tendencia de un objeto a seguir quieto o a seguir moviéndose con la misma rapidez", example_es: "Por la inercia, tu cuerpo se va hacia adelante cuando el autobús frena." },
    { term: "mass", def_es: "la cantidad de materia que tiene un objeto; se mide en kilogramos", example_es: "La caja llena tiene más masa que la caja vacía." },
    { term: "friction", def_es: "una fuerza entre superficies que se tocan y que se opone a que se deslicen", example_es: "La fricción de la alfombra detiene el juguete antes que el piso liso." },
    { term: "action-reaction pair", def_es: "dos fuerzas de igual tamaño y dirección contraria que dos objetos se hacen entre sí", example_es: "Cuando empujas la pared, la pared te empuja a ti: es un par acción-reacción." },
    { term: "collision", def_es: "cuando dos objetos en movimiento chocan; se parece a la palabra en inglés", example_es: "En la colisión de las dos canicas, las dos cambian de rapidez." },
  ],
  talk: [
    { en: "What did you push or pull today? What happened to it?", es: "¿Qué empujaste o jalaste hoy? ¿Qué le pasó?" },
    { en: "Why is it harder to push a full shopping cart than an empty one?", es: "¿Por qué cuesta más empujar un carrito lleno que uno vacío?" },
    { en: "If something moves at a steady speed, are the forces balanced? Why?", es: "Si algo se mueve con rapidez constante, ¿las fuerzas están equilibradas? ¿Por qué?" },
    { en: "When you push a wall, what does the wall do to you?", es: "Cuando empujas una pared, ¿qué te hace la pared a ti?" },
    { en: "What was tricky today, and what helped you?", es: "¿Qué fue difícil hoy y qué te ayudó?" },
  ],
  try_at_home: [
    {
      title: { en: "Same Push, Different Mass", es: "El mismo empujón, distinta masa" },
      minutes: 15,
      materials: { en: "A toy car or a small box with wheels, a few coins or books to load it, a smooth floor, a ruler", es: "Un carrito de juguete o una cajita con ruedas, unas monedas o libros para cargarlo, un piso liso y una regla" },
      steps: {
        en: [
          "Give the empty car one push and measure how far it rolls.",
          "Load the car with coins and give it a push of about the same strength. Measure again.",
          "Ask: which one sped up more at the start? Why?",
          "Say it together: with the same force, more mass means less acceleration.",
        ],
        es: [
          "Den un empujón al carrito vacío y midan hasta dónde rueda.",
          "Carguen el carrito con monedas y denle un empujón más o menos igual. Midan otra vez.",
          "Pregunten: ¿cuál aceleró más al principio? ¿Por qué?",
          "Díganlo juntos: con la misma fuerza, más masa significa menos aceleración.",
        ],
      },
    },
    {
      title: { en: "Balloon Rocket", es: "Cohete de globo" },
      minutes: 15,
      materials: { en: "A balloon, a long piece of string, a straw, tape, two chairs", es: "Un globo, un hilo largo, un popote, cinta y dos sillas" },
      steps: {
        en: [
          "Thread the string through the straw and tie the string between two chairs.",
          "Blow up the balloon, pinch it shut, and tape it to the straw.",
          "Let go. Which way does the air go? Which way does the balloon go?",
          "Ask: what is the action? What is the reaction? Are they equal and opposite?",
        ],
        es: [
          "Pasen el hilo por el popote y amarren el hilo entre dos sillas.",
          "Inflen el globo, pellízquenlo para cerrarlo y péguenlo con cinta al popote.",
          "Suéltenlo. ¿Hacia dónde sale el aire? ¿Hacia dónde va el globo?",
          "Pregunten: ¿cuál es la acción? ¿Cuál es la reacción? ¿Son iguales y opuestas?",
        ],
      },
    },
    {
      title: { en: "Coin and Card Inertia", es: "Inercia con moneda y tarjeta" },
      minutes: 10,
      materials: { en: "A glass, an index card or stiff paper, a coin", es: "Un vaso, una tarjeta o papel rígido y una moneda" },
      steps: {
        en: [
          "Put the card on top of the glass and the coin on the card.",
          "Predict: what will happen to the coin if you flick the card away fast?",
          "Flick the card sideways with your finger. Where does the coin go?",
          "Ask: why did the coin stay? Use the word inertia.",
        ],
        es: [
          "Pongan la tarjeta sobre el vaso y la moneda sobre la tarjeta.",
          "Predigan: ¿qué le pasará a la moneda si sacan la tarjeta de un golpecito rápido?",
          "Den un golpecito a la tarjeta hacia un lado. ¿Adónde va la moneda?",
          "Pregunten: ¿por qué se quedó la moneda? Usen la palabra inercia.",
        ],
      },
    },
    {
      title: { en: "Friction Slide", es: "Deslizar y la fricción" },
      minutes: 10,
      materials: { en: "A small box or book, a ramp, a towel, a piece of foil, a smooth floor", es: "Una cajita o un libro, una rampa, una toalla, un pedazo de papel aluminio y un piso liso" },
      steps: {
        en: [
          "Slide the box with the same push on the bare floor, on the towel, and on the foil.",
          "Measure how far it goes each time.",
          "Ask: on which surface did the box go farthest? Which has the most friction?",
          "Ask: when the box slows down, are the forces balanced or not?",
        ],
        es: [
          "Deslicen la cajita con el mismo empujón sobre el piso, sobre la toalla y sobre el aluminio.",
          "Midan hasta dónde llega cada vez.",
          "Pregunten: ¿en qué superficie llegó más lejos? ¿Cuál tiene más fricción?",
          "Pregunten: cuando la cajita se frena, ¿las fuerzas están equilibradas o no?",
        ],
      },
    },
  ],
  say_it: [
    { en: "Because the [cart] has more mass, the same force causes ___ acceleration.", es: "Como el [carrito] tiene más masa, la misma fuerza causa ___ aceleración." },
    { en: "The forces are [balanced], so the object [stays still or keeps its speed].", es: "Las fuerzas están [equilibradas], entonces el objeto [sigue quieto o mantiene su rapidez]." },
    { en: "The [balloon] pushes the air, and the air [pushes back] on the balloon.", es: "El [globo] empuja el aire y el aire [lo empuja de vuelta]." },
    { en: "I predict that [the heavier box] will ___ because ___.", es: "Predigo que [la caja más pesada] va a ___ porque ___." },
  ],
  help: {
    en: [
      "You do not need to know physics. Ask, \"What forces are pushing or pulling?\" and listen.",
      "Predict first, then test. Say, \"What do you think will happen?\"",
      "Keep tests gentle and away from faces. Use soft toys and boxes, never anything sharp or heavy.",
      "Say \"how do you know?\" in any language.",
    ],
    es: [
      "No necesitan saber física. Pregunten \"¿qué fuerzas están empujando o jalando?\" y escuchen.",
      "Primero predecir y luego probar. Digan \"¿qué crees que pasará?\"",
      "Hagan las pruebas con suavidad y lejos de las caras. Usen juguetes blandos y cajas, nunca algo filoso o pesado.",
      "Digan \"¿cómo lo sabes?\" en cualquier idioma.",
    ],
  },
  home_language: {
    en: "Talk about pushing and pulling in Spanish first: \"empujar, jalar, rápido, despacio.\" Then match the English words. Force, acceleration, inertia, friction, and collision are close to Spanish (fuerza, aceleración, inercia, fricción, colisión), so your child already knows many of them.",
    es: "Hablen primero en español de empujar y jalar: \"empujar, jalar, rápido, despacio\". Después busquen las palabras en inglés. Force, acceleration, inertia, friction y collision se parecen al español (fuerza, aceleración, inercia, fricción, colisión), así que su hijo o hija ya conoce muchas.",
  },
  celebrate: {
    en: "You will know it is working when your child pushes something at home and explains, in any language, what forces act on it and why it speeds up, slows down, or stays still.",
    es: "Sabrán que está funcionando cuando su hijo o hija empuje algo en casa y explique, en el idioma que quiera, qué fuerzas actúan sobre eso y por qué acelera, se frena o se queda quieto.",
  },
};
