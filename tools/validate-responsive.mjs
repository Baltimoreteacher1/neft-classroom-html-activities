#!/usr/bin/env node
// validate:responsive - does the lesson fit the screen it is on, at 360, 768, 1366 and 1440 wide?
//
//   node tools/validate-responsive.mjs --base http://localhost:4603 [--lessons 1-1] [--viewport 360x800]
//
// Per state (entry card, lesson, every phase), from computed geometry only:
//   * HORIZONTAL SCROLL: documentElement.scrollWidth > clientWidth (+1px tolerance).
//   * CLIPPED PRIMARY CONTENT: a text element that STRADDLES the edge of an ancestor that clips
//     (overflow hidden/clip) or the viewport edge with no scroll container in between. Content
//     wholly outside a clip (an off-screen carousel slide) is not clipped, it is hidden on purpose.
//   * TARGET SIZE: every button/link/field is >= 44x44 CSS px of effective hit area (1px tolerance for sub-pixel layout). A control's
//     transparent ::after extender counts (the design system grows .pub-btn that way), a
//     radio/checkbox counts its <label>, an inline link inside running text is exempt (WCAG 2.5.8).
import { pathToFileURL } from "node:url";
import { runGates } from "./lib/lesson-gate-kit.mjs";

async function probe(page) {
  return page.evaluate(() => {
    const G = window.__g;
    const vw = document.documentElement.clientWidth;
    const res = {
      docOverflow: document.documentElement.scrollWidth - vw,
      clipped: [],
      clippedCount: 0,
      small: [],
      smallCount: 0,
      targets: 0,
      exemptInline: 0,
    };
    const scrollsX = (s) => /(auto|scroll)/.test(s.overflowX);
    const clips = (s) => /(hidden|clip)/.test(s.overflowX) || /(hidden|clip)/.test(s.overflowY);
    for (const e of G.textEls()) {
      const r = e.getBoundingClientRect();
      let bad = null;
      let fixedAnc = false;
      let scroller = false;
      for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.position === "fixed") fixedAnc = true;
        if (scrollsX(s) && n !== document.body) {
          // Inside a horizontal scroller (the act step strip): reachable by scrolling, not clipped.
          scroller = true;
          break;
        }
        if (clips(s) && n !== document.body) {
          const a = n.getBoundingClientRect();
          if (a.width < 2 || a.height < 2) break;
          const hx =
            /(hidden|clip)/.test(s.overflowX) && r.right > a.right + 2 && r.left < a.right - 2;
          const hy =
            /(hidden|clip)/.test(s.overflowY) && r.bottom > a.bottom + 3 && r.top < a.bottom - 3;
          if ((hx || hy) && !bad) bad = `${hx ? "x" : "y"} clipped by ${G.sig(n)}`;
        }
      }
      if (!bad && !scroller && !fixedAnc && getComputedStyle(e).position !== "fixed") {
        if ((r.right > vw + 2 && r.left < vw - 2) || (r.left < -2 && r.right > 2)) {
          // Only a defect when the page cannot scroll to it, i.e. nothing above scrolls it.
          bad = "straddles the viewport edge";
        }
      }
      if (bad) {
        res.clippedCount++;
        if (res.clipped.length < 40)
          res.clipped.push({ sig: G.sig(e), text: G.ownText(e).slice(0, 30), why: bad });
      }
    }
    const sel =
      "button, [role=button], [role=tab], a[href], input:not([type=hidden]), select, textarea, summary";
    for (const e of document.querySelectorAll(sel)) {
      if (!G.visible(e)) continue;
      let box = e;
      if (e.matches("input[type=radio], input[type=checkbox]")) {
        const lab =
          e.closest("label") ||
          (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`));
        if (lab) box = lab;
      }
      const r = box.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (G.srOnly(e, e.getBoundingClientRect()) && box === e) continue; // visually hidden helper
      const s = getComputedStyle(e);
      if (s.pointerEvents === "none" || e.disabled) continue;
      // WCAG 2.5.8 inline exception: a control sitting inside a running sentence (a glossary
      // term in a paragraph) is sized by its line, not by the 44px rule.
      if (/^inline/.test(s.display) && e.parentElement) {
        // The sentence is the nearest NON-inline ancestor's own text (the button may sit
        // inside a span that sits inside the paragraph).
        let host = e.parentElement;
        while (host?.parentElement && /^inline/.test(getComputedStyle(host).display))
          host = host.parentElement;
        const sib = [...host.childNodes].some(
          (n) => n.nodeType === 3 && n.textContent.trim().length > 3,
        );
        if (sib) {
          res.exemptInline++;
          continue;
        }
      }
      res.targets++;
      const ps = getComputedStyle(box, "::after");
      const ext = ps.content !== "none" && ps.position === "absolute";
      const effW = Math.max(
        r.width,
        ext ? Math.max(parseFloat(ps.width) || 0, parseFloat(ps.minWidth) || 0) : 0,
      );
      const effH = Math.max(
        r.height,
        ext ? Math.max(parseFloat(ps.height) || 0, parseFloat(ps.minHeight) || 0) : 0,
      );
      if (effW < 43 || effH < 43) {
        res.smallCount++;
        if (res.small.length < 60)
          res.small.push({
            sig: G.sig(e),
            t: (e.innerText || e.getAttribute("aria-label") || e.placeholder || e.type || "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 24),
            w: Math.round(effW),
            h: Math.round(effH),
          });
      }
    }
    return res;
  });
}

function judge(records) {
  const findings = [];
  const perLesson = {};
  const byVp = {};
  let swept = 0;
  const seen = new Set();
  for (const r of records) {
    const pl = ((perLesson[r.id] ||= {})[r.viewport] = {
      overflowStates: 0,
      clipped: 0,
      smallTargets: 0,
      targets: 0,
    });
    const v = (byVp[r.viewport] ||= { states: 0, overflow: 0, clipped: 0, small: 0, targets: 0 });
    for (const st of r.states) {
      const d = st.data.responsive;
      if (!d || d.probeError) continue;
      swept++;
      v.states++;
      v.targets += d.targets;
      pl.targets += d.targets;
      if (d.docOverflow > 1) {
        v.overflow++;
        pl.overflowStates++;
        findings.push({
          key: `h-scroll|${r.viewport}|${st.kind}`,
          lesson: r.id,
          viewport: r.viewport,
          state: st.label,
          detail: `page scrolls sideways by ${d.docOverflow}px`,
        });
      }
      for (const c of d.clipped) {
        const k = `${r.id}|${r.viewport}|${c.sig}|${c.why}`;
        if (seen.has(k)) continue;
        seen.add(k);
        v.clipped++;
        pl.clipped++;
        findings.push({
          key: `clipped|${c.sig}|${c.why.replace(/ by .*/, "")}`,
          lesson: r.id,
          viewport: r.viewport,
          state: st.label,
          detail: `"${c.text}" ${c.why}`,
        });
      }
      for (const c of d.small) {
        const k = `${r.id}|${r.viewport}|t|${c.sig}`;
        if (seen.has(k)) continue;
        seen.add(k);
        v.small++;
        pl.smallTargets++;
        findings.push({
          key: `target<44|${c.sig}`,
          lesson: r.id,
          viewport: r.viewport,
          state: st.label,
          detail: `"${c.t}" is ${c.w}x${c.h}px effective`,
        });
      }
    }
  }
  const guards = [];
  if (swept === 0 && records.length) guards.push("measured ZERO states");
  return {
    findings,
    guards,
    perLesson,
    stats: { byViewport: byVp },
    lines: Object.entries(byVp).map(
      ([vp, v]) =>
        `${vp}: ${v.states} states, h-scroll in ${v.overflow}, clipped text ${v.clipped}, small targets ${v.small} of ${v.targets}`,
    ),
  };
}

export const gate = {
  name: "responsive",
  viewports: ["360x800", "768x1024", "1366x768", "1440x900"],
  probe,
  judge,
};
if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(await runGates([gate]));
