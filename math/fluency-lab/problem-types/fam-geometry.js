import { bi, fmt, int, pick } from "./kit.js";
import { geometry as geometryModel, solid } from "./models.js";
import { Q } from "./rational.js";

const SPECS = {
  "3:area": { kind: "area" },
  "3:perimeter": { kind: "perimeter" },
  "5:volume": { kind: "volume" },
  "6:triangle-area": { kind: "triangle" },
  "7:circle-area": { kind: "circle" },
  "7:scale-drawing": { kind: "scale-drawing" },
  "8:angle-relations": { kind: "angles" },
  "8:transformations": { kind: "transform" },
  "8:pythagorean": { kind: "pythagorean" },
};

const wrongValues = (answer) =>
  [answer + 1, Math.max(0, answer - 1), answer + 2, answer * 2 + 1]
    .filter((n, i, all) => n !== answer && all.indexOf(n) === i)
    .slice(0, 3)
    .map((v, i) => ({ v: Q(v), why: ["added one unit too many", "used one unit too few", "used the wrong operation"][i] }));

function numeric(ctx, { en, es, expr, answer, unit = "", model = null, rule, storyEn = null, storyEs = null }) {
  const prompt = ctx.type === "real-world" && storyEn ? [storyEn, storyEs] : ctx.type === "word-problem" && storyEn ? [storyEn, storyEs] : [en, es];
  const final = `${rule} The result is ${fmt(answer)}${unit ? ` ${unit}` : ""}.`;
  return {
    q: bi(prompt[0], prompt[1]),
    form: "int",
    answer: Q(answer),
    unit,
    units: unit ? [unit, unit.replace(/s$/, "")] : [],
    bare: expr,
    check: { kind: "expr", expr, role: "answer" },
    wrong: wrongValues(answer),
    model,
    hint: rule,
    explanation: final,
    steps: ["Identify the geometric quantities in the question.", "Use the matching measurement relationship.", `${expr} = ${fmt(answer)}.`],
  };
}

function explainChoice(ctx, { en, es, expr, answer, choices, correct, rule }) {
  const options = choices.filter((choice) => choice.en !== correct.en).map((choice) => ({ text: choice.en, es: choice.es, why: choice.why }));
  const qEn = ctx.spec.kind === "circle"
    ? en.replace("What is the coefficient of π in its area?", "Which relationship gives its area?")
    : `Which method matches this ${ctx.spec.kind === "triangle" ? "triangle" : "geometry"} question: ${en}`;
  const qEs = ctx.spec.kind === "circle"
    ? es.replace("¿Cuál es el coeficiente de π en su área?", "¿Qué relación da su área?")
    : `¿Qué método corresponde a esta pregunta de ${ctx.spec.kind === "triangle" ? "triángulo" : "geometría"}: ${es}`;
  const question = ctx.spec.kind === "circle" ? [qEn, qEs] : [qEn, qEs];
  return {
    q: bi(question[0], question[1]),
    form: "choice",
    answer: correct.en,
    answerEs: correct.es,
    options,
    check: { kind: "expr", expr, role: "answer", map: { [String(answer)]: correct.en } },
    hint: rule,
    explanation: correct.en,
    steps: ["Identify the shape and the quantity the question asks for.", "Match each given measurement to the correct relationship.", correct.en],
  };
}

