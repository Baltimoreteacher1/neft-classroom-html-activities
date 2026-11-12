// Place-value engine: adding and subtracting whole numbers and decimals with chips in place columns.
// Every frame is a legal state: a trade moves 10 chips of one place for 1 chip of the next, so the value only
// changes when chips are added or taken away. `value()` is checked by the tests on every frame.
import {
  COLORS,
  L,
  PLACE_COLORS,
  clean,
  decimals,
  esc,
  frame,
  keyed,
  num,
  svgWrap,
  txt,
} from "./core.js";
import { digitsOf, formatLike, parseColumns, regroupPlan } from "../regroup-plan.js";

const NAMES = [
  ["ones", "unidades"],
  ["tens", "decenas"],
  ["hundreds", "centenas"],
  ["thousands", "millares"],
  ["ten-thousands", "decenas de millar"],
  ["hundred-thousands", "centenas de millar"],
  ["millions", "millones"],
];
const FRAC = [
  ["tenths", "décimos"],
  ["hundredths", "centésimos"],
  ["thousandths", "milésimos"],
];
const SINGLE = [
  ["one", "una"],
  ["ten", "decena"],
  ["hundred", "centena"],
  ["thousand", "millar"],
];
const placeName = (e) => {
  const pair = e >= 0 ? NAMES[e] : FRAC[-e - 1];
  return L(pair[0], pair[1]);
};
const unitName = (e) => (e >= 0 && e < 4 ? L(SINGLE[e][0], SINGLE[e][1]) : placeName(e));
// "1 one" / "1 unidad", "13 ones" / "13 unidades": a count of one names the place in the singular (as the written
// steps in regroup-plan.js do), with the Spanish verb agreeing ("no alcanza" / "no alcanzan").
const SINGULAR_ES = ["unidad", "decena", "centena", "millar", "decena de millar", "centena de millar", "millón"];
const SINGULAR_ES_FRAC = ["décimo", "centésimo", "milésimo"];
const counted = (n, e) =>
  n === 1
    ? L(`1 ${unitName(e).en}`, `1 ${e >= 0 ? SINGULAR_ES[e] : SINGULAR_ES_FRAC[-e - 1]}`)
    : L(`${n} ${placeName(e).en}`, `${n} ${placeName(e).es}`);

export const value = (cols) => cols.reduce((sum, count, i) => sum + count * 10 ** i, 0);

// One parser and one regrouping plan for the pictures, the Build panel, the column boxes and the written steps.
export const parse = (question) => parseColumns(question);

function draw(spec, cols, { ring = -1, owe = null, note = null, hide = false } = {}) {
  const n = spec.len;
  const colW = Math.min(112, 540 / n);
  const x0 = 560 / 2 - (colW * n) / 2;
  let out = "";
  for (let i = n - 1; i >= 0; i -= 1) {
    const slot = n - 1 - i;
    const cx = x0 + slot * colW + colW / 2;
    const e = i - spec.d;
    const color = PLACE_COLORS[Math.min(i, PLACE_COLORS.length - 1)];
    const lit = ring === i;
    out += `<rect x="${cx - colW / 2 + 4}" y="14" width="${colW - 8}" height="196" rx="10" fill="${lit ? "#fff7ed" : "#f8fafc"}" stroke="${lit ? COLORS.warn : COLORS.rule}" stroke-width="${lit ? 3 : 1.5}"/>`;
    out += txt(cx, 36, placeName(e), {
      size: colW < 80 ? 10 : 12,
      weight: 800,
      fill: color,
    });
    for (let j = 0; j < cols[i]; j += 1) {
      const col = j % 2;
      const row = Math.floor(j / 2);
      out += keyed(
        `c${i}-${j}`,
        cx - 28 + col * 30,
        48 + row * 17,
        `<rect width="26" height="14" rx="3" fill="${color}" stroke="#fff" stroke-width="1"/>`,
        lit && j >= 10 ? "sd-ring" : "",
      );
    }
    if (!hide) out += txt(cx, 232, String(cols[i]), { size: 22, weight: 900, fill: color });
    if (spec.d > 0 && i === spec.d)
      out += txt(cx + colW / 2, 232, ".", { size: 28, fill: COLORS.ink });
    if (owe) out += txt(cx, 252, owe[i] ? `− ${owe[i]}` : "", { size: 13, fill: COLORS.warn });
  }
  if (note) out += txt(280, 8, note, { size: 11, weight: 600, fill: COLORS.mute });
  return svgWrap(out, "", { h: 262 });
}

