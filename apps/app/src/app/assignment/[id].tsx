// Route HS — làm + nộp bài tập (M3 US2, T024). Chấm CHÍNH THỨC ở server (đáp án ẩn — D4).
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { getQuestionById } from "@/lib/content";
import { useAssignment } from "@/lib/supabase/assignments";
import {
  useMySubmission,
  useSubmitAssignment,
  type GradeResponse,
} from "@/lib/supabase/submissions";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { AnswerInput } from "@/components/practice/AnswerInput";

export default function DoAssignment() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const assignmentId = String(id);
  const assignment = useAssignment(assignmentId);
  const submit = useSubmitAssignment();
  const prior = useMySubmission(assignmentId);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState<GradeResponse | null>(null);

  const questions = useMemo(
    () => (assignment.data?.questionIds ?? []).map((qid) => getQuestionById(qid)).filter(Boolean),
    [assignment.data],
  );

  const doSubmit = () =>
    submit.mutate({ assignmentId, answers }, { onSuccess: (r) => setResult(r) });

  const submitted = result ?? (prior.data ? "prior" : null);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 96,
        paddingHorizontal: 20,
        maxWidth: 640,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Quay lại"
        className="mb-3 h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm"
      >
        <Text className="text-lg text-muted">←</Text>
      </Pressable>
      <Text className="font-display text-2xl font-extrabold text-ink">
        {assignment.data?.title ?? "Bài tập"}
      </Text>

      {/* Đã có điểm (đã nộp trước đó hoặc vừa nộp) */}
      {submitted && (
        <View className="mt-4 rounded-lg bg-ok/10 p-4">
          <Text className="font-display text-lg font-extrabold text-ink">
            {result
              ? `Điểm: ${Math.round(result.autoScore * 100)}%`
              : `Điểm: ${Math.round((prior.data!.displayScore ?? 0) * 100)}%`}
          </Text>
          {!result && prior.data?.feedback && (
            <Text className="mt-1 text-sm text-ink">
              Nhận xét của cô/thầy: {prior.data.feedback}
            </Text>
          )}
          {!result && prior.data?.isOverride && (
            <Text className="mt-1 text-xs font-semibold text-brand">
              (điểm đã được cô/thầy chấm)
            </Text>
          )}
        </View>
      )}

      {/* Đề bài — KHÔNG có đáp án (ẩn ở server) */}
      <View className="mt-4 gap-4">
        {questions.map((q) =>
          q ? (
            <View key={q.id} className="rounded-lg bg-surface p-4 shadow-sm">
              <QuestionCard question={q} topicName="" />
              <View className="mt-3">
                <AnswerInput
                  question={q}
                  value={answers[q.id] ?? (q.type === "fill-blank" ? [] : "")}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                />
              </View>
              {result?.perQuestion[q.id] && (
                <Text
                  className={`mt-2 text-sm font-bold ${result.perQuestion[q.id].isCorrect ? "text-ok" : "text-no"}`}
                >
                  {result.perQuestion[q.id].isCorrect ? "✓ Đúng" : "✗ Chưa đúng"}
                </Text>
              )}
            </View>
          ) : null,
        )}
      </View>

      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute inset-x-0 bottom-0 bg-bg px-5 pt-3"
      >
        <Pressable
          accessibilityLabel="Nộp bài"
          disabled={submit.isPending || questions.length === 0}
          onPress={doSubmit}
          className={`min-h-[52px] items-center justify-center rounded-md ${submit.isPending ? "bg-line" : "bg-brand"}`}
        >
          {submit.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-display text-lg font-bold text-white">
              {result ? "Nộp lại" : "Nộp bài"}
            </Text>
          )}
        </Pressable>
        {submit.isError && (
          <Text className="mt-2 text-center text-sm font-semibold text-no">
            Chưa nộp được. Em đã ở trong lớp của bài này chưa?
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
