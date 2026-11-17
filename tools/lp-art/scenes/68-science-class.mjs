import { P, SKIN, HAIR, person, wallWindow, rect, rrect, contact, PROPS, tr, stroke } from "../../../access-practice-lab/src/art/kit.js";
import { room, labBench, microscope, tubeRack, shelfJars, lightPatch, cam } from "../lib/f.mjs";

// A scientist (lab coat, hair tied back) bends to a microscope; a rack of test tubes stands on the same bench.
const benchY = 292;
const px = 236;
const ph = 168;
const feet = 362;

export default {
  file: "68-science-class.svg",
  w: 640,
  h: 400,
  title: "A scientist looks into a microscope. Test tubes stand in a rack on the table.",
  draw: () =>
    cam(300, 300, 1.28,
    room(640, 400, 330) +
    wallWindow(78, 62, 120, 104, { view: "day", frame: P.ivory }) +
    lightPatch([[78, 178], [198, 178], [262, 330], [110, 330]], 0.12) +
    shelfJars(400, 118, 160, { seed: 5 }) +
    // poster: cell diagram
    rrect(250, 58, 112, 84, 4, P.ivory) +
    rect(258, 66, 96, 68, "#e6f1ea") +
    `<ellipse cx="306" cy="100" rx="38" ry="24" fill="#bfe0c9"/><circle cx="314" cy="98" r="9" fill="#7fb69a"/><circle cx="290" cy="108" r="3" fill="#7fb69a"/><circle cx="326" cy="112" r="2.6" fill="#7fb69a"/>` +
    person(px, feet, ph, {
      pose: "stand",
      age: "adult",
      skin: SKIN[2],
      hair: HAIR[0],
      hairStyle: "bun",
      top: P.teal,
      bottom: P.navy,
      coat: "#f4f7f8",
      facing: 1,
      mouth: "flat",
    }) +
    labBench(30, benchY, 580, 400, { drawers: 3 }) +
    // notebook and pencil on the bench
    tr(176, benchY + 1, rrect(-30, -6, 56, 6, 1.5, "#fbfaf6") + rect(-30, -6, 56, 1.6, "#d7dde2") + stroke("M-22 -3h36", "#9aa7b4", 1), 1) +
    tr(198, benchY - 4, PROPS.pencil(), 0.9) +
    microscope(262, benchY + 1, 0.8, { dir: -1 }) +
    // her near arm comes forward to the focus knob
    stroke("M253 242 L257 276 L270 257", "#f4f7f8", 13) +
    stroke("M256 262 L258 276", "#dfe5e8", 6, 'opacity=".7"') +
    `<circle cx="271" cy="256" r="7.6" fill="${SKIN[2]}"/>` +
    tubeRack(392, benchY + 1, [P.coral, P.gold, P.tealLight, P.blue, P.purple, P.green], { gap: 22 }) +
    contact(130, benchY + 1, 18, 3, 0.18) +
    `<path d="M118 ${benchY + 1}h24l-3 -30h-18Z" fill="#e9f4f7" opacity=".9"/><path d="M119 ${benchY - 10}h22l1 11h-24Z" fill="${P.tealLight}" opacity=".85"/>`),
};
