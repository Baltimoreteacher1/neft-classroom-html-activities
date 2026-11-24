// GET /api/bcpss/lessons/:lessonId/export?format=html|pdf|docx&level=l1_2|l3_4|l5_6|all&part=lesson|teacher|student|newcomer|exit|key
// The Lesson Companion: teacher card, student pages, newcomer page, exit check, answer key. Same delivery as export/[unitId].js.

import { DOCX_MIME } from "../../../../_lib/bcpss/docx-kit.js";
import {
  LESSON_PARTS,
  lessonFilename,
  normalizeLevel,
  renderLessonHtml,
} from "../../../../_lib/bcpss/lesson-doc.js";
import { renderLessonDocx } from "../../../../_lib/bcpss/lesson-docx.js";
import { loadLesson } from "../../../../_lib/bcpss/lessons.js";
import { badRequest, handler, notFound } from "../../../../_lib/http.js";

const LESSON_ID = /^g(?:k|[1-8])-(?:ela|math|sci|ss)-u\d+-l\d{2}$/;
const VALID_FORMATS = new Set(["html", "pdf", "docx"]);

const AUTO_PRINT_SCRIPT = `<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},150);});</script>`;
const injectAutoPrint = (html) =>
  html.includes("</body>")
    ? html.replace("</body>", `${AUTO_PRINT_SCRIPT}</body>`)
    : `${html}${AUTO_PRINT_SCRIPT}`;

export const onRequest = handler({
  methods: ["GET"],
  async handle({ request, params, env }) {
    const lessonId = String(params?.lessonId || "").trim();
    if (!LESSON_ID.test(lessonId)) return badRequest("Invalid lessonId parameter.");

    const url = new URL(request.url);
    const format = String(url.searchParams.get("format") || "html")
      .trim()
      .toLowerCase();
    if (!VALID_FORMATS.has(format)) {
      return badRequest('Invalid format parameter. Expected "html", "pdf", or "docx".');
    }
    const level = normalizeLevel(url.searchParams.get("level") || "l3_4");
    if (!level)
      return badRequest('Invalid level parameter. Expected "l1_2", "l3_4", "l5_6", or "all".');
    const part = String(url.searchParams.get("part") || "lesson")
      .trim()
      .toLowerCase();
    if (!LESSON_PARTS.includes(part)) {
      return badRequest(`Invalid part parameter. Expected one of: ${LESSON_PARTS.join(", ")}.`);
    }
    const download = url.searchParams.get("download") === "1";

    const lesson = await loadLesson(lessonId);
    if (!lesson) return notFound(`Lesson "${lessonId}" not found.`);

    const opts = { level, part };
    const filename = lessonFilename(lesson, opts, format === "pdf" ? "pdf" : format);

    if (format === "docx") {
      return new Response(renderLessonDocx(lesson, opts), {
        status: 200,
        headers: {
          "Content-Type": DOCX_MIME,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "public, s-maxage=3600",
        },
      });
    }

    const html = renderLessonHtml(lesson, opts);

    if (format === "html") {
      const headers = new Headers({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      });
      if (download) headers.set("Content-Disposition", `attachment; filename="${filename}"`);
      return new Response(html, { status: 200, headers });
    }

    // format === "pdf": Browser Rendering when bound, otherwise a print-ready page that opens the print dialog.
    if (env?.BROWSER && typeof env.BROWSER.quickAction === "function") {
      try {
        const pdfResult = await env.BROWSER.quickAction("pdf", {
          html,
          pdfOptions: { format: "letter", printBackground: true, preferCSSPageSize: true },
          gotoOptions: { waitUntil: "load", timeout: 30_000 },
        });
        const pdfBody = pdfResult instanceof Response ? await pdfResult.arrayBuffer() : pdfResult;
        return new Response(pdfBody, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "public, s-maxage=3600",
          },
        });
      } catch (err) {
        console.error("bcpss lesson pdf browser fallback", lessonId, err?.message || err);
      }
    }
    return new Response(injectAutoPrint(html), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-BCPSS-PDF-Fallback": "print-html",
      },
    });
  },
});
