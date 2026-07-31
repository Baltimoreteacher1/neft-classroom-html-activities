/**
 * The site's page TEMPLATES, and one representative URL for each.
 *
 * Most of this site is not hand-written pages — it is a small number of
 * layouts rendering hundreds of URLs (74 lesson launchers, ~114 games, 10
 * graphic novels, per-lesson vocab/learn/homework/printable, per-unit
 * projects, per-lesson family pages). Any check that samples individual paths
 * is really sampling templates, and it should say so: a contrast or focus-order
 * bug in one template is that bug on every page built from it.
 *
 * Each entry finds its own representative from disk, so a template that gains
 * or loses pages does not need this file edited. `first` picks the
 * lexicographically first match, which keeps runs comparable over time rather
 * than sampling something different each run.
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const first = (dir, predicate = () => true) => {
  const path = resolve(ROOT, dir);
  if (!existsSync(path)) return null;
  return (
    readdirSync(path, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !e.name.startsWith("_"))
      .map((e) => e.name)
      .filter(predicate)
      .sort()[0] ?? null
  );
};

/**
 * A template is { id, name, resolve() -> url|null }. `resolve` returning null
 * means the template currently has no pages, which is a finding, not a skip —
 * tools/a11y-coverage.test.mjs treats it as a failure so a template that
 * disappears is noticed.
 */
export const TEMPLATES = [
  {
    id: "lesson-launcher",
    name: "Lesson launcher",
    resolve: () => {
      const id = first("lessons", (n) => /^\d+-\d+$/.test(n));
      return id && `/lessons/${id}/`;
    },
  },
  {
    id: "lesson-learn",
    name: "Lesson Learn It",
    resolve: () => {
      const id = first("lessons", (n) => existsSync(resolve(ROOT, "lessons", n, "learn.html")));
      return id && `/lessons/${id}/learn.html`;
    },
  },
  {
    id: "lesson-vocab",
    name: "Lesson vocabulary",
    resolve: () => {
      const id = first("lessons", (n) => existsSync(resolve(ROOT, "lessons", n, "vocab.html")));
      return id && `/lessons/${id}/vocab.html`;
    },
  },
  {
    id: "lesson-homework",
    name: "Lesson homework",
    resolve: () => {
      const id = first("lessons", (n) => existsSync(resolve(ROOT, "lessons", n, "homework.html")));
      return id && `/lessons/${id}/homework.html`;
    },
  },
  {
    id: "lesson-printable",
    name: "Lesson printable",
    resolve: () => {
      const id = first("lessons", (n) => existsSync(resolve(ROOT, "lessons", n, "printable.html")));
      return id && `/lessons/${id}/printable.html`;
    },
  },
  {
    id: "lesson-family",
    name: "Family page",
    resolve: () => {
      const id = first("lessons", (n) =>
        existsSync(resolve(ROOT, "lessons", n, "family", "index.html")),
      );
      return id && `/lessons/${id}/family/`;
    },
  },
  {
    id: "lesson-teacher-notes",
    name: "Teacher notes",
    // Teacher surface: behind Basic Auth, so 401 is the HEALTHY answer in a
    // production smoke. A 200 here would mean the gate is off.
    authGated: true,
    resolve: () => {
      const id = first("lessons", (n) =>
        existsSync(resolve(ROOT, "lessons", n, "teacher-notes", "index.html")),
      );
      return id && `/lessons/${id}/teacher-notes/`;
    },
  },
  {
    id: "game-2d",
    name: "2D game",
    // 2D games live under /math/games/<slug>/, not games/2d — games/ holds only
    // the 3D engine and its vendor bundle.
    resolve: () => {
      const g = first("math/games", (n) => n !== "dashboard");
      return g && `/math/games/${g}/`;
    },
  },
  {
    id: "game-3d",
    name: "3D game",
    resolve: () => {
      const g = first("games/3d");
      return g && `/games/3d/${g}/`;
    },
  },
  {
    id: "unit-project",
    name: "Unit project",
    // curriculum/projects/ is a hub page; the projects themselves are under
    // /math/projects/.
    resolve: () => {
      const p = first("math/projects");
      return p && `/math/projects/${p}/`;
    },
  },
  {
    id: "graphic-novel",
    name: "Graphic novel",
    resolve: () => {
      const n = first("graphic-novels");
      return n && `/graphic-novels/${n}/`;
    },
  },
  {
    id: "small-group",
    name: "Small-group lesson",
    resolve: () => {
      const id = first("lessons", (n) => /-group\d+$/.test(n));
      return id && `/lessons/${id}/`;
    },
  },
];

/** One { path, name } per template that currently has pages. */
export function representativePages() {
  return TEMPLATES.map((t) => ({
    template: t.id,
    name: t.name,
    path: t.resolve(),
    authGated: t.authGated === true,
  })).filter((p) => p.path);
}

/** Templates with no representative — an empty result means full coverage. */
export function missingTemplates() {
  return TEMPLATES.filter((t) => !t.resolve()).map((t) => t.id);
}
