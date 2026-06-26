// ⚠️ AUTO-GENERATED từ packages/learning-path/src/time.ts — KHÔNG sửa tay.
// Cập nhật: chỉnh nguồn rồi chạy `npm run sync:edge`. Lý do bản sao: D13.

// Quy ước ngày Việt Nam (Asia/Ho_Chi_Minh). VN cố định UTC+7, không DST → cộng offset rồi format UTC.
// Tất định, không phụ thuộc múi giờ máy chạy (đúng cho cả client lẫn Edge Function).

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Khóa ngày theo giờ VN: "YYYY-MM-DD". */
export function dayKeyVN(epochMs: number): string {
  return new Date(epochMs + VN_OFFSET_MS).toISOString().slice(0, 10);
}
