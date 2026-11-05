// Science Investigation Lab: the questions the checks ask. One entry per note id, English and Spanish.
// An ask is always a question that points at the part to work on. It never states the answer, a score or a level.
// Tokens in braces are filled by the engine from the learner's own choices or from the case's own labels.
// Spanish is machine-assisted and has not been reviewed by a person.

export const ASKS = {
  // question
  "q-empty": {
    en: "What do you wonder about this phenomenon? Can you write it as one question?",
    es: "¿Qué te preguntas sobre este fenómeno? ¿Puedes escribirlo como una pregunta?",
  },
  "q-not-question": {
    en: "Is this sentence a question? How could you begin it so it asks about something you can test?",
    es: "¿Esta oración es una pregunta? ¿Cómo podrías empezarla para que pregunte algo que se pueda comprobar?",
  },
  "q-opinion": {
    en: "Could two people with different tastes both be right about this? What could a test show instead?",
    es: "¿Dos personas con gustos diferentes podrían tener razón en esto? ¿Qué podría mostrar una prueba en su lugar?",
  },
  "q-yes-no": {
    en: "Could a test answer this with a number or a comparison, not only yes or no? How would you reword it?",
    es: "¿Podría una prueba responder esto con un número o una comparación, y no solo con sí o no? ¿Cómo lo reformularías?",
  },
  "q-no-variable": {
    en: "Which thing in this investigation can you change on purpose? Where is it in your question?",
    es: "¿Qué cosa de esta investigación puedes cambiar a propósito? ¿Dónde está en tu pregunta?",
  },
  "q-no-measure": {
    en: "What will you measure or compare to answer your question? Where is that in your question?",
    es: "¿Qué vas a medir o comparar para responder tu pregunta? ¿Dónde está eso en tu pregunta?",
  },
  // hypothesis
  "h-empty": {
    en: "What do you think will happen, and why? Can you write it as a prediction?",
    es: "¿Qué crees que va a pasar, y por qué? ¿Puedes escribirlo como una predicción?",
  },
  "h-no-structure": {
    en: "Can you write it so one part says what you will change and another part says what you think will happen?",
    es: "¿Puedes escribirlo de modo que una parte diga qué vas a cambiar y otra diga qué crees que va a pasar?",
  },
  "h-no-variable": {
    en: "Which part of the investigation will you change in this prediction? Where is it in your sentence?",
    es: "¿Qué parte de la investigación vas a cambiar en esta predicción? ¿Dónde está en tu oración?",
  },
  "h-no-direction": {
    en: "Which way do you think the {measure} will move when that part changes? Where does your sentence say so?",
    es: "¿En qué dirección crees que cambiará {measure} cuando esa parte cambie? ¿Dónde lo dice tu oración?",
  },
  // plan
  "p-empty": {
    en: "What will you change, what will you keep the same, and what will you measure?",
    es: "¿Qué vas a cambiar, qué vas a mantener igual y qué vas a medir?",
  },
  "p-change-none": {
    en: "Which one thing will you change on purpose?",
    es: "¿Qué una cosa vas a cambiar a propósito?",
  },
  "p-change-many": {
    en: "Your plan changes {n} things at once. If the result is different, how would you know which one caused it?",
    es: "Tu plan cambia {n} cosas a la vez. Si el resultado es diferente, ¿cómo sabrías cuál lo causó?",
  },
  "p-hold-missing": {
    en: 'What will you do to keep "{variable}" the same in every test?',
    es: "¿Qué vas a hacer para mantener «{variable}» igual en todas las pruebas?",
  },
  "p-hold-changed": {
    en: 'You marked "{variable}" as both changed and kept the same. Which one do you mean?',
    es: "Marcaste «{variable}» como cambiada y como igual. ¿Cuál quieres decir?",
  },
  "p-measure-missing": {
    en: "What will you measure or count to compare the tests?",
    es: "¿Qué vas a medir o contar para comparar las pruebas?",
  },
  "p-measure-vague": {
    en: "How exactly will you measure it? What will you count or time, and in what unit?",
    es: "¿Cómo exactamente lo vas a medir? ¿Qué vas a contar o cronometrar, y en qué unidad?",
  },
  "p-trials-few": {
    en: "How many times will you run each test, and how would repeating help you trust the result?",
    es: "¿Cuántas veces vas a hacer cada prueba, y cómo te ayudaría repetirla a confiar en el resultado?",
  },
  // claim
  "c-empty": {
    en: "What is your answer to the investigation question? Can you write it as one sentence?",
    es: "¿Cuál es tu respuesta a la pregunta de la investigación? ¿Puedes escribirla en una oración?",
  },
  "c-off-question": {
    en: 'The question is about "{focus}". Which one does your claim point to?',
    es: "La pregunta trata de «{focus}». ¿A cuál apunta tu afirmación?",
  },
  "c-no-condition": {
    en: "Which conditions from the test are you comparing? Where does your claim name them?",
    es: "¿Qué condiciones de la prueba estás comparando? ¿Dónde las nombra tu afirmación?",
  },
  "c-no-compare": {
    en: "Compared with what? Where does your claim say how the conditions differ?",
    es: "¿Comparado con qué? ¿Dónde dice tu afirmación en qué se diferencian las condiciones?",
  },
  "c-no-outcome": {
    en: "What result is your claim about? Where does it name what was measured?",
    es: "¿De qué resultado trata tu afirmación? ¿Dónde nombra lo que se midió?",
  },
  "c-data-check": {
    en: 'Look at the {measure} for each {focus} in the table. Does the one in your claim have the result you describe?',
    es: "Mira {measure} para cada {focus} en la tabla. ¿El que está en tu afirmación tiene el resultado que describes?",
  },
  // reasoning
  "r-empty": {
    en: "How do your chosen rows show that your claim is true? Can you write that in a sentence?",
    es: "¿Cómo muestran tus filas elegidas que tu afirmación es cierta? ¿Puedes escribirlo en una oración?",
  },
  "r-no-claim": {
    en: "Which claim is this reasoning supporting? Can you write the claim first?",
    es: "¿Qué afirmación apoya este razonamiento? ¿Puedes escribir primero la afirmación?",
  },
  "r-no-evidence": {
    en: "Which rows of the table support your claim? Can you select at least one?",
    es: "¿Qué filas de la tabla apoyan tu afirmación? ¿Puedes seleccionar al menos una?",
  },
  "r-evidence-unrelated": {
    en: 'Your claim talks about "{a}". Which of the rows you chose shows that condition?',
    es: "Tu afirmación habla de «{a}». ¿Cuál de las filas que elegiste muestra esa condición?",
  },
  "r-evidence-one-side": {
    en: 'Your claim compares "{a}" and "{b}". Which row shows the other one?',
    es: "Tu afirmación compara «{a}» y «{b}». ¿Qué fila muestra la otra?",
  },
  "r-no-link": {
    en: "Which word or phrase connects your evidence to your claim? Where does your sentence show that link?",
    es: "¿Qué palabra o frase conecta tu evidencia con tu afirmación? ¿Dónde muestra tu oración ese vínculo?",
  },
  "r-link-not-tied": {
    en: "This sentence has a linking word. What exactly does it connect: which evidence, and which claim?",
    es: "Esta oración tiene una palabra de enlace. ¿Qué conecta exactamente: qué evidencia y qué afirmación?",
  },
  "r-number-not-in-data": {
    en: 'Where in the table does "{number}" come from? Did you calculate it from the rows, or should it match one of them?',
    es: "¿De dónde sale «{number}» en la tabla? ¿Lo calculaste con las filas, o debería coincidir con una de ellas?",
  },
  "r-no-number": {
    en: "Which number from your selected rows shows the difference you are describing?",
    es: "¿Qué número de tus filas seleccionadas muestra la diferencia que describes?",
  },
  // revision
  "v-no-change": {
    en: "What did you change after reading the questions? Which question did the change answer?",
    es: "¿Qué cambiaste después de leer las preguntas? ¿Qué pregunta respondió ese cambio?",
  },
};

/** The ask for a note id in `lang` ("en" or "es"; anything else is English), tokens filled from `vars`. */
export function ask(id, lang, vars = {}) {
  const entry = ASKS[id];
  if (!entry) return "";
  const tpl = lang === "es" ? entry.es : entry.en;
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
