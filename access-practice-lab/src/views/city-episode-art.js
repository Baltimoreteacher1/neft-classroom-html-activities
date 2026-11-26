// Language City episode art: the Community Market as one original inline SVG (1200 x 560) and the small word pictures
// used for visual vocabulary. Drawn with the site illustration kit (src/art/kit.js) in its editorial picture-book style:
// no outlines, a lit side and a shade side, soft contact shadows, warm morning light from the upper left.
// Prices painted on the boards are read from the episode content, so the picture and the text can never disagree.
// The scene is drawn once per page; it still draws flat (noDefs) so it needs no ids.
import { ITEMS, PEOPLE, SPOTS } from "../content/city-market-episode.js";
import { money } from "../lang/city-market.js";
import {
  P,
  building,
  circle,
  contact,
  ellipse,
  haze,
  light,
  mix,
  noDefs,
  path,
  rect,
  rrect,
  shade,
  stroke,
  text,
  tree,
} from "../art/kit.js";
import { characterSVG } from "./scenario-art.js";

export const SCENE_W = 1200;
export const SCENE_H = 560;
const GROUND = 430;
const at = (id) => {
  const s = SPOTS.find((x) => x.id === id);
  return [(s.at[0] / 100) * SCENE_W, (s.at[1] / 100) * SCENE_H];
};
const price = (id) => money(ITEMS.find((i) => i.id === id).unitCents);
const CHALK = "#24384a";

// ── backdrop: a morning street of row houses behind the market ──────────────
function backdrop() {
  const far = (c) => haze(c, 0.28, "#e9f1ee");
  return (
    rect(0, 0, SCENE_W, 260, "#cfe5ec") +
    rect(0, 150, SCENE_W, 140, "#e7efe8", 'opacity=".9"') +
    circle(150, 70, 120, "#fff3cf", 'opacity=".45"') +
    circle(150, 70, 34, "#ffe9a8") +
    building(0, GROUND, 190, 300, { color: far(P.brick), windows: [3, 4], door: false }) +
    building(186, GROUND, 250, 250, {
      color: far("#efe2c9"),
      windows: [3, 2],
      door: true,
      sign: "Corner Market",
      awning: far(P.coral),
    }) +
    building(432, GROUND, 214, 316, { color: far("#5e8f88"), windows: [3, 4], door: false }) +
    building(642, GROUND, 244, 276, { color: far("#d9a65a"), windows: [4, 3], door: true }) +
    building(882, GROUND, 180, 300, { color: far(P.brick), windows: [2, 4], door: false }) +
    building(1058, GROUND, 150, 246, { color: far("#e8dcc6"), windows: [2, 3], door: true }) +
    tree(1150, GROUND + 4, 1.35, { kind: "round", seed: 7 }) +
    tree(28, GROUND + 4, 1.15, { kind: "round", seed: 3 })
  );
}

/** A string of flags across the street with the market's banner in the middle. */
function bunting() {
  const colors = [P.coral, P.gold, P.teal, P.ivory];
  let flags = "";
  for (let i = 0; i < 28; i += 1) {
    const x = 20 + i * 42;
    if (x > 470 && x < 730) continue;
    const t = (x - 600) / 600;
    const y = 112 + 26 * (1 - t * t) - 26;
    flags += path(`M${x} ${y}h26l-13 22Z`, colors[i % 4], i % 4 === 3 ? 'opacity=".95"' : "");
  }
  return (
    stroke("M0 92 Q600 140 1200 92", "#6d5a48", 2, 'fill="none" opacity=".55"') +
    flags +
    rrect(474, 74, 252, 56, 8, shade(P.navy, 0.25), 'opacity=".25" transform="translate(3 4)"') +
    rrect(474, 74, 252, 56, 8, P.navy) +
    rect(474, 74, 252, 8, light(P.navy, 0.18), 'rx="4"') +
    text(600, 111, "Community Market", { size: 25, fill: P.ivory })
  );
}

function pavement() {
  let b = rect(0, GROUND, SCENE_W, SCENE_H - GROUND, "#dcd4c6");
  b += rect(0, GROUND, SCENE_W, 10, "#c7bdad");
  for (let i = 0; i < 9; i += 1)
    b += stroke(
      `M${i * 150 - 40} ${SCENE_H}L${i * 150 + 30} ${GROUND + 10}`,
      "#c9bfae",
      1.4,
      'opacity=".7"',
    );
  b += stroke(
    `M0 ${GROUND + 58}H${SCENE_W}M0 ${GROUND + 100}H${SCENE_W}`,
    "#cbc1b1",
    1.2,
    'opacity=".6"',
  );
  // the morning light falling across the street
  b += path(`M0 ${GROUND}H520L760 ${SCENE_H}H0Z`, "#fff6dc", 'opacity=".22"');
  return b;
}

