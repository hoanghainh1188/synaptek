# Feature Specification: M1 — Vòng luyện tập học sinh

**Feature Branch**: `feature/m1-practice-loop`
**Created**: 2026-06-24
**Status**: Draft
**Input**: Vòng luyện tập cốt lõi cho học sinh tiểu học: chọn chủ đề → làm bài → chấm tức thì +
giải thích → xem kết quả & tiến độ. Khởi đầu **lớp 4**, có ôn lại lớp 1–3; **auth tối thiểu**; nội
dung biên soạn thủ công (JSON) + import (luồng riêng).

> Nguồn quyết định: Decision Log `docs/00-architecture.md §0`. Liên quan: D4, D6, D7, D8, D9,
> **D14** (content pipeline thủ công + import), **D15** (lớp 4 + ôn lớp 1–3), **D16** (auth tối thiểu).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Luyện tập một chủ đề & được chấm tức thì (Priority: P1)

Học sinh mở app, chọn một chủ đề lớp 4 (vd "Phân số"), làm lần lượt từng câu (trắc nghiệm, điền đáp
số, điền phân số/biểu thức…). Mỗi câu được **chấm ngay**, hiện đúng/sai kèm **giải thích ngắn**. Hết
phiên, học sinh thấy kết quả: số câu đúng/tổng, điểm, và những câu đã sai.

**Why this priority**: Đây là trái tim sản phẩm và là MVP nhỏ nhất có giá trị — chứng minh được "luyện
tập + chấm tương đương đáng tin" mà không cần auth hay tiến độ. Tự nó đã dùng được.

**Independent Test**: Chạy app (web), chọn chủ đề, làm trọn một phiên không cần đăng nhập; xác nhận
chấm đúng các trường hợp tương đương (`0,5`≡`0.5`, `1/2`≡`2/4`, `2x+4`≡`2(x+2)`) và kết quả phiên hiện
đúng.

**Acceptance Scenarios**:

1. **Given** một chủ đề có câu hỏi, **When** học sinh nhập đáp án đúng (kể cả dạng tương đương),
   **Then** hệ thống báo Đúng tức thì và hiện giải thích.
2. **Given** học sinh nhập đáp án sai, **When** nộp, **Then** báo Sai + giải thích, không chặn đi tiếp.
3. **Given** học sinh đã trả lời hết câu trong phiên, **When** phiên kết thúc, **Then** hiện tổng kết
   (đúng/tổng, điểm, danh sách câu sai).
4. **Given** một câu dạng phân số/biểu thức, **When** hiển thị đề, **Then** công thức được render rõ
   ràng trên cả web và mobile.

---

### User Story 2 - Có tài khoản & lưu tiến độ (Priority: P2)

Học sinh đăng nhập (email/mật khẩu). Mọi lần trả lời và tiến độ theo chủ đề/kỹ năng được **lưu lại** và
hiện lại đúng khi đăng nhập lần sau (kể cả trên thiết bị khác).

**Why this priority**: Biến luyện tập rời rạc thành hành trình có theo dõi — tiền đề cho lộ trình (M2)
và cho giáo viên/phụ huynh (M3/M4). Phụ thuộc US1 đã chạy.

**Independent Test**: Đăng nhập, làm vài câu, đăng xuất, đăng nhập lại (hoặc thiết bị khác) → tiến độ
và lịch sử trả lời hiển thị đúng.

**Acceptance Scenarios**:

1. **Given** học sinh mới, **When** đăng ký bằng email/mật khẩu, **Then** có hồ sơ học sinh và vào
   luyện tập được.
2. **Given** học sinh đã làm bài khi đăng nhập, **When** đăng nhập lại sau, **Then** thấy lại tiến độ
   theo chủ đề (đã làm bao nhiêu, đúng bao nhiêu).
3. **Given** học sinh chưa đăng nhập, **When** luyện tập như khách, **Then** vẫn làm được nhưng được
   nhắc đăng nhập để lưu tiến độ.

---

### User Story 3 - Ôn lại kiến thức lớp dưới (Priority: P3)

Khi gặp khó ở lớp 4, học sinh chọn ôn lại chủ đề nền tảng của **lớp 1–3** (vd bảng nhân, cộng/trừ) để
củng cố trước khi quay lại.

**Why this priority**: Hỗ trợ "khắc phục điểm yếu" — nhưng chưa cần thuật toán mastery (đó là M2). M1
chỉ cần cho phép chọn nội dung đa lớp.

**Independent Test**: Từ màn chọn chủ đề, lọc theo lớp 1–3, luyện một chủ đề lớp dưới trọn vẹn.

**Acceptance Scenarios**:

1. **Given** nội dung nhiều lớp, **When** học sinh lọc theo lớp, **Then** thấy & chọn được chủ đề lớp
   1–3 bên cạnh lớp 4.

---

### Edge Cases

- Bỏ trống đáp án rồi nộp → báo "chưa nhập", không tính là sai.
- Nhập sai định dạng (vd phân số mẫu số 0) → báo nhẹ nhàng, cho nhập lại, không sập.
- Mất mạng giữa phiên → vẫn chấm và làm tiếp được (chấm phía client); tiến độ đồng bộ khi có mạng lại.
- Chủ đề chưa có câu hỏi nào → báo "đang cập nhật nội dung", không vào phiên rỗng.
- Học sinh thoát giữa phiên → các câu đã trả lời vẫn được ghi nhận.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Học sinh MUST chọn được một chủ đề (theo lớp) để bắt đầu một phiên luyện tập.
- **FR-002**: Hệ thống MUST hiển thị lần lượt từng câu hỏi, hỗ trợ các loại: trắc nghiệm, đúng/sai,
  điền đáp số, điền phân số, điền biểu thức, điền nhiều chỗ trống.
