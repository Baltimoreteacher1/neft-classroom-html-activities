#!/usr/bin/env node
// Post-build: bundle the module-heavy apps in dist/ so they publish as a few chunks instead of
// hundreds of loose ES modules.
//
// WHY: Cloudflare Pages refuses a deployment of more than 20,000 files, and the site sits close to
// it. Source stays modular (tests import single modules, files stay small); only dist/ changes.
// Every page keeps its URL and every entry script keeps its path, because the bundled entry is
// written over the original file. Shared code goes to <app>/_chunks/.
//
// A module file is removed from dist/ only when nothing still needs it at its own URL. Kept:
//   - any module referenced by a path from outside the app (another page, a Worker, _headers),
//   - any module an inline <script type="module"> imports,
//   - any module a non-bundled file imports,
//   - and, transitively, everything those import.
//
// Fails loudly (exit 1, so `npm run build` stops):
//   - a dynamic import() the bundler cannot follow (a variable path): it would load a removed file
//     at runtime, or a second copy of a bundled module;
//   - a page whose bundle and whose kept modules both contain the same module (two copies of its
//     state on one page);
//   - a bundle that does not parse, or a page left pointing at a file that no longer exists.
//
// rolldown is vite 8's own bundler (a vite dependency, pinned by vite's lockfile entry).
//
// Usage: node tools/bundle-dist-modules.mjs   (run by `npm run build`, after vite build)

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { rolldown } from "rolldown";
import { parseAst } from "rolldown/parseAst";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIST = join(ROOT, "dist");

/** Apps bundled in dist/. Each is a directory whose pages load relative ES module entries. */
export const APPS = ["math/games/engines", "math/fluency-lab"];

const JS_RE = /\.m?js$/;
const TEXT_RE = /\.(html|m?js|json|webmanifest|css|txt)$|^_(headers|redirects)$/;
const toPosix = (p) => p.split(sep).join("/");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") out.push(...walk(p));
    } else out.push(p);
  }
  return out;
}

const isTest = (f) => /\.(test|spec)\.(m?js|cjs|ts)$/.test(f);

/** Module specifiers a JS source imports: static, re-export, and literal dynamic import(). */
export function importSpecifiers(code, file) {
  const specs = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const n of node) visit(n);
      return;
    }
    if (
      (node.type === "ImportDeclaration" ||
        node.type === "ExportNamedDeclaration" ||
        node.type === "ExportAllDeclaration") &&
      node.source
    ) {
      specs.push(node.source.value);
    } else if (node.type === "ImportExpression" && node.source.type === "Literal") {
      specs.push(node.source.value);
    }
    for (const key in node) if (key !== "parent") visit(node[key]);
  };
  visit(parseAst(code, { sourceType: "module" }, file).body);
  return specs;
}

/**
 * Rewrite one template dynamic import shape into a static map rolldown can follow:
 *   import(`./dir/${name}.js`)  ->  ({"./dir/a.js": () => import("./dir/a.js"), ...})[`./dir/${name}.js`]()
 * A name with no matching file rejects exactly like the failed import it replaces.
 * Any other non-literal import() is an error: the bundler cannot know what it loads.
 */
