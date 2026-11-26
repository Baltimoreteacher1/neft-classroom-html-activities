/**
 * Lock studio view for the equations missions.
 *   unit-8-a Escape Room Architect: build equation locks and inequality clues from a secret code,
 *            validate the puzzle, then let a partner play it (wrong codes get inverse-operation hints).
 *   unit-8-b Fundraiser Goal Tracker: a progress equation drives a progress bar; amounts are tested
 *            against the at-least goal on a number line.
 *   unit-8-c Master Codebreaker: the locks form a chain opened in order, then an inequality gate; a
 *            misread test shows which clue breaks if "at least" is read as "greater than".
 * Every mission gets the balance time machine (balance-view.js). Derived numbers that equal a hidden
 * Test answer print as "?". Pure logic: lock-model.mjs; hidden-answer rule: answer-guard.mjs.
 */
import { hiddenAnswers, isHidden } from "./answer-guard.mjs";
import { createBalancePanel } from "./balance-view.js";
import { parse, show } from "./exact.mjs";
import { createHistory } from "./history.mjs";
import { trackerMarkup } from "./lock-tracker-view.js";
import {
  MAX_CLUES,
  MAX_LOCKS,
  MAX_TRIES,
  buildQ,
  cleanLocks,
  gate,
  holds,
  lockText,
  misread,
  nextId,
  numText,
  opText,
  tryCode,
  validatePuzzle,
} from "./lock-model.mjs";
import { esc } from "./models-kit.mjs";

const MODE = { "unit-8-a": "escape", "unit-8-b": "tracker", "unit-8-c": "chain" };
const S = {
  escape: {
    title: ["Escape room lock builder", "Constructor de candados"],
    intro: [
      "Choose a secret code, build equation locks and inequality clues from it, and check that the puzzle has exactly your intended answer. Then hand it to a partner.",
      "Elige un código secreto, construye candados de ecuaciones y pistas de desigualdad, y comprueba que el acertijo tenga exactamente la respuesta que quieres. Luego dáselo a un compañero.",
    ],
    secret: ["Secret code", "Código secreto"],
  },
  chain: {
    title: ["Codebreaker chain builder", "Constructor de la cadena de candados"],
    intro: [
      "Link locks that share one secret into a chain, then finish with an inequality gate. A tester opens the locks in order. Use the misread test to repair a clue that breaks at its boundary.",
      "Une candados que comparten un secreto en una cadena y termina con una puerta de desigualdad. Quien prueba abre los candados en orden. Usa la prueba de lectura equivocada para reparar una pista que falla en su límite.",
    ],
    secret: ["Shared secret", "Secreto compartido"],
  },
  tracker: {
    title: ["Fundraiser goal tracker", "Monitor de la meta de recaudación"],
    intro: [
      "Write a progress equation for your fundraiser, propose a value for the unknown, and watch the progress bar. Then test amounts against the at-least goal.",
      "Escribe una ecuación de progreso para tu recaudación, propón un valor para la incógnita y mira la barra de progreso. Luego prueba cantidades contra la meta de por lo menos.",
    ],
    secret: ["My proposed value of the unknown", "Mi valor propuesto para la incógnita"],
  },
};
const T = {
  set: ["Set", "Fijar"],
  kind: ["Equation type", "Tipo de ecuación"],
  add: ["x + p = q", "x + p = q"],
  mul: ["p · x = q", "p · x = q"],
  addT: ["raised so far + x = goal", "lo recaudado + x = meta"],
  mulT: ["price per item × n = goal", "precio por artículo × n = meta"],
  p: ["p (the number with x)", "p (el número con x)"],
  q: [
    "q (leave blank to build it from the secret)",
    "q (déjalo vacío para construirlo con el secreto)",
  ],
  pT: ["Raised so far, or price per item ($)", "Lo recaudado o el precio por artículo ($)"],
  qT: ["Goal ($)", "Meta ($)"],
  addLock: ["Add lock", "Agregar candado"],
  addEq: ["Add equation", "Agregar ecuación"],
  locks: ["Locks", "Candados"],
  rebuild: ["Rebuild from secret", "Reconstruir con el secreto"],
  rebuildAll: [
    "Rebuild every lock from the secret",
    "Reconstruir todos los candados con el secreto",
  ],
  remove: ["Remove", "Quitar"],
  up: ["Move earlier", "Mover antes"],
  clues: ["Inequality clues", "Pistas de desigualdad"],
  addClue: ["Add clue", "Agregar pista"],
  undo: ["Undo", "Deshacer"],
  redo: ["Redo", "Rehacer"],
  play: ["Hand it to a partner (play mode)", "Dáselo a un compañero (modo de juego)"],
  build: ["Back to building", "Volver a construir"],
  code: ["Enter a code", "Escribe un código"],
  tryIt: ["Try it", "Probar"],
  hidden: [
    "? = this number is one of your Test answers. Check it in Test first.",
    "? = este número es una de tus respuestas de Probar. Compruébalo primero en Probar.",
  ],
  tries: ["Test an amount against the goal", "Prueba una cantidad contra la meta"],
  test: ["Test", "Probar"],
  atLeast: ["at least the goal (≥)", "por lo menos la meta (≥)"],
  more: ["more than the goal (>)", "más que la meta (>)"],
  bad: ["Type a number like 7, 2.5, 3/4 or 1 1/2.", "Escribe un número como 7, 2.5, 3/4 o 1 1/2."],
};

