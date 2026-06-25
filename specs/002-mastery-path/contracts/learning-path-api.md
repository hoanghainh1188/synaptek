# Contract — `@synaptek/learning-path` (API công khai)

Package TS thuần, zero-dep, raw `.ts` (test `node --experimental-strip-types`). **Không** import
DOM/React/Node-only → chạy ở client + Deno Edge Function. Đây là GATE: API ổn định trước khi app/edge nối.
Tất cả hàm **thuần & tất định** (không I/O, không `Date.now()` ẩn — thời gian truyền vào).

## Types

```ts
export interface BktParams {
  pInit: number;
  pLearn: number;
  pSlip: number;
  pGuess: number;
}
export const DEFAULT_BKT: BktParams = { pInit: 0.3, pLearn: 0.15, pSlip: 0.1, pGuess: 0.2 };
export const MASTERED = 0.95; // ngưỡng "đã đạt" (cấu hình)

export type Difficulty = 1 | 2 | 3;
export type RecommendReason = "due" | "new" | "weak";

export interface SkillNode {
  id: string;
  prerequisites: string[];
  hasQuestions: boolean;
}
export interface Recommendation {
  skillId: string;
  reason: RecommendReason;
  priority: number;
}

export interface GamificationState {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticedOn: string | null; // dayKey VN "YYYY-MM-DD"
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

export interface HeatCell {
  skillId: string;
  mastery: number;
  recentAccuracy: number;
  attempts: number;
}
```

## BKT — `bkt.ts`

```ts
/** Cập nhật P(L) sau một câu. Đúng→tăng; sai→giảm/chậm. Tất định. */
export function updateMastery(prior: number, isCorrect: boolean, p?: BktParams): number;
/** Khởi tạo từ chẩn đoán: chạy updateMastery từ pInit cho từng kỹ năng được chạm. */
export function initFromDiagnostic(
  responses: { skillId: string; isCorrect: boolean }[],
  p?: BktParams,
): Map<string, number>;
```

- **Bất biến**: `0 ≤ updateMastery ≤ 1`; `updateMastery(x,true) ≥ x`; chuỗi toàn đúng → hội tụ tăng; cùng
  input → cùng output (không phụ thuộc trạng thái ngoài).

## Chẩn đoán — `diagnostic.ts`

```ts
/** Chọn ~5–8 câu trải kỹ năng NỀN (ưu tiên kỹ năng gốc trong DAG), tất định theo seed. */
export function buildDiagnostic(
  skills: SkillNode[],
  questionsBySkill: Map<string, string[]>,
  opts?: { max?: number; seed?: number },
): string[]; // danh sách questionId
```

## Recommender — `recommender.ts`

```ts
/** Lộ trình "học gì tiếp". now/dueMap theo cùng quy ước thời gian. */
export function recommendNext(
  skills: SkillNode[],
  mastery: Map<string, number>,
  opts: { now: number; dueAt: Map<string, number>; limit?: number },
): Recommendation[];
```

- **Gate (bất biến — SC-002)**: chỉ trả kỹ năng có **mọi** tiên quyết `≥ MASTERED` ∧ `mastery < MASTERED`
  ∧ `hasQuestions`. **Không bao giờ** trả kỹ năng có tiên quyết chưa đạt.
- **Xếp**: `due` (quá hạn lâu hơn trước) → `weak`/`new` (mastery thấp hơn trước). `priority` số nhỏ = ưu tiên cao.

## Lịch ôn — `schedule.ts` (dùng chung client + edge)

```ts
/** Hạn ôn kế tiếp (epoch ms). Mastery thấp→sớm; cao + nhiều lần→giãn dần (SM-2 rút gọn). */
export function nextDueAt(args: {
  mastery: number;
  lastReviewed: number;
  repetition: number;
}): number;
```

## Gamification — `gamification.ts`

```ts
export function difficultyOf(q: { type: string; difficulty?: Difficulty }): Difficulty;
export function xpForAttempt(isCorrect: boolean, difficulty: Difficulty): number; // base 10 × {1:1,2:1.5,3:2}
/** So dayKey VN: cùng ngày giữ; ngày kế +1; cách ≥2 ngày reset=1. Cập nhật longest. */
export function updateStreak(
  state: GamificationState,
  practicedDayKeyVN: string,
): GamificationState;
/** Trả huy hiệu MỚI đạt (chưa có trong `earned`). Mở đúng một lần. */
export function evaluateBadges(
  ctx: {
    state: GamificationState;
    mastery: Map<string, number>;
    correctCount: number;
    masteredTopics: Set<string>;
  },
  catalog: Badge[],
  earned: Set<string>,
): string[];
```

## Heatmap — `heatmap.ts`

```ts
export function skillWeakness(
  attempts: { skillId: string; isCorrect: boolean }[],
  mastery: Map<string, number>,
): HeatCell[];
/** Dạng lỗi hay mắc theo kỹ năng (nhóm câu sai theo skill + loại câu). */
export function commonErrorType(
  attempts: { skillId: string; questionType: string; isCorrect: boolean }[],
): Map<string, string>; // skillId -> nhãn dạng lỗi
```

## Thời gian — `time.ts`

```ts
/** Khóa ngày theo Asia/Ho_Chi_Minh: "YYYY-MM-DD". Tất định, không phụ thuộc TZ máy. */
export function dayKeyVN(epochMs: number): string;
```

## Ràng buộc test (TDD, ≥80% coverage)

- `updateMastery`: đơn điệu đúng/sai; biên 0/1; tất định; đổi tham số không "nhảy bậc" (FR-020).
- `recommendNext`: **0 vi phạm tiên quyết** trên bộ ca DAG (SC-002); thứ tự due→weak.
- `nextDueAt`: mastery thấp < cao về khoảng cách; tăng theo repetition.
- `updateStreak`: +1/ngày, reset khi cách ngày, không +2 trong cùng ngày (SC-005).
- `evaluateBadges`: mở đúng một lần (không lặp với `earned`).
- `dayKeyVN`: ổn định quanh nửa đêm VN (test mốc 16:59 vs 17:01 UTC).
