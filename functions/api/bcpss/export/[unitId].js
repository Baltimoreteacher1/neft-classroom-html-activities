import { getUnitDetail } from "../../../_lib/bcpss/db.js";
import {
  packetFilename,
  renderUnitDocxPacket,
  renderUnitHtmlPacket,
} from "../../../_lib/bcpss/unit-packet.js";
import { badRequest, handler, notFound } from "../../../_lib/http.js";

const VALID_FORMATS = new Set(["html", "pdf", "docx"]);
const VALID_WIDA = new Set(["1_2", "3_4", "5_6"]);

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

    const download = url.searchParams.get("download") === "1";

    const { backend, detail } = await getUnitDetail(env, unitId);
    if (!detail?.unit) {
      return notFound(`Unit "${unitId}" not found.`);
    }

    if (format === "html") {
      const html = renderUnitHtmlPacket(detail, wida);
      const headers = new Headers({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-BCPSS-Backend": backend,
      });
      if (download) {
        const filename = packetFilename(detail.unit, wida, "html");
        headers.set("Content-Disposition", `attachment; filename="${filename}"`);
      }
      return new Response(html, { status: 200, headers });
    }

    if (format === "docx") {
      const docxBytes = renderUnitDocxPacket(detail, wida);
      const filename = packetFilename(detail.unit, wida, "docx");
      return new Response(docxBytes, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "public, s-maxage=3600",
          "X-BCPSS-Backend": backend,
        },
      });
    }

    // format === "pdf"
    const html = renderUnitHtmlPacket(detail, wida);
    const filename = packetFilename(detail.unit, wida, "pdf");

    if (env?.BROWSER && typeof env.BROWSER.quickAction === "function") {
      try {
        const pdfResult = await env.BROWSER.quickAction("pdf", {
          html,
          pdfOptions: { format: "letter", printBackground: true },
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
