import { useMemo, useState } from 'react'

const cardStyle = {
  maxWidth: '560px',
  margin: '40px auto',
  fontFamily: 'Arial, sans-serif',
  padding: '24px',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
}

function App() {
  const apiUrl = useMemo(
    () => import.meta.env.VITE_API_URL || 'http://localhost:5000',
    []
  )

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    course: ''
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`${apiUrl}/api/admissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('✅ ' + result.message)
        setFormData({ fullName: '', email: '', course: '' })
      } else {
        setMessage('❌ ' + (result.message || 'Có lỗi xảy ra.'))
      }
    } catch (error) {
      setMessage('❌ Lỗi kết nối tới server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={cardStyle}>
      <h1 style={{ marginBottom: '8px' }}>Đăng ký tuyển sinh LMS</h1>
      <p style={{ marginTop: 0, color: '#4b5563' }}>
        Phiên bản backend đã nâng cấp sang kiến trúc controller/service/router và lưu MySQL.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        <input
          type="text"
          placeholder="Họ và tên"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          required
          style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db' }}
        />

        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
          style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db' }}
        />

        <select
          value={formData.course}
          onChange={(e) => handleChange('course', e.target.value)}
          required
          style={{ padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db' }}
        >
          <option value="">-- Chọn khóa học --</option>
          <option value="IT">Công nghệ thông tin</option>
          <option value="Biz">Quản trị kinh doanh</option>
          <option value="Design">Thiết kế đồ họa</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            backgroundColor: loading ? '#93c5fd' : '#2563eb',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: '10px',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Đang gửi...' : 'Gửi Đăng Ký'}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: '18px', fontWeight: 'bold' }}>{message}</p>
      )}

      <div
        style={{
          marginTop: '24px',
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '10px',
          fontSize: '14px',
          color: '#374151',
        }}
      >
        API URL hiện tại: <strong>{apiUrl}</strong>
      </div>
    </div>
  )
}

export default App
