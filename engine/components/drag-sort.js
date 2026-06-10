// ─────────────────────────────────────────────────────────────────────────
// Inject-once scoped polish styles. Rendered into 1000s of activities, so the
// <style> block is added exactly once per document and is purely ADDITIVE —
// it augments the existing .drag-item / .drag-zone classes without changing
// any layout the JS depends on. EVERY animation/transition/visual effect below
// lives inside `@media (prefers-reduced-motion: no-preference)`, so users who
// ask for reduced motion get the original, calm experience with no spring,
// parallax, glow, or rotation. Mobile single-column reflow (a layout aid, not
// motion) is the only rule outside that guard.
const DRAG_SORT_STYLE_ID = "ds-polish-styles";
function injectDragSortStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(DRAG_SORT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = DRAG_SORT_STYLE_ID;
  style.textContent = `
    /* Layout aid (not motion): on narrow screens collapse the category grid to
       a single full-width column so items and drop zones stay big and tappable. */
    @media (max-width: 560px) {
      .ds-cat-grid { grid-template-columns: 1fr !important; }
      .ds-cat-grid .drag-zone { min-height: 84px; }
      .drag-item { font-size: 1.05rem; padding: 10px 18px; }
    }

    @media (prefers-reduced-motion: no-preference) {
      /* Spring bounce when an item lands in a zone. */
      .drag-item.ds-landed {
        animation: dsSpringIn 0.42s var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
      }
      @keyframes dsSpringIn {
        0%   { transform: scale(0.86); }
        55%  { transform: scale(1.07); }
        100% { transform: scale(1); }
      }

      /* Parallax lift on the hovered category column while a drag is active. */
      .ds-cat-grid.ds-dragging .ds-col {
        transition: transform 0.22s ease-out, box-shadow 0.22s ease-out;
      }
      .ds-cat-grid.ds-dragging .ds-col.ds-parallax {
        transform: translateY(-6px);
      }
      .ds-cat-grid.ds-dragging .ds-col.ds-parallax .drag-zone {
        box-shadow: 0 14px 30px rgba(18, 53, 91, 0.14);
        border-color: var(--teal, #1fa6a2);
      }

      /* Touch drag clone: glow, rotate, and deepened shadow for tactile feel. */
      .drag-item.ds-touch-ghost {
        transition: box-shadow 0.18s ease-out;
        animation: dsTouchFloat 1.6s ease-in-out infinite;
        box-shadow:
          0 12px 30px rgba(18, 53, 91, 0.28),
          0 0 0 3px var(--teal-light, #dff2ee),
          0 0 18px rgba(31, 166, 162, 0.45);
      }
      @keyframes dsTouchFloat {
        0%, 100% { transform: scale(1.08) rotate(-2.5deg); }
        50%      { transform: scale(1.1) rotate(2.5deg); }
      }
    }
  `;
  (document.head || document.documentElement).append(style);
}

export function renderDragSort(container, config) {
  injectDragSortStyles();
  const { items, categories, onComplete } = config;
  // Some lessons author drag-sort WITHOUT a top-level `items` array, nesting the
  // content inside `categories[].items` instead. Left unhandled, `[...items]`
  // below throws ("items is not iterable") and the activity renders blank.
  // Normalize those shapes:
  //  • exactly one nested category  → an ORDERING task (put steps in order)
  //  • multiple nested categories   → a SORTING task (flatten to canonical)
  if (!Array.isArray(items) && Array.isArray(categories)) {
    const nested = categories.filter((c) => c && Array.isArray(c.items));
    if (nested.length === 1) {
      return renderDragOrder(container, {
        steps: nested[0].items,
        label: nested[0].label || config.label,
        onComplete,
      });
    }
    if (nested.length > 1) {
      const flatItems = nested.flatMap((c) =>
        c.items.map((t) => ({ text: String(t), category: c.label })),
      );
      const flatCats = nested.map((c) => ({ id: c.label, label: c.label }));
      return renderDragSortCore(container, {
        items: flatItems,
        categories: flatCats,
        onComplete,
      });
    }
  }
  return renderDragSortCore(container, { items, categories, onComplete });
}

