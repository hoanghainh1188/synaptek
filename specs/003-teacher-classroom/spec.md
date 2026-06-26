# Feature Specification: M3 — Giáo viên (lớp học, giao bài, chấm chính thức)

**Feature Branch**: `003-teacher-classroom`
**Created**: 2026-06-26
**Status**: Draft
**Input**: Sau M0–M2 (học sinh: luyện tập + chấm tức thì, mastery/lộ trình/gamification/ôn ngắt quãng),
M3 mở vai trò **GIÁO VIÊN** vận hành một lớp end-to-end: tạo lớp + mã mời; soạn & giao bài tập từ ngân
hàng câu hỏi; **chấm chính thức server-side** (ẩn đáp án — D4) + GV **ghi đè điểm thủ công** + **nhận
xét**; **phân tích lớp** (dùng lại mastery/heatmap của `@synaptek/learning-path`); **RLS chéo vai trò
đầy đủ** (GV thấy & thao tác HS trong lớp mình; HS chỉ thấy của mình + bài được giao; không rò rỉ chéo).

> Nguồn quyết định: Decision Log `docs/00-architecture.md §0`. Liên quan: **D2** (logic = package TS
> thuần), **D4** (server-authoritative cho chấm chính thức + ẩn đáp án — M3 hiện thực hóa đầy đủ), **D5/D13**
> (ranh giới repo + Edge Function dùng lại package qua `_shared`), **D6** (curriculum/câu hỏi là ground-truth
> JSON), **D16** (auth tối thiểu Supabase). Quyết định mới của M3 (sẽ ghi **D22–D24**): vai trò
> (`profiles.role`); mô hình lớp/giao bài/nộp bài + audit điểm; RLS chéo vai trò. Bám Constitution
> (logic TS thuần test-first, vừa-đủ). **KHÔNG** phá vỡ hành vi M1/M2 (regression: chấm M1 không đổi).

## Clarifications

### Session 2026-06-26

- Q: Một người dùng trở thành **giáo viên** bằng cách nào? → A: **Tự chọn vai trò khi đăng ký** — thêm
  `profiles.role ∈ {student, teacher}` (mặc định `student`), đổi được trong hồ sơ. Siết duyệt sau (M4+).
- Q: Phạm vi **"chấm chính thức server-side"** (D4) trong M3? → A: **Chỉ bài tập được giao** (assignment)
  chấm server-side khi nộp (ẩn đáp án, đáng tin). **Luyện tập tự do giữ chấm client low-stakes** như M1
  (phản hồi tức thì).
- Q: Khi GV **chấm tay / ghi đè điểm**, lưu thế nào? → A: **Giữ cả điểm máy chấm (auto) + điểm cuối
  (final) + cờ override + nhận xét** (audit trail) → "điểm đáng tin".
- Q: Học sinh **tham gia lớp** bằng mã mời thế nào? → A: **Tự vào khi nhập mã đúng** (mã hợp lệ → vào
  lớp ngay). Mã **thu hồi/đặt hạn** được; GV xóa HS khỏi lớp được.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Tạo lớp + mời học sinh (Priority: P1)

Giáo viên đăng ký (chọn vai trò GV), tạo một lớp, nhận **mã mời**. Học sinh nhập mã → vào lớp. Giáo viên
thấy **danh sách lớp** (roster) của mình.

**Why this priority**: Lớp + roster là nền tảng cho mọi tính năng GV (giao bài, chấm, phân tích). Tự nó
đã có giá trị: GV tổ chức được học sinh; là MVP của vai trò GV.

**Independent Test**: Tạo tài khoản GV → tạo lớp → lấy mã; tạo tài khoản HS → nhập mã → vào lớp; GV thấy
HS trong roster; HS thấy mình thuộc lớp. RLS: HS/GV khác **không** thấy lớp này.

**Acceptance Scenarios**:

1. **Given** người dùng chọn vai trò GV, **When** tạo lớp "Toán 4A", **Then** lớp được tạo kèm **mã mời**
   duy nhất và GV là chủ lớp.
