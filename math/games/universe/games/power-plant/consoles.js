// Power Plant — the instrument panels: where the student sets the mathematics.
// Native controls only (see runtime/shell.js openPanel). The simulation waits
// while a console is open, and a console never prints what a setting will
// produce: the facility shows that.

import { el } from "../../runtime/chrome.js";
import { evaluate, factors, leftToRight, power, running, show } from "./math.js";
import { clamps as clampsOf } from "./math.js";
import { deviceOf } from "./rules.js";

const sup = (base, exp) => [String(base), el("sup", null, String(exp))];

function chain(base, n) {
  const row = el("div.model", { role: "img", "aria-label": factors(base, n).join(" × ") || "1" });
  if (n === 0) row.append(el("i.op", null, "1"));
  factors(base, n).forEach((f, i) => {
    if (i) row.append(el("i.op", null, "×"));
    row.append(el("i", null, String(f)));
  });
  return row;
}

/** A − value + stepper with a live output. */
function stepper(g, label, get, set, min, max) {
  const out = el("output", null, String(get()));
  const step = (d) => () => {
    const v = Math.max(min, Math.min(max, get() + d));
    if (v === get()) return;
    set(v);
    out.textContent = String(v);
    g.audio.sfx("tick");
  };
  return el(
    "div.stepper",
    null,
    el("span", null, label),
    el("button", { type: "button", "aria-label": g.t("less"), on: { click: step(-1) } }, "−"),
    out,
    el("button", { type: "button", "aria-label": g.t("more"), on: { click: step(1) } }, "+"),
  );
}

function chips(options, isOn, pick) {
  const row = el("div.chips");
  const paint = () => {
    row.textContent = "";
    options.forEach((o, i) =>
      row.append(
        el(
          "button",
          {
            type: "button",
            "aria-pressed": String(isOn(o, i)),
            on: {
              click: () => {
                pick(o, i);
                paint();
              },
            },
          },
          o.label,
        ),
      ),
    );
  };
  paint();
  return row;
}

// ---------- reactor ----------
export function openReactor(g, m) {
  const w = g.world;
  const part = m.target === 0; // a feed of the Helix Core: set, do not run
  const need = part
    ? w.machines.find((x) => x.kind === "combo").loads[deviceOf(w, "core").phaseIndex]
    : m.target;
  let base = m.base;
  let exp = m.exp;
  let support = "";
  g.openPanel(g.t("reactorTitle", { id: (m.tag || m.id).toUpperCase() }), (body) => {
    const math = el("div.math", { "aria-live": "polite" });
    const model = el("div");
    const count = el("div.note");
    const budget = el("p.muted");
    const refresh = () => {
      math.textContent = "";
      math.append(...sup(base, exp));
      model.textContent = "";
      model.append(el("p.muted", null, g.t("factors")), chain(base, exp));
      count.textContent = support
        ? `${g.t("countUpNote")} ${running(base, exp).join(" → ") || "1"}`
        : "";
      if (w.coils >= 0) {
        const have = w.coils + m.held;
        budget.textContent =
          exp > have ? g.t("budgetShort", { need: exp, have }) : g.t("budget", { n: have - exp });
      }
      go.disabled = w.coils >= 0 && exp > w.coils + m.held;
    };
    const go = el(
      "button.primary",
      {
        type: "button",
        on: {
          click: () => {
            g.closePanel();
            const label = {
              en: `Reactor ${m.tag || m.id}: ${base}^${exp}`,
              es: `Reactor ${m.tag || m.id}: ${base}^${exp}`,
            };
            g.decide(
              "expression",
              label,
              { type: part ? "set" : "run", id: m.id, base, exp },
              {
                mechanic: "exponent-power",
                lesson: "6-3",
                support,
                detail: { base, exp },
              },
            );
            if (part) {
              g.timeline.resolve({ ok: true, key: "tuned" });
              g.toast(g.t("tuned"));
              g.audio.sfx("lock");
            }
          },
        },
      },
      g.t(part ? "setCoils" : "run"),
    );
    body.append(
      el(
        "p.note",
        null,
        part ? g.t("coreNote", { tag: m.tag, need }) : g.t("reactorNote", { need }),
      ),
      math,
      m.bases.length > 1
        ? el(
            "div",
            null,
            el("p.muted", null, g.t("base")),
            chips(
              m.bases.map((b) => ({ label: String(b), value: b })),
              (o) => o.value === base,
              (o) => {
                base = o.value;
                refresh();
              },
            ),
          )
        : el("p.muted", null, `${g.t("base")}: ${base}`),
      stepper(
        g,
        g.t("exponent"),
        () => exp,
        (v) => {
          exp = v;
          refresh();
        },
        m.minExp ?? 1,
        m.maxExp,
      ),
      model,
      // The scaffold opens after a miss and is recorded as a support, never hidden help.
      m.tries > 0 || part
        ? el(
            "button",
            {
              type: "button",
              on: {
                click: () => {
                  support = "running-product";
                  g.support(support);
                  refresh();
                },
              },
            },
            g.t("countUp"),
          )
        : null,
      count,
      budget,
      go,
    );
    refresh();
  });
}

