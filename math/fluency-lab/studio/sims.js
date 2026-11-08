// Concept simulators: change one variable, watch the relationship. Each simulator is pure: `render(state)` returns
// the drawing, a text description and a one-line reading of what the numbers say right now, so the picture,
// the numbers and the words always agree. Sliders are real range inputs, so they work with keyboard and touch.
import { COLORS, L, esc, fmt, gcd, svgWrap, txt } from "./core.js";
import percentFindWhole from "../../../curriculum/learning-labs/shared/models/percent-find-whole.mjs";
import percentTape from "../../../curriculum/learning-labs/shared/models/percent-tape.mjs";
import ratioTapeModel from "../../../curriculum/learning-labs/shared/models/ratio-tape.mjs";
import { renderNetFolder } from "../../../engine/components/net-folder.js";

const out = (svg, alt, read, extra = {}) => ({
  svg: svg.replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
  alt,
  read,
  ...extra,
});
const slider = (key, label, min, max, step, value) => ({ key, label, min, max, step, value });
const hundredGrid = (p, y = 390) => {
  const cell = 16, gap = 2, x0 = 210;
  let body = txt(300, y - 18, `10 × 10 hundred grid · ${p} of 100 squares`, { size: 15 });
  for (let i = 0; i < 100; i += 1) {
    const x = x0 + (i % 10) * (cell + gap), top = y + Math.floor(i / 10) * (cell + gap);
    body += `<rect x="${x}" y="${top}" width="${cell}" height="${cell}" rx="2" fill="${i < p ? COLORS.part : "#fff"}" stroke="${COLORS.ink}" stroke-width="1"/>`;
  }
  return body;
};

const fracEquiv = {
  id: "fracEquiv",
  title: L("Fraction equivalence", "Equivalencia de fracciones"),
  ask: L(
    "Slide the cuts. What changes? What stays the same?",
    "Mueve los cortes. ¿Qué cambia? ¿Qué se queda igual?",
  ),
  init: () => ({ n: 2, d: 3, k: 1 }),
  sliders: (s) => [
    slider("n", L("Shaded pieces", "Partes sombreadas"), 1, s.d, 1, s.n),
    slider("d", L("Pieces in the whole", "Partes del entero"), 2, 12, 1, s.d),
    slider("k", L("Cuts in each piece", "Cortes por parte"), 1, 8, 1, s.k),
  ],
  clamp: (s) => ({ ...s, n: Math.min(s.n, s.d) }),
  render(s) {
    const total = s.d * s.k;
    const shaded = s.n * s.k;
    const w = 440 / total;
    let body = "";
    for (let i = 0; i < total; i += 1)
      body += `<rect x="${60 + i * w}" y="60" width="${w}" height="60" fill="${i < shaded ? COLORS.whole : "#fff"}" fill-opacity=".85" stroke="#fff" stroke-width="2"/>`;
    body += `<rect x="60" y="60" width="440" height="60" fill="none" stroke="${COLORS.ink}" stroke-width="2"/>`;
    for (let j = 1; j < s.d; j += 1)
      body += `<line x1="${60 + (j * 440) / s.d}" x2="${60 + (j * 440) / s.d}" y1="52" y2="128" stroke="${COLORS.ink}" stroke-width="3"/>`;
    body +=
      txt(280, 170, `${s.n}/${s.d} = ${shaded}/${total}`, { size: 30 }) +
      txt(280, 210, `= ${fmt(s.n / s.d)}`, { size: 18, fill: COLORS.mute });
    const alt = L(
      `A bar with ${total} equal pieces, ${shaded} shaded.`,
      `Una barra con ${total} partes iguales, ${shaded} sombreadas.`,
    );
    return out(
      svgWrap(body, "", { h: 230 }),
      alt,
      L(
        `${s.n}/${s.d} and ${shaded}/${total} are the same amount. The cuts changed the size of the pieces, not the shaded amount.`,
        `${s.n}/${s.d} y ${shaded}/${total} son la misma cantidad. Los cortes cambiaron el tamaño de las partes, no la parte sombreada.`,
      ),
    );
  },
};

