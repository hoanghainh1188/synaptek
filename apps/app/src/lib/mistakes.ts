// "Ôn lại câu sai" — THUẦN, test được. Lấy câu mà LẦN TRẢ LỜI GẦN NHẤT còn SAI (chưa sửa được).
// Đầu vào: attempts theo thứ tự thời gian TĂNG dần (useAttempts trả vậy) → lần cuối/câu = mới nhất.
import type { AttemptLike } from "@/lib/progress";

/**
 * Trả danh sách questionId mà attempt MỚI NHẤT là sai (cần ôn). Nếu sau đó HS làm đúng → tự loại.
 * Giữ thứ tự xuất hiện đầu tiên (ổn định).
 */
export function wrongQuestionIds(attempts: AttemptLike[]): string[] {
  const latestCorrect = new Map<string, boolean>();
  for (const a of attempts) latestCorrect.set(a.questionId, a.isCorrect); // tăng dần → ghi đè = mới nhất
  const out: string[] = [];
  for (const [id, ok] of latestCorrect) if (!ok) out.push(id);
  return out;
}
