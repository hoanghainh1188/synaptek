// Lớp học GV (M3 US1): tạo/liệt kê lớp + mã mời (qua @synaptek/classroom), tham gia (RPC), roster, xóa HS.
// RLS bảo đảm GV chỉ thấy lớp mình; HS join qua RPC join_class_by_code. Guest → no-op/[].
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { makeInviteCode, displayScore } from "@synaptek/classroom";
import { classWeekly, type ClassWeekly } from "@/lib/class-weekly";
import { supabase } from "./client";
import { useAuth } from "./auth";

export interface ClassRow {
  id: string;
  name: string;
  inviteCode: string;
  inviteExpiresAt: string | null;
  createdAt: string;
}

export interface RosterEntry {
  studentId: string;
  fullName: string | null;
  joinedAt: string;
}

export interface JoinedClass {
  id: string;
  name: string;
  teacherName: string | null;
  memberCount: number;
}

/** HS: danh sách lớp đang tham gia + tên GV + sĩ số (RLS is_member; 0008 cho đọc tên GV/đếm). */
export function useMyJoinedClasses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["joined-classes", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<JoinedClass[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from("class_members")
        .select("class_id, classes(id, name, owner_teacher_id)")
        .eq("student_id", user.id);
      if (error) throw error;
      type ClassObj = { id: string; name: string; owner_teacher_id: string };
      const rows = (data ?? [])
        .map((r) => {
          const c = r.classes as unknown; // Supabase suy quan hệ là object|array tuỳ ngữ cảnh
          return (Array.isArray(c) ? c[0] : c) as ClassObj | null;
        })
        .filter(Boolean) as ClassObj[];

      const teacherIds = [...new Set(rows.map((c) => c.owner_teacher_id))];
      const names = new Map<string, string | null>();
      if (teacherIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", teacherIds);
        for (const p of profs ?? [])
          names.set(p.id as string, (p.full_name as string | null) ?? null);
      }
      const counts = await Promise.all(
        rows.map((c) => supabase!.rpc("class_member_count", { cid: c.id })),
      );
      return rows.map((c, i) => ({
        id: c.id,
        name: c.name,
        teacherName: names.get(c.owner_teacher_id) ?? null,
        memberCount: (counts[i]?.data as number) ?? 0,
      }));
    },
  });
}

/** Số ngẫu nhiên an toàn cho mã mời (crypto nếu có, fallback Math.random). */
function randomInts(n: number): number[] {
  const out: number[] = [];
  const g = globalThis.crypto;
  if (g?.getRandomValues) {
    const buf = new Uint32Array(n);
    g.getRandomValues(buf);
    for (const v of buf) out.push(v);
  } else {
    for (let i = 0; i < n; i++) out.push(Math.floor(Math.random() * 0xffffffff));
  }
  return out;
}

/** Danh sách lớp của GV hiện tại (RLS: chỉ lớp mình sở hữu/thành viên). */
export function useMyClasses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["classes", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<ClassRow[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, invite_code, invite_expires_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id as string,
        name: r.name as string,
        inviteCode: r.invite_code as string,
        inviteExpiresAt: (r.invite_expires_at as string | null) ?? null,
        createdAt: r.created_at as string,
      }));
    },
  });
}

/** Tạo lớp mới (GV) — sinh mã mời khó đoán. */
export function useCreateClass() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!supabase || !user) return;
      const inviteCode = makeInviteCode(randomInts(6));
      const { error } = await supabase
        .from("classes")
        .insert({ name, owner_teacher_id: user.id, invite_code: inviteCode });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

/** Tạo lại mã mời (thu hồi mã cũ). */
export function useRegenerateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (classId: string) => {
      if (!supabase) return;
      const { error } = await supabase
        .from("classes")
        .update({ invite_code: makeInviteCode(randomInts(6)), invite_expires_at: null })
        .eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classes"] }),
  });
}

/** HS tham gia lớp bằng mã (RPC join_class_by_code). Trả classId; ném khi mã sai/hết hạn. */
export function useJoinClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<string> => {
      if (!supabase) throw new Error("Chưa cấu hình.");
      const { data, error } = await supabase.rpc("join_class_by_code", { code });
      if (error) throw new Error("Mã không đúng hoặc đã hết hạn.");
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["roster"] });
    },
  });
}

/** Danh sách HS trong lớp (GV; RLS owns_class). */
export function useRoster(classId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["roster", classId, user?.id ?? "guest"],
    enabled: Boolean(supabase && user && classId),
    queryFn: async (): Promise<RosterEntry[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from("class_members")
        .select("student_id, joined_at, profiles(full_name)")
        .eq("class_id", classId)
        .order("joined_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        studentId: r.student_id as string,
        fullName:
          ((r.profiles as { full_name?: string | null } | null)?.full_name as string | null) ??
          null,
        joinedAt: r.joined_at as string,
      }));
    },
  });
}

export interface ClassReport {
  assignments: { id: string; title: string }[];
  rows: {
    studentId: string;
    name: string | null;
    scores: Record<string, number | null>; // assignmentId → điểm hiển thị 0..1 (null = chưa nộp)
    average: number | null; // TB các bài ĐÃ nộp
  }[];
}

