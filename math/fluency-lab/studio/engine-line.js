// Integer engine: signed number line and zero-pair chips. Both representations follow the same rule, so a
// learner can switch between them and see the same sum. Subtracting a negative is shown as removing negative
// chips (adding zero pairs first when there are not enough), never as a remembered rule.
import { COLORS, L, clean, esc, frame, keyed, num, svgWrap, txt } from "./core.js";

export function parse(question) {
  const q = clean(question);
  let m = q.match(/^(-?\d+) ([+-]) \(?(-?\d+)\)? = \?$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[3]);
    const op = m[2];
    const delta = op === "+" ? b : -b;
    return {
      engine: "line",
      mode: "move",
      a,
      b,
      op,
      delta,
      result: a + delta,
      target: a + delta,
      reps: Math.abs(a) <= 12 && Math.abs(b) <= 12 ? ["line", "chips"] : ["line"],
    };
  }
  m = q.match(/^\|(-?\d+)\| = \?$/);
  if (m)
    return {
      engine: "line",
      mode: "abs",
      a: Number(m[1]),
      result: Math.abs(Number(m[1])),
      target: 0,
      reps: ["line"],
    };
  return null;
}

const signed = (n) => (n < 0 ? `−${-n}` : String(n));
const sp = (n) => (n < 0 ? `(−${-n})` : String(n));

function line(spec, { pos, show = "start", span = null }) {
  const pts = [spec.a, spec.result ?? 0, 0, pos];
  const lo = Math.min(...pts) - 2;
  const hi = Math.max(...pts) + 2;
  const x = (v) => 40 + ((v - lo) / (hi - lo)) * 480;
  const step = hi - lo <= 30 ? 1 : hi - lo <= 70 ? 5 : 10;
  let out = `<line x1="30" x2="530" y1="130" y2="130" stroke="${COLORS.ink}" stroke-width="3"/>`;
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    out += `<line x1="${x(v)}" x2="${x(v)}" y1="${v === 0 ? 116 : 122}" y2="${v === 0 ? 144 : 138}" stroke="${COLORS.ink}" stroke-width="${v === 0 ? 4 : 2}"/>`;
    out += txt(x(v), 166, signed(v), {
      size: 13,
      weight: v === 0 ? 900 : 600,
      fill: v === 0 ? COLORS.ink : COLORS.mute,
    });
  }
  if (span) {
    const [from, to] = span;
    const dir = to >= from ? 1 : -1;
    const mid = (x(from) + x(to)) / 2;
    out += `<path d="M${x(from)},120 Q${mid},${40} ${x(to)},120" fill="none" stroke="${spec.mode === "abs" ? COLORS.warn : dir > 0 ? COLORS.part : COLORS.warn}" stroke-width="5" stroke-linecap="round" marker-end="url(#ar)"/>`;
    out += `<defs><marker id="ar" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${spec.mode === "abs" ? COLORS.warn : dir > 0 ? COLORS.part : COLORS.warn}"/></marker></defs>`;
    out += txt(mid, 36, `${dir > 0 ? "→" : "←"} ${Math.abs(to - from)}`, {
      size: 20,
      fill: COLORS.ink,
    });
  }
  out += keyed(
    "tok",
    x(pos),
    130,
    `<circle r="13" fill="${COLORS.whole}" stroke="#fff" stroke-width="3"/><text y="5" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">${esc(signed(pos))}</text>`,
    "sd-token",
  );
  return svgWrap(out, "", { h: 190 }).replace(
    'class="sd-svg"',
    `class="sd-svg" data-x0="${x(lo)}" data-lo="${lo}" data-hi="${hi}"`,
  );
}
const lineAlt = (pos, extra = "") =>
  L(
    `Number line with a point at ${signed(pos)}.${extra}`,
    `Recta numérica con un punto en ${signed(pos)}.${extra}`,
  );
const mkLine = (spec, id, pos, cap, easy, eq, span = null) => {
  const alt = lineAlt(pos, span ? ` Arrow from ${signed(span[0])} to ${signed(span[1])}.` : "");
  return Object.assign(
    frame({
      id,
      cap,
      easy,
      eq,
      svg: line(spec, { pos, span }).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
      alt,
    }),
    { meta: { pos } },
  );
};

