import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import Navbar from '../components/Navbar'
import './AdminOrder.css'

function AdminOrder() {
  const navigate = useNavigate()
  const { user, loading } = useUser()
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paymentCompleted: 0,
    preparing: 0,
    shipping: 0,
    delivered: 0,
    cancelled: 0,
  })

  // Admin 권한 체크
  useEffect(() => {
    if (!loading && (!user || user.userType !== 'ADMIN')) {
      navigate('/')
    }
  }, [loading, user, navigate])

  // 주문 목록 가져오기
  useEffect(() => {
    if (user && user.userType === 'ADMIN') {
      fetchOrders()
    }
  }, [user, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true)
      const token = localStorage.getItem('token')
      const url = statusFilter === 'ALL' 
        ? `${API_BASE_URL}/api/orders`
        : `${API_BASE_URL}/api/orders?status=${statusFilter}`
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success) {
        const orderList = response.data.data || []
        setOrders(orderList)
        
        // 통계 계산
        const stats = {
          total: orderList.length,
          pending: orderList.filter(o => o.status === 'PENDING').length,
          paymentCompleted: orderList.filter(o => o.status === 'PAYMENT_COMPLETED').length,
          preparing: orderList.filter(o => o.status === 'PREPARING').length,
          shipping: orderList.filter(o => o.status === 'SHIPPING').length,
          delivered: orderList.filter(o => o.status === 'DELIVERED').length,
          cancelled: orderList.filter(o => o.status === 'CANCELLED').length,
        }
        setStats(stats)
      }
    } catch (error) {
      console.error('주문 목록 조회 오류:', error)
      alert('주문 목록을 불러올 수 없습니다.')
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`주문 상태를 "${getStatusLabel(newStatus)}"로 변경하시겠습니까?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(
        `${API_BASE_URL}/api/orders/${orderId}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      )

      if (response.data.success) {
        alert('주문 상태가 변경되었습니다.')
        fetchOrders() // 목록 새로고침
      }
    } catch (error) {
      console.error('주문 상태 변경 오류:', error)
      alert('주문 상태 변경 중 오류가 발생했습니다.')
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

  const getPaymentStatusLabel = (status) => {
    const labels = {
      'PENDING': '결제 대기',
      'COMPLETED': '결제 완료',
      'FAILED': '결제 실패',
      'REFUNDED': '환불 완료',
    }
    return labels[status] || status
  }

  if (loading || !user || user.userType !== 'ADMIN') {
    return null
  }

  return (
    <div className="admin-order">
      <Navbar />
      <div className="admin-order-container">
        <button 
          className="back-button"
          onClick={() => navigate('/admin')}
        >
          ← 상품 관리로 돌아가기
        </button>

        <div className="admin-order-content">
          <div className="admin-header">
            <h1 className="admin-title">
              <span className="admin-icon">📋</span>
              주문 관리
            </h1>
          </div>

          {/* 탭 메뉴 */}
          <div className="admin-tabs">
            <button
              className="tab-button"
              onClick={() => navigate('/admin')}
            >
              상품 관리
            </button>
            <button
              className="tab-button active"
            >
              주문 관리
            </button>
          </div>

          {/* 통계 섹션 */}
          <div className="order-stats">
            <div className="stat-card">
              <div className="stat-label">전체 주문</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">주문 대기</div>
              <div className="stat-value status-pending">{stats.pending}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">결제 완료</div>
              <div className="stat-value status-payment-completed">{stats.paymentCompleted}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">배송 준비</div>
              <div className="stat-value status-preparing">{stats.preparing}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">배송 중</div>
              <div className="stat-value status-shipping">{stats.shipping}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">배송 완료</div>
              <div className="stat-value status-delivered">{stats.delivered}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">주문 취소</div>
              <div className="stat-value status-cancelled">{stats.cancelled}</div>
            </div>
          </div>

          {/* 필터 섹션 */}
          <div className="filter-section">
            <label htmlFor="status-filter">주문 상태 필터:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="ALL">전체</option>
              <option value="PENDING">주문 대기</option>
              <option value="PAYMENT_COMPLETED">결제 완료</option>
              <option value="PREPARING">배송 준비 중</option>
              <option value="SHIPPING">배송 중</option>
              <option value="DELIVERED">배송 완료</option>
              <option value="CANCELLED">주문 취소</option>
            </select>
          </div>

          {/* 주문 목록 */}
          <div className="orders-section">
            {loadingOrders ? (
              <div className="loading">주문 목록을 불러오는 중...</div>
            ) : orders.length === 0 ? (
              <div className="empty-state">주문이 없습니다.</div>
            ) : (
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>주문번호</th>
                      <th>주문일시</th>
                      <th>주문자</th>
                      <th>상품</th>
                      <th>결제금액</th>
                      <th>주문상태</th>
                      <th>결제상태</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td className="order-number">{order.orderNumber}</td>
                        <td className="order-date">
                          {new Date(order.createdAt).toLocaleString('ko-KR')}
                        </td>
                        <td className="order-user">
                          <div>{order.user?.name || '-'}</div>
                          <div className="user-email">{order.user?.email || '-'}</div>
                        </td>
                        <td className="order-items">
                          <div className="items-preview">
                            {order.items?.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="item-preview">
                                {item.product?.name || '상품명 없음'} × {item.quantity}
                              </div>
                            ))}
                            {order.items?.length > 2 && (
                              <div className="more-items">외 {order.items.length - 2}개</div>
                            )}
                          </div>
                        </td>
                        <td className="order-amount">
                          {order.amount?.finalTotal?.toLocaleString('ko-KR') || '0'}원
                        </td>
                        <td className="order-status">
                          <span className={`status-badge ${getStatusClass(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="payment-status">
                          <span className={`payment-badge payment-${order.payment?.status?.toLowerCase()}`}>
                            {getPaymentStatusLabel(order.payment?.status)}
                          </span>
                        </td>
                        <td className="order-actions">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className="status-select"
                          >
                            <option value="PENDING">주문 대기</option>
                            <option value="PAYMENT_COMPLETED">결제 완료</option>
                            <option value="PREPARING">배송 준비 중</option>
                            <option value="SHIPPING">배송 중</option>
                            <option value="DELIVERED">배송 완료</option>
                            <option value="CANCELLED">주문 취소</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminOrder
