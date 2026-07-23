/*
 * reading-progress.js — a slim, calm scroll-progress bar pinned to the top of
 * every lesson. Publisher-grade polish: gives students a clear sense of how far
 * through the current view they are, complementing the phase navigation.
 *
 * Design constraints:
 *  - Purely additive and defensive: never throws, no-ops when it can't help.
 *  - Hidden inside iframes (embedded arcade / workbench own their own chrome).
 *  - Hidden when the page isn't meaningfully scrollable.
 *  - Respects prefers-reduced-motion (no width transition).
 *  - Sits below the Save/Resume launcher and any modal, above page content.
 */

let mounted = false;

export function mountReadingProgress() {
  if (mounted) return;
  // A rail inside an embedded frame would double the parent lesson's rail.
  try {
    if (window.self !== window.top) return;
  } catch (_e) {
    return;
  }
  if (typeof document === "undefined" || !document.body) return;
  if (document.getElementById("nt-read-progress")) return;
  mounted = true;

  const bar = document.createElement("div");
  bar.id = "nt-read-progress";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", "Lesson scroll progress");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  bar.setAttribute("aria-valuenow", "0");

  const fill = document.createElement("div");
  fill.className = "nt-read-progress-fill";
  bar.appendChild(fill);
  document.body.appendChild(bar);

  let ticking = false;

  function compute() {
    ticking = false;
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const max = (doc.scrollHeight || 0) - window.innerHeight;
    // Only show the rail once there's a real amount to scroll through.
    if (max <= 80) {
      bar.classList.remove("is-active");
      fill.style.width = "0%";
      bar.setAttribute("aria-valuenow", "0");
      return;
    }
    bar.classList.add("is-active");
    const pct = Math.max(0, Math.min(100, Math.round((scrollTop / max) * 100)));
    fill.style.width = pct + "%";
    bar.setAttribute("aria-valuenow", String(pct));
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(compute);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  // Phase switches swap the content (and its height) without a scroll event, so
  // recompute when the lesson DOM changes. Debounced via rAF in onScroll.
  try {
    const mo = new MutationObserver(onScroll);
    mo.observe(document.body, { childList: true, subtree: true });
  } catch (_e) {}

  // Initial paint (content may still be settling — recompute shortly after too).
  compute();
  setTimeout(compute, 400);
}
