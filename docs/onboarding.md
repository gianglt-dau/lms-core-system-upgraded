# Onboarding Guide — LMS Core System Upgraded

> Tài liệu dành cho new developer bắt đầu làm việc với dự án.  
> Đọc toàn bộ tài liệu này trước khi chạy bất kỳ lệnh nào.

---

## Mục lục

1. [Yêu cầu cài đặt](#1-yêu-cầu-cài-đặt)  
2. [Cấu trúc dự án](#2-cấu-trúc-dự-án)  
3. [Hai môi trường làm việc](#3-hai-môi-trường-làm-việc)  
4. [Thiết lập môi trường Dev (khuyến nghị)](#4-thiết-lập-môi-trường-dev-khuyến-nghị)  
5. [Thiết lập môi trường Build](#5-thiết-lập-môi-trường-build)  
6. [Cấu trúc file môi trường (.env)](#6-cấu-trúc-file-môi-trường-env)  
7. [NPM Scripts tham khảo](#7-npm-scripts-tham-khảo)  
8. [Kiểm tra hệ thống](#8-kiểm-tra-hệ-thống)

---

## 1. Yêu cầu cài đặt

Đảm bảo các công cụ sau đã được cài trên máy trước khi bắt đầu:

| Công cụ | Phiên bản tối thiểu | Kiểm tra |
|---------|---------------------|----------|
| [Node.js](https://nodejs.org) | 18.x LTS | `node -v` |
| [npm](https://www.npmjs.com/) | 9.x | `npm -v` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 24.x | `docker -v` |
| PowerShell | 7.x (pwsh) | `pwsh -v` |

> **Windows:** Chạy PowerShell với quyền Admin khi sử dụng Docker lần đầu.

---

## 2. Cấu trúc dự án

```
lms-core-system-upgraded/
├── backend/                        # Node.js + Express API
│   ├── .env.dev                    # Biến môi trường cho Dev (local)
│   ├── .env.build                  # Biến môi trường cho Build (Docker)
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js                  # Express app (dotenv phải load ĐẦU TIÊN ở đây)
│       ├── server.js               # Entry point — khởi động server
│       ├── config/
│       │   ├── db.js               # Kết nối MySQL pool
│       │   └── init.sql
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       └── services/
│
├── frontend/                       # React + Vite
│   ├── .env.dev                    # Biến môi trường cho Dev
│   ├── .env.build                  # Biến môi trường cho Build
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       └── main.jsx
│
├── docker-compose.yml              # Cấu hình gốc (tham khảo, không chạy trực tiếp)
├── docker-compose.dev.yml          # Môi trường Dev — chỉ MySQL trong Docker
├── docker-compose.build.yml        # Môi trường Build — toàn bộ stack trong Docker
├── clean_dev.ps1                   # Script khởi động môi trường Dev
├── clean_build.ps1                 # Script khởi động môi trường Build
└── package.json                    # NPM scripts tiện lợi ở root
```

---

## 3. Hai môi trường làm việc

Dự án có **hai môi trường riêng biệt** với mục đích khác nhau:

### Môi trường Dev

Dùng khi **đang phát triển, debug, thay đổi code** hàng ngày.

| Service | Chạy ở đâu | Port |
|---------|------------|------|
| MySQL | Docker container | `3306` |
| Backend | Máy local (Node.js) | `5000` |
| Frontend | Máy local (Vite) | `5173` |

**Ưu điểm:** Hot-reload tức thì, debug dễ, không cần build Docker mỗi lần thay đổi code.

---

### Môi trường Build

Dùng để **kiểm tra toàn bộ stack trong Docker** trước khi deploy, hoặc demo.

| Service | Chạy ở đâu | Port host → container |
|---------|------------|----------------------|
| MySQL | Docker container | `3307 → 3306` |
| Backend | Docker container | `5001 → 5001` |
| Frontend | Docker container | `5174 → 5174` |

**Lưu ý port khác với Dev** để tránh xung đột khi chạy song song.

---

## 4. Thiết lập môi trường Dev (khuyến nghị)

### Bước 1 — Cài dependencies

```powershell
# Terminal 1 (root)
cd backend
npm install

cd ../frontend
npm install
```

### Bước 2 — Kiểm tra file .env.dev của Backend

Mở file `backend/.env.dev` và xác nhận nội dung:

```dotenv
# backend/.env.dev
PORT=5000
NODE_ENV=dev
CLIENT_ORIGIN=http://localhost:5173

# QUAN TRỌNG: Dùng 127.0.0.1, KHÔNG dùng 'mysql'
# 'mysql' chỉ hoạt động TRONG Docker network
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=lms_db_dev
DB_USER=root
DB_PASSWORD=rootpassword
```

> **Nếu file chưa tồn tại:** Tạo mới với nội dung trên.  
> Xem [Mục 6](#6-cấu-trúc-file-môi-trường-env) để hiểu tại sao `DB_HOST` phải là `127.0.0.1`.

### Bước 3 — Khởi động MySQL trong Docker

Mở PowerShell ở thư mục gốc:

```powershell
.\clean_dev.ps1
```

Script sẽ:
- Dừng và xóa container MySQL cũ (tránh conflict data)
- Khởi động container `lms-mysql-dev` mới
- Chờ đến khi MySQL thực sự sẵn sàng (healthcheck)
- In ra `MySQL is up and healthy!` khi xong

> **Đừng tiếp tục** cho đến khi thấy thông báo `MySQL is up and healthy!`.

### Bước 4 — Khởi động Backend

Mở **terminal mới**:

```powershell
cd backend
node src/server.js
```

Kết quả thành công:
```
Database initialized successfully.
Backend Server is running on port 5000
```

### Bước 5 — Khởi động Frontend

Mở **terminal mới**:

```powershell
cd frontend
npm run dev
```

Kết quả thành công:
```
  VITE v4.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### Bước 6 — Kiểm tra

Truy cập:
- **Frontend:** http://localhost:5173
- **Backend health:** http://localhost:5000/api/health

---

## 5. Thiết lập môi trường Build

### Bước 1 — Kiểm tra file .env.build của Backend

Mở `backend/.env.build`:

```dotenv
# backend/.env.build
PORT=5001
NODE_ENV=build
CLIENT_ORIGIN=http://localhost:5174

# Trong Docker, backend giao tiếp với MySQL qua tên service
DB_HOST=mysql-build
DB_PORT=3306
DB_NAME=lms_db_build
DB_USER=root
DB_PASSWORD=rootpassword
```

> Ở đây `DB_HOST=mysql-build` là đúng vì Backend cũng chạy **trong cùng Docker network**.

### Bước 2 — Chạy toàn bộ stack

```powershell
.\clean_build.ps1
```

Script sẽ:
- Dừng và xóa toàn bộ container build cũ
- Build image và khởi động MySQL, Backend, Frontend
- Chờ từng service healthy theo thứ tự
- In ra URL truy cập khi hoàn tất

### Bước 3 — Kiểm tra

Truy cập:
- **Frontend:** http://localhost:5174
- **Backend health:** http://localhost:5001/api/health

---

## 6. Cấu trúc file môi trường (.env)

### Tại sao cần các file .env khác nhau?

`app.js` tự động load file `.env` theo `NODE_ENV`:

```javascript
// backend/src/app.js — phần đầu file
const nodeEnv = process.env.NODE_ENV || 'dev';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
dotenv.config(); // fallback: .env
```

| `NODE_ENV` | File được load | Dùng khi |
|-----------|---------------|----------|
| `dev` (mặc định) | `backend/.env.dev` | Chạy local `node src/server.js` |
| `build` | `backend/.env.build` | Chạy trong Docker Build |

### Quy tắc quan trọng về DB_HOST

```
┌────────────────────────────────────────────────────────────┐
│                  Docker Network                             │
│                                                            │
│  [mysql-build] ←──── DB_HOST=mysql-build ────→ [backend]  │
│                       (tên service Docker)                 │
│                                                            │
└───────────────────┬────────────────────────────────────────┘
                    │ Port mapping 3306:3306 hoặc 3307:3306
                    ▼
┌────────────────────────────────────────────────────────────┐
│                Máy host (Windows / Mac)                    │
│                                                            │
│  node src/server.js ─── DB_HOST=127.0.0.1 ───→ MySQL Port │
│                       (phải dùng localhost)                │
└────────────────────────────────────────────────────────────┘
```

**Quy tắc:** Tên Docker service (`mysql`, `mysql-build`) **chỉ hoạt động bên trong Docker network**. Khi backend chạy trực tiếp trên máy host, luôn dùng `127.0.0.1`.

### Quy tắc quan trọng về VITE_* (Frontend)

Vite **bake cứng** (bundle) các biến `VITE_*` vào file JavaScript **lúc build**, không phải lúc chạy. Điều này nghĩa là:

- ✅ `VITE_API_URL` trong `.env.dev` → hoạt động với `npm run dev` (Vite đọc lúc khởi động)
- ✅ Truyền qua `build args` trong Docker → hoạt động khi `npm run build` trong container
- ❌ Truyền qua `env_file` trong docker-compose → **KHÔNG hoạt động** vì image đã được build xong rồi

---

## 7. NPM Scripts tham khảo

### Root `package.json`

```bash
npm run dev:db      # Khởi động MySQL Dev trong Docker (không chờ healthy)
npm run dev:be      # Chạy Backend local với .env.dev
npm run dev:fe      # Chạy Frontend local
npm run build:up    # Build và khởi động toàn bộ môi trường Build trong Docker
npm run build:down  # Tắt môi trường Build
```

### `backend/package.json`

```bash
cd backend
npm start       # Chạy server (= node src/server.js)
npm run dev     # Tương tự npm start
```

### `frontend/package.json`

```bash
cd frontend
npm run dev             # Vite dev server — port 5173, hot-reload
npm run build           # Build production bundle ra dist/
npm run preview         # Preview bundle đã build — port 5173
npm run preview:build   # Preview cho môi trường Build — port 5174
```

---

## 8. Kiểm tra hệ thống

### Kiểm tra nhanh môi trường Dev

```powershell
# Kiểm tra MySQL container
docker ps --filter "name=lms-mysql-dev"

# Kiểm tra Backend
Invoke-WebRequest http://localhost:5000/api/health

# Kiểm tra Frontend
Invoke-WebRequest http://localhost:5173
```

### Kiểm tra môi trường Build

```powershell
# Xem trạng thái các container
docker compose -f docker-compose.build.yml ps

# Kiểm tra Backend
Invoke-WebRequest http://localhost:5001/api/health

# Kiểm tra Frontend
Invoke-WebRequest http://localhost:5174
```

### Checklist trước khi bắt đầu

**Môi trường Dev:**
- [ ] Docker Desktop đang chạy
- [ ] `.\clean_dev.ps1` đã in ra `MySQL is up and healthy!`
- [ ] `backend/.env.dev` có `DB_HOST=127.0.0.1`
- [ ] Backend đang chạy (`Database initialized successfully.`)
- [ ] Frontend đang chạy (Vite ready)

**Môi trường Build:**
- [ ] Docker Desktop đang chạy
- [ ] `.\clean_build.ps1` đã in ra `BUILD environment is ready!`
- [ ] http://localhost:5174 mở được
- [ ] http://localhost:5001/api/health trả về `200 OK`
