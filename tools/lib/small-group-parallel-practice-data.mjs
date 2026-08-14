const tidy = (value) => Number(Number(value).toFixed(4));

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// Spanish lane default — mirrors small-group-parallel-practice.mjs. Spanish is
// emitted ONLY when a builder authored a Spanish stem, so a half-translated unit
// never leaks "undefined" or a stray Spanish hint. Steps arrive as
// [promptEn, answer, promptEs]; answers stay shared across lanes.
const ES_DEFAULT_STRATEGY = "Usa el modelo visual y completa un paso a la vez.";

function makeItem(
  context,
  index,
  { stem, stemEs, answer, visual, steps, hint, hintEs, explanation, explanationEs },
) {
  const hasEs = Boolean(stemEs);
  const item = {
    id: `${context.lessonId}-parallel-${String(index + 1).padStart(2, "0")}`,
    type: "guided-fill",
    stem,
    answer: String(answer),
    visual,
    steps: steps.map(([prompt, stepAnswer, promptEs]) =>
      hasEs && promptEs
        ? { prompt, promptEs, answer: String(stepAnswer) }
        : { prompt, answer: String(stepAnswer) },
    ),
    hints: [hint || "Use the visual model, then complete one step at a time."],
    explanation:
      explanation || steps.map(([prompt, value]) => prompt.replace("___", value)).join(" "),
  };
  if (hasEs) {
    item.stemEs = stemEs;
    item.hintsEs = [hintEs || ES_DEFAULT_STRATEGY];
    const explEs =
      explanationEs ||
      (steps.every((step) => step[2])
        ? steps.map(([, value, promptEs]) => String(promptEs).replace("___", value)).join(" ")
        : null);
    if (explEs) item.explanationEs = explEs;
  }
  return item;
}