// ── a stall: posts and awning (behind the vendor), the table (in front) ─────
function stallBack(x, w, awning) {
  const n = 7;
  const step = (w + 20) / n;
  let b =
    rect(x + 8, 190, 8, GROUND - 190, P.woodDark) +
    rect(x + w - 16, 190, 8, GROUND - 190, P.woodDark);
  b += rect(x - 10, 176, w + 20, 18, shade(awning, 0.22));
  for (let i = 0; i < n; i += 1) {
    const sx = x - 10 + step * i;
    b += path(`M${sx} 190h${step}v34a${step / 2} 10 0 0 1 ${-step} 0Z`, i % 2 ? P.ivory : awning);
    b += path(
      `M${sx + step * 0.7} 190h${step * 0.3}v34a${step / 2} 10 0 0 1 ${-step * 0.3} 6Z`,
      "#1c2f4a",
      'opacity=".07"',
    );
  }
  return b;
}
function stallFront(x, w, cloth) {
  return (
    contact(x + w / 2, GROUND + 22, w * 0.56, 9, 0.2) +
    rect(x, 372, w, 10, P.woodLight) +
    rect(x + 4, 382, w - 8, 70, cloth) +
    rect(x + 4, 382, w - 8, 9, shade(cloth, 0.18)) +
    rect(x + w * 0.72, 382, w * 0.28 - 4, 70, shade(cloth, 0.12), 'opacity=".6"') +
    stroke(`M${x + 14} 418H${x + w - 14}`, light(cloth, 0.35), 3, 'opacity=".6"')
  );
}

/** A chalk price board hanging from an awning; `lines` are painted from the content. */
function priceBoard(cx, lines) {
  const w = 172;
  const h = 70;
  const x = cx - w / 2;
  let b = stroke(`M${x + 24} 224V252M${x + w - 24} 224V252`, "#6d5a48", 2);
  b += rrect(x + 3, 251, w, h, 6, "#1c2f4a", 'opacity=".18"');
  b += rrect(x - 4, 244, w + 8, h + 8, 7, P.wood);
  b += rrect(x, 248, w, h, 5, CHALK);
  lines.forEach((ln, i) => {
    b += text(x + 14, 270 + i * 20, ln[0], {
      size: 14,
      fill: "#f4efe3",
      anchor: "start",
      weight: 600,
    });
    b += text(x + w - 14, 270 + i * 20, ln[1], { size: 14, fill: P.goldLight, anchor: "end" });
  });
  return b;
}

function crate(x, w, goods) {
  return (
    rect(x, 352, w, 22, P.wood) +
    rect(x, 352, w, 5, light(P.wood, 0.25)) +
    stroke(`M${x} 364H${x + w}`, P.woodDark, 1.5, 'opacity=".5"') +
    goods
  );
}
const tomato = (x, y) =>
  circle(x, y, 9.5, P.red) +
  circle(x + 3, y + 2, 6, shade(P.red, 0.18), 'opacity=".55"') +
  circle(x - 3, y - 3, 3, "#ff9c86") +
  path(`M${x - 3} ${y - 9}l3 3 3-3`, P.leaf);
const pepper = (x, y) =>
  path(`M${x - 9} ${y - 6}q9 -6 18 0q4 12 -3 18q-6 4 -12 0q-7 -6 -3 -18Z`, P.green) +
  path(`M${x + 3} ${y - 6}q6 4 4 14q-3 6 -6 4Z`, shade(P.green, 0.2), 'opacity=".6"') +
  rect(x - 1.5, y - 13, 3, 7, P.leafDark);
const avocado = (x, y) =>
  ellipse(x, y, 8, 10, "#3f6b3a") +
  ellipse(x - 2, y - 3, 3, 4, light("#3f6b3a", 0.3), 'opacity=".7"');

