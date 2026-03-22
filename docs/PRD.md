# PRD — Product Requirements Document
## LMS Core System — Admission Module

| Trường | Nội dung |
|--------|---------|
| **Sản phẩm** | LMS Core System — Module Tuyển Sinh |
| **Phiên bản** | 2.0 |
| **Trạng thái** | Released |
| **Ngày** | 2026-03-22 |
| **Tác giả** | Engineering Team |

---

## 1. Tổng quan sản phẩm (Overview)

### 1.1 Vấn đề cần giải quyết

Hiện tại, quy trình tiếp nhận đăng ký tuyển sinh của trường học/trung tâm đào tạo còn thủ công: học viên liên hệ qua điện thoại, email hoặc đến trực tiếp. Dữ liệu lưu rải rác trong file Excel, dễ mất mát, không thể truy xuất nhanh, không có trạng thái theo dõi.

### 1.2 Giải pháp

Cung cấp một **web application** cho phép:
- Học viên tự điền form đăng ký trực tuyến 24/7
- Dữ liệu được lưu trữ tập trung trong database có cấu trúc
- Admin/nhân viên tuyển sinh xem toàn bộ danh sách đăng ký realtime

### 1.3 Phạm vi phiên bản 2.0

Phiên bản này tập trung vào **module tuyển sinh cốt lõi**: tiếp nhận và lưu trữ đăng ký. Các module như thanh toán, quản lý lịch học, portal học viên sẽ thuộc các phiên bản sau.

---

## 2. Người dùng mục tiêu (Target Users)

### 2.1 Học viên tiềm năng (Prospective Students)

- **Đặc điểm:** 18–30 tuổi, có nhu cầu học thêm kỹ năng, quen dùng smartphone và web
- **Mục tiêu:** Đăng ký khóa học nhanh, không cần đến trực tiếp
- **Pain points:** Không biết đăng ký như thế nào, không nhận được phản hồi rõ ràng sau khi đăng ký

### 2.2 Nhân viên tuyển sinh / Admin

- **Đặc điểm:** Nhân viên nội bộ, cần xem và xử lý hồ sơ
- **Mục tiêu:** Tra cứu danh sách đăng ký nhanh, biết trạng thái từng hồ sơ
- **Pain points:** Dữ liệu phân tán, không có view tập trung

---

## 3. Mục tiêu sản phẩm (Product Goals)

| Mục tiêu | Chỉ số đo lường (Metric) | Kỳ vọng |
|----------|--------------------------|---------|
| Học viên tự đăng ký được online | Tỷ lệ hoàn thành form | > 80% |
| Giảm thời gian tiếp nhận hồ sơ | Thời gian từ click → lưu DB | < 2 giây |
| Không mất dữ liệu | Tỷ lệ lưu thành công | 99.9% |
| Validate dữ liệu đầu vào | Tỷ lệ dữ liệu thiếu/sai bị chặn | 100% |

---

## 4. Tính năng sản phẩm (Features)

### F-01: Form đăng ký tuyển sinh

**Mô tả:** Học viên điền form với thông tin cá nhân và chọn khóa học.

**Đầu vào bắt buộc:**
- Họ và tên đầy đủ
- Địa chỉ email hợp lệ
- Khóa học muốn đăng ký

**Khóa học hiện có:**
- Công nghệ thông tin (IT)
- Quản trị kinh doanh (Business)
- Thiết kế đồ họa (Design)

**Hành vi khi gửi:**
- Hiển thị trạng thái loading trong khi gửi
- Thông báo thành công kèm tên học viên
- Reset form về trạng thái ban đầu sau khi gửi thành công
- Thông báo lỗi rõ ràng nếu thất bại

---

### F-02: Xem danh sách đăng ký

**Mô tả:** Hiển thị tất cả hồ sơ đã đăng ký, sắp xếp theo thứ tự mới nhất trước.

