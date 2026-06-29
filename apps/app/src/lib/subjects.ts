// Danh mục MÔN HỌC — THUẦN. Hiện áp cho câu tự soạn (nhãn); mở rộng curriculum theo môn về sau.
export interface Subject {
  key: string;
  label: string;
  emoji: string;
}

export const SUBJECTS: Subject[] = [
  { key: "math", label: "Toán", emoji: "🔢" },
  { key: "vietnamese", label: "Tiếng Việt", emoji: "📖" },
  { key: "english", label: "Tiếng Anh", emoji: "🔤" },
  { key: "science", label: "Khoa học", emoji: "🔬" },
];

export const DEFAULT_SUBJECT = "math";

/** Nhãn môn theo key (null/không hợp lệ → Toán). */
export function subjectLabel(key: string | null | undefined): string {
  return (SUBJECTS.find((s) => s.key === key) ?? SUBJECTS[0]).label;
}

/** Emoji môn theo key (fallback Toán). */
export function subjectEmoji(key: string | null | undefined): string {
  return (SUBJECTS.find((s) => s.key === key) ?? SUBJECTS[0]).emoji;
}
