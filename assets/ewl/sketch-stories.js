/* The Sketch compiler's story problems (bilingual). Each carries a unit, real lesson ids and a standard code that
 * tools/ewl-modes.test.mjs checks against data/curriculum-launch-manifest.json and data/ccss-standards.json.
 * `spec` is what the diagram must show; `compile` names the translation shown once a diagram is built. */
(function (root) {
  "use strict";
  var EWL = (root.EWL = root.EWL || {});
  EWL.SketchStories = [
    {
      id: "trail-mix",
      kind: "tape",
      unit: 3,
      lessons: ["3-1"],
      standard: "6.AT.1",
      compile: "ratio",
      title: "Trail mix",
      titleEs: "Mezcla de frutos secos",
      text: "A trail mix uses 3 cups of raisins for every 5 cups of nuts.",
      textEs: "Una mezcla usa 3 tazas de pasas por cada 5 tazas de nueces.",
      task: "Draw a tape diagram with one row for raisins and one row for nuts. Name each row.",
      taskEs:
        "Dibuja un diagrama de cinta con una fila para las pasas y una fila para las nueces. Ponle nombre a cada fila.",
      vocab: ["ratio", "razón"],
      spec: {
        lanes: [
          { keys: ["raisin", "pasa"], name: "raisins", nameEs: "pasas", parts: 3 },
          { keys: ["nut", "nuez", "nueces"], name: "nuts", nameEs: "nueces", parts: 5 },
        ],
      },
    },
    {
      id: "paint-total",
      kind: "tape",
      unit: 3,
      lessons: ["3-9"],
      standard: "6.AT.3",
      compile: "ratio",
      title: "Mixing paint",
      titleEs: "Mezclar pintura",
      text: "Paint is mixed 2 parts blue to 3 parts white. A batch has 20 cups of paint in all. How many cups of blue paint are in the batch?",
      textEs:
        "Una pintura se mezcla con 2 partes de azul por 3 partes de blanco. Una tanda tiene 20 tazas de pintura en total. ¿Cuántas tazas de pintura azul hay en la tanda?",
      task: "Draw a row for blue and a row for white. Put a bracket for the whole batch, and mark the part you are looking for with ?.",
      taskEs:
        "Dibuja una fila para el azul y una para el blanco. Pon un corchete para toda la tanda y marca con ? la parte que buscas.",
      vocab: ["ratio", "razón"],
      spec: {
        lanes: [
          { keys: ["blue", "azul"], name: "blue", nameEs: "azul", parts: 2, unknown: true },
          { keys: ["white", "blanco"], name: "white", nameEs: "blanco", parts: 3 },
        ],
        bracket: "20",
      },
    },
    {
      id: "walk-to-school",
      kind: "tape",
      unit: 4,
      lessons: ["4-4"],
      standard: "6.AT.4",
      compile: "percent",
      title: "Walking to school",
      titleEs: "Caminar a la escuela",
      text: "A class has 40 students. 25% of them walk to school. How many students walk?",
      textEs:
        "Una clase tiene 40 estudiantes. El 25% camina a la escuela. ¿Cuántos estudiantes caminan?",
      task: "Split one tape into equal parts so that one part is 25%. Shade the part that walks, and bracket the whole class.",
      taskEs:
        "Divide una cinta en partes iguales para que una parte sea el 25%. Sombrea la parte que camina y pon un corchete a toda la clase.",
      vocab: ["percent", "porcentaje"],
      spec: { lanes: [{ parts: 4, shaded: 1 }], bracket: "40" },
    },
    {
      id: "x-plus-5",
      kind: "tape",
      unit: 8,
      lessons: ["8-2"],
      standard: "6.AT.8",
      compile: "equation",
      title: "Stickers",
      titleEs: "Calcomanías",
      text: "Mia has some stickers, x. She gets 5 more and now has 12 stickers in all.",
      textEs:
        "Mia tiene algunas calcomanías, x. Recibe 5 más y ahora tiene 12 calcomanías en total.",
      task: "Draw one tape with a block for x and a block for 5. Label them and bracket the whole.",
      taskEs:
        "Dibuja una cinta con un bloque para x y un bloque para 5. Etiquétalos y pon un corchete al total.",
      vocab: ["equation", "ecuación"],
      spec: { lanes: [{ parts: 2, labelsAmong: ["x", "5"] }], bracket: "12" },
    },
    {
      id: "three-x",
      kind: "tape",
      unit: 8,
      lessons: ["8-3"],
      standard: "6.AT.8",
      compile: "equation",
      title: "Concert tickets",
      titleEs: "Boletos de concierto",
      text: "Three friends each pay the same price, x, for a ticket. Together they pay $12.",
      textEs: "Tres amigos pagan cada uno el mismo precio, x, por un boleto. Juntos pagan $12.",
      task: "Draw one tape that shows each friend's price as a block, label every block, and bracket the total.",
      taskEs:
        "Dibuja una cinta que muestre el precio de cada amigo como un bloque, etiqueta cada bloque y pon un corchete al total.",
      vocab: ["equation", "ecuación"],
      spec: { lanes: [{ parts: 3, allLabel: "x" }], bracket: "12" },
    },
    {
      id: "car-unit-rate",
      kind: "dnline",
      unit: 3,
      lessons: ["3-8"],
      standard: "6.AT.2",
      compile: "unitrate",
      title: "A steady car",
      titleEs: "Un auto constante",
      text: "A car travels 120 miles in 2 hours at a steady speed. How many miles does it travel in 1 hour?",
      textEs:
        "Un auto viaja 120 millas en 2 horas a una velocidad constante. ¿Cuántas millas viaja en 1 hora?",
      task: "Build a double number line: miles on top, hours on the bottom. Start at 0 and 0, and put ? where you are looking for the miles.",
      taskEs:
        "Arma una doble recta numérica: millas arriba, horas abajo. Empieza en 0 y 0 y pon ? donde buscas las millas.",
      vocab: ["unit rate", "tasa unitaria"],
      spec: {
        names: [{ keys: ["mile", "milla"] }, { keys: ["hour", "hora"] }],
        pairs: [
          ["0", "0"],
          ["120", "2"],
          ["?", "1"],
        ],
        scale: true,
      },
    },
    {
      id: "submarine-gull",
      kind: "nline",
      unit: 7,
      lessons: ["7-2"],
      standard: "6.NOS.6",
      compile: "numberline",
      title: "Sea level",
      titleEs: "Nivel del mar",
      text: "Sea level is 0. A submarine is 3 meters below sea level. A seagull is 2 1/2 meters above sea level.",
      textEs:
        "El nivel del mar es 0. Un submarino está 3 metros bajo el nivel del mar. Una gaviota está 2 1/2 metros sobre el nivel del mar.",
      task: "Mark the submarine and the seagull on the number line.",
      taskEs: "Marca el submarino y la gaviota en la recta numérica.",
      vocab: ["opposite", "opuesto"],
      axis: { min: "-5", step: "1/2" },
      spec: {
        points: [
          {
            v: "-3",
            hint: "Below 0 means to the left of 0. Count 3 whole steps.",
            hintEs: "Debajo de 0 es a la izquierda de 0. Cuenta 3 pasos enteros.",
          },
          {
            v: "5/2",
            hint: "Above 0 means to the right of 0. Each mark is a half.",
            hintEs: "Sobre 0 es a la derecha de 0. Cada marca es una mitad.",
          },
        ],
      },
    },
  ];
})(typeof window !== "undefined" ? window : globalThis);
