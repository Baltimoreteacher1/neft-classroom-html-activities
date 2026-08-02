import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = '/Users/joelneft/neft-classroom-html-activities';
const MANIFEST_PATHS = [
  path.join(ROOT, 'teacher-tools/do-now-generator/lessons-manifest.json'),
  path.join(ROOT, 'dist/teacher-tools/do-now-generator/lessons-manifest.json')
];

function pseudoRandomChoice(seed, max) {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  const val = parseInt(hash.substring(0, 8), 16);
  return val % max;
}

function shuffleChoices(q, seedStr) {
  if (!q.choices || !Array.isArray(q.choices) || q.choices.length < 2) return false;
  
  const origIndex = (typeof q.correctIndex === 'number') ? q.correctIndex : 0;
  const correctChoice = q.choices[origIndex];
  
  if (!correctChoice) return false;

  const targetIndex = pseudoRandomChoice(seedStr, q.choices.length);
  
  q.choices.splice(origIndex, 1);
  q.choices.splice(targetIndex, 0, correctChoice);
  q.correctIndex = targetIndex;
  return true;
}

let totalShuffled = 0;

MANIFEST_PATHS.forEach((manifestPath) => {
  if (!fs.existsSync(manifestPath)) return;
  const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (Array.isArray(data.lessons)) {
    data.lessons.forEach((lesson) => {
      const qList = Array.isArray(lesson.questions) ? lesson.questions : (lesson.warmup && Array.isArray(lesson.warmup.questions) ? lesson.warmup.questions : []);
      qList.forEach((q, idx) => {
        const seed = `${lesson.id}-donow-q-${idx}-${q.prompt || q.stem || ''}`;
        if (shuffleChoices(q, seed)) {
          totalShuffled++;
        }
      });
    });
  }

  fs.writeFileSync(manifestPath, JSON.stringify(data, null, 2), 'utf8');
});

console.log(`Shuffled choices and updated correctIndex across ${totalShuffled} questions in do-now lessons-manifest.json!`);
