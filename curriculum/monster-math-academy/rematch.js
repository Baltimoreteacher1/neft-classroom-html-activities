/** Rematch list for Monster Math Academy. Observes the existing teach and practice cards. */
(() => {
  const KEY = "mma-rematch-v1";
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw || typeof raw !== "object") throw new Error("empty");
      return {
        units: raw.units && typeof raw.units === "object" ? raw.units : {},
        correct: Number(raw.correct) || 0,
        attempts: Number(raw.attempts) || 0,
        sealed: raw.sealed === true,
      };
    } catch {
      return { units: {}, correct: 0, attempts: 0, sealed: false };
    }
  }

  let state = load();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* the list still works for this visit */
    }
  }

  function route() {
    const [name, unit] = location.hash.replace(/^#\/?/, "").split("/");
    return { name: name || "title", unit: unit || "" };
  }

  function openUnits() {
    return Object.keys(state.units).filter((id) => {
      const unit = state.units[id];
      return unit && unit.misses > 0 && !unit.cleared;
    });
  }

  function note(unitId, correct) {
    if (!unitId) return;
    const unit = state.units[unitId] || { misses: 0, cleared: false };
    state.attempts += 1;
    state.sealed = false;
    if (correct) {
      state.correct += 1;
      if (unit.misses > 0) unit.cleared = true;
    } else {
      unit.misses += 1;
      unit.cleared = false;
    }
    state.units[unitId] = unit;
    save();
    document.dispatchEvent(
      new CustomEvent("game:feedback", {
        detail: {
          correct,
          message: correct ? "That answer holds." : "Not yet. This unit is on the rematch list.",
        },
      }),
    );
    render();
    maybeComplete();
  }

  function maybeComplete() {
    const blocked = Object.keys(state.units).filter((id) => state.units[id].misses > 0);
    if (!blocked.length || openUnits().length || state.attempts < 4 || state.sealed) return;
    state.sealed = true;
    save();
    const accuracy = Math.round((state.correct / state.attempts) * 100);
    document.dispatchEvent(
      new CustomEvent("game:complete", {
        detail: {
          correct: state.correct,
          total: state.attempts,
          accuracy,
          score: state.correct,
          message: "Rematch clear. Every blocked unit was solved again.",
        },
      }),
    );
  }

  function watchCard(card) {
    const wrong = card.classList.contains("mma-problem-card--wrong");
    const good = card.classList.contains("mma-problem-card--celebrate");
    if (!wrong && !good) return;
    const mark = wrong ? "wrong" : "good";
    if (card.dataset.rematchMark === mark) return;
    card.dataset.rematchMark = mark;
    const where = route();
    if (where.name !== "teach" && where.name !== "practice") return;
    note(where.unit, good && !wrong);
  }

  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    root
      .querySelectorAll(".mma-problem-card--wrong, .mma-problem-card--celebrate")
      .forEach(watchCard);
  }

  function render() {
    let panel = document.getElementById("mma-rematch");
    const open = openUnits();
    if (!open.length && !state.sealed) {
      if (panel) panel.hidden = true;
      return;
    }
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "mma-rematch";
      panel.className = "mma-rematch";
      panel.setAttribute("aria-labelledby", "mma-rematch-title");
      document.body.append(panel);
    }
    panel.hidden = false;
    panel.replaceChildren();
    const title = document.createElement("h2");
    title.id = "mma-rematch-title";
    title.textContent = state.sealed && !open.length ? "Rematch clear" : "Rematch mission";
    const copy = document.createElement("p");
    copy.textContent = open.length
      ? `${open.length} unit${open.length === 1 ? "" : "s"} blocked a problem. Open practice and solve one correctly to clear it. No clock.`
      : "Every blocked unit has a correct solve. Stars follow the answers you just made.";
    panel.append(title, copy);
    if (open.length) {
      const actions = document.createElement("div");
      actions.className = "mma-rematch-actions";
      open.forEach((id) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `Practice unit ${id}`;
        button.addEventListener("click", () => {
          location.hash = `/practice/${id}`;
        });
        actions.append(button);
      });
      panel.append(actions);
    }
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "mma-rematch-reset";
    reset.textContent = "Clear the rematch list";
    reset.addEventListener("click", () => {
      state = { units: {}, correct: 0, attempts: 0, sealed: false };
      save();
      render();
    });
    panel.append(reset);
  }

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === "attributes" && record.target instanceof Element)
        watchCard(record.target);
      record.addedNodes.forEach((node) => {
        if (node instanceof Element) scan(node);
      });
    });
  });

  function boot() {
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    scan(document.body);
    render();
    window.addEventListener("hashchange", render);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
