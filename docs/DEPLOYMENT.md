# Hướng dẫn Deploy (Supabase + Vercel)

> Tài liệu này: (1) kiến trúc deploy, (2) cấu trúc repo liên quan, (3) deploy, (4) **GitHub auto-deploy**
> (Vercel ĐÃ tự động; Supabase còn thủ công). Chi tiết lệnh CLI: `supabase/deploy/DEPLOY.md`.
>
> **TL;DR**: Web **tự deploy** (Vercel ↔ GitHub) VÀ Backend **tự deploy** (GitHub Action) khi merge vào `develop`.

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

| Thư mục                                 | Vai trò khi deploy                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `apps/app/`                             | App Expo → `npx expo export -p web` ra `apps/app/dist` (tĩnh) → Vercel                   |
| `apps/app/.env.production.local`        | **(local, gitignored)** env hosted cho build web — xem §3                                |
| `packages/*`                            | Logic thuần (engine/curriculum/learning-path/classroom) — bundle vào web + vào `_shared` |
| `content/`                              | Câu hỏi/curriculum (D6) — bundle vào web khi build                                       |
| `supabase/migrations/*.sql`             | Schema + RLS — áp lên DB hosted                                                          |
| `supabase/functions/*`                  | Edge Functions; `_shared/` là artifact `npm run sync:edge`                               |
| `supabase/config.toml`                  | `verify_jwt` mỗi function (đọc khi `functions deploy`)                                   |
| `.github/workflows/ci.yml`              | **CHỈ test** (format/test/build/e2e + deno) — KHÔNG deploy                               |
| `.github/workflows/deploy-supabase.yml` | **Auto-deploy backend**: `db push` + `functions deploy` khi push `develop`               |
| `vercel.json` (gốc repo)                | Cấu hình **Vercel auto-build** từ Git: buildCommand/outputDirectory + SPA rewrite        |

## 3. Deploy

- **Web (Vercel)** + **Backend (Supabase)**: **TỰ ĐỘNG** khi merge `develop` — xem §4.
- Mục §3.A/§3.B dưới chỉ là cách **làm tay khi khẩn cấp** (Git build hỏng).

### A. Supabase (thủ công — chỉ khi khẩn cấp)

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

### B. Vercel (THỦ CÔNG — chỉ khi khẩn cấp; bình thường dùng auto §4)

> ⚠️ KHÔNG dùng song song với auto-deploy (gây lệch). Chỉ dùng khi Git build hỏng cần đẩy gấp.

```bash
cd apps/app
# env hosted cho build (file gitignored, ưu tiên cao nhất của Expo):
printf 'EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co\nEXPO_PUBLIC_SUPABASE_ANON_KEY=<anon>\n' > .env.production.local
rm -rf dist && npx expo export -p web                 # → dist (nhúng env — phải qua file .env*, KHÔNG biến shell rời)
# deploy prebuilt (Build Output API) + SPA fallback:
rm -rf .vercel/output && mkdir -p .vercel/output/static && cp -R dist/. .vercel/output/static/
printf '%s' '{ "version": 3, "routes": [ { "handle": "filesystem" }, { "src": "/.*", "dest": "/index.html" } ] }' > .vercel/output/config.json
npx vercel deploy --prebuilt --prod --yes
```

## 4. Auto-deploy

### Web (Vercel) — ✅ ĐÃ TỰ ĐỘNG

Project Vercel `synaptek` **nối GitHub repo** → mỗi push tự build. **Cấu hình đã thiết lập** (để build
monorepo Expo đúng):

1. **`vercel.json` ở GỐC repo** (đã commit):
   - `buildCommand`: `cd apps/app && npx expo export -p web`
   - `outputDirectory`: `apps/app/dist`
   - `rewrites`: `/(.*) → /index.html` (SPA fallback — deep-link không 404)
2. **Project Settings (Vercel)**:
   - `Root Directory` = **gốc repo** (KHÔNG phải `apps/app`) → để `npm install` chạy ở root, link được
     workspace `@synaptek/*` (nếu để `apps/app` sẽ lỗi _"@synaptek/... could not be found"_).
   - **Environment Variables** (Production + Preview): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
     → Auto-build dùng env này (KHÔNG dùng `.env.production.local`; file đó chỉ cho deploy tay §3.B).
   - **Deployment Protection** = Disabled (để site public).
3. **Production branch** = `develop` (Vercel theo nhánh mặc định của repo). Đổi ở Settings → Git.

**Luồng**: merge PR vào `develop` → **production** tự deploy (`synaptek-hoanghainh.vercel.app`); PR mở →
**preview** deploy riêng. Đổi cấu hình build → sửa `vercel.json` (commit) hoặc Project Settings (dashboard/API).

> Lưu ý: mọi push `develop` đều rebuild web (kể cả đổi docs). Muốn bỏ qua khi không đụng web → cấu hình
> **Ignored Build Step** trong Vercel (vd `git diff --quiet HEAD^ HEAD -- apps/app packages content vercel.json`).

### Backend (Supabase) — ✅ ĐÃ TỰ ĐỘNG

**GitHub Action `.github/workflows/deploy-supabase.yml`** chạy khi push `develop` đụng:
`supabase/**` · `content/questions/**` · `packages/{grading-engine,learning-path,classroom}/**` ·
`scripts/sync-edge-engine.mjs`. Có thể chạy tay qua **Actions → Deploy Supabase → Run workflow**.

Các bước: `npm run sync:edge` → `supabase link` → **baseline** (`migration repair --status applied
0001 0002 0003 0004` — vì 0001–04 đã áp bằng SQL trực tiếp, chưa vào hệ migration) → `db push` (áp
migration mới) → `functions deploy grade grade-assignment review-scheduler`.

**GitHub Secrets** (đã nạp, mã hoá): `SUPABASE_ACCESS_TOKEN` (PAT) · `SUPABASE_DB_PASSWORD` ·
`SUPABASE_PROJECT_REF`. Đổi/rotate → cập nhật secret (`gh secret set <NAME>` hoặc dashboard GitHub).

> Migration mới: thêm `supabase/migrations/000N_*.sql`, push `develop` → tự áp. Auth settings (auto-confirm,
> site_url) làm **một lần** trên dashboard (không qua workflow).

### Bảo mật

- KHÔNG commit secret. `anon key` public-an-toàn (nhúng client) nhưng để ở **Vercel env**.
- **service_role key** + **PAT** tuyệt đối không commit / không để repo. PAT chỉ tạo tạm khi deploy rồi **revoke**.

## 5. Hiện trạng (production)

- **Web** (Vercel) + **Backend** (Supabase) đều **auto-deploy** từ `develop`. CI test mỗi PR.
- Web: **https://synaptek-hoanghainh.vercel.app** · Supabase ref `uolyirkydjgtmuogjtfr`.

### Hoãn sang M5 (native) — có lý do

- **cron `review-scheduler` + EAS `projectId`**: cron chỉ để gửi **push** "đến giờ ôn"; push cần EAS
  projectId + **app native** mới có token. Hiện web-only → chưa có token → cron chạy cũng không gửi gì.
  Nhắc **in-app** "đến hạn ôn" đã hoạt động (suy từ `due_at` phía client, không cần cron). → Làm cả hai
  ở **M5** (cùng EAS Build) mới có giá trị.
