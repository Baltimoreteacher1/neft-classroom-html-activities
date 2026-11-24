// BCPSS Family Guide (EN/ES) — gk-math-u4. Schema: ../schema.mjs (validateFamily)
// Home version of the Kindergarten unit on taking away within 10. Vocabulary order matches ../units/gk-math-u4.mjs.

export default {
  summary: {
    en: "Your child is learning to take away from a group within 10 and tell how many are left. It matters when we eat a snack, give a toy away, or watch kids get off the bus. Your child will say how many are left and prove it with the word because.",
    es: "Su hijo o hija está aprendiendo a quitar de un grupo hasta 10 y a decir cuántos quedan. Sirve cuando nos comemos una merienda, regalamos un juguete o vemos bajar niños del autobús. Su hijo o hija dirá cuántos quedan y lo comprobará con la palabra porque.",
  },
  goals: {
    en: [
      "I can take away from a group within 10 and tell how many are left.",
      "I can say how many are left and prove it with because.",
    ],
    es: [
      "Puedo quitar de un grupo hasta 10 y decir cuántos quedan.",
      "Puedo decir cuántos quedan y comprobarlo con porque.",
    ],
  },
  vocab: [
    { term: "subtract", def_es: "quitar una parte de un grupo para ver cuántos quedan", example_es: "Si resto 2 de 5 galletas, quedan 3." },
    { term: "take away", def_es: "sacar algunas cosas de un grupo", example_es: "Quité dos uvas del plato." },
    { term: "minus", def_es: "la palabra del signo −, que se usa para quitar", example_es: "Cinco menos dos son tres." },
    { term: "left", def_es: "lo que todavía está ahí después de quitar algunas cosas", example_es: "Me quedan tres galletas." },
    { term: "difference", def_es: "el número que sale cuando le quitas un número a otro", example_es: "La diferencia entre 5 y 2 es 3." },
    { term: "equals", def_es: "es la misma cantidad que; el signo =", example_es: "Cinco menos dos es igual a tres." },
    { term: "equation", def_es: "una oración de matemáticas con un signo de igual", example_es: "5 − 2 = 3 es una ecuación." },
    { term: "take apart", def_es: "separar un número en dos números más pequeños", example_es: "Puedo separar el 5 en 2 y 3." },
    { term: "whole", def_es: "todas las partes juntas", example_es: "El todo es 5 galletas antes de comerme alguna." },
    { term: "part", def_es: "un pedazo de un número o de un grupo", example_es: "Dos galletas son una parte del grupo de cinco." },
  ],
  talk: [
    { en: "How many did you start with? How many did you take away?", es: "¿Con cuántos empezaste? ¿Cuántos quitaste?" },
    { en: "How many are left? How do you know?", es: "¿Cuántos quedan? ¿Cómo lo sabes?" },
    { en: "Can you show me the story with objects?", es: "¿Puedes mostrarme la historia con objetos?" },
    { en: "What happens if we take away all of them?", es: "¿Qué pasa si quitamos todos?" },
    { en: "When do we take things away at home?", es: "¿Cuándo quitamos cosas en la casa?" },
  ],
  try_at_home: [
    {
      title: { en: "Snack Take-Away", es: "Quitar de la merienda" },
      minutes: 10,
      materials: { en: "Crackers, grapes, or cereal pieces, and a plate", es: "Galletas, uvas o cereal, y un plato" },
      steps: {
        en: [
          "Put 6 snacks on the plate. Say: I start with 6.",
          "Let your child eat 2. Say: I take away 2.",
          "Ask: how many are left? Count the snacks that remain.",
          "Start again with a new number. Your child tells the story: I started with, I took away, left.",
        ],
        es: [
          "Pongan 6 meriendas en el plato. Digan: empiezo con 6.",
          "Dejen que su hijo o hija se coma 2. Digan: quito 2.",
          "Pregunten: ¿cuántas quedan? Cuenten las meriendas que quedan.",
          "Empiecen otra vez con otro número. Su hijo o hija cuenta la historia: empecé con, quité, quedan.",
        ],
      },
    },
    {
      title: { en: "Sock Basket Away", es: "Sacar calcetines de la canasta" },
      minutes: 10,
      materials: { en: "A basket or box and 10 clean socks or small toys", es: "Una canasta o caja y 10 calcetines limpios o juguetes pequeños" },
      steps: {
        en: [
          "Put some socks in the basket. Count them together.",
          "Take some out. Say how many you took away.",
          "Ask: how many are left in the basket? Check by counting.",
          "Take out all of them. Ask: how many are left? Zero!",
        ],
        es: [
          "Pongan algunos calcetines en la canasta. Cuéntenlos juntos.",
          "Saquen algunos. Digan cuántos quitaron.",
          "Pregunten: ¿cuántos quedan en la canasta? Comprueben contando.",
          "Saquen todos. Pregunten: ¿cuántos quedan? ¡Cero!",
        ],
      },
    },
    {
      title: { en: "Pop the Bubbles", es: "Reventar burbujas" },
      minutes: 10,
      materials: { en: "A bath, a sink, or a bubble wand, and a paper to keep count", es: "Una tina, un lavabo o una varita de burbujas, y un papel para llevar la cuenta" },
      steps: {
        en: [
          "Blow 5 bubbles, or draw 5 circles on paper. Count them.",
          "Pop or cross out 2. Say: 5 minus 2.",
          "Ask: how many are left? How do you know?",
          "Try again with a new number. Take turns being the popper.",
        ],
        es: [
          "Soplen 5 burbujas, o dibujen 5 círculos en un papel. Cuéntenlos.",
          "Revienten o tachen 2. Digan: 5 menos 2.",
          "Pregunten: ¿cuántas quedan? ¿Cómo lo sabes?",
          "Prueben otra vez con otro número. Túrnense para reventar.",
        ],
      },
    },
    {
      title: { en: "Take Apart a Number", es: "Separar un número" },
      minutes: 10,
      materials: { en: "10 beans or coins, and a bowl or two cups", es: "10 frijoles o monedas, y un tazón o dos tazas" },
      steps: {
        en: [
          "Choose a number up to 10, like 6. Count out 6 beans. That is the whole.",
          "Put some beans in one cup and the rest in the other cup. Those are the parts.",
          "Ask: how many in each cup? Do the parts make the whole?",
          "Take apart the same number a new way. How many ways can you find?",
        ],
        es: [
          "Elijan un número hasta 10, como 6. Cuenten 6 frijoles. Ese es el todo.",
          "Pongan algunos frijoles en una taza y el resto en la otra. Esas son las partes.",
          "Pregunten: ¿cuántos hay en cada taza? ¿Las partes forman el todo?",
          "Separen el mismo número de otra forma. ¿Cuántas formas pueden encontrar?",
        ],
      },
    },
  ],
  say_it: [
    { en: "I start with [number]. I take away [number].", es: "Empiezo con [número]. Quito [número]." },
    { en: "[Number] are left.", es: "Quedan [número]." },
    { en: "[Number] minus [number] equals [number].", es: "[Número] menos [número] es igual a [número]." },
    { en: "I know [number] are left because I started with [number] and took away [number].", es: "Sé que quedan [número] porque empecé con [número] y quité [número]." },
  ],
  help: {
    en: [
      "Use snacks and toys to make take-away stories. Keep the numbers small, 10 or less.",
      "Ask \"how do you know?\" and wait. Let your child show you with objects.",
      "If the answer is not right, say \"let's count again together.\" No hurry.",
      "Use Spanish, English, or both. The idea of taking away is the same in every language.",
    ],
    es: [
      "Usen meriendas y juguetes para hacer historias de quitar. Mantengan los números pequeños, 10 o menos.",
      "Pregunten \"¿cómo lo sabes?\" y esperen. Dejen que su hijo o hija les muestre con objetos.",
      "Si la respuesta no es correcta, digan \"contemos otra vez juntos\". Sin prisa.",
      "Usen español, inglés o los dos. La idea de quitar es la misma en todos los idiomas.",
    ],
  },
  home_language: {
    en: "Tell the take-away story in Spanish first: \"Tenía cinco, quité dos, me quedan tres.\" Then say it in English. Look for twins: \"diferencia\" and \"difference\" sound almost the same.",
    es: "Cuenten primero la historia de quitar en español: \"Tenía cinco, quité dos, me quedan tres\". Luego díganla en inglés. Busquen gemelas: \"diferencia\" y \"difference\" suenan casi igual.",
  },
  celebrate: {
    en: "You will know it is working when your child takes away from a small group and tells you how many are left and how they know, in any language.",
    es: "Sabrán que está funcionando cuando su hijo o hija quite de un grupo pequeño y les diga cuántos quedan y cómo lo sabe, en el idioma que quiera.",
  },
};
