// Render LaTeX thật qua KaTeX (D53, WEB-ONLY — Metro chọn file .web.tsx này khi build web, xem
// KatexSpan.tsx cho fallback native). katex.renderToString sinh HTML từ AST đã parse (KHÔNG phải HTML
// thô của người dùng) + trust:false (mặc định) chặn lệnh có thể chèn URL/attribute tuỳ ý (\href,
// \includegraphics...) — an toàn để dangerouslySetInnerHTML, khác trường hợp innerHTML từ input thô.
// CSS import ở ĐÂY (không phải @import trong global.css — Metro KHÔNG resolve @import CSS trỏ tới
// node_modules, thử ban đầu khiến KaTeX render KHÔNG CÓ style → phân số vỡ thành chữ phẳng sai thứ tự
// tử/mẫu, ví dụ "1/2" hiện "21". import trực tiếp trong .ts/.tsx là cách chuẩn Metro bundling CSS.
import "katex/dist/katex.min.css";
import { useMemo } from "react";
import katex from "katex";

interface KatexSpanProps {
  latex: string;
  color?: string;
  size?: number;
}

export function KatexSpan({ latex, color = "#18181b", size = 22 }: KatexSpanProps) {
  const html = useMemo(() => {
    try {
      // output mặc định (htmlAndMathml) — thêm MathML ẩn giúp trình đọc màn hình đọc đúng phân số/lũy
      // thừa (accessibility, quan trọng cho app học tập) thay vì chỉ đọc chữ phẳng vô nghĩa.
      return katex.renderToString(latex, { throwOnError: false, trust: false });
    } catch {
      return latex;
    }
  }, [latex]);

  return (
    <span
      style={{ color, fontSize: size, display: "inline-block" }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
