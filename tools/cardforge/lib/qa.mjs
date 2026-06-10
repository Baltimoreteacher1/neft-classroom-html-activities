// CardForge QA gate. Runs the Phase-8 checklist over a staged package dir and
// writes qa-report.md. Returns { status, checks }.
import { resolve } from "node:path";
import { existsSync, readFileSync, readdirSync, readJSON, writeFile, scanSlop, checkStatClaim } from "./util.mjs";

const REQUIRED_CARD_FIELDS = ["id", "title", "objective", "status", "resources"];

function check(checks, id, severity, ok, detail) {
  checks.push({ id, severity, ok, detail });
  return ok;
}

export function runQa(pkgDir) {
  const dir = resolve(pkgDir);
  const checks = [];
  const files = existsSync(dir) ? readdirSync(dir) : [];

  // --- Card metadata ---
  let card = null;
  if (check(checks, "card.json exists", "block", files.includes("card.json"), dir)) {
    card = readJSON(resolve(dir, "card.json"));
    for (const f of REQUIRED_CARD_FIELDS) {
      check(checks, `card.${f}`, f === "title" ? "block" : "warn", card[f] != null && card[f] !== "", `value: ${JSON.stringify(card[f])?.slice(0, 60)}`);
    }
    check(checks, "card.unit present or flagged", "warn", card.unit != null || card.unitUncertain, "unit");
    check(checks, "card.standard present or flagged", "warn", card.standard != null || card.standardUncertain, "standard");
  }

  // --- Resource completeness ---
  const need = ["teacher-guide.md", "student-practice.md", "answer-key.md"];
  for (const f of need) check(checks, `resource ${f}`, "block", files.includes(f), "");
  check(checks, "resource exit-ticket.md", "warn", files.includes("exit-ticket.md"), "appropriate for most lessons");
  check(checks, "resource-manifest.json", "warn", files.includes("resource-manifest.json"), "");
  check(checks, "Factory: sub-packet.html", "warn", files.includes("sub-packet.html"), "");
  check(checks, "Factory: activity-pack.html", "warn", files.includes("activity-pack.html"), "");
  check(checks, "Factory: interactive.html", "warn", files.includes("interactive.html"), "");

  // --- ESOL / SPED presence (scanned from the teacher guide) ---
  if (files.includes("teacher-guide.md")) {
    const tg = readFileSync(resolve(dir, "teacher-guide.md"), "utf8");
    check(checks, "ESOL supports present", "warn", /esol/i.test(tg) && !/ESOL:\*\*\s*_n\/a_/i.test(tg), "");
    check(checks, "SPED supports present", "warn", /sped/i.test(tg) && !/SPED:\*\*\s*_n\/a_/i.test(tg), "");
  }

  // --- Design: printables should be black-and-white friendly ---
  for (const hf of ["sub-packet.html", "activity-pack.html"]) {
    if (!files.includes(hf)) continue;
    const html = readFileSync(resolve(dir, hf), "utf8");
    // Flag color-only instructions ("color the red / blue ...") and tiny fonts.
    const colorWord = /\b(the )?(red|blue|green|yellow|orange|purple)\b[^.\n]{0,30}\b(box|part|section|answer|region)\b/i.test(html);
    check(checks, `${hf}: no color-only instructions`, "warn", !colorWord, "B/W printer friendly");
    const tiny = /font-size:\s*([0-9]|10)(px|pt)\b/i.test(html);
    check(checks, `${hf}: no tiny fonts`, "warn", !tiny, "readable print");
  }

  // --- Math accuracy: answer key vs practice count + stat-claim spot checks ---
  let practiceNums = [], keyNums = [];
  if (files.includes("student-practice.md")) {
    const txt = readFileSync(resolve(dir, "student-practice.md"), "utf8");
    practiceNums = (txt.match(/^\s*(\d+)\.\s/gm) || []).map((s) => parseInt(s));
  }
  if (files.includes("answer-key.md")) {
    const txt = readFileSync(resolve(dir, "answer-key.md"), "utf8");
    keyNums = (txt.match(/^\*\*(\d+)\.\*\*/gm) || []).map((s) => parseInt(s.replace(/\D/g, "")));
    // Spot-check stat claims line by line.
    for (const line of txt.split(/\n/)) {
      const r = checkStatClaim(line);
      if (r && !r.ok) check(checks, `math: ${r.kind} claim`, "block", false, `claimed ${r.claimed}, computed ${r.actual} — "${line.trim().slice(0, 70)}"`);
    }
  }
  const maxP = Math.max(0, ...practiceNums), maxK = Math.max(0, ...keyNums);
  check(checks, "answer key covers every problem", "block", maxK >= maxP && maxK > 0, `practice items: ${maxP}, answer-key items: ${maxK}`);
  // Vague answers without rubric.
  if (files.includes("answer-key.md")) {
    const txt = readFileSync(resolve(dir, "answer-key.md"), "utf8");
    const vague = /answers?\s+(may|will)\s+vary/i.test(txt) && !/rubric/i.test(txt);
    check(checks, "no vague 'answers may vary' without rubric", "warn", !vague, "");
  }

  // --- AI-slop + TODO + fake-link scan across all markdown ---
  let slop = [], todos = 0, fakeLinks = 0;
  // Scan teacher/student-facing markdown only; skip the meta QA report itself
  // (it names the checks, e.g. "TODO", and would self-flag — keeps QA idempotent).
  for (const f of files.filter((x) => x.endsWith(".md") && x !== "qa-report.md")) {
    const txt = readFileSync(resolve(dir, f), "utf8");
    slop.push(...scanSlop(txt).map((s) => `${s.phrase}×${s.count} in ${f}`));
    todos += (txt.match(/\bTODO\b/g) || []).length;
    fakeLinks += (txt.match(/\]\(#\)|href="#"|Upload Now|Generate Lesson(?!\s)/g) || []).length;
  }
  check(checks, "no AI-slop phrases", "warn", slop.length === 0, slop.join(", "));
  check(checks, "no stray TODO markers", "warn", todos === 0, `${todos} found`);
  check(checks, "no fake live buttons/links", "block", fakeLinks === 0, `${fakeLinks} found`);

  // --- Scaffolding depth ---
  if (files.includes("student-practice.md")) {
    check(checks, "enough practice scaffolding", "warn", maxP >= 4, `${maxP} practice items (>=4 recommended)`);
  }

  const blocked = checks.filter((c) => c.severity === "block" && !c.ok);
  const warns = checks.filter((c) => c.severity === "warn" && !c.ok);
  const status = blocked.length ? "blocked" : warns.length ? "pass-with-warnings" : "pass";

  const report = renderReport({ dir, card, status, checks, blocked, warns });
  writeFile(resolve(dir, "qa-report.md"), report);

  // Reflect QA status back into card.json.
  if (card) {
    card.qaStatus = status;
    card.status = status === "blocked" ? "blocked" : status === "pass" ? "ready-to-publish" : "staged";
    card.resources.qaReport = { label: "QA Report", file: "qa-report.md", applicable: true, exists: true };
    writeFile(resolve(dir, "card.json"), JSON.stringify(card, null, 2) + "\n");
  }

  return { status, checks, blocked, warns, dir };
}

function renderReport({ dir, card, status, checks, blocked, warns }) {
  const icon = (c) => (c.ok ? "✅" : c.severity === "block" ? "⛔" : "⚠️");
  const rec = status === "blocked"
    ? "**BLOCKED** — fix the ⛔ items before staging."
    : status === "pass"
      ? "**READY TO PUBLISH** (still requires the manual, guarded publish step — CardForge v1 does not auto-publish)."
      : "**STAGED ONLY** — usable, but address the ⚠️ warnings when you can.";
  return `# QA Report — ${card?.title || dir}

- **Status:** ${status}
- **Blocking failures:** ${blocked.length}
- **Warnings:** ${warns.length}
- **Recommendation:** ${rec}

## Checks
${checks.map((c) => `- ${icon(c)} [${c.severity}] ${c.id}${c.detail ? ` — ${c.detail}` : ""}`).join("\n")}

_Generated by CardForge QA (\`npm run cardforge:qa\`)._
`;
}
