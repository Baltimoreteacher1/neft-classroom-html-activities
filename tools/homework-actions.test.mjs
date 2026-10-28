// The delegated action runtime (scripts/lib/homework-actions.runtime.js), in jsdom: it must do
// what the inline handlers it replaced did, including their bubbling and stopPropagation.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { HOMEWORK_ACTIONS_JS } from "../scripts/lib/homework-actions.mjs";

function page(body) {
  const dom = new JSDOM(`<!doctype html><body>${body}</body>`, { runScripts: "outside-only" });
  const { window } = dom;
  window.calls = [];
  for (const name of ["one", "two", "three", "outer", "inner"])
    window[name] = (...args) => window.calls.push([name, ...args]);
  window.eval(HOMEWORK_ACTIONS_JS);
  return window;
}
const click = (window, sel) =>
  window.document
    .querySelector(sel)
    .dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));

test("a click calls the named function with its literal arguments", () => {
  const w = page(`<button id="b" data-act="one" data-args='["check", 3, true]'>x</button>`);
  click(w, "#b");
  assert.deepEqual(w.calls, [["one", "check", 3, true]]);
});

test("$el, $ev and $value resolve at event time; $$ is a literal dollar", () => {
  const w = page(
    `<input id="i" value="7" data-act-input="one" data-args-input='["$value","$el","$ev","$$5"]'>`,
  );
  const input = w.document.getElementById("i");
  input.dispatchEvent(new w.Event("input", { bubbles: true }));
  const [, value, el, ev, dollar] = w.calls[0];
  assert.equal(value, "7");
  assert.equal(el, input);
  assert.equal(ev.type, "input");
  assert.equal(dollar, "$5");
});

test("several names run in order and only the first receives the arguments", () => {
  const w = page(`<button id="b" data-act="one two three" data-args='[9]'>x</button>`);
  click(w, "#b");
  assert.deepEqual(w.calls, [["one", 9], ["two"], ["three"]]);
});

test("data-prevent is return false; data-stop is stopPropagation, so the ancestor does not fire", () => {
  const w = page(
    `<div data-act="outer"><a id="a" href="#x" data-act="inner" data-prevent data-stop>x</a><a id="b" href="#y" data-act="inner">y</a></div>`,
  );
  const event = new w.MouseEvent("click", { bubbles: true, cancelable: true });
  w.document.getElementById("a").dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(w.calls, [["inner"]], "stopped before the ancestor");
  w.calls.length = 0;
  click(w, "#b");
  assert.deepEqual(
    w.calls,
    [["inner"], ["outer"]],
    "an unstopped click reaches the ancestor, like an inline handler",
  );
});

test("each event type has its own attributes", () => {
  const w = page(`<div id="d" data-act="one" data-act-drop="two" data-args-drop='["x"]'>x</div>`);
  const d = w.document.getElementById("d");
  d.dispatchEvent(new w.Event("drop", { bubbles: true }));
  assert.deepEqual(w.calls, [["two", "x"]]);
});

test("a missing function is reported and does not break the next control", () => {
  const w = page(
    `<button id="a" data-act="nope">a</button><button id="b" data-act="one">b</button>`,
  );
  const errors = [];
  w.console.error = (m) => errors.push(m);
  click(w, "#a");
  click(w, "#b");
  assert.match(errors[0], /no function named nope/);
  assert.deepEqual(w.calls, [["one"]]);
});

test("a flashcard turns one face away from the tab order and the tree", () => {
  const w = page(
    `<div class="vocab-card" id="c" data-act="hwFlipCard"><div class="vocab-card-front"><button id="f" class="flip-prompt" data-act="hwFlipCard" data-stop>flip</button></div><div class="vocab-card-back" inert></div></div>`,
  );
  const card = w.document.getElementById("c");
  click(w, "#f");
  assert.equal(card.classList.contains("flipped"), true, "the button flips once, not twice");
  assert.equal(card.querySelector(".vocab-card-front").hasAttribute("inert"), true);
  assert.equal(card.querySelector(".vocab-card-back").hasAttribute("inert"), false);
  click(w, "#c");
  assert.equal(card.classList.contains("flipped"), false);
  assert.equal(card.querySelector(".vocab-card-back").hasAttribute("inert"), true);
});

test("Enter or Space activates a focusable non-button", () => {
  const w = page(
    `<div id="d" tabindex="0" data-act="one" data-act-keydown="hwActivateOnKey">x</div>`,
  );
  const d = w.document.getElementById("d");
  d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true }));
  assert.deepEqual(w.calls, []);
  d.dispatchEvent(
    new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
  );
  assert.deepEqual(w.calls, [["one"]]);
});
