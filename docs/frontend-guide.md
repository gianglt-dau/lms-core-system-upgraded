# Frontend Guide — LMS Admission Web

> Tài liệu dành cho beginner developer.  
> Giải thích **từng thư viện, từng file, từng lệnh** trong dự án frontend.

---

## Mục lục

1. [Frontend làm gì?](#1-frontend-làm-gì)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Các thư viện sử dụng](#3-các-thư-viện-sử-dụng)
4. [Đi sâu từng file](#4-đi-sâu-từng-file)
5. [Các khái niệm React cần biết](#5-các-khái-niệm-react-cần-biết)
6. [Biến môi trường (VITE\_\*)](#6-biến-môi-trường-vite_)
7. [Các lệnh thường dùng](#7-các-lệnh-thường-dùng)
8. [Luồng hoạt động của ứng dụng](#8-luồng-hoạt-động-của-ứng-dụng)

---

## 1. Frontend làm gì?

Frontend là **giao diện người dùng** chạy trong trình duyệt. Nó hiển thị form đăng ký tuyển sinh, gửi dữ liệu lên Backend API, và hiển thị danh sách người đã đăng ký.

**Giao diện gồm 2 phần chính:**

| Phần | Mô tả |
|------|-------|
| Form đăng ký | Nhập họ tên, email, chọn khóa học → gửi lên Backend |
| Danh sách đăng ký | Hiển thị tất cả người đã đăng ký, tự động cập nhật sau khi gửi form |

**Công nghệ sử dụng:** React + Vite

---

## 2. Cấu trúc thư mục

```
frontend/
├── .env.dev              ← Biến môi trường cho Dev (local)
├── .env.build            ← Biến môi trường cho Build (Docker)
├── package.json          ← Khai báo dự án và dependencies
├── vite.config.js        ← Cấu hình Vite (dev server, build)
├── Dockerfile            ← Đóng gói thành Docker image
├── index.html            ← File HTML gốc duy nhất (SPA entry point)
└── src/
    ├── main.jsx          ← Điểm khởi động React app
    └── App.jsx           ← Toàn bộ UI và logic của ứng dụng
```

---

## 3. Các thư viện sử dụng

### `react` — Thư viện UI chính

```bash
npm install react react-dom
```

React là thư viện JavaScript của Meta để xây dựng giao diện người dùng.  
Ý tưởng cốt lõi: **UI = f(state)** — giao diện là hàm của trạng thái. Khi state thay đổi, React tự động cập nhật lại giao diện, bạn không cần thao tác DOM thủ công.

```javascript
// Không có React (thủ công, dễ lỗi)
document.getElementById('message').innerText = 'Đăng ký thành công!';
document.getElementById('message').style.color = 'green';

// Có React (đơn giản, tự động)
const [message, setMessage] = useState('');
setMessage('Đăng ký thành công!'); // React tự cập nhật UI
```

**`react-dom`** là phần kết nối React với DOM của trình duyệt.

---

### `vite` — Build tool và Dev server

```bash
npm install vite --save-dev
```

Vite là công cụ thay thế webpack — **nhanh hơn rất nhiều** trong quá trình phát triển.

**Hai vai trò của Vite:**

| Chế độ | Lệnh | Mô tả |
|--------|------|-------|
| Dev server | `vite` | Chạy server local, hot-reload tức thì khi sửa code |
| Build | `vite build` | Đóng gói toàn bộ app thành HTML/CSS/JS tĩnh để deploy |

**Hot Module Replacement (HMR):** Khi bạn sửa code và lưu, trình duyệt tự động cập nhật **mà không cần tải lại trang**. State hiện tại cũng được giữ nguyên.

---

### `@vitejs/plugin-react` — Plugin React cho Vite

```bash
npm install @vitejs/plugin-react --save-dev
```

Plugin kết nối Vite với React — cho phép Vite hiểu và xử lý file `.jsx`, bật Fast Refresh (phiên bản HMR cho React).

```javascript
// vite.config.js
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()], // ← Plugin này bắt buộc khi dùng React + Vite
});
```

---

## 4. Đi sâu từng file

### `index.html` — HTML gốc duy nhất

```html
<!doctype html>
<html lang="vi">
  <head>
    <!-- Content Security Policy: kiểm soát tài nguyên được phép tải -->
    <meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               connect-src 'self' http://localhost:* ws://localhost:*;
               ..." />
    <title>LMS Admission</title>
  </head>
  <body>
    <div id="root"></div>  <!-- ← React sẽ render toàn bộ app vào đây -->
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Lưu ý quan trọng — Content Security Policy (CSP):**  
`connect-src http://localhost:*` cho phép fetch đến bất kỳ port nào của localhost. Nếu thiếu hoặc sai, trình duyệt sẽ **tự chặn** mọi request API và báo lỗi trong console.

---

### `src/main.jsx` — Điểm khởi động React

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Giải thích từng dòng:**

| Dòng | Ý nghĩa |
|------|---------|
| `import React` | Import thư viện React (cần cho JSX) |
| `import ReactDOM` | Import phần kết nối với DOM trình duyệt |
| `import App` | Import component chính |
| `createRoot(getElementById('root'))` | Chỉ định thẻ `<div id="root">` làm nơi React "mount" vào |
| `.render(<App />)` | Render component App vào thẻ root |
| `<React.StrictMode>` | Chế độ kiểm tra nghiêm ngặt khi dev — hiển thị warning sớm hơn |

---

### `src/App.jsx` — Toàn bộ UI và logic

Đây là file quan trọng nhất. Phân tích từng phần:

#### Phần 1 — Khai báo state (trạng thái)

```javascript
function App() {
  // Địa chỉ API Backend — đọc từ biến môi trường, fallback về localhost:5000
  const apiUrl = useMemo(
    () => import.meta.env.VITE_API_URL || 'http://localhost:5000',
    []
  )

  // State cho form đăng ký
  const [formData, setFormData] = useState({ fullName: '', email: '', course: '' })

  // State cho thông báo kết quả (thành công/thất bại)
  const [message, setMessage] = useState('')

  // State cho trạng thái loading khi đang gửi form
  const [loading, setLoading] = useState(false)

  // State cho danh sách đăng ký
  const [admissions, setAdmissions] = useState([])
  const [admissionsLoading, setAdmissionsLoading] = useState(false)
  const [admissionsError, setAdmissionsError] = useState('')
```

`useState` tạo ra một cặp: **giá trị hiện tại** và **hàm cập nhật**. Khi gọi hàm cập nhật, React sẽ tự render lại UI.

---

#### Phần 2 — Gửi form (POST request)

```javascript
const handleSubmit = async (e) => {
  e.preventDefault()    // Ngăn form reload trang theo kiểu HTML thuần
  setLoading(true)      // Bật loading → button chuyển sang "Đang gửi..."
  setMessage('')

  try {
    const response = await fetch(`${apiUrl}/api/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),   // Chuyển object JS → chuỗi JSON
    })
    const result = await response.json() // Đọc body response

    if (response.ok) {                   // HTTP status 200-299
      setMessage('✅ ' + result.message)
      setFormData({ fullName: '', email: '', course: '' }) // Reset form
      fetchAdmissions()                  // Tải lại danh sách
    } else {
      setMessage('❌ ' + result.message) // Hiện thông báo lỗi từ Backend
    }
  } catch (error) {
    setMessage('❌ Lỗi kết nối tới server.') // Backend không chạy, hoặc mạng lỗi
  } finally {
    setLoading(false)  // Tắt loading dù thành công hay thất bại
  }
}
```

**`fetch` API:** Hàm có sẵn trong trình duyệt để gửi HTTP request. Không cần cài thêm thư viện nào.

---

#### Phần 3 — Lấy danh sách (GET request)

```javascript
const fetchAdmissions = async () => {
  setAdmissionsLoading(true)
  try {
    const res = await fetch(`${apiUrl}/api/admissions`)  // GET request
    const data = await res.json()
    if (res.ok) {
      setAdmissions(data.data || []) // Lưu danh sách vào state
    } else {
      setAdmissionsError(data.message || 'Lỗi tải danh sách')
    }
  } catch (e) {
    setAdmissionsError('Lỗi kết nối tới server')
  } finally {
    setAdmissionsLoading(false)
  }
}

// Tự động gọi khi component lần đầu mount (hiển thị trên màn hình)
useEffect(() => {
  fetchAdmissions()
}, [apiUrl])   // Chạy lại nếu apiUrl thay đổi
```

---

#### Phần 4 — Giao diện JSX

```jsx
return (
  <div style={cardStyle}>
    <h1>Đăng ký tuyển sinh LMS</h1>

    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Họ và tên"
        value={formData.fullName}                           // Controlled input
        onChange={(e) => handleChange('fullName', e.target.value)}
        required
      />
      {/* ... các input khác */}

      <button type="submit" disabled={loading}>
        {loading ? 'Đang gửi...' : 'Gửi Đăng Ký'}  {/* Thay đổi theo state */}
      </button>
    </form>

    {message && <p>{message}</p>}  {/* Chỉ render nếu message không rỗng */}
  </div>
)
```

**Controlled Input:** `value={formData.fullName}` + `onChange={...}` = React kiểm soát hoàn toàn giá trị của input. Đây là cách React khuyến nghị để xử lý form.

---

### `vite.config.js` — Cấu hình Vite

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],   // Bật plugin React (JSX + Fast Refresh)
  server: {
    host: '0.0.0.0',    // Lắng nghe trên tất cả network interface (cần cho Docker)
    port: 5173           // Port dev server
  }
})
```

`host: '0.0.0.0'` nghĩa là dev server có thể truy cập từ bên ngoài container (không chỉ `localhost`). Cần thiết khi chạy Vite trong Docker.

---

## 5. Các khái niệm React cần biết

### `useState` — Quản lý trạng thái

```javascript
const [value, setValue] = useState(initialValue);
```

- `value`: giá trị hiện tại
- `setValue(newValue)`: cập nhật giá trị → React tự render lại UI
- `initialValue`: giá trị khởi đầu (`''`, `false`, `[]`, `{}`, ...)

```javascript
// Ví dụ: toggle loading
const [loading, setLoading] = useState(false);
setLoading(true);  // → React render lại, loading = true
setLoading(false); // → React render lại, loading = false
```

---

### `useEffect` — Chạy code khi component mount / state thay đổi

```javascript
useEffect(() => {
  // Code chạy ở đây
}, [dependency]);
```

| Dependency array | Khi nào chạy |
|-----------------|--------------|
| Không có (`useEffect(fn)`) | Sau **mỗi** lần render |
| Mảng rỗng `[]` | **Chỉ một lần** khi component mount |
| `[apiUrl]` | Lần đầu mount + mỗi khi `apiUrl` thay đổi |

Dùng để: gọi API khi trang load, đăng ký event listener, ...

---

### `useMemo` — Cache giá trị tính toán

```javascript
const apiUrl = useMemo(
  () => import.meta.env.VITE_API_URL || 'http://localhost:5000',
  []  // Chỉ tính một lần
);
```

`useMemo` đảm bảo `apiUrl` không bị tính lại mỗi lần render. Với giá trị đơn giản không cần thiết nhiều, nhưng là best practice.

---

### JSX — JavaScript + HTML

JSX là cú pháp cho phép viết HTML-like trực tiếp trong JavaScript:

```jsx
// JSX
const element = <h1 className="title">Hello</h1>;

// JavaScript thuần (không ai viết thế này thực tế)
const element = React.createElement('h1', { className: 'title' }, 'Hello');
```

**Lưu ý cú pháp JSX khác HTML:**
- `class` → `className`
- `for` → `htmlFor`
- Style dùng object: `style={{ color: 'red', fontSize: '14px' }}`
- Comment: `{/* comment */}`
- Biểu thức JS bọc trong `{}`: `{loading ? '...' : 'Gửi'}`

---

## 6. Biến môi trường (VITE\_\*)

Vite cho phép dùng biến môi trường có tiền tố `VITE_` trong code React:

```javascript
// Trong code React — đọc biến môi trường
const apiUrl = import.meta.env.VITE_API_URL;
```

**Quy tắc quan trọng:** Vite **bake cứng** (nhúng trực tiếp) giá trị này vào file JavaScript **khi build** (`npm run build`). Không phải runtime!

```
Lúc build:  VITE_API_URL = "http://localhost:5001"
            → bundle.js chứa: const apiUrl = "http://localhost:5001"

Lúc chạy:  Giá trị đã bất biến trong bundle.js
           Không thể thay đổi bằng cách set env var trên server
```

### Các file .env của Frontend

```dotenv
# frontend/.env.dev
VITE_API_URL=http://localhost:5000   ← Backend chạy local port 5000
```

```dotenv
# frontend/.env.build (truyền qua build args trong Docker)
VITE_API_URL=http://localhost:5001   ← Backend Docker port 5001
```

Vite tự động đọc file `.env` theo môi trường:
- `npm run dev` → đọc `.env` và `.env.local`
- `vite build --mode build` → đọc `.env.build`

---

## 7. Các lệnh thường dùng

### Cài dependencies lần đầu

```powershell
cd frontend
npm install
```

Tải tất cả thư viện trong `package.json` về `node_modules/`.

---

### Chạy dev server (dùng hàng ngày khi code)

```powershell
npm run dev
# Hoặc chỉ: npx vite
```

Kết quả thành công:
```
  VITE v4.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Vite sẽ:
- Chạy dev server ở port `5173`
- **Hot-reload**: Khi bạn sửa và lưu file, trình duyệt tự cập nhật không cần F5

---

### Build production bundle

```powershell
npm run build
```

Kết quả: tạo thư mục `dist/` chứa file HTML/CSS/JS đã tối ưu.

```
dist/
├── index.html
└── assets/
    ├── index-[hash].js    ← Toàn bộ JS đã minify và bundle
    └── index-[hash].css
```

---

### Preview build đã tạo

```powershell
npm run preview          # Xem bản build ở port 5173
npm run preview:build    # Xem bản build (cho môi trường Build) ở port 5174
```

Preview khác Dev:
- **Dev** (`npm run dev`): Vite xử lý file gốc trực tiếp, có HMR
- **Preview** (`npm run preview`): Serve thư mục `dist/` đã build xong, giống production thật

---

### Xem scripts có sẵn

```powershell
npm run
# Liệt kê tất cả scripts có trong package.json
```

---

## 8. Luồng hoạt động của ứng dụng

### Khi trang web được mở lần đầu

```
1. Trình duyệt tải index.html
2. index.html có <script src="/src/main.jsx"> → Vite xử lý và trả về JS
3. main.jsx chạy: ReactDOM.createRoot(...).render(<App />)
4. App component mount:
   - useState khởi tạo: formData={}, message='', admissions=[]
   - useEffect chạy ngay: gọi fetchAdmissions()
5. fetchAdmissions():
   - GET http://localhost:5000/api/admissions
   - Nhận về danh sách JSON từ Backend
   - setAdmissions(data.data) → React render lại, hiển thị danh sách
```

---

### Khi người dùng điền form và nhấn "Gửi Đăng Ký"

```
1. Người dùng nhập vào input → onChange → handleChange() → setFormData()
   → React render lại, input hiển thị giá trị mới

2. Người dùng nhấn submit → handleSubmit(e)
   → e.preventDefault() (không reload trang)
   → setLoading(true) → button chuyển sang "Đang gửi..."

3. fetch POST /api/admissions với JSON body
   → Backend validate → lưu MySQL → trả về 201 + data

4. response.ok = true:
   → setMessage('✅ Đăng ký thành công!')
   → setFormData({...}) reset form về rỗng
   → fetchAdmissions() cập nhật danh sách

5. setLoading(false) → button trở lại "Gửi Đăng Ký"
   → React render lại lần cuối, hiển thị thông báo và danh sách mới
```

---

### Sơ đồ tổng quan

```
Trình duyệt
│
├── index.html          (HTML shell)
│   └── main.jsx        (mount React)
│       └── App.jsx     (UI + logic)
│           │
│           ├── useState  (quản lý state)
│           ├── useEffect (gọi API khi load)
│           │
│           ├── handleSubmit ──POST──► Backend :5000/api/admissions
│           └── fetchAdmissions ─GET──► Backend :5000/api/admissions
│                                              │
│                                        ◄─── JSON response
│
└── Hiển thị kết quả (React tự cập nhật DOM)
```
