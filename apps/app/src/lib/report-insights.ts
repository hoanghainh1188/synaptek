// Insight cho GV từ báo cáo lớp (HS × bài) — THUẦN, test được. KHÔNG truy vấn mới.
export interface ReportRow {
  studentId: string;
  name: string | null;
  scores: Record<string, number | null>; // assignmentId → điểm 0..1 (null = chưa nộp)
  average: number | null;
}
export interface ReportLike {
  assignments: { id: string; title: string }[];
  rows: ReportRow[];
}

export interface AtRisk {
  studentId: string;
  name: string | null;
  average: number | null; // TB bài đã nộp
  submittedRatio: number; // tỉ lệ bài đã nộp
  reason: "low-score" | "missing" | "both";
}

const LOW_SCORE = 0.5; // TB < 50% → yếu
const LOW_SUBMIT = 0.5; // nộp < 50% số bài → bỏ nhiều

/** HS cần chú ý: điểm TB thấp HOẶC bỏ nhiều bài. Sắp xếp rủi ro cao trước. */
export function atRiskStudents(report: ReportLike): AtRisk[] {
  const total = report.assignments.length;
  if (total === 0) return [];
  const out: AtRisk[] = [];
  for (const r of report.rows) {
    const submitted = report.assignments.filter((a) => r.scores[a.id] != null).length;
    const ratio = submitted / total;
    const low = r.average != null && r.average < LOW_SCORE;
    const missing = ratio < LOW_SUBMIT;
    if (!low && !missing) continue;
    out.push({
      studentId: r.studentId,
      name: r.name,
      average: r.average,
      submittedRatio: ratio,
      reason: low && missing ? "both" : low ? "low-score" : "missing",
    });
  }
  // rủi ro cao trước: TB thấp nhất (null coi như 0) rồi nộp ít nhất
  return out.sort(
    (a, b) => (a.average ?? 0) - (b.average ?? 0) || a.submittedRatio - b.submittedRatio,
  );
}

export interface TrendPoint {
  id: string;
  title: string;
  avg: number | null; // điểm TB lớp của bài (null nếu chưa ai nộp)
  n: number; // số HS đã nộp
}

/** Xu hướng điểm TB lớp theo từng bài (thứ tự như report.assignments — đã theo thời gian tạo). */
export function classTrend(report: ReportLike): TrendPoint[] {
  return report.assignments.map((a) => {
    const vals = report.rows.map((r) => r.scores[a.id]).filter((v): v is number => v != null);
    const avg = vals.length > 0 ? vals.reduce((s, x) => s + x, 0) / vals.length : null;
    return { id: a.id, title: a.title, avg, n: vals.length };
  });
}