function chipsSvg(pos, neg, { ring = 0, label = "" } = {}) {
  let out = "";
  const cell = 34;
  const draw = (count, kind, x0) => {
    let g = "";
    for (let j = 0; j < count; j += 1) {
      const px = x0 + (j % 4) * cell;
      const py = 40 + Math.floor(j / 4) * cell;
      const glow = j < ring ? "sd-ring" : "";
      g += keyed(
        `${kind}${j}`,
        px,
        py,
        `<circle r="14" fill="${kind === "p" ? COLORS.whole : COLORS.warn}" stroke="#fff" stroke-width="2"/><text y="6" text-anchor="middle" font-size="20" font-weight="900" fill="#fff">${kind === "p" ? "+" : "−"}</text>`,
        glow,
      );
    }
    return g;
  };
  out += txt(120, 24, "+", { size: 18, fill: COLORS.whole }) + draw(pos, "p", 50);
  out += txt(400, 24, "−", { size: 18, fill: COLORS.warn }) + draw(neg, "n", 330);
  out += txt(280, 238, label, { size: 15, fill: COLORS.mute });
  return svgWrap(out, "", { h: 250 });
}
const chipsAlt = (pos, neg) =>
  L(
    `${pos} positive chips and ${neg} negative chips.`,
    `${pos} fichas positivas y ${neg} fichas negativas.`,
  );
const mkChips = (id, pos, neg, cap, easy, eq, ring = 0) => {
  const alt = chipsAlt(pos, neg);
  return Object.assign(
    frame({
      id,
      cap,
      easy,
      eq,
      svg: chipsSvg(pos, neg, { ring }).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
      alt,
    }),
    { meta: { value: pos - neg, pos, neg } },
  );
};

export function frames(spec, rep = "line") {
  if (spec.mode === "abs") {
    const d = spec.a;
    return [
      mkLine(
        spec,
        "show",
        d,
        L(`Plot ${signed(d)} on the number line.`, `Ubica ${signed(d)} en la recta numérica.`),
        L(`${signed(d)} is on the line.`, `${signed(d)} está en la recta.`),
        `|${signed(d)}|`,
      ),
      mkLine(
        spec,
        "dist",
        0,
        L(
          `Absolute value is the distance from zero. Count the steps from ${signed(d)} to 0. Distance is never negative.`,
          `El valor absoluto es la distancia a cero. Cuenta los pasos de ${signed(d)} a 0. La distancia nunca es negativa.`,
        ),
        L("Count steps to 0.", "Cuenta los pasos hasta 0."),
        `|${signed(d)}|`,
        [d, 0],
      ),
      mkLine(
        spec,
        "done",
        0,
        L(`The distance is ${spec.result}.`, `La distancia es ${spec.result}.`),
        L(`${spec.result} steps.`, `${spec.result} pasos.`),
        `|${signed(d)}| = ${spec.result}`,
        [d, 0],
      ),
    ];
  }
  const { a, b, op, delta, result } = spec;
  const sym = op === "+" ? "+" : "−";
  const eq = `${signed(a)} ${sym} ${sp(b)}`;
  if (rep === "chips") return chipFrames(spec, eq);
  const why =
    op === "-" && b < 0
      ? L(
          `Subtracting ${signed(b)} undoes adding ${signed(b)}. It moves the opposite way: right ${-b}.`,
          `Restar ${signed(b)} deshace sumar ${signed(b)}. Se mueve al lado contrario: derecha ${-b}.`,
        )
      : delta >= 0
        ? L(`The move is to the right ${delta}.`, `El movimiento es a la derecha ${delta}.`)
        : L(`The move is to the left ${-delta}.`, `El movimiento es a la izquierda ${-delta}.`);
  return [
    mkLine(
      spec,
      "start",
      a,
      L(`Start at ${signed(a)}.`, `Empieza en ${signed(a)}.`),
      L(`Start at ${signed(a)}.`, `Empieza en ${signed(a)}.`),
      eq,
    ),
    mkLine(
      spec,
      "direction",
      a,
      L(`${eq}: which way and how far? ${why.en}`, `${eq}: ¿hacia dónde y cuánto? ${why.es}`),
      L(
        delta >= 0 ? `Move right ${delta}.` : `Move left ${-delta}.`,
        delta >= 0 ? `Mueve a la derecha ${delta}.` : `Mueve a la izquierda ${-delta}.`,
      ),
      eq,
    ),
    mkLine(
      spec,
      "move",
      result,
      L(
        `Move ${Math.abs(delta)} ${delta >= 0 ? "to the right" : "to the left"}. You land at ${signed(result)}.`,
        `Muévete ${Math.abs(delta)} ${delta >= 0 ? "a la derecha" : "a la izquierda"}. Llegas a ${signed(result)}.`,
      ),
      L(`You land at ${signed(result)}.`, `Llegas a ${signed(result)}.`),
      `${eq} = ${signed(result)}`,
      [a, result],
    ),
  ];
}

