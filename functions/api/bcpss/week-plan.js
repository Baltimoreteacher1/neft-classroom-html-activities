// GET /api/bcpss/week-plan?unit=<id>&b12=&b34=&b56=&block=45|60|90&days=1-5&seed=&start=YYYY-MM-DD&cal=0|1&format=...
// The "My Week" planner. Stateless: the query string is the whole plan, so a shared link regenerates the same plan
// and nothing is stored. format = json (default) | html | pdf | docx | ics. Counts of groups only; no student data.

import { PLAN_PARAM_NAMES, parseSearch } from "../../../shared/planner/params.js";
import { planHtml, planIcs } from "../../../shared/planner/render.js";
import { PlannerError } from "../../../shared/planner/solve.js";
import { DOCX_MIME } from "../../_lib/bcpss/docx-kit.js";
import { buildWeekPlan, loadPacingDays } from "../../_lib/bcpss/week-plan.js";
import { renderWeekPlanDocx } from "../../_lib/bcpss/week-plan-docx.js";
import { badRequest, handler, json } from "../../_lib/http.js";

const FORMATS = new Set(["json", "html", "pdf", "docx", "ics"]);
const KNOWN = new Set([...PLAN_PARAM_NAMES, "format", "download"]);
const CACHE = "public, s-maxage=3600";
const AUTO_PRINT = `<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},150);});</script>`;

const fileName = (plan, ext) => {
  const { unit, block, days } = plan.params;
  return `my-week-${unit}-${days}x${block}.${ext}`;
};
const attachment = (plan, ext) => `attachment; filename="${fileName(plan, ext)}"`;

async function pdfResponse(env, plan) {
  const html = planHtml(plan);
  if (typeof env?.BROWSER?.quickAction === "function") {
    try {
      const result = await env.BROWSER.quickAction("pdf", {
        html,
        pdfOptions: { format: "letter", printBackground: true, preferCSSPageSize: true },
        gotoOptions: { waitUntil: "load", timeout: 30_000 },
      });
      const body = result instanceof Response ? await result.arrayBuffer() : result;
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": attachment(plan, "pdf"),
          "Cache-Control": CACHE,
        },
      });
    } catch (err) {
      console.error("bcpss week-plan pdf browser fallback", err?.message || err);
    }
  }
  // No browser binding: hand back the print sheet, which opens the print dialog (Save as PDF).
  return new Response(html.replace("</body>", `${AUTO_PRINT}</body>`), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-BCPSS-PDF-Fallback": "print-html",
    },
  });
}

export const onRequest = handler({
  methods: ["GET"],
  rateLimit: { max: 30, ipMax: 300, windowMs: 60_000 },
  maxBodyBytes: 1_024,
  async handle({ request, env }) {
    const url = new URL(request.url);
    const unknown = [...url.searchParams.keys()].filter((k) => !KNOWN.has(k));
    if (unknown.length) return badRequest(`unexpected parameter: ${unknown[0]}`);

    const parsed = parseSearch(url.search);
    if (!parsed.ok) return badRequest(parsed.errors.join(" "));
    const format = (url.searchParams.get("format") || "json").toLowerCase();
    if (!FORMATS.has(format))
      return badRequest(`format must be one of ${[...FORMATS].join(", ")}.`);
    if (format === "ics" && !parsed.params.start) return badRequest("ics needs a start date.");

    let pacingDays = null;
    if (parsed.params.cal) {
      try {
        pacingDays = await loadPacingDays(env, url.origin);
      } catch (err) {
        if (err instanceof PlannerError) return json({ ok: false, error: err.message }, 503);
        throw err;
      }
    }
    const result = await buildWeekPlan(env, parsed.params, { pacingDays });
    if (!result.ok) return json({ ok: false, error: result.error }, result.status);
    const { plan } = result;

    switch (format) {
      case "html":
        return new Response(planHtml(plan), {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": CACHE },
        });
      case "pdf":
        return pdfResponse(env, plan);
      case "docx":
        return new Response(renderWeekPlanDocx(plan), {
          status: 200,
          headers: {
            "Content-Type": DOCX_MIME,
            "Content-Disposition": attachment(plan, "docx"),
            "Cache-Control": CACHE,
          },
        });
      case "ics":
        return new Response(planIcs(plan), {
          status: 200,
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": attachment(plan, "ics"),
            "Cache-Control": CACHE,
          },
        });
      default:
        return json({ ok: true, plan }, 200, { "Cache-Control": CACHE });
    }
  },
});
