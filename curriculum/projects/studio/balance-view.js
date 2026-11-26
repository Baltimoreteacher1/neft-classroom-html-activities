/**
 * Balance "time machine" for the lock studio (equations missions). The student applies solving
 * steps to a lock: an operation, an amount and which side(s). Each step is replayed exactly by
 * lock-model.mjs `timeline`; the beam stays level while the equation keeps the lock's solution and
 * tips when a step changed one side only. Rewind, step forward and replay move through the steps;
 * applying a new step while rewound replaces the steps after that point.
 * Numbers the panel derives that equal a hidden Test answer print as "?" (fmt supplied by the host).
 */
import { esc, INK, MUTED, ORANGE, PEACH, TEAL, LIME } from "./models-kit.mjs";
import { parse } from "./exact.mjs";
import { MAX_STEPS, lockText, numText, sideText, timeline } from "./lock-model.mjs";

const L = {
  title: ["Balance time machine", "Máquina del tiempo de la balanza"],
  intro: [
    "Pick a lock and solve it one step at a time. Do the same thing to both sides to keep the balance level. Rewind to any step and try a different move.",
    "Elige un candado y resuélvelo paso a paso. Haz lo mismo en los dos lados para que la balanza quede nivelada. Regresa a cualquier paso y prueba otro movimiento.",
  ],
  lock: ["Lock on the balance", "Candado en la balanza"],
  op: ["Operation", "Operación"],
  amount: ["Amount", "Cantidad"],
  side: ["Apply to", "Aplicar a"],
  both: ["both sides", "los dos lados"],
  left: ["left side only", "solo el lado izquierdo"],
  right: ["right side only", "solo el lado derecho"],
  apply: ["Apply step", "Aplicar paso"],
  rewind: ["Rewind to start", "Regresar al inicio"],
  back: ["Step back", "Paso atrás"],
  fwd: ["Step forward", "Paso adelante"],
  replay: ["Replay all steps", "Repetir todos los pasos"],
  steps: ["Solving steps", "Pasos de solución"],
  none: ["No steps yet.", "Todavía no hay pasos."],
  start: ["Start", "Inicio"],
  noLock: [
    "Add a lock first, then open it here.",
    "Primero agrega un candado y luego ábrelo aquí.",
  ],
  full: [
    "A lock keeps at most 12 steps. Rewind and replace one.",
    "Un candado guarda como máximo 12 pasos. Regresa y reemplaza uno.",
  ],
  badAmount: ["Type an amount like 5, 2.5 or 3/4.", "Escribe una cantidad como 5, 2.5 o 3/4."],
};
const OPS = {
  "+": ["add", "sumar"],
  "-": ["subtract", "restar"],
  "*": ["multiply by", "multiplicar por"],
  "/": ["divide by", "dividir entre"],
};
const SYM = { "+": "+", "-": "−", "*": "×", "/": "÷" };