// Accessible "put these in the correct order" interaction. Renders the steps
// shuffled, each with ▲/▼ controls (works on Chromebooks/touch without drag),
// and checks the arrangement against the authored order.
function renderDragOrder(container, { steps, label, onComplete }) {
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (label) {
    const lab = document.createElement("div");
    lab.className = "badge badge-navy mb-4";
    lab.textContent = label;
    wrapper.append(lab);
  }

  const correct = steps.map(String);
  // Shuffle a copy for the initial (scrambled) presentation.
  let order = [...correct].sort(() => Math.random() - 0.5);
  // Avoid the rare already-correct shuffle so there is always a task to do.
  if (correct.length > 1 && order.every((s, i) => s === correct[i])) {
    order = [order[order.length - 1], ...order.slice(0, -1)];
  }

  const list = document.createElement("div");
  list.style.cssText = "display:flex; flex-direction:column; gap:var(--sp-2);";
  wrapper.append(list);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";

  // Index that just moved, so draw() can spring-animate the landing row.
  let justMoved = -1;
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    justMoved = j;
    draw();
  }

  function draw() {
    list.innerHTML = "";
    order.forEach((text, i) => {
      const row = document.createElement("div");
      row.style.cssText =
        "display:flex; align-items:center; gap:var(--sp-3); padding:10px 12px; background:var(--cream,#fdf6ec); border:1px solid rgba(0,0,0,0.08); border-radius:10px;";
      const num = document.createElement("span");
      num.style.cssText =
        "flex:0 0 auto; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; background:var(--teal,#2a9d8f); color:#fff; border-radius:50%; font-weight:800; font-size:0.85rem;";
      num.textContent = String(i + 1);
      const txt = document.createElement("span");
      txt.style.cssText = "flex:1; font-weight:600;";
      txt.textContent = text;
      const controls = document.createElement("div");
      controls.style.cssText = "flex:0 0 auto; display:flex; gap:4px;";
      const up = document.createElement("button");
      up.type = "button";
      up.className = "btn btn-secondary";
      up.style.cssText = "padding:4px 10px; min-width:0;";
      up.textContent = "▲";
      up.setAttribute("aria-label", `Move "${text}" up`);
      up.disabled = i === 0;
      up.addEventListener("click", () => move(i, -1));
      const down = document.createElement("button");
      down.type = "button";
      down.className = "btn btn-secondary";
      down.style.cssText = "padding:4px 10px; min-width:0;";
      down.textContent = "▼";
      down.setAttribute("aria-label", `Move "${text}" down`);
      down.disabled = i === order.length - 1;
      down.addEventListener("click", () => move(i, 1));
      controls.append(up, down);
      row.append(num, txt, controls);
      if (i === justMoved) row.classList.add("ds-landed");
      list.append(row);
    });
    justMoved = -1;
  }
  draw();

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4";
  checkBtn.textContent = "Check Order";
  let done = false;
  checkBtn.addEventListener("click", () => {
    if (done) return;
    const right = order.every((s, i) => s === correct[i]);
    feedbackSlot.innerHTML = "";
    if (right) {
      done = true;
      checkBtn.style.display = "none";
      showFb(feedbackSlot, "success", "Correct order! Nicely sequenced.");
      if (onComplete) onComplete(order.length, order.length);
    } else {
      const numRight = order.filter((s, i) => s === correct[i]).length;
      showFb(
        feedbackSlot,
        "hint",
        `${numRight} of ${order.length} in the right spot. Use ▲ ▼ to rearrange, then check again.`,
      );
    }
  });

  wrapper.append(feedbackSlot, checkBtn);
  container.append(wrapper);
}

