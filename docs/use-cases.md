# Use Cases — LMS Core System Admission Module

| Trường | Nội dung |
|--------|---------|
| **Tài liệu** | Use Case Specification |
| **Phiên bản** | 2.0 |
| **Chuẩn tham chiếu** | UML Use Case / IEEE 830 |
| **Ngày** | 2026-03-22 |

---

## Sơ đồ Use Case tổng quan

```
                    ┌──────────────────────────────────────────┐
                    │         LMS Admission System              │
                    │                                          │
  ┌──────────┐      │   ┌─────────────────────────────┐       │
  │          │      │   │  UC-01: Đăng ký tuyển sinh   │       │
  │  Học     │─────►│   └─────────────────────────────┘       │
  │  Viên    │      │                                          │
  │          │      │   ┌─────────────────────────────┐       │
  └──────────┘      │   │  UC-02: Xem danh sách        │◄──────┼── Học Viên
                    │   │         đăng ký               │       │
  ┌──────────┐      │   └─────────────────────────────┘◄──────┼── Admin
  │          │─────►│                                          │
  │  Admin   │      │   ┌─────────────────────────────┐       │
  │          │      │   │  UC-03: Kiểm tra trạng thái  │       │
  └──────────┘      │   │         hệ thống              │       │
                    │   └─────────────────────────────┘       │
  ┌──────────┐      │                                          │
  │          │─────►│   ┌─────────────────────────────┐       │
  │ Hệ thống │      │   │  UC-04: Khởi tạo database    │       │
  │ (System) │      │   │         tự động               │       │
  └──────────┘      │   └─────────────────────────────┘       │
                    │                                          │
                    └──────────────────────────────────────────┘
```

---

## Danh sách Actors

| Actor | Loại | Mô tả |
|-------|------|-------|
| **Học Viên** | Primary | Người muốn đăng ký khóa học tại trung tâm |
| **Admin / Nhân viên tuyển sinh** | Primary | Nhân viên nội bộ xem và quản lý hồ sơ |
| **Hệ thống** | Secondary | Backend service tự thực hiện khi khởi động |
| **MySQL Database** | Secondary | Lưu trữ dữ liệu, đóng vai trò external system |

---

## UC-01: Đăng ký tuyển sinh

| Trường | Nội dung |
|--------|---------|
| **Use Case ID** | UC-01 |
| **Tên** | Đăng ký tuyển sinh |
| **Actor chính** | Học Viên |
| **Mức độ** | User Goal |
| **Ưu tiên** | Must Have |
| **Điều kiện tiên quyết** | Backend server đang chạy; MySQL đang healthy |

### Mô tả ngắn
Học viên điền form thông tin cá nhân và gửi đăng ký. Hệ thống validate, lưu vào database, và xác nhận thành công.

### Luồng chính (Main Flow)

| Bước | Actor | Hành động |
|------|-------|---------|
| 1 | Học Viên | Mở trang web LMS Admission |
| 2 | System | Hiển thị form đăng ký với 3 trường: Họ tên, Email, Khóa học |
| 3 | Học Viên | Điền họ và tên đầy đủ |
| 4 | Học Viên | Điền địa chỉ email |
| 5 | Học Viên | Chọn khóa học từ dropdown (IT / Quản trị KD / Thiết kế ĐH) |
| 6 | Học Viên | Nhấn nút "Gửi Đăng Ký" |
| 7 | System | Hiển thị nút chuyển sang trạng thái loading "Đang gửi..." và disabled |
| 8 | System | Gửi POST request tới `/api/admissions` với dữ liệu form |
| 9 | Backend | Validate dữ liệu: kiểm tra đầy đủ và đúng định dạng |
| 10 | Backend | Chuẩn hóa email (trim + lowercase), trim họ tên |
| 11 | Backend | Ghi vào bảng `admissions` với status = 'Pending' |
| 12 | Backend | Đọc lại record vừa tạo từ DB |
| 13 | Backend | Trả về HTTP 201 + JSON `{ message, data }` |
| 14 | System | Hiển thị thông báo "✅ Đăng ký thành công!" |
| 15 | System | Reset form về trống |
| 16 | System | Cập nhật danh sách đăng ký — hồ sơ vừa tạo xuất hiện đầu danh sách |

### Luồng thay thế (Alternative Flows)

#### AF-01: Thiếu thông tin bắt buộc

