// Route GV — chấm/ghi đè điểm + nhận xét cho một bài tập (M3 US3, T029). id = assignmentId.
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAssignment } from "@/lib/supabase/assignments";
import {
  useAssignmentSubmissions,
  useOverrideGrade,
  type GradedSubmission,
} from "@/lib/supabase/submissions";

export default function GradeAssignment() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const assignmentId = String(id);
  const assignment = useAssignment(assignmentId);
  const subs = useAssignmentSubmissions(assignmentId);

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
      <Text className="font-display text-2xl font-extrabold text-ink">
        Chấm: {assignment.data?.title ?? "Bài tập"}
      </Text>
      <Text className="mt-1 text-sm text-muted">{subs.data?.length ?? 0} bài đã nộp</Text>

      <View className="mt-5 gap-3">
        {subs.data?.length === 0 && (
          <View className="rounded-lg border-2 border-dashed border-line p-6">
            <Text className="text-center text-muted">Chưa có học sinh nào nộp bài.</Text>
          </View>
        )}
        {subs.data?.map((s) => (
          <SubmissionCard key={s.studentId} sub={s} assignmentId={assignmentId} />
        ))}
      </View>
    </ScrollView>
  );
}

function SubmissionCard({ sub, assignmentId }: { sub: GradedSubmission; assignmentId: string }) {
  const override = useOverrideGrade(assignmentId);
  const [pct, setPct] = useState(String(Math.round((sub.displayScore ?? 0) * 100)));
  const [feedback, setFeedback] = useState(sub.feedback ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  const save = () => {
    setMsg(null);
    const finalScore = Number(pct) / 100;
    override.mutate(
      { studentId: sub.studentId, finalScore, feedback: feedback.trim() },
      {
        onSuccess: () => setMsg("Đã lưu điểm + nhận xét ✓"),
        onError: (e) => setMsg(e instanceof Error ? e.message : "Lỗi lưu."),
      },
    );
  };

  return (
    <View className="rounded-lg bg-surface p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-base font-bold text-ink">
          {sub.fullName ?? "Học sinh"}
        </Text>
        <Text className="text-xs font-semibold text-muted">
          Máy chấm: {Math.round((sub.autoScore ?? 0) * 100)}%
          {sub.isOverride ? "  ·  đã ghi đè" : ""}
        </Text>
      </View>
      <View className="mt-3 flex-row items-center gap-2">
        <Text className="text-sm font-bold text-muted">Điểm (%)</Text>
        <TextInput
          value={pct}
          onChangeText={setPct}
          keyboardType="number-pad"
          accessibilityLabel={`Điểm cho ${sub.fullName ?? "học sinh"}`}
          className="min-h-[44px] w-20 rounded-md border-2 border-line bg-paper px-2 text-center text-base text-ink"
        />
        <Pressable
          accessibilityLabel="Lưu điểm"
          disabled={override.isPending}
          onPress={save}
          className="min-h-[44px] flex-1 items-center justify-center rounded-md bg-brand"
        >
          <Text className="font-display font-bold text-white">Lưu</Text>
        </Pressable>
      </View>
      <TextInput
        value={feedback}
        onChangeText={setFeedback}
        placeholder="Nhận xét cho em…"
        placeholderTextColor="#a1a1aa"
        multiline
        className="mt-2 min-h-[44px] rounded-md border-2 border-line bg-paper px-3 py-2 text-base text-ink"
      />
      {msg && <Text className="mt-2 text-sm font-semibold text-brand">{msg}</Text>}
    </View>
  );
}
