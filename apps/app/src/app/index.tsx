// Trang chủ — lộ trình "hôm nay học gì" (US1, T024) + duyệt chủ đề theo lớp.
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { Recommendation } from "@synaptek/learning-path";
import {
  GRADE_FILTERS,
  allGrades,
  getQuestions,
  listTopics,
  skillName,
  skillOfQuestion,
  skillsWithQuestions,
  strandOf,
  topicOfSkill,
} from "@/lib/content";
import { buildMasteryMap, toSkillAttempts } from "@/lib/mastery";
import { wrongQuestionIds } from "@/lib/mistakes";
import { buildPath, buildSkillNodes } from "@/lib/path";
import { strandColorFromId, strandColors, type StrandKey } from "@/theme/tokens";
import { Mascot } from "@/components/Mascot";
import { useAuth } from "@/lib/supabase/auth";
import { useAttempts } from "@/lib/supabase/attempts";
import { useSkillMastery } from "@/lib/supabase/mastery";
import { useGamification } from "@/lib/supabase/gamification";
import { useMyRole } from "@/lib/supabase/role";

const STRAND_LABELS: Record<string, string> = {
  num: "Số và phép tính",
  geo: "Hình học · Đo lường",
  measure: "Đo lường",
  stats: "Thống kê",
};

const REASON_LABEL: Record<Recommendation["reason"], string> = {
  due: "Đến hạn ôn",
  weak: "Cần ôn lại",
  new: "Học mới",
};

