/**
 * Small-cell suppression with complementary suppression. A published aggregate is a set of atoms (the finest
 * cells, known only to this engine) plus its true size n. An attacker holding the published numbers can subtract:
 * a published total minus the published cells nested inside it gives the size of what is left. If what is left is
 * a real group smaller than the minimum cell size, that subtraction isolates it even though the group itself was
 * never published. This module (1) suppresses every cell under the minimum, then (2) repeatedly finds such
 * differencing leaks and suppresses the smallest participating published cell until none remain.
 *
 * Scope and limit: the attacker model is a fixed published family of cells (total, per-option, per-slice,
 * per-tier, failures) with subtraction of nested cells, singly and as a disjoint family. Arbitrary
 * ad-hoc queries are out of scope by design: this engine only ever publishes the fixed family.
 */
import { DEFAULTS } from "./constants.js";

const sizeOf = (atoms, atomN) => atoms.reduce((n, a) => n + (atomN.get(a) || 0), 0);

function strictSubsets(cell, cells) {
  const set = new Set(cell.atoms);
  return cells.filter(
    (b) =>
      b.id !== cell.id && b.atoms.length < cell.atoms.length && b.atoms.every((a) => set.has(a)),
  );
}

function disjointFamily(subsets) {
  const taken = new Set();
  const family = [];
  for (const b of [...subsets].sort(
    (x, y) => y.atoms.length - x.atoms.length || x.id.localeCompare(y.id),
  )) {
    if (b.atoms.some((a) => taken.has(a))) continue;
    for (const a of b.atoms) taken.add(a);
    family.push(b);
  }
  return family;
}

/** Differencing leaks over the PUBLISHED (unsuppressed) cells: [{total, removed:[cell], residualN}] */
export function differencingLeaks(cells, atomN, minCell = DEFAULTS.minCell) {
  const published = cells.filter((c) => !c.suppressed);
  const leaks = [];
  for (const total of published) {
    const subsets = strictSubsets(total, published);
    const groups = subsets.map((b) => [b]);
    if (subsets.length > 1) groups.push(disjointFamily(subsets));
    for (const removed of groups) {
      const gone = new Set(removed.flatMap((b) => b.atoms));
      const residual = total.atoms.filter((a) => !gone.has(a));
      const n = sizeOf(residual, atomN);
      if (residual.length && n > 0 && n < minCell) leaks.push({ total, removed, residualN: n });
    }
  }
  return leaks;
}

/** Returns the cells with `suppressed: true` on every cell that must not be published. Input is not mutated. */
export function suppressCells(cells, atomN, minCell = DEFAULTS.minCell) {
  const out = cells.map((c) => ({ ...c, suppressed: sizeOf(c.atoms, atomN) < minCell }));
  for (let guard = 0; guard < out.length * out.length + 1; guard++) {
    const leaks = differencingLeaks(out, atomN, minCell);
    if (!leaks.length) return out;
    const victim = leaks
      .flatMap((l) => l.removed)
      .sort(
        (a, b) => sizeOf(a.atoms, atomN) - sizeOf(b.atoms, atomN) || a.id.localeCompare(b.id),
      )[0];
    out.find((c) => c.id === victim.id).suppressed = true;
  }
  throw new Error("suppression did not converge");
}

export { sizeOf as cellSize };
