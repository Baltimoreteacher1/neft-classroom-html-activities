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
  return {
    name: "copy-standalone-html",
    closeBundle() {
      const folders = ["pre-test", "post-test", "games"];
      for (const folder of folders) {
        const src = resolve(__dirname, folder);
        const dest = resolve(__dirname, "dist", folder);
        if (!existsSync(src)) continue;
        mkdirSync(dest, { recursive: true });
        cpSync(src, dest, { recursive: true });
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
