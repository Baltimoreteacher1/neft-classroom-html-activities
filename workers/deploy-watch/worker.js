/**
 * Continuous deploy verification that does not depend on GitHub Actions.
 *
 * A Cron Trigger runs the same question `npm run smoke:live -- --expect <sha>`
 * answers — is production serving the commit at the tip of main? — from
 * Cloudflare's own infrastructure. When the Actions queue cannot hand out a
 * runner (see docs/deploy.md, "Runnerless cancels"), this keeps answering.
 *
 * GET / returns the current verdict as JSON, so the answer is readable from a
 * browser or by any script, rather than only from a CI log.
 *
 * Deliberately read-only: it fetches two public URLs and reports. It cannot
 * deploy, roll back, or change anything, which is what makes it safe to run
 * unattended every few minutes.
 */
import { evaluateDeploy } from "./deploy-status.js";

const SITE = "https://eduwonderlab.com";
const STAMP_PATH = "/access-practice-lab/config.json";
const REPO = "Baltimoreteacher1/neft-classroom-html-activities";
const BRANCH = "main";

// GitHub rejects unauthenticated API calls without a User-Agent.
const GH_HEADERS = {
  accept: "application/vnd.github+json",
  "user-agent": "neft-deploy-watch",
};

async function readStamp() {
  try {
    const res = await fetch(`${SITE}${STAMP_PATH}`, { cf: { cacheTtl: 0 } });
    if (!res.ok) return { commit: null, error: `stamp HTTP ${res.status}` };
    const body = await res.json();
    return { commit: String(body.commit || "") || null, builtAt: body.builtAt || null };
  } catch (err) {
    return { commit: null, error: `stamp fetch failed: ${err}` };
  }
}

async function readHead() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/commits/${BRANCH}`, {
      headers: GH_HEADERS,
    });
    if (!res.ok) return { commit: null, error: `github HTTP ${res.status}` };
    const body = await res.json();
    return {
      commit: String(body.sha || "") || null,
      committedAt: body.commit?.committer?.date || body.commit?.author?.date || null,
    };
  } catch (err) {
    return { commit: null, error: `github fetch failed: ${err}` };
  }
}

export async function check(now = Date.now()) {
  const [stamp, head] = await Promise.all([readStamp(), readHead()]);
  const verdict = evaluateDeploy({
    stampCommit: stamp.commit,
    headCommit: head.commit,
    headCommittedAt: head.committedAt,
    now,
  });
  return {
    ...verdict,
    checkedAt: new Date(now).toISOString(),
    production: {
      commit: stamp.commit,
      builtAt: stamp.builtAt ?? null,
      error: stamp.error ?? null,
    },
    head: { commit: head.commit, committedAt: head.committedAt ?? null, error: head.error ?? null },
  };
}

export default {
  async fetch() {
    const result = await check();
    // 200 for ok/settling, 503 for drift/unknown — so an uptime monitor or a
    // shell script can act on the status code without parsing the body.
    const healthy = result.status === "ok" || result.status === "settling";
    return Response.json(result, {
      status: healthy ? 200 : 503,
      headers: { "cache-control": "no-store" },
    });
  },

  async scheduled(_event, _env, ctx) {
    ctx.waitUntil(
      check().then((result) => {
        // Cron output goes to `wrangler tail` / the Workers log. Drift is the
        // only line worth shouting about; the rest is a heartbeat.
        const line = `[deploy-watch] ${result.status}: ${result.detail}`;
        if (result.status === "drift" || result.status === "unknown") console.error(line);
        else console.log(line);
      }),
    );
  },
};
