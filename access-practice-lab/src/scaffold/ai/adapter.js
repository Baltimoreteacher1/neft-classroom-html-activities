// Optional AI layer. OFF by default and unreachable in production: it needs release.json `aiEnabled: true` AND a
// non-production host. Every call goes through here, carries no student name or id, and falls back to the
// deterministic helpers (ask.js, writing.js) on any error, timeout or refusal. No provider is bundled; a provider is a
// function (task, payload) => Promise<result> supplied by a future, separately reviewed change.
import { askPassage } from "../ask.js";
import { writingFeedback } from "../writing.js";

export const PRODUCTION_HOSTS = ["thelanguagepage.com", "www.thelanguagepage.com", "eduwonderlab.com", "www.eduwonderlab.com"];
export const isReachable = ({ release = {}, hostname = "" } = {}) => release.aiEnabled === true && !PRODUCTION_HOSTS.includes(hostname);

const FALLBACK = { ask: (p) => askPassage(p.passage, p.question), write: (p) => writingFeedback(p.text, p.opts) };
const FORBIDDEN_KEYS = ["name", "studentName", "studentId", "email", "id"];
export const strip = (payload) => Object.fromEntries(Object.entries(payload || {}).filter(([k]) => !FORBIDDEN_KEYS.includes(k)));

export function createAdapter({ release = {}, hostname = "", provider = null, timeoutMs = 4000 } = {}) {
  const live = isReachable({ release, hostname }) && typeof provider === "function";
  return {
    live,
    async run(task, payload) {
      const fb = FALLBACK[task];
      if (!fb) throw new RangeError(`unknown task: ${task}`);
      const clean = strip(payload);
      if (!live) return { source: "fallback", result: fb(clean) };
      try {
        const result = await Promise.race([provider(task, clean), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs))]);
        if (!result || (task === "write" && typeof result.score !== "undefined")) throw new Error("rejected");
        return { source: "ai", result };
      } catch {
        return { source: "fallback", result: fb(clean) };
      }
    },
  };
}
