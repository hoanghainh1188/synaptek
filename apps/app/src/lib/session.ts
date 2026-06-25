// Reducer phiên luyện tập — THUẦN (không React/DOM), test bằng node strip-types.
// Dùng lại grade() của @synaptek/grading-engine (chấm client, low-stakes — D4).
import { grade, type FeedbackCode } from "@synaptek/grading-engine";
import type { Question } from "@synaptek/curriculum";

export type SessionStatus = "answering" | "feedback" | "finished";

export interface AnswerRecord {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  score: number;
  feedbackCode: FeedbackCode;
}

export interface SessionState {
  topicId: string;
  questions: Question[];
  index: number;
  records: AnswerRecord[];
  status: SessionStatus;
  /** Nhắc tạm khi bỏ trống / sai định dạng — KHÔNG tính là một lần trả lời. */
  hint?: "empty" | "format-error";
}

export interface SessionResult {
  total: number;
  correct: number;
  /** Điểm trung bình 0..1. */
  score: number;
  wrong: Question[];
}

export type SessionAction = { type: "answer"; answer: string | string[] } | { type: "next" };

export function startSession(topicId: string, questions: Question[]): SessionState {
  return {
    topicId,
    questions,
    index: 0,
    records: [],
    status: questions.length === 0 ? "finished" : "answering",
  };
}

export function currentQuestion(state: SessionState): Question | undefined {
  return state.questions[state.index];
}

/** Bản ghi của câu hiện tại (để hiển thị Feedback). */
export function currentRecord(state: SessionState): AnswerRecord | undefined {
  const q = currentQuestion(state);
  return q ? state.records.find((r) => r.questionId === q.id) : undefined;
}

export function progress(state: SessionState): { position: number; total: number } {
  return {
    position: Math.min(state.index + 1, state.questions.length),
    total: state.questions.length,
  };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "answer": {
      if (state.status !== "answering") return state;
      const q = currentQuestion(state);
      if (!q) return state;
      const r = grade({
        type: q.type,
        correct: q.correct,
        answer: action.answer,
        options: q.options,
      });

      // Bỏ trống / sai định dạng → chỉ nhắc, không ghi nhận, ở lại "answering".
      if (r.feedbackCode === "empty" || r.feedbackCode === "format-error") {
        return { ...state, hint: r.feedbackCode };
      }

      const record: AnswerRecord = {
        questionId: q.id,
        answer: action.answer,
        isCorrect: r.isCorrect,
        score: r.score,
        feedbackCode: r.feedbackCode,
      };
      return { ...state, hint: undefined, records: [...state.records, record], status: "feedback" };
    }

    case "next": {
      if (state.status !== "feedback") return state;
      const nextIndex = state.index + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, status: "finished" };
      }
      return { ...state, index: nextIndex, status: "answering", hint: undefined };
    }

    default:
      return state;
  }
}

export function sessionResult(state: SessionState): SessionResult {
  const total = state.records.length;
  const correct = state.records.filter((r) => r.isCorrect).length;
  const score = total === 0 ? 0 : state.records.reduce((s, r) => s + r.score, 0) / total;
  const wrongIds = new Set(state.records.filter((r) => !r.isCorrect).map((r) => r.questionId));
  const wrong = state.questions.filter((q) => wrongIds.has(q.id));
  return { total, correct, score, wrong };
}
