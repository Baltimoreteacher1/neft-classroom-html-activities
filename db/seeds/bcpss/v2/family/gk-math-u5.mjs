// BCPSS Family Guide (EN/ES) — gk-math-u5. Schema: ../schema.mjs (validateFamily)
// Home version of the Kindergarten unit on teen numbers. Vocabulary order matches ../units/gk-math-u5.mjs.

export default {
  summary: {
    en: "Your child is learning that a number from 11 to 19 is one ten and some extra ones. First we fill a ten frame, then we add the extras. It matters when we count eggs, crayons, or stickers past ten. Your child will tell how they made a teen number.",
    es: "Su hijo o hija está aprendiendo que un número del 11 al 19 es una decena y algunas unidades extra. Primero llenamos un marco de diez y luego agregamos las que sobran. Sirve cuando contamos huevos, crayones o calcomanías después del diez. Su hijo o hija contará cómo formó un número entre 11 y 19.",
  },
  goals: {
    en: [
      "I can show a number from 11 to 19 as one ten and some ones.",
      "I can tell how I made a teen number: first the ten, then the extra ones.",
    ],
    es: [
      "Puedo mostrar un número del 11 al 19 como una decena y algunas unidades.",
      "Puedo contar cómo formé un número entre 11 y 19: primero la decena y luego las unidades extra.",
    ],
  },
  vocab: [
    { term: "ten", def_es: "un grupo completo de 10 cosas sueltas; una decena", example_es: "Hice una decena con diez frijoles." },
    { term: "ones", def_es: "cosas sueltas que no están en un grupo de diez; unidades", example_es: "En el 13 hay tres unidades sueltas." },
    { term: "teen number", def_es: "un número del 11 al 19", example_es: "El 15 es un número entre 11 y 19." },
    { term: "ten frame", def_es: "una caja con 2 filas de 5 espacios donde ponemos fichas", example_es: "Llené el marco de diez con fichas." },
    { term: "full", def_es: "sin espacios vacíos", example_es: "El marco de diez está lleno." },
    { term: "extra", def_es: "las que sobran cuando ya hiciste el grupo", example_es: "Me sobran cuatro fichas extra." },
    { term: "compose", def_es: "juntar partes para formar un número", example_es: "Puedo formar el 14 con una decena y cuatro unidades." },
    { term: "break apart", def_es: "separar un número en partes más pequeñas", example_es: "Voy a separar el 16 en 10 y 6." },
    { term: "twenty", def_es: "el número que viene después del 19, hecho de 2 decenas", example_es: "Veinte es dos decenas." },
  ],
  talk: [
    { en: "How many tens do you see? How many extra ones?", es: "¿Cuántas decenas ves? ¿Cuántas unidades extra?" },
    { en: "How did you make this number? Tell me first, then next.", es: "¿Cómo formaste este número? Cuéntame primero y después." },
    { en: "Is the ten frame full? How do you know?", es: "¿El marco de diez está lleno? ¿Cómo lo sabes?" },
    { en: "What number comes after 19?", es: "¿Qué número viene después del 19?" },
    { en: "Where do we count more than ten at home?", es: "¿Dónde contamos más de diez en la casa?" },
  ],
  try_at_home: [
    {
      title: { en: "Egg Carton Ten", es: "Diez en el cartón de huevos" },
      minutes: 10,
      materials: { en: "An egg carton cut to 10 spaces, and 20 beans, coins, or pasta pieces", es: "Un cartón de huevos cortado en 10 espacios, y 20 frijoles, monedas o piezas de pasta" },
      steps: {
        en: [
          "Fill the carton with 10 beans, one in each space. Say: this is 1 ten.",
          "Say a teen number, like 14. Put 4 extra beans next to the carton.",
          "Ask: how many tens? How many ones? Say it together: 14 is 1 ten and 4 ones.",
          "Try another teen number. Take turns being the builder.",
        ],
        es: [
          "Llenen el cartón con 10 frijoles, uno en cada espacio. Digan: esta es 1 decena.",
          "Digan un número entre 11 y 19, como 14. Pongan 4 frijoles extra al lado del cartón.",
          "Pregunten: ¿cuántas decenas? ¿Cuántas unidades? Díganlo juntos: 14 es 1 decena y 4 unidades.",
          "Prueben con otro número. Túrnense para ser el constructor.",
        ],
      },
    },
    {
      title: { en: "Crayon Bundles", es: "Paquetes de crayones" },
      minutes: 10,
      materials: { en: "Crayons, pencils, or spoons, and rubber bands or string", es: "Crayones, lápices o cucharas, y ligas o hilo" },
      steps: {
        en: [
          "Count out 10 crayons. Tie them in one bundle. That is 1 ten.",
          "Count a few more crayons that are not in the bundle. These are the ones.",
          "Ask: how many crayons in all? Say: 1 ten and some ones.",
          "Make a new number with a new group of ones.",
        ],
        es: [
          "Cuenten 10 crayones. Átenlos en un paquete. Eso es 1 decena.",
          "Cuenten algunos crayones más que no estén en el paquete. Esas son las unidades.",
          "Pregunten: ¿cuántos crayones hay en total? Digan: 1 decena y algunas unidades.",
          "Formen otro número con otro grupo de unidades.",
        ],
      },
    },
    {
      title: { en: "Fill It, Then Add More", es: "Llénalo y agrega más" },
      minutes: 10,
      materials: { en: "Paper with 2 rows of 5 boxes (or an egg carton), and a handful of small objects", es: "Un papel con 2 filas de 5 cuadros (o un cartón de huevos), y un puñado de objetos pequeños" },
      steps: {
        en: [
          "Your child fills the ten frame with objects until there are no empty spaces.",
          "Ask: is it full? Then add more objects next to it.",
          "Count the extras. Ask: what number did we make?",
          "Say the story: first I fill the ten frame, then I add the extras.",
        ],
        es: [
          "Su hijo o hija llena el marco de diez con objetos hasta que no queden espacios vacíos.",
          "Pregunten: ¿está lleno? Luego agreguen más objetos al lado.",
          "Cuenten las que sobran. Pregunten: ¿qué número formamos?",
          "Digan la historia: primero lleno el marco de diez, después agrego las que sobran.",
        ],
      },
    },
    {
      title: { en: "Stair Count to Twenty", es: "Contar hasta veinte en la escalera" },
      minutes: 10,
      materials: { en: "Stairs, or steps on a walk, or 20 small things in a line", es: "Una escalera, escalones en un paseo, o 20 cosas pequeñas en fila" },
      steps: {
        en: [
          "Count steps up to 10 together. Stop and say: that is 1 ten.",
          "Keep going: 11, 12, 13. Say: 1 ten and 3 ones.",
          "Count all the way to 20. Say: 2 tens!",
          "Ask your child to pick a teen number and say how many tens and ones.",
        ],
        es: [
          "Cuenten los escalones hasta 10 juntos. Paren y digan: esa es 1 decena.",
          "Sigan: 11, 12, 13. Digan: 1 decena y 3 unidades.",
          "Cuenten hasta 20. Digan: ¡2 decenas!",
          "Pidan a su hijo o hija que elija un número entre 11 y 19 y diga cuántas decenas y unidades tiene.",
        ],
      },
    },
  ],
  say_it: [
    { en: "I fill the [ten frame].", es: "Lleno el [marco de diez]." },
    { en: "I add [number] more. I make [number].", es: "Agrego [número] más. Formo el [número]." },
    { en: "[Number] is 1 ten and [number] ones.", es: "El [número] es 1 decena y [número] unidades." },
    { en: "First I fill the ten frame, then I add [number] extra ones to make [number].", es: "Primero lleno el marco de diez, después agrego [número] unidades extra para formar el [número]." },
  ],
  help: {
    en: [
      "Count things past ten together: eggs, stickers, stairs. Stop at ten and say, \"That is one ten.\"",
      "Ask \"how did you make it?\" Let your child show you with objects.",
      "Teen words are hard in every language. Say them slowly and let your child repeat.",
      "Use Spanish, English, or both. The ten-and-ones idea is the same in every language.",
    ],
    es: [
      "Cuenten juntos cosas que pasen de diez: huevos, calcomanías, escalones. Paren en diez y digan: \"Esa es una decena\".",
      "Pregunten \"¿cómo lo formaste?\" Dejen que su hijo o hija les muestre con objetos.",
      "Los números del 11 al 19 son difíciles en todos los idiomas. Díganlos despacio y que su hijo o hija los repita.",
      "Usen español, inglés o los dos. La idea de decena y unidades es la misma en todos los idiomas.",
    ],
  },
  home_language: {
    en: "Say the teen numbers in Spanish and English side by side: \"quince, fifteen.\" In both languages we say the ones first and then the ten. Ask your child: what do you hear in \"diecisiete\"? It means \"diez y siete\": ten and seven!",
    es: "Digan los números del 11 al 19 en español y en inglés, uno junto al otro: \"quince, fifteen\". Pregunten a su hijo o hija: ¿qué escuchas en \"diecisiete\"? Quiere decir \"diez y siete\": ¡una decena y siete unidades!",
  },
  celebrate: {
    en: "You will know it is working when your child fills a ten frame, adds extras, and tells you the teen number is one ten and some ones, in any language.",
    es: "Sabrán que está funcionando cuando su hijo o hija llene un marco de diez, agregue las que sobran y les diga que el número es una decena y algunas unidades, en el idioma que quiera.",
  },
};
