// Soạn câu "nhiều phần" (a/b/c…, D43): mỗi phần chọn 1 trong 9 loại đơn giản + đề + đáp án riêng.
// Rút gọn so với soạn câu đơn (không tùy chọn chấm nâng cao/ảnh/gợi ý riêng từng phần) để form không phình to.
import { Pressable, Text, TextInput, View } from "react-native";
import { MathText } from "@/components/math/MathText";
import { MathInsertBar } from "@/components/practice/MathInsertBar";
import {
  COMPOUND_PART_TYPES,
  emptyPart,
  type CompoundPartType,
  type PartDraft,
} from "@/lib/compound-parts";

const PART_TYPE_LABELS: Record<CompoundPartType, string> = {
  mcq: "Trắc nghiệm",
  numeric: "Số",
  fraction: "Phân số",
  "true-false": "Đúng/Sai",
  expression: "Biểu thức",
  "fill-blank": "Điền chỗ trống",
  multi: "Chọn nhiều",
  ordering: "Sắp thứ tự",
  matching: "Nối cặp",
  derivation: "Từng bước",
};

function updateAt(parts: PartDraft[], i: number, patch: Partial<PartDraft>): PartDraft[] {
  return parts.map((p, j) => (j === i ? { ...p, ...patch } : p));
}

function updateListAt(list: string[], j: number, v: string): string[] {
  return list.map((x, k) => (k === j ? v : x));
}

