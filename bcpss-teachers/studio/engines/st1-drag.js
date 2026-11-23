// Pointer-based drag (mouse, pen, touch) with a click fallback. Keyboard users never need it:
// every drag target also works with select-then-place (Enter/Space on the chip, Enter/Space on the target).
//
//   const off = makeDraggable(el, { onDrop(targetEl), onPick() })
// Drop targets are any ancestors-or-self of the element under the pointer that carry [data-drop].
// A movement under 8px is a click and is left to the normal click handler.

const THRESHOLD = 8;

export function makeDraggable(
  el,
  { onDrop, onPick, onDragStart, onDragEnd, canDrag = () => true } = {},
) {
  let start = null;
  let ghost = null;
  let over = null;

  const targetAt = (x, y) => {
    if (ghost) ghost.style.visibility = "hidden";
    const hit = document.elementFromPoint(x, y);
    if (ghost) ghost.style.visibility = "";
    return hit?.closest?.("[data-drop]") || null;
  };
  const setOver = (t) => {
    if (over === t) return;
    over?.removeAttribute("data-over");
    over = t;
    over?.setAttribute("data-over", "true");
  };
  const cleanup = () => {
    ghost?.remove();
    ghost = null;
    setOver(null);
    el.removeAttribute("data-dragging");
    start = null;
  };

  const move = (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!ghost) {
      if (Math.hypot(dx, dy) < THRESHOLD) return;
      ghost = el.cloneNode(true);
      ghost.removeAttribute("id");
      ghost.setAttribute("aria-hidden", "true");
      ghost.removeAttribute("tabindex");
      const r = el.getBoundingClientRect();
      Object.assign(ghost.style, {
        position: "fixed",
        left: `${r.left}px`,
        top: `${r.top}px`,
        width: `${r.width}px`,
        margin: "0",
        pointerEvents: "none",
        zIndex: "1000",
        opacity: "0.92",
        boxShadow: "0 8px 20px rgb(24 34 48 / 25%)",
      });
      document.body.append(ghost);
      el.setAttribute("data-dragging", "true");
      start.moved = true;
      onDragStart?.();
    }
    ghost.style.transform = `translate(${dx}px, ${dy}px)`;
    setOver(targetAt(e.clientX, e.clientY));
  };

  const up = (e) => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", cancel);
    if (!start) return;
    const moved = start.moved;
    const t = moved ? targetAt(e.clientX, e.clientY) : null;
    cleanup();
    if (moved) {
      suppressClick(el);
      onDragEnd?.();
      if (t) onDrop?.(t);
    }
  };
  const cancel = () => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", cancel);
    if (start?.moved) onDragEnd?.();
    cleanup();
  };

  const down = (e) => {
    if (e.button > 0 || !canDrag()) return;
    start = { x: e.clientX, y: e.clientY, moved: false };
    onPick?.();
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", cancel);
  };
  el.addEventListener("pointerdown", down);
  el.style.touchAction = "none";
  return () => {
    el.removeEventListener("pointerdown", down);
    cancel();
  };
}

// A completed drag must not also fire the click that follows pointerup.
function suppressClick(el) {
  const block = (ev) => {
    ev.stopImmediatePropagation();
    ev.preventDefault();
  };
  el.addEventListener("click", block, { capture: true, once: true });
  setTimeout(() => el.removeEventListener("click", block, { capture: true }), 0);
}
