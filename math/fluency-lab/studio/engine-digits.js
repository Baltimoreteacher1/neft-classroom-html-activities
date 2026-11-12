// Digits engine: naming a digit's place and value, and comparing whole numbers and decimals place by place.
// A digit's value is the digit times its place, and the larger number is decided at the first place, from the
// left, where the digits differ. Frames record the place and value so the tests can recompute them.
import { COLORS, L, PLACE_COLORS, clean, esc, frame, num, svgWrap, txt } from "./core.js";

const PLACES = [
  ["ones", "unidades", 0],
  ["tens", "decenas", 1],
  ["hundreds", "centenas", 2],
  ["thousands", "millares", 3],
  ["ten-thousands", "decenas de millar", 4],
  ["hundred-thousands", "centenas de millar", 5],
  ["millions", "millones", 6],
  ["tenths", "décimos", -1],
  ["hundredths", "centésimos", -2],
  ["thousandths", "milésimos", -3],
];
const byName = Object.fromEntries(PLACES.map(([en, es, e]) => [en, { en, es, e }]));
const byExp = Object.fromEntries(PLACES.map(([en, es, e]) => [e, { en, es, e }]));
const pname = (e) => L(byExp[e].en, byExp[e].es);

// "806665" → columns from the left, each with its exponent. "2.698" → 2 (ones) . 6 (tenths) ...
function columns(text) {
  const [whole, frac = ""] = text.split(".");
  return [...whole].map((d, i) => ({ d: Number(d), e: whole.length - 1 - i })).concat([...frac].map((d, i) => ({ d: Number(d), e: -1 - i })));
}

export function parse(question) {
  const q = clean(question);
  let m = q.match(/^What (digit is|is the value of the digit) in the (ten-thousands|hundred-thousands|thousands|hundreds|tenths|hundredths|thousandths|tens|ones|millions) place of (\d+(?:\.\d+)?)\?$/);
  if (m) {
    const cols = columns(m[3]);
    const place = byName[m[2]];
    const col = cols.find((c) => c.e === place.e);
    if (!col || cols.length > 9) return null;
    const value = col.d * 10 ** place.e;
    return { engine: "digits", mode: m[1] === "digit is" ? "digit" : "value", text: m[3], cols, place, digit: col.d, value: Math.round(value * 1000) / 1000, result: m[1] === "digit is" ? col.d : Math.round(value * 1000) / 1000 };
  }
  m = q.match(/^(\d+(?:\.\d+)?) ___ (\d+(?:\.\d+)?)$/);
  if (m && !m[1].includes("/") && m[1].length <= 8 && m[2].length <= 8) {
    const [x, y] = [num(m[1]), num(m[2])];
    const [a, b] = align(m[1], m[2]);
    const at = a.findIndex((c, i) => c.d !== b[i].d);
    return { engine: "digits", mode: "compare", ta: m[1], tb: m[2], a, b, at, result: x > y ? ">" : x < y ? "<" : "=" };
  }
  return null;
}
// Pad both numbers to the same columns so each place lines up.
function align(ta, tb) {
  const ca = columns(ta);
  const cb = columns(tb);
  const hi = Math.max(ca[0].e, cb[0].e);
  const lo = Math.min(ca.at(-1).e, cb.at(-1).e);
  const fill = (cols) => {
    const out = [];
    for (let e = hi; e >= lo; e -= 1) out.push({ e, d: cols.find((c) => c.e === e)?.d ?? 0, pad: !cols.find((c) => c.e === e) });
    return out;
  };
  return [fill(ca), fill(cb)];
}

