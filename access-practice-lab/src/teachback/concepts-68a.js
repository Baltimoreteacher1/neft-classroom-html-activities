// Teach It Back concepts, grades 6-8, part 1: math and science. Data only.
const p = (id, en, es, accept, frame) => ({ id, en, es, accept, frame });

export const CONCEPTS_68A = [
  {
    id: "ratios",
    band: "6-8",
    subject: "math",
    visual: "",
    title: { en: "Ratios and unit rates", es: "Razones y tasas unitarias" },
    idea: {
      en: "A ratio compares two quantities. If a recipe uses 2 cups of flour for every 3 cups of milk, the ratio of flour to milk is 2 to 3, or 2:3. Equivalent ratios come from multiplying both quantities by the same number, so 4 cups of flour to 6 cups of milk is the same ratio.",
      es: "Una razón compara dos cantidades. Si una receta usa 2 tazas de harina por cada 3 tazas de leche, la razón de harina a leche es 2 a 3, o 2:3. Las razones equivalentes se obtienen multiplicando ambas cantidades por el mismo número, así que 4 tazas de harina por 6 tazas de leche es la misma razón.",
    },
    terms: [
      { w: "ratio", es: "razón", gloss: "a comparison of two quantities" },
      { w: "equivalent ratios", es: "razones equivalentes", gloss: "ratios that describe the same relationship" },
      { w: "unit rate", es: "tasa unitaria", gloss: "how much there is for 1 unit, like miles per hour" },
      { w: "ratio table", es: "tabla de razones", gloss: "a table that lists equivalent ratios" },
    ],
    points: [
      p("p1", "A ratio compares two quantities, and the order matters.", "Una razón compara dos cantidades, y el orden importa.", ["compar*", "two quantities", "two amounts", "for every", "order", "compara*", "por cada", "orden"], "A ratio is a way to ____ two quantities."),
      p("p2", "Equivalent ratios come from multiplying or dividing both numbers by the same number.", "Las razones equivalentes salen de multiplicar o dividir ambos números por el mismo número.", ["equivalent", "same number", "both", "multipl*", "divid*", "scale*", "equivalente*", "mismo número", "ambos", "ambas"], "To make an equivalent ratio I ____ both numbers by the ____ number."),
      p("p3", "A unit rate tells how much there is for one unit, and it helps compare or solve.", "Una tasa unitaria dice cuánto hay por una unidad, y sirve para comparar o resolver.", ["unit rate", "for one", "for 1", "per", "each one", "one unit", "tasa unitaria", "por cada uno", "por unidad", "solve*"], "A unit rate tells how much there is for ____ unit, like miles ____ hour."),
    ],
    audience: { en: "Explain it to a classmate who was absent and needs to compare two juice recipes.", es: "Explícaselo a un compañero que faltó y necesita comparar dos recetas de jugo." },
    modelAnswer: {
      en: "A ratio is a way to compare two quantities. For example, a recipe with 2 cups of flour for every 3 cups of milk has a ratio of 2 to 3, and the order matters. You can make equivalent ratios by multiplying or dividing both numbers by the same number, so 4 to 6 is the same ratio as 2 to 3. A unit rate tells how much there is for one unit, like miles per hour, and it helps me compare deals or solve problems.",
    },
  },
  {
    id: "mean-vs-median",
    band: "6-8",
    subject: "math",
    visual: "",
    title: { en: "Mean and median", es: "Media y mediana" },
    idea: {
      en: "The mean and the median are two ways to describe the center of a data set. The mean is the average: add all the values and divide by how many there are. The median is the middle value when the numbers are put in order. A few very large or very small values can pull the mean away from the center, but they change the median much less.",
      es: "La media y la mediana son dos maneras de describir el centro de un conjunto de datos. La media es el promedio: sumas todos los valores y divides entre cuántos hay. La mediana es el valor del medio cuando los números están en orden. Unos pocos valores muy grandes o muy pequeños pueden alejar la media del centro, pero cambian mucho menos la mediana.",
    },
    terms: [
      { w: "mean", es: "media", gloss: "the average: the sum of the values divided by how many values" },
      { w: "median", es: "mediana", gloss: "the middle value when the data are in order" },
      { w: "outlier", es: "valor atípico", gloss: "a value much larger or smaller than the others" },
      { w: "data set", es: "conjunto de datos", gloss: "a collection of numbers or measurements" },
    ],
    points: [
      p("p1", "To find the mean, add all the values and divide by how many there are.", "Para hallar la media, suma todos los valores y divide entre cuántos hay.", ["add*", "sum", "divid*", "average", "total", "how many", "promedio", "sumar", "suma", "dividir"], "To find the mean I ____ all the values and ____ by how many there are."),
      p("p2", "To find the median, put the numbers in order and take the middle one.", "Para hallar la mediana, ordena los números y toma el del medio.", ["middle", "order*", "least to greatest", "smallest to largest", "sorted", "en medio", "medio", "ordena*"], "To find the median I put the numbers in ____ and pick the one in the ____."),
      p("p3", "An outlier pulls the mean a lot but changes the median very little.", "Un valor atípico mueve mucho la media pero cambia muy poco la mediana.", ["outlier*", "extreme", "very large", "very small", "much bigger", "pull*", "skew*", "atipic*", "extremo*"], "An ____ can pull the mean up, but the ____ barely changes."),
    ],
    audience: { en: "Explain it to a student who wants to know which one to report when one house price is huge.", es: "Explícaselo a un estudiante que quiere saber cuál usar cuando el precio de una casa es enorme." },
    modelAnswer: {
      en: "The mean and the median both describe the center of a data set, but they work differently. To find the mean, you add up all the values and divide by how many there are, so it is the average. To find the median, you put the numbers in order from least to greatest and pick the one in the middle. An outlier, like one very large number, can pull the mean up a lot, but the median barely changes, so the median can describe the center better when there is an outlier.",
    },
  },
  {
    id: "negative-numbers",
    band: "6-8",
    subject: "math",
    visual: "number-line",
    title: { en: "Negative numbers", es: "Números negativos" },
    idea: {
      en: "Negative numbers are numbers less than zero. On a number line they sit to the left of zero, and the farther left a number is, the smaller it is, so -8 is less than -3. We use negative numbers to show things like temperatures below zero, a debt, or a position below sea level.",
      es: "Los números negativos son números menores que cero. En una recta numérica están a la izquierda del cero, y mientras más a la izquierda está un número, menor es, así que -8 es menor que -3. Usamos números negativos para mostrar cosas como temperaturas bajo cero, una deuda o una posición bajo el nivel del mar.",
    },
    terms: [
      { w: "negative number", es: "número negativo", gloss: "a number less than zero" },
      { w: "opposite", es: "opuesto", gloss: "the same distance from zero on the other side, like 4 and -4" },
      { w: "absolute value", es: "valor absoluto", gloss: "a number's distance from zero" },
      { w: "integer", es: "entero", gloss: "a whole number or its opposite" },
    ],
    points: [
      p("p1", "Negative numbers are less than zero, to the left of zero on a number line.", "Los números negativos son menores que cero, a la izquierda del cero en la recta numérica.", ["less than zero", "below zero", "left", "zero", "izquierda", "bajo cero", "menos que cero"], "Negative numbers are ____ than zero. On a number line they are to the ____ of zero."),
      p("p2", "The farther left a number is, the smaller it is: -8 is less than -3.", "Mientras más a la izquierda, menor es el número: -8 es menor que -3.", ["farther", "smaller", "bigger*", "compar*", "more negative", "closer to zero", "mayor", "menor", "lejos"], "The ____ left a number is, the ____ it is."),
      p("p3", "We use them for temperatures below zero, debts, and places below sea level.", "Los usamos para temperaturas bajo cero, deudas y lugares bajo el nivel del mar.", ["temperature*", "debt", "owe*", "sea level", "elevation", "bank", "temperatura", "deuda"], "We use negative numbers for things like ____ below zero or money someone ____."),
    ],
    audience: { en: "Explain it to a classmate who says -8 is bigger than -3 because 8 is bigger than 3.", es: "Explícaselo a un compañero que dice que -8 es mayor que -3 porque 8 es mayor que 3." },
    modelAnswer: {
      en: "Negative numbers are numbers that are less than zero. On a number line they are to the left of zero. The farther left a number is, the smaller it is, so negative 8 is smaller than negative 3 even though 8 looks bigger. We use negative numbers in real life, like when the temperature is below zero, when someone owes money, or when a place is below sea level.",
    },
  },
  {
    id: "photosynthesis",
    band: "6-8",
    subject: "science",
    visual: "",
    title: { en: "Photosynthesis", es: "Fotosíntesis" },
    idea: {
      en: "Photosynthesis is how plants make their own food. Leaves take in light energy from the Sun, carbon dioxide from the air, and water that comes up from the roots. The plant uses them to make glucose, a sugar it uses for energy and growth, and it releases oxygen into the air.",
      es: "La fotosíntesis es la manera en que las plantas fabrican su propio alimento. Las hojas absorben energía luminosa del Sol, dióxido de carbono del aire y agua que sube desde las raíces. La planta los usa para producir glucosa, un azúcar que usa para obtener energía y crecer, y libera oxígeno al aire.",
    },
    terms: [
      { w: "photosynthesis", es: "fotosíntesis", gloss: "how plants turn light, water, and carbon dioxide into sugar and oxygen" },
      { w: "chloroplast", es: "cloroplasto", gloss: "the part of a plant cell where photosynthesis happens" },
      { w: "glucose", es: "glucosa", gloss: "a sugar made by plants that stores energy" },
      { w: "carbon dioxide", es: "dióxido de carbono", gloss: "a gas in the air that plants take in" },
    ],
    points: [
      p("p1", "A plant takes in light energy and carbon dioxide (and water).", "La planta absorbe energía luminosa y dióxido de carbono (y agua).", ["carbon dioxide", "co2", "dioxido", "sunlight", "light energy", "luz"], "A plant takes in ____ energy, water, and ____ ____."),
      p("p2", "It makes glucose, a sugar for energy and growth, and releases oxygen.", "Produce glucosa, un azúcar para energía y crecimiento, y libera oxígeno.", ["glucose", "sugar", "oxygen", "glucosa", "azucar", "oxigeno"], "The plant makes ____, a sugar, and releases ____."),
      p("p3", "It happens in the chloroplasts, which have green chlorophyll, in the leaves.", "Ocurre en los cloroplastos, que tienen clorofila verde, en las hojas.", ["chloroplast*", "chlorophyll", "leaves", "cloroplast*", "clorofila", "hojas"], "Photosynthesis happens inside the ____ in the ____."),
    ],
    audience: { en: "Explain it to a student who thinks plants get their food from the soil.", es: "Explícaselo a un estudiante que cree que las plantas obtienen su alimento del suelo." },
    modelAnswer: {
      en: "Photosynthesis is the process plants use to make their own food. A plant takes in light energy from the Sun, carbon dioxide from the air, and water from its roots. Inside the chloroplasts in the leaves, which contain green chlorophyll, those ingredients are turned into glucose, a sugar the plant uses for energy and growth, and oxygen is released into the air.",
    },
  },
  {
    id: "forces-and-motion",
    band: "6-8",
    subject: "science",
    visual: "",
    title: { en: "Forces and motion", es: "Fuerzas y movimiento" },
    idea: {
      en: "A force is a push or a pull. When the forces on an object are balanced, they cancel out and the object's motion does not change: it stays still or keeps moving at the same speed in the same direction. When forces are unbalanced, the object speeds up, slows down, or changes direction, and a bigger net force or a smaller mass causes a bigger change in motion.",
      es: "Una fuerza es un empujón o un jalón. Cuando las fuerzas sobre un objeto están equilibradas, se cancelan y el movimiento del objeto no cambia: se queda quieto o sigue moviéndose con la misma rapidez y en la misma dirección. Cuando las fuerzas no están equilibradas, el objeto acelera, frena o cambia de dirección, y una fuerza neta mayor o una masa menor causa un cambio de movimiento mayor.",
    },
    terms: [
      { w: "force", es: "fuerza", gloss: "a push or a pull on an object" },
      { w: "balanced forces", es: "fuerzas equilibradas", gloss: "equal forces in opposite directions that cancel out" },
      { w: "net force", es: "fuerza neta", gloss: "the total of all the forces on an object" },
      { w: "mass", es: "masa", gloss: "how much matter an object has" },
    ],
    points: [
      p("p1", "A force is a push or a pull on an object.", "Una fuerza es un empujón o un jalón sobre un objeto.", ["push", "pull", "empuj*", "jal*", "tir*"], "A force is a ____ or a ____."),
      p("p2", "When forces are balanced they cancel out, so the motion does not change.", "Cuando las fuerzas están equilibradas se cancelan, así que el movimiento no cambia.", ["balanced", "cancel*", "no change", "same speed", "equilibrad*", "se cancelan"], "When forces are ____ they ____ out, so the motion does not change."),
      p("p3", "Unbalanced forces change motion; a bigger force or a smaller mass makes a bigger change.", "Las fuerzas no equilibradas cambian el movimiento; más fuerza o menos masa causa un cambio mayor.", ["unbalanced", "net force", "speed* up", "slow* down", "change* direction", "acceler*", "mass", "desequilibrad*", "aceler*", "masa"], "When forces are ____ the object can speed up, ____ down, or turn."),
    ],
    audience: { en: "Explain it to a classmate who says a moving object needs a constant push to keep moving.", es: "Explícaselo a un compañero que dice que un objeto en movimiento necesita un empuje constante para seguir moviéndose." },
    modelAnswer: {
      en: "A force is a push or a pull on an object. When the forces on an object are balanced, they cancel each other out, so the object's motion does not change: it stays still or keeps moving at the same speed. When the forces are unbalanced, there is a net force, and the object speeds up, slows down, or changes direction. A bigger force or a smaller mass makes a bigger change in motion, like how it is easier to push an empty cart than a full one.",
    },
  },
  {
    id: "energy-transfer",
    band: "6-8",
    subject: "science",
    visual: "",
    title: { en: "Energy transfer", es: "Transferencia de energía" },
    idea: {
      en: "Energy cannot be created or destroyed; it only changes form or moves from one object to another. When a campfire warms your hands, thermal energy transfers from the hot fire to your cooler hands. In many transfers, some energy ends up as heat that spreads into the surroundings and is hard to use again.",
      es: "La energía no se crea ni se destruye; solo cambia de forma o pasa de un objeto a otro. Cuando una fogata calienta tus manos, la energía térmica pasa del fuego caliente a tus manos más frías. En muchas transferencias, parte de la energía termina como calor que se esparce en el entorno y es difícil de volver a usar.",
    },
    terms: [
      { w: "energy", es: "energía", gloss: "the ability to cause change or do work" },
      { w: "transfer", es: "transferir", gloss: "to move from one object to another" },
      { w: "conservation of energy", es: "conservación de la energía", gloss: "energy is never created or destroyed, only changed or moved" },
      { w: "thermal energy", es: "energía térmica", gloss: "the energy of the moving particles in matter, felt as heat" },
    ],
    points: [
      p("p1", "Energy is never created or destroyed; it changes form or moves.", "La energía nunca se crea ni se destruye; cambia de forma o se mueve.", ["created", "destroyed", "conserv*", "changes form", "change form", "same amount", "creada", "destruida", "conserva*", "cambia de forma"], "Energy cannot be ____ or ____; it only changes form or moves."),
      p("p2", "Energy can transfer from a hotter object to a cooler one.", "La energía puede pasar de un objeto más caliente a uno más frío.", ["transfer*", "hotter", "cooler", "colder", "flows", "moves from", "pasa", "transfier*", "caliente"], "Thermal energy ____ from the ____ object to the cooler one."),
      p("p3", "Energy can change form, like a lamp making light and heat, and some spreads out as waste heat.", "La energía puede cambiar de forma, como una lámpara que da luz y calor, y parte se esparce como calor.", ["electrical", "light", "heat", "waste", "surroundings", "lamp", "battery", "eléctric*", "calor", "ejemplo"], "A lamp changes ____ energy into ____ and heat."),
    ],
    audience: { en: "Explain it to a student who asks where the energy goes when a hot drink cools down.", es: "Explícaselo a un estudiante que pregunta adónde va la energía cuando se enfría una bebida caliente." },
    modelAnswer: {
      en: "Energy is never created or destroyed, it just changes form or moves from one place to another. That idea is called conservation of energy. Energy can transfer from one object to another, like when thermal energy moves from a hot campfire to your cooler hands. It can also change form: for example, a lamp changes electrical energy into light and heat, and some of that heat spreads into the room where it is hard to use again.",
    },
  },
];