function renderDragSortCore(container, { items, categories, onComplete }) {
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  const bankLabel = document.createElement("div");
  bankLabel.className = "badge badge-navy mb-4";
  bankLabel.textContent = "Drag items into the correct category";
  wrapper.append(bankLabel);

  const bank = document.createElement("div");
  bank.className = "drag-zone";
  bank.dataset.zone = "bank";
  bank.style.cssText =
    "margin-bottom:var(--sp-5); min-height:60px; background:var(--cream);";

  const shuffled = [...items].sort(() => Math.random() - 0.5);
  shuffled.forEach((item) => {
    const el = createDragItem(item);
    bank.append(el);
  });

  wrapper.append(bank);

  const catGrid = document.createElement("div");
  catGrid.className = "ds-cat-grid";
  catGrid.style.cssText = `display:grid; grid-template-columns:repeat(${Math.min(categories.length, 3)}, 1fr); gap:var(--sp-4);`;

  const zones = [];
  categories.forEach((cat) => {
    const col = document.createElement("div");
    col.className = "ds-col";

    const label = document.createElement("div");
    label.className = "badge badge-teal mb-4";
    label.textContent = cat.label;
    col.append(label);

    const zone = document.createElement("div");
    zone.className = "drag-zone";
    zone.dataset.zone = cat.id;
    zone.style.minHeight = "100px";
    col.append(zone);

    zones.push({ zone, catId: cat.id });
    catGrid.append(col);
  });

  wrapper.append(catGrid);

  const allZones = [bank, ...zones.map((z) => z.zone)];
  setupDragDrop(allZones, { catGrid });

  // Parallax: lift the hovered category column while a desktop drag is in
  // flight. Purely visual and CSS-gated by prefers-reduced-motion. The
  // `ds-dragging` flag on the grid scopes the effect to active drags only.
  wrapper.addEventListener("dragstart", () =>
    catGrid.classList.add("ds-dragging"),
  );
  wrapper.addEventListener("dragend", () => {
    catGrid.classList.remove("ds-dragging");
    catGrid
      .querySelectorAll(".ds-col.ds-parallax")
      .forEach((c) => c.classList.remove("ds-parallax"));
  });
  catGrid.querySelectorAll(".ds-col").forEach((col) => {
    col.addEventListener("dragenter", () => col.classList.add("ds-parallax"));
    col.addEventListener("dragleave", (e) => {
      if (!col.contains(e.relatedTarget)) col.classList.remove("ds-parallax");
    });
    col.addEventListener("drop", () => col.classList.remove("ds-parallax"));
  });

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4";
  checkBtn.textContent = "Check Sorting";
  checkBtn.addEventListener("click", () => {
    let correct = 0;
    let total = items.length;

    zones.forEach(({ zone, catId }) => {
      zone.querySelectorAll(".drag-item").forEach((el) => {
        const itemData = items.find((it) => it.text === el.textContent);
        if (itemData && itemData.category === catId) {
          el.classList.remove("incorrect");
          el.classList.add("correct");
          correct++;
        } else {
          el.classList.remove("correct");
          el.classList.add("incorrect");
        }
      });
    });

    bank.querySelectorAll(".drag-item").forEach((el) => {
      el.classList.add("incorrect");
    });

    const allCorrect =
      correct === total && bank.querySelectorAll(".drag-item").length === 0;
    const fb = document.createElement("div");
    const fbType = allCorrect ? "success" : "hint";
    const fbMsg = allCorrect
      ? `All ${total} items sorted correctly!`
      : `${correct} of ${total} correct. Drag the highlighted items to the right category.`;

    fb.className = `feedback feedback-${fbType} visible`;
    fb.setAttribute("role", "alert");
    fb.innerHTML = `
      <span class="feedback-icon">${allCorrect ? "✓" : "💡"}</span>
      <span>${fbMsg}</span>
    `;
    feedbackSlot.innerHTML = "";
    feedbackSlot.append(fb);

    if (allCorrect && onComplete) onComplete(correct, total);
  });

  wrapper.append(checkBtn);
  container.append(wrapper);
}

