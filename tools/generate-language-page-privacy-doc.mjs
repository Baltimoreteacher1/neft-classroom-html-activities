#!/usr/bin/env node
/* =============================================================================
 * generate-language-page-privacy-doc.mjs — docs/language-page/privacy.md, for legal review (H-08).
 *
 * A privacy document written by hand drifts from the page and the code. This one is BUILT from the privacy page's own
 * sections (access-practice-lab/src/views/privacy.js, English and Spanish) and from data/language-page-third-parties.json
 * (the hosts the lab may contact, checked in a browser by tools/validate-language-page-network.mjs), so a change to either
 * changes the document, and tools/language-page-privacy-doc.test.mjs fails until it is regenerated.
 *
 *   node tools/generate-language-page-privacy-doc.mjs            write the document
 *   node tools/generate-language-page-privacy-doc.mjs --check    fail when it is stale
 * ========================================================================== */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PRIVACY_SECTIONS } from "../access-practice-lab/src/views/privacy.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const OUT = "docs/language-page/privacy.md";

const sections = (idx) =>
  PRIVACY_SECTIONS.map(
    (s) => `### ${s.title[idx]}\n\n${s.points.map((p) => `- ${p[idx]}`).join("\n")}`,
  ).join("\n\n");

export function renderPrivacyDoc(
  registry = JSON.parse(readFileSync(join(ROOT, "data/language-page-third-parties.json"), "utf8")),
) {
  const hosts = registry.hosts || [];
  const hostRows = hosts.length
    ? hosts.map((h) => `| ${h.host} | ${h.purpose} | ${h.dataSent} | ${h.retention} |`).join("\n")
    : "| _none_ | | | |";
  return `# The Language Page — privacy statement (draft for legal review)

> **GENERATED FILE.** Built by \`tools/generate-language-page-privacy-doc.mjs\` from the lab's privacy page
> (\`access-practice-lab/src/views/privacy.js\`) and \`data/language-page-third-parties.json\`. Edit those, then regenerate.
> **This is a draft for counsel (H-08). It is not legal advice and has not been reviewed.** The page says it describes
> "how the lab works", not what a statute requires.

## Third-party hosts the lab may contact
Checked in a real browser across the site's routes by \`tools/validate-language-page-network.mjs\`. Cloudflare serves the
site itself (it sees the visit's IP address and browser, as any host does). The list below is every *other* host:

| Host | Purpose | Data sent | Retention |
| --- | --- | --- | --- |
${hostRows}

AI model providers are contacted **by the site's servers**, not by the browser, and only when a person presses a button or
sends a typed question; they are described in "AI helpers" below.

## What the privacy page says (English)

${sections(0)}

## Lo que dice la página de privacidad (español)

${sections(1)}

## Questions for counsel
1. Whether the "Our practices for student data" wording (COPPA, FERPA, Maryland Student Data Privacy Act) is appropriate to publish.
2. Whether Anthropic, Google (Gemini) and Cloudflare are "subprocessors" needing agreements, given the AI helpers send a
   learner's draft (Claude Haiku or Workers AI) or a typed question (Gemini, Claude Haiku or Workers AI) on a button press.
3. The 90-day question log of the Mr. Neft guide (questions with names, emails and phone numbers replaced; no IP address,
   no answer) and the 120-day deletion of unused classes and 30-day deletion of voice notes and shared recordings.
4. The Teacher Hub and WIDA Data Studio are served with no password on thelanguagepage.com (a decision of 2026-11-17).
5. Whether the Spanish text, which is machine-drafted and unreviewed (H-05), may be published as the Spanish privacy notice.
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const next = renderPrivacyDoc();
  const path = join(ROOT, OUT);
  if (process.argv.includes("--check")) {
    if (!existsSync(path) || readFileSync(path, "utf8") !== next) {
      console.error(
        `generate-language-page-privacy-doc: ${OUT} is stale — run: node tools/generate-language-page-privacy-doc.mjs`,
      );
      process.exit(1);
    }
    console.log(`generate-language-page-privacy-doc: ${OUT} is current`);
  } else {
    writeFileSync(path, next);
    console.log(`generate-language-page-privacy-doc: wrote ${OUT}`);
  }
}
