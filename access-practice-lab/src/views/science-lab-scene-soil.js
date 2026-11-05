// Science Investigation Lab scenes: the soil-sprout family (Grades 3-5), its transfer (lettuce on a window or a
// corner shelf) and the plain lab-bench fallback for any case id without a family of its own.
// The heroes are the whole investigation bench and never show which condition wins: the sprouting cups on the
// window shelf all hold the same plain soil, the test soils on the table are not planted yet, and every lettuce
// plant is drawn the same size.
import {
  C,
  ln,
  notebook,
  part,
  room,
  ruler,
  shelf,
  sparkles,
  sun,
  wateringCan,
  windowFrame,
} from "./science-lab-scene-kit.js";

const SOILS = { sand: C.sand, garden: C.garden, clay: C.clay };
const FLECK = { sand: C.tableEdge, garden: "#8a6a50", clay: "#7e3f22" };

/** A clear cup of soil with a bean seed, drawn so the seed sprouts when animated. */
function sproutCup(soil, mode, x = 80) {
  const fill = SOILS[soil] || C.soil;
  const fleck = FLECK[soil] || "#5b3a26";
  const glass = `<path d="M${x - 40} 58 L${x - 32} 152 H${x + 32} L${x + 40} 58 Z" fill="${C.glass}" ${ln()}/>`;
  const dirt = `<path d="M${x - 37.5} 88 L${x - 31} 149 H${x + 31} L${x + 37.5} 88 Z" fill="${fill}"/>${[
    0, 1, 2, 3, 4,
  ]
    .map(
      (i) => `<circle cx="${x - 22 + i * 11}" cy="${104 + (i % 3) * 14}" r="2.2" fill="${fleck}"/>`,
    )
    .join("")}`;
  const seed = `<ellipse cx="${x}" cy="104" rx="11" ry="7.5" fill="${C.seed}" ${ln(2.4)}/><path d="M${x - 2} 99 q4 5 0 10" fill="none" ${ln(1.8)}/>`;
  const root = part(
    mode,
    `<path d="M${x} 110 q-4 14 2 26 q4 8 -2 12" fill="none" ${ln(2.6, "#f3ead2")}/>`,
    {
      t0: "scaleY(0)",
      t: "scaleY(1)",
      origin: "50% 0%",
      d: 0.05,
    },
  );
  const shoot = part(
    mode,
    `<path d="M${x} 98 C${x} 80 ${x - 2} 60 ${x} 40" fill="none" ${ln(4, C.leafDark)}/><path d="M${x} 46 c-18 -14 -30 -4 -28 6 c10 4 22 2 28 -6Z" fill="${C.leaf}" ${ln(2.4)}/><path d="M${x} 46 c18 -14 30 -4 28 6 c-10 4 -22 2 -28 -6Z" fill="${C.leaf}" ${ln(2.4)}/>`,
    { t0: "scale(0.2, 0)", t: "scale(1)", o0: 0, o: 1, d: 0.35 },
  );
  return `${glass}${dirt}${root}${seed}${shoot}<path d="M${x - 40} 58 H${x + 40}" ${ln()}/>`;
}

const drops = (n, x, y) =>
  Array.from(
    { length: n },
    (_, i) => `<path d="M${x + i * 13} ${y} q-6 9 0 13 q6 -4 0 -13Z" fill="${C.water}" ${ln(2)}/>`,
  ).join("");

