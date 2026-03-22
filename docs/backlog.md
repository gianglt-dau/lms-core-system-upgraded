# Project Backlog — LMS Core System Admission Module

| Trường | Nội dung |
|--------|---------|
| **Tài liệu** | Product Backlog |
| **Phiên bản** | 2.0 Draft + Roadmap v3.0 |
| **Ngày** | 2026-03-22 |
| **Phương pháp** | Scrum / Agile |

---

## Quy ước

### Định dạng User Story
```
AS A <actor>
I WANT TO <action>
SO THAT <benefit>
```

### Story Points (Fibonacci)
| Points | Ý nghĩa |
|--------|---------|
| 1 | Trivial — vài dòng code |
| 2 | Simple — dưới 1 giờ |
| 3 | Small — nửa ngày |
| 5 | Medium — 1 ngày |
| 8 | Large — 2–3 ngày |
| 13 | X-Large — cần break down |

### Priority
| Ký hiệu | Mức độ |
|---------|--------|
| 🔴 | Must Have — blocking |
| 🟡 | Should Have — important |
| 🟢 | Nice to Have — enhancement |
| ⚪ | Future — out of current scope |

---

## EPIC 1: Core Admission Flow (v2.0)

> Toàn bộ luồng tuyển sinh cốt lõi từ frontend đến database.

---

### STORY-001: Setup dự án Backend

**🔴 Must Have | 3 points | ⬜ To Do**

```
AS A developer
I WANT TO có project backend Node.js với cấu trúc thư mục rõ ràng
SO THAT team có thể phát triển theo kiến trúc nhất quán
```

**Acceptance Criteria:**
- [ ] Khởi tạo project Node.js với đầy đủ dependencies cần thiết
- [ ] Cấu trúc thư mục phân tầng: routes, controllers, services, models, config
- [ ] File khởi động (entry point) tách biệt với file cấu hình Express
- [ ] `npm start` / `npm run dev` chạy server thành công

---

### STORY-002: Kết nối database với Connection Pool

**🔴 Must Have | 3 points | ⬜ To Do**

```
AS A developer
I WANT TO có module kết nối database dùng connection pool
SO THAT server xử lý nhiều request đồng thời không bị nghẻn kết nối
```

**Acceptance Criteria:**
- [ ] Kết nối database qua connection pool
- [ ] Cấu hình pool đọc từ biến môi trường (host, port, user, password, database name)
- [ ] Giới hạn số connection đồng thời phù hợp
- [ ] Hàm khởi tạo schema tự tạo bảng dữ liệu khi server start
- [ ] An toàn khi restart nhiều lần (idempotent)

---

### STORY-003: API POST /api/admissions — Tạo đăng ký

**🔴 Must Have | 5 points | ⬜ To Do**

```
AS A học viên
I WANT TO gửi thông tin đăng ký qua API
SO THAT hồ sơ của tôi được lưu vào hệ thống
```

**Acceptance Criteria:**
- [ ] `POST /api/admissions` nhận body `{ fullName, email, course }`
- [ ] Validate: fullName, email, course đều bắt buộc → 400 nếu thiếu
- [ ] Validate: email đúng định dạng → 400 nếu sai
- [ ] Chuẩn hóa dữ liệu trước khi lưu
- [ ] Lưu vào database với trạng thái mặc định là 'Pending'
- [ ] Trả về 201 kèm object hồ sơ vừa tạo
- [ ] Dùng parameterized queries (không nối chuỗi SQL)

---

### STORY-004: API GET /api/admissions — Lấy danh sách

**🔴 Must Have | 3 points | ⬜ To Do**

```
AS A admin
I WANT TO xem toàn bộ danh sách hồ sơ đăng ký
SO THAT tôi biết có bao nhiêu người đăng ký và thông tin của họ
```

**Acceptance Criteria:**
- [ ] `GET /api/admissions` trả về `{ total, data: [...] }`
- [ ] Danh sách sắp xếp theo thứ tự mới nhất trước
- [ ] Mỗi record có đầy đủ: id, họ tên, email, khóa học, trạng thái, thời gian đăng ký
- [ ] Tên trường JSON dùng camelCase
- [ ] Trả về mảng rỗng (không lỗi) khi chưa có dữ liệu

---

### STORY-005: API GET /api/health — Health Check

**🔴 Must Have | 1 point | ⬜ To Do**

```
AS A devops engineer
I WANT TO có endpoint health check
SO THAT tôi có thể giám sát server và dùng trong Docker healthcheck
```

**Acceptance Criteria:**
- [ ] `GET /api/health` → HTTP 200 với thông báo trạng thái
- [ ] Không truy vấn database
- [ ] Response ngay lập tức (< 50ms)

