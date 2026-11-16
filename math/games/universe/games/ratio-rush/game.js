// RATIO RUSH — a rail adventure on the Meridian Line (lessons 3-3, 3-5, 3-8).
//
// You drive a locomotive down a valley line: throttle, brake, switch tracks at
// crossovers to get round maintenance carts. At each signal the mathematics
// takes over. A gear ratio d : t sets how far the train goes each minute, and
// only an equivalent ratio keeps you side by side with the partner train to the
// coupling crane. At a junction the posted rate and length of each branch
// decide who reaches the station first. At a depot the efficiency decides how
// far the charge you load will carry you.
//
// Reality Shift: at any signal, open a second reality with one condition
// changed (a different gear, the other branch, a different charge). Both
// realities then run the same departure at once; switch between them, and
// compare them on a distance-time graph.

import { el } from "../../runtime/chrome.js";
import { Multiverse, PRIME } from "../../runtime/multiverse.js";
import { define, UniverseGame } from "../../runtime/shell.js";
import { createWorld, LANE_Y, LEVELS, MI } from "./levels.js";
import { compare, equivalent, fracText, table, timeFor } from "./math.js";
import {
  draw,
  drawBackdrop,
  drawInvestigation,
  drawOverlay,
} from "./render.js";
import { nextStop, rules, standingAt, stopAt } from "./rules.js";
import { STRINGS } from "./strings.js";

const WORDS = [
  "mi",
  "min",
  "cells",
  "cellsLeft",
  "upper",
  "lower",
  "limit",
  "station",
  "rival",
  "charger",
  "stopHere",
  "you",
  "realityA",
  "realityB",
];

/** 1 when the upper branch is faster, 2 when the lower is. */
export function fasterBranch(s) {
  const tu = timeFor(s.upper.rate, s.upper.len);
  const tl = timeFor(s.lower.rate, s.lower.len);
  return tu.n * tl.d < tl.n * tu.d ? 1 : 2;
}

class RatioRush extends UniverseGame {
  static def = {
    id: "ratio-rush",
    title: { en: "RATIO RUSH", es: "CARRERA DE RAZONES" },
    tagline: {
      en: "The Meridian Line is closed. Couple the trains, win the junctions and charge the line, one ratio at a time.",
      es: "La Línea Meridiana está cerrada. Engancha los trenes, gana los cambios de vía y carga la línea, una razón a la vez.",
    },
    bed: "rail",
    lessons: ["3-3", "3-5", "3-8"],
    uses: { multiverse: true, shift: true },
    concepts: [],
    levels: [
      {
        id: "coupling-run",
        lesson: "3-3",
        standard: "6.AT.3a",
        title: { en: "Coupling Run", es: "Recorrido de enganche" },
        discovery: {
          en: "Equivalent ratios name the same rate: 6 miles in 4 minutes keeps pace with 3 miles in 2 minutes, every minute of the way.",
          es: "Las razones equivalentes nombran la misma tasa: 6 millas en 4 minutos lleva el mismo paso que 3 millas en 2 minutos, en cada minuto del camino.",
        },
      },
      {
        id: "junction-run",
        lesson: "3-5",
        standard: "6.AT.3",
        title: { en: "Junction Run", es: "Recorrido de cambios" },
        discovery: {
          en: "To compare two routes, compare what each rate does with its own distance: time = distance ÷ rate.",
          es: "Para comparar dos rutas, compara lo que hace cada tasa con su propia distancia: tiempo = distancia ÷ tasa.",
        },
      },
      {
        id: "charge-line",
        lesson: "3-8",
        standard: "6.AT.2",
        title: { en: "Charge Line", es: "Línea de carga" },
        discovery: {
          en: "A unit rate answers the question: how many miles does one cell carry? Then any distance is a multiplication away.",
          es: "Una tasa unitaria responde: ¿cuántas millas lleva una celda? Después, cualquier distancia está a una multiplicación.",
        },
      },
    ],
    mechanics: [
      {
        id: "equivalent-rates",
        action: "set the gear: d miles every t minutes",
        relationship:
          "position after m minutes = m × d ÷ t; two trains stay level only when d : t is equivalent to the partner's rate",
        stateChange:
          "both trains leave the signal; positions are computed from elapsed time and the exact rate",
        visible:
          "the trains run side by side (or drift apart); minute tick marks on the rails; the crane couples only on a simultaneous arrival",
        evidence:
          "accuracy decision with the gear and partner rate; tags ratio-scaled-additively and ratio-inverted",
      },
      {
        id: "compare-rates",
        action:
          "choose the upper or lower branch (after predicting which is faster)",
        relationship: "time = length ÷ rate for each branch",
        stateChange:
          "you and the rival courier run the two branches at their posted rates",
        visible:
          "whoever reaches the station first; the gate opens for you only if you win",
        evidence: "accuracy decision with the branch data; a prediction",
      },
      {
        id: "unit-rate",
        action: "load charge cells from a shared budget",
        relationship:
          "reach = cells × d ÷ t miles; cells needed = distance × t ÷ d",
        stateChange: "the train runs until the charge is spent",
        visible:
          "it reaches the charger, or coasts to a stop short of it; extra charge is released and lost",
        evidence: "accuracy decision; tag rate-not-per-one",
      },
      {
        id: "reality-shift",
        action: "open a second reality with one condition changed",
        relationship: "the same model run with one changed variable",
        stateChange: "two worlds step with the same inputs",
        visible:
          "two runs at once, a side-by-side table of what changed and what stayed the same, and a distance-time graph",
        evidence:
          "the shift itself is a recorded decision; outcomes in the reality the student is in are recorded",
      },
    ],
  };

