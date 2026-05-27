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
  const standaloneDirs = [
    "pre-test",
    "post-test",
    "games",
    "blood-on-the-river",
    "correlation-playground",
    "dashboard",
    "ecology-noam",
    "esol",
    "esol-reading-writing",
    "expressions-equations",
    "fix-it-design-challenge",
    "forecast-engine",
    "fractions-soccer",
    "geometry-prep",
    "math",
    "mcap-review",
    "neft-data-studio",
    "Noam School",
    "noam-bar-mitzvah",
    "noam-school",
    "noam-school-v10",
    "number-system",
    "practice",
    "practice-engine",
    "ratios-proportions",
    "refugee",
    "statistics-data",
    "surface-area-review",
    "teacher-data-dashboard",
    "teacher-tools",
    "tools",
    "unit-1",
    "unit-4",
    "unit-5",
    "unit-5-practice",
    "wida-access",
    "world-architect-math-project",
    "assets",
    "build",
  ];
  const rootFiles = ["_headers", "_redirects", "404.html", "robots.txt"];

  return {
    name: "copy-standalone-html",
    closeBundle() {
      for (const folder of standaloneDirs) {
        const src = resolve(__dirname, folder);
        const dest = resolve(__dirname, "dist", folder);
        if (!existsSync(src)) continue;
        mkdirSync(dest, { recursive: true });
        cpSync(src, dest, { recursive: true });
      }
      for (const file of rootFiles) {
        const src = resolve(__dirname, file);
        const dest = resolve(__dirname, "dist", file);
        if (existsSync(src)) cpSync(src, dest);
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