---

### STORY-006: Xử lý lỗi toàn cục (Global Error Handler)

**🔴 Must Have | 2 points | ⬜ To Do**

```
AS A developer
I WANT TO có centralized error handling
SO THAT mọi lỗi đều trả về JSON nhất quán thay vì HTML error page
```

**Acceptance Criteria:**
- [ ] URL không tồn tại trả HTTP 404 với message rõ ràng
- [ ] Lỗi server không xác định trả HTTP 500 với message phù hợp
- [ ] Validation errors lưu thông tin status code, controller bắt và trả về đúng mã
- [ ] Lỗi không xác định được chuyển tới error handler trung tâm

---

### STORY-007: Quản lý biến môi trường đa môi trường

**🔴 Must Have | 2 points | ⬜ To Do**

```
AS A developer
I WANT TO có cấu hình riêng cho từng môi trường (dev, build)
SO THAT không cần sửa code khi deploy sang môi trường khác
```

**Acceptance Criteria:**
- [ ] Ứng dụng tự động chọn file cấu hình dựa trên biến môi trường
- [ ] Fallback về file cấu hình mặc định nếu file theo môi trường không tồn tại
- [ ] Biến môi trường phải được nạp trước khi ứng dụng khởi tạo các module khác
- [ ] File cấu hình cho môi trường local development
- [ ] File cấu hình cho môi trường Docker build
- [ ] Không hardcode bất kỳ credentials nào trong source code

---

### STORY-008: Setup dự án Frontend React + Vite

**🔴 Must Have | 2 points | ⬜ To Do**

```
AS A developer
I WANT TO có project frontend với framework hiện đại
SO THAT có thể phát triển UI nhanh với hot-reload
```

**Acceptance Criteria:**
- [ ] Dùng React làm UI framework, Vite làm build tool
- [ ] Dev server có thể truy cập từ các container Docker
- [ ] `npm run dev` khởi động thành công
- [ ] `npm run build` tạo ra bundle hợp lệ

---

### STORY-009: Form đăng ký tuyển sinh (Frontend)

**🔴 Must Have | 5 points | ⬜ To Do**

```
AS A học viên
I WANT TO điền form đăng ký và gửi trực tiếp trên web
SO THAT tôi có thể đăng ký khóa học mà không cần liên hệ qua điện thoại
```

**Acceptance Criteria:**
- [ ] 3 trường input: Họ tên (text), Email (email type), Khóa học (select)
- [ ] Select options: IT, Quản trị kinh doanh, Thiết kế đồ họa
- [ ] Form state được quản lý đúng cách (controlled)
- [ ] Nút submit: loading state + disabled khi đang gửi
- [ ] Hiển thị thông báo thành công/thất bại rõ ràng
- [ ] Reset form về rỗng sau khi gửi thành công
- [ ] API URL đọc từ biến môi trường, có fallback mặc định

---

### STORY-010: Danh sách đăng ký (Frontend)

**🔴 Must Have | 3 points | ⬜ To Do**

```
AS A học viên / admin
I WANT TO xem danh sách người đã đăng ký ngay trên cùng trang
SO THAT tôi có thể xác nhận đăng ký của mình đã được ghi nhận
```

**Acceptance Criteria:**
- [ ] Tự động tải danh sách khi trang được mở
- [ ] Cập nhật ngay sau khi gửi form thành công
- [ ] Hiển thị loading indicator trong khi đang fetch
- [ ] Hiển thị thông báo lỗi khi fetch thất bại
- [ ] Mỗi row: ID, Họ tên, Email, Khóa học, Trạng thái, Thời gian

---

### STORY-011: Content Security Policy

**🔴 Must Have | 1 point | ⬜ To Do**

```
AS A security-conscious developer
I WANT TO có CSP header hạn chế tài nguyên được phép tải
SO THAT giảm nguy cơ XSS injection
```

**Acceptance Criteria:**
- [ ] Khai báo Content Security Policy trong HTML
- [ ] `connect-src` cho phép kết nối đến backend (hỗ trợ nhiều port dev/build)
- [ ] WebSocket connections cho dev server được phép

---

## EPIC 2: Infrastructure & DevOps (v2.0)

> Toàn bộ hạ tầng Docker, scripts, và môi trường triển khai.

---

### STORY-012: Môi trường Dev — Database trong Docker

**🔴 Must Have | 3 points | ⬜ To Do**

```
AS A developer
I WANT TO chạy database trong Docker nhưng code trực tiếp trên máy host
SO THAT có hot-reload, debug dễ dàng, không cần rebuild Docker mỗi khi sửa code
```

