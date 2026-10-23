/**
 * Practice Studio activity: headlinecourt, "Headline Court" (lesson 2-10).
 *
 * One data set, two or three headlines ("the typical price is ..."), two readers with different purposes. A shopper wants
 * a price that is typical of what most people pay, and an accountant needs the total of all the prices. The right
 * headline depends on the purpose: the median for the shopper, the mean for the total (mean × count = total). The data is
 * skewed to the right, so the two numbers differ. Every value is computed; the mean is always a whole number so that
 * "headline × count" matches the total exactly. Needs assets/studio-act/u2kit.js (read lazily).
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const kit = () => A.kit;
  /** [item, itemEs, singular, singularEs, prefix, mult, lo, unit, shopper, shopperEs, accountant, accountantEs] */
  const CTX = [
    "homes on one street|casas de una calle|home|casa|$|1000|100|8|A family is shopping for a home on this street. They want to know what a typical home costs.|Una familia busca una casa en esta calle. Quiere saber cuánto cuesta una casa típica.|The county tax assessor needs the total value of all the homes on the street.|El asesor de impuestos del condado necesita el valor total de todas las casas de la calle.",
    "used bikes at a shop|bicicletas usadas de una tienda|bike|bicicleta|$|1|60|7|A shopper wants to know what a typical bike at the shop costs.|Un comprador quiere saber cuánto cuesta una bicicleta típica de la tienda.|The shop owner needs the total value of all the bikes to buy insurance.|El dueño de la tienda necesita el valor total de todas las bicicletas para comprar un seguro.",
    "tickets sold for a concert|boletos vendidos para un concierto|ticket|boleto|$|1|30|6|A fan wants to know what a typical ticket price was.|Un aficionado quiere saber cuál fue un precio típico de boleto.|The concert accountant needs the total money collected from all the tickets.|El contador del concierto necesita el dinero total que se cobró por todos los boletos.",
  ];
  const ROLE = /** @type {any} */ ({
    mean: ["the mean", "la media"],
    median: ["the median", "la mediana"],
    max: ["the highest price", "el precio más alto"],
  });

  const fiveOf = (/** @type {number[]} */ d) => kit().five(d);
  const isOutlier = (/** @type {number[]} */ d) => {
    const f = fiveOf(d);
    const iqr = f.q3 - f.q1;
    return f.max > f.q3 + 1.5 * iqr || f.min < f.q1 - 1.5 * iqr;
  };

  const grade = (/** @type {any} */ spec, /** @type {any} */ state) => {
    const K = kit();
    const M = spec.model;
    const s = state || {};
    const head = (/** @type {any} */ i) => (Number.isInteger(i) ? M.heads[i] : null);
    const b = head(s.buyer);
    const a = head(s.assessor);
    const marks = [b?.kind === "median", a?.kind === "mean"];
    const score = K.score(marks);
    const money = (/** @type {number} */ v) => `${M.prefix}${W.StudioGen.commas(v * M.mult)}`;
    if (!b || !a)
      return K.no(
        "headline-open",
        "Choose a headline for each reader before you check.|Elige un titular para cada lector antes de revisar.",
        score,
      );
    if (!marks[0]) {
      const below = M.data.filter((/** @type {number} */ v) => v < b.value).length;
      return b.kind === "mean"
        ? K.no(
            M.outlier ? "stat-mean-skewed-by-outlier" : "stat-mean-vs-median",
            `${below} of the ${M.data.length} prices are below this headline. A few high prices pull the mean up, so most of what people pay is less than it. The shopper wants a price that is typical of what most people pay.|${below} de los ${M.data.length} precios están por debajo de este titular. Unos pocos precios altos suben la media, así que lo que paga la mayoría es menos que eso. El comprador quiere un precio típico de lo que paga la mayoría.`,
            score,
          )
        : K.no(
            "stat-one-value-for-many",
            `Only one price is this high, and most of the ${M.data.length} prices are below it. The shopper wants a price that is typical of what most people pay.|Solo un precio es tan alto, y la mayoría de los ${M.data.length} precios está por debajo. El comprador quiere un precio típico de lo que paga la mayoría.`,
            score,
          );
    }
    if (!marks[1]) {
      const prod = money(a.value * M.data.length);
      return K.no(
        a.kind === "max" ? "stat-one-value-for-many" : "stat-mean-total-confused",
        `This headline times ${M.data.length} is ${prod}. The reader who needs the total adds up all the real prices, and a headline times ${M.data.length} should give that same total. Try the Test my pick button.|Este titular por ${M.data.length} es ${prod}. Quien necesita el total suma todos los precios reales, y un titular por ${M.data.length} debería dar ese mismo total. Prueba el botón Probar mi elección.`,
        score,
      );
    }
    return { ok: true, ...score };
  };

  A.register("headlinecourt", {
    title: "Headline court",
    titleEs: "Tribunal de titulares",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level) {
      const K = kit();
      const [item, itemEs, one, oneEs, prefix, mult, lo0, unit0, shop, shopEs, acct, acctEs] = rng
        .pick(CTX)
        .split("|");
      const n = rng.pick([9, 11]);
      const lo = Number(lo0) + rng.int(0, 4) * 5;
      const unit = Number(unit0);
      const wantOutlier = level >= 3;
      let data = /** @type {number[]} */ ([]);
      for (let t = 0; t < 2000 && !data.length; t++) {
        const d = [lo];
        for (let i = 1; i < n; i++) d.push(d[i - 1] + unit * rng.int(1, 1 + i));
        if (wantOutlier) d[n - 1] = d[n - 2] + unit * rng.int(12, 20);
        const rem = (n - (K.sum(d) % n)) % n;
        d[n - 1] += rem;
        const mean = K.sum(d) / n;
        const med = K.medianOf(d);
        if (
          mean >= med * 1.06 &&
          isOutlier(d) === wantOutlier &&
          d.filter((v) => v < mean).length >= n / 2 + 1
        )
          data = d;
      }
      if (!data.length) data = [100, 104, 108, 114, 122, 134, 152, 180, 230];
      const mean = K.sum(data) / data.length;
      const med = K.medianOf(data);
      const kinds = level === 4 ? ["mean", "median", "max"] : ["mean", "median"];
      const val = /** @type {any} */ ({ mean, median: med, max: Math.max(...data) });
      const heads = rng.shuffle(kinds).map((kind) => ({ kind, value: val[kind] }));
      const m = Number(mult);
      const money = (/** @type {number} */ v) => `${prefix}${W.StudioGen.commas(v * m)}`;
      return {
        q: `Here are the prices of ${n} ${item}. Each headline claims a typical price. ${shop} ${acct} Choose the headline that fits each reader's purpose. Use Test my pick to check a headline against the total.`,
        qEs: `Aquí están los precios de ${n} ${itemEs}. Cada titular afirma un precio típico. ${shopEs} ${acctEs} Elige el titular que sirve para el propósito de cada lector. Usa Probar mi elección para comparar un titular con el total.`,
        x: `The data is skewed to the right: a few high prices pull the mean (${money(mean)}) above the median (${money(med)}). The shopper wants a price that is typical of what most people pay, so the median fits. The accountant needs the total, and the mean times the number of prices equals the total (${money(mean)} × ${n} = ${money(mean * n)}), so the mean fits. The best measure depends on the purpose.`,
        xEs: `Los datos están sesgados a la derecha: unos pocos precios altos suben la media (${money(mean)}) por encima de la mediana (${money(med)}). El comprador quiere un precio típico de lo que paga la mayoría, así que sirve la mediana. Quien necesita el total necesita la media, porque la media por la cantidad de precios es igual al total (${money(mean)} × ${n} = ${money(mean * n)}). La mejor medida depende del propósito.`,
        h: [
          "Ask what each reader will do with the number. One wants what most people pay. The other wants a total.",
          "A total of n prices equals the average price times n. Which measure works that way?",
          "A few high prices pull one measure up but barely move the other. Compare each headline with the list.",
        ],
        hEs: [
          "Pregunta qué hará cada lector con el número. Uno quiere lo que paga la mayoría. El otro quiere un total.",
          "El total de n precios es igual al precio promedio por n. ¿Qué medida funciona así?",
          "Unos pocos precios altos suben una medida pero casi no mueven la otra. Compara cada titular con la lista.",
        ],
        model: {
          data,
          prefix,
          mult: m,
          item,
          itemEs,
          one,
          oneEs,
          outlier: wantOutlier,
          heads,
        },
      };
    },
    solution(/** @type {any} */ spec) {
      const M = spec.model;
      return {
        buyer: M.heads.findIndex((/** @type {any} */ h) => h.kind === "median"),
        assessor: M.heads.findIndex((/** @type {any} */ h) => h.kind === "mean"),
      };
    },
    wrong(/** @type {any} */ spec) {
      const M = spec.model;
      const sol = A.registry.headlinecourt.solution(spec);
      const out = [
        { buyer: sol.assessor, assessor: sol.buyer },
        { buyer: sol.buyer, assessor: sol.buyer },
        { buyer: sol.assessor, assessor: sol.assessor },
        { buyer: null, assessor: sol.assessor },
      ];
      const mx = M.heads.findIndex((/** @type {any} */ h) => h.kind === "max");
      if (mx >= 0)
        out.push({ buyer: sol.buyer, assessor: mx }, { buyer: mx, assessor: sol.assessor });
      return out.filter((s) => !grade(spec, s).ok);
    },
    grade,
    mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
      const K = kit();
      const M = spec.model;
      const { root, L, B, live, ro } = K.shell(host, api);
      const saved = api.restore && "buyer" in api.restore ? api.restore : null;
      const st = {
        buyer: saved && Number.isInteger(saved.buyer) ? saved.buyer : null,
        assessor: saved && Number.isInteger(saved.assessor) ? saved.assessor : null,
      };
      const emit = () => api.change?.({ buyer: st.buyer, assessor: st.assessor });
      const money = (/** @type {number} */ v) => `${M.prefix}${W.StudioGen.commas(v * M.mult)}`;
      const sorted = K.sorted(M.data);
      root.append(
        A.el(
          "p",
          "u2-note",
          B(
            `<b>The ${M.data.length} prices:</b> ${sorted.map(money).join(", ")}`,
            `<b>Los ${M.data.length} precios:</b> ${sorted.map(money).join(", ")}`,
          ),
        ),
      );
      const labelOf = (/** @type {any} */ h, /** @type {number} */ i) => {
        const letter = "ABC"[i];
        return {
          en: `Headline ${letter}: "The typical ${M.one} price is ${money(h.value)}." (${ROLE[h.kind][0]})`,
          es: `Titular ${letter}: "El precio típico de ${M.oneEs === "casa" ? "una casa" : `un${M.oneEs.endsWith("a") ? "a" : ""} ${M.oneEs}`} es ${money(h.value)}". (${ROLE[h.kind][1]})`,
        };
      };
      const opts = M.heads.map(labelOf);
      const reader = (
        /** @type {string} */ en,
        /** @type {string} */ es,
        /** @type {"buyer"|"assessor"} */ key,
      ) => {
        const box = A.el("div", "u2-box");
        box.append(A.el("p", "u2-note", `<b>${B(en, es)}</b>`));
        K.choices(
          box,
          opts,
          st[key],
          ro,
          (i) => {
            st[key] = i;
            emit();
            if (key === "assessor") test.textContent = "";
          },
          L(en, es),
          B,
        );
        root.append(box);
        return box;
      };
      reader(
        "Reader 1: the shopper wants a typical price",
        "Lector 1: el comprador quiere un precio típico",
        "buyer",
      );
      const box2 = reader(
        "Reader 2: the one who needs the total",
        "Lector 2: quien necesita el total",
        "assessor",
      );
      const test = A.el("p", "u2-note", "", { role: "status" });
      const tryBtn = A.el("button", "u2-btn", B("Test my pick", "Probar mi elección"), {
        type: "button",
      });
      tryBtn.disabled = ro;
      tryBtn.addEventListener("click", () => {
        const h = Number.isInteger(st.assessor) ? M.heads[st.assessor] : null;
        if (!h) {
          test.textContent = L(
            "Choose a headline for Reader 2 first.",
            "Elige primero un titular para el lector 2.",
          );
          return;
        }
        const total = K.sum(M.data);
        const prod = h.value * M.data.length;
        const same = prod === total;
        test.textContent = L(
          `Headline × ${M.data.length} = ${money(prod)}. The ${M.data.length} real prices add up to ${money(total)}. ${same ? "They match." : "They do not match."}`,
          `Titular × ${M.data.length} = ${money(prod)}. Los ${M.data.length} precios reales suman ${money(total)}. ${same ? "Coinciden." : "No coinciden."}`,
        );
        api.say?.(test.textContent);
      });
      box2.append(tryBtn, test);
      root.append(live);
      if (!ro)
        K.actions(
          root,
          api,
          B,
          () => ({ buyer: st.buyer, assessor: st.assessor }),
          () => {
            st.buyer = null;
            st.assessor = null;
            for (const b of root.querySelectorAll('[role="radio"]'))
              b.setAttribute("aria-checked", "false");
            test.textContent = "";
            emit();
          },
        );
    },
  });
})();
