import { BADGES, STAGES } from './data.js';

const LEVEL_XP = [0, 120, 280, 520, 860, 1280, 1800];

export class GameEngine {
  constructor() {
    this.state = {
      xp: 0,
      level: 1,
      combo: 0,
      streakBest: 0,
      unlockedStages: new Set(['conversion-lab']),
      completedStages: new Set(),
      mastery: {
        unit_conversion: { correct: 0, attempts: 0 },
        model_reasoning: { correct: 0, attempts: 0 },
        fraction_division: { correct: 0, attempts: 0 }
      },
      accuracyWindow: [],
      adaptiveDifficulty: 1,
      badges: new Set(),
      analytics: {
        sessionStart: Date.now(),
        attempted: 0,
        correct: 0,
        incorrect: 0,
        stageEvents: [],
        questionEvents: []
      }
    };
  }

  getLevelProgress() {
    const current = this.state.level;
    const floor = LEVEL_XP[current - 1] ?? 0;
    const ceiling = LEVEL_XP[current] ?? floor + 400;
    const within = this.state.xp - floor;
    const span = Math.max(ceiling - floor, 1);
    return Math.min(100, Math.round((within / span) * 100));
  }

  getNextLevelXp() {
    return LEVEL_XP[this.state.level] ?? null;
  }

  awardXp(base, concept, wasCorrect) {
    const comboBonus = wasCorrect ? Math.min(this.state.combo * 2, 30) : 0;
    const earned = wasCorrect ? base + comboBonus : Math.max(5, Math.round(base * 0.2));
    this.state.xp += earned;

    if (wasCorrect) {
      this.state.combo += 1;
      this.state.streakBest = Math.max(this.state.streakBest, this.state.combo);
    } else {
      this.state.combo = 0;
    }

    this.updateMastery(concept, wasCorrect);
    this.updateLevel();
    this.updateAdaptiveDifficulty(wasCorrect);
    this.updateBadges();

    return earned;
  }

  updateMastery(concept, wasCorrect) {
    const bucket = this.state.mastery[concept];
    if (!bucket) return;
    bucket.attempts += 1;
    if (wasCorrect) bucket.correct += 1;
  }

  getMasteryPercent(concept) {
    const bucket = this.state.mastery[concept];
    if (!bucket || bucket.attempts === 0) return 0;
    return Math.round((bucket.correct / bucket.attempts) * 100);
  }

  updateLevel() {
    let newLevel = this.state.level;
    for (let i = LEVEL_XP.length - 1; i >= 1; i -= 1) {
      if (this.state.xp >= LEVEL_XP[i - 1]) {
        newLevel = i;
        break;
      }
    }

    if (newLevel > this.state.level) {
      this.state.level = newLevel;
      for (const stage of STAGES) {
        if (stage.unlockLevel <= newLevel) {
          this.state.unlockedStages.add(stage.id);
        }
      }
    }
  }

  updateAdaptiveDifficulty(wasCorrect) {
    this.state.accuracyWindow.push(wasCorrect ? 1 : 0);
    if (this.state.accuracyWindow.length > 10) this.state.accuracyWindow.shift();

    const avg = this.state.accuracyWindow.reduce((sum, n) => sum + n, 0) / this.state.accuracyWindow.length;

    if (avg >= 0.85 && this.state.combo >= 3) {
      this.state.adaptiveDifficulty = Math.min(5, this.state.adaptiveDifficulty + 1);
    } else if (avg <= 0.5) {
      this.state.adaptiveDifficulty = Math.max(1, this.state.adaptiveDifficulty - 1);
    }
  }

  shouldOfferHint() {
    const recent = this.state.accuracyWindow.slice(-3);
    const misses = recent.filter((v) => v === 0).length;
    return misses >= 2;
  }

  recordQuestionEvent(payload) {
    this.state.analytics.questionEvents.push({ t: Date.now(), ...payload });
    this.state.analytics.attempted += 1;
    if (payload.correct) {
      this.state.analytics.correct += 1;
    } else {
      this.state.analytics.incorrect += 1;
    }
  }

  recordStageEvent(stageId, status) {
    this.state.analytics.stageEvents.push({ t: Date.now(), stageId, status });
    if (status === 'completed') {
      this.state.completedStages.add(stageId);
    }
  }

  updateBadges() {
    if (this.state.analytics.correct >= 1) this.state.badges.add('first-win');
    if (this.state.streakBest >= 5) this.state.badges.add('combo-5');
    if (this.getMasteryPercent('unit_conversion') >= 85) this.state.badges.add('unit-master');
    if (this.state.completedStages.has('boss')) this.state.badges.add('boss-clear');
  }

  getBadgeDetails() {
    return BADGES.filter((badge) => this.state.badges.has(badge.id));
  }

  getAnalyticsSnapshot() {
    const elapsedSec = Math.round((Date.now() - this.state.analytics.sessionStart) / 1000);
    return {
      ...this.state.analytics,
      elapsedSec,
      level: this.state.level,
      xp: this.state.xp,
      adaptiveDifficulty: this.state.adaptiveDifficulty,
      mastery: {
        unit_conversion: this.getMasteryPercent('unit_conversion'),
        model_reasoning: this.getMasteryPercent('model_reasoning'),
        fraction_division: this.getMasteryPercent('fraction_division')
      },
      unlockedStages: Array.from(this.state.unlockedStages),
      completedStages: Array.from(this.state.completedStages),
      badges: this.getBadgeDetails()
    };
  }

  resetProgress() {
    const fresh = new GameEngine();
    this.state = fresh.state;
  }
}
