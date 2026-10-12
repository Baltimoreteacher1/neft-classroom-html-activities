/** Family models for recognizing statistical questions, rather than computing statistics. */
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const bi = (en, es) =>
  `<span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span>`;

export const QUESTION_CASES = [
  {
    label: "One shelf now",
    labelEs: "Un estante ahora",
    question: "How many books are on this shelf right now?",
    questionEs: "¿Cuántos libros hay en este estante ahora?",
    scope: "One shelf, at one moment. Count its books once.",
    scopeEs: "Un estante, en un momento. Cuenta sus libros una vez.",
    statistical: false,
    sample: "This shelf: 4 books",
    sampleEs: "Este estante: 4 libros",
    reason:
      "This asks for one fixed count. We do not expect a set of varying answers to answer this question.",
    reasonEs:
      "Se pide una sola cantidad fija. No se espera un conjunto de respuestas variadas para responder esta pregunta.",
  },
  {
    label: "Each shelf in a room",
    labelEs: "Cada estante de un cuarto",
    question: "How many books are on each shelf in this room?",
    questionEs: "¿Cuántos libros hay en cada estante de este cuarto?",
    scope: "Several shelves. Collect one book count from each shelf.",
    scopeEs: "Varios estantes. Recopila una cantidad de libros de cada estante.",
    statistical: true,
    sample: "Shelf A: 4 · Shelf B: 7 · Shelf C: 10 books",
    sampleEs: "Estante A: 4 · Estante B: 7 · Estante C: 10 libros",
    reason:
      "The book counts can vary from shelf to shelf. We collect a set of data to answer the question.",
    reasonEs:
      "Las cantidades de libros pueden variar de un estante a otro. Recopilamos un conjunto de datos para responder la pregunta.",
  },
  {
    label: "One bus, several days",
    labelEs: "Un autobús, varios días",
    question: "How long does my bus trip take on different school days?",
    questionEs: "¿Cuánto dura mi viaje en autobús en distintos días de clase?",
    scope: "The same trip, observed on several days. Collect one travel time per day.",
    scopeEs: "El mismo viaje, observado durante varios días. Recopila un tiempo de viaje por día.",
    statistical: true,
    sample: "Monday: 18 · Tuesday: 25 · Wednesday: 21 minutes",
    sampleEs: "Lunes: 18 · Martes: 25 · Miércoles: 21 minutos",
    reason:
      "Travel time can vary across days. A question about one person or one bus can be statistical when it asks about repeated observations.",
    reasonEs:
      "El tiempo de viaje puede variar entre días. Una pregunta sobre una persona o un autobús puede ser estadística si pide observaciones repetidas.",
  },
  {
    label: "Favorite sports",
    labelEs: "Deportes favoritos",
    question: "What is each student's favorite sport?",
    questionEs: "¿Cuál es el deporte favorito de cada estudiante?",
    scope: "Several students. Collect one sport preference from each student.",
    scopeEs: "Varios estudiantes. Recopila el deporte preferido de cada estudiante.",
    statistical: true,
    sample: "Student A: soccer · Student B: basketball · Student C: swimming",
    sampleEs: "Estudiante A: fútbol · Estudiante B: baloncesto · Estudiante C: natación",
    reason:
      "Preferences can vary. Statistical data can be categories, such as sports; the answers do not have to be numbers.",
    reasonEs:
      "Las preferencias pueden variar. Los datos estadísticos pueden ser categorías, como deportes; las respuestas no tienen que ser números.",
  },
  {
    label: "Days in each week",
    labelEs: "Días de cada semana",
    question: "How many days are in each calendar week?",
    questionEs: "¿Cuántos días tiene cada semana del calendario?",
    scope: "Calendar weeks all have a fixed length of seven days.",
    scopeEs: "Todas las semanas del calendario tienen una duración fija de siete días.",
    statistical: false,
    sample: "Week A: 7 · Week B: 7 · Week C: 7 days",
    sampleEs: "Semana A: 7 · Semana B: 7 · Semana C: 7 días",
    reason:
      "The word 'each' is not enough. A calendar week always has seven days, so this question does not anticipate variation.",
    reasonEs:
      "La palabra «cada» no basta. Una semana del calendario siempre tiene siete días, así que esta pregunta no espera variación.",
  },
  {
    label: "A survey with matching answers",
    labelEs: "Una encuesta con respuestas iguales",
    question: "How many pets does each student in our class have?",
    questionEs: "¿Cuántas mascotas tiene cada estudiante de nuestra clase?",
    scope: "Survey the class. Pet counts can vary, even if the first few answers match.",
    scopeEs:
      "Encuesta a la clase. Las cantidades de mascotas pueden variar, aunque las primeras respuestas coincidan.",
    statistical: true,
    sample: "First three students: 0, 0, 0 pets",
    sampleEs: "Primeros tres estudiantes: 0, 0, 0 mascotas",
    reason:
      "We anticipate variation before collecting the data. Matching answers in a small sample do not make the question non-statistical.",
    reasonEs:
      "Esperamos variación antes de recopilar los datos. Respuestas iguales en una muestra pequeña no hacen que la pregunta deje de ser estadística.",
  },
];

