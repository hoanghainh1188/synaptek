// Xuất báo cáo lớp ra CSV — THUẦN, test được. Điểm hiển thị 0..1 → phần trăm nguyên; chưa nộp = rỗng.
export interface CsvReport {
  assignments: { id: string; title: string }[];
  rows: { name: string | null; scores: Record<string, number | null>; average: number | null }[];
}

function esc(s: string): string {
  return `"${s.replace(/"/g, '""')}"`; // bọc nháy + escape để an toàn dấu phẩy/xuống dòng trong tiêu đề
}

function pct(v: number | null): string {
  return v === null ? "" : String(Math.round(v * 100));
}

/** Ma trận HS × bài → CSV (UTF-8). Hàng đầu: Học sinh, [tên bài...], Trung bình. */
export function reportToCsv(r: CsvReport): string {
  const header = ["Học sinh", ...r.assignments.map((a) => a.title), "Trung bình (%)"];
  const lines = r.rows.map((row) => [
    row.name ?? "(chưa đặt tên)",
    ...r.assignments.map((a) => pct(row.scores[a.id] ?? null)),
    pct(row.average),
  ]);
  return [header, ...lines].map((cols) => cols.map(esc).join(",")).join("\n");
}
