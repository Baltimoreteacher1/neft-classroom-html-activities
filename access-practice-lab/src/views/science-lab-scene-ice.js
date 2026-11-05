// Science Investigation Lab scenes: the ice-cover family (Grades 6-8) and its transfer, cocoa cups.
// Each family draws one test "unit" in a 160 x 170 box from a row's conditions, a hero for the phenomenon, object
// icons for the variables, and neutral hotspot observations. The hero is the whole investigation bench, and it never
// shows which condition wins: the story's cube sits under a plain cloth that is none of the case's materials, the
// test cubes under foil, paper and wool are drawn just set out (all the same size), and every cocoa cup steams alike.
import {
  C,
  ln,
  notebook,
  part,
  room,
  shelf,
  sparkles,
  sun,
  thermometer,
  windowFrame,
} from "./science-lab-scene-kit.js";

// ── ice under a cover ────────────────────────────────────────────────────────
const COVERS = {
  foil: { fill: C.foil, line: C.foilLine, tex: "zig" },
  paper: { fill: C.paper, line: C.paperLine, tex: "dot" },
  wool: { fill: C.wool, line: C.woolLine, tex: "knit" },
  cloth: { fill: C.cloth, line: C.clothLine, tex: "line" },
};

function texture(kind, line, x0, x1, y0, y1) {
  const out = [];
  for (let y = y0; y <= y1; y += 12)
    for (let x = x0; x <= x1; x += 14) {
      if (kind === "zig")
        out.push(`<path d="M${x} ${y}l4 -4l4 4l4 -4" fill="none" ${ln(1.6, line)}/>`);
      else if (kind === "dot") out.push(`<circle cx="${x + 4}" cy="${y}" r="1.6" fill="${line}"/>`);
      else if (kind === "knit")
        out.push(`<path d="M${x} ${y - 4}l4 5l4 -5" fill="none" ${ln(1.8, line)}/>`);
      else out.push(`<path d="M${x} ${y}h9" ${ln(1.6, line)}/>`);
    }
  return out.join("");
}

/** A cover draped over a cube that sits on a tray at y=142; `layers` extra outlines make it visibly thicker. */
function coverShape(material, layers, cx = 80, w = 36) {
  const m = COVERS[material] || COVERS.cloth;
  const dome = (pad) =>
    `M${cx - w - pad} 142 C${cx - w - pad} ${84 - pad} ${cx + w + pad} ${84 - pad} ${cx + w + pad} 142 Z`;
  const extra = [];
  for (let i = layers - 1; i >= 1; i--)
    extra.push(
      `<path d="${dome(i * 6)}" fill="${m.fill}" fill-opacity="0.55" ${ln(2.4, m.line)}/>`,
    );
  return `${extra.join("")}<path d="${dome(0)}" fill="${m.fill}" fill-opacity="0.62" ${ln()}/><g opacity="0.8">${texture(m.tex, m.line, cx - 24, cx + 16, 104, 136)}</g>`;
}

const cube = (x, y, s) =>
  `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="8" fill="${C.ice}" ${ln()}/><path d="M${x + 8} ${y + 10}h${s * 0.3}M${x + 8} ${y + 18}h${s * 0.15}" ${ln(3.5, "#ffffff")}/>`;

function iceUnit(conds, mode) {
  const layers = Number(conds.layers) || 1;
  const tray = `<rect x="16" y="140" width="128" height="13" rx="6.5" fill="${C.tray}" ${ln()}/>`;
  const puddle = part(
    mode,
    `<ellipse cx="80" cy="140" rx="56" ry="9" fill="${C.water}" ${ln(2.4)}/>`,
    { t0: "scale(0.25)", t: "scale(1)", o0: 0, o: 1, origin: "50% 50%", d: 0.15 },
  );
  const ice = part(mode, cube(56, 92, 48), { t: "scale(0.08, 0.04)", o: 0 });
  const cover = conds.cover
    ? part(mode, coverShape(conds.cover, layers), { t: "scale(1.06, 0.42)", d: 0.25 })
    : "";
  return `${tray}${puddle}${ice}${cover}`;
}