export function createBalancePanel({ getState, data, edit, announce, fmtFor }) {
  let host = null;
  let lockId = null;
  const cursors = new Map();
  let timer = null;
  const lang = () => (getState().lang === "es" ? 1 : 0);
  const t = (key) => L[key][lang()];
  const lock = () => data().locks.find((l) => l.id === lockId) || data().locks[0] || null;
  const stepsOf = (l) => data().steps[l.id] || [];
  const cursorOf = (l) => Math.min(cursors.get(l.id) ?? stepsOf(l).length, stepsOf(l).length);
  const reduced = () =>
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stop = () => {
    clearInterval(timer);
    timer = null;
  };

  function stepText(st) {
    const where = { both: t("both"), left: t("left"), right: t("right") }[st.side];
    return `${OPS[st.op][lang()]} ${st.k} (${where})`;
  }

  function beamSVG(frame, fmt, typed) {
    const W = 480,
      H = 230,
      cx = 240,
      beamY = 70;
    const ang = frame.equivalent ? 0 : frame.tilt > 0 ? -9 : frame.tilt < 0 ? 9 : 6;
    const sideFmt = (v) => (typed.some((s) => s === v.n * 1n && v.d === 1n) ? String(v.n) : fmt(v));
    const leftText = sideText(frame.state.left, sideFmt);
    const rightText = sideText(frame.state.right, sideFmt);
    const rad = (ang * Math.PI) / 180;
    const end = (dx) => ({ x: cx + dx * Math.cos(rad), y: beamY + dx * Math.sin(rad) });
    const lp = end(-160),
      rp = end(160);
    const pan = (p, s, fill) =>
      `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${(p.y + 50).toFixed(1)}" stroke="${MUTED}" stroke-width="2"/><rect x="${(p.x - 70).toFixed(1)}" y="${(p.y + 50).toFixed(1)}" width="140" height="46" rx="8" fill="${fill}" stroke="${TEAL}" stroke-width="2"/><text x="${p.x.toFixed(1)}" y="${(p.y + 79).toFixed(1)}" font-size="18" font-weight="700" text-anchor="middle" fill="${INK}">${esc(s)}</text>`;
    const status =
      frame.error === "zero"
        ? lang()
          ? "Ese paso multiplica o divide por 0: no se aplicó."
          : "That step multiplies or divides by 0, so it was not applied."
        : frame.equivalent
          ? frame.solved
            ? lang()
              ? "Resuelto y nivelado."
              : "Solved and level."
            : lang()
              ? "Nivelada: misma solución que el candado."
              : "Level: same solution as the lock."
          : lang()
            ? "Inclinada: un paso cambió solo un lado, así que la solución cambió."
            : "Tipped: a step changed only one side, so the solution changed.";
    const desc = `${leftText} = ${rightText}. ${status}`;
    return `<svg class="eq-beam" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(desc)}"><rect width="${W}" height="${H}" fill="#fff"/><polygon points="${cx},${beamY} ${cx - 26},${H - 12} ${cx + 26},${H - 12}" fill="${LIME}" stroke="${INK}" stroke-width="2"/><line x1="${lp.x.toFixed(1)}" y1="${lp.y.toFixed(1)}" x2="${rp.x.toFixed(1)}" y2="${rp.y.toFixed(1)}" stroke="${frame.equivalent ? INK : ORANGE}" stroke-width="6" stroke-linecap="round" ${frame.equivalent ? "" : 'stroke-dasharray="14 6"'}/>${pan(lp, leftText, "#fff")}${pan(rp, rightText, PEACH)}<text x="${cx}" y="22" font-size="14" font-weight="700" text-anchor="middle" fill="${frame.equivalent ? TEAL : ORANGE}">${esc(frame.equivalent ? "= " + (lang() ? "nivelada" : "level") : "≠ " + (lang() ? "inclinada" : "tipped"))}</text></svg><p class="eq-beam-status ${frame.equivalent ? "eq-ok" : "eq-no"}"><span aria-hidden="true">${frame.equivalent ? "✓" : "!"}</span> ${esc(status)}</p>`;
  }

  function render() {
    if (!host) return;
    const box = host.querySelector("#eq-bal");
    const l = lock();
    if (!l) {
      box.innerHTML = `<p class="muted">${t("noLock")}</p>`;
      return;
    }
    lockId = l.id;
    const fmt = fmtFor();
    const steps = stepsOf(l);
    const frames = timeline(l, steps);
    const at = cursorOf(l);
    const frame = frames[at];
    const typed = [l.p, l.auto ? null : l.q, ...steps.map((s) => s.k)]
      .filter(Boolean)
      .filter((s) => /^\d+$/.test(s))
      .map((s) => BigInt(s));
    const opts = data()
      .locks.map(
        (x, i) =>
          `<option value="${x.id}" ${x.id === l.id ? "selected" : ""}>${lang() ? "Candado" : "Lock"} ${i + 1}: ${esc(lockText(x, x.auto ? fmt(parseQ(x)) : x.q))}</option>`,
      )
      .join("");
    const list = frames
      .slice(1)
      .map((f, i) => {
        const cls = [
          i + 1 === at ? "is-now" : "",
          i + 1 > at ? "is-future" : "",
          f.valid ? "" : "is-invalid",
        ].join(" ");
        const flag = f.valid
          ? ""
          : f.error === "zero"
            ? lang()
              ? " — no se aplicó"
              : " — not applied"
            : lang()
              ? " — ¡solo un lado!"
              : " — one side only!";
        return `<li class="${cls}"><span aria-hidden="true">${f.valid ? SYM[f.step.op] : "!"}</span> ${esc(stepText(f.step) + flag)}${i + 1 === at ? ` <span class="sr-only">${lang() ? "(paso actual)" : "(current step)"}</span>` : ""}</li>`;
      })
      .join("");
    box.innerHTML = `<label for="eq-bal-lock">${t("lock")}</label><select id="eq-bal-lock" data-eq-bal="lock">${opts}</select>${beamSVG(frame, fmt, typed)}
<div class="fd-row" role="group" aria-label="${t("steps")}"><button type="button" class="secondary small" data-eq-bal="rewind" ${at === 0 ? "disabled" : ""}>⏮ ${t("rewind")}</button><button type="button" class="secondary small" data-eq-bal="back" ${at === 0 ? "disabled" : ""}>◀ ${t("back")}</button><button type="button" class="secondary small" data-eq-bal="fwd" ${at >= steps.length ? "disabled" : ""}>${t("fwd")} ▶</button><button type="button" class="secondary small" data-eq-bal="replay" ${steps.length ? "" : "disabled"}>${t("replay")}</button></div>
<h5>${t("steps")} (${at}/${steps.length})</h5><ol class="eq-steps"><li class="${at === 0 ? "is-now" : ""}">${t("start")}: ${esc(lockText(l, l.auto ? fmt(parseQ(l)) : l.q))}</li>${list}</ol>${steps.length ? "" : `<p class="muted">${t("none")}</p>`}
<form class="eq-grid" data-eq-form="step" novalidate><label for="eq-step-op">${t("op")}<select id="eq-step-op">${Object.entries(
      OPS,
    )
      .map(([k, v]) => `<option value="${k}">${SYM[k]} ${v[lang()]}</option>`)
      .join(
        "",
      )}</select></label><label for="eq-step-k">${t("amount")}<input id="eq-step-k" inputmode="decimal" maxlength="9" autocomplete="off"></label><label for="eq-step-side">${t("side")}<select id="eq-step-side"><option value="both">${t("both")}</option><option value="left">${t("left")}</option><option value="right">${t("right")}</option></select></label><button type="submit" class="secondary small">${t("apply")}</button></form>`;
  }
  const parseQ = (l) => parse(l.q);

  function move(to, message) {
    const l = lock();
    if (!l) return;
    cursors.set(l.id, Math.max(0, Math.min(stepsOf(l).length, to)));
    render();
    const f = timeline(l, stepsOf(l))[cursorOf(l)];
    announce(
      message ||
        `${lang() ? "Paso" : "Step"} ${cursorOf(l)}: ${sideText(f.state.left, fmtFor())} = ${sideText(f.state.right, fmtFor())}`,
    );
  }

  function handle(event) {
    const b = event.target.closest?.("[data-eq-bal]");
    if (event.type === "change" && b?.dataset.eqBal === "lock") {
      stop();
      lockId = b.value;
      render();
      return true;
    }
    if (event.type === "submit" && event.target.closest("[data-eq-form='step']")) {
      event.preventDefault();
      stop();
      const l = lock();
      if (!l) return true;
      const k = numText(host.querySelector("#eq-step-k").value);
      if (!k) {
        announce(t("badAmount"));
        return true;
      }
      const at = cursorOf(l);
      if (at >= MAX_STEPS) {
        announce(t("full"));
        return true;
      }
      const step = {
        op: host.querySelector("#eq-step-op").value,
        k,
        side: host.querySelector("#eq-step-side").value,
      };
      edit((d) => {
        d.steps[l.id] = [...(d.steps[l.id] || []).slice(0, at), step];
      });
      cursors.set(l.id, at + 1);
      const f = timeline(l, stepsOf(l))[at + 1];
      const warn =
        f.error === "zero"
          ? lang()
            ? " No se puede multiplicar ni dividir por 0."
            : " You cannot multiply or divide by 0."
          : f.valid
            ? ""
            : lang()
              ? " Cuidado: lo aplicaste a un solo lado y la balanza se inclinó. Regresa un paso y aplícalo a los dos lados."
              : " Careful: you applied it to one side only and the balance tipped. Step back and apply it to both sides.";
      render();
      host.querySelector("#eq-step-k")?.focus();
      announce(
        `${stepText(step)}: ${sideText(f.state.left, fmtFor())} = ${sideText(f.state.right, fmtFor())}.${warn}`,
      );
      return true;
    }
    if (event.type !== "click" || !b) return false;
    const l = lock();
    if (!l) return true;
    const name = b.dataset.eqBal;
    if (name === "lock") return true;
    stop();
    if (name === "rewind") move(0);
    else if (name === "back") move(cursorOf(l) - 1);
    else if (name === "fwd") move(cursorOf(l) + 1);
    else if (name === "replay") {
      if (reduced()) return (move(stepsOf(l).length), true);
      cursors.set(l.id, 0);
      render();
      timer = setInterval(() => {
        if (!host || cursorOf(l) >= stepsOf(l).length) return stop();
        move(cursorOf(l) + 1);
      }, 800);
    }
    return true;
  }

  return {
    html: () =>
      `<section class="eq-panel" aria-labelledby="eq-bal-h"><h4 id="eq-bal-h">${t("title")}</h4><p>${t("intro")}</p><div id="eq-bal" aria-live="off"></div></section>`,
    render,
    handle,
    attach(el) {
      host = el;
    },
    detach() {
      stop();
      host = null;
    },
    /** A lock was removed or the data replaced: forget cursors that no longer exist. */
    reset() {
      stop();
      cursors.clear();
    },
  };
}
