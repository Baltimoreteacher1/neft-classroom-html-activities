/* Reasoning Studio coach client. One bounded request per press: it sends the
 * student's own writing, language, scaffold level and a structural board digest
 * (types and fill state, never typed text). The server returns one gap and one
 * question, never a score or an answer. */
(function (root) {
  "use strict";

  const S = root.MWRStore;
  const MAX_TURNS = 2;

  function coachDigest(d) {
    return {
      objectCount: d.objectCount,
      strokeCount: d.strokeCount,
      items: (d.items || []).slice(0, 12).map((i) => ({ type: i.type, filled: i.filled })),
    };
  }

  /* Numbers a teacher has asked the coach never to say (class setting). */
  function avoidNumbers() {
    return String(S.getPref("avoidNumbers", ""))
      .split(/[,\s]+/)
      .map((v) => v.trim())
      .filter((v) => /^-?\d+(\.\d+)?$/.test(v))
      .slice(0, 10);
  }

  /* Resolves with the server result, or rejects with an Error whose message is
   * the server's error code ("rate-limited", "unavailable", ...). */
  async function request(input) {
    if (input.turn > MAX_TURNS) throw new Error("turn-limit");
    const reply = await fetch("/api/reasoning/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        standard: input.standard,
        skill: input.skill,
        prompt: input.prompt,
        response: input.response,
        misconception: input.misconception || "",
        language: input.language,
        level: Number(input.level),
        digest: coachDigest(input.digest),
        turn: input.turn,
        followup: input.turn === 2 ? input.followup : "",
        avoidNumbers: avoidNumbers(),
      }),
    });
    const result = await reply.json().catch(() => null);
    if (!reply.ok || !result || !result.ok)
      throw new Error(result && result.error ? result.error : "unavailable");
    return result;
  }

  root.MWRCoach = Object.freeze({ request, coachDigest, avoidNumbers, MAX_TURNS });
})(window);