function mat(rows, { hi = null, label = null } = {}) {
  const n = rows[0].length;
  const w = Math.min(70, 480 / n);
  const x0 = 280 - (w * n) / 2;
  let out = "";
  rows.forEach((row, r) => {
    row.forEach((c, i) => {
      const x = x0 + i * w;
      const lit = hi === c.e;
      out += `<rect x="${x + 3}" y="${50 + r * 78}" width="${w - 6}" height="64" rx="10" fill="${lit ? "#fff7ed" : "#f8fafc"}" stroke="${lit ? COLORS.warn : COLORS.rule}" stroke-width="${lit ? 4 : 1.5}"/>`;
      out += txt(x + w / 2, 94 + r * 78, c.pad ? "0" : String(c.d), { size: 30, weight: 900, fill: c.pad ? COLORS.rule : PLACE_COLORS[Math.max(0, c.e) % PLACE_COLORS.length] });
      if (r === 0) {
        // "hundred-thousands" / "centenas de millar" are wider than a column: break them (at the hyphen, before
        // "de") so neighbours never overlap. Each language is laid out on its own, since they break differently.
        for (const lang of ["en", "es"]) {
          const name = byExp[c.e]?.[lang] ?? "";
          const cut = lang === "en" ? name.indexOf("-") + 1 : name.indexOf(" de ") + 1;
          const parts = cut > 0 ? [name.slice(0, cut).trim(), name.slice(cut).trim()] : [name];
          parts.forEach((part, line) => {
            out += txt(x + w / 2, parts.length > 1 ? 26 + line * 12 : 38, part, { size: w < 52 ? 9 : 11, weight: 800, fill: COLORS.mute, lang });
          });
        }
      }
    });
  });
  if (label) out += txt(280, 50 + rows.length * 78 + 28, label, { size: 18, fill: COLORS.ink });
  return svgWrap(out, "", { h: 60 + rows.length * 78 + 24 });
}
const mk = (id, cap, easy, eq, svg, alt, meta = {}) => Object.assign(frame({ id, cap, easy, eq, svg: svg.replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt }), { meta });
const sym = { ">": L("greater than", "mayor que"), "<": L("less than", "menor que"), "=": L("equal to", "igual a") };

export function frames(s) {
  if (s.mode === "compare") {
    const alt = L(`${s.ta} and ${s.tb} lined up place by place.`, `${s.ta} y ${s.tb} alineados lugar por lugar.`);
    const at = s.at;
    const place = at >= 0 ? s.a[at].e : null;
    const same = at < 0;
    return [
      mk("align", L(`Line up ${s.ta} and ${s.tb} so each place matches. Add zeros to fill empty places.`, `Alinea ${s.ta} y ${s.tb} para que cada lugar coincida. Agrega ceros en los lugares vacíos.`), L("Line up the places.", "Alinea los lugares."), `${s.ta} ? ${s.tb}`, mat([s.a, s.b]), alt, { at }),
      mk("scan", same ? L("Every place has the same digit, so the numbers are equal.", "Todos los lugares tienen el mismo dígito, así que los números son iguales.") : L(`Start at the left. Skip places where the digits match. The first difference is the ${pname(place).en} place.`, `Empieza por la izquierda. Salta los lugares donde los dígitos coinciden. La primera diferencia está en las ${pname(place).es}.`), L(same ? "All the same." : `First difference: ${pname(place).en}.`, same ? "Todo igual." : `Primera diferencia: ${pname(place).es}.`), `${s.ta} ? ${s.tb}`, mat([s.a, s.b], { hi: place }), alt, { at, place }),
      mk("decide", same ? L(`${s.ta} = ${s.tb}.`, `${s.ta} = ${s.tb}.`) : L(`${s.a[at].d} is ${s.a[at].d > s.b[at].d ? "more" : "less"} than ${s.b[at].d} in the ${pname(place).en} place, so ${s.ta} is ${sym[s.result].en} ${s.tb}.`, `${s.a[at].d} es ${s.a[at].d > s.b[at].d ? "mayor" : "menor"} que ${s.b[at].d} en las ${pname(place).es}, así que ${s.ta} es ${sym[s.result].es} ${s.tb}.`), L(`${s.ta} ${s.result} ${s.tb}`, `${s.ta} ${s.result} ${s.tb}`), `${s.ta} ${s.result} ${s.tb}`, mat([s.a, s.b], { hi: place }), alt, { at, place, result: s.result }),
    ];
  }
  const { text, cols, place, digit, value } = s;
  const alt = L(`The number ${text} in place-value columns, ${place.en} highlighted.`, `El número ${text} en columnas de valor posicional, con las ${place.es} resaltadas.`);
  const rows = [cols];
  return [
    mk("columns", L(`Write ${text} in place-value columns. Each digit sits in a place.`, `Escribe ${text} en columnas de valor posicional. Cada dígito está en un lugar.`), L("Digits in places.", "Dígitos en lugares."), text, mat(rows), alt, { place: place.e }),
    mk("find", L(`Find the ${place.en} place. The digit there is ${digit}.`, `Busca las ${place.es}. El dígito ahí es ${digit}.`), L(`The ${place.en} digit is ${digit}.`, `El dígito de las ${place.es} es ${digit}.`), text, mat(rows, { hi: place.e }), alt, { place: place.e, digit }),
    ...(s.mode === "value"
      ? [mk("value", L(`The value is the digit times its place: ${digit} × ${place.e >= 0 ? 10 ** place.e : (10 ** place.e).toFixed(-place.e)} = ${value}.`, `El valor es el dígito por su lugar: ${digit} × ${place.e >= 0 ? 10 ** place.e : (10 ** place.e).toFixed(-place.e)} = ${value}.`), L(`${digit} in the ${place.en} place is worth ${value}.`, `${digit} en las ${place.es} vale ${value}.`), `${digit} × ${place.e >= 0 ? 10 ** place.e : (10 ** place.e).toFixed(-place.e)} = ${value}`, mat(rows, { hi: place.e }), alt, { place: place.e, digit, value })]
      : []),
  ];
}

