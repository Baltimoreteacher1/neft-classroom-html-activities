// Interactive-notebook foldables: pages with cut lines (dashed) and fold lines (solid) and writing space inside.
import { B, chunk, keyPages, page, top } from "./kit.js";

const tpl = (extra) => ({ bands: ["k-2", "3-5", "6-8"], needs: null, options: [], family: "Interactive notebook", ...extra });

function labelsFor(ctx, max) {
  if (ctx.entries.length) return ctx.entries.map((e) => e.word);
  if (ctx.lesson?.threeWays) return [ctx.lesson.threeWays.see?.title || "See", ctx.lesson.threeWays.discuss?.title || "Discuss", ctx.lesson.threeWays.apply?.title || "Apply"].slice(0, max);
  return ["See", "Discuss", "Apply"];
}

function foldPages(ctx, kind, per, makeFlap) {
  const labels = labelsFor(ctx, per);
  const entries = ctx.entries.length ? ctx.entries : null;
  return chunk(labels, per).map((set, pi) => {
    const hMm = Math.min(150, Math.floor(ctx.bodyH - 110));
    const flaps = set.map((l, i) => makeFlap(l, entries?.[pi * per + i], hMm));
    return page([
      ...top(ctx, ctx.title ? `${ctx.title}: foldable` : "Foldable", ctx.k2 ? "Cut on the dashed lines. Fold on the solid line. Draw and write under each flap." : "Cut on the dashed lines and fold on the solid line. Glue the back into your notebook, then write under each flap.", labels.length > per ? `Foldable ${pi + 1}` : ""),
      B.fold({ kind, flaps, hMm }),
    ]);
  });
}

const flaps = tpl({
  id: "foldable-flaps",
  label: "Foldable: vocabulary flap book",
  blurb: "Three flaps per page, one word on each. Cut between flaps, fold, and write the meaning underneath.",
  keyed: true,
  notes: {
    purpose: "A flap book students make and keep in an interactive notebook.",
    prep: ["Print one page per student. Practice the fold once yourself."],
    use: ["Students write the meaning, an example and a picture under each flap.", "Quiz yourself: read the front, say the meaning, lift the flap to check."],
  },
  build(ctx) {
    const per = ctx.opts.flaps ? Number(ctx.opts.flaps) : ctx.k2 ? 3 : 4;
    const n = ctx.k2 ? 2 : 4;
    const pages = foldPages(ctx, "flaps", per, (l, e) => ({ label: ctx.bilingual && e?.es ? `${l} / ${e.es.word}` : l, n }));
    const key = ctx.entries.length ? keyPages(ctx, "flap book", ctx.entries.map((e) => [{ t: e.word, kind: "label" }, { t: [e.def, e.context].filter(Boolean).join("  ") }]), [], { head: ["Word", "Meaning and example"], cols: [1.4, 4] }) : null;
    return { pages, key };
  },
  options: [{ id: "flaps", label: "Flaps per page", choices: [{ v: "3", label: "3 flaps" }, { v: "4", label: "4 flaps" }], default: { "k-2": "3", "3-5": "4", "6-8": "4" } }],
});

const layers = tpl({
  id: "foldable-layered",
  label: "Foldable: layered look-book",
  blurb: "Stacked strips with the label showing. Cut out, stack, staple at the top, write on each layer.",
  notes: {
    purpose: "A layered book that shows a short list of key ideas with room to explain each.",
    prep: ["Print one page per student; students cut out the strips on the dashed lines."],
    use: ["Stack the strips with the longest at the bottom and staple the top edge.", "Write the meaning and an example on each layer."],
  },
  build(ctx) {
    const per = ctx.k2 ? 3 : 4;
    return { pages: foldPages(ctx, "layers", per, (l, e) => ({ label: ctx.bilingual && e?.es ? `${l} / ${e.es.word}` : l, n: ctx.k2 ? 2 : 3 })) };
  },
});

const STEPS = { math: ["Read", "Plan", "Solve", "Check"], science: ["Ask", "Plan", "Observe", "Explain"], "social-studies": ["Who", "What", "When and where", "Why it matters"], ela: ["Before", "During", "After", "My thinking"] };
const accordion = tpl({
  id: "foldable-accordion",
  label: "Foldable: accordion (process or sequence)",
  blurb: "A fan-fold strip for the steps of a process. Labels follow the subject's own routine.",
  notes: {
    purpose: "Record a process or routine step by step in a compact fan-fold.",
    prep: ["Print one strip per student."],
    use: ["Fold along the solid lines like a fan.", "Write one step in each panel and draw a quick picture."],
  },
  build(ctx) {
    const steps = ctx.lesson?.teach?.moves?.length ? ctx.lesson.teach.moves.slice(0, 5).map((m, i) => (typeof m === "string" ? `Step ${i + 1}` : m.label || `Step ${i + 1}`)) : STEPS[ctx.subject] || ["Step 1", "Step 2", "Step 3", "Step 4"];
    const hMm = Math.min(120, Math.floor(ctx.bodyH - 120));
    return { pages: [page([...top(ctx, ctx.title ? `${ctx.title}: steps` : "Steps", "Cut the dashed outline. Fold on each solid line like a fan. Write one step in each panel."), B.fold({ kind: "accordion", hMm, flaps: steps.map((l) => ({ label: l, n: 4 })) })])] };
  },
});

export const FOLDABLE_TEMPLATES = [flaps, layers, accordion];
