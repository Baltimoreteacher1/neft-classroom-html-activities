// Sentence Lab content: shared rule tables, Spanish contrast notes, and the task index.
// The two band files hold the tasks as compact rows; unpackTasks turns each row into an object.
//
// Annotated sentence text (see src/lang/craft-sentence.js for the parser):
//   S[ ] subject · V[ ] verb phrase · O[ ] object or complement · M[ ] details (how, where, when, why)
//   R[ ] describing clause (who, which, that) · word/pos tags the part of speech (n v a r d p q c)
//   word/c = and, but, or, so · word/sc = because, although, when, if, after ... · , . ? ! ; are their own tiles
// Task rows (the band comes from the file):
//   ["b", level, annotated sentence, contrastCode?, [alternate plain sentences]?]   build
//   ["c", level, "Sentence one. / Sentence two.", annotated sentence, hint]        combine
//   ["e", level, "base sentence", "what to add", annotated sentence]              expand
//   ["s", level, "sentence with one error", "word positions that are wrong", ruleCode]   spot
//   ["f", level, "sentence with an error", "right", "wrong 1", "wrong 2", ruleCode]     fix
import { BOSS_35, ROWS_35 } from "./craft-sentences-35.js";
import { BOSS_68, ROWS_68 } from "./craft-sentences-68.js";

const P = (en, es) => ({ en, es });

/** Part-of-speech colors and names (tiles also carry the letter, so color is never the only signal). */
export const POS = {
  n: { en: "noun", es: "sustantivo", key: "N" },
  v: { en: "verb", es: "verbo", key: "V" },
  a: { en: "adjective", es: "adjetivo", key: "Adj" },
  r: { en: "adverb", es: "adverbio", key: "Adv" },
  d: { en: "article or determiner", es: "artículo o determinante", key: "Det" },
  p: { en: "preposition", es: "preposición", key: "Prep" },
  q: { en: "pronoun", es: "pronombre", key: "Pro" },
  c: { en: "joining word", es: "palabra que une", key: "Join" },
};
/** Sentence parts (the machine's slots). */
export const ROLE = {
  S: { en: "Subject", es: "Sujeto", ask: P("who or what?", "¿quién o qué?") },
  V: { en: "Verb", es: "Verbo", ask: P("what happens?", "¿qué pasa?") },
  O: { en: "Object or more", es: "Objeto o más", ask: P("what or whom?", "¿qué o a quién?") },
  M: {
    en: "Details",
    es: "Detalles",
    ask: P("how, where, when, why?", "¿cómo, dónde, cuándo, por qué?"),
  },
  R: { en: "Describing clause", es: "Cláusula descriptiva", ask: P("which one?", "¿cuál?") },
  C: { en: "Joiner", es: "Unión", ask: P("joins ideas", "une ideas") },
  P: { en: "Punctuation", es: "Puntuación", ask: P("marks the ending", "marca el final") },
};
export const LEVELS = [
  {
    n: 1,
    en: "Simple sentences",
    es: "Oraciones simples",
    goal: P(
      "Build a sentence with a subject and a verb.",
      "Construye una oración con sujeto y verbo.",
    ),
  },
  {
    n: 2,
    en: "Expanding with details",
    es: "Ampliar con detalles",
    goal: P("Add describing words and details.", "Agrega palabras descriptivas y detalles."),
  },
  {
    n: 3,
    en: "Compound sentences",
    es: "Oraciones compuestas",
    goal: P(
      "Join two ideas with a comma and and, but, or so.",
      "Une dos ideas con una coma y and, but, or o so.",
    ),
  },
  {
    n: 4,
    en: "Complex sentences",
    es: "Oraciones complejas",
    goal: P(
      "Add a because, when, if or although idea.",
      "Agrega una idea con because, when, if o although.",
    ),
  },
  {
    n: 5,
    en: "Compound-complex and describing clauses",
    es: "Compuestas-complejas y cláusulas descriptivas",
    goal: P(
      "Mix joined ideas with who, which and that.",
      "Combina ideas unidas con who, which y that.",
    ),
  },
];

