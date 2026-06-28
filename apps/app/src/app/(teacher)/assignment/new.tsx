// Route GV — soạn/sửa bài tập: chọn câu từ content/ + hạn nộp + giới hạn → tạo (hoặc cập nhật).
// Tham số: classId (tạo mới) HOẶC editId (sửa bài đã có — prefill từ assignment).
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { GRADE_FILTERS, getQuestions, listTopics } from "@/lib/content";
import {
  useAssignment,
  useCreateAssignment,
  useUpdateAssignment,
} from "@/lib/supabase/assignments";
import { MathText } from "@/components/math/MathText";

export default function NewAssignment() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ classId?: string; editId?: string }>();
  const editId = params.editId ? String(params.editId) : null;
  const create = useCreateAssignment();
  const update = useUpdateAssignment();
  const existing = useAssignment(editId ?? "");

  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState(4);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allowLate, setAllowLate] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(""); // "" = không giới hạn
  const [timeLimit, setTimeLimit] = useState(""); // phút; "" = không có đồng hồ
  const [prefilled, setPrefilled] = useState(false);

  // Prefill khi sửa (một lần, sau khi tải xong bài).
  useEffect(() => {
    if (editId && existing.data && !prefilled) {
      const a = existing.data;
      setTitle(a.title);
      setSelected(new Set(a.questionIds));
      setMaxAttempts(a.maxAttempts != null ? String(a.maxAttempts) : "");
      setTimeLimit(a.timeLimitMinutes != null ? String(a.timeLimitMinutes) : "");
      setAllowLate(a.allowLate);
      setPrefilled(true);
    }
  }, [editId, existing.data, prefilled]);

  const classId = editId
    ? existing.data?.classId
    : params.classId
      ? String(params.classId)
      : undefined;
  const topics = listTopics(grade).filter((t) => getQuestions(t.id).length > 0);
  const questions = useMemo(() => (topicId ? getQuestions(topicId) : []), [topicId]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const busy = create.isPending || update.isPending;
  const canCreate = title.trim().length > 0 && selected.size > 0 && !busy && Boolean(classId);

  const submit = () => {
    const toNum = (s: string) => {
      const n = parseInt(s, 10);
      return Number.isFinite(n) && n >= 1 ? n : null;
    };
    const payload = {
      classId: String(classId),
      title: title.trim(),
      questionIds: [...selected],
      allowLate,
      maxAttempts: toNum(maxAttempts),
      timeLimitMinutes: toNum(timeLimit),
    };
    if (editId) update.mutate({ ...payload, id: editId }, { onSuccess: () => router.back() });
    else create.mutate(payload, { onSuccess: () => router.back() });
  };

  // Chế độ sửa: chờ prefill xong mới hiện form (tránh ghi đè dữ liệu nhập khi data tải chậm).
  const loadingEdit = Boolean(editId) && !prefilled;

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
      <Text className="font-display text-2xl font-extrabold text-ink">
        {editId ? "Sửa bài tập" : "Soạn bài tập"}
      </Text>

      {loadingEdit && <Text className="mt-4 text-muted">Đang tải bài tập…</Text>}
      {!loadingEdit && (
        <>
          <Text className="mt-4 mb-1 text-sm font-bold text-muted">Tên bài</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="VD: Ôn tập Phân số"
            placeholderTextColor="#a1a1aa"
            className="min-h-[48px] rounded-md border-2 border-line bg-surface px-3 text-base text-ink"
          />

          {/* Giới hạn nộp (D25) */}
          <View className="mt-5 rounded-lg bg-surface p-4 shadow-sm">
            <Text className="font-display text-base font-bold text-ink">Giới hạn nộp</Text>
            <Pressable
              accessibilityLabel="Cho phép nộp trễ"
              onPress={() => setAllowLate((v) => !v)}
              className="mt-3 flex-row items-center justify-between"
            >
              <Text className="flex-1 text-sm font-semibold text-ink">
                Cho phép nộp sau hạn (đánh dấu trễ)
              </Text>
              <View
                className={`h-7 w-12 justify-center rounded-full px-0.5 ${allowLate ? "bg-brand" : "bg-line"}`}
              >
                <View
                  className={`h-6 w-6 rounded-full bg-white ${allowLate ? "self-end" : "self-start"}`}
                />
              </View>
            </Pressable>
            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-1 text-xs font-bold text-muted">Số lần nộp tối đa</Text>
                <TextInput
                  value={maxAttempts}
                  onChangeText={setMaxAttempts}
                  keyboardType="number-pad"
                  placeholder="∞"
                  placeholderTextColor="#a1a1aa"
                  accessibilityLabel="Số lần nộp tối đa"
                  className="min-h-[44px] rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-xs font-bold text-muted">Thời gian làm (phút)</Text>
                <TextInput
                  value={timeLimit}
                  onChangeText={setTimeLimit}
                  keyboardType="number-pad"
                  placeholder="∞"
                  placeholderTextColor="#a1a1aa"
                  accessibilityLabel="Thời gian làm bài"
                  className="min-h-[44px] rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
                />
              </View>
            </View>
            <Text className="mt-2 text-[11px] text-muted">Để trống = không giới hạn.</Text>
          </View>

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
                  <Text className={`font-bold ${active ? "text-white" : "text-ink"}`}>
                    {t.name}
                  </Text>
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
              accessibilityLabel={editId ? "Lưu thay đổi" : "Giao bài"}
              disabled={!canCreate}
              onPress={submit}
              className={`min-h-[52px] items-center justify-center rounded-md ${canCreate ? "bg-brand" : "bg-line"}`}
            >
              <Text className="font-display text-lg font-bold text-white">
                {editId ? "Lưu thay đổi" : "Giao bài"} ({selected.size} câu)
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}