function parseMultiSet(raw: string): string[] {
  try {
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}

interface PartFieldsProps {
  part: PartDraft;
  /** Chữ cái phần (a/b/c…) — gắn vào MỌI accessibilityLabel để phân biệt giữa các phần (chống trùng nhãn). */
  letter: string;
  onChange: (patch: Partial<PartDraft>) => void;
}

/** Trường đáp án/lựa chọn riêng theo loại phần con — rút gọn từ form soạn câu đơn. */
function PartFields({ part: p, letter, onChange }: PartFieldsProps) {
  if (p.type === "mcq" || p.type === "multi") {
    const multiSet = p.type === "multi" ? parseMultiSet(p.correct) : [];
    const toggle = (raw: string) => {
      const v = raw.trim();
      if (!v) return;
      if (p.type === "mcq") {
        onChange({ correct: v });
        return;
      }
      const next = multiSet.includes(v) ? multiSet.filter((x) => x !== v) : [...multiSet, v];
      onChange({ correct: JSON.stringify(next) });
    };
    return (
      <View className="mt-2 gap-2">
        {p.items.map((c, i) => {
          const on = p.type === "mcq" ? c.trim() === p.correct.trim() : multiSet.includes(c.trim());
          return (
            <View key={i} className="flex-row items-center gap-2">
              <Pressable
                accessibilityLabel={`Đáp án đúng phần ${letter} ${i + 1}`}
                onPress={() => toggle(c)}
                className={`h-6 w-6 items-center justify-center rounded-md border-2 ${on ? "border-brand bg-brand" : "border-line"}`}
              >
                {on && <Text className="text-xs font-extrabold text-white">✓</Text>}
              </Pressable>
              <TextInput
                value={c}
                onChangeText={(v) => onChange({ items: updateListAt(p.items, i, v) })}
                placeholder={`Lựa chọn ${i + 1}`}
                placeholderTextColor="#a1a1aa"
                accessibilityLabel={`Lựa chọn phần ${letter} ${i + 1}`}
                className="min-h-[40px] flex-1 rounded-md border-2 border-line bg-surface px-3 text-sm text-ink"
              />
            </View>
          );
        })}
        <Pressable
          accessibilityLabel={`Thêm lựa chọn phần ${letter}`}
          onPress={() => onChange({ items: [...p.items, ""] })}
          className="self-start"
        >
          <Text className="font-bold text-brand">+ Thêm lựa chọn</Text>
        </Pressable>
      </View>
    );
  }

  if (p.type === "true-false") {
    return (
      <View className="mt-2 flex-row gap-2">
        {(
          [
            ["true", "Đúng"],
            ["false", "Sai"],
          ] as const
        ).map(([v, label]) => (
          <Pressable
            key={v}
            accessibilityLabel={`Đáp án ${label} phần ${letter}`}
            onPress={() => onChange({ correct: v })}
            className={`min-h-[40px] flex-1 items-center justify-center rounded-md border-2 ${p.correct === v ? "border-brand bg-brand/10" : "border-line bg-surface"}`}
          >
            <Text className={`font-bold ${p.correct === v ? "text-brand" : "text-muted"}`}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }

  if (p.type === "fill-blank") {
    const n = (p.prompt.match(/_{2,}/g) ?? []).length;
    return (
      <View className="mt-2 gap-2">
        <Text className="text-xs text-muted">
          Đề có {n} ô (đặt {"`__`"}) — nhập đáp án theo thứ tự.
        </Text>
        {p.items.map((c, i) => (
          <TextInput
            key={i}
            value={c}
            onChangeText={(v) => onChange({ items: updateListAt(p.items, i, v) })}
            placeholder={`Đáp án ô ${i + 1}`}
            placeholderTextColor="#a1a1aa"
            accessibilityLabel={`Đáp án ô ${i + 1} phần ${letter}`}
            className="min-h-[40px] rounded-md border-2 border-line bg-surface px-3 text-sm text-ink"
          />
        ))}
        <Pressable
          accessibilityLabel={`Thêm ô đáp án phần ${letter}`}
          onPress={() => onChange({ items: [...p.items, ""] })}
          className="self-start"
        >
          <Text className="font-bold text-brand">+ Thêm ô</Text>
        </Pressable>
      </View>
    );
  }

  if (p.type === "ordering") {
    return (
      <View className="mt-2 gap-2">
        <Text className="text-xs text-muted">Nhập các mục theo ĐÚNG thứ tự.</Text>
        {p.items.map((c, i) => (
          <View key={i} className="flex-row items-center gap-2">
            <Text className="w-5 text-center font-display font-extrabold text-brand">{i + 1}</Text>
            <TextInput
              value={c}
              onChangeText={(v) => onChange({ items: updateListAt(p.items, i, v) })}
              placeholder={`Mục ${i + 1}`}
              placeholderTextColor="#a1a1aa"
              accessibilityLabel={`Mục ${i + 1} phần ${letter}`}
              className="min-h-[40px] flex-1 rounded-md border-2 border-line bg-surface px-3 text-sm text-ink"
            />
          </View>
        ))}
        <Pressable
          accessibilityLabel={`Thêm mục phần ${letter}`}
          onPress={() => onChange({ items: [...p.items, ""] })}
          className="self-start"
        >
          <Text className="font-bold text-brand">+ Thêm mục</Text>
        </Pressable>
      </View>
    );
  }

  if (p.type === "matching") {
    return (
      <View className="mt-2 gap-2">
        {p.items.map((c, i) => (
          <View key={i} className="flex-row items-center gap-2">
            <TextInput
              value={c}
              onChangeText={(v) => onChange({ items: updateListAt(p.items, i, v) })}
              placeholder={`Trái ${i + 1}`}
              placeholderTextColor="#a1a1aa"
              accessibilityLabel={`Vế trái ${i + 1} phần ${letter}`}
              className="min-h-[40px] flex-1 rounded-md border-2 border-line bg-surface px-3 text-sm text-ink"
            />
            <Text className="text-muted">→</Text>
            <TextInput
              value={p.rights[i] ?? ""}
              onChangeText={(v) => onChange({ rights: updateListAt(p.rights, i, v) })}
              placeholder={`Phải ${i + 1}`}
              placeholderTextColor="#a1a1aa"
              accessibilityLabel={`Vế phải ${i + 1} phần ${letter}`}
              className="min-h-[40px] flex-1 rounded-md border-2 border-line bg-surface px-3 text-sm text-ink"
            />
          </View>
        ))}
        <Pressable
          accessibilityLabel={`Thêm cặp phần ${letter}`}
          onPress={() => onChange({ items: [...p.items, ""], rights: [...p.rights, ""] })}
          className="self-start"
        >
          <Text className="font-bold text-brand">+ Thêm cặp</Text>
        </Pressable>
      </View>
    );
  }

  if (p.type === "derivation") {
    return (
      <View className="mt-2 gap-2">
        <View className="flex-row gap-2">
          {(
            [
              ["expression", "Rút gọn / tính"],
              ["equation", "Giải phương trình"],
            ] as const
          ).map(([v, label]) => (
            <Pressable
              key={v}
              accessibilityLabel={`Kiểu bài ${label} phần ${letter}`}
              onPress={() => onChange({ derivMode: v })}
              className={`min-h-[36px] flex-1 items-center justify-center rounded-md border-2 ${p.derivMode === v ? "border-num bg-num/10" : "border-line bg-surface"}`}
            >
              <Text
                className={`text-xs font-bold ${p.derivMode === v ? "text-num" : "text-muted"}`}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-xs font-bold text-muted">Đề (dòng đầu HS biến đổi từ đây)</Text>
        <TextInput
          value={p.derivStart}
          onChangeText={(v) => onChange({ derivStart: v })}
          placeholder={p.derivMode === "equation" ? "vd 2x + 3 = 7" : "vd 12 + 3*4"}
          placeholderTextColor="#a1a1aa"
          accessibilityLabel={`Đề derivation phần ${letter}`}
          className="min-h-[40px] rounded-md border-2 border-line bg-surface px-3 text-sm text-ink"
        />
        <MathInsertBar
          keys={["x", "^", "√", "(", ")", "/", "*"]}
          onInsert={(k) => onChange({ derivStart: p.derivStart + k })}
        />
        {p.derivStart.trim().length > 0 && (
          <View className="flex-row items-center gap-2 rounded-md bg-num/5 px-3 py-2">
            <Text className="text-xs font-bold text-muted">Xem trước</Text>
            <MathText value={p.derivStart} size={18} weight="700" />
          </View>
        )}

        {p.derivMode === "expression" ? (
          <>
            <Text className="text-xs font-bold text-muted">Kết quả rút gọn (đích)</Text>
            <TextInput
              value={p.derivTarget}
              onChangeText={(v) => onChange({ derivTarget: v })}
              placeholder="vd 24"
              placeholderTextColor="#a1a1aa"
              accessibilityLabel={`Kết quả đích phần ${letter}`}
              className="min-h-[40px] rounded-md border-2 border-line bg-surface px-3 text-sm text-ink"
            />
            <MathInsertBar
              keys={["x", "^", "√", "(", ")", "/", "*"]}
              onInsert={(k) => onChange({ derivTarget: p.derivTarget + k })}
            />
          </>
        ) : (
          <>
            <Text className="text-xs font-bold text-muted">Biến (mặc định x)</Text>
            <TextInput
              value={p.derivVar}
              onChangeText={(v) => onChange({ derivVar: v })}
              placeholder="x"
              placeholderTextColor="#a1a1aa"
              accessibilityLabel={`Biến phần ${letter}`}
              className="min-h-[40px] w-20 rounded-md border-2 border-line bg-surface px-3 text-sm text-ink"
            />
          </>
        )}
      </View>
    );
  }

  // numeric | fraction | expression
  return (
    <View className="mt-2">
      <TextInput
        value={p.correct}
        onChangeText={(v) => onChange({ correct: v })}
        placeholder={p.type === "fraction" ? "1/2" : p.type === "expression" ? "2x + 2" : "0,5"}
        placeholderTextColor="#a1a1aa"
        accessibilityLabel={`Đáp án đúng phần ${letter}`}
        className="min-h-[40px] rounded-md border-2 border-line bg-surface px-3 text-sm text-ink"
      />
      {p.type === "expression" && (
        <MathInsertBar
          keys={["x", "^", "√", "(", ")", "/", "*"]}
          onInsert={(k) => onChange({ correct: p.correct + k })}
        />
      )}
      {(p.type === "fraction" || p.type === "expression") && p.correct.trim().length > 0 && (
        <View className="mt-2 flex-row items-center gap-2 rounded-md bg-num/5 px-3 py-2">
          <Text className="text-xs font-bold text-muted">Xem trước</Text>
          <MathText value={p.correct} size={18} weight="700" />
        </View>
      )}
    </View>
  );
}

interface CompoundPartsEditorProps {
  parts: PartDraft[];
  onChange: (parts: PartDraft[]) => void;
}

export function CompoundPartsEditor({ parts, onChange }: CompoundPartsEditorProps) {
  return (
    <View className="mt-4 gap-3">
      {parts.map((p, i) => {
        const letter = String.fromCharCode(97 + i);
        return (
          <View key={i} className="rounded-md border-2 border-line bg-paper p-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-sm font-extrabold text-ink">Phần {letter})</Text>
              {parts.length > 1 && (
                <Pressable
                  accessibilityLabel={`Xoá phần ${letter}`}
                  onPress={() => onChange(parts.filter((_, j) => j !== i))}
                >
                  <Text className="text-sm font-bold text-no">Xoá</Text>
                </Pressable>
              )}
            </View>

            <View className="mt-2 flex-row flex-wrap gap-1.5">
              {COMPOUND_PART_TYPES.map((t) => (
                <Pressable
                  key={t}
                  accessibilityLabel={`Loại phần ${letter} ${PART_TYPE_LABELS[t]}`}
                  onPress={() =>
                    onChange(updateAt(parts, i, { ...emptyPart(), type: t, prompt: p.prompt }))
                  }
                  className={`min-h-[32px] items-center justify-center rounded-full px-2.5 ${p.type === t ? "bg-brand" : "bg-surface"}`}
                >
                  <Text
                    className={`text-xs font-bold ${p.type === t ? "text-white" : "text-muted"}`}
                  >
                    {PART_TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={p.prompt}
              onChangeText={(v) => onChange(updateAt(parts, i, { prompt: v }))}
              placeholder={`Đề phần ${letter}`}
              placeholderTextColor="#a1a1aa"
              multiline
              accessibilityLabel={`Đề phần ${letter}`}
              className="mt-2 min-h-[40px] rounded-md border-2 border-line bg-surface px-3 py-2 text-sm text-ink"
            />

            <PartFields
              part={p}
              letter={letter}
              onChange={(patch) => onChange(updateAt(parts, i, patch))}
            />
          </View>
        );
      })}
    </View>
  );
}