/** Error rules used by the spot and fix tasks: [name, nameEs, rule, ruleEs, contrast note code]. */
const RULE_ROWS = {
  sva: [
    "Subject-verb agreement",
    "Concordancia sujeto-verbo",
    "With he, she, it, or one thing, the verb takes -s or -es: she likes, it doesn't, the boy has. With I, you, we, they: like, don't, have. Use was for I, he, she, it and were for you, we, they.",
    "Con he, she, it o una sola cosa, el verbo lleva -s o -es: she likes, it doesn't, the boy has. Con I, you, we, they: like, don't, have. Usa was con I, he, she, it y were con you, we, they.",
    "sva",
  ],
  tense: [
    "Past tense",
    "Tiempo pasado",
    "For finished actions, use the past form: walked, played, went, saw. Many common verbs are irregular and do not take -ed.",
    "Para acciones terminadas, usa la forma del pasado: walked, played, went, saw. Muchos verbos comunes son irregulares y no llevan -ed.",
    "tense",
  ],
  plural: [
    "Plural nouns",
    "Sustantivos en plural",
    "Add -s or -es to the noun when there is more than one: two dogs, many students. A few plurals are irregular: people, children, data. After words like two, many, few, the noun is plural.",
    "Agrega -s o -es al sustantivo cuando hay más de uno: two dogs, many students. Algunos plurales son irregulares: people, children, data. Después de palabras como two, many, few, el sustantivo va en plural.",
    "plural",
  ],
  adjpl: [
    "Adjectives stay the same",
    "Los adjetivos no cambian",
    "An adjective never takes -s in English: red cars, not reds cars. Only the noun shows more than one.",
    "En inglés el adjetivo nunca lleva -s: red cars, no reds cars. Solo el sustantivo muestra que hay más de uno.",
    "adjpl",
  ],
  art: [
    "Articles",
    "Artículos",
    "Use a or an before one thing that is not special yet: she is a teacher. Use an before a vowel sound: an umbrella. Use the for a specific thing. Do not use an article before plural general nouns: I like music.",
    "Usa a o an antes de una cosa que aún no es especial: she is a teacher. Usa an antes de un sonido de vocal: an umbrella. Usa the para algo específico. No uses artículo antes de sustantivos generales en plural: I like music.",
    "art",
  ],
  order: [
    "Word order",
    "Orden de las palabras",
    "The usual English order is subject, then verb, then the rest: Ana arrived early. The subject comes first.",
    "El orden habitual en inglés es sujeto, verbo y lo demás: Ana arrived early. El sujeto va primero.",
    "order",
  ],
  adjord: [
    "Where adjectives go",
    "Dónde van los adjetivos",
    "The adjective comes before the noun: a blue car, a cold day.",
    "El adjetivo va antes del sustantivo: a blue car, a cold day.",
    "adj",
  ],
  neg: [
    "Negatives",
    "Negaciones",
    "Use one negative idea per clause: I don't have any pencils or I have no pencils. Make a negative with don't, doesn't, or didn't plus the base verb.",
    "Usa una sola idea negativa por cláusula: I don't have any pencils o I have no pencils. Forma la negación con don't, doesn't o didn't más el verbo base.",
    "neg",
  ],
  subj: [
    "Every sentence needs a subject",
    "Toda oración necesita sujeto",
    "Say who or what, even with weather and time: It is raining. It is late. Do not repeat the subject twice either.",
    "Di quién o qué, incluso con el clima y la hora: It is raining. It is late. Tampoco repitas el sujeto dos veces.",
    "subj",
  ],
  be: [
    "Using be",
    "Uso de be",
    "English uses am, is, or are for age, feelings, and weather: She is ten years old. I am hungry. It is cold. Have does not work for these.",
    "El inglés usa am, is o are para la edad, los sentimientos y el clima: She is ten years old. I am hungry. It is cold. Have no funciona para esto.",
    "be",
  ],
  fanboys: [
    "Comma before and, but, or, so",
    "Coma antes de and, but, or, so",
    "When and, but, or, so joins two full sentences, put a comma before it: It was late, but we kept playing.",
    "Cuando and, but, or, so une dos oraciones completas, pon una coma antes: It was late, but we kept playing.",
    "",
  ],
  intro: [
    "Comma after an opening clause",
    "Coma después de una cláusula inicial",
    "When a sentence starts with because, although, when, if, after, or before, put a comma after that first idea: Because it rained, we stayed home.",
    "Cuando una oración empieza con because, although, when, if, after o before, pon una coma después de esa primera idea: Because it rained, we stayed home.",
    "",
  ],
  splice: [
    "Comma splice",
    "Coma de unión incorrecta",
    "A comma alone cannot join two full sentences. Add and, but, or so after the comma, or use a period or a semicolon.",
    "Una coma sola no puede unir dos oraciones completas. Agrega and, but, or o so después de la coma, o usa un punto o un punto y coma.",
    "",
  ],
  frag: [
    "Sentence fragment",
    "Fragmento de oración",
    "A complete sentence needs a subject, a verb, and a finished idea. “When I got home.” leaves the reader waiting for what happened.",
    "Una oración completa necesita sujeto, verbo y una idea terminada. “When I got home.” deja al lector esperando qué pasó.",
    "",
  ],
  runon: [
    "Run-on sentence",
    "Oración sin separar",
    "Two full sentences cannot run together. Join them with a comma and and, but, or so, or split them with a period.",
    "Dos oraciones completas no pueden ir juntas sin separar. Únelas con una coma y and, but, or o so, o sepáralas con un punto.",
    "",
  ],
  pron: [
    "Pronouns",
    "Pronombres",
    "Use I, he, she, we, they for the doer. Use me, him, her, us, them after a verb or preposition. When you name yourself with others, name yourself last: Ana and I.",
    "Usa I, he, she, we, they para quien hace la acción. Usa me, him, her, us, them después de un verbo o preposición. Cuando te nombras con otros, nómbrate al final: Ana and I.",
    "",
  ],
  prep: [
    "Prepositions of time and place",
    "Preposiciones de tiempo y lugar",
    "Use on for days (on Monday), in for months and years (in May), and at for clock times (at noon). Say walk home, not walk to home, and discuss the topic, not discuss about it. Use for with a length of time (for five years) and since with a starting point (since 2020). Say despite the rain, not despite of.",
    "Usa on para días (on Monday), in para meses y años (in May) y at para horas (at noon). Di walk home, no walk to home, y discuss the topic, no discuss about it. Usa for con una duración (for five years) y since con un punto de partida (since 2020). Di despite the rain, no despite of.",
    "prep",
  ],
  apos: [
    "Showing who owns something",
    "Mostrar de quién es algo",
    "Add 's to the owner: Maria's dog. Do not use of with a person's name, and do not use an apostrophe for a plain plural: two dogs.",
    "Agrega 's al dueño: Maria's dog. No uses of con el nombre de una persona y no uses apóstrofo en un plural simple: two dogs.",
    "poss",
  ],
  cap: [
    "Capital letters",
    "Letras mayúsculas",
    "Begin every sentence with a capital letter. The word I and names of people and places are always capital.",
    "Empieza cada oración con mayúscula. La palabra I y los nombres de personas y lugares siempre van con mayúscula.",
    "",
  ],
  hom: [
    "Look-alike words",
    "Palabras parecidas",
    "They're means they are, their shows ownership, and there points to a place. It's means it is; its shows ownership. You're means you are; your shows ownership. Who's means who is; whose shows ownership.",
    "They're significa they are, their muestra posesión y there señala un lugar. It's significa it is; its muestra posesión. You're significa you are; your muestra posesión. Who's significa who is; whose muestra posesión.",
    "",
  ],
  modal: [
    "Base verb after to, can, will",
    "Verbo base después de to, can, will",
    "After to, can, could, will, would, should, must, and didn't, use the plain verb: to read, she can swim, he didn't see.",
    "Después de to, can, could, will, would, should, must y didn't, usa el verbo simple: to read, she can swim, he didn't see.",
    "",
  ],
  comp: [
    "Comparing",
    "Comparar",
    "Short adjectives add -er: taller, faster. Long adjectives use more: more careful. Never use both. Use than for the second thing.",
    "Los adjetivos cortos agregan -er: taller, faster. Los largos usan more: more careful. Nunca uses los dos. Usa than para la segunda cosa.",
    "comp",
  ],
  qord: [
    "Question order",
    "Orden de las preguntas",
    "Put a helper such as do, does, did, is, can before the subject: Where do you live? The main verb stays in its base form.",
    "Pon un auxiliar como do, does, did, is, can antes del sujeto: Where do you live? El verbo principal queda en su forma base.",
    "qord",
  ],
  semi: [
    "Semicolon",
    "Punto y coma",
    "A semicolon joins two full sentences that are closely related. Do not use a comma alone, and do not put and right after the semicolon.",
    "Un punto y coma une dos oraciones completas muy relacionadas. No uses solo una coma ni pongas and justo después del punto y coma.",
    "",
  ],
  parallel: [
    "Parallel lists",
    "Listas paralelas",
    "Put list items in the same form: running, jumping, and swimming, not running, jump, and to swim.",
    "Pon los elementos de una lista en la misma forma: running, jumping y swimming, no running, jump y to swim.",
    "",
  ],
  shift: [
    "Keeping one tense",
    "Mantener un solo tiempo",
    "Keep one tense in a sentence unless time really changes: We opened the box and found a map.",
    "Mantén un solo tiempo en la oración a menos que el tiempo realmente cambie: We opened the box and found a map.",
    "tense",
  ],
  cond: ["If clauses", "Cláusulas con if", "After if, use the present tense for something that might happen: If it rains, we will stay home. Do not put will in the if part.", "Después de if, usa el presente para algo que podría pasar: If it rains, we will stay home. No pongas will en la parte con if.", "tense"],
  dconj: ["One joining word per idea", "Una sola palabra de unión por idea", "Do not start with although or because and then add but or so as well. Use the starter and a comma, or use but or so alone.", "No empieces con although o because y agregues además but o so. Usa el comienzo con una coma, o usa solo but o so.", ""],
  rel: [
    "Who, which, that",
    "Who, which, that",
    "Use who for people, which for things (with commas when it adds extra information), and that for things or people when it is needed to say which one.",
    "Usa who para personas, which para cosas (con comas cuando agrega información extra) y that para cosas o personas cuando es necesario para decir cuál.",
    "",
  ],
};
export const RULES = Object.fromEntries(
  Object.entries(RULE_ROWS).map(([id, [en, es, ruleEn, ruleEs, contrast]]) => [
    id,
    { id, name: P(en, es), rule: P(ruleEn, ruleEs), contrast },
  ]),
);

