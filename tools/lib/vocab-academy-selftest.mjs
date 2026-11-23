// Vocabulary Academy validator — self-tests. Every detector is proven against a bad fixture derived from
// the reference unit by mutation BEFORE the real sweep, and the untouched reference unit must pass.
// A detector that stops firing makes the gate report clean content; this is what stops that.
import { PLAN, unitId, wordIdOf } from "../../access-practice-lab/src/vocab-academy/contract.js";
import { checkUnit } from "./vocab-academy-schema.mjs";
import { checkCorpus, checkGrade } from "./vocab-academy-scope.mjs";

const clone = (x) => JSON.parse(JSON.stringify(x));
const codes = (r) => new Set(r.issues.map((i) => `${i.sev}:${i.code}`));
const hasCode = (r, code, sev) => r.issues.some((i) => i.code === code && (!sev || i.sev === sev));

/** Unit-level mutations: [name, expected code, expected severity, mutate(unit) -> ctx|void]. */
const UNIT_CASES = [
  [
    "definition uses the headword",
    "def-headword",
    "ERROR",
    (u) => {
      u.words[0].def = "Being cautious about danger and mistakes.";
    },
  ],
  [
    "definition uses a family form",
    "def-headword",
    "ERROR",
    (u) => {
      u.words[0].def = "Acting with great caution near danger.";
    },
  ],
  [
    "definition too long for the band",
    "def-long",
    "ERROR",
    (u) => {
      u.words[1].def =
        "Unwilling to do something because you are not sure that it is a good idea and you would rather wait and think about it for a very long time.";
    },
  ],
  [
    "ex does not use the word",
    "ex-form",
    "ERROR",
    (u) => {
      u.words[0].ex = "The hiker tested each rock before putting her weight on it.";
    },
  ],
  [
    "ex equals ex2",
    "ex-same",
    "ERROR",
    (u) => {
      u.words[0].ex2 = u.words[0].ex;
    },
  ],
  [
    "cloze has no blank",
    "cloze-blank",
    "ERROR",
    (u) => {
      u.words[0].cloze.s = "The cautious driver slowed to a crawl.";
    },
  ],
  [
    "cloze has two blanks",
    "cloze-blank",
    "ERROR",
    (u) => {
      u.words[0].cloze.s = "The ___ driver was ___ on the ice.";
    },
  ],
  [
    "cloze.f is not a form of the word",
    "cloze-form",
    "ERROR",
    (u) => {
      u.words[0].cloze.f = "banana";
    },
  ],
  [
    "cloze equals cloze2",
    "cloze-same",
    "ERROR",
    (u) => {
      u.words[0].cloze2 = clone(u.words[0].cloze);
    },
  ],
  [
    "filled cloze equals ex",
    "cloze-is-example",
    "ERROR",
    (u) => {
      u.words[0].cloze = { s: u.words[0].ex.replace("cautious", "___"), f: "cautious" };
    },
  ],
  [
    "cloze leaks the headword",
    "cloze-leak",
    "ERROR",
    (u) => {
      u.words[0].cloze.s = "The cautious ___ driver slowed on the ice.";
    },
  ],
  [
    "misuse does not use the word",
    "misuse-form",
    "ERROR",
    (u) => {
      u.words[0].misuse.s = "The climber ignored every warning sign.";
    },
  ],
  [
    "synonym contains the headword",
    "syn-headword",
    "ERROR",
    (u) => {
      u.words[0].syn = ["careful", "cautious"];
    },
  ],
  [
    "ant present but empty",
    "ant-empty",
    "ERROR",
    (u) => {
      u.words[0].ant = [];
    },
  ],
  [
    "antonym equals a synonym",
    "ant-is-syn",
    "ERROR",
    (u) => {
      u.words[0].ant = [u.words[0].syn[0]];
    },
  ],
  [
    "family entry equals the headword",
    "family-headword",
    "ERROR",
    (u) => {
      u.words[0].family.push({ w: "cautious", pos: "adj" });
    },
  ],
  [
    "morph segments do not spell the word",
    "morph-spelling",
    "ERROR",
    (u) => {
      u.words[0].morph.segs[0].s = "cartoon";
    },
  ],
  [
    "morph segment type invalid",
    "morph-seg-type",
    "ERROR",
    (u) => {
      u.words[0].morph.segs[0].t = "stem";
    },
  ],
  [
    "morph part missing from morphology.json (warn)",
    "morph-unknown-part",
    "WARN",
    () => ({ morphForms: new Set(["ful"]) }),
  ],
  [
    "morph part missing from morphology.json (strict)",
    "morph-unknown-part",
    "ERROR",
    () => ({ morphForms: new Set(["ful"]), strictMorph: true }),
  ],
  [
    "passage too short",
    "passage-length",
    "ERROR",
    (u) => {
      u.passage.paras = [u.passage.paras[0]];
    },
  ],
  [
    "passage.words id not in unit",
    "passage-words",
    "ERROR",
    (u) => {
      u.passage.words.push("va.nonsense.adj");
    },
  ],
  [
    "target words missing from passage and unflagged",
    "passage-coverage",
    "ERROR",
    (u) => {
      u.passage.paras = [
        u.passage.paras
          .join(" ")
          .replace(
            /reluctant|cautious|impulsive|sincere|perceptive|persistent|tactful|skeptical|candid|humble/g,
            "careful",
          ),
      ];
      u.editorial.needsReview = [];
    },
  ],
  [
    "question has two choices",
    "q-choices",
    "ERROR",
    (u) => {
      u.passage.qs[0].choices = u.passage.qs[0].choices.slice(0, 2);
      u.passage.qs[0].a = 0;
    },
  ],
  [
    "answer index out of range",
    "q-answer-range",
    "ERROR",
    (u) => {
      u.passage.qs[0].a = 9;
    },
  ],
  [
    "duplicate choices",
    "q-dup-choice",
    "ERROR",
    (u) => {
      u.passage.qs[1].choices[0] = u.passage.qs[1].choices[1];
    },
  ],
  [
    "answer trivially equals a distractor",
    "q-answer-trivial",
    "ERROR",
    (u) => {
      u.passage.qs[1].choices[2] = "She has noticed that he acts quickly without thinking first";
      u.passage.qs[1].choices[0] = "She has noticed that he acts quickly without thinking at first";
      u.passage.qs[1].a = 0;
    },
  ],
  [
    "question why empty",
    "q-why",
    "ERROR",
    (u) => {
      u.passage.qs[2].why = " ";
    },
  ],
  [
    "word-meaning question names no target word",
    "q-word-meaning",
    "ERROR",
    (u) => {
      u.passage.qs[0].q = "In paragraph 1, the underlined word most nearly means";
    },
  ],
  [
    "all answers in the same position (warn)",
    "q-answer-balance",
    "WARN",
    (u) => {
      for (const q of u.passage.qs) q.a = 0;
    },
  ],
  [
    "analogy answer not in choices",
    "analogy",
    "ERROR",
    (u) => {
      u.relations.analogies[0].a = "not a choice";
    },
  ],
  [
    "relation group id not in unit",
    "relations-ids",
    "ERROR",
    (u) => {
      u.relations.groups[0].ids.push("va.ghost.adj");
    },
  ],
  [
    "word in no group (warn)",
    "relations-ungrouped",
    "WARN",
    (u) => {
      u.relations.groups[2].ids = [u.relations.groups[2].ids[0]];
    },
  ],
  [
    "morphology unit without study parts",
    "study-parts",
    "ERROR",
    (u) => {
      u.strand = "morphology";
      u.study.parts = [];
    },
  ],
  [
    "teacher note missing for a word",
    "teacher-notes",
    "ERROR",
    (u) => {
      delete u.teacher.notes[u.words[3].id];
    },
  ],
  [
    "teacher note key not a word",
    "teacher-notes",
    "ERROR",
    (u) => {
      u.teacher.notes["va.ghost.adj"] = "x note";
    },
  ],
  [
    "unit 2 with empty review",
    "review",
    "ERROR",
    (u) => {
      u.n = 2;
      u.id = "g6-u02";
      u.review = [];
    },
  ],
  [
    "constructed task wordId unknown",
    "check-ids",
    "ERROR",
    (u) => {
      u.check.constructed[0].wordIds.push("va.ghost.adj");
    },
  ],
  [
    "produce missing",
    "produce",
    "ERROR",
    (u) => {
      delete u.produce;
    },
  ],
  [
    "wida frames fewer than 3",
    "wida",
    "ERROR",
    (u) => {
      u.wida.frames = u.wida.frames.slice(0, 2);
    },
  ],
  [
    "editorial status missing",
    "editorial",
    "ERROR",
    (u) => {
      delete u.editorial.status;
    },
  ],
  [
    "word id does not match hw+pos",
    "id-format",
    "ERROR",
    (u) => {
      u.words[0].id = "va.cautiousx.adj";
    },
  ],
  [
    "required word field missing",
    "word-fields",
    "ERROR",
    (u) => {
      delete u.words[2].cloze2;
    },
  ],
  [
    "pos enum invalid",
    "word-enum",
    "ERROR",
    (u) => {
      u.words[0].pos = "adjective";
    },
  ],
  [
    "placeholder text",
    "placeholder",
    "ERROR",
    (u) => {
      u.words[1].apps.spoken = "TODO write a spoken example.";
    },
  ],
  [
    "ellipsis placeholder",
    "placeholder",
    "ERROR",
    (u) => {
      u.words[1].nonExample = "Doing it without thinking... is not reluctant.";
    },
  ],
  [
    "empty string",
    "empty-string",
    "ERROR",
    (u) => {
      u.words[1].rel = "";
    },
  ],
  [
    "mojibake",
    "mojibake",
    "ERROR",
    (u) => {
      u.words[1].es.gloss = "reacio Ã¡";
    },
  ],
  [
    "double space",
    "double-space",
    "ERROR",
    (u) => {
      u.words[1].ex = u.words[1].ex.replace(" ", "  ");
    },
  ],
  [
    "sentence starts lowercase",
    "sentence-shape",
    "ERROR",
    (u) => {
      u.words[1].ex2 = u.words[1].ex2.replace(/^./, (c) => c.toLowerCase());
    },
  ],
  [
    "sentence lacks terminal punctuation",
    "sentence-shape",
    "ERROR",
    (u) => {
      u.words[1].ex = u.words[1].ex.replace(/\.$/, "");
    },
  ],
  [
    "Spanish gloss empty",
    "es-gloss",
    "ERROR",
    (u) => {
      u.words[0].es.gloss = "";
    },
  ],
  [
    "too many glyphs",
    "visual",
    "ERROR",
    (u) => {
      u.words[0].visual.glyphs = ["🧗", "⚠️", "⛰️", "🪢"];
    },
  ],
  [
    "visual alt empty",
    "visual",
    "ERROR",
    (u) => {
      u.words[0].visual.alt = "";
    },
  ],
  [
    "duplicate sentence within the unit",
    "dup-sentence",
    "ERROR",
    (u) => {
      u.words[1].ex2 = u.words[0].ex;
    },
  ],
  [
    "K example too long",
    "ex-long",
    "ERROR",
    (u) => {
      u.grade = "K";
      u.id = "gK-u01";
      u.words[0].ex =
        "The cautious hiker tested every single rock very slowly before she put her whole weight on it.";
    },
  ],
  [
    "K passage not listen-only",
    "passage-fields",
    "ERROR",
    (u) => {
      u.grade = "K";
      u.id = "gK-u01";
      u.passage.listenOnly = false;
    },
  ],
  [
    "readability far above grade (warn)",
    "readability",
    "WARN",
    (u) => {
      u.grade = "1";
      u.id = "g1-u01";
    },
  ],
  [
    "URL in content",
    "safety-string",
    "ERROR",
    (u) => {
      u.teacher.overview += " See https://example.com for more.";
    },
  ],
  [
    "email address in content",
    "safety-string",
    "ERROR",
    (u) => {
      u.teacher.overview += " Write to someone@example.org.";
    },
  ],
  [
    "editorial status invalid",
    "editorial",
    "ERROR",
    (u) => {
      u.editorial.status = "approved";
    },
  ],
  [
    "human-reviewed claimed without a log (warn)",
    "editorial",
    "WARN",
    (u) => {
      u.editorial.status = "human-reviewed";
    },
  ],
  [
    "grade 3 passage over 260 words",
    "passage-length",
    "ERROR",
    (u) => {
      u.grade = "3";
      u.id = "g3-u01";
      u.passage.paras = [...u.passage.paras, ...u.passage.paras];
    },
  ],
  [
    "K morph outside the K-2 part list (warn)",
    "morph-k2-scope",
    "WARN",
    (u) => {
      u.grade = "K";
      u.id = "gK-u01";
      u.words[0].morph.segs[1].s = "-ous";
    },
  ],
  [
    "passage id not prefixed by the unit id",
    "passage-fields",
    "ERROR",
    (u) => {
      u.passage.id = "other-p1";
    },
  ],
  [
    "constructed task missing prompt",
    "check",
    "ERROR",
    (u) => {
      delete u.check.constructed[0].prompt;
    },
  ],
  [
    "analogy with a duplicated choice",
    "analogy",
    "ERROR",
    (u) => {
      u.relations.analogies[0].choices[1] = u.relations.analogies[0].choices[0];
    },
  ],
  [
    "shade ladder too short",
    "relations",
    "ERROR",
    (u) => {
      u.relations.shades = [{ label: "x", ladder: ["a", "b"] }];
    },
  ],
  [
    "unit 1 review lists own word (error)",
    "review",
    "ERROR",
    (u) => {
      u.review = [u.words[0].id];
    },
  ],
  [
    "frame without a blank",
    "frame-blank",
    "ERROR",
    (u) => {
      u.words[0].frame = "I am careful.";
    },
  ],
  ["unit not an object", "unit-schema", "ERROR", () => ({ __replace: "not-an-object" })],
  [
    "pron missing stress capitals",
    "pron",
    "ERROR",
    (u) => {
      u.words[0].pron = "kaw-shus";
    },
  ],
];

