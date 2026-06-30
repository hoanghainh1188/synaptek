// Bộ phím cho bàn phím toán có cấu trúc, theo loại câu. THUẦN (test được).
// Engine đã parse: số kiểu VN (phẩy), phân số a/b, mũ ^, ngoặc (), biến x, +−*/ (D8/D9).
export type KeypadType = "numeric" | "fraction" | "expression";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

/** Phím hiển thị cho từng loại — numeric gọn; fraction thêm '/'; expression thêm mũ/ngoặc/biến/toán tử. */
export function mathKeypadKeys(qtype: KeypadType): string[] {
  if (qtype === "expression") {
    return [...DIGITS, ",", "x", "^", "(", ")", "+", "-", "*", "/"];
  }
  if (qtype === "fraction") {
    return [...DIGITS, "/", ","];
  }
  return [...DIGITS, "/", ",", "-"]; // numeric (giữ '/' + dấu âm)
}

const OPERATORS = new Set(["/", ",", "x", "^", "(", ")", "+", "-", "*"]);

/** Phím toán tử (tô màu khác số) để dễ nhìn. */
export function isOperatorKey(k: string): boolean {
  return OPERATORS.has(k);
}