/** Spanish contrast notes: what Spanish does, what English does, and the error it can cause. */
const CONTRAST_ROWS = {
  adj: [
    "Adjective position",
    "Posición del adjetivo",
    "In Spanish the adjective usually follows the noun: la casa blanca. In English it comes before the noun.",
    "En español el adjetivo suele ir después del sustantivo: la casa blanca. En inglés va antes del sustantivo.",
    "la casa blanca",
    "the white house",
    "the house white",
  ],
  adjpl: [
    "Adjectives and plurals",
    "Adjetivos y plurales",
    "Spanish adjectives change for plural: coches rojos. English adjectives never change: red cars.",
    "Los adjetivos en español cambian en plural: coches rojos. Los adjetivos en inglés nunca cambian: red cars.",
    "coches rojos",
    "red cars",
    "reds cars",
  ],
  art: [
    "Articles",
    "Artículos",
    "Spanish uses el, la, los, las with general ideas (Me gusta la música) and drops the article for jobs (Es maestra). English does the opposite: I like music. She is a teacher.",
    "El español usa el, la, los, las con ideas generales (Me gusta la música) y omite el artículo con profesiones (Es maestra). El inglés hace lo contrario: I like music. She is a teacher.",
    "Es maestra.",
    "She is a teacher.",
    "She is teacher.",
  ],
  plural: [
    "Plurals",
    "Plurales",
    "In Spanish the article and adjective also show plural (los perros grandes), so the noun can feel optional. In English the noun must add -s after two, many, or few.",
    "En español el artículo y el adjetivo también muestran el plural (los perros grandes), así que el sustantivo puede parecer opcional. En inglés el sustantivo debe llevar -s después de two, many o few.",
    "dos perros",
    "two dogs",
    "two dog",
  ],
  tense: [
    "Past tense",
    "Tiempo pasado",
    "Spanish has many past forms (hablé, hablaba). English uses one simple past for finished actions, and many common verbs are irregular: go, went; see, saw. Do not add -ed to them.",
    "El español tiene muchas formas de pasado (hablé, hablaba). El inglés usa un pasado simple para acciones terminadas y muchos verbos comunes son irregulares: go, went; see, saw. No les agregues -ed.",
    "Fuimos al zoológico.",
    "We went to the zoo.",
    "We goed to the zoo.",
  ],
  neg: [
    "Negatives",
    "Negaciones",
    "Spanish uses more than one negative word and it is correct: No tengo nada. English uses one: I don't have anything.",
    "El español usa más de una palabra negativa y es correcto: No tengo nada. El inglés usa una sola: I don't have anything.",
    "No tengo nada.",
    "I don't have anything.",
    "I don't have nothing.",
  ],
  subj: [
    "Dropping the subject",
    "Omitir el sujeto",
    "Spanish can leave out the subject (Llueve. Es tarde). English always needs one: It is raining. It is late.",
    "El español puede omitir el sujeto (Llueve. Es tarde). El inglés siempre necesita uno: It is raining. It is late.",
    "Llueve.",
    "It is raining.",
    "Is raining.",
  ],
  be: [
    "Be, not have",
    "Be y no have",
    "Spanish uses tener for age and many feelings (Tengo diez años; tengo hambre) and hacer for weather (Hace frío). English uses be: I am ten. I am hungry. It is cold.",
    "El español usa tener para la edad y muchos sentimientos (Tengo diez años; tengo hambre) y hacer para el clima (Hace frío). El inglés usa be: I am ten. I am hungry. It is cold.",
    "Tengo diez años.",
    "I am ten years old.",
    "I have ten years.",
  ],
  prep: [
    "Prepositions",
    "Preposiciones",
    "Spanish en covers in, on, and at. English chooses: on Monday, in May, at noon, in the room.",
    "El español en cubre in, on y at. El inglés elige: on Monday, in May, at noon, in the room.",
    "el lunes",
    "on Monday",
    "at Monday",
  ],
  poss: [
    "Showing owners",
    "Mostrar posesión",
    "Spanish says el perro de María. English puts the owner first with 's: Maria's dog.",
    "El español dice el perro de María. El inglés pone primero al dueño con 's: Maria's dog.",
    "el perro de María",
    "Maria's dog",
    "the dog of Maria",
  ],
  comp: [
    "Comparing",
    "Comparar",
    "Spanish uses más + adjective + que for every adjective (más alto que). English uses -er for short adjectives (taller than) and more for long ones (more careful than).",
    "El español usa más + adjetivo + que para todos los adjetivos (más alto que). El inglés usa -er con adjetivos cortos (taller than) y more con los largos (more careful than).",
    "más alto que",
    "taller than",
    "more tall than",
  ],
  qord: [
    "Question order",
    "Orden de las preguntas",
    "Spanish can ask with the verb alone (¿Dónde vives?). English needs do, does, or did: Where do you live?",
    "El español puede preguntar solo con el verbo (¿Dónde vives?). El inglés necesita do, does o did: Where do you live?",
    "¿Dónde vives?",
    "Where do you live?",
    "Where you live?",
  ],
  sva: [
    "Verb endings",
    "Terminaciones del verbo",
    "Spanish changes the verb for every person (hablo, hablas, habla). English changes it only for he, she, it: I speak, she speaks.",
    "El español cambia el verbo para cada persona (hablo, hablas, habla). El inglés lo cambia solo con he, she, it: I speak, she speaks.",
    "Ella habla.",
    "She speaks.",
    "She speak.",
  ],
  order: [
    "Subject first",
    "Sujeto primero",
    "Spanish can put the verb first (Llegó Ana). English puts the subject first: Ana arrived.",
    "El español puede poner el verbo primero (Llegó Ana). El inglés pone el sujeto primero: Ana arrived.",
    "Llegó Ana.",
    "Ana arrived.",
    "Arrived Ana.",
  ],
};
export const CONTRAST = Object.fromEntries(
  Object.entries(CONTRAST_ROWS).map(([id, [en, es, textEn, textEs, ex, right, wrong]]) => [
    id,
    { id, name: P(en, es), text: P(textEn, textEs), ex, right, wrong },
  ]),
);