/** A synthetic but PLAN-conformant grade.json for corpus/grade fixtures. */
export function synthGrade(g, refWords = null) {
  const plan = PLAN[g];
  const units = [];
  for (let n = 1; n <= plan.units; n++) {
    const words = [];
    for (let i = 0; i < plan.words; i++) {
      const hw =
        n === 1 && refWords?.[i]
          ? refWords[i].hw
          : `zq${String.fromCharCode(97 + (n % 26))}${String.fromCharCode(97 + i)}${String.fromCharCode(97 + ((n * 7 + i) % 26))}`;
      words.push({
        hw,
        pos: n === 1 && refWords?.[i] ? refWords[i].pos : "n",
        tier: "tier2",
        cats: [],
      });
    }
    units.push({
      id: unitId(g, n),
      n,
      title: `Unit ${n}`,
      theme: "Theme",
      strand: "thematic",
      morphFocus: "none",
      words,
      reviewFrom:
        n === 1
          ? []
          : [
              `${units[0].words[0].hw}/${units[0].words[0].pos}`,
              `${units[0].words[1].hw}/${units[0].words[1].pos}`,
            ],
      why: "Because.",
    });
  }
  return {
    schema: 1,
    grade: g,
    band: ["K", "1", "2"].includes(g)
      ? "K-2"
      : ["3", "4", "5"].includes(g)
        ? "3-5"
        : ["6", "7", "8"].includes(g)
          ? "6-8"
          : "9-12",
    focus: "f",
    selection: "s",
    arc: units.map((u) => u.title),
    units,
  };
}

