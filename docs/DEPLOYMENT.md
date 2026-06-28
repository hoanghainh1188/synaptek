# Hướng dẫn Deploy (Supabase + Vercel)

> Tài liệu này: (1) kiến trúc deploy, (2) cấu trúc repo liên quan, (3) các bước deploy thủ công,
> (4) giải đáp **GitHub integration / auto-deploy**. Chi tiết lệnh CLI: `supabase/deploy/DEPLOY.md`.

## 1. Kiến trúc deploy

```
                 build (Expo static export)            deploy
  apps/app  ───────────────────────────────►  apps/app/dist  ──►  VERCEL (web tĩnh, public)
     │  (nhúng EXPO_PUBLIC_SUPABASE_* lúc build)                        │ gọi HTTPS
     │                                                                  ▼
  content/ (câu hỏi) ─ bundle vào web                          SUPABASE hosted
  packages/* (logic thuần) ─ bundle vào web                    ├─ Postgres + RLS (migrations)
                                                               ├─ Edge Functions (grade*, review-scheduler)
  supabase/migrations/*.sql  ──────────────────────────────►  └─ Auth (email/mật khẩu)
  supabase/functions/*       ──────────────────────────────►
```

- **Web (Vercel)**: chỉ là file tĩnh. Mọi cấu hình backend nhúng vào lúc **build** qua biến
  `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (anon key là public — an toàn nhúng client).
- **Backend (Supabase)**: DB schema (migrations), Edge Functions, Auth settings.

## 2. Cấu trúc repo liên quan deploy

| Thư mục                          | Vai trò khi deploy                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `apps/app/`                      | App Expo → `npx expo export -p web` ra `apps/app/dist` (tĩnh) → Vercel                   |
| `apps/app/.env.production.local` | **(local, gitignored)** env hosted cho build web — xem §3                                |
| `packages/*`                     | Logic thuần (engine/curriculum/learning-path/classroom) — bundle vào web + vào `_shared` |
| `content/`                       | Câu hỏi/curriculum (D6) — bundle vào web khi build                                       |
| `supabase/migrations/*.sql`      | Schema + RLS — áp lên DB hosted                                                          |
| `supabase/functions/*`           | Edge Functions; `_shared/` là artifact `npm run sync:edge`                               |
| `supabase/config.toml`           | `verify_jwt` mỗi function (đọc khi `functions deploy`)                                   |
| `.github/workflows/ci.yml`       | **CHỈ test** (format/test/build/e2e) — **KHÔNG deploy**                                  |

## 3. Deploy thủ công (cách đang dùng)

**Thứ tự bắt buộc: Supabase trước (lấy URL+anon) → Vercel sau.**

### A. Supabase

```bash
# 1) Đăng nhập (1 lần): mở trình duyệt
supabase login                       # hoặc headless: SUPABASE_ACCESS_TOKEN=<PAT>

# 2) DB: áp migrations lên project hosted
supabase link --project-ref <ref>    # cần mật khẩu DB
supabase db push
#   (hoặc dán supabase/deploy/all-migrations.sql vào Dashboard → SQL Editor — không cần mật khẩu DB)

# 3) Edge Functions
npm run sync:edge                    # đồng bộ _shared (BẮT BUỘC)
supabase functions deploy grade grade-assignment review-scheduler --project-ref <ref>
```

**Auth settings (Dashboard → Authentication)** — làm 1 lần: bật **auto-confirm email**; `Site URL` = URL Vercel.

### B. Vercel

```bash
cd apps/app
# env hosted cho build (file gitignored, ưu tiên cao nhất của Expo):
printf 'EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co\nEXPO_PUBLIC_SUPABASE_ANON_KEY=<anon>\n' > .env.production.local
rm -rf dist && npx expo export -p web                 # → dist (nhúng env)

# deploy prebuilt (Build Output API) + SPA fallback:
rm -rf .vercel/output && mkdir -p .vercel/output/static && cp -R dist/. .vercel/output/static/
printf '%s' '{ "version": 3, "routes": [ { "handle": "filesystem" }, { "src": "/.*", "dest": "/index.html" } ] }' > .vercel/output/config.json
npx vercel deploy --prebuilt --prod --yes
```

> **Quan trọng**: Expo chỉ nhúng env từ **file `.env*`**, KHÔNG nhận biến shell rời. Phải dùng
> `.env.production.local`. Kiểm tra đã nhúng: `grep <ref>.supabase.co dist/_expo/static/js/web/*.js`.
> Lần đầu phải **tắt Deployment Protection** trong Vercel (Settings → Deployment Protection).

## 4. GitHub integration & auto-deploy — GIẢI ĐÁP

**Hiện tại: deploy THỦ CÔNG bằng CLI. Commit/đẩy lên GitHub KHÔNG tự deploy.**

- `.github/workflows/ci.yml` chỉ **chạy test** khi có PR/đẩy lên `develop` — **không** deploy đi đâu.
- Project Vercel + Supabase hiện **chưa nối** với GitHub repo (ta deploy bằng CLI/token).

### Repo cần như thế nào? Có cần làm gì với luồng Git?

**Không bắt buộc gì** nếu giữ deploy thủ công. Nếu muốn **auto-deploy khi push**, cân nhắc:

**Vercel ↔ GitHub** (auto-deploy web mỗi push):

- Nối repo trong Vercel → **Settings**: `Root Directory = apps/app`; build command `npx expo export -p web`; `Output Directory = dist`; bật corepack/monorepo nếu cần (workspace deps).
- Đặt env `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` trong **Vercel → Settings → Environment Variables** (KHÔNG dùng `.env.production.local` nữa).
- Mỗi push lên nhánh production (vd `develop` hoặc `main`) → Vercel tự build + deploy; PR → preview deploy.
- ⚠️ Vì là monorepo + Expo, build trên Vercel cần cấu hình đúng; bản hiện tại deploy **prebuilt qua CLI** (không qua Git) nên chưa bị ràng buộc này.

**Supabase ↔ GitHub** (auto migrations + functions):

- Supabase có GitHub integration (branching) hoặc dùng **GitHub Actions** (`supabase db push` + `functions deploy` với `SUPABASE_ACCESS_TOKEN` lưu ở GitHub Secrets).
- Phức tạp hơn (secrets, môi trường) → nên làm sau khi quy trình ổn định.

### Khuyến nghị

1. **Giai đoạn này**: giữ **deploy thủ công có kiểm soát** (đơn giản, không bất ngờ; CI vẫn gác chất lượng mỗi PR).
2. **Khi muốn tự động**: bật **Vercel Git** trước (web — dễ + giá trị cao), Supabase Actions sau.
3. **Bảo mật**: KHÔNG commit secret. `anon key` public-an-toàn nhưng theo convention để ở **Vercel env**;
   **service_role key** và **PAT** tuyệt đối không commit/không để trong repo.

## 5. Hiện trạng (production)

- Web: **https://synaptek-hoanghainh.vercel.app** · Supabase ref `uolyirkydjgtmuogjtfr`.
- Chưa làm (không chặn): cron `review-scheduler` (Supabase Cron + Vault), EAS `projectId` cho push.