export function buildDataPractice(context) {
  const lesson = context.lesson;
  return Array.from({ length: 12 }, (_, index) => {
    const band = Math.floor(index / 4) * 10;
    const data = [
      band + 2 + (index % 4),
      band + 4 + (index % 3),
      band + 5 + (index % 5),
      band + 7 + (index % 2),
      band + 8 + (index % 4),
    ].sort((a, b) => a - b);
    const mean = tidy(data.reduce((sum, value) => sum + value, 0) / data.length);
    if (lesson === 1) {
      const answer = index % 2 ? "statistical" : "not statistical";
      const topics = [
        "read",
        "practiced music",
        "walked",
        "played outside",
        "studied",
        "slept",
        "used a tablet",
        "helped at home",
        "drew",
        "exercised",
        "played a game",
        "traveled",
      ];
      const names = [
        "Maya",
        "Luis",
        "Amina",
        "Jayden",
        "Sofia",
        "Noah",
        "Zuri",
        "Mateo",
        "Leila",
        "Kai",
        "Nia",
        "Omar",
      ];
      const stem =
        index % 2
          ? `Classify: “How many minutes did each student ${topics[index]} yesterday?”`
          : `Classify: “How many minutes did ${names[index]} ${topics[index]} yesterday?”`;
      const stemEs =
        index % 2
          ? `Clasifica: “¿Cuántos minutos ${topics[index]} cada estudiante ayer?”`
          : `Clasifica: “¿Cuántos minutos ${names[index]} ${topics[index]} ayer?”`;
      return makeItem(context, index, {
        stem,
        stemEs,
        answer,
        visual: { kind: "survey-cards", values: data },
        steps: [
          [
            "Does the question expect different answers? ___.",
            index % 2 ? "yes" : "no",
            "¿La pregunta espera respuestas diferentes? ___.",
          ],
          ["Classify the question: ___.", answer, "Clasifica la pregunta: ___."],
        ],
      });
    }
    if (lesson === 2) {
      const mode = data.find((value, position) => data.indexOf(value) !== position) ?? "none";
      const answer = `mean ${mean}; median ${median(data)}; mode ${mode}`;
      return makeItem(context, index, {
        stem: `Find the mean, median, and mode of the new data set: ${data.join(", ")}.`,
        stemEs: `Encuentra la media, la mediana y la moda del nuevo conjunto de datos: ${data.join(", ")}.`,
        answer,
        visual: { kind: "data-dots", values: data },
        steps: [
          [
            "Add all values: ___.",
            data.reduce((sum, value) => sum + value, 0),
            "Suma todos los valores: ___.",
          ],
          [
            `Divide by ${data.length} for the mean: ___.`,
            mean,
            `Divide entre ${data.length} para la media: ___.`,
          ],
          ["Find the middle value: ___.", median(data), "Encuentra el valor del medio: ___."],
          [
            "Name the value that repeats most, or write none: ___.",
            mode,
            "Nombra el valor que más se repite, o escribe none: ___.",
          ],
        ],
      });
    }
    if (lesson === 3) {
      const deviations = data.map((value) => tidy(Math.abs(value - mean)));
      const mad = tidy(deviations.reduce((sum, value) => sum + value, 0) / deviations.length);
      return makeItem(context, index, {
        stem: `Find the MAD of the new data set: ${data.join(", ")}.`,
        stemEs: `Encuentra la desviación media absoluta (MAD) del nuevo conjunto de datos: ${data.join(", ")}.`,
        answer: mad,
        visual: { kind: "deviation-plot", values: data, mean },
        steps: [
          ["Find the mean: ___.", mean, "Encuentra la media: ___."],
          [
            "List absolute deviations: ___.",
            deviations.join(", "),
            "Escribe las desviaciones absolutas: ___.",
          ],
          ["Average the deviations: ___.", mad, "Calcula el promedio de las desviaciones: ___."],
        ],
      });
    }
    if (lesson === 4) {
      const outlier = 30 + index;
      const outlierData = [...data, outlier];
      return makeItem(context, index, {
        stem: `The data are ${outlierData.join(", ")}. Choose the better center: mean or median.`,
        stemEs: `Los datos son ${outlierData.join(", ")}. Elige la mejor medida de centro: escribe mean o median.`,
        answer: "median",
        visual: { kind: "data-dots", values: outlierData },
        steps: [
          ["Identify the far-away value: ___.", outlier, "Identifica el valor lejano: ___."],
          ["Choose the resistant measure: ___.", "median", "Elige la medida resistente: ___."],
        ],
      });
    }
    if (lesson === 5) {
      const sorted = [...data].sort((a, b) => a - b);
      const answer = `${sorted[0]}, ${median(sorted.slice(0, 2))}, ${median(sorted)}, ${median(sorted.slice(3))}, ${sorted.at(-1)}`;
      return makeItem(context, index, {
        stem: `Build a five-number summary for ${sorted.join(", ")}.`,
        stemEs: `Construye un resumen de cinco números para ${sorted.join(", ")}.`,
        answer,
        visual: { kind: "box-plot", values: sorted },
        steps: [
          ["Minimum and maximum: ___.", `${sorted[0]}, ${sorted.at(-1)}`, "Mínimo y máximo: ___."],
          ["Median: ___.", median(sorted), "Mediana: ___."],
          [
            "Write min, Q1, median, Q3, max: ___.",
            answer,
            "Escribe mínimo, Q1, mediana, Q3, máximo: ___.",
          ],
        ],
      });
    }
    if (lesson === 6) {
      const counts = [2 + (index % 3), 4 + (index % 4), 3 + (index % 2)];
      const total = counts.reduce((sum, value) => sum + value, 0);
      return makeItem(context, index, {
        stem: `A histogram has interval counts ${counts.join(", ")}. How many data values are represented?`,
        stemEs: `Un histograma tiene conteos por intervalo ${counts.join(", ")}. ¿Cuántos valores de datos se representan?`,
        answer: total,
        visual: { kind: "histogram", values: counts },
        steps: [
          [
            "Add the bar frequencies: ___.",
            counts.join(" + "),
            "Suma las frecuencias de las barras: ___.",
          ],
          ["Total data values: ___.", total, "Total de valores de datos: ___."],
        ],
      });
    }
    const shapeIndex = index % 3;
    const answer =
      shapeIndex === 0 ? "symmetric" : shapeIndex === 1 ? "skewed right" : "cluster with a gap";
    const shapeData =
      shapeIndex === 0
        ? [2, 3, 4, 5, 6].map((value) => value + band)
        : shapeIndex === 1
          ? [2, 3, 3, 4, 10].map((value) => value + band)
          : [2, 3, 4, 10, 11].map((value) => value + band);
    return makeItem(context, index, {
      stem: `The new display has values ${shapeData.join(", ")} in practice set ${index + 1}. Describe its overall shape.`,
      stemEs: `La nueva gráfica tiene los valores ${shapeData.join(", ")} en el conjunto de práctica ${index + 1}. Describe su forma general.`,
      answer,
      visual: { kind: "distribution-shape", shape: answer, values: shapeData },
      steps: [
        [
          "Look for balance, a tail, clusters, or gaps: ___.",
          answer,
          "Busca equilibrio, una cola, grupos o espacios: ___.",
        ],
        ["Name the distribution shape: ___.", answer, "Nombra la forma de la distribución: ___."],
      ],
    });
  });
}

