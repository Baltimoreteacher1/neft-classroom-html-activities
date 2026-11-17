import { P, SKIN, HAIR, person, wallWindow, rect, rrect, stroke, g } from "../kit.mjs";
import { room, labBench, microscope, beaker, ruler, goggles, shelfJars, handAt, lightPatch, cam } from "../lib/f.mjs";

// A student in goggles pours green liquid from a flask into a beaker. A microscope and a ruler are on the table.
const benchY = 300;
const sx = 226;
const sh = 152;
const feet = 346;
const kidLook = { pose: "point", age: "adult", facing: 1 };
const [hx, hy] = handAt(sx, feet, sh, kidLook);
const s = sh / 100;
const k = 0.72;
const mouth = [hx + 20.7 * s * k, hy + 7.5 * s * k];
const liquid = "#5fb86a";

/** Erlenmeyer flask held at the hand, tipped forward so its mouth points down-right. */
const flask = () => {
  const body =
    `<path d="M-5 -26h10v14l12 20q2 6 -4 6h-26q-6 0 -4 -6l12 -20Z" fill="#e9f4f7" opacity=".95"/>` +
    `<path d="M-5 -24h10v12l6 10h-22l6 -10Z" fill="${liquid}"/>` +
    rect(-6, -28, 12, 4, "#dbe8ec") +
    rect(-3, -22, 2.4, 22, "#ffffff", 'opacity=".7"');
  return `<g transform="scale(${k}) rotate(110) translate(0 6)">${body}</g>`;
};

/** Periodic-table style poster: coloured tiles, no lettering. */
const tilesPoster = (x, y) => {
  let b = rrect(x - 8, y - 8, 152, 96, 4, P.ivory);
  const cols = ["#9fc9d6", "#f3cd6f", "#e98a6c", "#a3c97f", "#c9b6e0"];
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 9; c++) {
      if (r === 0 && c > 0 && c < 8) continue;
      if (r === 1 && c > 1 && c < 6) continue;
      b += rect(x + c * 15.2, y + r * 15.6, 13, 13.4, cols[(c + r * 2) % cols.length], 'opacity=".9"');
    }
  return b;
};

export default {
  file: "68-science-lab.svg",
  w: 640,
  h: 400,
  title: "A student wearing goggles pours liquid into a beaker. A microscope and a ruler are on the table.",
  draw: () =>
    cam(300, 300, 1.28,
    room(640, 400, 336, { floor: "tile" }) +
    wallWindow(76, 56, 104, 96, { view: "day" }) +
    lightPatch([[76, 162], [180, 162], [240, 336], [100, 336]], 0.12) +
    tilesPoster(214, 56) +
    shelfJars(398, 124, 160, { seed: 11 }) +
    person(sx, feet, sh, {
      ...kidLook,
      skin: SKIN[4],
      hair: HAIR[0],
      hairStyle: "puffs",
      top: P.coral,
      bottom: P.navy,
      coat: "#f4f7f8",
      mouth: "o",
      item: flask(),
    }) +
    goggles(sx, feet, sh, kidLook) +
    labBench(24, benchY, 592, 400, { drawers: 3 }) +
    // pour stream from the flask mouth into the beaker
    stroke(`M${mouth[0].toFixed(1)} ${mouth[1].toFixed(1)} Q${(mouth[0] + 7).toFixed(1)} ${(mouth[1] + 4).toFixed(1)} ${(mouth[0] + 9).toFixed(1)} ${benchY - 18}`, liquid, 4.2, 'opacity=".9"') +
    beaker(mouth[0] + 8, benchY + 1, 46, 44, { liquid, fill: 0.36 }) +
    g(rect(mouth[0] + 6, benchY - 18, 8, 3, "#ffffff", 'opacity=".55"')) +
    ruler(96, benchY + 2, 116) +
    microscope(470, benchY + 1, 0.86, { dir: -1 })),
};
