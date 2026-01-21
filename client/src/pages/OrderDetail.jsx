import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import Navbar from '../components/Navbar'
import './OrderDetail.css'

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: userLoading } = useUser()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        navigate('/login')
      } else {
        fetchOrder()
      }
    }
  }, [id, user, userLoading, navigate])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success) {
        setOrder(response.data.data)
      } else {
        alert('주문 정보를 불러올 수 없습니다.')
        navigate('/')
      }
    } catch (error) {
      console.error('주문 조회 오류:', error)
      if (error.response?.status === 403) {
        alert('주문 조회 권한이 없습니다.')
      } else {
        alert('주문 정보를 불러올 수 없습니다.')
      }
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="order-detail-page">
        <Navbar />
        <div className="order-detail-container">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <Navbar />
        <div className="order-detail-container">
          <div className="empty-state">주문 정보를 찾을 수 없습니다.</div>
        </div>
      </div>
    )
  }

  const tabs = [
    { value: 'ALL', label: '전체' },
    { value: 'PENDING', label: '주문 대기' },
    { value: 'PAYMENT_COMPLETED', label: '결제 완료' },
    { value: 'PREPARING', label: '배송 준비' },
    { value: 'SHIPPING', label: '배송 중' },
    { value: 'DELIVERED', label: '배송 완료' },
    { value: 'CANCELLED', label: '주문 취소' },
  ]

  const getCurrentStatusTab = () => {
    return order?.status || 'ALL'
  }

  const handleTabClick = (status) => {
    if (status === 'ALL') {
      navigate('/orders')
    } else {
      navigate(`/orders?status=${status}`)
    }
  }

  return (
    <div className="order-detail-page">
      <Navbar />
      <div className="order-detail-container">
        <button 
          className="back-button"
          onClick={() => navigate('/orders')}
        >
          ← 주문 목록으로
        </button>

        <h1 className="page-title">주문 상세</h1>

        {/* 상태별 탭 */}
        <div className="order-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={`tab ${getCurrentStatusTab() === tab.value ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 주문 정보 섹션 */}
        <div className="order-info-section">
          <h2 className="section-title">주문 정보</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">주문번호</span>
              <span className="info-value order-number">{order.orderNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-label">주문일시</span>
              <span className="info-value">
                {new Date(order.createdAt).toLocaleString('ko-KR')}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">주문 상태</span>
              <span className={`info-value status-${order.status?.toLowerCase()}`}>
                {order.status === 'PENDING' && '주문 대기'}
                {order.status === 'PAYMENT_COMPLETED' && '결제 완료'}
                {order.status === 'PREPARING' && '배송 준비 중'}
                {order.status === 'SHIPPING' && '배송 중'}
                {order.status === 'DELIVERED' && '배송 완료'}
                {order.status === 'CANCELLED' && '주문 취소'}
                {!order.status && '주문 대기'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">최종 결제 금액</span>
              <span className="info-value price">
                {order.amount?.finalTotal?.toLocaleString('ko-KR') || '0'}원
              </span>
            </div>
          </div>
        </div>

        {/* 주문 상품 섹션 */}
        <div className="order-items-section">
          <h2 className="section-title">주문 상품</h2>
          <div className="items-list">
            {order.items?.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-image">
                  {item.product?.image && item.product.image.startsWith('http') ? (
                    <img src={item.product.image} alt={item.product.name} />
                  ) : (
                    <div className="image-placeholder">📷</div>
                  )}
                </div>
                <div className="item-info">
                  <h3 className="item-name">{item.product?.name || '상품명 없음'}</h3>
                  <p className="item-category">{item.product?.category || ''}</p>
                  <p className="item-quantity">수량: {item.quantity}개</p>
                  {item.product?.productNumber && (
                    <p className="item-number">상품번호: {item.product.productNumber}</p>
                  )}
                </div>
                <div className="item-price">
                  {item.product?.price
                    ? (item.product.price * item.quantity).toLocaleString('ko-KR') + ' 원'
                    : '가격 문의'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 결제 정보 섹션 */}
        <div className="payment-info-section">
          <h2 className="section-title">결제 정보</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">결제 수단</span>
              <span className="info-value">
                {order.payment?.method === 'CARD' && '신용카드'}
                {order.payment?.method === 'BANK_TRANSFER' && '계좌이체'}
                {order.payment?.method === 'VIRTUAL_ACCOUNT' && '가상계좌'}
                {order.payment?.method === 'MOBILE' && '휴대폰 결제'}
                {!order.payment?.method && '-'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">결제 상태</span>
              <span className={`info-value payment-status-${order.payment?.status?.toLowerCase()}`}>
                {order.payment?.status === 'PENDING' && '결제 대기'}
                {order.payment?.status === 'COMPLETED' && '결제 완료'}
                {order.payment?.status === 'FAILED' && '결제 실패'}
                {order.payment?.status === 'REFUNDED' && '환불 완료'}
                {!order.payment?.status && '-'}
              </span>
            </div>
            {order.payment?.imp_uid && (
              <div className="info-item full-width">
                <span className="info-label">결제 고유번호</span>
                <span className="info-value small-text">{order.payment.imp_uid}</span>
              </div>
            )}
            {order.payment?.merchant_uid && (
              <div className="info-item full-width">
                <span className="info-label">주문 고유번호</span>
                <span className="info-value small-text">{order.payment.merchant_uid}</span>
              </div>
            )}
            {order.payment?.paidAt && (
              <div className="info-item">
                <span className="info-label">결제 일시</span>
                <span className="info-value">
                  {new Date(order.payment.paidAt).toLocaleString('ko-KR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 결제 내역 섹션 */}
        <div className="amount-detail-section">
          <h2 className="section-title">결제 내역</h2>
          <div className="amount-detail">
            <div className="amount-row">
              <span className="amount-label">상품 금액</span>
              <span className="amount-value">
                {order.amount?.itemsTotal?.toLocaleString('ko-KR') || '0'}원
              </span>
            </div>
            <div className="amount-row">
              <span className="amount-label">배송비</span>
              <span className="amount-value">
                {order.amount?.shippingFee?.toLocaleString('ko-KR') || '0'}원
                {order.amount?.shippingFee === 0 && (
                  <span className="free-shipping">(무료배송)</span>
                )}
              </span>
            </div>
            {order.amount?.discount > 0 && (
              <div className="amount-row discount">
                <span className="amount-label">할인 금액</span>
                <span className="amount-value">
                  -{order.amount.discount.toLocaleString('ko-KR')}원
                </span>
              </div>
            )}
            <div className="amount-divider"></div>
            <div className="amount-row total">
              <span className="amount-label">최종 결제 금액</span>
              <span className="amount-value total">
                {order.amount?.finalTotal?.toLocaleString('ko-KR') || '0'}원
              </span>
            </div>
          </div>
        </div>

        {/* 배송 정보 섹션 */}
        <div className="shipping-info-section">
          <h2 className="section-title">배송 정보</h2>
          <div className="info-content">
            <p><strong>수령인:</strong> {order.shippingInfo?.recipientName}</p>
            <p><strong>전화번호:</strong> {order.shippingInfo?.recipientPhone}</p>
            <p><strong>배송 주소:</strong> {order.shippingInfo?.shippingAddress}</p>
            {order.shippingInfo?.shippingMemo && (
              <p><strong>배송 메모:</strong> {order.shippingInfo.shippingMemo}</p>
            )}
          </div>
        </div>

        {order.orderMemo && (
          <div className="order-memo-section">
            <h2 className="section-title">주문 메모</h2>
            <div className="memo-content">
              <p>{order.orderMemo}</p>
            </div>
          </div>
        )}

        {order.adminMemo && (
          <div className="admin-memo-section">
            <h2 className="section-title">관리자 메모</h2>
            <div className="memo-content">
              <p>{order.adminMemo}</p>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="action-buttons">
          <button className="btn-secondary" onClick={() => navigate('/')}>
            쇼핑 계속하기
          </button>
          {order.status === 'PENDING' && (
            <button 
              className="btn-danger" 
              onClick={async () => {
                if (window.confirm('정말 주문을 취소하시겠습니까?')) {
                  try {
                    const token = localStorage.getItem('token')
                    await axios.put(
                      `${API_BASE_URL}/api/orders/${id}`,
                      { status: 'CANCELLED' },
                      {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        }
                      }
                    )
                    alert('주문이 취소되었습니다.')
                    fetchOrder()
                  } catch (error) {
                    console.error('주문 취소 오류:', error)
                    alert('주문 취소 중 오류가 발생했습니다.')
                  }
                }
              }}
            >
              주문 취소
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
