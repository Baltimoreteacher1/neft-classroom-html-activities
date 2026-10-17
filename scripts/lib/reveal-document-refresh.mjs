import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function within(root, path) {
  const target = resolve(root, path);
  if (!target.startsWith(resolve(root) + sep))
    throw new Error(`Path outside resource root: ${path}`);
  return target;
}

// Plan the entire refresh before writing. A changed master replaces the bytes
// at its established URL; numbering, categories and teacher access stay intact.
export function planDocumentRefresh(manifest, sourceRoot, siteRoot) {
  const changes = [];
  const missing = [];
  for (const doc of manifest.documents) {
    const sources = doc.sources.map((path) => within(sourceRoot, path)).filter(existsSync);
    if (!sources.length) {
      missing.push({ url: doc.url, sources: doc.sources });
      continue;
    }
    const bytes = readFileSync(sources[0]);
    const sha256 = hash(bytes);
    if (sources.some((path) => hash(readFileSync(path)) !== sha256))
      throw new Error(`Previously identical source copies now disagree: ${doc.filename}`);
    if (!doc.url.startsWith("/")) throw new Error(`Expected site-relative URL: ${doc.url}`);
    const destination = within(siteRoot, doc.url.slice(1));
    const targetMatches = existsSync(destination) && hash(readFileSync(destination)) === sha256;
    if (sha256 !== doc.sha256 || bytes.length !== doc.bytes || !targetMatches)
      changes.push({ doc, destination, bytes, sha256 });
  }
  return { changes, missing, checked: manifest.documents.length - missing.length };
}

export function applyDocumentRefresh(plan) {
  for (const { doc, destination, bytes, sha256 } of plan.changes) {
    mkdirSync(dirname(destination), { recursive: true });
    const temporary = destination + ".refresh-tmp";
    writeFileSync(temporary, bytes);
    renameSync(temporary, destination);
    doc.sha256 = sha256;
    doc.bytes = bytes.length;
  }
}
