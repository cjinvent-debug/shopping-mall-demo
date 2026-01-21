import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import Navbar from '../components/Navbar'
import './MyPage.css'

function MyPage() {
  const navigate = useNavigate()
  const { user, loading: userLoading, fetchUserInfo } = useUser()
  const [activeTab, setActiveTab] = useState('profile')
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!userLoading && !user) {
      navigate('/login')
    }
  }, [user, userLoading, navigate])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        address: user.address || '',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      if (activeTab === 'orders') {
        fetchOrders()
      }
    }
  }, [user, activeTab])

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success) {
        setOrders(response.data.data || [])
      }
    } catch (error) {
      console.error('주문 목록 조회 오류:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

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
    setSuccessMessage('')
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.'
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.'
    }

    // 비밀번호 변경 시 검증
    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = '현재 비밀번호를 입력해주세요.'
      }
      if (!formData.newPassword) {
        newErrors.newPassword = '새 비밀번호를 입력해주세요.'
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = '비밀번호는 최소 6자 이상이어야 합니다.'
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = '새 비밀번호가 일치하지 않습니다.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage('')

    if (!validate()) return

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const updateData = {
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
      }

      // 비밀번호 변경이 있는 경우에만 추가
      if (formData.newPassword) {
        updateData.password = formData.newPassword
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/users/${user._id}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (response.data.success) {
        setSuccessMessage('정보가 성공적으로 수정되었습니다.')
        // UserContext 업데이트
        await fetchUserInfo()
        // 비밀번호 필드 초기화
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }))
      }
    } catch (error) {
      console.error('정보 수정 오류:', error)
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message })
      } else {
        setErrors({ submit: '정보 수정 중 오류가 발생했습니다.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      'PENDING': '주문 대기',
      'PAYMENT_COMPLETED': '결제 완료',
      'PREPARING': '배송 준비 중',
      'SHIPPING': '배송 중',
      'DELIVERED': '배송 완료',
      'CANCELLED': '주문 취소',
    }
    return labels[status] || status
  }

  const getStatusClass = (status) => {
    const classes = {
      'PENDING': 'status-pending',
      'PAYMENT_COMPLETED': 'status-payment-completed',
      'PREPARING': 'status-preparing',
      'SHIPPING': 'status-shipping',
      'DELIVERED': 'status-delivered',
      'CANCELLED': 'status-cancelled',
    }
    return classes[status] || ''
  }

  if (userLoading || !user) {
    return (
      <div className="mypage">
        <Navbar />
        <div className="mypage-container">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mypage">
      <Navbar />
      <div className="mypage-container">
        <h1 className="page-title">마이페이지</h1>

        {/* 탭 메뉴 */}
        <div className="mypage-tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            내 정보 수정
          </button>
          <button
            className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            내 주문 목록
          </button>
        </div>

        {/* 내 정보 수정 탭 */}
        {activeTab === 'profile' && (
          <div className="profile-section">
            <form onSubmit={handleSubmit} className="profile-form">
              {successMessage && (
                <div className="success-message">{successMessage}</div>
              )}

              {errors.submit && (
                <div className="error-message">{errors.submit}</div>
              )}

              <div className="form-group">
                <label htmlFor="name">
                  이름 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="이름을 입력해주세요"
                />
                {errors.name && (
                  <span className="error-text">{errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">이메일</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="disabled-input"
                  placeholder="이메일"
                />
                <span className="input-note">이메일은 변경할 수 없습니다.</span>
              </div>

              <div className="form-group">
                <label htmlFor="address">주소</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="주소를 입력해주세요"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">전화번호</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="전화번호를 입력해주세요 (선택사항)"
                  disabled
                />
                <span className="input-note">전화번호 기능은 준비 중입니다.</span>
              </div>

              <div className="password-section">
                <h3 className="section-subtitle">비밀번호 변경</h3>
                <p className="section-note">비밀번호를 변경하지 않으려면 비워두세요.</p>

                <div className="form-group">
                  <label htmlFor="currentPassword">현재 비밀번호</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className={errors.currentPassword ? 'error' : ''}
                    placeholder="현재 비밀번호"
                  />
                  {errors.currentPassword && (
                    <span className="error-text">{errors.currentPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">새 비밀번호</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={errors.newPassword ? 'error' : ''}
                    placeholder="새 비밀번호 (최소 6자)"
                  />
                  {errors.newPassword && (
                    <span className="error-text">{errors.newPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">새 비밀번호 확인</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? 'error' : ''}
                    placeholder="새 비밀번호 확인"
                  />
                  {errors.confirmPassword && (
                    <span className="error-text">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '저장 중...' : '정보 수정'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 내 주문 목록 탭 */}
        {activeTab === 'orders' && (
          <div className="orders-section">
            {loadingOrders ? (
              <div className="loading">주문 목록을 불러오는 중...</div>
            ) : orders.length === 0 ? (
              <div className="empty-state">주문 내역이 없습니다.</div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="order-card"
                    onClick={() => navigate(`/order/${order._id}`)}
                  >
                    <div className="order-card-header">
                      <div className="order-number-section">
                        <span className="order-number">{order.orderNumber}</span>
                        <span className="order-date">
                          {new Date(order.createdAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="order-items-preview">
                      {order.items?.slice(0, 3).map((item, index) => (
                        <div key={index} className="item-preview">
                          <div className="item-image-small">
                            {item.product?.image && item.product.image.startsWith('http') ? (
                              <img src={item.product.image} alt={item.product.name} />
                            ) : (
                              <div className="image-placeholder-small">📷</div>
                            )}
                          </div>
                          <div className="item-info-small">
                            <span className="item-name-small">{item.product?.name || '상품명 없음'}</span>
                            <span className="item-quantity-small">× {item.quantity}</span>
                          </div>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="more-items-indicator">
                          외 {order.items.length - 3}개 상품
                        </div>
                      )}
                    </div>

                    <div className="order-card-footer">
                      <div className="order-amount">
                        <span className="amount-label">결제 금액</span>
                        <span className="amount-value">
                          {order.amount?.finalTotal?.toLocaleString('ko-KR') || '0'}원
                        </span>
                      </div>
                      <button
                        className="detail-button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/order/${order._id}`)
                        }}
                      >
                        상세보기 →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyPage
