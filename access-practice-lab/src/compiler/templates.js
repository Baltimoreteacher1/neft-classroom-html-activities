// Experience compiler: the words GENERATE authors. Every template is English AND Spanish (tú for learners); the
// blanks are filled with the source's own terms, which stay in the source's language. Data and one small question
// picker; no logic about the mission lives here. Nothing here is a score, a level or a timer.
export const P = (en, es) => [en, es];

export const FRAMES = Object.freeze({
  Explain: [
    P("___ happened because ___.", "___ pasó porque ___."),
    P("First, ___. As a result, ___.", "Primero, ___. Como resultado, ___."),
    P("The evidence shows ___, so ___.", "La evidencia muestra ___, por eso ___."),
  ],
  Argue: [
    P("I think ___ because ___.", "Pienso que ___ porque ___."),
    P("According to ___, ___. This shows that ___.", "Según ___, ___. Esto muestra que ___."),
    P(
      "Some people say ___, but the evidence shows ___.",
      "Algunas personas dicen ___, pero la evidencia muestra ___.",
    ),
  ],
  Inform: [
    P("___ is ___ that ___.", "___ es ___ que ___."),
    P("One important fact is ___. Another is ___.", "Un dato importante es ___. Otro es ___."),
    P("For example, ___.", "Por ejemplo, ___."),
  ],
  Narrate: [
    P("At first, ___. Then, ___.", "Al principio, ___. Luego, ___."),
    P("After that, ___. Finally, ___.", "Después, ___. Al final, ___."),
    P(
      "The most important moment was ___ because ___.",
      "El momento más importante fue ___ porque ___.",
    ),
  ],
});
export const USE_VERB = {
  Explain: P("Explain", "Explica"),
  Argue: P("Argue", "Argumenta"),
  Inform: P("Inform", "Informa"),
  Narrate: P("Tell", "Cuenta"),
};
export const USE_ASK = {
  Explain: P("what happened and why", "qué pasó y por qué"),
  Argue: P("which explanation is right and why", "qué explicación es correcta y por qué"),
  Inform: P("the most important facts you found", "los datos más importantes que encontraste"),
  Narrate: P("what happened, in order", "qué pasó, en orden"),
};
export const EV_TITLE = {
  object: (t) => P(`Something to examine: ${t}`, `Algo para examinar: ${t}`),
  document: (t) => P(`Field notes: ${t}`, `Notas de campo: ${t}`),
  data: (t) => P(`Data card: ${t}`, `Tarjeta de datos: ${t}`),
  audio: (t, who) =>
    who
      ? P(`Recorded message from ${who}`, `Mensaje grabado de ${who}`)
      : P(`Recorded message: ${t}`, `Mensaje grabado: ${t}`),
  testimony: (t, who) => P(`What ${who} heard about ${t}`, `Lo que ${who} oyó sobre ${t}`),
};
export const EV_SPOT = {
  object: (t) => P(`Examine this: ${t}`, `Examina esto: ${t}`),
  document: (t) => P(`Read the notes: ${t}`, `Lee las notas: ${t}`),
  data: (t) => P(`Read the data card: ${t}`, `Lee la tarjeta de datos: ${t}`),
  audio: (t) => P(`Listen to the message: ${t}`, `Escucha el mensaje: ${t}`),
};

export function questionFor(t) {
  if (t.rival)
    return P(
      `What did people think about the ${t.term} at first?`,
      `¿Qué pensaba la gente al principio sobre "${t.term}"?`,
    );
  if (t.id === "t-words")
    return P(
      `What does the word "${t.term}" mean here?`,
      `¿Qué significa aquí la palabra "${t.term}"?`,
    );
  if (t.id === "t-before") return P("What was this place like before?", "¿Cómo era este lugar antes?");
  if (t.id === "t-after")
    return P(`What happened in the end with the ${t.term}?`, `¿Qué pasó al final con "${t.term}"?`);
  if (t.cause || t.id === "t-how")
    return P(
      `How do you explain what happened to the ${t.term}?`,
      `¿Cómo explicas lo que pasó con "${t.term}"?`,
    );
  if (t.numbers)
    return P(
      `What do the numbers show about the ${t.term}?`,
      `¿Qué muestran los números sobre "${t.term}"?`,
    );
  return P(`What can you tell me about the ${t.term}?`, `¿Qué me puedes decir sobre "${t.term}"?`);
}


export const SPOT_XY = [
  [18, 62],
  [50, 44],
  [80, 60],
  [34, 26],
  [66, 24],
  [50, 78],
  [14, 30],
  [86, 32],
];
export const TASK_SPOT = {
  "t-compare": P("Compare two pieces of evidence", "Compara dos evidencias"),
  "t-decide": P("Decide which explanation fits", "Decide qué explicación es correcta"),
  "t-speak": P("Explain it aloud", "Explícalo en voz alta"),
  "t-write": P("Write your recommendation", "Escribe tu recomendación"),
  "t-revise": P("Revise your recommendation", "Revisa tu recomendación"),
  "t-transfer": P("Try a new case on your own", "Prueba un caso nuevo sin ayuda"),
};

