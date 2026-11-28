// One small "discovery" per lab step. Step 2 (Explore) unlocks after the learner tried `need` things;
// every other step opens on request. Warm, short, no score. Copy is chrome, so it translates (I.T).
const d = (q, a, need) => ({ q, a, ...(need ? { need } : {}) });

export const DISCOVERY = {
  "verb-time-machine": {
    1: d(
      ["What do you notice about Maya and her verb?", "¿Qué notas sobre Maya y su verbo?"],
      [
        "Maya never changes. Only the verb changes shape, and the time clue tells you which shape. The clue and the verb are partners.",
        "Maya nunca cambia. Solo cambia la forma del verbo, y la pista de tiempo te dice cuál. La pista y el verbo son compañeros.",
      ],
    ),
    2: d(
      ["What do the little helper words do?", "¿Qué hacen las palabras auxiliares pequeñas?"],
      [
        "Helpers like will, has, was and is carry the time. The main verb carries the meaning. Move the clock and watch which one moves.",
        "Los auxiliares como will, has, was e is llevan el tiempo. El verbo principal lleva el significado. Mueve el reloj y mira cuál se mueve.",
      ],
      3,
    ),
    3: d(
      ["What three questions did the writer ask?", "¿Qué tres preguntas se hizo el escritor?"],
      [
        "What is the time clue? Where is it on the timeline? Which form fits that spot? You can ask these every time.",
        "¿Cuál es la pista de tiempo? ¿Dónde está en la línea del tiempo? ¿Qué forma encaja ahí? Puedes preguntarte esto siempre.",
      ],
    ),
    4: d(
      ["What helps when a verb sounds wrong?", "¿Qué ayuda cuando un verbo suena mal?"],
      [
        "The clue is almost always in the sentence already. Read the time word first, then choose the verb.",
        "La pista casi siempre ya está en la oración. Lee primero la palabra de tiempo y luego elige el verbo.",
      ],
    ),
    5: d(
      [
        "Why is writing that moves through time easy to follow?",
        "¿Por qué es fácil seguir una escritura que se mueve en el tiempo?",
      ],
      [
        "Each time word and its verb agree, so the reader always knows when something happened.",
        "Cada palabra de tiempo y su verbo coinciden, así que el lector siempre sabe cuándo pasó algo.",
      ],
    ),
  },
  "connector-bridge": {
    1: d(
      [
        "Same two ideas, different bridge. What changes?",
        "Mismas dos ideas, otro puente. ¿Qué cambia?",
      ],
      [
        "The meaning changes. A bridge is not just a link: it tells the reader how the ideas are related.",
        "Cambia el significado. Un puente no es solo una unión: le dice al lector cómo se relacionan las ideas.",
      ],
    ),
    2: d(
      ["Is punctuation part of the bridge?", "¿La puntuación es parte del puente?"],
      [
        "Yes. Small bridges like so sit after a comma. Bridges like however need a semicolon before and a comma after. Because needs no comma.",
        "Sí. Los puentes pequeños como so van después de una coma. Los puentes como however llevan punto y coma antes y coma después. Because no lleva coma.",
      ],
      3,
    ),
    3: d(
      ["What question picks the bridge?", "¿Qué pregunta elige el puente?"],
      [
        "Ask: what does idea B do to idea A? Give a reason, show a difference, add more, say what came next, or give an example.",
        "Pregunta: ¿qué hace la idea B con la idea A? Da una razón, muestra una diferencia, agrega más, di qué pasó después o da un ejemplo.",
      ],
    ),
    4: d(
      ["What if two bridges seem to fit?", "¿Y si dos puentes parecen encajar?"],
      [
        "Sometimes both are right. Read the sentence aloud and listen for the meaning you want.",
        "A veces los dos están bien. Lee la oración en voz alta y escucha el significado que quieres.",
      ],
    ),
    5: d(
      ["What did your bridge tell the reader?", "¿Qué le dijo tu puente al lector?"],
      [
        "Choosing a bridge is a choice about meaning. You decide how your readers should connect the ideas.",
        "Elegir un puente es elegir un significado. Tú decides cómo conectarán las ideas tus lectores.",
      ],
    ),
  },
  "paragraph-xray": {
    1: d(
      ["Why does every sentence need a job?", "¿Por qué cada oración necesita una función?"],
      [
        "Like players on a team, each sentence has a position. When every job is filled, the reader can follow your thinking.",
        "Como los jugadores de un equipo, cada oración tiene una posición. Cuando todas las funciones están cubiertas, el lector puede seguir tu pensamiento.",
      ],
    ),
    2: d(
      ["What holds the layers together?", "¿Qué mantiene unidas las capas?"],
      [
        "Linking words (First, Also, This) are the stitches. Switch to the Links lens and follow them from sentence to sentence.",
        "Las palabras de enlace (First, Also, This) son las costuras. Cambia a la lente Enlaces y síguelas de oración en oración.",
      ],
      3,
    ),
    3: d(
      ["What does the explanation layer add?", "¿Qué agrega la capa de explicación?"],
      [
        "Facts alone are a list. The explanation tells why the facts matter, and that turns a list into an argument.",
        "Los datos solos son una lista. La explicación dice por qué importan, y eso convierte la lista en un argumento.",
      ],
    ),
    4: d(
      ["How can a paragraph be rebuilt?", "¿Cómo se puede reconstruir un párrafo?"],
      [
        "Start from the skeleton: topic first, conclusion last, connected details between. A sentence that does not fit any job does not belong.",
        "Empieza por el esqueleto: la idea principal primero, la conclusión al final y detalles conectados en medio. Una oración que no cumple ninguna función no pertenece.",
      ],
    ),
    5: d(
      ["Why start with a topic sentence?", "¿Por qué empezar con una oración principal?"],
      [
        "It tells the reader (and you) where the paragraph is going, so every later sentence has a reason to be there.",
        "Le dice al lector (y a ti) hacia dónde va el párrafo, así cada oración posterior tiene una razón de estar.",
      ],
    ),
  },
};
