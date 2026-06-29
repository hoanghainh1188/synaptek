// Nút quay lại dùng chung. Nếu không có lịch sử (mở trực tiếp/deep-link) → về trang chủ.
import { Pressable, Text } from "react-native";
import { router } from "expo-router";

export function BackButton({ className }: { className?: string }) {
  return (
    <Pressable
      accessibilityLabel="Quay lại"
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      className={`h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm ${className ?? "mb-3"}`}
    >
      <Text className="text-lg text-muted">←</Text>
    </Pressable>
  );
}
