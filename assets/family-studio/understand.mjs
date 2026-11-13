/**
 * Understand: tonight's idea for a family, in short chapters built from the lesson's OWN authored
 * sidecar (data/family-homework-notes/<id>.json). A chapter whose data the lesson did not author is
 * left out, never invented.
 *
 *   idea      the idea in 30 seconds (bigIdea / standardPlain), the hook with a guess-then-reveal,
 *             and the kitchen-table version for a grown-up
 *   watch     the class picture (the page's own Look & Learn drawing) played step by step with the
 *             worked example (conceptSteps), through the shared "Watch it" explainer
 *   bridge    then vs. now: how a grown-up may have learned it, how class does it, why both work
 *   detective three real wrong answers (v3.confused): spot it, get the coach question, see the fix
 *   coach     what to say and what to avoid while helping (stuckTips, watchFor)
 *   words     the lesson's words: example, non-example and a sentence to say (v3.vocab)
 *   teach     teach it back: the student explains, the grown-up ticks each step they heard
 *   take      take it home: the printable guide and sheet in English and Spanish
 */
import { bi, el, esc, has, listenButton, pair, sparkle, store } from "./kit.mjs";

const EXPLAIN_URL = "/assets/family-mission/explain/index.mjs";
const EXPLAIN_CSS = "/assets/family-mission/explain/explain.css";
const MODEL_URL = "/assets/family-mission/models/index.mjs";
const MODEL_CSS = "/assets/family-mission/models/models.css";

export const CHAPTERS = [
  { id: "idea", icon: "💡", en: "The idea", es: "La idea" },
  { id: "watch", icon: "▶️", en: "Watch it", es: "Míralo" },
  { id: "try", icon: "👆", en: "Try it", es: "Pruébalo" },
  { id: "bridge", icon: "🤝", en: "Then & now", es: "Antes y ahora" },
  { id: "detective", icon: "🕵️", en: "Mistake detective", es: "Detective de errores" },
  { id: "coach", icon: "💬", en: "Help like a coach", es: "Ayuda como entrenador" },
  { id: "words", icon: "🔤", en: "Words", es: "Palabras" },
  { id: "teach", icon: "🎓", en: "Teach it back", es: "Enséñalo tú" },
  { id: "take", icon: "🖨️", en: "Take it home", es: "Para llevar" },
];

const pick = (...xs) => xs.find(has);
const HOOK_ART = new Set(["price", "recipe", "score", "map", "ticket", "receipt"]);

function section(id, title, lead) {
  const ch = CHAPTERS.find((c) => c.id === id);
  const s = el("section", `fs-chapter fs-ch-${id}`);
  s.id = `fs_ch_${id}`;
  s.setAttribute("data-chapter", id);
  s.setAttribute("aria-labelledby", `fs_ch_${id}_h`);
  s.innerHTML = `<h3 class="fs-ch-title" id="fs_ch_${id}_h"><span class="fs-ch-icon" aria-hidden="true">${ch.icon}</span> ${bi(title[0], title[1])}</h3>${lead ? `<p class="fs-ch-lead">${bi(lead[0], lead[1])}</p>` : ""}`;
  return s;
}

/* ── 1 The idea ────────────────────────────────────────────────────── */
function ideaChapter(notes) {
  const v3 = notes.v3 || {};
  const idea = pick(notes.bigIdea, v3.standardPlain, notes.learningTonight);
  if (!idea) return null;
  const s = section("idea", ["The idea in 30 seconds", "La idea en 30 segundos"]);
  const big = el("p", "fs-big-idea", pair(idea));
  s.appendChild(big);
  s.appendChild(listenButton(idea.en, idea.es));
  const hook = v3.hook;
  if (has(hook) && has(hook.guess) && has(hook.reveal)) {
    const card = el(
      "div",
      "fs-hook",
      `${HOOK_ART.has(hook.style) ? `<img class="fs-hook-art" src="/assets/design/family/art/hooks/${hook.style}.svg" alt="" width="120" height="90">` : ""}<p class="fs-kicker">${bi("Tonight's puzzle", "El reto de hoy")}</p><p class="fs-hook-q">${pair(hook)}</p><p class="fs-hook-guess">${pair(hook.guess)}</p>`,
    );
    const btn = el("button", "fs-btn fs-btn-soft", bi("We guessed. Show us!", "Ya adivinamos. ¡Muéstrenlo!"));
    btn.type = "button";
    const reveal = el("p", "fs-hook-reveal", pair(hook.reveal));
    reveal.hidden = true;
    btn.addEventListener("click", () => {
      reveal.hidden = false;
      btn.hidden = true;
      sparkle(card);
    });
    card.append(btn, reveal);
    s.appendChild(card);
  }
  if (has(v3.kitchenTable)) {
    s.appendChild(
      el(
        "div",
        "fs-note fs-note-adult",
        `<strong>${bi("For the grown-up: try it at the table", "Para el adulto: pruébenlo en la mesa")}</strong><p>${pair(v3.kitchenTable)}</p>`,
      ),
    );
  }
  return s;
}

