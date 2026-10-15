// Turns a lesson's own config.json items (and its data/practice-studio file) into studio sections.
// Every question, answer, hint and Spanish line comes from the lesson or from its authored studio file —
// nothing is composed here, so a studio can never teach different mathematics than its lesson.
import { createHash } from "node:crypto";

const text = (/** @type {any} */ s) => (typeof s === "string" && s.trim() ? s.trim() : undefined);
const esArray = (/** @type {any} */ a, /** @type {number} */ n) =>
  Array.isArray(a) && a.length === n && a.every((x) => typeof x === "string") ? a : undefined;
const WORDS_OF_PICTURE =
  /\b(the (picture|diagram|graph|figure|image)|shown (above|below)|see (above|below)|in the (picture|diagram))\b/i;

/* ---- one authored config item -> a studio item, or [null, reason] ---------------------------- */
function mc(/** @type {any} */ q) {
  const a = q.correctIndex ?? q.answer;
  if (!text(q.stem) || !Array.isArray(q.choices) || q.choices.length < 2)
    return [null, "malformed"];
  if (!Number.isInteger(a) || a < 0 || a >= q.choices.length)
    return [null, "answer index out of range"];
  if (
    new Set(q.choices.map((/** @type {any} */ c) => String(c).trim().toLowerCase())).size !==
    q.choices.length
  )
    return [null, "duplicate choices"];
  if (q.diagram || WORDS_OF_PICTURE.test(q.stem)) return [null, "needs a figure"];
  const n = q.choices.length;
  return [
    {
      k: "mc",
      q: q.stem,
      qEs: text(q.stemEs),
      c: q.choices.map(String),
      cEs: esArray(q.choicesEs, n),
      a,
      x: text(q.explanation) || "",
      xEs: text(q.explanationEs),
      f:
        Array.isArray(q.choiceFeedback) && q.choiceFeedback.length === n
          ? q.choiceFeedback
          : undefined,
      fEs: esArray(q.choiceFeedbackEs, n),
      h: Array.isArray(q.hints) && q.hints.length ? q.hints : text(q.hint) ? [q.hint] : undefined,
      hEs: Array.isArray(q.hintsEs) ? q.hintsEs : undefined,
    },
    null,
  ];
}

function err(/** @type {any} */ q) {
  const w = q.workedExample;
  if (
    !Array.isArray(w) ||
    w.length < 2 ||
    !Number.isInteger(q.errorStep) ||
    q.errorStep < 0 ||
    q.errorStep >= w.length
  )
    return [null, "errorStep out of range"];
  if (!text(q.correctWork)) return [null, "no correction"];
  return [
    {
      k: "err",
      t: q.title || "Find the mistake",
      tEs: text(q.titleEs),
      s: w.map((/** @type {any} */ s) => ({
        l: String(s.label ?? ""),
        w: String(s.work ?? ""),
        lEs: text(s.labelEs),
        wEs: text(s.workEs),
      })),
      e: q.errorStep,
      fix: q.correctWork,
      fixEs: text(q.correctWorkEs),
      x: text(q.explanation) || "",
      xEs: text(q.explanationEs),
      h: Array.isArray(q.hints) ? q.hints : undefined,
    },
    null,
  ];
}

function tbl(/** @type {any} */ q) {
  if (
    !Array.isArray(q.headers) ||
    !Array.isArray(q.rows) ||
    !Array.isArray(q.editableCells) ||
    !q.editableCells.length
  )
    return fillColumns(q);
  const cells = [];
  for (const c of q.editableCells) {
    const row = q.rows[c.row];
    if (
      !row ||
      c.col < 0 ||
      c.col >= q.headers.length ||
      text(String(c.answer ?? "")) === undefined
    )
      return [null, "cell out of range"];
    if (String(row[c.col] ?? "").trim() !== "") return [null, "cell already filled"];
    cells.push({ r: c.row, c: c.col, a: String(c.answer) });
  }
  return [
    {
      k: "tbl",
      t: text(q.stem) || text(q.label) || "Fill in the table",
      tEs: text(q.stemEs) || text(q.labelEs),
      hd: q.headers.map(String),
      rows: q.rows.map((/** @type {any[]} */ r) => r.map(String)),
      cells,
      x: text(q.explanation) || "",
      xEs: text(q.explanationEs),
      h: Array.isArray(q.hints) ? q.hints : text(q.hint) ? [q.hint] : undefined,
    },
    null,
  ];
}

