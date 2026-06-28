// Route PH — bảng theo dõi 1 con (M4 US2, read-only): điểm yếu + XP/streak + tổng quan luyện + kết quả bài.
import { ScrollView, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useChildProgress } from "@/lib/supabase/parent";
import { skillName } from "@/lib/content";

export default function ChildMonitor() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = useChildProgress(String(id));
  const d = p.data;

  const accuracy =
    d && d.attemptsCount > 0 ? Math.round((d.correctCount / d.attemptsCount) * 100) : null;

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
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Quay lại"
        className="mb-3 h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm"
      >
        <Text className="text-lg text-muted">←</Text>
      </Pressable>
      <Text className="font-display text-2xl font-extrabold text-ink">{d?.fullName ?? "Con"}</Text>
      <Text className="mt-1 text-sm text-muted">Theo dõi tiến độ (chỉ xem)</Text>

      {/* Tổng quan */}
      <View className="mt-5 flex-row gap-3">
        <Stat value={String(d?.totalXp ?? 0)} label="XP" accent="#4f46e5" />
        <Stat value={`${d?.currentStreak ?? 0}🔥`} label="Streak" accent="#ea580c" />
        <Stat
          value={accuracy === null ? "—" : `${accuracy}%`}
          label="Độ chính xác"
          accent="#16a34a"
        />
      </View>
      <Text className="mt-2 text-xs font-semibold text-muted">
        Đã luyện {d?.attemptsCount ?? 0} câu · đúng {d?.correctCount ?? 0}
      </Text>

      {/* Điểm yếu */}
      <Text className="mt-7 font-display text-xl font-bold text-ink">Điểm yếu cần ôn</Text>
      <View className="mt-3 gap-2">
        {(d?.weakSkills.length ?? 0) === 0 && (
          <Text className="text-sm text-muted">
            Chưa có dữ liệu luyện tập để phân tích điểm yếu.
          </Text>
        )}
        {d?.weakSkills.map((w) => (
          <View key={w.skillId} className="rounded-lg bg-surface p-3 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 font-semibold text-ink">{skillName(w.skillId)}</Text>
              <Text className="text-sm font-bold text-no">{Math.round(w.mastery * 100)}%</Text>
            </View>
            <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
              <View
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.round(w.mastery * 100)}%` }}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Kết quả bài được giao */}
      {(d?.submissions.length ?? 0) > 0 && (
        <View className="mt-7">
          <Text className="font-display text-xl font-bold text-ink">Bài đã làm</Text>
          <View className="mt-3 gap-2">
            {d?.submissions.map((s, i) => (
              <View
                key={s.assignmentId}
                className="flex-row items-center justify-between rounded-lg bg-surface p-3 shadow-sm"
              >
                <Text className="font-semibold text-ink">Bài {i + 1}</Text>
                <Text className="font-display font-bold text-brand">
                  {s.displayScore === null ? "—" : `${Math.round(s.displayScore * 100)}%`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View
      className="flex-1 items-center rounded-lg bg-surface py-4 shadow-sm"
      style={{ borderTopWidth: 3, borderTopColor: accent }}
    >
      <Text className="font-display text-xl font-extrabold text-ink">{value}</Text>
      <Text className="text-xs font-bold text-muted">{label}</Text>
    </View>
  );
}
