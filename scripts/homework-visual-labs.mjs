/**
 * Visual-first, concept-specific manipulatives for family homework.
 * Generated pages keep a static SVG fallback and progressively enhance it with
 * accessible range controls. No answer-key data is exposed to students.
 */

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const LABS = {
  exponents: {
    name: "Exponent Builder",
    nameEs: "Constructor de exponentes",
    prompt: "Change the base and exponent. Watch repeated multiplication grow.",
    promptEs: "Cambia la base y el exponente. Observa cómo crece la multiplicación repetida.",
    controls: [
      ["base", "Base", "Base", 2, 5, 2],
      ["power", "Exponent", "Exponente", 1, 4, 3],
    ],
  },
  ratios: {
    name: "Ratio Mixer",
    nameEs: "Mezclador de razones",
    prompt: "Build equivalent batches and compare the two colors.",
    promptEs: "Construye lotes equivalentes y compara los dos colores.",
    controls: [
      ["batches", "Batches", "Lotes", 1, 5, 2],
      ["blue", "Blue per batch", "Azules por lote", 1, 4, 2],
    ],
  },
  equations: {
    name: "Balance the Equation",
    nameEs: "Equilibra la ecuación",
    prompt: "Change the unknown and the added blocks. Both pans stay equal.",
    promptEs: "Cambia la incógnita y los bloques añadidos. Ambos lados quedan iguales.",
    controls: [
      ["unknown", "Unknown x", "Incógnita x", 1, 12, 5],
      ["add", "Add to x", "Suma a x", 1, 10, 3],
    ],
  },
  inequalities: {
    name: "Inequality Number Line",
    nameEs: "Recta de desigualdades",
    prompt: "Move the boundary and test a point in the shaded solution set.",
    promptEs: "Mueve el límite y prueba un punto en el conjunto sombreado.",
    controls: [
      ["boundary", "Boundary", "Límite", -5, 5, 1],
      ["test", "Test point", "Punto de prueba", -5, 5, 3],
    ],
  },
  properties: {
    name: "Distributive Array",
    nameEs: "Arreglo distributivo",
    prompt: "Split one array into two parts without changing its total area.",
    promptEs: "Divide un arreglo en dos partes sin cambiar su área total.",
    controls: [
      ["rows", "Rows", "Filas", 1, 6, 3],
      ["left", "Left columns", "Columnas izquierdas", 1, 6, 2],
      ["right", "Right columns", "Columnas derechas", 1, 6, 3],
    ],
  },
  expressions: {
    name: "Algebra Tile Builder",
    nameEs: "Constructor de fichas algebraicas",
    prompt: "Change the coefficient and constant to build an expression.",
    promptEs: "Cambia el coeficiente y la constante para construir una expresión.",
    controls: [
      ["coefficient", "x tiles", "Fichas x", 1, 6, 3],
      ["constant", "Unit tiles", "Fichas de unidad", 0, 10, 5],
    ],
  },
  area: {
    name: "Area Grid",
    nameEs: "Cuadrícula de área",
    prompt: "Resize the rectangle. Count rows and columns of square units.",
    promptEs: "Cambia el rectángulo. Cuenta filas y columnas de unidades cuadradas.",
    controls: [
      ["width", "Width", "Ancho", 1, 10, 6],
      ["height", "Height", "Altura", 1, 7, 4],
    ],
  },
  volume: {
    name: "Volume Layer Builder",
    nameEs: "Constructor de capas de volumen",
    prompt: "Resize a prism and see how many unit cubes fill each layer.",
    promptEs: "Cambia un prisma y observa cuántos cubos llenan cada capa.",
    controls: [
      ["length", "Length", "Largo", 1, 6, 4],
      ["width", "Width", "Ancho", 1, 5, 3],
      ["height", "Layers", "Capas", 1, 5, 2],
    ],
  },
  "surface-area": {
    name: "Prism Net Studio",
    nameEs: "Estudio de redes de prismas",
    prompt: "Resize the prism. Watch all six faces change in its net.",
    promptEs: "Cambia el prisma. Observa cómo cambian las seis caras de su red.",
    controls: [
      ["length", "Length", "Largo", 1, 6, 4],
      ["width", "Width", "Ancho", 1, 5, 3],
      ["height", "Height", "Altura", 1, 5, 2],
    ],
  },
  statistics: {
    name: "Data Shape Studio",
    nameEs: "Estudio de forma de datos",
    prompt: "Change the center and spread. Watch the dot plot reshape.",
    promptEs: "Cambia el centro y la dispersión. Observa cómo cambia el diagrama.",
    controls: [
      ["center", "Center", "Centro", 3, 8, 5],
      ["spread", "Spread", "Dispersión", 1, 4, 2],
    ],
  },
  "coordinate-plane": {
    name: "Coordinate Mover",
    nameEs: "Punto móvil de coordenadas",
    prompt: "Move x and y. Track the ordered pair across the four quadrants.",
    promptEs: "Mueve x y y. Sigue el par ordenado por los cuatro cuadrantes.",
    controls: [
      ["x", "x-coordinate", "Coordenada x", -5, 5, 3],
      ["y", "y-coordinate", "Coordenada y", -5, 5, 2],
    ],
  },
  "number-line": {
    name: "Integer Number Line",
    nameEs: "Recta de enteros",
    prompt: "Move the point and change its distance from zero.",
    promptEs: "Mueve el punto y cambia su distancia desde cero.",
    controls: [
      ["point", "Point", "Punto", -10, 10, -4],
      ["jump", "Jump", "Salto", -5, 5, 3],
    ],
  },
  fractions: {
    name: "Fraction Bar Builder",
    nameEs: "Constructor de barras de fracciones",
    prompt: "Change the numerator and denominator. Watch the part-whole model.",
    promptEs: "Cambia el numerador y el denominador. Observa el modelo parte-todo.",
    controls: [
      ["numerator", "Numerator", "Numerador", 0, 12, 3],
      ["denominator", "Denominator", "Denominador", 2, 12, 4],
    ],
  },
  division: {
    name: "Long Division Algorithm Lab",
    nameEs: "Laboratorio del algoritmo de división larga",
    prompt:
      "Follow the standard algorithm: Divide (D) → Multiply (M) → Subtract (S) → Bring down (B) to find the quotient.",
    promptEs:
      "Sigue el algoritmo estándar: Divide (D) → Multiplica (M) → Resta (S) → Baja (B) para hallar el cociente.",
    controls: [
      ["dividend", "Dividend (Total)", "Dividendo (Total)", 100, 2400, 1344],
      ["divisor", "Divisor (Groups)", "Divisor (Grupos)", 2, 25, 12],
      ["step", "Algorithm Step (DMSB)", "Paso del algoritmo (DMSB)", 1, 4, 4],
    ],
  },
  decimals: {
    name: "Hundred Grid",
    nameEs: "Cuadrícula de cien",
    prompt: "Shade hundredths and connect the picture, decimal, and percent.",
    promptEs: "Sombrea centésimos y conecta el dibujo, decimal y porcentaje.",
    controls: [["hundredths", "Hundredths", "Centésimos", 0, 100, 37]],
  },
  factors: {
    name: "Factor Array Lab",
    nameEs: "Laboratorio de arreglos de factores",
    prompt: "Arrange dots in equal rows. A complete rectangle shows a factor pair.",
    promptEs: "Ordena puntos en filas iguales. Un rectángulo completo muestra un par de factores.",
    controls: [
      ["number", "Number of dots", "Número de puntos", 2, 36, 24],
      ["columns", "Columns", "Columnas", 1, 12, 6],
    ],
  },
  fallback: {
    name: "Math Model Builder",
    nameEs: "Constructor de modelos matemáticos",
    prompt: "Change the groups and items. Explain what stays the same.",
    promptEs: "Cambia los grupos y los objetos. Explica qué permanece igual.",
    controls: [
      ["groups", "Groups", "Grupos", 1, 6, 3],
      ["items", "Items per group", "Objetos por grupo", 1, 8, 4],
    ],
  },
};