const cleanRow = (row) => row.map((x) => (typeof x === "string" ? x.trim() : x));
function unpackRow(row, band, index) {
  const [kind, lv] = row;
  const id = `${band === "3-5" ? "g" : "m"}${kind}${String(index + 1).padStart(3, "0")}`;
  const base = { id, kind, lv, band };
  const r = cleanRow(row);
  switch (kind) {
    case "b":
      return { ...base, a: r[2], c: r[3] || "", alt: r[4] || [] };
    case "c":
      return { ...base, from: r[2].split(" / "), a: r[3], hint: r[4] || "", c: r[5] || "" };
    case "e":
      return { ...base, from: [r[2]], add: r[3], a: r[4], c: r[5] || "" };
    case "s":
      return { ...base, s: r[2], at: r[3].split(",").map(Number), rule: r[4] };
    case "f":
      return { ...base, s: r[2], opts: [r[3], r[4], r[5]], rule: r[6] };
    default:
      throw new Error(`Unknown sentence task kind "${kind}"`);
  }
}
const unpackBoss = (b, band, i) => ({
  id: `${band === "3-5" ? "g" : "m"}boss${i + 1}`,
  lv: b.lv,
  band,
  title: P(b.title, b.titleEs),
  intro: P(b.intro, b.introEs),
  steps: b.steps.map((row, k) => unpackRow(row, band, 900 + i * 10 + k)),
});

export const TASKS = [
  ...ROWS_35.map((r, i) => unpackRow(r, "3-5", i)),
  ...ROWS_68.map((r, i) => unpackRow(r, "6-8", i)),
];
export const BOSSES = [
  ...BOSS_35.map((b, i) => unpackBoss(b, "3-5", i)),
  ...BOSS_68.map((b, i) => unpackBoss(b, "6-8", i)),
];
export const tasksFor = (band, lv) =>
  TASKS.filter((t) => t.band === band && (lv == null || t.lv === lv));
export const levelsFor = (band) => [...new Set(tasksFor(band).map((t) => t.lv))].sort();
export const bossFor = (band) => BOSSES.filter((b) => b.band === band);
export const findTask = (id) =>
  TASKS.find((t) => t.id === id) || BOSSES.flatMap((b) => b.steps).find((t) => t.id === id) || null;
export const findBoss = (id) => BOSSES.find((b) => b.id === id) || null;
