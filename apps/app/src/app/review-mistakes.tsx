// Ôn lại câu sai — tập câu = các câu trả lời SAI gần nhất; chạy qua SessionRunner (làm đúng → tự loại lần sau).
import { useMemo } from "react";
import type { Question } from "@synaptek/curriculum";
import { getQuestionById } from "@/lib/content";
import { wrongQuestionIds } from "@/lib/mistakes";
import { useAttempts } from "@/lib/supabase/attempts";
import { SessionRunner } from "@/components/practice/SessionRunner";

export default function ReviewMistakes() {
  const attemptsQ = useAttempts();
  const questions = useMemo(
    () =>
      wrongQuestionIds(attemptsQ.data ?? [])
        .map((id) => getQuestionById(id))
        .filter(Boolean) as Question[],
    [attemptsQ.data],
  );

  return (
    <SessionRunner
      sessionId="review-mistakes"
      label="Ôn lại câu sai"
      title="Ôn lại câu sai"
      questions={questions}
      ready={Boolean(attemptsQ.data)}
      emptyText="Không còn câu nào cần ôn — em đang làm rất tốt!"
      loginText="Đăng nhập để ôn lại câu đã sai nhé!"
    />
  );
}
