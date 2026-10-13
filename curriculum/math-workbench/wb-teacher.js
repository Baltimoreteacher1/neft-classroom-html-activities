/* Math Workbench — Teacher Mode gate (client-side, a classroom deterrent, not security).
 *
 * Reads the SAME sticky flag the lessons and the Curriculum Hub write
 * (`nt-teacher-mode` === "1", set by engine/core/teacher-mode.js when a teacher enters
 * the PIN). It never stores, checks or ships a PIN of its own, so a PIN rotation
 * cannot leave this surface behind. The Live Board worker still requires the
 * host capability token; this gate only keeps the teacher controls out of a
 * student's way on a shared device.
 *
 *   MWBTeacher.isTeacher()           -> boolean
 *   MWBTeacher.require(reason, fn)   -> runs fn() for a teacher, otherwise explains how to unlock
 *   MWBTeacher.calcOff()             -> true when the calculator is switched off
 *   MWBTeacher.setCalcOff(bool)      -> teacher-only; persists on this device
 */
(function (root) {
  "use strict";
  if (root.MWBTeacher) return;

  const FLAG = "nt-teacher-mode";
  const CALC_KEY = "mw_calc_off";
  const listeners = [];

  function isTeacher() {
    try {
      return root.localStorage.getItem(FLAG) === "1";
    } catch (_) {
      return false;
    }
  }

  function el(tag, cls, text) {
    const node = root.document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  let dialog = null;
  function closeDialog() {
    if (!dialog) return;
    dialog.remove();
    dialog = null;
    root.document.removeEventListener("keydown", onKey, true);
  }
  function onKey(event) {
    if (event.key === "Escape") closeDialog();
  }

  /* Explain, in plain words, that this part is for the teacher and how to unlock it. */
  function explain(reason) {
    closeDialog();
    const doc = root.document;
    dialog = el("div", "wbx-gate-bg");
    const card = el("div", "wbx-gate");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "wbxGateTitle");
    const title = el("h2", "", "Teacher tools");
    title.id = "wbxGateTitle";
    card.append(
      title,
      el("p", "", reason || "This part of the Workbench is for the teacher."),
      el(
        "p",
        "wbx-muted",
        "Teachers: open any lesson, choose Teacher Mode and enter the teacher PIN. Then come back to this page.",
      ),
    );
    const row = el("div", "wbx-gate-row");
    const link = el("a", "tbtn solid", "Open the lessons");
    link.href = "/curriculum/units/";
    const ok = el("button", "tbtn", "Close");
    ok.type = "button";
    ok.addEventListener("click", closeDialog);
    row.append(link, ok);
    card.appendChild(row);
    dialog.appendChild(card);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });
    doc.body.appendChild(dialog);
    doc.addEventListener("keydown", onKey, true);
    ok.focus();
  }

  function requireTeacher(reason, fn) {
    if (isTeacher()) {
      if (typeof fn === "function") fn();
      return true;
    }
    explain(reason);
    return false;
  }

  function params() {
    try {
      return new URLSearchParams(root.location.search);
    } catch (_) {
      return new URLSearchParams();
    }
  }

  /* `?calc=off` switches it off for this tab; a teacher can also switch it off on this device. */
  function calcOff() {
    const want = (params().get("calc") || "").toLowerCase();
    if (want === "off") return true;
    if (want === "on") return false;
    try {
      return root.localStorage.getItem(CALC_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function setCalcOff(off) {
    if (!isTeacher()) return false;
    try {
      root.localStorage.setItem(CALC_KEY, off ? "1" : "0");
    } catch (_) {}
    listeners.forEach((fn) => {
      try {
        fn();
      } catch (_) {}
    });
    return true;
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  root.addEventListener("storage", (event) => {
    if (event.key === FLAG || event.key === CALC_KEY) listeners.forEach((fn) => fn());
  });

  root.MWBTeacher = Object.freeze({
    isTeacher,
    require: requireTeacher,
    explain,
    calcOff,
    setCalcOff,
    onChange,
  });
})(window);
