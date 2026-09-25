import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM, VirtualConsole } from "jsdom";
import { onRequest } from "../functions/lessons/_middleware.js";
import { HOMEWORK_TABS_JS } from "../scripts/homework-guided-notes.mjs";
import { lessonPath } from "./lib/curriculum-source.mjs";

const defaultPolicy = "camera=(), microphone=(self), geolocation=(), payment=(), usb=()";
test("camera permission is scoped to homework HTML without changing other policy directives", async () => {
  for (const path of [
    "/lessons/3-2/homework",
    "/lessons/3-2/homework.html",
    "/lessons/3-2-part2/homework",
    "/lessons/1-review/homework",
    "/lessons/6-1-6-2-practice-part2/homework",
  ]) {
    const response = await onRequest({
      request: new Request("https://eduwonderlab.com" + path),
      env: {},
      data: {},
      next: async () =>
        new Response("homework", {
          headers: { "Content-Type": "text/html", "Permissions-Policy": defaultPolicy },
        }),
    });
    assert.equal(
      response.headers.get("Permissions-Policy"),
      defaultPolicy.replace("camera=()", "camera=(self)"),
    );
  }
  for (const path of ["/lessons/3-2/", "/curriculum/", "/lessons/3-2/homework.js"]) {
    const response = await onRequest({
      request: new Request("https://eduwonderlab.com" + path),
      env: {},
      data: {},
      next: async () =>
        new Response("other", {
          headers: { "Content-Type": "text/html", "Permissions-Policy": defaultPolicy },
        }),
    });
    assert.equal(response.headers.get("Permissions-Policy"), defaultPolicy);
  }
});

async function homework(id = "3-2") {
  const errors = [];
  const draws = [];
  const console = new VirtualConsole();
  console.on("jsdomError", (e) => {
    if (e.type !== "css parsing" && e.type !== "not implemented") errors.push(e);
  });
  const source = readFileSync(lessonPath(id, "homework.html"), "utf8");
  const dom = new JSDOM(source, {
    url: "https://eduwonderlab.com/lessons/" + id + "/homework?route=full&lang=en",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: console,
    beforeParse(w) {
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.scrollTo = () => {};
      w.HTMLMediaElement.prototype.play = () => Promise.resolve();
      w.HTMLMediaElement.prototype.pause = () => {};
      Object.defineProperty(w, "isSecureContext", { value: true });
      w.HTMLCanvasElement.prototype.getContext = function () {
        return new Proxy(
          {
            measureText: (t) => ({ width: String(t).length * 8 }),
            moveTo: (...v) => draws.push(["move", ...v]),
            lineTo: (...v) => draws.push(["line", ...v]),
          },
          { get: (target, key) => target[key] || (() => {}) },
        );
      };
      w.HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,dGVzdA==";
      w.HTMLCanvasElement.prototype.toBlob = (callback) =>
        queueMicrotask(() => callback(new w.Blob(["synthetic JPEG"], { type: "image/jpeg" })));
      w.URL.createObjectURL = () => "blob:synthetic-photo";
      w.URL.revokeObjectURL = () => {};
      w.Image = class {
        width = 640;
        height = 480;
        naturalWidth = 640;
        naturalHeight = 480;
        set src(value) {
          this._src = value;
          queueMicrotask(() => this.onload?.());
        }
        get src() {
          return this._src;
        }
      };
    },
  });
  await new Promise((resolve) => dom.window.addEventListener("load", resolve, { once: true }));
  assert.equal(errors.length, 0, errors.map((e) => e.message).join("\n"));
  return { dom, w: dom.window, d: dom.window.document, draws, errors };
}
const settle = () => new Promise((resolve) => setImmediate(resolve));

test("tap sorting keeps its selection, moves to the chosen column, and accepts the answer", async () => {
  const { dom, w, d } = await homework();
  try {
    w.switchHomeworkTab("check");
    const cards = [...d.querySelectorAll("#problem_0 .drag-card")];
    assert.ok(cards.length);
    for (const card of cards) {
      card.click();
      const zone = d.querySelector(
        '#problem_0 .drag-column[data-category-id="' + card.dataset.correctCategory + '"]',
      );
      zone.click();
      assert.equal(card.parentElement, zone.querySelector(".drag-column-slots"));
    }
    w.checkProblem(0);
    assert.ok(d.getElementById("problem_0").classList.contains("correct"));
    w.resetDragSort(0);
    assert.equal(d.querySelectorAll("#pile_0 .drag-card").length, cards.length);
  } finally {
    dom.window.close();
  }
});

