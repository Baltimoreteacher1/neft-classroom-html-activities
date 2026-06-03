export function renderDragSort(container, config) {
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

  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
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
      list.append(row);
    });
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
  catGrid.style.cssText = `display:grid; grid-template-columns:repeat(${Math.min(categories.length, 3)}, 1fr); gap:var(--sp-4);`;

  const zones = [];
  categories.forEach((cat) => {
    const col = document.createElement("div");

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
  setupDragDrop(allZones);

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
    el.style.opacity = "0.5";
    setTimeout(() => el.classList.add("dragging"), 0);
  });

  el.addEventListener("dragend", () => {
    el.style.opacity = "1";
    el.classList.remove("dragging");
  });

  // Touch support for Chromebooks
  let touchClone = null;
  let originZone = null;

  el.addEventListener(
    "touchstart",
    (e) => {
      originZone = el.parentElement;
      touchClone = el.cloneNode(true);
      touchClone.style.cssText = `
      position:fixed; z-index:1000; pointer-events:none; opacity:0.85;
      transform:scale(1.08); box-shadow:0 8px 24px rgba(0,0,0,0.2);
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

function setupDragDrop(zones) {
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
      }
    });
  });
}
