# Tài liệu Ghi Chú Thực Hành — LMS Core System Upgraded

> Dành cho sinh viên thực hành DevOps / Fullstack với Node.js, React, MySQL và Docker.

---

## 1. Tổng quan kiến trúc

```
lms-core-system-upgraded/
├── backend/          # Node.js + Express
├── frontend/         # React + Vite
├── docker-compose.yml          # Cấu hình gốc (không dùng trực tiếp)
├── docker-compose.dev.yml      # Môi trường Dev (chỉ MySQL trong Docker)
├── docker-compose.build.yml    # Môi trường Build (tất cả trong Docker)
├── clean_dev.ps1     # Script khởi động môi trường Dev
├── clean_build.ps1   # Script khởi động môi trường Build
└── package.json      # NPM scripts tiện lợi
```

---

## 2. Hai môi trường làm việc

### 2.1 Môi trường Dev (local)

| Service | Chạy trên | Port |
|---------|-----------|------|
| Frontend | Máy local | 5173 |
| Backend | Máy local | 5000 |
| MySQL | Docker container | 3306 |

**Cách khởi động:**
```powershell
# Bước 1: Khởi động MySQL trong Docker (dọn sạch + khởi động mới)
powershell -File ".\clean_dev.ps1"

# Bước 2: Chạy Backend (terminal riêng)
cd backend
node src/server.js

# Bước 3: Chạy Frontend (terminal riêng)
cd frontend
npm run dev
```

**File cấu hình:** `backend/.env.dev`
```
DB_HOST=127.0.0.1   ← PHẢI dùng 127.0.0.1, KHÔNG dùng 'mysql' khi chạy local
PORT=5000
```

### 2.2 Môi trường Build (Docker hoàn chỉnh)

| Service | Chạy trên | Port (host:container) |
|---------|-----------|----------------------|
| Frontend | Docker | 5174:5174 |
| Backend | Docker | 5001:5001 |
| MySQL | Docker | 3307:3306 |

**Cách khởi động:**
```powershell
powershell -File ".\clean_build.ps1"
```

**Truy cập:**
- Frontend: http://localhost:5174
- Backend API: http://localhost:5001/api/admissions

---

## 3. Các lỗi phổ biến và cách xử lý

### 3.1 `getaddrinfo ENOTFOUND mysql`
**Nguyên nhân:** Backend chạy trên máy host nhưng `DB_HOST=mysql` (chỉ hoạt động trong Docker network).

**Cách fix:** Sửa `DB_HOST=127.0.0.1` trong `.env.dev`.

> **Nguyên tắc:** Tên service trong docker-compose (`mysql`, `mysql-build`) chỉ có hiệu lực khi service đó **trong cùng Docker network**. Khi chạy trên máy host thì phải dùng `127.0.0.1`.

---

### 3.2 `Access denied for user 'lms_user'@'%' to database`
**Nguyên nhân:** User `lms_user` không có quyền tạo bảng vào database.

**Cách fix:** Dùng tài khoản `root` trong `.env.dev` khi phát triển local:
```
DB_USER=root
DB_PASSWORD=rootpassword
```

> **Lưu ý:** Trong môi trường Build/Production không nên dùng root, hãy cấp đúng quyền cho user riêng.

---

### 3.3 `connect ECONNREFUSED 127.0.0.1:3306`
**Nguyên nhân:** MySQL container chưa khởi động xong nhưng Backend đã cố kết nối.

**Cách fix:** Thêm `healthcheck` vào MySQL trong docker-compose và dùng `depends_on: condition: service_healthy` cho Backend:
```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-prootpassword"]
  interval: 5s
  retries: 20
```
```yaml
depends_on:
  mysql-build:
    condition: service_healthy
```

> **Nguyên tắc:** Container "started" ≠ service "ready". Luôn dùng healthcheck khi một service phụ thuộc vào service khác.

---

### 3.4 `VITE_API_URL` sai khi build Docker

**Nguyên nhân:** Vite **bake cứng** (bundle) các biến `VITE_*` vào file JS lúc **build time**, không phải runtime. Nếu chỉ truyền qua `env_file` trong docker-compose, Frontend đã build xong với giá trị mặc định rồi.

**Cách fix:** Truyền qua `build args` trong docker-compose:
```yaml
frontend-build:
  build:
    context: ./frontend
    args:
      VITE_API_URL: http://localhost:5001
```

Và nhận trong Dockerfile:
```dockerfile
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build   # Vite sẽ nhúng VITE_API_URL vào bundle
```

> **Nguyên tắc:** Biến `VITE_*` chỉ hoạt động lúc build. Biến `process.env.*` thông thường mới là runtime.

