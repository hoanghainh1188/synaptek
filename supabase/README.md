# supabase/ — backend config-as-code

Backend của Synaptek là **Supabase BaaS + Edge Functions** (D3/D4). Thư mục này là nguồn-sự-thật
dạng file; áp lên project thật bằng Supabase CLI.

```
supabase/
├── config.toml              cấu hình local + khai báo verify_jwt từng function
├── migrations/              0001–0023 (xem CLAUDE.md/Decision Log cho danh sách đầy đủ)
└── functions/
    ├── deno.json            import map: @synaptek/{grading-engine,learning-path,classroom,step-grading} → ./_shared/*
    ├── _shared/             bản TỰ SINH (npm run sync:edge) — KHÔNG sửa tay (D13)
    ├── grade/index.ts       chấm nhanh 1 câu server-side, dùng lại engine (consumer #2)
    ├── grade-assignment/    chấm chính thức bài tập (M3 US2, D4) — hỗ trợ compound/derivation/pool
    ├── review-scheduler/    job nền nhắc ôn (D21): đọc skill_mastery.due_at, ghi review_reminders, push best-effort
    └── ai-tutor-explain/    gia sư AI (D46): giải thích vì sao SAI qua Gemini API — engine vẫn chấm, LLM chỉ giải thích
```

## Chạy & deploy (cần Supabase CLI + Docker)

```bash
npm run sync:edge                      # đồng bộ engine → functions/_shared (BẮT BUỘC trước serve/deploy)
supabase start                         # dựng Postgres + Auth + Edge runtime cục bộ (cần Docker)
supabase functions serve grade --no-verify-jwt   # chạy thử Edge Function `grade`

# Gọi thử (cần JWT vì verify_jwt = true; local có thể tắt tạm để test):
curl -i -X POST http://localhost:54321/functions/v1/grade \
  -H "Content-Type: application/json" \
  -d '{"questionId":"demo-frac-1","answer":"2/4"}'
# → { "questionId":"demo-frac-1", "isCorrect":true, "score":1, "feedbackCode":"correct" }

# Hosted:
supabase link --project-ref <ref>
supabase db push                       # áp migrations
supabase functions deploy grade
```

## Job nền nhắc ôn `review-scheduler` (D21)

Edge Function chạy bằng **service role** (bỏ qua RLS, đọc xuyên HS). Idempotent nhờ PK
`review_reminders(student_id, due_date)` + `ON CONFLICT DO NOTHING`. Push Expo là **best-effort** —
HS không có token / push lỗi vẫn tạo nhắc để hiện in-app ("đến hạn ôn" ở trang chủ). Tái dùng
`dayKeyVN`/`nextDueAt` qua `_shared/learning-path` (D13).

```bash
npm run sync:edge                                   # sinh _shared/learning-path (BẮT BUỘC trước serve/deploy)
supabase functions serve review-scheduler           # chạy thử
# Gọi thử (cần service-role key trong Authorization — giống cách cron gọi):
curl -i -X POST http://localhost:54321/functions/v1/review-scheduler \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# → { "ok":true, "dueDate":"YYYY-MM-DD", "students":N, "created":N, "pushed":N }

supabase functions deploy review-scheduler          # hosted
```

**Lên lịch (Supabase Cron / pg_cron)** — chạy trên project hosted. KHÔNG commit service-role key vào
migration; lưu ở Vault rồi tham chiếu. Ví dụ chạy mỗi sáng 8h giờ VN (01:00 UTC):

```sql
-- Bật extension (một lần): pg_cron + pg_net trong Dashboard → Database → Extensions.
select cron.schedule(
  'review-scheduler-daily',
  '0 1 * * *',  -- 08:00 Asia/Ho_Chi_Minh
  $$
  select net.http_post(
    url     := 'https://<project-ref>.supabase.co/functions/v1/review-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    )
  );
  $$
);
```

