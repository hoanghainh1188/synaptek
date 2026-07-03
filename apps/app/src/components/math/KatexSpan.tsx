// Fallback native (D53) — KaTeX là thư viện DOM-only, không chạy trên RN native. Chỉ tồn tại để
// import "./KatexSpan" resolve được cho tooling/type-check; KHÔNG thực sự dùng trên native vì
// MathText.tsx (bản native) không import file này — chỉ MathText.web.tsx (web-only) mới dùng.
import { Text } from "react-native";

interface KatexSpanProps {
  latex: string;
  color?: string;
  size?: number;
}

export function KatexSpan({ latex, color = "#18181b", size = 22 }: KatexSpanProps) {
  return <Text style={{ color, fontSize: size }}>{latex}</Text>;
}
