/**
 * The look of a lesson's homework page, lifted from the generated homework.html so a
 * sibling family page (the word problems) loads the same stylesheets and the same hero.
 * Nothing is copied by hand: when the homework generator changes its design links or its
 * hashed legacy shell, the sibling's freshness check goes stale and regenerating picks the
 * change up.
 */
import { readFileSync } from "node:fs";
import { lessonPath } from "../../tools/lib/curriculum-source.mjs";

const DESIGN_LINKS =
  /<link rel="preload" href="\/assets\/design\/family\/fonts\/[^"]+"[^>]*>|<link rel="stylesheet" href="(?:\/assets\/design\/family\/(?:tokens|family|body)\.css\?v=\w+|\/assets\/homework\/homework-art-[0-9a-f]{10}\.css)">/g;

/** The design-system links, the legacy-shell link and the body style of lessons/<id>/homework.html. */
export function homeworkChrome(lessonId) {
  const html = readFileSync(lessonPath(lessonId, "homework.html"), "utf8");
  const take = (re, what) => {
    const m = re.exec(html);
    if (!m) throw new Error(`lessons/${lessonId}/homework.html: ${what} not found`);
    return m;
  };
  // Font preloads, tokens, components, body and the art palette, exactly as the homework page writes them.
  const designHead = [...html.matchAll(DESIGN_LINKS)].map((m) => m[0]);
  if (designHead.filter((l) => l.includes('rel="stylesheet"')).length !== 4)
    throw new Error(`lessons/${lessonId}/homework.html: design sheets not found`);
  return {
    designHead: designHead.join("\n"),
    legacy: take(
      /href="(\/assets\/homework\/homework-legacy-[0-9a-f]{10}\.css)"/,
      "legacy shell css",
    )[1],
    bodyStyle: take(/<body data-family-style="([^"]+)"/, "body style")[1],
  };
}
