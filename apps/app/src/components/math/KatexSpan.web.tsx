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
//
// KaTeX (~76KB gzip) nạp LƯỜI qua import() động (D-tối-ưu-bundle) → Metro tách thành chunk riêng, khỏi
// bundle CHÍNH: đa số màn (home/luyện tập cơ bản/hồ sơ/lớp) không có công thức nên không tải katex.
// Lần render toán ĐẦU TIÊN hiện `fallback` (text gọn: "1/2", "x^2") trong lúc chunk tải (~ms); sau đó
// module được cache ở cấp module → mọi KatexSpan tiếp theo render đồng bộ, KHÔNG nhấp nháy.
import { useEffect, useMemo, useState } from "react";
import type KatexType from "katex";

const KATEX_CSS_HREF = "/katex/katex.min.css";

function ensureKatexCss() {
  if (document.querySelector(`link[href="${KATEX_CSS_HREF}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = KATEX_CSS_HREF;
  document.head.appendChild(link);
}

// Cache cấp module: promise chia sẻ (nạp 1 lần) + tham chiếu đồng bộ sau khi resolve (khởi tạo state
// tức thì cho các instance sau → không flash).
let katexModule: typeof KatexType | null = null;
let katexPromise: Promise<typeof KatexType> | null = null;
function loadKatex(): Promise<typeof KatexType> {
  if (!katexPromise) {
    katexPromise = import("katex").then((m) => {
      katexModule = m.default;
      return m.default;
    });
  }
  return katexPromise;
}

interface KatexSpanProps {
  latex: string;
  color?: string;
  size?: number;
  /** Text gọn hiển thị trong lúc chờ katex nạp (lần đầu). Mặc định là chuỗi latex thô. */
  fallback?: string;
}

export function KatexSpan({ latex, color = "#18181b", size = 22, fallback }: KatexSpanProps) {
  const [katex, setKatex] = useState<typeof KatexType | null>(katexModule);

  useEffect(() => {
    ensureKatexCss();
    if (katex) return;
    let alive = true;
    loadKatex().then((k) => {
      if (alive) setKatex(k);
    });
    return () => {
      alive = false;
    };
  }, [katex]);

  const html = useMemo(() => {
    if (!katex) return null;
    try {
      // output mặc định (htmlAndMathml) — thêm MathML ẩn giúp trình đọc màn hình đọc đúng phân số/lũy
      // thừa (accessibility) thay vì chỉ đọc chữ phẳng vô nghĩa; cũng dùng để e2e verify thứ tự tử/mẫu
      // không phụ thuộc CSS (xem latex-render.spec.ts).
      return katex.renderToString(latex, { throwOnError: false, trust: false });
    } catch {
      return null;
    }
  }, [katex, latex]);

  // Chờ katex nạp (lần đầu) hoặc render lỗi → fallback text gọn.
  if (!html) {
    return (
      <span style={{ color, fontSize: size, display: "inline-block" }}>{fallback ?? latex}</span>
    );
  }

  return (
    <span
      style={{ color, fontSize: size, display: "inline-block" }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