export function expandDynamicImports(code, file) {
  const ast = parseAst(code, { sourceType: "module" }, file);
  const edits = [];
  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const n of node) visit(n);
      return;
    }
    if (node.type === "ImportExpression" && node.source.type !== "Literal") {
      const src = node.source;
      const quasis = src.type === "TemplateLiteral" ? src.quasis.map((q) => q.value.cooked) : null;
      const shape =
        quasis &&
        quasis.length === 2 &&
        /^\.\.?\//.test(quasis[0]) &&
        !quasis[0].slice(2).includes("${");
      if (!shape) {
        throw new Error(
          `${relative(ROOT, file)}: import() of a computed path at offset ${node.start}. Use a string literal so the bundler can follow it.`,
        );
      }
      const [prefix, suffix] = quasis;
      const dir = resolve(dirname(file), prefix.slice(0, prefix.lastIndexOf("/") + 1));
      const head = prefix.slice(prefix.lastIndexOf("/") + 1);
      const matches = readdirSync(dir)
        .filter(
          (f) =>
            f.startsWith(head) &&
            f.endsWith(suffix) &&
            !isTest(f) &&
            statSync(join(dir, f)).isFile(),
        )
        .map((f) => prefix.slice(0, prefix.lastIndexOf("/") + 1) + f);
      if (!matches.length)
        throw new Error(
          `${relative(ROOT, file)}: import(\`${prefix}\${…}${suffix}\`) matches no file`,
        );
      const map = matches
        .map((m) => `${JSON.stringify(m)}: () => import(${JSON.stringify(m)})`)
        .join(", ");
      const key = code.slice(src.start, src.end);
      edits.push([
        node.start,
        node.end,
        `((m, k) => (m[k] ? m[k]() : Promise.reject(new Error("Unknown module: " + k))))({${map}}, ${key})`,
      ]);
      return;
    }
    for (const key in node) if (key !== "parent") visit(node[key]);
  };
  visit(ast.body);
  let out = code;
  for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0]))
    out = out.slice(0, start) + text + out.slice(end);
  return out;
}

/** Inline module scripts and module script srcs of an HTML page (srcs relative to the page). */
function pageScripts(html) {
  const srcs = [];
  const inline = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    const src = attrs.match(/\bsrc="([^"?#]+)/)?.[1];
    if (src) srcs.push({ src, module: /type="module"/.test(attrs) });
    else if (/type="module"/.test(attrs)) inline.push(m[2]);
  }
  return { srcs, inline };
}

/** Resolve a specifier from `fromDir` (a dist directory) to a dist file, or null. */
function resolveDist(spec, fromDir) {
  if (/^[a-z]+:/i.test(spec) || spec.startsWith("//")) return null;
  const p = spec.startsWith("/") ? join(DIST, spec) : resolve(fromDir, spec);
  return existsSync(p) && statSync(p).isFile() ? p : null;
}

