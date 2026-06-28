# Feature Specification: M4 — Phụ huynh (liên kết & theo dõi con)

**Feature Branch**: `005-parent-monitoring`
**Created**: 2026-06-29
**Status**: Draft
**Input**: Sau M3 (giáo viên vận hành lớp), M4 mở vai trò **PHỤ HUYNH** → đủ **3 vai trò**. Phạm vi đợt này:
**liên kết PH–con** (con tạo mã, PH nhập) + **theo dõi tiến độ con tại nhà** (chỉ xem: mastery/điểm yếu,
luyện tập, XP/streak, kết quả bài được giao). **Giao bài tại nhà để đợt sau.** RLS PH–con đầy đủ.

> Decision Log liên quan: **D2** (logic = package thuần), **D5/D13** (ranh giới repo + edge `_shared`),
> **D22** (vai trò `profiles.role`; quyền trên HS đến từ **quan hệ**, không từ role), **D24** (RLS chéo
> vai trò qua helper `SECURITY DEFINER`). Quyết định mới M4 (sẽ ghi **D26**): liên kết PH–con + RLS đọc
> chéo PH→con (read-only). Bám Constitution; **KHÔNG** đổi hành vi M1/M2/M3.

## Clarifications

### Session 2026-06-29

- Q: Liên kết PH–con thế nào? → A: **Con tạo mã → PH nhập mã** (tái dùng pattern mã mời; con kiểm soát/đồng ý).
- Q: PH được làm gì với tài khoản con? → A: **Chỉ XEM (read-only)** tiến độ/điểm yếu/kết quả bài; không sửa.
- Q: Số lượng liên kết? → A: **Nhiều–nhiều** (1 con ↔ nhiều PH như ba+mẹ; 1 PH ↔ nhiều con). PK `(parent_id, student_id)`.
- Q: "Giao bài tại nhà" làm đợt này? → A: **Để sau** (M4 = liên kết + theo dõi; gọn, đủ 3 vai trò).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Liên kết Phụ huynh với con (Priority: P1) 🎯 MVP

Người dùng đăng ký vai trò **Phụ huynh**. Học sinh (con) tạo **mã liên kết** trong hồ sơ; PH nhập mã →
liên kết. PH thấy **danh sách con** đã liên kết; con thấy PH đang theo dõi mình.

**Why this priority**: Liên kết là nền tảng cho mọi tính năng PH. Tự nó có giá trị (PH kết nối được với
con) và là MVP của vai trò PH.

**Independent Test**: Tạo tài khoản PH; tài khoản HS tạo mã; PH nhập mã → con xuất hiện trong "Con của
tôi". RLS: PH/HS khác **không** thấy liên kết hay dữ liệu của cặp này.

**Acceptance Scenarios**:

1. **Given** người dùng chọn vai trò PH, **When** đăng nhập, **Then** thấy khu vực "Con của tôi" (rỗng ban đầu).
2. **Given** HS mở hồ sơ, **When** tạo mã liên kết, **Then** nhận **mã khó đoán**; tạo lại được (thu hồi mã cũ).
3. **Given** PH có mã hợp lệ, **When** nhập mã, **Then** liên kết tạo ngay; con xuất hiện trong "Con của tôi".
4. **Given** mã sai/đã thu hồi, **When** PH nhập, **Then** bị từ chối với thông báo rõ.
5. **Given** PH/HS không liên quan, **When** cố truy cập, **Then** **không** thấy liên kết/dữ liệu cặp này (RLS).
6. **Given** một con đã liên kết, **When** PH (hoặc con) gỡ liên kết, **Then** quan hệ bị xoá; dữ liệu cá nhân con giữ nguyên.

---

### User Story 2 - Theo dõi tiến độ con (Priority: P2)

Phụ huynh xem **bảng theo dõi** cho từng con: mastery/điểm yếu (heatmap), tiến độ luyện tập (số câu/độ
chính xác), gamification (XP/streak), và **kết quả bài được giao** (điểm cuối + nhận xét của GV). **Chỉ
đọc** — PH không sửa gì.

**Why this priority**: Đây là giá trị cốt lõi PH mong đợi. Phụ thuộc US1 (liên kết).

**Independent Test**: Con có dữ liệu luyện tập + một bài nộp đã chấm; PH liên kết → mở bảng theo dõi con →
thấy điểm yếu, XP/streak, điểm bài. PH **không** thấy/sửa được gì của HS không phải con mình.

**Acceptance Scenarios**:

1. **Given** PH đã liên kết con có dữ liệu, **When** mở bảng theo dõi, **Then** thấy **điểm yếu** (kỹ năng
   mastery thấp), **XP/streak**, **tổng quan luyện tập**.
2. **Given** con có bài được giao đã chấm, **When** PH xem, **Then** thấy **điểm cuối + nhận xét** (read-only).
3. **Given** PH mở dữ liệu của HS **không phải con mình**, **When** truy vấn, **Then** bị chặn (RLS — 0 dòng).
4. **Given** PH ở chế độ chỉ-xem, **When** thao tác, **Then** **không** có hành động sửa/ghi nào trên dữ liệu con.