const proportional = {
  id: "proportional",
  title: L("Proportional relationships", "Relaciones proporcionales"),
  ask: L(
    "Change the unit rate. Where does the line go? What is true of every point?",
    "Cambia la tasa unitaria. ¿Hacia dónde va la recta? ¿Qué es cierto de cada punto?",
  ),
  init: () => ({ k: 2 }),
  sliders: (s) => [
    slider(
      "k",
      L("Unit rate (y for each 1 x)", "Tasa unitaria (y por cada 1 de x)"),
      0.5,
      5,
      0.5,
      s.k,
    ),
  ],
  render(s) {
    const X = (x) => 60 + x * 50;
    const Y = (y) => 210 - y * 8;
    let body = `<line x1="60" y1="210" x2="520" y2="210" stroke="${COLORS.ink}" stroke-width="2"/><line x1="60" y1="210" x2="60" y2="20" stroke="${COLORS.ink}" stroke-width="2"/>`;
    for (let x = 0; x <= 8; x += 1)
      body += txt(X(x), 230, String(x), { size: 12, weight: 500, fill: COLORS.mute });
    body += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(8)}" y2="${Y(Math.min(8 * s.k, 24))}" stroke="${COLORS.whole}" stroke-width="3"/>`;
    for (let x = 1; x <= 6; x += 1)
      if (x * s.k <= 24)
        body +=
          `<circle cx="${X(x)}" cy="${Y(x * s.k)}" r="6" fill="${COLORS.hundreds}"/>` +
          txt(X(x), Y(x * s.k) - 12, fmt(x * s.k), { size: 12 });
    const alt = L(
      `A straight line through the origin with y = ${fmt(s.k)} x.`,
      `Una recta por el origen con y = ${fmt(s.k)} x.`,
    );
    return out(
      svgWrap(body, "", { h: 240 }),
      alt,
      L(
        `y = ${fmt(s.k)}x. Every point has y ÷ x = ${fmt(s.k)}, and the line goes through (0, 0). At x = 1, y is the unit rate.`,
        `y = ${fmt(s.k)}x. Todo punto tiene y ÷ x = ${fmt(s.k)}, y la recta pasa por (0, 0). En x = 1, y es la tasa unitaria.`,
      ),
    );
  },
};

