Read [](file:///d%3A/DevOps/GitLabs/lms-core-system-upgraded/clean_test.ps1)

Read [](file:///d%3A/DevOps/GitLabs/lms-core-system-upgraded/docker-compose.test.yml)

Read [](file:///d%3A/DevOps/GitLabs/lms-core-system-upgraded/frontend/Dockerfile)

Tìm ra 2 lỗi gốc:

1. **Port mapping sai**: docker-compose.test.yml map `5174:5173` nhưng script `preview:test` chạy trên port **5174 bên trong container** → phải map `5174:5174`
2. **Không có healthcheck/depends_on đúng**: Backend khởi động trước MySQL sẵn sàng, Frontend không chờ Backend

Sửa cả 3 file cùng lúc: 

Replacing 39 lines with 45 lines in [](file:///d%3A/DevOps/GitLabs/lms-core-system-upgraded/docker-compose.test.yml)


```

```


Replacing 12 lines with 48 lines in [](file:///d%3A/DevOps/GitLabs/lms-core-system-upgraded/clean_test.ps1)


```

```
Giờ hãy chạy lại:
```powershell
powershell -File "D:\DevOps\GitLabs\lms-core-system-upgraded\clean_test.ps1"
```

**Tóm tắt những gì đã sửa:**

| Vấn đề | Nguyên nhân | Đã sửa |
|---|---|---|
| Lỗi "chrome-error" khi mở localhost:5174 | Port mapping sai: `5174:5173` nhưng preview chạy port 5174 bên trong container | Đổi thành `5174:5174` |
| Backend crash "ECONNREFUSED MySQL" | Không có healthcheck, BE chạy trước MySQL sẵn sàng | Thêm healthcheck cho MySQL + `condition: service_healthy` |
| Frontend không chờ Backend | `depends_on` chưa có backend-test | Thêm `depends_on: - backend-test` cho frontend-test |
| Script không báo khi nào app thực sự ready | Không có kiểm tra sau khi container start | Script giờ chờ từng service healthy (MySQL → BE → FE) trước khi báo "ready" |

Made changes.