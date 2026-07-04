// Render prompt Toán trên WEB (D53): text tiếng Việt vẫn qua <Text> thường (KaTeX không đụng tới,
// tránh vỡ dấu) — chỉ segment toán (frac/sup) đổi sang KaTeX thật thay vì FractionView/mũ unicode tự
// chế. Metro chọn file này khi build web; native dùng MathText.tsx (giữ nguyên như cũ).
import { Text, View } from "react-native";
import { parseMathMarkup, segmentToLatex } from "@/lib/math-markup";
import { KatexSpan } from "./KatexSpan";

interface MathTextProps {
  value: string;
  color?: string;
  size?: number;
  weight?: "400" | "600" | "700" | "800";
}

export function MathText({ value, color = "#18181b", size = 22, weight = "600" }: MathTextProps) {
  const segs = parseMathMarkup(value);
  const textStyle = { color, fontSize: size, fontWeight: weight, lineHeight: size * 1.3 };
  const items: React.ReactNode[] = [];

  segs.forEach((seg, i) => {
    const latex = segmentToLatex(seg);
    if (latex) {
      // fallback text gọn trong lúc chunk katex tải lần đầu (tránh nháy chuỗi latex thô "\frac{1}{2}").
      const fallback =
        seg.kind === "frac"
          ? `${seg.num}/${seg.den}`
          : seg.kind === "sup"
            ? `${seg.base}^${seg.exp}`
            : latex;
      items.push(<KatexSpan key={i} latex={latex} color={color} size={size} fallback={fallback} />);
    } else if (seg.kind === "text") {
      seg.value.split(/(\s+)/).forEach((w, j) => {
        if (w.length === 0) return;
        items.push(
          <Text key={`${i}-${j}`} style={textStyle}>
            {w}
          </Text>,
        );
      });
    }
  });

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>{items}</View>
  );
}
