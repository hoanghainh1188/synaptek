// Trang chủ — chọn chủ đề (US1, T024). Lọc theo lớp; empty state khi chưa có câu hỏi.
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { GRADE_FILTERS, getQuestions, listTopics, strandOf } from "@/lib/content";
import { strandColors, type StrandKey } from "@/theme/tokens";
import { Mascot } from "@/components/Mascot";

const STRAND_LABELS: Record<string, string> = {
  num: "Số và phép tính",
  geo: "Hình học · Đo lường",
  measure: "Đo lường",
  stats: "Thống kê",
};

export default function Home() {
  const insets = useSafeAreaInsets();
  const [grade, setGrade] = useState(4);
  const topics = listTopics(grade);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 48,
        paddingHorizontal: 20,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-sm text-muted">Chào buổi sáng,</Text>
          <Text className="font-display text-3xl font-extrabold text-ink">Cùng học nhé! 👋</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-orange-100 px-3 py-1.5">
          <Text>🔥</Text>
          <Text className="font-extrabold text-geo">5</Text>
        </View>
      </View>

      <View className="mt-5 flex-row items-center gap-3 rounded-lg bg-brand px-4 py-3">
        <View className="rounded-full bg-white/20 p-1">
          <Mascot size={36} color="#ffffff" />
        </View>
        <Text className="flex-1 font-bold text-white">Hôm nay mình chinh phục Phân số nhé!</Text>
      </View>

      <View className="mt-6 flex-row items-center gap-2">
        <Text className="mr-1 text-sm font-bold text-muted">Lớp</Text>
        {GRADE_FILTERS.map((g) => {
          const active = g === grade;
          return (
            <Pressable
              key={g}
              onPress={() => setGrade(g)}
              className={`h-10 w-10 items-center justify-center rounded-full ${active ? "bg-ink" : "bg-surface"}`}
            >
              <Text className={`font-bold ${active ? "text-white" : "text-muted"}`}>{g}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-5 gap-3">
        {topics.length === 0 && (
          <View className="rounded-lg border-2 border-dashed border-line p-6">
            <Text className="text-center text-muted">Lớp này đang cập nhật nội dung…</Text>
          </View>
        )}
        {topics.map((topic) => {
          const color = strandColors[strandOf(topic.id) as StrandKey] ?? strandColors.num;
          const count = getQuestions(topic.id).length;
          const empty = count === 0;
          return (
            <Pressable
              key={topic.id}
              disabled={empty}
              onPress={() => router.push(`/practice/${topic.id}`)}
              className={`flex-row overflow-hidden rounded-lg bg-surface shadow-sm ${empty ? "opacity-60" : ""}`}
            >
              <View style={{ width: 8, backgroundColor: color }} />
              <View className="flex-1 flex-row items-center p-4">
                <View className="flex-1">
                  <Text
                    className="text-[11px] font-extrabold uppercase tracking-wide"
                    style={{ color }}
                  >
                    {STRAND_LABELS[strandOf(topic.id)] ?? "Toán"}
                  </Text>
                  <Text className="font-display text-xl font-bold text-ink">{topic.name}</Text>
                  {empty ? (
                    <Text className="text-sm italic text-muted">đang cập nhật nội dung…</Text>
                  ) : (
                    <Text className="text-xs font-semibold text-muted">{count} câu luyện tập</Text>
                  )}
                </View>
                {!empty && <Text className="text-2xl text-muted">›</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
