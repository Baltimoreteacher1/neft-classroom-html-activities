/**
 * POST /api/worksheet-pdf — a real .pdf file of the selected practice worksheets.
 *
 * The downloader can already stitch worksheets into one print-ready document in
 * the browser, but the browser will only ever hand that to its print dialog;
 * "Save as PDF" is a destination the teacher has to pick, not a download. This
 * endpoint renders the same document with Browser Run and returns the bytes, so
 * "One PDF" saves a file like every other format does.
 *
 * It takes worksheet PATHS, never HTML. Accepting HTML would make this a public
 * PDF renderer anyone could point at anything and run on this account's Browser
 * Run quota; with paths, the only thing it can ever render is a worksheet page
 * on this origin that matches WORKSHEET_PATH — which is also what keeps the
 * teacher-only answer keys (`*-answer-key.html`) out of it, mirroring the
 * middleware predicate rather than restating it.
 *
 * The pack itself is built by assets/lib/worksheet-export.js, the same module
 * the browser uses, so the file that downloads is the document that was
 * previewed. (Pages Functions may import from outside functions/ — the SCORM
 * endpoints share assets/lib/zip-store.js the same way.)
 *
 * Optional by design: with no BROWSER binding this returns 503 with a reason,
 * and the downloader falls back to the print view instead of failing.
 */
import { printPackHtml, splitWorksheet } from "../../assets/lib/worksheet-export.js";
import { badRequest, handler, json } from "../_lib/http.js";

/**
 * The only pages this endpoint will render. Student practice sheets only:
 * every `*-answer-key.html` sibling is a teacher surface and is not in here.
 */
const WORKSHEET_PATH =
  /^\/lessons\/[a-z0-9-]{1,40}\/(?:worksheet|worksheet-2|worksheet-level-0|practice|mstar-worksheet|handout)\.html$/;

/**
 * One render has to stay comfortably inside the edge's response window. Unit 3
 * — the largest — is 102 worksheets and 510 pages, and renders in ~11 browser
 * seconds, so the cap is generous rather than tight; it exists so a malformed
 * or hostile request cannot ask for thousands.
 */
const MAX_SHEETS = 150;

const clean = (value, fallback) => {
  const name = String(value || "")
    .replace(/[^\w\s.-]+/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return name || fallback;
};

export const onRequest = handler({
  methods: ["POST"],
  // Rendering is the expensive verb on this whole site; a teacher packaging a
  // unit does it a handful of times, so the ceiling is low on purpose.
  rateLimit: { max: 10, windowMs: 60_000 },
  maxBodyBytes: 200_000,
  async handle({ request, env, body }) {
    if (!env?.BROWSER) {
      return json({ ok: false, error: "PDF rendering is not configured on this deployment" }, 503);
    }

    const sheets = Array.isArray(body?.sheets) ? body.sheets : null;
    if (!sheets?.length) return badRequest("sheets must be a non-empty array of worksheet paths");
    if (sheets.length > MAX_SHEETS) return badRequest(`at most ${MAX_SHEETS} worksheets per PDF`);

    const paths = [];
    for (const entry of sheets) {
      const path = String(entry?.path ?? entry ?? "");
      if (!WORKSHEET_PATH.test(path))
        return badRequest(`not a worksheet path: ${path.slice(0, 80)}`);
      paths.push({ path, title: typeof entry?.title === "string" ? entry.title : "" });
    }

    const origin = new URL(request.url).origin;
    const pages = await Promise.all(
      paths.map(async ({ path, title }) => {
        const response = await fetch(new URL(path, origin), {
          headers: { "User-Agent": "eduwonderlab-worksheet-pdf" },
        });
        if (!response.ok) throw new Error(`${path} → HTTP ${response.status}`);
        return splitWorksheet(await response.text(), { title, url: path });
      }),
    );

    const html = printPackHtml(pages, {
      title: body?.title || "Practice worksheets",
      baseHref: `${origin}/`,
      // The teacher already has the document; this one is going straight to a
      // file, so the print dialog the preview opens must not fire.
      autoPrint: false,
    });

    const pdf = await env.BROWSER.quickAction("pdf", {
      html,
      pdfOptions: { format: "letter", printBackground: true },
      gotoOptions: { waitUntil: "networkidle0", timeout: 60_000 },
    });

    const bytes =
      pdf instanceof ArrayBuffer || ArrayBuffer.isView(pdf) ? pdf : await pdf.arrayBuffer();
    const filename = `${clean(body?.title, "Practice-Worksheets")}.pdf`;
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
});