  static strings = STRINGS;

  rules = rules;
  said = {};
  asked = {};

  createWorld(index, seed) {
    return createWorld(index, seed);
  }

  focus(w) {
    return {
      x: w.train.x * MI - 40,
      y: LANE_Y[w.train.lane] - 20,
      face: w.train.mode === "drive" ? Math.sign(w.train.v) : 1,
    };
  }

  bounds(w) {
    return { x: 0, y: 0, w: w.len * MI + 160, h: 620 };
  }

  get words() {
    const out = {};
    for (const k of WORDS) out[k] = this.t(k);
    return out;
  }

  drawBackdrop(ctx, cam, w, t) {
    drawBackdrop(ctx, cam, w, t, this.lowfx);
  }

  draw(ctx, w, t) {
    this.cache ||= {};
    if (this.cache.lang !== this.lang)
      this.cache = { lang: this.lang, words: this.words };
    draw(ctx, w, t, { words: this.cache.words, lowfx: this.lowfx });
  }

  drawOverlay(ctx, w) {
    drawOverlay(ctx, w, this.cache?.words || this.words);
  }

  drawInvestigation(ctx, mv, cw, ch) {
    drawInvestigation(ctx, mv, cw, ch, this.words);
  }

  measureLabel(key) {
    return this.t(`m_${key}`);
  }

  fmt(key, v) {
    if (key === "branch") return this.t(v);
    return String(v);
  }

  onLevelStart(index) {
    this.said = {};
    this.say(this.t("dispatch"), this.t(["hello", "junctionHi", "depotHi"][index]));
  }

  // ---------- objective, description, reach ----------
  objective(w) {
    const s = nextStop(w);
    if (!s) return this.t("objExit");
    if (
      w.carts.some(
        (c) =>
          c.lane === w.train.lane &&
          c.x > w.train.x &&
          c.x - w.train.x < 3 &&
          w.train.x < s.x,
      )
    )
      return this.t("objCart");
    if (w.train.mode === "drive" && (w.train.lane !== 0 || w.train.x < s.x - 0.45)) return this.t("objDrive");
    if (s.kind === "couple")
      return this.t("objCouple", {
        name: s.name,
        pd: s.partner.d,
        pt: s.partner.t,
      });
    if (s.kind === "junction") return this.t("objJunction");
    return this.t("objDepot", { span: s.span });
  }

  describe(w) {
    const s = nextStop(w);
    const parts = [
      this.tx(this.level.title),
      this.objective(w),
      `${this.t("you")}: ${w.train.x.toFixed(1)} ${this.t("mi")}`,
    ];
    if (s) parts.push(`${this.t("whatSignal")}: ${s.x} ${this.t("mi")}`);
    if (w.budget >= 0) parts.push(`${this.t("cellsLeft")}: ${w.budget}`);
    return parts.join(". ");
  }

  interactable(w) {
    const s = standingAt(w);
    if (!s) return null;
    const what = this.t(
      s.kind === "couple"
        ? "useCouple"
        : s.kind === "junction"
          ? "useJunction"
          : "useDepot",
    );
    return { id: s.id, stop: s, what };
  }

  nextStop(w) {
    if (w.train.mode !== "drive") return null;
    const s = nextStop(w);
    if (s)
      return Math.abs(w.train.x - s.x) < 0.05
        ? null
        : { id: s.id, x: s.x, y: 0, what: this.t("whatSignal") };
    return { id: "exit", x: w.exit + 0.5, y: 0, what: this.t("whatExit") };
  }

