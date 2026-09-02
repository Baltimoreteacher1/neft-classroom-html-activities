// ─────────────────────────────────────────────────────────────────────────
// Inject-once scoped polish styles. Rendered into 1000s of activities, so the
// <style> block is added exactly once per document and is purely ADDITIVE —
// it augments the existing .drag-item / .drag-zone classes without changing
// any layout the JS depends on. EVERY animation/transition/visual effect below
// lives inside `@media (prefers-reduced-motion: no-preference)`, so users who
// ask for reduced motion get the original, calm experience with no spring,
// parallax, glow, or rotation. Mobile single-column reflow (a layout aid, not
// motion) is the only rule outside that guard.
import { stackContent, stackT } from "../core/i18n.js";

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
  // Normalize a plain-string category ("Statistical Question") to the {id,label}
  // object the core renderer expects.
  const toCat = (c) => (typeof c === "string" ? { id: c, label: c } : c);

  // `cards` shape: lessons author the sortable items as `cards: [{text, correct}]`
  // (where `correct` is an index into `categories`) or `[{text, category}]`, with
  // `categories` as plain strings. Left unhandled, `items` is undefined and the
  // core crashes on `items.map`. Map it to the core's {text, category} shape.
  if (!Array.isArray(items) && Array.isArray(config.cards) && Array.isArray(categories)) {
    const cats = categories.map(toCat);
    const resolved = config.cards.map((c) => ({
      text: c.text != null ? String(c.text) : String(c.label ?? ""),
      // Mirror the English fallback chain so a card authored as {label,labelEs}
      // keeps its Spanish, not just one authored as {text,textEs}.
      textEs: c.text != null ? c.textEs : (c.labelEs ?? c.textEs),
      category:
        typeof c.category === "string"
          ? c.category
          : typeof c.correct === "number"
            ? cats[c.correct]?.id
            : undefined,
    }));
    return renderDragSortCore(container, {
      items: resolved,
      categories: cats,
      onComplete,
    });
  }
  // Some lessons author an ORDERING task as a flat `items` array (the presented/
  // scrambled set) plus a separate `correctOrder` array (the target sequence),
  // with no `categories` field at all. Left unhandled, `categories.length` below
  // throws ("Cannot read properties of undefined") and the activity renders
  // blank. `correctOrder` is the authored answer key — use it (not `items`,
  // which may already be pre-shuffled) as the steps renderDragOrder checks against.
  if (Array.isArray(items) && Array.isArray(config.correctOrder) && !Array.isArray(categories)) {
    return renderDragOrder(container, {
      steps: config.correctOrder,
      label: config.label,
      onComplete,
    });
  }
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
        c.items.map((t, i) => ({
          text: String(t),
          textEs: Array.isArray(c.itemsEs) ? c.itemsEs[i] : undefined,
          category: c.label,
        })),
      );
      const flatCats = nested.map((c) => ({ id: c.label, label: c.label, labelEs: c.labelEs }));
      return renderDragSortCore(container, {
        items: flatItems,
        categories: flatCats,
        onComplete,
      });
    }
  }
  return renderDragSortCore(container, {
    items,
    categories: Array.isArray(categories) ? categories.map(toCat) : categories,
    onComplete,
  });
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
  // Registered as a live region while still empty, so the feedback written
  // into it later is announced — an alert born in the same task is not.
  feedbackSlot.setAttribute("role", "status");
  feedbackSlot.setAttribute("aria-live", "polite");

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
        "flex:0 0 auto; width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; background:var(--teal,#2a9d8f); color:#fff; border-radius:50%; font-weight:700; font-size:0.85rem;";
      num.textContent = String(i + 1);
      const txt = document.createElement("span");
      txt.style.cssText = "flex:1; font-weight:500;";
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
  checkBtn.innerHTML = stackT("dsCheckOrder");
  let done = false;
  checkBtn.addEventListener("click", () => {
    if (done) return;
    const right = order.every((s, i) => s === correct[i]);
    feedbackSlot.innerHTML = "";
    if (right) {
      done = true;
      checkBtn.style.display = "none";
      showFb(feedbackSlot, "success", stackT("dsOrderRight"));
      if (onComplete) onComplete(order.length, order.length);
    } else {
      const numRight = order.filter((s, i) => s === correct[i]).length;
      showFb(feedbackSlot, "hint", stackT("dsOrderPartial", { n: numRight, t: order.length }));
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
  bankLabel.innerHTML = stackT("dsBank");
  wrapper.append(bankLabel);

  const bank = document.createElement("div");
  bank.className = "drag-zone";
  bank.dataset.zone = "bank";
  bank.style.cssText = "margin-bottom:var(--sp-5); min-height:60px; background:var(--cream);";
  wireZoneKeyboard(bank, "Return the picked-up item to the item bank");

  // Tag each item with a stable unique id so grading and drag/drop don't key off
  // the display text (which collides when two items share the same text).
  const itemsWithId = items.map((it, i) => ({ ...it, _id: String(i) }));
  const catById = new Map(itemsWithId.map((it) => [it._id, it.category]));
  const shuffled = [...itemsWithId].sort(() => Math.random() - 0.5);
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
    label.innerHTML = stackContent(cat.label, cat.labelEs);
    col.append(label);

    const zone = document.createElement("div");
    zone.className = "drag-zone";
    zone.dataset.zone = cat.id;
    zone.style.minHeight = "100px";
    wireZoneKeyboard(zone, `Place the picked-up item in ${cat.label}`);
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
  wrapper.addEventListener("dragstart", () => catGrid.classList.add("ds-dragging"));
  wrapper.addEventListener("dragend", () => {
    catGrid.classList.remove("ds-dragging");
    catGrid
      .querySelectorAll(".ds-col.ds-parallax")
      .forEach((c) => c.classList.remove("ds-parallax"));
  });
  catGrid.querySelectorAll(".ds-col").forEach((col) => {
    col.addEventListener("dragenter", () => col.classList.add("ds-parallax"));
    col.addEventListener("dragleave", (e) => {
      if (!col.contains(/** @type {Node|null} */ (/** @type {DragEvent} */ (e).relatedTarget)))
        col.classList.remove("ds-parallax");
    });
    col.addEventListener("drop", () => col.classList.remove("ds-parallax"));
  });

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  // Same live-region contract as the sort variant's slot above.
  feedbackSlot.setAttribute("role", "status");
  feedbackSlot.setAttribute("aria-live", "polite");
  wrapper.append(feedbackSlot);

  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary mt-4";
  checkBtn.innerHTML = stackT("dsCheckSorting");
  checkBtn.addEventListener("click", () => {
    let correct = 0;
    let total = items.length;

    zones.forEach(({ zone, catId }) => {
      zone.querySelectorAll(".drag-item").forEach((el) => {
        if (catById.get(el.dataset.itemId) === catId) {
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

    const allCorrect = correct === total && bank.querySelectorAll(".drag-item").length === 0;
    const fb = document.createElement("div");
    const fbType = allCorrect ? "success" : "hint";
    const fbMsg = allCorrect
      ? stackT("dsAllSorted", { t: total })
      : stackT("dsPartialSorted", { n: correct, t: total });

    fb.className = `feedback feedback-${fbType} visible`;
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

// Keyboard/tap "pick up then place" fallback so the sort is operable without a
// mouse drag. A single item is selected at a time; clicking/activating a drop
// zone moves the selected item there. Shared across items/zones in one render.
let dsSelected = null;
let activeDragElement = null;
function dsClearSelection() {
  if (dsSelected) {
    dsSelected.classList.remove("ds-selected");
    dsSelected.style.outline = "";
    dsSelected.style.outlineOffset = "";
    dsSelected.setAttribute("aria-pressed", "false");
    dsSelected = null;
  }
}
function dsSelect(el) {
  if (dsSelected === el) {
    dsClearSelection();
    return;
  }
  dsClearSelection();
  dsSelected = el;
  el.classList.add("ds-selected");
  el.style.outline = "3px solid var(--teal, #1fa6a2)";
  el.style.outlineOffset = "2px";
  el.setAttribute("aria-pressed", "true");
}
function dsPlaceInto(zone) {
  if (!dsSelected) return;
  const el = dsSelected;
  if (zone !== el.parentElement) {
    zone.append(el);
    springBounce(el);
  }
  dsClearSelection();
  el.focus();
}
// Make a drop zone able to receive the selected item via click/Enter/Space.
function wireZoneKeyboard(zone, labelText) {
  zone.tabIndex = 0;
  zone.setAttribute("role", "button");
  zone.setAttribute("aria-label", labelText);
  zone.addEventListener("click", () => dsPlaceInto(zone));
  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dsPlaceInto(zone);
    }
  });
}

function createDragItem(item) {
  const el = document.createElement("div");
  el.className = "drag-item";
  el.draggable = true;
  el.dataset.itemId = item._id != null ? item._id : item.text;

  el.style.cssText =
    "display:inline-flex; flex-direction:column; align-items:center; justify-content:center; padding:10px 14px; gap:4px; text-align:center; min-width:80px;";

  const labelSpan = document.createElement("span");
  labelSpan.innerHTML = stackContent(item.text, item.textEs);
  labelSpan.style.cssText = "font-weight:600; font-size:1.1rem; line-height:1.2;";
  el.append(labelSpan);

  const numVal = parseInt(item.text);
  if (!isNaN(numVal) && numVal > 1 && numVal <= 30) {
    const svgHtml = createNumberArraySVG(numVal);
    if (svgHtml) {
      const svgContainer = document.createElement("div");
      svgContainer.innerHTML = svgHtml;
      el.append(svgContainer);
    }
  }

  // Visual pop-up preview button if item text or visual property has an illustration preview
  const visualInfo = item.visual || getVisualForText(item.text);
  if (visualInfo) {
    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "ds-preview-btn";
    previewBtn.style.cssText =
      "margin-top:4px; padding:3px 8px; font-size:11.5px; font-weight:600; border:1px solid var(--teal, #1fa6a2); border-radius:999px; background:var(--teal-light, #eaf0f7); color:var(--teal-dark, #0d7a76); cursor:pointer; display:inline-flex; align-items:center; gap:3px; transition:transform 0.1s ease;";
    previewBtn.innerHTML = "🔍 View Model";
    previewBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // don't trigger drag selection
      openDragItemModal(
        visualInfo.title || item.text,
        visualInfo.svg || "",
        visualInfo.explanation || "",
      );
    });
    previewBtn.addEventListener("touchend", (e) => {
      e.stopPropagation();
    });
    el.append(previewBtn);
  }

  // Keyboard/tap selection (paired with wireZoneKeyboard on the drop zones).
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.setAttribute("aria-pressed", "false");
  el.setAttribute("aria-label", `${item.text} — press Enter to pick up, then choose a category`);
  el.addEventListener("click", (e) => {
    e.stopPropagation(); // don't bubble to the zone's place handler
    dsSelect(el);
  });
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      dsSelect(el);
    }
  });

  el.addEventListener("dragstart", (e) => {
    activeDragElement = el;
    e.dataTransfer.setData("text/plain", el.dataset.itemId);
    e.dataTransfer.effectAllowed = "move";
    el.classList.add("dragging");
    requestAnimationFrame(() => el.classList.add("drag-ghost"));
  });

  el.addEventListener("dragend", () => {
    el.classList.remove("dragging", "drag-ghost");
    if (activeDragElement === el) {
      activeDragElement = null;
    }
  });

  // Touch support for Chromebooks / iPads with conflict prevention
  let touchClone = null;
  let originZone = null;

  el.addEventListener(
    "touchstart",
    (e) => {
      // Disable native HTML5 drag processing to prevent dual-cursor rendering and sticking
      el.draggable = false;
      originZone = el.parentElement;
      touchClone = el.cloneNode(true);
      // ds-touch-ghost adds the glow, rotate, and shadow
      touchClone.classList.add("ds-touch-ghost");
      touchClone.style.cssText = `
        position:fixed; z-index:1000; pointer-events:none; opacity:0.9;
        box-shadow:0 8px 24px rgba(18,53,91,0.2);
      `;
      document.body.append(touchClone);
      moveTouchClone(e, touchClone);
    },
    { passive: true },
  );

  el.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      moveTouchClone(e, touchClone);
      const target = getDropZoneUnderTouch(e);
      document.querySelectorAll(".drag-zone").forEach((z) => z.classList.remove("over"));
      if (target) target.classList.add("over");
    },
    { passive: false },
  );

  el.addEventListener("touchend", (e) => {
    el.draggable = true; // Restore native drag capability
    if (touchClone) {
      touchClone.remove();
      touchClone = null;
    }
    document.querySelectorAll(".drag-zone").forEach((z) => z.classList.remove("over"));
    const target = getDropZoneUnderTouch(e) || originZone;
    if (target && target !== el.parentElement) {
      target.append(el);
      springBounce(el);
    }
    originZone = null;
  });

  el.addEventListener("touchcancel", () => {
    el.draggable = true; // Restore native drag capability
    if (touchClone) {
      touchClone.remove();
      touchClone = null;
    }
    document.querySelectorAll(".drag-zone").forEach((z) => z.classList.remove("over"));
    originZone = null;
  });

  return el;
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.innerHTML = `<span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span><span>${msg}</span>`;
  slot.innerHTML = "";
  slot.append(fb);
}

