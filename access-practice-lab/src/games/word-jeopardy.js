// Word Jeopardy: a clue board. Categories across the top, point values down each column. The learner (solo, or two
// pass-and-play teams on one device) picks a tile; it flips open to a clue read by the host (Pip in 3-5, Juno in 6-8)
// with 3-4 answers. The engine's miss -> hint -> second try -> reveal loop decides the points: full value on the first
// try, half on the second, none after a reveal. Three first-try answers in a row without a hint add a streak bonus.
// One tile (picked by env.rng, never the lowest row) is a hidden Daily Double: the learner sets confidence points
// before seeing the clue. The Final Clue adds a confidence wager and a "because..." reason pick. No clock anywhere:
// points reward understanding, never speed. All state is plain JSON, so a reload resumes the same board.
import { judge, mixChoices, newRound, settled, takeHint } from "./engine.js";
import { boardView } from "./word-jeopardy-view.js";

const half = (n) => Math.round(n / 2 / 50) * 50;
const round100 = (n) => Math.max(100, Math.round(n / 100) * 100);
const uniq = (list) => [...new Set(list)].sort((a, b) => a - b);
const mix = (q, random) => {
  const m = mixChoices(q.choices, q.answer, random);
  return { choices: m.choices, answer: m.answer };
};
export const tileAt = (s, key) => {
  const [c, r] = String(key).split("-").map(Number);
  return s.cats[c]?.clues[r] || null;
};
export const tileKeys = (s) => {
  const keys = [];
  const rows = Math.max(...s.cats.map((c) => c.clues.length));
  for (let r = 0; r < rows; r += 1)
    s.cats.forEach((c, ci) => {
      if (c.clues[r]) keys.push(`${ci}-${r}`);
    });
  return keys;
};
const openTiles = (s) => tileKeys(s).filter((k) => tileAt(s, k).pts === null);
const teamList = (s) => (s.teams === 2 ? [0, 1] : [0]);
const topValue = (s) => Math.max(...s.cats.flatMap((c) => c.clues.map((q) => q.value)));
/** Confidence-point choices for the Daily Double (capped at the larger of your score and the top tile). */
export const ddOptions = (s) => {
  const cap = Math.max(s.scores[s.turn], topValue(s));
  return uniq([100, round100(cap / 2), round100(cap)]);
};
/** Final Clue choices: keep your points, risk half, or risk all (capped by the lower team score, at least 100). */
export const finalOptions = (s) => {
  const cap = Math.max(100, Math.min(...teamList(s).map((t) => s.scores[t])));
  return uniq([0, round100(cap / 2), round100(cap)]);
};

function score(s, rs, base, wagered) {
  if (rs.status === "right") return rs.tries === 1 ? base : half(base);
  return wagered ? -half(base) : 0;
}
function bank(s, teams, delta, bonus = 0) {
  teams.forEach((t) => {
    s.scores[t] = Math.max(0, s.scores[t] + delta + bonus);
  });
  s.fx = { delta, bonus, teams, n: (s.fx?.n || 0) + 1 };
}

