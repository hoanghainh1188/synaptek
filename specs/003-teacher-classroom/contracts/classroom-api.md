# Contract — `@synaptek/classroom` (API công khai)

Package TS thuần, zero-dep, raw `.ts` (test `node --experimental-strip-types`). **Không** import DOM/React/
Node-only → chạy client + Deno Edge Function. Tất cả hàm **thuần & tất định** (thời gian/seed truyền vào).
Logic nghiệp vụ M3 (ít nhưng tách để test + dùng lại ở edge).

## Mã mời — `invite.ts`

```ts
/** Sinh mã mời khó đoán từ số ngẫu nhiên inject (caller cấp randomInts để giữ tất định/test). */
export function makeInviteCode(randomInts: number[], len?: number): string; // base32 không nhập nhằng, mặc định len=6
/** Chuẩn hóa mã người dùng nhập (uppercase, bỏ khoảng trắng, map ký tự dễ nhầm 0/O,1/I). */
export function normalizeInviteCode(raw: string): string;
/** Mã còn hiệu lực? (so now với expiresAt; null = không hạn). */
export function isInviteValid(expiresAt: number | null, now: number): boolean;
```

- **Bất biến**: ký tự chỉ trong bảng base32 an toàn (loại `0/O/1/I/L`); cùng `randomInts` → cùng mã (test);
  `normalize(make(x)) === make(x)`.

## Quy tắc chấm/nộp — `grading-policy.ts`

```ts
/** Nộp trễ? (submittedAt > dueAt; dueAt null = không hạn → không trễ). */
export function isLate(submittedAt: number, dueAt: number | null): boolean;
/** Điểm ghi đè hợp lệ? (số trong [0,1]). */
export function isValidScore(score: number): boolean;
/** Điểm hiển thị = final ?? auto (clamp [0,1]); null cả hai → null. */
export function displayScore(autoScore: number | null, finalScore: number | null): number | null;
/** Gộp điểm bài từ kết quả từng câu (trung bình score). */
export function aggregateScore(perQuestion: { score: number }[]): number;
```

- **Bất biến**: `displayScore` ưu tiên final; `aggregateScore([]) = 0`; `isValidScore` chặn ngoài [0,1]/NaN.

## Phân tích lớp — `analytics.ts`

```ts
export interface ClassProgress {
  totalStudents: number;
  submittedCount: number; // theo một assignment
  averageScore: number | null; // trung bình điểm hiển thị các bài đã nộp
}
/** Tổng hợp tiến độ một assignment trong lớp. */
export function assignmentProgress(
  memberIds: string[],
  submissions: { studentId: string; autoScore: number | null; finalScore: number | null }[],
): ClassProgress;

/** Điểm yếu chung của lớp: gộp mastery của HS trong lớp → xếp kỹ năng yếu nhất (dùng lại learning-path). */
export function classWeakSkills(
  masteryByStudent: { studentId: string; mastery: Map<string, number> }[],
  limit?: number,
): { skillId: string; avgMastery: number }[];
```

- **Bất biến**: chỉ tính trên `memberIds` (không rò HS ngoài lớp — SC-005); HS chưa nộp không tính vào trung bình.

## Ràng buộc test (TDD, ≥80%)

- `makeInviteCode`: tất định theo seed; chỉ ký tự an toàn; độ dài đúng. `isInviteValid`: biên now==expiresAt.
- `isLate`/`isValidScore`/`displayScore`/`aggregateScore`: biên null/0/1/ngoài khoảng/rỗng.
- `assignmentProgress`/`classWeakSkills`: chỉ gồm thành viên; trung bình bỏ HS chưa nộp; xếp hạng đúng.