function produceGoods() {
  const [tx] = at("tomatoes");
  const [px] = at("peppers");
  let t = "";
  for (const [dx, dy] of [
    [-24, 0],
    [-6, 0],
    [12, 0],
    [30, 0],
    [-15, -12],
    [3, -12],
    [21, -12],
  ])
    t += tomato(tx + dx - 4, 350 + dy);
  let p = "";
  for (const [dx, dy] of [
    [-22, 0],
    [0, 0],
    [22, 0],
    [-11, -14],
    [11, -14],
  ])
    p += pepper(px + dx, 346 + dy);
  let a = "";
  for (const dx of [-14, 2, 18]) a += avocado(424 + dx, 346);
  return crate(tx - 40, 76, t) + crate(px - 38, 76, p) + crate(398, 58, a);
}
function tortillaStack(x, y, n, c) {
  let b = "";
  for (let i = 0; i < n; i += 1) b += ellipse(x, y - i * 3.2, 26, 7, i % 2 ? c : shade(c, 0.06));
  return b + ellipse(x - 6, y - n * 3.2 + 1, 10, 2.4, light(c, 0.4), 'opacity=".7"');
}
function bakeryGoods() {
  const [x] = at("tortillas");
  const loaf = (lx) =>
    ellipse(lx, 352, 24, 13, "#c98b4a") +
    ellipse(lx - 5, 347, 13, 5, light("#c98b4a", 0.3), 'opacity=".8"') +
    stroke(`M${lx - 12} 346l6 8M${lx} 344l6 8M${lx + 12} 346l5 8`, shade("#c98b4a", 0.3), 2);
  return (
    rrect(x - 44, 350, 88, 24, 10, "#a0703f") +
    tortillaStack(x - 18, 356, 8, "#efcf7a") +
    tortillaStack(x + 22, 356, 6, "#f6ead2") +
    loaf(712) +
    loaf(758)
  );
}
function farmGoods() {
  const [cx] = at("cheese");
  const [kx] = at("coins");
  const bag = (bx) =>
    rrect(bx - 12, 330, 24, 40, 4, "#f4efe3") +
    rect(bx - 12, 344, 24, 14, P.gold) +
    rect(bx - 12, 330, 24, 5, "#d9d1c0");
  const block = (bx) =>
    path(`M${bx - 16} 370l6-20h26l6 20Z`, P.goldLight) +
    path(`M${bx + 16} 370l-6-20h-4l4 20Z`, shade(P.goldLight, 0.18));
  let eggs = rrect(966, 356, 66, 16, 3, "#c9b79a");
  for (let i = 0; i < 6; i += 1)
    eggs += ellipse(973 + i * 10.5, 354, 5, 6, i % 2 ? "#f6efe2" : "#e9d2b4");
  return (
    bag(cx - 26) +
    bag(cx - 4) +
    block(cx + 30) +
    eggs +
    rrect(kx - 24, 350, 48, 24, 4, P.navy) +
    rect(kx - 24, 350, 48, 6, light(P.navy, 0.2)) +
    circle(kx - 8, 346, 6, P.goldLight) +
    circle(kx + 6, 344, 6, P.stone) +
    circle(kx + 2, 348, 5, P.gold)
  );
}

function chalkSign() {
  const x = 114;
  return (
    contact(x, GROUND + 26, 52, 8, 0.22) +
    stroke(
      `M${x - 44} ${GROUND + 24}L${x - 30} 322M${x + 44} ${GROUND + 24}L${x + 30} 322`,
      P.woodDark,
      6,
    ) +
    rrect(x - 50, 318, 100, 92, 6, P.wood) +
    rrect(x - 44, 324, 88, 80, 4, CHALK) +
    text(x, 350, "Open", { size: 17, fill: P.goldLight }) +
    text(x, 372, "Sat 8-1", { size: 15, fill: "#f4efe3", weight: 600 }) +
    text(x, 393, "Cash · cards", { size: 12, fill: "#f4efe3", weight: 600 })
  );
}

function maya() {
  const [rx, ry] = at("recipe");
  const look = PEOPLE.maya.look;
  return (
    contact(rx - 46, 546, 40, 8, 0.24) +
    characterSVG(look, "happy", rx - 46, 546 - 110 * 1.42, 1.42) +
    // her basket with the recipe card tucked in
    path(`M${rx - 26} ${ry - 4}q26 -36 52 0`, "none", `stroke="${P.woodDark}" stroke-width="4"`) +
    rrect(rx - 12, ry - 34, 30, 38, 3, P.ivory, 'transform="rotate(-8 0 0)"') +
    rrect(rx - 30, ry - 6, 60, 34, 8, "#b5824f") +
    stroke(
      `M${rx - 26} ${ry + 6}H${rx + 26}M${rx - 24} ${ry + 16}H${rx + 24}`,
      shade("#b5824f", 0.25),
      2,
    ) +
    rrect(rx - 8, ry - 30, 26, 30, 3, "#fffaf0") +
    stroke(`M${rx - 3} ${ry - 22}h15M${rx - 3} ${ry - 15}h12M${rx - 3} ${ry - 8}h14`, "#9aa7b4", 2)
  );
}

