// Lưới huy hiệu (US2, T036, FR-011): đã mở = rõ; chưa mở = mờ + điều kiện đạt.
import { Text, View } from "react-native";
import type { Badge, BadgeCriteria } from "@synaptek/learning-path";

interface BadgeGridProps {
  catalog: Badge[];
  earned: Set<string>;
}

/** Mô tả điều kiện đạt huy hiệu (cho huy hiệu chưa mở). */
function criteriaHint(c: BadgeCriteria): string {
  switch (c.type) {
    case "streak":
      return `Luyện ${c.gte} ngày liên tiếp`;
    case "xp":
      return `Đạt ${c.gte} XP`;
    case "correct_count":
      return `Trả lời đúng ${c.gte} câu`;
    case "skill_mastered":
      return "Thành thạo một kỹ năng";
    case "topic_mastered":
      return "Thành thạo trọn một chủ đề";
  }
}

export function BadgeGrid({ catalog, earned }: BadgeGridProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {catalog.map((b) => {
        const unlocked = earned.has(b.id);
        return (
          <View
            key={b.id}
            accessibilityLabel={`${b.name}${unlocked ? " — đã mở" : " — chưa mở"}`}
            className={`rounded-lg bg-surface p-3 shadow-sm ${unlocked ? "" : "opacity-45"}`}
            style={{ width: 104 }}
          >
            <Text style={{ fontSize: 34, textAlign: "center" }}>{unlocked ? b.icon : "🔒"}</Text>
            <Text className="mt-1 text-center font-display text-xs font-bold text-ink">
              {b.name}
            </Text>
            <Text className="mt-0.5 text-center text-[10px] leading-snug text-muted">
              {unlocked ? b.desc : criteriaHint(b.criteria)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
