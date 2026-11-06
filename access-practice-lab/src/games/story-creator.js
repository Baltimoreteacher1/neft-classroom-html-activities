// Story Creator: build a four-panel storyboard (Opening, Problem, Turning point, Ending) from a story seed,
// then publish it. Each panel is two judged steps: (1) choose the piece that fits THIS story (vague and
// off-story pieces, and endings that never resolve the problem, are distractors with explanations); (2) polish
// one line, a real language task: dialogue punctuation placed mark by mark, a connecting word, or a precise
// verb. Panels unlock one at a time, earn a sticker, and the finished story is read back with a strength
// rating built from fit, first tries, revisions and hints. Never speed: there is no clock anywhere.
import { judge, newRound, settled, shuffle, takeHint } from "./engine.js";
import { KNOWN_PROPS, KNOWN_SCENES, KNOWN_SKIES } from "./story-creator-art.js";
import { MARKS, diagnose, emptyWork, parsePunct, punctCorrect } from "./story-creator-lines.js";
import { publishView } from "./story-creator-publish.js";
import { ROLES, bandOf, buildView, seedOf, seedView } from "./story-creator-view.js";

const ORDER = ["opening", "problem", "turn", "ending"];
const SKILL = {
  piece: "story-coherence",
  punct: "dialogue-punctuation",
  connector: "connecting-words",
  verb: "precise-verbs",
};
const newPanel = () => ({
  prs: newRound(),
  lrs: newRound(),
  pick: null,
  last: null,
  lpick: null,
  lastWord: null,
  work: emptyWork(),
  diag: null,
});
const attr = (b) => {
  const k = Object.keys(b.dataset || {}).find((x) => /^g[A-Z]/.test(x));
  if (!k) return null;
  const name = `data-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
  return b.dataset[k] === "" ? `[${name}]` : `[${name}="${b.dataset[k]}"]`;
};

function settle(s, rs) {
  if (rs.status === "retry") return;
  // The streak counts steps the learner worked out (first try or after revising); only a reveal resets it.
  s.streak = rs.status === "right" ? s.streak + 1 : 0;
  s.best = Math.max(s.best, s.streak);
}

export default {
  id: "story-creator",

  init(env) {
    const seeds = bandOf(env).seeds || [];
    const deal = {};
    for (const seed of seeds)
      deal[seed.id] = seed.panels.map((p) => ({
        opts: shuffle(
          p.pieces.map((_, i) => i),
          env.rng,
        ),
        bank: shuffle(
          (p.line.bank || []).map((_, i) => i),
          env.rng,
        ),
      }));
    return {
      phase: "seed",
      seeds: shuffle(
        seeds.map((x) => x.id),
        env.rng,
      ),
      deal,
      seed: null,
      p: 0,
      panels: [],
      streak: 0,
      best: 0,
      title: "",
      fx: null,
      focus: null,
    };
  },

  done: (s) => s.phase === "done",
  progress(s) {
    const steps = s.panels.flatMap((P) => [P.prs, P.lrs]);
    return { done: steps.filter(settled).length, total: 8 };
  },

  view(s, env) {
    if (s.phase === "seed" || !seedOf(s, env)) return seedView(s, env);
    if (s.phase === "build") return buildView(s, env, this.progress(s));
    return publishView(s, env);
  },

  click(el, s, env) {
    const b = el.closest("button");
    if (!b) return false;
    const changed = act(b, s, env);
    if (changed) s.focus = s.focus || attr(b);
    return changed;
  },

  input(el, s) {
    if (el.matches?.("[data-g-title]")) s.title = String(el.value || "").slice(0, 80);
    return false; // saved with the next click; re-rendering here would drop the cursor mid-word
  },

  mount(root, s) {
    const sel = s.focus;
    s.focus = null;
    if (!sel) return null;
    const node = root.querySelector(sel);
    if (node && !node.disabled)
      node.focus({ preventScroll: sel === "[data-sc-say]" ? false : true });
    return null;
  },

  plan(s, { wrong } = {}, env) {
    if (s.phase === "done") return [];
    if (s.phase === "publish") return [{ click: "[data-g-publish]" }];
    if (s.phase === "seed") {
      const id = s.seeds[0];
      if (!wrong) return [{ click: `[data-g-seed="${id}"]` }];
      return [{ click: `[data-g-seed="${id}"]` }, ...pieceSteps(s, env, id, 0, newPanel(), true)];
    }
    const P = s.panels[s.p];
    if (!settled(P.prs)) return pieceSteps(s, env, s.seed, s.p, P, wrong);
    if (!settled(P.lrs)) return lineSteps(s, env, P, wrong);
    return [{ click: "[data-g-next]" }];
  },

  validate(content) {
    const errs = [];
    for (const band of ["3-5", "6-8"]) {
      const seeds = content.bands?.[band]?.seeds || [];
      if (seeds.length < 2) errs.push(`${band}: needs at least 2 story seeds`);
      for (const seed of seeds) checkSeed(seed, `${band}/${seed.id}`, errs);
    }
    return errs;
  },
};

// ── actions ──────────────────────────────────────────────────────────────────────────────
function act(b, s, env) {
  const d = b.dataset;
  if (s.phase === "seed") {
    if (d.gSeed === undefined || !seedOf(s, env, d.gSeed)) return false;
    s.seed = d.gSeed;
    s.phase = "build";
    s.p = 0;
    s.panels = ORDER.map(newPanel);
    s.focus = ".scr-h";
    return true;
  }
  if (s.phase === "publish") {
    if (!b.hasAttribute("data-g-publish")) return false;
    s.phase = "done";
    return true;
  }
  if (s.phase !== "build") return false;
  const seed = seedOf(s, env);
  const panel = seed.panels[s.p];
  const P = s.panels[s.p];
  const id = `${s.seed}:${panel.role}`;
  if (b.hasAttribute("data-g-next")) {
    if (!settled(P.prs) || !settled(P.lrs)) return false;
    s.fx = null;
    if (s.p < 3) s.p += 1;
    else s.phase = "publish";
    s.focus = ".scr-h";
    return true;
  }
  if (b.hasAttribute("data-g-hint")) return takeHint(settled(P.prs) ? P.lrs : P.prs, env) >= 0;
  if (!settled(P.prs)) {
    const order = s.deal[s.seed][s.p].opts;
    if (d.gOpt !== undefined) {
      const i = Number(d.gOpt);
      if (!(i >= 0 && i < order.length) || P.prs.picks.includes(i)) return false;
      P.pick = i;
      return true;
    }
    if (!b.hasAttribute("data-g-check") || P.pick === null || P.prs.picks.includes(P.pick))
      return false;
    const ok = Boolean(panel.pieces[order[P.pick]].ok);
    judge(P.prs, ok, env, { id: `${id}:piece`, skill: SKILL.piece });
    P.last = P.pick;
    if (!ok) P.prs.picks.push(P.pick);
    if (settled(P.prs)) P.pick = order.findIndex((k) => panel.pieces[k].ok);
    settle(s, P.prs);
    s.fx = { p: s.p, kind: P.prs.status === "retry" ? "miss" : "right" };
    s.focus = "[data-sc-say]";
    return true;
  }
  if (settled(P.lrs)) return false;
  return panel.line.kind === "punct"
    ? punctAct(b, s, env, panel, P, id)
    : wordAct(b, s, env, panel, P, id);
}

function wordAct(b, s, env, panel, P, id) {
  const line = panel.line;
  if (b.dataset.gWord !== undefined) {
    const k = Number(b.dataset.gWord);
    if (!line.bank[k]) return false;
    P.lpick = k;
    return true;
  }
  if (!b.hasAttribute("data-g-check") || P.lpick === null) return false;
  const ok = line.bank[P.lpick].w === line.answer;
  judge(P.lrs, ok, env, { id: `${id}:${line.kind}`, skill: SKILL[line.kind] });
  P.lastWord = P.lpick;
  if (P.lrs.status === "revealed") P.lpick = line.bank.findIndex((x) => x.w === line.answer);
  return after(s, P);
}

function punctAct(b, s, env, panel, P, id) {
  const line = panel.line;
  const W = P.work;
  const d = b.dataset;
  if (d.gTool !== undefined) {
    if (d.gTool !== "erase" && !MARKS[Number(d.gTool)]) return false;
    W.tool = d.gTool;
    return true;
  }
  if (d.gGap !== undefined) {
    const i = Number(d.gGap);
    if (!(i >= 0 && i <= line.words.length) || W.tool === null) return false;
    const cur = W.gaps[i] || "";
    if (W.tool === "erase") W.gaps[i] = cur.slice(0, -1);
    else if (cur.length < 3) W.gaps[i] = cur + MARKS[Number(W.tool)];
    else return false;
    if (!W.gaps[i]) delete W.gaps[i];
    return true;
  }
  if (d.gCap !== undefined) {
    const i = Number(d.gCap);
    if (!(i >= 0 && i < line.words.length)) return false;
    W.caps = W.caps.includes(i)
      ? W.caps.filter((x) => x !== i)
      : [...W.caps, i].sort((a, c) => a - c);
    return true;
  }
  if (b.hasAttribute("data-g-clear")) {
    P.work = { ...emptyWork(), tool: W.tool };
    return true;
  }
  if (!b.hasAttribute("data-g-check")) return false;
  const ok = punctCorrect(line, W);
  judge(P.lrs, ok, env, { id: `${id}:punct`, skill: SKILL.punct });
  P.diag = ok ? null : diagnose(line, W);
  if (P.lrs.status === "revealed") P.work = keyWork(line);
  return after(s, P);
}

function after(s, P) {
  settle(s, P.lrs);
  s.fx = { p: s.p, kind: P.lrs.status === "retry" ? "miss" : "right" };
  s.focus = "[data-sc-say]";
  return true;
}

/** The finished line as a work state (used to show the answer after a reveal, and by the QA plan). */
function keyWork(line) {
  const key = parsePunct(line.answer);
  const gaps = {};
  key.gaps.forEach((g, i) => {
    if (g) gaps[i] = g;
  });
  const caps = key.words.map((w, i) => (w !== line.words[i] ? i : -1)).filter((i) => i >= 0);
  return { gaps, caps, tool: null };
}

// ── QA plan steps ────────────────────────────────────────────────────────────────────────
function pieceSteps(s, env, seedId, p, P, wrong) {
  const panel = seedOf(s, env, seedId).panels[p];
  const order = s.deal[seedId][p].opts;
  const right = order.findIndex((k) => panel.pieces[k].ok);
  const miss = order.findIndex((k, i) => !panel.pieces[k].ok && !P.prs.picks.includes(i));
  const pick = wrong && miss >= 0 ? miss : right;
  return [{ click: `[data-g-opt="${pick}"]` }, { click: "[data-g-check]" }];
}

function lineSteps(s, env, P, wrong) {
  const line = seedOf(s, env).panels[s.p].line;
  if (line.kind !== "punct") {
    const k = line.bank.findIndex((x) => (wrong ? x.w !== line.answer : x.w === line.answer));
    return [{ click: `[data-g-word="${k}"]` }, { click: "[data-g-check]" }];
  }
  const steps = [];
  const W = P.work;
  if (Object.keys(W.gaps).length || W.caps.length) steps.push({ click: "[data-g-clear]" });
  if (wrong)
    return [
      ...steps,
      { click: `[data-g-tool="${MARKS.indexOf(".")}"]` },
      { click: `[data-g-gap="${line.words.length}"]` },
      { click: "[data-g-check]" },
    ];
  const key = keyWork(line);
  for (const i of key.caps) steps.push({ click: `[data-g-cap="${i}"]` });
  for (const [i, marks] of Object.entries(key.gaps))
    for (const m of marks)
      steps.push(
        { click: `[data-g-tool="${MARKS.indexOf(m)}"]` },
        { click: `[data-g-gap="${i}"]` },
      );
  return [...steps, { click: "[data-g-check]" }];
}

// ── content validation: the answer keys are checked against their own text ────────────────
const bi = (o) =>
  o &&
  typeof o.en === "string" &&
  o.en.trim() &&
  typeof o.es === "string" &&
  o.es.trim() &&
  o.en !== o.es;
const leaks = (hint, ans) =>
  [hint?.en, hint?.es].some((h) =>
    new RegExp(`\\b${ans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(h || ""),
  );
function checkSeed(seed, at, errs) {
  for (const f of ["title", "who", "where", "goal"])
    if (!bi(seed[f])) errs.push(`${at}: ${f} must be bilingual`);
  if (!KNOWN_SCENES.includes(seed.scene)) errs.push(`${at}: unknown scene "${seed.scene}"`);
  if (!seed.look?.skin || !seed.look?.hair || !seed.look?.shirt)
    errs.push(`${at}: look needs skin, hair, shirt`);
  if ((seed.panels || []).map((p) => p.role).join() !== ORDER.join())
    errs.push(`${at}: panels must be ${ORDER.join(", ")}`);
  for (const p of seed.panels || []) {
    const pa = `${at}/${p.role}`;
    if (!ROLES[p.role]) continue;
    if (!KNOWN_SKIES.includes(p.art?.sky)) errs.push(`${pa}: unknown sky`);
    for (const k of p.art?.props || [])
      if (!KNOWN_PROPS.includes(k)) errs.push(`${pa}: unknown prop "${k}"`);
    if (!bi(p.clue)) errs.push(`${pa}: clue must be bilingual`);
    const ok = (p.pieces || []).filter((x) => x.ok);
    if ((p.pieces || []).length !== 3 || ok.length !== 1)
      errs.push(`${pa}: needs 3 pieces with exactly one ok`);
    for (const x of p.pieces || [])
      if (!bi(x) || !bi(x.why)) errs.push(`${pa}: every piece and its why must be bilingual`);
    if (ok[0] && leaks(p.clue, ok[0].en)) errs.push(`${pa}: clue leaks the piece`);
    checkLine(p.line || {}, pa, errs);
  }
}
function checkLine(line, at, errs) {
  if (!bi(line.clue) || !line.es) errs.push(`${at}: line needs a bilingual clue and Spanish text`);
  if (line.kind === "punct") {
    const key = parsePunct(line.answer || "");
    if (
      key.words.length !== (line.words || []).length ||
      key.words.some((w, i) => w.toLowerCase() !== String(line.words[i]).toLowerCase())
    )
      errs.push(`${at}: punct words do not match the answer sentence`);
    if (!key.gaps.join("").includes("“") || !/[.!?]/.test(key.gaps[key.gaps.length - 1]))
      errs.push(`${at}: punct answer needs quotation marks and an end mark`);
    if (key.gaps.some((g) => g.length > 3 || [...g].some((m) => !MARKS.includes(m))))
      errs.push(`${at}: punct answer uses an unsupported mark`);
    if (line.words.every((w, i) => w === key.words[i]) && key.gaps.every((g) => !g))
      errs.push(`${at}: punct line is already correct`);
    return;
  }
  if (!["connector", "verb"].includes(line.kind))
    return errs.push(`${at}: unknown line kind "${line.kind}"`);
  if ((line.text || "").split("___").length !== 2 || (line.gap_es || "").split("___").length !== 2)
    errs.push(`${at}: text and gap_es need exactly one ___`);
  const words = (line.bank || []).map((x) => x.w);
  if (words.length < 3 || new Set(words).size !== words.length)
    errs.push(`${at}: bank needs 3+ distinct words`);
  if (words.filter((w) => w === line.answer).length !== 1)
    errs.push(`${at}: answer must appear once in the bank`);
  for (const x of line.bank || [])
    if (!x.es || !bi(x.why)) errs.push(`${at}: bank word "${x.w}" needs es and a bilingual why`);
  if (line.answer && leaks(line.clue, line.answer)) errs.push(`${at}: clue leaks the answer`);
  if (line.kind === "verb" && (!line.weak || words.includes(line.weak)))
    errs.push(`${at}: verb line needs a weak verb that is not a choice`);
  if (line.es && line.text && line.es.includes("___"))
    errs.push(`${at}: finished Spanish line still has a gap`);
}
