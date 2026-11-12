// Kindergarten — authored explanations. Short sentences, one idea each, every word defined by a picture.
import {
  L,
  binop,
  compareEqual,
  compareReversed,
  compareWholes,
  isNum,
  mis,
  nums,
  q,
  right,
} from "./k5-kit.js";
import { hiddenPartsModel } from "./lm-k2.js";

const SHAPE = { "●": "circle", "▲": "triangle", "■": "square" };
const offByOne = [
  mis(
    "counted-twice",
    (item, raw) => isNum(raw, Number(right(item)) + 1),
    "One too many. You may have counted one counter twice. Touch each one once, and say one number for each touch.",
    "Una de más. Tal vez contaste una ficha dos veces. Toca cada una una sola vez y di un número por cada toque.",
  ),
  mis(
    "skipped-one",
    (item, raw) => isNum(raw, Number(right(item)) - 1),
    "One too few. You may have skipped one. Move each counter as you count it, so none is missed.",
    "Una de menos. Tal vez te saltaste una. Mueve cada ficha al contarla para no saltarte ninguna.",
  ),
];

export const G0 = {
  "0:count-forward": {
    concept: L(
      "Counting forward means saying the numbers in order. Each new number is one more than the number before it.",
      "Contar hacia adelante es decir los números en orden. Cada número nuevo es uno más que el anterior.",
    ),
    reasons: [
      L(
        "The numbers always come in the same order.",
        "Los números siempre van en el mismo orden.",
      ),
      L("Each step adds one more.", "Cada paso suma uno más."),
      L(
        "So the next number is the last number plus one.",
        "Así que el número que sigue es el último más uno.",
      ),
    ],
    misconception: L(
      "Do not write the last number again. The blank wants the number that comes AFTER it.",
      "No escribas otra vez el último número. El espacio pide el número que va DESPUÉS.",
    ),
    misconceptions: [
      mis(
        "repeat-last",
        (item, raw) => isNum(raw, nums(q(item)).at(-1)),
        "That is the last number you see. Say it out loud, then say the number that comes next.",
        "Ese es el último número que ves. Dilo en voz alta y luego di el número que sigue.",
      ),
      mis(
        "count-back",
        (item, raw) => isNum(raw, nums(q(item)).at(-1) - 1),
        "That number comes BEFORE. Counting forward goes up: one more each time.",
        "Ese número va ANTES. Contar hacia adelante sube: uno más cada vez.",
      ),
    ],
    transfer: {
      prompt: L(
        "A rocket counts up: 17, 18, 19. What number comes next?",
        "Un cohete cuenta hacia arriba: 17, 18, 19. ¿Qué número sigue?",
      ),
      answers: ["20"],
      kind: "number",
      hint: L("What is one more than 19?", "¿Cuánto es uno más que 19?"),
      explanation: L(
        "One more than 19 is 20. After 19 we start a new ten: 20.",
        "Uno más que 19 es 20. Después del 19 empieza una decena nueva: 20.",
      ),
    },
  },
  "0:count-cardinality": {
    title: L(
      "Count a group and tell how many",
      "Cuenta un grupo y di cuántos hay",
    ),
    concept: L(
      "When you count a group, you say one number for each thing. The last number you say tells how many are in the group.",
      "Cuando cuentas un grupo, dices un número por cada cosa. El último número que dices es cuántos hay en el grupo.",
    ),
    reasons: [
      L(
        "One touch, one number. No thing gets two numbers.",
        "Un toque, un número. Ninguna cosa recibe dos números.",
      ),
      L(
        "The last number names the whole group.",
        "El último número nombra todo el grupo.",
      ),
      L(
        "Moving the things around does not change how many.",
        "Mover las cosas no cambia cuántas hay.",
      ),
    ],
    misconception: L(
      "Counting a thing twice, or skipping one, gives the wrong total. Touch or move each one as you count.",
      "Contar una cosa dos veces, o saltarte una, da un total equivocado. Toca o mueve cada una al contar.",
    ),
    misconceptions: offByOne,
    transfer: {
      prompt: L(
        "Mia puts 6 blocks in a line. Then she moves them into a circle. How many blocks are there now?",
        "Mia pone 6 bloques en una fila. Luego los mueve para formar un círculo. ¿Cuántos bloques hay ahora?",
      ),
      answers: ["6"],
      kind: "number",
      hint: L(
        "Did Mia add or take away any blocks?",
        "¿Mia agregó o quitó bloques?",
      ),
      explanation: L(
        "Still 6. Moving the blocks does not change how many there are.",
        "Siguen siendo 6. Mover los bloques no cambia cuántos hay.",
      ),
    },
  },
  "0:subitize": {
    title: L("See how many at a glance", "Mira cuántos hay de un vistazo"),
    concept: L(
      "Some small groups have a shape you know, like the dots on a die. You can see how many without counting one by one.",
      "Algunos grupos pequeños tienen una forma que conoces, como los puntos de un dado. Puedes ver cuántos hay sin contar uno por uno.",
    ),
    reasons: [
      L(
        "A five on a die is four corners and one in the middle.",
        "Un cinco en un dado son cuatro esquinas y uno en el medio.",
      ),
      L(
        "You can see a group as two small parts: 3 and 2 make 5.",
        "Puedes ver un grupo como dos partes pequeñas: 3 y 2 hacen 5.",
      ),
      L(
        "If the dots are scattered, find small groups first.",
        "Si los puntos están regados, busca primero grupos pequeños.",
      ),
    ],
    misconception: L(
      "A quick look can miss a dot. Look for small groups you know, then put the groups together.",
      "Una mirada rápida puede saltarse un punto. Busca grupos pequeños que conozcas y luego júntalos.",
    ),
    misconceptions: offByOne,
    transfer: {
      prompt: L(
        "A domino has 4 dots on one side and 2 dots on the other side. How many dots in all?",
        "Un dominó tiene 4 puntos de un lado y 2 puntos del otro lado. ¿Cuántos puntos hay en total?",
      ),
      answers: ["6"],
      kind: "number",
      hint: L(
        "See the 4 as one group. Then add the 2.",
        "Mira el 4 como un grupo. Luego suma el 2.",
      ),
      explanation: L("4 and 2 make 6. 4 + 2 = 6.", "4 y 2 hacen 6. 4 + 2 = 6."),
    },
  },
  "0:compare-20": {
    title: L(
      "Which is more? Compare numbers to 20",
      "¿Cuál es más? Compara números hasta 20",
    ),
    concept: L(
      "To compare, we ask which group has more. A number that comes later when you count is the bigger number.",
      "Para comparar, preguntamos qué grupo tiene más. Un número que viene después al contar es el número mayor.",
    ),
    reasons: [
      L(
        "Line up the two groups. The longer line has more.",
        "Pon los dos grupos en fila. La fila más larga tiene más.",
      ),
      L(
        "On a number line, bigger numbers are farther to the right.",
        "En una recta numérica, los números mayores están más a la derecha.",
      ),
      L(
        "The open mouth of < or > faces the bigger number.",
        "La boca abierta de < o > mira al número mayor.",
      ),
    ],
    misconception: L(
      "The symbol can point the wrong way. The open side always faces the bigger number.",
      "El símbolo puede apuntar al revés. El lado abierto siempre mira al número mayor.",
    ),
    misconceptions: [
      compareReversed(compareWholes),
      compareEqual(compareWholes),
    ],
    transfer: {
      prompt: L(
        "Sam has 12 stickers. Ana has 15 stickers. Who has more stickers, Sam or Ana?",
        "Sam tiene 12 calcomanías. Ana tiene 15 calcomanías. ¿Quién tiene más calcomanías, Sam o Ana?",
      ),
      answers: ["Ana", "ana"],
      kind: "text",
      hint: L(
        "Which number comes later when you count?",
        "¿Qué número viene después al contar?",
      ),
      explanation: L(
        "15 comes after 12, so 15 is more. 12 < 15. Ana has more.",
        "15 viene después de 12, así que 15 es más. 12 < 15. Ana tiene más.",
      ),
    },
  },
  "0:compose-10": {
    concept: L(
      "10 can be made from two parts. If you know one part, the other part is what is still missing to fill 10.",
      "El 10 se puede formar con dos partes. Si sabes una parte, la otra parte es lo que falta para llenar 10.",
    ),
    reasons: [
      L("A ten-frame has 10 boxes.", "Un marco de diez tiene 10 casillas."),
      L(
        "Fill the boxes for the part you know.",
        "Llena las casillas de la parte que sabes.",
      ),
      L(
        "The empty boxes are the missing part.",
        "Las casillas vacías son la parte que falta.",
      ),
    ],
    misconception: L(
      "Do not add the number to 10. Count only the EMPTY boxes: that is the part that is missing.",
      "No le sumes el número al 10. Cuenta solo las casillas VACÍAS: esa es la parte que falta.",
    ),
    misconceptions: [
      mis(
        "added",
        (item, raw) => {
          const n = nums(q(item));
          return /\?\s*=\s*10/.test(q(item)) && isNum(raw, n[0] + 10);
        },
        "You added the two numbers. The 10 is the whole. Fill the ten-frame up to the part you know, then count the empty boxes.",
        "Sumaste los dos números. El 10 es el total. Llena el marco de diez con la parte que sabes y cuenta las casillas vacías.",
      ),
      mis(
        "wrote-total",
        (item, raw) => /\?\s*=\s*10/.test(q(item)) && isNum(raw, 10),
        "10 is the whole. The box asks for the missing part only: how many more to make 10?",
        "10 es el total. La casilla pide solo la parte que falta: ¿cuántos más para llegar a 10?",
      ),
    ],
    transfer: {
      prompt: L(
        "A bus has 10 seats. 6 children sit down. How many seats are still empty?",
        "Un autobús tiene 10 asientos. Se sientan 6 niños. ¿Cuántos asientos siguen vacíos?",
      ),
      answers: ["4"],
      kind: "number",
      hint: L("6 and how many more make 10?", "¿6 y cuántos más hacen 10?"),
      explanation: L(
        "6 and 4 make 10, so 4 seats are empty. 6 + 4 = 10.",
        "6 y 4 hacen 10, así que hay 4 asientos vacíos. 6 + 4 = 10.",
      ),
    },
  },
  "0:add-sub-5": {
    title: L("Put together and take away to 5", "Juntar y quitar hasta 5"),
    concept: L(
      "Adding puts two groups together. Taking away (subtracting) removes some from a group. We count what is there at the end.",
      "Sumar junta dos grupos. Quitar (restar) saca algunos de un grupo. Contamos lo que queda al final.",
    ),
    reasons: [
      L(
        "+ means put together. The group gets bigger.",
        "+ significa juntar. El grupo crece.",
      ),
      L(
        "− means take away. The group gets smaller.",
        "− significa quitar. El grupo se hace más pequeño.",
      ),
      L(
        "Start at the first number and count on or back.",
        "Empieza en el primer número y cuenta hacia adelante o hacia atrás.",
      ),
    ],
    misconception: L(
      "When you count on, do not count the first number again. Say it, then count the new ones.",
      "Cuando cuentas hacia adelante, no vuelvas a contar el primer número. Dilo y luego cuenta los nuevos.",
    ),
    misconceptions: [
      mis(
        "counted-start",
        (item, raw) => {
          const p = binop(item);
          if (!p) return false;
          const [a, op, b] = p;
          return (
            b > 0 &&
            (op === "+"
              ? isNum(raw, a + b - 1)
              : op === "-" && isNum(raw, a - b + 1))
          );
        },
        "You counted the starting number as a step. Say the first number, then count only the ones you add or take away.",
        "Contaste el número de inicio como un paso. Di el primer número y luego cuenta solo los que agregas o quitas.",
      ),
      mis(
        "wrong-sign",
        (item, raw) => {
          const p = binop(item);
          if (!p) return false;
          const [a, op, b] = p;
          return (
            b > 0 &&
            (op === "+"
              ? a >= b && isNum(raw, a - b)
              : op === "-" && isNum(raw, a + b))
          );
        },
        "Look at the sign. + puts together, so the answer gets bigger. − takes away, so it gets smaller.",
        "Mira el signo. + junta, así que la respuesta crece. − quita, así que se hace más pequeña.",
      ),
    ],
    transfer: {
      prompt: L(
        "4 birds sit on a fence. 1 bird flies away. How many birds are on the fence now?",
        "4 pájaros están en una cerca. 1 pájaro se va volando. ¿Cuántos pájaros hay en la cerca ahora?",
      ),
      answers: ["3"],
      kind: "number",
      hint: L("Is a bird joining or leaving?", "¿Un pájaro llega o se va?"),
      explanation: L(
        "One flies away, so we take away 1. 4 − 1 = 3.",
        "Uno se va, así que quitamos 1. 4 − 1 = 3.",
      ),
    },
  },
  "0:story-add-sub-10": {
    title: L(
      "Solve a story: how many joined?",
      "Resuelve un cuento: ¿cuántos llegaron?",
    ),
    concept: L(
      "In these stories you know the start and the end. The box is the part that joined. It is the jump from the start to the end.",
      "En estos cuentos sabes el inicio y el final. La casilla es la parte que llegó. Es el salto del inicio al final.",
    ),
    reasons: [
      L("Start at the first number.", "Empieza en el primer número."),
      L(
        "Count on until you reach the total.",
        "Cuenta hacia adelante hasta llegar al total.",
      ),
      L(
        "How many numbers you counted is the missing part.",
        "Cuántos números contaste es la parte que falta.",
      ),
    ],
    misconception: L(
      "The total is already in the story. The box asks how many JOINED, not how many in all.",
      "El total ya está en el cuento. La casilla pregunta cuántos LLEGARON, no cuántos hay en total.",
    ),
    misconceptions: [
      mis(
        "added-both",
        (item, raw) => {
          const n = nums(q(item));
          return /□/.test(q(item)) && n.length >= 2 && isNum(raw, n[0] + n[1]);
        },
        "You added the start and the total. The total already includes the start. Count on from the start up to the total.",
        "Sumaste el inicio y el total. El total ya incluye el inicio. Cuenta desde el inicio hasta el total.",
      ),
      mis(
        "wrote-total",
        (item, raw) => {
          const n = nums(q(item));
          return /□/.test(q(item)) && n.length >= 2 && isNum(raw, n[1]);
        },
        "That is the total. The box is only the part that joined. Start at the first number and count up to the total.",
        "Ese es el total. La casilla es solo la parte que llegó. Empieza en el primer número y cuenta hasta el total.",
      ),
    ],
    transfer: {
      prompt: L(
        "Leo has 3 shells. He finds some more. Now he has 8 shells. How many shells did he find?",
        "Leo tiene 3 conchas. Encuentra algunas más. Ahora tiene 8 conchas. ¿Cuántas conchas encontró?",
      ),
      answers: ["5"],
      kind: "number",
      hint: L("Start at 3. Count up to 8.", "Empieza en 3. Cuenta hasta 8."),
      explanation: L(
        "3, then 4, 5, 6, 7, 8 is 5 more. 3 + 5 = 8.",
        "3, luego 4, 5, 6, 7, 8 son 5 más. 3 + 5 = 8.",
      ),
    },
  },
  "0:patterns": {
    title: L("What comes next in the pattern?", "¿Qué sigue en el patrón?"),
    concept: L(
      "A repeating pattern has a part that repeats again and again. Find the part that repeats, then say what comes next.",
      "Un patrón que se repite tiene una parte que se repite una y otra vez. Busca la parte que se repite y di qué sigue.",
    ),
    reasons: [
      L(
        "Read the pattern out loud. You will hear the part that repeats.",
        "Lee el patrón en voz alta. Vas a oír la parte que se repite.",
      ),
      L(
        "Put a finger under each repeat to see it start again.",
        "Pon un dedo debajo de cada repetición para ver dónde empieza otra vez.",
      ),
      L(
        "The next shape is the next one in that part.",
        "La siguiente figura es la que sigue en esa parte.",
      ),
    ],
    misconception: L(
      "The next shape is not always the same as the last one. Find where the repeating part starts again.",
      "La siguiente figura no siempre es igual a la última. Busca dónde vuelve a empezar la parte que se repite.",
    ),
    misconceptions: [
      mis(
        "repeat-last",
        (item, raw) => {
          const shapes = q(item).match(/[●▲■]/g) || [];
          return (
            shapes.length > 1 && raw.toLowerCase() === SHAPE[shapes.at(-1)]
          );
        },
        "You copied the last shape. Say the pattern out loud and find where it starts over. What comes after the last shape in the repeating part?",
        "Copiaste la última figura. Di el patrón en voz alta y busca dónde vuelve a empezar. ¿Qué va después de la última figura en la parte que se repite?",
      ),
      mis(
        "went-backward",
        (item, raw) => {
          const shapes = q(item).match(/[●▲■]/g) || [];
          return shapes.length > 2 && raw.toLowerCase() === SHAPE[shapes.at(-2)];
        },
        "That shape came BEFORE the last one. A pattern goes forward. Point to the last shape, find it in the part that repeats, and say what comes after it.",
        "Esa figura iba ANTES de la última. Un patrón avanza. Señala la última figura, búscala en la parte que se repite y di cuál va después.",
      ),
    ],
    transfer: {
      prompt: L(
        "A bead string goes: red, red, blue, red, red, blue, red, red. What color comes next?",
        "Un collar de cuentas va así: rojo, rojo, azul, rojo, rojo, azul, rojo, rojo. ¿Qué color sigue?",
      ),
      answers: ["blue", "azul"],
      kind: "text",
      hint: L(
        "The part that repeats is red, red, blue.",
        "La parte que se repite es rojo, rojo, azul.",
      ),
      explanation: L(
        "The repeat is red, red, blue. After two reds comes blue.",
        "La repetición es rojo, rojo, azul. Después de dos rojos viene azul.",
      ),
    },
  },
  "0:hidden-parts": {
    concept: L(
      "Some counters are hiding. You know how many there are in all and how many you can see. The hiding part is what is missing from the whole.",
      "Algunas fichas están escondidas. Sabes cuántas hay en total y cuántas ves. La parte escondida es lo que falta para el total.",
    ),
    reasons: [
      L(
        "The ones showing and the ones hiding make the whole.",
        "Las que se ven y las escondidas forman el total.",
      ),
      L(
        "Count on from the ones showing up to the total.",
        "Cuenta desde las que se ven hasta el total.",
      ),
      L(
        "The numbers you counted are the hiding ones.",
        "Los números que contaste son las escondidas.",
      ),
    ],
    misconception: L(
      "The hiding part is not the total and not the ones you see. It is what is missing to make the total.",
      "La parte escondida no es el total ni las que ves. Es lo que falta para llegar al total.",
    ),
    misconceptions: [
      mis(
        "showing",
        (item, raw) => /hiding/.test(q(item)) && isNum(raw, nums(q(item))[1]),
        "That is how many are SHOWING. Count on from there up to the total to find how many are hiding.",
        "Esas son las que SE VEN. Cuenta desde ahí hasta el total para saber cuántas están escondidas.",
      ),
      mis(
        "total",
        (item, raw) => /hiding/.test(q(item)) && isNum(raw, nums(q(item))[0]),
        "That is how many there are in ALL. Some of them are showing, so fewer are hiding.",
        "Esas son TODAS. Algunas se ven, así que hay menos escondidas.",
      ),
      mis(
        "added",
        (item, raw) => {
          const n = nums(q(item));
          return /hiding/.test(q(item)) && isNum(raw, n[0] + n[1]);
        },
        "You added. But the ones showing are already part of the total. Take them away from the total, or count on to it.",
        "Sumaste. Pero las que se ven ya son parte del total. Quítalas del total o cuenta hasta el total.",
      ),
    ],
    living: hiddenPartsModel,
    transfer: {
      prompt: L(
        "There are 8 crayons in all. 5 are on the table. The rest are in the box. How many crayons are in the box?",
        "Hay 8 crayones en total. 5 están en la mesa. Los demás están en la caja. ¿Cuántos crayones hay en la caja?",
      ),
      answers: ["3"],
      kind: "number",
      hint: L("Start at 5. Count up to 8.", "Empieza en 5. Cuenta hasta 8."),
      explanation: L(
        "5 and 3 make 8, so 3 are in the box. 8 − 5 = 3.",
        "5 y 3 hacen 8, así que hay 3 en la caja. 8 − 5 = 3.",
      ),
    },
  },
};
