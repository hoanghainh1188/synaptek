# @synaptek/grading-engine

Bộ chấm bài **TS thuần, zero-dep, độc lập nền tảng** — trái tim ("moat") của Synaptek.

Chạy được trên cả **Node** (client/test) lẫn **Deno** (Supabase Edge Function): cùng một engine
cho phản hồi tức thì ở client và chấm chính thức ở server (đáp án không rời server).

## Vì sao "chấm tương đương" thay vì so chuỗi

Học sinh nhập `0,5` hay `2/4` hay `2(x+2)` đều phải được chấm đúng. Engine chuẩn hóa rồi so
**giá trị/tương đương**, không so ký tự thô:

| Loại                 | Ví dụ tương đương                                                   |
| -------------------- | ------------------------------------------------------------------- |
| `numeric`            | `0,5` ≡ `0.5` · `1.000,5` ≡ `1000.5` (dấu phẩy = thập phân kiểu VN) |
| `fraction`           | `1/2` ≡ `2/4` ≡ `0,5`                                               |
| `expression`         | `2x+4` ≡ `2(x+2)` · `x^2` ≡ `x*x` (lấy mẫu giá trị `x`)             |
| `mcq` / `true-false` | chuẩn hóa hoa/thường; `Đúng` ≡ `true`                               |
| `fill-blank`         | chấm theo tỉ lệ chỗ trống đúng (partial)                            |

## API

```ts
import { grade } from "@synaptek/grading-engine";

grade({ type: "fraction", correct: "1/2", answer: "2/4" });
// → { isCorrect: true, score: 1, feedbackCode: "correct", normalized: {...} }
```

## Test

```bash
npm test --workspace @synaptek/grading-engine
# hoặc trực tiếp:
node --experimental-strip-types --no-warnings tests/grading-engine.test.ts
```

Không cần build, không bundler — ship raw `.ts` (mirror `@twolody/scoring-engine`).

## Giới hạn hiện tại (sẽ mở rộng)

- `expression` so tương đương qua **lấy mẫu số** (đủ tốt cho đa thức/biểu thức tiểu học), chưa
  phải CAS đầy đủ; chỉ hỗ trợ một biến `x`, toán tử `+ - * / ^` và ngoặc.
- Chưa chấm **trình bày từng bước** / nhập LaTeX (thuộc giai đoạn sau).
