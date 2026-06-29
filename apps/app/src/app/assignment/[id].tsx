// Route HS — làm + nộp bài tập (M3 US2 + giới hạn D25). Chấm CHÍNH THỨC server (ẩn đáp án — D4).
// Giới hạn (hạn nộp/số lần/thời gian) enforce ở server; client khoá nút + đồng hồ đếm ngược + auto-nộp.
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { checkSubmitAllowed, type SubmitBlock } from "@synaptek/classroom";
import { getQuestionById } from "@/lib/content";
import { useStudentCustomQuestions } from "@/lib/supabase/custom-questions";
import { useAssignment } from "@/lib/supabase/assignments";
import {
  useMySubmission,
  useStartAttempt,
  useSubmitAssignment,
  type GradeResponse,
} from "@/lib/supabase/submissions";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { AnswerInput } from "@/components/practice/AnswerInput";

const BLOCK_MSG: Record<SubmitBlock, string> = {
  past_due: "Đã quá hạn nộp.",
  no_attempts_left: "Em đã hết lượt nộp.",
  time_expired: "Đã hết thời gian làm bài.",
};

export default function DoAssignment() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const assignmentId = String(id);
  const assignment = useAssignment(assignmentId);
  const submit = useSubmitAssignment();
  const startAttempt = useStartAttempt();
  const prior = useMySubmission(assignmentId);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const startedRef = useRef(false);
  const autoSubmitRef = useRef(false);

  const a = assignment.data;
  // Câu tự soạn (D28): id không có trong bank content/ → lấy từ DB (prompt+choices, ẩn đáp án).
  const customIds = useMemo(
    () => (a?.questionIds ?? []).filter((qid) => !getQuestionById(qid)),
    [a],
  );
  const customQs = useStudentCustomQuestions(customIds);
  const questions = useMemo(() => {
    const customMap = new Map((customQs.data ?? []).map((q) => [q.id, q]));
    return (a?.questionIds ?? [])
      .map((qid) => getQuestionById(qid) ?? customMap.get(qid))
      .filter(Boolean);
  }, [a, customQs.data]);

  // Bắt đầu làm (đặt mốc cho đồng hồ) khi bài có giới hạn thời gian và chưa bắt đầu.
  useEffect(() => {
    if (!a || startedRef.current) return;
    const existing = prior.data?.startedAt ? Date.parse(prior.data.startedAt) : null;
    if (existing) {
      setStartedAt(existing);
      startedRef.current = true;
    } else if (a.timeLimitMinutes) {
      startedRef.current = true;
      startAttempt.mutate(assignmentId, {
        onSuccess: (iso) => setStartedAt(iso ? Date.parse(iso) : Date.now()),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, prior.data?.startedAt]);

  // Đồng hồ đếm ngược (1s) khi có giới hạn thời gian.
  useEffect(() => {
    if (!a?.timeLimitMinutes || !startedAt) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [a?.timeLimitMinutes, startedAt]);

  const deadline =
    a?.timeLimitMinutes && startedAt ? startedAt + a.timeLimitMinutes * 60_000 : null;
  const remainingMs = deadline ? Math.max(0, deadline - nowTick) : null;

  const decision = a
    ? checkSubmitAllowed(
        {
          dueAt: a.dueAt ? Date.parse(a.dueAt) : null,
          allowLate: a.allowLate,
          maxAttempts: a.maxAttempts,
          timeLimitMinutes: a.timeLimitMinutes,
        },
        { attemptCount: prior.data?.attemptCount ?? 0, startedAt },
        nowTick,
      )
    : { allowed: true as const };

  const doSubmit = () =>
    submit.mutate({ assignmentId, answers }, { onSuccess: (r) => setResult(r) });

  // Tự nộp khi hết giờ (một lần).
  useEffect(() => {
    if (
      remainingMs === 0 &&
      !autoSubmitRef.current &&
      !result &&
      (prior.data?.attemptCount ?? 0) === 0
    ) {
      autoSubmitRef.current = true;
      doSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs]);

  const mmss = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };
  const submitted = result ?? (prior.data ? "prior" : null);
  const attemptsLeft =
    a?.maxAttempts != null ? Math.max(0, a.maxAttempts - (prior.data?.attemptCount ?? 0)) : null;

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
      <Text className="font-display text-2xl font-extrabold text-ink">{a?.title ?? "Bài tập"}</Text>

      {/* Thông tin giới hạn */}
      <View className="mt-2 flex-row flex-wrap gap-2">
        {remainingMs !== null && (
          <View
            className={`rounded-full px-3 py-1 ${remainingMs === 0 ? "bg-no/10" : "bg-brand/10"}`}
          >
            <Text className={`text-xs font-bold ${remainingMs === 0 ? "text-no" : "text-brand"}`}>
              ⏱ {mmss(remainingMs)}
            </Text>
          </View>
        )}
        {attemptsLeft !== null && (
          <View className="rounded-full bg-surface px-3 py-1 shadow-sm">
            <Text className="text-xs font-bold text-muted">Còn {attemptsLeft} lượt nộp</Text>
          </View>
        )}
      </View>

      {/* Điểm (đã nộp trước / vừa nộp) */}
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

      {/* Đề bài — KHÔNG có đáp án */}
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
          disabled={submit.isPending || questions.length === 0 || !decision.allowed}
          onPress={doSubmit}
          className={`min-h-[52px] items-center justify-center rounded-md ${submit.isPending || !decision.allowed ? "bg-line" : "bg-brand"}`}
        >
          {submit.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-display text-lg font-bold text-white">
              {!decision.allowed
                ? (decision.reason && BLOCK_MSG[decision.reason]) || "Không thể nộp"
                : result
                  ? "Nộp lại"
                  : "Nộp bài"}
            </Text>
          )}
        </Pressable>
        {submit.isError && (
          <Text className="mt-2 text-center text-sm font-semibold text-no">
            Chưa nộp được (có thể đã quá hạn/hết lượt/hết giờ).
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
