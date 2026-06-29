// Route HS — chi tiết lớp đang tham gia (read-only): tên lớp + GV + sĩ số + bài được giao + trạng thái nộp.
import { ScrollView, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useMyJoinedClasses } from "@/lib/supabase/classes";
import { useClassAssignments } from "@/lib/supabase/assignments";
import { useMySubmissions } from "@/lib/supabase/submissions";
import { BackButton } from "@/components/BackButton";

function dueLabel(dueAt: string | null): string {
  if (!dueAt) return "Không hạn";
  const d = new Date(dueAt);
  return `Hạn: ${d.toLocaleDateString("vi-VN")}`;
}

export default function MyClassDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const classId = String(id);
  const classes = useMyJoinedClasses();
  const assignments = useClassAssignments(classId);
  const subs = useMySubmissions();
  const cls = classes.data?.find((c) => c.id === classId);

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
      <BackButton />
      <Text className="font-display text-2xl font-extrabold text-ink">{cls?.name ?? "Lớp"}</Text>
      <Text className="mt-1 text-sm text-muted">
        {cls?.teacherName ?? "Giáo viên"} · {cls?.memberCount ?? 0} thành viên
      </Text>

      <Text className="mt-6 font-display text-xl font-bold text-ink">Bài được giao</Text>
      <View className="mt-3 gap-2">
        {assignments.data?.length === 0 && (
          <Text className="text-sm text-muted">Lớp chưa giao bài nào.</Text>
        )}
        {assignments.data?.map((a) => {
          const score = subs.data?.[a.id];
          const done = score !== undefined && score !== null;
          return (
            <Pressable
              key={a.id}
              accessibilityLabel={`Bài ${a.title}`}
              onPress={() => router.push(`/assignment/${a.id}`)}
              className="flex-row items-center gap-3 rounded-lg bg-surface p-3 shadow-sm"
            >
              <View className="flex-1">
                <Text className="font-display font-bold text-ink">{a.title}</Text>
                <Text className="text-xs font-semibold text-muted">
                  {a.questionIds.length} câu · {dueLabel(a.dueAt)}
                </Text>
              </View>
              {done ? (
                <View className="rounded-full bg-ok/10 px-2.5 py-1">
                  <Text className="text-xs font-extrabold text-ok">{Math.round(score * 100)}%</Text>
                </View>
              ) : (
                <View className="rounded-full bg-line px-2.5 py-1">
                  <Text className="text-xs font-bold text-muted">Chưa nộp</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