function quadrant(x, y) {
  if (x > 0) return y > 0 ? "Quadrant I" : "Quadrant IV";
  return y > 0 ? "Quadrant II" : "Quadrant III";
}

export function buildCoordinatePractice(context) {
  const lesson = context.lesson;
  return Array.from({ length: 12 }, (_, index) => {
    const x = (index % 6) + 1;
    const y = ((index * 2) % 7) + 1;
    const sx = index % 2 ? -x : x;
    const sy = index % 3 ? y : -y;
    if ([1, 5].includes(lesson)) {
      const answer = quadrant(sx, sy);
      return makeItem(context, index, {
        stem: `Plot and name the quadrant for the new point (${sx}, ${sy}).`,
        stemEs: `Ubica y nombra el cuadrante del nuevo punto (${sx}, ${sy}).`,
        answer,
        visual: { kind: "coordinate-grid", point: [sx, sy] },
        steps: [
          ["Move horizontally to x = ___.", sx, "Muévete horizontalmente hasta x = ___."],
          ["Move vertically to y = ___.", sy, "Muévete verticalmente hasta y = ___."],
          ["Name the quadrant: ___.", answer, "Nombra el cuadrante: ___."],
        ],
      });
    }
    if (lesson === 2) {
      const integer = -(3 + index * 2 + context.group);
      return makeItem(context, index, {
        stem: `Find the absolute value of the new integer ${integer}.`,
        stemEs: `Encuentra el valor absoluto del nuevo número entero ${integer}.`,
        answer: Math.abs(integer),
        visual: { kind: "number-line", value: integer },
        steps: [
          [
            "Distance from zero ignores direction: ___.",
            Math.abs(integer),
            "La distancia desde cero no toma en cuenta la dirección: ___.",
          ],
          ["Write the absolute value: ___.", Math.abs(integer), "Escribe el valor absoluto: ___."],
        ],
      });
    }
    if (lesson === 8) {
      // Opposites and the meaning of zero (7-1, 6.NOS.6) — added by the
      // 2026-08-14 alignment audit. 7-1 previously drew the compare/order
      // family, which is 7-4's objective, not "represent a quantity, say what
      // zero means, name the opposite."
      const size = 3 + index * 2 + context.group;
      const [scene, sceneEs, zero, zeroEs] = [
        [
          `A diver is ${size} feet below the surface.`,
          `Un buzo está a ${size} pies bajo la superficie.`,
          "the surface",
          "la superficie",
        ],
        [
          `The temperature is ${size} degrees below zero.`,
          `La temperatura está ${size} grados bajo cero.`,
          "zero degrees",
          "cero grados",
        ],
        [
          `A player loses ${size} points.`,
          `Un jugador pierde ${size} puntos.`,
          "no change in score",
          "sin cambio de puntos",
        ],
        [
          `An account is overdrawn by $${size}.`,
          `Una cuenta está sobregirada por $${size}.`,
          "a balance of $0",
          "un saldo de $0",
        ],
      ][index % 4];
      return makeItem(context, index, {
        stem: `${scene} Write the integer, then its opposite.`,
        stemEs: `${sceneEs} Escribe el número entero y luego su opuesto.`,
        answer: size,
        visual: { kind: "number-line", values: [-size, size] },
        steps: [
          [
            `Below/lost/owed means negative: the integer is ___.`,
            -size,
            `Debajo/perdido/debido significa negativo: el entero es ___.`,
          ],
          [
            `The opposite sits the same distance from 0 on the other side: ___.`,
            size,
            `El opuesto queda a la misma distancia de 0 pero del otro lado: ___.`,
          ],
          [
            `Both are ___ units from zero, and here zero means ${zero}.`,
            size,
            `Ambos están a ___ unidades del cero, y aquí el cero significa ${zeroEs}.`,
          ],
        ],
        hint: "Decide what zero stands for in the story first — then negative is one side of it and the opposite is the mirror point.",
        hintEs:
          "Primero decide qué representa el cero en la historia: lo negativo queda a un lado y el opuesto es el punto espejo.",
      });
    }
    if ([3, 4].includes(lesson)) {
      const a = tidy(-5 + index * 0.6);
      const b = tidy(3 - index * 0.25);
      const answer = a < b ? `${a} < ${b}` : `${a} > ${b}`;
      return makeItem(context, index, {
        stem: `Compare the new rational numbers ${a} and ${b}.`,
        stemEs: `Compara los nuevos números racionales ${a} y ${b}.`,
        answer,
        visual: { kind: "number-line", values: [a, b] },
        steps: [
          [
            "The number farther left is ___.",
            Math.min(a, b),
            "El número que está más a la izquierda es ___.",
          ],
          ["Write the comparison: ___.", answer, "Escribe la comparación: ___."],
        ],
      });
    }
    if (lesson === 6) {
      const x2 = sx + (index % 2 ? 0 : 5);
      const y2 = sy + (index % 2 ? 6 : 0);
      const answer = Math.abs(x2 - sx) + Math.abs(y2 - sy);
      return makeItem(context, index, {
        stem: `Find the horizontal or vertical distance between (${sx}, ${sy}) and (${x2}, ${y2}).`,
        stemEs: `Encuentra la distancia horizontal o vertical entre (${sx}, ${sy}) y (${x2}, ${y2}).`,
        answer,
        visual: {
          kind: "coordinate-distance",
          points: [
            [sx, sy],
            [x2, y2],
          ],
        },
        steps: [
          [
            "Subtract the changing coordinates: ___.",
            answer,
            "Resta las coordenadas que cambian: ___.",
          ],
          [
            "Take absolute value for distance: ___.",
            answer,
            "Toma el valor absoluto para la distancia: ___.",
          ],
        ],
      });
    }
    const acrossX = index % 2 === 0;
    const answer = acrossX ? `(${sx}, ${-sy})` : `(${-sx}, ${sy})`;
    return makeItem(context, index, {
      stem: `Reflect (${sx}, ${sy}) across the ${acrossX ? "x" : "y"}-axis.`,
      stemEs: `Refleja (${sx}, ${sy}) sobre el eje ${acrossX ? "x" : "y"}.`,
      answer,
      visual: { kind: "coordinate-reflection", point: [sx, sy], axis: acrossX ? "x" : "y" },
      steps: [
        [
          `Keep the ${acrossX ? "x" : "y"}-coordinate: ___.`,
          acrossX ? sx : sy,
          `Conserva la coordenada ${acrossX ? "x" : "y"}: ___.`,
        ],
        [
          `Change the sign of the ${acrossX ? "y" : "x"}-coordinate: ___.`,
          acrossX ? -sy : -sx,
          `Cambia el signo de la coordenada ${acrossX ? "y" : "x"}: ___.`,
        ],
        ["Write the reflected point: ___.", answer, "Escribe el punto reflejado: ___."],
      ],
    });
  });
}