const ICE_HOTSPOTS = [
  {
    id: "window",
    x: 15,
    y: 22,
    label: { en: "The window", es: "La ventana" },
    notice: {
      en: "Sun comes in through the window on a warm afternoon.",
      es: "El sol entra por la ventana en una tarde cálida.",
    },
    wonder: {
      en: "Does the warm air in the room reach the ice?",
      es: "¿El aire cálido del salón llega al hielo?",
    },
  },
  {
    id: "puddle",
    x: 9,
    y: 68,
    label: { en: "The bare tray", es: "La bandeja sin cubrir" },
    notice: {
      en: "The bare cube is now a puddle on its tray.",
      es: "El cubo sin cubrir ahora es un charco en su bandeja.",
    },
    wonder: {
      en: "How many minutes did the bare cube take to melt?",
      es: "¿Cuántos minutos tardó en derretirse el cubo sin cubrir?",
    },
  },
  {
    id: "wrapped",
    x: 26,
    y: 58,
    label: { en: "The wrapped cube", es: "El cubo envuelto" },
    notice: {
      en: "The wrapped cube still has ice inside its cover.",
      es: "El cubo envuelto todavía tiene hielo dentro de su cubierta.",
    },
    wonder: {
      en: "Would a different cover keep the ice frozen longer?",
      es: "¿Otra cubierta mantendría el hielo congelado por más tiempo?",
    },
  },
  {
    id: "trays",
    x: 62,
    y: 58,
    label: { en: "The test trays", es: "Las bandejas de prueba" },
    notice: {
      en: "Three more cubes of the same size sit under foil, paper towel and wool. They were just set out.",
      es: "Otros tres cubos del mismo tamaño están bajo papel aluminio, toalla de papel y lana. Se acaban de preparar.",
    },
    wonder: {
      en: "Would a thicker cover make a difference?",
      es: "¿Una cubierta más gruesa haría una diferencia?",
    },
  },
  {
    id: "notebook",
    x: 90,
    y: 72,
    label: { en: "The notebook", es: "El cuaderno" },
    notice: {
      en: "An open notebook has an empty table, ready for results.",
      es: "Un cuaderno abierto tiene una tabla vacía, lista para los resultados.",
    },
    wonder: {
      en: "What should we write down for each tray?",
      es: "¿Qué deberíamos anotar para cada bandeja?",
    },
  },
];

const TRAY = `<rect x="16" y="140" width="128" height="13" rx="6.5" fill="${C.tray}" ${ln()}/>`;
const at = (x, inner, k = 0.84) => `<g transform="translate(${x} ${300 - 153 * k}) scale(${k})">${inner}</g>`;

/** A folded swatch of cover material on the shelf. */
const swatch = (x, m) =>
  `<rect x="${x}" y="116" width="46" height="34" rx="6" fill="${COVERS[m].fill}" ${ln()}/><path d="M${x} 128 H${x + 46}" ${ln(2, COVERS[m].line)}/>${texture(COVERS[m].tex, COVERS[m].line, x + 6, x + 36, 138, 146)}`;

function iceHero() {
  const puddle = at(
    -8,
    `${TRAY}<ellipse cx="80" cy="140" rx="58" ry="9" fill="${C.water}" ${ln(2.4)}/><circle cx="24" cy="128" r="3.5" fill="${C.water}" ${ln(1.8)}/><circle cx="136" cy="131" r="2.5" fill="${C.water}" ${ln(1.8)}/>`,
  );
  const wrapped = at(92, `${TRAY}${cube(58, 98, 44)}${coverShape("cloth", 1)}`);
  const tests = ["foil", "paper", "wool"]
    .map((m, i) => at(222 + i * 108, `${TRAY}${cube(58, 98, 44)}${coverShape(m, 1)}`))
    .join("");
  const cooler = `<rect x="552" y="112" width="66" height="38" rx="6" fill="${C.sky}" ${ln()}/><rect x="548" y="104" width="74" height="12" rx="5" fill="${C.lid}" ${ln()}/>${cube(560, 88, 18)}${cube(584, 92, 16)}`;
  return `${room(640, 360, 282)}${windowFrame(36, 30, 150, 140)}${sun(86, 76, 20)}${thermometer(214, 42, 104)}${shelf(372, 150, 256)}${swatch(392, "foil")}${swatch(446, "paper")}${swatch(500, "wool")}${cooler}${puddle}${wrapped}${tests}${notebook(528, 300)}${sparkles([
    [262, 64, "+"],
    [330, 40, "."],
    [610, 54, "+"],
  ])}`;
}

