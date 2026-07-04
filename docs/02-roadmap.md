# Roadmap Synaptek (milestone-gated)

Mỗi mốc giữ repo ở trạng thái chạy được. Mỗi mốc ≈ một (vài) feature Spec Kit (`specs/NNN-*`).

| Mốc                                   | Nội dung                                                                                                                                                                                                                                           | "Done"                                                                                           | Trạng thái                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M0 — Scaffolding & Spike**          | Monorepo + tooling; `grading-engine` (TDD); Expo universal; Supabase + Edge Function; CI; Spec Kit + constitution; Decision Log                                                                                                                    | App chạy web; CI xanh; engine xanh; engine chạy ở client + Edge Function                         | ✅ **Đóng** — spike render Toán dời vào M1; iOS sim kiểm song song (web đã pass)                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **M1 — Vòng luyện tập học sinh**      | UI phiên luyện (chọn chủ đề → làm → chấm tức thì + giải thích → kết quả); **render Toán + nhập đáp số** (spike gộp từ M0); `curriculum` đa lớp (lớp 4 + ôn lớp 1–3); **auth tối thiểu** (Supabase email/mật khẩu); lưu `attempts` + tiến độ cơ bản | HS luyện chủ đề lớp 4 (và ôn lớp 1–3), chấm đúng/tương đương, đăng nhập & thấy tiến độ qua phiên | 🟢 **US1 + US2 + US3 ✅** (verified screenshot thật); 50 unit + e2e xanh, build xanh. Còn polish: ~120 câu (content pipeline), e2e vào CI, đóng PR #2                                                                                                                                                                                                                                                                                                                                                     |
| **M2 — Mastery & Lộ trình**           | Diagnostic; `learning-path` (mastery BKT + gợi ý + spaced review SM-2 qua cron); error heatmap; gamification (streak/XP/huy hiệu)                                                                                                                  | App đề xuất "học gì tiếp" + chỉ điểm yếu                                                         | 🟢 **US1+US2+US3 ✅ merge** (PR #3/#4/#5); learning-path 57 unit (~99% câu lệnh, ~88% nhánh) + Deno scheduler test + guest e2e xanh. Polish đang chốt. Cron/push best-effort, deploy hosted sau (D21)                                                                                                                                                                                                                                                                                                     |
| **M3 — Giáo viên**                    | Tạo lớp + mã mời; soạn/giao bài; chấm chính thức server-side + ghi đè thủ công + nhận xét; phân tích lớp; RLS đầy đủ                                                                                                                               | GV vận hành một lớp end-to-end, điểm đáng tin                                                    | 🟢 **US1+US2+US3 ✅** (PR #7/#8/+US3); RLS chéo vai trò verified live (9 ca) · chấm server-side (ẩn đáp án D4) verified e2e · `@synaptek/classroom` 19 unit (100%/98% nhánh). D22–D24. Polish chốt                                                                                                                                                                                                                                                                                                        |
| **M4 — Phụ huynh + mở rộng nội dung** | Liên kết PH–con; theo dõi/giao bài tại nhà; mở rộng đủ lớp 1–5                                                                                                                                                                                     | Đủ 3 vai trò; phủ nội dung Tiểu học                                                              | ✅ **Đóng** — đủ 3 vai trò (liên kết + theo dõi + giao bài tại nhà PH→con) · authoring GV/PH tự soạn câu · phủ nội dung Tiểu học lớp 1–5 (160 câu, 16 skill). RLS PH–con verified live (0005/0006/0007) · D26/D27/D28 · chấm server-side (D4).                                                                                                                                                                                                                                                            |
| **M5 — Native & App store**           | EAS Build iOS/Android; offline cơ bản; push nhắc luyện tập; đánh bóng native                                                                                                                                                                       | App lên store, rework tối thiểu                                                                  | ⬜ — nền đã dựng xong (`eas.json`, plugin push), chỉ còn thao tác cần tài khoản EAS/Apple/Google                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Tương lai**                         | THCS/THPT sâu hơn; môn khác đầy đủ (Lý/Hóa/Anh); LaTeX-as-input (gõ trực tiếp); gia sư AI mở rộng (chat tự do)                                                                                                                                     | —                                                                                                | 🟡 **đang tiến** — **THCS Toán lớp 6 phủ TRỌN 3 mạch CT GDPT** (Số & Đại số: Số tự nhiên/Số nguyên/Phân số/Số thập phân · Hình học · Thống kê-Xác suất; D55/D57/D61–D64) qua quy trình AI-nháp→chủ-repo-duyệt; khung cấp học 2 tầng (D54); chấm trình bày từng bước (D38–D45) + LaTeX render (D53); **công cụ soạn Markdown+AI cho GV/PH** (D65/D66). Còn: nhân rộng lớp 7+/lấp lỗ CT lớp 6 (tỉ số %) · môn khác (Tiếng Anh cần bộ chấm khác moat) · LaTeX-as-input · gia sư AI chat tự do — xem "Sau M4" |

## Sau M4 — Đào sâu sản phẩm (ngoài mốc, đã làm)

M0–M4 đóng xong, làm thêm nhiều ngoài bảng mốc (mỗi mục 1 PR + e2e + Decision Log, xem đầy đủ ở
`docs/00-architecture.md` §0 D26–D67 và `CLAUDE.md` mục "Recent Changes"):

- **Soạn câu nâng cao**: **11 loại câu** (mcq · số · phân số · đúng/sai · biểu thức · điền chỗ trống ·
  chọn nhiều · sắp thứ tự · nối cặp · **trình bày từng bước** · **nhiều phần a/b/c**, có thể lồng
  từng-bước vào 1 phần) + **nhãn môn** + **tùy chọn chấm** (làm tròn/dung sai/không-thứ-tự) + **ảnh**
  (Storage) + **gợi ý** + **bàn phím toán có cấu trúc** (mũ/ngoặc/biến/căn, không cần gõ LaTeX).
  (D28·D34–D45, migrations 0007–0023)
- **Chấm trình bày từng bước** (package `@synaptek/step-grading`, D38/D40/D44): định vị dòng sai đầu
  tiên bằng lấy mẫu giá trị (không cần CAS, D9), chấp nhận nhiều cách giải, lồng được vào câu nhiều
  phần. **LaTeX render thật qua KaTeX** (D53, web-only, chỉ nâng hiển thị — cú pháp lưu/nhập giữ
  nguyên); LaTeX-as-input (gõ trực tiếp) vẫn để dành cho THCS/THPT, xem `docs/future/step-grading.md`.
- **Engine moat mở rộng**: hỗn số · phần trăm · đơn vị đo · số La Mã · căn bậc hai (`√`/`sqrt()`, D45) ·
  6 chẩn đoán lỗi · options. (72 unit test)
- **Trải nghiệm học sinh**: mục tiêu hằng ngày · luyện nhanh 1 chạm · bảng xếp hạng lớp · avatar mở khoá
  theo XP + avatar ảnh thật (lựa chọn thêm, D51). (D32·D33·D51)
- **Insight GV–PH**: cảnh báo HS cần chú ý · xu hướng điểm lớp · tóm tắt tuần GV · PH gợi ý hành động.
- **Đa môn + cấp học + THCS lớp 6**: nền `Grade.subject` + seed Tiếng Việt lớp 1–3 (D39); khung cấp học 2
  tầng Tiểu học/THCS/THPT (D54, "cấp" SUY RA từ số lớp); **THCS Toán lớp 6 phủ TRỌN 3 mạch CT GDPT 2018**:
  Số & Đại số (Số tự nhiên D62 · Số nguyên D55 · Phân số D57 · Số thập phân D61) + Hình học D63 + Thống kê-
  Xác suất D64 — kiến trúc chịu **nhiều strand/mạch** không đổi code. Quy trình **AI-nháp→gate-tự-chấm→chủ-
  repo-DUYỆT** (D14/D55) + gate tự-chấm nội dung (`validate:content` chạy engine trên đáp án). **Nội dung
  tổng 307 câu, 40 kỹ năng** (Tiểu học 1–5 + TV 1–3 + THCS lớp 6).
- **Công cụ soạn nhanh cho GV/PH** (D65/D66): **nhập hàng loạt bằng Markdown** (parser thuần, suy loại tự
  động 6 loại text; điền nhiều ô ngăn `|` né phẩy VN) + **AI nháp** (Edge `generate-questions` Gemini sinh
  khối Markdown theo chủ đề) → xem trước có **TỰ-CHẤM** (engine lọc câu sai đáp án ✓/⚠) → GV duyệt/sửa → lưu.
  An toàn: AI nháp → engine tự-chấm → người duyệt. Chờ `GEMINI_API_KEY` để bật AI thật.
- **Gia sư AI MVP** (D46): Edge Function gọi Gemini giải thích vì sao HS sai — engine vẫn chấm, LLM chỉ
  giải thích; chờ `GEMINI_API_KEY` thật để trả lời (code/wiring đã xong).
- **Tự phục vụ tài khoản + bảo mật vai trò** (D47–D52, D67): quên mật khẩu (Resend SMTP — TẠM DỪNG, chờ mua
  domain) · đổi mật khẩu khi đã đăng nhập · đổi tên hiển thị · đăng xuất thiết bị khác · avatar ảnh thật ·
  xóa tài khoản (soft delete, chặn GV còn lớp có HS) — 5 việc sau KHÔNG phụ thuộc domain. **Khoá vai trò
  học sinh** (D67, migration 0026): trigger DB chặn HS tự "leo" lên GV/PH (ẩn UI không đủ vì RLS cho ghi
  cột role) — student cố định từ lúc đăng ký, chỉ GV↔PH đổi được.
- **Nền tảng + hiệu năng**: CI 3 gate (verify · RLS thật gồm rls-0026 · 40+ e2e đăng nhập) **tối ưu ~4–5×
  (~18–24m → ~5m)** — serve export tĩnh thay dev server + giảm service Supabase + cache Playwright (D58/D59);
  bundle web **−74KB** (lazy-load KaTeX, D60); pin Supabase CLI; vendor assets tự đồng bộ (`sync:edge`,
  `sync:katex` — chống lệch khi nâng cấp dependency). Migrations `0001–0026`; 6 Edge Functions.

**Còn lại theo roadmap**: M5 (native/store — chờ tài khoản, `docs/M5-NATIVE.md`) · "Tương lai" (nhân rộng
THCS lớp 7+ / lấp lỗ CT lớp 6 như tỉ số phần trăm · môn đầy đủ Lý/Hóa/Anh — Tiếng Anh cần bộ chấm khác moat ·
LaTeX-as-input `docs/future/step-grading.md` · gia sư AI mở rộng chat tự do · ngân hàng câu dùng chung giữa
GV) · auth còn thiếu (xác thực email/đổi email — chặn bởi domain, social login, MFA) · bật `GEMINI_API_KEY`
để dùng AI thật.

**Nợ đã ghi nhận**: nội dung **Tiểu học 1–5 chưa audit** đối chiếu CT GDPT (THCS lớp 6 đã bám khung); format
Markdown authoring là **tự chế** (chưa liên thông GIFT/Moodle).

## Luồng song song — Content pipeline (D14)

Không phải một mốc tuần tự mà là **luồng công việc riêng, xuyên suốt M1→M4**: biên soạn câu hỏi **thủ
công dạng JSON** (bám CT GDPT 2018, **không chép nguyên văn SGK**) + cơ chế **import** vào app (D6/D14).

- **Cần cho M1**: định nghĩa **schema câu hỏi/curriculum** + một bộ mẫu **~120 câu lớp 4 (3 chủ đề)** +
  ít chủ đề lớp 1–3, để chạy end-to-end.
- **Về sau ✅**: công cụ soạn (authoring) — GV/PH tự soạn 11 loại câu (M4) + **nhập Markdown hàng loạt + AI
  nháp** (D65/D66); quy trình review nội dung: nội dung cấp trên (THCS) qua **AI-nháp→gate-tự-chấm→chủ-repo-
  DUYỆT** (D14/D55) — cửa duyệt người vẫn bắt buộc cho nội dung trẻ em.
- **Rủi ro #1** của dự án (khối lượng + pháp lý) → tách riêng để không chặn tiến độ code. Vẫn còn: audit nội
  dung Tiểu học đối chiếu CT; nhân rộng THCS/THPT là khối lượng lớn (đòn bẩy = công cụ soạn nhanh ở trên).
