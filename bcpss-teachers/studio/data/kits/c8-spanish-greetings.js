// Shared pictures for the grade 2 Spanish lesson on greetings and feelings (worker c8).
// Faces differ by eyebrow, eye and mouth shape, never by colour alone. Greeting scenes carry an English time cue.
const INK = "ink";
const stroke = (d, sw = 5) => ({ t: "path", d, fill: "none", stroke: INK, sw, cap: "round" });
const dot = (cx, cy, r = 6) => ({ t: "circle", cx, cy, r, fill: INK });
const line = (x1, y1, x2, y2, sw = 5) => ({
  t: "line",
  x1,
  y1,
  x2,
  y2,
  stroke: INK,
  sw,
  cap: "round",
});

const MOODS = {
  feliz: {
    alt: "A round face with happy curved eyes and a wide open smile.",
    parts: [
      stroke("M82 90 Q95 74 108 90"),
      stroke("M132 90 Q145 74 158 90"),
      stroke("M78 118 Q120 168 162 118 Z", 5),
    ],
  },
  triste: {
    alt: "A round face with eyebrows tilted up in the middle, a downturned mouth and one tear.",
    parts: [
      dot(96, 92),
      dot(144, 92),
      line(80, 72, 106, 62, 4),
      line(160, 72, 134, 62, 4),
      stroke("M88 138 Q120 108 152 138"),
      {
        t: "path",
        d: "M150 104 Q160 122 150 126 Q140 122 150 104 Z",
        fill: "sky",
        stroke: INK,
        sw: 3,
      },
    ],
  },
  cansado: {
    alt: "A round face with heavy half-closed eyes, a big open yawning mouth and the letters Z z z floating above.",
    parts: [
      stroke("M82 92 L108 92"),
      stroke("M132 92 L158 92"),
      line(82, 92, 82, 84, 3),
      line(158, 92, 158, 84, 3),
      { t: "ellipse", cx: 120, cy: 128, rx: 14, ry: 18, stroke: INK, sw: 5, fill: "none" },
      { t: "text", x: 190, y: 40, text: "Z z z", size: 24, weight: 700 },
    ],
  },
  enojado: {
    alt: "A round face with eyebrows slanted down toward the nose, small tight eyes, a flat pressed mouth and an anger mark at the corner.",
    parts: [
      dot(96, 94, 5),
      dot(144, 94, 5),
      line(76, 70, 110, 84, 6),
      line(164, 70, 130, 84, 6),
      line(94, 130, 146, 130, 6),
      stroke("M172 52 L182 62 M182 52 L172 62", 4),
    ],
  },
  nervioso: {
    alt: "A round face with wide round eyes, raised eyebrows, a wobbly wavy mouth and a sweat drop on the forehead.",
    parts: [
      { t: "circle", cx: 96, cy: 92, r: 11, fill: "paper", stroke: INK, sw: 4 },
      { t: "circle", cx: 144, cy: 92, r: 11, fill: "paper", stroke: INK, sw: 4 },
      dot(96, 94, 4),
      dot(144, 94, 4),
      stroke("M82 68 Q96 58 110 68", 4),
      stroke("M130 68 Q144 58 158 68", 4),
      stroke("M88 130 Q98 120 108 130 T128 130 T148 130"),
      { t: "path", d: "M172 66 Q182 84 172 90 Q162 84 172 66 Z", fill: "sky", stroke: INK, sw: 3 },
    ],
  },
  bien: {
    alt: "A round face with round eyes and a small gentle smile, with a check mark in the corner.",
    parts: [
      dot(96, 92),
      dot(144, 92),
      stroke("M92 122 Q120 140 148 122"),
      { t: "icon", name: "check", x: 168, y: 18, s: 40 },
    ],
  },
};

/** A face picture for one feeling word. */
export function face(mood, extra = {}) {
  const m = MOODS[mood];
  return {
    kind: "shapes",
    alt: m.alt,
    w: 240,
    h: 200,
    items: [
      { t: "circle", cx: 120, cy: 100, r: 76, fill: "paper", stroke: INK, sw: 5 },
      ...m.parts,
    ],
    ...extra,
  };
}

const bubble = (x, y, w, text) => [
  { t: "rect", x, y, w, h: 44, rx: 18, fill: "paper", stroke: INK, sw: 3 },
  { t: "text", x: x + w / 2, y: y + 29, text, size: 20, weight: 700 },
];
const chip = (x, y, w, text) => [
  { t: "rect", x, y, w, h: 30, rx: 15, fill: "ochre", opacity: 0.35, stroke: INK, sw: 2 },
  { t: "text", x: x + w / 2, y: y + 21, text, size: 16, weight: 700 },
];

