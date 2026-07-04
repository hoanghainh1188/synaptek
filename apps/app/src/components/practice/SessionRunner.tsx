// Khung chạy một PHIÊN luyện từ tập câu cho trước — tái dùng cho "Ôn lại câu sai" + "Luyện nhanh".
// Quản lý: session reducer + lưu attempt + tiến độ + feedback + kết quả + cổng đăng nhập. (DRY)
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { Question } from "@synaptek/curriculum";
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
import { SessionResult } from "@/components/practice/SessionResult";
import { useAuth } from "@/lib/supabase/auth";
import { useSaveAttempt } from "@/lib/supabase/attempts";
import { Mascot } from "@/components/Mascot";

interface SessionRunnerProps {
  sessionId: string; // nhãn phiên (cho reducer)
  label: string; // nhãn nhỏ trên đầu màn làm bài
  title: string; // tiêu đề ở trạng thái rỗng/kết thúc
  questions: Question[]; // tập câu (đóng băng khi ready=true)
  ready: boolean; // dữ liệu đã tải xong → khởi tạo phiên
  emptyText: string; // khi không có câu nào
  loginText: string; // lời mời khi chưa đăng nhập
}

export function SessionRunner({
  sessionId,
  label,
  title,
  questions,
  ready,
  emptyText,
  loginText,
}: SessionRunnerProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const save = useSaveAttempt();

  const [session, setSession] = useState<SessionState | null>(null);
  const [value, setValue] = useState<string | string[]>("");
  const startedRef = useRef(false);
  const savedRef = useRef(0);

  // Khởi tạo phiên MỘT LẦN khi dữ liệu sẵn sàng (đóng băng danh sách).
  useEffect(() => {
    if (startedRef.current || !ready) return;
    startedRef.current = true;
    setSession(startSession(sessionId, questions));
  }, [ready, questions, sessionId]);

  // Lưu attempt cho mỗi record mới.
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
  const canCheck = useMemo(
    () => (Array.isArray(value) ? value.some(Boolean) : String(value).trim().length > 0),
    [value],
  );

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
        <Text className="flex-1 font-bold text-white">{loginText}</Text>
      </Pressable>,
    );

  if (!session || total === 0)
    return wrap(
      <View>
        <Text className="font-display text-2xl font-extrabold text-ink">{title}</Text>
        <View className="mt-6 items-center rounded-lg border-2 border-dashed border-line p-8">
          <Text className="text-4xl">🎉</Text>
          <Text className="mt-2 text-center font-semibold text-ink">{emptyText}</Text>
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
    const retry = () => {
      savedRef.current = 0;
      setValue("");
      setSession(startSession(sessionId, questions));
    };
    return wrap(
      <SessionResult
        total={r.total}
        correct={r.correct}
        partial={r.partial}
        score={r.score}
        wrong={r.wrong.map((q) => ({ id: q.id, prompt: q.prompt }))}
        topicName={label}
        onRetry={retry}
        onHome={() => router.replace("/")}
      />,
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
        <Text className="mb-2 text-sm font-bold text-muted">{label}</Text>
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
