import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import Navbar from '../components/Navbar'
import './OrderList.css'

function OrderList() {
  const navigate = useNavigate()
  const { user, loading: userLoading } = useUser()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ALL')

  // URL 쿼리 파라미터에서 상태 읽기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const status = urlParams.get('status')
    if (status) {
      setActiveTab(status)
    }
  }, [])

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        navigate('/login')
      } else {
        fetchOrders()
      }
    }
  }, [user, userLoading, navigate, activeTab])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const url = activeTab === 'ALL'
        ? `${API_BASE_URL}/api/orders`
        : `${API_BASE_URL}/api/orders?status=${activeTab}`
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success) {
        setOrders(response.data.data || [])
      } else {
        alert('주문 목록을 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('주문 목록 조회 오류:', error)
      alert('주문 목록을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
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

  const tabs = [
    { value: 'ALL', label: '전체' },
    { value: 'PENDING', label: '주문 대기' },
    { value: 'PAYMENT_COMPLETED', label: '결제 완료' },
    { value: 'PREPARING', label: '배송 준비' },
    { value: 'SHIPPING', label: '배송 중' },
    { value: 'DELIVERED', label: '배송 완료' },
    { value: 'CANCELLED', label: '주문 취소' },
  ]

  const handleTabChange = (tabValue) => {
    setActiveTab(tabValue)
    // URL 쿼리 파라미터 업데이트
    if (tabValue === 'ALL') {
      navigate('/orders', { replace: true })
    } else {
      navigate(`/orders?status=${tabValue}`, { replace: true })
    }
  }

  if (userLoading || loading) {
    return (
      <div className="order-list-page">
        <Navbar />
        <div className="order-list-container">
          <div className="loading">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="order-list-page">
      <Navbar />
      <div className="order-list-container">
        <h1 className="page-title">주문 내역</h1>

        {/* 상태별 탭 */}
        <div className="order-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={`tab ${activeTab === tab.value ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 주문 목록 */}
        {orders.length === 0 ? (
          <div className="empty-state">
            {activeTab === 'ALL' ? '주문 내역이 없습니다.' : `${tabs.find(t => t.value === activeTab)?.label} 주문이 없습니다.`}
          </div>
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
    </div>
  )
}

export default OrderList
