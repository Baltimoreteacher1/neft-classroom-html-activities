// Grade 8, part 1: exponents, roots, linear equations, slope and functions. Schema: ../SCHEMA.md.
import { L, clean, key, num, nums, same } from "./kit-68.js";
import { EQUATION_MISCONCEPTIONS } from "./g68-grade7b.js";

export const G8A = {
  "8:exponents": {
    title: L("Evaluate powers", "Evaluar potencias"),
    concept: L(
      "An exponent tells how many times the base is used as a FACTOR: 3⁴ = 3 × 3 × 3 × 3. It is repeated multiplication, not multiplication by the exponent.",
      "Un exponente indica cuántas veces se usa la base como FACTOR: 3⁴ = 3 × 3 × 3 × 3. Es multiplicación repetida, no multiplicar por el exponente.",
    ),
    reasons: [
      L(
        "2³ is the volume of a cube with edge 2: 2 × 2 × 2 unit cubes.",
        "2³ es el volumen de un cubo de arista 2: 2 × 2 × 2 cubos unidad.",
      ),
      L(
        "Each time the exponent goes up by 1, the value is multiplied by the base once more.",
        "Cada vez que el exponente aumenta en 1, el valor se multiplica una vez más por la base.",
      ),
      L(
        "Powers of 10 add zeros: 10³ is a 1 followed by three zeros.",
        "Las potencias de 10 agregan ceros: 10³ es un 1 seguido de tres ceros.",
      ),
    ],
    misconception: L(
      "3⁴ is not 3 × 4. Write the base as a factor as many times as the exponent says, then multiply.",
      "3⁴ no es 3 × 4. Escribe la base como factor tantas veces como indica el exponente y luego multiplica.",
    ),
    misconceptions: [
      {
        id: "times-exponent",
        detect(item, raw) {
          const [b, e] = nums(item.question);
          const v = num(raw);
          return same(v, b * e) && !same(v, key(item));
        },
        feedback: L(
          "You multiplied the base by the exponent. The exponent counts how many times the base is a FACTOR: write it out, like 3 × 3 × 3 × 3, and multiply.",
          "Multiplicaste la base por el exponente. El exponente cuenta cuántas veces la base es FACTOR: escríbelo, como 3 × 3 × 3 × 3, y multiplica.",
        ),
      },
      {
        id: "one-short",
        detect(item, raw) {
          const [b, e] = nums(item.question);
          const v = num(raw);
          return e > 1 && same(v, b ** (e - 1)) && !same(v, key(item));
        },
        feedback: L(
          "Count the factors: the base appears exactly as many times as the exponent. You used it one time too few.",
          "Cuenta los factores: la base aparece exactamente tantas veces como el exponente. La usaste una vez menos.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A story is shared by 1 person, who sends it to 3 friends. Each of them sends it to 3 more friends, and so on. At the 4th round of sending, how many people receive it? (Round 1 is 3 people.)",
        "Una persona comparte una historia con 3 amigos. Cada uno se la envía a 3 amigos más, y así sucesivamente. En la 4.ª ronda de envíos, ¿cuántas personas la reciben? (La ronda 1 son 3 personas.)",
      ),
      answers: ["81"],
      kind: "number",
      hint: L("Round 2 is 3 × 3 people.", "La ronda 2 son 3 × 3 personas."),
      explanation: L(
        "Round 4: 3⁴ = 3 × 3 × 3 × 3 = 81 people.",
        "Ronda 4: 3⁴ = 3 × 3 × 3 × 3 = 81 personas.",
      ),
    },
  },

  "8:powers-ten": {
    title: L("Multiply by powers of ten", "Multiplicar por potencias de diez"),
    concept: L(
      "Multiplying by 10ⁿ moves every digit n places to the LEFT (the number gets larger); multiplying by 10⁻ⁿ, which is dividing by 10ⁿ, moves every digit n places to the right.",
      "Multiplicar por 10ⁿ mueve cada cifra n lugares a la IZQUIERDA (el número crece); multiplicar por 10⁻ⁿ, que es dividir entre 10ⁿ, mueve cada cifra n lugares a la derecha.",
    ),
    reasons: [
      L(
        "Each place is worth 10 times the place to its right.",
        "Cada lugar vale 10 veces el lugar a su derecha.",
      ),
      L(
        "10⁻¹ = 1/10, so × 10⁻¹ means one-tenth as large.",
        "10⁻¹ = 1/10, así que × 10⁻¹ significa una décima parte.",
      ),
      L(
        "This is how scientific notation names very large and very small numbers.",
        "Así es como la notación científica nombra números muy grandes y muy pequeños.",
      ),
    ],
    misconception: L(
      "A negative exponent makes the number SMALLER, not negative. 3.2 × 10⁻² = 0.032.",
      "Un exponente negativo hace el número MÁS PEQUEÑO, no negativo. 3,2 × 10⁻² = 0,032.",
    ),
    misconceptions: [
      {
        id: "direction",
        detect(item, raw) {
          const m = clean(item.question).match(
            /^(\d+(?:\.\d+)?) × 10\^(-?\d+)/,
          );
          if (!m) return false;
          const v = num(raw);
          return (
            !same(v, key(item)) && same(v, Number(m[1]) * 10 ** -Number(m[2]))
          );
        },
        feedback: L(
          "You moved the digits the wrong way. A positive power of ten makes the number larger; a negative power makes it smaller.",
          "Moviste las cifras hacia el lado contrario. Una potencia de diez positiva hace el número más grande; una negativa lo hace más pequeño.",
        ),
      },
      {
        id: "count",
        detect(item, raw) {
          const v = num(raw);
          const k = key(item);
          return !same(v, k) && k !== 0 && (same(v, k * 10) || same(v, k / 10));
        },
        feedback: L(
          "You are one place off. Move the digits exactly as many places as the exponent, counting from the decimal point.",
          "Estás un lugar fuera. Mueve las cifras exactamente tantos lugares como el exponente, contando desde el punto decimal.",
        ),
      },
      {
        id: "negative-value",
        detect(item, raw) {
          const v = num(raw);
          return v < 0 && same(-v, key(item));
        },
        feedback: L(
          "A negative exponent does not make the number negative. It makes it smaller: 10⁻¹ is one-tenth.",
          "Un exponente negativo no hace negativo el número. Lo hace más pequeño: 10⁻¹ es un décimo.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A bacterium is about 2.5 × 10⁻³ millimeters long. Write its length as a decimal, in millimeters.",
        "Una bacteria mide unos 2.5 × 10⁻³ milímetros. Escribe su longitud como decimal, en milímetros.",
      ),
      answers: ["0.0025"],
      kind: "number",
      hint: L(
        "10⁻³ means divide by 1,000.",
        "10⁻³ significa dividir entre 1000.",
      ),
      explanation: L(
        "2.5 ÷ 1,000 = 0.0025 mm: the digits move 3 places right.",
        "2,5 ÷ 1000 = 0,0025 mm: las cifras se mueven 3 lugares a la derecha.",
      ),
    },
  },

  "8:square-roots": {
    title: L(
      "Square roots of perfect squares",
      "Raíces cuadradas de cuadrados perfectos",
    ),
    concept: L(
      "The square root of n is the number that, multiplied by itself, gives n. Geometrically, √n is the side length of a square with area n.",
      "La raíz cuadrada de n es el número que, multiplicado por sí mismo, da n. Geométricamente, √n es el lado de un cuadrado de área n.",
    ),
    reasons: [
      L(
        "√49 is 7 because 7 × 7 makes 49: a 7-by-7 square has area 49.",
        "√49 es 7 porque 7 × 7 da 49: un cuadrado de 7 por 7 tiene área 49.",
      ),
      L(
        "Squaring and taking the square root undo each other.",
        "Elevar al cuadrado y sacar la raíz cuadrada se deshacen mutuamente.",
      ),
      L(
        "Knowing the squares 1², 2², …, 25² lets you recognize perfect squares quickly.",
        "Conocer los cuadrados 1², 2², …, 25² permite reconocer rápido los cuadrados perfectos.",
      ),
    ],
    misconception: L(
      "A square root is not half the number. √n times ITSELF must give n; check by multiplying.",
      "Una raíz cuadrada no es la mitad del número. √n por SÍ MISMA debe dar n; comprueba multiplicando.",
    ),
    misconceptions: [
      {
        id: "half",
        detect(item, raw) {
          const [n] = nums(item.question);
          const v = num(raw);
          return same(v, n / 2) && !same(v, key(item));
        },
        feedback: L(
          "You halved the number. A square root multiplied by ITSELF gives the number: test your answer × your answer.",
          "Dividiste el número entre 2. Una raíz cuadrada multiplicada por SÍ MISMA da el número: prueba tu respuesta × tu respuesta.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A square garden has an area of 196 square feet. How long is each side, in feet?",
        "Un jardín cuadrado tiene un área de 196 pies cuadrados. ¿Cuánto mide cada lado, en pies?",
      ),
      answers: ["14"],
      kind: "number",
      hint: L(
        "Which number times itself is 196?",
        "¿Qué número por sí mismo da 196?",
      ),
      explanation: L(
        "14 × 14 = 196, so √196 = 14 feet.",
        "14 × 14 = 196, así que √196 = 14 pies.",
      ),
    },
  },

  "8:linear-equations": {
    concept: L(
      "To solve a linear equation, isolate the variable by applying inverse operations to BOTH sides, in reverse order of operations. Each step produces an equivalent equation with the same solution.",
      "Para resolver una ecuación lineal, aísla la variable aplicando operaciones inversas a LOS DOS lados, en orden inverso al de las operaciones. Cada paso produce una ecuación equivalente con la misma solución.",
    ),
    reasons: [
      L(
        "Adding, subtracting, multiplying or dividing both sides by the same number (not 0) keeps the equation true.",
        "Sumar, restar, multiplicar o dividir los dos lados entre el mismo número (no 0) mantiene la ecuación verdadera.",
      ),
      L(
        "Undo the constant first, then the coefficient: the reverse of how the expression was built.",
        "Deshaz primero la constante y luego el coeficiente: al revés de como se construyó la expresión.",
      ),
      L(
        "Substitute the solution into the ORIGINAL equation to check.",
        "Sustituye la solución en la ecuación ORIGINAL para comprobar.",
      ),
    ],
    misconception: L(
      "Every operation must happen on both sides. Dividing only the right side, or subtracting only on the left, changes the equation.",
      "Cada operación debe hacerse en los dos lados. Dividir solo el lado derecho, o restar solo a la izquierda, cambia la ecuación.",
    ),
    misconceptions: EQUATION_MISCONCEPTIONS,
    transfer: {
      prompt: L(
        "The temperature is −22 °F and rises 4 degrees each hour. After how many hours will it be 10 °F? Solve 4h − 22 = 10.",
        "La temperatura es de −22 °F y sube 4 grados cada hora. ¿Después de cuántas horas será de 10 °F? Resuelve 4h − 22 = 10.",
      ),
      answers: ["8"],
      kind: "number",
      hint: L(
        "Undo the − 22 on both sides first.",
        "Deshaz primero el − 22 en los dos lados.",
      ),
      explanation: L(
        "4h − 22 = 10 → 4h = 32 → h = 8 hours.",
        "4h − 22 = 10 → 4h = 32 → h = 8 horas.",
      ),
    },
  },

  "8:slope": {
    concept: L(
      "Slope is the rate of change of a line: how much y changes for each 1-unit change in x. Between two points, slope = (change in y) ÷ (change in x) = (y₂ − y₁) ÷ (x₂ − x₁).",
      "La pendiente es la tasa de cambio de una recta: cuánto cambia y por cada cambio de 1 unidad en x. Entre dos puntos, pendiente = (cambio en y) ÷ (cambio en x) = (y₂ − y₁) ÷ (x₂ − x₁).",
    ),
    reasons: [
      L(
        "Slope triangles anywhere on the same line are similar, so rise ÷ run is the same everywhere on it.",
        "Los triángulos de pendiente en cualquier lugar de la misma recta son semejantes, así que subida ÷ avance es igual en toda ella.",
      ),
      L(
        "A line that goes down from left to right has a negative slope.",
        "Una recta que baja de izquierda a derecha tiene pendiente negativa.",
      ),
      L(
        "Subtract in the same order on top and bottom: both start from the same point.",
        "Resta en el mismo orden arriba y abajo: las dos restas empiezan en el mismo punto.",
      ),
    ],
    misconception: L(
      "Slope is rise over run: the change in y goes on TOP. Subtract the coordinates in the same order in the numerator and the denominator.",
      "La pendiente es subida sobre avance: el cambio en y va ARRIBA. Resta las coordenadas en el mismo orden en el numerador y el denominador.",
    ),
    misconceptions: [
      {
        id: "run-over-rise",
        detect(item, raw) {
          const [x1, y1, x2, y2] = nums(item.question);
          const v = num(raw);
          return (
            y2 !== y1 && same(v, (x2 - x1) / (y2 - y1)) && !same(v, key(item))
          );
        },
        feedback: L(
          "You divided the change in x by the change in y. Slope is RISE over RUN: (change in y) ÷ (change in x).",
          "Dividiste el cambio en x entre el cambio en y. La pendiente es SUBIDA sobre AVANCE: (cambio en y) ÷ (cambio en x).",
        ),
      },
      {
        id: "sign",
        detect(item, raw) {
          const v = num(raw);
          const k = key(item);
          return k !== 0 && same(v, -k);
        },
        feedback: L(
          "The size is right but the sign is not. Subtract both coordinates in the same order, starting from the same point. Then check: does the line rise or fall from left to right?",
          "El tamaño es correcto pero el signo no. Resta las dos coordenadas en el mismo orden, empezando por el mismo punto. Luego comprueba: ¿la recta sube o baja de izquierda a derecha?",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A hiker is at an elevation of 1,200 m at 2 km along a trail and at 900 m at 8 km. What is the slope of the trail, in meters of elevation per kilometer?",
        "Una excursionista está a 1200 m de altura a los 2 km del sendero y a 900 m a los 8 km. ¿Cuál es la pendiente del sendero, en metros de altura por kilómetro?",
      ),
      answers: ["-50"],
      kind: "number",
      hint: L(
        "Change in elevation ÷ change in distance.",
        "Cambio de altura ÷ cambio de distancia.",
      ),
      explanation: L(
        "(900 − 1,200) ÷ (8 − 2) = −300 ÷ 6 = −50 m per km: downhill.",
        "(900 − 1200) ÷ (8 − 2) = −300 ÷ 6 = −50 m por km: cuesta abajo.",
      ),
    },
  },

  "8:functions": {
    title: L("Evaluate linear functions", "Evaluar funciones lineales"),
    concept: L(
      "A function assigns exactly one output to each input. For y = mx + b, multiply the input x by the rate m, then add the starting value b.",
      "Una función asigna exactamente una salida a cada entrada. Para y = mx + b, multiplica la entrada x por la tasa m y luego suma el valor inicial b.",
    ),
    reasons: [
      L(
        "Substitute the input for x everywhere it appears, keeping its sign; use parentheses for negatives: 5(−3).",
        "Sustituye la entrada en x donde aparezca, conservando su signo; usa paréntesis con los negativos: 5(−3).",
      ),
      L(
        "Multiplication comes before addition, so compute mx first.",
        "La multiplicación va antes que la suma, así que calcula mx primero.",
      ),
      L(
        "A table of inputs and outputs shows the same pairs as the points on the graph.",
        "Una tabla de entradas y salidas muestra las mismas parejas que los puntos de la gráfica.",
      ),
    ],
    misconception: L(
      "A negative input keeps its sign when you substitute. Write it in parentheses, like 5(−3), so the sign is not lost.",
      "Una entrada negativa conserva su signo al sustituirla. Escríbela entre paréntesis, como 5(−3), para no perder el signo.",
    ),
    misconceptions: [
      {
        id: "dropped-input-sign",
        detect(item, raw) {
          const m = clean(item.question).match(
            /y = (-?\d*)x ([+-]) (\d+), find y when x = (-?\d+)/,
          );
          if (!m) return false;
          const mm = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
          const b = (m[2] === "+" ? 1 : -1) * Number(m[3]);
          const x = Number(m[4]);
          const v = num(raw);
          return x < 0 && same(v, mm * -x + b) && !same(v, key(item));
        },
        feedback: L(
          "You used the input without its negative sign. Substitute it in parentheses, like 5(−3), then multiply using the sign rules.",
          "Usaste la entrada sin su signo negativo. Sustitúyela entre paréntesis, como 5(−3), y luego multiplica con las reglas de signos.",
        ),
      },
      {
        id: "added-rate",
        detect(item, raw) {
          const m = clean(item.question).match(
            /y = (-?\d*)x ([+-]) (\d+), find y when x = (-?\d+)/,
          );
          if (!m) return false;
          const mm = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
          const b = (m[2] === "+" ? 1 : -1) * Number(m[3]);
          const v = num(raw);
          return same(v, mm + Number(m[4]) + b) && !same(v, key(item));
        },
        feedback: L(
          "mx means m TIMES x. Multiply the input by the rate, then add the starting value.",
          "mx significa m POR x. Multiplica la entrada por la tasa y luego suma el valor inicial.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "A plumber charges y = 45x + 60 dollars for x hours of work. How much does a 3-hour job cost, in dollars?",
        "Un plomero cobra y = 45x + 60 dólares por x horas de trabajo. ¿Cuánto cuesta un trabajo de 3 horas, en dólares?",
      ),
      answers: ["195"],
      kind: "number",
      hint: L("Replace x with 3.", "Reemplaza x por 3."),
      explanation: L(
        "y = 45 × 3 + 60 = 135 + 60 = 195 dollars.",
        "y = 45 × 3 + 60 = 135 + 60 = 195 dólares.",
      ),
    },
  },

  "8:systems": {
    title: L(
      "Solve simple systems of equations",
      "Resolver sistemas de ecuaciones sencillos",
    ),
    concept: L(
      "A system of two equations asks for the values that make BOTH true at once: the point where the two lines cross. Adding x + y = a and x − y = b eliminates y, because +y and −y cancel.",
      "Un sistema de dos ecuaciones pide los valores que hacen verdaderas a LAS DOS a la vez: el punto donde se cruzan las dos rectas. Sumar x + y = a y x − y = b elimina y, porque +y y −y se cancelan.",
    ),
    reasons: [
      L(
        "Adding two true equations gives a true equation: (x + y) + (x − y) = a + b, so 2x = a + b.",
        "Sumar dos ecuaciones verdaderas da una ecuación verdadera: (x + y) + (x − y) = a + b, así que 2x = a + b.",
      ),
      L(
        "Then x = (a + b) ÷ 2, and substituting x back into either equation gives y.",
        "Entonces x = (a + b) ÷ 2, y al sustituir x en cualquiera de las ecuaciones se obtiene y.",
      ),
      L(
        "Check the pair in BOTH equations: a solution of only one is not a solution of the system.",
        "Comprueba la pareja en LAS DOS ecuaciones: una solución de una sola no es solución del sistema.",
      ),
    ],
    misconception: L(
      "After adding the equations you have 2x, not x: divide by 2. And make sure you report the variable that was asked for.",
      "Después de sumar las ecuaciones tienes 2x, no x: divide entre 2. Y asegúrate de dar la variable que se pidió.",
    ),
    misconceptions: [
      {
        id: "forgot-halve",
        detect(item, raw) {
          const [a, b] = nums(item.question);
          const v = num(raw);
          return same(v, a + b) && !same(v, key(item));
        },
        feedback: L(
          "Adding the equations gives 2x = a + b. You still need to divide by 2 to find x.",
          "Sumar las ecuaciones da 2x = a + b. Todavía tienes que dividir entre 2 para hallar x.",
        ),
      },
      {
        id: "found-y",
        detect(item, raw) {
          const [a, b] = nums(item.question);
          const v = num(raw);
          return same(v, (a - b) / 2) && !same(v, key(item));
        },
        feedback: L(
          "That value is y. The question asks for x: add the two equations so y cancels.",
          "Ese valor es y. La pregunta pide x: suma las dos ecuaciones para que y se cancele.",
        ),
      },
    ],
    transfer: {
      prompt: L(
        "Two numbers add to 30, and their difference is 8. What is the larger number?",
        "Dos números suman 30 y su diferencia es 8. ¿Cuál es el número mayor?",
      ),
      answers: ["19"],
      kind: "number",
      hint: L(
        "x + y = 30 and x − y = 8. Add them.",
        "x + y = 30 y x − y = 8. Súmalas.",
      ),
      explanation: L(
        "2x = 38, so x = 19 (and y = 11). Check: 19 + 11 = 30, 19 − 11 = 8.",
        "2x = 38, así que x = 19 (y y = 11). Comprueba: 19 + 11 = 30, 19 − 11 = 8.",
      ),
    },
  },
};