test("drawing uses the displayed canvas size and stops after pointer cancellation", async () => {
  const { dom, w, d, draws } = await homework();
  try {
    const canvas = d.querySelector("[data-draw-canvas]");
    canvas.getBoundingClientRect = () => ({ left: 10, top: 20, width: 600, height: 300 });
    canvas.closest("[data-draw-frame]").getBoundingClientRect = () => ({ width: 600, height: 300 });
    const pointer = (type, x, y) =>
      canvas.dispatchEvent(new w.MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
    pointer("pointerdown", 310, 170);
    pointer("pointermove", 460, 245);
    assert.deepEqual(draws.at(-1), ["line", 450, 225]);
    pointer("pointercancel", 460, 245);
    const count = draws.length;
    pointer("pointermove", 500, 260);
    assert.equal(draws.length, count);
  } finally {
    dom.window.close();
  }
});

test("camera request finishing after leaving photobooth is stopped", async () => {
  const { dom, w, d } = await homework();
  try {
    let resolve;
    let stopped = 0;
    Object.defineProperty(w.navigator, "mediaDevices", {
      value: { getUserMedia: () => new Promise((r) => (resolve = r)) },
    });
    w.switchHomeworkTab("photobooth");
    w.startPhotoboothCamera();
    w.switchHomeworkTab("check");
    resolve({ getTracks: () => [{ stop: () => stopped++ }] });
    await settle();
    assert.equal(stopped, 1);
    assert.equal(d.getElementById("pb_video").srcObject, null);
    assert.equal(d.getElementById("pb_start_btn").disabled, false);
  } finally {
    dom.window.close();
  }
});

test("camera capture, frame/sticker changes, and attachment reveal the local reflection", async () => {
  const { dom, w, d } = await homework();
  try {
    let stopped = 0;
    Object.defineProperty(w.navigator, "mediaDevices", {
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => stopped++ }] }) },
    });
    w.switchHomeworkTab("photobooth");
    w.startPhotoboothCamera();
    await settle();
    assert.equal(d.getElementById("pb_snap_btn").disabled, false);
    const video = d.getElementById("pb_video");
    Object.defineProperty(video, "videoWidth", { value: 640 });
    Object.defineProperty(video, "videoHeight", { value: 480 });
    // Advance the real countdown without waiting three wall-clock seconds.
    let tick;
    w.setInterval = (fn) => {
      tick = fn;
      return 1;
    };
    w.clearInterval = () => {};
    w.snapPhotoboothPicture();
    tick();
    tick();
    tick();
    await settle();
    assert.equal(d.getElementById("pb_captured_img").hidden, false);
    assert.equal(d.getElementById("pb_download_link").getAttribute("href"), "blob:synthetic-photo");
    assert.equal(d.getElementById("pb_download_link").download, "Math-Work-Photobooth-3-2.jpg");
    assert.equal(stopped, 1);
    const frame = d.querySelector('[data-frame="notebook"]');
    frame.click();
    d.querySelector('[data-sticker="⭐"]').click();
    await settle();
    assert.equal(frame.getAttribute("aria-checked"), "true");
    w.saveParentSignoff();
    assert.equal(d.getElementById("signoff_form_wrapper").hidden, true);
    const timeout = w.setTimeout;
    w.setTimeout = (fn) => {
      fn();
      return 0;
    };
    w.attachPhotoboothToSignoff();
    w.setTimeout = timeout;
    assert.equal(d.body.dataset.activeTab, "done");
    assert.equal(d.querySelector(".homework-optional-extras").open, true);
    assert.equal(d.getElementById("signoff_form_wrapper").hidden, false);
    assert.equal(d.getElementById("work_photo_preview_wrap").hidden, false);
  } finally {
    dom.window.close();
  }
});

