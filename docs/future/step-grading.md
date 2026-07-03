# Thiết kế: Chấm trình bày từng bước + LaTeX

> **Trạng thái: phần THUẬT TOÁN/TÍCH HỢP đã ship (Decision Log D38/D40–D42/D44/D45); LaTeX RENDER (hiển
> thị) đã ship (D53, KaTeX, web-only); LaTeX-as-INPUT (gõ trực tiếp) vẫn CHƯA làm — chủ đích, chỉ hợp
> THCS/THPT, xem mục "LaTeX" bên dưới.** Xem "✅ Đã triển khai" bên dưới cho hiện trạng, phần còn lại của
> tài liệu là thiết kế gốc — vẫn đúng cho phần LaTeX-input chưa làm, giữ lại làm tham chiếu.

## ✅ Đã triển khai (khác thiết kế gốc ở chỗ KHÔNG cần đợi M5/THCS)

Toàn bộ phần "Kiến trúc đề xuất" bên dưới đã thành hiện thực, khớp gần như nguyên văn thiết kế gốc:

- **`packages/step-grading`** (D38): `gradeDerivation(lines, spec)` — đúng chữ ký đề xuất
  (`firstErrorIndex`/`validSteps`/`totalSteps`/`reachedGoal`/`score`), 2 mode `expression`/`equation`,
  sampler tái dùng từ `grading-engine` (`evalExpr` mới thêm cho việc này).
- **Loại câu `derivation` giao/chấm được** (D40): soạn/giao qua `custom_questions`, chấm CHÍNH THỨC ở Edge
  `grade-assignment` (server-authoritative, D4) — không phải chỉ luyện tập client-only như dự tính ban đầu.
- **UX nhập KHÔNG cần LaTeX** (D41/D42): bàn phím toán có cấu trúc (mũ/ngoặc/biến/căn — sinh biểu thức
  engine-parse được, đúng hướng "cần bàn phím toán có cấu trúc" đã nêu) cho cả HS trả lời lẫn GV/PH soạn câu.
  **Đây là phần thiết kế gốc gọi là "rủi ro lớn nhất" — đã giải quyết mà KHÔNG cần đợi mở lên THCS/THPT.**
- **Lồng vào câu nhiều phần** (D44): derivation có thể là 1 phần trong câu a/b/c, chấm qua
  `gradeCompoundParts` (kết hợp `grade()` + `gradeDerivation` cùng lượt).
- **Căn bậc hai** (D45): mở rộng tokenizer engine (`√`/`sqrt()`) — bước đầu cho "đi sâu THCS" mà thiết kế
  gốc dự tính, đã làm ĐỘC LẬP không cần chờ mở lớp.
- **KaTeX render** (D53): `MathText.web.tsx` (Metro chọn khi build web) đổi segment `frac`/`sup` từ
  FractionView/mũ-unicode tự chế sang KaTeX thật (`katex.renderToString`) — CHỈ hiển thị, KHÔNG đổi cú
  pháp lưu/nhập (`parseMathMarkup`/bàn phím toán giữ nguyên, D53 quyết định "chỉ nâng hiển thị"). Native
  giữ nguyên renderer cũ (`MathText.tsx`, KaTeX là thư viện DOM-only không chạy RN native).

**Còn thiếu so với thiết kế gốc**: LaTeX-as-input cho THCS/THPT — xem mục "LaTeX" bên dưới, vẫn đúng
nguyên trạng thiết kế (chủ đích chưa làm, tiểu học dùng bàn phím có cấu trúc phù hợp lứa tuổi hơn). Lớp
giải thích LLM (mục "Nguyên tắc tin cậy") cũng chưa làm.

## Mục tiêu

Hiện engine chấm **đáp số cuối**. Bước tiếp theo của moat: **đánh giá lời giải** — từng dòng biến đổi có
hợp lệ không, **sai ở bước nào**, **điểm thành phần**, và chấp nhận **nhiều cách giải**. Đúng tinh thần
"khắc phục điểm yếu".

## Phát hiện cốt lõi — moat value-sampling (D9) ĐỦ để chấm bước, KHÔNG cần CAS

Mỗi loại bài có **một bất biến mỗi bước phải bảo toàn**, và cả hai đều **kiểm được bằng lấy mẫu**:

