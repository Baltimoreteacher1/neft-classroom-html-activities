import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { STUDIO_SKIN_CSS, STUDIO_SKIN_JS } from "../scripts/homework-studio-skin.mjs";

const ROOT = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");

test("homework pages use access-practice-lab clean colors with no brown hero or paper overrides", () => {
  // Crisp cool-blue paper background from access-practice-lab
  assert.ok(STUDIO_SKIN_CSS.includes("#f5f8fc"), "carries #f5f8fc clean background");
  // Deep navy ink
  assert.ok(STUDIO_SKIN_CSS.includes("#14263d"), "carries #14263d deep ink");
  // Vibrant royal blue brand
  assert.ok(STUDIO_SKIN_CSS.includes("#2563eb"), "carries #2563eb primary brand");
  // Lightbox CSS
  assert.ok(STUDIO_SKIN_CSS.includes(".hw-lightbox-dialog"), "carries .hw-lightbox-dialog");
  assert.ok(STUDIO_SKIN_CSS.includes(".is-zoomable"), "carries .is-zoomable");

  // No brown unit overrides on .hw-hero or .btn-primary
  assert.ok(
    !STUDIO_SKIN_CSS.includes("background: var(--fp-unit-ink) !important"),
    "hero is not overridden with brown --fp-unit-ink",
  );
});

test("homework images and diagrams enlarge when clicked (lightbox contract)", () => {
  const markup = `
    <div class="vocab-thumb-wrap">
      <img class="vocab-thumb" src="/assets/vocab-images/ratio.svg" alt="Illustration of Ratio" width="260" height="195">
    </div>
    <div class="problem-visual-wrap">
      <img class="problem-visual-img" src="/assets/diagram.png" alt="Problem Diagram" width="300" height="200">
    </div>
    <figure class="concept-visual-wrap">
      <svg class="concept-svg" viewBox="0 0 640 410" role="img" aria-label="Concept Drawing">
        <rect width="640" height="410" fill="#fff"/>
      </svg>
      <button type="button" class="concept-zoom-btn">🔍 Tap to enlarge</button>
    </figure>
    <svg class="hw-model-svg" viewBox="0 0 400 120" role="img" aria-label="Tape Diagram">
      <rect width="400" height="120" fill="#fff"/>
    </svg>
  `;

  const dom = new JSDOM(`<!doctype html><html><body>${markup}</body></html>`, {
    url: "https://eduwonderlab.com/lessons/3-1/homework",
    pretendToBeVisual: true,
    runScripts: "dangerously",
  });

  const { window } = dom;
  const { document } = window;

  // Execute STUDIO_SKIN_JS in the window
  const scriptEl = document.createElement("script");
  scriptEl.textContent = STUDIO_SKIN_JS;
  document.body.appendChild(scriptEl);
  document.dispatchEvent(new window.Event("DOMContentLoaded"));

  // 1. Vocabulary thumbnail
  const vocabImg = document.querySelector(".vocab-thumb");
  assert.ok(vocabImg, "vocab-thumb image exists in DOM");
  assert.equal(vocabImg.dataset.zoomable, "1", "vocab-thumb is marked zoomable");
  assert.ok(vocabImg.classList.contains("is-zoomable"), "carries is-zoomable class");
  assert.equal(vocabImg.getAttribute("tabindex"), "0", "is keyboard reachable");

  // 2. Click opens lightbox
  vocabImg.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  const dlg = document.getElementById("hw_image_lightbox");
  assert.ok(dlg, "lightbox dialog exists");
  assert.ok(dlg.open || dlg.hasAttribute("open"), "lightbox is open");
  const enlargedImg = dlg.querySelector(".hw-lightbox-img");
  assert.ok(enlargedImg, "enlarged img rendered inside lightbox stage");
  assert.ok(enlargedImg.src.includes("ratio.svg"), "loads correct image source");

  // 3. Close button closes lightbox
  const closeBtn = dlg.querySelector(".hw-lightbox-close");
  assert.ok(closeBtn, "close button exists");
  closeBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  assert.ok(!dlg.open && !dlg.hasAttribute("open"), "lightbox is closed after click");

  // 4. Concept SVG figure
  const conceptSvg = document.querySelector(".concept-visual-wrap svg");
  assert.ok(conceptSvg, "concept svg exists");
  assert.equal(conceptSvg.dataset.zoomable, "1", "concept svg is marked zoomable");
  assert.ok(conceptSvg.classList.contains("is-zoomable"), "carries is-zoomable class");

  conceptSvg.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  assert.ok(dlg.open || dlg.hasAttribute("open"), "lightbox opens on SVG click");
  const enlargedSvg = dlg.querySelector(".hw-lightbox-svg");
  assert.ok(enlargedSvg, "enlarged svg cloned inside lightbox stage");

  // 5. Escape closes lightbox
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.ok(!dlg.open && !dlg.hasAttribute("open"), "lightbox closes on Escape");

  // 6. Problem visual image
  const problemImg = document.querySelector(".problem-visual-img");
  assert.equal(problemImg.dataset.zoomable, "1", "problem visual is marked zoomable");

  // 7. Mini model SVG
  const modelSvg = document.querySelector(".hw-model-svg");
  assert.equal(modelSvg.dataset.zoomable, "1", "hw-model-svg is marked zoomable");
});
