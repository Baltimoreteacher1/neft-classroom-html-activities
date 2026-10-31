// Gallery of the eight explainer animations with a few parameter variants each. ?lang=es shows Spanish,
// ?autoplay=0 keeps them paused. Handles are exposed on window.__animations for the browser test.
import { setLang } from "../../i18n.js";
import { playAnimation } from "../registry.js";

const params = new URLSearchParams(location.search);
const lang = params.get("lang") === "es" ? "es" : "en";
setLang(lang, { persist: false });
const autoplay = params.get("autoplay") !== "0";

const SECTIONS = [
  { kind: "fraction-equivalence", title: "Equivalent fractions", variants: [{ config: {} }, { config: { fraction: { n: 2, d: 3 }, splits: [2, 3] } }] },
  {
    kind: "fraction-addition",
    title: "Adding fractions with unlike denominators",
    variants: [{ config: {} }, { config: { a: { n: 3, d: 4 }, b: { n: 2, d: 3 } } }, { config: { a: { n: 1, d: 6 }, b: { n: 1, d: 3 } } }],
  },
  {
    kind: "regrouping",
    title: "Regrouping with place-value blocks",
    variants: [{ config: {} }, { config: { op: "sub" } }, { config: { op: "sub", a: 300, b: 148 } }, { config: { op: "add", a: 276, b: 358 } }],
  },
  { kind: "multiplication-grouping", title: "Equal groups to an array", variants: [{ config: {} }, { config: { groups: 7, size: 8 } }] },
  { kind: "ratio-scaling", title: "Scaling a ratio", variants: [{ config: {} }, { config: { a: 5, b: 2, factors: [2, 4] } }] },
  { kind: "coordinate-movement", title: "Moving on the coordinate plane", variants: [{ config: {} }] },
  {
    kind: "area-decomposition",
    title: "Area model",
    variants: [
      { config: { kind: "number", a: 13, b: 7 } },
      { config: { kind: "number", a: 3.4, b: 2.5, splitB: "auto" } },
      { config: { kind: "number", a: 24, b: 13, splitB: "auto" } },
      { config: { kind: "algebra", a: { x: 1, c: 3 }, b: { x: 1, c: 5 } } },
    ],
  },
  { kind: "transformation", title: "Transformations of a polygon", variants: [{ config: {} }] },
];

const root = document.getElementById("gallery");
window.__animations = [];
for (const section of SECTIONS) {
  const wrap = document.createElement("section");
  wrap.className = "gallery-item";
  wrap.dataset.kind = section.kind;
  const heading = document.createElement("h2");
  heading.textContent = section.title;
  wrap.append(heading);
  root.append(wrap);
  for (const [index, variant] of section.variants.entries()) {
    const slot = document.createElement("div");
    slot.dataset.slot = `${section.kind}:${index}`;
    wrap.append(slot);
    playAnimation(section.kind, slot, { lang, autoplay, ...variant.config }).then((handle) => {
      window.__animations.push({ kind: section.kind, index, slot, handle });
    });
  }
}
