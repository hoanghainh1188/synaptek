// View-model gamification (THUẦN, test bằng node strip-types). Gộp một phiên → ΔXP + streak + huy hiệu.
// Không I/O / content / render — inject mọi đầu vào để tái dùng & test dễ. Logic luật ở @synaptek/learning-path.
import {
  MASTERED,
  evaluateBadges,
  updateStreak,
  xpForAttempt,
  type Badge,
  type Difficulty,
  type GamificationState,
} from "@synaptek/learning-path";

/** Trạng thái gamification khởi tạo (HS mới / guest trong bộ nhớ). */
export const INITIAL_GAMIFICATION: GamificationState = {
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPracticedOn: null,
};

/** Một câu trong phiên đã resolve độ khó (route dùng difficultyOf + getQuestionById). */
export interface SessionEvent {
  /** Điểm 0..1 (đón điểm thành phần — vd fill-blank đúng 2/3 chỗ = 0.67). */
  score: number;
  difficulty: Difficulty;
}

export interface GamificationInputs {
  prior: GamificationState;
  events: SessionEvent[];
  /** Ngày luyện theo giờ VN ("YYYY-MM-DD" — dayKeyVN). */
  dayKeyVN: string;
  /** Bối cảnh đánh giá huy hiệu SAU phiên. */
  badgeCtx: {
    mastery: Map<string, number>;
    correctCount: number;
    masteredTopics: Set<string>;
  };
  catalog: Badge[];
  earned: Set<string>;
}

export interface GamificationOutcome {
  xpGained: number;
  state: GamificationState;
  newBadges: string[];
}

/** Tổng XP nhận được trong phiên (theo điểm từng câu, đón điểm thành phần). */
export function xpForSession(events: SessionEvent[]): number {
  return events.reduce((sum, e) => sum + xpForAttempt(e.score, e.difficulty), 0);
}

/** Gộp một phiên: cộng XP → cập nhật streak → đánh giá huy hiệu mới. Bất biến với `prior`. */
export function summarizeSession(input: GamificationInputs): GamificationOutcome {
  const xpGained = xpForSession(input.events);
  const withXp: GamificationState = {
    ...input.prior,
    totalXp: input.prior.totalXp + xpGained,
  };
  const state = updateStreak(withXp, input.dayKeyVN);
  const newBadges = evaluateBadges(
    {
      state,
      mastery: input.badgeCtx.mastery,
      correctCount: input.badgeCtx.correctCount,
      masteredTopics: input.badgeCtx.masteredTopics,
    },
    input.catalog,
    input.earned,
  );
  return { xpGained, state, newBadges };
}

/**
 * Tập chủ đề "đã thành thạo": MỌI kỹ năng của chủ đề ≥ ngưỡng (và có ≥1 kỹ năng).
 * Dùng cho huy hiệu `topic_mastered`.
 */
export function masteredTopicsOf(
  mastery: Map<string, number>,
  topicSkills: Map<string, string[]>,
  threshold: number = MASTERED,
): Set<string> {
  const out = new Set<string>();
  for (const [topicId, skillIds] of topicSkills) {
    if (skillIds.length === 0) continue;
    if (skillIds.every((s) => (mastery.get(s) ?? 0) >= threshold)) out.add(topicId);
  }
  return out;
}
