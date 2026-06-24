# Contract — Content Schema (curriculum + câu hỏi)

> **Đây là GATE cho content pipeline (D14).** Người soạn nội dung biên soạn **thủ công** theo schema này;
> `@synaptek/curriculum` là nơi định nghĩa types + `validate*()`. Câu hỏi map **thẳng** sang `GradeInput`
> của `@synaptek/grading-engine` (không adapter). Nội dung là JSON versioned trong `content/` (D6).

## Bố cục thư mục

```text
content/
├── curriculum/
│   ├── grade-4.json          # bắt buộc cho M1
│   └── grade-1.json … grade-3.json   # rút gọn, để ôn (D15)
└── questions/
    ├── g4.num.fractions.json # 1 file/chủ đề, tên file = topic id
    └── …                     # tổng ~120 câu lớp 4 (3 chủ đề)
```

## 1) Curriculum — `content/curriculum/grade-<n>.json`

```jsonc
{
  "grade": 4,
  "strands": [
    {
      "id": "g4.num",
      "name": "Số và phép tính",
      "topics": [
        {
          "id": "g4.num.fractions",
          "name": "Phân số",
          "grade": 4,
          "skillIds": [
            "g4.num.fractions.concept",
            "g4.num.fractions.compare",
            "g4.num.fractions.addsub",
          ],
        },
      ],
    },
  ],
  "skills": [
    {
      "id": "g4.num.fractions.compare",
      "name": "So sánh phân số",
      "description": "So sánh hai phân số cùng/khác mẫu",
      "prerequisites": ["g4.num.fractions.concept"],
    },
  ],
}
```

**Quy tắc**: `id` namespaced & duy nhất toàn cục; `topic.skillIds[]` và `skill.prerequisites[]` phải trỏ
tới `skill.id` tồn tại; `prerequisites` tạo DAG (không vòng); `prerequisites` được phép trỏ skill **lớp
dưới** (ôn tập, D15).

## 2) Câu hỏi — `content/questions/<topicId>.json` (mảng)

Trường chung mọi loại:

| Trường        | Kiểu                     | Bắt buộc  | Ghi chú                                                                          |
| ------------- | ------------------------ | --------- | -------------------------------------------------------------------------------- |
| `id`          | string                   | ✅        | duy nhất toàn cục, vd `g4.num.fractions.q001`                                    |
| `skillId`     | string                   | ✅        | trỏ skill tồn tại                                                                |
| `grade`       | 1..5                     | ✅        | để lọc/ôn theo lớp                                                               |
| `type`        | enum                     | ✅        | `mcq` \| `true-false` \| `numeric` \| `fraction` \| `expression` \| `fill-blank` |
| `prompt`      | string                   | ✅        | đề; có thể chứa markup Toán đơn giản (xem §3)                                    |
| `correct`     | string \| string[]       | ✅        | **đúng định dạng engine** (xem ví dụ); `fill-blank` dùng mảng                    |
| `choices`     | string[]                 | khi `mcq` | các lựa chọn hiển thị                                                            |
| `options`     | `{ tolerance?: number }` | ✖         | dung sai numeric/expression                                                      |
| `explanation` | string                   | ✅        | giải thích ngắn (hiện sau khi nộp)                                               |

`{ type, correct, options }` được truyền **nguyên** vào `grade()`; `answer` lấy từ HS.

### Ví dụ từng loại

```jsonc
// mcq
{ "id":"g4.num.fractions.q001","skillId":"g4.num.fractions.compare","grade":4,"type":"mcq",
  "prompt":"Phân số nào lớn hơn?","choices":["1/2","1/3"],"correct":"1/2",
  "explanation":"Cùng tử số 1, mẫu nhỏ hơn thì lớn hơn." }

// true-false
{ "id":"…q002","skillId":"…","grade":4,"type":"true-false",
  "prompt":"2/4 = 1/2 đúng hay sai?","correct":"true","explanation":"Rút gọn 2/4 = 1/2." }

// numeric (chấp nhận 0,5 ≡ 0.5)
{ "id":"…q003","skillId":"…","grade":4,"type":"numeric",
  "prompt":"1/2 viết dưới dạng số thập phân = ?","correct":"0.5","explanation":"1 chia 2 = 0,5." }

// fraction (chấp nhận 2/4 ≡ 1/2 ≡ 0,5)
{ "id":"…q004","skillId":"…","grade":4,"type":"fraction",
  "prompt":"Rút gọn 2/4 = ?","correct":"1/2","explanation":"Chia cả tử và mẫu cho 2." }

// expression (chấp nhận tương đương; tiểu học dùng hạn chế)
{ "id":"…q005","skillId":"…","grade":4,"type":"expression",
  "prompt":"Tính chu vi hình chữ nhật dài a, rộng 2 (theo a).","correct":"2a+4",
  "explanation":"P = 2(a+2) = 2a+4." }

// fill-blank (nhiều ô)
{ "id":"…q006","skillId":"…","grade":4,"type":"fill-blank",
  "prompt":"Điền: 1/2 + 1/2 = __ ; 3/4 − 1/4 = __","correct":["1","1/2"],
  "explanation":"Cộng/trừ phân số cùng mẫu." }
```

## 3) Markup Toán trong `prompt` (tùy chọn, cho render)

Để `FractionView`/`ExpressionView` vẽ đẹp thay vì text thô, cho phép token nội tuyến tối giản:

- Phân số: `[[frac:1/2]]` → render tử/mẫu có gạch ngang.
- Lũy thừa: `x^2` → render mũ.
- Còn lại là text thường (giữ đơn giản cho M1).

Nếu `prompt` không có token, hiển thị như text. (Bộ token có thể mở rộng sau — giữ nhỏ ở M1.)

## 4) Validation (do `@synaptek/curriculum` thực thi — test trước)

- `id` câu hỏi & curriculum duy nhất; `skillId`/`prerequisites`/`skillIds` trỏ tới id tồn tại.
- `type` ∈ enum; `mcq` ⇒ có `choices` (≥2) và `correct` ∈ `choices` (sau chuẩn hóa); `fill-blank` ⇒
  `correct` là mảng.
- `correct` & `explanation` không rỗng; `grade` ∈ 1..5.
- DAG `prerequisites` không có chu trình.
- Lỗi validation = fail build/test (CI), không nạp âm thầm.

## 5) Định nghĩa loại (tham chiếu engine)

`type` và định dạng `correct` **trùng** API `grade()` của `@synaptek/grading-engine`
(`packages/grading-engine/src/grading-engine.ts`) — nguồn-sự-thật cho hành vi chấm tương đương
(số kiểu VN, phân số, biểu thức lấy mẫu). Không định nghĩa lại ở đây.
