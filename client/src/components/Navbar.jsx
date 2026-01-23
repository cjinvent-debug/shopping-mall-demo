import { useCallback, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import axios from 'axios'
import API_BASE_URL from '../config/api'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const { user, loading, logout } = useUser()
  const [cartCount, setCartCount] = useState(0)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchCategory, setSearchCategory] = useState('전체')
  const searchInputRef = useRef(null)
  const searchTimeoutRef = useRef(null)

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

  const handleSearchClick = useCallback(() => {
    setIsSearchOpen(!isSearchOpen)
    if (!isSearchOpen) {
      // 검색창이 열릴 때 입력 필드에 포커스
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    } else {
      // 검색창이 닫힐 때 검색어 초기화
      setSearchQuery('')
      setSearchResults([])
    }
  }, [isSearchOpen])

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }, [])

  const handleSearchChange = useCallback((e) => {
    const query = e.target.value
    setSearchQuery(query)

    // 기존 타이머 클리어
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // 검색어가 없으면 결과 초기화
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    // 디바운싱: 300ms 후 검색 실행
    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const params = {
          search: query,
          limit: 10
        }
        // 카테고리 필터 적용
        if (searchCategory !== '전체') {
          params.category = searchCategory
        }
        const response = await axios.get(`${API_BASE_URL}/api/products`, { params })
        if (response.data.success) {
          setSearchResults(response.data.data || [])
        }
      } catch (error) {
        console.error('상품 검색 오류:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [searchCategory])

  const handleSearchResultClick = useCallback((productId) => {
    navigate(`/product/${productId}`)
    handleSearchClose()
  }, [navigate, handleSearchClose])

  // ESC 키로 검색창 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isSearchOpen) {
        handleSearchClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isSearchOpen, handleSearchClose])

  // 검색 카테고리 변경 시 검색 재실행
  useEffect(() => {
    if (searchQuery.trim() && isSearchOpen) {
      // 기존 타이머 클리어
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      // 디바운싱: 300ms 후 검색 실행
      setIsSearching(true)
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const params = {
            search: searchQuery,
            limit: 10
          }
          // 카테고리 필터 적용
          if (searchCategory !== '전체') {
            params.category = searchCategory
          }
          const response = await axios.get(`${API_BASE_URL}/api/products`, { params })
          if (response.data.success) {
            setSearchResults(response.data.data || [])
          }
        } catch (error) {
          console.error('상품 검색 오류:', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      }, 300)
    }
  }, [searchCategory, searchQuery, isSearchOpen])

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
          <button 
            className="navbar-icon-button search-button" 
            aria-label="검색"
            onClick={handleSearchClick}
          >
            <span>🔍</span>
          </button>
          <button 
            className={`navbar-icon-button user-icon-button ${user ? 'user-logged-in' : 'user-logged-out'}`}
            aria-label="사용자" 
            onClick={handleLoginClick}
          >
            <span className="user-icon">👤</span>
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
          
          {/* 로그인된 사용자 정보 - 항상 렌더링하되 visibility로 제어하여 높이 고정 */}
          <div className={`navbar-user-info ${(!loading && user) ? 'visible' : 'hidden'}`}>
            <span 
              className="navbar-user-name" 
              onClick={handleUserNameClick}
              style={{ cursor: 'pointer' }}
            >
              {user?.name || ''}
            </span>
            <button className="navbar-logout-button" onClick={handleLogout}>
              로그아웃
            </button>
            {user?.userType === 'ADMIN' && (
              <button 
                className="navbar-admin-badge"
                onClick={handleAdminClick}
                aria-label="관리자 페이지"
              >
                <span className="navbar-admin-icon">👑</span>
                <span className="navbar-admin-text">관리자</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 검색 영역 */}
      {isSearchOpen && (
        <div className="search-bar-container">
          <div className="search-bar-wrapper">
            <div className="search-input-wrapper">
              <span className="search-icon-left">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                className="search-bar-input"
                placeholder="검색"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            {isSearching && (
              <div className="search-loading-indicator">검색 중...</div>
            )}
            {searchQuery.trim() && !isSearching && searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map((product) => (
                  <div
                    key={product._id}
                    className="search-result-item"
                    onClick={() => handleSearchResultClick(product._id)}
                  >
                    <div className="search-result-image">
                      {product.image && product.image.startsWith('http') ? (
                        <img src={product.image} alt={product.name} />
                      ) : (
                        <span>{product.image || '📷'}</span>
                      )}
                    </div>
                    <div className="search-result-info">
                      <h3 className="search-result-name">{product.name}</h3>
                      <p className="search-result-number">{product.productNumber}</p>
                      <p className="search-result-price">
                        {product.price && product.price > 0
                          ? product.price.toLocaleString('ko-KR') + ' 원'
                          : '가격 문의'
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
              <div className="search-no-results">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
