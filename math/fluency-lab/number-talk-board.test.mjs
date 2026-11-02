import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { renderNumberTalkBoard } from "./number-talk-board.js";

test("renders three accessible models and toggles their reveal state", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='board'></div></body></html>");
  const container = dom.window.document.querySelector("#board");
  renderNumberTalkBoard(container, {
    problem: "8 + 6 = ?",
    teacherStems: { en: ["I agree with ___ because ___."], es: ["Estoy de acuerdo con ___ porque ___."] },
  });
  assert.equal(container.querySelectorAll(".ewl-talk-board__card").length, 3);
  assert.equal(container.querySelectorAll("svg[role='img']").length, 3);
  const reveal = container.querySelector("button[aria-expanded='false']");
  const controlled = container.querySelector(`#${reveal.getAttribute("aria-controls")}`);
  assert.equal(controlled.hidden, true);
  reveal.click();
  assert.equal(reveal.getAttribute("aria-expanded"), "true");
  assert.equal(controlled.hidden, false);
  assert.equal(reveal.textContent, "Hide model");
  assert.match(container.querySelector(".ewl-talk-board__equation").textContent, /8 \+ 6/);
  assert.equal(container.querySelectorAll(".ewl-talk-board__stems li")[0].textContent, "I agree with ___ because ___.");
});

test("supports Spanish talk stems and safely treats provided content as text", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='board'></div></body></html>");
  const container = dom.window.document.querySelector("#board");
  renderNumberTalkBoard(container, {
    problem: "12 × 4 = ?",
    teacherStems: { en: ["I decomposed ___ into ___."], es: ["Descompuse ___ en ___."] },
    decomposition: { equation: "<img src=x onerror=alert(1)>", parts: ["<b>unsafe</b>"] },
  }, { language: "es" });
  assert.match(container.textContent, /Compara estrategias/);
  assert.match(container.textContent, /Descompuse ___ en ___\./);
  assert.equal(container.querySelector("img"), null);
  assert.equal(container.querySelector(".ewl-talk-board__equation").innerHTML, "&lt;img src=x onerror=alert(1)&gt;");
  assert.match(container.querySelector(".ewl-talk-board__card h4").textContent, /Recta numérica/);
});
