/* =============================================================================
 * Teach the Machine — persona data module (single source of truth)
 * -----------------------------------------------------------------------------
 * ONE file describes, for each of the 19 misconception tags in
 * data/misconception-labels.json, the AI learner a student teaches:
 *
 *   persona          the learner's name + one-line character
 *   wrongIdea        the incorrect belief, in the learner's own Grade 6 voice
 *   openingLine      how the learner introduces its confusion
 *   probes[]         follow-up questions when the explanation is incomplete
 *   mustAddress[]    the 2-4 ideas a good explanation MUST contain (the rubric)
 *   giveawayPhrases  bare procedure-recitations that are NOT an explanation
 *   worked           TEACHER-FACING model answer — never shown before a try
 *   wordBank         vocabulary from the standard, for the student's word bank
 *
 * WHY IT LIVES UNDER curriculum/ AND NOT IN data/:
 *   Three consumers need it and each reaches it differently — the static page
 *   imports it as an ES module, functions/api/teach-machine.js imports it at
 *   bundle time (same pattern as functions/api/family-connections/[[path]].js
 *   importing curriculum/family-connections/shared/model.js), and
 *   tools/validate-teach-machine.mjs imports it in Node. A plain ES module is
 *   the only form all three read without a build step.
 *
 * DESIGN RULE THE VALIDATOR ENFORCES:
 *   openingLine and probes[] may never contain the correct METHOD. The learner
 *   is confused; it must not accidentally teach. `giveawayPhrases` are the
 *   procedure-recitations ("keep, change, flip") that mean a student stated a
 *   rule instead of explaining it — they earn no credit, and they must never
 *   appear in the learner's own mouth either.
 *
 * mustAddress[].match is the visible scoring model: a list of GROUPS; a group
 * matches when EVERY substring in it appears in the student's normalized text,
 * and an item is addressed when ANY of its groups matches. Both English and
 * Spanish keys live in the same list so one rubric serves both languages.
 * ========================================================================== */

/** Build one rubric item. */
const A = (id, en, es, match) => ({ id, en, es, match });

export const TAGS = [
  "algebra-distributive-partial",
  "decimal-place-value",
  "exponent-as-multiplication",
  "fraction-added-denominators",
  "fraction-no-reciprocal",
  "fraction-straight-across-division",
  "geom-triangle-area-no-half",
  "geom-surface-area-as-volume",
  "geom-volume-added-dimensions",
  "coord-xy-swapped",
  "equation-answered-with-given-number",
  "equation-not-inverse-operation",
  "inequality-boundary-inclusion",
  "inequality-direction-flipped",
  "inequality-graph-direction",
  "stat-center-vs-spread",
  "stat-frequency-vs-value",
  "stat-mean-skewed-by-outlier",
  "stat-range-for-iqr",
  "measure-area-perimeter-swap",
  "op-added-instead-of-multiplied",
  "op-divided-instead-of-multiplied",
  "op-multiplied-instead-of-added",
  "op-multiplied-instead-of-divided",
  "op-reversed-division",
  "op-reversed-subtraction",
  "order-of-operations-left-to-right",
  "percent-scale-off-by-100",
  "percent-used-as-whole-number",
  "rate-not-per-one",
  "ratio-inverted",
  "sign-dropped",
  "stat-summed-instead-of-averaged",
];

/* Recitations that every persona rejects, on top of its own. Kept separate so
 * one edit covers all 19 and so the validator can check them uniformly. */
export const UNIVERSAL_GIVEAWAYS = [
  "that's just the rule",
  "thats just the rule",
  "it's just the rule",
  "because that's how you do it",
  "es la regla",
  "asi se hace",
  "así se hace",
  "porque si",
  "porque sí",
];

