// Kết quả phiên: donut + thống kê + cần ôn lại + động viên.
import { Pressable, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { MathText } from "@/components/math/MathText";
import { Mascot } from "@/components/Mascot";

interface WrongItem {
  id: string;
  prompt: string;
}

interface SessionResultProps {
  total: number;
  correct: number;
  score: number; // 0..1
  wrong: WrongItem[];
  topicName: string;
  onRetry: () => void;
  onHome: () => void;
}

function Donut({ correct, total }: { correct: number; total: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : correct / total;
  const offset = circ * (1 - pct);
  return (
    <View style={{ width: 176, height: 176, alignItems: "center", justifyContent: "center" }}>
      <Svg
        width={176}
        height={176}
        viewBox="0 0 120 120"
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle cx={60} cy={60} r={r} fill="none" stroke="#e4e4e7" strokeWidth={14} />
        <Circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke="#16a34a"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text className="font-display text-5xl font-extrabold text-ink">
          {correct}
          <Text className="text-2xl text-muted">/{total}</Text>
        </Text>
        <Text className="text-sm font-extrabold text-ok">{Math.round(pct * 100)}% đúng</Text>
      </View>
    </View>
  );
}

export function SessionResult({
  total,
  correct,
  wrong,
  topicName,
  onRetry,
  onHome,
}: SessionResultProps) {
  return (
    <View className="items-center">
      <Mascot size={64} />
      <Text className="mt-3 font-display text-3xl font-bold text-ink">Hoàn thành phiên!</Text>
      <Text className="text-sm font-semibold text-muted">{topicName}</Text>

      <View className="mt-6">
        <Donut correct={correct} total={total} />
      </View>

      <View className="mt-6 flex-row gap-3">
        <Stat value={String(correct)} label="Đúng" tone="bg-ok/10 text-ok" />
        <Stat value={String(wrong.length)} label="Cần ôn" tone="bg-no/10 text-no" />
      </View>

      {wrong.length > 0 && (
        <View className="mt-6 w-full rounded-lg bg-surface p-4 shadow-sm">
          <Text className="text-[13px] font-extrabold uppercase tracking-wide text-muted">
            Cần ôn lại
          </Text>
          <View className="mt-2 gap-2">
            {wrong.map((w) => (
              <View key={w.id} className="flex-row items-center gap-2 rounded-md bg-paper p-2.5">
                <Text className="text-no">●</Text>
                <View className="flex-1">
                  <MathText value={w.prompt} size={15} weight="600" />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text className="mt-5 font-display text-lg font-semibold text-brand">
        Em tiến bộ rồi đó! 💪
      </Text>

      <View className="mt-4 w-full flex-row gap-2">
        <Pressable
          onPress={onRetry}
          className="min-h-[52px] flex-1 items-center justify-center rounded-md bg-surface shadow-sm"
        >
          <Text className="font-display text-base font-bold text-ink">Luyện lại</Text>
        </Pressable>
        <Pressable
          onPress={onHome}
          className="min-h-[52px] flex-1 items-center justify-center rounded-md bg-brand"
        >
          <Text className="font-display text-base font-bold text-white">Về trang chủ</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: string }) {
  const [bg, text] = tone.split(" ");
  return (
    <View className={`items-center rounded-md px-5 py-2 ${bg}`}>
      <Text className={`font-display text-xl font-extrabold ${text}`}>{value}</Text>
      <Text className="text-xs font-bold text-muted">{label}</Text>
    </View>
  );
}
