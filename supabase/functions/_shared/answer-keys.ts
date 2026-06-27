// ⚠️ AUTO-GENERATED từ content/questions/*.json — KHÔNG sửa tay (npm run sync:edge). Đáp án chấm server (D4/D6/D13).
import type { QuestionType } from "./grading-engine.ts";
export interface AnswerKey {
  type: QuestionType;
  correct: string | string[];
  tolerance?: number;
}
export const ANSWER_KEYS: Record<string, AnswerKey> = {
  "g1.num.addsub.q001": {
    type: "numeric",
    correct: "5",
  },
  "g1.num.addsub.q002": {
    type: "numeric",
    correct: "3",
  },
  "g1.num.addsub.q003": {
    type: "mcq",
    correct: "9",
  },
  "g2.num.mult.q001": {
    type: "numeric",
    correct: "6",
  },
  "g2.num.mult.q002": {
    type: "mcq",
    correct: "20",
  },
  "g2.num.mult.q003": {
    type: "numeric",
    correct: "25",
  },
  "g2.num.mult.q004": {
    type: "true-false",
    correct: "true",
  },
  "g3.num.muldiv.q001": {
    type: "numeric",
    correct: "42",
  },
  "g3.num.muldiv.q002": {
    type: "numeric",
    correct: "4",
  },
  "g3.num.muldiv.q003": {
    type: "mcq",
    correct: "32",
  },
  "g4.geo.area.q001": {
    type: "numeric",
    correct: "15",
  },
  "g4.geo.perimeter.q001": {
    type: "numeric",
    correct: "16",
  },
  "g4.geo.area.q002": {
    type: "mcq",
    correct: "16 cm²",
  },
  "g4.num.fractions.q001": {
    type: "mcq",
    correct: "1/2",
  },
  "g4.num.fractions.q002": {
    type: "true-false",
    correct: "true",
  },
  "g4.num.fractions.q003": {
    type: "numeric",
    correct: "0.5",
  },
  "g4.num.fractions.q004": {
    type: "fraction",
    correct: "1/2",
  },
  "g4.num.fractions.q005": {
    type: "fraction",
    correct: "1/2",
  },
  "g4.num.fractions.q006": {
    type: "fill-blank",
    correct: ["1", "1/2"],
  },
  "g4.num.fractions.q007": {
    type: "mcq",
    correct: "2/4",
  },
  "g4.num.fractions.q008": {
    type: "true-false",
    correct: "false",
  },
};
