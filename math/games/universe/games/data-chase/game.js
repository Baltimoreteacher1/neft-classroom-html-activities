// THE DATA CHASE — an investigative adventure (2-1, 2-2, 2-3, 2-4, 2-5, 2-8, 2-10).
//
// You report for the Meridian Ledger. Run and jump the streets to interview
// sources (each gives one value; the notebook's dot plot fills as you go),
// then build the story at the newsroom desks. A question one person can answer
// opens one source and one dot; a statistical question lights up the street.
// Every claim is fact-checked against the data you collected: a mean dragged
// up by one long commute is caught, and the boards draw your own histogram
// and box plots over the real dots.

import { el } from "../../runtime/chrome.js";
import { action, chips, stepper } from "../../runtime/controls.js";
import { define, UniverseGame } from "../../runtime/shell.js";
import { createWorld, dataFor, FLOOR, LEVELS, QUESTIONS } from "./levels.js";
import { histogram, num } from "./math.js";
import { draw, drawBackdrop, drawOverlay } from "./render.js";
import { deskOpen, rules, sourceX } from "./rules.js";
import { STRINGS } from "./strings.js";

const DESK_NAME = {
  question: "deskQuestion",
  histogram: "deskHistogram",
  headline: "deskHeadline",
  mean: "deskMean",
  compare: "deskCompare",
};

