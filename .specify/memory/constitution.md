# Synaptek Constitution

> Hiến chương này cố ý **mỏng**. Nguồn quyết định **chính thức** là Decision Log trong
> `docs/00-architecture.md §0` (ID D1–D13). Khi file này và Decision Log mâu thuẫn, **Decision Log
> thắng** và file này phải được sửa. Không lặp lại rationale ở đây — trỏ tới số D.

## Core Principles

### I. Bộ chấm bài là moat — bảo vệ nó

Lớp chấm tương đương đáng tin là phần khó & khác biệt duy nhất; phần còn lại là CRUD + content. Engine
phải là **package TS thuần, độc lập nền tảng** (D2): không import DOM/React/Node-only, chạy được cả ở
client (phản hồi tức thì) lẫn Deno Edge Function (chấm chính thức). Mọi thay đổi hành vi chấm (chuẩn hóa
số, tương đương phân số/biểu thức) phải chạy lại test và cân nhắc trade-off. Chấm chính thức là
**server-authoritative**: đáp án KHÔNG rời server (D4).

### II. Một nguồn-sự-thật — không fork tài liệu

Kiến trúc/quyết định ở Decision Log; điểm tiếp tục ở `docs/WORKING-NOTES.md`; roadmap ở
`docs/02-roadmap.md`. Artifact Spec Kit (`specs/`) mô tả **CÁCH** làm một feature và phải **trỏ tới số
D**, không chép lại. Curriculum + ngân hàng câu hỏi là **JSON ground-truth trong `content/`** (D6),
không phải bảng DB.

### III. Test-first cho engine & logic dùng chung (KHÔNG THỎA HIỆP)

Theo repo rules: viết test trước (RED → GREEN → REFACTOR), nhắm ≥80% coverage cho `packages/*` và logic
thuần. `grading-engine` được test kỹ nhất; engine ship & test ở dạng raw `.ts` (`node
--experimental-strip-types`), không build step.

### IV. Milestone-gated, luôn chạy được

Tiến theo M0 → M1 → … → M5 (`docs/02-roadmap.md`). Mỗi mốc nhỏ, để repo ở trạng thái chạy được, trả lời
một câu hỏi sống-còn trước khi mốc sau được "cấp vốn". Bandwidth thất thường: mỗi phiên ghi việc kế tiếp
vào WORKING-NOTES trước khi dừng.

### V. Cấu trúc vừa-đủ — không scaffold đầu cơ

Phụ thuộc một chiều: `apps/*` & `supabase/functions/*` → `packages/*` (D5). Không app nào import app
khác. Logic dùng chung phải là package TS thuần; chỉ tách package mới ở consumer **thứ 2** (`grading-engine`
đã có 2 consumer: client + Edge Function). Không pre-scaffold thứ chưa tới mốc cần.

## Ràng buộc công nghệ

- **Cross-platform = Expo Router universal** (web + iOS + Android, một codebase); **web ra trước, native
  sau** (D1/D12).
- **Backend = Supabase BaaS + Edge Functions**, config-as-code trong `supabase/`; không server riêng
  (D3). Logic đáng tin cậy (chấm chính thức, ẩn đáp án, cấp quyền, job nền) ở Edge Function, **dùng lại
  `grading-engine`** (D4). Edge-runtime chỉ mount `supabase/functions` → engine đồng bộ vào `_shared`
  qua `npm run sync:edge` (D13).
- **Nội dung = JSON versioned trong `content/`** (D6).
- **Docs/comment tiếng Việt; định danh code tiếng Anh** (D10). Node **≥ 22**; npm workspaces.

## Governance

Hiến chương này **bổ sung** — không thay thế — Decision Log và global/repo rules của người dùng. Sửa
đổi: cập nhật D-row liên quan trước, rồi phản ánh ở đây. Spec Kit (`specs/`) là công cụ thực thi; nó
không sở hữu quyết định kiến trúc.

**Version**: 0.1.0 | **Ratified**: 2026-06-24 | **Last Amended**: 2026-06-24
