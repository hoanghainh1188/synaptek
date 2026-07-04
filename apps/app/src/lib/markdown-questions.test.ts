import assert from "node:assert";
import { parseQuestionsMarkdown } from "./markdown-questions.ts";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    throw e;
  }
}

console.log("Markdown Questions Parser Tests\n");

const one = (md: string) => {
  const r = parseQuestionsMarkdown(md);
  return { q: r.questions[0], r };
};

test("numeric: suy loại từ answer số", () => {
  const { q } = one("### Tính 2 + 3\nanswer: 5");
  assert.equal(q.type, "numeric");
  assert.equal(q.prompt, "Tính 2 + 3");
  assert.equal(q.correct, "5");
});

test("numeric: đáp án âm + phẩy VN giữ nguyên", () => {
  const { q } = one("### Số đối của 2,5\nanswer: -2,5");
  assert.equal(q.type, "numeric");
  assert.equal(q.correct, "-2,5");
});

test("fraction: answer dạng a/b", () => {
  const { q } = one("### Rút gọn 6/8\nanswer: 3/4");
  assert.equal(q.type, "fraction");
  assert.equal(q.correct, "3/4");
});

test("fraction: phân số âm", () => {
  const { q } = one("### Rút gọn -4/6\nanswer: -2/3");
  assert.equal(q.type, "fraction");
  assert.equal(q.correct, "-2/3");
});

test("true-false: true/false", () => {
  assert.equal(one("### X\nanswer: true").q.correct, "true");
  assert.equal(one("### X\nanswer: false").q.correct, "false");
});

test("true-false: đúng/sai tiếng Việt", () => {
  assert.equal(one("### X\nanswer: Đúng").q.type, "true-false");
  assert.equal(one("### X\nanswer: Đúng").q.correct, "true");
  assert.equal(one("### X\nanswer: sai").q.correct, "false");
});

test("mcq: một [x] → correct là text lựa chọn", () => {
  const { q } = one("### Số nào lớn hơn?\n* [x] -3\n* [ ] -8");
  assert.equal(q.type, "mcq");
  assert.deepEqual(q.choices, ["-3", "-8"]);
  assert.equal(q.correct, "-3");
});

test("mcq: chấp nhận '- [x]' (dấu gạch)", () => {
  const { q } = one("### Chọn\n- [x] A\n- [ ] B");
  assert.equal(q.type, "mcq");
  assert.equal(q.correct, "A");
});

test("multi: nhiều [x] → correct là JSON mảng", () => {
  const { q } = one("### Chọn các số chẵn\n* [x] 2\n* [x] 4\n* [ ] 3");
  assert.equal(q.type, "multi");
  assert.deepEqual(JSON.parse(q.correct), ["2", "4"]);
});

test("fill-blank: answer nhiều ô ngăn bằng '|' → JSON mảng", () => {
  const { q } = one("### 2 + __ = 5 và 10 - __ = 7\nanswer: 3 | 3");
  assert.equal(q.type, "fill-blank");
  assert.deepEqual(JSON.parse(q.correct), ["3", "3"]);
});

test("số thập phân VN (phẩy) KHÔNG bị nhận nhầm fill-blank", () => {
  const { q } = one("### Tính 1,2 + 1,3\nanswer: 2,5");
  assert.equal(q.type, "numeric");
  assert.equal(q.correct, "2,5");
});

test("hint + explain được đọc", () => {
  const { q } = one("### X\nanswer: 5\nhint: Nhẩm đi\nexplain: Vì 2+3=5");
  assert.equal(q.hint, "Nhẩm đi");
  assert.equal(q.explanation, "Vì 2+3=5");
});

test("type override: ép fraction dù trông như số", () => {
  const { q } = one("### X\ntype: fraction\nanswer: 2");
  assert.equal(q.type, "fraction");
});

test("nhiều câu trong một khối", () => {
  const md = "### C1\nanswer: 1\n\n### C2\n* [x] A\n* [ ] B\n\n### C3\nanswer: đúng";
  const r = parseQuestionsMarkdown(md);
  assert.equal(r.questions.length, 3);
  assert.equal(r.questions[0].type, "numeric");
  assert.equal(r.questions[1].type, "mcq");
  assert.equal(r.questions[2].type, "true-false");
});

test("lỗi: thiếu đáp án/lựa chọn", () => {
  const r = parseQuestionsMarkdown("### Câu không đáp án");
  assert.equal(r.questions.length, 0);
  assert.equal(r.issues.length, 1);
  assert.match(r.issues[0].message, /Thiếu đáp án/);
});

test("lỗi: mcq chưa đánh dấu đúng", () => {
  const r = parseQuestionsMarkdown("### X\n* [ ] A\n* [ ] B");
  assert.equal(r.questions.length, 0);
  assert.match(r.issues[0].message, /Chưa đánh dấu/);
});

test("lỗi: mcq đánh dấu nhiều nhưng không ép multi", () => {
  const r = parseQuestionsMarkdown("### X\n* [x] A\n* [x] B");
  // suy luận sẽ thành multi (≥2 x) → hợp lệ, KHÔNG lỗi
  assert.equal(r.questions.length, 1);
  assert.equal(r.questions[0].type, "multi");
});

test("lỗi: ép mcq nhưng nhiều [x] → báo lỗi", () => {
  const r = parseQuestionsMarkdown("### X\ntype: mcq\n* [x] A\n* [x] B");
  assert.equal(r.questions.length, 0);
  assert.match(r.issues[0].message, /nhiều lựa chọn/);
});

test("bỏ qua nội dung trước heading đầu tiên", () => {
  const r = parseQuestionsMarkdown("rác đầu file\n### X\nanswer: 5");
  assert.equal(r.questions.length, 1);
  assert.equal(r.questions[0].correct, "5");
});

test("khối rỗng → không câu, không lỗi", () => {
  const r = parseQuestionsMarkdown("");
  assert.equal(r.questions.length, 0);
  assert.equal(r.issues.length, 0);
});

console.log(`\n${passed} tests passed`);
