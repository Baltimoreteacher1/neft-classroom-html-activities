/** Normalize the two authored homework contracts without changing saved answer keys. */
export function matchingPairs(item) {
  return (item.pairs || []).map((pair) => ({
    term: String(pair.term ?? pair.left ?? ""),
    match: String(pair.match ?? pair.right ?? ""),
    termEs: pair.termEs ?? pair.leftEs ?? "",
    matchEs: pair.matchEs ?? pair.rightEs ?? "",
  }));
}

export function tableModel(item) {
  const headers = item.headers || item.columns || [];
  if (Array.isArray(item.rows?.[0])) {
    const edits = new Map(
      (item.editableCells || []).map((cell) => [`${cell.row}-${cell.col}`, cell.answer]),
    );
    return {
      headers,
      headersEs: item.headersEs || [],
      rows: item.rows.map((row, r) =>
        row.map((val, c) => ({
          val: String(val ?? ""),
          valEs: item.rowsEs?.[r]?.[c],
          isEditable: edits.has(`${r}-${c}`),
          correctValue: String(edits.get(`${r}-${c}`) ?? ""),
        })),
      ),
    };
  }
  // Object insertion order is the authored column order. The old mapper forced
  // `answer` to the last column and moved Pattern/Check under Quotient.
  const keys =
    item.columnKeys || Object.keys(item.rows?.[0] || {}).filter((key) => !key.endsWith("Es"));
  let editKeys =
    item.editableColumns ||
    (keys.includes("answer")
      ? ["answer"]
      : keys.filter((key) =>
          [
            "solution",
            "quotient",
            "relatedSolution",
            "statistical",
            "correct",
            "circleType",
            "shadeDirection",
          ].includes(key),
        ));
  if (!editKeys.length) editKeys = keys.slice(1);
  return {
    headers,
    headersEs: item.columnsEs || [],
    rows: (item.rows || []).map((row, r) =>
      keys.map((key) => {
        const correctValue = String(row[key] ?? "");
        const isEditable = editKeys.includes(key);
        const selfReview =
          isEditable &&
          ![
            "answer",
            "solution",
            "quotient",
            "relatedSolution",
            "statistical",
            "correct",
            "circleType",
            "shadeDirection",
          ].includes(key);
        return {
          val: correctValue,
          valEs: row[`${key}Es`] || item.rowsEs?.[r]?.[key],
          correctValue,
          isEditable,
          selfReview,
        };
      }),
    ),
  };
}

export function questionGuide(item) {
  const hints = item.hints || (item.hint ? [item.hint] : []);
  const hintsEs = item.hintsEs || (item.hintEs ? [item.hintEs] : []);
  return {
    en: hints[0] || "Name what is given and what you need to find.",
    es: hintsEs[0] || "Nombra los datos y lo que necesitas encontrar.",
    draw: "Use this space for a sketch, labels, or calculations that explain your answer.",
    drawEs: "Usa este espacio para un dibujo, etiquetas o cálculos que expliquen tu respuesta.",
    coach: hints[1] || "What makes your answer reasonable? Use the question to check it.",
    coachEs: hintsEs[1] || "¿Por qué es razonable tu respuesta? Usa la pregunta para comprobarla.",
  };
}

export function spanishChoiceFeedback(item) {
  return (item.choices || []).map(
    (_, index) =>
      item.choiceFeedbackEs?.[index] ||
      (index === (item.correctIndex ?? 0)
        ? `Correcto. ${item.explanationEs || "Explica cómo lo sabes."}`
        : `Revisa tu elección. ${item.hintsEs?.[0] || item.explanationEs || "Vuelve a leer la pregunta y comprueba los datos y las unidades."}`),
  );
}
