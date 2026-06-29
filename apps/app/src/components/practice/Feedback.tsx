// Phản hồi đúng/sai + giải thích (không phán xét). Hiện sau khi nộp.
import { Pressable, Text, View } from "react-native";
import type { Question } from "@synaptek/curriculum";
import type { AnswerRecord } from "@/lib/session";
import { MathText } from "@/components/math/MathText";
import { Mascot } from "@/components/Mascot";

interface FeedbackProps {
  record: AnswerRecord;
  question: Question;
  onNext: () => void;
  isLast: boolean;
}

// Gợi ý theo chẩn đoán lỗi (engine) — giúp HS hiểu *vì sao* sai, không phán xét.
const DIAGNOSIS_HINT: Record<NonNullable<AnswerRecord["diagnosis"]>, string> = {
  sign: "Hình như em nhầm dấu (âm/dương) — kiểm tra lại nhé!",
  magnitude10: "Suýt đúng! Chú ý vị trí dấu phẩy (nhân/chia nhầm 10).",
  reciprocal: "Có thể em đảo tử số và mẫu số rồi đó.",
  rounding: "Gần lắm rồi — chú ý làm tròn nhé.",
};

export function Feedback({ record, question, onNext, isLast }: FeedbackProps) {
  const ok = record.isCorrect;
  const correctText = Array.isArray(question.correct)
    ? question.correct.join(" ; ")
    : question.correct;
  return (
    <View
      className={`rounded-lg bg-surface p-5 ${ok ? "border-2 border-ok/40" : "border-2 border-no/30"}`}
    >
      <View className="flex-row items-center gap-3">
        <View
          className={`h-14 w-14 items-center justify-center rounded-full ${ok ? "bg-ok/10" : "bg-no/10"}`}
        >
          {ok ? <Mascot size={40} color="#16a34a" /> : <Text className="text-2xl text-no">↺</Text>}
        </View>
        <View className="flex-1">
          <Text className={`font-display text-2xl font-bold ${ok ? "text-ok" : "text-no"}`}>
            {ok ? "Tuyệt vời! 🎉" : "Gần đúng rồi!"}
          </Text>
          {ok ? (
            <View className="flex-row items-center">
              <Text className="text-sm font-semibold text-muted">Đáp án: </Text>
              <MathText value={correctText} size={15} weight="700" color="#18181b" />
            </View>
          ) : (
            <Text className="text-sm font-semibold text-muted">
              {record.diagnosis
                ? DIAGNOSIS_HINT[record.diagnosis]
                : "Thử lại nhé — em làm được mà."}
            </Text>
          )}
        </View>
      </View>

      <View className="mt-4 rounded-md bg-paper p-3">
        <Text className="text-[13px] font-extrabold uppercase tracking-wide text-muted">
          Vì sao
        </Text>
        <View className="mt-1">
          <MathText value={question.explanation} size={16} weight="600" />
        </View>
      </View>

      <Pressable
        onPress={onNext}
        className="mt-4 min-h-[52px] items-center justify-center rounded-md bg-brand"
      >
        <Text className="font-display text-lg font-bold text-white">
          {isLast ? "Xem kết quả →" : "Tiếp tục →"}
        </Text>
      </Pressable>
    </View>
  );
}
