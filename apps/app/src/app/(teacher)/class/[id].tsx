// Route GV — chi tiết lớp: mã mời + roster + xóa HS (M3 US1, T013). (Bài tập/phân tích: US2/US3.)
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { classWeakSkills } from "@synaptek/classroom";
import {
  useClassMastery,
  useMyClasses,
  useRegenerateInvite,
  useRemoveMember,
  useRoster,
} from "@/lib/supabase/classes";
import { useClassAssignments } from "@/lib/supabase/assignments";
import { skillName } from "@/lib/content";

export default function ClassDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const classId = String(id);
  const classes = useMyClasses();
  const roster = useRoster(classId);
  const assignments = useClassAssignments(classId);
  const classMastery = useClassMastery(classId);
  const regenerate = useRegenerateInvite();
  const removeMember = useRemoveMember(classId);

  const cls = classes.data?.find((c) => c.id === classId);
  const weak = classWeakSkills(classMastery.data ?? [], 5);

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

      <Text className="font-display text-2xl font-extrabold text-ink">{cls?.name ?? "Lớp"}</Text>

      {/* Mã mời */}
      <View className="mt-4 rounded-lg bg-brand/10 p-4">
        <Text className="text-sm font-bold text-muted">Mã mời</Text>
        <Text className="mt-1 font-display text-3xl font-extrabold tracking-widest text-brand">
          {cls?.inviteCode ?? "…"}
        </Text>
        <Text className="mt-1 text-xs text-muted">Chia sẻ mã này để học sinh vào lớp.</Text>
        <Pressable
          accessibilityLabel="Tạo lại mã"
          onPress={() => regenerate.mutate(classId)}
          className="mt-3 min-h-[44px] items-center justify-center self-start rounded-md bg-surface px-4 shadow-sm"
        >
          <Text className="font-display font-bold text-ink">Tạo lại mã (thu hồi mã cũ)</Text>
        </Pressable>
      </View>

      {/* Bài tập */}
      <View className="mt-7 flex-row items-center justify-between">
        <Text className="font-display text-xl font-bold text-ink">
          Bài tập{" "}
          <Text className="text-base font-bold text-muted">({assignments.data?.length ?? 0})</Text>
        </Text>
        <Pressable
          accessibilityLabel="Soạn bài tập"
          onPress={() => router.push(`/assignment/new?classId=${classId}`)}
          className="min-h-[40px] items-center justify-center rounded-md bg-brand px-3"
        >
          <Text className="font-display font-bold text-white">+ Giao bài</Text>
        </Pressable>
      </View>
      <View className="mt-3 gap-2">
        {assignments.data?.length === 0 && (
          <Text className="text-sm text-muted">Chưa giao bài nào.</Text>
        )}
        {assignments.data?.map((a) => (
          <Pressable
            key={a.id}
            accessibilityLabel={`Chấm ${a.title}`}
            onPress={() => router.push(`/grade/${a.id}`)}
            className="flex-row items-center rounded-lg bg-surface p-3 shadow-sm"
          >
            <View className="flex-1">
              <Text className="font-display font-bold text-ink">{a.title}</Text>
              <Text className="text-xs font-semibold text-muted">
                {a.questionIds.length} câu · chạm để chấm
              </Text>
            </View>
            <Text className="text-2xl text-muted">›</Text>
          </Pressable>
        ))}
      </View>

      {/* Phân tích lớp — điểm yếu chung (FR-014, dùng @synaptek/classroom) */}
      {weak.length > 0 && (
        <View className="mt-7">
          <Text className="font-display text-xl font-bold text-ink">Điểm yếu của lớp</Text>
          <View className="mt-3 gap-2">
            {weak.map((w) => (
              <View key={w.skillId} className="rounded-lg bg-surface p-3 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 font-semibold text-ink">{skillName(w.skillId)}</Text>
                  <Text className="text-sm font-bold text-no">
                    {Math.round(w.avgMastery * 100)}%
                  </Text>
                </View>
                <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                  <View
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.round(w.avgMastery * 100)}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Roster */}
      <Text className="mt-7 font-display text-xl font-bold text-ink">
        Học sinh{" "}
        <Text className="text-base font-bold text-muted">({roster.data?.length ?? 0})</Text>
      </Text>
      <View className="mt-3 gap-2">
        {roster.data?.length === 0 && (
          <View className="rounded-lg border-2 border-dashed border-line p-6">
            <Text className="text-center text-muted">
              Chưa có học sinh — chia sẻ mã mời ở trên.
            </Text>
          </View>
        )}
        {roster.data?.map((m) => (
          <View
            key={m.studentId}
            className="flex-row items-center gap-3 rounded-lg bg-surface p-3 shadow-sm"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-brand">
              <Text className="font-display font-extrabold text-white">
                {(m.fullName ?? "?").charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="flex-1 font-semibold text-ink">{m.fullName ?? "Học sinh"}</Text>
            <Pressable
              accessibilityLabel={`Xóa ${m.fullName ?? "học sinh"}`}
              onPress={() => removeMember.mutate(m.studentId)}
              className="min-h-[40px] items-center justify-center rounded-md px-3"
            >
              <Text className="font-bold text-no">Xóa</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
