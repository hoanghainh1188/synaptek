// Parser markup Toán nhẹ cho prompt (M1) — tách thành segment để render tử/mẫu & mũ.
// Hỗ trợ: [[frac:a/b]], phân số trần a/b, và lũy thừa base^exp. Còn lại là text.
export type MathSegment =
  | { kind: "text"; value: string }
  | { kind: "frac"; num: string; den: string }
  | { kind: "sup"; base: string; exp: string };

const RE = /\[\[frac:\s*(-?\d+)\s*\/\s*(-?\d+)\s*\]\]|(-?\d+)\s*\/\s*(\d+)|([A-Za-z0-9])\^(\d+)/g;

export function parseMathMarkup(input: string): MathSegment[] {
  const out: MathSegment[] = [];
  let last = 0;
  for (const m of input.matchAll(RE)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ kind: "text", value: input.slice(last, start) });
    if (m[1] !== undefined) out.push({ kind: "frac", num: m[1], den: m[2] });
    else if (m[3] !== undefined) out.push({ kind: "frac", num: m[3], den: m[4] });
    else out.push({ kind: "sup", base: m[5], exp: m[6] });
    last = start + m[0].length;
  }
  if (last < input.length) out.push({ kind: "text", value: input.slice(last) });
  return out.length ? out : [{ kind: "text", value: input }];
}

/** Chuyển 1 segment toán (frac/sup) sang cú pháp LaTeX cho KaTeX (web, D53). null nếu là "text"
 *  (không render qua KaTeX — giữ nguyên tiếng Việt qua Text thường, tránh KaTeX làm hỏng dấu). num/
 *  den/base/exp chỉ chứa [A-Za-z0-9-] (đảm bảo bởi RE ở trên) nên không cần escape ký tự LaTeX đặc biệt. */
export function segmentToLatex(seg: MathSegment): string | null {
  if (seg.kind === "frac") return `\\frac{${seg.num}}{${seg.den}}`;
  if (seg.kind === "sup") return `${seg.base}^{${seg.exp}}`;
  return null;
}