export const ICE = {
  id: "ice-cover",
  vb: "0 58 160 102",
  hero: () => ({
    svg: iceHero(),
    title: {
      en: "An ice investigation bench in a warm classroom",
      es: "Una mesa de investigación con hielo en un salón cálido",
    },
    desc: {
      en: "A sunny window and a thermometer on the wall. On the table, a bare tray holds only a puddle, and a cube under a cloth cover is still ice. Next to them, three more cubes of the same size sit under aluminum foil, paper towel and wool covers, just set out. A shelf holds folded cover materials and a cooler of ice cubes, and an open notebook waits for results.",
      es: "Una ventana con sol y un termómetro en la pared. En la mesa, una bandeja sin cubrir solo tiene un charco, y un cubo bajo una cubierta de tela todavía es hielo. A su lado, otros tres cubos del mismo tamaño están bajo cubiertas de papel aluminio, toalla de papel y lana, recién preparados. Un estante tiene materiales doblados y una hielera con cubos, y un cuaderno abierto espera los resultados.",
    },
  }),
  hotspots: ICE_HOTSPOTS,
  unit: (conds, mode) => iceUnit(conds, mode),
  say: {
    start: {
      en: "an ice cube on a tray under its cover",
      es: "un cubo de hielo en una bandeja bajo su cubierta",
    },
    end: { en: "the ice has melted into a puddle", es: "el hielo se derritió en un charco" },
  },
  varIcon(varId, valueId) {
    if (varId === "layers") {
      const n = Number(valueId) || 3;
      return Array.from(
        { length: n },
        (_, i) =>
          `<rect x="10" y="${40 - i * 10}" width="44" height="9" rx="4" fill="${C.wool}" ${ln(2.4)}/>`,
      ).join("");
    }
    if (valueId && COVERS[valueId])
      return `<rect x="8" y="12" width="48" height="40" rx="8" fill="${COVERS[valueId].fill}" ${ln()}/>${texture(COVERS[valueId].tex, COVERS[valueId].line, 14, 46, 22, 46)}`;
    return ["foil", "paper", "wool"]
      .map(
        (m, i) =>
          `<rect x="${6 + i * 18}" y="${14 + i * 4}" width="22" height="36" rx="5" fill="${COVERS[m].fill}" ${ln(2.4)}/>`,
      )
      .join("");
  },
  measureIcon: () =>
    `<ellipse cx="32" cy="50" rx="24" ry="6" fill="${C.water}" ${ln(2.4)}/>${cube(18, 14, 28)}`,
};

// ── cocoa cups (transfer) ────────────────────────────────────────────────────
function cup(kind, lid, x = 80) {
  const fill = kind === "foam" ? C.foam : C.kraft;
  const body = `<path d="M${x - 36} 70 L${x - 28} 150 H${x + 28} L${x + 36} 70 Z" fill="${fill}" ${ln()}/>`;
  const tex =
    kind === "foam"
      ? [0, 1, 2, 3]
          .map(
            (i) =>
              `<circle cx="${x - 16 + i * 11}" cy="${100 + (i % 2) * 18}" r="2" fill="${C.paperLine}"/>`,
          )
          .join("")
      : `<path d="M${x - 32} 104 H${x + 32}" ${ln(5, C.copper)}/>`;
  const top = lid
    ? `<rect x="${x - 40}" y="60" width="80" height="12" rx="5" fill="${C.lid}" ${ln()}/><rect x="${x - 10}" y="52" width="20" height="9" rx="3" fill="${C.lid}" ${ln(2.4)}/>`
    : `<ellipse cx="${x}" cy="70" rx="35" ry="7" fill="${C.cocoa}" ${ln()}/>`;
  return `${body}${tex}${top}`;
}

const steam = (x, y) =>
  [-14, 0, 14]
    .map(
      (dx) =>
        `<path d="M${x + dx} ${y} c-7 -9 7 -15 0 -24 c-7 -9 7 -15 0 -22" fill="none" ${ln(3, C.steam)}/>`,
    )
    .join("");

function cocoaUnit(conds, mode) {
  const lid = conds.lid === "yes";
  const vapor = part(mode, steam(80, lid ? 50 : 60), { t: "translateY(-10px)", o: 0, d: 0.1 });
  const therm = `<rect x="132" y="70" width="14" height="78" rx="7" fill="#ffffff" ${ln(2.4)}/><circle cx="139" cy="150" r="10" fill="${C.red}" ${ln(2.4)}/>`;
  const level = part(mode, `<rect x="135" y="80" width="8" height="66" rx="4" fill="${C.red}"/>`, {
    t: "scaleY(0.3)",
  });
  return `<rect x="14" y="150" width="132" height="8" rx="4" fill="${C.tableEdge}"/>${cup(conds.cup, lid, 70)}${vapor}${therm}${level}`;
}

