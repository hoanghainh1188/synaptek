// Nối cặp: gói vế TRÁI + vế PHẢI (đã xáo trộn) trong một mảng `choices` qua sentinel — THUẦN, test được.
// HS thấy cả hai cột; `correct` (ẩn) là vế phải theo đúng thứ tự vế trái. Tránh đổi schema/RPC.
export const MATCH_SEP = "::pair::";

export function packMatching(lefts: string[], rightsShuffled: string[]): string[] {
  return [...lefts, MATCH_SEP, ...rightsShuffled];
}

export function unpackMatching(choices: string[] | undefined): { lefts: string[]; pool: string[] } {
  const arr = choices ?? [];
  const i = arr.indexOf(MATCH_SEP);
  if (i < 0) return { lefts: arr, pool: [] }; // không có sentinel → coi toàn bộ là trái
  return { lefts: arr.slice(0, i), pool: arr.slice(i + 1) };
}
