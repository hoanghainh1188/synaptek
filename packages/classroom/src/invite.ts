// Mã mời lớp (US1). Crockford base32 (loại I/L/O/U — tránh nhầm khi đọc/gõ). TS thuần, tất định.
// Ngẫu nhiên do caller cấp (randomInts) để test được + dùng chung client/edge.

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // 32 ký tự, không I L O U

/** Sinh mã mời từ số ngẫu nhiên inject. Lặp seed nếu thiếu để đủ độ dài. Tất định. */
export function makeInviteCode(randomInts: number[], len = 6): string {
  if (randomInts.length === 0) throw new Error("randomInts rỗng");
  let out = "";
  for (let i = 0; i < len; i++) {
    const n = Math.abs(Math.trunc(randomInts[i % randomInts.length]));
    out += ALPHABET[n % ALPHABET.length];
  }
  return out;
}

/** Chuẩn hóa mã người dùng nhập: upper, bỏ ký tự không chữ-số, map nhầm Crockford (I/L→1, O→0, U→V). */
export function normalizeInviteCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0")
    .replace(/U/g, "V");
}

/** Mã còn hiệu lực? null = không hạn → luôn hợp lệ; ngược lại cần expiresAt > now (biên = hết hạn). */
export function isInviteValid(expiresAt: number | null, now: number): boolean {
  return expiresAt === null || expiresAt > now;
}
