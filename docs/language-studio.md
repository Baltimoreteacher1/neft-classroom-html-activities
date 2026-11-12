# Language Studio (`/language-studio/`)

The Language Studio is the 18-case rebuild of The Language Page: nine worlds with two cases each, six untimed arcade games, twelve studios, a passport, and teacher notes. It is a Next.js static export mounted next to the older Language Adventures app (`/language-adventures/`). Both are served on thelanguagepage.com and eduwonderlab.com.

It does **not** replace Language Adventures. That app still has Families, Help, Press & Story Worlds, Mystery Club, the Mystery Files and Science City worlds and the 16 sprints, and its source is no longer on disk (only the export in `language-adventures/`).

## Shared storage

Both apps write `thelanguagepage:universe:v1` and `thelanguagepage:studios:v1`, with different field shapes. The Studio keeps everything it owns in a `studio` field of each object and never rewrites any other field (`lib/storage.ts` in the source). On first load it seeds language, text size and grade band from the older app's fields. Recordings use their own IndexedDB database. The Studio never reads or writes `accessPracticeLab:v1`. Home languages are English and Spanish only, and student tasks stay in English.

## Source and republishing

The source is a separate Next project, not part of this repo. It is backed up in the private GitHub repo `Baltimoreteacher1/neft-language-studio` (one snapshot commit; GitHub blocks pushes that carry Joel's private email, so the history is not there). The working copy is `~/the-language-page` (local git, branch `integrate`, with the full history including the Cursor session commits), and a bundle of that history is in `~/Documents/language-studio-source/`. After a change, push a new snapshot: `git commit-tree 'integrate^{tree}' -p <previous snapshot>` with the noreply author, then `git push origin <sha>:refs/heads/main`. `next.config.ts` there sets `output: "export"`, `basePath: "/language-studio"` and `trailingSlash: true`.

```bash
cd ~/the-language-page && npm ci && npm test && npm run validate && npm run build
cd <classroom worktree>
node tools/sync-static-apps.mjs --app language-studio=$HOME/the-language-page
npm run generate-catalog && npm run generate-plan-vocab
node scripts/generate-intro-guide.mjs --only=directory   # site-directory.pdf/.docx list every site-map page
node tools/sync-static-apps.mjs --check
```

Then ship with `ALLOW_DEPLOY=1 npm run ship -- <sha>` after Joel authorizes it.

## Open items

- The Spanish lines are unreviewed by a native speaker: `docs/language-studio-spanish-review.md`.
- `/language-adventures/` logs a React #418 hydration warning on every load. It is in the exported app itself and has no visible effect (React re-renders on the client). A fix needs that app's source.
- The two apps overlap (worlds, arcade, studios). Decide later whether to keep both, merge the new cases into one, or retire one.
