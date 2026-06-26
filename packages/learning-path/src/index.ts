// @synaptek/learning-path — mastery (BKT) + lộ trình + lập lịch ôn + gamification + heatmap. TS thuần.
export { dayKeyVN } from "./time.ts";
export { type BktParams, DEFAULT_BKT, MASTERED, updateMastery, initFromDiagnostic } from "./bkt.ts";
export {
  type SkillNode,
  type Recommendation,
  type RecommendReason,
  recommendNext,
} from "./recommender.ts";
export { buildDiagnostic } from "./diagnostic.ts";
export { type HeatCell, skillWeakness, commonErrorType } from "./heatmap.ts";
export {
  type Difficulty,
  type GamificationState,
  type Badge,
  type BadgeCriteria,
  type BadgeContext,
  type BadgeError,
  difficultyOf,
  xpForAttempt,
  updateStreak,
  evaluateBadges,
  validateBadge,
  validateBadges,
} from "./gamification.ts";
