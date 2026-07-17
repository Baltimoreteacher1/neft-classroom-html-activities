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
