# Thiết kế (tương lai xa): Chấm trình bày từng bước + LaTeX

> **Trạng thái: Ý tưởng/Thiết kế — CHƯA làm.** Phụ thuộc M5 (native) + mở lên THCS/THPT + bàn phím nhập toán.
> Đây là bản ghi để dành (văn hoá Decision Log). Khi triển khai → tạo spec Spec Kit riêng + Decision Log mới.

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

## Lộ trình khi triển khai

1. **KaTeX render** trước (mọi cấp, rủi ro thấp).
2. **MVP một mode**: rút gọn biểu thức/phân số (bất biến = bằng giá trị — đúng lõi engine).
3. Nhập dòng dạng text trước (hoãn bàn phím xịn); trả `firstErrorIndex` + điểm theo bước.
4. **LLM lớp giải thích** (tùy chọn) bám lỗi engine.
5. Đẩy lên **THCS/THPT** (nơi step-grading + LaTeX-input phát huy nhất).

## Liên hệ

- Moat hiện tại: `packages/grading-engine` (D9 value-sampling, không CAS).
- Đặt cạnh các hướng tương lai khác: THCS/THPT (đi sâu) · Lý/Hóa (đơn vị) · gia sư AI · môn Anh (engine khác).
