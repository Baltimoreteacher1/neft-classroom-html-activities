// Adaptive placement (Enterprise 8): a short, low-anxiety starting-point check, interpretable end to end.
// It keeps a simple belief per skill ("how likely is this known?"), asks about the most informative skill next, follows
// a miss down the prerequisite graph, lets a correct answer vouch for the skills beneath it, and treats "I'm not sure"
// as information rather than a wrong answer. It recommends a short path, never "the whole grade". The model is a transparent
// heuristic built from observed responses; it has not been psychometrically validated and does not claim to be.
import {
  buildGraph,
  directPrerequisites,
  diagnosticItems,
  prerequisiteClosure,
} from "./knowledge-graph.js";

const clamp = (x) => Math.min(0.97, Math.max(0.03, x));
const KNOWN = 0.75;
const GAP = 0.35;

export class AdaptivePlacement {
  constructor({ grade, seed = 1, maxItems = 10 }) {
    this.grade = Number(grade);
    this.seed = seed;
    this.maxItems = maxItems;
    const { nodes, order } = buildGraph();
    this.nodes = nodes;
    this.order = order;
    // Candidate skills: this grade plus everything it depends on, within three grades below.
    const pool = new Set();
    for (const n of nodes.values())
      if (n.grade === this.grade) {
        pool.add(n.key);
        for (const p of prerequisiteClosure(n.key))
          if (nodes.get(p).grade >= this.grade - 3) pool.add(p);
      }
    this.pool = [...pool];
    this.p = {};
    for (const key of this.pool)
      this.p[key] = nodes.get(key).grade === this.grade ? 0.5 : 0.7;
    this.asked = {};
    this.history = [];
    this.retest = [];
    this.focus = [];
    this.current = null;
    this.misconceptions = [];
  }

  get done() {
    return this.history.length >= this.maxItems || !this.pickKey();
  }

  uncertainty(key) {
    return this.p[key] * (1 - this.p[key]);
  }

  pickKey() {
    if (this.retest.length) return this.retest[0];
    const domainsSeen = new Set(
      this.history.map((h) => this.nodes.get(h.key).domain),
    );
    let best = null;
    let bestScore = 0.12; // below this the skill is already decided one way or the other
    for (const key of this.pool) {
      const asked = this.asked[key] || 0;
      if (asked >= 2) continue;
      if (asked === 1 && !this.retest.includes(key)) continue;
      const node = this.nodes.get(key);
      let score = this.uncertainty(key);
      if (!domainsSeen.has(node.domain)) score += 0.06; // sample varied mathematics
      if (this.focus.includes(key)) score += 0.2; // a prerequisite of something just missed
      if (node.grade === this.grade) score += 0.01;
      score -= (this.order.indexOf(key) / this.order.length) * 0.0001; // stable tie-break
      if (score > bestScore) {
        bestScore = score;
        best = key;
      }
    }
    return best;
  }

  next() {
    if (this.history.length >= this.maxItems) return null;
    const key = this.pickKey();
    if (!key) return null;
    const retest = this.retest[0] === key;
    const level = this.p[key] < 0.3 ? 0 : 1;
    const attempt = this.asked[key] || 0;
    const [item] = diagnosticItems(key, {
      level,
      count: 1,
      seed: this.seed + this.history.length * 17 + attempt * 101,
    });
    if (!item) {
      this.asked[key] = 2;
      this.retest = this.retest.filter((k) => k !== key);
      return this.next();
    }
    this.current = { key, level, item, retest };
    return {
      key,
      title: this.nodes.get(key).title,
      level,
      problem: item,
      retest,
    };
  }