function chipFrames(spec, eq) {
  const { a, b, op, result } = spec;
  let pos = Math.max(a, 0);
  let neg = Math.max(-a, 0);
  const out = [
    mkChips(
      "start",
      pos,
      neg,
      L(`Show ${signed(a)} with chips.`, `Muestra ${signed(a)} con fichas.`),
      L(`${signed(a)} as chips.`, `${signed(a)} con fichas.`),
      eq,
    ),
  ];
  const kind = b >= 0 ? "pos" : "neg";
  const mag = Math.abs(b);
  if (op === "+") {
    if (kind === "pos") pos += mag;
    else neg += mag;
    out.push(
      mkChips(
        "add",
        pos,
        neg,
        L(
          `Add ${mag} ${kind === "pos" ? "positive" : "negative"} chips.`,
          `Suma ${mag} fichas ${kind === "pos" ? "positivas" : "negativas"}.`,
        ),
        L(`Put in ${mag} chips.`, `Pon ${mag} fichas.`),
        eq,
      ),
    );
  } else {
    const have = kind === "pos" ? pos : neg;
    if (have < mag) {
      const k = mag - have;
      pos += k;
      neg += k;
      out.push(
        mkChips(
          "pairs",
          pos,
          neg,
          L(
            `There are not enough ${kind === "pos" ? "positive" : "negative"} chips to take away. Add ${k} zero pair${k > 1 ? "s" : ""} (one + and one −). The value stays the same.`,
            `No hay suficientes fichas ${kind === "pos" ? "positivas" : "negativas"} para quitar. Agrega ${k} par${k > 1 ? "es" : ""} cero (un + y un −). El valor no cambia.`,
          ),
          L(`Add ${k} zero pair${k > 1 ? "s" : ""}.`, `Agrega ${k} par${k > 1 ? "es" : ""} cero.`),
          eq,
        ),
      );
    }
    if (kind === "pos") pos -= mag;
    else neg -= mag;
    out.push(
      mkChips(
        "take",
        pos,
        neg,
        L(
          `Take away ${mag} ${kind === "pos" ? "positive" : "negative"} chips.`,
          `Quita ${mag} fichas ${kind === "pos" ? "positivas" : "negativas"}.`,
        ),
        L(`Take away ${mag}.`, `Quita ${mag}.`),
        eq,
      ),
    );
  }
  const pairs = Math.min(pos, neg);
  if (pairs > 0) {
    out.push(
      mkChips(
        "ring",
        pos,
        neg,
        L(
          `Each + with a − makes a zero pair. There are ${pairs}.`,
          `Cada + con un − hace un par cero. Hay ${pairs}.`,
        ),
        L(
          `${pairs} zero pair${pairs > 1 ? "s" : ""}.`,
          `${pairs} par${pairs > 1 ? "es" : ""} cero.`,
        ),
        eq,
        pairs,
      ),
    );
    pos -= pairs;
    neg -= pairs;
  }
  out.push(
    mkChips(
      "done",
      pos,
      neg,
      L(
        `What is left shows the answer: ${signed(result)}.`,
        `Lo que queda muestra la respuesta: ${signed(result)}.`,
      ),
      L(`Left: ${signed(result)}.`, `Queda: ${signed(result)}.`),
      `${eq} = ${signed(result)}`,
    ),
  );
  return out;
}

export const answer = (spec) => spec.result;

