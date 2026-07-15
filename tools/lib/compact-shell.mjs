// Shared shell for compact differentiated variants (small groups + catch-ups).
// A self-contained page that mounts the compact renderer plus the same premium
// classroom layers the full lessons ship: Math Workbench launcher (bottom-right
// button), interactive Learning-Supports (highlighter/directions/organizer dock
// + adaptations), and multi-day Save/Resume. It is NOT the heavy phase-engine
// index.html — no identity screen, notice/wonder, or phase nav.
//
// Save/Resume refs + sentinels are imported from the injector's own config so
// this shell can never drift out of sync with tools/audit-save-resume-integration.js.
import { LINK_TAG, SCRIPT_TAG, BEGIN, END } from "../save-resume-config.js";

const SUPPORTS_V = "20260714-supports-v28";

export function shellHtml(id, label, desc) {
  return `<!doctype html>
<html data-ewl-supports-lesson="${id}" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${desc}" />
    <title>${label} — Neft Teacher</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Hanken+Grotesk:ital,wght@0,400;0,500;0,700;1,400&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/assets/learning-supports/learning-supports.css?v=${SUPPORTS_V}" />
    ${BEGIN}
    ${LINK_TAG}
    ${END}
  </head>
  <body>
    <div id="app"></div>
    <script>window.NT_ACTIVITY = false;</script>
    <script type="module" src="./lesson.js"></script>
    <script src="/assets/math-workbench-launcher.js" defer></script>
    <script src="/assets/learning-supports/learning-supports.js?v=${SUPPORTS_V}" defer></script>
    ${BEGIN}
    ${SCRIPT_TAG}
    ${END}
  </body>
</html>
`;
}

export const LESSON_JS = `import { bootSmallGroup } from "@engine/core/small-group-renderer.js";
import config from "./config.json";
bootSmallGroup(config);
`;
