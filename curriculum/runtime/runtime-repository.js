import { RUNTIME_CONFIG } from "./runtime-config.js";

const memory = new Map();

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
  return response.json();
}

export async function loadCurriculum() {
  const { manifest, workflow, supports } = RUNTIME_CONFIG.data;
  const [launchData, teacherWorkflow, supportData] = await Promise.all([
    fetchJson(manifest),
    fetchJson(workflow),
    fetchJson(supports),
  ]);
  if (!Array.isArray(launchData.lessons) || !teacherWorkflow.familyRules) {
    throw new Error("Curriculum data did not match the runtime contract.");
  }
  return { launchData, teacherWorkflow, supportData };
}

function key(name) {
  return `${RUNTIME_CONFIG.storagePrefix}:${name}`;
}

export function readLocal(name, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key(name));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return memory.has(name) ? memory.get(name) : fallback;
  }
}

export function writeLocal(name, value) {
  const safeValue = JSON.parse(JSON.stringify(value));
  memory.set(name, safeValue);
  try {
    globalThis.localStorage?.setItem(key(name), JSON.stringify(safeValue));
  } catch {
    // Memory remains the privacy-preserving fallback when storage is unavailable.
  }
  return safeValue;
}

export function appendLocal(name, value, limit = 40) {
  const items = readLocal(name, []);
  return writeLocal(name, [...items, value].slice(-limit));
}