  // outcome: { correct }, { unsure: true }, or { correct: false, analysis } where analysis comes from analyzeResponse.
  answer(outcome) {
    const cur = this.current;
    if (!cur) throw new Error("Ask for next() first");
    const { key } = cur;
    this.asked[key] = (this.asked[key] || 0) + 1;
    this.retest = this.retest.filter((k) => k !== key);
    this.focus = this.focus.filter((k) => k !== key);
    this.history.push({
      key,
      correct: Boolean(outcome.correct),
      unsure: Boolean(outcome.unsure),
      category: outcome.analysis?.category || null,
    });
    if (outcome.unsure) {
      // Not sure is neither right nor wrong: it lowers confidence a little and the skill is simply not credited.
      this.p[key] = clamp(this.p[key] * 0.7);
    } else if (outcome.correct) {
      this.p[key] = clamp(this.p[key] + 0.45 * (1 - this.p[key]));
      // Being able to do this skill makes its foundations more likely known, less so the further down they are.
      let depth = 0.5;
      let layer = directPrerequisites(key);
      const seen = new Set();
      while (layer.length && depth > 0.1) {
        for (const pre of layer)
          if (this.p[pre] !== undefined && !seen.has(pre)) {
            seen.add(pre);
            this.p[pre] = clamp(this.p[pre] + depth * (1 - this.p[pre]) * 0.6);
          }
        layer = layer.flatMap(directPrerequisites);
        depth /= 2;
      }
    } else {
      const cat = outcome.analysis?.category;
      if (cat === "calculation" && (this.asked[key] || 0) < 2) {
        // A near miss: ask a fresh problem on the same skill before deciding it is not known.
        this.p[key] = clamp(this.p[key] * 0.6);
        this.retest.push(key);
      } else if ((cat === "misread" || cat === "uncertain" || !cat) && (this.asked[key] || 0) < 2) {
        // A miss whose cause is unclear (or a misread) is asked once more with a fresh problem before it counts against the skill.
        this.p[key] = clamp(this.p[key] * 0.8);
        this.retest.push(key);
      } else {
        this.p[key] = clamp(this.p[key] * 0.3);
        if (cat === "conceptual" && outcome.analysis?.id)
          this.misconceptions.push(outcome.analysis.id);
        // Follow the miss down: its foundations become uncertain and are asked about next.
        for (const pre of directPrerequisites(key))
          if (this.p[pre] !== undefined) {
            this.p[pre] = clamp(Math.min(this.p[pre], 0.5));
            this.focus.push(pre);
          }
      }
    }
    this.current = null;
    return { remaining: Math.max(0, this.maxItems - this.history.length) };
  }

  result() {
    const known = this.pool
      .filter((k) => this.p[k] >= KNOWN && (this.asked[k] || this.p[k] > 0.8))
      .sort((a, b) => this.order.indexOf(a) - this.order.indexOf(b));
    const gaps = this.pool
      .filter((k) => this.p[k] <= GAP)
      .sort((a, b) => this.order.indexOf(a) - this.order.indexOf(b));
    const isKnown = (k) => this.p[k] >= KNOWN;
    // The path starts at the frontier: gaps whose own foundations are known, then this grade's unknown skills whose foundations are known.
    const frontier = (list) =>
      list.filter((k) =>
        directPrerequisites(k).every(
          (pre) =>
            this.p[pre] === undefined || isKnown(pre) || this.p[pre] > GAP,
        ),
      );
    const gapStart = frontier(gaps);
    const gradeNew = frontier(
      this.pool.filter(
        (k) =>
          this.nodes.get(k).grade === this.grade &&
          !isKnown(k) &&
          !gaps.includes(k),
      ),
    ).sort((a, b) => this.order.indexOf(a) - this.order.indexOf(b));
    const path = [...gapStart, ...gradeNew].slice(0, 6);
    const t = (k) => this.nodes.get(k).title;
    const strong = known
      .filter((k) => this.nodes.get(k).grade === this.grade)
      .slice(0, 3);
    const en = [];
    const es = [];
    if (strong.length) {
      en.push(`You did well on ${strong.map(t).join(", ")}.`);
      es.push(`Te fue bien en ${strong.map(t).join(", ")}.`);
    }
    const first = gapStart.slice(0, 2);
    if (first.length) {
      en.push(
        `Let's start with ${first.map(t).join(" and ")} to make the next ideas easier.`,
      );
      es.push(
        `Empecemos con ${first.map(t).join(" y ")} para que las siguientes ideas sean más fáciles.`,
      );
    } else if (path.length) {
      en.push(
        `You are ready to start with ${path.slice(0, 2).map(t).join(" and ")}.`,
      );
      es.push(
        `Estás listo para empezar con ${path.slice(0, 2).map(t).join(" y ")}.`,
      );
    }
    if (!path.length) {
      en.push("You are ready for challenges.");
      es.push("Estás listo para los desafíos.");
    }
    const answered = this.history.length;
    return {
      grade: this.grade,
      known,
      gaps,
      path,
      misconceptions: [...new Set(this.misconceptions)],
      items: answered,
      unsure: this.history.filter((h) => h.unsure).length,
      // Honest about confidence: few answers on a skill is a rough guide, and the report says so.
      confidence: answered >= 8 ? "moderate" : "rough",
      explanation: {
        en: `${en.join(" ")} This is a starting point, not a grade level.`,
        es: `${es.join(" ")} Esto es un punto de partida, no un nivel de grado.`,
      },
    };
  }
}

export const PLACEMENT_THRESHOLDS = { KNOWN, GAP };
