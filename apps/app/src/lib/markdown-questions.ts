// Parser Markdown → câu hỏi tự soạn (nhập hàng loạt, D-authoring-import). THUẦN (không DOM/React/engine)
// → test được bằng node --experimental-strip-types; tái dùng ở UI xem-trước + lớp AI (sinh ra chính định
// dạng này). Chỉ dựng CẤU TRÚC câu; việc tự-chấm (chạy engine grade) do caller làm sau (giữ tách bạch).
//
// Định dạng (v1 — 6 loại text-friendly):
//   ### <đề bài>            (mỗi câu bắt đầu bằng '### '; đề nằm trên 1 dòng)
//   * [x] lựa chọn đúng     (mcq/multi: dùng * [x] / * [ ] hoặc - [x] / - [ ])
//   * [ ] lựa chọn sai
//   answer: <đáp án>        (numeric/fraction/true-false/fill-blank — không dùng khi có lựa chọn)
//   hint: <gợi ý>           (tùy chọn)
//   explain: <lời giải>     (tùy chọn)
//   type: <ép loại>         (tùy chọn — ghi đè suy luận)
// Điền chỗ trống nhiều ô: ngăn cách đáp án bằng '|' (KHÔNG dùng ',' — vì ',' là dấu thập phân VN,
//   vd "2,5"). Ví dụ:  answer: 3 | 3
// Suy luận loại: có lựa chọn → multi (≥2 dấu x) / mcq; answer true|false|đúng|sai → true-false;
// answer chứa '|' → fill-blank; answer dạng a/b → fraction; còn lại → numeric (dấu phẩy = thập phân VN).

export type MarkdownQuestionType =
  | "mcq"
  | "multi"
  | "numeric"
  | "fraction"
  | "true-false"
  | "fill-blank";

export interface ParsedQuestion {
  type: MarkdownQuestionType;
  prompt: string;
  choices?: string[];
  correct: string; // multi/fill-blank: JSON mảng; mcq: text lựa chọn; còn lại: chuỗi
  explanation?: string;
  hint?: string;
}

export interface ParseIssue {
  index: number; // thứ tự câu (1-based) trong khối
  prompt: string; // đề (để người dùng định vị)
  message: string;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  issues: ParseIssue[];
}

const TYPE_ALIASES: Record<string, MarkdownQuestionType> = {
  mcq: "mcq",
  "trắc nghiệm": "mcq",
  multi: "multi",
  "chọn nhiều": "multi",
  numeric: "numeric",
  số: "numeric",
  fraction: "fraction",
  "phân số": "fraction",
  "true-false": "true-false",
  "đúng/sai": "true-false",
  "đúng sai": "true-false",
  "fill-blank": "fill-blank",
  "điền chỗ trống": "fill-blank",
};

const CHOICE_RE = /^\s*[*-]\s*\[([ xX])\]\s*(.+?)\s*$/;
const META_RE = /^\s*(answer|đáp án|hint|gợi ý|explain|giải thích|type|loại)\s*:\s*(.*)$/i;
const HEADING_RE = /^\s*###\s+(.+?)\s*$/;
const FRACTION_RE = /^-?\d+\s*\/\s*-?\d+$/;

const META_KEY: Record<string, "answer" | "hint" | "explain" | "type"> = {
  answer: "answer",
  "đáp án": "answer",
  hint: "hint",
  "gợi ý": "hint",
  explain: "explain",
  "giải thích": "explain",
  type: "type",
  loại: "type",
};

interface RawBlock {
  prompt: string;
  choices: { checked: boolean; text: string }[];
  answer?: string;
  hint?: string;
  explain?: string;
  typeOverride?: string;
}

