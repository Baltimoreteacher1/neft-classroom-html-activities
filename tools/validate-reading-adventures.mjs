import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

const source = JSON.parse(
  readFileSync("access-practice-lab/content/reading-room/adventures.json", "utf8"),
);
assert.equal(source.schemaVersion, 1);
assert.equal(source.editorialStatus, "authored-pending-independent-editorial-review");
const stories = source.stories;
assert.equal(stories.length, 4, "release starts with two stories in each supported grade cluster");
const ids = new Set();
const coverage = { "3-5": 0, "6-8": 0, chapters: 0, words: 0, checkpoints: 0, vocabulary: 0 };
for (const story of stories) {
  assert.match(story.id, /^[a-z0-9-]+$/);
  assert.ok(!ids.has(story.id), `duplicate adventure ${story.id}`);
  ids.add(story.id);
  assert.ok(["3-5", "6-8"].includes(story.gradeCluster));
  assert.ok(story.title && story.summary && story.characters && story.skill);
  assert.equal(story.chapters.length, 6, `${story.id} must be complete before publication`);
  coverage[story.gradeCluster] += 1;
  const chapterTitles = new Set();
  for (const [index, chapter] of story.chapters.entries()) {
    assert.ok(!chapterTitles.has(chapter.title), `${story.id}: repeated chapter title`);
    chapterTitles.add(chapter.title);
    assert.ok(chapter.teaser && chapter.paragraphs.length >= 2 && chapter.vocabulary.length >= 1);
    const words = chapter.paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 65, `${story.id} chapter ${index + 1} is too short (${words})`);
    assert.ok(chapter.prediction && chapter.question.prompt && chapter.question.why);
    assert.ok(
      chapter.question.options.length >= 3 &&
        chapter.question.answer >= 0 &&
        chapter.question.answer < chapter.question.options.length,
    );
    assert.ok(chapter.evidencePrompt && chapter.recapPrompt);
    coverage.chapters += 1;
    coverage.words += words;
    coverage.checkpoints += 1;
    coverage.vocabulary += chapter.vocabulary.length;
  }
}
assert.equal(coverage["3-5"], 2);
assert.equal(coverage["6-8"], 2);
const report = {
  generatedBy: "tools/validate-reading-adventures.mjs",
  contentVersion: source.schemaVersion,
  editorialStatus: source.editorialStatus,
  gradeClusters: { "3-5": coverage["3-5"], "6-8": coverage["6-8"] },
  stories: coverage.chapters / 6,
  completeSixChapterStories: coverage.chapters / 6,
  chapters: coverage.chapters,
  originalWords: coverage.words,
  comprehensionCheckpoints: coverage.checkpoints,
  vocabularyEntries: coverage.vocabulary,
  independentEditorialReview: "pending",
};
writeFileSync(
  "access-practice-lab/content/reading-room/adventure-coverage.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  `Reading Adventures inventory: ${stories.length} complete original stories; coverage ${JSON.stringify(coverage)}. Independent editorial review pending.`,
);
