import { defineConfig } from "vite";
import { resolve } from "path";
import { readdirSync, existsSync } from "fs";

function getLessonEntries() {
  const lessonsDir = resolve(__dirname, "lessons");
  const entries = {};
  if (!existsSync(lessonsDir)) return entries;
  for (const dir of readdirSync(lessonsDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const html = resolve(lessonsDir, dir.name, "index.html");
    if (existsSync(html)) {
      entries[`lesson-${dir.name}`] = html;
    }
  }
  return entries;
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
});