const alt = (spec, cols) => {
  const parts = [];
  for (let i = spec.len - 1; i >= 0; i -= 1) parts.push(`${cols[i]} ${placeName(i - spec.d).en}`);
  const es = [];
  for (let i = spec.len - 1; i >= 0; i -= 1) es.push(`${cols[i]} ${placeName(i - spec.d).es}`);
  return L(
    `Place-value chips: ${parts.join(", ")}.`,
    `Fichas de valor posicional: ${es.join(", ")}.`,
  );
};
const shown = (spec, n) => formatLike(spec, n).replace("-", "−");
const eqText = (spec, tail = "") => `${spec.a} ${spec.op === "+" ? "+" : "−"} ${spec.b}${tail}`;

function mk(spec, id, cols, cap, easy, opts = {}, tail = "") {
  const f = frame({
    id,
    cap,
    easy,
    eq: eqText(spec, tail),
    svg: draw(spec, cols, opts),
    alt: alt(spec, cols),
  });
  f.svg = f.svg.replace('aria-label=""', `aria-label="${esc(f.alt.en)}"`);
  f.meta = { cols: [...cols], value: value(cols) };
  return f;
}

export function frames(spec) {
  const { A, B, len } = spec;
  const a = digitsOf(A, len);
  const b = digitsOf(B, len);
  const out = [];
  const first = a;
  if (spec.op === "+") {
    out.push(
      mk(
        spec,
        "build",
        first,
        L(
          `Show ${spec.a}: each digit becomes that many chips in its own place.`,
          `Muestra ${spec.a}: cada dígito son esas fichas en su lugar.`,
        ),
        L(`Show ${spec.a} with chips.`, `Muestra ${spec.a} con fichas.`),
      ),
    );
    const plan = regroupPlan(spec);
    const cols = plan.joined;
    out.push(
      mk(
        spec,
        "join",
        cols,
        L(
          `Add ${spec.b}: put its chips in the same places, then count each place.`,
          `Suma ${spec.b}: pon sus fichas en los mismos lugares y cuenta cada lugar.`,
        ),
        L(`Add ${spec.b}'s chips place by place.`, `Suma las fichas de ${spec.b} lugar por lugar.`),
      ),
    );
    let shownCols = cols;
    for (const e of plan.events) {
      const i = e.from;
      const name = placeName(i - spec.d);
      const up = unitName(i + 1 - spec.d);
      out.push(
        mk(
          spec,
          `ring${i}`,
          shownCols,
          L(
            `${e.had} ${name.en} is 10 or more. Ten ${name.en} chips can be traded for 1 ${up.en}.`,
            `${e.had} ${name.es} son 10 o más. Diez fichas de ${name.es} se pueden cambiar por 1 ${up.es}.`,
          ),
          L(`${e.had} is 10 or more. Trade.`, `${e.had} es 10 o más. Cambia.`),
          { ring: i },
        ),
      );
      shownCols = e.cols;
      out.push(
        mk(
          spec,
          `trade${i}`,
          shownCols,
          L(
            `Trade 10 ${name.en} for 1 ${up.en}: ${name.en} ${e.cols[i]}, ${placeName(i + 1 - spec.d).en} ${e.cols[i + 1]}. The total value stays the same.`,
            `Cambia 10 ${name.es} por 1 ${up.es}: ${name.es} ${e.cols[i]}, ${placeName(i + 1 - spec.d).es} ${e.cols[i + 1]}. El valor total no cambia.`,
          ),
          L(`10 ${name.en} = 1 ${up.en}.`, `10 ${name.es} = 1 ${up.es}.`),
        ),
      );
    }
    out.push(
      mk(
        spec,
        "done",
        shownCols,
        L(
          `Read each place: ${shown(spec, spec.result)}.`,
          `Lee cada lugar: ${shown(spec, spec.result)}.`,
        ),
        L(`The total is ${shown(spec, spec.result)}.`, `El total es ${shown(spec, spec.result)}.`),
        {},
        ` = ${shown(spec, spec.result)}`,
      ),
    );
    return out;
  }
  out.push(
    mk(
      spec,
      "build",
      first,
      L(
        `Show ${spec.a} with chips. We will take away ${spec.b}.`,
        `Muestra ${spec.a} con fichas. Vamos a quitar ${spec.b}.`,
      ),
      L(`Show ${spec.a}. Take away ${spec.b}.`, `Muestra ${spec.a}. Quita ${spec.b}.`),
      { owe: b },
    ),
  );
  const plan = regroupPlan(spec);
  let cols = [...a];
  for (const e of plan.events) {
    const i = e.need;
    const k = e.from;
    const name = placeName(k - spec.d);
    const down = placeName(k - 1 - spec.d);
    out.push(
      mk(
        spec,
        `ring${i}-${k}`,
        cols,
        L(
          `${counted(e.had, i - spec.d).en} is not enough to take away ${b[i]}. Trade 1 ${unitName(k - spec.d).en} for 10 ${down.en}.`,
          `${counted(e.had, i - spec.d).es} no ${e.had === 1 ? "alcanza" : "alcanzan"} para quitar ${b[i]}. Cambia 1 ${unitName(k - spec.d).es} por 10 ${down.es}.`,
        ),
        L(
          `Not enough ${placeName(i - spec.d).en}. Trade one from the next place.`,
          "No alcanzan. Cambia uno del lugar siguiente.",
        ),
        { ring: k, owe: b },
      ),
    );
    cols = e.cols;
    out.push(
      mk(
        spec,
        `break${i}-${k}`,
        cols,
        L(
          `Now ${name.en} has ${cols[k]} and ${down.en} has ${cols[k - 1]}: 1 less and 10 more. The total value is the same.`,
          `Ahora ${name.es} tiene ${cols[k]} y ${down.es} tiene ${cols[k - 1]}: 1 menos y 10 más. El valor total es el mismo.`,
        ),
        L(
          `1 ${unitName(k - spec.d).en} became 10 ${down.en}.`,
          `1 ${unitName(k - spec.d).es} se volvió 10 ${down.es}.`,
        ),
        { owe: b },
      ),
    );
  }
  const left = [...cols];
  out.push(
    mk(
      spec,
      "take",
      left.map((x, i) => x - b[i]),
      L(
        `Take away ${spec.b}'s chips from each place.`,
        `Quita las fichas de ${spec.b} de cada lugar.`,
      ),
      L(`Take away ${spec.b} place by place.`, `Quita ${spec.b} lugar por lugar.`),
    ),
  );
  out.push(
    mk(
      spec,
      "done",
      left.map((x, i) => x - b[i]),
      L(
        `Read each place: ${shown(spec, spec.result)}.`,
        `Lee cada lugar: ${shown(spec, spec.result)}.`,
      ),
      L(
        `The difference is ${shown(spec, spec.result)}.`,
        `La diferencia es ${shown(spec, spec.result)}.`,
      ),
      {},
      ` = ${shown(spec, spec.result)}`,
    ),
  );
  return out;
}

