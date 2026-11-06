// Interactive Story World. A living map of short original stories. Each scene is four stops:
// (1) explore the picture and tap hotspots to uncover the events; (2) put the event cards on a numbered
// trail in story order (drag or tap-to-place; a wrong stop bounces back with a reason); (3) build a cause
// bridge: pick the effect a cause led to and the connector that joins them, and hear the sentence read
// back; (4) choose the retelling that keeps the order and the causes true. Finishing a scene earns a
// sticker that reflects understanding (first try / revised / followed the clues) and unlocks the next one.
import { dnd, html, judge, newRound, settled, shuffle, takeHint } from "./engine.js";
import { completeHTML, headerHTML, sayOf, validateStoryWorld } from "./story-world-frame.js";
import {
  acceptedFor,
  bankFor,
  bridgeHTML,
  exploreHTML,
  retellHTML,
  retellHints,
  trailHTML,
  trailHints,
} from "./story-world-view.js";

/** Production passes this band's content; the contract test passes the whole document. */
const bandOf = (env) =>
  (env.content?.levels ? env.content : env.content?.bands?.[env.band]) || { levels: [] };
const storiesOf = (s, env) => s.ids.map((id) => bandOf(env).levels.find((x) => x.id === id));
const cur = (s, env) => bandOf(env).levels.find((x) => x.id === s.ids[s.li]);
const Lof = (s) => s.Ls[s.li];

function levelState(story, env) {
  const tray = shuffle(
    story.events.map((e) => e.id),
    env.rng,
  );
  return {
    found: [],
    tray,
    placed: story.events.map(() => null),
    trs: {},
    sel: null,
    last: null,
    links: story.links.map((l) => ({
      opts: shuffle([l.effect, ...l.decoys.map((d) => d.id)], env.rng),
      bank: shuffle(bankFor(env.band), env.rng),
      eff: null,
      conn: null,
      rs: newRound(),
      last: null,
    })),
    bi: 0,
    retell: {
      order: shuffle(
        story.retell.map((_, i) => i),
        env.rng,
      ),
      pick: null,
      misses: [],
      last: null,
      rs: newRound(),
    },
  };
}

/** Update the understanding streak after a round settles or misses. */
function streak(s, rs) {
  if (rs.status === "right" && rs.tries === 1 && rs.h === 0) s.streak += 1;
  else if (rs.status !== "right") s.streak = 0;
  s.best = Math.max(s.best, s.streak);
}
function roundsOf(L) {
  return [...Object.values(L.trs), ...L.links.map((l) => l.rs), L.retell.rs];
}
function stickerFor(L) {
  const rounds = roundsOf(L);
  if (rounds.every((r) => r.status === "right" && r.tries === 1 && r.h === 0)) return "star";
  if (rounds.some((r) => r.status === "revealed")) return "map";
  return "spark";
}

// ── trail placement (shared by tap-to-place and pointer drag) ──────────────────────────
function place(s, env, eventId, stop) {
  const story = cur(s, env);
  const L = Lof(s);
  if (
    s.stage !== 1 ||
    !eventId ||
    L.placed.includes(eventId) ||
    !(stop >= 0 && stop < L.placed.length) ||
    L.placed[stop]
  )
    return false;
  const idx = story.events.findIndex((e) => e.id === eventId);
  const rs = (L.trs[eventId] ||= newRound());
  const ok = idx === stop;
  judge(rs, ok, env, {
    id: `${story.id}:order:${eventId}`,
    skill: "sequence",
    extra: { story: story.id },
  });
  L.last = { id: eventId, stop, ok, dir: stop < idx ? "early" : "late" };
  if (ok) L.placed[stop] = eventId;
  else if (rs.status === "revealed") L.placed[idx] = eventId;
  L.sel = null;
  streak(s, rs);
  s.say = ok ? (rs.revised ? "fixed" : "right") : rs.status === "revealed" ? "reveal" : L.last.dir;
  return true;
}

function advance(s, env) {
  const story = cur(s, env);
  const L = Lof(s);
  if (s.stage === 0 && L.found.length === story.events.length) {
    s.stage = 1;
    s.say = "trail";
    return true;
  }
  if (s.stage === 1 && L.placed.every(Boolean)) {
    s.stage = 2;
    s.say = "bridge";
    return true;
  }
  if (s.stage === 2 && settled(L.links[L.bi].rs)) {
    if (L.bi < story.links.length - 1) L.bi += 1;
    else s.stage = 3;
    s.say = s.stage === 3 ? "retell" : "bridge";
    return true;
  }
  if (s.stage === 3 && settled(L.retell.rs)) {
    s.stage = 4;
    s.stickers[s.li] = stickerFor(L);
    s.say = "scene";
    return true;
  }
  if (s.stage === 4) {
    s.li += 1;
    s.stage = 0;
    s.say = "start";
    return true;
  }
  return false;
}

