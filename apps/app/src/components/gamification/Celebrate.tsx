// Ăn mừng mở huy hiệu / đạt mốc (US2, T037, FR-012). Chỉ transform/opacity; tôn trọng reduced-motion.
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { Badge } from "@synaptek/learning-path";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface CelebrateProps {
  badges: Badge[];
}

/** Dải huy hiệu vừa mở, hiện ngay sau phiên. Rỗng → không render. */
export function Celebrate({ badges }: CelebrateProps) {
  if (badges.length === 0) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={`Mở huy hiệu mới: ${badges.map((b) => b.name).join(", ")}`}
      className="w-full rounded-lg bg-brand/10 p-4"
    >
      <Text className="text-center font-display text-base font-extrabold text-brand">
        🎉 Tuyệt vời! Em vừa mở huy hiệu mới
      </Text>
      <View className="mt-3 flex-row flex-wrap justify-center gap-3">
        {badges.map((b, i) => (
          <Pop key={b.id} index={i}>
            <View className="items-center" style={{ width: 96 }}>
              <Text style={{ fontSize: 40 }}>{b.icon}</Text>
              <Text className="mt-1 text-center font-display text-xs font-bold text-ink">
                {b.name}
              </Text>
            </View>
          </Pop>
        ))}
      </View>
    </View>
  );
}

function Pop({ children, index }: { children: React.ReactNode; index: number }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(reduced ? 1 : 0);
  const opacity = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    const delay = index * 120;
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.15, { duration: 220, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 140 }),
      ),
    );
  }, [reduced, index, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
