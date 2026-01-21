import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import Navbar from '../components/Navbar'
import './Checkout.css'

function Checkout() {
  const navigate = useNavigate()
  const { user, loading: userLoading } = useUser()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    shippingAddress: '',
    shippingMemo: '',
    paymentMethod: 'CARD',
    orderMemo: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')

  // 포트원(Iamport) 결제 모듈 초기화
  useEffect(() => {
    if (window.IMP) {
      window.IMP.init('imp84223558')
      console.log('[포트원] 결제 모듈이 초기화되었습니다.')
    } else {
      console.warn('[포트원] 스크립트가 로드되지 않았습니다. index.html에 스크립트 태그를 확인해주세요.')
    }
  }, [])

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        navigate('/login')
      } else {
        fetchCart()
        // 사용자 정보가 있으면 기본값 설정
        if (user.name) {
          setFormData(prev => ({
            ...prev,
            recipientName: user.name || '',
            recipientPhone: user.phone || '',
            shippingAddress: user.address || '',
          }))
        }
      }
    }
  }, [user, userLoading, navigate])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success) {
        const items = response.data.data || []
        if (items.length === 0) {
          alert('장바구니가 비어있습니다.')
          navigate('/cart')
        } else {
          setCartItems(items)
        }
      }
    } catch (error) {
      console.error('장바구니 조회 오류:', error)
      alert('장바구니 정보를 불러올 수 없습니다.')
      navigate('/cart')
    } finally {
      setLoading(false)
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
    setServerError('')
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = '수령인 이름을 입력해주세요.'
    }

    if (!formData.recipientPhone.trim()) {
      newErrors.recipientPhone = '수령인 전화번호를 입력해주세요.'
    } else if (!/^[0-9-]+$/.test(formData.recipientPhone.trim())) {
      newErrors.recipientPhone = '올바른 전화번호 형식이 아닙니다.'
    }

    if (!formData.shippingAddress.trim()) {
      newErrors.shippingAddress = '배송 주소를 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 총 계산
  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * (item.quantity || 0)
  }, 0)

  const shippingFee = totalPrice >= 30000 ? 0 : 3000
  const finalPrice = totalPrice + shippingFee

  // 주문 생성 API 호출 함수 (결제 성공 후 호출)
  const createOrder = async (paymentResult) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('로그인 토큰이 없습니다. 다시 로그인해주세요.')
        navigate('/login')
        return
      }

      const orderData = {
        shippingInfo: {
          recipientName: formData.recipientName.trim(),
          recipientPhone: formData.recipientPhone.trim(),
          shippingAddress: formData.shippingAddress.trim(),
          shippingMemo: formData.shippingMemo.trim() || undefined,
        },
        payment: {
          method: formData.paymentMethod,
          imp_uid: paymentResult.imp_uid,
          merchant_uid: paymentResult.merchant_uid,
        },
        orderMemo: formData.orderMemo.trim() || undefined,
      }

      console.log('[주문 생성] 요청 데이터:', orderData)

      const response = await axios.post(
        `${API_BASE_URL}/api/orders`,
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      console.log('[주문 생성] 응답:', response.data)

      if (response.data.success) {
        // 장바구니 업데이트 이벤트 발생
        window.dispatchEvent(new CustomEvent('cartUpdated'))
        
        // 주문 완료 페이지로 이동
        const orderId = response.data.data._id
        navigate(`/order/complete/${orderId}`)
      } else {
        setServerError(response.data.message || '주문 생성에 실패했습니다.')
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('[주문 생성 오류]:', error)
      if (error.response) {
        const errorData = error.response.data || {}
        if (errorData.message) {
          setServerError(errorData.message)
        }
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = {}
          errorData.errors.forEach((errMsg) => {
            if (errMsg.includes('수령인 이름')) fieldErrors.recipientName = errMsg
            else if (errMsg.includes('수령인 전화번호')) fieldErrors.recipientPhone = errMsg
            else if (errMsg.includes('배송 주소')) fieldErrors.shippingAddress = errMsg
          })
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...fieldErrors }))
          }
        }
      } else if (error.request) {
        setServerError('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.')
      } else {
        setServerError('요청 중 오류가 발생했습니다: ' + error.message)
      }
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setErrors({})

    if (!validate()) return

    // 포트원 스크립트 확인
    if (!window.IMP) {
      alert('포트원 결제 모듈을 로드할 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }

    setIsSubmitting(true)

    // 주문번호 생성 (고유해야 함)
    const merchant_uid = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 상품명 생성 (여러 상품인 경우 "외 N개" 형식)
    const productNames = cartItems.map(item => item.product?.name || '상품').join(', ')
    const orderName = cartItems.length > 1 
      ? `${cartItems[0].product?.name || '상품'} 외 ${cartItems.length - 1}개`
      : (cartItems[0].product?.name || '상품')

    // 결제 수단에 따른 pay_method 매핑
    const payMethodMap = {
      'CARD': 'card',
      'BANK_TRANSFER': 'trans',
      'VIRTUAL_ACCOUNT': 'vbank',
      'MOBILE': 'phone',
    }
    const pay_method = payMethodMap[formData.paymentMethod] || 'card'

    // 포트원 결제 요청
    window.IMP.request_pay({
      pg: 'html5_inicis', // PG사 (테스트용)
      pay_method: pay_method,
      merchant_uid: merchant_uid,
      name: orderName,
      amount: finalPrice,
      buyer_name: formData.recipientName.trim(),
      buyer_tel: formData.recipientPhone.trim(),
      buyer_email: user?.email || '',
      m_redirect_url: `${window.location.origin}/order/complete`,
    }, async (rsp) => {
      if (rsp.success) {
        // 결제 성공
        console.log('[포트원] 결제 성공:', rsp)
        await createOrder({
          imp_uid: rsp.imp_uid,
          merchant_uid: rsp.merchant_uid,
        })
      } else {
        // 결제 실패
        console.error('[포트원] 결제 실패:', rsp)
        setServerError(`결제에 실패했습니다: ${rsp.error_msg || '알 수 없는 오류'}`)
        setIsSubmitting(false)
      }
    })
  }

  if (userLoading || loading) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-container">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <Navbar />
      <div className="checkout-container">
        <button 
          className="back-button"
          onClick={() => navigate('/cart')}
        >
          ← 장바구니로 돌아가기
        </button>

        <h1 className="checkout-title">주문/결제</h1>

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item">장바구니</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-item active">주문/결제</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-item">주문완료</span>
        </div>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="checkout-content">
            {/* 배송 정보 섹션 */}
            <div className="checkout-section">
              <h2 className="section-title">배송 정보</h2>
              
              {serverError && (
                <div className="server-error-message">⚠️ {serverError}</div>
              )}

              <div className="form-group">
                <label htmlFor="recipientName">
                  수령인 이름 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="recipientName"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  className={errors.recipientName ? 'error' : ''}
                  placeholder="수령인 이름을 입력해주세요"
                />
                {errors.recipientName && (
                  <span className="error-message">{errors.recipientName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="recipientPhone">
                  수령인 전화번호 <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="recipientPhone"
                  name="recipientPhone"
                  value={formData.recipientPhone}
                  onChange={handleChange}
                  className={errors.recipientPhone ? 'error' : ''}
                  placeholder="010-1234-5678"
                />
                {errors.recipientPhone && (
                  <span className="error-message">{errors.recipientPhone}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="shippingAddress">
                  배송 주소 <span className="required">*</span>
                </label>
                <textarea
                  id="shippingAddress"
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleChange}
                  className={errors.shippingAddress ? 'error' : ''}
                  rows="3"
                  placeholder="배송 주소를 입력해주세요"
                />
                {errors.shippingAddress && (
                  <span className="error-message">{errors.shippingAddress}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="shippingMemo">배송 메모 (선택)</label>
                <select
                  id="shippingMemo"
                  name="shippingMemo"
                  value={formData.shippingMemo}
                  onChange={handleChange}
                >
                  <option value="">배송 메모를 선택해주세요</option>
                  <option value="문 앞에 놓아주세요">문 앞에 놓아주세요</option>
                  <option value="부재 시 문 앞에 놓아주세요">부재 시 문 앞에 놓아주세요</option>
                  <option value="직접 받겠습니다">직접 받겠습니다</option>
                  <option value="배송 전 연락 바랍니다">배송 전 연락 바랍니다</option>
                </select>
              </div>
            </div>

            {/* 주문 상품 섹션 */}
            <div className="checkout-section">
              <h2 className="section-title">주문 상품</h2>
              <div className="order-items-list">
                {cartItems.map((item) => (
                  <div key={item._id} className="order-item">
                    <div className="order-item-image">
                      {item.product?.image && item.product.image.startsWith('http') ? (
                        <img src={item.product.image} alt={item.product.name} />
                      ) : (
                        <div className="image-placeholder">📷</div>
                      )}
                    </div>
                    <div className="order-item-info">
                      <h3 className="order-item-name">{item.product?.name || '상품명 없음'}</h3>
                      <p className="order-item-category">{item.product?.category || ''}</p>
                      <p className="order-item-quantity">수량: {item.quantity}개</p>
                    </div>
                    <div className="order-item-price">
                      {item.product?.price
                        ? (item.product.price * item.quantity).toLocaleString('ko-KR') + ' 원'
                        : '가격 문의'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 결제 방법 섹션 */}
            <div className="checkout-section">
              <h2 className="section-title">결제 방법</h2>
              <div className="form-group">
                <label htmlFor="paymentMethod">결제 수단</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="CARD">신용카드</option>
                  <option value="BANK_TRANSFER">계좌이체</option>
                  <option value="VIRTUAL_ACCOUNT">가상계좌</option>
                  <option value="MOBILE">휴대폰 결제</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="orderMemo">주문 메모 (선택)</label>
                <textarea
                  id="orderMemo"
                  name="orderMemo"
                  value={formData.orderMemo}
                  onChange={handleChange}
                  rows="3"
                  placeholder="주문 시 요청사항을 입력해주세요"
                />
              </div>
            </div>
          </div>

          {/* 주문 요약 섹션 */}
          <div className="checkout-summary">
            <h2 className="section-title">최종 결제 금액</h2>
            <div className="summary-content">
              <div className="summary-row">
                <span className="summary-label">주문금액</span>
                <span className="summary-value">{totalPrice.toLocaleString('ko-KR')}원</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">배송비</span>
                <span className="summary-value">{shippingFee.toLocaleString('ko-KR')}원</span>
                {shippingFee > 0 && (
                  <span className="summary-note">(30,000원 이상 무료배송)</span>
                )}
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span className="summary-label">결제 금액</span>
                <span className="summary-value total">{finalPrice.toLocaleString('ko-KR')}원</span>
              </div>
              <button 
                type="submit" 
                className="submit-order-button"
                disabled={isSubmitting || cartItems.length === 0}
              >
                {isSubmitting ? '주문 처리 중...' : '주문하기'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Checkout