export const PERSONAS = {
  "decimal-place-value": {
    tag: "decimal-place-value",
    standards: ["6.NOS.3"],
    persona: {
      name: "Pixel",
      blurb: "A careful counter who trusts digits more than sizes.",
      blurbEs: "Cuenta con cuidado y confía más en los dígitos que en los tamaños.",
    },
    wrongIdea:
      "the digits are all that matter in a decimal, so the point can go wherever it looks right",
    wrongIdeaEs: "solo importan los dígitos en un decimal, así que el punto va donde se vea bien",
    openingLine:
      "I did 0.3 times 0.4 and wrote 1.2, because 3 times 4 is 12. My partner said that is not it. What am I not seeing?",
    openingLineEs:
      "Hice 0.3 por 0.4 y escribí 1.2, porque 3 por 4 es 12. Mi compañera dijo que no. ¿Qué no estoy viendo?",
    probes: [
      "If I take a piece of a piece, should my answer end up bigger or smaller than what I started with?",
      "What does the 3 in 0.3 actually stand for? I keep reading it as plain three.",
      "How could I check my answer before I trust it, without just doing the same steps again?",
    ],
    probesEs: [
      "Si tomo una parte de una parte, ¿mi respuesta debería quedar más grande o más pequeña que con lo que empecé?",
      "¿Qué representa de verdad el 3 en 0.3? Yo lo sigo leyendo como un tres normal.",
      "¿Cómo puedo revisar mi respuesta antes de confiar en ella, sin repetir los mismos pasos?",
    ],
    mustAddress: [
      A(
        "place-names-size",
        "Each decimal place names the SIZE of the digit, not just its order",
        "Cada lugar decimal nombra el TAMAÑO del dígito, no solo su orden",
        [["place value"], ["tenth"], ["hundredth"], ["valor posicional"], ["decim"], ["centesim"]],
      ),
      A(
        "estimate-first",
        "Estimate with friendly numbers first so you know how big the answer should be",
        "Estima primero con números fáciles para saber de qué tamaño debe ser la respuesta",
        [
          ["estimat"],
          ["about"],
          ["round"],
          ["should be less"],
          ["estim"],
          ["redonde"],
          ["aproxim"],
        ],
      ),
      A(
        "count-the-places",
        "How many decimal places the factors have decides where the point lands",
        "Cuántos lugares decimales tienen los factores decide dónde queda el punto",
        [
          ["decimal place"],
          ["count", "place"],
          ["two place"],
          ["lugares decimales"],
          ["cuenta", "lugar"],
        ],
      ),
    ],
    giveawayPhrases: [
      "just move the decimal",
      "move the dot",
      "count the digits and move",
      "solo mueve el punto",
    ],
    worked:
      "Read 0.3 as three tenths and 0.4 as four tenths. Three tenths of four tenths has to be smaller than either one, so the answer must be under 0.4. Twelve hundredths is 0.12.",
    workedEs:
      "Lee 0.3 como tres décimos y 0.4 como cuatro décimos. Tres décimos de cuatro décimos tiene que ser menor que cualquiera de los dos, así que la respuesta debe ser menor que 0.4. Doce centésimos es 0.12.",
    wordBank: ["tenths", "hundredths", "place value", "estimate", "factor", "product", "magnitude"],
    wordBankEs: [
      "décimos",
      "centésimos",
      "valor posicional",
      "estimar",
      "factor",
      "producto",
      "magnitud",
    ],
  },

  "exponent-as-multiplication": {
    tag: "exponent-as-multiplication",
    standards: ["6.AT.5"],
    persona: {
      name: "Byte",
      blurb: "Reads every symbol literally and hates being told to memorize.",
      blurbEs: "Lee cada símbolo al pie de la letra y odia que le digan que memorice.",
    },
    wrongIdea: "a small raised number means you multiply it by the big number, so 4^3 is 12",
    wrongIdeaEs:
      "un número pequeño arriba significa que lo multiplicas por el número grande, así que 4^3 es 12",
    openingLine:
      "I wrote 4^3 = 12. The little 3 sits right next to the 4, so I put them together. Is that not what it means?",
    openingLineEs:
      "Escribí 4^3 = 12. El 3 pequeño está justo al lado del 4, así que los junté. ¿No significa eso?",
    probes: [
      "What is that little raised number actually counting?",
      "If I wrote the whole thing out the long way, how many numbers would be in it, and which number would they be?",
      "Why would anyone invent a tiny raised number instead of just writing it out every time?",
    ],
    probesEs: [
      "¿Qué está contando de verdad ese numerito de arriba?",
      "Si lo escribiera todo de forma larga, ¿cuántos números habría, y cuál número serían?",
      "¿Por qué alguien inventaría un numerito arriba en vez de escribirlo largo cada vez?",
    ],
    mustAddress: [
      A(
        "exponent-counts-factors",
        "The exponent counts how many times the base is used as a factor",
        "El exponente cuenta cuántas veces se usa la base como factor",
        [["how many times"], ["factor"], ["cuantas veces"], ["factor"]],
      ),
      A(
        "base-is-what-repeats",
        "The base is the number that repeats — it is not something to multiply the exponent by",
        "La base es el número que se repite — no es algo que se multiplique por el exponente",
        [["base"], ["repeat"], ["same number"], ["repite"], ["mismo numero"]],
      ),
      A(
        "expand-to-prove",
        "Writing it out in expanded form proves what the value has to be",
        "Escribirlo en forma desarrollada demuestra cuál tiene que ser el valor",
        [["expand"], ["write it out"], ["4 x 4"], ["4*4"], ["desarroll"], ["escribirlo largo"]],
      ),
    ],
    giveawayPhrases: [
      "just multiply it out",
      "power of",
      "solo multiplica por si mismo",
      "solo multiplícalo",
    ],
    worked:
      "The raised number says how many copies of the base get multiplied together, so 4^3 is three 4s: 4 x 4 x 4 = 64. Multiplying 4 by 3 would only be three 4s added, which is a different question entirely.",
    workedEs:
      "El número elevado dice cuántas copias de la base se multiplican, así que 4^3 son tres cuatros: 4 x 4 x 4 = 64. Multiplicar 4 por 3 solo sería tres cuatros sumados, que es otra pregunta.",
    wordBank: ["base", "exponent", "factor", "expanded form", "repeated multiplication", "power"],
    wordBankEs: [
      "base",
      "exponente",
      "factor",
      "forma desarrollada",
      "multiplicación repetida",
      "potencia",
    ],
  },

  "fraction-added-denominators": {
    tag: "fraction-added-denominators",
    standards: ["6.NOS.1", "6.NOS.4"],
    persona: {
      name: "Nimbus",
      blurb: "Likes patterns that look tidy, even when they are not true.",
      blurbEs: "Le gustan los patrones que se ven ordenados, aunque no sean ciertos.",
    },
    wrongIdea: "you add fractions by adding the tops and adding the bottoms, so 1/3 + 1/5 is 2/8",
    wrongIdeaEs: "sumas fracciones sumando los de arriba y los de abajo, así que 1/3 + 1/5 es 2/8",
    openingLine:
      "I added 1/3 and 1/5 and got 2/8. Tops with tops, bottoms with bottoms — it looks so neat. Everyone keeps saying no. What is wrong with it?",
    openingLineEs:
      "Sumé 1/3 y 1/5 y me dio 2/8. Los de arriba con los de arriba, los de abajo con los de abajo — se ve muy ordenado. Todos dicen que no. ¿Qué tiene de malo?",
    probes: [
      "What does the number on the bottom actually tell me about the fraction?",
      "My answer came out smaller than the 1/3 I started with. Is that supposed to happen when I add?",
      "If the two kinds of pieces are not the same size, what could I do to them first?",
    ],
    probesEs: [
      "¿Qué me dice de verdad el número de abajo sobre la fracción?",
      "Mi respuesta salió más pequeña que el 1/3 con el que empecé. ¿Eso debe pasar cuando sumo?",
      "Si los dos tipos de partes no son del mismo tamaño, ¿qué les podría hacer primero?",
    ],
    mustAddress: [
      A(
        "denominator-names-size",
        "The denominator names the SIZE of each piece",
        "El denominador nombra el TAMAÑO de cada parte",
        [
          ["denominator", "size"],
          ["bottom", "size"],
          ["bottom number", "how big"],
          ["denominador", "tamano"],
          ["abajo", "tamano"],
        ],
      ),
      A(
        "cannot-add-unlike",
        "You cannot add pieces of different sizes",
        "No puedes sumar partes de diferente tamaño",
        [
          ["different size"],
          ["not the same size"],
          ["unlike"],
          ["diferente tamano"],
          ["distinto tamano"],
          ["no son iguales"],
        ],
      ),
      A(
        "common-denominator-first",
        "You need pieces of the same size — a common denominator — before you add",
        "Necesitas partes del mismo tamaño — un denominador común — antes de sumar",
        [
          ["common denominator"],
          ["same denominator"],
          ["same size piece"],
          ["denominador comun"],
          ["mismo denominador"],
        ],
      ),
    ],
    giveawayPhrases: [
      "just find the lcd",
      "just find the lcm",
      "keep the bottom the same",
      "cross multiply",
      "solo busca el minimo comun",
    ],
    worked:
      "The bottom number says how many equal pieces one whole is cut into, so thirds and fifths are different sizes and cannot be counted together. Rename both as fifteenths: 1/3 becomes 5/15 and 1/5 becomes 3/15. Now the pieces match, and five of them plus three of them is 8/15.",
    workedEs:
      "El número de abajo dice en cuántas partes iguales se corta un entero, así que los tercios y los quintos son de distinto tamaño y no se pueden contar juntos. Renómbralos como quinceavos: 1/3 es 5/15 y 1/5 es 3/15. Ahora las partes coinciden, y cinco más tres es 8/15.",
    wordBank: [
      "numerator",
      "denominator",
      "common denominator",
      "equivalent fraction",
      "bar model",
      "equal pieces",
    ],
    wordBankEs: [
      "numerador",
      "denominador",
      "denominador común",
      "fracción equivalente",
      "modelo de barras",
      "partes iguales",
    ],
  },

  "fraction-no-reciprocal": {
    tag: "fraction-no-reciprocal",
    standards: ["6.NOS.1"],
    persona: {
      name: "Ember",
      blurb: "Notices when an answer feels wrong but cannot say why yet.",
      blurbEs: "Nota cuando una respuesta se siente mal, pero todavía no sabe explicar por qué.",
    },
    wrongIdea:
      "dividing two fractions means multiplying them exactly as they are, so 3/4 divided by 1/2 is 3/8",
    wrongIdeaEs:
      "dividir dos fracciones significa multiplicarlas tal como están, así que 3/4 entre 1/2 es 3/8",
    openingLine:
      "For 3/4 divided by 1/2 I multiplied them the way they were and got 3/8. But 3/8 is smaller than the 3/4 I started with, and that bugs me. Can you help me see it?",
    openingLineEs:
      "Para 3/4 entre 1/2 los multipliqué tal como estaban y me dio 3/8. Pero 3/8 es menor que el 3/4 con el que empecé, y eso me molesta. ¿Me ayudas a verlo?",
    probes: [
      "How many halves fit inside 3/4? I cannot picture that at all.",
      "When I divide by a number smaller than one, should my answer get bigger or smaller? Why?",
      "Why would changing the second fraction even be allowed — does that not change the problem?",
    ],
    probesEs: [
      "¿Cuántas mitades caben en 3/4? No me lo puedo imaginar.",
      "Cuando divido entre un número menor que uno, ¿mi respuesta debe crecer o achicarse? ¿Por qué?",
      "¿Por qué se permitiría cambiar la segunda fracción? ¿Eso no cambia el problema?",
    ],
    mustAddress: [
      A(
        "division-is-how-many-fit",
        "Division asks how many of the second amount fit inside the first",
        "La división pregunta cuántas veces cabe la segunda cantidad dentro de la primera",
        [
          ["how many", "fit"],
          ["how many", "go into"],
          ["how many", "inside"],
          ["cuantas", "caben"],
          ["cuantos", "caben"],
        ],
      ),
      A(
        "dividing-by-less-than-one",
        "Dividing by a number less than 1 makes the answer bigger, not smaller",
        "Dividir entre un número menor que 1 hace la respuesta más grande, no más pequeña",
        [
          ["less than 1", "bigger"],
          ["less than one", "bigger"],
          ["smaller than 1", "bigger"],
          ["menor que 1", "mayor"],
          ["menor que uno", "mas grande"],
        ],
      ),
      A(
        "reciprocal-does-the-same-job",
        "Multiplying by the reciprocal gives the same result as dividing, and you can say why",
        "Multiplicar por el recíproco da el mismo resultado que dividir, y puedes decir por qué",
        [
          ["reciprocal"],
          ["flip", "multiply"],
          ["reciproc"],
          ["invert", "multiplic"],
          ["invers", "multiplic"],
        ],
      ),
    ],
    giveawayPhrases: [
      "keep change flip",
      "keep, change, flip",
      "just flip the second one",
      "copy dot flip",
      "copia cambia invierte",
    ],
    worked:
      "Division asks how many halves fit into 3/4. Two halves make a whole, so 3/4 holds one whole half and then 1/4 more, and that leftover quarter is half of another half. That is 1 and 1/2 halves, which is exactly what 3/4 x 2/1 gives.",
    workedEs:
      "La división pregunta cuántas mitades caben en 3/4. Dos mitades forman un entero, así que en 3/4 cabe una mitad completa y sobra 1/4, y ese cuarto es la mitad de otra mitad. Son 1 y 1/2 mitades, exactamente lo que da 3/4 x 2/1.",
    wordBank: ["dividend", "divisor", "quotient", "reciprocal", "unit fraction", "bar model"],
    wordBankEs: [
      "dividendo",
      "divisor",
      "cociente",
      "recíproco",
      "fracción unitaria",
      "modelo de barras",
    ],
  },

  "fraction-straight-across-division": {
    tag: "fraction-straight-across-division",
    standards: ["6.NOS.1"],
    persona: {
      name: "Delta",
      blurb: "Loves a shortcut and wants to know exactly when it breaks.",
      blurbEs: "Le encantan los atajos y quiere saber exactamente cuándo fallan.",
    },
    wrongIdea:
      "you divide fractions top by top and bottom by bottom, the same way multiplying works",
    wrongIdeaEs:
      "divides fracciones arriba con arriba y abajo con abajo, igual que la multiplicación",
    openingLine:
      "Dividing straight across worked for me once: 6/8 divided by 2/4 gave me 3/2. Multiplying goes straight across, so why would dividing not?",
    openingLineEs:
      "Dividir directo me funcionó una vez: 6/8 entre 2/4 me dio 3/2. La multiplicación va directa, ¿por qué la división no?",
    probes: [
      "What happens when the top numbers do not divide evenly, like 5/6 divided by 2/3? I get stuck immediately.",
      "What is division actually asking me to find out?",
      "Can you show me with a picture instead of numbers? I do not trust the numbers yet.",
    ],
    probesEs: [
      "¿Qué pasa cuando los números de arriba no se dividen exacto, como 5/6 entre 2/3? Ahí me trabo.",
      "¿Qué me está pidiendo encontrar la división en realidad?",
      "¿Me lo puedes mostrar con un dibujo en vez de números? Todavía no confío en los números.",
    ],
    mustAddress: [
      A(
        "what-division-asks",
        "Division asks how many of one amount fit inside the other",
        "La división pregunta cuántas veces cabe una cantidad dentro de la otra",
        [
          ["how many", "fit"],
          ["how many", "go into"],
          ["cuantas", "caben"],
          ["cuantos", "caben"],
        ],
      ),
      A(
        "shortcut-breaks",
        "The straight-across shortcut breaks as soon as the numbers do not divide evenly",
        "El atajo directo falla en cuanto los números no se dividen exacto",
        [
          ["not divide evenly"],
          ["doesn't divide evenly"],
          ["does not divide evenly"],
          ["remainder"],
          ["breaks"],
          ["no funciona"],
          ["no se divide exacto"],
        ],
      ),
      A(
        "show-with-a-model",
        "A bar model or number line shows what the quotient really means",
        "Un modelo de barras o una recta numérica muestra lo que el cociente significa",
        [
          ["bar model"],
          ["number line"],
          ["picture"],
          ["draw"],
          ["modelo"],
          ["recta numerica"],
          ["dibuj"],
        ],
      ),
    ],
    giveawayPhrases: [
      "keep change flip",
      "just divide across",
      "just divide straight across",
      "divide arriba y abajo",
    ],
    worked:
      "Division asks how many 2/3 fit into 5/6. Rewrite both in sixths: 5/6 and 4/6. Four sixths fit into five sixths once with one sixth left over, and that leftover is a quarter of another 4/6, so the answer is 1 and 1/4. Dividing straight across gives 5/2 over 6/3, which is not a fraction anyone can read.",
    workedEs:
      "La división pregunta cuántos 2/3 caben en 5/6. Escribe ambos en sextos: 5/6 y 4/6. Cuatro sextos caben en cinco sextos una vez y sobra un sexto, que es un cuarto de otro 4/6, así que la respuesta es 1 y 1/4. Dividir directo da 5/2 sobre 6/3, que nadie puede leer.",
    wordBank: [
      "quotient",
      "divisor",
      "common denominator",
      "bar model",
      "number line",
      "remainder",
    ],
    wordBankEs: [
      "cociente",
      "divisor",
      "denominador común",
      "modelo de barras",
      "recta numérica",
      "residuo",
    ],
  },

  "geom-triangle-area-no-half": {
    tag: "geom-triangle-area-no-half",
    standards: ["6.GR.1"],
    persona: {
      name: "Sailcloth",
      blurb: "Multiplies base by height and calls every shape a rectangle.",
      blurbEs: "Multiplica base por altura y trata cada figura como un rectángulo.",
    },
    wrongIdea: "the area of a triangle is base times height, the same rule as a rectangle",
    wrongIdeaEs: "el área de un triángulo es base por altura, la misma regla que un rectángulo",
    openingLine:
      "The sail has a base of 6 and a height of 4, so I say its area is 24. Rectangles and triangles follow the same rule, right?",
    openingLineEs:
      "La vela tiene base 6 y altura 4, así que digo que su área es 24. Los rectángulos y los triángulos siguen la misma regla, ¿verdad?",
    probes: [
      "If I draw the rectangle around my triangle, how much of it does the triangle actually fill?",
      "Why does the formula have a one-half in it? Where does the half come from?",
      "Two identical triangles — what shape can I build if I put them together?",
    ],
    probesEs: [
      "Si dibujo el rectángulo alrededor de mi triángulo, ¿cuánto de él llena el triángulo en realidad?",
      "¿Por qué la fórmula tiene un medio? ¿De dónde sale esa mitad?",
      "Dos triángulos idénticos: ¿qué figura puedo armar si los junto?",
    ],
    mustAddress: [
      A(
        "triangle-is-half-rectangle",
        "A triangle is HALF of the rectangle built on the same base and height",
        "Un triángulo es la MITAD del rectángulo con la misma base y altura",
        [["half"], ["rectangle"], ["mitad"], ["rect"]],
      ),
      A(
        "divide-by-two",
        "After multiplying base × height you still have to divide by 2",
        "Después de multiplicar base × altura todavía hay que dividir entre 2",
        [["divide"], ["by 2"], ["÷ 2"], ["entre 2"], ["divid"]],
      ),
    ],
    giveawayPhrases: ["base times height", "b times h", "base por altura", "just multiply"],
    worked:
      "Base times height gives the rectangle that the triangle sits inside, and the triangle covers exactly half of it. Two copies of the triangle fill the rectangle perfectly. So the area is 6 × 4 = 24 for the rectangle, and 24 ÷ 2 = 12 for the sail.",
    workedEs:
      "Base por altura da el rectángulo donde vive el triángulo, y el triángulo cubre exactamente la mitad. Dos copias del triángulo llenan el rectángulo por completo. El rectángulo es 6 × 4 = 24, y la vela es 24 ÷ 2 = 12.",
    wordBank: ["base", "height", "half", "rectangle", "square units", "compose"],
    wordBankEs: ["base", "altura", "mitad", "rectángulo", "unidades cuadradas", "componer"],
  },

  "geom-surface-area-as-volume": {
    tag: "geom-surface-area-as-volume",
    standards: ["6.GR.4"],
    persona: {
      name: "Wrapper",
      blurb: "Multiplies all three edges no matter which question was asked.",
      blurbEs: "Multiplica las tres aristas sin importar qué se preguntó.",
    },
    wrongIdea:
      "surface area and volume are the same calculation, because a box only has one set of measurements",
    wrongIdeaEs:
      "el área total y el volumen son el mismo cálculo, porque una caja solo tiene un conjunto de medidas",
    // Must NOT recite the method — the validator rejects an opening line that
    // hands over the answer. It states the wrong belief and invites challenge.
    openingLine:
      "The box is 2 by 3 by 4, so I need 24 square inches of wrapping paper. Length times width times height — that is the box, is it not?",
    openingLineEs:
      "La caja mide 2 por 3 por 4, así que necesito 24 pulgadas cuadradas de papel. Largo por ancho por alto: eso es la caja, ¿no?",
    probes: [
      "If I unfold the box flat, how many faces am I looking at?",
      "My answer came out in square inches, but I multiplied three lengths together. What unit does that actually give me?",
      "Would wrapping paper ever go INSIDE the box? My rule seems to be measuring the inside.",
    ],
    probesEs: [
      "Si desdoblo la caja, ¿cuántas caras estoy viendo?",
      "Mi respuesta salió en pulgadas cuadradas, pero multipliqué tres largos. ¿Qué unidad da eso en realidad?",
      "¿El papel de regalo iría ADENTRO de la caja? Mi regla parece medir lo de adentro.",
    ],
    mustAddress: [
      A(
        "surface-is-the-faces",
        "Surface area adds the areas of the faces — the outside, not the inside",
        "El área total suma las áreas de las caras: lo de afuera, no lo de adentro",
        [["face"], ["outside"], ["net"], ["cara"], ["afuera"], ["plantilla"]],
      ),
      A(
        "square-vs-cubic",
        "A surface is measured in square units; a filled space is measured in cubic units",
        "Una superficie se mide en unidades cuadradas; un espacio lleno, en unidades cúbicas",
        [["square"], ["cubic"], ["unit"], ["cuadrad"], ["cúbic"], ["unidad"]],
      ),
    ],
    giveawayPhrases: ["2(lw + lh + wh)", "six faces add", "área total es 2", "sum the six faces"],
    worked:
      "Unfold the 2 by 3 by 4 box and you get six rectangles in matching pairs: two 2×3 = 6, two 2×4 = 8, two 3×4 = 12. Added, that is 2(6 + 8 + 12) = 52 square inches of paper. The 24 I found was l × w × h — how much FILLS the box, in cubic inches.",
    workedEs:
      "Desdobla la caja de 2 por 3 por 4 y salen seis rectángulos en pares: dos de 2×3 = 6, dos de 2×4 = 8, dos de 3×4 = 12. Sumados, son 2(6 + 8 + 12) = 52 pulgadas cuadradas de papel. Las 24 que hallé eran l × a × h: lo que LLENA la caja, en pulgadas cúbicas.",
    wordBank: ["surface area", "face", "net", "square units", "cubic units", "volume"],
    wordBankEs: [
      "área total",
      "cara",
      "plantilla",
      "unidades cuadradas",
      "unidades cúbicas",
      "volumen",
    ],
  },

  "geom-volume-added-dimensions": {
    tag: "geom-volume-added-dimensions",
    standards: ["6.GR.2"],
    persona: {
      name: "Boxcar",
      blurb: "Reads three measurements and adds them because there are three.",
      blurbEs: "Lee tres medidas y las suma porque son tres.",
    },
    wrongIdea: "volume is length plus width plus height, since those are the box's measurements",
    wrongIdeaEs: "el volumen es largo más ancho más alto, porque esas son las medidas de la caja",
    openingLine:
      "The box is 3 by 4 by 5, and I say its volume is 12 cubic feet. I used every measurement once, did I not?",
    openingLineEs:
      "La caja mide 3 por 4 por 5, y digo que su volumen es 12 pies cúbicos. Usé cada medida una vez, ¿no?",
    probes: [
      "If I build just the bottom layer out of unit cubes, how many cubes is that?",
      "How many of those layers stack up to fill the box?",
      "Could a box that is 1 by 1 by 10 really hold the same as one that is 4 by 4 by 4? My rule says almost.",
    ],
    probesEs: [
      "Si armo solo la capa de abajo con cubos unitarios, ¿cuántos cubos son?",
      "¿Cuántas de esas capas se apilan para llenar la caja?",
      "¿Una caja de 1 por 1 por 10 puede guardar lo mismo que una de 4 por 4 por 4? Mi regla dice que casi.",
    ],
    mustAddress: [
      A(
        "volume-fills-with-cubes",
        "Volume counts the unit cubes that FILL the box, layer by layer",
        "El volumen cuenta los cubos unitarios que LLENAN la caja, capa por capa",
        [["cube"], ["fill"], ["layer"], ["cubo"], ["llena"], ["capa"]],
      ),
      A(
        "multiply-three",
        "The three dimensions multiply: length × width × height",
        "Las tres dimensiones se multiplican: largo × ancho × alto",
        [["multiply"], ["times"], ["×"], ["multiplic"], ["por"]],
      ),
    ],
    giveawayPhrases: ["add them up", "l plus w plus h", "súmalas", "3 + 4 + 5"],
    worked:
      "The bottom layer is 3 × 4 = 12 cubes. The box is 5 layers tall, so 12 × 5 = 60 cubes fill it. Adding 3 + 4 + 5 counts one edge of each direction, not the space inside.",
    workedEs:
      "La capa de abajo tiene 3 × 4 = 12 cubos. La caja tiene 5 capas, así que 12 × 5 = 60 cubos la llenan. Sumar 3 + 4 + 5 cuenta un borde de cada dirección, no el espacio de adentro.",
    wordBank: ["volume", "unit cube", "layer", "dimension", "cubic units", "prism"],
    wordBankEs: ["volumen", "cubo unitario", "capa", "dimensión", "unidades cúbicas", "prisma"],
  },

  "algebra-distributive-partial": {
    tag: "algebra-distributive-partial",
    standards: ["6.AT.7"],
    persona: {
      name: "Half-Deal",
      blurb: "Multiplies the first thing in the parentheses and calls it done.",
      blurbEs: "Multiplica lo primero del paréntesis y lo da por terminado.",
    },
    wrongIdea: "the number outside the parentheses only multiplies the first term inside",
    wrongIdeaEs: "el número fuera del paréntesis solo multiplica el primer término de adentro",
    openingLine:
      "For 3(4 + 5) I did 3 × 4 = 12, then added the 5 to get 17. The 3 already did its job on the 4, right?",
    openingLineEs:
      "Para 3(4 + 5) hice 3 × 4 = 12 y luego sumé el 5 para llegar a 17. El 3 ya se ocupó del 4, ¿no?",
    probes: [
      "What does 3(4 + 5) mean if I say it as three GROUPS of something?",
      "If I add inside first — 4 + 5 = 9 — and then multiply, why do I get a different answer from yours?",
      "In the area model, what rectangle did I forget to count?",
    ],
    probesEs: [
      "¿Qué significa 3(4 + 5) si lo digo como tres GRUPOS de algo?",
      "Si primero sumo adentro — 4 + 5 = 9 — y luego multiplico, ¿por qué me da distinto que a ti?",
      "En el modelo de área, ¿qué rectángulo olvidé contar?",
    ],
    mustAddress: [
      A(
        "factor-hits-both",
        "The outside factor multiplies EVERY term inside the parentheses",
        "El factor de afuera multiplica CADA término dentro del paréntesis",
        [["both"], ["every term"], ["each term"], ["ambos"], ["cada término"], ["los dos"]],
      ),
      A(
        "groups-meaning",
        "3(4 + 5) means three whole groups of (4 + 5), so the 5 gets three copies too",
        "3(4 + 5) significa tres grupos completos de (4 + 5), así que el 5 también se copia tres veces",
        [["group"], ["copies"], ["grupo"], ["copias"], ["veces"]],
      ),
    ],
    giveawayPhrases: ["only the first", "just the 4", "solo el primero", "ya hizo su trabajo"],
    worked:
      "3(4 + 5) is three groups of a 4-and-5 pair: 3 × 4 = 12 and 3 × 5 = 15, and 12 + 15 = 27. Checking the other way, 4 + 5 = 9 and 3 × 9 = 27 — both roads agree, and 17 misses the three copies of the 5.",
    workedEs:
      "3(4 + 5) son tres grupos de un par 4-y-5: 3 × 4 = 12 y 3 × 5 = 15, y 12 + 15 = 27. Por el otro camino, 4 + 5 = 9 y 3 × 9 = 27 — los dos caminos coinciden, y 17 pierde las tres copias del 5.",
    wordBank: ["distribute", "factor", "term", "equivalent", "area model", "expression"],
    wordBankEs: ["distribuir", "factor", "término", "equivalente", "modelo de área", "expresión"],
  },

  "equation-not-inverse-operation": {
    tag: "equation-not-inverse-operation",
    standards: ["6.AT.8"],
    persona: { name: "Echo", blurb: "Repeats the operation instead of undoing it.", blurbEs: "Repite la operación en vez de deshacerla." },
    wrongIdea: "whatever the equation does to the variable, you should do again to both sides",
    wrongIdeaEs: "lo que la ecuación le hace a la variable, hay que hacerlo otra vez en ambos lados",
    openingLine: "For 6x = 42 I multiplied both sides by 6 again. You are supposed to do the same thing to both sides, so that is allowed, right?",
    openingLineEs: "Para 6x = 42 multipliqué otra vez por 6 en ambos lados. Hay que hacer lo mismo en ambos lados, así que se vale, ¿no?",
    probes: ["Doing the same thing to both sides IS the rule though. Why did it not work?", "How do I know which operation to pick?", "My x is still stuck. Did I break the equation?"],
    probesEs: ["Pero se supone que hay que hacer lo mismo en ambos lados. ¿Por qué no funcionó?", "¿Cómo sé cuál operación escoger?", "Mi x sigue atrapada. ¿Rompí la ecuación?"],
    mustAddress: [
      A("name-the-operation", "First name what is being done to the variable", "Primero nombra qué se le está haciendo a la variable", [["what is being done"],["acting on"],["name the operation"],["qué se le hace"],["nombra la operación"]]),
      A("use-the-opposite", "Then apply the OPPOSITE operation to both sides", "Luego aplica la operación OPUESTA en ambos lados", [["opposite"],["inverse"],["undo"],["opuest"],["inversa"],["deshac"]]),
      A("check-it-isolates", "Check that the variable ends up alone", "Comprueba que la variable quede sola", [["by itself"],["alone"],["isolate"],["sola"],["despejar"]]),
    ],
    giveawayPhrases: ["divide both sides by 6", "divide by the coefficient", "divide ambos lados entre 6"],
    worked: "In 6x = 42 the 6 is multiplying x. Multiplying again gives 36x = 252, which is further from an answer than where I started. The operation that cancels a multiplication is a division, so both sides are divided by 6 and x = 7. Substituting back, 6 times 7 is 42, which is the check.",
    workedEs: "En 6x = 42 el 6 multiplica a x. Multiplicar otra vez da 36x = 252, más lejos que al empezar. La operación que cancela una multiplicación es una división, así que se divide entre 6 en ambos lados y x = 7. Al sustituir, 6 por 7 es 42, y eso comprueba.",
    wordBank: ["inverse operation", "isolate", "variable", "both sides", "undo", "solve", "substitute"],
    wordBankEs: ["operación inversa", "despejar", "variable", "ambos lados", "deshacer", "resolver", "sustituir"],
  },

  "equation-answered-with-given-number": {
    tag: "equation-answered-with-given-number",
    standards: ["6.AT.8"],
    persona: { name: "Quill", blurb: "Answers with a number already printed in the problem.", blurbEs: "Responde con un número que ya está impreso en el problema." },
    wrongIdea: "the answer to an equation is one of the numbers you can already see in it",
    wrongIdeaEs: "la respuesta de una ecuación es uno de los números que ya se ven en ella",
    openingLine: "For n + 15 = 40 I said n is 15. The 15 is right there in the problem, so it must be the important number.",
    openingLineEs: "Para n + 15 = 40 dije que n es 15. El 15 está ahí en el problema, así que debe ser el número importante.",
    probes: ["If 15 is written down already, why would anyone ask for it?", "How do I tell which number is the mystery one?", "Is there a way to test whether my answer is right?"],
    probesEs: ["Si el 15 ya está escrito, ¿por qué lo preguntarían?", "¿Cómo sé cuál número es el misterioso?", "¿Hay forma de probar si mi respuesta está bien?"],
    mustAddress: [
      A("unknown-is-missing", "The unknown is the one number NOT given to you", "La incógnita es el único número que NO te dan", [["not given"],["missing"],["nobody told you"],["unknown"],["no te dan"],["falta"],["incógnita"]]),
      A("substitute-to-check", "Substituting the answer back must make both sides equal", "Sustituir la respuesta debe dejar iguales los dos lados", [["substitute"],["put it back"],["check"],["both sides"],["sustitu"],["comprueb"],["ambos lados"]]),
      A("solve-dont-copy", "You have to compute it, not copy it off the page", "Hay que calcularla, no copiarla de la hoja", [["compute"],["work it out"],["solve"],["calcul"],["resolver"]]),
    ],
    giveawayPhrases: ["subtract 15 from both sides", "40 minus 15", "resta 15 de ambos lados"],
    worked: "In n + 15 = 40 both the 15 and the 40 are printed, so neither can be the thing being asked for. The unknown is n. Undoing the addition gives n = 25, and putting 25 back in gives 25 + 15 = 40, so the two sides agree. If I had answered 15, the check would read 15 + 15 = 30, which is not 40.",
    workedEs: "En n + 15 = 40 tanto el 15 como el 40 están impresos, así que ninguno puede ser lo que se pide. La incógnita es n. Al deshacer la suma, n = 25, y al sustituir 25 + 15 = 40, los lados coinciden. Si hubiera respondido 15, la comprobación daría 15 + 15 = 30, que no es 40.",
    wordBank: ["unknown", "variable", "substitute", "check", "solution", "equation", "isolate"],
    wordBankEs: ["incógnita", "variable", "sustituir", "comprobar", "solución", "ecuación", "despejar"],
  },

  "inequality-direction-flipped": {
    tag: "inequality-direction-flipped",
    standards: ["6.AT.9", "6.AT.8"],
    persona: { name: "Pivot", blurb: "Solves correctly, then turns the symbol around.", blurbEs: "Resuelve bien y luego voltea el símbolo." },
    wrongIdea: "the inequality symbol flips whenever you do anything to both sides",
    wrongIdeaEs: "el símbolo de desigualdad se voltea cada vez que haces algo en ambos lados",
    openingLine: "I solved x − 3 > 10 and got 13, then I wrote x < 13 because I did something to both sides. Symbols flip when you do that, don't they?",
    openingLineEs: "Resolví x − 3 > 10 y me dio 13, y luego escribí x < 13 porque hice algo en ambos lados. Los símbolos se voltean, ¿no?",
    probes: ["I definitely remember a rule about flipping. When does it apply?", "How could I test whether my answer is pointing the right way?", "Does the boundary number change when the symbol flips?"],
    probesEs: ["Recuerdo una regla sobre voltear. ¿Cuándo aplica?", "¿Cómo puedo probar si mi respuesta apunta bien?", "¿El número límite cambia cuando el símbolo se voltea?"],
    mustAddress: [
      A("add-sub-never-flips", "Adding or subtracting the same amount never flips the symbol", "Sumar o restar la misma cantidad nunca voltea el símbolo", [["never"],["does not flip"],["stays the same"],["keeps"],["nunca"],["no cambia"],["se mantiene"]]),
      A("test-a-number", "Test a number to see which way it should point", "Prueba un número para ver hacia dónde debe apuntar", [["test"],["try a number"],["substitute"],["check"],["prueba"],["sustitu"],["comprueb"]]),
      A("direction-is-a-claim", "The direction says WHICH values are solutions", "La dirección dice CUÁLES valores son soluciones", [["which values"],["solutions"],["bigger"],["smaller"],["cuáles valores"],["soluciones"],["mayores"],["menores"]]),
    ],
    giveawayPhrases: ["only when you multiply or divide by a negative", "add 3 to both sides", "solo al multiplicar o dividir por un negativo"],
    worked: "In x − 3 > 10 the 3 is subtracted, so adding 3 to both sides gives x > 13. Testing x = 20 in the original: 20 − 3 is 17, and 17 is greater than 10, so 20 really is a solution and the answer must include numbers above 13. Writing x < 13 would have excluded 20, which the original clearly allows.",
    workedEs: "En x − 3 > 10 se resta 3, así que sumar 3 en ambos lados da x > 13. Al probar x = 20 en la original: 20 − 3 es 17, y 17 es mayor que 10, así que 20 sí es solución y la respuesta debe incluir números mayores que 13. Escribir x < 13 habría excluido el 20, que la original sí permite.",
    wordBank: ["inequality", "boundary", "solution set", "direction", "greater than", "less than", "substitute"],
    wordBankEs: ["desigualdad", "límite", "conjunto solución", "dirección", "mayor que", "menor que", "sustituir"],
  },

  "inequality-boundary-inclusion": {
    tag: "inequality-boundary-inclusion",
    standards: ["6.AT.9"],
    persona: { name: "Edge", blurb: "Never sure whether the endpoint counts.", blurbEs: "Nunca sabe si el extremo cuenta." },
    wrongIdea: "the boundary number is never part of the answer",
    wrongIdeaEs: "el número límite nunca forma parte de la respuesta",
    openingLine: "The sign says you must be at least 48 inches to ride, so I wrote h > 48 with an open circle. The 48 is the edge, and edges are not really included, right?",
    openingLineEs: "El letrero dice que debes medir al menos 48 pulgadas, así que escribí h > 48 con círculo abierto. El 48 es el borde, y los bordes no se incluyen, ¿verdad?",
    probes: ["Would someone exactly 48 inches tall get turned away?", "How do I decide between the open circle and the filled one?", "Do the words in the problem tell me, or do I just pick?"],
    probesEs: ["¿A alguien que mide exactamente 48 pulgadas lo rechazarían?", "¿Cómo decido entre el círculo abierto y el relleno?", "¿Las palabras del problema me lo dicen o solo escojo?"],
    mustAddress: [
      A("test-the-endpoint", "Test the boundary value itself in the statement", "Prueba el valor límite mismo en el enunciado", [["test"],["try"],["exactly"],["substitute"],["prueba"],["exactamente"],["sustitu"]]),
      A("words-decide", "The wording decides: 'at least' and 'at most' include it", "Las palabras deciden: 'al menos' y 'como máximo' lo incluyen", [["at least"],["at most"],["no more than"],["wording"],["al menos"],["como máximo"],["palabras"]]),
      A("circle-shows-it", "A filled circle shows the endpoint is in the set", "Un círculo relleno muestra que el extremo está en el conjunto", [["filled"],["closed"],["open circle"],["included"],["relleno"],["cerrado"],["abierto"],["incluid"]]),
    ],
    giveawayPhrases: ["use greater than or equal to", "h ≥ 48", "usa mayor o igual que"],
    worked: "\"At least 48\" means 48 itself is allowed, so a rider who measures exactly 48 gets on. Testing h = 48 in h > 48 gives 48 > 48, which is false — so that version turns away a rider the sign admits. The statement that keeps them is h ≥ 48, drawn with a filled circle at 48 and shading to the right.",
    workedEs: "\"Al menos 48\" significa que el 48 sí se permite, así que quien mida exactamente 48 puede subir. Al probar h = 48 en h > 48 queda 48 > 48, que es falso, y esa versión rechaza a alguien que el letrero sí admite. El enunciado correcto es h ≥ 48, con círculo relleno en 48 y sombreado a la derecha.",
    wordBank: ["boundary", "included", "open circle", "filled circle", "at least", "at most", "solution set"],
    wordBankEs: ["límite", "incluido", "círculo abierto", "círculo relleno", "al menos", "como máximo", "conjunto solución"],
  },

  "inequality-graph-direction": {
    tag: "inequality-graph-direction",
    standards: ["6.AT.9"],
    persona: { name: "Shade", blurb: "Draws the number line shaded the wrong way.", blurbEs: "Sombrea la recta numérica al revés." },
    wrongIdea: "the shading goes toward whichever side the symbol's point is drawn on",
    wrongIdeaEs: "el sombreado va hacia el lado donde se dibuja la punta del símbolo",
    openingLine: "For x > 8 I shaded to the left, because the little point of the > is on the left side. That is how you read it off the symbol, isn't it?",
    openingLineEs: "Para x > 8 sombreé a la izquierda, porque la puntita del > está del lado izquierdo. Así se lee del símbolo, ¿no?",
    probes: ["If the shape does not tell me, what does?", "Is there a way to check a shaded picture without redoing the whole problem?", "Which numbers am I even claiming are solutions?"],
    probesEs: ["Si la forma no me lo dice, ¿qué me lo dice?", "¿Hay forma de revisar un dibujo sombreado sin rehacer todo?", "¿Cuáles números estoy afirmando que son soluciones?"],
    mustAddress: [
      A("shading-is-solutions", "The shaded part IS the set of solutions", "La parte sombreada ES el conjunto de soluciones", [["solutions"],["all the numbers"],["set"],["soluciones"],["todos los números"],["conjunto"]]),
      A("test-from-shaded", "Test a number taken from the shaded part", "Prueba un número tomado de la parte sombreada", [["test"],["pick a number"],["substitute"],["try"],["prueba"],["escoge un número"],["sustitu"]]),
      A("false-means-flip", "If the test is false, the shading belongs on the other side", "Si la prueba resulta falsa, el sombreado va del otro lado", [["false"],["other side"],["wrong side"],["flip"],["falso"],["otro lado"],["lado equivocado"]]),
    ],
    giveawayPhrases: ["shade to the right", "shade toward the larger numbers", "sombrea a la derecha"],
    worked: "For x > 8, take 4 out of the left-hand shading and test it: 4 > 8 is false, so 4 is not a solution and the shading cannot cover it. Take 12 instead: 12 > 8 is true. Every number that makes the statement true sits above 8, so the shading belongs on that side, with an open circle at 8 because 8 > 8 is false.",
    workedEs: "Para x > 8, toma el 4 del sombreado izquierdo y pruébalo: 4 > 8 es falso, así que 4 no es solución y el sombreado no puede cubrirlo. Toma 12: 12 > 8 es verdadero. Todo número que hace verdadero el enunciado está por encima de 8, así que el sombreado va de ese lado, con círculo abierto en 8 porque 8 > 8 es falso.",
    wordBank: ["number line", "shading", "solution set", "open circle", "boundary", "test", "greater than"],
    wordBankEs: ["recta numérica", "sombreado", "conjunto solución", "círculo abierto", "límite", "probar", "mayor que"],
  },

  "stat-range-for-iqr": {
    tag: "stat-range-for-iqr",
    standards: ["6.DS.3", "6.DS.5"],
    persona: { name: "Span", blurb: "Measures the whole spread when asked for the middle half.", blurbEs: "Mide toda la dispersión cuando le piden la mitad central." },
    wrongIdea: "the interquartile range is just another name for the range",
    wrongIdeaEs: "el rango intercuartílico es solo otro nombre para el rango",
    openingLine: "The box plot went from 10 up to 35, so I said the IQR is 25. That is the spread of the data, and IQR has the word range in it.",
    openingLineEs: "El diagrama de caja iba de 10 a 35, así que dije que el rango intercuartílico es 25. Esa es la dispersión, y su nombre lleva la palabra rango.",
    probes: ["Both of them measure spread though. What makes them different?", "Which parts of the box plot am I even supposed to look at?", "Could the IQR ever be bigger than the range?"],
    probesEs: ["Las dos miden dispersión. ¿Qué las hace diferentes?", "¿Qué partes del diagrama debo mirar?", "¿El rango intercuartílico podría ser mayor que el rango?"],
    mustAddress: [
      A("iqr-is-quartiles", "The IQR is Q3 minus Q1", "El rango intercuartílico es Q3 menos Q1", [["q3"],["q1"],["quartile"],["cuartil"]]),
      A("ignores-extremes", "It ignores the least and greatest values entirely", "Ignora por completo los valores menor y mayor", [["ignore"],["least"],["greatest"],["min"],["max"],["extreme"],["ignora"],["menor"],["mayor"],["extremo"]]),
      A("middle-half", "It describes only the middle half of the data", "Describe solo la mitad central de los datos", [["middle half"],["middle 50"],["box"],["mitad central"],["caja"]]),
    ],
    giveawayPhrases: ["subtract q1 from q3", "q3 − q1", "resta q1 de q3"],
    worked: "On a plot with least 10, Q1 15, Q3 27 and greatest 35, the range is 35 − 10 = 25 and uses the two extremes. The IQR uses only the box: 27 − 15 = 12. Because the box always sits inside the whiskers, the IQR can never be larger than the range — which is a quick way to catch this mistake.",
    workedEs: "En un diagrama con menor 10, Q1 15, Q3 27 y mayor 35, el rango es 35 − 10 = 25 y usa los dos extremos. El rango intercuartílico usa solo la caja: 27 − 15 = 12. Como la caja siempre está dentro de los bigotes, nunca puede ser mayor que el rango, y eso sirve para detectar este error.",
    wordBank: ["interquartile range", "quartile", "range", "spread", "box plot", "median", "outlier"],
    wordBankEs: ["rango intercuartílico", "cuartil", "rango", "dispersión", "diagrama de caja", "mediana", "valor atípico"],
  },

  "stat-center-vs-spread": {
    tag: "stat-center-vs-spread",
    standards: ["6.DS.3", "6.DS.4"],
    persona: { name: "Tally", blurb: "Reaches for a center when the question wants spread.", blurbEs: "Usa una medida de centro cuando la pregunta pide dispersión." },
    wrongIdea: "any statistic you can compute from a data set describes the same thing about it",
    wrongIdeaEs: "cualquier estadística que calcules de un conjunto de datos describe lo mismo",
    openingLine: "They asked how spread out the times were, so I found the median. It is a number that comes from the data, so it describes the data.",
    openingLineEs: "Preguntaron qué tan dispersos estaban los tiempos, así que hallé la mediana. Es un número que sale de los datos, así que los describe.",
    probes: ["Two classes could have the same median, couldn't they? Would they look the same?", "How do I tell from the question which kind it wants?", "What would actually change if the data got more scattered?"],
    probesEs: ["Dos clases podrían tener la misma mediana, ¿no? ¿Se verían iguales?", "¿Cómo sé por la pregunta cuál me piden?", "¿Qué cambiaría si los datos se dispersaran más?"],
    mustAddress: [
      A("center-is-typical", "A measure of center names a typical value", "Una medida de centro nombra un valor típical", [["typical"],["middle"],["center"],["típic"],["centro"],["medio"]]),
      A("spread-is-scatter", "A measure of spread says how scattered the values are", "Una medida de dispersión dice qué tan separados están", [["spread"],["scattered"],["how far apart"],["variation"],["dispers"],["separados"],["variación"]]),
      A("same-center-different-spread", "Two sets can share a center and be spread very differently", "Dos conjuntos pueden tener el mismo centro y dispersión muy distinta", [["same"],["different"],["both"],["mismo"],["distinta"],["diferente"]]),
    ],
    giveawayPhrases: ["use the range", "use the iqr", "usa el rango"],
    worked: "Two teams can both have a median of 20 minutes and look nothing alike: one runs 19, 20, 21 and the other 5, 20, 40. The median cannot tell them apart because it only marks the middle. A measure of spread can: the first team's range is 2, the second's is 35. Read the question for which one it wants — a typical value, or how scattered.",
    workedEs: "Dos equipos pueden tener mediana de 20 minutos y no parecerse en nada: uno corre 19, 20, 21 y el otro 5, 20, 40. La mediana no los distingue porque solo marca el medio. Una medida de dispersión sí: el rango del primero es 2 y el del segundo 35. Lee la pregunta para saber cuál piden: un valor típico o qué tan dispersos.",
    wordBank: ["center", "spread", "median", "mean", "range", "interquartile range", "variation"],
    wordBankEs: ["centro", "dispersión", "mediana", "media", "rango", "rango intercuartílico", "variación"],
  },

  "stat-mean-skewed-by-outlier": {
    tag: "stat-mean-skewed-by-outlier",
    standards: ["6.DS.6d", "6.DS.4"],
    persona: { name: "Drift", blurb: "Trusts the mean even when one value drags it.", blurbEs: "Confía en la media aunque un valor la arrastre." },
    wrongIdea: "the mean is always the best measure because it uses every value",
    wrongIdeaEs: "la media siempre es la mejor medida porque usa todos los valores",
    openingLine: "The mile times were 7, 7, 8, 8 and 22 minutes, so I gave the mean, about 10.4. It uses every single time, so it has to be the fairest one.",
    openingLineEs: "Los tiempos fueron 7, 7, 8, 8 y 22 minutos, así que di la media, unos 10.4. Usa todos los tiempos, así que debe ser la más justa.",
    probes: ["Using all the data sounds like a good thing. When is it not?", "Four of those runs were under nine minutes. Does 10.4 describe them?", "Should I just throw the weird value away?"],
    probesEs: ["Usar todos los datos suena bien. ¿Cuándo no lo es?", "Cuatro carreras fueron de menos de nueve minutos. ¿10.4 las describe?", "¿Debo descartar el valor raro?"],
    mustAddress: [
      A("outlier-drags-mean", "One extreme value pulls the mean toward it", "Un valor extremo jala la media hacia él", [["pull"],["drag"],["extreme"],["outlier"],["jala"],["arrastra"],["extremo"],["atípico"]]),
      A("median-resists", "The median barely moves when one value is extreme", "La mediana casi no se mueve con un valor extremo", [["median"],["resist"],["barely"],["does not move"],["mediana"],["resiste"],["no se mueve"]]),
      A("keep-the-data", "You do not delete the value, you choose a fairer measure", "No borras el valor: eliges una medida más justa", [["do not"],["keep"],["choose"],["still real"],["no borr"],["conserv"],["elige"]]),
    ],
    giveawayPhrases: ["use the median", "the median is better", "usa la mediana"],
    worked: "For 7, 7, 8, 8 and 22 the mean is 52 divided by 5, which is 10.4 — larger than four of the five runs, so it describes none of them well. The middle value is 8, and it stays 8 whether the slow run was 22 minutes or 40. The 22 is real and stays in the data set; what changes is which measure gets reported as typical.",
    workedEs: "Para 7, 7, 8, 8 y 22 la media es 52 entre 5, o sea 10.4: mayor que cuatro de las cinco carreras, así que no describe bien ninguna. El valor del medio es 8, y sigue siendo 8 aunque la carrera lenta fuera de 22 o de 40 minutos. El 22 es real y se queda en los datos; lo que cambia es qué medida se reporta como típica.",
    wordBank: ["outlier", "mean", "median", "typical", "measure of center", "data set", "skew"],
    wordBankEs: ["valor atípico", "media", "mediana", "típico", "medida de centro", "conjunto de datos", "sesgo"],
  },

  "stat-frequency-vs-value": {
    tag: "stat-frequency-vs-value",
    standards: ["6.DS.5"],
    persona: { name: "Axis", blurb: "Reads the wrong axis of a histogram.", blurbEs: "Lee el eje equivocado de un histograma." },
    wrongIdea: "the numbers written under a histogram's bars are the answer to how many",
    wrongIdeaEs: "los números escritos bajo las barras del histograma responden cuántos",
    openingLine: "The bar labelled 10 to 19 was the tallest, so when they asked how many players were in it I answered 19. That is the number printed on the bar.",
    openingLineEs: "La barra de 10 a 19 era la más alta, así que cuando preguntaron cuántos jugadores había respondí 19. Es el número impreso en la barra.",
    probes: ["There are two sets of numbers on this graph. Which is which?", "What is the height even for, then?", "How would I answer a question about scores instead of players?"],
    probesEs: ["Hay dos grupos de números en la gráfica. ¿Cuál es cuál?", "Entonces, ¿para qué sirve la altura?", "¿Cómo respondería una pregunta sobre puntajes en vez de jugadores?"],
    mustAddress: [
      A("height-is-count", "The height of a bar counts how many", "La altura de la barra cuenta cuántos", [["height"],["how many"],["count"],["tall"],["altura"],["cuántos"],["cuenta"]]),
      A("label-is-values", "The label underneath names which values the bar covers", "La etiqueta de abajo dice cuáles valores cubre la barra", [["label"],["underneath"],["which values"],["interval"],["etiqueta"],["cuáles valores"],["intervalo"]]),
      A("read-the-question", "Decide which of the two the question asks for", "Decide cuál de las dos pide la pregunta", [["question"],["asking"],["decide"],["pregunta"],["pide"],["decide"]]),
    ],
    giveawayPhrases: ["read the height", "look at the vertical axis", "lee la altura"],
    worked: "A histogram has two different number lines. Along the bottom, 10 to 19 names the scores a bar covers. Up the side, the height counts the players. If that bar reaches 12, then twelve players scored somewhere between 10 and 19. Answering 19 would report a score, not a headcount — and the question asked how many.",
    workedEs: "Un histograma tiene dos rectas numéricas distintas. Abajo, 10 a 19 nombra los puntajes que cubre una barra. Al lado, la altura cuenta los jugadores. Si esa barra llega a 12, doce jugadores obtuvieron entre 10 y 19. Responder 19 reportaría un puntaje, no un conteo, y la pregunta pedía cuántos.",
    wordBank: ["histogram", "frequency", "interval", "bar", "axis", "data value", "count"],
    wordBankEs: ["histograma", "frecuencia", "intervalo", "barra", "eje", "valor de los datos", "conteo"],
  },

  "coord-xy-swapped": {
    tag: "coord-xy-swapped",
    standards: ["6.NOS.6", "6.NOS.7"],
    persona: {
      name: "Pip",
      blurb: "Plots points confidently, in whichever order they were written.",
      blurbEs: "Marca puntos con confianza, en el orden en que estén escritos.",
    },
    wrongIdea:
      "the two numbers in an ordered pair are interchangeable, so it does not matter which one you move along first",
    wrongIdeaEs:
      "los dos números de un par ordenado son intercambiables, así que no importa cuál muevas primero",
    // Never names "across then up" — that is the giveaway the validator checks
    // for. The opening states the confusion and stops.
    openingLine:
      "I plotted (2, 6) by going up 2 and across 6. It landed somewhere, so that must be the point, right?",
    openingLineEs:
      "Marqué (2, 6) subiendo 2 y avanzando 6. Cayó en algún lugar, así que ese debe ser el punto, ¿verdad?",
    probes: [
      "How would anyone even know which number I was supposed to use first?",
      "If I plot (2, 6) and my friend plots (6, 2), are we not at the same place?",
      "What is the point of having two axes if the numbers just mean the same thing?",
    ],
    probesEs: [
      "¿Cómo sabría alguien cuál número debo usar primero?",
      "Si yo marco (2, 6) y mi amigo marca (6, 2), ¿no estamos en el mismo lugar?",
      "¿Para qué sirven dos ejes si los números significan lo mismo?",
    ],
    mustAddress: [
      A(
        "order-is-fixed",
        "The order is a rule everyone agrees on, not a choice",
        "El orden es una regla que todos acuerdan, no una elección",
        [
          ["order"],
          ["first"],
          ["always"],
          ["rule"],
          ["orden"],
          ["primero"],
          ["siempre"],
          ["regla"],
        ],
      ),
      A(
        "x-is-horizontal",
        "The first number moves you horizontally, along the x-axis",
        "El primer número te mueve horizontalmente, sobre el eje x",
        [
          ["horizontal"],
          ["x-axis"],
          ["x axis"],
          ["side"],
          ["right"],
          ["left"],
          ["eje x"],
          ["lado"],
          ["derecha"],
          ["izquierda"],
        ],
      ),
      A(
        "swap-is-different-point",
        "Swapping them lands on a different point entirely",
        "Intercambiarlos cae en un punto completamente distinto",
        [
          ["different"],
          ["not the same"],
          ["another point"],
          ["distinto"],
          ["diferente"],
          ["no es el mismo"],
        ],
      ),
    ],
    giveawayPhrases: [
      "across then up",
      "over and up",
      "right then up",
      "run then rise",
      "primero de lado",
      "primero horizontal",
    ],
    worked:
      "Plot (2, 6) and (6, 2) on the same grid and they land in different places: the first sits 2 along and 6 up, the second 6 along and 2 up. Both are real points, but only one of them is the point that was named. The order is what tells them apart, which is why the pair is called ordered.",
    workedEs:
      "Marca (2, 6) y (6, 2) en la misma cuadrícula y caen en lugares distintos: el primero queda a 2 de lado y 6 hacia arriba; el segundo, a 6 de lado y 2 hacia arriba. Los dos son puntos reales, pero solo uno es el punto que se nombró. El orden es lo que los distingue, y por eso el par se llama ordenado.",
    wordBank: [
      "ordered pair",
      "x-coordinate",
      "y-coordinate",
      "horizontal",
      "vertical",
      "origin",
      "axis",
    ],
    wordBankEs: [
      "par ordenado",
      "coordenada x",
      "coordenada y",
      "horizontal",
      "vertical",
      "origen",
      "eje",
    ],
  },

  "measure-area-perimeter-swap": {
    tag: "measure-area-perimeter-swap",
    standards: ["6.GR.1"],
    persona: {
      name: "Comet",
      blurb: "Measures enthusiastically and mixes up what got measured.",
      blurbEs: "Mide con entusiasmo y confunde qué fue lo que midió.",
    },
    wrongIdea:
      "area and perimeter measure the same thing, so you can find either one by going around the shape",
    wrongIdeaEs:
      "el área y el perímetro miden lo mismo, así que puedes hallar cualquiera rodeando la figura",
    openingLine:
      "The problem asked how much carpet fits in the room, and I added up all four sides. That gives the size of the room, does it not?",
    openingLineEs:
      "El problema preguntaba cuánta alfombra cabe en el cuarto, y sumé los cuatro lados. Eso da el tamaño del cuarto, ¿no?",
    probes: [
      "What would I actually be measuring if I walked all the way around the edge?",
      "Why do some answers end in square feet and others just say feet? I never know which to write.",
      "If I made the room twice as long, what would happen to each of those two measurements?",
    ],
    probesEs: [
      "¿Qué estaría midiendo en realidad si caminara por todo el borde?",
      "¿Por qué unas respuestas terminan en pies cuadrados y otras solo en pies? Nunca sé cuál escribir.",
      "Si hiciera el cuarto el doble de largo, ¿qué pasaría con cada una de esas dos medidas?",
    ],
    mustAddress: [
      A(
        "area-covers-inside",
        "Area counts the square units that COVER the inside",
        "El área cuenta las unidades cuadradas que CUBREN el interior",
        [
          ["cover"],
          ["inside"],
          ["square unit"],
          ["fill"],
          ["cubr"],
          ["adentro"],
          ["unidades cuadradas"],
        ],
      ),
      A(
        "perimeter-goes-around",
        "Perimeter measures the distance all the way around the edge",
        "El perímetro mide la distancia alrededor del borde",
        [["around"], ["edge"], ["border"], ["fence"], ["alrededor"], ["borde"], ["contorno"]],
      ),
      A(
        "units-tell-which",
        "The unit tells you which one you found: units for perimeter, square units for area",
        "La unidad te dice cuál hallaste: unidades para el perímetro, unidades cuadradas para el área",
        [["square unit"], ["squared"], ["unit"], ["unidad"], ["cuadrad"]],
      ),
    ],
    giveawayPhrases: [
      "length times width",
      "just add the sides",
      "l times w",
      "largo por ancho",
      "suma los lados",
    ],
    worked:
      "Walking the edge measures a length, so it is reported in feet. Covering the floor counts how many one-foot squares fit inside, so it is reported in square feet. Carpet fills the inside, which makes this an area question, and the unit on the answer is the giveaway.",
    workedEs:
      "Caminar el borde mide una longitud, así que se reporta en pies. Cubrir el piso cuenta cuántos cuadrados de un pie caben adentro, así que se reporta en pies cuadrados. La alfombra llena el interior, así que es una pregunta de área, y la unidad de la respuesta lo delata.",
    wordBank: ["area", "perimeter", "square units", "cover", "boundary", "decompose"],
    wordBankEs: ["área", "perímetro", "unidades cuadradas", "cubrir", "contorno", "descomponer"],
  },

  "op-added-instead-of-multiplied": {
    tag: "op-added-instead-of-multiplied",
    standards: ["6.AT.6a"],
    persona: {
      name: "Sprocket",
      blurb: "Translates word problems fast and picks the friendliest symbol.",
      blurbEs: "Traduce problemas rápido y escoge el símbolo más amistoso.",
    },
    wrongIdea:
      "adding and multiplying both make things bigger, so five times a number can be written 5 + n",
    wrongIdeaEs:
      "sumar y multiplicar hacen las cosas más grandes, así que cinco veces un número se puede escribir 5 + n",
    openingLine:
      "I wrote 5 + n for five times a number. Both symbols make things bigger, so I picked the one I know best. Is that not okay?",
    openingLineEs:
      "Escribí 5 + n para cinco veces un número. Los dos símbolos hacen las cosas más grandes, así que escogí el que mejor conozco. ¿No está bien?",
    probes: [
      "What does multiplying actually DO to a quantity that adding does not?",
      "If n were 100, what would each of my two expressions give me? Would either one fit the story?",
      "How do I hear the difference in the words so I choose right the next time?",
    ],
    probesEs: [
      "¿Qué le HACE multiplicar a una cantidad que sumar no le hace?",
      "Si n fuera 100, ¿qué me daría cada una de mis dos expresiones? ¿Alguna cabría en la historia?",
      "¿Cómo escucho la diferencia en las palabras para escoger bien la próxima vez?",
    ],
    mustAddress: [
      A(
        "operations-do-different-things",
        "Adding joins one more amount; multiplying makes copies, or groups, of an amount",
        "Sumar junta una cantidad más; multiplicar hace copias, o grupos, de una cantidad",
        [
          ["group"],
          ["copies"],
          ["times as many"],
          ["repeated addition"],
          ["grupo"],
          ["copias"],
          ["veces mas"],
        ],
      ),
      A(
        "test-with-a-number",
        "Substituting a number tests whether the expression matches the story",
        "Sustituir un número comprueba si la expresión coincide con la historia",
        [
          ["plug in"],
          ["substitut"],
          ["try a number"],
          ["test it"],
          ["sustitu"],
          ["prueba con"],
          ["reemplaz"],
        ],
      ),
      A(
        "words-signal-the-operation",
        "Words like times, each, per, and of signal which operation the story means",
        "Palabras como veces, cada, por y de indican qué operación quiere la historia",
        [["each"], ["per "], ["times"], ["key word"], ["palabra"], ["cada"], ["veces"]],
      ),
    ],
    giveawayPhrases: [
      "times means multiply",
      "just look for the key word",
      "veces significa multiplicar",
    ],
    worked:
      "Adding 5 hands you five more of whatever n is, one single time. Multiplying by 5 makes five copies of n, so the amount you gain depends on n. Test it: if n is 100, 5 + n is 105 but 5n is 500 — only one of those is five times as much.",
    workedEs:
      "Sumar 5 te da cinco más de lo que sea n, una sola vez. Multiplicar por 5 hace cinco copias de n, así que lo que ganas depende de n. Pruébalo: si n es 100, 5 + n es 105 pero 5n es 500 — solo uno de esos es cinco veces más.",
    wordBank: ["expression", "variable", "term", "coefficient", "groups of", "substitute"],
    wordBankEs: ["expresión", "variable", "término", "coeficiente", "grupos de", "sustituir"],
  },

  "op-divided-instead-of-multiplied": {
    tag: "op-divided-instead-of-multiplied",
    standards: ["6.AT.3"],
    persona: {
      name: "Iris",
      blurb: "Grabs the two numbers in a story and hopes for the best.",
      blurbEs: "Toma los dos números de la historia y espera lo mejor.",
    },
    wrongIdea:
      "when a story has two numbers you divide them, even when the question asks for more of something",
    wrongIdeaEs:
      "cuando una historia tiene dos números los divides, aunque la pregunta pida más de algo",
    openingLine:
      "Three notebooks cost 6 dollars. For seven notebooks I did 7 divided by 6 and got about 1.17. The number feels wrong but I cannot say why.",
    openingLineEs:
      "Tres cuadernos cuestan 6 dólares. Para siete cuadernos hice 7 entre 6 y me dio como 1.17. El número se siente mal pero no sé decir por qué.",
    probes: [
      "Should seven notebooks cost more or less than three? How would I know that before computing anything?",
      "What does 6 dollars for 3 notebooks tell me about ONE notebook?",
      "Once I know about one notebook, how does that help me with seven?",
    ],
    probesEs: [
      "¿Siete cuadernos deben costar más o menos que tres? ¿Cómo lo sabría antes de calcular?",
      "¿Qué me dice 6 dólares por 3 cuadernos sobre UN cuaderno?",
      "Cuando ya sé lo de un cuaderno, ¿en qué me ayuda eso con siete?",
    ],
    mustAddress: [
      A(
        "estimate-the-direction",
        "Decide first whether the answer should be bigger or smaller than what you started with",
        "Decide primero si la respuesta debe ser mayor o menor que con lo que empezaste",
        [
          ["should be bigger"],
          ["should cost more"],
          ["more than"],
          ["estimat"],
          ["debe ser mayor"],
          ["debe costar mas"],
          ["mas que"],
        ],
      ),
      A(
        "find-the-unit-rate",
        "Find the amount for ONE item before scaling to a different number of items",
        "Halla la cantidad para UN artículo antes de escalar a otra cantidad",
        [
          ["unit rate"],
          ["one notebook"],
          ["per one"],
          ["each one"],
          ["for 1"],
          ["tasa unitaria"],
          ["por uno"],
          ["cada uno"],
        ],
      ),
      A(
        "scaling-makes-groups",
        "Going up to more items means making equal groups, not splitting one up",
        "Subir a más artículos significa hacer grupos iguales, no repartir uno",
        [
          ["equal group"],
          ["scale up"],
          ["multiply"],
          ["seven times"],
          ["grupos iguales"],
          ["multiplic"],
          ["escalar"],
        ],
      ),
    ],
    giveawayPhrases: [
      "just divide then multiply",
      "cross multiply",
      "set up a proportion",
      "multiplicacion cruzada",
    ],
    worked:
      "Seven notebooks must cost more than three, so the answer has to be above 6 dollars — 1.17 fails that check instantly. Six dollars split among three notebooks is 2 dollars for one. Seven notebooks is seven of those groups, so 7 x 2 = 14 dollars.",
    workedEs:
      "Siete cuadernos deben costar más que tres, así que la respuesta tiene que pasar de 6 dólares — 1.17 falla esa prueba de inmediato. Seis dólares repartidos entre tres cuadernos son 2 dólares por uno. Siete cuadernos son siete de esos grupos, así que 7 x 2 = 14 dólares.",
    wordBank: ["rate", "unit rate", "per", "scale", "equivalent ratio", "reasonable"],
    wordBankEs: ["tasa", "tasa unitaria", "por", "escalar", "razón equivalente", "razonable"],
  },

  "op-multiplied-instead-of-added": {
    tag: "op-multiplied-instead-of-added",
    standards: ["6.AT.6a"],
    persona: {
      name: "Juno",
      blurb: "Writes expressions confidently and rarely checks them.",
      blurbEs: "Escribe expresiones con confianza y casi nunca las revisa.",
    },
    wrongIdea: "increased by four means four times the number, because both make the number bigger",
    wrongIdeaEs:
      "aumentado en cuatro significa cuatro veces el número, porque los dos lo hacen más grande",
    openingLine:
      "I wrote 4n for a number increased by four. It gets bigger either way, so I went with 4n. What did I miss?",
    openingLineEs:
      "Escribí 4n para un número aumentado en cuatro. De todos modos se hace más grande, así que puse 4n. ¿Qué se me pasó?",
    probes: [
      "If n were 10, what does each version give me? Do both still fit the story?",
      "What does increased by four tell me about HOW MUCH is being added on?",
      "Does the amount I add depend on n, or is it always the same amount?",
    ],
    probesEs: [
      "Si n fuera 10, ¿qué me da cada versión? ¿Las dos siguen cabiendo en la historia?",
      "¿Qué me dice aumentado en cuatro sobre CUÁNTO se está agregando?",
      "¿La cantidad que agrego depende de n, o siempre es la misma cantidad?",
    ],
    mustAddress: [
      A(
        "increase-is-a-fixed-amount",
        "Increased by four adds the SAME four no matter what n is",
        "Aumentado en cuatro agrega los MISMOS cuatro sin importar cuánto valga n",
        [
          ["same amount"],
          ["always 4"],
          ["always four"],
          ["fixed"],
          ["no matter"],
          ["misma cantidad"],
          ["siempre 4"],
          ["sin importar"],
        ],
      ),
      A(
        "multiplying-scales-with-n",
        "Multiplying by four makes it four times as big, so what you gain changes with n",
        "Multiplicar por cuatro lo hace cuatro veces más grande, así que lo que ganas cambia con n",
        [
          ["times as"],
          ["four times"],
          ["depends on n"],
          ["scale"],
          ["veces mas"],
          ["depende de n"],
        ],
      ),
      A(
        "test-with-a-number",
        "Substituting a value shows which expression matches",
        "Sustituir un valor muestra cuál expresión coincide",
        [
          ["plug in"],
          ["substitut"],
          ["try n"],
          ["test it"],
          ["if n is"],
          ["sustitu"],
          ["prueba con"],
          ["si n es"],
        ],
      ),
    ],
    giveawayPhrases: [
      "increased by means add",
      "just look for the key word",
      "aumentado significa sumar",
    ],
    worked:
      "Increased by four adds a fixed four every single time, so it is n + 4. Multiplying by four grows the number by an amount that depends on n. Test it: when n is 10, n + 4 is 14 but 4n is 40, and only 14 is four more than what we started with.",
    workedEs:
      "Aumentado en cuatro agrega cuatro fijos cada vez, así que es n + 4. Multiplicar por cuatro lo hace crecer una cantidad que depende de n. Pruébalo: cuando n es 10, n + 4 es 14 pero 4n es 40, y solo 14 es cuatro más que con lo que empezamos.",
    wordBank: ["expression", "variable", "sum", "product", "constant", "substitute"],
    wordBankEs: ["expresión", "variable", "suma", "producto", "constante", "sustituir"],
  },

  "op-multiplied-instead-of-divided": {
    tag: "op-multiplied-instead-of-divided",
    standards: ["6.AT.2"],
    persona: {
      name: "Cobalt",
      blurb: "Reaches for multiplication first, every time.",
      blurbEs: "Siempre echa mano de la multiplicación primero.",
    },
    wrongIdea: "to find how much happens in one hour you multiply the total by the number of hours",
    wrongIdeaEs:
      "para hallar cuánto pasa en una hora multiplicas el total por la cantidad de horas",
    openingLine:
      "A car went 180 miles in 3 hours, so I did 180 times 3 and said 540 miles per hour. That is faster than a plane. Where did my thinking go wrong?",
    openingLineEs:
      "Un carro recorrió 180 millas en 3 horas, así que hice 180 por 3 y dije 540 millas por hora. Eso es más rápido que un avión. ¿Dónde falló mi razonamiento?",
    probes: [
      "Should the miles in ONE hour be more or less than the miles in three hours?",
      "What is actually being shared out in this story, and among how many?",
      "Is there a quick check I could do to catch an answer that is wildly too big?",
    ],
    probesEs: [
      "¿Las millas en UNA hora deben ser más o menos que las millas en tres horas?",
      "¿Qué se está repartiendo en esta historia, y entre cuántos?",
      "¿Hay una revisión rápida para atrapar una respuesta muy exagerada?",
    ],
    mustAddress: [
      A(
        "unit-rate-is-for-one",
        "A unit rate tells you the amount for exactly ONE of something",
        "Una tasa unitaria dice la cantidad para exactamente UNO",
        [
          ["per one"],
          ["one hour"],
          ["for 1"],
          ["unit rate"],
          ["por una hora"],
          ["por uno"],
          ["tasa unitaria"],
        ],
      ),
      A(
        "parts-are-smaller",
        "Splitting a total into parts makes each part smaller than the total",
        "Repartir un total en partes hace cada parte menor que el total",
        [
          ["smaller"],
          ["less than"],
          ["split"],
          ["share"],
          ["divide"],
          ["menor"],
          ["repart"],
          ["divid"],
        ],
      ),
      A(
        "estimate-catches-it",
        "Estimating first catches an answer that is obviously too big",
        "Estimar primero atrapa una respuesta que es obviamente demasiado grande",
        [
          ["estimat"],
          ["reasonable"],
          ["make sense"],
          ["makes sense"],
          ["check"],
          ["estim"],
          ["razonable"],
          ["tiene sentido"],
        ],
      ),
    ],
    giveawayPhrases: [
      "just divide the two numbers",
      "distance over time",
      "distancia sobre tiempo",
      "solo divide los numeros",
    ],
    worked:
      "One hour is a piece of the three hours, so the miles in one hour must be smaller than 180, not larger. The 180 miles get shared across 3 hours, giving 60 miles in each single hour. Estimating first — one hour is a third of the trip — makes 540 impossible before any arithmetic happens.",
    workedEs:
      "Una hora es una parte de las tres horas, así que las millas en una hora deben ser menos de 180, no más. Las 180 millas se reparten entre 3 horas, dando 60 millas en cada hora. Estimar primero — una hora es un tercio del viaje — hace imposible el 540 antes de calcular.",
    wordBank: ["rate", "unit rate", "per", "quotient", "reasonable", "estimate"],
    wordBankEs: ["tasa", "tasa unitaria", "por", "cociente", "razonable", "estimar"],
  },

  "op-reversed-division": {
    tag: "op-reversed-division",
    standards: ["6.AT.2", "6.NOS.2"],
    persona: {
      name: "Willow",
      blurb: "Writes the numbers in the order they appear in the sentence.",
      blurbEs: "Escribe los números en el orden en que aparecen en la oración.",
    },
    wrongIdea:
      "you write a division in the order the numbers show up in the sentence, so 12 cookies for 4 friends is 4 divided by 12",
    wrongIdeaEs:
      "escribes una división en el orden en que aparecen los números, así que 12 galletas para 4 amigos es 4 entre 12",
    openingLine:
      "The story said 12 cookies for 4 friends, so I wrote 4 divided by 12 and got 0.33. I used the order they appeared in. Is order supposed to matter?",
    openingLineEs:
      "La historia decía 12 galletas para 4 amigos, así que escribí 4 entre 12 y me dio 0.33. Usé el orden en que aparecieron. ¿Se supone que el orden importa?",
    probes: [
      "Which number is the thing being split up, and which one says into how many parts?",
      "Would a third of a cookie each make sense when there are 12 whole cookies on the table?",
      "Is there a sentence I could say out loud that would stop me from flipping them?",
    ],
    probesEs: [
      "¿Cuál número es lo que se está repartiendo, y cuál dice en cuántas partes?",
      "¿Tendría sentido un tercio de galleta para cada quien si hay 12 galletas enteras en la mesa?",
      "¿Hay una oración que pueda decir en voz alta para no invertirlos?",
    ],
    mustAddress: [
      A(
        "name-the-whole",
        "Name what is being split up before you write anything down",
        "Nombra lo que se está repartiendo antes de escribir nada",
        [
          ["being split"],
          ["the whole"],
          ["total"],
          ["what is shared"],
          ["se reparte"],
          ["el total"],
          ["lo que se comparte"],
        ],
      ),
      A(
        "name-the-parts",
        "Name how many equal parts it is being split into",
        "Nombra en cuántas partes iguales se está repartiendo",
        [
          ["how many parts"],
          ["number of group"],
          ["equal part"],
          ["how many people"],
          ["cuantas partes"],
          ["partes iguales"],
          ["cuantas personas"],
        ],
      ),
      A(
        "order-is-not-reversible",
        "Division is not reversible — a divided by b is not the same as b divided by a",
        "La división no es reversible — a entre b no es lo mismo que b entre a",
        [
          ["order matters"],
          ["not the same"],
          ["can't switch"],
          ["cannot switch"],
          ["not reversible"],
          ["no es lo mismo"],
          ["el orden importa"],
        ],
      ),
    ],
    giveawayPhrases: [
      "big number goes first",
      "bigger number first",
      "just put the bigger number in",
      "el numero grande va primero",
    ],
    worked:
      "The cookies are the thing being shared, and the friends say how many equal groups. So the 12 goes inside the box: 12 shared among 4 is 3 cookies each. Saying the sentence out loud — twelve cookies split among four friends — fixes the order before any symbol gets written.",
    workedEs:
      "Las galletas son lo que se reparte, y los amigos dicen cuántos grupos iguales hay. Así que el 12 va adentro: 12 repartidas entre 4 son 3 galletas para cada quien. Decir la oración en voz alta — doce galletas repartidas entre cuatro amigos — arregla el orden antes de escribir cualquier símbolo.",
    wordBank: ["dividend", "divisor", "quotient", "equal groups", "share", "total"],
    wordBankEs: ["dividendo", "divisor", "cociente", "grupos iguales", "repartir", "total"],
  },

  "op-reversed-subtraction": {
    tag: "op-reversed-subtraction",
    standards: ["6.AT.6a"],
    persona: {
      name: "Orbit",
      blurb: "Trusts that math sentences read exactly like English ones.",
      blurbEs: "Confía en que las oraciones matemáticas se leen igual que en español.",
    },
    wrongIdea: "the math goes in the order the words go, so seven less than a number is 7 minus n",
    wrongIdeaEs:
      "las matemáticas van en el orden de las palabras, así que siete menos que un número es 7 menos n",
    openingLine:
      "I wrote 7 minus n for seven less than a number. The 7 came first in the sentence, so I put it first. Does the word order not match the math order?",
    openingLineEs:
      "Escribí 7 menos n para siete menos que un número. El 7 venía primero en la oración, así que lo puse primero. ¿El orden de las palabras no coincide con el de las matemáticas?",
    probes: [
      "If n is 20, which version matches a story where I lose 7 of something?",
      "Which quantity is the one that starts out, and which one gets taken away?",
      "Why would English put them in a different order than the math does?",
    ],
    probesEs: [
      "Si n es 20, ¿cuál versión coincide con una historia donde pierdo 7 de algo?",
      "¿Cuál cantidad es la que empieza, y cuál es la que se quita?",
      "¿Por qué el español los pondría en otro orden que las matemáticas?",
    ],
    mustAddress: [
      A(
        "starting-amount-comes-first",
        "The amount you start with is the number you take FROM, so it is written first",
        "La cantidad con la que empiezas es de la que QUITAS, así que se escribe primero",
        [
          ["start with"],
          ["starting"],
          ["take from"],
          ["taken from"],
          ["begin"],
          ["empiez"],
          ["se le quita"],
          ["comienz"],
        ],
      ),
      A(
        "subtraction-not-reversible",
        "Subtraction is not reversible — 7 minus n is a different value than n minus 7",
        "La resta no es reversible — 7 menos n vale distinto que n menos 7",
        [
          ["not the same"],
          ["order matters"],
          ["can't switch"],
          ["cannot switch"],
          ["different"],
          ["no es lo mismo"],
          ["el orden importa"],
        ],
      ),
      A(
        "test-with-a-number",
        "Trying a value shows which expression matches the story",
        "Probar un valor muestra cuál expresión coincide con la historia",
        [
          ["plug in"],
          ["substitut"],
          ["if n is"],
          ["try"],
          ["test it"],
          ["sustitu"],
          ["si n es"],
          ["prueba con"],
        ],
      ),
    ],
    giveawayPhrases: [
      "less than means flip it",
      "just reverse it",
      "menos que significa invertir",
      "solo invertirlo",
    ],
    worked:
      "The number you start with is n, and 7 is what leaves, so it is n minus 7. Test it: if n is 20, n minus 7 is 13, which is seven less than 20. The other way round gives a negative number that no longer describes losing seven from twenty.",
    workedEs:
      "El número con el que empiezas es n, y 7 es lo que se va, así que es n menos 7. Pruébalo: si n es 20, n menos 7 es 13, que es siete menos que 20. Al revés da un número negativo que ya no describe perder siete de veinte.",
    wordBank: ["expression", "variable", "difference", "minuend", "substitute", "order"],
    wordBankEs: ["expresión", "variable", "diferencia", "minuendo", "sustituir", "orden"],
  },

  "order-of-operations-left-to-right": {
    tag: "order-of-operations-left-to-right",
    standards: ["6.AT.5", "6.AT.6c"],
    persona: {
      name: "Pepper",
      blurb: "Reads math the way it reads a book, straight across.",
      blurbEs: "Lee las matemáticas como lee un libro, de corrido.",
    },
    wrongIdea: "you always work an expression left to right like a sentence, so 3 + 4 x 2 is 14",
    wrongIdeaEs:
      "siempre trabajas una expresión de izquierda a derecha como una oración, así que 3 + 4 x 2 es 14",
    openingLine:
      "I read 3 + 4 x 2 left to right like a sentence and got 14. Reading works left to right, so why would math not?",
    openingLineEs:
      "Leí 3 + 4 x 2 de izquierda a derecha como una oración y me dio 14. La lectura va de izquierda a derecha, ¿por qué las matemáticas no?",
    probes: [
      "Would two people get the same answer if everyone picked their own order?",
      "Which operation in that expression is doing the grouping work?",
      "Where do parentheses fit in — what are they for if an order is already decided?",
    ],
    probesEs: [
      "¿Dos personas obtendrían la misma respuesta si cada quien escogiera su propio orden?",
      "¿Cuál operación en esa expresión está haciendo el trabajo de agrupar?",
      "¿Dónde entran los paréntesis? ¿Para qué sirven si ya hay un orden decidido?",
    ],
    mustAddress: [
      A(
        "one-expression-one-value",
        "Everyone follows one shared order so an expression has exactly one value",
        "Todos siguen un orden compartido para que una expresión tenga un solo valor",
        [
          ["same answer"],
          ["one answer"],
          ["agree"],
          ["everyone"],
          ["mismo resultado"],
          ["una sola respuesta"],
          ["todos"],
        ],
      ),
      A(
        "multiply-before-add",
        "Multiplication and division happen before addition and subtraction",
        "La multiplicación y la división van antes que la suma y la resta",
        [
          ["before"],
          ["multiply first"],
          ["multiplication first"],
          ["antes"],
          ["primero"],
          ["multiplic", "primero"],
        ],
      ),
      A(
        "grouping-symbols-override",
        "Parentheses exist to change that order on purpose",
        "Los paréntesis existen para cambiar ese orden a propósito",
        [["parenthes"], ["grouping"], ["bracket"], ["parentesis"], ["agrupa"]],
      ),
    ],
    giveawayPhrases: [
      "pemdas",
      "gemdas",
      "bodmas",
      "please excuse my dear aunt sally",
      "jerarquia de operaciones y ya",
    ],
    worked:
      "4 x 2 is one bundled quantity — eight of something — so it has to be built before it can be joined onto the 3. That gives 3 + 8 = 11. The shared order exists so a class of thirty gets one answer instead of thirty; parentheses are the tool for overriding it deliberately.",
    workedEs:
      "4 x 2 es una cantidad agrupada — ocho de algo — así que hay que armarla antes de unirla al 3. Eso da 3 + 8 = 11. El orden compartido existe para que una clase de treinta obtenga una respuesta y no treinta; los paréntesis son la herramienta para cambiarlo a propósito.",
    wordBank: ["expression", "evaluate", "parentheses", "grouping", "operation", "exponent"],
    wordBankEs: ["expresión", "evaluar", "paréntesis", "agrupación", "operación", "exponente"],
  },

  "percent-scale-off-by-100": {
    tag: "percent-scale-off-by-100",
    standards: ["6.AT.4"],
    persona: {
      name: "Fern",
      blurb: "Treats the percent sign as a decoration on a normal number.",
      blurbEs: "Trata el signo de porcentaje como un adorno sobre un número normal.",
    },
    wrongIdea:
      "a percent of a number is found by multiplying the two numbers, so 20% of 60 is 1200",
    wrongIdeaEs:
      "un porcentaje de un número se halla multiplicando los dos números, así que 20% de 60 es 1200",
    openingLine:
      "I did 20% of 60 and got 1200. I multiplied the two numbers together. But 1200 is way more than 60. What is going on?",
    openingLineEs:
      "Hice 20% de 60 y me dio 1200. Multipliqué los dos números. Pero 1200 es muchísimo más que 60. ¿Qué está pasando?",
    probes: [
      "Can a part of 60 ever be bigger than 60 itself?",
      "What does that little % symbol actually mean when I read it out loud?",
      "What would 50% of 60 be? Could I use that to test whether my answer is sensible?",
    ],
    probesEs: [
      "¿Una parte de 60 puede ser mayor que 60?",
      "¿Qué significa de verdad ese simbolito % cuando lo leo en voz alta?",
      "¿Cuánto sería 50% de 60? ¿Podría usar eso para probar si mi respuesta tiene sentido?",
    ],
    mustAddress: [
      A(
        "percent-means-per-hundred",
        "Percent means per hundred — 20% is 20 out of every 100",
        "Por ciento significa por cada cien — 20% es 20 de cada 100",
        [
          ["per hundred"],
          ["out of 100"],
          ["out of a hundred"],
          ["por cada cien"],
          ["de cada 100"],
          ["por ciento", "cien"],
        ],
      ),
      A(
        "a-part-is-not-bigger",
        "A part of a quantity can never be bigger than the whole quantity",
        "Una parte de una cantidad nunca puede ser mayor que el total",
        [
          ["can't be bigger"],
          ["cannot be bigger"],
          ["smaller than"],
          ["less than the whole"],
          ["no puede ser mayor"],
          ["menor que"],
        ],
      ),
      A(
        "benchmark-check",
        "Benchmarks like 50% and 10% show whether the answer is reasonable",
        "Referencias como 50% y 10% muestran si la respuesta es razonable",
        [["50%"], ["10%"], ["half of"], ["benchmark"], ["la mitad"], ["referencia"], ["razonable"]],
      ),
    ],
    giveawayPhrases: [
      "just move the decimal two places",
      "divide by 100 and multiply",
      "mueve el punto dos lugares",
    ],
    worked:
      "20% means 20 out of every 100, so it is a fifth of whatever it sits on. A fifth of 60 has to be well under 60, and 50% of 60 would be 30, so a sensible answer is far below 30. Twenty out of every hundred of 60 is 12.",
    workedEs:
      "20% significa 20 de cada 100, así que es un quinto de lo que sea. Un quinto de 60 tiene que ser mucho menos que 60, y 50% de 60 sería 30, así que una respuesta sensata está muy por debajo de 30. Veinte de cada cien de 60 es 12.",
    wordBank: ["percent", "per hundred", "whole", "part", "benchmark", "reasonable"],
    wordBankEs: ["porcentaje", "por cada cien", "entero", "parte", "referencia", "razonable"],
  },

  "percent-used-as-whole-number": {
    tag: "percent-used-as-whole-number",
    standards: ["6.AT.4"],
    persona: {
      name: "Lumen",
      blurb: "Uses a percent like it is already an amount of dollars.",
      blurbEs: "Usa un porcentaje como si ya fuera una cantidad de dólares.",
    },
    wrongIdea: "a percent is just a number, so a 15% tip on a bill means adding 15 dollars",
    wrongIdeaEs:
      "un porcentaje es solo un número, así que una propina del 15% significa agregar 15 dólares",
    openingLine:
      "The bill was 40 dollars and the tip was 15%, so I added 15 dollars. A percent is a number, so I used it like one. What am I missing?",
    openingLineEs:
      "La cuenta era de 40 dólares y la propina era 15%, así que agregué 15 dólares. Un porcentaje es un número, así que lo usé como tal. ¿Qué se me escapa?",
    probes: [
      "Would 15% of a 4 dollar bill also be 15 dollars? That cannot be right, can it?",
      "What is that 15 being compared to?",
      "How would I even say 15% in a form I can compute with?",
    ],
    probesEs: [
      "¿15% de una cuenta de 4 dólares también sería 15 dólares? Eso no puede ser, ¿verdad?",
      "¿Con qué se está comparando ese 15?",
      "¿Cómo diría 15% en una forma con la que pueda calcular?",
    ],
    mustAddress: [
      A(
        "percent-is-always-of-something",
        "A percent is always OF something — change the whole and the amount changes",
        "Un porcentaje siempre es DE algo — cambia el total y cambia la cantidad",
        [
          ["of the whole"],
          ["depends on"],
          ["out of"],
          ["compared to"],
          ["del total"],
          ["depende"],
          ["comparado"],
        ],
      ),
      A(
        "rewrite-before-computing",
        "Rewrite the percent as a fraction or a decimal before you compute with it",
        "Reescribe el porcentaje como fracción o decimal antes de calcular con él",
        [
          ["decimal"],
          ["fraction"],
          ["0.15"],
          ["15/100"],
          ["15 out of 100"],
          ["fraccion"],
          ["15 de cada 100"],
        ],
      ),
      A(
        "benchmark-check",
        "Check the size against an easy benchmark like 10% of the bill",
        "Revisa el tamaño con una referencia fácil como el 10% de la cuenta",
        [["10%"], ["benchmark"], ["half"], ["estimat"], ["referencia"], ["la mitad"], ["estim"]],
      ),
    ],
    giveawayPhrases: ["just multiply by 0.15", "move the decimal over", "solo multiplica por 0.15"],
    worked:
      "A percent is a rate, not an amount, so it needs a whole to act on. Fifteen per hundred of 40 dollars means fifteen for every hundred, and 40 is under half of a hundred, so the tip has to be under 7.50. Ten percent of 40 is 4, and half of that again is 2, so 15% is 6 dollars.",
    workedEs:
      "Un porcentaje es una tasa, no una cantidad, así que necesita un total sobre el cual actuar. Quince por cada cien de 40 dólares significa quince por cada cien, y 40 es menos de la mitad de cien, así que la propina debe ser menos de 7.50. El diez por ciento de 40 es 4, y la mitad de eso es 2, así que 15% son 6 dólares.",
    wordBank: ["percent", "rate", "whole", "decimal", "benchmark", "of"],
    wordBankEs: ["porcentaje", "tasa", "entero", "decimal", "referencia", "de"],
  },

  "rate-not-per-one": {
    tag: "rate-not-per-one",
    standards: ["6.AT.2"],
    persona: {
      name: "Mango",
      blurb: "Answers with the number it actually paid, every time.",
      blurbEs: "Siempre responde con el número que de verdad pagó.",
    },
    wrongIdea: "the price you paid altogether is the unit price, so 4 books for 20 dollars is 20",
    wrongIdeaEs:
      "el precio que pagaste en total es el precio unitario, así que 4 libros por 20 dólares es 20",
    openingLine:
      "Four books cost 20 dollars, so I said the price is 20 dollars. That IS what I paid. Why does my teacher want a different number?",
    openingLineEs:
      "Cuatro libros cuestan 20 dólares, así que dije que el precio es 20 dólares. Eso ES lo que pagué. ¿Por qué mi maestra quiere otro número?",
    probes: [
      "Per ONE what? I do not understand what the one is in that question.",
      "If I walked in and bought a single book, would I hand over 20 dollars?",
      "How would I say my answer as a full sentence so it is obviously about one book?",
    ],
    probesEs: [
      "¿Por UN qué? No entiendo qué es el uno en esa pregunta.",
      "Si entrara y comprara un solo libro, ¿entregaría 20 dólares?",
      "¿Cómo diría mi respuesta como oración completa para que sea obvio que es por un libro?",
    ],
    mustAddress: [
      A(
        "per-one-means-one",
        "A unit rate is the amount for exactly ONE unit",
        "Una tasa unitaria es la cantidad para exactamente UNA unidad",
        [
          ["one book"],
          ["per one"],
          ["for 1"],
          ["each book"],
          ["unit rate"],
          ["por un libro"],
          ["cada libro"],
          ["tasa unitaria"],
        ],
      ),
      A(
        "total-is-not-the-rate",
        "The total and the rate answer two different questions",
        "El total y la tasa responden dos preguntas distintas",
        [
          ["total"],
          ["not the same"],
          ["different question"],
          ["altogether"],
          ["el total"],
          ["no es lo mismo"],
          ["pregunta distinta"],
        ],
      ),
      A(
        "finish-the-sentence",
        "Finish the sentence with units: so many dollars per one book",
        "Termina la oración con unidades: tantos dólares por un libro",
        [["per"], ["dollars per"], ["units"], ["sentence"], ["por"], ["dolares por"], ["unidades"]],
      ),
    ],
    giveawayPhrases: [
      "just divide by the number of items",
      "20 divided by 4",
      "solo divide entre la cantidad",
    ],
    worked:
      "A unit rate answers per ONE, so the question is what a single book costs. Twenty dollars spread over four books is five dollars in each, and the sentence that proves it is five dollars per one book. The 20 is the total, which answers a different question.",
    workedEs:
      "Una tasa unitaria responde por UNO, así que la pregunta es cuánto cuesta un solo libro. Veinte dólares repartidos entre cuatro libros son cinco dólares en cada uno, y la oración que lo prueba es cinco dólares por un libro. El 20 es el total, que responde otra pregunta.",
    wordBank: ["rate", "unit rate", "per", "total", "each", "units"],
    wordBankEs: ["tasa", "tasa unitaria", "por", "total", "cada", "unidades"],
  },

  "ratio-inverted": {
    tag: "ratio-inverted",
    standards: ["6.AT.1"],
    persona: {
      name: "Tide",
      blurb: "Thinks a ratio is just two numbers standing next to each other.",
      blurbEs: "Cree que una razón es solo dos números parados uno junto al otro.",
    },
    wrongIdea:
      "a ratio is just two numbers together, so 3 cats for every 5 dogs can be written 5:3",
    wrongIdeaEs:
      "una razón es solo dos números juntos, así que 3 gatos por cada 5 perros se puede escribir 5:3",
    openingLine:
      "There are 3 cats for every 5 dogs, and I wrote 5:3. Both numbers are in there. Does the order really change anything?",
    openingLineEs:
      "Hay 3 gatos por cada 5 perros, y escribí 5:3. Los dos números están ahí. ¿El orden de verdad cambia algo?",
    probes: [
      "If somebody read my 5:3 out loud, what picture would they end up imagining?",
      "How would I mark each number so nobody reads it backwards?",
      "Is 5:3 ever a correct ratio here — and if it is, for what question?",
    ],
    probesEs: [
      "Si alguien leyera mi 5:3 en voz alta, ¿qué imagen se imaginaría?",
      "¿Cómo marcaría cada número para que nadie lo lea al revés?",
      "¿5:3 alguna vez es una razón correcta aquí? Y si lo es, ¿para qué pregunta?",
    ],
    mustAddress: [
      A(
        "order-carries-meaning",
        "The order of a ratio names which quantity is being counted first",
        "El orden de una razón nombra cuál cantidad se cuenta primero",
        [["order"], ["first"], ["which one"], ["orden"], ["primero"], ["cual va"]],
      ),
      A(
        "label-with-units",
        "Labeling each number with what it counts stops the flip",
        "Etiquetar cada número con lo que cuenta evita la inversión",
        [
          ["label"],
          ["unit"],
          ["cats", "dogs"],
          ["write what"],
          ["etiquet"],
          ["unidad"],
          ["gatos", "perros"],
        ],
      ),
      A(
        "a-flipped-ratio-is-a-different-claim",
        "5 to 3 describes a different situation than 3 to 5",
        "5 a 3 describe una situación diferente que 3 a 5",
        [
          ["different"],
          ["not the same"],
          ["opposite"],
          ["backwards"],
          ["diferente"],
          ["no es lo mismo"],
          ["al reves"],
        ],
      ),
    ],
    giveawayPhrases: [
      "just write the numbers in order",
      "first number over second",
      "solo escribe los numeros en orden",
    ],
    worked:
      "A ratio is a claim about which quantity there is more of, so the order is the claim. Three cats for every five dogs must be written 3:5 with cats first, because that is the quantity named first. Writing 5:3 says there are more cats than dogs — a different animal shelter entirely.",
    workedEs:
      "Una razón es una afirmación sobre de cuál cantidad hay más, así que el orden es la afirmación. Tres gatos por cada cinco perros se escribe 3:5 con los gatos primero, porque es la cantidad nombrada primero. Escribir 5:3 dice que hay más gatos que perros — otro refugio completamente distinto.",
    wordBank: ["ratio", "to", "for every", "quantity", "label", "order"],
    wordBankEs: ["razón", "a", "por cada", "cantidad", "etiqueta", "orden"],
  },

  "sign-dropped": {
    tag: "sign-dropped",
    standards: ["6.NOS.5", "6.NOS.6c"],
    persona: {
      name: "Quill",
      blurb: "Sees the digits clearly and the little dash not at all.",
      blurbEs: "Ve los dígitos con claridad y el guioncito no lo ve para nada.",
    },
    wrongIdea:
      "the little minus sign in front of a number is decoration, so negative 8 plus 3 is 11",
    wrongIdeaEs:
      "el guioncito de menos delante de un número es un adorno, así que menos 8 más 3 es 11",
    openingLine:
      "For negative 8 plus 3 I wrote 11. The minus sign is so small, so I worked with the 8 and the 3. Does that little dash really change the answer?",
    openingLineEs:
      "Para menos 8 más 3 escribí 11. El signo de menos es tan pequeño que trabajé con el 8 y el 3. ¿Ese guioncito de verdad cambia la respuesta?",
    probes: [
      "What does the negative sign tell me about WHERE that number lives?",
      "If I start at negative 8 and move 3 to the right, where do I land?",
      "How do I know whether my final answer should end up on the left or the right of zero?",
    ],
    probesEs: [
      "¿Qué me dice el signo negativo sobre DÓNDE vive ese número?",
      "Si empiezo en menos 8 y me muevo 3 a la derecha, ¿dónde caigo?",
      "¿Cómo sé si mi respuesta final debe quedar a la izquierda o a la derecha del cero?",
    ],
    mustAddress: [
      A(
        "negative-is-a-position",
        "A negative sign says which side of zero the number sits on",
        "Un signo negativo dice de qué lado del cero está el número",
        [
          ["number line"],
          ["left of zero"],
          ["below zero"],
          ["side of zero"],
          ["recta numerica"],
          ["izquierda del cero"],
          ["bajo cero"],
          ["lado del cero"],
        ],
      ),
      A(
        "sign-changes-the-value",
        "Negative 8 and 8 are different numbers, not one number written two ways",
        "Menos 8 y 8 son números diferentes, no un número escrito de dos formas",
        [
          ["different number"],
          ["not the same"],
          ["opposite"],
          ["diferente"],
          ["no es lo mismo"],
          ["opuesto"],
        ],
      ),
      A(
        "check-on-a-number-line",
        "Placing the answer on a number line checks the sign",
        "Colocar la respuesta en una recta numérica revisa el signo",
        [
          ["number line"],
          ["which side"],
          ["check"],
          ["recta"],
          ["que lado"],
          ["revis"],
          ["comprob"],
        ],
      ),
    ],
    giveawayPhrases: [
      "keep the sign of the bigger number",
      "just subtract and keep the sign",
      "queda el signo del mayor",
    ],
    worked:
      "Negative 8 sits eight steps to the left of zero, so it is a completely different number from 8. Adding 3 moves three steps to the right, landing on negative 5 — still left of zero, because you did not travel far enough to cross it. The number line makes the sign impossible to lose.",
    workedEs:
      "Menos 8 está ocho pasos a la izquierda del cero, así que es un número completamente distinto de 8. Sumar 3 mueve tres pasos a la derecha, cayendo en menos 5 — todavía a la izquierda del cero, porque no avanzaste lo suficiente para cruzarlo. La recta numérica hace imposible perder el signo.",
    wordBank: ["negative", "positive", "opposite", "number line", "zero", "absolute value"],
    wordBankEs: ["negativo", "positivo", "opuesto", "recta numérica", "cero", "valor absoluto"],
  },

  "stat-summed-instead-of-averaged": {
    tag: "stat-summed-instead-of-averaged",
    standards: ["6.DS.4"],
    persona: {
      name: "Zephyr",
      blurb: "Collects data happily and reports the pile instead of the middle.",
      blurbEs: "Recoge datos con gusto y reporta el montón en vez del centro.",
    },
    wrongIdea: "the mean of a data set is the total you get when you add all the values",
    wrongIdeaEs:
      "la media de un conjunto de datos es el total que obtienes al sumar todos los valores",
    openingLine:
      "For the mean of 4, 6, and 8 I got 18. I added them all up. Is the mean not just the total of the set?",
    openingLineEs:
      "Para la media de 4, 6 y 8 me dio 18. Los sumé todos. ¿La media no es solo el total del conjunto?",
    probes: [
      "Could 18 ever be one of the values in that list? Should the mean look like one of them?",
      "What is the mean supposed to tell somebody about the whole group?",
      "If I evened everything out so all three values were the same, what would each one be?",
    ],
    probesEs: [
      "¿18 podría ser uno de los valores de esa lista? ¿La media debería parecerse a uno de ellos?",
      "¿Qué se supone que le dice la media a alguien sobre todo el grupo?",
      "Si nivelara todo para que los tres valores fueran iguales, ¿cuánto sería cada uno?",
    ],
    mustAddress: [
      A(
        "mean-summarizes-the-set",
        "The mean is ONE value that stands in for the whole set",
        "La media es UN valor que representa a todo el conjunto",
        [
          ["one number"],
          ["single value"],
          ["typical"],
          ["represent"],
          ["summar"],
          ["un solo"],
          ["representa"],
          ["resume"],
        ],
      ),
      A(
        "mean-is-the-fair-share",
        "The mean is the fair-share value — what everyone gets if you level it out",
        "La media es el valor de reparto justo — lo que a cada quien le toca si nivelas todo",
        [
          ["fair share"],
          ["even out"],
          ["evened out"],
          ["level"],
          ["share equally"],
          ["reparto justo"],
          ["nivel"],
          ["repartir igual"],
        ],
      ),
      A(
        "mean-lands-inside-the-data",
        "The mean has to land between the smallest and the largest value",
        "La media tiene que quedar entre el valor más pequeño y el más grande",
        [
          ["between"],
          ["range"],
          ["smallest", "largest"],
          ["inside the data"],
          ["entre"],
          ["rango"],
          ["menor", "mayor"],
        ],
      ),
    ],
    giveawayPhrases: ["add them all and divide", "sum divided by count", "suma y divide entre"],
    worked:
      "The mean answers what each value would be if the whole set were leveled out, so it always lands between the smallest and largest number. For 4, 6, and 8 that has to be somewhere between 4 and 8 — 18 is not even in the neighborhood. Leveling the eighteen units across three spots gives 6 in each.",
    workedEs:
      "La media responde cuánto valdría cada dato si todo el conjunto se nivelara, así que siempre queda entre el número menor y el mayor. Para 4, 6 y 8 tiene que estar entre 4 y 8 — 18 ni se acerca. Nivelar las dieciocho unidades en tres lugares da 6 en cada uno.",
    wordBank: ["mean", "measure of center", "data set", "fair share", "total", "range"],
    wordBankEs: [
      "media",
      "medida de centro",
      "conjunto de datos",
      "reparto justo",
      "total",
      "rango",
    ],
  },
};

