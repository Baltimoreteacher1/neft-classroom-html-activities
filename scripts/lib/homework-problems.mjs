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

export function slugId(label, idx) {
  return (
    String(label || `cat-${idx}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `cat-${idx}`
  );
}

// Normalize drag-sort configs (ordering, nested categories, string categories).
export function normalizeDragSort(it) {
  const rawItems = it.items || [];
  const hasStringItems =
    Array.isArray(rawItems) && rawItems.length > 0 && typeof rawItems[0] === "string";
  const hasCorrectOrder = Array.isArray(it.correctOrder) && it.correctOrder.length > 0;
  const hasCategoryItems =
    Array.isArray(rawItems) &&
    rawItems.length > 0 &&
    typeof rawItems[0] === "object" &&
    rawItems[0]?.category;

  if (hasStringItems && (hasCorrectOrder || !hasCategoryItems)) {
    const steps = rawItems.map(String);
    const correctOrder = (it.correctOrder || steps).map(String);
    return {
      kind: "order",
      steps,
      correctOrder,
      label: it.label || it.instructions || "Put the steps in the correct order.",
      labelEs:
        it.labelEs ||
        it.instructionsEs ||
        (it.label || it.instructions ? "" : "Pon los pasos en el orden correcto."),
      hints: it.hints || [],
      hintsEs: it.hintsEs || [],
    };
  }

  let categories = Array.isArray(it.categories) ? [...it.categories] : [];
  let items = Array.isArray(it.items) ? [...it.items] : [];

  categories = categories.map((cat, idx) => {
    if (typeof cat === "string") {
      const id = slugId(cat, idx);
      return { id, label: cat, labelEs: it.categoriesEs?.[idx] };
    }
    if (cat && typeof cat === "object") {
      const label = cat.label || cat.id || `Group ${idx + 1}`;
      const id = cat.id || slugId(label, idx);
      return { id, label, labelEs: cat.labelEs, items: cat.items, itemsEs: cat.itemsEs };
    }
    return { id: `cat-${idx}`, label: `Group ${idx + 1}` };
  });

  if (!items.length && categories.some((c) => Array.isArray(c.items))) {
    items = categories.flatMap((cat) =>
      (cat.items || []).map((text, index) => ({
        text: String(text),
        textEs: cat.itemsEs?.[index],
        category: cat.id,
      })),
    );
    categories = categories.map(({ id, label, labelEs }) => ({ id, label, labelEs }));
  }

  if (!items.length && Array.isArray(it.cards) && categories.length) {
    const normCats = categories.map((cat, idx) => {
      if (typeof cat === "string") return { id: slugId(cat, idx), label: cat };
      const label = cat.label || cat.id || `Group ${idx + 1}`;
      return { id: cat.id || slugId(label, idx), label, labelEs: cat.labelEs };
    });
    categories = normCats;
    items = it.cards.map((card) => ({
      text: String(card.text || ""),
      textEs: card.textEs,
      category: normCats[card.correct]?.id || normCats[0]?.id || "",
    }));
  }

  items = items.map((item) => {
    if (typeof item === "string") return { text: item, category: "" };
    return {
      text: String(item.text || item.label || ""),
      textEs: item.textEs || item.labelEs,
      category: String(item.category || ""),
    };
  });

  return {
    kind: "sort",
    categories,
    items,
    label: it.label || it.instructions || "Sort the items into the correct groups.",
    labelEs:
      it.labelEs ||
      it.instructionsEs ||
      (it.label || it.instructions ? "" : "Clasifica los elementos en los grupos correctos."),
    hints: it.hints || [],
    hintsEs: it.hintsEs || [],
  };
}

/* The family answer key for one practice problem: what a parent needs to CHECK
   the work, in both languages, for every problem shape the page renders.
   Returns { lines: [{ en, es }], note: { en, es } | null }. `lines` is the
   answer itself (one line per match / card / cell / step); `note` is the
   explanation or, for open-response, what a strong answer should include.
   `es` falls back to "" when nothing Spanish is authored, so the renderer can
   show English in both language modes rather than a blank. The optional
   `translate(en, authoredEs)` lets the caller supply dictionary Spanish for
   table headers and cell values (the generator owns that dictionary). */
export function answerKeyLines(item, { translate } = {}) {
  const es = (en, authored) => (translate ? translate(en, authored) : authored || "");
  const lines = [];
  let note = null;
  const explanationNote = () =>
    item.explanation ? { en: String(item.explanation), es: item.explanationEs || "" } : null;

  switch (item.type) {
    case "multiple-choice": {
      const idx = Number.isInteger(item.correctIndex) ? item.correctIndex : 0;
      const choice = (item.choices || [])[idx];
      if (choice != null) lines.push({ en: String(choice), es: item.choicesEs?.[idx] || "" });
      note = explanationNote();
      break;
    }
    case "matching-game": {
      for (const pair of matchingPairs(item)) {
        lines.push({
          en: `${pair.term} → ${pair.match}`,
          es:
            pair.termEs || pair.matchEs
              ? `${pair.termEs || pair.term} → ${pair.matchEs || pair.match}`
              : "",
        });
      }
      note = explanationNote();
      break;
    }
    case "drag-sort": {
      const norm = normalizeDragSort(item);
      if (norm.kind === "order") {
        norm.correctOrder.forEach((step, i) => {
          const stepEs = item.itemsEs?.[norm.steps.indexOf(step)];
          lines.push({ en: `${i + 1}. ${step}`, es: stepEs ? `${i + 1}. ${stepEs}` : "" });
        });
      } else {
        for (const cat of norm.categories) {
          const members = norm.items.filter((x) => x.category === cat.id);
          if (!members.length) continue;
          const anyEs = cat.labelEs || members.some((m) => m.textEs);
          lines.push({
            en: `${cat.label}: ${members.map((m) => m.text).join(", ")}`,
            es: anyEs
              ? `${cat.labelEs || cat.label}: ${members.map((m) => m.textEs || m.text).join(", ")}`
              : "",
          });
        }
      }
      note = explanationNote();
      break;
    }
    case "fill-table": {
      const { headers, headersEs, rows } = tableModel(item);
      rows.forEach((row, rIdx) => {
        const labelCell = row.find((c) => !c.isEditable) || row[0];
        const rowLabel = labelCell?.val || `Row ${rIdx + 1}`;
        const rowLabelEs = labelCell ? es(labelCell.val, labelCell.valEs) : "";
        row.forEach((cell, cIdx) => {
          if (!cell.isEditable || !cell.correctValue) return;
          const header = headers[cIdx] || `Column ${cIdx + 1}`;
          const headerEs = es(header, headersEs[cIdx]);
          const valueEs = es(cell.correctValue, cell.valEs);
          const prefix = cell.selfReview ? "Example — " : "";
          const prefixEs = cell.selfReview ? "Ejemplo — " : "";
          lines.push({
            en: `${prefix}${rowLabel} · ${header}: ${cell.correctValue}`,
            es:
              rowLabelEs || headerEs || valueEs
                ? `${prefixEs}${rowLabelEs || rowLabel} · ${headerEs || header}: ${valueEs || cell.correctValue}`
                : "",
          });
        });
      });
      note = explanationNote();
      break;
    }
    case "error-analysis": {
      if (Number.isInteger(item.errorStep)) {
        lines.push({
          en: `The mistake is in Step ${item.errorStep + 1}.`,
          es: `El error está en el Paso ${item.errorStep + 1}.`,
        });
      }
      if (item.correctWork) {
        lines.push({
          en: `Correct work: ${item.correctWork}`,
          es: item.correctWorkEs ? `Trabajo correcto: ${item.correctWorkEs}` : "",
        });
      }
      note = explanationNote();
      break;
    }
    case "open-response": {
      const sample = item.modelAnswer || item.sampleAnswer || item.answer || item.exemplar || "";
      const sampleEs =
        item.modelAnswerEs || item.sampleAnswerEs || item.answerEs || item.exemplarEs || "";
      if (sample) lines.push({ en: String(sample), es: String(sampleEs) });
      const keywords = Array.isArray(item.keywords) ? item.keywords.filter(Boolean) : [];
      if (keywords.length) {
        const keywordsEs = Array.isArray(item.keywordsEs) ? item.keywordsEs.filter(Boolean) : [];
        lines.push({
          en: `A strong answer uses: ${keywords.join(", ")}.`,
          es: `Una buena respuesta usa: ${(keywordsEs.length ? keywordsEs : keywords).join(", ")}.`,
        });
      }
      note = explanationNote() || {
        en: "Answers will vary. Check that the reasoning is explained in a complete sentence.",
        es: "Las respuestas varían. Revisen que el razonamiento se explique en una oración completa.",
      };
      break;
    }
    default:
      break;
  }
  return { lines, note };
}