export function predicts(spec) {
  if (spec.mode === "abs")
    return [
      {
        at: 1,
        q: L(
          `${signed(spec.a)} is ${spec.a < 0 ? "left" : "right"} of zero. Can its distance from zero be negative?`,
          `${signed(spec.a)} está a la ${spec.a < 0 ? "izquierda" : "derecha"} de cero. ¿Puede su distancia a cero ser negativa?`,
        ),
        choices: [
          {
            t: L("No. Distance is a count of steps.", "No. La distancia es un conteo de pasos."),
            ok: true,
            why: L(
              "You cannot walk a negative number of steps, so absolute value is never negative.",
              "No se puede caminar un número negativo de pasos, así que el valor absoluto nunca es negativo.",
            ),
          },
          {
            t: L("Yes, it matches the sign.", "Sí, coincide con el signo."),
            ok: false,
            why: L(
              "The sign tells the side of zero. The distance is only how far.",
              "El signo dice el lado de cero. La distancia solo dice cuán lejos.",
            ),
          },
        ],
      },
    ];
  const { delta, op, b } = spec;
  return [
    {
      at: 1,
      q:
        op === "-" && b < 0
          ? L(
              `${signed(spec.a)} − ${sp(b)}. Subtracting a negative number: which way will the point move?`,
              `${signed(spec.a)} − ${sp(b)}. Al restar un número negativo, ¿hacia dónde se mueve el punto?`,
            )
          : L(
              `${signed(spec.a)} ${op === "+" ? "+" : "−"} ${sp(b)}. Which way will the point move?`,
              `${signed(spec.a)} ${op === "+" ? "+" : "−"} ${sp(b)}. ¿Hacia dónde se mueve el punto?`,
            ),
      choices: [
        {
          t: L("To the right (up)", "A la derecha (sube)"),
          ok: delta >= 0,
          why:
            delta >= 0
              ? op === "-"
                ? L(
                    "Taking away a negative removes something that was pulling you left, so you end up farther right.",
                    "Quitar un negativo elimina lo que te jalaba a la izquierda, así que terminas más a la derecha.",
                  )
                : L(
                    "Adding a positive number moves right.",
                    "Sumar un positivo mueve a la derecha.",
                  )
              : L(
                  "Look at the sign and the operation together: this move goes left.",
                  "Mira el signo y la operación juntos: este movimiento va a la izquierda.",
                ),
        },
        {
          t: L("To the left (down)", "A la izquierda (baja)"),
          ok: delta < 0,
          why:
            delta < 0
              ? L(
                  "Adding a negative, or taking away a positive, moves left.",
                  "Sumar un negativo o quitar un positivo mueve a la izquierda.",
                )
              : L(
                  op === "-"
                    ? "Subtract does not always mean left. Subtracting a negative reverses the move."
                    : "A positive amount added moves right.",
                  op === "-"
                    ? "Restar no siempre es ir a la izquierda. Restar un negativo invierte el movimiento."
                    : "Sumar una cantidad positiva mueve a la derecha.",
                ),
        },
      ],
      explain: [
        {
          t:
            op === "-" && b < 0
              ? L(
                  "Because subtracting a negative undoes a move to the left, so it moves right.",
                  "Porque restar un negativo deshace un movimiento a la izquierda, así que se mueve a la derecha.",
                )
              : L(
                  "Because the sign and the operation together tell the direction.",
                  "Porque el signo y la operación juntos dicen la dirección.",
                ),
          ok: true,
        },
        {
          t: L(
            "Because subtract always moves left.",
            "Porque restar siempre mueve a la izquierda.",
          ),
          ok: false,
        },
      ],
    },
  ];
}

export function hints(spec) {
  const list = frames(spec);
  if (spec.mode === "abs")
    return [
      {
        text: L(
          "Absolute value asks how far a number is from zero.",
          "El valor absoluto pregunta qué tan lejos está un número de cero.",
        ),
      },
      {
        text: L(
          "Picture the number on the line and zero.",
          "Imagina el número en la recta y el cero.",
        ),
        frame: list[0],
      },
      {
        text: L("Count the steps from the number to zero.", "Cuenta los pasos del número a cero."),
        frame: list[1],
      },
    ];
  return [
    {
      text: L(
        "Decide first: does this move go right or left? Look at the sign and the operation together.",
        "Decide primero: ¿este movimiento va a la derecha o a la izquierda? Mira el signo y la operación juntos.",
      ),
    },
    {
      text: L(
        "The picture shows where you start and the direction of the move.",
        "El dibujo muestra dónde empiezas y la dirección del movimiento.",
      ),
      frame: list[1],
    },
    {
      text: L(
        `Start at ${signed(spec.a)} and move ${Math.abs(spec.delta)} steps ${spec.delta >= 0 ? "right" : "left"}. Where do you land?`,
        `Empieza en ${signed(spec.a)} y mueve ${Math.abs(spec.delta)} pasos a la ${spec.delta >= 0 ? "derecha" : "izquierda"}. ¿Dónde llegas?`,
      ),
      frame: list[0],
    },
  ];
}

