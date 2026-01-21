import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import { useUser } from '../contexts/UserContext'
import Navbar from '../components/Navbar'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const { user, loading, fetchUserInfo } = useUser()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (!loading && user) {
      navigate('/')
    }
  }, [loading, user, navigate])

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

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '유효한 이메일 형식이 아닙니다.'
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 초기화
    setServerError('')
    setSuccessMessage('')
    setErrors({})

    // 클라이언트 측 검증
    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      // 서버로 로그인 요청 (서버 authController.js의 login 함수와 동일한 형식)
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('로그인 응답:', response.data)

      // 서버 응답 형식 확인 (authController.js의 응답 형식과 일치)
      if (response.data.success && response.data.token) {
        // 토큰과 사용자 정보를 localStorage에 저장
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('tokenType', response.data.tokenType || 'Bearer')
        localStorage.setItem('expiresIn', response.data.expiresIn || '24h')
        
        if (response.data.data) {
          localStorage.setItem('user', JSON.stringify(response.data.data))
        }
        
        // 유저 정보 다시 가져오기 (Context 업데이트)
        await fetchUserInfo()
        
        setSuccessMessage(response.data.message || '로그인에 성공했습니다!')
        
        // 폼 초기화
        setFormData({
          email: '',
          password: '',
        })
        setErrors({})

        // 1.5초 후 홈으로 이동
        setTimeout(() => {
          navigate('/')
        }, 1500)
      } else {
        // 예상치 못한 응답 형식
        setServerError('서버 응답 형식이 올바르지 않습니다.')
        console.error('예상치 못한 응답:', response.data)
      }
    } catch (error) {
      console.error('로그인 오류:', error)
      
      // 서버 에러 응답 처리 (authController.js의 에러 응답 형식과 일치)
      if (error.response) {
        const errorData = error.response.data
        
        // 서버에서 반환한 에러 메시지 (authController.js의 message 필드)
        if (errorData.message) {
          setServerError(errorData.message)
        } else {
          setServerError('로그인 중 오류가 발생했습니다.')
        }

        // HTTP 상태 코드에 따른 처리
        if (error.response.status === 401) {
          // 인증 실패 (이메일 또는 비밀번호 불일치)
          setServerError(errorData.message || '이메일 또는 비밀번호가 올바르지 않습니다.')
        } else if (error.response.status === 400) {
          // 잘못된 요청 (필수 필드 누락 등)
          setServerError(errorData.message || '입력 정보를 확인해주세요.')
        } else if (error.response.status === 500) {
          // 서버 내부 오류
          setServerError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }

        // 필드별 에러 처리 (서버에서 errors 배열로 반환하는 경우)
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = {}
          errorData.errors.forEach((errMsg) => {
            if (errMsg.includes('이메일') || errMsg.toLowerCase().includes('email')) {
              fieldErrors.email = errMsg
            } else if (errMsg.includes('비밀번호') || errMsg.toLowerCase().includes('password')) {
              fieldErrors.password = errMsg
            }
          })
          
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(prev => ({
              ...prev,
              ...fieldErrors
            }))
          }
        }
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우 (서버가 실행되지 않았거나 네트워크 오류)
        setServerError('서버에 연결할 수 없습니다. 서버가 포트 5000에서 실행 중인지 확인해주세요.')
        console.error('서버 연결 실패:', error.message)
      } else {
        // 요청 설정 중 오류 발생
        setServerError('요청 중 오류가 발생했습니다: ' + error.message)
        console.error('요청 오류:', error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 로딩 중이거나 이미 로그인된 사용자는 아무것도 표시하지 않음
  if (loading || user) {
    return null
  }

  return (
    <div className="login">
      <Navbar />
      <div className="login-container">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← 홈으로
        </button>

        <div className="login-form-wrapper">
          <div className="login-header">
            <div className="camera-icon">📷</div>
            <h1 className="login-title">LOGIN</h1>
            <p className="login-subtitle">Camera Store에 다시 오신 것을 환영합니다</p>
          </div>
          
          <form className="login-form" onSubmit={handleSubmit}>
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

            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? '처리 중...' : 'SUBMIT'}
            </button>

            <div className="login-footer">
              <p>
                계정이 없으신가요?{' '}
                <span 
                  className="register-link"
                  onClick={() => navigate('/register')}
                >
                  회원가입
                </span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
