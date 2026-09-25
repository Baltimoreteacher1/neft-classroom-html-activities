import { chmodSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "math/fluency-lab");
const destination = process.argv[2] && resolve(process.argv[2]);
if (!destination || destination === root || destination === "/")
  throw new Error(
    "Pass a dedicated destination folder, for example: node tools/package-fluency-desktop.mjs '/path/Math Fluency Lab'",
  );
mkdirSync(destination, { recursive: true });
const files = [
  "app.js",
  "problem-bank.js",
  "tutor-engine.js",
  "lesson-content.js",
  "visual-lab.js",
  "school-tools.js",
  "styles.css",
  "tutor.css",
];
for (const file of files) copyFileSync(join(source, file), join(destination, file));
let html = readFileSync(join(source, "index.html"), "utf8")
  .replace(/\s*<!-- nsr-injected:begin[\s\S]*?<!-- nsr-injected:end -->/g, "")
  .replaceAll('href="/math/"', 'href="./index.html"');
writeFileSync(join(destination, "index.html"), html);
const bundleResult = await build({
  root: source,
  configFile: false,
  logLevel: "error",
  build: {
    write: false,
    target: "es2022",
    minify: true,
    lib: { entry: join(source, "app.js"), name: "FluencyLab", formats: ["iife"] },
  },
});
const bundled = (Array.isArray(bundleResult) ? bundleResult : [bundleResult])
  .flatMap((result) => result.output)
  .find((output) => output.type === "chunk");
if (!bundled) throw new Error("The standalone application bundle was not generated.");
const css = ["styles.css", "tutor.css"]
  .map((file) => readFileSync(join(source, file), "utf8"))
  .join("\n");
html = html
  .replace(/\s*<link rel="stylesheet" href="\.\/(?:styles|tutor)\.css"\s*\/>/g, "")
  .replace(/\s*<script type="module" src="\.\/app\.js"><\/script>/, "")
  .replaceAll('href="./index.html"', 'href="./Math Fluency Lab.html"')
  .replace("</head>", `<style>${css}</style></head>`)
  .replace(
    "</body>",
    `<script>${bundled.code.replaceAll("</script", "<\\/script")}</script></body>`,
  );
writeFileSync(join(destination, "Math Fluency Lab.html"), html);
writeFileSync(
  join(destination, "README.txt"),
  `MATH FLUENCY LAB — GRADES 1–8\n\nDouble-click Math Fluency Lab.html to open the complete offline edition. No server or installation is needed. It includes all scripts and styles in one file.\n\nThe local learner profiles store progress in this browser. Use Download backup to carry progress between devices or between the offline file and the live site. Restore only a backup you recognize.\n\nPractice: 80 skills, interactive visual lessons, adaptive practice, a starting-point checkup, a personal daily ten, guided practice, sprints, a mistake notebook, and fresh generated sets.\n\nTeachers: use Teacher studio to create a focused skill assignment link or print a five-day packet. Assignment links open the live site: https://eduwonderlab.com/math/fluency-lab/\n\nA browser may restrict local-file storage. A warning will appear if saving fails; download a backup before closing in that case. The browser-served edition is also available by double-clicking Open Math Fluency Lab.command on macOS.\n\nProgress stays local. This edition does not maintain a central roster or send results to teachers. Students can download their progress reports for classroom submission.\n`,
);
const launcher = `#!/bin/zsh\nset -euo pipefail\nsite_dir="\${0:A:h}"\ncd "$site_dir"\npython_bin="$(command -v python3)"\nport="$($python_bin -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')"\nurl="http://127.0.0.1:$port/"\n"$python_bin" -m http.server "$port" --bind 127.0.0.1 &\nserver_pid=$!\ntrap 'kill "$server_pid" 2>/dev/null || true' EXIT INT TERM\nfor _ in {1..30}; do\n  if /usr/bin/curl --silent --fail "$url" >/dev/null 2>&1; then\n    /usr/bin/open "$url"\n    echo "Math Fluency Lab is open. Keep this window open while using this edition."\n    wait "$server_pid"\n    exit 0\n  fi\n  sleep 0.1\ndone\necho "The local site could not start. Open Math Fluency Lab.html instead."\n`;
writeFileSync(join(destination, "Open Math Fluency Lab.command"), launcher);
chmodSync(join(destination, "Open Math Fluency Lab.command"), 0o755);
console.log(
  `Desktop package created at ${destination}; includes a self-contained offline HTML file.`,
);
