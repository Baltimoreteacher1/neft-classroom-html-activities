// Equation engine: a balance scale. The equation is (an/ad)·x + b = c with whole-number b and c. Every move
// applies one operation to both pans, so the solution never changes; the tests substitute the known solution
// into every frame. A move that would leave a fraction in a constant is refused with a reason.
import { COLORS, L, clean, esc, frame, gcd, keyed, num, svgWrap, txt } from "./core.js";

export function parse(question) {
  const q = clean(question)
    .replace(/\. Find x\.$/, "")
    .replace(/ /g, "");
  let m = q.match(/^(\d*)x([+-])(\d+)=(-?\d+)$/);
  if (m)
    return make(Number(m[1] || 1), 1, m[2] === "+" ? Number(m[3]) : -Number(m[3]), Number(m[4]));
  m = q.match(/^(\d+)x=(-?\d+)$/);
  if (m) return make(Number(m[1]), 1, 0, Number(m[2]));
  m = q.match(/^x([+-])(\d+)=(-?\d+)$/);
  if (m) return make(1, 1, m[1] === "+" ? Number(m[2]) : -Number(m[2]), Number(m[3]));
  m = q.match(/^x÷(\d+)=(-?\d+)$/);
  if (m) return make(1, Number(m[1]), 0, Number(m[2]));
  return null;
}
function make(an, ad, b, c) {
  const x = (c - b) * (ad / an);
  if (!Number.isInteger(x)) return null;
  return { engine: "balance", an, ad, b, c, x, eq: { an, ad, b, c } };
}

const coef = (e) =>
  e.ad === 1 ? (e.an === 1 ? "x" : `${e.an}x`) : e.an === 1 ? `x/${e.ad}` : `(${e.an}/${e.ad})x`;
const sgn = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`);
export const eqText = (e) =>
  `${coef(e)}${e.b ? ` ${sgn(e.b)}` : ""} = ${String(e.c).replace("-", "−")}`;
export const holds = (e, x) => e.an * x + e.b * e.ad === e.c * e.ad;
const isSolved = (e) => e.an === e.ad && e.b === 0;

function tile(key, x, y, w, label, { fill = COLORS.whole, ghost = false, ring = false } = {}) {
  return keyed(
    key,
    x - w / 2,
    y,
    `<rect width="${w}" height="44" rx="9" fill="${ghost ? "#fff" : fill}" fill-opacity="${ghost ? 1 : 0.92}" stroke="${ghost ? COLORS.warn : "#fff"}" stroke-width="${ghost ? 3 : 2}" stroke-dasharray="${ghost ? "7 5" : "0"}"/><text x="${w / 2}" y="29" text-anchor="middle" font-size="20" font-weight="800" fill="${ghost ? COLORS.warn : "#fff"}">${esc(label)}</text>`,
    ring ? "sd-ring" : "",
  );
}
const width = (label) => Math.max(54, 16 + String(label).length * 13);

// tilt: +1 when the left pan is heavier, -1 right, 0 level. `ghost` adds the operation to the pans.
function scale(e, { tilt = 0, ghostL = null, ghostR = null, ringB = false } = {}) {
  const yL = 150 + tilt * 22;
  const yR = 150 - tilt * 22;
  let out = `<polygon points="280,148 250,222 310,222" fill="${COLORS.rule}"/>`;
  out += `<line x1="100" y1="${yL - 38}" x2="460" y2="${yR - 38}" stroke="${COLORS.ink}" stroke-width="7" stroke-linecap="round" style="transition:all .5s"/>`;
  for (const [cx, y] of [
    [130, yL],
    [430, yR],
  ])
    out += `<path d="M${cx - 70},${y} h140 q-10,24 -50,24 h-40 q-40,0 -50,-24z" fill="#e2e8f0" stroke="${COLORS.ink}" stroke-width="2" style="transition:all .5s"/><line x1="${cx - 60}" y1="${y - 36}" x2="${cx - 70}" y2="${y}" stroke="${COLORS.ink}"/><line x1="${cx + 60}" y1="${y - 36}" x2="${cx + 70}" y2="${y}" stroke="${COLORS.ink}"/>`;
  const lx = coef(e);
  const bw = e.b ? width(sgn(e.b)) : 0;
  const total = width(lx) + (e.b ? bw + 8 : 0) + (ghostL ? width(ghostL) + 8 : 0);
  let cursor = 130 - total / 2;
  const place = (label, opts, key) => {
    const w = width(label);
    out += tile(key, cursor + w / 2, yL - 52, w, label, opts);
    cursor += w + 8;
  };
  place(lx, { fill: COLORS.whole }, "L-x");
  if (e.b) place(sgn(e.b), { fill: e.b < 0 ? COLORS.warn : COLORS.part, ring: ringB }, "L-b");
  if (ghostL) place(ghostL, { ghost: true, ring: ringB }, "L-g");
  const rc = String(e.c).replace("-", "−");
  const rw = width(rc) + (ghostR ? width(ghostR) + 8 : 0);
  let rcur = 430 - rw / 2;
  out += tile("R-c", rcur + width(rc) / 2, yR - 52, width(rc), rc, {
    fill: e.c < 0 ? COLORS.warn : COLORS.hundreds,
  });
  rcur += width(rc) + 8;
  if (ghostR)
    out += tile("R-g", rcur + width(ghostR) / 2, yR - 52, width(ghostR), ghostR, { ghost: true });
  return svgWrap(out, "", { h: 240 });
}
const state = (e, tilt) =>
  tilt === 0
    ? L(`Balanced scale: ${eqText(e)}.`, `Balanza equilibrada: ${eqText(e)}.`)
    : L(
        `The scale tips: the ${tilt > 0 ? "left" : "right"} pan is heavier.`,
        `La balanza se inclina: el platillo ${tilt > 0 ? "izquierdo" : "derecho"} pesa más.`,
      );
