import assert from "node:assert/strict";
import { test } from "node:test";
import { SUBJECTS, subjectLabel, subjectEmoji, DEFAULT_SUBJECT } from "./subjects.ts";

test("subjectLabel/Emoji: key hợp lệ; null/sai → Toán mặc định", () => {
  assert.equal(subjectLabel("english"), "Tiếng Anh");
  assert.equal(subjectLabel(null), "Toán");
  assert.equal(subjectLabel("xx"), "Toán");
  assert.equal(subjectEmoji("science"), "🔬");
  assert.equal(subjectEmoji(undefined), subjectEmoji(DEFAULT_SUBJECT));
});

test("có ít nhất 4 môn, math là mặc định", () => {
  assert.ok(SUBJECTS.length >= 4);
  assert.equal(SUBJECTS[0].key, DEFAULT_SUBJECT);
});