/** Re-home a reference clone as another unit/grade; `distinct` makes every sentence unique. */
function variant(ref, g, n, tag, distinct = true) {
  const u = clone(ref);
  u.grade = g;
  u.n = n;
  u.id = unitId(g, n);
  u.passage.id = `${u.id}-p1`;
  u.passage.qs.forEach((q, i) => {
    q.id = `${u.id}-p1-q${i + 1}`;
  });
  u.check.constructed.forEach((c, i) => {
    c.id = `${u.id}-c${i + 1}`;
  });
  for (const w of u.words) {
    w.hw = `${w.hw}${tag}`;
    w.id = wordIdOf(w.hw, w.pos);
    if (distinct) for (const f of ["ex", "ex2", "nonExample"]) w[f] = `${w[f]} ${tag}`;
    if (distinct) {
      w.cloze.s += ` ${tag}`;
      w.cloze2.s += ` ${tag}`;
      w.misuse.s += ` ${tag}`;
      for (const k of Object.keys(w.apps)) w.apps[k] += ` ${tag}`;
    }
  }
  if (distinct)
    u.passage.paras = Array.from(
      { length: 8 },
      (_, i) =>
        `Paragraph ${tag}${i} walks quietly toward ${tag}${i}1 river${i} and ${tag}${i}2 meadow${i} slowly today.`,
    );
  return u;
}
const asEntry = (u, g, nn) => ({ file: `x/${u.id}.json`, g, nn, data: u, info: checkUnit(u).info });

