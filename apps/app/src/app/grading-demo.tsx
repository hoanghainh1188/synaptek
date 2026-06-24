// Route demo (M0): chứng minh @synaptek/grading-engine resolve & chạy được trong app universal.
// Đây là "consumer client" của engine; consumer thứ 2 là Supabase Edge Function (chấm chính thức).
import { Text, View } from "react-native";
import { grade } from "@synaptek/grading-engine";

export default function GradingDemo() {
  const cases = [
    grade({ type: "fraction", correct: "1/2", answer: "2/4" }),
    grade({ type: "numeric", correct: "0.5", answer: "0,5" }),
    grade({ type: "expression", correct: "2x+4", answer: "2(x+2)" }),
  ];
  const labels = ["1/2 ≡ 2/4", "0.5 ≡ 0,5", "2x+4 ≡ 2(x+2)"];

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Synaptek · grading-engine</Text>
      {cases.map((r, i) => (
        <Text key={i}>
          {labels[i]} → {r.isCorrect ? "Đúng ✅" : "Sai ❌"} (score {r.score})
        </Text>
      ))}
    </View>
  );
}
