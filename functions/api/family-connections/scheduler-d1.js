import { createMemorySchedulerStore } from "./scheduler.js";

async function ensureSchema(db) {
  await db
    .prepare(`CREATE TABLE IF NOT EXISTS family_meeting_scheduler_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      state_json TEXT NOT NULL,
      revision INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    )`)
    .run();
  await db
    .prepare(
      "INSERT OR IGNORE INTO family_meeting_scheduler_state (id,state_json,revision,updated_at) VALUES (1,?,0,?)",
    )
    .bind(JSON.stringify({ availabilityRules: [], slots: [], requests: [] }), new Date().toISOString())
    .run();
}

export function createD1SchedulerStore(db) {
  async function read() {
    await ensureSchema(db);
    const row = await db
      .prepare("SELECT state_json, revision FROM family_meeting_scheduler_state WHERE id = 1")
      .first();
    return { ...JSON.parse(row.state_json), revision: row.revision };
  }

  async function mutate(method, ...args) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const state = await read();
      const memory = createMemorySchedulerStore(state);
      const result = await memory[method](...args);
      const next = memory.exportState();
      const saved = await db
        .prepare(
          "UPDATE family_meeting_scheduler_state SET state_json = ?, revision = ?, updated_at = ? WHERE id = 1 AND revision = ?",
        )
        .bind(JSON.stringify(next), state.revision + 1, new Date().toISOString(), state.revision)
        .run();
      if (saved.meta?.changes === 1) return result;
    }
    const error = new Error("The schedule changed. Please try again.");
    error.status = 409;
    throw error;
  }

  return {
    async listPublic() {
      const state = await read();
      return createMemorySchedulerStore(state).listPublic();
    },
    async dashboard() {
      const state = await read();
      return createMemorySchedulerStore(state).dashboard();
    },
    createRule: (input) => mutate("createRule", input),
    updateRule: (input) => mutate("updateRule", input),
    deleteRule: (id) => mutate("deleteRule", id),
    refreshSlots: () => mutate("refreshSlots"),
    createSlot: (input) => mutate("createSlot", input),
    requestSlot: (input) => mutate("requestSlot", input),
    decide: (id, action) => mutate("decide", id, action),
    cancelSlot: (id) => mutate("cancelSlot", id),
    invite: (input) => mutate("invite", input),
    respond: (meeting, action) => mutate("respond", meeting, action),
  };
}
