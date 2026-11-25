// Misconception Detective: the 15 cases for grades 3-5. Authoring format is compact; cases.js expands it.
// lines: [en, es, fineEn, fineEs] (the two last items are the nudge for a line that is actually fine; the flawed line has none).
// cards: [kind e|a|o, en, es, noteEn, noteEs]. fix: three [en, es] pairs with the correct one at index `right`.
export const CASES_35 = [
  {
    id: "m35-perimeter",
    subject: "math",
    flaw: "calc",
    concept: "perimeter of a rectangle",
    title: ["Maya's perimeter", "El perímetro de Maya"],
    speaker: "Maya",
    lines: [
      [
        "Maya has a rectangle that is 6 cm long and 4 cm wide.",
        "Maya tiene un rectángulo de 6 cm de largo y 4 cm de ancho.",
        "This line only describes the shape. The numbers it gives are the ones used later.",
        "Esta línea solo describe la figura. Los números que da son los que se usan después.",
      ],
      [
        "Perimeter is the distance all the way around the outside of a shape.",
        "El perímetro es la distancia alrededor del borde de una figura.",
        "That is what perimeter means: the distance around the outside.",
        "Eso es lo que significa perímetro: la distancia alrededor del borde.",
      ],
      [
        "A rectangle has two sides of 6 cm and two sides of 4 cm, so Maya adds 6 + 6 + 4 + 4 = 20.",
        "Un rectángulo tiene dos lados de 6 cm y dos de 4 cm, así que Maya suma 6 + 6 + 4 + 4 = 20.",
        "Check the adding: 6 + 6 is 12, 4 + 4 is 8, and 12 + 8 is 20. This line is correct.",
        "Revisa la suma: 6 + 6 es 12, 4 + 4 es 8 y 12 + 8 es 20. Esta línea es correcta.",
      ],
      [
        "So the perimeter of the rectangle is 24 cm.",
        "Entonces el perímetro del rectángulo es 24 cm.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "Adding the four sides, 6 + 6 + 4 + 4, gives 20.",
        "Al sumar los cuatro lados, 6 + 6 + 4 + 4, da 20.",
        "We can check this by adding the sides.",
        "Podemos comprobarlo sumando los lados.",
      ],
      [
        "e",
        "A string laid around the edge of the rectangle would measure 20 cm.",
        "Un hilo puesto alrededor del borde del rectángulo mediría 20 cm.",
        "We can check this by measuring with a string and a ruler.",
        "Podemos comprobarlo midiendo con un hilo y una regla.",
      ],
      [
        "a",
        "Maya feels that 24 looks like the right answer.",
        "Maya siente que 24 parece la respuesta correcta.",
        "A feeling about which number looks right is not something we can check.",
        "Una sensación sobre qué número parece correcto no se puede comprobar.",
      ],
      [
        "o",
        "The rectangle is drawn on blue paper.",
        "El rectángulo está dibujado en papel azul.",
        "The color of the paper does not change the perimeter.",
        "El color del papel no cambia el perímetro.",
      ],
    ],
    fix: [
      ["The perimeter is 10 cm, because 6 + 4 = 10.", "El perímetro es 10 cm, porque 6 + 4 = 10."],
      [
        "The perimeter is 20 cm, because 6 + 6 + 4 + 4 = 20.",
        "El perímetro es 20 cm, porque 6 + 6 + 4 + 4 = 20.",
      ],
      ["The perimeter is 24 cm, because 6 × 4 = 24.", "El perímetro es 24 cm, porque 6 × 4 = 24."],
    ],
    right: 1,
    why: [
      "Perimeter is found by adding all the sides: 6 + 6 + 4 + 4 = 20 cm. Maya added correctly but wrote 24, which is the area (6 × 4 = 24 square centimeters). Area and perimeter are different measurements.",
      "El perímetro se halla sumando todos los lados: 6 + 6 + 4 + 4 = 20 cm. Maya sumó bien pero escribió 24, que es el área (6 × 4 = 24 centímetros cuadrados). El área y el perímetro son medidas distintas.",
    ],
    accept: "perimeter perímetro perimetro sides lados add adding added sum total 20",
    focus: ["the total Maya gives for the perimeter", "el total que Maya da para el perímetro"],
    terms: [
      ["perimeter", "perímetro", "the distance around the outside of a shape"],
      ["rectangle", "rectángulo", "a shape with four sides and four square corners"],
    ],
    transfer: [
      "Zeke says a square with 5 cm sides has a perimeter of 25 cm. What would you check first, and how?",
      "Zeke dice que un cuadrado de 5 cm por lado tiene un perímetro de 25 cm. ¿Qué revisarías primero y cómo?",
    ],
    calc: [
      ["6+6+4+4", 20],
      ["6*4", 24],
    ],
  },
  {
    id: "m35-fraction-size",
    subject: "math",
    flaw: "overgeneral",
    concept: "comparing unit fractions",
    title: ["Pizza slices", "Rebanadas de pizza"],
    speaker: "Noah",
    lines: [
      [
        "Noah compares 1/4 of a pizza with 1/8 of the same pizza.",
        "Noah compara 1/4 de una pizza con 1/8 de la misma pizza.",
        "Both fractions are about the same pizza, so this is a fair comparison.",
        "Las dos fracciones son de la misma pizza, así que es una comparación justa.",
      ],
      [
        "Cutting a pizza into 4 equal slices makes each slice 1/4 of the pizza.",
        "Al cortar una pizza en 4 rebanadas iguales, cada rebanada es 1/4 de la pizza.",
        "Four equal parts means each part is 1/4. This line is correct.",
        "Cuatro partes iguales significa que cada parte es 1/4. Esta línea es correcta.",
      ],
      [
        "Cutting it into 8 equal slices makes each slice 1/8 of the pizza.",
        "Al cortarla en 8 rebanadas iguales, cada rebanada es 1/8 de la pizza.",
        "Eight equal parts means each part is 1/8. This line is correct.",
        "Ocho partes iguales significa que cada parte es 1/8. Esta línea es correcta.",
      ],
      [
        "Since 8 is bigger than 4, a slice that is 1/8 is bigger than a slice that is 1/4.",
        "Como 8 es mayor que 4, una rebanada de 1/8 es más grande que una de 1/4.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "If you fold one paper circle into 4 equal parts and another into 8 equal parts, each of the 8 parts is smaller.",
        "Si doblas un círculo de papel en 4 partes iguales y otro en 8 partes iguales, cada una de las 8 partes es más pequeña.",
        "We can check this by folding paper and comparing the parts.",
        "Podemos comprobarlo doblando papel y comparando las partes.",
      ],
      [
        "e",
        "Four children sharing one pizza get bigger slices than eight children sharing the same pizza.",
        "Cuatro niños que comparten una pizza reciben rebanadas más grandes que ocho niños que comparten la misma pizza.",
        "We can check this by cutting and comparing, or by drawing it.",
        "Podemos comprobarlo cortando y comparando, o dibujándolo.",
      ],
      [
        "a",
        "Noah believes that bigger numbers always mean bigger pieces.",
        "Noah cree que los números más grandes siempre significan trozos más grandes.",
        "A belief about numbers is not evidence until we test it.",
        "Una creencia sobre los números no es evidencia hasta que la probamos.",
      ],
      [
        "o",
        "The pizza has pepperoni on one side.",
        "La pizza tiene pepperoni de un lado.",
        "Toppings do not change how big the slices are.",
        "Los ingredientes no cambian el tamaño de las rebanadas.",
      ],
    ],
    fix: [
      [
        "A slice that is 1/4 is bigger than a slice that is 1/8, because cutting a whole into more equal parts makes each part smaller.",
        "Una rebanada de 1/4 es más grande que una de 1/8, porque al cortar un entero en más partes iguales cada parte es más pequeña.",
      ],
      [
        "The slices are the same size, because both are slices of the same pizza.",
        "Las rebanadas son del mismo tamaño, porque las dos son de la misma pizza.",
      ],
      [
        "A slice that is 1/8 is bigger, because 8 is a bigger number than 4.",
        "Una rebanada de 1/8 es más grande, porque 8 es un número mayor que 4.",
      ],
    ],
    right: 0,
    why: [
      "The bottom number tells how many equal parts the whole is cut into. More parts means smaller parts, so 1/8 is smaller than 1/4. A bigger bottom number does not mean a bigger fraction.",
      "El número de abajo dice en cuántas partes iguales se corta el entero. Más partes significa partes más pequeñas, así que 1/8 es menor que 1/4. Un número de abajo más grande no significa una fracción más grande.",
    ],
    accept:
      "fraction fractions slice slices piece pieces parts equal eighth fourth smaller denominator bottom 1/8 1/4",
    focus: [
      "the size comparison Noah makes between two slices",
      "la comparación de tamaño que hace Noah entre dos rebanadas",
    ],
    terms: [
      ["fraction", "fracción", "a number that names equal parts of a whole"],
      ["equal parts", "partes iguales", "pieces that are exactly the same size"],
    ],
    transfer: [
      "A friend says 1/3 of a candy bar is smaller than 1/6 of the same bar because 3 is smaller than 6. How could you test that?",
      "Un amigo dice que 1/3 de una barra de dulce es menor que 1/6 de la misma barra porque 3 es menor que 6. ¿Cómo podrías probarlo?",
    ],
  },
  {
    id: "m35-order-ops",
    subject: "math",
    flaw: "fact",
    concept: "order of operations",
    title: ["Which step first?", "¿Qué paso va primero?"],
    speaker: "Ira",
    lines: [
      [
        "Ira solves 2 + 3 × 4. She remembers that multiplication comes before addition.",
        "Ira resuelve 2 + 3 × 4. Recuerda que la multiplicación va antes que la suma.",
        "Multiplying before adding is the order-of-operations rule, so this line is right.",
        "Multiplicar antes de sumar es la regla del orden de las operaciones, así que esta línea es correcta.",
      ],
      [
        "First she multiplies: 3 × 4 = 12.",
        "Primero multiplica: 3 × 4 = 12.",
        "3 × 4 really is 12. This line is correct.",
        "3 × 4 sí es 12. Esta línea es correcta.",
      ],
      [
        "Then she adds: 2 + 12 = 14.",
        "Luego suma: 2 + 12 = 14.",
        "2 + 12 really is 14. This line is correct.",
        "2 + 12 sí es 14. Esta línea es correcta.",
      ],
      [
        "So the answer is 20, because 2 + 3 = 5 and 5 × 4 = 20.",
        "Entonces la respuesta es 20, porque 2 + 3 = 5 y 5 × 4 = 20.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "2 + 3 × 4 means 2 plus four groups of 3, which is 2 + 12 = 14.",
        "2 + 3 × 4 significa 2 más cuatro grupos de 3, que es 2 + 12 = 14.",
        "We can check this by drawing the groups and counting.",
        "Podemos comprobarlo dibujando los grupos y contando.",
      ],
      [
        "e",
        "A calculator that follows the order of operations shows 14 for 2 + 3 × 4.",
        "Una calculadora que sigue el orden de las operaciones muestra 14 para 2 + 3 × 4.",
        "We can check this by typing it into a calculator.",
        "Podemos comprobarlo escribiéndolo en una calculadora.",
      ],
      [
        "a",
        "Ira thinks adding first just feels more natural.",
        "Ira piensa que sumar primero se siente más natural.",
        "How natural a step feels is an opinion, not something we can check.",
        "Qué tan natural se siente un paso es una opinión, no algo que se pueda comprobar.",
      ],
      [
        "o",
        "Ira solved this problem during math class on Tuesday.",
        "Ira resolvió este problema en la clase de matemáticas el martes.",
        "The day does not change the answer.",
        "El día no cambia la respuesta.",
      ],
    ],
    fix: [
      [
        "The answer is 20, because you always work from left to right.",
        "La respuesta es 20, porque siempre se trabaja de izquierda a derecha.",
      ],
      ["The answer is 24, because 2 × 3 × 4 = 24.", "La respuesta es 24, porque 2 × 3 × 4 = 24."],
      [
        "The answer is 14, because 3 × 4 = 12 comes first and then 2 + 12 = 14.",
        "La respuesta es 14, porque primero va 3 × 4 = 12 y luego 2 + 12 = 14.",
      ],
    ],
    right: 2,
    why: [
      "Multiplication is done before addition. So 3 × 4 = 12 first, and then 2 + 12 = 14. Ira's own steps gave 14. The answer 20 comes from adding 2 + 3 first, which would only be right if there were parentheses: (2 + 3) × 4.",
      "La multiplicación se hace antes que la suma. Primero 3 × 4 = 12 y luego 2 + 12 = 14. Los pasos de Ira daban 14. La respuesta 20 sale de sumar 2 + 3 primero, lo cual solo sería correcto con paréntesis: (2 + 3) × 4.",
    ],
    accept:
      "order operations multiply multiplication multiplied 14 20 parentheses add addition first",
    focus: ["the final answer Ira reports", "la respuesta final que da Ira"],
    terms: [
      ["multiply", "multiplicar", "to find the total of equal groups"],
      [
        "order of operations",
        "orden de las operaciones",
        "the rules that say which step to do first",
      ],
    ],
    transfer: [
      "Rui says 10 − 2 × 3 equals 24. Which step would you check first, and why?",
      "Rui dice que 10 − 2 × 3 es igual a 24. ¿Qué paso revisarías primero y por qué?",
    ],
    calc: [
      ["2+3*4", 14],
      ["(2+3)*4", 20],
    ],
  },
  {
    id: "m35-place-value",
    subject: "math",
    flaw: "calc",
    concept: "place value",
    title: ["Breaking apart 3,482", "Descomponer 3,482"],
    speaker: "Dev",
    lines: [
      [
        "Dev breaks apart the number 3,482 by place value.",
        "Dev descompone el número 3,482 por valor posicional.",
        "This line only says what Dev is doing, which is a good way to read a number.",
        "Esta línea solo dice lo que hace Dev, que es una buena manera de leer un número.",
      ],
      [
        "The 3 is in the thousands place, so it is worth 3,000.",
        "El 3 está en el lugar de los millares, así que vale 3,000.",
        "The first digit of a four-digit number is in the thousands place. This line is correct.",
        "El primer dígito de un número de cuatro cifras está en los millares. Esta línea es correcta.",
      ],
      [
        "The 4 is in the hundreds place, so it is worth 40.",
        "El 4 está en el lugar de las centenas, así que vale 40.",
      ],
      [
        "The 8 is in the tens place, so it is worth 80, and the 2 is in the ones place, so it is worth 2.",
        "El 8 está en el lugar de las decenas, así que vale 80, y el 2 está en el lugar de las unidades, así que vale 2.",
        "8 tens is 80 and 2 ones is 2. This line is correct.",
        "8 decenas son 80 y 2 unidades son 2. Esta línea es correcta.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "3,000 + 400 + 80 + 2 = 3,482, so the parts must add up to the whole number.",
        "3,000 + 400 + 80 + 2 = 3,482, así que las partes deben sumar el número completo.",
        "We can check this by adding the parts.",
        "Podemos comprobarlo sumando las partes.",
      ],
      [
        "e",
        "On a place-value chart, the hundreds column is the third column from the right.",
        "En una tabla de valor posicional, la columna de las centenas es la tercera desde la derecha.",
        "We can check this by looking at the chart.",
        "Podemos comprobarlo mirando la tabla.",
      ],
      [
        "a",
        "Dev thinks small numbers like 40 are easier to say.",
        "Dev piensa que los números pequeños como 40 son más fáciles de decir.",
        "What is easier to say is a preference, not evidence.",
        "Lo que es más fácil de decir es una preferencia, no evidencia.",
      ],
      [
        "o",
        "Dev wrote the number on a sticky note.",
        "Dev escribió el número en una nota adhesiva.",
        "The paper does not change the digits.",
        "El papel no cambia los dígitos.",
      ],
    ],
    fix: [
      [
        "The 4 is in the tens place, so it is worth 4.",
        "El 4 está en el lugar de las decenas, así que vale 4.",
      ],
      [
        "The 4 is in the hundreds place, so it is worth 400.",
        "El 4 está en el lugar de las centenas, así que vale 400.",
      ],
      [
        "The 4 is in the hundreds place, so it is worth 4.",
        "El 4 está en el lugar de las centenas, así que vale 4.",
      ],
    ],
    right: 1,
    why: [
      "Dev named the place correctly: the 4 is in the hundreds place. But 4 hundreds is 400, not 40. The parts must add to the whole: 3,000 + 400 + 80 + 2 = 3,482. With 40 they would only add to 3,122.",
      "Dev nombró bien el lugar: el 4 está en las centenas. Pero 4 centenas son 400, no 40. Las partes deben sumar el total: 3,000 + 400 + 80 + 2 = 3,482. Con 40 solo sumarían 3,122.",
    ],
    accept: "hundreds hundred centenas 400 place value digit 40 worth",
    focus: ["what the digit 4 is worth", "cuánto vale el dígito 4"],
    terms: [
      [
        "place value",
        "valor posicional",
        "how much a digit is worth because of where it sits in a number",
      ],
      ["digit", "dígito", "one of the symbols 0 to 9 used to write numbers"],
    ],
    transfer: [
      "Ana says the 6 in 5,162 is worth 600. How could you check her claim using place value?",
      "Ana dice que el 6 en 5,162 vale 600. ¿Cómo podrías comprobarlo usando el valor posicional?",
    ],
    calc: [
      ["3000+400+80+2", 3482],
      ["3000+40+80+2", 3122],
    ],
  },
  {
    id: "s35-seasons",
    subject: "science",
    flaw: "cause",
    concept: "causes of the seasons",
    title: ["Why is it summer?", "¿Por qué es verano?"],
    speaker: "Rosa",
    lines: [
      [
        "Earth takes about 365 days to travel once around the sun.",
        "La Tierra tarda unos 365 días en dar una vuelta alrededor del sol.",
        "One trip around the sun is one year, about 365 days. This line is correct.",
        "Una vuelta alrededor del sol es un año, unos 365 días. Esta línea es correcta.",
      ],
      [
        "Summer happens because Earth moves closer to the sun in that part of its trip.",
        "El verano ocurre porque la Tierra se acerca más al sol en esa parte de su recorrido.",
      ],
      [
        "In summer, the days are longer, so the ground gets more hours of sunlight.",
        "En verano los días son más largos, así que el suelo recibe más horas de luz solar.",
        "Longer summer days do mean more hours of sunlight. This line is correct.",
        "Los días largos del verano sí significan más horas de luz solar. Esta línea es correcta.",
      ],
      [
        "When it is summer in the Northern Hemisphere, it is winter in the Southern Hemisphere.",
        "Cuando es verano en el hemisferio norte, es invierno en el hemisferio sur.",
        "The two halves of Earth have opposite seasons. This line is true.",
        "Las dos mitades de la Tierra tienen estaciones opuestas. Esta línea es verdadera.",
      ],
    ],
    flawed: 1,
    cards: [
      [
        "e",
        "When it is summer in Maryland, it is winter in Australia at the same time.",
        "Cuando es verano en Maryland, es invierno en Australia al mismo tiempo.",
        "We can check this in a calendar or weather report from both places.",
        "Podemos comprobarlo en un calendario o un reporte del clima de ambos lugares.",
      ],
      [
        "e",
        "Earth is actually closest to the sun in early January, which is winter in the north.",
        "En realidad la Tierra está más cerca del sol a principios de enero, que es invierno en el norte.",
        "We can check this in an astronomy source.",
        "Podemos comprobarlo en una fuente de astronomía.",
      ],
      [
        "a",
        "Rosa feels that a closer sun has to be hotter.",
        "Rosa siente que un sol más cercano tiene que ser más caliente.",
        "A feeling about what must be true is not a measurement.",
        "Una sensación sobre lo que tiene que ser verdad no es una medición.",
      ],
      [
        "o",
        "Many families go to the beach in summer.",
        "Muchas familias van a la playa en verano.",
        "This is true, but it does not help explain why summer happens.",
        "Es verdad, pero no ayuda a explicar por qué ocurre el verano.",
      ],
    ],
    fix: [
      [
        "Summer happens because that part of Earth is tilted toward the sun, so sunlight is more direct and the days are longer.",
        "El verano ocurre porque esa parte de la Tierra está inclinada hacia el sol, así que la luz es más directa y los días son más largos.",
      ],
      [
        "Summer happens because the sun gets bigger and hotter in that part of the year.",
        "El verano ocurre porque el sol se hace más grande y más caliente en esa época del año.",
      ],
      [
        "Summer happens because Earth spins faster during that part of the year.",
        "El verano ocurre porque la Tierra gira más rápido en esa época del año.",
      ],
    ],
    right: 0,
    why: [
      "Seasons are caused by Earth's tilt, not by its distance from the sun. The half of Earth tilted toward the sun gets more direct sunlight and longer days, so it is summer there while it is winter in the other half. If distance mattered, both halves would have summer together.",
      "Las estaciones se deben a la inclinación de la Tierra, no a su distancia del sol. La mitad inclinada hacia el sol recibe luz más directa y días más largos, así que allí es verano mientras en la otra mitad es invierno. Si importara la distancia, las dos mitades tendrían verano a la vez.",
    ],
    accept: "tilt tilted tilts axis closer distance sunlight hemisphere hemispheres season seasons",
    focus: ["the reason Rosa gives for summer", "la razón que Rosa da para el verano"],
    terms: [
      ["tilt", "inclinación", "to lean to one side"],
      ["hemisphere", "hemisferio", "one half of Earth, north or south of the equator"],
      ["orbit", "órbita", "the path one object takes around another"],
    ],
    transfer: [
      "A friend says winter is cold because Earth is far from the sun. What fact could you use to test that idea?",
      "Un amigo dice que el invierno es frío porque la Tierra está lejos del sol. ¿Qué dato podrías usar para probar esa idea?",
    ],
  },
  {
    id: "s35-plant-soil",
    subject: "science",
    flaw: "assumption",
    concept: "how plants get food",
    title: ["Does the plant eat soil?", "¿La planta se come la tierra?"],
    speaker: "Ben",
    lines: [
      [
        "Ben plants a bean seed in a cup of soil and waters it every day.",
        "Ben planta una semilla de frijol en un vaso con tierra y la riega todos los días.",
        "This line describes what Ben did, which is a fair test setup.",
        "Esta línea describe lo que hizo Ben, que es una buena preparación para una prueba.",
      ],
      [
        "After three weeks the bean plant is tall and green.",
        "Después de tres semanas la planta de frijol está alta y verde.",
        "Ben observed this, and bean plants do grow tall in three weeks.",
        "Ben lo observó, y las plantas de frijol sí crecen mucho en tres semanas.",
      ],
      [
        "The plant grew because it ate the soil in the cup.",
        "La planta creció porque se comió la tierra del vaso.",
      ],
      [
        "The roots take in water from the soil, and the leaves use sunlight to help make food.",
        "Las raíces absorben agua de la tierra y las hojas usan la luz del sol para ayudar a hacer alimento.",
        "Roots do take in water, and leaves do use sunlight. This line is correct.",
        "Las raíces sí absorben agua y las hojas sí usan la luz del sol. Esta línea es correcta.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "Plants grown with their roots in water and no soil at all can still grow if they get light.",
        "Las plantas con las raíces en agua y sin nada de tierra pueden crecer si reciben luz.",
        "We can check this by growing a plant in water.",
        "Podemos comprobarlo cultivando una planta en agua.",
      ],
      [
        "e",
        "When soil is weighed before and after a plant grows in it, the soil weighs almost the same.",
        "Cuando se pesa la tierra antes y después de que crezca una planta en ella, pesa casi lo mismo.",
        "We can check this with a scale.",
        "Podemos comprobarlo con una balanza.",
      ],
      [
        "a",
        "It seems to Ben that soil is the plant's dinner, because the roots are in it.",
        "A Ben le parece que la tierra es la cena de la planta, porque las raíces están en ella.",
        "A guess based on where the roots are is not a test.",
        "Una suposición basada en dónde están las raíces no es una prueba.",
      ],
      [
        "o",
        "Ben's cup is a yellow paper cup.",
        "El vaso de Ben es un vaso de papel amarillo.",
        "The color of the cup does not matter to how the plant grows.",
        "El color del vaso no influye en cómo crece la planta.",
      ],
    ],
    fix: [
      [
        "The plant grew because it took in the soil, one tiny bit at a time.",
        "La planta creció porque absorbió la tierra, poquito a poquito.",
      ],
      [
        "The plant grew because it ate the water, which is its food.",
        "La planta creció porque se comió el agua, que es su alimento.",
      ],
      [
        "The plant grew because it made its own food from sunlight, water and air; the soil only gives it water and minerals.",
        "La planta creció porque hizo su propio alimento con luz del sol, agua y aire; la tierra solo le da agua y minerales.",
      ],
    ],
    right: 2,
    why: [
      "Plants make their own food in their leaves using sunlight, water and carbon dioxide from the air. This is called photosynthesis. Soil gives water and a few minerals, but the plant does not eat it. That is why plants can grow in water alone and the soil weighs almost the same afterward.",
      "Las plantas hacen su propio alimento en las hojas con luz del sol, agua y dióxido de carbono del aire. Esto se llama fotosíntesis. La tierra da agua y algunos minerales, pero la planta no se la come. Por eso las plantas pueden crecer solo en agua y la tierra pesa casi igual después.",
    ],
    accept: "soil food sunlight photosynthesis light make makes air water leaves roots",
    focus: ["where the plant's growth comes from", "de dónde viene el crecimiento de la planta"],
    terms: [
      ["roots", "raíces", "the parts of a plant that grow underground and take in water"],
      ["photosynthesis", "fotosíntesis", "how plants use sunlight, water and air to make food"],
      ["minerals", "minerales", "tiny natural materials in soil that plants need a little of"],
    ],
    transfer: [
      "A friend says a tree gets bigger because it eats the ground. What could you weigh or test to check?",
      "Un amigo dice que un árbol crece porque se come el suelo. ¿Qué podrías pesar o probar para comprobarlo?",
    ],
  },
  {
    id: "s35-air-matter",
    subject: "science",
    flaw: "assumption",
    concept: "air is matter",
    title: ["Is air matter?", "¿El aire es materia?"],
    speaker: "Lena",
    lines: [
      [
        "Matter is anything that has mass and takes up space.",
        "La materia es todo lo que tiene masa y ocupa espacio.",
        "This is the scientific meaning of matter. This line is correct.",
        "Este es el significado científico de materia. Esta línea es correcta.",
      ],
      [
        "When Lena blows air into a balloon, the balloon gets bigger.",
        "Cuando Lena sopla aire en un globo, el globo se hace más grande.",
        "A balloon really does get bigger when air goes in. Lena saw this herself.",
        "Un globo sí se hace más grande cuando entra aire. Lena lo vio ella misma.",
      ],
      [
        "Air is not matter, because you cannot see it.",
        "El aire no es materia, porque no se puede ver.",
      ],
      [
        "A glass of water and a rock are both matter.",
        "Un vaso de agua y una roca son materia.",
        "Water and rock have mass and take up space, so both are matter.",
        "El agua y la roca tienen masa y ocupan espacio, así que ambas son materia.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "A balloon full of air weighs a little more than the same balloon with no air in it.",
        "Un globo lleno de aire pesa un poco más que el mismo globo sin aire.",
        "We can check this with a sensitive scale.",
        "Podemos comprobarlo con una balanza sensible.",
      ],
      [
        "e",
        "A balloon gets bigger when air is pushed in, so air takes up space.",
        "Un globo se hace más grande cuando se le mete aire, así que el aire ocupa espacio.",
        "We can check this by watching the balloon.",
        "Podemos comprobarlo observando el globo.",
      ],
      [
        "a",
        "Lena thinks anything invisible must be nothing.",
        "Lena piensa que todo lo invisible debe ser nada.",
        "This is an assumption. Being invisible does not tell us if something has mass.",
        "Es una suposición. Ser invisible no nos dice si algo tiene masa.",
      ],
      [
        "o",
        "Lena's balloon is red.",
        "El globo de Lena es rojo.",
        "The color of the balloon does not matter here.",
        "El color del globo no importa aquí.",
      ],
    ],
    fix: [
      [
        "Air is matter only when it is moving, like wind.",
        "El aire es materia solo cuando se mueve, como el viento.",
      ],
      [
        "Air is matter, because it takes up space (it fills the balloon) and has mass.",
        "El aire es materia, porque ocupa espacio (llena el globo) y tiene masa.",
      ],
      [
        "Air is not matter, because it has no color.",
        "El aire no es materia, porque no tiene color.",
      ],
    ],
    right: 1,
    why: [
      "Matter is defined by mass and space, not by whether we can see it. Air fills a balloon, so it takes up space, and a full balloon weighs a little more than an empty one, so air has mass. Many kinds of matter, like air and other gases, are invisible.",
      "La materia se define por la masa y el espacio, no por si la podemos ver. El aire llena un globo, así que ocupa espacio, y un globo lleno pesa un poco más que uno vacío, así que el aire tiene masa. Muchos tipos de materia, como el aire y otros gases, son invisibles.",
    ],
    accept: "air matter space mass balloon see invisible gas weighs",
    focus: ["the reason Lena gives about air", "la razón que Lena da sobre el aire"],
    terms: [
      ["matter", "materia", "anything that has mass and takes up space"],
      ["mass", "masa", "how much matter something has"],
      ["gas", "gas", "a kind of matter that spreads out to fill its container"],
    ],
    transfer: [
      "A friend says steam is not matter because it disappears. What test could show whether steam takes up space?",
      "Un amigo dice que el vapor no es materia porque desaparece. ¿Qué prueba podría mostrar si el vapor ocupa espacio?",
    ],
  },
  {
    id: "s35-falling",
    subject: "science",
    flaw: "overgeneral",
    concept: "falling objects and air",
    title: ["Book and paper", "El libro y el papel"],
    speaker: "Tomás",
    lines: [
      [
        "Tomás drops a heavy book and a light sheet of paper at the same time.",
        "Tomás deja caer al mismo tiempo un libro pesado y una hoja de papel ligera.",
        "This line describes the test. Dropping both at the same time is a fair way to compare.",
        "Esta línea describe la prueba. Soltar los dos al mismo tiempo es una forma justa de comparar.",
      ],
      [
        "The book lands first.",
        "El libro llega primero al suelo.",
        "Tomás observed this, and a book really does land before the paper does.",
        "Tomás lo observó, y un libro sí llega al suelo antes que el papel.",
      ],
      [
        "So heavier things always fall faster than lighter things.",
        "Entonces las cosas más pesadas siempre caen más rápido que las más ligeras.",
      ],
      [
        "Next he crumples the paper into a tight ball and drops it with the book, and they land at almost the same time.",
        "Luego arruga el papel en una bola apretada y lo suelta junto con el libro, y llegan casi al mismo tiempo.",
        "This was a second test, and what he saw is what usually happens.",
        "Fue una segunda prueba, y lo que vio es lo que suele pasar.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "A crumpled ball of paper and a book dropped together land at almost the same time.",
        "Una bola de papel arrugado y un libro soltados juntos llegan casi al mismo tiempo.",
        "We can check this by dropping them.",
        "Podemos comprobarlo dejándolos caer.",
      ],
      [
        "e",
        "In a space with no air, a feather and a hammer dropped together land at the same time.",
        "En un espacio sin aire, una pluma y un martillo soltados juntos llegan al mismo tiempo.",
        "Astronauts showed this on the Moon, and we can check it in a vacuum chamber.",
        "Los astronautas lo mostraron en la Luna, y se puede comprobar en una cámara de vacío.",
      ],
      [
        "a",
        "Tomás thinks it is obvious that heavy things fall fastest.",
        "Tomás piensa que es obvio que las cosas pesadas caen más rápido.",
        "Saying something is obvious is not evidence.",
        "Decir que algo es obvio no es evidencia.",
      ],
      [
        "o",
        "The book is about animals.",
        "El libro trata de animales.",
        "What the book is about does not change how it falls.",
        "De qué trata el libro no cambia cómo cae.",
      ],
    ],
    fix: [
      [
        "The paper fell slower because it was lighter, and weight is the only thing that matters.",
        "El papel cayó más lento porque era más ligero, y el peso es lo único que importa.",
      ],
      [
        "Light things fall faster, because the air pushes them down.",
        "Las cosas ligeras caen más rápido, porque el aire las empuja hacia abajo.",
      ],
      [
        "Air pushes up more on a flat sheet of paper than on a book or a paper ball, so the shape of an object, not only its weight, changes how fast it falls.",
        "El aire empuja hacia arriba más a una hoja plana que a un libro o a una bola de papel, así que la forma de un objeto, y no solo su peso, cambia qué tan rápido cae.",
      ],
    ],
    right: 2,
    why: [
      "Air pushes against falling objects. A flat sheet catches a lot of air, so it falls slowly. The same paper crumpled into a ball catches less air and falls almost as fast as the book. With no air at all, a feather and a hammer fall together. So weight alone does not decide how fast things fall.",
      "El aire empuja contra los objetos que caen. Una hoja plana atrapa mucho aire, así que cae despacio. El mismo papel hecho bola atrapa menos aire y cae casi tan rápido como el libro. Sin aire, una pluma y un martillo caen juntos. Así que el peso solo no decide qué tan rápido cae algo.",
    ],
    accept: "air resistance shape flat crumpled ball weight heavier lighter always fall faster",
    focus: ["the rule Tomás makes from one drop", "la regla que Tomás saca de una sola caída"],
    terms: [
      ["air resistance", "resistencia del aire", "the push of air against a moving object"],
      ["crumple", "arrugar", "to squeeze paper into a ball"],
    ],
    transfer: [
      "A friend says a big balloon falls slowly because it is light. What could you change in a test to see if the shape matters?",
      "Un amigo dice que un globo grande cae despacio porque es ligero. ¿Qué podrías cambiar en una prueba para ver si importa la forma?",
    ],
  },
  {
    id: "s35-magnets",
    subject: "science",
    flaw: "overgeneral",
    concept: "which materials a magnet attracts",
    title: ["Magnet test", "Prueba con un imán"],
    speaker: "Zoe",
    lines: [
      [
        "Zoe tests objects with a magnet to see which ones stick.",
        "Zoe prueba objetos con un imán para ver cuáles se pegan.",
        "This line describes her test. Trying a magnet on objects is the right way to find out.",
        "Esta línea describe su prueba. Probar un imán con objetos es la forma correcta de averiguarlo.",
      ],
      [
        "A steel paper clip sticks to the magnet.",
        "Un clip de acero se pega al imán.",
        "Steel contains iron, so a steel paper clip does stick to a magnet.",
        "El acero contiene hierro, así que un clip de acero sí es atraído por el imán.",
      ],
      [
        "An iron nail sticks to the magnet.",
        "Un clavo de hierro se pega al imán.",
        "Iron is one of the metals a magnet attracts. This line is correct.",
        "El hierro es uno de los metales que atrae un imán. Esta línea es correcta.",
      ],
      [
        "So every metal object sticks to a magnet.",
        "Entonces todo objeto de metal se pega a un imán.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "A piece of aluminum foil does not stick to a magnet.",
        "Un trozo de papel de aluminio no se pega a un imán.",
        "We can check this with any magnet and foil.",
        "Podemos comprobarlo con cualquier imán y papel de aluminio.",
      ],
      [
        "e",
        "A gold ring does not stick to a magnet.",
        "Un anillo de oro no se pega a un imán.",
        "We can check this with a magnet.",
        "Podemos comprobarlo con un imán.",
      ],
      [
        "a",
        "Zoe thinks that since two metal things stuck, the rest must stick too.",
        "Zoe piensa que como dos cosas de metal se pegaron, las demás también deben pegarse.",
        "Two tests are not enough to know about all metals.",
        "Dos pruebas no bastan para saber de todos los metales.",
      ],
      [
        "o",
        "Zoe's magnet is shaped like a horseshoe.",
        "El imán de Zoe tiene forma de herradura.",
        "The shape of the magnet does not tell us which materials stick.",
        "La forma del imán no nos dice qué materiales se pegan.",
      ],
    ],
    fix: [
      [
        "Some metals, like iron and steel, stick to a magnet, but other metals, like aluminum and gold, do not.",
        "Algunos metales, como el hierro y el acero, se pegan a un imán, pero otros, como el aluminio y el oro, no.",
      ],
      [
        "Only paper clips and nails stick to magnets, because they are small.",
        "Solo los clips y los clavos se pegan a los imanes, porque son pequeños.",
      ],
      [
        "Every metal sticks to a magnet, but some magnets are too weak to show it.",
        "Todos los metales se pegan a un imán, pero algunos imanes son demasiado débiles para mostrarlo.",
      ],
    ],
    right: 0,
    why: [
      "Magnets attract only some metals, mainly iron, steel, nickel and cobalt. Aluminum, copper, gold and silver are metals that do not stick. Zoe tested two objects that both contain iron, and then made a rule about all metals. Testing more kinds of metal would have shown the difference.",
      "Los imanes atraen solo algunos metales, sobre todo hierro, acero, níquel y cobalto. El aluminio, el cobre, el oro y la plata son metales que no se pegan. Zoe probó dos objetos que contienen hierro y luego hizo una regla para todos los metales. Probar más tipos de metal habría mostrado la diferencia.",
    ],
    accept: "magnet magnets metal metals iron steel aluminum every all some stick",
    focus: [
      "the rule Zoe makes about all metal objects",
      "la regla que Zoe hace sobre todos los objetos de metal",
    ],
    terms: [
      ["magnet", "imán", "an object that pulls on iron and steel"],
      ["metal", "metal", "a hard, shiny material such as iron, gold or aluminum"],
    ],
    transfer: [
      "A friend tested two red objects, and both floated. She says all red objects float. How would you test her rule?",
      "Una amiga probó dos objetos rojos y los dos flotaron. Dice que todos los objetos rojos flotan. ¿Cómo probarías su regla?",
    ],
  },
  {
    id: "ss35-map-scale",
    subject: "social",
    flaw: "calc",
    concept: "using a map scale",
    title: ["How far apart?", "¿A qué distancia?"],
    speaker: "Amir",
    lines: [
      [
        "Amir's map has a scale that says 1 centimeter on the map equals 10 kilometers in real life.",
        "El mapa de Amir tiene una escala que dice que 1 centímetro en el mapa equivale a 10 kilómetros en la vida real.",
        "This is the scale printed on his map, and it is the key to the problem.",
        "Esta es la escala impresa en su mapa, y es la clave del problema.",
      ],
      [
        "On the map, the two towns are 3 centimeters apart.",
        "En el mapa, los dos pueblos están a 3 centímetros de distancia.",
        "This is a measurement from the map, and the number is used correctly later.",
        "Es una medida del mapa, y el número se usa bien después.",
      ],
      [
        "To find the real distance, he multiplies 3 × 10.",
        "Para hallar la distancia real, multiplica 3 × 10.",
        "Each centimeter stands for 10 kilometers, so multiplying is the right step.",
        "Cada centímetro representa 10 kilómetros, así que multiplicar es el paso correcto.",
      ],
      [
        "So the two towns are really 13 kilometers apart.",
        "Entonces los dos pueblos están en realidad a 13 kilómetros de distancia.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "Each centimeter on the map stands for 10 kilometers, so 3 centimeters stand for 30 kilometers.",
        "Cada centímetro en el mapa representa 10 kilómetros, así que 3 centímetros representan 30 kilómetros.",
        "We can check this by using the scale and multiplying.",
        "Podemos comprobarlo con la escala y multiplicando.",
      ],
      [
        "e",
        "The map scale is printed in the corner of the map.",
        "La escala del mapa está impresa en la esquina del mapa.",
        "We can check this by looking at the map.",
        "Podemos comprobarlo mirando el mapa.",
      ],
      [
        "a",
        "Amir feels that the towns look close, so 13 sounds right.",
        "Amir siente que los pueblos se ven cerca, así que 13 suena bien.",
        "How close towns look is a feeling, not a measurement.",
        "Qué tan cerca se ven los pueblos es una sensación, no una medida.",
      ],
      [
        "o",
        "The map shows a river in blue.",
        "El mapa muestra un río en azul.",
        "The river is not part of finding the distance between these two towns.",
        "El río no forma parte de hallar la distancia entre estos dos pueblos.",
      ],
    ],
    fix: [
      [
        "The towns are 7 kilometers apart, because 10 − 3 = 7.",
        "Los pueblos están a 7 kilómetros de distancia, porque 10 − 3 = 7.",
      ],
      [
        "The towns are 30 kilometers apart, because 3 × 10 = 30.",
        "Los pueblos están a 30 kilómetros de distancia, porque 3 × 10 = 30.",
      ],
      [
        "The towns are 13 kilometers apart, because 3 + 10 = 13.",
        "Los pueblos están a 13 kilómetros de distancia, porque 3 + 10 = 13.",
      ],
    ],
    right: 1,
    why: [
      "Amir chose the right step, multiplying 3 × 10, but then wrote the sum, 13, instead of the product. 3 × 10 = 30, so the towns are 30 kilometers apart. A scale tells how many real units one map unit stands for, so we multiply.",
      "Amir eligió el paso correcto, multiplicar 3 × 10, pero luego escribió la suma, 13, en vez del producto. 3 × 10 = 30, así que los pueblos están a 30 kilómetros. Una escala dice cuántas unidades reales representa una unidad del mapa, por eso se multiplica.",
    ],
    accept: "scale map distance kilometers kilometres 30 multiply multiplied times",
    focus: ["the real distance Amir reports", "la distancia real que informa Amir"],
    terms: [
      ["scale", "escala", "a map's rule for how map distance matches real distance"],
      ["kilometer", "kilómetro", "a unit of length: 1,000 meters"],
    ],
    transfer: [
      "On a map where 1 cm equals 5 km, a friend says 4 cm means 9 km. What is the mistake you would look for?",
      "En un mapa donde 1 cm equivale a 5 km, un amigo dice que 4 cm son 9 km. ¿Qué error buscarías?",
    ],
    calc: [
      ["3*10", 30],
      ["3+10", 13],
    ],
  },
  {
    id: "ss35-primary-source",
    subject: "social",
    flaw: "fact",
    concept: "primary and secondary sources",
    title: ["Primary or secondary?", "¿Primaria o secundaria?"],
    speaker: "Grace",
    lines: [
      [
        "A primary source is made by someone who saw or lived through an event, at the time it happened.",
        "Una fuente primaria la crea alguien que vio o vivió un suceso, en el momento en que ocurrió.",
        "This is the usual meaning of a primary source. This line is correct.",
        "Este es el significado habitual de fuente primaria. Esta línea es correcta.",
      ],
      [
        "A diary that a student wrote in 1920 is a primary source about life in 1920.",
        "Un diario que escribió un estudiante en 1920 es una fuente primaria sobre la vida en 1920.",
        "The student lived in 1920 and wrote at the time, so this is a primary source.",
        "El estudiante vivió en 1920 y escribió en ese momento, así que es una fuente primaria.",
      ],
      [
        "A textbook written last year about the 1920s is also a primary source.",
        "Un libro de texto escrito el año pasado sobre los años veinte también es una fuente primaria.",
      ],
      [
        "A photograph taken in 1920 is a primary source, too.",
        "Una fotografía tomada en 1920 también es una fuente primaria.",
        "A photo made at the time shows what the camera saw then, so it is a primary source.",
        "Una foto hecha en ese momento muestra lo que vio la cámara entonces, así que es una fuente primaria.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "The textbook was published last year, about 100 years after the 1920s.",
        "El libro de texto se publicó el año pasado, unos 100 años después de los años veinte.",
        "We can check this on the title page of the book.",
        "Podemos comprobarlo en la portada del libro.",
      ],
      [
        "e",
        "The textbook's author was not alive in the 1920s.",
        "El autor del libro de texto no estaba vivo en los años veinte.",
        "We can check this by looking up the author.",
        "Podemos comprobarlo buscando al autor.",
      ],
      [
        "a",
        "Grace thinks any book full of facts must be a primary source.",
        "Grace piensa que cualquier libro lleno de datos debe ser una fuente primaria.",
        "Having facts does not make a source primary. What matters is who made it and when.",
        "Tener datos no hace primaria a una fuente. Importa quién la hizo y cuándo.",
      ],
      [
        "o",
        "The textbook has a green cover.",
        "El libro de texto tiene la portada verde.",
        "The cover color does not tell us the kind of source.",
        "El color de la portada no nos dice qué tipo de fuente es.",
      ],
    ],
    fix: [
      [
        "A textbook written last year is a primary source, because it is about real events.",
        "Un libro de texto escrito el año pasado es una fuente primaria, porque trata de sucesos reales.",
      ],
      [
        "A textbook from last year is a primary source only if the author is a teacher.",
        "Un libro de texto del año pasado es una fuente primaria solo si el autor es maestro.",
      ],
      [
        "A textbook written last year is a secondary source, because its author was not there and wrote about the 1920s long afterward.",
        "Un libro de texto escrito el año pasado es una fuente secundaria, porque su autor no estuvo allí y escribió sobre los años veinte mucho después.",
      ],
    ],
    right: 2,
    why: [
      "A primary source comes from someone who was there at the time, like a diary or a photograph from 1920. A textbook written long afterward by someone who was not there is a secondary source: it explains and summarizes using other sources.",
      "Una fuente primaria viene de alguien que estuvo allí en ese momento, como un diario o una fotografía de 1920. Un libro de texto escrito mucho después por alguien que no estuvo allí es una fuente secundaria: explica y resume usando otras fuentes.",
    ],
    accept: "primary secondary source sources textbook author time later afterward there",
    focus: ["how Grace classifies the textbook", "cómo clasifica Grace el libro de texto"],
    terms: [
      ["primary source", "fuente primaria", "something made by a person who was there at the time"],
      [
        "secondary source",
        "fuente secundaria",
        "something written later that explains what other sources say",
      ],
      ["diary", "diario", "a book where a person writes about each day"],
    ],
    transfer: [
      "A friend says a museum poster written this year about the Civil War is a primary source. What two questions would you ask to test that?",
      "Un amigo dice que un cartel de museo escrito este año sobre la Guerra Civil es una fuente primaria. ¿Qué dos preguntas harías para probarlo?",
    ],
  },
  {
    id: "ss35-causes",
    subject: "social",
    flaw: "missing",
    concept: "events have more than one cause",
    title: ["Only one cause?", "¿Una sola causa?"],
    speaker: "Marcus",
    lines: [
      [
        "In the 1760s, Britain taxed the American colonies to help pay for its war debts.",
        "En la década de 1760, Gran Bretaña cobró impuestos a las colonias americanas para ayudar a pagar sus deudas de guerra.",
        "Britain did tax the colonies in the 1760s to pay war debts. This line is correct.",
        "Gran Bretaña sí cobró impuestos a las colonias en la década de 1760 para pagar deudas de guerra. Esta línea es correcta.",
      ],
      [
        "Many colonists were angry about the taxes.",
        "Muchos colonos estaban enojados por los impuestos.",
        "Many colonists did protest the taxes. This line is correct.",
        "Muchos colonos sí protestaron por los impuestos. Esta línea es correcta.",
      ],
      [
        "Some colonists also said it was unfair that they had no representatives in the British Parliament.",
        "Algunos colonos también decían que era injusto que no tuvieran representantes en el Parlamento británico.",
        "This is a second complaint, and it is true that colonists had no seats in Parliament.",
        "Es una segunda queja, y es verdad que los colonos no tenían escaños en el Parlamento.",
      ],
      [
        "So taxes were the only cause of the American Revolution.",
        "Entonces los impuestos fueron la única causa de la Revolución de Estados Unidos.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "Colonists used the slogan “No taxation without representation,” which names both taxes and a voice in government.",
        "Los colonos usaban el lema «No hay impuestos sin representación», que menciona los impuestos y también una voz en el gobierno.",
        "We can check this in history books and primary sources.",
        "Podemos comprobarlo en libros de historia y fuentes primarias.",
      ],
      [
        "e",
        "The Declaration of Independence lists many complaints against the king, not just taxes.",
        "La Declaración de Independencia enumera muchas quejas contra el rey, no solo los impuestos.",
        "We can check this by reading the Declaration.",
        "Podemos comprobarlo leyendo la Declaración.",
      ],
      [
        "a",
        "Marcus feels that money is always the main reason for wars.",
        "Marcus siente que el dinero siempre es la razón principal de las guerras.",
        "This is a general belief, not evidence about this event.",
        "Es una creencia general, no evidencia sobre este suceso.",
      ],
      [
        "o",
        "Marcus has a poster of a colonial flag in his room.",
        "Marcus tiene un cartel de una bandera colonial en su cuarto.",
        "This does not help us decide how many causes there were.",
        "Esto no ayuda a decidir cuántas causas hubo.",
      ],
    ],
    fix: [
      [
        "The American Revolution had only one cause, which was the lack of representation.",
        "La Revolución de Estados Unidos tuvo una sola causa, que fue la falta de representación.",
      ],
      [
        "Taxes were one cause of the American Revolution, and having no say in Parliament was another.",
        "Los impuestos fueron una causa de la Revolución de Estados Unidos, y no tener voz en el Parlamento fue otra.",
      ],
      [
        "Taxes had nothing to do with the American Revolution.",
        "Los impuestos no tuvieron nada que ver con la Revolución de Estados Unidos.",
      ],
    ],
    right: 1,
    why: [
      "Big events usually have more than one cause. Marcus's own lines name two: taxes and having no representatives in Parliament. The colonists also listed other complaints. Saying taxes were the only cause leaves out evidence that Marcus himself gave.",
      "Los grandes sucesos suelen tener más de una causa. Las propias líneas de Marcus nombran dos: los impuestos y no tener representantes en el Parlamento. Los colonos también enumeraron otras quejas. Decir que los impuestos fueron la única causa deja fuera evidencia que Marcus mismo dio.",
    ],
    accept: "taxes cause causes reasons representation parliament revolution only one more another",
    focus: ["how many causes Marcus says there were", "cuántas causas dice Marcus que hubo"],
    terms: [
      ["cause", "causa", "a reason something happens"],
      ["representation", "representación", "having someone speak and vote for you in government"],
      ["Parliament", "Parlamento", "the group that made laws in Britain"],
    ],
    transfer: [
      "A friend says a team lost the game only because of one bad pass. What other possible causes could you look for?",
      "Un amigo dice que un equipo perdió el juego solo por un mal pase. ¿Qué otras causas posibles podrías buscar?",
    ],
  },
  {
    id: "ela35-fact-opinion",
    subject: "ela",
    flaw: "fact",
    concept: "fact versus opinion",
    title: ["Fact or opinion?", "¿Hecho u opinión?"],
    speaker: "Priya",
    lines: [
      [
        "Priya sorts sentences about the school library into facts and opinions.",
        "Priya clasifica oraciones sobre la biblioteca de la escuela en hechos y opiniones.",
        "This line only says what Priya is doing.",
        "Esta línea solo dice lo que hace Priya.",
      ],
      [
        "“The library has 4,000 books” is a fact, because someone could count the books to check.",
        "«La biblioteca tiene 4,000 libros» es un hecho, porque alguien podría contar los libros para comprobarlo.",
        "Facts can be checked, and books can be counted. This line is correct.",
        "Los hechos se pueden comprobar, y los libros se pueden contar. Esta línea es correcta.",
      ],
      [
        "“The library opens at 8:00 a.m.” is an opinion, because it has a number in it.",
        "«La biblioteca abre a las 8:00 a. m.» es una opinión, porque tiene un número.",
      ],
      [
        "“Mystery books are the most exciting” is an opinion, because people can disagree about it.",
        "«Los libros de misterio son los más emocionantes» es una opinión, porque la gente puede no estar de acuerdo.",
        "People can disagree about what is exciting, so this is an opinion. This line is correct.",
        "La gente puede no estar de acuerdo sobre qué es emocionante, así que es una opinión. Esta línea es correcta.",
      ],
    ],
    flawed: 2,
    cards: [
      [
        "e",
        "The library's opening time is posted on a sign at the door.",
        "El horario de apertura de la biblioteca está en un letrero en la puerta.",
        "We can check this by reading the sign.",
        "Podemos comprobarlo leyendo el letrero.",
      ],
      [
        "e",
        "You can find out when the library opens by asking the librarian.",
        "Puedes saber cuándo abre la biblioteca preguntándole a la bibliotecaria.",
        "We can check this by asking.",
        "Podemos comprobarlo preguntando.",
      ],
      [
        "a",
        "Priya feels that sentences with numbers sound more like opinions.",
        "Priya siente que las oraciones con números suenan más a opiniones.",
        "How a sentence sounds is a feeling, not a test of fact.",
        "Cómo suena una oración es una sensación, no una prueba de que sea un hecho.",
      ],
      [
        "o",
        "The library has a blue carpet.",
        "La biblioteca tiene una alfombra azul.",
        "The carpet is not part of whether the opening time is a fact.",
        "La alfombra no influye en si el horario es un hecho.",
      ],
    ],
    fix: [
      [
        "“The library opens at 8:00 a.m.” is a fact, because you can check the time on the sign or ask the librarian.",
        "«La biblioteca abre a las 8:00 a. m.» es un hecho, porque puedes comprobar la hora en el letrero o preguntarle a la bibliotecaria.",
      ],
      [
        "“The library opens at 8:00 a.m.” is an opinion, because the librarian might change it.",
        "«La biblioteca abre a las 8:00 a. m.» es una opinión, porque la bibliotecaria podría cambiarlo.",
      ],
      [
        "“The library opens at 8:00 a.m.” is a fact, because it has a number in it.",
        "«La biblioteca abre a las 8:00 a. m.» es un hecho, porque tiene un número.",
      ],
    ],
    right: 0,
    why: [
      "A fact is a statement that can be checked. The opening time can be checked on a sign or by asking. Having a number in a sentence does not make it a fact or an opinion: “I think 8:00 is too early” has a number too, but it is an opinion because people can disagree.",
      "Un hecho es una afirmación que se puede comprobar. El horario de apertura se puede comprobar en un letrero o preguntando. Tener un número no hace que una oración sea hecho u opinión: «Creo que las 8:00 es muy temprano» también tiene un número, pero es una opinión porque la gente puede no estar de acuerdo.",
    ],
    accept: "fact check checked opinion number sign time library prove disagree",
    focus: [
      "the reason Priya gives for the opening-time sentence",
      "la razón que Priya da para la oración del horario",
    ],
    terms: [
      ["fact", "hecho", "a statement that can be checked and proven"],
      ["opinion", "opinión", "what someone thinks or feels; people can disagree"],
    ],
    transfer: [
      "A friend says “Our school has 300 students” is an opinion because it has a number. What would you tell her, and how could she check it?",
      "Una amiga dice que «Nuestra escuela tiene 300 estudiantes» es una opinión porque tiene un número. ¿Qué le dirías y cómo podría comprobarlo?",
    ],
  },
  {
    id: "ela35-theme",
    subject: "ela",
    flaw: "fact",
    concept: "theme versus topic",
    title: ["Topic or theme?", "¿Tema o mensaje?"],
    speaker: "Eli",
    lines: [
      [
        "In the fable “The Tortoise and the Hare,” a slow tortoise beats a fast hare in a race because the hare stops to nap.",
        "En la fábula «La liebre y la tortuga», una tortuga lenta le gana una carrera a una liebre rápida porque la liebre se detiene a dormir.",
        "This line tells what happens in the fable, and it matches the story.",
        "Esta línea cuenta lo que pasa en la fábula, y coincide con el cuento.",
      ],
      [
        "The topic of the story is a race.",
        "El tema (de qué trata) del cuento es una carrera.",
        "A topic names the subject of a story, and the subject of this one is a race. This line is correct.",
        "El tema nombra el asunto de un relato, y el asunto de este es una carrera. Esta línea es correcta.",
      ],
      [
        "The theme is the message about life, such as “slow and steady can win.”",
        "El mensaje (la idea central) es lo que el cuento enseña sobre la vida, como «despacio y con constancia se puede ganar».",
        "A theme is a message about life, and this one fits the story. This line is correct.",
        "El mensaje es una enseñanza sobre la vida, y este encaja con el cuento. Esta línea es correcta.",
      ],
      [
        "So the theme is just “a race,” because a theme and a topic mean the same thing.",
        "Entonces el mensaje es solo «una carrera», porque el mensaje y el tema significan lo mismo.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "The fable ends with the tortoise crossing the finish line first, which shows the lesson.",
        "La fábula termina con la tortuga cruzando la meta primero, lo que muestra la enseñanza.",
        "We can check this by rereading the end of the fable.",
        "Podemos comprobarlo releyendo el final de la fábula.",
      ],
      [
        "e",
        "Two different stories about races can teach two different messages.",
        "Dos cuentos distintos sobre carreras pueden enseñar dos mensajes distintos.",
        "We can check this by comparing two stories.",
        "Podemos comprobarlo comparando dos cuentos.",
      ],
      [
        "a",
        "Eli feels that short answers are easier to write.",
        "Eli siente que las respuestas cortas son más fáciles de escribir.",
        "What is easier to write is a preference, not evidence about the story.",
        "Lo que es más fácil de escribir es una preferencia, no evidencia sobre el cuento.",
      ],
      [
        "o",
        "Eli read the fable in a book with a red cover.",
        "Eli leyó la fábula en un libro de portada roja.",
        "The cover does not change the theme.",
        "La portada no cambia el mensaje.",
      ],
    ],
    fix: [
      [
        "The theme is “the hare,” because the hare is the main character.",
        "El mensaje es «la liebre», porque la liebre es el personaje principal.",
      ],
      [
        "The theme is the message “slow and steady can win,” while the topic is only what the story is about, a race.",
        "El mensaje es «despacio y con constancia se puede ganar», mientras que el tema es solo de qué trata el cuento: una carrera.",
      ],
      [
        "The theme and the topic are the same, but a theme needs two words.",
        "El mensaje y el tema son lo mismo, pero el mensaje necesita dos palabras.",
      ],
    ],
    right: 1,
    why: [
      "A topic is what a story is about, like a race. A theme is the message about life that the story teaches, like “slow and steady can win.” They are not the same. Eli's own lines 2 and 3 already show the difference, so line 4 does not match them.",
      "El tema es de qué trata un cuento, como una carrera. El mensaje (la idea central) es la enseñanza sobre la vida que deja el cuento, como «despacio y con constancia se puede ganar». No son lo mismo. Las líneas 2 y 3 de Eli ya muestran la diferencia, así que la línea 4 no coincide con ellas.",
    ],
    accept: "theme topic message lesson story race same different about life",
    focus: ["how Eli compares a theme with a topic", "cómo compara Eli un mensaje con un tema"],
    terms: [
      ["theme", "mensaje o idea central", "the message about life that a story teaches"],
      ["topic", "tema", "what a text is about"],
      ["fable", "fábula", "a short story that teaches a lesson"],
    ],
    transfer: [
      "A friend says the theme of “Cinderella” is “a ball.” How could you show her the difference between topic and theme?",
      "Una amiga dice que el mensaje de «La Cenicienta» es «un baile». ¿Cómo podrías mostrarle la diferencia entre tema y mensaje?",
    ],
  },
  {
    id: "h35-sleep",
    subject: "health",
    flaw: "assumption",
    concept: "how much sleep kids need",
    title: ["Enough sleep?", "¿Suficiente sueño?"],
    speaker: "Leo",
    lines: [
      [
        "Leo says that sleep gives the body time to grow and the brain time to sort what it learned.",
        "Leo dice que dormir le da al cuerpo tiempo para crecer y al cerebro tiempo para ordenar lo que aprendió.",
        "Sleep does help growth and learning. This line is correct.",
        "Dormir sí ayuda al crecimiento y al aprendizaje. Esta línea es correcta.",
      ],
      [
        "Doctors say children ages 6 to 12 need about 9 to 12 hours of sleep each night.",
        "Los médicos dicen que los niños de 6 a 12 años necesitan unas 9 a 12 horas de sueño cada noche.",
        "This matches what pediatric sleep guidelines say. This line is correct.",
        "Esto coincide con lo que dicen las guías de sueño pediátrico. Esta línea es correcta.",
      ],
      [
        "Leo stays up until midnight and gets up at 5:30 a.m., so he sleeps about five and a half hours.",
        "Leo se acuesta a medianoche y se levanta a las 5:30 a. m., así que duerme unas cinco horas y media.",
        "From midnight to 5:30 a.m. is five and a half hours, so this line is correct.",
        "De medianoche a las 5:30 a. m. son cinco horas y media, así que esta línea es correcta.",
      ],
      [
        "Leo says that is enough for kids his age, because he feels fine in class.",
        "Leo dice que eso es suficiente para niños de su edad, porque se siente bien en clase.",
      ],
    ],
    flawed: 3,
    cards: [
      [
        "e",
        "Health experts recommend 9 to 12 hours of sleep for ages 6 to 12.",
        "Los expertos en salud recomiendan de 9 a 12 horas de sueño para niños de 6 a 12 años.",
        "We can check this in a trusted health source.",
        "Podemos comprobarlo en una fuente de salud confiable.",
      ],
      [
        "e",
        "Research shows that students who sleep less than recommended have more trouble paying attention.",
        "Las investigaciones muestran que los estudiantes que duermen menos de lo recomendado tienen más dificultad para prestar atención.",
        "We can check this in sleep studies.",
        "Podemos comprobarlo en estudios sobre el sueño.",
      ],
      [
        "a",
        "Leo thinks that feeling fine means he has had enough sleep.",
        "Leo piensa que sentirse bien significa que ha dormido lo suficiente.",
        "Feeling fine is not a measure of how much sleep the body needs.",
        "Sentirse bien no mide cuánto sueño necesita el cuerpo.",
      ],
      [
        "o",
        "Leo's alarm clock is shaped like a rocket.",
        "El despertador de Leo tiene forma de cohete.",
        "The shape of the clock does not tell us how much sleep he needs.",
        "La forma del reloj no nos dice cuánto sueño necesita.",
      ],
    ],
    fix: [
      [
        "Leo needs less sleep than other kids, because he is tall.",
        "Leo necesita menos sueño que otros niños, porque es alto.",
      ],
      [
        "Kids can make up for missing sleep by sleeping 20 hours on Sunday.",
        "Los niños pueden compensar el sueño perdido durmiendo 20 horas el domingo.",
      ],
      [
        "Kids Leo's age need about 9 to 12 hours; feeling fine does not show that his body and brain got enough sleep.",
        "Los niños de la edad de Leo necesitan unas 9 a 12 horas; sentirse bien no demuestra que su cuerpo y su cerebro durmieron lo suficiente.",
      ],
    ],
    right: 2,
    why: [
      "Leo's own lines show he sleeps about five and a half hours, but doctors say children his age need 9 to 12. “I feel fine” is a feeling, not evidence. Not getting enough sleep can make it harder to pay attention and to remember, even when someone does not notice it.",
      "Las propias líneas de Leo muestran que duerme unas cinco horas y media, pero los médicos dicen que los niños de su edad necesitan de 9 a 12. «Me siento bien» es una sensación, no evidencia. No dormir lo suficiente puede dificultar prestar atención y recordar, aunque la persona no lo note.",
    ],
    accept:
      "sleep hours enough need needs feel feeling fine doctors recommend evidence nine twelve",
    focus: [
      "the reason Leo gives for why his sleep is enough",
      "la razón que da Leo para decir que su sueño es suficiente",
    ],
    terms: [
      ["recommend", "recomendar", "to say what is best to do"],
      ["evidence", "evidencia", "facts you can check that show something is true"],
    ],
    transfer: [
      "A friend says he does not need breakfast because he feels fine without it. What question could help you test that idea?",
      "Un amigo dice que no necesita desayunar porque se siente bien sin hacerlo. ¿Qué pregunta podría ayudarte a probar esa idea?",
    ],
  },
];