/** `columns` + `editableColumns` tables whose editable answers are short words ("Yes", "No", "12"). */
function fillColumns(/** @type {any} */ q) {
  if (
    !Array.isArray(q.columns) ||
    !Array.isArray(q.rows) ||
    !Array.isArray(q.editableColumns) ||
    !q.rows.length
  )
    return [null, "free-text table"];
  const keysOf = (/** @type {any} */ row) =>
    Object.keys(row).filter((k) => !(k.endsWith("Es") && k.slice(0, -2) in row));
  const keys = keysOf(q.rows[0]);
  if (keys.length !== q.columns.length) return [null, "free-text table"];
  const edit = q.editableColumns.map((/** @type {string} */ k) => keys.indexOf(k));
  if (edit.some((/** @type {number} */ i) => i < 0)) return [null, "free-text table"];
  const cells = [];
  for (let r = 0; r < q.rows.length; r++)
    for (const c of edit) {
      const a = String(q.rows[r][keys[c]] ?? "").trim();
      if (!a || a.length > 14) return [null, "free-text table"];
      cells.push({ r, c, a });
    }
  return [
    {
      k: "tbl",
      t: text(q.stem) || text(q.label) || "Fill in the table",
      tEs: text(q.stemEs) || text(q.labelEs),
      hd: q.columns.map(String),
      rows: q.rows.map((/** @type {any} */ row) =>
        keys.map((k, c) => (edit.includes(c) ? "" : String(row[k] ?? ""))),
      ),
      cells,
      x: text(q.explanation) || "",
      xEs: text(q.explanationEs),
      h: Array.isArray(q.hints) ? q.hints : text(q.hint) ? [q.hint] : undefined,
    },
    null,
  ];
}

function wr(/** @type {any} */ q) {
  const prompt = text(q.prompt) || text(q.stem);
  const model = text(q.explanation) || text(q.modelAnswer) || text(q.sampleAnswer);
  if (!prompt || !model) return [null, "no prompt or model answer"];
  return [
    {
      k: "wr",
      p: prompt,
      pEs: text(q.promptEs) || text(q.stemEs),
      fr: text(q.sentenceFrame),
      min: Number.isInteger(q.minLength) && q.minLength > 0 ? q.minLength : 40,
      kw: Array.isArray(q.keywords) ? q.keywords.map(String) : [],
      rubric: [
        "I answered the whole question.",
        "I used numbers or words from the problem.",
        "I explained why, not just what.",
      ],
      x: model,
      xEs: text(q.explanationEs),
      h: Array.isArray(q.hints) ? q.hints : text(q.hint) ? [q.hint] : undefined,
    },
    null,
  ];
}

/** drag-sort -> sort; a `matching` whose right-hand sides repeat is a sort in disguise. */
function sortFrom(/** @type {any} */ q) {
  if (!Array.isArray(q.categories) || q.categories.length < 2) return [null, "malformed"];
  const bins = q.categories.map((/** @type {any} */ c) => ({
    l: String(c.label),
    lEs: text(c.labelEs) || String(c.label),
  }));
  const cards = [];
  q.categories.forEach((/** @type {any} */ c, /** @type {number} */ b) =>
    (c.items || []).forEach((/** @type {string} */ t, /** @type {number} */ i) =>
      cards.push({ t: String(t), tEs: text((c.itemsEs || [])[i]), b }),
    ),
  );
  if (cards.length < 4 || cards.length > 8 || bins.some((_b, i) => !cards.some((c) => c.b === i)))
    return [null, "unsortable"];
  return [
    {
      k: "sort",
      q: text(q.instructions) || text(q.label) || "Sort each card.",
      qEs: text(q.instructionsEs) || text(q.labelEs) || "Ordena cada tarjeta.",
      bins,
      cards,
      x: text(q.explanation) || "",
      xEs: text(q.explanationEs),
      h: Array.isArray(q.hints) ? q.hints : text(q.hint) ? [q.hint] : undefined,
      hEs: Array.isArray(q.hintsEs) ? q.hintsEs : undefined,
    },
    null,
  ];
}