function moveTouchClone(e, clone) {
  const touch = e.touches?.[0] || e.changedTouches?.[0];
  if (!touch || !clone) return;
  clone.style.left = `${touch.clientX - 40}px`;
  clone.style.top = `${touch.clientY - 20}px`;
}

function getDropZoneUnderTouch(e) {
  const touch = e.touches?.[0] || e.changedTouches?.[0];
  if (!touch) return null;
  const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
  return elements.find((el) => el.classList.contains("drag-zone")) || null;
}

// Apply the ease-out spring bounce to an item that just landed.
function springBounce(el) {
  if (!el) return;
  el.classList.remove("ds-landed");
  void el.offsetWidth;
  el.classList.add("ds-landed");
  el.addEventListener("animationend", () => el.classList.remove("ds-landed"), {
    once: true,
  });
}

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
      // Fall back to module level tracker if dataTransfer is empty/blocked
      const text = e.dataTransfer.getData("text/plain");
      let dragEl = activeDragElement;
      if (!dragEl && text) {
        dragEl = document.querySelector(`.drag-item[data-item-id="${CSS.escape(text)}"]`);
      }
      if (dragEl) {
        dragEl.classList.remove("correct", "incorrect");
        zone.append(dragEl);
        springBounce(dragEl);
        zone.classList.add("drop-snap");
        zone.addEventListener("animationend", () => zone.classList.remove("drop-snap"), {
          once: true,
        });
      }
    });
  });
}

