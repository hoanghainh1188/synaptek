// Câu hỏi tự soạn (authoring, D28): GV/PH tạo câu riêng (mcq/numeric/fraction) để giao.
// Tác giả CRUD câu của mình (RLS); HS chỉ lấy prompt+choices qua RPC (ẩn đáp án — chấm ở Edge, D4).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Question } from "@synaptek/curriculum";
import { supabase } from "./client";
import { useAuth } from "./auth";

export type CustomType =
  | "mcq"
  | "numeric"
  | "fraction"
  | "true-false"
  | "expression"
  | "fill-blank";

export interface CustomQuestion {
  id: string;
  type: CustomType;
  prompt: string;
  choices: string[] | null;
  correct: string;
  explanation: string | null;
  imageUrl: string | null;
}

export interface NewCustomQuestion {
  type: CustomType;
  prompt: string;
  choices?: string[] | null;
  correct: string;
  explanation?: string | null;
  imageUrl?: string | null;
}

/** Upload ảnh câu hỏi lên Storage (bucket public 'question-images', thư mục theo uid) → trả public URL. */
export async function uploadQuestionImage(file: File, userId: string): Promise<string> {
  if (!supabase) throw new Error("Chưa cấu hình Supabase.");
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${Date.now()}-${Math.round(file.size)}.${ext}`;
  const { error } = await supabase.storage
    .from("question-images")
    .upload(path, file, { contentType: file.type || "image/png" });
  if (error) throw error;
  return supabase.storage.from("question-images").getPublicUrl(path).data.publicUrl;
}

/** Danh sách câu tự soạn của người dùng hiện tại (tác giả — gồm đáp án để sửa). */
export function useMyCustomQuestions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["custom-questions", user?.id ?? "guest"],
    enabled: Boolean(supabase && user),
    queryFn: async (): Promise<CustomQuestion[]> => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase
        .from("custom_questions")
        .select("id, type, prompt, choices, correct, explanation, image_url")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id as string,
        type: r.type as CustomType,
        prompt: r.prompt as string,
        choices: (r.choices as string[] | null) ?? null,
        correct: r.correct as string,
        explanation: (r.explanation as string | null) ?? null,
        imageUrl: (r.image_url as string | null) ?? null,
      }));
    },
  });
}

/** Tạo câu tự soạn. */
export function useCreateCustomQuestion() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (q: NewCustomQuestion) => {
      if (!supabase || !user) return;
      const { error } = await supabase.from("custom_questions").insert({
        author_id: user.id,
        type: q.type,
        prompt: q.prompt,
        choices: q.type === "mcq" ? (q.choices ?? []) : null,
        correct: q.correct,
        explanation: q.explanation ?? null,
        image_url: q.imageUrl ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-questions"] }),
  });
}

/** Sửa câu tự soạn (RLS author-owns). */
export function useUpdateCustomQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (q: NewCustomQuestion & { id: string }) => {
      if (!supabase) return;
      const { error } = await supabase
        .from("custom_questions")
        .update({
          type: q.type,
          prompt: q.prompt,
          choices: q.type === "mcq" ? (q.choices ?? []) : null,
          correct: q.correct,
          explanation: q.explanation ?? null,
          image_url: q.imageUrl ?? null,
        })
        .eq("id", q.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-questions"] }),
  });
}

/** Xoá câu tự soạn (RLS author-owns). */
export function useDeleteCustomQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) return;
      const { error } = await supabase.from("custom_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-questions"] }),
  });
}

/** HS: lấy câu tự soạn đã được giao (prompt+choices, KHÔNG đáp án) → map sang Question để render. */
export function useStudentCustomQuestions(ids: string[]) {
  const { user } = useAuth();
  const key = [...ids].sort().join(",");
  return useQuery({
    queryKey: ["custom-q-student", key, user?.id ?? "guest"],
    enabled: Boolean(supabase && user && ids.length > 0),
    queryFn: async (): Promise<Question[]> => {
      if (!supabase || !user || ids.length === 0) return [];
      const { data, error } = await supabase.rpc("custom_questions_for_student", { ids });
      if (error) throw error;
      return (data ?? []).map(
        (r: {
          id: string;
          type: CustomType;
          prompt: string;
          choices: string[] | null;
          image_url: string | null;
        }): Question => ({
          id: r.id,
          skillId: "custom",
          grade: 0,
          type: r.type,
          prompt: r.prompt,
          choices: r.choices ?? undefined,
          correct: "", // đáp án ẩn — không gửi cho HS (chấm ở Edge)
          explanation: "", // giải thích ẩn với HS khi làm bài
          image: r.image_url ? { src: r.image_url, alt: "Ảnh câu hỏi" } : undefined,
        }),
      );
    },
  });
}
