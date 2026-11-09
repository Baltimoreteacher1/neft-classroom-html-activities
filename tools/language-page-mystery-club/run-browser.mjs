import { spawn } from "node:child_process";

const port = Number(process.env.STORY_STUDIO_PORT || 4173);
const url = `http://127.0.0.1:${port}/language-adventures/mystery-club/`;
const server = spawn(
  "npx",
  ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  {
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk;
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk;
});
const stop = () => {
  if (!server.killed) server.kill("SIGTERM");
};
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Preview server exited early:\n${serverOutput}`);
    try {
      const response = await fetch(url);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error(`Preview server did not become ready:\n${serverOutput}`);
  const result = spawn(process.execPath, ["tools/language-page-mystery-club/journey.mjs"], {
    stdio: "inherit",
    env: { ...process.env, STORY_STUDIO_URL: url },
  });
  const code = await new Promise((resolve, reject) => {
    result.on("error", reject);
    result.on("exit", (status, signal) => resolve(signal ? 1 : (status ?? 1)));
  });
  if (code !== 0) process.exitCode = code;
} finally {
  stop();
}
