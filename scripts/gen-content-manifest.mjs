// Sinh manifest nội dung cho app (auto-discovery) — vì Metro KHÔNG require động theo chuỗi.
// Quét content/ → emit apps/app/src/lib/content.generated.ts với import tĩnh JSON + ảnh.
// Chạy: npm run gen:content
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const C = join(ROOT, "content");
const REL = "../../../../content"; // từ apps/app/src/lib → repo root/content

const ls = (sub, re) => {
  try {
    return readdirSync(join(C, sub))
      .filter((f) => re.test(f))
      .sort();
  } catch {
    return [];
  }
};

const curricula = ls("curriculum", /\.json$/);
const questions = ls("questions", /\.json$/);
const images = ls("images", /\.(png|jpe?g|webp|gif)$/i);

const L = [
  "// ⚠️ AUTO-GENERATED bởi scripts/gen-content-manifest.mjs — KHÔNG sửa tay (npm run gen:content).",
  'import type { Grade, Question } from "@synaptek/curriculum";',
];

const curVars = curricula.map((f, i) => {
  L.push(`import cur_${i} from "${REL}/curriculum/${f}";`);
  return `cur_${i}`;
});
const qEntries = questions.map((f, i) => {
  L.push(`import q_${i} from "${REL}/questions/${f}";`);
  return { topic: f.replace(/\.json$/, ""), v: `q_${i}` };
});
const imgEntries = images.map((f, i) => {
  L.push(`import img_${i} from "${REL}/images/${f}";`);
  return { key: f.replace(/\.[^.]+$/, ""), v: `img_${i}` };
});

// Xuất object dạng prettier-clean (rỗng → "{}"; có phần tử → block nhiều dòng).
const objBlock = (decl, rows) => {
  if (rows.length === 0) L.push(`${decl} = {};`);
  else L.push(`${decl} = {`, ...rows, "};");
};

L.push("");
L.push(`export const CURRICULA: Grade[] = [${curVars.map((v) => `${v} as Grade`).join(", ")}];`);
objBlock(
  "export const QUESTIONS: Record<string, Question[]>",
  qEntries.map(({ topic, v }) => `  ${JSON.stringify(topic)}: ${v} as Question[],`),
);
objBlock(
  "export const IMAGES: Record<string, unknown>",
  imgEntries.map(({ key, v }) => `  ${JSON.stringify(key)}: ${v},`),
);
L.push("");

const out = join(ROOT, "apps/app/src/lib/content.generated.ts");
writeFileSync(out, L.join("\n"));
console.log(
  `generated content.generated.ts: ${curricula.length} curriculum, ${questions.length} question files, ${images.length} images`,
);
