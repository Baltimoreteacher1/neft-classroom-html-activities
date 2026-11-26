// living/two-var-scenes-solve.js — the scenes of the "equation" (9-3) and
// "apply" (9-4) modes: the rule found from the table and tested on every row,
// then used to answer "how much when…?" and "when is…?".

import { SCENE_LABELS as LBL } from "./two-var-copy.js";
import { fmt, fmtY, rowsOf, yOf } from "./two-var-model.js";

const idx = (n) => Array.from({ length: n }, (_, i) => i);
const WHAT_IF = { en: "What if?", es: "¿Y si…?" };
const SOLVE = { en: "Solve it", es: "Resuélvelo" };
const SLIDE = { en: "Slide it", es: "Desliza" };
const ONE_MORE = { en: "Test rows", es: "Prueba filas" };

/** Saved numbers: keep only finite numbers from a saved list. */
const cleanNums = (list) =>
  Array.isArray(list) ? [...new Set(list.filter((x) => Number.isFinite(x)))] : [];

export function equationScenes(kit) {
  const { v, copy: c, hi, lo, mv, choose, buttons } = kit;
  const m = v.main;
  const t = v.transfer;
  const rows = rowsOf(m);
  const n = rows.length;
  const tn = t.xs.length;
  const base = { table: true, rows: n, axes: true };
  const graphed = { ...base, plot: idx(n) };
  const tbase = { table: true, rows: tn, axes: true };
  const eqHtml = (sit, yv, xv, yTxt) =>
    `${hi(sit.vars.y)} = ${fmt(sit.k, sit.cents)} × ${hi(fmt(xv))} = ${lo(yTxt ?? fmtY(sit, yv))}`;
  /** A wrong rule fails on one row: point at that row and print the test. */
  const miss = (which, sit, ctx) => async (o) => {
    const t0 = (which === "main" ? c.predict : c.transfer).test(o);
    ctx.expr(t0.text);
    await ctx.tween(
      mv(which, { ...(which === "main" ? base : tbase), hl: sit.xs.indexOf(t0.x) }),
      350,
    );
  };
  return [
    {
      id: "situate",
      label: LBL.situate,
      async enter(ctx) {
        await ctx.tween(mv("main", {}), 0);
        await ctx.tween(mv("main", base), 500);
        ctx.expr(ctx.L({ en: `+${fmtY(m, m.k)} per row`, es: `+${fmtY(m, m.k)} por fila` }));
        ctx.say(c.situate);
      },
    },
    {
      id: "predict",
      label: LBL.predict,
      gate: true,
      async enter(ctx, saved) {
        await ctx.tween(mv("main", base), 300);
        ctx.expr(saved.solved ? hi(c.rule(m)) : "");
        ctx.say(c.predict.say);
        choose(ctx, saved, {
          ...c.predict,
          miss: miss("main", m, ctx),
          win: async () => {
            ctx.expr(hi(c.rule(m)));
            await ctx.tween(mv("main", base), 300);
          },
        });
      },
    },
    {
      id: "check",
      label: ONE_MORE,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.tested = cleanNums(st.tested).filter((i) => i >= 0 && i < n);
        if (!Number.isInteger(st.cur)) st.cur = -1;
        const all = () => st.tested.length >= n;
        const live = kit.live(ctx);
        const show = async (ms) => {
          const r = rows[st.cur];
          await ctx.tween(
            mv("main", {
              ...graphed,
              hl: st.cur,
              line: all(),
              guide: r ? { x: r.x, y: r.y } : null,
            }),
            ms,
          );
          if (!live()) return;
          if (r) {
            ctx.expr(eqHtml(m, r.y, r.x));
            ctx.say(c.check.result(r));
          } else ctx.expr(hi(c.rule(m)));
          if (all()) {
            ctx.feedback(c.check.done);
            ctx.unlock();
          } else ctx.feedback(c.check.progress(st.tested.length), "cue");
          ctx.save();
        };
        ctx.panel.append(
          buttons(
            ctx,
            c.check.group,
            rows.map((r, i) => ({
              label: c.check.label(r),
              pressed: () => i === st.cur,
              onClick: async () => {
                st.cur = i;
                if (!st.tested.includes(i)) st.tested.push(i);
                await show(600);
              },
            })),
          ),
        );
        await show(900);
        if (st.cur < 0) ctx.say(c.check.say);
      },
    },
    {
      id: "any",
      label: SLIDE,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.m = Number.isInteger(st.m) && st.m >= 1 && st.m <= m.xMax ? st.m : c.any.start;
        st.seen = cleanNums(st.seen);
        const live = kit.live(ctx);
        const show = async (ms) => {
          const y = yOf(m, st.m);
          await ctx.tween(
            mv("main", {
              ...graphed,
              line: true,
              probe: { x: st.m },
              guide: { x: st.m, y, labels: false },
            }),
            ms,
          );
          if (!live()) return;
          ctx.expr(eqHtml(m, y, st.m));
          ctx.say(c.any.say);
          if (st.seen.length >= 3) {
            ctx.feedback(c.any.done);
            ctx.unlock();
          } else ctx.feedback(c.any.progress(st.seen.length), "cue");
          ctx.save();
        };
        ctx.panel.append(
          ctx.range({
            label: c.any.label,
            min: 1,
            max: m.xMax,
            value: st.m,
            onInput: (x) => {
              st.m = x;
              if (!st.seen.includes(x)) st.seen.push(x);
              show(120);
            },
          }),
        );
        await show(500);
      },
    },
    {
      id: "other",
      label: WHAT_IF,
      gate: true,
      async enter(ctx, saved) {
        const spec = (second) => ({ ...graphed, line: true, second });
        await ctx.tween(mv("main", spec(!!saved.solved)), 400);
        ctx.expr(saved.solved ? hi(`${m.vars.y} = ${fmt(v.other.k, m.cents)}${m.vars.x}`) : "");
        ctx.say(c.other.say);
        choose(ctx, saved, {
          ...c.other,
          win: async () => {
            ctx.expr(hi(`${m.vars.y} = ${fmt(v.other.k, m.cents)}${m.vars.x}`));
            await ctx.tween(mv("main", spec(true)), 700);
          },
        });
      },
    },
    {
      id: "transfer",
      label: LBL.transfer,
      async enter(ctx, saved) {
        const solved = { ...tbase, plot: idx(tn), line: true };
        await ctx.tween(mv("transfer", saved.solved ? solved : tbase), 500);
        ctx.expr(saved.solved ? hi(c.rule(t)) : "");
        ctx.say(c.transfer.say);
        choose(ctx, saved, {
          ...c.transfer,
          miss: miss("transfer", t, ctx),
          win: async () => {
            ctx.expr(hi(c.rule(t)));
            await ctx.tween(mv("transfer", solved), 800);
          },
        });
        ctx.panel.append(ctx.frame({ label: c.transfer.explain, frame: c.transfer.frame }));
      },
    },
  ];
}

