'use strict';
// Run from the repository root: node --test tools/fluency-guide/math-audit.test.cjs
// Loads the shared build source; browser/integration tests must separately prove
// that each standalone HTML embeds this same source and uses it correctly.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({});
const studioSource = fs.readFileSync(path.join(__dirname, 'src/studio.js'), 'utf8');
const mathStart = studioSource.indexOf('// Strict value parsing.');
const mathEnd = studioSource.indexOf('// Six self-contained investigations.');
assert.ok(mathStart >= 0 && mathEnd > mathStart, 'Shared math source boundaries must exist');
vm.runInContext(studioSource.slice(mathStart, mathEnd) +
  ';globalThis.mathApi = {parseMath, checkAnswerMatch, answerKind, hintsFor};', context);
const {parseMath, checkAnswerMatch, answerKind, hintsFor} = context.mathApi;
const teacherHTML = fs.readFileSync(path.join(__dirname, '../../curriculum/fluency/teacher/index.html'), 'utf8');
const data = JSON.parse(teacherHTML.split('<script>window.FluencyData = ')[1].split(';</script>')[0]);
const lessons = data.units.flatMap(unit => unit.lessons);
const tasks = lessons.flatMap(lesson => lesson.practice.map((problem, index) => ({lesson: lesson.id, index, problem})));
const get = (id, index) => lessons.find(lesson => lesson.id === id).practice[index];
const check = (raw, problem) => checkAnswerMatch(raw, problem.answer, problem);

for (const [input, expected] of [
  ['−7', -7], ['-2 1/4', -2.25], ['+2 3/4', 2.75], ['3/-4', -.75],
  ['-3/-4', .75], ['.375', .375], ['75 %', .75], ['-125%', -1.25],
  ['1,234.5', 1234.5], ['3 : 4', .75], ['3 to 4', .75], ['$3.50', 3.5]
]) test(`literal parser preserves value of ${JSON.stringify(input)}`, () => assert.equal(parseMath(input), expected));

for (const input of ['', '   ', null, 'NaN', 'Infinity', '1e3', '1/0', '3:0',
  '3//4', '3/4/5', '1,2', '12,34', '--7', '-+7', '− 7', '2 4/4', '2 1/0',
  '7x', '7 students', '7 because', '7+0', '7-0', '7/1+0', '7*1', '2^3',
  'Math.pow(2,3)', '(()=>7)()', 'globalThis.wasExecuted=true', '1'.repeat(121)]) {
  test(`literal parser rejects invalid or executable input ${JSON.stringify(input)}`, () => assert.ok(Number.isNaN(parseMath(input))));
}
test('no expression code was executed', () => assert.equal(context.wasExecuted, undefined));

test('full library shape and automatic/review accounting remain explicit', () => {
  assert.equal(lessons.length, 54);
  assert.equal(tasks.length, 216);
  assert.equal(data.spine.length, 12);
  assert.equal(data.spine.reduce((n, s) => n + s.drill.items.length, 0), 72);
  const counts = {};
  for (const {problem} of tasks) counts[answerKind(problem)] = (counts[answerKind(problem)] || 0) + 1;
  assert.deepEqual(counts, {sequence: 6, number: 154, interval: 1, review: 41, ratio: 2, coordinate: 7, set: 3, symbol: 2});
});

test('all 216 canonical answers are either recognized or honestly routed to review', () => {
  for (const {lesson, index, problem} of tasks) {
    const result = check(problem.answer, problem);
    if (answerKind(problem) === 'review') {
      assert.equal(result.review, true, `${lesson}/${index} must request review`);
      assert.equal(result.match, false, `${lesson}/${index} must not claim automatic correctness`);
    } else assert.equal(result.match, true, `${lesson}/${index}: ${JSON.stringify(result)}`);
  }
});
test('all 175 automatically checked tasks reject appended explanatory garbage', () => {
  for (const {lesson, index, problem} of tasks.filter(t => answerKind(t.problem) !== 'review')) {
    assert.equal(check(problem.answer + ' unrelated words', problem).match, false, `${lesson}/${index}`);
  }
});
test('all 154 numeric tasks reject opposite-sign answers', () => {
  for (const {lesson, index, problem} of tasks.filter(t => answerKind(t.problem) === 'number')) {
    const expected = parseMath(problem.answer);
    assert.ok(Number.isFinite(expected), `${lesson}/${index}: expected number must parse`);
    if (expected !== 0) assert.equal(check(String(-expected), problem).match, false, `${lesson}/${index}`);
  }
});
test('all 41 self-review tasks refuse to auto-certify either canonical or nonsense prose', () => {
  for (const {lesson, index, problem} of tasks.filter(t => answerKind(t.problem) === 'review')) {
    for (const raw of [problem.answer, 'I do not know', '42']) {
      const result = check(raw, problem);
      assert.equal(result.match, false, `${lesson}/${index}`);
      assert.equal(result.review, true, `${lesson}/${index}`);
    }
  }
});

