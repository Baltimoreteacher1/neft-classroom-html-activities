import assert from "node:assert/strict";
import { WORDS } from "../access-practice-lab/src/content/wordlab-words.js";
import {
  checkRelation,
  explanationFeedback,
  NETWORKS,
} from "../access-practice-lab/src/views/wordlab-network.js";

for (const network of NETWORKS) {
  assert.ok(network.links.length >= 3, `${network.id}: connected ideas`);
  for (const term of [network.center, ...network.links.map((link) => link.word)]) {
    assert.ok(
      WORDS.some((word) => word.w === term && (word.b === network.band || word.b === "both")),
      `${network.id}: ${term} must be available in band ${network.band}`,
    );
  }
  for (const link of network.links) {
    assert.equal(checkRelation(network, link.word, link.relation).correct, true);
    assert.equal(
      checkRelation(
        network,
        link.word,
        network.choices.find((choice) => choice !== link.relation),
      ).correct,
      false,
    );
  }
  assert.equal(explanationFeedback("", network).ready, false);
  assert.equal(
    explanationFeedback(`${network.center} and ${network.links[0].word}`, network).ready,
    false,
  );
  assert.equal(
    explanationFeedback(
      `${network.center} helps ${network.links[0].word} because they connect.`,
      network,
    ).ready,
    true,
  );
}
console.log(`wordlab-network: ${NETWORKS.length} authored maps and feedback rules passed`);