export default {
  id: "word-jeopardy",

  init(env) {
    const band = env.content.bands?.[env.band] || env.content;
    const all = band.categories.map((_, i) => i);
    const take = env.count(all.length, Math.min(3, all.length));
    const picked = all.length > take ? shuffleTake(all, take, env.rng) : all;
    const cats = picked.map((ci) => {
      const c = band.categories[ci];
      return {
        name: c.name,
        short: c.short || null,
        skill: c.skill || "vocabulary",
        clues: c.clues.map((q) => ({
          id: q.id,
          value: q.value,
          clue: q.clue,
          hint: q.hint,
          explain: q.explain,
          ...mix(q, env.rng),
          rs: newRound(),
          pts: null,
          team: null,
        })),
      };
    });
    const s = {
      band: env.band,
      cats,
      teams: 1,
      scores: [0, 0],
      streaks: [0, 0],
      turn: 0,
      phase: "board",
      open: null,
      wager: 0,
      played: 0,
      fx: null,
      last: null,
      dd: "",
    };
    const ddPool = tileKeys(s).filter((k) => Number(k.split("-")[1]) >= 1);
    s.dd = ddPool[env.rng.int(ddPool.length)];
    const f = band.final;
    s.final = {
      id: f.id,
      category: f.category,
      clue: f.clue,
      hint: f.hint,
      explain: f.explain,
      ...mix(f, env.rng),
      rs: newRound(),
      pts: null,
      wager: null,
      why: {
        prompt: f.why.prompt,
        hint: f.why.hint,
        explain: f.why.explain,
        ...mix(f.why, env.rng),
        rs: newRound(),
        pts: null,
      },
    };
    return s;
  },

  done: (s) => s.phase === "end",
  progress: (s) => {
    const tiles = tileKeys(s);
    const fin = (settled(s.final.rs) ? 1 : 0) + (settled(s.final.why.rs) ? 1 : 0);
    return {
      done: tiles.filter((k) => tileAt(s, k).pts !== null).length + fin,
      total: tiles.length + 2,
    };
  },

  view: (s, env) => boardView(s, env, { ddOptions, finalOptions, tileAt, tileKeys }),

  mount(root) {
    root.querySelector("[data-wj-focus]")?.focus();
  },

  click(el, s, env) {
    const b = el.closest("button");
    if (!b) return false;
    const d = b.dataset;
    if (d.gTeams !== undefined) {
      if (s.played || s.phase !== "board") return false;
      s.teams = Number(d.gTeams) === 2 ? 2 : 1;
      return true;
    }
    if (d.gTile !== undefined && s.phase === "board") {
      const q = tileAt(s, d.gTile);
      if (!q || q.pts !== null) return false;
      s.open = d.gTile;
      s.fx = null;
      s.phase = d.gTile === s.dd ? "wager" : "clue";
      return true;
    }
    if (d.gWager !== undefined) {
      const v = Number(d.gWager);
      if (s.phase === "wager" && ddOptions(s).includes(v)) {
        s.wager = v;
        s.phase = "clue";
        return true;
      }
      if (s.phase === "final-wager" && finalOptions(s).includes(v)) {
        s.final.wager = v;
        s.phase = "final";
        s.fx = null;
        return true;
      }
      return false;
    }
    if (b.hasAttribute("data-g-hint")) {
      const rs = this.current(s)?.rs;
      if (!rs || settled(rs)) return false;
      takeHint(rs, env);
      s.streaks[s.turn] = 0;
      return true;
    }
    if (d.gChoice !== undefined && (s.phase === "clue" || s.phase === "final"))
      return this.answer(s, env, Number(d.gChoice));
    if (d.gWhy !== undefined && s.phase === "final" && settled(s.final.rs))
      return this.reason(s, env, Number(d.gWhy));
    if (b.hasAttribute("data-g-back") && s.phase === "clue" && settled(tileAt(s, s.open).rs)) {
      s.last = s.open;
      s.open = null;
      s.wager = 0;
      s.fx = null;
      if (s.teams === 2) s.turn = (s.turn + 1) % 2;
      s.phase = openTiles(s).length ? "board" : "final-wager";
      return true;
    }
    if (b.hasAttribute("data-g-finish") && s.phase === "final" && settled(s.final.why.rs)) {
      s.phase = "end";
      return true;
    }
    return false;
  },

  current(s) {
    if (s.phase === "clue") return tileAt(s, s.open);
    if (s.phase === "final") return settled(s.final.rs) ? s.final.why : s.final;
    return null;
  },

  answer(s, env, pick) {
    const fin = s.phase === "final";
    const q = fin ? s.final : tileAt(s, s.open);
    if (!q || settled(q.rs) || q.rs.picks.includes(pick) || !(pick >= 0 && pick < q.choices.length))
      return false;
    q.rs.picks.push(pick);
    const t = s.turn;
    const cat = fin ? null : s.cats[Number(s.open.split("-")[0])];
    const preview = {
      ...q.rs,
      tries: q.rs.tries + 1,
      status: pick === q.answer ? "right" : q.rs.tries + 1 >= 2 ? "revealed" : "retry",
    };
    const wagered = fin || s.open === s.dd;
    const base = fin ? s.final.wager : wagered ? s.wager : q.value;
    const delta = preview.status === "retry" ? 0 : score(s, preview, base, wagered);
    judge(q.rs, pick === q.answer, env, {
      id: q.id,
      skill: fin ? "integrated" : cat.skill,
      extra: { points: delta, wager: wagered ? base : undefined },
    });
    if (q.rs.status === "retry") {
      s.streaks[t] = 0;
      return true;
    }
    let bonus = 0;
    if (!fin) {
      const clean = q.rs.status === "right" && q.rs.tries === 1 && q.rs.h === 0;
      s.streaks[t] = clean ? s.streaks[t] + 1 : 0;
      if (clean && s.streaks[t] >= 3) bonus = 50;
      q.team = t;
      s.played += 1;
    }
    q.pts = delta + bonus;
    bank(s, fin ? teamList(s) : [t], delta, bonus);
    return true;
  },

  reason(s, env, pick) {
    const w = s.final.why;
    if (settled(w.rs) || w.rs.picks.includes(pick) || !(pick >= 0 && pick < w.choices.length))
      return false;
    w.rs.picks.push(pick);
    judge(w.rs, pick === w.answer, env, { id: `${s.final.id}-why`, skill: "justify", extra: {} });
    if (w.rs.status === "retry") return true;
    const delta = w.rs.status === "right" ? (w.rs.tries === 1 ? 100 : 50) : 0;
    w.pts = delta;
    bank(s, teamList(s), delta);
    return true;
  },

  plan(s, { wrong } = {}) {
    const choose = (q) => {
      if (!wrong) return q.answer;
      const miss = q.choices
        .map((_, i) => i)
        .find((i) => i !== q.answer && !q.rs.picks.includes(i));
      return miss ?? q.answer;
    };
    if (s.phase === "board") {
      const open = openTiles(s);
      const key = (wrong && open.find((k) => k !== s.dd)) || open[0];
      if (!key) return [];
      if (key === s.dd)
        return [
          { click: `[data-g-tile="${key}"]` },
          { click: `[data-g-wager="${ddOptions(s)[0]}"]` },
        ];
      return [
        { click: `[data-g-tile="${key}"]` },
        { click: `[data-g-choice="${choose(tileAt(s, key))}"]` },
      ];
    }
    if (s.phase === "wager") return [{ click: `[data-g-wager="${ddOptions(s)[0]}"]` }];
    if (s.phase === "final-wager") {
      const o = finalOptions(s);
      return [{ click: `[data-g-wager="${o[Math.min(1, o.length - 1)]}"]` }];
    }
    if (s.phase === "clue") {
      const q = tileAt(s, s.open);
      return settled(q.rs)
        ? [{ click: "[data-g-back]" }]
        : [{ click: `[data-g-choice="${choose(q)}"]` }];
    }
    if (s.phase === "final") {
      if (!settled(s.final.rs)) return [{ click: `[data-g-choice="${choose(s.final)}"]` }];
      if (!settled(s.final.why.rs)) return [{ click: `[data-g-why="${choose(s.final.why)}"]` }];
      return [{ click: "[data-g-finish]" }];
    }
    return [];
  },

  validate(content) {
    const errors = [];
    const leak = (text, ans) => text && ans && text.toLowerCase().includes(ans.toLowerCase());
    const checkClue = (where, q, n) => {
      if (!q.clue?.en || !q.clue?.es) errors.push(`${where}: clue must be bilingual`);
      if (!Array.isArray(q.choices) || q.choices.length < 3 || q.choices.length > 4)
        errors.push(`${where}: needs 3-4 choices`);
      if (n && q.choices?.length !== n)
        errors.push(`${where}: every clue in a band needs the same number of choices`);
      if (!Number.isInteger(q.answer) || !q.choices?.[q.answer])
        errors.push(`${where}: answer must index a choice`);
      if (new Set((q.choices || []).map((c) => c.en)).size !== q.choices?.length)
        errors.push(`${where}: choices must be unique`);
      (q.choices || []).forEach((c, i) => {
        if (!c.en) errors.push(`${where}: choice ${i} needs English text`);
      });
      if (!q.hint?.en || !q.hint?.es || !q.explain?.en || !q.explain?.es)
        errors.push(`${where}: hint and explanation must be bilingual`);
      const a = q.choices?.[q.answer];
      if (a && (leak(q.hint?.en, a.en) || leak(q.hint?.es, a.es)))
        errors.push(`${where}: hint leaks the answer`);
      if (a && a.en.length > 3 && leak(unquoted(q.clue?.en), a.en))
        errors.push(`${where}: clue says the answer`);
      if (q.hint?.en && q.hint.en === q.explain?.en)
        errors.push(`${where}: explanation must say why, not repeat the hint`);
      if (/\b(timer|countdown|hurry|seconds)\b/i.test(JSON.stringify(q)))
        errors.push(`${where}: no clock language`);
    };
    for (const band of ["3-5", "6-8"]) {
      const { categories = [], final } = content.bands?.[band] || {};
      if (categories.length < 4 || categories.length > 5)
        errors.push(`${band}: the board needs 4-5 categories`);
      const ids = new Set();
      const values = categories[0]?.clues.map((q) => q.value).join();
      const n = categories[0]?.clues[0]?.choices?.length;
      categories.forEach((c, ci) => {
        if (!c.name?.en || !c.name?.es)
          errors.push(`${band}/category ${ci}: name must be bilingual`);
        if (c.short && (!c.short.en || !c.short.es)) errors.push(`${band}/category ${ci}: short name must be bilingual`);
        if ((c.clues || []).length < 3 || c.clues.length > 4)
          errors.push(`${band}/${c.name?.en}: needs 3-4 values`);
        if (c.clues.map((q) => q.value).join() !== values)
          errors.push(`${band}/${c.name?.en}: every column needs the same point values`);
        c.clues.forEach((q, r) => {
          if (r && q.value <= c.clues[r - 1].value)
            errors.push(`${band}/${q.id}: values must climb down the column`);
          if (ids.has(q.id)) errors.push(`${band}/${q.id}: duplicate id`);
          ids.add(q.id);
          checkClue(`${band}/${q.id}`, q, n);
        });
      });
      if (!final) {
        errors.push(`${band}: needs a Final Clue`);
        continue;
      }
      if (!final.category?.en || !final.category?.es)
        errors.push(`${band}/final: category must be bilingual`);
      checkClue(`${band}/final`, final);
      if (!final.why?.prompt?.en || !final.why?.prompt?.es)
        errors.push(`${band}/final: reason prompt must be bilingual`);
      checkClue(`${band}/final-why`, { ...final.why, clue: final.why?.prompt });
    }
    return errors;
  },
};

// A clue may quote a passage that contains the answer (a context clue); only the clue's own words must not say it.
const unquoted = (t = "") => t.replace(/(^|[\s:(])'[^']+'(?=[\s.,:?)]|$)/g, "$1");

function shuffleTake(list, n, random) {
  const pool = [...list];
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(random.int(pool.length), 1)[0]);
  return out.sort((a, b) => a - b);
}
