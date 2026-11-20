/**
 * What a family sees with JavaScript switched off: tonight's six skill problems as plain HTML, the
 * answers one tap away in native <details>, and the take-home PDFs. The interactive page (hints,
 * instant checking, models) needs scripts; this keeps the practice itself reachable without them.
 * Both languages are written out with their own lang attribute because the language switch is a
 * script. Every line is the lesson's own `basicPractice`; nothing here is authored.
 */
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const COPY = {
  en: {
    title: "Practice without JavaScript",
    sheet: "Take-home sheet (PDF)",
    guide: "Grown-up answers (PDF)",
    answer: "Show the answer",
  },
  es: {
    title: "Práctica sin JavaScript",
    sheet: "Hoja para llevar a casa (PDF)",
    guide: "Respuestas para el adulto (PDF)",
    answer: "Ver la respuesta",
  },
};
const wordless = (text) => !/[A-Za-z]{2,}/.test(String(text));

function block(lang, id, items) {
  const c = COPY[lang];
  const es = lang === "es";
  const suffix = es ? "-es" : "";
  const choice = (item, i) =>
    es
      ? item.choicesEs?.[i] || (wordless(item.choices[i]) ? item.choices[i] : "")
      : item.choices[i];
  const list = items
    .map((item) => {
      const stem = es ? item.stemEs : item.stem;
      const why = es ? item.explanationEs : item.explanation;
      return `<li><p>${esc(stem)}</p><ol type="A">${item.choices
        .map((_, i) => `<li>${esc(choice(item, i))}</li>`)
        .join(
          "",
        )}</ol><details><summary>${c.answer}</summary><p><strong>${"ABCDE"[item.correctIndex]}.</strong> ${esc(why)}</p></details></li>`;
    })
    .join("");
  return `<div lang="${lang}" class="hw-static-block"><h2>${c.title}</h2><p><a href="/lessons/${id}/downloads/${id}-family-sheet${suffix}.pdf">${c.sheet}</a> · <a href="/lessons/${id}/downloads/${id}-family-guide${suffix}.pdf">${c.guide}</a></p>${list ? `<ol>${list}</ol>` : ""}</div>`;
}

/** A `<noscript>` block for the lesson page; empty when the lesson has no id. */
export function renderStaticFallback(config, lessonId) {
  const id = lessonId || config?.lessonId;
  if (!id) return "";
  const items = (config?.familyNotes?.basicPractice || []).filter(
    (item) => item.stemEs && item.explanationEs && item.choices?.length,
  );
  return `<noscript><section class="hw-static fm-no-print" aria-label="${COPY.en.title}">${block("en", id, items)}${block("es", id, items)}</section></noscript>`;
}
