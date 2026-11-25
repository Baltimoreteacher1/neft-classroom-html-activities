import { DOCX_MIME } from "../../_lib/bcpss/docx-kit.js";
import { buildPart, isPacketPart, loadPacketSource } from "../../_lib/bcpss/packet-parts.js";
import { renderPacketDocx, renderPacketHtml } from "../../_lib/bcpss/packet-render.js";
import { badRequest, handler, notFound } from "../../_lib/http.js";
import { UNIT_ID_RE } from "../../_lib/security/schema.js";

// Mixed-band class packets (Prompt 3 section 7.2) and per-unit print kits.
//   GET /api/bcpss/packet?unit=<id>&part=<part>&format=html|pdf|docx[&band=1_2|3_4|5_6][&counts=1_2:8,3_4:12,5_6:5]
// parts: student (needs band), key, cover (needs counts), kit-cards, kit-frames, kit-exit, kit-family.
// Read-only and stateless: it takes band COUNTS only (never a name, alias or initial) and writes nothing. The cover sheet
// is always its own file; the student paper's download name carries only its opaque variant code.
const FORMATS = new Set(["html", "pdf", "docx"]);
const AUTO_PRINT = `<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},150);});</script>`;

const autoPrint = (html) => html.replace("</body>", `${AUTO_PRINT}</body>`);

function filename(unitId, part, code, ext) {
  const tail = code ? `-${code}` : "";
  const name = part === "student" ? "paper" : part;
  return `BCPSS-${unitId}-${name}${tail}.${ext}`;
}

export const onRequest = handler({
  methods: ["GET"],
  rateLimit: { max: 30, ipMax: 120, windowMs: 60_000 },
  maxBodyBytes: 1024,
  async handle({ request, env }) {
    const q = new URL(request.url).searchParams;
    const unitId = String(q.get("unit") || "").trim();
    if (!UNIT_ID_RE.test(unitId))
      return badRequest("unit is required and must be a valid unit id.");
    const part = String(q.get("part") || "student")
      .trim()
      .toLowerCase();
    if (!isPacketPart(part)) return badRequest("part must be one of the packet parts.");
    const format = String(q.get("format") || "html")
      .trim()
      .toLowerCase();
    if (!FORMATS.has(format)) return badRequest('format must be "html", "pdf" or "docx".');

    const source = await loadPacketSource(unitId);
    if (!source) return notFound(`Unit "${unitId}" has no authored Studio content.`);

    let built;
    try {
      built = buildPart(source, part, {
        band: q.get("band"),
        counts: q.get("counts"),
        esReviewed: false,
      });
    } catch (err) {
      if (err?.status) return err.status === 404 ? notFound(err.message) : badRequest(err.message);
      throw err;
    }
    const { doc, code } = built;
    const headers = { "Cache-Control": "public, s-maxage=3600" };

    if (format === "docx") {
      return new Response(renderPacketDocx(doc), {
        status: 200,
        headers: {
          ...headers,
          "Content-Type": DOCX_MIME,
          "Content-Disposition": `attachment; filename="${filename(unitId, part, code, "docx")}"`,
        },
      });
    }

    const html = renderPacketHtml(doc);
    if (format === "html") {
      return new Response(html, {
        status: 200,
        headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (env?.BROWSER && typeof env.BROWSER.quickAction === "function") {
      try {
        const out = await env.BROWSER.quickAction("pdf", {
          html,
          pdfOptions: { format: "letter", printBackground: true, preferCSSPageSize: true },
          gotoOptions: { waitUntil: "load", timeout: 30_000 },
        });
        return new Response(out instanceof Response ? await out.arrayBuffer() : out, {
          status: 200,
          headers: {
            ...headers,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename(unitId, part, code, "pdf")}"`,
          },
        });
      } catch (err) {
        console.error("bcpss packet pdf fallback", unitId, part, err?.message || err);
      }
    }
    return new Response(autoPrint(html), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-BCPSS-PDF-Fallback": "print-html",
      },
    });
  },
});