export function applyScenes(kit) {
  const { v, copy: c, hi, lo, mv, choose, buttons } = kit;
  const m = v.main;
  const t = v.transfer;
  const n = rowsOf(m).length;
  const X = m.vars.x;
  const Y = m.vars.y;
  const k = fmt(m.k);
  const graphed = { table: true, rows: n, axes: true, plot: idx(n), line: true };
  const eq = (x, y) => `${hi(Y)} = ${k} × ${hi(fmt(x))} = ${lo(fmtY(m, y))}`;
  const tspec = {
    table: true,
    rows: t.xs.length,
    axes: true,
    plot: idx(t.xs.length),
    line: true,
    goal: true,
  };
  return [
    {
      id: "situate",
      label: LBL.situate,
      async enter(ctx) {
        await ctx.tween(mv("main", {}), 0);
        await ctx.tween(mv("main", graphed), 700);
        ctx.expr(hi(c.eq));
        ctx.say(c.situate);
      },
    },
    {
      id: "predict",
      label: LBL.predict,
      gate: true,
      async enter(ctx, saved) {
        const solved = {
          ...graphed,
          probe: { x: v.ask.x },
          guide: { x: v.ask.x, y: yOf(m, v.ask.x) },
        };
        await ctx.tween(mv("main", saved.solved ? solved : graphed), 400);
        ctx.expr(saved.solved ? eq(v.ask.x, yOf(m, v.ask.x)) : hi(c.eq));
        ctx.say(c.predict.say);
        choose(ctx, saved, {
          ...c.predict,
          miss: (o) => ctx.tween(mv("main", { ...graphed, ghost: { x: v.ask.x, y: o.y } }), 350),
          win: async () => {
            ctx.expr(eq(v.ask.x, yOf(m, v.ask.x)));
            await ctx.tween(mv("main", solved), 700);
          },
        });
      },
    },
    {
      id: "how",
      label: SLIDE,
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.h = Number.isInteger(st.h) && st.h >= 1 && st.h <= m.xMax ? st.h : m.xs[1];
        st.seen = cleanNums(st.seen);
        const live = kit.live(ctx);
        const show = async (ms) => {
          const y = yOf(m, st.h);
          await ctx.tween(
            mv("main", { ...graphed, probe: { x: st.h }, guide: { x: st.h, y, labels: false } }),
            ms,
          );
          if (!live()) return;
          ctx.expr(eq(st.h, y));
          ctx.say(c.how.say);
          if (st.seen.length >= 3) {
            ctx.feedback(c.how.done);
            ctx.unlock();
          } else ctx.feedback(c.how.progress(st.seen.length), "cue");
          ctx.save();
        };
        ctx.panel.append(
          ctx.range({
            label: c.how.label,
            min: 1,
            max: m.xMax,
            value: st.h,
            onInput: (x) => {
              st.h = x;
              if (!st.seen.includes(x)) st.seen.push(x);
              show(120);
            },
          }),
        );
        await show(500);
      },
    },
    {
      id: "when",
      label: { en: "When is…?", es: "¿Cuándo es…?" },
      gate: true,
      async enter(ctx) {
        const st = ctx.state;
        st.tried = cleanNums(st.tried).filter((i) => i >= 0 && i < v.goals.length);
        if (!Number.isInteger(st.cur)) st.cur = -1;
        const live = kit.live(ctx);
        const show = async (ms) => {
          const g = v.goals[st.cur];
          const x = v.goalXs[st.cur];
          await ctx.tween(
            mv(
              "main",
              g == null ? graphed : { ...graphed, probe: { x, y: g }, guide: { x, y: g } },
            ),
            ms,
          );
          if (!live()) return;
          ctx.expr(g == null ? hi(c.eq) : hi(c.when.result(g, x)[ctx.lang]));
          ctx.say(c.when.say);
          if (st.tried.length >= 2) {
            ctx.feedback(c.when.done);
            ctx.unlock();
          } else ctx.feedback(c.when.progress(st.tried.length), "cue");
          ctx.save();
        };
        ctx.panel.append(
          buttons(
            ctx,
            c.when.group,
            v.goals.map((g, i) => ({
              label: c.when.label(g),
              pressed: () => i === st.cur,
              onClick: async () => {
                st.cur = i;
                if (!st.tried.includes(i)) st.tried.push(i);
                await show(700);
              },
            })),
          ),
        );
        await show(400);
      },
    },
    {
      id: "solve",
      label: SOLVE,
      gate: true,
      async enter(ctx, saved) {
        const spec = { ...graphed, note: c.solve.note.map((p) => ctx.L(p)) };
        await ctx.tween(mv("main", spec), 500);
        ctx.expr(hi(`${k}${X} = ${fmt(v.solve.target)}`));
        ctx.say(c.solve.say);
        choose(ctx, saved, {
          ...c.solve,
          win: () => {
            const h = v.solve.target / m.k;
            ctx.expr(`${k}${X} = ${fmt(v.solve.target)} → ${hi(X)} = ${lo(fmt(h))}`);
          },
        });
      },
    },
    {
      id: "transfer",
      label: LBL.transfer,
      async enter(ctx, saved) {
        const need = v.need;
        const solved = {
          ...tspec,
          probe: { x: need },
          guide: { x: need, y: yOf(t, need), labels: false },
        };
        await ctx.tween(mv("transfer", saved.solved ? solved : tspec), 600);
        ctx.expr(hi(`${fmt(t.k)}${t.vars.x} = ${fmt(t.goal)}`));
        ctx.say(c.transfer.say);
        choose(ctx, saved, {
          ...c.transfer,
          miss: (o) =>
            ctx.tween(mv("transfer", { ...tspec, ghost: { x: o.n, y: yOf(t, o.n) } }), 400),
          win: async () => {
            await ctx.tween(mv("transfer", solved), 700);
          },
        });
        ctx.panel.append(ctx.frame({ label: c.transfer.explain, frame: c.transfer.frame }));
      },
    },
  ];
}