---

### Edge Cases

- **Mã liên kết**: hết hạn/thu hồi/nhập sai → từ chối rõ ràng; mã khó đoán (không tuần tự lộ).
- **Tự liên kết**: người dùng nhập mã của chính mình → từ chối (PH ≠ con).
- **Gỡ liên kết**: PH hoặc con gỡ → mất quyền xem; dữ liệu luyện tập của con giữ nguyên.
- **Đổi vai trò**: HS đổi sang PH (hoặc ngược) → không leo thang quyền chéo ngoài quan hệ liên kết.
- **Con chưa có dữ liệu**: bảng theo dõi hiện trạng thái rỗng thân thiện.
- **Regression**: HS/GV (M1–M3) **không đổi hành vi**; chấm/luyện tập giữ nguyên.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001 (Vai trò PH)**: Hệ thống MUST hỗ trợ `profiles.role = 'parent'` (đã có ở 0001), tự chọn khi
  đăng ký / đổi trong hồ sơ. UI/điều hướng PH chỉ mở cho `parent`.
- **FR-002 (Con tạo mã)**: HS MUST tạo được **mã liên kết phụ huynh** (khó đoán) trong hồ sơ; **thu hồi /
  tạo lại** được.
- **FR-003 (PH nhập mã)**: PH nhập **mã hợp lệ** MUST tạo liên kết ngay; mã sai/thu hồi → từ chối. **Không**
  cho tự liên kết chính mình.
- **FR-004 (Danh sách con)**: PH MUST xem được danh sách con đã liên kết; HS MUST xem được PH đang theo dõi.
- **FR-005 (Gỡ liên kết)**: PH **và** HS MUST gỡ được liên kết của mình; gỡ KHÔNG xoá dữ liệu cá nhân con.
- **FR-006 (Nhiều–nhiều)**: Một HS MAY có nhiều PH; một PH MAY có nhiều con.
- **FR-007 (Theo dõi — chỉ đọc)**: PH MUST xem (read-only) của **mỗi con đã liên kết**: điểm yếu/mastery
  (heatmap), XP/streak, tổng quan luyện tập, và kết quả bài được giao (điểm cuối + nhận xét).
- **FR-008 (Không sửa)**: PH MUST KHÔNG sửa/ghi bất kỳ dữ liệu nào của con (attempts/mastery/submissions/lớp).
- **FR-009 (RLS PH–con)**: Hệ thống MUST đảm bảo PH chỉ đọc dữ liệu của **con đã liên kết**; HS chỉ thấy
  dữ liệu của mình + PH của mình; **không** rò rỉ chéo cặp/chéo vai trò.
- **FR-010 (Migration)**: Trạng thái M4 ở **migration `0005`**: `parent_links` + cột mã liên kết trên
  `profiles` + RLS + helper `SECURITY DEFINER` + RPC liên kết; M1=`0001`…M3=`0004` giữ nguyên.
- **FR-011 (Logic thuần)**: Sinh/định-dạng mã liên kết MUST **tái dùng** `@synaptek/classroom` (invite) —
  không viết lại; tổng hợp theo dõi tái dùng `@synaptek/learning-path` (heatmap/mastery).
- **FR-012 (Regression)**: M4 MUST KHÔNG đổi hành vi M1/M2/M3 (engine + RLS hiện có giữ xanh).

### Key Entities _(include if feature involves data)_

- **Profile (mở rộng)**: thêm `parent_link_code` (text, nullable, unique) — HS đặt để PH nhập. `role` đã có.
- **ParentLink (liên kết)**: `{ parent_id, student_id, linked_at }` — PK `(parent_id, student_id)`; nhiều–nhiều.
- **Tái dùng (đọc)**: `attempts` · `skill_mastery` · `gamification_state` · `submissions`/`assignments` của con.
- **Tái dùng (logic)**: `@synaptek/classroom` (mã mời) · `@synaptek/learning-path` (skillWeakness/mastery).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: HS tạo mã → PH nhập mã → con xuất hiện trong "Con của tôi" — end-to-end thành công.
- **SC-002 (RLS)**: PH/HS không liên quan **không** đọc được liên kết/dữ liệu của cặp khác (0 rò rỉ).
- **SC-003 (Theo dõi)**: PH thấy đúng điểm yếu/XP/streak/kết quả bài của **con mình**; chặn HS khác.
- **SC-004 (Chỉ đọc)**: PH không có đường ghi/sửa nào trên dữ liệu con (kiểm RLS: 0 quyền write chéo).
- **SC-005 (Không tự liên kết)**: nhập mã của chính mình → bị từ chối.
- **SC-006 (Regression)**: test `@synaptek/grading-engine` + RLS M3 (9 ca) + luyện tập M1/M2 giữ **xanh**.

## Ngoài phạm vi (M4 đợt này)

- **Giao bài tại nhà** (PH giao bài cho con) → đợt sau (mở rộng assignment cho bài cá nhân).
- Mở rộng nội dung đủ lớp 1–5 → luồng content pipeline (D14), song song.
- Native/push cho PH → M5.