test("restored coordinate tool plots outside the old range and preserves graph state", async () => {
  const { dom, w, d } = await homework("7-7");
  try {
    const frame = d.querySelector('[data-interactive="coordinate-plane"]');
    assert.ok(frame, "coordinate tool missing");
    const inputs = frame.querySelectorAll('input[type="number"]');
    assert.equal(inputs.length, 2);
    inputs[0].value = "8";
    inputs[1].value = "-6.5";
    [...frame.querySelectorAll("button")]
      .find((b) => b.textContent.includes("Plot / remove"))
      .click();
    assert.match(frame.querySelector("[data-graph-readout]").textContent, /8, -6.5/);
    assert.deepEqual(JSON.parse(frame.querySelector("[data-graph-state]").value), {
      pts: [[8, -6.5]],
    });
    w.switchHomeworkTab("done");
    w.switchHomeworkTab("check");
    assert.match(frame.querySelector("[data-graph-readout]").textContent, /8, -6.5/);
    frame.querySelector("[data-graph-reset]").click();
    assert.equal(frame.querySelector("[data-graph-state]").value, "");
  } finally {
    dom.window.close();
  }
});

test("number-line boundaries accept decimals and larger values, with keyboard controls", async () => {
  const { dom, w, d } = await homework("8-6");
  try {
    const frame = d.querySelector('[data-interactive="number-line"]');
    assert.ok(frame);
    const boundary = frame.querySelector('input[type="number"]');
    boundary.value = "12.5";
    boundary.dispatchEvent(new w.Event("change"));
    [...frame.querySelectorAll("button")]
      .find((b) => b.textContent.includes("Shade right"))
      .click();
    assert.match(frame.querySelector("[data-graph-readout]").textContent, /x ≥ 12.5/);
    const point = frame.querySelector('[role="button"]');
    point.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    assert.match(frame.querySelector("[data-graph-readout]").textContent, /x ≥ -15/);
    frame.querySelector("[data-graph-reset]").click();
    assert.equal(frame.querySelector("[data-graph-state]").value, "");
  } finally {
    dom.window.close();
  }
});

test("area grids can shade, unshade, and reset squares using keyboard input", async () => {
  const { dom, w, d } = await homework("5-2");
  try {
    const frame = d.querySelector('[data-interactive="grid"]');
    assert.ok(frame);
    const square = frame.querySelector('[role="button"]');
    square.dispatchEvent(new w.KeyboardEvent("keydown", { key: " ", bubbles: true }));
    assert.match(frame.querySelector("[data-graph-readout]").textContent, /Shaded: 1/);
    square.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    assert.equal(frame.querySelector("[data-graph-state]").value, "");
  } finally {
    dom.window.close();
  }
});

test("a denied camera keeps photo upload usable", async () => {
  const { dom, w, d } = await homework();
  try {
    Object.defineProperty(w.navigator, "mediaDevices", {
      value: {
        getUserMedia: async () => {
          const error = new Error("test denial");
          error.name = "NotAllowedError";
          throw error;
        },
      },
    });
    w.switchHomeworkTab("photobooth");
    w.startPhotoboothCamera();
    await settle();
    assert.equal(d.getElementById("pb_start_btn").disabled, false);
    assert.match(d.getElementById("pb_status").textContent, /blocked/);
    const input = {
      files: [new w.File(["synthetic photo"], "fixture.png", { type: "image/png" })],
      value: "fixture.png",
    };
    w.uploadPhotoboothImage(input);
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.equal(d.getElementById("pb_captured_img").hidden, false);
    assert.equal(input.value, "");
  } finally {
    dom.window.close();
  }
});

test("photobooth initializes independently of drawing-grid setup", () => {
  const dom = new JSDOM("", {
    url: "https://eduwonderlab.com/lessons/3-2/homework",
    runScripts: "outside-only",
  });
  dom.window.document.addEventListener = () => {};
  dom.window.eval(HOMEWORK_TABS_JS);
  assert.equal(typeof dom.window.startPhotoboothCamera, "function");
  assert.equal(typeof dom.window.uploadPhotoboothImage, "function");
  dom.window.close();
});
