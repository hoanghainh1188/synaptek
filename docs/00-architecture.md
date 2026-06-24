# Kiến trúc Synaptek

> Tài liệu sống. §0 là **Decision Log** — khi có lựa chọn không hiển nhiên, thêm/cập nhật một dòng
> ở đây thay vì để ngầm. ID dạng D1, D2…

## §0. Decision Log

| ID | Quyết định | Lý do | Trạng thái |
|----|-----------|-------|-----------|
| **D1** | **Cross-platform = Expo Router universal** (React Native Web), KHÔNG dùng Next.js như twolody | Học sinh dùng nhiều mobile/tablet, giáo viên dùng web → một codebase phục vụ cả hai; giảm mạnh chi phí "port" sang native sau này | Chốt |
| **D2** | **Logic nghiệp vụ = packages TS thuần** (`grading-engine`, `curriculum`, `learning-path`), zero-dep, ship raw `.ts` | Test không cần render/thiết bị; tái dùng across client + Edge Function + (sau) native. Kế thừa triết lý `@twolody/scoring-engine` | Chốt |
| **D3** | **Backend = Supabase BaaS + Edge Functions** (không dựng server riêng) | Phần lớn là CRUD + RLS → BaaS lo; chi phí vận hành ~0 ở quy mô nhỏ | Chốt |
| **D4** | **Chấm điểm server-authoritative qua Edge Function**, dùng lại chính `grading-engine` | Bài có điểm: đáp án KHÔNG rời server, điểm ghi DB là điểm server tính → chống gian lận. Client vẫn chạy engine cho phản hồi tức thì (low-stakes) | Chốt |
| **D5** | **Ranh giới repo**: phụ thuộc một chiều `apps/*` & `supabase/functions/*` → `packages/*`; không copy logic; chỉ tách package mới ở consumer thứ 2 | Mirror twolody D25. `grading-engine` đã có 2 consumer (client + Edge Function) nên tách package là đúng | Chốt |
| **D6** | **Nội dung = JSON versioned trong `content/`** (curriculum + ngân hàng câu hỏi), ground-truth; DB chỉ tham chiếu `id` | Review nội dung qua git; tách "đề/đáp án" khỏi dữ liệu người dùng. Mirror twolody (lessons-as-JSON) | Chốt |
| **D7** | **MVP = lát cắt dọc**: Toán Tiểu học, khởi đầu **lớp 4**, 3 chủ đề (bốn phép tính · phân số · chu vi–diện tích) | Lớp 4 có phân số + toán lời văn → khai thác đúng "chấm tương đương"; vẫn đủ đơn giản để hoàn thiện nhanh | Đề xuất (chốt lại đầu M1) |
| **D8** | **Chuẩn hóa số kiểu VN trong engine**: dấu phẩy = thập phân, dấu chấm = phần nghìn (`0,5`→0.5; `1.000,5`→1000.5) | Học sinh VN nhập theo thói quen địa phương; không ép định dạng Anh-Mỹ | Chốt |
| **D9** | **Chấm tương đương biểu thức qua lấy mẫu giá trị** (sample x), không dùng CAS đầy đủ; một biến `x`, toán tử `+ - * / ^` + ngoặc, nhân ngầm | Đủ chính xác cho đa thức/biểu thức tiểu học, code nhỏ & test được; nâng cấp sau nếu cần | Chốt |
| **D10** | **Spec Kit + docs tiếng Việt / code tiếng Anh**, milestone-gated (M0…M5) | Nhất quán với quy trình & ngôn ngữ của twolody | Chốt |
| **D11** | **Tên dự án = `Synaptek`** (synapse + tek), `@synaptek/*`. Bỏ tên tạm `brava` | `brava` trùng nhiều thương hiệu lớn (Fiat/Brava oven…) → rủi ro trademark/SEO/tên miền. `synaptek` độc đáo, ascii sạch, hợp ed-tech (kết nối kiến thức) | Chốt (vẫn cần kiểm tra trademark/domain trước đăng ký) |

## §1. Tổng quan tầng

```
                       ┌──────────────── packages/ (TS thuần, zero-dep) ───────────────┐
                       │  grading-engine   curriculum   learning-path                  │
                       └───────▲───────────────▲────────────────▲──────────────────────┘
                               │ import by name │                │
        ┌──────────────────────┴───────┐   ┌────┴───────────────────────────┐
        │  apps/app (Expo universal)   │   │  supabase/functions (Edge, Deno)│
        │  web + iOS + Android, UI     │   │  chấm chính thức · cấp quyền ·  │
        │  + phản hồi tức thì (client) │   │  job nền · phục vụ đề (ẩn đáp án)│
        └───────────────▲──────────────┘   └───────────────▲─────────────────┘
                        │                                  │
                        └──────── Supabase (Postgres + RLS + Auth + Storage) ────────┘

        content/  ← curriculum & ngân hàng câu hỏi (JSON, ground-truth, versioned)
```

## §2. Trạng thái triển khai

- **`packages/grading-engine`**: ✅ xong vòng đầu — `grade()` cho `mcq` · `true-false` · `numeric` ·
  `fraction` · `expression` · `fill-blank`, 19/19 test (`node --experimental-strip-types`). Là phần
  được test kỹ nhất (moat). Mở rộng sau: loại câu nối/sắp xếp, chấm trình bày từng bước.
- **`apps/app` (Expo universal)**: ⏳ chưa dựng.
- **`supabase/`**: ⏳ chưa dựng (auth + 1 Edge Function "hello" + bảng theo §5 của kế hoạch).
- **CI**: ⏳ chưa thêm (`.github/workflows/ci.yml`: format → lint → test → build → e2e).

Roadmap chi tiết: `docs/02-roadmap.md`. Điểm tiếp tục: `docs/WORKING-NOTES.md`.
