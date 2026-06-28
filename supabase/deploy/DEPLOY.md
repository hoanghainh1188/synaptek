# Deploy hosted (Supabase + Vercel)

Bản ghi cách deploy production hiện tại. Web = Vercel (static export), Backend = Supabase hosted.

## Supabase hosted

- **Project**: `synaptek` · ref `uolyirkydjgtmuogjtfr` · region `ap-northeast-1` (Tokyo).
- **DB**: áp toàn bộ migration `0001→0004`. Cách 1 (dashboard): dán `supabase/deploy/all-migrations.sql`
  vào **SQL Editor → Run** (project mới). Cách 2 (CLI/PAT): Management API query endpoint.
  Sinh lại file gộp:
  ```bash
  for f in supabase/migrations/000*.sql; do echo "-- $f"; cat "$f"; echo; done > supabase/deploy/all-migrations.sql
  ```
- **Edge Functions**: cần PAT (`https://supabase.com/dashboard/account/tokens`).
  ```bash
  SUPABASE_ACCESS_TOKEN=<PAT> supabase functions deploy grade grade-assignment review-scheduler \
    --project-ref uolyirkydjgtmuogjtfr
  ```
  `verify_jwt` lấy từ `config.toml` (grade/grade-assignment = true, review-scheduler = false).
  `SUPABASE_URL`/`ANON`/`SERVICE_ROLE_KEY` được Supabase **tự inject** cho Edge Functions — không set tay.
- **Auth settings (Dashboard → Authentication)**: bật **auto-confirm email** (tắt "Confirm email") để luồng
  đăng ký → đăng nhập-ngay chạy (chưa cấu hình SMTP). `Site URL` = URL Vercel.

> ⚠️ `import map` của Edge (`supabase/functions/deno.json`) dùng `npm:@supabase/supabase-js@2` (KHÔNG `jsr:`):
> bundler của `functions deploy` gặp **403** khi tải manifest JSR.

## Vercel (web static)

App = Expo Router static export. Deploy bằng **Build Output API** (prebuilt) cho chắc:

```bash
cd apps/app
# build với env Supabase HOSTED (không phải local):
EXPO_PUBLIC_SUPABASE_URL=https://uolyirkydjgtmuogjtfr.supabase.co \
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
  npx expo export -p web                 # → apps/app/dist

rm -rf .vercel/output && mkdir -p .vercel/output/static
cp -R dist/. .vercel/output/static/
printf '%s' '{ "version": 3, "routes": [ { "handle": "filesystem" }, { "src": "/.*", "dest": "/index.html" } ] }' > .vercel/output/config.json
npx vercel deploy --prebuilt --prod --yes
```

- SPA fallback (`/.* → /index.html`) để client-routing của Expo Router xử lý deep-link.
- Phải **tắt Deployment Protection** (Settings → Deployment Protection → Vercel Authentication = Disabled)
  để site public.
- **URL production**: https://synaptek-hoanghainh.vercel.app

## Hậu deploy (chưa làm)

- Cron `review-scheduler` (Supabase Cron + Vault key) — xem `supabase/README.md`.
- EAS `projectId` cho push token (expo-notifications) — hiện trả null (best-effort).
- **Thu hồi PAT** sau khi deploy xong (token chỉ dùng tạm).
