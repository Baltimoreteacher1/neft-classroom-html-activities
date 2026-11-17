// Authored wording for the Language Intelligence Engine: every sentence a learner reads in a feedback result comes
// from this file, in English and Spanish ([en, es]; tú for students). The engine only chooses which entry applies and
// attaches a quote from the learner's own text. Nothing here names a score, a level or a proficiency, and nothing
// judges whether an idea is true: the wording says what is on the page and one thing to try next.

/** Key Language Use moves (ids from src/lang/purpose.js MOVES). did = strength, todo = next step, frame = scaffold. */
export const MOVE_TEXT = Object.freeze({
  "Narrate:orient": {
    did: [
      "You set the scene, so a reader knows when or where this happens.",
      "Presentas la escena, así quien lee sabe cuándo o dónde pasa.",
    ],
    todo: [
      "Set the scene: say when and where this happens, and who is there.",
      "Presenta la escena: di cuándo y dónde pasa, y quién está.",
    ],
    why: [
      "A reader who knows the time and place can picture your story from the first sentence.",
      "Quien conoce el momento y el lugar puede imaginar tu historia desde la primera oración.",
    ],
    frame: "One day, at ___, ___.",
  },
  "Narrate:sequence": {
    did: [
      "You use time words to put the events in order.",
      "Usas palabras de tiempo para poner los hechos en orden.",
    ],
    todo: [
      "Add time words (first, then, finally) so the order of events is clear.",
      "Agrega palabras de tiempo (first, then, finally) para que el orden de los hechos quede claro.",
    ],
    why: [
      "Time words let a listener follow what happened first, next and last.",
      "Las palabras de tiempo ayudan a seguir qué pasó primero, después y al final.",
    ],
    frame: "First, ___. Then, ___. Finally, ___.",
  },
  "Narrate:events": {
    did: [
      "You tell what happened with action verbs in the past.",
      "Cuentas lo que pasó con verbos de acción en pasado.",
    ],
    todo: [
      "Tell what the people did, using action verbs in the past.",
      "Cuenta qué hicieron las personas, con verbos de acción en pasado.",
    ],
    why: [
      "Action verbs move a story forward, one event at a time.",
      "Los verbos de acción hacen avanzar la historia, un hecho a la vez.",
    ],
    frame: "___ opened ___ and ___.",
  },
  "Narrate:response": {
    did: ["You show how it ended or what it meant.", "Muestras cómo terminó o qué significó."],
    todo: [
      "End by showing how it finished or what it meant to you.",
      "Termina mostrando cómo acabó o qué significó para ti.",
    ],
    why: [
      "An ending tells the reader why the story matters.",
      "Un final le dice al lector por qué importa la historia.",
    ],
    frame: "In the end, ___.",
  },
  "Inform:topic": {
    did: ["You name your topic and say what it is.", "Nombras tu tema y dices qué es."],
    todo: [
      "Start by naming your topic and saying what kind of thing it is.",
      "Empieza nombrando tu tema y diciendo qué tipo de cosa es.",
    ],
    why: [
      "When the topic is named first, every detail after it makes sense.",
      "Cuando el tema se nombra primero, cada detalle que sigue tiene sentido.",
    ],
    frame: "___ is a kind of ___ that ___.",
  },
  "Inform:details": {
    did: [
      "You give specific details, such as a number or an example.",
      "Das detalles específicos, como un número o un ejemplo.",
    ],
    todo: [
      "Add one exact detail: a number, a name or an example.",
      "Agrega un detalle exacto: un número, un nombre o un ejemplo.",
    ],
    why: [
      "Exact details help a reader picture what you mean.",
      "Los detalles exactos ayudan a imaginar lo que quieres decir.",
    ],
    frame: "For example, ___.",
  },
  "Inform:organize": {
    did: [
      "You use signal words to group your ideas.",
      "Usas palabras señal para agrupar tus ideas.",
    ],
    todo: [
      "Add a signal word (also, another, for example) to show how your details connect.",
      "Agrega una palabra señal (also, another, for example) para mostrar cómo se conectan tus detalles.",
    ],
    why: [
      "Signal words tell a reader which details belong together.",
      "Las palabras señal le dicen al lector qué detalles van juntos.",
    ],
    frame: "One ___ is ___. Another ___ is ___.",
  },
  "Inform:close": {
    did: ["You wrap up your main point at the end.", "Cierras tu idea principal al final."],
    todo: [
      "End with one sentence that says the main thing to remember.",
      "Termina con una oración que diga lo más importante que hay que recordar.",
    ],
    why: [
      "A closing sentence leaves the reader holding your main point.",
      "Una oración de cierre deja al lector con tu idea principal.",
    ],
    frame: "Overall, ___.",
  },
  "Explain:phenomenon": {
    did: [
      "You say what you are explaining right at the start.",
      "Dices qué estás explicando desde el principio.",
    ],
    todo: [
      "Start by saying exactly what you are explaining.",
      "Empieza diciendo exactamente qué estás explicando.",
    ],
    why: [
      "A listener follows an explanation more easily when they know what it is about.",
      "Es más fácil seguir una explicación cuando se sabe de qué trata.",
    ],
    frame: "This explains why ___.",
  },
  "Explain:cause": {
    did: [
      "You link a cause to an effect with a cause word.",
      "Unes una causa con un efecto usando una palabra de causa.",
    ],
    todo: [
      "Link the cause and the effect with a word like because or so.",
      "Une la causa y el efecto con una palabra como because o so.",
    ],
    why: [
      "Cause words show how one thing leads to another. That link is what makes it an explanation.",
      "Las palabras de causa muestran cómo una cosa lleva a otra. Esa unión es lo que lo hace una explicación.",
    ],
    frame: "___ because ___.",
  },
  "Explain:chain": {
    did: ["You connect more than one step.", "Conectas más de un paso."],
    todo: [
      "Add the next step: what happens after that?",
      "Agrega el paso siguiente: ¿qué pasa después?",
    ],
    why: [
      "Naming each step lets a reader follow the whole process, not only the start.",
      "Nombrar cada paso permite seguir todo el proceso, no solo el comienzo.",
    ],
    frame: "As a result, ___.",
  },
  "Explain:support": {
    did: ["You point to a fact, a number or a source.", "Señalas un dato, un número o una fuente."],
    todo: [
      "Add one fact, number or source that goes with your explanation.",
      "Agrega un dato, un número o una fuente que acompañe tu explicación.",
    ],
    why: [
      "A fact or a source shows the reader where your explanation comes from.",
      "Un dato o una fuente le muestra al lector de dónde viene tu explicación.",
    ],
    frame: "According to ___, ___.",
  },
  "Argue:claim": {
    did: ["You state your position.", "Dices tu posición."],
    todo: ["State your position in one clear sentence.", "Di tu posición en una oración clara."],
    why: [
      "A reader has to know what you think before they can follow your reasons.",
      "El lector necesita saber qué piensas antes de seguir tus razones.",
    ],
    frame: "I believe ___.",
  },
  "Argue:reason": {
    did: ["You give a reason for your position.", "Das una razón para tu posición."],
    todo: [
      "Give a reason for your position. Try: I think this because ...",
      "Da una razón para tu posición. Prueba: I think this because ...",
    ],
    why: [
      "A reason turns an opinion into an argument someone can consider.",
      "Una razón convierte una opinión en un argumento que alguien puede considerar.",
    ],
    frame: "I believe ___ because ___.",
  },
  "Argue:evidence": {
    did: [
      "You use a fact, a number or a source as evidence.",
      "Usas un dato, un número o una fuente como evidencia.",
    ],
    todo: [
      "Add one fact, number or sentence from the source as evidence.",
      "Agrega como evidencia un dato, un número o una oración de la fuente.",
    ],
    why: [
      "Evidence shows the reader that your reason rests on more than your word.",
      "La evidencia le muestra al lector que tu razón se apoya en algo más que tu palabra.",
    ],
    frame: "According to ___, ___. This shows that ___.",
  },
  "Argue:counter": {
    did: ["You consider another point of view.", "Consideras otro punto de vista."],
    todo: [
      "Say what someone who disagrees might think, then answer them.",
      "Di qué podría pensar alguien que no está de acuerdo y luego respóndele.",
    ],
    why: [
      "Answering another view shows you have thought about more than one side.",
      "Responder a otra opinión muestra que pensaste en más de un lado.",
    ],
    frame: "Although some people say ___, ___.",
  },
  "Argue:restate": {
    did: ["You end by coming back to your position.", "Terminas volviendo a tu posición."],
    todo: [
      "End by reminding the reader of your position.",
      "Termina recordándole al lector tu posición.",
    ],
    why: [
      "Ending on your position leaves no doubt about what you are asking for.",
      "Terminar con tu posición no deja dudas sobre lo que pides.",
    ],
    frame: "For these reasons, ___.",
  },
});

