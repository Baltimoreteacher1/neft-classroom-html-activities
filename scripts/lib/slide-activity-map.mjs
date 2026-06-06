/**
 * Maps unit/standard to primary interactive activity variant per lesson.
 * Ensures varied activities — NOT the same template every lesson.
 */

export const ACTIVITY_VARIANTS = {
  'ratio-table': { label: 'Ratio Table Builder', icon: '📊', badge: 'RATIO TABLE' },
  'drag-sort-ratios': { label: 'Equivalent Ratio Sort', icon: '↕️', badge: 'DRAG-SORT' },
  'power-match': { label: 'Power Matching', icon: '⚡', badge: 'POWER MATCH' },
  'expression-simplify': { label: 'Expression Simplify', icon: '🔢', badge: 'SIMPLIFY' },
  'area-grid': { label: 'Area Grid Shading', icon: '📐', badge: 'GRID SHADE' },
  'net-fold': { label: 'Net Fold Explorer', icon: '📦', badge: 'NET FOLD' },
  'stat-sort': { label: 'Statistical vs Not Sort', icon: '📈', badge: 'CARD SORT' },
  'treasure-hunt': { label: 'Coordinate Treasure Hunt', icon: '🗺️', badge: 'TREASURE HUNT' },
  'vocab-match': { label: 'Vocabulary Match', icon: '✅', badge: 'VOCAB MATCH' },
  'error-analysis': { label: 'Error Analysis', icon: '⚠️', badge: 'ERROR ANALYSIS' },
  'choice-board': { label: 'Choice Board', icon: '🎯', badge: 'CHOICE BOARD' },
  'think-write': { label: 'Think–Write–Respond', icon: '✍️', badge: 'THINK-WRITE' },
  'goal-tracker': { label: 'Goal Tracker', icon: '🏆', badge: 'GOAL TRACKER' },
};

export function getActivityPlan(unit, standard, lessonId) {
  const std = (standard || '').toUpperCase();
  const u = Number(unit) || 0;

  let primary = 'vocab-match';
  let secondary = 'error-analysis';
  let explore = 'choice-board';

  if (std.includes('6.RP.') || u === 3) {
    primary = lessonId.endsWith('-1') || lessonId.endsWith('-2') ? 'ratio-table' : 'drag-sort-ratios';
    secondary = 'error-analysis';
    explore = 'choice-board';
  } else if (std.includes('6.EE.') || u === 6) {
    primary = std.includes('6.EE.1') || std.includes('6.EE.2') ? 'power-match' : 'expression-simplify';
    secondary = 'error-analysis';
    explore = 'think-write';
  } else if (std.includes('6.G.') || u === 5 || u === 10) {
    primary = u === 10 ? 'net-fold' : 'area-grid';
    secondary = 'drag-sort-ratios';
    explore = 'choice-board';
  } else if (std.includes('6.SP.') || u === 8) {
    primary = 'stat-sort';
    secondary = 'error-analysis';
    explore = 'think-write';
  } else if (std.includes('6.NS.6') || std.includes('6.NS.8') || u === 9) {
    primary = 'treasure-hunt';
    secondary = 'vocab-match';
    explore = 'choice-board';
  } else if (u === 7) {
    primary = 'expression-simplify';
    secondary = 'error-analysis';
    explore = 'think-write';
  } else if (u === 1 || u === 2 || u === 4) {
    primary = 'ratio-table';
    secondary = 'vocab-match';
    explore = 'choice-board';
  }

  return { primary, secondary, explore, closure: 'goal-tracker' };
}
