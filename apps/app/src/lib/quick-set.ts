// "Luyện nhanh": trộn câu từ nhiều kỹ năng (điểm yếu + đến hạn) thành 1 phiên ngắn. THUẦN, test được.
// Round-robin qua từng kỹ năng để ĐA DẠNG (không dồn hết 1 kỹ năng), tới khi đủ `cap` câu (không trùng).
export function buildQuickSet(perSkillQuestionIds: string[][], cap: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let depth = 0;
  let progressed = true;
  while (out.length < cap && progressed) {
    progressed = false;
    for (const ids of perSkillQuestionIds) {
      if (depth >= ids.length) continue;
      const id = ids[depth];
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
        progressed = true;
        if (out.length >= cap) return out;
      }
    }
    depth++;
  }
  return out;
}
