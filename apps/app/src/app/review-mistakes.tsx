// "Ôn lại câu sai" — HS làm lại câu mà lần gần nhất còn sai (đóng vòng "khắc phục điểm yếu").
// Tái dùng session reducer + QuestionCard/AnswerInput/Feedback + lưu attempt (làm đúng → tự loại khỏi danh sách).
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { Question } from "@synaptek/curriculum";
import { getQuestionById } from "@/lib/content";
import { wrongQuestionIds } from "@/lib/mistakes";
import {
  currentQuestion,
  currentRecord,
  progress,
  sessionReducer,
  sessionResult,
  startSession,
  type SessionState,
} from "@/lib/session";
import { QuestionCard } from "@/components/practice/QuestionCard";
import { AnswerInput } from "@/components/practice/AnswerInput";
import { Feedback } from "@/components/practice/Feedback";
import { useAuth } from "@/lib/supabase/auth";
import { useAttempts, useSaveAttempt } from "@/lib/supabase/attempts";
import { Mascot } from "@/components/Mascot";

export default function ReviewMistakes() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const attemptsQ = useAttempts();
  const save = useSaveAttempt();

  const [session, setSession] = useState<SessionState | null>(null);
  const [value, setValue] = useState<string | string[]>("");
  const startedRef = useRef(false);
  const savedRef = useRef(0);

  // Khởi tạo phiên MỘT LẦN khi attempts tải xong (đóng băng danh sách để không co lại giữa chừng).
  useEffect(() => {
    if (startedRef.current || !attemptsQ.data) return;
    const qs = wrongQuestionIds(attemptsQ.data)
      .map((id) => getQuestionById(id))
      .filter(Boolean) as Question[];
    startedRef.current = true;
    setSession(startSession("review-mistakes", qs));
  }, [attemptsQ.data]);

  // Lưu attempt cho mỗi record mới (làm đúng → latest đúng → tự loại khỏi danh sách lần sau).
  useEffect(() => {
    if (!session) return;
    for (let i = savedRef.current; i < session.records.length; i++) {
      const rec = session.records[i];
      const q = session.questions.find((x) => x.id === rec.questionId);
      save.mutate({
        questionId: rec.questionId,
        skillId: q?.skillId,
        answer: rec.answer,
        isCorrect: rec.isCorrect,
        score: rec.score,
      });
    }
    savedRef.current = session.records.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.records.length]);

  const dispatch = (action: Parameters<typeof sessionReducer>[1]) =>
    setSession((s) => (s ? sessionReducer(s, action) : s));

  const q = session ? currentQuestion(session) : undefined;
  const { position, total } = session ? progress(session) : { position: 0, total: 0 };
  const canCheck = Array.isArray(value) ? value.some(Boolean) : String(value).trim().length > 0;

  // reset ô nhập khi sang câu mới
  useEffect(() => {
    setValue("");
  }, [session?.index]);

  const wrap = (c: React.ReactNode) => (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 48,
        paddingHorizontal: 20,
        maxWidth: 640,
        width: "100%",
        alignSelf: "center",
      }}
    >
      {c}
    </ScrollView>
  );

  if (!user)
    return wrap(
      <Pressable
        onPress={() => router.push("/login")}
        accessibilityLabel="Đăng nhập"
        className="mt-4 flex-row items-center gap-3 rounded-lg bg-brand px-4 py-4"
      >
        <Mascot size={36} color="#ffffff" />
        <Text className="flex-1 font-bold text-white">Đăng nhập để ôn lại câu đã sai nhé!</Text>
      </Pressable>,
    );

  // Chưa có phiên (đang tải) hoặc không còn câu sai.
  if (!session || total === 0)
    return wrap(
      <View>
        <Text className="font-display text-2xl font-extrabold text-ink">Ôn lại câu sai</Text>
        <View className="mt-6 items-center rounded-lg border-2 border-dashed border-line p-8">
          <Text className="text-4xl">🎉</Text>
          <Text className="mt-2 text-center font-semibold text-ink">
            Không còn câu nào cần ôn — em đang làm rất tốt!
          </Text>
        </View>
        <Pressable
          onPress={() => router.replace("/")}
          className="mt-5 min-h-[48px] items-center justify-center rounded-md bg-brand"
        >
          <Text className="font-display font-bold text-white">Về trang chủ</Text>
        </Pressable>
      </View>,
    );

  if (session.status === "finished") {
    const r = sessionResult(session);
    return wrap(
      <View>
        <Text className="font-display text-2xl font-extrabold text-ink">Xong rồi! 🎯</Text>
        <Text className="mt-2 text-ink">
          Em làm đúng <Text className="font-bold text-ok">{r.correct}</Text>/{r.total} câu ôn tập.
        </Text>
        {r.wrong.length > 0 && (
          <Text className="mt-1 text-sm text-muted">
            Còn {r.wrong.length} câu chưa đúng — sẽ giữ lại để ôn tiếp lần sau.
          </Text>
        )}
        <Pressable
          onPress={() => router.replace("/")}
          className="mt-5 min-h-[48px] items-center justify-center rounded-md bg-brand"
        >
          <Text className="font-display font-bold text-white">Về trang chủ</Text>
        </Pressable>
      </View>,
    );
  }

  const record = currentRecord(session);
  return (
    <View style={{ flex: 1, paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center gap-3 px-5">
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Quay lại"
          className="h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm"
        >
          <Text className="text-lg text-muted">←</Text>
        </Pressable>
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <View
            className="h-full rounded-full bg-brand"
            style={{ width: `${(position / Math.max(total, 1)) * 100}%` }}
          />
        </View>
        <Text className="font-display font-bold text-brand">
          {position}/{total}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Text className="mb-2 text-sm font-bold text-muted">Ôn lại câu sai</Text>
        {q && <QuestionCard question={q} topicName="" />}

        {q && session.status === "feedback" && record ? (
          <View className="mt-4">
            <Feedback
              record={record}
              question={q}
              isLast={session.index + 1 >= total}
              onNext={() => dispatch({ type: "next" })}
            />
          </View>
        ) : q ? (
          <View className="mt-4">
            <AnswerInput question={q} value={value} onChange={setValue} />
            {session.hint === "empty" && (
              <Text className="mt-2 text-sm font-semibold text-no">Em chưa nhập đáp án.</Text>
            )}
            {session.hint === "format-error" && (
              <Text className="mt-2 text-sm font-semibold text-no">
                Định dạng chưa đúng, thử lại nhé.
              </Text>
            )}
            <Pressable
              accessibilityLabel="Kiểm tra"
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