  interact(target) {
    const s = target.stop;
    if (s.kind === "couple") this.gearConsole(s);
    else if (s.kind === "junction") this.junctionConsole(s);
    else this.depotConsole(s);
  }

  get only() {
    return this.subject instanceof Multiverse && this.subject.shifted
      ? this.subject.active
      : undefined;
  }

  // ---------- consoles ----------
  stepper(label, get, set, min, max) {
    const out = el("output", null, String(get()));
    const step = (d) => () => {
      const v = Math.max(min, Math.min(max, get() + d));
      if (v === get()) return;
      set(v);
      out.textContent = String(v);
      this.audio.sfx("tick");
    };
    return el(
      "div.stepper",
      null,
      el("span", null, label),
      el(
        "button",
        {
          type: "button",
          "aria-label": this.t("less"),
          on: { click: step(-1) },
        },
        "−",
      ),
      out,
      el(
        "button",
        {
          type: "button",
          "aria-label": this.t("more"),
          on: { click: step(1) },
        },
        "+",
      ),
    );
  }

  chips(options, isOn, pick) {
    const row = el("div.chips");
    const paint = () => {
      row.textContent = "";
      for (const o of options)
        row.append(
          el(
            "button",
            {
              type: "button",
              "aria-pressed": String(isOn(o)),
              on: {
                click: () => {
                  pick(o);
                  paint();
                },
              },
            },
            o.label,
          ),
        );
    };
    paint();
    return row;
  }

  gearConsole(s) {
    let d = s.gear.d;
    let t = s.gear.t;
    let support = "";
    this.openPanel(this.t("gearTitle"), (body) => {
      const math = el("div.math", { "aria-live": "polite" });
      const tbl = el("div");
      const refresh = () => {
        math.textContent = `${d} ${this.t("mi")} : ${t} ${this.t("min")}`;
        tbl.textContent = "";
        if (support) {
          const rows = table({ d, t }, 4);
          tbl.append(
            el("p.muted", null, this.t("tableNote")),
            el(
              "table",
              null,
              el(
                "thead",
                null,
                el(
                  "tr",
                  null,
                  el("th", { scope: "col" }, this.t("min")),
                  el("th", { scope: "col" }, this.t("mi")),
                ),
              ),
              el(
                "tbody",
                null,
                rows.map((r) =>
                  el(
                    "tr",
                    null,
                    el("td", null, String(r.t)),
                    el("td", null, String(r.d)),
                  ),
                ),
              ),
            ),
          );
        }
      };
      body.append(
        el(
          "p.note",
          null,
          this.t("gearNote", {
            name: s.name,
            pd: s.partner.d,
            pt: s.partner.t,
            span: s.span,
          }),
        ),
        math,
        el("p.muted", null, this.t("gearD")),
        this.chips(
          s.dOptions.map((v) => ({ label: String(v), value: v })),
          (o) => o.value === d,
          (o) => {
            d = o.value;
            refresh();
          },
        ),
        this.stepper(
          this.t("gearT"),
          () => t,
          (v) => {
            t = v;
            refresh();
          },
          1,
          s.tMax,
        ),
        s.tries > 0
          ? el(
              "button",
              {
                type: "button",
                on: {
                  click: () => {
                    support = "ratio-table";
                    this.support(support);
                    refresh();
                  },
                },
              },
              this.t("gearTable"),
            )
          : null,
        tbl,
        el(
          "button.primary",
          {
            type: "button",
            on: {
              click: () => {
                this.closePanel();
                const label = {
                  en: `Gear ${d}:${t} vs ${s.name} ${s.partner.d}:${s.partner.t}`,
                  es: `Engranaje ${d}:${t} contra ${s.name} ${s.partner.d}:${s.partner.t}`,
                };
                this.decide(
                  "ratio",
                  label,
                  { type: "gear", stop: s.id, d, t, only: this.only },
                  {
                    mechanic: "equivalent-rates",
                    lesson: "3-3",
                    support,
                    detail: { d, t, partner: s.partner },
                  },
                );
                if (!this.said.pace) {
                  this.said.pace = 1;
                  this.say(this.t("dispatch"), this.t("pace"));
                }
              },
            },
          },
          this.t("go"),
        ),
      );
      refresh();
    });
  }

