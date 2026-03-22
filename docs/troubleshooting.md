# Troubleshooting Guide — LMS Core System Upgraded

> Tài liệu kỹ thuật ghi lại các lỗi đã xảy ra trong quá trình phát triển,  
> nguyên nhân gốc rễ, và cách khắc phục chính xác.

---

## Mục lục

1. [`getaddrinfo ENOTFOUND mysql` — Backend không kết nối được MySQL](#1-getaddrinfo-enotfound-mysql)
2. [`dotenv` load sau khi module đã được require](#2-dotenv-load-sau-khi-module-đã-được-require)
3. [`connect ECONNREFUSED 127.0.0.1:3306` — MySQL chưa sẵn sàng](#3-connect-econnrefused-127001-3306)
4. [`Access denied for user 'lms_user'` — Thiếu quyền database](#4-access-denied-for-user-lms_user)
5. [Biến `VITE_*` không có tác dụng trong Docker](#5-biến-vite_-không-có-tác-dụng-trong-docker)
6. [Port mapping sai — Frontend không truy cập được](#6-port-mapping-sai)
7. [Content Security Policy (CSP) chặn request API](#7-content-security-policy-csp-chặn-request-api)
8. [Lỗi `sw.js` / `mobx-state-tree` trong Console trình duyệt](#8-lỗi-swjs--mobx-state-tree-trong-console-trình-duyệt)

---

## 1. `getaddrinfo ENOTFOUND mysql`

### Triệu chứng

```
Failed to start server: getaddrinfo ENOTFOUND mysql
```

### Nguyên nhân

`db.js` dùng fallback `process.env.DB_HOST || 'mysql'`. Tên `mysql` là **Docker service name** — chỉ có thể phân giải (DNS resolve) bên trong cùng Docker network. Khi backend chạy trực tiếp trên máy host bằng `node src/server.js`, không có DNS nào biết `mysql` là gì.

```javascript
// backend/src/config/db.js
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',  // ← 'mysql' chỉ valid TRONG Docker network
  ...
});
```

### Cách khắc phục

Trong `backend/.env.dev`, đặt `DB_HOST=127.0.0.1`:

```dotenv
# backend/.env.dev
DB_HOST=127.0.0.1   # ← Chạy local phải dùng địa chỉ IP thật của host
DB_PORT=3306
```

### Nguyên tắc

| Môi trường | Giá trị DB_HOST | Lý do |
|-----------|----------------|-------|
| Local (node trực tiếp) | `127.0.0.1` | Backend không trong Docker network |
| Docker Dev (`docker-compose.dev.yml`) | `mysql-dev` | Cùng Docker network |
| Docker Build (`docker-compose.build.yml`) | `mysql-build` | Cùng Docker network |

---

## 2. `dotenv` load sau khi module đã được require

### Triệu chứng

File `.env.dev` tồn tại và đúng, nhưng backend vẫn in lỗi `ENOTFOUND mysql`. Không có lỗi về file env.

### Nguyên nhân (root cause)

Node.js thực thi `require()` **đồng bộ và ngay lập tức**. Khi `admissionRoutes` được require, nó kéo theo `admissionModel` → `db.js`. Tại thời điểm `db.js` chạy, `dotenv.config()` chưa được gọi, nên `process.env.DB_HOST` vẫn là `undefined` → fallback về `'mysql'`.

**Code lỗi (thứ tự require sai):**

```javascript
// ❌ SAI — app.js trước khi fix
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const admissionRoutes = require('./routes/admissionRoutes');  // ← db.js chạy Ở ĐÂY

// dotenv.config() chạy SAU KHI db.js đã đọc process.env xong rồi → quá muộn
const nodeEnv = process.env.NODE_ENV || 'dev';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
```

**Code đúng (dotenv load trước):**

```javascript
// ✅ ĐÚNG — app.js sau khi fix
const dotenv = require('dotenv');
const path = require('path');

// dotenv.config() phải được gọi TRƯỚC bất kỳ require() nào đọc process.env
const nodeEnv = process.env.NODE_ENV || 'dev';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
dotenv.config(); // fallback: .env

const express = require('express');
const cors = require('cors');
const admissionRoutes = require('./routes/admissionRoutes');  // ← db.js chạy Ở ĐÂY, env đã sẵn sàng
```

### Nguyên tắc

> **`dotenv.config()` phải là lệnh gọi đầu tiên trong entry point**, trước tất cả `require()` của code ứng dụng. Đây là lỗi phổ biến nhất khi dùng dotenv trong Node.js.

### File bị ảnh hưởng

- [backend/src/app.js](../backend/src/app.js)

---

## 3. `connect ECONNREFUSED 127.0.0.1:3306`

### Triệu chứng

```
Failed to start server: connect ECONNREFUSED 127.0.0.1:3306
```

Hoặc trong Docker:
```
Error: connect ECONNREFUSED mysql-build:3306
```

### Nguyên nhân

MySQL container đã **started** (trạng thái `Up`) nhưng MySQL server bên trong chưa **ready** nhận connection. Khoảng thời gian khởi động nội bộ của MySQL có thể mất 10–30 giây.

```
Container "Up" ≠ Service "Ready"
```

### Cách khắc phục

**1. Khi chạy Dev local:** Chạy `.\clean_dev.ps1` và **chờ** đến khi thấy `MySQL is up and healthy!` trước khi chạy backend.

**2. Khi dùng Docker Compose:** Dùng `healthcheck` + `condition: service_healthy`:

```yaml
# docker-compose.build.yml
services:
  mysql-build:
    image: mysql:8.0
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-prootpassword"]
      interval: 5s
      timeout: 5s
      retries: 20   # Thử tối đa 20 lần × 5s = 100s

  backend-build:
    depends_on:
      mysql-build:
        condition: service_healthy   # ← đợi healthcheck pass mới khởi động
```

### Nguyên tắc

> Không bao giờ dùng `depends_on: [mysql]` đơn giản khi service cần connect ngay lúc khởi động. Luôn dùng `condition: service_healthy` với `healthcheck` được định nghĩa rõ ràng.

---

## 4. `Access denied for user 'lms_user'`

### Triệu chứng

```
Access denied for user 'lms_user'@'%' to database 'lms_db_dev'
```

### Nguyên nhân

User `lms_user` được tạo bởi `MYSQL_USER` trong docker-compose, nhưng có thể **không có đủ quyền** `CREATE TABLE` hoặc không được cấp quyền vào đúng database.

### Cách khắc phục

Trong `backend/.env.dev`, dùng tài khoản `root` khi phát triển local:

```dotenv
DB_USER=root
DB_PASSWORD=rootpassword
```

> **Lưu ý bảo mật:** Chỉ dùng `root` trong môi trường dev. Trong Build/Production, cấp đúng quyền cho `lms_user`:

```sql
GRANT ALL PRIVILEGES ON lms_db_build.* TO 'lms_user'@'%';
FLUSH PRIVILEGES;
```

---

## 5. Biến `VITE_*` không có tác dụng trong Docker

### Triệu chứng

Frontend gọi sai API URL (ví dụ: `http://localhost:5000` thay vì `http://localhost:5001`) dù đã truyền đúng trong `env_file` của docker-compose.

### Nguyên nhân

Vite **bake cứng (inline)** tất cả biến `VITE_*` vào bundle JavaScript tại **thời điểm build** (`npm run build`). Khi Docker build image, `npm run build` đã chạy xong — mọi giá trị `VITE_*` đã được cố định trong bundle JS. Truyền `env_file` vào container lúc chạy không có tác dụng gì với các biến này.

```
Build time: VITE_API_URL được đọc và nhúng vào bundle.js
Run time:   bundle.js đã bất biến, env_file không thể thay đổi
```

### Cách khắc phục

Truyền giá trị `VITE_*` qua `build args` trong `Dockerfile` và `docker-compose.build.yml`:

```yaml
# docker-compose.build.yml
frontend-build:
  build:
    context: ./frontend
    args:
      VITE_API_URL: http://localhost:5001   # ← truyền vào lúc BUILD IMAGE
```

```dockerfile
# frontend/Dockerfile
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build   # Vite đọc ENV và nhúng vào bundle
```

### So sánh

| Cách truyền biến | Hoạt động với `VITE_*`? | Ghi chú |
|-----------------|------------------------|---------|
| `.env.dev` (local) | ✅ | Vite đọc file này lúc `npm run dev` |
| `docker-compose env_file` | ❌ | Quá muộn — bundle đã build xong |
| `docker-compose build args` | ✅ | Truyền vào lúc `docker build` |
| Biến `process.env.*` (không có tiền tố VITE_) | ✅ (runtime) | Chỉ dùng được trong Node.js, không trong browser |

### Nguyên tắc

> Với Vite/React: **`VITE_*` = build-time constant**, không phải runtime variable. Nếu cần thay đổi URL theo môi trường deploy, phải truyền qua build args hoặc dùng pattern runtime config (window.__ENV__).

---

## 6. Port mapping sai

### Triệu chứng

Frontend build chạy trong Docker nhưng truy cập `http://localhost:5174` thì trình duyệt báo `Connection refused` hoặc trang trắng.

### Nguyên nhân

Docker port mapping có cú pháp `HOST_PORT:CONTAINER_PORT`. Nếu script preview chạy trên port `5174` bên trong container nhưng docker-compose map `5174:5173`, container sẽ expose port `5173` ra ngoài — không khớp với port service đang lắng nghe.

```yaml
# ❌ SAI
ports:
  - "5174:5173"   # Host 5174 → Container 5173, nhưng Vite đang listen 5174

# ✅ ĐÚNG
ports:
  - "5174:5174"   # Host 5174 → Container 5174, khớp với Vite listen 5174
```

Cần đảm bảo `package.json` và docker-compose khớp nhau:

```json
// frontend/package.json
"preview:build": "vite preview --host 0.0.0.0 --port 5174"
```

```yaml
# docker-compose.build.yml
ports:
  - "5174:5174"
```

### Nguyên tắc

> Cú pháp `HOST:CONTAINER` — cổng **bên phải** là cổng bên trong container, phải khớp với cổng service thực sự đang `listen`. Cổng bên trái là cổng bạn dùng trên máy host để truy cập.

---

## 7. Content Security Policy (CSP) chặn request API

### Triệu chứng

Console trình duyệt báo:

```
Refused to connect to 'http://localhost:5001/api/admissions' because it violates
the following Content Security Policy directive: "connect-src 'self' http://localhost:5000"
```

### Nguyên nhân

Thẻ `<meta http-equiv="Content-Security-Policy">` trong `index.html` chỉ cho phép kết nối đến port `5000`. Khi backend chạy trên port khác (ví dụ `5001` trong môi trường Build), trình duyệt từ chối request.

### Cách khắc phục

Trong `frontend/index.html`, mở rộng `connect-src` để cho phép tất cả port của `localhost`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  connect-src 'self' http://localhost:* ws://localhost:*;
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
" />
```

> **Lưu ý bảo mật:** `localhost:*` chỉ phù hợp cho dev/build nội bộ.  
> Trong production, **phải chỉ định rõ domain và port cụ thể** — không dùng wildcard.

---

## 8. Lỗi `sw.js` / `mobx-state-tree` trong Console trình duyệt

### Triệu chứng

Console hiển thị lỗi với stack trace chứa:
```
sw.js:1
jamToggleDumpStore
injectionLifecycle
mobx-state-tree
```

### Nguyên nhân

Đây **không phải lỗi của dự án**. Đây là lỗi từ **Chrome Extension bên thứ ba** (Jam.dev hoặc extension debug tương tự) đang inject code vào trang web của bạn.

### Cách xử lý

- **Cách 1:** Bỏ qua — không ảnh hưởng đến code dự án.
- **Cách 2:** Mở DevTools → tab **Console** → bỏ check "All levels" và lọc theo URL của dự án.
- **Cách 3:** Disable extension trong Chrome (`chrome://extensions/`) khi debug để console sạch hơn.

---

## Tóm tắt bài học

| # | Vấn đề | Bài học |
|---|--------|---------|
| 1 | `ENOTFOUND mysql` | Tên Docker service chỉ resolve trong Docker network |
| 2 | `dotenv` load muộn | `dotenv.config()` phải gọi trước mọi `require()` khác |
| 3 | `ECONNREFUSED 3306` | Container started ≠ service ready; dùng healthcheck |
| 4 | Access denied | Dùng `root` cho dev local, cấp đủ quyền cho production |
| 5 | `VITE_*` không hoạt động | Biến Vite là build-time; truyền qua `build args` |
| 6 | Port mapping sai | `HOST:CONTAINER` — cổng phải khớp với service đang listen |
| 7 | CSP block | Cập nhật CSP khi đổi port; wildcard chỉ dùng cho dev |
| 8 | Lỗi extension Chrome | `sw.js` errors từ third-party extension, bỏ qua |
