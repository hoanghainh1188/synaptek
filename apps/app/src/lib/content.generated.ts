// ⚠️ AUTO-GENERATED bởi scripts/gen-content-manifest.mjs — KHÔNG sửa tay (npm run gen:content).
import type { Grade, Question } from "@synaptek/curriculum";
import type { Badge } from "@synaptek/learning-path";
import cur_0 from "../../../../content/curriculum/grade-1.json";
import cur_1 from "../../../../content/curriculum/grade-2.json";
import cur_2 from "../../../../content/curriculum/grade-3.json";
import cur_3 from "../../../../content/curriculum/grade-4.json";
import q_0 from "../../../../content/questions/g1.num.addsub10.json";
import q_1 from "../../../../content/questions/g2.num.multiplication.json";
import q_2 from "../../../../content/questions/g3.num.muldiv.json";
import q_3 from "../../../../content/questions/g4.geo.perimeter-area.json";
import q_4 from "../../../../content/questions/g4.num.arithmetic.json";
import q_5 from "../../../../content/questions/g4.num.fractions.json";
import badges_0 from "../../../../content/gamification/badges.json";

export const CURRICULA: Grade[] = [cur_0 as Grade, cur_1 as Grade, cur_2 as Grade, cur_3 as Grade];
export const QUESTIONS: Record<string, Question[]> = {
  "g1.num.addsub10": q_0 as Question[],
  "g2.num.multiplication": q_1 as Question[],
  "g3.num.muldiv": q_2 as Question[],
  "g4.geo.perimeter-area": q_3 as Question[],
  "g4.num.arithmetic": q_4 as Question[],
  "g4.num.fractions": q_5 as Question[],
};
export const IMAGES: Record<string, unknown> = {};
export const BADGES: Badge[] = badges_0 as Badge[];