export function renderQuestionComparison() {
  const books = (count) =>
    `<svg viewBox="0 0 150 55" aria-hidden="true"><path d="M5 45h140" stroke="#164e63" stroke-width="4"/>${Array.from({ length: count }, (_, i) => `<rect x="${10 + i * 12}" y="12" width="9" height="32" rx="2" fill="${i % 2 ? "#0f766e" : "#0369a1"}"/>`).join("")}</svg>`;
  return `<div class="question-model-grid">
    <article class="question-model-card"><h3>${bi("One fixed answer", "Una respuesta fija")}</h3><p>${bi(QUESTION_CASES[0].question, QUESTION_CASES[0].questionEs)}</p><div class="question-shelves"><figure>${books(4)}<figcaption>${bi("This shelf: 4 books", "Este estante: 4 libros")}</figcaption></figure></div><p>${bi("One shelf + one moment → one count. Not statistical.", "Un estante + un momento → una cantidad. No es estadística.")}</p></article>
    <article class="question-model-card"><h3>${bi("A set of answers that can vary", "Un conjunto de respuestas que pueden variar")}</h3><p>${bi(QUESTION_CASES[1].question, QUESTION_CASES[1].questionEs)}</p><div class="question-shelves">${[4, 7, 10].map((n, i) => `<figure>${books(n)}<figcaption>${bi(`Shelf ${String.fromCharCode(65 + i)}: ${n} books`, `Estante ${String.fromCharCode(65 + i)}: ${n} libros`)}</figcaption></figure>`).join("")}</div><p>${bi("Collect a count from each shelf. The counts can vary. Statistical.", "Recopila una cantidad de cada estante. Las cantidades pueden variar. Es estadística.")}</p></article>
  </div>`;
}

export function renderQuestionLab() {
  return `<section class="family-visual-lab" data-family-question-lab data-lesson-model="statistical-questions" aria-labelledby="question_lab_title">
    <p class="visual-lab-kicker"><span class="lang-en">TOUCH &amp; TRY</span><span class="lang-es" lang="es">TOCA Y PRUEBA</span></p>
    <h3 id="question_lab_title">${bi("Question Detective", "Detective de preguntas")}</h3>
    <p>${bi("A statistical question is answered with data and anticipates variation. Read the question, identify what data you would collect, and make your choice before seeing an example.", "Una pregunta estadística se responde con datos y espera variación. Lee la pregunta, identifica qué datos recopilarías y elige antes de ver un ejemplo.")}</p>
    <label for="question_case">${bi("Choose a situation", "Elige una situación")}</label>
    <select id="question_case" data-question-case>${QUESTION_CASES.map((c, i) => `<option value="${i}" data-text-en="${esc(c.label)}" data-text-es="${esc(c.labelEs)}">${esc(c.label)}</option>`).join("")}</select>
    ${QUESTION_CASES.map((c, i) => `<article class="question-model-card" data-question-card="${i}" data-statistical="${c.statistical}"${i ? " hidden" : ""}><h4>${bi(c.question, c.questionEs)}</h4><p>${bi(c.scope, c.scopeEs)}</p><div data-question-result hidden><p class="question-sample">${bi(`Example data: ${c.sample}`, `Datos de ejemplo: ${c.sampleEs}`)}</p><p>${bi(c.reason, c.reasonEs)}</p></div></article>`).join("")}
    <div class="question-choice-row" role="group" aria-label="Classify the question" data-aria-en="Classify the question" data-aria-es="Clasifica la pregunta"><button type="button" class="btn btn-secondary" data-question-choice="true" aria-pressed="false">${bi("Statistical", "Estadística")}</button><button type="button" class="btn btn-secondary" data-question-choice="false" aria-pressed="false">${bi("Not statistical", "No estadística")}</button></div>
    <p data-question-verdict role="status" aria-live="polite" hidden></p>
    <p>${bi("Explain: I would collect ___ from ___. I expect the answers to ___, so this question is ___.", "Explica: Recopilaría ___ de ___. Espero que las respuestas ___, así que esta pregunta es ___.")}</p>
    <noscript><p>${bi("Use the comparison above, then discuss each question on paper.", "Usa la comparación de arriba y luego comenta cada pregunta en papel.")}</p></noscript>
  </section>`;
}