function createNumberArraySVG(num) {
  if (isNaN(num) || num <= 1 || num > 30) return "";

  // Find closest factor pair (a, b) where a <= b and a * b = num
  let r = Math.floor(Math.sqrt(num));
  let cols = num;
  let rows = 1;
  for (let i = r; i >= 1; i--) {
    if (num % i === 0) {
      rows = i;
      cols = num / i;
      break;
    }
  }

  const isPrime = rows === 1;
  const dotRadius = 3;
  const gap = 9;
  const padding = 4;

  const width = (cols - 1) * gap + padding * 2;
  const height = (rows - 1) * gap + padding * 2;

  let dotsSvg = "";
  // In drag-sort: dark theme is not active, standard light styling is used.
  // We use standard colors: teal-dark (#0d7a76) for primes, amber-dark (#b07a10) for composites.
  const color = isPrime ? "#0d7a76" : "#b07a10";

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = padding + c * gap;
      const cy = padding + r * gap;
      dotsSvg += `<circle cx="${cx}" cy="${cy}" r="${dotRadius}" fill="${color}" opacity="0.85" />`;
    }
  }

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display:block; margin:4px auto 0; overflow:visible;">${dotsSvg}</svg>`;
}

function openDragItemModal(title, svgContent, text) {
  let dialog = /** @type {HTMLDialogElement|null} */ (document.getElementById("ds-preview-dialog"));
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "ds-preview-dialog";
    dialog.className = "sg-info-dialog";
    dialog.style.cssText =
      "padding:0; border:1px solid var(--sg-line, #d8dfe6); border-radius:18px; max-width:540px; width:90%; background:#fff; box-shadow:0 20px 45px rgba(0,0,0,0.25);";
    document.body.appendChild(dialog);
  }
  dialog.innerHTML = `
    <div style="position:relative; padding:24px; text-align:center;">
      <button type="button" class="sg-info-close" style="position:absolute; top:14px; right:16px; border:none; background:none; font-size:24px; cursor:pointer; color:#64748b;" onclick="this.closest('dialog').close()">&times;</button>
      <h3 style="margin:0 0 10px; font-family:var(--sg-display, sans-serif); font-size:1.35rem; color:#0f172a;">${title}</h3>
      <div style="margin:14px 0; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; display:flex; justify-content:center; align-items:center;">${svgContent}</div>
      <p style="margin:12px 0 0; font-size:0.95rem; color:#475569; line-height:1.5;">${text || ""}</p>
      <button type="button" class="btn btn-primary" style="margin-top:16px; padding:8px 20px; font-weight:600;" onclick="this.closest('dialog').close()">Close Preview</button>
    </div>
  `;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  }
}

