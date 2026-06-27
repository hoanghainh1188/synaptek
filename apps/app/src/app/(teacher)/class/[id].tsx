// Route GV — chi tiết lớp: mã mời + roster + xóa HS (M3 US1, T013). (Bài tập/phân tích: US2/US3.)
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  useMyClasses,
  useRegenerateInvite,
  useRemoveMember,
  useRoster,
} from "@/lib/supabase/classes";

export default function ClassDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const classId = String(id);
  const classes = useMyClasses();
  const roster = useRoster(classId);
  const regenerate = useRegenerateInvite();
  const removeMember = useRemoveMember(classId);

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
