/**
 * Generate editable PPTX notebook decks (lessons/<id>/slides.pptx) from each
 * lesson's config.json. Opens fully editable in Google Slides / PowerPoint.
 *
 * Usage:
 *   node scripts/generate-pptx.mjs            # all lessons
 *   node scripts/generate-pptx.mjs 1-1 4-2    # specific lessons
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pptxgen from 'pptxgenjs';
import { buildPptxDeck } from './lib/pptx-deck.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const lessonsDir = path.join(root, 'lessons');

function findErrorProblem(data) {
  const pools = [
    ...(data.practice?.extending || []),
    ...(data.practice?.onLevel || []),
    ...(data.practice?.approaching || []),
    ...(data.practice?.optional || []),
  ];
  return pools.find((p) => p.type === 'error-analysis') || null;
}

function independentProblems(data) {
  const pools = [
    ...(data.practice?.onLevel || []),
    ...(data.practice?.approaching || []),
    ...(data.practice?.optional || []),
    ...(data.practice?.extending || []),
  ];
  const stems = pools
    .filter((p) => p.type !== 'error-analysis' && (p.stem || p.prompt))
    .map((p) => p.stem || p.prompt);
  return [...new Set(stems)].slice(0, 3);
}

function extractContent(lessonId, data) {
  const ci = data.launch?.conceptIntro || {};
  const err = findErrorProblem(data) || {};
  const exit = data.reflect?.exitTicket || {};
  // Full discussion objects (phase, question, wordBank, sentenceStems) for the
  // per-phase Turn & Talk slides; `talks` keeps the question-only list used by
  // the inline "Talk It Over" boxes on the work slides.
  const discussions = (data.turnAndTalk || [])
    .filter((t) => t && t.question)
    .map((t) => ({
      phase: t.phase || '',
      question: t.question,
      wordBank: Array.isArray(t.wordBank) ? t.wordBank : [],
      sentenceStems: Array.isArray(t.sentenceStems) ? t.sentenceStems : [],
    }));
  const talks = discussions.map((t) => t.question);

  const explore = data.explore || {};
  const sortCats = (explore.categories || []).map((c) =>
    typeof c === 'string' ? { label: c } : { label: c.label || String(c) }
  );
  const sortItems = (explore.items || explore.cards || []).map((it) => ({
    text: it.text || String(it),
  }));

  return {
    lessonId,
    unit: data.unit || 1,
    standard: data.standard || '6th Grade',
    topic: data.title || 'Math Lesson',
    themeEmoji: data.themeEmoji || '📘',
    contentObj: data.contentObjective || 'Understand the key math idea in this lesson.',
    langObj: data.languageObjective || 'Explain my thinking using today\'s math vocabulary.',

    launchBadge: data.launch?.badge || 'Scenario',
    launchNarrative: data.launch?.narrative || 'Look closely at the prompt and record what you observe.',
    noticeStems: data.launch?.noticePrompts || [],
    wonderStems: data.launch?.wonderPrompts || [],

    conceptHeading: ci.heading || 'Today\'s Big Idea',
    conceptText: ci.intro || 'Review the core concept of this lesson.',
    keyIdea: ci.keyIdea || '',
    iDoLines: ci.iDo?.lines || [],
    weDoLines: ci.weDo?.lines || [],

    vocab: data.vocabulary || [],

    sortInstructions: explore.instructions || explore.label || 'Sort each card into the correct group.',
    sortItems,
    sortCats,

    error: {
      title: err.title || 'Find the Mistake',
      steps: err.workedExample || [],
      errorStep: err.errorStep || 0,
      correctWork: err.correctWork || '',
    },

    practice: independentProblems(data),

    discussions,
    talk1: talks[0] || '',
    talk2: talks[1] || '',
    talk3: talks[2] || '',

    exit: {
      tier1: exit.stem || 'Solve the problem and choose the correct answer.',
      choices: exit.choices || [],
      tier2: data.reflect?.exitTicketOpen || data.reflect?.openPrompt || 'Explain how you know your answer is correct. Use at least one vocabulary word.',
    },
  };
}

async function generateOne(id) {
  const configPath = path.join(lessonsDir, id, 'config.json');
  const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const content = extractContent(id, data);

  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'NEFT_169', width: 10, height: 5.625 });
  pptx.layout = 'NEFT_169';
  pptx.author = 'Neft Teacher';
  pptx.company = 'Neft Teacher';
  pptx.title = `Lesson ${id}: ${data.title || 'Math Lesson'}`;
  pptx.subject = data.standard || '';

  buildPptxDeck(pptx, content);

  const outPath = path.join(lessonsDir, id, 'slides.pptx');
  await pptx.writeFile({ fileName: outPath });
  return outPath;
}

async function main() {
  const args = process.argv.slice(2);
  const lessons = args.length
    ? args
    : fs
        .readdirSync(lessonsDir)
        .filter((d) => /^(\d+)-(\d+)(-flagship)?$/.test(d))
        .filter((d) => fs.existsSync(path.join(lessonsDir, d, 'config.json')));

  let ok = 0;
  for (const id of lessons) {
    try {
      await generateOne(id);
      ok += 1;
    } catch (e) {
      console.error(`Failed PPTX for ${id}:`, e.message);
    }
  }
  console.log(`Generated editable slides.pptx for ${ok}/${lessons.length} lessons.`);
}

main();