  junctionConsole(s) {
    let branch = 0;
    let guess = 0;
    this.openPanel(this.t("juncTitle"), (body) => {
      const go = el(
        "button.primary",
        {
          type: "button",
          disabled: true,
          on: {
            click: () => {
              this.closePanel();
              const fast = fasterBranch(s);
              this.prediction = {
                mechanic: "compare-rates",
                choice: guess,
                judge: () => guess === fast,
              };
              const name = branch === 1 ? "upper" : "lower";
              this.decide(
                "ratio",
                {
                  en: `Junction: ${name} branch`,
                  es: `Cambio: ramal ${branch === 1 ? "superior" : "inferior"}`,
                },
                { type: "branch", stop: s.id, branch, only: this.only },
                {
                  mechanic: "compare-rates",
                  lesson: "3-5",
                  detail: { branch, predicted: guess },
                },
              );
            },
          },
        },
        this.t("goJunction"),
      );
      const ready = () => {
        go.disabled = !(branch && guess);
      };
      const line = (b, tag) =>
        `${tag}: ${b.len} ${this.t("mi")} · ${this.t("limit")} ${b.rate.d} ${this.t("mi")} : ${b.rate.t} ${this.t("min")}`;
      body.append(
        el("p.note", null, this.t("juncNote")),
        el("p", null, line(s.upper, this.t("upper"))),
        el("p", null, line(s.lower, this.t("lower"))),
        el("h3", null, this.t("juncPredict")),
        this.chips(
          [
            { label: this.t("upper"), value: 1 },
            { label: this.t("lower"), value: 2 },
          ],
          (o) => o.value === guess,
          (o) => {
            guess = o.value;
            ready();
          },
        ),
        el("h3", null, this.t("juncTitle")),
        this.chips(
          [
            { label: this.t("pickUpper"), value: 1 },
            { label: this.t("pickLower"), value: 2 },
          ],
          (o) => o.value === branch,
          (o) => {
            branch = o.value;
            ready();
          },
        ),
        go,
      );
    });
  }

  depotConsole(s) {
    const w = this.world;
    let cells = Math.min(w.budget, s.cells || 1);
    let support = "";
    this.openPanel(this.t("depotTitle"), (body) => {
      const math = el("div.math", { "aria-live": "polite" });
      const tbl = el("div");
      const refresh = () => {
        math.textContent = `${cells} ${this.t("cells")}`;
        tbl.textContent = "";
        if (support)
          tbl.append(
            el(
              "table",
              null,
              el(
                "thead",
                null,
                el(
                  "tr",
                  null,
                  el("th", { scope: "col" }, this.t("cells")),
                  el("th", { scope: "col" }, this.t("mi")),
                ),
              ),
              el(
                "tbody",
                null,
                table(s.rate, 4).map((r) =>
                  el(
                    "tr",
                    null,
                    el("td", null, String(r.t)),
                    el("td", null, String(r.d)),
                  ),
                ),
              ),
            ),
          );
      };
      body.append(
        el(
          "p.note",
          null,
          this.t("depotNote", { d: s.rate.d, t: s.rate.t, span: s.span }),
        ),
        math,
        this.stepper(
          this.t("depotCells"),
          () => cells,
          (v) => {
            cells = v;
            refresh();
          },
          1,
          Math.max(1, w.budget),
        ),
        el("p.muted", null, `${this.t("cellsLeft")}: ${w.budget}`),
        s.tries > 0
          ? el(
              "button",
              {
                type: "button",
                on: {
                  click: () => {
                    support = "rate-table";
                    this.support(support);
                    refresh();
                  },
                },
              },
              this.t("gearTable"),
            )
          : null,
        tbl,
        el(
          "button.primary",
          {
            type: "button",
            on: {
              click: () => {
                this.closePanel();
                this.decide(
                  "ratio",
                  {
                    en: `Loaded ${cells} cells for ${s.span} mi`,
                    es: `Cargó ${cells} celdas para ${s.span} mi`,
                  },
                  { type: "load", stop: s.id, cells, only: this.only },
                  {
                    mechanic: "unit-rate",
                    lesson: "3-8",
                    support,
                    detail: { cells, span: s.span, rate: s.rate },
                  },
                );
              },
            },
          },
          this.t("loadGo"),
        ),
      );
      refresh();
    });
  }

