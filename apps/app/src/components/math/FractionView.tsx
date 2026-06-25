// Phân số render tử/mẫu có gạch ngang — tự vẽ, universal (research R1).
import { Text, View } from "react-native";

interface FractionViewProps {
  num: string;
  den: string;
  color?: string;
  size?: number;
}

export function FractionView({ num, den, color = "#18181b", size = 18 }: FractionViewProps) {
  const t = { color, fontSize: size, fontWeight: "800" as const, lineHeight: size * 1.04 };
  return (
    <View style={{ alignItems: "center", marginHorizontal: 3 }}>
      <Text style={t}>{num}</Text>
      <View
        style={{ height: 2.5, alignSelf: "stretch", backgroundColor: color, borderRadius: 2 }}
      />
      <Text style={t}>{den}</Text>
    </View>
  );
}
