/* Depth cue for the homepage hero: the solids shift a few pixels against the
 * pointer so the scene reads as an object with depth. Pointer-only, off under
 * reduced motion, one rAF-throttled listener, and it writes two custom
 * properties (--px, --py) that the stylesheet turns into a small translate. */
(() => {
  const stage = document.querySelector(".curriculum-guide");
  const scene = stage?.querySelector(".curriculum-hero-model");
  if (!scene) return;
  const still = matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)");
  if (still.matches) return;
  let frame = 0;
  stage.addEventListener("pointermove", (event) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const box = stage.getBoundingClientRect();
      scene.style.setProperty("--px", ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
      scene.style.setProperty("--py", ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
    });
  });
  stage.addEventListener("pointerleave", () => {
    scene.style.setProperty("--px", "0");
    scene.style.setProperty("--py", "0");
  });
})();
