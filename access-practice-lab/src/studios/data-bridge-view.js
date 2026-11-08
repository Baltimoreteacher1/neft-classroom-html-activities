import { esc, toHtml } from "../util.js";
import { dictationControlsHTML } from "../dictation-ui.js";
import { analyzeDataExplanation, dataSupportForLevel } from "./math-reasoning-bridge.js";

const stats = (values) => {
  const ordered = [...values].sort((a, b) => a - b);
  const middle = ordered.length / 2;
  const median = ordered.length % 2 ? ordered[Math.floor(middle)] : (ordered[middle - 1] + ordered[middle]) / 2;
  return { mean: values.reduce((sum, value) => sum + value, 0) / values.length, median };
};
const tenth = (value) => (Math.round(value * 10) / 10).toFixed(1);

function modelSvg(values, selectedIndex, movedValue, I) {
  const changed = [...values];
  changed[selectedIndex] = movedValue;
  const before = stats(values);
  const after = stats(changed);
  const draw = (data, color, offset) => {
    const counts = new Map();
    return data.map((value, index) => {
      const height = (counts.get(value) || 0) + 1;
      counts.set(value, height);
      const x = 40 + value * 12;
      const y = 132 - height * 17 + offset;
      return `<circle cx="${x}" cy="${y}" r="7" fill="${index === selectedIndex ? "#b45309" : color}" stroke="#fff" stroke-width="2"/>`;
    }).join("");
  };
  const ticks = Array.from({ length: 9 }, (_, i) => {
    const value = i * 5;
    const x = 40 + value * 12;
    return `<line x1="${x}" x2="${x}" y1="162" y2="168" stroke="#17324d"/><text x="${x}" y="184" text-anchor="middle" font-size="11" fill="#17324d">${value}</text>`;
  }).join("");
  return `<div class="mlb-data-model" data-data-model>
    <figure><svg viewBox="0 0 560 200" role="img" aria-label="${esc(I.S(`Dot plot. The highlighted observation moves from ${values[selectedIndex]} to ${movedValue}.`, `Diagrama de puntos. El dato resaltado se mueve de ${values[selectedIndex]} a ${movedValue}.`))}">
      <line x1="40" x2="520" y1="162" y2="162" stroke="#17324d" stroke-width="2"/>${ticks}
      <g opacity=".3">${draw(values, "#1d4ed8", 0)}</g><g>${draw(changed, "#0f766e", 0)}</g>
    </svg><figcaption>${I.T("Blue dots show the starting set; the highlighted dot is the one you move.", "Los puntos azules muestran el conjunto inicial; el punto resaltado es el que mueves.")}</figcaption></figure>
    <label for="mlb-data-move">${I.T(`Move observation ${selectedIndex + 1}`, `Mueve el dato ${selectedIndex + 1}`)}: <output data-data-out>${movedValue}</output></label>
    <input id="mlb-data-move" type="range" min="0" max="40" step="1" value="${movedValue}" data-data-move-value aria-valuetext="${esc(I.S(`Observation value ${movedValue}`, `Valor del dato ${movedValue}`))}"/>
    <p class="mlb-data-stats" aria-live="polite" role="status">${I.T("Starting set", "Conjunto inicial")}: ${I.T("mean", "media")} ${tenth(before.mean)} · ${I.T("median", "mediana")} ${before.median} <span aria-hidden="true">→</span> ${I.T("After the move", "Después del cambio")}: ${I.T("mean", "media")} ${tenth(after.mean)} · ${I.T("median", "mediana")} ${after.median}</p>
  </div>`;
}

function evidenceHtml(response, I) {
  const result = analyzeDataExplanation(response);
  const items = [
    [result.evidence.namesBothMeasures, I.T("Names mean and median", "Nombra la media y la mediana")],
    [result.evidence.namesObservation, I.T("Identifies the changed data point", "Identifica el dato que cambió")],
    [result.evidence.connectsReason, I.T("Connects the change to a reason", "Conecta el cambio con una razón")],
  ];
  return `<p class="mlb-feedback">${I.T(result.feedback.en, result.feedback.es)}</p><ul class="mlb-evidence">${items.map(([present, label]) => `<li class="${present ? "is-present" : "is-next"}"><span aria-hidden="true" class="mlb-evidence-mark" data-state="${present ? "present" : "next"}"></span> ${label}</li>`).join("")}</ul>`;
}