function initialPreview() {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const x = 124 + (i % 6) * 48;
    const y = 74 + Math.floor(i / 6) * 58;
    const color = i % 2 ? "#ff775f" : "#0b8f87";
    return `<circle cx="${x}" cy="${y}" r="16" fill="${color}"/><circle cx="${x - 5}" cy="${y - 4}" r="3" fill="#fff" opacity=".85"/>`;
  }).join("");
  return `<svg viewBox="0 0 520 220" role="img" aria-label="Interactive math model preview"><rect width="520" height="220" rx="24" fill="#f8fbf2"/><path d="M28 38H492M28 82H492M28 126H492M28 170H492" stroke="#d7e7df"/><path d="M76 20V200M124 20V200M172 20V200M220 20V200M268 20V200M316 20V200M364 20V200M412 20V200M460 20V200" stroke="#d7e7df"/>${dots}<path d="M84 190h352" stroke="#173a5e" stroke-width="5" stroke-linecap="round"/><text x="260" y="210" text-anchor="middle" font-size="14" font-weight="800" fill="#173a5e">Move a slider to change the math</text></svg>`;
}

function renderSharedLessonModel(topic, config, lessonModel) {
  const kind = lessonModel.kind || "interactive model";
  const isFactorTree = kind === "factor-tree" || kind === "factor-tree-lab";
  const modelName =
    lessonModel.title || (isFactorTree ? "Factor Tree Builder" : "Interactive Lesson Model");
  const modelNameEs = isFactorTree
    ? "Constructor de árboles de factores"
    : "Modelo interactivo de la lección";
  const prompt = isFactorTree
    ? "Enter two factors for each composite circle. Keep splitting until every leaf is prime."
    : "Use the same interactive model from the lesson. Change it, notice the pattern, and explain what the model shows.";
  const promptEs = isFactorTree
    ? "Escribe dos factores para cada círculo compuesto. Sigue dividiendo hasta que cada hoja sea prima."
    : "Usa el mismo modelo interactivo de la lección. Cámbialo, observa el patrón y explica lo que muestra.";
  const idea =
    config.launch?.conceptIntro?.keyIdea ||
    config.explore?.conceptIntro?.keyIdea ||
    config.contentObjective ||
    config.title;

  return `<section class="family-visual-lab" data-visual-lab="${esc(topic)}" data-lesson-model="${esc(kind)}" aria-labelledby="visual_lab_title">
    <div class="visual-lab-heading">
      <div><span class="visual-lab-kicker"><span class="lang-en">TOUCH &amp; TRY</span><span class="lang-es" lang="es">TOCA Y PRUEBA</span></span>
      <h2 id="visual_lab_title"><span aria-hidden="true">${isFactorTree ? "🌳" : "🖐️"}</span> <span class="lang-en">${esc(modelName)}</span><span class="lang-es" lang="es">${esc(modelNameEs)}</span></h2></div>
      <p><span class="lang-en">${esc(prompt)}</span><span class="lang-es" lang="es">${esc(promptEs)}</span></p>
    </div>
    <div class="visual-lab-stage" data-lesson-model-host>${lessonModel.html}</div>
    <div class="visual-representation-grid" aria-label="Three ways to understand the lesson model">
      <article class="visual-representation-card visual-representation-model"><span class="representation-number">1</span><h3><span class="lang-en">Touch and change</span><span class="lang-es" lang="es">Toca y cambia</span></h3><p><span class="lang-en">${isFactorTree ? "Choose two factors that multiply to the number in the circle." : "Move, type, tap, or drag in the model. Watch what changes."}</span><span class="lang-es" lang="es">${isFactorTree ? "Elige dos factores cuyo producto sea el número del círculo." : "Mueve, escribe, toca o arrastra en el modelo. Observa qué cambia."}</span></p></article>
      <article class="visual-representation-card visual-representation-math"><span class="representation-number">2</span><h3><span class="lang-en">Write the math</span><span class="lang-es" lang="es">Escribe las matemáticas</span></h3><p><span class="lang-en">Record one equation, value, or relationship you can see.</span><span class="lang-es" lang="es">Escribe una ecuación, un valor o una relación que puedas ver.</span></p></article>
      <article class="visual-representation-card visual-representation-words"><span class="representation-number">3</span><h3><span class="lang-en">Explain the model</span><span class="lang-es" lang="es">Explica el modelo</span></h3><p><span class="lang-en">I notice ___ changes when ___ changes. This shows ___.</span><span class="lang-es" lang="es">Noto que ___ cambia cuando ___ cambia. Esto muestra ___.</span></p><details><summary><span class="lang-en">Lesson connection</span><span class="lang-es" lang="es">Conexión con la lección</span></summary><p class="visual-source-idea">${esc(idea)}</p></details></article>
    </div>
  </section>`;
}

