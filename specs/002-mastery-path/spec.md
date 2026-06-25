# Feature Specification: M2 — Mastery & Lộ trình cá nhân hóa

**Feature Branch**: `feature/m2-mastery-path`
**Created**: 2026-06-25
**Status**: Draft
**Input**: Sau M1 (luyện tập + chấm tức thì + lưu tiến độ), đưa app từ "luyện tập rời rạc" thành "biết
mình yếu ở đâu & học gì tiếp". P1: chẩn đoán đầu vào (diagnostic) + **mô hình mastery BKT** mỗi kỹ năng +
**bản đồ điểm yếu (error heatmap)** + **lộ trình "học gì tiếp"** (tiên quyết đã đạt ∧ mastery thấp ∧ đến
hạn ôn). P2: **gamification đầy đủ** (streak + XP + huy hiệu). P3: **ôn ngắt quãng (spaced repetition)** +
**job nền (cron Edge Function)** + **thông báo đẩy (push)** nhắc đến hạn ôn.

> Nguồn quyết định: Decision Log `docs/00-architecture.md §0`. Liên quan: **D2** (logic = package TS
> thuần → `@synaptek/learning-path`), **D4** (server-authoritative — mastery ghi server ở M3, M2 client
> tính + lưu), **D6** (curriculum/skill graph là ground-truth), **D13** (Edge Function dùng lại package
> qua `_shared`). Quyết định mới của M2 (sẽ ghi D19–D21): **BKT** làm mô hình mastery; **gamification đầy
> đủ**; **cron Edge Function + push** cho ôn ngắt quãng. Bám Constitution (engine/logic = TS thuần,
> test-first, vừa-đủ); **KHÔNG** động M3 (giáo viên/lớp/chấm chính thức).

## Clarifications

### Session 2026-06-25

- Q: XP "theo độ khó" lấy tín hiệu độ khó từ đâu (schema M1 chưa có trường độ khó)? → A: Thêm trường
  `difficulty` **tùy chọn** (1=dễ/2=vừa/3=khó) vào schema câu hỏi (D6/D14); XP = base × trọng số độ khó;
  khi câu chưa gắn → **fallback theo loại câu** (mcq=dễ, numeric/fraction=vừa, expression/fill-blank=khó).
- Q: Ngưỡng mastery BKT coi là "đã đạt" (gate mở khóa + huy hiệu + lộ trình)? → A: **0.95** (chuẩn BKT
  Corbett & Anderson) — tham số cấu hình, có thể tinh chỉnh sau.
- Q: Bài chẩn đoán đầu vào dài/cấu trúc thế nào? → A: **~5–8 câu**, chọn **trải các kỹ năng nền** của
  lớp đang học (ưu tiên kỹ năng gốc trong đồ thị tiên quyết); kỹ năng chưa chạm dùng p-init mặc định.
- Q: Phạm vi push trong M2 (định nghĩa "done")? → A: **Nhắc in-app bắt buộc** (cron tính đến hạn — chặn
  done) **+ push best-effort** qua expo-notifications (chạy nếu có EAS/quyền/web hỗ trợ); push native
  **KHÔNG** chặn M2 done.
- Q: Mốc ngày cho streak & "đến hạn" theo múi giờ nào? → A: **Giờ Việt Nam (Asia/Ho_Chi_Minh)**, nhất
  quán cho mọi học sinh thay vì giờ thiết bị.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Biết "học gì tiếp" & yếu ở đâu (Priority: P1)

Học sinh làm một **bài chẩn đoán ngắn** (vài câu trải các kỹ năng nền) để app ước lượng trình độ ban đầu.
Sau đó, mỗi lần luyện, **mức thành thạo (mastery) từng kỹ năng** được cập nhật theo kết quả trả lời. Trang
chủ hiển thị một **lộ trình "hôm nay học gì"** — danh sách kỹ năng nên luyện kế tiếp, chọn theo quy tắc:
**kỹ năng tiên quyết đã đạt** ∧ **mastery còn thấp** ∧ (nếu có) **đã đến hạn ôn**. Một **bản đồ điểm yếu
(heatmap)** cho thấy theo chủ đề/kỹ năng chỗ nào đang yếu (đỏ) → vững (xanh), kèm dạng lỗi hay mắc.