/** The whole market. `label` is the accessible name (the picture is described in words by the page as well). */
export function marketSceneSVG(label) {
  // board centres: the left half of each stall, so the vendor stands clear of it on the right
  const [ps, bs, fs] = [285, 603, 921];
  const body = noDefs(
    () =>
      backdrop() +
      bunting() +
      pavement() +
      stallBack(190, 280, P.coral) +
      stallBack(508, 280, P.teal) +
      stallBack(826, 280, P.gold) +
      characterSVG(PEOPLE.delgado.look, "happy", 418, 308, 1.2, true) +
      characterSVG(PEOPLE.haddad.look, "neutral", 736, 308, 1.2, true) +
      characterSVG(PEOPLE.okafor.look, "happy", 1054, 308, 1.2, true) +
      priceBoard(ps, [
        ["Tomatoes", price("tomatoes")],
        ["Peppers", price("pepper")],
        ["Avocados", price("avocado")],
      ]) +
      priceBoard(bs, [
        ["Corn · 10", price("corn")],
        ["Flour · 8", price("flour")],
        ["2 corn packs", "$5.00"],
      ]) +
      priceBoard(fs, [
        ["Shredded", price("shredded")],
        ["Block", price("block")],
        ["Eggs · 12", price("eggs")],
      ]) +
      stallFront(190, 280, mix(P.coral, P.ivory, 0.15)) +
      stallFront(508, 280, mix(P.teal, P.ivory, 0.1)) +
      stallFront(826, 280, mix(P.gold, P.coral, 0.15)) +
      produceGoods() +
      bakeryGoods() +
      farmGoods() +
      chalkSign() +
      maya(),
  );
  const safe = String(label).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
  return `<svg class="mk-scene-svg" viewBox="0 0 ${SCENE_W} ${SCENE_H}" role="img" aria-label="${safe}" focusable="false"><title>${safe}</title>${body}</svg>`;
}

// ── word pictures (visual vocabulary at level A) ─────────────────────────────
const ICONS = {
  clock: () =>
    circle(24, 24, 17, P.ivory) + circle(24, 24, 14, "#fff") + stroke("M24 14v10l7 5", P.navy, 3),
  wallet: () =>
    rrect(8, 14, 32, 22, 4, P.teal) +
    rrect(26, 20, 16, 10, 3, shade(P.teal, 0.25)) +
    circle(32, 25, 2.2, P.goldLight),
  one: () =>
    tomato(24, 26) +
    rrect(30, 8, 14, 14, 7, P.navy) +
    text(37, 19, "1", { size: 11, fill: P.ivory }),
  tomato: () => tomato(24, 26),
  pepper: () => pepper(24, 28),
  tag: () => path("M8 22 22 8h16v16L24 38Z", P.goldLight) + circle(32, 15, 3, P.ivory),
  tortilla: () => tortillaStack(24, 32, 5, "#efcf7a"),
  grater: () =>
    rrect(15, 8, 18, 32, 3, P.stone) +
    stroke("M19 15h10M19 21h10M19 27h10M19 33h10", P.stoneDark, 2) +
    ellipse(24, 42, 12, 3, P.goldLight),
  cheese: () =>
    path("M8 34l10-22h22v22Z", P.goldLight) +
    circle(24, 26, 3, shade(P.goldLight, 0.2)) +
    circle(32, 20, 2, shade(P.goldLight, 0.2)),
  coins: () =>
    circle(18, 28, 9, P.goldLight) + circle(30, 24, 9, P.stone) + circle(26, 32, 8, P.gold),
};
/** A small decorative picture for a word (aria-hidden: the word itself is always written next to it). */
export const wordIconSVG = (icon) =>
  `<svg class="mk-icon" viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">${noDefs(() => (ICONS[icon] || ICONS.tag)())}</svg>`;
export const ICON_NAMES = Object.keys(ICONS);
