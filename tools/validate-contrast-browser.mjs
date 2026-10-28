#!/usr/bin/env node
// validate:contrast-browser - COMPUTED colour contrast of every lesson, in a real browser.
//
//   npm run build && npx vite preview --port 4603 &
//   node tools/validate-contrast-browser.mjs --base http://localhost:4603 [--lessons 1-1,3-1] [--viewport 390x844]
//
// Judges, on the entry card, the lesson, EVERY sidebar phase, and the warm-up feedback banners
// (a wrong answer and a right one are driven, then the banner text is measured):
//   * text:    WCAG AA 4.5:1, or 3:1 for large text (>= 24px, or >= 18.66px at weight 700+)
//   * non-text UI: 3:1 for the boundary of form fields and custom radio/checkbox marks
// It only judges a SOLID background (translucent layers are composited over the first opaque
// ancestor; an ancestor's opacity scales the layers inside it). Gradients, images and covered
// text are counted as UNJUDGEABLE and reported - never guessed. Disabled controls are exempt
// (WCAG 1.4.3) and counted as such. A glyph with no letter or digit (a rating star, an arrow) is
// a graphic and is held to 3:1. Not judged because nobody can see it: the far face of a flipped
// card, the inside of a closed <details>. Each state is measured after finite CSS animations
// finish, so a half-faded colour is never read as the colour (the first baseline reported
// "Word Wall" at 1.38:1 and 195 phantom horizontal scrolls that way).
// One finding per distinct component (selector + colours) per lesson, not per phase.
import { pathToFileURL } from "node:url";
import { runGates } from "./lib/lesson-gate-kit.mjs";

async function probe(page) {
  return page.evaluate(() => {
    const G = window.__g;
    const res = {
      text: { judged: 0, unjudged: {}, exempt: 0, fails: [] },
      ui: { judged: 0, unjudged: {}, fails: [] },
      feedback: [],
    };
    const bump = (o, k) => {
      o[k] = (o[k] || 0) + 1;
    };
    for (const e of G.textEls()) {
      const s = getComputedStyle(e);
      if (e.closest(":disabled, [aria-disabled=true], fieldset:disabled")) {
        res.text.exempt++;
        continue;
      }
      const fg0 = G.parse(s.color);
      if (!fg0) continue;
      if (s.webkitBackgroundClip === "text" || s.backgroundClip === "text") {
        bump(res.text.unjudged, "clip-text");
        continue;
      }
      if (!G.painted(e)) {
        bump(res.text.unjudged, "obscured");
        continue;
      }
      const bg = G.bgOf(e);
      if (!bg.c) {
        bump(res.text.unjudged, bg.why);
        continue;
      }
      const fg = G.over({ ...fg0, a: fg0.a * bg.op }, bg.c);
      const ratio = G.ratio(fg, bg.c);
      const fs = parseFloat(s.fontSize);
      const large = fs >= 24 || (fs >= 18.66 && +s.fontWeight >= 700);
      // A glyph with no letter or digit in it (a rating star, an arrow, a bullet) is a graphic,
      // not text to read: WCAG 1.4.11 asks 3:1 of it, not 4.5:1.
      const symbol = !/[\p{L}\p{N}]/u.test(G.ownText(e));
      const min = large || symbol ? 3 : 4.5;
      res.text.judged++;
      const group = e.closest(
        ".warmup-fb-box, .problem-check-result, #warmupScoreBadge, .mc-diagnosis",
      );
      if (group) {
        let polarity = "other";
        const gb = G.parse(getComputedStyle(group).backgroundColor);
        if (group.classList.contains("is-correct")) polarity = "correct";
        else if (group.classList.contains("is-incorrect")) polarity = "incorrect";
        else if (gb && gb.a > 0.5)
          polarity = gb.r > gb.g + 8 ? "incorrect" : gb.g > gb.r + 3 ? "correct" : "other";
        res.feedback.push({ polarity, ratio: +ratio.toFixed(2), min, pass: ratio >= min });
      }
      if (ratio < min)
        res.text.fails.push({
          sig: G.sig(e),
          text: G.ownText(e).slice(0, 40),
          ratio: +ratio.toFixed(2),
          min,
          fs,
          fg: G.hex(fg),
          bg: G.hex(bg.c),
          feedback: !!group,
        });
    }
    // Non-text UI: the boundary of a form field / custom control must reach 3:1 against what
    // surrounds it. A text-labelled button is identified by its label (WCAG 1.4.11), so it is
    // not judged here.
    const ctl = [
      ...document.querySelectorAll(
        "input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([type=range]):not([type=submit]):not([type=button]), select, textarea, .custom-radio, .custom-check, [role=radio], [role=checkbox]",
      ),
    ].filter((e) => G.visible(e) && !G.srOnly(e) && !e.disabled);
    for (const e of ctl) {
      const par = e.parentElement ? G.bgOf(e.parentElement) : { c: { r: 255, g: 255, b: 255 } };
      if (!par.c) {
        bump(res.ui.unjudged, par.why);
        continue;
      }
      const s = getComputedStyle(e);
      if (s.backgroundImage && s.backgroundImage !== "none") {
        bump(res.ui.unjudged, "image");
        continue;
      }
      const cands = [];
      for (const side of ["Top", "Right", "Bottom", "Left"]) {
        if (parseFloat(s[`border${side}Width`]) >= 1 && s[`border${side}Style`] !== "none") {
          const c = G.parse(s[`border${side}Color`]);
          if (c && c.a > 0) cands.push(G.ratio(G.over(c, par.c), par.c));
        }
      }
      const bgc = G.parse(s.backgroundColor);
      if (bgc && bgc.a > 0) cands.push(G.ratio(G.over(bgc, par.c), par.c));
      const outline =
        parseFloat(s.outlineWidth) >= 1 && s.outlineStyle !== "none"
          ? G.parse(s.outlineColor)
          : null;
      if (outline) cands.push(G.ratio(G.over(outline, par.c), par.c));
      const best = cands.length ? Math.max(...cands) : 1;
      res.ui.judged++;
      if (best < 3)
        res.ui.fails.push({
          sig: G.sig(e),
          ratio: +best.toFixed(2),
          bg: G.hex(par.c),
          type: e.type || e.getAttribute("role") || e.className,
        });
    }
    res.text.fails = res.text.fails.slice(0, 120);
    res.ui.fails = res.ui.fails.slice(0, 30);
    return res;
  });
}

