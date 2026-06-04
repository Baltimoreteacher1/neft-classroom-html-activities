# Closed-Loop QA Checklist

Fill this out for any non-trivial change before saying "done." It implements the
**Closed-Loop QA Protocol** in [`/CLAUDE.md`](../CLAUDE.md). Copy the block,
fill it in, and keep the evidence in your final response.

---

## 1. Pre-change risk scan
- [ ] Goal restated in 1–3 lines: ______
- [ ] Files / routes / activities likely affected: ______
- [ ] Likely failure risks identified before editing: ______
- [ ] Confirmed change is minimal and targeted (no broad rewrite)

## 2. Files changed
- [ ] List every file added / modified / deleted:
  - ______

## 3. Build / validate / audit results
- [ ] `npm run validate` → pass / fail: ______
- [ ] `npm run build` (if Vite-built code touched) → pass / fail: ______
- [ ] `npm run audit` (if curriculum/lesson data touched) → pass / fail: ______
- [ ] `node tools/audit-save-resume-integration.js` (if activity state touched)
      → pass / fail: ______
- [ ] Failures looped on and re-run until green (or blocker named): ______

## 4. Browser / smoke test (when relevant)
- [ ] Changed activity `index.html` pages load without fatal console errors
- [ ] `npm run preview` smoke-checked (if a build was produced)
- [ ] Navigation links / lesson hubs / dashboard still resolve

## 5. Student-facing usability check
- [ ] Activities remain usable **without** teacher PINs (unless task requested gating)
- [ ] No teacher keys, answer keys, or dashboards exposed to students unintentionally
- [ ] Save / Resume still works where present

## 6. Deployment-safety check
- [ ] `/assets/shared.css` and shared scripts still resolve
- [ ] No unintended changes to `_headers`, `_redirects`, `wrangler.toml`,
      `vite.config.js` output, `404.html`, or deploy workflow
- [ ] Cloudflare Pages assumptions unchanged (preset / output dir / root)
- [ ] No deploy performed

## 7. Final proof summary
- [ ] What changed: ______
- [ ] Exact commands run: ______
- [ ] Pass/fail results: ______
- [ ] Remaining risks / skipped checks: ______