export function renderVisualMathLab(topic, config, lessonModel = null) {
  if (lessonModel?.html) return renderSharedLessonModel(topic, config, lessonModel);
  const lab = LABS[topic] || LABS.fallback;
  const controls = lab.controls
    .map(
      ([
        key,
        en,
        es,
        min,
        max,
        value,
      ]) => `<label class="visual-lab-control" for="visual_${esc(key)}">
        <span class="visual-lab-control-label"><span class="lang-en">${esc(en)}</span><span class="lang-es" lang="es">${esc(es)}</span> <output data-lab-output="${esc(key)}">${value}</output></span>
        <input id="visual_${esc(key)}" type="range" min="${min}" max="${max}" value="${value}" step="1" data-lab-input="${esc(key)}" />
      </label>`,
    )
    .join("");
  const idea =
    config.launch?.conceptIntro?.keyIdea ||
    config.explore?.conceptIntro?.keyIdea ||
    config.contentObjective ||
    config.title ||
    "Explain what changes and what stays the same.";

  return `<section class="family-visual-lab" data-visual-lab="${esc(topic)}" aria-labelledby="visual_lab_title">
    <div class="visual-lab-heading">
      <div><span class="visual-lab-kicker"><span class="lang-en">TOUCH &amp; TRY</span><span class="lang-es" lang="es">TOCA Y PRUEBA</span></span>
      <h2 id="visual_lab_title"><span aria-hidden="true">🖐️</span> <span class="lang-en">${esc(lab.name)}</span><span class="lang-es" lang="es">${esc(lab.nameEs)}</span></h2></div>
      <p><span class="lang-en">${esc(lab.prompt)}</span><span class="lang-es" lang="es">${esc(lab.promptEs)}</span></p>
    </div>
    <div class="visual-lab-layout">
      <div class="visual-lab-canvas-wrap">
        <div class="visual-lab-stage" data-lab-stage>${initialPreview()}</div>
        <p class="visual-lab-status" data-lab-status role="status" aria-live="polite"></p>
      </div>
      <div class="visual-lab-controls" aria-label="Interactive math controls">
        ${controls}
        <div class="visual-lab-actions">
          <button type="button" class="visual-lab-button" data-lab-random><span class="lang-en">🎲 Try another</span><span class="lang-es" lang="es">🎲 Prueba otro</span></button>
          <button type="button" class="visual-lab-button visual-lab-button-quiet" data-lab-reset><span class="lang-en">↺ Reset</span><span class="lang-es" lang="es">↺ Reiniciar</span></button>
        </div>
      </div>
    </div>
    <div class="visual-representation-grid" aria-label="Three ways to understand the math">
      <article class="visual-representation-card visual-representation-model"><span class="representation-number">1</span><h3><span class="lang-en">Picture it</span><span class="lang-es" lang="es">Dibújalo</span></h3><div class="mini-model" data-lab-mini aria-hidden="true"></div></article>
      <article class="visual-representation-card visual-representation-math"><span class="representation-number">2</span><h3><span class="lang-en">Write the math</span><span class="lang-es" lang="es">Escribe las matemáticas</span></h3><p data-lab-equation>—</p></article>
      <article class="visual-representation-card visual-representation-words"><span class="representation-number">3</span><h3><span class="lang-en">Say what you notice</span><span class="lang-es" lang="es">Di lo que notas</span></h3><p data-lab-observation>—</p><details><summary><span class="lang-en">Sentence frame</span><span class="lang-es" lang="es">Marco de oración</span></summary><p><span class="lang-en">I notice ___ changes when ___ changes.</span><span class="lang-es" lang="es">Noto que ___ cambia cuando ___ cambia.</span></p><p class="visual-source-idea">${esc(idea)}</p></details></article>
    </div>
  </section>`;
}

