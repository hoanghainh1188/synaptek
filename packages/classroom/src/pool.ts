// Ngân hàng "pool": chọn N câu NGẪU NHIÊN nhưng TẤT ĐỊNH theo học sinh.
// Cùng (pool, seed) → cùng kết quả ở client (render) và Edge (chấm) → chấm đúng bộ HS đã làm.
// KHÔNG dùng Math.random (không tất định); dùng PRNG có seed: FNV-1a hash → mulberry32 → Fisher–Yates.

/** FNV-1a 32-bit → uint32 seed từ chuỗi (vd `${assignmentId}|${studentId}`). */
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** PRNG mulberry32 — deterministic, đủ tốt cho xáo trộn (không phải mục đích mật mã). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Chọn `pick` câu từ `ids` theo `seed`, tất định.
 * `pick <= 0` hoặc `pick >= ids.length` → trả NGUYÊN `ids` (không random — coi như giao cả pool).
 */
export function pickForStudent(ids: string[], pick: number, seed: string): string[] {
  if (!Number.isFinite(pick) || pick <= 0 || pick >= ids.length) return ids;
  const rng = mulberry32(hashStr(seed));
  const arr = ids.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr.slice(0, pick);
}