2. **Given** HS đã đăng nhập có mã hợp lệ, **When** nhập mã, **Then** HS vào lớp ngay và xuất hiện trong roster.
3. **Given** mã đã **thu hồi/hết hạn**, **When** HS nhập mã đó, **Then** bị từ chối với thông báo rõ; không vào lớp.
4. **Given** GV mở roster, **When** chọn xóa một HS khỏi lớp, **Then** HS không còn trong lớp (dữ liệu luyện
   tập cá nhân của HS giữ nguyên).
5. **Given** một GV khác / HS không thuộc lớp, **When** cố truy cập lớp, **Then** **không** thấy lớp hay roster (RLS).

---

### User Story 2 - Giao bài & chấm chính thức server-side (Priority: P2)

Giáo viên soạn **bài tập** (chọn câu hỏi từ ngân hàng `content/` + hạn nộp), giao cho lớp. Học sinh trong
lớp thấy bài được giao, làm và **nộp**; hệ thống **chấm chính thức ở server** (ẩn đáp án — D4) và lưu điểm.

**Why this priority**: Đây là vòng giá trị cốt lõi của GV: giao việc có điểm đáng tin. Phụ thuộc US1 (lớp).

**Independent Test**: GV tạo bài 5 câu, hạn nộp; HS trong lớp nộp đáp án; điểm chấm **ở server** khớp
engine; **đáp án đúng không có trong dữ liệu trả về client**. HS ngoài lớp không thấy/không nộp được bài.

**Acceptance Scenarios**:

1. **Given** GV ở lớp của mình, **When** tạo bài tập gồm các `questionId` từ `content/` + hạn nộp, **Then**
   bài hiển thị cho **mọi HS trong lớp**, không hiển thị cho người ngoài lớp.
2. **Given** HS trong lớp mở bài, **When** xem đề, **Then** **không** nhận được đáp án đúng (chỉ đề bài).
3. **Given** HS nộp đáp án, **When** server chấm, **Then** điểm tính bằng `@synaptek/grading-engine` ở
   server (tương đương: `0,5`/`2/4`/`2(x+2)` chấm đúng), lưu **điểm auto**; phản hồi không kèm đáp án.
4. **Given** đã quá **hạn nộp**, **When** HS cố nộp, **Then** bị từ chối (hoặc đánh dấu nộp trễ) theo quy
   tắc rõ ràng; không phá dữ liệu.
5. **Given** HS không thuộc lớp, **When** cố nộp bài của lớp đó, **Then** bị từ chối (RLS/kiểm tra membership).

---

### User Story 3 - Ghi đè điểm, nhận xét & phân tích lớp (Priority: P3)

Giáo viên xem bài đã nộp, **ghi đè điểm** thủ công khi cần + viết **nhận xét**; xem **phân tích lớp** (tiến
độ/điểm yếu theo lớp, dùng lại mastery/heatmap của `@synaptek/learning-path`).

**Why this priority**: Hoàn thiện "điểm đáng tin" + giúp GV ra quyết định dạy. Phụ thuộc US2 (bài nộp).

**Independent Test**: GV ghi đè điểm một bài nộp + nhận xét → HS thấy **điểm cuối** + nhận xét; hệ thống
**giữ cả** điểm máy chấm (auto) lẫn điểm cuối (final) + cờ override. Trang phân tích lớp hiển thị điểm yếu
tổng hợp đúng theo dữ liệu lớp.

**Acceptance Scenarios**:

1. **Given** một bài HS đã nộp (có điểm auto), **When** GV nhập điểm ghi đè + nhận xét, **Then** lưu
   **final_score** + **comment** + cờ override; **auto_score giữ nguyên** (audit).
2. **Given** GV đã ghi đè, **When** HS xem kết quả, **Then** thấy **điểm cuối** + nhận xét của GV.
3. **Given** GV mở phân tích lớp, **When** xem, **Then** thấy tổng hợp điểm yếu/tiến độ theo lớp (dùng lại
   heatmap/mastery), chỉ gồm HS trong lớp.
4. **Given** điểm ghi đè ngoài khoảng hợp lệ, **When** GV lưu, **Then** bị từ chối với thông báo rõ.

---

### Edge Cases

