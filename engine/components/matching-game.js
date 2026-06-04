export function renderMatchingGame(
  container,
  { pairs, columns, label, onComplete },
) {
  const wrapper = document.createElement("div");
  wrapper.className = "card";

  if (label) {
    const lbl = document.createElement("p");
    lbl.style.cssText =
      "font-size:1rem; font-weight:600; margin:0 0 var(--sp-3); line-height:1.5;";
    lbl.textContent = label;
    wrapper.append(lbl);
  }

  const cols = columns || 4;
  const cards = [];
  pairs.forEach((p, i) => {
    cards.push({ id: i, type: "term", text: p.term, pairId: i });
    cards.push({ id: i, type: "match", text: p.match, pairId: i });
  });

  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  const statsBar = document.createElement("div");
  statsBar.style.cssText =
    "display:flex; justify-content:space-between; margin-bottom:var(--sp-3); font-size:0.85rem; font-weight:700; color:var(--muted);";
  const matchCount = document.createElement("span");
  matchCount.textContent = `0 / ${pairs.length} matched`;
  const attempts = document.createElement("span");
  attempts.textContent = "Attempts: 0";
  statsBar.append(matchCount, attempts);
  wrapper.append(statsBar);

  const grid = document.createElement("div");
  grid.style.cssText = `display:grid; grid-template-columns:repeat(${cols}, 1fr); gap:var(--sp-2);`;

  let flipped = [];
  let matched = new Set();
  let attemptCount = 0;
  let locked = false;

  cards.forEach((card, idx) => {
    const el = document.createElement("button");
    el.className = "match-card";
    el.dataset.idx = idx;
    el.setAttribute("aria-label", "Hidden card");
    el.style.cssText = `
      aspect-ratio:1; display:grid; place-items:center; border:2px solid var(--line);
      border-radius:var(--radius-md); background:var(--navy); color:white;
      font-weight:800; font-size:1.8rem; cursor:pointer; min-height:70px;
      transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
      padding:var(--sp-2); text-align:center; line-height:1.2;
    `;
    el.textContent = "?";

    el.addEventListener("click", () => {
      if (locked || matched.has(card.pairId) || flipped.includes(idx)) return;

      // Flip
      el.style.background =
        card.type === "term" ? "var(--teal)" : "var(--amber)";
      el.style.color = card.type === "term" ? "white" : "var(--navy)";
      el.style.borderColor =
        card.type === "term" ? "var(--teal)" : "var(--amber)";
      el.style.fontSize = "0.82rem";
      el.textContent = card.text;
      el.setAttribute("aria-label", card.text);
      el.style.transform = "scale(1.05)";
      setTimeout(() => {
        el.style.transform = "";
      }, 150);

      flipped.push(idx);

      if (flipped.length === 2) {
        locked = true;
        attemptCount++;
        attempts.textContent = `Attempts: ${attemptCount}`;

        const [a, b] = flipped;
        const cardA = cards[a];
        const cardB = cards[b];
        const elA = grid.children[a];
        const elB = grid.children[b];

        if (cardA.pairId === cardB.pairId && a !== b) {
          // Match!
          matched.add(cardA.pairId);
          matchCount.textContent = `${matched.size} / ${pairs.length} matched`;

          setTimeout(() => {
            elA.style.borderColor = "var(--success)";
            elA.style.background = "var(--success-bg)";
            elA.style.color = "var(--success)";
            elA.style.cursor = "default";
            elB.style.borderColor = "var(--success)";
            elB.style.background = "var(--success-bg)";
            elB.style.color = "var(--success)";
            elB.style.cursor = "default";
            flipped = [];
            locked = false;

            if (matched.size === pairs.length) {
              finishGame();
            }
          }, 400);
        } else {
          // No match
          setTimeout(() => {
            elA.style.background = "var(--navy)";
            elA.style.color = "white";
            elA.style.borderColor = "var(--line)";
            elA.style.fontSize = "1.8rem";
            elA.textContent = "?";
            elA.setAttribute("aria-label", "Hidden card");

            elB.style.background = "var(--navy)";
            elB.style.color = "white";
            elB.style.borderColor = "var(--line)";
            elB.style.fontSize = "1.8rem";
            elB.textContent = "?";
            elB.setAttribute("aria-label", "Hidden card");

            flipped = [];
            locked = false;
          }, 900);
        }
      }
    });

    grid.append(el);
  });

  wrapper.append(grid);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  function finishGame() {
    const efficiency = pairs.length / attemptCount;
    const stars = efficiency >= 0.8 ? 3 : efficiency >= 0.5 ? 2 : 1;
    showFb(
      feedbackSlot,
      "success",
      `All matched in ${attemptCount} attempts! ${stars === 3 ? "Perfect memory!" : stars === 2 ? "Nice work!" : "Keep practicing!"}`,
    );
    if (onComplete) onComplete(pairs.length, attemptCount);
  }

  container.append(wrapper);
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.setAttribute("role", "alert");
  fb.innerHTML = `<span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span><span>${msg}</span>`;
  slot.innerHTML = "";
  slot.append(fb);
}