**Acceptance Criteria:**
- [ ] Docker Compose file môi trường Dev chỉ chạy database
- [ ] Database healthcheck đảm bảo container healthy trước khi báo done
- [ ] Port database được map ra ngoài để backend local kết nối
- [ ] Script khởi động tự động: dừng cũ → khởi động mới → chờ healthy → báo "ready"

---

### STORY-013: Môi trường Build — Full stack trong Docker

**🔴 Must Have | 5 points | ⬜ To Do**

```
AS A developer / DevOps
I WANT TO chạy toàn bộ stack (FE + BE + DB) trong Docker
SO THAT có thể kiểm tra hệ thống gần giống production trước khi deploy
```

**Acceptance Criteria:**
- [ ] Docker Compose file môi trường Build có đủ 3 services: Database, Backend, Frontend
- [ ] Database healthcheck + Backend chờ database healthy mới khởi động
- [ ] Backend build từ Dockerfile riêng, dùng file cấu hình môi trường Build
- [ ] Frontend build với đúng API URL qua build arguments
- [ ] Port riêng để tránh conflict với môi trường Dev
- [ ] Script khởi động chờ từng service healthy và báo "BUILD environment is ready!"

---

### STORY-014: Dockerfile cho Backend

**🔴 Must Have | 2 points | ⬜ To Do**

```
AS A DevOps engineer
I WANT TO có Dockerfile cho backend
SO THAT backend có thể chạy trong container một cách nhất quán
```

**Acceptance Criteria:**
- [ ] Base image Node.js LTS phiên bản được chấp nhận
- [ ] Chỉ copy những file cần thiết (không copy node_modules từ host)
- [ ] Cài đặt dependencies trong image build
- [ ] Expose đúng port service lắng nghe

---

### STORY-015: Dockerfile cho Frontend với build args

**🔴 Must Have | 3 points | ⬜ To Do**

```
AS A DevOps engineer
I WANT TO Frontend được build với đúng API URL trong Docker
SO THAT bundle JS trỏ đúng về Backend URL trong môi trường Build
```

**Acceptance Criteria:**
- [ ] API URL nhận giá trị từ docker-compose build arguments
- [ ] Biến được expose cho quá trình build frontend
- [ ] Bundle JS được tạo ra với đúng API URL
- [ ] Serve ứng dụng trên port đúng với docker-compose mapping

---

### STORY-016: NPM Scripts tiện lợi ở root

**🟡 Should Have | 1 point | ⬜ To Do**

```
AS A developer
I WANT TO chạy các lệnh phổ biến từ thư mục root
SO THAT không cần nhớ đường dẫn đến từng sub-project
```

**Acceptance Criteria:**
- [ ] Script khởi động database Dev
- [ ] Script chạy backend local
- [ ] Script chạy frontend local
- [ ] Script khởi động môi trường Build
- [ ] Script tắt môi trường Build

---

## EPIC 3: Documentation (v2.0)

> Tài liệu dành cho developer mới và team.

---

### STORY-017: Tài liệu Onboarding

**🟡 Should Have | 2 points | ⬜ To Do**

```
AS A new developer
I WANT TO có hướng dẫn step-by-step để setup môi trường
SO THAT có thể bắt đầu code trong ngày đầu tiên
```

---

### STORY-018: Tài liệu Troubleshooting

**🟡 Should Have | 2 points | ⬜ To Do**

```
AS A developer
I WANT TO biết nguyên nhân và cách fix các lỗi đã gặp
SO THAT không mất thời gian debug lại những vấn đề đã có lời giải
```

---

### STORY-019: Tài liệu Backend Guide và Frontend Guide

**🟡 Should Have | 3 points | ⬜ To Do**

```
AS A beginner developer
I WANT TO hiểu cách từng thư viện và file hoạt động
SO THAT có thể đọc hiểu và mở rộng code
```

---

### STORY-020: PRD, SRS, Use Cases, Project Backlog

**🟡 Should Have | 5 points | ⬜ To Do**

```
AS A product manager / tech lead
I WANT TO có đầy đủ tài liệu sản phẩm và kỹ thuật
SO THAT có baseline để phát triển phiên bản tiếp theo
```

---

## Sprint Planning — v2.0

| Sprint | Stories | Points | Nội dung chính |
|--------|---------|--------|---------------|
| Sprint 1 | 001–007 | 19 | Backend core: DB, API, validation, error handling |
| Sprint 2 | 008–011 | 11 | Frontend: form, danh sách, CSP |
| Sprint 3 | 012–016 | 14 | Infrastructure: Docker, scripts, environments |
| Sprint 4 | 017–020 | 12 | Documentation |
| **Total** | **20** | **56** | |

