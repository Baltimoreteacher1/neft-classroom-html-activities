import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const CHROME =
  process.env.PW_CHROMIUM_PATH ||
  ["/usr/local/bin/google-chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(existsSync);

if (!CHROME) {
  process.exit(skipExit("no Chromium executable for the Mentor Universe browser test"));
}

const MIME = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const candidate = normalize(join(ROOT, pathname));
  if (!candidate.startsWith(ROOT)) {
    response.writeHead(403).end();
    return;
  }
  let file = candidate;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.setHeader("content-type", MIME[extname(file)] || "application/octet-stream");
  createReadStream(file).pipe(response);
});

await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const port = server.address().port;
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-background-networking",
    "--remote-debugging-port=0",
    `--user-data-dir=/tmp/mentor-universe-browser-${process.pid}`,
    "--window-size=390,844",
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);

let stderr = "";
const wsUrl = await new Promise((resolveWs, rejectWs) => {
  const timer = setTimeout(() => rejectWs(new Error(`Chrome did not start:\n${stderr}`)), 10000);
  chrome.stderr.setEncoding("utf8");
  chrome.stderr.on("data", (chunk) => {
    stderr += chunk;
    const match = stderr.match(/DevTools listening on (ws:\/\/\S+)/);
    if (match) {
      clearTimeout(timer);
      resolveWs(match[1]);
    }
  });
  chrome.once("exit", (code) => rejectWs(new Error(`Chrome exited ${code}:\n${stderr}`)));
});

const socket = new WebSocket(wsUrl);
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener("open", resolveOpen, { once: true });
  socket.addEventListener("error", rejectOpen, { once: true });
});

let serial = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const waiter = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) waiter.reject(new Error(message.error.message));
  else waiter.resolve(message.result);
});

function send(method, params = {}, sessionId) {
  const id = ++serial;
  socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise((resolveSend, rejectSend) => {
    pending.set(id, { resolve: resolveSend, reject: rejectSend });
  });
}

async function evaluate(sessionId, expression) {
  const result = await send(
    "Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true },
    sessionId,
  );
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || "browser evaluation failed");
  }
  return result.result.value;
}

