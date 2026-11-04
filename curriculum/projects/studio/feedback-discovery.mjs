/** Discovery mission: a growing pattern counted as groups plus extras; a mistaken reading multiplies the extras too. */
import { fmt, trap } from "./feedback-util.mjs";
export const judged = [
  "Whether your drawings or groups show the first four stages clearly",
  "Your two ways of counting the same stage and why they must agree",
  "The visitor question you write and how well it can be solved and explained",
];
export function facts(project, by, v, ok) {
  const out = [];
  if (ok("one", "two", "three")) out.push(`Stages 1, 2 and 3 have ${fmt(by.one)}, ${fmt(by.two)} and ${fmt(by.three)} tiles: each stage adds ${fmt(v.a)}.`);
  if (ok("target", "repair")) out.push(`The mistaken reading counts ${fmt(by.repair - by.target)} more tiles than the drawing at stage ${v.c}, because it counts the ${fmt(v.b)} extra tiles once for every group.`);
  return out;
}
export function spec(project, v) {
  const { a, b, c } = v;
  const stage = (n) => ({
    traps: [
      trap("forgot-extras", n * a, () => `That counts the ${n} group${n === 1 ? "" : "s"} of ${a} only. The ${b} extra tiles stay in every stage.`),
      trap("extras-per-group", n * (a + b), () => `That counts the ${b} extra tiles once in every group. They appear only once in the whole stage.`),
      trap("swapped", n * b + a, () => `That swaps the roles: each group has ${a} tiles and the extras are ${b} tiles in all.`),
      trap("gave-stage", n, () => `That is the stage number. The question asks for the number of tiles in that stage.`),
    ],
    verify: (s) => `If stage ${n} has ${fmt(s)} tiles and ${b} of them are the extras, the other ${fmt(s - b)} tiles must make ${n} equal group${n === 1 ? "" : "s"}: ${fmt(s - b)} ÷ ${n} = ${fmt((s - b) / n)} tiles per group, but each group has ${a}.`,
    next: `Count the ${n} group${n === 1 ? "" : "s"} of ${a} first, then add the ${b} extra tiles once.`,
  });
  return {
    one: stage(1),
    two: stage(2),
    three: stage(3),
    target: stage(c),
    change: {
      traps: [
        trap("gave-extras", b, () => `That is the number of extra tiles, which stay the same in every stage. The question asks how many NEW tiles each stage adds.`),
        trap("gave-first-stage", a + b, () => `That is the count at stage 1. The question compares two neighboring stages.`),
      ],
      verify: (s) => `If each stage added ${fmt(s)} tiles, stage 2 would have ${fmt(a + b + s)} tiles (stage 1 plus ${fmt(s)}), but your stage 2 drawing does not.`,
      next: `Subtract the count of stage 1 from the count of stage 2.`,
    },
    repair: {
      traps: [
        trap("correct-count", c * a + b, () => `That is the count that matches the drawing. The question asks what the MISTAKEN method counts: ${a} groups of (${c} + ${b}).`),
        trap("forgot-groups", c + b, () => `That is ${c} + ${b}, one group's worth. The mistaken method counts ${a} groups of that.`),
        trap("multiplied-three", a * b * c, () => `That multiplies all three numbers. The mistaken method adds ${c} and ${b} first, then multiplies by ${a}.`),
      ],
      verify: (s) => `${fmt(s)} ÷ ${a} groups is ${fmt(s / a)} tiles in each group, but the mistaken method puts ${c} + ${b} tiles in each group.`,
      next: `Work out ${c} + ${b} first, then multiply by ${a}.`,
    },
  };
}
