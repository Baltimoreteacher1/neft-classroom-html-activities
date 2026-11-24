// BCPSS Family Guide (EN/ES) — g4-sci-u2. Schema: ../schema.mjs (validateFamily)
// Home version of the Grade 4 Science unit on waves and signals. Vocabulary order matches ../units/g4-sci-u2.mjs.

export default {
  summary: {
    en: "Your child is learning how waves carry energy and how patterns of light or sound can carry a message. Waves have a height (amplitude) and a length (wavelength). Water ripples, sound, and light all move as waves. It matters for ship lights on the Bay, music, and every phone call. Your child will explain a process in order with first, next, then, and finally.",
    es: "Su hijo o hija está aprendiendo cómo las ondas llevan energía y cómo los patrones de luz o de sonido pueden llevar un mensaje. Las ondas tienen una altura (amplitud) y una longitud (longitud de onda). Las ondas del agua, el sonido y la luz se mueven como ondas. Sirve para las luces de los barcos en la bahía, la música y cada llamada de teléfono. Su hijo o hija explicará un proceso en orden con primero, luego, después y finalmente.",
  },
  goals: {
    en: [
      "I can describe a wave's amplitude and wavelength.",
      "I can explain how a pattern can send a message.",
      "I can tell a process in order with first, next, then, and finally.",
    ],
    es: [
      "Puedo describir la amplitud y la longitud de onda de una onda.",
      "Puedo explicar cómo un patrón puede enviar un mensaje.",
      "Puedo contar un proceso en orden con primero, luego, después y finalmente.",
    ],
  },
  vocab: [
    { term: "wave", def_es: "un movimiento que se repite, de arriba a abajo o de un lado a otro, y que lleva energía; en español se dice 'onda'", example_es: "Cuando cae una gota en el agua, se forman ondas." },
    { term: "amplitude", def_es: "qué tan alta es una onda, desde su línea del medio hasta la parte de arriba; en español se dice 'amplitud'", example_es: "Una onda más alta tiene mayor amplitud." },
    { term: "wavelength", def_es: "la distancia de la cima de una onda a la cima de la siguiente", example_es: "La longitud de onda es la distancia entre dos crestas." },
    { term: "crest", def_es: "el punto más alto de una onda; en español se dice 'cresta'", example_es: "La cresta es la parte más alta de la onda." },
    { term: "trough", def_es: "el punto más bajo de una onda; en español se dice 'valle'", example_es: "El valle de la onda está entre dos crestas." },
    { term: "pattern", def_es: "algo que se repite de una manera que se puede predecir; en español se dice 'patrón'", example_es: "Un patrón de destellos largos y cortos puede formar un mensaje." },
    { term: "signal", def_es: "un mensaje enviado con luz, sonido u otras ondas; en español se dice 'señal'", example_es: "Los destellos son una señal." },
    { term: "transmit", def_es: "enviar una señal de un lugar a otro; en español se dice 'transmitir'", example_es: "La radio transmite una señal de sonido." },
    { term: "reflect", def_es: "rebotar en una superficie; en español se dice 'reflejar'", example_es: "El espejo refleja la luz de la linterna." },
    { term: "code", def_es: "un conjunto de señales o símbolos que representan letras o ideas; en español se dice 'código'", example_es: "Usamos un código de destellos para decir sí o no." },
  ],
  talk: [
    { en: "What did the wave look like? Where was the crest? Where was the trough?", es: "¿Cómo se veía la onda? ¿Dónde estaba la cresta? ¿Y el valle?" },
    { en: "How can a pattern send a message?", es: "¿Cómo puede un patrón enviar un mensaje?" },
    { en: "What happened first, next, then, and finally?", es: "¿Qué pasó primero, después, luego y finalmente?" },
    { en: "What can reflect light or sound?", es: "¿Qué puede reflejar la luz o el sonido?" },
    { en: "Where did you see or hear a wave today?", es: "¿Dónde viste u oíste una onda hoy?" },
  ],
  try_at_home: [
    {
      title: { en: "Rope Waves", es: "Ondas con la cuerda" },
      minutes: 10,
      materials: { en: "A jump rope or a long piece of string, a partner", es: "Una cuerda de saltar o un hilo largo, y un compañero" },
      steps: {
        en: [
          "Stretch the rope on the floor or hold it between two people. Flick one end up and down.",
          "Watch the wave travel to the other end. Does the rope itself travel, or just the wave?",
          "Flick bigger and smaller. Which has more amplitude?",
          "Flick faster. Is the wavelength shorter or longer?",
        ],
        es: [
          "Estiren la cuerda en el piso o sosténganla entre dos personas. Muevan un extremo hacia arriba y abajo.",
          "Miren cómo viaja la onda hasta el otro extremo. ¿Viaja la cuerda o solo la onda?",
          "Muévanla más grande y más chica. ¿Cuál tiene más amplitud?",
          "Muévanla más rápido. ¿La longitud de onda es más corta o más larga?",
        ],
      },
    },
    {
      title: { en: "Ripple Pan", es: "El molde de ondas" },
      minutes: 10,
      materials: { en: "A shallow pan or baking dish with water, an eyedropper or spoon", es: "Un molde o recipiente poco profundo con agua, un gotero o una cuchara" },
      steps: {
        en: [
          "Wait until the water is still. Drop one drop in the middle. Watch the ripples spread.",
          "Find a crest (high part) and a trough (low part).",
          "Drop from higher up or use a bigger drop. Ask: is the amplitude bigger?",
          "Ask: what do the ripples carry across the water?",
        ],
        es: [
          "Esperen a que el agua esté quieta. Dejen caer una gota en el centro. Miren cómo se extienden las ondas.",
          "Busquen una cresta (parte alta) y un valle (parte baja).",
          "Dejen caer la gota desde más arriba o usen una gota más grande. Pregunten: ¿la amplitud es mayor?",
          "Pregunten: ¿qué llevan las ondas por el agua?",
        ],
      },
    },
    {
      title: { en: "Flashlight Code", es: "Código de linterna" },
      minutes: 15,
      materials: { en: "A flashlight, a dim room or evening porch, paper and pencil, a partner", es: "Una linterna, un cuarto con poca luz o un portal de noche, papel y lápiz, y un compañero" },
      steps: {
        en: [
          "Make a code: for example, one long blink is yes, two short blinks are no.",
          "The sender flashes a pattern across the room. Never shine it in eyes.",
          "The receiver writes down the pattern and reads the message.",
          "Say: first the sender flashes, next the signal travels, then the receiver reads it.",
        ],
        es: [
          "Inventen un código: por ejemplo, un destello largo es sí y dos destellos cortos son no.",
          "El emisor envía un patrón de destellos por el cuarto. Nunca alumbren los ojos.",
          "El receptor anota el patrón y lee el mensaje.",
          "Digan: primero el emisor hace destellos, luego la señal viaja y después el receptor la lee.",
        ],
      },
    },
    {
      title: { en: "Bounce It Back", es: "Hacerlo rebotar" },
      minutes: 10,
      materials: { en: "A flashlight, a small mirror, a wall, a hallway or stairwell", es: "Una linterna, un espejito, una pared y un pasillo o una escalera" },
      steps: {
        en: [
          "Shine the flashlight at the mirror so the light bounces onto the wall. That is reflection.",
          "Move the mirror and see how the spot moves.",
          "In a hallway or stairwell, clap once and listen for the echo. Sound reflects too.",
          "Ask: what surfaces reflect light well? What surfaces reflect sound well?",
        ],
        es: [
          "Alumbren el espejo con la linterna para que la luz rebote en la pared. Eso es reflexión.",
          "Muevan el espejo y vean cómo se mueve el punto de luz.",
          "En un pasillo o una escalera, den una palmada y escuchen el eco. El sonido también se refleja.",
          "Pregunten: ¿qué superficies reflejan bien la luz? ¿Cuáles reflejan bien el sonido?",
        ],
      },
    },
  ],
  say_it: [
    { en: "First, the [sender] [flashes the light], and next, the [signal] [travels].", es: "Primero, el [emisor] [hace destellos], y luego la [señal] [viaja]." },
    { en: "A taller wave has a larger [amplitude].", es: "Una onda más alta tiene una [amplitud] mayor." },
    { en: "The [receiver] reads the [pattern] and understands the [message].", es: "El [receptor] lee el [patrón] y entiende el [mensaje]." },
    { en: "The [mirror] reflects the [light] onto the [wall].", es: "El [espejo] refleja la [luz] en la [pared]." },
  ],
  help: {
    en: [
      "Ask \"what happened first? then what?\" in any language.",
      "Let your child draw the wave and point to the crest and the trough.",
      "Make the code a game. Take turns being the sender and the receiver.",
      "Use safe things: rope, water, a mirror, and a flashlight. Never shine the light in eyes.",
    ],
    es: [
      "Pregunten \"¿qué pasó primero? ¿Y luego?\" en cualquier idioma.",
      "Dejen que su hijo o hija dibuje la onda y señale la cresta y el valle.",
      "Conviertan el código en un juego. Túrnense para ser el emisor y el receptor.",
      "Usen cosas seguras: cuerda, agua, un espejo y una linterna. Nunca alumbren los ojos.",
    ],
  },
  home_language: {
    en: "Many words are cousins: amplitude (amplitud), signal (señal), pattern (patrón), transmit (transmitir), reflect (reflejar), code (código), crest (cresta). Say a message in Spanish, then send it in flashlight code, then say it in English.",
    es: "Muchas palabras son primas: amplitude (amplitud), signal (señal), pattern (patrón), transmit (transmitir), reflect (reflejar), code (código), crest (cresta). Digan un mensaje en español, luego envíenlo en código de linterna y después díganlo en inglés.",
  },
  celebrate: {
    en: "You will know it is working when your child draws a wave, labels the crest and trough, and tells you how a pattern of light or sound sends a message.",
    es: "Sabrán que está funcionando cuando su hijo o hija dibuje una onda, marque la cresta y el valle, y les cuente cómo un patrón de luz o de sonido envía un mensaje.",
  },
};