try {
  const target = await send("Target.createTarget", {
    url: `http://127.0.0.1:${port}/mentor-lab/`,
  });
  const attached = await send("Target.attachToTarget", {
    targetId: target.targetId,
    flatten: true,
  });
  const session = attached.sessionId;
  await send("Runtime.enable", {}, session);
  await new Promise((resolveWait) => setTimeout(resolveWait, 1500));

  const initial = await evaluate(
    session,
    `({
      title: document.title,
      weeks: document.querySelectorAll("#mu-week-grid button").length,
      lessons: document.querySelectorAll("#mu-lesson-select option").length,
      investigations: document.querySelectorAll("#mu-investigations li").length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      startButtonReachable: (() => {
        const button = document.querySelector('[data-go="2"]');
        const rect = button.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return hit === button || button.contains(hit);
      })(),
      drags: document.querySelectorAll("[draggable=true]").length
    })`,
  );
  assert.match(initial.title, /Math Mentor/);
  assert.equal(initial.weeks, 36);
  assert.equal(initial.lessons, 84);
  assert.equal(initial.investigations, 10);
  assert.equal(initial.overflow, false, "390px page has horizontal overflow");
  assert.equal(initial.startButtonReachable, true, "shared page chrome covers the start button");
  assert.equal(initial.drags, 0, "a drag-only path was introduced");

  await send(
    "Emulation.setDeviceMetricsOverride",
    { width: 360, height: 780, deviceScaleFactor: 1, mobile: false },
    session,
  );
  const compactPhone = await evaluate(
    session,
    `(() => {
      const button = document.querySelector('[data-go="2"]');
      const rect = button.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        startButtonReachable: hit === button || button.contains(hit)
      };
    })()`,
  );
  assert.equal(compactPhone.overflow, false, "360px page has horizontal overflow");
  assert.equal(compactPhone.startButtonReachable, true, "short phone dock covers the start button");
  await send(
    "Emulation.setDeviceMetricsOverride",
    { width: 390, height: 844, deviceScaleFactor: 1, mobile: false },
    session,
  );

  await evaluate(
    session,
    `(() => {
      localStorage.setItem("nt_mentor", JSON.stringify({
        version: 1, id: "benjamin-banneker", moves: ["pattern"], seenStories: ["benjamin-banneker"], lang: "es"
      }));
      return true;
    })()`,
  );
  await send("Page.reload", {}, session);
  await new Promise((resolveWait) => setTimeout(resolveWait, 1200));
  const migration = await evaluate(session, `JSON.parse(localStorage.getItem("nt_mentor"))`);
  assert.equal(migration.id, "benjamin-banneker");
  assert.deepEqual(migration.moves, ["pattern"]);
  assert.equal(migration.version, 2);
  assert.ok(migration.studio && migration.journey);
  const spanish = await evaluate(
    session,
    `({
      lang: document.documentElement.lang,
      prompt: NTMentorUniverse.interactionFor(NTMentorRoster.mentors[0], "es").prompt,
      accepts: NTMentorUniverse.checkInteraction(
        NTMentorRoster.mentors[0],
        NTMentorUniverse.interactionFor(NTMentorRoster.mentors[0], "es").answer,
        "es"
      ).correct,
      moment: NTMentorUniverse.momentFor(__NT_MENTOR_LESSONS[0], "es").text
    })`,
  );
  assert.equal(spanish.lang, "es");
  assert.equal(spanish.accepts, true);
  assert.match(spanish.moment, /¿|Pausa|Haz|Prueba|Sigue|Lleva|Conecta/);

  const journey = await evaluate(
    session,
    `(() => {
      document.querySelector('[data-lang="en"]').click();
      document.querySelector("#ml-speak-toggle").click();
      const readAloud = document.querySelector("#ml-speak-toggle").getAttribute("aria-pressed");
      document.querySelector("#ml-speak-toggle").click();
      document.querySelector('[data-go="2"]').click();
      document.querySelector("[data-lab]").click();
      document.querySelector("[data-mentor]").click();
      const input = document.querySelector("[data-mu-profile-answer]");
      const mentor = input.getAttribute("data-mu-profile-answer");
      const task = NTMentorUniverse.interactionFor(NTMentorRoster.getMentor(mentor), "en");
      input.value = task.answer;
      document.querySelector("[data-mu-profile-check]").click();
      document.querySelector("#mu-studio-move").value = "Pause and label what I know.";
      document.querySelector("#mu-studio-when").value = "Before I choose an operation.";
      document.querySelector("#mu-studio-form").requestSubmit();
      document.querySelector('input[name="mu-expression"][value="7(t-24)"]').click();
      document.querySelector('[data-mu-check="archive-expression"]').click();
      const misconception = document.querySelector("#mu-archive-feedback").textContent;
      document.querySelector("#mu-revised-expression").value = "7t - 24";
      document.querySelector("#mu-evaluate").value = "60";
      document.querySelector("#mu-transfer").value = "5m - 18";
      document.querySelector('[data-mu-check="archive-transfer"]').click();
      const state = JSON.parse(localStorage.getItem("nt_mentor"));
      return {
        profile: document.querySelector(".mu-profile-feedback").textContent,
        misconception,
        archive: document.querySelector("#mu-archive-feedback").textContent,
        studio: state.studio.move,
        completed: !!state.journey.experiences["discovery-archive-6-5"],
        readAloud
      };
    })()`,
  );
  assert.match(journey.profile, /Correct/);
  assert.match(journey.misconception, /seven coupons/);
  assert.match(journey.archive, /Archive complete/);
  assert.equal(journey.studio, "Pause and label what I know.");
  assert.equal(journey.completed, true);
  assert.equal(journey.readAloud, "true");

  console.log(
    "mentor-universe browser: phone render, migration, profile, studio, and 6-5 archive PASS",
  );
} finally {
  try {
    await send("Browser.close");
  } catch {
    chrome.kill("SIGTERM");
  }
  socket.close();
  server.close();
}
