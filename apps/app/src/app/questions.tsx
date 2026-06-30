// Ngân hàng câu của tôi (authoring, D28) — GV/PH soạn câu tự tạo (mcq/numeric/fraction) để giao.
// Đáp án lưu DB, ẩn với HS (chấm server-side, D4). Tái dùng trong composer.
import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/lib/supabase/auth";
import { useMyRole } from "@/lib/supabase/role";
import {
  useCreateCustomQuestion,
  useDeleteCustomQuestion,
  useUpdateCustomQuestion,
  useMyCustomQuestions,
  uploadQuestionImage,
  type CustomQuestion,
  type CustomType,
} from "@/lib/supabase/custom-questions";
import { MathText } from "@/components/math/MathText";
import { SUBJECTS, subjectLabel, DEFAULT_SUBJECT } from "@/lib/subjects";
import { packMatching, unpackMatching } from "@/lib/matching";

const TYPES: { value: CustomType; label: string }[] = [
  { value: "mcq", label: "Trắc nghiệm" },
  { value: "numeric", label: "Số" },
  { value: "fraction", label: "Phân số" },
  { value: "true-false", label: "Đúng/Sai" },
  { value: "expression", label: "Biểu thức" },
  { value: "fill-blank", label: "Điền chỗ trống" },
  { value: "multi", label: "Chọn nhiều" },
  { value: "ordering", label: "Sắp thứ tự" },
  { value: "matching", label: "Nối cặp" },
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
  const [hint, setHint] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [roundTo, setRoundTo] = useState(""); // numeric: làm tròn N chữ số
  const [tolerance, setTolerance] = useState(""); // numeric: dung sai
  const [unordered, setUnordered] = useState(false); // fill-blank: không theo thứ tự
  const [rights, setRights] = useState(["", ""]); // matching: vế phải (song song choices = vế trái)

  const reset = () => {
    setPrompt("");
    setChoices(["", ""]);
    setCorrect("");
    setExplanation("");
    setHint("");
    setImageUrl(null);
    setSubject(DEFAULT_SUBJECT);
    setRoundTo("");
    setTolerance("");
    setUnordered(false);
    setRights(["", ""]);
    setEditingId(null);
  };

  // options chấm theo loại (chỉ gắn key có giá trị).
  const buildOptions = () => {
    const o: { tolerance?: number; unordered?: boolean; roundTo?: number } = {};
    if (type === "numeric") {
      const r = parseInt(roundTo, 10);
      if (Number.isFinite(r) && r >= 0) o.roundTo = r;
      const t = Number(tolerance.replace(",", "."));
      if (Number.isFinite(t) && t > 0) o.tolerance = t;
    }
    if (type === "fill-blank" && unordered) o.unordered = true;
    return Object.keys(o).length > 0 ? o : null;
  };

  // Chọn + tải ảnh (web): mở file picker → upload Storage → giữ public URL.
  const pickImage = () => {
    if (Platform.OS !== "web" || typeof document === "undefined" || !user) {
      setMsg("Tải ảnh hiện hỗ trợ trên web.");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      setMsg(null);
      try {
        setImageUrl(await uploadQuestionImage(file, user.id));
      } catch {
        setMsg("Tải ảnh thất bại.");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // Nạp một câu vào form để sửa.
  const startEdit = (qq: CustomQuestion) => {
    setEditingId(qq.id);
    setType(qq.type);
    setPrompt(qq.prompt);
    setExplanation(qq.explanation ?? "");
    setHint(qq.hint ?? "");
    setImageUrl(qq.imageUrl);
    setSubject(qq.subject ?? DEFAULT_SUBJECT);
    setRoundTo(qq.options?.roundTo != null ? String(qq.options.roundTo) : "");
    setTolerance(qq.options?.tolerance != null ? String(qq.options.tolerance) : "");
    setUnordered(qq.options?.unordered === true);
    if (qq.type === "mcq" || qq.type === "multi") {
      setChoices(qq.choices ?? ["", ""]);
      setCorrect(qq.correct); // multi: correct là JSON mảng
    } else if (qq.type === "ordering") {
      // hiện theo ĐÚNG thứ tự (correct) để tác giả sửa; lưu sẽ xáo lại cho hiển thị.
      try {
        const arr = JSON.parse(qq.correct);
        setChoices(Array.isArray(arr) && arr.length ? arr.map(String) : ["", ""]);
      } catch {
        setChoices(["", ""]);
      }
      setCorrect("");
    } else if (qq.type === "matching") {
      // trái = unpack(choices); phải = correct (JSON, theo thứ tự trái).
      const { lefts } = unpackMatching(qq.choices ?? []);
      let rs: string[] = [];
      try {
        const arr = JSON.parse(qq.correct);
        if (Array.isArray(arr)) rs = arr.map(String);
      } catch {
        /* bỏ qua */
      }
      setChoices(lefts.length ? lefts : ["", ""]);
      setRights(rs.length ? rs : ["", ""]);
      setCorrect("");
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
  // multi: tập đáp án đúng (lưu trong `correct` dạng JSON mảng).
  const multiSet: string[] = (() => {
    try {
      const a = JSON.parse(correct);
      return Array.isArray(a) ? a.map(String) : [];
    } catch {
      return [];
    }
  })();
  const toggleMulti = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    const next = multiSet.includes(v) ? multiSet.filter((x) => x !== v) : [...multiSet, v];
    setCorrect(JSON.stringify(next));
  };
  const valid = (() => {
    if (prompt.trim().length === 0) return false;
    if (type === "mcq") {
      const opts = choices.map((c) => c.trim()).filter(Boolean);
      return opts.length >= 2 && opts.includes(correct.trim());
    }
    if (type === "multi") {
      const opts = choices.map((c) => c.trim()).filter(Boolean);
      return opts.length >= 2 && multiSet.length >= 1 && multiSet.every((x) => opts.includes(x));
    }
    if (type === "ordering") {
      return choices.map((c) => c.trim()).filter(Boolean).length >= 2;
    }
    if (type === "matching") {
      const pairs = choices.filter((l, i) => l.trim() && (rights[i] ?? "").trim());
      return pairs.length >= 2;
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
    // ordering: lưu correct = thứ tự ĐÚNG (JSON); choices = bản XÁO TRỘN để hiển thị (chống lộ).
    const shuffled = (() => {
      if (opts.length < 2) return opts;
      for (let tries = 0; tries < 5; tries++) {
        const a = [...opts];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        if (a.some((x, i) => x !== opts[i])) return a; // khác thứ tự gốc
      }
      return [...opts].reverse();
    })();
    // matching: cặp (trái[i], phải[i]) — lưu correct = phải theo thứ tự trái; choices = gói trái + phải XÁO TRỘN.
    const mPairs = choices
      .map((l, i) => ({ left: l.trim(), right: (rights[i] ?? "").trim() }))
      .filter((p) => p.left && p.right);
    const mLefts = mPairs.map((p) => p.left);
    const mRights = mPairs.map((p) => p.right);
    const mRightsShuffled = (() => {
      if (mRights.length < 2) return mRights;
      for (let tries = 0; tries < 5; tries++) {
        const a = [...mRights];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        if (a.some((x, i) => x !== mRights[i])) return a;
      }
      return [...mRights].reverse();
    })();
    // fill-blank/ordering/matching: đáp án lưu JSON array; còn lại là chuỗi đơn.
    const correctValue =
      type === "fill-blank" || type === "ordering"
        ? JSON.stringify(opts)
        : type === "matching"
          ? JSON.stringify(mRights)
          : correct.trim();
    const payload = {
      type,
      prompt: prompt.trim(),
      choices:
        type === "mcq" || type === "multi"
          ? opts
          : type === "ordering"
            ? shuffled
            : type === "matching"
              ? packMatching(mLefts, mRightsShuffled)
              : null,
      correct: correctValue,
      explanation: explanation.trim() || null,
      hint: hint.trim() || null,
      imageUrl,
      subject,
      options: buildOptions(),
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
        <Text className="mb-1 text-sm font-bold text-muted">Môn</Text>
        <View className="mb-3 flex-row flex-wrap gap-2">
          {SUBJECTS.map((sub) => {
            const active = subject === sub.key;
            return (
              <Pressable
                key={sub.key}
                accessibilityLabel={`Môn ${sub.label}`}
                onPress={() => setSubject(sub.key)}
                className={`min-h-[36px] flex-row items-center gap-1 rounded-full px-3 ${active ? "bg-brand" : "bg-paper"}`}
              >
                <Text>{sub.emoji}</Text>
                <Text className={`font-bold ${active ? "text-white" : "text-ink"}`}>
                  {sub.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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

        {type === "multi" && (
          <View className="mt-4">
            <Text className="mb-1 text-sm font-bold text-muted">
              Lựa chọn (✓ tất cả đáp án đúng)
            </Text>
            {choices.map((c, i) => {
              const on = multiSet.includes(c.trim());
              return (
                <View key={i} className="mt-2 flex-row items-center gap-2">
                  <Pressable
                    accessibilityLabel={`Đáp án đúng ${i + 1}`}
                    onPress={() => toggleMulti(c)}
                    className={`h-6 w-6 items-center justify-center rounded-md border-2 ${on ? "border-brand bg-brand" : "border-line"}`}
                  >
                    {on && <Text className="text-xs font-extrabold text-white">✓</Text>}
                  </Pressable>
                  <TextInput
                    value={c}
                    onChangeText={(v) =>
                      setChoices((prev) => prev.map((x, j) => (j === i ? v : x)))
                    }
                    placeholder={`Lựa chọn ${i + 1}`}
                    placeholderTextColor="#a1a1aa"
                    accessibilityLabel={`Lựa chọn ${i + 1}`}
                    className="min-h-[44px] flex-1 rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
                  />
                </View>
              );
            })}
            <Pressable
              accessibilityLabel="Thêm lựa chọn"
              onPress={() => setChoices((prev) => [...prev, ""])}
              className="mt-2 self-start"
            >
              <Text className="font-bold text-brand">+ Thêm lựa chọn</Text>
            </Pressable>
          </View>
        )}

        {type === "ordering" && (
          <View className="mt-4">
            <Text className="mb-1 text-sm font-bold text-muted">
              Các mục theo ĐÚNG thứ tự (HS sẽ thấy bị xáo trộn)
            </Text>
            {choices.map((c, i) => (
              <View key={i} className="mt-2 flex-row items-center gap-2">
                <Text className="w-6 text-center font-display font-extrabold text-brand">
                  {i + 1}
                </Text>
                <TextInput
                  value={c}
                  onChangeText={(v) => setChoices((prev) => prev.map((x, j) => (j === i ? v : x)))}
                  placeholder={`Mục ${i + 1}`}
                  placeholderTextColor="#a1a1aa"
                  accessibilityLabel={`Mục ${i + 1}`}
                  className="min-h-[44px] flex-1 rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
                />
              </View>
            ))}
            <Pressable
              accessibilityLabel="Thêm mục"
              onPress={() => setChoices((prev) => [...prev, ""])}
              className="mt-2 self-start"
            >
              <Text className="font-bold text-brand">+ Thêm mục</Text>
            </Pressable>
          </View>
        )}

        {type === "matching" && (
          <View className="mt-4">
            <Text className="mb-1 text-sm font-bold text-muted">
              Các cặp (vế trái — vế phải đúng; HS thấy phải bị xáo trộn)
            </Text>
            {choices.map((c, i) => (
              <View key={i} className="mt-2 flex-row items-center gap-2">
                <TextInput
                  value={c}
                  onChangeText={(v) => setChoices((prev) => prev.map((x, j) => (j === i ? v : x)))}
                  placeholder={`Trái ${i + 1}`}
                  placeholderTextColor="#a1a1aa"
                  accessibilityLabel={`Vế trái ${i + 1}`}
                  className="min-h-[44px] flex-1 rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
                />
                <Text className="text-muted">→</Text>
                <TextInput
                  value={rights[i] ?? ""}
                  onChangeText={(v) =>
                    setRights((prev) => {
                      const next = [...prev];
                      next[i] = v;
                      return next;
                    })
                  }
                  placeholder={`Phải ${i + 1}`}
                  placeholderTextColor="#a1a1aa"
                  accessibilityLabel={`Vế phải ${i + 1}`}
                  className="min-h-[44px] flex-1 rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
                />
              </View>
            ))}
            <Pressable
              accessibilityLabel="Thêm cặp"
              onPress={() => {
                setChoices((prev) => [...prev, ""]);
                setRights((prev) => [...prev, ""]);
              }}
              className="mt-2 self-start"
            >
              <Text className="font-bold text-brand">+ Thêm cặp</Text>
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
            <Pressable
              accessibilityLabel="Không theo thứ tự"
              onPress={() => setUnordered((v) => !v)}
              className="mt-3 flex-row items-center gap-2"
            >
              <View
                className={`h-6 w-6 items-center justify-center rounded-md border-2 ${unordered ? "border-brand bg-brand" : "border-line"}`}
              >
                {unordered && <Text className="text-xs font-extrabold text-white">✓</Text>}
              </View>
              <Text className="flex-1 text-sm text-ink">
                Chấp nhận đáp án KHÔNG theo thứ tự (vd "2;4;6" = "6;2;4")
              </Text>
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
            {type === "numeric" && (
              <View className="mt-3 flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-1 text-xs font-bold text-muted">Làm tròn (số chữ số)</Text>
                  <TextInput
                    value={roundTo}
                    onChangeText={setRoundTo}
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor="#a1a1aa"
                    accessibilityLabel="Làm tròn số chữ số"
                    className="min-h-[44px] rounded-md border-2 border-line bg-paper px-3 text-center text-base text-ink"
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-xs font-bold text-muted">Dung sai (±)</Text>
                  <TextInput
                    value={tolerance}
                    onChangeText={setTolerance}
                    placeholder="—"
                    placeholderTextColor="#a1a1aa"
                    accessibilityLabel="Dung sai"
                    className="min-h-[44px] rounded-md border-2 border-line bg-paper px-3 text-center text-base text-ink"
                  />
                </View>
              </View>
            )}
          </>
        )}

        <Text className="mt-4 mb-1 text-sm font-bold text-muted">
          Gợi ý (tuỳ chọn — HS thấy khi làm)
        </Text>
        <TextInput
          value={hint}
          onChangeText={setHint}
          placeholder="VD: Nhớ quy đồng mẫu số trước nhé"
          placeholderTextColor="#a1a1aa"
          accessibilityLabel="Gợi ý"
          className="min-h-[44px] rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
        />

        <Text className="mt-4 mb-1 text-sm font-bold text-muted">Giải thích (tuỳ chọn)</Text>
        <TextInput
          value={explanation}
          onChangeText={setExplanation}
          placeholder="Lời giải ngắn"
          placeholderTextColor="#a1a1aa"
          accessibilityLabel="Giải thích"
          className="min-h-[44px] rounded-md border-2 border-line bg-paper px-3 text-base text-ink"
        />

        {/* Ảnh minh hoạ (tuỳ chọn) — Storage public, hữu ích cho Hình học */}
        <Text className="mt-4 mb-1 text-sm font-bold text-muted">Ảnh minh hoạ (tuỳ chọn)</Text>
        {imageUrl ? (
          <View className="rounded-md border-2 border-line bg-paper p-2">
            <Image
              source={{ uri: imageUrl }}
              accessibilityLabel="Ảnh câu hỏi"
              contentFit="contain"
              style={{ width: "100%", aspectRatio: 1.6, borderRadius: 8 }}
            />
            <Pressable
              accessibilityLabel="Xoá ảnh"
              onPress={() => setImageUrl(null)}
              className="mt-2 min-h-[40px] items-center justify-center rounded-md bg-surface"
            >
              <Text className="font-bold text-no">Xoá ảnh</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityLabel="Thêm ảnh"
            disabled={uploading}
            onPress={pickImage}
            className="min-h-[44px] items-center justify-center rounded-md border-2 border-dashed border-line bg-paper"
          >
            <Text className="font-bold text-brand">{uploading ? "Đang tải…" : "+ Thêm ảnh"}</Text>
          </Pressable>
        )}

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
                {subjectLabel(q.subject)} · {TYPES.find((t) => t.value === q.type)?.label} · đáp án:{" "}
                {q.correct}
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
