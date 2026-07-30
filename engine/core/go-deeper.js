// Go Deeper Lab — the advanced path, everywhere. An optional three-step
// challenge (solve a stretch problem → convince a skeptic → author your own
// harder version) mounted at the end of every whole-class Practice phase and in
// group1/catch-up small-group studios. Group 2 keeps its full Prove It lab, so
// callers must not mount this for that variant.
//
// Design contract:
// - Invitation-only: renders as a collapsed <details>, never gates progress,
//   and stays out of every phase/progress denominator (no-fail for Level 0).
// - Bilingual EN/ES inline (matches the vocab/ESOL pattern: English lead,
//   Spanish subline) — no dependency on a page-level language toggle.
// - Own localStorage store (nt-godeeper:{lessonId}) alongside — never inside —
//   the shared save/resume engine and the small-group studio store.
// - Celebration is deterministic (no Math.random) and reduced-motion safe.
import { canRegenerate, regenerate } from "../components/problem-generator.js";

const STORE_PREFIX = "nt-godeeper:";
const MIN_WORK = 8;
const MIN_WHY = 12;

const MOVES = [
  {
    id: "another-way",
    en: "Show it a second way",
    es: "Muéstralo de otra manera",
    frameEn: "I can also show this with ___, and it gives the same answer because ___.",
    frameEs: "También puedo mostrarlo con ___, y da la misma respuesta porque ___.",
  },
  {
    id: "boundary",
    en: "Test a tricky case",
    es: "Prueba un caso difícil",
    frameEn: "Even when I try ___, my rule still works because ___.",
    frameEs: "Incluso cuando pruebo ___, mi regla funciona porque ___.",
  },
  {
    id: "works-always",
    en: "Explain why it must be true",
    es: "Explica por qué debe ser verdad",
    frameEn: "This has to be true because ___, not just for this problem but for ___.",
    frameEs: "Esto debe ser verdad porque ___, no solo aquí sino también para ___.",
  },
];

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function bi(en, es) {
  return `<span class="ntgd-en">${esc(en)}</span><span class="ntgd-es" lang="es">${esc(es)}</span>`;
}

function createStore(lessonId) {
  const key = STORE_PREFIX + lessonId;
  let data = {};
  try {
    data = JSON.parse(localStorage.getItem(key)) || {};
  } catch (_error) {
    data = {};
  }
  let timer = 0;
  const flush = () => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (_error) {
      /* storage full/blocked — the lab still works for the session */
    }
  };
  return {
    get: (k) => data[k],
    set(k, value) {
      data[k] = value;
      clearTimeout(timer);
      timer = setTimeout(flush, 200);
    },
    // Milestones (completion) write through immediately so a navigation right
    // after the click can never lose the win to the debounce window.
    commit(k, value) {
      data[k] = value;
      clearTimeout(timer);
      flush();
    },
  };
}