/** Tách khối Markdown thành các block thô theo heading '### '. */
function splitBlocks(md: string): RawBlock[] {
  const lines = md.split(/\r?\n/);
  const blocks: RawBlock[] = [];
  let cur: RawBlock | null = null;
  for (const line of lines) {
    const h = line.match(HEADING_RE);
    if (h) {
      if (cur) blocks.push(cur);
      cur = { prompt: h[1], choices: [] };
      continue;
    }
    if (!cur) continue; // bỏ qua nội dung trước heading đầu tiên
    const c = line.match(CHOICE_RE);
    if (c) {
      cur.choices.push({ checked: c[1].toLowerCase() === "x", text: c[2] });
      continue;
    }
    const m = line.match(META_RE);
    if (m) {
      const key = META_KEY[m[1].toLowerCase()];
      const val = m[2].trim();
      if (key === "answer") cur.answer = val;
      else if (key === "hint") cur.hint = val;
      else if (key === "explain") cur.explain = val;
      else if (key === "type") cur.typeOverride = val;
    }
    // dòng khác (trống / rác) → bỏ qua
  }
  if (cur) blocks.push(cur);
  return blocks;
}

/** Suy loại từ block khi không ép type. */
function inferType(b: RawBlock): MarkdownQuestionType | null {
  if (b.choices.length > 0) {
    const checked = b.choices.filter((c) => c.checked).length;
    return checked >= 2 ? "multi" : "mcq";
  }
  const a = (b.answer ?? "").trim();
  if (a === "") return null;
  if (/^(true|false|đúng|sai)$/i.test(a)) return "true-false";
  if (a.includes("|")) return "fill-blank"; // nhiều ô ngăn bằng '|' (không phải ',' — dấu thập phân VN)
  if (FRACTION_RE.test(a)) return "fraction";
  return "numeric";
}

/** Dựng ParsedQuestion + thu lỗi (nếu có) cho một block. */
function buildQuestion(b: RawBlock, index: number, issues: ParseIssue[]): ParsedQuestion | null {
  const push = (message: string) => issues.push({ index, prompt: b.prompt, message });

  const type = (b.typeOverride && TYPE_ALIASES[b.typeOverride.toLowerCase()]) || inferType(b);
  if (!type) {
    push("Thiếu đáp án (answer:) hoặc lựa chọn (* [x]).");
    return null;
  }

  const base = { prompt: b.prompt, explanation: b.explain, hint: b.hint };

  if (type === "mcq" || type === "multi") {
    if (b.choices.length < 2) {
      push("Câu trắc nghiệm cần ít nhất 2 lựa chọn.");
      return null;
    }
    const choices = b.choices.map((c) => c.text);
    const checked = b.choices.filter((c) => c.checked).map((c) => c.text);
    if (checked.length === 0) {
      push("Chưa đánh dấu lựa chọn đúng (dùng * [x]).");
      return null;
    }
    if (type === "mcq" && checked.length > 1) {
      push("Câu 1 đáp án nhưng đánh dấu nhiều lựa chọn — dùng 'type: multi' nếu muốn chọn nhiều.");
      return null;
    }
    return {
      ...base,
      type,
      choices,
      correct: type === "mcq" ? checked[0] : JSON.stringify(checked),
    };
  }

  const a = (b.answer ?? "").trim();
  if (a === "") {
    push("Thiếu đáp án (answer:).");
    return null;
  }
  if (type === "true-false") {
    const v = /^(true|đúng)$/i.test(a) ? "true" : "false";
    return { ...base, type, correct: v };
  }
  if (type === "fill-blank") {
    const parts = a
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s !== "");
    if (parts.length === 0) {
      push("Đáp án điền chỗ trống rỗng.");
      return null;
    }
    return { ...base, type, correct: JSON.stringify(parts) };
  }
  // numeric | fraction
  return { ...base, type, correct: a };
}

/** Parse khối Markdown → danh sách câu + lỗi từng câu. Không ném lỗi; lỗi trả trong `issues`. */
export function parseQuestionsMarkdown(md: string): ParseResult {
  const blocks = splitBlocks(md ?? "");
  const questions: ParsedQuestion[] = [];
  const issues: ParseIssue[] = [];
  blocks.forEach((b, i) => {
    const index = i + 1;
    if (b.prompt.trim() === "") {
      issues.push({ index, prompt: "", message: "Đề bài rỗng." });
      return;
    }
    const q = buildQuestion(b, index, issues);
    if (q) questions.push(q);
  });
  return { questions, issues };
}