- **Mã mời**: hết hạn / bị thu hồi / nhập sai → từ chối rõ ràng. Mã đảm bảo khó đoán (không tuần tự lộ).
- **Rời/xóa lớp**: HS bị xóa khỏi lớp → mất quyền xem bài lớp; dữ liệu luyện tập cá nhân (attempts/mastery) giữ.
- **Hạn nộp**: nộp trễ xử lý nhất quán (chặn hoặc đánh dấu trễ — chốt ở plan); nộp nhiều lần (lần cuối/đầu — chốt).
- **Nội dung lệch**: `questionId` trong bài bị xóa/đổi trong `content/` → bài vẫn mở được, câu thiếu báo rõ, không vỡ.
- **Chéo vai trò/lớp**: GV cố thao tác lớp/HS không thuộc mình; HS cố xem bài/điểm HS khác → **đều bị chặn** (RLS).
- **Đổi vai trò**: người dùng đổi student↔teacher → không leo thang quyền trên dữ liệu cũ ngoài phạm vi.
- **Regression**: luyện tập tự do + chấm client của M1/M2 **không đổi hành vi**.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001 (Vai trò)**: Hệ thống MUST hỗ trợ `profiles.role ∈ {student, teacher}` (mặc định `student`),
  người dùng **tự chọn** khi đăng ký và đổi được trong hồ sơ. UI/điều hướng GV chỉ mở cho `teacher`.
- **FR-002 (Tạo lớp)**: GV MUST tạo được lớp (tên + GV chủ sở hữu) và là chủ lớp đó.
- **FR-003 (Mã mời)**: Mỗi lớp MUST có **mã mời** khó đoán; GV MUST **thu hồi / tạo lại / đặt hạn** mã.
- **FR-004 (Tham gia)**: HS đã đăng nhập nhập **mã hợp lệ** MUST **vào lớp ngay**; mã sai/hết hạn/thu hồi → từ chối.
- **FR-005 (Roster)**: GV MUST xem được danh sách HS trong lớp và **xóa HS** khỏi lớp; xóa khỏi lớp KHÔNG
  xóa dữ liệu luyện tập cá nhân của HS.
- **FR-006 (Đa lớp)**: Một HS MAY thuộc **nhiều lớp**; một GV MAY có nhiều lớp.
- **FR-007 (Soạn bài)**: GV MUST tạo **bài tập** gồm danh sách `questionId` lấy từ `content/` (D6) + **hạn
  nộp**, gắn với một lớp của mình.
- **FR-008 (Hiển thị bài)**: Bài tập MUST hiển thị cho **mọi HS trong lớp** đó và KHÔNG cho người ngoài lớp.
- **FR-009 (Ẩn đáp án)**: Khi HS xem/làm bài, hệ thống MUST KHÔNG để **đáp án đúng** rời server (D4).
- **FR-010 (Chấm chính thức)**: Khi HS **nộp bài tập**, hệ thống MUST **chấm ở server** bằng
  `@synaptek/grading-engine` (đọc đáp án từ `content/questions` phía server) và lưu **điểm máy (auto)**;
  phản hồi cho client KHÔNG kèm đáp án.
- **FR-011 (Phạm vi chấm)**: Chấm chính thức server-side áp cho **bài tập được giao**; **luyện tập tự do
  giữ chấm client low-stakes** như M1 (FR-021 regression).
- **FR-012 (Ghi đè điểm)**: GV MUST ghi đè điểm một bài nộp; hệ thống MUST **giữ cả** `auto_score` +
  `final_score` + cờ **override** (audit). Điểm ghi đè phải hợp lệ (trong khoảng cho phép).
- **FR-013 (Nhận xét)**: GV MUST viết nhận xét cho bài nộp; HS MUST thấy **điểm cuối** + nhận xét.
- **FR-014 (Phân tích lớp)**: GV MUST xem tổng hợp **điểm yếu/tiến độ theo lớp** (dùng lại
  `@synaptek/learning-path` heatmap/mastery), chỉ gồm HS trong lớp.
- **FR-015 (RLS chéo vai trò)**: Hệ thống MUST đảm bảo: GV chỉ đọc/ghi dữ liệu lớp + HS **thuộc lớp mình**;
  HS chỉ đọc/ghi dữ liệu **của mình** + bài được giao cho lớp mình; **không** rò rỉ chéo lớp/chéo vai trò.
