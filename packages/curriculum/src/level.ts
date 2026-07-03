// Cấp học Việt Nam — SUY RA từ số lớp, KHÔNG lưu riêng (tránh lệch dữ liệu; cùng triết lý "suy ra
// thay vì nhân bản" ở D8/D9). TS thuần. Tiểu học 1–5 · THCS 6–9 · THPT 10–12.
// Khung chuẩn bị cho mở rộng lên cấp trên (D-mở rộng): mô hình grade phẳng giữ nguyên, "cấp" chỉ là
// một lớp suy diễn dùng cho UI (bộ chọn 2 tầng) + gom nhóm, KHÔNG thêm cột DB/không migrate content.
import type { Grade } from "./types.ts";
import { gradeSubject } from "./select.ts";

export type EducationLevel = "primary" | "lower-secondary" | "upper-secondary";

export interface LevelInfo {
  key: EducationLevel;
  /** Nhãn tiếng Việt hiển thị (Tiểu học · THCS · THPT). */
  label: string;
  /** Các lớp thuộc cấp (đầy đủ theo hệ GDPT, kể cả lớp chưa có nội dung). */
  grades: number[];
}

/** Ba cấp hệ GDPT Việt Nam, theo thứ tự tăng dần. */
export const LEVELS: readonly LevelInfo[] = [
  { key: "primary", label: "Tiểu học", grades: [1, 2, 3, 4, 5] },
  { key: "lower-secondary", label: "THCS", grades: [6, 7, 8, 9] },
  { key: "upper-secondary", label: "THPT", grades: [10, 11, 12] },
];

/** Cấp học của một lớp (1–5 Tiểu học · 6–9 THCS · 10–12 THPT). null nếu ngoài 1–12. */
export function levelOfGrade(grade: number): EducationLevel | null {
  return LEVELS.find((l) => l.grades.includes(grade))?.key ?? null;
}

/** LevelInfo của một cấp (key luôn hợp lệ theo kiểu EducationLevel). */
export function levelInfo(key: EducationLevel): LevelInfo {
  return LEVELS.find((l) => l.key === key)!;
}

/** Các lớp đầy đủ của một cấp (Tiểu học luôn 1–5, kể cả lớp chưa có nội dung — để picker hiển thị nhất quán). */
export function gradesInLevel(level: EducationLevel): number[] {
  return levelInfo(level).grades;
}

/** Các cấp CÓ nội dung trong curricula (lọc theo môn nếu truyền) — giữ thứ tự Tiểu học→THCS→THPT.
 *  Dùng để chỉ hiện hàng "Cấp" khi thực sự có >1 cấp (tránh tab trống). */
export function levelsWithContent(curricula: Grade[], subject?: string): LevelInfo[] {
  const present = new Set<EducationLevel>();
  for (const g of curricula) {
    if (subject !== undefined && gradeSubject(g) !== subject) continue;
    const lv = levelOfGrade(g.grade);
    if (lv) present.add(lv);
  }
  return LEVELS.filter((l) => present.has(l.key));
}