const mk = (id, e, cap, easy, opts = {}, tilt = 0) => {
  const alt = state(e, tilt);
  return Object.assign(
    frame({
      id,
      cap,
      easy,
      eq: eqText(e),
      svg: scale(e, { tilt, ...opts }).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
      alt,
    }),
    { meta: { eq: { ...e }, tilt } },
  );
};

// The sequence of legal moves from the starting equation to x = value.
export function moves(e0) {
  const list = [];
  let e = { ...e0 };
  if (e.b !== 0) {
    const k = -e.b;
    list.push({ kind: "add", n: k });
    e = { ...e, b: 0, c: e.c + k };
  }
  if (e.an !== e.ad) {
    if (e.ad > 1 && e.an === 1) list.push({ kind: "mul", n: e.ad });
    else list.push({ kind: "div", n: e.an });
  }
  return list;
}
export const apply = (e, mv) => {
  if (mv.kind === "add") return { ...e, b: e.b + mv.n, c: e.c + mv.n };
  if (mv.kind === "mul") return reduce({ an: e.an * mv.n, ad: e.ad, b: e.b * mv.n, c: e.c * mv.n });
  return reduce({ an: e.an, ad: e.ad * mv.n, b: e.b / mv.n, c: e.c / mv.n });
};
const reduce = (e) => {
  const g = gcd(e.an, e.ad) || 1;
  return { ...e, an: e.an / g, ad: e.ad / g };
};
const phrase = (mv) =>
  mv.kind === "add"
    ? mv.n < 0
      ? L(`subtract ${-mv.n}`, `resta ${-mv.n}`)
      : L(`add ${mv.n}`, `suma ${mv.n}`)
    : mv.kind === "mul"
      ? L(`multiply by ${mv.n}`, `multiplica por ${mv.n}`)
      : L(`divide by ${mv.n}`, `divide entre ${mv.n}`);
const ghostLabel = (mv) =>
  mv.kind === "add"
    ? mv.n < 0
      ? `− ${-mv.n}`
      : `+ ${mv.n}`
    : mv.kind === "mul"
      ? `× ${mv.n}`
      : `÷ ${mv.n}`;

export function frames(spec) {
  let e = { ...spec.eq };
  const out = [
    mk(
      "start",
      e,
      L(
        "The scale is balanced: both pans hold the same amount. Our job is to get x alone.",
        "La balanza está equilibrada: ambos platillos tienen la misma cantidad. Nuestra meta es dejar x solo.",
      ),
      L("Both sides are equal.", "Los dos lados son iguales."),
    ),
  ];
  for (const mv of moves(e)) {
    const p = phrase(mv);
    const g = ghostLabel(mv);
    out.push(
      mk(
        `op-${mv.kind}`,
        e,
        L(
          `To keep it balanced, ${p.en} on both pans.`,
          `Para mantener el equilibrio, ${p.es} en ambos platillos.`,
        ),
        L(`Do the same on both sides.`, `Haz lo mismo en los dos lados.`),
        { ghostL: g, ghostR: g, ringB: mv.kind === "add" },
      ),
    );
    e = apply(e, mv);
    out.push(
      mk(
        `res-${mv.kind}`,
        e,
        L(`Now the scale shows ${eqText(e)}.`, `Ahora la balanza muestra ${eqText(e)}.`),
        L(`${eqText(e)}.`, `${eqText(e)}.`),
      ),
    );
  }
  out.push(
    mk(
      "done",
      e,
      L(
        `x = ${String(e.c).replace("-", "−")}. Check: put it back in the first equation and both pans match.`,
        `x = ${String(e.c).replace("-", "−")}. Comprueba: ponlo en la primera ecuación y los platillos coinciden.`,
      ),
      L(`x = ${String(e.c).replace("-", "−")}`, `x = ${String(e.c).replace("-", "−")}`),
    ),
  );
  return out;
}