function matching(/** @type {any} */ q) {
  const pairs = (q.pairs || []).map((/** @type {any} */ p) => ({
    l: String(p.left ?? p.term ?? ""),
    r: String(p.right ?? p.match ?? ""),
    lEs: text(p.leftEs ?? p.termEs),
    rEs: text(p.rightEs ?? p.matchEs),
  }));
  if (pairs.length < 3 || pairs.some((/** @type {any} */ p) => !p.l || !p.r))
    return [null, "malformed"];
  const rights = new Set(pairs.map((/** @type {any} */ p) => p.r.toLowerCase()));
  if (rights.size !== pairs.length) {
    // right-hand sides repeat: the real task is sorting the left items into those groups
    const binNames = [...new Set(pairs.map((/** @type {any} */ p) => p.r))];
    if (binNames.length < 2 || pairs.length > 8) return [null, "unsortable"];
    const bins = binNames.map((n) => ({
      l: n,
      lEs: text(pairs.find((/** @type {any} */ p) => p.r === n).rEs) || n,
    }));
    return [
      {
        k: "sort",
        q: text(q.stem) || text(q.label) || "Sort each item into its group.",
        qEs: text(q.stemEs) || text(q.labelEs) || "Ordena cada elemento en su grupo.",
        bins,
        cards: pairs.map((/** @type {any} */ p) => ({
          t: p.l,
          tEs: p.lEs,
          b: binNames.indexOf(p.r),
        })),
        x: text(q.explanation) || "",
        xEs: text(q.explanationEs),
        h: Array.isArray(q.hints) ? q.hints : text(q.hint) ? [q.hint] : undefined,
        hEs: Array.isArray(q.hintsEs) ? q.hintsEs : undefined,
      },
      null,
    ];
  }
  if (pairs.length > 6) pairs.length = 6;
  return [
    {
      k: "match",
      q: text(q.stem) || text(q.label) || "Match each item with its partner.",
      qEs: text(q.stemEs) || text(q.labelEs) || "Empareja cada elemento con su pareja.",
      pairs,
      x: text(q.explanation) || "Each pair describes the same idea in two ways.",
      xEs: text(q.explanationEs),
      h: Array.isArray(q.hints)
        ? q.hints
        : text(q.hint)
          ? [q.hint]
          : ["Start with the pair you are surest about.", "Cross out matches as you use them."],
      hEs: Array.isArray(q.hintsEs) ? q.hintsEs : undefined,
    },
    null,
  ];
}

function numberLine(/** @type {any} */ q) {
  const t = Array.isArray(q.targets) ? q.targets : [];
  if (t.length !== 1 || !Number.isFinite(t[0].value) || !(q.min < q.max) || !(q.step > 0))
    return [null, "multi-target number line"];
  if (t[0].value < q.min || t[0].value > q.max) return [null, "target out of range"];
  return [
    {
      k: "nline",
      q: text(q.instructions) || text(q.label) || "Place the point on the number line.",
      qEs: text(q.instructionsEs) || text(q.labelEs),
      min: q.min,
      max: q.max,
      step: q.step,
      a: t[0].value,
      x: text(q.explanation) || "",
      xEs: text(q.explanationEs),
      h: Array.isArray(q.hints) && q.hints.length ? q.hints : text(q.hint) ? [q.hint] : undefined,
      hEs: Array.isArray(q.hintsEs) ? q.hintsEs : undefined,
    },
    null,
  ];
}

const CONVERT = /** @type {Record<string, (q: any) => any[]>} */ ({
  "multiple-choice": mc,
  "error-analysis": err,
  "fill-table": tbl,
  "open-response": wr,
  "drag-sort": sortFrom,
  matching,
  "matching-game": matching,
  "number-line": numberLine,
});

const num = (/** @type {any} */ x) => Number(x);
const niceStep = (/** @type {number} */ span) =>
  [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000].find((s) => span / s <= 12) || 1000;

/**
 * A lesson's Connect diagram as a Practice Studio figure, or null when no figure type draws it faithfully.
 * The Connect check questions refer to this picture ("the histogram", "Team B's box"); converting only the questions
 * left students looking for data that was not on the screen.
 */