/** Other strengths the engine can name (each needs a quote from the response to be shown). */
export const STRENGTH_TEXT = Object.freeze({
  links: ["You link your ideas in more than one way.", "Unes tus ideas de más de una manera."],
  source: [
    "You point to the source to support what you say.",
    "Señalas la fuente para apoyar lo que dices.",
  ],
  complex: [
    "You hold two ideas together in one sentence.",
    "Mantienes dos ideas juntas en una sola oración.",
  ],
  "noun-phrase": [
    "You pack detail into a group of words around a noun.",
    "Pones detalle en un grupo de palabras alrededor de un sustantivo.",
  ],
  "subject-words": ["You use exact subject words.", "Usas palabras exactas de la materia."],
  "own-words": [
    "You put your idea into your own words. That is where every strong response starts.",
    "Pones tu idea en tus propias palabras. Así empieza toda buena respuesta.",
  ],
  none: [
    "There are no words here yet, so there is nothing to describe.",
    "Todavía no hay palabras aquí, así que no hay nada que describir.",
  ],
});

/**
 * Next steps that are not a missing move. `dim` is the WIDA dimension; `scaffold` is optional help for the revision.
 * A next step is one thing to try, never a list of corrections.
 */
export const STEP_TEXT = Object.freeze({
  start: {
    dim: "discourse",
    text: [
      "Say or write your first idea in one sentence.",
      "Di o escribe tu primera idea en una oración.",
    ],
    why: [
      "One sentence is enough to begin. You can build on it.",
      "Una oración basta para empezar. Después puedes ampliarla.",
    ],
    scaffold: null,
  },
  develop: {
    dim: "discourse",
    text: [
      "Say more about your idea: add a reason, a detail or an example.",
      "Di más sobre tu idea: agrega una razón, un detalle o un ejemplo.",
    ],
    why: [
      "One more detail helps a listener understand exactly what you mean.",
      "Un detalle más ayuda a entender exactamente lo que quieres decir.",
    ],
    scaffold: { kind: "frame", frame: "___ because ___. For example, ___." },
  },
  "use-source": {
    dim: "discourse",
    text: [
      "Point to one exact fact, number or phrase from the source.",
      "Señala un dato, un número o una frase exacta de la fuente.",
    ],
    why: [
      "Words from the source show the reader where your idea comes from.",
      "Las palabras de la fuente le muestran al lector de dónde viene tu idea.",
    ],
    scaffold: { kind: "frame", frame: "According to ___, ___. This shows that ___." },
  },
  "check-number": {
    dim: "discourse",
    text: [
      "Check this number against the source. Does it match, or did you work it out yourself?",
      "Compara este número con la fuente. ¿Coincide, o lo calculaste tú?",
    ],
    why: [
      "A reader trusts a number more when they can find where it came from.",
      "El lector confía más en un número cuando puede ver de dónde salió.",
    ],
    scaffold: null,
  },
  "link-ideas": {
    dim: "discourse",
    text: [
      "Choose two sentences that sit next to each other and show how they connect.",
      "Elige dos oraciones que estén juntas y muestra cómo se conectan.",
    ],
    why: [
      "A linking word tells the reader whether the next idea is a cause, a contrast or an example.",
      "Una palabra de enlace le dice al lector si la idea siguiente es una causa, un contraste o un ejemplo.",
    ],
    scaffold: { kind: "connector", words: "because · so · however · for example" },
  },
  combine: {
    dim: "sentence",
    text: [
      "Join two of your sentences into one with a word like because, although or but.",
      "Une dos de tus oraciones en una con una palabra como because, although o but.",
    ],
    why: [
      "Joining two ideas shows the reader how they are related.",
      "Unir dos ideas le muestra al lector cómo se relacionan.",
    ],
    scaffold: { kind: "connector", words: "because · although · but · so" },
  },
  "vary-openers": {
    dim: "sentence",
    text: [
      "Start one sentence in a different way, with a time, a place or a reason.",
      "Empieza una oración de otra manera: con un tiempo, un lugar o una razón.",
    ],
    why: [
      "A different beginning helps the reader notice a new idea.",
      "Un comienzo distinto ayuda al lector a notar una idea nueva.",
    ],
    scaffold: { kind: "frame", frame: "After ___, ___. / Because ___, ___." },
  },
  "precise-words": {
    dim: "word",
    text: [
      "Pick one broad word and choose a more exact word for what you mean.",
      "Elige una palabra general y cámbiala por una más exacta para lo que quieres decir.",
    ],
    why: [
      "An exact word lets the reader see the same thing you see.",
      "Una palabra exacta permite que el lector vea lo mismo que tú.",
    ],
    scaffold: { kind: "word" },
  },
  expand: {
    dim: "sentence",
    text: [
      "Choose one sentence and add when, where or why to it.",
      "Elige una oración y agrégale cuándo, dónde o por qué.",
    ],
    why: [
      "A little more information in one sentence makes your idea easier to picture.",
      "Un poco más de información en una oración hace tu idea más fácil de imaginar.",
    ],
    scaffold: { kind: "connector", words: "when · where · because · so that" },
  },
  fix: {
    dim: "sentence",
    text: [
      "One pattern to check here: {name}. Read the marked words aloud and decide what you want to change.",
      "Un patrón para revisar aquí: {name}. Lee en voz alta las palabras marcadas y decide qué quieres cambiar.",
    ],
    why: [
      "This is one pattern, not a list of mistakes. Your meaning is already clear; this makes it easier to read.",
      "Es un solo patrón, no una lista de errores. Tu significado ya se entiende; esto lo hace más fácil de leer.",
    ],
    scaffold: null,
  },
});

