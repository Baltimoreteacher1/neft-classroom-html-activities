/* EWL.Canvas kinds and tasks — the pure logic behind every Living Math Canvas scene (no DOM).
 *
 *   EWL.Canvas.kinds[id]   how a scene's parameters become a Lens spec, what the live readout says,
 *                          and which settings count as "different" (id: names, percent-of, find-whole, successive,
 *                          ratio, unit-rate, kx, equation, scale, divide)
 *   EWL.Canvas.task(kind, args)    a Reason task (core kinds from EWL.Reason.Task, plus the canvas-* kinds below)
 *   EWL.Canvas.makeTransfer(scene, n)   a fresh, seeded transfer problem (same seed -> same problem)
 *   EWL.Canvas.check(task, raw)    {state: "ok"|"wrong"|"unreadable", rule}
 *   EWL.Canvas.revealText(scene.answer, task, lang)   the checked result, only ever shown on request
 *
 * Misconception rules for the canvas-* task kinds are registered with EWL.Reason.registerRule on first use.
 */
(function (root) {
  "use strict";
  const EWL = (root.EWL = root.EWL || {});
  const C = (EWL.Canvas = EWL.Canvas || {});
  const R = () => EWL.Rat;
  const t = (lang, en, es) => (lang === "es" && es ? es : en);
  const num = (x) => R().parse(x);
  const pct = (n) => `${n}%`;

  /* ---------- tasks ---------- */
  let rulesReady = false;
  function ensureRules() {
    if (rulesReady || !EWL.Reason) return;
    rulesReady = true;
    const rule = (r) => {
      if (!EWL.Reason.ruleFor(r.id)) EWL.Reason.registerRule(r);
    };
    rule({
      id: "canvas-names-side-by-side",
      kinds: ["canvas-names"],
      wrong: (k) => num(`0.${k.facts.v.n}${k.facts.v.d}`),
      name: "Wrote the top and bottom numbers side by side",
      nameEs: "Escribió el numerador y el denominador uno al lado del otro",
      nudge: "Look at the tenths and hundredths. How many hundredths is one fifth, or one tenth?",
      nudgeEs: "Mira los décimos y centésimos. ¿Cuántos centésimos es un quinto, o un décimo?",
      counter: () => "Is 1/2 the same as 0.12? Cut a strip in half and compare.",
    });
    rule({
      id: "canvas-ratio-additive",
      kinds: ["canvas-ratio-scale"],
      wrong: (k) => k.facts.b.add(k.facts.c).sub(k.facts.a),
      name: "Added the same amount instead of multiplying",
      nameEs: "Sumó la misma cantidad en lugar de multiplicar",
      nudge:
        "Each copy of the ratio adds a whole group to both amounts. Is adding the same number to both the same as making copies?",
      nudgeEs:
        "Cada copia de la razón agrega un grupo completo a las dos cantidades. ¿Sumar el mismo número a las dos es lo mismo que hacer copias?",
      counter: (k) =>
        `Start with ${k.facts.a.frac()}:${k.facts.b.frac()}. Two copies give ${k.facts.a.mul(2).frac()}:${k.facts.b.mul(2).frac()}. Adding ${k.facts.a.frac()} to both would not.`,
    });
    rule({
      id: "canvas-k-flipped",
      kinds: ["canvas-ratio-k"],
      wrong: (k) => k.facts.x.div(k.facts.y),
      name: "Turned the rate upside down",
      nameEs: "Dio vuelta la tasa",
      nudge: "In y = kx, k tells how much y you get for 1 of x. Which number is y?",
      nudgeEs: "En y = kx, k dice cuánto y obtienes por 1 de x. ¿Cuál número es y?",
      counter: (k) =>
        `If k were ${k.facts.x.div(k.facts.y).frac()}, then x = ${k.facts.x.frac()} would give y = ${k.facts.x.mul(k.facts.x.div(k.facts.y)).frac()}, not ${k.facts.y.frac()}.`,
    });
    rule({
      id: "canvas-k-subtract",
      kinds: ["canvas-ratio-k"],
      wrong: (k) => k.facts.y.sub(k.facts.x),
      name: "Subtracted instead of dividing",
      nameEs: "Restó en lugar de dividir",
      nudge: "k multiplies x to make y. What do you do to x to get y?",
      nudgeEs: "k multiplica x para hacer y. ¿Qué haces con x para obtener y?",
      counter: (k) =>
        `Try k = ${k.facts.y.sub(k.facts.x).frac()} with x = ${k.facts.x.mul(2).frac()}. Do the table rows still match?`,
    });
    rule({
      id: "canvas-whole-multiplied",
      kinds: ["canvas-find-whole"],
      wrong: (k) => k.facts.part.mul(k.facts.pct),
      name: "Multiplied the part by the percent",
      nameEs: "Multiplicó la parte por el porcentaje",
      nudge:
        "The part is only some of the whole. Should the whole be bigger or smaller than the part?",
      nudgeEs:
        "La parte es solo una porción del entero. ¿El entero debe ser mayor o menor que la parte?",
      counter: (k) =>
        `If the whole were ${k.facts.part.mul(k.facts.pct).decimal(2).text}, would ${k.facts.pct.percent()} of it be ${k.facts.part.frac()}?`,
    });
    rule({
      id: "canvas-eq-wrong-inverse",
      kinds: ["canvas-eq-solve"],
      wrong: (k) =>
        k.facts.q.isZero() ? k.facts.r.mul(k.facts.p) : k.facts.r.add(k.facts.q).div(k.facts.p),
      name: "Used the wrong operation to undo",
      nameEs: "Usó la operación equivocada para deshacer",
      nudge: "To keep the balance, undo what was done to x. What was done to x first?",
      nudgeEs:
        "Para mantener el equilibrio, deshaz lo que se le hizo a x. ¿Qué se le hizo a x primero?",
      counter: () =>
        "Put your answer back into the equation. Do both sides of the balance weigh the same?",
    });
    rule({
      id: "canvas-eq-skip-divide",
      kinds: ["canvas-eq-solve"],
      wrong: (k) => (k.facts.p.eq(1) ? null : k.facts.r.sub(k.facts.q)),
      name: "Stopped before dividing",
      nameEs: "Se detuvo antes de dividir",
      nudge: "After you take the same amount off both sides, how many bags of x are left?",
      nudgeEs: "Después de quitar lo mismo de los dos lados, ¿cuántas bolsas de x quedan?",
      counter: () =>
        "If one bag weighs that much, would all the bags together equal the right side?",
    });
  }

  const TASKS = {
    percentOf: (a) => EWL.Reason.Task.percentOf(a[0], a[1]),
    percentStack: (a) => EWL.Reason.Task.percentStack(a[0], a[1]),
    unitPrice: (a) => EWL.Reason.Task.unitPrice(a[0], a[1], a[2], a[3]),
    scaleVolume: (a) => EWL.Reason.Task.scaleVolume(a[0], a[1], a[2], a[3]),
    divideFractions: (a) => EWL.Reason.Task.divideFractions(a[0], a[1]),
    names: (a) => {
      const v = num(a[0]);
      return { kind: "canvas-names", facts: { v }, answer: v };
    },
    ratioScale: (a) => {
      const [x, y, z] = a.map(num);
      return { kind: "canvas-ratio-scale", facts: { a: x, b: y, c: z }, answer: y.mul(z).div(x) };
    },
    ratioK: (a) => {
      const [x, y] = a.map(num);
      return { kind: "canvas-ratio-k", facts: { x, y }, answer: y.div(x) };
    },
    findWhole: (a) => {
      const part = num(a[0]);
      const p = num(a[1]);
      return { kind: "canvas-find-whole", facts: { part, pct: p }, answer: part.div(p) };
    },
    eqSolve: (a) => {
      const [p, q, r] = a.map(num);
      return { kind: "canvas-eq-solve", facts: { p, q, r }, answer: r.sub(q).div(p) };
    },
  };
  C.taskNames = Object.keys(TASKS);

  /** Build a Reason task from {kind, args}. Throws on an unknown kind. */
  C.task = (kind, args) => {
    ensureRules();
    if (!TASKS[kind]) throw new RangeError(`Canvas: unknown task kind ${kind}`);
    return TASKS[kind](args);
  };
  /** Every rule for this task must disagree with the true answer, or a student could be "diagnosed" while right. */
  C.distinct = (task) =>
    EWL.Reason.rules()
      .filter((r) => r.kinds.indexOf(task.kind) >= 0)
      .every((r) => {
        const w = r.wrong(task);
        return !w || !w.eq(task.answer);
      });
  C.check = (task, raw) => {
    const d = EWL.Reason.diagnose(task, { value: raw });
    if (d.reason === "unreadable") return { state: "unreadable", rule: null };
    return { state: d.correct ? "ok" : "wrong", rule: d.rule || null };
  };

  const sub = (s, set) => String(s).replace(/\{(\w+)\}/g, (m, k) => (set[k] == null ? m : set[k]));
  /** The n-th transfer problem for a scene: seeded, from the scene's own list of number sets. */
  C.makeTransfer = (scene, n) => {
    const tr = scene.transfer;
    const rng = EWL.rng(EWL.hash(scene.id) + (tr.seed | 0) + (n | 0) * 7919);
    let set = tr.sets[0];
    let task = null;
    for (let i = 0; i < 24; i++) {
      set = rng.pick(tr.sets);
      task = C.task(
        tr.task.kind,
        tr.task.args.map((a) => sub(a, set)),
      );
      if (C.distinct(task)) break;
    }
    return {
      set,
      task,
      prompt: sub(tr.prompt, set),
      promptEs: sub(tr.promptEs, set),
      answer: tr.answer,
    };
  };

  /** The checked result as words, shown only after the student presses "Show checked result". */
  C.revealText = (answer, task, lang) => {
    const a = task.answer;
    const n = R().names(a);
    const kind = (answer && answer.format) || "number";
    if (kind === "choice") {
      const c = (answer.choices || []).filter((x) => a.eq(num(x.value)))[0];
      return c ? t(lang, c.label, c.labelEs) : a.frac();
    }
    if (kind === "percent") return `${n.percent} (${n.simplest} = ${n.decimal})`;
    if (kind === "money") return fmt(a, true);
    return a.isInt() ? String(a.n) : `${a.isTerminating() ? n.decimal : n.mixed}`;
  };
  const fmt = (r, money) => (EWL.Lens ? EWL.Lens.fmt(r, money) : r.frac());

  /* ---------- kinds ---------- */
  const eqs = (v) => {
    const d = Number(v.d);
    const dens = [d, 2 * d, 10, 100].filter(
      (D, i, a) => D <= 100 && a.indexOf(D) === i && (v.n * BigInt(D)) % v.d === 0n,
    );
    const fr = R()
      .equivalents(v, dens)
      .map((e) => `${e.n}/${e.d}`);
    const n = R().names(v);
    return `${fr.join(" = ")}${fr.length ? " = " : ""}${n.decimal} = ${n.percent}`;
  };
  const wrap = (reps, extra) => Object.assign({ reps }, extra);
  const cur = (labels, lang) => ({
    xLabel: labels && labels.x,
    xLabelEs: labels && labels.xEs,
    yLabel: labels && labels.y,
    yLabelEs: labels && labels.yEs,
    yMoney: !!(labels && labels.money),
  });
  C.kinds = {
    names: {
      family: "rational",
      init: (p) => ({ value: p.value }),
      spec: (p, s) => wrap(s.reps, { family: "rational", value: p.value }),
      facts: (p, s, lang) => [eqs(num(p.value))],
      key: (p) => num(p.value).frac(),
    },
    "percent-of": {
      family: "rational",
      init: (p) => ({ pct: String(p.pct), whole: String(p.whole) }),
      spec: (p, s) => wrap(s.reps, { family: "rational", value: pct(p.pct), whole: p.whole }),
      facts(p, s, lang) {
        const part = num(pct(p.pct)).mul(num(p.whole));
        const f = num(pct(p.pct));
        return [
          t(
            lang,
            `${pct(p.pct)} of ${p.whole} = ${f.frac()} × ${p.whole} = ${part.frac()}`,
            `${pct(p.pct)} de ${p.whole} = ${f.frac()} × ${p.whole} = ${part.frac()}`,
          ),
        ];
      },
      key: (p) => `${p.pct}|${p.whole}`,
    },
    "find-whole": {
      family: "rational",
      init: (p) => ({ pct: String(p.pct), part: String(p.part) }),
      spec: (p, s) =>
        wrap(s.reps, {
          family: "rational",
          value: pct(p.pct),
          whole: num(p.part)
            .div(num(pct(p.pct)))
            .frac(),
        }),
      facts(p, s, lang) {
        const f = num(pct(p.pct));
        const whole = num(p.part).div(f);
        const ten = num(p.part).div(num(p.pct).div(10));
        return [
          t(
            lang,
            `${p.part} is ${pct(p.pct)} of the whole. So 10% is ${ten.frac()} and 100% is ${whole.frac()}.`,
            `${p.part} es el ${pct(p.pct)} del entero. Entonces el 10 % es ${ten.frac()} y el 100 % es ${whole.frac()}.`,
          ),
        ];
      },
      key: (p) => `${p.pct}|${p.part}`,
    },
    successive: {
      family: "rational",
      init: (p) => ({ p1: String(p.p1), p2: String(p.p2) }),
      spec(p, s) {
        const left = R()
          .ONE.sub(num(pct(p.p1)))
          .mul(R().ONE.sub(num(pct(p.p2))));
        const sum = num(pct(Number(p.p1) + Number(p.p2)));
        return wrap(s.reps, {
          family: "rational",
          value: R().ONE.sub(left).frac(),
          ghost: sum.frac(),
          ghostLabel: `${sum.percent()} ✗`,
          den: 100,
        });
      },
      facts(p, s, lang) {
        const a = R()
          .of(100)
          .mul(R().ONE.sub(num(pct(p.p1))));
        const b = a.mul(R().ONE.sub(num(pct(p.p2))));
        const off = R().of(100).sub(b);
        return [
          t(
            lang,
            `$100 → $${a.decimal(2).text} → $${b.decimal(2).text}. Together that is ${off.frac()}% off, not ${Number(p.p1) + Number(p.p2)}%.`,
            `$100 → $${a.decimal(2).text} → $${b.decimal(2).text}. En total es ${off.frac()} % de descuento, no ${Number(p.p1) + Number(p.p2)} %.`,
          ),
        ];
      },
      key: (p) => `${p.p1}|${p.p2}`,
    },
    ratio: {
      family: "ratio",
      init: (p) => ({ a: String(p.a), b: String(p.b), n: String(p.n || 4) }),
      spec(p, s) {
        const steps = Array.from({ length: Number(p.n) }, (x, i) => i + 1);
        return wrap(
          s.reps,
          Object.assign({ family: "ratio", a: p.a, b: p.b, steps }, cur(s.labels)),
        );
      },
      set(p, ctl, raw) {
        if (ctl.param !== "ratio") return Object.assign({}, p, { [ctl.param]: String(raw).trim() });
        const m = /^\s*(\d+)\s*(?::|to)\s*(\d+)\s*$/i.exec(String(raw));
        return m ? Object.assign({}, p, { a: m[1], b: m[2] }) : null;
      },
      facts(p, s, lang) {
        const rows = Array.from(
          { length: Number(p.n) },
          (x, i) => `${Number(p.a) * (i + 1)}:${Number(p.b) * (i + 1)}`,
        );
        return [rows.join(" = ")];
      },
      key: (p) => `${p.a}:${p.b}|${p.n}`,
    },
    "unit-rate": {
      family: "ratio",
      init: (p) => ({
        pkg: "1",
        qa: String(p.qa),
        pa: String(p.pa),
        qb: String(p.qb || ""),
        pb: String(p.pb || ""),
      }),
      spec(p, s) {
        const second = p.pkg === "2" && p.qb;
        const q = second ? p.qb : p.qa;
        const price = second ? p.pb : p.pa;
        return wrap(
          s.reps,
          Object.assign(
            { family: "ratio", a: q, b: price, steps: [num(q).inv().frac(), 1, 2, 3] },
            cur(s.labels),
          ),
        );
      },
      facts(p, s, lang) {
        const f = (q, pr) => num(pr).div(num(q));
        const one = f(p.qa, p.pa);
        const lines = [
          t(
            lang,
            `Package 1: ${p.pa} for ${p.qa} → ${fmt(one, s.labels && s.labels.money)} for 1`,
            `Paquete 1: ${p.pa} por ${p.qa} → ${fmt(one, s.labels && s.labels.money)} por 1`,
          ),
        ];
        if (p.qb) {
          const two = f(p.qb, p.pb);
          lines.push(
            t(
              lang,
              `Package 2: ${p.pb} for ${p.qb} → ${fmt(two, s.labels && s.labels.money)} for 1`,
              `Paquete 2: ${p.pb} por ${p.qb} → ${fmt(two, s.labels && s.labels.money)} por 1`,
            ),
          );
        }
        return lines;
      },
      key: (p) => `${p.pkg}|${p.qa}|${p.pa}|${p.qb}|${p.pb}`,
    },
    kx: {
      family: "ratio",
      init: (p) => ({ k: String(p.k) }),
      spec: (p, s) =>
        wrap(
          s.reps,
          Object.assign({ family: "ratio", a: "1", b: p.k, steps: [1, 2, 3, 4, 5] }, cur(s.labels)),
        ),
      facts(p, s, lang) {
        const k = num(p.k);
        return [
          t(
            lang,
            `y = ${p.k}x. When x = 3, y = ${k.mul(3).frac()}.`,
            `y = ${p.k}x. Cuando x = 3, y = ${k.mul(3).frac()}.`,
          ),
        ];
      },
      key: (p) => String(num(p.k).frac()),
    },
    equation: {
      family: "equation",
      init: (p) => ({ p: String(p.p), q: String(p.q), r: String(p.r), test: "" }),
      spec: (p, s) =>
        wrap(s.reps, { family: "equation", p: p.p, q: p.q, r: p.r, test: p.test || undefined }),
      actions(p, lang) {
        const out = [];
        if (num(p.q).sign() > 0) {
          const next = Object.assign({}, p, { q: "0", r: num(p.r).sub(num(p.q)).frac(), test: "" });
          out.push({
            id: "sub",
            label: t(lang, `Take ${p.q} off both sides`, `Quita ${p.q} de los dos lados`),
            params: next,
          });
        }
        if (num(p.p).cmp(1) > 0 && num(p.q).isZero()) {
          const next = Object.assign({}, p, { p: "1", r: num(p.r).div(num(p.p)).frac(), test: "" });
          out.push({
            id: "div",
            label: t(
              lang,
              `Share both sides into ${p.p} equal groups`,
              `Reparte los dos lados en ${p.p} grupos iguales`,
            ),
            params: next,
          });
        }
        return out;
      },
      facts(p, s, lang) {
        const x = num(p.r).sub(num(p.q)).div(num(p.p));
        return [
          t(
            lang,
            `Now the balance says ${EWL.Lens.reg.equation.sentence({ p: num(p.p), q: num(p.q), r: num(p.r) })}. The unknown is still x = ${x.frac()}.`,
            `Ahora la balanza dice ${EWL.Lens.reg.equation.sentence({ p: num(p.p), q: num(p.q), r: num(p.r) })}. La incógnita sigue siendo x = ${x.frac()}.`,
          ),
        ];
      },
      key: (p) => `${p.p}|${p.q}|${p.r}|${p.test}`,
    },
    scale: {
      family: "scale",
      init: (p) => ({ k: String(p.k) }),
      spec: (p, s) => wrap(s.reps, { family: "scale", k: p.k }),
      facts(p, s, lang) {
        const k = Number(p.k);
        return [
          t(
            lang,
            `Scale factor ${k}: length × ${k}, area × ${k * k}, volume × ${k ** 3}.`,
            `Factor de escala ${k}: longitud × ${k}, área × ${k * k}, volumen × ${k ** 3}.`,
          ),
        ];
      },
      key: (p) => String(p.k),
    },
    divide: {
      family: "rational",
      init: (p) => ({ a: String(p.a), b: String(p.b) }),
      spec: (p, s) => wrap(s.reps, { family: "rational", value: p.a, per: p.b }),
      facts(p, s, lang) {
        const q = num(p.a).div(num(p.b));
        return [
          t(
            lang,
            `${p.a} ÷ ${p.b} = ${q.mixed()}: ${q.mixed()} groups of ${p.b} fit in ${p.a}.`,
            `${p.a} ÷ ${p.b} = ${q.mixed()}: caben ${q.mixed()} grupos de ${p.b} en ${p.a}.`,
          ),
        ];
      },
      key: (p) => `${p.a}|${p.b}`,
    },
  };

  /** Apply one control change to a scene's params; null when the result cannot be drawn. */
  C.applyControl = (scene, params, ctl, raw) => {
    const kind = C.kinds[scene.kind];
    const next = kind.set
      ? kind.set(params, ctl, raw)
      : Object.assign({}, params, { [ctl.param]: String(raw).trim() });
    if (!next) return null;
    try {
      EWL.Lens.model(kind.spec(next, scene), "en");
    } catch (e) {
      return null;
    }
    return next;
  };
  C.specOf = (scene, params) => C.kinds[scene.kind].spec(params, scene);
})(typeof window !== "undefined" ? window : globalThis);