// ---------- sequencer ----------
export function openSequencer(g, m) {
  const options = [null, ...clampsOf(m.tokens)];
  let group = m.group;
  g.openPanel(g.t("seqTitle"), (body) => {
    const math = el("div.math", { "aria-live": "polite" });
    const refresh = () => {
      math.textContent = show(m.tokens, group);
    };
    body.append(
      el("p.note", null, g.t("seqNote", { need: m.target })),
      math,
      chips(
        options.map((o) => ({ label: o ? show(m.tokens, o) : g.t("noClamp"), value: o })),
        (o) => JSON.stringify(o.value) === JSON.stringify(group),
        (o) => {
          group = o.value;
          refresh();
          g.audio.sfx("tick");
        },
      ),
      el(
        "button.primary",
        {
          type: "button",
          on: {
            click: () => {
              g.closePanel();
              const text = show(m.tokens, group);
              g.decide(
                "expression",
                { en: `Sequencer: ${text}`, es: `Secuenciador: ${text}` },
                { type: "runOps", id: m.id, group },
                {
                  mechanic: "order-of-operations",
                  lesson: "6-4",
                  detail: { expression: text },
                },
              );
            },
          },
        },
        g.t("runSeq"),
      ),
    );
    refresh();
  });
}

// ---------- Helix Core combiner ----------
export function openCore(g, m) {
  const w = g.world;
  const need = m.loads[deviceOf(w, "core").phaseIndex];
  const parts = m.parts.map((id) => w.machines.find((x) => x.id === id));
  g.openPanel(g.t("coreTitle"), (body) => {
    const math = el("div.math");
    parts.forEach((p, i) => {
      if (i === 1) math.append(" + ");
      if (i === 2) math.append(" × ");
      math.append(...sup(p.base, p.exp));
    });
    const engage = (choice) => {
      g.closePanel();
      const [a, b, c] = parts.map((p) => power(p.base, p.exp));
      // The prediction is judged against what the core actually receives.
      g.prediction = {
        mechanic: "core-combiner",
        choice,
        judge: (e) => choice === (e.vars.out < e.vars.need ? "under" : e.vars.out > e.vars.need ? "over" : "exact"),
      };
      const text = parts.map((p) => `${p.base}^${p.exp}`);
      g.decide(
        "expression",
        {
          en: `Core: ${text[0]} + ${text[1]} × ${text[2]}`,
          es: `Núcleo: ${text[0]} + ${text[1]} × ${text[2]}`,
        },
        { type: "engage", id: m.id },
        {
          mechanic: "core-combiner",
          lesson: "6-4",
          detail: { a, b, c, predicted: choice },
        },
      );
    };
    body.append(
      el("p.note", null, g.t("coreNeed", { need })),
      math,
      el("p.note", null, g.t("corePredict")),
      el(
        "div.chips",
        null,
        ["under", "exact", "over"].map((k) =>
          el("button", { type: "button", on: { click: () => engage(k) } }, g.t(k, { need })),
        ),
      ),
    );
  });
}

