/* ==========================================================================
   Neft Teacher — "Claim Builder" manipulative (self-contained)
   Drop a container on the page:
     <div class="pki-manip" data-manip="claim-builder"
          data-topic="your package design"></div>

   Fills the gap at the JUSTIFY step, which had no interactive model on 21 of
   the 23 project pages. Every project ends by asking the student to defend a
   choice in writing, and that is exactly where Level 0 / Level 1 students
   stall: they have the numbers but not the sentence.

   How it works — Claim / Evidence / Reasoning, assembled not typed blank:
     • CLAIM     pick a sentence frame, fill the blank.
     • EVIDENCE  the widget scans the page for the student's OWN filled-in
                 number inputs and offers each as a tappable chip. Tapping one
                 drops "<label> of <value>" into the evidence line, so the
                 justification cites real work instead of invented numbers.
     • REASONING pick a frame that links the evidence back to the claim.
   A live preview assembles the paragraph; Copy puts it on the clipboard so it
   can be pasted into the project's own response box.

   Deliberately NOT a grader: it never says the argument is right. It only
   makes the student's own numbers easy to quote.
   No dependencies.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-claim-style";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-cb{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-cb h4{margin:0 0 4px;font-size:1.15rem;color:#12355b}" +
      ".pki-cb-sub{margin:0 0 14px;font-size:.9rem;color:#54677c}" +
      ".pki-cb-row{margin-bottom:14px}" +
      ".pki-cb-lab{display:block;font-size:.85rem;font-weight:800;color:#54677c;margin-bottom:6px;text-transform:uppercase;letter-spacing:.03em}" +
      ".pki-cb-sel{width:100%;min-height:44px;padding:8px 10px;border:2px solid #e4ebf2;border-radius:10px;font-size:.98rem;color:#12355b;background:#fff}" +
      ".pki-cb-in{width:100%;min-height:44px;padding:8px 10px;border:2px solid #e4ebf2;border-radius:10px;font-size:1rem;color:#12355b;margin-top:6px}" +
      ".pki-cb-in:focus,.pki-cb-sel:focus{outline:3px solid #1fa6a2;outline-offset:1px}" +
      ".pki-cb-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}" +
      ".pki-cb-chip{min-height:36px;padding:0 12px;border-radius:999px;border:2px solid #1fa6a2;background:#eafaf9;color:#12355b;font-size:.88rem;font-weight:700;cursor:pointer}" +
      ".pki-cb-chip:active{transform:scale(.96)}" +
      ".pki-cb-chip:focus-visible{outline:3px solid #12355b;outline-offset:2px}" +
      ".pki-cb-none{font-size:.85rem;color:#8a97a6;font-style:italic;margin-top:8px}" +
      ".pki-cb-prev{margin-top:6px;padding:12px 14px;border-radius:12px;background:#f4f8fb;border-left:4px solid #1fa6a2;font-size:1rem;line-height:1.6;color:#12355b;min-height:44px}" +
      ".pki-cb-prev em{color:#8a97a6;font-style:italic}" +
      ".pki-cb-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}" +
      ".pki-cb-btn{min-height:44px;padding:0 16px;border-radius:10px;border:2px solid #e4ebf2;background:#fff;color:#12355b;font-weight:800;cursor:pointer}" +
      ".pki-cb-btn.go{background:#1fa6a2;border-color:#1fa6a2;color:#fff}" +
      ".pki-cb-btn:focus-visible{outline:3px solid #12355b;outline-offset:2px}" +
      ".pki-cb-said{font-size:.88rem;color:#17a05f;font-weight:700;margin-top:8px;min-height:1.2em}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  var CLAIMS = [
    "I chose ___ because it was the best option.",
    "My design meets the requirement because ___.",
    "The better buy is ___.",
    "My answer is reasonable because ___.",
    "I would change ___ if I did this again.",
  ];

  var REASONS = [
    "These numbers matter because they show ___.",
    "This proves my claim because ___.",
    "If I had chosen differently, ___ would have happened.",
    "The math backs this up because ___.",
    "Someone might disagree, but ___.",
  ];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* Find the label a student would recognise for an input: its <label>, its
     aria-label, its placeholder, or the nearest preceding text. Falls back to
     the field name so a chip is never blank. */
  function labelFor(input) {
    var id = input.id;
    if (id) {
      var lab = document.querySelector('label[for="' + CSS.escape(id) + '"]');
      if (lab && lab.textContent.trim()) return lab.textContent.trim();
    }
    var wrap = input.closest("label");
    if (wrap && wrap.textContent.trim()) return wrap.textContent.trim();
    if (input.getAttribute("aria-label")) return input.getAttribute("aria-label");
    if (input.placeholder) return input.placeholder;
    return input.name || input.id || "my value";
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var topic = el.dataset.topic || "my project";

    var root = document.createElement("div");
    root.className = "pki-cb";
    root.innerHTML =
      "<h4>Claim Builder — say why your answer works</h4>" +
      '<p class="pki-cb-sub">Build a defence of ' +
      esc(topic) +
      " out of your own numbers. Pick a frame, tap your evidence, then copy it into your answer box.</p>" +
      '<div class="pki-cb-row"><span class="pki-cb-lab">1 · Claim</span>' +
      '<select class="pki-cb-sel" data-k="claim"></select>' +
      '<input class="pki-cb-in" data-k="claimFill" placeholder="Fill in the blank…"></div>' +
      '<div class="pki-cb-row"><span class="pki-cb-lab">2 · Evidence from your work</span>' +
      '<input class="pki-cb-in" data-k="evid" placeholder="Tap a number below, or type your own…">' +
      '<div class="pki-cb-chips"></div><p class="pki-cb-none" hidden>Fill in some numbers on the earlier steps and they will show up here to tap.</p></div>' +
      '<div class="pki-cb-row"><span class="pki-cb-lab">3 · Reasoning</span>' +
      '<select class="pki-cb-sel" data-k="reason"></select>' +
      '<input class="pki-cb-in" data-k="reasonFill" placeholder="Fill in the blank…"></div>' +
      '<span class="pki-cb-lab">Your justification</span>' +
      '<div class="pki-cb-prev" aria-live="polite"></div>' +
      '<div class="pki-cb-acts">' +
      '<button type="button" class="pki-cb-btn go" data-a="copy">Copy it</button>' +
      '<button type="button" class="pki-cb-btn" data-a="refresh">Refresh my numbers</button>' +
      "</div>" +
      '<p class="pki-cb-said" aria-live="polite"></p>';
    el.appendChild(root);

    var selClaim = root.querySelector('[data-k="claim"]');
    var selReason = root.querySelector('[data-k="reason"]');
    CLAIMS.forEach(function (c) {
      var o = document.createElement("option");
      o.textContent = c;
      selClaim.appendChild(o);
    });
    REASONS.forEach(function (r) {
      var o = document.createElement("option");
      o.textContent = r;
      selReason.appendChild(o);
    });

    var chipWrap = root.querySelector(".pki-cb-chips");
    var noneMsg = root.querySelector(".pki-cb-none");
    var evidIn = root.querySelector('[data-k="evid"]');
    var prev = root.querySelector(".pki-cb-prev");
    var said = root.querySelector(".pki-cb-said");

    /* Scan the page for the student's own filled-in values. Only inputs that
       are visible and non-empty, and never our own fields. */
    function scanEvidence() {
      var out = [];
      try {
        var fields = document.querySelectorAll("input[type=number], input[type=text], select");
        for (var i = 0; i < fields.length && out.length < 14; i++) {
          var f = fields[i];
          if (root.contains(f)) continue;
          if (!f.offsetParent && !(f.getClientRects && f.getClientRects().length)) continue;
          var v = (f.value || "").trim();
          if (!v) continue;
          if (v.length > 24) continue;
          out.push({ label: labelFor(f).replace(/\s+/g, " ").slice(0, 42), value: v });
        }
      } catch (_e) {}
      return out;
    }

    function renderChips() {
      var ev = scanEvidence();
      chipWrap.innerHTML = "";
      noneMsg.hidden = ev.length > 0;
      ev.forEach(function (e) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "pki-cb-chip";
        b.textContent = e.label + ": " + e.value;
        b.addEventListener("click", function () {
          var add = e.label + " of " + e.value;
          evidIn.value = evidIn.value.trim() ? evidIn.value.replace(/\s*$/, "") + ", " + add : add;
          render();
          evidIn.focus();
        });
        chipWrap.appendChild(b);
      });
    }

    function fill(frame, text) {
      if (!text || !text.trim()) return frame;
      return frame.replace("___", text.trim());
    }

    function assemble() {
      var claim = fill(selClaim.value, root.querySelector('[data-k="claimFill"]').value);
      var reason = fill(selReason.value, root.querySelector('[data-k="reasonFill"]').value);
      var evid = evidIn.value.trim();
      var parts = [claim];
      if (evid) parts.push("My evidence: " + evid + ".");
      parts.push(reason);
      return parts.join(" ");
    }

    function render() {
      var text = assemble();
      /* Show the unfilled blanks greyed so it is obvious what is still missing
         instead of shipping a sentence with a literal "___" in it. */
      prev.innerHTML = esc(text).replace(/___/g, "<em>___</em>");
    }

    root.addEventListener("input", render);
    root.addEventListener("change", render);

    root.querySelector(".pki-cb-acts").addEventListener("click", function (e) {
      var b = e.target.closest(".pki-cb-btn");
      if (!b) return;
      if (b.dataset.a === "refresh") {
        renderChips();
        said.textContent = "Numbers refreshed.";
        setTimeout(function () {
          said.textContent = "";
        }, 2000);
        return;
      }
      var text = assemble();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () {
              said.textContent = "Copied — paste it into your answer box.";
            },
            function () {
              said.textContent = "Could not copy. Select the text above and copy it.";
            },
          );
        } else {
          said.textContent = "Select the text above and copy it.";
        }
      } catch (_err) {
        said.textContent = "Select the text above and copy it.";
      }
      setTimeout(function () {
        said.textContent = "";
      }, 3500);
    });

    renderChips();
    render();
  }

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(function () {
    document.querySelectorAll('.pki-manip[data-manip="claim-builder"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="claim-builder"]').forEach(init);
    }, 900);
  });

  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["claim-builder"] = init;
  }
})();
