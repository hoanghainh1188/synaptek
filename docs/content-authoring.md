# Hướng dẫn soạn bài (Content Authoring)

> Nội dung Synaptek là **JSON versioned** trong `content/` (D6). Soạn **thủ công** + **import tự động**
> (D14). Schema đầy đủ: [`specs/001-m1-practice-loop/contracts/content-schema.md`](../specs/001-m1-practice-loop/contracts/content-schema.md).

## Quy trình 3 bước

```bash
# 1. Viết/sửa file JSON trong content/ (xem mẫu bên dưới)
# 2. Cập nhật manifest (app tự nạp file mới — KHÔNG cần sửa code)
npm run gen:content
# 3. Kiểm tra hợp lệ (báo lỗi rõ dòng nào, sai gì)
npm run validate:content
# → chạy app: npm run web --workspace @synaptek/app
```

> CI cũng chạy `validate:content` + kiểm manifest đồng bộ → nội dung sai **không lọt** vào nhánh.

## Bố cục thư mục

```text
content/
├── curriculum/grade-<n>.json     # cây kiến thức mỗi lớp (mạch → chủ đề → kỹ năng)
├── questions/<topicId>.json      # 1 file/chủ đề; TÊN FILE = id chủ đề
└── images/<key>.png|webp         # ảnh bundle (tùy chọn)
```

## 1) Câu hỏi — `content/questions/<topicId>.json` (mảng)

Trường chung: `id` (duy nhất), `skillId` (phải tồn tại), `grade`, `type`, `prompt`, `correct`,
`explanation`. `image?` tùy chọn. `type` quyết định cách chấm — **map thẳng** `@synaptek/grading-engine`.

```jsonc
[
  // mcq
  {
    "id": "g4.num.fractions.q101",
    "skillId": "g4.num.fractions.compare",
    "grade": 4,
    "type": "mcq",
    "prompt": "Phân số nào lớn hơn?",
    "choices": ["1/2", "1/3"],
    "correct": "1/2",
    "explanation": "Cùng tử số, mẫu nhỏ hơn thì lớn hơn.",
  },

  // true-false  (correct: "true" | "false")
  {
    "id": "…q102",
    "skillId": "…",
    "grade": 4,
    "type": "true-false",
    "prompt": "2/4 = 1/2?",
    "correct": "true",
    "explanation": "Rút gọn 2/4 = 1/2.",
  },

  // numeric  (chấp nhận 0,5 ≡ 0.5; có thể thêm "options": { "tolerance": 0.01 })
  {
    "id": "…q103",
    "skillId": "…",
    "grade": 4,
    "type": "numeric",
    "prompt": "1/2 = ? (thập phân)",
    "correct": "0.5",
    "explanation": "1 chia 2 = 0,5.",
  },

  // fraction  (chấp nhận 2/4 ≡ 1/2 ≡ 0,5)
  {
    "id": "…q104",
    "skillId": "…",
    "grade": 4,
    "type": "fraction",
    "prompt": "Rút gọn 2/4.",
    "correct": "1/2",
    "explanation": "Chia tử và mẫu cho 2.",
  },

  // expression  (tương đương đại số: 2a+4 ≡ 2(a+2))
  {
    "id": "…q105",
    "skillId": "…",
    "grade": 4,
    "type": "expression",
    "prompt": "Chu vi HCN dài a, rộng 2 (theo a).",
    "correct": "2a+4",
    "explanation": "P = 2(a+2).",
  },

  // fill-blank  (correct là MẢNG, mỗi ô một phần tử)
  {
    "id": "…q106",
    "skillId": "…",
    "grade": 4,
    "type": "fill-blank",
    "prompt": "1/2 + 1/2 = __ ; 3/4 − 1/4 = __",
    "correct": ["1", "1/2"],
    "explanation": "Cộng/trừ phân số cùng mẫu.",
  },
]
```

## 2) Ảnh trong câu hỏi (`image`)

`alt` (mô tả) **bắt buộc**. Hai cách lấy ảnh:

```jsonc
// (a) Ảnh bundle: đặt file content/images/rect-5x3.png → src = TÊN KHÔNG ĐUÔI
"image": { "src": "rect-5x3", "alt": "Hình chữ nhật 5×3 cm", "aspectRatio": 1.6 }

// (b) URL / data-URI (vd Supabase Storage; hoặc SVG inline)
"image": { "src": "https://.../hinh.png", "alt": "…" }
```

- **Bundle** → chạy offline (khuyên dùng cho nội dung lõi). Nhớ `npm run gen:content` sau khi thêm ảnh.
- **URL/data** → tác giả chỉ dán link, không đụng build (cần mạng).
- Native nên dùng **ảnh raster** (png/webp); SVG inline hợp nhất cho web.

## 3) Chủ đề mới — thêm vào `content/curriculum/grade-<n>.json`

Thêm `topic` vào `strands[].topics` và các `skill` vào `skills[]` (kèm `prerequisites`). `topic.id` phải
trùng **tên file câu hỏi** (`content/questions/<topic.id>.json`). Xem mẫu trong `grade-4.json`.

## Quy ước id

Phân cấp, duy nhất toàn cục: `g<lớp>.<mạch>.<chủ đề>.<hậu tố>`
vd `g4.num.fractions.compare` (kỹ năng), `g4.num.fractions.q101` (câu hỏi). Mạch: `num` (Số), `geo`
(Hình học), `measure` (Đo lường), `stats` (Thống kê) — quyết định **màu** hiển thị.

## Checklist trước khi commit

- [ ] `npm run validate:content` xanh (id không trùng, `skillId` tồn tại, mcq có `choices`, fill-blank
      `correct` là mảng, ảnh có `alt`/tồn tại).
- [ ] `npm run gen:content` đã chạy (manifest cập nhật).
- [ ] Bám **Chương trình GDPT 2018**; **KHÔNG sao chép nguyên văn SGK** (biên soạn lại/diễn đạt khác).
- [ ] `explanation` ngắn gọn, đúng sư phạm; `prompt` rõ ràng, có dấu tiếng Việt chuẩn.