export function renderDataBridge(bridge, state, I, language) {
  const moved = Number.isInteger(state.dataMoveValue)
    ? Math.max(0, Math.min(40, state.dataMoveValue))
    : bridge.values[bridge.selectedIndex];
  const model = modelSvg(bridge.values, bridge.selectedIndex, moved, I);
  const support = dataSupportForLevel(state.bridgeSupport, language);
  const bank = support?.bank.map((word) => `<span>${esc(word)}</span>`).join("") || "";
  const supportPicker = `<label class="mlb-support"><span>${I.T("Choose language support for this task", "Elige el apoyo lingüístico para esta tarea")}</span><select data-bridge-support aria-label="${esc(I.S("Language support for this task", "Apoyo lingüístico para esta tarea"))}"><option value="2" ${state.bridgeSupport === 2 ? "selected" : ""}>${I.T("More support", "Más apoyo")}</option><option value="3" ${state.bridgeSupport === 3 ? "selected" : ""}>${I.T("Some support", "Algo de apoyo")}</option><option value="5" ${state.bridgeSupport === 5 ? "selected" : ""}>${I.T("Few supports", "Poco apoyo")}</option></select></label>`;
  const scaffold = support ? `<div class="mlb-scaffold"><strong>${I.T("Useful words", "Palabras útiles")}</strong><div class="mlb-word-bank">${bank}</div><p><strong>${I.T("Sentence starter", "Inicio de oración")}</strong> ${esc(support.frame)}</p></div>` : "";
  const caution = `<aside class="mlb-separate"><strong>${I.T("Math and language evidence stay separate", "La evidencia matemática y lingüística se mantiene separada")}</strong><p>${I.T("The plot shows the data and the two measures. Your words receive language feedback only; they are not used to score the mathematics.", "La gráfica muestra los datos y las dos medidas. Tus palabras reciben comentarios de lenguaje; no se usan para calificar las matemáticas.")}</p></aside>`;

  if (state.bridgeStep === "draft") return `<section class="ls-panel-section mlb-panel"><div class="ls-section-banner"><h2>${I.T("Explain how a data point changes the center", "Explica cómo un dato cambia el centro")}</h2><p>${I.T(`Move observation ${bridge.selectedIndex + 1}. Compare the mean and median before and after. What changed, and why?`, `Mueve el dato ${bridge.selectedIndex + 1}. Compara la media y la mediana antes y después. ¿Qué cambió y por qué?`)}</p></div>${model}${supportPicker}${scaffold}<form data-data-draft><label for="mlb-data-draft">${I.T("Your explanation", "Tu explicación")}</label>${toHtml(dictationControlsHTML("mlb-data-draft", I, { label: I.T("Say it: words appear here", "Dilo: las palabras aparecen aquí") }))}<textarea id="mlb-data-draft" maxlength="1200" rows="4" required>${esc(state.dataDraft)}</textarea><button type="submit" class="btn primary">${I.T("Get language feedback", "Recibir comentarios sobre el lenguaje")}</button></form>${caution}</section>`;

  if (state.bridgeStep === "revision") return `<section class="ls-panel-section mlb-panel"><div class="ls-section-banner"><h2>${I.T("Improve your explanation", "Mejora tu explicación")}</h2><p>${I.T("Use the evidence below to revise one part. The sentence starter is removed for this revision.", "Usa la evidencia para revisar una parte. Se quita el inicio de oración para esta revisión.")}</p></div>${model}<div class="mlb-original"><strong>${I.T("First explanation", "Primera explicación")}</strong><p>${esc(state.dataDraft)}</p>${evidenceHtml(state.dataDraft, I)}</div>${state.bridgeSupport <= 2 ? `<div class="mlb-scaffold"><strong>${I.T("Word bank only", "Solo banco de palabras")}</strong><div class="mlb-word-bank">${bank}</div></div>` : ""}<form data-data-revision><label for="mlb-data-revision">${I.T("Your revision", "Tu revisión")}</label><textarea id="mlb-data-revision" maxlength="1200" rows="4" required>${esc(state.dataRevision)}</textarea><button type="submit" class="btn primary">${I.T("Continue to a new problem", "Continuar con un problema nuevo")}</button></form>${caution}</section>`;

  if (state.bridgeStep === "transfer") return `<section class="ls-panel-section mlb-panel"><div class="ls-section-banner"><h2>${I.T("Prove it with a new data set", "Demuéstralo con un conjunto de datos nuevo")}</h2><p>${I.T(`Without the plot, use ${bridge.transferValues.join(", ")} and one new value of ${bridge.transferOutlier}. Find the new mean to the nearest tenth and the median.`, `Sin la gráfica, usa ${bridge.transferValues.join(", ")} y agrega el valor ${bridge.transferOutlier}. Halla la nueva media a la décima más cercana y la mediana.`)}</p></div>${state.dataTransferFeedback ? `<p class="mlb-feedback" role="status">${esc(state.dataTransferFeedback)}</p>` : ""}<form data-data-transfer><label for="mlb-data-mean">${I.T("New mean (nearest tenth)", "Media nueva (décima más cercana)")}</label><input id="mlb-data-mean" inputmode="decimal" value="${esc(state.dataTransferMean)}" required/><label for="mlb-data-median">${I.T("New median", "Mediana nueva")}</label><input id="mlb-data-median" inputmode="decimal" value="${esc(state.dataTransferMedian)}" required/><button type="submit" class="btn primary">${I.T("Check the mathematics", "Revisar las matemáticas")}</button></form>${state.dataTransferCorrect ? `<div class="mlb-transfer-success"><p role="status">${I.T("Both values are correct. Explain independently why the added value changes the two measures differently.", "Ambos valores son correctos. Explica por tu cuenta por qué el valor agregado cambia las dos medidas de manera diferente.")}</p><form data-data-transfer-explain><label for="mlb-data-transfer-explain">${I.T("Explain independently", "Explica por tu cuenta")}</label>${toHtml(dictationControlsHTML("mlb-data-transfer-explain", I, { label: I.T("Say your independent explanation", "Di tu explicación independiente") }))}<textarea id="mlb-data-transfer-explain" maxlength="1200" rows="3" required>${esc(state.dataTransferExplain)}</textarea><button type="submit" class="btn primary">${I.T("Finish the investigation", "Terminar la investigación")}</button></form></div>` : ""}${caution}</section>`;

  return `<section class="ls-panel-section mlb-panel"><div class="ls-section-banner"><h2>${I.T("Investigation complete", "Investigación completa")}</h2><p>${I.T("You revised a data explanation and solved a new statistics problem independently.", "Revisaste una explicación de datos y resolviste un problema nuevo de estadística por tu cuenta.")}</p></div>${model}<div class="mlb-comparison"><article><h3>${I.T("First", "Primera")}</h3><p>${esc(state.dataDraft)}</p></article><article><h3>${I.T("Revised", "Revisada")}</h3><p>${esc(state.dataRevision)}</p></article><article><h3>${I.T("Independent transfer", "Transferencia independiente")}</h3><p>${esc(state.dataTransferExplain)}</p></article></div><h3>${I.T("Language evidence", "Evidencia del lenguaje")}</h3>${evidenceHtml(state.dataTransferExplain, I)}<p class="mlb-caution">${I.T("These are language observations for the response only, not a WIDA score or a mathematics achievement score.", "Estas observaciones describen solo el lenguaje de la respuesta, no una puntuación WIDA ni de logro matemático.")}</p><button type="button" class="btn ghost" data-data-reset>${I.T("Try another data investigation", "Probar otra investigación de datos")}</button></section>`;
}

export function renderDataModel(bridge, movedValue, I) {
  return modelSvg(bridge.values, bridge.selectedIndex, movedValue, I);
}
