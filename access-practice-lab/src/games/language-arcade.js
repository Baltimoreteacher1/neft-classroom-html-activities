// Language Arcade (Arcade del lenguaje): grid mazes where language opens the way. The learner steers a character with
// the arrow keys, the on-screen move pad or by tapping an adjacent square. Locked gates block the only path; walking
// into one opens a quick language challenge (word choice, connector, fix-it, fact or opinion, evidence, register).
// Solving it (or seeing the explained answer after two tries) opens the gate. Reaching the exit finishes the maze.
// Layouts are authored in content JSON and validated so every gate is required and every bonus item is reachable.
// Every move is announced ("Moved right. Gate ahead."), the move pad names what lies in each direction, and the board
// itself is decorative for assistive technology. No timers; motion stops under prefers-reduced-motion.
import { announce } from "../util.js";
import { judge, mixChoices, newRound, settled, takeHint } from "./engine.js";
import {
  DIR_KEYS,
  DIR_NAMES,
  DIRS,
  cellAt,
  find,
  gatesOf,
  isGate,
  mazeProblems,
  route,
  step,
} from "./language-arcade-maze.js";
import { lookAt, stageHTML, TYPES } from "./language-arcade-view.js";

let focusSel = "";
let saidN = 0;
const two = (x) => Boolean(x?.en && x?.es);
const say = (s, en, es) => {
  s.say = { en, es };
  s.sayN = (s.sayN || 0) + 1;
};

function ahead(m) {
  const look = m.facing ? lookAt(m, m.facing) : "path";
  if (look === "gate") return [" Gate ahead.", " Puerta adelante."];
  if (look === "wall") return [" Wall ahead.", " Pared adelante."];
  if (look === "exit") return [" Exit ahead!", " ¡Salida adelante!"];
  return ["", ""];
}

function move(s, m, dir, env) {
  const def = env.content.mazes.find((d) => d.id === m.id);
  const [y, x] = step(m.pos, dir);
  const c = cellAt(m.map, y, x);
  const [en, es] = DIR_NAMES[dir];
  if (c === "#") {
    say(s, `Wall. You cannot move ${en}.`, `Pared. No puedes moverte ${es}.`);
    return true;
  }
  if (isGate(c) && !m.open.includes(c)) {
    s.at = c;
    s.dir = dir;
    say(
      s,
      `A locked gate blocks the way ${en}. Solve the challenge to open it.`,
      `Una puerta cerrada bloquea el camino ${es}. Resuelve el reto para abrirla.`,
    );
    focusSel = "#la-gate-h";
    return true;
  }
  m.pos = [y, x];
  m.facing = dir;
  if (c === "X") {
    m.won = true;
    say(
      s,
      `You reached the ${def.goalName.en}! Maze complete.`,
      `¡Llegaste a: ${def.goalName.es}! Laberinto completo.`,
    );
    focusSel = ".la-won-h";
    return true;
  }
  let bonus = ["", ""];
  if (c === "*" && !m.got.includes(`${y},${x}`)) {
    m.got.push(`${y},${x}`);
    bonus = [
      ` You found a bonus ${def.gemName.en}!`,
      ` ¡Encontraste una bonificación: ${def.gemName.es}!`,
    ];
  }
  const [aEn, aEs] = ahead(m);
  say(s, `Moved ${en}.${bonus[0]}${aEn}`, `Te moviste ${es}.${bonus[1]}${aEs}`);
  return true;
}

