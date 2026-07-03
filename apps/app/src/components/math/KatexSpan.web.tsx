// Render LaTeX thật qua KaTeX (D53, WEB-ONLY — Metro chọn file .web.tsx này khi build web, xem
// KatexSpan.tsx cho fallback native). katex.renderToString sinh HTML từ AST đã parse (KHÔNG phải HTML
// thô của người dùng) + trust:false (mặc định) chặn lệnh có thể chèn URL/attribute tuỳ ý (\href,
// \includegraphics...) — an toàn để dangerouslySetInnerHTML, khác trường hợp innerHTML từ input thô.
//
// CSS nạp qua <link> TĨNH (public/katex/katex.min.css, copy từ node_modules/katex/dist — xem
// public/katex/README) — KHÔNG phải @import CSS (Metro không resolve, im lặng bỏ qua → phân số vỡ
// thành chữ phẳng sai thứ tự "1/2" → "21") lẫn KHÔNG phải `import "...css"` cấp JS (Metro dev server
// RÒ RỈ BỘ NHỚ khi bundle lại CSS này qua nhiều request trong 1 lượt e2e dài → OOM crash, xác minh
// bằng so sánh A/B: bỏ import CSS này thì hết OOM). Coi katex.min.css như static asset thuần, tách
// hẳn khỏi Metro module graph.
import { useEffect, useMemo } from "react";
import katex from "katex";

const KATEX_CSS_HREF = "/katex/katex.min.css";

function ensureKatexCss() {
  if (document.querySelector(`link[href="${KATEX_CSS_HREF}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = KATEX_CSS_HREF;
  document.head.appendChild(link);
}

interface KatexSpanProps {
  latex: string;
  color?: string;
  size?: number;
}

export function KatexSpan({ latex, color = "#18181b", size = 22 }: KatexSpanProps) {
  useEffect(() => {
    ensureKatexCss();
  }, []);

  const html = useMemo(() => {
    try {
      // output mặc định (htmlAndMathml) — thêm MathML ẩn giúp trình đọc màn hình đọc đúng phân số/lũy
      // thừa (accessibility) thay vì chỉ đọc chữ phẳng vô nghĩa; cũng dùng để e2e verify thứ tự tử/mẫu
      // không phụ thuộc CSS (xem latex-render.spec.ts).
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
