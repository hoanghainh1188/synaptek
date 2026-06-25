// Route đăng nhập (US2, T031).
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { AuthForm } from "@/components/auth/AuthForm";
import { Mascot } from "@/components/Mascot";

export default function Login() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: 40,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        className="mb-4 h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm"
      >
        <Text className="text-lg text-muted">←</Text>
      </Pressable>
      <View className="items-center">
        <Mascot size={56} />
        <Text className="mt-2 font-display text-xl font-extrabold text-brand">Synaptek</Text>
        <Text className="text-sm text-muted">Đăng nhập để lưu tiến độ học của em</Text>
      </View>
      <View className="mt-6">
        <AuthForm onDone={() => router.replace("/")} />
      </View>
    </ScrollView>
  );
}
