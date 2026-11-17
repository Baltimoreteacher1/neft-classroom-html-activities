import { P, SKIN, HAIR, rect, rrect, path, ellipse, circle, g, bookshelf, wallWindow, person, shade, light, contact, stroke } from "../../../access-practice-lab/src/art/kit.js";
import { BP, room, frontDesk, beanbag, pottedPlant, sideTable, lightPool } from "../lib/b.mjs";

export default {
  file: "35-speaking-library.svg",
  w: 640,
  h: 400,
  title:
    "A library with tall bookshelves full of books. A boy reads a book on a green beanbag chair. At the front desk, a librarian helps a girl check out a book. A plant sits on a small table.",
  draw: () =>
    room(640, 400, 302, { wall: "#efe2cc" }) +
    bookshelf(14, 312, 118, 268, { seed: 3 }) +
    bookshelf(140, 312, 118, 268, { seed: 7 }) +
    wallWindow(300, 70, 96, 120, { view: "day", frame: P.ivory }) +
    lightPool(330, 330, 120, 18, 0.35) +
    sideTable(348, 318, 62, 56) +
    pottedPlant(348, 260, 1.05, { pot: P.coral }) +
    rect(470, 84, 112, 84, P.woodDark) + rect(477, 91, 98, 70, "#cfe6d8") + circle(526, 116, 16, P.goldLight) + path("M477 161 L510 128 L530 146 L548 132 L575 161Z", P.teal) +
    // librarian behind the desk
    person(548, 316, 160, { pose: "hold", age: "adult", facing: -1, skin: SKIN[4], hair: "#2f6b7a", hairStyle: "hijab", top: P.navy, bottom: P.navy, glasses: true }) +
    frontDesk(440, 330, 170, 74, { color: P.wood }) +
    `<g transform="translate(588 250)">${BP.book(P.gold)}</g>` +
    rect(452, 248, 34, 8, P.coral, 'rx="1"') + rect(454, 240, 30, 8, P.teal, 'rx="1"') + rect(450, 232, 36, 8, P.gold, 'rx="1"') +
    // girl checking out a book
    person(420, 388, 124, { pose: "hold", facing: 1, skin: SKIN[1], hair: HAIR[3], hairStyle: "braid", top: P.coral, bottom: "#3e4a5c", sleeve: "short", item: BP.book(P.blue) }) +
    // boy reading on the beanbag
    beanbag(218, 388, 1.25, "#4f9d5d") +
    person(214, 356, 120, { pose: "sit", facing: 1, skin: SKIN[3], hair: HAIR[0], hairStyle: "curly", top: P.gold, bottom: P.navy, sleeve: "short", item: `<g transform="translate(-4 -8)">${BP.bookOpen(P.red)}</g>` }),
};
