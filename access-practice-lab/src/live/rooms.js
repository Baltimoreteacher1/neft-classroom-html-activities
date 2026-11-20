export const ROOM_SIZES = [2, 3, 4, 5, 6];
export const RECORDING_PRESETS = [5, 10, 15];
export const roomStatus = (room) => {
  const p = room.participants || [];
  if (!p.length) return "Waiting";
  if (room.state === "recording") return "Recording";
  if (room.state === "processing") return "Processing";
  if (room.recording) return "Recorded";
  if (p.some((x) => x.joined)) return "Participated";
  return "Waiting";
};
export const makeRooms = (size, groupSize, seed = 1) => {
  if (!ROOM_SIZES.includes(Number(groupSize))) throw new RangeError("Room size must be 2–6.");
  const count = Math.max(1, Math.ceil(size / groupSize));
  const participants = Array.from({ length: size }, (_, i) => ({ id: `participant-${i + 1}`, alias: `Participant ${i + 1}`, online: true, absent: false, joined: false }));
  let x = Number(seed) >>> 0 || 1;
  const shuffled = [...participants];
  for (let i = shuffled.length - 1; i > 0; i--) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; const j = (x >>> 0) % (i + 1); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  return Array.from({ length: count }, (_, i) => ({ id: `room-${i + 1}`, state: "waiting", participants: shuffled.slice(i * groupSize, (i + 1) * groupSize) }));
};
export const roomTransition = (room, event, payload = {}) => {
  const next = structuredClone(room);
  if (event === "join") { next.participants = next.participants.map((p) => p.id === payload.id ? { ...p, joined: true } : p); return next; }
  if (event === "toggle-absence") { next.participants = next.participants.map((p) => p.id === payload.id ? { ...p, absent: !p.absent } : p); return next; }
  if (event === "start" && ["waiting", "created"].includes(next.state)) { next.state = "recording"; return next; }
  if (event === "stop" && next.state === "recording") { next.state = "processing"; return next; }
  if (event === "recorded" && next.state === "processing") { next.state = "recorded"; next.recording = { status: "mock-ready", retentionDays: 30 }; return next; }
  if (event === "reset") { next.state = "waiting"; next.recording = null; next.participants = next.participants.map((p) => ({ ...p, joined: false })); return next; }
  throw new Error(`Invalid room transition: ${next.state} -> ${event}`);
};
export const consentText = Object.freeze({ en: "This room is recorded; your teacher can listen.", es: "Esta sala se graba; tu docente puede escuchar." });