/** Plain names for the error patterns (ids from src/lang/errors.js). Used inside the single "fix" next step. */
export const PATTERN_TEXT = Object.freeze({
  "sv-agree-3sg": [
    "he / she / it + a verb that ends in -s",
    "he / she / it + un verbo que termina en -s",
  ],
  "be-agree": [
    "the form of 'be' that matches the subject",
    "la forma de 'be' que corresponde al sujeto",
  ],
  "past-marker": [
    "a past-tense verb after a past-time word",
    "un verbo en pasado después de una palabra de tiempo pasado",
  ],
  "irregular-ed": ["an irregular past-tense verb", "un verbo irregular en pasado"],
  "plural-after-number": [
    "-s on a noun after a number",
    "-s en un sustantivo después de un número",
  ],
  "much-many": ["much or many", "much o many"],
  "article-a-an": ["a or an", "a o an"],
  "comparative-form": [
    "the comparing form of a word (-er, more)",
    "la forma de comparar de una palabra (-er, more)",
  ],
  "missing-expletive": [
    "a sentence that needs 'it' or 'there'",
    "una oración que necesita 'it' o 'there'",
  ],
  "double-negative": ["two negative words in one idea", "dos palabras negativas en una idea"],
  "modal-form": [
    "the verb form after can, should or must",
    "la forma del verbo después de can, should o must",
  ],
  "do-support": ["do / does / did + the base verb", "do / does / did + el verbo base"],
  "question-order": ["the word order of a question", "el orden de las palabras en una pregunta"],
  "capital-punct": ["capital letters and end punctuation", "mayúsculas y puntuación final"],
  "confused-word": ["two words that sound alike", "dos palabras que suenan igual"],
  "preposition-choice": [
    "the small word after a verb or before a time (in, on, at)",
    "la palabra pequeña después de un verbo o antes de un tiempo (in, on, at)",
  ],
  "l1-collocation": [
    "a verb and noun pair that English says another way",
    "un par de verbo y sustantivo que el inglés dice de otra manera",
  ],
  "adjective-agreement": ["a describing word with no -s", "una palabra que describe sin -s"],
  "adjective-position": [
    "the describing word before the noun",
    "la palabra que describe antes del sustantivo",
  ],
  "connector-form": [
    "two joining words that do not fit together",
    "dos palabras de enlace que no van juntas",
  ],
  "common-misspelling": ["the spelling of one word", "la ortografía de una palabra"],
  "missing-be": ["am / is / are in the sentence", "am / is / are en la oración"],
});