export const answer = (spec) => spec.result / 10 ** spec.d;

const explainTrade = [
  {
    t: L(
      "Ten chips in one place are worth exactly one chip in the next place, so the total stays the same.",
      "Diez fichas de un lugar valen exactamente una del lugar siguiente, así que el total no cambia.",
    ),
    ok: true,
  },
  {
    t: L(
      "Because the bigger places always go first.",
      "Porque los lugares más grandes van primero.",
    ),
    ok: false,
  },
  {
    t: L(
      "Because a place cannot have any chips left over.",
      "Porque un lugar no puede tener fichas sobrantes.",
    ),
    ok: false,
  },
];

export function predicts(spec) {
  const list = frames(spec);
  const { A, B, len } = spec;
  const a = digitsOf(A, len);
  const b = digitsOf(B, len);
  if (spec.op === "+") {
    const at = list.findIndex((f) => f.id.startsWith("ring"));
    if (at < 0)
      return [
        {
          at: list.findIndex((f) => f.id === "done"),
          q: L("Did any place reach 10 or more?", "¿Algún lugar llegó a 10 o más?"),
          choices: [
            {
              t: L("No, so no trade is needed.", "No, así que no hace falta cambiar."),
              ok: true,
              why: L(
                "Each place stays under 10, so the chips can be read as they are.",
                "Cada lugar queda bajo 10, así que se leen tal cual.",
              ),
            },
            {
              t: L("Yes, one place did.", "Sí, un lugar llegó."),
              ok: false,
              why: L(
                "Look at the counts under each column: all are 9 or less.",
                "Mira los conteos bajo cada columna: todos son 9 o menos.",
              ),
            },
          ],
        },
      ];
    const i = Number(list[at].id.slice(4));
    const name = placeName(i - spec.d);
    return [
      {
        at,
        q: L(
          `The ${name.en} place has ${a[i] + b[i]} chips. What should happen next?`,
          `El lugar de ${name.es} tiene ${a[i] + b[i]} fichas. ¿Qué debe pasar ahora?`,
        ),
        choices: [
          {
            t: L(
              `Trade 10 ${name.en} for 1 in the next place.`,
              `Cambiar 10 ${name.es} por 1 del lugar siguiente.`,
            ),
            ok: true,
            why: L(
              "A place holds 0 to 9. Ten make one of the next place and the value stays equal.",
              "Un lugar guarda de 0 a 9. Diez hacen uno del lugar siguiente y el valor es igual.",
            ),
          },
          {
            t: L(
              "Leave them. A place can hold any number.",
              "Dejarlas. Un lugar puede guardar cualquier número.",
            ),
            ok: false,
            why: L(
              "Each place can show only one digit, 0 to 9, so 10 must move up.",
              "Cada lugar muestra un solo dígito, de 0 a 9, así que 10 debe subir.",
            ),
          },
          {
            t: L("Take the extra chips away.", "Quitar las fichas extra."),
            ok: false,
            why: L(
              "Taking chips away would change the total.",
              "Quitar fichas cambiaría el total.",
            ),
          },
        ],
        explain: explainTrade,
      },
    ];
  }
  const at = list.findIndex((f) => f.id.startsWith("ring"));
  if (at < 0)
    return [
      {
        at: list.findIndex((f) => f.id === "take"),
        q: L(
          "Is there enough in every place to take away?",
          "¿Hay suficiente en cada lugar para quitar?",
        ),
        choices: [
          {
            t: L("Yes, every place has enough.", "Sí, cada lugar tiene suficiente."),
            ok: true,
            why: L(
              "Each top digit is at least as big as the digit under it.",
              "Cada dígito de arriba es al menos tan grande como el de abajo.",
            ),
          },
          {
            t: L("No, we must trade a chip.", "No, hay que cambiar una ficha."),
            ok: false,
            why: L(
              "Compare each pair of digits: none needs more than it has.",
              "Compara cada par de dígitos: ninguno necesita más de lo que tiene.",
            ),
          },
        ],
      },
    ];
  const i = Number(list[at].id.slice(4).split("-")[0]);
  const name = placeName(i - spec.d);
  return [
    {
      at,
      q: L(
        `You need to take ${b[i]} ${name.en} but there are only ${a[i]}. What can you do?`,
        `Debes quitar ${b[i]} ${name.es} pero solo hay ${a[i]}. ¿Qué puedes hacer?`,
      ),
      choices: [
        {
          t: L(
            "Trade 1 chip from the next place for 10 here.",
            "Cambiar 1 ficha del lugar siguiente por 10 aquí.",
          ),
          ok: true,
          why: L(
            "1 of the next place equals 10 here, so you keep the same total and now have enough.",
            "1 del lugar siguiente es igual a 10 aquí, así que el total sigue igual y ya alcanza.",
          ),
        },
        {
          t: L(
            "Take the smaller digit from the bigger one instead.",
            "Restar el dígito menor del mayor.",
          ),
          ok: false,
          why: L(
            "Order matters in subtraction. The top number is the one you start with.",
            "El orden importa en la resta. El número de arriba es el que tienes al inicio.",
          ),
        },
        {
          t: L("Skip this place.", "Saltar este lugar."),
          ok: false,
          why: L(
            "Every place must have its chips taken away.",
            "A cada lugar hay que quitarle sus fichas.",
          ),
        },
      ],
      explain: [
        {
          t: L(
            "Because 1 chip from the next place is worth 10 here, so the total stays the same.",
            "Porque 1 ficha del lugar siguiente vale 10 aquí, así que el total no cambia.",
          ),
          ok: true,
        },
        {
          t: L(
            "Because subtraction always needs more chips.",
            "Porque restar siempre necesita más fichas.",
          ),
          ok: false,
        },
        {
          t: L(
            "Because bigger places have to be smaller.",
            "Porque los lugares grandes tienen que ser más pequeños.",
          ),
          ok: false,
        },
      ],
    },
  ];
}

