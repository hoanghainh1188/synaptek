// Câu "nhiều phần" (a/b/c…, D43) — soạn thảo từng phần con phía client. THUẦN, test được.
// Phạm vi PR đầu: 9 loại đơn giản (KHÔNG derivation/compound — tránh lồng 2 tầng chấm).
import { packMatching, unpackMatching } from "./matching.ts";

export const COMPOUND_PART_TYPES = [
  "mcq",
  "numeric",
  "fraction",
  "true-false",
  "expression",
  "fill-blank",
  "multi",
  "ordering",
  "matching",
] as const;

export type CompoundPartType = (typeof COMPOUND_PART_TYPES)[number];

/** Bản soạn 1 phần con (state phía form) — không phân biệt kiểu, giữ đủ trường cho mọi loại. */
export interface PartDraft {
  type: CompoundPartType;
  prompt: string;
  /** choices (mcq/multi) · mục (ordering) · vế trái (matching) · đáp án ô (fill-blank). */
  items: string[];
  /** vế phải — CHỈ dùng cho matching. */
  rights: string[];
  /** đáp án đơn (mcq/true-false/numeric/fraction/expression); multi = JSON mảng chọn. */
  correct: string;
}

export function emptyPart(): PartDraft {
  return { type: "numeric", prompt: "", items: ["", ""], rights: ["", ""], correct: "" };
}

/** Phần con hợp lệ chưa? (theo từng loại, giống logic soạn câu đơn). */
export function partValid(p: PartDraft): boolean {
  if (p.prompt.trim().length === 0) return false;
  const opts = p.items.map((c) => c.trim()).filter(Boolean);
  switch (p.type) {
    case "mcq":
      return opts.length >= 2 && opts.includes(p.correct.trim());
    case "multi": {
      const set = parseJsonArray(p.correct);
      return opts.length >= 2 && set.length >= 1 && set.every((x) => opts.includes(x));
    }
    case "ordering":
      return opts.length >= 2;
    case "matching": {
      const pairs = p.items.filter((l, i) => l.trim() && (p.rights[i] ?? "").trim());
      return pairs.length >= 2;
    }
    case "fill-blank": {
      const n = (p.prompt.match(/_{2,}/g) ?? []).length;
      return n >= 1 && opts.length === n;
    }
    case "true-false":
      return p.correct === "true" || p.correct === "false";
    default: // numeric | fraction | expression
      return p.correct.trim().length > 0;
  }
}

function parseJsonArray(raw: string): string[] {
  try {
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}

/** Xáo trộn khác thứ tự gốc (Fisher-Yates, thử tối đa 5 lần) — chống lộ đáp án ở ordering/matching. */
function shuffleDiff(arr: string[]): string[] {
  if (arr.length < 2) return arr;
  for (let tries = 0; tries < 5; tries++) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (a.some((x, i) => x !== arr[i])) return a;
  }
  return [...arr].reverse();
}

/** Spec HIỂN THỊ 1 phần (HS thấy) — vào `choices` (mảng JSON) của câu compound. */
export interface PartDisplay {
  type: CompoundPartType;
  prompt: string;
  choices?: string[];
}

/** Đáp án ẨN 1 phần (server chấm qua gradeCompound) — vào `correct` (mảng JSON) của câu compound. */
export interface PartAnswerKey {
  type: CompoundPartType;
  correct: string | string[];
}

