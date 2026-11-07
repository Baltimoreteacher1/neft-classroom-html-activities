// Science Investigation Lab scenes: the ramp-roll family (Grades 3-5, case two) and its transfer, balls rolled onto
// wood or carpet. Each family draws one test "unit" in a 160 x 170 box from a row's conditions, a hero for the
// phenomenon, object icons for the variables, and neutral hotspot observations. The hero is the whole investigation
// bench and never shows which condition wins: every car on the ramp waits at the top, the three floor strips are
// laid out but unused, and no car has rolled anywhere yet.
import {
  C,
  ln,
  notebook,
  part,
  room,
  ruler,
  shelf,
  sparkles,
  windowFrame,
} from "./science-lab-scene-kit.js";

const FLOORS = {
  tile: { fill: "#dfe7ee", line: "#9aa8b8" },
  carpet: { fill: "#b9735b", line: "#7e3f2d" },
  sandpaper: { fill: "#d9bd86", line: "#9a7a3e" },
  wood: { fill: C.table, line: C.tableEdge },
};

/** A floor strip from x0 to x1 at y=140, with a texture that differs by floor so colour is not the only signal. */
function floorStrip(kind, x0, x1, y = 140) {
  const f = FLOORS[kind] || FLOORS.tile;
  const out = [];
  if (kind === "tile")
    for (let x = x0; x < x1; x += 22) out.push(`<path d="M${x} ${y} v14" ${ln(1.6, f.line)}/>`);
  else if (kind === "carpet")
    for (let x = x0 + 3; x < x1 - 4; x += 8)
      out.push(`<path d="M${x} ${y + 12} l2 -6 l2 6" fill="none" ${ln(1.6, f.line)}/>`);
  else if (kind === "sandpaper")
    for (let x = x0 + 4; x < x1; x += 9)
      out.push(`<circle cx="${x}" cy="${y + 4 + (x % 3) * 3}" r="1.5" fill="${f.line}"/>`);
  else
    for (let x = x0; x < x1; x += 30)
      out.push(`<path d="M${x} ${y + 4} h22 M${x + 8} ${y + 10} h22" ${ln(1.6, f.line)}/>`);
  return `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="14" rx="3" fill="${f.fill}" ${ln()}/>${out.join("")}`;
}

