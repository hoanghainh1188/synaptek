// Route — soạn/sửa bài tập: chọn câu từ content/ + hạn nộp + giới hạn → tạo (hoặc cập nhật).
// Tham số: classId (GV tạo bài lớp) · childId (PH giao bài tại nhà) · editId (sửa bài đã có — prefill).
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import type { QuestionImage } from "@synaptek/curriculum";
import {
  GRADE_FILTERS,
  getQuestionById,
  getQuestions,
  imageSource,
  listTopics,
} from "@/lib/content";
import {
  useAssignment,
  useAssignmentTargets,
  useCreateAssignment,
  useUpdateAssignment,
} from "@/lib/supabase/assignments";
import { useRoster } from "@/lib/supabase/classes";
import { useCreateHomeAssignment } from "@/lib/supabase/parent";
import { useMyCustomQuestions } from "@/lib/supabase/custom-questions";
import { MathText } from "@/components/math/MathText";

export default function NewAssignment() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ classId?: string; childId?: string; editId?: string }>();
  const editId = params.editId ? String(params.editId) : null;
  const childId = params.childId ? String(params.childId) : null; // PH giao bài tại nhà
  const create = useCreateAssignment();
  const createHome = useCreateHomeAssignment();
  const update = useUpdateAssignment();
  const existing = useAssignment(editId ?? "");
  const customQs = useMyCustomQuestions();

  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState(4);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allowLate, setAllowLate] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(""); // "" = không giới hạn
  const [timeLimit, setTimeLimit] = useState(""); // phút; "" = không có đồng hồ
  const [prefilled, setPrefilled] = useState(false);
  const [query, setQuery] = useState(""); // tìm/lọc câu theo nội dung
  const [preview, setPreview] = useState(false); // xem trước như HS
  const [targetMode, setTargetMode] = useState<"all" | "some">("all"); // giao cả lớp / một số HS
  const [targetIds, setTargetIds] = useState<Set<string>>(new Set());
  const [targetsPrefilled, setTargetsPrefilled] = useState(false);

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
  const isHome = Boolean(childId); // bài tại nhà (PH) → không có "giao cho HS cụ thể"
  const roster = useRoster(classId ?? "");
  const existingTargets = useAssignmentTargets(editId ?? "");

  // Prefill targets khi sửa: có target rows → chế độ "một số HS".
  useEffect(() => {
    if (editId && existingTargets.data && !targetsPrefilled) {
      if (existingTargets.data.length > 0) {
        setTargetMode("some");
        setTargetIds(new Set(existingTargets.data));
      }
      setTargetsPrefilled(true);
    }
  }, [editId, existingTargets.data, targetsPrefilled]);

  const topics = listTopics(grade).filter((t) => getQuestions(t.id).length > 0);
  const q = query.trim().toLowerCase();
  const questions = useMemo(() => {
    const base = topicId ? getQuestions(topicId) : [];
    return q ? base.filter((x) => x.prompt.toLowerCase().includes(q)) : base;
  }, [topicId, q]);
  const myCustom = useMemo(() => {
    const base = customQs.data ?? [];
    return q ? base.filter((x) => x.prompt.toLowerCase().includes(q)) : base;
  }, [customQs.data, q]);

  // Câu đã chọn (content + tự soạn) — cho xem trước như HS.
  const selectedQuestions = useMemo(() => {
    const out: {
      id: string;
      type: string;
      prompt: string;
      choices?: string[];
      image?: QuestionImage;
    }[] = [];
    for (const id of selected) {
      const c = getQuestionById(id);
      if (c) {
        out.push({ id: c.id, type: c.type, prompt: c.prompt, choices: c.choices, image: c.image });
        continue;
      }
      const cu = (customQs.data ?? []).find((x) => x.id === id);
      if (cu)
        out.push({
          id: cu.id,
          type: cu.type,
          prompt: cu.prompt,
          choices: cu.choices ?? undefined,
          image: cu.imageUrl ? { src: cu.imageUrl, alt: "Ảnh câu hỏi" } : undefined,
        });
    }
    return out;
  }, [selected, customQs.data]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const busy = create.isPending || createHome.isPending || update.isPending;
  const canCreate =
    title.trim().length > 0 && selected.size > 0 && !busy && Boolean(classId || childId);

  const submit = () => {
    const toNum = (s: string) => {
      const n = parseInt(s, 10);
      return Number.isFinite(n) && n >= 1 ? n : null;
    };
    const limits = {
      title: title.trim(),
      questionIds: [...selected],
      allowLate,
      maxAttempts: toNum(maxAttempts),
      timeLimitMinutes: toNum(timeLimit),
    };
    // Bài lớp: "some" → danh sách HS; "all" → [] (xoá target = cả lớp). Bài nhà: không áp dụng.
    const targetStudentIds = targetMode === "some" ? [...targetIds] : [];
    if (editId) {
      update.mutate(
        { ...limits, classId: String(classId), id: editId, targetStudentIds },
        { onSuccess: () => router.back() },
      );
    } else if (childId) {
      createHome.mutate({ ...limits, childId }, { onSuccess: () => router.back() });
    } else {
      create.mutate(
        { ...limits, classId: String(classId), targetStudentIds },
        { onSuccess: () => router.back() },
      );
    }
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
        {editId ? "Sửa bài tập" : childId ? "Giao bài cho con" : "Soạn bài tập"}
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

          {/* Giao cho — cả lớp / một số HS (chỉ bài lớp) */}
          {!isHome && (
            <View className="mt-5 rounded-lg bg-surface p-4 shadow-sm">
              <Text className="font-display text-base font-bold text-ink">Giao cho</Text>
              <View className="mt-3 flex-row gap-2">
                {(["all", "some"] as const).map((m) => (
                  <Pressable
                    key={m}
                    accessibilityLabel={m === "all" ? "Giao cả lớp" : "Giao một số HS"}
                    onPress={() => setTargetMode(m)}
                    className={`min-h-[40px] flex-1 items-center justify-center rounded-md ${targetMode === m ? "bg-brand" : "bg-paper"}`}
                  >
                    <Text className={`font-bold ${targetMode === m ? "text-white" : "text-ink"}`}>
                      {m === "all" ? "Cả lớp" : "Một số HS"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {targetMode === "some" && (
                <View className="mt-3 gap-2">
                  {(roster.data ?? []).length === 0 && (
                    <Text className="text-sm text-muted">Lớp chưa có học sinh.</Text>
                  )}
                  {(roster.data ?? []).map((r) => {
                    const on = targetIds.has(r.studentId);
                    return (
                      <Pressable
                        key={r.studentId}
                        accessibilityLabel={`Chọn ${r.fullName ?? "HS"}`}
                        onPress={() =>
                          setTargetIds((prev) => {
                            const next = new Set(prev);
                            next.has(r.studentId)
                              ? next.delete(r.studentId)
                              : next.add(r.studentId);
                            return next;
                          })
                        }
                        className={`flex-row items-center gap-3 rounded-md p-2 ${on ? "bg-brand/10" : "bg-paper"}`}
                      >
                        <View
                          className={`h-5 w-5 items-center justify-center rounded border-2 ${on ? "border-brand bg-brand" : "border-line"}`}
                        >
                          {on && <Text className="text-[10px] font-extrabold text-white">✓</Text>}
                        </View>
                        <Text className="flex-1 font-semibold text-ink">
                          {r.fullName ?? "(chưa đặt tên)"}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Text className="text-xs text-muted">Đã chọn {targetIds.size} HS</Text>
                </View>
              )}
            </View>
          )}

          {/* Tìm câu + đếm đã chọn + xem trước */}
          <View className="mt-5">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="🔍 Tìm câu theo nội dung…"
              placeholderTextColor="#a1a1aa"
              accessibilityLabel="Tìm câu hỏi"
              className="min-h-[44px] rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
            />
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm font-bold text-brand">Đã chọn {selected.size} câu</Text>
              <Pressable
                accessibilityLabel="Xem trước"
                disabled={selected.size === 0}
                onPress={() => setPreview((v) => !v)}
              >
                <Text className={`font-bold ${selected.size > 0 ? "text-brand" : "text-muted"}`}>
                  {preview ? "Đóng xem trước" : "Xem trước như HS"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Xem trước như HS (read-only) */}
          {preview && (
            <View className="mt-3 gap-3 rounded-lg bg-paper p-3">
              <Text className="text-xs font-extrabold uppercase tracking-wide text-muted">
                Xem trước ({selectedQuestions.length} câu)
              </Text>
              {selectedQuestions.map((sq, i) => (
                <View key={sq.id} className="rounded-lg bg-surface p-3 shadow-sm">
                  <Text className="mb-1 text-xs font-bold text-muted">Câu {i + 1}</Text>
                  {sq.image && (
                    <Image
                      source={imageSource(sq.image) as never}
                      accessibilityLabel={sq.image.alt}
                      contentFit="contain"
                      style={{
                        width: "100%",
                        aspectRatio: sq.image.aspectRatio ?? 1.6,
                        marginBottom: 8,
                        borderRadius: 8,
                      }}
                    />
                  )}
                  <MathText value={sq.prompt} size={15} weight="600" />
                  {sq.choices && sq.choices.length > 0 && (
                    <View className="mt-2 gap-1">
                      {sq.choices.map((c) => (
                        <Text key={c} className="text-sm text-ink">
                          ○ {c}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

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

          {/* Câu tự soạn của tôi (authoring, D28) */}
          <View className="mt-6">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-display text-base font-bold text-ink">Câu của tôi</Text>
              <Pressable
                accessibilityLabel="Soạn câu mới"
                onPress={() => router.push("/questions")}
              >
                <Text className="font-bold text-brand">+ Soạn câu mới</Text>
              </Pressable>
            </View>
            {(customQs.data?.length ?? 0) === 0 && (
              <Text className="text-sm text-muted">Chưa có câu tự soạn nào.</Text>
            )}
            {(myCustom?.length ?? 0) > 0 && (
              <View className="gap-2">
                {myCustom.map((cq) => {
                  const on = selected.has(cq.id);
                  return (
                    <Pressable
                      key={cq.id}
                      accessibilityLabel={`custom:${cq.prompt}`}
                      onPress={() => toggle(cq.id)}
                      className={`flex-row items-center gap-3 rounded-lg p-3 ${on ? "bg-brand/10" : "bg-surface shadow-sm"}`}
                    >
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-md border-2 ${on ? "border-brand bg-brand" : "border-line"}`}
                      >
                        {on && <Text className="text-xs font-extrabold text-white">✓</Text>}
                      </View>
                      <View className="flex-1">
                        <MathText value={cq.prompt} size={15} weight="600" />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
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
