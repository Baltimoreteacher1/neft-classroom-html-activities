import { defineConfig } from "vite";
import { resolve } from "path";
import { readdirSync, existsSync, cpSync, mkdirSync } from "fs";

function getLessonEntries() {
  const lessonsDir = resolve(__dirname, "lessons");
  const entries = {};
  if (!existsSync(lessonsDir)) return entries;
  for (const dir of readdirSync(lessonsDir, { withFileTypes: true })) {
    if (!dir.isDirectory() || dir.name.startsWith("_")) continue;
    const html = resolve(lessonsDir, dir.name, "index.html");
    if (existsSync(html)) {
      entries[`lesson-${dir.name}`] = html;
    }
  }
  return entries;
}

function copyStandaloneHtml() {
  const SKIP_DIRS = new Set([
    "node_modules",
    "dist",
    ".git",
    ".github",
    ".claude",
    ".wrangler",
    "engine",
    "lessons",
    "scripts",
    "tools",
    "docs",
    "night-shift",
  ]);
  const ROOT_FILES = ["_headers", "_redirects", "404.html", "robots.txt", "sitemap.xml"];
  // Keep dev artifacts out of the published site: nested .claude/.git/node_modules
  // folders and loose markdown docs (QA reports, READMEs) should never ship.
  const SKIP_COPY_RE =
    /(^|[\\/])\.(claude|git|wrangler|ruff_cache)([\\/]|$)|(^|[\\/])(node_modules|_engine)([\\/]|$)|\.md$/i;
  const copyFilter = (src) => !SKIP_COPY_RE.test(src);

  return {
    name: "copy-standalone-html",
    closeBundle() {
      for (const entry of readdirSync(__dirname, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith(".") || SKIP_DIRS.has(entry.name))
          continue;
        const src = resolve(__dirname, entry.name);
        const dest = resolve(__dirname, "dist", entry.name);
        mkdirSync(dest, { recursive: true });
        cpSync(src, dest, { recursive: true, filter: copyFilter });
      }
      for (const file of ROOT_FILES) {
        const src = resolve(__dirname, file);
        const dest = resolve(__dirname, "dist", file);
        if (existsSync(src)) cpSync(src, dest);
      }
      // lessons/ is skipped above (its index.html files are Rollup entries), but
      // the generated guided-notes are plain static HTML that must be copied.
      const lessonsDir = resolve(__dirname, "lessons");
      if (existsSync(lessonsDir)) {
        const idx = resolve(lessonsDir, "notes-index.html");
        if (existsSync(idx)) {
          mkdirSync(resolve(__dirname, "dist", "lessons"), { recursive: true });
          cpSync(idx, resolve(__dirname, "dist", "lessons", "notes-index.html"));
        }
        for (const dir of readdirSync(lessonsDir, { withFileTypes: true })) {
          if (!dir.isDirectory()) continue;
          const notes = resolve(lessonsDir, dir.name, "notes.html");
          if (existsSync(notes)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(notes, resolve(destDir, "notes.html"));
          }
          // Generated "Learn It" teaching page (concept explanation + worked
          // example), surfaced as the 📖 Learn It tab in the lesson shell.
          const learn = resolve(lessonsDir, dir.name, "learn.html");
          if (existsSync(learn)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(learn, resolve(destDir, "learn.html"));
          }
          // Generated "Vocab" page (word + meaning + picture), surfaced as the
          // 🔑 Vocab sidebar tab.
          const vocab = resolve(lessonsDir, dir.name, "vocab.html");
          if (existsSync(vocab)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(vocab, resolve(destDir, "vocab.html"));
          }
          // Teacher copy of the guided notes (includes the Answer Key &
          // Teacher Guide). Linked from the teacher notes index, not the
          // student-facing curriculum hub.
          const notesTeacher = resolve(lessonsDir, dir.name, "notes-teacher.html");
          if (existsSync(notesTeacher)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(notesTeacher, resolve(destDir, "notes-teacher.html"));
          }
          const slides = resolve(lessonsDir, dir.name, "slides.html");
          if (existsSync(slides)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(slides, resolve(destDir, "slides.html"));
          }
          const slidesPptx = resolve(lessonsDir, dir.name, "slides.pptx");
          if (existsSync(slidesPptx)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(slidesPptx, resolve(destDir, "slides.pptx"));
          }
          // Generated "Editable Slides" launcher page (PPTX download +
          // Google Slides upload path + browser present) — npm run
          // generate-editable-slides. Linked from the curriculum hub.
          const editableSlides = resolve(lessonsDir, dir.name, "editable-slides.html");
          if (existsSync(editableSlides)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(editableSlides, resolve(destDir, "editable-slides.html"));
          }
          const homework = resolve(lessonsDir, dir.name, "homework.docx");
          if (existsSync(homework)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(homework, resolve(destDir, "homework.docx"));
          }
          const familyHomework = resolve(lessonsDir, dir.name, "homework.html");
          if (existsSync(familyHomework)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(familyHomework, resolve(destDir, "homework.html"));
          }
          const handout = resolve(lessonsDir, dir.name, "handout.html");
          if (existsSync(handout)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(handout, resolve(destDir, "handout.html"));
          }
          // Per-lesson 2-version practice worksheet (Version A support /
          // Version B on-level + answer keys), linked from the curriculum hub.
          const worksheet = resolve(lessonsDir, dir.name, "worksheet.html");
          if (existsSync(worksheet)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(worksheet, resolve(destDir, "worksheet.html"));
          }
          const configJson = resolve(lessonsDir, dir.name, "config.json");
          if (existsSync(configJson)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(configJson, resolve(destDir, "config.json"));
          }
          // Downloadable notes packets (self-contained HTML, PDF, DOCX) live in
          // lessons/<id>/downloads/ and are linked from each notes.html.
          const downloads = resolve(lessonsDir, dir.name, "downloads");
          if (existsSync(downloads)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name, "downloads");
            mkdirSync(destDir, { recursive: true });
            cpSync(downloads, destDir, { recursive: true });
          }
          // Readiness pre-lesson (static index.html + printable practice.docx)
          // lives in lessons/<id>/readiness/ and is linked from the lesson.
          const readiness = resolve(lessonsDir, dir.name, "readiness");
          if (existsSync(readiness)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name, "readiness");
            mkdirSync(destDir, { recursive: true });
            cpSync(readiness, destDir, { recursive: true });
          }
          // Reveal-deck assets (e.g. Notice & Wonder data graphic) referenced by
          // config.noticeAndWonder / config.revealWordProblem image fields.
          const revealAssets = resolve(lessonsDir, dir.name, "reveal-assets");
          if (existsSync(revealAssets)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name, "reveal-assets");
            mkdirSync(destDir, { recursive: true });
            cpSync(revealAssets, destDir, { recursive: true });
          }
          // Generated lesson support pages (static index.html folders) linked
          // from the curriculum hub: family / teacher-notes / student-help.
          for (const sub of ["family", "teacher-notes", "student-help"]) {
            const supportDir = resolve(lessonsDir, dir.name, sub);
            if (existsSync(supportDir)) {
              const destDir = resolve(__dirname, "dist", "lessons", dir.name, sub);
              mkdirSync(destDir, { recursive: true });
              cpSync(supportDir, destDir, { recursive: true });
            }
          }
          // CardForge lesson bundles (interactive.html, activity-pack.html, sub-packet.html).
          // Teacher/internal markdown (answer-key.md, teacher-guide.md,
          // exit-ticket.md, reports) must NOT ship — any student with the URL
          // could read the answer key. student-practice.md is the one .md
          // students are actually linked to (bundle card-buttons.json), so it
          // stays.
          const bundleDir = resolve(lessonsDir, dir.name, "bundle");
          if (existsSync(bundleDir)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name, "bundle");
            mkdirSync(destDir, { recursive: true });
            cpSync(bundleDir, destDir, {
              recursive: true,
              filter: (src) => !/\.md$/i.test(src) || /student-practice\.md$/i.test(src),
            });
          }
        }
      }

      // --- Fail-safe: verify the critical shared runtime assets landed. -------
      // Every hub (curriculum, monster-math, …) loads these committed static
      // scripts. If the copy above silently omits their top-level dir — e.g. a
      // freshly-created deploy worktree whose git checkout hasn't fully settled
      // when readdirSync(__dirname) runs — the published dist/ is incomplete and
      // the hubs render blank. Re-copy their dirs on miss, then FAIL LOUDLY
      // rather than shipping a broken bundle (a silent incomplete dist is far
      // worse than a build error the deploy can retry).
      const CRITICAL_ASSETS = [
        "assets/neft-theme.js",
        "assets/nt-page-enhance.js",
        "shared/save-resume/save-resume-engine.js",
      ];
      const missingCritical = () =>
        CRITICAL_ASSETS.filter(
          (rel) =>
            existsSync(resolve(__dirname, rel)) && // present in source…
            !existsSync(resolve(__dirname, "dist", rel)), // …but not copied to dist
        );
      for (let attempt = 1; attempt <= 3; attempt++) {
        const missing = missingCritical();
        if (!missing.length) break;
        if (attempt === 3) {
          throw new Error(
            "copy-standalone-html: incomplete build — shared runtime assets are " +
              "present in source but missing from dist/ after 3 copy attempts: " +
              missing.join(", ") +
              ". Aborting so an incomplete bundle is not published.",
          );
        }
        for (const top of new Set(missing.map((rel) => rel.split("/")[0]))) {
          const src = resolve(__dirname, top);
          const dest = resolve(__dirname, "dist", top);
          if (existsSync(src)) {
            mkdirSync(dest, { recursive: true });
            cpSync(src, dest, { recursive: true, filter: copyFilter });
          }
        }
      }
    },
  };
}

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        ...getLessonEntries(),
      },
    },
    assetsInlineLimit: 100000,
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      "@engine": resolve(__dirname, "engine"),
      "@lessons": resolve(__dirname, "lessons"),
    },
  },
  plugins: [copyStandaloneHtml()],
});
