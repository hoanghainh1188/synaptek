# @synaptek/curriculum

**Schema authority** cho nội dung Synaptek — TS thuần, zero-dep (mirror `@synaptek/grading-engine`).
Định nghĩa cây chương trình (Grade → Strand → Topic → Skill) + Question, và `validate*()` / traversal.

Nội dung là JSON versioned trong `content/` (D6); package này là **nơi định nghĩa types + luật
validate** mà content pipeline (D14) phải tuân. Schema đầy đủ: `specs/001-m1-practice-loop/contracts/content-schema.md`.

## API

```ts
import {
  validateCurriculum,
  validateQuestion,
  topicsByGrade,
  allTopics,
  questionsForTopic,
  buildSession,
  type Grade,
  type Question,
  type Topic,
} from "@synaptek/curriculum";
```

- `validateCurriculum(grade)` / `validateQuestion(q, knownSkillIds?)` → `ValidationError[]` (rỗng = hợp lệ).
- `topicsByGrade(curricula, grade)` · `questionsForTopic(questions, topic)` (lọc theo skillId).
- `buildSession(questions, { count=10, shuffleSeed? })` — xáo trộn tất định (test lặp lại được).

`Question.type`/`correct` **trùng** `GradeInput` của `@synaptek/grading-engine` → chấm không cần adapter.

## Test

```bash
npm test --workspace @synaptek/curriculum   # node --experimental-strip-types (12/12); cũng validate content seed
```