function build(ctx) {
  const { rng, level, spec } = ctx;
  const small = level <= 2;
  if (spec.kind === "area" || spec.kind === "perimeter") {
    const l = int(rng, 2, small ? 7 : 9 + level);
    const w = int(rng, 2, small ? 6 : 8 + level);
    const isArea = spec.kind === "area";
    const answer = isArea ? l * w : 2 * (l + w);
    const expr = isArea ? `${l}*${w}` : `2*(${l}+${w})`;
    const model = geometryModel("rectangle", { l: Q(l), w: Q(w) }, isArea ? "area" : "perimeter", isArea ? "Area of a rectangle" : "Perimeter of a rectangle");
    const en = isArea ? `A rectangle is ${l} units long and ${w} units wide. What is its area in square units?` : `A rectangle is ${l} units long and ${w} units wide. What is its perimeter in units?`;
    const es = isArea ? `Un rectángulo mide ${l} unidades de largo y ${w} de ancho. ¿Cuál es su área en unidades cuadradas?` : `Un rectángulo mide ${l} unidades de largo y ${w} de ancho. ¿Cuál es su perímetro en unidades?`;
    const rule = isArea ? "Multiply length by width to find area." : "Add the four side lengths, or double the sum of length and width, to find perimeter.";
    const item = numeric(ctx, {
      en,
      es,
      expr,
      answer,
      unit: isArea ? "square units" : "units",
      model,
      rule,
      storyEn: isArea ? `A garden is ${l} units long and ${w} units wide. How many square units of soil cover it?` : `A fence goes around a rectangular garden ${l} units long and ${w} units wide. How many units of fence are needed?`,
      storyEs: isArea ? `Un jardín mide ${l} unidades de largo y ${w} de ancho. ¿Cuántas unidades cuadradas de tierra lo cubren?` : `Una cerca rodea un jardín rectangular de ${l} unidades de largo y ${w} de ancho. ¿Cuántas unidades de cerca se necesitan?`,
    });
    if (ctx.type === "explain") {
      const choices = isArea
        ? [
            { en: "Multiply the side lengths.", es: "Multiplicar las longitudes de los lados.", why: "adds instead of finding the number of square units" },
            { en: "Add all four side lengths.", es: "Sumar las longitudes de los cuatro lados.", why: "finds perimeter instead of area" },
            { en: "Double only the longer side.", es: "Duplicar solo el lado más largo.", why: "does not cover the whole rectangle" },
          ]
        : [
            { en: "Add the four side lengths.", es: "Sumar las longitudes de los cuatro lados.", why: "this is area, not perimeter" },
            { en: "Multiply the side lengths.", es: "Multiplicar las longitudes de los lados.", why: "finds square units inside, not the distance around" },
            { en: "Add only the length and width once.", es: "Sumar el largo y el ancho una sola vez.", why: "counts only two of the four sides" },
          ];
      const correct = isArea ? choices[0] : choices[0];
      return explainChoice(ctx, { en, es, expr, answer, choices, correct, rule });
    }
    return item;
  }

  if (spec.kind === "volume") {
    const l = int(rng, 2, 4 + level);
    const w = int(rng, 2, 4 + level);
    const h = int(rng, 2, 3 + level);
    const answer = l * w * h;
    const expr = `${l}*${w}*${h}`;
    const en = `A rectangular prism is ${l} units long, ${w} units wide, and ${h} units high. What is its volume?`;
    const es = `Un prisma rectangular mide ${l} unidades de largo, ${w} de ancho y ${h} de alto. ¿Cuál es su volumen?`;
    const rule = "Multiply length, width, and height to find the number of unit cubes.";
    if (ctx.type === "explain") {
      const choices = [
        { en: "Multiply the three dimensions.", es: "Multiplicar las tres dimensiones.", why: "this finds the volume in unit cubes" },
        { en: "Add the three dimensions.", es: "Sumar las tres dimensiones.", why: "does not count the unit cubes" },
        { en: "Multiply only length and width.", es: "Multiplicar solo el largo y el ancho.", why: "finds the area of one face, not volume" },
      ];
      return explainChoice(ctx, { en, es, expr, answer, choices, correct: choices[0], rule });
    }
    return numeric(ctx, { en, es, expr, answer, unit: "cubic units", model: solid(l, w, h, "volume", "Volume of a rectangular prism"), rule, storyEn: `A storage box is ${l} units by ${w} units by ${h} units. How many unit cubes fill it?`, storyEs: `Una caja de almacenamiento mide ${l} por ${w} por ${h} unidades. ¿Cuántos cubos unitarios la llenan?` });
  }

  if (spec.kind === "triangle") {
    const base = 2 * int(rng, 2, 3 + level);
    const height = int(rng, 2, 3 + level);
    const answer = (base * height) / 2;
    const expr = `${base}*${height}/2`;
    const en = `A triangle has a base of ${base} units and a height of ${height} units. What is its area?`;
    const es = `Un triángulo tiene una base de ${base} unidades y una altura de ${height} unidades. ¿Cuál es su área?`;
    const rule = "Multiply the base by the perpendicular height, then divide by 2.";
    if (ctx.type === "explain") {
      const choices = [
        { en: "Multiply base by height, then divide by 2.", es: "Multiplicar la base por la altura y luego dividir entre 2.", why: "this is the triangle area relationship" },
        { en: "Multiply base by height without dividing by 2.", es: "Multiplicar la base por la altura sin dividir entre 2.", why: "this gives the area of a matching rectangle" },
        { en: "Add base and height.", es: "Sumar la base y la altura.", why: "adds lengths instead of finding area" },
      ];
      return explainChoice(ctx, { en, es, expr, answer, choices, correct: choices[0], rule });
    }
    return numeric(ctx, { en, es, expr, answer, unit: "square units", model: geometryModel("triangle", { b: Q(base), h: Q(height) }, "area", "Area of a triangle"), rule, storyEn: `A triangular sign has a ${base}-unit base and ${height}-unit height. What is its area?`, storyEs: `Un letrero triangular tiene una base de ${base} unidades y una altura de ${height} unidades. ¿Cuál es su área?` });
  }

  if (spec.kind === "circle") {
    const radius = int(rng, 2, 6 + level);
    const answer = radius * radius;
    const expr = `${radius}*${radius}`;
    const en = `A circle has radius ${radius} units. What is the coefficient of π in its area?`;
    const es = `Un círculo tiene un radio de ${radius} unidades. ¿Cuál es el coeficiente de π en su área?`;
    const rule = "The area is π times the radius squared.";
    if (ctx.type === "explain") {
      const choices = [
        { en: "Multiply π by the radius squared.", es: "Multiplicar π por el radio al cuadrado.", why: "this is the circle area relationship" },
        { en: "Multiply π by twice the radius.", es: "Multiplicar π por el doble del radio.", why: "uses diameter as the exponent" },
        { en: "Add π to the radius.", es: "Sumar π al radio.", why: "adds unlike quantities" },
      ];
      return explainChoice(ctx, { en, es, expr, answer, choices, correct: choices[0], rule });
    }
    return numeric(ctx, { en, es, expr, answer, unit: "π square units", model: geometryModel("circle", { r: Q(radius) }, "r-squared", "Coefficient in circle area"), rule, storyEn: `A circular garden has a radius of ${radius} units. What number multiplies π in its area?`, storyEs: `Un jardín circular tiene un radio de ${radius} unidades. ¿Qué número multiplica a π en su área?` });
  }

  if (spec.kind === "angles") {
    const mode = level === 1 ? "complement" : level === 3 ? "vertical" : level === 5 ? "equation" : "supplement";
    let known;
    let answer;
    let expr;
    let relationEn;
    let relationEs;
    if (mode === "complement") {
      known = int(rng, 20, 70);
      answer = 90 - known;
      expr = `90-${known}`;
      relationEn = `Two angles form a right angle. One angle is ${known}°. How many degrees is the other angle?`;
      relationEs = `Dos ángulos forman un ángulo recto. Uno mide ${known}°. ¿Cuántos grados mide el otro?`;
    } else if (mode === "vertical") {
      known = int(rng, 25, 155);
      answer = known;
      expr = String(known);
      relationEn = `Two vertical angles are formed by intersecting lines. One is ${known}°. How many degrees is its opposite angle?`;
      relationEs = `Dos ángulos opuestos por el vértice se forman con líneas que se cruzan. Uno mide ${known}°. ¿Cuántos grados mide el opuesto?`;
    } else if (mode === "equation") {
      answer = int(rng, 20, 70);
      known = 180 - 2 * answer;
      expr = `(180-${known})/2`;
      relationEn = `Two equal angles and a ${known}° angle lie on a straight line. What is the measure of each equal angle?`;
      relationEs = `Dos ángulos iguales y un ángulo de ${known}° forman una línea recta. ¿Cuánto mide cada ángulo igual?`;
    } else {
      known = int(rng, 20, 160);
      answer = 180 - known;
      expr = `180-${known}`;
      relationEn = `Two angles form a straight line. One angle is ${known}°. How many degrees is the other angle?`;
      relationEs = `Dos ángulos forman una línea recta. Uno mide ${known}°. ¿Cuántos grados mide el otro?`;
    }
    const rule = mode === "complement" ? "Angles that form a right angle add to 90°." : mode === "vertical" ? "Vertical angles have equal measures." : "Angles on a straight line add to 180°.";
    if (ctx.type === "explain") {
      const choices = [
        { en: rule, es: mode === "complement" ? "Los ángulos que forman un ángulo recto suman 90°." : mode === "vertical" ? "Los ángulos opuestos por el vértice tienen la misma medida." : "Los ángulos de una línea recta suman 180°. ", why: "matches the stated angle relationship" },
        { en: "The two angles always have the same measure.", es: "Los dos ángulos siempre tienen la misma medida.", why: "confuses adjacent angles with vertical angles" },
        { en: "The two angle measures add to 360°.", es: "Las medidas de los dos ángulos suman 360°. ", why: "uses a full turn instead of the stated relationship" },
      ];
      return explainChoice(ctx, { en: relationEn, es: relationEs, expr, answer, choices, correct: choices[0], rule });
    }
    return numeric(ctx, { en: relationEn, es: relationEs, expr, answer, unit: "degrees", rule, storyEn: relationEn, storyEs: relationEs });
  }

  if (spec.kind === "scale-drawing") {
    const factor = pick(rng, [2, 3, 4, 5, 10]);
    const solveDrawing = level >= 4;
    const drawingLength = int(rng, 2, 5 + level);
    const realLength = factor * drawingLength;
    const answer = solveDrawing ? drawingLength : realLength;
    const expr = solveDrawing ? `${realLength}/${factor}` : `${drawingLength}*${factor}`;
    const en = solveDrawing
      ? `A scale drawing uses 1 cm to represent ${factor} m. A wall is ${realLength} m long. How long is it in the drawing?`
      : `A map uses a scale of 1 cm to ${factor} m. A trail is ${drawingLength} cm long on the map. What is its real length in meters?`;
    const es = solveDrawing
      ? `Un dibujo a escala usa 1 cm para representar ${factor} m. Una pared mide ${realLength} m. ¿Cuánto mide en el dibujo?`
      : `Un mapa usa una escala de 1 cm por cada ${factor} m. Un sendero mide ${drawingLength} cm en el mapa. ¿Cuál es su longitud real en metros?`;
    const rule = solveDrawing
      ? "Divide the real length by the number of meters represented by each drawing centimeter."
      : "Multiply the drawing length by the real length represented by each drawing centimeter.";
    if (ctx.type === "explain") {
      const choices = solveDrawing
        ? [
            { en: "Divide the real length by the scale factor.", es: "Dividir la longitud real entre el factor de escala.", why: "this finds how many drawing centimeters fit" },
            { en: "Multiply the real length by the scale factor.", es: "Multiplicar la longitud real por el factor de escala.", why: "makes the drawing longer than the real length" },
            { en: "Add the real length and the scale factor.", es: "Sumar la longitud real y el factor de escala.", why: "does not compare corresponding lengths" },
          ]
        : [
            { en: "Multiply the drawing length by the scale factor.", es: "Multiplicar la longitud del dibujo por el factor de escala.", why: "this converts the drawing length to real length" },
            { en: "Divide the drawing length by the scale factor.", es: "Dividir la longitud del dibujo entre el factor de escala.", why: "moves in the opposite direction" },
            { en: "Add the drawing length and the scale factor.", es: "Sumar la longitud del dibujo y el factor de escala.", why: "does not scale corresponding lengths" },
          ];
      return explainChoice(ctx, { en, es, expr, answer, choices, correct: choices[0], rule });
    }
    const storyEn = solveDrawing
      ? `A building wall is ${realLength} m long. On a plan with a scale of 1 cm to ${factor} m, how many centimeters long is the wall?`
      : `A walking trail is ${drawingLength} cm on a map. The scale is 1 cm to ${factor} m. How many meters long is the real trail?`;
    const storyEs = solveDrawing
      ? `Una pared mide ${realLength} m. En un plano con una escala de 1 cm por cada ${factor} m, ¿cuántos centímetros mide la pared?`
      : `Un sendero mide ${drawingLength} cm en un mapa. La escala es 1 cm por cada ${factor} m. ¿Cuántos metros mide el sendero real?`;
    return numeric(ctx, { en, es, expr, answer, unit: solveDrawing ? "centimeters" : "meters", rule, storyEn, storyEs });
  }

  if (spec.kind === "transform") {
    const x = int(rng, 2, 8) * (rng() < 0.5 ? -1 : 1);
    const y = int(rng, 2, 8) * (rng() < 0.5 ? -1 : 1);
    const transformations = [
      { name: "the y-axis", nameEs: "el eje y", point: [-x, y], rule: "A reflection across the y-axis changes the sign of x." },
      { name: "the x-axis", nameEs: "el eje x", point: [x, -y], rule: "A reflection across the x-axis changes the sign of y." },
      { name: "the origin", nameEs: "el origen", point: [-x, -y], rule: "A half-turn around the origin changes both signs." },
      { name: "the line y = x", nameEs: "la recta y = x", point: [y, x], rule: "A reflection across y = x swaps the coordinates." },
      { name: "the line y = −x", nameEs: "la recta y = −x", point: [-y, -x], rule: "A reflection across y = −x swaps the coordinates and changes both signs." },
    ];
    const t = transformations[(level - 1) % transformations.length];
    const [a, b] = t.point;
    const en = `Reflect the point (${x}, ${y}) across ${t.name}. What are the image coordinates?`;
    const es = `Refleja el punto (${x}, ${y}) sobre ${t.nameEs}. ¿Cuáles son las coordenadas de la imagen?`;
    const answer = [Q(a), Q(b)];
    if (ctx.type === "explain") {
      const checkExprs = [String(a), String(b)];
      const answerText = `(${a},${b})`;
      const wrongPoints = [[x, y], [y, x], [-x, y], [x, -y], [-y, x]]
        .filter(([u, v]) => u !== a || v !== b)
        .filter(([u, v], i, all) => all.findIndex(([p, q]) => p === u && q === v) === i)
        .slice(0, 2);
      return {
        q: bi(`Reflect (${x}, ${y}) across ${t.name}. Which image point is correct?`, `Refleja (${x}, ${y}) sobre ${t.nameEs}. ¿Qué punto de imagen es correcto?`),
        form: "choice",
        answer: answerText,
        options: wrongPoints.map(([u, v], i) => ({ text: `(${u},${v})`, es: `(${u}, ${v})`, why: i === 0 ? "keeps or changes the wrong coordinates" : "uses a rule for a different reflection line" })),
        check: { kind: "point", exprs: checkExprs, role: "answer" },
        hint: t.rule,
        explanation: `${t.rule} The image is ${answerText}.`,
        steps: ["Check which coordinate changes under this reflection.", "Apply the same rule to the point's coordinates.", `The image is ${answerText}.`],
      };
    }
    const wrong = [[x, y], [y, x], [-x, y], [x, -y], [-y, x]]
      .filter(([u, v]) => u !== a || v !== b)
      .filter(([u, v], i, all) => all.findIndex(([p, q]) => p === u && q === v) === i)
      .slice(0, 3)
      .map(([u, v], i) => ({ v: [Q(u), Q(v)], why: ["kept the original point", "swapped coordinates for a different reflection", "changed only one sign"][i] }));
    return {
      q: bi(en, es),
      form: "point",
      answer,
      check: { kind: "point", exprs: [String(a), String(b)], role: "answer" },
      wrong,
      hint: t.rule,
      explanation: `The image coordinates are (${a}, ${b}).`,
      steps: ["Identify the rule for the reflection line.", "Apply the rule to each coordinate.", `The image is (${a}, ${b}).`],
    };
  }

  const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
  const [a0, b0, c0] = pick(rng, triples);
  const scale = int(rng, 1, level + 1);
  const [a, b, c] = [a0 * scale, b0 * scale, c0 * scale];
  const findLeg = level === 5;
  const answer = findLeg ? a : c;
  const expr = findLeg ? `sqrt(${c}^2-${b}^2)` : `sqrt(${a}^2+${b}^2)`;
  const en = findLeg ? `A right triangle has a hypotenuse of ${c} units and one leg of ${b} units. Find the other leg.` : `A right triangle has legs of ${a} units and ${b} units. Find the hypotenuse.`;
  const es = findLeg ? `Un triángulo rectángulo tiene una hipotenusa de ${c} unidades y un cateto de ${b} unidades. Halla el otro cateto.` : `Un triángulo rectángulo tiene catetos de ${a} y ${b} unidades. Halla la hipotenusa.`;
  const rule = "Use the Pythagorean relationship: the sum of the leg squares equals the hypotenuse square.";
  if (ctx.type === "explain") {
    const choices = [
      { en: "Square the legs, add them, then take the square root.", es: "Elevar los catetos al cuadrado, sumarlos y luego sacar la raíz cuadrada.", why: "applies the Pythagorean relationship" },
      { en: "Add the two leg lengths.", es: "Sumar las longitudes de los dos catetos.", why: "adds lengths without using the squares" },
      { en: "Square the hypotenuse and subtract both legs.", es: "Elevar la hipotenusa al cuadrado y restar ambos catetos.", why: "uses the wrong side as the starting quantity" },
    ];
    return explainChoice(ctx, { en, es, expr, answer, choices, correct: choices[0], rule });
  }
  const storyEn = findLeg
    ? `A right-triangle support has a ${c}-unit hypotenuse and a ${b}-unit leg. How long is the other leg?`
    : `A support cable forms a right triangle with legs ${a} and ${b} units. How long is the cable?`;
  const storyEs = findLeg
    ? `Un soporte triangular rectángulo tiene una hipotenusa de ${c} unidades y un cateto de ${b} unidades. ¿Cuánto mide el otro cateto?`
    : `Un cable de soporte forma un triángulo rectángulo con catetos de ${a} y ${b} unidades. ¿Cuánto mide el cable?`;
  return numeric(ctx, { en, es, expr, answer, unit: "units", rule, storyEn, storyEs });
}

export const family = {
  id: "geometry",
  skills: SPECS,
  types: {
    compute: build,
    "real-world": build,
    "word-problem": build,
    explain: build,
  },
  range: {},
  supports: {},
};