export const answer = (spec) => spec.x;

export function predicts(spec) {
  const list = frames(spec);
  const at = 1;
  const mv = moves(spec.eq)[0];
  if (!mv) return [];
  const p = phrase(mv);
  const opp =
    mv.kind === "add"
      ? mv.n < 0
        ? L(`add ${-mv.n}`, `suma ${-mv.n}`)
        : L(`subtract ${mv.n}`, `resta ${mv.n}`)
      : mv.kind === "mul"
        ? L(`divide by ${mv.n}`, `divide entre ${mv.n}`)
        : L(`multiply by ${mv.n}`, `multiplica por ${mv.n}`);
  return [
    {
      at,
      q: L(
        `To get x alone, what should we do first?`,
        `Para dejar x solo, ¿qué debemos hacer primero?`,
      ),
      choices: [
        {
          t: L(
            `${p.en[0].toUpperCase()}${p.en.slice(1)} on both pans.`,
            `${p.es[0].toUpperCase()}${p.es.slice(1)} en ambos platillos.`,
          ),
          ok: true,
          why: L(
            "This undoes the number next to x, and doing it on both pans keeps the scale balanced.",
            "Esto deshace el número junto a x, y hacerlo en ambos platillos mantiene el equilibrio.",
          ),
        },
        {
          t: L(
            `${p.en[0].toUpperCase()}${p.en.slice(1)} on the left pan only.`,
            `${p.es[0].toUpperCase()}${p.es.slice(1)} solo en el platillo izquierdo.`,
          ),
          ok: false,
          why: L(
            "Then the pans hold different amounts and the scale tips. Both sides must change the same way.",
            "Entonces los platillos tienen distinta cantidad y la balanza se inclina. Los dos lados deben cambiar igual.",
          ),
        },
        {
          t: L(
            `${opp.en[0].toUpperCase()}${opp.en.slice(1)} on both pans.`,
            `${opp.es[0].toUpperCase()}${opp.es.slice(1)} en ambos platillos.`,
          ),
          ok: false,
          why: L(
            "That keeps it balanced but makes the number next to x bigger instead of removing it. Use the opposite operation.",
            "Eso mantiene el equilibrio pero agranda el número junto a x en lugar de quitarlo. Usa la operación opuesta.",
          ),
        },
      ],
      explain: [
        {
          t: L(
            "Because the opposite operation undoes the number next to x, and both pans must change the same way.",
            "Porque la operación opuesta deshace el número junto a x y los dos platillos deben cambiar igual.",
          ),
          ok: true,
        },
        {
          t: L(
            "Because we always start with the right pan.",
            "Porque siempre empezamos con el platillo derecho.",
          ),
          ok: false,
        },
      ],
    },
  ];
}

export function hints(spec) {
  const list = frames(spec);
  const mv = moves(spec.eq)[0];
  return [
    {
      text: L(
        "Which number is stuck to x? Use the opposite operation to remove it.",
        "¿Qué número está pegado a x? Usa la operación opuesta para quitarlo.",
      ),
    },
    {
      text: L(
        "The scale shows what stays equal: whatever happens on one pan must happen on the other.",
        "La balanza muestra lo que se mantiene igual: lo que pase en un platillo debe pasar en el otro.",
      ),
      frame: list[1],
    },
    {
      text: L(
        `First move: ${phrase(mv).en} on both sides. Then look at what is left and keep going.`,
        `Primer paso: ${phrase(mv).es} en ambos lados. Luego mira lo que queda y sigue.`,
      ),
      frame: list[1],
    },
  ];
}

