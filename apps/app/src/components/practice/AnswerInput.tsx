// Ô nhập đáp án theo loại câu hỏi (controlled). Vùng chạm ≥48px (trẻ em).
import { Pressable, Text, TextInput, View } from "react-native";
import type { Question } from "@synaptek/curriculum";
import { MathText } from "@/components/math/MathText";

interface AnswerInputProps {
  question: Question;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}

export function AnswerInput({ question, value, onChange }: AnswerInputProps) {
  switch (question.type) {
    case "mcq":
      return (
        <View className="gap-3">
          {(question.choices ?? []).map((c) => {
            const selected = value === c;
            return (
              <Pressable
                key={c}
                accessibilityLabel={c}
                onPress={() => onChange(c)}
                className={`min-h-[56px] flex-row items-center justify-center rounded-md border-2 px-4 ${
                  selected ? "border-num bg-num/10" : "border-line bg-surface"
                }`}
              >
                <MathText
                  value={c}
                  size={22}
                  weight="700"
                  color={selected ? "#2563eb" : "#18181b"}
                />
              </Pressable>
            );
          })}
        </View>
      );

    case "true-false":
      return (
        <View className="flex-row gap-3">
          {[
            { v: "true", label: "Đúng" },
            { v: "false", label: "Sai" },
          ].map(({ v, label }) => {
            const selected = value === v;
            return (
              <Pressable
                key={v}
                accessibilityLabel={label}
                onPress={() => onChange(v)}
                className={`min-h-[56px] flex-1 items-center justify-center rounded-md border-2 ${
                  selected ? "border-num bg-num/10" : "border-line bg-surface"
                }`}
              >
                <Text
                  className={`font-display text-xl font-bold ${selected ? "text-num" : "text-ink"}`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );

    case "fill-blank": {
      const arr = Array.isArray(value) ? value : [];
      // Số ô = số dấu "__" trong đề (chạy cho cả content + câu tự soạn ẩn đáp án); fallback theo correct.
      const fromPrompt = (question.prompt.match(/_{2,}/g) ?? []).length;
      const n =
        fromPrompt > 0 ? fromPrompt : Array.isArray(question.correct) ? question.correct.length : 1;
      return (
        <View className="flex-row flex-wrap gap-2">
          {Array.from({ length: n }).map((_, i) => (
            <TextInput
              key={i}
              value={arr[i] ?? ""}
              onChangeText={(t) => {
                const next = [...arr];
                next[i] = t;
                onChange(next);
              }}
              placeholder={`Ô ${i + 1}`}
              keyboardType="numbers-and-punctuation"
              className="min-h-[56px] min-w-[80px] flex-1 rounded-md border-2 border-line bg-surface px-3 text-center font-display text-xl"
            />
          ))}
        </View>
      );
    }

    default:
      // numeric | fraction | expression → bàn phím số tùy biến
      return <NumericKeypad value={typeof value === "string" ? value : ""} onChange={onChange} />;
  }
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "/", "0", ","];

function NumericKeypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hasFrac = value.includes("/");
  const [num, den] = hasFrac ? value.split("/") : [value, ""];
  return (
    <View className="gap-3">
      {/* ô hiển thị đáp án đang nhập */}
      <View className="min-h-[64px] items-center justify-center rounded-md border-2 border-num/30 bg-num/5 px-4">
        {value.length === 0 ? (
          <Text className="text-base text-muted">Nhập đáp án…</Text>
        ) : hasFrac ? (
          <Fraction num={num} den={den || " "} />
        ) : (
          <Text className="font-display text-3xl font-extrabold text-ink">{value}</Text>
        )}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {KEYS.map((k) => (
          <Pressable
            key={k}
            onPress={() => onChange(value + k)}
            className={`h-14 items-center justify-center rounded-md ${
              k === "/" || k === "," ? "bg-num/10" : "bg-paper"
            }`}
            style={{ width: "31%" }}
          >
            <Text
              className={`font-display text-2xl font-bold ${
                k === "/" || k === "," ? "text-num" : "text-ink"
              }`}
            >
              {k}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => onChange(value.slice(0, -1))}
          className="h-14 items-center justify-center rounded-md bg-paper"
          style={{ width: "31%" }}
        >
          <Text className="text-2xl">⌫</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Fraction({ num, den }: { num: string; den: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text className="font-display text-2xl font-extrabold text-ink">{num}</Text>
      <View style={{ height: 2.5, alignSelf: "stretch", backgroundColor: "#18181b" }} />
      <Text className="font-display text-2xl font-extrabold text-ink">{den}</Text>
    </View>
  );
}
