// ⚠️ AUTO-GENERATED từ packages/learning-path/src/schedule.ts — KHÔNG sửa tay.
// Cập nhật: chỉnh nguồn rồi chạy `npm run sync:edge`. Lý do bản sao: D13.

// Lịch ôn ngắt quãng (SM-2 rút gọn — D21). TS thuần, tất định. Dùng chung client + Edge Function (_shared).
// Ý tưởng: khoảng cách giãn dần theo số lần ôn (repetition) và theo mastery (thạo hơn → ôn thưa hơn).

const DAY_MS = 86_400_000;

/** Khoảng cách cơ bản (ngày) theo repetition — chuỗi SM-2 rút gọn, sau đó nhân đôi. */
function baseIntervalDays(repetition: number): number {
  const seq = [1, 3, 7, 14, 30];
  const r = Math.max(0, Math.floor(repetition));
  if (r < seq.length) return seq[r];
  return seq[seq.length - 1] * Math.pow(2, r - seq.length + 1);
}

/**
 * Hạn ôn kế tiếp (epoch ms). mastery thấp → sớm; cao + nhiều lần ôn → giãn dần.
 * Hệ số mastery ∈ [0.5, 1.5]: mastery 0 → 0.5× (co lại), 1 → 1.5× (giãn ra). Tối thiểu 1 ngày.
 */
export function nextDueAt(args: {
  mastery: number;
  lastReviewed: number;
  repetition: number;
}): number {
  const m = args.mastery < 0 ? 0 : args.mastery > 1 ? 1 : args.mastery;
  const factor = 0.5 + m; // [0.5, 1.5]
  const days = Math.max(1, baseIntervalDays(args.repetition) * factor);
  return args.lastReviewed + Math.round(days * DAY_MS);
}