export function hints(spec) {
  const list = frames(spec);
  let join = list.find((f) => f.id === "join" || f.id === "build");
  let ring = list.find((f) => f.id.startsWith("ring")) || join;
  if (spec.op === "+") {
    // Both numbers' chips, with the column totals left off: a total in a single place can be the answer itself.
    const a = digitsOf(spec.A, spec.len);
    const b = digitsOf(spec.B, spec.len);
    join = ring = mk(spec, "peek", a.map((x, i) => x + b[i]), L("chips", "fichas"), L("chips", "fichas"), { hide: true });
  }
  const first =
    spec.op === "+"
      ? L(
          "Start at the ones place: how many chips are there together? If it is 10 or more, trade.",
          "Empieza en las unidades: ¿cuántas fichas hay juntas? Si son 10 o más, cambia.",
        )
      : L(
          "Start at the ones place: can you take away the bottom digit? If not, trade one from the next place.",
          "Empieza en las unidades: ¿puedes quitar el dígito de abajo? Si no, cambia una del lugar siguiente.",
        );
  return [
    {
      text:
        spec.op === "+"
          ? L(
              "Work one place at a time, from the smallest place. Ask: does any place have 10 or more?",
              "Trabaja un lugar a la vez, desde el más pequeño. Pregunta: ¿algún lugar tiene 10 o más?",
            )
          : L(
              "Work one place at a time, from the smallest place. Ask: is there enough here to take away?",
              "Trabaja un lugar a la vez, desde el más pequeño. Pregunta: ¿hay suficiente aquí para quitar?",
            ),
    },
    {
      text: L(
        "The picture shows the chips in each place. Look for the place that needs attention.",
        "El dibujo muestra las fichas de cada lugar. Busca el lugar que necesita atención.",
      ),
      frame: ring,
    },
    { text: first, frame: join },
  ];
}

