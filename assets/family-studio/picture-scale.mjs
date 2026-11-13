// "Picture it" recognizers for scaling a ratio (multiply or divide both numbers, or find the factor between two
// rows) and for comparing the volumes of two boxes. Same contract as picture-arith.mjs: the new row, the factor and
// the volumes are never drawn.

import { NUM, PAD, S, W, count, line, num, qPill, rect, show, text, tr } from "./picture-kit.mjs";

// ---------------------------------------------------------------- scale a ratio row

const R = String.raw`(\d+) ?: ?(\d+)`;
const SCALE_NO = /which|sort|match|explain|student|equivalent\?|simplest|recipe|cups|then the|next row/i;

const ratioScale = {
  kind: "ratio-scale",
  match(s) {
    if (SCALE_NO.test(s)) return null;
    const rows = [...s.matchAll(new RegExp(String.raw`(?<![\w.:])${R}(?![\w:]|\.\d)`, "g"))];
    let m = s.match(/\b(multiply|multiplying|divide|dividing) both numbers(?: (?:in|of) (?:the ratio )?(\d+) ?: ?(\d+))? by (\d+)\b/i);
    if (m) {
      const a = m[2] ? +m[2] : rows.length === 1 ? +rows[0][1] : null;
      const b = m[3] ? +m[3] : rows.length === 1 ? +rows[0][2] : null;
      const k = +m[4];
      if (a === null || rows.length !== 1 || count(s.replace(/\brow [12]\b/gi, "row"), /(?<![\w.:])\d+(?![\w:]|\.\d)/g) !== 1) return null;
      if (k < 2 || k > 12) return null;
      const op = /^div/i.test(m[1]) ? "÷" : "×";
      if (op === "÷" && (a % k || b % k)) return null;
      return { a, b, op, k };
    }
    m = s.match(new RegExp(String.raw`scale factor from (?:the row )?${R} to (?:the row )?${R}`, "i")) || s.match(new RegExp(String.raw`go from ${R} down to ${R}, divide both numbers by what`, "i"));
    if (m && rows.length === 2 && count(s, /(?<![\w.:])\d+(?![\w:]|\.\d)/g) === 0) {
      const [a, b, c, d] = m.slice(1, 5).map(Number);
      const down = /down/i.test(m[0]);
      const k = down ? a / c : c / a;
      if (!Number.isInteger(k) || k < 2 || (down ? b / d : d / b) !== k) return null;
      return { a, b, c, d, op: down ? "÷" : "×", k: null };
    }
    return null;
  },
  draw({ a, b, c, d, op, k }, lang) {
    const y = 96;
    const bw = 104;
    const xl = PAD + 18;
    const xr = W - PAD - 18 - bw;
    const out = [];
    out.push(rect(xl, y - 24, bw, 44, "fp-p", 8), S(2, text(xl + bw / 2, y + 5, `${a} : ${b}`, { cls: "fp-t fp-n" })));
    out.push(rect(xr, y - 24, bw, 44, c === undefined ? "fp-g" : "fp-p", 8));
    out.push(line(xl + bw + 8, y - 2, xr - 12, y - 2), `<polygon class="fp-ink" points="${xr - 4},${y - 2} ${xr - 13},${y - 7} ${xr - 13},${y + 3}"/>`);
    const mid = (xl + bw + xr) / 2;
    if (k !== null) {
      out.push(S(2, text(mid, y - 14, `${op} ${k}`, { cls: "fp-t fp-n fp-ta" })));
      out.push(S(3, qPill(xr + bw / 2, y - 2, "? : ?")));
    } else {
      out.push(S(2, text(xr + bw / 2, y + 5, `${c} : ${d}`, { cls: "fp-t fp-n" })));
      out.push(S(3, qPill(mid, y - 30, `${op} ?`)));
    }
    out.push(text(W / 2, y + 52, tr(lang, "Both numbers change by the same factor", "Los dos números cambian por el mismo factor"), { cls: "fp-t fp-s" }));
    const cap =
      k !== null
        ? { en: `${a} : ${b}, with both numbers ${op === "×" ? "multiplied" : "divided"} by ${k}; the new row is unknown`, es: `${a} : ${b}, con los dos números ${op === "×" ? "multiplicados" : "divididos"} entre ${k}; la nueva fila es la incógnita` }
        : { en: `From ${a} : ${b} to ${c} : ${d}; the factor that changes both numbers is unknown`, es: `De ${a} : ${b} a ${c} : ${d}; el factor que cambia los dos números es la incógnita` };
    if (k !== null && op === "×") cap.es = cap.es.replace("multiplicados entre", "multiplicados por");
    return {
      title: { en: "Scaling a ratio", es: "Cambiar la escala de una razón" },
      caption: cap,
      desc: { en: `${cap.en}.`, es: `${cap.es}.` },
      h: y + 70,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- two boxes, volumes unknown

const BOX_NO = /student|round|double|cost|\$|at least|more than \d|need|explain why|sort|match|surface|paper|wrap/i;
const U = String.raw`(?: ?(ft|in|inches|feet|cm|m)\.?)?`;
const DIMS = String.raw`(${NUM})${U} ?(?:by|×|x) ?(${NUM})${U} ?(?:by|×|x) ?(${NUM})${U}`;
const LONG = String.raw`(${NUM})${U} long,? (${NUM})${U} wide,? and (${NUM})${U} (?:tall|deep|high)`;

function readBoxes(s) {
  const out = [];
  for (const re of [DIMS, LONG]) for (const m of s.matchAll(new RegExp(re, "g"))) out.push({ d: [m[1], m[3], m[5]], u: m[2] || m[4] || m[6] || "", at: m.index });
  out.sort((x, y) => x.at - y.at);
  return out;
}

const boxCompare = {
  kind: "box-compare",
  match(s) {
    if (BOX_NO.test(s) || !/which|more|both|in all|total|compare/i.test(s)) return null;
    const bs = readBoxes(s);
    if (bs.length !== 2 || count(s, new RegExp(String.raw`(?<![\w.])(?:${NUM})(?![\w]|[.,]\d)`, "g")) !== 6) return null;
    const unit = bs[0].u || bs[1].u || (s.match(/\b(inches|feet|ft|in)\b/)?.[1] ?? "");
    const labels = bs.map((b, i) => {
      const before = s.slice(Math.max(0, s.lastIndexOf(".", b.at - 2) + 1), b.at);
      const m = [...before.matchAll(/\b(?:Box|Bed|Bin|Crate|Design) ([A-Z0-9])\b/g)].at(-1) || [...before.matchAll(/\bbin ([A-Z])\b/gi)].at(-1);
      return m ? { en: `${m[0].split(" ")[0][0].toUpperCase()}${m[0].split(" ")[0].slice(1).toLowerCase()} ${m[1]}`, es: `${{ box: "Caja", bed: "Cantero", bin: "Recipiente", crate: "Cajón", design: "Diseño" }[m[0].split(" ")[0].toLowerCase()]} ${m[1]}` } : { en: `Box ${i + 1}`, es: `Caja ${i + 1}` };
    });
    return { boxes: bs.map((b) => b.d), unit: { inches: "in", feet: "ft" }[unit] ?? unit, labels };
  },
  draw({ boxes, unit, labels }, lang) {
    const vals = boxes.flat().map(num);
    const k = 64 / Math.max(...vals);
    const out = [];
    const U2 = (t, l = lang) => `${show(t)}${unit ? ` ${l === "es" && unit === "ft" ? "pies" : unit}` : ""}`;
    boxes.forEach((d, i) => {
      const [l, w, h] = d.map((t) => num(t) * k);
      const dx = w * 0.5;
      const dy = w * 0.4;
      const cx = i === 0 ? 92 : 268;
      const x0 = cx - (l + dx) / 2;
      const yb = 150;
      const front = `M${x0} ${yb}h${l}v${-h}h${-l}Z`;
      const top = `M${x0} ${yb - h}l${dx} ${-dy}h${l}l${-dx} ${dy}Z`;
      const side = `M${x0 + l} ${yb}l${dx} ${-dy}v${-h}l${-dx} ${dy}Z`;
      out.push(`<path class="fp-p" d="${front}"/><path class="fp-p" d="${top}"/><path class="fp-p" d="${side}"/>`);
      out.push(text(cx, 32, lang === "es" ? labels[i].es : labels[i].en, { cls: "fp-t fp-n" }));
      out.push(S(2, text(x0 + l / 2, yb + 18, U2(d[0]), { cls: "fp-t fp-s" }), text(x0 + l + dx / 2 + 6, yb - dy / 2 + 14, U2(d[1]), { anchor: "start", cls: "fp-t fp-s" }), text(x0 - 6, yb - h / 2 + 5, U2(d[2]), { anchor: "end", cls: "fp-t fp-s" })));
      out.push(S(3, text(cx - 4, yb + 50, "V =", { anchor: "end", cls: "fp-t fp-n" }), qPill(cx + 22, yb + 45)));
    });
    const say = (i, l) => `${l === "es" ? labels[i].es : labels[i].en}: ${boxes[i].map((t) => U2(t, l)).join(" × ")}`;
    const cap = { en: `${say(0, "en")}; ${say(1, "en")}; both volumes are unknown`, es: `${say(0, "es")}; ${say(1, "es")}; los dos volúmenes son la incógnita` };
    return {
      title: { en: "Two boxes", es: "Dos cajas" },
      caption: cap,
      desc: { en: `${cap.en}. The boxes are drawn to the same scale.`, es: `${cap.es}. Las cajas están dibujadas a la misma escala.` },
      h: 220,
      body: out.join(""),
    };
  },
};

export const SCALE = [ratioScale, boxCompare];