**Why this priority**: Đây là lời hứa cốt lõi của sản phẩm ngoài "chấm đúng" — _cá nhân hóa_ và _khắc
phục điểm yếu_. Nó biến M1 (luyện tập + lưu tiến độ) thành một hành trình có định hướng. Tự nó đã là MVP
của M2: học sinh mở app và biết chính xác nên làm gì tiếp, không cần gamification hay push.

**Independent Test**: Tạo một học sinh mới, làm bài chẩn đoán, rồi luyện vài phiên với tỉ lệ đúng/sai khác
nhau ở các kỹ năng → xác nhận: (a) mastery mỗi kỹ năng thay đổi hợp lý theo đúng/sai; (b) lộ trình đề xuất
chỉ gồm kỹ năng có tiên quyết đã đạt và ưu tiên mastery thấp; (c) heatmap phản ánh đúng kỹ năng yếu và
dạng lỗi hay gặp.

**Acceptance Scenarios**:

1. **Given** học sinh mới chưa có dữ liệu, **When** hoàn thành bài chẩn đoán, **Then** mỗi kỹ năng được
   chẩn đoán có một giá trị mastery khởi tạo (không còn ở mặc định 0 mù) và trang chủ hiện lộ trình gợi ý.
2. **Given** học sinh trả lời **đúng nhiều lần** một kỹ năng, **When** mastery cập nhật, **Then** mastery
   kỹ năng đó **tăng đơn điệu** và khi vượt ngưỡng "đã đạt", kỹ năng **mở khóa** các kỹ năng phụ thuộc.
3. **Given** học sinh trả lời **sai** ở một kỹ năng, **When** mastery cập nhật, **Then** mastery **giảm**
   (hoặc tăng chậm lại) và kỹ năng đó được **ưu tiên cao hơn** trong lộ trình.
4. **Given** một kỹ năng có tiên quyết **chưa đạt**, **When** sinh lộ trình, **Then** kỹ năng đó **không**
   được đề xuất; thay vào đó hệ thống đề xuất kỹ năng tiên quyết còn yếu.
5. **Given** học sinh đã luyện một số chủ đề, **When** mở bản đồ điểm yếu, **Then** mỗi chủ đề/kỹ năng hiện
   mức thành thạo (thang màu) và **dạng lỗi hay mắc nhất** (vd "nhầm rút gọn phân số", "sai đơn vị đo").
6. **Given** học sinh chưa làm chẩn đoán, **When** vào trang chủ, **Then** được mời làm chẩn đoán trước
   (có thể bỏ qua) và vẫn luyện tự do được như M1.

---

### User Story 2 - Có động lực quay lại mỗi ngày (Priority: P2)