export const VISUAL_LABS_CSS = String.raw`
.family-visual-lab{--lab-ink:#173a5e;--lab-teal:#0b8f87;--lab-coral:#ff775f;--lab-sun:#f6c94c;margin:26px 0;padding:clamp(18px,3vw,30px);border:3px solid var(--lab-ink);border-radius:28px;background:#fffdf5;box-shadow:8px 8px 0 var(--lab-ink);color:var(--lab-ink)}
.visual-lab-heading{display:grid;grid-template-columns:minmax(240px,.85fr) minmax(260px,1.15fr);gap:20px;align-items:end;margin-bottom:20px}.visual-lab-heading h2{margin:6px 0 0;font-size:clamp(24px,4vw,38px);line-height:1.05}.visual-lab-heading p{margin:0;padding:14px 16px;border-left:5px solid var(--lab-sun);background:#fff8d9;font-size:17px;font-weight:700;line-height:1.45}.visual-lab-kicker{display:inline-flex;padding:5px 10px;border-radius:999px;background:var(--lab-ink);color:#fff;font-size:12px;font-weight:800;letter-spacing:.12em}.visual-lab-kicker .lang-en,.visual-lab-kicker .lang-es{color:inherit}
.visual-lab-layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(230px,.8fr);gap:18px;align-items:stretch}.visual-lab-canvas-wrap{min-width:0;padding:12px;border-radius:22px;background-color:#eef8f4;background-image:linear-gradient(#cee3dc 1px,transparent 1px),linear-gradient(90deg,#cee3dc 1px,transparent 1px);background-size:24px 24px;border:2px solid var(--lab-ink)}.visual-lab-stage{display:grid;place-items:center;min-height:280px}.visual-lab-stage svg{display:block;width:100%;max-height:320px;overflow:visible}.visual-lab-status{min-height:26px;margin:5px 8px 0;padding:7px 10px;border-radius:10px;background:#fff;font-weight:800;text-align:center}
.visual-lab-controls{display:flex;flex-direction:column;gap:14px;padding:18px;border-radius:22px;background:var(--lab-ink);color:#fff}.visual-lab-control{display:grid;gap:7px;font-weight:800}.visual-lab-control-label{display:flex;justify-content:space-between;gap:10px;align-items:center}.visual-lab-control output{min-width:38px;padding:3px 8px;border-radius:8px;background:var(--lab-sun);color:#102f4e;text-align:center;font-size:18px}.visual-lab-control input[type=range]{width:100%;min-height:28px;accent-color:var(--lab-coral);cursor:pointer}.visual-lab-control input[type=range]:focus-visible{outline:4px solid #fff;outline-offset:4px}.visual-lab-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:auto}.visual-lab-button{min-height:48px;border:2px solid #fff;border-radius:13px;background:var(--lab-coral);color:#182f48;font:inherit;font-weight:800;cursor:pointer}.visual-lab-button-quiet{background:#fff}.visual-lab-button:hover{transform:translateY(-2px)}.visual-lab-button:focus-visible{outline:4px solid var(--lab-sun);outline-offset:3px}
.visual-representation-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}.visual-representation-card{position:relative;min-height:150px;padding:18px 16px 15px;border:2px solid var(--lab-ink);border-radius:18px;background:#fff}.visual-representation-card h3{margin:0 0 10px;padding-left:30px;font-size:17px}.visual-representation-card p{margin:7px 0;font-size:16px;line-height:1.4}.representation-number{position:absolute;top:12px;left:12px;display:grid;width:27px;height:27px;place-items:center;border-radius:50%;background:var(--lab-ink);color:#fff;font-weight:800}.visual-representation-model{background:#dff5ee}.visual-representation-math{background:#fff2c2}.visual-representation-words{background:#ffe4dd}.visual-representation-math [data-lab-equation]{font-size:clamp(22px,3vw,32px);font-weight:800;text-align:center}.mini-model{display:flex;flex-wrap:wrap;gap:7px;align-content:center;min-height:76px;padding:8px}.mini-dot{width:18px;height:18px;border:2px solid var(--lab-ink);border-radius:50%;background:var(--lab-teal)}.visual-representation-card details{margin-top:10px}.visual-representation-card summary{cursor:pointer;font-weight:800;text-decoration:underline}.visual-source-idea{font-size:13px!important;color:#344f69}
.lab-label{font:800 16px "Outfit",sans-serif;fill:#173a5e}.lab-small{font:700 12px "Hanken Grotesk",sans-serif;fill:#173a5e}.lab-big{font:800 24px "Outfit",sans-serif;fill:#173a5e}.lab-grid{stroke:#bcd7d0;stroke-width:1}.lab-axis{stroke:#173a5e;stroke-width:3}.lab-accent{fill:#ff775f;stroke:#173a5e;stroke-width:2}.lab-teal{fill:#0b8f87;stroke:#173a5e;stroke-width:2}.lab-sun{fill:#f6c94c;stroke:#173a5e;stroke-width:2}
[data-lesson-model-host]{display:block;min-height:300px;padding:16px;border:2px solid var(--lab-ink);border-radius:22px;background-color:#eef8f4;background-image:linear-gradient(#cee3dc 1px,transparent 1px),linear-gradient(90deg,#cee3dc 1px,transparent 1px);background-size:24px 24px;overflow:auto}[data-lesson-model-host]>.interactive-visual{width:100%;margin:0!important}[data-lesson-model-host] .ftb-wrap,[data-lesson-model-host] .ftlab{max-width:760px}[data-lesson-model-host] input,[data-lesson-model-host] button{font-size:max(16px,1em)}[data-lesson-model] .visual-representation-card p{font-weight:700}
@media(max-width:760px){.family-visual-lab{border-radius:20px;box-shadow:5px 5px 0 var(--lab-ink)}.visual-lab-heading,.visual-lab-layout{grid-template-columns:1fr}.visual-lab-stage{min-height:230px}.visual-representation-grid{grid-template-columns:1fr}.visual-representation-card{min-height:120px}.visual-lab-actions{grid-template-columns:1fr 1fr}}
@media(prefers-reduced-motion:reduce){.visual-lab-button{transition:none!important}.visual-lab-button:hover{transform:none}}
@media print{.family-visual-lab{box-shadow:none;break-inside:avoid}.visual-lab-controls,.visual-lab-actions{display:none}.visual-lab-layout{grid-template-columns:1fr}.visual-representation-grid{grid-template-columns:repeat(3,1fr)}}
`;

