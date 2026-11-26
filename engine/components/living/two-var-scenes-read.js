// living/two-var-scenes-read.js — the scenes of the "variables" (9-1) and
// "graph" (9-2) modes. Each scene moves the SAME cast: a row's cells slide from
// the card into the table, and a table row slides out to become its point.

import { SCENE_LABELS as LBL } from "./two-var-copy.js";
import { fmt, fmtY, onGraph, pairText, rowsOf, yOf } from "./two-var-model.js";

const idx = (n) => Array.from({ length: n }, (_, i) => i);

/** Keep only valid row indices from saved state. */
const cleanIdx = (list, n, fallback) => {
  const ok = Array.isArray(list)
    ? [...new Set(list.filter((i) => Number.isInteger(i) && i >= 0 && i < n))]
    : [];
  return ok.length ? ok : fallback;
};

export function variablesScenes(kit) {
  const { v, copy: c, hi, lo, mv, choose, buttons } = kit;
  const m = v.main;
  const t = v.transfer;
  const rows = rowsOf(m);
  const trows = rowsOf(t);
  const need = Math.min(3, rows.length);
  const pair = (sit, r, unit = "") => `${hi(fmt(r.x))}${unit} → ${lo(fmtY(sit, r.y))}`;
  return [
    {
      id: "situate",
      label: LBL.situate,
      async enter(ctx) {
        await ctx.tween(mv("main", {}), 0);
        await ctx.tween(mv("main", { cards: true, cardRow: 0 }), 500);
        ctx.expr(`${fmt(rows[0].x)} → ${fmtY(m, rows[0].y)}`);
        ctx.say(c.situate);
      },
    },
    {
      id: "predict",
      label: LBL.predict,
      gate: true,
      async enter(ctx, saved) {
        const base = { cards: true, cardRow: 0 };
        await ctx.tween(mv("main", { ...base, roles: !!saved.solved }), 300);
        ctx.expr(`${fmt(rows[0].x)} → ${fmtY(m, rows[0].y)}`);
        ctx.say(c.predict.say);
        choose(ctx, saved, {
          ...c.predict,
          win: () => ctx.tween(mv("main", { ...base, roles: true }), 600),
        });
      },
    },
    {
      id: "try",
      label: LBL.try,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.visited = cleanIdx(st.visited, rows.length, [0]);
        st.cur = Number.isInteger(st.cur) && st.visited.includes(st.cur) ? st.cur : 0;
        const live = kit.live(ctx);
        const show = async (ms) => {
          await ctx.tween(
            mv("main", {
              cards: true,
              cardRow: st.cur,
              table: true,
              visited: st.visited,
              roles: true,
              hl: st.cur,
            }),
            ms,
          );
          if (!live()) return;
          ctx.expr(pair(m, rows[st.cur], ` ${ctx.L(m.xUnit)}`));
          ctx.say(c.try.say);
          if (st.visited.length >= need) {
            ctx.feedback(c.try.done);
            ctx.unlock();
          } else ctx.feedback(c.try.progress(st.visited.length), "cue");
          ctx.save();
        };
        const btns = buttons(
          ctx,
          c.try.group,
          rows.map((r, i) => ({
            label: `${fmt(r.x)} ${ctx.L(m.xUnit)}`,
            pressed: () => i === st.cur,
            onClick: async () => {
              st.cur = i;
              if (!st.visited.includes(i)) st.visited.push(i);
              await show(650);
            },
          })),
        );
        ctx.panel.append(btns);
        await show(500);
      },
    },
    {
      id: "say",
      label: LBL.say,
      gate: true,
      async enter(ctx, saved) {
        const spec = (dep) => ({
          cards: true,
          cardRow: 0,
          table: true,
          visited: idx(rows.length),
          roles: true,
          dep,
          hl: 0,
        });
        await ctx.tween(mv("main", spec(!!saved.solved)), 400);
        ctx.expr(saved.solved ? kit.sentenceHtml(ctx, m) : "");
        ctx.say(c.say.say);
        choose(ctx, saved, {
          ...c.say,
          win: async () => {
            ctx.expr(kit.sentenceHtml(ctx, m));
            await ctx.tween(mv("main", spec(true)), 600);
          },
        });
      },
    },
    {
      id: "transfer",
      label: LBL.transfer,
      async enter(ctx, saved) {
        const spec = (roles) => ({
          cards: true,
          cardRow: 0,
          table: true,
          visited: idx(trows.length),
          roles,
          dep: roles,
          hl: 0,
        });
        await ctx.tween(mv("transfer", spec(!!saved.solved)), 500);
        ctx.expr(saved.solved ? kit.sentenceHtml(ctx, t) : pair(t, trows[0]));
        ctx.say(c.transfer.say);
        choose(ctx, saved, {
          ...c.transfer,
          win: async () => {
            ctx.expr(kit.sentenceHtml(ctx, t));
            await ctx.tween(mv("transfer", spec(true)), 600);
          },
        });
        ctx.panel.append(ctx.frame({ label: c.transfer.explain, frame: c.transfer.frame }));
      },
    },
  ];
}