export function createLockStudio({ project, getState, save, announce }) {
  const mode = MODE[project.id] || "escape";
  let host = null;
  let playing = false;
  let play = { opened: 0, misses: {}, msg: "", gate: "" };
  let masked = false;
  const lang = () => (getState().lang === "es" ? 1 : 0);
  const t = (key) => (T[key] || S[mode][key])[lang()];
  const es = () => lang() === 1;
  const data = () => {
    const s = getState();
    s.workbench.locks ||= cleanLocks(null);
    return s.workbench.locks;
  };
  const history = createHistory(data());
  const fmtFor = () => {
    const hidden = hiddenAnswers(project, getState());
    return (v) => {
      if (!v) return "—";
      if (isHidden(hidden, v)) {
        masked = true;
        return "?";
      }
      return show(v);
    };
  };
  function edit(fn, message) {
    const next = structuredClone(data());
    fn(next);
    getState().workbench.locks = next;
    history.record(next);
    save();
    render();
    if (message) announce(message);
  }
  const balance = createBalancePanel({ getState, data, edit, announce, fmtFor });
  const qShown = (l, fmt) => (l.auto ? fmt(parse(l.q)) : l.q);

  /* -------------------------------------------------------------- builder markup */
  function lockCard(l, i, v, fmt) {
    const eqText = lockText(l, qShown(l, fmt));
    const verdict =
      v.error === "zero"
        ? es()
          ? "0 por x nunca da un solo valor: no hay una solución única."
          : "0 times x never pins down one value: no single solution."
        : !data().secret
          ? es()
            ? "Fija tu secreto para comprobar este candado."
            : "Set your secret to check this lock."
          : v.matches
            ? es()
              ? "Tiene exactamente tu solución: un solo valor la hace verdadera."
              : "Has exactly your intended solution: one value makes it true."
            : es()
              ? `Se resuelve con ${fmt(v.x)}, no con ${mode === "tracker" ? "tu valor propuesto" : "tu secreto"} ${data().secret}. Reconstrúyelo o cambia q.`
              : `Solves to ${fmt(v.x)}, not your ${mode === "tracker" ? "proposed value" : "secret"} ${data().secret}. Rebuild it or change q.`;
    const ok = v.matches;
    const label =
      mode === "tracker"
        ? `${es() ? "Ecuación" : "Equation"} ${i + 1}`
        : `${es() ? "Candado" : "Lock"} ${i + 1}`;
    return `<li class="eq-card"><p><strong>${label}:</strong> <span class="eq-math">${esc(eqText)}</span>${l.auto ? ` <span class="muted">(${es() ? "q construido" : "q built"})</span>` : ""}</p><p class="${ok ? "eq-ok" : "eq-no"}"><span aria-hidden="true">${ok ? "✓" : "✗"}</span> ${esc(verdict)}</p><div class="fd-row">${mode === "tracker" ? "" : `<button type="button" class="secondary small" data-eq-rebuild="${l.id}" ${data().secret ? "" : "disabled"}>${t("rebuild")}</button>`}${mode === "chain" && i > 0 ? `<button type="button" class="secondary small" data-eq-up="${l.id}">${t("up")}</button>` : ""}<button type="button" class="secondary small" data-eq-rm="${l.id}" aria-label="${esc(`${t("remove")} ${label}`)}">${t("remove")}</button></div></li>`;
  }
  function clueCard(c, i, v, fmt) {
    const parts = [];
    if (v.holds === false)
      parts.push(
        es()
          ? "✗ Esta pista descarta tu propio secreto."
          : "✗ This clue rules out your own secret.",
      );
    else if (v.holds)
      parts.push(es() ? "✓ Tu secreto cumple esta pista." : "✓ Your secret passes this clue.");
    parts.push(
      v.smallest
        ? es()
          ? `Menor número entero permitido: ${fmt(v.smallest)}.`
          : `Smallest whole number allowed: ${fmt(v.smallest)}.`
        : es()
          ? "Ningún número entero la cumple."
          : "No whole number passes it.",
    );
    const alt = `n ${opText(misread(c.op))} ${c.k}`;
    if (v.fragile)
      parts.push(
        es()
          ? `Prueba de límite: si alguien lee ${alt}, tu secreto ya NO pasa, porque el secreto está justo en el límite ${c.k}. Repárala: elige otro límite o di claramente si ${c.k} cuenta.`
          : `Boundary test: if someone reads it as ${alt}, your secret NO LONGER passes, because the secret sits exactly on the boundary ${c.k}. Repair it: pick another boundary or say clearly whether ${c.k} counts.`,
      );
    else if (v.holds)
      parts.push(
        es()
          ? `Prueba de límite: leída como ${alt}, tu secreto sigue pasando; ${c.k} ${c.op.endsWith("=") ? "dejaría de" : "pasaría a"} estar permitido.`
          : `Boundary test: read as ${alt}, your secret still passes; ${c.k} would ${c.op.endsWith("=") ? "stop being" : "become"} allowed.`,
      );
    return `<li class="eq-card"><p><strong>${es() ? "Pista" : "Clue"} ${i + 1}:</strong> <span class="eq-math">n ${opText(c.op)} ${esc(c.k)}</span></p>${parts.map((p) => `<p>${esc(p)}</p>`).join("")}<button type="button" class="secondary small" data-eq-crm="${c.id}">${t("remove")}</button></li>`;
  }
  function summary(check, fmt) {
    const d = data();
    const o = check.outcomes;
    const lines = [];
    if (d.clues.length)
      lines.push(
        o.empty
          ? es()
            ? "✗ Las pistas se contradicen: ningún número entero cumple todas."
            : "✗ The clues contradict each other: no whole number passes them all."
          : o.count === null
            ? es()
              ? `Las pistas permiten muchos números enteros desde ${fmt(o.lo)} en adelante.`
              : `The clues allow infinitely many whole numbers, from ${fmt(o.lo)} up.`
            : es()
              ? `Las pistas permiten ${o.count} número(s) entero(s), de ${fmt(o.lo)} a ${fmt(o.hi)}.`
              : `The clues allow ${o.count} whole number(s), from ${fmt(o.lo)} to ${fmt(o.hi)}.`,
      );
    if (mode !== "tracker")
      lines.push(
        check.ready
          ? es()
            ? "✓ Listo para un compañero: cada candado tiene exactamente tu solución y las pistas concuerdan."
            : "✓ Ready for a partner: every lock has exactly your intended solution and the clues agree."
          : es()
            ? "Todavía no está listo: cada candado debe resolverse con tu secreto y cada pista debe cumplirse."
            : "Not ready yet: every lock must solve to your secret and every clue must hold.",
      );
    return lines
      .map(
        (l) =>
          `<p class="${l.startsWith("✓") ? "eq-ok" : l.startsWith("✗") ? "eq-no" : ""}">${esc(l)}</p>`,
      )
      .join("");
  }

  /* -------------------------------------------------------------- play markup */
  function playMarkup() {
    const d = data();
    const clues = d.clues
      .map((c) => `<li class="eq-math">n ${opText(c.op)} ${esc(c.k)}</li>`)
      .join("");
    const head = `<p>${es() ? "Modo de juego: el secreto está oculto." : "Play mode: the secret is hidden."}</p>${clues ? `<p><strong>${es() ? "Pistas" : "Clues"}:</strong></p><ul>${clues}</ul>` : ""}`;
    const msg = play.msg ? `<p class="eq-hint" role="status">${esc(play.msg)}</p>` : "";
    if (mode === "chain") {
      if (play.opened < d.locks.length) {
        const l = d.locks[play.opened];
        return `${head}<p><strong>${es() ? "Candado" : "Lock"} ${play.opened + 1} / ${d.locks.length}:</strong> <span class="eq-math">${esc(lockText(l))}</span></p>${codeForm()}${msg}`;
      }
      return `${head}<p class="eq-ok">✓ ${es() ? "¡Abriste todos los candados de la cadena!" : "You opened every lock in the chain!"}</p>${d.clues.length ? `<p>${es() ? "Puerta final: escribe cualquier número entero que cumpla todas las pistas." : "Final gate: enter any whole number that passes every clue."}</p>${codeForm("gate")}${play.gate ? `<p class="eq-hint" role="status">${esc(play.gate)}</p>` : ""}` : ""}${msg}`;
    }
    const opened = d.locks.length && play.opened === d.locks.length;
    return `${head}<ul>${d.locks.map((l, i) => `<li class="eq-math">${es() ? "Candado" : "Lock"} ${i + 1}: ${esc(lockText(l))}</li>`).join("")}</ul>${opened ? `<p class="eq-ok">✓ ${es() ? "¡El cuarto está abierto! El código abre todos los candados." : "The room is open! The code opens every lock."}</p>` : codeForm()}${msg}`;
  }
  const codeForm = (kind = "code") =>
    `<form class="eq-grid" data-eq-form="${kind}" novalidate><label for="eq-code">${t("code")}<input id="eq-code" inputmode="decimal" maxlength="9" autocomplete="off"></label><button type="submit">${t("tryIt")}</button></form>`;
  function hintFor(l, r, misses) {
    const inv =
      l.kind === "add"
        ? es()
          ? `Este candado le suma ${l.p} al código. Para deshacer una suma, resta ${l.p} en los dos lados de ${lockText(l)}.`
          : `This lock adds ${l.p} to the code. To undo adding ${l.p}, subtract ${l.p} from both sides of ${lockText(l)}.`
        : es()
          ? `Este candado multiplica el código por ${l.p}. Para deshacer una multiplicación, divide los dos lados de ${lockText(l)} entre ${l.p}.`
          : `This lock multiplies the code by ${l.p}. To undo multiplying by ${l.p}, divide both sides of ${lockText(l)} by ${l.p}.`;
    const dir =
      r.side === "high"
        ? es()
          ? "Con tu código el lado izquierdo queda mayor que el derecho."
          : "Your code makes the left side greater than the right side."
        : es()
          ? "Con tu código el lado izquierdo queda menor que el derecho."
          : "Your code makes the left side less than the right side.";
    const check =
      misses > 1
        ? es()
          ? " Después sustituye tu código para comprobarlo antes de probar."
          : " Then substitute your code to check it before you try."
        : "";
    return `${es() ? "Todavía no." : "Not yet."} ${dir} ${inv}${check}`;
  }
  function tryPlay(raw, kind) {
    const d = data();
    const code = numText(raw);
    if (!code) return announce(t("bad"));
    if (kind === "gate") {
      const g = gate(d.clues, code);
      if (g.pass)
        play.gate = es()
          ? `✓ ${code} pasa la puerta. Otros números también la pasan: una desigualdad tiene muchas soluciones.`
          : `✓ ${code} passes the gate. Other numbers pass too: an inequality has many solutions.`;
      else {
        const f = g.failed[0];
        const c = d.clues.find((x) => x.id === f.id);
        play.gate =
          f.why === "boundary"
            ? es()
              ? `✗ ${code} está justo en el límite de n ${opText(c.op)} ${c.k}. ¿El símbolo incluye el límite?`
              : `✗ ${code} is exactly on the boundary of n ${opText(c.op)} ${c.k}. Does that symbol include the boundary?`
            : es()
              ? `✗ ${code} está ${f.why === "below" ? "por debajo" : "por encima"} de lo que permite n ${opText(c.op)} ${c.k}.`
              : `✗ ${code} is ${f.why === "below" ? "below" : "above"} what n ${opText(c.op)} ${c.k} allows.`;
      }
      render();
      return announce(play.gate);
    }
    const targets = mode === "chain" ? [d.locks[play.opened]] : d.locks;
    const results = targets.map((l) => ({ l, r: tryCode(l, code) }));
    const closed = results.filter((x) => !x.r.open);
    if (!closed.length) {
      play.opened = mode === "chain" ? play.opened + 1 : d.locks.length;
      play.msg =
        mode === "chain"
          ? es()
            ? `✓ ${code} abre el candado ${play.opened}. ¡Comprobado: el lado izquierdo es igual al derecho!`
            : `✓ ${code} opens lock ${play.opened}. Checked: the left side equals the right side!`
          : es()
            ? `✓ ${code} abre todos los candados.`
            : `✓ ${code} opens every lock.`;
    } else {
      const first = closed[0];
      play.misses[first.l.id] = (play.misses[first.l.id] || 0) + 1;
      const opened = results.length - closed.length;
      play.msg = `${mode === "escape" && opened ? (es() ? `Abre ${opened} de ${results.length} candados. ` : `It opens ${opened} of ${results.length} locks. `) : ""}${hintFor(first.l, first.r, play.misses[first.l.id])}`;
    }
    render();
    host?.querySelector("#eq-code")?.focus();
    announce(play.msg);
  }

  /* -------------------------------------------------------------- render */
  function render() {
    if (!host) return;
    masked = false;
    const fmt = fmtFor();
    const d = data();
    const check = validatePuzzle(d);
    host.querySelector("#eq-build").hidden = playing;
    host.querySelector("#eq-play").hidden = !playing;
    const playBtn = host.querySelector('[data-eq="play"]');
    if (playBtn) playBtn.textContent = playing ? t("build") : t("play");
    if (playing) host.querySelector("#eq-play-body").innerHTML = playMarkup();
    else {
      const secretInput = host.querySelector("#eq-secret");
      if (secretInput !== document.activeElement) secretInput.value = d.secret;
      host.querySelector("#eq-locks").innerHTML =
        d.locks.map((l, i) => lockCard(l, i, check.locks[i], fmt)).join("") ||
        `<li class="muted">${es() ? "Todavía no hay candados." : "No locks yet."}</li>`;
      host.querySelector("#eq-clues").innerHTML = d.clues
        .map((c, i) => clueCard(c, i, check.clues[i], fmt))
        .join("");
      host.querySelector("#eq-summary").innerHTML = summary(check, fmt);
      if (mode === "tracker") host.querySelector("#eq-tracker").innerHTML = trackerMarkup(d, fmt, es, t);
    }
    balance.render();
    host.querySelector("#eq-hidden").hidden = !masked;
    host.querySelector('[data-eq="undo"]').disabled = !history.canUndo();
    host.querySelector('[data-eq="redo"]').disabled = !history.canRedo();
  }

  function html() {
    const tracker = mode === "tracker";
    const kindOpts = `<option value="add">${tracker ? t("addT") : t("add")}</option><option value="mul">${tracker ? t("mulT") : t("mul")}</option>`;
    const clueOpts = [">=", ">", "<=", "<"]
      .map((o) => `<option value="${o}">n ${opText(o)} k</option>`)
      .join("");
    return `<section class="card eq" id="eq" aria-labelledby="eq-h"><h3 id="eq-h">${t("title")}</h3><p>${t("intro")}</p>
<div class="fd-row">${tracker ? "" : `<button type="button" class="secondary small" data-eq="play">${t("play")}</button>`}<button type="button" class="secondary small" data-eq="undo">${t("undo")}</button><button type="button" class="secondary small" data-eq="redo">${t("redo")}</button></div>
<p id="fd-status" class="notice" role="status"></p>
<div id="eq-play" hidden><div id="eq-play-body"></div></div>
<div id="eq-build">
<form class="eq-grid" data-eq-form="secret" novalidate><label for="eq-secret">${t("secret")}<input id="eq-secret" inputmode="decimal" maxlength="9" autocomplete="off"></label><button type="submit" class="secondary small">${t("set")}</button></form>
<h4>${tracker ? (es() ? "Ecuaciones de progreso" : "Progress equations") : t("locks")}</h4>
<form class="eq-grid" data-eq-form="lock" novalidate><label for="eq-kind">${t("kind")}<select id="eq-kind">${kindOpts}</select></label><label for="eq-p">${tracker ? t("pT") : t("p")}<input id="eq-p" inputmode="decimal" maxlength="9" autocomplete="off"></label><label for="eq-q">${tracker ? t("qT") : t("q")}<input id="eq-q" inputmode="decimal" maxlength="9" autocomplete="off"></label><button type="submit" class="secondary small">${tracker ? t("addEq") : t("addLock")}</button></form>
<ul id="eq-locks" class="eq-list"></ul>${tracker ? "" : `<button type="button" class="secondary small" data-eq="rebuild-all">${t("rebuildAll")}</button>`}
${tracker ? `<h4>${es() ? "Barra de progreso" : "Progress bar"}</h4><div id="eq-tracker" aria-live="polite"></div>` : ""}
<h4>${t("clues")}</h4><form class="eq-grid" data-eq-form="clue" novalidate><label for="eq-cop">${es() ? "Símbolo" : "Symbol"}<select id="eq-cop">${clueOpts}</select></label><label for="eq-ck">k<input id="eq-ck" inputmode="decimal" maxlength="9" autocomplete="off"></label><button type="submit" class="secondary small">${t("addClue")}</button></form>
<ul id="eq-clues" class="eq-list"></ul><div id="eq-summary" aria-live="polite"></div>
</div>${balance.html()}<p id="eq-hidden" class="muted" hidden>${t("hidden")}</p></section>`;
  }

  /* -------------------------------------------------------------- interaction */
  function onSubmit(event) {
    if (balance.handle(event)) return;
    const form = event.target.closest("[data-eq-form]");
    if (!form) return;
    event.preventDefault();
    const d = data();
    const kind = form.dataset.eqForm;
    if (kind === "code" || kind === "gate")
      return tryPlay(host.querySelector("#eq-code").value, kind);
    if (kind === "secret") {
      const v = numText(host.querySelector("#eq-secret").value);
      if (!v) return announce(t("bad"));
      return edit(
        (n) => (n.secret = v),
        `${t("secret")}: ${v}. ${es() ? "Revisa si cada candado sigue teniendo esta solución." : "Check whether every lock still has this solution."}`,
      );
    }
    if (kind === "lock") {
      if (d.locks.length >= MAX_LOCKS)
        return announce(es() ? "Máximo 6 candados." : "At most 6 locks.");
      const p = numText(host.querySelector("#eq-p").value);
      const qRaw = host.querySelector("#eq-q").value.trim();
      const lk = host.querySelector("#eq-kind").value;
      if (!p) return announce(t("bad"));
      let q = qRaw ? numText(qRaw) : null;
      let auto = false;
      if (qRaw && !q) return announce(t("bad"));
      if (!q && mode === "tracker") return announce(t("bad"));
      if (!q) {
        if (!d.secret)
          return announce(
            es() ? "Escribe q o fija primero tu secreto." : "Type q, or set your secret first.",
          );
        q = show(buildQ(lk, parse(p), parse(d.secret)));
        auto = true;
        if (!numText(q))
          return announce(
            es()
              ? "Ese q es demasiado largo; escríbelo tú."
              : "That q is too long to store; type one yourself.",
          );
      }
      const id = nextId(d.locks, "L");
      host.querySelector("#eq-p").value = host.querySelector("#eq-q").value = "";
      return edit(
        (n) => n.locks.push({ id, kind: lk, p, q, auto }),
        `${es() ? "Agregado" : "Added"}: ${lockText({ kind: lk, p, q: auto ? fmtFor()(parse(q)) : q })}`,
      );
    }
    if (kind === "clue") {
      if (d.clues.length >= MAX_CLUES)
        return announce(es() ? "Máximo 4 pistas." : "At most 4 clues.");
      const k = numText(host.querySelector("#eq-ck").value);
      if (!k) return announce(t("bad"));
      const op = host.querySelector("#eq-cop").value;
      host.querySelector("#eq-ck").value = "";
      return edit(
        (n) => n.clues.push({ id: nextId(d.clues, "C"), op, k }),
        `${es() ? "Pista" : "Clue"}: n ${opText(op)} ${k}`,
      );
    }
    if (kind === "try") {
      const v = numText(host.querySelector("#eq-try").value);
      if (!v || d.tries.length >= MAX_TRIES) return announce(t("bad"));
      host.querySelector("#eq-try").value = "";
      if (d.tries.includes(v)) return announce(`$${v}`);
      const ok = d.locks[0] && holds(d.goalOp, parse(d.locks[0].q), parse(v));
      return edit(
        (n) => n.tries.push(v),
        `$${v}: ${ok ? (es() ? "cumple la meta" : "meets the goal") : es() ? "no cumple la meta" : "does not meet the goal"}`,
      );
    }
  }
  function rebuild(n, id) {
    const l = n.locks.find((x) => x.id === id);
    const q = show(buildQ(l.kind, parse(l.p), parse(n.secret)));
    if (numText(q)) Object.assign(l, { q, auto: true });
  }
  function onClick(event) {
    if (balance.handle(event)) return;
    const d = data();
    const rb = event.target.closest("[data-eq-rebuild]");
    if (rb && d.secret)
      return edit(
        (n) => rebuild(n, rb.dataset.eqRebuild),
        es() ? "Candado reconstruido con tu secreto." : "Lock rebuilt from your secret.",
      );
    const rm = event.target.closest("[data-eq-rm]");
    if (rm) {
      balance.reset();
      return edit(
        (n) => {
          n.locks = n.locks.filter((l) => l.id !== rm.dataset.eqRm);
          delete n.steps[rm.dataset.eqRm];
        },
        es() ? "Candado quitado." : "Lock removed.",
      );
    }
    const up = event.target.closest("[data-eq-up]");
    if (up)
      return edit(
        (n) => {
          const i = n.locks.findIndex((l) => l.id === up.dataset.eqUp);
          if (i > 0) [n.locks[i - 1], n.locks[i]] = [n.locks[i], n.locks[i - 1]];
        },
        es() ? "Orden de la cadena cambiado." : "Chain order changed.",
      );
    const crm = event.target.closest("[data-eq-crm]");
    if (crm)
      return edit(
        (n) => (n.clues = n.clues.filter((c) => c.id !== crm.dataset.eqCrm)),
        es() ? "Pista quitada." : "Clue removed.",
      );
    const trm = event.target.closest("[data-eq-trm]");
    if (trm)
      return edit(
        (n) => (n.tries = n.tries.filter((s) => s !== trm.dataset.eqTrm)),
        `${t("remove")}: $${trm.dataset.eqTrm}`,
      );
    const b = event.target.closest("[data-eq]");
    if (!b) return;
    const name = b.dataset.eq;
    if (name === "play") {
      playing = !playing;
      play = { opened: 0, misses: {}, msg: "", gate: "" };
      render();
      host.querySelector(playing ? "#eq-code" : "[data-eq='play']")?.focus();
      return announce(
        playing
          ? es()
            ? "Modo de juego. El secreto está oculto."
            : "Play mode. The secret is hidden."
          : t("build"),
      );
    }
    if (name === "rebuild-all" && d.secret)
      return edit(
        (n) => n.locks.forEach((l) => rebuild(n, l.id)),
        es()
          ? "Todos los candados reconstruidos con tu secreto."
          : "Every lock rebuilt from your secret.",
      );
    if (name === "undo" || name === "redo") {
      const next = name === "undo" ? history.undo() : history.redo();
      if (!next) return;
      getState().workbench.locks = cleanLocks(next);
      balance.reset();
      save();
      render();
      announce(
        name === "undo"
          ? es()
            ? "Se deshizo el último cambio."
            : "Undid the last change."
          : es()
            ? "Se rehízo el cambio."
            : "Redid the change.",
      );
    }
  }
  function onChange(event) {
    if (balance.handle(event)) return;
    if (event.target.name === "eq-goalop")
      edit(
        (n) => (n.goalOp = event.target.value === ">" ? ">" : ">="),
        event.target.value === ">" ? t("more") : t("atLeast"),
      );
  }

  return {
    html,
    render,
    attach(section) {
      host = section.querySelector("#eq");
      if (!host) return;
      balance.attach(host);
      host.addEventListener("click", onClick);
      host.addEventListener("submit", onSubmit);
      host.addEventListener("change", onChange);
      render();
    },
    detach() {
      balance.detach();
      host = null;
    },
    restored(next) {
      getState().workbench.locks = cleanLocks(next);
      history.record(getState().workbench.locks, null);
      balance.reset();
      render();
    },
  };
}
