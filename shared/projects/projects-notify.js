/* ==========================================================================
   Neft Teacher — Projects NOTIFY layer (Shared)
   Accessible, non-blocking replacements for the browser's native
   alert() / confirm() / prompt() on the culminating projects and post-test
   project pages. Native dialogs freeze the page, steal focus, cannot be
   styled or translated, and on Chromebooks often look like an error.

   window.NTNotify:
     toast(msg, { tone })        Info/success/error message in ONE shared
                                 role="status" aria-live="polite" region.
                                 tone: "info" (default) | "success" | "error".
     fix(msg, { anchor, focus }) Validation message shown INLINE next to the
                                 control (anchor defaults to the control the
                                 student just used). Also wired to the
                                 control's aria-describedby. `focus` = element
                                 to move focus to (e.g. the empty input).
     confirm(msg, opts) -> Promise<boolean>
                                 In-page modal <dialog> for guarding
                                 destructive actions. Focus starts on Cancel,
                                 Escape cancels, focus returns to the opener.
                                 opts: { title, confirmLabel, cancelLabel }.
     copyText(text, opts) -> Promise<boolean>
                                 Copy to the clipboard; when the clipboard is
                                 unavailable, show the text in a dialog with it
                                 pre-selected so the student can copy by hand.
     t(en, es)                   Pick the English or Spanish string from the
                                 page's current language (body.es / lang="es").
     clear(anchor?)              Remove inline fix message(s).
   Self-contained: injects its own styles. Idempotent. No dependencies.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof window === "undefined" || typeof document === "undefined") return;
  /** @type {any} */
  var W = window;
  if (W.NTNotify && W.NTNotify.__v) return;

  var STYLE_ID = "ntn-styles";
  var REGION_ID = "ntn-toast-region";
  var CONTROL_SEL = 'button, a[href], input, select, textarea, summary, [role="button"]';
  var lastControl = null;
  var inlineSeq = 0;
  /** inline message element -> the control it describes */
  var anchors = new WeakMap();

  function isSpanish() {
    var b = document.body;
    if (b && (b.classList.contains("es") || b.classList.contains("lang-es"))) return true;
    var html = document.documentElement;
    if (html && /^es\b/i.test(html.getAttribute("lang") || "")) return true;
    if (html && html.classList.contains("es")) return true;
    return false;
  }

  function t(en, es) {
    return isSpanish() && es ? es : en;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      "#" +
      REGION_ID +
      "{position:fixed;top:12px;left:50%;transform:translateX(-50%);" +
      "z-index:2147483000;display:flex;flex-direction:column;align-items:center;gap:8px;" +
      "width:min(92vw,30rem);pointer-events:none;margin:0;padding:0}" +
      ".ntn-toast{pointer-events:auto;display:flex;align-items:flex-start;gap:10px;width:100%;" +
      "box-sizing:border-box;padding:12px 8px 12px 16px;border-radius:12px;background:#1e293b;" +
      "color:#fff;font:600 16px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
      "box-shadow:0 10px 30px rgba(15,23,42,.35);border-left:6px solid #60a5fa;" +
      "white-space:pre-line;overflow-wrap:anywhere;opacity:0;transform:translateY(-6px);" +
      "transition:opacity .18s ease,transform .18s ease}" +
      ".ntn-toast.ntn-in{opacity:1;transform:none}" +
      ".ntn-toast[data-tone=success]{border-left-color:#4ade80}" +
      ".ntn-toast[data-tone=error]{border-left-color:#f87171}" +
      ".ntn-toast-msg{flex:1;padding-top:2px}" +
      ".ntn-x{flex:none;min-width:44px;min-height:44px;margin:-10px 0 -10px;border:0;" +
      "border-radius:10px;background:transparent;color:#fff;font:700 22px/1 system-ui,sans-serif;cursor:pointer}" +
      ".ntn-x:hover{background:rgba(255,255,255,.12)}" +
      ".ntn-x:focus-visible,.ntn-btn:focus-visible,.ntn-text:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}" +
      ".ntn-inline{display:block;box-sizing:border-box;max-width:100%;margin:8px 0;padding:10px 14px;" +
      "border-radius:10px;border:2px solid #b45309;background:#fffbeb;color:#78350f;" +
      "font:600 16px/1.45 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;white-space:pre-line;" +
      "overflow-wrap:anywhere;text-align:left}" +
      ".ntn-inline:empty{display:none}" +
      ".ntn-dialog{box-sizing:border-box;position:fixed;inset:0;margin:auto;height:fit-content;width:min(92vw,28rem);max-height:86vh;overflow:auto;border:0;border-radius:16px;" +
      "padding:22px 22px 18px;background:#fff;color:#0f172a;box-shadow:0 24px 60px rgba(15,23,42,.4);" +
      "font:400 17px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}" +
      ".ntn-dialog::backdrop{background:rgba(15,23,42,.55)}" +
      ".ntn-dialog h2{margin:0 0 8px;font-size:20px;line-height:1.3}" +
      ".ntn-dialog p{margin:0 0 16px;white-space:pre-line}" +
      ".ntn-text{display:block;box-sizing:border-box;width:100%;min-height:9rem;margin:0 0 16px;padding:10px;" +
      "border:2px solid #94a3b8;border-radius:10px;font:15px/1.4 ui-monospace,Menlo,Consolas,monospace;" +
      "color:#0f172a;background:#f8fafc;resize:vertical}" +
      ".ntn-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px}" +
      ".ntn-btn{min-height:44px;min-width:96px;padding:10px 18px;border-radius:10px;border:2px solid #334155;" +
      "background:#fff;color:#0f172a;font:700 16px/1.2 system-ui,sans-serif;cursor:pointer}" +
      ".ntn-btn-danger{background:#b91c1c;border-color:#b91c1c;color:#fff}" +
      ".ntn-btn-primary{background:#1d4ed8;border-color:#1d4ed8;color:#fff}" +
      "@media (prefers-reduced-motion: reduce){.ntn-toast{transition:none}}" +
      "html.calm-motion .ntn-toast,body.calm-motion .ntn-toast{transition:none}";
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function region() {
    var r = document.getElementById(REGION_ID);
    if (r) return r;
    injectStyles();
    r = document.createElement("div");
    r.id = REGION_ID;
    r.setAttribute("role", "status");
    r.setAttribute("aria-live", "polite");
    r.setAttribute("aria-atomic", "false");
    document.body.appendChild(r);
    return r;
  }

  function trackControl(e) {
    var el = e.target && e.target.closest ? e.target.closest(CONTROL_SEL) : null;
    if (el && !el.closest(".ntn-dialog, #" + REGION_ID)) lastControl = el;
  }
  document.addEventListener("pointerdown", trackControl, true);
  document.addEventListener("click", trackControl, true);
  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key === "Enter" || e.key === " ") trackControl(e);
    },
    true,
  );

  function toast(msg, opts) {
    opts = opts || {};
    if (!document.body) return;
    clear();
    var tone = opts.tone === "success" || opts.tone === "error" ? opts.tone : "info";
    var r = region();
    var item = document.createElement("div");
    item.className = "ntn-toast";
    item.setAttribute("data-tone", tone);
    var text = document.createElement("div");
    text.className = "ntn-toast-msg";
    var x = document.createElement("button");
    x.type = "button";
    x.className = "ntn-x";
    x.setAttribute("aria-label", t("Dismiss message", "Cerrar mensaje"));
    x.textContent = "×";
    item.appendChild(text);
    item.appendChild(x);
    while (r.children.length >= 3) r.removeChild(r.firstChild);
    r.appendChild(item);
    // Set text after insertion so screen readers announce the change.
    setTimeout(function () {
      text.textContent = String(msg == null ? "" : msg);
      item.classList.add("ntn-in");
    }, 30);
    var str = String(msg == null ? "" : msg);
    var ms = Math.min(12000, (tone === "info" ? 3500 : 6000) + str.length * 45);
    var timer = setTimeout(remove, ms);
    function remove() {
      clearTimeout(timer);
      if (item.parentNode) item.parentNode.removeChild(item);
    }
    x.addEventListener("click", remove);
    return item;
  }

  // Inline containers that lay children out in a row would squeeze the message
  // in beside the button; place it after that row instead.
  function insertionPoint(anchor) {
    var node = anchor;
    for (var i = 0; i < 3 && node.parentElement && node.parentElement !== document.body; i++) {
      var display = window.getComputedStyle(node.parentElement).display || "";
      if (!/flex|grid|inline|table-cell/.test(display)) break;
      node = node.parentElement;
    }
    return node;
  }

  function fix(msg, opts) {
    opts = opts || {};
    var anchor = opts.anchor || lastControl || document.activeElement;
    if (!anchor || anchor === document.body || !anchor.isConnected) {
      toast(msg, { tone: "error" });
      return null;
    }
    injectStyles();
    clear(anchor);
    var id = "ntn-fix-" + ++inlineSeq;
    var p = document.createElement("p");
    p.className = "ntn-inline";
    p.id = id;
    p.setAttribute("role", "status");
    p.setAttribute("aria-live", "polite");
    p.setAttribute("data-ntn-for", "");
    anchors.set(p, anchor);
    var spot = insertionPoint(anchor);
    spot.parentNode.insertBefore(p, spot.nextSibling);
    var described = (anchor.getAttribute("aria-describedby") || "").trim();
    anchor.setAttribute("aria-describedby", (described ? described + " " : "") + id);
    setTimeout(function () {
      p.textContent = "⚠️ " + String(msg == null ? "" : msg);
    }, 30);
    if (opts.focus && typeof opts.focus.focus === "function") {
      try {
        opts.focus.focus({ preventScroll: false });
      } catch (_e) {
        opts.focus.focus();
      }
    }
    return p;
  }

  function clear(anchor) {
    var list = document.querySelectorAll(".ntn-inline[data-ntn-for]");
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var a = anchors.get(p);
      if (anchor && a !== anchor) continue;
      if (a && a.getAttribute) {
        var ids = (a.getAttribute("aria-describedby") || "").split(/\s+/).filter(function (x) {
          return x && x !== p.id;
        });
        if (ids.length) a.setAttribute("aria-describedby", ids.join(" "));
        else a.removeAttribute("aria-describedby");
      }
      if (p.parentNode) p.parentNode.removeChild(p);
    }
  }

  // Builds a modal <dialog>; `body` fills it. Resolves with the returnValue.
  function openDialog(build, labelledText) {
    injectStyles();
    var opener = /** @type {HTMLElement | null} */ (document.activeElement);
    var dlg = document.createElement("dialog");
    dlg.className = "ntn-dialog";
    var n = ++inlineSeq;
    dlg.setAttribute("aria-labelledby", "ntn-dlg-title-" + n);
    dlg.setAttribute("aria-describedby", "ntn-dlg-desc-" + n);
    var h = document.createElement("h2");
    h.id = "ntn-dlg-title-" + n;
    h.textContent = labelledText;
    dlg.appendChild(h);
    var initialFocus = build(dlg, n);
    document.body.appendChild(dlg);
    return new Promise(function (resolve) {
      dlg.addEventListener("close", function () {
        var value = dlg.returnValue;
        if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
        if (opener && opener.isConnected && typeof opener.focus === "function") {
          try {
            opener.focus();
          } catch (_e) {
            /* ignore */
          }
        }
        resolve(value);
      });
      // Escape fires "cancel" then "close" with an empty returnValue.
      dlg.addEventListener("cancel", function () {
        dlg.returnValue = "cancel";
      });
      dlg.returnValue = "";
      dlg.showModal();
      if (initialFocus) {
        initialFocus.focus();
        // A manual-copy textarea opens with its text already selected.
        if (initialFocus instanceof HTMLTextAreaElement) initialFocus.select();
      }
    });
  }

  function makeButton(label, value, cls, dlg) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ntn-btn" + (cls ? " " + cls : "");
    b.textContent = label;
    b.addEventListener("click", function () {
      dlg.close(value);
    });
    return b;
  }

  function confirmDialog(msg, opts) {
    opts = opts || {};
    if (typeof window.HTMLDialogElement !== "function") {
      // Pre-2022 browsers without <dialog>: keep the destructive-action guard.
      return Promise.resolve(window.confirm(String(msg)));
    }
    return openDialog(function (dlg, n) {
      var p = document.createElement("p");
      p.id = "ntn-dlg-desc-" + n;
      p.textContent = String(msg == null ? "" : msg);
      dlg.appendChild(p);
      var row = document.createElement("div");
      row.className = "ntn-actions";
      var cancel = makeButton(opts.cancelLabel || t("Cancel", "Cancelar"), "cancel", "", dlg);
      var ok = makeButton(
        opts.confirmLabel || t("Yes, continue", "Sí, continuar"),
        "confirm",
        opts.danger === false ? "ntn-btn-primary" : "ntn-btn-danger",
        dlg,
      );
      row.appendChild(cancel);
      row.appendChild(ok);
      dlg.appendChild(row);
      return cancel;
    }, opts.title || t("Are you sure?", "¿Estás seguro?")).then(function (value) {
      return value === "confirm";
    });
  }

  function showTextDialog(text, opts) {
    opts = opts || {};
    if (typeof window.HTMLDialogElement !== "function") {
      toast(t("Select the text on the page and copy it.", "Selecciona el texto y cópialo."));
      return Promise.resolve(false);
    }
    return openDialog(function (dlg, n) {
      var p = document.createElement("p");
      p.id = "ntn-dlg-desc-" + n;
      p.textContent =
        opts.hint ||
        t(
          "Copy did not work automatically. The text is selected: press Ctrl+C (or ⌘+C) to copy it.",
          "No se pudo copiar automáticamente. El texto está seleccionado: presiona Ctrl+C (o ⌘+C) para copiarlo.",
        );
      dlg.appendChild(p);
      var ta = document.createElement("textarea");
      ta.className = "ntn-text";
      ta.readOnly = true;
      ta.value = String(text == null ? "" : text);
      ta.setAttribute("aria-label", opts.title || t("Text to copy", "Texto para copiar"));
      dlg.appendChild(ta);
      var row = document.createElement("div");
      row.className = "ntn-actions";
      row.appendChild(makeButton(t("Done", "Listo"), "done", "ntn-btn-primary", dlg));
      dlg.appendChild(row);
      return ta;
    }, opts.title || t("Copy your report", "Copia tu informe")).then(function () {
      return false;
    });
  }

  function copyText(text, opts) {
    opts = opts || {};
    var str = String(text == null ? "" : text);
    var done = function () {
      toast(opts.message || t("Copied to clipboard!", "¡Copiado al portapapeles!"), {
        tone: "success",
      });
      return true;
    };
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        return navigator.clipboard.writeText(str).then(done, function () {
          return showTextDialog(str, opts);
        });
      }
    } catch (_e) {
      /* fall through to the manual-copy dialog */
    }
    return showTextDialog(str, opts);
  }

  W.NTNotify = {
    __v: 1,
    toast: toast,
    fix: fix,
    clear: clear,
    confirm: confirmDialog,
    copyText: copyText,
    t: t,
  };
})();