/** Observations by WIDA dimension. Each is shown only with a quote from the response. */
export const OBS_TEXT = Object.freeze({
  // discourse
  coherence: [
    "Linking words connect one idea to the next.",
    "Las palabras de enlace conectan una idea con la siguiente.",
  ],
  sequencing: [
    "Order words show what comes first and what follows.",
    "Las palabras de orden muestran qué va primero y qué sigue.",
  ],
  elaboration: [
    "A detail or an example develops the idea.",
    "Un detalle o un ejemplo desarrolla la idea.",
  ],
  "evidence-integration": [
    "Words that point to a source bring evidence into the response.",
    "Las palabras que señalan una fuente traen evidencia a la respuesta.",
  ],
  "audience-purpose": [
    "A stance phrase tells the reader what you think.",
    "Una frase de opinión le dice al lector lo que piensas.",
  ],
  // sentence
  construction: [
    "This sentence holds more than one idea.",
    "Esta oración contiene más de una idea.",
  ],
  "clause-relationship": [
    "This word joins a reason, a condition or a time to the main idea.",
    "Esta palabra une una razón, una condición o un tiempo con la idea principal.",
  ],
  connectives: ["This sentence joins two complete ideas.", "Esta oración une dos ideas completas."],
  expansion: [
    "These words add detail around a noun.",
    "Estas palabras agregan detalle alrededor de un sustantivo.",
  ],
  // word / phrase
  "academic-expression": [
    "A school word used to explain or describe.",
    "Una palabra escolar que se usa para explicar o describir.",
  ],
  "content-term": [
    "A subject word that belongs to this topic.",
    "Una palabra de la materia que pertenece a este tema.",
  ],
  precision: ["A word taken from the source.", "Una palabra tomada de la fuente."],
  "word-choice": [
    "This word is broad. Is there a more exact word for what you mean?",
    "Esta palabra es general. ¿Hay una palabra más exacta para lo que quieres decir?",
  ],
  morphology: [
    "A longer word built from word parts.",
    "Una palabra más larga formada con partes de palabras.",
  ],
});

