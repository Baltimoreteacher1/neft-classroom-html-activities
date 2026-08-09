#!/usr/bin/env node
/**
 * Print the deploy graph as a few lines of context.
 *
 * Run by the SessionStart hook. The point is that a session should not have to
 * discover, forty tool calls in, that a repo it is editing deploys nothing.
 * Keep the output short — this is a map, not an inventory, and a wall of text
 * at session start is a wall of text nobody reads.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const graph = JSON.parse(readFileSync(resolve(HERE, "deploy-graph.json"), "utf8"));

const lines = [
  "Deploy graph (tools/graph/deploy-graph.json — run `npm run validate:graph` to check it):",
];

for (const [name, repo] of Object.entries(graph.repos)) {
  const role = repo.deploys ? `deploys via ${repo.deploys}` : "DEPLOYS NOTHING";
  lines.push(`  · ${name} — ${role}. ${repo.note ?? ""}`.trimEnd());
}

if (graph.mirrors?.length) {
  lines.push("  Mirrors (editing these reaches nobody — edit the source of truth):");
  for (const mirror of graph.mirrors) {
    const target = graph.artifacts.find((a) => a.id === mirror.mirrorOf);
    lines.push(`    · ${mirror.repo}/${mirror.path} → ${target?.repo}/${target?.path}`);
  }
}

const debt = Object.entries(graph.deadDataBaseline ?? {}).flatMap(([file, literals]) =>
  Object.entries(literals).map(([name, keys]) => `${file} ${name}: ${keys.join(", ")}`),
);
if (debt.length) {
  lines.push(
    "  Known-dead data fields (present in the literal, read by no JS — editing them changes nothing):",
  );
  for (const entry of debt) lines.push(`    · ${entry}`);
}

console.log(lines.join("\n"));