// ── the guide's voice: short, specific, never about speed ───────────────────────────────

export default {
  id: "story-world",

  init(env) {
    const levels = bandOf(env).levels;
    const n = Math.min(levels.length, env.count(3, 2));
    const ids = shuffle(
      levels.map((l) => l.id),
      env.rng,
    ).slice(0, n);
    const Ls = ids.map((id) =>
      levelState(
        levels.find((l) => l.id === id),
        env,
      ),
    );
    return { ids, li: 0, stage: 0, streak: 0, best: 0, stickers: [], say: "start", Ls };
  },

  done: (s) => s.li >= s.ids.length,
  progress(s) {
    let done = 0;
    let total = 0;
    for (const L of s.Ls) {
      total += L.placed.length + L.links.length + 1;
      done +=
        L.placed.filter(Boolean).length +
        L.links.filter((l) => settled(l.rs)).length +
        (settled(L.retell.rs) ? 1 : 0);
    }
    return { done, total };
  },

  view(s, env) {
    if (this.done(s))
      return html`<p class="gs-prompt">
        ${env.I.T("Every scene is complete.", "Todas las escenas están terminadas.")}
      </p>`;
    const story = cur(s, env);
    const L = Lof(s);
    const focus = L.sel || (L.last && !L.placed.includes(L.last.id) ? L.last.id : null);
    const body = [exploreHTML, null, bridgeHTML, retellHTML][s.stage];
    const stage =
      s.stage === 1
        ? trailHTML(story, L, env, focus)
        : s.stage === 4
          ? completeHTML(story, L, env, s.stickers[s.li], s.li === s.ids.length - 1)
          : body(story, L, env);
    return html`<div class="sw sw-stage-${s.stage}">
      ${headerHTML(s, env, storiesOf(s, env), sayOf(s, env.I))}
      <h2 class="sw-title">${env.I.T(story.title.en, story.title.es)}</h2>
      ${stage}
    </div>`;
  },

  click(el, s, env) {
    const b = el.closest("button");
    if (!b || this.done(s)) return false;
    const story = cur(s, env);
    const L = Lof(s);
    const d = b.dataset;
    if (b.hasAttribute("data-g-next")) return advance(s, env);
    if (s.stage === 0 && d.gSpot !== undefined) {
      const id = L.tray[Number(d.gSpot)];
      if (!id || L.found.includes(id)) return false;
      L.found.push(id);
      s.say = L.found.length === story.events.length ? "allfound" : "found";
      return true;
    }
    if (s.stage === 1) {
      if (d.gCard !== undefined) {
        const id = L.tray[Number(d.gCard)];
        if (!id || L.placed.includes(id)) return false;
        L.sel = L.sel === id ? null : id;
        return true;
      }
      if (d.gStop !== undefined) return L.sel ? place(s, env, L.sel, Number(d.gStop)) : false;
      if (b.hasAttribute("data-g-hint")) {
        const focus = L.sel || (L.last && !L.placed.includes(L.last.id) ? L.last.id : null);
        return Boolean(focus) && takeHint((L.trs[focus] ||= newRound()), env) >= 0;
      }
    }
    if (s.stage === 2) {
      const lk = L.links[L.bi];
      const link = story.links[L.bi];
      if (settled(lk.rs)) return false;
      if (d.gEff !== undefined) {
        lk.eff = lk.opts[Number(d.gEff)] || null;
        return true;
      }
      if (d.gConn !== undefined) {
        lk.conn = lk.bank.includes(d.gConn) ? d.gConn : null;
        return true;
      }
      if (b.hasAttribute("data-g-hint")) return takeHint(lk.rs, env) >= 0;
      if (b.hasAttribute("data-g-check") && lk.eff && lk.conn) {
        const ok = lk.eff === link.effect && acceptedFor(link.form, env.band).includes(lk.conn);
        lk.last = { eff: lk.eff, conn: lk.conn };
        judge(lk.rs, ok, env, {
          id: `${story.id}:link:${L.bi}`,
          skill: "cause-effect",
          extra: { story: story.id },
        });
        if (lk.rs.status === "revealed") {
          lk.eff = link.effect;
          lk.conn = acceptedFor(link.form, env.band)[0];
        }
        streak(s, lk.rs);
        s.say = ok
          ? lk.rs.revised
            ? "fixed"
            : "linkRight"
          : lk.rs.status === "revealed"
            ? "reveal"
            : "linkRetry";
        return true;
      }
    }
    if (s.stage === 3) {
      const r = L.retell;
      if (settled(r.rs)) return false;
      if (d.gRetell !== undefined) {
        const p = Number(d.gRetell);
        if (!(p >= 0 && p < r.order.length)) return false;
        r.pick = p;
        return true;
      }
      if (b.hasAttribute("data-g-hint")) return takeHint(r.rs, env) >= 0;
      if (b.hasAttribute("data-g-check") && r.pick != null) {
        const ok = r.order[r.pick] === 0;
        r.last = r.pick;
        if (!ok && !r.misses.includes(r.pick)) r.misses.push(r.pick);
        judge(r.rs, ok, env, {
          id: `${story.id}:retell`,
          skill: "retell",
          extra: { story: story.id },
        });
        if (r.rs.status === "revealed") r.pick = r.order.indexOf(0);
        streak(s, r.rs);
        s.say = ok
          ? r.rs.revised
            ? "fixed"
            : "retellRight"
          : r.rs.status === "revealed"
            ? "reveal"
            : "retellRetry";
        return true;
      }
    }
    return false;
  },

  mount(root, s, env, changed) {
    if (this.done(s) || s.stage !== 1) return null;
    const L = Lof(s);
    return dnd(root, {
      I: env.I,
      onDrop: (ti, stop) => {
        if (place(s, env, L.tray[Number(ti)], Number(stop))) changed();
      },
    });
  },

  plan(s, { wrong } = {}, env) {
    if (this.done(s)) return [];
    const story = cur(s, env);
    const L = Lof(s);
    const hints = env?.sup?.hints ?? 0;
    const can = (rs, n) => rs?.status === "retry" && rs.h < Math.min(hints, n);
    const card = (id) => `[data-g-card="${L.tray.indexOf(id)}"]`;
    const stop = (i) => `[data-g-stop="${i}"]`;
    const order = (id) => story.events.findIndex((e) => e.id === id);
    const wrongPlace = (id, sel) => {
      const empties = L.placed.map((x, i) => (x ? -1 : i)).filter((i) => i >= 0 && i !== order(id));
      return empties.length
        ? [...(sel === id ? [] : [{ click: card(id) }]), { click: stop(empties[0]) }]
        : null;
    };
    if (s.stage === 0) {
      const steps = L.tray
        .filter((id) => !L.found.includes(id))
        .map((id) => ({ click: `[data-g-spot="${L.tray.indexOf(id)}"]` }));
      steps.push({ click: "[data-g-next]" });
      return wrong ? [...steps, ...(wrongPlace(L.tray[0], null) || [])] : steps;
    }
    if (s.stage === 1) {
      const pending = L.tray.filter((id) => !L.placed.includes(id));
      if (!pending.length) return [{ click: "[data-g-next]" }];
      if (wrong) {
        const w = wrongPlace(pending[0], L.sel);
        if (w) return w;
      }
      const steps = [];
      pending.forEach((id, i) => {
        if (!(i === 0 && L.sel === id)) steps.push({ click: card(id) });
        if (can(L.trs[id], trailHints(story.events[order(id)], env).length))
          steps.push({ click: "[data-g-hint]" });
        steps.push({ click: stop(order(id)) });
      });
      return [...steps, { click: "[data-g-next]" }];
    }
    if (s.stage === 2) {
      const steps = [];
      for (let j = L.bi; j < story.links.length; j += 1) {
        const lk = L.links[j];
        const link = story.links[j];
        if (!settled(lk.rs)) {
          const good = acceptedFor(link.form, env.band);
          const bad = lk.bank.find((k) => !good.includes(k));
          steps.push(
            { click: `[data-g-eff="${lk.opts.indexOf(link.effect)}"]` },
            { click: `[data-g-conn="${wrong ? bad : good[0]}"]` },
          );
          if (!wrong && can(lk.rs, 2)) steps.push({ click: "[data-g-hint]" });
          steps.push({ click: "[data-g-check]" });
          if (wrong) return steps;
        }
        steps.push({ click: "[data-g-next]" });
      }
      return steps;
    }
    if (s.stage === 3) {
      const r = L.retell;
      if (settled(r.rs)) return [{ click: "[data-g-next]" }];
      const right = r.order.indexOf(0);
      if (wrong)
        return [{ click: `[data-g-retell="${right === 0 ? 1 : 0}"]` }, { click: "[data-g-check]" }];
      return [
        { click: `[data-g-retell="${right}"]` },
        ...(can(r.rs, retellHints(env).length) ? [{ click: "[data-g-hint]" }] : []),
        { click: "[data-g-check]" },
        { click: "[data-g-next]" },
      ];
    }
    return [{ click: "[data-g-next]" }];
  },

  validate: validateStoryWorld,
};