/* ── Two-variable relationships (and their table-reasoning cousins) ──────────
 * Written for the 2026-08-14 task-alignment audit. The renumbered Unit 9
 * lessons (6.AT.11) had no family of their own: LEGACY_TOPIC handed 9-1/9-2
 * equivalent-ratio scaling and 9-3 one-variable "x + 2 = 4" translation —
 * technically intentional mappings whose items never put TWO quantities in
 * front of the student. This family works the actual objective arc:
 *   lesson 1 (9-1)  covariation table + name the dependent variable
 *   lesson 2 (9-2)  read a relationship from its table, extend it
 *   lesson 3 (9-3)  write the equation a table shows (y = kx / y = x + b)
 *   lesson 4 (9-4)  use a given rate equation to solve
 *   lesson 5 (1-5)  pattern rule → table of values → predict a far term
 *   lesson 6 (1-3)  decimal scaling table (represent with a table, decimal ops)
 * Every answer below is derived, not authored, so the arithmetic is exact by
 * construction; spot-solved by hand during the audit.
 */
export function buildTwoVariablePractice(context) {
  const lesson = context.lesson;
  return Array.from({ length: 12 }, (_, index) => {
    // 7 is coprime to 12, so (index * 7) % 12 walks every residue — all twelve
    // items get a distinct rate and no two stems in a bank can collide.
    const k = 2 + ((index * 7) % 12) + (context.group === 2 ? 1 : 0);
    if (lesson === 1) {
      return makeItem(context, index, {
        stem: `Movie tickets cost $${k} each. The table pairs tickets bought (x) with total cost (y). Complete the table, then name the variable that DEPENDS on the other — type cost or tickets.`,
        stemEs: `Cada boleto de cine cuesta $${k}. La tabla empareja boletos comprados (x) con el costo total (y). Completa la tabla y nombra la variable que DEPENDE de la otra — escribe cost (costo) o tickets (boletos).`,
        answer: "cost",
        visual: { kind: "xy-table", values: [1, k] },
        steps: [
          [`Cost of 2 tickets: 2 × ${k} = ___.`, 2 * k, `Costo de 2 boletos: 2 × ${k} = ___.`],
          [`Cost of 3 tickets: 3 × ${k} = ___.`, 3 * k, `Costo de 3 boletos: 3 × ${k} = ___.`],
          [
            "The total changes BECAUSE the tickets change, so the dependent variable is the ___ (type cost or tickets).",
            "cost",
            "El total cambia PORQUE cambian los boletos, así que la variable dependiente es ___ (escribe cost o tickets).",
          ],
        ],
        hint: "Ask which quantity you choose first, and which one is decided FOR you by that choice.",
        hintEs: "Pregunta qué cantidad eliges primero y cuál queda decidida POR esa elección.",
      });
    }
    if (lesson === 2) {
      return makeItem(context, index, {
        stem: `A table shows the relationship: x = 1 → y = ${k}, x = 2 → y = ${2 * k}, x = 3 → y = ${3 * k}. How does y change as x grows, and what is y when x = 5?`,
        stemEs: `Una tabla muestra la relación: x = 1 → y = ${k}, x = 2 → y = ${2 * k}, x = 3 → y = ${3 * k}. ¿Cómo cambia y cuando x crece, y cuánto vale y cuando x = 5?`,
        answer: 5 * k,
        visual: { kind: "xy-table", values: [1, k] },
        steps: [
          [`Each time x goes up by 1, y goes up by ___.`, k, `Cada vez que x sube 1, y sube ___.`],
          [`So y is always x × ___.`, k, `Así que y siempre es x × ___.`],
          [`When x = 5, y = 5 × ${k} = ___.`, 5 * k, `Cuando x = 5, y = 5 × ${k} = ___.`],
        ],
        hint: "Read DOWN the y-column: the jump between rows is the rate the relationship runs on.",
        hintEs: "Lee la columna de y hacia abajo: el salto entre filas es la tasa de la relación.",
      });
    }
    if (lesson === 3) {
      const additive = index % 2 === 1;
      // floor(index / 2) makes each parity's six parameters distinct, so no
      // two multiplicative (or additive) stems repeat inside one bank.
      const k3 = 2 + Math.floor(index / 2) + (context.group === 2 ? 1 : 0);
      const b = 3 + Math.floor(index / 2);
      const answer = additive ? `y = x + ${b}` : `y = ${k3}x`;
      const row = (x) => (additive ? x + b : k3 * x);
      return makeItem(context, index, {
        stem: `A table shows: x = 1 → y = ${row(1)}, x = 2 → y = ${row(2)}, x = 3 → y = ${row(3)}. Write the equation that relates y to x.`,
        stemEs: `Una tabla muestra: x = 1 → y = ${row(1)}, x = 2 → y = ${row(2)}, x = 3 → y = ${row(3)}. Escribe la ecuación que relaciona y con x.`,
        answer,
        visual: { kind: "xy-table", values: [1, row(1)] },
        steps: additive
          ? [
              [
                `Test adding: ${row(1)} − 1 = ___, the same gap every row.`,
                b,
                `Prueba la suma: ${row(1)} − 1 = ___, la misma diferencia en cada fila.`,
              ],
              [`Check with x = 3: 3 + ${b} = ___.`, row(3), `Comprueba con x = 3: 3 + ${b} = ___.`],
              ["Write the equation: ___.", answer, "Escribe la ecuación: ___."],
            ]
          : [
              [
                `Test multiplying: ${row(1)} ÷ 1 = ___, the same factor every row.`,
                k3,
                `Prueba la multiplicación: ${row(1)} ÷ 1 = ___, el mismo factor en cada fila.`,
              ],
              [
                `Check with x = 3: 3 × ${k3} = ___.`,
                row(3),
                `Comprueba con x = 3: 3 × ${k3} = ___.`,
              ],
              ["Write the equation: ___.", answer, "Escribe la ecuación: ___."],
            ],
        hint: "Try both moves on the first row — multiply or add — then make the SAME move explain every other row.",
        hintEs:
          "Prueba ambas ideas con la primera fila — multiplicar o sumar — y exige que la MISMA idea explique todas las filas.",
      });
    }
    if (lesson === 4) {
      const rate = [4.5, 6, 7.5, 9][index % 4];
      const months = 3 + (index % 5);
      const cost = tidy(rate * months);
      return makeItem(context, index, {
        stem: `A gym membership costs $${rate} per month, so the equation is c = ${rate}m. Use it to find the cost c of ${months} months.`,
        stemEs: `Una membresía de gimnasio cuesta $${rate} al mes, así que la ecuación es c = ${rate}m. Úsala para hallar el costo c de ${months} meses.`,
        answer: cost,
        visual: { kind: "xy-table", values: [1, rate] },
        steps: [
          [
            `Substitute the months: c = ${rate} × ___.`,
            months,
            `Sustituye los meses: c = ${rate} × ___.`,
          ],
          [`Multiply: ${rate} × ${months} = ___.`, cost, `Multiplica: ${rate} × ${months} = ___.`],
        ],
        hint: "The equation already holds the plan — put the known value in for m and the arithmetic finishes it.",
        hintEs:
          "La ecuación ya contiene el plan: pon el valor conocido en m y la aritmética hace el resto.",
      });
    }
    if (lesson === 5) {
      const add = 1 + (index % 4);
      const far = 10 * k + add;
      return makeItem(context, index, {
        stem: `Pattern rule: multiply the position by ${k}, then add ${add}. Complete the table for positions 1, 2, 3 — then use the rule to predict the value at position 10.`,
        stemEs: `Regla del patrón: multiplica la posición por ${k} y luego suma ${add}. Completa la tabla para las posiciones 1, 2 y 3, y usa la regla para predecir el valor en la posición 10.`,
        answer: far,
        visual: { kind: "xy-table", values: [1, k + add] },
        steps: [
          [`Position 1: 1 × ${k} + ${add} = ___.`, k + add, `Posición 1: 1 × ${k} + ${add} = ___.`],
          [
            `Position 3: 3 × ${k} + ${add} = ___.`,
            3 * k + add,
            `Posición 3: 3 × ${k} + ${add} = ___.`,
          ],
          [
            `Position 10 — no need to list every row: 10 × ${k} + ${add} = ___.`,
            far,
            `Posición 10 — sin listar cada fila: 10 × ${k} + ${add} = ___.`,
          ],
        ],
        hint: "The rule is the shortcut: it jumps straight to any position without filling every row between.",
        hintEs:
          "La regla es el atajo: llega directo a cualquier posición sin llenar todas las filas intermedias.",
      });
    }
    // lesson 6 — decimal scaling table (1-3 "Math is In My World"): represent
    // the situation with a table and let decimal arithmetic do the work.
    const minutes = [12.5, 7.5, 15.5, 22.5, 8.5, 35.5, 6.5, 17.5, 24.5, 9.5, 13.5, 28.5][
      index % 12
    ];
    const ten = tidy(minutes * 10);
    const twenty = tidy(minutes * 20);
    return makeItem(context, index, {
      stem: `One tram trip takes ${minutes} minutes. Build the table: 1 trip → ${minutes} min, 10 trips → ___, and use it to find the minutes for 20 trips.`,
      stemEs: `Un viaje del tranvía tarda ${minutes} minutos. Construye la tabla: 1 viaje → ${minutes} min, 10 viajes → ___, y úsala para hallar los minutos de 20 viajes.`,
      answer: twenty,
      visual: { kind: "xy-table", values: [1, minutes] },
      steps: [
        [
          `10 trips: ${minutes} × 10 = ___ (multiplying by 10 shifts the decimal point).`,
          ten,
          `10 viajes: ${minutes} × 10 = ___ (multiplicar por 10 corre el punto decimal).`,
        ],
        [
          `20 trips is double that: ${ten} × 2 = ___.`,
          twenty,
          `20 viajes es el doble: ${ten} × 2 = ___.`,
        ],
      ],
      hint: "Grow the table in easy jumps — ×10 first, then double — instead of adding one trip at a time.",
      hintEs:
        "Haz crecer la tabla con saltos fáciles — primero ×10 y luego el doble — en vez de sumar un viaje a la vez.",
    });
  });
}