Học sinh nhận **điểm thưởng (XP)** theo **số câu đúng và độ khó câu hỏi**, giữ **chuỗi ngày luyện (streak)**
khi luyện đều, và mở **huy hiệu (badge)** theo cột mốc (vd "7 ngày liên tục", "thành thạo Phân số", "100
câu đúng"). Tiến trình này hiển thị rõ và **ăn mừng** đúng lúc, ngôn ngữ động viên — củng cố tinh thần
"dũng cảm, tự tin, vui".

**Why this priority**: Mastery (US1) cho _định hướng_; gamification cho _động lực duy trì_ — yếu tố giữ
chân để học sinh thực sự đi hết lộ trình. Phụ thuộc US1 ở chỗ một số huy hiệu gắn với mastery, nhưng phần
streak/XP độc lập và có thể demo riêng.

**Independent Test**: Luyện vào nhiều "ngày" khác nhau (giả lập mốc thời gian) → xác nhận streak tăng khi
luyện ngày kế tiếp và **reset** khi bỏ lỡ; XP cộng đúng theo câu đúng/phiên; huy hiệu mở khóa đúng khi đạt
mốc và **không** mở trùng/lặp.

**Acceptance Scenarios**:

1. **Given** học sinh hoàn thành một phiên, **When** xem tổng kết, **Then** thấy **XP nhận được** và tổng
   XP cập nhật.
2. **Given** học sinh đã luyện hôm nay, **When** luyện tiếp vào ngày kế tiếp, **Then** **streak +1**; nếu
   bỏ lỡ một ngày, **streak reset** (về 1 ở lần luyện kế).
3. **Given** học sinh đạt một cột mốc (vd streak 7, hoặc một kỹ năng đạt mastery), **When** điều kiện thỏa,
   **Then** huy hiệu tương ứng **mở khóa một lần** kèm hiệu ứng ăn mừng (tôn trọng `reduced-motion`).
4. **Given** học sinh chưa từng đạt mốc nào, **When** mở hồ sơ/huy hiệu, **Then** thấy các huy hiệu **chưa
   mở** ở trạng thái mờ kèm gợi ý cách đạt — không gây cảm giác "thua kém".

---

### User Story 3 - Được nhắc ôn đúng lúc (Priority: P3)

Kiến thức đã học được lên **lịch ôn ngắt quãng**: kỹ năng đến hạn ôn xuất hiện trong lộ trình, và học sinh
nhận **thông báo đẩy** nhắc "đến giờ ôn tập" khi có kỹ năng tới hạn. Một **job nền chạy định kỳ** rà các
kỹ năng đến hạn để cập nhật lộ trình và bắn nhắc.

**Why this priority**: Ôn ngắt quãng nâng cao **ghi nhớ dài hạn** và push **kéo học sinh quay lại** — giá
trị lớn nhưng phụ thuộc nền tảng US1 (mastery + due) và hạ tầng push (EAS/quyền), nên xếp sau cùng.

**Independent Test**: Đặt vài kỹ năng có hạn ôn ở quá khứ → chạy job nền → xác nhận chúng vào danh sách
"đến hạn" của lộ trình và một thông báo nhắc được tạo cho đúng học sinh (kiểm bằng bản ghi/queue, không
cần thiết bị thật).

**Acceptance Scenarios**:

1. **Given** một kỹ năng đã luyện, **When** mastery cập nhật, **Then** hệ thống đặt **hạn ôn kế tiếp**
   (gần hơn nếu mastery thấp, xa hơn nếu cao).
2. **Given** có kỹ năng **đến hạn ôn**, **When** học sinh mở trang chủ, **Then** kỹ năng đó hiện trong mục
   "Đến hạn ôn" của lộ trình, ưu tiên trước kỹ năng mới.
3. **Given** job nền chạy theo lịch, **When** phát hiện học sinh có kỹ năng tới hạn, **Then** tạo **một**
   thông báo nhắc cho học sinh đó (không spam trùng trong cùng chu kỳ).
4. **Given** học sinh **chưa cấp quyền** nhận thông báo (hoặc nền web không hỗ trợ), **When** đến hạn ôn,
   **Then** vẫn thấy nhắc **trong app** (lộ trình + badge "đến hạn"); push chỉ là kênh bổ sung, không bắt
   buộc.

---

### Edge Cases

- **Học sinh khách (chưa đăng nhập)**: mastery/lộ trình tính được trong phiên nhưng **chỉ lưu sau khi đăng
  nhập** (như M1); chẩn đoán của khách được giữ tạm và đẩy lên khi đăng nhập.
- **Chưa đủ dữ liệu để chẩn đoán** (kỹ năng chưa có câu hỏi): bỏ qua kỹ năng đó trong chẩn đoán, không sập;
  mastery của nó giữ "chưa rõ".
- **Mọi kỹ năng đều đã đạt / không có gì đến hạn**: lộ trình hiện trạng thái "đã vững — ôn nâng cao / thử
  chủ đề mới", không để màn hình trống.
- **Đổi múi giờ / qua nửa đêm**: tính streak và "đến hạn" theo **mốc ngày giờ Việt Nam
  (Asia/Ho_Chi_Minh)** — nhất quán cho mọi học sinh, không cộng/đứt streak sai do lệch giờ thiết bị.
- **Luyện lại nhiều phiên trong một ngày**: streak chỉ +1/ngày; XP vẫn cộng dồn theo câu đúng.
- **Tham số BKT mặc định chưa chuẩn cho VN**: dùng tham số mặc định hợp lý, có thể tinh chỉnh sau; thay đổi
  tham số **không** được làm mastery "nhảy" phi lý với cùng lịch sử trả lời.
- **Push trùng lặp / job chạy chồng**: job nền **idempotent** trong một chu kỳ — chạy lại không tạo nhắc
  trùng.
- **Học sinh tắt thông báo**: tôn trọng lựa chọn; không gửi nữa cho tới khi bật lại.

## Requirements _(mandatory)_

### Functional Requirements

**Mastery & Lộ trình (US1)**

- **FR-001**: Hệ thống MUST cung cấp một **bài chẩn đoán đầu vào** ngắn (**~5–8 câu**) chọn **trải các kỹ
  năng nền** của lớp đang học (ưu tiên kỹ năng gốc trong đồ thị tiên quyết) và từ kết quả **khởi tạo
  mastery** cho các kỹ năng được chẩn đoán; kỹ năng chưa chạm dùng **p-init mặc định**.
- **FR-002**: Hệ thống MUST duy trì **mastery cho mỗi (học sinh × kỹ năng)** theo mô hình **Bayesian
  Knowledge Tracing (BKT)**, cập nhật sau mỗi lần trả lời (đúng → tăng, sai → giảm/chậm lại), giá trị
  trong [0,1].
- **FR-003**: Hệ thống MUST sinh một **lộ trình "học gì tiếp"** chọn kỹ năng theo quy tắc: **(các kỹ năng
  tiên quyết đã đạt ngưỡng "đã đạt" = mastery ≥ 0.95)** ∧ **(mastery < 0.95)** ∧ (nếu áp dụng) **(đã đến
  hạn ôn)**; sắp xếp ưu tiên kỹ năng yếu hơn / quá hạn lâu hơn. Ngưỡng 0.95 là **tham số cấu hình**.
- **FR-004**: Hệ thống MUST **không đề xuất** kỹ năng có tiên quyết chưa đạt, và MUST đề xuất kỹ năng tiên
  quyết còn yếu thay thế.
- **FR-005**: Hệ thống MUST hiển thị **bản đồ điểm yếu (heatmap)** theo chủ đề/kỹ năng (thang mức thành
  thạo) kèm **dạng lỗi hay mắc nhất** suy ra từ lịch sử trả lời.
- **FR-006**: Hệ thống MUST cho học sinh **bỏ qua chẩn đoán** và vẫn luyện tự do; khi đó lộ trình suy từ
  dữ liệu luyện tập có sẵn (hoặc mời chẩn đoán).
- **FR-007**: Logic mastery + bộ gợi ý + lập lịch ôn MUST nằm trong **một package TS thuần
  `@synaptek/learning-path`** (độc lập nền tảng, không import DOM/React/Node-only), được **test trước
  (TDD)**.
- **FR-008**: Mastery và trạng thái lộ trình của học sinh đã đăng nhập MUST được **lưu bền** (bảng
  `skill_mastery` — đã có ở `0001_init.sql`) và **đồng bộ qua phiên/thiết bị**.

**Gamification (US2)**

- **FR-009**: Hệ thống MUST cấp **XP** theo **số câu đúng và độ khó câu hỏi** (XP = base × trọng số độ
  khó) theo quy tắc minh bạch, và hiển thị XP nhận được ở tổng kết phiên + tổng XP ở hồ sơ.
- **FR-009a**: Schema câu hỏi (D6/D14) MUST hỗ trợ trường **`difficulty` tùy chọn** (1=dễ/2=vừa/3=khó);
  khi câu hỏi **chưa gắn** `difficulty`, hệ thống MUST suy độ khó **theo loại câu** (mcq=dễ,
  numeric/fraction=vừa, expression/fill-blank=khó) để vẫn cấp XP đúng.
- **FR-010**: Hệ thống MUST duy trì **streak** (chuỗi ngày luyện): +1 khi luyện vào ngày kế tiếp, **reset**
  khi bỏ lỡ một ngày; chỉ tính một lần mỗi ngày.
- **FR-011**: Hệ thống MUST có **bộ huy hiệu** mở khóa theo cột mốc (streak, XP, mastery kỹ năng/chủ đề,
  số câu đúng…); mỗi huy hiệu mở **đúng một lần** và hiển thị cả huy hiệu **chưa mở** kèm điều kiện đạt.
- **FR-012**: Khi mở khóa huy hiệu hoặc đạt mốc, hệ thống MUST hiển thị **phản hồi ăn mừng** ngôn ngữ động
  viên, **tôn trọng `reduced-motion`**.
- **FR-013**: Logic gamification (quy tắc XP, tính streak, điều kiện huy hiệu) MUST là **logic thuần kiểm
  thử được** (đặt cùng `@synaptek/learning-path` hoặc package/lib thuần tương đương), test trước.

**Ôn ngắt quãng + Job nền + Push (US3)**

- **FR-014**: Hệ thống MUST đặt **hạn ôn kế tiếp** cho mỗi kỹ năng đã luyện theo **ôn ngắt quãng** (khoảng
  cách phụ thuộc mastery: thấp → ôn sớm, cao → giãn dần); lưu vào `skill_mastery.due_at`.
- **FR-015**: Hệ thống MUST đưa kỹ năng **đến hạn ôn** vào lộ trình, ưu tiên trước kỹ năng mới.
- **FR-016**: Hệ thống MUST có **job nền chạy định kỳ** (Edge Function theo lịch) rà kỹ năng đến hạn và
  **tạo nhắc** cho học sinh; job MUST **idempotent** (chạy lại không nhắc trùng trong cùng chu kỳ).
- **FR-017**: Hệ thống MUST hiển thị nhắc đến hạn ôn **trong app** (lộ trình + dấu "đến hạn") cho **mọi**
  học sinh — đây là đường **bắt buộc** (chặn "done"). Push **best-effort** qua expo-notifications gửi cho
  học sinh **đã cấp quyền** (chạy nếu có EAS/quyền/web hỗ trợ); push native **KHÔNG** chặn M2 "done".
- **FR-018**: Job nền MUST **dùng lại logic lập lịch** từ `@synaptek/learning-path` qua bản đồng bộ
  `_shared` (D13) — không viết lại logic ở Edge Function.
- **FR-019**: Hệ thống MUST tôn trọng lựa chọn **tắt thông báo** của học sinh (không gửi cho tới khi bật
  lại).

**Xuyên suốt**

- **FR-020**: Thay đổi tham số BKT/lập lịch MUST có **giá trị mặc định hợp lý** và **không** gây kết quả
  phi lý (vd mastery nhảy bậc) với cùng một lịch sử trả lời; tham số tập trung một nơi để tinh chỉnh.
- **FR-021**: M2 MUST **không** thay đổi hành vi chấm của M1 và **không** đụng phạm vi M3 (giáo viên, lớp,
  chấm chính thức server-side).

### Key Entities _(include if feature involves data)_

- **Mastery kỹ năng (Skill mastery)**: theo (học sinh × kỹ năng) — giá trị mastery [0,1], số lần luyện,
  lần ôn gần nhất, **hạn ôn kế tiếp** (`due_at`). Là trạng thái BKT bền vững. _(Bảng `skill_mastery` đã
  tồn tại — M2 không cần migration nếu các cột đủ; nếu thiếu cột cho XP/streak/badge sẽ bổ sung ở plan.)_
- **Lần trả lời (Attempt)**: đã có từ M1 — nguồn cập nhật BKT và suy ra dạng lỗi cho heatmap.
- **Kỹ năng & quan hệ tiên quyết (Skill graph)**: từ `@synaptek/curriculum` (D6) — đầu vào cho gating lộ
  trình. M2 **đọc**, không sửa nội dung.
- **Lộ trình (Learning path item)**: tập kỹ năng đề xuất cho học sinh tại một thời điểm — **suy ra**, không
  nhất thiết lưu (derive thay vì lưu trùng).
- **Tiến trình gamification (Gamification state)**: theo học sinh — tổng XP, streak hiện tại, ngày luyện
  gần nhất, tập huy hiệu đã mở.
- **Huy hiệu (Badge)**: định nghĩa cột mốc + điều kiện — là **dữ liệu cấu hình** (giống content, ground-
  truth versioned), không hard-code rải rác.
- **Nhắc ôn / thông báo (Reminder)**: nhắc "đến hạn ôn" cho một học sinh trong một chu kỳ — đủ để job nền
  idempotent và để gửi push.
- **Đăng ký thiết bị nhận push (Push token)**: token/kênh để gửi thông báo cho học sinh đã cấp quyền.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Sau bài chẩn đoán, **100%** kỹ năng được chẩn đoán có mastery khởi tạo và trang chủ hiện lộ
  trình "học gì tiếp" **không cần hướng dẫn**.
- **SC-002**: Lộ trình **không bao giờ** đề xuất kỹ năng có tiên quyết chưa đạt (đo bằng test trên đồ thị
  kỹ năng: **0** vi phạm trên bộ ca kiểm thử).
- **SC-003**: Với cùng một lịch sử trả lời, mastery BKT **tất định & đơn điệu hợp lý** (đúng → tăng, sai →
  giảm/chậm) — kiểm bằng unit test, **≥ 80% coverage** cho `@synaptek/learning-path`.
- **SC-004**: Bản đồ điểm yếu chỉ đúng **kỹ năng yếu nhất** và **dạng lỗi hay mắc** khớp lịch sử trả lời
  trên bộ dữ liệu mẫu (kiểm bằng test/E2E).
- **SC-005**: Streak +1 đúng theo ngày và **reset** khi bỏ lỡ; XP & huy hiệu mở khóa đúng mốc, **không**
  trùng lặp (đo bằng test mô phỏng nhiều ngày).
- **SC-006**: Job nền rà "đến hạn" là **idempotent**: chạy 2 lần trong một chu kỳ tạo **đúng 1** nhắc/học
  sinh (đo bằng test/integration).
- **SC-007**: Học sinh **chưa cấp quyền push** vẫn nhận được nhắc **trong app** khi có kỹ năng đến hạn
  (**100%** trường hợp) — push không phải điều kiện để thấy nhắc.

## Assumptions

- **Mô hình mastery = BKT** (D19 sẽ ghi): 4 tham số chuẩn (p-init, p-transit/learn, p-slip, p-guess) với
  **giá trị mặc định hợp lý**, tinh chỉnh sau bằng dữ liệu thật. Một kỹ năng = một đơn vị BKT (skill là
  đơn vị mastery nguyên tử — `@synaptek/curriculum`).
- **Ngưỡng "đã đạt" = mastery ≥ 0.95** (chuẩn BKT) và **bài chẩn đoán ~5–8 câu** trải kỹ năng nền — đều
  là tham số cấu hình, bắt đầu bằng giá trị này, điều chỉnh theo trải nghiệm.
- **Gamification đầy đủ** (D20 sẽ ghi) = streak + XP + huy hiệu; bộ huy hiệu khởi đầu nhỏ (vài mốc tiêu
  biểu), mở rộng dần như content.
- **Ôn ngắt quãng** dùng một thuật toán giãn cách nhẹ (**SM-2 đơn giản hóa**, có thể lấy mastery BKT làm
  đầu vào điều chỉnh khoảng cách) — đủ tốt, không cần tối ưu học thuật ở M2.
- **Cron + push** (D21 sẽ ghi): job nền = **Supabase scheduled Edge Function**; push qua **expo-
  notifications**. **Rủi ro**: web hạn chế push, native cần **build EAS + quyền hệ thống** → ở môi trường
  web/dev có thể chưa chạy thật; vì vậy nhắc **trong app** là đường đảm bảo, push là bổ sung.
- **Định nghĩa & thiết kế huy hiệu** là việc cần làm trong M2 (định danh + điều kiện + hình ảnh/biểu
  tượng); khởi đầu nhỏ, mở rộng dần như content.
- **Mastery M2 = client tính + lưu** vào `skill_mastery`; **chấm/điểm chính thức server-authoritative
  (D4)** vẫn để M3. M2 không mở quyền chéo-vai-trò.
- **Mốc thời gian/ngày = giờ Việt Nam (Asia/Ho_Chi_Minh)** để tính streak & "đến hạn", nhất quán cho mọi
  học sinh thay vì giờ thiết bị.
- **XP theo độ khó**: schema câu hỏi thêm trường `difficulty` **tùy chọn** (D6/D14); câu chưa gắn →
  fallback theo loại câu. Không bắt buộc tag lại toàn bộ ~120 câu seed ngay.
- **Tái dùng có sẵn**: `@synaptek/curriculum` (skill graph + tiên quyết) và `attempts` (M1) là đầu vào;
  **không** thêm migration trừ khi thiếu cột cho gamification (chốt ở plan).

## Out of Scope (M2)

- Giáo viên/lớp/giao bài, **chấm chính thức server-side**, ghi đè điểm, phân tích lớp, RLS chéo-vai-trò →
  **M3**.
- Phụ huynh theo dõi; mở rộng đủ lớp 1–5; công cụ soạn nội dung/huy hiệu trong app → **M4**.
- EAS Build / ship store / offline đầy đủ → **M5** (M2 chỉ chuẩn bị đường push, không phụ thuộc store).
- Tinh chỉnh tham số BKT bằng dữ liệu lớn / A-B test mô hình → tương lai.
- Bảng xếp hạng (leaderboard) / yếu tố xã hội → ngoài phạm vi (cân nhắc sau, tránh áp lực so sánh trẻ em).