// ---------- teaching benches ----------
export function openCoilBench(g) {
  let base = 2;
  let n = 1;
  g.openPanel(g.t("benchTitle"), (body) => {
    const math = el("div.math", { "aria-live": "polite" });
    const model = el("div");
    const swap = el("p.note");
    const refresh = () => {
      math.textContent = "";
      math.append(...sup(base, n), ` = ${power(base, n)}`);
      model.textContent = "";
      model.append(chain(base, n));
      swap.textContent = g.t("swapNote", { base, n });
      add.textContent = g.t("addCoil", { base });
    };
    const add = el("button", {
      type: "button",
      on: {
        click: () => {
          if (n < 6) n++;
          refresh();
          g.audio.sfx("lock");
        },
      },
    });
    const tellOri = (key, vars, mood) => g.say("ori", g.t(key, vars), mood);
    body.append(
      el("p.note", null, g.t("benchNote")),
      el("h3", null, g.t("benchBuild")),
      chips(
        [2, 3, 4, 5, 10].map((b) => ({ label: String(b), value: b })),
        (o) => o.value === base,
        (o) => {
          base = o.value;
          refresh();
        },
      ),
      el(
        "div.row",
        null,
        add,
        el(
          "button",
          {
            type: "button",
            on: {
              click: () => {
                if (n > 1) n--;
                refresh();
              },
            },
          },
          g.t("removeCoil"),
        ),
      ),
      model,
      math,
      el(
        "button.primary",
        {
          type: "button",
          on: {
            click: () => {
              // A chain of two or more equal factors is a valid repeated-factor model.
              const r = g.teach("exp-repeat", {
                kind: "model",
                valid: n >= 2,
                shows: ["repeat", "count"],
                signature: `${base}^${n}`,
              });
              if (n < 2) tellOri("oriModelSmall", null, "thinking");
              else if (r.credited.length)
                tellOri("oriModel", { base, n, chain: factors(base, n).join(" × ") }, "surprised");
              else tellOri("oriRepeat", null, "thinking");
              g.afterTeach("exp-repeat");
            },
          },
        },
        g.t("showModel"),
      ),
      el("h3", null, g.t("benchSwap")),
      swap,
      el(
        "button.primary",
        {
          type: "button",
          on: {
            click: () => {
              const pow = power(base, n);
              const times = base * n;
              // A counterexample only counts when the power and the product really differ.
              const r = g.teach("exp-repeat", {
                kind: "counterexample",
                valid: pow !== times,
                shows: ["differs"],
                signature: `${base}^${n}`,
              });
              if (pow === times) tellOri("oriSame", { pow }, "confused");
              else if (r.credited.length)
                tellOri("oriDiffer", { base, n, pow, times }, "surprised");
              else tellOri("oriRepeat", null, "thinking");
              g.afterTeach("exp-repeat");
            },
          },
        },
        g.t("showSwap"),
      ),
      el(
        "button.ghost",
        {
          type: "button",
          on: {
            click: () => {
              g.teach("exp-repeat", { kind: "tell", valid: true, shows: [] });
              tellOri("oriTold", { n }, "confused");
            },
          },
        },
        g.t("tell"),
      ),
    );
    refresh();
  });
}

const ORDER_SET = [
  { tokens: [2, "+", 3, "×", 4], group: null },
  { tokens: [3, "×", 2, "^", 2], group: null },
  { tokens: [10, "−", 2, "×", 3], group: null },
  { tokens: [2, "+", 3, "×", 4], group: [0, 2] },
  { tokens: [2, "×", 3, "^", 2], group: [0, 2] },
  { tokens: [5, "+", 3, "^", 2], group: null },
];

/** Which order rule made the machine's result differ from left to right. */
export function orderShows(tokens, group) {
  if (group) return evaluate(tokens, group).value !== evaluate(tokens).value ? ["grouping"] : [];
  if (evaluate(tokens).value === leftToRight(tokens)) return [];
  const shows = [];
  for (let i = 3; i < tokens.length; i += 2) {
    const prev = tokens[i - 2];
    if (tokens[i] === "^" && prev !== "^") shows.push("power-first");
    if ((tokens[i] === "×" || tokens[i] === "÷") && (prev === "+" || prev === "−"))
      shows.push("times-first");
  }
  return shows;
}

export function openOrderBench(g) {
  let pick = 0;
  g.openPanel(g.t("orderTitle"), (body) => {
    const out = el("div");
    const refresh = () => {
      const { tokens, group } = ORDER_SET[pick];
      const run = evaluate(tokens, group);
      out.textContent = "";
      out.append(
        el("div.math", null, show(tokens, group)),
        el(
          "p.note",
          null,
          `${g.t("machineOrder")}: ${run.steps.map((s) => `${s.a} ${s.op} ${s.b} = ${s.result}`).join("  →  ")}`,
        ),
        el("p.note", null, `${g.t("leftRight")}: ${leftToRight(tokens)}`),
      );
    };
    body.append(
      el("p.note", null, g.t("orderNote")),
      el("p.muted", null, g.t("orderPick")),
      chips(
        ORDER_SET.map((o) => ({ label: show(o.tokens, o.group) })),
        (_o, i) => i === pick,
        (_o, i) => {
          pick = i;
          refresh();
        },
      ),
      out,
      el(
        "button.primary",
        {
          type: "button",
          on: {
            click: () => {
              const { tokens, group } = ORDER_SET[pick];
              const run = evaluate(tokens, group);
              const ltr = group ? evaluate(tokens).value : leftToRight(tokens);
              const shows = orderShows(tokens, group);
              const r = g.teach("ops-order", {
                kind: "compare",
                valid: shows.length > 0,
                shows,
                signature: show(tokens, group),
              });
              if (!shows.length) g.say("ori", g.t("oriOrderSame", { ops: run.value }), "confused");
              else if (r.credited.length) {
                const s = run.steps[0];
                g.say(
                  "ori",
                  g.t("oriOrderSeen", {
                    first: `${s.a} ${s.op} ${s.b}`,
                    second: group ? show(tokens) : `${tokens[0]} ${tokens[1]} ${tokens[2]}`,
                    ops: run.value,
                    ltr,
                  }),
                  "surprised",
                );
              } else g.say("ori", g.t("oriRepeat"), "thinking");
              g.afterTeach("ops-order");
            },
          },
        },
        g.t("orderRun"),
      ),
    );
    refresh();
  });
}
