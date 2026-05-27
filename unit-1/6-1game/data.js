export const LESSON_META = {
  title: 'STEM Camp: Fraction Division Quest',
  subtitle: 'Division Expressions with Fractions and Whole Numbers',
  objective: 'Model and solve division where values include fractions and whole numbers, including unit conversion.',
  vocabulary: ['unit conversion', 'fraction', 'tape diagram', 'grouping', 'quotient', 'mastery']
};

export const BADGES = [
  { id: 'first-win', name: 'First Spark', desc: 'Complete your first challenge.' },
  { id: 'combo-5', name: 'Rhythm Builder', desc: 'Reach a 5-answer combo streak.' },
  { id: 'unit-master', name: 'Time Tactician', desc: 'Hit 85% mastery in unit conversion.' },
  { id: 'boss-clear', name: 'Camp Champion', desc: 'Defeat the boss gauntlet.' }
];

export const STAGES = [
  {
    id: 'conversion-lab',
    name: 'Conversion Lab',
    mechanic: 'Drag-and-drop visual matching',
    objective: 'Match minute values to equivalent hour fractions.',
    unlockLevel: 1
  },
  {
    id: 'tape-diagram',
    name: 'Tape Diagram Forge',
    mechanic: 'Spatial logic puzzle',
    objective: 'Group fractional parts to determine how many activities fit in a session.',
    unlockLevel: 2
  },
  {
    id: 'decision-dash',
    name: 'Decision Dash',
    mechanic: 'Timed strategic decisions',
    objective: 'Solve fraction/whole-number division expressions under pressure.',
    unlockLevel: 3
  },
  {
    id: 'boss',
    name: 'Director Challenge',
    mechanic: 'Multi-stage boss gauntlet',
    objective: 'Demonstrate full lesson mastery across all concepts.',
    unlockLevel: 4
  }
];

export const CONVERSION_MATCHES = [
  { minutes: '15 min', fraction: '1/4 hr' },
  { minutes: '30 min', fraction: '1/2 hr' },
  { minutes: '45 min', fraction: '3/4 hr' },
  { minutes: '60 min', fraction: '1 hr' },
  { minutes: '90 min', fraction: '1 1/2 hr' }
];

export const TAPE_PUZZLES = [
  {
    prompt: 'A 3-hour STEM session has activities that last 3/4 hour. How many activities fit?',
    totalParts: 12,
    groupSize: 3,
    answer: 4,
    concept: 'model_reasoning',
    hint: 'Three hours split into fourths gives 12 equal parts. Group by 3 parts each.'
  },
  {
    prompt: 'A 2-hour workshop has tasks that last 1/2 hour. How many tasks fit?',
    totalParts: 4,
    groupSize: 1,
    answer: 4,
    concept: 'model_reasoning',
    hint: 'Two hours in halves makes 4 half-hour chunks.'
  },
  {
    prompt: 'A 4-hour block has sessions of 2/3 hour. How many full sessions fit?',
    totalParts: 12,
    groupSize: 2,
    answer: 6,
    concept: 'model_reasoning',
    hint: 'Convert 4 hours into twelfths and represent 2/3 as 8/12 or as groups of 2 out of 3 thirds per hour model.'
  }
];

export const DECISION_QUESTIONS = [
  {
    difficulty: 1,
    concept: 'unit_conversion',
    prompt: '45 minutes is equal to:',
    choices: ['3/4 hour', '1/3 hour', '2/3 hour', '5/4 hour'],
    answerIndex: 0,
    hint: '45 is three groups of 15; an hour is four groups of 15.'
  },
  {
    difficulty: 1,
    concept: 'fraction_division',
    prompt: '3 / (3/4) = ?',
    choices: ['4', '3', '2 1/4', '9/4'],
    answerIndex: 0,
    hint: 'Ask how many 3/4 groups are inside 3 wholes.'
  },
  {
    difficulty: 2,
    concept: 'fraction_division',
    prompt: '2 / (1/2) = ?',
    choices: ['1', '2', '4', '1/4'],
    answerIndex: 2,
    hint: 'How many halves in 2 wholes?'
  },
  {
    difficulty: 2,
    concept: 'fraction_division',
    prompt: '5 / (5/6) = ?',
    choices: ['6', '5', '25/6', '1 1/6'],
    answerIndex: 0,
    hint: 'Multiply by reciprocal: 5 x 6/5.'
  },
  {
    difficulty: 3,
    concept: 'fraction_division',
    prompt: '(7/2) / (7/8) = ?',
    choices: ['4', '2', '8/2', '7/16'],
    answerIndex: 0,
    hint: 'Multiply 7/2 by 8/7.'
  },
  {
    difficulty: 3,
    concept: 'model_reasoning',
    prompt: 'How many 3/5 groups are in 3?',
    choices: ['5', '4', '3/5', '9/5'],
    answerIndex: 0,
    hint: '3 / (3/5) = 3 x 5/3.'
  },
  {
    difficulty: 4,
    concept: 'fraction_division',
    prompt: '(9/4) / (3/8) = ?',
    choices: ['6', '3', '12/32', '2/3'],
    answerIndex: 0,
    hint: '9/4 x 8/3 simplifies strongly.'
  },
  {
    difficulty: 4,
    concept: 'unit_conversion',
    prompt: 'A 2.5-hour block split into 30-minute chunks gives:',
    choices: ['4 chunks', '5 chunks', '6 chunks', '3 chunks'],
    answerIndex: 1,
    hint: '2.5 hours is 150 minutes. 150 / 30 = 5.'
  },
  {
    difficulty: 5,
    concept: 'fraction_division',
    prompt: '(11/3) / (11/12) = ?',
    choices: ['4', '11', '1/4', '44/36'],
    answerIndex: 0,
    hint: 'Reciprocal makes the 11 cancel.'
  }
];

export const BOSS_GAUNTLET = [
  {
    concept: 'unit_conversion',
    type: 'mcq',
    prompt: 'Boss Round 1: 3 hours contains how many 45-minute activities?',
    choices: ['3', '4', '5', '6'],
    answerIndex: 1,
    hint: '3 / (3/4)'
  },
  {
    concept: 'model_reasoning',
    type: 'input',
    prompt: 'Boss Round 2: In a tape model of 2 hours split into fourths, how many 1/2-hour activities fit?',
    answerValue: '4',
    hint: 'Two hours equals eight fourths. A half-hour is two fourths.'
  },
  {
    concept: 'fraction_division',
    type: 'mcq',
    prompt: 'Boss Round 3: (5/3) / (1/6) = ?',
    choices: ['5', '10', '8', '30'],
    answerIndex: 1,
    hint: 'Divide by 1/6 means multiply by 6.'
  }
];
