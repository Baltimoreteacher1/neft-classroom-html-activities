import {
  renderVocabIntro,
  renderVocabDragMatch,
  renderVocabCloze,
  renderVocabSort,
  renderMatchingGame,
} from "./index.js";

// ── Optional "Extra Practice" opt-in card ─────────────────────────────
// Shown when the adaptive practice sequence finishes AND
// config.practice.optional has items. Non-blocking, ungraded.
//   onSkip()  → caller proceeds exactly as today (completePhase)
//   onTry()   → caller runs the optional items, then proceeds
export function renderOptionalPracticeOptIn(container, { onTry, onSkip }) {
  const card = document.createElement("div");
  card.className = "card card-teal";
  card.style.cssText =
    "animation: phaseIn 0.4s var(--ease-out); text-align:center; margin-top:var(--sp-4);";
  card.innerHTML = `
    <div class="badge badge-teal mb-4">Optional · Ungraded</div>
    <h4 style="margin-bottom:var(--sp-2);">Want more? Try optional Extra Practice</h4>
    <p style="color:var(--muted); margin-bottom:var(--sp-4); font-size:0.92rem;">
      These bonus problems won't change your score or stars — they're just for extra reps.
    </p>
    <div style="display:flex; gap:var(--sp-3); justify-content:center; flex-wrap:wrap;">
      <button class="btn btn-teal btn-lg" data-act="try">Try it</button>
      <button class="btn btn-secondary btn-lg" data-act="skip">Skip</button>
    </div>`;
  card.querySelector('[data-act="try"]').addEventListener("click", () => {
    card.remove();
    onTry?.();
  });
  card.querySelector('[data-act="skip"]').addEventListener("click", () => {
    card.remove();
    onSkip?.();
  });
  container.append(card);
}

// ── "Choose an Activity" chooser ──────────────────────────────────────
// Optional, ungraded menu surfaced at the end of every lesson. Tiles are
// auto-populated from existing lesson data, so no per-lesson config is
// required. Each tile launches an existing component; finishing or backing
// out returns the student to this chooser.
//
//   renderActivityChooser(container, { config, renderComponent })
//
// `renderComponent` is the engine's shared component renderer (used to
// launch the optional Extra Practice items, which use the standard
// problem-object shape {type, ...props}).
export function renderActivityChooser(container, { config, renderComponent }) {
  const terms = Array.isArray(config.vocabulary) ? config.vocabulary : [];
  const hasVocab = terms.length > 0;
  const optional = Array.isArray(config.practice?.optional)
    ? config.practice.optional
    : [];
  const hasOptional = optional.length > 0;

  const tiles = [];

  if (hasVocab) {
    tiles.push(
      {
        icon: "📖",
        title: "Word Wall",
        desc: "Study every word, definition, and example.",
        run: (host, done) =>
          renderVocabIntro(host, { terms, onComplete: () => done() }),
      },
      {
        icon: "🔗",
        title: "Term Match",
        desc: "Match each term to its meaning.",
        run: (host, done) =>
          renderVocabDragMatch(host, { terms, onComplete: () => done() }),
      },
      {
        icon: "✍️",
        title: "Fill-the-Blanks",
        desc: "Complete sentences with the right word.",
        run: (host, done) =>
          renderVocabCloze(host, { terms, onComplete: () => done() }),
      },
      {
        icon: "🗂️",
        title: "Example Sort",
        desc: "Sort examples and non-examples.",
        run: (host, done) =>
          renderVocabSort(host, { terms, onComplete: () => done() }),
      },
      {
        icon: "🃏",
        title: "Memory Match",
        desc: "Flip cards to find matching pairs.",
        run: (host, done) => {
          const header = document.createElement("div");
          header.className = "section-header";
          header.innerHTML = `
            <div class="section-icon section-icon-amber">🃏</div>
            <div>
              <div class="section-title">Memory Match</div>
              <div class="section-desc">Flip cards to find matching pairs!</div>
            </div>`;
          host.append(header);
          renderMatchingGame(host, {
            pairs: terms.map((v) => ({ term: v.term, match: v.definition })),
            columns: Math.min(4, terms.length),
            onComplete: () => done(),
          });
        },
      },
    );
  }

  if (hasOptional) {
    tiles.push({
      icon: "✏️",
      title: "Extra Practice",
      desc: "Bonus problems for extra reps.",
      run: (host, done) =>
        runComponentList(host, optional, renderComponent, done),
    });
  }

  // Nothing to offer — render nothing so callers can skip cleanly.
  if (!tiles.length) return false;

  const wrapper = document.createElement("div");
  wrapper.className = "activity-chooser";
  container.append(wrapper);

  function showMenu() {
    wrapper.innerHTML = "";

    const header = document.createElement("div");
    header.className = "section-header";
    header.innerHTML = `
      <div class="section-icon section-icon-teal">🎲</div>
      <div>
        <div class="section-title">Choose an Activity</div>
        <div class="section-desc">Optional · pick any activity to practice more. Nothing here is graded.</div>
      </div>`;
    wrapper.append(header);

    const grid = document.createElement("div");
    grid.style.cssText =
      "display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:var(--sp-4);";

    tiles.forEach((t, i) => {
      const tile = document.createElement("button");
      tile.className = "card";
      tile.style.cssText = `
        animation: phaseIn 0.3s var(--ease-out) ${i * 0.06}s both;
        text-align:left; cursor:pointer; border:1px solid var(--line);
        display:flex; flex-direction:column; gap:var(--sp-2);
      `;
      tile.innerHTML = `
        <div style="font-size:1.8rem;">${t.icon}</div>
        <div style="font-family:var(--font-display); font-weight:800; font-size:1.05rem;">${esc(t.title)}</div>
        <div style="color:var(--muted); font-size:0.88rem; line-height:1.5;">${esc(t.desc)}</div>`;
      tile.addEventListener("click", () => launch(t));
      grid.append(tile);
    });

    wrapper.append(grid);
  }

  function launch(tile) {
    wrapper.innerHTML = "";

    const back = document.createElement("button");
    back.className = "btn btn-secondary";
    back.style.cssText = "margin-bottom:var(--sp-4);";
    back.textContent = "← Back to activities";
    back.addEventListener("click", showMenu);
    wrapper.append(back);

    const host = document.createElement("div");
    wrapper.append(host);

    let returned = false;
    const done = () => {
      if (returned) return;
      returned = true;
      showMenu();
    };
    tile.run(host, done);
  }

  showMenu();
  return true;
}

// Run a list of standard problem objects through the shared renderComponent,
// advancing on each answer (ungraded — we ignore correctness). Calls done()
// when the list is exhausted.
function runComponentList(host, items, renderComponent, done) {
  let idx = 0;
  function step() {
    if (idx >= items.length) {
      done();
      return;
    }
    host.innerHTML = "";
    const counter = document.createElement("div");
    counter.style.cssText =
      "font-size:0.82rem; font-weight:700; color:var(--muted); margin-bottom:var(--sp-3);";
    counter.textContent = `Extra Practice ${idx + 1} of ${items.length}`;
    host.append(counter);

    const area = document.createElement("div");
    host.append(area);

    renderComponent(area, items[idx], () => {
      idx++;
      setTimeout(step, 800);
    });
  }
  step();
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}