export default {
  id: "language-arcade",

  init(env) {
    const list = env.content.mazes || [];
    const take = list.slice(0, env.count(list.length, 1));
    return {
      sid: env.rng.int(1e9),
      mi: 0,
      at: null,
      say: null,
      sayN: 0,
      mazes: take.map((d) => ({
        id: d.id,
        map: d.map,
        pos: find(d.map, "S"),
        facing: null,
        open: [],
        got: [],
        won: false,
        gates: Object.fromEntries(
          gatesOf(d.map).map((g) => {
            const spec = d.gates[g];
            const order = mixChoices(
              spec.choices.map((_, i) => i),
              spec.answer,
              env.rng,
            ).choices;
            return [g, { order, pick: null, rs: newRound() }];
          }),
        ),
      })),
    };
  },

  done: (s) => s.mi >= s.mazes.length,
  progress(s) {
    const all = s.mazes.flatMap((m) => Object.values(m.gates));
    return { done: all.filter((g) => settled(g.rs)).length, total: all.length };
  },
  view: (s, env) => stageHTML(s, env),

  click(el, s, env) {
    const b = el.closest("button");
    const m = s.mazes[s.mi];
    if (!b || !m) return false;
    if (s.at) {
      const g = m.gates[s.at];
      const spec = env.content.mazes.find((d) => d.id === m.id).gates[s.at];
      if (b.dataset.gGate !== undefined && !settled(g.rs)) {
        g.pick = Number(b.dataset.gGate);
        return true;
      }
      if (b.hasAttribute("data-la-check") && g.pick !== null && !settled(g.rs)) {
        judge(g.rs, g.order[g.pick] === spec.answer, env, {
          id: `${m.id}-${s.at}`,
          skill: "integrated",
          extra: { kind: spec.type },
        });
        if (settled(g.rs)) {
          m.open.push(s.at);
          say(
            s,
            g.rs.status === "right"
              ? "Correct! The gate unlocks."
              : "The gate unlocks. Read why that answer works.",
            g.rs.status === "right"
              ? "¡Correcto! La puerta se abre."
              : "La puerta se abre. Lee por qué funciona esa respuesta.",
          );
        } else say(s, "Not yet. The lock did not turn.", "Todavía no. El candado no giró.");
        focusSel = ".gs-feedback";
        return true;
      }
      if (b.hasAttribute("data-g-hint") && !settled(g.rs)) {
        takeHint(g.rs, env);
        return true;
      }
      if (b.hasAttribute("data-la-close") && settled(g.rs)) {
        s.at = null;
        say(s, "The gate is open. Keep going.", "La puerta está abierta. Sigue adelante.");
        focusSel = `[data-la-move="${s.dir || "up"}"]`;
        return true;
      }
      return false;
    }
    if (b.hasAttribute("data-la-next") && m.won) {
      s.mi += 1;
      s.say = null;
      focusSel = ".la-title";
      return true;
    }
    const dir = b.dataset.laMove || b.dataset.laTap;
    if (dir && DIRS[dir] && !m.won) return move(s, m, dir, env);
    return false;
  },

  key(e, s, env) {
    const m = s.mazes[s.mi];
    const dir = DIR_KEYS[e.key];
    if (!dir || !m || m.won || s.at || e.altKey || e.ctrlKey || e.metaKey) return false;
    const t = e.target;
    if (t && t !== document.body && !t.closest?.(".gs-stage")) return false;
    return move(s, m, dir, env);
  },

  mount(root, s, env) {
    if (s.say && s.sayN !== saidN) {
      saidN = s.sayN;
      announce(env.I.S(s.say.en, s.say.es), { toast: false });
    }
    if (focusSel) {
      const n = root.querySelector(focusSel);
      if (n && !n.matches("button, a, input")) n.setAttribute("tabindex", "-1");
      n?.focus({ preventScroll: false });
      focusSel = "";
    }
    return null;
  },

  plan(s, { wrong } = {}, env) {
    const m = s.mazes[s.mi];
    if (!m) return [];
    if (s.at) {
      const g = m.gates[s.at];
      if (settled(g.rs)) return [{ click: "[data-la-close]" }];
      const spec = (env?.content.mazes || []).find((d) => d.id === m.id)?.gates[s.at];
      const right = g.order.indexOf(spec ? spec.answer : 0);
      return [
        { click: `[data-g-gate="${wrong ? (right + 1) % g.order.length : right}"]` },
        { click: "[data-la-check]" },
      ];
    }
    if (m.won) return [{ click: "[data-la-next]" }];
    const path = route(m.map, m.pos, "X") || [];
    const out = [];
    let p = m.pos;
    for (const dir of path) {
      out.push({ click: `[data-la-move="${dir}"]` });
      p = step(p, dir);
      const c = cellAt(m.map, p[0], p[1]);
      if (isGate(c) && !m.open.includes(c)) break;
    }
    return out;
  },

  validate(content) {
    const errors = [];
    for (const band of ["3-5", "6-8"]) {
      const mazes = content.bands?.[band]?.mazes || [];
      if (mazes.length !== 2) errors.push(`${band}: needs two mazes`);
      const total = mazes.reduce((n, d) => n + gatesOf(d.map || []).length, 0);
      if (total < 8 || total > 10)
        errors.push(`${band}: needs 8-10 gates across its mazes (has ${total})`);
      mazes.forEach((d) => {
        const at = `${band}/${d.id}`;
        if (![d.name, d.story, d.playerName, d.goalName, d.gemName].every(two))
          errors.push(`${at}: names and story must be bilingual`);
        if (!d.player || !d.goal || !d.gem || !d.theme)
          errors.push(`${at}: needs player, goal, gem and theme`);
        errors.push(...mazeProblems(d.map, at));
        const onMap = gatesOf(d.map || []);
        Object.keys(d.gates || {}).forEach((g) => {
          if (!onMap.includes(g))
            errors.push(`${at}: gate ${g} has a challenge but is not on the map`);
        });
        onMap.forEach((g) => {
          const q = d.gates?.[g];
          const gat = `${at}/${g}`;
          if (!q) return errors.push(`${gat}: gate has no challenge`);
          if (!TYPES[q.type]) errors.push(`${gat}: unknown challenge type`);
          if (!q.prompt || !q.es)
            errors.push(`${gat}: needs an English prompt and a Spanish gloss`);
          if (["word", "connector"].includes(q.type) && !q.prompt?.includes("___"))
            errors.push(`${gat}: a ${q.type} gate needs a ___ blank`);
          if (
            !Array.isArray(q.choices) ||
            q.choices.length < 2 ||
            !Number.isInteger(q.answer) ||
            q.answer < 0 ||
            q.answer >= q.choices.length
          )
            errors.push(`${gat}: needs 2+ choices and a valid answer`);
          if (q.choices?.length < 3 && q.type !== "factop") errors.push(`${gat}: needs 3 choices`);
          if (!two(q.hint) || !two(q.explain))
            errors.push(`${gat}: hint and explanation must be bilingual`);
          if (q.hint?.en === q.explain?.en)
            errors.push(`${gat}: explanation must say why, not repeat the hint`);
          const ans = String(q.choices?.[q.answer] || "").toLowerCase();
          const leaks = ans && new RegExp(`\\b${ans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
          if (leaks && [q.hint?.en, q.hint?.es].some((h) => leaks.test(h || "")))
            errors.push(`${gat}: hint leaks the answer`);
        });
      });
    }
    return errors;
  },
};
