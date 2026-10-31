/* Stop 5 content: the three ready-to-use family routines and grade-by-grade conversation starters. The skill and
 * practice link come from the real Family Math games (routes.js); this file only says how to spend the minutes. */
import { p } from "./core.js";

export const ROUTINES = {
  quick: {
    minutes: 5,
    title: p("Quick Practice", "Práctica rápida"),
    tag: p("5 minutes · your child leads", "5 minutos · su hijo o hija dirige"),
    who: p("Best for a busy evening.", "Ideal para una tarde ocupada."),
    parts: [
      [
        1,
        p(
          "Say what you will practice. Ask: “What do you already know about this?”",
          "Digan qué van a practicar. Pregunten: «¿Qué ya sabes de esto?»",
        ),
      ],
      [
        3,
        p(
          "Your child plays. Stay close, stay quiet, and wait before you help.",
          "Su hijo o hija juega. Estén cerca, en silencio, y esperen antes de ayudar.",
        ),
      ],
      [
        1,
        p(
          "Ask: “How did you figure one out?” Name one thing they did well.",
          "Pregunten: «¿Cómo resolviste uno?» Nombren algo que hizo bien.",
        ),
      ],
    ],
  },
  together: {
    minutes: 10,
    title: p("Math Together", "Matemáticas juntos"),
    tag: p("10 minutes · take turns", "10 minutos · por turnos"),
    who: p(
      "Best for a calm evening with one adult.",
      "Ideal para una tarde tranquila con un adulto.",
    ),
    parts: [
      [
        2,
        p(
          "Look at the example together. Ask: “What do you notice?”",
          "Miren el ejemplo juntos. Pregunten: «¿Qué observas?»",
        ),
      ],
      [
        6,
        p(
          "Play together and take turns. When it is your turn, say your thinking out loud.",
          "Jueguen juntos y túrnense. Cuando sea su turno, digan en voz alta lo que piensan.",
        ),
      ],
      [
        2,
        p(
          "Ask: “What was the trickiest one? What will we try tomorrow?”",
          "Pregunten: «¿Cuál fue la más difícil? ¿Qué probamos mañana?»",
        ),
      ],
    ],
  },
  deeper: {
    minutes: 15,
    title: p("Deeper Thinking", "Pensar a fondo"),
    tag: p("15 minutes · explain every answer", "15 minutos · expliquen cada respuesta"),
    who: p(
      "Best for a weekend or a day with more time.",
      "Ideal para un fin de semana o un día con más tiempo.",
    ),
    parts: [
      [
        3,
        p(
          "Talk first. Ask: “Which answer do you expect? Why?” Then look at the example.",
          "Hablen primero. Pregunten: «¿Qué respuesta esperas? ¿Por qué?» Luego miren el ejemplo.",
        ),
      ],
      [
        8,
        p(
          "Play at a harder level. House rule: explain your thinking before you answer.",
          "Jueguen en un nivel más difícil. Regla de la casa: expliquen su razonamiento antes de responder.",
        ),
      ],
      [
        2,
        p(
          "Pick one mistake and fix it together. Ask: “What would you tell a friend?”",
          "Elijan un error y corríjanlo juntos. Pregunten: «¿Qué le dirías a un amigo?»",
        ),
      ],
      [
        2,
        p(
          "Reflect: “What will you remember? What will we practice next?”",
          "Reflexionen: «¿Qué vas a recordar? ¿Qué practicamos después?»",
        ),
      ],
    ],
  },
};

export const GENERAL_STARTERS = [
  p("How did you figure that out?", "¿Cómo lo averiguaste?"),
  p("Can you show me with a picture or objects?", "¿Puedes mostrármelo con un dibujo u objetos?"),
  p("What is one thing you are sure about?", "¿Qué parte sabes con seguridad?"),
];

/* Two starters per grade, tied to the ideas that grade works on. */
export const STARTERS = {
  1: [
    p("How many more make 10? How do you know?", "¿Cuántos más se necesitan para llegar a 10? ¿Cómo lo sabes?"),
    p("Can you tell me a story for 6 + 4?", "¿Puedes contarme una historia para 6 + 4?"),
  ],
  2: [
    p(
      "What happens to the tens when you hop by ten?",
      "¿Qué pasa con las decenas cuando saltas de diez en diez?",
    ),
    p("Is 38 or 83 greater? How do you know?", "¿Cuál es mayor, 38 u 83? ¿Cómo lo sabes?"),
  ],
  3: [
    p(
      "Which piece is bigger, one half or one fourth? Why?",
      "¿Qué pedazo es más grande, un medio o un cuarto? ¿Por qué?",
    ),
    p("Can you draw 3 × 4 as an array (equal rows)?", "¿Puedes dibujar 3 × 4 como un arreglo (filas iguales)?"),
  ],
  4: [
    p(
      "How can you break 24 × 3 into easier pieces?",
      "¿Cómo puedes descomponer 24 × 3 en partes más fáciles?",
    ),
    p(
      "Can you find a fraction equal to ½ and prove it?",
      "¿Puedes hallar una fracción igual a ½ y demostrarlo?",
    ),
  ],
  5: [
    p(
      "Which is greater, 0.6 or 0.58? What is your proof?",
      "¿Cuál es mayor, 0.6 o 0.58? ¿Cómo lo puedes demostrar?",
    ),
    p(
      "Before you calculate, will the answer be bigger or smaller than 1? Why?",
      "Antes de calcular, ¿la respuesta será mayor o menor que 1? ¿Por qué?",
    ),
  ],
  6: [
    p(
      "If a recipe is doubled, what happens to each part?",
      "Si una receta se duplica, ¿qué pasa con cada parte?",
    ),
    p(
      "How could a tape diagram (a bar split into equal parts) show a ratio like 2:3?",
      "¿Cómo podría mostrar una razón como 2:3 un diagrama de cinta (una barra dividida en partes iguales)?",
    ),
  ],
  7: [
    p("What does it cost for 1? How did you find it?", "¿Cuánto cuesta 1? ¿Cómo lo hallaste?"),
    p(
      "How could a table or a graph show the same rate?",
      "¿Cómo podría mostrar la misma tasa una tabla o una gráfica?",
    ),
  ],
  8: [
    p("What does the slope tell you in a story, like miles per hour?", "¿Qué te dice la pendiente en una historia, como millas por hora?"),
    p(
      "If a line is steeper, what happens to the rise for each step to the right?",
      "Si una recta es más inclinada, ¿qué pasa con la subida por cada paso a la derecha?",
    ),
  ],
};

export const startersFor = (grade) => [...(STARTERS[grade] || []), ...GENERAL_STARTERS];
