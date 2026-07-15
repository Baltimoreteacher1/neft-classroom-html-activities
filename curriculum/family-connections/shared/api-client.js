const ROOT = "/api/family-connections";

export class PublishingError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "PublishingError";
    this.status = status;
    this.code = code;
  }
}

async function call(path, init = {}) {
  const response = await fetch(`${ROOT}/${path}`, {
    credentials: "same-origin",
    headers: { accept: "application/json", ...init.headers },
    ...init,
  });
  let body = {};
  try {
    body = await response.json();
  } catch {}
  if (!response.ok) {
    throw new PublishingError(body.error || `Publishing request failed (${response.status}).`, response.status, body.error);
  }
  return body;
}

export async function loadDraft() {
  return (await call("draft")).draft;
}

export async function loadHistory() {
  return (await call("history")).history;
}

export async function saveDraft(draft) {
  return (
    await call("draft", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    })
  ).draft;
}

export async function publishDraft() {
  return (await call("publish", { method: "POST" })).published;
}
