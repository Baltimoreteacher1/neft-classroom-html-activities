import { canvasDirectPayload } from "./teacher-app.js";

const byId = (id) => document.getElementById(id);
let sessionToken = "";
let connected = false;

function setStatus(message, tone = "") {
  byId("canvas-direct-status").textContent = message;
  byId("canvas-direct-status").dataset.tone = tone;
}

function setConnected(value) {
  connected = value;
  byId("sync-canvas-announcement").disabled = !value;
  byId("sync-canvas-availability").disabled = !value;
}

async function api(path, body) {
  const response = await fetch(`/api/family-connections/${path}`, {
    method: "POST",
    cache: "no-store",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Canvas connection failed.");
  return result;
}

function credentials() {
  sessionToken = byId("canvas-access-token").value.trim();
  return { courseUrl: canvasDirectPayload().courseUrl, accessToken: sessionToken };
}

async function connect() {
  setConnected(false);
  setStatus("Checking Canvas securely…");
  try {
    const result = await api("canvas-connect", credentials());
    setConnected(true);
    setStatus(`Connected to ${result.course.name} on ${result.course.host}.`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function sync(action) {
  if (!connected || !sessionToken) return setStatus("Test the Canvas connection first.", "error");
  const button = byId(action === "announcement" ? "sync-canvas-announcement" : "sync-canvas-availability");
  button.disabled = true;
  setStatus(action === "announcement" ? "Publishing the weekly Canvas announcement…" : "Syncing open meeting times to the Canvas calendar…");
  try {
    const payload = canvasDirectPayload();
    const result = await api("canvas-sync", {
      ...payload,
      accessToken: sessionToken,
      action,
    });
    setStatus(
      action === "announcement"
        ? "Weekly family update published in Canvas."
        : `${result.synced} open meeting ${result.synced === 1 ? "time" : "times"} synced to Canvas Calendar.`,
      "success",
    );
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    button.disabled = !connected;
  }
}

function forget() {
  sessionToken = "";
  byId("canvas-access-token").value = "";
  setConnected(false);
  setStatus("Canvas token forgotten for this tab.");
  byId("canvas-access-token").focus();
}

byId("test-canvas-connection").addEventListener("click", connect);
byId("sync-canvas-announcement").addEventListener("click", () => sync("announcement"));
byId("sync-canvas-availability").addEventListener("click", () => sync("availability"));
byId("forget-canvas-token").addEventListener("click", forget);
byId("canvas-url").addEventListener("input", () => setConnected(false));
byId("canvas-access-token").addEventListener("input", () => setConnected(false));
window.addEventListener("pagehide", () => {
  sessionToken = "";
});