export const UNCERTAINTY_TEXT = Object.freeze({
  none: ["", ""],
  short: [
    "This response is short, so the feedback looks only at what is here. Say more and there will be more to notice.",
    "Esta respuesta es corta, así que los comentarios solo miran lo que hay. Di más y habrá más que notar.",
  ],
  transcript: [
    "These words came from speech recognition, which can mishear. Fix any words it got wrong first. Spelling, capital letters and punctuation are not checked for speech, and the way you sound is never judged.",
    "Estas palabras vienen del reconocimiento de voz, que puede oír mal. Primero corrige las palabras que entendió mal. En el habla no se revisan la ortografía, las mayúsculas ni la puntuación, y nunca se juzga cómo suenas.",
  ],
  "transcript-short": [
    "These words came from speech recognition, which can mishear. Fix any words it got wrong first. The response is also short, so the feedback looks only at what is here. The way you sound is never judged.",
    "Estas palabras vienen del reconocimiento de voz, que puede oír mal. Primero corrige las palabras que entendió mal. La respuesta también es corta, así que los comentarios solo miran lo que hay. Nunca se juzga cómo suenas.",
  ],
});

export const REVISION_TEXT = Object.freeze({
  lead: [
    "Revise your response. Keep your ideas and your own words.",
    "Revisa tu respuesta. Conserva tus ideas y tus propias palabras.",
  ],
  start: [
    "Write or say your idea, then come back to it.",
    "Escribe o di tu idea y luego vuelve a ella.",
  ],
});

