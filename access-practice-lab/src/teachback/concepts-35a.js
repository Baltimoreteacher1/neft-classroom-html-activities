// Teach It Back concepts, grades 3-5, part 1: math and science. Data only. Rules and shape: TEACH-BACK.md.
// `accept` entries: a word, "two words" (next to each other), "a+b" (both in one sentence), "stem*" (any ending).
// English and Spanish words both count, so a learner may use either language.
const p = (id, en, es, accept, frame) => ({ id, en, es, accept, frame });

export const CONCEPTS_35A = [
  {
    id: "area-vs-perimeter",
    band: "3-5",
    subject: "math",
    visual: "area-perimeter",
    title: { en: "Area and perimeter", es: "Área y perímetro" },
    idea: {
      en: "Perimeter is the distance around the outside of a shape. Area is the amount of flat space inside it. You find perimeter by adding the side lengths, and you find the area of a rectangle by multiplying length times width.",
      es: "El perímetro es la distancia alrededor de una figura. El área es la cantidad de espacio plano dentro de ella. Para hallar el perímetro sumas las longitudes de los lados, y para hallar el área de un rectángulo multiplicas largo por ancho.",
    },
    terms: [
      { w: "perimeter", es: "perímetro", gloss: "the distance around a shape" },
      { w: "area", es: "área", gloss: "the space inside a shape, counted in square units" },
      { w: "square unit", es: "unidad cuadrada", gloss: "a square that measures 1 unit on each side" },
      { w: "length", es: "largo", gloss: "how long a shape is from end to end" },
    ],
    points: [
      p("p1", "Perimeter is the distance around the outside.", "El perímetro es la distancia alrededor del borde.", ["around", "outside", "edge", "border", "fence", "alrededor", "borde", "contorno"], "The perimeter is the distance ____ a shape."),
      p("p2", "Area is the space inside the shape, counted in square units.", "El área es el espacio dentro de la figura, contado en unidades cuadradas.", ["inside", "covers", "cover", "square unit*", "squares", "fill*", "dentro", "cuadrad*"], "The area is the ____ inside a shape. We count it in ____ units."),
      p("p3", "You add the sides for perimeter and multiply for area.", "Sumas los lados para el perímetro y multiplicas para el área.", ["add*+side*", "multipl*", "times", "sumar", "sumas", "multiplicar"], "To find perimeter I ____ the sides. To find the area of a rectangle I ____ length by width."),
    ],
    audience: { en: "Explain it to a younger student who keeps mixing the two up.", es: "Explícaselo a un estudiante menor que siempre los confunde." },
    modelAnswer: {
      en: "Perimeter and area are two different ways to measure a shape. Perimeter is the distance around the outside, like a fence around a garden, and you find it by adding all the sides. Area is the flat space inside the shape, like the grass in the garden, and for a rectangle you multiply the length by the width. Area is counted in square units, but perimeter is counted in regular units.",
    },
  },
  {
    id: "fractions-as-division",
    band: "3-5",
    subject: "math",
    visual: "fraction-division",
    title: { en: "A fraction is a division", es: "Una fracción es una división" },
    idea: {
      en: "A fraction bar can mean division. The fraction 3/4 is the same as 3 ÷ 4, so if 3 pizzas are shared equally among 4 friends, each friend gets 3/4 of a pizza. The top number is what you share, and the bottom number is how many equal parts or people share it.",
      es: "Una barra de fracción puede significar división. La fracción 3/4 es igual a 3 ÷ 4, así que si 3 pizzas se reparten por igual entre 4 amigos, cada amigo recibe 3/4 de pizza. El número de arriba es lo que repartes y el de abajo es entre cuántas partes o personas lo repartes.",
    },
    terms: [
      { w: "fraction", es: "fracción", gloss: "a number that names equal parts of a whole" },
      { w: "numerator", es: "numerador", gloss: "the top number: how much you have or share" },
      { w: "denominator", es: "denominador", gloss: "the bottom number: how many equal parts" },
      { w: "divide", es: "dividir", gloss: "to split or share into equal groups" },
    ],
    points: [
      p("p1", "A fraction bar means divide: 3/4 is 3 ÷ 4.", "La barra de fracción significa dividir: 3/4 es 3 ÷ 4.", ["divide*", "division", "divided by", "dividir", "dividido", "división"], "A fraction like 3/4 is the same as 3 ____ 4."),
      p("p2", "Sharing equally: 3 pizzas for 4 friends gives each friend 3/4.", "Repartir por igual: 3 pizzas entre 4 amigos le dan 3/4 a cada uno.", ["each", "equally", "equal share", "fair share", "every person", "every friend", "cada", "igual"], "If I share ____ equally with ____ people, each person gets ____."),
      p("p3", "The top number is what is shared; the bottom number is how many share it.", "El número de arriba es lo que se reparte; el de abajo es entre cuántos.", ["numerator", "denominator", "top number", "bottom number", "top+bottom", "numerador", "denominador", "arriba+abajo"], "The top number tells ____, and the bottom number tells ____."),
    ],
    audience: { en: "Explain it to a classmate who thinks fractions and division are unrelated.", es: "Explícaselo a un compañero que cree que las fracciones y la división no tienen relación." },
    modelAnswer: {
      en: "A fraction can be read as a division problem. For example, 3/4 means 3 divided by 4. Imagine sharing 3 pizzas equally with 4 friends: each friend gets 3/4 of a pizza. The top number, the numerator, is the amount being shared, and the bottom number, the denominator, tells how many people or equal parts are sharing.",
    },
  },
  {
    id: "equivalent-fractions",
    band: "3-5",
    subject: "math",
    visual: "",
    title: { en: "Equivalent fractions", es: "Fracciones equivalentes" },
    idea: {
      en: "Equivalent fractions name the same amount even though they have different numbers. 1/2 and 2/4 are equivalent because they show the same part of a whole. You make an equivalent fraction by multiplying or dividing the top and bottom numbers by the same number.",
      es: "Las fracciones equivalentes nombran la misma cantidad aunque tengan números distintos. 1/2 y 2/4 son equivalentes porque muestran la misma parte de un entero. Para hacer una fracción equivalente, multiplicas o divides el número de arriba y el de abajo por el mismo número.",
    },
    terms: [
      { w: "equivalent", es: "equivalente", gloss: "equal in value; the same amount" },
      { w: "numerator", es: "numerador", gloss: "the top number of a fraction" },
      { w: "denominator", es: "denominador", gloss: "the bottom number of a fraction" },
      { w: "whole", es: "entero", gloss: "all of something, like one whole pizza" },
    ],
    points: [
      p("p1", "Equivalent fractions have different numbers but the same amount.", "Las fracciones equivalentes tienen números distintos pero la misma cantidad.", ["same amount", "same value", "same size", "same part", "equivalent*", "mismo valor", "misma cantidad", "equivalente*"], "Equivalent fractions look ____ but they show the ____ amount."),
      p("p2", "An example like 1/2 and 2/4 shows it is the same part of a whole.", "Un ejemplo como 1/2 y 2/4 muestra que es la misma parte de un entero.", ["example", "for instance", "pizza*", "half", "halves", "quarter*", "fourths", "mitad", "cuarto*", "ejemplo"], "For example, ____ and ____ are equivalent because ____."),
      p("p3", "To make one, multiply or divide the top and bottom by the same number.", "Para hacer una, multiplica o divide el de arriba y el de abajo por el mismo número.", ["same number", "top+bottom", "numerator+denominator", "multipl*", "divid*", "mismo número", "arriba+abajo"], "To make an equivalent fraction I ____ the top and the bottom by the ____ number."),
    ],
    audience: { en: "Explain it to a classmate who says 1/2 and 2/4 are different because the numbers are different.", es: "Explícaselo a un compañero que dice que 1/2 y 2/4 son diferentes porque los números son diferentes." },
    modelAnswer: {
      en: "Equivalent fractions are fractions that look different but name the same amount. A good example is one half and two fourths: if you cut a pizza in half, or into four pieces and take two, you get the same amount of pizza. To make an equivalent fraction, you multiply the top and the bottom number by the same number, or divide them both by the same number.",
    },
  },
  {
    id: "water-cycle",
    band: "3-5",
    subject: "science",
    visual: "water-cycle",
    title: { en: "The water cycle", es: "El ciclo del agua" },
    idea: {
      en: "Water is always moving between the ground, the air, and the clouds. The Sun's heat makes liquid water turn into water vapor, a gas, and the vapor rises. High in the air it cools and turns back into tiny drops that make clouds, and then the water falls as rain or snow.",
      es: "El agua siempre se mueve entre el suelo, el aire y las nubes. El calor del Sol convierte el agua líquida en vapor de agua, que es un gas, y el vapor sube. En lo alto se enfría y vuelve a ser gotitas que forman las nubes, y luego el agua cae como lluvia o nieve.",
    },
    terms: [
      { w: "evaporation", es: "evaporación", gloss: "liquid water changing into water vapor when it is heated" },
      { w: "condensation", es: "condensación", gloss: "water vapor cooling and changing into tiny drops of liquid" },
      { w: "precipitation", es: "precipitación", gloss: "water falling from clouds as rain, snow, sleet, or hail" },
      { w: "water vapor", es: "vapor de agua", gloss: "water as an invisible gas in the air" },
    ],
    points: [
      p("p1", "The Sun heats water and it evaporates into water vapor.", "El Sol calienta el agua y se evapora como vapor de agua.", ["evaporat*", "water vapor", "vapor", "sun+heat*", "sun+warm*", "evapora*", "calienta*"], "The Sun heats the water, and the water ____ into water vapor."),
      p("p2", "The vapor rises, cools, and condenses into clouds.", "El vapor sube, se enfría y se condensa en nubes.", ["condens*", "cloud*", "cool*", "cold", "nubes", "condensa*", "enfr*"], "High in the air the vapor ____ and turns into tiny drops that make ____."),
      p("p3", "Water falls as rain or snow, collects, and the cycle starts again.", "El agua cae como lluvia o nieve, se junta y el ciclo empieza otra vez.", ["precipitat*", "rain*", "snow*", "fall*", "lluvia", "nieve", "repeat*", "again", "collect*", "otra vez"], "When the clouds get heavy, the water ____ as ____ or snow."),
    ],
    audience: { en: "Explain it to a younger student who asks where rain comes from.", es: "Explícaselo a un estudiante menor que pregunta de dónde viene la lluvia." },
    modelAnswer: {
      en: "The water cycle is how water moves around Earth again and again. First, the Sun heats water in oceans and lakes, and it evaporates into water vapor that rises into the air. Up high, the vapor cools and condenses into tiny drops that form clouds. When the clouds get heavy, the water falls as precipitation, like rain or snow, and then it flows back into oceans and rivers so the cycle starts over.",
    },
  },
  {
    id: "food-web",
    band: "3-5",
    subject: "science",
    visual: "food-web",
    title: { en: "Food webs", es: "Redes alimentarias" },
    idea: {
      en: "A food chain shows one path of energy, like grass to a rabbit to a fox. A food web connects many food chains in one place, because most animals eat more than one kind of food. Arrows point in the direction the energy goes, from the food to the animal that eats it.",
      es: "Una cadena alimentaria muestra un camino de energía, como pasto, conejo y zorro. Una red alimentaria conecta muchas cadenas en un mismo lugar, porque la mayoría de los animales comen más de un tipo de alimento. Las flechas apuntan en la dirección que va la energía, del alimento al animal que se lo come.",
    },
    terms: [
      { w: "producer", es: "productor", gloss: "a living thing, like a plant, that makes its own food" },
      { w: "consumer", es: "consumidor", gloss: "a living thing that eats other living things" },
      { w: "predator", es: "depredador", gloss: "an animal that hunts and eats other animals" },
      { w: "prey", es: "presa", gloss: "an animal that is hunted and eaten" },
    ],
    points: [
      p("p1", "Producers, like plants, make their own food from sunlight.", "Los productores, como las plantas, fabrican su propio alimento con la luz del sol.", ["producer*", "plant*", "grass", "own food", "sunlight", "algae", "productor*", "pasto"], "Plants are producers because they ____."),
      p("p2", "Consumers eat other living things; a predator hunts its prey.", "Los consumidores comen otros seres vivos; un depredador caza a su presa.", ["consumer*", "predator*", "prey", "hunt*", "consumidor*", "depredador*", "presa", "eat* animals", "eats other"], "A predator is an animal that ____ its ____."),
      p("p3", "Arrows show which way energy moves, and a web connects many chains.", "Las flechas muestran hacia dónde va la energía, y una red conecta muchas cadenas.", ["arrow*", "energy", "direction", "many chains", "more than one", "connect*", "flecha*", "energía", "conecta*"], "The arrows show the ____ that energy moves."),
    ],
    audience: { en: "Explain it to a younger student who says a fox only eats rabbits.", es: "Explícaselo a un estudiante menor que dice que un zorro solo come conejos." },
    modelAnswer: {
      en: "A food web shows who eats what in a place. Producers, like grass and other plants, start the web because they make their own food from sunlight. Consumers, such as rabbits and foxes, eat other living things, and a predator hunts its prey. The arrows show the direction energy moves, from the food to the animal that eats it, and a web connects many food chains because most animals eat more than one thing.",
    },
  },
  {
    id: "states-of-matter",
    band: "3-5",
    subject: "science",
    visual: "",
    title: { en: "Solids, liquids, and gases", es: "Sólidos, líquidos y gases" },
    idea: {
      en: "Matter is anything that takes up space, and it usually comes in three states: solid, liquid, and gas. The particles in matter are always moving. Heating makes them move faster and spread out, and cooling makes them slow down and move closer together.",
      es: "La materia es todo lo que ocupa espacio y por lo general se presenta en tres estados: sólido, líquido y gas. Las partículas de la materia siempre se mueven. El calor hace que se muevan más rápido y se separen, y el frío hace que se muevan más despacio y se acerquen.",
    },
    terms: [
      { w: "solid", es: "sólido", gloss: "matter that keeps its own shape" },
      { w: "liquid", es: "líquido", gloss: "matter that flows and takes the shape of its container" },
      { w: "gas", es: "gas", gloss: "matter that spreads out to fill its whole container" },
      { w: "particle", es: "partícula", gloss: "a tiny piece of matter, too small to see" },
    ],
    points: [
      p("p1", "A solid keeps its shape, a liquid takes the shape of its container, and a gas fills it.", "Un sólido conserva su forma, un líquido toma la forma del recipiente y un gas lo llena.", ["shape", "container", "flow*", "fill*", "spread*", "forma", "recipiente", "fluye"], "A solid ____ its shape, but a liquid ____ to fit its container."),
      p("p2", "Particles are packed close in a solid, slide in a liquid, and are far apart in a gas.", "Las partículas están juntas en un sólido, se deslizan en un líquido y están muy separadas en un gas.", ["particle*", "close together", "packed", "far apart", "partícula*", "tiny pieces"], "In a solid the particles are ____, but in a gas they are ____."),
      p("p3", "Heating or cooling can change the state, like ice melting.", "Calentar o enfriar puede cambiar el estado, como el hielo que se derrite.", ["heat*", "cool*", "melt*", "freez*", "evaporat*", "condens*", "temperature", "calor", "derrit*", "congel*"], "When you ____ ice, it melts and becomes a ____."),
    ],
    audience: { en: "Explain it to a younger student who asks why ice, water, and steam are all the same stuff.", es: "Explícaselo a un estudiante menor que pregunta por qué el hielo, el agua y el vapor son lo mismo." },
    modelAnswer: {
      en: "Matter has three common states: solid, liquid, and gas. A solid keeps its own shape, a liquid flows and takes the shape of its container, and a gas spreads out to fill whatever container it is in. That happens because of the particles: in a solid they are packed close together, in a liquid they slide past each other, and in a gas they are far apart and moving fast. Heating or cooling can change the state, like when ice melts into water.",
    },
  },
];
