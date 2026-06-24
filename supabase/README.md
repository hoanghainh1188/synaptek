# supabase/ — backend config-as-code

Backend của Synaptek là **Supabase BaaS + Edge Functions** (D3/D4). Thư mục này là nguồn-sự-thật
dạng file; áp lên project thật bằng Supabase CLI.

```
supabase/
├── config.toml              cấu hình local + khai báo function `grade` (verify_jwt)
├── migrations/
│   └── 0001_init.sql        profiles · attempts · skill_mastery + RLS + trigger tạo profile
└── functions/
    ├── deno.json            import map: @synaptek/grading-engine → ./_shared/grading-engine.ts
    ├── _shared/             bản engine TỰ SINH (npm run sync:edge) — edge-runtime chỉ mount thư mục này
    └── grade/index.ts       chấm chính thức server-side, dùng lại engine (consumer #2)
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

## Chưa làm (migration sau, M3)

`classes` · `class_members` · `assignments` · `assignment_submissions` · `parent_links` — RLS chéo
vai trò (giáo viên thấy HS trong lớp; phụ huynh thấy con) sẽ thiết kế ở M3.