- **FR-016 (Hạn nộp)**: Hệ thống MUST xử lý hạn nộp nhất quán (chặn nộp trễ HOẶC đánh dấu nộp trễ — chốt ở plan).
- **FR-017 (Bền vững nội dung)**: Bài tham chiếu `questionId` bị thiếu trong `content/` MUST không làm vỡ
  bài; câu thiếu được báo rõ và bỏ qua khi chấm.
- **FR-018 (Hồ sơ GV tối thiểu)**: GV MUST thấy danh sách lớp của mình làm điểm vào (entry) cho mọi thao tác.
- **FR-019 (Migration)**: Trạng thái M3 ở **migration `0003`** (classes · class_members · assignments ·
  submissions + `profiles.role`) với RLS như FR-015; M1=`0001`, M2=`0002` giữ nguyên.
- **FR-020 (Logic thuần)**: Quy tắc nghiệp vụ mới (sinh/định-dạng mã mời, tổng hợp phân tích lớp, quy tắc
  hạn nộp) MUST là **logic thuần test-first** (package/lib thuần), tách khỏi I/O/RLS.
- **FR-021 (Regression)**: M3 MUST KHÔNG đổi hành vi chấm/luyện tập tự do của M1/M2 (test engine giữ xanh).

### Key Entities _(include if feature involves data)_

- **Profile (mở rộng)**: thêm `role ∈ {student, teacher}` (mặc định student). Giữ là định danh.
- **Class (lớp)**: `{ id, owner_teacher_id, name, invite_code, invite_expires_at?, created_at }`. Chủ sở hữu = GV.
- **ClassMember (thành viên)**: `{ class_id, student_id, joined_at }` — PK `(class_id, student_id)`; HS thuộc nhiều lớp.
- **Assignment (bài tập)**: `{ id, class_id, title, question_ids[], due_at?, created_at }` — `question_ids`
  trỏ `content/questions` (D6).
- **Submission (bài nộp)**: `{ id, assignment_id, student_id, answers, auto_score, final_score?, is_override,
feedback?, submitted_at, graded_at }` — giữ cả auto + final (audit, FR-012).
- **Tái dùng**: `attempts` · `skill_mastery` (mastery/heatmap cho phân tích lớp) · `content/` (đề + đáp án server).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: GV tạo lớp + mã, HS nhập mã vào lớp, GV thấy HS trong roster — end-to-end thành công.
- **SC-002 (RLS)**: HS/GV không liên quan **không** truy cập được lớp/bài/điểm của lớp khác (0 rò rỉ trên
  bộ ca kiểm chéo vai trò).
- **SC-003 (Ẩn đáp án)**: Mọi phản hồi tới client cho bài tập **không chứa** đáp án đúng (kiểm trên payload).
- **SC-004 (Điểm đáng tin)**: Bài nộp được chấm **ở server** khớp engine; GV ghi đè → lưu **cả** auto +
  final + cờ override + nhận xét; HS thấy điểm cuối + nhận xét.
- **SC-005 (Phân tích)**: Trang phân tích lớp phản ánh đúng điểm yếu/tiến độ tổng hợp **chỉ** từ HS trong lớp.
- **SC-006 (Regression)**: Toàn bộ test `@synaptek/grading-engine` + luyện tập tự do M1/M2 giữ **xanh**;
  hành vi chấm không đổi (FR-021).
- **SC-007**: GV chỉ thao tác (sửa điểm/nhận xét/xóa HS/giao bài) trên HS & lớp **thuộc mình** — 0 vi phạm.

## Ngoài phạm vi (M3)

- **Phụ huynh** (liên kết PH–con, theo dõi tại nhà) → **M4**.
- Soạn nội dung trong app (authoring tool), mở rộng đủ lớp 1–5 → luồng content pipeline / M4.
- Native build / push cho GV, offline → M5.
- Báo cáo nâng cao (xuất file, biểu đồ phức tạp), nhắn tin GV–HS, xếp hạng lớp → sau.