export function diagramToViz(/** @type {any} */ d) {
  if (!d || typeof d !== "object") return null;
  const label = (/** @type {any} */ s) => (typeof s === "string" ? s : undefined);
  try {
    if (d.kind === "histogram" && Array.isArray(d.bars)) {
      const m = d.bars.map((/** @type {any} */ b) =>
        /^\s*(-?\d+(?:\.\d+)?)\s*[–-]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(String(b.label)),
      );
      if (m.some((x) => !x)) return null;
      const from = m.map((x) => num(x?.[1]));
      // intervals like 0–2, 3–5 cover whole numbers; draw the bars touching, as a histogram must
      const width = from.length > 1 ? from[1] - from[0] : num(m[0]?.[2]) - from[0] + 1;
      return {
        t: "hist",
        bins: d.bars.map((/** @type {any} */ b, /** @type {number} */ i) => ({
          from: from[i],
          to: i + 1 < from.length ? from[i + 1] : from[i] + width,
          n: num(b.value),
        })),
        ...(label(d.xLabel) ? { xlabel: d.xLabel } : {}),
        ...(label(d.yLabel) ? { ylabel: d.yLabel } : {}),
      };
    }
    if (d.kind === "dot-plot" && Array.isArray(d.values) && d.values.length) {
      const lo = Math.min(...d.values.map(num));
      const hi = Math.max(...d.values.map(num));
      const step = niceStep(hi - lo);
      return {
        t: "dots",
        data: d.values.map(num),
        min: Math.floor(lo / step) * step,
        max: Math.max(Math.ceil(hi / step) * step, Math.floor(lo / step) * step + step),
        step,
        ...(label(d.xLabel) ? { label: d.xLabel } : {}),
      };
    }
    if (
      d.kind === "box-plot" &&
      [d.min, d.q1, d.median, d.q3, d.max].every((x) => Number.isFinite(num(x)))
    ) {
      const lo = Number.isFinite(num(d.axisMin)) ? num(d.axisMin) : num(d.min);
      const hi = Number.isFinite(num(d.axisMax)) ? num(d.axisMax) : num(d.max);
      return {
        t: "box",
        min: num(d.min),
        q1: num(d.q1),
        med: num(d.median),
        q3: num(d.q3),
        max: num(d.max),
        scale: { min: lo, max: hi, step: niceStep(hi - lo) },
      };
    }
    if (d.kind === "bar-chart" && Array.isArray(d.bars) && d.bars.length) {
      return {
        t: "bars",
        labels: d.bars.map((/** @type {any} */ b) => String(b.label)),
        values: d.bars.map((/** @type {any} */ b) => num(b.value)),
        show: true,
        ...(label(d.yLabel) ? { ylabel: d.yLabel } : {}),
      };
    }
    if (d.kind === "tape-diagram" && Array.isArray(d.rows) && d.rows.length) {
      return {
        t: "tape",
        rows: d.rows.map((/** @type {any} */ r) => ({
          ...(label(r.label) ? { label: r.label } : {}),
          parts: (r.parts || []).map((/** @type {any} */ p) => ({
            v: num(p.value),
            l: String(p.label ?? p.value),
          })),
        })),
      };
    }
    if (d.kind === "number-line" && Array.isArray(d.points) && Number.isFinite(num(d.max))) {
      return {
        t: "nline",
        min: num(d.min),
        max: num(d.max),
        step: num(d.step) || niceStep(num(d.max) - num(d.min)),
        marks: d.points.map((/** @type {any} */ p) => ({
          v: num(p.value),
          l: String(p.label ?? p.value),
        })),
      };
    }
    if (d.kind === "coordinate-plane" && Array.isArray(d.points) && Number.isFinite(num(d.max))) {
      return {
        t: "coord",
        xmin: 0,
        xmax: num(d.max),
        ymin: 0,
        ymax: num(d.max),
        grid: true,
        points: d.points.map((/** @type {any} */ p) => ({
          x: num(p.x),
          y: num(p.y),
          l: label(p.label),
        })),
      };
    }
  } catch {
    return null;
  }
  return null;
}

/** Convert authored config items; report what stays in the lesson, and why. */
export function convert(/** @type {any[]} */ list, /** @type {Record<string, number>} */ left) {
  const out = [];
  for (const q of list || []) {
    const kind = q.type || "multiple-choice";
    const fn = CONVERT[kind];
    if (!fn) {
      left[kind] = (left[kind] || 0) + 1;
      continue;
    }
    const [item, why] = fn(q);
    if (item) out.push(item);
    else left[`${kind} (${why})`] = (left[`${kind} (${why})`] || 0) + 1;
  }
  return out;
}

