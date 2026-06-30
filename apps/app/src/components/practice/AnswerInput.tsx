// Ô nhập đáp án theo loại câu hỏi (controlled). Vùng chạm ≥48px (trẻ em).
import { useEffect } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { Question } from "@synaptek/curriculum";
import { MathText } from "@/components/math/MathText";

/** Sắp thứ tự: hiện danh sách + nút ↑/↓; value = thứ tự hiện tại (khởi tạo theo items hiển thị). */
function OrderingInput({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string | string[];
  onChange: (v: string[]) => void;
}) {
  const order = Array.isArray(value) && value.length === items.length ? value : items;
  useEffect(() => {
    if (!Array.isArray(value) || value.length !== items.length) onChange(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-muted">Sắp đúng thứ tự (dùng ↑ ↓):</Text>
      {order.map((it, i) => (
        <View
          key={`${it}-${i}`}
          className="flex-row items-center gap-2 rounded-md border-2 border-line bg-surface px-3 py-2"
        >
          <Text className="w-6 text-center font-display font-extrabold text-brand">{i + 1}</Text>
          <View className="flex-1">
            <MathText value={it} size={18} weight="600" />
          </View>
          <Pressable
            accessibilityLabel={`Lên ${it}`}
            disabled={i === 0}
            onPress={() => move(i, -1)}
            className={`h-9 w-9 items-center justify-center rounded-md ${i === 0 ? "bg-paper" : "bg-brand/10"}`}
          >
            <Text className="text-lg text-brand">↑</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Xuống ${it}`}
            disabled={i === order.length - 1}
            onPress={() => move(i, 1)}
            className={`h-9 w-9 items-center justify-center rounded-md ${i === order.length - 1 ? "bg-paper" : "bg-brand/10"}`}
          >
            <Text className="text-lg text-brand">↓</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

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

    case "multi": {
      const selectedArr = Array.isArray(value) ? value : [];
      return (
        <View className="gap-3">
          <Text className="text-sm font-semibold text-muted">Chọn tất cả đáp án đúng:</Text>
          {(question.choices ?? []).map((c) => {
            const on = selectedArr.includes(c);
            return (
              <Pressable
                key={c}
                accessibilityLabel={c}
                onPress={() =>
                  onChange(on ? selectedArr.filter((x) => x !== c) : [...selectedArr, c])
                }
                className={`min-h-[56px] flex-row items-center gap-3 rounded-md border-2 px-4 ${
                  on ? "border-num bg-num/10" : "border-line bg-surface"
                }`}
              >
                <View
                  className={`h-6 w-6 items-center justify-center rounded-md border-2 ${on ? "border-num bg-num" : "border-line"}`}
                >
                  {on && <Text className="text-xs font-extrabold text-white">✓</Text>}
                </View>
                <View className="flex-1">
                  <MathText value={c} size={20} weight="700" color={on ? "#2563eb" : "#18181b"} />
                </View>
              </Pressable>
            );
          })}
        </View>
      );
    }

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

    case "ordering":
      return <OrderingInput items={question.choices ?? []} value={value} onChange={onChange} />;

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