/** Báo cáo lớp (GV; RLS owns_class): ma trận HS × bài + điểm hiển thị + TB. */
export function useClassReport(classId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["class-report", classId, user?.id ?? "guest"],
    enabled: Boolean(supabase && user && classId),
    queryFn: async (): Promise<ClassReport> => {
      if (!supabase || !user) return { assignments: [], rows: [] };
      const [asg, mem] = await Promise.all([
        supabase
          .from("assignments")
          .select("id, title")
          .eq("class_id", classId)
          .order("created_at", { ascending: true }),
        supabase
          .from("class_members")
          .select("student_id, profiles(full_name)")
          .eq("class_id", classId)
          .order("joined_at", { ascending: true }),
      ]);
      const assignments = (asg.data ?? []).map((a) => ({
        id: a.id as string,
        title: a.title as string,
      }));
      const ids = assignments.map((a) => a.id);
      const subs =
        ids.length > 0
          ? await supabase
              .from("submissions")
              .select("student_id, assignment_id, auto_score, final_score")
              .in("assignment_id", ids)
          : { data: [] };
      const scoreOf = new Map<string, number | null>(); // key `${student}|${asg}`
      for (const r of subs.data ?? []) {
        const auto = r.auto_score === null ? null : Number(r.auto_score);
        const final = r.final_score === null ? null : Number(r.final_score);
        scoreOf.set(`${r.student_id}|${r.assignment_id}`, displayScore(auto, final));
      }
      const rows = (mem.data ?? []).map((m) => {
        const studentId = m.student_id as string;
        const scores: Record<string, number | null> = {};
        const done: number[] = [];
        for (const a of assignments) {
          const sc = scoreOf.get(`${studentId}|${a.id}`) ?? null;
          scores[a.id] = sc;
          if (sc !== null) done.push(sc);
        }
        return {
          studentId,
          name:
            ((m.profiles as { full_name?: string | null } | null)?.full_name as string | null) ??
            null,
          scores,
          average: done.length > 0 ? done.reduce((s, x) => s + x, 0) / done.length : null,
        };
      });
      return { assignments, rows };
    },
  });
}

/** Tóm tắt tuần lớp (GV; RLS owns_class): lượt nộp + độ chính xác + HS hoạt động (7 ngày). */
export function useClassWeekly(classId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["class-weekly", classId, user?.id ?? "guest"],
    enabled: Boolean(supabase && user && classId),
    queryFn: async (): Promise<ClassWeekly> => {
      const empty = classWeekly([], Date.now());
      if (!supabase || !user) return empty;
      const asg = await supabase.from("assignments").select("id").eq("class_id", classId);
      const ids = (asg.data ?? []).map((a) => a.id as string);
      if (ids.length === 0) return empty;
      const subs = await supabase
        .from("submissions")
        .select("student_id, submitted_at, auto_score, final_score")
        .in("assignment_id", ids);
      const rows = (subs.data ?? []).map((s) => ({
        studentId: s.student_id as string,
        submittedAt: (s.submitted_at as string | null) ?? null,
        displayScore: displayScore(
          s.auto_score === null ? null : Number(s.auto_score),
          s.final_score === null ? null : Number(s.final_score),
        ),
      }));
      return classWeekly(rows, Date.now());
    },
  });
}

export interface LeaderRow {
  studentId: string;
  fullName: string | null;
  totalXp: number;
}

/** Bảng xếp hạng lớp (HS; RPC gate is_member) — top XP bạn cùng lớp, đã xếp hạng. */
export function useClassLeaderboard(classId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["class-leaderboard", classId, user?.id ?? "guest"],
    enabled: Boolean(supabase && user && classId),
    queryFn: async (): Promise<LeaderRow[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase.rpc("class_leaderboard", { cid: classId });
      if (error) throw error;
      return (data ?? []).map(
        (r: { student_id: string; full_name: string | null; total_xp: number }) => ({
          studentId: r.student_id,
          fullName: r.full_name,
          totalXp: Number(r.total_xp),
        }),
      );
    },
  });
}

/** Mastery của các HS trong lớp (GV; RLS teaches_student) — cho phân tích điểm yếu lớp (US3). */
export function useClassMastery(classId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["class-mastery", classId, user?.id ?? "guest"],
    enabled: Boolean(supabase && user && classId),
    queryFn: async (): Promise<{ studentId: string; mastery: Map<string, number> }[]> => {
      if (!supabase || !user) return [];
      const { data: members, error: mErr } = await supabase
        .from("class_members")
        .select("student_id")
        .eq("class_id", classId);
      if (mErr) throw mErr;
      const ids = (members ?? []).map((m) => m.student_id as string);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("skill_mastery")
        .select("student_id, skill_id, mastery")
        .in("student_id", ids);
      if (error) throw error;
      const byStudent = new Map<string, Map<string, number>>();
      for (const r of data ?? []) {
        const sid = r.student_id as string;
        const map = byStudent.get(sid) ?? new Map<string, number>();
        map.set(r.skill_id as string, Number(r.mastery));
        byStudent.set(sid, map);
      }
      return [...byStudent.entries()].map(([studentId, mastery]) => ({ studentId, mastery }));
    },
  });
}

/** Xóa HS khỏi lớp (GV). Dữ liệu luyện tập cá nhân của HS giữ nguyên. */
export function useRemoveMember(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) => {
      if (!supabase) return;
      const { error } = await supabase
        .from("class_members")
        .delete()
        .eq("class_id", classId)
        .eq("student_id", studentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roster", classId] }),
  });
}
