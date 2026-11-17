import { P, SKIN, HAIR, sky, cloud, ground, road, building, tree, person, kid, rect, rrect, ellipse, line, stroke, g, haze, shade, tr } from "../../../access-practice-lab/src/art/kit.js";
import { joints, shopFront, stopSign, mailbox, cityBus, chefHat, vestStripes, loaf, letter } from "../lib/d.mjs";

// Street scene, left to right: baker with a loaf in front of the bakery; mail carrier posting a letter in a
// blue mailbox; crossing guard (orange vest) holding up a STOP sign at the crosswalk; two children crossing;
// a city bus stopped for them with its driver at the wheel.
const SIDEWALK = 262;
const ROAD_Y = 268;
const ROAD_H = 86;

const bakerO = { pose: "hold", age: "adult", skin: SKIN[0], hair: HAIR[2], hairStyle: "short", top: "#f4f5f6", bottom: "#4e5d6c", apron: "#ffffff", item: loaf(0.85), mouth: "smile" };
const mailO = { pose: "hold", age: "adult", skin: SKIN[3], hair: "#2d4f7c", hairStyle: "cap", top: "#5d86b8", bottom: "#2d4f7c", sleeve: "short" };
const guardO = { pose: "reach", age: "adult", skin: SKIN[5], hair: HAIR[0], hairStyle: "bun", top: P.navy, bottom: "#2f3b4c", apron: "#f08a24", mouth: "smile" };
const MAILX = 204;
const GUARDX = 340;
const GUARDY = 352;
const GUARDH = 156;

const crosswalk = () => {
  let s = "";
  for (let y = ROAD_Y + 8; y < ROAD_Y + ROAD_H - 6; y += 15) s += rect(364, y, 108, 8, "#f4f2ea", 'opacity=".92"');
  return s;
};

const breadSign = (cx, cy) => ellipse(cx, cy, 22, 9, "#c98a45") + ellipse(cx, cy - 2, 19, 6, "#dca25e") + stroke(`M${cx - 9} ${cy - 5} l4 5M${cx - 1} ${cy - 6} l4 5M${cx + 7} ${cy - 5} l4 5`, "#f0c98a", 1.6);
const windowBread = (x, y) => [0, 1, 2].map((i) => ellipse(x + 18 + i * 28, y, 12, 6, "#d39a55") + ellipse(x + 18 + i * 28, y - 2, 9, 3.5, "#e7b670")).join("") + rect(x + 4, y + 6, 92, 4, P.woodLight);

const mailBag = (J) => {
  const [nx, ny] = J.neck;
  const [hx, hy] = J.hip;
  return stroke(`M${nx + 8} ${ny + 2} L${hx - 12} ${hy - 2}`, "#6b4a2f", 3) + rrect(hx - 26, hy - 10, 24, 22, 4, "#8a5f3a") + rect(hx - 26, hy - 10, 24, 7, "#6b4a2f");
};

const draw = () => {
  const mJ = joints(MAILX, SIDEWALK, 140, mailO);
  const [mhx, mhy] = mJ.hand;
  const gJ = joints(GUARDX, GUARDY, GUARDH, guardO);
  const [ghx, ghy] = gJ.hand;
  const bJ = joints(118, SIDEWALK + 2, 142, bakerO);
  let s = sky(640, 270) + cloud(520, 52, 0.7) + cloud(300, 36, 0.55);
  s += building(386, 230, 140, 190, { color: haze(P.brick, 0.5), windows: [3, 4], door: false });
  s += building(536, 230, 110, 150, { color: haze("#9fb7c4", 0.45), windows: [2, 3], door: false, roof: "gable", roofColor: haze(P.navy, 0.3) });
  s += building(196, 236, 150, 170, { color: "#c46a4f", windows: [3, 3], door: true });
  s += shopFront(14, 236, 176, 150, { color: "#efc9b1", awning: P.coral, signArt: breadSign(102, 101), windowArt: windowBread(26, 190) });
  s += tree(372, 238, 0.42, { tone: "#6aa275" });
  s += rect(0, 232, 640, ROAD_Y - 232, "#d9d5cc") + rect(0, 232, 640, 4, "#c4bfb5");
  s += road(640, ROAD_Y, ROAD_H, { dashes: true, curb: false }) + rect(0, ROAD_Y - 2, 640, 4, "#a8a49b") + rect(0, ROAD_Y + ROAD_H, 640, 4, "#a8a49b");
  s += rect(0, ROAD_Y + ROAD_H + 4, 640, 400, "#d9d5cc") + crosswalk();
  // back sidewalk: baker, mail carrier, mailbox
  s += person(118, SIDEWALK + 2, 142, bakerO) + chefHat([bJ.head[0], bJ.head[1] + bJ.headR * 0.55], bJ.headR);
  s += mailbox(mhx + 22, SIDEWALK + 4, 1.45);
  s += person(MAILX, SIDEWALK, 140, mailO) + mailBag(mJ);
  s += `<g transform="translate(${(mhx + 10).toFixed(1)} ${(mhy + 2).toFixed(1)}) rotate(30) scale(1.25)">${letter(1)}</g>`;
  // bus stopped before the crosswalk
  s += cityBus(482, 318, 196, { color: P.teal, facing: -1, driver: { skin: SKIN[1], hair: HAIR[1], top: P.navy } });
  // children on the crosswalk
  s += person(412, 318, 104, kid(1, { pose: "walk", facing: -1, sleeve: "short" }));
  s += person(446, 338, 100, kid(2, { pose: "walk", facing: -1 }));
  // crossing guard with the sign
  s += person(GUARDX, GUARDY, GUARDH, guardO) + vestStripes(gJ.chest, gJ.s);
  s += line(ghx, ghy + 22, ghx, ghy - 34, "#7d8893", 4) + stopSign(ghx, ghy - 54, 24);
  s += tree(40, 392, 0.5, { seed: 3, tone: "#5f9a68" }) + tree(612, 396, 0.46, { seed: 5, tone: "#5f9a68" }) + ellipse(40, 392, 22, 5, "#8b5e3c", 'opacity=".5"') + ellipse(612, 396, 22, 5, "#8b5e3c", 'opacity=".5"');
  return s;
};

export default {
  file: "35t-community-street.svg",
  w: 640,
  h: 400,
  title: "A busy neighborhood street. A crossing guard in an orange vest holds up a stop sign while two children cross the street. A mail carrier puts a letter in a blue mailbox. A baker holds a loaf of bread in front of a bakery, and a bus driver drives a city bus.",
  draw,
};
