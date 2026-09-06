/* Tenant teacher dashboard — Phase 3 milestone 2 (Decision 2: teaching + pacing).
 * Server-rendered shell; the data loads client-side from the Access-gated
 * teacher API, so the page itself holds no student data. When Cloudflare
 * Access fronts /t/<id>/teach*, the browser carries the Access cookie and the
 * edge injects the JWT the API verifies. Until then the API answers 503 and
 * this page explains what is missing instead of pretending.
 */

import { resolveTenant } from "../../../_lib/tenant-registry.js";

export async function onRequest({ params }) {
  const tenant = resolveTenant(params.tenant);
  if (!tenant || tenant.status === "offboarded") {
    return new Response("Unknown tenant.", { status: 404 });
  }
  const name = tenant.name.replace(/</g, "&lt;");
  const id = tenant.id;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${name} — Teacher</title>
<style>
  :root { --ink:#22303a; --muted:#5d6d79; --accent:#0e7c7b; --line:#e3e1da; --bg:#faf9f6; }
  body { font:16px/1.55 system-ui,-apple-system,sans-serif; color:var(--ink); background:var(--bg); margin:0; padding:2rem 1rem 4rem; }
  main { max-width:56rem; margin:0 auto; }
  h1 { font-size:1.6rem; margin:0 0 .25rem; }
  .sub { color:var(--muted); margin:0 0 1.5rem; }
  section { background:#fff; border:1px solid var(--line); border-radius:8px; padding:1rem 1.25rem; margin:0 0 1.25rem; }
  h2 { font-size:1.05rem; margin:0 0 .75rem; color:var(--accent); }
  table { border-collapse:collapse; width:100%; font-size:.95rem; }
  th,td { text-align:left; padding:.4rem .6rem; border-bottom:1px solid var(--line); }
  th { color:var(--muted); font-weight:600; }
  .note { color:var(--muted); font-size:.92rem; }
  .warn { background:#fdf6ec; border-left:3px solid #b45309; padding:.6rem .9rem; border-radius:0 6px 6px 0; }
  code { background:#f2f0ec; padding:.1rem .35rem; border-radius:4px; font-size:.9em; }
</style>
</head>
<body>
<main>
  <h1>${name}</h1>
  <p class="sub">Teacher view · tenant <code>${id}</code> · lessons live at <a href="/curriculum/units/">/curriculum/units/</a></p>

  <section>
    <h2>Class activity</h2>
    <div id="digest" class="note">Loading…</div>
  </section>

  <section>
    <h2>Students join with</h2>
    <p class="note">Any lesson URL plus your class join code (you hold it — it is never shown on any page). Students pick an alias; no names or emails are stored anywhere.</p>
  </section>
</main>
<script>
(async () => {
  const el = document.getElementById("digest");
  try {
    const res = await fetch("/t/${id}/teach/api/progress/digest");
    if (res.status === 503) {
      el.innerHTML = '<div class="warn">Teacher access is not switched on for this deployment yet (Cloudflare Access application + vars). Nothing is wrong — see docs/tenancy-provisioning.md.</div>';
      return;
    }
    if (res.status === 401) {
      el.innerHTML = '<div class="warn">Not signed in through Cloudflare Access.</div>';
      return;
    }
    const data = await res.json();
    const rows = (data.students || data.rows || []);
    if (!rows.length) { el.textContent = "No student activity yet."; return; }
    el.innerHTML = "<table><tr><th>Student</th><th>Activities</th><th>Last seen</th></tr>" +
      rows.map((r) => "<tr><td>" + String(r.studentName || r.name || r.saveCode || "—").replace(/</g,"&lt;") +
        "</td><td>" + (r.activities ?? r.count ?? "—") +
        "</td><td>" + String(r.lastSeen || r.updatedAt || "—").replace(/</g,"&lt;") + "</td></tr>").join("") +
      "</table>";
  } catch {
    el.textContent = "Could not load activity.";
  }
})();
</script>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
