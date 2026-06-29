// Ngân hàng câu của tôi (authoring, D28) — GV/PH soạn câu tự tạo (mcq/numeric/fraction) để giao.
// Đáp án lưu DB, ẩn với HS (chấm server-side, D4). Tái dùng trong composer.
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/lib/supabase/auth";
import { useMyRole } from "@/lib/supabase/role";
import {
  useCreateCustomQuestion,
  useDeleteCustomQuestion,
  useUpdateCustomQuestion,
  useMyCustomQuestions,
  type CustomQuestion,
  type CustomType,
} from "@/lib/supabase/custom-questions";
import { MathText } from "@/components/math/MathText";

const TYPES: { value: CustomType; label: string }[] = [
  { value: "mcq", label: "Trắc nghiệm" },
  { value: "numeric", label: "Số" },
  { value: "fraction", label: "Phân số" },
  { value: "true-false", label: "Đúng/Sai" },
  { value: "expression", label: "Biểu thức" },
  { value: "fill-blank", label: "Điền chỗ trống" },
];

export default function MyQuestions() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const role = useMyRole();
  const list = useMyCustomQuestions();
  const create = useCreateCustomQuestion();
  const update = useUpdateCustomQuestion();
  const del = useDeleteCustomQuestion();

  const [type, setType] = useState<CustomType>("mcq");
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState(["", ""]);
  const [correct, setCorrect] = useState("");
  const [explanation, setExplanation] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const reset = () => {
    setPrompt("");
    setChoices(["", ""]);
    setCorrect("");
    setExplanation("");
    setEditingId(null);
  };

  // Nạp một câu vào form để sửa.
  const startEdit = (qq: CustomQuestion) => {
    setEditingId(qq.id);
    setType(qq.type);
    setPrompt(qq.prompt);
    setExplanation(qq.explanation ?? "");
    if (qq.type === "mcq") {
      setChoices(qq.choices ?? ["", ""]);
      setCorrect(qq.correct);
    } else if (qq.type === "fill-blank") {
      try {
        const arr = JSON.parse(qq.correct);
        setChoices(Array.isArray(arr) && arr.length ? arr.map(String) : ["", ""]);
      } catch {
        setChoices(["", ""]);
      }
      setCorrect("");
    } else {
      setChoices(["", ""]);
      setCorrect(qq.correct);
    }
  };

  const blankCount = (prompt.match(/_{2,}/g) ?? []).length;
  const valid = (() => {
    if (prompt.trim().length === 0) return false;
    if (type === "mcq") {
      const opts = choices.map((c) => c.trim()).filter(Boolean);
      return opts.length >= 2 && opts.includes(correct.trim());
    }
    if (type === "fill-blank") {
      const ans = choices.map((c) => c.trim()).filter(Boolean);
      return blankCount >= 1 && ans.length === blankCount;
    }
    if (type === "true-false") return correct === "true" || correct === "false";
    return correct.trim().length > 0; // numeric/fraction/expression
  })();

  const submit = () => {
    setMsg(null);
    const opts = choices.map((c) => c.trim()).filter(Boolean);
    // fill-blank: đáp án từng ô lưu JSON array; còn lại là chuỗi đơn.
    const correctValue = type === "fill-blank" ? JSON.stringify(opts) : correct.trim();
    const payload = {
      type,
      prompt: prompt.trim(),
      choices: type === "mcq" ? opts : null,
      correct: correctValue,
      explanation: explanation.trim() || null,
    };
    const onDone = {
      onSuccess: () => {
        setMsg(editingId ? "Đã cập nhật ✓" : "Đã lưu câu hỏi ✓");
        reset();
      },
      onError: () => setMsg("Lưu thất bại — kiểm tra lại."),
    };
    if (editingId) update.mutate({ ...payload, id: editingId }, onDone);
    else create.mutate(payload, onDone);
  };

  if (user && role.data === "student")
    return (
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16 }}>
        <Text className="font-display text-lg font-bold text-ink">Chỉ GV/PH soạn câu</Text>
        <Pressable
          onPress={() => router.replace("/")}
          className="mt-4 min-h-[48px] items-center justify-center rounded-md bg-brand"
        >
          <Text className="font-display font-bold text-white">Về trang chủ</Text>
        </Pressable>
      </ScrollView>
    );

  return (
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
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Quay lại"
        className="mb-3 h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm"
      >
        <Text className="text-lg text-muted">←</Text>
      </Pressable>
      <Text className="font-display text-2xl font-extrabold text-ink">Ngân hàng câu của tôi</Text>

      {/* Form soạn */}
      <View className="mt-5 rounded-lg bg-surface p-4 shadow-sm">
        <Text className="mb-1 text-sm font-bold text-muted">Loại câu</Text>
        <View className="flex-row flex-wrap gap-2">
          {TYPES.map((t) => {
            const active = t.value === type;
            return (
              <Pressable
                key={t.value}
                accessibilityLabel={t.label}
                onPress={() => {
                  setType(t.value);
                  setCorrect(""); // đổi loại → xoá đáp án cũ (tránh không hợp lệ)
                  setChoices(["", ""]);
                }}
                className={`min-h-[44px] flex-1 items-center justify-center rounded-md border-2 ${active ? "border-brand bg-brand/10" : "border-line bg-paper"}`}
              >
                <Text className={`font-bold ${active ? "text-brand" : "text-muted"}`}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mt-4 mb-1 text-sm font-bold text-muted">Đề bài</Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="VD: 3/4 + 1/4 = ?"
          placeholderTextColor="#a1a1aa"
          multiline
          accessibilityLabel="Đề bài"
          className="min-h-[48px] rounded-md border-2 border-line bg-paper px-3 py-2 text-base text-ink"
        />

        {type === "mcq" && (
          <View className="mt-4">
            <Text className="mb-1 text-sm font-bold text-muted">
              Lựa chọn (chạm để chọn đáp án đúng)
            </Text>
            {choices.map((c, i) => (
              <View key={i} className="mt-2 flex-row items-center gap-2">
                <Pressable
                  accessibilityLabel={`Đáp án đúng ${i + 1}`}
                  onPress={() => setCorrect(c.trim())}
                  className={`h-6 w-6 items-center justify-center rounded-full border-2 ${correct && c.trim() === correct ? "border-brand bg-brand" : "border-line"}`}
                >
                  {correct && c.trim() === correct && (
                    <Text className="text-xs font-extrabold text-white">✓</Text>
                  )}
                </Pressable>
                <TextInput
                  value={c}
                  onChangeText={(v) => setChoices((prev) => prev.map((x, j) => (j === i ? v : x)))}
                  placeholder={`Lựa chọn ${i + 1}`}
                  placeholderTextColor="#a1a1aa"
                  accessibilityLabel={`Lựa chọn ${i + 1}`}
                  className="min-h-[44px] flex-1 rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
                />
              </View>
            ))}
            <Pressable
              accessibilityLabel="Thêm lựa chọn"
              onPress={() => setChoices((prev) => [...prev, ""])}
              className="mt-2 self-start"
            >
              <Text className="font-bold text-brand">+ Thêm lựa chọn</Text>
            </Pressable>
          </View>
        )}

        {type === "true-false" && (
          <View className="mt-4">
            <Text className="mb-1 text-sm font-bold text-muted">Đáp án đúng</Text>
            <View className="flex-row gap-2">
              {(
                [
                  ["true", "Đúng"],
                  ["false", "Sai"],
                ] as const
              ).map(([v, label]) => {
                const on = correct === v;
                return (
                  <Pressable
                    key={v}
                    accessibilityLabel={`Đáp án ${label}`}
                    onPress={() => setCorrect(v)}
                    className={`min-h-[44px] flex-1 items-center justify-center rounded-md border-2 ${on ? "border-brand bg-brand/10" : "border-line bg-paper"}`}
                  >
                    <Text className={`font-bold ${on ? "text-brand" : "text-muted"}`}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {type === "fill-blank" && (
          <View className="mt-4">
            <Text className="mb-1 text-sm font-bold text-muted">
              Đáp án từng ô (đặt {"`__`"} cho mỗi ô trong đề)
            </Text>
            <Text className="mb-2 text-xs text-muted">
              Đề có {blankCount} ô — nhập {blankCount > 0 ? blankCount : "tương ứng"} đáp án theo
              thứ tự.
            </Text>
            {choices.map((c, i) => (
              <TextInput
                key={i}
                value={c}
                onChangeText={(v) => setChoices((prev) => prev.map((x, j) => (j === i ? v : x)))}
                placeholder={`Đáp án ô ${i + 1}`}
                placeholderTextColor="#a1a1aa"
                accessibilityLabel={`Đáp án ô ${i + 1}`}
                className="mt-2 min-h-[44px] rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
              />
            ))}
            <Pressable
              accessibilityLabel="Thêm ô đáp án"
              onPress={() => setChoices((prev) => [...prev, ""])}
              className="mt-2 self-start"
            >
              <Text className="font-bold text-brand">+ Thêm ô</Text>
            </Pressable>
          </View>
        )}

        {(type === "numeric" || type === "fraction" || type === "expression") && (
          <>
            <Text className="mt-4 mb-1 text-sm font-bold text-muted">
              Đáp án đúng{" "}
              {type === "fraction"
                ? "(vd 1/2)"
                : type === "expression"
                  ? "(vd 2(x+1) — tương đương được chấp nhận)"
                  : "(số — phẩy là thập phân)"}
            </Text>
            <TextInput
              value={correct}
              onChangeText={setCorrect}
              placeholder={type === "fraction" ? "1/2" : type === "expression" ? "2x + 2" : "0,5"}
              placeholderTextColor="#a1a1aa"
              accessibilityLabel="Đáp án đúng"
              className="min-h-[48px] rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
            />
          </>
        )}

        <Text className="mt-4 mb-1 text-sm font-bold text-muted">Giải thích (tuỳ chọn)</Text>
        <TextInput
          value={explanation}
          onChangeText={setExplanation}
          placeholder="Lời giải ngắn"
          placeholderTextColor="#a1a1aa"
          accessibilityLabel="Giải thích"
          className="min-h-[44px] rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
        />

        <View className="mt-4 flex-row gap-2">
          <Pressable
            accessibilityLabel={editingId ? "Cập nhật câu hỏi" : "Lưu câu hỏi"}
            disabled={!valid || create.isPending || update.isPending}
            onPress={submit}
            className={`min-h-[48px] flex-1 items-center justify-center rounded-md ${valid ? "bg-brand" : "bg-line"}`}
          >
            <Text className="font-display font-bold text-white">
              {editingId ? "Cập nhật" : "Lưu câu hỏi"}
            </Text>
          </Pressable>
          {editingId && (
            <Pressable
              accessibilityLabel="Huỷ sửa"
              onPress={reset}
              className="min-h-[48px] items-center justify-center rounded-md bg-paper px-4"
            >
              <Text className="font-display font-bold text-ink">Huỷ</Text>
            </Pressable>
          )}
        </View>
        {msg && <Text className="mt-2 text-sm font-semibold text-brand">{msg}</Text>}
      </View>

      {/* Danh sách */}
      <Text className="mt-7 font-display text-xl font-bold text-ink">
        Đã soạn ({list.data?.length ?? 0})
      </Text>
      <View className="mt-3 gap-2">
        {list.data?.length === 0 && (
          <Text className="text-sm text-muted">Chưa có câu nào — soạn câu đầu tiên ở trên.</Text>
        )}
        {list.data?.map((q) => (
          <View
            key={q.id}
            className="flex-row items-center gap-3 rounded-lg bg-surface p-3 shadow-sm"
          >
            <View className="flex-1">
              <MathText value={q.prompt} size={15} weight="600" />
              <Text className="mt-0.5 text-xs font-semibold text-muted">
                {TYPES.find((t) => t.value === q.type)?.label} · đáp án: {q.correct}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={`Sửa câu ${q.prompt}`}
              onPress={() => startEdit(q)}
              className="min-h-[40px] items-center justify-center rounded-md px-2"
            >
              <Text className="font-bold text-brand">Sửa</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Xoá câu ${q.prompt}`}
              onPress={() => del.mutate(q.id)}
              className="min-h-[40px] items-center justify-center rounded-md px-2"
            >
              <Text className="font-bold text-no">Xoá</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
