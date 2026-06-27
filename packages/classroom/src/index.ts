// @synaptek/classroom — logic lớp học GV thuần: mã mời + quy tắc hạn nộp/điểm + tổng hợp phân tích lớp.
// TS thuần, zero-dep, tất định (thời gian/seed truyền vào) → chạy client + Deno Edge Function. (D22–D24)
export { makeInviteCode, normalizeInviteCode, isInviteValid } from "./invite.ts";