export const VISUAL_LABS_JS = String.raw`
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function svgWrap(body, label) { return '<svg viewBox="0 0 560 280" role="img" aria-label="' + label + '"><rect x="8" y="8" width="544" height="264" rx="24" fill="#f8fbf2" stroke="#173a5e" stroke-width="3"/>' + body + '</svg>'; }
  function text(x,y,value,cls,anchor){return '<text x="'+x+'" y="'+y+'" class="'+(cls||'lab-label')+'" text-anchor="'+(anchor||'start')+'">'+value+'</text>';}
  function circle(x,y,r,cls){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" class="'+(cls||'lab-teal')+'"/>';}
  function rect(x,y,w,h,cls,rx){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(rx||0)+'" class="'+(cls||'lab-teal')+'"/>';}
  function line(x1,y1,x2,y2,cls){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="'+(cls||'lab-axis')+'"/>';}
  function gridLines(x,y,cols,rows,cell){var s='';for(var c=0;c<=cols;c++)s+=line(x+c*cell,y,x+c*cell,y+rows*cell,'lab-grid');for(var r=0;r<=rows;r++)s+=line(x,y+r*cell,x+cols*cell,y+r*cell,'lab-grid');return s;}
  function dots(count,cols,startX,startY,gap){var s='';for(var i=0;i<count;i++)s+=circle(startX+(i%cols)*gap,startY+Math.floor(i/cols)*gap,Math.min(12,gap*.28),i%2?'lab-accent':'lab-teal');return s;}
  function result(svg,equation,observation,status,mini){return{svg:svg,equation:equation,observation:observation,status:status,mini:mini||Math.min(18,Math.max(3,parseInt(equation,10)||8))};}
  function render(topic,v){
    var body='',eq='',obs='',status='',mini=8;
    if(topic==='exponents'){var total=Math.pow(v.base,v.power);for(var i=0;i<v.power;i++){body+=rect(70+i*105,92,72,72,i%2?'lab-accent':'lab-teal',14)+text(106+i*105,138,String(v.base),'lab-big','middle');if(i<v.power-1)body+=text(160+i*105,138,'×','lab-big','middle');}body+=text(280,220,'Multiply '+v.base+' a total of '+v.power+' times','lab-label','middle');eq=Array(v.power).fill(v.base).join(' × ')+' = '+total;obs='The exponent tells how many equal factors to use.';status=v.base+' to the power of '+v.power+' equals '+total;mini=v.power;}
    else if(topic==='ratios'){var a=v.batches*v.blue,b=v.batches*3;body+=dots(a,v.blue,90,72,36)+dots(b,3,350,72,36)+text(150,224,a+' blue','lab-big','middle')+text(410,224,b+' coral','lab-big','middle')+text(280,46,v.batches+' equivalent batch'+(v.batches===1?'':'es'),'lab-label','middle');eq=a+' : '+b+' = '+v.blue+' : 3';obs='Both parts are multiplied by the same number of batches.';status='The ratio is '+a+' to '+b;mini=Math.min(18,a+b);}
    else if(topic==='equations'){var totalEq=v.unknown+v.add;body+=line(90,105,470,105)+line(280,105,280,235)+rect(235,235,90,18,'lab-sun',6)+rect(80,125,180,70,'lab-teal',14)+rect(300,125,180,70,'lab-accent',14)+text(170,167,'x  +  '+v.add,'lab-big','middle')+text(390,167,String(totalEq),'lab-big','middle')+text(280,58,'Both sides have the same value','lab-label','middle');eq='x + '+v.add+' = '+totalEq+'  →  x = '+v.unknown;obs='Removing the same amount from both sides keeps the scale balanced.';status='The unknown value is '+v.unknown;mini=v.add;}
    else if(topic==='inequalities'){var start=70,step=42,y=145;body+=line(start,y,start+10*step,y);for(var ni=-5;ni<=5;ni++){var nx=start+(ni+5)*step;body+=line(nx,y-8,nx,y+8,'lab-axis')+text(nx,y+30,String(ni),'lab-small','middle');}var bx=start+(v.boundary+5)*step;body+='<rect x="'+bx+'" y="125" width="'+(start+10*step-bx)+'" height="40" fill="#0b8f87" opacity=".28"/>'+circle(bx,y,11,'lab-accent');var tx=start+(v.test+5)*step;body+=circle(tx,82,12,v.test>v.boundary?'lab-teal':'lab-sun')+line(tx,94,tx,126,'lab-axis')+text(280,52,'Shaded values are greater than '+v.boundary,'lab-label','middle');eq='x > '+v.boundary;obs=v.test+(v.test>v.boundary?' is':' is not')+' in the shaded solution set.';status='Test point '+v.test+(v.test>v.boundary?' works':' does not work');mini=Math.abs(v.test-v.boundary)+2;}
    else if(topic==='properties'){var cols=v.left+v.right,cell=Math.min(34,300/cols),gx=130,gy=58;body+=gridLines(gx,gy,cols,v.rows,cell);body+='<rect x="'+gx+'" y="'+gy+'" width="'+(v.left*cell)+'" height="'+(v.rows*cell)+'" fill="#0b8f87" opacity=".55"/><rect x="'+(gx+v.left*cell)+'" y="'+gy+'" width="'+(v.right*cell)+'" height="'+(v.rows*cell)+'" fill="#ff775f" opacity=".55"/>';body+=text(280,245,v.rows+' rows split into '+v.left+' and '+v.right+' columns','lab-label','middle');eq=v.rows+'('+v.left+' + '+v.right+') = '+(v.rows*v.left)+' + '+(v.rows*v.right)+' = '+(v.rows*cols);obs='Splitting the array does not change its total number of squares.';status='Total area: '+(v.rows*cols)+' square units';mini=Math.min(18,v.rows*cols);}
    else if(topic==='expressions'){for(var xt=0;xt<v.coefficient;xt++)body+=rect(55+xt*76,65,54,120,xt%2?'lab-accent':'lab-teal',9)+text(82+xt*76,135,'x','lab-big','middle');body+=dots(v.constant,5,135,225,33)+text(280,42,'Algebra tiles','lab-label','middle');eq=v.coefficient+'x + '+v.constant;obs='Long tiles represent x; small tiles represent units.';status=v.coefficient+' variable tiles and '+v.constant+' unit tiles';mini=v.coefficient+v.constant;}
    else if(topic==='area'){var cellA=Math.min(30,300/v.width,150/v.height),ax=130,ay=52;body+=gridLines(ax,ay,v.width,v.height,cellA)+'<rect x="'+ax+'" y="'+ay+'" width="'+(v.width*cellA)+'" height="'+(v.height*cellA)+'" fill="#0b8f87" opacity=".38"/>';body+=text(ax+v.width*cellA/2,ay+v.height*cellA+35,v.width+' columns','lab-label','middle')+text(75,ay+v.height*cellA/2,v.height+' rows','lab-label','middle');eq=v.width+' × '+v.height+' = '+(v.width*v.height)+' square units';obs='Area counts every square inside the shape.';status='Area: '+(v.width*v.height)+' square units';mini=Math.min(18,v.width*v.height);}
    else if(topic==='volume'){var layer=v.length*v.width,totalV=layer*v.height;for(var z=0;z<v.height;z++){var ox=105+z*18,oy=165-z*30;body+='<polygon points="'+ox+','+oy+' '+(ox+v.length*38)+','+oy+' '+(ox+v.length*38+v.width*18)+','+(oy-v.width*18)+' '+(ox+v.width*18)+','+(oy-v.width*18)+'" fill="'+(z%2?'#ff775f':'#0b8f87')+'" opacity=".52" stroke="#173a5e" stroke-width="2"/>';}body+=text(280,45,v.height+' layer'+(v.height===1?'':'s')+' · '+layer+' cubes each','lab-label','middle')+text(280,242,totalV+' unit cubes','lab-big','middle');eq=v.length+' × '+v.width+' × '+v.height+' = '+totalV+' cubic units';obs='Each layer has length × width cubes.';status='Volume: '+totalV+' cubic units';mini=Math.min(18,totalV);}
    else if(topic==='surface-area'){var scale=18,l=v.length*scale,w=v.width*scale,h=v.height*scale,cx=280,cy=135;body+=rect(cx-l/2,cy-h/2,l,h,'lab-teal')+rect(cx-l/2,cy-h/2-w,l,w,'lab-sun')+rect(cx-l/2,cy+h/2,l,w,'lab-sun')+rect(cx-l/2-w,cy-h/2,w,h,'lab-accent')+rect(cx+l/2,cy-h/2,w,h,'lab-accent')+rect(cx-l/2,cy+h/2+w,l,w,'lab-teal');var sa=2*(v.length*v.width+v.length*v.height+v.width*v.height);body+=text(280,45,'Six faces unfold into one net','lab-label','middle')+text(280,255,'Add every face','lab-label','middle');eq='2('+v.length+'×'+v.width+' + '+v.length+'×'+v.height+' + '+v.width+'×'+v.height+') = '+sa;obs='Opposite faces have matching dimensions and areas.';status='Surface area: '+sa+' square units';mini=6;}
    else if(topic==='statistics'){var vals=[v.center-v.spread,v.center-1,v.center,v.center,v.center+1,v.center+v.spread];var counts={},dataMin=Math.min.apply(null,vals)-1,dataMax=Math.max.apply(null,vals)+1,dataSpan=dataMax-dataMin;vals.forEach(function(n){counts[n]=(counts[n]||0)+1;});body+=line(70,220,490,220);for(var sn=dataMin;sn<=dataMax;sn++){var sx=70+(sn-dataMin)*(420/dataSpan);body+=line(sx,212,sx,228,'lab-axis')+text(sx,250,String(sn),'lab-small','middle');}Object.keys(counts).forEach(function(k){for(var di=0;di<counts[k];di++)body+=circle(70+(Number(k)-dataMin)*(420/dataSpan),195-di*32,11,Number(k)===v.center?'lab-accent':'lab-teal');});body+=text(280,45,'Data values: '+vals.join(', '),'lab-label','middle');eq='center = '+v.center+' · range = '+(Math.max.apply(null,vals)-Math.min.apply(null,vals));obs='A larger spread moves the outside dots farther from the center.';status='Six data points centered near '+v.center;mini=6;}
    else if(topic==='coordinate-plane'){var ox=280,oy=140,st=22;for(var gi=-5;gi<=5;gi++){body+=line(ox+gi*st,30,ox+gi*st,250,'lab-grid')+line(170,oy+gi*st,390,oy+gi*st,'lab-grid');}body+=line(160,oy,400,oy)+line(ox,20,ox,260)+circle(ox+v.x*st,oy-v.y*st,13,'lab-accent')+line(ox,oy-v.y*st,ox+v.x*st,oy-v.y*st,'lab-grid')+line(ox+v.x*st,oy,ox+v.x*st,oy-v.y*st,'lab-grid')+text(ox+v.x*st+18,oy-v.y*st-10,'('+v.x+', '+v.y+')','lab-label');eq='(x, y) = ('+v.x+', '+v.y+')';obs='Move across for x first, then move up or down for y.';status='Point at '+v.x+', '+v.y;mini=Math.abs(v.x)+Math.abs(v.y)+2;}
    else if(topic==='number-line'){var nstart=70,nstep=14,ny=150;body+=line(nstart,ny,nstart+30*nstep,ny);for(var nn=-15;nn<=15;nn++){var xx=nstart+(nn+15)*nstep;body+=line(xx,ny-7,xx,ny+7,'lab-axis');if(nn%5===0)body+=text(xx,ny+28,String(nn),'lab-small','middle');}var end=v.point+v.jump,p1=nstart+(v.point+15)*nstep,p2=nstart+(end+15)*nstep;body+=circle(p1,ny,12,'lab-teal')+circle(p2,ny,12,'lab-accent')+'<path d="M'+p1+' 115 Q'+((p1+p2)/2)+' 68 '+p2+' 115" fill="none" stroke="#ff775f" stroke-width="5"/>';body+=text(280,48,'Start '+v.point+' · jump '+v.jump,'lab-label','middle');eq=v.point+(v.jump>=0?' + ':' − ')+Math.abs(v.jump)+' = '+end;obs='Positive jumps move right; negative jumps move left.';status='The jump lands on '+end;mini=Math.abs(v.jump)+3;}
    else if(topic==='fractions'){var den=v.denominator,num=clamp(v.numerator,0,12),barCount=Math.max(1,Math.ceil(num/den)),bw=380/den,barH=Math.min(38,150/barCount),barGap=8,fy=64;for(var fb=0;fb<barCount;fb++){for(var fi=0;fi<den;fi++){var part=fb*den+fi;body+=rect(90+fi*bw,fy+fb*(barH+barGap),bw,barH,part<num?'lab-teal':'lab-sun',0);}}body+=text(280,42,num+' shaded parts · '+den+' equal parts per whole','lab-label','middle')+text(280,250,num+'/'+den,'lab-big','middle');eq=num+' / '+den;obs='The denominator sets equal parts in each whole; the numerator counts all shaded parts.';status=num+' parts are shaded in groups of '+den;mini=Math.min(18,Math.max(den,num));}
    else if(topic==='decimals'){var hv=v.hundredths,cellD=18,dx=190,dy=38;body+=gridLines(dx,dy,10,10,cellD);for(var hi=0;hi<hv;hi++)body+='<rect x="'+(dx+(hi%10)*cellD)+'" y="'+(dy+Math.floor(hi/10)*cellD)+'" width="'+cellD+'" height="'+cellD+'" fill="'+(hi%10===0?'#ff775f':'#0b8f87')+'" opacity=".75"/>';body+=text(110,126,(hv/100).toFixed(2),'lab-big','middle')+text(450,126,hv+'%','lab-big','middle');eq=hv+'/100 = '+(hv/100).toFixed(2)+' = '+hv+'%';obs='Each small square is one hundredth of the whole grid.';status=hv+' hundredths are shaded';mini=Math.min(18,Math.ceil(hv/6));}
    else if(topic==='division'){var dNum=clamp(v.dividend||1344,10,9999),qDiv=clamp(v.divisor||12,1,99),quot=Math.floor(dNum/qDiv),rem=dNum%qDiv,curStep=clamp(v.step||4,1,4);body+=rect(30,30,500,220,'lab-sun',16);body+=text(140,88,String(qDiv),'lab-big','end')+line(150,55,150,102,'lab-axis')+line(150,55,340,55,'lab-axis')+text(165,88,String(dNum),'lab-big','start')+text(165,46,curStep>=1?String(quot):'?','lab-big','start');var stepLetters=['D','M','S','B'],stepLabels=['Divide','Multiply','Subtract','Bring down'],stepNames=['1. D — Divide: determine quotient digit','2. M — Multiply: multiply quotient digit × divisor','3. S — Subtract: find difference (must be < divisor)','4. B — Bring down: bring next digit down and repeat'];for(var si=0;si<4;si++){var px=45+si*118,py=120,isAct=(si+1)===curStep;body+=rect(px,py,110,34,isAct?'lab-accent':(si+1<curStep?'lab-teal':'lab-sun'),8)+circle(px+16,py+17,10,isAct?'lab-sun':'lab-teal')+text(px+16,py+22,stepLetters[si],'lab-small','middle')+text(px+34,py+22,stepLabels[si],'lab-small','start');}body+=text(280,188,stepNames[curStep-1],'lab-label','middle')+text(280,225,dNum+' ÷ '+qDiv+' = '+quot+(rem>0?' R '+rem:''),'lab-big','middle');eq=dNum+' ÷ '+qDiv+' = '+quot+(rem>0?' R '+rem:'');obs='Long division standard algorithm: Divide → Multiply → Subtract → Bring down (DMSB).';status=dNum+' ÷ '+qDiv+' = '+quot+(rem>0?' with remainder '+rem:'')+' · Check: '+qDiv+' × '+quot+(rem>0?' + '+rem:'')+' = '+dNum;mini=4;}
    else{var total=v.groups*v.items;for(var gr=0;gr<v.groups;gr++){body+=rect(45+gr*82,70,66,130,gr%2?'lab-accent':'lab-teal',14)+text(78+gr*82,58,'Group '+(gr+1),'lab-small','middle')+dots(v.items,2,66+gr*82,95,25);}eq=v.groups+' × '+v.items+' = '+total;obs='Equal groups connect a picture to multiplication.';status=total+' items in all';mini=Math.min(18,total);}
    return result(svgWrap(body,status||'Interactive math visual'),eq,obs,status,mini);
  }
  function values(lab){var out={};lab.querySelectorAll('[data-lab-input]').forEach(function(input){out[input.getAttribute('data-lab-input')]=Number(input.value);});return out;}
  function update(lab){var v=values(lab),topic=lab.getAttribute('data-visual-lab')||'fallback',r=render(topic,v);lab.querySelector('[data-lab-stage]').innerHTML=r.svg;lab.querySelector('[data-lab-equation]').textContent=r.equation;lab.querySelector('[data-lab-observation]').textContent=r.observation;lab.querySelector('[data-lab-status]').textContent=r.status;lab.querySelectorAll('[data-lab-output]').forEach(function(o){o.value=v[o.getAttribute('data-lab-output')];o.textContent=v[o.getAttribute('data-lab-output')];});var mini=lab.querySelector('[data-lab-mini]');mini.innerHTML='';for(var i=0;i<r.mini;i++){var dot=document.createElement('span');dot.className='mini-dot';mini.appendChild(dot);}}
  function init(lab){var initial={};lab.querySelectorAll('[data-lab-input]').forEach(function(input){initial[input.getAttribute('data-lab-input')]=input.value;input.addEventListener('input',function(){update(lab);});});lab.querySelector('[data-lab-reset]').addEventListener('click',function(){lab.querySelectorAll('[data-lab-input]').forEach(function(input){input.value=initial[input.getAttribute('data-lab-input')];});update(lab);});lab.querySelector('[data-lab-random]').addEventListener('click',function(){lab.querySelectorAll('[data-lab-input]').forEach(function(input){var min=Number(input.min),max=Number(input.max);input.value=Math.floor(Math.random()*(max-min+1))+min;});update(lab);});update(lab);}
  function initAll(){document.querySelectorAll('[data-visual-lab]').forEach(function(lab){if(lab.getAttribute('data-visual-ready')||lab.querySelector('[data-lesson-model-host]'))return;lab.setAttribute('data-visual-ready','1');init(lab);});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAll);else initAll();
})();
`;