export const answer = (s) => s.result;

export function predicts(s) {
  if (s.mode === "compare" && s.at >= 0)
    return [{ at: 2, q: L(`The first place where ${s.ta} and ${s.tb} differ is the ${pname(s.a[s.at].e).en} place. What decides which is greater?`, `El primer lugar donde ${s.ta} y ${s.tb} difieren son las ${pname(s.a[s.at].e).es}. ¿Qué decide cuál es mayor?`), choices: [
      { t: L("The bigger digit in that place.", "El dígito mayor en ese lugar."), ok: true, why: L("Places to the left are worth more, so the first difference from the left settles it.", "Los lugares a la izquierda valen más, así que la primera diferencia desde la izquierda lo decide.") },
      { t: L("The number with more digits to its right.", "El número con más dígitos a la derecha."), ok: false, why: L("Extra digits to the right are worth less than the places already compared.", "Los dígitos extra a la derecha valen menos que los lugares ya comparados.") },
    ], explain: [{ t: L("Because a place on the left is worth more than all the places to its right put together.", "Porque un lugar a la izquierda vale más que todos los lugares a su derecha juntos."), ok: true }, { t: L("Because longer numbers are always bigger.", "Porque los números más largos siempre son mayores."), ok: false }] }];
  if (s.mode === "value")
    return [{ at: 2, q: L(`The digit in the ${s.place.en} place is ${s.digit}. Is its value ${s.digit}, or ${s.digit} times its place?`, `El dígito de las ${s.place.es} es ${s.digit}. ¿Su valor es ${s.digit}, o ${s.digit} por su lugar?`), choices: [
      { t: L(`${s.digit} times its place.`, `${s.digit} por su lugar.`), ok: true, why: L("A digit's value depends on where it sits: the same digit is worth more in a bigger place.", "El valor de un dígito depende de dónde está: el mismo dígito vale más en un lugar mayor.") },
      { t: L(`Just ${s.digit}.`, `Solo ${s.digit}.`), ok: false, why: L("That is the digit, not its value. The place changes how much it is worth.", "Eso es el dígito, no su valor. El lugar cambia cuánto vale.") },
    ], explain: [{ t: L("Because each place is worth ten times the place to its right.", "Porque cada lugar vale diez veces el lugar a su derecha."), ok: true }, { t: L("Because every digit is worth its own number.", "Porque cada dígito vale su propio número."), ok: false }] }];
  return [];
}

