import assert from "node:assert/strict";
import { test } from "node:test";
import { reportToCsv } from "./report-csv.ts";

const report = {
  assignments: [
    { id: "a1", title: "Bài 1" },
    { id: "a2", title: "Bài, hai" }, // có dấu phẩy → phải bọc nháy
  ],
  rows: [
    { name: "An", scores: { a1: 1, a2: 0.7 }, average: 0.85 },
    { name: "Bình", scores: { a1: null, a2: 0.5 }, average: 0.5 }, // a1 chưa nộp → rỗng
    { name: null, scores: { a1: null, a2: null }, average: null }, // chưa nộp gì
  ],
};

test("header + phần trăm + ô rỗng khi chưa nộp", () => {
  const csv = reportToCsv(report);
  const lines = csv.split("\n");
  assert.equal(lines[0], '"Học sinh","Bài 1","Bài, hai","Trung bình (%)"');
  assert.equal(lines[1], '"An","100","70","85"');
  assert.equal(lines[2], '"Bình","","50","50"');
  assert.equal(lines[3], '"(chưa đặt tên)","","",""');
});

test("escape dấu nháy trong tiêu đề", () => {
  const csv = reportToCsv({
    assignments: [{ id: "a1", title: 'Bài "đặc biệt"' }],
    rows: [{ name: "A", scores: { a1: 1 }, average: 1 }],
  });
  assert.ok(csv.split("\n")[0].includes('"Bài ""đặc biệt"""'));
});
