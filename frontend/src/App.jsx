import { useMemo, useState, useEffect } from 'react'

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
  const [admissions, setAdmissions] = useState([])
  const [admissionsLoading, setAdmissionsLoading] = useState(false)
  const [admissionsError, setAdmissionsError] = useState('')

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
        fetchAdmissions() // Gửi xong thì fetch lại danh sách
      } else {
        setMessage('❌ ' + (result.message || 'Có lỗi xảy ra.'))
      }
    } catch (error) {
      setMessage('❌ Lỗi kết nối tới server.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdmissions = async () => {
    setAdmissionsLoading(true)
    setAdmissionsError('')
    try {
      const res = await fetch(`${apiUrl}/api/admissions`)
      const data = await res.json()
      if (res.ok) {
        setAdmissions(data.data || [])
      } else {
        setAdmissionsError(data.message || 'Lỗi tải danh sách')
      }
    } catch (e) {
      setAdmissionsError('Lỗi kết nối tới server')
    } finally {
      setAdmissionsLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmissions()
  }, [apiUrl])

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

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Danh sách người đã đăng ký</h2>
        {admissionsLoading ? (
          <p>Đang tải...</p>
        ) : admissionsError ? (
          <p style={{ color: 'red' }}>{admissionsError}</p>
        ) : admissions.length === 0 ? (
          <p>Chưa có ai đăng ký.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Họ tên</th>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Email</th>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Khóa học</th>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Trạng thái</th>
                <th style={{ padding: 8, border: '1px solid #e5e7eb' }}>Ngày đăng ký</th>
              </tr>
            </thead>
            <tbody>
              {admissions.map((a) => (
                <tr key={a.id}>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{a.fullName}</td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{a.email}</td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{a.course}</td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{a.status}</td>
                  <td style={{ padding: 8, border: '1px solid #e5e7eb' }}>{new Date(a.submittedAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default App