/** A short stable id from an item's own content, so reordering a section never moves a child's progress. */
export function contentId(/** @type {any} */ it, /** @type {Set<string>} */ used) {
  const basis = JSON.stringify([
    it.k,
    it.q || it.t || it.p,
    it.c || it.a || it.s || it.cards || it.pairs || "",
  ]);
  let id = `h${createHash("sha1").update(basis).digest("hex").slice(0, 8)}`;
  let n = 1;
  while (used.has(id)) id = `${id.slice(0, 9)}${n++}`;
  used.add(id);
  return id;
}

/**
 * The ten sections of a lesson (five Practice, five Challenge) as { practice, challenge }.
 * `ld` is data/practice-studio/<id>.json; `worlds` is data/practice-studio/worlds.json.
 */
export function buildSections(
  /** @type {any} */ cfg,
  /** @type {any} */ ld,
  /** @type {any} */ worlds,
  /** @type {string} */ id,
) {
  const left = /** @type {Record<string, number>} */ ({});
  const p = cfg.practice || {};
  const connect = Array.isArray(cfg.connect?.check)
    ? cfg.connect.check
    : cfg.connect?.check
      ? [cfg.connect.check]
      : [];
  const exit = cfg.reflect?.exitTicket ? [cfg.reflect.exitTicket] : [];
  const world = worlds.worlds[worlds.lessons[id]];
  const used = new Set();
  const stamp = (/** @type {any[]} */ list, /** @type {number} */ tab) =>
    list.map((it, i) =>
      it.k === "gen" || it.k === "act" || it.k === "pool"
        ? { ...it, id: `t${tab}i${i + 1}` }
        : { ...it, id: contentId(it, used) },
    );

  const spare = convert(p.optional, left);
  const l2 = convert(p.onLevel, left);
  while (l2.length < 3 && spare.length) l2.push(spare.shift());
  const getReady = ld.getReady ?? convert(cfg.warmup?.questions, left);
  // The Connect questions refer to the Connect scenario and picture; carry both with them.
  const scenario = cfg.connect?.scenario;
  // Only figures that show what the problem GIVES. A bar chart, tape or number line in a Connect section usually shows the
  // worked result (the 7,776 and 3,024 in 5-5 are the answers), so attaching it to the question would hand over the answer.
  const GIVEN = new Set(["histogram", "dot-plot", "box-plot", "coordinate-plane"]);
  const picture = GIVEN.has(cfg.connect?.diagram?.kind) ? diagramToViz(cfg.connect.diagram) : null;
  const connected = convert(connect, left).map((it) => ({
    ...it,
    ...(scenario && !it.ctx
      ? { ctx: scenario, ...(cfg.connect.scenarioEs ? { ctxEs: cfg.connect.scenarioEs } : {}) }
      : {}),
    ...(picture && !it.viz ? { viz: picture } : {}),
  }));
  const mastery = [...connected, ...convert(exit, left), ...(ld.mastery || [])];

  const fresh = Array.isArray(ld.fresh)
    ? { items: ld.fresh }
    : { items: Array.from({ length: ld.fresh.slots }, () => ({ k: "pool" })), pool: ld.fresh.pool };
  const climb = Array.isArray(ld.challenge.climb)
    ? { items: ld.challenge.climb }
    : {
        items: Array.from({ length: ld.challenge.climb.slots }, () => ({ k: "pool" })),
        pool: ld.challenge.climb.pool,
      };
  const stretch = convert(p.extending, left).slice(0, 3);

  const lists = {
    practice: [
      { items: getReady.slice(0, 4) },
      { items: convert(p.approaching, left).slice(0, 8) },
      { items: l2.slice(0, 8) },
      fresh,
      { items: mastery.slice(0, 10) },
    ],
    challenge: [
      climb,
      { items: [...stretch, ...ld.challenge.missions] },
      { items: ld.challenge.lab },
      { items: ld.challenge.detective },
      { items: ld.challenge.boss, conf: true },
    ],
  };
  const out = {};
  for (const mode of /** @type {const} */ (["practice", "challenge"])) {
    out[mode] = lists[mode].map((sec, i) => {
      const g = worlds.generic[mode][i];
      const nm = world.sections[mode][i];
      const items = stamp(sec.items, i + 1);
      return {
        name: nm.n,
        nameEs: nm.nEs,
        desc: g.d,
        descEs: g.dEs,
        h: g.h,
        hEs: g.hEs,
        p: g.p,
        pEs: g.pEs,
        ...(sec.conf ? { conf: true } : {}),
        items,
        ...(sec.pool ? { pool: stamp(sec.pool, i + 1) } : {}),
      };
    });
  }
  return { sections: out, left };
}
