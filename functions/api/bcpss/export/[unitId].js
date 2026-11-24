import { getUnitDetail } from "../../../_lib/bcpss/db.js";
import { DOCX_MIME } from "../../../_lib/bcpss/docx-kit.js";
import { renderStudioDocx } from "../../../_lib/bcpss/studio-docx.js";
import {
  isKnownPart,
  partFilename,
  renderStudioPart,
} from "../../../_lib/bcpss/studio-print-html.js";
import {
  packetFilename,
  renderUnitDocxPacket,
  renderUnitHtmlPacket,
} from "../../../_lib/bcpss/unit-packet.js";
import { badRequest, handler, json, notFound } from "../../../_lib/http.js";

const VALID_FORMATS = new Set(["html", "pdf", "docx"]);
const VALID_WIDA = new Set(["1_2", "3_4", "5_6"]);

// Parts: packet (teacher overview, default), book, activity-<n>, key, cards, bingo, wall, poster, strips, talk, family,
// writing (Writing Lab student packet), writing-key (Writing Lab teacher guide).
const PARTS_HELP =
  "packet, book, activity-<n>, key, cards, bingo, wall, poster, strips, talk, family, writing, writing-key";
const WRITING_PARTS = new Set(["writing", "writing-key"]);

const AUTO_PRINT_SCRIPT = `<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},150);});</script>`;

function injectAutoPrint(html) {
  if (html.includes("</body>")) {
    return html.replace("</body>", `${AUTO_PRINT_SCRIPT}</body>`);
  }
  return `${html}${AUTO_PRINT_SCRIPT}`;
}

export const onRequest = handler({
  methods: ["GET"],
  async handle({ request, params, env }) {
    const unitId = String(params?.unitId || "").trim();
    if (!unitId || !/^[a-zA-Z0-9_-]{2,80}$/.test(unitId)) {
      return badRequest("Invalid unitId parameter.");
    }

    const url = new URL(request.url);
    const format = String(url.searchParams.get("format") || "html")
      .trim()
      .toLowerCase();
    if (!VALID_FORMATS.has(format)) {
      return badRequest('Invalid format parameter. Expected "html", "pdf", or "docx".');
    }

    const wida = String(url.searchParams.get("wida") || "3_4").trim();
    if (!VALID_WIDA.has(wida)) {
      return badRequest('Invalid wida parameter. Expected "1_2", "3_4", or "5_6".');
    }

    const part = String(url.searchParams.get("part") || "packet")
      .trim()
      .toLowerCase();
    if (!isKnownPart(part)) {
      return badRequest(`Invalid part parameter. Expected one of: ${PARTS_HELP}.`);
    }

    const download = url.searchParams.get("download") === "1";

    const { backend, detail } = await getUnitDetail(env, unitId);
    if (!detail?.unit) {
      return notFound(`Unit "${unitId}" not found.`);
    }

    // The legacy packet renderers only serve the packet of a unit with no authored Studio content yet.
    const legacyPacket = part === "packet" && !detail.studio;

    const source =
      part === "family"
        ? { ok: detail.family, label: "family guide" }
        : WRITING_PARTS.has(part)
          ? { ok: detail.writing, label: "Writing Lab" }
          : { ok: detail.studio, label: "Studio content" };
    const missing =
      !legacyPacket && !source.ok
        ? notFound(`Unit "${unitId}" has no authored ${source.label} yet.`)
        : null;

    if (format === "docx") {
      if (missing) return missing;
      let docxBytes;
      try {
        docxBytes = legacyPacket
          ? renderUnitDocxPacket(detail, wida)
          : renderStudioDocx(detail, { part, wida });
      } catch (err) {
        return notFound(
          `Part "${part}" is not available for unit "${unitId}": ${err?.message || err}`,
        );
      }
      const filename = partFilename(packetFilename(detail.unit, wida, "docx"), part);
      return new Response(docxBytes, {
        status: 200,
        headers: {
          "Content-Type": DOCX_MIME,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "public, s-maxage=3600",
          "X-BCPSS-Backend": backend,
        },
      });
    }

    let html;
    if (legacyPacket) {
      html = renderUnitHtmlPacket(detail, wida);
    } else {
      if (missing) return missing;
      try {
        html = renderStudioPart(detail, { part, level: wida });
      } catch (err) {
        return notFound(
          `Part "${part}" is not available for unit "${unitId}": ${err?.message || err}`,
        );
      }
    }

    const filename = partFilename(packetFilename(detail.unit, wida, format), part);

    if (format === "html") {
      const headers = new Headers({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-BCPSS-Backend": backend,
      });
      if (download) headers.set("Content-Disposition", `attachment; filename="${filename}"`);
      return new Response(html, { status: 200, headers });
    }

    // format === "pdf"
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
            "X-BCPSS-Backend": backend,
          },
        });
      } catch (err) {
        console.error("bcpss pdf browser fallback", unitId, err?.message || err);
      }
    }

    const printHtml = injectAutoPrint(html);
    return new Response(printHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-BCPSS-Backend": backend,
        "X-BCPSS-PDF-Fallback": "print-html",
      },
    });
  },
});
