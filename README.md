# LMS Core System - Admission Module (MySQL Version)

Phiên bản này đã nâng cấp:
- Backend dùng MySQL
- Hỗ trợ `.env`
- Tách backend theo kiến trúc:
  - controllers
  - services
  - routes
  - models
  - config

## Cấu trúc thư mục
```text
lms-core-system-upgraded/
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── Dockerfile
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   ├── db.js
│       │   └── init.sql
│       ├── controllers/
│       │   └── admissionController.js
│       ├── models/
│       │   └── admissionModel.js
│       ├── routes/
│       │   └── admissionRoutes.js
│       └── services/
│           └── admissionService.js
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── Dockerfile
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       └── App.jsx
└── docker-compose.yml
```

## Chuẩn bị file môi trường
Sao chép file ví dụ thành file thật:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## Chạy hệ thống
```bash
docker compose up --build
```

Hoặc:
```bash
docker-compose up --build
```

## Truy cập
- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/api/health
- API danh sách hồ sơ: http://localhost:5000/api/admissions

## API
### POST /api/admissions
```json
{
  "fullName": "Nguyen Van A",
  "email": "a@example.com",
  "course": "IT"
}
```

### GET /api/admissions
Trả về danh sách đăng ký từ MySQL.

## Ghi chú
- Bảng `admissions` được tạo tự động khi backend khởi động.
- Dữ liệu MySQL được lưu bằng Docker volume `mysql_data`.
- Trong Docker network, backend kết nối DB qua host `mysql`.

Nếu gặp lỗi về chính sách bảo mật (Execution Policy), bạn hãy chạy lệnh này trong terminal trước:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
