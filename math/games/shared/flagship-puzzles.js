/* Pure mission models: every route has a valid construction; native scoring stays separate.
 *
 * create(id, seed, route, lang?) returns
 *   { text, fields, action, check(values), explain(values), draw(values),
 *     hint,                 // tier-1 method hint (kept for older callers)
 *     hints: [method, step, demo],   // earned help ladder; demo shows one valid build
 *     diagnose(values),     // targeted feedback on a miss; never states the answer
 *     describe(values) }    // plain-language reading of the live model (screen readers)
 * lang defaults to localStorage['nt-lang'] ('es' → Spanish, anything else → English).
 * The live model shows the GIVENS and the student's construction; it never computes
 * the quantity the student is asked to find. */
(() => {
  "use strict";
  const storedLang = () => {
    try {
      return window.localStorage?.getItem("nt-lang") === "es" ? "es" : "en";
    } catch {
      return "en";
    }
  };
  const esc = (text) =>
    String(text).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const svg = (content, desc) =>
    `<svg viewBox="0 0 640 240" role="img" aria-label="${esc(desc)}">${content}</svg>`;
  const label = (x, y, text, color = "#eef5fb", size = 19) =>
    `<text x="${x}" y="${y}" fill="${color}" font-family="system-ui,sans-serif" font-size="${size}" text-anchor="middle">${esc(text)}</text>`;
  const clean = (value) => (Number.isFinite(value) ? value : 0);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  // A measuring tank split into `parts` equal sections, filled to amount/total.
  const tank = (x, amount, total, color, parts = 0, y = 35, h = 150) => {
    const fill = (h - 8) * clamp01(amount / total);
    let ticks = "";
    for (let i = 1; i < parts; i++)
      ticks += `<path d="M${x + 4} ${y + h - 4 - ((h - 8) * i) / parts}h92" stroke="#acc7d4" stroke-opacity=".45" stroke-dasharray="4 4"/>`;
    return `<rect x="${x}" y="${y}" width="100" height="${h}" rx="14" fill="#14283b" stroke="#acc7d4" stroke-width="2"/><rect x="${x + 4}" y="${y + h - 4 - fill}" width="92" height="${fill}" rx="8" fill="${color}" opacity=".8"/>${ticks}`;
  };
  const field = (name, max = 20, min = 0, value = min) => ({ label: name, min, max, value });
  const minus = (a, b) => `${a} − ${b}`;

  function buildPuzzle(id, seed, route, language) {
    const es = (language || storedLang()) === "es";
    const L = (en, sp) => (es ? sp : en);
    const n = seed % 4,
      variation = Math.floor(seed / 4) % 3;

    if (id === "kitchen") {
      const eighths = 5 + ((n + route + variation) % 3);
      const total = (a, b) => a + 2 * b;
      return {
        text: L(
          `Blend exactly ${eighths}/8 liter of lantern nectar. Use BOTH berry scoops (1/8 liter each) and citrus scoops (1/4 liter each).`,
          `Mezcla exactamente ${eighths}/8 de litro de néctar para el farol. Usa cucharadas de baya (1/8 de litro cada una) Y cucharadas de cítrico (1/4 de litro cada una).`,
        ),
        fields: [
          field(L("Berry scoops · 1/8 L", "Cucharadas de baya · 1/8 L"), 8),
          field(L("Citrus scoops · 1/4 L", "Cucharadas de cítrico · 1/4 L"), 4),
        ],
        action: L("Fill the lantern", "Llenar el farol"),
        check: ([a, b]) => a > 0 && b > 0 && total(a, b) === eighths,
        hints: [
          L(
            "Rename each 1/4 liter in eighths: 1/4 = 2/8. Then add the eighths, and use some of each fruit.",
            "Escribe cada 1/4 de litro en octavos: 1/4 = 2/8. Luego suma los octavos y usa un poco de cada fruta.",
          ),
          L(
            `1 citrus scoop = 2/8 L and 2 citrus scoops = 4/8 L. For each choice, how many 1/8-L berry scoops fill the rest of ${eighths}/8 L?`,
            `1 cucharada de cítrico = 2/8 L y 2 cucharadas = 4/8 L. Para cada opción, ¿cuántas cucharadas de baya de 1/8 L completan ${eighths}/8 L?`,
          ),
          L(
            `One way: 1 citrus scoop (2/8 L) + ${eighths - 2} berry scoops (${eighths - 2}/8 L) = ${eighths}/8 L. Set those amounts, then fill the lantern.`,
            `Una forma: 1 cucharada de cítrico (2/8 L) + ${eighths - 2} cucharadas de baya (${eighths - 2}/8 L) = ${eighths}/8 L. Pon esas cantidades y llena el farol.`,
          ),
        ],
        diagnose: ([a, b]) => {
          if (!a || !b)
            return L(
              "Use some of each fruit: at least 1 berry scoop and 1 citrus scoop.",
              "Usa un poco de cada fruta: al menos 1 cucharada de baya y 1 de cítrico.",
            );
          if (a + b === eighths)
            return L(
              "You counted each citrus scoop as 1/8 L. A citrus scoop is 1/4 L, which is 2/8 L.",
              "Contaste cada cucharada de cítrico como 1/8 L. Una cucharada de cítrico es 1/4 L, que es 2/8 L.",
            );
          return total(a, b) > eighths
            ? L(
                `Too full: that blend is more than ${eighths}/8 L.`,
                `Demasiado: esa mezcla es más de ${eighths}/8 L.`,
              )
            : L(
                `Not full yet: that blend is less than ${eighths}/8 L.`,
                `Todavía falta: esa mezcla es menos de ${eighths}/8 L.`,
              );
        },
        explain: ([a, b]) =>
          L(
            `${a}/8 + ${b}/4 = ${a}/8 + ${2 * b}/8 = ${eighths}/8 liter.`,
            `${a}/8 + ${b}/4 = ${a}/8 + ${2 * b}/8 = ${eighths}/8 de litro.`,
          ),
        describe: (values) => {
          const [a, b] = values.map(clean);
          return L(
            `Berry tank: ${a} scoops of 1/8 liter. Citrus tank: ${b} scoops of 1/4 liter. The lantern needs ${eighths}/8 liter.`,
            `Tanque de baya: ${a} cucharadas de 1/8 de litro. Tanque de cítrico: ${b} cucharadas de 1/4 de litro. El farol necesita ${eighths}/8 de litro.`,
          );
        },
        draw(values) {
          const [a, b] = values.map(clean);
          const lantern = `<path d="M470 45h80l18 40v90l-18 14h-80l-18-14V85Z" fill="#1b3346" stroke="#f3d38b" stroke-width="2"/><path d="M452 ${189 - (146 * eighths) / 8}h116" stroke="#f3d38b" stroke-width="3" stroke-dasharray="7 5"/>`;
          return svg(
            tank(80, a, 8, "#ec8ca9", 8) +
              tank(240, b, 4, "#f5c46c", 4) +
              lantern +
              label(130, 215, L(`Berry: ${a} × 1/8 L`, `Baya: ${a} × 1/8 L`)) +
              label(290, 215, L(`Citrus: ${b} × 1/4 L`, `Cítrico: ${b} × 1/4 L`)) +
              label(510, 215, L(`Lantern line: ${eighths}/8 L`, `Línea del farol: ${eighths}/8 L`)),
            this.describe(values),
          );
        },
      };
    }

    if (id === "foundry") {
      const whole = 2 + n,
        den = route ? 4 : 2 + ((n + variation) % 3),
        num = route ? 2 : 1,
        pieces = (whole * den) / num;
      return {
        text: L(
          `A bridge needs pieces ${num}/${den} meter long, cut from ${whole} meters of cable. Set the equal cuts in each meter, then load every complete piece into the bridge kit.`,
          `Un puente necesita piezas de ${num}/${den} de metro, cortadas de ${whole} metros de cable. Elige los cortes iguales de cada metro y luego carga todas las piezas completas.`,
        ),
        fields: [
          field(L("Equal divisions in each meter", "Partes iguales en cada metro"), 8, 1),
          field(
            L(
              `Pieces to load · ${num}/${den} m each`,
              `Piezas para cargar · ${num}/${den} m cada una`,
            ),
            30,
          ),
        ],
        action: L("Forge the bridge kit", "Forjar el kit del puente"),
        check: ([a, b]) => a === den && b === pieces,
        hints: [
          L(
            `Partition each meter using the denominator of ${num}/${den}. Each finished piece uses ${num} of those divisions. Count how many pieces fit in the whole cable.`,
            `Divide cada metro según el denominador de ${num}/${den}. Cada pieza usa ${num} de esas partes. Cuenta cuántas piezas caben en todo el cable.`,
          ),
          L(
            `With ${den} divisions in each meter, ${whole} meters have ${whole} × ${den} = ${whole * den} divisions. How many groups of ${num} is that?`,
            `Con ${den} partes en cada metro, ${whole} metros tienen ${whole} × ${den} = ${whole * den} partes. ¿Cuántos grupos de ${num} hay?`,
          ),
          L(
            `${whole} ÷ ${num}/${den}: ${whole * den} divisions ÷ ${num} = ${pieces} pieces. Set ${den} divisions and ${pieces} pieces.`,
            `${whole} ÷ ${num}/${den}: ${whole * den} partes ÷ ${num} = ${pieces} piezas. Pon ${den} partes y ${pieces} piezas.`,
          ),
        ],
        diagnose: ([a, b]) => {
          if (a !== den)
            return L(
              `Look at the denominator of ${num}/${den}: it tells how many equal parts make 1 meter.`,
              `Mira el denominador de ${num}/${den}: dice cuántas partes iguales forman 1 metro.`,
            );
          if (num > 1 && b === whole * den)
            return L(
              `You counted divisions, but each piece uses ${num} divisions.`,
              `Contaste partes, pero cada pieza usa ${num} partes.`,
            );
          if (b <= whole)
            return L(
              "Each piece is shorter than 1 meter, so there are MORE pieces than meters.",
              "Cada pieza mide menos de 1 metro, así que hay MÁS piezas que metros.",
            );
          return b > pieces
            ? L(
                "The kit is longer than the cable. Some of those pieces do not exist.",
                "El kit es más largo que el cable. Algunas de esas piezas no existen.",
              )
            : L(
                "There is still cable left that could make complete pieces.",
                "Todavía queda cable para hacer piezas completas.",
              );
        },
        explain: () =>
          L(
            `${whole} ÷ ${num}/${den} = ${pieces} pieces.`,
            `${whole} ÷ ${num}/${den} = ${pieces} piezas.`,
          ),
        describe: (values) => {
          const [a, b] = values.map(clean);
          return L(
            `${whole} meters of cable, each meter cut into ${a} equal parts. ${b} pieces of ${num}/${den} meter marked on the cable.`,
            `${whole} metros de cable, cada metro cortado en ${a} partes iguales. ${b} piezas de ${num}/${den} de metro marcadas en el cable.`,
          );
        },
        draw(values) {
          const [a, b] = values.map(clean);
          const cuts = Math.max(1, Math.min(40, a * whole));
          const unit = 560 / cuts;
          let marks = "";
          // Pieces as the student loads them, measured in the divisions they chose.
          const pieceW = (560 * num) / den / whole;
          for (let i = 0; i < Math.min(b, 40); i++) {
            const x = 40 + i * pieceW;
            const over = x + pieceW > 600.5;
            marks += `<rect x="${Math.min(x, 640)}" y="88" width="${Math.max(0, Math.min(pieceW, 640 - x) - 2)}" height="54" rx="4" fill="${over ? "#e27b7b" : i % 2 ? "#f3bc6c" : "#d79a52"}" opacity=".85"/>`;
          }
          for (let i = 0; i <= cuts; i++)
            marks += `<path d="M${40 + i * unit} 80v70" stroke="#f6e1b4" stroke-width="${i % Math.max(1, a) === 0 ? 4 : 1.5}"/>`;
          for (let m = 0; m <= whole; m++)
            marks += label(40 + (560 * m) / whole, 172, `${m} m`, "#f6e1b4", 15);
          return svg(
            `<rect x="40" y="80" width="560" height="70" rx="8" fill="#715147"/>${marks}${label(320, 45, L(`${whole} meters of cable`, `${whole} metros de cable`))}${label(320, 212, L(`Bridge kit: ${b} pieces of ${num}/${den} m`, `Kit del puente: ${b} piezas de ${num}/${den} m`))}`,
            this.describe(values),
          );
        },
      };
    }

    if (id === "ratio") {
      const a = 2 + (n % 2),
        b = 3 + variation,
        k = 2 + route + (n % 2),
        cap = k * (a + b);
      return {
        text: L(
          `The reef filter uses mineral A : mineral B = ${a} : ${b}. Fill a ${cap}-scoop filter with the exact blend. Both minerals must scale by the same factor.`,
          `El filtro del arrecife usa mineral A : mineral B = ${a} : ${b}. Llena un filtro de ${cap} cucharadas con la mezcla exacta. Los dos minerales deben multiplicarse por el mismo factor.`,
        ),
        fields: [
          field(L("Mineral A scoops", "Cucharadas de mineral A"), 30),
          field(L("Mineral B scoops", "Cucharadas de mineral B"), 30),
        ],
        action: L("Restore the reef", "Restaurar el arrecife"),
        check: ([x, y]) => x * b === y * a && x + y === cap && x > 0,
        hints: [
          L(
            "Add the two parts to get one batch. Divide the filter size by that batch size, then scale BOTH minerals.",
            "Suma las dos partes para formar un lote. Divide el tamaño del filtro entre el lote y luego multiplica LOS DOS minerales.",
          ),
          L(
            `One batch is ${a} + ${b} = ${a + b} scoops. How many batches fill ${cap} scoops?`,
            `Un lote es ${a} + ${b} = ${a + b} cucharadas. ¿Cuántos lotes llenan ${cap} cucharadas?`,
          ),
          L(
            `${cap} ÷ ${a + b} = ${k} batches. A: ${k} × ${a} = ${k * a}. B: ${k} × ${b} = ${k * b}.`,
            `${cap} ÷ ${a + b} = ${k} lotes. A: ${k} × ${a} = ${k * a}. B: ${k} × ${b} = ${k * b}.`,
          ),
        ],
        diagnose: ([x, y]) => {
          const same = x > 0 && y > 0 && x * b === y * a;
          if (!x || !y) return L("Add both minerals.", "Agrega los dos minerales.");
          if (same)
            return L(
              `The ratio is right, but the filter holds exactly ${cap} scoops.`,
              `La razón es correcta, pero el filtro lleva exactamente ${cap} cucharadas.`,
            );
          if (x * a === y * b)
            return L(
              `Check the order: ${a} parts A for every ${b} parts B. Your amounts are switched.`,
              `Revisa el orden: ${a} partes de A por cada ${b} partes de B. Tus cantidades están al revés.`,
            );
          if (y - x === b - a)
            return L(
              "You added the same amount to both. Ratios grow by MULTIPLYING both parts by the same number.",
              "Sumaste la misma cantidad a los dos. Las razones crecen al MULTIPLICAR las dos partes por el mismo número.",
            );
          return L(
            `${x} : ${y} is not equivalent to ${a} : ${b}. Scale both parts by the same factor.`,
            `${x} : ${y} no es equivalente a ${a} : ${b}. Multiplica las dos partes por el mismo factor.`,
          );
        },
        explain: ([x, y]) =>
          L(
            `${x} : ${y} = ${a} : ${b} (both × ${x / a}), with ${x + y} scoops total.`,
            `${x} : ${y} = ${a} : ${b} (las dos × ${x / a}), con ${x + y} cucharadas en total.`,
          ),
        describe: (values) => {
          const [x, y] = values.map(clean);
          return L(
            `Mineral A: ${x} scoops. Mineral B: ${y} scoops. ${x + y} of ${cap} scoops loaded. Target ratio ${a} to ${b}.`,
            `Mineral A: ${x} cucharadas. Mineral B: ${y} cucharadas. ${x + y} de ${cap} cucharadas cargadas. Razón meta ${a} a ${b}.`,
          );
        },
        draw(values) {
          const [x, y] = values.map(clean);
          return svg(
            tank(130, x, cap, "#70d8d4", cap > 20 ? 0 : cap) +
              tank(410, y, cap, "#f0b778", cap > 20 ? 0 : cap) +
              label(180, 215, `A: ${x}`) +
              label(460, 215, `B: ${y}`) +
              label(
                320,
                25,
                L(`${x + y} / ${cap} scoops loaded`, `${x + y} / ${cap} cucharadas cargadas`),
              ) +
              label(320, 120, `${a} : ${b}`, "#cfe9e4", 26),
            this.describe(values),
          );
        },
      };
    }

    if (id === "discount") {
      const cells = 6 + 2 * n + 2 * route,
        budget = (cells / 2) * 15;
      const cost = (a, b) => 15 * a + 24 * b;
      return {
        text: L(
          `Deliver exactly ${cells} solar cells with a $${budget} budget. Amber packs hold 2 cells: $20 with 25% off. Violet packs hold 3 cells: $30 with 20% off. Build a cargo that fits the budget.`,
          `Entrega exactamente ${cells} celdas solares con un presupuesto de $${budget}. Los paquetes ámbar traen 2 celdas: $20 con 25% de descuento. Los paquetes violeta traen 3 celdas: $30 con 20% de descuento. Arma una carga que quepa en el presupuesto.`,
        ),
        fields: [
          field(L("Amber packs · 2 cells each", "Paquetes ámbar · 2 celdas cada uno"), 12),
          field(L("Violet packs · 3 cells each", "Paquetes violeta · 3 celdas cada uno"), 12),
        ],
        action: L("Send the supply cargo", "Enviar la carga"),
        check: ([a, b]) => 2 * a + 3 * b === cells && cost(a, b) <= budget,
        hints: [
          L(
            "Find each pack's SALE price first: 25% off means you pay 75% of the price. Then compare the price per cell, and check your cells and your total.",
            "Primero halla el precio CON descuento de cada paquete: 25% de descuento significa que pagas el 75% del precio. Luego compara el precio por celda y revisa tus celdas y tu total.",
          ),
          L(
            "Amber: 25% of $20 is $5, so an amber pack costs $15. Now find 20% of $30 for violet and the price of ONE cell in each pack.",
            "Ámbar: el 25% de $20 es $5, así que un paquete ámbar cuesta $15. Ahora halla el 20% de $30 para el violeta y el precio de UNA celda en cada paquete.",
          ),
          L(
            `Amber: $15 ÷ 2 = $7.50 per cell. Violet: $24 ÷ 3 = $8 per cell. Amber is cheaper: ${cells / 2} amber packs × $15 = $${budget}.`,
            `Ámbar: $15 ÷ 2 = $7.50 por celda. Violeta: $24 ÷ 3 = $8 por celda. Ámbar es más barato: ${cells / 2} paquetes ámbar × $15 = $${budget}.`,
          ),
        ],
        diagnose: ([a, b]) => {
          if (2 * a + 3 * b !== cells)
            return L(
              `That cargo holds ${2 * a + 3 * b} cells. The team needs exactly ${cells}.`,
              `Esa carga tiene ${2 * a + 3 * b} celdas. El equipo necesita exactamente ${cells}.`,
            );
          return L(
            `Right number of cells, but that cargo costs more than $${budget}. Compare the sale price of ONE cell in each pack.`,
            `Celdas correctas, pero esa carga cuesta más de $${budget}. Compara el precio con descuento de UNA celda en cada paquete.`,
          );
        },
        explain: ([a, b]) =>
          L(
            `Amber costs $15 per pack; violet costs $24. Your ${cells} cells cost $${cost(a, b)}.`,
            `El ámbar cuesta $15 por paquete; el violeta, $24. Tus ${cells} celdas cuestan $${cost(a, b)}.`,
          ),
        describe: (values) => {
          const [a, b] = values.map(clean);
          return L(
            `${a} amber packs and ${b} violet packs: ${2 * a + 3 * b} of ${cells} solar cells packed. Budget $${budget}.`,
            `${a} paquetes ámbar y ${b} paquetes violeta: ${2 * a + 3 * b} de ${cells} celdas empacadas. Presupuesto $${budget}.`,
          );
        },
        draw(values) {
          const [a, b] = values.map(clean);
          let boxes = "";
          for (let i = 0; i < Math.min(16, a + b); i++)
            boxes += `<rect x="${40 + (i % 8) * 71}" y="${95 + Math.floor(i / 8) * 52}" width="58" height="40" rx="5" fill="${i < a ? "#e6b86f" : "#b49bd8"}"/>${label(69 + (i % 8) * 71, 121 + Math.floor(i / 8) * 52, i < a ? "2" : "3", "#1c2433", 17)}`;
          const tags =
            `<rect x="40" y="40" width="270" height="36" rx="8" fill="#3b3222" stroke="#e6b86f"/>${label(175, 64, L("Amber · 2 cells · $20 · 25% off", "Ámbar · 2 celdas · $20 · 25% menos"), "#f6dcaa", 16)}` +
            `<rect x="330" y="40" width="270" height="36" rx="8" fill="#2f2840" stroke="#b49bd8"/>${label(465, 64, L("Violet · 3 cells · $30 · 20% off", "Violeta · 3 celdas · $30 · 20% menos"), "#e2d6f6", 16)}`;
          return svg(
            tags +
              boxes +
              label(
                320,
                26,
                L(
                  `${2 * a + 3 * b} / ${cells} solar cells packed`,
                  `${2 * a + 3 * b} / ${cells} celdas empacadas`,
                ),
                "#eef5fb",
                17,
              ) +
              label(
                320,
                228,
                L(
                  `Budget: $${budget} · work out your total before shipping`,
                  `Presupuesto: $${budget} · calcula tu total antes de enviar`,
                ),
                "#eef5fb",
                16,
              ),
            this.describe(values),
          );
        },
      };
    }

    if (id === "area") {
      const length = 3 + route,
        width = 3 + (n % 2),
        height = 2 + n + variation,
        area = length * width + 2 * height;
      const total = (w, h) => length * w + 2 * h;
      return {
        text: L(
          `Design a district covering exactly ${area} square units. Your rectangular hall has length ${length}. Your triangular garden has base 4. Choose the hall's width and the garden's perpendicular height; each must be at least 2.`,
          `Diseña un distrito que cubra exactamente ${area} unidades cuadradas. Tu salón rectangular mide ${length} de largo. Tu jardín triangular tiene base 4. Elige el ancho del salón y la altura perpendicular del jardín; cada uno debe ser al menos 2.`,
        ),
        fields: [
          field(L("Hall width", "Ancho del salón"), 8, 2),
          field(L("Garden height", "Altura del jardín"), 8, 2),
        ],
        action: L("Build the district", "Construir el distrito"),
        check: ([w, h]) => total(w, h) === area,
        hints: [
          L(
            "Add the rectangle area (length × width) and the triangle area (base × perpendicular height ÷ 2). Several designs may work.",
            "Suma el área del rectángulo (largo × ancho) y el área del triángulo (base × altura perpendicular ÷ 2). Varios diseños pueden funcionar.",
          ),
          L(
            `Triangle: 4 × height ÷ 2 = 2 × height. Choose a hall width, find ${length} × width, then see how much area is left for the garden.`,
            `Triángulo: 4 × altura ÷ 2 = 2 × altura. Elige un ancho, calcula ${length} × ancho y mira cuánta área queda para el jardín.`,
          ),
          L(
            `Width ${width}: ${length} × ${width} = ${length * width}. ${minus(area, length * width)} = ${2 * height} left, so the garden height is ${2 * height} ÷ 2 = ${height}.`,
            `Ancho ${width}: ${length} × ${width} = ${length * width}. ${minus(area, length * width)} = ${2 * height} quedan, así que la altura del jardín es ${2 * height} ÷ 2 = ${height}.`,
          ),
        ],
        diagnose: ([w, h]) => {
          if (length * w + 4 * h === area)
            return L(
              "Did you forget to halve the triangle? Triangle area = base × height ÷ 2.",
              "¿Olvidaste dividir el triángulo entre 2? Área del triángulo = base × altura ÷ 2.",
            );
          return total(w, h) > area
            ? L(
                `Your district covers more than ${area} square units.`,
                `Tu distrito cubre más de ${area} unidades cuadradas.`,
              )
            : L(
                `Your district covers less than ${area} square units.`,
                `Tu distrito cubre menos de ${area} unidades cuadradas.`,
              );
        },
        explain: ([w, h]) =>
          L(
            `${length} × ${w} + (4 × ${h}) ÷ 2 = ${area} square units.`,
            `${length} × ${w} + (4 × ${h}) ÷ 2 = ${area} unidades cuadradas.`,
          ),
        describe: (values) => {
          const [w, h] = values.map(clean);
          return L(
            `Hall: rectangle ${length} by ${w}. Garden: triangle with base 4 and height ${h}. Goal: ${area} square units.`,
            `Salón: rectángulo de ${length} por ${w}. Jardín: triángulo con base 4 y altura ${h}. Meta: ${area} unidades cuadradas.`,
          );
        },
        draw(values) {
          const [w, h] = values.map(clean);
          const u = 19;
          let grid = "";
          for (let i = 1; i < length; i++)
            grid += `<path d="M${70 + i * 30} ${205 - w * u}V205" stroke="#bcf2da" stroke-opacity=".35"/>`;
          for (let j = 1; j < w; j++)
            grid += `<path d="M70 ${205 - j * u}h${length * 30}" stroke="#bcf2da" stroke-opacity=".35"/>`;
          return svg(
            `<rect x="70" y="${205 - w * u}" width="${length * 30}" height="${w * u}" fill="#78bdb2" stroke="#bcf2da" stroke-width="3"/>${grid}<path d="M350 205H550L450 ${205 - h * u}Z" fill="#b7d984" stroke="#d9edb8" stroke-width="3"/><path d="M450 205V${205 - h * u}" stroke="#315947" stroke-width="2" stroke-dasharray="6 5"/>${label(140, 230, L(`Hall: ${length} × ${w}`, `Salón: ${length} × ${w}`))}${label(450, 230, L(`Garden: base 4, height ${h}`, `Jardín: base 4, altura ${h}`))}${label(320, 24, L(`Goal: ${area} square units`, `Meta: ${area} unidades cuadradas`))}`,
            this.describe(values),
          );
        },
      };
    }

    if (id === "expression") {
      const x = 2 + n + variation,
        goal = route ? x * 2 + 3 : (x + 2) * 3;
      const first = [(v) => v + 2, (v) => v * 2, (v) => v * v];
      const second = [(v) => v + 3, (v) => v * 3, (v) => v - 3];
      const firstSym = ["+ 2", "× 2", "²"],
        secondSym = ["+ 3", "× 3", "− 3"];
      const run = (a, b) => second[b]?.(first[a]?.(x) ?? NaN) ?? NaN;
      const write = (a, b) =>
        a === 2 ? `${x}² ${secondSym[b]}` : `(${x} ${firstSym[a]}) ${secondSym[b]}`;
      return {
        text: L(
          `Send input ${x} through two connected machines. The first machine changes the input; the second machine changes the FIRST machine's output. Rewire them to produce exactly ${goal} units of power.`,
          `Envía la entrada ${x} por dos máquinas conectadas. La primera cambia la entrada; la segunda cambia el resultado de la PRIMERA. Reconéctalas para producir exactamente ${goal} unidades de energía.`,
        ),
        fields: [
          {
            label: L("First machine", "Primera máquina"),
            options: L(
              ["Add 2", "Multiply by 2", "Square it (exponent 2)"],
              ["Sumar 2", "Multiplicar por 2", "Elevar al cuadrado (exponente 2)"],
            ),
          },
          {
            label: L("Second machine", "Segunda máquina"),
            options: L(
              ["Add 3", "Multiply by 3", "Subtract 3"],
              ["Sumar 3", "Multiplicar por 3", "Restar 3"],
            ),
          },
        ],
        action: L("Power the heart engine", "Encender el motor central"),
        check: ([a, b]) => run(a, b) === goal,
        hints: [
          L(
            "Follow the circuit from left to right. The second machine uses the FIRST machine's output, not the starting input.",
            "Sigue el circuito de izquierda a derecha. La segunda máquina usa el resultado de la PRIMERA, no la entrada inicial.",
          ),
          L(
            `Work backward from ${goal}: which second machine could make ${goal}? Undo it to find what the first machine must output, then compare with ${x}.`,
            `Trabaja hacia atrás desde ${goal}: ¿qué segunda máquina podría dar ${goal}? Deshazla para saber qué debe salir de la primera y compáralo con ${x}.`,
          ),
          route
            ? L(
                `${x} × 2 = ${2 * x}, then ${2 * x} + 3 = ${goal}. Choose "Multiply by 2", then "Add 3".`,
                `${x} × 2 = ${2 * x}, luego ${2 * x} + 3 = ${goal}. Elige "Multiplicar por 2" y luego "Sumar 3".`,
              )
            : L(
                `${x} + 2 = ${x + 2}, then ${x + 2} × 3 = ${goal}. Choose "Add 2", then "Multiply by 3".`,
                `${x} + 2 = ${x + 2}, luego ${x + 2} × 3 = ${goal}. Elige "Sumar 2" y luego "Multiplicar por 3".`,
              ),
        ],
        diagnose: ([a, b]) => {
          const out = run(a, b);
          // Applying the machines in the other order is the order-of-operations slip.
          const swapped = first[a] && second[b] ? first[a](second[b](x)) : NaN;
          if (swapped === goal)
            return L(
              `${write(a, b)} = ${out}, not ${goal}. Those machines would work in the OTHER order. The second machine must use the first machine's output.`,
              `${write(a, b)} = ${out}, no ${goal}. Esas máquinas funcionarían en el orden CONTRARIO. La segunda máquina usa el resultado de la primera.`,
            );
          return L(
            `Your circuit makes ${write(a, b)} = ${out}, not ${goal}.`,
            `Tu circuito da ${write(a, b)} = ${out}, no ${goal}.`,
          );
        },
        explain: ([a, b]) => `${write(a, b)} = ${goal}.`,
        describe: (values) => {
          const [a, b] = values.map(clean);
          return L(
            `Input ${x}. First machine ${firstSym[a]}. Second machine ${secondSym[b]}. Target output ${goal}.`,
            `Entrada ${x}. Primera máquina ${firstSym[a]}. Segunda máquina ${secondSym[b]}. Resultado meta ${goal}.`,
          );
        },
        draw(values) {
          const [a, b] = values.map(clean);
          return svg(
            `<path d="M65 120H575" stroke="#639fa0" stroke-width="9"/>${[150, 340, 535].map((cx, i) => `<circle cx="${cx}" cy="120" r="${i === 2 ? 43 : 59}" fill="#254a5b" stroke="#9cdbbf" stroke-width="5"/>`).join("")}${label(45, 90, String(x))}${label(150, 127, firstSym[a] || "?", "#eef5fb", 26)}${label(340, 127, secondSym[b] || "?", "#eef5fb", 26)}${label(535, 127, "?")}${label(320, 220, L(`Target output: ${goal}`, `Resultado meta: ${goal}`))}`,
            this.describe(values),
          );
        },
      };
    }

    if (id === "equation") {
      const weight = 4 + n + variation,
        offset = 3 + route * 3 + n,
        total = weight + offset;
      return {
        text: L(
          `The gate is balanced: x + ${offset} = ${total}. Remove the same number of counterweights from BOTH sides to isolate x. Then set the gate's hidden weight.`,
          `La puerta está en equilibrio: x + ${offset} = ${total}. Quita el mismo número de contrapesos de LOS DOS lados para dejar x sola. Luego escribe el peso escondido.`,
        ),
        fields: [
          field(L("Weights removed from left", "Pesos quitados a la izquierda"), 20),
          field(L("Weights removed from right", "Pesos quitados a la derecha"), 20),
          field(L("Hidden weight x", "Peso escondido x"), 20),
        ],
        action: L("Unlock the balanced gate", "Abrir la puerta equilibrada"),
        check: ([a, b, x]) => a === offset && b === offset && x === weight,
        hints: [
          L(
            "Keep equality by making the same change on both sides. Remove only the extra weights next to x, then read what remains on the right.",
            "Mantén la igualdad haciendo el mismo cambio en los dos lados. Quita solo los pesos que están junto a x y lee lo que queda a la derecha.",
          ),
          L(
            `x + ${offset} = ${total}. Removing ${offset} from the left leaves x alone. Remove ${offset} from the right too: ${minus(total, offset)} = ?`,
            `x + ${offset} = ${total}. Quitar ${offset} a la izquierda deja x sola. Quita ${offset} a la derecha también: ${minus(total, offset)} = ?`,
          ),
          L(
            `Remove ${offset} from both sides: x = ${minus(total, offset)} = ${weight}.`,
            `Quita ${offset} de los dos lados: x = ${minus(total, offset)} = ${weight}.`,
          ),
        ],
        diagnose: ([a, b, x]) => {
          if (a !== b)
            return L(
              `The gate tips! You removed ${a} on the left and ${b} on the right. Remove the same amount from both sides.`,
              `¡La puerta se inclina! Quitaste ${a} a la izquierda y ${b} a la derecha. Quita la misma cantidad de los dos lados.`,
            );
          if (a < offset)
            return L(
              `Balanced, but x still has ${offset - a} extra weight${offset - a === 1 ? "" : "s"} next to it.`,
              `En equilibrio, pero x todavía tiene ${offset - a} peso${offset - a === 1 ? "" : "s"} de más al lado.`,
            );
          if (a > offset)
            return L(
              `There are only ${offset} extra weights next to x. Removing more would take weight from x itself.`,
              `Solo hay ${offset} pesos de más junto a x. Quitar más le quitaría peso a x.`,
            );
          return L(
            `x is alone now. Check your x: does x + ${offset} equal ${total}?`,
            `Ahora x está sola. Revisa tu x: ¿x + ${offset} es igual a ${total}?`,
          );
        },
        explain: () =>
          L(
            `Subtract ${offset} from both sides: x = ${minus(total, offset)} = ${weight}.`,
            `Resta ${offset} de los dos lados: x = ${minus(total, offset)} = ${weight}.`,
          ),
        describe: (values) => {
          const [a, b, x] = values.map(clean);
          return L(
            `Left pan: x + ${offset - a}. Right pan: ${total - b}. ${a === b ? "The beam is level." : "The beam is tipped."} Hidden weight set to ${x}.`,
            `Platillo izquierdo: x + ${offset - a}. Platillo derecho: ${total - b}. ${a === b ? "La barra está nivelada." : "La barra está inclinada."} Peso escondido: ${x}.`,
          );
        },
        draw(values) {
          const [a, b, x] = values.map(clean);
          // Removing more from one side makes the OTHER side heavier.
          const tilt = Math.max(-12, Math.min(12, (b - a) * 3));
          return svg(
            `<path d="M320 85V205m-75 0h150" stroke="#b6ac87" stroke-width="7"/><g transform="rotate(${tilt} 320 85)"><path d="M100 85h440M160 85v75m320-75v75" stroke="#b6ac87" stroke-width="7"/><path d="M70 160h180l-25 24H95Zm320 0h180l-25 24H415Z" fill="#bca56c"/>${label(160, 140, `x + ${offset - a}`)}${label(480, 140, String(total - b))}</g>${label(320, 235, L(`Hidden weight: ${x}`, `Peso escondido: ${x}`))}`,
            this.describe(values),
          );
        },
      };
    }

    if (id === "variable") {
      const k = 2 + (n % 2),
        b = route ? 3 + variation : 0,
        min = 2 + (n % 3),
        maxY = k * (min + 2) + b;
      const rule = b ? `y = ${k}x + ${b}` : `y = ${k}x`;
      return {
        text: L(
          `Place a relay on the signal path ${rule}. Choose x at least ${min}; the relay's y-coordinate cannot be more than ${maxY}.`,
          `Coloca un relé en la ruta de señal ${rule}. Elige x de al menos ${min}; la coordenada y del relé no puede ser mayor que ${maxY}.`,
        ),
        fields: [
          field(L("Horizontal coordinate x", "Coordenada horizontal x"), 10),
          field(L("Vertical coordinate y", "Coordenada vertical y"), 35),
        ],
        action: L("Connect the relay", "Conectar el relé"),
        check: ([x, y]) => x >= min && y === k * x + b && y <= maxY,
        hints: [
          L(
            "Choose an allowed x first. Multiply it by the rate, then add the starting value to find y. Check the altitude limit.",
            "Primero elige una x permitida. Multiplícala por la tasa y suma el valor inicial para hallar y. Revisa el límite de altura.",
          ),
          L(
            `Try x = ${min}. Put it into ${rule}: y = ${k} × ${min}${b ? ` + ${b}` : ""}. Is that y at most ${maxY}?`,
            `Prueba x = ${min}. Ponla en ${rule}: y = ${k} × ${min}${b ? ` + ${b}` : ""}. ¿Esa y es como máximo ${maxY}?`,
          ),
          L(
            `x = ${min}: y = ${k} × ${min}${b ? ` + ${b}` : ""} = ${k * min + b}, which is under ${maxY}. Place the relay at (${min}, ${k * min + b}).`,
            `x = ${min}: y = ${k} × ${min}${b ? ` + ${b}` : ""} = ${k * min + b}, que está debajo de ${maxY}. Coloca el relé en (${min}, ${k * min + b}).`,
          ),
        ],
        diagnose: ([x, y]) => {
          if (x < min) return L(`x must be at least ${min}.`, `x debe ser al menos ${min}.`);
          if (b && y === k * x)
            return L(
              `Don't forget the starting value: the rule adds ${b}.`,
              `No olvides el valor inicial: la regla suma ${b}.`,
            );
          if (y === k * x + b)
            return L(
              `(${x}, ${y}) is on the path, but above the altitude limit of ${maxY}. Choose a smaller x.`,
              `(${x}, ${y}) está en la ruta, pero arriba del límite de ${maxY}. Elige una x menor.`,
            );
          if (y === x + k + b || y === (x + b) * k)
            return L(
              `Multiply x by ${k} first${b ? `, then add ${b}` : ""}.`,
              `Primero multiplica x por ${k}${b ? ` y luego suma ${b}` : ""}.`,
            );
          return L(
            `(${x}, ${y}) is not on the path. Put your x into ${rule} and compare with your y.`,
            `(${x}, ${y}) no está en la ruta. Pon tu x en ${rule} y compárala con tu y.`,
          );
        },
        explain: ([x, y]) => L(`(${x}, ${y}) lies on ${rule}.`, `(${x}, ${y}) está en ${rule}.`),
        describe: (values) => {
          const [x, y] = values.map(clean);
          return L(
            `Relay at (${x}, ${y}). Signal path ${rule}. x must be at least ${min}; y at most ${maxY}.`,
            `Relé en (${x}, ${y}). Ruta de señal ${rule}. x al menos ${min}; y como máximo ${maxY}.`,
          );
        },
        draw(values) {
          const [x, y] = values.map(clean);
          const px = (v) => 60 + v * 50,
            py = (v) => 200 - v * 5;
          let grid = "";
          for (let i = 0; i <= 10; i++)
            grid += `<path d="M${px(i)} 20v180" stroke="#7583b0" stroke-opacity=".2"/>${label(px(i), 216, String(i), "#b4c5e2", 12)}`;
          for (let i = 0; i <= 7; i++)
            grid += `<path d="M60 ${200 - i * 25}h500" stroke="#7583b0" stroke-opacity=".2"/>`;
          const zone = `<rect x="60" y="20" width="${px(min) - 60}" height="180" fill="#000" opacity=".25"/><path d="M60 ${py(maxY)}h500" stroke="#f2a07b" stroke-width="2" stroke-dasharray="8 6"/>${label(590, py(maxY) + 5, `y ${maxY}`, "#f2a07b", 13)}`;
          return svg(
            grid +
              zone +
              `<path d="M60 20v180h500" fill="none" stroke="#b4c5e2" stroke-width="2"/><circle cx="${px(x)}" cy="${py(y)}" r="11" fill="#c8b3f2"/>` +
              label(
                330,
                236,
                L(`Relay (${x}, ${y}) · ${rule}`, `Relé (${x}, ${y}) · ${rule}`),
                "#eef5fb",
                16,
              ),
            this.describe(values),
          );
        },
      };
    }

    if (id === "volume") {
      const total = [12, 24, 36, 48][(n + variation) % 4];
      const fits = (l, w, h) => (route ? l >= h && w >= h : h >= l && h >= w);
      let demo = [1, 1, total];
      for (let l = 1; l <= 8; l++)
        for (let w = 1; w <= 8; w++)
          for (let h = 1; h <= 8; h++)
            if (l * w * h === total && fits(l, w, h) && demo[2] === total) demo = [l, w, h];
      return {
        text: L(
          `Build an archive pod with volume ${total} cubic units. The ${route ? "wide" : "tall"} cargo bay requires ${route ? "length and width both at least as large as height" : "height at least as large as BOTH length and width"}. Choose dimensions from 1 to 8.`,
          `Construye una cápsula con volumen de ${total} unidades cúbicas. La bodega ${route ? "ancha" : "alta"} pide ${route ? "que el largo y el ancho sean al menos tan grandes como la altura" : "que la altura sea al menos tan grande como el largo Y el ancho"}. Elige medidas del 1 al 8.`,
        ),
        fields: [
          field(L("Length", "Largo"), 8, 1),
          field(L("Width", "Ancho"), 8, 1),
          field(L("Height", "Altura"), 8, 1),
        ],
        action: L("Seal the archive pod", "Sellar la cápsula"),
        check: ([l, w, h]) => l * w * h === total && fits(l, w, h),
        hints: [
          L(
            "Find three factors of the target volume. Then turn the box so it also fits the cargo bay's shape rule.",
            "Busca tres factores del volumen meta. Luego gira la caja para que también cumpla la regla de forma de la bodega.",
          ),
          L(
            `Pick a height, then find a length and width whose product is ${total} ÷ height. Example: if height = 2, length × width must be ${total / 2}.`,
            `Elige una altura y busca un largo y un ancho cuyo producto sea ${total} ÷ altura. Ejemplo: si la altura = 2, largo × ancho debe ser ${total / 2}.`,
          ),
          L(
            `One pod that fits: ${demo[0]} × ${demo[1]} × ${demo[2]} = ${total}, and its shape follows the ${route ? "wide" : "tall"} bay rule.`,
            `Una cápsula que cabe: ${demo[0]} × ${demo[1]} × ${demo[2]} = ${total}, y su forma cumple la regla de la bodega ${route ? "ancha" : "alta"}.`,
          ),
        ],
        diagnose: ([l, w, h]) => {
          if (l * w * h !== total)
            return L(
              `${l} × ${w} × ${h} = ${l * w * h} cubic units, not ${total}.`,
              `${l} × ${w} × ${h} = ${l * w * h} unidades cúbicas, no ${total}.`,
            );
          return route
            ? L(
                "The volume is right! Turn the pod: the wide bay needs length and width at least as large as height.",
                "¡El volumen es correcto! Gira la cápsula: la bodega ancha pide largo y ancho al menos tan grandes como la altura.",
              )
            : L(
                "The volume is right! Turn the pod: the tall bay needs height at least as large as length and width.",
                "¡El volumen es correcto! Gira la cápsula: la bodega alta pide altura al menos tan grande como el largo y el ancho.",
              );
        },
        explain: ([l, w, h]) =>
          L(
            `${l} × ${w} × ${h} = ${total} cubic units, and the pod fits its bay.`,
            `${l} × ${w} × ${h} = ${total} unidades cúbicas, y la cápsula cabe en su bodega.`,
          ),
        describe: (values) => {
          const [l, w, h] = values.map(clean);
          return L(
            `Pod: length ${l}, width ${w}, height ${h}. Target volume ${total} cubic units, ${route ? "wide" : "tall"} bay.`,
            `Cápsula: largo ${l}, ancho ${w}, altura ${h}. Volumen meta ${total} unidades cúbicas, bodega ${route ? "ancha" : "alta"}.`,
          );
        },
        draw(values) {
          const [l, w, h] = values.map(clean);
          const x = 260,
            y = 210,
            dx = l * 22,
            dy = w * 12,
            dz = h * 17;
          return svg(
            `<path d="M${x} ${y}l${dx} -${dx / 2}v-${dz}l-${dx} ${dx / 2}Z" fill="#4898aa" stroke="#9de5dc" stroke-width="2"/><path d="M${x} ${y}l-${dy} -${dy / 2}v-${dz}l${dy} ${dy / 2}Z" fill="#306c91" stroke="#9de5dc" stroke-width="2"/><path d="M${x} ${y - dz}l${dx} -${dx / 2}l-${dy} -${dy / 2}l-${dx} ${dx / 2}Z" fill="#94cdc6" stroke="#c4eae0" stroke-width="2"/>${label(500, 80, L(`L ${l} · W ${w} · H ${h}`, `L ${l} · A ${w} · Al ${h}`))}${label(500, 115, L(`Target: ${total} units³`, `Meta: ${total} unidades³`))}`,
            this.describe(values),
          );
        },
      };
    }

    // stats — the unusual score stays IN the data set while the median is found.
    const base = 4 + n + variation + route,
      gap = (n + variation) % 3;
    const ordered = [base, base + 2, base + 2 + gap, base + 4 + gap];
    const turn = (n + variation + route) % 4;
    const data = [...ordered.slice(turn), ...ordered.slice(0, turn), base + 22];
    const median = base + 2 + gap;
    const outlier = 4;
    const sortedText = [...data].sort((p, q) => p - q).join(", ");
    return {
      text: L(
        `Scout these five practice scores: ${data.join(", ")}. Flag the unusually high score for investigation, then find the median of ALL five scores. Keep every score in the data set while you calculate.`,
        `Revisa estos cinco puntajes de práctica: ${data.join(", ")}. Marca el puntaje inusualmente alto para investigarlo y luego halla la mediana de LOS CINCO puntajes. Deja todos los puntajes en el conjunto de datos al calcular.`,
      ),
      fields: [
        {
          label: L("Score to investigate", "Puntaje para investigar"),
          options: data.map((v, i) => L(`Practice ${i + 1}: ${v}`, `Práctica ${i + 1}: ${v}`)),
        },
        field(L("Median of all five scores", "Mediana de los cinco puntajes"), 40),
      ],
      action: L("Submit the scouting report", "Enviar el informe"),
      check: ([index, m]) => index === outlier && m === median,
      hints: [
        L(
          "The median is the middle score after you order ALL five values. The unusual score is far from the others; it stays in the data.",
          "La mediana es el puntaje del medio después de ordenar LOS CINCO valores. El puntaje inusual está lejos de los demás y se queda en los datos.",
        ),
        L(
          `Write the scores from least to greatest: ${sortedText}. Which score is in the middle position?`,
          `Escribe los puntajes de menor a mayor: ${sortedText}. ¿Qué puntaje está en la posición del medio?`,
        ),
        L(
          `Ordered: ${sortedText}. The 3rd score, ${median}, is the median. ${base + 22} is far above the rest, so flag Practice ${outlier + 1}.`,
          `Ordenados: ${sortedText}. El 3.er puntaje, ${median}, es la mediana. ${base + 22} está muy por encima del resto, así que marca la Práctica ${outlier + 1}.`,
        ),
      ],
      diagnose: ([index, m]) => {
        if (index !== outlier)
          return L(
            `${data[index]} is close to the other scores. Which score is far from the rest?`,
            `${data[index]} está cerca de los otros puntajes. ¿Qué puntaje está lejos del resto?`,
          );
        const rest = [...ordered].sort((p, q) => p - q);
        if (m !== median && m * 2 === rest[1] + rest[2])
          return L(
            "Keep all five scores: the unusual score still counts when you find the median.",
            "Usa los cinco puntajes: el puntaje inusual también cuenta para la mediana.",
          );
        if (m !== median && m === data[2])
          return L(
            "That is the middle of the list as written. Put the scores in order first.",
            "Ese es el del medio en la lista sin ordenar. Primero ordena los puntajes.",
          );
        const sum = data.reduce((s, v) => s + v, 0);
        if (m !== median && (m === Math.round(sum / 5) || m === Math.floor(sum / 5)))
          return L(
            "That is close to the mean. The median is the middle value after ordering.",
            "Eso se acerca a la media. La mediana es el valor del medio después de ordenar.",
          );
        return L(
          "The flagged score is right. Now order all five scores and find the middle one.",
          "El puntaje marcado es correcto. Ahora ordena los cinco puntajes y busca el del medio.",
        );
      },
      explain: () =>
        L(
          `Ordered: ${sortedText}. ${median} is the middle score. The score ${base + 22} is unusually high and deserves investigation.`,
          `Ordenados: ${sortedText}. ${median} es el puntaje del medio. El puntaje ${base + 22} es inusualmente alto y merece investigarse.`,
        ),
      describe: (values) => {
        const [index, m] = values.map(clean);
        return L(
          `Bar graph of five scores: ${data.join(", ")}. Flagged: Practice ${index + 1}. Proposed median: ${m}.`,
          `Gráfica de barras de cinco puntajes: ${data.join(", ")}. Marcado: Práctica ${index + 1}. Mediana propuesta: ${m}.`,
        );
      },
      draw(values) {
        const [index, m] = values.map(clean);
        return svg(
          data
            .map(
              (v, i) =>
                `<rect x="${65 + i * 105}" y="${205 - v * 5}" width="65" height="${v * 5}" rx="5" fill="${index === i ? "#f2c178" : "#76b7c9"}"/>${label(97 + i * 105, 230, String(v))}`,
            )
            .join("") +
            label(
              320,
              25,
              L(
                `All 5 scores kept · proposed median ${m}`,
                `Los 5 puntajes se quedan · mediana propuesta ${m}`,
              ),
            ),
          this.describe(values),
        );
      },
    };
  }

  function create(id, seed, route, language) {
    const puzzle = buildPuzzle(id, seed, route, language);
    puzzle.hint = puzzle.hints[0];
    const diagnose = puzzle.diagnose;
    // Fall back to the method hint whenever a diagnosis has nothing specific to say.
    puzzle.diagnose = (values) => (diagnose && diagnose(values)) || puzzle.hints[0];
    return puzzle;
  }

  window.FlagshipPuzzles = Object.freeze({ create });
})();
