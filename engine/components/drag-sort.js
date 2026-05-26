export function renderDragSort(container, { items, categories, onComplete }) {
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
