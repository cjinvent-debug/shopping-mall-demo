import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import Navbar from '../components/Navbar'
import './Cart.css'

function Cart() {
  const navigate = useNavigate()
  const { user, loading: userLoading } = useUser()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        navigate('/login')
      } else {
        fetchCart()
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
        setCartItems(response.data.data || [])
      }
    } catch (error) {
      console.error('장바구니 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) return

    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(
        `${API_BASE_URL}/api/cart/${cartId}`,
        { quantity: newQuantity },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        fetchCart()
        // Navbar의 장바구니 수 업데이트를 위해 이벤트 발생
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      }
    } catch (error) {
      console.error('수량 수정 오류:', error)
      alert('수량 수정 중 오류가 발생했습니다.')
    }
  }

  const removeItem = async (cartId) => {
    if (!window.confirm('장바구니에서 이 상품을 제거하시겠습니까?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(
        `${API_BASE_URL}/api/cart/${cartId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        fetchCart()
        // Navbar의 장바구니 수 업데이트를 위해 이벤트 발생
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      }
    } catch (error) {
      console.error('상품 삭제 오류:', error)
      alert('상품 삭제 중 오류가 발생했습니다.')
    }
  }

  // 총 계산
  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * (item.quantity || 0)
  }, 0)

  const shippingFee = totalPrice >= 30000 ? 0 : 3000
  const finalPrice = totalPrice + shippingFee

  if (userLoading || loading) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-container">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <Navbar />
      <div className="cart-container">
        <h1 className="cart-title">장바구니</h1>

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item active">장바구니</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-item">주문/결제</span>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-item">주문완료</span>
        </div>

        <div className="cart-content">
          {/* 주문상품 영역 */}
          <div className="cart-items-section">
            <h2 className="section-title">주문상품</h2>
            
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">💬</div>
                <p className="empty-cart-message">장바구니에 담긴 상품이 없습니다.</p>
                <button 
                  className="continue-shopping-button"
                  onClick={() => navigate('/')}
                >
                  쇼핑계속 하기
                </button>
              </div>
            ) : (
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item._id} className="cart-item">
                    <div className="cart-item-image">
                      {item.product?.image && item.product.image.startsWith('http') ? (
                        <img src={item.product.image} alt={item.product.name} />
                      ) : (
                        <div className="image-placeholder">📷</div>
                      )}
                    </div>
                    <div className="cart-item-info">
                      <h3 className="cart-item-name">{item.product?.name || '상품명 없음'}</h3>
                      <p className="cart-item-category">{item.product?.category || ''}</p>
                      <p className="cart-item-price">
                        {item.product?.price
                          ? (item.product.price * item.quantity).toLocaleString('ko-KR') + ' 원'
                          : '가격 문의'}
                      </p>
                    </div>
                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="quantity-btn"
                        >
                          -
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="remove-btn"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 안내사항 */}
            <div className="cart-info-sections">
              <div className="info-section">
                <h3 className="info-title">장바구니 보관 안내</h3>
                <ul className="info-list">
                  <li>장바구니에 담긴 상품은 로그인 시 보관되며, 판매중지된 상품은 자동으로 삭제됩니다.</li>
                  <li>장바구니에 담긴 상품의 보관기간은 60일입니다.</li>
                  <li>주문 시점에 따라 가격이나 혜택은 변경될 수 있습니다.</li>
                </ul>
              </div>

              <div className="info-section">
                <h3 className="info-title">주문취소 안내</h3>
                <ul className="info-list">
                  <li>주문하신 제품은 쇼핑정보 또는 고객센터를 통해 주문취소할 수 있습니다.</li>
                  <li>입금 대기중 ~ 상품 준비중 단계까지 주문취소가 가능하며, 배송이 시작되면 주문 취소가 불가능합니다.</li>
                </ul>
              </div>

              <div className="info-contact">
                <p>고객센터 1533-3355</p>
                <p>e스토어 &gt; 마이쇼핑 &gt; 주문/배송 조회 &gt; 주문 상세</p>
              </div>
            </div>
          </div>

          {/* 주문금액 영역 */}
          <div className="order-summary-section">
            <div className="order-summary">
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
              <div className="summary-row">
                <span className="summary-label">총 할인금액</span>
                <span className="summary-value">-0원</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">쿠폰할인</span>
                <span className="summary-value">-0원</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span className="summary-label">결제 금액</span>
                <span className="summary-value total">{finalPrice.toLocaleString('ko-KR')}원</span>
              </div>
              <button 
                className="order-button" 
                onClick={() => navigate('/checkout')}
                disabled={cartItems.length === 0}
              >
                주문하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
