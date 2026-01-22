import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import Navbar from '../components/Navbar'
import './Admin.css'

function Admin() {
  const navigate = useNavigate()
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
  
  // 회원 관리 상태
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [userStats, setUserStats] = useState({
    total: 0,
    customers: 0,
    admins: 0
  })
  const [userSearch, setUserSearch] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Admin 권한 체크
  useEffect(() => {
    if (!loading && (!user || user.userType !== 'ADMIN')) {
      navigate('/')
    }
  }, [loading, user, navigate])

  // 상품 목록 가져오기
  useEffect(() => {
    if (user && user.userType === 'ADMIN') {
      if (activeTab === 'products') {
        fetchProducts()
      } else if (activeTab === 'users') {
        fetchUsers()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab])
  
  // 회원 목록 가져오기 (검색/필터 변경 시)
  useEffect(() => {
    if (user && user.userType === 'ADMIN' && activeTab === 'users') {
      fetchUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch, userTypeFilter, currentPage, activeTab])

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
  
  // 전체 회원 통계 가져오기
  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token')
      // 전체 통계를 위해 필터 없이 전체 데이터 가져오기
      const [allResponse, customerResponse, adminResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users?limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/users?userType=CUSTOMER&limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/users?userType=ADMIN&limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      
      setUserStats({
        total: allResponse.data.pagination?.total || 0,
        customers: customerResponse.data.pagination?.total || 0,
        admins: adminResponse.data.pagination?.total || 0
      })
    } catch (error) {
      console.error('회원 통계 조회 오류:', error)
    }
  }
  
  // 회원 목록 가져오기
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })
      
      if (userSearch) {
        params.append('search', userSearch)
      }
      if (userTypeFilter) {
        params.append('userType', userTypeFilter)
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.data.success) {
        const userList = response.data.data || []
        setUsers(userList)
        setTotalPages(response.data.pagination?.totalPages || 1)
      }
      
      // 전체 통계는 별도로 가져오기 (필터 적용 전)
      if (!userSearch && !userTypeFilter) {
        fetchUserStats()
      }
    } catch (error) {
      console.error('회원 목록 조회 오류:', error)
      alert('회원 목록을 불러올 수 없습니다.')
    } finally {
      setLoadingUsers(false)
    }
  }
  
  // 회원 사용자 타입 변경
  const handleUserTypeChange = async (userId, newUserType) => {
    if (!window.confirm(`회원의 권한을 "${newUserType === 'ADMIN' ? '관리자' : '고객'}"로 변경하시겠습니까?`)) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(
        `${API_BASE_URL}/api/users/${userId}`,
        { userType: newUserType },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      )
      
      if (response.data.success) {
        alert('회원 권한이 변경되었습니다.')
        fetchUsers() // 목록 새로고침
      }
    } catch (error) {
      console.error('회원 권한 변경 오류:', error)
      alert('회원 권한 변경 중 오류가 발생했습니다.')
    }
  }
  
  // 회원 삭제
  const handleUserDelete = async (userId, userName) => {
    if (!window.confirm(`정말 "${userName}" 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`${API_BASE_URL}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.data.success) {
        alert('회원이 삭제되었습니다.')
        fetchUsers() // 목록 새로고침
      }
    } catch (error) {
      console.error('회원 삭제 오류:', error)
      alert('회원 삭제 중 오류가 발생했습니다.')
    }
  }
  
  // 검색어 초기화 및 페이지 리셋
  const handleSearchChange = (value) => {
    setUserSearch(value)
    setCurrentPage(1)
  }
  
  const handleFilterChange = (value) => {
    setUserTypeFilter(value)
    setCurrentPage(1)
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
              <span className="admin-icon">
                {activeTab === 'products' ? '📦' : activeTab === 'users' ? '👥' : '📋'}
              </span>
              {activeTab === 'products' ? '상품 관리' : activeTab === 'users' ? '회원 관리' : '주문 관리'}
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
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            회원 관리
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

        {/* 회원 관리 탭 */}
        {activeTab === 'users' && (
          <>
            {/* 통계 카드 */}
            <div className="stats-section">
              <div className="stat-card">
                <div className="stat-label">전체 회원</div>
                <div className="stat-value">{userStats.total}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">고객</div>
                <div className="stat-value">{userStats.customers}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">관리자</div>
                <div className="stat-value">{userStats.admins}</div>
              </div>
            </div>

            {/* 검색 및 필터 */}
            <div className="filter-section" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <input
                    type="text"
                    placeholder="이름 또는 이메일로 검색..."
                    value={userSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
                <div>
                  <select
                    value={userTypeFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">전체 회원</option>
                    <option value="CUSTOMER">고객</option>
                    <option value="ADMIN">관리자</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 회원 목록 */}
            <div className="products-section">
              <h2 className="section-title">회원 목록</h2>
              {loadingUsers ? (
                <div className="loading">로딩 중...</div>
              ) : users.length === 0 ? (
                <div className="empty-state">회원이 없습니다.</div>
              ) : (
                <>
                  <div className="products-table-wrapper">
                    <table className="products-table">
                      <thead>
                        <tr>
                          <th>이름</th>
                          <th>이메일</th>
                          <th>권한</th>
                          <th>주소</th>
                          <th>전화번호</th>
                          <th>가입일</th>
                          <th>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((userItem) => (
                          <tr key={userItem._id}>
                            <td className="name-cell">{userItem.name || '-'}</td>
                            <td className="category-cell">{userItem.email || '-'}</td>
                            <td>
                              <select
                                value={userItem.userType || 'CUSTOMER'}
                                onChange={(e) => handleUserTypeChange(userItem._id, e.target.value)}
                                style={{
                                  padding: '0.5rem',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: '4px',
                                  fontSize: '0.9rem',
                                  cursor: 'pointer',
                                  backgroundColor: userItem.userType === 'ADMIN' ? '#fff3cd' : '#fff'
                                }}
                              >
                                <option value="CUSTOMER">고객</option>
                                <option value="ADMIN">관리자</option>
                              </select>
                            </td>
                            <td className="category-cell" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {userItem.address || '-'}
                            </td>
                            <td className="category-cell">{userItem.phone || '-'}</td>
                            <td className="category-cell">
                              {userItem.createdAt 
                                ? new Date(userItem.createdAt).toLocaleDateString('ko-KR')
                                : '-'
                              }
                            </td>
                            <td className="actions-cell">
                              <button 
                                className="delete-button"
                                onClick={() => handleUserDelete(userItem._id, userItem.name)}
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
                  
                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: '0.5rem', 
                      marginTop: '1.5rem',
                      alignItems: 'center'
                    }}>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          backgroundColor: currentPage === 1 ? '#f5f5f5' : 'white',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          color: currentPage === 1 ? '#999' : '#333'
                        }}
                      >
                        이전
                      </button>
                      <span style={{ padding: '0 1rem' }}>
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          backgroundColor: currentPage === totalPages ? '#f5f5f5' : 'white',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          color: currentPage === totalPages ? '#999' : '#333'
                        }}
                      >
                        다음
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default Admin
