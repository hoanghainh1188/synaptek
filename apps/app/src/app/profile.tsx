// Hồ sơ học sinh (US2 T036 · US3 T048: nhắc ôn). XP · streak · huy hiệu · bật/tắt nhắc. Guest → mời đăng nhập.
import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getBadges } from "@/lib/content";
import { useAuth } from "@/lib/supabase/auth";
import { useGamification } from "@/lib/supabase/gamification";
import { useMyRole, useSetRole } from "@/lib/supabase/role";
import { registerForPush } from "@/lib/notifications";
import { useSavePushToken, useSetPushEnabled } from "@/lib/supabase/push";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { Mascot } from "@/components/Mascot";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const gami = useGamification();
  const catalog = getBadges();

  const role = useMyRole();
  const setRole = useSetRole();
  const savePush = useSavePushToken();
  const setPushEnabled = useSetPushEnabled();
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  const state = gami.data?.state;
  const earned = new Set(gami.data?.earnedBadgeIds ?? []);

  const enableReminders = async () => {
    const reg = await registerForPush();
    if (!reg) {
      setPushMsg(
        Platform.OS === "web"
          ? "Nhắc qua thông báo chỉ có trên điện thoại — bạn vẫn thấy mục “đến hạn ôn” ở trang chủ."
          : "Chưa bật được thông báo (cần thiết bị thật + cấp quyền).",
      );
      return;
    }
    savePush.mutate(reg);
    setPushMsg("Đã bật nhắc ôn tập 🔔");
  };

  const disableReminders = () => {
    setPushEnabled.mutate(false);
    setPushMsg("Đã tắt nhắc ôn tập.");
  };

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
      <Text className="font-display text-3xl font-extrabold text-ink">Hồ sơ</Text>

      {!user ? (
        <Pressable
          onPress={() => router.push("/login")}
          accessibilityLabel="Đăng nhập"
          className="mt-5 flex-row items-center gap-3 rounded-lg bg-brand px-4 py-4"
        >
          <View className="rounded-full bg-white/20 p-1">
            <Mascot size={36} color="#ffffff" />
          </View>
          <Text className="flex-1 font-bold text-white">
            Đăng nhập để tích XP, giữ streak và sưu tầm huy hiệu nhé!
          </Text>
        </Pressable>
      ) : (
        <View className="mt-5 flex-row gap-3">
          <StatCard value={String(state?.totalXp ?? 0)} label="XP" accent="#4f46e5" />
          <StatCard value={`${state?.currentStreak ?? 0}🔥`} label="Streak" accent="#ea580c" />
          <StatCard value={String(state?.longestStreak ?? 0)} label="Kỷ lục" accent="#16a34a" />
        </View>
      )}

      {user && (
        <View className="mt-8">
          <Text className="font-display text-xl font-bold text-ink">Lớp học</Text>
          {role.data === "teacher" ? (
            <Pressable
              accessibilityLabel="Lớp của tôi"
              onPress={() => router.push("/classes")}
              className="mt-3 min-h-[48px] flex-row items-center justify-center gap-2 rounded-md bg-brand"
            >
              <Text className="font-display font-bold text-white">Lớp của tôi ›</Text>
            </Pressable>
          ) : (
            <View className="mt-3 gap-2">
              <Pressable
                accessibilityLabel="Bài được giao"
                onPress={() => router.push("/assignments")}
                className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-md bg-brand"
              >
                <Text className="font-display font-bold text-white">Bài được giao ›</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Vào lớp bằng mã"
                onPress={() => router.push("/join")}
                className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-md bg-surface shadow-sm"
              >
                <Text className="font-display font-bold text-ink">Vào lớp bằng mã ›</Text>
              </Pressable>
            </View>
          )}

          {/* Đổi vai trò (polish) — lỡ chọn sai khi đăng ký vẫn đổi được */}
          <Text className="mt-4 mb-1 text-sm font-bold text-muted">Vai trò</Text>
          <View className="flex-row gap-2">
            {(
              [
                ["student", "Học sinh"],
                ["teacher", "Giáo viên"],
              ] as const
            ).map(([value, label]) => {
              const active = role.data === value;
              return (
                <Pressable
                  key={value}
                  accessibilityLabel={`Đặt vai trò ${label}`}
                  disabled={active || setRole.isPending}
                  onPress={() => setRole.mutate(value)}
                  className={`min-h-[44px] flex-1 items-center justify-center rounded-md border-2 ${active ? "border-brand bg-brand/10" : "border-line bg-surface"}`}
                >
                  <Text
                    className={`font-display font-bold ${active ? "text-brand" : "text-muted"}`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {user && (
        <View className="mt-8">
          <Text className="font-display text-xl font-bold text-ink">Nhắc ôn tập</Text>
          <Text className="mt-1 text-sm text-muted">
            Bật để nhận nhắc khi có kỹ năng đến hạn ôn. (Thông báo đẩy chỉ trên điện thoại.)
          </Text>
          <View className="mt-3 flex-row gap-2">
            <Pressable
              accessibilityLabel="Bật nhắc ôn tập"
              onPress={enableReminders}
              className="min-h-[48px] flex-1 items-center justify-center rounded-md bg-brand"
            >
              <Text className="font-display font-bold text-white">Bật nhắc</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Tắt nhắc ôn tập"
              onPress={disableReminders}
              className="min-h-[48px] flex-1 items-center justify-center rounded-md bg-surface shadow-sm"
            >
              <Text className="font-display font-bold text-ink">Tắt nhắc</Text>
            </Pressable>
          </View>
          {pushMsg && <Text className="mt-2 text-sm font-semibold text-brand">{pushMsg}</Text>}
        </View>
      )}

      <Text className="mt-8 font-display text-xl font-bold text-ink">
        Huy hiệu{" "}
        <Text className="text-base font-bold text-muted">
          ({earned.size}/{catalog.length})
        </Text>
      </Text>
      <View className="mt-3">
        <BadgeGrid catalog={catalog} earned={earned} />
      </View>
    </ScrollView>
  );
}

function StatCard({ value, label, accent }: { value: string; label: string; accent: string }) {
  return (
    <View
      className="flex-1 items-center rounded-lg bg-surface py-4 shadow-sm"
      style={{ borderTopWidth: 3, borderTopColor: accent }}
    >
      <Text className="font-display text-2xl font-extrabold text-ink">{value}</Text>
      <Text className="text-xs font-bold text-muted">{label}</Text>
    </View>
  );
}
