// Render prompt Toán: text + phân số (FractionView) + lũy thừa (mũ unicode). Universal.
// (Gộp vai trò "ExpressionView" — biểu thức/mũ render inline cùng text.)
import { Text, View } from "react-native";
import { parseMathMarkup } from "@/lib/math-markup";
import { FractionView } from "./FractionView";

const SUP: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
};
const toSup = (s: string) =>
  s
    .split("")
    .map((c) => SUP[c] ?? c)
    .join("");

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
    if (seg.kind === "frac") {
      items.push(
        <FractionView key={i} num={seg.num} den={seg.den} color={color} size={size * 0.82} />,
      );
    } else if (seg.kind === "sup") {
      items.push(
        <Text key={i} style={textStyle}>
          {seg.base}
          {toSup(seg.exp)}
        </Text>,
      );
    } else {
      // tách theo khoảng trắng để wrap mượt
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
