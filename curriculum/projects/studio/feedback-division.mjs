/** Division missions: seating rounds up, purchases round down, material quotients can be fractional. */
import { fmt, isWhole, trap, usd } from "./feedback-util.mjs";
export const WORDS = {
  "pre-unit-a": { who: "guests", group: "seating group", stuff: "banner roll", piece: "banner strip" },
  "unit-1-a": { who: "guests", group: "table", stuff: "streamer roll", piece: "streamer" },
  "unit-1-b": { who: "crew members", group: "build crew", stuff: "wire", piece: "wire segment" },
  "unit-1-c": { who: "crew members", group: "shuttle", stuff: "cable", piece: "cable segment" },
};
export function spec(project, v) {
  const { a, b, c, d, e, f } = v;
  const W = WORDS[project.id];
  const full = Math.floor(a / b);
  const rem = a % b;
  const packs = Math.floor((c + 1e-9) / d);
  const pieces = Math.floor((e + 1e-9) / f);
  return {
    groups: {
      traps: [
        trap("floor-quotient", rem ? full : [], (s) =>
          `${s} ${W.group}${s === 1 ? "" : "s"} of ${b} hold ${s * b} of the ${a} ${W.who}, so some ${W.who} would have no place. A partly filled ${W.group} still has to exist.`),
        trap("fraction-of-group", isWhole(a / b) ? [] : a / b, () =>
          `A fraction of a ${W.group} cannot seat anyone. ${W.group[0].toUpperCase()}${W.group.slice(1)}s are counted as whole numbers.`),
        trap("gave-remainder", rem ? rem : [], () =>
          `That number is how many ${W.who} are left after the full ${W.group}s are filled. The question asks how many ${W.group}s are needed.`),
      ],
      verify: (s) =>
        !isWhole(s) || s < 1
          ? `The number of ${W.group}s must be a whole number of at least 1; ${fmt(s)} is not.`
          : s * b < a
            ? `${s} ${W.group}${s === 1 ? "" : "s"} of ${b} hold ${s * b}, but there are ${a} ${W.who}. That is not enough room.`
            : `${s} ${W.group}s hold ${s * b}, and ${s - 1} would already hold ${(s - 1) * b}, which is at least ${a}. You have more ${W.group}s than needed.`,
      next: `Divide ${a} by ${b}, then decide what the remainder means for seating.`,
    },
    remainder: {
      traps: [
        trap("gave-groups", full, () => `That is the number of full ${W.group}s, not the number of ${W.who} left over.`),
        trap("gave-all-groups", Math.ceil(a / b), () => `That counts every ${W.group}, including the partly filled one. The question asks how many ${W.who} are IN the last one.`),
        trap("gave-empty-seats", rem ? b - rem : [], () => `That counts the empty places in the last ${W.group}. The question asks how many ${W.who} are in it.`),
      ],
      verify: (s) =>
        !isWhole(s) || s < 0
          ? `A leftover count is a whole number of ${W.who}, 0 or more; ${fmt(s)} is not.`
          : s >= b
            ? `A leftover of ${s} would fill a whole ${W.group} of ${b}. The leftover must be less than ${b}.`
            : `If ${s} are left over, the full ${W.group}s hold ${a} − ${s} = ${a - s} ${W.who}. ${a - s} ÷ ${b} = ${fmt((a - s) / b)}, which should be a whole number.`,
      next: `Fill whole ${W.group}s of ${b}, then subtract what they hold from ${a}.`,
    },
    packs: {
      traps: [
        trap("rounded-up", isWhole(c / d) ? [] : Math.ceil(c / d), (s) =>
          `${s} packs would cost ${s} × ${usd(d)} = ${usd(s * d)}, which is more than the ${usd(c)} budget. A partial pack is not sold.`),
        trap("kept-fraction", isWhole(c / d) ? [] : c / d, () =>
          `The quotient has a fraction of a pack in it, and packs are sold whole.`),
        trap("multiplied", c * d, () => `That multiplies the budget by the price. Buying packs asks how many prices fit inside the budget.`),
      ],
      verify: (s) =>
        !isWhole(s) || s < 0
          ? `A number of packs is a whole number, 0 or more; ${fmt(s)} is not.`
          : s * d > c
            ? `${s} packs cost ${s} × ${usd(d)} = ${usd(s * d)}, which is more than the ${usd(c)} budget.`
            : `${s} packs cost ${usd(s * d)}, which leaves ${usd(c - s * d)} of the ${usd(c)} budget. That leftover is still enough for another ${usd(d)} pack.`,
      next: `Work out how many times ${usd(d)} fits into ${usd(c)} (multiply both by 100 to remove decimals), and keep only complete packs.`,
    },
    money: {
      traps: [
        trap("gave-spent", packs * d, () => `That is the money spent on packs. The question asks how much of the budget is left.`),
        trap("over-bought", isWhole(c / d) ? [] : c - Math.ceil(c / d) * d, () => `A negative balance means the order costs more than the budget. Buy only the complete packs that fit.`),
      ],
      verify: (s) =>
        s < 0
          ? `The complete packs fit inside the ${usd(c)} budget, so the money left cannot be negative; ${usd(s)} is below zero.`
          : s > c
            ? `You cannot have more left (${usd(s)}) than the whole budget (${usd(c)}).`
            : `If ${usd(s)} is left, you spent ${usd(c)} − ${usd(s)} = ${usd(c - s)}. ${usd(c - s)} ÷ ${usd(d)} = ${fmt((c - s) / d)} packs, which should be a whole number.`,
      next: `Multiply the complete packs by ${usd(d)}, then subtract from ${usd(c)}.`,
    },
    quotient: {
      traps: [
        trap("multiplied", e * f, () => `That multiplies the lengths. Dividing asks how many ${fmt(f)} m pieces fit into ${fmt(e)} m.`),
        trap("flipped", f / e, () => `That divides the piece length by the material length; the quotient asks how many pieces fit in the material, so the material comes first.`),
        trap("whole-pieces-only", isWhole(e / f) ? [] : pieces, () => `That counts only the complete pieces. This question asks for the exact quotient, which can include a fraction of a piece.`),
      ],
      verify: (s) =>
        `${fmt(s)} pieces of ${fmt(f)} m would be ${fmt(s * f)} m, but the material is ${fmt(e)} m. The quotient times the piece length must give back ${fmt(e)}.`,
      next: `Draw ${fmt(e)} m split into ${fmt(f)} m pieces, or multiply by the reciprocal of ${fmt(f)}.`,
    },
    leftover: {
      traps: [
        trap("fraction-left", isWhole(e / f) ? [] : e / f - pieces, () => `That is the fraction of a piece left over. The question asks for the leftover length in meters.`),
        trap("gap-to-next", isWhole(e / f) ? [] : f - (e - pieces * f), () => `That is how much more material would make one more piece. The question asks how much is left over now.`),
        trap("over-cut", isWhole(e / f) ? [] : e - Math.ceil(e / f) * f, () => `A negative leftover would mean cutting more than you have. Cut only the full pieces.`),
      ],
      verify: (s) =>
        s < 0 || s >= e
          ? `The leftover must be at least 0 m and less than the ${fmt(e)} m you started with; ${fmt(s)} m is not.`
          : s >= f
            ? `A leftover of ${fmt(s)} m is long enough for another ${fmt(f)} m piece, so more pieces can still be cut.`
            : `If ${fmt(s)} m is left over, ${fmt(e)} − ${fmt(s)} = ${fmt(e - s)} m was cut into ${fmt(f)} m pieces. That is ${fmt((e - s) / f)} pieces, which should be a whole number.`,
      next: `Multiply the number of full pieces by ${fmt(f)} m, then subtract from ${fmt(e)} m.`,
    },
  };
}
