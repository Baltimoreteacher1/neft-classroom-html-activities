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
    "docs",
  ]);
  const ROOT_FILES = ["_headers", "_redirects", "404.html", "robots.txt"];
  // Keep dev artifacts out of the published site: nested .claude/.git/node_modules
  // folders and loose markdown docs (QA reports, READMEs) should never ship.
  const SKIP_COPY_RE =
    /(^|[\\/])\.(claude|git|wrangler)([\\/]|$)|(^|[\\/])node_modules([\\/]|$)|\.md$/i;
  const copyFilter = (src) => !SKIP_COPY_RE.test(src);

  return {
    name: "copy-standalone-html",
    closeBundle() {
      for (const entry of readdirSync(__dirname, { withFileTypes: true })) {
        if (
          !entry.isDirectory() ||
          entry.name.startsWith(".") ||
          SKIP_DIRS.has(entry.name)
        )
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
          cpSync(
            idx,
            resolve(__dirname, "dist", "lessons", "notes-index.html"),
          );
        }
        for (const dir of readdirSync(lessonsDir, { withFileTypes: true })) {
          if (!dir.isDirectory()) continue;
          const notes = resolve(lessonsDir, dir.name, "notes.html");
          if (existsSync(notes)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(notes, resolve(destDir, "notes.html"));
          }
          const homework = resolve(lessonsDir, dir.name, "homework.docx");
          if (existsSync(homework)) {
            const destDir = resolve(__dirname, "dist", "lessons", dir.name);
            mkdirSync(destDir, { recursive: true });
            cpSync(homework, resolve(destDir, "homework.docx"));
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
