// Lớp học GV (M3 US1): tạo/liệt kê lớp + mã mời (qua @synaptek/classroom), tham gia (RPC), roster, xóa HS.
// RLS bảo đảm GV chỉ thấy lớp mình; HS join qua RPC join_class_by_code. Guest → no-op/[].
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { makeInviteCode } from "@synaptek/classroom";
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
