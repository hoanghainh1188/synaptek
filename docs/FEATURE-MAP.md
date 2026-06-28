# Bản đồ chức năng (Feature Map)

> Tổng hợp chức năng Synaptek theo trạng thái. **✅ đã ship · ⏳ chưa ship/dang dở · 🔮 tương lai.**
> Nguồn chi tiết: `docs/02-roadmap.md` (milestone) · `docs/00-architecture.md §0` (Decision Log) · `docs/WORKING-NOTES.md` (điểm tiếp tục).

## Mindmap

```mermaid
mindmap
  root((Synaptek<br/>Toán Tiểu học))
    🧠 Moat chấm
      ✅ mcq · true-false · numeric VN
      ✅ fraction · expression · fill-blank
      ✅ Client tức thì + Server ẩn đáp án
    🎒 Học sinh
      M1 Luyện tập ✅
        ✅ Chủ đề lớp 4 + ôn lớp 1-3
        ✅ Chấm tức thì + giải thích
        ✅ Auth tối thiểu + lưu tiến độ
      M2 Mastery & Lộ trình ✅
        ✅ Chẩn đoán + mastery BKT
        ✅ Lộ trình học gì tiếp
        ✅ Heatmap điểm yếu
        ✅ Gamification XP streak huy hiệu
        ✅ Ôn ngắt quãng + nhắc in-app
        ⏳ Push nhắc chờ M5
    🧑‍🏫 Giáo viên M3 ✅
      ✅ Lớp + mã mời + roster
      ✅ Giao bài + giới hạn nộp
      ✅ Chấm chính thức ẩn đáp án
      ✅ Ghi đè điểm + nhận xét audit
      ✅ Phân tích lớp + RLS chéo vai trò
      ⏳ Sửa xóa bài · đổi vai trò
    👪 Phụ huynh M4
      ✅ Liên kết phụ huynh - con (mã)
      ✅ Theo dõi tiến độ con (read-only)
      🔮 Giao bài tại nhà
    📚 Nội dung D14
      ✅ Pipeline JSON + validate
      ⏳ Khối lượng câu hỏi còn mỏng
      🔮 Authoring UI + đủ lớp 1-5
    ⚙️ Hạ tầng
      ✅ Monorepo + CI + Spec Kit
      ✅ Supabase BaaS + Edge Functions
      ✅ Deploy auto Web + Backend
      ⏳ cron review-scheduler
      🔮 M5 Native EAS + push + offline
    🔭 Tương lai xa
      🔮 THCS THPT
      🔮 Môn khác Lý Hóa Anh
      🔮 Chấm trình bày từng bước + LaTeX
      🔮 Gia sư AI
```

## Theo trạng thái (flowchart)

```mermaid
flowchart LR
  S([Synaptek])
  S --> SHIPPED["✅ Đã ship"]
  S --> WIP["⏳ Chưa ship / dang dở"]
  S --> FUTURE["🔮 Tương lai"]

  SHIPPED --> A1["Moat: chấm tương đương<br/>client + server ẩn đáp án"]
  SHIPPED --> A2["M1 HS: luyện tập + chấm tức thì + auth"]
  SHIPPED --> A3["M2: BKT · lộ trình · heatmap · gamification · ôn ngắt quãng"]
  SHIPPED --> A4["M3 GV: lớp · giao bài · chấm chính thức · ghi đè · phân tích · RLS"]
  SHIPPED --> A5["Giới hạn nộp bài hạn/số lần/timer"]
  SHIPPED --> A6["Deploy hosted AUTO: Vercel + Supabase"]

  WIP --> B1["Push thật cần EAS + native"]
  WIP --> B2["cron review-scheduler lên lịch"]
  WIP --> B3["GV sửa/xóa bài · đổi vai trò"]
  WIP --> B4["Nội dung câu hỏi mỏng + authoring UI"]
  WIP --> B5["Verify iOS/Android"]

  SHIPPED --> A7["M4 Phụ huynh: liên kết PH-con + theo dõi read-only (đủ 3 vai trò)"]
  FUTURE --> C1["M4+: PH giao bài tại nhà"]
  FUTURE --> C2["M5 Native EAS · offline · push"]
  FUTURE --> C3["THCS/THPT · môn khác · chấm từng bước + LaTeX · gia sư AI"]
```

## Chú thích trạng thái

| Ký hiệu | Nghĩa                                                                       |
| ------- | --------------------------------------------------------------------------- |
| ✅      | Đã ship (đã làm + test/verify; phần lớn đã merge `develop` + deploy hosted) |
| ⏳      | Chưa ship hoặc dang dở (đã có nền nhưng chưa hoàn thiện / chờ điều kiện)    |
| 🔮      | Tương lai (chưa bắt đầu)                                                    |

### Ghi chú "⏳ dang dở" — vì sao chưa làm

- **Push thật + cron**: gắn với app native (token push). Web-only hiện chưa có token → hoãn **M5**.
- **Nội dung câu hỏi**: mới ~21 câu — Rủi ro #1 (khối lượng + bản quyền). Cần biên soạn thêm; authoring UI để M4.
- **GV sửa/xóa bài, đổi vai trò trong hồ sơ**: tính năng nhỏ, bổ sung khi cần.
- **iOS/Android**: mới verify trên web; native kiểm ở M5.
