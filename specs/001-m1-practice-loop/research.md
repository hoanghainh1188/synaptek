# Research — M1 Vòng luyện tập học sinh (Phase 0)

Giải các điểm cần quyết trong Technical Context. Mỗi mục: **Quyết định / Lý do / Phương án loại**.

## R1. Render công thức Toán (universal web + native)

- **Quyết định**: **Component tự vẽ** (`FractionView`, `ExpressionView`) bằng `View`/`Text` của React
  Native + NativeWind; phân số = tử trên / gạch ngang (border) / mẫu dưới; biểu thức = text inline với
  mũ (superscript) cho lũy thừa. Không dùng LaTeX đầy đủ ở M1.
- **Lý do**: Toán tiểu học chủ yếu đơn giản (phân số, biểu thức ngắn). Component tự vẽ chạy y hệt trên
  web + native, nhẹ, không phụ thuộc engine LaTeX, dễ test snapshot. Phù hợp design-quality (kiểm soát
  typography/màu).
- **Phương án loại**: KaTeX (web-only, cần WebView trên native → lệch trải nghiệm); `react-native-math-view`
  (nặng, phụ thuộc native, kém universal); MathJax (chậm, thừa cho cấp tiểu học). → Để dành nếu sau cần
  LaTeX cho THCS/THPT.

## R2. Nạp nội dung (content loading)

- **Quyết định**: **Bundle JSON vào app** ở M1 — `content/**` import qua Metro (hoặc generated index),
  validate bằng `@synaptek/curriculum` khi load.
- **Lý do**: Offline-capable (đúng edge case mất mạng), đơn giản, không cần round-trip mạng cho luyện
  tập tự do. Hợp "chấm tức thì client".
- **Trade-off**: Đáp án nằm trong bundle client → chỉ chấp nhận cho **luyện tập low-stakes** (M1). Bài
  **có điểm** (giáo viên giao) sẽ chấm **server-side**, đề trả không kèm đáp án (D4) — thuộc **M3**.
- **Phương án loại**: Fetch từ Supabase/Storage mỗi phiên (thêm độ trễ + phụ thuộc mạng, chưa cần ở M1).

## R3. Auth + lưu session (Supabase trên Expo)

- **Quyết định**: `@supabase/supabase-js` với **storage adapter** = `expo-secure-store` (token) /
  `AsyncStorage`; email + mật khẩu (D16). Profile tự tạo qua trigger `handle_new_user` (đã có ở 0001).
  Guest: luyện được, nhắc đăng nhập để lưu; khi đăng nhập, các attempt tạm (nếu có) được đẩy lên.
- **Lý do**: Tối thiểu, dùng hạ tầng đã verify (0001_init.sql + RLS). `autoRefreshToken` + `persistSession`.
- **Phương án loại**: `@supabase/ssr` (dành cho Next.js server — không hợp Expo); OAuth/social (để sau);
  magic-link (UX kém cho học sinh nhỏ).

## R4. Styling & design tokens

- **Quyết định**: **NativeWind v4** (Tailwind cho RN) + một file `theme/tokens.ts` (màu theo mạch kiến
  thức: Số=xanh dương, Hình học=cam, Đo lường=xanh lá; spacing/typography/duration). Dùng chung web+native.
- **Lý do**: Một hệ token cho cả 2 nền tảng; tránh hardcode; hợp anti-template (design-quality). Class
  utility nhanh, vẫn cho phép component có chủ đích.
- **Phương án loại**: StyleSheet thuần (lặp lại, khó token hóa); Tamagui (mạnh nhưng nặng/learning-curve,
  thừa cho M1).

## R5. Quản lý state

- **Quyết định**: **TanStack Query** cho server state (attempts/tiến độ ↔ Supabase, stale-while-revalidate,
  optimistic khi lưu attempt). **Session luyện tập** = reducer THUẦN ở `lib/session.ts` (không phụ thuộc
  React), component bọc bằng `useReducer`. URL/route param giữ `topicId` đang luyện.
- **Lý do**: Tách server state khỏi client state (web patterns); session là logic thuần → test bằng Vitest
  không cần render; derive thay vì lưu trùng.
- **Phương án loại**: Redux/Zustand cho mọi thứ (thừa); nhồi server state vào store client (chống guideline).

## R6. Chọn câu trong một phiên (M1)

- **Quyết định**: `buildSession(topicId, opts)` trong `@synaptek/curriculum` — lấy câu theo chủ đề, **xáo
  trộn đơn giản** (hoặc tuần tự), mặc định **10 câu** (cấu hình). Chưa chọn theo mastery.
- **Lý do**: Đủ cho M1; chọn theo mastery/spaced-repetition là M2 (`learning-path`).
- **Phương án loại**: Adaptive selection ngay (phụ thuộc mastery model chưa có → đẩy phạm vi M1).

## R7. UX nhập đáp án trên mobile

- **Quyết định**: Bàn phím số **tùy biến** (numeric pad + nút `/` cho phân số, `,` thập phân) cho loại
  numeric/fraction; MCQ = nút chọn lớn; fill-blank = nhiều ô. Vùng chạm ≥ 44pt.
- **Lý do**: Bàn phím hệ thống gõ phân số/`,` bất tiện cho trẻ; pad tùy biến nhất quán web+native.
- **Phương án loại**: TextInput thường (UX kém cho phân số/đáp số trên mobile).

## R8. Vị trí types nội dung & tích hợp Edge Function

- **Quyết định**: Types nội dung (Question/Curriculum) ở `@synaptek/curriculum` (nguồn-sự-thật schema).
  M1 chỉ **client** dùng. Edge Function `grade` **chưa** đọc content thật ở M1 (giữ stub) — sẽ nối ở M3
  khi cần chấm chính thức (lúc đó đồng bộ types/loader vào `_shared` như D13).
- **Lý do**: M1 không cần server chấm; tránh kéo phức tạp bundling edge sớm (D13).
- **Phương án loại**: Nối content vào edge ngay ở M1 (chưa cần, tăng rủi ro bundling).

## Tóm tắt phụ thuộc mới cần thêm

`@synaptek/curriculum` (workspace) · `nativewind` + `tailwindcss` · `@supabase/supabase-js` +
`@react-native-async-storage/async-storage` (+ `expo-secure-store`) · `@tanstack/react-query` ·
`@testing-library/react-native` (dev). Phiên bản chốt khi cài (Context7/docs).