---

## EPIC 4: Roadmap v3.0 (Planned ⏳)

> Các tính năng tiếp theo — chưa triển khai.

---

### STORY-021: Authentication — Đăng nhập Admin

**⚪ Future | 8 points**

```
AS A admin
I WANT TO đăng nhập với username/password
SO THAT chỉ nhân viên được phép xem và quản lý hồ sơ
```

**Acceptance Criteria:**
- [ ] `POST /api/auth/login` → JWT token
- [ ] Middleware xác thực JWT cho các route protected
- [ ] Frontend: form đăng nhập, lưu token, redirect
- [ ] `GET /api/admissions` yêu cầu token hợp lệ

---

### STORY-022: Duyệt / Từ chối hồ sơ

**⚪ Future | 5 points**

```
AS A admin
I WANT TO thay đổi trạng thái hồ sơ (Approve/Reject)
SO THAT học viên biết kết quả xét tuyển
```

**Acceptance Criteria:**
- [ ] `PATCH /api/admissions/:id/status` với body `{ status: "Approved" | "Rejected" }`
- [ ] Chỉ Admin (có JWT) được gọi endpoint này
- [ ] Trạng thái hợp lệ: `Pending`, `Approved`, `Rejected`
- [ ] Frontend: nút Approve/Reject trong danh sách

---

### STORY-023: Phân trang danh sách

**⚪ Future | 5 points**

```
AS A admin
I WANT TO xem danh sách có phân trang
SO THAT hiệu năng không giảm khi có hàng nghìn hồ sơ
```

**Acceptance Criteria:**
- [ ] `GET /api/admissions?page=1&limit=20`
- [ ] Response có `{ total, page, totalPages, data }`
- [ ] Frontend: nút Previous/Next, hiển thị trang hiện tại

---

### STORY-024: Tìm kiếm và lọc hồ sơ

**⚪ Future | 5 points**

```
AS A admin
I WANT TO tìm kiếm hồ sơ theo tên/email và lọc theo khóa học/trạng thái
SO THAT nhanh chóng tìm được hồ sơ cần xử lý
```

**Acceptance Criteria:**
- [ ] `GET /api/admissions?search=nguyen&course=IT&status=Pending`
- [ ] Tìm kiếm case-insensitive trên `full_name` và `email`
- [ ] Frontend: thanh tìm kiếm + bộ lọc dropdown

---

### STORY-025: Gửi email xác nhận

**⚪ Future | 8 points**

```
AS A học viên
I WANT TO nhận email xác nhận sau khi đăng ký thành công
SO THAT tôi có bằng chứng đã đăng ký và biết bước tiếp theo
```

**Acceptance Criteria:**
- [ ] Tích hợp SMTP service (Nodemailer hoặc SendGrid)
- [ ] Email gửi async sau khi lưu DB thành công (không block API response)
- [ ] Template email: xác nhận thông tin + thông báo timeline xét duyệt

---

### STORY-026: Dashboard thống kê

**⚪ Future | 8 points**

```
AS A admin
I WANT TO xem tổng quan số liệu đăng ký
SO THAT nắm được tình hình tuyển sinh nhanh chóng
```

**Acceptance Criteria:**
- [ ] `GET /api/admissions/stats` → `{ total, byStatus, byCourse, byCourse }`
- [ ] Frontend: cards tổng số, chart phân bố theo khóa học, chart theo tháng

---

## Velocity & Capacity Planning (tham khảo)

| Metric | Giá trị |
|--------|---------|
| Velocity ước tính mỗi sprint | ~14 points/sprint |
| Total points v2.0 planned | 56 points |
| Estimated points v3.0 roadmap | 39 points |
| Estimated sprints for v3.0 | ~3 sprints |

---

## Definition of Ready (DoR)

Story sẵn sàng đưa vào sprint khi:
- [ ] User story được viết đúng format AS A/I WANT/SO THAT
- [ ] Acceptance Criteria rõ ràng và có thể test được
- [ ] Story points đã được team estimate
- [ ] Dependencies đã xác định và resolved
- [ ] Story points ≤ 8 (nếu > 8 cần break down)

## Definition of Done (DoD)

Story được coi là Done khi:
- [ ] Code implement đúng Acceptance Criteria
- [ ] Chạy được ở cả môi trường Dev và Build
- [ ] Không có thông tin nhạy cảm hardcode trong code
- [ ] Không có lỗi lint/compile
- [ ] Code review approved (nếu team > 1 người)
- [ ] Documentation cập nhật nếu cần