function getVisualForText(text) {
  const t = String(text || "").toLowerCase();
  if (t.includes("butterfly")) {
    return {
      title: "Butterfly (Bilateral Symmetry)",
      explanation:
        "A line down the body divides the butterfly into two identical mirror-image wings.",
      svg: `<svg viewBox="0 0 200 160" width="180" height="144" style="background:white; border-radius:8px;"><g stroke="#0f172a" stroke-width="2" fill="none"><path d="M 100,20 C 60,10 20,40 30,80 C 40,110 90,120 100,140 C 110,120 160,110 170,80 C 180,40 140,10 100,20 Z" fill="#e0f2fe"/><path d="M 100,40 C 70,30 40,60 50,90 C 60,110 90,110 100,125 C 110,110 140,110 150,90 C 160,60 130,30 100,40 Z" fill="#38bdf8" opacity="0.6"/><circle cx="70" cy="65" r="8" fill="#0284c7"/><circle cx="130" cy="65" r="8" fill="#0284c7"/><line x1="100" y1="10" x2="100" y2="150" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="5,4"/><circle cx="100" cy="25" r="4" fill="#0f172a"/></g><text x="100" y="156" text-anchor="middle" font-size="11" fill="#ef4444" font-weight="bold">Line of Symmetry</text></svg>`,
    };
  }
  if (t.includes("ladybug")) {
    return {
      title: "Ladybug (Bilateral Symmetry)",
      explanation: "The left shell and right shell mirror each other across the central line.",
      svg: `<svg viewBox="0 0 180 160" width="162" height="144" style="background:white; border-radius:8px;"><circle cx="90" cy="90" r="55" fill="#ef4444" stroke="#0f172a" stroke-width="3"/><circle cx="90" cy="40" r="22" fill="#0f172a"/><line x1="90" y1="35" x2="90" y2="145" stroke="#0f172a" stroke-width="3"/><circle cx="65" cy="75" r="7" fill="#0f172a"/><circle cx="115" cy="75" r="7" fill="#0f172a"/><circle cx="65" cy="110" r="7" fill="#0f172a"/><circle cx="115" cy="110" r="7" fill="#0f172a"/><line x1="90" y1="15" x2="90" y2="145" stroke="#2563eb" stroke-width="2" stroke-dasharray="4,3"/><text x="90" y="155" text-anchor="middle" font-size="11" fill="#2563eb" font-weight="bold">Line of Symmetry</text></svg>`,
    };
  }
  if (t.includes("dragonfly")) {
    return {
      title: "Dragonfly (Bilateral Symmetry)",
      explanation:
        "Long slender body with matched pairs of wings extending symmetrically on both sides.",
      svg: `<svg viewBox="0 0 200 160" width="180" height="144" style="background:white; border-radius:8px;"><ellipse cx="100" cy="80" rx="6" ry="60" fill="#0f172a"/><ellipse cx="55" cy="60" rx="40" ry="10" fill="#2dd4bf" stroke="#0f172a" stroke-width="1.5" transform="rotate(-10 55 60)"/><ellipse cx="145" cy="60" rx="40" ry="10" fill="#2dd4bf" stroke="#0f172a" stroke-width="1.5" transform="rotate(10 145 60)"/><ellipse cx="60" cy="85" rx="35" ry="8" fill="#2dd4bf" stroke="#0f172a" stroke-width="1.5" transform="rotate(5 60 85)"/><ellipse cx="140" cy="85" rx="35" ry="8" fill="#2dd4bf" stroke="#0f172a" stroke-width="1.5" transform="rotate(-5 140 85)"/><line x1="100" y1="10" x2="100" y2="150" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,3"/><text x="100" y="156" text-anchor="middle" font-size="11" fill="#ef4444" font-weight="bold">Line of Symmetry</text></svg>`,
    };
  }
  if (t.includes("leaf") || t.includes("leaves")) {
    return {
      title: "Layer of Leaves (Bilateral Symmetry)",
      explanation: "Two leaves growing opposite each other form a mirror pair across the stem.",
      svg: `<svg viewBox="0 0 200 160" width="180" height="144" style="background:white; border-radius:8px;"><path d="M 100,140 Q 50,110 40,70 Q 70,50 100,80 Z" fill="#4ade80" stroke="#15803d" stroke-width="2"/><path d="M 100,140 Q 150,110 160,70 Q 130,50 100,80 Z" fill="#4ade80" stroke="#15803d" stroke-width="2"/><line x1="100" y1="20" x2="100" y2="150" stroke="#166534" stroke-width="3"/><line x1="100" y1="20" x2="100" y2="150" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,3"/><text x="100" y="156" text-anchor="middle" font-size="11" fill="#ef4444" font-weight="bold">Center Stem / Symmetry</text></svg>`,
    };
  }
  if (t.includes("face")) {
    return {
      title: "Human Face (Bilateral Symmetry)",
      explanation: "Eyes, ears, and features mirror across the center line of the face.",
      svg: `<svg viewBox="0 0 160 160" width="144" height="144" style="background:white; border-radius:8px;"><ellipse cx="80" cy="80" rx="50" ry="60" fill="#fde047" stroke="#0f172a" stroke-width="2"/><circle cx="60" cy="70" r="7" fill="#0f172a"/><circle cx="100" cy="70" r="7" fill="#0f172a"/><path d="M 60 110 Q 80 130 100 110" stroke="#0f172a" stroke-width="3" fill="none"/><line x1="80" y1="10" x2="80" y2="150" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,3"/><text x="80" y="156" text-anchor="middle" font-size="11" fill="#ef4444" font-weight="bold">Line of Symmetry</text></svg>`,
    };
  }
  if (t.includes("letter f") || t.includes("the letter f")) {
    return {
      title: "Letter F (No Bilateral Symmetry)",
      explanation:
        "There is no line you can draw where the left/right or top/bottom halves mirror each other.",
      svg: `<svg viewBox="0 0 160 160" width="144" height="144" style="background:white; border-radius:8px;"><text x="80" y="120" text-anchor="middle" font-size="110" font-family="Outfit, sans-serif" font-weight="900" fill="#64748b">F</text><line x1="80" y1="20" x2="80" y2="140" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,3"/><path d="M 40 40 L 120 120 M 120 40 L 40 120" stroke="#ef4444" stroke-width="4" opacity="0.6"/><text x="80" y="155" text-anchor="middle" font-size="11" fill="#ef4444" font-weight="bold">No Mirror Line (Asymmetric)</text></svg>`,
    };
  }
  if (t.includes("letter r") || t.includes("the letter r")) {
    return {
      title: "Letter R (No Bilateral Symmetry)",
      explanation:
        "The curved top loop and diagonal leg on the right side do not match the straight left bar.",
      svg: `<svg viewBox="0 0 160 160" width="144" height="144" style="background:white; border-radius:8px;"><text x="80" y="120" text-anchor="middle" font-size="110" font-family="Outfit, sans-serif" font-weight="900" fill="#64748b">R</text><line x1="80" y1="20" x2="80" y2="140" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,3"/><path d="M 40 40 L 120 120 M 120 40 L 40 120" stroke="#ef4444" stroke-width="4" opacity="0.6"/><text x="80" y="155" text-anchor="middle" font-size="11" fill="#ef4444" font-weight="bold">No Mirror Line (Asymmetric)</text></svg>`,
    };
  }
  if (t.includes("snail") || t.includes("shell")) {
    return {
      title: "Spiral Snail Shell (No Bilateral Symmetry)",
      explanation:
        "A spiral curves outward in one direction continuously, so it cannot be folded into two matching halves.",
      svg: `<svg viewBox="0 0 160 160" width="144" height="144" style="background:white; border-radius:8px;"><path d="M 80 80 A 10 10 0 0 1 90 80 A 20 20 0 0 1 70 80 A 35 35 0 0 1 105 80 A 50 50 0 0 1 55 80" fill="none" stroke="#64748b" stroke-width="6" stroke-linecap="round"/><path d="M 40 40 L 120 120 M 120 40 L 40 120" stroke="#ef4444" stroke-width="4" opacity="0.6"/><text x="80" y="155" text-anchor="middle" font-size="11" fill="#ef4444" font-weight="bold">Spiral (No Bilateral Mirror)</text></svg>`,
    };
  }
  return null;
}