export function diagnose(spec, submitted) {
  const { A, B, len } = spec;
  const a = digitsOf(A, len);
  const b = digitsOf(B, len);
  const s = Math.round(submitted * 10 ** spec.d);
  if (spec.op === "+") {
    const noCarry = value(a.map((x, i) => (x + b[i]) % 10));
    if (s === noCarry && s !== spec.result) return "noCarry";
  } else {
    const flip = value(a.map((x, i) => Math.abs(x - b[i])));
    if (s === flip && s !== spec.result) return "smallFromBig";
    if (s === spec.result + 10 ** 1 || s === spec.result + 10 ** 2) return "forgotReduce";
  }
  return null;
}

export const tags = {
  noCarry: {
    label: L("Left out the trade", "No hizo el cambio"),
    tip: L(
      "A place with 10 or more chips needs a trade. Watch the trade, then add the new chip.",
      "Un lugar con 10 o más fichas necesita un cambio. Mira el cambio y suma la ficha nueva.",
    ),
  },
  smallFromBig: {
    label: L("Subtracted the smaller digit from the bigger", "Restó el dígito menor del mayor"),
    tip: L(
      "Subtraction starts from the top number. Trade a chip from the next place when you need more.",
      "La resta empieza con el número de arriba. Cambia una ficha del lugar siguiente cuando necesites más.",
    ),
  },
  forgotReduce: {
    label: L("Traded a chip but did not take it away", "Cambió una ficha pero no la quitó"),
    tip: L(
      "When you trade a chip, the place you took it from has one less.",
      "Cuando cambias una ficha, el lugar de donde salió tiene una menos.",
    ),
  },
};

