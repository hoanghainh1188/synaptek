// Hồ sơ học sinh (US2, T036): XP · streak · huy hiệu. Guest → mời đăng nhập.
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getBadges } from "@/lib/content";
import { useAuth } from "@/lib/supabase/auth";
import { useGamification } from "@/lib/supabase/gamification";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { Mascot } from "@/components/Mascot";
import { Pressable } from "react-native";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const gami = useGamification();
  const catalog = getBadges();

  const state = gami.data?.state;
  const earned = new Set(gami.data?.earnedBadgeIds ?? []);

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
