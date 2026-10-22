/**
 * The look of a lesson's homework page, lifted from the generated homework.html so a
 * sibling family page (the word problems) loads the same stylesheets, the same unit theme
 * and the same hero. Nothing is copied by hand: when the homework generator changes its
 * theme or its hashed layer, the sibling's freshness check goes stale and regenerating
 * picks the change up.
 */
import { readFileSync } from "node:fs";
import { lessonPath } from "../../tools/lib/curriculum-source.mjs";

/** The asset links, unit theme block and unit kicker of lessons/<id>/homework.html. */
export function homeworkChrome(lessonId) {
  const html = readFileSync(lessonPath(lessonId, "homework.html"), "utf8");
  const take = (re, what) => {
    const m = re.exec(html);
    if (!m) throw new Error(`lessons/${lessonId}/homework.html: ${what} not found`);
    return m;
  };
  const link = (href) => `<link href="${href}" rel="stylesheet">`;
  const fonts = [...html.matchAll(/<link href="(\/assets\/fonts\/[^"]+)" rel="stylesheet">/g)].map(
    (m) => link(m[1]),
  );
  if (!fonts.length) throw new Error(`lessons/${lessonId}/homework.html: font links not found`);
  const base = take(/href="(\/assets\/homework\/homework-base-[0-9a-f]{10}\.css)"/, "base css")[1];
  const layer = take(
    /href="(\/assets\/homework\/homework-layer-[0-9a-f]{10}\.css)"/,
    "layer css",
  )[1];
  const theme = take(
    /homework-base-[0-9a-f]{10}\.css">\s*<style>([\s\S]*?)<\/style>/,
    "unit theme",
  )[1];
  return {
    fonts: fonts.join("\n"),
    base,
    layer,
    theme: theme.trim(),
    bodyStyle: take(/<body data-family-style="([^"]+)"/, "body style")[1],
    kicker: take(/<p class="hw-hero-kicker">[\s\S]*?<\/p>/, "hero kicker")[0],
  };
}
