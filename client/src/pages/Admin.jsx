import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import Navbar from '../components/Navbar'
import './Admin.css'

function Admin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading } = useUser()
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    averagePrice: 0,
    categories: 0
  })

  // Admin 권한 체크
  useEffect(() => {
    if (!loading && (!user || user.userType !== 'ADMIN')) {
      navigate('/')
    }
  }, [loading, user, navigate])

  // 상품 목록 가져오기
  useEffect(() => {
    if (user && user.userType === 'ADMIN') {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await axios.get(`${API_BASE_URL}/api/products`)
      if (response.data.success) {
        const productList = response.data.data || []
        setProducts(productList)
        
        // 통계 계산
        const total = productList.length
        const categories = new Set(productList.map(p => p.category)).size
        const prices = productList.filter(p => p.price && p.price > 0).map(p => p.price)
        const averagePrice = prices.length > 0 
          ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
          : 0
        setStats({
          totalProducts: total,
          totalStock: 0, // Product 스키마에 재고 필드가 없음
          averagePrice,
          categories
        })
      }
    } catch (error) {
      console.error('상품 목록 조회 오류:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('정말 이 상품을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/products/${productId}`)
      if (response.data.success) {
        fetchProducts() // 목록 새로고침
      }
    } catch (error) {
      console.error('상품 삭제 오류:', error)
      alert('상품 삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading || !user || user.userType !== 'ADMIN') {
    return null
  }

  return (
    <div className="admin">
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            ← 쇼핑몰로 돌아가기
          </button>
          
          <div className="admin-title-section">
            <h1 className="admin-title">
              <span className="admin-icon">📦</span>
              {activeTab === 'products' ? '상품 관리' : '주문 관리'}
            </h1>
            {activeTab === 'products' && (
              <button 
                className="add-product-button"
                onClick={() => navigate('/admin/products/new')}
              >
                + 상품 등록
              </button>
            )}
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            상품 관리
          </button>
          <button
            className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => navigate('/admin/orders')}
          >
            주문 관리
          </button>
        </div>

        {/* 상품 관리 탭 */}
        {activeTab === 'products' && (
          <>
            {/* 통계 카드 */}
            <div className="stats-section">
              <div className="stat-card">
                <div className="stat-label">전체 상품</div>
                <div className="stat-value">{stats.totalProducts}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">총 재고</div>
                <div className="stat-value">{stats.totalStock}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">평균 가격</div>
                <div className="stat-value">
                  {stats.averagePrice > 0 
                    ? stats.averagePrice.toLocaleString('ko-KR') + ' 원'
                    : '-'
                  }
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">카테고리</div>
                <div className="stat-value">{stats.categories}</div>
              </div>
            </div>

            {/* 상품 목록 */}
            <div className="products-section">
              <h2 className="section-title">상품 목록</h2>
              {loadingProducts ? (
                <div className="loading">로딩 중...</div>
              ) : products.length === 0 ? (
                <div className="empty-state">등록된 상품이 없습니다.</div>
              ) : (
                <div className="products-table-wrapper">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>순위</th>
                        <th>이미지</th>
                        <th>상품명</th>
                        <th>카테고리</th>
                        <th>가격</th>
                        <th>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => (
                        <tr key={product._id}>
                          <td className="rank">{String(index + 1).padStart(2, '0')}</td>
                          <td className="image-cell">
                            <img 
                              src={product.image || '📷'} 
                              alt={product.name}
                              className="product-image"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'block'
                              }}
                            />
                            <span className="product-image-placeholder" style={{ display: 'none' }}>📷</span>
                          </td>
                          <td className="name-cell">{product.name}</td>
                          <td className="category-cell">{product.category}</td>
                          <td className="price-cell">
                            {product.price && product.price > 0
                              ? product.price.toLocaleString('ko-KR') + ' 원'
                              : '-'
                            }
                          </td>
                          <td className="actions-cell">
                            <button 
                              className="edit-button"
                              onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                              title="수정"
                            >
                              ✏️
                            </button>
                            <button 
                              className="delete-button"
                              onClick={() => handleDelete(product._id)}
                              title="삭제"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default Admin