class DataChase extends UniverseGame {
  static def = {
    id: "data-chase",
    title: { en: "THE DATA CHASE", es: "LA CAZA DE DATOS" },
    tagline: {
      en: "Report for the Meridian Ledger: chase down the data, then publish only what the numbers really say.",
      es: "Reporta para el Meridian Ledger: persigue los datos y publica solo lo que los números de verdad dicen.",
    },
    bed: "news",
    lessons: ["2-1", "2-2", "2-3", "2-4", "2-5", "2-8", "2-10"],
    uses: {},
    concepts: [],
    levels: [
      {
        id: "the-tip",
        lesson: "2-1",
        lessons: ["2-1", "2-2"],
        standard: "6.DS.1",
        title: { en: "The Tip", es: "La pista" },
        discovery: {
          en: "A statistical question expects many different answers. A histogram groups those answers into intervals so the shape shows.",
          es: "Una pregunta estadística espera muchas respuestas distintas. Un histograma agrupa esas respuestas en intervalos para que se vea la forma.",
        },
      },
      {
        id: "the-outlier",
        lesson: "2-10",
        lessons: ["2-3", "2-8", "2-10"],
        standard: "6.DS.6d",
        title: { en: "The Outlier", es: "El valor atípico" },
        discovery: {
          en: "One extreme value pulls the mean but barely moves the median. With an outlier, the median tells the typical story.",
          es: "Un valor extremo jala la media pero casi no mueve la mediana. Con un valor atípico, la mediana cuenta la historia típica.",
        },
      },
      {
        id: "two-districts",
        lesson: "2-4",
        lessons: ["2-4", "2-5"],
        standard: "6.DS.3",
        title: { en: "Two Districts", es: "Dos distritos" },
        discovery: {
          en: "The range uses only the two ends. The IQR measures the middle half, so it shows how consistent the typical values are.",
          es: "El rango usa solo los dos extremos. El RIC mide la mitad central, así que muestra qué tan constantes son los valores típicos.",
        },
      },
    ],
    mechanics: [
      {
        id: "statistical-question",
        action: "choose the question to investigate",
        relationship: "a statistical question anticipates variability",
        stateChange: "the sources that question can reach appear",
        visible: "a street full of sources, or one person and one dot",
        evidence: "accuracy decision; tag stat-question-no-variability",
      },
      {
        id: "histogram",
        action: "choose a bin width and name the fullest interval",
        relationship: "a histogram counts values in equal intervals",
        stateChange: "the board draws the histogram from the collected data",
        visible: "bar heights from your data, your chosen bar highlighted",
        evidence: "accuracy decision with the bin width",
      },
      {
        id: "choose-measure",
        action: "publish a headline with a measure of center",
        relationship: "an outlier pulls the mean; the median resists it",
        stateChange: "the fact-checker counts values below the headline number",
        visible: "8 of 9 below the mean; a line drawn over the dots",
        evidence: "accuracy decision; tag stat-mean-skewed-by-outlier",
      },
      {
        id: "box-plot",
        action: "set a box plot's five numbers",
        relationship: "min, Q1, median, Q3, max (median left out of the halves when n is odd)",
        stateChange: "the board draws your box over the real dots",
        visible: "a box that fits the dots, or one that visibly does not",
        evidence: "accuracy decision with the five numbers",
      },
      {
        id: "compare-spread",
        action: "choose the more consistent data set",
        relationship: "IQR, not range, measures the typical spread",
        stateChange: "the front page runs your comparison",
        visible: "the two box plots side by side",
        evidence: "accuracy decision; tag stat-range-for-iqr",
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
    return { x: w.p.x + w.p.w / 2, y: w.p.y - 140, face: w.p.face };
  }

  bounds(w) {
    return { x: 0, y: 0, w: w.w, h: w.h };
  }

  drawBackdrop(ctx, cam, w, t) {
    drawBackdrop(ctx, cam, w, t, this.lowfx);
  }

  deskName(d) {
    if (d.kind === "boxplot") return this.t(d.set === "north" ? "deskBoxNorth" : "deskBoxSouth");
    return this.t(DESK_NAME[d.kind]);
  }

  draw(ctx, w, t) {
    draw(ctx, w, t, {
      deskName: (d) => this.deskName(d),
      factcheck: (a) => this.t("factcheck", { below: a.below, n: a.n, value: num(a.value) }),
      acting: this.mode === "panel",
      oriMood: this.oriMood,
      talk: this.caption?.who === "ori",
    });
  }

  drawOverlay(ctx, w) {
    drawOverlay(ctx, w, { notebook: this.t("notebook") });
  }

  onLevelStart(index) {
    this.said = {};
    this.say("ori", this.t(["hello", "helloOutlier", "helloSpread"][index]), "curious");
  }

  objective(w) {
    if (w.desks.every((d) => d.done)) return this.t("objDone");
    if (w.level === 0 && !w.desks[0].done)
      return w.question ? this.t("objLonely") : this.t("objQuestion");
    const got = w.sources.filter((s) => s.got).length;
    if (got < w.sources.length) return this.t("objCollect", { got, n: w.sources.length });
    const d = w.desks.find((x) => !x.done);
    return this.t("objDesk", { desk: this.deskName(d) });
  }

  describe(w) {
    const parts = [this.tx(this.level.title), this.objective(w)];
    if (w.notebook.length)
      parts.push(`${this.t("notebook")}: ${w.notebook.map((n) => n.v).join(", ")}`);
    return parts.join(". ");
  }

  interactable(w) {
    if (!w.p.ground) return null;
    const px = w.p.x + w.p.w / 2;
    const feet = w.p.y + w.p.h;
    for (const s of w.sources) {
      if (s.got) continue;
      if (Math.abs(px - sourceX(s, w.tick)) < 46 && Math.abs(feet - s.y) < 30)
        return { id: `s${s.id}`, type: "ask", source: s, what: this.t("useAsk") };
    }
    for (const d of w.desks) {
      if (d.kind === "start" || d.done) continue;
      if (Math.abs(px - d.x) < 56)
        return {
          id: `d${d.id}`,
          type: "desk",
          desk: d,
          what: this.t("useDesk", { desk: this.deskName(d) }),
        };
    }
    return null;
  }

  nextStop(w) {
    const open = w.desks.find((d) => !d.done && d.kind !== "start");
    if (w.level === 0 && !w.desks[0].done)
      return Math.abs(w.p.x - w.desks[0].x) < 40
        ? null
        : { id: "desk0", x: w.desks[0].x, y: FLOOR, what: this.t("whatNext") };
    const s = w.sources.find((x) => !x.got);
    if (s) return { id: `s${s.id}`, x: sourceX(s, w.tick), y: s.y, what: this.t("whatNext") };
    if (open)
      return Math.abs(w.p.x - open.x) < 40
        ? null
        : { id: `d${open.id}`, x: open.x, y: FLOOR, what: this.t("whatNext") };
    return null;
  }

  interact(target) {
    if (target.type === "ask") {
      const s = target.source;
      this.decide(
        "ask",
        { en: `Asked: ${s.v}`, es: `Preguntó: ${s.v}` },
        { type: "ask", source: s.id },
        { mechanic: "collect" },
      );
      return;
    }
    const d = target.desk;
    if (!deskOpen(this.world, d) && d.kind !== "question")
      return this.say("ori", this.t("locked"), "thinking");
    const kinds = {
      question: this.questionDesk,
      histogram: this.histogramDesk,
      headline: this.headlineDesk,
      mean: this.meanDesk,
      boxplot: this.boxDesk,
      compare: this.compareDesk,
    };
    kinds[d.kind].call(this, d);
  }

  publish(label, a, mechanic) {
    this.closePanel();
    this.decide("story", label, a, { mechanic, detail: a });
  }

  questionDesk(d) {
    this.openPanel(this.t("questionTitle"), (body) => {
      body.append(el("p.note", null, this.t("questionNote")));
      for (const q of QUESTIONS)
        body.append(
          action(this.t(`q_${q.id}`), () =>
            this.publish(
              { en: `Question: ${q.id}`, es: `Pregunta: ${q.id}` },
              { type: "question", desk: d.id, q: q.id },
              "statistical-question",
            ),
          ),
        );
    });
  }

  histogramDesk(d) {
    let width = d.widths[1];
    this.openPanel(this.t("histTitle"), (body) => {
      const picks = el("div");
      const show = () => {
        picks.textContent = "";
        const bins = histogram(dataFor(this.world, d), width);
        picks.append(
          el("p.muted", null, this.t("histPick")),
          chips(
            bins.map((b) => ({ label: `${b.from}–${b.to}`, value: b.from })),
            () => false,
            (o) =>
              this.publish(
                { en: `Histogram ${width}: ${o.label}`, es: `Histograma ${width}: ${o.label}` },
                { type: "histogram", desk: d.id, width, from: o.value },
                "histogram",
              ),
          ),
        );
      };
      body.append(
        el("p.muted", null, this.t("histWidth")),
        chips(
          d.widths.map((v) => ({ label: String(v), value: v })),
          (o) => o.value === width,
          (o) => {
            width = o.value;
            show();
          },
        ),
        picks,
      );
      show();
    });
  }

  headlineDesk(d) {
    let measure = "mean";
    let value = 20;
    this.openPanel(this.t("headTitle"), (body) => {
      body.append(
        el("p.note", null, this.t("headNote")),
        el("p.muted", null, this.t("headMeasure")),
        chips(
          [
            { label: this.t("mean"), value: "mean" },
            { label: this.t("median"), value: "median" },
          ],
          (o) => o.value === measure,
          (o) => {
            measure = o.value;
          },
        ),
        stepper(
          this,
          this.t("headValue"),
          () => value,
          (v) => {
            value = v;
          },
          0,
          100,
          0.5,
        ),
        action(
          this.t("publish"),
          () =>
            this.publish(
              { en: `Headline: ${measure} ${value}`, es: `Titular: ${measure} ${value}` },
              { type: "headline", desk: d.id, measure, value },
              "choose-measure",
            ),
          ".primary",
        ),
      );
    });
  }

  meanDesk(d) {
    let value = 5;
    this.openPanel(this.t("meanTitle"), (body) => {
      body.append(
        el("p.note", null, this.t("meanNote", { tips: this.world.tips.join(", ") })),
        stepper(
          this,
          this.t("headValue"),
          () => value,
          (v) => {
            value = v;
          },
          0,
          60,
          0.5,
        ),
        action(
          this.t("publish"),
          () =>
            this.publish(
              { en: `Mean ${value}`, es: `Media ${value}` },
              { type: "mean", desk: d.id, value },
              "mean",
            ),
          ".primary",
        ),
      );
    });
  }

  boxDesk(d) {
    const data = dataFor(this.world, d);
    const five = d.answer
      ? { ...d.answer }
      : {
          min: Math.min(...data),
          q1: Math.min(...data),
          median: Math.min(...data),
          q3: Math.max(...data),
          max: Math.max(...data),
        };
    this.openPanel(this.t("boxTitle", { set: this.t(d.set) }), (body) => {
      body.append(
        el("p.note", null, this.t("boxNote")),
        el("p.muted", null, [...data].sort((a, b) => a - b).join(", ")),
      );
      for (const k of ["min", "q1", "median", "q3", "max"])
        body.append(
          stepper(
            this,
            this.t(k),
            () => five[k],
            (v) => {
              five[k] = v;
            },
            0,
            40,
            0.5,
          ),
        );
      body.append(
        action(
          this.t("publish"),
          () =>
            this.publish(
              { en: `Box plot ${d.set}`, es: `Diagrama ${d.set}` },
              { type: "boxplot", desk: d.id, five: { ...five } },
              "box-plot",
            ),
          ".primary",
        ),
      );
    });
  }

  compareDesk(d) {
    this.openPanel(this.t("compareTitle"), (body) => {
      body.append(
        el("p.note", null, this.t("compareNote")),
        chips(
          [
            { label: this.t("north"), value: "north" },
            { label: this.t("south"), value: "south" },
          ],
          () => false,
          (o) =>
            this.publish(
              { en: `Front page: ${o.value}`, es: `Primera plana: ${o.value}` },
              { type: "compare", desk: d.id, pick: o.value },
              "compare-spread",
            ),
        ),
      );
    });
  }

  onEvent(e) {
    switch (e.type) {
      case "ask":
        this.audio.sfx("pickup");
        break;
      case "allData":
        this.audio.sfx("checkpoint");
        this.toast(
          this.t("objDesk", {
            desk: this.deskName(
              this.world.desks.find((d) => !d.done && d.kind !== "start") ||
                this.world.desks.at(-1),
            ),
          }),
        );
        break;
      case "trail":
        this.audio.sfx(e.n > 1 ? "discover" : "strain");
        break;
      case "refuse":
        this.say("ori", this.t(e.key), "thinking");
        break;
      case "outcome":
        if (e.ok && e.mechanic === "choose-measure" && !this.asked.outlier)
          this.later(3, () => this.askOnce("outlier"));
        if (e.ok && e.mechanic === "compare-spread" && !this.asked.spread)
          this.later(3, () => this.askOnce("spread"));
        break;
    }
  }

  askOnce(kind) {
    if (this.asked[kind] || this.mode !== "play") return;
    this.asked[kind] = true;
    const o = {
      outlier: {
        prompt: this.t("explainOutlier"),
        frames: [this.t("frameO1"), this.t("frameO2")],
        mechanic: "choose-measure",
      },
      spread: {
        prompt: this.t("explainSpread"),
        frames: [this.t("frameS1"), this.t("frameS2")],
        mechanic: "compare-spread",
      },
    }[kind];
    this.explain(o);
  }
}

define("ewl-data-chase", DataChase);
export { DataChase, LEVELS };
