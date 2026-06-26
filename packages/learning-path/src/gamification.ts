// Luật gamification (US2/D20): XP theo độ khó · streak ngày VN · huy hiệu mở một lần.
// TS thuần, tất định, không I/O (thời gian/ngày truyền vào). Chạy client + Edge Function.
import { MASTERED } from "./bkt.ts";

export type Difficulty = 1 | 2 | 3;

/** Trạng thái gamification của một học sinh (mirror bảng gamification_state). */
export interface GamificationState {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  /** Ngày luyện gần nhất theo giờ VN: "YYYY-MM-DD" (xem dayKeyVN). null = chưa luyện. */
  lastPracticedOn: string | null;
}

export type BadgeCriteria =
  | { type: "streak"; gte: number }
  | { type: "xp"; gte: number }
  | { type: "skill_mastered"; skillId: string }
  | { type: "topic_mastered"; topicId: string }
  | { type: "correct_count"; gte: number };

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  criteria: BadgeCriteria;
}

/** Lỗi validate nội dung huy hiệu (gate như D6). Rỗng = hợp lệ. */
export interface BadgeError {
  path: string;
  message: string;
}

// ── XP ───────────────────────────────────────────────────────────────────────
const XP_BASE = 10;
const DIFFICULTY_WEIGHT: Record<Difficulty, number> = { 1: 1, 2: 1.5, 3: 2 };

const TYPE_DIFFICULTY: Record<string, Difficulty> = {
  mcq: 1,
  "true-false": 1,
  numeric: 2,
  fraction: 2,
  expression: 3,
  "fill-blank": 3,
};

/** Độ khó hiệu lực: ưu tiên field `difficulty`, vắng → suy theo loại câu (FR-009a). */
export function difficultyOf(q: { type: string; difficulty?: Difficulty }): Difficulty {
  return q.difficulty ?? TYPE_DIFFICULTY[q.type] ?? 2;
}

/** XP cho một câu: sai → 0; đúng → base × trọng số độ khó (FR-009). */
export function xpForAttempt(isCorrect: boolean, difficulty: Difficulty): number {
  return isCorrect ? XP_BASE * DIFFICULTY_WEIGHT[difficulty] : 0;
}

// ── Streak ─────────────────────────────────────────────────────────────────────
/** Số ngày giữa hai dayKey VN "YYYY-MM-DD" (b - a). Tất định, theo UTC midnight. */
function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/**
 * Cập nhật streak khi luyện vào ngày `practicedDayKeyVN`:
 * cùng ngày → giữ; ngày kế tiếp (+1) → streak+1; cách ≥2 ngày → reset=1. Cập nhật longest.
 * Bất biến: không đột biến state đầu vào. (FR-010, SC-005)
 */
export function updateStreak(
  state: GamificationState,
  practicedDayKeyVN: string,
): GamificationState {
  const last = state.lastPracticedOn;
  let currentStreak: number;
  if (last === null) {
    currentStreak = 1;
  } else {
    const gap = daysBetween(last, practicedDayKeyVN);
    if (gap <= 0)
      currentStreak = state.currentStreak; // cùng ngày (hoặc cũ hơn) → giữ
    else if (gap === 1) currentStreak = state.currentStreak + 1;
    else currentStreak = 1; // cách ≥ 2 ngày → reset
  }
  return {
    ...state,
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastPracticedOn: gapKeepsLatest(last, practicedDayKeyVN),
  };
}

/** Giữ ngày mới nhất giữa hai dayKey (tránh lùi mốc nếu nhận ngày cũ hơn). */
function gapKeepsLatest(last: string | null, next: string): string {
  if (last === null) return next;
  return daysBetween(last, next) > 0 ? next : last;
}

// ── Huy hiệu ─────────────────────────────────────────────────────────────────
export interface BadgeContext {
  state: GamificationState;
  mastery: Map<string, number>;
  correctCount: number;
  masteredTopics: Set<string>;
}

function meetsCriteria(c: BadgeCriteria, ctx: BadgeContext): boolean {
  switch (c.type) {
    case "streak":
      return ctx.state.currentStreak >= c.gte;
    case "xp":
      return ctx.state.totalXp >= c.gte;
    case "correct_count":
      return ctx.correctCount >= c.gte;
    case "skill_mastered":
      return (ctx.mastery.get(c.skillId) ?? 0) >= MASTERED;
    case "topic_mastered":
      return ctx.masteredTopics.has(c.topicId);
  }
}

/** Huy hiệu MỚI đạt (chưa có trong `earned`). Mở đúng một lần (SC-005). */
export function evaluateBadges(ctx: BadgeContext, catalog: Badge[], earned: Set<string>): string[] {
  const out: string[] = [];
  for (const b of catalog) {
    if (earned.has(b.id)) continue;
    if (meetsCriteria(b.criteria, ctx)) out.push(b.id);
  }
  return out;
}

// ── Validate catalog (gate nội dung — D6) ─────────────────────────────────────
const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function validateCriteria(c: unknown, path: string): BadgeError[] {
  const e: BadgeError[] = [];
  if (typeof c !== "object" || c === null) return [{ path, message: "criteria phải là object" }];
  const x = c as Record<string, unknown>;
  switch (x.type) {
    case "streak":
    case "xp":
    case "correct_count":
      if (!isNum(x.gte))
        e.push({ path: `${path}/gte`, message: `${String(x.type)} cần gte là số` });
      break;
    case "skill_mastered":
      if (!isStr(x.skillId)) e.push({ path: `${path}/skillId`, message: "cần skillId" });
      break;
    case "topic_mastered":
      if (!isStr(x.topicId)) e.push({ path: `${path}/topicId`, message: "cần topicId" });
      break;
    default:
      e.push({ path: `${path}/type`, message: `type không hợp lệ: ${String(x.type)}` });
  }
  return e;
}

/** Validate một Badge. Rỗng = hợp lệ. */
export function validateBadge(b: unknown): BadgeError[] {
  const e: BadgeError[] = [];
  if (typeof b !== "object" || b === null) return [{ path: "/", message: "badge phải là object" }];
  const x = b as Record<string, unknown>;
  if (!isStr(x.id)) e.push({ path: "/id", message: "id (chuỗi) bắt buộc" });
  if (!isStr(x.name)) e.push({ path: "/name", message: "name bắt buộc" });
  if (!isStr(x.desc)) e.push({ path: "/desc", message: "desc bắt buộc" });
  if (!isStr(x.icon)) e.push({ path: "/icon", message: "icon bắt buộc" });
  e.push(...validateCriteria(x.criteria, "/criteria"));
  return e;
}

/** Validate toàn bộ catalog (mảng + id duy nhất). Rỗng = hợp lệ. */
export function validateBadges(arr: unknown): BadgeError[] {
  if (!Array.isArray(arr)) return [{ path: "/", message: "badges phải là mảng" }];
  const e: BadgeError[] = [];
  const seen = new Set<string>();
  arr.forEach((b, i) => {
    for (const err of validateBadge(b)) e.push({ path: `[${i}]${err.path}`, message: err.message });
    const id = (b as { id?: unknown })?.id;
    if (typeof id === "string") {
      if (seen.has(id)) e.push({ path: `[${i}]/id`, message: `id trùng: ${id}` });
      seen.add(id);
    }
  });
  return e;
}
