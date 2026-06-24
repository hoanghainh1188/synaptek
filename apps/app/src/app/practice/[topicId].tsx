// Route phiên luyện tập (US1, T025). useReducer(session) + chấm tức thì client.
import { useEffect, useReducer, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { buildSession } from "@synaptek/curriculum";
import { getQuestions, getTopic, strandOf } from "@/lib/content";
import { strandColors, type StrandKey } from "@/theme/tokens";
import {
  currentQuestion,
  currentRecord,
  progress,
  sessionReducer,
  sessionResult,
  startSession,
} from "@/lib/session";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { AnswerInput } from "@/components/practice/AnswerInput";
import { Feedback } from "@/components/practice/Feedback";

export default function Practice() {
  const params = useLocalSearchParams<{ topicId: string }>();
  const topicId = String(params.topicId);
  const insets = useSafeAreaInsets();
  const topic = getTopic(topicId);

  const [state, dispatch] = useReducer(sessionReducer, undefined, () =>
    startSession(topicId, buildSession(getQuestions(topicId), { count: 10 })),
  );
  const q = currentQuestion(state);
  const [value, setValue] = useState<string | string[]>("");

  // reset ô nhập khi sang câu mới
  useEffect(() => {
    setValue(currentQuestion(state)?.type === "fill-blank" ? [] : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  // xong phiên → sang kết quả
  useEffect(() => {
    if (state.status !== "finished") return;
    const r = sessionResult(state);
    router.replace({
      pathname: "/result",
      params: {
        topic: topic?.name ?? "",
        topicId,
        data: JSON.stringify({
          total: r.total,
          correct: r.correct,
          score: r.score,
          wrong: r.wrong.map((w) => ({ id: w.id, prompt: w.prompt })),
        }),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  if (!topic) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-muted">Không tìm thấy chủ đề.</Text>
      </View>
    );
  }

  const color = strandColors[strandOf(topicId) as StrandKey] ?? strandColors.num;
  const { position, total } = progress(state);
  const canCheck = Array.isArray(value)
    ? value.some((v) => (v ?? "").trim().length > 0)
    : value.trim().length > 0;

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-3 px-5 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm"
        >
          <Text className="text-muted">✕</Text>
        </Pressable>
        <View
          className="h-3 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: color + "22" }}
        >
          <View
            className="h-full rounded-full"
            style={{ width: `${(position / Math.max(total, 1)) * 100}%`, backgroundColor: color }}
          />
        </View>
        <Text className="font-display font-bold" style={{ color }}>
          {position}/{total}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        {q && <QuestionCard question={q} topicName={topic.name} color={color} />}

        {q && state.status === "feedback" && currentRecord(state) ? (
          <View className="mt-4">
            <Feedback
              record={currentRecord(state)!}
              question={q}
              isLast={state.index + 1 >= total}
              onNext={() => dispatch({ type: "next" })}
            />
          </View>
        ) : q ? (
          <View className="mt-4">
            <AnswerInput question={q} value={value} onChange={setValue} />
            {state.hint === "empty" && (
              <Text className="mt-2 text-sm font-semibold text-no">Em chưa nhập đáp án.</Text>
            )}
            {state.hint === "format-error" && (
              <Text className="mt-2 text-sm font-semibold text-no">
                Định dạng chưa đúng, thử lại nhé.
              </Text>
            )}
            <Pressable
              disabled={!canCheck}
              onPress={() => dispatch({ type: "answer", answer: value })}
              className={`mt-4 min-h-[52px] items-center justify-center rounded-md ${canCheck ? "bg-brand" : "bg-line"}`}
            >
              <Text className="font-display text-lg font-bold text-white">Kiểm tra</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