/* Sentence starters offered under the text area. Deliberately open-ended: each
 * one forces a because, a picture, or a test — never an answer. */
export const SENTENCE_STARTERS = [
  { en: "The reason this works is…", es: "La razón por la que esto funciona es…" },
  { en: "A common mistake is… because…", es: "Un error común es… porque…" },
  { en: "Think about what … actually means:", es: "Piensa en lo que … significa de verdad:" },
  { en: "Here is a picture you can imagine:", es: "Aquí hay una imagen que puedes imaginar:" },
  { en: "Let's test it with a small number:", es: "Probémoslo con un número pequeño:" },
  { en: "So the big idea is…", es: "Entonces la idea principal es…" },
];

/* ── Matching engine ─────────────────────────────────────────────────────── */

/** Lowercase, strip accents and curly punctuation, collapse whitespace. */
export function normalizeText(value) {
  return String(value == null ? "" : value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/×/g, "x")
    .replace(/÷/g, "/")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function isKnownTag(tag) {
  return typeof tag === "string" && Object.prototype.hasOwnProperty.call(PERSONAS, tag);
}

export function personaFor(tag) {
  return isKnownTag(tag) ? PERSONAS[tag] : null;
}

/** Every giveaway phrase this persona rejects (its own plus the universal set). */
export function giveawaysFor(tag) {
  const p = personaFor(tag);
  return [...(p ? p.giveawayPhrases : []), ...UNIVERSAL_GIVEAWAYS];
}

/** Giveaway phrases present in one piece of text. */
export function detectGiveaways(tag, text) {
  const norm = normalizeText(text);
  if (!norm) return [];
  return giveawaysFor(tag).filter((phrase) => norm.includes(normalizeText(phrase)));
}

function groupMatches(norm, group) {
  return group.every((needle) => norm.includes(normalizeText(needle)));
}

/** ids of the rubric items one piece of text addresses. */
export function addressedIds(tag, text) {
  const p = personaFor(tag);
  const norm = normalizeText(text);
  if (!p || norm.length < MIN_EXPLANATION_CHARS) return [];
  return p.mustAddress
    .filter((item) => item.match.some((group) => groupMatches(norm, group)))
    .map((item) => item.id);
}

/* An explanation shorter than this is a label, not reasoning. Ticking a rubric
 * item off two words would make the checklist lie to the student. */
export const MIN_EXPLANATION_CHARS = 24;
/* Words of real explanation required before the learner can be convinced. */
export const MIN_CONVINCED_WORDS = 20;

export function countWords(text) {
  const norm = normalizeText(text);
  return norm ? norm.split(" ").filter(Boolean).length : 0;
}

/**
 * Evaluate the whole conversation so far.
 * turns: [{ role: "student" | "learner", text }]
 * -> { addressed, missing, convinced, giveaways, words }
 */
export function evaluateTurns(tag, turns) {
  const p = personaFor(tag);
  if (!p) return { addressed: [], missing: [], convinced: false, giveaways: [], words: 0 };
  const studentTurns = (Array.isArray(turns) ? turns : []).filter(
    (t) => t && t.role === "student" && typeof t.text === "string",
  );
  const addressed = new Set();
  const giveaways = new Set();
  let words = 0;
  for (const turn of studentTurns) {
    for (const id of addressedIds(tag, turn.text)) addressed.add(id);
    for (const g of detectGiveaways(tag, turn.text)) giveaways.add(g);
    words += countWords(turn.text);
  }
  const missing = p.mustAddress.map((i) => i.id).filter((id) => !addressed.has(id));
  return {
    addressed: [...addressed],
    missing,
    convinced: missing.length === 0 && words >= MIN_CONVINCED_WORDS,
    giveaways: [...giveaways],
    words,
  };
}

/**
 * The probe to ask next: the one tied to the first rubric item still missing.
 *
 * `asked` may be a plain count, or — better — the learner replies already said.
 * Given the replies, the probe already used is skipped, so the offline learner
 * never asks the same question twice while a different gap is still open.
 */
export function nextProbe(tag, evaluation, asked = 0, lang = "en") {
  const p = personaFor(tag);
  if (!p) return "";
  const list = lang === "es" ? p.probesEs : p.probes;
  if (!list.length) return "";
  const missingIndex = p.mustAddress.findIndex((i) => evaluation.missing.includes(i.id));
  const base = missingIndex >= 0 ? missingIndex : 0;

  if (!Array.isArray(asked)) return list[(base + Number(asked || 0)) % list.length];

  const saidNorm = asked.map((text) => normalizeText(text));
  const usedAlready = (probe) => saidNorm.some((said) => said.includes(normalizeText(probe)));
  for (let step = 0; step < list.length; step += 1) {
    const candidate = list[(base + step) % list.length];
    if (!usedAlready(candidate)) return candidate;
  }
  // Every probe has been asked already — cycle rather than fall silent.
  return list[(base + asked.length) % list.length];
}

export default PERSONAS;
