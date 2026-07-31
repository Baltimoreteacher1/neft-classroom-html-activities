/* =============================================================================
 * The Forge — console + player (curriculum/forge/)
 * -----------------------------------------------------------------------------
 * Two modes on one URL:
 *
 *   /curriculum/forge/?id=<id>   Student/teacher view. Fetches the stored config
 *                                from GET /api/forge?id= (no auth) and boots it
 *                                on the REAL production lesson engine, so the
 *                                forged lesson gets hint ladders, vocab pop-ups,
 *                                Spanish, telemetry and learning supports for
 *                                free — the same engine /lessons/3-1/ runs.
 *
 *   /curriculum/forge/           Teacher console. Pick a standard (and the
 *                                misconception the class keeps making), press
 *                                the button, wait ~30-60s, get a share link.
 *
 * The curriculum map links here as ?standard=6.AT.2&tag=rate-not-per-one; those
 * params prefill the form but never auto-submit — generation costs money, so a
 * teacher always presses the button.
 *
 * This file is a Vite rollup entry (build.rollupOptions.input →
 * "curriculum-forge": curriculum/forge/index.html), which is what makes the
 * @engine alias below resolve. Page styling lives in forge.css, linked
 * absolutely from index.html so it stays out of the global CSS bundle.
 * ========================================================================== */

import { bootLesson } from "@engine/core/lesson-renderer.js";

const API = "/api/forge";
const NERVOUS_SYSTEM = "/data/curriculum-nervous-system.json";
const KEY_STORAGE = "neft.teacher.key";

const $ = (id) => document.getElementById(id);

// Scrolling is a nicety, never a requirement — guarded so a missing
// scrollIntoView (older engines, test harnesses) can never break the flow.
function scrollTo(el, block) {
  if (el && typeof el.scrollIntoView === "function") {
    el.scrollIntoView({ behavior: "smooth", block });
  }
}

/* ── Teacher key (device-local, never sent anywhere but /api/forge) ────────── */

function readKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || "";
  } catch (_e) {
    return "";
  }
}

function writeKey(value) {
  try {
    if (value) localStorage.setItem(KEY_STORAGE, value);
    else localStorage.removeItem(KEY_STORAGE);
  } catch (_e) {
    /* private mode — the key just will not persist */
  }
}

/* ── Player: ?id=<id> ─────────────────────────────────────────────────────── */

function fatal(message, detail) {
  const app = $("app");
  app.hidden = false;
  app.innerHTML = "";
  const box = document.createElement("div");
  box.className = "forge-fatal";
  box.setAttribute("role", "alert");
  const h = document.createElement("h1");
  h.textContent = message;
  box.append(h);
  if (detail) {
    const p = document.createElement("p");
    p.textContent = detail;
    box.append(p);
  }
  const back = document.createElement("p");
  back.innerHTML = '<a href="/curriculum/forge/">← Back to the Forge</a>';
  box.append(back);
  app.append(box);
}

