/**
 * Practice Studio activity: askdots, "Ask It Six Times" (lesson 2-1).
 *
 * The student builds a question from two menus (who is asked, when it is asked), predicts whether six answers will stack
 * on one value or spread out, then asks six times and sees six simulated respondents as dots. A question about one person
 * at one moment has a single answer, so all six dots stack: visibly not statistical. The six answers are fixed by the
 * seed in make(), never drawn at grade time. Targets stat-question-no-variability and stat-question-judged-by-surface.
 * Needs assets/studio-act/u2kit.js (read lazily). Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const kit = () => A.kit;

  /** Each scenario: question templates with {who} and {when}, the menus, and the size of the numbers. */
  const SCEN = [
    {
      q: "How many minutes did {who} spend on homework {when}?|¿Cuántos minutos dedicó {who} a la tarea {when}?",
      who: [
        "Maya|Maya|one",
        "each student in our class|cada estudiante de nuestra clase|many",
        "our whole class, all together|toda nuestra clase junta|together",
      ],
      when: ["last night|anoche|one", "each night this week|cada noche de esta semana|many"],
      unit: "minutes|minutos",
      step: 5,
      base: [20, 40],
      r: 4,
    },
    {
      q: "How many points did {who} score {when}?|¿Cuántos puntos anotó {who} {when}?",
      who: [
        "Dev|Dev|one",
        "each player on our team|cada jugador de nuestro equipo|many",
        "our whole team, all together|todo nuestro equipo junto|together",
      ],
      when: [
        "in Friday's game|en el juego del viernes|one",
        "in each game this season|en cada juego de esta temporada|many",
      ],
      unit: "points|puntos",
      step: 1,
      base: [8, 16],
      r: 6,
    },
    {
      q: "How many books did {who} read {when}?|¿Cuántos libros leyó {who} {when}?",
      who: [
        "Lena|Lena|one",
        "each student in our grade|cada estudiante de nuestro grado|many",
        "all the students in our grade together|todos los estudiantes de nuestro grado juntos|together",
      ],
      when: ["in October|en octubre|one", "in each month this year|en cada mes de este año|many"],
      unit: "books|libros",
      step: 1,
      base: [3, 6],
      r: 3,
    },
    {
      q: "How many glasses of water did {who} drink {when}?|¿Cuántos vasos de agua tomó {who} {when}?",
      who: [
        "Sam|Sam|one",
        "each person in our family|cada persona de nuestra familia|many",
        "our whole family, all together|toda nuestra familia junta|together",
      ],
      when: ["yesterday|ayer|one", "each day last week|cada día de la semana pasada|many"],
      unit: "glasses|vasos",
      step: 1,
      base: [4, 8],
      r: 3,
    },
    {
      q: "How many goals did {who} score {when}?|¿Cuántos goles anotó {who} {when}?",
      who: [
        "Kai|Kai|one",
        "each player in our league|cada jugador de nuestra liga|many",
        "our whole league, all together|toda nuestra liga junta|together",
      ],
      when: [
        "in the final|en la final|one",
        "in each game this year|en cada juego de este año|many",
      ],
      unit: "goals|goles",
      step: 1,
      base: [2, 4],
      r: 3,
    },
    {
      q: "How many minutes did {who} practice piano {when}?|¿Cuántos minutos practicó piano {who} {when}?",
      who: [
        "Noor|Noor|one",
        "each student in the band|cada estudiante de la banda|many",
        "the whole band, all together|toda la banda junta|together",
      ],
      when: ["today|hoy|one", "on each school day this month|cada día de clases de este mes|many"],
      unit: "minutes|minutos",
      step: 5,
      base: [15, 35],
      r: 4,
    },
  ];
  const PEOPLE = 20;

  const MSG = {
    nopred:
      "First predict: if you ask this question six times, will the answers stack on one value or spread out?|Primero predice: si haces esta pregunta seis veces, ¿las respuestas se apilarán en un valor o se extenderán?",
    norun:
      "Press Ask six times and look at the dots before you check.|Pulsa Preguntar seis veces y mira los puntos antes de revisar.",
    nochange:
      "Change one of the two menus. The question has to be different from the one you started with.|Cambia uno de los dos menús. La pregunta tiene que ser distinta de la que tenías al empezar.",
    toomany:
      "You changed both menus. Change only one, and think about which one matters.|Cambiaste los dos menús. Cambia solo uno y piensa cuál importa.",
    stacked:
      "All six answers are the same, so this question has no variability. Numbers or a sports topic are not enough: the answer must be able to change when you ask someone else or ask at another time.|Las seis respuestas son iguales, así que esta pregunta no tiene variabilidad. No bastan los números ni un tema de deportes: la respuesta tiene que poder cambiar si preguntas a otra persona o en otro momento.",
    spread:
      "The six answers are not all the same, so this question still has variability. Look for the part of the question that lets the answer change.|Las seis respuestas no son todas iguales, así que esta pregunta todavía tiene variabilidad. Busca la parte de la pregunta que deja que la respuesta cambie.",
  };

  /** True when asking the question again can give a different answer. */
  const varies = (sc, who, when) => sc.who[who].kind === "many" || sc.when[when].kind === "many";

  const grade = (/** @type {any} */ spec, /** @type {any} */ state) => {
    const K = kit();
    const M = spec.model;
    const s = state || {};
    const okMenu = (/** @type {any} */ v, /** @type {any[]} */ list) =>
      Number.isInteger(v) && v >= 0 && v < list.length;
    if (!okMenu(s.who, M.who) || !okMenu(s.when, M.when)) return K.no("askdots-invalid", MSG.norun);
    if (s.predict !== "stack" && s.predict !== "spread") return K.no("askdots-predict", MSG.nopred);
    if (!s.ran) return K.no("askdots-ask", MSG.norun);
    if (M.oneChange) {
      const ch = (s.who !== M.start.who ? 1 : 0) + (s.when !== M.start.when ? 1 : 0);
      if (ch === 0) return K.no("askdots-nochange", MSG.nochange);
      if (ch > 1) return K.no("askdots-toomany", MSG.toomany);
    }
    const v = varies(M, s.who, s.when);
    if (M.goal === "spread" && !v)
      return K.no(
        s.predict === "spread" ? "stat-question-judged-by-surface" : "stat-question-no-variability",
        MSG.stacked,
      );
    if (M.goal === "stack" && v)
      return K.no(
        s.predict === "stack" ? "stat-question-judged-by-surface" : "stat-question-no-variability",
        MSG.spread,
      );
    return { ok: true };
  };

  A.register("askdots", {
    title: "Ask it six times",
    titleEs: "Pregúntalo seis veces",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level) {
      const raw = rng.pick(SCEN);
      const three = level >= 2;
      const sc = {
        q: raw.q,
        unit: raw.unit,
        step: raw.step,
        who: raw.who.slice(0, three ? 3 : 2).map((s) => {
          const [en, es, kind] = s.split("|");
          return { en, es, kind };
        }),
        when: raw.when.map((s) => {
          const [en, es, kind] = s.split("|");
          return { en, es, kind };
        }),
      };
      const base = rng.int(raw.base[0] / raw.step, raw.base[1] / raw.step) * raw.step;
      const draw = () => {
        for (let t = 0; t < 200; t++) {
          const v = Array.from({ length: 6 }, () =>
            Math.max(raw.step, base + rng.int(-raw.r, raw.r) * raw.step),
          );
          if (new Set(v).size >= 4) return v;
        }
        return [1, 2, 3, 4, 5, 6].map((k) => base + k * raw.step);
      };
      const one = base;
      // series[who + "," + when] = { vals, lo, hi, step }: what six askings of that exact question return
      const series = /** @type {any} */ ({});
      sc.who.forEach((w, wi) =>
        sc.when.forEach((n, ni) => {
          const scale = w.kind === "together" ? PEOPLE : 1;
          const ax = raw.step * scale;
          const vals = varies({ who: sc.who, when: sc.when }, wi, ni)
            ? draw().map((v) => v * scale)
            : Array(6).fill(one * scale);
          series[`${wi},${ni}`] = {
            vals,
            lo: 0,
            hi: (Math.ceil(Math.max(...vals) / ax) + 1) * ax,
            step: ax,
          };
        }),
      );
      const goal = level % 2 ? "spread" : "stack";
      const oneChange = level >= 3;
      let start;
      if (level === 1) start = { who: 0, when: 0 };
      else if (level === 2) start = { who: 1, when: 1 };
      else if (level === 3) start = { who: 0, when: 0 };
      else start = rng.chance(0.5) ? { who: 1, when: 0 } : { who: 0, when: 1 };
      const mid = oneChange ? ["Change only ONE menu. ", "Cambia SOLO UN menú. "] : ["", ""];
      const lead =
        goal === "spread"
          ? ["Build a question that is statistical. ", "Arma una pregunta estadística. "]
          : [
              "Change the question so that all six answers are the same. ",
              "Cambia la pregunta para que las seis respuestas sean iguales. ",
            ];
      const hints = [
        [
          "A question is statistical when its answers can be different. Ask yourself: could six people, or six days, give six different answers?",
          "Una pregunta es estadística cuando sus respuestas pueden ser distintas. Pregúntate: ¿seis personas, o seis días, podrían dar seis respuestas distintas?",
        ],
        [
          "Look at the two menus. One says who is asked. The other says when. Find which menu lets the answer change.",
          "Mira los dos menús. Uno dice a quién se le pregunta. El otro dice cuándo. Busca qué menú deja que la respuesta cambie.",
        ],
        [
          "Ask six times after each change and watch whether the dots stack.",
          "Pregunta seis veces después de cada cambio y mira si los puntos se apilan.",
        ],
      ];
      const [unit, unitEs] = raw.unit.split("|");
      return {
        q: `${lead[0]}${mid[0]}Pick who is asked and when, predict what six answers (${unit}) will look like, then ask six times.`,
        qEs: `${lead[1]}${mid[1]}Elige a quién se le pregunta y cuándo, predice cómo se verán seis respuestas (${unitEs}) y luego pregunta seis veces.`,
        x:
          goal === "spread"
            ? "A question about many people, or about many days, can have a different answer each time. That is variability, and it is what makes a question statistical."
            : "One person asked about one moment has just one answer, so asking six times gives the same answer six times. A question with one fixed answer is not statistical.",
        xEs:
          goal === "spread"
            ? "Una pregunta sobre muchas personas, o sobre muchos días, puede tener una respuesta distinta cada vez. Eso es variabilidad, y es lo que hace estadística a una pregunta."
            : "Una persona a la que se le pregunta sobre un solo momento tiene una sola respuesta, así que preguntar seis veces da la misma respuesta seis veces. Una pregunta con una respuesta fija no es estadística.",
        h: hints.map((h) => h[0]),
        hEs: hints.map((h) => h[1]),
        model: { ...sc, goal, oneChange, start, series },
      };
    },
    solution(/** @type {any} */ spec) {
      const M = spec.model;
      for (let w = 0; w < M.who.length; w++)
        for (let n = 0; n < M.when.length; n++) {
          const s = { who: w, when: n, predict: M.goal, ran: true };
          if (grade(spec, s).ok) return s;
        }
      throw new Error("askdots: no solution");
    },
    wrong(/** @type {any} */ spec) {
      const M = spec.model;
      const sol = A.registry.askdots.solution(spec);
      const other = M.goal === "spread" ? "stack" : "spread";
      const out = [
        { who: M.start.who, when: M.start.when, predict: other, ran: true },
        { ...sol, predict: null },
        { ...sol, ran: false },
      ];
      return out.filter((s) => !grade(spec, s).ok);
    },
    grade,
    mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
      const K = kit();
      const M = spec.model;
      const { root, L, B, live, ro } = K.shell(host, api);
      const saved = api.restore && Number.isInteger(api.restore.who) ? api.restore : null;
      const st = {
        who: saved ? saved.who : M.start.who,
        when: saved ? saved.when : M.start.when,
        predict: saved ? saved.predict : null,
        ran: !!(saved && saved.ran),
      };
      const text = (/** @type {boolean} */ es) => {
        const [en, esq] = M.q.split("|");
        const t = es ? esq : en;
        return t
          .replace("{who}", es ? M.who[st.who].es : M.who[st.who].en)
          .replace("{when}", es ? M.when[st.when].es : M.when[st.when].en);
      };
      const qbox = A.el("div", "u2-box");
      const qline = A.el("p", "u2-note");
      qbox.append(qline);
      const menu = (
        /** @type {string} */ en,
        /** @type {string} */ es,
        /** @type {any[]} */ list,
        /** @type {"who"|"when"} */ key,
      ) => {
        const lab = A.el("p", "u2-note", `<b>${B(en, es)}</b>`);
        root.append(lab);
        return K.choices(
          root,
          list,
          st[key],
          ro,
          (i) => {
            st[key] = i;
            st.ran = false;
            refresh();
            api.change?.({ ...st });
          },
          L(en, es),
          B,
        );
      };
      root.append(qbox);
      menu("Who is asked?", "¿A quién se le pregunta?", M.who, "who");
      menu("When is it asked?", "¿Cuándo se pregunta?", M.when, "when");
      root.append(
        A.el(
          "p",
          "u2-note",
          `<b>${B("Predict: six answers will…", "Predice: las seis respuestas…")}</b>`,
        ),
      );
      const pred = K.choices(
        root,
        [
          { en: "stack on one value", es: "se apilarán en un valor" },
          { en: "spread out", es: "se extenderán" },
        ],
        st.predict === "stack" ? 0 : st.predict === "spread" ? 1 : null,
        ro,
        (i) => {
          st.predict = i === 0 ? "stack" : "spread";
          api.change?.({ ...st });
        },
        L("Prediction", "Predicción"),
        B,
      );
      const plot = A.el("div", "u2-plot");
      const cap = A.el("p", "u2-note");
      const ask = A.el("button", "u2-btn", B("Ask six times", "Preguntar seis veces"), {
        type: "button",
      });
      ask.disabled = ro;
      root.append(ask, plot, cap, live);
      const dots = () => {
        const s = M.series[`${st.who},${st.when}`];
        const w = 320;
        const pad = 22;
        const x = (/** @type {number} */ v) => pad + ((v - s.lo) / (s.hi - s.lo)) * (w - 2 * pad);
        const per = /** @type {any} */ ({});
        let g = "";
        for (const v of s.vals) {
          const k = (per[v] = (per[v] ?? -1) + 1);
          g += `<circle cx="${x(v)}" cy="${86 - 11 - k * 21}" r="9" fill="var(--sun,#F0BD4F)" stroke="var(--ink,#1B2733)" stroke-width="2"/>`;
        }
        let ticks = "";
        const every = Math.ceil((s.hi - s.lo) / s.step / 7);
        for (let v = s.lo, i = 0; v <= s.hi + 1e-9; v += s.step, i++)
          if (i % every === 0)
            ticks += `<line x1="${x(v)}" x2="${x(v)}" y1="86" y2="92" stroke="var(--ink,#1B2733)" stroke-width="2"/><text x="${x(v)}" y="106" class="u2-tick">${K.f(v)}</text>`;
        const label = L(
          `Six answers to the question, shown as dots on a number line.`,
          `Seis respuestas a la pregunta, mostradas como puntos en una recta numérica.`,
        );
        return `<svg class="u2-svg" viewBox="0 0 ${w} 112" role="img" aria-label="${label}"><line class="u2-axis" x1="8" x2="${w - 8}" y1="86" y2="86"/>${ticks}${g}</svg>`;
      };
      const refresh = () => {
        qline.innerHTML = `<b>${B(text(false), text(true))}</b>`;
        if (st.ran) {
          const v = varies(M, st.who, st.when);
          plot.innerHTML = dots();
          const said = st.predict === "stack" ? "stack" : st.predict === "spread" ? "spread" : null;
          const got = v ? "spread" : "stack";
          const en = `The six answers ${got === "stack" ? "all stack on one value" : "spread out"}.${said ? ` You predicted: ${said === "stack" ? "stack" : "spread"}.` : ""}`;
          const es = `Las seis respuestas ${got === "stack" ? "se apilan todas en un valor" : "se extienden"}.${said ? ` Predijiste: ${said === "stack" ? "apilar" : "extender"}.` : ""}`;
          cap.innerHTML = B(en, es);
        } else {
          plot.textContent = "";
          cap.innerHTML = B(
            "Press Ask six times to see the answers.",
            "Pulsa Preguntar seis veces para ver las respuestas.",
          );
        }
      };
      ask.addEventListener("click", () => {
        if (!st.predict) {
          const [a, b] = MSG.nopred.split("|");
          live.textContent = L(a, b);
          api.say?.(L(a, b));
          return;
        }
        st.ran = true;
        refresh();
        api.change?.({ ...st });
        api.say?.(cap.textContent);
      });
      refresh();
      if (!ro) {
        K.actions(
          root,
          api,
          B,
          () => ({ ...st }),
          () => {
            st.who = M.start.who;
            st.when = M.start.when;
            st.predict = null;
            st.ran = false;
            pred.set(null);
            for (const g of root.querySelectorAll('[role="radiogroup"]'))
              if (g !== pred.el) {
                const kind =
                  g === root.querySelectorAll('[role="radiogroup"]')[0] ? st.who : st.when;
                [...g.children].forEach((b, j) =>
                  b.setAttribute("aria-checked", String(j === kind)),
                );
              }
            refresh();
            api.change?.({ ...st });
          },
        );
      }
    },
  });
})();
