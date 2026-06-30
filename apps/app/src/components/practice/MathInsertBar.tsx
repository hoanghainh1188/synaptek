// Thanh chèn nhanh ký hiệu toán cho ô SOẠN câu (web: bàn phím vật lý vẫn gõ được; thanh này tiện cho mũ/ngoặc/biến).
import { Pressable, Text, View } from "react-native";

export function MathInsertBar({
  keys,
  onInsert,
}: {
  keys: string[];
  onInsert: (k: string) => void;
}) {
  return (
    <View className="mt-2 flex-row flex-wrap gap-2">
      {keys.map((k) => (
        <Pressable
          key={k}
          accessibilityLabel={`Chèn ${k}`}
          onPress={() => onInsert(k)}
          className="min-h-[40px] min-w-[44px] items-center justify-center rounded-md border-2 border-num/30 bg-num/5 px-2"
        >
          <Text className="font-display text-lg font-bold text-num">{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}
