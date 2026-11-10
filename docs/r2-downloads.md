# Lesson downloads in R2 (Pages 20,000-file limit)

Cloudflare Pages refuses a deployment over 20,000 files. `lessons/<id>/downloads/**` is 6,504 files
(219 MB), so those `.docx/.pdf/.pptx/.xlsx/.zip` files can live in the R2 bucket `eduwonderlab-downloads`
(binding `DOWNLOADS`, declared in `wrangler.toml`) while every URL keeps answering with the same bytes.

## How it works
- `functions/lessons/[[path]].js` — runs after `functions/_middleware.js` (so teacher-only downloads stay gated).
  Static asset first; only on a 404 for a `/lessons/<id>/downloads/*.(docx|pdf|pptx|xlsx|zip)` path does it read R2
  (GET/HEAD, ETag/304, Range/206).
- `tools/upload-downloads-to-r2.mjs` — uploads changed files, records `{sha256,size}` per key in
  `data/r2-offload-manifest.json` (never published: omitted in `scripts/lib/copy-filter.mjs`).
- `tools/offload-dist-downloads.mjs` — build step. Drops a file from `dist/` ONLY when the manifest lists it with the
  same sha256. No manifest = nothing dropped = today's build. An edited file stays in `dist/` (static wins) and warns.
- `validate:resource-baseline` counts a manifest key as resolved. `tools/offload-dist-downloads.test.mjs` pins that
  the Function and the build agree on which paths are offloadable.

## Cutover (order matters — wrong order = downloads 404)
1. Merge/ship the branch. Nothing changes yet (no manifest).
2. `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… node tools/upload-downloads-to-r2.mjs` (token: Workers R2 Storage: Edit;
   or `npx wrangler login` first). Resumable. Then `node tools/upload-downloads-to-r2.mjs --verify`.
3. Commit `data/r2-offload-manifest.json`, ship. dist/ drops to ~13,200 files.
4. After any edit to a lesson download: re-run the upload, commit the manifest.

Rollback: delete the manifest and ship — the files return to `dist/`.