---

### 3.5 Port mapping nhầm lẫn (`5174:5173`)

**Nguyên nhân:** Script `preview:build` chạy trên port **5174** bên trong container, nhưng docker-compose map `5174:5173` → sai port nội bộ.

**Cách fix:** Phải map đúng: `5174:5174`, và script phải khớp:
```json
"preview:build": "vite preview --host 0.0.0.0 --port 5174"
```

> **Nguyên tắc:** Cú pháp `HOST_PORT:CONTAINER_PORT`. Cổng bên phải là cổng **bên trong container** — phải khớp với cổng service thực sự đang lắng nghe.

---

### 3.6 Lỗi Content Security Policy (CSP)

**Nguyên nhân:** Thẻ meta CSP trong `index.html` không cho phép kết nối tới các port mới.

```
Violated: connect-src 'self' http://localhost:5000
```

**Cách fix:** Mở rộng `connect-src` cho phép tất cả port localhost:
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           connect-src 'self' http://localhost:* ws://localhost:*;
           ..." />
```

> **Lưu ý bảo mật:** Cú pháp `localhost:*` chỉ phù hợp cho môi trường development/build nội bộ. Trong production cần chỉ định rõ domain và port.

---

### 3.7 Lỗi `sw.js` và `mobx-state-tree` trong Console

**Đặc điểm:** Stack trace có `sw.js:1`, `jamToggleDumpStore`, `injectionLifecycle`...

**Nguyên nhân:** Đây là lỗi từ **Chrome Extension bên thứ ba** (Jam.dev hoặc tương tự), **KHÔNG** liên quan đến mã nguồn của dự án.

**Cách xử lý:** Bỏ qua, hoặc tắt extension này trong Chrome để console sạch hơn.

---

## 4. Kiến trúc tên host trong Docker

```
┌─────────────────────────────────┐
│        Docker Network           │
│                                 │
│  mysql-build ←→ backend-build   │
│  (tên service = hostname)       │
│                                 │
└──────────┬──────────────────────┘
           │ Port mapping
           ▼
┌─────────────────────────────────┐
│    Máy host (Windows)           │
│  127.0.0.1:3307 (MySQL)         │
│  127.0.0.1:5001 (Backend)       │
│  127.0.0.1:5174 (Frontend)      │
└─────────────────────────────────┘
```

- **Bên trong Docker:** service giao tiếp qua tên service (`mysql-build`, `backend-build`)
- **Từ máy host:** truy cập qua `localhost` + port đã map

---

## 5. Checklist trước khi chạy

### Môi trường Dev
- [ ] Docker Desktop đang chạy
- [ ] Chạy `powershell -File .\clean_dev.ps1` (chờ "MySQL is healthy")
- [ ] File `backend/.env.dev` có `DB_HOST=127.0.0.1` và `DB_USER=root`
- [ ] Mở terminal riêng cho Backend: `cd backend && node src/server.js`
- [ ] Mở terminal riêng cho Frontend: `cd frontend && npm run dev`
- [ ] Truy cập http://localhost:5173

### Môi trường Build
- [ ] Docker Desktop đang chạy
- [ ] Chạy `powershell -File .\clean_build.ps1`
- [ ] Chờ script báo "BUILD environment is ready!"
- [ ] Truy cập http://localhost:5174

---

## 6. NPM Scripts tham khảo

```bash
# Root package.json
npm run dev:db      # Khởi động MySQL dev trong Docker
npm run dev:be      # Chạy Backend local
npm run dev:fe      # Chạy Frontend local
npm run build:up    # Khởi động toàn bộ môi trường Build trong Docker
npm run build:down  # Tắt môi trường Build

# frontend/package.json
npm run dev             # Vite dev server (port 5173)
npm run build           # Build production bundle
npm run preview         # Preview build (port 5173)
npm run preview:build   # Preview build cho môi trường Build (port 5174)
```

---

## 7. Tóm tắt bài học rút ra

| Tình huống | Bài học |
|---|---|
| `mysql` không resolve | Tên service Docker chỉ hoạt động trong cùng network |
| `VITE_*` sai URL | Vite build-time bundling — phải truyền qua `ARG` |
| Container start nhưng service chưa ready | Luôn dùng healthcheck + `condition: service_healthy` |
| Port mapping sai | Cổng phải khớp: `HOST:CONTAINER` = port thực container đang nghe |
| CSP block API | Cần khai báo đầy đủ `connect-src` trong index.html |
| Lỗi lạ trong console | Kiểm tra xem lỗi từ extension hay từ app trước khi debug |
