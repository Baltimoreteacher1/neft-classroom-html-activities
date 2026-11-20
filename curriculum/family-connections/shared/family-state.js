const NIGHT_KEY = "hw_family_nights_v1";
const STORAGE_KEY = "ewl-family-math-studio-v1";
const availableStorage = () => { try { return globalThis.localStorage; } catch { return null; } };

export function weekStartFor(date = new Date()) {
  const day = new Date(date);
  day.setHours(12, 0, 0, 0);
  if (day.getDay() === 6) day.setDate(day.getDate() + 2);
  else if (day.getDay() === 0) day.setDate(day.getDate() + 1);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

export function readWeek(weekStart, storage = availableStorage()) {
  try {
    const value = JSON.parse(storage.getItem(`ws:v1:${weekStart}`) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch { return {}; }
}

export function writeNight(date, storage = availableStorage()) {
  setNight(date, true, storage);
}

export function setNight(date, checked, storage = availableStorage()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return;
  try {
    const start = weekStartFor(new Date(`${date}T12:00:00`));
    const state = readWeek(start, storage);
    for (const field of ["name", "period", "signature", "signedOn", "initials"]) delete state[field];
    state.done = { ...(state.done || {}), [date]: Boolean(checked) };
    storage.setItem(`ws:v1:${start}`, JSON.stringify(state));
    const nights = JSON.parse(storage.getItem(NIGHT_KEY) || "[]");
    if (Array.isArray(nights)) {
      const updated = checked ? [...new Set([...nights, date])].sort().slice(-120) : nights.filter((night) => night !== date);
      storage.setItem(NIGHT_KEY, JSON.stringify(updated));
    }
  } catch { /* local storage is optional */ }
}

export function markToday(storage = availableStorage(), date = new Date()) {
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  writeNight(iso, storage);
}

export function recordStudioSave(storage = availableStorage(), date = new Date()) {
  // Read the existing value without changing its shape or migrating the key.
  try { JSON.parse(storage.getItem(STORAGE_KEY) || "{}"); } catch { /* optional */ }
  markToday(storage, date);
}
