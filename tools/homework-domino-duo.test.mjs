import assert from "node:assert/strict";
import test from "node:test";
import { DOMINO_DUO_JS } from "../scripts/lib/homework-domino-duo.mjs";
import { homeworkDom, tick } from "./lib/homework-page-dom.mjs";

function placeAll(d) {
  const turns = [];
  for (let guard = 0; guard < 20; guard++) {
    const tray = [...d.querySelectorAll("#fam_dom_tray .fam-dom-tile")];
    if (!tray.length) break;
    const before = d.querySelectorAll("#fam_dom_chain .fam-dom-tile").length;
    for (const t of tray) {
      t.click();
      if (d.querySelectorAll("#fam_dom_chain .fam-dom-tile").length > before) break;
    }
    turns.push(d.getElementById("fam_dom_duo_panel").dataset.turn);
  }
  return turns;
}

test("two-player dominoes: roles alternate, the score is the team's, nothing is timed", async () => {
  const { w, d, errors } = await homeworkDom("4-3");
  w.switchHomeworkTab("play");
  const toggle = d.getElementById("fam_dom_duo_toggle");
  const panel = d.getElementById("fam_dom_duo_panel");
  assert.equal(panel.hidden, true, "single-player is the default");
  w.resetDominoGame();
  toggle.click();
  assert.equal(toggle.getAttribute("aria-pressed"), "true");
  assert.equal(panel.hidden, false);
  assert.equal(panel.dataset.turn, "student", "the student starts");
  const first = d.getElementById("fam_dom_duo_turn").textContent;
  assert.match(first, /Student's turn/);
  assert.match(d.getElementById("fam_dom_duo_coach").textContent, /Grown-up, you are the coach/);
  // a miss is a "second look" for the team, never a penalty
  const tray = [...d.querySelectorAll("#fam_dom_tray .fam-dom-tile")];
  const next = w.famDom.tiles[w.famDom.next];
  const wrong = tray.find((t) => t.querySelector(".fam-dom-left").textContent !== next.left);
  wrong.click();
  assert.match(d.getElementById("fam_dom_status").textContent, /Second looks: 1/);
  assert.match(d.getElementById("fam_dom_hint").textContent, /Talk it over together/);
  const turns = placeAll(d);
  const alternating = turns.slice(0, -1).every((t, i) => t !== turns[i + 1]);
  assert.ok(alternating, `roles alternate: ${turns}`);
  assert.match(d.getElementById("fam_dom_duo_turn").textContent, /built the loop together/);
  const text = panel.textContent + d.getElementById("fam_dom_status").textContent;
  assert.doesNotMatch(text, /winner is|you win|score:|wrong tries|timer:|seconds/i);
  toggle.click();
  assert.equal(panel.hidden, true);
  assert.ok(
    !/setInterval|setTimeout/.test(
      DOMINO_DUO_JS.replace(
        /setTimeout\(function \(\) \{ document\.body\.classList\.remove\('print-domino-sheet'\)/,
        "",
      ),
    ),
    "no timers in the duo code",
  );
  assert.equal(errors.length, 0, errors.map((e) => e.message).join());
});

test("paper dominoes: every tile of the chain is printed once, with a START tile and a check line", async () => {
  const { w, d } = await homeworkDom("4-3");
  let printed = 0;
  w.print = () => {
    printed++;
    assert.ok(d.body.classList.contains("print-domino-sheet"));
  };
  w.printDominoSheet();
  await tick();
  assert.equal(printed, 1);
  const sheet = d.querySelector(".hw-domino-sheet");
  const pairs = w.__HW_FAMGAMES__.pairs;
  const tiles = [...sheet.querySelectorAll(".dsheet-tile")];
  assert.equal(tiles.length, pairs.length);
  assert.equal(sheet.querySelectorAll(".dsheet-start").length, 1);
  const halves = tiles.flatMap((t) =>
    [...t.querySelectorAll(".dsheet-half")].map((h) => h.textContent),
  );
  for (const p of pairs) {
    assert.ok(halves.includes(p.a), `problem ${p.a} printed`);
    assert.ok(halves.includes(p.b), `match ${p.b} printed`);
  }
  assert.match(sheet.textContent, /Math Dominoes: paper version/);
  assert.match(sheet.textContent, /Dominó matemático: versión en papel/);
  assert.match(sheet.querySelector(".dsheet-key").textContent, /Grown-up check/);
});