/** What changed between two pieces of work (compareWork). Never "longer is better". */
export const CHANGE_TEXT = Object.freeze({
  move: [
    "Organization: this now does a job the first one did not.",
    "Organización: ahora cumple una función que la primera versión no cumplía.",
  ],
  links: [
    "Clarity: a new linking word shows how ideas connect.",
    "Claridad: una nueva palabra de enlace muestra cómo se conectan las ideas.",
  ],
  specific: [
    "Specificity: a broad word gave way to a more exact one.",
    "Precisión: una palabra general dio paso a una más exacta.",
  ],
  "subject-words": [
    "Specificity: a new subject word appears.",
    "Precisión: aparece una nueva palabra de la materia.",
  ],
  source: ["Specificity: this now points to the source.", "Precisión: ahora señala la fuente."],
  combined: [
    "Clarity: two ideas are now joined in one sentence.",
    "Claridad: ahora dos ideas están unidas en una oración.",
  ],
  control: [
    "Language control: a pattern from the first version is no longer there.",
    "Control del lenguaje: un patrón de la primera versión ya no aparece.",
  ],
  "kept-move": [
    "Kept: this job is done in both versions.",
    "Se mantiene: esta función está en las dos versiones.",
  ],
  "kept-sentence": [
    "Kept: this sentence is the same in both versions.",
    "Se mantiene: esta oración es igual en las dos versiones.",
  ],
});

export const CAUTION_TEXT = Object.freeze({
  same: [
    "The two versions are the same, so there is nothing to compare yet.",
    "Las dos versiones son iguales, así que todavía no hay nada que comparar.",
  ],
  empty: [
    "One of the versions has no words, so there is nothing to compare.",
    "Una de las versiones no tiene palabras, así que no hay nada que comparar.",
  ],
  length: [
    "The length changed, but length alone does not make a response clearer. Look at what the new words do.",
    "Cambió el largo, pero el largo por sí solo no hace más clara una respuesta. Mira qué hacen las palabras nuevas.",
  ],
  lost: [
    "Something the first version did is missing now. Check that an idea was not lost.",
    "Falta algo que hacía la primera versión. Revisa que no se haya perdido una idea.",
  ],
  "new-pattern": [
    "A new pattern to check appeared in the new version. Read it aloud once more.",
    "En la nueva versión apareció un patrón para revisar. Léela en voz alta una vez más.",
  ],
  context: [
    "These two pieces answer different tasks, so compare the language moves, not the topics.",
    "Estos dos trabajos responden a tareas distintas, así que compara los recursos del lenguaje, no los temas.",
  ],
});
