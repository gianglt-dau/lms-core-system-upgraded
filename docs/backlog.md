# Project Backlog — LMS Core System Admission Module

| Trường | Nội dung |
|--------|---------|
| **Tài liệu** | Product Backlog (Reverse-engineered) |
| **Phiên bản** | 2.0 Released + Roadmap v3.0 |
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

## EPIC 1: Core Admission Flow (v2.0 — Released ✅)

> Toàn bộ luồng tuyển sinh cốt lõi từ frontend đến database.

---

### STORY-001: Setup dự án Backend

**🔴 Must Have | 3 points | ✅ Done**

```
AS A developer
I WANT TO có project backend Node.js với cấu trúc thư mục rõ ràng
SO THAT team có thể phát triển theo kiến trúc nhất quán
```

**Acceptance Criteria:**
- [x] Khởi tạo `package.json` với dependencies: `express`, `mysql2`, `dotenv`, `cors`
- [x] Tạo cấu trúc thư mục phân tầng: `routes/`, `controllers/`, `services/`, `models/`, `config/`
- [x] `server.js` là entry point, `app.js` chứa cấu hình Express
- [x] `npm start` / `npm run dev` chạy server thành công

**Files:** `backend/package.json`, `backend/src/server.js`, `backend/src/app.js`

---

### STORY-002: Kết nối MySQL với Connection Pool

**🔴 Must Have | 3 points | ✅ Done**

```
AS A developer
I WANT TO có module kết nối MySQL dùng connection pool
SO THAT server xử lý nhiều request đồng thời không bị nghẽn kết nối
```