| Bước | Hành động |
|------|---------|
| 6a.1 | Học viên bỏ trống một/nhiều trường và nhấn gửi |
| 6a.2 | System gửi request tới Backend |
| 6a.3 | Backend trả về HTTP 400: `"Vui lòng điền đầy đủ thông tin!"` |
| 6a.4 | System hiển thị `"❌ Vui lòng điền đầy đủ thông tin!"` |
| 6a.5 | Form **không** bị reset — dữ liệu đã điền vẫn giữ nguyên |
| 6a.6 | Use case kết thúc (học viên có thể điền lại và gửi lại) |

#### AF-02: Email sai định dạng

| Bước | Hành động |
|------|---------|
| 6b.1 | Học viên điền email không hợp lệ (vd: `abc`, `abc@`) và nhấn gửi |
| 6b.2 | Backend trả về HTTP 400: `"Email không hợp lệ!"` |
| 6b.3 | System hiển thị `"❌ Email không hợp lệ!"` |
| 6b.4 | Form giữ nguyên dữ liệu |

#### AF-03: Mất kết nối tới Backend

| Bước | Hành động |
|------|---------|
| 8a.1 | Request fetch() bị lỗi network (Backend không chạy, timeout, ...) |
| 8a.2 | System hiển thị `"❌ Lỗi kết nối tới server."` |
| 8a.3 | Form giữ nguyên dữ liệu |

#### AF-04: Lỗi server nội bộ

| Bước | Hành động |
|------|---------|
| 11a.1 | Ghi vào DB thất bại (DB lỗi, connection pool hết, ...) |
| 11a.2 | Backend trả về HTTP 500: `"Đã xảy ra lỗi nội bộ server."` |
| 11a.3 | System hiển thị `"❌ Đã xảy ra lỗi nội bộ server."` |

### Điều kiện sau (Postconditions)

- **Thành công:** Bảng `admissions` có thêm một record mới với `status = 'Pending'`
- **Thất bại:** Không có thay đổi nào trong database

### Quy tắc nghiệp vụ

| BR-ID | Quy tắc |
|-------|---------|
| BR-01 | Ba trường fullName, email, course đều bắt buộc |
| BR-02 | Email phải khớp pattern: `x@y.z` (tối thiểu có `@` và dấu `.` sau `@`) |
| BR-03 | Status luôn là `Pending` khi tạo mới, không thể set giá trị khác qua API |
| BR-04 | Email được chuẩn hóa về lowercase trước khi lưu |

---

## UC-02: Xem danh sách đăng ký

| Trường | Nội dung |
|--------|---------|
| **Use Case ID** | UC-02 |
| **Tên** | Xem danh sách đăng ký |
| **Actor chính** | Học Viên, Admin |
| **Mức độ** | User Goal |
| **Ưu tiên** | Must Have |
| **Điều kiện tiên quyết** | Backend server đang chạy; MySQL đang healthy |

### Mô tả ngắn
Danh sách toàn bộ hồ sơ đăng ký hiển thị tự động khi trang web được mở, sắp xếp theo thứ tự mới nhất trước.

### Luồng chính (Main Flow)

| Bước | Actor | Hành động |
|------|-------|---------|
| 1 | Actor | Mở trang web LMS Admission |
| 2 | System | Component mount → `useEffect` kích hoạt `fetchAdmissions()` |
| 3 | System | Gửi GET request tới `/api/admissions` |
| 4 | Backend | Truy vấn `SELECT ... FROM admissions ORDER BY id DESC` |
| 5 | Backend | Trả về HTTP 200 + JSON `{ total, data: [...] }` |
| 6 | System | Render danh sách hồ sơ, mỗi hồ sơ hiển thị: Họ tên, Email, Khóa học, Trạng thái, Thời gian |

### Luồng thay thế

#### AF-01: Danh sách rỗng

| Bước | Hành động |
|------|---------|
| 5a.1 | Backend trả về `{ total: 0, data: [] }` |
| 5a.2 | System hiển thị phần danh sách trống (không có lỗi) |

#### AF-02: Lỗi kết nối

| Bước | Hành động |
|------|---------|
| 3a.1 | fetch() thất bại |
| 3a.2 | System hiển thị thông báo lỗi trong phần danh sách |

### Kịch bản mở rộng: Cập nhật sau khi gửi form

Sau khi UC-01 hoàn thành thành công, `fetchAdmissions()` được gọi lại — danh sách cập nhật tự động mà không cần reload trang.

---

## UC-03: Kiểm tra trạng thái hệ thống

| Trường | Nội dung |
|--------|---------|
| **Use Case ID** | UC-03 |
| **Tên** | Kiểm tra trạng thái hệ thống (Health Check) |
| **Actor chính** | Admin / DevOps Engineer / Monitoring System |
| **Mức độ** | Supporting |
| **Ưu tiên** | Must Have |
| **Điều kiện tiên quyết** | Backend server khởi động |

### Mô tả ngắn
Cho phép kiểm tra nhanh server đang hoạt động mà không truy vấn database. Dùng cho Docker healthcheck, monitoring, CI/CD pipeline.

### Luồng chính

| Bước | Actor | Hành động |
|------|-------|---------|
| 1 | Actor | Gửi `GET /api/health` |
| 2 | Backend | Xử lý ngay lập tức (không truy vấn DB) |
| 3 | Backend | Trả về `HTTP 200 { status: "API is running smoothly" }` |

### Ghi chú kỹ thuật

Endpoint này được dùng trong hai ngữ cảnh:
1. **Docker healthcheck** trong `clean_build.ps1` — chờ backend healthy trước khi thông báo "ready"
2. **Manual check** — developer chạy `Invoke-WebRequest http://localhost:5000/api/health`

---

## UC-04: Khởi tạo database tự động

| Trường | Nội dung |
|--------|---------|
| **Use Case ID** | UC-04 |
| **Tên** | Khởi tạo database tự động khi server start |
| **Actor chính** | Hệ thống (System) |
| **Mức độ** | System Goal |
| **Ưu tiên** | Must Have |
| **Điều kiện tiên quyết** | MySQL server đang chạy và có thể kết nối |

### Mô tả ngắn
Khi backend server khởi động, hệ thống tự động tạo bảng `admissions` nếu chưa tồn tại, đảm bảo server luôn khởi động được dù database mới hoàn toàn chưa có schema.

### Luồng chính

| Bước | Actor | Hành động |
|------|-------|---------|
| 1 | System | `server.js` gọi `bootstrap()` |
| 2 | System | `bootstrap()` gọi `initializeDatabase()` từ `config/db.js` |
| 3 | System | Lấy một connection từ pool |
| 4 | System | Thực thi `CREATE TABLE IF NOT EXISTS admissions (...)` |
| 5 | Database | Tạo bảng nếu chưa có; bỏ qua nếu đã có |
| 6 | System | Release connection về pool |
| 7 | System | Log ra `"Database initialized successfully."` |
| 8 | System | `app.listen(PORT)` — server bắt đầu nhận request |

### Luồng thất bại

| Bước | Hành động |
|------|---------|
| 4a.1 | Không thể kết nối MySQL (sai host, port, credentials, MySQL chưa khởi động) |
| 4a.2 | `initializeDatabase()` throw error |
| 4a.3 | `bootstrap()` catch lỗi → log `"Failed to start server: <message>"` |
| 4a.4 | `process.exit(1)` — server dừng hẳn |

### Tại sao quan trọng

Nếu không có bước này, server khởi động nhưng khi có request đầu tiên mới phát hiện schema không tồn tại → lỗi runtime không thể kiểm soát. Khởi tạo trước đảm bảo **fail-fast**: nếu DB có vấn đề, server báo lỗi ngay lúc start thay vì khi đang phục vụ user.

---

## Bảng tóm tắt Use Cases

| UC | Tên | Actor | Ưu tiên | Trạng thái |
|----|-----|-------|---------|-----------|
| UC-01 | Đăng ký tuyển sinh | Học Viên | Must Have | ✅ Implemented |
| UC-02 | Xem danh sách đăng ký | Học Viên, Admin | Must Have | ✅ Implemented |
| UC-03 | Kiểm tra trạng thái hệ thống | Admin/System | Must Have | ✅ Implemented |
| UC-04 | Khởi tạo database tự động | Hệ thống | Must Have | ✅ Implemented |

---

## Use Cases dự kiến — Phiên bản sau

| UC | Tên | Actor | Phiên bản |
|----|-----|-------|----------|
| UC-05 | Đăng nhập / Xác thực | Admin | v3.0 |
| UC-06 | Duyệt / Từ chối hồ sơ | Admin | v3.0 |
| UC-07 | Tìm kiếm và lọc hồ sơ | Admin | v3.0 |
| UC-08 | Gửi email xác nhận | Hệ thống | v3.0 |
| UC-09 | Xuất danh sách ra Excel/CSV | Admin | v3.0 |
| UC-10 | Phân trang danh sách | Học Viên/Admin | v3.0 |