// ----- Build: the learner makes the trades themselves. -----
export const build = {
  prompt: (spec) =>
    spec.op === "+"
      ? L(
          "Trade 10 chips for 1 in the next place wherever a place has 10 or more.",
          "Cambia 10 fichas por 1 del lugar siguiente donde un lugar tenga 10 o más.",
        )
      : L(
          "Take away the bottom number place by place. Trade a chip when a place does not have enough.",
          "Quita el número de abajo lugar por lugar. Cambia una ficha cuando un lugar no alcance.",
        ),
  init(spec) {
    const a = digitsOf(spec.A, spec.len);
    const b = digitsOf(spec.B, spec.len);
    return {
      cols: spec.op === "+" ? a.map((x, i) => x + b[i]) : [...a],
      owe: spec.op === "+" ? null : [...b],
    };
  },
  render(state, spec) {
    const need = state.owe
      ? state.owe.some(Boolean)
      : state.cols.some((c, i) => c >= 10 && i < spec.len - 1);
    const controls = [];
    for (let i = 0; i < spec.len; i += 1) {
      const name = placeName(i - spec.d).en;
      if (spec.op === "+" && i < spec.len - 1)
        controls.push({
          id: "trade",
          arg: i,
          label: L(`Trade 10 ${name}`, `Cambiar 10 ${placeName(i - spec.d).es}`),
        });
      if (spec.op === "-") {
        if (i > 0)
          controls.push({
            id: "break",
            arg: i,
            label: L(`Trade 1 ${name}`, `Cambiar 1 ${placeName(i - spec.d).es}`),
          });
        if (state.owe[i])
          controls.push({
            id: "take",
            arg: i,
            label: L(
              `Take away ${state.owe[i]} ${name}`,
              `Quitar ${state.owe[i]} ${placeName(i - spec.d).es}`,
            ),
          });
      }
    }
    return {
      svg: draw(spec, state.cols, { owe: state.owe }).replace(
        'aria-label=""',
        `aria-label="${esc(alt(spec, state.cols).en)}"`,
      ),
      alt: alt(spec, state.cols),
      controls,
      status: need
        ? null
        : L(
            `Done. Read the places: ${shown(spec, value(state.cols))}.`,
            `Listo. Lee los lugares: ${shown(spec, value(state.cols))}.`,
          ),
    };
  },
  act(state, action, arg) {
    const cols = [...state.cols];
    if (action === "trade") {
      if (cols[arg] < 10)
        return {
          state,
          ok: false,
          msg: L(
            "You need 10 chips in a place to trade.",
            "Necesitas 10 fichas en un lugar para cambiar.",
          ),
          tag: "tooFew",
        };
      cols[arg] -= 10;
      cols[arg + 1] += 1;
      return { state: { ...state, cols }, ok: true };
    }
    if (action === "break") {
      if (cols[arg] < 1)
        return {
          state,
          ok: false,
          msg: L(
            "There is no chip to trade here. Try the next place up.",
            "No hay ficha para cambiar aquí. Prueba el lugar siguiente.",
          ),
          tag: "empty",
        };
      cols[arg] -= 1;
      cols[arg - 1] += 10;
      return { state: { ...state, cols }, ok: true };
    }
    if (action === "take") {
      if (cols[arg] < state.owe[arg])
        return {
          state,
          ok: false,
          msg: L(
            "Not enough chips here yet. Trade one from the next place first.",
            "Todavía no hay suficientes fichas. Primero cambia una del lugar siguiente.",
          ),
          tag: "notEnough",
        };
      cols[arg] -= state.owe[arg];
      const owe = [...state.owe];
      owe[arg] = 0;
      return { state: { cols, owe }, ok: true };
    }
    return { state, ok: false };
  },
  done: (state, spec) =>
    state.owe ? !state.owe.some(Boolean) : state.cols.every((c, i) => c < 10 || i === spec.len - 1),
  total: (state) => value(state.cols),
};
