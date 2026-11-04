/**
 * Independent wrong-answer probes for the stage 3C families (area, coordinates, equations, relationships,
 * solids, discovery, synthesis). Each entry lists [code, exact value] pairs computed with rational
 * arithmetic from the design alone; null means the pattern does not apply to this design. The test types
 * each value into the Studio and requires the engine to flag it with one of the codes listed here.
 */
import { absRat, rat } from "./project-studio-oracle.mjs";

const R = rat;
const cmp = (x, y) => {
  const d = x.sub(y);
  return d.n < 0n ? -1 : d.n > 0n ? 1 : 0;
};
const two = R(2);

export const probesB = {
  area(x) {
    const { a, b, c, d, e, f, g, h } = x;
    const rect = a.mul(b),
      tri = c.mul(d).div(two),
      vol = f.mul(g).mul(h);
    const sa = two.mul(f.mul(g).add(f.mul(h)).add(g.mul(h)));
    return {
      rectangle: [
        ["perimeter", two.mul(a.add(b))],
        ["added", a.add(b)],
        ["halved", rect.div(two)],
      ],
      triangle: [
        ["forgot-half", c.mul(d)],
        ["added", c.add(d)],
        ["halved-twice", c.mul(d).div(R(4))],
        ["halved-floor", rect.div(two)],
      ],
      composite: [
        ["only-rectangle", rect],
        ["only-triangle", tri],
        ["full-rectangle-nook", rect.add(c.mul(d))],
        ["multiplied", rect.mul(tri)],
      ],
      "floor-cost": [
        ["area-only", rect.add(tri)],
        ["rectangle-only", rect.mul(e)],
        ["added-rate", rect.add(tri).add(e)],
      ],
      volume: [
        ["surface", sa],
        ["base-only", f.mul(g)],
        ["added", f.add(g).add(h)],
      ],
      surface: [
        ["volume", vol],
        ["three-faces", f.mul(g).add(f.mul(h)).add(g.mul(h))],
        ["five-faces", sa.sub(f.mul(g))],
        ["walls-only", two.mul(f.mul(h).add(g.mul(h)))],
      ],
    };
  },
  coordinates(x) {
    const { a, b, c } = x;
    const zero = R(0);
    const bigger = cmp(absRat(a), absRat(c)) >= 0 ? a : c;
    return {
      distance: [
        ["signed", cmp(c, a) < 0 ? c.sub(a) : null],
        ["added-absolutes", absRat(a).add(absRat(c))],
        ["ignored-sides", absRat(absRat(a).sub(absRat(c)))],
      ],
      "a-zero": [
        ["signed", cmp(a, zero) < 0 ? a : null],
        ["used-b", absRat(b)],
        ["used-c", absRat(c)],
      ],
      "reflect-x": [
        ["no-change", a],
        ["wrong-axis", b.neg()],
        ["gave-y", b],
      ],
      "reflect-y": [
        ["no-change", b],
        ["wrong-axis", a.neg()],
        ["gave-x", a],
      ],
      opposite: [
        ["half", absRat(b)],
        ["signed", cmp(b, zero) < 0 ? two.mul(b) : null],
        ["y-axis-pair", two.mul(absRat(a))],
      ],
      compare: [
        ["larger-absolute", bigger],
        ["smaller", cmp(a, c) <= 0 ? a : c],
      ],
    };
  },
  equations(x) {
    const { a, b, c } = x;
    const one = R(1);
    return {
      addition: [
        ["added-again", a.add(two.mul(b))],
        ["gave-right-side", a.add(b)],
        ["gave-added", b],
      ],
      multiplication: [
        ["multiplied", c.mul(c).mul(a)],
        ["gave-right-side", c.mul(a)],
        ["subtracted", c.mul(a).sub(c)],
        ["gave-coefficient", c],
      ],
      substitution: [
        ["gave-solution", a],
        ["multiplied", a.mul(b)],
        ["subtracted", a.sub(b)],
      ],
      boundary: [
        ["above-boundary", a.add(one)],
        ["below-boundary", a.sub(one)],
      ],
      strict: [
        ["included-boundary", a],
        ["two-above", a.add(two)],
        ["half-above", a.add(R("0.5"))],
      ],
      difference: [
        ["gave-left", c.mul(a.add(one))],
        ["gave-right", c.mul(a)],
        ["gave-one", one],
        ["gave-proposed", a.add(one)],
      ],
    };
  },
  relationships(x) {
    const { a, b, c } = x;
    const zero = R(0);
    return {
      zero: [
        ["gave-rate", a],
        ["added-rate", a.add(b)],
        ["gave-zero", zero],
      ],
      one: [
        ["gave-rate", a],
        ["gave-start", b],
        ["multiplied", a.mul(b)],
      ],
      two: [
        ["forgot-start", two.mul(a)],
        ["doubled-everything", two.mul(a.add(b))],
        ["added-input", a.add(b).add(two)],
      ],
      target: [
        ["forgot-start", a.mul(c)],
        ["added-all", a.add(b).add(c)],
        ["multiplied-sum", a.add(b).mul(c)],
      ],
      increase: [
        ["gave-start", b],
        ["gave-output", a.add(b)],
      ],
      delta: [
        ["forgot-subtract", a.mul(c)],
        ["gave-input-gap", c.sub(two)],
        ["added-start", a.mul(c.sub(two)).add(b)],
        ["gave-target", a.mul(c).add(b)],
      ],
    };
  },
  solids(x, project) {
    const { a, b, c, d, e } = x;
    const open = project.id === "unit-10-b";
    const floor = a.mul(b),
      vol = floor.mul(c);
    const walls = two.mul(a).mul(c).add(two.mul(b).mul(c));
    const sa = (open ? floor : two.mul(floor)).add(walls);
    return {
      floor: [
        ["perimeter", two.mul(a.add(b))],
        ["added", a.add(b)],
        ["volume", vol],
      ],
      volume: [
        ["base-only", floor],
        ["surface", sa],
        ["added", a.add(b).add(c)],
      ],
      pair: [
        ["one-face", a.mul(c)],
        ["other-pair", two.mul(b).mul(c)],
        ["all-four", walls],
        ["base-pair", two.mul(floor)],
      ],
      surface: [
        ["volume", vol],
        ["three-faces", floor.add(a.mul(c)).add(b.mul(c))],
        ["wrong-face-count", open ? sa.add(floor) : sa.sub(floor)],
        ["walls-only", walls],
      ],
      cost: [
        ["area-only", sa],
        ["volume-priced", vol.mul(d)],
        ["added-rate", sa.add(d)],
      ],
      capacity: [
        ["sign-flipped", e.sub(vol)],
        ["gave-volume", vol],
        ["gave-target", e],
      ],
    };
  },
  discovery(x) {
    const { a, b, c } = x;
    const stage = (n) => [
      ["forgot-extras", n.mul(a)],
      ["extras-per-group", n.mul(a.add(b))],
      ["swapped", n.mul(b).add(a)],
      ["gave-stage", n],
    ];
    return {
      one: stage(R(1)),
      two: stage(R(2)),
      three: stage(R(3)),
      target: stage(c),
      change: [
        ["gave-extras", b],
        ["gave-first-stage", a.add(b)],
      ],
      repair: [
        ["correct-count", c.mul(a).add(b)],
        ["forgot-groups", c.add(b)],
        ["multiplied-three", a.mul(b).mul(c)],
      ],
    };
  },
  synthesis(x) {
    const { a, b, c, d, e, f } = x;
    const h = R(100);
    const area = a.mul(b),
      subtotal = area.mul(c),
      discount = subtotal.mul(d).div(h),
      materials = subtotal.sub(discount);
    return {
      area: [
        ["perimeter", two.mul(a.add(b))],
        ["added", a.add(b)],
      ],
      subtotal: [
        ["gave-area", area],
        ["priced-perimeter", two.mul(a.add(b)).mul(c)],
        ["added-rate", area.add(c)],
      ],
      discount: [
        ["gave-percent", d],
        ["forgot-hundred", subtotal.mul(d)],
        ["gave-materials", materials],
        ["percent-of-area", area.mul(d).div(h)],
      ],
      materials: [
        ["gave-discount", discount],
        ["subtracted-percent", subtotal.sub(d)],
        ["added-discount", subtotal.add(discount)],
      ],
      total: [
        ["one-visitor", materials.add(e)],
        ["forgot-materials", e.mul(f)],
        ["undiscounted", subtotal.add(e.mul(f))],
        ["discounted-supplies", materials.add(e.mul(f).mul(h.sub(d)).div(h))],
      ],
      extra: [
        ["gave-rate", e],
        ["used-visitors", e.mul(f)],
        ["added-fixed", materials.add(R(10).mul(e))],
        ["gave-ten", R(10)],
      ],
    };
  },
};
