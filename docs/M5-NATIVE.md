# M5 — Native & App Store (hướng dẫn)

> Mục tiêu: build app iOS/Android (EAS), push nhắc ôn thật, offline cơ bản, lên store.
> **EAS Build chạy trên cloud → KHÔNG cần Mac.** iOS cần Apple Developer ($99/năm); Android lên Play $25 một lần.

## Đã chuẩn bị sẵn (M5.0 — trong repo)

- `apps/app/app.json`: `ios.bundleIdentifier` + `android.package` = **`com.synaptek.app`** · plugin
  `expo-notifications` · icon/splash.
- `apps/app/eas.json`: profiles **development** (dev client) · **preview** (APK test nội bộ) · **production**.
- `expo-notifications` + `apps/app/src/lib/notifications.ts` (registerForPush best-effort) — sẵn lấy token khi có EAS projectId.
- Edge `review-scheduler` (nhắc ôn, D21) + **cron SQL** ở `supabase/README.md` §"Job nền".

## Việc của bạn (cần tài khoản + tương tác — tôi đang headless không làm được)

### M5.1 — Android APK test (rẻ nhất: chỉ cần EAS free)

```bash
npm i -g eas-cli
cd apps/app
eas login                      # tài khoản Expo (free)
eas init                       # tạo projectId → tự ghi vào app.json (extra.eas.projectId)
eas build -p android --profile preview   # build APK trên cloud → tải về cài máy Android thật
```

> Sau `eas init` có **projectId** → commit `app.json` (tôi/bạn) để push token hoạt động.

### M5.2 — Push thật

1. `eas init` đã tạo projectId → `registerForPush` lấy được Expo push token (lưu `push_tokens`).
2. Lên lịch `review-scheduler`: làm theo `supabase/README.md` §cron (pg_cron + pg_net + service-role ở Vault).
3. Test: tạo `skill_mastery.due_at ≤ now` → cron chạy → nhận push trên device.

- Android push: EAS lo FCM credentials khi build. iOS push: cần Apple Developer (APNs key) — `eas credentials`.

### M5.3 — iOS (cần Apple Developer $99/năm)

```bash
eas build -p ios --profile preview      # hoặc production
eas submit -p ios                        # nộp TestFlight/App Store
```

### M5.4 — Offline cơ bản (tôi làm khi vào M5.1, cần device để kiểm)

- Persist TanStack Query (AsyncStorage) + dùng `content/` bundle khi mất mạng (đề/luyện tập offline; nộp khi có mạng lại).

### M5.5 — Lên store

- Android: `eas submit -p android` (Google Play $25 một lần). iOS: App Store Connect.

## Lưu ý

- `app.json` `extra.eas.projectId` do `eas init` ghi — **chỉ có sau khi bạn chạy** (tôi không tạo được vì cần đăng nhập EAS).
- Bundle id `com.synaptek.app` có thể đổi trước lần build đầu (sau khi build/submit thì KHÓ đổi).
- Web (Vercel) + backend (Supabase) **không đổi** — M5 chỉ thêm đường native.
