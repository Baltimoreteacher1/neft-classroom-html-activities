// Graphic organizers for the Math Writing Studio. Each organizer is a short list of boxes; every box has one job
// (say it, show it, explain why, check it, wrap up), a colour that belongs to that job everywhere it appears, and a
// sentence starter for each support level. Starters hold no numbers and no math claims, so a starter can never state
// an answer. Rows are pipe-delimited: id|job|label|task|level 1|level 2|level 3, each text as "English~Español".
// Level 4 ("On my own") shows the task only; the level 3 starter is offered on request.
import { MAX_ENTRIES } from "./language-journal.js";

export const JOBS = {
  say: { en: "Say it", es: "Dilo" },
  show: { en: "Show it", es: "Muéstralo" },
  why: { en: "Explain why", es: "Explica por qué" },
  check: { en: "Check it", es: "Compruébalo" },
  end: { en: "Wrap up", es: "Cierra" },
};
export const MAX_PIECES = Math.floor(MAX_ENTRIES / 2);

const pair = (text) => {
  const [en, es] = String(text).split("~");
  return { en: en.trim(), es: (es ?? en).trim() };
};

const parse = (rows) =>
  rows
    .trim()
    .split("\n")
    .map((row) => {
      const [id, job, label, task, ...starters] = row.split("|");
      return {
        id,
        job,
        label: pair(label),
        task: pair(task),
        starters: starters.map(pair),
      };
    });

