// Luyện TRÌNH BÀY TỪNG BƯỚC (low-stakes, client chấm — D4 cho phép low-stakes). Định vị dòng sai + điểm thành phần.
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gradeDerivation, type DerivationResult } from "@synaptek/step-grading";
import { STEP_PROBLEMS, normalizeMathInput, type StepProblem } from "@/lib/step-problems";
import { MathText } from "@/components/math/MathText";
import { BackButton } from "@/components/BackButton";

export default function StepPractice() {
  const insets = useSafeAreaInsets();
  const [problem, setProblem] = useState<StepProblem | null>(null);
  const [lines, setLines] = useState<string[]>([""]);
  const [result, setResult] = useState<DerivationResult | null>(null);

  const pick = (p: StepProblem) => {
    setProblem(p);
    setLines([""]);
    setResult(null);
  };

  const check = () => {
    if (!problem) return;
    const studentLines = lines.map((l) => normalizeMathInput(l.trim())).filter((l) => l !== "");
    const full = [normalizeMathInput(problem.start), ...studentLines];
    setResult(
      gradeDerivation(full, {
        mode: problem.mode,
        variable: problem.variable,
        target: problem.target,
      }),
    );
  };

  // Trạng thái mỗi dòng HS (index j → dòng đầy đủ j+1).
  const lineState = (j: number): "ok" | "err" | "none" => {
    if (!result) return "none";
    const fullIdx = j + 1;
    if (result.firstErrorIndex === fullIdx) return "err";
    if (result.firstErrorIndex < 0 || fullIdx < result.firstErrorIndex) return "ok";
    return "none"; // sau dòng sai → chưa chấm
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 64,
        paddingHorizontal: 20,
        maxWidth: 640,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <BackButton />
      <Text className="font-display text-2xl font-extrabold text-ink">Trình bày từng bước</Text>
      <Text className="mt-1 text-sm text-muted">
        Giải mỗi dòng một bước. Hệ thống kiểm từng bước và chỉ ra chỗ sai đầu tiên.
      </Text>

      {!problem ? (
        <View className="mt-5 gap-2">
          {STEP_PROBLEMS.map((p) => (
            <Pressable
              key={p.id}
              accessibilityLabel={`Bài ${p.id}`}
              onPress={() => pick(p)}
              className="rounded-lg bg-surface p-4 shadow-sm"
            >
              <Text className="font-semibold text-ink">{p.prompt}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="mt-5">
          <Text className="font-display text-base font-bold text-ink">{problem.prompt}</Text>

          {/* Dòng đề (cho sẵn) */}
          <View className="mt-3 rounded-md bg-paper p-3">
            <Text className="text-xs font-bold text-muted">Đề</Text>
            <MathText value={problem.start} size={18} weight="700" />
          </View>

          {/* Các dòng HS nhập */}
          <View className="mt-3 gap-2">
            {lines.map((l, j) => {
              const st = lineState(j);
              return (
                <View key={j} className="flex-row items-center gap-2">
                  <Text className="w-6 text-center font-display font-extrabold text-muted">
                    {j + 1}
                  </Text>
                  <TextInput
                    value={l}
                    onChangeText={(v) => setLines((prev) => prev.map((x, k) => (k === j ? v : x)))}
                    placeholder={problem.mode === "equation" ? "vd 2x = 4" : "vd 12 + 12"}
                    placeholderTextColor="#a1a1aa"
                    accessibilityLabel={`Dòng ${j + 1}`}
                    className={`min-h-[48px] flex-1 rounded-md border-2 px-3 text-base text-ink ${
                      st === "err"
                        ? "border-no bg-no/5"
                        : st === "ok"
                          ? "border-ok bg-ok/5"
                          : "border-line bg-paper"
                    }`}
                  />
                  <Text className="w-6 text-center text-lg">
                    {st === "ok" ? "✓" : st === "err" ? "✗" : ""}
                  </Text>
                </View>
              );
            })}
          </View>

          <Pressable
            accessibilityLabel="Thêm dòng"
            onPress={() => setLines((prev) => [...prev, ""])}
            className="mt-2 self-start"
          >
            <Text className="font-bold text-brand">+ Thêm dòng</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Kiểm tra"
            onPress={check}
            className="mt-4 min-h-[52px] items-center justify-center rounded-md bg-brand"
          >
            <Text className="font-display text-lg font-bold text-white">Kiểm tra</Text>
          </Pressable>

          {result && (
            <View
              className={`mt-4 rounded-lg p-4 ${result.reachedGoal ? "bg-ok/10" : "bg-surface shadow-sm"}`}
            >
              {result.reachedGoal ? (
                <Text className="font-display text-lg font-extrabold text-ok">
                  🎉 Đúng trọn vẹn! ({result.validSteps}/{result.totalSteps} bước)
                </Text>
              ) : result.firstErrorIndex > 0 ? (
                <Text className="font-display text-base font-bold text-ink">
                  Sai từ dòng {result.firstErrorIndex}. Đúng {result.validSteps}/{result.totalSteps}{" "}
                  bước — xem lại nhé!
                </Text>
              ) : (
                <Text className="font-display text-base font-bold text-ink">
                  Các bước hợp lệ ({result.validSteps}/{result.totalSteps}) nhưng chưa tới đích —
                  giải tiếp nhé!
                </Text>
              )}
            </View>
          )}

          <Pressable
            accessibilityLabel="Chọn bài khác"
            onPress={() => setProblem(null)}
            className="mt-4"
          >
            <Text className="font-bold text-brand">← Chọn bài khác</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
