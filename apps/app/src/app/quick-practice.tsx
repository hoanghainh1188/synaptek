// Luyện nhanh — 1 chạm: trộn câu từ kỹ năng ĐẾN HẠN + ĐIỂM YẾU (lộ trình) thành 1 phiên ngắn.
// Tái dùng buildPath (như home) + buildQuickSet + SessionRunner.
import { useMemo } from "react";
import type { Question } from "@synaptek/curriculum";
import {
  allGrades,
  getQuestionById,
  questionsForSkill,
  skillOfQuestion,
  skillsWithQuestions,
} from "@/lib/content";
import { buildMasteryMap, toSkillAttempts } from "@/lib/mastery";
import { buildPath, buildSkillNodes } from "@/lib/path";
import { buildQuickSet } from "@/lib/quick-set";
import { useAttempts } from "@/lib/supabase/attempts";
import { useSkillMastery } from "@/lib/supabase/mastery";
import { SessionRunner } from "@/components/practice/SessionRunner";

const QUICK_CAP = 10;

export default function QuickPractice() {
  const attemptsQ = useAttempts();
  const masteryQ = useSkillMastery();

  const ready = Boolean(attemptsQ.data) && masteryQ.isFetched;

  const questions = useMemo(() => {
    const mastery = buildMasteryMap(toSkillAttempts(attemptsQ.data ?? [], skillOfQuestion));
    const dueAt = new Map<string, number>();
    for (const r of masteryQ.data ?? []) if (r.dueAt) dueAt.set(r.skillId, Date.parse(r.dueAt));
    const nodes = buildSkillNodes(allGrades(), skillsWithQuestions());
    const path = buildPath(nodes, mastery, { now: Date.now(), dueAt, limit: 8 });
    const recoSkills = [...path.due, ...path.next].map((n) => n.skillId);
    const perSkill = recoSkills.map((s) => questionsForSkill(s).map((q) => q.id));
    const ids = buildQuickSet(perSkill, QUICK_CAP);
    return ids.map((id) => getQuestionById(id)).filter(Boolean) as Question[];
  }, [attemptsQ.data, masteryQ.data]);

  return (
    <SessionRunner
      sessionId="quick-practice"
      label="Luyện nhanh"
      title="Luyện nhanh"
      questions={questions}
      ready={ready}
      emptyText="Chưa có gợi ý — hãy luyện một chủ đề bất kỳ để hệ thống hiểu em hơn nhé!"
      loginText="Đăng nhập để luyện nhanh theo điểm yếu của em nhé!"
    />
  );
}