async function playForgedLesson(id) {
  const console_ = $("forge-console");
  if (console_) console_.remove();
  const app = $("app");
  app.hidden = false;
  app.innerHTML = '<p class="forge-loading">Loading the lesson…</p>';

  let res;
  try {
    res = await fetch(`${API}?id=${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
    });
  } catch (_e) {
    fatal("Could not reach the lesson server.", "Check your connection and reload the page.");
    return;
  }
  const data = await res.json().catch(() => null);

  if (res.status === 404) {
    fatal("That forged lesson was not found.", `No lesson is stored under the id "${id}".`);
    return;
  }
  if (!res.ok || !data || !data.ok || !data.config) {
    fatal(
      "That lesson could not be opened.",
      data && data.error === "backend-not-configured"
        ? "The lesson database is not connected on this deployment."
        : `The server answered ${res.status}.`,
    );
    return;
  }

  document.title = `${data.config.title || "Forged lesson"} — Neft Teacher`;
  app.innerHTML = "";
  bootLesson(data.config);
}

/* ── Console: standards + misconceptions ──────────────────────────────────── */

const graph = { standards: [], misconceptions: {} };

async function loadGraph() {
  const res = await fetch(NERVOUS_SYSTEM, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`nervous system responded ${res.status}`);
  const data = await res.json();
  graph.standards = Array.isArray(data.nodes) ? data.nodes : [];
  graph.misconceptions = data.misconceptions || {};
}

function fillStandardPicker(selected) {
  const select = $("forge-standard");
  select.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose a standard…";
  select.append(placeholder);

  const byDomain = new Map();
  for (const node of graph.standards) {
    const name = node.domainName || node.domain || "Other";
    if (!byDomain.has(name)) byDomain.set(name, []);
    byDomain.get(name).push(node);
  }
  for (const [domain, nodes] of byDomain) {
    const group = document.createElement("optgroup");
    group.label = domain;
    for (const node of nodes) {
      const option = document.createElement("option");
      option.value = node.id;
      option.textContent = `${node.id} — ${node.shortLabel || node.label || ""}`;
      group.append(option);
    }
    select.append(group);
  }
  if (selected && graph.standards.some((n) => n.id === selected)) select.value = selected;
}

function fillTagPicker(standardId, selected) {
  const select = $("forge-tag");
  select.innerHTML = "";
  const node = graph.standards.find((n) => n.id === standardId);
  const tags = (node && Array.isArray(node.misconceptions) ? node.misconceptions : []).filter(
    (t) => graph.misconceptions[t],
  );

  const none = document.createElement("option");
  none.value = "";
  none.textContent = tags.length
    ? "No specific misconception"
    : "This standard has no tagged misconceptions";
  select.append(none);

  for (const tag of tags) {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = graph.misconceptions[tag].label || tag;
    select.append(option);
  }
  select.disabled = tags.length === 0;
  if (selected && tags.includes(selected)) select.value = selected;
}

/* ── Console: honest progress ─────────────────────────────────────────────── */

// The API answers in one shot with no streaming, so the stage list is the
// server's known sequence timed from the request; the seconds counter is the
// only measured value and index.html says so out loud.
const STAGE_AT = [0, 4, 26, 40];

function createProgress() {
  const panel = $("forge-progress");
  const elapsedEl = $("forge-elapsed");
  const statusEl = $("forge-status");
  const stageEls = [...$("forge-stages").querySelectorAll("li")];
  let started = 0;
  let timer = 0;

  const paint = () => {
    const seconds = Math.floor((Date.now() - started) / 1000);
    elapsedEl.textContent = String(seconds);
    let current = 0;
    STAGE_AT.forEach((at, i) => {
      if (seconds >= at) current = i;
    });
    stageEls.forEach((li, i) => {
      li.classList.toggle("is-current", i === current);
      li.classList.toggle("is-done", i < current);
    });
    if (seconds > 90) {
      statusEl.textContent = "Still working. A long lesson on a busy model can take two minutes.";
    } else if (seconds > 55) {
      statusEl.textContent = "Taking a little longer than usual — the model is still writing.";
    } else {
      statusEl.textContent = "Waiting for the Forge to answer.";
    }
  };

  return {
    start() {
      started = Date.now();
      panel.hidden = false;
      panel.setAttribute("aria-busy", "true");
      paint();
      timer = window.setInterval(paint, 1000);
    },
    stop() {
      window.clearInterval(timer);
      panel.setAttribute("aria-busy", "false");
      panel.hidden = true;
      stageEls.forEach((li) => li.classList.remove("is-current", "is-done"));
    },
  };
}

/* ── Console: errors, honestly ────────────────────────────────────────────── */

function clearError() {
  const box = $("forge-error");
  box.hidden = true;
  box.innerHTML = "";
}

function showError(title, detail, list) {
  const box = $("forge-error");
  box.innerHTML = "";
  const h = document.createElement("h2");
  h.textContent = title;
  box.append(h);
  if (detail) {
    const p = document.createElement("p");
    p.textContent = detail;
    box.append(p);
  }
  if (Array.isArray(list) && list.length) {
    const ul = document.createElement("ul");
    for (const entry of list) {
      const li = document.createElement("li");
      li.textContent = entry;
      ul.append(li);
    }
    box.append(ul);
  }
  box.hidden = false;
  scrollTo(box, "nearest");
}

// Map an API failure onto something a teacher can act on. A visible quality gate
// (422) is more useful than a silent one, so its errors are shown in full.
function reportFailure(status, data) {
  const error = (data && data.error) || "";
  if (status === 401) {
    writeKey("");
    revealKeyField(true);
    showError(
      "That teacher key was not accepted.",
      "Check the key and try again. The one stored on this device has been cleared.",
    );
    return;
  }
  if (status === 503) {
    if (error === "ai-not-configured") {
      showError(
        "AI generation is not configured on this deployment (ANTHROPIC_API_KEY missing).",
        "Everything else on the site keeps working; only the Forge needs that key.",
      );
    } else if (error === "backend-not-configured") {
      showError(
        "The lesson database is not connected on this deployment.",
        "The Forge needs the D1 binding to store what it generates.",
      );
    } else {
      showError(
        "The Forge is not configured on this deployment (TEACHER_KEY missing).",
        (data && data.message) || "",
      );
    }
    return;
  }
  if (status === 422) {
    showError(
      "The generated lesson failed the quality gate, so it was thrown away.",
      "Nothing was saved and nothing was shared. Press the button again — the same standard usually passes on a second run.",
      (data && data.errors) || [],
    );
    return;
  }
  if (status === 429) {
    showError("Too many requests right now.", "Wait a minute, then try again.");
    return;
  }
  if (status === 400) {
    showError(
      "The Forge could not use that request.",
      error === "unknown-standard"
        ? "That standard is not in the curriculum nervous system."
        : error === "unknown-tag"
          ? "That misconception tag is not one the curriculum knows about."
          : `The server reported: ${error || "bad request"}.`,
    );
    return;
  }
  showError(
    "The Forge could not build that lesson.",
    `The server answered ${status}${error ? ` (${error})` : ""}. Nothing was saved.`,
  );
}

/* ── Console: share panel + forged-lesson list ────────────────────────────── */

function studentUrl(id) {
  return `${location.origin}/curriculum/forge/?id=${encodeURIComponent(id)}`;
}

function showShare(id, config) {
  const url = studentUrl(id);
  $("forge-share-title").textContent = config && config.title ? config.title : "";
  $("forge-share-url").value = url;
  $("forge-open").href = `?id=${encodeURIComponent(id)}`;
  $("forge-share").hidden = false;
  // The address bar now IS the shareable student link: reloading this page (or
  // pressing "Open the lesson") runs the forged lesson on the real engine.
  history.replaceState(null, "", `?id=${encodeURIComponent(id)}`);
  scrollTo($("forge-share"), "start");
}

async function refreshList() {
  const key = readKey();
  if (!key) return;
  const body = $("forge-list-body");
  let res;
  try {
    res = await fetch(`${API}?list=1`, { headers: { "x-teacher-key": key } });
  } catch (_e) {
    return;
  }
  if (!res.ok) return;
  const data = await res.json().catch(() => null);
  const lessons = (data && data.lessons) || [];
  body.innerHTML = "";
  if (!lessons.length) {
    const p = document.createElement("p");
    p.className = "forge-help";
    p.textContent = "Nothing forged yet on this deployment.";
    body.append(p);
    $("forge-list").hidden = false;
    return;
  }
  const ul = document.createElement("ul");
  ul.className = "forge-list-items";
  for (const row of lessons) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `?id=${encodeURIComponent(row.id)}`;
    a.textContent = row.title || row.id;
    const meta = document.createElement("span");
    meta.className = "forge-list-meta";
    const when = row.created_at ? new Date(row.created_at).toLocaleString() : "";
    meta.textContent = [row.standard, row.tag, when].filter(Boolean).join(" · ");
    li.append(a, meta);
    ul.append(li);
  }
  body.append(ul);
  $("forge-list").hidden = false;
}

/* ── Console: wiring ──────────────────────────────────────────────────────── */

function revealKeyField(force) {
  const stored = readKey();
  const show = force || !stored;
  $("forge-key-field").hidden = !show;
  $("forge-forget-key").hidden = show || !stored;
  if (show) $("forge-key").value = "";
}

function currentKey() {
  const typed = $("forge-key").value.trim();
  if (typed) {
    writeKey(typed);
    return typed;
  }
  return readKey();
}

async function submitForge(progress) {
  clearError();
  $("forge-share").hidden = true;

  const standard = $("forge-standard").value;
  if (!standard) {
    showError("Pick a standard first.", "The Forge builds one lesson for one standard.");
    $("forge-standard").focus();
    return;
  }
  const key = currentKey();
  if (!key) {
    revealKeyField(true);
    showError("A teacher key is needed.", "Generating a lesson costs money, so it is gated.");
    $("forge-key").focus();
    return;
  }
  revealKeyField(false);

  const payload = {
    standard,
    tag: $("forge-tag").value || "",
    difficulty: document.querySelector('input[name="difficulty"]:checked').value,
    focus: $("forge-focus").value.trim(),
  };

  const submit = $("forge-submit");
  submit.disabled = true;
  submit.textContent = "Forging…";
  progress.start();

  let res = null;
  let data = null;
  try {
    res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-teacher-key": key },
      body: JSON.stringify(payload),
    });
    data = await res.json().catch(() => null);
  } catch (_e) {
    progress.stop();
    submit.disabled = false;
    submit.textContent = "Forge the lesson";
    showError("Could not reach the Forge.", "Check your connection and try again.");
    return;
  }

  progress.stop();
  submit.disabled = false;
  submit.textContent = "Forge the lesson";

  if (!res.ok || !data || !data.ok) {
    reportFailure(res.status, data);
    return;
  }
  showShare(data.id, data.config);
  refreshList();
}

async function initConsole(params) {
  const console_ = $("forge-console");
  console_.hidden = false;
  // Console-only page chrome. Deliberately a class and not a bare `body` rule in
  // forge.css: in ?id= mode this same document is owned by the lesson engine,
  // which sets its own body classes and design system.
  document.body.classList.add("forge-page");

  revealKeyField(false);

  try {
    await loadGraph();
    fillStandardPicker(params.get("standard") || "");
    fillTagPicker($("forge-standard").value, params.get("tag") || "");
  } catch (_e) {
    showError(
      "Could not load the list of standards.",
      "The curriculum nervous system file did not load, so the picker is empty. Reload the page.",
    );
  }

  $("forge-standard").addEventListener("change", () => {
    fillTagPicker($("forge-standard").value, "");
  });

  const progress = createProgress();
  $("forge-form").addEventListener("submit", (event) => {
    event.preventDefault();
    submitForge(progress);
  });

  $("forge-forget-key").addEventListener("click", () => {
    writeKey("");
    revealKeyField(true);
    $("forge-key").focus();
  });

  $("forge-copy").addEventListener("click", async () => {
    const input = $("forge-share-url");
    const status = $("forge-copy-status");
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = "Link copied.";
    } catch (_e) {
      input.select();
      status.textContent = "Press Ctrl/Cmd + C to copy the selected link.";
    }
  });

  $("forge-again").addEventListener("click", () => {
    $("forge-share").hidden = true;
    history.replaceState(null, "", location.pathname);
    $("forge-standard").focus();
  });

  refreshList();
}

/* ── Entry ────────────────────────────────────────────────────────────────── */

const params = new URLSearchParams(location.search);
const id = (params.get("id") || "").trim();
if (id) playForgedLesson(id);
else initConsole(params);
