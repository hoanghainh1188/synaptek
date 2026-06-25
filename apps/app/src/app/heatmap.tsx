// Bản đồ điểm yếu (US1, T025). Suy từ attempts + mastery: kỹ năng yếu nhất + dạng lỗi hay mắc.
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { commonErrorType, skillWeakness } from "@synaptek/learning-path";
import { questionTypeOf, skillName, skillOfQuestion } from "@/lib/content";
import { buildMasteryMap, toSkillAttempts } from "@/lib/mastery";
import { colors } from "@/theme/tokens";
import { useAttempts } from "@/lib/supabase/attempts";

/** Thang màu mastery: thấp → đỏ; cao → xanh lá. */
function masteryColor(m: number): string {
  if (m < 0.4) return colors.incorrect; // đỏ
  if (m < 0.7) return "#f59e0b"; // hổ phách
  if (m < 0.95) return colors.num; // xanh dương
  return colors.correct; // xanh lá
}

export default function Heatmap() {
  const insets = useSafeAreaInsets();
  const attemptsQ = useAttempts();
  const attempts = attemptsQ.data ?? [];

  const cells = useMemo(() => {
    const skillAttempts = toSkillAttempts(attempts, skillOfQuestion);
    const mastery = buildMasteryMap(skillAttempts);
    return skillWeakness(skillAttempts, mastery);
  }, [attempts]);

  const errorLabels = useMemo(
    () =>
      commonErrorType(
        attempts
          .map((a) => ({
            skillId: a.skillId ?? skillOfQuestion(a.questionId),
            questionType: questionTypeOf(a.questionId) ?? "",
            isCorrect: a.isCorrect,
          }))
          .filter((x): x is { skillId: string; questionType: string; isCorrect: boolean } =>
            Boolean(x.skillId),
          ),
      ),
    [attempts],
  );

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 48,
        paddingHorizontal: 20,
        maxWidth: 640,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Quay lại"
          className="h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm"
        >
          <Text className="text-muted">‹</Text>
        </Pressable>
        <Text className="font-display text-2xl font-extrabold text-ink">Bản đồ điểm yếu</Text>
      </View>

      {cells.length === 0 ? (
        <View className="mt-6 rounded-lg border-2 border-dashed border-line p-6">
          <Text className="text-center text-muted">
            Chưa có dữ liệu — luyện vài câu để xem mình mạnh/yếu ở đâu nhé!
          </Text>
        </View>
      ) : (
        <View className="mt-5 gap-3">
          {cells.map((c) => {
            const color = masteryColor(c.mastery);
            const err = errorLabels.get(c.skillId);
            return (
              <View key={c.skillId} className="rounded-lg bg-surface p-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 font-display text-base font-bold text-ink">
                    {skillName(c.skillId)}
                  </Text>
                  <Text className="font-display font-extrabold" style={{ color }}>
                    {Math.round(c.mastery * 100)}%
                  </Text>
                </View>
                <View
                  className="mt-2 h-2.5 overflow-hidden rounded-full"
                  style={{ backgroundColor: color + "22" }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${Math.round(c.mastery * 100)}%`, backgroundColor: color }}
                  />
                </View>
                <Text className="mt-2 text-xs text-muted">
                  {c.attempts} lần làm · đúng {Math.round(c.recentAccuracy * 100)}%
                  {err ? ` · hay mắc: ${err}` : ""}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
