// Nhập nhiều câu tự soạn bằng Markdown (D-authoring-import) — dán khối Markdown → xem trước có TỰ-CHẤM
// (chạy engine grade với đáp án = correct, giống gate validate:content) → lưu hàng loạt câu HỢP LỆ.
// Chỉ 6 loại text-friendly (mcq/multi/số/phân số/đúng-sai/điền chỗ trống); loại phức tạp dùng form cũ.
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { grade } from "@synaptek/grading-engine";
import { parseQuestionsMarkdown, type ParsedQuestion } from "@/lib/markdown-questions";
import { useCreateCustomQuestion } from "@/lib/supabase/custom-questions";
import { SUBJECTS, subjectLabel, DEFAULT_SUBJECT } from "@/lib/subjects";
import { MathText } from "@/components/math/MathText";

const EXAMPLE = `### Số đối của -9 là số nào?
answer: 9
explain: Số đối của -9 là 9.

### Số nào lớn hơn: -3 hay -8?
* [x] -3
* [ ] -8

### -5 < -2. Đúng hay sai?
answer: đúng

### Rút gọn phân số 6/8 về tối giản.
answer: 3/4`;

const TYPE_LABEL: Record<string, string> = {
  mcq: "Trắc nghiệm",
  multi: "Chọn nhiều",
  numeric: "Số",
  fraction: "Phân số",
  "true-false": "Đúng/Sai",
  "fill-blank": "Điền chỗ trống",
};

/** Tự-chấm 1 câu: chạy engine với answer = chính đáp án → phải isCorrect (bắt đáp án soạn sai). */
function selfCheck(q: ParsedQuestion): boolean {
  let correct: string | string[] = q.correct;
  if (q.type === "fill-blank" || q.type === "multi") {
    try {
      const a = JSON.parse(q.correct);
      if (Array.isArray(a)) correct = a.map(String);
    } catch {
      return false;
    }
  }
  try {
    return grade({ type: q.type, correct, answer: correct }).isCorrect;
  } catch {
    return false;
  }
}