/** A toy car about 26 wide, its wheels' bottoms on y=0 of its own box; the box's left edge is x. */
const car = (x, y, a = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="0" y="-16" width="26" height="9" rx="3" fill="${C.red}" ${ln(2.4)}/><path d="M6 -16 l4 -7 h8 l4 7" fill="${C.sky}" ${ln(2.2)}/><circle cx="6" cy="-4" r="4" fill="${C.navy}"/><circle cx="20" cy="-4" r="4" fill="${C.navy}"/></g>`;

/** The ramp: a board resting on a stack of `books` books (each 10 high), top left of the unit. */
function ramp(books, x = 8) {
  const h = 10 * books;
  const top = 140 - h;
  const stack = Array.from(
    { length: books },
    (_, i) =>
      `<rect x="${x}" y="${140 - (i + 1) * 10}" width="22" height="10" rx="2" fill="${i % 2 ? C.sage : C.copper}" ${ln(2)}/>`,
  ).join("");
  return {
    top,
    svg: `${stack}<path d="M${x - 2} ${top - 3} L${x + 56} 138 L${x + 56} 142 L${x - 2} ${top + 1} Z" fill="${C.kraft}" ${ln(2.4)}/>`,
  };
}

/** Height of the board top face at px, and its tilt in degrees; `edge` is the ramp left edge (the board starts 2 left of it). */
const surfaceY = (top, x, edge = 8) => top - 3 + ((x - (edge - 2)) * (138 - (top - 3))) / 58;
const tilt = (top) => (Math.atan2(138 - (top - 3), 58) * 180) / Math.PI;

function rampUnit(conds, mode, ratio) {
  const books = Number(conds.height) || 1;
  const r = ramp(books);
  const dx = 8 + Math.round(60 * ratio);
  const onRamp = part(mode, car(12, surfaceY(r.top, 12), tilt(r.top)), {
    t0: "translate(0px, 0px)",
    t: `translate(40px, ${Math.round(140 - surfaceY(r.top, 12))}px)`,
    o0: 1,
    o: 0,
    origin: "50% 50%",
  });
  const onFloor = part(mode, car(56, 140), {
    t0: "translate(0px, 0px)",
    t: `translate(${dx}px, 0px)`,
    o0: 0,
    o: 1,
    origin: "50% 50%",
    d: 0.3,
  });
  const strip = floorStrip(conds.surface || "tile", 60, 156);
  return `${strip}<rect x="2" y="140" width="58" height="14" rx="3" fill="${C.tray}" ${ln()}/>${r.svg}${onRamp}${onFloor}`;
}

const rampHero = () => {
  const floors = ["tile", "carpet", "sandpaper"]
    .map((k, i) => floorStrip(k, 300 + i * 104, 396 + i * 104, 300))
    .join("");
  const r = ramp(2, 0);
  const bigRamp = `<g transform="translate(60 30) scale(1.8)">${r.svg}${car(14, surfaceY(r.top, 14, 0) - 1, tilt(r.top))}</g>`;
  const shelfBooks = [0, 1, 2]
    .map(
      (i) =>
        `<rect x="${452 + i * 26}" y="${130 - (i % 2) * 6}" width="22" height="${34 + (i % 2) * 6}" rx="3" fill="${[C.sage, C.copper, C.lid][i]}" ${ln(2.4)}/>`,
    )
    .join("");
  return `${room(640, 360, 282)}${windowFrame(60, 30, 150, 90)}${shelf(440, 168, 150)}${shelfBooks}${bigRamp}${floors}${notebook(480, 196)}${sparkles([
    [300, 70, "+"],
    [250, 44, "."],
    [610, 100, "."],
  ])}`;
};

export const RAMP = {
  id: "ramp-roll",
  vb: "0 90 160 80",
  hero: () => ({
    svg: rampHero(),
    title: {
      en: "A toy car ramp investigation bench",
      es: "Una mesa de investigación con una rampa para carritos",
    },
    desc: {
      en: "A board rests on a stack of books to make a ramp, and a toy car waits at the top. Below the ramp, three strips of floor lie side by side: smooth tile, carpet and sandpaper. Nothing has been rolled yet. A shelf holds three more books, and an open notebook waits for results.",
      es: "Una tabla descansa sobre una pila de libros y forma una rampa, y un carrito de juguete espera arriba. Debajo de la rampa hay tres tiras de piso, una al lado de otra: baldosa lisa, alfombra y papel de lija. Todavía no se ha hecho rodar nada. Un estante tiene tres libros más, y un cuaderno abierto espera los resultados.",
    },
  }),
  hotspots: [
    {
      id: "car",
      x: 17,
      y: 30,
      label: { en: "The toy car", es: "El carrito de juguete" },
      notice: {
        en: "The toy car waits at the top of the ramp.",
        es: "El carrito de juguete espera arriba de la rampa.",
      },
      wonder: {
        en: "Why do some cars stop sooner than others?",
        es: "¿Por qué algunos carritos se detienen antes que otros?",
      },
    },
    {
      id: "ramp",
      x: 25,
      y: 55,
      label: { en: "The ramp", es: "La rampa" },
      notice: {
        en: "A board rests on a stack of books.",
        es: "Una tabla descansa sobre una pila de libros.",
      },
      wonder: {
        en: "Does a taller stack change how far the car goes?",
        es: "¿Una pila más alta cambia qué tan lejos llega el carrito?",
      },
    },
    {
      id: "floors",
      x: 62,
      y: 84,
      label: { en: "The floor strips", es: "Las tiras de piso" },
      notice: {
        en: "Three kinds of floor lie side by side. They have not been used yet.",
        es: "Tres tipos de piso están uno al lado del otro. Todavía no se han usado.",
      },
      wonder: {
        en: "Would the car roll the same way on each one?",
        es: "¿El carrito rodaría igual en cada uno?",
      },
    },
    {
      id: "books",
      x: 79,
      y: 41,
      label: { en: "The extra books", es: "Los libros extra" },
      notice: {
        en: "Three more books sit on the shelf.",
        es: "Tres libros más están en el estante.",
      },
      wonder: {
        en: "How many books should we use each time?",
        es: "¿Cuántos libros deberíamos usar cada vez?",
      },
    },
    {
      id: "notebook",
      x: 82,
      y: 70,
      label: { en: "The notebook", es: "El cuaderno" },
      notice: {
        en: "An open notebook has an empty table, ready for results.",
        es: "Un cuaderno abierto tiene una tabla vacía, lista para los resultados.",
      },
      wonder: {
        en: "What should we write down after each run?",
        es: "¿Qué deberíamos anotar después de cada prueba?",
      },
    },
  ],
  unit: rampUnit,
  say: {
    start: {
      en: "a toy car waits at the top of the ramp",
      es: "un carrito de juguete espera arriba de la rampa",
    },
    end: { en: "the car has stopped on the floor", es: "el carrito se detuvo en el piso" },
  },
  varIcon(varId, valueId) {
    if (varId === "height") {
      const n = Number(valueId) || 2;
      return Array.from(
        { length: n },
        (_, i) =>
          `<rect x="14" y="${48 - i * 14}" width="36" height="14" rx="3" fill="${i % 2 ? C.sage : C.copper}" ${ln(2.4)}/>`,
      ).join("");
    }
    if (valueId && FLOORS[valueId]) return floorStrip(valueId, 6, 58, 30);
    return ["tile", "carpet", "sandpaper"]
      .map((k, i) => floorStrip(k, 8, 56, 12 + i * 16))
      .join("");
  },
  measureIcon: () =>
    `<rect x="6" y="38" width="52" height="14" rx="3" fill="${C.sun}" ${ln()}/>${[14, 24, 34, 44].map((x) => `<path d="M${x} 38 v7" ${ln(2)}/>`).join("")}<g transform="translate(-4 14)">${car(10, 20)}</g>`,
};

// ── balls rolled onto wood or carpet (transfer) ──────────────────────────────
function ball(kind, x, y) {
  return kind === "rubber"
    ? `<circle cx="${x}" cy="${y - 9}" r="9" fill="${C.red}" ${ln(2.4)}/><path d="M${x - 8} ${y - 9} h16" ${ln(1.8, "#ffffff")}/>`
    : `<circle cx="${x}" cy="${y - 5}" r="5" fill="${C.sage}" ${ln(2.2)}/><circle cx="${x - 1.5}" cy="${y - 6.5}" r="1.4" fill="#ffffff"/>`;
}

function ballUnit(conds, mode, ratio) {
  const dx = 8 + Math.round(60 * ratio);
  const r = ramp(2);
  const top = (kind) => ball(kind, 20, surfaceY(r.top, 20) - 1);
  const onRamp = part(mode, top(conds.ball), {
    t0: "translate(0px, 0px)",
    t: `translate(36px, ${Math.round(140 - surfaceY(r.top, 20))}px)`,
    o0: 1,
    o: 0,
    origin: "50% 50%",
  });
  const onFloor = part(mode, ball(conds.ball, 62, 140), {
    t0: "translate(0px, 0px)",
    t: `translate(${dx}px, 0px)`,
    o0: 0,
    o: 1,
    origin: "50% 50%",
    d: 0.3,
  });
  return `${floorStrip(conds.floor || "wood", 60, 156)}<rect x="2" y="140" width="58" height="14" rx="3" fill="${C.tray}" ${ln()}/>${r.svg}${onRamp}${onFloor}`;
}

const ballHero = () => {
  const r = ramp(2, 0);
  const ramps = `<g transform="translate(60 30) scale(1.8)">${r.svg}${ball("marble", 12, surfaceY(r.top, 12, 0) - 1)}${ball("rubber", 32, surfaceY(r.top, 32, 0) - 1)}</g>`;
  return `${room(640, 360, 282)}${windowFrame(400, 24, 150, 90)}${ramps}${floorStrip("wood", 250, 440, 300)}${floorStrip("carpet", 450, 640, 300)}${ruler(40, 360, 60)}${notebook(470, 190)}${sparkles([
    [330, 60, "+"],
    [300, 150, "."],
    [610, 60, "+"],
  ])}`;
};

export const BALLS = {
  id: "ramp-roll-transfer",
  vb: "0 90 160 80",
  hero: () => ({
    svg: ballHero(),
    title: {
      en: "A marble and a rubber ball at the top of a ramp",
      es: "Una canica y una pelota de goma arriba de una rampa",
    },
    desc: {
      en: "A small green marble and a red rubber ball sit at the top of a ramp. At the bottom, a wood floor strip lies next to a strip of carpet. Nothing has been rolled yet. A ruler stands on the floor and an open notebook waits for results.",
      es: "Una canica verde pequeña y una pelota de goma roja están arriba de una rampa. Abajo hay una tira de piso de madera junto a una tira de alfombra. Todavía no se ha hecho rodar nada. Una regla está en el piso y un cuaderno abierto espera los resultados.",
    },
  }),
  hotspots: [
    {
      id: "balls",
      x: 28,
      y: 60,
      label: { en: "The two balls", es: "Las dos pelotas" },
      notice: {
        en: "A marble and a rubber ball are different sizes.",
        es: "Una canica y una pelota de goma tienen tamaños diferentes.",
      },
      wonder: {
        en: "Does the kind of ball change how far it rolls?",
        es: "¿El tipo de pelota cambia qué tan lejos rueda?",
      },
    },
    {
      id: "floors",
      x: 62,
      y: 86,
      label: { en: "The two floors", es: "Los dos pisos" },
      notice: {
        en: "One strip is a wood floor and the other is carpet.",
        es: "Una tira es piso de madera y la otra es alfombra.",
      },
      wonder: {
        en: "Does the floor change how far a ball rolls?",
        es: "¿El piso cambia qué tan lejos rueda una pelota?",
      },
    },
    {
      id: "ruler",
      x: 7,
      y: 90,
      label: { en: "The ruler", es: "La regla" },
      notice: {
        en: "A ruler is ready to measure the distance.",
        es: "Una regla está lista para medir la distancia.",
      },
      wonder: {
        en: "Where should we start measuring?",
        es: "¿Desde dónde deberíamos empezar a medir?",
      },
    },
  ],
  unit: ballUnit,
  say: {
    start: {
      en: "a ball waits at the top of the ramp",
      es: "una pelota espera arriba de la rampa",
    },
    end: { en: "the ball has stopped on the floor", es: "la pelota se detuvo en el piso" },
  },
  varIcon: (varId, valueId) =>
    varId === "ball"
      ? `<g transform="translate(0 6)">${ball(valueId === "rubber" ? "rubber" : "marble", 32, 44)}</g>`
      : floorStrip(valueId === "carpet" ? "carpet" : "wood", 6, 58, 30),
  measureIcon: () =>
    `<rect x="6" y="38" width="52" height="14" rx="3" fill="${C.sun}" ${ln()}/>${[14, 24, 34, 44].map((x) => `<path d="M${x} 38 v7" ${ln(2)}/>`).join("")}${ball("marble", 24, 34)}`,
};
