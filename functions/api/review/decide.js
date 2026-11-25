/* POST /api/review/decide { blockId, dimension, lang?, state, comment?, reviewer: { name, role, actor: "human" } }
 * One human decision. The server loads the block, recomputes its content hash, stamps today's date and
 * appends a hash-chained event; nothing about the hash or date is read from the request. */
import { handler } from "../../_lib/http.js";
import { reviewRoute } from "../../_lib/review/endpoint.js";
import { decideOne } from "../../_lib/review/service-decide.js";

export const onRequest = handler(
  reviewRoute({
    methods: ["POST"],
    maxBodyBytes: 4096,
    handle: ({ env, body }) => decideOne({ db: env.DB, body: body ?? {}, now: Date.now() }),
  }),
);
