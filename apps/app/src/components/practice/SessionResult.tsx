// Kết quả phiên: donut + thống kê + XP + huy hiệu mới + cần ôn lại + động viên.
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { MathText } from "@/components/math/MathText";
import { Mascot } from "@/components/Mascot";
import { ratingMessage } from "@/lib/session-rating";

interface WrongItem {
  id: string;
  prompt: string;
}

interface SessionResultProps {
  total: number;
  correct: number;
  /** Số câu đúng một phần (0<score<1) — chỉ hiện chip khi >0. */
  partial?: number;
  score: number; // 0..1 (đón điểm thành phần)
  wrong: WrongItem[];
  topicName: string;
  /** XP nhận được trong phiên (FR-009). */
  xpGained?: number;
  /** Tổng XP sau phiên (chỉ khi đăng nhập). */
  totalXp?: number | null;
  /** Khối ăn mừng huy hiệu mới (FR-012). */
  celebration?: ReactNode;
  onRetry: () => void;
  onHome: () => void;
}

// Vòng tròn: TÂM hiện số câu đúng trọn vẹn (correct/total), CUNG + % theo ĐIỂM (score, đón điểm thành
// phần). Khi không có câu đúng-một-phần thì score = correct/total → hiển thị y hệt trước đây.
function Donut({ correct, total, score }: { correct: number; total: number; score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score));
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
  partial = 0,
  score,
  wrong,
  topicName,
  xpGained,
  totalXp,
  celebration,
  onRetry,
  onHome,
}: SessionResultProps) {
  return (
    <View className="items-center">
      <Mascot size={64} />
      <Text className="mt-3 font-display text-3xl font-bold text-ink">Hoàn thành phiên!</Text>
      <Text className="text-sm font-semibold text-muted">{topicName}</Text>

      <View className="mt-6">
        <Donut correct={correct} total={total} score={score} />
      </View>

      {/* Có câu đúng-một-phần → tách 3 ô rời (đúng/một phần/chưa đúng, không chồng chéo); không có →
          giữ NGUYÊN "Đúng | Cần ôn" như trước (trường hợp phổ biến, không đổi giao diện). */}
      <View className="mt-6 flex-row flex-wrap justify-center gap-3">
        <Stat value={String(correct)} label="Đúng" tone="bg-ok/10 text-ok" />
        {partial > 0 ? (
          <>
            <Stat value={String(partial)} label="Đúng một phần" tone="bg-num/10 text-num" />
            <Stat
              value={String(Math.max(0, total - correct - partial))}
              label="Chưa đúng"
              tone="bg-no/10 text-no"
            />
          </>
        ) : (
          <Stat value={String(wrong.length)} label="Cần ôn" tone="bg-no/10 text-no" />
        )}
        {typeof xpGained === "number" && (
          <Stat value={`+${xpGained}`} label="XP" tone="bg-brand/10 text-brand" />
        )}
      </View>

      {typeof xpGained === "number" && typeof totalXp === "number" && (
        <Text className="mt-2 text-xs font-bold text-muted">Tổng XP: {totalXp}</Text>
      )}

      {celebration && <View className="mt-6 w-full">{celebration}</View>}

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
        {ratingMessage(total === 0 ? 0 : score)}
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