/** @returns {{ name: string, ok: boolean, detail?: string }[]} */
export function runSelfTests(ref) {
  const out = [];
  const t = (name, ok, detail) => out.push({ name, ok: !!ok, detail });

  const base = checkUnit(clone(ref));
  const baseErrs = base.issues.filter((i) => i.sev === "ERROR");
  t(
    "reference unit has no errors",
    baseErrs.length === 0,
    baseErrs
      .slice(0, 5)
      .map((i) => `${i.code}: ${i.loc} ${i.msg}`)
      .join(" | "),
  );
  t(
    "reference unit has no warnings",
    base.issues.length === baseErrs.length,
    base.issues
      .filter((i) => i.sev === "WARN")
      .slice(0, 3)
      .map((i) => `${i.code}: ${i.msg}`)
      .join(" | "),
  );

  for (const [name, code, sev, mut] of UNIT_CASES) {
    let u = clone(ref);
    const ctx = mut(u) || {};
    if (ctx.__replace !== undefined) u = ctx.__replace;
    if (ctx.fk === undefined && code === "readability") ctx.fk = () => 14;
    const r = checkUnit(u, ctx);
    t(
      `detects: ${name}`,
      hasCode(r, code, sev),
      `expected ${sev}:${code}, got ${[...codes(r)].join(" ") || "nothing"}`,
    );
  }

  // grade.json fixtures
  const refWords = ref.words.map((w) => ({ hw: w.hw, pos: w.pos }));
  const g6 = synthGrade("6", refWords);
  const gIssues = (g) => checkGrade("6", g, "x/grade.json");
  t(
    "synthetic grade.json passes",
    gIssues(g6).filter((i) => i.sev === "ERROR").length === 0,
    gIssues(g6)
      .slice(0, 3)
      .map((i) => i.msg)
      .join(" | "),
  );
  const gCase = (name, code, mut) => {
    const g = clone(g6);
    mut(g);
    t(
      `detects (grade): ${name}`,
      gIssues(g).some((i) => i.code === code && i.sev === "ERROR"),
    );
  };
  gCase("wrong unit count", "grade-count", (g) => g.units.pop());
  gCase("wrong word count", "grade-count", (g) => g.units[2].words.pop());
  gCase("arc length differs", "grade-arc", (g) => g.arc.pop());
  gCase("non-sequential ids", "grade-ids", (g) => {
    g.units[3].id = "g6-u09";
  });
  gCase("duplicate headword in a grade", "grade-dup", (g) => {
    g.units[4].words[0] = { ...g.units[1].words[0] };
  });
  gCase("bad enum", "grade-enum", (g) => {
    g.units[0].words[0].tier = "tier9";
  });
  gCase("reviewFrom not hw/pos", "grade-review", (g) => {
    g.units[2].reviewFrom = ["g6-u01 none"];
  });
  gCase("units after the first need review", "grade-review", (g) => {
    g.units[5].reviewFrom = [];
  });

  // corpus fixtures
  const grades = new Map([["6", { file: "x/g6/grade.json", data: g6 }]]);
  const u1 = asEntry(clone(ref), "6", 1);
  const corpus = (units, gs = grades, opts) => checkCorpus(units, gs, opts);
  const cErr = (is, code) => is.some((i) => i.code === code && i.sev === "ERROR");
  const base1 = corpus([u1]);
  t(
    "reference unit passes the corpus checks",
    base1.filter((i) => i.sev === "ERROR").length === 0,
    base1
      .filter((i) => i.sev === "ERROR")
      .slice(0, 3)
      .map((i) => `${i.code}: ${i.msg}`)
      .join(" | "),
  );

  const v2 = variant(ref, "6", 2, "qa");
  v2.review = [ref.words[0].id, ref.words[1].id];
  const u2 = asEntry(v2, "6", 2);
  // give u2 scope words that match
  const g6b = clone(g6);
  g6b.units[1].words = v2.words.map((w) => ({ hw: w.hw, pos: w.pos, tier: w.tier, cats: [] }));
  const gradesB = new Map([["6", { file: "x/g6/grade.json", data: g6b }]]);
  const ok2 = corpus([u1, u2], gradesB);
  t(
    "two distinct units pass the corpus checks",
    ok2.filter((i) => i.sev === "ERROR").length === 0,
    ok2
      .filter((i) => i.sev === "ERROR")
      .slice(0, 3)
      .map((i) => `${i.code}: ${i.msg}`)
      .join(" | "),
  );

  const dupWords = asEntry({ ...clone(v2), words: clone(ref.words) }, "6", 2);
  const dupRes = corpus([u1, dupWords], gradesB);
  t("detects (corpus): duplicate word id", cErr(dupRes, "dup-word-id"));
  t("detects (corpus): duplicate headword+pos", cErr(dupRes, "dup-headword"));

  const fwd = clone(ref);
  fwd.review = [v2.words[0].id];
  t(
    "detects (corpus): review of a LATER unit",
    cErr(corpus([asEntry(fwd, "6", 1), u2], gradesB), "review-forward"),
  );
  const lost = clone(v2);
  lost.review = ["va.ghost.adj", ref.words[0].id];
  const withEarlier = new Map([
    ...["K", "1", "2", "3", "4", "5"].map((g) => [
      g,
      { file: `x/g${g}/grade.json`, data: synthGrade(g) },
    ]),
    ...gradesB,
  ]);
  t(
    "detects (corpus): review id resolves to nothing",
    cErr(corpus([u1, asEntry(lost, "6", 2)], withEarlier), "review-resolve"),
  );
  t(
    "downgrades (corpus): review id unresolved while an earlier grade is not loaded yet",
    !cErr(corpus([u1, asEntry(lost, "6", 2)], gradesB), "review-resolve") &&
      corpus([u1, asEntry(lost, "6", 2)], gradesB).some(
        (i) => i.code === "review-resolve" && i.sev === "WARN",
      ),
  );

  const sameSent = variant(ref, "6", 2, "qb");
  sameSent.words[0].ex = ref.words[0].ex;
  sameSent.review = [ref.words[0].id, ref.words[1].id];
  const g6c = clone(g6b);
  g6c.units[1].words = sameSent.words.map((w) => ({
    hw: w.hw,
    pos: w.pos,
    tier: w.tier,
    cats: [],
  }));
  t(
    "detects (corpus): sentence repeated across units",
    cErr(
      corpus([u1, asEntry(sameSent, "6", 2)], new Map([["6", { file: "x", data: g6c }]])),
      "dup-sentence",
    ),
  );

  const overlap = variant(ref, "7", 1, "qc");
  overlap.passage.paras = clone(ref.passage.paras);
  const g7 = synthGrade(
    "7",
    overlap.words.map((w) => ({ hw: w.hw, pos: w.pos })),
  );
  const ovr = corpus(
    [u1, asEntry(overlap, "7", 1)],
    new Map([
      ["6", { file: "x", data: g6 }],
      ["7", { file: "x", data: g7 }],
    ]),
  );
  t("detects (corpus): passage duplicated across grades", cErr(ovr, "passage-overlap"));

  const dupUnitId = asEntry(clone(v2), "6", 2);
  dupUnitId.data.passage.id = ref.passage.id;
  dupUnitId.data.passage.qs[0].id = ref.passage.qs[0].id;
  const dupIds = corpus([u1, dupUnitId], gradesB);
  t(
    "detects (corpus): duplicate passage id",
    dupIds.some((i) => i.code === "dup-id" && /passage id/.test(i.msg)),
  );
  t(
    "detects (corpus): duplicate question id",
    dupIds.some((i) => i.code === "dup-id" && /question id/.test(i.msg)),
  );

  const skewed = Array.from({ length: 8 }, (_, k) => {
    const v = variant(ref, "6", k + 1, `sk${k}`);
    v.passage.qs.forEach((q) => {
      q.a = 0;
    });
    return asEntry(v, "6", k + 1);
  });
  t(
    "detects (corpus): answer position skew across a grade (warn)",
    corpus(skewed, grades).some((i) => i.code === "answer-balance" && i.sev === "WARN"),
  );
  t(
    "detects (corpus): grade 9-12 file present (warn by default, error with complete)",
    corpus([], new Map([["9", { file: "x/g9/grade.json", data: synthGrade("9") }]])).some(
      (i) => i.code === "grade-out-of-scope" && i.sev === "WARN",
    ) &&
      cErr(
        corpus([], new Map([["9", { file: "x/g9/grade.json", data: synthGrade("9") }]]), {
          complete: true,
        }),
        "grade-out-of-scope",
      ),
  );

  const wrongWords = clone(ref);
  wrongWords.words.reverse();
  t(
    "detects (corpus): unit words differ from grade.json scope",
    cErr(corpus([asEntry(wrongWords, "6", 1)]), "scope-match"),
  );
  t("detects (corpus): unit without a grade.json", cErr(corpus([u1], new Map()), "grade-exists"));
  t(
    "detects (complete): required units missing",
    cErr(corpus([u1], grades, { complete: true }), "unit-missing"),
  );
  t(
    "detects (complete): grade.json missing for a grade",
    cErr(corpus([u1], grades, { complete: true }), "grade-exists"),
  );
  return out;
}