function injectStyles() {
  if (document.getElementById("ntgd-styles")) return;
  const style = document.createElement("style");
  style.id = "ntgd-styles";
  style.textContent = `
.ntgd{color-scheme:light;border:2px solid #c4b5fd;border-radius:14px;background:#f5f3ff;margin:20px 0;color:#1e1b4b}
.ntgd>summary{cursor:pointer;padding:14px 18px;font-weight:800;font-size:1.05rem;list-style:none;display:flex;gap:10px;align-items:center}
.ntgd>summary::-webkit-details-marker{display:none}
.ntgd>summary:focus-visible{outline:3px solid #5b21b6;outline-offset:2px;border-radius:12px}
.ntgd-tag{font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;background:#5b21b6;color:#fff;border-radius:999px;padding:3px 10px}
.ntgd-body{padding:4px 18px 18px;display:grid;gap:14px}
.ntgd-en{display:block}
.ntgd-es{display:block;font-size:.88em;color:#5b21b6;font-style:italic}
.ntgd-step{border:1.5px solid #ddd6fe;border-radius:12px;background:#fff;padding:14px;display:grid;gap:10px}
.ntgd-step[data-locked="true"]{opacity:.55}
.ntgd-step[data-locked="true"] textarea,.ntgd-step[data-locked="true"] input,.ntgd-step[data-locked="true"] button{pointer-events:none}
.ntgd-step h4{margin:0;font-size:1rem;display:flex;gap:8px;align-items:center}
.ntgd-n{width:26px;height:26px;border-radius:50%;background:#5b21b6;color:#fff;display:inline-grid;place-items:center;font-size:.85rem;font-weight:800;flex:none}
.ntgd-stem{background:#faf5ff;border-left:4px solid #5b21b6;border-radius:8px;padding:10px 12px;font-weight:600}
.ntgd textarea,.ntgd input[type="text"]{width:100%;box-sizing:border-box;border:1.5px solid #c4b5fd;border-radius:10px;padding:10px;font:inherit;font-size:1rem;min-height:44px;background:#fff;color:inherit}
.ntgd textarea:focus,.ntgd input:focus{outline:3px solid #5b21b6;outline-offset:1px}
.ntgd-moves{display:flex;flex-wrap:wrap;gap:8px}
.ntgd-move{border:1.5px solid #5b21b6;background:#fff;color:#5b21b6;border-radius:999px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer;min-height:44px}
.ntgd-move[aria-pressed="true"]{background:#5b21b6;color:#fff}
.ntgd-move:focus-visible{outline:3px solid #1e1b4b;outline-offset:2px}
.ntgd-frame{font-size:.92rem;background:#ede9fe;border-radius:8px;padding:8px 10px}
.ntgd-btn{justify-self:start;border:0;border-radius:10px;background:#5b21b6;color:#fff;font:inherit;font-weight:800;padding:10px 18px;cursor:pointer;min-height:44px}
.ntgd-btn:disabled{background:#a78bfa;cursor:not-allowed}
.ntgd-btn:focus-visible{outline:3px solid #1e1b4b;outline-offset:2px}
.ntgd-btn:not(.ntgd-ghost) .ntgd-es{color:#ede9fe}
.ntgd-move[aria-pressed="true"] .ntgd-es{color:#ede9fe}
.ntgd-ghost{background:#fff;color:#5b21b6;border:1.5px solid #5b21b6}
.ntgd-status{margin:0;font-weight:700;color:#166534}
.ntgd-done{border:2px solid #86efac;background:#f0fdf4;border-radius:12px;padding:14px;position:relative;overflow:hidden}
.ntgd-spark{position:absolute;top:50%;left:50%;width:8px;height:8px;border-radius:50%;background:#5b21b6;pointer-events:none;animation:ntgd-pop .9s ease-out forwards}
@keyframes ntgd-pop{to{transform:translate(var(--ntgd-x),var(--ntgd-y)) scale(0);opacity:0}}
@media (prefers-reduced-motion:reduce){.ntgd-spark{display:none}}
/* Dark theme — retint the purple panel's light surfaces; keep the purple
   accent identity (tags/numbers/buttons stay #5b21b6 with white text). */
:root[data-theme="dark"] .ntgd{background:#1b1533;border-color:#4c3a7a;color:#e8e3f6}
:root[data-theme="dark"] .ntgd-step{background:#241d3d;border-color:#4c3a7a}
:root[data-theme="dark"] .ntgd-stem{background:#241d3d}
:root[data-theme="dark"] .ntgd textarea,:root[data-theme="dark"] .ntgd input[type="text"]{background:#15112a;color:#e8e3f6;border-color:#5b4a86}
:root[data-theme="dark"] .ntgd-frame{background:#2a2247}
:root[data-theme="dark"] .ntgd-move,:root[data-theme="dark"] .ntgd-ghost{background:#241d3d;color:#c4b5fd}
:root[data-theme="dark"] .ntgd-es{color:#c4b5fd}
:root[data-theme="dark"] .ntgd-status{color:#86efac}
:root[data-theme="dark"] .ntgd-done{background:#12291b;border-color:#2f7d4e}
:root[data-theme="dark"] .ntgd-btn:disabled{background:#3a2f5e}
`;
  document.head.appendChild(style);
}

function challengeText(item) {
  const text = item && (item.stem || item.prompt);
  return typeof text === "string" ? text.trim() : "";
}

// Hardest usable item wins: scan extending, then on-level, then the parallel
// practice bank, each from the END (items are ordered easy → hard). Items
// carry their text in `stem` (most types) or `prompt` (open-response);
// error-analysis/fill-table items have neither and are skipped.
function pickChallenge(config) {
  const practice = config?.practice || {};
  const pools = [practice.extending, practice.onLevel, config?.parallelPractice];
  for (const pool of pools) {
    if (!Array.isArray(pool)) continue;
    for (let index = pool.length - 1; index >= 0; index -= 1) {
      if (challengeText(pool[index])) return pool[index];
    }
  }
  return null;
}

// Deterministic celebration: sparks fan out on angles derived from index —
// same visual every completion, zero randomness (repo convention).
function celebrate(host) {
  const COUNT = 10;
  for (let index = 0; index < COUNT; index += 1) {
    const angle = (index / COUNT) * Math.PI * 2;
    const distance = 60 + (index % 3) * 22;
    const spark = document.createElement("span");
    spark.className = "ntgd-spark";
    spark.setAttribute("aria-hidden", "true");
    spark.style.setProperty("--ntgd-x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--ntgd-y", `${Math.sin(angle) * distance}px`);
    host.appendChild(spark);
    setTimeout(() => spark.remove(), 1000);
  }
}

