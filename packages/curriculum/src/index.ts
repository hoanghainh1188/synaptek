// @synaptek/curriculum — schema authority cho nội dung Synaptek.
export * from "./types.ts";
export { validateCurriculum, validateQuestion } from "./schema.ts";
export {
  topicsByGrade,
  allTopics,
  questionsForTopic,
  buildSession,
  subjectsOf,
  gradeSubject,
} from "./select.ts";
