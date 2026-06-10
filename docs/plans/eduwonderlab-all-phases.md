# EduWonderLab — All Phases Implementation Plan

## Phase A — Quick wins ✅

1. **Student progress sync to D1** (`neft-school-hub-api`)
   - Migration `003_curriculum_progress.sql`
   - Public routes: `GET/POST /api/curriculum/progress`, `GET /api/curriculum/progress/summary`
   - Client bridge: `assets/curriculum-progress-bridge.js` + hub wiring in `curriculum-enhancements.js`
   - Lesson engine re-enabled sync via `engine/core/state.js` (uses pseudonymous `student_key`)

2. **Curriculum MiniSearch** (`neft-classroom-html-activities`)
   - Build script: `scripts/generate-curriculum-search-index.mjs`
   - Output: `data/curriculum-search-index.json`
   - Hub search uses MiniSearch when index loaded; substring fallback for 1-char queries

## Phase B — Standards + dashboard ✅

3. **Per-lesson standards tags**
   - Source: `data/curriculum-manifest.json` (`standard` per lesson)
   - UI: CCSS badge on lesson cards + search results in `curriculum-enhancements.js`

4. **Teacher dashboard lite**
   - `teacher-tools/curriculum-dashboard/index.html`
   - Calls `/api/curriculum/progress/summary` (roster, completion %, last activity)

## Phase C — D1 curriculum migration ✅

5. **Full D1 curriculum**
   - Migration `004_curriculum_content.sql`
   - Public read: `GET /api/curriculum/content?tenant_id=&course=grade6-math`
   - Seed script: `scripts/migrate-curriculum-to-d1.mjs`
   - Optional hub loader: `assets/curriculum-api-loader.js` (set `window.CURRICULUM_SYNC.useApiContent = true`)

Static HTML curriculum remains the default fallback until API content is seeded and flag enabled.

## Deploy

### API (`neft-school-hub-api`)
```bash
npm run db:migrate:progress        # remote D1
npm run db:migrate:content         # remote D1 (Phase C schema)
npm run db:seed:curriculum:remote  # after manifest path is correct
npm run deploy
```

### Classroom (`neft-classroom-html-activities`)
```bash
npm install
npm run build
npm run deploy
```
