// Route kết quả phiên (US1 T026 · US2 T034: XP + huy hiệu mới).
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { getBadges } from "@/lib/content";
import { SessionResult } from "@/components/practice/SessionResult";
import { Celebrate } from "@/components/gamification/Celebrate";

interface ParsedResult {
  total: number;
  correct: number;
  partial: number;
  score: number;
  wrong: { id: string; prompt: string }[];
  xpGained?: number;
  totalXp?: number | null;
  newBadgeIds?: string[];
}

export default function Result() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ data: string; topic: string; topicId: string }>();

  let parsed: ParsedResult = { total: 0, correct: 0, partial: 0, score: 0, wrong: [] };
  try {
    parsed = { ...parsed, ...JSON.parse(params.data ?? "{}") };
  } catch {
    // dữ liệu hỏng → giữ mặc định
  }

  const newBadges = getBadges().filter((b) => (parsed.newBadgeIds ?? []).includes(b.id));

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: 48,
        paddingHorizontal: 20,
        maxWidth: 640,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <SessionResult
        total={parsed.total}
        correct={parsed.correct}
        partial={parsed.partial}
        score={parsed.score}
        wrong={parsed.wrong}
        topicName={String(params.topic ?? "")}
        xpGained={parsed.xpGained}
        totalXp={parsed.totalXp ?? null}
        celebration={<Celebrate badges={newBadges} />}
        onRetry={() =>
          router.replace({
            pathname: "/practice/[topicId]",
            params: { topicId: String(params.topicId ?? "") },
          })
        }
        onHome={() => router.replace("/")}
      />
    </ScrollView>
  );
}