export default function QuestionsImport() {
  const insets = useSafeAreaInsets();
  const create = useCreateCustomQuestion();
  const [md, setMd] = useState("");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [showHelp, setShowHelp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const parsed = useMemo(() => parseQuestionsMarkdown(md), [md]);
  const checked = useMemo(() => parsed.questions.map((q) => ({ q, ok: selfCheck(q) })), [parsed]);
  const validCount = checked.filter((c) => c.ok).length;
  const hasInput = md.trim().length > 0;

  const saveAll = async () => {
    setSaving(true);
    setMsg(null);
    let saved = 0;
    for (const { q, ok } of checked) {
      if (!ok) continue;
      try {
        await create.mutateAsync({
          type: q.type,
          prompt: q.prompt,
          choices: q.choices ?? null,
          correct: q.correct,
          explanation: q.explanation ?? null,
          hint: q.hint ?? null,
          subject: subject === DEFAULT_SUBJECT ? null : subject,
        });
        saved++;
      } catch {
        // câu lỗi lưu → bỏ qua, tiếp câu sau (báo tổng ở cuối)
      }
    }
    setSaving(false);
    setMsg(`Đã lưu ${saved} câu vào ngân hàng.`);
    if (saved > 0) setMd("");
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 64,
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
        Nhập nhiều câu (Markdown)
      </Text>
      <Text className="mt-1 text-sm text-muted">
        Dán nhiều câu cùng lúc, hệ thống tự nhận loại và kiểm đáp án trước khi lưu.
      </Text>

      {/* Trợ giúp cú pháp (mở/đóng) */}
      <Pressable
        onPress={() => setShowHelp((s) => !s)}
        accessibilityLabel="Xem cú pháp Markdown"
        className="mt-3 self-start"
      >
        <Text className="font-bold text-brand">{showHelp ? "▾ Ẩn cú pháp" : "▸ Xem cú pháp"}</Text>
      </Pressable>
      {showHelp && (
        <View className="mt-2 rounded-lg bg-paper p-3">
          <Text className="text-xs leading-5 text-ink">
            • Mỗi câu bắt đầu bằng <Text className="font-bold">### đề bài</Text>
            {"\n"}• Trắc nghiệm: mỗi lựa chọn 1 dòng <Text className="font-bold">* [x] đúng</Text> /{" "}
            <Text className="font-bold">* [ ] sai</Text> (nhiều [x] = chọn nhiều)
            {"\n"}• Đáp án khác: <Text className="font-bold">answer: …</Text> (đúng/sai · số · phân
            số a/b)
            {"\n"}• Điền chỗ trống nhiều ô: ngăn bằng dấu <Text className="font-bold">|</Text> (vd
            answer: 3 | 3)
            {"\n"}• Số thập phân dùng dấu phẩy: <Text className="font-bold">2,5</Text>
            {"\n"}• Tùy chọn: <Text className="font-bold">hint:</Text> gợi ý ·{" "}
            <Text className="font-bold">explain:</Text> lời giải
          </Text>
          <Pressable
            onPress={() => setMd(EXAMPLE)}
            accessibilityLabel="Chèn ví dụ mẫu"
            className="mt-2 self-start rounded-md bg-brand/10 px-3 py-1"
          >
            <Text className="text-xs font-bold text-brand">Chèn ví dụ mẫu</Text>
          </Pressable>
        </View>
      )}

      {/* Môn áp cho tất cả câu nhập */}
      <Text className="mt-4 text-sm font-bold text-muted">Môn (áp cho tất cả)</Text>
      <View className="mt-1 flex-row flex-wrap gap-2">
        {SUBJECTS.map((sub) => {
          const on = sub === subject;
          return (
            <Pressable
              key={sub}
              onPress={() => setSubject(sub)}
              accessibilityLabel={`Môn ${subjectLabel(sub)}`}
              className={`min-h-[40px] items-center justify-center rounded-md border-2 px-3 ${
                on ? "border-brand bg-brand/10" : "border-line bg-surface"
              }`}
            >
              <Text className={`text-sm font-bold ${on ? "text-brand" : "text-ink"}`}>
                {subjectLabel(sub)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Ô dán Markdown */}
      <TextInput
        value={md}
        onChangeText={setMd}
        accessibilityLabel="Nội dung Markdown"
        placeholder={"### Đề bài câu 1\nanswer: …"}
        placeholderTextColor="#a1a1aa"
        multiline
        textAlignVertical="top"
        className="mt-4 min-h-[180px] rounded-lg border-2 border-line bg-surface p-3 text-base text-ink"
      />

      {/* Xem trước có tự-chấm */}
      {hasInput && (
        <View className="mt-4">
          <Text className="font-display text-lg font-bold text-ink">
            Xem trước: {validCount}/{checked.length} câu hợp lệ
          </Text>

          {parsed.issues.map((iss, i) => (
            <View key={`iss-${i}`} className="mt-2 rounded-md border-2 border-no bg-no/5 p-2">
              <Text className="text-sm text-no">
                ⚠ Câu {iss.index}
                {iss.prompt ? ` (${iss.prompt.slice(0, 30)})` : ""}: {iss.message}
              </Text>
            </View>
          ))}

          {checked.map(({ q, ok }, i) => (
            <View
              key={`q-${i}`}
              accessibilityLabel={`Câu xem trước ${i + 1} ${ok ? "hợp lệ" : "lỗi"}`}
              className={`mt-2 rounded-md border-2 p-3 ${ok ? "border-ok bg-ok/5" : "border-no bg-no/5"}`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-muted">{TYPE_LABEL[q.type] ?? q.type}</Text>
                <Text className={`text-sm font-bold ${ok ? "text-ok" : "text-no"}`}>
                  {ok ? "✓ đáp án tự đúng" : "⚠ đáp án chưa tự chấm đúng"}
                </Text>
              </View>
              <View className="mt-1">
                <MathText value={q.prompt} size={16} weight="600" />
              </View>
            </View>
          ))}
        </View>
      )}

      {msg && <Text className="mt-4 font-bold text-brand">{msg}</Text>}

      <Pressable
        onPress={saveAll}
        disabled={saving || validCount === 0}
        accessibilityLabel="Lưu các câu hợp lệ"
        className={`mt-4 min-h-[52px] items-center justify-center rounded-lg ${
          saving || validCount === 0 ? "bg-line" : "bg-brand"
        }`}
      >
        <Text className="font-display text-base font-bold text-white">
          {saving ? "Đang lưu…" : `Lưu ${validCount} câu hợp lệ`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