/** An open tub of one soil, with a texture that differs by soil so colour is not the only signal. */
function tub(x, soil) {
  const fill = SOILS[soil] || C.soil;
  const fleck = FLECK[soil] || "#5b3a26";
  const tex =
    soil === "sand"
      ? [0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${x + 12 + i * 11}" cy="${246 + (i % 2) * 6}" r="1.8" fill="${fleck}"/>`).join("")
      : soil === "clay"
        ? `<path d="M${x + 10} 248 q14 -6 28 0 t28 0" fill="none" ${ln(2, fleck)}/>`
        : [0, 1, 2, 3].map((i) => `<rect x="${x + 12 + i * 15}" y="${244 + (i % 2) * 6}" width="6" height="3" rx="1" fill="${fleck}"/>`).join("");
  return `<path d="M${x} 236 H${x + 84} L${x + 78} 282 H${x + 6}Z" fill="${C.glass}" ${ln()}/><path d="M${x + 3} 240 H${x + 81} L${x + 77} 278 H${x + 7}Z" fill="${fill}"/>${tex}<rect x="${x - 4}" y="230" width="92" height="10" rx="4" fill="${C.foil}" ${ln(2.4)}/>`;
}

const packet = (x) =>
  `<rect x="${x}" y="226" width="44" height="56" rx="4" fill="${C.paper}" ${ln()}/><path d="M${x} 238 H${x + 44}" ${ln(2)}/><ellipse cx="${x + 22}" cy="258" rx="9" ry="6" fill="${C.seed}" ${ln(2)}/><path d="M${x + 22} 252 q-6 -10 2 -14" fill="none" ${ln(2, C.leafDark)}/>`;

function soilHero() {
  const k = 0.72;
  const cups = [0, 1, 2, 3]
    .map(
      (i) =>
        `<g transform="translate(${208 + i * 98} ${168 - 152 * k}) scale(${k})">${sproutCup("plain", i === 1 ? "end" : "start")}</g>`,
    )
    .join("");
  const spoon = `<g transform="translate(150 306)"><path d="M0 12 h50 a10 10 0 0 0 0 -14 h-6" fill="none" ${ln()}/><ellipse cx="62" cy="6" rx="13" ry="8" fill="#ffffff" ${ln()}/></g>`;
  return `${room(640, 360, 282)}${windowFrame(30, 30, 150, 140)}${sun(80, 74, 20)}${shelf(196, 168, 420)}${cups}${tub(22, "sand")}${tub(124, "garden")}${tub(226, "clay")}${packet(330)}${spoon}${wateringCan(420, 282)}${ruler(604, 282, 84)}${sparkles([
    [610, 50, "+"],
    [230, 40, "."],
    [600, 200, "."],
  ])}`;
}

export const SOIL = {
  id: "soil-sprout",
  vb: "0 26 160 132",
  hero: () => ({
    svg: soilHero(),
    title: {
      en: "A bean seed investigation bench by a window",
      es: "Una mesa de investigación con semillas de frijol junto a una ventana",
    },
    desc: {
      en: "On a sunny window shelf, four clear cups of the same plain soil hold bean seeds. One cup has a green shoot; the other three show only a seed. On the table below are three open tubs of soil, not planted yet: sand, garden soil and clay. Next to them are a seed packet, a spoon, a watering can and a ruler.",
      es: "En un estante con sol junto a la ventana, cuatro vasos transparentes con la misma tierra común tienen semillas de frijol. Un vaso tiene un brote verde; los otros tres solo muestran una semilla. En la mesa de abajo hay tres recipientes abiertos de tierra, todavía sin sembrar: arena, tierra de jardín y arcilla. A su lado hay un paquete de semillas, una cuchara, una regadera y una regla.",
    },
  }),
  hotspots: [
    {
      id: "shoot",
      x: 55,
      y: 22,
      label: { en: "The green shoot", es: "El brote verde" },
      notice: {
        en: "One seed has a green shoot with two leaves.",
        es: "Una semilla tiene un brote verde con dos hojas.",
      },
      wonder: { en: "Why did this seed sprout first?", es: "¿Por qué esta semilla brotó primero?" },
    },
    {
      id: "seed",
      x: 85,
      y: 34,
      label: { en: "A seed in the soil", es: "Una semilla en la tierra" },
      notice: {
        en: "Some seeds have not sprouted yet.",
        es: "Algunas semillas todavía no han brotado.",
      },
      wonder: {
        en: "Does the kind of soil change how fast a seed sprouts?",
        es: "¿El tipo de tierra cambia qué tan rápido brota una semilla?",
      },
    },
    {
      id: "water",
      x: 73,
      y: 70,
      label: { en: "The water", es: "El agua" },
      notice: {
        en: "Some cups get more spoons of water than others.",
        es: "Algunos vasos reciben más cucharadas de agua que otros.",
      },
      wonder: {
        en: "Does more water help a seed sprout?",
        es: "¿Más agua ayuda a que una semilla brote?",
      },
    },
    {
      id: "tubs",
      x: 26,
      y: 72,
      label: { en: "The soil tubs", es: "Los recipientes de tierra" },
      notice: {
        en: "Three tubs hold sand, garden soil and clay. Nothing is planted in them yet.",
        es: "Tres recipientes tienen arena, tierra de jardín y arcilla. Todavía no hay nada sembrado.",
      },
      wonder: {
        en: "Would a seed sprout the same way in each soil?",
        es: "¿Una semilla brotaría igual en cada tierra?",
      },
    },
    {
      id: "window",
      x: 13,
      y: 22,
      label: { en: "The window", es: "La ventana" },
      notice: {
        en: "All the cups sit on the same sunny shelf.",
        es: "Todos los vasos están en el mismo estante con sol.",
      },
      wonder: {
        en: "Do the cups all get the same light?",
        es: "¿Todos los vasos reciben la misma luz?",
      },
    },
  ],
  unit(conds, mode) {
    const n = Number(conds.water) || 2;
    return `${sproutCup(conds.soil, mode, 66)}${Array.from({ length: Math.min(n, 4) }, (_, i) => drops(1, 132 + (i % 2) * 14, 64 + Math.floor(i / 2) * 20)).join("")}`;
  },
  say: {
    start: {
      en: "a bean seed planted in a clear cup",
      es: "una semilla de frijol sembrada en un vaso transparente",
    },
    end: { en: "the seed has a green shoot", es: "la semilla tiene un brote verde" },
  },
  varIcon(varId, valueId) {
    if (varId === "water")
      return `<g transform="translate(-4 4)">${drops(Number(valueId) || 3, 12, 14)}</g>`;
    if (valueId && SOILS[valueId])
      return `<rect x="8" y="16" width="48" height="34" rx="8" fill="${SOILS[valueId]}" ${ln()}/>`;
    return ["sand", "garden", "clay"]
      .map(
        (s, i) =>
          `<rect x="${6 + i * 18}" y="${14 + i * 4}" width="22" height="36" rx="5" fill="${SOILS[s]}" ${ln(2.4)}/>`,
      )
      .join("");
  },
  measureIcon: () =>
    `<path d="M32 56 V24" ${ln(3.5, C.leafDark)}/><path d="M32 28 c-14 -12 -24 -2 -22 4 c8 4 16 2 22 -4Z" fill="${C.leaf}" ${ln(2.2)}/><path d="M32 28 c14 -12 24 -2 22 4 c-8 4 -16 2 -22 -4Z" fill="${C.leaf}" ${ln(2.2)}/><path d="M12 58 H52" ${ln(3, C.soil)}/>`,
};

// ── lettuce on a window or a corner shelf (transfer) ─────────────────────────
function lettuce(pot, mode, grow, x = 80) {
  const w = pot === "large" ? 34 : 24;
  const potShape = `<path d="M${x - w - 4} 112 H${x + w + 4} L${x + w - 4} 152 H${x - w + 4} Z" fill="${C.pot}" ${ln()}/><rect x="${x - w - 8}" y="104" width="${(w + 8) * 2}" height="12" rx="4" fill="${C.potDark}" ${ln()}/>`;
  const leaves = `<path d="M${x} 104 c-30 -10 -34 -40 -14 -46 c8 10 10 30 14 46Z" fill="${C.leaf}" ${ln(2.4)}/><path d="M${x} 104 c30 -10 34 -40 14 -46 c-8 10 -10 30 -14 46Z" fill="${C.leaf}" ${ln(2.4)}/><path d="M${x} 104 c-8 -24 -6 -50 0 -62 c6 12 8 38 0 62Z" fill="${C.leafDark}" ${ln(2.4)}/>`;
  return `${part(mode, leaves, { t0: "scale(0.3)", t: `scale(${grow.toFixed(2)})`, origin: "50% 100%" })}${potShape}`;
}

function lettuceHero() {
  const plant = (x, y, pot) => `<g transform="translate(${x} ${y}) scale(0.9)">${lettuce(pot, "end", 0.8)}</g>`;
  const shade = `<rect x="392" y="0" width="248" height="282" fill="${C.shade}" opacity="0.55"/>`;
  return `${room(640, 360, 282)}${shade}${windowFrame(40, 34, 170, 140)}${sun(96, 80, 20)}${plant(16, 145, "small")}${plant(128, 145, "large")}${shelf(410, 206, 214)}${plant(400, 70, "small")}${plant(506, 70, "large")}${wateringCan(256, 282)}${ruler(378, 282, 108)}${sparkles([
    [300, 60, "+"],
    [340, 110, "."],
    [600, 40, "+"],
  ])}`;
}

export const LETTUCE = {
  id: "soil-sprout-transfer",
  hero: () => ({
    svg: lettuceHero(),
    title: {
      en: "Lettuce plants in two spots of a classroom",
      es: "Plantas de lechuga en dos lugares de un salón",
    },
    desc: {
      en: "By a sunny window, a small pot and a large pot of lettuce. On a shady corner shelf, another small pot and another large pot. All four plants are the same size today. A watering can and a ruler stand between them.",
      es: "Junto a una ventana con sol, una maceta pequeña y una maceta grande de lechuga. En un estante de la esquina con sombra, otra maceta pequeña y otra grande. Hoy las cuatro plantas son del mismo tamaño. Entre ellas hay una regadera y una regla.",
    },
  }),
  hotspots: [
    {
      id: "window",
      x: 18,
      y: 24,
      label: { en: "The window", es: "La ventana" },
      notice: {
        en: "One plant gets sun from the window.",
        es: "Una planta recibe sol de la ventana.",
      },
      wonder: {
        en: "How much does light change how tall a plant grows?",
        es: "¿Cuánto cambia la luz la altura de una planta?",
      },
    },
    {
      id: "corner",
      x: 81,
      y: 26,
      label: { en: "The corner shelf", es: "El estante de la esquina" },
      notice: {
        en: "The corner shelf is in the shade.",
        es: "El estante de la esquina está en la sombra.",
      },
      wonder: { en: "Does pot size matter too?", es: "¿El tamaño de la maceta también importa?" },
    },
    {
      id: "can",
      x: 50,
      y: 70,
      label: { en: "The watering can", es: "La regadera" },
      notice: {
        en: "Every plant gets water from the same can.",
        es: "Todas las plantas reciben agua de la misma regadera.",
      },
      wonder: {
        en: "Does every plant get the same amount of water?",
        es: "¿Todas las plantas reciben la misma cantidad de agua?",
      },
    },
  ],
  unit(conds, mode, ratio) {
    const bg =
      conds.spot === "window"
        ? `<rect x="6" y="8" width="44" height="40" rx="6" fill="${C.sky}" ${ln(2.4)}/><circle cx="28" cy="28" r="9" fill="${C.sun}" ${ln(2)}/>`
        : `<rect x="0" y="0" width="160" height="152" fill="${C.shade}" opacity="0.55"/>`;
    return `${bg}<path d="M6 152 H154" ${ln(4, C.tableEdge)}/>${lettuce(conds.pot, mode, 0.35 + 0.65 * ratio)}`;
  },
  say: {
    start: {
      en: "a young lettuce plant in its pot",
      es: "una planta de lechuga joven en su maceta",
    },
    end: { en: "the lettuce has grown", es: "la lechuga creció" },
  },
  varIcon: (varId) =>
    varId === "pot"
      ? `<path d="M14 26 H50 L44 56 H20 Z" fill="${C.pot}" ${ln()}/>`
      : `<rect x="10" y="10" width="44" height="44" rx="6" fill="${C.sky}" ${ln()}/><circle cx="32" cy="32" r="9" fill="${C.sun}" ${ln(2)}/>`,
  measureIcon: () =>
    `<rect x="24" y="6" width="16" height="52" rx="3" fill="${C.sun}" ${ln()}/>${[16, 26, 36, 46].map((y) => `<path d="M24 ${y} h7" ${ln(2)}/>`).join("")}`,
};

// ── lab bench fallback ───────────────────────────────────────────────────────
function beaker(mode, ratio, x = 80) {
  const level = part(
    mode,
    `<path d="M${x - 33} 92 H${x + 33} L${x + 30} 148 H${x - 30} Z" fill="${C.water}"/>`,
    {
      t0: "scaleY(0.15)",
      t: `scaleY(${(0.2 + 0.8 * ratio).toFixed(2)})`,
    },
  );
  return `${level}<path d="M${x - 38} 52 L${x - 30} 150 H${x + 30} L${x + 38} 52" fill="none" ${ln()}/><path d="M${x - 44} 52 H${x + 44}" ${ln()}/>${[80, 104, 128].map((y) => `<path d="M${x - 30} ${y} h12" ${ln(2)}/>`).join("")}`;
}

export const BENCH = {
  id: "bench",
  hero: () => ({
    svg: `${room(640, 360, 282)}${[0, 1, 2].map((i) => `<g transform="translate(${150 + i * 130} 128)">${beaker("end", 0.3 + i * 0.25)}</g>`).join("")}${sparkles(
      [
        [80, 80, "+"],
        [560, 90, "."],
      ],
    )}`,
    title: {
      en: "A lab bench with three beakers",
      es: "Una mesa de laboratorio con tres vasos de precipitado",
    },
    desc: {
      en: "Three beakers stand on a lab bench.",
      es: "Tres vasos de precipitado están en una mesa de laboratorio.",
    },
  }),
  hotspots: [],
  unit: (_conds, mode, ratio) => beaker(mode, ratio),
  say: {
    start: { en: "the test is set up", es: "la prueba está preparada" },
    end: { en: "the test is finished", es: "la prueba terminó" },
  },
  varIcon: () => `<rect x="12" y="12" width="40" height="40" rx="8" fill="${C.glass}" ${ln()}/>`,
  measureIcon: () => `<g transform="translate(-48 -40) scale(1)">${beaker("end", 0.5)}</g>`,
};