export default function Home() {
  const insets = useSafeAreaInsets();
  const [grade, setGrade] = useState(4);
  const topics = listTopics(grade);
  const { user } = useAuth();

  const attemptsQ = useAttempts();
  const masteryQ = useSkillMastery();
  const gamiQ = useGamification();
  const role = useMyRole();
  const isTeacher = role.data === "teacher";
  const isParent = role.data === "parent";
  const isStudent = !isTeacher && !isParent; // HS hoặc guest

  const mastery = useMemo(
    () => buildMasteryMap(toSkillAttempts(attemptsQ.data ?? [], skillOfQuestion)),
    [attemptsQ.data],
  );
  const dueAt = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of masteryQ.data ?? []) if (r.dueAt) m.set(r.skillId, Date.parse(r.dueAt));
    return m;
  }, [masteryQ.data]);

  const path = useMemo(() => {
    const nodes = buildSkillNodes(allGrades(), skillsWithQuestions());
    return buildPath(nodes, mastery, { now: Date.now(), dueAt, limit: 5 });
  }, [mastery, dueAt]);

  const hasData = (attemptsQ.data?.length ?? 0) > 0;
  const wrongCount = useMemo(() => wrongQuestionIds(attemptsQ.data ?? []).length, [attemptsQ.data]);
  const recos = [...path.due, ...path.next];

  const openSkill = (skillId: string) => {
    const topicId = topicOfSkill(skillId);
    if (topicId) router.push(`/practice/${topicId}`);
  };

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
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-sm text-muted">Chào buổi sáng,</Text>
          <Text className="font-display text-3xl font-extrabold text-ink">
            {isTeacher
              ? "Khu vực giáo viên 👋"
              : isParent
                ? "Khu vực phụ huynh 👋"
                : "Cùng học nhé! 👋"}
          </Text>
        </View>
        {user ? (
          <Pressable
            onPress={() => router.push("/profile")}
            accessibilityLabel="Hồ sơ"
            className="h-12 w-12 items-center justify-center rounded-full bg-brand"
          >
            <Text className="font-display text-lg font-extrabold text-white">
              {(user.email ?? "?").charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push("/login")}
            accessibilityLabel="Đăng nhập"
            className="min-h-[48px] items-center justify-center rounded-full bg-brand px-4"
          >
            <Text className="font-display text-sm font-bold text-white">Đăng nhập</Text>
          </Pressable>
        )}
      </View>

      {/* GIÁO VIÊN — lối vào lớp học nổi bật (khác hẳn HS) */}
      {isTeacher && (
        <View className="mt-5">
          <Pressable
            onPress={() => router.push("/classes")}
            accessibilityLabel="Lớp của tôi"
            className="flex-row items-center gap-3 rounded-lg bg-brand px-4 py-4"
          >
            <View className="rounded-full bg-white/20 p-1">
              <Mascot size={36} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="font-display text-lg font-extrabold text-white">Lớp của tôi</Text>
              <Text className="text-sm font-semibold text-white/90">
                Tạo lớp, giao bài, chấm điểm & xem điểm yếu của lớp
              </Text>
            </View>
            <Text className="text-2xl text-white">›</Text>
          </Pressable>
          <Text className="mt-4 text-sm font-bold text-muted">
            Xem trước nội dung (giống màn của học sinh) ở dưới ↓
          </Text>
        </View>
      )}

      {/* PHỤ HUYNH — lối vào theo dõi con */}
      {isParent && (
        <View className="mt-5">
          <Pressable
            onPress={() => router.push("/children")}
            accessibilityLabel="Con của tôi"
            className="flex-row items-center gap-3 rounded-lg bg-brand px-4 py-4"
          >
            <View className="rounded-full bg-white/20 p-1">
              <Mascot size={36} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="font-display text-lg font-extrabold text-white">Con của tôi</Text>
              <Text className="text-sm font-semibold text-white/90">
                Liên kết con & theo dõi tiến độ học tại nhà
              </Text>
            </View>
            <Text className="text-2xl text-white">›</Text>
          </Pressable>
          <Text className="mt-4 text-sm font-bold text-muted">
            Xem trước nội dung (giống màn của học sinh) ở dưới ↓
          </Text>
        </View>
      )}

      {/* XP + streak (US2, T035) — chỉ HS đăng nhập */}
      {isStudent && user && gamiQ.data && (
        <Pressable
          onPress={() => router.push("/profile")}
          accessibilityLabel={`Hồ sơ: ${gamiQ.data.state.totalXp} XP, streak ${gamiQ.data.state.currentStreak} ngày`}
          className="mt-4 flex-row gap-2"
        >
          <View className="flex-1 flex-row items-center justify-center gap-1 rounded-lg bg-surface py-2.5 shadow-sm">
            <Text className="text-base">⭐</Text>
            <Text className="font-display text-base font-extrabold text-ink">
              {gamiQ.data.state.totalXp}
            </Text>
            <Text className="text-xs font-bold text-muted">XP</Text>
          </View>
          <View className="flex-1 flex-row items-center justify-center gap-1 rounded-lg bg-surface py-2.5 shadow-sm">
            <Text className="text-base">🔥</Text>
            <Text className="font-display text-base font-extrabold text-ink">
              {gamiQ.data.state.currentStreak}
            </Text>
            <Text className="text-xs font-bold text-muted">ngày</Text>
          </View>
        </Pressable>
      )}

      {/* Lớp học (HS đăng nhập) — bài được giao + vào lớp bằng mã */}
      {isStudent && user && (
        <View className="mt-4 flex-row gap-2">
          <Pressable
            accessibilityLabel="Bài được giao"
            onPress={() => router.push("/assignments")}
            className="flex-1 items-center justify-center rounded-lg bg-surface py-3 shadow-sm"
          >
            <Text className="text-lg">📝</Text>
            <Text className="mt-0.5 font-display text-sm font-bold text-ink">Bài được giao</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Vào lớp bằng mã"
            onPress={() => router.push("/join")}
            className="flex-1 items-center justify-center rounded-lg bg-surface py-3 shadow-sm"
          >
            <Text className="text-lg">🔑</Text>
            <Text className="mt-0.5 font-display text-sm font-bold text-ink">Vào lớp bằng mã</Text>
          </Pressable>
        </View>
      )}

      {/* Ôn lại câu sai (HS đăng nhập, khi còn câu sai) — đóng vòng "khắc phục điểm yếu" */}
      {isStudent && user && wrongCount > 0 && (
        <Pressable
          accessibilityLabel={`Ôn lại câu sai: ${wrongCount} câu`}
          onPress={() => router.push("/review-mistakes")}
          className="mt-4 flex-row items-center gap-3 rounded-lg bg-no/10 px-4 py-3"
        >
          <Text className="text-2xl">🔁</Text>
          <View className="flex-1">
            <Text className="font-display font-bold text-ink">Ôn lại câu sai</Text>
            <Text className="text-xs font-semibold text-muted">
              {wrongCount} câu cần ôn — làm lại để khắc phục điểm yếu
            </Text>
          </View>
          <Text className="text-2xl text-no">›</Text>
        </Pressable>
      )}

      {/* Banner động viên — HS (bỏ qua cho GV) */}
      {isStudent &&
        (!user ? (
          <View className="mt-5 flex-row items-center gap-3 rounded-lg bg-brand px-4 py-3">
            <View className="rounded-full bg-white/20 p-1">
              <Mascot size={36} color="#ffffff" />
            </View>
            <Text className="flex-1 font-bold text-white">
              Đăng nhập để lưu tiến độ & nhận lộ trình riêng.
            </Text>
          </View>
        ) : !hasData ? (
          <Pressable
            onPress={() => router.push("/diagnostic")}
            accessibilityLabel="Làm bài chẩn đoán"
            className="mt-5 flex-row items-center gap-3 rounded-lg bg-brand px-4 py-4"
          >
            <View className="rounded-full bg-white/20 p-1">
              <Mascot size={36} color="#ffffff" />
            </View>
            <Text className="flex-1 font-bold text-white">
              Làm bài chẩn đoán ngắn để mình gợi ý lộ trình riêng cho em nhé!
            </Text>
          </Pressable>
        ) : (
          <View className="mt-5 flex-row items-center gap-3 rounded-lg bg-brand px-4 py-3">
            <View className="rounded-full bg-white/20 p-1">
              <Mascot size={36} color="#ffffff" />
            </View>
            <Text className="flex-1 font-bold text-white">Hôm nay mình luyện tiếp nhé!</Text>
          </View>
        ))}

      {/* Lộ trình hôm nay (HS) — gồm cold-start gợi ý kỹ năng nền */}
      {isStudent && recos.length > 0 && (
        <View className="mt-6">
          <View className="flex-row items-center justify-between">
            <Text className="font-display text-xl font-bold text-ink">Lộ trình hôm nay</Text>
            <Pressable onPress={() => router.push("/heatmap")} accessibilityLabel="Bản đồ điểm yếu">
              <Text className="text-sm font-bold text-brand">Điểm yếu ›</Text>
            </Pressable>
          </View>
          <View className="mt-3 gap-2">
            {recos.map((r) => {
              const color = strandColorFromId(r.skillId);
              return (
                <Pressable
                  key={r.skillId}
                  accessibilityLabel={skillName(r.skillId)}
                  onPress={() => openSkill(r.skillId)}
                  className="flex-row items-center gap-3 rounded-lg bg-surface p-4 shadow-sm"
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: color + "22" }}
                  >
                    <Mascot size={24} color={color} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-display text-base font-bold text-ink">
                      {skillName(r.skillId)}
                    </Text>
                    <Text className="text-xs font-semibold" style={{ color }}>
                      {REASON_LABEL[r.reason]}
                    </Text>
                  </View>
                  <Text className="text-2xl text-muted">›</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Đã vững toàn bộ kỹ năng hiện có (T054) — không còn gợi ý nào (HS) */}
      {isStudent && user && hasData && recos.length === 0 && (
        <View className="mt-6 flex-row items-center gap-3 rounded-lg bg-ok/10 p-4">
          <Text style={{ fontSize: 28 }}>🌟</Text>
          <Text className="flex-1 font-semibold text-ink">
            Em đã vững các kỹ năng hiện có — quá giỏi! Ôn lại để giữ phong độ, hoặc chờ nội dung mới
            nhé.
          </Text>
        </View>
      )}

      {/* Duyệt chủ đề theo lớp */}
      <View className="mt-7 flex-row items-center gap-2">
        <Text className="mr-1 text-sm font-bold text-muted">Lớp</Text>
        {GRADE_FILTERS.map((g) => {
          const active = g === grade;
          return (
            <Pressable
              key={g}
              accessibilityLabel={`Lớp ${g}`}
              onPress={() => setGrade(g)}
              className={`h-10 w-10 items-center justify-center rounded-full ${active ? "bg-ink" : "bg-surface"}`}
            >
              <Text className={`font-bold ${active ? "text-white" : "text-muted"}`}>{g}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-5 gap-3">
        {topics.length === 0 && (
          <View className="rounded-lg border-2 border-dashed border-line p-6">
            <Text className="text-center text-muted">Lớp này đang cập nhật nội dung…</Text>
          </View>
        )}
        {topics.map((topic) => {
          const color = strandColors[strandOf(topic.id) as StrandKey] ?? strandColors.num;
          const count = getQuestions(topic.id).length;
          const empty = count === 0;
          return (
            <Pressable
              key={topic.id}
              accessibilityLabel={topic.name}
              disabled={empty}
              onPress={() => router.push(`/practice/${topic.id}`)}
              className={`flex-row overflow-hidden rounded-lg bg-surface shadow-sm ${empty ? "opacity-60" : ""}`}
            >
              <View style={{ width: 8, backgroundColor: color }} />
              <View className="flex-1 flex-row items-center p-4">
                <View className="flex-1">
                  <Text
                    className="text-[11px] font-extrabold uppercase tracking-wide"
                    style={{ color }}
                  >
                    {STRAND_LABELS[strandOf(topic.id)] ?? "Toán"}
                  </Text>
                  <Text className="font-display text-xl font-bold text-ink">{topic.name}</Text>
                  {empty ? (
                    <Text className="text-sm italic text-muted">đang cập nhật nội dung…</Text>
                  ) : (
                    <Text className="text-xs font-semibold text-muted">{count} câu luyện tập</Text>
                  )}
                </View>
                {!empty && <Text className="text-2xl text-muted">›</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
