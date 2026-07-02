import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emptyPart,
  partValid,
  buildPart,
  buildCompoundPayload,
  decodeCompound,
  defaultPartAnswer,
  type PartDraft,
} from "./compound-parts.ts";

test("emptyPart → chưa hợp lệ (thiếu đề)", () => {
  assert.equal(partValid(emptyPart()), false);
});

test("partValid: mcq cần ≥2 lựa chọn + đáp án nằm trong lựa chọn", () => {
  const p: PartDraft = {
    ...emptyPart(),
    type: "mcq",
    prompt: "1+1=?",
    items: ["1", "2"],
    correct: "2",
  };
  assert.equal(partValid(p), true);
  assert.equal(partValid({ ...p, correct: "3" }), false);
});

test("partValid: multi cần tập con hợp lệ", () => {
  const p: PartDraft = {
    ...emptyPart(),
    type: "multi",
    prompt: "chọn số chẵn",
    items: ["2", "3", "4"],
    correct: JSON.stringify(["2", "4"]),
  };
  assert.equal(partValid(p), true);
  assert.equal(partValid({ ...p, correct: JSON.stringify(["2", "5"]) }), false);
});

test("partValid: fill-blank cần đúng số ô = số __ trong đề", () => {
  const p: PartDraft = {
    ...emptyPart(),
    type: "fill-blank",
    prompt: "2+2=__",
    items: ["4"],
  };
  assert.equal(partValid(p), true);
  assert.equal(partValid({ ...p, items: ["4", "5"] }), false);
});

test("partValid: matching cần ≥2 cặp đầy đủ trái-phải", () => {
  const p: PartDraft = {
    ...emptyPart(),
    type: "matching",
    prompt: "nối",
    items: ["2+2", "3+3"],
    rights: ["4", "6"],
  };
  assert.equal(partValid(p), true);
  assert.equal(partValid({ ...p, rights: ["4", ""] }), false);
});

test("partValid: derivation cần đề + đích (expression) hoặc biến (equation)", () => {
  const expr: PartDraft = {
    ...emptyPart(),
    type: "derivation",
    prompt: "Rút gọn",
    derivMode: "expression",
    derivStart: "2(x+2)",
    derivTarget: "2x+4",
  };
  assert.equal(partValid(expr), true);
  assert.equal(partValid({ ...expr, derivTarget: "" }), false);

  const eq: PartDraft = {
    ...emptyPart(),
    type: "derivation",
    prompt: "Giải PT",
    derivMode: "equation",
    derivStart: "2x + 3 = 7",
    derivVar: "x",
  };
  assert.equal(partValid(eq), true);
  assert.equal(partValid({ ...eq, derivStart: "" }), false);
});

test("buildPart: mcq → display có choices, answer là chuỗi đúng", () => {
  const { display, answer } = buildPart({
    ...emptyPart(),
    type: "mcq",
    prompt: "1+1=?",
    items: ["1", "2"],
    correct: "2",
  });
  assert.deepEqual(display, { type: "mcq", prompt: "1+1=?", choices: ["1", "2"] });
  assert.equal(answer.correct, "2");
});

test("buildPart: ordering → answer giữ ĐÚNG thứ tự gốc dù display bị xáo", () => {
  const { display, answer } = buildPart({
    ...emptyPart(),
    type: "ordering",
    prompt: "sắp",
    items: ["a", "b", "c"],
  });
  assert.deepEqual(answer.correct, ["a", "b", "c"]);
  assert.deepEqual([...(display.choices ?? [])].sort(), ["a", "b", "c"]);
});

test("buildPart: matching → answer = vế phải theo thứ tự trái; display gói qua packMatching", () => {
  const { display, answer } = buildPart({
    ...emptyPart(),
    type: "matching",
    prompt: "nối",
    items: ["2+2", "3+3"],
    rights: ["4", "6"],
  });
  assert.deepEqual(answer.correct, ["4", "6"]);
  assert.ok((display.choices ?? []).includes("2+2"));
  assert.ok((display.choices ?? []).includes("3+3"));
});

test("buildPart: derivation (equation) → display choices [start,mode,variable]; answer = JSON spec ẨN", () => {
  const { display, answer } = buildPart({
    ...emptyPart(),
    type: "derivation",
    prompt: "Giải phương trình",
    derivMode: "equation",
    derivStart: "2x + 3 = 7",
    derivVar: "x",
  });
  assert.deepEqual(display.choices, ["2x + 3 = 7", "equation", "x"]);
  const spec = JSON.parse(String(answer.correct));
  assert.equal(spec.mode, "equation");
  assert.equal(spec.variable, "x");
  assert.equal(spec.start, "2x + 3 = 7");
});

test("buildCompoundPayload + decodeCompound: khứ hồi giữ nguyên nội dung", () => {
  const parts: PartDraft[] = [
    { ...emptyPart(), type: "numeric", prompt: "3+5=?", correct: "8" },
    { ...emptyPart(), type: "mcq", prompt: "chọn đúng", items: ["A", "B"], correct: "B" },
  ];
  const { choices, correct } = buildCompoundPayload(parts);
  const back = decodeCompound(choices, correct);
  assert.equal(back.length, 2);
  assert.equal(back[0].type, "numeric");
  assert.equal(back[0].prompt, "3+5=?");
  assert.equal(back[0].correct, "8");
  assert.equal(back[1].type, "mcq");
  assert.deepEqual(back[1].items, ["A", "B"]);
  assert.equal(back[1].correct, "B");
});

test("buildCompoundPayload + decodeCompound: phần derivation khứ hồi giữ mode/start/target/variable", () => {
  const parts: PartDraft[] = [
    {
      ...emptyPart(),
      type: "derivation",
      prompt: "Rút gọn",
      derivMode: "expression",
      derivStart: "2(x+2)",
      derivTarget: "2x+4",
    },
  ];
  const { choices, correct } = buildCompoundPayload(parts);
  const back = decodeCompound(choices, correct);
  assert.equal(back[0].type, "derivation");
  assert.equal(back[0].derivMode, "expression");
  assert.equal(back[0].derivStart, "2(x+2)");
  assert.equal(back[0].derivTarget, "2x+4");
});

test("defaultPartAnswer: mảng cho loại nhiều-phần-tử (kể cả derivation), chuỗi rỗng cho còn lại", () => {
  assert.deepEqual(defaultPartAnswer("multi"), []);
  assert.deepEqual(defaultPartAnswer("ordering"), []);
  assert.deepEqual(defaultPartAnswer("matching"), []);
  assert.deepEqual(defaultPartAnswer("fill-blank"), []);
  assert.deepEqual(defaultPartAnswer("derivation"), []);
  assert.equal(defaultPartAnswer("numeric"), "");
  assert.equal(defaultPartAnswer("mcq"), "");
});
