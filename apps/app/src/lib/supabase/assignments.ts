// Bài tập (M3 US2): GV tạo/liệt kê theo lớp; HS xem bài được giao (RLS lo cô lập). Guest → [].
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./client";
import { useAuth } from "./auth";

export interface AssignmentRow {
  id: string;
  classId: string | null; // null = bài tại nhà (PH→con)
  title: string;
  questionIds: string[];
  dueAt: string | null;
  allowLate: boolean;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
  createdAt: string;
}

const SELECT_COLS =
  "id, class_id, title, question_ids, due_at, allow_late, max_attempts, time_limit_minutes, created_at";

function mapRow(r: Record<string, unknown>): AssignmentRow {
  return {
    id: r.id as string,
    classId: (r.class_id as string | null) ?? null,
    title: r.title as string,
    questionIds: (r.question_ids as string[]) ?? [],
    dueAt: (r.due_at as string | null) ?? null,
    allowLate: (r.allow_late as boolean) ?? true,
    maxAttempts: (r.max_attempts as number | null) ?? null,
    timeLimitMinutes: (r.time_limit_minutes as number | null) ?? null,
    createdAt: r.created_at as string,
  };
}

/** Bài tập của một lớp (GV xem; RLS owns_class). */
export function useClassAssignments(classId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["assignments", "class", classId, user?.id ?? "guest"],
    enabled: Boolean(supabase && user && classId),
    queryFn: async (): Promise<AssignmentRow[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from("assignments")
        .select(SELECT_COLS)
        .eq("class_id", classId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

/** Bài được giao cho HS hiện tại (mọi lớp em là thành viên; RLS is_member). */
export function useMyAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["assignments", "mine", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<AssignmentRow[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from("assignments")
        .select(SELECT_COLS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

/** Một bài tập theo id (cho màn làm bài). */
export function useAssignment(assignmentId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["assignment", assignmentId, user?.id ?? "guest"],
    enabled: Boolean(supabase && user && assignmentId),
    queryFn: async (): Promise<AssignmentRow | null> => {
      if (!supabase || !user) return null;
      const { data, error } = await supabase
        .from("assignments")
        .select(SELECT_COLS)
        .eq("id", assignmentId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapRow(data) : null;
    },
  });
}

export interface NewAssignment {
  classId: string;
  title: string;
  questionIds: string[];
  dueAt?: string | null;
  allowLate?: boolean;
  maxAttempts?: number | null;
  timeLimitMinutes?: number | null;
  /** Giao cho HS cụ thể (subset của lớp). undefined/[] = cả lớp. */
  targetStudentIds?: string[];
}

/** Ghi lại danh sách HS được nhắm cho một bài (xoá cũ → chèn mới). [] = cả lớp. */
async function replaceTargets(assignmentId: string, studentIds: string[] | undefined) {
  if (!supabase || studentIds === undefined) return;
  await supabase.from("assignment_targets").delete().eq("assignment_id", assignmentId);
  if (studentIds.length > 0) {
    const rows = studentIds.map((sid) => ({ assignment_id: assignmentId, student_id: sid }));
    const { error } = await supabase.from("assignment_targets").insert(rows);
    if (error) throw error;
  }
}

/** HS được nhắm của một bài (cho composer prefill + hiển thị "giao riêng"). */
export function useAssignmentTargets(assignmentId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["assignment-targets", assignmentId, user?.id ?? "guest"],
    enabled: Boolean(supabase && user && assignmentId),
    queryFn: async (): Promise<string[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from("assignment_targets")
        .select("student_id")
        .eq("assignment_id", assignmentId);
      if (error) throw error;
      return (data ?? []).map((r) => r.student_id as string);
    },
  });
}

/** GV tạo bài tập (RLS owns_class) + cấu hình giới hạn nộp (D25). */
export function useCreateAssignment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: NewAssignment) => {
      if (!supabase || !user) return;
      const { data, error } = await supabase
        .from("assignments")
        .insert({
          class_id: a.classId,
          title: a.title,
          question_ids: a.questionIds,
          due_at: a.dueAt ?? null,
          allow_late: a.allowLate ?? true,
          max_attempts: a.maxAttempts ?? null,
          time_limit_minutes: a.timeLimitMinutes ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      await replaceTargets(data.id as string, a.targetStudentIds);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

/** GV sửa bài tập (RLS owns_class). */
export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: NewAssignment & { id: string }) => {
      if (!supabase) return;
      const { error } = await supabase
        .from("assignments")
        .update({
          title: a.title,
          question_ids: a.questionIds,
          due_at: a.dueAt ?? null,
          allow_late: a.allowLate ?? true,
          max_attempts: a.maxAttempts ?? null,
          time_limit_minutes: a.timeLimitMinutes ?? null,
        })
        .eq("id", a.id);
      if (error) throw error;
      await replaceTargets(a.id, a.targetStudentIds);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

/** GV nhân bản bài tập (RLS owns_class) — tạo bản sao cùng lớp để tái dùng nhanh. */
export function useCloneAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: AssignmentRow) => {
      if (!supabase || !a.classId) return;
      const { error } = await supabase.from("assignments").insert({
        class_id: a.classId,
        title: `${a.title} (sao chép)`,
        question_ids: a.questionIds,
        due_at: a.dueAt,
        allow_late: a.allowLate,
        max_attempts: a.maxAttempts,
        time_limit_minutes: a.timeLimitMinutes,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

/** GV xoá bài tập (RLS owns_class; cascade xoá submissions của bài). */
export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      if (!supabase) return;
      const { error } = await supabase.from("assignments").delete().eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
}