export function diagnose(spec, raw) {
  const v = num(raw);
  if (v === null || v === spec.x) return null;
  const { an, ad, b, c } = spec.eq;
  if (v === ((c + b) * ad) / an) return "wrongSign";
  if (ad === 1 && v === c / an - b) return "dividedPart";
  if (an === 1 && ad === 1 && v === c + b) return "wrongSign";
  if (ad > 1 && v === c / ad) return "wrongInverse";
  if (b === 0 && ad === 1 && v === c * an) return "wrongInverse";
  return null;
}
export const tags = {
  wrongSign: {
    label: L(
      "Used the same operation instead of the opposite",
      "Usó la misma operación en lugar de la opuesta",
    ),
    tip: L(
      "To undo +b you subtract b; to undo −b you add b. Watch the move on the scale.",
      "Para deshacer +b se resta b; para deshacer −b se suma b. Mira el movimiento en la balanza.",
    ),
  },
  dividedPart: {
    label: L("Divided only the x part", "Dividió solo la parte de x"),
    tip: L(
      "Dividing by the coefficient must happen to every term on the pan, so remove the constant first.",
      "Dividir entre el coeficiente debe pasar con todos los términos del platillo, así que primero quita la constante.",
    ),
  },
  wrongInverse: {
    label: L("Used the wrong inverse operation", "Usó la operación inversa equivocada"),
    tip: L(
      "Multiplying and dividing undo each other. Pick the opposite of what is done to x.",
      "Multiplicar y dividir se deshacen entre sí. Elige lo opuesto de lo que se le hace a x.",
    ),
  },
};

// ----- Build: choose a move; it is applied to both pans or refused. -----
export const build = {
  prompt: () =>
    L(
      "Get x alone. Pick an operation to do on both pans.",
      "Deja x solo. Elige una operación para hacer en ambos platillos.",
    ),
  init: (spec) => ({ e: { ...spec.eq }, log: [] }),
  render(state, spec, extra = {}) {
    const e = state.e;
    const first = moves(e)[0];
    const n = first ? Math.abs(first.n) : 1;
    const options = [];
    const addN = (k) =>
      options.push({
        id: "op",
        arg: { kind: "add", n: k },
        label:
          k < 0
            ? L(`Subtract ${-k} from both sides`, `Restar ${-k} en ambos lados`)
            : L(`Add ${k} to both sides`, `Sumar ${k} en ambos lados`),
      });
    if (e.b !== 0) {
      addN(-e.b);
      addN(e.b);
    }
    if (e.an !== e.ad) {
      const dn = e.an;
      options.push({
        id: "op",
        arg: { kind: "div", n: dn },
        label: L(`Divide both sides by ${dn}`, `Dividir entre ${dn} en ambos lados`),
      });
      if (e.ad > 1)
        options.push({
          id: "op",
          arg: { kind: "mul", n: e.ad },
          label: L(`Multiply both sides by ${e.ad}`, `Multiplicar por ${e.ad} en ambos lados`),
        });
    }
    if (first)
      options.push({
        id: "one",
        arg: first,
        label: L(
          `Try "${phrase(first).en}" on the left pan only`,
          `Probar "${phrase(first).es}" solo en el platillo izquierdo`,
        ),
      });
    const done = isSolved(e);
    const alt = state_(e);
    return {
      svg: scale(e, { tilt: extra.tilt || 0 }).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
      alt,
      controls: done ? [] : options,
      status: done
        ? L(
            `x = ${e.c}. The scale stayed balanced the whole way.`,
            `x = ${e.c}. La balanza se mantuvo equilibrada todo el tiempo.`,
          )
        : L(`Equation: ${eqText(e)}`, `Ecuación: ${eqText(e)}`),
    };
  },
  act(st, action, mv) {
    if (action === "one")
      return {
        state: st,
        ok: false,
        msg: L(
          "The scale tips: the pans hold different amounts. An equation stays true only if both sides change the same way.",
          "La balanza se inclina: los platillos tienen distinta cantidad. Una ecuación sigue siendo verdadera solo si ambos lados cambian igual.",
        ),
        tag: "oneSide",
        tilt: mv.kind === "add" && mv.n < 0 ? -1 : 1,
      };
    if (mv.kind === "div" && (st.e.b % mv.n || st.e.c % mv.n))
      return {
        state: st,
        ok: false,
        msg: L(
          `Dividing by ${mv.n} would have to divide every term. ${st.e.b % mv.n ? Math.abs(st.e.b) : st.e.c} is not a multiple of ${mv.n}, so remove the constant first.`,
          `Dividir entre ${mv.n} tendría que dividir todos los términos. ${st.e.b % mv.n ? Math.abs(st.e.b) : st.e.c} no es múltiplo de ${mv.n}, así que primero quita la constante.`,
        ),
        tag: "dividedPart",
      };
    const next = apply(st.e, mv);
    const worse = mv.kind === "add" && Math.abs(next.b) > Math.abs(st.e.b);
    return {
      state: { e: next, log: [...st.log, mv] },
      ok: true,
      msg: worse
        ? L(
            "Still balanced, but the number next to x got bigger. Try the opposite operation.",
            "Sigue equilibrada, pero el número junto a x creció. Prueba la operación opuesta.",
          )
        : null,
      tag: worse ? "wrongSign" : null,
    };
  },
  done: (st) => isSolved(st.e),
};
const state_ = (e) => state(e, 0);