const scenarios = [
 ['negative integer rejects missing sign', '7-1', 2, '7', false],
 ['negative integer accepts Unicode minus', '7-1', 2, '−7', true],
 ['absolute value rejects a negative distance', '7-3', 2, '-9', false],
 ['division result accepts equivalent fraction', '2-7', 3, '15/4', true],
 ['division result accepts mixed number', '2-7', 3, '3 3/4', true],
 ['result rejects an unevaluated sum', '2-7', 3, '3+3/4', false],
 ['percent form is required', '4-2', 2, '.75', false],
 ['percent target accepts percent', '4-2', 2, '75%', true],
 ['wrong percent does not become a decimal', '4-2', 2, '.75%', false],
 ['decimal form is required', '4-2', 1, '3/8', false],
 ['decimal form rejects percent', '4-4', 0, '18%', false],
 ['decimal midpoint form is required', '7-2', 0, '3/2', false],
 ['shaded fraction form is required', '3-1', 3, '.375', false],
 ['fraction words require a fraction', '4-1', 0, '.37', false],
 ['improper fraction form is required', '6-2', 0, '2 3/4', false],
 ['improper fraction accepts 11/4', '6-2', 0, '11/4', true],
 ['simplifying rejects original fraction', '6-2', 3, '18/24', false],
 ['simplifying rejects another unreduced equivalent', '6-2', 3, '6/8', false],
 ['simplifying accepts reduced fraction', '6-2', 3, '3/4', true],
 ['rounding rejects unrounded number', '3-7', 1, '7.846', false],
 ['number box rejects incorrect units', '3-6', 1, '36 feet', false],
 ['number box refuses to silently drop even matching units', '3-6', 1, '36 inches', false],
 ['area number box rejects linear units', '5-1', 1, '48 cm', false],
 ['area number box rejects currency prefix', '5-1', 1, '$48', false],
 ['requested ratio scale is preserved', '3-3', 0, '3:5', false],
 ['ratio with larger equivalent scale is rejected', '3-3', 0, '24:40', false],
 ['requested ratio accepts to notation', '3-3', 0, '12 to 20', true],
 ['requested ratio rejects reversed terms', '3-3', 0, '20:12', false],
 ['ratio units are not silently ignored', '3-3', 0, '12 feet:20 meters', false],
 ['ordered data retain repeated values', '2-1', 0, '7,12,18,25', false],
 ['ordered data reject original unsorted order', '2-1', 0, '18,7,12,7,25', false],
 ['frequency order is significant', '2-2', 1, '3,2,1', false],
 ['factor-set order is immaterial', '6-7', 1, '18,9,6,3,2,1', true],
 ['factor-set multiplicity is not ignored', '6-7', 1, '1,2,3,6,9,9,18', false],
 ['face-area set accepts another order', '5-7', 2, '15,6,10', true],
 ['coordinates preserve axis order', '3-4', 2, '(7,4)', false],
 ['coordinates preserve signs', '7-6', 2, '(3,5)', false],
 ['coordinate values accept paired parentheses', '3-4', 2, '(4,7)', true],
 ['coordinate values may omit both parentheses', '3-4', 2, '4,7', true],
 ['coordinates reject unmatched opening parentheses', '3-4', 2, '(4,7', false],
 ['coordinates reject unmatched closing parentheses', '3-4', 2, '4,7)', false],
 ['coordinate units are not silently ignored', '3-4', 2, '(4 feet,7 meters)', false],
 ['coordinate extra entries are rejected', '3-4', 2, '(4,7,0)', false],
 ['interval accepts to notation', '2-2', 0, '20 to 29', true],
 ['interval rejects subtraction as a single result', '2-2', 0, '-9', false],
 ['interval rejects changed endpoint', '2-2', 0, '20-30', false],
 ['inequality accepts >= keyboard notation', '8-4', 0, '>=', true],
 ['inequality rejects strict greater-than', '8-4', 0, '>', false],
 ['sequence of outputs preserves input order', '9-1', 1, '5,3,1', false]
];
for (const [label, id, index, raw, match] of scenarios) test(label, () => assert.equal(check(raw, get(id,index)).match, match));

test('blank answer never counts as correct or completed review', () => {
  for (const {problem} of tasks) {
    assert.equal(check('', problem).match, false);
    assert.notEqual(check('', problem).review, true);
  }
});

test('every foundation task receives two nonempty, targeted hints', () => {
  for (const {lesson, index, problem} of tasks) {
    const hints = hintsFor(problem);
    assert.equal(hints.length, 2, `${lesson}/${index}`);
    assert.ok(hints.every(h => typeof h === 'string' && h.length > 15), `${lesson}/${index}`);
    assert.ok(!hints[0].startsWith('Identify the quantities and the exact question'), `${lesson}/${index} has only fallback hints`);
  }
});
for (const [label, id, index, required, forbidden] of [
 ['inequality means is not statistical mean','8-4',0,/boundary|symbol/,/MAD|redistributes/],
 ['inverse operation is not a ratio','8-2',2,/undo/,/unit rate|\bratio\b/],
 ['multiplication inverse is not a ratio','8-3',2,/division/i,/\bratio\b|unit rate/],
 ['tickets are not coordinate ticks','9-1',2,/rate|item/,/coordinate|origin/],
 ['dot-plot shape is not plotting points','2-10',2,/frequencies|symmetric/,/ordered pair/],
 ['equal fractional intervals are not histogram bins','7-2',3,/partition|span/,/bin|entries/],
 ['tick intervals are not histogram bins','7-5',3,/scale|interval/,/bin|entries/],
 ['ordering does not tell learners to find median','2-1',0,/neighbor|arrange/,/middle|average/],
 ['counting entries does not tell learners to add them','2-8',2,/count|mark/i,/add all|combine/],
 ['percent conversion uses hundredths','4-4',0,/100/,/numerator/],
 ['percent comparisons calculate both parts','4-4',3,/each|both/,/farther right/],
 ['distribution targets every term','6-6',2,/every term/,/first.*parentheses/],
 ['negative subtraction reverses direction','7-6',0,/negative|opposite/,/place values/],
 ['total travel distance sums parts','7-3',3,/add/i,/subtract the two/],
 ['rate-distance uses rate and units','9-4',3,/rate|quantity/,/subtract the two positions/]
]) test(`hint: ${label}`, () => {
  const text = hintsFor(get(id,index)).join(' ');
  assert.match(text, required);
  assert.doesNotMatch(text, forbidden);
});
