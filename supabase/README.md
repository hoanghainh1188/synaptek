# supabase/ — backend config-as-code

Backend của Synaptek là **Supabase BaaS + Edge Functions** (D3/D4). Thư mục này là nguồn-sự-thật
dạng file; áp lên project thật bằng Supabase CLI.

```
supabase/
├── config.toml              cấu hình local + khai báo function `grade` (verify_jwt)
├── migrations/
│   └── 0001_init.sql        profiles · attempts · skill_mastery + RLS + trigger tạo profile
└── functions/
    ├── deno.json            import map: @synaptek/grading-engine → ../../packages/grading-engine/src
    └── grade/index.ts       chấm chính thức server-side, dùng lại engine (consumer #2)
```

## Chạy & deploy (cần Supabase CLI — chưa cài ở môi trường này)

```bash
# Cài CLI (một trong các cách): brew install supabase/tap/supabase | npx supabase ...
supabase start                         # dựng Postgres + Auth + Edge runtime cục bộ (cần Docker ✓)
supabase functions serve grade         # chạy thử Edge Function `grade`

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

## Vì sao chấm ở server (D4)

Client chỉ gửi `{ questionId, answer }`. **Đáp án đúng không bao giờ rời server** — tra ở server rồi
mới chấm bằng `@synaptek/grading-engine`. Học sinh không xem trước đáp án, không sửa điểm. Client vẫn
chạy _cùng_ engine cho phản hồi tức thì khi luyện tập tự do (low-stakes).

## ⚠️ Cần verify khi có CLI

1. **Bundling import ngoài `supabase/functions`**: Edge Function import `@synaptek/grading-engine` từ
   `packages/` (ngoài thư mục functions) qua import map. Đa số bản Supabase CLI mới bundle được file ở
   gốc monorepo; nếu `functions deploy` báo lỗi → fallback: publish engine lên **JSR/npm** rồi import
   theo version, hoặc vendor vào `functions/_shared/`. (Engine zero-dep nên mọi cách đều nhẹ.)
2. **`grading-engine` chạy trên Deno**: engine **không import gì** (chỉ JS thuần) → tương thích Deno;
   chỉ cần xác nhận bằng `functions serve`.

## Chưa làm (migration sau, M3)

`classes` · `class_members` · `assignments` · `assignment_submissions` · `parent_links` — RLS chéo
vai trò (giáo viên thấy HS trong lớp; phụ huynh thấy con) sẽ thiết kế ở M3.