| Loại                            | Bất biến mỗi bước                   | Cách kiểm bằng sampling                                                             |
| ------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| **Rút gọn biểu thức / phân số** | Dòng N ≡ dòng N−1 về **giá trị**    | Thay biến nhiều giá trị → giá trị 2 dòng bằng nhau                                  |
| **Giải phương trình**           | Dòng N cùng **tập nghiệm** dòng N−1 | Thay biến nhiều giá trị → **chân trị** (eq đúng/sai) 2 phương trình trùng ở mọi mẫu |

> `2x+3=7` và `2x=4` không bằng nhau về _giá trị_ nhưng **cùng đúng/sai tại mỗi x** → "cùng tập nghiệm"
> kiểm được bằng lấy mẫu chân trị. Vẫn **không cần CAS** → **D9 đứng vững**.

## Kiến trúc đề xuất

**Package thuần mới `@synaptek/step-grading`** (tái dùng sampler của `grading-engine`; zero-dep, test-first
— D2; chạy client cho phản hồi tức thì + Edge cho chấm chính thức — D4):

```
gradeDerivation(lines, spec) → {
  firstErrorIndex,   // dòng ĐẦU TIÊN phá bất biến (-1 nếu không)
  validSteps,        // số bước hợp lệ liên tiếp
  reachedGoal,       // dòng cuối đạt "đích" chưa
  score              // = validSteps/total, +thưởng nếu reachedGoal
}
```

- `lines`: `[L0(đề cho), L1, …, Lk]` — HS nhập từng dòng.
- `spec`: `{ mode: "expression" | "equation", variable: "x", goal: <checker> }`.

### Thuật toán

1. Với mỗi cặp `(L_{n-1}, L_n)`: kiểm bất biến bằng sampling → dừng ở **dòng sai đầu tiên**.
2. Kiểm `reachedGoal` (per loại): phân số tối giản (gcd tử/mẫu = 1) · phương trình về dạng `x = số`.
3. **Điểm thành phần** theo số bước đúng + đạt đích.

### Vì sao thắng

- **Nhiều cách giải tự nhiên được chấp nhận** — không so lời giải mẫu, chỉ kiểm _bất biến + đích_.
- **Định vị bước sai** (không chỉ đúng/sai cả bài) → phản hồi sư phạm thật.
- Tái dùng moat; **tất định, kiểm được** (khác LLM).

## LaTeX: tách 2 việc

- **Hiển thị (render):** KaTeX/MathJax — dễ, rủi ro thấp, dùng mọi cấp.
- **Nhập liệu:** LaTeX-as-input **KHÔNG hợp tiểu học**; cần **bàn phím toán có cấu trúc** (nút phân số/căn/mũ)
  sinh biểu thức engine-parse được. LaTeX-input chỉ hợp **THCS/THPT** → step-grading gắn chặt việc lên lớp trên.

## Các "bẫy" R&D (xử khi triển khai)

- **Miền xác định** (chia 0): bỏ mẫu làm biểu thức không xác định; cần đủ mẫu hợp lệ.
- **Goal-checker per loại**: logic nhỏ riêng từng dạng.
- **Bước nhảy cóc** (đi tắt): bất biến + đích vẫn đạt → cho full điểm hay yêu cầu độ mịn? → **lựa chọn sư phạm**.
- **UX nhập** là rủi ro lớn nhất (hơn cả thuật toán) — workstream riêng.

## Nguyên tắc tin cậy (khi thêm AI)

**Engine CHẤM, LLM chỉ GIẢI THÍCH.** Điểm luôn từ value-sampling (tất định); LLM chỉ sinh gợi ý/diễn giải
bám `firstErrorIndex` engine đã định vị → không "dạy sai".

## Lộ trình PHẦN CÒN LẠI (LaTeX + THCS/THPT)

Các bước 2–3 của thiết kế gốc (MVP một mode, nhập dòng text) đã xong qua D38/D40. Còn lại:

1. ~~KaTeX render (mọi cấp, rủi ro thấp)~~ — ✅ xong (D53).
2. **LLM lớp giải thích** (tùy chọn) bám lỗi engine — chưa làm.
3. Đẩy lên **THCS/THPT** (nơi LaTeX-input phát huy nhất, cần vượt qua giới hạn bàn phím có cấu trúc hiện tại
   cho biểu thức phức tạp hơn) — chưa bắt đầu.

## Liên hệ

- Moat hiện tại: `packages/grading-engine` (D9 value-sampling, không CAS).
- Đặt cạnh các hướng tương lai khác: THCS/THPT (đi sâu) · Lý/Hóa (đơn vị) · gia sư AI · môn Anh (engine khác).
