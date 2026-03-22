# Backend Guide — LMS Admission API

> Tài liệu dành cho beginner developer.  
> Giải thích **từng thư viện, từng file, từng lệnh** trong dự án backend.

---

## Mục lục

1. [Backend làm gì?](#1-backend-làm-gì)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Các thư viện sử dụng](#3-các-thư-viện-sử-dụng)
4. [Cách code được tổ chức — Layered Architecture](#4-cách-code-được-tổ-chức--layered-architecture)
5. [Đi sâu từng file](#5-đi-sâu-từng-file)
6. [API Endpoints](#6-api-endpoints)
7. [Biến môi trường (.env)](#7-biến-môi-trường-env)
8. [Các lệnh thường dùng](#8-các-lệnh-thường-dùng)
9. [Luồng xử lý một request](#9-luồng-xử-lý-một-request)

---

## 1. Backend làm gì?

Backend là một **REST API server** — nó nhận yêu cầu (request) từ Frontend hoặc Postman, xử lý logic nghiệp vụ, đọc/ghi vào cơ sở dữ liệu MySQL, rồi trả về kết quả (response) dưới dạng JSON.

Dự án này cụ thể làm 2 việc:

| Chức năng | Mô tả |
|-----------|-------|
| Nhận đăng ký tuyển sinh | Lưu thông tin học viên (họ tên, email, khóa học) vào MySQL |
| Lấy danh sách đăng ký | Trả về toàn bộ danh sách người đã đăng ký |

**Công nghệ sử dụng:** Node.js + Express + MySQL

---

## 2. Cấu trúc thư mục

```
backend/
├── .env.dev              ← Biến môi trường cho môi trường Dev (local)
├── .env.build            ← Biến môi trường cho môi trường Build (Docker)
├── package.json          ← Khai báo dự án và dependencies
├── Dockerfile            ← Hướng dẫn đóng gói thành Docker image
└── src/
    ├── server.js         ← Điểm khởi động (entry point) — chạy server
    ├── app.js            ← Cấu hình Express app (middleware, routes)
    ├── config/
    │   ├── db.js         ← Kết nối MySQL, khởi tạo bảng
    │   └── init.sql      ← SQL tham khảo (không dùng trực tiếp)
    ├── routes/
    │   └── admissionRoutes.js    ← Định nghĩa URL nào → Controller nào
    ├── controllers/
    │   └── admissionController.js ← Nhận request, gọi Service, trả response
    ├── services/
    │   └── admissionService.js   ← Logic nghiệp vụ, validate dữ liệu
    └── models/
        └── admissionModel.js     ← Câu lệnh SQL thực tế với database
```

---

## 3. Các thư viện sử dụng

### `express` — Web framework chính

```bash
npm install express
```

Express là thư viện phổ biến nhất để xây dựng web server/API với Node.js.  
Thay vì tự viết HTTP server phức tạp, Express cung cấp cú pháp gọn:

```javascript
// Không có Express (phức tạp)
const http = require('http');
http.createServer((req, res) => {
  if (req.url === '/api/health' && req.method === 'GET') { ... }
}).listen(5000);

// Có Express (đơn giản)
const app = express();
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});
app.listen(5000);
```

**Dùng ở đâu trong dự án:** `app.js`, `routes/admissionRoutes.js`

---

### `mysql2` — Kết nối MySQL database

```bash
npm install mysql2
```

Thư viện để Node.js "nói chuyện" được với MySQL. Phiên bản `mysql2` hỗ trợ:
- **Promise** (async/await) thay vì callback cũ
- **Prepared statements** — tự động escape input, chống SQL Injection
- **Connection Pool** — tái sử dụng kết nối, hiệu năng tốt hơn

```javascript
// Dùng pool thay vì tạo connection mới mỗi lần
const pool = mysql.createPool({ host, user, password, database });

// Câu query an toàn với prepared statement (dấu ? là placeholder)
const [rows] = await pool.execute('SELECT * FROM admissions WHERE id = ?', [id]);
```

**Dùng ở đâu trong dự án:** `config/db.js`, `models/admissionModel.js`

---

### `dotenv` — Đọc file biến môi trường

```bash
npm install dotenv
```

Cho phép lưu các thông tin nhạy cảm (password DB, port, ...) trong file `.env` thay vì hardcode trong code.

```javascript
// Không có dotenv
const DB_PASSWORD = 'rootpassword'; // ❌ Lộ password trong code!

// Có dotenv
dotenv.config(); // Đọc file .env
const DB_PASSWORD = process.env.DB_PASSWORD; // ✅ Đọc từ biến môi trường
```

**Quy tắc quan trọng:** `dotenv.config()` phải được gọi **trước** tất cả các `require()` khác dùng `process.env`. Hiện tại dự án gọi nó ở đầu `app.js`.

**Dùng ở đâu trong dự án:** `app.js` (load đầu tiên)

---

### `cors` — Cho phép Frontend gọi API

```bash
npm install cors
```

Trình duyệt có cơ chế bảo vệ gọi là **Same-Origin Policy** — mặc định nó chặn Frontend ở `localhost:5173` gọi API ở `localhost:5000` vì khác port. CORS (Cross-Origin Resource Sharing) cho phép ta cấu hình ngoại lệ này.

```javascript
app.use(cors({
  origin: 'http://localhost:5173', // Chỉ cho phép Frontend từ port này
  credentials: false
}));
```

**Dùng ở đâu trong dự án:** `app.js`

---

## 4. Cách code được tổ chức — Layered Architecture

Dự án dùng kiến trúc **phân tầng (layered)** — mỗi tầng chỉ làm một việc:

```
HTTP Request
     │
     ▼
┌──────────────┐
│   Routes     │  "URL /api/admissions → gọi controller nào?"
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Controller  │  "Nhận req, trả res. KHÔNG xử lý logic."
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Service    │  "Logic nghiệp vụ: validate, tính toán, xử lý."
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Model     │  "Nói chuyện với database: INSERT, SELECT, ..."
└──────┬───────┘
       │
       ▼
   MySQL DB
```

**Tại sao tách tầng?**
- Dễ tìm bug: lỗi validate → xem Service; lỗi SQL → xem Model
- Dễ thay đổi: muốn đổi từ MySQL sang PostgreSQL chỉ sửa Model
- Dễ test từng phần độc lập

---

## 5. Đi sâu từng file

### `src/server.js` — Entry point

```javascript
const app = require('./app');
const { initializeDatabase } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await initializeDatabase(); // 1. Tạo bảng DB nếu chưa có
    app.listen(PORT, () => {    // 2. Bắt đầu lắng nghe request
      console.log(`Backend Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1); // Dừng hẳn nếu không kết nối được DB
  }
}

bootstrap();
```

**Vai trò:** File duy nhất bạn `node` để chạy server. Thứ tự: kết nối DB trước, rồi mới bật server.

---

### `src/app.js` — Cấu hình Express

```javascript
// ⚠️ dotenv PHẢI ở đây, trước mọi require() khác
const dotenv = require('dotenv');
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'dev'}` });

const express = require('express');
const cors = require('cors');
const admissionRoutes = require('./routes/admissionRoutes');

const app = express();

// Middleware: chạy trước MỌI request
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json()); // Đọc body JSON từ request

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));
app.use('/api/admissions', admissionRoutes);

// Xử lý lỗi 404 và lỗi chung
app.use((req, res) => res.status(404).json({ message: 'Không tìm thấy.' }));
app.use((err, req, res, next) => res.status(500).json({ message: 'Lỗi server.' }));

module.exports = app;
```

**Vai trò:** Cấu hình toàn bộ Express app. `server.js` import app này và gọi `.listen()`.

---

### `src/config/db.js` — Kết nối MySQL

```javascript
const mysql = require('mysql2/promise');

// Pool = "bể kết nối" — tạo sẵn nhiều connection, tái sử dụng
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',   // Tên host MySQL
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'lms_user',
  password: process.env.DB_PASSWORD || 'lms_password',
  database: process.env.DB_NAME || 'lms_db',
  connectionLimit: 10, // Tối đa 10 connection cùng lúc
});

async function initializeDatabase() {
  // Tự động tạo bảng khi server khởi động
  const sql = `CREATE TABLE IF NOT EXISTS admissions ( ... )`;
  const connection = await pool.getConnection();
  try {
    await connection.query(sql);
  } finally {
    connection.release(); // Trả connection về pool sau khi dùng xong
  }
}
```

**Điểm quan trọng:**
- `pool.execute()` dùng **prepared statements** — tự escape input, chống SQL Injection
- `connection.release()` trong `finally` đảm bảo connection luôn được trả về pool dù có lỗi hay không

---

### `src/routes/admissionRoutes.js` — Định tuyến URL

```javascript
const express = require('express');
const admissionController = require('../controllers/admissionController');

const router = express.Router();

router.post('/', admissionController.createAdmission);  // POST /api/admissions
router.get('/',  admissionController.getAdmissions);    // GET  /api/admissions

module.exports = router;
```

**Vai trò:** Chỉ map URL + HTTP method → Controller function. Không có logic ở đây.

---

### `src/controllers/admissionController.js` — Xử lý request/response

```javascript
async function createAdmission(req, res, next) {
  try {
    const admission = await admissionService.submitAdmission(req.body); // Gọi Service
    return res.status(201).json({                                        // Trả về JSON
      message: 'Đăng ký thành công!',
      data: admission
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error); // Lỗi không xác định → chuyển cho error handler
  }
}
```

**Vai trò:** Nhận `req` (request), gọi Service, trả `res` (response). Không tự xử lý logic.

---

### `src/services/admissionService.js` — Logic nghiệp vụ

```javascript
function validateAdmissionPayload({ fullName, email, course }) {
  if (!fullName || !email || !course) {
    const error = new Error('Vui lòng điền đầy đủ thông tin!');
    error.statusCode = 400;
    throw error; // Controller sẽ bắt lỗi này và trả 400
  }
  // Kiểm tra định dạng email bằng regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw Object.assign(new Error('Email không hợp lệ!'), { statusCode: 400 });
  }
}

async function submitAdmission(payload) {
  validateAdmissionPayload(payload);                     // 1. Validate trước
  return admissionModel.createAdmission({                // 2. Gọi Model lưu DB
    fullName: payload.fullName.trim(),
    email: payload.email.trim().toLowerCase(),           // Chuẩn hóa email
    course: payload.course
  });
}
```

**Vai trò:** Nơi chứa **business rules** — validate, chuẩn hóa dữ liệu, xử lý logic.

---

### `src/models/admissionModel.js` — Truy vấn database

```javascript
async function createAdmission({ fullName, email, course }) {
  const sql = `INSERT INTO admissions (full_name, email, course, status) VALUES (?, ?, ?, ?)`;
  const values = [fullName, email, course, 'Pending'];

  const [result] = await pool.execute(sql, values); // Dấu ? được thay bằng values an toàn

  return findAdmissionById(result.insertId); // Trả về record vừa tạo
}

async function getAllAdmissions() {
  const [rows] = await pool.execute(`
    SELECT id, full_name AS fullName, email, course, status, submitted_at AS submittedAt
    FROM admissions ORDER BY id DESC
  `);
  return rows;
}
```

**Điểm quan trọng:** Dùng `AS` trong SQL để đổi tên cột từ `full_name` → `fullName` (camelCase cho JavaScript).

---

## 6. API Endpoints

| Method | URL | Mô tả | Body (JSON) |
|--------|-----|-------|-------------|
| `GET` | `/api/health` | Kiểm tra server có chạy không | — |
| `POST` | `/api/admissions` | Tạo đăng ký mới | `{ fullName, email, course }` |
| `GET` | `/api/admissions` | Lấy danh sách toàn bộ đăng ký | — |

### Ví dụ test bằng curl

```bash
# Kiểm tra health
curl http://localhost:5000/api/health

# Tạo đăng ký mới
curl -X POST http://localhost:5000/api/admissions \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Nguyen Van A", "email": "a@example.com", "course": "IT"}'

# Lấy danh sách
curl http://localhost:5000/api/admissions
```

---

## 7. Biến môi trường (.env)

Backend tự động chọn file `.env` theo `NODE_ENV`:

```
NODE_ENV=dev   → đọc backend/.env.dev
NODE_ENV=build → đọc backend/.env.build
(không set)    → mặc định đọc backend/.env.dev
```

### backend/.env.dev (chạy local)

```dotenv
PORT=5000
NODE_ENV=dev
CLIENT_ORIGIN=http://localhost:5173

DB_HOST=127.0.0.1      ← Khi backend chạy trên máy host, dùng IP thật
DB_PORT=3306
DB_NAME=lms_db_dev
DB_USER=root
DB_PASSWORD=rootpassword
```

### backend/.env.build (chạy trong Docker)

```dotenv
PORT=5001
NODE_ENV=build
CLIENT_ORIGIN=http://localhost:5174

DB_HOST=mysql-build    ← Tên Docker service — chỉ hoạt động trong Docker network
DB_PORT=3306
DB_NAME=lms_db_build
DB_USER=root
DB_PASSWORD=rootpassword
```

---

## 8. Các lệnh thường dùng

### Cài dependencies lần đầu

```powershell
cd backend
npm install
```

`npm install` đọc `package.json` và tải tất cả thư viện vào thư mục `node_modules/`.

### Chạy server

```powershell
# Từ thư mục backend/
node src/server.js

# Hoặc dùng npm script
npm start
npm run dev
```

`node src/server.js` = "Chạy file `server.js` bằng Node.js". Server sẽ lắng nghe đến khi bạn nhấn Ctrl+C.

### Kiểm tra nhanh

```powershell
# Từ PowerShell — kiểm tra API health
Invoke-WebRequest http://localhost:5000/api/health

# Hoặc mở trình duyệt tại
# http://localhost:5000/api/health
# http://localhost:5000/api/admissions
```

### Xem dependencies đã cài

```powershell
npm list --depth=0
```

### Thêm thư viện mới

```powershell
npm install ten-thu-vien          # Dependency thường (cần khi chạy)
npm install ten-thu-vien --save-dev  # DevDependency (chỉ cần khi dev)
```

---

## 9. Luồng xử lý một request

Ví dụ: Frontend gửi `POST /api/admissions` với body `{ fullName, email, course }`:

```
1. [Express] Nhận request, chạy middleware cors và express.json()
2. [Routes]  admissionRoutes.js → router.post('/') → gọi createAdmission controller
3. [Controller] admissionController.js
   - Lấy req.body
   - Gọi admissionService.submitAdmission(req.body)
4. [Service] admissionService.js
   - validateAdmissionPayload() → kiểm tra fullName, email, course có hợp lệ không
   - Nếu không hợp lệ → throw Error với statusCode 400
   - Nếu hợp lệ → chuẩn hóa dữ liệu → gọi admissionModel.createAdmission()
5. [Model] admissionModel.js
   - pool.execute(INSERT SQL, [values]) → lưu vào MySQL
   - pool.execute(SELECT SQL, [id]) → đọc lại record vừa tạo
   - Trả về object admission
6. [Controller] Nhận kết quả từ Service → res.status(201).json({ message, data })
7. [Express] Gửi response JSON về cho client
```
