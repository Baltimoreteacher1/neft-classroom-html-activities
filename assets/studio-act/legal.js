/**
 * Practice Studio activity: legal (window.StudioAct kind "legal"), lesson 8-7 "Legal-plan test".
 * A story gives a price per item and a limit. The student builds a model (a left side and a symbol, with the limit on the
 * right). On Check the app plugs in plans the story allows and plans it does not, and the model must say yes to the first
 * and no to the second. A model of "= limit" fails: "5 bags is a legal plan, but your equation says no".
 * The activity teaches reading the question ("must it equal, or is it a limit?"), never a cue-word list.
 * State: { expr: "px" | "p+v" | "v/p" | null, sign: "=" | "<" | "<=" | ">" | ">=" | null }.
 * Contract: docs/specs/practice-studio-v2.md section 5; feedback shape in docs/audits/studio-v4/RULES.md.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = () => A.kit;

  const SIGNS = ["=", "<", "<=", ">", ">="];
  const SHOWN = { "=": "=", "<": "<", "<=": "≤", ">": ">", ">=": "≥" };
  const NAME = {
    "=": ["equals", "es igual a"],
    "<": ["is less than", "es menor que"],
    "<=": ["is less than or equal to", "es menor o igual que"],
    ">": ["is greater than", "es mayor que"],
    ">=": ["is greater than or equal to", "es mayor o igual que"],
  };
  const cmp = (/** @type {string} */ sign, /** @type {number} */ a, /** @type {number} */ b) =>
    sign === "="
      ? a === b
      : sign === "<"
        ? a < b
        : sign === "<="
          ? a <= b
          : sign === ">"
            ? a > b
            : a >= b;

  // [one, many, uno, muchos, letter]
  const ITEMS = [
    ["bag", "bags", "bolsa", "bolsas", "b"],
    ["ticket", "tickets", "boleto", "boletos", "t"],
    ["notebook", "notebooks", "cuaderno", "cuadernos", "n"],
    ["necklace", "necklaces", "collar", "collares", "n"],
    ["T-shirt", "T-shirts", "camiseta", "camisetas", "s"],
    ["bracelet", "bracelets", "pulsera", "pulseras", "p"],
  ];

  /** value of the left side for b items; prices are whole cents so no float noise reaches a comparison */
  const lhs = (/** @type {string} */ expr, /** @type {number} */ pc, /** @type {number} */ b) =>
    expr === "px" ? pc * b : expr === "p+v" ? pc + b * 100 : (b * 100 * 100) / pc;
  /** does the model say "yes" to b items? (limit in cents; v/p is scaled the same way) */
  const modelSays = (/** @type {any} */ spec, /** @type {any} */ st, /** @type {number} */ b) => {
    const left = lhs(st.expr, spec.pc, b);
    return cmp(st.sign, Math.round(left * 1e6) / 1e6, spec.Lc);
  };
  const legal = (/** @type {any} */ spec, /** @type {number} */ b) => {
    const cost = spec.pc * b;
    return spec.dir === "max"
      ? spec.strict
        ? cost < spec.Lc
        : cost <= spec.Lc
      : spec.strict
        ? cost > spec.Lc
        : cost >= spec.Lc;
  };
  /** the text of the model with b items plugged in: "6 × 5 = 30" and "30 ≤ 40" */
  const plug = (/** @type {any} */ spec, /** @type {any} */ st, /** @type {number} */ b) => {
    const k = K();
    const p = k.n(spec.pc / 100);
    const val = k.n(Math.round((lhs(st.expr, spec.pc, b) / 100) * 100) / 100);
    const w = st.expr === "px" ? `${p} × ${b}` : st.expr === "p+v" ? `${p} + ${b}` : `${b} ÷ ${p}`;
    return { work: `${w} = ${val}`, rel: `${val} ${SHOWN[st.sign]} ${k.n(spec.Lc / 100)}` };
  };

  function make(/** @type {any} */ rng, /** @type {number} */ lv, /** @type {any} */ _p) {
    const k = K();
    const item = rng.pick(ITEMS);
    const dir = lv === 1 ? "max" : rng.pick(["max", "min"]);
    const strict = lv >= 3 && rng.chance(0.5);
    const decimal = lv === 4 && rng.chance(0.5);
    const p = decimal ? rng.pick([1.5, 2.5, 4.5, 7.5]) : rng.int(2, lv === 4 ? 12 : 9);
    const pc = Math.round(p * 100);
    // the limit divides evenly when strictness matters; at levels 1-2 it often does not (6 per bag, $40)
    const exact = lv >= 3 ? rng.chance(0.7) : rng.chance(0.3);
    const units = rng.int(4, 9);
    const Lc = exact
      ? pc * units
      : pc * units + Math.round(rng.int(1, Math.max(1, Math.floor(p) - 1)) * 100);
    const spec0 = { pc, Lc, dir, strict };
    const top = Math.floor(Lc / pc) + 4;
    const plans = /** @type {Array<{b:number, kind:string}>} */ ([]);
    const goods = [];
    const bads = [];
    for (let b = 1; b <= top; b++) (legal(spec0, b) ? goods : bads).push(b);
    const edge = Lc % pc === 0 ? Lc / pc : null;
    const mid = (/** @type {number[]} */ arr, /** @type {boolean} */ far) =>
      far
        ? arr[Math.max(0, arr.length - 1 - rng.int(0, 1))]
        : arr[rng.int(0, Math.max(0, arr.length - 1))];
    const nearOf = (/** @type {number[]} */ arr) => arr.filter((b) => b !== edge);
    const gPool = nearOf(goods);
    const bPool = nearOf(bads);
    plans.push({ b: mid(gPool.length ? gPool : goods, dir === "min"), kind: "legal" });
    plans.push({
      b: mid(bPool.length ? bPool : bads, dir === "max" ? true : false),
      kind: "illegal",
    });
    if (edge !== null) plans.push({ b: edge, kind: "edge" });
    const L = k.n(Lc / 100);
    const P = k.n(pc / 100);
    const v = item[4];
    const sentenceEn =
      dir === "max"
        ? strict
          ? `You want the ${item[1]} to cost less than $${L} in all. Each ${item[0]} costs $${P}. Let ${v} be the number of ${item[1]}.`
          : `You have $${L} to spend. Each ${item[0]} costs $${P}. Let ${v} be the number of ${item[1]} you buy.`
        : strict
          ? `The club wants to earn more than $${L}. It sells ${item[1]} for $${P} each. Let ${v} be the number of ${item[1]} it sells.`
          : `The club needs to earn at least $${L}. It sells ${item[1]} for $${P} each. Let ${v} be the number of ${item[1]} it sells.`;
    const sentenceEs =
      dir === "max"
        ? strict
          ? `Quieres que las ${item[3]} cuesten menos de $${L} en total. Cada ${item[2]} cuesta $${P}. Sea ${v} el número de ${item[3]}.`
          : `Tienes $${L} para gastar. Cada ${item[2]} cuesta $${P}. Sea ${v} el número de ${item[3]} que compras.`
        : strict
          ? `El club quiere ganar más de $${L}. Vende ${item[3]} a $${P} cada una. Sea ${v} el número de ${item[3]} que vende.`
          : `El club necesita ganar al menos $${L}. Vende ${item[3]} a $${P} cada una. Sea ${v} el número de ${item[3]} que vende.`;
    const sign = dir === "max" ? (strict ? "<" : "<=") : strict ? ">" : ">=";
    const exprText = `${P}${v}`;
    return {
      ...k.pack({
        q: `${sentenceEn} Build a model for the plans the story allows. Pick the left side and the symbol. ¦ ${sentenceEs} Arma un modelo de los planes que permite la historia. Elige el lado izquierdo y el símbolo.`,
        x: `The story gives a ${dir === "max" ? "limit that the cost cannot pass" : "goal the amount must reach"}, so the model compares ${exprText} with ${L} using ${SHOWN[sign]}: ${exprText} ${SHOWN[sign]} ${L}. Every plan the story allows makes it true, and every plan it does not allow makes it false. ¦ La historia da ${dir === "max" ? "un límite que el costo no puede pasar" : "una meta que la cantidad debe alcanzar"}, así que el modelo compara ${exprText} con ${L} usando ${SHOWN[sign]}: ${exprText} ${SHOWN[sign]} ${L}. Todo plan que la historia permite lo hace verdadero, y todo plan que no permite lo hace falso.`,
        h: [
          "Ask: must the answer equal one exact value, or is it a limit? ¦ Pregunta: ¿la respuesta debe ser igual a un valor exacto o es un límite?",
          "Pick a plan you know the story allows. Does your model say yes to it? Pick one the story does not allow. Does your model say no? ¦ Elige un plan que la historia permite. ¿Tu modelo dice que sí? Elige uno que no permite. ¿Tu modelo dice que no?",
          "The left side is the price times the number of items. Choose the symbol that fits the limit. ¦ El lado izquierdo es el precio por la cantidad de artículos. Elige el símbolo que encaja con el límite.",
        ],
      }),
      pc,
      Lc,
      dir,
      strict,
      v,
      item: { one: item[0], many: item[1], oneEs: item[2], manyEs: item[3] },
      plans: plans.map((pl) => ({ ...pl, cost: pl.b * pc, legal: legal(spec0, pl.b) })),
      want: { expr: "px", sign },
      model: { p, L: Lc / 100, dir, strict },
    };
  }

  /** is this model the same yes/no machine as the story, for 0..top items? */
  function equivalent(/** @type {any} */ spec, /** @type {any} */ st) {
    if (st.expr !== "px") return false;
    const top = Math.floor(spec.Lc / spec.pc) + 6;
    for (let b = 0; b <= top; b++) if (modelSays(spec, st, b) !== legal(spec, b)) return false;
    return true;
  }

  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const k = K();
    const s = st || {};
    if (!["px", "p+v", "v/p"].includes(s.expr) || !SIGNS.includes(s.sign))
      return k.miss(
        "incomplete",
        "Choose a left side and a symbol, then check. ¦ Elige un lado izquierdo y un símbolo; luego comprueba.",
      );
    const exprOk = s.expr === "px";
    const signOk = exprOk && equivalent(spec, s);
    const parts = k.parts([exprOk, exprOk ? signOk : false]);
    if (exprOk && signOk) return { ok: true, ...parts };
    const max = spec.dir === "max";
    const nm = (/** @type {number} */ b) =>
      `${b} ${b === 1 ? spec.item.one : spec.item.many} ${max ? (b === 1 ? "costs" : "cost") : b === 1 ? "earns" : "earn"}`;
    const nmEs = (/** @type {number} */ b) =>
      `${b} ${b === 1 ? spec.item.oneEs : spec.item.manyEs} ${max ? (b === 1 ? "cuesta" : "cuestan") : b === 1 ? "gana" : "ganan"}`;
    // the first plan the model gets wrong: a legal plan it rejects, an illegal plan it accepts, or the limit itself
    const order = [...spec.plans].sort((a, b) =>
      a.kind === "legal" ? -1 : b.kind === "legal" ? 1 : 0,
    );
    for (const pl of order) {
      const says = modelSays(spec, s, pl.b);
      if (says === pl.legal) continue;
      const t = plug(spec, s, pl.b);
      const cost = `$${k.n(pl.cost / 100)}`;
      if (pl.legal) {
        const tag =
          s.sign === "="
            ? "equals-for-limit"
            : exprOk
              ? pl.kind === "edge"
                ? "edge-case"
                : "wrong-direction"
              : "wrong-expression";
        const extra = s.sign === "=" && exprOk ? ` ¦ ${""}` : "";
        void extra;
        return k.miss(
          tag,
          `${nm(pl.b)} ${cost}. That is a legal plan, but your model says no: ${t.work}, and ${t.rel} is false. ${s.sign === "=" ? "Does the story ask for one exact amount, or for a limit? " : ""}¦ ${nmEs(pl.b)} ${cost}. Ese es un plan permitido, pero tu modelo dice que no: ${t.work}, y ${t.rel} es falso. ${s.sign === "=" ? "¿La historia pide una cantidad exacta o un límite? " : ""}`,
          parts,
        );
      }
      const tag = exprOk
        ? pl.kind === "edge"
          ? "edge-case"
          : "wrong-direction"
        : "wrong-expression";
      return k.miss(
        tag,
        `${nm(pl.b)} ${cost}. That is not a legal plan, but your model says yes: ${t.work}, and ${t.rel} is true. ¦ ${nmEs(pl.b)} ${cost}. Ese no es un plan permitido, pero tu modelo dice que sí: ${t.work}, y ${t.rel} es verdadero.`,
        parts,
      );
    }
    return k.miss(
      "model",
      "Test your model with a plan the story allows and a plan it does not. ¦ Prueba tu modelo con un plan que la historia permite y uno que no permite.",
      parts,
    );
  }

  function wrong(/** @type {any} */ spec, _rng) {
    const w = spec.want;
    const opposite = { "<": ">", "<=": ">=", ">": "<", ">=": "<=" }[w.sign];
    const flipStrict = w.sign.includes("=") ? w.sign.replace("=", "") : `${w.sign}=`;
    const cands = [
      { expr: "px", sign: "=" },
      { expr: "px", sign: opposite },
      { expr: "p+v", sign: w.sign },
      { expr: "v/p", sign: w.sign },
      { expr: "px", sign: flipStrict },
    ];
    return cands.filter((c) => grade(spec, c).ok === false);
  }

  /* ---- widget ------------------------------------------------------------------------------- */
  const CSS = `
.ak-legal .lg-model{font-weight:800;font-size:1.6rem;text-align:center;color:var(--brand,#2C4A68)}
.ak-legal .lg-sign{font-size:1.6rem;width:64px}
.ak-legal .lg-fix{padding:6px 14px;font-weight:800;font-size:1.3rem;border:2px dashed var(--brand-line,#BBCADA);border-radius:var(--radius-md,14px)}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("legal", CSS);
    const k = K();
    const c = k.start(host, spec, api, "legal");
    const { T } = c;
    const sv = c.saved || (c.solved ? spec.want : {});
    const st = { expr: sv.expr || null, sign: sv.sign || null };
    const P = k.n(spec.pc / 100);
    const v = spec.v;
    const L = k.n(spec.Lc / 100);
    const EXPRS = [
      ["px", `${P}${v}`, "price times the number", "precio por la cantidad"],
      ["p+v", `${P} + ${v}`, "price plus the number", "precio más la cantidad"],
      ["v/p", `${v} ÷ ${P}`, "number divided by the price", "cantidad dividida entre el precio"],
    ];
    const lhsRow = A.el("div", "ak-row", "", { role: "group" });
    c.label(lhsRow, "Left side of the model", "Lado izquierdo del modelo");
    const exprBtns = EXPRS.map(([key, text, en, esT]) => {
      const b = A.el("button", "ak-btn", `<span style="font-size:1.25rem">${text}</span>`, {
        type: "button",
      });
      c.label(b, `${text}, ${en}`, `${text}, ${esT}`);
      b.addEventListener("click", () => {
        if (c.solved) return;
        st.expr = key;
        changed();
      });
      lhsRow.append(b);
      return { key, b };
    });
    const signRow = A.el("div", "ak-row", "", { role: "group" });
    c.label(signRow, "Symbol", "Símbolo");
    const signBtns = SIGNS.map((key) => {
      const b = A.el("button", "ak-btn lg-sign", SHOWN[key], { type: "button" });
      c.label(b, NAME[key][0], NAME[key][1]);
      b.addEventListener("click", () => {
        if (c.solved) return;
        st.sign = key;
        changed();
      });
      signRow.append(b);
      return { key, b };
    });
    const model = A.el("div", "ak-box lg-model", "");
    c.body.append(
      A.el("p", "ak-cap", T("1. Left side", "1. Lado izquierdo")),
      lhsRow,
      A.el("p", "ak-cap", T("2. Symbol", "2. Símbolo")),
      signRow,
      A.el("p", "ak-cap", T("Your model", "Tu modelo")),
      model,
    );
    function changed() {
      c.verdict = null;
      c.note.textContent = "";
      c.emit(st);
      draw();
    }
    function draw() {
      const marks = c.marks();
      for (const { key, b } of exprBtns) {
        b.setAttribute("aria-pressed", String(st.expr === key));
        b.disabled = c.solved;
      }
      for (const { key, b } of signBtns) {
        b.setAttribute("aria-pressed", String(st.sign === key));
        b.disabled = c.solved;
      }
      lhsRow.classList.toggle("ak-mark-bad", !!marks && marks[0] === false);
      signRow.classList.toggle("ak-mark-bad", !!marks && marks[1] === false);
      const left = st.expr ? EXPRS.find((e) => e[0] === st.expr)?.[1] : "?";
      model.textContent = `${left} ${st.sign ? SHOWN[st.sign] : "?"} ${L}`;
      c.checkBtn.disabled = !st.expr || !st.sign;
      c.clearBtn.disabled = !st.expr && !st.sign;
    }
    c.redraws.push(draw);
    c.wire(
      () => st,
      () => {
        st.expr = st.sign = null;
        c.emit(st);
      },
    );
    draw();
  }

  A.register("legal", {
    title: "Legal-plan test",
    titleEs: "Prueba de planes permitidos",
    levels: 4,
    make,
    solution: (/** @type {any} */ spec) => ({ expr: spec.want.expr, sign: spec.want.sign }),
    wrong,
    grade,
    mount,
  });
})();