export function diagnose(spec, raw) {
  const v = num(raw);
  if (v === null || spec.mode !== "move" || v === spec.result) return null;
  if (v === -spec.result) return "wrongSign";
  if (spec.op === "-" && spec.b < 0 && v === spec.a - Math.abs(spec.b)) return "minusMeansLeft";
  if (spec.op === "+" && spec.b < 0 && v === spec.a + Math.abs(spec.b)) return "ignoredNegative";
  return null;
}

export const tags = {
  wrongSign: {
    label: L("Right size, wrong side of zero", "Tamaño correcto, lado equivocado de cero"),
    tip: L(
      "Check which side of zero you land on. Walk the move on the line.",
      "Revisa en qué lado de cero llegas. Recorre el movimiento en la recta.",
    ),
  },
  minusMeansLeft: {
    label: L(
      "Moved left when subtracting a negative",
      "Se movió a la izquierda al restar un negativo",
    ),
    tip: L(
      "Subtracting a negative undoes a move left, so the point goes right. Try it with chips.",
      "Restar un negativo deshace un movimiento a la izquierda, así que el punto va a la derecha. Pruébalo con fichas.",
    ),
  },
  ignoredNegative: {
    label: L("Ignored the negative sign", "Ignoró el signo negativo"),
    tip: L(
      "Adding a negative moves left. The sign changes the direction.",
      "Sumar un negativo mueve a la izquierda. El signo cambia la dirección.",
    ),
  },
};

// ----- Build: drag the point (or use the buttons) and watch the equation. -----
export const build = {
  prompt: (spec) =>
    spec.mode === "abs"
      ? L(
          "Move the point to zero. How many steps does it take?",
          "Mueve el punto a cero. ¿Cuántos pasos da?",
        )
      : L(
          `Start at ${signed(spec.a)}. Move the point to show ${signed(spec.a)} ${spec.op === "+" ? "+" : "−"} ${sp(spec.b)}.`,
          `Empieza en ${signed(spec.a)}. Mueve el punto para mostrar ${signed(spec.a)} ${spec.op === "+" ? "+" : "−"} ${sp(spec.b)}.`,
        ),
  init: (spec) => ({ pos: spec.a, steps: 0 }),
  render(state, spec) {
    const alt = lineAlt(state.pos);
    const done = state.pos === spec.target;
    const big = Math.abs(spec.a) + Math.abs(spec.delta ?? 0) > 30;
    const controls = [
      { id: "move", arg: -1, label: L("← 1 left", "← 1 a la izquierda") },
      { id: "move", arg: 1, label: L("1 right →", "1 a la derecha →") },
    ];
    if (big)
      controls.push(
        { id: "move", arg: -10, label: L("← 10 left", "← 10 a la izquierda") },
        { id: "move", arg: 10, label: L("10 right →", "10 a la derecha →") },
      );
    return {
      svg: line(spec, {
        pos: state.pos,
        span: state.pos !== spec.a ? [spec.a, state.pos] : null,
      }).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
      alt,
      controls,
      status: done
        ? L(
            `You are at ${signed(state.pos)}. ${spec.mode === "abs" ? `It took ${state.steps} steps: the distance is ${state.steps}.` : `${signed(spec.a)} ${spec.op === "+" ? "+" : "−"} ${sp(spec.b)} = ${signed(state.pos)}.`}`,
            `Estás en ${signed(state.pos)}.`,
          )
        : L(
            `The point is at ${signed(state.pos)}. Moved ${state.pos - spec.a >= 0 ? "right" : "left"} ${Math.abs(state.pos - spec.a)}.`,
            `El punto está en ${signed(state.pos)}.`,
          ),
      drag: { min: -60, max: 60 },
    };
  },
  act(state, action, arg, spec) {
    if (action === "goto") arg = arg - state.pos;
    const pos = Math.min(80, Math.max(-80, state.pos + arg));
    const next = { pos, steps: state.steps + Math.abs(arg) };
    if (spec.mode === "move" && pos === spec.a - spec.delta && spec.delta !== 0 && pos !== spec.a)
      return {
        state: next,
        ok: false,
        msg: L(
          spec.op === "-" && spec.b < 0
            ? "That is the opposite direction. Subtracting a negative undoes a move left."
            : "That is the opposite direction. Check the sign and the operation.",
          "Esa es la dirección contraria. Revisa el signo y la operación.",
        ),
        tag: "wrongWay",
      };
    return { state: next, ok: true };
  },
  done: (state, spec) => state.pos === spec.target,
};
