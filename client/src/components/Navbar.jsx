import { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const { user, loading, logout } = useUser()
  const [cartCount, setCartCount] = useState(0)

  const fetchCartCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await axios.get(`${API_BASE_URL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success) {
        const items = response.data.data || []
        // 각 아이템의 수량을 합산
        const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        setCartCount(totalQuantity)
      }
    } catch (error) {
      console.error('장바구니 조회 오류:', error)
      setCartCount(0)
    }
  }, [])

  // 장바구니 아이템 수 가져오기
  useEffect(() => {
    if (user) {
      fetchCartCount()
    } else {
      setCartCount(0)
    }

    // 장바구니 업데이트 이벤트 리스너
    const handleCartUpdated = () => {
      if (user) {
        fetchCartCount()
      }
    }

    window.addEventListener('cartUpdated', handleCartUpdated)
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated)
    }
  }, [user, fetchCartCount])

  const handleLogout = useCallback(() => {
    logout()
    window.location.href = '/'
  }, [logout])

  const handleLoginClick = useCallback(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const handleAdminClick = useCallback(() => {
    if (user && user.userType === 'ADMIN') {
      navigate('/admin')
    }
  }, [user, navigate])

  const handleCartClick = useCallback(() => {
    if (user) {
      navigate('/cart')
    } else {
      navigate('/login')
    }
  }, [user, navigate])

  const handleLogoClick = useCallback(() => {
    navigate('/')
  }, [navigate])

  const handleUserNameClick = useCallback(() => {
    if (user) {
      navigate('/mypage')
    }
  }, [user, navigate])

  const handleCategoryClick = useCallback((category) => {
    navigate(`/category/${category}`)
  }, [navigate])

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <div className="navbar-left">
          <h1 className="navbar-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            📷 Camera Store
          </h1>
        </div>
        
        <nav className="navbar-nav">
          <button 
            className="nav-link-button"
            onClick={() => handleCategoryClick('카메라')}
          >
            카메라
          </button>
          <button 
            className="nav-link-button"
            onClick={() => handleCategoryClick('렌즈')}
          >
            렌즈
          </button>
          <a href="#service">고객서비스</a>
        </nav>

        <div className="navbar-utils">
          <button className="navbar-icon-button" aria-label="검색">
            <span>🔍</span>
          </button>
          <button 
            className={`navbar-icon-button user-icon-button ${user ? 'user-logged-in' : 'user-logged-out'}`}
            aria-label="사용자" 
            onClick={handleLoginClick}
          >
            <span>👤</span>
          </button>
          <button 
            className="navbar-icon-button cart-button" 
            aria-label="장바구니"
            onClick={handleCartClick}
          >
            <span>🛒</span>
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </button>
          
          {/* 로그인된 사용자 정보 */}
          {!loading && user && (
            <>
              <span 
                className="navbar-user-name" 
                onClick={handleUserNameClick}
                style={{ cursor: 'pointer' }}
              >
                {user.name}
              </span>
              <button className="navbar-logout-button" onClick={handleLogout}>
                로그아웃
              </button>
              {user.userType === 'ADMIN' && (
                <button 
                  className="navbar-admin-badge"
                  onClick={handleAdminClick}
                  aria-label="관리자 페이지"
                >
                  <span className="navbar-admin-icon">👑</span>
                  <span className="navbar-admin-text">관리자</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