const ORGANIZER_DATA = [
  {
    id: "paragraph",
    name: "Math paragraph~Párrafo de matemáticas",
    blurb:
      "Explain how you solved a problem in five connected sentences.~Explica cómo resolviste un problema en cinco oraciones conectadas.",
    prompt:
      "Solve the problem. Then write a paragraph that explains how you solved it and why it works.~Resuelve el problema. Luego escribe un párrafo que explique cómo lo resolviste y por qué funciona.",
    boxes: `
say|say|Topic sentence~Oración principal|Tell what you solved and your plan.~Di qué resolviste y cuál fue tu plan.|I solved the problem by ___.~Resolví el problema con ___.|In this problem, I need to find ___. My plan is to ___.~En este problema, tengo que hallar ___. Mi plan es ___.|This problem asks me to ___. I decided to ___ because ___.~Este problema me pide ___. Decidí ___ porque ___.
show|show|Steps~Pasos|Tell your steps in order.~Cuenta tus pasos en orden.|First I ___. Then I ___.~Primero ___. Luego ___.|First, I ___. Next, I ___. Last, I ___.~Primero, ___. Después, ___. Por último, ___.|I began by ___. After that, I ___. Finally, I ___ to get ___.~Empecé por ___. Después, ___. Finalmente, ___ para obtener ___.
why|why|Because~Porque|Explain why your steps work. Use a math word.~Explica por qué funcionan tus pasos. Usa una palabra de matemáticas.|This works because ___.~Esto funciona porque ___.|I know this works because ___, which means ___.~Sé que esto funciona porque ___, lo cual significa que ___.|This method works because ___. For example, ___.~Este método funciona porque ___. Por ejemplo, ___.
check|check|Check~Comprobar|Show how you know your answer makes sense.~Muestra cómo sabes que tu respuesta tiene sentido.|I can check with ___.~Puedo comprobar con ___.|I checked my answer with ___. My check shows that ___.~Comprobé mi respuesta con ___. Mi comprobación muestra que ___.|To check, I ___. This tells me my answer is reasonable because ___.~Para comprobar, ___. Esto me dice que mi respuesta es razonable porque ___.
end|end|Closing sentence~Oración final|Say your answer in a full sentence. Add the unit if there is one.~Di tu respuesta en una oración completa. Agrega la unidad si hay una.|The answer is ___.~La respuesta es ___.|So the answer is ___, and it means ___.~Entonces la respuesta es ___, y significa que ___.|In conclusion, ___ is the answer because ___.~En conclusión, ___ es la respuesta porque ___.`,
    model: [
      "I solved 24 × 15 by splitting 15 into 10 and 5.~Resolví 24 × 15 separando 15 en 10 y 5.",
      "First, I multiplied 24 × 10 to get 240. Next, I multiplied 24 × 5 to get 120. Then I added the two partial products.~Primero, multipliqué 24 × 10 y obtuve 240. Después, multipliqué 24 × 5 y obtuve 120. Luego sumé los dos productos parciales.",
      "This works because 15 is 10 + 5, so the two products together make 15 groups of 24.~Esto funciona porque 15 es 10 + 5, así que los dos productos juntos forman 15 grupos de 24.",
      "To check, I estimated with 25 × 15 = 375, which is close to my answer.~Para comprobar, estimé con 25 × 15 = 375, que está cerca de mi respuesta.",
      "The product of 24 and 15 is 360.~El producto de 24 y 15 es 360.",
    ],
  },
  {
    id: "test",
    name: "Test-style response~Respuesta estilo examen",
    blurb:
      "Restate, answer, show your work, explain. The shape that short written answers on tests reward.~Repite, responde, muestra tu trabajo y explica. La forma que premian las respuestas escritas cortas en los exámenes.",
    prompt:
      "Part A: Solve the problem. Part B: Explain how you know your answer is correct. Use numbers, words, or a model.~Parte A: Resuelve el problema. Parte B: Explica cómo sabes que tu respuesta es correcta. Usa números, palabras o un modelo.",
    boxes: `
say|say|Restate~Repite la pregunta|Turn the question into the start of your answer.~Convierte la pregunta en el comienzo de tu respuesta.|The question asks me to ___.~La pregunta me pide ___.|The problem asks me to find ___. I will ___.~El problema me pide hallar ___. Voy a ___.|The question asks me to ___, so I need to ___.~La pregunta me pide ___, así que necesito ___.
end|end|Answer~Respuesta|State the answer. Include the unit.~Escribe la respuesta. Incluye la unidad.|My answer is ___.~Mi respuesta es ___.|My answer is ___ because ___.~Mi respuesta es ___ porque ___.|The answer is ___, which I found by ___.~La respuesta es ___, que obtuve con ___.
show|show|Show your work~Muestra tu trabajo|Use numbers from the problem to show your work.~Usa los números del problema para mostrar tu trabajo.|I did ___ with ___.~Hice ___ con ___.|I used ___ and ___. First I ___. Then I ___.~Usé ___ y ___. Primero ___. Luego ___.|To find the answer, I used ___. I started with ___, then ___.~Para hallar la respuesta, usé ___. Empecé con ___ y luego ___.
why|why|Explain~Explica|Say why your work makes sense. Use math words.~Di por qué tu trabajo tiene sentido. Usa palabras de matemáticas.|It works because ___.~Funciona porque ___.|This is correct because ___, so ___.~Esto es correcto porque ___, así que ___.|My work is correct because ___. One way to check is ___.~Mi trabajo es correcto porque ___. Una manera de comprobar es ___.`,
    model: [
      "The problem asks how many pencils are in 15 boxes when each box holds 24.~El problema pregunta cuántos lápices hay en 15 cajas si cada caja tiene 24.",
      "There are 360 pencils in all.~Hay 360 lápices en total.",
      "I multiplied 24 × 15 by splitting 15 into 10 + 5: 24 × 10 = 240, 24 × 5 = 120, and 240 + 120 = 360.~Multipliqué 24 × 15 separando 15 en 10 + 5: 24 × 10 = 240, 24 × 5 = 120 y 240 + 120 = 360.",
      "This is correct because 15 boxes of 24 is 15 equal groups, and the partial products add up to the whole.~Esto es correcto porque 15 cajas de 24 son 15 grupos iguales, y los productos parciales suman el total.",
    ],
  },
  {
    id: "cer",
    name: "Claim, evidence, reasoning~Afirmación, evidencia, razonamiento",
    blurb:
      "Decide if a classmate is right, prove it with numbers, and name the math idea behind it.~Decide si un compañero tiene razón, demuéstralo con números y nombra la idea matemática.",
    prompt:
      "A classmate shares an answer. Do you agree or disagree? Use evidence from the problem and a math rule.~Un compañero comparte una respuesta. ¿Estás de acuerdo o no? Usa evidencia del problema y una regla de matemáticas.",
    boxes: `
say|say|Claim~Afirmación|Say if the answer is right or wrong.~Di si la respuesta es correcta o no.|My claim is that the answer is ___.~Mi afirmación es que la respuesta es ___.|My claim is that ___ is the correct answer.~Mi afirmación es que ___ es la respuesta correcta.|I claim that this answer is ___, and I can prove it.~Afirmo que esta respuesta es ___, y puedo demostrarlo.
show|show|Evidence~Evidencia|Use numbers and steps from the problem.~Usa números y pasos del problema.|I see ___.~Veo ___.|The numbers show ___. When I ___, I get ___.~Los números muestran ___. Cuando ___, obtengo ___.|My evidence is ___. When I ___, I find ___.~Mi evidencia es ___. Cuando ___, encuentro ___.
why|why|Reasoning~Razonamiento|Connect your evidence to a math rule or idea.~Conecta tu evidencia con una regla o idea de matemáticas.|This is true because ___.~Esto es cierto porque ___.|The rule is ___. That means ___.~La regla es ___. Eso significa que ___.|This evidence supports my claim because ___. The rule ___ explains why.~Esta evidencia apoya mi afirmación porque ___. La regla ___ explica por qué.`,
    model: [
      "My claim is that Maya’s answer of 350 is not correct.~Mi afirmación es que la respuesta de Maya, 350, no es correcta.",
      "My evidence is that 24 × 10 = 240 and 24 × 5 = 120, and 240 + 120 = 360, not 350.~Mi evidencia es que 24 × 10 = 240 y 24 × 5 = 120, y 240 + 120 = 360, no 350.",
      "This supports my claim because the partial products must add up to the product, and these two make 360.~Esto apoya mi afirmación porque los productos parciales deben sumar el producto, y estos dos suman 360.",
    ],
  },
  {
    id: "compare",
    name: "Compare two ways~Comparar dos maneras",
    blurb:
      "Solve one problem two ways, then write what is alike, what is different, and which you prefer.~Resuelve un problema de dos maneras y escribe en qué se parecen, en qué se diferencian y cuál prefieres.",
    prompt:
      "Solve the problem two different ways. Then write about how the ways are alike and different.~Resuelve el problema de dos maneras distintas. Luego escribe en qué se parecen y en qué se diferencian.",
    boxes: `
one|show|Way 1~Manera 1|Describe the first way.~Describe la primera manera.|One way is ___.~Una manera es ___.|One way to solve it is ___. I ___ first.~Una manera de resolverlo es ___. Primero ___.|The first way is to ___. This works because ___.~La primera manera es ___. Funciona porque ___.
two|show|Way 2~Manera 2|Describe a different way.~Describe una manera diferente.|Another way is ___.~Otra manera es ___.|Another way is ___. I ___ first.~Otra manera es ___. Primero ___.|The second way is to ___. This works because ___.~La segunda manera es ___. Funciona porque ___.
alike|why|Alike~Se parecen|Say how the two ways are the same.~Di en qué se parecen las dos maneras.|Both ways ___.~Las dos maneras ___.|Both ways show ___ and use ___.~Las dos maneras muestran ___ y usan ___.|The two ways are alike because both ___.~Las dos maneras se parecen porque ambas ___.
differ|check|Different~Se diferencian|Say what is different between them.~Di qué es diferente entre ellas.|One difference is ___.~Una diferencia es ___.|The first way ___, but the second way ___.~La primera manera ___, pero la segunda ___.|They are different because ___, while ___.~Son diferentes porque ___, mientras que ___.
pick|end|My choice~Mi elección|Say which way you prefer and why.~Di cuál manera prefieres y por qué.|I like ___ better.~Me gusta más ___.|I prefer ___ because ___.~Prefiero ___ porque ___.|I would choose ___ for this problem because ___.~Elegiría ___ para este problema porque ___.`,
    model: [
      "One way is to split 15 into 10 + 5 and multiply each part by 24.~Una manera es separar 15 en 10 + 5 y multiplicar cada parte por 24.",
      "Another way is to split 24 into 20 + 4 and multiply each part by 15.~Otra manera es separar 24 en 20 + 4 y multiplicar cada parte por 15.",
      "Both ways use partial products and add them at the end.~Las dos maneras usan productos parciales y los suman al final.",
      "The first way uses 10 and 5, but the second way uses 20 and 4.~La primera manera usa 10 y 5, pero la segunda usa 20 y 4.",
      "I prefer the first way because multiplying by 10 is easy.~Prefiero la primera manera porque multiplicar por 10 es fácil.",
    ],
  },
  {
    id: "fix",
    name: "Find and fix the mistake~Encuentra y corrige el error",
    blurb:
      "Read a classmate’s work, find the mistake, fix it, and give advice.~Lee el trabajo de un compañero, encuentra el error, corrígelo y da un consejo.",
    prompt:
      "A classmate made a mistake. Find it, fix it, and explain so the mistake does not happen again.~Un compañero cometió un error. Encuéntralo, corrígelo y explica para que no se repita.",
    boxes: `
what|say|What happened~Qué pasó|Tell what the student did.~Cuenta lo que hizo el estudiante.|The student ___.~El estudiante ___.|The student said ___. The student did ___.~El estudiante dijo ___. El estudiante hizo ___.|The student claims ___ and got there by ___.~El estudiante afirma ___ y llegó a ese resultado con ___.
mistake|check|The mistake~El error|Find the mistake and say what went wrong.~Encuentra el error y di qué salió mal.|The mistake is ___.~El error es ___.|The mistake was ___, because ___.~El error fue ___, porque ___.|I noticed that ___, which is a mistake because ___.~Me di cuenta de que ___, y eso es un error porque ___.
fixit|show|The fix~La corrección|Show the correct step.~Muestra el paso correcto.|The right step is ___.~El paso correcto es ___.|To fix it, first ___. Then ___.~Para corregirlo, primero ___. Luego ___.|A correct way is to ___. This gives ___.~Una manera correcta es ___. Esto da ___.
advice|end|Advice~Consejo|Give advice so no one repeats the mistake.~Da un consejo para que nadie repita el error.|Next time, ___.~La próxima vez, ___.|My advice is to ___ so that ___.~Mi consejo es ___ para que ___.|To avoid this mistake, always ___ because ___.~Para evitar este error, siempre ___ porque ___.`,
    model: [
      "The student said the product of 24 and 15 was 350 after finding 240 and 120.~El estudiante dijo que el producto de 24 y 15 era 350 después de hallar 240 y 120.",
      "The mistake was in the adding: 240 + 120 is 360, not 350.~El error estuvo en la suma: 240 + 120 es 360, no 350.",
      "To fix it, I added again: 240 + 120 = 360.~Para corregirlo, sumé otra vez: 240 + 120 = 360.",
      "Next time, check the addition with an estimate.~La próxima vez, comprueba la suma con una estimación.",
    ],
  },
];

export const ORGANIZERS = ORGANIZER_DATA.map((organizer) => ({
  id: organizer.id,
  name: pair(organizer.name),
  blurb: pair(organizer.blurb),
  prompt: pair(organizer.prompt),
  boxes: parse(organizer.boxes),
  model: organizer.model.map(pair),
}));

export const organizerById = (id) =>
  ORGANIZERS.find((organizer) => organizer.id === id) || ORGANIZERS[0];

// Level 1-3 give that level's starter; level 4 gives none until the learner asks (then level 3).
export const starterFor = (box, level, lang, { asked = false } = {}) => {
  if (Number(level) >= 4 && !asked) return "";
  const index = Math.min(2, Math.max(0, Math.min(3, Number(level)) - 1));
  return box.starters[index][lang === "es" ? "es" : "en"];
};

export const allStarters = () =>
  ORGANIZERS.flatMap((organizer) =>
    organizer.boxes.flatMap((box) => box.starters.flatMap((s) => [s.en, s.es])),
  );