const machine = {
  id: "machine",
  title: L("Function machine", "Máquina de funciones"),
  ask: L(
    "Change the rule. Predict the output before you read it.",
    "Cambia la regla. Predice la salida antes de leerla.",
  ),
  init: () => ({ m: 2, b: 1, x: 3 }),
  sliders: (s) => [
    slider("m", L("Multiply by", "Multiplica por"), -3, 6, 1, s.m),
    slider("b", L("Then add", "Luego suma"), -6, 9, 1, s.b),
    slider("x", L("Input x", "Entrada x"), -5, 10, 1, s.x),
  ],
  render(s) {
    const y = s.m * s.x + s.b;
    const sg = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`);
    let body = `<rect x="190" y="50" width="180" height="90" rx="14" fill="${COLORS.whole}" fill-opacity=".9"/>${txt(280, 105, `× ${fmt(s.m)} ${sg(s.b)}`, { size: 26, fill: "#fff" })}`;
    body +=
      txt(100, 105, `x = ${fmt(s.x)}`, { size: 22 }) +
      `<path d="M140,95 h45" stroke="${COLORS.ink}" stroke-width="3"/>` +
      txt(470, 105, `y = ${fmt(y)}`, { size: 22, fill: COLORS.hundreds }) +
      `<path d="M375,95 h45" stroke="${COLORS.ink}" stroke-width="3"/>`;
    body +=
      txt(280, 175, `x:  ${[0, 1, 2, 3, 4].map((t) => t).join("   ")}`, { size: 15, weight: 500 }) +
      txt(280, 200, `y:  ${[0, 1, 2, 3, 4].map((t) => fmt(s.m * t + s.b)).join("   ")}`, {
        size: 15,
        fill: COLORS.hundreds,
      });
    const alt = L(
      `Function machine with rule multiply by ${s.m} then add ${s.b}. Input ${s.x} gives output ${y}.`,
      `Máquina con la regla multiplicar por ${s.m} y sumar ${s.b}. La entrada ${s.x} da la salida ${y}.`,
    );
    return out(
      svgWrap(body, "", { h: 220 }),
      alt,
      L(
        `y = ${fmt(s.m)}x ${sg(s.b)}. Each time x goes up by 1, y changes by ${fmt(s.m)}: that change is the slope. At x = 0, y = ${fmt(s.b)}.`,
        `y = ${fmt(s.m)}x ${sg(s.b)}. Cada vez que x sube 1, y cambia ${fmt(s.m)}: ese cambio es la pendiente. En x = 0, y = ${fmt(s.b)}.`,
      ),
    );
  },
};

const areaPerim = {
  id: "areaPerim",
  title: L("Area and perimeter", "Área y perímetro"),
  ask: L(
    "Make a rectangle with perimeter 20. How many different areas can you find?",
    "Haz un rectángulo con perímetro 20. ¿Cuántas áreas distintas puedes hallar?",
  ),
  init: () => ({ w: 4, h: 3 }),
  sliders: (s) => [
    slider("w", L("Length", "Largo"), 1, 12, 1, s.w),
    slider("h", L("Width", "Ancho"), 1, 12, 1, s.h),
  ],
  render(s) {
    const c = Math.min(30, 380 / s.w, 150 / s.h);
    let body = "";
    for (let r = 0; r < s.h; r += 1)
      for (let q = 0; q < s.w; q += 1)
        body += `<rect x="${40 + q * c}" y="${30 + r * c}" width="${c - 2}" height="${c - 2}" fill="${COLORS.whole}" fill-opacity=".8"/>`;
    body +=
      `<rect x="38" y="28" width="${s.w * c + 2}" height="${s.h * c + 2}" fill="none" stroke="${COLORS.warn}" stroke-width="4"/>` +
      txt(470, 80, `A = ${s.w * s.h}`, { size: 22, fill: COLORS.whole }) +
      txt(470, 120, `P = ${2 * (s.w + s.h)}`, { size: 22, fill: COLORS.warn });
    const alt = L(
      `A rectangle ${s.w} by ${s.h}, area ${s.w * s.h}, perimeter ${2 * (s.w + s.h)}.`,
      `Un rectángulo de ${s.w} por ${s.h}, área ${s.w * s.h}, perímetro ${2 * (s.w + s.h)}.`,
    );
    return out(
      svgWrap(body, "", { h: 210 }),
      alt,
      L(
        `Area ${s.w} × ${s.h} = ${s.w * s.h} counts the squares inside. Perimeter ${s.w} + ${s.h} + ${s.w} + ${s.h} = ${2 * (s.w + s.h)} measures the edge. Rectangles can share a perimeter and still have different areas.`,
        `Área ${s.w} × ${s.h} = ${s.w * s.h} cuenta los cuadros dentro. Perímetro ${s.w} + ${s.h} + ${s.w} + ${s.h} = ${2 * (s.w + s.h)} mide el borde. Dos rectángulos pueden tener el mismo perímetro y distinta área.`,
      ),
    );
  },
};

const volume = {
  id: "volume",
  title: L("Volume of a box", "Volumen de una caja"),
  ask: L(
    "Change one side at a time. Which change makes the volume grow most?",
    "Cambia un lado a la vez. ¿Qué cambio hace crecer más el volumen?",
  ),
  init: () => ({ l: 4, w: 3, h: 2 }),
  sliders: (s) => [
    slider("l", L("Length", "Largo"), 1, 10, 1, s.l),
    slider("w", L("Width", "Ancho"), 1, 10, 1, s.w),
    slider("h", L("Height", "Alto"), 1, 10, 1, s.h),
  ],
  render(s) {
    const c = Math.min(26, 260 / s.l, 120 / s.w);
    let body = "";
    for (let i = Math.min(s.h, 10) - 1; i >= 1; i -= 1)
      body += `<rect x="${40 + i * 8}" y="${48 - i * 8 + 20}" width="${s.l * c}" height="${s.w * c}" fill="${COLORS.hundreds}" fill-opacity=".16" stroke="${COLORS.hundreds}" stroke-width="2"/>`;
    for (let r = 0; r < s.w; r += 1)
      for (let q = 0; q < s.l; q += 1)
        body += `<rect x="${40 + q * c}" y="${68 + r * c}" width="${c - 2}" height="${c - 2}" fill="${COLORS.whole}" fill-opacity=".85"/>`;
    body +=
      txt(440, 90, `${s.l * s.w} per layer`, { size: 18, fill: COLORS.whole }) +
      txt(440, 125, `× ${s.h} layers`, { size: 18, fill: COLORS.hundreds }) +
      txt(440, 165, `V = ${s.l * s.w * s.h}`, { size: 24 });
    const alt = L(
      `A box ${s.l} by ${s.w} by ${s.h}; volume ${s.l * s.w * s.h}.`,
      `Una caja de ${s.l} por ${s.w} por ${s.h}; volumen ${s.l * s.w * s.h}.`,
    );
    return out(
      svgWrap(body, "", { h: 220 }),
      alt,
      L(
        `${s.l} × ${s.w} = ${s.l * s.w} cubes in one layer, and ${s.h} layers make ${s.l * s.w * s.h} cubes.`,
        `${s.l} × ${s.w} = ${s.l * s.w} cubos en una capa, y ${s.h} capas hacen ${s.l * s.w * s.h} cubos.`,
      ),
    );
  },
};

// Reuse Curriculum's accessible 3D net interaction in the actual surface-area lesson.
// The problem parser remains the source of dimensions and correct answer logic.
const surfaceNet = {
  id: "surfaceNet",
  init: () => ({ ready: true }),
  sliders: () => [],
  render() {
    const alt = L("A three-dimensional net preview opens for the current surface-area problem.", "Se abre una vista tridimensional de la red para el problema actual de área de superficie.");
    return out(svgWrap(txt(280, 100, "3D net", { size: 26 }), "", { h: 180 }), alt, alt);
  },
  mount(ctx, root) {
    const s = ctx.lesson?.spec;
    if (!s || s.mode !== "surfaceNet") return;
    const prism = s.solid === "rectangular-prism";
    const scale = 11;
    const size = prism
      ? { w: s.l * scale, h: s.h * scale, d: s.w * scale }
      : {
          w: s.side * scale,
          // NetFolder takes the pyramid's vertical height and derives slant height.
          h: Math.sqrt(Math.max(0, s.triangleHeight ** 2 - (s.side / 2) ** 2)) * scale,
        };
    const choices = prism
      ? [
          `2(${s.l}×${s.w} + ${s.l}×${s.h} + ${s.w}×${s.h})`,
          `${s.l}×${s.w}×${s.h}`,
          `${s.l}×${s.w} + ${s.l}×${s.h} + ${s.w}×${s.h}`,
        ]
      : [
          `${s.side}×${s.side} + 4(${s.side}×${s.triangleHeight}÷2)`,
          `${s.side}×${s.side} + 4(${s.side}×${s.triangleHeight})`,
          `${s.side}×${s.side}×${s.triangleHeight}`,
        ];
    root.innerHTML = `<p class="sd-task"><span class="sd-tag">${ctx.lang() === "es" ? "Explorar" : "Explore"}</span> ${ctx.lang() === "es" ? "Dobla la red. ¿Qué expresión cuenta cada cara exterior una vez?" : "Fold the net. Which expression counts each outside face once?"}</p><div data-net></div>`;
    renderNetFolder(root.querySelector("[data-net]"), {
      instructions: ctx.lang() === "es"
        ? "Usa el control para doblar la red y observar qué caras forman el sólido. Después elige la expresión para el área de todas las caras."
        : "Use the control to fold the net and notice which faces form the solid. Then choose the expression for the area of every face.",
      solid: s.solid,
      size,
      question: {
        stem: ctx.lang() === "es" ? "¿Qué expresión suma correctamente todas las caras?" : "Which expression correctly adds all the faces?",
        choices,
        correctIndex: 0,
      },
      onComplete(correct) {
        if (correct) ctx.mark("explore");
        else ctx.say(ctx.lang() === "es"
          ? "Mira la red otra vez: las caras iguales siguen contando por separado. Inténtalo de nuevo."
          : "Look at the net again: matching faces still count separately. Try again.");
      },
    });
    // This experience stays in Fluency Lab; remove the legacy external-studio link.
    root.querySelector('a[href="/netfold-pro/"]')?.remove();
    return () => { root.replaceChildren(); };
  },
};

const percentWhole = {
  id: "percentWhole",
  title: L("Find the whole with a percent tape", "Halla el entero con una cinta de porcentaje"),
  ask: L(
    "After you make a prediction, change the part or its percent. Watch how the 100% whole responds.",
    "Después de hacer una predicción, cambia la parte o su porcentaje. Observa cómo responde el entero del 100%.",
  ),
  init(ctx) {
    const spec = ctx?.lesson?.spec;
    return spec?.mode === "percentWhole" ? { p: spec.p, part: spec.part } : { p: 30, part: 15 };
  },
  prediction(s) {
    const expected = percentFindWhole.evaluate(null, [s.p, s.part]).value;
    return {
      prompt: L(`Predict the whole: ${s.p}% of what number is ${fmt(s.part)}?`, `Predice el entero: ¿el ${s.p}% de qué número es ${fmt(s.part)}?`),
      answer: expected,
      hint: s.p === 100
        ? L("At 100%, the part is the whole. What number matches the known amount?", "Al 100%, la parte es el entero. ¿Qué número coincide con la cantidad conocida?")
        : L(`The known amount is only ${s.p}% of the whole. The 100% whole must be larger than ${fmt(s.part)}. Try a number that fits.`, `La cantidad conocida es solo el ${s.p}% del entero. El entero del 100% debe ser mayor que ${fmt(s.part)}. Prueba un número que encaje.`),
    };
  },
  sliders: (s) => [
    slider("p", L("Known percent", "Porcentaje conocido"), 1, 100, 1, s.p),
    slider("part", L("Known part", "Parte conocida"), 1, 120, 1, s.part),
  ],
  render(s) {
    const result = percentFindWhole.evaluate(null, [s.p, s.part]);
    const body = percentFindWhole.visual([s.p, s.part], result) + hundredGrid(s.p, 405);
    const alt = L(
      `Percent tape and double number line. ${s.p}% is ${fmt(s.part)}; the recovered 100% whole is ${fmt(result.value)}.`,
      `Cinta de porcentaje y recta numérica doble. El ${s.p}% es ${fmt(s.part)}; el entero recuperado al 100% es ${fmt(result.value)}.`,
    );
    return out(
      svgWrap(body, "", { w: 600, h: 590 }),
      alt,
      L(
        `${s.p}% of the whole is ${fmt(s.part)}. Divide ${fmt(s.part)} by ${fmt(s.p / 100)} to recover 100%: ${fmt(result.value)}.`,
        `El ${s.p}% del entero es ${fmt(s.part)}. Divide ${fmt(s.part)} entre ${fmt(s.p / 100)} para recuperar el 100%: ${fmt(result.value)}.`,
      ),
    );
  },
};

const percentPart = {
  id: "percentPart",
  title: L("Percent tape and hundred grid", "Cinta de porcentaje y cuadrícula de cien"),
  ask: L(
    "Change the percent or whole. Predict how much the shaded part will be.",
    "Cambia el porcentaje o el entero. Predice cuánto medirá la parte sombreada.",
  ),
  init(ctx) {
    const item = ctx?.item;
    if (item?.model?.type === "percentBar") return { p: item.model.percent, w: item.model.whole };
    const m = String(item?.question || "").match(/^What is (\d+)% of (\d+)\?$/);
    return m ? { p: Number(m[1]), w: Number(m[2]) } : { p: 30, w: 50 };
  },
  sliders: (s) => [
    slider("p", L("Percent", "Porcentaje"), 0, 100, 1, s.p),
    slider("w", L("Whole amount", "Cantidad total"), 1, 120, 1, s.w),
  ],
  prediction(s) {
    const expected = percentTape.evaluate(null, [s.p, s.w]).value;
    return {
      prompt: L(
        `Predict the part: what is ${s.p}% of ${fmt(s.w)}?`,
        `Predice la parte: ¿cuánto es el ${s.p}% de ${fmt(s.w)}?`,
      ),
      answer: expected,
      hint: L(
        `${s.p}% means ${fmt(s.p / 100)} of the whole. Use the hundred grid to estimate that part of ${fmt(s.w)}.`,
        `${s.p}% significa ${fmt(s.p / 100)} del entero. Usa la cuadrícula de cien para estimar esa parte de ${fmt(s.w)}.`,
      ),
    };
  },
  render(s) {
    const result = percentTape.evaluate(null, [s.p, s.w]);
    const body = percentTape.visual([s.p, s.w], result) + hundredGrid(s.p, 360);
    const alt = L(
      `Percent tape, double number line, and hundred grid. ${s.p}% of ${fmt(s.w)} is ${fmt(result.value)}.`,
      `Cinta de porcentaje, recta numérica doble y cuadrícula de cien. El ${s.p}% de ${fmt(s.w)} es ${fmt(result.value)}.`,
    );
    return out(
      svgWrap(body, "", { w: 600, h: 550 }),
      alt,
      L(
        `${s.p}% = ${fmt(s.p / 100)}. Multiply by the whole: ${fmt(s.p / 100)} × ${fmt(s.w)} = ${fmt(result.value)}. Each shaded grid square is 1% of the whole.`,
        `${s.p}% = ${fmt(s.p / 100)}. Multiplica por el entero: ${fmt(s.p / 100)} × ${fmt(s.w)} = ${fmt(result.value)}. Cada cuadro sombreado representa el 1% del entero.`,
      ),
    );
  },
};

const ratioTape = {
  id: "ratioTape",
  title: L("Build a ratio tape", "Construye una cinta de razones"),
  ask: L(
    "Change either group. Predict how the part-to-part and part-to-whole comparisons will change.",
    "Cambia cualquiera de los grupos. Predice cómo cambiarán las comparaciones parte a parte y parte a total.",
  ),
  init(ctx) {
    const base = ctx?.lesson?.spec?.base;
    return {
      a: Number.isInteger(base?.[0]) && base[0] > 0 ? Math.min(base[0], 12) : 2,
      b: Number.isInteger(base?.[1]) && base[1] > 0 ? Math.min(base[1], 12) : 3,
      lang: ctx?.lang?.() === "es" ? "es" : "en",
    };
  },
  sliders: (s) => [
    slider("a", L("First group", "Primer grupo"), 1, 12, 1, s.a),
    slider("b", L("Second group", "Segundo grupo"), 1, 12, 1, s.b),
  ],
  render(s) {
    const whole = s.a + s.b;
    const spanish = s.lang === "es";
    const first = spanish ? "Grupo A" : "Group A";
    const second = spanish ? "Grupo B" : "Group B";
    const labels = {
      first,
      second,
      whole: "Total",
      relationWord: spanish ? "a" : "to",
      firstUnit: spanish ? "unidad" : "unit",
      firstUnitPlural: spanish ? "unidades" : "units",
      secondUnit: spanish ? "unidad" : "unit",
      secondUnitPlural: spanish ? "unidades" : "units",
      wholeUnit: spanish ? "unidad" : "unit",
      wholeUnitPlural: spanish ? "unidades" : "units",
      boxUnit: spanish ? "unidad" : "unit",
      tapeCaption: spanish ? "Una cinta: cada caja representa 1 unidad" : "One tape: every box is 1 unit",
      partToWholeHint: spanish
        ? "En una razón parte a total, el total va en segundo lugar."
        : "For part to whole, put total second.",
    };
    const body = `<style>text{fill:#24323f;font-family:system-ui,sans-serif;font-weight:650}.shape{fill:#f9cf55;stroke:#84640c;stroke-width:1.5}.solution{stroke:#17324d;stroke-width:4}.heavy{stroke:#17324d;stroke-width:3}.gridline{stroke:#78909c;stroke-width:1.5}</style>${ratioTapeModel.visual([s.a, s.b], labels)}`;
    const alt = L(
      `A tape with ${s.a} units in the first group and ${s.b} in the second. The part-to-part ratio is ${s.a} to ${s.b}; the first group to the total is ${s.a} to ${whole}.`,
      `Una cinta con ${s.a} unidades en el primer grupo y ${s.b} en el segundo. La razón parte a parte es ${s.a} a ${s.b}; el primer grupo al total es ${s.a} a ${whole}.`,
    );
    return out(
      svgWrap(body, "", { w: 600, h: 300 }),
      alt,
      L(
        `First to second: ${s.a}:${s.b}. First to total: ${s.a}:${whole}. Second to total: ${s.b}:${whole}. The whole is the sum ${s.a} + ${s.b} = ${whole}.`,
        `Primero a segundo: ${s.a}:${s.b}. Primero al total: ${s.a}:${whole}. Segundo al total: ${s.b}:${whole}. El total es la suma ${s.a} + ${s.b} = ${whole}.`,
      ),
    );
  },
};

const angles = {
  id: "angles",
  title: L("Angles at a crossing", "Ángulos en un cruce"),
  ask: L(
    "Change one angle. Which angles change with it, and which match?",
    "Cambia un ángulo. ¿Cuáles cambian con él y cuáles son iguales?",
  ),
  init: () => ({ a: 60 }),
  sliders: (s) => [slider("a", L("Angle a (degrees)", "Ángulo a (grados)"), 10, 170, 5, s.a)],
  render(s) {
    const r = 90;
    const rad = (s.a * Math.PI) / 180;
    const [cx, cy] = [280, 105];
    const pt = (t, d = r) => `${cx + Math.cos(t) * d},${cy - Math.sin(t) * d}`;
    let body = `<line x1="${cx - 140}" y1="${cy}" x2="${cx + 140}" y2="${cy}" stroke="${COLORS.ink}" stroke-width="4"/><line x1="${cx + Math.cos(rad) * 120}" y1="${cy - Math.sin(rad) * 120}" x2="${cx - Math.cos(rad) * 120}" y2="${cy + Math.sin(rad) * 120}" stroke="${COLORS.ink}" stroke-width="4"/>`;
    body +=
      `<path d="M${pt(0, 50)} A50,50 0 0 0 ${pt(rad, 50)}" fill="none" stroke="${COLORS.whole}" stroke-width="7"/>` +
      txt(cx + 70, cy - 18, `a = ${s.a}°`, { size: 17, fill: COLORS.whole });
    body +=
      `<path d="M${pt(Math.PI, 50)} A50,50 0 0 1 ${pt(Math.PI + rad, 50)}" fill="none" stroke="${COLORS.whole}" stroke-width="7"/>` +
      txt(cx - 70, cy + 28, `${s.a}°`, { size: 17, fill: COLORS.whole });
    body +=
      txt(cx - 70, cy - 18, `${180 - s.a}°`, { size: 17, fill: COLORS.warn }) +
      txt(cx + 70, cy + 28, `${180 - s.a}°`, { size: 17, fill: COLORS.warn });
    const alt = L(
      `Two crossing lines make angles ${s.a} and ${180 - s.a} degrees.`,
      `Dos rectas que se cruzan forman ángulos de ${s.a} y ${180 - s.a} grados.`,
    );
    return out(
      svgWrap(body, "", { h: 220 }),
      alt,
      L(
        `Opposite (vertical) angles are equal: ${s.a}° and ${s.a}°. Angles next to each other add to 180°: ${s.a}° + ${180 - s.a}° = 180°.`,
        `Los ángulos opuestos por el vértice son iguales: ${s.a}° y ${s.a}°. Los ángulos contiguos suman 180°: ${s.a}° + ${180 - s.a}° = 180°.`,
      ),
    );
  },
};

const dotplot = {
  id: "dotplot",
  title: L("Dot plot: center and spread", "Diagrama de puntos: centro y dispersión"),
  ask: L(
    "Drag a dot or focus one and use the arrow keys. Predict how the mean and median will respond.",
    "Arrastra un punto o selecciónalo y usa las flechas. Predice cómo responderán la media y la mediana.",
  ),
  init: (ctx) => ({ data: [2, 3, 3, 4, 5, 5, 5, 6, 7], at: 5, selected: 4, lang: ctx?.lang?.() === "es" ? "es" : "en" }),
  sliders: (s) => [slider("at", L("Place a dot at", "Coloca un punto en"), 0, 20, 1, s.at)],
  actions: [
    { id: "add", label: L("Add a dot", "Agregar un punto") },
    { id: "remove", label: L("Remove a dot here", "Quitar un punto aquí") },
    { id: "reset", label: L("Start over", "Empezar de nuevo") },
  ],
  act(s, id) {
    if (id === "reset") return { ...s, data: [2, 3, 3, 4, 5, 5, 5, 6, 7], at: 5, selected: 4 };
    if (id === "add")
      return s.data.length >= 24 ? s : { ...s, data: [...s.data, s.at], selected: s.data.length };
    const i = s.data.indexOf(s.at);
    return i < 0 || s.data.length <= 3
      ? s
      : { ...s, data: s.data.filter((_, j) => j !== i), selected: Math.min(s.selected, s.data.length - 2) };
  },
  movePoint(s, index, value) {
    if (!Number.isInteger(index) || index < 0 || index >= s.data.length) return s;
    const at = Math.max(0, Math.min(20, Math.round(value)));
    const data = [...s.data];
    data[index] = at;
    return { ...s, data, at, selected: index };
  },
  pointerValue(clientX, rect, viewBox) {
    if (!rect?.width) return null;
    const svgX = (viewBox?.x || 0) + ((clientX - rect.left) / rect.width) * (viewBox?.width || 560);
    return Math.max(0, Math.min(20, Math.round((svgX - 40) / 24)));
  },
  stats(data) {
    const sorted = [...data].sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const mid = sorted.length / 2;
    const median =
      sorted.length % 2 ? sorted[Math.floor(mid)] : (sorted[mid - 1] + sorted[mid]) / 2;
    return { mean, median, range: sorted.at(-1) - sorted[0] };
  },
  render(s) {
    const X = (v) => 40 + v * 24;
    const counts = {};
    let body = `<line x1="30" y1="170" x2="530" y2="170" stroke="${COLORS.ink}" stroke-width="2"/>`;
    for (let v = 0; v <= 20; v += 2)
      body += txt(X(v), 192, String(v), { size: 12, weight: 500, fill: COLORS.mute });
    for (const [index, v] of s.data.entries()) {
      counts[v] = (counts[v] || 0) + 1;
      const y = 160 - counts[v] * 14;
      const label = s.lang === "es"
        ? `Dato ${index + 1}, valor ${v}. Arrastra para moverlo; usa las flechas izquierda y derecha para cambiar el valor.`
        : `Observation ${index + 1}, value ${v}. Drag to move; use left and right arrow keys to change the value.`;
      body += `<g class="sd-k sd-data-point" data-k="dot-${index}" data-point-index="${index}" style="transform:translate(${X(v)}px,${y}px)" role="slider" tabindex="${index === s.selected ? 0 : -1}" aria-label="${label}" aria-valuemin="0" aria-valuemax="20" aria-valuenow="${v}" aria-valuetext="${v}"><circle cx="0" cy="0" r="8" fill="${COLORS.whole}" stroke="${index === s.selected ? COLORS.warn : "#fff"}" stroke-width="${index === s.selected ? 3 : 1.5}"/></g>`;
    }
    const { mean, median, range } = this.stats(s.data);
    body +=
      `<polygon points="${X(mean) - 8},210 ${X(mean) + 8},210 ${X(mean)},196" fill="${COLORS.warn}"/>` +
      txt(X(mean), 226, `${s.lang === "es" ? "media" : "mean"} ${fmt(Math.round(mean * 10) / 10)}`, {
        size: 12,
        fill: COLORS.warn,
      }) +
      `<line x1="${X(median)}" x2="${X(median)}" y1="30" y2="170" stroke="${COLORS.hundreds}" stroke-width="2" stroke-dasharray="6 5" pointer-events="none"/>` +
      txt(X(median), 24, `${s.lang === "es" ? "mediana" : "median"} ${fmt(median)}`, { size: 12, fill: COLORS.hundreds }) +
      `<circle cx="${X(s.at)}" cy="170" r="4" fill="none" stroke="${COLORS.warn}" stroke-width="2"/>`;
    const alt = L(
      `Dot plot of ${s.data.length} values. Mean ${fmt(Math.round(mean * 10) / 10)}, median ${fmt(median)}, range ${range}.`,
      `Diagrama de ${s.data.length} valores. Media ${fmt(Math.round(mean * 10) / 10)}, mediana ${fmt(median)}, rango ${range}.`,
    );
    return out(
      svgWrap(body, "", { h: 240 }),
      alt,
      L(
        `Mean ${fmt(Math.round(mean * 10) / 10)} (balance point), median ${fmt(median)} (middle value), range ${range} (spread). A far-away dot pulls the mean more than the median.`,
        `Media ${fmt(Math.round(mean * 10) / 10)} (punto de equilibrio), mediana ${fmt(median)} (valor del medio), rango ${range} (dispersión). Un punto lejano mueve más la media que la mediana.`,
      ),
    );
  },
};

export const SIMS = { fracEquiv, proportional, machine, areaPerim, volume, percentWhole, percentPart, ratioTape, angles, dotplot, surfaceNet };
export const simFor = (id) => SIMS[id] || null;
export const _gcd = gcd;