function createDragItem(item) {
  const el = document.createElement("div");
  el.className = "drag-item";
  el.textContent = item.text;
  el.draggable = true;
  el.dataset.itemId = item.text;

  el.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", item.text);
    e.dataTransfer.effectAllowed = "move";
    el.classList.add("dragging");
    requestAnimationFrame(() => el.classList.add("drag-ghost"));
  });

  el.addEventListener("dragend", () => {
    el.classList.remove("dragging", "drag-ghost");
  });

  // Touch support for Chromebooks
  let touchClone = null;
  let originZone = null;

  el.addEventListener(
    "touchstart",
    (e) => {
      originZone = el.parentElement;
      touchClone = el.cloneNode(true);
      // ds-touch-ghost adds the (reduced-motion-gated) glow, rotate, and deep
      // shadow. The base inline styles keep it functional even when motion is
      // reduced (the animation/transform simply does not apply).
      touchClone.classList.add("ds-touch-ghost");
      touchClone.style.cssText = `
      position:fixed; z-index:1000; pointer-events:none; opacity:0.9;
      box-shadow:0 8px 24px rgba(18,53,91,0.2);
    `;
      document.body.append(touchClone);
      moveTouchClone(e);
    },
    { passive: true },
  );

  el.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      moveTouchClone(e);
      const target = getDropZoneUnderTouch(e);
      document
        .querySelectorAll(".drag-zone")
        .forEach((z) => z.classList.remove("over"));
      if (target) target.classList.add("over");
    },
    { passive: false },
  );

  el.addEventListener("touchend", (e) => {
    if (touchClone) {
      touchClone.remove();
      touchClone = null;
    }
    document
      .querySelectorAll(".drag-zone")
      .forEach((z) => z.classList.remove("over"));
    const target = getDropZoneUnderTouch(e) || originZone;
    if (target && target !== el.parentElement) {
      target.append(el);
      springBounce(el);
    }
    originZone = null;
  });

  return el;
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.setAttribute("role", "alert");
  fb.innerHTML = `<span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span><span>${msg}</span>`;
  slot.innerHTML = "";
  slot.append(fb);
}

function moveTouchClone(e) {
  const touch = e.touches?.[0] || e.changedTouches?.[0];
  if (!touch) return;
  const clone = document.querySelector('.drag-item[style*="fixed"]');
  if (!clone) return;
  clone.style.left = `${touch.clientX - 40}px`;
  clone.style.top = `${touch.clientY - 20}px`;
}

function getDropZoneUnderTouch(e) {
  const touch = e.touches?.[0] || e.changedTouches?.[0];
  if (!touch) return null;
  const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
  return elements.find((el) => el.classList.contains("drag-zone")) || null;
}

// Apply the ease-out spring bounce to an item that just landed. CSS-gated by
// prefers-reduced-motion, so it is a no-op visual when motion is reduced. The
// class is removed after the animation so a future drop can replay it.
function springBounce(el) {
  if (!el) return;
  el.classList.remove("ds-landed");
  // Force reflow so re-adding the class restarts the animation.
  void el.offsetWidth;
  el.classList.add("ds-landed");
  el.addEventListener("animationend", () => el.classList.remove("ds-landed"), {
    once: true,
  });
}

// The optional second argument is accepted for forward-compatible call sites
// (e.g. parallax context); the bank's setup omits it. It does not alter
// drop/checking behavior.
function setupDragDrop(zones, _ctx) {
  zones.forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("over");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("over");
    });

    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("over");
      const text = e.dataTransfer.getData("text/plain");
      const dragEl = document.querySelector(
        `.drag-item[data-item-id="${CSS.escape(text)}"]`,
      );
      if (dragEl) {
        dragEl.classList.remove("correct", "incorrect");
        zone.append(dragEl);
        springBounce(dragEl);
        zone.classList.add("drop-snap");
        zone.addEventListener(
          "animationend",
          () => zone.classList.remove("drop-snap"),
          { once: true },
        );
      }
    });
  });
}