/* ── 2 Watch it ────────────────────────────────────────────────────── */
function linkCss(href, attr) {
  if (document.querySelector(`link[${attr}]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  l.setAttribute(attr, "");
  document.head.appendChild(l);
}

function watchChapter(notes, ctx) {
  const steps = (notes.conceptSteps || []).filter(has);
  if (steps.length < 2) return null;
  const v3 = notes.v3 || {};
  const s = section(
    "watch",
    ["Watch how class does it", "Mira cómo lo hacemos en clase"],
    ["Press Play. The picture builds one step at a time.", "Presionen Reproducir. El dibujo se arma paso a paso."],
  );
  const stage = document.querySelector("#hw_panel_connect .hw-colearn-svg-stage");
  let figure = null;
  if (stage?.querySelector("svg")) {
    figure = el("figure", "hw-colearn-svg-stage fs-figure");
    /* Same drawing, fresh ids so two copies on one page never share a <title> id. */
    figure.innerHTML = stage.innerHTML.replace(/\bfm-([0-9a-z]+)-(en|es)-/g, "fs-$1-$2-");
    s.appendChild(figure);
    if (has(v3.classModel?.name)) {
      s.appendChild(el("p", "fs-caption", `${bi("In class we use", "En clase usamos")} <strong>${pair(v3.classModel.name)}</strong>.`));
    }
  }
  const ol = el("ol", "fs-steps");
  const items = steps.map((st, i) => {
    const li = el(
      "li",
      "fs-step",
      `<span class="fs-step-num" aria-hidden="true">${i + 1}</span><span class="fs-step-text">${st.cue && has(st.cue) ? `<strong class="fs-step-cue">${pair(st.cue)}</strong> ` : ""}${pair(st)}</span>`,
    );
    ol.appendChild(li);
    return { en: st.en, es: st.es, el: li };
  });
  s.appendChild(ol);
  s.appendChild(listenButton(steps.map((x) => x.en).join(" "), steps.map((x) => x.es || x.en).join(" "), ["Read the steps", "Leer los pasos"]));
  if (figure) {
    linkCss(EXPLAIN_CSS, "data-explain-css");
    import(EXPLAIN_URL)
      .then((mod) => {
        ctx.explainer = mod.mountExplainer({ figure, steps: items, lang: ctx.lang() === "es" ? "es" : "en" });
      })
      .catch(() => {
        /* the finished picture and the steps are already here */
      });
  }
  return s;
}


/* ── 3 Try it ──────────────────────────────────────────────────────── */
/** The page's own hands-on model (Try Together), mounted fresh here so playing with it is safe. */
function tryChapter(ctx) {
  const host = document.getElementById("hw_mission_model");
  const name = host?.getAttribute("data-family");
  let config = null;
  try {
    config = JSON.parse(host?.getAttribute("data-config") || "null");
  } catch (_) {
    config = null;
  }
  if (!name || !config) return null;
  const s = section(
    "try",
    ["Try it with your hands", "Pruébenlo con las manos"],
    null,
  );
  const lead = host.querySelector(".hw-mm-lead");
  if (lead) s.appendChild(el("p", "fs-ch-lead", lead.innerHTML));
  const stage = el("div", "hw-mm-stage fs-model-stage");
  const status = el("p", "fs-model-status");
  status.setAttribute("role", "status");
  s.append(stage, status);
  linkCss(MODEL_CSS, "data-mission-models");
  import(MODEL_URL)
    .then((mod) => {
      /* Mounting can move focus into the model; keep the reader where they are. */
      const body = stage.closest("[data-fs-body]");
      const top = body ? body.scrollTop : 0;
      ctx.model = mod.mountModel(stage, name, config, {
        lang: ctx.lang() === "es" ? "es" : "en",
        onChange: (_state, note) => {
          if (note) status.textContent = note;
        },
      });
      if (body) body.scrollTop = top;
    })
    .catch(() => {
      s.hidden = true;
    });
  s.appendChild(
    el(
      "p",
      "fs-tip",
      bi("Move it, then say out loud what changed and what stayed the same.", "Muévanlo y luego digan en voz alta qué cambió y qué se quedó igual."),
    ),
  );
  return s;
}

/* ── 3 Then & now ──────────────────────────────────────────────────── */
function bridgeChapter(notes) {
  const b = notes.bridge;
  if (!b || !has(b.before) || !has(b.class) || !has(b.why)) return null;
  const s = section(
    "bridge",
    ["Then & now", "Antes y ahora"],
    [
      "If this looks different from how you learned it, that is OK. Both ways work.",
      "Si esto se ve distinto a como ustedes lo aprendieron, está bien. Las dos formas funcionan.",
    ],
  );
  s.appendChild(
    el(
      "div",
      "fs-compare",
      `<div class="fs-compare-card fs-then"><p class="fs-kicker">🕰️ ${bi("How you may have learned it", "Cómo pudieron haberlo aprendido")}</p><p>${pair(b.before)}</p></div>` +
        `<div class="fs-compare-card fs-now"><p class="fs-kicker">🏫 ${bi("How we do it in class", "Cómo lo hacemos en clase")}</p><p>${pair(b.class)}</p></div>`,
    ),
  );
  s.appendChild(el("p", "fs-why", `<strong>🤝 ${bi("Why both work:", "Por qué ambas funcionan:")}</strong> ${pair(b.why)}`));
  s.appendChild(
    el(
      "p",
      "fs-tip",
      bi(
        "Tip: let your student show the class way first. Then share yours and check that both give the same answer.",
        "Consejo: dejen que su estudiante muestre primero la forma de la clase. Luego compartan la suya y comprueben que las dos dan la misma respuesta.",
      ),
    ),
  );
  s.appendChild(listenButton(`${b.before.en} ${b.class.en} ${b.why.en}`, `${b.before.es} ${b.class.es} ${b.why.es}`));
  return s;
}

/* ── 4 Mistake detective ───────────────────────────────────────────── */
function detectiveChapter(notes) {
  const rounds = (notes.v3?.confused || []).filter((r) => has(r.wrong) && has(r.why));
  if (!rounds.length) return null;
  const s = section(
    "detective",
    ["Mistake detective", "Detective de errores"],
    [
      "A pretend classmate tried tonight's math. Each answer has one mistake. Can you find it before you peek?",
      "Un compañero imaginario intentó la tarea de hoy. Cada respuesta tiene un error. ¿Lo encuentran antes de mirar?",
    ],
  );
  const saved = store("detective");
  const found = new Set(saved.read([]));
  const score = el("p", "fs-score", "");
  const paint = () => {
    score.innerHTML = `🔎 ${bi(`Cases solved: ${found.size} of ${rounds.length}`, `Casos resueltos: ${found.size} de ${rounds.length}`)}`;
  };
  paint();
  s.appendChild(score);
  rounds.slice(0, 3).forEach((r, i) => {
    const card = el(
      "div",
      "fs-case",
      `<p class="fs-kicker">${bi(`Case ${i + 1}`, `Caso ${i + 1}`)}</p><blockquote class="fs-wrong">“${pair(r.wrong)}”</blockquote>`,
    );
    const clue = el("button", "fs-btn fs-btn-soft", `🔍 ${bi("Give us a clue", "Dennos una pista")}`);
    clue.type = "button";
    const coach = el("p", "fs-coach", has(r.coach) ? `<strong>${bi("Clue:", "Pista:")}</strong> ${pair(r.coach)}` : "");
    coach.hidden = true;
    const solve = el("button", "fs-btn", `✅ ${bi("We found it. Show the fix", "Lo encontramos. Mostrar cómo se arregla")}`);
    solve.type = "button";
    const fix = el("p", "fs-fix", `<strong>${bi("The fix:", "Cómo se arregla:")}</strong> ${pair(r.why)}`);
    fix.hidden = true;
    clue.addEventListener("click", () => {
      coach.hidden = false;
      clue.hidden = true;
    });
    solve.addEventListener("click", () => {
      fix.hidden = false;
      solve.hidden = true;
      if (!found.has(i)) {
        found.add(i);
        saved.write([...found]);
        paint();
        sparkle(card);
      }
    });
    if (!has(r.coach)) clue.hidden = true;
    card.append(clue, coach, solve, fix);
    s.appendChild(card);
  });
  const watch = notes.corner?.watchOut;
  if (has(watch)) s.appendChild(el("p", "fs-note fs-note-watch", `<strong>⚠️ ${bi("The most common mix-up:", "La confusión más común:")}</strong> ${pair(watch)}`));
  return s;
}

/* ── 5 Help like a coach ───────────────────────────────────────────── */
function coachChapter(notes) {
  const say = (notes.stuckTips?.say || []).filter(has);
  const dont = (notes.stuckTips?.dontSay || []).filter(has);
  const listen = (notes.watchFor || []).filter(has);
  if (!say.length && !listen.length) return null;
  const s = section(
    "coach",
    ["Help like a coach", "Ayuden como un entrenador"],
    [
      "You do not need to know the answer. Good questions help more than telling.",
      "No necesitan saber la respuesta. Las buenas preguntas ayudan más que decir cómo se hace.",
    ],
  );
  const list = (items, cls) => `<ul class="${cls}">${items.map((x) => `<li>${pair(x)}</li>`).join("")}</ul>`;
  if (say.length || dont.length) {
    s.appendChild(
      el(
        "div",
        "fs-compare",
        (say.length ? `<div class="fs-compare-card fs-say"><p class="fs-kicker">👍 ${bi("Try saying", "Intenten decir")}</p>${list(say, "fs-list")}</div>` : "") +
          (dont.length ? `<div class="fs-compare-card fs-dont"><p class="fs-kicker">✋ ${bi("Try not to say", "Eviten decir")}</p>${list(dont, "fs-list")}</div>` : ""),
      ),
    );
  }
  if (listen.length) {
    s.appendChild(
      el(
        "div",
        "fs-note",
        `<strong>👂 ${bi("Listen for", "Pongan atención a")}</strong><ul class="fs-list">${listen.map((x) => `<li>${x.icon ? `<span aria-hidden="true">${esc(x.icon)}</span> ` : ""}${pair(x)}</li>`).join("")}</ul>`,
      ),
    );
  }
  return s;
}

/* ── 6 Words ───────────────────────────────────────────────────────── */
/** The page's own word card for a term: its Spanish name and its picture. */
function pageWord(term) {
  const want = String(term).trim().toLowerCase();
  for (const card of document.querySelectorAll(".vocab-card")) {
    const en = card.querySelector(".vocab-term .lang-en");
    if (en && en.textContent.trim().toLowerCase() === want) {
      const es = card.querySelector(".vocab-term .lang-es")?.textContent.trim();
      const img = card.querySelector("img.vocab-thumb");
      return { es: es || term, img: img?.getAttribute("src") || "" };
    }
  }
  return { es: term, img: "" };
}

function wordsChapter(notes) {
  const vocab = (notes.v3?.vocab || []).filter((v) => v.term && has(v.example));
  if (!vocab.length) return null;
  const s = section(
    "words",
    ["Tonight's words", "Las palabras de hoy"],
    ["Tap a card to see what the word is NOT.", "Toquen una tarjeta para ver lo que la palabra NO es."],
  );
  const grid = el("div", "fs-words");
  for (const v of vocab.slice(0, 5)) {
    const card = el("button", "fs-word");
    card.type = "button";
    card.setAttribute("aria-pressed", "false");
    const page = pageWord(v.term);
    card.innerHTML =
      (page.img ? `<img class="fs-word-img" src="${esc(page.img)}" alt="" loading="lazy" width="120" height="90">` : "") +
      `<span class="fs-word-term">${bi(v.term, page.es)}</span>` +
      `<span class="fs-word-side fs-word-yes">✅ ${pair(v.example)}</span>` +
      (has(v.nonExample) ? `<span class="fs-word-side fs-word-no">❌ ${pair(v.nonExample)}</span>` : "") +
      (has(v.frame) ? `<span class="fs-word-frame">🗣️ ${pair(v.frame)}</span>` : "");
    card.addEventListener("click", () => card.setAttribute("aria-pressed", card.getAttribute("aria-pressed") === "true" ? "false" : "true"));
    grid.appendChild(card);
  }
  s.appendChild(grid);
  return s;
}

/* ── 7 Teach it back ───────────────────────────────────────────────── */
function teachChapter(notes) {
  const steps = (notes.conceptSteps || []).filter(has);
  if (steps.length < 2) return null;
  const s = section(
    "teach",
    ["Teach it back", "Enséñalo tú"],
    [
      "Student: be the teacher. Explain tonight's example out loud. Grown-up: tap each step you hear.",
      "Estudiante: sé el maestro. Explica en voz alta el ejemplo de hoy. Adulto: toquen cada paso que escuchen.",
    ],
  );
  const frame = notes.corner?.frame;
  if (has(frame)) s.appendChild(el("p", "fs-frame", `🗣️ ${pair(frame)}`));
  const saved = store("teachback");
  const heard = new Set(saved.read([]));
  const list = el("ul", "fs-checks");
  const done = el(
    "p",
    "fs-done",
    `🎓 ${bi("You taught it! Teaching an idea is the best way to own it.", "¡Lo enseñaste! Enseñar una idea es la mejor manera de dominarla.")}`,
  );
  const check = () => {
    done.hidden = heard.size < steps.length;
  };
  steps.forEach((st, i) => {
    const label = has(st.cue) ? st.cue : st;
    const b = el("button", "fs-check", `<span class="fs-check-box" aria-hidden="true"></span> ${pair(label)}`);
    b.type = "button";
    b.setAttribute("aria-pressed", heard.has(i) ? "true" : "false");
    b.addEventListener("click", () => {
      const on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) heard.add(i);
      else heard.delete(i);
      saved.write([...heard]);
      const wasHidden = done.hidden;
      check();
      if (wasHidden && !done.hidden) sparkle(s);
    });
    const li = el("li");
    li.appendChild(b);
    list.appendChild(li);
  });
  check();
  s.append(list, done);
  return s;
}

/* ── 8 Take it home ────────────────────────────────────────────────── */
const DOWNLOADS = [
  { file: "family-guide", type: "pdf", en: "Grown-up guide (PDF)", es: "Guía para adultos (PDF)" },
  { file: "family-sheet", type: "pdf", en: "Practice sheet (PDF)", es: "Hoja de práctica (PDF)" },
  { file: "family-sheet", type: "docx", en: "Practice sheet (Word)", es: "Hoja de práctica (Word)" },
];

function takeChapter(id) {
  const s = section(
    "take",
    ["Take it home", "Para llevar a casa"],
    ["Print tonight's guide or practice sheet, in English or Spanish.", "Impriman la guía o la hoja de práctica de hoy, en inglés o en español."],
  );
  const grid = el("div", "fs-take");
  s.appendChild(grid);
  const base = `/lessons/${id}/downloads/${id}-`;
  const links = [];
  for (const d of DOWNLOADS) {
    for (const lang of ["en", "es"]) {
      links.push({ href: `${base}${d.file}${lang === "es" ? "-es" : ""}.${d.type}`, d, lang });
    }
  }
  /* Only files that are really there: a link that 404s at the kitchen table is worse than none. */
  Promise.all(
    links.map((l) =>
      fetch(l.href, { method: "HEAD", credentials: "same-origin" })
        .then((r) => (r.ok ? l : null))
        .catch(() => null),
    ),
  ).then((ok) => {
    for (const l of ok.filter(Boolean)) {
      const a = el(
        "a",
        "fs-take-link",
        `<span aria-hidden="true">${l.d.type === "pdf" ? "📄" : "📝"}</span> ${bi(l.d.en, l.d.es)} <span class="fs-take-lang">${l.lang === "es" ? "Español" : "English"}</span>`,
      );
      a.href = l.href;
      a.setAttribute("download", "");
      grid.appendChild(a);
    }
    const plan = document.querySelector('[data-act="hwPrint"]');
    if (plan) {
      const b = el("button", "fs-take-link", `<span aria-hidden="true">🖨️</span> ${bi("Print tonight's plan", "Imprimir el plan de hoy")}`);
      b.type = "button";
      b.addEventListener("click", () => plan.click());
      grid.appendChild(b);
    }
    if (!grid.children.length) s.hidden = true;
  });
  return s;
}

/** All chapters this lesson has data for, in order. */
export function buildUnderstand(notes, ctx) {
  const parts = [
    ideaChapter(notes),
    watchChapter(notes, ctx),
    tryChapter(ctx),
    bridgeChapter(notes),
    detectiveChapter(notes),
    coachChapter(notes),
    wordsChapter(notes),
    teachChapter(notes),
    takeChapter(ctx.id),
  ];
  return parts.filter(Boolean);
}
