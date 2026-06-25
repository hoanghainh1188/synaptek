// Bài chẩn đoán đầu vào (US1, T023). ~5–8 câu trải kỹ năng nền → khởi tạo mastery (BKT).
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { buildDiagnostic, initFromDiagnostic } from "@synaptek/learning-path";
import {
  allGrades,
  getQuestionById,
  questionsBySkill,
  skillOfQuestion,
  skillsWithQuestions,
} from "@/lib/content";
import { buildSkillNodes } from "@/lib/path";
import {
  currentQuestion,
  currentRecord,
  progress,
  sessionReducer,
  startSession,
} from "@/lib/session";
import { colors } from "@/theme/tokens";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { AnswerInput } from "@/components/practice/AnswerInput";
import { Feedback } from "@/components/practice/Feedback";
import { Mascot } from "@/components/Mascot";
import { useAuth } from "@/lib/supabase/auth";
import { useSaveAttempt } from "@/lib/supabase/attempts";
import { useUpsertMastery } from "@/lib/supabase/mastery";

export default function Diagnostic() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const saveAttempt = useSaveAttempt();
  const upsertMastery = useUpsertMastery();

  const questions = useMemo(() => {
    const nodes = buildSkillNodes(allGrades(), skillsWithQuestions());
    const ids = buildDiagnostic(nodes, questionsBySkill(), { max: 8 });
    return ids.map(getQuestionById).filter((q): q is NonNullable<typeof q> => Boolean(q));
  }, []);

  const [state, dispatch] = useReducer(sessionReducer, undefined, () =>
    startSession("diagnostic", questions),
  );
  const q = currentQuestion(state);
  const [value, setValue] = useState<string | string[]>("");
  const savedCount = useRef(0);
  const finished = useRef(false);

  useEffect(() => {
    setValue(currentQuestion(state)?.type === "fill-blank" ? [] : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  // Lưu attempt mỗi câu (nếu đăng nhập) — để mastery suy lại nhất quán từ attempts.
  useEffect(() => {
    if (state.records.length <= savedCount.current) return;
    savedCount.current = state.records.length;
    if (!user) return;
    const r = state.records[state.records.length - 1];
    saveAttempt.mutate({
      questionId: r.questionId,
      skillId: skillOfQuestion(r.questionId),
      answer: r.answer,
      isCorrect: r.isCorrect,
      score: r.score,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.records.length]);

  // Xong → khởi tạo mastery rồi về trang chủ.
  useEffect(() => {
    if (state.status !== "finished" || finished.current) return;
    finished.current = true;
    const responses = state.records
      .map((r) => ({ skillId: skillOfQuestion(r.questionId), isCorrect: r.isCorrect }))
      .filter((x): x is { skillId: string; isCorrect: boolean } => Boolean(x.skillId));
    const mastery = initFromDiagnostic(responses);
    if (user && mastery.size > 0) {
      upsertMastery.mutate(
        [...mastery].map(([skillId, m]) => ({ skillId, mastery: m, attemptsCount: 1 })),
      );
    }
    router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  if (questions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-muted">Chưa đủ nội dung để chẩn đoán.</Text>
      </View>
    );
  }

  const { position, total } = progress(state);
  const canCheck = Array.isArray(value)
    ? value.some((v) => (v ?? "").trim().length > 0)
    : value.trim().length > 0;

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + 8,
        maxWidth: 640,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <View className="flex-row items-center gap-3 px-5 pb-2">
        <Pressable
          onPress={() => router.replace("/")}
          accessibilityLabel="Đóng"
          className="h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm"
        >
          <Text className="text-muted">✕</Text>
        </Pressable>
        <View
          className="h-3 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: colors.brand + "22" }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${(position / Math.max(total, 1)) * 100}%`,
              backgroundColor: colors.brand,
            }}
          />
        </View>
        <Text className="font-display font-bold" style={{ color: colors.brand }}>
          {position}/{total}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <View className="mb-4 flex-row items-center gap-3 rounded-lg bg-brand px-4 py-3">
          <Mascot size={32} color="#ffffff" />
          <Text className="flex-1 font-bold text-white">
            Vài câu để mình hiểu em đang ở đâu nhé — sai cũng không sao!
          </Text>
        </View>

        {q && <QuestionCard question={q} topicName="Chẩn đoán" color={colors.brand} />}

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