async function bundleApp(app) {
  const srcDir = join(ROOT, app);
  const distDir = join(DIST, app);
  if (!existsSync(distDir)) throw new Error(`${distDir} is missing; run after the vite build.`);

  // Entries: relative module scripts of the app's pages, bundled together so pages share chunks.
  const pages = walk(srcDir).filter((f) => f.endsWith(".html"));
  const input = {};
  const inlineSpecs = [];
  for (const page of pages) {
    const { srcs, inline } = pageScripts(readFileSync(page, "utf8"));
    for (const { src, module } of srcs) {
      if (!module || src.startsWith("/") || /^[a-z]+:/i.test(src)) continue;
      const abs = resolve(dirname(page), src);
      input[toPosix(relative(srcDir, abs)).replace(JS_RE, "")] = abs;
    }
    for (const code of inline) {
      for (const spec of importSpecifiers(code, page))
        inlineSpecs.push(resolve(dirname(page), spec));
    }
  }
  if (!Object.keys(input).length) throw new Error(`${app}: no module entries found`);

  const graph = new Set();
  const bundle = await rolldown({
    input,
    logLevel: "warn",
    plugins: [
      {
        name: "dist-modules",
        resolveId(id) {
          if (/^(https?:)?\/\//.test(id) || (id.startsWith("/") && !id.startsWith(ROOT)))
            return { id, external: true };
          return null;
        },
        transform(code, id) {
          if (!id.startsWith(srcDir + sep)) return null;
          let out = expandDynamicImports(code, id);
          // A module that resolves files against its own URL keeps doing so from inside a chunk.
          const own = `/${toPosix(relative(ROOT, id))}`;
          out = out.replaceAll(
            "import.meta.url",
            `new URL(${JSON.stringify(own)}, import.meta.url).href`,
          );
          return out === code ? null : { code: out };
        },
        moduleParsed(info) {
          if (info.id.startsWith(srcDir + sep)) graph.add(info.id);
        },
      },
    ],
  });
  const { output } = await bundle.write({
    dir: distDir,
    format: "esm",
    entryFileNames: "[name].js",
    chunkFileNames: "_chunks/[name]-[hash].js",
    minify: false,
  });
  await bundle.close();
  const written = new Set(output.map((o) => join(distDir, o.fileName)));
  for (const f of written) {
    if (JS_RE.test(f))
      execFileSync(process.execPath, ["--check", "--input-type=module"], {
        input: readFileSync(f),
      });
  }

  // Kept roots: app modules outside the bundle graph, inline-script imports, and references from
  // anywhere else in dist/.
  const toDist = (srcFile) => join(distDir, relative(srcDir, srcFile));
  const appDistJs = walk(distDir).filter((f) => JS_RE.test(f) && !written.has(f));
  const graphDist = new Set([...graph].map(toDist));
  const roots = new Set(appDistJs.filter((f) => !graphDist.has(f)));
  for (const f of inlineSpecs) roots.add(toDist(f));
  const appName = app.slice(app.lastIndexOf("/") + 1);
  const refRe = new RegExp(`${appName.replace(/[-/]/g, "\\$&")}/([A-Za-z0-9_./-]+\\.m?js)\\b`, "g");
  for (const f of walk(DIST)) {
    if (f.startsWith(distDir + sep) || !TEXT_RE.test(f.slice(f.lastIndexOf(sep) + 1))) continue;
    for (const m of readFileSync(f, "utf8").matchAll(refRe)) roots.add(join(distDir, m[1]));
  }
  const keep = new Set();
  const stack = [...roots].filter((f) => existsSync(f));
  while (stack.length) {
    const f = stack.pop();
    if (keep.has(f)) continue;
    keep.add(f);
    for (const spec of importSpecifiers(readFileSync(f, "utf8"), f)) {
      const dep = resolveDist(spec, dirname(f));
      if (dep?.startsWith(distDir + sep) && !keep.has(dep)) stack.push(dep);
    }
  }

  // One page must never load a module both from its bundle and as a kept file.
  for (const page of walk(distDir).filter((f) => f.endsWith(".html"))) {
    const { srcs } = pageScripts(readFileSync(page, "utf8"));
    const loaded = srcs.map((s) => resolveDist(s.src, dirname(page))).filter(Boolean);
    const bundled = loaded.some((f) => written.has(f));
    const dual = loaded.filter((f) => keep.has(f) && graphDist.has(f));
    if (bundled && dual.length) {
      throw new Error(
        `${toPosix(relative(DIST, page))} loads bundled code and kept module ${toPosix(relative(DIST, dual[0]))}`,
      );
    }
  }

  let removed = 0;
  for (const f of graphDist) {
    if (!written.has(f) && !keep.has(f) && existsSync(f)) {
      rmSync(f);
      removed++;
    }
  }
  for (const page of walk(distDir).filter((f) => f.endsWith(".html"))) {
    const { srcs } = pageScripts(readFileSync(page, "utf8"));
    for (const { src } of srcs) {
      if (src.startsWith(`/${app}/`) || !src.startsWith("/")) {
        if (!/^[a-z]+:/i.test(src) && !resolveDist(src, dirname(page))) {
          throw new Error(`${toPosix(relative(DIST, page))} points at missing ${src}`);
        }
      }
    }
  }
  return {
    entries: Object.keys(input).length,
    graph: graph.size,
    chunks: written.size,
    kept: [...keep].filter((f) => graphDist.has(f)).length,
    removed,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    for (const app of APPS) {
      const r = await bundleApp(app);
      console.log(
        `bundle-dist-modules: ${app}: ${r.entries} entries, ${r.graph} modules -> ${r.chunks} files; ${r.kept} kept for other pages; ${r.removed} removed`,
      );
    }
  } catch (err) {
    console.error(`bundle-dist-modules: ${err.message}`);
    process.exit(1);
  }
}