/** A greeting scene. `time` is morning|afternoon|night|leaving. `say` is the speech (omit to show only dots). */
export function greeting(time, say) {
  const t = {
    morning: {
      icons: [
        { icon: "sun", x: 24, y: 70, s: 64 },
        { icon: "bus", x: 380, y: 120, s: 64 },
      ],
      tag: "morning",
      alt: "A low sun and a school bus. A student waves hello to a teacher at the start of the school day.",
    },
    afternoon: {
      icons: [
        { icon: "sun", x: 376, y: 20, s: 64 },
        { icon: "backpack", x: 392, y: 130, s: 56 },
      ],
      tag: "afternoon",
      alt: "A high sun and a backpack. A student waves hello to a teacher after lunch.",
    },
    night: {
      icons: [
        { icon: "moon", x: 24, y: 40, s: 64 },
        { icon: "star", x: 110, y: 28, s: 36 },
        { icon: "house", x: 380, y: 120, s: 64 },
      ],
      tag: "night",
      alt: "A moon and a star over a house. A student waves good night to a family member.",
    },
    any: { icons: [{ icon: "sun", x: 24, y: 60, s: 56 }, { icon: "moon", x: 396, y: 60, s: 56 }], tag: "any time", alt: "A sun on one side and a moon on the other, showing any time of day. A student waves hello to a teacher." },
    later: { icons: [{ icon: "clock", x: 24, y: 70, s: 56 }, { icon: "calendar", x: 396, y: 120, s: 56 }], tag: "see you later", alt: "A clock and a calendar. Two students wave to each other and plan to meet again soon." },
    leaving: {
      icons: [
        { icon: "clock", x: 24, y: 70, s: 56 },
        { icon: "bus", x: 380, y: 120, s: 64 },
      ],
      tag: "end of day",
      alt: "A clock and a school bus. Two students wave to each other as one gets on the bus.",
    },
  }[time];
  return {
    kind: "scene",
    bg: "sky",
    w: 480,
    h: 320,
    alt: say
      ? `${t.alt} A speech bubble says ${say}.`
      : `${t.alt} A speech bubble holds only three dots.`,
    items: [
      ...t.icons.map((i) => ({ ...i })),
      { icon: "student", x: 120, y: 150, s: 96 },
      { icon: "teacher", x: 270, y: 150, s: 96 },
      ...bubble(110, 56, 190, say || "..."),
      ...chip(24, 270, t.tag.length * 11 + 40, t.tag),
    ],
  };
}

/** A row of faces for the "see it" panel. */
export function faceRow(moods) {
  const gap = 480 / moods.length;
  const items = moods.flatMap((m, i) => scaleFace(face(m), gap * i + gap / 2, 100, 0.52));
  return { kind: "shapes", w: 480, h: 200, alt: `A row of ${moods.length} faces showing different feelings.`, items };
}

function scaleFace(f, cx, cy, k) {
  // Re-draw each primitive scaled around the face centre (120,100) and moved to (cx,cy).
  const X = (x) => Math.round((cx + (x - 120) * k) * 10) / 10;
  const Y = (y) => Math.round((cy + (y - 100) * k) * 10) / 10;
  return f.items.map((it) => {
    const o = { ...it };
    if ("cx" in o) {
      o.cx = X(o.cx);
      o.cy = Y(o.cy);
    }
    if ("r" in o && o.t === "circle") o.r = Math.round(o.r * k * 10) / 10;
    if ("rx" in o) {
      o.rx = Math.round(o.rx * k * 10) / 10;
      o.ry = Math.round(o.ry * k * 10) / 10;
    }
    if (o.t === "line") {
      o.x1 = X(o.x1);
      o.y1 = Y(o.y1);
      o.x2 = X(o.x2);
      o.y2 = Y(o.y2);
    }
    if (o.t === "text") {
      o.x = X(o.x);
      o.y = Y(o.y);
      o.size = Math.round(o.size * k);
    }
    if (o.t === "icon") {
      o.x = X(o.x);
      o.y = Y(o.y);
      o.s = Math.round(o.s * k);
    }
    if (o.t === "path") {
      o.d = o.d.replace(
        /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g,
        (_, a, b) => `${X(Number(a))} ${Y(Number(b))}`,
      );
      o.sw = Math.max(2, Math.round((o.sw || 3) * k));
    }
    if (o.t === "line" || o.t === "circle" || o.t === "ellipse")
      if (o.sw) o.sw = Math.max(2, Math.round(o.sw * k));
    return o;
  });
}

export const CONVERSATION_VISUAL = {
  kind: "scene",
  bg: "room",
  w: 480,
  h: 320,
  alt: "Two students stand beside a classroom door. Their speech bubbles read Hola and Cómo estás.",
  items: [
    { icon: "student", x: 90, y: 150, s: 110 },
    { icon: "student", x: 290, y: 150, s: 110 },
    ...bubble(60, 60, 120, "¡Hola!"),
    ...bubble(260, 60, 170, "¿Cómo estás?"),
  ],
};

/** A small face at (cx, cy) for use inside another picture; k scales the 240 by 200 face. */
export const miniFace = (mood, cx, cy, k = 0.4) => scaleFace(face(mood), cx, cy, k);

/** A student says Estoy ___ and a row of feelings follows. */
export const ESTOY_VISUAL = {
  kind: "scene",
  bg: "plain",
  w: 480,
  h: 320,
  alt: "A student with a speech bubble that says Estoy and a blank. Below are three small faces: happy, tired and sad.",
  items: [
    { icon: "student", x: 30, y: 40, s: 120 },
    ...bubble(170, 60, 250, "Estoy ___."),
    ...miniFace("feliz", 100, 240, 0.42),
    ...miniFace("cansado", 240, 240, 0.42),
    ...miniFace("triste", 380, 240, 0.42),
  ],
};
