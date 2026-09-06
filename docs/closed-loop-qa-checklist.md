# Closed-Loop QA Checklist

Fill this out for any non-trivial change before saying "done." It implements the
Closed-Loop QA Protocol in [`/CLAUDE.md`](../CLAUDE.md). Copy the block, fill it
in, and keep the evidence in your final response.

---

## 1. Pre-change risk scan

- [ ] Goal, in 1–3 lines: ______
- [ ] Files / routes / activities likely affected: ______
- [ ] Failure risks identified before editing: ______
- [ ] Change confirmed minimal and targeted — no broad rewrite

## 2. Files changed

- [ ] Every file added / modified / deleted:
  - ***

## 3. Build / validate / audit

- [ ] `npm run validate` → pass / fail: ______
- [ ] `npm run build` (if Vite-built code touched) → pass / fail: ______
- [ ] `npm run audit` (if curriculum/lesson data touched) → pass / fail: ______
- [ ] `node tools/audit-save-resume-integration.js` (if activity state touched)
      → pass / fail: ______
- [ ] Failures re-run until green, or the blocker named: ______

## 4. Browser / smoke test (when relevant)

- [ ] Changed activity `index.html` pages load with no fatal console errors
- [ ] `npm run preview` smoke-checked, if a build was produced
- [ ] Navigation links, lesson hubs, and dashboard still resolve

## 5. Student-facing usability

- [ ] Activities still work **without** a teacher PIN, unless the task asked for gating
- [ ] No teacher keys, answer keys, or dashboards exposed to students
- [ ] Save / Resume still works where present

## 6. Deployment safety

- [ ] `/assets/shared.css` and shared scripts still resolve
- [ ] No unintended changes to `_headers`, `_redirects`, `wrangler.toml`,
      `vite.config.js` output, `404.html`, or the deploy workflow
- [ ] Cloudflare Pages assumptions unchanged (preset, output dir, root)
- [ ] No deploy performed

## 7. Final proof summary

- [ ] What changed: ______
- [ ] Exact commands run: ______
- [ ] Pass/fail results: ______
- [ ] Remaining risks / skipped checks: ______