- **FR-003**: Hệ thống MUST chấm **tức thì** sau mỗi câu, công nhận **đáp án tương đương** (số kiểu VN
  `0,5`≡`0.5`; phân số `1/2`≡`2/4`; biểu thức `2x+4`≡`2(x+2)`).
- **FR-004**: Sau mỗi câu, hệ thống MUST hiện kết quả đúng/sai kèm **giải thích ngắn**.
- **FR-005**: Cuối phiên, hệ thống MUST hiện tổng kết: số đúng/tổng, điểm, danh sách câu sai.
- **FR-006**: Hệ thống MUST render được công thức Toán cơ bản (phân số, biểu thức ngắn) rõ ràng trên
  **web và mobile**, và cung cấp cách **nhập đáp số/phân số** thân thiện trên mobile.
- **FR-007**: Học sinh MUST đăng nhập được bằng email/mật khẩu; học sinh mới tự có hồ sơ.
- **FR-008**: Hệ thống MUST lưu mỗi lần trả lời và tiến độ theo chủ đề/kỹ năng, **đồng bộ qua các
  phiên/thiết bị** cho học sinh đã đăng nhập.
- **FR-009**: Học sinh MUST xem được tiến độ cơ bản theo chủ đề (đã làm / đúng).
- **FR-010**: Hệ thống MUST cho phép chọn & luyện chủ đề thuộc **lớp 1–3** bên cạnh lớp 4.
- **FR-011**: Câu hỏi MUST được nạp từ **nội dung versioned (JSON)** biên soạn ngoài UI; UI không
  hard-code đề/đáp án.
- **FR-012**: Học sinh chưa đăng nhập MAY luyện tập như khách, nhưng tiến độ chỉ được lưu sau khi đăng
  nhập.

### Key Entities _(include if feature involves data)_

- **Chủ đề/Kỹ năng (curriculum node)**: Lớp → Mạch → Chủ đề → Kỹ năng; có quan hệ tiên quyết. Câu hỏi
  gắn vào kỹ năng. (Đa lớp: 1–4 trong M1.)
- **Câu hỏi (Question)**: loại, đề, lựa chọn/đáp án, kỹ năng, giải thích, lớp — là nội dung JSON.
- **Phiên luyện tập (Session)**: chủ đề, tập câu hỏi, các đáp án, điểm tổng.
- **Lần trả lời (Attempt)**: theo từng câu — đáp án, đúng/sai, điểm, thời điểm (được lưu).
- **Tiến độ kỹ năng (Skill progress)**: theo học sinh × kỹ năng — số lần làm, số đúng (cơ bản ở M1;
  mastery đầy đủ ở M2).
- **Hồ sơ học sinh (Profile)**: định danh đăng nhập + lớp.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Học sinh hoàn thành trọn một phiên (chọn chủ đề → trả lời → xem kết quả) **không cần
  hướng dẫn**.
- **SC-002**: Chấm tức thì **đúng ≥ 99%** các trường hợp tương đương đã định nghĩa (đo bằng test +
  e2e trên bộ câu mẫu).
- **SC-003**: Sau khi đăng nhập lại (phiên/thiết bị khác), **100%** tiến độ & lịch sử trả lời hiển thị
  lại đúng.
- **SC-004**: Phản hồi chấm hiển thị **< 200ms** sau khi nộp (chấm phía client — đạt INP target).
- **SC-005**: M1 chạy được với **≥ 120 câu hỏi lớp 4 (3 chủ đề)** + một ít chủ đề lớp 1–3, nạp từ
  content JSON.

## Assumptions

- **Lớp khởi đầu = lớp 4**; nội dung lớp 1–3 dùng để ôn lại (D15). 3 chủ đề đầu: bốn phép tính với số
  tự nhiên · phân số · chu vi–diện tích.
- **Nội dung là luồng công việc riêng** (D14, D6): biên soạn **thủ công dạng JSON** + cơ chế **import**;
  M1 dùng một bộ ~120 câu mẫu để chạy được end-to-end. Câu hỏi bám CT GDPT 2018, **không chép nguyên
  văn SGK** (rủi ro bản quyền — quy trình review riêng).
- **Auth tối thiểu = email/mật khẩu** (D16); chưa có vai trò giáo viên/phụ huynh (M3/M4).
- **Chấm tức thì = phía client** dùng bộ chấm có sẵn (luyện tập low-stakes); chấm chính thức
  server-side dành cho bài giáo viên giao (M3, D4).
- **Render Toán**: ưu tiên component tự vẽ cho phân số/biểu thức đơn giản (gộp spike từ M0); LaTeX đầy
  đủ để sau nếu cần.
- Một phiên mặc định **~10 câu** (cấu hình được); thứ tự câu trong M1 lấy tuần tự/ngẫu nhiên đơn giản
  (lựa chọn theo mastery để M2).
- Hình ảnh đề (hình học) ở M1 là **tùy chọn**; có thể tạm dùng mô tả/figure đơn giản, ảnh từ storage để
  sau.

## Out of Scope (M1)

- Lộ trình cá nhân hóa, mastery, spaced repetition, error heatmap, gamification → **M2**.
- Giáo viên tạo lớp/giao bài, chấm chính thức server-side, phụ huynh → **M3/M4**.
- Chấm trình bày từng bước / nhập LaTeX / viết tay → tương lai.
- Công cụ soạn câu hỏi trong app (authoring UI) → một phần của **content pipeline** (luồng riêng),
  M1 chỉ cần **import** từ JSON.