export function hints(s) {
  const list = frames(s);
  const first = list[0];
  if (s.mode === "compare")
    return [{ text: L("Compare place by place, starting at the left, where places are worth the most.", "Compara lugar por lugar, empezando por la izquierda, donde los lugares valen más.") }, { text: L("The numbers are lined up so each place matches.", "Los números están alineados para que cada lugar coincida."), frame: first }, { text: L("Skip places where the digits are the same. Look at the first place where they differ.", "Salta los lugares con el mismo dígito. Mira el primer lugar donde difieren."), frame: first }];
  return [{ text: L("Each digit lives in a place. Name the place the question asks about.", "Cada dígito vive en un lugar. Nombra el lugar por el que pregunta la pregunta.") }, { text: L("The columns show every place of the number.", "Las columnas muestran cada lugar del número."), frame: first }, { text: s.mode === "value" ? L("Find the digit in that place. Then think about what that place is worth.", "Halla el dígito en ese lugar. Luego piensa cuánto vale ese lugar.") : L("Find the column for that place and read the digit in it.", "Halla la columna de ese lugar y lee el dígito."), frame: first }];
}

export function diagnose(s, raw) {
  const v = num(raw);
  if (s.mode === "compare" || v === null || v === s.result) return null;
  if (s.mode === "value" && v === s.digit) return "digitNotValue";
  if (s.mode === "digit" && v === s.value) return "valueNotDigit";
  const mirror = s.cols[s.cols.length - 1 - s.cols.findIndex((c) => c.e === s.place.e)];
  if (s.mode === "digit" && mirror && v === mirror.d) return "readFromRight";
  return null;
}
export const tags = {
  digitNotValue: { label: L("Gave the digit, not its value", "Dio el dígito, no su valor"), tip: L("The value is the digit times its place. Say how much it is worth.", "El valor es el dígito por su lugar. Di cuánto vale.") },
  valueNotDigit: { label: L("Gave the value, not the digit", "Dio el valor, no el dígito"), tip: L("The question asks for the digit in that place, one symbol from 0 to 9.", "La pregunta pide el dígito en ese lugar, un símbolo de 0 a 9.") },
  readFromRight: { label: L("Counted the places from the wrong end", "Contó los lugares desde el extremo equivocado"), tip: L("Places start at the ones, next to the decimal point, and grow to the left.", "Los lugares empiezan en las unidades, junto al punto decimal, y crecen hacia la izquierda.") },
};

export const build = {
  available: (s) => !(s.mode === "compare" && s.at < 0),
  prompt: (s) => (s.mode === "compare" ? L("Tap the place that decides which number is greater.", "Toca el lugar que decide cuál número es mayor.") : L(`Tap the ${s.place.en} place.`, `Toca las ${s.place.es}.`)),
  init: () => ({ pick: null }),
  render(st, s) {
    const cols = s.mode === "compare" ? s.a : s.cols;
    const target = s.mode === "compare" ? (s.at >= 0 ? s.a[s.at].e : null) : s.place.e;
    const alt = L("Place-value columns.", "Columnas de valor posicional.");
    const done = st.pick !== null && st.pick === target;
    return {
      svg: (s.mode === "compare" ? mat([s.a, s.b], { hi: st.pick }) : mat([s.cols], { hi: st.pick })).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
      alt,
      controls: cols.map((c) => ({ id: "pick", arg: c.e, label: L(byExp[c.e].en, byExp[c.e].es) })),
      status: done ? (s.mode === "compare" ? L(`Yes: ${pname(target).en} is the first place that differs.`, `Sí: las ${pname(target).es} son el primer lugar que difiere.`) : L(`Yes: the ${pname(target).en} digit is ${s.digit}${s.mode === "value" ? `, worth ${s.value}` : ""}.`, `Sí: el dígito de las ${pname(target).es} es ${s.digit}${s.mode === "value" ? `, vale ${s.value}` : ""}.`)) : null,
    };
  },
  act(st, id, arg, s) {
    const target = s.mode === "compare" ? (s.at >= 0 ? s.a[s.at].e : null) : s.place.e;
    const right = arg === target;
    return { state: { pick: arg }, ok: right, msg: right ? null : s.mode === "compare" ? L("Compare from the left. Skip places where the digits match.", "Compara desde la izquierda. Salta los lugares donde los dígitos coinciden.") : L(`That is the ${pname(arg).en} place. Look for the ${s.place.en}.`, `Esas son las ${pname(arg).es}. Busca las ${s.place.es}.`), tag: right ? null : "wrongPlace" };
  },
  done: (st, s) => st.pick !== null && st.pick === (s.mode === "compare" ? (s.at >= 0 ? s.a[s.at].e : null) : s.place.e),
};