  // ---------- Reality Shift ----------
  buildShift(body, mv, commit) {
    const w = mv.worlds[PRIME];
    const s = standingAt(mv.world) || (w.train.mode === "drive" ? standingAt(w) : null);
    if (!s) {
      body.append(el("p.note", null, this.t("shiftNeedStop")));
      return;
    }
    const go = (variable, from, to, label) => commit({ stop: s.id, variable, from, to }, label);
    const openBtn = (fn) => el("button.gold", { type: "button", on: { click: fn } }, this.t("shiftOpen"));
    if (s.kind === "couple") {
      let d = s.dOptions[(s.dOptions.indexOf(s.gear.d) + 1) % s.dOptions.length];
      let t = s.gear.t;
      const math = el("div.math");
      const show = () => {
        math.textContent = `${d} ${this.t("mi")} : ${t} ${this.t("min")}`;
      };
      const pickD = (o) => {
        d = o.value;
        show();
      };
      const setT = (v) => {
        t = v;
        show();
      };
      body.append(
        el("h3", null, this.t("shiftGear")),
        math,
        this.chips(s.dOptions.map((v) => ({ label: String(v), value: v })), (o) => o.value === d, pickD),
        this.stepper(this.t("gearT"), () => t, setT, 1, s.tMax),
        el("p.muted", null, this.t("shiftHint")),
        openBtn(() => go("gear", { ...s.gear }, { d, t }, { en: `Shift: gear ${d}:${t}`, es: `Cambio: engranaje ${d}:${t}` })),
      );
      show();
    } else if (s.kind === "junction") {
      const other = s.branch === 1 ? 2 : 1;
      const label = {
        en: `Shift: ${other === 1 ? "upper" : "lower"} branch`,
        es: `Cambio: ramal ${other === 1 ? "superior" : "inferior"}`,
      };
      body.append(
        el("h3", null, this.t("shiftBranch")),
        el("p.muted", null, this.t("shiftHint")),
        openBtn(() => go("branch", s.branch, other, label)),
      );
    } else {
      let cells = (s.cells || 1) + 1;
      const math = el("div.math");
      const show = () => {
        math.textContent = `${cells} ${this.t("cells")}`;
      };
      const setCells = (v) => {
        cells = v;
        show();
      };
      body.append(
        el("h3", null, this.t("shiftCells")),
        math,
        this.stepper(this.t("depotCells"), () => cells, setCells, 1, 20),
        el("p.muted", null, this.t("shiftHint")),
        openBtn(() => go("cells", s.cells, cells, { en: `Shift: ${cells} cells`, es: `Cambio: ${cells} celdas` })),
      );
      show();
    }
  }

  onCounterfactual(e) {
    if (e.type === "outcome")
      this.toast(this.t(e.ok ? "counterOk" : "counterBad"));
  }

  // ---------- presentation ----------
  onEvent(e) {
    const w = this.world;
    switch (e.type) {
      case "launch":
        this.audio.sfx("whistle");
        break;
      case "arrive":
        this.audio.sfx(e.who === "you" ? "checkpoint" : "tick");
        break;
      case "switch":
        this.audio.sfx("lock");
        break;
      case "noSwitch":
        if (!this.said.noSwitch) {
          this.said.noSwitch = 1;
          this.toast(this.t("noSwitch"));
        }
        break;
      case "bump":
        this.audio.sfx("strain");
        this.camera.kick(3);
        this.toast(this.t("bumped"));
        if (!this.said.cart) {
          this.said.cart = 1;
          this.say(this.t("dispatch"), this.t("cartAhead"));
        }
        break;
      case "buffer":
        this.audio.sfx("brake");
        break;
      case "signal":
        this.audio.sfx("brake");
        if (!this.said.signal) {
          this.said.signal = 1;
          this.say(this.t("dispatch"), this.t("signalStop"));
        }
        break;
      case "coast":
        this.audio.sfx("strain");
        break;
      case "refuse":
        this.say("wren", this.t(e.key), "worried");
        break;
      case "stopDone": {
        const s = stopAt(w, e.stop);
        this.fx.emit(
          s.x * MI + s.span * MI,
          LANE_Y[0] - 60,
          30,
          170,
          0,
          -Math.PI / 2,
          Math.PI * 2,
          0.9,
        );
        const k = s.kind;
        if (!this.asked[k]) this.later(2.6, () => this.askOnce(k, s));
        break;
      }
    }
  }

  askOnce(kind, s) {
    if (this.asked[kind] || this.mode !== "play") return;
    this.asked[kind] = true;
    const o = {
      couple: {
        prompt: this.t("explainGear", { name: s.name }),
        frames: [this.t("frameGear1"), this.t("frameGear2")],
        mechanic: "equivalent-rates",
      },
      junction: {
        prompt: this.t("explainJunction"),
        frames: [this.t("frameJ1"), this.t("frameJ2")],
        mechanic: "compare-rates",
      },
      depot: {
        prompt: this.t("explainDepot"),
        frames: [this.t("frameD1"), this.t("frameD2")],
        mechanic: "unit-rate",
      },
    }[kind];
    this.explain(o);
  }
}

define("ewl-ratio-rush", RatioRush);
export { compare, equivalent, fracText, LEVELS, RatioRush };