export function graphScenes(kit) {
  const { v, copy: c, hi, mv, choose, buttons } = kit;
  const m = v.main;
  const t = v.transfer;
  const rows = rowsOf(m);
  const trows = rowsOf(t);
  const n = rows.length;
  const tn = trows.length;
  const base = { table: true, rows: n, axes: true };
  const tbase = { table: true, rows: tn, axes: true, plot: idx(tn), line: true };
  const PX = 1; // the row the prediction is about
  const cy = yOf(m, v.check.x);
  const tIdx = t.xs.indexOf(v.pointX);
  return [
    {
      id: "situate",
      label: LBL.situate,
      async enter(ctx) {
        await ctx.tween(mv("main", {}), 0);
        await ctx.tween(mv("main", base), 500);
        ctx.expr("");
        ctx.say(c.situate);
      },
    },
    {
      id: "predict",
      label: LBL.predict,
      gate: true,
      async enter(ctx, saved) {
        const solvedSpec = {
          ...base,
          plot: [PX],
          hl: PX,
          guide: { x: rows[PX].x, y: rows[PX].y },
        };
        await ctx.tween(mv("main", saved.solved ? solvedSpec : { ...base, hl: PX }), 300);
        ctx.expr(saved.solved ? hi(pairText(m, rows[PX].x, rows[PX].y)) : "");
        ctx.say(c.predict.say);
        choose(ctx, saved, {
          ...c.predict,
          miss: (o) =>
            ctx.tween(
              mv("main", {
                ...base,
                hl: PX,
                ghost: onGraph(m, o.px, o.py) ? { x: o.px, y: o.py } : null,
              }),
              350,
            ),
          win: async () => {
            ctx.expr(hi(pairText(m, rows[PX].x, rows[PX].y)));
            await ctx.tween(mv("main", solvedSpec), 800);
          },
        });
      },
    },
    {
      id: "plot",
      label: LBL.plot,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.tapped = cleanIdx(st.tapped, n, [PX]);
        if (!st.tapped.includes(PX)) st.tapped.push(PX);
        if (!Number.isInteger(st.cur)) st.cur = PX;
        const all = () => st.tapped.length >= n;
        const live = kit.live(ctx);
        const show = async (ms) => {
          const r = rows[st.cur];
          await ctx.tween(
            mv("main", {
              ...base,
              plot: st.tapped,
              hl: st.cur,
              guide: { x: r.x, y: r.y },
              line: all(),
            }),
            ms,
          );
          if (!live()) return;
          ctx.expr(hi(pairText(m, r.x, r.y)));
          ctx.say(c.plot.means(r));
          if (all()) {
            ctx.feedback(c.plot.done);
            ctx.unlock();
          } else ctx.feedback(c.plot.progress(st.tapped.length), "cue");
          ctx.save();
        };
        ctx.panel.append(
          buttons(
            ctx,
            c.plot.group,
            rows.map((r, i) => ({
              label: pairText(m, r.x, r.y),
              pressed: () => i === st.cur,
              onClick: async () => {
                st.cur = i;
                if (!st.tapped.includes(i)) st.tapped.push(i);
                await show(800);
              },
            })),
          ),
        );
        await show(700);
      },
    },
    {
      id: "check",
      label: LBL.check,
      gate: true,
      async enter(ctx, saved) {
        const spec = {
          ...base,
          plot: idx(n),
          line: true,
          ghost: { x: v.check.x, y: v.check.y },
        };
        const solved = { ...spec, probe: { x: v.check.x }, guide: { x: v.check.x, y: cy } };
        await ctx.tween(mv("main", saved.solved ? solved : spec), 400);
        ctx.expr("");
        ctx.say(c.check.say);
        choose(ctx, saved, {
          ...c.check,
          win: async () => {
            ctx.expr(hi(pairText(m, v.check.x, cy)));
            await ctx.tween(mv("main", solved), 700);
          },
        });
      },
    },
    {
      id: "steep",
      label: LBL.steep,
      gate: true,
      async enter(ctx, saved) {
        await ctx.tween(mv("transfer", { ...tbase, second: !!saved.solved }), 600);
        ctx.expr("");
        ctx.say(c.steep.say);
        choose(ctx, saved, {
          ...c.steep,
          win: () => ctx.tween(mv("transfer", { ...tbase, second: true }), 700),
        });
      },
    },
    {
      id: "transfer",
      label: LBL.transfer,
      async enter(ctx, saved) {
        const ty = trows[tIdx].y;
        const spec = { ...tbase, hl: tIdx, guide: { x: v.pointX, y: ty } };
        await ctx.tween(mv("transfer", spec), 500);
        ctx.expr(hi(pairText(t, v.pointX, ty)));
        ctx.say(c.transfer.say);
        choose(ctx, saved, {
          ...c.transfer,
          win: () => ctx.tween(mv("transfer", spec), 0),
        });
        ctx.panel.append(ctx.frame({ label: c.transfer.explain, frame: c.transfer.frame }));
      },
    },
  ];
}