function kettle(x) {
  return `<g transform="translate(${x} 200)"><path d="M10 82 C0 40 20 20 50 20 C80 20 100 40 90 82Z" fill="${C.lid}" ${ln()}/><path d="M88 52 L118 30" ${ln(7, C.navy)}/><path d="M88 52 L118 30" ${ln(3.5, C.lid)}/><path d="M24 22 C24 0 76 0 76 22" fill="none" ${ln(5)}/><rect x="40" y="10" width="20" height="10" rx="4" fill="${C.foil}" ${ln(2.4)}/></g>`;
}

function cocoaHero() {
  const k = 0.8;
  const cups = [
    ["foam", true],
    ["foam", false],
    ["kraft", true],
    ["kraft", false],
  ]
    .map(
      ([kind, lid], i) =>
        `<g transform="translate(${136 + i * 88} ${284 - 150 * k}) scale(${k})">${cup(kind, lid)}${steam(80, lid ? 50 : 60)}</g>`,
    )
    .join("");
  return `${room(640, 360, 282)}${windowFrame(478, 34, 132, 122)}${thermometer(430, 50, 96, 0.7)}${kettle(24)}${cups}${notebook(518, 214)}${sparkles([
    [120, 70, "+"],
    [260, 60, "."],
    [380, 90, "+"],
  ])}`;
}

export const COCOA = {
  id: "ice-cover-transfer",
  hero: () => ({
    svg: cocoaHero(),
    title: { en: "A hot cocoa investigation bench", es: "Una mesa de investigación con chocolate caliente" },
    desc: {
      en: "A pot of hot cocoa stands at the end of a table. Four cups were just poured from it: a foam cup with a lid, a foam cup with no lid, a paper cup with a lid and a paper cup with no lid. Steam rises from every cup. A thermometer hangs on the wall and an open notebook waits for results.",
      es: "Una olla de chocolate caliente está al final de una mesa. Se acaban de servir cuatro tazas de ella: una taza de espuma con tapa, una taza de espuma sin tapa, una taza de papel con tapa y una taza de papel sin tapa. Sale vapor de todas las tazas. Hay un termómetro en la pared y un cuaderno abierto espera los resultados.",
    },
  }),
  hotspots: [
    {
      id: "pot",
      x: 13,
      y: 72,
      label: { en: "The pot", es: "La olla" },
      notice: {
        en: "Every cup was filled from the same pot of cocoa.",
        es: "Todas las tazas se llenaron de la misma olla de chocolate.",
      },
      wonder: {
        en: "Did every cup start just as hot?",
        es: "¿Todas las tazas empezaron igual de calientes?",
      },
    },
    {
      id: "steam",
      x: 33,
      y: 50,
      label: { en: "The steam", es: "El vapor" },
      notice: { en: "Steam rises from the hot cocoa.", es: "Sale vapor del chocolate caliente." },
      wonder: { en: "Where does the heat go?", es: "¿A dónde va el calor?" },
    },
    {
      id: "lid",
      x: 48,
      y: 63,
      label: { en: "The lids", es: "Las tapas" },
      notice: { en: "Some cups have a lid and some do not.", es: "Algunas tazas tienen tapa y otras no." },
      wonder: {
        en: "Does a lid change how long cocoa stays warm?",
        es: "¿Una tapa cambia cuánto tiempo el chocolate se mantiene caliente?",
      },
    },
  ],
  unit: (conds, mode) => cocoaUnit(conds, mode),
  say: {
    start: {
      en: "a cup of hot cocoa with steam rising",
      es: "una taza de chocolate caliente con vapor",
    },
    end: {
      en: "the steam is gone and the cocoa has cooled",
      es: "ya no hay vapor y el chocolate se enfrió",
    },
  },
  varIcon: (varId) =>
    varId === "lid"
      ? `<rect x="10" y="26" width="44" height="12" rx="5" fill="${C.lid}" ${ln()}/>`
      : `<path d="M16 18 L22 54 H42 L48 18 Z" fill="${C.kraft}" ${ln()}/>`,
  measureIcon: () => `<g transform="translate(-48 -6) scale(1)">${steam(80, 56)}</g>`,
};

