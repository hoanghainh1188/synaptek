// Render LaTeX thật qua KaTeX (D53, WEB-ONLY — Metro chọn file .web.tsx này khi build web, xem
// KatexSpan.tsx cho fallback native). katex.renderToString sinh HTML từ AST đã parse (KHÔNG phải HTML
// thô của người dùng) + trust:false (mặc định) chặn lệnh có thể chèn URL/attribute tuỳ ý (\href,
// \includegraphics...) — an toàn để dangerouslySetInnerHTML, khác trường hợp innerHTML từ input thô.
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
      return katex.renderToString(latex, { throwOnError: false, trust: false, output: "html" });
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
