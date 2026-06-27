// Route GV — soạn bài tập (M3 US2, T023): chọn câu từ content/ theo chủ đề + hạn nộp → tạo assignment.
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { GRADE_FILTERS, getQuestions, listTopics } from "@/lib/content";
import { useCreateAssignment } from "@/lib/supabase/assignments";
import { MathText } from "@/components/math/MathText";

export default function NewAssignment() {
  const insets = useSafeAreaInsets();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const create = useCreateAssignment();

  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState(4);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const topics = listTopics(grade).filter((t) => getQuestions(t.id).length > 0);
  const questions = useMemo(() => (topicId ? getQuestions(topicId) : []), [topicId]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const canCreate = title.trim().length > 0 && selected.size > 0 && !create.isPending;

  const submit = () => {
    create.mutate(
      { classId: String(classId), title: title.trim(), questionIds: [...selected] },
      { onSuccess: () => router.back() },
    );
  };

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
      <Text className="font-display text-2xl font-extrabold text-ink">Soạn bài tập</Text>

      <Text className="mt-4 mb-1 text-sm font-bold text-muted">Tên bài</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="VD: Ôn tập Phân số"
        placeholderTextColor="#a1a1aa"
        className="min-h-[48px] rounded-md border-2 border-line bg-surface px-3 text-base text-ink"
      />

      {/* Lớp nội dung */}
      <View className="mt-5 flex-row items-center gap-2">
        <Text className="mr-1 text-sm font-bold text-muted">Lớp</Text>
        {GRADE_FILTERS.map((g) => {
          const active = g === grade;
          return (
            <Pressable
              key={g}
              accessibilityLabel={`Lớp ${g}`}
              onPress={() => {
                setGrade(g);
                setTopicId(null);
              }}
              className={`h-10 w-10 items-center justify-center rounded-full ${active ? "bg-ink" : "bg-surface"}`}
            >
              <Text className={`font-bold ${active ? "text-white" : "text-muted"}`}>{g}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Chủ đề */}
      <View className="mt-4 flex-row flex-wrap gap-2">
        {topics.map((t) => {
          const active = t.id === topicId;
          return (
            <Pressable
              key={t.id}
              accessibilityLabel={t.name}
              onPress={() => setTopicId(t.id)}
              className={`min-h-[40px] items-center justify-center rounded-full px-3 ${active ? "bg-brand" : "bg-surface shadow-sm"}`}
            >
              <Text className={`font-bold ${active ? "text-white" : "text-ink"}`}>{t.name}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Câu hỏi của chủ đề — chọn */}
      <View className="mt-4 gap-2">
        {questions.map((q) => {
          const on = selected.has(q.id);
          return (
            <Pressable
              key={q.id}
              accessibilityLabel={q.id}
              onPress={() => toggle(q.id)}
              className={`flex-row items-center gap-3 rounded-lg p-3 ${on ? "bg-brand/10" : "bg-surface shadow-sm"}`}
            >
              <View
                className={`h-6 w-6 items-center justify-center rounded-md border-2 ${on ? "border-brand bg-brand" : "border-line"}`}
              >
                {on && <Text className="text-xs font-extrabold text-white">✓</Text>}
              </View>
              <View className="flex-1">
                <MathText value={q.prompt} size={15} weight="600" />
              </View>
            </Pressable>
          );
        })}
        {topicId && questions.length === 0 && (
          <Text className="text-muted">Chủ đề này chưa có câu hỏi.</Text>
        )}
      </View>

      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute inset-x-0 bottom-0 bg-bg px-5 pt-3"
      >
        <Pressable
          accessibilityLabel="Giao bài"
          disabled={!canCreate}
          onPress={submit}
          className={`min-h-[52px] items-center justify-center rounded-md ${canCreate ? "bg-brand" : "bg-line"}`}
        >
          <Text className="font-display text-lg font-bold text-white">
            Giao bài ({selected.size} câu)
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
