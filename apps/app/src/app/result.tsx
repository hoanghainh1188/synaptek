// Route kết quả phiên (US1, T026).
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { SessionResult } from "@/components/practice/SessionResult";

interface ParsedResult {
  total: number;
  correct: number;
  score: number;
  wrong: { id: string; prompt: string }[];
}

export default function Result() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ data: string; topic: string; topicId: string }>();

  let parsed: ParsedResult = { total: 0, correct: 0, score: 0, wrong: [] };
  try {
    parsed = { ...parsed, ...JSON.parse(params.data ?? "{}") };
  } catch {
    // dữ liệu hỏng → giữ mặc định
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: 48,
        paddingHorizontal: 20,
      }}
    >
      <SessionResult
        total={parsed.total}
        correct={parsed.correct}
        score={parsed.score}
        wrong={parsed.wrong}
        topicName={String(params.topic ?? "")}
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
