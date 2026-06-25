// Thẻ đề bài: nhãn chủ đề + ảnh minh họa (nếu có) + prompt (render Toán).
import { Text, View } from "react-native";
import { Image } from "expo-image";
import type { Question } from "@synaptek/curriculum";
import { MathText } from "@/components/math/MathText";
import { imageSource } from "@/lib/content";

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

      {question.image && (
        <Image
          source={imageSource(question.image) as never}
          accessibilityLabel={question.image.alt}
          contentFit="contain"
          style={{
            width: "100%",
            aspectRatio: question.image.aspectRatio ?? 1.6,
            marginTop: 12,
            borderRadius: 12,
            backgroundColor: "#fbfbfd",
          }}
        />
      )}

      <View className="mt-3">
        <MathText value={question.prompt} size={24} weight="600" />
      </View>
    </View>
  );
}
