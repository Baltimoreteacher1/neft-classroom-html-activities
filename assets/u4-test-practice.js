/* Unit 4 Test Practice engine. Shared by /curriculum/unit-4-test-practice/ and ...-challenge/.
 * Reads the page's #tp-config JSON (written by scripts/generate-unit4-test-practice.mjs from
 * data/unit4-test-practice.mjs). Optional and ungraded: progress is saved in this browser only. */
(() => {
  "use strict";

  const cfg = JSON.parse(document.getElementById("tp-config").textContent);
  const KEY = `neft_u4_testprac_${cfg.key}_v1`;
  const ZOOMS = [1, 1.15, 1.3];
  const EPS = 1e-6;
  const root = document.getElementById("tp-root");

  /** @type {{lang:string, zoom:number, items:Record<string,any>, text:Record<string,string>, draw:Record<string,string>, rub:Record<string,boolean[]>}} */
  let S = { lang: "en", zoom: 0, items: {}, text: {}, draw: {}, rub: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved === "object") S = Object.assign(S, saved);
  } catch (_) {
    /* storage blocked: the page still works, it just does not remember */
  }
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (_) {
      /* ignore */
    }
  };

  const esc = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const fmt = (s) =>
    esc(s).replace(
      /\[\[(\d+)\/(\d+)\]\]/g,
      '<span class="frac" role="img" aria-label="$1 over $2"><span aria-hidden="true">$1</span><span aria-hidden="true">$2</span></span>',
    );
  const T = (o) =>
    `<span class="l-en">${fmt(o.en)}</span><span class="l-es" lang="es">${fmt(o.es)}</span>`;
  const L = (en, es) => T({ en, es });
  const byId = new Map(cfg.items.map((it, i) => [it.id, { it, n: i + 1 }]));
  const st = (id) =>
    (S.items[id] = S.items[id] || {
      tries: 0,
      hints: 0,
      solved: false,
      seen: false,
      steps: {},
      claim: false,
    });
  const near = (a, b) => Math.abs(a - b) < EPS;

  /* ---------- markup ---------- */

  function tapeSvg(t) {
    const w = 46;
    const h = 32;
    const cols = Math.max(t.whole, t.shown);
    const width = cols * w + 96;
    const box = (i, y, fill) =>
      `<rect x="${4 + i * w}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#15487f" stroke-width="2"/>`;
    let g = "";
    for (let i = 0; i < t.whole; i++) g += box(i, 4, "#e0f2fe");
    for (let i = 0; i < t.shown; i++) g += box(i, 4 + h + 14, "#6fa8dc");
    return `<svg class="tp-tape" viewBox="0 0 ${width} ${h * 2 + 22}" role="img" aria-label="Tape diagram. Top bar: 100%, ${t.whole} equal boxes. Bottom bar: ${t.shown} boxes the same size.">${g}<text x="${t.whole * w + 12}" y="${4 + h / 2 + 6}" font-size="18" font-weight="700" fill="#15487f">100%</text></svg>`;
  }

  const unitIn = (it) => (it.unit === "$" ? '<span class="unit" aria-hidden="true">$</span>' : "");
  const unitOut = (it) => (it.unit === "%" ? '<span class="unit" aria-hidden="true">%</span>' : "");
  const fb = (name) =>
    `<div class="tp-fb" data-fb="${name}" role="status" aria-live="polite"></div>`;

  function answerRow(it) {
    return `<div class="tp-answer"><label for="in-${it.id}">${L("Your answer", "Tu respuesta")}</label>${unitIn(it)}<input type="text" id="in-${it.id}" inputmode="decimal" autocomplete="off" data-in="${it.id}">${unitOut(it)}<button type="button" class="tp-btn primary" data-act="check" data-id="${it.id}">${L("Check", "Comprobar")}</button></div>`;
  }

  function options(it, multi) {
    const type = multi ? "checkbox" : "radio";
    const name = `o-${it.id}`;
    const opts = it.options
      .map(
        (o, i) =>
          `<label class="tp-opt" data-opt="${i}"><input type="${type}" name="${name}" value="${i}"><span>${fmt(o.text)}</span></label>`,
      )
      .join("");
    return `<fieldset class="tp-opts"><legend class="sr-only" style="position:absolute;left:-9999px">${L("Choose an answer", "Elige una respuesta")}</legend>${opts}</fieldset><div class="tp-actions"><button type="button" class="tp-btn primary" data-act="${multi ? "check-multi" : "check-mc"}" data-id="${it.id}">${L("Check", "Comprobar")}</button></div>`;
  }

  function helpButtons(it) {
    return `<div class="tp-actions"><button type="button" class="tp-btn" data-act="hint" data-id="${it.id}">💡 ${L("Hint", "Pista")}</button><button type="button" class="tp-btn" data-act="show" data-id="${it.id}">${L("Show me how", "Muéstrame cómo")}</button></div>${fb("help")}`;
  }

  function crBody(it) {
    const table = it.table
      ? `<table class="tp-table"><thead><tr>${it.table.head.map((h) => `<th scope="col">${T(h)}</th>`).join("")}</tr></thead><tbody>${it.table.rows.map((r) => `<tr><th scope="row">${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table>`
      : "";
    const steps = it.steps
      .map(
        (s, i) =>
          `<div class="tp-step"><div class="tp-answer"><label for="in-${it.id}-${i}">${T(s.label)}</label></div><div class="tp-answer">${s.unit === "$" ? '<span class="unit" aria-hidden="true">$</span>' : ""}<input type="text" id="in-${it.id}-${i}" inputmode="decimal" autocomplete="off" data-in="${it.id}" data-step="${i}"><button type="button" class="tp-btn primary" data-act="step" data-id="${it.id}" data-step="${i}">${L("Check", "Comprobar")}</button></div>${fb(`step-${i}`)}</div>`,
      )
      .join("");
    const claim = `<fieldset class="tp-step tp-claim"><legend>${T(it.claim)}</legend><div class="tp-opts"><label class="tp-opt"><input type="radio" name="claim-${it.id}" value="yes"><span>${L("Yes, it is correct", "Sí, es correcta")}</span></label><label class="tp-opt"><input type="radio" name="claim-${it.id}" value="no"><span>${L("No, it is not correct", "No, no es correcta")}</span></label></div><button type="button" class="tp-btn primary" data-act="claim" data-id="${it.id}">${L("Check", "Comprobar")}</button>${fb("claim")}</fieldset>`;
    const rubric = it.rubric
      .map(
        (r, i) =>
          `<li><label><input type="checkbox" data-rub="${it.id}" data-i="${i}"><span>${T(r)}</span></label></li>`,
      )
      .join("");
    return `${it.story ? `<p class="tp-q">${T(it.story)}</p>` : ""}${table}<p class="tp-q">${T(it.q)}</p>${steps}${claim}<div class="tp-step"><label>${L("Drawing box: show a table, tape diagram or double number line.", "Cuadro de dibujo: muestra una tabla, un diagrama de cinta o una recta numérica doble.")}</label><canvas class="tp-draw" width="600" height="240" data-draw="${it.id}" aria-label="${esc("Drawing box")}"></canvas><div class="tp-actions"><button type="button" class="tp-btn" data-act="clear" data-id="${it.id}">${L("Clear drawing", "Borrar dibujo")}</button></div></div><div class="tp-step"><label for="tx-${it.id}">${L("Explain how your work shows whether the claim is correct.", "Explica cómo tu trabajo muestra si la afirmación es correcta.")}</label><textarea class="tp-text" id="tx-${it.id}" data-tx="${it.id}"></textarea></div><div class="tp-step"><strong>${L("Check your explanation. Did you…", "Revisa tu explicación. ¿Lo hiciste…")}</strong><ul class="tp-rubric">${rubric}</ul></div><div class="tp-actions"><button type="button" class="tp-btn" data-act="model" data-id="${it.id}">${L("Show a model answer", "Mostrar una respuesta modelo")}</button></div>${fb("model")}`;
  }

  function cardHtml(it, n) {
    const head = `<div class="tp-qhead"><span>${L("Question", "Pregunta")} ${n}</span><span class="tp-star" data-star="${it.id}" aria-live="polite"></span></div>`;
    let body;
    if (it.type === "cr") {
      body = crBody(it);
    } else if (it.type === "multi") {
      body = `<p class="tp-q">${T(it.q)}</p>${options(it, true)}`;
    } else if (it.type === "mc") {
      body = `<p class="tp-q">${T(it.q)}</p>${options(it, false)}`;
    } else {
      body = `${it.type === "tape" ? tapeSvg(it.tape) : ""}<p class="tp-q">${T(it.q)}</p>${answerRow(it)}`;
    }
    const help =
      it.type === "cr"
        ? `<div class="tp-actions"><button type="button" class="tp-btn" data-act="hint" data-id="${it.id}">💡 ${L("Hint", "Pista")}</button><button type="button" class="tp-btn" data-act="show" data-id="${it.id}">${L("Show me how", "Muéstrame cómo")}</button></div>${fb("help")}`
        : helpButtons(it);
    return `<article class="tp-card" id="card-${it.id}" data-card="${it.id}" aria-label="${esc(`Question ${n}`)}">${head}${body}${it.type === "cr" ? "" : fb("main")}${help}</article>`;
  }

  function build() {
    const order = Object.keys(cfg.strands).filter((k) => cfg.items.some((it) => it.strand === k));
    const nav = order
      .map(
        (k) =>
          `<a href="#strand-${k}" data-nav="${k}"><span aria-hidden="true">${cfg.strands[k].icon}</span> ${T(cfg.strands[k])}</a>`,
      )
      .join("");
    const sections = order
      .map((k) => {
        const cards = cfg.items
          .filter((it) => it.strand === k)
          .map((it) => cardHtml(it, byId.get(it.id).n))
          .join("");
        return `<section aria-labelledby="h-${k}"><div class="tp-strand" id="strand-${k}"><span class="ico" aria-hidden="true">${cfg.strands[k].icon}</span><h2 id="h-${k}">${T(cfg.strands[k])}</h2></div>${cards}</section>`;
      })
      .join("");
    const toolbox = cfg.toolbox.map((t) => `<li>${T(t)}</li>`).join("");
    root.innerHTML = `<section class="tp-hero"><h2>${T(cfg.title)}</h2><p>${T(cfg.pitch)}</p><p class="tp-note">${L("Optional and ungraded. These are new numbers, not the real test. Your answers save on this device.", "Opcional y sin calificación. Son números nuevos, no el examen real. Tus respuestas se guardan en este dispositivo.")}</p><div class="tp-progress"><span id="tpProg"></span><div class="tp-bar" aria-hidden="true"><span id="tpBar" style="width:0"></span></div><span id="tpStars"></span></div></section><details class="tp-tool"><summary>🧰 ${L("Strategy toolbox", "Caja de estrategias")}</summary><ul>${toolbox}</ul></details><nav class="tp-nav" aria-label="${esc("Skills")}">${nav}</nav>${sections}<section class="tp-card tp-sum" id="tpSum" aria-labelledby="tpSumH"></section><p class="tp-links">${cfg.links}</p>`;
  }

  /* ---------- state helpers ---------- */

  const card = (id) => document.getElementById(`card-${id}`);
  const out = (id, name, kind, html) => {
    const el = card(id).querySelector(`[data-fb="${name}"]`);
    el.className = `tp-fb${kind ? ` ${kind}` : ""}`;
    el.innerHTML = html;
  };
  const stars = (s) =>
    s.solved ? (s.hints === 0 && s.tries <= 1 && !s.seen ? 3 : s.tries <= 2 && !s.seen ? 2 : 1) : 0;

  function paintStars(id) {
    const s = st(id);
    const el = card(id).querySelector(`[data-star="${id}"]`);
    el.textContent = s.solved ? "★".repeat(stars(s)) + "☆".repeat(3 - stars(s)) : "";
    el.setAttribute("aria-label", s.solved ? `${stars(s)} of 3 stars` : "");
    card(id).classList.toggle("solved", s.solved);
  }

  function summary() {
    const total = cfg.items.length;
    const done = cfg.items.filter((it) => st(it.id).solved).length;
    const star = cfg.items.reduce((a, it) => a + stars(st(it.id)), 0);
    document.getElementById("tpProg").innerHTML = `${L("Done", "Hecho")}: ${done} / ${total}`;
    document.getElementById("tpBar").style.width = `${(done / total) * 100}%`;
    document.getElementById("tpStars").textContent = `★ ${star} / ${total * 3}`;
    const rows = Object.keys(cfg.strands)
      .filter((k) => cfg.items.some((it) => it.strand === k))
      .map((k) => {
        const its = cfg.items.filter((it) => it.strand === k);
        const d = its.filter((it) => st(it.id).solved).length;
        document.querySelector(`[data-nav="${k}"]`).classList.toggle("done", d === its.length);
        return `<li><span style="min-width:15rem">${T(cfg.strands[k])}</span><span class="tp-bar" aria-hidden="true"><span style="width:${(d / its.length) * 100}%"></span></span><span>${d}/${its.length}</span></li>`;
      })
      .join("");
    const msg =
      done === total
        ? L(
            "Every skill is done. You are ready for the Unit 4 test.",
            "Todas las destrezas están hechas. Estás listo para el examen de la Unidad 4.",
          )
        : L(
            "Come back to any skill that is not full yet. Hints and worked examples are always there.",
            "Vuelve a cualquier destreza que aún no esté completa. Las pistas y los ejemplos resueltos siempre están ahí.",
          );
    document.getElementById("tpSum").innerHTML =
      `<h2 id="tpSumH">${L("Your progress", "Tu progreso")}</h2><p>${msg}</p><ul>${rows}</ul><div class="tp-actions"><button type="button" class="tp-btn" data-act="reset" id="tpReset">${L("Start over", "Empezar de nuevo")}</button></div>`;
  }

  function solve(it, html) {
    const s = st(it.id);
    s.solved = true;
    save();
    paintStars(it.id);
    summary();
    return html;
  }

  const whyHtml = (it) => `<p><strong>${L("Why", "Por qué")}:</strong> ${T(it.why)}</p>`;

  /* ---------- checking ---------- */

  function parseNum(raw) {
    const v = String(raw).replace(/[$%,\s]/g, "");
    return /^-?(\d+\.?\d*|\.\d+)$/.test(v) ? Number.parseFloat(v) : Number.NaN;
  }

  function missNote(it, v) {
    const trap = (it.traps || []).find((t) => near(t.value, v));
    if (trap) return T(trap);
    if (it.unit === "%" && !near(it.answer, it.answer / 100) && near(v, it.answer / 100)) {
      return L(
        "That is the decimal form. The question asks for a percent, so multiply by 100.",
        "Esa es la forma decimal. La pregunta pide un porcentaje, así que multiplica por 100.",
      );
    }
    return L(
      "Not yet. Read the question again, or tap Hint.",
      "Todavía no. Lee la pregunta otra vez o toca Pista.",
    );
  }

  function checkNum(it, input, target) {
    const v = parseNum(input.value);
    const s = st(it.id);
    if (Number.isNaN(v)) {
      out(
        it.id,
        target,
        "hint",
        `<p>${L("Type a number, like 42 or 62.5.", "Escribe un número, como 42 o 62.5.")}</p>`,
      );
      return false;
    }
    s.tries += 1;
    return v;
  }

  function onCheck(id) {
    const { it } = byId.get(id);
    const input = document.getElementById(`in-${id}`);
    const v = checkNum(it, input, "main");
    if (v === false) return;
    if (near(v, it.answer)) {
      out(id, "main", "good", solve(it, `<p>✓ ${L("Correct!", "¡Correcto!")}</p>${whyHtml(it)}`));
    } else {
      save();
      out(id, "main", "bad", `<p>${missNote(it, v)}</p>`);
    }
  }

  function onCheckMc(id) {
    const { it } = byId.get(id);
    const picked = card(id).querySelector(`input[name="o-${id}"]:checked`);
    if (!picked) {
      out(
        id,
        "main",
        "hint",
        `<p>${L("Choose an answer first.", "Primero elige una respuesta.")}</p>`,
      );
      return;
    }
    const opt = it.options[Number(picked.value)];
    st(id).tries += 1;
    const label = picked.closest(".tp-opt");
    if (opt.ok) {
      label.classList.add("ok");
      out(
        id,
        "main",
        "good",
        solve(it, `<p>✓ ${L("Correct!", "¡Correcto!")} ${T(opt.note)}</p>${whyHtml(it)}`),
      );
    } else {
      card(id)
        .querySelectorAll(".tp-opt")
        .forEach((o) => o.classList.remove("no"));
      label.classList.add("no");
      save();
      out(id, "main", "bad", `<p>${T(opt.note)}</p>`);
    }
  }

  function onCheckMulti(id) {
    const { it } = byId.get(id);
    const boxes = [...card(id).querySelectorAll(`input[name="o-${id}"]`)];
    const picks = boxes.map((b) => b.checked);
    if (!picks.some(Boolean)) {
      out(
        id,
        "main",
        "hint",
        `<p>${L("Choose at least one answer.", "Elige al menos una respuesta.")}</p>`,
      );
      return;
    }
    st(id).tries += 1;
    const wrong = [];
    let missed = 0;
    it.options.forEach((o, i) => {
      const lab = boxes[i].closest(".tp-opt");
      lab.classList.remove("no", "ok");
      if (picks[i] && !o.ok) {
        wrong.push(o);
        lab.classList.add("no");
      }
      if (!picks[i] && o.ok) missed += 1;
    });
    if (!wrong.length && !missed) {
      boxes.forEach((b, i) => it.options[i].ok && b.closest(".tp-opt").classList.add("ok"));
      out(id, "main", "good", solve(it, `<p>✓ ${L("Correct!", "¡Correcto!")}</p>${whyHtml(it)}`));
      return;
    }
    save();
    const notes = wrong.map((o) => `<p>${T(o.note)}</p>`).join("");
    const more = missed
      ? `<p>${L(`You still need to find ${missed} more.`, `Todavía te faltan ${missed} más.`)}</p>`
      : "";
    out(id, "main", "bad", `${notes}${more}`);
  }

  function crDone(it) {
    const s = st(it.id);
    return it.steps.every((_, i) => s.steps[i]) && s.claim;
  }

  function onStep(id, i) {
    const { it } = byId.get(id);
    const step = it.steps[i];
    const input = document.getElementById(`in-${id}-${i}`);
    const v = checkNum(it, input, `step-${i}`);
    if (v === false) return;
    const s = st(id);
    if (near(v, step.answer)) {
      s.steps[i] = true;
      out(id, `step-${i}`, "good", `<p>✓ ${L("Correct!", "¡Correcto!")}</p>`);
      if (crDone(it)) solve(it, "");
      else save();
    } else {
      save();
      out(
        id,
        `step-${i}`,
        "bad",
        `<p>${L("Not yet. Use your table or tape diagram, or tap Hint.", "Todavía no. Usa tu tabla o tu diagrama de cinta, o toca Pista.")}</p>`,
      );
    }
  }

  function onClaim(id) {
    const { it } = byId.get(id);
    const picked = card(id).querySelector(`input[name="claim-${id}"]:checked`);
    if (!picked) {
      out(id, "claim", "hint", `<p>${L("Choose yes or no.", "Elige sí o no.")}</p>`);
      return;
    }
    const s = st(id);
    s.tries += 1;
    if ((picked.value === "yes") === it.claim.truth) {
      s.claim = true;
      out(
        id,
        "claim",
        "good",
        `<p>✓ ${L("Correct. Now explain it with numbers in the box below.", "Correcto. Ahora explícalo con números en el cuadro de abajo.")}</p>`,
      );
      if (crDone(it)) solve(it, "");
      else save();
    } else {
      save();
      out(
        id,
        "claim",
        "bad",
        `<p>${L("Not yet. Compare your two answers from the steps above.", "Todavía no. Compara tus dos respuestas de los pasos de arriba.")}</p>`,
      );
    }
  }

  function onHint(id) {
    const { it } = byId.get(id);
    st(id).hints += 1;
    save();
    out(id, "help", "hint", `<p>💡 ${T(it.hint)}</p>`);
  }

  function onShow(id) {
    const { it } = byId.get(id);
    const s = st(id);
    if (!s.solved) s.seen = true;
    save();
    out(id, "help", "hint", whyHtml(it));
  }

  function onModel(id) {
    const { it } = byId.get(id);
    const s = st(id);
    if (!crDone(it)) {
      out(
        id,
        "model",
        "hint",
        `<p>${L("Finish the steps and the yes/no question first, then compare your explanation with the model.", "Termina primero los pasos y la pregunta de sí o no; luego compara tu explicación con el modelo.")}</p>`,
      );
      return;
    }
    out(
      id,
      "model",
      "good",
      `<p><strong>${L("Model answer", "Respuesta modelo")}:</strong> ${T(it.model)}</p>`,
    );
    save();
    paintStars(id);
    return s;
  }

  /* ---------- drawing box ---------- */

  function setupDrawing(canvas) {
    const id = canvas.dataset.draw;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#15487f";
    if (S.draw[id]) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = S.draw[id];
    }
    let down = false;
    const at = (e) => {
      const r = canvas.getBoundingClientRect();
      return [
        ((e.clientX - r.left) * canvas.width) / r.width,
        ((e.clientY - r.top) * canvas.height) / r.height,
      ];
    };
    canvas.addEventListener("pointerdown", (e) => {
      down = true;
      canvas.setPointerCapture(e.pointerId);
      const [x, y] = at(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!down) return;
      const [x, y] = at(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    });
    const end = () => {
      if (!down) return;
      down = false;
      S.draw[id] = canvas.toDataURL("image/png");
      save();
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
  }

  /* ---------- chrome ---------- */

  function applyLang() {
    document.body.classList.remove("lang-en", "lang-es", "lang-both");
    document.body.classList.add(`lang-${S.lang}`);
    document.documentElement.lang = S.lang === "es" ? "es" : "en";
    document
      .querySelectorAll("[data-lang]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === S.lang)));
  }
  const applyZoom = () =>
    document.documentElement.style.setProperty("--tp-zoom", String(ZOOMS[S.zoom]));

  let resetArmed = 0;
  function onReset(btn) {
    if (!resetArmed) {
      btn.innerHTML = L("Tap again to erase everything", "Toca otra vez para borrar todo");
      resetArmed = window.setTimeout(() => {
        resetArmed = 0;
        btn.innerHTML = L("Start over", "Empezar de nuevo");
      }, 4000);
      return;
    }
    window.clearTimeout(resetArmed);
    S = { lang: S.lang, zoom: S.zoom, items: {}, text: {}, draw: {}, rub: {} };
    save();
    start();
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act],[data-lang],[data-zoom],[data-print]");
    if (!b) return;
    if (b.dataset.lang) {
      S.lang = b.dataset.lang;
      save();
      applyLang();
      return;
    }
    if (b.hasAttribute("data-zoom")) {
      S.zoom = (S.zoom + 1) % ZOOMS.length;
      save();
      applyZoom();
      return;
    }
    if (b.hasAttribute("data-print")) {
      window.print();
      return;
    }
    const id = b.dataset.id;
    const act = b.dataset.act;
    if (act === "check") onCheck(id);
    else if (act === "check-mc") onCheckMc(id);
    else if (act === "check-multi") onCheckMulti(id);
    else if (act === "step") onStep(id, Number(b.dataset.step));
    else if (act === "claim") onClaim(id);
    else if (act === "hint") onHint(id);
    else if (act === "show") onShow(id);
    else if (act === "model") onModel(id);
    else if (act === "reset") onReset(b);
    else if (act === "clear") {
      const cv = card(id).querySelector("canvas");
      cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
      delete S.draw[id];
      save();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const input = e.target.closest("input[data-in]");
    if (!input) return;
    e.preventDefault();
    if (input.dataset.step !== undefined) onStep(input.dataset.in, Number(input.dataset.step));
    else onCheck(input.dataset.in);
  });

  document.addEventListener("input", (e) => {
    const tx = e.target.closest("[data-tx]");
    if (tx) {
      S.text[tx.dataset.tx] = tx.value;
      save();
    }
  });
  document.addEventListener("change", (e) => {
    const r = e.target.closest("[data-rub]");
    if (!r) return;
    const arr = (S.rub[r.dataset.rub] = S.rub[r.dataset.rub] || []);
    arr[Number(r.dataset.i)] = r.checked;
    save();
  });

  function restore() {
    cfg.items.forEach((it) => {
      const s = st(it.id);
      paintStars(it.id);
      if (it.type === "cr") {
        const tx = document.getElementById(`tx-${it.id}`);
        if (tx && S.text[it.id]) tx.value = S.text[it.id];
        (S.rub[it.id] || []).forEach((on, i) => {
          const box = card(it.id).querySelector(`[data-rub="${it.id}"][data-i="${i}"]`);
          if (box) box.checked = !!on;
        });
        it.steps.forEach((step, i) => {
          if (!s.steps[i]) return;
          document.getElementById(`in-${it.id}-${i}`).value = String(step.answer);
          out(it.id, `step-${i}`, "good", `<p>✓ ${L("Correct!", "¡Correcto!")}</p>`);
        });
        if (s.claim) out(it.id, "claim", "good", `<p>✓ ${L("Correct.", "Correcto.")}</p>`);
      } else if (s.solved && (it.type === "num" || it.type === "tape")) {
        document.getElementById(`in-${it.id}`).value = String(it.answer);
        out(it.id, "main", "good", whyHtml(it));
      } else if (s.solved) {
        it.options.forEach((o, i) => {
          if (o.ok) {
            const inp = card(it.id).querySelector(`input[name="o-${it.id}"][value="${i}"]`);
            inp.checked = true;
            inp.closest(".tp-opt").classList.add("ok");
          }
        });
        out(it.id, "main", "good", whyHtml(it));
      }
    });
  }

  function start() {
    build();
    root.querySelectorAll("canvas[data-draw]").forEach(setupDrawing);
    restore();
    summary();
    applyLang();
    applyZoom();
  }
  start();
})();