function textStep({ number, titleEn, titleEs, hintHtml, value, minLength, placeholder, onReady }) {
  const step = document.createElement("section");
  step.className = "ntgd-step";
  step.innerHTML = `<h4><span class="ntgd-n">${number}</span><span>${bi(titleEn, titleEs)}</span></h4>${hintHtml || ""}`;
  const area = document.createElement("textarea");
  area.rows = 3;
  area.placeholder = placeholder;
  area.value = value || "";
  area.setAttribute("aria-label", titleEn);
  step.appendChild(area);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ntgd-btn";
  button.innerHTML = bi("Lock it in →", "Confirmar →");
  button.disabled = (area.value.trim().length || 0) < minLength;
  area.addEventListener("input", () => {
    button.disabled = area.value.trim().length < minLength;
    onReady(area.value, false);
  });
  button.addEventListener("click", () => onReady(area.value, true));
  step.appendChild(button);
  return { step, area, button };
}

/**
 * Build the Go Deeper lab. Returns an element to append, or null when the
 * lesson has no challenge-worthy item. `variant` is "lesson" | "group1" |
 * "catchup" — callers keep group2 on its Prove It lab instead.
 */
export function createGoDeeper({ config, lessonId, variant = "lesson", peers = null }) {
  const item = pickChallenge(config);
  if (!item || !lessonId) return null;
  injectStyles();
  const store = createStore(lessonId);

  const details = document.createElement("details");
  details.className = "ntgd";
  details.dataset.variant = variant;
  if (store.get("done") || store.get("step") > 0) details.open = true;

  const invite =
    variant === "lesson"
      ? ["Go Deeper — optional challenge", "Ve más allá — reto opcional"]
      : ["You've earned a stretch — go deeper", "Te ganaste un reto — ve más allá"];
  details.innerHTML = `<summary><span aria-hidden="true">🚀</span><span>${bi(invite[0], invite[1])}</span><span class="ntgd-tag">${esc(
    variant === "lesson" ? "Challenge" : "Stretch",
  )}</span></summary>`;

  const body = document.createElement("div");
  body.className = "ntgd-body";
  details.appendChild(body);

  const status = document.createElement("p");
  status.className = "ntgd-status";
  status.setAttribute("aria-live", "polite");

  const stem = store.get("stem") || challengeText(item);
  const step1Hint = `<div class="ntgd-stem" data-annotate="word-problem">${esc(stem)}</div>`;

  const setStep = (step) => {
    store.set("step", step);
    [one.step, two.step, three.step].forEach((node, index) => {
      node.dataset.locked = String(index > step);
      node.setAttribute("aria-disabled", String(index > step));
    });
  };

  const one = textStep({
    number: 1,
    titleEn: "Take the challenge",
    titleEs: "Acepta el reto",
    hintHtml: step1Hint,
    value: store.get("work"),
    minLength: MIN_WORK,
    placeholder: "Show your thinking, not just the answer… / Muestra tu razonamiento…",
    onReady(value, locked) {
      store.set("work", value);
      if (locked) {
        setStep(1);
        two.area.focus();
      }
    },
  });

  // Fresh-challenge regeneration reuses the existing correctness-first
  // problem generator at stretch difficulty; hidden when unsupported.
  if (canRegenerate(item)) {
    const fresh = document.createElement("button");
    fresh.type = "button";
    fresh.className = "ntgd-btn ntgd-ghost";
    fresh.innerHTML = bi("🔄 New twist on this challenge", "🔄 Otro reto parecido");
    fresh.addEventListener("click", () => {
      const twist = regenerate(item, { difficulty: "stretch" });
      if (!twist || !twist.stem) return;
      store.set("stem", twist.stem);
      one.step.querySelector(".ntgd-stem").textContent = twist.stem;
      one.area.value = "";
      one.button.disabled = true;
      store.set("work", "");
      setStep(0);
    });
    one.step.appendChild(fresh);
  }

  const two = (() => {
    const step = document.createElement("section");
    step.className = "ntgd-step";
    // A REAL skeptic when there is one. `peers` carries the revealed table
    // distribution, so if a seat at this table proved it a different way we name
    // that seat and that position. A canned "I don't believe you" is the fallback
    // for a student working alone — it was never a good substitute for the three
    // actual skeptics sitting at the table.
    const dissent = (() => {
      if (!peers?.answers?.length || !peers.mine) return null;
      const other = peers.answers.find((entry) => entry.answer && entry.answer !== peers.mine);
      return other || null;
    })();
    const challenge = dissent
      ? bi(
          `Seat ${dissent.seat} at your table proved it a different way. Convince them yours works too — pick a proof move, then use the frame.`,
          `El asiento ${dissent.seat} de tu mesa lo demostró de otra manera. Convéncelos de que el tuyo también funciona: elige una estrategia y usa el marco de oración.`,
        )
      : bi(
          "A skeptic says: “I don't believe you.” Pick a proof move, then use the frame.",
          "Un escéptico dice: “No te creo.” Elige una estrategia y usa el marco de oración.",
        );
    step.innerHTML = `<h4><span class="ntgd-n">2</span><span>${
      dissent
        ? bi("Convince your table", "Convence a tu mesa")
        : bi("Convince a skeptic", "Convence a un escéptico")
    }</span></h4><p style="margin:0">${challenge}</p>`;
    const chips = document.createElement("div");
    chips.className = "ntgd-moves";
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "Proof moves");
    const frame = document.createElement("p");
    frame.className = "ntgd-frame";
    frame.hidden = true;
    const selected = store.get("move");
    for (const move of MOVES) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "ntgd-move";
      chip.innerHTML = bi(move.en, move.es);
      chip.setAttribute("aria-pressed", String(selected === move.id));
      chip.addEventListener("click", () => {
        store.set("move", move.id);
        for (const other of chips.children) other.setAttribute("aria-pressed", "false");
        chip.setAttribute("aria-pressed", "true");
        frame.hidden = false;
        frame.innerHTML = bi(move.frameEn, move.frameEs);
      });
      chips.appendChild(chip);
      if (selected === move.id) {
        frame.hidden = false;
        frame.innerHTML = bi(move.frameEn, move.frameEs);
      }
    }
    step.appendChild(chips);
    step.appendChild(frame);
    const area = document.createElement("textarea");
    area.rows = 3;
    area.value = store.get("why") || "";
    area.placeholder = "Write your proof… / Escribe tu prueba…";
    area.setAttribute("aria-label", "Convince a skeptic");
    step.appendChild(area);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ntgd-btn";
    button.innerHTML = bi("The skeptic is convinced →", "El escéptico está convencido →");
    const ready = () => store.get("move") && area.value.trim().length >= MIN_WHY;
    button.disabled = !ready();
    const refresh = () => {
      button.disabled = !ready();
    };
    area.addEventListener("input", () => {
      store.set("why", area.value);
      refresh();
    });
    chips.addEventListener("click", refresh);
    button.addEventListener("click", () => {
      setStep(2);
      three.area.focus();
    });
    step.appendChild(button);
    return { step, area, button };
  })();

  const three = (() => {
    const step = document.createElement("section");
    step.className = "ntgd-step";
    step.innerHTML = `<h4><span class="ntgd-n">3</span><span>${bi(
      "Author one for a classmate",
      "Crea uno para un compañero",
    )}</span></h4><p style="margin:0">${bi(
      "Write a HARDER version of this problem, and record the correct answer so you can check their work.",
      "Escribe una versión MÁS DIFÍCIL de este problema y anota la respuesta correcta para revisar su trabajo.",
    )}</p>`;
    const area = document.createElement("textarea");
    area.rows = 3;
    area.value = store.get("own") || "";
    area.placeholder = "Your challenge problem… / Tu problema de reto…";
    area.setAttribute("aria-label", "Your challenge problem");
    step.appendChild(area);
    const answer = document.createElement("input");
    answer.type = "text";
    answer.value = store.get("ownAnswer") || "";
    answer.placeholder = "The correct answer / La respuesta correcta";
    answer.setAttribute("aria-label", "The correct answer to your problem");
    step.appendChild(answer);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ntgd-btn";
    button.innerHTML = bi("Publish my challenge 🏆", "Publicar mi reto 🏆");
    const ready = () => area.value.trim().length >= MIN_WORK && answer.value.trim().length > 0;
    button.disabled = !ready();
    const refresh = () => {
      button.disabled = !ready();
    };
    area.addEventListener("input", () => {
      store.set("own", area.value);
      refresh();
    });
    answer.addEventListener("input", () => {
      store.set("ownAnswer", answer.value);
      refresh();
    });
    button.addEventListener("click", () => {
      store.commit("done", true);
      finish(true);
    });
    step.appendChild(button);
    return { step, area, answer, button };
  })();

  const finish = (fresh) => {
    if (!body.querySelector(".ntgd-done")) {
      const done = document.createElement("div");
      done.className = "ntgd-done";
      done.innerHTML = `<strong>${bi(
        "🏆 Challenge complete — you went deeper than the lesson asked.",
        "🏆 Reto completo — fuiste más allá de lo que pedía la lección.",
      )}</strong>`;
      body.appendChild(done);
      if (fresh) celebrate(done);
    }
    status.innerHTML = bi("Challenge complete.", "Reto completo.");
  };

  body.appendChild(one.step);
  body.appendChild(two.step);
  body.appendChild(three.step);
  body.appendChild(status);
  setStep(store.get("step") || 0);
  if (store.get("done")) finish(false);
  return details;
}