export const QUESTION_MODEL_CSS = `
.question-model-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:16px}
.question-model-card{padding:16px;background:#fff;border:2px solid #cbd5e1;border-radius:14px;min-width:0;color:#12355b}
.question-model-card h3,.question-model-card h4{font-size:20px;line-height:1.4;margin:0 0 12px}
.question-model-card p{font-size:16px;line-height:1.6}
.question-shelves{display:flex;flex-wrap:wrap;gap:12px}.question-shelves figure{flex:1 1 120px;margin:0;min-width:0}
.question-shelves svg{width:100%;height:auto;max-height:70px}.question-shelves figcaption{font-size:16px;text-align:center}
[data-family-question-lab] select{display:block;width:100%;min-height:48px;font:inherit;margin:8px 0 18px;padding:10px;color:#12355b;background:#fff;border:2px solid #64748b;border-radius:9px}
.question-choice-row{display:flex;flex-wrap:wrap;gap:12px;margin:18px 0}.question-choice-row button{min-height:48px;font-size:16px}
.question-choice-row button[aria-pressed=true]{outline:3px solid #0f766e;outline-offset:3px}
.question-choice-row button:focus-visible,[data-family-question-lab] select:focus-visible{outline:3px solid #0369a1;outline-offset:4px}
.question-sample{padding:12px;border-left:4px solid #0f766e;background:#f0fdfa}
[data-question-verdict]{padding:12px;font-size:17px;font-weight:700;background:#f0fdfa;border-radius:10px}
`;

export const QUESTION_MODEL_JS = String.raw`
(function(){
  function init(lab){
    if(lab.dataset.questionReady)return;
    lab.dataset.questionReady='1';
    var select=lab.querySelector('[data-question-case]'),cards=Array.from(lab.querySelectorAll('[data-question-card]')),buttons=Array.from(lab.querySelectorAll('[data-question-choice]')),verdict=lab.querySelector('[data-question-verdict]');
    function reset(){cards.forEach(function(card){card.hidden=card.dataset.questionCard!==select.value;card.querySelector('[data-question-result]').hidden=true;});buttons.forEach(function(btn){btn.setAttribute('aria-pressed','false');});verdict.hidden=true;verdict.textContent='';}
    select.addEventListener('change',reset);
    buttons.forEach(function(btn){btn.addEventListener('click',function(){var card=cards.find(function(c){return c.dataset.questionCard===select.value;});if(!card)return;var correct=btn.dataset.questionChoice===card.dataset.statistical;buttons.forEach(function(b){b.setAttribute('aria-pressed',b===btn?'true':'false');});verdict.innerHTML=correct?'<span class="lang-en">Yes. Explain why using the data and expected variation.</span><span class="lang-es" lang="es">Sí. Explica por qué usando los datos y la variación esperada.</span>':'<span class="lang-en">Reconsider: what data does the question ask for, and can those answers vary?</span><span class="lang-es" lang="es">Reconsidera: ¿qué datos pide la pregunta y pueden variar esas respuestas?</span>';verdict.hidden=false;card.querySelector('[data-question-result]').hidden=false;});});
    reset();
  }
  function initAll(){document.querySelectorAll('[data-family-question-lab]').forEach(init);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAll);else initAll();
})();
`;