**Acceptance Criteria:**
- [x] Dùng `mysql2/promise` với `createPool()`
- [x] Pool config đọc từ environment variables (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
- [x] `connectionLimit = 10`
- [x] `initializeDatabase()` tự tạo bảng `admissions` khi server start
- [x] `CREATE TABLE IF NOT EXISTS` — idempotent, an toàn khi restart

**Files:** `backend/src/config/db.js`

---

### STORY-003: API POST /api/admissions — Tạo đăng ký

**🔴 Must Have | 5 points | ✅ Done**

```
AS A học viên
I WANT TO gửi thông tin đăng ký qua API
SO THAT hồ sơ của tôi được lưu vào hệ thống
```

**Acceptance Criteria:**
- [x] `POST /api/admissions` nhận body `{ fullName, email, course }`
- [x] Validate: fullName, email, course đều bắt buộc → 400 nếu thiếu
- [x] Validate: email đúng định dạng → 400 nếu sai
- [x] Chuẩn hóa: email lowercase, fullName trim
- [x] Lưu vào DB với `status = 'Pending'`
- [x] Trả về 201 kèm object admission vừa tạo
- [x] Dùng prepared statements (không string concat)

**Files:** `admissionRoutes.js`, `admissionController.js`, `admissionService.js`, `admissionModel.js`

---

### STORY-004: API GET /api/admissions — Lấy danh sách

**🔴 Must Have | 3 points | ✅ Done**

```
AS A admin
I WANT TO xem toàn bộ danh sách hồ sơ đăng ký
SO THAT tôi biết có bao nhiêu người đăng ký và thông tin của họ
```

**Acceptance Criteria:**
- [x] `GET /api/admissions` trả về `{ total, data: [...] }`
- [x] Danh sách sắp xếp theo `id DESC` (mới nhất trước)
- [x] Mỗi record có đầy đủ: `id`, `fullName`, `email`, `course`, `status`, `submittedAt`
- [x] Column mapping: `full_name → fullName`, `submitted_at → submittedAt`
- [x] Trả về mảng rỗng (không lỗi) khi chưa có dữ liệu

**Files:** `admissionController.js`, `admissionModel.js`

---

### STORY-005: API GET /api/health — Health Check

**🔴 Must Have | 1 point | ✅ Done**

```
AS A devops engineer
I WANT TO có endpoint health check
SO THAT tôi có thể giám sát server và dùng trong Docker healthcheck
```

**Acceptance Criteria:**
- [x] `GET /api/health` → HTTP 200 `{ status: "API is running smoothly" }`
- [x] Không truy vấn database
- [x] Response ngay lập tức (< 50ms)

**Files:** `backend/src/app.js`

---

### STORY-006: Xử lý lỗi toàn cục (Global Error Handler)

**🔴 Must Have | 2 points | ✅ Done**

```
AS A developer
I WANT TO có centralized error handling
SO THAT mọi lỗi đều trả về JSON nhất quán thay vì HTML error page
```

**Acceptance Criteria:**
- [x] 404 handler: `{ message: "Endpoint không tồn tại." }`
- [x] 500 handler: `{ message: "Đã xảy ra lỗi nội bộ server." }`
- [x] Validation errors từ Service được Controller bắt và trả về `error.statusCode`
- [x] Lỗi không xác định được chuyển qua `next(error)` tới error handler

**Files:** `backend/src/app.js`, `admissionController.js`

---

### STORY-007: Quản lý biến môi trường đa môi trường

**🔴 Must Have | 2 points | ✅ Done**

```
AS A developer
I WANT TO có cấu hình riêng cho từng môi trường (dev, build)
SO THAT không cần sửa code khi deploy sang môi trường khác
```

**Acceptance Criteria:**
- [x] `app.js` load `.env.{NODE_ENV}` tự động
- [x] Fallback về `.env` nếu file theo env không tồn tại
- [x] `dotenv.config()` được gọi TRƯỚC mọi `require()` khác
- [x] `.env.dev` — cấu hình local development
- [x] `.env.build` — cấu hình Docker build environment
- [x] Không hardcode bất kỳ credential nào trong source code

**Files:** `backend/src/app.js`, `backend/.env.dev`, `backend/.env.build`

---

### STORY-008: Setup dự án Frontend React + Vite

**🔴 Must Have | 2 points | ✅ Done**

```
AS A developer
I WANT TO có project frontend với React và Vite
SO THAT có thể phát triển UI nhanh với HMR
```

**Acceptance Criteria:**
- [x] Khởi tạo với `@vitejs/plugin-react`
- [x] Dev server port `5173`, bind `0.0.0.0` (hỗ trợ Docker)
- [x] `npm run dev` khởi động thành công
- [x] `npm run build` tạo ra `dist/` hợp lệ

**Files:** `frontend/package.json`, `frontend/vite.config.js`

---

### STORY-009: Form đăng ký tuyển sinh (Frontend)

**🔴 Must Have | 5 points | ✅ Done**

```
AS A học viên
I WANT TO điền form đăng ký và gửi trực tiếp trên web
SO THAT tôi có thể đăng ký khóa học mà không cần liên hệ qua điện thoại
```

**Acceptance Criteria:**
- [x] 3 trường input: Họ tên (text), Email (email type), Khóa học (select)
- [x] Select options: IT, Quản trị kinh doanh, Thiết kế đồ họa
- [x] Controlled inputs — React quản lý state
- [x] Nút submit: loading state + disabled khi đang gửi
- [x] Hiển thị `✅ message` khi thành công, `❌ message` khi lỗi
- [x] Reset form về rỗng sau khi gửi thành công
- [x] POST đến `VITE_API_URL || 'http://localhost:5000'`

**Files:** `frontend/src/App.jsx`

---

### STORY-010: Danh sách đăng ký (Frontend)

**🔴 Must Have | 3 points | ✅ Done**

```
AS A học viên / admin
I WANT TO xem danh sách người đã đăng ký ngay trên cùng trang
SO THAT tôi có thể xác nhận đăng ký của mình đã được ghi nhận
```

**Acceptance Criteria:**
- [x] Auto-load khi trang mở (`useEffect`)
- [x] Cập nhật ngay sau khi gửi form thành công
- [x] Hiển thị loading indicator trong khi đang fetch
- [x] Hiển thị thông báo lỗi khi fetch thất bại
- [x] Mỗi row: ID, Họ tên, Email, Khóa học, Trạng thái, Thời gian

**Files:** `frontend/src/App.jsx`

---

### STORY-011: Content Security Policy

**🔴 Must Have | 1 point | ✅ Done**

```
AS A security-conscious developer
I WANT TO có CSP header hạn chế tài nguyên được phép tải
SO THAT giảm nguy cơ XSS injection
```

**Acceptance Criteria:**
- [x] `<meta http-equiv="Content-Security-Policy">` trong `index.html`
- [x] `connect-src` cho phép `localhost:*` (hỗ trợ nhiều port dev/build)
- [x] `ws://localhost:*` cho Vite HMR WebSocket

**Files:** `frontend/index.html`

---

## EPIC 2: Infrastructure & DevOps (v2.0 — Released ✅)

> Toàn bộ hạ tầng Docker, scripts, và môi trường triển khai.

---

### STORY-012: Môi trường Dev — MySQL trong Docker

**🔴 Must Have | 3 points | ✅ Done**

```
AS A developer
I WANT TO chạy MySQL trong Docker nhưng code trực tiếp trên máy host
SO THAT có HMR, debug dễ dàng, không cần rebuild Docker mỗi khi sửa code
```

**Acceptance Criteria:**
- [x] `docker-compose.dev.yml` chỉ chạy MySQL (`lms-mysql-dev`)
- [x] MySQL healthcheck đảm bảo container healthy trước khi báo done
- [x] Port `3306` được map ra ngoài để backend local kết nối
- [x] `clean_dev.ps1` tự động: down → up → wait healthy → báo "ready"

**Files:** `docker-compose.dev.yml`, `clean_dev.ps1`

---

### STORY-013: Môi trường Build — Full stack trong Docker

**🔴 Must Have | 5 points | ✅ Done**

```
AS A developer / DevOps
I WANT TO chạy toàn bộ stack (FE + BE + DB) trong Docker
SO THAT có thể kiểm tra hệ thống gần giống production trước khi deploy
```

**Acceptance Criteria:**
- [x] `docker-compose.build.yml` có đủ 3 services: MySQL, Backend, Frontend
- [x] MySQL healthcheck + Backend `depends_on: condition: service_healthy`
- [x] Backend build từ `./backend/Dockerfile`, dùng `.env.build`
- [x] Frontend build từ `./frontend/Dockerfile` với `build args` cho `VITE_API_URL`
- [x] Port riêng để tránh conflict: 3307 (MySQL), 5001 (BE), 5174 (FE)
- [x] `clean_build.ps1` chờ từng service healthy và báo "BUILD environment is ready!"

**Files:** `docker-compose.build.yml`, `clean_build.ps1`

---

### STORY-014: Dockerfile cho Backend

**🔴 Must Have | 2 points | ✅ Done**

```
AS A DevOps engineer
I WANT TO có Dockerfile cho backend
SO THAT backend có thể chạy trong container một cách nhất quán
```

**Acceptance Criteria:**
- [x] Base image Node.js 18 LTS
- [x] Chỉ copy những file cần thiết (tránh COPY node_modules)
- [x] `npm install` trong image build
- [x] Expose đúng port

**Files:** `backend/Dockerfile`

---

### STORY-015: Dockerfile cho Frontend với build args

**🔴 Must Have | 3 points | ✅ Done**

```
AS A DevOps engineer
I WANT TO Frontend được build với đúng VITE_API_URL trong Docker
SO THAT bundle JS trỏ đúng về Backend URL trong môi trường Build
```

**Acceptance Criteria:**
- [x] `ARG VITE_API_URL` nhận giá trị từ docker-compose `build.args`
- [x] `ENV VITE_API_URL=$VITE_API_URL` để Vite đọc khi build
- [x] `RUN npm run build` bundle với đúng API URL
- [x] Serve bằng lệnh `preview` trên port 5174

**Files:** `frontend/Dockerfile`

---

### STORY-016: NPM Scripts tiện lợi ở root

**🟡 Should Have | 1 point | ✅ Done**

```
AS A developer
I WANT TO chạy các lệnh phổ biến từ thư mục root
SO THAT không cần nhớ đường dẫn đến từng sub-project
```

**Acceptance Criteria:**
- [x] `npm run dev:db` — khởi động MySQL dev
- [x] `npm run dev:be` — chạy backend local
- [x] `npm run dev:fe` — chạy frontend local
- [x] `npm run build:up` — khởi động môi trường Build
- [x] `npm run build:down` — tắt môi trường Build

**Files:** `package.json` (root)

---

## EPIC 3: Documentation (v2.0 — Released ✅)

> Tài liệu dành cho developer mới và team.

---

### STORY-017: Tài liệu Onboarding

**🟡 Should Have | 2 points | ✅ Done**

```
AS A new developer
I WANT TO có hướng dẫn step-by-step để setup môi trường
SO THAT có thể bắt đầu code trong ngày đầu tiên
```

**Files:** `docs/onboarding.md`

---

### STORY-018: Tài liệu Troubleshooting

**🟡 Should Have | 2 points | ✅ Done**

```
AS A developer
I WANT TO biết nguyên nhân và cách fix các lỗi đã gặp
SO THAT không mất thời gian debug lại những vấn đề đã có lời giải
```

**Files:** `docs/troubleshooting.md`

---

### STORY-019: Tài liệu Backend Guide và Frontend Guide

**🟡 Should Have | 3 points | ✅ Done**

```
AS A beginner developer
I WANT TO hiểu cách từng thư viện và file hoạt động
SO THAT có thể đọc hiểu và mở rộng code
```

**Files:** `docs/backend-guide.md`, `docs/frontend-guide.md`

---

### STORY-020: PRD, SRS, Use Cases, Project Backlog

**🟡 Should Have | 5 points | ✅ Done**

```
AS A product manager / tech lead
I WANT TO có đầy đủ tài liệu sản phẩm và kỹ thuật
SO THAT có baseline để phát triển phiên bản tiếp theo
```

**Files:** `docs/PRD.md`, `docs/SRS.md`, `docs/use-cases.md`, `docs/backlog.md`

---

## Sprint Summary — v2.0

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
| Velocity thực tế v2.0 | ~14 points/sprint |
| Total points v2.0 released | 56 points |
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
