import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import './Register.css'

function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.'
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '유효한 이메일 형식이 아닙니다.'
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 초기화
    setServerError('')
    setSuccessMessage('')

    // 클라이언트 측 검증
    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      // 서버로 회원가입 요청
      const response = await axios.post(`${API_BASE_URL}/api/users`, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        userType: 'CUSTOMER',
      })

      // 성공 응답 처리
      if (response.data.success) {
        setSuccessMessage('회원가입이 완료되었습니다')
        setServerError('') // 서버 에러 메시지 초기화
        
        // 폼 초기화
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
        })
        setErrors({})

        // 2초 후 홈으로 이동
        setTimeout(() => {
          navigate('/')
        }, 2000)
      }
    } catch (error) {
      // 서버 에러 응답 처리
      if (error.response) {
        const errorData = error.response.data
        
        // 서버에서 반환한 에러 메시지
        if (errorData.message) {
          setServerError(errorData.message)
        }

        // 서버에서 반환한 필드별 에러 처리
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = {}
          errorData.errors.forEach((errMsg) => {
            // 에러 메시지에서 필드명 추출
            if (errMsg.includes('이메일')) {
              fieldErrors.email = errMsg
            } else if (errMsg.includes('이름')) {
              fieldErrors.name = errMsg
            } else if (errMsg.includes('비밀번호')) {
              fieldErrors.password = errMsg
            }
          })
          
          // 기존 에러와 병합
          setErrors(prev => ({
            ...prev,
            ...fieldErrors
          }))
        }

        // 중복 이메일 에러 처리
        if (error.response.status === 400 && errorData.message?.includes('이미 존재')) {
          setErrors(prev => ({
            ...prev,
            email: '이미 사용 중인 이메일입니다.'
          }))
        }
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        setServerError('서버에 연결할 수 없습니다. 서버가 포트 5000에서 실행 중인지 확인해주세요.')
        console.error('서버 연결 실패:', error.message)
        console.error('서버 주소:', `${API_BASE_URL}/api/users`)
      } else {
        // 요청 설정 중 오류 발생
        setServerError('요청 중 오류가 발생했습니다: ' + error.message)
        console.error('요청 오류:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register">
      <div className="register-container">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← 홈으로
        </button>

        <div className="register-form-wrapper">
          <div className="register-header">
            <div className="camera-icon">📷</div>
            <h1 className="register-title">REGISTER</h1>
            <p className="register-subtitle">Camera Store에 오신 것을 환영합니다</p>
          </div>
          
          <form className="register-form" onSubmit={handleSubmit}>
            {/* 성공 메시지 */}
            {successMessage && (
              <div className="success-message">
                ✅ {successMessage}
              </div>
            )}

            {/* 서버 에러 메시지 */}
            {serverError && (
              <div className="server-error-message">
                ⚠️ {serverError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">이름</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="이름을 입력하세요"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="이메일을 입력하세요"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                placeholder="비밀번호를 입력하세요"
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">비밀번호확인</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="비밀번호를 다시 입력하세요"
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? '처리 중...' : 'SUBMIT'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