/** Từ 1 phần đã soạn (đã valid) → {display, answer}. Ordering/matching xáo bản HIỂN THỊ, giữ đáp án đúng thứ tự gốc. */
export function buildPart(p: PartDraft): { display: PartDisplay; answer: PartAnswerKey } {
  const opts = p.items.map((c) => c.trim()).filter(Boolean);
  if (p.type === "mcq") {
    return {
      display: { type: p.type, prompt: p.prompt, choices: opts },
      answer: { type: p.type, correct: p.correct.trim() },
    };
  }
  if (p.type === "multi") {
    return {
      display: { type: p.type, prompt: p.prompt, choices: opts },
      answer: { type: p.type, correct: parseJsonArray(p.correct) },
    };
  }
  if (p.type === "ordering") {
    return {
      display: { type: p.type, prompt: p.prompt, choices: shuffleDiff(opts) },
      answer: { type: p.type, correct: opts },
    };
  }
  if (p.type === "matching") {
    const pairs = p.items
      .map((l, i) => ({ left: l.trim(), right: (p.rights[i] ?? "").trim() }))
      .filter((x) => x.left && x.right);
    const lefts = pairs.map((x) => x.left);
    const rights = pairs.map((x) => x.right);
    return {
      display: {
        type: p.type,
        prompt: p.prompt,
        choices: packMatching(lefts, shuffleDiff(rights)),
      },
      answer: { type: p.type, correct: rights },
    };
  }
  if (p.type === "fill-blank") {
    return {
      display: { type: p.type, prompt: p.prompt },
      answer: { type: p.type, correct: opts },
    };
  }
  if (p.type === "true-false") {
    return {
      display: { type: p.type, prompt: p.prompt },
      answer: { type: p.type, correct: p.correct },
    };
  }
  // numeric | fraction | expression
  return {
    display: { type: p.type, prompt: p.prompt },
    answer: { type: p.type, correct: p.correct.trim() },
  };
}

/** Đóng gói TOÀN BỘ câu nhiều phần → {choices, correct} lưu ở custom_questions. */
export function buildCompoundPayload(parts: PartDraft[]): { choices: string[]; correct: string } {
  const built = parts.map(buildPart);
  return {
    choices: built.map((b) => JSON.stringify(b.display)),
    correct: JSON.stringify(built.map((b) => b.answer)),
  };
}

/** Giá trị mặc định cho đáp án 1 phần (HS chưa làm) — theo loại (mảng cho loại nhiều-phần-tử). */
export function defaultPartAnswer(type: CompoundPartType): string | string[] {
  return type === "fill-blank" || type === "multi" || type === "ordering" || type === "matching"
    ? []
    : "";
}

/** Nạp lại câu compound đã lưu (choices+correct của TÁC GIẢ) → PartDraft[] để sửa. */
export function decodeCompound(choices: string[] | null, correctJson: string): PartDraft[] {
  let answers: PartAnswerKey[] = [];
  try {
    const a = JSON.parse(correctJson);
    if (Array.isArray(a)) answers = a;
  } catch {
    /* correct hỏng → coi như rỗng */
  }
  const displays = (choices ?? []).map((c): PartDisplay | null => {
    try {
      return JSON.parse(c) as PartDisplay;
    } catch {
      return null;
    }
  });
  return displays.map((d, i): PartDraft => {
    const type: CompoundPartType = d?.type ?? "numeric";
    const ans = answers[i];
    if (type === "matching") {
      const { lefts } = unpackMatching(d?.choices);
      const rights = Array.isArray(ans?.correct) ? ans.correct.map(String) : [];
      return {
        type,
        prompt: d?.prompt ?? "",
        items: lefts.length ? lefts : ["", ""],
        rights: rights.length ? rights : ["", ""],
        correct: "",
      };
    }
    if (type === "ordering") {
      const order = Array.isArray(ans?.correct) ? ans.correct.map(String) : (d?.choices ?? []);
      return {
        type,
        prompt: d?.prompt ?? "",
        items: order.length ? order : ["", ""],
        rights: ["", ""],
        correct: "",
      };
    }
    if (type === "fill-blank") {
      const items = Array.isArray(ans?.correct) ? ans.correct.map(String) : [];
      return {
        type,
        prompt: d?.prompt ?? "",
        items: items.length ? items : ["", ""],
        rights: ["", ""],
        correct: "",
      };
    }
    if (type === "mcq" || type === "multi") {
      return {
        type,
        prompt: d?.prompt ?? "",
        items: d?.choices?.length ? d.choices : ["", ""],
        rights: ["", ""],
        correct: type === "multi" ? JSON.stringify(ans?.correct ?? []) : String(ans?.correct ?? ""),
      };
    }
    // true-false | numeric | fraction | expression
    return {
      type,
      prompt: d?.prompt ?? "",
      items: ["", ""],
      rights: ["", ""],
      correct: String(ans?.correct ?? ""),
    };
  });
}
