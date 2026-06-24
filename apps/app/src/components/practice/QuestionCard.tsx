// Thẻ đề bài: nhãn chủ đề + prompt (render Toán).
import { Text, View } from "react-native";
import type { Question } from "@synaptek/curriculum";
import { MathText } from "@/components/math/MathText";

interface QuestionCardProps {
  question: Question;
  topicName: string;
  color?: string;
}

export function QuestionCard({ question, topicName, color = "#2563eb" }: QuestionCardProps) {
  return (
    <View className="rounded-lg bg-surface p-5 shadow-sm">
      <Text className="text-xs font-extrabold uppercase tracking-wide" style={{ color }}>
        {topicName}
      </Text>
      <View className="mt-3">
        <MathText value={question.prompt} size={24} weight="600" />
      </View>
    </View>
  );
}
