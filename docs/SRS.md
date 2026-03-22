# SRS — Software Requirements Specification
## LMS Core System — Admission Module

| Trường | Nội dung |
|--------|---------|
| **Tài liệu** | Software Requirements Specification |
| **Phiên bản** | 2.0 |
| **Trạng thái** | Implemented |
| **Chuẩn tham chiếu** | IEEE 830 |
| **Ngày** | 2026-03-22 |

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Tổng quan hệ thống](#2-tổng-quan-hệ-thống)
3. [Yêu cầu chức năng](#3-yêu-cầu-chức-năng)
4. [Yêu cầu phi chức năng](#4-yêu-cầu-phi-chức-năng)
5. [Đặc tả API](#5-đặc-tả-api)
6. [Đặc tả Database](#6-đặc-tả-database)
7. [Đặc tả môi trường triển khai](#7-đặc-tả-môi-trường-triển-khai)
8. [Ràng buộc thiết kế](#8-ràng-buộc-thiết-kế)
9. [Ma trận truy vết yêu cầu](#9-ma-trận-truy-vết-yêu-cầu)

---

## 1. Giới thiệu

### 1.1 Mục đích tài liệu

Tài liệu này mô tả đầy đủ các yêu cầu phần mềm của hệ thống LMS Admission Module phiên bản 2.0, bao gồm yêu cầu chức năng, phi chức năng, đặc tả API, cấu trúc cơ sở dữ liệu, và các ràng buộc kỹ thuật. Tài liệu được viết ngược từ codebase đã triển khai.

### 1.2 Phạm vi hệ thống

Hệ thống gồm hai thành phần:
- **Backend API** – Node.js/Express service, xử lý business logic và lưu trữ dữ liệu
- **Frontend Web** – React/Vite SPA (Single Page Application), giao diện người dùng

### 1.3 Định nghĩa và từ viết tắt

| Thuật ngữ | Định nghĩa |
|-----------|-----------|
| API | Application Programming Interface |
| SPA | Single Page Application — ứng dụng web một trang |
| REST | Representational State Transfer — kiến trúc API |
| HMR | Hot Module Replacement — cập nhật code không reload trang |
| CSP | Content Security Policy — chính sách bảo mật nội dung trình duyệt |
| Connection Pool | Tập hợp kết nối DB được tái sử dụng |
| Prepared Statement | Câu lệnh SQL được compile trước, tham số truyền riêng |
| Layered Architecture | Kiến trúc phân tầng: Route → Controller → Service → Model |

---

## 2. Tổng quan hệ thống

### 2.1 Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────┐
│                   Client Browser                     │
│  React SPA (Vite)  ─── fetch() ───► REST API        │
│  Port: 5173 (dev) / 5174 (build)                    │
└─────────────────────────────────────────────────────┘
                          │ HTTP/JSON
                          ▼
┌─────────────────────────────────────────────────────┐
│              Backend — Node.js + Express             │
│  Port: 5000 (dev) / 5001 (build)                    │
│                                                      │
│  app.js (middleware) → Routes → Controller           │
│                              → Service               │
│                              → Model                 │
└──────────────────────────┬──────────────────────────┘
                           │ mysql2 connection pool
                           ▼
┌─────────────────────────────────────────────────────┐
│                MySQL 8.0 Database                   │
│  Port: 3306 (dev) / 3307 (build)                    │
│  Database: lms_db_dev / lms_db_build                │
└─────────────────────────────────────────────────────┘
```

### 2.2 Kiến trúc Backend — Layered Architecture

```
HTTP Request
     │
     ▼
admissionRoutes.js   ← Định tuyến URL → Controller function
     │
     ▼
admissionController.js  ← Nhận req/res, gọi Service, trả JSON
     │
     ▼
admissionService.js  ← Validation, business rules, chuẩn hóa data
     │
     ▼
admissionModel.js    ← Câu lệnh SQL: INSERT, SELECT
     │
     ▼
db.js (mysql2 pool)  ← Kết nối MySQL
```

### 2.3 Luồng dữ liệu

```
[Browser] → JSON body → [Express middleware parse] → [Controller]
→ [Service validate] → [Model INSERT] → [MySQL]
← [Model SELECT by ID] ← [MySQL]
← [Controller trả JSON 201] ← [Browser hiển thị]
```

---

## 3. Yêu cầu chức năng

### FR-01: Tiếp nhận đăng ký tuyển sinh

**ID:** FR-01  
**Ưu tiên:** Must Have  
**Nguồn:** `admissionController.createAdmission`, `admissionService.submitAdmission`

#### FR-01.1 — Input
Hệ thống phải nhận HTTP POST request tới `/api/admissions` với body JSON:

```json
{
  "fullName": "string, bắt buộc, không rỗng",
  "email": "string, bắt buộc, định dạng email hợp lệ",
  "course": "string, bắt buộc, một trong: IT | Biz | Design"
}
```

#### FR-01.2 — Validation rules
Hệ thống phải thực hiện validate **trước khi** ghi vào database:

| Trường | Rule | Lỗi trả về |
|--------|------|-----------|
| `fullName` | Không được `null`, `undefined`, hoặc chuỗi rỗng | `400 "Vui lòng điền đầy đủ thông tin!"` |
| `email` | Không được `null`/rỗng; phải khớp pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `400 "Email không hợp lệ!"` |
| `course` | Không được `null`/rỗng | `400 "Vui lòng điền đầy đủ thông tin!"` |

#### FR-01.3 — Chuẩn hóa dữ liệu
Trước khi lưu, hệ thống phải:
- `fullName`: áp dụng `.trim()` — loại bỏ khoảng trắng đầu/cuối
- `email`: áp dụng `.trim().toLowerCase()` — chuẩn hóa về chữ thường

#### FR-01.4 — Lưu trữ
Hệ thống phải ghi vào bảng `admissions` với:
- `full_name` = fullName đã trim
- `email` = email đã chuẩn hóa
- `course` = course gốc
- `status` = `'Pending'` (mặc định khi tạo mới)
- `submitted_at` = thời điểm INSERT (do DB tự set)

#### FR-01.5 — Output thành công
```json
HTTP 201 Created
{
  "message": "Đăng ký thành công!",
  "data": {
    "id": 1,
    "fullName": "Nguyen Van A",
    "email": "nguyen.van.a@example.com",
    "course": "IT",
    "status": "Pending",
    "submittedAt": "2026-03-22T10:00:00.000Z"
  }
}
```

---

### FR-02: Lấy danh sách đăng ký

**ID:** FR-02  
**Ưu tiên:** Must Have  
**Nguồn:** `admissionController.getAdmissions`, `admissionModel.getAllAdmissions`

#### FR-02.1 — Input
HTTP GET request tới `/api/admissions`. Không yêu cầu body hay query params.

#### FR-02.2 — Output
```json
HTTP 200 OK
{
  "total": 2,
  "data": [
    {
      "id": 2,
      "fullName": "Le Thi B",
      "email": "b@example.com",
      "course": "Design",
      "status": "Pending",
      "submittedAt": "2026-03-22T10:05:00.000Z"
    },
    {
      "id": 1,
      "fullName": "Nguyen Van A",
      "email": "nguyen.van.a@example.com",
      "course": "IT",
      "status": "Pending",
      "submittedAt": "2026-03-22T10:00:00.000Z"
    }
  ]
}
```

#### FR-02.3 — Sắp xếp
Danh sách phải được sắp xếp theo `id DESC` — bản ghi mới nhất ở đầu.

---

### FR-03: Health Check

**ID:** FR-03  
**Ưu tiên:** Must Have  
**Nguồn:** `app.js` route `/api/health`

#### FR-03.1
HTTP GET `/api/health` phải trả về:
```json
HTTP 200 OK
{ "status": "API is running smoothly" }
```

Endpoint này phải phản hồi **ngay lập tức** mà không truy vấn database, dùng cho Docker healthcheck và monitoring.

---

### FR-04: Khởi tạo database tự động

**ID:** FR-04  
**Ưu tiên:** Must Have  
**Nguồn:** `config/db.js → initializeDatabase()`

#### FR-04.1
Khi server khởi động, hệ thống phải tự động tạo bảng `admissions` nếu chưa tồn tại bằng câu lệnh `CREATE TABLE IF NOT EXISTS`. Server chỉ bắt đầu nhận request sau khi bước này hoàn tất thành công.

---

### FR-05: Xử lý lỗi toàn cục

**ID:** FR-05  
**Ưu tiên:** Must Have  
**Nguồn:** `app.js` error handler middleware

| Tình huống | HTTP Status | Response body |
|-----------|------------|---------------|
| URL không tồn tại | `404` | `{ "message": "Endpoint không tồn tại." }` |
| Lỗi server không xác định | `500` | `{ "message": "Đã xảy ra lỗi nội bộ server." }` |
| Validation thất bại | `400` | `{ "message": "<nội dung lỗi cụ thể>" }` |

---

### FR-06: Giao diện Form đăng ký (Frontend)

**ID:** FR-06  
**Ưu tiên:** Must Have  
**Nguồn:** `frontend/src/App.jsx`

#### FR-06.1 — Các trường input
- `fullName`: text input, placeholder "Họ và tên", `required`
- `email`: email input, placeholder "Email", `required`
- `course`: select dropdown với options: `IT`, `Biz`, `Design` và option rỗng mặc định

#### FR-06.2 — Trạng thái loading
Khi đang gửi request, nút submit phải:
- Hiển thị text "Đang gửi..."
- `disabled = true` — không cho nhấn lại

#### FR-06.3 — Thông báo kết quả
- Thành công: hiển thị `"✅ " + message` từ API
- Thất bại/lỗi: hiển thị `"❌ " + message`
- Reset thông báo về rỗng mỗi khi bắt đầu gửi mới

#### FR-06.4 — Reset form
Sau khi gửi thành công, tất cả các trường input phải được reset về giá trị rỗng.

---

### FR-07: Giao diện danh sách đăng ký (Frontend)

**ID:** FR-07  
**Ưu tiên:** Must Have  
**Nguồn:** `frontend/src/App.jsx`

#### FR-07.1 — Tải tự động
Danh sách phải được gọi API và load tự động khi component mount lần đầu (`useEffect`).

#### FR-07.2 — Cập nhật sau submit
Sau khi gửi form thành công, `fetchAdmissions()` phải được gọi lại để cập nhật danh sách.

#### FR-07.3 — Trạng thái loading/error
- Trong khi đang tải: hiển thị indicator loading
- Khi có lỗi: hiển thị thông báo lỗi rõ ràng

---

## 4. Yêu cầu phi chức năng

### NFR-01: Hiệu năng

| Yêu cầu | Giá trị |
|---------|---------|
| Response time API trong điều kiện bình thường | < 500ms |
| Connection pool size | 10 connections |
| Connection queue limit | 0 (reject nếu full) |

### NFR-02: Bảo mật

| Yêu cầu | Triển khai |
|---------|-----------|
| Chống SQL Injection | Prepared statements với `pool.execute(sql, values)` |
| Chống XSS | CSP header trong `index.html` |
| Cross-Origin control | CORS middleware, cấu hình qua `CLIENT_ORIGIN` env var |
| Không hardcode credentials | Tất cả secrets trong `.env` files, không commit lên git |

### NFR-03: Khả dụng (Availability)

| Yêu cầu | Triển khai |
|---------|-----------|
| DB phải healthy trước khi BE nhận request | `initializeDatabase()` trong `bootstrap()` |
| Trong Docker: service ordering | `depends_on: condition: service_healthy` |
| Health endpoint cho monitoring | `GET /api/health` |

### NFR-04: Khả năng bảo trì (Maintainability)

| Yêu cầu | Triển khai |
|---------|-----------|
| Tách biệt concerns | Layered Architecture (Route/Controller/Service/Model) |
| Cấu hình qua environment | Không hardcode port, host, credentials |
| Hỗ trợ nhiều môi trường | `.env.dev`, `.env.build` auto-selected theo `NODE_ENV` |

### NFR-05: Tính di động (Portability)

| Yêu cầu | Triển khai |
|---------|-----------|
| Containerization | Dockerfile cho cả BE và FE |
| Multi-environment Docker | `docker-compose.dev.yml`, `docker-compose.build.yml` |
| OS | Windows (PowerShell scripts), Linux (Docker) |

---

## 5. Đặc tả API

### Base URL

| Môi trường | URL |
|-----------|-----|
| Dev | `http://localhost:5000` |
| Build | `http://localhost:5001` |

### Headers chung

```
Content-Type: application/json
```

### Endpoint 1: POST /api/admissions

**Mô tả:** Tạo hồ sơ đăng ký mới.

**Request:**
```
POST /api/admissions
Content-Type: application/json

{
  "fullName": "Nguyen Van A",
  "email": "a@example.com",
  "course": "IT"
}
```

**Response — Thành công (201):**
```json
{
  "message": "Đăng ký thành công!",
  "data": {
    "id": 1,
    "fullName": "Nguyen Van A",
    "email": "a@example.com",
    "course": "IT",
    "status": "Pending",
    "submittedAt": "2026-03-22T10:00:00.000Z"
  }
}
```

**Response — Lỗi validation (400):**
```json
{ "message": "Vui lòng điền đầy đủ thông tin!" }
{ "message": "Email không hợp lệ!" }
```

**Response — Lỗi server (500):**
```json
{ "message": "Đã xảy ra lỗi nội bộ server." }
```

---

### Endpoint 2: GET /api/admissions

**Mô tả:** Lấy toàn bộ danh sách hồ sơ đăng ký.

**Request:**
```
GET /api/admissions
```

**Response — Thành công (200):**
```json
{
  "total": 1,
  "data": [
    {
      "id": 1,
      "fullName": "Nguyen Van A",
      "email": "a@example.com",
      "course": "IT",
      "status": "Pending",
      "submittedAt": "2026-03-22T10:00:00.000Z"
    }
  ]
}
```

---

### Endpoint 3: GET /api/health

**Request:**
```
GET /api/health
```

**Response (200):**
```json
{ "status": "API is running smoothly" }
```

---

## 6. Đặc tả Database

### 6.1 Bảng: `admissions`

```sql
CREATE TABLE IF NOT EXISTS admissions (
  id           BIGINT       PRIMARY KEY AUTO_INCREMENT,
  full_name    VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL,
  course       VARCHAR(100) NOT NULL,
  status       VARCHAR(50)  NOT NULL DEFAULT 'Pending',
  submitted_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6.2 Mô tả các cột

| Cột | Kiểu | Constraint | Mô tả |
|-----|------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Khóa chính, tự tăng |
| `full_name` | VARCHAR(255) | NOT NULL | Họ và tên học viên |
| `email` | VARCHAR(255) | NOT NULL | Email (đã lowercase) |
| `course` | VARCHAR(100) | NOT NULL | Mã khóa học (IT/Biz/Design) |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'Pending' | Trạng thái hồ sơ |
| `submitted_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thời điểm đăng ký |

### 6.3 Giá trị hợp lệ cho `status`

| Giá trị | Ý nghĩa |
|---------|---------|
| `Pending` | Mới đăng ký, chờ xử lý (giá trị mặc định khi tạo) |

> Phiên bản 2.0 chỉ dùng `Pending`. Các trạng thái như `Approved`, `Rejected` sẽ bổ sung ở phiên bản sau.

### 6.4 Column mapping — DB to API

| Cột DB | Field JSON | Lý do đổi tên |
|--------|-----------|--------------|
| `full_name` | `fullName` | camelCase convention trong JavaScript |
| `submitted_at` | `submittedAt` | camelCase convention |

---

## 7. Đặc tả môi trường triển khai

### 7.1 Môi trường Dev

| Service | Chạy ở | Port | Config file |
|---------|--------|------|------------|
| MySQL | Docker container `lms-mysql-dev` | 3306 | `docker-compose.dev.yml` |
| Backend | Máy host (Node.js) | 5000 | `backend/.env.dev` |
| Frontend | Máy host (Vite HMR) | 5173 | `frontend/.env.dev` |

**DB_HOST** trong `.env.dev` phải là `127.0.0.1` (không phải `mysql`) vì backend không trong Docker network.

### 7.2 Môi trường Build

| Service | Chạy ở | Port host | Port container | Config file |
|---------|--------|-----------|---------------|------------|
| MySQL | Docker container `lms-mysql-build` | 3307 | 3306 | `docker-compose.build.yml` |
| Backend | Docker container `lms-backend-build` | 5001 | 5001 | `backend/.env.build` |
| Frontend | Docker container `lms-frontend-build` | 5174 | 5174 | `build args` |

**DB_HOST** trong `.env.build` phải là `mysql-build` (Docker service name).

### 7.3 Biến môi trường Backend

| Biến | Bắt buộc | Mô tả | Dev default | Build default |
|------|----------|-------|-------------|---------------|
| `PORT` | Không | Port server | `5000` | `5001` |
| `NODE_ENV` | Không | Chọn file .env | `dev` | `build` |
| `CLIENT_ORIGIN` | Không | CORS allowed origin | `http://localhost:5173` | `http://localhost:5174` |
| `DB_HOST` | Có | MySQL host | `127.0.0.1` | `mysql-build` |
| `DB_PORT` | Không | MySQL port | `3306` | `3306` |
| `DB_NAME` | Có | Database name | `lms_db_dev` | `lms_db_build` |
| `DB_USER` | Có | MySQL user | `root` | `root` |
| `DB_PASSWORD` | Có | MySQL password | `rootpassword` | `rootpassword` |

### 7.4 Biến môi trường Frontend

| Biến | Mô tả | Dev | Build |
|------|-------|-----|-------|
| `VITE_API_URL` | URL của Backend API | `http://localhost:5000` | `http://localhost:5001` |

> `VITE_*` là **build-time variable** — phải truyền qua `build args` trong Dockerfile, không phải `env_file` trong docker-compose.

---

## 8. Ràng buộc thiết kế

### 8.1 Thứ tự khởi tạo `dotenv`

`dotenv.config()` phải được gọi **đầu tiên** trong `app.js`, trước mọi `require()` của code ứng dụng. Vi phạm điều này dẫn đến `DB_HOST` fallback về giá trị hardcode `'mysql'`.

```javascript
// ✅ ĐÚNG
const dotenv = require('dotenv');
dotenv.config(...);           // Load env TRƯỚC
const admissionRoutes = require('./routes/admissionRoutes'); // db.js chạy SAU

// ❌ SAI
const admissionRoutes = require('./routes/admissionRoutes'); // db.js chạy TRƯỚC
dotenv.config(...);           // Quá muộn!
```

### 8.2 Prepared Statements bắt buộc

Tất cả câu lệnh SQL có tham số người dùng **phải** dùng `pool.execute(sql, values)` với placeholder `?`. Không được dùng string concatenation hay template literal để ghép giá trị vào SQL.

### 8.3 Port mapping Docker

Cú pháp Docker port mapping `HOST:CONTAINER` — cổng bên phải phải khớp chính xác với port service đang lắng nghe bên trong container. Sai port dẫn đến service không truy cập được dù container đang chạy.

### 8.4 Content Security Policy

Frontend phải khai báo CSP header cho phép `connect-src` đến backend port đang dùng. Khi đổi môi trường (port 5000 ↔ 5001), CSP phải cập nhật tương ứng hoặc dùng `localhost:*` cho môi trường dev/build.

---

## 9. Ma trận truy vết yêu cầu

| Requirement ID | Mô tả | File triển khai | Endpoint / Function |
|---------------|-------|----------------|---------------------|
| FR-01 | Tiếp nhận đăng ký | `admissionController.js`, `admissionService.js`, `admissionModel.js` | `POST /api/admissions` |
| FR-01.2 | Validation | `admissionService.js → validateAdmissionPayload()` | — |
| FR-01.3 | Chuẩn hóa data | `admissionService.js → submitAdmission()` | — |
| FR-01.4 | Lưu vào DB | `admissionModel.js → createAdmission()` | — |
| FR-02 | Lấy danh sách | `admissionController.js`, `admissionModel.js` | `GET /api/admissions` |
| FR-03 | Health check | `app.js` | `GET /api/health` |
| FR-04 | Tạo bảng DB | `config/db.js → initializeDatabase()` | — |
| FR-05 | Xử lý lỗi toàn cục | `app.js` error middleware | — |
| FR-06 | Form UI | `frontend/src/App.jsx` | — |
| FR-07 | Danh sách UI | `frontend/src/App.jsx` | — |
| NFR-02 | SQL Injection | `admissionModel.js` — `pool.execute()` | — |
| NFR-02 | XSS / CSP | `frontend/index.html` | — |
| NFR-03 | Service ordering | `docker-compose.build.yml` — healthcheck | — |
| NFR-04 | Multi-env config | `app.js` — `dotenv.config()` | — |