function judge(records) {
  const findings = [];
  const perLesson = {};
  let judged = 0;
  let unjudged = 0;
  let uiJudged = 0;
  const unj = {};
  const fb = { correct: 0, incorrect: 0, other: 0, fail: 0 };
  const seen = new Set();
  for (const r of records) {
    const pl = (perLesson[r.id] ||= {
      textFails: 0,
      uiFails: 0,
      judged: 0,
      unjudged: 0,
      feedbackFails: 0,
      feedbackJudged: 0,
    });
    for (const st of r.states) {
      const d = st.data["contrast-browser"];
      if (!d || d.probeError) continue;
      judged += d.text.judged;
      pl.judged += d.text.judged;
      uiJudged += d.ui.judged;
      for (const [k, n] of Object.entries(d.text.unjudged)) {
        unj[k] = (unj[k] || 0) + n;
        unjudged += n;
        pl.unjudged += n;
      }
      for (const f of d.feedback) {
        fb[f.polarity]++;
        pl.feedbackJudged++;
        if (!f.pass) {
          fb.fail++;
          pl.feedbackFails++;
        }
      }
      for (const f of d.text.fails) {
        const k = `${r.id}|${f.sig}|${f.fg}|${f.bg}`; // one finding per component per lesson, not per phase
        if (seen.has(k)) continue;
        seen.add(k);
        pl.textFails++;
        findings.push({
          key: `text|${f.sig}|${f.fg}|${f.bg}`,
          lesson: r.id,
          viewport: r.viewport,
          state: st.label,
          detail: `"${f.text}" ${f.ratio}:1 < ${f.min}:1 (${f.fg} on ${f.bg}, ${f.fs}px)${f.feedback ? " [feedback banner]" : ""}`,
        });
      }
      for (const f of d.ui.fails) {
        const k = `${r.id}|ui|${f.sig}`;
        if (seen.has(k)) continue;
        seen.add(k);
        pl.uiFails++;
        findings.push({
          key: `ui|${f.sig}|${f.bg}`,
          lesson: r.id,
          viewport: r.viewport,
          state: st.label,
          detail: `${f.type} boundary ${f.ratio}:1 < 3:1 against ${f.bg}`,
        });
      }
    }
  }
  const guards = [];
  if (judged === 0 && records.length)
    guards.push("judged ZERO text elements: nothing was measured");
  // Feedback states were requested: both polarities must have been seen on a full lesson sweep.
  const tried = records.filter((r) => r.feedback);
  const drove = tried.filter((r) => r.feedback.ok).length;
  if (tried.length && drove / tried.length < 0.8)
    guards.push(`warm-up feedback driven on only ${drove}/${tried.length} lessons (need 80%)`);
  if (tried.length && (fb.correct === 0 || fb.incorrect === 0))
    guards.push(
      `feedback banners judged: correct=${fb.correct} incorrect=${fb.incorrect}; both are required`,
    );
  const total = judged + unjudged;
  return {
    findings,
    guards,
    perLesson,
    stats: {
      textJudged: judged,
      textUnjudgeable: unjudged,
      unjudgeableByReason: unj,
      uiJudged,
      feedback: fb,
    },
    lines: [
      `text elements judged: ${judged}; unjudgeable (not guessed): ${unjudged}${total ? ` = ${((100 * unjudged) / total).toFixed(1)}%` : ""} ${JSON.stringify(unj)}`,
      `non-text UI controls judged: ${uiJudged}`,
      `feedback banners judged (correct/incorrect/other): ${fb.correct}/${fb.incorrect}/${fb.other}, failing ${fb.fail}`,
    ],
  };
}

export const gate = {
  name: "contrast-browser",
  viewports: ["1366x768"],
  feedback: true,
  probe,
  judge,
};
if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(await runGates([gate]));