**Thông tin hiển thị mỗi hồ sơ:**
- Họ tên
- Email
- Khóa học
- Trạng thái (mặc định: Pending)
- Thời gian đăng ký

**Hành vi:** Danh sách tự động cập nhật ngay sau khi có đăng ký mới thành công.

---

### F-03: Validate dữ liệu

**Mô tả:** Kiểm tra dữ liệu trước khi lưu vào database.

| Trường | Validation |
|--------|-----------|
| fullName | Bắt buộc, không được rỗng |
| email | Bắt buộc, đúng định dạng `x@y.z` |
| course | Bặt buộc, phải chọn từ danh sách |

Lỗi validation trả về HTTP 400 kèm thông báo cụ thể.

---

### F-04: API Health Check

**Mô tả:** Endpoint cho phép kiểm tra nhanh server đang hoạt động.

- `GET /api/health` → `200 OK { status: "API is running smoothly" }`
- Dùng cho monitoring, Docker healthcheck, CI/CD pipeline

---

## 5. Luồng người dùng (User Flows)

### Flow 1: Học viên đăng ký thành công

```
Mở trang web
    → Xem form đăng ký
    → Điền họ tên, email, chọn khóa học
    → Nhấn "Gửi Đăng Ký"
    → Thấy loading "Đang gửi..."
    → Thấy "✅ Đăng ký thành công!"
    → Form được reset
    → Danh sách đăng ký cập nhật, xuất hiện hồ sơ của mình
```

### Flow 2: Học viên điền thiếu thông tin

```
Mở trang web
    → Điền form nhưng bỏ trống email
    → Nhấn "Gửi Đăng Ký"
    → Thấy "❌ Vui lòng điền đầy đủ thông tin!"
    → Form không bị reset, dữ liệu đã điền vẫn còn
```

### Flow 3: Admin xem danh sách

```
Mở trang web
    → Danh sách đăng ký tự động hiển thị khi tải trang
    → Xem thông tin từng hồ sơ: tên, email, khóa học, trạng thái, thời gian
```

---

## 6. Yêu cầu phi chức năng (Non-Functional Requirements)

| Loại | Yêu cầu |
|------|---------|
| **Hiệu năng** | API response < 500ms trong điều kiện bình thường |
| **Bảo mật** | Dùng prepared statements, không nhận raw SQL |
| **Khả dụng** | Service phải healthy trước khi nhận request (healthcheck) |
| **Môi trường** | Hỗ trợ Dev local, Build Docker hoàn chỉnh |
| **Trình duyệt** | Chrome, Firefox, Edge latest versions |

---

## 7. Giới hạn phiên bản 2.0 (Out of Scope)

Các tính năng **không** có trong phiên bản này:
- Đăng nhập / xác thực người dùng
- Chỉnh sửa hoặc xóa hồ sơ đã đăng ký
- Phân quyền Admin vs Học viên
- Upload tài liệu/ảnh đính kèm
- Gửi email xác nhận sau khi đăng ký
- Tích hợp thanh toán
- Dashboard thống kê
- Tìm kiếm / lọc / phân trang danh sách

---

## 8. Phụ thuộc kỹ thuật (Technical Dependencies)

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend Runtime | Node.js | 18.x LTS |
| Web Framework | Express | 4.x |
| Database | MySQL | 8.0 |
| Frontend Framework | React | 18.x |
| Build Tool | Vite | 4.x |
| Container | Docker | 24.x |

---

## 9. Điều kiện hoàn thành (Definition of Done)

Một tính năng được coi là hoàn thành khi:
- [ ] API endpoint hoạt động đúng với các case thành công và thất bại
- [ ] Validation đầy đủ phía Backend
- [ ] Frontend hiển thị đúng trạng thái (loading, success, error)
- [ ] Chạy được trên cả môi trường Dev (local) và Build (Docker)
- [ ] Không có thông tin nhạy cảm (password, key) hardcode trong code
