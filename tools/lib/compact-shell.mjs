// Shared shell for compact differentiated variants (small groups + catch-ups).
// A self-contained page that mounts the compact renderer plus the same premium
// classroom layers the full lessons ship: Math Workbench launcher (bottom-right
// button), interactive Learning-Supports (highlighter/directions/organizer dock
// + adaptations), and multi-day Save/Resume. It is NOT the heavy phase-engine
// index.html — no identity screen, notice/wonder, or phase nav.
//
// Save/Resume refs + sentinels are imported from the injector's own config so
// this shell can never drift out of sync with tools/audit-save-resume-integration.js.
import { BEGIN, END, LINK_TAG, SCRIPT_TAG } from "../save-resume-config.js";

const SUPPORTS_V = "20260714-supports-v28";

export function shellHtml(id, label, desc) {
  return `<!doctype html>
<html data-ewl-supports-lesson="${id}" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${desc}" />
    <title>${label} — Neft Teacher</title>
    <link
      id="sg-fonts"
      href="/assets/fonts/lesson-group.css"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/assets/learning-supports/learning-supports.css?v=${SUPPORTS_V}" />
    <style>
      .sg-boot{display:grid;place-items:center;min-height:60vh;margin:0;color:#536174;font:700 18px/1.5 system-ui,sans-serif;text-align:center;animation:sg-boot-pulse 1.2s ease-in-out infinite alternate}
      @keyframes sg-boot-pulse{from{opacity:.45}to{opacity:1}}
      @media(prefers-reduced-motion:reduce){.sg-boot{animation:none}}
    </style>
    ${BEGIN}
    ${LINK_TAG}
    ${END}
  </head>
  <body>
    <div id="app"><p class="sg-boot">Loading your math studio…</p></div>
    <noscript><p style="margin:24px auto;max-width:640px;font:700 17px/1.5 system-ui,sans-serif;text-align:center">This math studio needs JavaScript. Ask your teacher for the paper version if your device blocks it.</p></noscript>
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