> Test idempotency (SC-006) ở `functions/review-scheduler/index.test.ts` (Deno, fake client) —
> chạy 2 lần cùng `due_date` → đúng 1 dòng nhắc/HS; push chỉ gọi cho dòng mới.

## Gia sư AI `ai-tutor-explain` (D46)

Giải thích NGẮN GỌN vì sao HS trả lời SAI qua Gemini API (Google AI) — **KHÔNG chấm điểm** (engine đã
chấm; nguyên tắc "Engine CHẤM, LLM chỉ GIẢI THÍCH" — `docs/future/step-grading.md`). Ngữ cảnh (đề/đáp án
HS/đáp án đúng/chẩn đoán) do client gửi (không bí mật, đã hiện với HS) — Edge chỉ validate hình dạng + gọi
Gemini, không tra cứu DB. **Một provider duy nhất** — không thiết kế đa provider khi chưa có nhu cầu cụ thể.

```bash
supabase functions serve ai-tutor-explain      # chạy thử (cần JWT — verify_jwt = true)
supabase secrets set GEMINI_API_KEY=AIza...    # BẮT BUỘC để trả lời thật; thiếu → "not_configured" (graceful)
                                                # Lấy key miễn phí tại: aistudio.google.com/apikey
supabase functions deploy ai-tutor-explain     # hosted
```

- Model mặc định `gemini-2.5-flash-lite` (rẻ/nhanh, đủ cho giải thích 2-3 câu) — `maxOutputTokens: 200`.
  Đổi model không cần sửa code: set secret `GEMINI_MODEL=<tên model khác>`.
- Yêu cầu đăng nhập (chống gọi ẩn danh tốn phí); validate độ dài chuỗi input (≤300 ký tự/trường).
- **Chưa set `GEMINI_API_KEY`** (thực trạng hiện tại) → trả `{error:"not_configured"}` (HTTP 200, không
  phải lỗi protocol) để client hiện thông báo thân thiện thay vì crash — verify ở `ai-tutor.spec.ts` (e2e).
- Test hàm thuần (validate/build prompt) ở `functions/ai-tutor-explain/index.test.ts` (Deno) — không gọi
  Gemini thật.

## Vì sao chấm ở server (D4)

Client chỉ gửi `{ questionId, answer }`. **Đáp án đúng không bao giờ rời server** — tra ở server rồi
mới chấm bằng `@synaptek/grading-engine`. Học sinh không xem trước đáp án, không sửa điểm. Client vẫn
chạy _cùng_ engine cho phản hồi tức thì khi luyện tập tự do (low-stakes).

## ✅ Đã verify (local — supabase 2.107 / deno 2.8)

- `supabase start` áp `0001_init.sql` **sạch**; `functions serve grade` chấm **đúng** các case (gồm
  `2x+4 ≡ 2(x+2)`), và response **không chứa đáp án** (đúng D4).
- **Engine chạy trên Deno** (engine không import gì → tương thích).
- **Bundling**: edge-runtime CHỈ mount `supabase/functions` nên KHÔNG import được `packages/` trực tiếp
  (gặp `BOOT_ERROR`). Giải pháp: `npm run sync:edge` sinh `_shared/grading-engine.ts` (artifact, banner
  cấm sửa tay), import map trỏ vào đó. `packages/` vẫn là nguồn-sự-thật; CI nên chạy sync +
  `git diff --exit-code` để chống lệch.

## Trạng thái tổng quan

M0–M4 đã đóng (`classes`/`assignments`/`parent_links` + RLS chéo vai trò từ M3/M4, xem CLAUDE.md +
Decision Log). Còn mở: M5 native (chặn bởi tài khoản EAS/Apple/Google, `docs/M5-NATIVE.md`) và các
hướng "Tương lai" (THCS/THPT, môn mới, LaTeX, gia sư AI mở rộng) — xem `docs/WORKING-NOTES.md` mục
"Còn mở".
